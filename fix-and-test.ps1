# Script untuk memperbaiki dan menguji sistem distribusi biaya
# Jalankan script ini untuk memastikan semua berfungsi dengan baik

Write-Host "=== FIX AND TEST SISTEM DISTRIBUSI BIAYA ===" -ForegroundColor Green
Write-Host ""

Write-Host "🔧 LANGKAH 1: SETUP DATABASE" -ForegroundColor Yellow
Write-Host "1. Buka Supabase Dashboard: https://supabase.com/dashboard" -ForegroundColor White
Write-Host "2. Pilih project Anda" -ForegroundColor White
Write-Host "3. Pergi ke SQL Editor" -ForegroundColor White
Write-Host "4. Copy dan jalankan script dari file: create-dasar-alokasi-table-fixed.sql" -ForegroundColor White
Write-Host ""

Write-Host "📋 LANGKAH 2: VERIFIKASI TABEL" -ForegroundColor Yellow
Write-Host "Jalankan query berikut di SQL Editor untuk memverifikasi:" -ForegroundColor White
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

Write-Host "📊 LANGKAH 3: PASTIKAN ADA DATA" -ForegroundColor Yellow
Write-Host "Jalankan query berikut untuk memastikan ada data:" -ForegroundColor White
Write-Host ""
Write-Host "-- Cek data unit_kerja" -ForegroundColor Cyan
Write-Host "SELECT COUNT(*) as total_unit_kerja FROM unit_kerja;" -ForegroundColor Cyan
Write-Host ""
Write-Host "-- Cek data Data_Kegiatan" -ForegroundColor Cyan
Write-Host "SELECT COUNT(*) as total_data_kegiatan FROM ""Data_Kegiatan"";" -ForegroundColor Cyan
Write-Host ""

Write-Host "🚀 LANGKAH 4: JALANKAN APLIKASI" -ForegroundColor Yellow
Write-Host "Jalankan perintah berikut di terminal:" -ForegroundColor White
Write-Host "npm run dev" -ForegroundColor Green
Write-Host ""

Write-Host "🌐 LANGKAH 5: TEST HALAMAN" -ForegroundColor Yellow
Write-Host "Buka browser dan test halaman berikut:" -ForegroundColor White
Write-Host "1. http://localhost:5173/test-dasar-alokasi - Halaman test sederhana" -ForegroundColor Green
Write-Host "2. http://localhost:5173/dasar-alokasi - Halaman dasar alokasi" -ForegroundColor Green
Write-Host "3. http://localhost:5173/distribusi-biaya - Halaman distribusi biaya" -ForegroundColor Green
Write-Host ""

Write-Host "✅ LANGKAH 6: TEST FITUR" -ForegroundColor Yellow
Write-Host "Di halaman Dasar Alokasi:" -ForegroundColor White
Write-Host "1. Pilih tahun (contoh: 2024)" -ForegroundColor White
Write-Host "2. Klik 'Generate Dasar Alokasi'" -ForegroundColor White
Write-Host "3. Input Total Biaya (contoh: 1000000000)" -ForegroundColor White
Write-Host "4. Klik 'Hitung Distribusi Biaya'" -ForegroundColor White
Write-Host "5. Lihat hasil di halaman Distribusi Biaya" -ForegroundColor White
Write-Host ""

Write-Host "🔍 TROUBLESHOOTING" -ForegroundColor Yellow
Write-Host "Jika ada masalah:" -ForegroundColor White
Write-Host "1. Cek Console Browser (F12) untuk error JavaScript" -ForegroundColor White
Write-Host "2. Cek Supabase Logs untuk error database" -ForegroundColor White
Write-Host "3. Restart aplikasi dengan Ctrl+C lalu npm run dev" -ForegroundColor White
Write-Host "4. Clear browser cache dan refresh halaman" -ForegroundColor White
Write-Host ""

Write-Host "📁 FILE YANG TELAH DIPERBAIKI:" -ForegroundColor Yellow
Write-Host "✅ create-dasar-alokasi-table-fixed.sql - Script SQL yang diperbaiki" -ForegroundColor Green
Write-Host "✅ src/pages/TestDasarAlokasi.tsx - Halaman test sederhana" -ForegroundColor Green
Write-Host "✅ src/components/DasarAlokasiFormTable.tsx - Komponen dengan error handling" -ForegroundColor Green
Write-Host "✅ src/App.tsx - Routing sudah ditambahkan" -ForegroundColor Green
Write-Host "✅ FIX_DATABASE_AND_PAGES.md - Panduan lengkap" -ForegroundColor Green
Write-Host ""

Write-Host "🎯 HASIL YANG DIHARAPKAN:" -ForegroundColor Yellow
Write-Host "✅ Tabel Dasar_Alokasi dan Distribusi_Biaya muncul di Supabase" -ForegroundColor Green
Write-Host "✅ Halaman aplikasi tampil dengan benar" -ForegroundColor Green
Write-Host "✅ Fitur generate dasar alokasi berfungsi" -ForegroundColor Green
Write-Host "✅ Fitur hitung distribusi biaya berfungsi" -ForegroundColor Green
Write-Host "✅ Laporan distribusi biaya dapat dilihat dan diekspor" -ForegroundColor Green
Write-Host ""

Write-Host "=== SELESAI ===" -ForegroundColor Green
Write-Host "Ikuti langkah-langkah di atas untuk memperbaiki dan menguji sistem!" -ForegroundColor Green
