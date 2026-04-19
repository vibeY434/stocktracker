/**
 * Shared in-memory cache factory for Vercel API functions.
 *
 * Each function creates its own cache instance with its own TTL so that
 * fast-moving data (quotes: 30 s) and slow-moving data (company info: 1 h)
 * don't share expiry windows.
 *
 * NOTE: Vercel serverless functions run in isolated Node.js instances, so
 * this cache lives only for the lifetime of a warm function instance. It is
 * intentionally lightweight — no persistence, no cross-instance sharing.
 */

interface CacheEntry {
  data: unknown;
  expiresAt: number;
}

export interface RouteCache {
  get<T>(key: string): T | null;
  set(key: string, data: unknown): void;
}

export function makeCache(ttlMs: number): RouteCache {
  const store = new Map<string, CacheEntry>();

  return {
    get<T>(key: string): T | null {
      const entry = store.get(key);
      if (!entry) return null;
      if (Date.now() > entry.expiresAt) {
        store.delete(key);
        return null;
      }
      return entry.data as T;
    },
    set(key: string, data: unknown): void {
      store.set(key, { data, expiresAt: Date.now() + ttlMs });
    },
  };
}

// Canonical TTL constants so every route uses the same values.
export const CACHE_TTL = {
  QUOTE: 30 * 1000,           // 30 seconds  — real-time price data
  SEARCH: 60 * 1000,          // 1 minute    — search results
  FUNDAMENTALS: 5 * 60 * 1000, // 5 minutes  — derived metrics
  HISTORICAL: 60 * 60 * 1000,  // 1 hour     — daily close prices
  COMPANY: 60 * 60 * 1000,     // 1 hour     — company metadata
} as const;
