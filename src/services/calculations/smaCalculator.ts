import type { HistoricalDataPoint, TechnicalSignals } from '@/types';

export function calculateSma(prices: number[], period: number): number | null {
  if (prices.length < period) {
    return null;
  }

  const relevantPrices = prices.slice(-period);
  const sum = relevantPrices.reduce((acc, price) => acc + price, 0);
  return sum / period;
}

export function calculateTechnicalSignals(
  historicalData: HistoricalDataPoint[],
  currentPrice: number
): TechnicalSignals | null {
  const closePrices = historicalData.map((d) => d.close);

  const sma50 = calculateSma(closePrices, 50);
  const sma200 = calculateSma(closePrices, 200);

  if (sma50 === null || sma200 === null) {
    return null;
  }

  return {
    sma50,
    sma200,
    currentPrice,
    distanceToSma50Percent: ((currentPrice - sma50) / sma50) * 100,
    distanceToSma200Percent: ((currentPrice - sma200) / sma200) * 100,
  };
}
