import { useState, useRef, useEffect } from 'react';
import { SearchInput } from './SearchInput';
import { SearchResults } from './SearchResults';
import { useStockSearch } from '@/hooks';
import { useAppStore } from '@/store/useAppStore';
import type { SearchResult } from '@/types';

export function TickerSearch() {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const { searchQuery, setSearchQuery, setSelectedStock, selectedStock } = useAppStore();
  const { data: results = [], isLoading } = useStockSearch(searchQuery);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (result: SearchResult) => {
    setSelectedStock({
      symbol: result.symbol,
      name: result.name,
      exchange: result.exchange,
    });
    setIsOpen(false);
  };

  const handleClear = () => {
    setSearchQuery('');
    setIsOpen(false);
  };

  const handleInputChange = (value: string) => {
    setSearchQuery(value);
    setIsOpen(value.length > 0);
  };

  return (
    <div ref={containerRef} className="relative w-full max-w-xl mx-auto">
      <SearchInput
        value={searchQuery}
        onChange={handleInputChange}
        onClear={handleClear}
        isLoading={isLoading}
        placeholder={
          selectedStock
            ? `${selectedStock.symbol} - ${selectedStock.name}`
            : 'Search ticker or company (e.g., AAPL, Amazon)...'
        }
      />
      {isOpen && (
        <SearchResults
          results={results}
          onSelect={handleSelect}
          isLoading={isLoading && searchQuery.length > 0}
        />
      )}
    </div>
  );
}
