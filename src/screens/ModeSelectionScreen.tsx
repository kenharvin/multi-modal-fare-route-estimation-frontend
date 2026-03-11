import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '@navigation/types';
import { TravelMode } from '@/types';
import { useApp } from '@context/AppContext';
import { useLocation } from '@context/LocationContext';
import { useThemeMode } from '@context/ThemeContext';
import { createModeSelectionScreenStyles } from '@/styles/screens/modeSelectionScreen.styles';
type ModeSelectionNavigationProp = StackNavigationProp<RootStackParamList, 'ModeSelection'>;

const ModeSelectionScreen: React.FC = () => {
  const { colors } = useThemeMode();
  const styles = useMemo(() => createModeSelectionScreenStyles(colors), [colors]);
  const navigation = useNavigation<ModeSelectionNavigationProp>();
  const { travelMode, setTravelMode } = useApp();
  const { clearSelectedLocations } = useLocation();

  const handleModeSelection = (mode: TravelMode) => {
    if (travelMode && travelMode !== mode) {
      clearSelectedLocations();
    }
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
            Find the best routes using jeepney, bus, and train
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

export default ModeSelectionScreen;

