import { useQuery } from '@tanstack/react-query';
import { stockApi } from '@/services/api';
import { useDebounce } from './useDebounce';
import { CACHE_TIMES } from '@/utils';

export function useStockSearch(query: string) {
  const debouncedQuery = useDebounce(query, 300);

  return useQuery({
    queryKey: ['search', debouncedQuery],
    queryFn: () => stockApi.search(debouncedQuery),
    enabled: debouncedQuery.length >= 1,
    staleTime: CACHE_TIMES.QUOTE,
  });
}
