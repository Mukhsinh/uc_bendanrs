import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Shield, Eye, Lock, CheckCircle2 } from 'lucide-react';
import type { RoleStatistics } from '@/services/roleAccessService';

interface RoleStatCardProps {
  stats: RoleStatistics;
}

const getRoleBadgeColor = (roleName: string): string => {
  const colors: Record<string, string> = {
    'Super Admin': 'bg-purple-500',
    'Admin': 'bg-blue-500',
    'Manager': 'bg-green-500',
    'User': 'bg-yellow-500',
    'Guest': 'bg-gray-500'
  };
  return colors[roleName] || 'bg-gray-500';
};

export const RoleStatCard = ({ stats }: RoleStatCardProps) => {
  const badgeColor = getRoleBadgeColor(stats.roleName);
  
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Shield className="h-5 w-5" />
            {stats.roleName}
          </CardTitle>
          <Badge className={`${badgeColor} text-white`}>
            {stats.accessPercentage}%
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Access Count */}
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-muted-foreground">Menu Dapat Diakses</span>
            <span className="font-medium">
              {stats.accessibleMenus} / {stats.totalMenus}
            </span>
          </div>
          <Progress value={stats.accessPercentage} className="h-2" />
        </div>

        {/* Breakdown */}
        <div className="grid grid-cols-3 gap-2 text-sm">
          <div className="flex flex-col items-center p-2 bg-green-50 rounded-lg">
            <CheckCircle2 className="h-4 w-4 text-green-600 mb-1" />
            <span className="font-semibold text-green-700">{stats.fullAccessCount}</span>
            <span className="text-xs text-green-600">Penuh</span>
          </div>
          <div className="flex flex-col items-center p-2 bg-blue-50 rounded-lg">
            <Eye className="h-4 w-4 text-blue-600 mb-1" />
            <span className="font-semibold text-blue-700">{stats.readOnlyCount}</span>
            <span className="text-xs text-blue-600">Lihat</span>
          </div>
          <div className="flex flex-col items-center p-2 bg-gray-50 rounded-lg">
            <Lock className="h-4 w-4 text-gray-600 mb-1" />
            <span className="font-semibold text-gray-700">{stats.noAccessCount}</span>
            <span className="text-xs text-gray-600">Tidak</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
