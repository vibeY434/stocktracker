import axios from 'axios';
import type { FxRate } from '@/types';

const FRANKFURTER_BASE = 'https://api.frankfurter.app';

export const fxApi = {
  async getRate(from: string = 'USD', to: string = 'EUR'): Promise<FxRate> {
    const { data } = await axios.get<{
      amount: number;
      base: string;
      date: string;
      rates: Record<string, number>;
    }>(`${FRANKFURTER_BASE}/latest`, {
      params: { from, to },
    });

    return {
      rate: data.rates[to],
      from: data.base,
      to,
      timestamp: new Date(data.date),
    };
  },
};
