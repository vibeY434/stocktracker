import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { stockApi } from '@/services/api/stockApi';
import { POPULAR_STOCKS } from '@/config/popularStocks';

// Prefetch stock data in the background
export function usePrefetchStocks() {
  const queryClient = useQueryClient();

  useEffect(() => {
    // Delay prefetching to not interfere with initial page load
    const timeoutId = setTimeout(() => {
      // Prefetch in batches to avoid overwhelming the API
      const batchSize = 5;
      let currentIndex = 0;

      const prefetchBatch = () => {
        const batch = POPULAR_STOCKS.slice(currentIndex, currentIndex + batchSize);

        batch.forEach((stock) => {
          // Prefetch US quote
          queryClient.prefetchQuery({
            queryKey: ['quote', stock.symbol],
            queryFn: () => stockApi.getQuote(stock.symbol),
            staleTime: 30 * 1000, // 30 seconds
          });

          // Prefetch EU quote
          queryClient.prefetchQuery({
            queryKey: ['euQuote', stock.symbol],
            queryFn: () => stockApi.getEuQuote(stock.symbol),
            staleTime: 30 * 1000,
          });
        });

        currentIndex += batchSize;

        // Continue with next batch after a delay
        if (currentIndex < POPULAR_STOCKS.length) {
          setTimeout(prefetchBatch, 2000); // 2 second delay between batches
        }
      };

      prefetchBatch();
    }, 1000); // Wait 1 second before starting prefetch

    return () => clearTimeout(timeoutId);
  }, [queryClient]);
}
