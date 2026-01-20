import { TrendingUp, Globe, BarChart3, Clock } from 'lucide-react';
import { TickerSearch } from '@/components/search';
import { PopularStockChips } from './PopularStockChips';

export function LandingPage() {
  return (
    <div className="min-h-[calc(100vh-180px)] flex flex-col items-center justify-center px-4 py-12">
      {/* Hero Section */}
      <div className="text-center mb-8">
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
          Stock Overview
        </h1>
        <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto">
          Real-time US & EU market data for long-term investors
        </p>
      </div>

      {/* Search Card */}
      <div className="w-full max-w-2xl">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6 md:p-8">
          <div className="mb-6">
            <TickerSearch />
          </div>

          {/* Popular Stocks */}
          <PopularStockChips />
        </div>
      </div>

      {/* Features Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mt-12 max-w-3xl w-full">
        <FeatureCard
          icon={<Globe className="w-6 h-6" />}
          title="Dual Markets"
          description="US & EU prices"
        />
        <FeatureCard
          icon={<TrendingUp className="w-6 h-6" />}
          title="SMA Signals"
          description="50 & 200 day"
        />
        <FeatureCard
          icon={<BarChart3 className="w-6 h-6" />}
          title="Fundamentals"
          description="P/E, Beta, Yield"
        />
        <FeatureCard
          icon={<Clock className="w-6 h-6" />}
          title="Market Hours"
          description="Live status"
        />
      </div>
    </div>
  );
}

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

function FeatureCard({ icon, title, description }: FeatureCardProps) {
  return (
    <div className="bg-white/60 backdrop-blur rounded-xl p-4 text-center border border-gray-100">
      <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-50 text-blue-600 rounded-lg mb-3">
        {icon}
      </div>
      <h3 className="font-semibold text-gray-900 text-sm">{title}</h3>
      <p className="text-xs text-gray-500 mt-1">{description}</p>
    </div>
  );
}
