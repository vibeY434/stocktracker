import { ArrowRightLeft } from 'lucide-react';
import type { FxRate } from '@/types';
import { formatTimestamp } from '@/utils';
import { Skeleton } from '@/components/ui';

interface FxRateDisplayProps {
  fxRate: FxRate | undefined;
  isLoading: boolean;
}

export function FxRateDisplay({ fxRate, isLoading }: FxRateDisplayProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-2">
        <Skeleton className="h-4 w-32" />
      </div>
    );
  }

  if (!fxRate) {
    return null;
  }

  return (
    <div className="flex items-center justify-center gap-2 py-2 text-sm text-gray-500">
      <ArrowRightLeft className="w-4 h-4" />
      <span>
        1 {fxRate.from} = {fxRate.rate.toFixed(4)} {fxRate.to}
      </span>
      <span className="text-gray-400">
        (ECB, {formatTimestamp(fxRate.timestamp, false)})
      </span>
    </div>
  );
}
