-- Script untuk test insert data biaya dengan unit kerja
-- Jalankan script ini untuk memastikan relasi berfungsi dengan baik

-- 1. Cek data unit kerja yang ada
SELECT id, kode, nama, kategori FROM unit_kerja LIMIT 5;

-- 2. Test insert data biaya dengan unit kerja (ganti user_id dengan user yang valid)
-- Ganti 'your-user-id-here' dengan user_id yang valid dari auth.users
INSERT INTO biaya (
  user_id,
  tahun,
  unit_kerja_id,
  biaya_gaji_tunjangan,
  biaya_obat,
  biaya_listrik,
  biaya_air
) VALUES (
  'your-user-id-here', -- Ganti dengan user_id yang valid
  2024,
  (SELECT id FROM unit_kerja LIMIT 1), -- Ambil unit kerja pertama
  50000000,
  10000000,
  5000000,
  2000000
);

-- 3. Test insert data biaya tanpa unit kerja (semua unit kerja)
INSERT INTO biaya (
  user_id,
  tahun,
  unit_kerja_id,
  biaya_gaji_tunjangan,
  biaya_obat,
  biaya_listrik,
  biaya_air
) VALUES (
  'your-user-id-here', -- Ganti dengan user_id yang valid
  2024,
  NULL, -- Semua unit kerja
  100000000,
  20000000,
  10000000,
  5000000
);

-- 4. Test query dengan join untuk melihat relasi
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
  b.biaya_air,
  b.created_at
FROM biaya b
LEFT JOIN unit_kerja uk ON b.unit_kerja_id = uk.id
WHERE b.user_id = 'your-user-id-here' -- Ganti dengan user_id yang valid
ORDER BY b.tahun DESC, uk.nama;

-- 5. Test query untuk melihat data tanpa relasi (unit_kerja_id = NULL)
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
  AND b.user_id = 'your-user-id-here' -- Ganti dengan user_id yang valid
ORDER BY b.tahun DESC;

-- 6. Clean up test data (opsional - hapus jika tidak ingin menghapus)
-- DELETE FROM biaya WHERE user_id = 'your-user-id-here' AND tahun = 2024;
