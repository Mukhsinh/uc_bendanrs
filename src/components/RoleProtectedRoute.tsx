import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

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
      // Cek jika superadmin
      const { data: isSuperadmin } = await supabase.rpc('is_superadmin', { check_user_id: userId });
      
      if (isSuperadmin) {
        setUserRole("Super Admin");
        setHasAccess(allowedRoles.includes("Super Admin"));
        setIsLoading(false);
        return;
      }

      // Ambil role dari user_roles table dengan join ke role_akses_aplikasi
      const { data: userRoles } = await supabase
        .from('user_roles')
        .select(`
          role_akses_aplikasi!inner(role_name)
        `)
        .eq('user_id', userId)
        .eq('is_active', true)
        .single();

      if (userRoles && userRoles.role_akses_aplikasi) {
        const roleName = (userRoles.role_akses_aplikasi as any).role_name;
        setUserRole(roleName);
        setHasAccess(allowedRoles.includes(roleName));
      } else {
        setHasAccess(false);
      }
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
      <div className="container mx-auto py-6">
        <Alert>
          <Shield className="h-4 w-4" />
          <AlertDescription>
            {fallbackMessage}
            {userRole && (
              <span className="block mt-2 text-sm text-muted-foreground">
                Role Anda: <strong>{userRole}</strong>
              </span>
            )}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return children;
};

export default RoleProtectedRoute;
