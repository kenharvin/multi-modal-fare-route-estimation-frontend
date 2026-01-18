# Multi-Modal Fare & Route Estimation (Frontend)

React Native (Expo) mobile app for planning multi-modal public transport routes (and estimating private-vehicle trip costs) for the Philippines.

This repo previously had multiple standalone markdown docs (setup, map geometry, color reference, testing notes, etc.). They’ve been consolidated into this single README to keep the root folder tidy.

## What the App Does

### Public Transport Mode
- Plan multi-modal trips combining walking + public transport (jeepney, bus, UV Express, trains)
- Choose a preference: lowest fare, shortest time, or fewest transfers
- Supports up to 2 additional destinations (multi-leg planning)
- Shows route details (fare, time, distance, transfers) and draws the route on the map

### Private Vehicle Mode
- Estimates fuel cost based on vehicle type, fuel efficiency, and fuel price
- Supports stopovers (up to 5) and driving preferences (e.g., avoid tolls/highways)

### Algorithms Used (Frontend)
- Greedy filtering: `src/services/greedyAlgorithm.ts`
- Fuzzy scoring/ranking: `src/services/fuzzyLogic.ts`

## Quick Start

### Prerequisites
- Node.js 16+
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)
- Android Studio (Android) and/or Xcode (iOS, macOS only)

### Install
```bash
npm install
```

### Environment Variables
Copy the template and edit values:
```bash
cp .env.example .env
```

Common variables used by the app:
- `EXPO_PUBLIC_API_BASE_URL` (backend base URL, e.g. `http://localhost:8000`)
- `GOOGLE_MAPS_API_KEY` (if required by your map provider configuration)
- `OPENSTREETMAP_API_URL` (defaults to Nominatim if used)

### Google Maps Setup (if applicable)
If you’re using Google Maps SDK features, enable:
- Maps SDK for Android
- Maps SDK for iOS
- Places API

Then place the key in `app.json` where required.

### Image Assets
Add these files under `src/assets/images/` (placeholders are OK during development):
- `icon.png` (1024x1024)
- `splash.png` (1242x2436)
- `adaptive-icon.png` (1024x1024)
- `favicon.png` (48x48)
- `welcome-illustration.png`

## Run

```bash
npm start
```

Then:
- Android: `npm run android`
- iOS: `npm run ios`
- Web: `npm run web`

## Backend Integration

The frontend is designed to call the FastAPI backend.

### Primary Endpoints
- `POST /public-transport/plan`
- `GET /stops/search?q={query}&limit=10`

### Typical Request Shape
```json
{
  "origin": {"lat": 14.5995, "lon": 120.9842, "name": "Cubao"},
  "destination": {"lat": 14.5547, "lon": 121.0244, "name": "Makati"},
  "preferences": {
    "preference_type": "balanced",
    "estimated_budget": 200.0,
    "preferred_modes": ["walk", "jeepney", "bus", "lrt", "mrt", "pnr"]
  }
}
```

`src/services/api.ts` contains the API client and response conversion logic.

## Map Rendering and Geometry

### Where polylines come from
- The backend returns route geometry in `map_geojson`.
- GeoJSON coordinate order is `[longitude, latitude]`.
- The frontend converts to `{ latitude, longitude }` and renders polylines per segment.

### If geometry is missing
If a segment has no geometry, the UI falls back to drawing a straight line between the segment endpoints.

### Transport Color Scheme
Used across map polylines, markers, badges, and route cards:
- Jeepney: `#e74c3c`
- Bus: `#3498db`
- UV Express: `#9b59b6`
- Train: `#2ecc71`

## Visual Test Checklist (Map)
- Route results screen shows a map and updates when selecting different route cards
- Polylines are color-coded per transport mode and a legend is visible when routes are shown
- Markers show segment start/end points
- Web works via Leaflet; native uses React Native Maps

## Project Structure (high level)

```
src/
  components/
  context/
  hooks/
  navigation/
  screens/
  services/
  types/
  utils/
  assets/
```

## Troubleshooting

- Metro cache issues: `npm start -- --reset-cache`
- Maps not showing: verify API keys (if used), permissions, and internet connectivity

## License

[Your License Here]
