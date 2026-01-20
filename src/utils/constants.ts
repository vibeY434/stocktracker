export const API_BASE_URL = '/api';

export const CACHE_TIMES = {
  QUOTE: 30 * 1000, // 30 seconds
  FUNDAMENTALS: 5 * 60 * 1000, // 5 minutes
  COMPANY_INFO: 60 * 60 * 1000, // 1 hour
  FX_RATE: 5 * 60 * 1000, // 5 minutes
  HISTORICAL: 60 * 60 * 1000, // 1 hour
} as const;

export const MARKET_SCHEDULES = {
  NYSE: {
    exchange: 'NYSE',
    timezone: 'America/New_York',
    openTime: '09:30',
    closeTime: '16:00',
    preMarketOpen: '04:00',
    afterHoursClose: '20:00',
  },
  NASDAQ: {
    exchange: 'NASDAQ',
    timezone: 'America/New_York',
    openTime: '09:30',
    closeTime: '16:00',
    preMarketOpen: '04:00',
    afterHoursClose: '20:00',
  },
  XETRA: {
    exchange: 'XETRA',
    timezone: 'Europe/Berlin',
    openTime: '09:00',
    closeTime: '17:30',
  },
  GETTEX: {
    exchange: 'gettex',
    timezone: 'Europe/Berlin',
    openTime: '08:00',
    closeTime: '22:00',
  },
} as const;

export const US_EXCHANGES = ['NYSE', 'NASDAQ', 'NYQ', 'NMS', 'NGM', 'NCM'];
export const EU_EXCHANGES = ['XETRA', 'GER', 'FRA', 'STU', 'MUN', 'HAM', 'DUS', 'BER'];
