import { useQuery } from '@tanstack/react-query';
import { stockApi } from '@/services/api';
import { CACHE_TIMES } from '@/utils';

export function useStockQuote(symbol: string | null) {
  return useQuery({
    queryKey: ['quote', symbol],
    queryFn: () => stockApi.getQuote(symbol!),
    enabled: !!symbol,
    staleTime: CACHE_TIMES.QUOTE,
    refetchInterval: CACHE_TIMES.QUOTE,
  });
}

export function useEuQuote(usSymbol: string | null) {
  return useQuery({
    queryKey: ['euQuote', usSymbol],
    queryFn: () => stockApi.getEuQuote(usSymbol!),
    enabled: !!usSymbol,
    staleTime: CACHE_TIMES.QUOTE,
    refetchInterval: CACHE_TIMES.QUOTE,
  });
}
