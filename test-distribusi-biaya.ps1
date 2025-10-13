# Script untuk menguji fitur Distribusi Biaya
# Jalankan script ini setelah menjalankan create-dasar-alokasi-table.sql di Supabase

Write-Host "=== TESTING FITUR DISTRIBUSI BIAYA ===" -ForegroundColor Green
Write-Host ""

Write-Host "1. Pastikan script SQL telah dijalankan di Supabase:" -ForegroundColor Yellow
Write-Host "   - Buka Supabase Dashboard" -ForegroundColor White
Write-Host "   - Pergi ke SQL Editor" -ForegroundColor White
Write-Host "   - Jalankan script: create-dasar-alokasi-table.sql" -ForegroundColor White
Write-Host ""

Write-Host "2. Jalankan aplikasi:" -ForegroundColor Yellow
Write-Host "   npm run dev" -ForegroundColor White
Write-Host ""

Write-Host "3. Test fitur yang telah dibuat:" -ForegroundColor Yellow
Write-Host "   a. Buka halaman Dasar Alokasi: http://localhost:5173/dasar-alokasi" -ForegroundColor White
Write-Host "   b. Generate Dasar Alokasi untuk tahun 2024" -ForegroundColor White
Write-Host "   c. Input Total Biaya (contoh: 1000000000)" -ForegroundColor White
Write-Host "   d. Hitung Distribusi Biaya" -ForegroundColor White
Write-Host "   e. Buka halaman Distribusi Biaya: http://localhost:5173/distribusi-biaya" -ForegroundColor White
Write-Host "   f. Lihat laporan dan export CSV" -ForegroundColor White
Write-Host ""

Write-Host "4. Verifikasi data di database:" -ForegroundColor Yellow
Write-Host "   - Tabel Dasar_Alokasi harus terisi dengan data unit kerja" -ForegroundColor White
Write-Host "   - Tabel Distribusi_Biaya harus terisi dengan hasil perhitungan" -ForegroundColor White
Write-Host ""

Write-Host "=== FITUR YANG TELAH DIIMPLEMENTASI ===" -ForegroundColor Green
Write-Host "✅ Tabel Dasar_Alokasi dan Distribusi_Biaya" -ForegroundColor Green
Write-Host "✅ Function generate_dasar_alokasi_otomatis()" -ForegroundColor Green
Write-Host "✅ Function hitung_distribusi_biaya()" -ForegroundColor Green
Write-Host "✅ Mapping dasar alokasi berdasarkan unit kerja" -ForegroundColor Green
Write-Host "✅ Halaman Dasar Alokasi (/dasar-alokasi)" -ForegroundColor Green
Write-Host "✅ Halaman Distribusi Biaya (/distribusi-biaya)" -ForegroundColor Green
Write-Host "✅ Form generate dan hitung distribusi" -ForegroundColor Green
Write-Host "✅ Laporan dengan summary dan detail" -ForegroundColor Green
Write-Host "✅ Export CSV" -ForegroundColor Green
Write-Host "✅ Navigation menu" -ForegroundColor Green
Write-Host ""

Write-Host "=== DASAR ALOKASI MAPPING ===" -ForegroundColor Cyan
Write-Host "Jumlah_SDM: Direktur, Komite PPI, Komite PMKP, Akreditasi, Dewan Pengawas, Bag Tata Usaha, Subag Keuangan, Unit Perbendaharaan, Unit Pendapatan, Unit Akuntansi dan Verifikasi, Subag umpeg, Staf Umum dan kerjasama, Rumah Tangga, Subag renval, Staf Renval, Rekam Medik" -ForegroundColor White
Write-Host ""
Write-Host "Total_Kunjungan_Pasien: Komite Medik, Bid Pengembangan, Seksi penunjang, Bid Keperawatan, Seksi asuhan perawatan, Seksi pengembangan, Bid Pelayanan Medis, Seksi pelayanan, TPPRJ, TPPRI, Unit Akuntansi Manajemen, Analis Biaya dan tarif, Unit Aset, Instalasi Humas" -ForegroundColor White
Write-Host ""
Write-Host "Luas_Ruangan: IPSRS, Cleaning service, Security" -ForegroundColor White
Write-Host ""
Write-Host "Komputer_simrs_user: Unit IT" -ForegroundColor White
Write-Host ""

Write-Host "=== RUMUS DISTRIBUSI BIAYA ===" -ForegroundColor Cyan
Write-Host "Persentase Alokasi = (Nilai Dasar Alokasi Unit Kerja) / (Total Dasar Alokasi untuk Field yang Sama)" -ForegroundColor White
Write-Host "Biaya Dialokasikan = Total Biaya × Persentase Alokasi" -ForegroundColor White
Write-Host ""

Write-Host "=== SELESAI ===" -ForegroundColor Green
Write-Host "Sistem distribusi biaya telah siap digunakan!" -ForegroundColor Green
