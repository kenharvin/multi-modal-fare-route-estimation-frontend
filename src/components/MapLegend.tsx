import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { TransportType } from '@/types';
import { getTransportStyle } from '@/utils/transportUtils';
import { useThemeMode } from '@context/ThemeContext';
import { type ThemeColors } from '@/utils/theme';

interface MapLegendProps {
  showPinLegend?: boolean;
  showTransportTypes?: boolean;
  showTransferLegend?: boolean;
  position?: 'top-right' | 'top-center' | 'bottom-left';
}

const MapLegend: React.FC<MapLegendProps> = ({
  showPinLegend = false,
  showTransportTypes = true,
  showTransferLegend = true,
  position = 'bottom-left',
}) => {
  const { colors } = useThemeMode();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const containerPositionStyle = useMemo(() => {
    if (position === 'top-right') {
      return styles.positionTopRight;
    }
    if (position === 'top-center') {
      return styles.positionTopCenter;
    }
    return styles.positionBottomLeft;
  }, [position, styles.positionBottomLeft, styles.positionTopCenter, styles.positionTopRight]);

  const transportTypes = [
    TransportType.JEEPNEY,
    TransportType.BUS,
    TransportType.UV_EXPRESS,
    TransportType.TRAIN
  ];

  return (
    <View style={[styles.container, containerPositionStyle]}>
      <Text style={styles.title}>Legend</Text>

      {showPinLegend && (
        <View style={styles.pinLegendWrap}>
          <Text style={styles.sectionTitle}>Pins</Text>
          <View style={styles.pinLegendRow}>
            <View style={styles.legendItem}>
              <View style={[styles.pinDot, { backgroundColor: '#27ae60' }]} />
              <Text style={styles.label}>Origin</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.pinDot, { backgroundColor: '#e74c3c' }]} />
              <Text style={styles.label}>Destination</Text>
            </View>
          </View>
        </View>
      )}

      {showTransportTypes && (
        <>
          <Text style={styles.sectionTitle}>Transport Types</Text>
          <View style={styles.legendItems}>
            {transportTypes.map((type) => {
              const style = getTransportStyle(type);
              return (
                <View key={type} style={styles.legendItem}>
                  <View style={[styles.colorBox, { backgroundColor: style.color }]}>
                    <Text style={styles.icon}>{style.icon}</Text>
                  </View>
                  <Text style={styles.label}>{style.label}</Text>
                </View>
              );
            })}
          </View>
        </>
      )}

      {showTransferLegend && (
        <View style={styles.transferLegend}>
          <Text style={styles.transferTitle}>Transfer Markers</Text>
          <View style={styles.transferRow}>
            <View style={styles.transferItem}>
              <View style={[styles.transferBadge, styles.transferBadgeAlight]}>
                <Text style={styles.transferBadgeText}>1A</Text>
              </View>
              <Text style={styles.transferText}>Alight</Text>
            </View>
            <View style={styles.transferItem}>
              <View style={[styles.transferBadge, styles.transferBadgeBoard]}>
                <Text style={styles.transferBadgeText}>1B</Text>
              </View>
              <Text style={styles.transferText}>Board</Text>
            </View>
          </View>
        </View>
      )}
    </View>
  );
};

const createStyles = (colors: ThemeColors) => StyleSheet.create({
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

export default MapLegend;
