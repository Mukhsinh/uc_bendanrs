import React, { useState, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Building2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useDebounce } from '@/hooks/useDebounce';
import { useTenants } from '@/hooks/useTenants';
import { toggleTenantStatus } from '@/services/tenantManagement';
import TenantTable from './TenantTable';
import CreateTenantDialog from './CreateTenantDialog';
import { TenantSearchFilter } from './SearchFilter';
import type { Tenant } from '@/types/tenant-management';

/**
 * TenantManagementTab Component
 * 
 * Tab untuk mengelola tenant dalam sistem multi-tenant.
 * Hanya dapat diakses oleh super admin (mukhsin9@gmail.com).
 * 
 * Fitur:
 * - Melihat daftar semua tenant
 * - Mencari tenant berdasarkan nama atau slug (dengan debouncing)
 * - Filter tenant berdasarkan status (aktif/nonaktif)
 * - Membuat tenant baru dengan admin pertama
 * - Mengaktifkan/menonaktifkan tenant (dengan optimistic updates)
 * - Melihat daftar user dalam setiap tenant
 * 
 * Performance optimizations:
 * - Debouncing search (300ms)
 * - React Query caching (5 min staleTime)
 * - Optimistic updates untuk status toggle
 * - Memoization untuk filtered lists
 */
const TenantManagementTab: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [expandedTenantId, setExpandedTenantId] = useState<string | null>(null);

  // Debounce search query dengan delay 300ms
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  // Gunakan custom hook useTenants
  const { data: tenants, isLoading, error, refetch } = useTenants({
    search: debouncedSearchQuery,
    statusFilter
  });

  // Show error toast jika ada error saat fetch tenants
  React.useEffect(() => {
    if (error) {
      console.error('Error in useTenants:', error);
      toast({
        title: 'Error',
        description: error.message || 'Gagal memuat daftar tenant',
        variant: 'destructive'
      });
    }
  }, [error, toast]);

  const queryKey = ['tenants', debouncedSearchQuery, statusFilter];

  const handleToggleStatus = async (tenantId: string, currentStatus: boolean) => {
    const newStatus = !currentStatus;

    // Optimistic update: Update cache immediately
    queryClient.setQueryData<Tenant[]>(queryKey, (oldData) => {
      if (!oldData) return oldData;
      return oldData.map(tenant =>
        tenant.id === tenantId
          ? { ...tenant, is_active: newStatus }
          : tenant
      );
    });

    // Perform actual update
    const result = await toggleTenantStatus(tenantId, newStatus);
    
    if (result.success) {
      toast({
        title: 'Berhasil',
        description: `Tenant berhasil ${newStatus ? 'diaktifkan' : 'dinonaktifkan'}`
      });
      // Refetch to ensure data consistency
      refetch();
    } else {
      // Rollback optimistic update on error
      queryClient.setQueryData<Tenant[]>(queryKey, (oldData) => {
        if (!oldData) return oldData;
        return oldData.map(tenant =>
          tenant.id === tenantId
            ? { ...tenant, is_active: currentStatus }
            : tenant
        );
      });

      toast({
        title: 'Error',
        description: result.message || 'Gagal mengubah status tenant',
        variant: 'destructive'
      });
    }
  };

  // Memoize filtered tenants (already filtered by server, but memoize for performance)
  const filteredTenants = useMemo<Tenant[]>(() => {
    return tenants || [];
  }, [tenants]);

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Daftar Tenant</CardTitle>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Building2 className="mr-2 h-4 w-4" />
            Tambah Tenant Baru
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        <TenantSearchFilter
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
        />

        <TenantTable
          tenants={filteredTenants}
          isLoading={isLoading}
          expandedTenantId={expandedTenantId}
          onToggleExpand={setExpandedTenantId}
          onToggleStatus={handleToggleStatus}
          onRefetch={refetch}
        />
      </CardContent>

      <CreateTenantDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onSuccess={refetch}
      />
    </Card>
  );
};

export default TenantManagementTab;
