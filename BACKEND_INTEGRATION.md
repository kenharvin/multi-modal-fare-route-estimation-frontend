# Backend Integration Guide

## Overview
The frontend is now integrated with your FastAPI backend for public transport routing.

## Backend Setup

### 1. Start the Backend Server
```bash
cd c:\Users\kenla\Documents\multi-modal-fare-route-estimator-backend
python main.py
```

The backend should start on `http://localhost:8000`

### 2. Verify Backend is Running
Open your browser and visit:
- `http://localhost:8000` - Should show the home page
- `http://localhost:8000/docs` - FastAPI interactive API documentation

## Frontend Configuration

### 1. Environment Variables
The `.env` file has been created with:
```env
EXPO_PUBLIC_API_BASE_URL=http://localhost:8000
```

### 2. API Endpoints Used

#### Public Transport Planning
- **Endpoint**: `POST /public-transport/plan`
- **Request Format**:
```json
{
  "origin": {
    "lat": 14.5995,
    "lon": 120.9842,
    "name": "Cubao"
  },
  "destination": {
    "lat": 14.5547,
    "lon": 121.0244,
    "name": "Makati"
  },
  "preferences": {
    "preference_type": "balanced",
    "estimated_budget": 200.0,
    "preferred_modes": ["walk", "jeepney", "bus", "lrt", "mrt", "pnr"]
  }
}
```

#### Stop Search (Autocomplete)
- **Endpoint**: `GET /stops/search?q={query}&limit=10`
- **Response**: List of stops with `stop_id`, `stop_name`, `stop_lat`, `stop_lon`

## Updated Files

1. **`.env`** - Backend URL configuration
2. **`src/services/api.ts`** - Updated to use FastAPI endpoints:
   - `fetchRoutes()` - Calls `/public-transport/plan`
   - `searchStops()` - Calls `/stops/search`
   - `convertBackendRouteToFrontend()` - Converts backend response to frontend format

3. **`src/components/DestinationInput.tsx`** - Now uses `searchStops()` API for autocomplete

## Testing the Integration

### 1. Start Backend
```bash
cd c:\Users\kenla\Documents\multi-modal-fare-route-estimator-backend
python main.py
```

### 2. Start Frontend
```bash
cd c:\Users\kenla\Documents\multi-modal-fare-route-estimation-frontend
npm start
```

Press `w` to open in web browser.

### 3. Test Flow
1. Select "Public Transport" mode
2. Type in origin/destination - autocomplete should show GTFS stops from your database
3. Select preference (Lowest Fare, Shortest Time, Fewest Transfers)
4. Tap "Find Routes"
5. The app will call your backend and display the optimized route

## Data Mapping

### Backend to Frontend Route Conversion
- `total_fare` → `totalFare`
- `total_travel_time` → `totalTime`
- `total_transfers` → `totalTransfers`
- `fuzzy_score` → `fuzzyScore`
- `route[]` → `segments[]`

### Transport Mode Mapping
- Backend: `walk`, `jeepney`, `bus`, `lrt`, `mrt`, `pnr`
- Frontend: Maps to `TransportType` enum (walk, jeepney, bus, train, uv_express)

## Network Configuration

### For Testing on Physical Device
If testing on a physical device on the same network, update `.env`:
```env
EXPO_PUBLIC_API_BASE_URL=http://YOUR_COMPUTER_IP:8000
```

Replace `YOUR_COMPUTER_IP` with your computer's local IP address (e.g., `192.168.1.100`).

### CORS Configuration
The backend should already have CORS enabled in `main.py`. If you encounter CORS errors, verify:
```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

## Troubleshooting

### Backend Not Responding
- Check backend is running: `http://localhost:8000`
- Check logs in backend terminal
- Verify database connection

### No Search Results
- Verify GTFS data is loaded in database
- Check `/stops/search` endpoint in browser: `http://localhost:8000/stops/search?q=cubao`

### Route Planning Fails
- Check backend logs for errors
- Verify graph is loaded (check startup logs)
- Test endpoint directly: `http://localhost:8000/docs` → Try `/public-transport/plan`

## Next Steps

1. **Private Vehicle Mode**: Not yet implemented in backend
2. **Multi-Destination Trips**: Backend supports `additional_destinations` parameter
3. **Map Visualization**: Backend returns `map_geojson` for displaying routes on map
4. **Alternatives**: Backend can return multiple route options in `alternatives` field
