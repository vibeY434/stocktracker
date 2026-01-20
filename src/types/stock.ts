export type MarketState = 'PRE' | 'REGULAR' | 'POST' | 'CLOSED';

export interface StockQuote {
  symbol: string;
  price: number;
  currency: 'USD' | 'EUR';
  change: number;
  changePercent: number;
  previousClose: number;
  open: number;
  dayHigh: number;
  dayLow: number;
  volume: number;
  avgVolume30d: number;
  timestamp: Date;
  exchange: string;
  marketState: MarketState;
}

export interface DualQuote {
  us: StockQuote | null;
  eu: StockQuote | null;
  fxRate: FxRate;
}

export interface FxRate {
  rate: number;
  from: string;
  to: string;
  timestamp: Date;
}

export interface HistoricalDataPoint {
  date: Date;
  close: number;
  volume: number;
}

export interface TechnicalSignals {
  sma50: number;
  sma200: number;
  currentPrice: number;
  distanceToSma50Percent: number;
  distanceToSma200Percent: number;
}

export interface SearchResult {
  symbol: string;
  name: string;
  exchange: string;
  exchangeDisplay: string;
  type: 'equity' | 'etf' | 'index' | 'other';
  currency: string;
  region: 'US' | 'EU' | 'OTHER';
}
