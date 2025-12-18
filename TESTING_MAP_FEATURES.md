# Testing Guide - Map Visualization Enhancement

## How to Test the New Features

### 1. Route Results Screen - Map Display

**Steps to Test:**
1. Open the app and navigate to Public Transport screen
2. Select an origin (e.g., "Alabang-South Station Ramp, Muntinlupa City, Manila")
3. Select a destination (e.g., "Gilmore LRT")
4. Choose a preference (Shortest Time, Lowest Fare, or Fewest Transfers)
5. Tap "Find Routes"

**Expected Results:**
- ✅ Route Results screen shows a map at the top (300px height)
- ✅ Map displays the selected route with colored lines
- ✅ Different transport types show in different colors:
  - Jeepney routes = Red lines
  - Bus routes = Blue lines
  - UV Express = Purple lines
  - Train routes = Green lines
- ✅ Legend appears at bottom-left of map showing all transport types
- ✅ Markers appear at route segment start/end points
- ✅ When you select a different route card, the map updates

### 2. Route Cards - Color-Coded Transport Types

**Steps to Test:**
1. In the Route Results screen, examine the route cards below the map
2. Look at the transport icons section at the top of each card
3. Look at the segment details section

**Expected Results:**
- ✅ Transport type badges show colored circles with icons:
  - 🚐 Red for Jeepney
  - 🚌 Blue for Bus
  - 🚐 Purple for UV Express
  - 🚆 Green for Train
- ✅ Arrows (→) separate different transport segments
- ✅ Each segment detail has a colored vertical bar on the left
- ✅ Each segment has a colored circular badge with icon

### 3. Trip Plan Screen - Multi-Leg Journey Map

**Steps to Test:**
1. From Route Results, tap "Add Another Destination"
2. Add 1-2 additional destinations to create a trip plan
3. Observe the map at the top of the Trip Plan screen

**Expected Results:**
- ✅ Map shows the route from first to last destination
- ✅ All route segments are visible with their respective colors
- ✅ Map updates when you add new destinations
- ✅ Legend shows active transport types

### 4. Color Consistency Check

**Steps to Test:**
1. Navigate through different screens with routes
2. Compare colors across map, route cards, and trip plans

**Expected Results:**
- ✅ Same transport type always uses same color everywhere
- ✅ Jeepney is always red in all locations
- ✅ Bus is always blue in all locations
- ✅ UV Express is always purple in all locations
- ✅ Train is always green in all locations

### 5. Legend Display

**Steps to Test:**
1. View any screen with a map showing routes
2. Look for the legend at bottom-left corner of map

**Expected Results:**
- ✅ Legend appears automatically when routes are displayed
- ✅ Legend shows all 4 transport types with correct colors
- ✅ Each type shows icon and label
- ✅ Legend has semi-transparent white background
- ✅ Legend doesn't block important map elements

### 6. Empty/No Routes State

**Steps to Test:**
1. Search for routes between two locations with no available routes
2. Observe the empty state screen

**Expected Results:**
- ✅ Map still displays showing origin and destination
- ✅ "No Routes Found" message appears
- ✅ "Try Again" button is available

### 7. Platform Compatibility

**Test on Different Platforms:**

**iOS/Android:**
- ✅ Uses React Native Maps
- ✅ Smooth polyline rendering
- ✅ Markers display correctly
- ✅ Colors are vibrant and clear

**Web:**
- ✅ Uses Leaflet maps
- ✅ OpenStreetMap tiles load
- ✅ Polylines render with correct colors
- ✅ Legend displays properly

## Known Working Scenarios

### Example Route 1 (from your screenshot):
- **Origin:** Alabang-South Station Ramp, Muntinlupa City, Manila
- **Destination:** Gilmore LRT
- **Expected:** Two route options
  - Route #1: Direct Jeepney (Red line, 45 min, ₱13)
  - Route #2: Bus + Train transfer (Blue + Green lines, 50 min, ₱35)

## Troubleshooting

### Map Not Displaying
- Check that location services are enabled
- Verify internet connection for map tiles
- Check console for any API key issues

### Colors Not Showing
- Verify `transportUtils.ts` is imported correctly
- Check that route segments have valid `transportType` field
- Inspect console for any type errors

### Legend Not Appearing
- Confirm route has segments with data
- Check that `MapLegend` component is rendered
- Verify position styling isn't causing it to be hidden

## Visual Checklist

When testing, verify these visual elements:

- [ ] Map is prominent at top of screen
- [ ] Map height is appropriate (300px on results, 250px on trip plan)
- [ ] Route lines are thick enough to see (5px width)
- [ ] Colors are distinct and easy to differentiate
- [ ] Icons are recognizable and appropriate size
- [ ] Legend is readable and doesn't obstruct view
- [ ] Markers clearly indicate stops
- [ ] Selected route card is highlighted
- [ ] Map updates when selecting different routes
- [ ] Smooth scrolling between map and route list

## Performance Notes

- Map should load within 2-3 seconds
- Route updates should be instant when selecting cards
- No lag when scrolling route list
- Polylines render smoothly without flickering
- Legend appears/disappears without delay

## Success Criteria

✅ **Complete** if all of the following are true:
1. Map always visible when routes are available
2. Each transport type has distinct color
3. Colors are consistent throughout app
4. Route segments clearly plotted on map
5. Legend helps users understand colors
6. Visual design is clean and professional
7. No errors in console
8. Works on iOS, Android, and Web
