import { useQuery } from '@tanstack/react-query';
import { stockApi } from '@/services/api';
import { CACHE_TIMES } from '@/utils';

export function useCompanyInfo(symbol: string | null) {
  return useQuery({
    queryKey: ['company', symbol],
    queryFn: () => stockApi.getCompanyInfo(symbol!),
    enabled: !!symbol,
    staleTime: CACHE_TIMES.COMPANY_INFO,
  });
}
