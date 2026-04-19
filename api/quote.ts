import type { VercelRequest, VercelResponse } from '@vercel/node';
import axios from 'axios';
import { guardApiRequest } from './_lib/requestGuard.js';
import { makeCache, CACHE_TTL } from './_lib/cache.js';

const cache = makeCache(CACHE_TTL.QUOTE);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!guardApiRequest(req, res, 'quote', { maxRequests: 40, windowMs: 60 * 1000 })) {
    return;
  }

  const symbol = req.query.symbol as string;
  if (!symbol) {
    return res.status(400).json({ error: 'Symbol parameter is required' });
  }

  const cacheKey = `quote:${symbol}`;
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

    const { data } = await axios.get(`https://${apiHost}/market/v2/get-quotes`, {
      params: { symbols: symbol, region: 'US' },
      headers: {
        'X-RapidAPI-Key': apiKey,
        'X-RapidAPI-Host': apiHost,
      },
    });

    const quote = data.quoteResponse?.result?.[0];
    if (!quote) {
      return res.status(404).json({ error: `No quote found for symbol: ${symbol}` });
    }

    const result = {
      symbol: quote.symbol,
      price: quote.regularMarketPrice,
      currency: quote.currency,
      change: quote.regularMarketChange,
      changePercent: quote.regularMarketChangePercent,
      previousClose: quote.regularMarketPreviousClose,
      open: quote.regularMarketOpen,
      dayHigh: quote.regularMarketDayHigh,
      dayLow: quote.regularMarketDayLow,
      volume: quote.regularMarketVolume,
      avgVolume30d: quote.averageDailyVolume3Month,
      timestamp: new Date(quote.regularMarketTime * 1000),
      exchange: quote.fullExchangeName,
      marketState: quote.marketState,
    };

    cache.set(cacheKey, result);
    return res.status(200).json(result);
  } catch (error) {
    console.error('Quote error:', error);
    return res.status(500).json({ error: 'Failed to fetch quote' });
  }
}
