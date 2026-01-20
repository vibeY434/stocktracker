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
      return res.status(500).json({ error: 'API key not configured' });
    }

    // Try to get data from multiple endpoints for better coverage
    let summaryData: Record<string, unknown> = {};
    let quoteData: Record<string, unknown> = {};

    // First try the summary endpoint
    try {
      const summaryResponse = await axios.get(`https://${apiHost}/stock/v2/get-summary`, {
        params: { symbol, region: 'US' },
        headers: {
          'X-RapidAPI-Key': apiKey,
          'X-RapidAPI-Host': apiHost,
        },
      });
      summaryData = summaryResponse.data || {};
    } catch (e) {
      console.log('Summary endpoint failed, trying quote endpoint');
    }

    // Also try the quote endpoint for additional data
    try {
      const quoteResponse = await axios.get(`https://${apiHost}/market/v2/get-quotes`, {
        params: { symbols: symbol, region: 'US' },
        headers: {
          'X-RapidAPI-Key': apiKey,
          'X-RapidAPI-Host': apiHost,
        },
      });
      quoteData = quoteResponse.data?.quoteResponse?.result?.[0] || {};
    } catch (e) {
      console.log('Quote endpoint failed');
    }

    // Extract data from various possible locations
    const summary = (summaryData as { summaryDetail?: Record<string, { raw?: number }> }).summaryDetail || {};
    const keyStats = (summaryData as { defaultKeyStatistics?: Record<string, { raw?: number }> }).defaultKeyStatistics || {};
    const financial = (summaryData as { financialData?: Record<string, { raw?: number }> }).financialData || {};
    const price = (summaryData as { price?: Record<string, { raw?: number }> }).price || {};
    const quote = quoteData as Record<string, number | undefined>;

    // Build result with fallbacks from multiple sources
    const result = {
      marketCap:
        summary.marketCap?.raw ||
        price.marketCap?.raw ||
        quote.marketCap ||
        null,
      peRatioTTM:
        summary.trailingPE?.raw ||
        quote.trailingPE ||
        null,
      dividendYield:
        (summary.dividendYield?.raw ? summary.dividendYield.raw * 100 : null) ||
        (quote.trailingAnnualDividendYield ? quote.trailingAnnualDividendYield * 100 : null) ||
        null,
      revenueGrowthYoY:
        (financial.revenueGrowth?.raw ? financial.revenueGrowth.raw * 100 : null) ||
        null,
      beta:
        keyStats.beta?.raw ||
        summary.beta?.raw ||
        quote.beta ||
        null,
    };

    setCache(cacheKey, result);
    return res.status(200).json(result);
  } catch (error) {
    console.error('Fundamentals error:', error);
    // Return empty data instead of error to prevent UI from breaking
    return res.status(200).json({
      marketCap: null,
      peRatioTTM: null,
      dividendYield: null,
      revenueGrowthYoY: null,
      beta: null,
    });
  }
}
