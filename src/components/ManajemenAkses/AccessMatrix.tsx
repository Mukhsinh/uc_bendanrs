import { Table, TableBody, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { MenuRow } from './MenuRow';
import type { MatrixData, Role } from '@/services/roleAccessService';

interface AccessMatrixProps {
  data: MatrixData[];
  roles: Role[];
  isLoading?: boolean;
  onCellClick: (roleId: string, menuId: string) => void; // UUID string
  expandedMenus?: Set<string>;
  onToggleMenu?: (menuId: string) => void;
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

export const AccessMatrix = ({ data, roles, isLoading, onCellClick, expandedMenus, onToggleMenu }: AccessMatrixProps) => {
  if (isLoading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Tidak ada data menu yang ditemukan. Silakan sesuaikan filter pencarian Anda.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="max-h-[600px] overflow-auto">
        <Table>
          <TableHeader className="sticky top-0 bg-background z-10">
            <TableRow>
              <TableHead className="sticky left-0 bg-background z-20 min-w-[250px]">
                Menu
              </TableHead>
              {roles.map((role) => (
                <TableHead key={role.id} className="text-center min-w-[120px]">
                  <Badge className={`${getRoleBadgeColor(role.role_name)} text-white`}>
                    {role.role_name}
                  </Badge>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((item) => (
              <MenuRow
                key={item.menu.id}
                menu={item.menu}
                roles={roles}
                accessByRole={item.accessByRole}
                onCellClick={onCellClick}
                expandedMenus={expandedMenus}
                onToggleMenu={onToggleMenu}
              />
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
