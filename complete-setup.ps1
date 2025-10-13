# Script lengkap untuk setup database
# Jalankan script ini untuk panduan lengkap

Write-Host "=== SETUP LENGKAP DATABASE ===" -ForegroundColor Green
Write-Host ""

Write-Host "🔍 STATUS SAAT INI:" -ForegroundColor Yellow
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

Write-Host "📋 LANGKAH 2: BUAT TABEL" -ForegroundColor Yellow
Write-Host "1. Copy isi file: create-tables-manual.sql" -ForegroundColor White
Write-Host "2. Paste di SQL Editor" -ForegroundColor White
Write-Host "3. Klik Run (Ctrl+Enter)" -ForegroundColor White
Write-Host "4. Tunggu selesai" -ForegroundColor White
Write-Host ""

Write-Host "⚙️ LANGKAH 3: BUAT FUNGSI" -ForegroundColor Yellow
Write-Host "1. Copy isi file: create-functions-manual.sql" -ForegroundColor White
Write-Host "2. Paste di SQL Editor" -ForegroundColor White
Write-Host "3. Klik Run (Ctrl+Enter)" -ForegroundColor White
Write-Host "4. Tunggu selesai" -ForegroundColor White
Write-Host ""

Write-Host "🔍 LANGKAH 4: VERIFIKASI" -ForegroundColor Yellow
Write-Host "1. Copy isi file: final-verification.sql" -ForegroundColor White
Write-Host "2. Paste di SQL Editor" -ForegroundColor White
Write-Host "3. Klik Run (Ctrl+Enter)" -ForegroundColor White
Write-Host "4. Pastikan semua tabel dan fungsi ada" -ForegroundColor White
Write-Host ""

Write-Host "🧪 LANGKAH 5: TEST FUNGSI" -ForegroundColor Yellow
Write-Host "1. Copy isi file: test-functions.sql" -ForegroundColor White
Write-Host "2. Paste di SQL Editor" -ForegroundColor White
Write-Host "3. Klik Run (Ctrl+Enter)" -ForegroundColor White
Write-Host "4. Pastikan fungsi berjalan tanpa error" -ForegroundColor White
Write-Host ""

Write-Host "✅ LANGKAH 6: VERIFIKASI AKHIR" -ForegroundColor Yellow
Write-Host "Jalankan script check database:" -ForegroundColor White
Write-Host "node check-database-status.cjs" -ForegroundColor Green
Write-Host ""

Write-Host "🚀 LANGKAH 7: TEST APLIKASI" -ForegroundColor Yellow
Write-Host "1. Jalankan aplikasi: npm run dev" -ForegroundColor White
Write-Host "2. Buka browser: http://localhost:8089" -ForegroundColor White
Write-Host "3. Test halaman:" -ForegroundColor White
Write-Host "   - http://localhost:8089/test-dasar-alokasi" -ForegroundColor Green
Write-Host "   - http://localhost:8089/dasar-alokasi" -ForegroundColor Green
Write-Host "   - http://localhost:8089/distribusi-biaya" -ForegroundColor Green
Write-Host ""

Write-Host "📁 FILE YANG PERLU DIJALANKAN (URUTAN):" -ForegroundColor Yellow
Write-Host "1. create-tables-manual.sql - Membuat tabel" -ForegroundColor Green
Write-Host "2. create-functions-manual.sql - Membuat fungsi" -ForegroundColor Green
Write-Host "3. final-verification.sql - Verifikasi struktur" -ForegroundColor Green
Write-Host "4. test-functions.sql - Test fungsi" -ForegroundColor Green
Write-Host "5. check-database-status.cjs - Verifikasi akhir" -ForegroundColor Green
Write-Host ""

Write-Host "🎯 HASIL YANG DIHARAPKAN:" -ForegroundColor Yellow
Write-Host "✅ Tabel Dasar_Alokasi dibuat dengan struktur lengkap" -ForegroundColor Green
Write-Host "✅ Tabel Distribusi_Biaya dibuat dengan struktur lengkap" -ForegroundColor Green
Write-Host "✅ Indexes dibuat untuk performa" -ForegroundColor Green
Write-Host "✅ RLS (Row Level Security) diaktifkan" -ForegroundColor Green
Write-Host "✅ Policies dibuat untuk akses authenticated users" -ForegroundColor Green
Write-Host "✅ Triggers dibuat untuk updated_at" -ForegroundColor Green
Write-Host "✅ Function generate_dasar_alokasi_otomatis dibuat" -ForegroundColor Green
Write-Host "✅ Function hitung_distribusi_biaya dibuat" -ForegroundColor Green
Write-Host "✅ Function update_updated_at_column dibuat" -ForegroundColor Green
Write-Host "✅ Aplikasi dapat mengakses semua tabel dan fungsi" -ForegroundColor Green
Write-Host ""

Write-Host "⚠️ CATATAN PENTING:" -ForegroundColor Yellow
Write-Host "- Jalankan script SQL di Supabase SQL Editor, bukan di aplikasi" -ForegroundColor White
Write-Host "- Pastikan project yang dipilih adalah koepzicdtovtknsqlnac" -ForegroundColor White
Write-Host "- Tunggu hingga setiap script selesai dieksekusi" -ForegroundColor White
Write-Host "- Jika ada error, periksa log di SQL Editor" -ForegroundColor White
Write-Host ""

Write-Host "=== SELESAI ===" -ForegroundColor Green
Write-Host "Ikuti langkah-langkah di atas untuk setup database lengkap!" -ForegroundColor Green
