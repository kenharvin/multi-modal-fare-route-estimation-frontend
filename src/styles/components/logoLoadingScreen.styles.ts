import { StyleSheet } from 'react-native';
import { fontSize, spacing, type ThemeColors } from '@/utils/theme';

export const createLogoLoadingScreenStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: spacing.lg
    },
    logoWrap: {
      width: 220,
      height: 220,
      marginBottom: spacing.md
    },
    logo: {
      width: '100%',
      height: '100%'
    },
    title: {
      color: colors.textWhite,
      fontSize: 34,
      fontWeight: '800',
      letterSpacing: 0.5
    },
    subtitle: {
      marginTop: spacing.sm,
      color: colors.textWhite,
      fontSize: fontSize.lg,
      opacity: 0.92
    }
  });
