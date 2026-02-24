import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import * as ExpoLocation from 'expo-location';
import { Location, Coordinates } from '@/types';

interface LocationContextType {
  currentLocation: Coordinates | null;
  locationPermission: boolean;
  selectedOrigin: Location | null;
  selectedDestination: Location | null;
  setSelectedOrigin: (location: Location | null) => void;
  setSelectedDestination: (location: Location | null) => void;
  clearSelectedLocations: () => void;
  requestLocationPermission: () => Promise<boolean>;
  getCurrentLocation: () => Promise<Coordinates | null>;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export const LocationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentLocation, setCurrentLocation] = useState<Coordinates | null>(null);
  const [locationPermission, setLocationPermission] = useState<boolean>(false);
  const [selectedOrigin, setSelectedOrigin] = useState<Location | null>(null);
  const [selectedDestination, setSelectedDestination] = useState<Location | null>(null);

  const clearSelectedLocations = useCallback(() => {
    setSelectedOrigin(null);
    setSelectedDestination(null);
  }, []);

  const getCurrentLocation = useCallback(async (): Promise<Coordinates | null> => {
    try {
      const servicesEnabled = await ExpoLocation.hasServicesEnabledAsync();
      if (!servicesEnabled) {
        console.warn('Location services are disabled. Enable GPS/location services to use current location.');
        return null;
      }

      const location = await ExpoLocation.getCurrentPositionAsync({
        accuracy: ExpoLocation.Accuracy.Balanced,
      });
      
      const coords: Coordinates = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude
      };
      
      setCurrentLocation(coords);
      return coords;
    } catch (error) {
      try {
        const lastKnown = await ExpoLocation.getLastKnownPositionAsync({
          maxAge: 1000 * 60 * 10,
          requiredAccuracy: 500,
        });

        if (lastKnown?.coords) {
          const coords: Coordinates = {
            latitude: lastKnown.coords.latitude,
            longitude: lastKnown.coords.longitude,
          };
          setCurrentLocation(coords);
          console.warn('Using last known location because current GPS fix is unavailable.');
          return coords;
        }
      } catch (lastKnownError) {
        console.warn('Failed to get last known location:', lastKnownError);
      }

      console.warn('Current location unavailable; continuing without device location.');
      return null;
    }

  }, []);

  const requestLocationPermission = useCallback(async (): Promise<boolean> => {
    try {
      const { status } = await ExpoLocation.requestForegroundPermissionsAsync();
      const granted = status === 'granted';
      setLocationPermission(granted);

      if (granted) {
        void getCurrentLocation();
      }

      return granted;
    } catch (error) {
      console.error('Error requesting location permission:', error);
      return false;
    }
  }, [getCurrentLocation]);

  return (
    <LocationContext.Provider
      value={{
        currentLocation,
        locationPermission,
        selectedOrigin,
        selectedDestination,
        setSelectedOrigin,
        setSelectedDestination,
        clearSelectedLocations,
        requestLocationPermission,
        getCurrentLocation
      }}
    >
      {children}
    </LocationContext.Provider>
  );
};

export const useLocation = (): LocationContextType => {
  const context = useContext(LocationContext);
  if (!context) {
    throw new Error('useLocation must be used within LocationProvider');
  }
  return context;
};
