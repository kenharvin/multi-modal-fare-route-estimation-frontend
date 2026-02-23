import { StyleSheet } from 'react-native';
import { borderRadius, fontSize, shadows, spacing, type ThemeColors } from '@/utils/theme';

export const createPrivateVehicleScreenStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background
    },
    mapScreen: {
      flex: 1,
      backgroundColor: colors.background
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
      ...shadows.small
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
      padding: spacing.lg,
      marginHorizontal: spacing.lg,
      marginTop: spacing.lg,
      backgroundColor: 'transparent'
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
      marginHorizontal: spacing.lg,
      marginTop: spacing.lg,
      borderRadius: borderRadius.xl,
      borderWidth: 1,
      borderColor: colors.gray5,
      ...shadows.small
    },
    sectionTitle: {
      fontSize: fontSize.xl,
      fontWeight: '600',
      color: colors.textPrimary,
      marginBottom: spacing.sm,
      textAlign: 'center'
    },
    sectionSubtitle: {
      fontSize: fontSize.sm,
      color: colors.textSecondary,
      marginBottom: spacing.md,
      textAlign: 'center'
    },
    mapButtonHint: {
      marginTop: spacing.sm,
      fontSize: fontSize.sm,
      color: colors.textSecondary,
      textAlign: 'center',
      marginBottom: spacing.sm,
    },
    hideMapButton: {
      marginTop: spacing.sm,
      marginBottom: spacing.sm,
      borderRadius: borderRadius.lg,
      borderColor: colors.gray5,
    },
    addStopoverButton: {
      borderRadius: borderRadius.xl,
      borderColor: colors.primary,
      marginBottom: spacing.lg,
    },
    vehiclesContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginBottom: spacing.md
    },
    fuelTypeScroll: {
      marginBottom: spacing.md,
    },
    fuelTypeRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
      paddingHorizontal: spacing.xs,
    },
    fuelTypeButton: {
      width: '100%',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.md,
      backgroundColor: colors.gray7,
      borderRadius: borderRadius.xl,
      borderWidth: 2,
      borderColor: colors.gray5,
    },
    fuelTypeButtonActive: {
      backgroundColor: colors.primaryLight,
      borderColor: colors.primary,
    },
    fuelTypeText: {
      fontSize: fontSize.sm,
      color: colors.textSecondary,
      textAlign: 'center',
      fontWeight: '500',
    },
    fuelTypeTextActive: {
      color: colors.textPrimary,
      fontWeight: '700',
    },
    vehicleCard: {
      width: '30%',
      alignItems: 'center',
      padding: spacing.md,
      margin: 4,
      backgroundColor: colors.gray7,
      borderRadius: borderRadius.xl,
      borderWidth: 2,
      borderColor: colors.gray5
    },
    vehicleCardActive: {
      backgroundColor: colors.primaryLight,
      borderColor: colors.primary
    },
    vehicleLabel: {
      fontSize: fontSize.sm,
      color: colors.textSecondary,
      marginTop: spacing.xs,
      textAlign: 'center',
      fontWeight: '500'
    },
    vehicleLabelActive: {
      color: colors.textPrimary,
      fontWeight: '700'
    },
    efficiencyText: {
      fontSize: fontSize.xs,
      color: colors.textLight,
      marginTop: 2
    },
    input: {
      marginBottom: spacing.md
    },
    fuelEfficiencyNote: {
      fontSize: fontSize.sm,
      color: colors.textSecondary,
      marginTop: -spacing.sm,
      marginBottom: spacing.md,
      textAlign: 'left',
    },
    fuelPriceNote: {
      fontSize: fontSize.sm,
      color: colors.textSecondary,
      marginTop: -spacing.sm,
      marginBottom: spacing.md,
      textAlign: 'left',
    },
    preferenceRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.gray6
    },
    preferenceInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
      minWidth: 0,
      marginRight: spacing.sm,
    },
    preferenceText: {
      fontSize: fontSize.lg,
      color: colors.textPrimary,
      marginLeft: spacing.md,
      flexShrink: 1,
      flexWrap: 'wrap',
    },
    footer: {
      padding: spacing.lg,
      paddingBottom: spacing.xxl
    },
    calculateButton: {
      borderRadius: borderRadius.xl,
      backgroundColor: colors.primary
    },
    calculateButtonContent: {
      paddingVertical: spacing.sm
    },
    calculateButtonLabel: {
      fontSize: fontSize.lg,
      fontWeight: '600',
      color: colors.textWhite
    }
  });
