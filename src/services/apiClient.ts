import axios from 'axios';
import { Platform } from 'react-native';
// @ts-ignore: expo-constants available in Expo env
import Constants from 'expo-constants';

const resolveApiBaseUrl = (): string => {
  const backendTarget = String(process.env.EXPO_PUBLIC_BACKEND_TARGET || 'local')
    .trim()
    .toLowerCase();

  const localBase = String(
    process.env.EXPO_PUBLIC_API_BASE_URL_LOCAL ||
      process.env.EXPO_PUBLIC_API_BASE_URL ||
      'http://localhost:8000'
  )
    .trim()
    .replace(/\/+$/, '');

  const deployedBase = String(process.env.EXPO_PUBLIC_API_BASE_URL_DEPLOYED || '')
    .trim()
    .replace(/\/+$/, '');

  let base =
    backendTarget === 'deployed' && deployedBase.length > 0
      ? deployedBase
      : localBase;

  // If running on device/emulator and base points to localhost, try to infer LAN IP
  if (Platform.OS !== 'web' && /localhost|127\.0\.0\.1/i.test(base)) {
    try {
      // hostUri looks like 192.168.x.x:19000
      const hostUri: string | undefined =
        (Constants?.expoConfig as any)?.hostUri || (Constants as any)?.manifest2?.extra?.expoGo?.developer?.host;
      if (hostUri && hostUri.includes(':')) {
        const host = hostUri.split(':')[0];
        if (/^\d+\.\d+\.\d+\.\d+$/.test(host)) {
          base = `http://${host}:8000`;
        }
      }
    } catch {}
    // Android emulator special-case
    if (Platform.OS === 'android' && /localhost|127\.0\.0\.1/i.test(base)) {
      base = 'http://10.0.2.2:8000';
    }
  }
  return base;
};

export const API_BASE_URL = resolveApiBaseUrl();
export const ROUTE_TIMEOUT_MS = Number(process.env.EXPO_PUBLIC_ROUTE_TIMEOUT_MS || 180000); // 3 minutes default
const API_KEY = process.env.EXPO_PUBLIC_API_KEY;
const ENABLE_API_DEBUG = __DEV__ || String(process.env.EXPO_PUBLIC_DEBUG_NETWORK || '').toLowerCase() === 'true';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: ROUTE_TIMEOUT_MS,
  headers: {
    'Content-Type': 'application/json',
    ...(API_KEY ? { 'X-API-Key': API_KEY } : {})
  }
});

const toFriendlyApiMessage = (err: any): string => {
  const status = Number(err?.response?.status || 0);
  const code = String(err?.code || '').toUpperCase();
  const detailRaw = err?.response?.data?.detail || err?.response?.data?.error || err?.response?.data?.message;
  const detail = String(detailRaw || '').toLowerCase();

  if (status === 401 || status === 403) {
    return 'Request was not authorized. Please try again in a moment.';
  }

  if (status === 404) {
    return 'No route found for the selected locations. Try nearby points.';
  }

  if (status === 429) {
    return 'Too many requests right now. Please wait a bit and try again.';
  }

  if (status >= 500) {
    return 'The server is temporarily unavailable. Please try again shortly.';
  }

  if (code === 'ECONNABORTED' || detail.includes('timeout') || detail.includes('timed out')) {
    return 'Request timed out. Check your connection and try again.';
  }

  if (code === 'ERR_NETWORK') {
    return 'Unable to connect to the server. Check your internet connection.';
  }

  if (detail.includes('no route')) {
    return 'No route found for the selected locations. Try nearby points.';
  }

  if (detail.includes('could not resolve poi') || detail.includes('could not resolve')) {
    return 'Some place names could not be found. Try selecting a location from the map.';
  }

  return 'Something went wrong while processing your request. Please try again.';
};

export const formatAxiosError = (err: any): string => {
  try {
    if (err?.isAxiosError) {
      return toFriendlyApiMessage(err);
    }
    const msg = String(err?.message || err || '').trim();
    return msg || 'Something went wrong while processing your request. Please try again.';
  } catch {
    return 'Something went wrong while processing your request. Please try again.';
  }
};

// Add request interceptor for logging
apiClient.interceptors.request.use(
  (config) => {
    if (ENABLE_API_DEBUG) {
      console.log('API Request:', config.method?.toUpperCase(), config.url);
      console.log('Base URL:', API_BASE_URL);
    }

    // Attach API key if configured (no login required).
    if (API_KEY) {
      config.headers = config.headers || {};
      (config.headers as any)['X-API-Key'] = API_KEY;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Add response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (ENABLE_API_DEBUG) {
      console.error('API Error:', error.response?.data || error.message);
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        config: {
          url: error.config?.url,
          baseURL: error.config?.baseURL,
          method: error.config?.method
        }
      });
    } else {
      console.error('API Error:', formatAxiosError(error));
    }
    return Promise.reject(error);
  }
);
