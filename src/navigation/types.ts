import { Location, PublicTransportPreference, Vehicle, DrivingPreferences, Stopover } from '@types/index';

export type RootStackParamList = {
  Welcome: undefined;
  ModeSelection: undefined;
  PublicTransport: undefined;
  PrivateVehicle: undefined;
  RouteResults: {
    origin: Location;
    destination: Location;
    preference: PublicTransportPreference;
    budget?: number;
    maxTransfers?: number;
    preferredModes?: string[];
  };
  TripPlan: {
    initialRoute: any; // Route type
  };
  PrivateVehicleResults: {
    origin: Location;
    destination: Location;
    vehicle: Vehicle;
    fuelPrice: number;
    stopovers: Stopover[];
    preferences: DrivingPreferences;
  };
};
