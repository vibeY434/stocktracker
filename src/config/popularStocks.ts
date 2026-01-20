// Popular stocks to prefetch - combination of:
// 1. Stocks from the US->DE mapping (portfolio relevant)
// 2. Top traded stocks on NASDAQ/NYSE

export interface PopularStock {
  symbol: string;
  name: string;
  exchange: string;
}

// Portfolio stocks from mapping + top volume stocks
export const POPULAR_STOCKS: PopularStock[] = [
  // Mega caps - highest volume
  { symbol: 'NVDA', name: 'NVIDIA Corporation', exchange: 'NASDAQ' },
  { symbol: 'AAPL', name: 'Apple Inc.', exchange: 'NASDAQ' },
  { symbol: 'MSFT', name: 'Microsoft Corporation', exchange: 'NASDAQ' },
  { symbol: 'AMZN', name: 'Amazon.com Inc.', exchange: 'NASDAQ' },
  { symbol: 'GOOGL', name: 'Alphabet Inc.', exchange: 'NASDAQ' },
  { symbol: 'META', name: 'Meta Platforms Inc.', exchange: 'NASDAQ' },
  { symbol: 'TSLA', name: 'Tesla Inc.', exchange: 'NASDAQ' },
  { symbol: 'AMD', name: 'Advanced Micro Devices', exchange: 'NASDAQ' },

  // Portfolio favorites
  { symbol: 'HIMS', name: 'Hims & Hers Health', exchange: 'NYSE' },
  { symbol: 'PLTR', name: 'Palantir Technologies', exchange: 'NYSE' },
  { symbol: 'SOFI', name: 'SoFi Technologies', exchange: 'NASDAQ' },
  { symbol: 'NIO', name: 'NIO Inc.', exchange: 'NYSE' },
  { symbol: 'BABA', name: 'Alibaba Group', exchange: 'NYSE' },
  { symbol: 'COIN', name: 'Coinbase Global', exchange: 'NASDAQ' },
  { symbol: 'ASTS', name: 'AST SpaceMobile', exchange: 'NASDAQ' },
  { symbol: 'RIVN', name: 'Rivian Automotive', exchange: 'NASDAQ' },

  // High volume tech
  { symbol: 'INTC', name: 'Intel Corporation', exchange: 'NASDAQ' },
  { symbol: 'NFLX', name: 'Netflix Inc.', exchange: 'NASDAQ' },
  { symbol: 'CRM', name: 'Salesforce Inc.', exchange: 'NYSE' },
  { symbol: 'PYPL', name: 'PayPal Holdings', exchange: 'NASDAQ' },
  { symbol: 'UBER', name: 'Uber Technologies', exchange: 'NYSE' },
  { symbol: 'SHOP', name: 'Shopify Inc.', exchange: 'NYSE' },

  // Finance & Healthcare
  { symbol: 'JPM', name: 'JPMorgan Chase', exchange: 'NYSE' },
  { symbol: 'BAC', name: 'Bank of America', exchange: 'NYSE' },
  { symbol: 'UNH', name: 'UnitedHealth Group', exchange: 'NYSE' },
  { symbol: 'JNJ', name: 'Johnson & Johnson', exchange: 'NYSE' },
  { symbol: 'PFE', name: 'Pfizer Inc.', exchange: 'NYSE' },
  { symbol: 'NVO', name: 'Novo Nordisk', exchange: 'NYSE' },

  // Consumer & Retail
  { symbol: 'WMT', name: 'Walmart Inc.', exchange: 'NYSE' },
  { symbol: 'HD', name: 'Home Depot', exchange: 'NYSE' },
  { symbol: 'NKE', name: 'Nike Inc.', exchange: 'NYSE' },
  { symbol: 'SBUX', name: 'Starbucks Corp.', exchange: 'NASDAQ' },
  { symbol: 'MCD', name: 'McDonald\'s Corp.', exchange: 'NYSE' },
  { symbol: 'DIS', name: 'Walt Disney Co.', exchange: 'NYSE' },

  // Energy & Industrial
  { symbol: 'XOM', name: 'Exxon Mobil', exchange: 'NYSE' },
  { symbol: 'CVX', name: 'Chevron Corp.', exchange: 'NYSE' },
  { symbol: 'BA', name: 'Boeing Co.', exchange: 'NYSE' },
  { symbol: 'CAT', name: 'Caterpillar Inc.', exchange: 'NYSE' },

  // Chinese ADRs
  { symbol: 'BIDU', name: 'Baidu Inc.', exchange: 'NASDAQ' },
  { symbol: 'JD', name: 'JD.com Inc.', exchange: 'NASDAQ' },
  { symbol: 'GRAB', name: 'Grab Holdings', exchange: 'NASDAQ' },

  // Growth stocks
  { symbol: 'CRWD', name: 'CrowdStrike Holdings', exchange: 'NASDAQ' },
  { symbol: 'SNOW', name: 'Snowflake Inc.', exchange: 'NYSE' },
  { symbol: 'DDOG', name: 'Datadog Inc.', exchange: 'NASDAQ' },
  { symbol: 'NET', name: 'Cloudflare Inc.', exchange: 'NYSE' },
  { symbol: 'ABNB', name: 'Airbnb Inc.', exchange: 'NASDAQ' },
  { symbol: 'RBLX', name: 'Roblox Corp.', exchange: 'NYSE' },
  { symbol: 'HOOD', name: 'Robinhood Markets', exchange: 'NASDAQ' },
  { symbol: 'SMCI', name: 'Super Micro Computer', exchange: 'NASDAQ' },
];

// Get a random subset for display on landing page
export function getRandomPopularStocks(count: number = 12): PopularStock[] {
  const shuffled = [...POPULAR_STOCKS].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

// Get stocks grouped by category for landing page
export function getStocksByCategory() {
  return {
    tech: POPULAR_STOCKS.filter(s =>
      ['NVDA', 'AAPL', 'MSFT', 'GOOGL', 'META', 'AMD', 'INTC'].includes(s.symbol)
    ),
    growth: POPULAR_STOCKS.filter(s =>
      ['HIMS', 'PLTR', 'SOFI', 'ASTS', 'COIN', 'RIVN', 'HOOD'].includes(s.symbol)
    ),
    healthcare: POPULAR_STOCKS.filter(s =>
      ['UNH', 'JNJ', 'PFE', 'NVO'].includes(s.symbol)
    ),
    chinese: POPULAR_STOCKS.filter(s =>
      ['BABA', 'BIDU', 'JD', 'NIO', 'GRAB'].includes(s.symbol)
    ),
  };
}
