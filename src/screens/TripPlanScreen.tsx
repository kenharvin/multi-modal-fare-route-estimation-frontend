import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { useRoute, RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '@navigation/types';
import { Route, TripPlan, Location, PublicTransportPreference } from '@/types';
import { useApp } from '@context/AppContext';
import DestinationInput from '@components/DestinationInput';
import TripSummary from '@components/TripSummary';
import RouteCard from '@components/RouteCard';
import MapViewComponent from '@components/MapViewComponent';
import { Button, ActivityIndicator } from 'react-native-paper';
import { fetchRoutes, fetchRouteGeometry } from '@services/api';
type TripPlanRouteProp = RouteProp<RootStackParamList, 'TripPlan'>;

const TripPlanScreen: React.FC = () => {
  const route = useRoute<TripPlanRouteProp>();
  const { initialRoute } = route.params;
  const { setIsLoading, isLoading } = useApp();
  
  const [tripPlan, setTripPlan] = useState<TripPlan>({
    id: Date.now().toString(),
    routes: [initialRoute],
    totalFare: initialRoute.totalFare,
    totalTime: initialRoute.totalTime,
    totalDistance: initialRoute.totalDistance,
    destinations: [
      initialRoute.segments[0].origin,
      initialRoute.segments[initialRoute.segments.length - 1].destination
    ]
  });
  
  const [newDestination, setNewDestination] = useState<Location | null>(null);
  const [destinationCount, setDestinationCount] = useState<number>(0);
  const [availableRoutes, setAvailableRoutes] = useState<Route[]>([]);
  const [selectedNewRoute, setSelectedNewRoute] = useState<Route | null>(null);
  const [showNewDestinationInput, setShowNewDestinationInput] = useState<boolean>(false);
  const [isGeometryLoading, setIsGeometryLoading] = useState<boolean>(false);
  const [geometryFetchedIds, setGeometryFetchedIds] = useState<Set<string>>(new Set());

  const handleSelectNewRoute = async (r: Route) => {
    setSelectedNewRoute(r);
    try {
      setIsGeometryLoading(true);
      if (!geometryFetchedIds.has(r.id)) {
        const updated = await fetchRouteGeometry(r);
        setSelectedNewRoute(updated);
        setAvailableRoutes(prev => prev.map(x => (x.id === r.id ? updated : x)));
        setGeometryFetchedIds(prev => {
          const next = new Set(prev);
          next.add(r.id);
          return next;
        });
      }
    } catch (e) {
      console.warn('[TripPlan] Failed to fetch route geometry:', e);
    } finally {
      setIsGeometryLoading(false);
    }
  };

  const handleAddDestination = async () => {
    if (!newDestination) {
      Alert.alert('Missing Information', 'Please select a destination');
      return;
    }

    if (destinationCount >= 2) {
      Alert.alert('Maximum Destinations', 'You can add up to 2 additional destinations');
      return;
    }

    try {
      setIsLoading(true);
      const currentOrigin = tripPlan.destinations[tripPlan.destinations.length - 1];
      
      // Fetch routes from current destination to new destination
      const routes = await fetchRoutes(currentOrigin, newDestination, PublicTransportPreference.SHORTEST_TIME);
      setAvailableRoutes(routes);
      
      if (routes.length > 0) {
        setSelectedNewRoute(routes[0]);
      }
    } catch {
      Alert.alert('Error', 'Failed to fetch routes for new destination');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmNewLeg = () => {
    if (!selectedNewRoute || !newDestination) return;

    const updatedTripPlan: TripPlan = {
      ...tripPlan,
      routes: [...tripPlan.routes, selectedNewRoute],
      totalFare: tripPlan.totalFare + selectedNewRoute.totalFare,
      totalTime: tripPlan.totalTime + selectedNewRoute.totalTime,
      totalDistance: tripPlan.totalDistance + selectedNewRoute.totalDistance,
      destinations: [...tripPlan.destinations, newDestination]
    };

    setTripPlan(updatedTripPlan);
    setDestinationCount(destinationCount + 1);
    setNewDestination(null);
    setAvailableRoutes([]);
    setSelectedNewRoute(null);
    setShowNewDestinationInput(false);
  };

  const handleSavePlan = () => {
    Alert.alert(
      'Save Trip Plan',
      'Would you like to save this trip plan to your account?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Save',
          onPress: () => {
            // TODO: Implement save to account
            Alert.alert('Success', 'Trip plan saved successfully!');
          }
        }
      ]
    );
  };

  const handleSharePlan = () => {
    // TODO: Implement share functionality
    Alert.alert('Share', 'Share functionality coming soon!');
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Trip Plan</Text>
        <Text style={styles.subtitle}>Multi-destination journey</Text>
      </View>

      {/* Map showing all route legs */}
      <View style={styles.mapContainer}>
        <MapViewComponent 
          origin={tripPlan.destinations[0]}
          destination={tripPlan.destinations[tripPlan.destinations.length - 1]}
          route={tripPlan.routes.length > 0 ? tripPlan.routes[0] : undefined}
        />
      </View>

      <View style={styles.section}>
        <TripSummary tripPlan={tripPlan} />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Route Details</Text>
        {tripPlan.routes.map((route, index) => (
          <View key={route.id} style={styles.routeContainer}>
            <View style={styles.legHeader}>
              <Text>PATH</Text>
              <Text style={styles.legTitle}>Leg {index + 1}</Text>
            </View>
            <RouteCard route={route} isSelected={false} />
          </View>
        ))}
      </View>

      {destinationCount < 2 && !showNewDestinationInput && (
        <View style={styles.section}>
          <Button
            mode="outlined"
            onPress={() => setShowNewDestinationInput(true)}
            style={styles.addButton}
            icon="plus"
          >
            Add Another Destination
          </Button>
        </View>
      )}

      {showNewDestinationInput && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>New Destination</Text>
          <DestinationInput
            label="Destination"
            value={newDestination}
            onValueChange={setNewDestination}
            placeholder="Where to next?"
          />
          
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#3498db" />
              <Text style={styles.loadingText}>Finding routes...</Text>
            </View>
          ) : isGeometryLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#3498db" />
              <Text style={styles.loadingText}>Loading route on map…</Text>
            </View>
          ) : availableRoutes.length > 0 ? (
            <>
              <Text style={styles.routesLabel}>Available Routes:</Text>
              {availableRoutes.map((route, index) => (
                <RouteCard
                  key={route.id}
                  route={route}
                  isSelected={selectedNewRoute?.id === route.id}
                  rank={index + 1}
                  onSelect={() => handleSelectNewRoute(route)}
                />
              ))}
              <View style={styles.buttonRow}>
                <Button
                  mode="outlined"
                  onPress={() => {
                    setShowNewDestinationInput(false);
                    setNewDestination(null);
                    setAvailableRoutes([]);
                  }}
                  style={[styles.button, styles.cancelButton]}
                >
                  Cancel
                </Button>
                <Button
                  mode="contained"
                  onPress={handleConfirmNewLeg}
                  style={[styles.button, styles.confirmButton]}
                  disabled={!selectedNewRoute}
                >
                  Add to Trip
                </Button>
              </View>
            </>
          ) : (
            <Button
              mode="contained"
              onPress={handleAddDestination}
              style={styles.searchButton}
              disabled={!newDestination}
            >
              Search Routes
            </Button>
          )}
        </View>
      )}

      <View style={styles.footer}>
        <Button
          mode="contained"
          onPress={handleSavePlan}
          style={styles.saveButton}
          icon="content-save"
        >
          Save Trip Plan
        </Button>
        <Button
          mode="outlined"
          onPress={handleSharePlan}
          style={styles.shareButton}
          icon="share-variant"
        >
          Share
        </Button>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5'
  },
  header: {
    padding: 20,
    backgroundColor: '#fff'
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
  mapContainer: {
    height: 250,
    width: '100%',
    backgroundColor: '#e8f4f8',
    marginTop: 10
  },
  section: {
    backgroundColor: '#fff',
    padding: 20,
    marginTop: 10
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 16
  },
  routeContainer: {
    marginBottom: 16
  },
  legHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8
  },
  legTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3498db',
    marginLeft: 8
  },
  addButton: {
    borderRadius: 8,
    borderColor: '#3498db'
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20
  },
  loadingText: {
    marginLeft: 12,
    fontSize: 14,
    color: '#7f8c8d'
  },
  routesLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginTop: 16,
    marginBottom: 12
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16
  },
  button: {
    flex: 1,
    marginHorizontal: 4,
    borderRadius: 8
  },
  cancelButton: {
    borderColor: '#e74c3c'
  },
  confirmButton: {
    backgroundColor: '#27ae60'
  },
  searchButton: {
    marginTop: 12,
    borderRadius: 8,
    backgroundColor: '#3498db'
  },
  footer: {
    padding: 20,
    paddingBottom: 40
  },
  saveButton: {
    borderRadius: 8,
    backgroundColor: '#27ae60',
    marginBottom: 12
  },
  shareButton: {
    borderRadius: 8,
    borderColor: '#3498db'
  }
});

export default TripPlanScreen;

