# Transport Type Color Reference

## Color Scheme for Route Visualization

This document provides a quick reference for the color coding used throughout the app.

### Transport Types & Colors

| Transport Type | Color | Hex Code | Icon | Usage |
|---------------|-------|----------|------|-------|
| **Jeepney** | 🔴 Red | `#e74c3c` | 🚐 | Map polylines, badges, route cards |
| **Bus** | 🔵 Blue | `#3498db` | 🚌 | Map polylines, badges, route cards |
| **UV Express** | 🟣 Purple | `#9b59b6` | 🚐 | Map polylines, badges, route cards |
| **Train** | 🟢 Green | `#2ecc71` | 🚆 | Map polylines, badges, route cards |

### Visual Examples

#### On the Map
- Route segments display as **thick colored lines** (5px width)
- Line color matches the transport type
- Markers at each stop use the same color

#### In Route Cards
- Circular colored badges show transport icons
- Vertical colored bars on segment details
- Badge background matches transport type

#### In Legend
- Compact boxes with transport icons
- Color-coded backgrounds
- Labels for easy identification

### Accessibility Notes
- Colors chosen for sufficient contrast
- Icons supplement color coding
- Text labels always present
- Works in light/dark modes

### Using the Utilities

```typescript
import { getTransportStyle, getTransportColor, getTransportIcon } from '@/utils/transportUtils';
import { TransportType } from '@/types';

// Get complete style info
const style = getTransportStyle(TransportType.JEEPNEY);
// { color: '#e74c3c', icon: '🚐', label: 'Jeepney' }

// Get just the color
const color = getTransportColor(TransportType.BUS);
// '#3498db'

// Get just the icon
const icon = getTransportIcon(TransportType.TRAIN);
// '🚆'
```

### Design Principles

1. **Consistency**: Same colors used everywhere
2. **Distinction**: Colors are visually distinct from each other
3. **Recognition**: Icons reinforce color coding
4. **Accessibility**: High contrast with backgrounds
5. **Cultural**: Colors chosen to match common associations (e.g., trains = green for go)
