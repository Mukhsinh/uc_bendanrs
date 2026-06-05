-- =====================================================
-- FIX UK054 VK - SKENARIO TARIF AKOMODASI
-- Tanggal: 10 Desember 2024
-- Deskripsi: Fix unit cost UK054 VK yang tidak tampil di halaman skenario-tarif-akomodasi
-- =====================================================

-- MASALAH YANG DITEMUKAN:
-- 1. Unit Cost UK054 VK bernilai 0 di tabel skenario_tarif_akomodasi
-- 2. Fitur edit tidak berfungsi karena kondisi `unit_cost > 0` tidak terpenuhi
-- 3. Data UK054 sudah ada di kalkulasi_biaya_kelas_akomodasi tapi tidak tersinkronisasi

-- ROOT CAUSE:
-- Fungsi populate_skenario_tarif_akomodasi sudah benar, namun data UK054 
-- perlu di-regenerate setelah perbaikan populate_kalkulasi_biaya_kelas_akomodasi

-- SOLUSI:
-- 1. Update manual unit_cost UK054 dari kalkulasi_biaya_kelas_akomodasi
-- 2. Recalculate profit berdasarkan tarif dan unit_cost baru
-- 3. Re-run populate_skenario_tarif_akomodasi untuk memastikan konsistensi

-- LANGKAH 1: Update unit_cost UK054 dari kalkulasi_biaya_kelas_akomodasi
UPDATE skenario_tarif_akomodasi
SET 
  unit_cost_vvip = (
    SELECT unit_cost_per_kelas 
    FROM kalkulasi_biaya_kelas_akomodasi 
    WHERE kode_unit_kerja = 'UK054' 
      AND kelas = 'VVIP' 
      AND tahun = skenario_tarif_akomodasi.tahun
    LIMIT 1
  ),
  unit_cost_vip = (
    SELECT unit_cost_per_kelas 
    FROM kalkulasi_biaya_kelas_akomodasi 
    WHERE kode_unit_kerja = 'UK054' 
      AND kelas = 'VIP' 
      AND tahun = skenario_tarif_akomodasi.tahun
    LIMIT 1
  ),
  unit_cost_i = (
    SELECT unit_cost_per_kelas 
    FROM kalkulasi_biaya_kelas_akomodasi 
    WHERE kode_unit_kerja = 'UK054' 
      AND kelas = 'I' 
      AND tahun = skenario_tarif_akomodasi.tahun
    LIMIT 1
  ),
  unit_cost_ii = (
    SELECT unit_cost_per_kelas 
    FROM kalkulasi_biaya_kelas_akomodasi 
    WHERE kode_unit_kerja = 'UK054' 
      AND kelas = 'II' 
      AND tahun = skenario_tarif_akomodasi.tahun
    LIMIT 1
  ),
  unit_cost_iii = (
    SELECT unit_cost_per_kelas 
    FROM kalkulasi_biaya_kelas_akomodasi 
    WHERE kode_unit_kerja = 'UK054' 
      AND kelas = 'III' 
      AND tahun = skenario_tarif_akomodasi.tahun
    LIMIT 1
  ),
  updated_at = NOW()
WHERE kode_unit_kerja = 'UK054';

-- LANGKAH 2: Recalculate profit (tarif - unit_cost)
UPDATE skenario_tarif_akomodasi
SET 
  profit_vvip = tarif_vvip - COALESCE(unit_cost_vvip, 0),
  profit_vip = tarif_vip - COALESCE(unit_cost_vip, 0),
  profit_i = tarif_i - COALESCE(unit_cost_i, 0),
  profit_ii = tarif_ii - COALESCE(unit_cost_ii, 0),
  profit_iii = tarif_iii - COALESCE(unit_cost_iii, 0),
  updated_at = NOW()
WHERE kode_unit_kerja = 'UK054';

-- LANGKAH 3 (OPTIONAL): Re-run populate untuk regenerate semua data
-- Uncomment jika ingin regenerate semua data skenario_tarif_akomodasi
-- SELECT populate_skenario_tarif_akomodasi(
--   (SELECT tenant_id FROM skenario_tarif_akomodasi WHERE kode_unit_kerja = 'UK054' LIMIT 1),
--   2025
-- );

-- VERIFIKASI HASIL
SELECT 
  kode_unit_kerja,
  nama_unit_kerja,
  unit_cost_vvip,
  unit_cost_vip,
  unit_cost_i,
  unit_cost_ii,
  unit_cost_iii,
  tarif_vvip,
  tarif_vip,
  tarif_i,
  tarif_ii,
  tarif_iii,
  profit_vvip,
  profit_vip,
  profit_i,
  profit_ii,
  profit_iii
FROM skenario_tarif_akomodasi
WHERE kode_unit_kerja = 'UK054'
ORDER BY tahun DESC;

-- EXPECTED RESULT:
-- kode_unit_kerja: UK054
-- nama_unit_kerja: VK
-- unit_cost_vvip: 121367377 (sebelumnya: 0)
-- unit_cost_vip: 242734749 (sebelumnya: 0)
-- unit_cost_i: 364102126 (sebelumnya: 0)
-- unit_cost_ii: 485469501 (sebelumnya: 0)
-- unit_cost_iii: 606836877 (sebelumnya: 0)
-- tarif_*: terisi sesuai dengan perhitungan (unit_cost * 1.1)
-- profit_*: terisi sesuai dengan perhitungan (tarif - unit_cost)

-- CATATAN PENTING:
-- 1. Setelah fix ini, UK054 VK akan tampil di halaman /skenario-tarif-akomodasi
-- 2. Fitur edit akan berfungsi normal karena kondisi `unit_cost > 0` terpenuhi
-- 3. Baris UK054 akan memiliki background kuning (bg-yellow-100) di UI
-- 4. Tombol edit (pensil biru) akan muncul dan berfungsi normal
-- 5. User dapat mengedit tarif untuk semua kelas yang memiliki unit_cost > 0









