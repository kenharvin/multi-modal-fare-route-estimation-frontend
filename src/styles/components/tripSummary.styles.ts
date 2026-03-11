import { StyleSheet } from 'react-native';

export const tripSummaryStyles = StyleSheet.create({
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
