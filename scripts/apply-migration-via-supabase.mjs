#!/usr/bin/env node

/**
 * Script untuk menjalankan migrasi menggunakan Supabase client
 * Menggunakan credentials dari environment atau .env file
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Function to read .env file
function loadEnvFile() {
  const envPath = join(__dirname, '..', '.env');
  const env = {};
  
  try {
    const envContent = readFileSync(envPath, 'utf8');
    const lines = envContent.split('\n');
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      if (trimmedLine && !trimmedLine.startsWith('#')) {
        const [key, ...valueParts] = trimmedLine.split('=');
        if (key && valueParts.length > 0) {
          env[key.trim()] = valueParts.join('=').trim();
        }
      }
    }
  } catch (err) {
    // .env file not found
  }
  
  return env;
}

// Load environment
const env = loadEnvFile();
const supabaseUrl = process.env.VITE_SUPABASE_URL || env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: Missing Supabase credentials');
  console.error('   Diperlukan: VITE_SUPABASE_URL dan VITE_SUPABASE_ANON_KEY');
  console.error('   Lokasi: file .env atau environment variables');
  process.exit(1);
}

console.log('✅ Credentials loaded');
console.log(`📡 Connecting to: ${supabaseUrl}\n`);

const supabase = createClient(supabaseUrl, supabaseKey);

// Migration steps - broken down into individual statements
const migrationSteps = [
  {
    name: 'Drop old column',
    sql: 'ALTER TABLE kalkulasi_tindakan_inap DROP COLUMN IF EXISTS unit_cost_tindakan_inap'
  },
  {
    name: 'Create new column',
    sql: `ALTER TABLE kalkulasi_tindakan_inap
ADD COLUMN unit_cost_tindakan_inap BIGINT GENERATED ALWAYS AS (
  COALESCE(biaya_gaji_tunjangan, 0::bigint) +
  COALESCE(biaya_makan_karyawan, 0::bigint) +
  COALESCE(biaya_rumah_tangga, 0::bigint) +
  COALESCE(biaya_cetak, 0::bigint) +
  COALESCE(biaya_atk, 0::bigint) +
  COALESCE(biaya_listrik, 0::bigint) +
  COALESCE(biaya_air, 0::bigint) +
  COALESCE(biaya_telp, 0::bigint) +
  COALESCE(biaya_pemeliharaan_bangunan, 0::bigint) +
  COALESCE(biaya_pemeliharaan_alat_medis, 0::bigint) +
  COALESCE(biaya_pemeliharaan_alat_non_medis, 0::bigint) +
  COALESCE(biaya_operasional_lainnya, 0::bigint) +
  COALESCE(biaya_penyusutan_gedung, 0::bigint) +
  COALESCE(biaya_penyusutan_jaringan, 0::bigint) +
  COALESCE(biaya_penyusutan_alat_medis, 0::bigint) +
  COALESCE(biaya_penyusutan_alat_non_medis, 0::bigint) +
  COALESCE(biaya_pendidikan_pelatihan, 0::bigint) +
  COALESCE(biaya_laundry, 0::bigint) +
  COALESCE(biaya_sterilisasi, 0::bigint) +
  COALESCE(biaya_tidak_langsung_terdistribusi, 0::bigint)
) STORED`
  }
];

async function runMigration() {
  console.log('🚀 Memulai migrasi database...\n');
  
  try {
    // Test connection first
    console.log('🔍 Testing connection...');
    const { data: testData, error: testError } = await supabase
      .from('kalkulasi_tindakan_inap')
      .select('id', { count: 'exact', head: true });
    
    if (testError) {
      console.error('❌ Connection test failed:', testError.message);
      throw testError;
    }
    
    console.log('✅ Connection successful\n');
    
    // Try to execute via RPC if available
    console.log('📝 Attempting to run migration...\n');
    
    for (let i = 0; i < migrationSteps.length; i++) {
      const step = migrationSteps[i];
      console.log(`   Step ${i + 1}: ${step.name}`);
      
      // Try direct SQL execution using Supabase SQL function
      const { data, error } = await supabase.rpc('exec_raw_sql', {
        query: step.sql
      });
      
      if (error) {
        console.error(`   ❌ Error:`, error.message);
        
        // Check if it's because exec_raw_sql doesn't exist
        if (error.message.includes('function') && error.message.includes('does not exist')) {
          console.log('\n⚠️  Direct SQL execution tidak tersedia via RPC');
          console.log('💡 Gunakan Supabase SQL Editor untuk menjalankan migrasi\n');
          console.log('📋 SQL yang perlu dijalankan:');
          console.log('═'.repeat(60));
          migrationSteps.forEach((s, idx) => {
            console.log(`\n-- Step ${idx + 1}: ${s.name}`);
            console.log(s.sql + ';');
          });
          console.log('═'.repeat(60));
          console.log('\n🌐 Buka: https://supabase.com/dashboard/project/koepzicdtovtknsqlnac/sql/new');
          process.exit(1);
        }
        
        throw error;
      }
      
      console.log(`   ✅ Step ${i + 1} berhasil`);
    }
    
    console.log('\n✅ Migrasi berhasil!\n');
    
    // Verify the changes
    console.log('🔍 Verifikasi perubahan...');
    const { data: verifyData, error: verifyError } = await supabase
      .from('kalkulasi_tindakan_inap')
      .select('unit_cost_tindakan_inap')
      .limit(1);
    
    if (verifyError) {
      console.warn('⚠️  Verifikasi warning:', verifyError.message);
    } else {
      console.log('✅ Column unit_cost_tindakan_inap tersedia dan berfungsi');
    }
    
    console.log('\n🎉 Selesai! Silakan test fungsi perbarui data di aplikasi.\n');
    
  } catch (error) {
    console.error('\n❌ Migration error:', error.message);
    process.exit(1);
  }
}

runMigration();









