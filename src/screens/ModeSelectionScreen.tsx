import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '@navigation/types';
import { TravelMode } from '@/types';
import { useApp } from '@context/AppContext';
import { borderRadius, colors, fontSize, shadows, spacing } from '@/utils/theme';
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
    backgroundColor: colors.background
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.lg,
    backgroundColor: colors.white
  },
  title: {
    fontSize: fontSize.heading,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: spacing.sm
  },
  subtitle: {
    fontSize: fontSize.lg,
    color: colors.textSecondary
  },
  modesContainer: {
    padding: spacing.lg
  },
  modeCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    marginBottom: spacing.lg,
    ...shadows.medium
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
    fontSize: fontSize.xxl,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: spacing.sm
  },
  modeDescription: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    lineHeight: 20
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
    fontSize: fontSize.md,
    color: colors.gray2,
    marginLeft: spacing.sm
  }
});

export default ModeSelectionScreen;

