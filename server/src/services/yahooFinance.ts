import axios, { type AxiosInstance } from 'axios';
import { cache } from './cache.js';

const CACHE_TTL = {
  QUOTE: 30 * 1000, // 30 seconds
  SEARCH: 60 * 1000, // 1 minute
  COMPANY: 60 * 60 * 1000, // 1 hour
  FUNDAMENTALS: 5 * 60 * 1000, // 5 minutes
  HISTORICAL: 60 * 60 * 1000, // 1 hour
};

interface YahooQuoteResponse {
  quoteResponse: {
    result: Array<{
      symbol: string;
      regularMarketPrice: number;
      currency: string;
      regularMarketChange: number;
      regularMarketChangePercent: number;
      regularMarketPreviousClose: number;
      regularMarketOpen: number;
      regularMarketDayHigh: number;
      regularMarketDayLow: number;
      regularMarketVolume: number;
      averageDailyVolume3Month: number;
      regularMarketTime: number;
      fullExchangeName: string;
      marketState: string;
    }>;
  };
}

interface YahooSearchResponse {
  quotes: Array<{
    symbol: string;
    shortname?: string;
    longname?: string;
    exchange: string;
    exchDisp?: string;
    quoteType: string;
    typeDisp?: string;
  }>;
}

interface YahooQuoteSummaryResponse {
  quoteSummary: {
    result: Array<{
      assetProfile?: {
        sector: string;
        industry: string;
        country: string;
      };
      summaryDetail?: {
        marketCap?: { raw: number };
        trailingPE?: { raw: number };
        dividendYield?: { raw: number };
        beta?: { raw: number };
      };
      defaultKeyStatistics?: {
        beta?: { raw: number };
      };
      financialData?: {
        revenueGrowth?: { raw: number };
        freeCashflow?: { raw: number };
      };
    }>;
  };
}

interface YahooChartResponse {
  chart: {
    result: Array<{
      timestamp: number[];
      indicators: {
        quote: Array<{
          close: (number | null)[];
          volume: (number | null)[];
        }>;
      };
    }>;
  };
}

export class YahooFinanceService {
  private client: AxiosInstance;

  constructor() {
    const apiKey = process.env.YAHOO_API_KEY;
    const apiHost = process.env.YAHOO_API_HOST || 'yh-finance.p.rapidapi.com';

    if (!apiKey) {
      console.warn('WARNING: YAHOO_API_KEY not set. API calls will fail.');
    }

    this.client = axios.create({
      baseURL: `https://${apiHost}`,
      headers: {
        'X-RapidAPI-Key': apiKey || '',
        'X-RapidAPI-Host': apiHost,
      },
    });
  }

  async search(query: string) {
    const cacheKey = `search:${query}`;
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    const { data } = await this.client.get<YahooSearchResponse>('/auto-complete', {
      params: { q: query, region: 'US' },
    });

    const results = data.quotes
      .filter((q) => q.quoteType === 'EQUITY' || q.quoteType === 'ETF')
      .map((q) => {
        const isUS = ['NYSE', 'NASDAQ', 'NMS', 'NYQ', 'NGM', 'NCM'].includes(q.exchange);
        const isEU = ['GER', 'FRA', 'XETRA', 'STU', 'MUN'].includes(q.exchange);

        return {
          symbol: q.symbol,
          name: q.longname || q.shortname || q.symbol,
          exchange: q.exchange,
          exchangeDisplay: q.exchDisp || q.exchange,
          type: q.quoteType.toLowerCase() as 'equity' | 'etf',
          currency: isUS ? 'USD' : isEU ? 'EUR' : 'USD',
          region: isUS ? 'US' : isEU ? 'EU' : 'OTHER',
        };
      })
      // Prioritize US listings
      .sort((a, b) => {
        if (a.region === 'US' && b.region !== 'US') return -1;
        if (a.region !== 'US' && b.region === 'US') return 1;
        return 0;
      })
      .slice(0, 10);

    cache.set(cacheKey, results, CACHE_TTL.SEARCH);
    return results;
  }

  async getQuote(symbol: string) {
    const cacheKey = `quote:${symbol}`;
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    const { data } = await this.client.get<YahooQuoteResponse>('/market/v2/get-quotes', {
      params: { symbols: symbol, region: 'US' },
    });

    const quote = data.quoteResponse.result[0];
    if (!quote) {
      throw new Error(`No quote found for symbol: ${symbol}`);
    }

    const result = {
      symbol: quote.symbol,
      price: quote.regularMarketPrice,
      currency: quote.currency as 'USD' | 'EUR',
      change: quote.regularMarketChange,
      changePercent: quote.regularMarketChangePercent,
      previousClose: quote.regularMarketPreviousClose,
      open: quote.regularMarketOpen,
      dayHigh: quote.regularMarketDayHigh,
      dayLow: quote.regularMarketDayLow,
      volume: quote.regularMarketVolume,
      avgVolume30d: quote.averageDailyVolume3Month,
      timestamp: new Date(quote.regularMarketTime * 1000),
      exchange: quote.fullExchangeName,
      marketState: quote.marketState as 'PRE' | 'REGULAR' | 'POST' | 'CLOSED',
    };

    cache.set(cacheKey, result, CACHE_TTL.QUOTE);
    return result;
  }

  async getCompanyInfo(symbol: string) {
    const cacheKey = `company:${symbol}`;
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    const { data } = await this.client.get<YahooQuoteSummaryResponse>('/stock/v2/get-summary', {
      params: { symbol, region: 'US' },
    });

    const profile = data.quoteSummary.result[0]?.assetProfile;

    const result = {
      name: symbol, // Will be overwritten by quote data
      symbol,
      isin: null,
      sector: profile?.sector || 'N/A',
      industry: profile?.industry || 'N/A',
      exchange: 'N/A',
      currency: 'USD',
      country: profile?.country || 'N/A',
    };

    cache.set(cacheKey, result, CACHE_TTL.COMPANY);
    return result;
  }

  async getFundamentals(symbol: string) {
    const cacheKey = `fundamentals:${symbol}`;
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    const { data } = await this.client.get<YahooQuoteSummaryResponse>('/stock/v2/get-summary', {
      params: { symbol, region: 'US' },
    });

    const summary = data.quoteSummary.result[0]?.summaryDetail;
    const keyStats = data.quoteSummary.result[0]?.defaultKeyStatistics;
    const financial = data.quoteSummary.result[0]?.financialData;

    const result = {
      marketCap: summary?.marketCap?.raw || null,
      peRatioTTM: summary?.trailingPE?.raw || null,
      dividendYield: summary?.dividendYield?.raw ? summary.dividendYield.raw * 100 : null,
      revenueGrowthYoY: financial?.revenueGrowth?.raw ? financial.revenueGrowth.raw * 100 : null,
      beta: keyStats?.beta?.raw || summary?.beta?.raw || null,
    };

    cache.set(cacheKey, result, CACHE_TTL.FUNDAMENTALS);
    return result;
  }

  async getHistorical(symbol: string, range: string = '1y') {
    const cacheKey = `historical:${symbol}:${range}`;
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    const { data } = await this.client.get<YahooChartResponse>('/stock/v3/get-chart', {
      params: {
        symbol,
        interval: '1d',
        range,
        region: 'US',
      },
    });

    const chartResult = data.chart.result[0];
    if (!chartResult) {
      throw new Error(`No historical data found for symbol: ${symbol}`);
    }

    const timestamps = chartResult.timestamp;
    const closes = chartResult.indicators.quote[0].close;
    const volumes = chartResult.indicators.quote[0].volume;

    const result = timestamps
      .map((ts, i) => ({
        date: new Date(ts * 1000),
        close: closes[i],
        volume: volumes[i],
      }))
      .filter((d) => d.close !== null && d.volume !== null);

    cache.set(cacheKey, result, CACHE_TTL.HISTORICAL);
    return result;
  }
}

export const yahooFinance = new YahooFinanceService();
