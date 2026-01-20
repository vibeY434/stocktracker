import { Info, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { clsx } from 'clsx';
import { Card, CardHeader, CardTitle, Tooltip, Skeleton } from '@/components/ui';

interface BetaDisplayProps {
  beta: number | null | undefined;
  isLoading: boolean;
}

function getBetaInterpretation(beta: number): {
  label: string;
  description: string;
  icon: typeof TrendingUp;
  color: string;
} {
  if (beta < 0.8) {
    return {
      label: 'Low Volatility',
      description: 'Less volatile than the market',
      icon: TrendingDown,
      color: 'text-green-600',
    };
  }
  if (beta <= 1.2) {
    return {
      label: 'Market-aligned',
      description: 'Similar volatility to the market',
      icon: Minus,
      color: 'text-gray-600',
    };
  }
  return {
    label: 'High Volatility',
    description: 'More volatile than the market',
    icon: TrendingUp,
    color: 'text-orange-600',
  };
}

const betaTooltipContent = (
  <div className="space-y-2">
    <p className="font-semibold">Beta (vs S&P 500)</p>
    <p>Measures stock volatility relative to the overall market.</p>
    <ul className="list-disc list-inside text-xs space-y-1">
      <li><strong>Beta &lt; 1.0</strong> = Less volatile than the market</li>
      <li><strong>Beta = 1.0</strong> = Same volatility as the market</li>
      <li><strong>Beta &gt; 1.0</strong> = More volatile than the market</li>
    </ul>
    <p className="text-xs text-gray-300 mt-2">Source: Yahoo Finance</p>
  </div>
);

export function BetaDisplay({ beta, isLoading }: BetaDisplayProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Risk Parameters</CardTitle>
        </CardHeader>
        <Skeleton className="h-16 w-full" />
      </Card>
    );
  }

  if (beta === null || beta === undefined) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Risk Parameters</CardTitle>
        </CardHeader>
        <div className="text-center py-4 text-gray-400">
          Beta not available
        </div>
      </Card>
    );
  }

  const interpretation = getBetaInterpretation(beta);
  const Icon = interpretation.icon;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Risk Parameters</CardTitle>
        <Tooltip content={betaTooltipContent}>
          <Info className="w-4 h-4 text-gray-400 cursor-help" />
        </Tooltip>
      </CardHeader>

      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
        <div>
          <div className="text-sm text-gray-500">Beta (Yahoo Finance)</div>
          <div className="text-2xl font-bold text-gray-900">
            {beta.toFixed(2)}
          </div>
        </div>
        <div className={clsx('flex items-center gap-2', interpretation.color)}>
          <Icon className="w-5 h-5" />
          <div className="text-right">
            <div className="font-medium">{interpretation.label}</div>
            <div className="text-xs text-gray-500">{interpretation.description}</div>
          </div>
        </div>
      </div>
    </Card>
  );
}
