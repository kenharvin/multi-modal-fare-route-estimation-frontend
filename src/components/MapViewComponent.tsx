import React, { useState, useEffect } from 'react';
import { StyleSheet, View, TouchableOpacity, Text, Platform } from 'react-native';
import { Location, Stopover, Route, RouteSegment } from '@/types';
import { getTransportColor } from '@/utils/transportUtils';
import MapLegend from './MapLegend';
import { getPreviewPolyline } from '@/services/api';
import { Ionicons } from '@expo/vector-icons';

// Conditionally import MapView for native platforms
let MapView: any = null;
let Marker: any = null;
let Polyline: any = null;
let UrlTile: any = null;
let Callout: any = null;

// Web map imports
let MapContainer: any = null;
let TileLayer: any = null;
let LeafletMarker: any = null;
let LeafletPolyline: any = null;
let Popup: any = null;

if (Platform.OS !== 'web') {
  const MapModule = require('react-native-maps');
  MapView = MapModule.default;
  Marker = MapModule.Marker;
  Polyline = MapModule.Polyline;
  UrlTile = MapModule.UrlTile;
  Callout = MapModule.Callout;
} else {
  // Import Leaflet for web
  try {
    const LeafletModule = require('react-leaflet');
    MapContainer = LeafletModule.MapContainer;
    TileLayer = LeafletModule.TileLayer;
    LeafletMarker = LeafletModule.Marker;
    LeafletPolyline = LeafletModule.Polyline;
    Popup = LeafletModule.Popup;
  } catch (e) {
    console.log('Leaflet not available');
  }
}

interface MapViewComponentProps {
  origin?: Location | null;
  destination?: Location | null;
  stopovers?: Stopover[];
  route?: Route | null;
  onOriginSelect?: (location: Location) => void;
  onDestinationSelect?: (location: Location) => void;
  showRoute?: boolean;
  /**
   * Shows small markers at segment boundaries (transfer points).
   * Per-segment start/end pin markers are intentionally not rendered to avoid clutter.
   */
  showTransferMarkers?: boolean;
}

const MapViewComponent: React.FC<MapViewComponentProps> = ({
  origin,
  destination,
  stopovers = [],
  route,
  onOriginSelect,
  onDestinationSelect,
  showRoute = false,
  showTransferMarkers = true
}) => {
  const [region, setRegion] = useState({
    latitude: 14.5995, // Manila default
    longitude: 120.9842,
    latitudeDelta: 0.1,
    longitudeDelta: 0.1
  });

  const [selectingOrigin, setSelectingOrigin] = useState<boolean>(false);
  const [selectingDestination, setSelectingDestination] = useState<boolean>(false);
  const [previewCoords, setPreviewCoords] = useState<{ latitude: number; longitude: number }[] | null>(null);
  const [previewSource, setPreviewSource] = useState<string | null>(null);
  const [legendVisible, setLegendVisible] = useState<boolean>(false);

  // Calculate bounding box for route to fit all coordinates
  useEffect(() => {
    if (route && route.segments.length > 0) {
      const allCoords: { latitude: number; longitude: number }[] = [];
      
      route.segments.forEach(segment => {
        // Helper to filter invalid coords (avoid 0,0)
        const isValid = (c: { latitude: number; longitude: number }) => {
          return typeof c?.latitude === 'number' && typeof c?.longitude === 'number' && !(c.latitude === 0 && c.longitude === 0);
        };
        if (segment.geometry && segment.geometry.length > 0) {
          allCoords.push(...segment.geometry.filter(isValid));
        } else {
          if (isValid(segment.origin.coordinates)) allCoords.push(segment.origin.coordinates);
          if (isValid(segment.destination.coordinates)) allCoords.push(segment.destination.coordinates);
        }
      });

      if (allCoords.length > 0) {
        const lats = allCoords.map(c => c.latitude);
        const lons = allCoords.map(c => c.longitude);
        
        const minLat = Math.min(...lats);
        const maxLat = Math.max(...lats);
        const minLon = Math.min(...lons);
        const maxLon = Math.max(...lons);
        
        const centerLat = (minLat + maxLat) / 2;
        const centerLon = (minLon + maxLon) / 2;
        const latDelta = (maxLat - minLat) * 1.3; // Add 30% padding
        const lonDelta = (maxLon - minLon) * 1.3;
        
        setRegion({
          latitude: centerLat,
          longitude: centerLon,
          latitudeDelta: Math.max(latDelta, 0.01),
          longitudeDelta: Math.max(lonDelta, 0.01)
        });
      }
    } else if (origin) {
      setRegion({
        ...origin.coordinates,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05
      });
    }
  }, [route, origin]);

  // Fetch preview polyline when origin and destination are set but no computed route
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (route || !origin || !destination) {
        setPreviewCoords(null);
        setPreviewSource(null);
        return;
      }
      try {
        const { coords, source } = await getPreviewPolyline(origin.coordinates, destination.coordinates);
        if (!cancelled) {
          setPreviewCoords(coords);
          setPreviewSource(source);
        }
      } catch (e) {
        if (!cancelled) {
          setPreviewCoords([origin.coordinates, destination.coordinates]);
          setPreviewSource('direct');
        }
      }
    })();
    return () => { cancelled = true; };
  }, [origin?.coordinates.latitude, origin?.coordinates.longitude, destination?.coordinates.latitude, destination?.coordinates.longitude, !!route]);

  const normalizeTransportType = (t?: string) => (t ?? '').trim().toLowerCase();

  const isWalkType = (t?: string) => {
    const nt = normalizeTransportType(t);
    return nt === 'walk' || nt === 'walking' || nt === 'foot' || nt === 'pedestrian';
  };

  const getModeLabel = (t?: string) => {
    const nt = normalizeTransportType(t);
    if (!nt) return 'Unknown';
    if (nt === 'lrt' || nt === 'mrt' || nt === 'pnr' || nt === 'train') return 'Train';
    if (nt === 'bus') return 'Bus';
    if (nt === 'jeep' || nt === 'jeepney') return 'Jeepney';
    if (nt === 'tricycle') return 'Tricycle';
    if (nt === 'taxi') return 'Taxi';
    if (nt === 'uv' || nt === 'uvexpress' || nt === 'uv express' || nt === 'uv_express') return 'UV Express';
    if (nt === 'walk' || nt === 'walking') return 'Walk';
    return nt.toUpperCase();
  };

  const getModeIconName = (t?: string) => {
    const nt = normalizeTransportType(t);
    if (nt === 'lrt' || nt === 'mrt' || nt === 'pnr' || nt === 'train') return 'train';
    if (nt === 'bus') return 'bus';
    if (nt === 'taxi') return 'car';
    if (nt === 'tricycle') return 'bicycle';
    if (nt === 'walk' || nt === 'walking' || nt === 'foot' || nt === 'pedestrian') return 'walk';
    // Fallback icon
    return 'swap-horizontal';
  };

  const getModeEmoji = (t?: string) => {
    const nt = normalizeTransportType(t);
    if (nt === 'lrt' || nt === 'mrt' || nt === 'pnr' || nt === 'train') return '🚆';
    if (nt === 'bus') return '🚌';
    if (nt === 'jeep' || nt === 'jeepney') return '🚐';
    if (nt === 'tricycle') return '🛺';
    if (nt === 'taxi') return '🚕';
    if (nt === 'walk' || nt === 'walking' || nt === 'foot' || nt === 'pedestrian') return '🚶';
    return '🔁';
  };

  const isValidCoord = (c: any): c is { latitude: number; longitude: number } => {
    return (
      !!c &&
      typeof c.latitude === 'number' &&
      typeof c.longitude === 'number' &&
      !(c.latitude === 0 && c.longitude === 0)
    );
  };

  const getSegmentBoardCoord = (segment: RouteSegment) => {
    const firstGeom = Array.isArray(segment.geometry) && segment.geometry.length > 0 ? segment.geometry[0] : null;
    return isValidCoord(firstGeom) ? firstGeom : segment.origin?.coordinates;
  };

  const getSegmentAlightCoord = (segment: RouteSegment) => {
    const lastGeom = Array.isArray(segment.geometry) && segment.geometry.length > 0 ? segment.geometry[segment.geometry.length - 1] : null;
    return isValidCoord(lastGeom) ? lastGeom : segment.destination?.coordinates;
  };

  const coordKey = (c: { latitude: number; longitude: number }) => `${c.latitude.toFixed(6)},${c.longitude.toFixed(6)}`;

  const offsetCoord = (c: { latitude: number; longitude: number }, dLon: number, dLat: number) => ({
    latitude: c.latitude + dLat,
    longitude: c.longitude + dLon
  });

  const getTransferMarkers = () => {
    if (!route || !Array.isArray(route.segments) || route.segments.length < 2) {
      return [] as Array<{
        coordinate: { latitude: number; longitude: number };
        number: number;
        kind: 'alight' | 'board';
        fromType: string;
        toType: string;
        modeType: string;
      }>;
    }

    const nonWalk = route.segments.filter(s => s && !isWalkType(s.transportType));
    if (nonWalk.length < 2) {
      return [] as Array<{
        coordinate: { latitude: number; longitude: number };
        number: number;
        kind: 'alight' | 'board';
        fromType: string;
        toType: string;
        modeType: string;
      }>;
    }

    const markers: Array<{
      coordinate: { latitude: number; longitude: number };
      number: number;
      kind: 'alight' | 'board';
      fromType: string;
      toType: string;
      modeType: string;
    }> = [];
    const seen = new Set<string>();
    let transferNo = 0;

    for (let i = 1; i < nonWalk.length; i++) {
      const prev = nonWalk[i - 1];
      const cur = nonWalk[i];

      const prevType = normalizeTransportType(prev.transportType);
      const curType = normalizeTransportType(cur.transportType);

      // Only mark a transfer when the non-walk mode actually changes (bus->train, etc.).
      if (!prevType || !curType || prevType === curType) continue;

      const alight = getSegmentAlightCoord(prev);
      const board = getSegmentBoardCoord(cur);
      if (!isValidCoord(alight) || !isValidCoord(board)) continue;

      transferNo += 1;

      // If they collapse to the same point (common at stations), offset slightly so labels are visible.
      const alightKey = coordKey(alight);
      const boardKey = coordKey(board);
      const same = alightKey === boardKey;

      const alightCoord = same ? offsetCoord(alight, -0.00012, 0) : alight;
      const boardCoord = same ? offsetCoord(board, 0.00012, 0) : board;

      const seenKey = same ? `${alightKey}|${boardKey}|${transferNo}` : `${alightKey}|${boardKey}`;
      if (seen.has(seenKey)) continue;
      seen.add(seenKey);

      markers.push({
        coordinate: alightCoord,
        number: transferNo,
        kind: 'alight',
        fromType: prevType,
        toType: curType,
        modeType: prevType
      });
      markers.push({
        coordinate: boardCoord,
        number: transferNo,
        kind: 'board',
        fromType: prevType,
        toType: curType,
        modeType: curType
      });
    }

    return markers;
  };

  // Web map implementation with Leaflet
  if (Platform.OS === 'web' && MapContainer) {
    const center: [number, number] = [
      origin?.coordinates.latitude || destination?.coordinates.latitude || 14.5995,
      origin?.coordinates.longitude || destination?.coordinates.longitude || 120.9842
    ];

    let makeTransferIcon: ((n: number, kind: 'alight' | 'board', modeType: string) => any) | null = null;
    try {
      const L = require('leaflet');
      makeTransferIcon = (n: number, kind: 'alight' | 'board', modeType: string) => {
        const bg = kind === 'alight' ? '#2980b9' : '#27ae60';
        const label = kind === 'alight' ? 'A' : 'B';
        const icon = getModeEmoji(modeType);
        return L.divIcon({
          className: '',
          html: `
            <div style="
              width: 24px;
              height: 24px;
              border-radius: 12px;
              background: ${bg};
              border: 2px solid #fff;
              color: #fff;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              font-size: 11px;
              font-weight: 800;
              box-shadow: 0 2px 6px rgba(0,0,0,0.35);
              line-height: 1;
            ">
              <div style="display:flex; gap:2px; align-items:center; justify-content:center;">
                <span>${n}</span>
                <span style="font-size: 10px;">${icon}</span>
              </div>
              <div style="font-size: 9px; font-weight: 900; margin-top: -1px; opacity: 0.95;">${label}</div>
            </div>
          `,
          iconSize: [24, 24],
          iconAnchor: [12, 12]
        });
      };
    } catch {
      makeTransferIcon = null;
    }

    return (
      <View style={styles.container}>
        <div style={{ width: '100%', height: '100%' }}>
          <MapContainer
            center={center}
            zoom={13}
            style={{ width: '100%', height: '100%' }}
          >
            {/* Base OSM map */}
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {/* Railway overlay via OpenRailwayMap */}
            <TileLayer
              attribution='&copy; OpenRailwayMap contributors'
              url="https://{s}.tiles.openrailwaymap.org/standard/{z}/{x}/{y}.png"
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

            {/* Transfer markers (A=alight, B=board; tap for instructions) */}
            {showTransferMarkers && getTransferMarkers().map((m) => (
              <LeafletMarker
                key={`transfer-${m.number}-${m.kind}`}
                position={[m.coordinate.latitude, m.coordinate.longitude]}
                icon={makeTransferIcon ? makeTransferIcon(m.number, m.kind, m.modeType) : undefined}
              >
                {Popup && (
                  <Popup>
                    <div style={{ minWidth: 180 }}>
                      <div style={{ fontWeight: 700, marginBottom: 4 }}>
                        Transfer {m.number} {m.kind === 'alight' ? '(Alight)' : '(Board)'}
                      </div>
                      <div style={{ marginBottom: 6 }}>
                        {getModeEmoji(m.fromType)} {getModeLabel(m.fromType)} → {getModeEmoji(m.toType)} {getModeLabel(m.toType)}
                      </div>
                      <div>
                        {m.kind === 'alight'
                          ? `Alight from ${getModeLabel(m.fromType)} here.`
                          : `Board ${getModeLabel(m.toType)} here.`}
                      </div>
                    </div>
                  </Popup>
                )}
              </LeafletMarker>
            ))}

            {/* Render route segments with different colors */}
            {route && route.segments.map((segment) => {
              // Use actual geometry if available, otherwise fall back to straight line
              const pathCoordinates = segment.geometry && segment.geometry.length > 0
                ? segment.geometry.map(coord => [coord.latitude, coord.longitude] as [number, number])
                : [
                    [segment.origin.coordinates.latitude, segment.origin.coordinates.longitude] as [number, number],
                    [segment.destination.coordinates.latitude, segment.destination.coordinates.longitude] as [number, number]
                  ];

              const isWalk = isWalkType(segment.transportType);

              return (
                <LeafletPolyline
                  key={segment.id}
                  positions={pathCoordinates}
                  color={isWalk ? '#7f8c8d' : getTransportColor(segment.transportType)}
                  weight={isWalk ? 4 : 5}
                  dashArray={isWalk ? '3 10' : undefined}
                />
              );
            })}
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
        style={styles.map}
        region={region}
        onPress={handleMapPress}
      >
        {/* Railway overlay for native using OpenRailwayMap */}
        {UrlTile && (
          <UrlTile
            urlTemplate="https://{s}.tiles.openrailwaymap.org/standard/{z}/{x}/{y}.png"
            zIndex={1}
            maximumZ={19}
          />
        )}
        {origin && (
          <Marker
            coordinate={origin.coordinates}
            title="Origin"
            description={origin.name}
            pinColor="green"
            zIndex={10}
          />
        )}

        {destination && (
          <Marker
            coordinate={destination.coordinates}
            title="Destination"
            description={destination.name}
            pinColor="red"
            zIndex={10}
          />
        )}

        {stopovers.map((stopover) => (
          <Marker
            key={stopover.id}
            coordinate={stopover.location.coordinates}
            title={stopover.type}
            description={stopover.location.name}
            pinColor="blue"
            zIndex={9}
          />
        ))}

        {/* Render route segments with different colors per transport type */}
        {route && route.segments.map((segment, index) => {
          // Use actual geometry if available, otherwise fall back to straight line
          const pathCoordinates = segment.geometry && segment.geometry.length > 0
            ? segment.geometry
            : [segment.origin.coordinates, segment.destination.coordinates].filter(c => !(c.latitude === 0 && c.longitude === 0));

          const isWalk = isWalkType(segment.transportType);

          console.log(`[MapView] Rendering segment ${index}:`, {
            id: segment.id,
            hasGeometry: !!segment.geometry,
            geometryLength: segment.geometry?.length || 0,
            pathLength: pathCoordinates.length,
            firstCoord: pathCoordinates[0],
            lastCoord: pathCoordinates[pathCoordinates.length - 1]
          });

          return (
            <React.Fragment key={segment.id}>
              <Polyline
                coordinates={pathCoordinates}
                strokeColor={isWalk ? '#7f8c8d' : getTransportColor(segment.transportType)}
                strokeWidth={isWalk ? 4 : 5}
                lineDashPattern={isWalk ? [2, 10] : undefined}
                geodesic={false}
                zIndex={5}
                lineCap="round"
                lineJoin="round"
              />
            </React.Fragment>
          );
        })}

        {/* Numbered transfer-point markers (A=alight, B=board; kept minimal to avoid clutter) */}
        {showTransferMarkers && getTransferMarkers().map((m) => (
          <Marker
            key={`transfer-${m.number}-${m.kind}`}
            coordinate={m.coordinate}
            anchor={{ x: 0.5, y: 0.5 }}
            tracksViewChanges={false}
            zIndex={8}
          >
            <View style={[styles.transferBadge, m.kind === 'alight' ? styles.transferBadgeAlight : styles.transferBadgeBoard]}>
              <View style={styles.transferBadgeTopRow}>
                <Text style={styles.transferBadgeText}>{m.number}</Text>
                <Ionicons name={getModeIconName(m.modeType)} size={11} color="#fff" />
              </View>
              <Text style={styles.transferBadgeSubText}>{m.kind === 'alight' ? 'A' : 'B'}</Text>
            </View>

            {Callout && (
              <Callout>
                <View style={styles.transferCallout}>
                  <Text style={styles.transferCalloutTitle}>
                    Transfer {m.number} {m.kind === 'alight' ? '(Alight)' : '(Board)'}
                  </Text>
                  <Text style={styles.transferCalloutRow}>
                    {getModeLabel(m.fromType)} → {getModeLabel(m.toType)}
                  </Text>
                  <Text style={styles.transferCalloutRow}>
                    {m.kind === 'alight'
                      ? `Alight from ${getModeLabel(m.fromType)} here.`
                      : `Board ${getModeLabel(m.toType)} here.`}
                  </Text>
                </View>
              </Callout>
            )}
          </Marker>
        ))}

        {/* Fallback route rendering for simple routes without segments */}
        {showRoute && !route && origin && destination && previewCoords && (
          <Polyline
            coordinates={previewCoords}
            strokeColor="#3498db"
            strokeWidth={5}
          />
        )}
      </MapView>

      {/* Legend toggle (hidden by default; tap to show) */}
      {route && route.segments.length > 0 && (
        <View style={styles.legendToggleWrap}>
          <TouchableOpacity
            style={styles.legendToggleButton}
            onPress={() => setLegendVisible(v => !v)}
            activeOpacity={0.8}
          >
            <Ionicons name={legendVisible ? 'close' : 'information-circle-outline'} size={16} color="#2c3e50" />
            <Text style={styles.legendToggleText}>{legendVisible ? 'Hide legend' : 'Show legend'}</Text>
          </TouchableOpacity>
        </View>
      )}

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

      {/* Show legend only when toggled */}
      {legendVisible && route && route.segments.length > 0 && (
        <MapLegend />
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
  legendToggleWrap: {
    position: 'absolute',
    left: 12,
    top: 12,
    zIndex: 20
  },
  legendToggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.95)',
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
    color: '#2c3e50'
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
  },
  transferDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#2c3e50',
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
  }
  ,
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
    color: '#2c3e50',
    marginBottom: 4
  },
  transferCalloutRow: {
    fontSize: 12,
    color: '#2c3e50',
    marginBottom: 2
  }
});

export default MapViewComponent;

