import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Animated, Dimensions, Pressable, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, PanResponder } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '@navigation/types';
import { Location, PublicTransportPreference } from '@/types';
import { useLocation } from '@context/LocationContext';
import { useApp } from '@context/AppContext';
import DestinationInput from '@components/DestinationInput';
import MapViewComponent from '@components/MapViewComponent';
import { Button } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { borderRadius, fontSize, shadows, spacing, type ThemeColors } from '@/utils/theme';
import { useThemeMode } from '@context/ThemeContext';
type PublicTransportNavigationProp = StackNavigationProp<RootStackParamList, 'PublicTransport'>;

const PublicTransportScreen: React.FC = () => {
  const { colors } = useThemeMode();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const navigation = useNavigation<PublicTransportNavigationProp>();
  const { selectedOrigin, selectedDestination, setSelectedOrigin, setSelectedDestination } = useLocation();
  const { setIsLoading } = useApp();
  const [preference, setPreference] = useState<PublicTransportPreference>(PublicTransportPreference.SHORTEST_TIME);
  const [showMap, setShowMap] = useState<boolean>(false);
  const [sheetExpanded, setSheetExpanded] = useState<boolean>(false);
  const [locationPickMode, setLocationPickMode] = useState<'origin' | 'destination' | null>(null);
  // Leave empty by default; only constrain when user enters a value.
  const [budget, setBudget] = useState<string>('');
  // Leave empty by default so long-distance trips aren't accidentally filtered out.
  const [maxTransfers, setMaxTransfers] = useState<string>('');
  const [preferredModes, setPreferredModes] = useState<string[]>(['walk','jeepney','bus','lrt','mrt','pnr']);

  useFocusEffect(
    React.useCallback(() => {
      setPreference(PublicTransportPreference.SHORTEST_TIME);
      setBudget('');
      setMaxTransfers('');
    }, [])
  );

  const windowHeight = Dimensions.get('window').height;
  const sheetExpandedHeight = Math.round(windowHeight * 0.88);
  const sheetCollapsedHeight = 220;
  const sheetHiddenOffset = Math.max(0, sheetExpandedHeight - sheetCollapsedHeight);
  const sheetTranslateY = useRef(new Animated.Value(sheetHiddenOffset)).current;

  useEffect(() => {
    Animated.timing(sheetTranslateY, {
      toValue: sheetExpanded ? 0 : sheetHiddenOffset,
      duration: 220,
      useNativeDriver: true,
    }).start();
  }, [sheetExpanded, sheetHiddenOffset, sheetTranslateY]);

  const expandSheet = () => setSheetExpanded(true);
  const collapseSheet = () => setSheetExpanded(false);
  const toggleSheet = () => setSheetExpanded((v) => !v);
  const TOP_DRAG_ZONE_HEIGHT = 120;

  const sheetHandlePanResponder = useMemo(
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
    []
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
    []
  );

  const showBudgetInput = preference === PublicTransportPreference.LOWEST_FARE;
  const showMaxTransfersInput = preference === PublicTransportPreference.FEWEST_TRANSFERS;
  const hasRequiredLocations = !!selectedOrigin && !!selectedDestination;
  const missingLocationFields: string[] = [];
  if (!selectedOrigin) missingLocationFields.push('Origin');
  if (!selectedDestination) missingLocationFields.push('Destination');
  const missingLocationInstruction = `Please set: ${missingLocationFields.join(' and ')}.`;

  const preferences = [
    { value: PublicTransportPreference.LOWEST_FARE, label: 'Lowest Fare', icon: 'cash' },
    { value: PublicTransportPreference.SHORTEST_TIME, label: 'Shortest Time', icon: 'clock-fast' },
    { value: PublicTransportPreference.FEWEST_TRANSFERS, label: 'Fewest Transfers', icon: 'swap-horizontal' }
  ];

  const handleFindRoutes = async () => {
    if (!selectedOrigin || !selectedDestination) {
      Alert.alert('Missing Information', 'Please select both origin and destination');
      return;
    }

    setIsLoading(true);
    // Navigate to route results
    navigation.navigate('RouteResults', {
      origin: selectedOrigin,
      destination: selectedDestination,
      preference,
      budget: showBudgetInput ? (Number(budget) || undefined) : undefined,
      maxTransfers: showMaxTransfersInput ? (Number(maxTransfers) || undefined) : undefined,
      preferredModes
    });
  };

  const handleRequestLocationPickFromMap = (target: 'origin' | 'destination') => {
    setLocationPickMode(target);
    setShowMap(true);
    setSheetExpanded(false);
  };

  const handleHideMap = () => {
    setShowMap(false);
    setLocationPickMode(null);
  };

  const handleOriginSelectedFromMap = (location: Location) => {
    setSelectedOrigin(location);
    setLocationPickMode(null);
  };

  const handleDestinationSelectedFromMap = (location: Location) => {
    setSelectedDestination(location);
    setLocationPickMode(null);
  };

  const renderLocationForm = (opts?: { compact?: boolean }) => {
    const compact = !!opts?.compact;
    return (
      <>
        {!compact && <Text style={styles.sectionTitle}>Locations</Text>}

        {showMap ? (
          <Button mode="outlined" onPress={handleHideMap} style={styles.hideMapButton} icon="eye-off">
            Hide Map
          </Button>
        ) : (
          <Text style={styles.mapButtonHint}>
            Tip: Tap the pin button inside Origin or Destination textbox to pick directly from map.
          </Text>
        )}

        <DestinationInput
          label="Origin *"
          value={selectedOrigin}
          onValueChange={setSelectedOrigin}
          placeholder="Where are you starting from?"
          onPinPress={() => handleRequestLocationPickFromMap('origin')}
          pinColor="#27ae60"
        />
        <DestinationInput
          label="Destination *"
          value={selectedDestination}
          onValueChange={setSelectedDestination}
          placeholder="Where are you going?"
          onPinPress={() => handleRequestLocationPickFromMap('destination')}
          pinColor="#e74c3c"
        />
      </>
    );
  };

  const renderPreferenceControls = () => {
    return (
      <>
        <Text style={styles.sectionTitle}>Preferences</Text>
        <View style={styles.preferencesContainer}>
          {preferences.map((pref) => (
            (() => {
              const isActive = preference === pref.value;
              return (
                <TouchableOpacity
                  key={pref.value}
                  style={[
                    styles.preferenceCard,
                    preference === pref.value && styles.preferenceCardActive
                  ]}
                  onPress={() => {
                    setPreference(pref.value);
                    if (pref.value !== PublicTransportPreference.LOWEST_FARE) {
                      setBudget('');
                    }
                    if (pref.value !== PublicTransportPreference.FEWEST_TRANSFERS) {
                      setMaxTransfers('');
                    }
                  }}
                >
                  <View style={[styles.preferenceIconWrap, isActive && styles.preferenceIconWrapActive]}>
                    <MaterialCommunityIcons
                      name={pref.icon as any}
                      size={26}
                      color={isActive ? colors.primary : colors.textSecondary}
                    />
                  </View>
                  <Text
                    style={[
                      styles.preferenceLabel,
                      preference === pref.value && styles.preferenceLabelActive
                    ]}
                    numberOfLines={2}
                    ellipsizeMode="tail"
                  >
                    {pref.label}
                  </Text>
                </TouchableOpacity>
              );
            })()
          ))}
        </View>

        {(showBudgetInput || showMaxTransfersInput) && (
          <View style={styles.inputRow}>
            {showBudgetInput && (
              <View style={styles.inputCol}>
                <Text style={styles.inputLabel}>Budget (₱)</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  value={budget}
                  onChangeText={setBudget}
                  placeholder="Optional (e.g. 150)"
                />
              </View>
            )}

            {showMaxTransfersInput && (
              <View style={styles.inputCol}>
                <Text style={styles.inputLabel}>Max Transfers</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  value={maxTransfers}
                  onChangeText={setMaxTransfers}
                  placeholder="e.g. 3"
                />
              </View>
            )}
          </View>
        )}

        <Text style={[styles.inputLabel, { marginTop: 12 }]}>Preferred Modes</Text>
        <Text style={styles.modesNote}>Note: Modes are selected by default. Deselect any mode you do not want to include.</Text>
        <View style={styles.modesRow}>
          {['walk','jeepney','bus','lrt','mrt','pnr'].map((m) => {
            const active = preferredModes.includes(m);
            return (
              <TouchableOpacity
                key={m}
                style={[styles.modeChip, active && styles.modeChipActive]}
                onPress={() => {
                  setPreferredModes((prev) => {
                    return active ? prev.filter(x => x !== m) : [...prev, m];
                  });
                }}
              >
                <Text style={[styles.modeChipText, active && styles.modeChipTextActive]}>{m.toUpperCase()}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </>
    );
  };

  if (showMap) {
    return (
      <View style={styles.mapScreen}>
        <MapViewComponent
          origin={selectedOrigin}
          destination={selectedDestination}
          onOriginSelect={handleOriginSelectedFromMap}
          onDestinationSelect={handleDestinationSelectedFromMap}
          autoSelectMode={locationPickMode}
          hideSelectionControls
          boundaryMode="public"
        />

        <Animated.View
          style={[
            styles.bottomSheet,
            {
              height: sheetExpandedHeight,
              transform: [{ translateY: sheetTranslateY }],
            },
          ]}
          {...topCardPanResponder.panHandlers}
        >
          <Pressable
            style={styles.sheetHandleArea}
            onPress={toggleSheet}
            {...sheetHandlePanResponder.panHandlers}
          >
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetHint}>
              {sheetExpanded ? 'Tap or drag down to view the map' : 'Tap or drag up to expand. Other fields are on this card.'}
            </Text>
          </Pressable>

          <ScrollView
            style={styles.sheetScroll}
            contentContainerStyle={styles.sheetScrollContent}
            keyboardShouldPersistTaps="handled"
            onScrollBeginDrag={expandSheet}
            onTouchStart={() => {
              if (!sheetExpanded) expandSheet();
            }}
          >
            <View style={styles.sheetSection}>{renderLocationForm({ compact: true })}</View>
            <View style={styles.sheetDivider} />
            <View style={styles.sheetSection}>{renderPreferenceControls()}</View>
            <View style={styles.sheetFooter}>
              {!hasRequiredLocations && (
                <Text style={styles.requiredHint}>{missingLocationInstruction}</Text>
              )}
              <Button
                mode="contained"
                onPress={handleFindRoutes}
                disabled={!hasRequiredLocations}
                style={styles.findButton}
                contentStyle={styles.findButtonContent}
                labelStyle={styles.findButtonLabel}
              >
                Find Routes
              </Button>
            </View>
          </ScrollView>
        </Animated.View>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Public Transport Planner</Text>
        <Text style={styles.subtitle}>Find the best routes for your journey</Text>
      </View>

      <View style={styles.section}>
        {renderLocationForm()}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Preferences</Text>
        <View style={styles.preferencesContainer}>
          {preferences.map((pref) => (
            (() => {
              const isActive = preference === pref.value;
              return (
            <TouchableOpacity
              key={pref.value}
              style={[
                styles.preferenceCard,
                preference === pref.value && styles.preferenceCardActive
              ]}
              onPress={() => {
                setPreference(pref.value);
                // Clear values for inputs that will be hidden to avoid stale constraints.
                if (pref.value !== PublicTransportPreference.LOWEST_FARE) {
                  setBudget('');
                }
                if (pref.value !== PublicTransportPreference.FEWEST_TRANSFERS) {
                  setMaxTransfers('');
                }
              }}
            >
              <View style={[styles.preferenceIconWrap, isActive && styles.preferenceIconWrapActive]}>
                <MaterialCommunityIcons
                  // Type widening is fine here; icons are constrained by our array.
                  name={pref.icon as any}
                  size={26}
                  color={isActive ? colors.textPrimary : colors.textSecondary}
                />
              </View>
              <Text
                style={[
                  styles.preferenceLabel,
                  preference === pref.value && styles.preferenceLabelActive
                ]}
                numberOfLines={2}
                ellipsizeMode="tail"
              >
                {pref.label}
              </Text>
            </TouchableOpacity>
              );
            })()
          ))}
        </View>

        {(showBudgetInput || showMaxTransfersInput) && (
          <View style={styles.inputRow}>
            {showBudgetInput && (
              <View style={styles.inputCol}>
                <Text style={styles.inputLabel}>Budget (₱)</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  value={budget}
                  onChangeText={setBudget}
                  placeholder="Optional (e.g. 150)"
                />
              </View>
            )}

            {showMaxTransfersInput && (
              <View style={styles.inputCol}>
                <Text style={styles.inputLabel}>Max Transfers</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  value={maxTransfers}
                  onChangeText={setMaxTransfers}
                  placeholder="e.g. 3"
                />
              </View>
            )}
          </View>
        )}

        <Text style={[styles.inputLabel, { marginTop: 12 }]}>Preferred Modes</Text>
        <Text style={styles.modesNote}>Note: Modes are selected by default. Deselect any mode you do not want to include.</Text>
        <View style={styles.modesRow}>
          {['walk','jeepney','bus','lrt','mrt','pnr'].map((m) => {
            const active = preferredModes.includes(m);
            return (
              <TouchableOpacity
                key={m}
                style={[styles.modeChip, active && styles.modeChipActive]}
                onPress={() => {
                  setPreferredModes((prev) => {
                    return active ? prev.filter(x => x !== m) : [...prev, m];
                  });
                }}
              >
                <Text style={[styles.modeChipText, active && styles.modeChipTextActive]}>{m.toUpperCase()}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <View style={styles.footer}>
        {!hasRequiredLocations && (
          <Text style={styles.requiredHint}>{missingLocationInstruction}</Text>
        )}
        <Button
          mode="contained"
          onPress={handleFindRoutes}
          disabled={!hasRequiredLocations}
          style={styles.findButton}
          contentStyle={styles.findButtonContent}
          labelStyle={styles.findButtonLabel}
        >
          Find Routes
        </Button>
      </View>
    </ScrollView>
  );
};

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background
  },
  mapScreen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  bottomSheet: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    bottom: spacing.lg,
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.gray5,
    ...shadows.small,
  },
  sheetHandleArea: {
    alignItems: 'center',
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
  },
  sheetHandle: {
    width: 44,
    height: 5,
    borderRadius: borderRadius.round,
    backgroundColor: colors.gray6,
  },
  sheetHint: {
    marginTop: spacing.xs,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  sheetScroll: {
    flex: 1,
  },
  sheetScrollContent: {
    paddingBottom: spacing.xxl,
  },
  sheetSection: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  sheetDivider: {
    height: 1,
    backgroundColor: colors.gray6,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  sheetFooter: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  requiredHint: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    backgroundColor: 'transparent',
    borderWidth: 0
  },
  title: {
    fontSize: fontSize.title,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
    textAlign: 'center'
  },
  subtitle: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center'
  },
  section: {
    backgroundColor: colors.white,
    padding: spacing.lg,
    marginTop: spacing.md,
    marginHorizontal: spacing.lg,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.gray5,
    ...shadows.small
  },
  sectionTitle: {
    fontSize: fontSize.xl,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.lg,
    textAlign: 'center'
  },
  mapButtonHint: {
    marginTop: spacing.sm,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  hideMapButton: {
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
    borderRadius: borderRadius.lg,
    borderColor: colors.gray5,
  },
  mapContainer: {
    height: 300,
    marginTop: spacing.lg,
    borderRadius: borderRadius.lg,
    overflow: 'hidden'
  },
  preferencesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: spacing.sm
  },
  inputRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12
  },
  inputCol: {
    flex: 1
  },
  inputLabel: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.sm
  },
  modesNote: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  input: {
    backgroundColor: colors.gray7,
    borderWidth: 1,
    borderColor: colors.gray6,
    borderRadius: borderRadius.lg,
    paddingHorizontal: 12,
    paddingVertical: 10
  },
  modesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8
  },
  modeChip: {
    borderWidth: 1,
    borderColor: colors.gray5,
    borderRadius: borderRadius.round,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: colors.gray7
  },
  modeChipActive: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary
  },
  modeChipText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary
  },
  modeChipTextActive: {
    color: colors.textPrimary,
    fontWeight: '700'
  },
  preferenceCard: {
    width: '48%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.gray7,
    borderRadius: borderRadius.xl,
    borderWidth: 2,
    borderColor: colors.gray5
  },
  preferenceCardActive: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary
  },
  preferenceIconWrap: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.round,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.gray6
  },
  preferenceIconWrapActive: {
    borderColor: colors.primary
  },
  preferenceLabel: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    marginTop: spacing.sm,
    textAlign: 'center',
    fontWeight: '500'
  },
  preferenceLabelActive: {
    color: colors.textPrimary,
    fontWeight: '700'
  },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxl
  },
  findButton: {
    borderRadius: borderRadius.xl,
    backgroundColor: colors.primary
  },
  findButtonContent: {
    paddingVertical: 8
  },
  findButtonLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textWhite
  }
});

export default PublicTransportScreen;

