#!/usr/bin/env node

/**
 * Script verifikasi dan testing setelah migrasi
 * Dapat dijalankan setelah SQL migrasi dieksekusi di Supabase SQL Editor
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env
function loadEnv() {
  const envPath = join(__dirname, '..', '.env');
  const env = {};
  
  try {
    const content = readFileSync(envPath, 'utf8');
    content.split('\n').forEach(line => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...rest] = trimmed.split('=');
        if (key && rest.length) {
          env[key.trim()] = rest.join('=').trim();
        }
      }
    });
  } catch {}
  
  return env;
}

const env = loadEnv();
const url = process.env.VITE_SUPABASE_URL || env.VITE_SUPABASE_ANON_KEY;
const key = process.env.VITE_SUPABASE_ANON_KEY || env.VITE_SUPABASE_ANON_KEY;

console.log('════════════════════════════════════════════════════════════════');
console.log('🔍 VERIFIKASI & TEST MIGRASI - Fix Error biaya_bhp');
console.log('════════════════════════════════════════════════════════════════\n');

if (!url || !key) {
  console.error('❌ Error: Credentials tidak ditemukan di .env');
  console.error('   Diperlukan: VITE_SUPABASE_URL dan VITE_SUPABASE_ANON_KEY\n');
  process.exit(1);
}

const supabase = createClient(url, key);

async function verify() {
  try {
    console.log('Step 1: Testing Connection...');
    const { error: connError } = await supabase
      .from('kalkulasi_tindakan_inap')
      .select('id', { count: 'exact', head: true });
    
    if (connError) {
      console.error('   ❌ Connection failed:', connError.message);
      return false;
    }
    console.log('   ✅ Connected\n');
    
    console.log('Step 2: Checking column unit_cost_tindakan_inap...');
    const { data, error } = await supabase
      .from('kalkulasi_tindakan_inap')
      .select('unit_cost_tindakan_inap')
      .limit(1);
    
    if (error) {
      if (error.message.includes('biaya_bhp')) {
        console.error('   ❌ Error masih ada! Column masih referensi biaya_bhp');
        console.error('   💡 SQL migrasi belum dijalankan atau gagal\n');
        console.log('📋 INSTRUKSI:');
        console.log('   1. Buka: https://supabase.com/dashboard/project/koepzicdtovtknsqlnac/sql/new');
        console.log('   2. Jalankan SQL dari file: JALANKAN-MIGRASI-INI.md');
        console.log('   3. Jalankan script ini lagi untuk verifikasi\n');
        return false;
      }
      console.error('   ❌ Error:', error.message);
      return false;
    }
    
    console.log('   ✅ Column unit_cost_tindakan_inap ada dan berfungsi\n');
    
    console.log('Step 3: Testing UPDATE operation...');
    const { data: sampleData, error: selectError } = await supabase
      .from('kalkulasi_tindakan_inap')
      .select('id, tahun')
      .limit(1)
      .single();
    
    if (selectError || !sampleData) {
      console.warn('   ⚠️  Tidak ada data untuk testing UPDATE');
      console.log('   ℹ️  Ini normal jika tabel masih kosong\n');
      return true;
    }
    
    // Try to trigger recalculation by updating tahun (same value)
    const { error: updateError } = await supabase
      .from('kalkulasi_tindakan_inap')
      .update({ tahun: sampleData.tahun })
      .eq('id', sampleData.id);
    
    if (updateError) {
      if (updateError.message.includes('biaya_bhp')) {
        console.error('   ❌ UPDATE masih error dengan biaya_bhp!');
        console.error('   💡 Migrasi gagal atau belum dijalankan\n');
        return false;
      }
      console.warn('   ⚠️  UPDATE warning:', updateError.message);
    } else {
      console.log('   ✅ UPDATE berhasil tanpa error biaya_bhp\n');
    }
    
    console.log('Step 4: Testing fungsi rekalkulasi...');
    const currentYear = new Date().getFullYear();
    const { data: rpcData, error: rpcError } = await supabase
      .rpc('manual_recalculate_kalkulasi_tindakan_inap', {
        p_tahun: currentYear,
        p_kode_unit_kerja: null
      });
    
    if (rpcError) {
      if (rpcError.message.includes('biaya_bhp')) {
        console.error('   ❌ Fungsi rekalkulasi masih error dengan biaya_bhp!');
        console.error('   💡 Migrasi gagal atau belum lengkap\n');
        return false;
      }
      console.warn('   ⚠️  RPC warning:', rpcError.message);
    } else {
      console.log('   ✅ Fungsi rekalkulasi berjalan tanpa error biaya_bhp');
      if (rpcData) {
        console.log('   📊 Result:', JSON.stringify(rpcData, null, 2));
      }
    }
    
    return true;
    
  } catch (err) {
    console.error('\n❌ Unexpected error:', err.message);
    return false;
  }
}

async function main() {
  const success = await verify();
  
  console.log('\n════════════════════════════════════════════════════════════════');
  
  if (success) {
    console.log('✅ VERIFIKASI BERHASIL!');
    console.log('════════════════════════════════════════════════════════════════');
    console.log('\n🎉 Migrasi sukses! Error "biaya_bhp" sudah teratasi\n');
    console.log('📋 NEXT STEPS:');
    console.log('   1. Refresh aplikasi web (F5)');
    console.log('   2. Buka halaman Kalkulasi Tindakan Inap');
    console.log('   3. Test fungsi "Perbarui Data"');
    console.log('   4. Pastikan tidak ada error lagi\n');
    console.log('✅ Proses perbaikan SELESAI!\n');
  } else {
    console.log('❌ VERIFIKASI GAGAL');
    console.log('════════════════════════════════════════════════════════════════');
    console.log('\n💡 SOLUSI:');
    console.log('   SQL migrasi perlu dijalankan di Supabase SQL Editor\n');
    console.log('📋 LANGKAH-LANGKAH:');
    console.log('   1. Buka: https://supabase.com/dashboard/project/koepzicdtovtknsqlnac/sql/new');
    console.log('   2. Copy SQL dari file: JALANKAN-MIGRASI-INI.md');
    console.log('   3. Paste & Run di SQL Editor');
    console.log('   4. Jalankan script ini lagi untuk verifikasi\n');
    console.log('📄 Atau lihat: SOLUSI-ERROR-BIAYA-BHP.md untuk detail lengkap\n');
    process.exit(1);
  }
}

main();









