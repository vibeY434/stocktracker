import { clsx } from 'clsx';
import type { MarketState } from '@/types';
import { Badge } from '@/components/ui';

interface MarketStatusProps {
  state: MarketState;
  exchange: string;
}

const stateConfig: Record<MarketState, { label: string; variant: 'success' | 'warning' | 'danger' | 'info' }> = {
  REGULAR: { label: 'Open', variant: 'success' },
  PRE: { label: 'Pre-Market', variant: 'warning' },
  POST: { label: 'After Hours', variant: 'warning' },
  CLOSED: { label: 'Closed', variant: 'danger' },
};

export function MarketStatus({ state, exchange }: MarketStatusProps) {
  const config = stateConfig[state] || stateConfig.CLOSED;

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-gray-500">{exchange}</span>
      <Badge variant={config.variant}>
        <span className={clsx(
          'w-2 h-2 rounded-full mr-1.5',
          config.variant === 'success' && 'bg-green-500',
          config.variant === 'warning' && 'bg-yellow-500',
          config.variant === 'danger' && 'bg-red-500',
          config.variant === 'info' && 'bg-blue-500'
        )} />
        {config.label}
      </Badge>
    </div>
  );
}
