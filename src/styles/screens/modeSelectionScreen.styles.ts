import { StyleSheet } from 'react-native';
import { borderRadius, fontSize, shadows, spacing, type ThemeColors } from '@/utils/theme';

export const createModeSelectionScreenStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background
    },
    header: {
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.xxl,
      paddingBottom: spacing.lg,
      backgroundColor: 'transparent'
    },
    title: {
      fontSize: fontSize.heading,
      fontWeight: 'bold',
      color: colors.textPrimary,
      marginBottom: spacing.sm,
      textAlign: 'center'
    },
    subtitle: {
      fontSize: fontSize.lg,
      color: colors.textSecondary,
      textAlign: 'center'
    },
    modesContainer: {
      padding: spacing.lg
    },
    modeCard: {
      backgroundColor: colors.white,
      borderRadius: borderRadius.xl,
      padding: spacing.xl,
      marginBottom: spacing.lg,
      borderWidth: 1,
      borderColor: colors.gray5,
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
      marginBottom: spacing.sm,
      textAlign: 'center'
    },
    modeDescription: {
      fontSize: fontSize.md,
      color: colors.textSecondary,
      lineHeight: 20,
      textAlign: 'center'
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
