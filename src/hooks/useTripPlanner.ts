import { useState } from 'react';
import { TripPlan, Route, Location } from '@/types';
import { generateId } from '@utils/helpers';

interface UseTripPlannerResult {
  tripPlan: TripPlan | null;
  addRoute: (route: Route) => void;
  removeRoute: (routeId: string) => void;
  updateDestinations: (destinations: Location[]) => void;
  clearTripPlan: () => void;
}

export const useTripPlanner = (initialRoute?: Route): UseTripPlannerResult => {
  const [tripPlan, setTripPlan] = useState<TripPlan | null>(() => {
    if (!initialRoute) return null;

    return {
      id: generateId(),
      routes: [initialRoute],
      totalFare: initialRoute.totalFare,
      totalTime: initialRoute.totalTime,
      totalDistance: initialRoute.totalDistance,
      destinations: [
        initialRoute.segments[0].origin,
        initialRoute.segments[initialRoute.segments.length - 1].destination
      ]
    };
  });

  const addRoute = (route: Route) => {
    if (!tripPlan) return;
    const newDestination = route.segments[route.segments.length - 1].destination;

    setTripPlan({
      ...tripPlan,
      routes: [...tripPlan.routes, route],
      totalFare: tripPlan.totalFare + route.totalFare,
      totalTime: tripPlan.totalTime + route.totalTime,
      totalDistance: tripPlan.totalDistance + route.totalDistance,
      destinations: [...tripPlan.destinations, newDestination]
    });
  };

  const removeRoute = (routeId: string) => {
    if (!tripPlan) return;

    const routeIndex = tripPlan.routes.findIndex(r => r.id === routeId);
    if (routeIndex === -1) return;

    const newRoutes = tripPlan.routes.filter(r => r.id !== routeId);
    const removedRoute = tripPlan.routes[routeIndex];

    // Recalculate totals
    const newTotalFare = tripPlan.totalFare - removedRoute.totalFare;
    const newTotalTime = tripPlan.totalTime - removedRoute.totalTime;
    const newTotalDistance = tripPlan.totalDistance - removedRoute.totalDistance;

    // Update destinations
    const newDestinations = [...tripPlan.destinations];
    newDestinations.splice(routeIndex + 1, 1);

    setTripPlan({
      ...tripPlan,
      routes: newRoutes,
      totalFare: newTotalFare,
      totalTime: newTotalTime,
      totalDistance: newTotalDistance,
      destinations: newDestinations
    });
  };

  const updateDestinations = (destinations: Location[]) => {
    if (!tripPlan) return;

    setTripPlan({
      ...tripPlan,
      destinations
    });
  };

  const clearTripPlan = () => {
    setTripPlan(null);
  };

  return {
    tripPlan,
    addRoute,
    removeRoute,
    updateDestinations,
    clearTripPlan
  };
};
