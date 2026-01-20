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

// Known US -> German ticker mappings (for stocks with different symbols)
const US_TO_DE_MAPPING: Record<string, string[]> = {
  // Chinese ADRs
  'BABA': ['AHLA.DE', 'AHLA.F'],     // Alibaba
  'BIDU': ['B1C.DE', 'B1C.F'],       // Baidu
  'JD': ['013A.DE', '013A.F'],       // JD.com
  'NIO': ['NIO1.DE', 'NIO1.F'],      // NIO
  'GRAB': ['A6I.DE', 'A6I.F'],       // Grab Holdings

  // European stocks traded in US
  'NVO': ['NOV.DE', 'NOVA.F'],       // Novo Nordisk
  'ADUR': ['1N8.DE', '1N8.F'],       // Adyen (Euronext -> XETRA)

  // Popular growth stocks with different German tickers
  'HIMS': ['82W.DE', '82W.F', '82W.SG'],
  'ONDS': ['6O9.DE', '6O9.F'],       // Ondas Holdings
  'ASTS': ['AS5.DE', 'AS5.F'],       // AST SpaceMobile
  'OSCR': ['9VY.DE', '9VY.F'],       // Oscar Health
  'PLTR': ['PTX.DE', 'PTX.F'],       // Palantir
  'SOFI': ['4S0.DE', '4S0.F'],       // SoFi Technologies
  'RIVN': ['1R1.DE', '1R1.F'],       // Rivian
  'LCID': ['2LC.DE', '2LC.F'],       // Lucid Motors
  'HOOD': ['6HH.DE', '6HH.F'],       // Robinhood
  'COIN': ['1QZ.DE', '1QZ.F'],       // Coinbase
  'AFRM': ['5AF.DE', '5AF.F'],       // Affirm
  'UPST': ['UP2.DE', 'UP2.F'],       // Upstart
  'RKLB': ['RKLB.DE', 'RKLB.F'],     // Rocket Lab
  'SNOW': ['S4O.DE', 'S4O.F'],       // Snowflake
  'CRWD': ['C6R.DE', 'C6R.F'],       // CrowdStrike
  'DDOG': ['4DO.DE', '4DO.F'],       // Datadog
  'NET': ['N3T.DE', 'N3T.F'],        // Cloudflare
  'ZS': ['Z1S.DE', 'Z1S.F'],         // Zscaler
  'TTD': ['T2D.DE', 'T2D.F'],        // The Trade Desk
  'MARA': ['2M0.DE', '2M0.F'],       // Marathon Digital
  'RIOT': ['RIO1.DE', 'RIO1.F'],     // Riot Platforms
  'SMCI': ['0AI.DE', '0AI.F'],       // Super Micro Computer
  'ABNB': ['6Z1.DE', '6Z1.F'],       // Airbnb
  'ACHR': ['AC7.DE', 'AC7.F'],       // Archer Aviation
  'ZETA': ['3ZT.DE', '3ZT.F'],       // Zeta Global
  'ZVRA': ['4ZV.DE', '4ZV.F'],       // Zevra Therapeutics
  'ASPN': ['2AP.DE', '2AP.F'],       // Aspen Aerogels
  'GRRR': ['1GR.DE', '1GR.F'],       // Gorilla Technology
  'ONTO': ['0NT.DE', '0NT.F'],       // Onto Innovation
  'UNH': ['UNH.DE', 'UNH.F'],        // UnitedHealth
  'UPS': ['UPS.DE', 'UPS.F'],        // UPS
  'NKE': ['NKE.DE', 'NKE.F'],        // Nike
  'PYPL': ['2PP.DE', '2PP.F'],       // PayPal
  'SHOP': ['SH0.DE', 'SH0.F'],       // Shopify
  'TGT': ['TGT.DE', 'TGT.F'],        // Target
  'PFE': ['PFE.DE', 'PFE.F'],        // Pfizer
  'OXY': ['OXY.DE', 'OXY.F'],        // Occidental Petroleum
  'ANF': ['ANF.DE', 'ANF.F'],        // Abercrombie & Fitch
};

// Generate possible German ticker variants
function getGermanTickerVariants(usSymbol: string): string[] {
  const base = usSymbol.toUpperCase();
  const variants: string[] = [];

  // 1. Check known mapping first
  if (US_TO_DE_MAPPING[base]) {
    variants.push(...US_TO_DE_MAPPING[base]);
  }

  // 2. Same ticker with .DE suffix (XETRA)
  variants.push(`${base}.DE`);

  // 3. Shortened ticker (AMZN -> AMZ, MSFT -> MSF, GOOGL -> GOOG)
  if (base.length >= 4) {
    variants.push(`${base.slice(0, 3)}.DE`);
  }
  if (base.length >= 5) {
    variants.push(`${base.slice(0, 4)}.DE`);
  }

  // 4. Frankfurt suffix
  variants.push(`${base}.F`);
  if (base.length >= 4) {
    variants.push(`${base.slice(0, 3)}.F`);
  }

  // 5. Other German exchanges
  variants.push(`${base}.MU`); // Munich
  variants.push(`${base}.SG`); // Stuttgart

  return variants;
}

// Search Yahoo Finance for German listings by company name
async function searchGermanListing(
  usSymbol: string,
  apiKey: string,
  apiHost: string
): Promise<string | null> {
  try {
    // First get the company name from US quote
    const usResponse = await axios.get(`https://${apiHost}/market/v2/get-quotes`, {
      params: { symbols: usSymbol, region: 'US' },
      headers: {
        'X-RapidAPI-Key': apiKey,
        'X-RapidAPI-Host': apiHost,
      },
      timeout: 5000,
    });

    const usQuote = usResponse.data?.quoteResponse?.result?.[0];
    if (!usQuote?.shortName) return null;

    // Search for the company name
    const searchResponse = await axios.get(`https://${apiHost}/auto-complete`, {
      params: { q: usQuote.shortName, region: 'DE' },
      headers: {
        'X-RapidAPI-Key': apiKey,
        'X-RapidAPI-Host': apiHost,
      },
      timeout: 5000,
    });

    const results = searchResponse.data?.quotes || [];

    // Find a German listing (XETRA, Frankfurt, etc.)
    for (const result of results) {
      const symbol = result.symbol || '';
      if (
        symbol.endsWith('.DE') ||
        symbol.endsWith('.F') ||
        symbol.endsWith('.MU') ||
        symbol.endsWith('.SG')
      ) {
        return symbol;
      }
    }

    return null;
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

    // Fallback: Try searching by company name
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

        setCache(cacheKey, result);
        return res.status(200).json(result);
      }
    }

    // No German listing found
    return res.status(404).json({
      error: 'No EU listing found',
      triedVariants: variants,
      searchedSymbol: searchedSymbol || 'none found'
    });
  } catch (error) {
    console.error('EU Quote error:', error);
    return res.status(500).json({ error: 'Failed to fetch EU quote' });
  }
}
