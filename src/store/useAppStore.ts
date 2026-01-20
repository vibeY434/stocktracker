import { create } from 'zustand';

interface SelectedStock {
  symbol: string;
  name: string;
  exchange: string;
}

interface AppState {
  selectedStock: SelectedStock | null;
  searchQuery: string;
  setSelectedStock: (stock: SelectedStock | null) => void;
  setSearchQuery: (query: string) => void;
  clearSelection: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  selectedStock: null,
  searchQuery: '',
  setSelectedStock: (stock) => set({ selectedStock: stock, searchQuery: '' }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  clearSelection: () => set({ selectedStock: null, searchQuery: '' }),
}));
