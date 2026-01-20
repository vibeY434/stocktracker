import { useAppStore } from '@/store/useAppStore';
import { useCompanyInfo, useFundamentals, useStockQuote, useHistoricalData } from '@/hooks';
import { CompanyHeader } from './company';
import { PriceCardsContainer } from './price';
import { MarketHoursOverview } from './market';
import { BetaDisplay } from './risk';
import { QuickFundamentals } from './fundamentals';
import { LongInvestorSignals } from './signals';

export function StockOverview() {
  const { selectedStock } = useAppStore();

  const symbol = selectedStock?.symbol || null;

  const { data: companyInfo, isLoading: isLoadingCompany } = useCompanyInfo(symbol);
  const { data: fundamentals, isLoading: isLoadingFundamentals } = useFundamentals(symbol);
  const { data: usQuote, isLoading: isLoadingQuote } = useStockQuote(symbol);
  const { data: historicalData, isLoading: isLoadingHistorical } = useHistoricalData(symbol);

  if (!selectedStock) {
    return (
      <div className="text-center py-16">
        <p className="text-xl text-gray-500 mb-2">
          Search for a stock to get started
        </p>
        <p className="text-sm text-gray-400">
          Enter a ticker symbol (AAPL, MSFT) or company name (Apple, Microsoft)
        </p>
      </div>
    );
  }

  return (
    <div>
      <CompanyHeader
        company={companyInfo}
        stockName={selectedStock.name}
        isLoading={isLoadingCompany}
      />

      <PriceCardsContainer symbol={symbol!} />

      <MarketHoursOverview />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <BetaDisplay
          beta={fundamentals?.beta}
          isLoading={isLoadingFundamentals}
        />
        <QuickFundamentals
          fundamentals={fundamentals}
          isLoading={isLoadingFundamentals}
        />
      </div>

      <LongInvestorSignals
        historicalData={historicalData}
        currentPrice={usQuote?.price}
        currency={usQuote?.currency || 'USD'}
        isLoading={isLoadingHistorical || isLoadingQuote}
      />
    </div>
  );
}
