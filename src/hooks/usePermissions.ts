import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface Permission {
  id: string;
  permission_name: string;
  permission_type: string;
  is_granted: boolean;
}

interface UserRole {
  role_id: string;
  role_name: string;
  permissions: Permission[];
}

export const usePermissions = () => {
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user: authUser, initializing: authInitializing } = useAuth();

  const fetchUserRole = useCallback(async (userId: string) => {
    try {
      setLoading(true);
      setError(null);

      const { data: userRoleData, error: roleError } = await supabase
        .from('user_roles')
        .select(`
          role_id,
          role_akses_aplikasi!inner(
            role_name,
            role_permissions!inner(
              permission_name,
              permission_type,
              is_granted
            )
          )
        `)
        .eq('user_id', userId)
        .eq('is_active', true)
        .single();

      if (roleError) throw roleError;

      if (userRoleData) {
        const roleData = userRoleData.role_akses_aplikasi as any;
        setUserRole({
          role_id: userRoleData.role_id,
          role_name: roleData.role_name,
          permissions: roleData.role_permissions || []
        });
      } else {
        setUserRole(null);
      }
    } catch (err) {
      console.error('Error fetching user role:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      setUserRole(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authInitializing) {
      setLoading(true);
      return;
    }

    if (!authUser) {
      setUserRole(null);
      setLoading(false);
      return;
    }

    fetchUserRole(authUser.id);
  }, [authUser, authInitializing, fetchUserRole]);

  const hasPermission = (permissionName: string): boolean => {
    if (!userRole) return false;
    
    const permission = userRole.permissions.find(
      p => p.permission_name === permissionName && p.is_granted
    );
    
    return !!permission;
  };

  const hasMenuAccess = (menuName: string): boolean => {
    return hasPermission(menuName);
  };

  const canAdd = (): boolean => {
    return hasPermission('tambah_data');
  };

  const canEdit = (): boolean => {
    return hasPermission('edit_data');
  };

  const canDelete = (): boolean => {
    return hasPermission('hapus_data');
  };

  const canView = (): boolean => {
    return hasPermission('lihat_data');
  };

  const canDownload = (): boolean => {
    return hasPermission('unduh_laporan');
  };

  const canManageUsers = (): boolean => {
    return hasPermission('kelola_user');
  };

  const canManageRoles = (): boolean => {
    return hasPermission('kelola_role');
  };

  const isAdmin = (): boolean => {
    return userRole?.role_name === 'Super Admin' || userRole?.role_name === 'Admin';
  };

  const isSuperAdmin = (): boolean => {
    return userRole?.role_name === 'Super Admin';
  };

  const refetch = useCallback(async () => {
    if (!authUser?.id) {
      setUserRole(null);
      return;
    }
    await fetchUserRole(authUser.id);
  }, [authUser, fetchUserRole]);

  return {
    userRole,
    loading,
    error,
    hasPermission,
    hasMenuAccess,
    canAdd,
    canEdit,
    canDelete,
    canView,
    canDownload,
    canManageUsers,
    canManageRoles,
    isAdmin,
    isSuperAdmin,
    refetch
  };
};

export default usePermissions;





