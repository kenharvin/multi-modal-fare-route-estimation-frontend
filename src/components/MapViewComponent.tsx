import React, { useMemo, useRef, useState, useEffect } from 'react';
import { StyleSheet, View, TouchableOpacity, Text, Platform } from 'react-native';
import { Location, Stopover, Route, RouteSegment, TransportType } from '@/types';
import { getTransportColor } from '@/utils/transportUtils';
import { type ThemeColors } from '@/utils/theme';
import { useThemeMode } from '@context/ThemeContext';
import MapLegend from './MapLegend';
import { getPreviewPolyline, getCoverageBoundaries, type ModeCoverageBoundaries } from '@/services/api';
import { reverseGeocodePoi } from '@/services/api';
import { Ionicons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';

// Web map imports
let MapContainer: any = null;
let TileLayer: any = null;
let LeafletMarker: any = null;
let LeafletPolyline: any = null;
let LeafletPolygon: any = null;
let Popup: any = null;

if (Platform.OS === 'web') {
  // Import Leaflet for web
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const LeafletModule = require('react-leaflet');
    MapContainer = LeafletModule.MapContainer;
    TileLayer = LeafletModule.TileLayer;
    LeafletMarker = LeafletModule.Marker;
    LeafletPolyline = LeafletModule.Polyline;
    LeafletPolygon = LeafletModule.Polygon;
    Popup = LeafletModule.Popup;
  } catch {
    console.log('Leaflet not available');
  }
}

interface MapViewComponentProps {
  origin?: Location | null;
  destination?: Location | null;
  stopovers?: Stopover[];
  route?: Route | null;
  /**
   * Optional polyline (e.g. private vehicle geometry) to render when `route` is not provided.
   * Coordinates are in RN Maps order: { latitude, longitude }.
   */
  polylineCoords?: { latitude: number; longitude: number }[] | null;
  /**
   * Optional multi-polyline rendering (e.g. per-leg private vehicle geometry).
   * When provided, this takes precedence over `polylineCoords`.
   */
  polylines?: {
    coords: { latitude: number; longitude: number }[];
    color?: string;
    width?: number;
    dashed?: boolean;
  }[] | null;
  polylineColor?: string;
  polylineWidth?: number;
  onOriginSelect?: (location: Location) => void;
  onDestinationSelect?: (location: Location) => void;
  onStopoverSelect?: (location: Location) => void;
  /** If set, the next map tap selects that target without needing to tap the in-map control button. */
  autoSelectMode?: 'origin' | 'destination' | 'stopover' | null;
  showRoute?: boolean;
  /**
   * Shows small markers at segment boundaries (transfer points).
   * Per-segment start/end pin markers are intentionally not rendered to avoid clutter.
   */
  showTransferMarkers?: boolean;
  /**
   * Optional bounds padding used when auto-fitting route geometry.
   * Useful when overlays (e.g., bottom sheets) cover part of the map.
   */
  fitBoundsPadding?: {
    top?: number;
    right?: number;
    bottom?: number;
    left?: number;
  };
  /** Maximum zoom level allowed when auto-fitting bounds (lower = more zoomed out). */
  fitBoundsMaxZoom?: number;
  /** Controls which coverage border to show. */
  boundaryMode?: 'public' | 'private' | 'none';
  /** Hides in-map selection controls (Set Origin/Set Destination/Add Stopover). */
  hideSelectionControls?: boolean;
  /** Optional step markers (e.g., private turn-by-turn instructions) to render on map. */
  instructionMarkers?: {
    coordinate: { latitude: number; longitude: number };
    stepNumber: number;
    title: string;
    subtitle?: string;
    icon?: string;
  }[];
}

const MapViewComponent: React.FC<MapViewComponentProps> = ({
  origin,
  destination,
  stopovers = [],
  route,
  polylineCoords = null,
  polylines = null,
  polylineColor,
  polylineWidth = 5,
  onOriginSelect,
  onDestinationSelect,
  onStopoverSelect,
  autoSelectMode = null,
  showRoute = false,
  showTransferMarkers = true,
  fitBoundsMaxZoom,
  boundaryMode = 'none',
  hideSelectionControls = false,
  instructionMarkers = []
}) => {
  const { colors, isDark } = useThemeMode();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const effectivePolylineColor = polylineColor || colors.primary;

  // Dark-mode basemap: keep it dark, but ensure roads stay visible.
  const baseTileUrl = isDark
    ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
    : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
  const baseTileAttribution = isDark
    ? '© OpenStreetMap contributors © CARTO'
    : '© OpenStreetMap contributors';

  const [selectingOrigin, setSelectingOrigin] = useState<boolean>(false);
  const [selectingDestination, setSelectingDestination] = useState<boolean>(false);
  const [selectingStopover, setSelectingStopover] = useState<boolean>(false);
  const [previewCoords, setPreviewCoords] = useState<{ latitude: number; longitude: number }[] | null>(null);
  const [isResolvingLocation, setIsResolvingLocation] = useState<boolean>(false);
  const [modeBoundaries, setModeBoundaries] = useState<Pick<ModeCoverageBoundaries, 'publicOuter' | 'privateOuter'>>({
    publicOuter: [],
    privateOuter: []
  });
  const [legendVisible, setLegendVisible] = useState<boolean>(
    Platform.OS === 'web' || !!(onOriginSelect || onDestinationSelect)
  );
  const showPinLegend = !!(onOriginSelect || onDestinationSelect);
  const showTransportLegend = !!(route && route.segments.length > 0);
  const canShowLegend = showPinLegend || showTransportLegend;
  const legendPosition: 'top-right' | 'top-center' = showPinLegend && !showTransportLegend
    ? 'top-right'
    : 'top-center';

  const fitPadding = {
    top: 0,
    right: 0,
    bottom: 0,
    left: 0
  };
  const fitMaxZoom = Math.max(1, Math.min(20, Number(fitBoundsMaxZoom ?? 20)));
  // Tighter fit: allow highest zoom (least zoomed out)
  const fitTighterMaxZoom = 20;

  // Allow parent to programmatically arm a selection mode (e.g., pick stopover from map).
  useEffect(() => {
    if (!autoSelectMode) return;
    if (autoSelectMode === 'origin') {
      setSelectingOrigin(true);
      setSelectingDestination(false);
      setSelectingStopover(false);
      return;
    }
    if (autoSelectMode === 'destination') {
      setSelectingDestination(true);
      setSelectingOrigin(false);
      setSelectingStopover(false);
      return;
    }
    if (autoSelectMode === 'stopover') {
      setSelectingStopover(true);
      setSelectingOrigin(false);
      setSelectingDestination(false);
    }
  }, [autoSelectMode]);

  // Fetch preview polyline when origin and destination are set but no computed route
  const originLat = origin?.coordinates?.latitude;
  const originLon = origin?.coordinates?.longitude;
  const destLat = destination?.coordinates?.latitude;
  const destLon = destination?.coordinates?.longitude;
  const hasRoute = !!route;
  const hasPolylineCoords = !!(polylineCoords && polylineCoords.length >= 2);
  const polylinesLen = polylines?.length || 0;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const hasPolylines = !!(polylines && polylines.some((p) => Array.isArray(p?.coords) && p.coords.length >= 2));
      if (
        hasRoute ||
        hasPolylines ||
        hasPolylineCoords ||
        typeof originLat !== 'number' ||
        typeof originLon !== 'number' ||
        typeof destLat !== 'number' ||
        typeof destLon !== 'number'
      ) {
        setPreviewCoords(null);
        return;
      }

      const originPoint = { latitude: originLat, longitude: originLon };
      const destinationPoint = { latitude: destLat, longitude: destLon };
      try {
        const { coords } = await getPreviewPolyline(originPoint, destinationPoint);
        if (!cancelled) {
          setPreviewCoords(coords);
        }
      } catch {
        if (!cancelled) {
          setPreviewCoords([originPoint, destinationPoint]);
        }
      }
    })();
    return () => { cancelled = true; };
  }, [
    originLat,
    originLon,
    destLat,
    destLon,
    hasRoute,
    hasPolylineCoords,
    polylinesLen,
    polylines
  ]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const boundaries = await getCoverageBoundaries();
        if (!cancelled) {
          setModeBoundaries({
            publicOuter: boundaries.publicOuter,
            privateOuter: boundaries.privateOuter
          });
        }
      } catch {
        if (!cancelled) {
          setModeBoundaries({ publicOuter: [], privateOuter: [] });
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const activeBoundaryCoords = useMemo(() => {
    if (boundaryMode === 'public') return modeBoundaries.publicOuter;
    if (boundaryMode === 'private') return modeBoundaries.privateOuter;
    return [] as { latitude: number; longitude: number }[];
  }, [boundaryMode, modeBoundaries.privateOuter, modeBoundaries.publicOuter]);

  const normalizeTransportType = (t?: string) => (t ?? '').trim().toLowerCase();

  const getTransportColorSafe = (t?: string) => {
    const nt = normalizeTransportType(t);
    if (!nt) return '#95a5a6';
    if (nt === 'walk' || nt === 'walking' || nt === 'foot' || nt === 'pedestrian') return getTransportColor(TransportType.WALK);
    if (nt === 'bus') return getTransportColor(TransportType.BUS);
    if (nt === 'jeep' || nt === 'jeepney' || nt === 'modernjeepney' || nt === 'modern_jeepney') return getTransportColor(TransportType.JEEPNEY);
    if (nt === 'uv' || nt === 'uvexpress' || nt === 'uv express' || nt === 'uv_express') return getTransportColor(TransportType.UV_EXPRESS);
    if (nt === 'train' || nt === 'lrt' || nt === 'mrt' || nt === 'pnr') return getTransportColor(TransportType.TRAIN);
    return '#95a5a6';
  };

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
    const lat = c?.latitude;
    const lon = c?.longitude;
    return (
      typeof lat === 'number' &&
      typeof lon === 'number' &&
      Number.isFinite(lat) &&
      Number.isFinite(lon) &&
      lat >= -90 &&
      lat <= 90 &&
      lon >= -180 &&
      lon <= 180 &&
      !(lat === 0 && lon === 0)
    );
  };

  const haversineM = (a: { latitude: number; longitude: number }, b: { latitude: number; longitude: number }) => {
    const R = 6371000;
    const toRad = (x: number) => (x * Math.PI) / 180;
    const dLat = toRad(b.latitude - a.latitude);
    const dLon = toRad(b.longitude - a.longitude);
    const lat1 = toRad(a.latitude);
    const lat2 = toRad(b.latitude);
    const s1 = Math.sin(dLat / 2);
    const s2 = Math.sin(dLon / 2);
    const h = s1 * s1 + Math.cos(lat1) * Math.cos(lat2) * s2 * s2;
    return 2 * R * Math.asin(Math.sqrt(h));
  };

  const polylineLenM = (coords: { latitude: number; longitude: number }[]) => {
    if (!Array.isArray(coords) || coords.length < 2) return 0;
    let total = 0;
    for (let i = 0; i < coords.length - 1; i++) {
      total += haversineM(coords[i], coords[i + 1]);
    }
    return total;
  };

  const computeRenderPaths = (segments: RouteSegment[]) => {
    const segPaths: { latitude: number; longitude: number }[][] = [];
    const connectors: { latitude: number; longitude: number }[][] = [];

    const getPath = (segment: RouteSegment) => {
      let safeGeom = Array.isArray(segment.geometry) ? segment.geometry.filter(isValidCoord) : [];
      const fallback = [segment.origin.coordinates, segment.destination.coordinates].filter(isValidCoord);
      if (safeGeom.length >= 2 && segment.origin?.coordinates && segment.destination?.coordinates) {
        // Find closest index to origin
        let minStartIdx = 0;
        let minStartDist = haversineM(safeGeom[0], segment.origin.coordinates);
        for (let i = 1; i < safeGeom.length; i++) {
          const d = haversineM(safeGeom[i], segment.origin.coordinates);
          if (d < minStartDist) {
            minStartDist = d;
            minStartIdx = i;
          }
        }
        // Find closest index to destination
        let minEndIdx = safeGeom.length - 1;
        let minEndDist = haversineM(safeGeom[safeGeom.length - 1], segment.destination.coordinates);
        for (let i = safeGeom.length - 2; i >= 0; i--) {
          const d = haversineM(safeGeom[i], segment.destination.coordinates);
          if (d < minEndDist) {
            minEndDist = d;
            minEndIdx = i;
          }
        }
        // Ensure indices are in order
        if (minStartIdx < minEndIdx) {
          safeGeom = safeGeom.slice(minStartIdx, minEndIdx + 1);
        } else if (minStartIdx > minEndIdx) {
          safeGeom = safeGeom.slice(minEndIdx, minStartIdx + 1).reverse();
        } else {
          safeGeom = [safeGeom[minStartIdx]];
        }
        // Force start at origin if not close
        if (haversineM(safeGeom[0], segment.origin.coordinates) > 30) {
          safeGeom.unshift(segment.origin.coordinates);
        }
        // Force end at destination if not close
        if (haversineM(safeGeom[safeGeom.length - 1], segment.destination.coordinates) > 30) {
          safeGeom.push(segment.destination.coordinates);
        }
      }
      return safeGeom.length >= 2 ? safeGeom : fallback;
    };

    for (let i = 0; i < segments.length; i++) {
      segPaths.push(getPath(segments[i]));
    }

    // Display-only transfer smoothing:
    // If a transit leg appears to detour to reach the next leg's start (often due to
    // stop placement across the road or missing crosswalk edges), trim the tail and
    // show a straight walk connector.
    for (let i = 0; i < segments.length - 1; i++) {
      const a = segments[i];
      const b = segments[i + 1];
      const aIsWalk = isWalkType(a.transportType);
      const bIsWalk = isWalkType(b.transportType);
      // Apply to all public transport segments (including jeepney)
      if (aIsWalk || bIsWalk) continue;

      const aPath = segPaths[i];
      if (!Array.isArray(aPath) || aPath.length < 6) continue;

      const target = isValidCoord(b.origin.coordinates)
        ? b.origin.coordinates
        : (Array.isArray(b.geometry) ? b.geometry.find(isValidCoord) : null);
      if (!target || !isValidCoord(target)) continue;

      const searchUpto = Math.max(0, aPath.length - 3);
      let bestIdx = -1;
      let bestM = Number.POSITIVE_INFINITY;
      for (let k = 0; k < searchUpto; k++) {
        const d = haversineM(aPath[k], target);
        if (d < bestM) {
          bestM = d;
          bestIdx = k;
        }
      }
      // Make detour trimming more aggressive for jeepney and similar segments
      if (bestIdx < 0 || bestM > 120) continue;

      const tailM = polylineLenM(aPath.slice(bestIdx));
      const directM = haversineM(aPath[bestIdx], target);
      const isShortHop = directM <= 220;
      const isDetour = tailM > Math.max(120, directM * 2.0);
      if (!isShortHop || !isDetour) continue;

      segPaths[i] = aPath.slice(0, bestIdx + 1);
      connectors.push([aPath[bestIdx], target]);
    }

    return { segPaths, connectors };
  };

  const getSegmentBoardCoord = (segment: RouteSegment) => {
    const firstGeom = Array.isArray(segment.geometry) && segment.geometry.length > 0 ? segment.geometry[0] : null;
    return isValidCoord(firstGeom) ? firstGeom : segment.origin?.coordinates;
  };

  const getSegmentAlightCoord = (segment: RouteSegment) => {
    const lastGeom = Array.isArray(segment.geometry) && segment.geometry.length > 0 ? segment.geometry[segment.geometry.length - 1] : null;
    return isValidCoord(lastGeom) ? lastGeom : segment.destination?.coordinates;
  };

  const getSegmentEndpointMarkers = () => {
    if (!route || !Array.isArray(route.segments) || route.segments.length === 0) {
      return [] as { id: string; coordinate: { latitude: number; longitude: number }; modeType?: string; kind: 'start' | 'end' }[];
    }
    const out: { id: string; coordinate: { latitude: number; longitude: number }; modeType?: string; kind: 'start' | 'end' }[] = [];
    for (const seg of route.segments) {
      const s = getSegmentBoardCoord(seg);
      const e = getSegmentAlightCoord(seg);
      if (!isValidCoord(s) || !isValidCoord(e)) continue;

      // If start and end collapse to the same coordinate, render one marker.
      const same = coordKey(s) === coordKey(e);
      out.push({ id: `${seg.id}-start`, coordinate: s, modeType: seg.transportType, kind: 'start' });
      if (!same) {
        out.push({ id: `${seg.id}-end`, coordinate: e, modeType: seg.transportType, kind: 'end' });
      }
    }
    return out;
  };

  const coordKey = (c: { latitude: number; longitude: number }) => `${c.latitude.toFixed(6)},${c.longitude.toFixed(6)}`;

  const offsetCoord = (c: { latitude: number; longitude: number }, dLon: number, dLat: number) => ({
    latitude: c.latitude + dLat,
    longitude: c.longitude + dLon
  });

  const getTransferMarkers = () => {
    type TransferMarker = {
      id: string;
      coordinate: { latitude: number; longitude: number };
      number: number;
      kind: 'start' | 'alight' | 'board';
      fromType: string;
      toType: string;
      modeType: string;
      locationName: string;
      nextLocationName?: string;
      note?: string;
    };

    if (!route || !Array.isArray(route.segments) || route.segments.length < 1) {
      return [] as TransferMarker[];
    }

    const segs = route.segments.filter(Boolean);

    const transferIndices: number[] = [];
    let lastNonWalkIdx: number | null = null;
    let sawWalkSinceLastNonWalk = false;
    for (let i = 0; i < segs.length; i++) {
      const seg = segs[i];
      const isWalk = isWalkType(seg.transportType);
      if (isWalk) {
        if (lastNonWalkIdx !== null) sawWalkSinceLastNonWalk = true;
        continue;
      }
      if (lastNonWalkIdx === null) {
        lastNonWalkIdx = i;
        sawWalkSinceLastNonWalk = false;
        continue;
      }

      const prev = segs[lastNonWalkIdx];
      const cur = seg;
      const prevType = normalizeTransportType(prev.transportType);
      const curType = normalizeTransportType(cur.transportType);

      if (prevType && curType && (prevType !== curType || sawWalkSinceLastNonWalk)) {
        transferIndices.push(i);
      }
      lastNonWalkIdx = i;
      sawWalkSinceLastNonWalk = false;
    }

    const markers: TransferMarker[] = [];
    const seen = new Set<string>();
    let transferNo = 0;

    const firstNonWalkIdx = segs.findIndex((seg) => !isWalkType(seg.transportType));
    const firstNonWalk = firstNonWalkIdx >= 0 ? segs[firstNonWalkIdx] : null;

    if (isValidCoord(origin?.coordinates)) {
      const modeLabel = firstNonWalk ? getModeLabel(firstNonWalk.transportType) : 'Walk';
      markers.push({
        id: 'start-origin',
        coordinate: origin.coordinates,
        number: 0,
        kind: 'start',
        fromType: 'walk',
        toType: firstNonWalk ? normalizeTransportType(firstNonWalk.transportType) : 'walk',
        modeType: 'walk',
        locationName: origin.name || 'Starting point',
        nextLocationName: firstNonWalk?.origin?.name,
        note: firstNonWalk ? `Walk to this location, then board ${modeLabel}.` : 'Walk to this location.',
      });
    }

    if (firstNonWalk) {
      const firstBoardCoord = getSegmentBoardCoord(firstNonWalk);
      if (isValidCoord(firstBoardCoord)) {
        transferNo = 1;
        const modeLabel = getModeLabel(firstNonWalk.transportType);
        markers.push({
          id: 'transfer-1-board-first',
          coordinate: firstBoardCoord,
          number: transferNo,
          kind: 'board',
          fromType: firstNonWalkIdx > 0 ? 'walk' : normalizeTransportType(firstNonWalk.transportType),
          toType: normalizeTransportType(firstNonWalk.transportType),
          modeType: normalizeTransportType(firstNonWalk.transportType),
          locationName: firstNonWalk.origin?.name || 'Boarding point',
          nextLocationName: firstNonWalk.destination?.name,
          note: firstNonWalkIdx > 0 ? `Walk to this location, then board ${modeLabel}.` : `Board ${modeLabel} here.`,
        });
      }
    }

    for (const idx of transferIndices) {
      const cur = segs[idx];
      let j = idx - 1;
      while (j >= 0 && isWalkType(segs[j].transportType)) j -= 1;
      if (j < 0) continue;
      const prev = segs[j];

      const prevType = normalizeTransportType(prev.transportType);
      const curType = normalizeTransportType(cur.transportType);
      if (!prevType || !curType) continue;

      const alight = getSegmentAlightCoord(prev);
      const board = getSegmentBoardCoord(cur);
      if (!isValidCoord(alight) || !isValidCoord(board)) continue;

      transferNo += 1;

      const alightKey = coordKey(alight);
      const boardKey = coordKey(board);
      const same = alightKey === boardKey;

      const alightCoord = same ? offsetCoord(alight, -0.00012, 0) : alight;
      const boardCoord = same ? offsetCoord(board, 0.00012, 0) : board;

      const seenKey = same ? `${alightKey}|${boardKey}|${transferNo}` : `${alightKey}|${boardKey}`;
      if (seen.has(seenKey)) continue;
      seen.add(seenKey);

      markers.push({
        id: `transfer-${transferNo}-alight-${idx}`,
        coordinate: alightCoord,
        number: transferNo,
        kind: 'alight',
        fromType: prevType,
        toType: curType,
        modeType: prevType,
        locationName: prev.destination?.name || cur.origin?.name || 'Transfer point',
        nextLocationName: cur.origin?.name || undefined,
        note: `Alight from ${getModeLabel(prev.transportType)} here.`,
      });
      markers.push({
        id: `transfer-${transferNo}-board-${idx}`,
        coordinate: boardCoord,
        number: transferNo,
        kind: 'board',
        fromType: prevType,
        toType: curType,
        modeType: curType,
        locationName: cur.origin?.name || prev.destination?.name || 'Transfer point',
        nextLocationName: cur.destination?.name || undefined,
        note: `Board ${getModeLabel(cur.transportType)} here.`,
      });
    }

    return markers;
  };

  

  // Always fit to origin and destination pins if both are set
  const effectiveFitPoints: [number, number][] = (origin && destination)
    ? [
        [origin.coordinates.latitude, origin.coordinates.longitude],
        [destination.coordinates.latitude, destination.coordinates.longitude]
      ]
    : [];

  const customPolylineConnectors: {
    coords: { latitude: number; longitude: number }[];
    color: string;
    width: number;
    dashed: boolean;
  }[] = (() => {
    if (route || !showRoute || !polylines || polylines.length < 2) return [];

    const validLegs = polylines
      .map((p) => (Array.isArray(p?.coords) ? p.coords.filter(isValidCoord) : []))
      .filter((coords) => coords.length >= 2);

    if (validLegs.length < 2) return [];

    const connectors: {
      coords: { latitude: number; longitude: number }[];
      color: string;
      width: number;
      dashed: boolean;
    }[] = [];

    for (let i = 0; i < validLegs.length - 1; i++) {
      const currentEnd = validLegs[i][validLegs[i].length - 1];
      const nextStart = validLegs[i + 1][0];
      const gapM = haversineM(currentEnd, nextStart);
      if (gapM > 15 && gapM <= 5000) {
        connectors.push({
          coords: [currentEnd, nextStart],
          color: colors.textSecondary,
          width: 4,
          dashed: true
        });
      }
    }

    return connectors;
  })();

  let webReturn: React.ReactElement | null = null;

  // Web map implementation with Leaflet
  if (Platform.OS === 'web' && MapContainer) {
    const center: [number, number] = [
      origin?.coordinates.latitude || destination?.coordinates.latitude || 14.5995,
      origin?.coordinates.longitude || destination?.coordinates.longitude || 120.9842
    ];

    let makeTransferIcon: ((n: number, kind: 'start' | 'alight' | 'board', modeType: string) => any) | null = null;
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const L = require('leaflet');
      makeTransferIcon = (n: number, kind: 'start' | 'alight' | 'board', modeType: string) => {
        const bg = kind === 'alight' ? '#2980b9' : kind === 'board' ? '#27ae60' : '#f39c12';
        const label = kind === 'alight' ? 'A' : kind === 'board' ? 'B' : 'S';
        const icon = kind === 'start' ? '🚶' : getModeEmoji(modeType);
        const numText = kind === 'start' ? '' : String(n);
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
                <span>${numText}</span>
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

    let makeInstructionIcon: ((n: number) => any) | null = null;
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const L = require('leaflet');
      makeInstructionIcon = (n: number) => {
        return L.divIcon({
          className: '',
          html: `
            <div style="
              width: 24px;
              height: 24px;
              border-radius: 12px;
              background: #f39c12;
              border: 2px solid #fff;
              color: #fff;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 11px;
              font-weight: 800;
              box-shadow: 0 2px 6px rgba(0,0,0,0.35);
              line-height: 1;
            ">${n}</div>
          `,
          iconSize: [24, 24],
          iconAnchor: [12, 12]
        });
      };
    } catch {
      makeInstructionIcon = null;
    }

    let makeEndDotIcon: ((modeType?: string) => any) | null = null;
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const L = require('leaflet');
      makeEndDotIcon = (modeType?: string) => {
        const bg = getTransportColorSafe(modeType);
        return L.divIcon({
          className: '',
          html: `
            <div style="
              width: 12px;
              height: 12px;
              border-radius: 999px;
              background: ${bg};
              border: 2px solid #fff;
              box-shadow: 0 2px 6px rgba(0,0,0,0.35);
            "></div>
          `,
          iconSize: [12, 12],
          iconAnchor: [6, 6]
        });
      };
    } catch {
      makeEndDotIcon = null;
    }

    let makeEndpointIcon: ((modeType?: string) => any) | null = null;
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const L = require('leaflet');
      makeEndpointIcon = (modeType?: string) => {
        const bg = getTransportColorSafe(modeType);
        const icon = getModeEmoji(modeType);
        return L.divIcon({
          className: '',
          html: `
            <div style="
              width: 22px;
              height: 22px;
              border-radius: 7px;
              background: ${bg};
              border: 2px solid #fff;
              color: #fff;
              display: flex;
              align-items: center;
              justify-content: center;
              box-shadow: 0 2px 6px rgba(0,0,0,0.35);
              line-height: 1;
              font-size: 12px;
            ">${icon}</div>
          `,
          iconSize: [22, 22],
          iconAnchor: [11, 11],
        });
      };
    } catch {
      makeEndpointIcon = null;
    }

    webReturn = (
      <View style={styles.container}>
        <div
          className={isDark ? 'map-dim-tiles' : undefined}
          style={{ width: '100%', height: '100%' }}
        >
          {isDark && (
            <style>{`
              /* Dark-mode basemap tuning: keep dark, lift roads/lines */
              .map-dim-tiles .leaflet-container .base-tiles {
                filter: brightness(3.00) contrast(1.22) saturate(1.10);
              }
            `}</style>
          )}
          <MapContainer
            center={center}
            zoom={13}
            bounds={effectiveFitPoints.length >= 2 ? effectiveFitPoints : undefined}
            boundsOptions={
              effectiveFitPoints.length >= 2
                ? {
                    paddingTopLeft: [fitPadding.left, fitPadding.top],
                    paddingBottomRight: [fitPadding.right, fitPadding.bottom],
                    maxZoom: fitTighterMaxZoom
                  }
                : undefined
            }
            style={{ width: '100%', height: '100%' }}
          >
            {/* Base OSM map */}
            <TileLayer
              attribution={
                isDark
                  ? '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                  : '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              }
              url={baseTileUrl}
              className="base-tiles"
            />
            {/* Railway overlay via OpenRailwayMap */}
            <TileLayer
              attribution='&copy; OpenRailwayMap contributors'
              url="https://{s}.tiles.openrailwaymap.org/standard/{z}/{x}/{y}.png"
              className="rail-overlay"
            />
            {origin && (
              <LeafletMarker position={[origin.coordinates.latitude, origin.coordinates.longitude]}>
              </LeafletMarker>
            )}
            {destination && (
              <LeafletMarker position={[destination.coordinates.latitude, destination.coordinates.longitude]}>
              </LeafletMarker>
            )}
            {stopovers.map((stopover) => (
              <LeafletMarker
                key={stopover.id}
                position={[stopover.location.coordinates.latitude, stopover.location.coordinates.longitude]}
              >
              </LeafletMarker>
            ))}

            {/* Transfer markers (A=alight, B=board; tap for instructions) */}
            {showTransferMarkers && getTransferMarkers().map((m) => (
              <LeafletMarker
                key={m.id}
                position={[m.coordinate.latitude, m.coordinate.longitude]}
                icon={makeTransferIcon ? makeTransferIcon(m.number, m.kind, m.modeType) : undefined}
              >
                {Popup && (
                  <Popup>
                    <div style={{ minWidth: 180 }}>
                      <div style={{ fontWeight: 700, marginBottom: 4 }}>
                        {m.kind === 'start' ? 'Start' : `Transfer ${m.number} ${m.kind === 'alight' ? '(Alight)' : '(Board)'}`}
                      </div>
                      <div style={{ marginBottom: 6 }}>
                        Location: {m.locationName}
                      </div>
                      {m.kind !== 'start' && (
                        <div style={{ marginBottom: 6 }}>
                          {getModeEmoji(m.fromType)} {getModeLabel(m.fromType)} → {getModeEmoji(m.toType)} {getModeLabel(m.toType)}
                        </div>
                      )}
                      <div>{m.note || (m.kind === 'alight'
                        ? `Alight from ${getModeLabel(m.fromType)} here.`
                        : m.kind === 'board'
                          ? `Board ${getModeLabel(m.toType)} here.`
                          : 'Walk to this location.')}</div>
                      {!!m.nextLocationName && (
                        <div style={{ marginTop: 6 }}>
                          {m.kind === 'alight'
                            ? `Next board point: ${m.nextLocationName}`
                            : `Next stop: ${m.nextLocationName}`}
                        </div>
                      )}
                    </div>
                  </Popup>
                )}
              </LeafletMarker>
            ))}

            {Array.isArray(instructionMarkers) && instructionMarkers.map((m) => (
              <LeafletMarker
                key={`instruction-${m.stepNumber}-${m.title}`}
                position={[m.coordinate.latitude, m.coordinate.longitude]}
                icon={makeInstructionIcon ? makeInstructionIcon(m.stepNumber) : undefined}
              >
                {Popup && (
                  <Popup>
                    <div style={{ minWidth: 180 }}>
                      <div style={{ fontWeight: 700, marginBottom: 4 }}>
                        Step {m.stepNumber}
                      </div>
                      <div style={{ marginBottom: 6 }}>{m.title}</div>
                      {!!m.subtitle && <div>{m.subtitle}</div>}
                    </div>
                  </Popup>
                )}
              </LeafletMarker>
            ))}

            {activeBoundaryCoords.length >= 4 && (
              <LeafletPolygon
                key={`coverage-${boundaryMode}`}
                positions={activeBoundaryCoords.map((coord) => [coord.latitude, coord.longitude] as [number, number])}
                pathOptions={{
                  color: colors.accent,
                  weight: 4,
                  fillColor: colors.background,
                  fillOpacity: 0,
                  opacity: 0.98
                }}
              />
            )}

            {/* Render route segments with different colors */}
            {route && (() => {
              const { segPaths, connectors } = computeRenderPaths(route.segments);

              // Add endpoint connectors for pinned origin/destination when the computed route
              // starts/ends at nearby stops but doesn't include an explicit walk leg.
              const segPaths2 = segPaths.map((p) => (Array.isArray(p) ? [...p] : p));
              const allConnectors = [...connectors];

              try {
                const firstIdx = 0;
                const lastIdx = Math.max(0, segPaths2.length - 1);

                const originPt = origin?.coordinates;
                const destPt = destination?.coordinates;

                // Origin: simple dashed connector to route start (if not already walking).
                if (
                  originPt &&
                  segPaths2.length > 0 &&
                  !isWalkType(route.segments[firstIdx]?.transportType) &&
                  Array.isArray(segPaths2[firstIdx]) &&
                  segPaths2[firstIdx].length >= 2
                ) {
                  const startPt = segPaths2[firstIdx][0];
                  const d0 = haversineM(originPt, startPt);
                  if (d0 > 25 && d0 <= 1200) {
                    allConnectors.push([originPt, startPt]);
                  }
                }

                // Destination: if the last transit leg detours just to reach the exact stop,
                // trim it at the closest approach and add a short dashed walk connector.
                if (
                  destPt &&
                  segPaths2.length > 0 &&
                  !isWalkType(route.segments[lastIdx]?.transportType) &&
                  Array.isArray(segPaths2[lastIdx]) &&
                  segPaths2[lastIdx].length >= 6
                ) {
                  const path = segPaths2[lastIdx];
                  const searchUpto = Math.max(0, path.length - 3);
                  let bestIdx = -1;
                  let bestM = Number.POSITIVE_INFINITY;
                  for (let k = 0; k < searchUpto; k++) {
                    const d = haversineM(path[k], destPt);
                    if (d < bestM) {
                      bestM = d;
                      bestIdx = k;
                    }
                  }

                  if (bestIdx >= 0 && bestM <= 80) {
                    const tailM = polylineLenM(path.slice(bestIdx));
                    const directM = haversineM(path[bestIdx], destPt);
                    const isShortHop = directM <= 160;
                    const isDetour = tailM > Math.max(220, directM * 3.0);
                    if (isShortHop && isDetour) {
                      segPaths2[lastIdx] = path.slice(0, bestIdx + 1);
                      allConnectors.push([path[bestIdx], destPt]);
                    }
                  } else if (Array.isArray(segPaths2[lastIdx]) && segPaths2[lastIdx].length >= 2) {
                    const endPt = segPaths2[lastIdx][segPaths2[lastIdx].length - 1];
                    const d1 = haversineM(endPt, destPt);
                    if (d1 > 25 && d1 <= 1200) {
                      allConnectors.push([endPt, destPt]);
                    }
                  }
                }
              } catch {
                // best-effort only
              }

              return (
                <>
                  {segPaths2.map((path, idx) => {
                    if (!Array.isArray(path) || path.length < 2) return null;

                    const segment = route.segments[idx];
                    const isWalk = isWalkType(segment.transportType);
                    const positions = path.map(coord => [coord.latitude, coord.longitude] as [number, number]);

                    return (
                      <LeafletPolyline
                        key={`${route.id}-${segment.id}-${idx}`}
                        positions={positions}
                        color={isWalk ? colors.textSecondary : getTransportColor(segment.transportType)}
                        weight={isWalk ? 4 : 5}
                        dashArray={isWalk ? '3 10' : undefined}
                      />
                    );
                  })}

                  {allConnectors.map((conn, idx) => {
                    if (!Array.isArray(conn) || conn.length < 2) return null;
                    const positions = conn.map(c => [c.latitude, c.longitude] as [number, number]);
                    return (
                      <LeafletPolyline
                        key={`transfer-connector-${idx}`}
                        positions={positions}
                        color={colors.textSecondary}
                        weight={4}
                        dashArray={'3 10'}
                      />
                    );
                  })}
                </>
              );
            })()}

            {/* Segment start/end badges (mode icons) */}
            {route && getSegmentEndpointMarkers().map((m) => (
              <LeafletMarker
                key={`seg-pt-${m.id}`}
                position={[m.coordinate.latitude, m.coordinate.longitude]}
                icon={makeEndpointIcon ? makeEndpointIcon(m.modeType) : (makeEndDotIcon ? makeEndDotIcon(m.modeType) : undefined)}
              />
            ))}

            {/* Render custom polyline (e.g. private vehicle) when no Route object is provided */}
            {showRoute && !route && polylines && polylines.length > 0 && (
              <>
                {polylines
                  .filter((p) => Array.isArray(p?.coords) && p.coords.length >= 2)
                  .map((p, idx) => (
                    <LeafletPolyline
                      key={`custom-leg-${idx}`}
                      positions={p.coords.map((c) => [c.latitude, c.longitude] as [number, number])}
                      color={p.color || effectivePolylineColor}
                      weight={typeof p.width === 'number' ? p.width : polylineWidth}
                      dashArray={p.dashed ? '3 10' : undefined}
                    />
                  ))}

                {customPolylineConnectors.map((conn, idx) => (
                  <LeafletPolyline
                    key={`custom-connector-${idx}`}
                    positions={conn.coords.map((c) => [c.latitude, c.longitude] as [number, number])}
                    color={conn.color}
                    weight={conn.width}
                    dashArray={conn.dashed ? '3 10' : undefined}
                  />
                ))}
              </>
            )}

            {/* Render single custom polyline (legacy) when no Route object is provided */}
            {showRoute && !route && (!polylines || polylines.length === 0) && polylineCoords && polylineCoords.length >= 2 && (
              <LeafletPolyline
                positions={polylineCoords.map(c => [c.latitude, c.longitude] as [number, number])}
                color={effectivePolylineColor}
                weight={polylineWidth}
              />
            )}
          </MapContainer>
        </div>

        {/* Legend toggle + legend for web Leaflet */}
        {canShowLegend && (
          <View style={styles.legendToggleWrap}>
            <TouchableOpacity
              style={styles.legendToggleButton}
              onPress={() => setLegendVisible((v) => !v)}
              activeOpacity={0.8}
            >
              <Ionicons name={legendVisible ? 'close' : 'information-circle-outline'} size={16} color={colors.textPrimary} />
              <Text style={styles.legendToggleText}>{legendVisible ? 'Hide legend' : 'Show legend'}</Text>
            </TouchableOpacity>
          </View>
        )}

        {legendVisible && (
          <MapLegend
            showPinLegend={showPinLegend}
            showTransportTypes={showTransportLegend}
            showTransferLegend={showTransportLegend}
            position={legendPosition}
          />
        )}
      </View>
    );
  }

  // Web fallback if Leaflet not available
  if (Platform.OS === 'web' && !webReturn) {
    webReturn = (
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

  // Native (Android/iOS) map: Leaflet inside WebView using OpenStreetMap tiles (no Google Maps key required).
  // This keeps route results identical; only the basemap rendering changes.
  const webViewRef = useRef<WebView>(null);

  type LeafletPolyline = { coords: [number, number][]; color: string; weight: number; dashArray?: string };
  type LeafletPolygon = { coords: [number, number][]; color: string; fillColor: string; fillOpacity: number; weight: number; dashArray?: string };
  type LeafletMarker = {
    lat: number;
    lon: number;
    kind: 'origin' | 'destination' | 'stopover' | 'transfer' | 'instruction';
    label?: string;
    color?: string;
    popupTitle?: string;
    popupLines?: string[];
  };

  const nativeLeafletPayload = useMemo(() => {
    const markers: LeafletMarker[] = [];
    const polylinesOut: LeafletPolyline[] = [];
    const polygonsOut: LeafletPolygon[] = [];

    if (activeBoundaryCoords.length >= 4) {
      polygonsOut.push({
        coords: activeBoundaryCoords.map((c) => [c.latitude, c.longitude]),
        color: colors.accent,
        fillColor: colors.background,
        fillOpacity: 0,
        weight: 4
      });
    }

    if (origin) {
      markers.push({ lat: origin.coordinates.latitude, lon: origin.coordinates.longitude, kind: 'origin', color: '#27ae60' });
    }
    if (destination) {
      markers.push({ lat: destination.coordinates.latitude, lon: destination.coordinates.longitude, kind: 'destination', color: '#e74c3c' });
    }
    for (const s of stopovers) {
      markers.push({ lat: s.location.coordinates.latitude, lon: s.location.coordinates.longitude, kind: 'stopover', color: '#2980b9' });
    }

    if (showTransferMarkers) {
      try {
        for (const m of getTransferMarkers()) {
          const transferLabel = m.kind === 'start' ? 'S' : `${m.number}${m.kind === 'alight' ? 'A' : 'B'}`;
          const transferColor = m.kind === 'alight' ? '#2980b9' : m.kind === 'board' ? '#27ae60' : '#f39c12';
          const popupTitle = m.kind === 'start' ? 'Start' : `Transfer ${m.number} ${m.kind === 'alight' ? '(Alight)' : '(Board)'}`;
          markers.push({
            lat: m.coordinate.latitude,
            lon: m.coordinate.longitude,
            kind: 'transfer',
            label: transferLabel,
            color: transferColor,
            popupTitle,
            popupLines: [
              `Location: ${m.locationName}`,
              ...(m.kind !== 'start'
                ? [`${getModeEmoji(m.fromType)} ${getModeLabel(m.fromType)} -> ${getModeEmoji(m.toType)} ${getModeLabel(m.toType)}`]
                : []),
              m.note || (m.kind === 'alight'
                ? `Alight from ${getModeLabel(m.fromType)} here.`
                : m.kind === 'board'
                  ? `Board ${getModeLabel(m.toType)} here.`
                  : 'Walk to this location.'),
              ...(m.nextLocationName
                ? [m.kind === 'alight' ? `Next board point: ${m.nextLocationName}` : `Next stop: ${m.nextLocationName}`]
                : []),
            ],
          });
        }
      } catch {
        // best-effort only
      }
    }

    if (Array.isArray(instructionMarkers) && instructionMarkers.length > 0) {
      for (const m of instructionMarkers) {
        if (!m?.coordinate || !isValidCoord(m.coordinate)) continue;
        markers.push({
          lat: m.coordinate.latitude,
          lon: m.coordinate.longitude,
          kind: 'instruction',
          label: `${m.stepNumber}`,
          color: '#f39c12',
          popupTitle: `Step ${m.stepNumber}`,
          popupLines: [m.title, ...(m.subtitle ? [m.subtitle] : [])],
        });
      }
    }

    // Route polylines (public transport)
    if (route) {
      const { segPaths, connectors } = computeRenderPaths(route.segments);
      const segPaths2 = segPaths.map((p) => (Array.isArray(p) ? [...p] : p));
      const allConnectors = [...connectors];

      // Match the same connector/detour-trimming logic used by the native react-native-maps renderer.
      try {
        const firstIdx = 0;
        const lastIdx = Math.max(0, segPaths2.length - 1);
        const originPt = origin?.coordinates;
        const destPt = destination?.coordinates;

        if (
          originPt &&
          segPaths2.length > 0 &&
          !isWalkType(route.segments[firstIdx]?.transportType) &&
          Array.isArray(segPaths2[firstIdx]) &&
          segPaths2[firstIdx].length >= 2
        ) {
          const startPt = segPaths2[firstIdx][0];
          const d0 = haversineM(originPt, startPt);
          if (d0 > 25 && d0 <= 1200) {
            allConnectors.push([originPt, startPt]);
          }
        }

        if (
          destPt &&
          segPaths2.length > 0 &&
          !isWalkType(route.segments[lastIdx]?.transportType) &&
          Array.isArray(segPaths2[lastIdx]) &&
          segPaths2[lastIdx].length >= 6
        ) {
          const path = segPaths2[lastIdx];
          const searchUpto = Math.max(0, path.length - 3);
          let bestIdx = -1;
          let bestM = Number.POSITIVE_INFINITY;
          for (let k = 0; k < searchUpto; k++) {
            const d = haversineM(path[k], destPt);
            if (d < bestM) {
              bestM = d;
              bestIdx = k;
            }
          }

          if (bestIdx >= 0 && bestM <= 80) {
            const tailM = polylineLenM(path.slice(bestIdx));
            const directM = haversineM(path[bestIdx], destPt);
            const isShortHop = directM <= 160;
            const isDetour = tailM > Math.max(220, directM * 3.0);
            if (isShortHop && isDetour) {
              segPaths2[lastIdx] = path.slice(0, bestIdx + 1);
              allConnectors.push([path[bestIdx], destPt]);
            }
          } else if (Array.isArray(segPaths2[lastIdx]) && segPaths2[lastIdx].length >= 2) {
            const endPt = segPaths2[lastIdx][segPaths2[lastIdx].length - 1];
            const d1 = haversineM(endPt, destPt);
            if (d1 > 25 && d1 <= 1200) {
              allConnectors.push([endPt, destPt]);
            }
          }
        }
      } catch {
        // best-effort only
      }

      segPaths2.forEach((pathCoordinates, index) => {
        if (!Array.isArray(pathCoordinates) || pathCoordinates.length < 2) return;
        const segment = route.segments[index];
        const isWalk = isWalkType(segment.transportType);
        polylinesOut.push({
          coords: pathCoordinates.map((c) => [c.latitude, c.longitude]),
          color: isWalk ? colors.textSecondary : getTransportColor(segment.transportType),
          weight: isWalk ? 4 : 5,
          dashArray: isWalk ? '3 10' : undefined
        });
      });

      for (const conn of allConnectors) {
        if (!Array.isArray(conn) || conn.length < 2) continue;
        polylinesOut.push({
          coords: conn.map((c) => [c.latitude, c.longitude]),
          color: colors.textSecondary,
          weight: 4,
          dashArray: '3 10'
        });
      }
    }

    // Private vehicle / custom polylines
    if (!route && showRoute && polylines && polylines.length > 0) {
      for (const p of polylines) {
        if (!Array.isArray(p?.coords) || p.coords.length < 2) continue;
        polylinesOut.push({
          coords: p.coords.map((c) => [c.latitude, c.longitude]),
          color: p.color || effectivePolylineColor,
          weight: typeof p.width === 'number' ? p.width : polylineWidth,
          dashArray: p.dashed ? '4 8' : undefined
        });
      }

      for (const conn of customPolylineConnectors) {
        if (!Array.isArray(conn?.coords) || conn.coords.length < 2) continue;
        polylinesOut.push({
          coords: conn.coords.map((c) => [c.latitude, c.longitude]),
          color: conn.color,
          weight: conn.width,
          dashArray: conn.dashed ? '4 8' : undefined
        });
      }
    }

    if (!route && showRoute && (!polylines || polylines.length === 0) && polylineCoords && polylineCoords.length >= 2) {
      polylinesOut.push({
        coords: polylineCoords.map((c) => [c.latitude, c.longitude]),
        color: effectivePolylineColor,
        weight: polylineWidth
      });
    }

    if (
      !route &&
      showRoute &&
      (!polylines || polylines.length === 0) &&
      (!polylineCoords || polylineCoords.length < 2) &&
      origin &&
      destination &&
      previewCoords &&
      previewCoords.length >= 2
    ) {
      polylinesOut.push({
        coords: previewCoords.map((c) => [c.latitude, c.longitude]),
        color: effectivePolylineColor,
        weight: 5
      });
    }

    const centerLat = origin?.coordinates.latitude || destination?.coordinates.latitude || 14.5995;
    const centerLon = origin?.coordinates.longitude || destination?.coordinates.longitude || 120.9842;

    return {
      center: { lat: centerLat, lon: centerLon, zoom: 13 },
      markers,
      polygons: polygonsOut,
      polylines: polylinesOut,
      fit_points: effectiveFitPoints
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    origin,
    destination,
    stopovers,
    route,
    polylines,
    polylineCoords,
    effectivePolylineColor,
    polylineWidth,
    showRoute,
    showTransferMarkers,
    activeBoundaryCoords,
    previewCoords,
    customPolylineConnectors,
    instructionMarkers,
    effectiveFitPoints,
    colors.accent,
    colors.background,
    colors.textSecondary
  ]);

  const nativeLeafletHtml = useMemo(() => {
    const dataJson = JSON.stringify(nativeLeafletPayload).replace(/</g, '\\u003c');
    return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
    <style>
      html, body, #map { height: 100%; width: 100%; margin: 0; padding: 0; }
      :root { color-scheme: light; }
      ${isDark ? `.base-tiles { filter: brightness(3.00) contrast(1.22) saturate(1.10); }` : ''}
      .transfer-badge {
        width: 26px;
        height: 26px;
        border-radius: 13px;
        border: 2px solid #fff;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #fff;
        font-weight: 800;
        font-family: -apple-system, system-ui, Segoe UI, Roboto, Helvetica, Arial;
        box-shadow: 0 2px 6px rgba(0,0,0,0.35);
        font-size: 11px;
      }
      .instruction-badge {
        width: 26px;
        height: 26px;
        border-radius: 13px;
        border: 2px solid #fff;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #fff;
        font-weight: 800;
        font-family: -apple-system, system-ui, Segoe UI, Roboto, Helvetica, Arial;
        box-shadow: 0 2px 6px rgba(0,0,0,0.35);
        font-size: 11px;
        background: #f39c12;
      }
    </style>
  </head>
  <body>
    <div id="map"></div>
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
    <script>
      const INITIAL = ${dataJson};
      const map = L.map('map', { zoomControl: false, attributionControl: false }).setView([INITIAL.center.lat, INITIAL.center.lon], INITIAL.center.zoom || 13);

      L.tileLayer('${baseTileUrl}', {
        maxZoom: 19,
        attribution: '${baseTileAttribution}',
        className: 'base-tiles'
      }).addTo(map);

      const layer = L.layerGroup().addTo(map);

      function clearLayer() {
        layer.clearLayers();
      }

      function addMarker(m) {
        function esc(v) {
          return String(v ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
        }

        if ((m.kind === 'transfer' || m.kind === 'instruction') && m.label) {
          const badgeClass = m.kind === 'instruction' ? 'instruction-badge' : 'transfer-badge';
          const icon = L.divIcon({
            className: '',
            html:
              '<div class="' + badgeClass + '" style="background:' +
              (m.color || (m.kind === 'instruction' ? '#f39c12' : '#2980b9')) +
              ';">' +
              (m.label || '') +
              '</div>',
            iconSize: [26, 26],
            iconAnchor: [13, 13]
          });
          const marker = L.marker([m.lat, m.lon], { icon }).addTo(layer);
          if (m.popupTitle || (Array.isArray(m.popupLines) && m.popupLines.length > 0)) {
            const title = m.popupTitle ? '<div style="font-weight:700;margin-bottom:6px;">' + esc(m.popupTitle) + '</div>' : '';
            const lines = (Array.isArray(m.popupLines) ? m.popupLines : [])
              .map((line) => '<div style="margin-bottom:4px;">' + esc(line) + '</div>')
              .join('');
            marker.bindPopup('<div style="min-width:180px;">' + title + lines + '</div>');
          }
          return;
        }

        const color = m.color || (m.kind === 'origin' ? '#27ae60' : m.kind === 'destination' ? '#e74c3c' : '#2980b9');
        L.circleMarker([m.lat, m.lon], {
          radius: 7,
          color: '#fff',
          weight: 2,
          fillColor: color,
          fillOpacity: 1
        }).addTo(layer);
      }

      function addPolyline(p) {
        if (!Array.isArray(p.coords) || p.coords.length < 2) return;
        const opts = {
          color: p.color || '#3498db',
          weight: typeof p.weight === 'number' ? p.weight : 5,
          lineCap: 'round',
          lineJoin: 'round'
        };
        if (p.dashArray) {
          opts.dashArray = p.dashArray;
        }
        L.polyline(p.coords, opts).addTo(layer);
      }

      function addPolygon(p) {
        if (!Array.isArray(p.coords) || p.coords.length < 4) return;
        const opts = {
          color: p.color || '#8e9aa7',
          weight: typeof p.weight === 'number' ? p.weight : 2,
          fillColor: p.fillColor || '#ffffff',
          fillOpacity: typeof p.fillOpacity === 'number' ? p.fillOpacity : 0.05
        };
        if (p.dashArray) {
          opts.dashArray = p.dashArray;
        }
        L.polygon(p.coords, opts).addTo(layer);
      }

      function setData(data) {
        clearLayer();
        (data.markers || []).forEach(addMarker);
        (data.polygons || []).forEach(addPolygon);
        (data.polylines || []).forEach(addPolyline);

        // Fit map to visible geometry/markers.
        try {
          const pts = Array.isArray(data.fit_points) && data.fit_points.length >= 2
            ? data.fit_points
            : (() => {
                const fallback = [];
                (data.markers || []).forEach(m => fallback.push([m.lat, m.lon]));
                (data.polylines || []).forEach(p => (p.coords || []).forEach(c => fallback.push(c)));
                return fallback;
              })();
          if (pts.length >= 2) {
            const b = L.latLngBounds(pts);
            map.fitBounds(b, {
              paddingTopLeft: [${fitPadding.left}, ${fitPadding.top}],
              paddingBottomRight: [${fitPadding.right}, ${fitPadding.bottom}],
              maxZoom: ${fitMaxZoom}
            });
          } else if (pts.length === 1) {
            map.setView(pts[0], data.center.zoom || 14);
          }
        } catch {}
      }

      setData(INITIAL);
      setTimeout(() => { try { map.invalidateSize(); } catch {} }, 50);

      map.on('click', (e) => {
        try {
          window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'mapClick', lat: e.latlng.lat, lon: e.latlng.lng }));
        } catch {}
      });
    </script>
  </body>
</html>`;
  }, [
    baseTileAttribution,
    baseTileUrl,
    fitPadding.bottom,
    fitPadding.left,
    fitPadding.right,
    fitPadding.top,
    fitMaxZoom,
    isDark,
    nativeLeafletPayload
  ]);

  const handleLeafletMessage = async (event: any) => {
    try {
      const msg = JSON.parse(event?.nativeEvent?.data || '{}');
      if (msg?.type !== 'mapClick') return;
      const coordinate = { latitude: Number(msg.lat), longitude: Number(msg.lon) };
      if (!isFinite(coordinate.latitude) || !isFinite(coordinate.longitude)) return;

      const buildLocation = async (): Promise<Location> => {
        const fallbackName = `Location at ${coordinate.latitude.toFixed(4)}, ${coordinate.longitude.toFixed(4)}`;
        const resolved = await reverseGeocodePoi(coordinate.latitude, coordinate.longitude);
        return {
          name: resolved?.name || fallbackName,
          coordinates: coordinate,
          address: resolved?.address || 'Selected from map'
        };
      };

      if (selectingOrigin && onOriginSelect) {
        setSelectingOrigin(false);
        setIsResolvingLocation(true);
        try {
          const location = await buildLocation();
          onOriginSelect(location);
        } finally {
          setIsResolvingLocation(false);
        }
        return;
      }
      if (selectingDestination && onDestinationSelect) {
        setSelectingDestination(false);
        setIsResolvingLocation(true);
        try {
          const location = await buildLocation();
          onDestinationSelect(location);
        } finally {
          setIsResolvingLocation(false);
        }
        return;
      }
      if (selectingStopover && onStopoverSelect) {
        setSelectingStopover(false);
        setIsResolvingLocation(true);
        try {
          const location = await buildLocation();
          onStopoverSelect(location);
        } finally {
          setIsResolvingLocation(false);
        }
      }
    } catch {
      // ignore
      setIsResolvingLocation(false);
    }
  };

  if (webReturn) {
    return webReturn;
  }

  return (
    <View style={styles.container}>
      <WebView
        ref={webViewRef}
        style={styles.map}
        originWhitelist={['*']}
        source={{ html: nativeLeafletHtml }}
        onMessage={handleLeafletMessage}
        javaScriptEnabled
        domStorageEnabled
      />

      {/* Legend toggle (hidden by default; tap to show) */}
      {canShowLegend && (
        <View style={styles.legendToggleWrap}>
          <TouchableOpacity
            style={styles.legendToggleButton}
            onPress={() => setLegendVisible(v => !v)}
            activeOpacity={0.8}
          >
            <Ionicons name={legendVisible ? 'close' : 'information-circle-outline'} size={16} color={colors.textPrimary} />
            <Text style={styles.legendToggleText}>{legendVisible ? 'Hide legend' : 'Show legend'}</Text>
          </TouchableOpacity>
        </View>
      )}

      {!hideSelectionControls && (onOriginSelect || onDestinationSelect || onStopoverSelect) && (
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
                setSelectingStopover(false);
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
                setSelectingStopover(false);
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

          {onStopoverSelect && (
            <TouchableOpacity
              style={[
                styles.controlButton,
                selectingStopover && styles.controlButtonActive
              ]}
              onPress={() => {
                setSelectingStopover(!selectingStopover);
                setSelectingOrigin(false);
                setSelectingDestination(false);
              }}
            >
              <Text style={{ fontSize: 20, color: selectingStopover ? '#fff' : '#2980b9' }}>*</Text>
              <Text
                style={[
                  styles.controlText,
                  selectingStopover && styles.controlTextActive
                ]}
              >
                Add Stopover
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {(selectingOrigin || selectingDestination || selectingStopover) && (
        <View style={styles.instructionBanner}>
          <Text style={styles.instructionText}>
            Tap on the map to select {selectingOrigin ? 'origin' : selectingDestination ? 'destination' : 'stopover'}
          </Text>
        </View>
      )}

      {isResolvingLocation && (
        <View style={styles.resolvingBanner}>
          <Text style={styles.resolvingText}>Resolving location...</Text>
        </View>
      )}

      {/* Show legend only when toggled */}
      {legendVisible && (
        <MapLegend
          showPinLegend={showPinLegend}
          showTransportTypes={showTransportLegend}
          showTransferLegend={showTransportLegend}
          position={legendPosition}
        />
      )}
    </View>
  );
};

const createStyles = (colors: ThemeColors) => StyleSheet.create({
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
    backgroundColor: colors.white,
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
  segmentEndpointBadge: {
    width: 22,
    height: 22,
    borderRadius: 7,
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
        elevation: 4,
      },
      web: {
        boxShadow: '0 2px 4px rgba(0,0,0,0.25)',
      },
    }),
  },
  controlButtonActive: {
    backgroundColor: colors.primary
  },
  controlText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textPrimary,
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
    backgroundColor: colors.primary,
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
    backgroundColor: colors.white,
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
    color: colors.textPrimary
  },
  instructionText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center'
  },
  resolvingBanner: {
    position: 'absolute',
    top: 16,
    left: 16,
    right: 16,
    alignSelf: 'center',
    backgroundColor: colors.white,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
      },
      android: {
        elevation: 4,
      },
      web: {
        boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
      },
    }),
  },
  resolvingText: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  webMapContainer: {
    flex: 1,
    backgroundColor: colors.background,
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
    color: colors.textPrimary,
    marginTop: 16,
  },
  webMapSubtext: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 8,
    textAlign: 'center',
  },
  webLocationText: {
    fontSize: 14,
    color: colors.textPrimary,
    marginTop: 8,
    textAlign: 'center',
  },
  transferDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.textPrimary,
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
    color: colors.textPrimary,
    marginBottom: 4
  },
  transferCalloutRow: {
    fontSize: 12,
    color: colors.textPrimary,
    marginBottom: 2
  }
});

export default MapViewComponent;

