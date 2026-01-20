import { clsx } from 'clsx';
import type { SearchResult } from '@/types';
import { Badge } from '@/components/ui';

interface SearchResultsProps {
  results: SearchResult[];
  onSelect: (result: SearchResult) => void;
  isLoading: boolean;
}

export function SearchResults({ results, onSelect, isLoading }: SearchResultsProps) {
  if (isLoading) {
    return (
      <div className="absolute z-50 w-full mt-1 bg-white rounded-lg shadow-lg border border-gray-200 py-2">
        <div className="px-4 py-3 text-sm text-gray-500">Searching...</div>
      </div>
    );
  }

  if (results.length === 0) {
    return null;
  }

  return (
    <div className="absolute z-50 w-full mt-1 bg-white rounded-lg shadow-lg border border-gray-200 py-1 max-h-80 overflow-y-auto">
      {results.map((result) => (
        <button
          key={`${result.symbol}-${result.exchange}`}
          onClick={() => onSelect(result)}
          className={clsx(
            'w-full px-4 py-3 text-left',
            'hover:bg-gray-50 transition-colors',
            'flex items-center justify-between gap-4'
          )}
        >
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-gray-900">{result.symbol}</span>
              <Badge variant={result.region === 'US' ? 'info' : 'default'}>
                {result.exchangeDisplay}
              </Badge>
            </div>
            <p className="text-sm text-gray-500 truncate">{result.name}</p>
          </div>
          <div className="text-right text-sm text-gray-400">
            {result.currency}
          </div>
        </button>
      ))}
    </div>
  );
}
