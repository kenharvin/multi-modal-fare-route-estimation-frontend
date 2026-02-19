import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
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
      const location = await ExpoLocation.getCurrentPositionAsync({
        accuracy: ExpoLocation.Accuracy.High
      });
      
      const coords: Coordinates = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude
      };
      
      setCurrentLocation(coords);
      return coords;
    } catch (error) {
      console.error('Error getting current location:', error);
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

  useEffect(() => {
    void requestLocationPermission();
  }, [requestLocationPermission]);

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
