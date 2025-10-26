// Script MCP untuk fix database menggunakan Supabase client
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { exec } from 'child_process';

console.log('🔧 MCP Database Fix Tool\n');

// Baca .env file
const envFile = readFileSync('.env', 'utf-8');
const env = {};
envFile.split('\n').forEach(line => {
  const [key, ...valueParts] = line.split('=');
  if (key && valueParts.length > 0) {
    const value = valueParts.join('=').trim();
    env[key.trim()] = value.replace(/["']/g, '');
  }
});

const supabaseUrl = env.VITE_SUPABASE_URL || 'https://koepzicdtovtknsqlnac.supabase.co';
const supabaseKey = env.VITE_SUPABASE_ANON_KEY;

console.log('📡 Connecting to Supabase...');
console.log('🌐 URL:', supabaseUrl);
console.log('');

const supabase = createClient(supabaseUrl, supabaseKey);

const sqlScript = `-- Nonaktifkan RLS untuk data_kegiatan
ALTER TABLE data_kegiatan DISABLE ROW LEVEL SECURITY;

-- Nonaktifkan RLS untuk data_akomodasi_inap  
ALTER TABLE data_akomodasi_inap DISABLE ROW LEVEL SECURITY;

-- Hapus semua policy yang konflik
DROP POLICY IF EXISTS "data_kegiatan_select" ON data_kegiatan;
DROP POLICY IF EXISTS "data_kegiatan_insert" ON data_kegiatan;
DROP POLICY IF EXISTS "data_kegiatan_update" ON data_kegiatan;
DROP POLICY IF EXISTS "data_kegiatan_delete" ON data_kegiatan;
DROP POLICY IF EXISTS "Allow all operations on data_kegiatan" ON data_kegiatan;
DROP POLICY IF EXISTS "Users can update own data_kegiatan" ON data_kegiatan;
DROP POLICY IF EXISTS "Users can insert own data_kegiatan" ON data_kegiatan;
DROP POLICY IF EXISTS "Users can view own data_kegiatan" ON data_kegiatan;
DROP POLICY IF EXISTS "Users can delete own data_kegiatan" ON data_kegiatan;

-- Verifikasi hasil
SELECT 'RLS berhasil dinonaktifkan!' as status;`;

async function fixDatabase() {
  try {
    // Test connection
    console.log('✅ Testing connection...');
    const { data, error } = await supabase
      .from('data_kegiatan')
      .select('count', { count: 'exact', head: true });
    
    if (error) {
      console.log('⚠️  Connection test result:', error.message);
    } else {
      console.log('✅ Connection successful!');
    }
    
    console.log('\n' + '═'.repeat(60));
    console.log('⚠️  IMPORTANT NOTICE:');
    console.log('═'.repeat(60));
    console.log('RLS operations require SERVICE ROLE KEY or SQL Editor.');
    console.log('Anon key cannot modify database schema or policies.');
    console.log('═'.repeat(60) + '\n');
    
    console.log('📋 SOLUTION: Copy SQL script below and run in Supabase SQL Editor\n');
    console.log('═'.repeat(60));
    console.log('SQL SCRIPT:');
    console.log('═'.repeat(60));
    console.log(sqlScript);
    console.log('═'.repeat(60) + '\n');
    
    console.log('🌐 OPEN THIS URL:');
    console.log('https://supabase.com/dashboard/project/koepzicdtovtknsqlnac/sql/new\n');
    
    console.log('📝 STEPS:');
    console.log('1. Copy the SQL script above');
    console.log('2. Open the Supabase URL');
    console.log('3. Paste script in SQL Editor');
    console.log('4. Click RUN button');
    console.log('5. Refresh your application\n');
    
    // Try to open HTML guide
    console.log('🚀 Opening browser guide...');
    exec('start OPEN-SUPABASE-SQL-EDITOR.html', (error) => {
      if (error) {
        console.log('⚠️  Could not open browser automatically');
        console.log('📁 Please open: OPEN-SUPABASE-SQL-EDITOR.html manually\n');
      } else {
        console.log('✅ Browser guide opened!\n');
      }
    });
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.log('\n💡 Please follow manual instructions above.\n');
  }
}

fixDatabase();
