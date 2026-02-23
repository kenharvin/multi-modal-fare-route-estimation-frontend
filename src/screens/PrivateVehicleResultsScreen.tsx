import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, Animated, Dimensions, Pressable, PanResponder } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '@navigation/types';
import { PrivateVehicleRoute } from '@/types';
import { useApp } from '@context/AppContext';
import { useLocation } from '@context/LocationContext';
import { Button } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { calculatePrivateVehicleRoute } from '@services/api';
import { reverseGeocodePoi } from '@services/api';
import MapViewComponent from '@components/MapViewComponent';
import LogoLoadingScreen from '@components/LogoLoadingScreen';
import { formatArrivalTimeRange, formatTimeRange } from '@/utils/helpers';
import { createPrivateVehicleResultsScreenStyles } from '@/styles/screens/privateVehicleResultsScreen.styles';
import { useThemeMode } from '@context/ThemeContext';
type PrivateVehicleResultsRouteProp = RouteProp<RootStackParamList, 'PrivateVehicleResults'>;
type PrivateVehicleResultsNavigationProp = StackNavigationProp<RootStackParamList, 'PrivateVehicleResults'>;

type DirectionStep = {
  id: string;
  icon: string;
  instruction: string;
  stepType?: string;
  distanceText?: string;
  turnPoint?: { latitude: number; longitude: number };
};

const LEG_COLORS = ['#1e88e5', '#8e24aa', '#43a047', '#fb8c00'];

const PrivateVehicleResultsScreen: React.FC = () => {
  const { colors } = useThemeMode();
  const styles = useMemo(() => createPrivateVehicleResultsScreenStyles(colors), [colors]);

  const navigation = useNavigation<PrivateVehicleResultsNavigationProp>();
  const route = useRoute<PrivateVehicleResultsRouteProp>();
  const { origin, destination, vehicle, fuelPrice, stopovers, preferences } = route.params;
  const { isLoading, setIsLoading, setError } = useApp();
  const { clearSelectedLocations } = useLocation();
  
  const [routeResult, setRouteResult] = useState<PrivateVehicleRoute | null>(null);
  const [routeErrorMessage, setRouteErrorMessage] = useState<string | null>(null);
  const [sheetExpanded, setSheetExpanded] = useState<boolean>(false);
  const [turnPointNames, setTurnPointNames] = useState<Record<string, string>>({});
  const [isResolvingDirectionDetails, setIsResolvingDirectionDetails] = useState<boolean>(false);
  const reverseGeocodeCacheRef = useRef<Record<string, string>>({});

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
      setRouteErrorMessage(null);
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
        : 'No route found for the selected locations. Please try nearby points.';
      setRouteResult(null);
      setRouteErrorMessage(msg);
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, [destination, fuelPrice, origin, preferences, setError, setIsLoading, stopovers, vehicle]);

  useEffect(() => {
    void calculateRoute();
  }, [calculateRoute]);

  const handleCalculateAnotherRoute = useCallback(() => {
    clearSelectedLocations();
    navigation.navigate('PrivateVehicle');
  }, [clearSelectedLocations, navigation]);

  

  const isMock = routeResult?.source === 'mock';

  const legColors = LEG_COLORS;
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

  const haversineM = useCallback((a: { latitude: number; longitude: number }, b: { latitude: number; longitude: number }) => {
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
  }, []);

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

  const formatStepDistance = (meters: number) => {
    if (!Number.isFinite(meters) || meters <= 0) return undefined;
    if (meters >= 1000) return `${(meters / 1000).toFixed(1)} km`;
    return `${Math.max(10, Math.round(meters / 10) * 10)} m`;
  };

  const parseLegIndex = (stepId?: string): number | null => {
    const match = String(stepId || '').match(/leg-(\d+)-/i);
    if (!match) return null;
    const idx = Number(match[1]);
    return Number.isFinite(idx) ? idx : null;
  };

  const directionSteps = useMemo(() => {
    if (!routeResult) return [] as DirectionStep[];

    const turnIcons = new Set([
      'arrow-top-right',
      'arrow-right-bold',
      'arrow-bottom-right',
      'arrow-top-left',
      'arrow-left-bold',
      'arrow-bottom-left',
      'backup-restore',
    ]);

    const isTurnStep = (step: DirectionStep) => {
      const stepType = String(step.stepType || '').toLowerCase();
      return stepType === 'turn' || stepType === 'uturn' || turnIcons.has(step.icon);
    };

    if (Array.isArray(routeResult.directionSteps) && routeResult.directionSteps.length > 0) {
      return routeResult.directionSteps
        .map((step, idx) => ({
        id: `${step.id || 'backend-step'}-${idx}`,
        icon: step.icon || 'arrow-up-bold',
        instruction: step.instruction || 'Continue straight',
        stepType: step.stepType,
        distanceText: step.distanceText,
        turnPoint: step.turnPoint,
        }))
        .filter(isTurnStep);
    }

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
      if (absDelta < 22) return null;
      if (absDelta >= 150) return { icon: 'backup-restore', text: 'Make a U-turn' };
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
      legLabel: string,
    ): DirectionStep[] => {
      if (!Array.isArray(coords) || coords.length < 2) {
        return [];
      }

      const steps: DirectionStep[] = [];
      let sinceLastTurnM = 0;
      let sinceLastStepM = 0;
      const MIN_STEP_GAP_M = 25;

      for (let i = 1; i < coords.length - 1; i++) {
        const segDist = haversineM(coords[i - 1], coords[i]);
        sinceLastTurnM += segDist;
        sinceLastStepM += segDist;

        const prevBearing = bearingDeg(coords[i - 1], coords[i]);
        const nextBearing = bearingDeg(coords[i], coords[i + 1]);
        const turnDelta = normalizeTurnDelta(nextBearing, prevBearing);
        const absTurnDelta = Math.abs(turnDelta);
        const maneuver = classifyTurn(turnDelta);
        const isUturn = maneuver?.icon === 'backup-restore';
        const requiredGap = isUturn ? 8 : absTurnDelta >= 80 ? 10 : MIN_STEP_GAP_M;

        if (maneuver && sinceLastTurnM >= requiredGap) {
          steps.push({
            id: `${legLabel}-turn-${i}`,
            icon: maneuver.icon,
            instruction: maneuver.text,
            stepType: maneuver.icon === 'backup-restore' ? 'uturn' : 'turn',
            distanceText: `${formatDistance(sinceLastStepM)}`,
            turnPoint: coords[i],
          });
          sinceLastTurnM = 0;
          sinceLastStepM = 0;
          continue;
        }
      }

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

      const legLabel = legsToUse.length > 1 ? `Leg ${index + 1}` : 'Route';
      steps.push(...buildLegDirectionSteps(coords, legLabel));
    });

    return steps.filter(isTurnStep);
  }, [haversineM, routeResult]);

  useEffect(() => {
    let cancelled = false;

    const loadTurnPointNames = async () => {
      const coordKey = (lat: number, lon: number) => `${lat.toFixed(5)},${lon.toFixed(5)}`;
      const pending = directionSteps.filter(
        (step) =>
          !!step.turnPoint &&
          !turnPointNames[step.id],
      );
      if (pending.length === 0) {
        setIsResolvingDirectionDetails(false);
        return;
      }

      const updates: Record<string, string> = {};

      const unresolvedByCoord: Record<string, { lat: number; lon: number; stepIds: string[] }> = {};
      for (const step of pending.slice(0, 24)) {
        if (!step.turnPoint) continue;
        const key = coordKey(step.turnPoint.latitude, step.turnPoint.longitude);
        const cached = reverseGeocodeCacheRef.current[key];
        if (cached) {
          updates[step.id] = cached;
          continue;
        }
        if (!unresolvedByCoord[key]) {
          unresolvedByCoord[key] = {
            lat: step.turnPoint.latitude,
            lon: step.turnPoint.longitude,
            stepIds: [],
          };
        }
        unresolvedByCoord[key].stepIds.push(step.id);
      }

      const unresolvedEntries = Object.entries(unresolvedByCoord).slice(0, 8);
      if (unresolvedEntries.length > 0) {
        setIsResolvingDirectionDetails(true);
        await Promise.allSettled(
          unresolvedEntries.map(async ([key, val]) => {
            const resolved = await reverseGeocodePoi(val.lat, val.lon);
            const label = String(resolved?.name || resolved?.address || '').trim();
            if (label) {
              reverseGeocodeCacheRef.current[key] = label;
            }
          })
        );
      }

      for (const [key, val] of unresolvedEntries) {
        const label = reverseGeocodeCacheRef.current[key];
        if (!label) continue;
        for (const id of val.stepIds) {
          updates[id] = label;
        }
      }

      if (!cancelled && Object.keys(updates).length > 0) {
        setTurnPointNames((prev) => ({ ...prev, ...updates }));
      }

      if (!cancelled) {
        setIsResolvingDirectionDetails(false);
      }
    };

    void loadTurnPointNames();
    return () => {
      cancelled = true;
    };
  }, [directionSteps, turnPointNames]);

  const legGeometryMap = useMemo(() => {
    const map: Record<number, { latitude: number; longitude: number }[]> = {};
    if (!routeResult) return map;

    const legsToUse = Array.isArray(routeResult.legs) ? routeResult.legs : [];
    legsToUse.forEach((leg, idx) => {
      const coords = Array.isArray(leg.geometry) ? leg.geometry.filter(isValidCoord) : [];
      if (coords.length >= 2) {
        map[idx] = coords;
      }
    });

    return map;
  }, [routeResult]);

  const distanceAlongLegGeometryM = useCallback(
    (
      stepA: DirectionStep,
      stepB: DirectionStep,
    ): number | null => {
      if (!stepA.turnPoint || !stepB.turnPoint) return null;

      const legA = parseLegIndex(stepA.id);
      const legB = parseLegIndex(stepB.id);
      if (legA === null || legB === null || legA !== legB) {
        return haversineM(stepA.turnPoint, stepB.turnPoint);
      }

      const coords = legGeometryMap[legA];
      if (!Array.isArray(coords) || coords.length < 2) {
        return haversineM(stepA.turnPoint, stepB.turnPoint);
      }

      const nearestIdx = (point: { latitude: number; longitude: number }) => {
        let bestIdx = 0;
        let bestDist = Number.POSITIVE_INFINITY;
        for (let i = 0; i < coords.length; i++) {
          const d = haversineM(point, coords[i]);
          if (d < bestDist) {
            bestDist = d;
            bestIdx = i;
          }
        }
        return bestIdx;
      };

      const aIdx = nearestIdx(stepA.turnPoint);
      const bIdx = nearestIdx(stepB.turnPoint);
      const start = Math.min(aIdx, bIdx);
      const end = Math.max(aIdx, bIdx);
      if (end <= start) {
        return haversineM(stepA.turnPoint, stepB.turnPoint);
      }

      let total = 0;
      for (let i = start; i < end; i++) {
        total += haversineM(coords[i], coords[i + 1]);
      }
      return total > 0 ? total : haversineM(stepA.turnPoint, stepB.turnPoint);
    },
    [haversineM, legGeometryMap],
  );

  const directionStepsWithLocationNames = useMemo(
    () =>
      directionSteps.map((step, idx, arr) => {
        const turnIcons = new Set([
          'arrow-top-right', 'arrow-right-bold', 'arrow-bottom-right',
          'arrow-top-left', 'arrow-left-bold', 'arrow-bottom-left',
          'backup-restore',
        ]);

        let previousVisibleDistanceText = step.distanceText;
        const prevStep = arr[idx - 1];
        if (prevStep) {
          const distM = distanceAlongLegGeometryM(prevStep, step);
          const formatted = formatStepDistance(Number(distM || 0));
          if (formatted) {
            previousVisibleDistanceText = formatted;
          }
        }

        // For turn instructions, use this step's turn-point street name.
        if (step.icon && turnIcons.has(step.icon) && !step.instruction.includes(' onto ')) {
          const currentStreetName = step.turnPoint ? turnPointNames[step.id] : undefined;
          if (currentStreetName) {
            return {
              ...step,
              distanceText: previousVisibleDistanceText,
              instruction: `${step.instruction} onto ${currentStreetName}`,
            };
          }
        }
        return {
          ...step,
          distanceText: previousVisibleDistanceText,
        };
      }),
    [directionSteps, distanceAlongLegGeometryM, turnPointNames],
  );

  const instructionMarkers = useMemo(() => {
    // Group steps by rounded coordinate to detect overlaps
    const steps = directionStepsWithLocationNames
      .filter((step) => !!step.turnPoint);

    // Helper to round coordinates for grouping (about ~1m precision)
    const roundCoord = (c: { latitude: number; longitude: number }) =>
      `${c.latitude.toFixed(5)},${c.longitude.toFixed(5)}`;

    // Group steps by location
    const grouped: Record<string, typeof steps> = {};
    steps.forEach((step) => {
      const key = roundCoord(step.turnPoint!);
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(step);
    });

    // Offset overlapping markers side by side
    const OFFSET_M = 8; // meters
    const EARTH_RADIUS = 6378137;
    const offsetCoord = (c: { latitude: number; longitude: number }, idx: number, total: number) => {
      if (total === 1) return c;
      // Offset east-west (longitude) direction
      const offsetMeters = (idx - (total - 1) / 2) * OFFSET_M;
      const dLon = (offsetMeters / (EARTH_RADIUS * Math.cos((Math.PI * c.latitude) / 180))) * (180 / Math.PI);
      return {
        latitude: c.latitude,
        longitude: c.longitude + dLon,
      };
    };

    let markerIdx = 1;
    const markers: {
      coordinate: { latitude: number; longitude: number };
      stepNumber: number;
      title: string;
      subtitle: string;
      icon: string;
      label?: string;
      popupTitle?: string;
      color?: string;
    }[] = [];

    const legColorFor = (legIndex: number | null) => {
      if (legIndex === null || legIndex < 0) return colors.primary;
      return legColors[legIndex % legColors.length];
    };

    const turnItems = steps.map((step) => {
      const legIndex = parseLegIndex(step.id);
      return {
        ...step,
        legIndex,
        markerColor: legColorFor(legIndex),
      };
    });

    if (routeResult?.origin?.coordinates && isValidCoord(routeResult.origin.coordinates)) {
      markers.push({
        coordinate: routeResult.origin.coordinates,
        stepNumber: markerIdx,
        title: 'Start',
        subtitle: routeResult.origin.name ? `From ${routeResult.origin.name}` : 'From origin',
        icon: 'navigation-variant',
        label: 'S',
        popupTitle: 'Start',
        color: legColorFor(0),
      });
      markerIdx += 1;
    }

    const nudgeLongitude = (c: { latitude: number; longitude: number }, metersEast: number) => {
      const earthRadius = 6378137;
      const dLon = (metersEast / (earthRadius * Math.cos((Math.PI * c.latitude) / 180))) * (180 / Math.PI);
      return {
        latitude: c.latitude,
        longitude: c.longitude + dLon,
      };
    };

    const stopoverCount = Array.isArray(routeResult?.stopovers) ? routeResult.stopovers.length : 0;
    const totalLegs = Math.max(1, Number(routeResult?.legs?.length || stopoverCount + 1));

    const turnsByLeg: Record<number, typeof turnItems> = {};
    turnItems.forEach((item) => {
      if (!item.turnPoint) return;
      if (item.legIndex === null || item.legIndex < 0) return;
      if (!turnsByLeg[item.legIndex]) turnsByLeg[item.legIndex] = [];
      turnsByLeg[item.legIndex].push(item);
    });

    for (let legIdx = 0; legIdx < totalLegs; legIdx += 1) {
      const legTurns = turnsByLeg[legIdx] || [];

      const groupedTurnItemsByPoint: Record<string, typeof legTurns> = {};
      legTurns.forEach((item) => {
        if (!item.turnPoint) return;
        const key = roundCoord(item.turnPoint);
        if (!groupedTurnItemsByPoint[key]) groupedTurnItemsByPoint[key] = [];
        groupedTurnItemsByPoint[key].push(item);
      });

      legTurns.forEach((item) => {
        if (!item.turnPoint) return;
        const key = roundCoord(item.turnPoint);
        const group = groupedTurnItemsByPoint[key] || [item];
        const idxInGroup = group.findIndex((x) => x.id === item.id);
        markers.push({
          coordinate: offsetCoord(item.turnPoint, idxInGroup < 0 ? 0 : idxInGroup, group.length),
          stepNumber: markerIdx,
          title: item.distanceText ? `After ${item.distanceText}` : '',
          subtitle: item.instruction,
          icon: item.icon,
          color: item.markerColor,
        });
        markerIdx += 1;
      });

      if (legIdx < stopoverCount) {
        const stopover = routeResult?.stopovers?.[legIdx]?.location;
        if (stopover?.coordinates && isValidCoord(stopover.coordinates)) {
          const hasMultipleStopovers = stopoverCount >= 2;

          markers.push({
            coordinate: hasMultipleStopovers ? nudgeLongitude(stopover.coordinates, -7) : stopover.coordinates,
            stepNumber: markerIdx,
            title: `Reached stopover ${legIdx + 1}`,
            subtitle: stopover.name || `Stopover ${legIdx + 1}`,
            icon: 'map-marker-check',
            label: hasMultipleStopovers ? `P${legIdx + 1}S` : `P${legIdx + 1}`,
            popupTitle: `Stopover ${legIdx + 1} start`,
            color: legColorFor(legIdx),
          });
          markerIdx += 1;

          // For 2+ stopovers, add an explicit end/depart marker for each stopover
          // except the last, which naturally ends with destination.
          if (hasMultipleStopovers && legIdx < stopoverCount - 1) {
            markers.push({
              coordinate: nudgeLongitude(stopover.coordinates, 7),
              stepNumber: markerIdx,
              title: `Leave stopover ${legIdx + 1}`,
              subtitle: `Continue to next leg`,
              icon: 'map-marker-right',
              label: `P${legIdx + 1}E`,
              popupTitle: `Stopover ${legIdx + 1} end`,
              color: legColorFor(legIdx + 1),
            });
            markerIdx += 1;
          }
        }
      }
    }

    if (routeResult?.destination?.coordinates && isValidCoord(routeResult.destination.coordinates)) {
      const endLegIndex = Math.max(0, (routeResult?.legs?.length || 1) - 1);
      markers.push({
        coordinate: routeResult.destination.coordinates,
        stepNumber: markerIdx,
        title: 'Arrive at destination',
        subtitle: routeResult.destination.name || 'Destination',
        icon: 'flag-checkered',
        label: 'E',
        popupTitle: 'End',
        color: legColorFor(endLegIndex),
      });
    }

    return markers;
  }, [colors.primary, directionStepsWithLocationNames, legColors, routeResult]);

  const instructionListItems = useMemo(
    () => [...instructionMarkers].sort((a, b) => a.stepNumber - b.stepNumber),
    [instructionMarkers],
  );

  if (isLoading) {
    return <LogoLoadingScreen message="Calculating route and fuel cost" />;
  }

  if (!routeResult) {
    return (
      <View style={styles.emptyContainer}>
        <Text>SEARCH</Text>
        <Text style={styles.emptyTitle}>No Route Found</Text>
        {!!routeErrorMessage && (
          <Text style={styles.warningText}>{routeErrorMessage}</Text>
        )}
        <Button
          mode="contained"
          onPress={handleCalculateAnotherRoute}
          style={styles.retryButton}
        >
          Calculate Another Route
        </Button>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Map as full-screen background */}
      <View style={styles.mapFill}>
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
          {isResolvingDirectionDetails && (
            <View style={styles.warningCard}>
              <Text style={styles.warningTitle}>Getting your directions ready…</Text>
              <Text style={styles.warningText}>
                Adding street names to your turn-by-turn steps.
              </Text>
            </View>
          )}

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
                        <View style={styles.verticalDivider} />
                        <View style={styles.legMetricItem}>
                          <Text style={styles.legMetricLabel}>Speed</Text>
                          <Text style={styles.legMetricValue}>
                            {speedKph ? `${speedKph.toFixed(1)} km/h` : '—'}
                          </Text>
                        </View>
                        <View style={styles.verticalDivider} />
                        <View style={styles.legMetricItem}>
                          <Text style={styles.legMetricLabel}>Time</Text>
                          <Text style={styles.legMetricValue}>{formatTimeRange(Math.round(timeMin))}</Text>
                        </View>
                      </View>
                      
                      <View style={styles.legMetaRow}>
                        <Text style={styles.legMetaText}>Distance: {dist.toFixed(1)} km | </Text>
                        <Text style={styles.legMetaText}>ETA: {etaRange}</Text>
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

        {instructionListItems.length > 0 ? (
          instructionListItems.map((item, idx) => {
            return (
              <View key={`instruction-list-${item.stepNumber}-${idx}`} style={styles.directionRow}>
                <View style={styles.directionIconWrap}>
                  <MaterialCommunityIcons name={item.icon as any} size={18} color={item.color || colors.primary} />
                </View>
                <View style={styles.directionTextWrap}>
                  <Text style={styles.directionInstruction}>{`🔹 Step ${item.stepNumber}`}</Text>
                  {!!item.title && (
                    <Text style={styles.directionDistance}>{item.title}</Text>
                  )}
                  {!!item.subtitle ? (
                    <Text style={styles.directionInstruction}>{item.subtitle}</Text>
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

      <View style={styles.footer}>
        <Button mode="outlined" onPress={handleCalculateAnotherRoute} style={styles.saveButton}>
          Calculate Another Route
        </Button>
      </View>

          
        </Animated.ScrollView>
      </Animated.View>
    </View>
  );
};

export default PrivateVehicleResultsScreen;

