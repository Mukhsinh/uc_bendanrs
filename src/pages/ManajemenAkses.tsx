import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TenantManagementTab, UserManagementTab } from '@/components/ManajemenAkses';
import { RoleAccessDetailsTab } from '@/components/ManajemenAkses/RoleAccessDetailsTab';
import { useAuth } from '@/contexts/AuthContext';
import { useTenant } from '@/contexts/TenantContext';
import ErrorBoundary from '@/components/ErrorBoundary';

function ManajemenAksesContent() {
  const { user } = useAuth();
  const { tenant } = useTenant();
  
  // Check if user is super admin
  const isSuperAdmin = user?.email === 'mukhsin9@gmail.com';
  
  // Set default tab based on role
  const [activeTab, setActiveTab] = useState<string>(
    isSuperAdmin ? 'tenant' : 'user'
  );

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
