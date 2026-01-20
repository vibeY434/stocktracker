import type { VercelRequest, VercelResponse } from '@vercel/node';
import axios from 'axios';

// Simple in-memory cache
const cache = new Map<string, { data: unknown; timestamp: number }>();
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

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
  const range = (req.query.range as string) || '1y';

  if (!symbol) {
    return res.status(400).json({ error: 'Symbol parameter is required' });
  }

  const cacheKey = `historical:${symbol}:${range}`;
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

    setCache(cacheKey, result);
    return res.status(200).json(result);
  } catch (error) {
    console.error('Historical error:', error);
    return res.status(500).json({ error: 'Failed to fetch historical data' });
  }
}
