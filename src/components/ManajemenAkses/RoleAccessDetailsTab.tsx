import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { AccessStatistics } from './AccessStatistics';
import { AccessMatrixToolbar } from './AccessMatrixToolbar';
import { AccessMatrix } from './AccessMatrix';
import { PermissionDetailDialog } from './PermissionDetailDialog';
import {
  fetchAllRoles,
  fetchAllMenuItems,
  fetchAllPermissions,
  buildAccessMatrix,
  filterMatrix,
  calculateStatistics
} from '@/services/roleAccessService';

export const RoleAccessDetailsTab = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [selectedCell, setSelectedCell] = useState<{ roleId: string; menuId: string } | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  // Fetch data dengan React Query
  const { data: roles, isLoading: rolesLoading, error: rolesError } = useQuery({
    queryKey: ['roles'],
    queryFn: fetchAllRoles,
    staleTime: 10 * 60 * 1000 // 10 minutes
  });

  const { data: menus, isLoading: menusLoading, error: menusError } = useQuery({
    queryKey: ['menu-items'],
    queryFn: fetchAllMenuItems,
    staleTime: 10 * 60 * 1000 // 10 minutes
  });

  const { data: permissions, isLoading: permissionsLoading, error: permissionsError } = useQuery({
    queryKey: ['role-permissions'],
    queryFn: fetchAllPermissions,
    staleTime: 5 * 60 * 1000 // 5 minutes
  });

  // Build matrix data
  const matrixData = useMemo(() => {
    if (!roles || !menus || !permissions) return [];
    return buildAccessMatrix(roles, menus, permissions);
  }, [roles, menus, permissions]);

  // Filter matrix
  const filteredData = useMemo(() => {
    return filterMatrix(matrixData, searchQuery, 'all');
  }, [matrixData, searchQuery]);

  // Calculate statistics
  const statistics = useMemo(() => {
    if (!roles || matrixData.length === 0) return [];
    return calculateStatistics(matrixData, roles);
  }, [matrixData, roles]);

  const isLoading = rolesLoading || menusLoading || permissionsLoading;
  const error = rolesError || menusError || permissionsError;

  // Handlers
  const handleCellClick = (roleId: string, menuId: string) => {
    setSelectedCell({ roleId, menuId });
  };

  const handleExport = async (format: 'pdf' | 'excel' | 'csv') => {
    if (!roles || filteredData.length === 0) {
      toast({
        title: 'Tidak Ada Data',
        description: 'Tidak ada data untuk diekspor',
        variant: 'destructive'
      });
      return;
    }

    setIsExporting(true);
    try {
      // Dynamic import dengan error handling yang lebih baik
      const { exportToPDF, exportToExcel, exportToCSV } = await import('@/services/roleAccessExportService');
      
      if (format === 'pdf') {
        await exportToPDF(filteredData, roles, {
          filename: 'matriks-akses-role',
          includeTimestamp: true,
          title: 'Matriks Akses Role'
        });
      } else if (format === 'excel') {
        await exportToExcel(filteredData, roles, {
          filename: 'matriks-akses-role',
          includeTimestamp: true,
          title: 'Matriks Akses Role'
        });
      } else {
        exportToCSV(filteredData, roles, {
          filename: 'matriks-akses-role',
          includeTimestamp: true
        });
      }
      
      toast({
        title: 'Unduh Berhasil',
        description: `Laporan berhasil diunduh dalam format ${format.toUpperCase()}`
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: 'Unduh Gagal',
        description: error instanceof Error ? error.message : 'Terjadi kesalahan saat mengunduh laporan',
        variant: 'destructive'
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleExpandAll = () => {
    const allMenuIds = new Set<string>();
    const collectMenuIds = (items: typeof filteredData) => {
      items.forEach(item => {
        allMenuIds.add(item.menu.id);
        if (item.menu.children && item.menu.children.length > 0) {
          item.menu.children.forEach(child => allMenuIds.add(child.id));
        }
      });
    };
    collectMenuIds(filteredData);
    setExpandedMenus(allMenuIds);
    toast({ title: 'Expand All', description: 'Semua menu telah dibuka' });
  };

  const handleCollapseAll = () => {
    setExpandedMenus(new Set());
    toast({ title: 'Collapse All', description: 'Semua menu telah ditutup' });
  };

  const handleToggleMenu = (menuId: string) => {
    setExpandedMenus(prev => {
      const newSet = new Set(prev);
      if (newSet.has(menuId)) {
        newSet.delete(menuId);
      } else {
        newSet.add(menuId);
      }
      return newSet;
    });
  };

  const handleSavePermission = async (roleId: string, menuId: string, permissions: any) => {
    try {
      // Import function dari service
      const { updateRoleMenuAccess } = await import('@/services/roleAccessService');
      
      // Update permission di database
      const result = await updateRoleMenuAccess(roleId, menuId, permissions);
      
      if (!result.success) {
        throw new Error(result.message || 'Gagal menyimpan permission');
      }
      
      // Refresh data setelah berhasil
      // Query akan otomatis refetch karena React Query
      toast({
        title: 'Berhasil',
        description: 'Permission berhasil diperbarui',
      });
    } catch (error) {
      console.error('Error saving permission:', error);
      throw error;
    }
  };

  // Get selected cell data
  const selectedAccess = selectedCell
    ? filteredData.find(d => d.menu.id === selectedCell.menuId)?.accessByRole.get(selectedCell.roleId)
    : undefined;
  const selectedRole = selectedCell ? roles?.find(r => r.id === selectedCell.roleId) : undefined;
  const selectedMenu = selectedCell ? filteredData.find(d => d.menu.id === selectedCell.menuId)?.menu : undefined;

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Gagal memuat data: {error instanceof Error ? error.message : 'Unknown error'}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Rincian Role Akses</CardTitle>
          <CardDescription>
            Matriks lengkap akses menu untuk setiap role dalam sistem
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AccessStatistics statistics={statistics} isLoading={isLoading} />
          
          {!isLoading && roles && (
            <AccessMatrixToolbar
              roles={roles}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              roleFilter={roleFilter}
              onRoleFilterChange={setRoleFilter}
              onExpandAll={handleExpandAll}
              onCollapseAll={handleCollapseAll}
              onExport={handleExport}
              isExporting={isExporting}
            />
          )}

          {roles && (
            <AccessMatrix
              data={filteredData}
              roles={roles}
              isLoading={isLoading}
              onCellClick={handleCellClick}
              expandedMenus={expandedMenus}
              onToggleMenu={handleToggleMenu}
            />
          )}
        </CardContent>
      </Card>

      {/* Permission Detail Dialog */}
      {selectedCell && selectedRole && selectedMenu && (
        <PermissionDetailDialog
          isOpen={!!selectedCell}
          onClose={() => setSelectedCell(null)}
          roleName={selectedRole.role_name}
          menuName={selectedMenu.name}
          access={selectedAccess}
          roleId={selectedCell.roleId}
          menuId={selectedCell.menuId}
          onSave={handleSavePermission}
        />
      )}
    </div>
  );
};
