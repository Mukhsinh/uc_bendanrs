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
        // The primary key on user_profiles is 'id' which references auth.users.id
        const { data: profile, error: profileError } = await supabase
          .from('user_profiles')
          .select('tenant_id')
          .eq('id', userId)
          .maybeSingle();

        if (!profile?.tenant_id) {
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
   * Sign in with password
   * Tenant detection is optional and non-blocking.
   * If multi-tenant tables don't exist, login proceeds without tenant context.
   */
  async signInWithPassword(credentials: SignInWithPasswordCredentials & { selectedTenantId?: string }) {
    const { selectedTenantId, ...authCredentials } = credentials;

    // 1. Perform core authentication
    const { data, error } = await supabase.auth.signInWithPassword(authCredentials);

    if (error || !data.user) {
      return { data, error };
    }

    // 2. Attempt tenant context setup (fully optional)
    let tenantInfo: TenantInfo | null = null;

    try {
      // 2a. Try to get user profile for tenant_id
      let profileTenantId: string | null = null;
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('tenant_id')
        .eq('id', data.user.id)
        .maybeSingle();

      if (!profileError && profile?.tenant_id) {
        profileTenantId = profile.tenant_id;
      }

      // 2b. Try to determine user role
      let userRole = 'user';
      const { data: userRoleLink, error: roleError } = await supabase
        .from('user_roles')
        .select('role_id, role_akses_aplikasi(role_name)')
        .eq('user_id', data.user.id)
        .limit(1)
        .maybeSingle();

      if (!roleError && userRoleLink) {
        userRole = (userRoleLink.role_akses_aplikasi as any)?.role_name || 'user';
      }

      // Fallback: check user metadata for role
      if (userRole === 'user') {
        const metaRole =
          (data.user.app_metadata as any)?.role ||
          (data.user.user_metadata as any)?.role;
        if (metaRole) userRole = String(metaRole);
      }

      const isSuperAdmin =
        userRole === 'admin' ||
        userRole === 'Super Admin' ||
        userRole === 'superadmin';

      // 2c. Determine final tenant ID
      const userAppMetadata = (data.user.app_metadata || {}) as Record<string, unknown>;
      const userMetadata = (data.user.user_metadata || {}) as Record<string, unknown>;
      let finalTenantId: string | null =
        selectedTenantId ||
        profileTenantId ||
        (typeof userAppMetadata.tenant_id === 'string' ? userAppMetadata.tenant_id : null) ||
        (typeof userMetadata.tenant_id === 'string' ? userMetadata.tenant_id : null) ||
        null;

      // Superadmin fallback: pick first available tenant
      if (!finalTenantId && isSuperAdmin) {
        const { data: tenants } = await this.getTenants();
        if (tenants && tenants.length > 0) {
          finalTenantId = tenants[0].id;
        }
      }

      // 2d. Fetch tenant details if we have an ID
      if (finalTenantId) {
        const { data: tenant, error: tenantError } = await supabase
          .from('tenants')
          .select('id, name, slug, logo_url, is_active')
          .eq('id', finalTenantId)
          .single();

        if (!tenantError && tenant?.is_active) {
          tenantInfo = tenant as TenantInfo;
        }
      }
    } catch (err) {
      // Tenant system not available — this is fine, continue without tenant context
      console.warn('Tenant context setup skipped (tables may not exist):', err);
    }

    // 3. Persist tenant context if available
    if (tenantInfo && typeof window !== 'undefined') {
      sessionStorage.setItem('tenant_id', tenantInfo.id);
      sessionStorage.setItem('tenant_name', tenantInfo.name);
    }

    // 4. Return success (with or without tenant)
    return { data: { ...data, tenant: tenantInfo }, error: null };
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

