import { Platform, StyleSheet } from 'react-native';
import { type ThemeColors } from '@/utils/theme';

export const createMapViewComponentStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      position: 'relative'
    },
    map: {
      ...StyleSheet.absoluteFillObject
    },
    controls: {
      position: 'absolute',
      top: 16,
      right: 16,
      flexDirection: 'column',
      gap: 8
    },
    controlButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.white,
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderRadius: 20,
      ...Platform.select({
        ios: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.25,
          shadowRadius: 3.84,
        },
        android: {
          elevation: 5,
        },
        web: {
          boxShadow: '0 2px 4px rgba(0,0,0,0.25)',
        },
      }),
      marginBottom: 8
    },
    segmentEndpointBadge: {
      width: 22,
      height: 22,
      borderRadius: 7,
      borderWidth: 2,
      borderColor: '#fff',
      alignItems: 'center',
      justifyContent: 'center',
      ...Platform.select({
        ios: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.25,
          shadowRadius: 3.84,
        },
        android: {
          elevation: 4,
        },
        web: {
          boxShadow: '0 2px 4px rgba(0,0,0,0.25)',
        },
      }),
    },
    controlButtonActive: {
      backgroundColor: colors.primary
    },
    controlText: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.textPrimary,
      marginLeft: 4
    },
    controlTextActive: {
      color: '#fff'
    },
    instructionBanner: {
      position: 'absolute',
      top: 72,
      left: 16,
      right: 16,
      zIndex: 16,
      backgroundColor: colors.primary,
      padding: 12,
      borderRadius: 8,
      ...Platform.select({
        ios: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.25,
          shadowRadius: 3.84,
        },
        android: {
          elevation: 5,
        },
        web: {
          boxShadow: '0 2px 4px rgba(0,0,0,0.25)',
        },
      }),
    },
    legendToggleWrap: {
      position: 'absolute',
      left: 12,
      top: 12,
      zIndex: 20
    },
    legendToggleButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.white,
      borderRadius: 18,
      paddingHorizontal: 10,
      paddingVertical: 6,
      ...Platform.select({
        ios: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.2,
          shadowRadius: 3
        },
        android: {
          elevation: 4
        },
        web: {
          boxShadow: '0 2px 6px rgba(0,0,0,0.25)'
        }
      })
    },
    legendToggleText: {
      marginLeft: 6,
      fontSize: 12,
      fontWeight: '700',
      color: colors.textPrimary
    },
    instructionText: {
      color: '#fff',
      fontSize: 14,
      fontWeight: '600',
      textAlign: 'center'
    },
    resolvingBanner: {
      position: 'absolute',
      top: 16,
      left: 16,
      right: 16,
      alignSelf: 'center',
      backgroundColor: colors.white,
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderRadius: 8,
      ...Platform.select({
        ios: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.2,
          shadowRadius: 3,
        },
        android: {
          elevation: 4,
        },
        web: {
          boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
        },
      }),
    },
    resolvingText: {
      color: colors.textPrimary,
      fontSize: 13,
      fontWeight: '600',
      textAlign: 'center',
    },
    webMapContainer: {
      flex: 1,
      backgroundColor: colors.background,
    },
    webMapPlaceholder: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    webMapText: {
      fontSize: 24,
      fontWeight: 'bold',
      color: colors.textPrimary,
      marginTop: 16,
    },
    webMapSubtext: {
      fontSize: 14,
      color: colors.textSecondary,
      marginTop: 8,
      textAlign: 'center',
    },
    webLocationText: {
      fontSize: 14,
      color: colors.textPrimary,
      marginTop: 8,
      textAlign: 'center',
    },
    transferDot: {
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor: colors.textPrimary,
      borderWidth: 2,
      borderColor: '#fff'
    },
    transferBadge: {
      width: 24,
      height: 24,
      borderRadius: 12,
      borderWidth: 2,
      borderColor: '#fff',
      alignItems: 'center',
      justifyContent: 'center',
      ...Platform.select({
        ios: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.25,
          shadowRadius: 3.84,
        },
        android: {
          elevation: 3,
        },
        web: {
          boxShadow: '0 2px 6px rgba(0,0,0,0.35)',
        },
      }),
    },
    transferBadgeAlight: {
      backgroundColor: '#2980b9'
    },
    transferBadgeBoard: {
      backgroundColor: '#27ae60'
    },
    transferBadgeText: {
      color: '#fff',
      fontWeight: '800',
      fontSize: 11,
    },
    transferBadgeTopRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 2
    },
    transferBadgeSubText: {
      color: '#fff',
      fontWeight: '900',
      fontSize: 9,
      marginTop: -2,
      opacity: 0.95
    },
    transferCallout: {
      minWidth: 200,
      paddingVertical: 8,
      paddingHorizontal: 10,
    },
    transferCalloutTitle: {
      fontSize: 14,
      fontWeight: '800',
      color: colors.textPrimary,
      marginBottom: 4
    },
    transferCalloutRow: {
      fontSize: 12,
      color: colors.textPrimary,
      marginBottom: 2
    }
  });
