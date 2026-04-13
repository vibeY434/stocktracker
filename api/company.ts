import type { VercelRequest, VercelResponse } from '@vercel/node';
import axios from 'axios';
import { guardApiRequest } from './_lib/requestGuard.js';

// Simple in-memory cache
const cache = new Map<string, { data: unknown; timestamp: number }>();
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

interface YahooSummaryProfile {
  sector?: string;
  industry?: string;
  country?: string;
}

interface YahooSummaryPrice {
  shortName?: string;
  longName?: string;
  exchangeName?: string;
  currency?: string;
}

interface YahooSummaryResponse {
  quoteSummary?: {
    result?: Array<{
      assetProfile?: YahooSummaryProfile;
      price?: YahooSummaryPrice;
    }>;
  };
  price?: YahooSummaryPrice;
}

interface YahooQuoteResult {
  symbol?: string;
  shortName?: string;
  longName?: string;
  displayName?: string;
  fullExchangeName?: string;
  exchange?: string;
  currency?: string;
  financialCurrency?: string;
}

interface YahooQuotesResponse {
  quoteResponse?: {
    result?: YahooQuoteResult[];
  };
}

interface YahooSearchResult {
  symbol?: string;
  shortname?: string;
  longname?: string;
  exchange?: string;
  exchDisp?: string;
}

interface YahooSearchResponse {
  quotes?: YahooSearchResult[];
}

function getFromCache<T>(key: string): T | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > CACHE_TTL) {
    cache.delete(key);
    return null;
  }
  return entry.data as T;
}

function setCache(key: string, data: unknown): void {
  cache.set(key, { data, timestamp: Date.now() });
}

function pickBestSymbolMatch<T extends { symbol?: string }>(
  entries: T[] | undefined,
  symbol: string,
): T | undefined {
  if (!entries?.length) return undefined;

  const normalizedSymbol = symbol.toUpperCase();
  return entries.find((entry) => entry.symbol?.toUpperCase() === normalizedSymbol) ?? entries[0];
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!guardApiRequest(req, res, 'company', { maxRequests: 20, windowMs: 60 * 1000 })) {
    return;
  }

  const symbol = req.query.symbol as string;
  if (!symbol) {
    return res.status(400).json({ error: 'Symbol parameter is required' });
  }

  const cacheKey = `company:${symbol}`;
  const cached = getFromCache(cacheKey);
  if (cached) {
    return res.status(200).json(cached);
  }

  try {
    const apiKey = process.env.YAHOO_API_KEY;
    const apiHost = process.env.YAHOO_API_HOST || 'yh-finance.p.rapidapi.com';

    if (!apiKey) {
      return res.status(500).json({ error: 'API key not configured' });
    }

    const headers = {
      'X-RapidAPI-Key': apiKey,
      'X-RapidAPI-Host': apiHost,
    };

    const [summaryResponse, quoteResponse, searchResponse] = await Promise.allSettled([
      axios.get<YahooSummaryResponse>(`https://${apiHost}/stock/v2/get-summary`, {
        params: { symbol, region: 'US' },
        headers,
      }),
      axios.get<YahooQuotesResponse>(`https://${apiHost}/market/v2/get-quotes`, {
        params: { symbols: symbol, region: 'US' },
        headers,
      }),
      axios.get<YahooSearchResponse>(`https://${apiHost}/auto-complete`, {
        params: { q: symbol, region: 'US' },
        headers,
      }),
    ]);

    const summaryData = summaryResponse.status === 'fulfilled' ? summaryResponse.value.data : null;
    const quotesData = quoteResponse.status === 'fulfilled' ? quoteResponse.value.data : null;
    const searchData = searchResponse.status === 'fulfilled' ? searchResponse.value.data : null;

    if (!summaryData && !quotesData && !searchData) {
      throw new Error(`No company data sources resolved for symbol: ${symbol}`);
    }

    const summaryResult = summaryData?.quoteSummary?.result?.[0];
    const profile = summaryResult?.assetProfile;
    const priceData = summaryData?.price ?? summaryResult?.price ?? {};
    const quoteData = pickBestSymbolMatch(quotesData?.quoteResponse?.result, symbol);
    const searchMatch = pickBestSymbolMatch(searchData?.quotes, symbol);

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

    setCache(cacheKey, result);
    return res.status(200).json(result);
  } catch (error) {
    console.error('Company error:', error);
    return res.status(500).json({ error: 'Failed to fetch company info' });
  }
}
