import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Animated, Dimensions, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '@navigation/types';
import { Vehicle, VehicleCategory, Stopover, StopoverType, Location, DrivingPreferences } from '@/types';
import { useLocation } from '@context/LocationContext';
import { useApp } from '@context/AppContext';
import DestinationInput from '@components/DestinationInput';
import StopoverInput from '@components/StopoverInput';
import MapViewComponent from '@components/MapViewComponent';
import { Button, TextInput, Switch } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { searchPois } from '@services/api';
import { borderRadius, fontSize, shadows, spacing, type ThemeColors } from '@/utils/theme';
import { useThemeMode } from '@context/ThemeContext';
type PrivateVehicleNavigationProp = StackNavigationProp<RootStackParamList, 'PrivateVehicle'>;

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
  const [stopovers, setStopovers] = useState<Stopover[]>([]);
  const [showMap, setShowMap] = useState<boolean>(false);
  const [sheetExpanded, setSheetExpanded] = useState<boolean>(false);
  const [stopoverPickActive, setStopoverPickActive] = useState<boolean>(false);
  const [pendingStopoverType, setPendingStopoverType] = useState<StopoverType>(StopoverType.OTHER);
  const [mapOpenedForStopoverPick, setMapOpenedForStopoverPick] = useState<boolean>(false);
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

  const MAX_STOPOVERS = 3;

  const vehicleCategories = [
    { value: VehicleCategory.SEDAN, label: 'Sedan', icon: 'car-side', efficiency: 12 },
    { value: VehicleCategory.SUV, label: 'SUV', icon: 'car-estate', efficiency: 10 },
    { value: VehicleCategory.HATCHBACK, label: 'Hatchback', icon: 'car-hatchback', efficiency: 14 },
    { value: VehicleCategory.MOTORCYCLE, label: 'Motorcycle', icon: 'motorbike', efficiency: 35 },
    { value: VehicleCategory.VAN, label: 'Van', icon: 'van-utility', efficiency: 9 }
  ];

  const handleVehicleCategoryChange = (category: VehicleCategory) => {
    const selectedCategory = vehicleCategories.find(v => v.value === category);
    setVehicle({
      ...vehicle,
      category,
      fuelEfficiency: selectedCategory?.efficiency || 12
    });
  };

  const handleAddStopover = (stopover: Stopover) => {
    if (stopovers.length < MAX_STOPOVERS) {
      setStopovers([...stopovers, stopover]);
    } else {
      Alert.alert('Maximum Stopovers', `You can add up to ${MAX_STOPOVERS} stopovers`);
    }
  };

  const handleRequestStopoverPickFromMap = (type: StopoverType) => {
    if (stopovers.length >= MAX_STOPOVERS) {
      Alert.alert('Maximum Stopovers', `You can add up to ${MAX_STOPOVERS} stopovers`);
      return;
    }
    setPendingStopoverType(type);
    setStopoverPickActive(true);
    setMapOpenedForStopoverPick(true);
    setShowMap(true);
  };

  const handleStopoverSelectedFromMap = (location: Location) => {
    const newStopover: Stopover = {
      id: Date.now().toString(),
      location,
      type: pendingStopoverType
    };
    handleAddStopover(newStopover);
    setStopoverPickActive(false);

    // If the map was opened specifically for stopover picking, close it after selection.
    if (mapOpenedForStopoverPick) {
      setShowMap(false);
    }
    setMapOpenedForStopoverPick(false);
  };

  const handleToggleMap = () => {
    setShowMap((prev) => {
      const next = !prev;
      // If user manually hides the map while armed for stopover selection, cancel that mode.
      if (!next && stopoverPickActive) {
        setStopoverPickActive(false);
        setMapOpenedForStopoverPick(false);
      }
      return next;
    });
  };

  const handleRemoveStopover = (id: string) => {
    setStopovers(stopovers.filter(s => s.id !== id));
  };

  const handleCalculateRoute = async () => {
    if (!selectedOrigin || !selectedDestination) {
      Alert.alert('Missing Information', 'Please select both origin and destination');
      return;
    }

    if (!fuelPrice || parseFloat(fuelPrice) <= 0) {
      Alert.alert('Invalid Fuel Price', 'Please enter a valid fuel price');
      return;
    }

    setIsLoading(true);
    navigation.navigate('PrivateVehicleResults', {
      origin: selectedOrigin,
      destination: selectedDestination,
      vehicle,
      fuelPrice: parseFloat(fuelPrice),
      stopovers,
      preferences
    });
  };

  const renderLocationForm = (opts?: { compact?: boolean }) => {
    const compact = !!opts?.compact;
    return (
      <>
        {!compact && <Text style={styles.sectionTitle}>Locations</Text>}

        <TouchableOpacity style={styles.mapButtonPrimary} onPress={handleToggleMap}>
          <MaterialCommunityIcons
            name="map-marker"
            size={18}
            color={colors.textWhite}
            style={styles.mapButtonPrimaryIcon}
          />
          <Text style={styles.mapButtonTextPrimary}>
            {showMap ? 'Hide Map' : 'Select from Map (Recommended)'}
          </Text>
        </TouchableOpacity>
        {!showMap && (
          <Text style={styles.mapButtonHint}>
            Recommended for easier pinning.
          </Text>
        )}

        <DestinationInput
          label="Origin"
          value={selectedOrigin}
          onValueChange={setSelectedOrigin}
          placeholder="Starting point"
          searchProvider={(q) => searchPois(q, 10, currentLocation)}
        />
        <DestinationInput
          label="Destination"
          value={selectedDestination}
          onValueChange={setSelectedDestination}
          placeholder="Final destination"
          searchProvider={(q) => searchPois(q, 10, currentLocation)}
        />
      </>
    );
  };

  if (showMap) {
    return (
      <View style={styles.mapScreen}>
        <MapViewComponent
          origin={selectedOrigin}
          destination={selectedDestination}
          onOriginSelect={setSelectedOrigin}
          onDestinationSelect={setSelectedDestination}
          stopovers={stopovers}
          onStopoverSelect={handleStopoverSelectedFromMap}
          autoSelectMode={stopoverPickActive ? 'stopover' : null}
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
        >
          <Pressable
            style={styles.sheetHandleArea}
            onPress={() => setSheetExpanded((v) => !v)}
          >
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetHint}>
              {sheetExpanded ? 'Tap to view the map again' : 'Tap to expand'}
            </Text>
          </Pressable>

          <ScrollView
            style={styles.sheetScroll}
            contentContainerStyle={styles.sheetScrollContent}
            keyboardShouldPersistTaps="handled"
            onScrollBeginDrag={() => setSheetExpanded(true)}
            onTouchStart={() => {
              if (!sheetExpanded) setSheetExpanded(true);
            }}
          >
            <View style={styles.sheetSection}>{renderLocationForm({ compact: true })}</View>
            <View style={styles.sheetDivider} />

            <View style={styles.sheetSection}>
              <Text style={styles.sectionTitle}>Stopovers (Optional)</Text>
              <Text style={styles.sectionSubtitle}>Add up to {MAX_STOPOVERS} stopovers</Text>
              <StopoverInput
                stopovers={stopovers}
                onAddStopover={handleAddStopover}
                onRemoveStopover={handleRemoveStopover}
                searchProvider={(q) => searchPois(q, 10, currentLocation)}
                onPickFromMap={handleRequestStopoverPickFromMap}
              />
            </View>

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

              <TextInput
                label="Current Fuel Price (₱/L)"
                value={fuelPrice}
                onChangeText={setFuelPrice}
                keyboardType="numeric"
                mode="outlined"
                style={styles.input}
              />
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
              <Button
                mode="contained"
                onPress={handleCalculateRoute}
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
        <Text style={styles.sectionTitle}>Stopovers (Optional)</Text>
        <Text style={styles.sectionSubtitle}>Add up to {MAX_STOPOVERS} stopovers</Text>
        
        <StopoverInput
          stopovers={stopovers}
          onAddStopover={handleAddStopover}
          onRemoveStopover={handleRemoveStopover}
          searchProvider={(q) => searchPois(q, 10, currentLocation)}
          onPickFromMap={handleRequestStopoverPickFromMap}
        />
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

        <TextInput
          label="Current Fuel Price (₱/L)"
          value={fuelPrice}
          onChangeText={setFuelPrice}
          keyboardType="numeric"
          mode="outlined"
          style={styles.input}
        />
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
        <Button
          mode="contained"
          onPress={handleCalculateRoute}
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
  mapButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
    backgroundColor: colors.primaryLight,
    borderRadius: borderRadius.lg,
    marginTop: spacing.md
  },
  mapButtonPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
    marginTop: spacing.md,
    position: 'relative'
  },
  mapButtonPrimaryIcon: {
    position: 'absolute',
    left: spacing.md
  },
  mapButtonText: {
    color: colors.primary,
    fontSize: fontSize.lg,
    fontWeight: '500',
    marginLeft: spacing.sm
  },
  mapButtonTextPrimary: {
    color: colors.textWhite,
    fontSize: fontSize.lg,
    fontWeight: '600',
    textAlign: 'center'
  },
  mapButtonHint: {
    marginTop: spacing.xs,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  vehiclesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: spacing.md
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
    alignItems: 'center'
  },
  preferenceText: {
    fontSize: fontSize.lg,
    color: colors.textPrimary,
    marginLeft: spacing.md
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

