// Script untuk fix database menggunakan Supabase client
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Baca .env file
const envFile = fs.readFileSync('.env', 'utf-8');
const env = {};
envFile.split('\n').forEach(line => {
  const [key, value] = line.split('=');
  if (key && value) {
    env[key.trim()] = value.trim();
  }
});

const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseKey = env.VITE_SUPABASE_ANON_KEY;

console.log('🔧 Connecting to Supabase...');
console.log('URL:', supabaseUrl);

const supabase = createClient(supabaseUrl, supabaseKey);

async function disableRLS() {
  console.log('\n🚀 Starting database fix...\n');
  
  // Test connection
  const { data: testData, error: testError } = await supabase
    .from('data_kegiatan')
    .select('count')
    .limit(1);
  
  if (testError) {
    console.log('⚠️  Connection test failed:', testError.message);
    console.log('\n❌ Cannot execute SQL directly with anon key.');
    console.log('✅ Solution: Run SQL script manually in Supabase SQL Editor\n');
    showManualInstructions();
    return;
  }
  
  console.log('✅ Connected successfully!');
  console.log('\n⚠️  Note: Disabling RLS requires service role key or SQL Editor.');
  console.log('✅ Opening browser with instructions...\n');
  
  showManualInstructions();
}

function showManualInstructions() {
  const sql = `-- Nonaktifkan RLS untuk data_kegiatan
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

-- Verifikasi hasil
SELECT 'RLS berhasil dinonaktifkan!' as status;`;

  console.log('═══════════════════════════════════════════════════');
  console.log('📋 COPY SCRIPT SQL INI:');
  console.log('═══════════════════════════════════════════════════\n');
  console.log(sql);
  console.log('\n═══════════════════════════════════════════════════');
  console.log('🌐 PASTE DI SUPABASE SQL EDITOR:');
  console.log('═══════════════════════════════════════════════════');
  console.log('https://supabase.com/dashboard/project/koepzicdtovtknsqlnac/sql/new\n');
  
  // Try to open browser
  const open = require('child_process').exec;
  open('start OPEN-SUPABASE-SQL-EDITOR.html', (error) => {
    if (!error) {
      console.log('✅ Browser opened with instructions!');
    }
  });
}

disableRLS().catch(error => {
  console.error('\n❌ Error:', error.message);
  showManualInstructions();
});
