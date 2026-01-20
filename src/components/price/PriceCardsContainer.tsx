import { PriceCard } from './PriceCard';
import { FxRateDisplay } from './FxRateDisplay';
import { useStockQuote, useEuQuote, useFxRate } from '@/hooks';

interface PriceCardsContainerProps {
  symbol: string;
}

export function PriceCardsContainer({ symbol }: PriceCardsContainerProps) {
  const { data: usQuote, isLoading: isLoadingUs } = useStockQuote(symbol);
  const { data: euQuote, isLoading: isLoadingEu } = useEuQuote(symbol);
  const { data: fxRate, isLoading: isLoadingFx } = useFxRate('USD', 'EUR');

  return (
    <div className="mb-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <PriceCard
          title="US Market"
          quote={usQuote}
          isLoading={isLoadingUs}
        />
        <PriceCard
          title="EU Market (XETRA)"
          quote={euQuote}
          isLoading={isLoadingEu}
          notAvailable={!isLoadingEu && !euQuote}
        />
      </div>
      <FxRateDisplay fxRate={fxRate} isLoading={isLoadingFx} />
    </div>
  );
}
