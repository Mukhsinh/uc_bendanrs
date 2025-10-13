# Fitur Grafik Perbandingan Pendapatan BPJS vs Umum/Asuransi

## 🎯 Overview
Fitur grafik perbandingan pendapatan telah berhasil ditambahkan ke halaman manajemen data pendapatan. Grafik ini memungkinkan analisis visual perbandingan antara pendapatan BPJS Kesehatan dan Umum/Asuransi dengan filter berdasarkan jenis layanan.

## 📊 Fitur Utama

### 1. **Grafik Batang (Bar Chart)**
- Menampilkan perbandingan pendapatan BPJS vs Umum/Asuransi per unit kerja
- Sumbu X: Unit Kerja (Pusat Pendapatan)
- Sumbu Y: Jumlah Pendapatan (dalam jutaan rupiah)
- Warna berbeda untuk setiap jenis pendapatan:
  - 🔵 Biru: BPJS Kesehatan
  - 🟢 Hijau: Umum/Asuransi

### 2. **Grafik Pie (Pie Chart)**
- Menampilkan proporsi total pendapatan BPJS vs Umum/Asuransi
- Persentase otomatis dihitung
- Tooltip dengan format mata uang Rupiah

### 3. **Filter Cerdas**
- **Filter Jenis Layanan:**
  - Semua Jenis
  - Rawat Jalan
  - Rawat Inap
  - Operatif
- **Filter Tahun:** 5 tahun terakhir (dapat disesuaikan)

### 4. **Statistik Ringkasan**
- Total Pendapatan BPJS Kesehatan
- Total Pendapatan Umum/Asuransi
- Total Pendapatan Keseluruhan
- Format mata uang Rupiah yang mudah dibaca

## 🔧 Implementasi Teknis

### Komponen Utama
- **File:** `src/components/PendapatanChart.tsx`
- **Library:** Recharts (sudah tersedia di package.json)
- **Database:** Supabase dengan relasi ke tabel `unit_kerja`

### Struktur Data
```typescript
interface ChartData {
  unit_kerja: string;
  pendapatan_bpjs: number;
  pendapatan_umum: number;
  total_pendapatan: number;
}
```

### Query Database
- Mengambil data dari tabel `data_pendapatan`
- Join dengan tabel `unit_kerja` untuk mendapatkan informasi jenis layanan
- Filter berdasarkan kategori "Pusat Pendapatan"
- Filter berdasarkan jenis layanan (1: Rawat Jalan, 2: Rawat Inap, 3: Operatif)

## 🎨 UI/UX Features

### Responsive Design
- Grafik menyesuaikan dengan ukuran layar
- Layout yang optimal untuk desktop dan mobile

### Interaktif
- Tooltip informatif dengan format mata uang
- Tab switching antara grafik batang dan pie
- Filter real-time tanpa reload halaman

### Loading States
- Indikator loading saat mengambil data
- Pesan informatif jika tidak ada data

## 📈 Cara Penggunaan

1. **Akses Halaman:** Navigasi ke "Data Pendapatan"
2. **Lihat Grafik:** Grafik akan muncul di bagian atas halaman
3. **Filter Data:** 
   - Pilih jenis layanan dari dropdown
   - Pilih tahun yang ingin dianalisis
4. **Ganti Tampilan:** Klik tab "Grafik Batang" atau "Grafik Pie"
5. **Analisis:** Lihat statistik ringkasan di bagian bawah

## 🔄 Integrasi dengan Sistem

### Halaman DataPendapatan
- Grafik ditampilkan di bagian atas
- Tabel data pendapatan tetap di bagian bawah
- Layout vertikal dengan spacing yang konsisten

### Data Source
- Menggunakan data yang sama dengan tabel pendapatan
- Real-time sync dengan database
- Konsisten dengan filter yang ada

## 🚀 Keunggulan

1. **Visualisasi yang Jelas:** Mudah memahami perbandingan pendapatan
2. **Filter Fleksibel:** Analisis berdasarkan jenis layanan dan tahun
3. **Format Mata Uang:** Tampilan yang user-friendly
4. **Responsive:** Bekerja optimal di berbagai perangkat
5. **Real-time:** Data selalu up-to-date

## 📋 Requirements Terpenuhi

✅ **Grafik perbandingan BPJS vs Umum/Asuransi**
✅ **Filter berdasarkan rawat jalan/inap**
✅ **Integrasi dengan halaman manajemen data pendapatan**
✅ **Template import otomatis menampilkan unit kerja Pusat Pendapatan**
✅ **UI yang modern dan responsif**

## 🔮 Potensi Pengembangan

- Export grafik sebagai gambar/PDF
- Grafik trend multi-tahun
- Perbandingan dengan target pendapatan
- Drill-down ke detail unit kerja
- Notifikasi jika ada perbedaan signifikan
