import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TenantManagementTab, UserManagementTab, DummyDataManagementTab } from '@/components/ManajemenAkses';
import { RoleAccessDetailsTab } from '@/components/ManajemenAkses/RoleAccessDetailsTab';
import { useAuth } from '@/contexts/AuthContext';
import { useTenant } from '@/contexts/TenantContext';
import { supabase } from '@/integrations/supabase/client';
import ErrorBoundary from '@/components/ErrorBoundary';

function ManajemenAksesContent() {
  const { user } = useAuth();
  const { tenant } = useTenant();
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [checkingRole, setCheckingRole] = useState(true);
  
  // Check if user is super admin
  useEffect(() => {
    const checkSuperAdmin = async () => {
      if (!user) {
        setIsSuperAdmin(false);
        setCheckingRole(false);
        return;
      }
      
      try {
        const { data } = await supabase.rpc('is_superadmin', { check_user_id: user.id });
        setIsSuperAdmin(data === true);
      } catch (error) {
        console.error('Error checking superadmin:', error);
        setIsSuperAdmin(false);
      } finally {
        setCheckingRole(false);
      }
    };
    
    checkSuperAdmin();
  }, [user]);
  
  // Set default tab based on role
  const [activeTab, setActiveTab] = useState<string>('user');

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

      {checkingRole ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
          <span className="ml-3 text-gray-600">Memeriksa akses...</span>
        </div>
      ) : (
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            {isSuperAdmin && (
              <TabsTrigger value="tenant">Kelola Tenant</TabsTrigger>
            )}
            <TabsTrigger value="user">Kelola User</TabsTrigger>
            <TabsTrigger value="role-access">Rincian Role Akses</TabsTrigger>
            {isSuperAdmin && (
              <TabsTrigger value="dummy-data">Hapus Data Dummy</TabsTrigger>
            )}
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

          {isSuperAdmin && (
            <TabsContent value="dummy-data">
              <ErrorBoundary>
                <DummyDataManagementTab />
              </ErrorBoundary>
            </TabsContent>
          )}
        </Tabs>
      )}
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
