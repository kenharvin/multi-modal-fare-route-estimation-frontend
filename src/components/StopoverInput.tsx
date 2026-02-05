import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Stopover, StopoverType, Location } from '@/types';
import { Button } from 'react-native-paper';
import DestinationInput from '@components/DestinationInput';
interface StopoverInputProps {
  stopovers: Stopover[];
  onAddStopover: (stopover: Stopover) => void;
  onRemoveStopover: (id: string) => void;
  searchProvider?: (query: string) => Promise<Location[]>;
  onPickFromMap?: (type: StopoverType) => void;
}

const StopoverInput: React.FC<StopoverInputProps> = ({
  stopovers,
  onAddStopover,
  onRemoveStopover,
  searchProvider,
  onPickFromMap
}) => {
  const [isAdding, setIsAdding] = useState<boolean>(false);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [selectedType, setSelectedType] = useState<StopoverType>(StopoverType.GAS);
  const [draftKey, setDraftKey] = useState<number>(0);

  const stopoverTypes = [
    { value: StopoverType.GAS, label: 'Gas Station', icon: 'gas-station' },
    { value: StopoverType.FOOD, label: 'Food', icon: 'food' },
    { value: StopoverType.REST, label: 'Rest', icon: 'sleep' },
    { value: StopoverType.OTHER, label: 'Other', icon: 'map-marker' }
  ];

  const canAddMore = stopovers.length < 3;
  const canConfirm = useMemo(() => {
    if (!selectedLocation) return false;
    const lat = selectedLocation?.coordinates?.latitude;
    const lon = selectedLocation?.coordinates?.longitude;
    return typeof lat === 'number' && typeof lon === 'number' && !(lat === 0 && lon === 0);
  }, [selectedLocation]);

  const handleConfirmAdd = () => {
    if (!selectedLocation) {
      Alert.alert('Missing Information', 'Please select a stopover location');
      return;
    }

    if (!canConfirm) {
      Alert.alert('Missing Coordinates', 'Please pick a suggested location (with coordinates)');
      return;
    }

    const newStopover: Stopover = {
      id: Date.now().toString(),
      location: selectedLocation,
      type: selectedType
    };

    onAddStopover(newStopover);
    setSelectedLocation(null);
    setSelectedType(StopoverType.GAS);
    setIsAdding(false);
    setDraftKey((k) => k + 1);
  };

  const handleCancel = () => {
    setSelectedLocation(null);
    setSelectedType(StopoverType.GAS);
    setIsAdding(false);
    // Remount DestinationInput to clear its internal searchText state.
    setDraftKey((k) => k + 1);
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

      {!isAdding ? (
        <Button
          mode="outlined"
          onPress={() => setIsAdding(true)}
          style={styles.addButton}
          icon="plus"
          disabled={!canAddMore}
        >
          Add Stopover
        </Button>
      ) : (
        <View style={styles.form}>
          <DestinationInput
            key={`stopover-draft-${draftKey}`}
            label="Stopover"
            value={selectedLocation}
            onValueChange={setSelectedLocation}
            placeholder="Search stopover"
            searchProvider={searchProvider}
          />

          <Text style={styles.typeLabel}>Stopover Type</Text>
          <View style={styles.typesContainer}>
            {stopoverTypes.map((type) => (
              <TouchableOpacity
                key={type.value}
                style={[styles.typeCard, selectedType === type.value && styles.typeCardActive]}
                onPress={() => setSelectedType(type.value)}
              >
                <Text style={{ fontSize: 28, color: selectedType === type.value ? '#2196f3' : '#7f8c8d' }}>
                  {type.label.charAt(0)}
                </Text>
                <Text style={[styles.typeLabel, selectedType === type.value && styles.typeLabelActive]}>
                  {type.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {typeof onPickFromMap === 'function' && (
            <Button
              mode="outlined"
              icon="map"
              onPress={() => {
                try {
                  onPickFromMap(selectedType);
                } finally {
                  handleCancel();
                }
              }}
              style={styles.mapPickButton}
            >
              Pick from Map
            </Button>
          )}

          <View style={styles.buttonRow}>
            <Button
              mode="outlined"
              onPress={handleCancel}
              style={[styles.button, styles.cancelButton]}
            >
              Cancel
            </Button>
            <Button
              mode="contained"
              onPress={handleConfirmAdd}
              style={[styles.button, styles.confirmButton]}
              disabled={!canConfirm}
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
  mapPickButton: {
    borderRadius: 8,
    borderColor: '#2980b9',
    marginBottom: 12
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

