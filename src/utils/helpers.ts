/**
 * Format currency to Philippine Peso
 */
export const formatCurrency = (amount: number): string => {
  return `₱${amount.toFixed(2)}`;
};

/**
 * Format time in minutes to readable string
 */
export const formatTime = (minutes: number): string => {
  if (minutes < 60) {
    return `${minutes} min`;
  }
  
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  
  if (mins === 0) {
    return `${hours} hr`;
  }
  
  return `${hours} hr ${mins} min`;
};

export type TimeRangeOptions = {
  variabilityPct?: number;
  minDeltaMin?: number;
  maxDeltaMin?: number;
  roundToMin?: number;
};

export const getTimeRangeMinutes = (
  minutes: number,
  options: TimeRangeOptions = {}
): { min: number; max: number } => {
  const base = Math.max(0, Math.round(Number(minutes) || 0));
  if (base <= 1) return { min: base, max: base };

  const variabilityPct = typeof options.variabilityPct === 'number' ? options.variabilityPct : 0.15;
  const minDeltaMin = typeof options.minDeltaMin === 'number' ? options.minDeltaMin : 2;
  const maxDeltaMin = typeof options.maxDeltaMin === 'number' ? options.maxDeltaMin : 30;
  const roundToMin = typeof options.roundToMin === 'number' ? options.roundToMin : 1;

  const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));
  const roundTo = (n: number, step: number) => {
    const s = step > 0 ? step : 1;
    return Math.round(n / s) * s;
  };

  const rawDelta = Math.round(base * variabilityPct);
  const delta = roundTo(clamp(rawDelta, minDeltaMin, maxDeltaMin), roundToMin);

  const min = Math.max(0, base - delta);
  const max = Math.max(min, base + delta);
  return { min, max };
};

export const formatTimeRange = (minutes: number, options: TimeRangeOptions = {}): string => {
  const { min, max } = getTimeRangeMinutes(minutes, options);
  if (min === max) return formatTime(min);

  if (max < 60) {
    return `${min}–${max} min`;
  }
  return `${formatTime(min)} – ${formatTime(max)}`;
};

export const formatArrivalTimeRange = (minutesFromNow: number, options: TimeRangeOptions = {}): string => {
  const { min, max } = getTimeRangeMinutes(minutesFromNow, options);
  const fmt = (d: Date) => {
    return d.toLocaleTimeString([], {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const now = Date.now();
  const dMin = new Date(now + Math.max(0, min) * 60_000);
  const dMax = new Date(now + Math.max(0, max) * 60_000);
  if (min === max) return fmt(dMin);
  return `${fmt(dMin)}–${fmt(dMax)}`;
};

/**
 * Format distance in kilometers
 */
export const formatDistance = (km: number): string => {
  if (km < 1) {
    return `${(km * 1000).toFixed(0)} m`;
  }
  
  return `${km.toFixed(1)} km`;
};

/**
 * Validate email format
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Generate unique ID
 */
export const generateId = (): string => {
  return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Debounce function
 */
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

/**
 * Check if object is empty
 */
export const isEmpty = (obj: any): boolean => {
  return Object.keys(obj).length === 0;
};

/**
 * Calculate percentage
 */
export const calculatePercentage = (value: number, total: number): number => {
  if (total === 0) return 0;
  return (value / total) * 100;
};
