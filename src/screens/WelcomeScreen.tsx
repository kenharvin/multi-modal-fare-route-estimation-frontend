import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, Image, useWindowDimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '@navigation/types';
import { useThemeMode } from '@context/ThemeContext';
import { createWelcomeScreenStyles } from '@/styles/screens/welcomeScreen.styles';

type WelcomeScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Welcome'>;

const WELCOME_IMAGE = require('../assets/images/628106684_902319769440556_4828750431026813083_n-removebg-preview.png');

const WelcomeScreen: React.FC = () => {
  const { colors } = useThemeMode();
  const styles = useMemo(() => createWelcomeScreenStyles(colors), [colors]);
  const navigation = useNavigation<WelcomeScreenNavigationProp>();
  const { width, height } = useWindowDimensions();
  const logoWidth = Math.min(520, Math.round(width * 0.98));
  const logoHeight = Math.min(520, Math.round(height * 0.6));

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>NaviGO</Text>
        <Text style={styles.subtitle}>Plan routes. Estimate fares.</Text>
      </View>

      <View style={styles.content}>
        <Image
          source={WELCOME_IMAGE}
          style={[styles.heroImage, { width: logoWidth, height: logoHeight }]}
          resizeMode="contain"
        />
      </View>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.navigate('ModeSelection')}
        >
          <Text style={styles.buttonText}>Get Started</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default WelcomeScreen;
