import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { TransportType } from '@/types';
import { getTransportStyle } from '@/utils/transportUtils';

const MapLegend: React.FC = () => {
  const transportTypes = [
    TransportType.JEEPNEY,
    TransportType.BUS,
    TransportType.UV_EXPRESS,
    TransportType.TRAIN
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Transport Types</Text>
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
      <View style={styles.transferLegend}>
        <Text style={styles.transferTitle}>Transfer Markers</Text>
        <Text style={styles.transferText}>nA = Alight • nB = Board</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    zIndex: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 8
  },
  title: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 8
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
    color: '#2c3e50',
    fontWeight: '500'
  },
  transferLegend: {
    marginTop: 10
  },
  transferTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2c3e50',
    marginBottom: 2
  },
  transferText: {
    fontSize: 10,
    color: '#2c3e50'
  }
});

export default MapLegend;
