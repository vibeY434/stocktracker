import type { VercelRequest, VercelResponse } from '@vercel/node';
import axios from 'axios';

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

// Generate possible German ticker variants
function getGermanTickerVariants(usSymbol: string): string[] {
  const base = usSymbol.toUpperCase();
  const variants: string[] = [];

  // Common patterns for German listings
  // 1. Same ticker with .DE suffix (XETRA)
  variants.push(`${base}.DE`);

  // 2. Shortened ticker (AMZN -> AMZ, MSFT -> MSF, GOOGL -> GOOG)
  if (base.length >= 4) {
    variants.push(`${base.slice(0, 3)}.DE`);
  }
  if (base.length >= 5) {
    variants.push(`${base.slice(0, 4)}.DE`);
  }

  // 3. Frankfurt suffix
  variants.push(`${base}.F`);
  if (base.length >= 4) {
    variants.push(`${base.slice(0, 3)}.F`);
  }

  // 4. Other German exchanges
  variants.push(`${base}.MU`); // Munich
  variants.push(`${base}.SG`); // Stuttgart

  return variants;
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
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
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
      return res.status(404).json({ error: 'API key not configured' });
    }

    // Try all German ticker variants
    const variants = getGermanTickerVariants(usSymbol);

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

    // No German listing found
    return res.status(404).json({
      error: 'No EU listing found',
      triedVariants: variants
    });
  } catch (error) {
    console.error('EU Quote error:', error);
    return res.status(500).json({ error: 'Failed to fetch EU quote' });
  }
}
