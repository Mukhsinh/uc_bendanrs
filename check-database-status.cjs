// Script sederhana untuk memeriksa status database
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://koepzicdtovtknsqlnac.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtvZXB6aWNkdG92dGtuc3FsbmFjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTczMDg1NzgsImV4cCI6MjA3Mjg4NDU3OH0.QUpuIaPDlDVp2LKSJYkBj4z3IY0aJwyCNhOXyVC2Ui0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDatabaseStatus() {
  console.log('🔍 Checking database status...');
  console.log('Supabase URL:', supabaseUrl);
  
  try {
    // Test connection
    console.log('\n📡 Testing connection...');
    
    // Check unit_kerja table
    console.log('\n📋 Checking unit_kerja table...');
    const { data: unitKerjaData, error: unitKerjaError } = await supabase
      .from('unit_kerja')
      .select('*')
      .limit(1);
    
    if (unitKerjaError) {
      console.log('❌ unit_kerja error:', unitKerjaError.message);
    } else {
      console.log('✅ unit_kerja table accessible');
      console.log('📊 Records:', unitKerjaData?.length || 0);
    }
    
    // Check Data_Kegiatan table
    console.log('\n📋 Checking Data_Kegiatan table...');
    const { data: dataKegiatanData, error: dataKegiatanError } = await supabase
      .from('Data_Kegiatan')
      .select('*')
      .limit(1);
    
    if (dataKegiatanError) {
      console.log('❌ Data_Kegiatan error:', dataKegiatanError.message);
    } else {
      console.log('✅ Data_Kegiatan table accessible');
      console.log('📊 Records:', dataKegiatanData?.length || 0);
    }
    
    // Check Dasar_Alokasi table
    console.log('\n📋 Checking Dasar_Alokasi table...');
    const { data: dasarAlokasiData, error: dasarAlokasiError } = await supabase
      .from('Dasar_Alokasi')
      .select('*')
      .limit(1);
    
    if (dasarAlokasiError) {
      console.log('❌ Dasar_Alokasi table NOT FOUND:', dasarAlokasiError.message);
      console.log('🔧 This table needs to be created!');
    } else {
      console.log('✅ Dasar_Alokasi table accessible');
      console.log('📊 Records:', dasarAlokasiData?.length || 0);
    }
    
    // Check Distribusi_Biaya table
    console.log('\n📋 Checking Distribusi_Biaya table...');
    const { data: distribusiBiayaData, error: distribusiBiayaError } = await supabase
      .from('Distribusi_Biaya')
      .select('*')
      .limit(1);
    
    if (distribusiBiayaError) {
      console.log('❌ Distribusi_Biaya table NOT FOUND:', distribusiBiayaError.message);
      console.log('🔧 This table needs to be created!');
    } else {
      console.log('✅ Distribusi_Biaya table accessible');
      console.log('📊 Records:', distribusiBiayaData?.length || 0);
    }
    
    console.log('\n📋 SUMMARY:');
    console.log('✅ unit_kerja:', unitKerjaError ? '❌' : '✅');
    console.log('✅ Data_Kegiatan:', dataKegiatanError ? '❌' : '✅');
    console.log('❌ Dasar_Alokasi:', dasarAlokasiError ? '❌ NEEDS TO BE CREATED' : '✅');
    console.log('❌ Distribusi_Biaya:', distribusiBiayaError ? '❌ NEEDS TO BE CREATED' : '✅');
    
    if (dasarAlokasiError || distribusiBiayaError) {
      console.log('\n🔧 NEXT STEPS:');
      console.log('1. Open Supabase Dashboard: https://supabase.com/dashboard');
      console.log('2. Select your project');
      console.log('3. Go to SQL Editor');
      console.log('4. Copy and run the SQL script from: create-dasar-alokasi-table-fixed.sql');
      console.log('5. Verify tables are created');
    }
    
  } catch (error) {
    console.error('❌ Connection error:', error.message);
  }
}

checkDatabaseStatus();
