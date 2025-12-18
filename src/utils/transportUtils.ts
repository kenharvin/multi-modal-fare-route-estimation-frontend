import { TransportType } from '@/types';

export interface TransportStyle {
  color: string;
  icon: string;
  label: string;
}

export const getTransportStyle = (type: TransportType): TransportStyle => {
  switch (type) {
    case TransportType.JEEPNEY:
      return {
        color: '#e74c3c', // Red
        icon: '🚐',
        label: 'Jeepney'
      };
    case TransportType.BUS:
      return {
        color: '#3498db', // Blue
        icon: '🚌',
        label: 'Bus'
      };
    case TransportType.UV_EXPRESS:
      return {
        color: '#9b59b6', // Purple
        icon: '🚐',
        label: 'UV Express'
      };
    case TransportType.TRAIN:
      return {
        color: '#2ecc71', // Green
        icon: '🚆',
        label: 'Train'
      };
    default:
      return {
        color: '#95a5a6', // Gray
        icon: '🚗',
        label: 'Transport'
      };
  }
};

export const getTransportColor = (type: TransportType): string => {
  return getTransportStyle(type).color;
};

export const getTransportIcon = (type: TransportType): string => {
  return getTransportStyle(type).icon;
};

export const getTransportLabel = (type: TransportType): string => {
  return getTransportStyle(type).label;
};
