# Script untuk membuat tabel Dasar_Alokasi dan Distribusi_Biaya
# Jalankan script ini untuk panduan lengkap

Write-Host "=== MEMBUAT TABEL DASAR ALOKASI DAN DISTRIBUSI BIAYA ===" -ForegroundColor Green
Write-Host ""

Write-Host "🔍 STATUS DATABASE SAAT INI:" -ForegroundColor Yellow
Write-Host "✅ unit_kerja: Tabel sudah ada" -ForegroundColor Green
Write-Host "❌ Data_Kegiatan: Tabel tidak ditemukan" -ForegroundColor Red
Write-Host "❌ Dasar_Alokasi: Tabel belum dibuat" -ForegroundColor Red
Write-Host "❌ Distribusi_Biaya: Tabel belum dibuat" -ForegroundColor Red
Write-Host ""

Write-Host "🔧 LANGKAH 1: BUKA SUPABASE DASHBOARD" -ForegroundColor Yellow
Write-Host "1. Buka: https://supabase.com/dashboard" -ForegroundColor White
Write-Host "2. Login ke akun Anda" -ForegroundColor White
Write-Host "3. Pilih project: koepzicdtovtknsqlnac" -ForegroundColor White
Write-Host "4. Pergi ke SQL Editor (sidebar kiri)" -ForegroundColor White
Write-Host ""

Write-Host "📋 LANGKAH 2: JALANKAN SCRIPT MEMBUAT TABEL" -ForegroundColor Yellow
Write-Host "1. Copy seluruh isi file: create-tables-manual.sql" -ForegroundColor White
Write-Host "2. Paste di SQL Editor" -ForegroundColor White
Write-Host "3. Klik tombol Run (atau Ctrl+Enter)" -ForegroundColor White
Write-Host "4. Tunggu hingga selesai" -ForegroundColor White
Write-Host ""

Write-Host "🔍 LANGKAH 3: VERIFIKASI TABEL" -ForegroundColor Yellow
Write-Host "Setelah menjalankan script, jalankan query berikut untuk verifikasi:" -ForegroundColor White
Write-Host ""
Write-Host "-- Cek tabel Dasar_Alokasi" -ForegroundColor Cyan
Write-Host "SELECT table_name, column_name, data_type" -ForegroundColor Cyan
Write-Host "FROM information_schema.columns" -ForegroundColor Cyan
Write-Host "WHERE table_name = 'Dasar_Alokasi'" -ForegroundColor Cyan
Write-Host "ORDER BY ordinal_position;" -ForegroundColor Cyan
Write-Host ""
Write-Host "-- Cek tabel Distribusi_Biaya" -ForegroundColor Cyan
Write-Host "SELECT table_name, column_name, data_type" -ForegroundColor Cyan
Write-Host "FROM information_schema.columns" -ForegroundColor Cyan
Write-Host "WHERE table_name = 'Distribusi_Biaya'" -ForegroundColor Cyan
Write-Host "ORDER BY ordinal_position;" -ForegroundColor Cyan
Write-Host ""

Write-Host "📊 LANGKAH 4: TEST TABEL" -ForegroundColor Yellow
Write-Host "Jalankan query berikut untuk test tabel:" -ForegroundColor White
Write-Host ""
Write-Host "-- Test insert ke Dasar_Alokasi" -ForegroundColor Cyan
Write-Host "INSERT INTO Dasar_Alokasi (Kode_UK, Nama_Unit_Kerja, Kategori, Dasar_Alokasi_Field, Dasar_Alokasi_Value, Tahun)" -ForegroundColor Cyan
Write-Host "VALUES ('TEST001', 'Test Unit', 'Test Kategori', 'Jumlah_SDM', 10, 2024);" -ForegroundColor Cyan
Write-Host ""
Write-Host "-- Test select dari Dasar_Alokasi" -ForegroundColor Cyan
Write-Host "SELECT * FROM Dasar_Alokasi WHERE Kode_UK = 'TEST001';" -ForegroundColor Cyan
Write-Host ""

Write-Host "✅ LANGKAH 5: VERIFIKASI AKHIR" -ForegroundColor Yellow
Write-Host "Jalankan script check database:" -ForegroundColor White
Write-Host "node check-database-status.cjs" -ForegroundColor Green
Write-Host ""

Write-Host "🚀 LANGKAH 6: TEST APLIKASI" -ForegroundColor Yellow
Write-Host "1. Jalankan aplikasi: npm run dev" -ForegroundColor White
Write-Host "2. Buka browser: http://localhost:8089" -ForegroundColor White
Write-Host "3. Test halaman:" -ForegroundColor White
Write-Host "   - http://localhost:8089/test-dasar-alokasi" -ForegroundColor Green
Write-Host "   - http://localhost:8089/dasar-alokasi" -ForegroundColor Green
Write-Host "   - http://localhost:8089/distribusi-biaya" -ForegroundColor Green
Write-Host ""

Write-Host "📁 FILE YANG PERLU DIJALANKAN:" -ForegroundColor Yellow
Write-Host "1. create-tables-manual.sql - Script SQL untuk membuat tabel" -ForegroundColor Green
Write-Host "2. check-database-status.cjs - Verifikasi tabel" -ForegroundColor Green
Write-Host ""

Write-Host "🎯 HASIL YANG DIHARAPKAN:" -ForegroundColor Yellow
Write-Host "✅ Tabel Dasar_Alokasi dibuat dengan struktur yang benar" -ForegroundColor Green
Write-Host "✅ Tabel Distribusi_Biaya dibuat dengan struktur yang benar" -ForegroundColor Green
Write-Host "✅ Indexes dibuat untuk performa" -ForegroundColor Green
Write-Host "✅ RLS (Row Level Security) diaktifkan" -ForegroundColor Green
Write-Host "✅ Policies dibuat untuk akses authenticated users" -ForegroundColor Green
Write-Host "✅ Triggers dibuat untuk updated_at" -ForegroundColor Green
Write-Host "✅ Aplikasi dapat mengakses tabel" -ForegroundColor Green
Write-Host ""

Write-Host "⚠️ CATATAN PENTING:" -ForegroundColor Yellow
Write-Host "- Pastikan Anda sudah login ke Supabase Dashboard" -ForegroundColor White
Write-Host "- Pilih project yang benar (koepzicdtovtknsqlnac)" -ForegroundColor White
Write-Host "- Jalankan script SQL di SQL Editor, bukan di aplikasi" -ForegroundColor White
Write-Host "- Tunggu hingga semua statement selesai dieksekusi" -ForegroundColor White
Write-Host ""

Write-Host "=== SELESAI ===" -ForegroundColor Green
Write-Host "Ikuti langkah-langkah di atas untuk membuat tabel database!" -ForegroundColor Green
