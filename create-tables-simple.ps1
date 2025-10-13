# Script untuk membuat tabel database
Write-Host "=== MEMBUAT TABEL DATABASE ===" -ForegroundColor Green
Write-Host ""
Write-Host "STATUS DATABASE SAAT INI:" -ForegroundColor Yellow
Write-Host "unit_kerja: Tabel sudah ada" -ForegroundColor Green
Write-Host "Data_Kegiatan: Tabel tidak ditemukan" -ForegroundColor Red
Write-Host "Dasar_Alokasi: Tabel belum dibuat" -ForegroundColor Red
Write-Host "Distribusi_Biaya: Tabel belum dibuat" -ForegroundColor Red
Write-Host ""
Write-Host "LANGKAH 1: BUKA SUPABASE DASHBOARD" -ForegroundColor Yellow
Write-Host "1. Buka: https://supabase.com/dashboard" -ForegroundColor White
Write-Host "2. Login ke akun Anda" -ForegroundColor White
Write-Host "3. Pilih project: koepzicdtovtknsqlnac" -ForegroundColor White
Write-Host "4. Pergi ke SQL Editor" -ForegroundColor White
Write-Host ""
Write-Host "LANGKAH 2: JALANKAN SCRIPT MEMBUAT TABEL" -ForegroundColor Yellow
Write-Host "1. Copy seluruh isi file: create-tables-simple.sql" -ForegroundColor White
Write-Host "2. Paste di SQL Editor" -ForegroundColor White
Write-Host "3. Klik tombol Run" -ForegroundColor White
Write-Host "4. Tunggu hingga selesai" -ForegroundColor White
Write-Host ""
Write-Host "LANGKAH 3: JALANKAN SCRIPT MEMBUAT FUNCTION" -ForegroundColor Yellow
Write-Host "1. Copy seluruh isi file: create-functions.sql" -ForegroundColor White
Write-Host "2. Paste di SQL Editor" -ForegroundColor White
Write-Host "3. Klik tombol Run" -ForegroundColor White
Write-Host "4. Tunggu hingga selesai" -ForegroundColor White
Write-Host ""
Write-Host "LANGKAH 4: VERIFIKASI TABEL" -ForegroundColor Yellow
Write-Host "Jalankan query berikut di SQL Editor:" -ForegroundColor White
Write-Host "SELECT table_name FROM information_schema.tables WHERE table_name IN ('Dasar_Alokasi', 'Distribusi_Biaya');" -ForegroundColor Cyan
Write-Host ""
Write-Host "LANGKAH 5: VERIFIKASI AKHIR" -ForegroundColor Yellow
Write-Host "Jalankan script check database:" -ForegroundColor White
Write-Host "node check-database-status.cjs" -ForegroundColor Green
Write-Host ""
Write-Host "LANGKAH 6: TEST APLIKASI" -ForegroundColor Yellow
Write-Host "1. Jalankan aplikasi: npm run dev" -ForegroundColor White
Write-Host "2. Buka browser: http://localhost:8089" -ForegroundColor White
Write-Host "3. Test halaman dasar alokasi" -ForegroundColor White
Write-Host ""
Write-Host "FILE YANG PERLU DIJALANKAN:" -ForegroundColor Yellow
Write-Host "1. create-tables-simple.sql - Membuat tabel" -ForegroundColor Green
Write-Host "2. create-functions.sql - Membuat function" -ForegroundColor Green
Write-Host "3. check-database-status.cjs - Verifikasi" -ForegroundColor Green
Write-Host ""
Write-Host "=== SELESAI ===" -ForegroundColor Green
Write-Host "Ikuti langkah-langkah di atas untuk membuat tabel database!" -ForegroundColor Green
