import { useQuery } from '@tanstack/react-query';
import { stockApi } from '@/services/api';
import { CACHE_TIMES } from '@/utils';

export function useFundamentals(symbol: string | null) {
  return useQuery({
    queryKey: ['fundamentals', symbol],
    queryFn: () => stockApi.getFundamentals(symbol!),
    enabled: !!symbol,
    staleTime: CACHE_TIMES.FUNDAMENTALS,
  });
}
