import { Card, CardHeader, CardTitle, Skeleton } from '@/components/ui';
import { formatMarketCap, formatPercent, formatNumber } from '@/utils';
import type { Fundamentals } from '@/types';

interface QuickFundamentalsProps {
  fundamentals: Fundamentals | undefined;
  isLoading: boolean;
}

interface MetricProps {
  label: string;
  value: string | number | null;
  suffix?: string;
}

function Metric({ label, value, suffix = '' }: MetricProps) {
  return (
    <div className="p-3 bg-gray-50 rounded-lg">
      <div className="text-xs text-gray-500 mb-1">{label}</div>
      <div className="text-lg font-semibold text-gray-900">
        {value !== null && value !== undefined ? `${value}${suffix}` : 'N/A'}
      </div>
    </div>
  );
}

export function QuickFundamentals({ fundamentals, isLoading }: QuickFundamentalsProps) {
  if (isLoading) {
    return (
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Quick Fundamentals</CardTitle>
        </CardHeader>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      </Card>
    );
  }

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Quick Fundamentals</CardTitle>
      </CardHeader>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Metric
          label="Market Cap"
          value={fundamentals?.marketCap ? formatMarketCap(fundamentals.marketCap) : null}
        />
        <Metric
          label="P/E (TTM)"
          value={fundamentals?.peRatioTTM ? formatNumber(fundamentals.peRatioTTM, { maximumFractionDigits: 2 }) : null}
        />
        <Metric
          label="Dividend Yield"
          value={fundamentals?.dividendYield ? formatPercent(fundamentals.dividendYield, false) : null}
        />
        <Metric
          label="Revenue Growth (YoY)"
          value={fundamentals?.revenueGrowthYoY ? formatPercent(fundamentals.revenueGrowthYoY) : null}
        />
      </div>
    </Card>
  );
}
