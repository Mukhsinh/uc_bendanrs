# Template Import Data Kegiatan dengan Data Master

## Overview
Fitur template import data kegiatan telah diperbarui untuk secara otomatis mengisi field yang telah terisi di data master, sehingga saat diunduh sudah muncul data yang telah diinput sebelumnya di data master.

## Fitur yang Diimplementasikan

### 1. Template dengan Data Master
- **Fungsi**: `handleDownloadTemplate()`
- **Deskripsi**: Mengunduh template CSV yang sudah berisi data master dari tabel `unit_kerja`
- **Field yang diisi otomatis**:
  - `tahun`: Tahun saat ini
  - `Kode_UK`: Kode unit kerja dari data master
  - `Nama_Unit_Kerja`: Nama unit kerja dari data master  
  - `Jenis`: Jenis unit kerja dari data master (Rawat Jalan, Rawat Inap, Operatif, Non Layanan)
- **File output**: `template_data_kegiatan_{tahun}_dengan_data_master.csv`

### 2. Template Kosong
- **Fungsi**: `handleDownloadEmptyTemplate()`
- **Deskripsi**: Mengunduh template CSV kosong tanpa data master
- **File output**: `template_data_kegiatan_kosong.csv`

### 3. Import Data yang Diperbarui
- **Fungsi**: `handleImportData()`
- **Fitur baru**:
  - Mendukung import dari template dengan data master
  - Validasi kode unit kerja terhadap data master
  - Fallback ke data master jika field kosong di template
  - Pesan sukses yang informatif tentang penggunaan data master

## Relasi Data Master

### Tabel `unit_kerja`
```sql
- kode: VARCHAR (format UK###)
- nama: VARCHAR (nama unit kerja)
- jenis: SMALLINT (1: Rawat Jalan, 2: Rawat Inap, 3: Operatif, 4: Non Layanan)
- kategori: VARCHAR (Pusat Biaya, Pusat Pendapatan)
```

### Mapping Jenis Unit Kerja
```typescript
const jenisCodeToLabel = (code: number) => {
  if (code === 1) return "Rawat Jalan";
  if (code === 2) return "Rawat Inap";
  if (code === 3) return "Operatif";
  if (code === 4) return "Non Layanan";
  return undefined;
};
```

## Cara Penggunaan

### 1. Download Template dengan Data Master
1. Klik tombol "Template dengan Data Master"
2. File CSV akan diunduh dengan semua unit kerja dari data master
3. Template sudah berisi:
   - Kode unit kerja (UK001, UK002, dst.)
   - Nama unit kerja
   - Jenis unit kerja
   - Tahun saat ini
4. Tinggal mengisi data kegiatan untuk setiap unit kerja

### 2. Download Template Kosong
1. Klik tombol "Template Kosong"
2. File CSV kosong akan diunduh
3. Harus mengisi semua field termasuk kode, nama, dan jenis unit kerja

### 3. Import Data
1. Klik tombol "Impor Data"
2. Pilih file CSV (template dengan data master atau kosong)
3. Sistem akan:
   - Validasi kode unit kerja terhadap data master
   - Menggunakan data master sebagai fallback
   - Menampilkan progress import
   - Memberikan informasi sukses dengan detail

## UI Improvements

### Informasi Template
- Panel informasi biru yang menjelaskan perbedaan kedua template
- Tombol "Template dengan Data Master" dengan styling hijau untuk menonjolkan fitur utama
- Pesan sukses yang informatif

### Validasi dan Error Handling
- Validasi kode unit kerja terhadap data master
- Penanganan data yang tidak valid
- Progress indicator untuk import
- Pesan error yang jelas

## Keuntungan

1. **Efisiensi**: User tidak perlu mengisi kode, nama, dan jenis unit kerja manual
2. **Konsistensi**: Data master memastikan konsistensi kode dan nama unit kerja
3. **Akurasi**: Mengurangi kesalahan input manual
4. **Fleksibilitas**: Tetap mendukung template kosong untuk kasus khusus
5. **User Experience**: Interface yang jelas dengan penjelasan fitur

## Technical Details

### Dependencies
- `papaparse`: Untuk parsing CSV
- `file-saver`: Untuk download file
- `sonner`: Untuk toast notifications

### Data Flow
1. Fetch data unit kerja dari database
2. Generate template dengan data master
3. User mengisi data kegiatan
4. Import dengan validasi dan fallback ke data master
5. Insert ke database dengan computed fields

### Computed Fields
Database secara otomatis menghitung:
- `Jumlah_SDM`: SDM_dokter + SDM_Perawat + SDM_Non
- `Total_Kunjungan_Pasien`: Kunjungan_Pasien_Lama + Kunjungan_Pasien_Baru
- `Total_Diklat`: Diklat_Jumlah_Siswa * Diklat_Lama_Hari
