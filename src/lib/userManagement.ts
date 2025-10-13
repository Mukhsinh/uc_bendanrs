/**
 * User Management API Helper
 * Menyediakan fungsi-fungsi untuk manajemen user dan role
 */

import { supabase } from "@/integrations/supabase/client";

export interface Role {
  id: string;
  role_name: string;
  description: string;
  is_active: boolean;
}

export interface UserWithRole {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at: string;
  role_name: string;
  role_description: string;
  role_is_active: boolean;
  assigned_at: string;
  assigned_by_email: string;
}

export interface Permission {
  permission_name: string;
  permission_type: string;
  is_granted: boolean;
}

export interface ApiResponse {
  success: boolean;
  message: string;
  data?: any;
}

/**
 * Check if current user is superadmin
 */
export async function isSuperadmin(): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { data, error } = await supabase.rpc('is_superadmin', {
      check_user_id: user.id
    });

    if (error) {
      console.error('Error checking superadmin:', error);
      return false;
    }

    return data === true;
  } catch (error) {
    console.error('Error in isSuperadmin:', error);
    return false;
  }
}

/**
 * Check if current user is admin or superadmin
 */
export async function isAdminOrSuperadmin(): Promise<boolean> {
  try {
    const { data, error } = await supabase.rpc('is_admin_or_superadmin');

    if (error) {
      console.error('Error checking admin:', error);
      return false;
    }

    return data === true;
  } catch (error) {
    console.error('Error in isAdminOrSuperadmin:', error);
    return false;
  }
}

/**
 * Get current user's role
 */
export async function getUserRole(): Promise<string | null> {
  try {
    const { data, error } = await supabase.rpc('get_user_role');

    if (error) {
      console.error('Error getting user role:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in getUserRole:', error);
    return null;
  }
}

/**
 * Check if user has specific permission
 */
export async function checkPermission(
  permissionName: string,
  permissionType: string = 'read'
): Promise<boolean> {
  try {
    const { data, error } = await supabase.rpc('check_permission', {
      permission_name_param: permissionName,
      permission_type_param: permissionType
    });

    if (error) {
      console.error('Error checking permission:', error);
      return false;
    }

    return data === true;
  } catch (error) {
    console.error('Error in checkPermission:', error);
    return false;
  }
}

/**
 * Get all users with their roles
 */
export async function getAllUsers(): Promise<UserWithRole[]> {
  try {
    const { data, error } = await supabase
      .from('users_with_roles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching users:', error);
    return [];
  }
}

/**
 * Get all available roles
 */
export async function getAllRoles(): Promise<Role[]> {
  try {
    const { data, error } = await supabase
      .from('role_akses_aplikasi')
      .select('*')
      .eq('is_active', true)
      .order('role_name');

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching roles:', error);
    return [];
  }
}

/**
 * Get user permissions
 */
export async function getUserPermissions(userId: string): Promise<Permission[]> {
  try {
    const { data, error } = await supabase.rpc('get_user_permissions', {
      check_user_id: userId
    });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching permissions:', error);
    return [];
  }
}

/**
 * Create new user with email and password
 */
export async function createUser(
  email: string,
  password: string,
  fullName?: string
): Promise<ApiResponse> {
  try {
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName || email.split('@')[0],
        },
      },
    });

    if (authError) throw authError;

    return {
      success: true,
      message: 'User berhasil dibuat',
      data: authData.user
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Gagal membuat user'
    };
  }
}

/**
 * Assign role to user
 */
export async function assignRoleToUser(
  userId: string,
  roleName: string
): Promise<ApiResponse> {
  try {
    const { data, error } = await supabase.rpc('assign_role_to_user', {
      user_id_param: userId,
      role_name_param: roleName
    });

    if (error) throw error;

    // data is already a JSON object from the function
    return data as ApiResponse;
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Gagal assign role'
    };
  }
}

/**
 * Create user and assign role in one operation
 */
export async function createUserWithRole(
  email: string,
  password: string,
  roleName: string,
  fullName?: string
): Promise<ApiResponse> {
  try {
    // Create user
    const createResult = await createUser(email, password, fullName);
    
    if (!createResult.success || !createResult.data) {
      return createResult;
    }

    // Assign role
    const assignResult = await assignRoleToUser(createResult.data.id, roleName);
    
    return assignResult;
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Gagal membuat user dengan role'
    };
  }
}

/**
 * Deactivate user (soft delete)
 */
export async function deactivateUser(userId: string): Promise<ApiResponse> {
  try {
    const { data, error } = await supabase.rpc('deactivate_user', {
      user_id_param: userId
    });

    if (error) throw error;

    return data as ApiResponse;
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Gagal menonaktifkan user'
    };
  }
}

/**
 * Get current authenticated user info
 */
export async function getCurrentUser() {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error) throw error;
    return user;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}

/**
 * Logout user
 */
export async function logout(): Promise<void> {
  await supabase.auth.signOut();
}

/**
 * Check if current user can access a specific feature
 */
export async function canAccessFeature(featureName: string): Promise<boolean> {
  const isSA = await isSuperadmin();
  if (isSA) return true;

  return await checkPermission(featureName, 'menu');
}

/**
 * Check if current user can perform an action
 */
export async function canPerformAction(actionName: string): Promise<boolean> {
  const isSA = await isSuperadmin();
  if (isSA) return true;

  return await checkPermission(actionName, 'action');
}

/**
 * Get role badge variant based on role name
 */
export function getRoleBadgeVariant(roleName: string): "default" | "secondary" | "outline" | "destructive" {
  switch (roleName) {
    case "Super Admin":
      return "default";
    case "Admin":
      return "secondary";
    case "Manager":
    case "Operator":
    case "Viewer":
      return "outline";
    default:
      return "outline";
  }
}

/**
 * Get role color class
 */
export function getRoleColorClass(roleName: string): string {
  switch (roleName) {
    case "Super Admin":
      return "text-purple-600 bg-purple-50 border-purple-300";
    case "Admin":
      return "text-blue-600 bg-blue-50 border-blue-300";
    case "Manager":
      return "text-green-600 bg-green-50 border-green-300";
    case "Operator":
      return "text-orange-600 bg-orange-50 border-orange-300";
    case "Viewer":
      return "text-gray-600 bg-gray-50 border-gray-300";
    default:
      return "text-gray-600 bg-gray-50 border-gray-300";
  }
}

export default {
  isSuperadmin,
  isAdminOrSuperadmin,
  getUserRole,
  checkPermission,
  getAllUsers,
  getAllRoles,
  getUserPermissions,
  createUser,
  assignRoleToUser,
  createUserWithRole,
  deactivateUser,
  getCurrentUser,
  logout,
  canAccessFeature,
  canPerformAction,
  getRoleBadgeVariant,
  getRoleColorClass,
};

