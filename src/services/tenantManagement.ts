import { supabase } from '@/integrations/supabase/client';
import { createTenant as createTenantOnboarding } from './tenantOnboarding';
import { logAuditTrail, logUpdate, logView } from '@/utils/auditTrail';
import type { Tenant, CreateTenantFormData, UserWithRole } from '@/types/tenant-management';

/**
 * Fetch all tenants with optional filtering
 * @param searchQuery - Search query untuk filter nama atau slug
 * @param statusFilter - Filter berdasarkan status (all, active, inactive)
 * @returns Array of tenants dengan user count
 */
export const fetchTenants = async (
  searchQuery: string = '',
  statusFilter: 'all' | 'active' | 'inactive' = 'all'
): Promise<Tenant[]> => {
  try {
    // Gunakan RPC function yang sudah dibuat untuk mendapatkan tenant dengan user count
    const { data, error } = await supabase.rpc('get_tenants_with_user_count', {
      p_search: searchQuery || null,
      p_status_filter: statusFilter
    });

    if (error) {
      console.error('RPC error:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching tenants:', error);
    throw error;
  }
};

/**
 * Fetch users by tenant ID
 * @param tenantId - ID tenant
 * @returns Array of users dalam tenant
 */
export const fetchUsersByTenant = async (tenantId: string): Promise<UserWithRole[]> => {
  try {
    // Log super admin access untuk viewing tenant users
    const { data: { user } } = await supabase.auth.getUser();
    if (user?.email === 'mukhsin9@gmail.com') {
      // Log audit trail untuk super admin access
      await logView('user_profiles', `Super admin viewed users for tenant ${tenantId}`).catch(err => {
        console.error('Failed to log audit trail:', err);
      });
    }

    // Gunakan view yang sudah dibuat untuk mendapatkan data lengkap
    const { data, error } = await supabase
      .from('user_list_with_email')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Map data ke format UserWithRole
    return (data || []).map(user => ({
      id: user.id,
      email: user.email || '-',
      created_at: user.created_at,
      last_sign_in_at: user.last_sign_in_at,
      full_name: user.full_name,
      phone: user.phone,
      tenant_id: user.tenant_id,
      tenant_name: user.tenant_name,
      role_id: user.role_id || '',
      role_name: user.role_name || 'User',
      role_is_active: user.role_is_active || false
    }));
  } catch (error) {
    console.error('Error fetching users by tenant:', error);
    throw error;
  }
};

/**
 * Toggle tenant active status
 * @param tenantId - ID tenant
 * @param isActive - Status baru (true = active, false = inactive)
 * @returns Success result
 */
export const toggleTenantStatus = async (
  tenantId: string,
  isActive: boolean
): Promise<{ success: boolean; message?: string }> => {
  try {
    // Get old status before update
    const { data: oldTenant } = await supabase
      .from('tenants')
      .select('is_active')
      .eq('id', tenantId)
      .single();

    const { error } = await supabase
      .from('tenants')
      .update({ 
        is_active: isActive, 
        updated_at: new Date().toISOString() 
      })
      .eq('id', tenantId);

    if (error) throw error;

    // Log audit trail dengan old dan new status
    await logUpdate(
      'tenants',
      tenantId,
      { is_active: oldTenant?.is_active },
      { is_active: isActive },
      `Tenant status changed from ${oldTenant?.is_active ? 'active' : 'inactive'} to ${isActive ? 'active' : 'inactive'}`
    ).catch(err => {
      console.error('Failed to log audit trail:', err);
    });

    return { success: true };
  } catch (error) {
    console.error('Error toggling tenant status:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Gagal mengubah status tenant'
    };
  }
};

/**
 * Create new tenant dengan admin user
 * @param params - Tenant creation parameters
 * @returns Success result dengan tenant data
 */
export const createTenant = async (
  params: CreateTenantFormData
): Promise<{ success: boolean; data?: any; message?: string }> => {
  try {
    console.log('Creating tenant with params:', params);
    
    // Map CreateTenantFormData ke TenantOnboardingData format
    const onboardingParams = {
      tenantName: params.name,
      tenantSlug: params.slug,
      adminEmail: params.adminEmail,
      adminPassword: params.adminPassword,
      adminFullName: params.adminName
    };

    const result = await createTenantOnboarding(onboardingParams);
    
    console.log('Tenant creation result:', result);
    
    // Cek apakah result success
    if (!result.success) {
      return {
        success: false,
        message: result.error || 'Gagal membuat tenant'
      };
    }
    
    // Log audit trail untuk tenant creation
    if (result.tenantId) {
      await logAuditTrail({
        action: 'CREATE_TENANT',
        table_name: 'tenants',
        record_id: result.tenantId,
        new_values: {
          name: params.name,
          slug: params.slug,
          admin_email: params.adminEmail
        },
        description: `Created new tenant: ${params.name} (${params.slug})`
      }).catch(err => {
        console.error('Failed to log audit trail:', err);
      });
    }

    return { success: true, data: result };
  } catch (error) {
    console.error('Error creating tenant:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Gagal membuat tenant'
    };
  }
};
