import { useQuery } from '@tanstack/react-query';
import { stockApi } from '@/services/api';
import { CACHE_TIMES } from '@/utils';

export function useHistoricalData(symbol: string | null, range: string = '1y') {
  return useQuery({
    queryKey: ['historical', symbol, range],
    queryFn: () => stockApi.getHistorical(symbol!, range),
    enabled: !!symbol,
    staleTime: CACHE_TIMES.HISTORICAL,
  });
}
