import { apiClient } from './client';
import type { StockQuote, CompanyInfo, Fundamentals, HistoricalDataPoint, SearchResult } from '@/types';

// EU exchange suffixes to try (in order of preference)
const EU_SUFFIXES = ['.DE', '.F', '.MU', '.SG', '.BE'];

export const stockApi = {
  async search(query: string): Promise<SearchResult[]> {
    const { data } = await apiClient.get<SearchResult[]>('/search', {
      params: { q: query },
    });
    return data;
  },

  async getQuote(symbol: string): Promise<StockQuote> {
    const { data } = await apiClient.get<StockQuote>('/quote', {
      params: { symbol },
    });
    return {
      ...data,
      timestamp: new Date(data.timestamp),
    };
  },

  async getEuQuote(usSymbol: string): Promise<StockQuote | null> {
    // Try multiple EU exchanges
    for (const suffix of EU_SUFFIXES) {
      try {
        const euSymbol = `${usSymbol}${suffix}`;
        const { data } = await apiClient.get<StockQuote>('/quote', {
          params: { symbol: euSymbol },
        });
        // Verify we got valid data
        if (data && data.price) {
          return {
            ...data,
            timestamp: new Date(data.timestamp),
          };
        }
      } catch {
        // Try next suffix
        continue;
      }
    }
    // No EU listing found
    return null;
  },

  async getCompanyInfo(symbol: string): Promise<CompanyInfo> {
    const { data } = await apiClient.get<CompanyInfo>('/company', {
      params: { symbol },
    });
    return data;
  },

  async getFundamentals(symbol: string): Promise<Fundamentals> {
    const { data } = await apiClient.get<Fundamentals>('/fundamentals', {
      params: { symbol },
    });
    return data;
  },

  async getHistorical(symbol: string, range: string = '1y'): Promise<HistoricalDataPoint[]> {
    const { data } = await apiClient.get<HistoricalDataPoint[]>('/historical', {
      params: { symbol, range },
    });
    return data.map((point) => ({
      ...point,
      date: new Date(point.date),
    }));
  },
};
