import type { VercelRequest, VercelResponse } from '@vercel/node';
import axios from 'axios';
import { guardApiRequest } from './_lib/requestGuard.js';
import { makeCache, CACHE_TTL } from './_lib/cache.js';

const cache = makeCache(CACHE_TTL.SEARCH);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!guardApiRequest(req, res, 'search', { maxRequests: 40, windowMs: 60 * 1000 })) {
    return;
  }

  const query = req.query.q as string;
  if (!query || query.length < 1) {
    return res.status(200).json([]);
  }

  const cacheKey = `search:${query}`;
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

    cache.set(cacheKey, results);
    return res.status(200).json(results);
  } catch (error) {
    console.error('Search error:', error);
    return res.status(500).json({ error: 'Search failed' });
  }
}
