import { StyleSheet } from 'react-native';
import { borderRadius, fontSize, shadows, spacing, type ThemeColors } from '@/utils/theme';

export const createRouteResultsScreenStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.background
    },
    loadingText: {
      marginTop: 16,
      fontSize: 16,
      color: colors.textSecondary
    },
    emptyContainer: {
      flex: 1,
      backgroundColor: colors.background
    },
    mapContainer: {
      height: 300,
      margin: spacing.lg,
      borderRadius: borderRadius.xl,
      overflow: 'hidden',
      ...shadows.small
    },
    emptyContent: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 40
    },
    emptyTitle: {
      fontSize: fontSize.title,
      fontWeight: 'bold',
      color: colors.textPrimary,
      marginTop: 16
    },
    emptyText: {
      fontSize: fontSize.lg,
      color: colors.textSecondary,
      textAlign: 'center',
      marginTop: 8,
      marginBottom: 24
    },
    retryButton: {
      borderRadius: borderRadius.xl,
      backgroundColor: colors.primary
    },
    retryButtonLabel: {
      color: colors.textWhite,
      fontWeight: '700'
    },
    statusCard: {
      backgroundColor: colors.primaryLight,
      borderColor: colors.primary,
      borderWidth: 1,
      padding: spacing.md,
      marginBottom: spacing.md,
      borderRadius: borderRadius.xl,
    },
    statusTitle: {
      fontSize: fontSize.md,
      fontWeight: '700',
      color: colors.textPrimary,
      marginBottom: spacing.xs,
    },
    statusText: {
      fontSize: fontSize.sm,
      color: colors.textSecondary,
    },
    constraintCard: {
      backgroundColor: colors.gray7,
      borderColor: colors.gray5,
      borderWidth: 1,
      padding: spacing.md,
      marginBottom: spacing.md,
      borderRadius: borderRadius.xl,
    },
    constraintTitle: {
      fontSize: fontSize.md,
      fontWeight: '700',
      color: colors.textPrimary,
      marginBottom: spacing.xs,
    },
    constraintText: {
      fontSize: fontSize.sm,
      color: colors.textSecondary,
    },
    mapPreparationContainer: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: colors.background,
    },
    sheet: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: colors.white,
      borderTopLeftRadius: borderRadius.xl,
      borderTopRightRadius: borderRadius.xl,
      overflow: 'hidden',
      ...shadows.large
    },
    sheetHandleWrap: {
      paddingTop: spacing.sm,
      paddingBottom: spacing.sm,
      alignItems: 'center',
      gap: 6
    },
    sheetHandle: {
      width: 44,
      height: 5,
      borderRadius: 3,
      backgroundColor: colors.gray5
    },
    sheetHint: {
      fontSize: fontSize.sm,
      color: colors.textSecondary
    },
    routesList: {
      flex: 1
    },
    routesListContent: {
      padding: spacing.lg,
      paddingBottom: spacing.sm
    },
    footer: {
      backgroundColor: colors.white,
      padding: spacing.lg,
      borderTopWidth: 1,
      borderTopColor: colors.gray6
    },
    summaryTitle: {
      fontSize: fontSize.sm,
      fontWeight: '700',
      color: colors.textSecondary,
      marginBottom: spacing.sm,
      textTransform: 'uppercase',
      letterSpacing: 0.4
    },
    summaryEmptyHint: {
      fontSize: fontSize.md,
      color: colors.textSecondary,
      marginBottom: spacing.md,
    },
    summaryRow: {
      flexDirection: 'row',
      backgroundColor: colors.gray7,
      borderRadius: borderRadius.lg,
      borderWidth: 1,
      borderColor: colors.gray6,
      overflow: 'hidden',
      marginBottom: 16
    },
    summaryItem: {
      flex: 1,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.sm,
      minHeight: 74,
      justifyContent: 'center',
      alignItems: 'center'
    },
    summaryItemDivider: {
      borderRightWidth: 1,
      borderRightColor: colors.gray6
    },
    summaryLabel: {
      fontSize: fontSize.sm,
      color: colors.textSecondary,
      fontWeight: '600',
      marginBottom: 4
    },
    summaryValue: {
      fontSize: fontSize.md,
      fontWeight: '700',
      color: colors.textPrimary,
      textAlign: 'center'
    },
    continueButton: {
      borderRadius: borderRadius.xl,
      backgroundColor: colors.primary
    },
    continueButtonDisabled: {
      borderRadius: borderRadius.xl,
      backgroundColor: colors.gray5
    },
    calculateAnotherButton: {
      marginTop: spacing.sm,
      borderRadius: borderRadius.xl,
      borderColor: colors.primary
    },
    calculateAnotherButtonLabel: {
      color: colors.primary,
      fontWeight: '700'
    }
  });
