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

interface TenantInfo {
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
   * Get tenant information for the current user
   * Extracts tenant_id from user metadata and fetches tenant details
   */
  async getTenantInfo(userId: string): Promise<{ data: TenantInfo | null; error: Error | null }> {
    try {
      // Get user profile which contains tenant_id
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('tenant_id')
        .eq('user_id', userId)
        .single();

      if (profileError || !profile?.tenant_id) {
        return { data: null, error: new Error('User profile or tenant not found') };
      }

      // Get tenant details
      const { data: tenant, error: tenantError } = await supabase
        .from('tenants')
        .select('id, name, slug, logo_url, is_active')
        .eq('id', profile.tenant_id)
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
  async signInWithPassword(credentials: SignInWithPasswordCredentials) {
    // Perform authentication
    const { data, error } = await supabase.auth.signInWithPassword(credentials);

    if (error || !data.user) {
      return { data, error };
    }

    // Get and validate tenant info
    const { data: tenantInfo, error: tenantError } = await this.getTenantInfo(data.user.id);

    if (tenantError || !tenantInfo) {
      // Sign out if tenant validation fails
      await supabase.auth.signOut();
      return {
        data: null,
        error: new Error('Tenant validation failed: ' + (tenantError?.message || 'Unknown error')),
      };
    }

    // Set tenant context in session storage for persistence
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('tenant_id', tenantInfo.id);
      sessionStorage.setItem('tenant_name', tenantInfo.name);
    }

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

