import { StyleSheet } from 'react-native';
import { borderRadius, fontSize, shadows, spacing, type ThemeColors } from '@/utils/theme';

export const createStopoverInputStyles = (colors: ThemeColors) =>
  StyleSheet.create({
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
