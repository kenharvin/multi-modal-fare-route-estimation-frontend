import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Animated, Dimensions, Modal, Pressable, ScrollView, Text, TextInput, TouchableOpacity, View, PanResponder } from 'react-native';
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
import { useThemeMode } from '@context/ThemeContext';
import { createPublicTransportScreenStyles } from '@/styles/screens/publicTransportScreen.styles';
type PublicTransportNavigationProp = StackNavigationProp<RootStackParamList, 'PublicTransport'>;

const PublicTransportScreen: React.FC = () => {
  const { colors } = useThemeMode();
  const styles = useMemo(() => createPublicTransportScreenStyles(colors), [colors]);

  const navigation = useNavigation<PublicTransportNavigationProp>();
  const { selectedOrigin, selectedDestination, setSelectedOrigin, setSelectedDestination } = useLocation();
  const { setIsLoading } = useApp();
  type FareType = 'regular' | 'discounted';
  const [preference, setPreference] = useState<PublicTransportPreference>(PublicTransportPreference.SHORTEST_TIME);
  const [showMap, setShowMap] = useState<boolean>(true);
  const [sheetExpanded, setSheetExpanded] = useState<boolean>(false);
  const [locationPickMode, setLocationPickMode] = useState<'origin' | 'destination' | null>('origin');
  const [manualSearchEnabled, setManualSearchEnabled] = useState<boolean>(false);
  const [showManualSearchConfirm, setShowManualSearchConfirm] = useState<boolean>(false);
  const [budget, setBudget] = useState<string>('');
  const [maxTransfers, setMaxTransfers] = useState<string>('');
  const [preferredModes, setPreferredModes] = useState<string[]>(['jeepney','bus','lrt','mrt','pnr']);
  const [fareType, setFareType] = useState<FareType>('regular');
  const fareTypeOptions = useMemo(() => ([
    {
      value: 'regular' as FareType,
      label: 'Regular Fare',
      description: 'Standard fare rates for all passengers.'
    },
    {
      value: 'discounted' as FareType,
      label: 'Discounted Fare',
      description: 'Senior, PWD, or student rates when available.'
    }
  ]), []);

  useFocusEffect(
    React.useCallback(() => {
      setPreference(PublicTransportPreference.SHORTEST_TIME);
      setBudget('');
      setMaxTransfers('');
      setFareType('regular');
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
    navigation.navigate('RouteResults', {
      origin: selectedOrigin,
      destination: selectedDestination,
      preference,
      budget: showBudgetInput ? (Number(budget) || undefined) : undefined,
      maxTransfers: showMaxTransfersInput ? (Number(maxTransfers) || undefined) : undefined,
      preferredModes,
      useDiscountedFare: fareType === 'discounted'
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
    setLocationPickMode('destination');
  };

  const handleDestinationSelectedFromMap = (location: Location) => {
    setSelectedDestination(location);
    setLocationPickMode(null);
  };

  const renderLocationForm = (opts?: { compact?: boolean }) => {
    const compact = !!opts?.compact;

    const handleEnableManualSearch = () => {
      setShowManualSearchConfirm(true);
    };

    return (
      <>
        {!compact && <Text style={styles.sectionTitle}>Locations</Text>}

        {showMap ? (
          <Button
            mode="outlined"
            onPress={handleHideMap}
            style={styles.hideMapButton}
            labelStyle={styles.outlinedButtonLabel}
            icon="eye-off"
          >
            Hide Map
          </Button>
        ) : (
          <Text style={styles.mapButtonHint}>
            Tip: Tap the pin button inside Origin or Destination textbox to pick directly from map.
          </Text>
        )}

        {!manualSearchEnabled ? (
          <View style={styles.pinFirstCard}>
            <Text style={styles.pinFirstTitle}>Pin Location is Default</Text>
            <Text style={styles.pinFirstText}>
              Tap the map to pin your origin and destination. After selecting origin, we will guide you to pin destination next.
            </Text>
            <View style={styles.pinActionRow}>
              <Button
                mode="outlined"
                icon="map-marker"
                onPress={() => handleRequestLocationPickFromMap('origin')}
                style={styles.pinActionButton}
                labelStyle={styles.outlinedButtonLabel}
              >
                Pin Origin
              </Button>
              <Button
                mode="outlined"
                icon="map-marker-check"
                onPress={() => handleRequestLocationPickFromMap('destination')}
                style={styles.pinActionButton}
                labelStyle={styles.outlinedButtonLabel}
              >
                Pin Destination
              </Button>
            </View>
            <Text style={styles.manualSearchNote}>
              Tap the button below to search for origin and destination.
            </Text>
            <TouchableOpacity
              onPress={handleEnableManualSearch}
              style={styles.manualSearchButton}
              accessibilityRole="button"
              accessibilityLabel="Search for Origin and Destination Manually"
            >
              <Text style={styles.manualSearchButtonLabel}>
                Search for Origin and Destination Manually
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
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
        )}
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
                  placeholderTextColor={colors.textLight}
                  selectionColor={colors.primary}
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
                  placeholderTextColor={colors.textLight}
                  selectionColor={colors.primary}
                />
              </View>
            )}
          </View>
        )}

        <Text style={[styles.inputLabel, { marginTop: 12 }]}>Preferred Modes</Text>
        <Text style={styles.modesNote}>Note: Modes are selected by default. Deselect any mode you do not want to include.</Text>
        <View style={styles.modesRow}>
          {['jeepney','bus','lrt','mrt','pnr'].map((m) => {
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

        <Text style={[styles.inputLabel, styles.fareTypeLabel]}>Fare Type</Text>
        <Text style={styles.fareTypeNote}>Choose whether you are eligible for discounted price or not.</Text>
        <View style={styles.fareTypeRow}>
          {fareTypeOptions.map((option) => {
            const active = fareType === option.value;
            return (
              <TouchableOpacity
                key={option.value}
                style={[styles.fareTypeCard, active && styles.fareTypeCardActive]}
                onPress={() => setFareType(option.value)}
              >
                <Text style={[styles.fareTypeCardLabel, active && styles.fareTypeCardLabelActive]}>{option.label}</Text>
                <Text style={styles.fareTypeCardDescription}>{option.description}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </>
    );
  };

  const manualSearchConfirmModal = (
    <Modal
      visible={showManualSearchConfirm}
      transparent
      animationType="fade"
      onRequestClose={() => setShowManualSearchConfirm(false)}
    >
      <View style={styles.modalBackdrop}>
        <View style={styles.modalCard}>
          <Text style={styles.modalTitle}>Switch to Manual Search?</Text>
          <Text style={styles.modalMessage}>
            Pinning locations on the map is still recommended because route and stop data can be limited in some areas. Would you like to continue?
          </Text>
          <View style={styles.modalButtonRow}>
            <Button
              mode="outlined"
              onPress={() => setShowManualSearchConfirm(false)}
              style={styles.modalCancelButton}
              labelStyle={styles.outlinedButtonLabel}
            >
              Stay with Pin Location
            </Button>
            <Button
              mode="contained"
              onPress={() => {
                setManualSearchEnabled(true);
                setShowManualSearchConfirm(false);
              }}
              style={styles.modalConfirmButton}
              labelStyle={styles.findButtonLabel}
            >
              Proceed
            </Button>
          </View>
        </View>
      </View>
    </Modal>
  );

  if (showMap) {
    return (
      <>
        {manualSearchConfirmModal}
        <View style={styles.mapScreen}>
          <MapViewComponent
            origin={selectedOrigin}
            destination={selectedDestination}
            onOriginSelect={handleOriginSelectedFromMap}
            onDestinationSelect={handleDestinationSelectedFromMap}
            autoSelectMode={locationPickMode}
            hideSelectionControls
            boundaryMode="public"
            persistentInstructionText={
              !sheetExpanded && hasRequiredLocations && !locationPickMode
                ? 'Please pull up or tap the upper part of the card below to set other preferences.'
                : null
            }
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
      </>
    );
  }

  return (
    <>
      {manualSearchConfirmModal}

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
                  placeholderTextColor={colors.textLight}
                  selectionColor={colors.primary}
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
                  placeholderTextColor={colors.textLight}
                  selectionColor={colors.primary}
                />
              </View>
            )}
          </View>
        )}

        <Text style={[styles.inputLabel, { marginTop: 12 }]}>Preferred Modes</Text>
        <Text style={styles.modesNote}>Note: Modes are selected by default. Deselect any mode you do not want to include.</Text>
        <View style={styles.modesRow}>
          {['jeepney','bus','lrt','mrt','pnr'].map((m) => {
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
    </>
  );
};

export default PublicTransportScreen;

