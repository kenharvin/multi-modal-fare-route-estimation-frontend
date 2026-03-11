import { StyleSheet } from 'react-native';
import { borderRadius, fontSize, shadows, spacing, type ThemeColors } from '@/utils/theme';

export const createRouteCardStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      backgroundColor: colors.white,
      borderRadius: borderRadius.xl,
      padding: spacing.lg,
      marginBottom: spacing.lg,
      borderWidth: 1,
      borderColor: colors.gray6,
      ...shadows.small
    },
    containerSelected: {
      borderColor: colors.primary,
      borderWidth: 2,
      ...shadows.medium
    },
    rankBadge: {
      position: 'absolute',
      top: 12,
      left: 12,
      backgroundColor: colors.primary,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
      borderRadius: borderRadius.round,
      zIndex: 1
    },
    rankText: {
      color: colors.textWhite,
      fontSize: fontSize.sm,
      fontWeight: '700'
    },
    scoreBadge: {
      position: 'absolute',
      top: 12,
      right: 12,
      backgroundColor: colors.accent,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
      borderRadius: borderRadius.round,
      flexDirection: 'row',
      alignItems: 'center',
      zIndex: 1
    },
    scoreIcon: {
      color: colors.textWhite,
      fontSize: fontSize.sm,
      fontWeight: '700'
    },
    scoreText: {
      color: colors.textWhite,
      fontSize: fontSize.sm,
      fontWeight: '700',
      marginLeft: spacing.xs
    },
    transportIcons: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'center',
      marginBottom: spacing.lg
    },
    iconContainer: {
      marginHorizontal: spacing.xs,
      marginVertical: spacing.xs
    },
    transportBadge: {
      width: 36,
      height: 36,
      borderRadius: borderRadius.round,
      justifyContent: 'center',
      alignItems: 'center'
    },
    transportIcon: {
      fontSize: 18,
      color: colors.textWhite
    },
    infoGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      backgroundColor: colors.gray7,
      borderRadius: borderRadius.xl,
      padding: spacing.md,
      borderWidth: 1,
      borderColor: colors.gray6
    },
    infoCell: {
      width: '50%',
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.xs
    },
    infoLabel: {
      fontSize: fontSize.xs,
      color: colors.textSecondary,
      marginTop: 2
    },
    infoValue: {
      fontSize: fontSize.md,
      fontWeight: '700',
      color: colors.textPrimary,
      marginTop: 2
    },
    infoValueWrap: {
      lineHeight: 18,
      flexShrink: 1
    },
    tapHintText: {
      textAlign: 'center',
      color: colors.textSecondary,
      marginTop: spacing.md,
      fontSize: fontSize.sm
    },
    mapActionRow: {
      marginTop: spacing.md,
      marginBottom: spacing.sm,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.sm,
    },
    mapActionText: {
      flex: 1,
      fontSize: fontSize.sm,
      color: colors.textSecondary,
      fontWeight: '600',
    },
    mapActionButton: {
      backgroundColor: colors.primary,
      borderRadius: borderRadius.lg,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
    },
    mapActionButtonText: {
      color: colors.textWhite,
      fontSize: fontSize.sm,
      fontWeight: '700',
    },
    segmentsSection: {
      marginTop: spacing.lg
    },
    stepsTitle: {
      fontSize: fontSize.lg,
      fontWeight: '700',
      color: colors.textPrimary,
      marginBottom: spacing.md
    },
    stepsList: {
      position: 'relative'
    },
    stepsRail: {
      position: 'absolute',
      left: 13,
      top: 6,
      bottom: 6,
      width: 2,
      backgroundColor: colors.gray6
    },
    stepRow: {
      flexDirection: 'row',
      marginBottom: spacing.md
    },
    stepLeft: {
      width: 34,
      alignItems: 'center'
    },
    stepDot: {
      width: 26,
      height: 26,
      borderRadius: 13,
      borderWidth: 2,
      backgroundColor: colors.white,
      alignItems: 'center',
      justifyContent: 'center'
    },
    stepDotInner: {
      width: 20,
      height: 20,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center'
    },
    stepDotIcon: {
      color: colors.textWhite,
      fontSize: 11,
      fontWeight: '700'
    },
    stepMain: {
      flex: 1,
      backgroundColor: colors.white,
      borderWidth: 1,
      borderColor: colors.gray6,
      borderRadius: borderRadius.xl,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.md,
      ...shadows.small
    },
    stepTopRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: 10
    },
    stepTitle: {
      fontSize: fontSize.md,
      fontWeight: '700',
      color: colors.textPrimary,
      flex: 1
    },
    stepMeta: {
      fontSize: fontSize.sm,
      color: colors.textSecondary,
      fontWeight: '700'
    },
    stepSubtitle: {
      fontSize: fontSize.sm,
      color: colors.gray2,
      marginTop: spacing.sm,
      lineHeight: 16
    }
  });
