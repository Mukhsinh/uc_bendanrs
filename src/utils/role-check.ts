/**
 * Utility function untuk mengecek role user
 * Digunakan untuk menentukan apakah user memiliki akses admin/superadmin
 */

import { supabase } from "@/integrations/supabase/client";

export type NormalizedRoleName = 'Super Admin' | 'Admin' | 'Manager' | 'Operator' | 'Viewer' | 'User';

export function normalizeRoleName(rawRole: unknown): NormalizedRoleName | null {
  if (typeof rawRole !== 'string') return null;
  const trimmed = rawRole.trim();
  if (!trimmed) return null;

  const lowered = trimmed.toLowerCase();
  if (lowered === 'super admin' || lowered === 'super_admin') return 'Super Admin';
  if (lowered === 'admin') return 'Admin';
  if (lowered === 'manager') return 'Manager';
  if (lowered === 'operator') return 'Operator';
  if (lowered === 'viewer') return 'Viewer';
  if (lowered === 'user') return 'User';

  const titleCased = lowered
    .split(/[_\s]+/g)
    .filter(Boolean)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  return normalizeRoleName(titleCased);
}

export async function getRoleFromAuthMetadata(): Promise<NormalizedRoleName | null> {
  const { data: { user } } = await supabase.auth.getUser();
  return normalizeRoleName((user?.app_metadata as any)?.role);
}

export async function isSuperAdmin(userId?: string): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  const resolvedUserId = userId || user?.id;
  const roleFromMetadata = normalizeRoleName((user?.app_metadata as any)?.role);
  if (roleFromMetadata === 'Super Admin') return true;
  if (!resolvedUserId) return false;

  // Cek langsung dari tabel user_roles (lebih reliabel daripada RPC)
  try {
    const { data: userRoleRow } = await supabase
      .from('user_roles')
      .select('role_akses_aplikasi(role_name)')
      .eq('user_id', resolvedUserId)
      .limit(1)
      .maybeSingle();

    if (userRoleRow) {
      const roleName = normalizeRoleName((userRoleRow.role_akses_aplikasi as any)?.role_name);
      if (roleName === 'Super Admin') return true;
    }
  } catch {
    // fallthrough ke RPC
  }

  // Fallback ke RPC is_super_admin (nama yang benar di database)
  try {
    const { data: rpcData, error: rpcError } = await supabase.rpc('is_super_admin');
    if (!rpcError && rpcData === true) return true;
  } catch {
    // RPC tidak tersedia, abaikan
  }

  return false;
}

/**
 * Mengecek apakah user adalah Admin atau Super Admin
 * @param userId - Optional user ID. Jika tidak diberikan, akan menggunakan current user dari auth
 * @returns Promise<boolean> - true jika user adalah Admin atau Super Admin
 */
export async function isAdminOrSuperadmin(userId?: string): Promise<boolean> {
  try {
    let checkUserId = userId;

    // Jika userId tidak diberikan, ambil dari current user
    if (!checkUserId) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;
      checkUserId = user.id;
    }

    // Gunakan RPC function dari database untuk mengecek role
    const { data, error } = await supabase.rpc('is_admin_or_superadmin', {
      check_user_id: checkUserId
    });

    if (error) {
      console.error('Error checking admin role:', error);
      return false;
    }

    return data === true;
  } catch (error) {
    console.error('Error in isAdminOrSuperadmin:', error);
    return false;
  }
}

