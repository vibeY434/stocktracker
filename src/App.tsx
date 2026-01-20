import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/config/queryClient';
import { Header, Footer, Container } from '@/components/layout';
import { TickerSearch } from '@/components/search';
import { StockOverview } from '@/components/StockOverview';
import { LandingPage } from '@/components/landing';
import { useAppStore } from '@/store/useAppStore';
import { usePrefetchStocks } from '@/hooks';

function AppContent() {
  const { selectedStock } = useAppStore();

  // Prefetch popular stocks in background
  usePrefetchStocks();

  // Show landing page when no stock is selected
  if (!selectedStock) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-gray-100 flex flex-col">
        <Header />
        <main className="flex-1">
          <LandingPage />
        </main>
        <Footer />
      </div>
    );
  }

  // Show stock overview when a stock is selected
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <Header />

      {/* Sticky search bar */}
      <div className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-3">
          <TickerSearch />
        </div>
      </div>

      <main className="flex-1">
        <Container>
          <StockOverview />
        </Container>
      </main>

      <Footer />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppContent />
    </QueryClientProvider>
  );
}

export default App;
