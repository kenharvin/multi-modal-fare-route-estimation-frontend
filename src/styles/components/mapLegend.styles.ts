import { StyleSheet } from 'react-native';
import { type ThemeColors } from '@/utils/theme';

export const createMapLegendStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      position: 'absolute',
      zIndex: 50,
      backgroundColor: colors.white,
      borderRadius: 12,
      padding: 12,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
      elevation: 8
    },
    positionTopRight: {
      top: 16,
      right: 16,
    },
    positionTopCenter: {
      top: 16,
      alignSelf: 'center',
    },
    positionBottomLeft: {
      bottom: 16,
      left: 16,
    },
    compactPinLegend: {
      position: 'absolute',
      zIndex: 50,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
      paddingHorizontal: 4,
      paddingVertical: 2,
    },
    title: {
      fontSize: 12,
      fontWeight: 'bold',
      color: colors.textPrimary,
      marginBottom: 8
    },
    sectionTitle: {
      fontSize: 11,
      fontWeight: '700',
      color: colors.textPrimary,
      marginBottom: 8
    },
    pinLegendWrap: {
      marginBottom: 10
    },
    pinLegendRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12
    },
    pinDot: {
      width: 10,
      height: 10,
      borderRadius: 999,
      marginRight: 6
    },
    legendItems: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8
    },
    legendItem: {
      flexDirection: 'row',
      alignItems: 'center',
      marginRight: 8
    },
    colorBox: {
      width: 28,
      height: 28,
      borderRadius: 6,
      marginRight: 6,
      alignItems: 'center',
      justifyContent: 'center'
    },
    icon: {
      fontSize: 16
    },
    label: {
      fontSize: 10,
      color: colors.textPrimary,
      fontWeight: '500'
    },
    transferLegend: {
      marginTop: 10
    },
    transferRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      marginTop: 4,
    },
    transferItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    transferBadge: {
      width: 28,
      height: 28,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 2,
      borderColor: '#ffffff',
    },
    transferBadgeAlight: {
      backgroundColor: '#2980b9',
    },
    transferBadgeBoard: {
      backgroundColor: '#27ae60',
    },
    transferBadgeText: {
      color: '#ffffff',
      fontSize: 11,
      fontWeight: '800',
    },
    transferTitle: {
      fontSize: 11,
      fontWeight: '700',
      color: colors.textPrimary,
      marginBottom: 2
    },
    transferText: {
      fontSize: 10,
      color: colors.textPrimary
    }
  });
