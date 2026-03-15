import { useState, useEffect, useCallback } from 'react';
import { Route, Location, PublicTransportPreference } from '@/types';
import { fetchRoutes } from '@services/api';
import { rankRoutes } from '@services/fuzzyLogic';
import { applyGreedyFilter } from '@services/greedyAlgorithm';

interface UseRoutesResult {
  routes: Route[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Route-loading hook used by screens that need public-transport options.
 * It fetches backend routes, applies greedy filtering, then ranks results.
 */
export const useRoutes = (
  origin: Location | null,
  destination: Location | null,
  preference: PublicTransportPreference
): UseRoutesResult => {
  const [routes, setRoutes] = useState<Route[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAndProcessRoutes = useCallback(async () => {
    // Pipeline: fetch raw routes -> prune invalid options -> rank best candidates.
    // This keeps route ranking deterministic before components consume the hook output.
    if (!origin || !destination) {
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Fetch routes from API
      const fetchedRoutes = await fetchRoutes(origin, destination, preference);

      // Apply greedy algorithm to filter invalid routes
      const filteredRoutes = applyGreedyFilter(fetchedRoutes, {
        maxBudget: 500, // Example constraint
        maxTime: 180,   // Example constraint
        maxTransfers: 3 // Example constraint
      });

      // Rank routes using fuzzy logic
      const rankedRoutes = rankRoutes(filteredRoutes, preference);

      setRoutes(rankedRoutes);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch routes');
    } finally {
      setIsLoading(false);
    }
  }, [origin, destination, preference]);

  useEffect(() => {
    void fetchAndProcessRoutes();
  }, [fetchAndProcessRoutes]);

  return {
    // Expose stable API for screen-level consumption.
    routes,
    isLoading,
    error,
    refetch: fetchAndProcessRoutes
  };
};
