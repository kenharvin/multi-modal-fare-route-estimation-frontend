import React, { createContext, useContext, useState, ReactNode } from 'react';
import { TravelMode } from '@/types';

interface AppContextType {
  travelMode: TravelMode | null;
  setTravelMode: (mode: TravelMode) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  error: string | null;
  setError: (error: string | null) => void;
  clearError: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [travelMode, setTravelMode] = useState<TravelMode | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = () => setError(null);

  return (
    <AppContext.Provider
      value={{
        travelMode,
        setTravelMode,
        isLoading,
        setIsLoading,
        error,
        setError,
        clearError
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = (): AppContextType => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
};
