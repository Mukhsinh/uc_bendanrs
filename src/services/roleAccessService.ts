import { supabase } from '@/integrations/supabase/client';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface Role {
  id: string; // UUID di database
  role_name: string;
  description: string;
  level: number;
  created_at: string;
}

export interface MenuItem {
  id: string;
  name: string;
  path: string;
  icon?: string;
  parent_id: string | null;
  order_index: number;
  is_active: boolean;
  children?: MenuItem[];
}

export interface Permission {
  id: string;
  role_id: string; // UUID di database
  menu_id: string;
  can_view: boolean;
  can_create: boolean;
  can_update: boolean;
  can_delete: boolean;
  can_export: boolean;
  can_import: boolean;
  rls_policy?: string;
  conditions?: Record<string, any>;
}

export interface AccessLevel {
  canView: boolean;
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  canExport: boolean;
  canImport: boolean;
}

export interface MatrixData {
  menu: MenuItem;
  accessByRole: Map<string, AccessLevel>; // Map by role UUID
}

export interface RoleStatistics {
  roleId: string; // UUID
  roleName: string;
  totalMenus: number;
  accessibleMenus: number;
  fullAccessCount: number;
  readOnlyCount: number;
  noAccessCount: number;
  accessPercentage: number;
}

// ============================================================================
// DATA FETCHING FUNCTIONS
// ============================================================================

export const fetchAllRoles = async (): Promise<Role[]> => {
  try {
    const { data, error } = await supabase
      .from('role_akses_aplikasi')
      .select('id, role_name, description, created_at')
      .eq('is_active', true)
      .order('role_name', { ascending: true });

    if (error) throw new Error(`Failed to fetch roles: ${error.message}`);
    
    // Map to expected format - keep UUID as string
    return (data || []).map((role, index) => ({
      id: role.id, // Keep as UUID string
      role_name: role.role_name,
      description: role.description || '',
      level: index + 1,
      created_at: role.created_at
    }));
  } catch (error) {
    console.error('Error in fetchAllRoles:', error);
    throw error;
  }
};

export const fetchVisibleRoles = async (): Promise<Role[]> => {
  try {
    const { data, error } = await supabase.rpc('get_visible_roles');
    if (error) return await fetchAllRoles();
    return data || [];
  } catch (error) {
    console.error('Error in fetchVisibleRoles:', error);
    return await fetchAllRoles();
  }
};

export const fetchAllMenuItems = async (): Promise<MenuItem[]> => {
  try {
    const { data, error } = await supabase
      .from('menu_items')
      .select('id, menu_name, menu_url, menu_icon, menu_order, is_active')
      .eq('is_active', true)
      .order('menu_order', { ascending: true });

    if (error || !data || data.length === 0) {
      console.warn('No menu items found, using fallback');
      return getMenuStructureFromRoutes();
    }

    // Map ke format MenuItem yang diharapkan
    return data.map(item => ({
      id: item.id,
      name: item.menu_name,
      path: item.menu_url || '/',
      icon: item.menu_icon,
      parent_id: null, // Flat structure untuk sekarang
      order_index: item.menu_order || 0,
      is_active: item.is_active,
      children: []
    }));
  } catch (error) {
    console.error('Error in fetchAllMenuItems:', error);
    return getMenuStructureFromRoutes();
  }
};

const buildMenuHierarchy = (flatMenus: MenuItem[]): MenuItem[] => {
  const menuMap = new Map<string, MenuItem>();
  const rootMenus: MenuItem[] = [];

  flatMenus.forEach(menu => {
    menuMap.set(menu.id, { ...menu, children: [] });
  });

  flatMenus.forEach(menu => {
    const menuItem = menuMap.get(menu.id)!;
    if (menu.parent_id) {
      const parent = menuMap.get(menu.parent_id);
      if (parent) {
        parent.children = parent.children || [];
        parent.children.push(menuItem);
      }
    } else {
      rootMenus.push(menuItem);
    }
  });

  return rootMenus;
};

const getMenuStructureFromRoutes = (): MenuItem[] => {
  return [
    {
      id: 'dashboard',
      name: 'Dashboard',
      path: '/',
      icon: 'LayoutDashboard',
      parent_id: null,
      order_index: 1,
      is_active: true,
      children: []
    }
  ];
};

export const fetchAllPermissions = async (): Promise<Permission[]> => {
  try {
    // Menggunakan role_menu_items yang ada di database
    const { data, error } = await supabase
      .from('role_menu_items')
      .select(`
        id,
        role_id,
        menu_id,
        can_view,
        can_create,
        can_edit,
        can_delete
      `);

    if (error) throw new Error(`Failed to fetch permissions: ${error.message}`);
    
    // Map ke format Permission yang diharapkan
    return (data || []).map(item => ({
      id: item.id,
      role_id: item.role_id, // Keep as UUID string
      menu_id: item.menu_id,
      can_view: item.can_view || false,
      can_create: item.can_create || false,
      can_update: item.can_edit || false, // can_edit -> can_update
      can_delete: item.can_delete || false,
      can_export: item.can_view || false, // Default: sama dengan can_view
      can_import: item.can_create || false // Default: sama dengan can_create
    }));
  } catch (error) {
    console.error('Error in fetchAllPermissions:', error);
    throw error;
  }
};

// ============================================================================
// DATA PROCESSING FUNCTIONS
// ============================================================================

export const buildAccessMatrix = (
  roles: Role[],
  menus: MenuItem[],
  permissions: Permission[]
): MatrixData[] => {
  const permissionMap = new Map<string, Permission>();
  
  permissions.forEach(perm => {
    const key = `${perm.role_id}-${perm.menu_id}`;
    permissionMap.set(key, perm);
  });

  const flatMenus = flattenMenus(menus);

  return flatMenus.map(menu => {
    const accessByRole = new Map<string, AccessLevel>();
    
    roles.forEach(role => {
      const key = `${role.id}-${menu.id}`;
      const perm = permissionMap.get(key);
      
      if (perm) {
        accessByRole.set(role.id, {
          canView: perm.can_view,
          canCreate: perm.can_create,
          canUpdate: perm.can_update,
          canDelete: perm.can_delete,
          canExport: perm.can_export,
          canImport: perm.can_import
        });
      } else {
        accessByRole.set(role.id, getNoAccess());
      }
    });

    return { menu, accessByRole };
  });
};

const flattenMenus = (menus: MenuItem[]): MenuItem[] => {
  const result: MenuItem[] = [];
  
  const flatten = (items: MenuItem[]) => {
    items.forEach(item => {
      result.push(item);
      if (item.children && item.children.length > 0) {
        flatten(item.children);
      }
    });
  };
  
  flatten(menus);
  return result;
};

export const filterMatrix = (
  data: MatrixData[],
  searchQuery: string,
  roleFilter: string
): MatrixData[] => {
  let filtered = data;

  if (searchQuery && searchQuery.trim() !== '') {
    const query = searchQuery.toLowerCase().trim();
    filtered = filtered.filter(item =>
      item.menu.name.toLowerCase().includes(query) ||
      item.menu.path.toLowerCase().includes(query)
    );
  }

  return filtered;
};

export const calculateStatistics = (
  data: MatrixData[],
  roles: Role[]
): RoleStatistics[] => {
  return roles.map(role => {
    const totalMenus = data.length;
    let accessibleMenus = 0;
    let fullAccessCount = 0;
    let readOnlyCount = 0;

    data.forEach(item => {
      const access = item.accessByRole.get(role.id);
      if (access && access.canView) {
        accessibleMenus++;
        
        if (access.canCreate && access.canUpdate && access.canDelete) {
          fullAccessCount++;
        } else if (!access.canCreate && !access.canUpdate && !access.canDelete) {
          readOnlyCount++;
        }
      }
    });

    const accessPercentage = totalMenus > 0 ? (accessibleMenus / totalMenus) * 100 : 0;

    return {
      roleId: role.id,
      roleName: role.role_name,
      totalMenus,
      accessibleMenus,
      fullAccessCount,
      readOnlyCount,
      noAccessCount: totalMenus - accessibleMenus,
      accessPercentage: Math.round(accessPercentage * 100) / 100
    };
  });
};

const getNoAccess = (): AccessLevel => ({
  canView: false,
  canCreate: false,
  canUpdate: false,
  canDelete: false,
  canExport: false,
  canImport: false
});

export const getVisibleRoles = (
  allRoles: Role[],
  currentUserRole: Role | null
): Role[] => {
  if (!currentUserRole) return [];
  if (currentUserRole.role_name === 'Super Admin') return allRoles;
  return allRoles.filter(role => role.level >= currentUserRole.level);
};

export const getAccessLevelType = (access: AccessLevel): 'full' | 'partial' | 'readonly' | 'none' => {
  if (!access.canView) return 'none';
  if (access.canCreate && access.canUpdate && access.canDelete) return 'full';
  if (!access.canCreate && !access.canUpdate && !access.canDelete) return 'readonly';
  return 'partial';
};


// ============================================================================
// PERMISSION UPDATE FUNCTIONS
// ============================================================================

/**
 * Update role menu access permissions
 * @param roleId - ID role
 * @param menuId - ID menu
 * @param permissions - Permission baru
 * @returns Success status
 */
export const updateRoleMenuAccess = async (
  roleId: string, // UUID
  menuId: string,
  permissions: AccessLevel
): Promise<{ success: boolean; message?: string }> => {
  try {
    // Cari existing permission
    const { data: existing, error: fetchError } = await supabase
      .from('role_menu_items')
      .select('id')
      .eq('role_id', roleId)
      .eq('menu_id', menuId)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      throw fetchError;
    }

    const updateData = {
      role_id: roleId,
      menu_id: menuId,
      can_view: permissions.canView,
      can_create: permissions.canCreate,
      can_edit: permissions.canUpdate, // Map canUpdate -> can_edit
      can_delete: permissions.canDelete,
      updated_at: new Date().toISOString()
    };

    if (existing) {
      // Update existing
      const { error: updateError } = await supabase
        .from('role_menu_items')
        .update(updateData)
        .eq('id', existing.id);

      if (updateError) throw updateError;
    } else {
      // Insert new
      const { error: insertError } = await supabase
        .from('role_menu_items')
        .insert(updateData);

      if (insertError) throw insertError;
    }

    return { success: true };
  } catch (error) {
    console.error('Error updating role menu access:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Gagal mengupdate permission'
    };
  }
};

/**
 * Bulk update permissions untuk multiple menu
 * @param roleId - ID role
 * @param updates - Array of menu updates
 * @returns Success status
 */
export const bulkUpdateRoleMenuAccess = async (
  roleId: string, // UUID
  updates: Array<{ menuId: string; permissions: AccessLevel }>
): Promise<{ success: boolean; message?: string; failedCount?: number }> => {
  try {
    let failedCount = 0;
    
    for (const update of updates) {
      const result = await updateRoleMenuAccess(roleId, update.menuId, update.permissions);
      if (!result.success) {
        failedCount++;
      }
    }

    if (failedCount > 0) {
      return {
        success: false,
        message: `${failedCount} dari ${updates.length} update gagal`,
        failedCount
      };
    }

    return { success: true };
  } catch (error) {
    console.error('Error in bulk update:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Gagal bulk update'
    };
  }
};
