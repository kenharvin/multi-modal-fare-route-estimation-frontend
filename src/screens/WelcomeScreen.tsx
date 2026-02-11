import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, useWindowDimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '@navigation/types';
import { borderRadius, fontSize, shadows, spacing, type ThemeColors } from '@/utils/theme';
import { useThemeMode } from '@context/ThemeContext';

type WelcomeScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Welcome'>;

const WELCOME_IMAGE = require('../assets/images/628106684_902319769440556_4828750431026813083_n-removebg-preview.png');

const WelcomeScreen: React.FC = () => {
  const { colors } = useThemeMode();
  const styles = useMemo(() => createStyles(colors), [colors]);
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

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg
  },
  header: {
    marginTop: spacing.xxl + spacing.lg,
    alignItems: 'center'
  },
  title: {
    fontSize: 44,
    fontWeight: 'bold',
    color: colors.textWhite,
    textAlign: 'center'
  },
  subtitle: {
    fontSize: fontSize.lg,
    color: colors.textWhite,
    marginTop: spacing.sm,
    textAlign: 'center'
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  heroImage: {
    marginTop: spacing.md
  },
  footer: {
    marginBottom: spacing.xxl
  },
  button: {
    backgroundColor: colors.textWhite,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.xl,
    alignItems: 'center',
    ...shadows.medium
  },
  buttonText: {
    color: colors.primary,
    fontSize: fontSize.xl,
    fontWeight: '600'
  }
});

export default WelcomeScreen;
