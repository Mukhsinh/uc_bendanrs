import { supabase } from './integrations/supabase/client';

async function checkDataKegiatanTable() {
  try {
    console.log('Checking if Data_Kegiatan table exists...');
    
    // Check if table exists by querying the information schema
    const { data: tableExists, error: tableError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'data_kegiatan');

    if (tableError) {
      console.error('Error checking table existence:', tableError);
      return;
    }

    if (tableExists && tableExists.length > 0) {
      console.log('✅ Data_Kegiatan table exists!');
      
      // Get table structure
      const { data: columns, error: columnError } = await supabase
        .from('information_schema.columns')
        .select('column_name, data_type, is_nullable')
        .eq('table_schema', 'public')
        .eq('table_name', 'data_kegiatan')
        .order('ordinal_position');

      if (columnError) {
        console.error('Error getting table structure:', columnError);
        return;
      }

      console.log('Table structure:');
      columns?.forEach(col => {
        console.log(`- ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
      });

    } else {
      console.log('❌ Data_Kegiatan table does not exist. Creating it now...');
      await createDataKegiatanTable();
    }

  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

async function createDataKegiatanTable() {
  try {
    console.log('Creating Data_Kegiatan table...');
    
    // Use direct SQL execution
    const { data, error } = await supabase
      .rpc('exec_sql', {
        sql: `
          CREATE TABLE Data_Kegiatan (
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
      console.log('Trying alternative method...');
      await createTableAlternative();
      return;
    }

    console.log('✅ Data_Kegiatan table created successfully!');
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

async function createTableAlternative() {
  try {
    // Alternative method using raw SQL
    const { data, error } = await supabase
      .from('Data_Kegiatan')
      .select('*')
      .limit(1);

    if (error && error.code === 'PGRST116') {
      console.log('Table does not exist, creating with alternative method...');
      
      // This will fail but might trigger table creation
      const createQuery = `
        CREATE TABLE IF NOT EXISTS "Data_Kegiatan" (
          id SERIAL PRIMARY KEY,
          "Kode_UK" VARCHAR(50),
          "Nama_Unit_Kerja" VARCHAR(255),
          "Jml_jam_Praktek_per_hari" INTEGER,
          "SDM_Dr" INTEGER,
          "SDM_Prwt" INTEGER,
          "SDM_Non" INTEGER,
          "Listrik_kwh" FLOAT,
          "Air_m3" FLOAT,
          "Telepon_Freq_pakai_per_titik" INTEGER,
          "Komputer_SIMRS_jml_User" INTEGER,
          "Tempat_Tidur_SVIP" INTEGER,
          "Tempat_Tidur_VIP" INTEGER,
          "Tempat_Tidur_I" INTEGER,
          "Tempat_Tidur_II" INTEGER,
          "Tempat_Tidur_III" INTEGER,
          "Tempat_Tidur_Khusus" INTEGER,
          "Kunjungan_jml_pasien_Lama" INTEGER,
          "Kunjungan_jml_pasien_Baru" INTEGER,
          "Kunjungan_jml_pasien_Total" INTEGER,
          "Tindakan_Pemeriksaan_jml_Tindakan" INTEGER,
          "Resep_Lembar_Resep" INTEGER,
          "Cucian_kg_Cucian" FLOAT,
          "Instrumen_Besar" INTEGER,
          "Instrumen_Sedang" INTEGER,
          "Instrumen_Kecil" INTEGER,
          "Set_Pack_Besar" INTEGER,
          "Set_Pack_Sedang" INTEGER,
          "Set_Pack_Kecil" INTEGER,
          "Makanan_Karyawan_jml_Porsi" INTEGER,
          "Makanan_Pasien_jml_Porsi" INTEGER,
          "Hari_Rawat_SVIP" INTEGER,
          "Hari_Rawat_VIP" INTEGER,
          "Hari_Rawat_Utama" INTEGER,
          "Hari_Rawat_I" INTEGER,
          "Hari_Rawat_II" INTEGER,
          "Hari_Rawat_III" INTEGER,
          "Hari_Rawat_Khusus" INTEGER,
          "Pelayanan_Pendidikan_Total" INTEGER,
          "Pelayanan_Pendidikan_jml_Siswa" INTEGER,
          "Pelayanan_Pendidikan_Baru" INTEGER,
          "Pelayanan_Pendidikan_Lama" INTEGER,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `;
      
      console.log('Please run this SQL in your Supabase SQL Editor:');
      console.log(createQuery);
    }
  } catch (error) {
    console.error('Alternative method failed:', error);
  }
}

// Run the check
checkDataKegiatanTable();
