import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '@navigation/types';
import { borderRadius, colors, fontSize, shadows, spacing } from '@/utils/theme';

type WelcomeScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Welcome'>;

const WelcomeScreen: React.FC = () => {
  const navigation = useNavigation<WelcomeScreenNavigationProp>();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Multi-Modal Fare &</Text>
        <Text style={styles.title}>Route Estimation System</Text>
        <Text style={styles.subtitle}>Plan your journey efficiently</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Text style={styles.iconText}>🚍 Transit 🚇 Planning 📍</Text>
        </View>
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.lg
  },
  header: {
    marginTop: spacing.xxl,
    alignItems: 'center'
  },
  title: {
    fontSize: fontSize.heading,
    fontWeight: 'bold',
    color: colors.textPrimary,
    textAlign: 'center'
  },
  subtitle: {
    fontSize: fontSize.lg,
    color: colors.textSecondary,
    marginTop: spacing.sm,
    textAlign: 'center'
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  iconContainer: {
    width: '100%',
    height: 280,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    paddingHorizontal: spacing.lg,
    ...shadows.small
  },
  iconText: {
    fontSize: 32,
    color: colors.primary,
    fontWeight: '600',
  },
  footer: {
    marginBottom: spacing.xxl
  },
  button: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.xl,
    alignItems: 'center',
    ...shadows.medium
  },
  buttonText: {
    color: colors.textWhite,
    fontSize: fontSize.xl,
    fontWeight: '600'
  }
});

export default WelcomeScreen;
