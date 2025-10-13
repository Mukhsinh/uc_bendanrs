import React from 'react';
import jsPDF from 'jspdf';

interface ModulPetunjukTeknisProps {
  onDownloadStart?: () => void;
  onDownloadComplete?: () => void;
  onDownloadError?: (error: string) => void;
}

const ModulPetunjukTeknis: React.FC<ModulPetunjukTeknisProps> = ({
  onDownloadStart,
  onDownloadComplete,
  onDownloadError
}) => {
  const generatePDF = async () => {
    try {
      onDownloadStart?.();
      
      // Create new PDF document
      const doc = new jsPDF();
      
      // Set document properties
      doc.setProperties({
        title: 'Modul Petunjuk Teknis Penggunaan Unit Cost RS',
        subject: 'Panduan Lengkap Penggunaan Sistem',
        author: 'Mukhsin Hadi',
        creator: 'Aplikasi Unit Cost RS'
      });

      let currentPage = 1;
      const totalPages = 45;

      // Helper function to add page numbers
      const addPageNumber = (pageNum: number, totalPages: number) => {
        const margin = 42.5;
        doc.setFontSize(10);
        doc.setTextColor(128, 128, 128);
        doc.text(
          `Halaman ${pageNum} dari ${totalPages}`,
          doc.internal.pageSize.width - margin - 20,
          doc.internal.pageSize.height - 10
        );
      };

      // Helper function to add header with color
      const addHeader = (title: string, subtitle?: string) => {
        const margin = 42.5;
        doc.setFontSize(18);
        doc.setTextColor(34, 139, 34); // Green color
        doc.setFont('arial', 'bold');
        doc.text(title, margin, 30);
        
        if (subtitle) {
          doc.setFontSize(11);
          doc.setFont('arial', 'normal');
          doc.setTextColor(100, 100, 100);
          doc.text(subtitle, margin, 40);
        }
        
        // Add colored separator line
        doc.setDrawColor(34, 139, 34);
        doc.line(margin, 45, doc.internal.pageSize.width - margin, 45);
      };

      // Helper function to add content with proper formatting
      const addContent = (content: string, startY: number = 60) => {
        const pageWidth = doc.internal.pageSize.width;
        const pageHeight = doc.internal.pageSize.height;
        const margin = 42.5; // 1.5cm margin untuk A4
        const maxWidth = pageWidth - (margin * 2) - 10; // Extra margin untuk keamanan
        
        doc.setFontSize(11);
        doc.setFont('arial', 'normal');
        doc.setTextColor(0, 0, 0);
        
        const lines = doc.splitTextToSize(content, maxWidth);
        let y = startY;
        
        for (let i = 0; i < lines.length; i++) {
          // Check if we need a new page
          if (y > pageHeight - 70) {
            addPageNumber(currentPage, totalPages);
            doc.addPage();
            currentPage++;
            y = 50;
          }
          
          const line = lines[i] as string;
          
          // Skip empty lines at the start of new page
          if (y === 50 && line.trim() === '') {
            continue;
          }
          
          // Handle different formatting
          if (line.startsWith('#')) {
            // Headers
            const headerText = line.replace(/^#+\s*/, '');
            const headerLevel = line.match(/^#+/)?.[0].length || 1;
            
            doc.setFontSize(16 - headerLevel);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(34, 139, 34); // Green color for headers
            doc.text(headerText, margin, y);
            y += 8;
          } else if (line.startsWith('- ') || line.startsWith('* ')) {
            // Bullet points
            const bulletText = line.replace(/^[-*]\s*/, '');
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(0, 0, 0);
            doc.text('• ' + bulletText, margin + 10, y);
            y += 6;
          } else if (line.trim() === '') {
            // Empty lines
            y += 4;
          } else {
            // Regular text
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(0, 0, 0);
            doc.text(line, margin, y);
            y += 6;
          }
        }
        
        return y;
      };

      // ===== COVER PAGE =====
      const pageWidth = doc.internal.pageSize.width;
      const pageHeight = doc.internal.pageSize.height;
      
      // Background (Green)
      doc.setFillColor(34, 197, 94); // Green-500
      doc.rect(0, 0, pageWidth, pageHeight, "F");
      
      // Decorative circle
      doc.setFillColor(22, 163, 74); // Green-600
      doc.circle(pageWidth / 2, -50, 120, "F");
      
      // Title
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(36);
      doc.setFont("times", "bold");
      doc.text("MODUL", pageWidth / 2, 65, { align: "center" });
      doc.setFontSize(30);
      doc.text("PETUNJUK TEKNIS", pageWidth / 2, 85, { align: "center" });
      doc.text("PENGGUNAAN", pageWidth / 2, 103, { align: "center" });
      
      // Subtitle
      doc.setFontSize(16);
      doc.setFont("times", "bolditalic");
      doc.text("Aplikasi Unit Cost RS", pageWidth / 2, 125, { align: "center" });
      
      // Description
      doc.setFontSize(11);
      doc.setFont("helvetica", "normal");
      doc.text("Panduan Lengkap Penggunaan Sistem", pageWidth / 2, 140, { align: "center" });
      
      // Author section - white box
      doc.setFillColor(255, 255, 255);
      doc.roundedRect(20, 160, pageWidth - 40, 55, 3, 3, "F");
      
      doc.setTextColor(0, 102, 51);
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.text("Disusun oleh:", pageWidth / 2, 172, { align: "center" });
      
      doc.setFontSize(14);
      doc.setFont("times", "bold");
      doc.text("MUKHSIN HADI, SE, M.Si", pageWidth / 2, 185, { align: "center" });
      
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.text("CGAA, CPFRM, CSEP, CRP, CPRM, CSCAP, CPABC", pageWidth / 2, 195, { align: "center" });
      
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.text("Hak Cipta: 000831709", pageWidth / 2, 207, { align: "center" });
      
      // Footer
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(8);
      doc.setFont("helvetica", "italic");
      doc.text("Copyright © 2024 Mukhsin Hadi. Hak Cipta Dilindungi Undang-Undang.", pageWidth / 2, pageHeight - 10, { align: "center" });
      
      // New page for content
      doc.addPage();
      currentPage++;
      
      // ===== MODUL PETUNJUK TEKNIS PENGGUNAAN =====
      addHeader(
        'MODUL PETUNJUK TEKNIS PENGGUNAAN',
        'Panduan Lengkap Penggunaan Sistem Unit Cost RS'
      );
      
      let y = addContent(`
# 1. PANDUAN UMUM NAVIGASI

## 1.1 Struktur Menu Utama
Aplikasi memiliki struktur menu yang terorganisir berdasarkan fungsionalitas:

### Dashboard:
- Executive summary dan KPI utama
- Real-time monitoring dashboard
- Quick access to critical reports
- System health dan performance metrics

### Data Master:
- Unit Kerja management
- Barang dan inventory management
- Master tindakan dan prosedur
- Reference data management

### Unit Penunjang:
- Gizi dan food service costing
- Laundry dan housekeeping
- Maintenance dan utilities
- Support services costing

### Unit Keperawatan:
- Rawat inap costing
- Nursing care analysis
- Patient care pathways
- Resource utilization tracking

### Unit Pelayanan:
- Rawat jalan services
- Emergency services
- Outpatient procedures
- Diagnostic services

### Analisis dan Reporting:
- Unit cost reports
- Profitability analysis
- Trend analysis
- Comparative studies

## 1.2 Cara Login dan Autentikasi

### Langkah-langkah Login:
1. Buka aplikasi di browser (Chrome, Firefox, Safari, Edge)
2. Pastikan koneksi internet stabil
3. Masukkan email dan password yang valid
4. Klik tombol "Login"
5. Tunggu redirect ke dashboard utama

### Troubleshooting Login:
- **Error "Invalid credentials"**: Periksa email dan password
- **Error "Account locked"**: Hubungi administrator
- **Error "Network error"**: Periksa koneksi internet

# 2. DATA MASTER MANAGEMENT

## 2.1 Unit Kerja Management

### Lokasi Menu: Data Master > Unit Kerja

### Fungsi:
Mengelola data unit kerja rumah sakit yang merupakan dasar dari semua perhitungan unit cost.

### Langkah-langkah Operasional:

#### A. Menambah Unit Kerja Baru:
1. Klik menu "Data Master" > "Unit Kerja"
2. Klik tombol "Tambah Data" (icon +)
3. Isi form dengan data:
   - **Kode Unit Kerja**: Harus unik, format UK001, UK002, dst
   - **Nama Unit Kerja**: Nama lengkap unit kerja
   - **Jenis Unit**: Pilih dari dropdown (1=Rawat Jalan, 2=Rawat Inap, 3=Penunjang)
   - **Status**: Aktif/Non-Aktif
4. Klik "Simpan" untuk menyimpan data
5. Sistem akan validasi dan konfirmasi penyimpanan

#### B. Mengedit Unit Kerja:
1. Di halaman Unit Kerja, klik icon edit (pensil) pada baris data
2. Ubah data yang diperlukan
3. Klik "Update" untuk menyimpan perubahan
4. Sistem akan validasi dan konfirmasi update

#### C. Menghapus Unit Kerja:
1. Klik icon hapus (tong sampah) pada baris data
2. Konfirmasi penghapusan
3. Sistem akan validasi dependensi data
4. Jika aman, data akan dihapus

### Flowchart Proses:
Input Kode Unit → Validasi Unik → Input Data Lengkap → Simpan → Konfirmasi → Audit Trail

### Tips dan Best Practices:
- Gunakan kode yang konsisten dan mudah diingat
- Pastikan nama unit kerja sesuai dengan struktur organisasi
- Jangan hapus unit kerja yang sudah memiliki data transaksi
- Lakukan backup data master secara berkala

## 2.2 Data Barang Management

### Lokasi Menu: Data Master > Barang

### Fungsi:
Mengelola katalog barang dan bahan habis pakai yang digunakan dalam operasional rumah sakit.

### Langkah-langkah Operasional:

#### A. Input Data Barang:
1. Klik menu "Data Master" > "Barang"
2. Gunakan filter untuk mencari barang tertentu
3. Klik "Tambah Data" untuk input barang baru
4. Isi informasi barang:
   - **Kode Barang**: Unik, format BRG001, BRG002, dst
   - **Nama Barang**: Nama lengkap barang
   - **Satuan**: Pcs, Box, Liter, Kg, dst
   - **Harga Satuan**: Harga dalam Rupiah
   - **Kategori**: Medis/Non-Medis/Konsumsi
   - **Supplier**: Nama supplier
   - **Min Stock**: Minimum stock level
5. Simpan data dengan klik "Simpan"

#### B. Import Data Barang:
1. Siapkan file Excel dengan format template
2. Klik "Import Data" di halaman barang
3. Upload file Excel
4. Validasi data dan preview
5. Konfirmasi import

### Flowchart Proses:
Input Kode Barang → Validasi Unik → Input Data Lengkap → Simpan → Konfirmasi

### Tips dan Best Practices:
- Update harga barang secara berkala
- Gunakan kategori yang konsisten
- Monitor stock level untuk barang critical
- Lakukan audit fisik secara berkala

## 2.3 Data Tindakan Management

### Lokasi Menu: Data Master > Daftar Tindakan

### Fungsi:
Mengelola master tindakan medis dan non-medis yang menjadi dasar perhitungan unit cost.

### Langkah-langkah Operasional:

#### A. Menambah Tindakan Baru:
1. Pilih menu "Daftar Tindakan"
2. Gunakan pencarian untuk menemukan tindakan
3. Klik "Tambah Data"
4. Input data tindakan:
   - **Kode Tindakan**: Unik, format TDK001, TDK002, dst
   - **Nama Tindakan**: Nama lengkap tindakan
   - **Kategori Tindakan**: Medis/Non-Medis/Diagnostik
   - **Waktu Standar**: Dalam menit
   - **Tingkat Profesionalisme**: Skala 1-5
   - **Tingkat Kesulitan**: Skala 1-5
   - **Biaya Bahan Tindakan**: Biaya bahan per tindakan
   - **Tarif BPJS**: Jika applicable
5. Simpan data

#### B. Bulk Update Tindakan:
1. Gunakan filter untuk memilih tindakan
2. Klik "Bulk Update"
3. Pilih field yang akan diupdate
4. Input nilai baru
5. Konfirmasi update

### Flowchart Proses:
Input Kode Tindakan → Validasi Unik → Input Data Lengkap → Set Parameter → Simpan → Konfirmasi

### Tips dan Best Practices:
- Standardisasi waktu tindakan berdasarkan pengamatan
- Update tingkat kesulitan berdasarkan feedback dokter
- Monitor biaya bahan secara berkala
- Sinkronisasi dengan kode BPJS

# 3. KALKULASI BIAYA TERINTEGRASI

## 3.1 Kalkulasi Biaya Gizi

### Lokasi Menu: Unit Penunjang > Kalkulasi Biaya Gizi

### Tujuan:
Menghitung unit cost layanan gizi per pasien per hari.

### Langkah-langkah Operasional:

#### A. Setup Data Periode:
1. Pilih periode (bulan/tahun)
2. Pilih unit kerja gizi
3. Validasi data periode sebelumnya

#### B. Input Data Volume Layanan:
1. Input jumlah pasien per kategori diet:
   - Diet Biasa
   - Diet Rendah Garam
   - Diet Diabetes
   - Diet Rendah Protein
   - Diet Khusus lainnya
2. Input porsi makanan per kategori
3. Input jumlah hari pelayanan

#### C. Input Data Biaya:
1. **Biaya Bahan Makanan**:
   - Biaya bahan mentah
   - Biaya bumbu dan seasoning
   - Biaya packaging
2. **Biaya Tenaga Kerja**:
   - Gaji koki dan staff
   - Overtime dan lembur
   - Benefit dan tunjangan
3. **Biaya Overhead**:
   - Listrik dan gas
   - Air dan utilitas
   - Maintenance peralatan
   - Depresiasi peralatan

#### D. Proses Kalkulasi:
1. Klik "Hitung Unit Cost"
2. Sistem akan menghitung:
   - Total biaya bahan per porsi
   - Total biaya tenaga kerja per porsi
   - Total biaya overhead per porsi
   - Unit cost per pasien per hari
3. Review hasil perhitungan
4. Validasi dengan budget
5. Simpan hasil kalkulasi

### Flowchart Proses Bisnis:
Setup Periode → Input Volume → Input Biaya → Kalkulasi → Validasi → Simpan → Report

### Tips dan Best Practices:
- Lakukan sampling kualitas makanan secara berkala
- Monitor waste dan spoilage
- Update harga bahan sesuai inflasi
- Benchmark dengan rumah sakit lain

## 3.2 Kalkulasi Tindakan Rawat Jalan

### Lokasi Menu: Unit Pelayanan > Kalkulasi Tindakan Rawat Jalan

### Tujuan:
Menghitung biaya per tindakan rawat jalan untuk penetapan tarif yang akurat.

### Langkah-langkah Operasional:

#### A. Setup Data Unit Kerja:
1. Pilih unit kerja rawat jalan
2. Pilih periode kalkulasi
3. Validasi data tindakan yang sudah ada

#### B. Input Data Tindakan:
1. **Volume Tindakan**:
   - Jumlah tindakan per jenis
   - Waktu rata-rata per tindakan
   - Frekuensi tindakan per hari
2. **Parameter Tindakan**:
   - Tingkat kesulitan
   - Profesionalisme yang dibutuhkan
   - Kompleksitas prosedur

#### C. Input Data Biaya Unit:
1. **Biaya Tenaga Kerja**:
   - Gaji dokter spesialis
   - Gaji perawat
   - Gaji admin dan support
2. **Biaya Bahan dan Obat**:
   - Biaya obat per tindakan
   - Biaya BHP (Bahan Habis Pakai)
   - Biaya alat medis
3. **Biaya Overhead**:
   - Biaya ruang dan fasilitas
   - Biaya peralatan medis
   - Biaya maintenance
   - Biaya administrasi

#### D. Proses Kalkulasi:
1. Klik "Hitung Unit Cost"
2. Sistem menghitung:
   - Biaya tenaga kerja per tindakan
   - Biaya bahan per tindakan
   - Biaya overhead per tindakan
   - Total unit cost per tindakan
3. Analisis profitabilitas
4. Simpan hasil kalkulasi

### Flowchart Proses Bisnis:
Setup Unit → Input Volume → Input Biaya → Kalkulasi → Analisis → Simpan → Report

### Tips dan Best Practices:
- Update waktu tindakan berdasarkan time study
- Monitor efisiensi tenaga kerja
- Analisis variance dengan budget
- Benchmark dengan standar industri

## 3.3 Kalkulasi Tindakan Rawat Inap

### Lokasi Menu: Unit Keperawatan > Kalkulasi Tindakan Inap

### Tujuan:
Menghitung biaya per hari rawat inap berdasarkan kelas kamar.

### Langkah-langkah Operasional:

#### A. Setup Data Unit Rawat Inap:
1. Pilih unit rawat inap (kelas kamar)
2. Pilih periode kalkulasi
3. Input data kapasitas dan okupansi

#### B. Input Data Biaya Per Kategori:
1. **Biaya Tenaga Keperawatan**:
   - Gaji perawat per shift
   - Rasio perawat per pasien
   - Overtime dan lembur
2. **Biaya Akomodasi**:
   - Biaya kamar per hari
   - Biaya linen dan laundry
   - Biaya housekeeping
3. **Biaya Makanan Pasien**:
   - Biaya catering per porsi
   - Biaya distribusi makanan
   - Biaya waste management
4. **Biaya Lainnya**:
   - Biaya utilitas (listrik, air, AC)
   - Biaya maintenance kamar
   - Biaya administrasi

#### C. Proses Kalkulasi:
1. Klik "Hitung Unit Cost"
2. Sistem menghitung:
   - Total biaya per hari rawat
   - Biaya per jam rawat
   - Break-even analysis
   - Profit margin analysis
3. Simpan hasil kalkulasi

### Flowchart Proses Bisnis:
Setup Unit → Input Kapasitas → Input Biaya → Kalkulasi → Analisis → Simpan → Report

### Tips dan Best Practices:
- Monitor LOS (Length of Stay) secara berkala
- Analisis efisiensi okupansi kamar
- Update biaya sesuai inflasi
- Benchmark dengan rumah sakit sejenis

# 4. SISTEM DISTRIBUSI BIAYA

## 4.1 Dasar Alokasi Biaya

### Lokasi Menu: Distribusi Biaya > Dasar Alokasi

### Tujuan:
Menentukan dasar alokasi biaya overhead yang fair dan akurat.

### Langkah-langkah Operasional:

#### A. Identifikasi Biaya Overhead:
1. List semua biaya overhead:
   - Biaya listrik dan utilitas
   - Biaya administrasi umum
   - Biaya pemeliharaan gedung
   - Biaya keamanan
   - Biaya kebersihan
2. Kategorikan berdasarkan sifat biaya
3. Tentukan cost center penerima

#### B. Tentukan Dasar Alokasi:
1. **Luas Ruangan** (untuk biaya listrik, air, AC):
   - Ukur luas setiap unit kerja
   - Hitung persentase luas
   - Alokasi berdasarkan persentase
2. **Jumlah Karyawan** (untuk biaya admin):
   - Hitung jumlah karyawan per unit
   - Hitung persentase karyawan
   - Alokasi berdasarkan persentase
3. **Volume Layanan** (untuk biaya pemeliharaan):
   - Hitung volume layanan per unit
   - Hitung persentase volume
   - Alokasi berdasarkan persentase

#### C. Setup Dasar Alokasi:
1. Input data dasar alokasi per unit
2. Validasi total alokasi = 100%
3. Simpan konfigurasi dasar alokasi
4. Test dengan data sample

### Flowchart Proses:
Identifikasi Biaya → Tentukan Dasar → Input Data → Validasi → Simpan → Test

### Tips dan Best Practices:
- Review dasar alokasi setiap 6 bulan
- Gunakan multiple allocation bases jika perlu
- Dokumentasi asumsi dan metode
- Benchmark dengan best practice

## 4.2 Distribusi Tahap Pertama

### Lokasi Menu: Distribusi Biaya > Distribusi Pertama

### Tujuan:
Mendistribusikan biaya overhead dari general cost center ke department cost center.

### Langkah-langkah Operasional:

#### A. Setup Periode Distribusi:
1. Pilih periode distribusi
2. Validasi data biaya overhead
3. Validasi dasar alokasi

#### B. Proses Distribusi:
1. Klik "Proses Distribusi"
2. Sistem akan:
   - Ambil data biaya overhead
   - Ambil data dasar alokasi
   - Hitung nilai distribusi per unit
   - Validasi total distribusi
3. Review hasil distribusi
4. Analisis variance dengan budget
5. Konfirmasi dan simpan

#### C. Report Distribusi:
1. Generate report distribusi
2. Analisis per unit kerja
3. Identifikasi outlier
4. Dokumentasi variance

### Flowchart Proses:
Setup Periode → Proses Distribusi → Review → Analisis → Simpan → Report

### Tips dan Best Practices:
- Monitor variance dengan budget
- Investigasi outlier
- Dokumentasi penjelasan variance
- Update budget jika perlu

## 4.3 Distribusi Tahap Kedua

### Lokasi Menu: Distribusi Biaya > Distribusi Kedua

### Tujuan:
Mendistribusikan biaya dari department cost center ke revenue center.

### Langkah-langkah Operasional:

#### A. Setup Distribusi Kedua:
1. Pilih periode distribusi
2. Pilih cost center sumber
3. Pilih revenue center tujuan

#### B. Tentukan Dasar Distribusi:
1. **Volume Layanan** (untuk biaya keperawatan):
   - Jumlah pasien per revenue center
   - Jumlah tindakan per revenue center
   - Jumlah jam kerja per revenue center
2. **Revenue** (untuk biaya admin):
   - Pendapatan per revenue center
   - Margin profit per revenue center

#### C. Proses Distribusi:
1. Input volume layanan per revenue center
2. Klik "Hitung Distribusi"
3. Sistem menghitung:
   - Nilai distribusi per revenue center
   - Unit cost dialokasi
   - Total biaya per revenue center
4. Review dan validasi
5. Simpan hasil distribusi

### Flowchart Proses:
Setup Distribusi → Input Volume → Hitung → Review → Validasi → Simpan → Report

### Tips dan Best Practices:
- Gunakan multiple allocation bases
- Monitor accuracy allocation
- Update allocation bases secara berkala
- Benchmark dengan industry standard

# 5. REKAPITULASI DAN LAPORAN

## 5.1 Rekapitulasi Unit Cost

### Lokasi Menu: Rekapitulasi Unit Cost

### Tujuan:
Menampilkan ringkasan unit cost semua layanan untuk analisis komprehensif.

### Langkah-langkah Operasional:

#### A. Setup Laporan:
1. Pilih periode laporan
2. Pilih unit kerja (semua atau specific)
3. Pilih format laporan (summary/detail)
4. Pilih level analisis

#### B. Generate Laporan:
1. Klik "Generate Laporan"
2. Sistem akan:
   - Ambil data kalkulasi semua unit
   - Hitung total biaya dan unit cost
   - Analisis variance dengan periode sebelumnya
   - Generate summary dan detail report
3. Review hasil laporan
4. Analisis trend dan pattern
5. Identifikasi area improvement

#### C. Export dan Distribution:
1. Export ke Excel untuk analisis lanjutan
2. Export ke PDF untuk distribusi
3. Schedule automatic report
4. Setup email notification

### Flowchart Proses:
Setup Laporan → Generate → Review → Analisis → Export → Distribute → Schedule

### Tips dan Best Practices:
- Monitor trend unit cost secara berkala
- Analisis variance dengan budget
- Benchmark dengan competitor
- Update target unit cost

## 5.2 Skenario Tarif

### Lokasi Menu: Skenario Tarif

### Tujuan:
Menganalisis dan merencanakan tarif layanan berdasarkan unit cost.

### Langkah-langkah Operasional:

#### A. Setup Skenario:
1. Pilih jenis layanan
2. Input unit cost dasar
3. Set parameter skenario:
   - Margin profit yang diinginkan
   - Target ROI
   - Market positioning

#### B. Analisis Skenario:
1. Klik "Analisis Skenario"
2. Sistem akan menghitung:
   - Tarif dengan berbagai margin
   - Break-even analysis
   - Sensitivity analysis
   - Competitive analysis
3. Review hasil analisis
4. Bandingkan dengan tarif kompetitor
5. Pilih skenario optimal

#### C. Implementasi Skenario:
1. Simpan skenario tarif
2. Generate proposal tarif
3. Presentasi ke management
4. Implementasi setelah approval

### Flowchart Proses:
Setup Skenario → Analisis → Review → Bandingkan → Pilih → Simpan → Implementasi

### Tips dan Best Practices:
- Monitor market pricing secara berkala
- Analisis elasticity demand
- Consider regulatory constraints
- Update pricing strategy

# 6. TIPS DAN BEST PRACTICES

## 6.1 Validasi Data

### Data Quality Assurance:
- **Regular Validation**: Validasi data input secara berkala
- **Exception Reporting**: Monitor data yang tidak normal
- **Cross Validation**: Bandingkan dengan sumber data lain
- **Audit Trail**: Dokumentasi semua perubahan data

### Data Accuracy:
- **Source Verification**: Pastikan data dari sumber yang valid
- **Timeliness**: Update data sesuai dengan jadwal
- **Completeness**: Pastikan data lengkap dan konsisten
- **Accuracy Check**: Verifikasi akurasi data secara berkala

## 6.2 Cost Control

### Budget Management:
- **Budget vs Actual**: Monitor variance dengan budget
- **Variance Analysis**: Investigasi variance yang significant
- **Cost Reduction**: Identifikasi opportunity cost reduction
- **Performance Benchmarking**: Bandingkan dengan best practice

### Operational Efficiency:
- **Process Optimization**: Optimasi proses operasional
- **Resource Utilization**: Optimasi penggunaan sumber daya
- **Waste Reduction**: Minimize waste dan inefficiency
- **Continuous Improvement**: Implementasi continuous improvement

## 6.3 System Maintenance

### Regular Maintenance:
- **Data Backup**: Backup data secara berkala
- **System Update**: Update system dan security patch
- **Performance Monitoring**: Monitor performance system
- **User Training**: Training user secara berkala

### Troubleshooting:

#### Masalah Umum dan Solusi:

**1. Data tidak tersimpan:**
- Periksa koneksi internet
- Refresh halaman dan coba lagi
- Periksa validasi input data
- Hubungi IT support jika masalah berlanjut

**2. Perhitungan tidak akurat:**
- Periksa input data biaya
- Periksa konfigurasi dasar alokasi
- Validasi dengan perhitungan manual
- Review parameter kalkulasi

**3. Laporan tidak muncul:**
- Pastikan data sudah lengkap untuk periode yang dipilih
- Periksa permission user
- Clear browser cache
- Hubungi administrator

**4. Error loading data:**
- Periksa koneksi database
- Refresh halaman
- Logout dan login kembali
- Restart browser

**5. Performance lambat:**
- Close tab browser yang tidak perlu
- Clear browser cache
- Periksa koneksi internet
- Gunakan filter untuk membatasi data

### Best Practices:
- **Regular Backup**: Backup data setiap hari
- **User Training**: Training user secara berkala
- **Documentation**: Dokumentasi proses dan procedure
- **Monitoring**: Monitor system performance secara berkala

# 7. TROUBLESHOOTING LANJUTAN

## 7.1 Technical Issues

### Database Connection Issues:
1. Periksa koneksi internet
2. Restart aplikasi
3. Clear browser cache
4. Hubungi IT support

### Performance Issues:
1. Close unnecessary browser tabs
2. Clear browser cache
3. Restart browser
4. Check system resources

### Data Synchronization Issues:
1. Refresh data secara manual
2. Check data source
3. Verify data integrity
4. Re-sync data jika perlu

## 7.2 User Management

### Password Issues:
1. Use password reset feature
2. Contact administrator
3. Verify email address
4. Check spam folder

### Permission Issues:
1. Contact administrator
2. Verify user role
3. Check access rights
4. Request permission update

### Training Issues:
1. Access online help
2. Contact training team
3. Request additional training
4. Use video tutorials

## 7.3 Data Issues

### Data Inconsistency:
1. Validate data source
2. Cross-check with other systems
3. Request data correction
4. Update data manually

### Missing Data:
1. Check data entry process
2. Verify data source
3. Request missing data
4. Update data manually

### Data Accuracy:
1. Verify with source system
2. Cross-validate with manual calculation
3. Request data audit
4. Correct data if needed

# 8. KESIMPULAN

Modul Petunjuk Teknis Penggunaan ini memberikan panduan lengkap untuk menggunakan aplikasi Unit Cost RS secara efektif dan efisien. Dengan mengikuti langkah-langkah yang telah dijelaskan, pengguna dapat:

## 8.1 Key Benefits:
- **Operational Efficiency**: Peningkatan efisiensi operasional
- **Data Accuracy**: Akurasi data yang tinggi
- **Cost Transparency**: Transparansi biaya yang baik
- **Decision Support**: Dukungan pengambilan keputusan

## 8.2 Success Factors:
- **User Training**: Training yang memadai
- **Data Quality**: Kualitas data yang baik
- **Process Compliance**: Compliance dengan proses
- **Continuous Improvement**: Perbaikan berkelanjutan

## 8.3 Next Steps:
- Implementasi best practices
- Regular monitoring dan review
- Continuous training dan development
- System optimization dan enhancement

# 9. FLOWCHART PROSES BISNIS

## 9.1 Flowchart Login dan Autentikasi

### Proses Login:
1. **User Input** → Masukkan email dan password
2. **Validasi Input** → Cek format email dan panjang password
3. **Autentikasi** → Verifikasi ke database
4. **Berhasil** → Redirect ke dashboard
5. **Gagal** → Tampilkan error message

### Flowchart Autentikasi:
- **Start** → User membuka aplikasi
- **Input Credentials** → Email dan password
- **Validate Format** → Cek format input
- **Database Check** → Query ke auth.users
- **Success?** → Jika ya: Dashboard, Jika tidak: Error
- **Error Handling** → Tampilkan pesan error
- **End** → User berhasil login atau gagal

## 9.2 Flowchart Input Data Master

### Proses Input Unit Kerja:
1. **Menu Data Master** → Klik menu Unit Kerja
2. **Form Input** → Isi data unit kerja
3. **Validasi Data** → Cek kelengkapan dan format
4. **Save to Database** → Insert ke tabel unit_kerja
5. **Success Message** → Konfirmasi berhasil

### Flowchart Input Barang:
- **Start** → Buka menu Data Master
- **Select Barang** → Klik menu Barang
- **Input Form** → Isi data barang
- **Validation** → Cek data input
- **Database Insert** → Simpan ke tabel
- **Success** → Tampilkan konfirmasi
- **End** → Data tersimpan

## 9.3 Flowchart Input Data Transaksi

### Proses Input Transaksi Rawat Jalan:
1. **Menu Transaksi** → Pilih Rawat Jalan
2. **Select Unit** → Pilih unit kerja
3. **Input Data** → Volume dan waktu
4. **Calculate** → Hitung otomatis
5. **Save** → Simpan transaksi
6. **Confirm** → Konfirmasi berhasil

### Flowchart Input Transaksi Rawat Inap:
- **Start** → Menu Transaksi
- **Select Rawat Inap** → Pilih jenis transaksi
- **Input Volume** → Jumlah pasien
- **Input Waktu** → Durasi rawat inap
- **Auto Calculate** → Sistem hitung otomatis
- **Review Data** → Cek hasil perhitungan
- **Save Transaction** → Simpan ke database
- **Success** → Konfirmasi berhasil
- **End** → Transaksi tersimpan

## 9.4 Flowchart Kalkulasi Unit Cost

### Proses Kalkulasi Otomatis:
1. **Trigger Calculation** → Sistem otomatis kalkulasi
2. **Get Data** → Ambil data transaksi dan biaya
3. **Calculate Direct Cost** → Hitung biaya langsung
4. **Calculate Indirect Cost** → Hitung biaya tidak langsung
5. **Distribute Cost** → Distribusi biaya ke unit
6. **Final Calculation** → Hitung unit cost final
7. **Update Database** → Simpan hasil kalkulasi
8. **Generate Report** → Buat laporan

### Flowchart Distribusi Biaya:
- **Start** → Mulai kalkulasi
- **Load Data** → Ambil data dari database
- **Direct Cost Calc** → Hitung biaya langsung
- **Indirect Cost Calc** → Hitung biaya tidak langsung
- **Cost Distribution** → Distribusi berdasarkan driver
- **Unit Cost Calc** → Hitung unit cost per layanan
- **Validation** → Cek hasil kalkulasi
- **Save Results** → Simpan ke database
- **Generate Reports** → Buat laporan
- **End** → Kalkulasi selesai

## 9.5 Flowchart Generate Laporan

### Proses Generate Laporan:
1. **Menu Laporan** → Pilih jenis laporan
2. **Set Parameters** → Periode dan filter
3. **Query Data** → Ambil data dari database
4. **Process Data** → Olah data untuk laporan
5. **Format Report** → Format sesuai template
6. **Generate PDF** → Buat file PDF
7. **Download** → Download laporan

### Flowchart Export Data:
- **Start** → Menu Laporan
- **Select Report Type** → Pilih jenis laporan
- **Set Date Range** → Tentukan periode
- **Apply Filters** → Filter data
- **Query Database** → Ambil data
- **Process Data** → Olah data
- **Format Output** → Format laporan
- **Generate File** → Buat file PDF/Excel
- **Download** → Download file
- **End** → Laporan siap

Dengan mengikuti panduan ini dan menerapkan best practices yang telah dijelaskan, aplikasi Unit Cost RS akan memberikan nilai tambah yang signifikan dalam pengelolaan biaya operasional rumah sakit.
`, 60);

      // Add copyright footer to all pages
      for (let i = 1; i <= currentPage; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(100, 100, 100);
        doc.text('Copyright © 2024 Mukhsin Hadi. Hak Cipta Dilindungi Undang-Undang', 20, doc.internal.pageSize.height - 15);
        addPageNumber(i, currentPage);
      }

      // Save the PDF
      const fileName = `Modul_Petunjuk_Teknis_Unit_Cost_RS_${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(fileName);
      
      onDownloadComplete?.();
      
    } catch (error) {
      console.error('Error generating PDF:', error);
      onDownloadError?.(error instanceof Error ? error.message : 'Unknown error occurred');
    }
  };

  return (
    <button
      onClick={generatePDF}
      className="inline-flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 transition-colors"
      title="Unduh Modul Petunjuk Teknis (45 halaman)"
    >
      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
      Unduh (45 halaman)
    </button>
  );
};

export default ModulPetunjukTeknis;
