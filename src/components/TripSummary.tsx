import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TripPlan } from '@/types';
import { formatTimeRange } from '@/utils/helpers';
interface TripSummaryProps {
  tripPlan: TripPlan;
}

const TripSummary: React.FC<TripSummaryProps> = ({ tripPlan }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Trip Overview</Text>
      
      <View style={styles.summaryGrid}>
        <View style={styles.summaryItem}>
          <View style={[styles.iconCircle, { backgroundColor: '#e8f5e9' }]}>
            <Ionicons name="cash-outline" size={22} color="#2c3e50" />
          </View>
          <Text style={styles.summaryLabel}>Total Fare</Text>
          <Text style={styles.summaryValue}>₱{tripPlan.totalFare.toFixed(2)}</Text>
        </View>

        <View style={styles.summaryItem}>
          <View style={[styles.iconCircle, { backgroundColor: '#fff3cd' }]}>
            <Ionicons name="time-outline" size={22} color="#2c3e50" />
          </View>
          <Text style={styles.summaryLabel}>Total Time</Text>
          <Text style={styles.summaryValue}>{formatTimeRange(tripPlan.totalTime)}</Text>
        </View>

        <View style={styles.summaryItem}>
          <View style={[styles.iconCircle, { backgroundColor: '#e3f2fd' }]}>
            <Ionicons name="map-outline" size={22} color="#2c3e50" />
          </View>
          <Text style={styles.summaryLabel}>Distance</Text>
          <Text style={styles.summaryValue}>{tripPlan.totalDistance.toFixed(1)} km</Text>
        </View>

        <View style={styles.summaryItem}>
          <View style={[styles.iconCircle, { backgroundColor: '#f3e5f5' }]}>
            <Ionicons name="location-outline" size={22} color="#2c3e50" />
          </View>
          <Text style={styles.summaryLabel}>Destinations</Text>
          <Text style={styles.summaryValue}>{tripPlan.destinations.length}</Text>
        </View>
      </View>

      <View style={styles.destinationsSection}>
        <Text style={styles.destinationsTitle}>Journey Path</Text>
        {tripPlan.destinations.map((destination, index) => (
          <View key={index} style={styles.destinationRow}>
            <View style={styles.destinationMarker}>
              {index === 0 ? (
                <Ionicons name="play" size={18} color="#2c3e50" />
              ) : index === tripPlan.destinations.length - 1 ? (
                <Ionicons name="flag" size={18} color="#2c3e50" />
              ) : (
                <Ionicons name="location" size={18} color="#2c3e50" />
              )}
            </View>
            <View style={styles.destinationInfo}>
              <Text style={styles.destinationLabel}>
                {index === 0 ? 'Start' : index === tripPlan.destinations.length - 1 ? 'End' : `Stop ${index}`}
              </Text>
              <Text style={styles.destinationName}>{destination.name}</Text>
            </View>
            {index < tripPlan.destinations.length - 1 && (
              <View style={styles.connectionLine} />
            )}
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 16
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 20
  },
  summaryItem: {
    width: '50%',
    alignItems: 'center',
    marginBottom: 16
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8
  },
  summaryLabel: {
    fontSize: 12,
    color: '#7f8c8d',
    marginBottom: 4
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50'
  },
  destinationsSection: {
    borderTopWidth: 1,
    borderTopColor: '#ecf0f1',
    paddingTop: 16
  },
  destinationsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 12
  },
  destinationRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
    position: 'relative'
  },
  destinationMarker: {
    width: 32,
    alignItems: 'center'
  },
  destinationInfo: {
    flex: 1,
    marginLeft: 8
  },
  destinationLabel: {
    fontSize: 12,
    color: '#7f8c8d',
    fontWeight: '500'
  },
  destinationName: {
    fontSize: 14,
    color: '#2c3e50',
    fontWeight: '600',
    marginTop: 2
  },
  connectionLine: {
    position: 'absolute',
    left: 15,
    top: 24,
    width: 2,
    height: 32,
    backgroundColor: '#bdc3c7'
  }
});

export default TripSummary;

