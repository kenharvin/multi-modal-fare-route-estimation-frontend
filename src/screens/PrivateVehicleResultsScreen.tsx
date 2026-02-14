import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, Alert, Animated, Dimensions, Pressable } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '@navigation/types';
import { PrivateVehicleRoute } from '@/types';
import { useApp } from '@context/AppContext';
import { Button } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { calculatePrivateVehicleRoute } from '@services/api';
import MapViewComponent from '@components/MapViewComponent';
import LogoLoadingScreen from '@components/LogoLoadingScreen';
import { formatArrivalTimeRange, formatTimeRange } from '@/utils/helpers';
import { borderRadius, fontSize, shadows, spacing, type ThemeColors } from '@/utils/theme';
import { useThemeMode } from '@context/ThemeContext';
type PrivateVehicleResultsRouteProp = RouteProp<RootStackParamList, 'PrivateVehicleResults'>;
type PrivateVehicleResultsNavigationProp = StackNavigationProp<RootStackParamList, 'PrivateVehicleResults'>;

const PrivateVehicleResultsScreen: React.FC = () => {
  const { colors } = useThemeMode();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const navigation = useNavigation<PrivateVehicleResultsNavigationProp>();
  const route = useRoute<PrivateVehicleResultsRouteProp>();
  const { origin, destination, vehicle, fuelPrice, stopovers, preferences } = route.params;
  const { isLoading, setIsLoading, setError } = useApp();
  
  const [routeResult, setRouteResult] = useState<PrivateVehicleRoute | null>(null);
  const [sheetExpanded, setSheetExpanded] = useState<boolean>(true);

  const sheetProgress = useRef(new Animated.Value(1)).current; // 0=collapsed, 1=expanded
  const isExpandedRef = useRef<boolean>(true);
  const winH = Dimensions.get('window').height;
  const sheetCollapsedH = 220;
  const sheetExpandedH = Math.max(560, Math.round(winH * 0.92));
  const sheetHeight = sheetProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [sheetCollapsedH, sheetExpandedH]
  });

  const expandSheet = () => {
    if (isExpandedRef.current) return;
    isExpandedRef.current = true;
    setSheetExpanded(true);
    Animated.spring(sheetProgress, {
      toValue: 1,
      useNativeDriver: false,
      speed: 18,
      bounciness: 0
    }).start();
  };

  const collapseSheet = () => {
    if (!isExpandedRef.current) return;
    isExpandedRef.current = false;
    setSheetExpanded(false);
    Animated.spring(sheetProgress, {
      toValue: 0,
      useNativeDriver: false,
      speed: 18,
      bounciness: 0
    }).start();
  };

  const calculateRoute = useCallback(async () => {
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
    } catch {
      setError('Failed to calculate route. Please try again.');
      Alert.alert('Error', 'Failed to calculate route');
    } finally {
      setIsLoading(false);
    }
  }, [destination, fuelPrice, origin, preferences, setError, setIsLoading, stopovers, vehicle]);

  useEffect(() => {
    void calculateRoute();
  }, [calculateRoute]);

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
    return <LogoLoadingScreen message="Calculating route and fuel cost" />;
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

  const isValidCoord = (c: any): c is { latitude: number; longitude: number } => {
    const lat = c?.latitude;
    const lon = c?.longitude;
    return (
      typeof lat === 'number' &&
      typeof lon === 'number' &&
      Number.isFinite(lat) &&
      Number.isFinite(lon) &&
      lat >= -90 &&
      lat <= 90 &&
      lon >= -180 &&
      lon <= 180
    );
  };

  const haversineM = (a: { latitude: number; longitude: number }, b: { latitude: number; longitude: number }) => {
    const R = 6371000;
    const toRad = (x: number) => (x * Math.PI) / 180;
    const dLat = toRad(b.latitude - a.latitude);
    const dLon = toRad(b.longitude - a.longitude);
    const lat1 = toRad(a.latitude);
    const lat2 = toRad(b.latitude);
    const s1 = Math.sin(dLat / 2);
    const s2 = Math.sin(dLon / 2);
    const h = s1 * s1 + Math.cos(lat1) * Math.cos(lat2) * s2 * s2;
    return 2 * R * Math.asin(Math.sqrt(h));
  };

  const shouldAnchor = (a?: { latitude: number; longitude: number }, b?: { latitude: number; longitude: number }) => {
    if (!a || !b || !isValidCoord(a) || !isValidCoord(b)) return false;
    const d = haversineM(a, b);
    return d > 12 && d <= 5000;
  };

  const legPolylines = hasLegBreakdown
    ? legs
        .map((l, idx) => {
          const baseCoords = Array.isArray(l.geometry) ? l.geometry.filter(isValidCoord) : [];
          if (baseCoords.length < 2) return null;

          const anchoredCoords = [...baseCoords];
          const legOrigin = l.origin?.coordinates;
          const legDestination = l.destination?.coordinates;

          if (isValidCoord(legOrigin) && shouldAnchor(legOrigin, anchoredCoords[0])) {
            anchoredCoords.unshift(legOrigin);
          }

          const last = anchoredCoords[anchoredCoords.length - 1];
          if (isValidCoord(legDestination) && shouldAnchor(last, legDestination)) {
            anchoredCoords.push(legDestination);
          }

          return {
            coords: anchoredCoords,
            color: legColors[idx % legColors.length],
            width: 5
          };
        })
        .filter((p): p is { coords: { latitude: number; longitude: number }[]; color: string; width: number } => !!p)
    : null;

  const computeLegSpeedKph = (distanceKm: number, timeMin: number) => {
    if (!distanceKm || !timeMin || timeMin <= 0) return null;
    return distanceKm / (timeMin / 60);
  };

  return (
    <View style={styles.container}>
      {/* Map as full-screen background */}
      <View style={StyleSheet.absoluteFillObject}>
        <MapViewComponent
          origin={routeResult.origin}
          destination={routeResult.destination}
          stopovers={routeResult.stopovers}
          polylines={legPolylines}
          polylineCoords={!legPolylines ? routeResult.geometry : null}
          showRoute={true}
          fitBoundsPadding={{ top: 64, right: 64, bottom: 520, left: 64 }}
          fitBoundsMaxZoom={11}
        />
      </View>

      {/* Bottom sheet: expands as user scrolls */}
      <Animated.View style={[styles.sheet, { height: sheetHeight }]}>
        <Pressable
          style={styles.sheetHandleWrap}
          onPress={() => {
            if (isExpandedRef.current) {
              collapseSheet();
            } else {
              expandSheet();
            }
          }}
        >
          <View style={styles.sheetHandle} />
          <Text style={styles.sheetHint}>
            {sheetExpanded ? 'Tap to view the map again' : 'Tap to expand'}
          </Text>
        </Pressable>

        <Animated.ScrollView
          style={styles.sheetScroll}
          contentContainerStyle={styles.sheetContent}
          showsVerticalScrollIndicator={false}
          overScrollMode="never"
          scrollEventThrottle={16}
          onScrollBeginDrag={expandSheet}
          onMomentumScrollEnd={(e) => {
            const y = e?.nativeEvent?.contentOffset?.y ?? 0;
            if (y <= 0) collapseSheet();
          }}
          onScrollEndDrag={(e) => {
            const y = e?.nativeEvent?.contentOffset?.y ?? 0;
            if (y <= 0) collapseSheet();
          }}
        >
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
                          <View style={styles.metricLabelRow}>
                            <MaterialCommunityIcons name="fuel" size={14} color={colors.textSecondary} />
                            <Text style={styles.legMetricLabel}>Fuel</Text>
                          </View>
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
        <Text style={styles.summaryTitle}>Trip Overview</Text>

        <View style={styles.overviewGrid}>
          <View style={styles.overviewItem}>
            <View style={[styles.iconCircle, { backgroundColor: colors.accentLight }]}>
              <MaterialCommunityIcons name="fuel" size={22} color={colors.accentDark} />
            </View>
            <Text style={styles.summaryLabel}>Fuel Cost</Text>
            <Text style={styles.summaryValue}>₱{routeResult.fuelCost.toFixed(2)}</Text>
          </View>

          <View style={styles.overviewItem}>
            <View style={[styles.iconCircle, { backgroundColor: colors.primaryLight }]}>
              <MaterialCommunityIcons name="clock-outline" size={22} color={colors.primaryDark} />
            </View>
            <Text style={styles.summaryLabel}>Total Time</Text>
            <Text style={styles.summaryValue}>{formatTimeRange(routeResult.estimatedTime)}</Text>
          </View>

          <View style={styles.overviewItem}>
            <View style={[styles.iconCircle, { backgroundColor: colors.secondaryLight }]}>
              <MaterialCommunityIcons name="map-marker-distance" size={22} color={colors.secondaryDark} />
            </View>
            <Text style={styles.summaryLabel}>Distance</Text>
            <Text style={styles.summaryValue}>{routeResult.totalDistance.toFixed(1)} km</Text>
          </View>

          <View style={styles.overviewItem}>
            <View style={[styles.iconCircle, { backgroundColor: colors.gray7 }]}>
              <MaterialCommunityIcons name="flag-checkered" size={22} color={colors.textPrimary} />
            </View>
            <Text style={styles.summaryLabel}>ETA</Text>
            <Text style={styles.summaryValue}>{formatArrivalTimeRange(routeResult.estimatedTime)}</Text>
          </View>
        </View>

        <View style={styles.detailsSection}>
          <View style={styles.detailRow}>
            <MaterialCommunityIcons name="fuel" size={18} color={colors.textSecondary} />
            <Text style={styles.detailLabel}>Fuel Consumption:</Text>
            <Text style={styles.detailValue}>{routeResult.fuelConsumption.toFixed(2)} L</Text>
          </View>

          <View style={styles.detailRow}>
            <MaterialCommunityIcons name="gauge" size={18} color={colors.textSecondary} />
            <Text style={styles.detailLabel}>Fuel Efficiency:</Text>
            <Text style={styles.detailValue}>{vehicle.fuelEfficiency} km/L</Text>
          </View>

          <View style={styles.detailRow}>
            <MaterialCommunityIcons name="cash" size={18} color={colors.textSecondary} />
            <Text style={styles.detailLabel}>Fuel Price:</Text>
            <Text style={styles.detailValue}>₱{fuelPrice.toFixed(2)}/L</Text>
          </View>
        </View>
      </View>

      <View style={styles.routeCard}>
        <Text style={styles.routeTitle}>Route Information</Text>
        
        <View style={styles.locationRow}>
          <MaterialCommunityIcons name="ray-start" size={18} color={colors.primary} />
          <View style={styles.locationInfo}>
            <Text style={styles.locationLabel}>Origin</Text>
            <Text style={styles.locationName}>{routeResult.origin.name}</Text>
          </View>
        </View>

        {routeResult.stopovers.length > 0 && (
          <View style={styles.stopoversSection}>
            <Text style={styles.stopoversTitle}>Stopovers</Text>
            {routeResult.stopovers.map((stopover) => (
              <View key={stopover.id} style={styles.stopoverRow}>
                <MaterialCommunityIcons name="map-marker" size={18} color={colors.textSecondary} />
                <View style={styles.stopoverInfo}>
                  <Text style={styles.stopoverName}>{stopover.location.name}</Text>
                  <Text style={styles.stopoverType}>{stopover.type}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        <View style={styles.locationRow}>
          <MaterialCommunityIcons name="flag-checkered" size={18} color={colors.error} />
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
        </Animated.ScrollView>
      </Animated.View>
    </View>
  );
};

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: fontSize.lg,
    color: colors.textSecondary
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
    backgroundColor: colors.background
  },
  emptyTitle: {
    fontSize: fontSize.title,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginTop: spacing.md,
    marginBottom: spacing.lg
  },
  retryButton: {
    borderRadius: borderRadius.lg
  },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.white,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    overflow: 'hidden',
    ...shadows.large
  },
  sheetHandleWrap: {
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
    alignItems: 'center',
    gap: 6
  },
  sheetHandle: {
    width: 44,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.gray5
  },
  sheetHint: {
    fontSize: fontSize.sm,
    color: colors.textSecondary
  },
  sheetScroll: {
    flex: 1
  },
  sheetContent: {
    paddingBottom: spacing.xxl
  },
  warningCard: {
    backgroundColor: colors.accentLight,
    borderColor: colors.accentLight,
    borderWidth: 1,
    padding: spacing.md,
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    borderRadius: borderRadius.xl
  },
  warningTitle: {
    fontSize: fontSize.md,
    fontWeight: '700',
    color: colors.gray1,
    marginBottom: spacing.xs
  },
  warningText: {
    fontSize: fontSize.sm,
    color: colors.gray1
  },
  warningTextSmall: {
    fontSize: fontSize.xs,
    color: colors.gray1,
    marginTop: spacing.sm
  },
  summaryCard: {
    backgroundColor: colors.white,
    padding: spacing.lg,
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.gray6,
    ...shadows.small
  },
  summaryTitle: {
    fontSize: fontSize.xl,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: spacing.lg
  },
  overviewGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: spacing.lg
  },
  overviewItem: {
    width: '50%',
    alignItems: 'center',
    marginBottom: spacing.lg
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm
  },
  summaryLabel: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.sm
  },
  summaryValue: {
    fontSize: fontSize.xl,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginTop: spacing.xs
  },
  detailsSection: {
    borderTopWidth: 1,
    borderTopColor: colors.gray6,
    paddingTop: spacing.md
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md
  },
  detailLabel: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    marginLeft: spacing.md,
    flex: 1
  },
  detailValue: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.textPrimary
  },
  legCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    borderLeftWidth: 6,
    borderLeftColor: colors.primary,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.gray6
  },
  legTitle: {
    fontSize: fontSize.md,
    fontWeight: '700',
    color: colors.textPrimary
  },
  legSubtitle: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    marginBottom: spacing.md
  },
  legMetricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  legMetricItem: {
    flex: 1,
    alignItems: 'center'
  },
  metricLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs
  },
  legMetricLabel: {
    fontSize: fontSize.sm,
    color: colors.textSecondary
  },
  legMetricValue: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: spacing.xs
  },
  legMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.md
  },
  legMetaText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary
  },
  routeCard: {
    backgroundColor: colors.white,
    padding: spacing.lg,
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.gray6,
    ...shadows.small
  },
  routeTitle: {
    fontSize: fontSize.xl,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.md
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md
  },
  locationInfo: {
    marginLeft: spacing.md,
    flex: 1
  },
  locationLabel: {
    fontSize: fontSize.sm,
    color: colors.textSecondary
  },
  locationName: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.textPrimary,
    marginTop: 2
  },
  stopoversSection: {
    marginBottom: spacing.md,
    paddingLeft: spacing.md
  },
  stopoversTitle: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.primary,
    marginBottom: spacing.md
  },
  stopoverRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
    paddingLeft: spacing.sm
  },
  stopoverInfo: {
    marginLeft: spacing.md
  },
  stopoverName: {
    fontSize: fontSize.md,
    color: colors.textPrimary
  },
  stopoverType: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    textTransform: 'capitalize'
  },
  scoreCard: {
    backgroundColor: colors.white,
    padding: spacing.lg,
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    alignItems: 'center'
  },
  scoreTitle: {
    fontSize: fontSize.xl,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.md
  },
  scoreCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md
  },
  scoreValue: {
    fontSize: 36,
    fontWeight: 'bold',
    color: colors.primary
  },
  scoreLabel: {
    fontSize: fontSize.lg,
    color: colors.textSecondary
  },
  scoreDescription: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    textAlign: 'center'
  },
  footer: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl
  },
  saveButton: {
    borderRadius: borderRadius.lg,
    backgroundColor: colors.secondary
  }
});

export default PrivateVehicleResultsScreen;

