import React, { useEffect, useState } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { getCurrentTenantId } from '@/lib/tenantAwareClient';
import { isSuperAdmin, normalizeRoleName } from '@/utils/role-check';

interface RoleProtectedRouteProps {
  children: JSX.Element;
  allowedRoles: string[];
  fallbackMessage?: string;
}

export const RoleProtectedRoute: React.FC<RoleProtectedRouteProps> = ({
  children,
  allowedRoles,
  fallbackMessage = "Anda tidak memiliki akses ke halaman ini."
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const { user, initializing } = useAuth();

  useEffect(() => {
    if (initializing) {
      setIsLoading(true);
      return;
    }

    if (!user) {
      setHasAccess(false);
      setUserRole(null);
      setIsLoading(false);
      return;
    }

    checkUserRole(user.id);
  }, [user, initializing]);

  const checkUserRole = async (userId: string) => {
    try {
      // Get current tenant_id
      const currentTenantId = getCurrentTenantId();

      const { data: { user: authUser } } = await supabase.auth.getUser();
      const roleFromMetadata = normalizeRoleName((authUser?.app_metadata as any)?.role);
      const tenantFromMetadata = typeof (authUser?.app_metadata as any)?.tenant_id === 'string'
        ? (authUser?.app_metadata as any)?.tenant_id
        : null;

      const isResolvedSuperAdmin = roleFromMetadata === 'Super Admin' || await isSuperAdmin(userId);
      if (isResolvedSuperAdmin) {
        setUserRole('Super Admin');
        // Super Admin yang sudah terverifikasi selalu mendapat akses
        // tanpa bergantung pada daftar allowedRoles
        setHasAccess(true);
        setIsLoading(false);
        return;
      }

      if (currentTenantId && tenantFromMetadata && currentTenantId !== tenantFromMetadata) {
        setHasAccess(false);
        setIsLoading(false);
        return;
      }

      let resolvedRole: string | null = roleFromMetadata;
      if (!resolvedRole) {
        const { data: userRoleLink, error: roleError } = await supabase
          .from('user_roles')
          .select('role_id, role_akses_aplikasi(role_name)')
          .eq('user_id', userId)
          .limit(1)
          .maybeSingle();

        if (roleError && roleError.code !== 'PGRST116') {
          console.warn('Gagal mengambil role user:', roleError);
        }

        if (userRoleLink) {
          resolvedRole = normalizeRoleName((userRoleLink.role_akses_aplikasi as any)?.role_name);
        }
      }

      if (!resolvedRole) {
        setHasAccess(false);
        setIsLoading(false);
        return;
      }

      setUserRole(resolvedRole);
      setHasAccess(allowedRoles.includes(resolvedRole));
    } catch (error) {
      console.error("Error checking user role:", error);
      setHasAccess(false);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-50 to-cyan-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto mb-4"></div>
          <p className="text-teal-700 font-medium">Memeriksa akses...</p>
        </div>
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-teal-50 to-cyan-50">
        <div className="w-full max-w-lg">
          <Alert>
            <Shield className="h-4 w-4" />
            <AlertDescription>{fallbackMessage}</AlertDescription>
          </Alert>
          <div className="mt-4 text-center">
            <button
              onClick={() => window.history.back()}
              className="text-teal-700 hover:text-teal-800 text-sm font-medium"
            >
              ← Kembali
            </button>
          </div>
        </div>
      </div>
    );
  }

  return children;
};

export default RoleProtectedRoute;
