import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '@navigation/types';
import { TravelMode } from '@/types';
import { useApp } from '@context/AppContext';
type ModeSelectionNavigationProp = StackNavigationProp<RootStackParamList, 'ModeSelection'>;

const ModeSelectionScreen: React.FC = () => {
  const navigation = useNavigation<ModeSelectionNavigationProp>();
  const { setTravelMode } = useApp();

  const handleModeSelection = (mode: TravelMode) => {
    setTravelMode(mode);
    if (mode === TravelMode.PUBLIC_TRANSPORT) {
      navigation.navigate('PublicTransport');
    } else {
      navigation.navigate('PrivateVehicle');
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Choose Travel Mode</Text>
        <Text style={styles.subtitle}>Select how you want to travel</Text>
      </View>

      <View style={styles.modesContainer}>
        <TouchableOpacity
          style={styles.modeCard}
          onPress={() => handleModeSelection(TravelMode.PUBLIC_TRANSPORT)}
        >
          <Text style={styles.modeTitle}>Public Transport</Text>
          <Text style={styles.modeDescription}>
            Find the best routes using jeepney, bus, UV express, and train
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.modeCard}
          onPress={() => handleModeSelection(TravelMode.PRIVATE_VEHICLE)}
        >
          <Text style={styles.modeTitle}>Private Vehicle</Text>
          <Text style={styles.modeDescription}>
            Calculate fuel costs and find optimal routes for your car or motorcycle
          </Text>
        </TouchableOpacity>
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
    paddingTop: 40,
    backgroundColor: '#fff'
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 8
  },
  subtitle: {
    fontSize: 16,
    color: '#7f8c8d'
  },
  modesContainer: {
    padding: 20
  },
  modeCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16
  },
  modeTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 8
  },
  modeDescription: {
    fontSize: 14,
    color: '#7f8c8d',
    lineHeight: 20,
    marginBottom: 16
  },
  features: {
    marginTop: 8
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8
  },
  featureText: {
    fontSize: 14,
    color: '#34495e',
    marginLeft: 8
  }
});

export default ModeSelectionScreen;

