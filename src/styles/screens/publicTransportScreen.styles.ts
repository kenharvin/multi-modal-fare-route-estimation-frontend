import { StyleSheet } from 'react-native';
import { borderRadius, fontSize, shadows, spacing, type ThemeColors } from '@/utils/theme';

export const createPublicTransportScreenStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background
    },
    mapScreen: {
      flex: 1,
      backgroundColor: colors.background,
    },
    bottomSheet: {
      position: 'absolute',
      left: spacing.lg,
      right: spacing.lg,
      bottom: spacing.lg,
      backgroundColor: colors.white,
      borderRadius: borderRadius.xl,
      borderWidth: 1,
      borderColor: colors.gray5,
      ...shadows.small,
    },
    sheetHandleArea: {
      alignItems: 'center',
      paddingTop: spacing.sm,
      paddingBottom: spacing.sm,
    },
    sheetHandle: {
      width: 44,
      height: 5,
      borderRadius: borderRadius.round,
      backgroundColor: colors.gray6,
    },
    sheetHint: {
      marginTop: spacing.xs,
      fontSize: fontSize.sm,
      color: colors.textSecondary,
    },
    sheetScroll: {
      flex: 1,
    },
    sheetScrollContent: {
      paddingBottom: spacing.xxl,
    },
    sheetSection: {
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.lg,
    },
    sheetDivider: {
      height: 1,
      backgroundColor: colors.gray6,
      marginHorizontal: spacing.lg,
      marginBottom: spacing.lg,
    },
    sheetFooter: {
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.lg,
    },
    requiredHint: {
      fontSize: fontSize.sm,
      color: colors.textSecondary,
      textAlign: 'center',
      marginBottom: spacing.sm,
    },
    header: {
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.lg,
      paddingBottom: spacing.md,
      backgroundColor: 'transparent',
      borderWidth: 0
    },
    title: {
      fontSize: fontSize.title,
      fontWeight: 'bold',
      color: colors.textPrimary,
      marginBottom: spacing.xs,
      textAlign: 'center'
    },
    subtitle: {
      fontSize: fontSize.md,
      color: colors.textSecondary,
      textAlign: 'center'
    },
    section: {
      backgroundColor: colors.white,
      padding: spacing.lg,
      marginTop: spacing.md,
      marginHorizontal: spacing.lg,
      borderRadius: borderRadius.xl,
      borderWidth: 1,
      borderColor: colors.gray5,
      ...shadows.small
    },
    sectionTitle: {
      fontSize: fontSize.xl,
      fontWeight: '600',
      color: colors.textPrimary,
      marginBottom: spacing.lg,
      textAlign: 'center'
    },
    mapButtonHint: {
      marginTop: spacing.sm,
      fontSize: fontSize.sm,
      color: colors.textSecondary,
      textAlign: 'center',
      marginBottom: spacing.sm,
    },
    pinFirstCard: {
      borderWidth: 1,
      borderColor: colors.gray5,
      borderRadius: borderRadius.xl,
      backgroundColor: colors.gray7,
      padding: spacing.md,
      marginBottom: spacing.sm,
    },
    pinFirstTitle: {
      fontSize: fontSize.md,
      fontWeight: '700',
      color: colors.textPrimary,
      marginBottom: spacing.xs,
      textAlign: 'center',
    },
    pinFirstText: {
      fontSize: fontSize.sm,
      color: colors.textSecondary,
      textAlign: 'center',
      marginBottom: spacing.sm,
    },
    pinActionRow: {
      flexDirection: 'row',
      gap: spacing.sm,
      marginBottom: spacing.xs,
    },
    pinActionButton: {
      flex: 1,
      borderRadius: borderRadius.lg,
      borderColor: colors.gray5,
    },
    manualSearchButton: {
      width: '100%',
      marginTop: spacing.xs,
      borderRadius: borderRadius.xl,
      borderColor: colors.primary,
      borderWidth: 1,
      backgroundColor: colors.white,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.md,
    },
    manualSearchNote: {
      fontSize: fontSize.sm,
      color: colors.textSecondary,
      textAlign: 'center',
      marginTop: spacing.xs,
      marginBottom: spacing.xs,
    },
    manualSearchButtonLabel: {
      color: colors.textPrimary,
      fontWeight: '700',
      fontSize: fontSize.sm,
      textAlign: 'center',
      lineHeight: 20,
    },
    modalBackdrop: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.45)',
      justifyContent: 'center',
      paddingHorizontal: spacing.lg,
    },
    modalCard: {
      backgroundColor: colors.white,
      borderRadius: borderRadius.xl,
      borderWidth: 1,
      borderColor: colors.gray5,
      padding: spacing.lg,
      ...shadows.small,
    },
    modalTitle: {
      fontSize: fontSize.lg,
      fontWeight: '700',
      color: colors.textPrimary,
      marginBottom: spacing.sm,
      textAlign: 'center',
    },
    modalMessage: {
      fontSize: fontSize.sm,
      color: colors.textSecondary,
      lineHeight: 20,
      textAlign: 'center',
      marginBottom: spacing.md,
    },
    modalButtonRow: {
      flexDirection: 'row',
      gap: spacing.sm,
    },
    modalCancelButton: {
      flex: 1,
      borderRadius: borderRadius.lg,
      borderColor: colors.gray5,
    },
    modalConfirmButton: {
      flex: 1,
      borderRadius: borderRadius.lg,
      backgroundColor: colors.primary,
    },
    hideMapButton: {
      marginTop: spacing.sm,
      marginBottom: spacing.sm,
      borderRadius: borderRadius.lg,
      borderColor: colors.gray5,
    },
    outlinedButtonLabel: {
      color: colors.textPrimary,
      fontWeight: '600'
    },
    mapContainer: {
      height: 300,
      marginTop: spacing.lg,
      borderRadius: borderRadius.lg,
      overflow: 'hidden'
    },
    preferencesContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      gap: spacing.sm
    },
    inputRow: {
      flexDirection: 'row',
      gap: 12,
      marginTop: 12
    },
    inputCol: {
      flex: 1
    },
    inputLabel: {
      fontSize: fontSize.sm,
      color: colors.textSecondary,
      marginBottom: spacing.sm
    },
    modesNote: {
      fontSize: fontSize.xs,
      color: colors.textSecondary,
      marginBottom: spacing.sm,
    },
    input: {
      backgroundColor: colors.gray7,
      borderWidth: 1,
      borderColor: colors.gray6,
      borderRadius: borderRadius.lg,
      paddingHorizontal: 12,
      paddingVertical: 10,
      color: colors.textPrimary
    },
    modesRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8
    },
    fareTypeLabel: {
      marginTop: spacing.lg
    },
    fareTypeNote: {
      fontSize: fontSize.xs,
      color: colors.textSecondary,
      marginBottom: spacing.sm
    },
    fareTypeRow: {
      flexDirection: 'row',
      gap: spacing.sm
    },
    fareTypeCard: {
      flex: 1,
      borderWidth: 1,
      borderColor: colors.gray5,
      borderRadius: borderRadius.xl,
      backgroundColor: colors.gray7,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.md
    },
    fareTypeCardActive: {
      borderColor: colors.primary,
      backgroundColor: colors.primaryLight
    },
    fareTypeCardLabel: {
      fontSize: fontSize.md,
      fontWeight: '600',
      color: colors.textSecondary
    },
    fareTypeCardLabelActive: {
      color: colors.textPrimary
    },
    fareTypeCardDescription: {
      fontSize: fontSize.xs,
      color: colors.textSecondary,
      marginTop: spacing.xs
    },
    modeChip: {
      borderWidth: 1,
      borderColor: colors.gray5,
      borderRadius: borderRadius.round,
      paddingHorizontal: 10,
      paddingVertical: 8,
      backgroundColor: colors.gray7
    },
    modeChipActive: {
      backgroundColor: colors.primaryLight,
      borderColor: colors.primary
    },
    modeChipText: {
      fontSize: fontSize.sm,
      color: colors.textSecondary
    },
    modeChipTextActive: {
      color: colors.textPrimary,
      fontWeight: '700'
    },
    preferenceCard: {
      width: '48%',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: spacing.lg,
      paddingHorizontal: spacing.md,
      backgroundColor: colors.gray7,
      borderRadius: borderRadius.xl,
      borderWidth: 2,
      borderColor: colors.gray5
    },
    preferenceCardActive: {
      backgroundColor: colors.primaryLight,
      borderColor: colors.primary
    },
    preferenceIconWrap: {
      width: 44,
      height: 44,
      borderRadius: borderRadius.round,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.white,
      borderWidth: 1,
      borderColor: colors.gray6
    },
    preferenceIconWrapActive: {
      borderColor: colors.primary
    },
    preferenceLabel: {
      fontSize: fontSize.md,
      color: colors.textSecondary,
      marginTop: spacing.sm,
      textAlign: 'center',
      fontWeight: '500'
    },
    preferenceLabelActive: {
      color: colors.textPrimary,
      fontWeight: '700'
    },
    footer: {
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.lg,
      paddingBottom: spacing.xxl
    },
    findButton: {
      borderRadius: borderRadius.xl,
      backgroundColor: colors.primary
    },
    findButtonContent: {
      paddingVertical: 8
    },
    findButtonLabel: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.textWhite
    }
  });
