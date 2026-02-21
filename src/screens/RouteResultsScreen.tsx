import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, Alert, Animated, Dimensions, Pressable, FlatList, ListRenderItem, Platform, PanResponder } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '@navigation/types';
import { Route } from '@/types';
import { useApp } from '@context/AppContext';
import RouteCard from '@components/RouteCard';
import MapViewComponent from '@components/MapViewComponent';
import { Button, ActivityIndicator } from 'react-native-paper';
import LogoLoadingScreen from '@components/LogoLoadingScreen';
import { fetchRoutes, fetchRouteGeometry, pingBackend } from '@services/api';
import { formatTimeRange } from '@/utils/helpers';
import { borderRadius, fontSize, shadows, spacing, type ThemeColors } from '@/utils/theme';
import { useThemeMode } from '@context/ThemeContext';
type RouteResultsRouteProp = RouteProp<RootStackParamList, 'RouteResults'>;
type RouteResultsNavigationProp = StackNavigationProp<RootStackParamList, 'RouteResults'>;

const RouteResultsScreen: React.FC = () => {
  const { colors } = useThemeMode();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const navigation = useNavigation<RouteResultsNavigationProp>();
  const route = useRoute<RouteResultsRouteProp>();
  const { origin, destination, preference, budget, maxTransfers, preferredModes } = route.params;
  const { isLoading, setIsLoading } = useApp();
  
  const [routes, setRoutes] = useState<Route[]>([]);
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);
  const [selectedRouteGeometry, setSelectedRouteGeometry] = useState<Route | null>(null);
  const hasFetchedRef = useRef<boolean>(false);
  const isMountedRef = useRef<boolean>(true);
  const [isGeometryLoading, setIsGeometryLoading] = useState<boolean>(false);
  const geometryCacheRef = useRef<Map<string, Route>>(new Map());
  const [sheetExpanded, setSheetExpanded] = useState<boolean>(true);

  const sortRoutesByPreference = useCallback((items: Route[]) => {
    const sorted = [...items];
    sorted.sort((a, b) => {
      const timeDelta = a.totalTime - b.totalTime;
      const fareDelta = a.totalFare - b.totalFare;
      const transferDelta = a.totalTransfers - b.totalTransfers;

      if (preference === 'shortest_time') {
        return timeDelta || transferDelta || fareDelta;
      }

      if (preference === 'lowest_fare') {
        return fareDelta || timeDelta || transferDelta;
      }

      if (preference === 'fewest_transfers') {
        return transferDelta || timeDelta || fareDelta;
      }

      // balanced / recommended: prioritize fuzzy score, then prefer quicker routes on ties.
      const fuzzyA = Number(a.fuzzyScore || 0);
      const fuzzyB = Number(b.fuzzyScore || 0);
      const fuzzyDelta = fuzzyB - fuzzyA;
      return fuzzyDelta || timeDelta || fareDelta || transferDelta;
    });
    return sorted;
  }, [preference]);

  const sheetProgress = useRef(new Animated.Value(1)).current; // 0=collapsed, 1=expanded
  const isExpandedRef = useRef<boolean>(true);
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

  const selectedRoute = useMemo(() => {
    if (!selectedRouteId) return null;
    const base = routes.find((r) => r.id === selectedRouteId);
    if (!base) return null;
    return selectedRouteGeometry?.id === selectedRouteId ? selectedRouteGeometry : base;
  }, [routes, selectedRouteGeometry, selectedRouteId]);

  const cacheRouteGeometry = useCallback((updatedRoute: Route) => {
    const cache = geometryCacheRef.current;
    cache.delete(updatedRoute.id);
    cache.set(updatedRoute.id, updatedRoute);
    const maxCachedRoutes = 2;
    while (cache.size > maxCachedRoutes) {
      const oldestKey = cache.keys().next().value as string | undefined;
      if (!oldestKey) break;
      cache.delete(oldestKey);
    }
  }, []);

  useEffect(() => {
    const geometryCache = geometryCacheRef.current;
    return () => {
      isMountedRef.current = false;
      geometryCache.clear();
    };
  }, []);

  const loadRoutes = useCallback(async () => {
    try {
      setIsLoading(true);
      // Quick reachability check to avoid confusing network errors
      const ok = await pingBackend();
      if (!ok) {
        if (!isMountedRef.current) return;
        setRoutes([]);
        return;
      }
      const data = await fetchRoutes(origin, destination, preference, {
        budget,
        maxTransfers,
        preferredModes
      });
      if (!isMountedRef.current) return;
      const sortedRoutes = sortRoutesByPreference(data);
      setRoutes(sortedRoutes);
      geometryCacheRef.current.clear();
      setSelectedRouteGeometry(null);
      setSelectedRouteId(null);
    } catch {
      if (!isMountedRef.current) return;
      setRoutes([]);
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [budget, destination, maxTransfers, origin, preference, preferredModes, setIsLoading, sortRoutesByPreference]);

  useEffect(() => {
    // Guard against duplicate fetches caused by re-mounts or fast refresh
    if (hasFetchedRef.current) return;
    hasFetchedRef.current = true;
    void loadRoutes();
  }, [loadRoutes]);

  const handleSelectRoute = useCallback(async (route: Route) => {
    setSelectedRouteId(route.id);
    // Fetch accurate polylines on demand (on tap).
    // Even if compact mode returned preview geometry, we still fetch full per-leg geometry once.
    try {
      const isSameSelection = selectedRouteId === route.id;
      const cached = geometryCacheRef.current.get(route.id);
      if (cached && !isSameSelection) {
        if (!isMountedRef.current) return;
        setSelectedRouteGeometry(cached);
        return;
      }

      setSelectedRouteGeometry(null);
      setIsGeometryLoading(true);
      // If the user taps the already-selected route again, treat it as a manual refresh.
      // This helps when backend geometry/caches have changed.
      const updated = await fetchRouteGeometry(route);
      if (!isMountedRef.current) return;
      cacheRouteGeometry(updated);
      setSelectedRouteGeometry(updated);
    } catch (e) {
      if (!isMountedRef.current) return;
      console.warn('[RouteResults] Failed to fetch route geometry:', e);
      Alert.alert('Map preview unavailable', 'Could not load the route polyline. Please try selecting the route again.');
    } finally {
      if (isMountedRef.current) {
        setIsGeometryLoading(false);
      }
    }
  }, [cacheRouteGeometry, selectedRouteId]);

  const keyExtractor = useCallback((item: Route) => item.id, []);

  const renderRouteItem: ListRenderItem<Route> = useCallback(({ item, index }) => (
    <RouteCard
      route={item}
      isSelected={selectedRoute?.id === item.id}
      rank={index + 1}
      onSelect={handleSelectRoute}
      onViewMap={collapseSheet}
    />
  ), [collapseSheet, handleSelectRoute, selectedRoute?.id]);

  

  if (isLoading) {
    return <LogoLoadingScreen message="Finding the best routes" />;
  }

  if (routes.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <View style={styles.mapContainer}>
          <MapViewComponent 
            origin={origin}
            destination={destination}
            boundaryMode="public"
          />
        </View>
        <View style={styles.emptyContent}>
          <Text style={styles.emptyTitle}>No Routes Found</Text>
          <Text style={styles.emptyText}>
            We couldn't find any routes for your selected preference and locations.
          </Text>
          <Button
            mode="contained"
            onPress={() => navigation.goBack()}
            style={styles.retryButton}
            labelStyle={styles.retryButtonLabel}
          >
            Try Again
          </Button>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Map as full-screen background */}
      <View style={StyleSheet.absoluteFillObject}>
        <MapViewComponent
          origin={origin}
          destination={destination}
          route={selectedRoute}
          boundaryMode="public"
          fitBoundsPadding={{ top: 64, right: 64, bottom: 520, left: 64 }}
          fitBoundsMaxZoom={11}
        />
        {isGeometryLoading && (
          <View style={styles.mapOverlay}>
            <ActivityIndicator size="small" color="#3498db" />
            <Text style={styles.mapOverlayText}>Loading route on map…</Text>
          </View>
        )}
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

        <FlatList
          style={styles.routesList}
          contentContainerStyle={styles.routesListContent}
          data={routes}
          keyExtractor={keyExtractor}
          renderItem={renderRouteItem}
          removeClippedSubviews={Platform.OS === 'android'}
          initialNumToRender={4}
          maxToRenderPerBatch={4}
          updateCellsBatchingPeriod={40}
          windowSize={5}
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
        />

        {!selectedRoute && (
          <View style={styles.footer}>
            <Text style={styles.summaryTitle}>Trip Summary</Text>
            <Text style={styles.summaryEmptyHint}>Select one route result first to view steps and trip summary.</Text>
            
          </View>
        )}

        {selectedRoute && (
          <View style={styles.footer}>
            <Text style={styles.summaryTitle}>Selected Route</Text>
            <View style={styles.summaryRow}>
              <View style={[styles.summaryItem, styles.summaryItemDivider]}>
                <Text style={styles.summaryLabel}>Fare</Text>
                <Text style={styles.summaryValue}>₱{selectedRoute.totalFare.toFixed(2)}</Text>
              </View>
              <View style={[styles.summaryItem, styles.summaryItemDivider]}>
                <Text style={styles.summaryLabel}>Time</Text>
                <Text style={styles.summaryValue}>{formatTimeRange(selectedRoute.totalTime)}</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Transfers</Text>
                <Text style={styles.summaryValue}>
                  {selectedRoute.totalTransfers === 0
                    ? 'No transfers'
                    : `${selectedRoute.totalTransfers} transfer${selectedRoute.totalTransfers === 1 ? '' : 's'}`}
                </Text>
              </View>
            </View>
            
          </View>
        )}
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
    marginTop: 16,
    fontSize: 16,
    color: colors.textSecondary
  },
  emptyContainer: {
    flex: 1,
    backgroundColor: colors.background
  },
  mapContainer: {
    height: 300,
    margin: spacing.lg,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    ...shadows.small
  },
  emptyContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40
  },
  emptyTitle: {
    fontSize: fontSize.title,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginTop: 16
  },
  emptyText: {
    fontSize: fontSize.lg,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 24
  },
  retryButton: {
    borderRadius: borderRadius.xl,
    backgroundColor: colors.primary
  },
  retryButtonLabel: {
    color: colors.textWhite,
    fontWeight: '700'
  },
  mapOverlay: {
    position: 'absolute',
    right: 12,
    top: 12,
    backgroundColor: colors.white,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  mapOverlayText: {
    fontSize: fontSize.sm,
    color: colors.textPrimary
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
  routesList: {
    flex: 1
  },
  routesListContent: {
    padding: spacing.lg,
    paddingBottom: spacing.sm
  },
  footer: {
    backgroundColor: colors.white,
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.gray6
  },
  summaryTitle: {
    fontSize: fontSize.sm,
    fontWeight: '700',
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.4
  },
  summaryEmptyHint: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  summaryRow: {
    flexDirection: 'row',
    backgroundColor: colors.gray7,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.gray6,
    overflow: 'hidden',
    marginBottom: 16
  },
  summaryItem: {
    flex: 1,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    minHeight: 74,
    justifyContent: 'center',
    alignItems: 'center'
  },
  summaryItemDivider: {
    borderRightWidth: 1,
    borderRightColor: colors.gray6
  },
  summaryLabel: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    fontWeight: '600',
    marginBottom: 4
  },
  summaryValue: {
    fontSize: fontSize.md,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'center'
  },
  continueButton: {
    borderRadius: borderRadius.xl,
    backgroundColor: colors.primary
  },
  continueButtonDisabled: {
    borderRadius: borderRadius.xl,
    backgroundColor: colors.gray5
  }
});

export default RouteResultsScreen;

