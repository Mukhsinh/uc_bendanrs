
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env file');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { persistSession: false }
});

async function main() {
  console.log('🔍 Checking database...');
  
  // List all tables
  console.log('\n📊 Current tables in database:');
  
  // First, try to get all tables using a basic query
  try {
    const { data, error } = await supabase
      .rpc('exec_sql', {
        sql_query: `
          SELECT tablename 
          FROM pg_tables 
          WHERE schemaname = 'public'
          ORDER BY tablename;
        `
      });
      
    if (data) {
      console.log('✅ Tables found:', data);
    } else {
      console.log('⚠️ No tables returned (exec_sql function might not exist)');
    }
  } catch (err) {
    console.log('⚠️ Could not list tables via exec_sql, trying a different approach...');
    
    // Try to check some common tables
    const commonTables = [
      'tenants', 'tenant_settings', 'user_roles', 'user_profiles', 'users_with_roles',
      'daftar_tindakan', 'data_barang_farmasi', 'data_barang_gizi', 'data_dokter', 
      'data_kegiatan', 'data_biaya', 'data_pendapatan', 'budgeting_bhp_farmasi',
      'cost_recovery', 'branding_settings', 'audit_trail'
    ];
    
    for (const table of commonTables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('count', { count: 'exact', head: true });
          
        if (error) {
          console.log(`❌ Table "${table}":`, error.message);
        } else {
          console.log(`✅ Table "${table}": ${data.count} records`);
        }
      } catch {
        console.log(`❌ Table "${table}": Does not exist`);
      }
    }
  }
  
  console.log('\n✅ Database check complete!');
}

main().catch(console.error);
