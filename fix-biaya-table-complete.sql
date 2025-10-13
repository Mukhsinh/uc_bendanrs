-- Script lengkap untuk memastikan tabel biaya memiliki field unit_kerja_id
-- Jalankan script ini jika ada masalah dengan struktur tabel

-- 1. Pastikan tabel biaya ada, jika tidak buat
CREATE TABLE IF NOT EXISTS biaya (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  tahun INTEGER NOT NULL,
  biaya_gaji_tunjangan DECIMAL(15,2),
  biaya_jasa_pelayanan DECIMAL(15,2),
  biaya_obat DECIMAL(15,2),
  biaya_bhp DECIMAL(15,2),
  biaya_makan_karyawan DECIMAL(15,2),
  biaya_makan_pasien DECIMAL(15,2),
  biaya_rumah_tangga DECIMAL(15,2),
  biaya_cetak DECIMAL(15,2),
  biaya_atk DECIMAL(15,2),
  biaya_listrik DECIMAL(15,2),
  biaya_air DECIMAL(15,2),
  biaya_telp DECIMAL(15,2),
  biaya_pemeliharaan_bangunan DECIMAL(15,2),
  biaya_pemeliharaan_alat_medis DECIMAL(15,2),
  biaya_pemeliharaan_alat_non_medis DECIMAL(15,2),
  biaya_operasional_lainnya DECIMAL(15,2),
  biaya_penyusutan_gedung DECIMAL(15,2),
  biaya_penyusutan_jaringan DECIMAL(15,2),
  biaya_penyusutan_alat_medis DECIMAL(15,2),
  biaya_penyusutan_alat_non_medis DECIMAL(15,2),
  biaya_pendidikan_pelatihan DECIMAL(15,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Tambahkan kolom unit_kerja_id jika belum ada
ALTER TABLE biaya 
ADD COLUMN IF NOT EXISTS unit_kerja_id UUID;

-- 3. Pastikan tabel unit_kerja ada
CREATE TABLE IF NOT EXISTS unit_kerja (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  kode VARCHAR(50) UNIQUE NOT NULL,
  nama VARCHAR(255) NOT NULL,
  lokasi VARCHAR(255),
  luas_ruangan DECIMAL(10,2),
  kategori VARCHAR(50) CHECK (kategori IN ('Pusat Biaya', 'Pusat Pendapatan')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Buat foreign key constraint
DO $$
BEGIN
  -- Hapus constraint lama jika ada
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'fk_biaya_unit_kerja' 
    AND table_name = 'biaya'
  ) THEN
    ALTER TABLE biaya DROP CONSTRAINT fk_biaya_unit_kerja;
  END IF;
  
  -- Buat constraint baru
  ALTER TABLE biaya
  ADD CONSTRAINT fk_biaya_unit_kerja
  FOREIGN KEY (unit_kerja_id)
  REFERENCES unit_kerja(id)
  ON DELETE SET NULL;
END $$;

-- 5. Buat indexes untuk performa
CREATE INDEX IF NOT EXISTS idx_biaya_user_id ON biaya(user_id);
CREATE INDEX IF NOT EXISTS idx_biaya_tahun ON biaya(tahun);
CREATE INDEX IF NOT EXISTS idx_biaya_unit_kerja_id ON biaya(unit_kerja_id);
CREATE INDEX IF NOT EXISTS idx_biaya_tahun_unit_kerja ON biaya(tahun, unit_kerja_id);
CREATE INDEX IF NOT EXISTS idx_biaya_user_tahun ON biaya(user_id, tahun);

-- 6. Enable RLS dan buat policies
ALTER TABLE biaya ENABLE ROW LEVEL SECURITY;

-- Hapus policy lama jika ada
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON biaya;

-- Buat policy baru
CREATE POLICY "Allow all operations for authenticated users" ON biaya
  FOR ALL USING (auth.role() = 'authenticated');

-- 7. Enable RLS untuk unit_kerja juga
ALTER TABLE unit_kerja ENABLE ROW LEVEL SECURITY;

-- Hapus policy lama jika ada
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON unit_kerja;

-- Buat policy baru
CREATE POLICY "Allow all operations for authenticated users" ON unit_kerja
  FOR ALL USING (auth.role() = 'authenticated');

-- 8. Buat trigger untuk updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger untuk biaya
DROP TRIGGER IF EXISTS update_biaya_updated_at ON biaya;
CREATE TRIGGER update_biaya_updated_at
    BEFORE UPDATE ON biaya
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger untuk unit_kerja
DROP TRIGGER IF EXISTS update_unit_kerja_updated_at ON unit_kerja;
CREATE TRIGGER update_unit_kerja_updated_at
    BEFORE UPDATE ON unit_kerja
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 9. Verifikasi akhir
SELECT 
  'biaya' as table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'biaya' 
  AND table_schema = 'public'
  AND column_name IN ('id', 'user_id', 'tahun', 'unit_kerja_id', 'created_at', 'updated_at')
ORDER BY ordinal_position;

SELECT 
  'unit_kerja' as table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'unit_kerja' 
  AND table_schema = 'public'
ORDER BY ordinal_position;
