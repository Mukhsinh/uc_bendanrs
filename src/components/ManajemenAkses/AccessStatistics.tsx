import { RoleStatCard } from './RoleStatCard';
import { Skeleton } from '@/components/ui/skeleton';
import type { RoleStatistics } from '@/services/roleAccessService';

interface AccessStatisticsProps {
  statistics: RoleStatistics[];
  isLoading?: boolean;
}

export const AccessStatistics = ({ statistics, isLoading }: AccessStatisticsProps) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-6">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-48" />
        ))}
      </div>
    );
  }

  if (statistics.length === 0) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-6">
      {statistics.map((stat) => (
        <RoleStatCard key={stat.roleId} stats={stat} />
      ))}
    </div>
  );
};
