import axios from 'axios';
import { Location, Coordinates } from '@/types';

const OPENSTREETMAP_API = process.env.OPENSTREETMAP_API_URL || 'https://nominatim.openstreetmap.org';

/**
 * Search for locations using OpenStreetMap Nominatim
 */
export const searchLocation = async (query: string): Promise<Location[]> => {
  try {
    const response = await axios.get(`${OPENSTREETMAP_API}/search`, {
      params: {
        q: query,
        format: 'json',
        limit: 5,
        countrycodes: 'ph' // Limit to Philippines
      },
      headers: {
        'User-Agent': 'MultiModalFareApp/1.0'
      }
    });

    return response.data.map((item: any) => ({
      name: item.display_name,
      coordinates: {
        latitude: parseFloat(item.lat),
        longitude: parseFloat(item.lon)
      },
      address: item.display_name
    }));
  } catch (error) {
    console.error('Error searching location:', error);
    return [];
  }
};

/**
 * Reverse geocode coordinates to get location name
 */
export const reverseGeocode = async (coordinates: Coordinates): Promise<Location | null> => {
  try {
    const response = await axios.get(`${OPENSTREETMAP_API}/reverse`, {
      params: {
        lat: coordinates.latitude,
        lon: coordinates.longitude,
        format: 'json'
      },
      headers: {
        'User-Agent': 'MultiModalFareApp/1.0'
      }
    });

    if (response.data) {
      return {
        name: response.data.display_name,
        coordinates,
        address: response.data.display_name
      };
    }

    return null;
  } catch (error) {
    console.error('Error reverse geocoding:', error);
    return null;
  }
};

/**
 * Calculate distance between two coordinates (Haversine formula)
 */
export const calculateDistance = (
  coords1: Coordinates,
  coords2: Coordinates
): number => {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(coords2.latitude - coords1.latitude);
  const dLon = toRad(coords2.longitude - coords1.longitude);
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(coords1.latitude)) *
    Math.cos(toRad(coords2.latitude)) *
    Math.sin(dLon / 2) *
    Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return distance;
};

const toRad = (degrees: number): number => {
  return degrees * (Math.PI / 180);
};

/**
 * Get route polyline coordinates (simplified version)
 */
export const getRoutePolyline = async (
  origin: Coordinates,
  destination: Coordinates
): Promise<Coordinates[]> => {
  // This would typically call a routing API like OSRM
  // For now, return a simple straight line
  return [origin, destination];
};
