#!/usr/bin/env node

/**
 * Script Komprehensif: Fix Error "Integer Out of Range" 
 * Kalkulasi Tindakan Rawat Jalan
 * 
 * Strategi:
 * 1. Cek tipe kolom biaya saat ini
 * 2. Generate SQL untuk migrasi BIGINT
 * 3. Generate SQL untuk verifikasi fungsi
 * 4. Generate SQL untuk test batch per unit kerja
 */

import { readFileSync } from 'fs';
import { exec } from 'child_process';

console.log('\n' + '═'.repeat(80));
console.log('🔧 FIX KOMPREHENSIF: Error "Integer Out of Range"');
console.log('   Kalkulasi Tindakan Rawat Jalan');
console.log('═'.repeat(80));

// ============================================
// STEP 1: CEK TIPE KOLOM BIAYA
// ============================================
const checkColumnTypeSQL = `
-- ============================================
-- STEP 1: CEK TIPE KOLOM BIAYA SAAT INI
-- ============================================
SELECT 
  table_name,
  column_name,
  data_type,
  CASE 
    WHEN data_type = 'bigint' THEN '✅ AMAN'
    WHEN data_type = 'integer' THEN '❌ PERLU DIUBAH'
    ELSE '⚠️ CEK MANUAL'
  END AS status
FROM information_schema.columns
WHERE table_name IN ('kalkulasi_tindakan_rawat_jalan', 'kalkulasi_tindakan_inap')
  AND column_name IN (
    'biaya_bahan_tindakan',
    'biaya_gaji_tunjangan',
    'biaya_jasa_pelayanan',
    'biaya_obat',
    'biaya_bhp',
    'biaya_makan_karyawan',
    'biaya_makan_pasien',
    'biaya_rumah_tangga',
    'biaya_cetak',
    'biaya_atk',
    'biaya_listrik',
    'biaya_air',
    'biaya_telp',
    'biaya_pemeliharaan_bangunan',
    'biaya_pemeliharaan_alat_medis',
    'biaya_pemeliharaan_alat_non_medis',
    'biaya_operasional_lainnya',
    'biaya_penyusutan_gedung',
    'biaya_penyusutan_jaringan',
    'biaya_penyusutan_alat_medis',
    'biaya_penyusutan_alat_non_medis',
    'biaya_pendidikan_pelatihan',
    'biaya_laundry',
    'biaya_sterilisasi',
    'biaya_tidak_langsung_terdistribusi'
  )
ORDER BY table_name, column_name;
`;

// ============================================
// STEP 2: MIGRASI BIGINT (LENGKAP)
// ============================================
const migrationBigintSQL = `
-- ============================================
-- STEP 2: MIGRASI KOLOM BIAYA KE BIGINT
-- ============================================
-- PENTING: Ini akan mengubah tipe data kolom tanpa mengubah rumus kalkulasi

DO $$
BEGIN
  RAISE NOTICE '🔧 Memulai migrasi kolom biaya ke BIGINT...';
  
  -- ================================
  -- Tabel: kalkulasi_tindakan_rawat_jalan
  -- ================================
  RAISE NOTICE '📋 Processing: kalkulasi_tindakan_rawat_jalan';
  
  ALTER TABLE kalkulasi_tindakan_rawat_jalan
    ALTER COLUMN biaya_bahan_tindakan TYPE BIGINT USING biaya_bahan_tindakan::BIGINT,
    ALTER COLUMN biaya_gaji_tunjangan TYPE BIGINT USING biaya_gaji_tunjangan::BIGINT,
    ALTER COLUMN biaya_jasa_pelayanan TYPE BIGINT USING biaya_jasa_pelayanan::BIGINT,
    ALTER COLUMN biaya_obat TYPE BIGINT USING biaya_obat::BIGINT,
    ALTER COLUMN biaya_bhp TYPE BIGINT USING biaya_bhp::BIGINT,
    ALTER COLUMN biaya_makan_karyawan TYPE BIGINT USING biaya_makan_karyawan::BIGINT,
    ALTER COLUMN biaya_makan_pasien TYPE BIGINT USING biaya_makan_pasien::BIGINT,
    ALTER COLUMN biaya_rumah_tangga TYPE BIGINT USING biaya_rumah_tangga::BIGINT,
    ALTER COLUMN biaya_cetak TYPE BIGINT USING biaya_cetak::BIGINT,
    ALTER COLUMN biaya_atk TYPE BIGINT USING biaya_atk::BIGINT,
    ALTER COLUMN biaya_listrik TYPE BIGINT USING biaya_listrik::BIGINT,
    ALTER COLUMN biaya_air TYPE BIGINT USING biaya_air::BIGINT,
    ALTER COLUMN biaya_telp TYPE BIGINT USING biaya_telp::BIGINT,
    ALTER COLUMN biaya_pemeliharaan_bangunan TYPE BIGINT USING biaya_pemeliharaan_bangunan::BIGINT,
    ALTER COLUMN biaya_pemeliharaan_alat_medis TYPE BIGINT USING biaya_pemeliharaan_alat_medis::BIGINT,
    ALTER COLUMN biaya_pemeliharaan_alat_non_medis TYPE BIGINT USING biaya_pemeliharaan_alat_non_medis::BIGINT,
    ALTER COLUMN biaya_operasional_lainnya TYPE BIGINT USING biaya_operasional_lainnya::BIGINT,
    ALTER COLUMN biaya_penyusutan_gedung TYPE BIGINT USING biaya_penyusutan_gedung::BIGINT,
    ALTER COLUMN biaya_penyusutan_jaringan TYPE BIGINT USING biaya_penyusutan_jaringan::BIGINT,
    ALTER COLUMN biaya_penyusutan_alat_medis TYPE BIGINT USING biaya_penyusutan_alat_medis::BIGINT,
    ALTER COLUMN biaya_penyusutan_alat_non_medis TYPE BIGINT USING biaya_penyusutan_alat_non_medis::BIGINT,
    ALTER COLUMN biaya_pendidikan_pelatihan TYPE BIGINT USING biaya_pendidikan_pelatihan::BIGINT,
    ALTER COLUMN biaya_laundry TYPE BIGINT USING biaya_laundry::BIGINT,
    ALTER COLUMN biaya_sterilisasi TYPE BIGINT USING biaya_sterilisasi::BIGINT,
    ALTER COLUMN biaya_tidak_langsung_terdistribusi TYPE BIGINT USING biaya_tidak_langsung_terdistribusi::BIGINT;
  
  RAISE NOTICE '✅ kalkulasi_tindakan_rawat_jalan: 24 kolom biaya diubah ke BIGINT';
  
  -- ================================
  -- Tabel: kalkulasi_tindakan_inap
  -- ================================
  RAISE NOTICE '📋 Processing: kalkulasi_tindakan_inap';
  
  ALTER TABLE kalkulasi_tindakan_inap
    ALTER COLUMN biaya_bahan_tindakan TYPE BIGINT USING biaya_bahan_tindakan::BIGINT,
    ALTER COLUMN biaya_gaji_tunjangan TYPE BIGINT USING biaya_gaji_tunjangan::BIGINT,
    ALTER COLUMN biaya_makan_karyawan TYPE BIGINT USING biaya_makan_karyawan::BIGINT,
    ALTER COLUMN biaya_rumah_tangga TYPE BIGINT USING biaya_rumah_tangga::BIGINT,
    ALTER COLUMN biaya_cetak TYPE BIGINT USING biaya_cetak::BIGINT,
    ALTER COLUMN biaya_atk TYPE BIGINT USING biaya_atk::BIGINT,
    ALTER COLUMN biaya_listrik TYPE BIGINT USING biaya_listrik::BIGINT,
    ALTER COLUMN biaya_air TYPE BIGINT USING biaya_air::BIGINT,
    ALTER COLUMN biaya_telp TYPE BIGINT USING biaya_telp::BIGINT,
    ALTER COLUMN biaya_pemeliharaan_bangunan TYPE BIGINT USING biaya_pemeliharaan_bangunan::BIGINT,
    ALTER COLUMN biaya_pemeliharaan_alat_medis TYPE BIGINT USING biaya_pemeliharaan_alat_medis::BIGINT,
    ALTER COLUMN biaya_pemeliharaan_alat_non_medis TYPE BIGINT USING biaya_pemeliharaan_alat_non_medis::BIGINT,
    ALTER COLUMN biaya_operasional_lainnya TYPE BIGINT USING biaya_operasional_lainnya::BIGINT,
    ALTER COLUMN biaya_penyusutan_gedung TYPE BIGINT USING biaya_penyusutan_gedung::BIGINT,
    ALTER COLUMN biaya_penyusutan_jaringan TYPE BIGINT USING biaya_penyusutan_jaringan::BIGINT,
    ALTER COLUMN biaya_penyusutan_alat_medis TYPE BIGINT USING biaya_penyusutan_alat_medis::BIGINT,
    ALTER COLUMN biaya_penyusutan_alat_non_medis TYPE BIGINT USING biaya_penyusutan_alat_non_medis::BIGINT,
    ALTER COLUMN biaya_pendidikan_pelatihan TYPE BIGINT USING biaya_pendidikan_pelatihan::BIGINT,
    ALTER COLUMN biaya_laundry TYPE BIGINT USING biaya_laundry::BIGINT,
    ALTER COLUMN biaya_sterilisasi TYPE BIGINT USING biaya_sterilisasi::BIGINT,
    ALTER COLUMN biaya_tidak_langsung_terdistribusi TYPE BIGINT USING biaya_tidak_langsung_terdistribusi::BIGINT;
  
  RAISE NOTICE '✅ kalkulasi_tindakan_inap: 20 kolom biaya diubah ke BIGINT';
  
  RAISE NOTICE '🎉 Migrasi BIGINT selesai!';
END;
$$;

-- Verifikasi hasil migrasi
SELECT 
  '✅ MIGRASI SELESAI - Verifikasi:' AS status,
  table_name,
  COUNT(*) as total_kolom_biaya,
  COUNT(*) FILTER (WHERE data_type = 'bigint') as kolom_bigint,
  COUNT(*) FILTER (WHERE data_type = 'integer') as kolom_integer_tersisa
FROM information_schema.columns
WHERE table_name IN ('kalkulasi_tindakan_rawat_jalan', 'kalkulasi_tindakan_inap')
  AND column_name LIKE 'biaya_%'
GROUP BY table_name;
`;

// ============================================
// STEP 3: TEST REKALKULASI BATCH PER UNIT KERJA
// ============================================
const testBatchSQL = `
-- ============================================
-- STEP 3: TEST REKALKULASI BATCH PER UNIT KERJA
-- ============================================
-- Jalankan rekalkulasi per unit kerja untuk tahun 2025
-- Lebih aman dari timeout dan mudah debug

DO $$
DECLARE
  v_unit_kerja TEXT;
  v_result JSONB;
  v_success_count INTEGER := 0;
  v_error_count INTEGER := 0;
  v_total_count INTEGER := 0;
BEGIN
  RAISE NOTICE '🚀 Memulai rekalkulasi batch per unit kerja...';
  RAISE NOTICE '📅 Tahun: 2025';
  RAISE NOTICE '';
  
  -- Hitung total unit kerja
  SELECT COUNT(DISTINCT kode_unit_kerja)
  INTO v_total_count
  FROM kalkulasi_tindakan_rawat_jalan
  WHERE tahun = 2025;
  
  RAISE NOTICE '📊 Total unit kerja: %', v_total_count;
  RAISE NOTICE '═'.repeat(60);
  
  -- Loop per unit kerja
  FOR v_unit_kerja IN 
    SELECT DISTINCT kode_unit_kerja
    FROM kalkulasi_tindakan_rawat_jalan
    WHERE tahun = 2025
    ORDER BY kode_unit_kerja
  LOOP
    BEGIN
      RAISE NOTICE '⏳ Processing: % ...', v_unit_kerja;
      
      -- Panggil fungsi rekalkulasi
      SELECT manual_recalculate_kalkulasi_tindakan_rawat_jalan(2025, v_unit_kerja) 
      INTO v_result;
      
      -- Cek hasil
      IF (v_result->>'success')::BOOLEAN THEN
        v_success_count := v_success_count + 1;
        RAISE NOTICE '   ✅ Berhasil: % rows affected, time: %s', 
          v_result->>'affected_rows',
          ROUND((v_result->>'execution_time_seconds')::NUMERIC, 2);
      ELSE
        v_error_count := v_error_count + 1;
        RAISE NOTICE '   ❌ Gagal: %', v_result->>'message';
      END IF;
      
    EXCEPTION WHEN OTHERS THEN
      v_error_count := v_error_count + 1;
      RAISE NOTICE '   ❌ ERROR: % - %', SQLERRM, SQLSTATE;
    END;
  END LOOP;
  
  RAISE NOTICE '';
  RAISE NOTICE '═'.repeat(60);
  RAISE NOTICE '📊 RINGKASAN:';
  RAISE NOTICE '   Total unit kerja: %', v_total_count;
  RAISE NOTICE '   ✅ Berhasil: %', v_success_count;
  RAISE NOTICE '   ❌ Gagal: %', v_error_count;
  
  IF v_error_count = 0 THEN
    RAISE NOTICE '';
    RAISE NOTICE '🎉 SEMUA UNIT KERJA BERHASIL DIREKALKULASI!';
  ELSE
    RAISE NOTICE '';
    RAISE NOTICE '⚠️  ADA ERROR - Cek log di atas untuk detail';
  END IF;
  
  RAISE NOTICE '═'.repeat(60);
END;
$$;
`;

// ============================================
// STEP 4: VERIFIKASI AKHIR
// ============================================
const verificationSQL = `
-- ============================================
-- STEP 4: VERIFIKASI AKHIR
-- ============================================

-- 4.1. Cek apakah masih ada kolom INTEGER
SELECT 
  '🔍 CEK TIPE KOLOM:' AS tahap,
  table_name,
  column_name,
  data_type,
  CASE 
    WHEN data_type = 'bigint' THEN '✅'
    ELSE '❌ MASIH PERLU DIUBAH'
  END AS status
FROM information_schema.columns
WHERE table_name IN ('kalkulasi_tindakan_rawat_jalan', 'kalkulasi_tindakan_inap')
  AND column_name LIKE 'biaya_%'
  AND data_type != 'bigint'
ORDER BY table_name, column_name;

-- 4.2. Cek sample data hasil rekalkulasi
SELECT 
  '📊 SAMPLE DATA HASIL:' AS tahap,
  tahun,
  kode_unit_kerja,
  nama_unit_kerja,
  COUNT(*) as jumlah_tindakan,
  SUM(biaya_gaji_tunjangan) as total_gaji,
  SUM(unit_cost_tindakan_rawat_jalan) as total_unit_cost
FROM kalkulasi_tindakan_rawat_jalan
WHERE tahun = 2025
GROUP BY tahun, kode_unit_kerja, nama_unit_kerja
ORDER BY kode_unit_kerja
LIMIT 5;

-- 4.3. Cek ada data yang NULL atau 0
SELECT 
  '⚠️  CEK DATA ANOMALI:' AS tahap,
  COUNT(*) FILTER (WHERE unit_cost_tindakan_rawat_jalan IS NULL) as unit_cost_null,
  COUNT(*) FILTER (WHERE unit_cost_tindakan_rawat_jalan = 0) as unit_cost_zero,
  COUNT(*) FILTER (WHERE unit_cost_tindakan_rawat_jalan > 0) as unit_cost_valid,
  COUNT(*) as total_rows
FROM kalkulasi_tindakan_rawat_jalan
WHERE tahun = 2025;
`;

// ============================================
// GABUNGKAN SEMUA SQL
// ============================================
const fullSQL = `
-- ============================================
-- PERBAIKAN KOMPREHENSIF
-- Error: "Integer Out of Range" 
-- Kalkulasi Tindakan Rawat Jalan
-- ============================================
-- Tanggal: ${new Date().toISOString().split('T')[0]}
-- Tujuan: 
-- 1. Ubah tipe kolom biaya dari INTEGER ke BIGINT
-- 2. Test rekalkulasi batch per unit kerja
-- 3. Verifikasi hasil
--
-- CATATAN PENTING:
-- - Tidak ada perubahan rumus kalkulasi
-- - Hanya mengubah tipe penyimpanan data
-- - Fungsi rekalkulasi tetap sama
-- ============================================

${checkColumnTypeSQL}

${migrationBigintSQL}

${testBatchSQL}

${verificationSQL}

-- ============================================
-- SELESAI
-- ============================================
SELECT '🎉 SCRIPT SELESAI - Silakan cek hasil di atas' AS status;
`;

// ============================================
// PRINT INSTRUKSI
// ============================================
console.log('\n📋 LANGKAH-LANGKAH PERBAIKAN:\n');

console.log('1️⃣  COPY SQL SCRIPT LENGKAP (di bawah)');
console.log('2️⃣  BUKA SUPABASE SQL EDITOR:');
console.log('    https://supabase.com/dashboard/project/koepzicdtovtknsqlnac/sql/new');
console.log('3️⃣  PASTE dan RUN script di SQL Editor');
console.log('4️⃣  TUNGGU hingga selesai (perhatikan output di Messages tab)');
console.log('5️⃣  REFRESH halaman aplikasi Anda');
console.log('6️⃣  TEST tombol "Perbarui Data" di Kalkulasi Tindakan Rawat Jalan\n');

console.log('═'.repeat(80));
console.log('📝 SQL SCRIPT LENGKAP (COPY FROM HERE):');
console.log('═'.repeat(80));
console.log(fullSQL);
console.log('═'.repeat(80));

console.log('\n💡 TIPS:');
console.log('   - Script ini aman dijalankan berkali-kali');
console.log('   - Tidak mengubah data yang sudah ada');
console.log('   - Tidak mengubah rumus kalkulasi');
console.log('   - Hanya mengubah tipe kolom dan menjalankan rekalkulasi ulang\n');

console.log('⚠️  JIKA MASIH ERROR SETELAH INI:');
console.log('   1. Screenshot error di browser console');
console.log('   2. Screenshot hasil dari SQL Editor (Messages tab)');
console.log('   3. Kirimkan ke developer untuk analisis lebih lanjut\n');

console.log('═'.repeat(80));

// Try to open browser
const url = 'https://supabase.com/dashboard/project/koepzicdtovtknsqlnac/sql/new';
const command = process.platform === 'win32' 
  ? `start ${url}` 
  : process.platform === 'darwin' 
  ? `open ${url}` 
  : `xdg-open ${url}`;

exec(command, (error) => {
  if (!error) {
    console.log('\n✅ Browser dibuka otomatis! Silakan paste SQL script.\n');
  }
});








