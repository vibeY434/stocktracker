import { Card, CardHeader, CardTitle, SkeletonCard } from '@/components/ui';
import { PriceDisplay } from './PriceDisplay';
import { MarketStatus } from './MarketStatus';
import { VolumeIndicator } from './VolumeIndicator';
import { formatTimestamp } from '@/utils';
import type { StockQuote } from '@/types';

interface PriceCardProps {
  title: string;
  quote: StockQuote | null | undefined;
  isLoading: boolean;
  notAvailable?: boolean;
}

export function PriceCard({ title, quote, isLoading, notAvailable }: PriceCardProps) {
  if (isLoading) {
    return <SkeletonCard />;
  }

  if (notAvailable || !quote) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <div className="text-center py-8 text-gray-400">
          Not available
        </div>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{title}</CardTitle>
        <MarketStatus state={quote.marketState} exchange={quote.exchange} />
      </CardHeader>

      <PriceDisplay
        price={quote.price}
        currency={quote.currency}
        change={quote.change}
        changePercent={quote.changePercent}
      />

      <div className="mt-4 pt-4 border-t border-gray-100">
        <VolumeIndicator
          volume={quote.volume}
          avgVolume={quote.avgVolume30d}
        />
      </div>

      <div className="mt-3 text-xs text-gray-400">
        Last updated: {formatTimestamp(quote.timestamp)}
      </div>
    </Card>
  );
}
