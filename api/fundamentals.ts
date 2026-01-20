import type { VercelRequest, VercelResponse } from '@vercel/node';
import axios from 'axios';

// Simple in-memory cache
const cache = new Map<string, { data: unknown; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const symbol = req.query.symbol as string;
  if (!symbol) {
    return res.status(400).json({ error: 'Symbol parameter is required' });
  }

  const cacheKey = `fundamentals:${symbol}`;
  const cached = getFromCache(cacheKey);
  if (cached) {
    return res.status(200).json(cached);
  }

  try {
    const apiKey = process.env.YAHOO_API_KEY;
    const apiHost = process.env.YAHOO_API_HOST || 'yh-finance.p.rapidapi.com';

    if (!apiKey) {
      return res.status(200).json({
        marketCap: null,
        peRatioTTM: null,
        dividendYield: null,
        revenueGrowthYoY: null,
        beta: null,
      });
    }

    // Use the quotes endpoint which we know works
    const quoteResponse = await axios.get(`https://${apiHost}/market/v2/get-quotes`, {
      params: { symbols: symbol, region: 'US' },
      headers: {
        'X-RapidAPI-Key': apiKey,
        'X-RapidAPI-Host': apiHost,
      },
    });

    const quote = quoteResponse.data?.quoteResponse?.result?.[0];

    if (!quote) {
      return res.status(200).json({
        marketCap: null,
        peRatioTTM: null,
        dividendYield: null,
        revenueGrowthYoY: null,
        beta: null,
      });
    }

    // Extract fundamentals from quote data
    const result = {
      marketCap: quote.marketCap || null,
      peRatioTTM: quote.trailingPE || null,
      dividendYield: quote.trailingAnnualDividendYield
        ? quote.trailingAnnualDividendYield * 100
        : null,
      revenueGrowthYoY: null, // Not available in quote endpoint
      beta: quote.beta || null,
    };

    setCache(cacheKey, result);
    return res.status(200).json(result);
  } catch (error) {
    console.error('Fundamentals error:', error);
    return res.status(200).json({
      marketCap: null,
      peRatioTTM: null,
      dividendYield: null,
      revenueGrowthYoY: null,
      beta: null,
    });
  }
}
