import { Clock } from 'lucide-react';
import { Card, CardHeader, CardTitle, Badge } from '@/components/ui';
import { getMarketState, getTimeUntilMarketEvent, formatCountdown } from '@/utils';
import type { MarketState } from '@/types';

interface MarketInfo {
  name: string;
  exchanges: string[];
  state: MarketState;
  countdown: { event: 'open' | 'close'; minutes: number } | null;
}

function getMarketInfo(): MarketInfo[] {
  const now = new Date();

  const usState = getMarketState('NYSE', now);
  const usCountdown = getTimeUntilMarketEvent('NYSE', now);

  const euState = getMarketState('XETRA', now);
  const euCountdown = getTimeUntilMarketEvent('XETRA', now);

  return [
    {
      name: 'US Markets',
      exchanges: ['NYSE', 'NASDAQ'],
      state: usState,
      countdown: usCountdown,
    },
    {
      name: 'EU Markets',
      exchanges: ['XETRA', 'gettex'],
      state: euState,
      countdown: euCountdown,
    },
  ];
}

const stateStyles: Record<MarketState, { bg: string; dot: string; label: string }> = {
  REGULAR: { bg: 'bg-green-100 text-green-700', dot: 'bg-green-500', label: 'Open' },
  PRE: { bg: 'bg-yellow-100 text-yellow-700', dot: 'bg-yellow-500', label: 'Pre-Market' },
  POST: { bg: 'bg-yellow-100 text-yellow-700', dot: 'bg-yellow-500', label: 'After Hours' },
  CLOSED: { bg: 'bg-gray-100 text-gray-600', dot: 'bg-gray-400', label: 'Closed' },
};

export function MarketHoursOverview() {
  const markets = getMarketInfo();

  return (
    <Card className="mb-6">
      <CardHeader className="flex flex-row items-center gap-2">
        <Clock className="w-4 h-4 text-gray-500" />
        <CardTitle>Market Status</CardTitle>
      </CardHeader>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {markets.map((market) => {
          const style = stateStyles[market.state];
          return (
            <div
              key={market.name}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
            >
              <div>
                <div className="font-medium text-gray-900">{market.name}</div>
                <div className="text-xs text-gray-500">
                  {market.exchanges.join(' / ')}
                </div>
              </div>
              <div className="text-right">
                <Badge className={style.bg}>
                  <span className={`w-2 h-2 rounded-full ${style.dot} mr-1.5`} />
                  {style.label}
                </Badge>
                {market.countdown && (
                  <div className="text-xs text-gray-500 mt-1">
                    {market.countdown.event === 'open' ? 'Opens in' : 'Closes in'}{' '}
                    {formatCountdown(market.countdown.minutes)}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
