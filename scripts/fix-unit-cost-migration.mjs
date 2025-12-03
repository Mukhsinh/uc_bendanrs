#!/usr/bin/env node

/**
 * Script untuk menjalankan migrasi fix unit_cost_tindakan_inap
 * Menghapus dan membuat ulang generated column tanpa referensi ke biaya_bhp
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from .env file manually
const envPath = join(__dirname, '..', '.env');
let supabaseUrl = process.env.VITE_SUPABASE_URL;
let supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

// If not in environment, try to read from .env file
if (!supabaseUrl || !supabaseServiceKey) {
  try {
    const envContent = readFileSync(envPath, 'utf8');
    const envLines = envContent.split('\n');
    
    for (const line of envLines) {
      if (line.startsWith('VITE_SUPABASE_URL=')) {
        supabaseUrl = line.split('=')[1].trim();
      }
      if (line.startsWith('VITE_SUPABASE_SERVICE_ROLE_KEY=')) {
        supabaseServiceKey = line.split('=')[1].trim();
      }
    }
  } catch (err) {
    // .env file not found or can't be read
  }
}

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: Missing Supabase credentials in .env file');
  console.error('   Required: VITE_SUPABASE_URL and VITE_SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Migration SQL
const migrationSQL = `
-- Step 1: Drop kolom generated lama jika sudah ada
ALTER TABLE kalkulasi_tindakan_inap
DROP COLUMN IF EXISTS unit_cost_tindakan_inap;

-- Step 2: Tambahkan kembali kolom unit_cost_tindakan_inap tanpa referensi ke biaya_bhp
ALTER TABLE kalkulasi_tindakan_inap
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
) STORED;

-- Step 3: Update comment dokumentasi agar konsisten dengan formula baru
COMMENT ON COLUMN kalkulasi_tindakan_inap.unit_cost_tindakan_inap IS 
'Generated column: Total unit cost tindakan inap (20 komponen biaya, tanpa biaya_bhp).
Formula: SUM(biaya_gaji_tunjangan + biaya_makan_karyawan + biaya_rumah_tangga +
biaya_cetak + biaya_atk + biaya_listrik + biaya_air + biaya_telp +
biaya_pemeliharaan_bangunan + biaya_pemeliharaan_alat_medis +
biaya_pemeliharaan_alat_non_medis + biaya_operasional_lainnya +
biaya_penyusutan_gedung + biaya_penyusutan_jaringan +
biaya_penyusutan_alat_medis + biaya_penyusutan_alat_non_medis +
biaya_pendidikan_pelatihan + biaya_laundry + biaya_sterilisasi +
biaya_tidak_langsung_terdistribusi).
CATATAN: Tidak termasuk biaya_bahan_tindakan (kolom terpisah).';
`;

// Verification SQL
const verificationSQL = `
SELECT 
    column_name,
    data_type,
    is_generated,
    LEFT(generation_expression, 120) AS formula_preview
FROM information_schema.columns
WHERE table_name = 'kalkulasi_tindakan_inap'
  AND column_name = 'unit_cost_tindakan_inap';
`;

async function runMigration() {
  console.log('🚀 Memulai migrasi fix unit_cost_tindakan_inap...\n');
  
  try {
    // Split SQL into statements
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log(`📝 Menjalankan ${statements.length} SQL statements...\n`);
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      console.log(`   ${i + 1}. Menjalankan statement...`);
      
      const { data, error } = await supabase.rpc('exec_sql', {
        sql: statement + ';'
      });
      
      if (error) {
        console.error(`   ❌ Error pada statement ${i + 1}:`, error.message);
        throw error;
      }
      
      console.log(`   ✅ Statement ${i + 1} berhasil`);
    }
    
    console.log('\n✅ Migrasi berhasil dijalankan!\n');
    
    // Verify the changes
    console.log('🔍 Verifikasi struktur column...\n');
    const { data: verifyData, error: verifyError } = await supabase.rpc('exec_sql', {
      sql: verificationSQL
    });
    
    if (verifyError) {
      console.warn('⚠️  Warning saat verifikasi:', verifyError.message);
    } else {
      console.log('📊 Hasil verifikasi:');
      console.log(JSON.stringify(verifyData, null, 2));
    }
    
    console.log('\n🎉 Proses selesai!');
    console.log('✨ Column unit_cost_tindakan_inap sudah diperbaiki');
    console.log('   Formula sekarang menggunakan 20 komponen biaya (tanpa biaya_bhp)');
    console.log('\n📝 Silakan test fungsi perbarui data di aplikasi\n');
    
  } catch (error) {
    console.error('\n❌ Migrasi gagal:', error.message);
    console.error('\n💡 Jika error terjadi, coba jalankan SQL berikut di Supabase SQL Editor:');
    console.error('═'.repeat(60));
    console.error(migrationSQL);
    console.error('═'.repeat(60));
    process.exit(1);
  }
}

// Run the migration
runMigration();

