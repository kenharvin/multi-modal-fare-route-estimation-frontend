import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Animated, Dimensions, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View, PanResponder } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '@navigation/types';
import { Vehicle, VehicleCategory, Stopover, StopoverType, Location, DrivingPreferences } from '@/types';
import { useLocation } from '@context/LocationContext';
import { useApp } from '@context/AppContext';
import DestinationInput from '@components/DestinationInput';
import MapViewComponent from '@components/MapViewComponent';
import { Button, TextInput, Switch } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import {
  getPrivateFuelPriceOptions,
  getPrivateVehicleFuelSettings,
  type PrivateFuelPriceOption,
  type PrivateVehicleFuelSetting,
  searchPois,
} from '@services/api';
import { borderRadius, fontSize, shadows, spacing, type ThemeColors } from '@/utils/theme';
import { useThemeMode } from '@context/ThemeContext';
type PrivateVehicleNavigationProp = StackNavigationProp<RootStackParamList, 'PrivateVehicle'>;

type VehicleCategoryCard = {
  value: VehicleCategory;
  label: string;
  icon: string;
  efficiency: number;
};

const FALLBACK_PRIVATE_FUEL_SETTINGS: PrivateVehicleFuelSetting[] = [
  { vehicle_type: VehicleCategory.SEDAN, fuel_efficiency: 16, fuel_price: 60 },
  { vehicle_type: VehicleCategory.SUV, fuel_efficiency: 12, fuel_price: 60 },
  { vehicle_type: VehicleCategory.HATCHBACK, fuel_efficiency: 18, fuel_price: 60 },
  { vehicle_type: VehicleCategory.MOTORCYCLE, fuel_efficiency: 50, fuel_price: 60 },
  { vehicle_type: VehicleCategory.VAN, fuel_efficiency: 9.5, fuel_price: 60 }
];

const VEHICLE_CATEGORY_META: Record<VehicleCategory, { label: string; icon: string }> = {
  [VehicleCategory.SEDAN]: { label: 'Sedan', icon: 'car-side' },
  [VehicleCategory.SUV]: { label: 'SUV', icon: 'car-estate' },
  [VehicleCategory.HATCHBACK]: { label: 'Hatchback', icon: 'car-hatchback' },
  [VehicleCategory.MOTORCYCLE]: { label: 'Motorcycle', icon: 'motorbike' },
  [VehicleCategory.VAN]: { label: 'Van', icon: 'van-utility' }
};

const FALLBACK_FUEL_PRICE_OPTIONS: PrivateFuelPriceOption[] = [
  { fuel_type: 'diesel', price: 58, is_default: false },
  { fuel_type: 'gasoline_ron91', price: 60, is_default: true },
  { fuel_type: 'gasoline_ron95', price: 64, is_default: false },
];

const FUEL_TYPE_LABELS: Record<string, string> = {
  diesel: 'Diesel',
  gasoline_ron91: 'Gasoline (RON 91)',
  gasoline_ron95: 'Gasoline (RON 95)',
};

const PrivateVehicleScreen: React.FC = () => {
  const { colors } = useThemeMode();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const navigation = useNavigation<PrivateVehicleNavigationProp>();
  const { currentLocation, selectedOrigin, selectedDestination, setSelectedOrigin, setSelectedDestination } = useLocation();
  const { setIsLoading } = useApp();
  
  const [vehicle, setVehicle] = useState<Vehicle>({
    category: VehicleCategory.SEDAN,
    fuelEfficiency: 12 // default km/l
  });
  const [fuelPrice, setFuelPrice] = useState<string>('60');
  const [useCustomFuelPrice, setUseCustomFuelPrice] = useState<boolean>(false);
  const [customFuelPrice, setCustomFuelPrice] = useState<string>('60');
  const [vehicleFuelSettings, setVehicleFuelSettings] = useState<PrivateVehicleFuelSetting[]>(FALLBACK_PRIVATE_FUEL_SETTINGS);
  const [fuelPriceOptions, setFuelPriceOptions] = useState<PrivateFuelPriceOption[]>(FALLBACK_FUEL_PRICE_OPTIONS);
  const [selectedFuelType, setSelectedFuelType] = useState<string>('gasoline_ron91');
  const [stopoverLocations, setStopoverLocations] = useState<(Location | null)[]>([]);
  const [showMap, setShowMap] = useState<boolean>(false);
  const [sheetExpanded, setSheetExpanded] = useState<boolean>(false);
  const [locationPickMode, setLocationPickMode] = useState<'origin' | 'destination' | null>(null);
  const [pendingStopoverIndex, setPendingStopoverIndex] = useState<number | null>(null);
  const [preferences, setPreferences] = useState<DrivingPreferences>({
    avoidTolls: false,
    avoidHighways: false,
    preferShortest: true
  });

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
  const MAX_STOPOVERS = 3;
  const TOP_DRAG_ZONE_HEIGHT = 120;

  const stopovers = useMemo<Stopover[]>(() => {
    return stopoverLocations
      .filter((location): location is Location => !!location)
      .map((location, index) => ({
        id: `stopover-${index}`,
        location,
        type: StopoverType.OTHER,
      }));
  }, [stopoverLocations]);

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
  const hasRequiredLocations = !!selectedOrigin && !!selectedDestination;
  const missingLocationFields: string[] = [];
  if (!selectedOrigin) missingLocationFields.push('Origin');
  if (!selectedDestination) missingLocationFields.push('Destination');
  const missingLocationInstruction = `Please set: ${missingLocationFields.join(' and ')}.`;

  useFocusEffect(
    React.useCallback(() => {
      let cancelled = false;

      const loadFuelSettings = async () => {
        const [rows, fuelOptionsRows] = await Promise.all([
          getPrivateVehicleFuelSettings(),
          getPrivateFuelPriceOptions(),
        ]);
        if (cancelled) return;

        if (rows.length > 0) {
          const allowed = new Set(Object.values(VehicleCategory));
          const normalized = rows.filter((row) => allowed.has(row.vehicle_type as VehicleCategory));
          if (normalized.length > 0) {
            setVehicleFuelSettings(normalized);
          }
        }

        if (fuelOptionsRows.length > 0) {
          setFuelPriceOptions(fuelOptionsRows);
          const defaultFuel = fuelOptionsRows.find((row) => row.is_default) || fuelOptionsRows[0];
          if (defaultFuel) {
            setSelectedFuelType(defaultFuel.fuel_type);
          }
        }
      };

      loadFuelSettings();

      return () => {
        cancelled = true;
      };
    }, [])
  );

  const vehicleCategories = useMemo<VehicleCategoryCard[]>(() => {
    return vehicleFuelSettings
      .map((row) => {
        const value = row.vehicle_type as VehicleCategory;
        const meta = VEHICLE_CATEGORY_META[value];
        if (!meta) return null;
        return {
          value,
          label: meta.label,
          icon: meta.icon,
          efficiency: Number(row.fuel_efficiency || 0)
        };
      })
      .filter((row): row is VehicleCategoryCard => !!row);
  }, [vehicleFuelSettings]);

  const selectedFuelOption = useMemo(
    () => fuelPriceOptions.find((row) => row.fuel_type === selectedFuelType) || fuelPriceOptions[0],
    [fuelPriceOptions, selectedFuelType],
  );
  const selectedAdminFuelPrice = Number(selectedFuelOption?.price || fuelPrice || 0);

  const selectedVehicleCategory = useMemo(
    () => vehicleCategories.find((v) => v.value === vehicle.category),
    [vehicle.category, vehicleCategories]
  );

  useEffect(() => {
    if (!selectedVehicleCategory) return;

    setVehicle((prev) => ({
      ...prev,
      fuelEfficiency: selectedVehicleCategory.efficiency || prev.fuelEfficiency
    }));
    setFuelPrice(String(selectedAdminFuelPrice || 0));
  }, [selectedVehicleCategory, selectedAdminFuelPrice]);

  const handleVehicleCategoryChange = (category: VehicleCategory) => {
    setVehicle({
      ...vehicle,
      category
    });
  };

  const handleToggleCustomFuelPrice = (value: boolean) => {
    setUseCustomFuelPrice(value);
    if (value) {
      const adminValue = String(selectedAdminFuelPrice || fuelPrice || '0');
      setCustomFuelPrice(adminValue);
    }
  };

  const handleFuelTypeChange = (fuelType: string) => {
    setSelectedFuelType(fuelType);
    if (!useCustomFuelPrice) {
      const selected = fuelPriceOptions.find((row) => row.fuel_type === fuelType);
      if (selected) {
        setFuelPrice(String(selected.price));
      }
    }
  };

  const handleAddStopoverField = () => {
    setStopoverLocations((prev) => {
      if (prev.length >= MAX_STOPOVERS) return prev;
      return [...prev, null];
    });
  };

  const handleRequestStopoverPickFromMap = (index: number) => {
    setLocationPickMode(null);
    setPendingStopoverIndex(index);
    setShowMap(true);
    setSheetExpanded(false);
  };

  const handleRequestLocationPickFromMap = (target: 'origin' | 'destination') => {
    setLocationPickMode(target);
    setPendingStopoverIndex(null);
    setShowMap(true);
    setSheetExpanded(false);
  };

  const handleHideMap = () => {
    setShowMap(false);
    setLocationPickMode(null);
    setPendingStopoverIndex(null);
  };

  const handleStopoverChange = (index: number, location: Location | null) => {
    setStopoverLocations((prev) => {
      const next = [...prev];
      while (next.length <= index) {
        next.push(null);
      }
      next[index] = location;
      return next;
    });
  };

  const handleOriginSelectedFromMap = (location: Location) => {
    setSelectedOrigin(location);
    setLocationPickMode(null);
  };

  const handleDestinationSelectedFromMap = (location: Location) => {
    setSelectedDestination(location);
    setLocationPickMode(null);
  };

  const handleStopoverSelectedFromMap = (location: Location) => {
    if (pendingStopoverIndex === null) return;
    handleStopoverChange(pendingStopoverIndex, location);
    setPendingStopoverIndex(null);
  };

  const handleCalculateRoute = async () => {
    if (!selectedOrigin || !selectedDestination) {
      Alert.alert('Missing Information', 'Please select both origin and destination');
      return;
    }

    const adminFuelPrice = Number(selectedAdminFuelPrice || parseFloat(fuelPrice));
    const effectiveFuelPrice = useCustomFuelPrice ? Number(customFuelPrice) : adminFuelPrice;

    if (!Number.isFinite(effectiveFuelPrice) || effectiveFuelPrice <= 0) {
      Alert.alert('Invalid Fuel Price', 'Please enter a valid fuel price');
      return;
    }

    setIsLoading(true);
    navigation.navigate('PrivateVehicleResults', {
      origin: selectedOrigin,
      destination: selectedDestination,
      vehicle,
      fuelPrice: effectiveFuelPrice,
      stopovers,
      preferences
    });
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
          placeholder="Starting point"
          searchProvider={(q) => searchPois(q, 10, currentLocation)}
          onPinPress={() => handleRequestLocationPickFromMap('origin')}
          pinColor="#27ae60"
        />
        <DestinationInput
          label="Destination *"
          value={selectedDestination}
          onValueChange={setSelectedDestination}
          placeholder="Final destination"
          searchProvider={(q) => searchPois(q, 10, currentLocation)}
          onPinPress={() => handleRequestLocationPickFromMap('destination')}
          pinColor="#e74c3c"
        />

        {stopoverLocations.length < MAX_STOPOVERS && (
          <Button
            mode="outlined"
            onPress={handleAddStopoverField}
            style={styles.addStopoverButton}
            icon="plus"
          >
            Add Stopover (Optional)
          </Button>
        )}

        {stopoverLocations.map((location, index) => (
          <DestinationInput
            key={`stopover-input-${index}`}
            label={`Stopover ${index + 1} (Optional)`}
            value={location}
            onValueChange={(value) => handleStopoverChange(index, value)}
            placeholder="Search stopover"
            searchProvider={(q) => searchPois(q, 10, currentLocation)}
            onPinPress={() => handleRequestStopoverPickFromMap(index)}
            pinColor="#2980b9"
          />
        ))}
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
          stopovers={stopovers}
          onStopoverSelect={handleStopoverSelectedFromMap}
          autoSelectMode={locationPickMode || (pendingStopoverIndex !== null ? 'stopover' : null)}
          hideSelectionControls
          boundaryMode="private"
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
            <View style={styles.sheetSection}>
              <Text style={styles.sectionTitle}>Vehicle Information</Text>
              <View style={styles.vehiclesContainer}>
                {vehicleCategories.map((cat) => (
                  <TouchableOpacity
                    key={cat.value}
                    style={[
                      styles.vehicleCard,
                      vehicle.category === cat.value && styles.vehicleCardActive
                    ]}
                    onPress={() => handleVehicleCategoryChange(cat.value)}
                  >
                    <MaterialCommunityIcons
                      name={cat.icon as any}
                      size={26}
                      color={vehicle.category === cat.value ? colors.textPrimary : colors.textSecondary}
                    />
                    <Text style={[
                      styles.vehicleLabel,
                      vehicle.category === cat.value && styles.vehicleLabelActive
                    ]}>
                      {cat.label}
                    </Text>
                    <Text style={styles.efficiencyText}>{cat.efficiency} km/L</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TextInput
                label="Fuel Efficiency (km/L)"
                value={vehicle.fuelEfficiency.toString()}
                onChangeText={(text) => setVehicle({ ...vehicle, fuelEfficiency: parseFloat(text) || 0 })}
                keyboardType="numeric"
                mode="outlined"
                style={styles.input}
              />
              <Text style={styles.fuelEfficiencyNote}>
                Note: Fuel efficiency shown is an average value based on online data. You can enter your vehicle's actual fuel efficiency if you know it.
              </Text>

              <Text style={styles.sectionSubtitle}>Fuel Type</Text>
              <View style={styles.fuelTypeScroll}>
                <View style={styles.fuelTypeRow}>
                  {fuelPriceOptions.map((option) => {
                    const active = selectedFuelType === option.fuel_type;
                    return (
                      <TouchableOpacity
                        key={option.fuel_type}
                        style={[styles.fuelTypeButton, active && styles.fuelTypeButtonActive]}
                        onPress={() => handleFuelTypeChange(option.fuel_type)}
                      >
                        <Text style={[styles.fuelTypeText, active && styles.fuelTypeTextActive]}>
                          {FUEL_TYPE_LABELS[option.fuel_type] || option.fuel_type}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              <TextInput
                label={useCustomFuelPrice ? 'Fuel Price (₱/L) custom' : 'Fuel Price (₱/L)'}
                value={useCustomFuelPrice ? customFuelPrice : String(selectedAdminFuelPrice || fuelPrice)}
                onChangeText={setCustomFuelPrice}
                keyboardType="numeric"
                mode="outlined"
                style={styles.input}
                editable={useCustomFuelPrice}
              />
              <Text style={styles.fuelPriceNote}>Note: Fuel price indicated is average city rate.</Text>

              <View style={styles.preferenceRow}>
                <View style={styles.preferenceInfo}>
                  <MaterialCommunityIcons name="tune-vertical" size={18} color={colors.textSecondary} />
                  <Text style={styles.preferenceText}>Use custom fuel price (optional)</Text>
                </View>
                <Switch
                  value={useCustomFuelPrice}
                  onValueChange={handleToggleCustomFuelPrice}
                  color={colors.primary}
                />
              </View>
            </View>

            <View style={styles.sheetDivider} />
            <View style={styles.sheetSection}>
              <Text style={styles.sectionTitle}>Driving Preferences</Text>

              <View style={styles.preferenceRow}>
                <View style={styles.preferenceInfo}>
                  <MaterialCommunityIcons name="cash-remove" size={18} color={colors.textSecondary} />
                  <Text style={styles.preferenceText}>Avoid Tolls</Text>
                </View>
                <Switch
                  value={preferences.avoidTolls}
                  onValueChange={(value) => setPreferences({ ...preferences, avoidTolls: value })}
                  color={colors.primary}
                />
              </View>

              <View style={styles.preferenceRow}>
                <View style={styles.preferenceInfo}>
                  <MaterialCommunityIcons name="road-variant" size={18} color={colors.textSecondary} />
                  <Text style={styles.preferenceText}>Avoid Expressways</Text>
                </View>
                <Switch
                  value={preferences.avoidHighways}
                  onValueChange={(value) => setPreferences({ ...preferences, avoidHighways: value })}
                  color={colors.primary}
                />
              </View>

              <View style={styles.preferenceRow}>
                <View style={styles.preferenceInfo}>
                  <MaterialCommunityIcons name="map-marker-distance" size={18} color={colors.textSecondary} />
                  <Text style={styles.preferenceText}>Prefer Shortest Distance</Text>
                </View>
                <Switch
                  value={preferences.preferShortest}
                  onValueChange={(value) => setPreferences({ ...preferences, preferShortest: value })}
                  color={colors.primary}
                />
              </View>
            </View>

            <View style={styles.sheetFooter}>
              {!hasRequiredLocations && (
                <Text style={styles.requiredHint}>{missingLocationInstruction}</Text>
              )}
              <Button
                mode="contained"
                onPress={handleCalculateRoute}
                disabled={!hasRequiredLocations}
                style={styles.calculateButton}
                contentStyle={styles.calculateButtonContent}
                labelStyle={styles.calculateButtonLabel}
              >
                Calculate Route & Cost
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
        <Text style={styles.title}>Private Vehicle Planner</Text>
        <Text style={styles.subtitle}>Calculate fuel costs and plan your route</Text>
      </View>

      <View style={styles.section}>
        {renderLocationForm()}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Vehicle Information</Text>
        <View style={styles.vehiclesContainer}>
          {vehicleCategories.map((cat) => (
            <TouchableOpacity
              key={cat.value}
              style={[
                styles.vehicleCard,
                vehicle.category === cat.value && styles.vehicleCardActive
              ]}
              onPress={() => handleVehicleCategoryChange(cat.value)}
            >
              <MaterialCommunityIcons
                name={cat.icon as any}
                size={26}
                color={vehicle.category === cat.value ? colors.primary : colors.textSecondary}
              />
              <Text style={[
                styles.vehicleLabel,
                vehicle.category === cat.value && styles.vehicleLabelActive
              ]}>
                {cat.label}
              </Text>
              <Text style={styles.efficiencyText}>{cat.efficiency} km/L</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TextInput
          label="Fuel Efficiency (km/L)"
          value={vehicle.fuelEfficiency.toString()}
          onChangeText={(text) => setVehicle({ ...vehicle, fuelEfficiency: parseFloat(text) || 0 })}
          keyboardType="numeric"
          mode="outlined"
          style={styles.input}
        />
        <Text style={styles.fuelEfficiencyNote}>
          Note: Fuel efficiency shown is an average value based on online data. You can enter your vehicle's actual fuel efficiency if you know it.
        </Text>

        <Text style={styles.sectionSubtitle}>Fuel Type</Text>
        <View style={styles.fuelTypeScroll}>
          <View style={styles.fuelTypeRow}>
            {fuelPriceOptions.map((option) => {
              const active = selectedFuelType === option.fuel_type;
              return (
                <TouchableOpacity
                  key={option.fuel_type}
                  style={[styles.fuelTypeButton, active && styles.fuelTypeButtonActive]}
                  onPress={() => handleFuelTypeChange(option.fuel_type)}
                >
                  <Text style={[styles.fuelTypeText, active && styles.fuelTypeTextActive]}>
                    {FUEL_TYPE_LABELS[option.fuel_type] || option.fuel_type}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <TextInput
          label={useCustomFuelPrice ? 'Fuel Price (₱/L) custom' : 'Fuel Price (₱/L)'}
          value={useCustomFuelPrice ? customFuelPrice : String(selectedAdminFuelPrice || fuelPrice)}
          onChangeText={setCustomFuelPrice}
          keyboardType="numeric"
          mode="outlined"
          style={styles.input}
          editable={useCustomFuelPrice}
        />
        <Text style={styles.fuelPriceNote}>Note: Fuel price indicated is average city rate.</Text>

        <View style={styles.preferenceRow}>
          <View style={styles.preferenceInfo}>
            <MaterialCommunityIcons name="tune-vertical" size={18} color={colors.textSecondary} />
            <Text style={styles.preferenceText}>Use custom fuel price (optional)</Text>
          </View>
          <Switch
            value={useCustomFuelPrice}
            onValueChange={handleToggleCustomFuelPrice}
            color={colors.primary}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Driving Preferences</Text>
        
        <View style={styles.preferenceRow}>
          <View style={styles.preferenceInfo}>
            <MaterialCommunityIcons name="cash-remove" size={18} color={colors.textSecondary} />
            <Text style={styles.preferenceText}>Avoid Tolls</Text>
          </View>
          <Switch
            value={preferences.avoidTolls}
            onValueChange={(value) => setPreferences({ ...preferences, avoidTolls: value })}
            color={colors.primary}
          />
        </View>

        <View style={styles.preferenceRow}>
          <View style={styles.preferenceInfo}>
            <MaterialCommunityIcons name="road-variant" size={18} color={colors.textSecondary} />
            <Text style={styles.preferenceText}>Avoid Expressways</Text>
          </View>
          <Switch
            value={preferences.avoidHighways}
            onValueChange={(value) => setPreferences({ ...preferences, avoidHighways: value })}
            color={colors.primary}
          />
        </View>

        <View style={styles.preferenceRow}>
          <View style={styles.preferenceInfo}>
            <MaterialCommunityIcons name="map-marker-distance" size={18} color={colors.textSecondary} />
            <Text style={styles.preferenceText}>Prefer Shortest Distance</Text>
          </View>
          <Switch
            value={preferences.preferShortest}
            onValueChange={(value) => setPreferences({ ...preferences, preferShortest: value })}
            color={colors.primary}
          />
        </View>
      </View>

      <View style={styles.footer}>
        {!hasRequiredLocations && (
          <Text style={styles.requiredHint}>{missingLocationInstruction}</Text>
        )}
        <Button
          mode="contained"
          onPress={handleCalculateRoute}
          disabled={!hasRequiredLocations}
          style={styles.calculateButton}
          contentStyle={styles.calculateButtonContent}
          labelStyle={styles.calculateButtonLabel}
        >
          Calculate Route & Cost
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
    backgroundColor: colors.background
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
    ...shadows.small
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
    padding: spacing.lg,
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    backgroundColor: 'transparent'
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
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.gray5,
    ...shadows.small
  },
  sectionTitle: {
    fontSize: fontSize.xl,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.sm,
    textAlign: 'center'
  },
  sectionSubtitle: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.md,
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
  addStopoverButton: {
    borderRadius: borderRadius.xl,
    borderColor: colors.primary,
    marginBottom: spacing.lg,
  },
  vehiclesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: spacing.md
  },
  fuelTypeScroll: {
    marginBottom: spacing.md,
  },
  fuelTypeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    paddingHorizontal: spacing.xs,
  },
  fuelTypeButton: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.gray7,
    borderRadius: borderRadius.xl,
    borderWidth: 2,
    borderColor: colors.gray5,
  },
  fuelTypeButtonActive: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
  },
  fuelTypeText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    fontWeight: '500',
  },
  fuelTypeTextActive: {
    color: colors.textPrimary,
    fontWeight: '700',
  },
  vehicleCard: {
    width: '30%',
    alignItems: 'center',
    padding: spacing.md,
    margin: 4,
    backgroundColor: colors.gray7,
    borderRadius: borderRadius.xl,
    borderWidth: 2,
    borderColor: colors.gray5
  },
  vehicleCardActive: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary
  },
  vehicleLabel: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    textAlign: 'center',
    fontWeight: '500'
  },
  vehicleLabelActive: {
    color: colors.textPrimary,
    fontWeight: '700'
  },
  efficiencyText: {
    fontSize: fontSize.xs,
    color: colors.textLight,
    marginTop: 2
  },
  input: {
    marginBottom: spacing.md
  },
  fuelEfficiencyNote: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: -spacing.sm,
    marginBottom: spacing.md,
    textAlign: 'left',
  },
  fuelPriceNote: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: -spacing.sm,
    marginBottom: spacing.md,
    textAlign: 'left',
  },
  preferenceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray6
  },
  preferenceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    minWidth: 0,
    marginRight: spacing.sm,
  },
  preferenceText: {
    fontSize: fontSize.lg,
    color: colors.textPrimary,
    marginLeft: spacing.md,
    flexShrink: 1,
    flexWrap: 'wrap',
  },
  footer: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl
  },
  calculateButton: {
    borderRadius: borderRadius.xl,
    backgroundColor: colors.primary
  },
  calculateButtonContent: {
    paddingVertical: spacing.sm
  },
  calculateButtonLabel: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.textWhite
  }
});

export default PrivateVehicleScreen;

