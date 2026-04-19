import type { VercelRequest, VercelResponse } from '@vercel/node';
import axios from 'axios';
import { guardApiRequest } from './_lib/requestGuard.js';
import { makeCache, CACHE_TTL } from './_lib/cache.js';

const cache = makeCache(CACHE_TTL.HISTORICAL);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!guardApiRequest(req, res, 'historical', { maxRequests: 10, windowMs: 60 * 1000 })) {
    return;
  }

  const symbol = req.query.symbol as string;
  const range = (req.query.range as string) || '1y';

  if (!symbol) {
    return res.status(400).json({ error: 'Symbol parameter is required' });
  }

  const cacheKey = `historical:${symbol}:${range}`;
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

    const { data } = await axios.get(`https://${apiHost}/stock/v3/get-chart`, {
      params: {
        symbol,
        interval: '1d',
        range,
        region: 'US',
      },
      headers: {
        'X-RapidAPI-Key': apiKey,
        'X-RapidAPI-Host': apiHost,
      },
    });

    const chartResult = data.chart?.result?.[0];
    if (!chartResult) {
      return res.status(404).json({ error: `No historical data found for symbol: ${symbol}` });
    }

    const timestamps = chartResult.timestamp || [];
    const closes = chartResult.indicators?.quote?.[0]?.close || [];
    const volumes = chartResult.indicators?.quote?.[0]?.volume || [];

    const result = timestamps
      .map((ts: number, i: number) => ({
        date: new Date(ts * 1000),
        close: closes[i],
        volume: volumes[i],
      }))
      .filter((d: { close: number | null; volume: number | null }) => d.close !== null && d.volume !== null);

    cache.set(cacheKey, result);
    return res.status(200).json(result);
  } catch (error) {
    console.error('Historical error:', error);
    return res.status(500).json({ error: 'Failed to fetch historical data' });
  }
}
