import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { RootStackParamList } from './types';

// Import screens
import WelcomeScreen from '@screens/WelcomeScreen';
import ModeSelectionScreen from '@screens/ModeSelectionScreen';
import PublicTransportScreen from '@screens/PublicTransportScreen';
import PrivateVehicleScreen from '@screens/PrivateVehicleScreen';
import RouteResultsScreen from '@screens/RouteResultsScreen';
import TripPlanScreen from '@screens/TripPlanScreen';
import PrivateVehicleResultsScreen from '@screens/PrivateVehicleResultsScreen';
import { useThemeMode } from '@context/ThemeContext';
import ThemeToggle from '@components/ThemeToggle';

const Stack = createStackNavigator<RootStackParamList>();

const RootNavigator: React.FC = () => {
  const { colors } = useThemeMode();

  return (
    <Stack.Navigator
      initialRouteName="Welcome"
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.primary
        },
        headerTintColor: colors.textWhite,
        headerTitleStyle: {
          fontWeight: 'bold'
        },
        cardStyle: {
          backgroundColor: colors.background
        },
        headerRight: () => <ThemeToggle />
      }}
    >
      <Stack.Screen
        name="Welcome"
        component={WelcomeScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="ModeSelection"
        component={ModeSelectionScreen}
        options={{
          title: 'Select Travel Mode',
          headerLeft: () => null
        }}
      />
      <Stack.Screen
        name="PublicTransport"
        component={PublicTransportScreen}
        options={{ title: 'Public Transport' }}
      />
      <Stack.Screen
        name="PrivateVehicle"
        component={PrivateVehicleScreen}
        options={{ title: 'Private Vehicle' }}
      />
      <Stack.Screen
        name="RouteResults"
        component={RouteResultsScreen}
        options={{ title: 'Route Options' }}
      />
      <Stack.Screen
        name="TripPlan"
        component={TripPlanScreen}
        options={{ title: 'Trip Plan' }}
      />
      <Stack.Screen
        name="PrivateVehicleResults"
        component={PrivateVehicleResultsScreen}
        options={{ title: 'Route & Cost' }}
      />
    </Stack.Navigator>
  );
};

export default RootNavigator;
