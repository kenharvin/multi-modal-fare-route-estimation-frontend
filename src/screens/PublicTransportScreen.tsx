import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, TextInput } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '@navigation/types';
import { PublicTransportPreference, Location } from '@/types';
import { useLocation } from '@context/LocationContext';
import { useApp } from '@context/AppContext';
import DestinationInput from '@components/DestinationInput';
import MapViewComponent from '@components/MapViewComponent';
import { Button } from 'react-native-paper';
type PublicTransportNavigationProp = StackNavigationProp<RootStackParamList, 'PublicTransport'>;

const PublicTransportScreen: React.FC = () => {
  const navigation = useNavigation<PublicTransportNavigationProp>();
  const { selectedOrigin, selectedDestination, setSelectedOrigin, setSelectedDestination } = useLocation();
  const { setIsLoading } = useApp();
  const [preference, setPreference] = useState<PublicTransportPreference>(PublicTransportPreference.SHORTEST_TIME);
  const [showMap, setShowMap] = useState<boolean>(false);
  const [budget, setBudget] = useState<string>('500');
  const [maxTransfers, setMaxTransfers] = useState<string>('3');
  const [preferredModes, setPreferredModes] = useState<string[]>(['walk','jeepney','bus','lrt','mrt','pnr']);

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
      budget: Number(budget) || undefined,
      maxTransfers: Number(maxTransfers) || undefined,
      preferredModes
    });
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Public Transport Planner</Text>
        <Text style={styles.subtitle}>Find the best routes for your journey</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Locations</Text>
        <DestinationInput
          label="Origin"
          value={selectedOrigin}
          onValueChange={setSelectedOrigin}
          placeholder="Where are you starting from?"
        />
        <DestinationInput
          label="Destination"
          value={selectedDestination}
          onValueChange={setSelectedDestination}
          placeholder="Where are you going?"
        />
        
        <TouchableOpacity
          style={styles.mapButton}
          onPress={() => setShowMap(!showMap)}
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
            />
          </View>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Preferences</Text>
        <View style={styles.preferencesContainer}>
          {preferences.map((pref) => (
            <TouchableOpacity
              key={pref.value}
              style={[
                styles.preferenceCard,
                preference === pref.value && styles.preferenceCardActive
              ]}
              onPress={() => setPreference(pref.value)}
            >
              <Text style={{fontSize: 32, color: preference === pref.value ? '#3498db' : '#7f8c8d'}}>
                {pref.label.charAt(0)}
              </Text>
              <Text
                style={[
                  styles.preferenceLabel,
                  preference === pref.value && styles.preferenceLabelActive
                ]}
              >
                {pref.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.inputRow}>
          <View style={styles.inputCol}>
            <Text style={styles.inputLabel}>Budget (₱)</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={budget}
              onChangeText={setBudget}
              placeholder="e.g. 500"
            />
          </View>
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
        </View>

        <Text style={[styles.inputLabel, { marginTop: 12 }]}>Preferred Modes</Text>
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
        <Button
          mode="contained"
          onPress={handleFindRoutes}
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
    color: '#3498db',
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
  preferencesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between'
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
    fontSize: 12,
    color: '#7f8c8d',
    marginBottom: 6
  },
  input: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#ecf0f1',
    borderRadius: 8,
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
    borderColor: '#ecf0f1',
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: '#f8f9fa'
  },
  modeChipActive: {
    backgroundColor: '#e3f2fd',
    borderColor: '#3498db'
  },
  modeChipText: {
    fontSize: 12,
    color: '#7f8c8d'
  },
  modeChipTextActive: {
    color: '#3498db',
    fontWeight: '600'
  },
  preferenceCard: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
    marginHorizontal: 4,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent'
  },
  preferenceCardActive: {
    backgroundColor: '#e3f2fd',
    borderColor: '#3498db'
  },
  preferenceLabel: {
    fontSize: 12,
    color: '#7f8c8d',
    marginTop: 8,
    textAlign: 'center',
    fontWeight: '500'
  },
  preferenceLabelActive: {
    color: '#3498db',
    fontWeight: '600'
  },
  footer: {
    padding: 20,
    paddingBottom: 40
  },
  findButton: {
    borderRadius: 12,
    backgroundColor: '#3498db'
  },
  findButtonContent: {
    paddingVertical: 8
  },
  findButtonLabel: {
    fontSize: 16,
    fontWeight: '600'
  }
});

export default PublicTransportScreen;

