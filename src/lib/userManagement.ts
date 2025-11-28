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
  tenant_id?: string;
  tenant_name?: string;
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
 * Get all users with their roles (tenant-aware)
 * Automatically filters by current user's tenant_id via RLS
 */
export async function getAllUsers(): Promise<UserWithRole[]> {
  try {
    // Get current user's tenant_id
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    if (!currentUser) {
      console.error('No authenticated user');
      return [];
    }

    // Get user profiles with tenant info
    const { data: profiles, error: profileError } = await supabase
      .from('user_profiles')
      .select(`
        user_id,
        tenant_id,
        full_name,
        created_at,
        tenants:tenant_id (
          name,
          slug
        )
      `)
      .order('created_at', { ascending: false });

    if (profileError) {
      console.error('Error fetching profiles:', profileError);
      return [];
    }

    if (!profiles || profiles.length === 0) {
      return [];
    }

    // Get user roles for these users
    const userIds = profiles.map(p => p.user_id);
    const { data: userRoles, error: rolesError } = await supabase
      .from('user_roles')
      .select(`
        user_id,
        role_id,
        is_active,
        assigned_at,
        assigned_by
      `)
      .in('user_id', userIds);

    if (rolesError) {
      console.error('Error fetching user roles:', rolesError);
    }

    // Get role details
    const roleIds = userRoles?.map(ur => ur.role_id).filter(Boolean) || [];
    const { data: roles, error: roleDetailsError } = await supabase
      .from('role_akses_aplikasi')
      .select('id, role_name, description')
      .in('id', roleIds);

    if (roleDetailsError) {
      console.error('Error fetching role details:', roleDetailsError);
    }

    // Create role lookup map
    const roleMap = new Map(roles?.map(r => [r.id, r]) || []);

    // Get auth users for emails via RPC function (safer than admin API)
    // This will use a database function that has proper security
    let emailMap = new Map<string, string>();
    let lastSignInMap = new Map<string, string>();
    
    try {
      // Try to get user emails via RPC function
      const { data: userEmails, error: emailError } = await supabase
        .rpc('get_user_emails_by_ids', { user_ids: userIds });
      
      if (!emailError && userEmails) {
        emailMap = new Map(userEmails.map((u: any) => [u.user_id, u.email]));
        lastSignInMap = new Map(userEmails.map((u: any) => [u.user_id, u.last_sign_in_at]));
      }
    } catch (error) {
      console.error('Error fetching user emails:', error);
      // Fallback: use profile data or placeholder
    }

    // Combine all data
    const result: UserWithRole[] = profiles.map(profile => {
      const userRole = userRoles?.find(ur => ur.user_id === profile.user_id);
      const role = userRole ? roleMap.get(userRole.role_id) : null;
      const assignedByEmail = userRole?.assigned_by ? emailMap.get(userRole.assigned_by) || '' : '';
      const tenantInfo = profile.tenants as any;

      return {
        id: profile.user_id,
        email: emailMap.get(profile.user_id) || 'unknown@email.com',
        created_at: profile.created_at,
        last_sign_in_at: lastSignInMap.get(profile.user_id) || '',
        role_name: role?.role_name || 'user',
        role_description: role?.description || '',
        role_is_active: userRole?.is_active || false,
        assigned_at: userRole?.assigned_at || '',
        assigned_by_email: assignedByEmail,
        tenant_id: profile.tenant_id,
        tenant_name: tenantInfo?.name || 'Unknown Tenant'
      };
    });

    return result;
  } catch (error) {
    console.error('Error fetching users:', error);
    return [];
  }
}

/**
 * Fetch users dengan filtering (tenant-aware)
 * @param searchQuery - Search query untuk filter email atau nama
 * @param roleFilter - Filter berdasarkan role
 * @param statusFilter - Filter berdasarkan status (all, active, inactive)
 * @returns Filtered array of users
 */
export async function fetchUsers(
  searchQuery: string = '',
  roleFilter: string = 'all',
  statusFilter: 'all' | 'active' | 'inactive' = 'all'
): Promise<UserWithRole[]> {
  try {
    const users = await getAllUsers();
    
    let filtered = users;

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(user =>
        user.email.toLowerCase().includes(query) ||
        (user.assigned_by_email && user.assigned_by_email.toLowerCase().includes(query))
      );
    }

    // Apply role filter
    if (roleFilter !== 'all') {
      filtered = filtered.filter(user => user.role_name === roleFilter);
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(user =>
        user.role_is_active === (statusFilter === 'active')
      );
    }

    return filtered;
  } catch (error) {
    console.error('Error fetching filtered users:', error);
    return [];
  }
}

/**
 * Toggle user status (activate/deactivate)
 * @param userId - ID user
 * @param isActive - Status baru
 * @returns API response
 */
export async function toggleUserStatus(
  userId: string,
  isActive: boolean
): Promise<ApiResponse> {
  if (isActive) {
    return await activateUser(userId);
  } else {
    return await deactivateUser(userId);
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
 * Create new user with email and password (tenant-aware)
 * Uses database function to safely create user with proper tenant isolation
 * NOTE: This function is deprecated, use createUserWithRole instead
 */
export async function createUser(
  email: string,
  password: string,
  fullName?: string,
  providedTenantId?: string
): Promise<ApiResponse> {
  console.warn('createUser is deprecated, use createUserWithRole instead');
  
  // Default to 'user' role if not specified
  return createUserWithRole(email, password, 'user', fullName, providedTenantId);
}

/**
 * Validate user belongs to same tenant
 */
async function validateSameTenant(userId: string): Promise<boolean> {
  try {
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    if (!currentUser) return false;

    const currentTenantId = currentUser.app_metadata?.tenant_id;
    if (!currentTenantId) return false;

    // Check if target user belongs to same tenant
    const { data: profile, error } = await supabase
      .from('user_profiles')
      .select('tenant_id')
      .eq('user_id', userId)
      .single();

    if (error || !profile) return false;

    return profile.tenant_id === currentTenantId;
  } catch (error) {
    console.error('Error validating tenant:', error);
    return false;
  }
}

/**
 * Assign role to user (tenant-aware)
 * Validates that user belongs to same tenant before assigning role
 */
export async function assignRoleToUser(
  userId: string,
  roleName: string
): Promise<ApiResponse> {
  try {
    // Validate same tenant (unless superadmin)
    const isSA = await isSuperadmin();
    if (!isSA) {
      const sameTenant = await validateSameTenant(userId);
      if (!sameTenant) {
        return {
          success: false,
          message: 'Tidak dapat mengubah role user dari tenant lain'
        };
      }
    }

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
 * Create user and assign role in one operation (tenant-aware)
 * Uses database RPC function for secure user creation with proper tenant isolation
 */
export async function createUserWithRole(
  email: string,
  password: string,
  roleName: string,
  fullName?: string,
  tenantId?: string
): Promise<ApiResponse> {
  try {
    // Validate inputs
    if (!email || !password || !roleName) {
      return {
        success: false,
        message: 'Email, password, dan role harus diisi'
      };
    }

    if (password.length < 8) {
      return {
        success: false,
        message: 'Password minimal 8 karakter'
      };
    }

    // Call database function to create user with role
    const { data, error } = await supabase.rpc('create_user_with_role', {
      email_param: email,
      password_param: password,
      full_name_param: fullName || email.split('@')[0],
      role_name_param: roleName,
      tenant_id_param: tenantId || null
    });

    if (error) {
      console.error('RPC error:', error);
      return {
        success: false,
        message: error.message || 'Gagal membuat user'
      };
    }

    // Parse response from database function
    if (data && typeof data === 'object') {
      return {
        success: data.success === true,
        message: data.message || (data.success ? 'User berhasil dibuat' : 'Gagal membuat user'),
        data: data.user_id ? { id: data.user_id } : undefined
      };
    }

    return {
      success: false,
      message: 'Response tidak valid dari server'
    };
  } catch (error: any) {
    console.error('Error in createUserWithRole:', error);
    return {
      success: false,
      message: error.message || 'Gagal membuat user dengan role'
    };
  }
}

/**
 * Deactivate user (soft delete) - tenant-aware
 * Validates that user belongs to same tenant before deactivating
 */
export async function deactivateUser(userId: string): Promise<ApiResponse> {
  try {
    // Validate same tenant (unless superadmin)
    const isSA = await isSuperadmin();
    if (!isSA) {
      const sameTenant = await validateSameTenant(userId);
      if (!sameTenant) {
        return {
          success: false,
          message: 'Tidak dapat menonaktifkan user dari tenant lain'
        };
      }
    }

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
 * Activate user - tenant-aware
 * Validates that user belongs to same tenant before activating
 */
export async function activateUser(userId: string): Promise<ApiResponse> {
  try {
    // Validate same tenant (unless superadmin)
    const isSA = await isSuperadmin();
    if (!isSA) {
      const sameTenant = await validateSameTenant(userId);
      if (!sameTenant) {
        return {
          success: false,
          message: 'Tidak dapat mengaktifkan user dari tenant lain'
        };
      }
    }

    // Update user_profile is_active
    const { error } = await supabase
      .from('user_profiles')
      .update({ is_active: true })
      .eq('user_id', userId);

    if (error) throw error;

    return {
      success: true,
      message: 'User berhasil diaktifkan'
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Gagal mengaktifkan user'
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

