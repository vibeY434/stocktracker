import { Building2 } from 'lucide-react';
import { Badge } from '@/components/ui';
import type { CompanyInfo } from '@/types';
import { Skeleton } from '@/components/ui';

interface CompanyHeaderProps {
  company: CompanyInfo | undefined;
  stockName?: string;
  isLoading: boolean;
}

export function CompanyHeader({ company, stockName, isLoading }: CompanyHeaderProps) {
  if (isLoading) {
    return (
      <div className="mb-6">
        <Skeleton className="h-8 w-64 mb-2" />
        <Skeleton className="h-4 w-48" />
      </div>
    );
  }

  const displayName = company?.name !== company?.symbol ? company?.name : stockName;

  return (
    <div className="mb-6">
      <div className="flex items-start gap-3">
        <div className="p-2 bg-blue-50 rounded-lg">
          <Building2 className="w-6 h-6 text-blue-600" />
        </div>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">
            {displayName || company?.symbol}
          </h1>
          <div className="flex flex-wrap items-center gap-2 mt-1">
            <span className="text-lg font-semibold text-gray-600">
              {company?.symbol}
            </span>
            {company?.isin && (
              <span className="text-sm text-gray-400">
                ISIN: {company.isin}
              </span>
            )}
          </div>
          <div className="flex flex-wrap gap-2 mt-2">
            {company?.sector && company.sector !== 'N/A' && (
              <Badge variant="default">{company.sector}</Badge>
            )}
            {company?.industry && company.industry !== 'N/A' && (
              <Badge variant="info">{company.industry}</Badge>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
