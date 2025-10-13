-- Script untuk membuat data sample dan memastikan tabel biaya berfungsi dengan baik
-- Jalankan script ini di Supabase SQL Editor

-- 1. Pastikan tabel unit_kerja memiliki data sample
INSERT INTO unit_kerja (kode, nama, lokasi, luas_ruangan, kategori) VALUES
('UK001', 'IGD', 'Gedung A Lantai 1', 150.5, 'Pusat Biaya'),
('UK002', 'Rawat Inap', 'Gedung B Lantai 2-4', 500.0, 'Pusat Biaya'),
('UK003', 'Laboratorium', 'Gedung C Lantai 1', 200.0, 'Pusat Biaya'),
('UK004', 'Radiologi', 'Gedung C Lantai 2', 180.0, 'Pusat Biaya'),
('UK005', 'Farmasi', 'Gedung D Lantai 1', 120.0, 'Pusat Biaya')
ON CONFLICT (kode) DO NOTHING;

-- 2. Cek apakah ada user yang bisa digunakan untuk test
-- Ganti 'test-user-id' dengan user_id yang valid dari auth.users
-- Atau gunakan user_id dari session yang sedang login

-- 3. Insert data biaya sample dengan unit kerja
-- GANTI 'your-user-id-here' dengan user_id yang valid
INSERT INTO biaya (
  user_id,
  tahun,
  unit_kerja_id,
  biaya_gaji_tunjangan,
  biaya_jasa_pelayanan,
  biaya_obat,
  biaya_bhp,
  biaya_makan_karyawan,
  biaya_makan_pasien,
  biaya_rumah_tangga,
  biaya_cetak,
  biaya_atk,
  biaya_listrik,
  biaya_air,
  biaya_telp,
  biaya_pemeliharaan_bangunan,
  biaya_pemeliharaan_alat_medis,
  biaya_pemeliharaan_alat_non_medis,
  biaya_operasional_lainnya,
  biaya_penyusutan_gedung,
  biaya_penyusutan_jaringan,
  biaya_penyusutan_alat_medis,
  biaya_penyusutan_alat_non_medis,
  biaya_pendidikan_pelatihan
) VALUES 
-- Data untuk IGD
(
  'your-user-id-here', -- GANTI dengan user_id yang valid
  2024,
  (SELECT id FROM unit_kerja WHERE kode = 'UK001'),
  50000000,
  10000000,
  15000000,
  8000000,
  5000000,
  3000000,
  2000000,
  1000000,
  1500000,
  8000000,
  3000000,
  2000000,
  5000000,
  3000000,
  2000000,
  1000000,
  2000000,
  1000000,
  1500000,
  1000000,
  500000
),
-- Data untuk Rawat Inap
(
  'your-user-id-here', -- GANTI dengan user_id yang valid
  2024,
  (SELECT id FROM unit_kerja WHERE kode = 'UK002'),
  80000000,
  15000000,
  25000000,
  12000000,
  8000000,
  5000000,
  3000000,
  2000000,
  2000000,
  12000000,
  5000000,
  3000000,
  8000000,
  5000000,
  3000000,
  2000000,
  3000000,
  1500000,
  2000000,
  2000000,
  1000000
),
-- Data untuk semua unit kerja (unit_kerja_id = NULL)
(
  'your-user-id-here', -- GANTI dengan user_id yang valid
  2024,
  NULL,
  200000000,
  30000000,
  50000000,
  25000000,
  15000000,
  10000000,
  5000000,
  3000000,
  3000000,
  20000000,
  8000000,
  5000000,
  15000000,
  10000000,
  5000000,
  3000000,
  5000000,
  2500000,
  3000000,
  3000000,
  2000000
)
ON CONFLICT DO NOTHING;

-- 4. Verifikasi data yang telah dibuat
SELECT 
  'Unit Kerja' as table_name,
  COUNT(*) as record_count
FROM unit_kerja
UNION ALL
SELECT 
  'Biaya' as table_name,
  COUNT(*) as record_count
FROM biaya;

-- 5. Test query dengan join
SELECT 
  b.id,
  b.tahun,
  b.unit_kerja_id,
  uk.kode as unit_kerja_kode,
  uk.nama as unit_kerja_nama,
  uk.kategori as unit_kerja_kategori,
  b.biaya_gaji_tunjangan,
  b.biaya_obat,
  b.biaya_listrik,
  b.created_at
FROM biaya b
LEFT JOIN unit_kerja uk ON b.unit_kerja_id = uk.id
WHERE b.user_id = 'your-user-id-here' -- GANTI dengan user_id yang valid
ORDER BY b.tahun DESC, uk.nama;

-- 6. Test query untuk data tanpa unit kerja
SELECT 
  b.id,
  b.tahun,
  b.unit_kerja_id,
  'Semua Unit Kerja' as unit_kerja_info,
  b.biaya_gaji_tunjangan,
  b.biaya_obat,
  b.created_at
FROM biaya b
WHERE b.unit_kerja_id IS NULL
  AND b.user_id = 'your-user-id-here' -- GANTI dengan user_id yang valid
ORDER BY b.tahun DESC;