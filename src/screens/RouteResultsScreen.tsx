import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, Alert, Animated, Dimensions, Pressable } from 'react-native';
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
  const { isLoading, setIsLoading, setError } = useApp();
  
  const [routes, setRoutes] = useState<Route[]>([]);
  const [selectedRoute, setSelectedRoute] = useState<Route | null>(null);
  const hasFetchedRef = useRef<boolean>(false);
  const [isGeometryLoading, setIsGeometryLoading] = useState<boolean>(false);
  const [geometryFetchedIds, setGeometryFetchedIds] = useState<Set<string>>(new Set());
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

  const loadRoutes = useCallback(async () => {
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
    } catch {
      setError('Failed to fetch routes. Please try again.');
      Alert.alert('Error', 'Failed to fetch routes');
    } finally {
      setIsLoading(false);
    }
  }, [budget, destination, maxTransfers, origin, preference, preferredModes, setError, setIsLoading]);

  useEffect(() => {
    // Guard against duplicate fetches caused by re-mounts or fast refresh
    if (hasFetchedRef.current) return;
    hasFetchedRef.current = true;
    void loadRoutes();
  }, [loadRoutes]);

  const handleSelectRoute = async (route: Route) => {
    setSelectedRoute(route);
    // Fetch accurate polylines on demand (on tap).
    // Even if compact mode returned preview geometry, we still fetch full per-leg geometry once.
    try {
      setIsGeometryLoading(true);
      const isSameSelection = selectedRoute?.id === route.id;
      // If the user taps the already-selected route again, treat it as a manual refresh.
      // This helps when backend geometry/caches have changed.
      if (!geometryFetchedIds.has(route.id) || isSameSelection) {
        const updated = await fetchRouteGeometry(route);
        setSelectedRoute(updated);
        setRoutes(prev => prev.map(r => (r.id === route.id ? updated : r)));
        setGeometryFetchedIds(prev => {
          const next = new Set(prev);
          next.add(route.id);
          return next;
        });
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
    return <LogoLoadingScreen message="Finding the best routes" />;
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
      {/* Map as full-screen background */}
      <View style={StyleSheet.absoluteFillObject}>
        <MapViewComponent
          origin={origin}
          destination={destination}
          route={selectedRoute}
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
          style={styles.routesList}
          contentContainerStyle={styles.routesListContent}
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
          {routes.map((r, index) => (
            <RouteCard
              key={r.id}
              route={r}
              isSelected={selectedRoute?.id === r.id}
              rank={index + 1}
              onSelect={() => handleSelectRoute(r)}
            />
          ))}
        </Animated.ScrollView>

        {selectedRoute && (
          <View style={styles.footer}>
            <View style={styles.summaryRow}>
              <View style={styles.summaryItem}>
                <Text>$</Text>
                <Text style={styles.summaryValue}>₱{selectedRoute.totalFare.toFixed(2)}</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text>T</Text>
                <Text style={styles.summaryValue}>{formatTimeRange(selectedRoute.totalTime)}</Text>
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
    borderRadius: borderRadius.xl
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
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16
  },
  summaryItem: {
    alignItems: 'center'
  },
  summaryValue: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.textPrimary,
    marginTop: 4
  },
  continueButton: {
    borderRadius: borderRadius.xl,
    backgroundColor: colors.primary
  }
});

export default RouteResultsScreen;

