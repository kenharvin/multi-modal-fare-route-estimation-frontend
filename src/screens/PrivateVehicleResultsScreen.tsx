import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, Alert, Animated, Dimensions, Pressable, PanResponder } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '@navigation/types';
import { PrivateVehicleRoute } from '@/types';
import { useApp } from '@context/AppContext';
import { Button } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { calculatePrivateVehicleRoute } from '@services/api';
import { reverseGeocodePoi } from '@services/api';
import MapViewComponent from '@components/MapViewComponent';
import LogoLoadingScreen from '@components/LogoLoadingScreen';
import { formatArrivalTimeRange, formatTimeRange } from '@/utils/helpers';
import { borderRadius, fontSize, shadows, spacing, type ThemeColors } from '@/utils/theme';
import { useThemeMode } from '@context/ThemeContext';
type PrivateVehicleResultsRouteProp = RouteProp<RootStackParamList, 'PrivateVehicleResults'>;
type PrivateVehicleResultsNavigationProp = StackNavigationProp<RootStackParamList, 'PrivateVehicleResults'>;

type DirectionStep = {
  id: string;
  icon: string;
  instruction: string;
  distanceText?: string;
  turnPoint?: { latitude: number; longitude: number };
};

const PrivateVehicleResultsScreen: React.FC = () => {
  const { colors } = useThemeMode();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const navigation = useNavigation<PrivateVehicleResultsNavigationProp>();
  const route = useRoute<PrivateVehicleResultsRouteProp>();
  const { origin, destination, vehicle, fuelPrice, stopovers, preferences } = route.params;
  const { isLoading, setIsLoading, setError } = useApp();
  
  const [routeResult, setRouteResult] = useState<PrivateVehicleRoute | null>(null);
  const [sheetExpanded, setSheetExpanded] = useState<boolean>(false);
  const [turnPointNames, setTurnPointNames] = useState<Record<string, string>>({});

  const sheetProgress = useRef(new Animated.Value(0)).current; // 0=collapsed, 1=expanded
  const isExpandedRef = useRef<boolean>(false);
  const winH = Dimensions.get('window').height;
  const sheetCollapsedH = 220;
  const sheetExpandedH = Math.max(560, Math.round(winH * 0.92));
  const TOP_DRAG_ZONE_HEIGHT = 120;
  const sheetHeight = sheetProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [sheetCollapsedH, sheetExpandedH]
  });

  const expandSheet = useCallback(() => {
    if (isExpandedRef.current) return;
    isExpandedRef.current = true;
    setSheetExpanded(true);
    Animated.spring(sheetProgress, {
      toValue: 1,
      useNativeDriver: false,
      speed: 18,
      bounciness: 0
    }).start();
  }, [sheetProgress]);

  const collapseSheet = useCallback(() => {
    if (!isExpandedRef.current) return;
    isExpandedRef.current = false;
    setSheetExpanded(false);
    Animated.spring(sheetProgress, {
      toValue: 0,
      useNativeDriver: false,
      speed: 18,
      bounciness: 0
    }).start();
  }, [sheetProgress]);

  const handlePanResponder = useMemo(
    () => PanResponder.create({
      onMoveShouldSetPanResponder: (_evt, gestureState) => {
        const vertical = Math.abs(gestureState.dy) > Math.abs(gestureState.dx);
        return vertical && Math.abs(gestureState.dy) > 6;
      },
      onMoveShouldSetPanResponderCapture: (_evt, gestureState) => {
        const vertical = Math.abs(gestureState.dy) > Math.abs(gestureState.dx);
        return vertical && Math.abs(gestureState.dy) > 6;
      },
      onPanResponderRelease: (_evt, gestureState) => {
        if (gestureState.dy < -18) {
          expandSheet();
          return;
        }
        if (gestureState.dy > 18) {
          collapseSheet();
        }
      },
      onPanResponderTerminate: (_evt, gestureState) => {
        if (gestureState.dy < -18) {
          expandSheet();
          return;
        }
        if (gestureState.dy > 18) {
          collapseSheet();
        }
      }
    }),
    [collapseSheet, expandSheet]
  );

  const topCardPanResponder = useMemo(
    () => PanResponder.create({
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        const withinTopZone = (evt?.nativeEvent?.locationY ?? Number.MAX_SAFE_INTEGER) <= TOP_DRAG_ZONE_HEIGHT;
        if (!withinTopZone) return false;
        const vertical = Math.abs(gestureState.dy) > Math.abs(gestureState.dx);
        return vertical && Math.abs(gestureState.dy) > 6;
      },
      onMoveShouldSetPanResponderCapture: (evt, gestureState) => {
        const withinTopZone = (evt?.nativeEvent?.locationY ?? Number.MAX_SAFE_INTEGER) <= TOP_DRAG_ZONE_HEIGHT;
        if (!withinTopZone) return false;
        const vertical = Math.abs(gestureState.dy) > Math.abs(gestureState.dx);
        return vertical && Math.abs(gestureState.dy) > 6;
      },
      onPanResponderRelease: (_evt, gestureState) => {
        if (gestureState.dy < -12) {
          expandSheet();
          return;
        }
        if (gestureState.dy > 12) {
          collapseSheet();
        }
      },
      onPanResponderTerminate: (_evt, gestureState) => {
        if (gestureState.dy < -12) {
          expandSheet();
          return;
        }
        if (gestureState.dy > 12) {
          collapseSheet();
        }
      }
    }),
    [collapseSheet, expandSheet]
  );

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
    } catch (err: any) {
      const msg = typeof err?.message === 'string' && err.message.trim().length > 0
        ? err.message
        : 'Failed to calculate route. Please try again.';
      setError(msg);
      Alert.alert('Error', msg);
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

  const isMock = routeResult?.source === 'mock';

  const legColors = ['#1e88e5', '#8e24aa', '#43a047', '#fb8c00'];
  const legs = Array.isArray(routeResult?.legs) ? routeResult.legs : [];
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

  const directionSteps = useMemo(() => {
    if (!routeResult) return [] as DirectionStep[];

    const formatDistance = (meters: number) => {
      if (!Number.isFinite(meters) || meters <= 0) return '0 m';
      if (meters >= 1000) return `${(meters / 1000).toFixed(1)} km`;
      return `${Math.round(meters / 10) * 10} m`;
    };

    const isValidPoint = (c: any): c is { latitude: number; longitude: number } => {
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

    const bearingDeg = (a: { latitude: number; longitude: number }, b: { latitude: number; longitude: number }) => {
      const toRad = (x: number) => (x * Math.PI) / 180;
      const toDeg = (x: number) => (x * 180) / Math.PI;

      const lat1 = toRad(a.latitude);
      const lat2 = toRad(b.latitude);
      const dLon = toRad(b.longitude - a.longitude);

      const y = Math.sin(dLon) * Math.cos(lat2);
      const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
      return (toDeg(Math.atan2(y, x)) + 360) % 360;
    };

    const normalizeTurnDelta = (nextBearing: number, prevBearing: number) => {
      let delta = nextBearing - prevBearing;
      while (delta > 180) delta -= 360;
      while (delta < -180) delta += 360;
      return delta;
    };

    const classifyTurn = (delta: number): { icon: string; text: string } | null => {
      const absDelta = Math.abs(delta);
      if (absDelta < 30) return null;
      if (absDelta >= 165) return { icon: 'backup-restore', text: 'Make a U-turn' };
      if (delta > 0) {
        if (absDelta < 60) return { icon: 'arrow-top-right', text: 'Turn slight right' };
        if (absDelta < 120) return { icon: 'arrow-right-bold', text: 'Turn right' };
        return { icon: 'arrow-bottom-right', text: 'Turn sharp right' };
      }
      if (absDelta < 60) return { icon: 'arrow-top-left', text: 'Turn slight left' };
      if (absDelta < 120) return { icon: 'arrow-left-bold', text: 'Turn left' };
      return { icon: 'arrow-bottom-left', text: 'Turn sharp left' };
    };

    const buildLegDirectionSteps = (
      coords: { latitude: number; longitude: number }[],
      destinationName: string,
      legLabel: string,
    ): DirectionStep[] => {
      if (!Array.isArray(coords) || coords.length < 2) {
        return [];
      }

      const steps: DirectionStep[] = [];
      steps.push({
        id: `${legLabel}-start`,
        icon: 'navigation-variant',
        instruction: `${legLabel}: Start on ${destinationName}`,
        turnPoint: coords[0],
      });

      let sinceLastTurnM = 0;
      for (let i = 1; i < coords.length - 1; i++) {
        const segDist = haversineM(coords[i - 1], coords[i]);
        sinceLastTurnM += segDist;

        const prevBearing = bearingDeg(coords[i - 1], coords[i]);
        const nextBearing = bearingDeg(coords[i], coords[i + 1]);
        const turnDelta = normalizeTurnDelta(nextBearing, prevBearing);
        const maneuver = classifyTurn(turnDelta);
        if (!maneuver || sinceLastTurnM < 80) {
          continue;
        }

        // Use the street name at the next turn point for clarity
        let nextStreetName = undefined;
        if (turnPointNames) {
          const nextCoord = coords[i + 1];
          if (nextCoord) {
            nextStreetName = turnPointNames[`${nextCoord.latitude},${nextCoord.longitude}`];
          }
        }
        steps.push({
          id: `${legLabel}-turn-${i}`,
          icon: maneuver.icon,
          instruction: nextStreetName
            ? `${maneuver.text.replace('Turn', 'Turn')} onto ${nextStreetName}`
            : `${maneuver.text}`,
          distanceText: `After ${formatDistance(sinceLastTurnM)}`,
          turnPoint: coords[i],
        });
        sinceLastTurnM = 0;
      }

      sinceLastTurnM += haversineM(coords[coords.length - 2], coords[coords.length - 1]);
      steps.push({
        id: `${legLabel}-arrive`,
        icon: 'flag-checkered',
        instruction: `Arrive at ${destinationName}`,
        distanceText: sinceLastTurnM > 0 ? `In ${formatDistance(sinceLastTurnM)}` : undefined,
        turnPoint: coords[coords.length - 1],
      });

      return steps;
    };

    const steps: DirectionStep[] = [];
    const legsToUse = Array.isArray(routeResult.legs) && routeResult.legs.length > 0
      ? routeResult.legs
      : [
          {
            id: 'route-main',
            origin: routeResult.origin,
            destination: routeResult.destination,
            geometry: routeResult.geometry,
          },
        ];

    legsToUse.forEach((leg, index) => {
      const coordsFromGeometry = Array.isArray(leg.geometry) ? leg.geometry.filter(isValidPoint) : [];
      const fallbackCoords = [leg.origin?.coordinates, leg.destination?.coordinates].filter(isValidPoint);
      const coords = coordsFromGeometry.length >= 2 ? coordsFromGeometry : fallbackCoords;

      const destinationName = leg.destination?.name || (index === legsToUse.length - 1 ? 'Destination' : `Stopover ${index + 1}`);
      const legLabel = legsToUse.length > 1 ? `Leg ${index + 1}` : 'Route';
      steps.push(...buildLegDirectionSteps(coords, destinationName, legLabel));
    });

    return steps;
  }, [routeResult, turnPointNames]);

  useEffect(() => {
    let cancelled = false;

    const loadTurnPointNames = async () => {
      const pending = directionSteps.filter(
        (step) =>
          !!step.turnPoint &&
          !turnPointNames[step.id],
      );
      if (pending.length === 0) return;

      const updates: Record<string, string> = {};
      for (const step of pending.slice(0, 16)) {
        if (!step.turnPoint) continue;
        try {
          const resolved = await reverseGeocodePoi(step.turnPoint.latitude, step.turnPoint.longitude);
          const label = String(resolved?.name || resolved?.address || '').trim();
          if (label) {
            updates[step.id] = label;
          }
        } catch {
          continue;
        }
      }

      if (!cancelled && Object.keys(updates).length > 0) {
        setTurnPointNames((prev) => ({ ...prev, ...updates }));
      }
    };

    void loadTurnPointNames();
    return () => {
      cancelled = true;
    };
  }, [directionSteps, turnPointNames]);

  const directionStepsWithLocationNames = useMemo(
    () =>
      directionSteps.map((step, idx, arr) => {
        // For turn instructions, use the next step's street name if available
        if (
          step.icon && [
            'arrow-top-right', 'arrow-right-bold', 'arrow-bottom-right',
            'arrow-top-left', 'arrow-left-bold', 'arrow-bottom-left',
            'backup-restore'
          ].includes(step.icon)
        ) {
          const nextStep = arr[idx + 1];
          const nextStreetName = nextStep && nextStep.turnPoint ? turnPointNames[nextStep.id] : undefined;
          if (nextStreetName) {
            return {
              ...step,
              instruction: `${step.instruction.split(' ')[0]} ${step.instruction.split(' ').slice(1).join(' ')} onto ${nextStreetName}`,
            };
          }
        }
        return step;
      }),
    [directionSteps, turnPointNames],
  );

  const instructionMarkers = useMemo(() => {
    return directionStepsWithLocationNames
      .filter((step) => !!step.turnPoint)
      .slice(0, 24)
      .map((step, index) => ({
        coordinate: step.turnPoint as { latitude: number; longitude: number },
        stepNumber: index + 1,
        title: step.instruction,
        subtitle: step.distanceText,
        icon: step.icon,
      }));
  }, [directionStepsWithLocationNames]);

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
          instructionMarkers={instructionMarkers}
          showRoute={true}
          boundaryMode="private"
          fitBoundsPadding={{ top: 64, right: 64, bottom: 520, left: 64 }}
          fitBoundsMaxZoom={11}
        />
      </View>

      {/* Bottom sheet: expands as user scrolls */}
      <Animated.View style={[styles.sheet, { height: sheetHeight }]} {...topCardPanResponder.panHandlers}>
        <Pressable
          style={styles.sheetHandleWrap}
          onPress={() => {
            if (isExpandedRef.current) {
              collapseSheet();
            } else {
              expandSheet();
            }
          }}
          {...handlePanResponder.panHandlers}
        >
          <View style={styles.sheetHandle} />
          <Text style={styles.sheetHint}>
            {sheetExpanded ? 'Tap or drag down to view the map' : 'Tap or drag up to expand'}
          </Text>
        </Pressable>

        <Animated.ScrollView
          style={styles.sheetScroll}
          contentContainerStyle={styles.sheetContent}
          showsVerticalScrollIndicator={false}
          overScrollMode="never"
          scrollEventThrottle={16}
          onScrollBeginDrag={expandSheet}
          onTouchStart={() => {
            if (!sheetExpanded) expandSheet();
          }}
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
          <Text style={styles.detailNote}>
            Fuel efficiency shown is an average value based on online data.
          </Text>

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

      <View style={styles.routeCard}>
        <Text style={styles.routeTitle}>Turn-by-turn Directions</Text>

        {directionStepsWithLocationNames.length > 0 ? (
          directionStepsWithLocationNames.map((step, idx, arr) => {
            // Step number
            const stepNum = idx + 1;
            // Determine if this is a start, turn, or arrive step
            let mainInstruction = '';
            let continueInstruction = '';
            if (idx === 0 && step.icon === 'navigation-variant') {
              // Start step
              mainInstruction = `Start from ${step.turnPoint ? turnPointNames[step.id] || 'origin' : 'origin'}`;
              continueInstruction = arr[idx + 1]?.distanceText ? `Continue for ${arr[idx + 1].distanceText}` : '';
            } else if (step.icon === 'flag-checkered') {
              // Arrive step
              mainInstruction = `Arrive at ${step.turnPoint ? turnPointNames[step.id] || 'destination' : 'destination'}`;
              continueInstruction = '';
            } else {
              // Turn step
              // Extract direction from instruction
              const direction = step.instruction.split(' ')[1] ? step.instruction.split(' ')[1] : '';
              const nextStreet = (() => {
                // Try to get next street name
                const nextStep = arr[idx + 1];
                if (nextStep && nextStep.turnPoint) {
                  return turnPointNames[nextStep.id] || '';
                }
                return '';
              })();
              mainInstruction = `${step.instruction.split(' ')[0]} ${direction} onto ${nextStreet}`;
              continueInstruction = arr[idx + 1]?.distanceText ? `Continue for ${arr[idx + 1].distanceText}` : '';
            }
            return (
              <View key={step.id} style={styles.directionRow}>
                <View style={styles.directionIconWrap}>
                  <MaterialCommunityIcons name={step.icon as any} size={18} color={colors.primary} />
                </View>
                <View style={styles.directionTextWrap}>
                  <Text style={styles.directionInstruction}>{`🔹 Step ${stepNum}`}</Text>
                  <Text style={styles.directionInstruction}>{mainInstruction}</Text>
                  {continueInstruction ? (
                    <Text style={styles.directionDistance}>{continueInstruction}</Text>
                  ) : null}
                </View>
              </View>
            );
          })
        ) : (
          <Text style={styles.directionFallbackText}>Directions will appear once route geometry is available.</Text>
        )}
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
  detailNote: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginTop: -spacing.xs,
    marginBottom: spacing.md,
    marginLeft: 36,
    fontStyle: 'italic'
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
  directionRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  directionIconWrap: {
    width: 30,
    height: 30,
    borderRadius: borderRadius.round,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  directionTextWrap: {
    flex: 1,
    marginLeft: spacing.md,
  },
  directionDistance: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  directionInstruction: {
    fontSize: fontSize.md,
    color: colors.textPrimary,
    fontWeight: '500',
  },
  directionFallbackText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
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

