import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Alert } from 'react-native';
import { Stopover, StopoverType, Location } from '@/types';
import { Button, TextInput } from 'react-native-paper';
interface StopoverInputProps {
  stopovers: Stopover[];
  onAddStopover: (stopover: Stopover) => void;
  onRemoveStopover: (id: string) => void;
}

const StopoverInput: React.FC<StopoverInputProps> = ({
  stopovers,
  onAddStopover,
  onRemoveStopover
}) => {
  const [showForm, setShowForm] = useState<boolean>(false);
  const [locationName, setLocationName] = useState<string>('');
  const [selectedType, setSelectedType] = useState<StopoverType>(StopoverType.GAS);

  const stopoverTypes = [
    { value: StopoverType.GAS, label: 'Gas Station', icon: 'gas-station' },
    { value: StopoverType.FOOD, label: 'Food', icon: 'food' },
    { value: StopoverType.REST, label: 'Rest', icon: 'sleep' },
    { value: StopoverType.OTHER, label: 'Other', icon: 'map-marker' }
  ];

  const handleAddStopover = () => {
    if (!locationName.trim()) {
      Alert.alert('Missing Information', 'Please enter a location name');
      return;
    }

    const newStopover: Stopover = {
      id: Date.now().toString(),
      location: {
        name: locationName,
        coordinates: { latitude: 0, longitude: 0 } // Will be filled by map selection or geocoding
      },
      type: selectedType
    };

    onAddStopover(newStopover);
    setLocationName('');
    setSelectedType(StopoverType.GAS);
    setShowForm(false);
  };

  const getStopoverIcon = (type: StopoverType): string => {
    const typeObj = stopoverTypes.find(t => t.value === type);
    return typeObj?.icon || 'map-marker';
  };

  const getStopoverColor = (type: StopoverType): string => {
    switch (type) {
      case StopoverType.GAS:
        return '#e74c3c';
      case StopoverType.FOOD:
        return '#f39c12';
      case StopoverType.REST:
        return '#9b59b6';
      default:
        return '#3498db';
    }
  };

  return (
    <View style={styles.container}>
      {stopovers.length > 0 && (
        <View style={styles.stopoversList}>
          {stopovers.map((stopover, index) => (
            <View key={stopover.id} style={styles.stopoverCard}>
              <View style={styles.stopoverHeader}>
                <Text style={{fontSize: 24}}>{stopover.type.charAt(0).toUpperCase()}</Text>
                <View style={styles.stopoverInfo}>
                  <Text style={styles.stopoverName}>{stopover.location.name}</Text>
                  <Text style={styles.stopoverType}>{stopover.type}</Text>
                </View>
                <TouchableOpacity
                  onPress={() => onRemoveStopover(stopover.id)}
                  style={styles.removeButton}
                >
                  <Text>X</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      )}

      {!showForm ? (
        <Button
          mode="outlined"
          onPress={() => setShowForm(true)}
          style={styles.addButton}
          icon="plus"
          disabled={stopovers.length >= 5}
        >
          Add Stopover
        </Button>
      ) : (
        <View style={styles.form}>
          <TextInput
            label="Location Name"
            value={locationName}
            onChangeText={setLocationName}
            mode="outlined"
            style={styles.input}
            placeholder="Enter stopover location"
          />

          <Text style={styles.typeLabel}>Stopover Type</Text>
          <View style={styles.typesContainer}>
            {stopoverTypes.map((type) => (
              <TouchableOpacity
                key={type.value}
                style={[
                  styles.typeCard,
                  selectedType === type.value && styles.typeCardActive
                ]}
                onPress={() => setSelectedType(type.value)}
              >
                <Text style={{fontSize: 28, color: selectedType === type.value ? '#2196f3' : '#7f8c8d'}}>
                  {type.label.charAt(0)}
                </Text>
                <Text
                  style={[
                    styles.typeLabel,
                    selectedType === type.value && styles.typeLabelActive
                  ]}
                >
                  {type.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.buttonRow}>
            <Button
              mode="outlined"
              onPress={() => {
                setShowForm(false);
                setLocationName('');
                setSelectedType(StopoverType.GAS);
              }}
              style={[styles.button, styles.cancelButton]}
            >
              Cancel
            </Button>
            <Button
              mode="contained"
              onPress={handleAddStopover}
              style={[styles.button, styles.confirmButton]}
            >
              Add
            </Button>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 8
  },
  stopoversList: {
    marginBottom: 16
  },
  stopoverCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#ecf0f1'
  },
  stopoverHeader: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  stopoverInfo: {
    flex: 1,
    marginLeft: 12
  },
  stopoverName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c3e50'
  },
  stopoverType: {
    fontSize: 12,
    color: '#7f8c8d',
    textTransform: 'capitalize',
    marginTop: 2
  },
  removeButton: {
    padding: 4
  },
  addButton: {
    borderRadius: 8,
    borderColor: '#2196f3'
  },
  form: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ecf0f1'
  },
  input: {
    marginBottom: 16,
    backgroundColor: '#fff'
  },
  typeLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 12
  },
  typesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16
  },
  typeCard: {
    flex: 1,
    alignItems: 'center',
    padding: 12,
    marginHorizontal: 4,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: 'transparent'
  },
  typeCardActive: {
    backgroundColor: '#e3f2fd',
    borderColor: '#2196f3'
  },
  typeLabelActive: {
    color: '#2196f3',
    fontWeight: '600'
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  button: {
    flex: 1,
    marginHorizontal: 4,
    borderRadius: 8
  },
  cancelButton: {
    borderColor: '#e74c3c'
  },
  confirmButton: {
    backgroundColor: '#27ae60'
  }
});

export default StopoverInput;

