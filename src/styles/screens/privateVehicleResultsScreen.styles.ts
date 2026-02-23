import { StyleSheet } from 'react-native';
import { borderRadius, fontSize, shadows, spacing, type ThemeColors } from '@/utils/theme';

export const createPrivateVehicleResultsScreenStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    mapFill: {
      ...StyleSheet.absoluteFillObject
    },
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
      marginTop: spacing.md,
      fontSize: fontSize.lg,
      color: colors.textSecondary
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: spacing.xl,
      backgroundColor: colors.background
    },
    emptyTitle: {
      fontSize: fontSize.title,
      fontWeight: 'bold',
      color: colors.textPrimary,
      marginTop: spacing.md,
      marginBottom: spacing.lg
    },
    retryButton: {
      borderRadius: borderRadius.lg
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
    sheetScroll: {
      flex: 1
    },
    sheetContent: {
      paddingBottom: spacing.xxl
    },
    warningCard: {
      backgroundColor: colors.accentLight,
      borderColor: colors.accentLight,
      borderWidth: 1,
      padding: spacing.md,
      marginHorizontal: spacing.lg,
      marginTop: spacing.lg,
      borderRadius: borderRadius.xl
    },
    warningTitle: {
      fontSize: fontSize.md,
      fontWeight: '700',
      color: colors.gray1,
      marginBottom: spacing.xs
    },
    warningText: {
      fontSize: fontSize.sm,
      color: colors.gray1
    },
    warningTextSmall: {
      fontSize: fontSize.xs,
      color: colors.gray1,
      marginTop: spacing.sm
    },
    summaryCard: {
      backgroundColor: colors.white,
      padding: spacing.lg,
      marginHorizontal: spacing.lg,
      marginTop: spacing.lg,
      borderRadius: borderRadius.xl,
      borderWidth: 1,
      borderColor: colors.gray6,
      ...shadows.small
    },
    summaryTitle: {
      fontSize: fontSize.xl,
      fontWeight: 'bold',
      color: colors.textPrimary,
      marginBottom: spacing.lg
    },
    overviewGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginBottom: spacing.lg
    },
    overviewItem: {
      width: '50%',
      alignItems: 'center',
      marginBottom: spacing.lg
    },
    iconCircle: {
      width: 56,
      height: 56,
      borderRadius: 28,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: spacing.sm
    },
    summaryLabel: {
      fontSize: fontSize.sm,
      color: colors.textSecondary,
      marginTop: spacing.sm
    },
    summaryValue: {
      fontSize: fontSize.xl,
      fontWeight: 'bold',
      color: colors.textPrimary,
      marginTop: spacing.xs
    },
    detailsSection: {
      borderTopWidth: 1,
      borderTopColor: colors.gray6,
      paddingTop: spacing.md
    },
    detailRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: spacing.md
    },
    detailLabel: {
      fontSize: fontSize.md,
      color: colors.textSecondary,
      marginLeft: spacing.md,
      flex: 1
    },
    detailValue: {
      fontSize: fontSize.md,
      fontWeight: '600',
      color: colors.textPrimary
    },
    detailNote: {
      fontSize: fontSize.xs,
      color: colors.textSecondary,
      marginTop: -spacing.xs,
      marginBottom: spacing.md,
      marginLeft: 36,
      fontStyle: 'italic'
    },
    legCard: {
      backgroundColor: colors.white,
      borderRadius: borderRadius.xl,
      borderLeftWidth: 6,
      borderLeftColor: colors.primary,
      padding: spacing.md,
      marginBottom: spacing.md,
      borderWidth: 1,
      borderColor: colors.gray6
    },
    legTitle: {
      fontSize: fontSize.md,
      fontWeight: '700',
      color: colors.textPrimary
    },
    legSubtitle: {
      fontSize: fontSize.sm,
      color: colors.textSecondary,
      marginTop: spacing.xs,
      marginBottom: spacing.md
    },
    legMetricsRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing.md,
    },
    verticalDivider: {
      width: 1,
      height: 36,
      backgroundColor: colors.gray5,
      marginHorizontal: spacing.md,
      borderRadius: 1,
    },
    legMetricItem: {
      flex: 1,
      alignItems: 'center'
    },
    metricLabelRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs
    },
    legMetricLabel: {
      fontSize: fontSize.sm,
      color: colors.textSecondary
    },
    legMetricValue: {
      fontSize: fontSize.lg,
      fontWeight: '700',
      color: colors.textPrimary,
      marginTop: spacing.xs
    },
    legMetaRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: spacing.md
    },
    legMetaText: {
      fontSize: fontSize.sm,
      color: colors.textSecondary
    },
    routeCard: {
      backgroundColor: colors.white,
      padding: spacing.lg,
      marginHorizontal: spacing.lg,
      marginTop: spacing.lg,
      borderRadius: borderRadius.xl,
      borderWidth: 1,
      borderColor: colors.gray6,
      ...shadows.small
    },
    routeTitle: {
      fontSize: fontSize.xl,
      fontWeight: '600',
      color: colors.textPrimary,
      marginBottom: spacing.md
    },
    locationRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: spacing.md
    },
    locationInfo: {
      marginLeft: spacing.md,
      flex: 1
    },
    locationLabel: {
      fontSize: fontSize.sm,
      color: colors.textSecondary
    },
    locationName: {
      fontSize: fontSize.lg,
      fontWeight: '600',
      color: colors.textPrimary,
      marginTop: 2
    },
    stopoversSection: {
      marginBottom: spacing.md,
      paddingLeft: spacing.md
    },
    stopoversTitle: {
      fontSize: fontSize.md,
      fontWeight: '600',
      color: colors.primary,
      marginBottom: spacing.md
    },
    stopoverRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: spacing.sm,
      paddingLeft: spacing.sm
    },
    stopoverInfo: {
      marginLeft: spacing.md
    },
    stopoverName: {
      fontSize: fontSize.md,
      color: colors.textPrimary
    },
    stopoverType: {
      fontSize: fontSize.sm,
      color: colors.textSecondary,
      textTransform: 'capitalize'
    },
    directionRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      marginBottom: spacing.md,
    },
    directionIconWrap: {
      width: 30,
      height: 30,
      borderRadius: borderRadius.round,
      backgroundColor: colors.primaryLight,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 2,
    },
    directionTextWrap: {
      flex: 1,
      marginLeft: spacing.md,
    },
    directionDistance: {
      fontSize: fontSize.xs,
      color: colors.textSecondary,
      marginBottom: 2,
    },
    directionInstruction: {
      fontSize: fontSize.md,
      color: colors.textPrimary,
      fontWeight: '500',
    },
    directionFallbackText: {
      fontSize: fontSize.sm,
      color: colors.textSecondary,
    },
    scoreCard: {
      backgroundColor: colors.white,
      padding: spacing.lg,
      marginHorizontal: spacing.lg,
      marginTop: spacing.lg,
      alignItems: 'center'
    },
    scoreTitle: {
      fontSize: fontSize.xl,
      fontWeight: '600',
      color: colors.textPrimary,
      marginBottom: spacing.md
    },
    scoreCircle: {
      width: 120,
      height: 120,
      borderRadius: 60,
      backgroundColor: colors.primaryLight,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: spacing.md
    },
    scoreValue: {
      fontSize: 36,
      fontWeight: 'bold',
      color: colors.primary
    },
    scoreLabel: {
      fontSize: fontSize.lg,
      color: colors.textSecondary
    },
    scoreDescription: {
      fontSize: fontSize.sm,
      color: colors.textSecondary,
      textAlign: 'center'
    },
    footer: {
      padding: spacing.lg,
      paddingBottom: spacing.xxl
    },
    saveButton: {
      borderRadius: borderRadius.lg,
      backgroundColor: colors.secondary
    }
  });
