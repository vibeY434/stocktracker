import type { VercelRequest, VercelResponse } from '@vercel/node';
import axios from 'axios';
import { guardApiRequest } from './_lib/requestGuard.js';
import { makeCache, CACHE_TTL } from './_lib/cache.js';
import {
  isGermanListingCandidate,
  scoreGermanListingCandidate,
  type GermanListingCandidate,
} from './_lib/euScoring.js';
import { US_TO_DE_MAPPING } from '../src/utils/euTickerMappings.js';

const cache = makeCache(CACHE_TTL.QUOTE);

function getMappedGermanTickerVariants(usSymbol: string): string[] {
  return Array.from(new Set(US_TO_DE_MAPPING[usSymbol.toUpperCase()] ?? []));
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

    const results: GermanListingCandidate[] = searchResponse.data?.quotes ?? [];
    const candidates = results
      .filter((result) => isGermanListingCandidate(result))
      .map((result) => ({
        symbol: String(result.symbol ?? ''),
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
  const cached = cache.get(cacheKey);
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

        cache.set(cacheKey, result);
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

        cache.set(cacheKey, result);
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
