/**
 * Supabase Tenant-Aware Wrapper
 * This module provides a tenant-aware wrapper around the Supabase client
 * that automatically injects tenant_id filters into queries
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { getCurrentTenantId, requireTenantId } from './tenantAwareClient';

/**
 * Create a tenant-aware query builder that automatically filters by tenant_id
 * This returns the actual Supabase query builder so chaining works properly
 */
function createTenantAwareQueryBuilder(tableName: string) {
  // Get tenantId fresh on each call to avoid stale values
  const getTenantId = () => getCurrentTenantId();

  // Return the actual query builder with tenant filtering
  const baseBuilder = supabase.from(tableName);
  
  // Create a proxy that intercepts method calls and adds tenant filtering
  return new Proxy(baseBuilder, {
    get(target, prop) {
      // Intercept select, update, delete methods
      if (prop === 'select') {
        return (columns?: string, options?: any) => {
          const query = target.select(columns, options);
          const tenantId = getTenantId();
          
          if (tenantId) {
            // Always add tenant_id filter for SELECT queries
            return query.eq('tenant_id', tenantId);
          } else {
            // Log warning if tenant_id is not available
            console.warn(`[tenantSupabase] Tenant ID not available for table ${tableName}. RLS policies will handle isolation, but explicit filter is recommended.`);
            // Still return query - RLS will handle isolation at database level
            return query;
          }
        };
      }
      
      if (prop === 'insert') {
        return (data: any, options?: any) => {
          // Always require tenant_id for INSERT operations
          const currentTenantId = getTenantId() || requireTenantId();
          
          const dataWithTenant = Array.isArray(data)
            ? data.map(item => ({ ...item, tenant_id: item.tenant_id || currentTenantId }))
            : { ...data, tenant_id: data.tenant_id || currentTenantId };

          return target.insert(dataWithTenant, options);
        };
      }
      
      if (prop === 'update') {
        return (data: any, options?: any) => {
          // Always require tenant_id for UPDATE operations
          const currentTenantId = getTenantId() || requireTenantId();
          
          // Remove tenant_id from update data to prevent modification
          const { tenant_id, ...dataWithoutTenant } = data;

          const query = target.update(dataWithoutTenant, options);
          
          // Always add tenant_id filter for UPDATE queries
          return query.eq('tenant_id', currentTenantId);
        };
      }
      
      if (prop === 'delete') {
        return (options?: any) => {
          // Always require tenant_id for DELETE operations
          const currentTenantId = getTenantId() || requireTenantId();
          
          const query = target.delete(options);
          
          // Always add tenant_id filter for DELETE queries
          return query.eq('tenant_id', currentTenantId);
        };
      }
      
      if (prop === 'upsert') {
        return (data: any, options?: any) => {
          // Always require tenant_id for UPSERT operations
          const currentTenantId = getTenantId() || requireTenantId();
          
          const dataWithTenant = Array.isArray(data)
            ? data.map(item => ({ ...item, tenant_id: item.tenant_id || currentTenantId }))
            : { ...data, tenant_id: data.tenant_id || currentTenantId };

          return target.upsert(dataWithTenant, options);
        };
      }
      
      // For other methods, return the original property
      const value = (target as any)[prop];
      return typeof value === 'function' ? value.bind(target) : value;
    }
  });
}

/**
 * Tenant-aware Supabase client wrapper
 * Usage: import { tenantSupabase } from '@/lib/supabase-tenant-wrapper';
 *        const { data } = await tenantSupabase.from('table').select();
 */
export const tenantSupabase = {
  from: (tableName: string) => createTenantAwareQueryBuilder(tableName),
  
  // Pass-through for non-table operations
  auth: supabase.auth,
  storage: supabase.storage,
  functions: supabase.functions,
  rpc: supabase.rpc.bind(supabase),
  
  // Direct access to underlying client if needed
  client: supabase,
};

/**
 * Helper function to get tenant-filtered query
 * This can be used as a drop-in replacement for supabase.from().select()
 */
export function getTenantFilteredQuery(tableName: string) {
  const tenantId = getCurrentTenantId();
  const baseQuery = supabase.from(tableName).select('*');
  
  if (tenantId) {
    return baseQuery.eq('tenant_id', tenantId);
  }
  
  return baseQuery;
}

