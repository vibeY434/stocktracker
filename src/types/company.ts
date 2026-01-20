export interface CompanyInfo {
  name: string;
  symbol: string;
  isin: string | null;
  sector: string;
  industry: string;
  exchange: string;
  currency: string;
  country: string;
}

export interface Fundamentals {
  marketCap: number | null;
  peRatioTTM: number | null;
  dividendYield: number | null;
  revenueGrowthYoY: number | null;
  beta: number | null;
}
