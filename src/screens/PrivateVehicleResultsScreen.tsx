import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '@navigation/types';
import { PrivateVehicleRoute } from '@/types';
import { useApp } from '@context/AppContext';
import { Button, ActivityIndicator } from 'react-native-paper';
import { calculatePrivateVehicleRoute } from '@services/api';
import MapViewComponent from '@components/MapViewComponent';
import { formatArrivalTimeRange, formatTimeRange } from '@/utils/helpers';
type PrivateVehicleResultsRouteProp = RouteProp<RootStackParamList, 'PrivateVehicleResults'>;
type PrivateVehicleResultsNavigationProp = StackNavigationProp<RootStackParamList, 'PrivateVehicleResults'>;

const PrivateVehicleResultsScreen: React.FC = () => {
  const navigation = useNavigation<PrivateVehicleResultsNavigationProp>();
  const route = useRoute<PrivateVehicleResultsRouteProp>();
  const { origin, destination, vehicle, fuelPrice, stopovers, preferences } = route.params;
  const { isLoading, setIsLoading, setError } = useApp();
  
  const [routeResult, setRouteResult] = useState<PrivateVehicleRoute | null>(null);

  useEffect(() => {
    calculateRoute();
  }, []);

  const calculateRoute = async () => {
    try {
      setIsLoading(true);
      const result = await calculatePrivateVehicleRoute(
        origin,
        destination,
        vehicle,
        fuelPrice,
        stopovers,
        preferences
      );
      setRouteResult(result);
    } catch (error) {
      setError('Failed to calculate route. Please try again.');
      Alert.alert('Error', 'Failed to calculate route');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveRoute = () => {
    Alert.alert(
      'Save Route',
      'Would you like to save this route?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Save',
          onPress: () => {
            Alert.alert('Success', 'Route saved successfully!');
          }
        }
      ]
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196f3" />
        <Text style={styles.loadingText}>Calculating route and fuel cost...</Text>
      </View>
    );
  }

  if (!routeResult) {
    return (
      <View style={styles.emptyContainer}>
        <Text>SEARCH</Text>
        <Text style={styles.emptyTitle}>No Route Found</Text>
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

  const isMock = routeResult.source === 'mock';

  const legColors = ['#1e88e5', '#8e24aa', '#43a047', '#fb8c00'];
  const legs = Array.isArray(routeResult.legs) ? routeResult.legs : [];
  const hasLegBreakdown = legs.length >= 2;
  const legPolylines = hasLegBreakdown
    ? legs
        .filter((l) => Array.isArray(l.geometry) && l.geometry.length >= 2)
        .map((l, idx) => ({
          coords: l.geometry!,
          color: legColors[idx % legColors.length],
          width: 5
        }))
    : null;

  const computeLegSpeedKph = (distanceKm: number, timeMin: number) => {
    if (!distanceKm || !timeMin || timeMin <= 0) return null;
    return distanceKm / (timeMin / 60);
  };

  return (
    <ScrollView style={styles.container}>
      {isMock && (
        <View style={styles.warningCard}>
          <Text style={styles.warningTitle}>Using fallback values</Text>
          <Text style={styles.warningText}>
            The app couldn't reach the private routing API, so the cost/time/distance shown here are mock values.
          </Text>
          {routeResult.errorMessage ? (
            <Text style={styles.warningTextSmall}>{routeResult.errorMessage}</Text>
          ) : null}
        </View>
      )}
      <View style={styles.mapSection}>
        <MapViewComponent
          origin={routeResult.origin}
          destination={routeResult.destination}
          stopovers={routeResult.stopovers}
          polylines={legPolylines}
          polylineCoords={!legPolylines ? routeResult.geometry : null}
          showRoute={true}
        />
      </View>

      {hasLegBreakdown && (
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Leg Breakdown</Text>

          {(() => {
            let cumulativeMin = 0;
            return legs.map((leg, idx) => {
              const dist = Number(leg.distanceKm || 0);
              const timeMin = Number(leg.estimatedTimeMin || 0);
              const fuelCostLeg = typeof leg.fuelCost === 'number' ? leg.fuelCost : (dist / (vehicle.fuelEfficiency || 1)) * fuelPrice;
              const speedKph = computeLegSpeedKph(dist, timeMin);
              cumulativeMin += timeMin;
              const etaRange = formatArrivalTimeRange(Math.round(cumulativeMin));

              const labelFrom = idx === 0 ? 'Origin' : `Stopover ${idx}`;
              const labelTo = idx === legs.length - 1 ? 'Destination' : `Stopover ${idx + 1}`;

              return (
                <View key={leg.id || `leg-${idx}`} style={[styles.legCard, { borderLeftColor: legColors[idx % legColors.length] }]}>
                  <Text style={styles.legTitle}>Leg {idx + 1}: {labelFrom} → {labelTo}</Text>
                  <Text style={styles.legSubtitle} numberOfLines={2}>
                    {leg.origin?.name} → {leg.destination?.name}
                  </Text>

                  <View style={styles.legMetricsRow}>
                    <View style={styles.legMetricItem}>
                      <Text style={styles.legMetricLabel}>Gas</Text>
                      <Text style={styles.legMetricValue}>₱{Number(fuelCostLeg || 0).toFixed(2)}</Text>
                    </View>
                    <View style={styles.legMetricItem}>
                      <Text style={styles.legMetricLabel}>Speed</Text>
                      <Text style={styles.legMetricValue}>
                        {speedKph ? `${speedKph.toFixed(1)} km/h` : '—'}
                      </Text>
                    </View>
                    <View style={styles.legMetricItem}>
                      <Text style={styles.legMetricLabel}>ETA</Text>
                      <Text style={styles.legMetricValue}>{etaRange}</Text>
                    </View>
                  </View>

                  <View style={styles.legMetaRow}>
                    <Text style={styles.legMetaText}>Distance: {dist.toFixed(1)} km</Text>
                    <Text style={styles.legMetaText}>Time: {formatTimeRange(Math.round(timeMin))}</Text>
                  </View>
                </View>
              );
            });
          })()}
        </View>
      )}

      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>{hasLegBreakdown ? 'Complete Summary' : 'Trip Summary'}</Text>
        
        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <Text>GAS</Text>
            <Text style={styles.summaryLabel}>Fuel Cost</Text>
            <Text style={styles.summaryValue}>₱{routeResult.fuelCost.toFixed(2)}</Text>
          </View>
          
          <View style={styles.summaryItem}>
            <Text>SPD</Text>
            <Text style={styles.summaryLabel}>Distance</Text>
            <Text style={styles.summaryValue}>{routeResult.totalDistance.toFixed(1)} km</Text>
          </View>
          
          <View style={styles.summaryItem}>
            <Text>T</Text>
            <Text style={styles.summaryLabel}>Est. Time</Text>
            <Text style={styles.summaryValue}>{formatTimeRange(routeResult.estimatedTime)}</Text>
          </View>
        </View>

        <View style={styles.detailsSection}>
          <View style={styles.detailRow}>
            <Text>GAS</Text>
            <Text style={styles.detailLabel}>Fuel Consumption:</Text>
            <Text style={styles.detailValue}>{routeResult.fuelConsumption.toFixed(2)} L</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text>FUEL</Text>
            <Text style={styles.detailLabel}>Fuel Efficiency:</Text>
            <Text style={styles.detailValue}>{vehicle.fuelEfficiency} km/L</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text>$</Text>
            <Text style={styles.detailLabel}>Fuel Price:</Text>
            <Text style={styles.detailValue}>₱{fuelPrice.toFixed(2)}/L</Text>
          </View>
        </View>
      </View>

      <View style={styles.routeCard}>
        <Text style={styles.routeTitle}>Route Information</Text>
        
        <View style={styles.locationRow}>
          <Text>*</Text>
          <View style={styles.locationInfo}>
            <Text style={styles.locationLabel}>Origin</Text>
            <Text style={styles.locationName}>{routeResult.origin.name}</Text>
          </View>
        </View>

        {routeResult.stopovers.length > 0 && (
          <View style={styles.stopoversSection}>
            <Text style={styles.stopoversTitle}>Stopovers</Text>
            {routeResult.stopovers.map((stopover, index) => (
              <View key={stopover.id} style={styles.stopoverRow}>
                <Text>PIN</Text>
                <View style={styles.stopoverInfo}>
                  <Text style={styles.stopoverName}>{stopover.location.name}</Text>
                  <Text style={styles.stopoverType}>{stopover.type}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        <View style={styles.locationRow}>
          <Text>*</Text>
          <View style={styles.locationInfo}>
            <Text style={styles.locationLabel}>Destination</Text>
            <Text style={styles.locationName}>{routeResult.destination.name}</Text>
          </View>
        </View>
      </View>

      {routeResult.fuzzyScore && (
        <View style={styles.scoreCard}>
          <Text style={styles.scoreTitle}>Route Score</Text>
          <View style={styles.scoreCircle}>
            <Text style={styles.scoreValue}>{(routeResult.fuzzyScore * 100).toFixed(0)}</Text>
            <Text style={styles.scoreLabel}>/ 100</Text>
          </View>
          <Text style={styles.scoreDescription}>
            Based on distance, fuel cost, and preferences
          </Text>
        </View>
      )}

      <View style={styles.footer}>
        <Button
          mode="contained"
          onPress={handleSaveRoute}
          style={styles.saveButton}
          icon="content-save"
        >
          Save Route
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
    marginTop: 16,
    marginBottom: 24
  },
  retryButton: {
    borderRadius: 8
  },
  mapSection: {
    height: 250
  },
  warningCard: {
    backgroundColor: '#fff3cd',
    borderColor: '#ffeeba',
    borderWidth: 1,
    padding: 14,
    margin: 10,
    borderRadius: 10
  },
  warningTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#856404',
    marginBottom: 6
  },
  warningText: {
    fontSize: 12,
    color: '#856404'
  },
  warningTextSmall: {
    fontSize: 11,
    color: '#856404',
    marginTop: 8
  },
  summaryCard: {
    backgroundColor: '#fff',
    padding: 20,
    marginTop: 10
  },
  summaryTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 20
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20
  },
  summaryItem: {
    alignItems: 'center'
  },
  summaryLabel: {
    fontSize: 12,
    color: '#7f8c8d',
    marginTop: 8
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginTop: 4
  },
  detailsSection: {
    borderTopWidth: 1,
    borderTopColor: '#ecf0f1',
    paddingTop: 16
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12
  },
  detailLabel: {
    fontSize: 14,
    color: '#7f8c8d',
    marginLeft: 12,
    flex: 1
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c3e50'
  },
  legCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderLeftWidth: 6,
    borderLeftColor: '#1e88e5',
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#ecf0f1'
  },
  legTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2c3e50'
  },
  legSubtitle: {
    fontSize: 12,
    color: '#7f8c8d',
    marginTop: 4,
    marginBottom: 10
  },
  legMetricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  legMetricItem: {
    flex: 1,
    alignItems: 'center'
  },
  legMetricLabel: {
    fontSize: 12,
    color: '#7f8c8d'
  },
  legMetricValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2c3e50',
    marginTop: 4
  },
  legMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10
  },
  legMetaText: {
    fontSize: 12,
    color: '#7f8c8d'
  },
  routeCard: {
    backgroundColor: '#fff',
    padding: 20,
    marginTop: 10
  },
  routeTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 16
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16
  },
  locationInfo: {
    marginLeft: 12,
    flex: 1
  },
  locationLabel: {
    fontSize: 12,
    color: '#7f8c8d'
  },
  locationName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginTop: 2
  },
  stopoversSection: {
    marginBottom: 16,
    paddingLeft: 12
  },
  stopoversTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3498db',
    marginBottom: 12
  },
  stopoverRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    paddingLeft: 8
  },
  stopoverInfo: {
    marginLeft: 12
  },
  stopoverName: {
    fontSize: 14,
    color: '#2c3e50'
  },
  stopoverType: {
    fontSize: 12,
    color: '#7f8c8d',
    textTransform: 'capitalize'
  },
  scoreCard: {
    backgroundColor: '#fff',
    padding: 20,
    marginTop: 10,
    alignItems: 'center'
  },
  scoreTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 16
  },
  scoreCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#e3f2fd',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12
  },
  scoreValue: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#2196f3'
  },
  scoreLabel: {
    fontSize: 16,
    color: '#7f8c8d'
  },
  scoreDescription: {
    fontSize: 12,
    color: '#7f8c8d',
    textAlign: 'center'
  },
  footer: {
    padding: 20,
    paddingBottom: 40
  },
  saveButton: {
    borderRadius: 8,
    backgroundColor: '#27ae60'
  }
});

export default PrivateVehicleResultsScreen;

