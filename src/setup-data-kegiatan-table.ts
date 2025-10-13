import { supabase } from './integrations/supabase/client';

async function createDataKegiatanTable() {
  try {
    console.log('Creating Data_Kegiatan table...');
    
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: `
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
      `
    });

    if (error) {
      console.error('Error creating table:', error);
      return;
    }

    console.log('Data_Kegiatan table created successfully!');
    
    // Create indexes for better performance
    const indexQueries = [
      'CREATE INDEX IF NOT EXISTS idx_data_kegiatan_kode_uk ON Data_Kegiatan(Kode_UK);',
      'CREATE INDEX IF NOT EXISTS idx_data_kegiatan_nama_unit_kerja ON Data_Kegiatan(Nama_Unit_Kerja);',
      'CREATE INDEX IF NOT EXISTS idx_data_kegiatan_created_at ON Data_Kegiatan(created_at);'
    ];

    for (const indexQuery of indexQueries) {
      const { error: indexError } = await supabase.rpc('exec_sql', {
        sql: indexQuery
      });
      
      if (indexError) {
        console.warn('Warning creating index:', indexError);
      }
    }

    console.log('Indexes created successfully!');
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

// Run the function
createDataKegiatanTable();
