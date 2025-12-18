# Route Geometry Implementation

## Overview
The app now displays actual route paths on the map that follow roads, instead of straight lines between origin and destination.

## How It Works

### Backend (FastAPI)
The backend returns route geometry in the `map_geojson` field with the following structure:

```json
{
  "total_fare": 35.0,
  "total_travel_time": 50,
  "route": [
    {
      "mode": "bus",
      "origin": "Alabang Station",
      "destination": "Transfer Point",
      "fare": 20.0
    },
    {
      "mode": "lrt",
      "origin": "Transfer Point",
      "destination": "Gilmore LRT",
      "fare": 15.0
    }
  ],
  "map_geojson": {
    "type": "FeatureCollection",
    "features": [
      {
        "type": "Feature",
        "geometry": {
          "type": "LineString",
          "coordinates": [
            [121.0474, 14.4291],  // [longitude, latitude]
            [121.0475, 14.4295],
            [121.0476, 14.4298],
            // ... many more points along the actual road
            [121.0520, 14.4350]
          ]
        },
        "properties": {
          "mode": "bus"
        }
      },
      {
        "type": "Feature",
        "geometry": {
          "type": "LineString",
          "coordinates": [
            // ... coordinates for LRT segment
          ]
        },
        "properties": {
          "mode": "lrt"
        }
      }
    ]
  }
}
```

### Frontend (React Native)

#### 1. Type Definition (`src/types/index.ts`)
Added `geometry` field to `RouteSegment`:
```typescript
export interface RouteSegment {
  id: string;
  transportType: TransportType;
  routeName: string;
  origin: Location;
  destination: Location;
  fare: number;
  estimatedTime: number;
  distance: number;
  geometry?: Coordinates[]; // NEW: Array of lat/lon points
}
```

#### 2. API Service (`src/services/api.ts`)
The `convertBackendRouteToFrontend` function now:
- Extracts geometry from `map_geojson.features`
- Converts GeoJSON coordinates `[lon, lat]` to `{latitude, longitude}`
- Attaches geometry array to each segment
- Falls back to straight line if no geometry available

```typescript
const geometryMap = new Map<number, any[]>();
if (backendResponse.map_geojson?.features) {
  backendResponse.map_geojson.features.forEach((feature: any, idx: number) => {
    if (feature.geometry?.type === 'LineString') {
      geometryMap.set(idx, feature.geometry.coordinates);
    }
  });
}

// Convert to Coordinates array
const geometry = coords.map((coord: number[]) => ({
  latitude: coord[1],  // GeoJSON uses [lon, lat]
  longitude: coord[0]
}));
```

#### 3. Map Component (`src/components/MapViewComponent.tsx`)
Updated to render actual paths:

**Native (React Native Maps):**
```typescript
{route && route.segments.map((segment, index) => {
  const pathCoordinates = segment.geometry && segment.geometry.length > 0
    ? segment.geometry  // Use actual path
    : [segment.origin.coordinates, segment.destination.coordinates]; // Fallback

  return (
    <Polyline
      coordinates={pathCoordinates}
      strokeColor={getTransportColor(segment.transportType)}
      strokeWidth={5}
    />
  );
})}
```

**Web (Leaflet):**
```typescript
const pathCoordinates = segment.geometry && segment.geometry.length > 0
  ? segment.geometry.map(coord => [coord.latitude, coord.longitude])
  : [[segment.origin.coordinates.latitude, segment.origin.coordinates.longitude],
     [segment.destination.coordinates.latitude, segment.destination.coordinates.longitude]];

<LeafletPolyline
  positions={pathCoordinates}
  color={getTransportColor(segment.transportType)}
  weight={5}
/>
```

#### 4. Auto-Zoom to Route
Added logic to automatically center and zoom the map to show the entire route:
```typescript
useEffect(() => {
  if (route && route.segments.length > 0) {
    const allCoords = [];
    
    route.segments.forEach(segment => {
      if (segment.geometry && segment.geometry.length > 0) {
        allCoords.push(...segment.geometry);
      }
    });

    // Calculate bounding box
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLon = Math.min(...lons);
    const maxLon = Math.max(...lons);
    
    // Center map with 30% padding
    setRegion({
      latitude: (minLat + maxLat) / 2,
      longitude: (minLon + minLon) / 2,
      latitudeDelta: (maxLat - minLat) * 1.3,
      longitudeDelta: (maxLon - minLon) * 1.3
    });
  }
}, [route]);
```

## Backend Geometry Sources

The backend builds geometry from multiple sources:

1. **GTFS Shape Data**: For transit routes (bus, jeepney, train)
   - Uses `shapes.txt` from GTFS feed
   - Provides actual vehicle paths

2. **OSM Graph Data**: For walking segments
   - Uses OpenStreetMap road network
   - Calculates shortest walking path

3. **Fallback**: Direct line between points
   - Used when no shape data available
   - Better than nothing

## Coordinate Systems

**GeoJSON Standard (Backend):**
- Format: `[longitude, latitude]`
- Example: `[121.0474, 14.4291]`

**Frontend (React Native / Leaflet):**
- Format: `{latitude: number, longitude: number}`
- Example: `{latitude: 14.4291, longitude: 121.0474}`

**Conversion happens in API service:**
```typescript
const geometry = coords.map((coord: number[]) => ({
  latitude: coord[1],   // Second element is latitude
  longitude: coord[0]   // First element is longitude
}));
```

## Benefits

✅ **Accurate Visualization**: Users see exactly where routes go
✅ **Road Following**: Paths follow actual streets and tracks
✅ **Multi-Modal Support**: Different colors for each transport type
✅ **Smooth Rendering**: Many points create smooth curves
✅ **Transfer Points**: Clear connection between segments

## Troubleshooting

### Issue: Straight lines still showing
**Cause**: Backend not returning geometry
**Check**: Look for `map_geojson` in backend response
**Fix**: Ensure GTFS data is loaded and graph is built

### Issue: Lines go off-road
**Cause**: Incorrect coordinate order or missing data
**Check**: Verify GeoJSON coordinate order `[lon, lat]`
**Fix**: Check coordinate conversion in API service

### Issue: Map not centered on route
**Cause**: Region calculation issue
**Check**: Geometry array has valid coordinates
**Fix**: Verify bounding box calculation in useEffect

## Testing

To verify geometry is working:

1. **Check Backend Response**:
   ```bash
   # In backend terminal, look for:
   "map_geojson": { "features": [ ... ] }
   ```

2. **Check Frontend Parsing**:
   ```javascript
   // Add console.log in api.ts
   console.log('Geometry length:', geometry.length);
   console.log('First coord:', geometry[0]);
   ```

3. **Visual Check**:
   - Routes should curve naturally
   - Follow visible roads on map
   - Different segments have different colors
   - No sharp angles or impossible paths
