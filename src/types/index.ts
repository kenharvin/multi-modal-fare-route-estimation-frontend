// Coordinates for map locations
export interface Coordinates {
  latitude: number;
  longitude: number;
}

// Location with name and coordinates
export interface Location {
  name: string;
  coordinates: Coordinates;
  address?: string;
}

// Travel modes
export enum TravelMode {
  PUBLIC_TRANSPORT = 'public_transport',
  PRIVATE_VEHICLE = 'private_vehicle'
}

// Transport types for public transport
export enum TransportType {
  JEEPNEY = 'jeepney',
  BUS = 'bus',
  UV_EXPRESS = 'uv_express',
  TRAIN = 'train',
  WALK = 'walk'
}

// User preferences for public transport
export enum PublicTransportPreference {
  BALANCED = 'balanced',
  LOWEST_FARE = 'lowest_fare',
  SHORTEST_TIME = 'shortest_time',
  FEWEST_TRANSFERS = 'fewest_transfers'
}

// Route segment for public transport
export interface RouteSegment {
  id: string;
  transportType: TransportType;
  routeName: string;
  origin: Location;
  destination: Location;
  fare: number;
  estimatedTime: number; // in minutes
  distance: number; // in kilometers
  geometry?: Coordinates[]; // Actual path coordinates from backend
  // Backend graph node ids for on-demand geometry fetch
  originNode?: string;
  destinationNode?: string;
  mode?: string;
  /** Exact planned node sequence for this leg (from backend RouteLeg.path_nodes). */
  pathNodes?: (string | number)[];
}

// Complete route with multiple segments
export interface Route {
  id: string;
  segments: RouteSegment[];
  totalFare: number;
  totalTime: number;
  totalDistance: number;
  totalTransfers: number;
  fuzzyScore?: number;
}

// Trip plan with multiple destinations
export interface TripPlan {
  id: string;
  routes: Route[];
  totalFare: number;
  totalTime: number;
  totalDistance: number;
  destinations: Location[];
}

// Fuzzy logic parameters
export interface FuzzyScore {
  fareScore: number;
  timeScore: number;
  transferScore: number;
  totalScore: number;
}

// Vehicle information for private transport
export interface Vehicle {
  id?: string;
  make?: string;
  model?: string;
  category?: VehicleCategory;
  fuelEfficiency: number; // km per liter
}

export enum VehicleCategory {
  SEDAN = 'sedan',
  SUV = 'suv',
  HATCHBACK = 'hatchback',
  MOTORCYCLE = 'motorcycle',
  VAN = 'van'
}

// Stopover for private vehicle trips
export interface Stopover {
  id: string;
  location: Location;
  type: StopoverType;
  estimatedDuration?: number; // in minutes
}

export enum StopoverType {
  GAS = 'gas',
  FOOD = 'food',
  REST = 'rest',
  OTHER = 'other'
}

export interface PrivateVehicleLeg {
  id: string;
  origin: Location;
  destination: Location;
  distanceKm: number;
  estimatedTimeMin: number;
  /** Road-following polyline for this leg (from backend geometry_coords). */
  geometry?: Coordinates[];
  /** Optional turn-by-turn steps for this leg from backend. */
  directionSteps?: PrivateDirectionStep[];
  /** Client-computed fuel metrics for this leg. */
  fuelConsumptionL?: number;
  fuelCost?: number;
}

export interface PrivateDirectionStep {
  id: string;
  icon: string;
  instruction: string;
  stepType?: string;
  distanceText?: string;
  turnPoint?: Coordinates;
}

// Private vehicle route
export interface PrivateVehicleRoute {
  id: string;
  origin: Location;
  destination: Location;
  stopovers: Stopover[];
  totalDistance: number; // in kilometers
  fuelConsumption: number; // in liters
  fuelCost: number;
  estimatedTime: number; // in minutes
  /** Road-following polyline for map rendering (from backend geometry_coords). */
  geometry?: Coordinates[];
  /** Optional breakdown of the journey by legs (origin → stopovers → destination). */
  legs?: PrivateVehicleLeg[];
  /** Optional backend-provided turn-by-turn steps for the full route. */
  directionSteps?: PrivateDirectionStep[];
  fuzzyScore?: number;
  source?: 'backend' | 'mock';
  errorMessage?: string;
}

// Driving preferences
export interface DrivingPreferences {
  preferShortest: boolean;
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Greedy algorithm constraints
export interface GreedyConstraints {
  maxBudget?: number;
  maxDistance?: number;
  maxTime?: number;
  maxTransfers?: number;
}
