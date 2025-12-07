import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { Provider as PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppProvider } from './src/context/AppContext';
import { LocationProvider } from './src/context/LocationContext';
import RootNavigator from './src/navigation/RootNavigator';
import { Platform } from 'react-native';

// Import Leaflet CSS for web
if (Platform.OS === 'web') {
  require('leaflet/dist/leaflet.css');
}

export default function App() {
  return (
    <SafeAreaProvider>
      <PaperProvider>
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
