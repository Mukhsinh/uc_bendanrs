import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { usePermissions } from '@/hooks/usePermissions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, Lock } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredPermission?: string;
  requiredMenu?: string;
  adminOnly?: boolean;
  superAdminOnly?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredPermission,
  requiredMenu,
  adminOnly = false,
  superAdminOnly = false
}) => {
  const { userRole, loading, hasPermission, hasMenuAccess, isAdmin, isSuperAdmin } = usePermissions();
  const location = useLocation();

  // Show loading while checking permissions
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Memeriksa akses...</p>
        </div>
      </div>
    );
  }

  // No user role found
  if (!userRole) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 p-3 bg-red-100 rounded-full w-fit">
              <Lock className="h-6 w-6 text-red-600" />
            </div>
            <CardTitle className="text-red-600">Akses Ditolak</CardTitle>
          </CardHeader>
          <CardContent>
            <Alert>
              <Shield className="h-4 w-4" />
              <AlertDescription>
                Anda tidak memiliki akses ke halaman ini. Silakan hubungi administrator untuk mendapatkan akses yang sesuai.
              </AlertDescription>
            </Alert>
            <div className="mt-4 text-center">
              <button
                onClick={() => window.history.back()}
                className="text-teal-600 hover:text-teal-700 text-sm font-medium"
              >
                ← Kembali
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Check super admin requirement
  if (superAdminOnly && !isSuperAdmin()) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 p-3 bg-red-100 rounded-full w-fit">
              <Shield className="h-6 w-6 text-red-600" />
            </div>
            <CardTitle className="text-red-600">Akses Terbatas</CardTitle>
          </CardHeader>
          <CardContent>
            <Alert>
              <Shield className="h-4 w-4" />
              <AlertDescription>
                Hanya Super Admin yang dapat mengakses halaman ini.
              </AlertDescription>
            </Alert>
            <div className="mt-4 text-center">
              <button
                onClick={() => window.history.back()}
                className="text-teal-600 hover:text-teal-700 text-sm font-medium"
              >
                ← Kembali
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Check admin requirement
  if (adminOnly && !isAdmin()) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 p-3 bg-red-100 rounded-full w-fit">
              <Shield className="h-6 w-6 text-red-600" />
            </div>
            <CardTitle className="text-red-600">Akses Terbatas</CardTitle>
          </CardHeader>
          <CardContent>
            <Alert>
              <Shield className="h-4 w-4" />
              <AlertDescription>
                Hanya Administrator yang dapat mengakses halaman ini.
              </AlertDescription>
            </Alert>
            <div className="mt-4 text-center">
              <button
                onClick={() => window.history.back()}
                className="text-teal-600 hover:text-teal-700 text-sm font-medium"
              >
                ← Kembali
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Check specific permission
  if (requiredPermission && !hasPermission(requiredPermission)) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 p-3 bg-red-100 rounded-full w-fit">
              <Lock className="h-6 w-6 text-red-600" />
            </div>
            <CardTitle className="text-red-600">Permission Required</CardTitle>
          </CardHeader>
          <CardContent>
            <Alert>
              <Shield className="h-4 w-4" />
              <AlertDescription>
                Anda memerlukan permission "{requiredPermission}" untuk mengakses halaman ini.
              </AlertDescription>
            </Alert>
            <div className="mt-4 text-center">
              <button
                onClick={() => window.history.back()}
                className="text-teal-600 hover:text-teal-700 text-sm font-medium"
              >
                ← Kembali
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Check menu access
  if (requiredMenu && !hasMenuAccess(requiredMenu)) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 p-3 bg-red-100 rounded-full w-fit">
              <Lock className="h-6 w-6 text-red-600" />
            </div>
            <CardTitle className="text-red-600">Menu Access Required</CardTitle>
          </CardHeader>
          <CardContent>
            <Alert>
              <Shield className="h-4 w-4" />
              <AlertDescription>
                Anda memerlukan akses ke menu "{requiredMenu}" untuk mengakses halaman ini.
              </AlertDescription>
            </Alert>
            <div className="mt-4 text-center">
              <button
                onClick={() => window.history.back()}
                className="text-teal-600 hover:text-teal-700 text-sm font-medium"
              >
                ← Kembali
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // All checks passed, render children
  return <>{children}</>;
};

export default ProtectedRoute;





