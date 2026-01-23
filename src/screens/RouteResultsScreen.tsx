import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '@navigation/types';
import { Route } from '@/types';
import { useApp } from '@context/AppContext';
import RouteCard from '@components/RouteCard';
import MapViewComponent from '@components/MapViewComponent';
import { Button, ActivityIndicator } from 'react-native-paper';
import { fetchRoutes, fetchRouteGeometry, pingBackend } from '@services/api';
type RouteResultsRouteProp = RouteProp<RootStackParamList, 'RouteResults'>;
type RouteResultsNavigationProp = StackNavigationProp<RootStackParamList, 'RouteResults'>;

const RouteResultsScreen: React.FC = () => {
  const navigation = useNavigation<RouteResultsNavigationProp>();
  const route = useRoute<RouteResultsRouteProp>();
  const { origin, destination, preference, budget, maxTransfers, preferredModes } = route.params;
  const { isLoading, setIsLoading, setError } = useApp();
  
  const [routes, setRoutes] = useState<Route[]>([]);
  const [selectedRoute, setSelectedRoute] = useState<Route | null>(null);
  const hasFetchedRef = useRef<boolean>(false);
  const [isGeometryLoading, setIsGeometryLoading] = useState<boolean>(false);

  useEffect(() => {
    // Guard against duplicate fetches caused by re-mounts or fast refresh
    if (hasFetchedRef.current) return;
    hasFetchedRef.current = true;
    loadRoutes();
  }, []);

  const loadRoutes = async () => {
    try {
      setIsLoading(true);
      // Quick reachability check to avoid confusing network errors
      const ok = await pingBackend();
      if (!ok) {
        setError('Backend unreachable. Check IP, firewall, and Wi‑Fi.');
        return;
      }
      const data = await fetchRoutes(origin, destination, preference, {
        budget,
        maxTransfers,
        preferredModes
      });
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

  const handleSelectRoute = async (route: Route) => {
    setSelectedRoute(route);
    // Fetch road-following polylines on demand
    try {
      setIsGeometryLoading(true);
      const hasAnyGeometry = (route.segments || []).some(s => Array.isArray(s.geometry) && s.geometry.length >= 3);
      if (!hasAnyGeometry) {
        const updated = await fetchRouteGeometry(route);
        setSelectedRoute(updated);
        setRoutes(prev => prev.map(r => (r.id === route.id ? updated : r)));
      }
    } catch (e) {
      console.warn('[RouteResults] Failed to fetch route geometry:', e);
      Alert.alert('Map preview unavailable', 'Could not load the route polyline. Please try selecting the route again.');
    } finally {
      setIsGeometryLoading(false);
    }
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
        <View style={styles.mapContainer}>
          <MapViewComponent 
            origin={origin}
            destination={destination}
          />
        </View>
        <View style={styles.emptyContent}>
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
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Map showing the selected route */}
      <View style={styles.mapContainer}>
        <MapViewComponent 
          origin={origin}
          destination={destination}
          route={selectedRoute}
        />
        {isGeometryLoading && (
          <View style={styles.mapOverlay}>
            <ActivityIndicator size="small" color="#3498db" />
            <Text style={styles.mapOverlayText}>Loading route on map…</Text>
          </View>
        )}
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
              <Text style={styles.summaryValue}>
                {selectedRoute.totalTransfers === 0
                  ? 'No transfers'
                  : `${selectedRoute.totalTransfers} transfer${selectedRoute.totalTransfers === 1 ? '' : 's'}`}
              </Text>
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
    backgroundColor: '#f5f5f5'
  },
  emptyContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40
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
  mapContainer: {
    height: 300,
    width: '100%',
    backgroundColor: '#e8f4f8'
  },
  mapOverlay: {
    position: 'absolute',
    right: 12,
    top: 12,
    backgroundColor: 'rgba(255,255,255,0.95)',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  mapOverlayText: {
    fontSize: 12,
    color: '#2c3e50'
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

