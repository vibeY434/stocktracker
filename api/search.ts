import type { VercelRequest, VercelResponse } from '@vercel/node';
import axios from 'axios';

// Simple in-memory cache
const cache = new Map<string, { data: unknown; timestamp: number }>();
const CACHE_TTL = 60 * 1000; // 1 minute

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
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const query = req.query.q as string;
  if (!query || query.length < 1) {
    return res.status(200).json([]);
  }

  const cacheKey = `search:${query}`;
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

    const { data } = await axios.get(`https://${apiHost}/auto-complete`, {
      params: { q: query, region: 'US' },
      headers: {
        'X-RapidAPI-Key': apiKey,
        'X-RapidAPI-Host': apiHost,
      },
    });

    const results = (data.quotes || [])
      .filter((q: { quoteType: string }) => q.quoteType === 'EQUITY' || q.quoteType === 'ETF')
      .map((q: { symbol: string; longname?: string; shortname?: string; exchange: string; exchDisp?: string; quoteType: string }) => {
        const isUS = ['NYSE', 'NASDAQ', 'NMS', 'NYQ', 'NGM', 'NCM'].includes(q.exchange);
        const isEU = ['GER', 'FRA', 'XETRA', 'STU', 'MUN'].includes(q.exchange);

        return {
          symbol: q.symbol,
          name: q.longname || q.shortname || q.symbol,
          exchange: q.exchange,
          exchangeDisplay: q.exchDisp || q.exchange,
          type: q.quoteType.toLowerCase(),
          currency: isUS ? 'USD' : isEU ? 'EUR' : 'USD',
          region: isUS ? 'US' : isEU ? 'EU' : 'OTHER',
        };
      })
      .sort((a: { region: string }, b: { region: string }) => {
        if (a.region === 'US' && b.region !== 'US') return -1;
        if (a.region !== 'US' && b.region === 'US') return 1;
        return 0;
      })
      .slice(0, 10);

    setCache(cacheKey, results);
    return res.status(200).json(results);
  } catch (error) {
    console.error('Search error:', error);
    return res.status(500).json({ error: 'Search failed' });
  }
}
