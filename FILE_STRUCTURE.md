# Complete File Structure

```
multi-modal-fare-route-estimation-frontend/
│
├── 📄 App.tsx                          # Root application component with providers
├── 📄 index.js                         # Entry point for Expo
├── 📄 package.json                     # Dependencies and scripts
├── 📄 tsconfig.json                    # TypeScript configuration with path aliases
├── 📄 babel.config.js                  # Babel configuration with module resolver
├── 📄 metro.config.js                  # Metro bundler configuration
├── 📄 app.json                         # Expo app configuration
├── 📄 .gitignore                       # Git ignore rules
├── 📄 .env.example                     # Environment variables template
├── 📄 README.md                        # Project documentation
├── 📄 SETUP.md                         # Quick start guide
│
└── 📁 src/
    │
    ├── 📁 components/                  # Reusable UI components
    │   ├── 📄 DestinationInput.tsx     # Location search input with autocomplete
    │   ├── 📄 MapViewComponent.tsx     # Map display with markers and routes
    │   ├── 📄 RouteCard.tsx            # Route display card with details
    │   ├── 📄 StopoverInput.tsx        # Stopover management for private vehicles
    │   └── 📄 TripSummary.tsx          # Trip plan overview component
    │
    ├── 📁 context/                     # React Context providers
    │   ├── 📄 AppContext.tsx           # Global app state (mode, loading, errors)
    │   └── 📄 LocationContext.tsx      # Location state and permissions
    │
    ├── 📁 hooks/                       # Custom React hooks
    │   ├── 📄 useRoutes.ts             # Hook for fetching and processing routes
    │   └── 📄 useTripPlanner.ts        # Hook for managing multi-destination trips
    │
    ├── 📁 navigation/                  # React Navigation setup
    │   ├── 📄 RootNavigator.tsx        # Main stack navigator configuration
    │   └── 📄 types.ts                 # Navigation types and param lists
    │
    ├── 📁 screens/                     # Screen components
    │   ├── 📄 WelcomeScreen.tsx        # Landing/welcome screen
    │   ├── 📄 ModeSelectionScreen.tsx  # Choose public/private transport
    │   ├── 📄 PublicTransportScreen.tsx # Public transport route planning
    │   ├── 📄 PrivateVehicleScreen.tsx  # Private vehicle route planning
    │   ├── 📄 RouteResultsScreen.tsx    # Display public transport route options
    │   ├── 📄 TripPlanScreen.tsx        # Multi-destination trip planning
    │   └── 📄 PrivateVehicleResultsScreen.tsx # Private vehicle results and costs
    │
    ├── 📁 services/                    # Business logic and API services
    │   ├── 📄 api.ts                   # API client and endpoint functions
    │   ├── 📄 fuzzyLogic.ts            # Fuzzy logic route scoring algorithm
    │   ├── 📄 greedyAlgorithm.ts       # Greedy algorithm for route filtering
    │   └── 📄 mapService.ts            # Map utilities and geocoding
    │
    ├── 📁 types/                       # TypeScript type definitions
    │   └── 📄 index.ts                 # All app types (Route, Location, Vehicle, etc.)
    │
    ├── 📁 utils/                       # Utility functions and constants
    │   ├── 📄 helpers.ts               # Helper functions (formatting, validation)
    │   └── 📄 theme.ts                 # Theme constants (colors, spacing, etc.)
    │
    └── 📁 assets/                      # Static assets
        └── 📁 images/                  # Image assets
            ├── 📄 README.md            # Asset guidelines
            ├── 🖼️ icon.png             # App icon (1024x1024)
            ├── 🖼️ splash.png           # Splash screen (1242x2436)
            ├── 🖼️ adaptive-icon.png    # Android icon (1024x1024)
            ├── 🖼️ favicon.png          # Web favicon (48x48)
            └── 🖼️ welcome-illustration.png # Welcome screen graphic
```

## File Descriptions

### Root Files
- **App.tsx**: Main application component with navigation and context providers
- **index.js**: Expo entry point that registers the root component
- **package.json**: Project dependencies, scripts, and metadata
- **tsconfig.json**: TypeScript compiler configuration with path aliases
- **babel.config.js**: Babel transpiler configuration with module resolver
- **metro.config.js**: Metro bundler configuration for React Native
- **app.json**: Expo configuration (app name, version, permissions, etc.)
- **.gitignore**: Files and directories to ignore in version control
- **.env.example**: Template for environment variables
- **README.md**: Comprehensive project documentation
- **SETUP.md**: Quick start guide for developers

### Components (`src/components/`)
Reusable UI components used across multiple screens:
- **DestinationInput.tsx**: Location search with autocomplete suggestions
- **MapViewComponent.tsx**: Interactive map with markers, routes, and controls
- **RouteCard.tsx**: Displays route information (fare, time, transfers, segments)
- **StopoverInput.tsx**: Manage stopovers for private vehicle trips
- **TripSummary.tsx**: Overview of multi-destination trip plan

### Context (`src/context/`)
React Context providers for global state management:
- **AppContext.tsx**: Travel mode, loading states, error handling
- **LocationContext.tsx**: Current location, permissions, selected locations

### Hooks (`src/hooks/`)
Custom React hooks for reusable logic:
- **useRoutes.ts**: Fetch, filter (greedy), and rank (fuzzy) routes
- **useTripPlanner.ts**: Manage multi-destination trip state

### Navigation (`src/navigation/`)
React Navigation configuration:
- **RootNavigator.tsx**: Stack navigator with all screens
- **types.ts**: TypeScript types for navigation params

### Screens (`src/screens/`)
Full-screen components representing app pages:
- **WelcomeScreen.tsx**: App landing page
- **ModeSelectionScreen.tsx**: Choose between public/private transport
- **PublicTransportScreen.tsx**: Input form for public transport planning
- **PrivateVehicleScreen.tsx**: Input form for private vehicle planning
- **RouteResultsScreen.tsx**: Display and select from route options
- **TripPlanScreen.tsx**: Build multi-destination trips
- **PrivateVehicleResultsScreen.tsx**: Show fuel costs and route details

### Services (`src/services/`)
Business logic and external integrations:
- **api.ts**: Axios client, API endpoints, mock data
- **fuzzyLogic.ts**: Fuzzy scoring algorithm for route ranking
- **greedyAlgorithm.ts**: Constraint-based route filtering
- **mapService.ts**: OpenStreetMap integration, geocoding, distance calculation

### Types (`src/types/`)
TypeScript type definitions for type safety:
- **index.ts**: All interfaces and enums (Location, Route, Vehicle, etc.)

### Utils (`src/utils/`)
Utility functions and constants:
- **helpers.ts**: Formatting, validation, debounce, etc.
- **theme.ts**: Colors, spacing, typography, shadows

### Assets (`src/assets/`)
Static resources like images and fonts:
- **images/**: App icons, splash screen, illustrations

## Key Features by File

### Fuzzy Logic Implementation
- **File**: `src/services/fuzzyLogic.ts`
- **Functions**: 
  - `calculateFuzzyScore()` - Calculates fuzzy membership scores
  - `rankRoutes()` - Ranks routes using fuzzy logic
  - `applyPreferenceWeights()` - Adjusts weights based on user preference

### Greedy Algorithm Implementation
- **File**: `src/services/greedyAlgorithm.ts`
- **Functions**:
  - `applyGreedyFilter()` - Filters routes by constraints
  - `selectGreedyRoute()` - Selects best route greedily
  - `satisfiesConstraints()` - Validates route against constraints
  - `findOptimalMultiDestinationRoute()` - Multi-leg optimization

### Map Integration
- **File**: `src/services/mapService.ts`
- **Features**:
  - OpenStreetMap location search
  - Reverse geocoding
  - Distance calculation (Haversine formula)
  - Route polyline generation

### State Management
- **Files**: 
  - `src/context/AppContext.tsx` - Global app state
  - `src/context/LocationContext.tsx` - Location and permissions
- **Pattern**: React Context API with TypeScript

## Data Flow

```
User Input (Screen)
    ↓
Context/Hooks
    ↓
Services (API, Fuzzy Logic, Greedy Algorithm)
    ↓
Components (Display Results)
```

## Technology Stack

- **Framework**: React Native (Expo)
- **Language**: TypeScript
- **Navigation**: React Navigation 6
- **UI Library**: React Native Paper
- **Maps**: React Native Maps
- **HTTP Client**: Axios
- **State Management**: React Context API
- **Location Services**: Expo Location

## Total Files: 40+
- Configuration: 7
- Source Code: 30+
- Documentation: 3
