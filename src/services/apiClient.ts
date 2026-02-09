import axios from 'axios';
import { Platform } from 'react-native';
// @ts-ignore: expo-constants available in Expo env
import Constants from 'expo-constants';

const resolveApiBaseUrl = (): string => {
  let base = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:8000';
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

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: ROUTE_TIMEOUT_MS,
  headers: {
    'Content-Type': 'application/json'
  }
});

export const formatAxiosError = (err: any): string => {
  try {
    const isAxios = !!err?.isAxiosError;
    const status = err?.response?.status;
    const detail = err?.response?.data?.detail || err?.response?.data?.error || err?.response?.data?.message;
    const code = err?.code;
    const msg = err?.message;
    const url = err?.config?.url;
    const baseURL = err?.config?.baseURL;

    const parts: string[] = [];
    if (isAxios) parts.push('AxiosError');
    if (status) parts.push(`HTTP ${status}`);
    if (code) parts.push(String(code));
    if (msg) parts.push(String(msg));
    if (detail) parts.push(`detail=${String(detail)}`);
    if (baseURL || url) parts.push(`at ${(baseURL || API_BASE_URL) + (url || '')}`);
    return parts.join(' | ') || String(err);
  } catch {
    return String(err);
  }
};

// Add request interceptor for logging
apiClient.interceptors.request.use(
  (config) => {
    console.log('API Request:', config.method?.toUpperCase(), config.url);
    console.log('Base URL:', API_BASE_URL);

    return config;
  },
  (error) => Promise.reject(error)
);

// Add response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
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
    return Promise.reject(error);
  }
);
