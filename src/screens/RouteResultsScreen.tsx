import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '@navigation/types';
import { Route } from '@/types';
import { useApp } from '@context/AppContext';
import RouteCard from '@components/RouteCard';
import { Button, ActivityIndicator } from 'react-native-paper';
import { fetchRoutes } from '@services/api';
type RouteResultsRouteProp = RouteProp<RootStackParamList, 'RouteResults'>;
type RouteResultsNavigationProp = StackNavigationProp<RootStackParamList, 'RouteResults'>;

const RouteResultsScreen: React.FC = () => {
  const navigation = useNavigation<RouteResultsNavigationProp>();
  const route = useRoute<RouteResultsRouteProp>();
  const { origin, destination, preference } = route.params;
  const { isLoading, setIsLoading, setError } = useApp();
  
  const [routes, setRoutes] = useState<Route[]>([]);
  const [selectedRoute, setSelectedRoute] = useState<Route | null>(null);

  useEffect(() => {
    loadRoutes();
  }, []);

  const loadRoutes = async () => {
    try {
      setIsLoading(true);
      const data = await fetchRoutes(origin, destination, preference);
      setRoutes(data);
      if (data.length > 0) {
        setSelectedRoute(data[0]); // Select best route by default
      }
    } catch (error) {
      setError('Failed to fetch routes. Please try again.');
      Alert.alert('Error', 'Failed to fetch routes');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectRoute = (route: Route) => {
    setSelectedRoute(route);
  };

  const handleAddDestination = () => {
    if (selectedRoute) {
      navigation.navigate('TripPlan', { initialRoute: selectedRoute });
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3498db" />
        <Text style={styles.loadingText}>Finding best routes...</Text>
      </View>
    );
  }

  if (routes.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text>MAP</Text>
        <Text style={styles.emptyTitle}>No Routes Found</Text>
        <Text style={styles.emptyText}>
          We couldn't find any routes for your selected locations.
        </Text>
        <Button
          mode="contained"
          onPress={() => navigation.goBack()}
          style={styles.retryButton}
        >
          Try Again
        </Button>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Available Routes</Text>
        <Text style={styles.subtitle}>
          {origin.name} → {destination.name}
        </Text>
      </View>

      <ScrollView style={styles.routesList}>
        {routes.map((route, index) => (
          <RouteCard
            key={route.id}
            route={route}
            isSelected={selectedRoute?.id === route.id}
            rank={index + 1}
            onSelect={() => handleSelectRoute(route)}
          />
        ))}
      </ScrollView>

      {selectedRoute && (
        <View style={styles.footer}>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text>$</Text>
              <Text style={styles.summaryValue}>₱{selectedRoute.totalFare.toFixed(2)}</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text>T</Text>
              <Text style={styles.summaryValue}>{selectedRoute.totalTime} min</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text>↔</Text>
              <Text style={styles.summaryValue}>{selectedRoute.totalTransfers} transfers</Text>
            </View>
          </View>
          <Button
            mode="contained"
            onPress={handleAddDestination}
            style={styles.continueButton}
            icon="plus"
          >
            Add Another Destination
          </Button>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5'
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5'
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#7f8c8d'
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#f5f5f5'
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginTop: 16
  },
  emptyText: {
    fontSize: 16,
    color: '#7f8c8d',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 24
  },
  retryButton: {
    borderRadius: 8
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#ecf0f1'
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50'
  },
  subtitle: {
    fontSize: 14,
    color: '#7f8c8d',
    marginTop: 4
  },
  routesList: {
    flex: 1,
    padding: 16
  },
  footer: {
    backgroundColor: '#fff',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#ecf0f1'
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16
  },
  summaryItem: {
    alignItems: 'center'
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginTop: 4
  },
  continueButton: {
    borderRadius: 8,
    backgroundColor: '#3498db'
  }
});

export default RouteResultsScreen;

