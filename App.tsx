import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { DarkTheme as NavigationDarkTheme, DefaultTheme as NavigationDefaultTheme, NavigationContainer } from '@react-navigation/native';
import { MD3DarkTheme as PaperDarkTheme, MD3LightTheme as PaperLightTheme, Provider as PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppProvider } from './src/context/AppContext';
import { ThemeProvider, useThemeMode } from './src/context/ThemeContext';
import { LocationProvider } from './src/context/LocationContext';
import RootNavigator from './src/navigation/RootNavigator';
import { Alert, Platform } from 'react-native';
import * as Updates from 'expo-updates';
import { borderRadius } from './src/utils/theme';

// Import Leaflet CSS for web
if (Platform.OS === 'web') {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require('leaflet/dist/leaflet.css');
}

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <ThemedApp />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

const ThemedApp: React.FC = () => {
  const { isDark, colors } = useThemeMode();

  useEffect(() => {
    // Check for OTA updates on launch so users can get a clear "new version" prompt.
    if (__DEV__ || Platform.OS === 'web') {
      return;
    }

    const checkForPublishedUpdate = async () => {
      try {
        const result = await Updates.checkForUpdateAsync();
        if (!result.isAvailable) {
          return;
        }

        await Updates.fetchUpdateAsync();
        Alert.alert(
          'Update Available',
          'A new update is available. Restart now to apply the latest version.',
          [
            { text: 'Later', style: 'cancel' },
            {
              text: 'Restart Now',
              onPress: () => {
                void Updates.reloadAsync();
              },
            },
          ]
        );
      } catch {
        // Silent failure keeps app startup smooth if update service is temporarily unavailable.
      }
    };

    void checkForPublishedUpdate();
  }, []);

  const paperTheme = {
    ...(isDark ? PaperDarkTheme : PaperLightTheme),
    roundness: borderRadius.lg,
    colors: {
      ...(isDark ? PaperDarkTheme.colors : PaperLightTheme.colors),
      primary: colors.primary,
      secondary: colors.secondary,
      background: colors.background,
      surface: colors.white
    }
  };

  const navTheme = {
    ...(isDark ? NavigationDarkTheme : NavigationDefaultTheme),
    colors: {
      ...(isDark ? NavigationDarkTheme.colors : NavigationDefaultTheme.colors),
      primary: colors.primary,
      background: colors.background,
      card: colors.white,
      text: colors.textPrimary,
      border: colors.gray6,
    },
  };

  return (
    <PaperProvider theme={paperTheme}>
      <AppProvider>
        <LocationProvider>
          <NavigationContainer theme={navTheme}>
            <RootNavigator />
            <StatusBar style={isDark ? 'light' : 'dark'} />
          </NavigationContainer>
        </LocationProvider>
      </AppProvider>
    </PaperProvider>
  );
};
