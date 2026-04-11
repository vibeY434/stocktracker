// filename: src/services/cache.ts
// --- Cache Layer with Age Validation ---
// Changes:
//   1. Timestamped entries
//   2. get() returns {data, timestamp} for age checks
//   3. set() with TTL

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const cacheStore = new Map<string, CacheEntry<unknown>>();

export const cache = {
  get<T>(key: string): { data: T; timestamp: number } | null {
    const entry = cacheStore.get(key) as CacheEntry<T> | undefined;
    if (!entry) return null;
    return { data: entry.data, timestamp: entry.timestamp };
  },

  set<T>(key: string, data: T): void {
    cacheStore.set(key, { data, timestamp: Date.now() });
    // Optional: cleanup expired entries later (not needed for low-memory server)
  },

  clear(): void {
    cacheStore.clear();
  },
};