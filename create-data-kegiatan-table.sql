-- Create Data_Kegiatan table
CREATE TABLE IF NOT EXISTS Data_Kegiatan (
  id SERIAL PRIMARY KEY,
  Kode_UK VARCHAR(50) NULL,
  Nama_Unit_Kerja VARCHAR(255) NULL,
  Jml_jam_Praktek_per_hari INT NULL,
  SDM_Dr INT NULL,
  SDM_Prwt INT NULL,
  SDM_Non INT NULL,
  Listrik_kwh FLOAT NULL,
  Air_m3 FLOAT NULL,
  Telepon_Freq_pakai_per_titik INT NULL,
  Komputer_SIMRS_jml_User INT NULL,
  Tempat_Tidur_SVIP INT NULL,
  Tempat_Tidur_VIP INT NULL,
  Tempat_Tidur_I INT NULL,
  Tempat_Tidur_II INT NULL,
  Tempat_Tidur_III INT NULL,
  Tempat_Tidur_Khusus INT NULL,
  Kunjungan_jml_pasien_Lama INT NULL,
  Kunjungan_jml_pasien_Baru INT NULL,
  Kunjungan_jml_pasien_Total INT NULL,
  Tindakan_Pemeriksaan_jml_Tindakan INT NULL,
  Resep_Lembar_Resep INT NULL,
  Cucian_kg_Cucian FLOAT NULL,
  Instrumen_Besar INT NULL,
  Instrumen_Sedang INT NULL,
  Instrumen_Kecil INT NULL,
  Set_Pack_Besar INT NULL,
  Set_Pack_Sedang INT NULL,
  Set_Pack_Kecil INT NULL,
  Makanan_Karyawan_jml_Porsi INT NULL,
  Makanan_Pasien_jml_Porsi INT NULL,
  Hari_Rawat_SVIP INT NULL,
  Hari_Rawat_VIP INT NULL,
  Hari_Rawat_Utama INT NULL,
  Hari_Rawat_I INT NULL,
  Hari_Rawat_II INT NULL,
  Hari_Rawat_III INT NULL,
  Hari_Rawat_Khusus INT NULL,
  Pelayanan_Pendidikan_Total INT NULL,
  Pelayanan_Pendidikan_jml_Siswa INT NULL,
  Pelayanan_Pendidikan_Baru INT NULL,
  Pelayanan_Pendidikan_Lama INT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_data_kegiatan_kode_uk ON Data_Kegiatan(Kode_UK);
CREATE INDEX IF NOT EXISTS idx_data_kegiatan_nama_unit_kerja ON Data_Kegiatan(Nama_Unit_Kerja);
CREATE INDEX IF NOT EXISTS idx_data_kegiatan_created_at ON Data_Kegiatan(created_at);

-- Add RLS (Row Level Security) policy if needed
ALTER TABLE Data_Kegiatan ENABLE ROW LEVEL SECURITY;

-- Create a policy that allows all operations for authenticated users
-- You can modify this policy based on your security requirements
CREATE POLICY "Allow all operations for authenticated users" ON Data_Kegiatan
  FOR ALL USING (auth.role() = 'authenticated');
