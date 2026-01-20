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
        <Skeleton className="h-4 w-48" />
      </div>
    );
  }

  if (!fxRate) {
    return null;
  }

  // Calculate reverse rate
  const reverseRate = 1 / fxRate.rate;

  return (
    <div className="flex items-center justify-center gap-3 py-3 text-sm text-gray-500">
      <ArrowRightLeft className="w-4 h-4 flex-shrink-0" />
      <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
        <span>
          1 {fxRate.to} = {reverseRate.toFixed(4)} {fxRate.from}
        </span>
        <span className="text-gray-300">|</span>
        <span>
          1 {fxRate.from} = {fxRate.rate.toFixed(4)} {fxRate.to}
        </span>
      </div>
      <span className="text-gray-400 text-xs">
        (ECB, {formatTimestamp(fxRate.timestamp, false)})
      </span>
    </div>
  );
}
