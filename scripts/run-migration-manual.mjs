#!/usr/bin/env node

/**
 * Script untuk memberikan instruksi menjalankan migrasi fix unit_cost_tindakan_inap
 */

import { exec } from 'child_process';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const migrationSQL = `-- ============================================
-- Migration: Fix unit_cost_tindakan_inap
-- Menghapus referensi ke biaya_bhp yang tidak ada
-- ============================================

-- Step 1: Drop kolom generated lama
ALTER TABLE kalkulasi_tindakan_inap
DROP COLUMN IF EXISTS unit_cost_tindakan_inap;

-- Step 2: Buat ulang kolom tanpa referensi ke biaya_bhp
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

-- Step 3: Update comment dokumentasi
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

-- Verifikasi hasil
SELECT 
    column_name,
    data_type,
    is_generated,
    LEFT(generation_expression, 120) AS formula_preview
FROM information_schema.columns
WHERE table_name = 'kalkulasi_tindakan_inap'
  AND column_name = 'unit_cost_tindakan_inap';`;

console.log('\n' + '═'.repeat(80));
console.log('🔧 FIX ERROR: "record new has no field biaya_bhp"');
console.log('═'.repeat(80));
console.log('\n📋 MASALAH:');
console.log('   Generated column unit_cost_tindakan_inap mencoba menggunakan field biaya_bhp');
console.log('   yang tidak ada di tabel kalkulasi_tindakan_inap\n');

console.log('═'.repeat(80));
console.log('📝 COPY SQL SCRIPT BERIKUT:');
console.log('═'.repeat(80));
console.log(migrationSQL);
console.log('═'.repeat(80) + '\n');

console.log('🌐 OPEN SUPABASE SQL EDITOR:');
console.log('   https://supabase.com/dashboard/project/koepzicdtovtknsqlnac/sql/new\n');

console.log('📋 LANGKAH-LANGKAH:');
console.log('   1. Copy SQL script di atas');
console.log('   2. Buka URL Supabase SQL Editor');
console.log('   3. Paste script di editor');
console.log('   4. Klik tombol RUN (atau Ctrl+Enter)');
console.log('   5. Tunggu sampai selesai (Success ✅)');
console.log('   6. Refresh aplikasi Anda\n');

console.log('✅ HASIL YANG DIHARAPKAN:');
console.log('   - Error "biaya_bhp" hilang');
console.log('   - Fungsi Perbarui Data berjalan sempurna');
console.log('   - Column menggunakan 20 komponen biaya (tanpa biaya_bhp)\n');

console.log('═'.repeat(80));
console.log('💡 Script ini dibuat karena MCP tools memerlukan authorization tambahan.');
console.log('   Menjalankan SQL manual di Supabase SQL Editor adalah cara termudah.');
console.log('═'.repeat(80) + '\n');

// Try to open the Supabase dashboard
console.log('🚀 Mencoba membuka Supabase SQL Editor...');
const url = 'https://supabase.com/dashboard/project/koepzicdtovtknsqlnac/sql/new';

// Open browser (works on Windows, macOS, Linux)
const command = process.platform === 'win32' 
  ? `start ${url}` 
  : process.platform === 'darwin' 
  ? `open ${url}` 
  : `xdg-open ${url}`;

exec(command, (error) => {
  if (error) {
    console.log('⚠️  Browser tidak bisa dibuka otomatis');
    console.log('   Silakan buka URL manual di browser Anda\n');
  } else {
    console.log('✅ Browser dibuka! Silakan paste SQL script di editor.\n');
  }
});


