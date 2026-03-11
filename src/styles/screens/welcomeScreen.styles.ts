import { StyleSheet } from 'react-native';
import { borderRadius, fontSize, shadows, spacing, type ThemeColors } from '@/utils/theme';

export const createWelcomeScreenStyles = (colors: ThemeColors) =>
  StyleSheet.create({
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
