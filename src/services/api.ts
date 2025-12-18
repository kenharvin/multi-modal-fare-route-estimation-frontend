import axios from 'axios';
import {
  Location,
  PublicTransportPreference,
  Route,
  Vehicle,
  DrivingPreferences,
  Stopover,
  PrivateVehicleRoute,
  ApiResponse
} from '@/types';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:8000';
const ROUTE_TIMEOUT_MS = Number(process.env.EXPO_PUBLIC_ROUTE_TIMEOUT_MS || 180000); // 3 minutes default
const USE_MOCK_ROUTES = String(process.env.EXPO_PUBLIC_USE_MOCK_ROUTES || 'false') === 'true';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: ROUTE_TIMEOUT_MS,
  headers: {
    'Content-Type': 'application/json'
  }
});

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
  preference: PublicTransportPreference
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

    const response = await apiClient.post('/public-transport/plan', {
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
        estimated_budget: 200.0,
        preferred_modes: ['walk', 'jeepney', 'bus', 'lrt', 'mrt', 'pnr']
      }
    }, { timeout: ROUTE_TIMEOUT_MS });

    console.log('[API] Backend response:', response.data);

    // Convert backend response to frontend Route format
    if (response.data && response.data.route) {
      const convertedRoute = convertBackendRouteToFrontend(response.data);
      console.log('[API] Converted route:', convertedRoute);
      console.log('[API] Geometry check:', convertedRoute.segments.map(s => ({
        id: s.id,
        hasGeometry: !!s.geometry,
        geometryLength: s.geometry?.length || 0
      })));
      return [convertedRoute];
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
        console.warn(`[API] Route request failed (attempt ${attempt}/${maxAttempts}):`, error?.message || error);
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
  if (USE_MOCK_ROUTES) {
    console.log('[API] Falling back to mock data (EXPO_PUBLIC_USE_MOCK_ROUTES=true)');
    return getMockRoutes(origin, destination);
  }
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
    let originCoords = { latitude: 0, longitude: 0 };
    let destCoords = { latitude: 0, longitude: 0 };
    
    if (coords.length > 0) {
      // coords are [lon, lat] in GeoJSON format
      originCoords = { latitude: coords[0][1], longitude: coords[0][0] };
      destCoords = { latitude: coords[coords.length - 1][1], longitude: coords[coords.length - 1][0] };
      console.log(`[Converter] Leg ${index}: origin=(${originCoords.latitude}, ${originCoords.longitude}), dest=(${destCoords.latitude}, ${destCoords.longitude})`);
    } else {
      console.warn(`[Converter] Leg ${index}: No geometry coordinates, will use straight line`);
    }

    // Convert geometry to Coordinates array (GeoJSON lon,lat -> RN lat,lon)
    const geometry = coords.map((coord: number[]) => ({
      latitude: coord[1],
      longitude: coord[0]
    }));

    return {
      id: `s${index + 1}`,
      transportType: leg.mode === 'walk' ? 'walk' : 
                    leg.mode === 'lrt' || leg.mode === 'mrt' || leg.mode === 'pnr' ? 'train' :
                    leg.mode === 'jeepney' ? 'jeepney' :
                    leg.mode === 'bus' ? 'bus' : 'uv_express',
      routeName: leg.route_id || leg.mode || 'Transit',
      origin: {
        name: leg.origin,
        coordinates: originCoords
      },
      destination: {
        name: leg.destination,
        coordinates: destCoords
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

// Mock data functions for development

const getMockRoutes = (origin: Location, destination: Location): Route[] => {
  return [
    {
      id: '1',
      segments: [
        {
          id: 's1',
          transportType: 'jeepney' as any,
          routeName: 'Route 01',
          origin,
          destination,
          fare: 13,
          estimatedTime: 45,
          distance: 8.5
        }
      ],
      totalFare: 13,
      totalTime: 45,
      totalDistance: 8.5,
      totalTransfers: 0,
      fuzzyScore: 0.95
    },
    {
      id: '2',
      segments: [
        {
          id: 's2',
          transportType: 'bus' as any,
          routeName: 'Bus 123',
          origin,
          destination: {
            name: 'Transfer Point',
            coordinates: { latitude: 14.6, longitude: 121.0 }
          },
          fare: 20,
          estimatedTime: 30,
          distance: 12
        },
        {
          id: 's3',
          transportType: 'train' as any,
          routeName: 'LRT Line 2',
          origin: {
            name: 'Transfer Point',
            coordinates: { latitude: 14.6, longitude: 121.0 }
          },
          destination,
          fare: 15,
          estimatedTime: 20,
          distance: 5
        }
      ],
      totalFare: 35,
      totalTime: 50,
      totalDistance: 17,
      totalTransfers: 1,
      fuzzyScore: 0.88
    }
  ];
};

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
