import { PriceCard } from './PriceCard';
import { FxRateDisplay } from './FxRateDisplay';
import { useStockQuote, useEuQuote, useFxRate } from '@/hooks';
import { DE_TO_US_MAPPING, EU_SYMBOL_SUFFIXES } from '@/utils';

interface PriceCardsContainerProps {
  symbol: string;
}

// Check if symbol is already an EU listing
function isEuSymbol(symbol: string): boolean {
  return EU_SYMBOL_SUFFIXES.some((suffix) => symbol.toUpperCase().endsWith(suffix));
}

function getUsSymbol(symbol: string): string | null {
  return DE_TO_US_MAPPING[symbol.toUpperCase()] ?? null;
}

function getQuoteErrorMessage(error: unknown, fallback: string): string | undefined {
  if (!error) {
    return undefined;
  }

  const message = error instanceof Error ? error.message : fallback;

  if (message === 'API key not configured') {
    return `${fallback} The server API key is missing.`;
  }

  if (message === 'Rate limit exceeded') {
    return `${fallback} The upstream request limit was hit.`;
  }

  if (message === 'Origin not allowed') {
    return `${fallback} This app origin is not allowed by the API guard.`;
  }

  return `${fallback} ${message}`;
}

export function PriceCardsContainer({ symbol }: PriceCardsContainerProps) {
  const isEu = isEuSymbol(symbol);
  const usSymbol = isEu ? getUsSymbol(symbol) : symbol;
  const {
    data: primaryQuote,
    isLoading: isLoadingPrimary,
    error: primaryError,
  } = useStockQuote(symbol);
  const {
    data: secondaryQuote,
    isLoading: isLoadingSecondary,
    error: secondaryError,
  } = useEuQuote(isEu ? usSymbol : symbol);

  const { data: fxRate, isLoading: isLoadingFx } = useFxRate('USD', 'EUR');

  const usQuote = isEu ? secondaryQuote : primaryQuote;
  const euQuote = isEu ? primaryQuote : secondaryQuote;

  const isLoadingUs = isEu ? isLoadingSecondary : isLoadingPrimary;
  const isLoadingEu = isEu ? isLoadingPrimary : isLoadingSecondary;
  const showUsCard = !isEu || (usSymbol !== null);
  const usErrorMessage = showUsCard
    ? getQuoteErrorMessage(
        isEu ? secondaryError : primaryError,
        'US market data is unavailable right now.',
      )
    : undefined;
  const euErrorMessage = getQuoteErrorMessage(
    isEu ? primaryError : secondaryError,
    'EU market data is unavailable right now.',
  );

  return (
    <div className="mb-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {showUsCard ? (
          <PriceCard
            title="US Market"
            quote={usQuote}
            isLoading={isLoadingUs}
            errorMessage={usErrorMessage}
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
          errorMessage={euErrorMessage}
          notAvailable={!isLoadingEu && !euQuote}
        />
      </div>
      <FxRateDisplay fxRate={fxRate} isLoading={isLoadingFx} />
    </div>
  );
}
