import { Route, FuzzyScore } from '@/types';

/**
 * Calculate fuzzy logic score for a route based on multiple criteria
 */
export const calculateFuzzyScore = (
  route: Route,
  maxFare: number,
  maxTime: number,
  maxTransfers: number
): FuzzyScore => {
  // Normalize values to 0-1 range (lower is better)
  const normalizedFare = 1 - Math.min(route.totalFare / maxFare, 1);
  const normalizedTime = 1 - Math.min(route.totalTime / maxTime, 1);
  const normalizedTransfers = 1 - Math.min(route.totalTransfers / maxTransfers, 1);

  // Apply fuzzy membership functions
  const fareScore = applyFuzzyMembership(normalizedFare);
  const timeScore = applyFuzzyMembership(normalizedTime);
  const transferScore = applyFuzzyMembership(normalizedTransfers);

  // Weighted combination (can be adjusted based on preference)
  const totalScore = (fareScore * 0.4) + (timeScore * 0.4) + (transferScore * 0.2);

  return {
    fareScore,
    timeScore,
    transferScore,
    totalScore
  };
};

/**
 * Apply triangular fuzzy membership function
 */
const applyFuzzyMembership = (value: number): number => {
  // Triangular membership: converts normalized value to fuzzy score
  if (value <= 0) return 0;
  if (value >= 1) return 1;
  
  // Use S-shaped curve for better discrimination
  return 1 / (1 + Math.exp(-5 * (value - 0.5)));
};

/**
 * Rank routes based on fuzzy scores
 */
export const rankRoutes = (routes: Route[]): Route[] => {
  if (routes.length === 0) return [];

  // Find max values for normalization
  const maxFare = Math.max(...routes.map(r => r.totalFare));
  const maxTime = Math.max(...routes.map(r => r.totalTime));
  const maxTransfers = Math.max(...routes.map(r => r.totalTransfers));

  // Calculate fuzzy scores
  const routesWithScores = routes.map(route => {
    const fuzzyScore = calculateFuzzyScore(route, maxFare, maxTime, maxTransfers);
    return {
      ...route,
      fuzzyScore: fuzzyScore.totalScore
    };
  });

  // Sort by fuzzy score (descending)
  return routesWithScores.sort((a, b) => (b.fuzzyScore || 0) - (a.fuzzyScore || 0));
};

/**
 * Apply preference weights to fuzzy scoring
 */
export const applyPreferenceWeights = (
  route: Route,
  preference: 'lowest_fare' | 'shortest_time' | 'fewest_transfers',
  maxFare: number,
  maxTime: number,
  maxTransfers: number
): number => {
  const normalizedFare = 1 - Math.min(route.totalFare / maxFare, 1);
  const normalizedTime = 1 - Math.min(route.totalTime / maxTime, 1);
  const normalizedTransfers = 1 - Math.min(route.totalTransfers / maxTransfers, 1);

  const fareScore = applyFuzzyMembership(normalizedFare);
  const timeScore = applyFuzzyMembership(normalizedTime);
  const transferScore = applyFuzzyMembership(normalizedTransfers);

  // Adjust weights based on preference
  let weights = { fare: 0.33, time: 0.33, transfer: 0.33 };
  
  switch (preference) {
    case 'lowest_fare':
      weights = { fare: 0.6, time: 0.2, transfer: 0.2 };
      break;
    case 'shortest_time':
      weights = { fare: 0.2, time: 0.6, transfer: 0.2 };
      break;
    case 'fewest_transfers':
      weights = { fare: 0.2, time: 0.2, transfer: 0.6 };
      break;
  }

  return (fareScore * weights.fare) + 
         (timeScore * weights.time) + 
         (transferScore * weights.transfer);
};
