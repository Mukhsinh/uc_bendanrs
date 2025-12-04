/**
 * TenantContext - React Context for Multi-Tenant System
 * Provides tenant information and management throughout the application
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authService } from '@/lib/authService';
import { supabase } from '@/integrations/supabase/client';

// Tenant information interface
export interface TenantInfo {
  id: string;
  name: string;
  slug: string;
  logo_url?: string;
  is_active: boolean;
  primary_color?: string;
  secondary_color?: string;
}

// Tenant context type
interface TenantContextType {
  tenant: TenantInfo | null;
  loading: boolean;
  error: Error | null;
  refreshTenant: () => Promise<void>;
  clearTenant: () => void;
}

// Create context with undefined default
const TenantContext = createContext<TenantContextType | undefined>(undefined);

// Provider props
interface TenantProviderProps {
  children: ReactNode;
}

/**
 * TenantProvider Component
 * Manages tenant state and provides it to the application
 */
export const TenantProvider: React.FC<TenantProviderProps> = ({ children }) => {
  const [tenant, setTenant] = useState<TenantInfo | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  /**
   * Load tenant information for the current user
   */
  const loadTenant = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError || !user) {
        // Jika tidak ada user, pastikan context tenant ikut dibersihkan
        try {
          if (typeof window !== 'undefined') {
            sessionStorage.removeItem('tenant_id');
            sessionStorage.removeItem('tenant_name');
          }
        } catch (storageError) {
          console.warn('Failed to clear tenant session storage on no-user state:', storageError);
        }

        setTenant(null);
        setLoading(false);
        return;
      }

      // Get tenant info from authService
      const { data: tenantInfo, error: tenantError } = await authService.getTenantInfo(user.id);

      if (tenantError || !tenantInfo) {
        setError(tenantError || new Error('Failed to load tenant'));
        setTenant(null);
        setLoading(false);
        return;
      }

      // Get tenant settings for colors
      const { data: settings } = await supabase
        .from('tenant_settings')
        .select('primary_color, secondary_color')
        .eq('tenant_id', tenantInfo.id)
        .single();

      // Combine tenant info with settings
      const fullTenantInfo: TenantInfo = {
        ...tenantInfo,
        primary_color: settings?.primary_color,
        secondary_color: settings?.secondary_color,
      };

      // Set tenant_id in Supabase session for RLS policies
      try {
        await supabase.rpc('set_config', {
          setting: 'app.current_tenant_id',
          value: tenantInfo.id
        });
      } catch (err) {
        console.warn('Failed to set tenant context in database:', err);
      }

      // Also store in sessionStorage for tenantAwareClient
      sessionStorage.setItem('tenant_id', tenantInfo.id);

      setTenant(fullTenantInfo);
      setLoading(false);
    } catch (err) {
      setError(err as Error);
      setTenant(null);
      setLoading(false);
    }
  };

  /**
   * Refresh tenant information
   */
  const refreshTenant = async () => {
    await loadTenant();
  };

  /**
   * Clear tenant information (on logout)
   */
  const clearTenant = () => {
    setTenant(null);
    setError(null);

    // Pastikan juga menghapus konteks tenant dari sessionStorage
    try {
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('tenant_id');
        sessionStorage.removeItem('tenant_name');
      }
    } catch (err) {
      console.warn('Failed to clear tenant session storage on clearTenant:', err);
    }
  };

  // Load tenant on mount and when auth state changes
  useEffect(() => {
    loadTenant();

    // Subscribe to auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        loadTenant();
      } else if (event === 'SIGNED_OUT') {
        clearTenant();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const value: TenantContextType = {
    tenant,
    loading,
    error,
    refreshTenant,
    clearTenant,
  };

  return <TenantContext.Provider value={value}>{children}</TenantContext.Provider>;
};

/**
 * useTenant Hook
 * Custom hook to access tenant context
 * @throws Error if used outside TenantProvider
 */
export const useTenant = (): TenantContextType => {
  const context = useContext(TenantContext);
  
  if (context === undefined) {
    throw new Error('useTenant must be used within a TenantProvider');
  }
  
  return context;
};

// Export context for testing purposes
export { TenantContext };
