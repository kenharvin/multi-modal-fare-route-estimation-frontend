import axios from 'axios';
import { Platform } from 'react-native';
// @ts-ignore: expo-constants available in Expo env
import Constants from 'expo-constants';
import {
  Location,
  PublicTransportPreference,
  Route,
  Vehicle,
  DrivingPreferences,
  Stopover,
  PrivateVehicleRoute,
  ApiResponse,
  TransportType
} from '@/types';

const resolveApiBaseUrl = (): string => {
  let base = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:8000';
  // If running on device/emulator and base points to localhost, try to infer LAN IP
  if (Platform.OS !== 'web' && /localhost|127\.0\.0\.1/i.test(base)) {
    try {
      // hostUri looks like 192.168.x.x:19000
      const hostUri: string | undefined = (Constants?.expoConfig as any)?.hostUri || (Constants as any)?.manifest2?.extra?.expoGo?.developer?.host;
      if (hostUri && hostUri.includes(':')) {
        const host = hostUri.split(':')[0];
        if (/^\d+\.\d+\.\d+\.\d+$/.test(host)) {
          base = `http://${host}:8000`;
        }
      }
    } catch {}
    // Android emulator special-case
    if (Platform.OS === 'android' && /localhost|127\.0\.0\.1/i.test(base)) {
      base = 'http://10.0.2.2:8000';
    }
  }
  return base;
};

const API_BASE_URL = resolveApiBaseUrl();
const ROUTE_TIMEOUT_MS = Number(process.env.EXPO_PUBLIC_ROUTE_TIMEOUT_MS || 180000); // 3 minutes default
// Default to compact route summaries for fast UX; request full geometry only when needed.
const COMPACT_ROUTES = String(process.env.EXPO_PUBLIC_COMPACT_ROUTES || '1').trim() === '1';
const ESTIMATED_BUDGET = Number(process.env.EXPO_PUBLIC_ESTIMATED_BUDGET || 1000); // higher default to avoid over-filtering long trips

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: ROUTE_TIMEOUT_MS,
  headers: {
    'Content-Type': 'application/json'
  }
});

const formatAxiosError = (err: any): string => {
  try {
    const isAxios = !!err?.isAxiosError;
    const status = err?.response?.status;
    const detail = err?.response?.data?.detail || err?.response?.data?.error || err?.response?.data?.message;
    const code = err?.code;
    const msg = err?.message;
    const url = err?.config?.url;
    const baseURL = err?.config?.baseURL;

    const parts: string[] = [];
    if (isAxios) parts.push('AxiosError');
    if (status) parts.push(`HTTP ${status}`);
    if (code) parts.push(String(code));
    if (msg) parts.push(String(msg));
    if (detail) parts.push(`detail=${String(detail)}`);
    if (baseURL || url) parts.push(`at ${(baseURL || API_BASE_URL) + (url || '')}`);
    return parts.join(' | ') || String(err);
  } catch {
    return String(err);
  }
};
/**
 * Simple backend health check to detect network reachability
 */
export const pingBackend = async (): Promise<boolean> => {
  try {
    const res = await apiClient.get('/system/health');
    return !!res.data;
  } catch {
    return false;
  }
};

/**
 * Get an OSM-following preview polyline between two points
 * Returns Coordinates[] converted from GeoJSON [lon,lat]
 */
export const getPreviewPolyline = async (
  origin: { latitude: number; longitude: number },
  destination: { latitude: number; longitude: number }
): Promise<{ coords: { latitude: number; longitude: number }[]; source: string; distance_m?: number; }> => {
  const res = await apiClient.post('/system/osm-route', {
    origin: { lat: origin.latitude, lon: origin.longitude },
    destination: { lat: destination.latitude, lon: destination.longitude }
  });
  const data = res.data;
  const coords = Array.isArray(data?.coordinates)
    ? data.coordinates.map((c: number[]) => ({ latitude: c[1], longitude: c[0] }))
    : [];
  return { coords, source: data?.source || 'direct', distance_m: data?.distance_m };
};

// Add request interceptor for logging
apiClient.interceptors.request.use(
  (config) => {
    console.log('API Request:', config.method?.toUpperCase(), config.url);
    console.log('Base URL:', API_BASE_URL);
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      config: {
        url: error.config?.url,
        baseURL: error.config?.baseURL,
        method: error.config?.method
      }
    });
    return Promise.reject(error);
  }
);

/**
 * Fetch available public transport routes from FastAPI backend
 */
export const fetchRoutes = async (
  origin: Location,
  destination: Location,
  preference: PublicTransportPreference,
  options?: { budget?: number; maxTransfers?: number; preferredModes?: string[]; compact?: boolean }
): Promise<Route[]> => {
  const maxAttempts = 2; // initial try + 1 retry on transient errors
  let lastError: any = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
    // Map preference enum to backend preference_type
    const preferenceMap: Record<PublicTransportPreference, string> = {
      [PublicTransportPreference.BALANCED]: 'balanced',
      [PublicTransportPreference.LOWEST_FARE]: 'lowest_fare',
      [PublicTransportPreference.SHORTEST_TIME]: 'shortest_time',
      [PublicTransportPreference.FEWEST_TRANSFERS]: 'fewest_transfers'
    };

    console.log('[API] Fetching routes from backend...');
    console.log('[API] Origin:', origin);
    console.log('[API] Destination:', destination);

    const useCompact = typeof options?.compact === 'boolean' ? options.compact : COMPACT_ROUTES;
    const response = await apiClient.post(`/public-transport/plan?compact=${useCompact ? 1 : 0}&gtfs_overlay=0`, {
      origin: {
        lat: origin.coordinates.latitude,
        lon: origin.coordinates.longitude,
        name: origin.name
      },
      destination: {
        lat: destination.coordinates.latitude,
        lon: destination.coordinates.longitude,
        name: destination.name
      },
      preferences: {
        preference_type: preferenceMap[preference] || 'balanced',
        estimated_budget: options?.budget ?? ESTIMATED_BUDGET,
        preferred_modes: options?.preferredModes ?? ['walk', 'jeepney', 'bus', 'lrt', 'mrt', 'pnr'],
        max_transfers: options?.maxTransfers
      }
    }, { timeout: ROUTE_TIMEOUT_MS });

    console.log('[API] Backend response:', response.data);

    // Convert backend response to frontend Route[] format (Top 3 by fuzzy score)
    if (response.data) {
      const base = response.data;
      const results: Route[] = [];

      // Prefer `route`, but also handle `recommended_route` (backend compatibility)
      const routePayload = base.route || base.recommended_route;
      const hasPrimaryRoute = Array.isArray(routePayload) ? routePayload.length > 0 : !!routePayload;
      if (hasPrimaryRoute) {
        const converted = convertBackendRouteToFrontend({
          ...base,
          route: routePayload,
          rank: 1
        });
        results.push(converted);
      }

      if (Array.isArray(base.alternatives) && base.alternatives.length > 0) {
        for (const alt of base.alternatives.slice(0, 2)) {
          const altRoute = alt?.route;
          if (Array.isArray(altRoute) && altRoute.length === 0) {
            continue;
          }
          // Alternatives are summarized objects: {rank,total_fare,total_travel_time,total_transfers,fuzzy_score,route}
          const converted = convertBackendRouteToFrontend({
            ...base,
            ...alt,
            total_fare: alt.total_fare,
            total_travel_time: alt.total_travel_time,
            total_transfers: alt.total_transfers,
            fuzzy_score: alt.fuzzy_score,
            route: alt.route || [],
            // In compact mode, the backend intentionally returns no map_geojson.
            map_geojson: base.map_geojson
          });
          results.push(converted);
        }
      }

      if (results.length > 0) {
        console.log('[API] Converted routes:', results.length);
        return results;
      }

      // If backend returned a meaningful message, propagate it
      if (typeof response.data.message === 'string' && response.data.message.length > 0) {
        throw new Error(response.data.message);
      }
    }

    throw new Error('Failed to fetch routes');
    } catch (error: any) {
      lastError = error;
      const code = error?.code || '';
      const isTimeout = code === 'ECONNABORTED' || /timeout/i.test(error?.message || '');
      const isTransient = code === 'ERR_NETWORK' || isTimeout;
      if (isTimeout) {
        console.warn(`[API] Route request timed out after ${ROUTE_TIMEOUT_MS}ms (attempt ${attempt}/${maxAttempts}).`);
      } else {
        // Prefer backend error message if available
        const backendMsg = error?.response?.data?.message || error?.response?.data?.error;
        const msg = backendMsg || error?.message || error;
        console.warn(`[API] Route request failed (attempt ${attempt}/${maxAttempts}):`, msg);
      }
      // simple backoff before retrying
      if (attempt < maxAttempts && isTransient) {
        const delayMs = attempt * 4000;
        await new Promise(res => setTimeout(res, delayMs));
        continue;
      }
      break;
    }
  }

  console.error('[API] Error fetching routes (final):', lastError);
  throw lastError || new Error('Failed to fetch routes');
};

/**
 * Fetch/compute per-segment geometry for a selected route.
 * Uses backend /public-transport/geometry to avoid re-running route planning.
 */
export const fetchRouteGeometry = async (route: Route): Promise<Route> => {
  const toLatLon = (p: any): { latitude: number; longitude: number } | null => {
    if (!Array.isArray(p) || p.length < 2) return null;
    const a = Number(p[0]);
    const b = Number(p[1]);
    if (!Number.isFinite(a) || !Number.isFinite(b)) return null;

    // Backend *should* return GeoJSON order: [lon,lat].
    // Some sources (or future changes) may emit [lat,lon]. Detect using ranges.
    const aLooksLat = Math.abs(a) <= 90;
    const bLooksLat = Math.abs(b) <= 90;
    const bLooksLon = Math.abs(b) <= 180;

    // If [lat,lon] (common in some libs): a=lat, b=lon
    if (aLooksLat && bLooksLon && !bLooksLat) {
      return { latitude: a, longitude: b };
    }

    // Default: [lon,lat]
    return { latitude: b, longitude: a };
  };

  const isValidLatLon = (c: any): c is { latitude: number; longitude: number } => {
    const lat = c?.latitude;
    const lon = c?.longitude;
    return (
      typeof lat === 'number' &&
      typeof lon === 'number' &&
      Number.isFinite(lat) &&
      Number.isFinite(lon) &&
      lat >= -90 &&
      lat <= 90 &&
      lon >= -180 &&
      lon <= 180 &&
      !(lat === 0 && lon === 0)
    );
  };

  const legs = (route.segments || []).map((s) => {
    const mode = s.mode || (s.transportType as any);
    const isWalk = String(mode).toLowerCase() === 'walk' || String(s.transportType).toLowerCase() === 'walk';
    return {
      origin_node: s.originNode,
      destination_node: s.destinationNode,
      mode,
      // Exact planned node sequence (if available) lets backend rebuild the polyline
      // from the chosen path instead of OSRM guessing between endpoints.
      path_nodes: Array.isArray((s as any).pathNodes) ? (s as any).pathNodes : undefined,
      // Helps backend avoid reusing cached geometry from a different route that shares endpoints.
      // Only send for transit legs.
      route_id: isWalk ? undefined : (s.routeName || undefined)
    };
  });

  // On selection, prefer GTFS rail shapes when available for more accurate train polylines.
  const res = await apiClient.post('/public-transport/geometry?gtfs_overlay=1', { legs });
  const geoms: any[] = Array.isArray(res.data?.geometries) ? res.data.geometries : [];

  const updatedSegments = (route.segments || []).map((seg, idx) => {
    const lonlat = Array.isArray(geoms[idx]) ? geoms[idx] : null;
    const geometry = Array.isArray(lonlat)
      ? lonlat
          .map(toLatLon)
          .filter((c): c is { latitude: number; longitude: number } => !!c && isValidLatLon(c))
      : undefined;

    const mode0 = String(seg.mode || seg.transportType || '').toLowerCase();
    const isWalk = mode0 === 'walk' || mode0 === 'walking' || mode0 === 'foot' || mode0 === 'pedestrian';
    const hasExistingRichGeom = Array.isArray(seg.geometry) && seg.geometry.length >= 4;
    const isEndpointOnlyGeom = Array.isArray(geometry) && geometry.length <= 2;
    const shouldKeepExisting = !isWalk && hasExistingRichGeom && isEndpointOnlyGeom;

    return {
      ...seg,
      geometry: shouldKeepExisting ? seg.geometry : (geometry && geometry.length >= 2 ? geometry : seg.geometry)
    };
  });

  return { ...route, segments: updatedSegments };
};

/**
 * Calculate private vehicle route and cost
 */
export const calculatePrivateVehicleRoute = async (
  origin: Location,
  destination: Location,
  vehicle: Vehicle,
  fuelPrice: number,
  stopovers: Stopover[],
  preferences: DrivingPreferences
): Promise<PrivateVehicleRoute> => {
  try {
    // Backend currently returns distance/time + geometry; compute fuel metrics client-side.

    const safeEfficiency = vehicle?.fuelEfficiency && vehicle.fuelEfficiency > 0 ? vehicle.fuelEfficiency : 1;

    const buildPayload = (o: Location, d: Location, stopoverLocs?: Location[]) => {
      const stopoverPayload = (stopoverLocs || [])
        .filter((loc): loc is Location => !!loc)
        .map((loc) => {
          const lat = loc?.coordinates?.latitude;
          const lon = loc?.coordinates?.longitude;
          if (typeof lat === 'number' && typeof lon === 'number') {
            return { name: loc?.name, lat, lon };
          }
          return loc?.name;
        })
        .filter((x) => x !== undefined && x !== null && String(x).trim().length > 0);

      return {
        origin: {
          name: o?.name,
          lat: o?.coordinates?.latitude,
          lon: o?.coordinates?.longitude
        },
        destination: {
          name: d?.name,
          lat: d?.coordinates?.latitude,
          lon: d?.coordinates?.longitude
        },
        stopovers: stopoverPayload.length ? stopoverPayload : undefined
      };
    };

    const requestRoute = async (o: Location, d: Location, stopoverLocs?: Location[]) => {
      const payload = buildPayload(o, d, stopoverLocs);
      const response = await apiClient.post('/private-vehicle/route', payload);
      const data = response.data || {};

      const geometry = Array.isArray(data.geometry_coords)
        ? data.geometry_coords
            .filter((p: any) => Array.isArray(p) && p.length >= 2)
            .map((p: number[]) => ({ latitude: p[1], longitude: p[0] }))
            .filter(
              (c: any) => typeof c.latitude === 'number' && typeof c.longitude === 'number' && !(c.latitude === 0 && c.longitude === 0)
            )
        : undefined;

      const distanceKm = typeof data.distance_km === 'number' ? data.distance_km : Number(data.distance_km || 0);
      const estimatedTimeMin =
        typeof data.estimated_time_min === 'number' ? data.estimated_time_min : Number(data.estimated_time_min || 0);

      return {
        distanceKm,
        estimatedTimeMin,
        geometry: geometry && geometry.length >= 2 ? geometry : undefined
      };
    };

    const stitchGeometries = (geoms: ({ latitude: number; longitude: number }[] | undefined)[]) => {
      const stitched: { latitude: number; longitude: number }[] = [];
      for (const g of geoms) {
        if (!Array.isArray(g) || g.length < 2) continue;
        if (stitched.length === 0) {
          stitched.push(...g);
          continue;
        }
        const last = stitched[stitched.length - 1];
        const first = g[0];
        const same = last && first && last.latitude === first.latitude && last.longitude === first.longitude;
        stitched.push(...(same ? g.slice(1) : g));
      }
      return stitched.length >= 2 ? stitched : undefined;
    };

    const stopoverLocs = (stopovers || []).map((s) => s?.location).filter((x): x is Location => !!x);

    // If stopovers exist, compute each leg separately so the UI can show per-leg metrics and draw per-leg colored polylines.
    if (stopoverLocs.length > 0) {
      const points: Location[] = [origin, ...stopoverLocs, destination];
      const legs = [] as {
        id: string;
        origin: Location;
        destination: Location;
        distanceKm: number;
        estimatedTimeMin: number;
        geometry?: { latitude: number; longitude: number }[];
        fuelConsumptionL?: number;
        fuelCost?: number;
      }[];

      try {
        for (let i = 0; i < points.length - 1; i++) {
          const o = points[i];
          const d = points[i + 1];
          const r = await requestRoute(o, d);
          const dist = Number(r.distanceKm || 0);
          const timeMin = Number(r.estimatedTimeMin || 0);
          const fuelConsumptionL = dist / safeEfficiency;
          const fuelCost = fuelConsumptionL * (fuelPrice || 0);

          legs.push({
            id: `${Date.now()}-${i}`,
            origin: o,
            destination: d,
            distanceKm: dist,
            estimatedTimeMin: Math.round(timeMin),
            geometry: r.geometry,
            fuelConsumptionL,
            fuelCost
          });
        }

        const totalDistance = legs.reduce((acc, l) => acc + (l.distanceKm || 0), 0);
        const totalTimeMin = legs.reduce((acc, l) => acc + (l.estimatedTimeMin || 0), 0);
        const geometry = stitchGeometries(legs.map((l) => l.geometry));

        const fuelConsumption = totalDistance / safeEfficiency;
        const fuelCost = fuelConsumption * (fuelPrice || 0);

        return {
          id: String(Date.now()),
          origin,
          destination,
          stopovers,
          totalDistance,
          fuelConsumption,
          fuelCost,
          estimatedTime: Math.round(totalTimeMin),
          avoidTolls: !!preferences?.avoidTolls,
          geometry,
          legs,
          source: 'backend'
        };
      } catch (e) {
        // If any per-leg call fails, fall back to a single multi-stop call.
        // (This keeps the feature robust even if one leg can't be routed.)
      }
    }

    // No stopovers (or per-leg failed): single request.
    const single = await requestRoute(origin, destination, stopoverLocs.length ? stopoverLocs : undefined);
    const distanceKm = Number(single.distanceKm || 0);
    const estimatedTimeMin = Number(single.estimatedTimeMin || 0);
    const fuelConsumption = distanceKm / safeEfficiency;
    const fuelCost = fuelConsumption * (fuelPrice || 0);

    return {
      id: String(Date.now()),
      origin,
      destination,
      stopovers,
      totalDistance: distanceKm,
      fuelConsumption,
      fuelCost,
      estimatedTime: Math.round(estimatedTimeMin),
      avoidTolls: !!preferences?.avoidTolls,
      geometry: single.geometry,
      legs: [
        {
          id: `${Date.now()}-0`,
          origin,
          destination,
          distanceKm,
          estimatedTimeMin: Math.round(estimatedTimeMin),
          geometry: single.geometry,
          fuelConsumptionL: fuelConsumption,
          fuelCost
        }
      ],
      source: 'backend'
    };
  } catch (error) {
    const message = formatAxiosError(error);
    // Use warn/log to reduce noisy red LogBox entries while still surfacing useful info.
    console.warn('[PrivateVehicle] Route request failed; falling back to mock:', message);

    const mock = getMockPrivateVehicleRoute(origin, destination, vehicle, fuelPrice, stopovers);
    return {
      ...mock,
      source: 'mock',
      errorMessage: message,
      geometry: undefined
    };
  }
};

/**
 * Convert backend route response to frontend Route format
 */
const convertBackendRouteToFrontend = (backendResponse: any): Route => {
  console.log('[Converter] Processing backend response...');
  console.log('[Converter] map_geojson:', backendResponse.map_geojson);
  // Extract debug coordinates for pinned origin/destination and chosen stops
  const debugOriginPinned = backendResponse.debug_snapped_origin && typeof backendResponse.debug_snapped_origin.lat === 'number'
    ? { latitude: backendResponse.debug_snapped_origin.lat, longitude: backendResponse.debug_snapped_origin.lon }
    : undefined;
  const debugChosenOriginStop = backendResponse.debug_chosen_origin_stop && typeof backendResponse.debug_chosen_origin_stop.lat === 'number'
    ? { latitude: backendResponse.debug_chosen_origin_stop.lat, longitude: backendResponse.debug_chosen_origin_stop.lon }
    : undefined;
  const debugDestPinned = backendResponse.debug_snapped_destination && typeof backendResponse.debug_snapped_destination.lat === 'number'
    ? { latitude: backendResponse.debug_snapped_destination.lat, longitude: backendResponse.debug_snapped_destination.lon }
    : undefined;
  const debugChosenDestStop = backendResponse.debug_chosen_destination_stop && typeof backendResponse.debug_chosen_destination_stop.lat === 'number'
    ? { latitude: backendResponse.debug_chosen_destination_stop.lat, longitude: backendResponse.debug_chosen_destination_stop.lon }
    : undefined;
  
  // Extract geometry from map_geojson if available
  const geometryMap = new Map<number, any[]>();
  if (backendResponse.map_geojson?.features) {
    console.log('[Converter] Found', backendResponse.map_geojson.features.length, 'features in map_geojson');
    backendResponse.map_geojson.features.forEach((feature: any, idx: number) => {
      if (feature.geometry?.type === 'LineString' && feature.geometry?.coordinates) {
        console.log(`[Converter] Feature ${idx}: ${feature.geometry.coordinates.length} coordinates`);
        geometryMap.set(idx, feature.geometry.coordinates);
      }
    });
  } else {
    console.warn('[Converter] No map_geojson.features found in backend response');
  }

  const segments = backendResponse.route?.map((leg: any, index: number) => {
    // Get geometry coordinates for this leg
    // Prefer per-leg geometry from backend (already road-following)
    const coordsFromLeg = Array.isArray(leg.geometry_coords) ? leg.geometry_coords : [];
    const coords = coordsFromLeg.length > 0 ? coordsFromLeg : (geometryMap.get(index) || []);
    console.log(`[Converter] Leg ${index}: mode=${leg.mode}, coords=${coords.length}`);
    
    // Extract origin and destination coordinates from geometry if available
    let originCoords: { latitude: number; longitude: number } | undefined;
    let destCoords: { latitude: number; longitude: number } | undefined;
    
    if (coords.length > 0) {
      // coords are [lon, lat] in GeoJSON format
      originCoords = { latitude: coords[0][1], longitude: coords[0][0] };
      destCoords = { latitude: coords[coords.length - 1][1], longitude: coords[coords.length - 1][0] };
      console.log(`[Converter] Leg ${index}: origin=(${originCoords.latitude}, ${originCoords.longitude}), dest=(${destCoords.latitude}, ${destCoords.longitude})`);
    } else {
      console.warn(`[Converter] Leg ${index}: No geometry coordinates, computing fallback endpoints`);
      // Fallback endpoints for walk legs using backend debug fields
      const isWalk = (leg.mode === 'walk');
      const isOriginPinned = isWalk && leg.origin === 'Origin (Pinned)';
      const isDestPinned = isWalk && leg.destination === 'Destination (Pinned)';
      if (isOriginPinned && debugOriginPinned && debugChosenOriginStop) {
        originCoords = debugOriginPinned;
        destCoords = debugChosenOriginStop;
      } else if (isDestPinned && debugChosenDestStop && debugDestPinned) {
        originCoords = debugChosenDestStop;
        destCoords = debugDestPinned;
      }
    }

    // Convert geometry to Coordinates array (GeoJSON lon,lat -> RN lat,lon)
    let geometry = coords.map((coord: number[]) => ({
      latitude: coord[1],
      longitude: coord[0]
    }));
    // If no coords but we have fallback endpoints, use direct line
    if (geometry.length === 0 && originCoords && destCoords) {
      geometry = [originCoords, destCoords];
    }

    const transportType: TransportType = (
      leg.mode === 'walk' ? TransportType.WALK :
      (leg.mode === 'train' || leg.mode === 'lrt' || leg.mode === 'mrt' || leg.mode === 'pnr') ? TransportType.TRAIN :
      leg.mode === 'jeepney' ? TransportType.JEEPNEY :
      leg.mode === 'bus' ? TransportType.BUS : TransportType.UV_EXPRESS
    );

    return {
      id: `s${index + 1}`,
      transportType,
      routeName:
        transportType === TransportType.WALK
          ? ((leg.details || '').trim() || 'Walk')
          : (leg.route_id || leg.mode || 'Transit'),
      originNode: leg.origin_node,
      destinationNode: leg.destination_node,
      pathNodes: Array.isArray(leg.path_nodes) ? leg.path_nodes : undefined,
      mode: leg.mode,
      origin: {
        name: leg.origin,
        coordinates: originCoords || (geometry[0] ? geometry[0] : { latitude: 14.5995, longitude: 120.9842 })
      },
      destination: {
        name: leg.destination,
        coordinates: destCoords || (geometry[geometry.length - 1] ? geometry[geometry.length - 1] : { latitude: 14.5995, longitude: 120.9842 })
      },
      fare: leg.fare || 0,
      estimatedTime: leg.travel_time || 0,
      distance: leg.distance_km || 0,
      geometry: geometry.length > 0 ? geometry : undefined
    };
  }) || [];

  console.log('[Converter] Total segments:', segments.length);
  console.log('[Converter] Segments with geometry:', segments.filter((s: any) => s.geometry).length);

  return {
    id: (backendResponse?.rank ? `rank-${backendResponse.rank}` : Date.now().toString()),
    segments,
    totalFare: backendResponse.total_fare || 0,
    totalTime: backendResponse.total_travel_time || 0,
    totalDistance: segments.reduce((sum: number, seg: any) => sum + seg.distance, 0),
    totalTransfers: backendResponse.total_transfers || 0,
    fuzzyScore: typeof backendResponse.fuzzy_score === 'number' ? backendResponse.fuzzy_score : (Number(backendResponse.fuzzy_score) || 0)
  };
};

/**
 * Get nearest stop from coordinates (for map pin selection)
 */
export const getNearestStop = async (
  latitude: number,
  longitude: number
): Promise<Location> => {
  try {
    // Backend uses graph-based nearest stop finding
    // This is handled internally by the /public-transport/plan endpoint
    // For now, return a placeholder that the plan endpoint will resolve
    return {
      name: `Location at ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
      coordinates: { latitude, longitude }
    };
  } catch (error) {
    console.error('Error finding nearest stop:', error);
    throw error;
  }
};

/**
 * Search for stops by name (for autocomplete)
 */
export const searchStops = async (query: string): Promise<Location[]> => {
  try {
    const response = await apiClient.get(`/stops/search?q=${encodeURIComponent(query)}&limit=10`);
    
    if (response.data) {
      return response.data.map((stop: any) => ({
        name: stop.stop_name,
        coordinates: {
          latitude: stop.stop_lat,
          longitude: stop.stop_lon
        },
        address: stop.stop_name
      }));
    }

    return [];
  } catch (error) {
    console.error('Error searching stops:', error);
    return [];
  }
};

/**
 * Search POIs by name (for private vehicle autocomplete)
 */
export const searchPois = async (
  query: string,
  limit: number = 10,
  near?: { latitude: number; longitude: number } | null
): Promise<Location[]> => {
  try {
    const nearParams = near && typeof near.latitude === 'number' && typeof near.longitude === 'number'
      ? `&near_lat=${encodeURIComponent(String(near.latitude))}&near_lon=${encodeURIComponent(String(near.longitude))}`
      : '';

    const response = await apiClient.get(
      `/private-vehicle/poi/search?q=${encodeURIComponent(query)}&limit=${encodeURIComponent(String(limit))}${nearParams}`
    );

    const results = Array.isArray(response.data?.results) ? response.data.results : [];
    const mapped: Location[] = results
      .filter((p: any) => p && typeof p.lat === 'number' && typeof p.lon === 'number')
      .map((p: any) => ({
        name: String(p.title || p.name || query),
        coordinates: { latitude: Number(p.lat), longitude: Number(p.lon) },
        address: (() => {
          const subtitle = typeof p.subtitle === 'string' && p.subtitle.trim().length > 0
            ? p.subtitle.trim()
            : (p.category ? String(p.category) : '');

          if (typeof p.distance_m === 'number') {
            const dist = `${(Number(p.distance_m) / 1000).toFixed(1)} km`;
            return subtitle ? `${dist} • ${subtitle}` : dist;
          }

          return subtitle || `${Number(p.lat).toFixed(5)}, ${Number(p.lon).toFixed(5)}`;
        })()
      }));

    // Hide generic brand-only entries if we have richer branch-like titles.
    const q0 = String(query || '').trim().toLowerCase();
    const hasSpecific = mapped.some((m: Location) => m.name.toLowerCase() !== q0 && m.name.toLowerCase().includes(q0));
    if (hasSpecific) {
      return mapped.filter((m: Location) => m.name.trim().toLowerCase() !== q0);
    }
    return mapped;
  } catch (error) {
    console.error('Error searching POIs:', error);
    return [];
  }
};

/**
 * Save trip plan to user account
 */
export const saveTripPlan = async (tripPlan: any): Promise<boolean> => {
  try {
    const response = await apiClient.post<ApiResponse<any>>('/trips/save', {
      tripPlan
    });

    return response.data.success || false;
  } catch (error) {
    console.error('Error saving trip plan:', error);
    return false;
  }
};

// Mock data functions for development (private vehicle only)

const getMockPrivateVehicleRoute = (
  origin: Location,
  destination: Location,
  vehicle: Vehicle,
  fuelPrice: number,
  stopovers: Stopover[]
): PrivateVehicleRoute => {
  const points: Location[] = [origin, ...(stopovers || []).map((s) => s.location).filter(Boolean as any), destination];
  const safeEfficiency = vehicle?.fuelEfficiency && vehicle.fuelEfficiency > 0 ? vehicle.fuelEfficiency : 1;

  const haversineKm = (a: any, b: any) => {
    const R = 6371;
    const toRad = (x: number) => (x * Math.PI) / 180;
    const lat1 = a?.coordinates?.latitude;
    const lon1 = a?.coordinates?.longitude;
    const lat2 = b?.coordinates?.latitude;
    const lon2 = b?.coordinates?.longitude;
    if ([lat1, lon1, lat2, lon2].some((x) => typeof x !== 'number')) return 0;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const s1 = Math.sin(dLat / 2);
    const s2 = Math.sin(dLon / 2);
    const h = s1 * s1 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * s2 * s2;
    return 2 * R * Math.asin(Math.sqrt(h));
  };

  const legs = points.slice(0, -1).map((p, i) => {
    const o = points[i];
    const d = points[i + 1];
    const distanceKm = haversineKm(o, d);
    // Assume 30 kph for mock time
    const estimatedTimeMin = distanceKm > 0 ? Math.round((distanceKm / 30) * 60) : 0;
    const fuelConsumptionL = distanceKm / safeEfficiency;
    const fuelCost = fuelConsumptionL * (fuelPrice || 0);
    return {
      id: `mock-${i}`,
      origin: o,
      destination: d,
      distanceKm,
      estimatedTimeMin,
      geometry: [o.coordinates, d.coordinates],
      fuelConsumptionL,
      fuelCost
    };
  });

  const totalDistance = legs.reduce((acc, l) => acc + (l.distanceKm || 0), 0);
  const totalTimeMin = legs.reduce((acc, l) => acc + (l.estimatedTimeMin || 0), 0);
  const fuelConsumption = totalDistance / safeEfficiency;
  const fuelCost = fuelConsumption * (fuelPrice || 0);

  return {
    id: '1',
    origin,
    destination,
    stopovers,
    totalDistance,
    fuelConsumption,
    fuelCost,
    estimatedTime: totalTimeMin || 60,
    avoidTolls: false,
    legs,
    fuzzyScore: 0.92
  };
};

export default apiClient;
