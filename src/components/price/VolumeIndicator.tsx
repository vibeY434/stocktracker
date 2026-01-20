import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { clsx } from 'clsx';
import { formatVolume, formatPercent } from '@/utils';
import { calculateVolumeComparison } from '@/services/calculations';

interface VolumeIndicatorProps {
  volume: number;
  avgVolume: number;
}

export function VolumeIndicator({ volume, avgVolume }: VolumeIndicatorProps) {
  const volumeDelta = calculateVolumeComparison(volume, avgVolume);
  const isAbove = volumeDelta > 5;
  const isBelow = volumeDelta < -5;

  return (
    <div className="flex items-center justify-between text-sm">
      <div>
        <span className="text-gray-500">Volume</span>
        <div className="font-medium text-gray-900">{formatVolume(volume)}</div>
      </div>
      <div className="text-right">
        <span className="text-gray-500">vs 30d avg</span>
        <div className={clsx(
          'font-medium flex items-center justify-end gap-1',
          isAbove && 'text-green-600',
          isBelow && 'text-red-600',
          !isAbove && !isBelow && 'text-gray-600'
        )}>
          {isAbove && <TrendingUp className="w-4 h-4" />}
          {isBelow && <TrendingDown className="w-4 h-4" />}
          {!isAbove && !isBelow && <Minus className="w-4 h-4" />}
          {formatPercent(volumeDelta)}
        </div>
      </div>
    </div>
  );
}
