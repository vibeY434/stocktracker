import type { MarketState } from '@/types';
import { MARKET_SCHEDULES } from './constants';

type MarketSchedule = (typeof MARKET_SCHEDULES)[keyof typeof MARKET_SCHEDULES];

function getTimeInTimezone(timezone: string, date: Date = new Date()): Date {
  const options: Intl.DateTimeFormatOptions = {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  };

  const parts = new Intl.DateTimeFormat('en-US', options).formatToParts(date);
  const get = (type: string) => parts.find(p => p.type === type)?.value || '00';

  return new Date(
    parseInt(get('year')),
    parseInt(get('month')) - 1,
    parseInt(get('day')),
    parseInt(get('hour')),
    parseInt(get('minute')),
    parseInt(get('second'))
  );
}

function parseTime(timeStr: string): { hours: number; minutes: number } {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return { hours, minutes };
}

function getMinutesSinceMidnight(date: Date): number {
  return date.getHours() * 60 + date.getMinutes();
}

export function isMarketOpen(exchange: string, now: Date = new Date()): boolean {
  const normalizedExchange = exchange.toUpperCase();
  const schedule = MARKET_SCHEDULES[normalizedExchange as keyof typeof MARKET_SCHEDULES];

  if (!schedule) {
    // Unknown exchange, assume closed
    return false;
  }

  const exchangeTime = getTimeInTimezone(schedule.timezone, now);
  const day = exchangeTime.getDay();

  // Weekend check
  if (day === 0 || day === 6) {
    return false;
  }

  const currentMinutes = getMinutesSinceMidnight(exchangeTime);
  const { hours: openH, minutes: openM } = parseTime(schedule.openTime);
  const { hours: closeH, minutes: closeM } = parseTime(schedule.closeTime);

  const openMinutes = openH * 60 + openM;
  const closeMinutes = closeH * 60 + closeM;

  return currentMinutes >= openMinutes && currentMinutes < closeMinutes;
}

export function getMarketState(exchange: string, now: Date = new Date()): MarketState {
  const normalizedExchange = exchange.toUpperCase();
  const schedule = MARKET_SCHEDULES[normalizedExchange as keyof typeof MARKET_SCHEDULES] as MarketSchedule | undefined;

  if (!schedule) {
    return 'CLOSED';
  }

  const exchangeTime = getTimeInTimezone(schedule.timezone, now);
  const day = exchangeTime.getDay();

  // Weekend check
  if (day === 0 || day === 6) {
    return 'CLOSED';
  }

  const currentMinutes = getMinutesSinceMidnight(exchangeTime);
  const { hours: openH, minutes: openM } = parseTime(schedule.openTime);
  const { hours: closeH, minutes: closeM } = parseTime(schedule.closeTime);

  const openMinutes = openH * 60 + openM;
  const closeMinutes = closeH * 60 + closeM;

  // Check for US markets with extended hours
  if ('preMarketOpen' in schedule && 'afterHoursClose' in schedule) {
    const { hours: preH, minutes: preM } = parseTime(schedule.preMarketOpen);
    const { hours: afterH, minutes: afterM } = parseTime(schedule.afterHoursClose);
    const preMinutes = preH * 60 + preM;
    const afterMinutes = afterH * 60 + afterM;

    if (currentMinutes >= preMinutes && currentMinutes < openMinutes) {
      return 'PRE';
    }
    if (currentMinutes >= closeMinutes && currentMinutes < afterMinutes) {
      return 'POST';
    }
  }

  if (currentMinutes >= openMinutes && currentMinutes < closeMinutes) {
    return 'REGULAR';
  }

  return 'CLOSED';
}

export function getTimeUntilMarketEvent(
  exchange: string,
  now: Date = new Date()
): { event: 'open' | 'close'; minutes: number } | null {
  const normalizedExchange = exchange.toUpperCase();
  const schedule = MARKET_SCHEDULES[normalizedExchange as keyof typeof MARKET_SCHEDULES];

  if (!schedule) {
    return null;
  }

  const exchangeTime = getTimeInTimezone(schedule.timezone, now);
  const day = exchangeTime.getDay();

  // Weekend
  if (day === 0 || day === 6) {
    return null;
  }

  const currentMinutes = getMinutesSinceMidnight(exchangeTime);
  const { hours: openH, minutes: openM } = parseTime(schedule.openTime);
  const { hours: closeH, minutes: closeM } = parseTime(schedule.closeTime);

  const openMinutes = openH * 60 + openM;
  const closeMinutes = closeH * 60 + closeM;

  if (currentMinutes < openMinutes) {
    return { event: 'open', minutes: openMinutes - currentMinutes };
  }

  if (currentMinutes >= openMinutes && currentMinutes < closeMinutes) {
    return { event: 'close', minutes: closeMinutes - currentMinutes };
  }

  return null;
}

export function formatCountdown(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  if (hours > 0) {
    return `${hours}h ${mins}m`;
  }
  return `${mins}m`;
}
