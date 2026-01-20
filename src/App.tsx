import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/config/queryClient';
import { Header, Footer, Container } from '@/components/layout';
import { TickerSearch } from '@/components/search';
import { StockOverview } from '@/components/StockOverview';

function App() {
  return (
    <QueryClientProvider client={queryClient}>
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
    </QueryClientProvider>
  );
}

export default App;
