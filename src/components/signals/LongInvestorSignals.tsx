import { TrendingUp, TrendingDown, Activity } from 'lucide-react';
import { clsx } from 'clsx';
import { Card, CardHeader, CardTitle, Skeleton, Tooltip } from '@/components/ui';
import { formatCurrency, formatPercent } from '@/utils';
import { calculateTechnicalSignals } from '@/services/calculations';
import type { HistoricalDataPoint } from '@/types';

interface LongInvestorSignalsProps {
  historicalData: HistoricalDataPoint[] | undefined;
  currentPrice: number | undefined;
  currency: string;
  isLoading: boolean;
}

interface SmaDistanceProps {
  label: string;
  smaValue: number;
  distancePercent: number;
  currency: string;
}

function SmaDistance({ label, smaValue, distancePercent, currency }: SmaDistanceProps) {
  const isAbove = distancePercent > 0;

  return (
    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
      <div>
        <div className="text-sm text-gray-500">{label}</div>
        <div className="text-sm text-gray-400">
          {formatCurrency(smaValue, currency)}
        </div>
      </div>
      <div className={clsx(
        'flex items-center gap-2 font-semibold',
        isAbove ? 'text-green-600' : 'text-red-600'
      )}>
        {isAbove ? (
          <TrendingUp className="w-5 h-5" />
        ) : (
          <TrendingDown className="w-5 h-5" />
        )}
        <span className="text-lg">{formatPercent(distancePercent)}</span>
      </div>
    </div>
  );
}

const signalsTooltipContent = (
  <div className="space-y-2">
    <p className="font-semibold">Moving Average Distance</p>
    <p>Shows the current price position relative to key moving averages.</p>
    <ul className="list-disc list-inside text-xs space-y-1">
      <li><strong>Above SMA</strong> = Price is higher than the average (positive signal)</li>
      <li><strong>Below SMA</strong> = Price is lower than the average (caution)</li>
    </ul>
    <p className="text-xs mt-2">
      <strong>50-day SMA:</strong> Short-term trend indicator<br />
      <strong>200-day SMA:</strong> Long-term trend indicator
    </p>
  </div>
);

export function LongInvestorSignals({
  historicalData,
  currentPrice,
  currency,
  isLoading,
}: LongInvestorSignalsProps) {
  if (isLoading) {
    return (
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Long-Investor Signals</CardTitle>
        </CardHeader>
        <div className="space-y-3">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      </Card>
    );
  }

  if (!historicalData || !currentPrice || historicalData.length < 200) {
    return (
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Long-Investor Signals</CardTitle>
        </CardHeader>
        <div className="text-center py-4 text-gray-400">
          Insufficient historical data for SMA calculations
        </div>
      </Card>
    );
  }

  const signals = calculateTechnicalSignals(historicalData, currentPrice);

  if (!signals) {
    return (
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Long-Investor Signals</CardTitle>
        </CardHeader>
        <div className="text-center py-4 text-gray-400">
          Unable to calculate signals
        </div>
      </Card>
    );
  }

  return (
    <Card className="mb-6">
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-gray-500" />
          <CardTitle>Long-Investor Signals</CardTitle>
        </div>
        <Tooltip content={signalsTooltipContent}>
          <span className="text-xs text-gray-400 cursor-help hover:text-gray-600">
            What's this?
          </span>
        </Tooltip>
      </CardHeader>
      <div className="space-y-3">
        <SmaDistance
          label="Distance to 50-Day SMA"
          smaValue={signals.sma50}
          distancePercent={signals.distanceToSma50Percent}
          currency={currency}
        />
        <SmaDistance
          label="Distance to 200-Day SMA"
          smaValue={signals.sma200}
          distancePercent={signals.distanceToSma200Percent}
          currency={currency}
        />
      </div>
      <div className="mt-3 text-xs text-gray-400 text-center">
        Above 200-day SMA indicates long-term uptrend
      </div>
    </Card>
  );
}
