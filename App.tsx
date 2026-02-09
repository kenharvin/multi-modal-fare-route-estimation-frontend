import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { MD3LightTheme as PaperLightTheme, Provider as PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppProvider } from './src/context/AppContext';
import { LocationProvider } from './src/context/LocationContext';
import RootNavigator from './src/navigation/RootNavigator';
import { Platform } from 'react-native';
import { borderRadius, colors } from './src/utils/theme';

// Import Leaflet CSS for web
if (Platform.OS === 'web') {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require('leaflet/dist/leaflet.css');
}

export default function App() {
  const paperTheme = {
    ...PaperLightTheme,
    roundness: borderRadius.lg,
    colors: {
      ...PaperLightTheme.colors,
      primary: colors.primary,
      secondary: colors.secondary,
      background: colors.background,
      surface: colors.white
    }
  };

  return (
    <SafeAreaProvider>
      <PaperProvider theme={paperTheme}>
        <AppProvider>
          <LocationProvider>
            <NavigationContainer>
              <RootNavigator />
              <StatusBar style="auto" />
            </NavigationContainer>
          </LocationProvider>
        </AppProvider>
      </PaperProvider>
    </SafeAreaProvider>
  );
}
