/**
 * Utility function untuk mengecek role user
 * Digunakan untuk menentukan apakah user memiliki akses admin/superadmin
 */

import { supabase } from "@/integrations/supabase/client";

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

