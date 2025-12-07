import React, { useState, useEffect } from 'react';
import { StyleSheet, View, TouchableOpacity, Text, Platform } from 'react-native';
import { Location, Stopover } from '@/types';

// Conditionally import MapView for native platforms
let MapView: any = null;
let Marker: any = null;
let PROVIDER_GOOGLE: any = null;
let Polyline: any = null;

// Web map imports
let MapContainer: any = null;
let TileLayer: any = null;
let LeafletMarker: any = null;
let LeafletPolyline: any = null;

if (Platform.OS !== 'web') {
  const MapModule = require('react-native-maps');
  MapView = MapModule.default;
  Marker = MapModule.Marker;
  PROVIDER_GOOGLE = MapModule.PROVIDER_GOOGLE;
  Polyline = MapModule.Polyline;
} else {
  // Import Leaflet for web
  try {
    const LeafletModule = require('react-leaflet');
    MapContainer = LeafletModule.MapContainer;
    TileLayer = LeafletModule.TileLayer;
    LeafletMarker = LeafletModule.Marker;
    LeafletPolyline = LeafletModule.Polyline;
  } catch (e) {
    console.log('Leaflet not available');
  }
}

interface MapViewComponentProps {
  origin?: Location | null;
  destination?: Location | null;
  stopovers?: Stopover[];
  onOriginSelect?: (location: Location) => void;
  onDestinationSelect?: (location: Location) => void;
  showRoute?: boolean;
}

const MapViewComponent: React.FC<MapViewComponentProps> = ({
  origin,
  destination,
  stopovers = [],
  onOriginSelect,
  onDestinationSelect,
  showRoute = false
}) => {
  const [region, setRegion] = useState({
    latitude: 14.5995, // Manila default
    longitude: 120.9842,
    latitudeDelta: 0.1,
    longitudeDelta: 0.1
  });

  const [selectingOrigin, setSelectingOrigin] = useState<boolean>(false);
  const [selectingDestination, setSelectingDestination] = useState<boolean>(false);

  // Web map implementation with Leaflet
  if (Platform.OS === 'web' && MapContainer) {
    const center: [number, number] = [
      origin?.coordinates.latitude || destination?.coordinates.latitude || 14.5995,
      origin?.coordinates.longitude || destination?.coordinates.longitude || 120.9842
    ];

    return (
      <View style={styles.container}>
        <div style={{ width: '100%', height: '100%' }}>
          <MapContainer
            center={center}
            zoom={13}
            style={{ width: '100%', height: '100%' }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {origin && (
              <LeafletMarker position={[origin.coordinates.latitude, origin.coordinates.longitude]}>
              </LeafletMarker>
            )}
            {destination && (
              <LeafletMarker position={[destination.coordinates.latitude, destination.coordinates.longitude]}>
              </LeafletMarker>
            )}
            {stopovers.map((stopover, index) => (
              <LeafletMarker
                key={stopover.id}
                position={[stopover.location.coordinates.latitude, stopover.location.coordinates.longitude]}
              >
              </LeafletMarker>
            ))}
          </MapContainer>
        </div>
      </View>
    );
  }

  // Web fallback if Leaflet not available
  if (Platform.OS === 'web') {
    return (
      <View style={styles.webMapContainer}>
        <View style={styles.webMapPlaceholder}>
          <Text>MAP</Text>
          <Text style={styles.webMapText}>Map View</Text>
          <Text style={styles.webMapSubtext}>
            Loading map...
          </Text>
          {origin && (
            <Text style={styles.webLocationText}>
              Origin: {origin.name}
            </Text>
          )}
          {destination && (
            <Text style={styles.webLocationText}>
              Destination: {destination.name}
            </Text>
          )}
        </View>
      </View>
    );
  }

  useEffect(() => {
    if (origin) {
      setRegion({
        ...origin.coordinates,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05
      });
    }
  }, [origin]);

  const handleMapPress = async (event: any) => {
    const { coordinate } = event.nativeEvent;
    
    if (selectingOrigin && onOriginSelect) {
      const location: Location = {
        name: `Location at ${coordinate.latitude.toFixed(4)}, ${coordinate.longitude.toFixed(4)}`,
        coordinates: coordinate,
        address: 'Selected from map'
      };
      onOriginSelect(location);
      setSelectingOrigin(false);
    } else if (selectingDestination && onDestinationSelect) {
      const location: Location = {
        name: `Location at ${coordinate.latitude.toFixed(4)}, ${coordinate.longitude.toFixed(4)}`,
        coordinates: coordinate,
        address: 'Selected from map'
      };
      onDestinationSelect(location);
      setSelectingDestination(false);
    }
  };

  const getRouteCoordinates = () => {
    const coordinates = [];
    if (origin) coordinates.push(origin.coordinates);
    stopovers.forEach(stopover => coordinates.push(stopover.location.coordinates));
    if (destination) coordinates.push(destination.coordinates);
    return coordinates;
  };

  return (
    <View style={styles.container}>
      <MapView
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        region={region}
        onPress={handleMapPress}
      >
        {origin && (
          <Marker
            coordinate={origin.coordinates}
            title="Origin"
            description={origin.name}
            pinColor="green"
          />
        )}

        {destination && (
          <Marker
            coordinate={destination.coordinates}
            title="Destination"
            description={destination.name}
            pinColor="red"
          />
        )}

        {stopovers.map((stopover) => (
          <Marker
            key={stopover.id}
            coordinate={stopover.location.coordinates}
            title={stopover.type}
            description={stopover.location.name}
            pinColor="blue"
          />
        ))}

        {showRoute && origin && destination && (
          <Polyline
            coordinates={getRouteCoordinates()}
            strokeColor="#3498db"
            strokeWidth={4}
          />
        )}
      </MapView>

      {(onOriginSelect || onDestinationSelect) && (
        <View style={styles.controls}>
          {onOriginSelect && (
            <TouchableOpacity
              style={[
                styles.controlButton,
                selectingOrigin && styles.controlButtonActive
              ]}
              onPress={() => {
                setSelectingOrigin(!selectingOrigin);
                setSelectingDestination(false);
              }}
            >
              <Text style={{fontSize: 20, color: selectingOrigin ? '#fff' : '#27ae60'}}>*</Text>
              <Text
                style={[
                  styles.controlText,
                  selectingOrigin && styles.controlTextActive
                ]}
              >
                Set Origin
              </Text>
            </TouchableOpacity>
          )}

          {onDestinationSelect && (
            <TouchableOpacity
              style={[
                styles.controlButton,
                selectingDestination && styles.controlButtonActive
              ]}
              onPress={() => {
                setSelectingDestination(!selectingDestination);
                setSelectingOrigin(false);
              }}
            >
              <Text style={{fontSize: 20, color: selectingDestination ? '#fff' : '#e74c3c'}}>*</Text>
              <Text
                style={[
                  styles.controlText,
                  selectingDestination && styles.controlTextActive
                ]}
              >
                Set Destination
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {(selectingOrigin || selectingDestination) && (
        <View style={styles.instructionBanner}>
          <Text style={styles.instructionText}>
            Tap on the map to select {selectingOrigin ? 'origin' : 'destination'}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
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
    backgroundColor: '#fff',
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
  controlButtonActive: {
    backgroundColor: '#3498db'
  },
  controlText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2c3e50',
    marginLeft: 4
  },
  controlTextActive: {
    color: '#fff'
  },
  instructionBanner: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    backgroundColor: '#3498db',
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
  instructionText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center'
  },
  webMapContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
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
    color: '#2c3e50',
    marginTop: 16,
  },
  webMapSubtext: {
    fontSize: 14,
    color: '#7f8c8d',
    marginTop: 8,
    textAlign: 'center',
  },
  webLocationText: {
    fontSize: 14,
    color: '#2c3e50',
    marginTop: 8,
    textAlign: 'center',
  }
});

export default MapViewComponent;

