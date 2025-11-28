/**
 * Super Admin Dashboard
 * Displays list of all tenants with statistics and management actions
 */

import React, { useState, useEffect } from 'react';
import { Building2, Users, Database, Activity, ToggleLeft, ToggleRight, Eye } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

interface TenantStats {
  id: string;
  name: string;
  slug: string;
  is_active: boolean;
  created_at: string;
  user_count: number;
  data_size: number;
  last_activity: string | null;
}

const SuperAdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tenants, setTenants] = useState<TenantStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Check if user is super admin
  const isSuperAdmin = user?.app_metadata?.role === 'super_admin';

  useEffect(() => {
    if (!isSuperAdmin) {
      toast.error('Akses ditolak: Hanya super admin yang dapat mengakses halaman ini');
      navigate('/');
      return;
    }

    loadTenants();
  }, [isSuperAdmin, navigate]);

  const loadTenants = async () => {
    setLoading(true);
    try {
      // Get all tenants
      const { data: tenantsData, error: tenantsError } = await supabase
        .from('tenants')
        .select('id, name, slug, is_active, created_at')
        .order('created_at', { ascending: false });

      if (tenantsError) throw tenantsError;

      // Get statistics for each tenant
      const tenantsWithStats = await Promise.all(
        (tenantsData || []).map(async (tenant) => {
          // Count users
          const { count: userCount } = await supabase
            .from('user_profiles')
            .select('*', { count: 'exact', head: true })
            .eq('tenant_id', tenant.id);

          // Get last activity from audit log
          const { data: lastActivity } = await supabase
            .from('tenant_audit_log')
            .select('created_at')
            .eq('tenant_id', tenant.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          return {
            ...tenant,
            user_count: userCount || 0,
            data_size: 0, // Placeholder - would need custom query
            last_activity: lastActivity?.created_at || null,
          };
        })
      );

      setTenants(tenantsWithStats);
    } catch (error: any) {
      console.error('Error loading tenants:', error);
      toast.error('Gagal memuat data tenant');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (tenantId: string, currentStatus: boolean) => {
    setActionLoading(tenantId);
    try {
      const { error } = await supabase
        .from('tenants')
        .update({ is_active: !currentStatus })
        .eq('id', tenantId);

      if (error) throw error;

      // Log the action
      await supabase.from('tenant_audit_log').insert({
        tenant_id: tenantId,
        user_id: user?.id,
        action: currentStatus ? 'tenant_deactivated' : 'tenant_activated',
        table_name: 'tenants',
        record_id: tenantId,
        new_data: { is_active: !currentStatus },
      });

      toast.success(`Tenant ${!currentStatus ? 'diaktifkan' : 'dinonaktifkan'}`);
      loadTenants();
    } catch (error: any) {
      console.error('Error toggling tenant status:', error);
      toast.error('Gagal mengubah status tenant');
    } finally {
      setActionLoading(null);
    }
  };

  const handleViewTenant = (tenantId: string) => {
    // Store tenant context and reload
    const tenant = tenants.find(t => t.id === tenantId);
    if (tenant) {
      sessionStorage.setItem('tenant_id', tenant.id);
      sessionStorage.setItem('tenant_name', tenant.name);
      toast.success(`Melihat data tenant: ${tenant.name}`);
      window.location.reload();
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatLastActivity = (dateString: string | null) => {
    if (!dateString) return 'Tidak ada aktivitas';
    
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Hari ini';
    if (diffDays === 1) return 'Kemarin';
    if (diffDays < 7) return `${diffDays} hari lalu`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} minggu lalu`;
    return formatDate(dateString);
  };

  if (!isSuperAdmin) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Super Admin Dashboard</h1>
        <p className="text-gray-600 mt-2">
          Kelola semua tenant dan monitor aktivitas sistem
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tenant</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tenants.length}</div>
            <p className="text-xs text-muted-foreground">
              {tenants.filter(t => t.is_active).length} aktif
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total User</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {tenants.reduce((sum, t) => sum + t.user_count, 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Across all tenants
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tenant Aktif</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {tenants.filter(t => t.is_active).length}
            </div>
            <p className="text-xs text-muted-foreground">
              {((tenants.filter(t => t.is_active).length / tenants.length) * 100).toFixed(0)}% dari total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Data Size</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">-</div>
            <p className="text-xs text-muted-foreground">
              Coming soon
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tenants Table */}
      <Card>
        <CardHeader>
          <CardTitle>Daftar Tenant</CardTitle>
          <CardDescription>
            Kelola dan monitor semua tenant dalam sistem
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
              <span className="ml-3 text-gray-600">Memuat data...</span>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tenant</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Users</TableHead>
                  <TableHead>Dibuat</TableHead>
                  <TableHead>Aktivitas Terakhir</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tenants.map((tenant) => (
                  <TableRow key={tenant.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{tenant.name}</div>
                        <div className="text-sm text-gray-500">{tenant.slug}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={tenant.is_active ? 'default' : 'secondary'}>
                        {tenant.is_active ? 'Aktif' : 'Nonaktif'}
                      </Badge>
                    </TableCell>
                    <TableCell>{tenant.user_count}</TableCell>
                    <TableCell>{formatDate(tenant.created_at)}</TableCell>
                    <TableCell>{formatLastActivity(tenant.last_activity)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewTenant(tenant.id)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Lihat
                        </Button>
                        <Button
                          variant={tenant.is_active ? 'destructive' : 'default'}
                          size="sm"
                          onClick={() => handleToggleStatus(tenant.id, tenant.is_active)}
                          disabled={actionLoading === tenant.id}
                        >
                          {actionLoading === tenant.id ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          ) : tenant.is_active ? (
                            <>
                              <ToggleRight className="h-4 w-4 mr-1" />
                              Nonaktifkan
                            </>
                          ) : (
                            <>
                              <ToggleLeft className="h-4 w-4 mr-1" />
                              Aktifkan
                            </>
                          )}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SuperAdminDashboard;
