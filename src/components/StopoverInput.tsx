import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Stopover, StopoverType, Location } from '@/types';
import { Button } from 'react-native-paper';
import DestinationInput from '@components/DestinationInput';
import { borderRadius, colors, fontSize, shadows, spacing } from '@/utils/theme';
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
          {stopovers.map((stopover) => (
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
    marginTop: spacing.sm
  },
  stopoversList: {
    marginBottom: spacing.lg
  },
  stopoverCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.gray6,
    ...shadows.small
  },
  stopoverHeader: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  stopoverInfo: {
    flex: 1,
    marginLeft: spacing.md
  },
  stopoverName: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.textPrimary
  },
  stopoverType: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    textTransform: 'capitalize',
    marginTop: spacing.xs
  },
  removeButton: {
    padding: spacing.xs
  },
  addButton: {
    borderRadius: borderRadius.xl,
    borderColor: colors.primary
  },
  form: {
    backgroundColor: colors.white,
    padding: spacing.lg,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.gray6,
    ...shadows.small
  },
  typeLabel: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.md
  },
  typesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.lg
  },
  typeCard: {
    flex: 1,
    alignItems: 'center',
    padding: spacing.md,
    marginHorizontal: 4,
    backgroundColor: colors.gray7,
    borderRadius: borderRadius.xl,
    borderWidth: 2,
    borderColor: 'transparent'
  },
  typeCardActive: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary
  },
  typeLabelActive: {
    color: colors.primary,
    fontWeight: '600'
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  mapPickButton: {
    borderRadius: borderRadius.xl,
    borderColor: colors.primaryDark,
    marginBottom: spacing.md
  },
  button: {
    flex: 1,
    marginHorizontal: 4,
    borderRadius: borderRadius.xl
  },
  cancelButton: {
    borderColor: colors.error
  },
  confirmButton: {
    backgroundColor: colors.success
  }
});

export default StopoverInput;

