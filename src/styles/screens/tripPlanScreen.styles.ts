import { StyleSheet } from 'react-native';

export const tripPlanScreenStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5'
  },
  header: {
    padding: 20,
    backgroundColor: 'transparent'
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50'
  },
  subtitle: {
    fontSize: 14,
    color: '#7f8c8d',
    marginTop: 4
  },
  mapContainer: {
    height: 250,
    width: '100%',
    backgroundColor: '#e8f4f8',
    marginTop: 10
  },
  section: {
    backgroundColor: '#fff',
    padding: 20,
    marginTop: 10
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 16
  },
  routeContainer: {
    marginBottom: 16
  },
  legHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8
  },
  legTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3498db',
    marginLeft: 8
  },
  addButton: {
    borderRadius: 8,
    borderColor: '#3498db'
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20
  },
  loadingText: {
    marginLeft: 12,
    fontSize: 14,
    color: '#7f8c8d'
  },
  routesLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginTop: 16,
    marginBottom: 12
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16
  },
  button: {
    flex: 1,
    marginHorizontal: 4,
    borderRadius: 8
  },
  cancelButton: {
    borderColor: '#e74c3c'
  },
  confirmButton: {
    backgroundColor: '#27ae60'
  },
  searchButton: {
    marginTop: 12,
    borderRadius: 8,
    backgroundColor: '#3498db'
  },
  footer: {
    padding: 20,
    paddingBottom: 40
  },
  saveButton: {
    borderRadius: 8,
    backgroundColor: '#27ae60',
    marginBottom: 12
  },
  shareButton: {
    borderRadius: 8,
    borderColor: '#3498db'
  }
});
