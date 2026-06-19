import type {
  AuthChangeEvent,
  AuthError,
  Session,
  SignInWithPasswordCredentials,
  User,
} from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

type AuthStateListener = (
  event: AuthChangeEvent,
  session: Session | null
) => void;

export interface TenantInfo {
  id: string;
  name: string;
  slug: string;
  logo_url?: string;
  is_active: boolean;
}

export const authService = {
  async getSession() {
    return supabase.auth.getSession();
  },

  async getUser(): Promise<{ data: { user: User | null }; error: AuthError | null }> {
    return supabase.auth.getUser();
  },

  async refreshSession() {
    return supabase.auth.getSession();
  },

  /**
   * Get all active tenants
   * Used for organization selection on login page
   */
  async getTenants(): Promise<{ data: TenantInfo[] | null; error: Error | null }> {
    try {
      const { data, error } = await supabase
        .from('tenants')
        .select('id, name, slug, logo_url, is_active')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      return { data: data as TenantInfo[], error: null };
    } catch (error) {
      console.error('Error fetching tenants:', error);
      return { data: null, error: error as Error };
    }
  },

  /**
   * Get tenant information for the current user
   * Extracts tenant_id from user metadata and fetches tenant details
   */
  async getTenantInfo(userId: string): Promise<{ data: TenantInfo | null; error: Error | null }> {
    try {
      // Prefer tenant_id from session storage (set during login)
      let tenantId = typeof window !== 'undefined' ? sessionStorage.getItem('tenant_id') : null;

      if (!tenantId) {
        // Fallback to user profile which contains primary tenant_id
        const { data: profile, error: profileError } = await supabase
          .from('user_profiles')
          .select('tenant_id')
          .eq('user_id', userId)
          .single();

        if (profileError || !profile?.tenant_id) {
          return { data: null, error: new Error('User profile or tenant not found') };
        }
        tenantId = profile.tenant_id;
      }

      // Get tenant details
      const { data: tenant, error: tenantError } = await supabase
        .from('tenants')
        .select('id, name, slug, logo_url, is_active')
        .eq('id', tenantId)
        .single();

      if (tenantError || !tenant) {
        return { data: null, error: new Error('Tenant not found') };
      }

      // Verify tenant is active
      if (!tenant.is_active) {
        return { data: null, error: new Error('Tenant is not active') };
      }

      return { data: tenant as TenantInfo, error: null };
    } catch (error) {
      return { data: null, error: error as Error };
    }
  },

  /**
   * Sign in with password and validate tenant
   * Enhanced to include tenant detection and validation
   */
  async signInWithPassword(credentials: SignInWithPasswordCredentials & { selectedTenantId?: string }) {
    const { selectedTenantId, ...authCredentials } = credentials;

    // Perform authentication
    const { data, error } = await supabase.auth.signInWithPassword(authCredentials);

    if (error || !data.user) {
      return { data, error };
    }

    // Get user profile to check role and assigned tenant
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('tenant_id, roles(name)')
      .eq('user_id', data.user.id)
      .single();

    if (profileError || !profile) {
      await supabase.auth.signOut();
      return { data: null, error: new Error('User profile not found') };
    }

    const userRole = (profile.roles as any)?.name;
    const isSuperAdmin = userRole === 'admin';

    // Validate tenant access
    let finalTenantId = selectedTenantId || profile.tenant_id;

    if (!isSuperAdmin) {
      // Normal user must belong to the selected tenant
      if (selectedTenantId && profile.tenant_id !== selectedTenantId) {
        await supabase.auth.signOut();
        return {
          data: null,
          error: new Error('Anda tidak memiliki akses ke organisasi ini.')
        };
      }

      // If no tenant selected, use assigned tenant
      if (!finalTenantId) {
        await supabase.auth.signOut();
        return { data: null, error: new Error('Organisasi belum diatur untuk user ini.') };
      }
    } else {
      // Superadmin can access any tenant, default to selected or profile's if none
      if (!finalTenantId) {
        // Fallback for superadmin if no tenant selected and no primary tenant
        const { data: tenants } = await this.getTenants();
        if (tenants && tenants.length > 0) {
          finalTenantId = tenants[0].id;
        } else {
          await supabase.auth.signOut();
          return { data: null, error: new Error('Tidak ada organisasi yang tersedia.') };
        }
      }
    }

    // Get tenant info for the final tenant ID
    const { data: tenant, error: tenantError } = await supabase
      .from('tenants')
      .select('id, name, slug, logo_url, is_active')
      .eq('id', finalTenantId)
      .single();

    if (tenantError || !tenant) {
      await supabase.auth.signOut();
      return { data: null, error: new Error('Informasi organisasi tidak ditemukan.') };
    }

    if (!tenant.is_active) {
      await supabase.auth.signOut();
      return { data: null, error: new Error('Organisasi sedang tidak aktif.') };
    }

    // Set tenant context in session storage for persistence
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('tenant_id', tenant.id);
      sessionStorage.setItem('tenant_name', tenant.name);
    }

    return { data: { ...data, tenant: tenant as TenantInfo }, error: null };
  },

  /**
   * Sign out and clear tenant context
   */
  async signOut() {
    // Clear tenant context from session storage
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('tenant_id');
      sessionStorage.removeItem('tenant_name');
    }

    return supabase.auth.signOut();
  },

  /**
   * Get tenant context from session storage
   */
  getTenantContext(): { tenantId: string | null; tenantName: string | null } {
    if (typeof window === 'undefined') {
      return { tenantId: null, tenantName: null };
    }

    return {
      tenantId: sessionStorage.getItem('tenant_id'),
      tenantName: sessionStorage.getItem('tenant_name'),
    };
  },

  onAuthStateChange(callback: AuthStateListener) {
    return supabase.auth.onAuthStateChange(callback);
  },
};

