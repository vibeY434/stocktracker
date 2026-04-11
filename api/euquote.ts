import type { VercelRequest, VercelResponse } from '@vercel/node';
import axios from 'axios';
import { guardApiRequest } from './_lib/requestGuard';
import {
  GERMAN_EXCHANGE_CODES,
  EU_SYMBOL_SUFFIXES,
  US_TO_DE_MAPPING,
} from '../src/utils/euTickerMappings';

// Simple in-memory cache
const cache = new Map<string, { data: unknown; timestamp: number }>();
const CACHE_TTL = 30 * 1000; // 30 seconds

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

function isGermanListingCandidate(result: Record<string, unknown>): boolean {
  const symbol = String(result.symbol ?? '').toUpperCase();
  const exchange = String(result.exchange ?? result.exchDisp ?? '').toUpperCase();

  return (
    EU_SYMBOL_SUFFIXES.some((suffix) => symbol.endsWith(suffix)) &&
    (!exchange || GERMAN_EXCHANGE_CODES.includes(exchange as (typeof GERMAN_EXCHANGE_CODES)[number]))
  );
}

function scoreGermanListingCandidate(
  result: Record<string, unknown>,
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

async function searchGermanListing(
  usSymbol: string,
  apiKey: string,
  apiHost: string
): Promise<string | null> {
  try {
    const usResponse = await axios.get(`https://${apiHost}/market/v2/get-quotes`, {
      params: { symbols: usSymbol, region: 'US' },
      headers: {
        'X-RapidAPI-Key': apiKey,
        'X-RapidAPI-Host': apiHost,
      },
      timeout: 5000,
    });

    const usQuote = usResponse.data?.quoteResponse?.result?.[0];
    const referenceNames = [usQuote?.longName, usQuote?.shortName]
      .filter((value): value is string => typeof value === 'string' && value.trim().length > 0);

    if (!referenceNames.length) {
      return null;
    }

    const searchResponse = await axios.get(`https://${apiHost}/auto-complete`, {
      params: { q: referenceNames[0], region: 'DE' },
      headers: {
        'X-RapidAPI-Key': apiKey,
        'X-RapidAPI-Host': apiHost,
      },
      timeout: 5000,
    });

    const results = searchResponse.data?.quotes || [];
    const candidates = results
      .filter((result: Record<string, unknown>) => isGermanListingCandidate(result))
      .map((result: Record<string, unknown>) => ({
        symbol: String(result.symbol ?? ''),
        ...scoreGermanListingCandidate(result, referenceNames),
      }))
      .filter(
        (candidate: { score: number; sharedCount: number; overlap: number; exactMatch: boolean }) =>
          candidate.score >= 4 &&
          (candidate.exactMatch || candidate.sharedCount >= 2 || candidate.overlap >= 0.6),
      )
      .sort((a, b) => b.score - a.score);

    return candidates[0]?.symbol ?? null;
  } catch {
    return null;
  }
}

async function tryGetQuote(
  symbol: string,
  apiKey: string,
  apiHost: string
): Promise<Record<string, unknown> | null> {
  try {
    const response = await axios.get(`https://${apiHost}/market/v2/get-quotes`, {
      params: { symbols: symbol, region: 'DE' },
      headers: {
        'X-RapidAPI-Key': apiKey,
        'X-RapidAPI-Host': apiHost,
      },
      timeout: 5000,
    });

    const quote = response.data?.quoteResponse?.result?.[0];
    // Check if we got valid EUR data
    if (quote && quote.regularMarketPrice && quote.currency === 'EUR') {
      return quote;
    }
    return null;
  } catch {
    return null;
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!guardApiRequest(req, res, 'euquote', { maxRequests: 20, windowMs: 60 * 1000 })) {
    return;
  }

  const usSymbol = req.query.symbol as string;
  if (!usSymbol) {
    return res.status(400).json({ error: 'Symbol parameter is required' });
  }

  const cacheKey = `eu-quote:${usSymbol}`;
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

    const variants = getMappedGermanTickerVariants(usSymbol);

    for (const variant of variants) {
      const quote = await tryGetQuote(variant, apiKey, apiHost);

      if (quote) {
        const result = {
          symbol: quote.symbol,
          price: quote.regularMarketPrice,
          currency: quote.currency || 'EUR',
          change: quote.regularMarketChange,
          changePercent: quote.regularMarketChangePercent,
          previousClose: quote.regularMarketPreviousClose,
          open: quote.regularMarketOpen,
          dayHigh: quote.regularMarketDayHigh,
          dayLow: quote.regularMarketDayLow,
          volume: quote.regularMarketVolume,
          avgVolume30d: quote.averageDailyVolume3Month,
          timestamp: new Date((quote.regularMarketTime as number) * 1000),
          exchange: quote.fullExchangeName || quote.exchange,
          marketState: quote.marketState || 'CLOSED',
        };

        setCache(cacheKey, result);
        return res.status(200).json(result);
      }
    }

    const searchedSymbol = await searchGermanListing(usSymbol, apiKey, apiHost);
    if (searchedSymbol) {
      const quote = await tryGetQuote(searchedSymbol, apiKey, apiHost);
      if (quote) {
        const result = {
          symbol: quote.symbol,
          price: quote.regularMarketPrice,
          currency: quote.currency || 'EUR',
          change: quote.regularMarketChange,
          changePercent: quote.regularMarketChangePercent,
          previousClose: quote.regularMarketPreviousClose,
          open: quote.regularMarketOpen,
          dayHigh: quote.regularMarketDayHigh,
          dayLow: quote.regularMarketDayLow,
          volume: quote.regularMarketVolume,
          avgVolume30d: quote.averageDailyVolume3Month,
          timestamp: new Date((quote.regularMarketTime as number) * 1000),
          exchange: quote.fullExchangeName || quote.exchange,
          marketState: quote.marketState || 'CLOSED',
        };

        setCache(cacheKey, result);
        return res.status(200).json(result);
      }
    }

    return res.status(404).json({
      error: 'No EU listing found',
      triedVariants: variants,
      searchedSymbol: searchedSymbol || 'none found',
    });
  } catch (error) {
    console.error('EU Quote error:', error);
    return res.status(500).json({ error: 'Failed to fetch EU quote' });
  }
}
