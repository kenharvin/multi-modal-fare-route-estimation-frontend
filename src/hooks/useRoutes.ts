import { useState, useEffect } from 'react';
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

export const useRoutes = (
  origin: Location | null,
  destination: Location | null,
  preference: PublicTransportPreference
): UseRoutesResult => {
  const [routes, setRoutes] = useState<Route[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAndProcessRoutes = async () => {
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
      const rankedRoutes = rankRoutes(filteredRoutes);

      setRoutes(rankedRoutes);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch routes');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAndProcessRoutes();
  }, [origin, destination, preference]);

  return {
    routes,
    isLoading,
    error,
    refetch: fetchAndProcessRoutes
  };
};
