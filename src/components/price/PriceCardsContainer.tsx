import { PriceCard } from './PriceCard';
import { FxRateDisplay } from './FxRateDisplay';
import { useStockQuote, useEuQuote, useFxRate } from '@/hooks';

interface PriceCardsContainerProps {
  symbol: string;
}

// Check if symbol is already an EU listing
function isEuSymbol(symbol: string): boolean {
  const euSuffixes = ['.DE', '.F', '.MU', '.SG', '.HM', '.DU', '.BE'];
  return euSuffixes.some(suffix => symbol.toUpperCase().endsWith(suffix));
}

// Get US equivalent for EU symbol (remove suffix)
function getUsSymbol(symbol: string): string | null {
  const euSuffixes = ['.DE', '.F', '.MU', '.SG', '.HM', '.DU', '.BE'];
  for (const suffix of euSuffixes) {
    if (symbol.toUpperCase().endsWith(suffix)) {
      const base = symbol.slice(0, -suffix.length);
      // Only return if it looks like a valid US ticker (not German tickers like ENR)
      if (base.length <= 5) {
        return base;
      }
      return null;
    }
  }
  return null;
}

export function PriceCardsContainer({ symbol }: PriceCardsContainerProps) {
  const isEu = isEuSymbol(symbol);

  // If EU symbol entered, use it for EU quote and try to find US equivalent
  const euSymbol = isEu ? symbol : null;
  const usSymbol = isEu ? getUsSymbol(symbol) : symbol;

  // For EU symbols, we swap the logic
  const { data: primaryQuote, isLoading: isLoadingPrimary } = useStockQuote(symbol);
  const { data: secondaryQuote, isLoading: isLoadingSecondary } = useEuQuote(isEu ? (usSymbol || '') : symbol);

  const { data: fxRate, isLoading: isLoadingFx } = useFxRate('USD', 'EUR');

  // Determine which quote goes where based on currency/exchange
  const usQuote = isEu ? secondaryQuote : primaryQuote;
  const euQuote = isEu ? primaryQuote : secondaryQuote;

  const isLoadingUs = isEu ? isLoadingSecondary : isLoadingPrimary;
  const isLoadingEu = isEu ? isLoadingPrimary : isLoadingSecondary;

  // Check if we should show US card at all (some EU stocks have no US listing)
  const showUsCard = !isEu || (usSymbol !== null);

  return (
    <div className="mb-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {showUsCard ? (
          <PriceCard
            title="US Market"
            quote={usQuote}
            isLoading={isLoadingUs}
            notAvailable={!isLoadingUs && !usQuote}
          />
        ) : (
          <PriceCard
            title="US Market"
            quote={null}
            isLoading={false}
            notAvailable={true}
          />
        )}
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
