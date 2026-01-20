// Prefetching disabled to conserve API rate limits
// Each page visit was consuming 100+ API calls (50 stocks × 2 endpoints)
// Re-enable only with a higher API tier or smarter caching strategy

export function usePrefetchStocks() {
  // Intentionally empty - prefetching disabled
  // The TanStack Query cache will still work for stocks the user actually views
}
