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
const COMPACT_ROUTES = String(process.env.EXPO_PUBLIC_COMPACT_ROUTES || '0').trim() === '1';
const ESTIMATED_BUDGET = Number(process.env.EXPO_PUBLIC_ESTIMATED_BUDGET || 1000); // higher default to avoid over-filtering long trips

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: ROUTE_TIMEOUT_MS,
  headers: {
    'Content-Type': 'application/json'
  }
});
/**
 * Simple backend health check to detect network reachability
 */
export const pingBackend = async (): Promise<boolean> => {
  try {
    const res = await apiClient.get('/system/health');
    return !!res.data;
  } catch (e) {
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
  options?: { budget?: number; maxTransfers?: number; preferredModes?: string[] }
): Promise<Route[]> => {
  const maxAttempts = 2; // initial try + 1 retry on transient errors
  let lastError: any = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
    // Map preference enum to backend preference_type
    const preferenceMap: Record<PublicTransportPreference, string> = {
      [PublicTransportPreference.LOWEST_FARE]: 'lowest_fare',
      [PublicTransportPreference.SHORTEST_TIME]: 'shortest_time',
      [PublicTransportPreference.FEWEST_TRANSFERS]: 'fewest_transfers'
    };

    console.log('[API] Fetching routes from backend...');
    console.log('[API] Origin:', origin);
    console.log('[API] Destination:', destination);

    const response = await apiClient.post(`/public-transport/plan?compact=${COMPACT_ROUTES ? 1 : 0}`, {
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

    // Convert backend response to frontend Route format
    if (response.data) {
      // Prefer `route`, but also handle `recommended_route` (backend compatibility)
      const routePayload = response.data.route || response.data.recommended_route;
      if (routePayload) {
        const convertedRoute = convertBackendRouteToFrontend({
          ...response.data,
          route: routePayload
        });
        console.log('[API] Converted route:', convertedRoute);
        console.log('[API] Geometry check:', convertedRoute.segments.map(s => ({
          id: s.id,
          hasGeometry: !!s.geometry,
          geometryLength: s.geometry?.length || 0
        })));
        return [convertedRoute];
      }

      // If alternatives exist but primary route field is missing, select best alternative
      if (Array.isArray(response.data.alternatives) && response.data.alternatives.length > 0) {
        const bestAlt = response.data.alternatives[0];
        const convertedRoute = convertBackendRouteToFrontend({
          ...response.data,
          route: bestAlt.route || []
        });
        return [convertedRoute];
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
    const response = await apiClient.post<ApiResponse<PrivateVehicleRoute>>(
      '/routes/private',
      {
        origin,
        destination,
        vehicle,
        fuelPrice,
        stopovers,
        preferences
      }
    );

    if (response.data.success && response.data.data) {
      return response.data.data;
    }

    throw new Error(response.data.error || 'Failed to calculate route');
  } catch (error) {
    console.error('Error calculating route:', error);
    // Return mock data for development
    return getMockPrivateVehicleRoute(origin, destination, vehicle, fuelPrice, stopovers);
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
      routeName: leg.route_id || leg.mode || 'Transit',
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
    id: Date.now().toString(),
    segments,
    totalFare: backendResponse.total_fare || 0,
    totalTime: backendResponse.total_travel_time || 0,
    totalDistance: segments.reduce((sum: number, seg: any) => sum + seg.distance, 0),
    totalTransfers: backendResponse.total_transfers || 0,
    fuzzyScore: backendResponse.fuzzy_score || 0
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
  const totalDistance = 25.5;
  const fuelConsumption = totalDistance / vehicle.fuelEfficiency;
  const fuelCost = fuelConsumption * fuelPrice;

  return {
    id: '1',
    origin,
    destination,
    stopovers,
    totalDistance,
    fuelConsumption,
    fuelCost,
    estimatedTime: 60,
    avoidTolls: false,
    fuzzyScore: 0.92
  };
};

export default apiClient;
