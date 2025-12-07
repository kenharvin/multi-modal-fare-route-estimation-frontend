# Multi-Modal Fare & Route Estimation - Frontend

A React Native mobile application for planning multi-modal transportation routes in the Philippines. The app helps users find optimal routes using public transport or calculate fuel costs for private vehicles using fuzzy logic and greedy algorithms.

## Features

### Public Transport Mode
- **Multi-Modal Route Planning**: Find routes combining jeepneys, buses, UV Express, and trains
- **Smart Preferences**: Choose between lowest fare, shortest time, or fewest transfers
- **Fuzzy Logic Optimization**: AI-powered route ranking based on multiple criteria
- **Multi-Destination Support**: Add up to 2 additional stops to your journey
- **Interactive Map**: Pin locations directly on the map or search by name
- **Real-Time Route Details**: View fare, time, distance, and transfer information

### Private Vehicle Mode
- **Fuel Cost Calculation**: Accurate fuel consumption and cost estimation
- **Vehicle Categories**: Support for sedan, SUV, hatchback, motorcycle, and van
- **Custom Stopovers**: Add up to 5 stops (gas, food, rest, etc.)
- **Driving Preferences**: Avoid tolls, highways, or prefer shortest distance
- **Route Optimization**: Find the most efficient route based on your preferences

### Core Technologies
- **Greedy Algorithm**: Filters routes based on budget, distance, time, and transfer constraints
- **Fuzzy Logic**: Ranks routes using weighted scoring for fare, time, and transfers
- **OpenStreetMap Integration**: Location search and reverse geocoding
- **Real-Time Calculations**: Dynamic fare and fuel cost computations

## Project Structure

```
multi-modal-fare-route-estimation-frontend/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── DestinationInput.tsx
│   │   ├── MapViewComponent.tsx
│   │   ├── RouteCard.tsx
│   │   ├── StopoverInput.tsx
│   │   └── TripSummary.tsx
│   ├── context/            # React Context providers
│   │   ├── AppContext.tsx
│   │   └── LocationContext.tsx
│   ├── hooks/              # Custom React hooks
│   │   ├── useRoutes.ts
│   │   └── useTripPlanner.ts
│   ├── navigation/         # React Navigation setup
│   │   ├── RootNavigator.tsx
│   │   └── types.ts
│   ├── screens/            # Screen components
│   │   ├── WelcomeScreen.tsx
│   │   ├── ModeSelectionScreen.tsx
│   │   ├── PublicTransportScreen.tsx
│   │   ├── PrivateVehicleScreen.tsx
│   │   ├── RouteResultsScreen.tsx
│   │   ├── TripPlanScreen.tsx
│   │   └── PrivateVehicleResultsScreen.tsx
│   ├── services/           # API and business logic services
│   │   ├── api.ts
│   │   ├── fuzzyLogic.ts
│   │   ├── greedyAlgorithm.ts
│   │   └── mapService.ts
│   ├── types/              # TypeScript type definitions
│   │   └── index.ts
│   ├── utils/              # Utility functions
│   │   ├── helpers.ts
│   │   └── theme.ts
│   └── assets/             # Images and static resources
│       └── images/
├── App.tsx                 # Root component
├── app.json               # Expo configuration
├── package.json           # Dependencies
├── tsconfig.json          # TypeScript configuration
├── babel.config.js        # Babel configuration
└── .env.example           # Environment variables template
```

## Installation

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Expo CLI: `npm install -g expo-cli`
- Android Studio (for Android) or Xcode (for iOS)

### Setup Steps

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd multi-modal-fare-route-estimation-frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and add your API keys:
   ```
   API_BASE_URL=http://your-backend-api-url/api
   GOOGLE_MAPS_API_KEY=your_google_maps_api_key
   OPENSTREETMAP_API_URL=https://nominatim.openstreetmap.org
   ```

4. **Add Google Maps API key to app.json**
   - Open `app.json`
   - Replace `YOUR_GOOGLE_MAPS_API_KEY` with your actual API key

5. **Add placeholder images to `src/assets/images/`**

## Running the App

```bash
# Start Expo development server
npm start

# Run on Android
npm run android

# Run on iOS
npm run ios
```

## Key Algorithms

### Greedy Algorithm
Filters routes based on hard constraints (budget, distance, time, transfers).
Located in: `src/services/greedyAlgorithm.ts`

### Fuzzy Logic
Ranks routes using weighted scoring for fare, time, and transfers.
Located in: `src/services/fuzzyLogic.ts`

## Technologies Used

- React Native with Expo
- TypeScript
- React Navigation
- React Native Paper
- React Native Maps
- Axios

## License

[Your License Here]
