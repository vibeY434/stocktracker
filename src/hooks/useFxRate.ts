import { useQuery } from '@tanstack/react-query';
import { fxApi } from '@/services/api';
import { CACHE_TIMES } from '@/utils';

export function useFxRate(from: string = 'USD', to: string = 'EUR') {
  return useQuery({
    queryKey: ['fxRate', from, to],
    queryFn: () => fxApi.getRate(from, to),
    staleTime: CACHE_TIMES.FX_RATE,
    refetchInterval: CACHE_TIMES.FX_RATE,
  });
}
