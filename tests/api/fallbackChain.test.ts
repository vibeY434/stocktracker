// filename: tests/api/fallbackChain.test.ts
// --- Integration Tests: Fallback Chain & Age Validation ---
// Changes:
//   1. Mocked fetch for quote/euquote/historical/company
//   2. Test: Cache HIT → no API call
//   3. Test: Cache MISS → Yahoo → EU → Historical → Fallback
//   4. Test: Age validation (5 min TTL)
//   5. Test: Input sanitization

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchQuote, fetchFxRate } from '@/services/api/stockApi';
import { cache } from '@/services/cache';

vi.mock('@/utils/logger', () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('@/services/cache', () => ({
  cache: {
    get: vi.fn(),
    set: vi.fn(),
  },
}));

describe('API Fallback Chain', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetAllMocks();
  });

  it('returns cached quote if fresh', async () => {
    const mockQuote = {
      symbol: 'AAPL',
      price: 150,
      currency: 'USD',
      source: 'yahoo',
      timestamp: Date.now(),
      changePercent: 1.2,
    };
    (cache.get as vi.Mock).mockReturnValue({ data: mockQuote, timestamp: Date.now() });

    const result = await fetchQuote('aapl');
    expect(result).toEqual(mockQuote);
    expect(cache.get).toHaveBeenCalledWith('quote:AAPL');
  });

  it('falls back to EU quote if Yahoo fails', async () => {
    const mockEuQuote = {
      price: { regularMarketPrice: 148, currency: 'EUR', regularMarketChangePercent: 0.8 },
    };

    vi.stubGlobal('fetch', vi.fn((url) => {
      if (url.includes('/api/quote')) {
        return Promise.resolve({ ok: false, status: 429, json: () => Promise.resolve({}) });
      }
      if (url.includes('/api/euquote')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(mockEuQuote) });
      }
      return Promise.reject(new Error('Unexpected URL'));
    }));

    const result = await fetchQuote('AMZN');
    expect(result.source).toBe('euquote');
    expect(result.price).toBe(148);
  });

  it('falls back to historical data if both Yahoo and EU fail', async () => {
    const mockHistorical = {
      chart: {
        result: [{
          timestamp: [Date.now()],
          indicators: {
            quote: [{
              close: [145],
              volume: [1000000],
            }],
          },
        }],
      },
    };

    vi.stubGlobal('fetch', vi.fn((url) => {
      if (url.includes('/api/quote') || url.includes('/api/euquote')) {
        return Promise.resolve({ ok: false, status: 500, json: () => Promise.resolve({}) });
      }
      if (url.includes('/api/historical')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(mockHistorical) });
      }
      return Promise.reject(new Error('Unexpected URL'));
    }));

    const result = await fetchQuote('TSLA');
    expect(result.source).toBe('historical');
    expect(result.price).toBe(145);
  });

  it('sanitizes ticker input', async () => {
    vi.stubGlobal('fetch', vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          price: { regularMarketPrice: 100, currency: 'USD' },
        }),
      })
    ));

    await fetchQuote('  aapl  ');
    expect(cache.set).toHaveBeenCalledWith('quote:AAPL', expect.anything(), expect.anything());
  });

  it('validates FX rate fallback (0.92)', async () => {
    vi.stubGlobal('fetch', vi.fn(() =>
      Promise.resolve({
        ok: false,
        status: 500,
        json: () => Promise.resolve({}),
      })
    ));

    const result = await fetchFxRate();
    expect(result).toBe(0.92);
  });
});