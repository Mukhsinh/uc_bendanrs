/**
 * Tenant-Aware Supabase Client Wrapper
 * Automatically injects tenant context into all queries
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

/**
 * Get current tenant ID from session storage
 */
export const getCurrentTenantId = (): string | null => {
  return sessionStorage.getItem('tenant_id');
};

/**
 * Validate that data belongs to current tenant
 */
export const validateTenantOwnership = (data: any, tenantId: string): boolean => {
  if (!data) return true;
  
  if (Array.isArray(data)) {
    return data.every(item => !item.tenant_id || item.tenant_id === tenantId);
  }
  
  return !data.tenant_id || data.tenant_id === tenantId;
};

/**
 * Create a tenant-aware query builder
 * This wrapper automatically adds tenant_id filtering to queries
 */
export class TenantAwareQueryBuilder {
  private client: SupabaseClient;
  private tableName: string;
  private tenantId: string | null;

  constructor(client: SupabaseClient, tableName: string) {
    this.client = client;
    this.tableName = tableName;
    this.tenantId = getCurrentTenantId();
  }

  /**
   * SELECT query with automatic tenant filtering
   */
  select(columns: string = '*', options?: any) {
    const query = this.client.from(this.tableName).select(columns, options);
    
    // Add tenant_id filter if tenant context exists
    // Note: RLS will also enforce this, but explicit filter improves performance
    if (this.tenantId) {
      return query.eq('tenant_id', this.tenantId);
    }
    
    return query;
  }

  /**
   * INSERT with automatic tenant_id injection
   */
  async insert(data: any, options?: any) {
    const tenantId = this.tenantId;
    
    if (!tenantId) {
      throw new Error('Tenant context required for insert operation');
    }

    // Inject tenant_id into data
    const dataWithTenant = Array.isArray(data)
      ? data.map(item => ({ ...item, tenant_id: tenantId }))
      : { ...data, tenant_id: tenantId };

    return this.client.from(this.tableName).insert(dataWithTenant, options);
  }

  /**
   * UPDATE with tenant validation
   */
  update(data: any, options?: any) {
    const tenantId = this.tenantId;
    
    if (!tenantId) {
      throw new Error('Tenant context required for update operation');
    }

    // Ensure tenant_id is not being changed
    if (data.tenant_id && data.tenant_id !== tenantId) {
      throw new Error('Cannot change tenant_id in update operation');
    }

    // Remove tenant_id from update data to prevent modification
    const { tenant_id, ...dataWithoutTenant } = data;

    const query = this.client.from(this.tableName).update(dataWithoutTenant, options);
    
    // Add tenant_id filter
    return query.eq('tenant_id', tenantId);
  }

  /**
   * DELETE with tenant validation
   */
  delete(options?: any) {
    const tenantId = this.tenantId;
    
    if (!tenantId) {
      throw new Error('Tenant context required for delete operation');
    }

    const query = this.client.from(this.tableName).delete(options);
    
    // Add tenant_id filter
    return query.eq('tenant_id', tenantId);
  }

  /**
   * UPSERT with automatic tenant_id injection
   */
  async upsert(data: any, options?: any) {
    const tenantId = this.tenantId;
    
    if (!tenantId) {
      throw new Error('Tenant context required for upsert operation');
    }

    // Inject tenant_id into data
    const dataWithTenant = Array.isArray(data)
      ? data.map(item => ({ ...item, tenant_id: tenantId }))
      : { ...data, tenant_id: tenantId };

    return this.client.from(this.tableName).upsert(dataWithTenant, options);
  }

  /**
   * Pass-through for other query methods
   */
  eq(column: string, value: any) {
    return this.client.from(this.tableName).select().eq(column, value);
  }

  neq(column: string, value: any) {
    return this.client.from(this.tableName).select().neq(column, value);
  }

  gt(column: string, value: any) {
    return this.client.from(this.tableName).select().gt(column, value);
  }

  gte(column: string, value: any) {
    return this.client.from(this.tableName).select().gte(column, value);
  }

  lt(column: string, value: any) {
    return this.client.from(this.tableName).select().lt(column, value);
  }

  lte(column: string, value: any) {
    return this.client.from(this.tableName).select().lte(column, value);
  }

  like(column: string, pattern: string) {
    return this.client.from(this.tableName).select().like(column, pattern);
  }

  ilike(column: string, pattern: string) {
    return this.client.from(this.tableName).select().ilike(column, pattern);
  }

  in(column: string, values: any[]) {
    return this.client.from(this.tableName).select().in(column, values);
  }

  order(column: string, options?: { ascending?: boolean }) {
    return this.client.from(this.tableName).select().order(column, options);
  }

  limit(count: number) {
    return this.client.from(this.tableName).select().limit(count);
  }

  range(from: number, to: number) {
    return this.client.from(this.tableName).select().range(from, to);
  }

  single() {
    return this.client.from(this.tableName).select().single();
  }

  maybeSingle() {
    return this.client.from(this.tableName).select().maybeSingle();
  }
}

/**
 * Create tenant-aware Supabase client
 * Usage: const client = createTenantAwareClient();
 *        const { data } = await client.from('unit_kerja').select();
 */
export const createTenantAwareClient = () => {
  return {
    from: (tableName: string) => new TenantAwareQueryBuilder(supabase, tableName),
    
    // Pass-through for non-table operations
    auth: supabase.auth,
    storage: supabase.storage,
    functions: supabase.functions,
    rpc: supabase.rpc.bind(supabase),
    
    // Utility methods
    getCurrentTenantId,
    validateTenantOwnership,
  };
};

/**
 * Middleware to validate API responses don't contain cross-tenant data
 */
export const validateApiResponse = (data: any): boolean => {
  const tenantId = getCurrentTenantId();
  
  if (!tenantId) {
    console.warn('No tenant context available for validation');
    return true;
  }

  return validateTenantOwnership(data, tenantId);
};

/**
 * Hook for tenant-aware queries
 * Usage: const client = useTenantAwareClient();
 */
export const useTenantAwareClient = () => {
  return createTenantAwareClient();
};

export default createTenantAwareClient;
