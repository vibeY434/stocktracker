import { useMemo } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { getRandomPopularStocks, type PopularStock } from '@/config/popularStocks';

export function PopularStockChips() {
  const { setSelectedStock } = useAppStore();

  // Get random popular stocks on mount (stable during session)
  const popularStocks = useMemo(() => getRandomPopularStocks(12), []);

  const handleSelect = (stock: PopularStock) => {
    setSelectedStock({
      symbol: stock.symbol,
      name: stock.name,
      exchange: stock.exchange,
    });
  };

  return (
    <div>
      <p className="text-sm text-gray-500 mb-3">Popular stocks:</p>
      <div className="flex flex-wrap gap-2">
        {popularStocks.map((stock) => (
          <button
            key={stock.symbol}
            onClick={() => handleSelect(stock)}
            className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium
                       bg-gray-100 text-gray-700 hover:bg-blue-100 hover:text-blue-700
                       transition-colors duration-150 border border-transparent hover:border-blue-200"
          >
            <span className="font-semibold">{stock.symbol}</span>
            <span className="ml-1.5 text-gray-400 text-xs hidden sm:inline">
              {stock.name.length > 15 ? stock.name.slice(0, 15) + '...' : stock.name}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
