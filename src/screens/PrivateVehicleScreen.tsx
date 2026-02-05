import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
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
import { searchPois } from '@services/api';
type PrivateVehicleNavigationProp = StackNavigationProp<RootStackParamList, 'PrivateVehicle'>;

const PrivateVehicleScreen: React.FC = () => {
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
  const [stopoverPickActive, setStopoverPickActive] = useState<boolean>(false);
  const [pendingStopoverType, setPendingStopoverType] = useState<StopoverType>(StopoverType.OTHER);
  const [mapOpenedForStopoverPick, setMapOpenedForStopoverPick] = useState<boolean>(false);
  const [preferences, setPreferences] = useState<DrivingPreferences>({
    avoidTolls: false,
    avoidHighways: false,
    preferShortest: true
  });

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

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Private Vehicle Planner</Text>
        <Text style={styles.subtitle}>Calculate fuel costs and plan your route</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Locations</Text>
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
        
        <TouchableOpacity
          style={styles.mapButton}
          onPress={handleToggleMap}
        >
          <Text>*</Text>
          <Text style={styles.mapButtonText}>
            {showMap ? 'Hide Map' : 'Select from Map'}
          </Text>
        </TouchableOpacity>

        {showMap && (
          <View style={styles.mapContainer}>
            <MapViewComponent
              origin={selectedOrigin}
              destination={selectedDestination}
              onOriginSelect={setSelectedOrigin}
              onDestinationSelect={setSelectedDestination}
              stopovers={stopovers}
              onStopoverSelect={handleStopoverSelectedFromMap}
              autoSelectMode={stopoverPickActive ? 'stopover' : null}
            />
          </View>
        )}
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
              <Text style={{fontSize: 28, color: vehicle.category === cat.value ? '#2196f3' : '#7f8c8d'}}>
                {cat.label.charAt(0)}
              </Text>
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
        <Text style={styles.sectionTitle}>Driving Preferences</Text>
        
        <View style={styles.preferenceRow}>
          <View style={styles.preferenceInfo}>
            <Text>NO$</Text>
            <Text style={styles.preferenceText}>Avoid Tolls</Text>
          </View>
          <Switch
            value={preferences.avoidTolls}
            onValueChange={(value) => setPreferences({ ...preferences, avoidTolls: value })}
            color="#2196f3"
          />
        </View>

        <View style={styles.preferenceRow}>
          <View style={styles.preferenceInfo}>
            <Text>ROAD</Text>
            <Text style={styles.preferenceText}>Avoid Highways</Text>
          </View>
          <Switch
            value={preferences.avoidHighways}
            onValueChange={(value) => setPreferences({ ...preferences, avoidHighways: value })}
            color="#2196f3"
          />
        </View>

        <View style={styles.preferenceRow}>
          <View style={styles.preferenceInfo}>
            <Text>DIST</Text>
            <Text style={styles.preferenceText}>Prefer Shortest Distance</Text>
          </View>
          <Switch
            value={preferences.preferShortest}
            onValueChange={(value) => setPreferences({ ...preferences, preferShortest: value })}
            color="#2196f3"
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5'
  },
  header: {
    padding: 20,
    backgroundColor: '#fff'
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 4
  },
  subtitle: {
    fontSize: 14,
    color: '#7f8c8d'
  },
  section: {
    backgroundColor: '#fff',
    padding: 20,
    marginTop: 10
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 8
  },
  sectionSubtitle: {
    fontSize: 12,
    color: '#7f8c8d',
    marginBottom: 16
  },
  mapButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    backgroundColor: '#e3f2fd',
    borderRadius: 8,
    marginTop: 12
  },
  mapButtonText: {
    color: '#2196f3',
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 8
  },
  mapContainer: {
    height: 300,
    marginTop: 16,
    borderRadius: 8,
    overflow: 'hidden'
  },
  vehiclesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16
  },
  vehicleCard: {
    width: '30%',
    alignItems: 'center',
    padding: 12,
    margin: 4,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent'
  },
  vehicleCardActive: {
    backgroundColor: '#e3f2fd',
    borderColor: '#2196f3'
  },
  vehicleLabel: {
    fontSize: 12,
    color: '#7f8c8d',
    marginTop: 4,
    textAlign: 'center',
    fontWeight: '500'
  },
  vehicleLabelActive: {
    color: '#2196f3',
    fontWeight: '600'
  },
  efficiencyText: {
    fontSize: 10,
    color: '#95a5a6',
    marginTop: 2
  },
  input: {
    marginBottom: 12
  },
  preferenceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#ecf0f1'
  },
  preferenceInfo: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  preferenceText: {
    fontSize: 16,
    color: '#2c3e50',
    marginLeft: 12
  },
  footer: {
    padding: 20,
    paddingBottom: 40
  },
  calculateButton: {
    borderRadius: 12,
    backgroundColor: '#2196f3'
  },
  calculateButtonContent: {
    paddingVertical: 8
  },
  calculateButtonLabel: {
    fontSize: 16,
    fontWeight: '600'
  }
});

export default PrivateVehicleScreen;

