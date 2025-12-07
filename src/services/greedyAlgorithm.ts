import { Route, GreedyConstraints } from '@/types';

/**
 * Apply greedy algorithm to filter routes based on constraints
 */
export const applyGreedyFilter = (
  routes: Route[],
  constraints: GreedyConstraints
): Route[] => {
  let filteredRoutes = [...routes];

  // Filter by budget constraint
  if (constraints.maxBudget !== undefined) {
    filteredRoutes = filteredRoutes.filter(
      route => route.totalFare <= constraints.maxBudget!
    );
  }

  // Filter by distance constraint
  if (constraints.maxDistance !== undefined) {
    filteredRoutes = filteredRoutes.filter(
      route => route.totalDistance <= constraints.maxDistance!
    );
  }

  // Filter by time constraint
  if (constraints.maxTime !== undefined) {
    filteredRoutes = filteredRoutes.filter(
      route => route.totalTime <= constraints.maxTime!
    );
  }

  // Filter by transfers constraint
  if (constraints.maxTransfers !== undefined) {
    filteredRoutes = filteredRoutes.filter(
      route => route.totalTransfers <= constraints.maxTransfers!
    );
  }

  return filteredRoutes;
};

/**
 * Select best route using greedy approach
 * Prioritizes routes that meet constraints with minimum cost
 */
export const selectGreedyRoute = (
  routes: Route[],
  constraints: GreedyConstraints,
  priorityMetric: 'fare' | 'time' | 'distance' | 'transfers' = 'fare'
): Route | null => {
  const filteredRoutes = applyGreedyFilter(routes, constraints);

  if (filteredRoutes.length === 0) {
    return null;
  }

  // Sort by priority metric and select the best
  const sortedRoutes = [...filteredRoutes].sort((a, b) => {
    switch (priorityMetric) {
      case 'fare':
        return a.totalFare - b.totalFare;
      case 'time':
        return a.totalTime - b.totalTime;
      case 'distance':
        return a.totalDistance - b.totalDistance;
      case 'transfers':
        return a.totalTransfers - b.totalTransfers;
      default:
        return a.totalFare - b.totalFare;
    }
  });

  return sortedRoutes[0];
};

/**
 * Check if a route satisfies all constraints
 */
export const satisfiesConstraints = (
  route: Route,
  constraints: GreedyConstraints
): boolean => {
  if (constraints.maxBudget !== undefined && route.totalFare > constraints.maxBudget) {
    return false;
  }

  if (constraints.maxDistance !== undefined && route.totalDistance > constraints.maxDistance) {
    return false;
  }

  if (constraints.maxTime !== undefined && route.totalTime > constraints.maxTime) {
    return false;
  }

  if (constraints.maxTransfers !== undefined && route.totalTransfers > constraints.maxTransfers) {
    return false;
  }

  return true;
};

/**
 * Find optimal route combination for multi-destination trip
 * Uses greedy approach to minimize total cost
 */
export const findOptimalMultiDestinationRoute = (
  routeSegments: Route[][],
  constraints: GreedyConstraints
): Route[] | null => {
  if (routeSegments.length === 0) {
    return null;
  }

  const selectedRoutes: Route[] = [];
  let totalFare = 0;
  let totalTime = 0;
  let totalDistance = 0;
  let totalTransfers = 0;

  // Greedily select best route for each segment
  for (const segment of routeSegments) {
    const filteredSegment = segment.filter(route => {
      const projectedFare = totalFare + route.totalFare;
      const projectedTime = totalTime + route.totalTime;
      const projectedDistance = totalDistance + route.totalDistance;
      const projectedTransfers = totalTransfers + route.totalTransfers;

      return (
        (constraints.maxBudget === undefined || projectedFare <= constraints.maxBudget) &&
        (constraints.maxTime === undefined || projectedTime <= constraints.maxTime) &&
        (constraints.maxDistance === undefined || projectedDistance <= constraints.maxDistance) &&
        (constraints.maxTransfers === undefined || projectedTransfers <= constraints.maxTransfers)
      );
    });

    if (filteredSegment.length === 0) {
      return null; // No valid route found for this segment
    }

    // Select cheapest valid route for this segment
    const bestRoute = filteredSegment.reduce((best, current) =>
      current.totalFare < best.totalFare ? current : best
    );

    selectedRoutes.push(bestRoute);
    totalFare += bestRoute.totalFare;
    totalTime += bestRoute.totalTime;
    totalDistance += bestRoute.totalDistance;
    totalTransfers += bestRoute.totalTransfers;
  }

  return selectedRoutes;
};
