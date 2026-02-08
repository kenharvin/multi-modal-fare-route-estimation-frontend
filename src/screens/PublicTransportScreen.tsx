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
import { borderRadius, colors, fontSize, shadows, spacing } from '@/utils/theme';
type PublicTransportNavigationProp = StackNavigationProp<RootStackParamList, 'PublicTransport'>;

const PublicTransportScreen: React.FC = () => {
  const navigation = useNavigation<PublicTransportNavigationProp>();
  const { selectedOrigin, selectedDestination, setSelectedOrigin, setSelectedDestination } = useLocation();
  const { setIsLoading } = useApp();
  const [preference, setPreference] = useState<PublicTransportPreference>(PublicTransportPreference.BALANCED);
  const [showMap, setShowMap] = useState<boolean>(false);
  // Leave empty by default; only constrain when user enters a value.
  const [budget, setBudget] = useState<string>('');
  // Leave empty by default so long-distance trips aren't accidentally filtered out.
  const [maxTransfers, setMaxTransfers] = useState<string>('');
  const [preferredModes, setPreferredModes] = useState<string[]>(['walk','jeepney','bus','lrt','mrt','pnr']);

  const preferences = [
    { value: PublicTransportPreference.BALANCED, label: 'Recommended', icon: 'star' },
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
              placeholder="Optional (e.g. 150)"
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
    backgroundColor: colors.background
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    backgroundColor: colors.white
  },
  title: {
    fontSize: fontSize.title,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: spacing.xs
  },
  subtitle: {
    fontSize: fontSize.md,
    color: colors.textSecondary
  },
  section: {
    backgroundColor: colors.white,
    padding: spacing.lg,
    marginTop: spacing.md,
    marginHorizontal: spacing.lg,
    borderRadius: borderRadius.xl,
    ...shadows.small
  },
  sectionTitle: {
    fontSize: fontSize.xl,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.lg
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
  mapButtonText: {
    color: colors.primary,
    fontSize: fontSize.lg,
    fontWeight: '500',
    marginLeft: spacing.sm
  },
  mapContainer: {
    height: 300,
    marginTop: spacing.lg,
    borderRadius: borderRadius.lg,
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
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.sm
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
    borderColor: colors.gray6,
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
    color: colors.primary,
    fontWeight: '600'
  },
  preferenceCard: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
    marginHorizontal: 4,
    backgroundColor: colors.gray7,
    borderRadius: borderRadius.xl,
    borderWidth: 2,
    borderColor: 'transparent'
  },
  preferenceCardActive: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary
  },
  preferenceLabel: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.sm,
    textAlign: 'center',
    fontWeight: '500'
  },
  preferenceLabelActive: {
    color: colors.primary,
    fontWeight: '600'
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
    fontWeight: '600'
  }
});

export default PublicTransportScreen;

