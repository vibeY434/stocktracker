import axios, { type AxiosInstance } from 'axios';
import { cache } from './cache.js';

const CACHE_TTL = {
  QUOTE: 30 * 1000, // 30 seconds
  SEARCH: 60 * 1000, // 1 minute
  COMPANY: 60 * 60 * 1000, // 1 hour
  FUNDAMENTALS: 5 * 60 * 1000, // 5 minutes
  HISTORICAL: 60 * 60 * 1000, // 1 hour
};

const EU_SYMBOL_SUFFIXES = ['.DE', '.F', '.MU', '.SG', '.HM', '.DU', '.BE'] as const;
const GERMAN_EXCHANGE_CODES = [
  'XETRA',
  'GER',
  'FRA',
  'STU',
  'MUN',
  'HAM',
  'DUS',
  'BER',
  'SGT',
] as const;
const US_TO_DE_MAPPING: Record<string, string[]> = {
  BABA: ['AHLA.DE', 'AHLA.F'],
  BIDU: ['B1C.DE', 'B1C.F'],
  JD: ['013A.DE', '013A.F'],
  NIO: ['NIO1.DE', 'NIO1.F'],
  GRAB: ['A6I.DE', 'A6I.F'],
  NVO: ['NOV.DE', 'NOVA.F'],
  ADUR: ['1N8.DE', '1N8.F'],
  HIMS: ['82W.DE', '82W.F', '82W.SG'],
  ONDS: ['6O9.DE', '6O9.F'],
  ASTS: ['AS5.DE', 'AS5.F'],
  OSCR: ['9VY.DE', '9VY.F'],
  PLTR: ['PTX.DE', 'PTX.F'],
  SOFI: ['4S0.DE', '4S0.F'],
  RIVN: ['1R1.DE', '1R1.F'],
  LCID: ['2LC.DE', '2LC.F'],
  HOOD: ['6HH.DE', '6HH.F'],
  COIN: ['1QZ.DE', '1QZ.F'],
  AFRM: ['5AF.DE', '5AF.F'],
  UPST: ['UP2.DE', 'UP2.F'],
  RKLB: ['RKLB.DE', 'RKLB.F'],
  SNOW: ['S4O.DE', 'S4O.F'],
  CRWD: ['C6R.DE', 'C6R.F'],
  DDOG: ['4DO.DE', '4DO.F'],
  NET: ['N3T.DE', 'N3T.F'],
  ZS: ['Z1S.DE', 'Z1S.F'],
  TTD: ['T2D.DE', 'T2D.F'],
  MARA: ['2M0.DE', '2M0.F'],
  RIOT: ['RIO1.DE', 'RIO1.F'],
  SMCI: ['0AI.DE', '0AI.F'],
  ABNB: ['6Z1.DE', '6Z1.F'],
  ACHR: ['AC7.DE', 'AC7.F'],
  ZETA: ['3ZT.DE', '3ZT.F'],
  ZVRA: ['4ZV.DE', '4ZV.F'],
  ASPN: ['2AP.DE', '2AP.F'],
  GRRR: ['1GR.DE', '1GR.F'],
  ONTO: ['0NT.DE', '0NT.F'],
  UNH: ['UNH.DE', 'UNH.F'],
  UPS: ['UPS.DE', 'UPS.F'],
  NKE: ['NKE.DE', 'NKE.F'],
  PYPL: ['2PP.DE', '2PP.F'],
  SHOP: ['SH0.DE', 'SH0.F'],
  TGT: ['TGT.DE', 'TGT.F'],
  PFE: ['PFE.DE', 'PFE.F'],
  OXY: ['OXY.DE', 'OXY.F'],
  ANF: ['ANF.DE', 'ANF.F'],
};
const NAME_STOPWORDS = new Set([
  'INC',
  'INCORPORATED',
  'CORP',
  'CORPORATION',
  'CO',
  'COMPANY',
  'HOLDINGS',
  'HOLDING',
  'GROUP',
  'CLASS',
  'ADR',
  'PLC',
  'SA',
  'SE',
  'AG',
  'NV',
  'THE',
  'A',
  'B',
]);

interface YahooQuoteResponse {
  quoteResponse: {
    result: Array<{
      symbol: string;
      shortName?: string;
      longName?: string;
      displayName?: string;
      regularMarketPrice: number;
      currency: string;
      financialCurrency?: string;
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
      exchange?: string;
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
  quoteSummary?: {
    result?: Array<{
      assetProfile?: {
        sector: string;
        industry: string;
        country: string;
      };
      price?: {
        shortName?: string;
        longName?: string;
        exchangeName?: string;
        currency?: string;
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
  price?: {
    shortName?: string;
    longName?: string;
    exchangeName?: string;
    currency?: string;
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

type SearchCandidate = YahooSearchResponse['quotes'][number];

function getMappedGermanTickerVariants(usSymbol: string): string[] {
  return Array.from(new Set(US_TO_DE_MAPPING[usSymbol.toUpperCase()] ?? []));
}

function normalizeCompanyName(value: string): string {
  return value.toUpperCase().replace(/[^A-Z0-9]+/g, ' ').trim().replace(/\s+/g, ' ');
}

function tokenizeCompanyName(value: string): string[] {
  return normalizeCompanyName(value)
    .split(' ')
    .filter((token) => token.length > 1 && !NAME_STOPWORDS.has(token) && !/^\d+$/.test(token));
}

function isGermanListingCandidate(result: SearchCandidate): boolean {
  const symbol = result.symbol.toUpperCase();
  const exchange = String(result.exchange ?? result.exchDisp ?? '').toUpperCase();

  return (
    EU_SYMBOL_SUFFIXES.some((suffix) => symbol.endsWith(suffix)) &&
    (!exchange || GERMAN_EXCHANGE_CODES.includes(exchange as (typeof GERMAN_EXCHANGE_CODES)[number]))
  );
}

function scoreGermanListingCandidate(
  result: SearchCandidate,
  referenceNames: string[],
): { score: number; sharedCount: number; overlap: number; exactMatch: boolean } {
  const candidateName = String(result.longname ?? result.shortname ?? '').trim();

  if (!candidateName) {
    return { score: -1, sharedCount: 0, overlap: 0, exactMatch: false };
  }

  const normalizedReferenceNames = new Set(
    referenceNames.map((name) => normalizeCompanyName(name)).filter(Boolean),
  );
  const normalizedCandidateName = normalizeCompanyName(candidateName);
  const exactMatch = normalizedReferenceNames.has(normalizedCandidateName);
  const referenceTokens = Array.from(
    new Set(referenceNames.flatMap((name) => tokenizeCompanyName(name))),
  );
  const candidateTokens = Array.from(new Set(tokenizeCompanyName(candidateName)));
  const referenceTokenSet = new Set(referenceTokens);
  const sharedCount = candidateTokens.filter((token) => referenceTokenSet.has(token)).length;
  const overlap = referenceTokens.length ? sharedCount / referenceTokens.length : 0;
  const exchange = String(result.exchange ?? result.exchDisp ?? '').toUpperCase();
  const quoteType = String(result.quoteType ?? '').toUpperCase();
  let score = overlap * 6;

  if (exactMatch) {
    score += 8;
  }

  if (sharedCount >= 2) {
    score += 2;
  }

  if (exchange === 'XETRA' || exchange === 'GER') {
    score += 1;
  }

  if (quoteType === 'EQUITY' || quoteType === 'ETF') {
    score += 0.5;
  }

  return { score, sharedCount, overlap, exactMatch };
}

function pickBestSymbolMatch<T extends { symbol?: string }>(
  entries: T[] | undefined,
  symbol: string,
): T | undefined {
  if (!entries?.length) return undefined;

  const normalizedSymbol = symbol.toUpperCase();
  return entries.find((entry) => entry.symbol?.toUpperCase() === normalizedSymbol) ?? entries[0];
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

  async getEuQuote(usSymbol: string) {
    const cacheKey = `eu-quote:${usSymbol}`;
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    const variants = getMappedGermanTickerVariants(usSymbol);

    for (const variant of variants) {
      const quote = await this.tryGetGermanQuote(variant);
      if (quote) {
        cache.set(cacheKey, quote, CACHE_TTL.QUOTE);
        return quote;
      }
    }

    const searchedSymbol = await this.searchGermanListing(usSymbol);
    if (searchedSymbol) {
      const quote = await this.tryGetGermanQuote(searchedSymbol);
      if (quote) {
        cache.set(cacheKey, quote, CACHE_TTL.QUOTE);
        return quote;
      }
    }

    return null;
  }

  async getCompanyInfo(symbol: string) {
    const cacheKey = `company:${symbol}`;
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    const [summaryResponse, quoteResponse, searchResponse] = await Promise.allSettled([
      this.client.get<YahooQuoteSummaryResponse>('/stock/v2/get-summary', {
        params: { symbol, region: 'US' },
      }),
      this.client.get<YahooQuoteResponse>('/market/v2/get-quotes', {
        params: { symbols: symbol, region: 'US' },
      }),
      this.client.get<YahooSearchResponse>('/auto-complete', {
        params: { q: symbol, region: 'US' },
      }),
    ]);

    if (
      summaryResponse.status !== 'fulfilled' &&
      quoteResponse.status !== 'fulfilled' &&
      searchResponse.status !== 'fulfilled'
    ) {
      throw new Error(`No company data found for symbol: ${symbol}`);
    }

    const summaryData = summaryResponse.status === 'fulfilled' ? summaryResponse.value.data : null;
    const quoteData =
      quoteResponse.status === 'fulfilled'
        ? pickBestSymbolMatch(quoteResponse.value.data.quoteResponse?.result, symbol)
        : undefined;
    const searchMatch =
      searchResponse.status === 'fulfilled'
        ? pickBestSymbolMatch(searchResponse.value.data.quotes, symbol)
        : undefined;
    const summaryResult = summaryData?.quoteSummary?.result?.[0];
    const profile = summaryResult?.assetProfile;
    const priceData = summaryData?.price ?? summaryResult?.price ?? {};

    const result = {
      name:
        quoteData?.shortName ||
        quoteData?.longName ||
        quoteData?.displayName ||
        priceData.shortName ||
        priceData.longName ||
        searchMatch?.longname ||
        searchMatch?.shortname ||
        symbol,
      symbol,
      isin: null,
      sector: profile?.sector || 'N/A',
      industry: profile?.industry || 'N/A',
      exchange:
        quoteData?.fullExchangeName ||
        quoteData?.exchange ||
        priceData.exchangeName ||
        searchMatch?.exchDisp ||
        searchMatch?.exchange ||
        'N/A',
      currency: quoteData?.currency || quoteData?.financialCurrency || priceData.currency || 'USD',
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

    const summaryResult = data.quoteSummary?.result?.[0];
    const summary = summaryResult?.summaryDetail;
    const keyStats = summaryResult?.defaultKeyStatistics;
    const financial = summaryResult?.financialData;

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

  private async searchGermanListing(usSymbol: string): Promise<string | null> {
    try {
      const { data: usData } = await this.client.get<YahooQuoteResponse>('/market/v2/get-quotes', {
        params: { symbols: usSymbol, region: 'US' },
      });

      const usQuote = usData.quoteResponse?.result?.[0];
      const referenceNames = [usQuote?.longName, usQuote?.shortName]
        .filter((value): value is string => typeof value === 'string' && value.trim().length > 0);

      if (!referenceNames.length) {
        return null;
      }

      const { data: searchData } = await this.client.get<YahooSearchResponse>('/auto-complete', {
        params: { q: referenceNames[0], region: 'DE' },
      });

      const candidates = (searchData.quotes ?? [])
        .filter((result) => isGermanListingCandidate(result))
        .map((result) => ({
          symbol: result.symbol,
          ...scoreGermanListingCandidate(result, referenceNames),
        }))
        .filter(
          (candidate) =>
            candidate.score >= 4 &&
            (candidate.exactMatch || candidate.sharedCount >= 2 || candidate.overlap >= 0.6),
        )
        .sort((a, b) => b.score - a.score);

      return candidates[0]?.symbol ?? null;
    } catch {
      return null;
    }
  }

  private async tryGetGermanQuote(symbol: string) {
    try {
      const { data } = await this.client.get<YahooQuoteResponse>('/market/v2/get-quotes', {
        params: { symbols: symbol, region: 'DE' },
      });

      const quote = data.quoteResponse?.result?.[0];
      if (!quote || !quote.regularMarketPrice || quote.currency !== 'EUR') {
        return null;
      }

      return {
        symbol: quote.symbol,
        price: quote.regularMarketPrice,
        currency: quote.currency as 'EUR',
        change: quote.regularMarketChange,
        changePercent: quote.regularMarketChangePercent,
        previousClose: quote.regularMarketPreviousClose,
        open: quote.regularMarketOpen,
        dayHigh: quote.regularMarketDayHigh,
        dayLow: quote.regularMarketDayLow,
        volume: quote.regularMarketVolume,
        avgVolume30d: quote.averageDailyVolume3Month,
        timestamp: new Date(quote.regularMarketTime * 1000),
        exchange: quote.fullExchangeName || quote.exchange || 'N/A',
        marketState: quote.marketState as 'PRE' | 'REGULAR' | 'POST' | 'CLOSED',
      };
    } catch {
      return null;
    }
  }
}

export const yahooFinance = new YahooFinanceService();
