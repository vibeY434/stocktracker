import { apiClient } from './client';
import type { StockQuote, CompanyInfo, Fundamentals, HistoricalDataPoint, SearchResult } from '@/types';

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
    try {
      // Use the new EU quote endpoint that searches by company name
      const { data } = await apiClient.get<StockQuote>('/euquote', {
        params: { symbol: usSymbol },
      });
      if (data && data.price) {
        return {
          ...data,
          timestamp: new Date(data.timestamp),
        };
      }
      return null;
    } catch {
      return null;
    }
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
