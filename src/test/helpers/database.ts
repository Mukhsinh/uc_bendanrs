import { createClient } from '@supabase/supabase-js';

// Create Supabase client untuk testing
// Menggunakan service role key untuk bypass RLS saat testing
export const createTestClient = () => {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseServiceKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error(
      'Missing Supabase credentials for testing.\n' +
      'Please add VITE_SUPABASE_SERVICE_ROLE_KEY to your .env.local file.\n' +
      'You can find the service role key in your Supabase project settings:\n' +
      'https://supabase.com/dashboard/project/_/settings/api'
    );
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
};

// Helper untuk cleanup test data
export const cleanupTestTenants = async (testTenantIds: string[]) => {
  const client = createTestClient();
  
  for (const tenantId of testTenantIds) {
    await client.from('tenants').delete().eq('id', tenantId);
  }
};

// Helper untuk membuat test tenant
export const createTestTenant = async (name: string): Promise<string> => {
  const client = createTestClient();
  
  const slug = name.toLowerCase().replace(/\s+/g, '-');
  
  const { data: tenant, error } = await client
    .from('tenants')
    .insert({
      name,
      slug,
      is_active: true,
      status: 'active'
    })
    .select()
    .single();

  if (error) throw error;
  return tenant.id;
};

// Helper untuk cleanup single test tenant
export const cleanupTestTenant = async (tenantId: string) => {
  const client = createTestClient();
  await client.from('tenants').delete().eq('id', tenantId);
};

// Helper untuk set tenant context
export const setTenantContext = async (tenantId: string | null) => {
  const client = createTestClient();
  
  if (tenantId === null) {
    // Clear tenant context
    const { error } = await client.rpc('set_config', {
      setting_name: 'app.current_tenant_id',
      new_value: '',
      is_local: false
    });
    return;
  }
  
  // Set tenant context
  const { error } = await client.rpc('set_tenant_context', {
    tenant_id: tenantId
  });
  
  if (error) throw error;
};
