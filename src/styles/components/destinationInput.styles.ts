import { StyleSheet } from 'react-native';
import { borderRadius, fontSize, shadows, spacing, type ThemeColors } from '@/utils/theme';

export const createDestinationInputStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      marginBottom: spacing.lg
    },
    label: {
      fontSize: fontSize.sm,
      fontWeight: '700',
      color: colors.textSecondary,
      marginBottom: spacing.sm,
      letterSpacing: 0.3
    },
    inputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.white,
      borderRadius: borderRadius.xl,
      borderWidth: 1,
      borderColor: colors.gray6,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs,
      ...shadows.small
    },
    leadingPin: {
      marginRight: spacing.sm
    },
    icon: {
      marginRight: 8
    },
    input: {
      flex: 1,
      fontSize: fontSize.lg,
      color: colors.textPrimary,
      paddingVertical: spacing.md
    },
    clearButton: {
      padding: spacing.xs
    },
    clearButtonText: {
      color: colors.textSecondary,
      fontWeight: '700'
    },
    pinButton: {
      width: 34,
      height: 34,
      borderRadius: borderRadius.round,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.primaryLight,
      borderWidth: 1,
      borderColor: colors.primary,
      marginLeft: spacing.xs,
      marginRight: spacing.xs
    },
    suggestionsContainer: {
      backgroundColor: colors.white,
      borderRadius: borderRadius.xl,
      marginTop: spacing.sm,
      borderWidth: 1,
      borderColor: colors.gray6,
      maxHeight: 200,
      ...shadows.medium
    },
    suggestionItem: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.gray6
    },
    suggestionInfo: {
      flex: 1,
      marginLeft: spacing.md
    },
    suggestionPinText: {
      color: colors.textSecondary,
      fontSize: fontSize.sm,
      fontWeight: '700'
    },
    suggestionName: {
      fontSize: fontSize.md,
      color: colors.textPrimary,
      fontWeight: '500'
    },
    suggestionAddress: {
      fontSize: fontSize.sm,
      color: colors.textSecondary,
      marginTop: spacing.xs
    }
  });
