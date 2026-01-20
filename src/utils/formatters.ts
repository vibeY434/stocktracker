import { format } from 'date-fns';

export function formatCurrency(
  value: number,
  currency: string = 'USD',
  minimumFractionDigits: number = 2
): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatNumber(
  value: number,
  options?: Intl.NumberFormatOptions
): string {
  return new Intl.NumberFormat('en-US', options).format(value);
}

export function formatPercent(value: number, showSign: boolean = true): string {
  const sign = showSign && value > 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}%`;
}

export function formatLargeNumber(value: number): string {
  if (value >= 1e12) {
    return `${(value / 1e12).toFixed(2)}T`;
  }
  if (value >= 1e9) {
    return `${(value / 1e9).toFixed(2)}B`;
  }
  if (value >= 1e6) {
    return `${(value / 1e6).toFixed(2)}M`;
  }
  if (value >= 1e3) {
    return `${(value / 1e3).toFixed(2)}K`;
  }
  return value.toFixed(2);
}

export function formatVolume(value: number): string {
  return formatLargeNumber(value);
}

export function formatTimestamp(date: Date, includeTime: boolean = true): string {
  if (includeTime) {
    return format(date, 'MMM d, yyyy HH:mm');
  }
  return format(date, 'MMM d, yyyy');
}

export function formatMarketCap(value: number | null): string {
  if (value === null) return 'N/A';
  return formatLargeNumber(value);
}
