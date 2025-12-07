import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Route, TransportType } from '@/types';
interface RouteCardProps {
  route: Route;
  isSelected: boolean;
  rank?: number;
  onSelect?: () => void;
}

const RouteCard: React.FC<RouteCardProps> = ({ route, isSelected, rank, onSelect }) => {
  const getTransportIcon = (type: TransportType): string => {
    switch (type) {
      case TransportType.JEEPNEY:
        return 'bus';
      case TransportType.BUS:
        return 'bus-side';
      case TransportType.UV_EXPRESS:
        return 'van-passenger';
      case TransportType.TRAIN:
        return 'train';
      default:
        return 'bus';
    }
  };

  const getTransportColor = (type: TransportType): string => {
    switch (type) {
      case TransportType.JEEPNEY:
        return '#e74c3c';
      case TransportType.BUS:
        return '#3498db';
      case TransportType.UV_EXPRESS:
        return '#9b59b6';
      case TransportType.TRAIN:
        return '#2ecc71';
      default:
        return '#95a5a6';
    }
  };

  const content = (
    <View style={[styles.container, isSelected && styles.containerSelected]}>
      {rank && (
        <View style={styles.rankBadge}>
          <Text style={styles.rankText}>#{rank}</Text>
        </View>
      )}
      
      {route.fuzzyScore !== undefined && (
        <View style={styles.scoreBadge}>
          <Text>*</Text>
          <Text style={styles.scoreText}>{(route.fuzzyScore * 100).toFixed(0)}</Text>
        </View>
      )}

      <View style={styles.transportIcons}>
        {route.segments.map((segment, index) => (
          <View key={index} style={styles.iconContainer}>
            <Text style={{fontSize: 24}}>{segment.transportType.charAt(0).toUpperCase()}</Text>
            {index < route.segments.length - 1 && (
              <Text>{'>'}</Text>
            )}
          </View>
        ))}
      </View>

      <View style={styles.infoRow}>
        <View style={styles.infoItem}>
          <Text>$</Text>
          <Text style={styles.infoLabel}>Fare</Text>
          <Text style={styles.infoValue}>₱{route.totalFare.toFixed(2)}</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.infoItem}>
          <Text>T</Text>
          <Text style={styles.infoLabel}>Time</Text>
          <Text style={styles.infoValue}>{route.totalTime} min</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.infoItem}>
          <Text>↔</Text>
          <Text style={styles.infoLabel}>Transfers</Text>
          <Text style={styles.infoValue}>{route.totalTransfers}</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.infoItem}>
          <Text>DIST</Text>
          <Text style={styles.infoLabel}>Distance</Text>
          <Text style={styles.infoValue}>{route.totalDistance.toFixed(1)} km</Text>
        </View>
      </View>

      <View style={styles.segmentsSection}>
        {route.segments.map((segment, index) => (
          <View key={segment.id} style={styles.segment}>
            <Text style={{fontSize: 16}}>{segment.transportType.charAt(0).toUpperCase()}</Text>
            <Text style={styles.segmentText}>
              {segment.routeName} • {segment.origin.name} → {segment.destination.name}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );

  if (onSelect) {
    return (
      <TouchableOpacity onPress={onSelect} activeOpacity={0.7}>
        {content}
      </TouchableOpacity>
    );
  }

  return content;
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#ecf0f1',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2
  },
  containerSelected: {
    borderColor: '#3498db',
    backgroundColor: '#e3f2fd'
  },
  rankBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#3498db',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4
  },
  rankText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold'
  },
  scoreBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff3cd',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4
  },
  scoreText: {
    color: '#856404',
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 4
  },
  transportIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    marginTop: 24
  },
  iconContainer: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12
  },
  infoItem: {
    flex: 1,
    alignItems: 'center'
  },
  infoLabel: {
    fontSize: 10,
    color: '#7f8c8d',
    marginTop: 4
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c3e50',
    marginTop: 2
  },
  divider: {
    width: 1,
    backgroundColor: '#ecf0f1',
    marginHorizontal: 4
  },
  segmentsSection: {
    borderTopWidth: 1,
    borderTopColor: '#ecf0f1',
    paddingTop: 12
  },
  segment: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8
  },
  segmentText: {
    fontSize: 12,
    color: '#34495e',
    marginLeft: 8,
    flex: 1
  }
});

export default RouteCard;

