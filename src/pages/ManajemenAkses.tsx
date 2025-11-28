import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Building2 } from 'lucide-react';
import { TenantManagementTab, UserManagementTab } from '@/components/ManajemenAkses';
import { RoleAccessDetailsTab } from '@/components/ManajemenAkses/RoleAccessDetailsTab';
import { useAuth } from '@/contexts/AuthContext';
import { useTenant } from '@/contexts/TenantContext';
import ErrorBoundary from '@/components/ErrorBoundary';

function ManajemenAksesContent() {
  const { user } = useAuth();
  const { tenant, setTenant, availableTenants, isLoading: tenantsLoading } = useTenant();
  
  // Check if user is super admin
  const isSuperAdmin = user?.email === 'mukhsin9@gmail.com';
  
  // Set default tab based on role
  const [activeTab, setActiveTab] = useState<string>(
    isSuperAdmin ? 'tenant' : 'user'
  );

  const handleTenantChange = (tenantId: string) => {
    setTenant(tenantId);
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">Manajemen Akses</h1>
          {tenant && (
            <p className="text-sm text-gray-600 mt-1">
              Tenant Aktif: <span className="font-semibold">{tenant.name}</span>
            </p>
          )}
        </div>

        {/* Tenant Selector - Hanya untuk Super Admin */}
        {isSuperAdmin && availableTenants && availableTenants.length > 0 && (
          <div className="w-80">
            <Label htmlFor="tenant-selector" className="text-sm font-medium mb-2 flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Pilih Tenant
            </Label>
            <Select
              value={tenant?.id || ''}
              onValueChange={handleTenantChange}
              disabled={tenantsLoading}
            >
              <SelectTrigger id="tenant-selector" className="w-full">
                <SelectValue placeholder="Pilih tenant..." />
              </SelectTrigger>
              <SelectContent>
                {availableTenants.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      <span>{t.name}</span>
                      {!t.is_active && (
                        <span className="text-xs text-red-500">(Nonaktif)</span>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-500 mt-1">
              Data yang ditampilkan sesuai tenant yang dipilih
            </p>
          </div>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          {isSuperAdmin && (
            <TabsTrigger value="tenant">Kelola Tenant</TabsTrigger>
          )}
          <TabsTrigger value="user">Kelola User</TabsTrigger>
          <TabsTrigger value="role-access">Rincian Role Akses</TabsTrigger>
        </TabsList>

        {isSuperAdmin && (
          <TabsContent value="tenant">
            <ErrorBoundary>
              <TenantManagementTab />
            </ErrorBoundary>
          </TabsContent>
        )}

        <TabsContent value="user">
          <ErrorBoundary>
            <UserManagementTab />
          </ErrorBoundary>
        </TabsContent>

        <TabsContent value="role-access">
          <ErrorBoundary>
            <RoleAccessDetailsTab />
          </ErrorBoundary>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function ManajemenAkses() {
  return (
    <ErrorBoundary>
      <ManajemenAksesContent />
    </ErrorBoundary>
  );
}
