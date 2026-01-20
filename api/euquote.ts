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

// EU exchange identifiers
const EU_EXCHANGES = ['GER', 'FRA', 'ETR', 'STU', 'MUN', 'HAM', 'DUS', 'BER', 'XETRA'];

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
      return res.status(500).json({ error: 'API key not configured' });
    }

    // Step 1: Get the company name from the US symbol
    let companyName = usSymbol;
    try {
      const quoteResponse = await axios.get(`https://${apiHost}/market/v2/get-quotes`, {
        params: { symbols: usSymbol, region: 'US' },
        headers: {
          'X-RapidAPI-Key': apiKey,
          'X-RapidAPI-Host': apiHost,
        },
      });
      const usQuote = quoteResponse.data?.quoteResponse?.result?.[0];
      if (usQuote?.shortName) {
        companyName = usQuote.shortName;
      } else if (usQuote?.longName) {
        companyName = usQuote.longName;
      }
    } catch (e) {
      console.log('Could not get company name, using symbol');
    }

    // Step 2: Search for EU listings using the company name
    const searchResponse = await axios.get(`https://${apiHost}/auto-complete`, {
      params: { q: companyName, region: 'DE' },
      headers: {
        'X-RapidAPI-Key': apiKey,
        'X-RapidAPI-Host': apiHost,
      },
    });

    const searchResults = searchResponse.data?.quotes || [];

    // Find an EU listing (prefer German exchanges)
    const euListing = searchResults.find((result: { exchange: string; quoteType: string }) =>
      EU_EXCHANGES.includes(result.exchange) &&
      (result.quoteType === 'EQUITY' || result.quoteType === 'ETF')
    );

    if (!euListing) {
      return res.status(404).json({ error: 'No EU listing found', searched: companyName });
    }

    // Step 3: Get the quote for the EU symbol
    const euQuoteResponse = await axios.get(`https://${apiHost}/market/v2/get-quotes`, {
      params: { symbols: euListing.symbol, region: 'DE' },
      headers: {
        'X-RapidAPI-Key': apiKey,
        'X-RapidAPI-Host': apiHost,
      },
    });

    const euQuote = euQuoteResponse.data?.quoteResponse?.result?.[0];
    if (!euQuote) {
      return res.status(404).json({ error: 'Could not fetch EU quote' });
    }

    const result = {
      symbol: euQuote.symbol,
      price: euQuote.regularMarketPrice,
      currency: euQuote.currency || 'EUR',
      change: euQuote.regularMarketChange,
      changePercent: euQuote.regularMarketChangePercent,
      previousClose: euQuote.regularMarketPreviousClose,
      open: euQuote.regularMarketOpen,
      dayHigh: euQuote.regularMarketDayHigh,
      dayLow: euQuote.regularMarketDayLow,
      volume: euQuote.regularMarketVolume,
      avgVolume30d: euQuote.averageDailyVolume3Month,
      timestamp: new Date(euQuote.regularMarketTime * 1000),
      exchange: euQuote.fullExchangeName || euQuote.exchange,
      marketState: euQuote.marketState || 'CLOSED',
    };

    setCache(cacheKey, result);
    return res.status(200).json(result);
  } catch (error) {
    console.error('EU Quote error:', error);
    return res.status(500).json({ error: 'Failed to fetch EU quote' });
  }
}
