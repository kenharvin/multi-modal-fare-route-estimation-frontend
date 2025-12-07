# Quick Start Guide

## Getting Started

This guide will help you set up and run the Multi-Modal Fare & Route Estimation frontend application.

## Step 1: Install Dependencies

```bash
npm install
```

## Step 2: Environment Setup

1. Copy the environment template:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` with your configuration:
   - Set your backend API URL
   - Add your Google Maps API key
   - Configure OpenStreetMap URL (or leave default)

## Step 3: Configure Google Maps

1. Get a Google Maps API key from [Google Cloud Console](https://console.cloud.google.com/)
2. Enable the following APIs:
   - Maps SDK for Android
   - Maps SDK for iOS
   - Places API
3. Add the key to `app.json` in the Android configuration section

## Step 4: Add Placeholder Assets

Create or add the following images to `src/assets/images/`:
- `icon.png` (1024x1024) - App icon
- `splash.png` (1242x2436) - Splash screen
- `adaptive-icon.png` (1024x1024) - Android adaptive icon
- `favicon.png` (48x48) - Web favicon
- `welcome-illustration.png` - Welcome screen graphic

You can use placeholders from [placeholder.com](https://placeholder.com/) during development.

## Step 5: Run the Application

### Development Server
```bash
npm start
```

This will open Expo Dev Tools in your browser.

### Run on Android
```bash
npm run android
```

Requirements:
- Android Studio installed
- Android SDK configured
- Android emulator running OR physical device connected

### Run on iOS (macOS only)
```bash
npm run ios
```

Requirements:
- Xcode installed
- iOS Simulator OR physical iOS device

### Run on Web
```bash
npm run web
```

## Testing the App

### Without Backend
The app includes mock data for development. You can test all features without a running backend server.

### With Backend
1. Ensure your backend is running
2. Update `API_BASE_URL` in `.env` to point to your backend
3. Restart the app

## Troubleshooting

### Issue: "Cannot find module '@/...'
**Solution**: Clear Metro cache
```bash
npm start -- --reset-cache
```

### Issue: Maps not showing
**Solution**: 
- Verify Google Maps API key is correct
- Check that location permissions are granted
- Ensure internet connection is available

### Issue: Build errors
**Solution**: Reinstall dependencies
```bash
rm -rf node_modules
npm install
```

### Issue: TypeScript errors
**Solution**: Ensure all path aliases are configured in both:
- `tsconfig.json`
- `babel.config.js`

## Next Steps

1. **Customize the UI**: Modify colors in `src/utils/theme.ts`
2. **Add Features**: Create new screens in `src/screens/`
3. **Integrate Backend**: Update API endpoints in `src/services/api.ts`
4. **Add Tests**: Write tests for components and services

## Common Development Commands

```bash
# Install dependencies
npm install

# Start development server
npm start

# Clear cache
npm start -- --reset-cache

# Run linter
npm run lint

# Run tests
npm test

# Build for production (Android)
expo build:android

# Build for production (iOS)
expo build:ios
```

## Project Features Overview

### Public Transport Features
- ✅ Search origin and destination
- ✅ Select from map or search
- ✅ Choose preference (fare/time/transfers)
- ✅ View multiple route options
- ✅ See detailed route segments
- ✅ Add multiple destinations (up to 2)
- ✅ View trip summary
- ✅ Save trip plans

### Private Vehicle Features
- ✅ Select vehicle type
- ✅ Input fuel efficiency
- ✅ Set fuel price
- ✅ Add stopovers (up to 5)
- ✅ Set driving preferences
- ✅ Calculate fuel cost
- ✅ View route on map
- ✅ Save route

## Support

For issues or questions, please refer to the main README.md or contact the development team.
