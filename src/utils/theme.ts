import type { ColorSchemeName } from 'react-native';

const BRAND_BLUE = '#0B3A82';

export const lightColors = {
  // Primary colors
  primary: BRAND_BLUE,
  primaryDark: '#082A5D',
  primaryLight: '#D6E4FF',
  
  // Secondary colors
  secondary: '#2ecc71',
  secondaryDark: '#27ae60',
  secondaryLight: '#e8f5e9',
  
  // Accent colors
  accent: '#f39c12',
  accentDark: '#e67e22',
  accentLight: '#fff3cd',
  
  // Status colors
  success: '#27ae60',
  warning: '#f39c12',
  error: '#e74c3c',
  info: BRAND_BLUE,
  
  // Neutral colors
  white: '#ffffff',
  black: '#000000',
  gray1: '#2c3e50',
  gray2: '#34495e',
  gray3: '#7f8c8d',
  gray4: '#95a5a6',
  gray5: '#bdc3c7',
  gray6: '#ecf0f1',
  gray7: '#f8f9fa',
  background: '#f5f5f5',
  
  // Transport type colors
  jeepney: '#e74c3c',
  bus: '#3498db',
  uvExpress: '#9b59b6',
  train: '#2ecc71',
  
  // Text colors
  textPrimary: '#2c3e50',
  textSecondary: '#7f8c8d',
  textLight: '#bdc3c7',
  textWhite: '#ffffff'
};

export type ThemeColors = typeof lightColors;

export const darkColors = {
  // Primary colors
  primary: BRAND_BLUE,
  primaryDark: '#082A5D',
  primaryLight: '#0A1E3D',

  // Secondary colors
  secondary: '#2ecc71',
  secondaryDark: '#1f9d54',
  secondaryLight: '#0f2a1b',

  // Accent colors
  accent: '#f39c12',
  accentDark: '#c9780b',
  accentLight: '#2b1f0a',

  // Status colors
  success: '#27ae60',
  warning: '#f39c12',
  error: '#e74c3c',
  info: BRAND_BLUE,

  // Neutral colors
  white: '#141a22',
  black: '#000000',
  gray1: '#eaf2f8',
  gray2: '#cfd9e3',
  gray3: '#a9b7c6',
  gray4: '#728195',
  gray5: '#3a4656',
  gray6: '#243041',
  gray7: '#0f141b',
  background: '#0b0f14',

  // Transport type colors
  jeepney: '#e74c3c',
  bus: '#3498db',
  uvExpress: '#9b59b6',
  train: '#2ecc71',

  // Text colors
  textPrimary: '#eaf2f8',
  textSecondary: '#a9b7c6',
  textLight: '#728195',
  textWhite: '#ffffff'
};

export const getColors = (scheme?: ColorSchemeName | 'light' | 'dark') => {
  const resolved = scheme ?? 'light';
  return resolved === 'dark' ? darkColors : lightColors;
};

// Backwards-compatible default; prefer `getColors()` via ThemeContext for app-controlled theming.
export const colors = lightColors;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48
};

export const fontSize = {
  xs: 10,
  sm: 12,
  md: 14,
  lg: 16,
  xl: 18,
  xxl: 20,
  title: 24,
  heading: 28
};

export const borderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  round: 999
};

export const shadows = {
  small: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3
  },
  large: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5
  }
};
