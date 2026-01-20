import { TrendingUp, TrendingDown } from 'lucide-react';
import { clsx } from 'clsx';
import { formatCurrency, formatPercent } from '@/utils';

interface PriceDisplayProps {
  price: number;
  currency: string;
  change: number;
  changePercent: number;
}

export function PriceDisplay({ price, currency, change, changePercent }: PriceDisplayProps) {
  const isPositive = change >= 0;

  return (
    <div>
      <div className="text-3xl font-bold text-gray-900">
        {formatCurrency(price, currency)}
      </div>
      <div className={clsx(
        'flex items-center gap-2 mt-1',
        isPositive ? 'text-green-600' : 'text-red-600'
      )}>
        {isPositive ? (
          <TrendingUp className="w-5 h-5" />
        ) : (
          <TrendingDown className="w-5 h-5" />
        )}
        <span className="font-semibold">
          {isPositive ? '+' : ''}{formatCurrency(change, currency, 2)}
        </span>
        <span className="font-semibold">
          ({formatPercent(changePercent)})
        </span>
      </div>
    </div>
  );
}
