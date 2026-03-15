import { PublicTransportPreference, Route, FuzzyScore } from '@/types';

type PreferenceValue =
  | PublicTransportPreference
  | 'balanced'
  | 'lowest_fare'
  | 'shortest_time'
  | 'fewest_transfers';

const DEFAULT_MODES = ['walk', 'jeepney', 'bus', 'lrt', 'mrt', 'pnr', 'uv_express'];

/**
 * Normalizes a segment transport label to backend scoring mode names.
 * This keeps train-family labels (LRT/MRT/PNR) comparable with backend rules.
 */
const toModeString = (route: Route, idx: number): string => {
  const seg = route.segments[idx];
  const raw = String(seg.mode || seg.transportType || '').toLowerCase();
  if (raw === 'train') {
    const name = String(seg.routeName || '').toLowerCase();
    if (name.includes('lrt')) return 'lrt';
    if (name.includes('mrt')) return 'mrt';
    if (name.includes('pnr')) return 'pnr';
  }
  return raw;
};

/**
 * Scores how well the route's non-walk legs match the preferred transport modes.
 * Returns 1.0 for full match, ~0.3 when there is no match.
 */
const computeModeScore = (route: Route, preferredModesLower: string[]): number => {
  const transportModes = route.segments
    .map((_seg, idx) => toModeString(route, idx))
    .filter((m) => !!m && m !== 'walk');

  if (!transportModes.length) return 1.0;

  const matches = transportModes.filter((m) => preferredModesLower.includes(m)).length;
  const ratio = matches / transportModes.length;
  return 0.3 + (ratio * 0.7);
};

/**
 * Converts walking distance burden into a normalized score.
 * Short total walking and short single walk legs receive higher scores.
 */
const computeWalkScore = (route: Route): number => {
  const walkDistances = route.segments
    .map((seg, idx) => {
      const mode = toModeString(route, idx);
      return mode === 'walk' ? Number(seg.distance || 0) : 0;
    })
    .filter((d) => Number.isFinite(d) && d > 0);

  const totalWalkKm = walkDistances.reduce((sum, d) => sum + d, 0);
  const maxWalkLegKm = walkDistances.length ? Math.max(...walkDistances) : 0;

  const walkTotalRefKm = 1.5;
  const walkLegRefKm = 0.8;
  const wt = Math.max(0, Math.min(1, 1 - (totalWalkKm / walkTotalRefKm) ** 1.2));
  const wl = Math.max(0, Math.min(1, 1 - (maxWalkLegKm / walkLegRefKm) ** 1.2));
  return (0.6 * wt) + (0.4 * wl);
};

/**
 * Rewards routes that avoid frequent mode switching and avoid mixed road modes.
 * Matches backend continuity behavior used for final fuzzy weighting.
 */
const computeContinuityScore = (route: Route, preferredModesLower: string[]): number => {
  const seq = route.segments
    .map((_seg, idx) => toModeString(route, idx))
    .filter((m) => !!m && m !== 'walk');

  if (!seq.length) return 1.0;

  let switches = 0;
  for (let i = 0; i < seq.length - 1; i += 1) {
    if (seq[i] !== seq[i + 1]) {
      switches += 1;
    }
  }

  const roadModes = new Set(['jeepney', 'bus', 'uv_express']);
  const roadUsed = seq.filter((m) => roadModes.has(m));
  const roadUnique = new Set(roadUsed);

  const allowBus = preferredModesLower.includes('bus');
  const allowJeep = preferredModesLower.includes('jeepney');
  const mixedPujPub = allowBus && allowJeep && roadUnique.has('bus') && roadUnique.has('jeepney');

  const switchScore = 1 / (1 + switches);
  let roadScore = 1.0;
  if (roadUnique.size === 2) {
    roadScore = 0.75;
  } else if (roadUnique.size >= 3) {
    roadScore = 0.55;
  }

  let continuity = (0.55 * switchScore) + (0.45 * roadScore);
  if (mixedPujPub) {
    continuity *= 0.85;
  }
  return continuity;
};

/**
 * Computes base scalar scores for fare, travel time, and transfers.
 * Lower fare/time/transfers produce higher normalized values.
 */
const computeCoreScores = (route: Route) => {
  const fareScore = Math.max(0, 1 - (route.totalFare / 250.0) ** 0.8);
  const timeScore = Math.max(0, 1 - (route.totalTime / 150.0) ** 0.9);
  const transferScore = Math.exp(-0.55 * Math.max(0, Number(route.totalTransfers || 0)));
  return { fareScore, timeScore, transferScore };
};

/**
 * Applies backend-aligned weighted scoring profile by preference mode.
 * This is the single source of truth for frontend fuzzy route scoring.
 */
const computeTotalScore = (
  route: Route,
  preference: PreferenceValue = PublicTransportPreference.BALANCED,
  preferredModes: string[] = DEFAULT_MODES
) => {
  const preferenceKey = String(preference || PublicTransportPreference.BALANCED).toLowerCase();
  const preferredModesLower = (preferredModes?.length ? preferredModes : DEFAULT_MODES)
    .map((m) => String(m || '').toLowerCase());

  const { fareScore, timeScore, transferScore } = computeCoreScores(route);
  const modeScore = computeModeScore(route, preferredModesLower);
  const walkScore = computeWalkScore(route);
  const continuityScore = computeContinuityScore(route, preferredModesLower);

  let totalScore: number;
  // Weights below intentionally mirror backend/app/services/fuzzy_logic.py.
  if (preferenceKey === 'lowest_fare') {
    totalScore =
      (0.53 * fareScore) +
      (0.12 * timeScore) +
      (0.08 * transferScore) +
      (0.14 * modeScore) +
      (0.10 * walkScore) +
      (0.03 * continuityScore);
  } else if (preferenceKey === 'shortest_time') {
    totalScore =
      (0.08 * fareScore) +
      (0.53 * timeScore) +
      (0.12 * transferScore) +
      (0.14 * modeScore) +
      (0.10 * walkScore) +
      (0.03 * continuityScore);
  } else if (preferenceKey === 'fewest_transfers') {
    totalScore =
      (0.12 * fareScore) +
      (0.18 * timeScore) +
      (0.44 * transferScore) +
      (0.14 * modeScore) +
      (0.10 * walkScore) +
      (0.02 * continuityScore);
  } else {
    totalScore =
      (0.20 * fareScore) +
      (0.27 * timeScore) +
      (0.18 * transferScore) +
      (0.19 * modeScore) +
      (0.14 * walkScore) +
      (0.02 * continuityScore);
  }

  return {
    fareScore,
    timeScore,
    transferScore,
    modeScore,
    walkScore,
    continuityScore,
    totalScore
  };
};

/**
 * Calculate fuzzy logic score for a route based on multiple criteria
 */
export const calculateFuzzyScore = (
  route: Route,
  preference: PreferenceValue = PublicTransportPreference.BALANCED,
  preferredModes: string[] = DEFAULT_MODES
): FuzzyScore => {
  // Keep FuzzyScore public shape minimal for existing UI consumers.
  const { fareScore, timeScore, transferScore, totalScore } = computeTotalScore(route, preference, preferredModes);
  return { fareScore, timeScore, transferScore, totalScore };
};

/**
 * Rank routes based on fuzzy scores
 */
export const rankRoutes = (
  routes: Route[],
  preference: PreferenceValue = PublicTransportPreference.BALANCED,
  preferredModes: string[] = DEFAULT_MODES
): Route[] => {
  if (routes.length === 0) return [];

  // Attach updated fuzzy score before sorting.
  const routesWithScores = routes.map(route => {
    const fuzzyScore = calculateFuzzyScore(route, preference, preferredModes);
    return {
      ...route,
      fuzzyScore: fuzzyScore.totalScore
    };
  });

  // Keep explicit preferences deterministic: primary metric first, fuzzy as tie-breaker.
  return routesWithScores.sort((a, b) => {
    const fuzzyDelta = Number(b.fuzzyScore || 0) - Number(a.fuzzyScore || 0);
    const timeDelta = Number(a.totalTime || 0) - Number(b.totalTime || 0);
    const fareDelta = Number(a.totalFare || 0) - Number(b.totalFare || 0);
    const transferDelta = Number(a.totalTransfers || 0) - Number(b.totalTransfers || 0);
    const preferenceKey = String(preference || PublicTransportPreference.BALANCED).toLowerCase();

    if (preferenceKey === 'shortest_time') {
      return timeDelta || transferDelta || fareDelta || fuzzyDelta;
    }
    if (preferenceKey === 'lowest_fare') {
      return fareDelta || timeDelta || transferDelta || fuzzyDelta;
    }
    if (preferenceKey === 'fewest_transfers') {
      return transferDelta || timeDelta || fareDelta || fuzzyDelta;
    }

    return fuzzyDelta || timeDelta || fareDelta || transferDelta;
  });
};

/**
 * Apply preference weights to fuzzy scoring
 */
export const applyPreferenceWeights = (
  route: Route,
  preference: 'lowest_fare' | 'shortest_time' | 'fewest_transfers',
  _maxFare: number,
  _maxTime: number,
  _maxTransfers: number,
  preferredModes: string[] = DEFAULT_MODES
): number => {
  // Compatibility wrapper for older call sites.
  return computeTotalScore(route, preference, preferredModes).totalScore;
};
