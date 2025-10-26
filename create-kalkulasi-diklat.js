import { createClient } from '@supabase/supabase-js';

// Konfigurasi Supabase
const supabaseUrl = 'https://koepzicdtovtknsqlnac.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtvZXB6aWNkdG92dGtuc3FsbmFjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTczMDg1NzgsImV4cCI6MjA3Mjg4NDU3OH0.QUpuIaPDlDVp2LKSJYkBj4z3IY0aJwyCNhOXyVC2Ui0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function createKalkulasiDiklatTable() {
  try {
    console.log('🔧 Membuat tabel kalkulasi_diklat...');
    
    // SQL untuk membuat tabel
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS kalkulasi_diklat (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
        tahun INTEGER NOT NULL,
        jenis_diklat VARCHAR(50) NOT NULL CHECK (jenis_diklat IN ('basis_dokter', 'basis_perawat', 'basis_penunjang', 'basis_administrasi')),
        lama_hari_diklat INTEGER NOT NULL DEFAULT 0,
        biaya_unit_diklat DECIMAL(15,2) DEFAULT 0,
        biaya_distribusi_kedua DECIMAL(15,2) DEFAULT 0,
        total_biaya_unit_diklat DECIMAL(15,2) DEFAULT 0,
        total_diklat INTEGER DEFAULT 0,
        biaya_diklat_per_hari DECIMAL(15,2) DEFAULT 0,
        unit_cost_per_jenis_layanan DECIMAL(15,2) DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;

    // Jalankan SQL
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: createTableSQL
    });

    if (error) {
      console.error('❌ Error membuat tabel:', error);
      return false;
    }

    console.log('✅ Tabel kalkulasi_diklat berhasil dibuat!');

    // Buat index
    console.log('🔧 Membuat index...');
    const indexSQL = `
      CREATE INDEX IF NOT EXISTS idx_kalkulasi_diklat_user_tahun ON kalkulasi_diklat(user_id, tahun);
      CREATE INDEX IF NOT EXISTS idx_kalkulasi_diklat_jenis ON kalkulasi_diklat(jenis_diklat);
    `;

    const { error: indexError } = await supabase.rpc('exec_sql', {
      sql: indexSQL
    });

    if (indexError) {
      console.error('❌ Error membuat index:', indexError);
    } else {
      console.log('✅ Index berhasil dibuat!');
    }

    // Enable RLS
    console.log('🔧 Mengaktifkan RLS...');
    const rlsSQL = `ALTER TABLE kalkulasi_diklat ENABLE ROW LEVEL SECURITY;`;

    const { error: rlsError } = await supabase.rpc('exec_sql', {
      sql: rlsSQL
    });

    if (rlsError) {
      console.error('❌ Error mengaktifkan RLS:', rlsError);
    } else {
      console.log('✅ RLS berhasil diaktifkan!');
    }

    // Buat policies
    console.log('🔧 Membuat RLS policies...');
    const policiesSQL = `
      -- Hapus policies lama jika ada
      DROP POLICY IF EXISTS "Users can view own kalkulasi_diklat" ON kalkulasi_diklat;
      DROP POLICY IF EXISTS "Users can insert own kalkulasi_diklat" ON kalkulasi_diklat;
      DROP POLICY IF EXISTS "Users can update own kalkulasi_diklat" ON kalkulasi_diklat;
      DROP POLICY IF EXISTS "Users can delete own kalkulasi_diklat" ON kalkulasi_diklat;

      -- Policy untuk user bisa melihat data sendiri
      CREATE POLICY "Users can view own kalkulasi_diklat" ON kalkulasi_diklat
        FOR SELECT USING (auth.uid() = user_id);

      -- Policy untuk user bisa insert data sendiri
      CREATE POLICY "Users can insert own kalkulasi_diklat" ON kalkulasi_diklat
        FOR INSERT WITH CHECK (auth.uid() = user_id);

      -- Policy untuk user bisa update data sendiri
      CREATE POLICY "Users can update own kalkulasi_diklat" ON kalkulasi_diklat
        FOR UPDATE USING (auth.uid() = user_id);

      -- Policy untuk user bisa delete data sendiri
      CREATE POLICY "Users can delete own kalkulasi_diklat" ON kalkulasi_diklat
        FOR DELETE USING (auth.uid() = user_id);
    `;

    const { error: policiesError } = await supabase.rpc('exec_sql', {
      sql: policiesSQL
    });

    if (policiesError) {
      console.error('❌ Error membuat policies:', policiesError);
    } else {
      console.log('✅ RLS policies berhasil dibuat!');
    }

    // Verifikasi tabel
    console.log('🔍 Verifikasi tabel...');
    const { data: tables, error: verifyError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'kalkulasi_diklat');

    if (verifyError) {
      console.error('❌ Error verifikasi:', verifyError);
    } else if (tables && tables.length > 0) {
      console.log('✅ Tabel kalkulasi_diklat berhasil diverifikasi!');
      console.log('🎉 Setup database selesai!');
    } else {
      console.log('⚠️ Tabel belum terdeteksi, mungkin perlu waktu untuk sinkronisasi');
    }

    return true;

  } catch (error) {
    console.error('❌ Error:', error);
    return false;
  }
}

// Jalankan fungsi
createKalkulasiDiklatTable()
  .then(success => {
    if (success) {
      console.log('\n🚀 Silakan refresh aplikasi di browser!');
      process.exit(0);
    } else {
      console.log('\n❌ Gagal membuat tabel. Silakan coba manual di Supabase Dashboard.');
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('❌ Error:', error);
    process.exit(1);
  });
