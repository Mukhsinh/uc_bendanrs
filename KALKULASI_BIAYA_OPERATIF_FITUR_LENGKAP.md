# Fitur Lengkap Kalkulasi Biaya Operatif

## ✅ Fitur yang Telah Diimplementasikan

### 1. **Kalkulasi Otomatis Setelah Import** ✅
- **Status**: Berhasil diimplementasikan dan berjalan otomatis
- **Cara Kerja**:
  - Setelah data diimpor dari CSV, sistem otomatis memanggil RPC functions:
    1. `fix_dasar_alokasi_operatif` - Menghitung dasar alokasi hasil kali
    2. `fix_biaya_calculation_operatif` - Menghitung semua kolom biaya dan unit cost
  - Progress ditampilkan dengan indikator loading
  - Notifikasi sukses/gagal ditampilkan setelah proses selesai

### 2. **Tombol Edit & Hapus di Kolom Aksi** ✅
- **Tombol Edit** (ikon pensil, background biru):
  - Membuka dialog edit untuk mengubah data tindakan
  - Bisa mengubah: Jumlah, Waktu Pemeriksaan, Profesionalisme, Tingkat Kesulitan
  - Setelah update, kalkulasi otomatis dijalankan
  
- **Tombol Hapus** (ikon trash, background merah):
  - Menghapus data tindakan dengan konfirmasi terlebih dahulu
  - Setelah hapus, data di-refresh otomatis

### 3. **Tombol Bahan dengan Indikator Warna** ✅
- **Lokasi**: Sebelah kanan kolom "Tingkat Kesulitan", sebelum kolom "Bahan Rp"
- **Warna Indikator**:
  - **Hijau** (`bg-green-100`): Belum ada bahan, tombol bertuliskan "Tambah"
  - **Orange** (`bg-orange-100`): Sudah ada bahan, tombol menampilkan "✓ [jumlah]" (contoh: "✓ 3")
- **Fungsi**:
  - Membuka dialog untuk menambah/mengedit bahan pemeriksaan
  - Menampilkan daftar bahan yang sudah ditambahkan
  - Setelah simpan, kalkulasi biaya bahan otomatis diperbarui

### 4. **Fitur Input Manual** ✅
- **Tombol**: "Input Manual" (background hijau) di toolbar atas
- **Fungsi**:
  - Edit data tindakan yang sudah ada (Jumlah, Waktu, Prof, Kesulitan)
  - Form validasi dengan min/max values:
    - Profesionalisme: 1-4
    - Tingkat Kesulitan: 1-7
  - Setelah simpan, kalkulasi otomatis dijalankan
- **Catatan**: Untuk menambah tindakan baru, gunakan menu "Tindakan Operatif" di Data Master

### 5. **Unduh Laporan dengan Filter** ✅
- **Tombol**: "Unduh Laporan" (ikon download) di toolbar atas
- **Jenis Filter**:
  1. **Semua Data**: Unduh seluruh data tindakan operatif
  2. **Per Operator**: Filter berdasarkan operator spesialistik (contoh: dokter bedah, dokter anastesi)
  3. **Per Jenis Tindakan**: Filter berdasarkan jenis tindakan tertentu
- **Format Output**: CSV dengan kolom lengkap:
  - Kode, Kode Operator, Nama Operator
  - Kode Tindakan, Nama Tindakan, Jenis
  - Jumlah, Waktu Pemeriksaan, Profesionalisme, Tingkat Kesulitan
  - Dasar Alokasi Hasil Kali
  - Biaya Bahan Pemeriksaan
  - Biaya Tidak Langsung Terdistribusi
  - Unit Cost Per Tindakan

## 🎯 Perbaikan Tingkat Kesulitan

### Range Baru: 1-7 ✅
- **Sebelumnya**: 1-5
- **Sekarang**: 1-7
- **Diterapkan pada**:
  - Template CSV import
  - Form input manual
  - Validasi saat import
  - Diterapkan di halaman:
    - ✅ Kalkulasi Biaya Operatif
    - ✅ Kalkulasi Biaya Radiologi

## 📊 Struktur Tabel

### Kolom yang Ditampilkan
| Kolom | Deskripsi |
|-------|-----------|
| Kode | Kode tindakan operatif |
| Nama Tindakan | Nama tindakan operatif |
| Jumlah | Jumlah tindakan yang dilakukan |
| Waktu | Waktu pemeriksaan (menit) |
| Prof | Profesionalisme (1-4) |
| Kesulitan | Tingkat kesulitan (1-7) |
| Bahan | Tombol untuk kelola bahan (warna berubah) |
| Bahan Rp | Total biaya bahan pemeriksaan |
| Unit Cost | Unit cost per tindakan (hasil kalkulasi) |
| Edit | Tombol edit data |
| Hapus | Tombol hapus data |

## 🔄 Alur Kerja

### Import Data
1. Klik "Unduh Template Import" untuk mendapatkan template CSV
2. Isi kolom: Jumlah, Waktu Pemeriksaan, Profesionalisme (1-4), Tingkat Kesulitan (1-7)
3. Klik "Import Data" dan pilih file CSV
4. Sistem otomatis:
   - Mengimpor data
   - Menghitung dasar alokasi
   - Menghitung biaya dan unit cost
   - Menampilkan hasil

### Edit Data Manual
1. Klik tombol Edit (ikon pensil biru) pada baris yang ingin diedit
2. Ubah data di dialog yang muncul
3. Klik "Update"
4. Sistem otomatis menjalankan kalkulasi ulang

### Kelola Bahan Pemeriksaan
1. Klik tombol Bahan (hijau untuk kosong, orange untuk sudah ada)
2. Tambahkan bahan menggunakan form
3. Daftar bahan akan ditampilkan
4. Klik "Simpan Semua Bahan"
5. Sistem otomatis menghitung ulang biaya bahan dan unit cost

### Download Laporan
1. Klik "Unduh Laporan"
2. Pilih jenis laporan (Semua/Per Operator/Per Tindakan)
3. Jika memilih filter, pilih operator atau tindakan
4. Klik "Unduh Laporan"
5. File CSV akan terdownload

## 🛠️ RPC Functions yang Digunakan

1. **create_kalkulasi_biaya_operatif_data**
   - Parameter: `p_user_id`, `p_tahun`
   - Fungsi: Membuat data awal dari master `tindakan_operatif`

2. **fix_dasar_alokasi_operatif**
   - Parameter: `p_user_id`, `p_tahun`
   - Fungsi: Menghitung dasar alokasi hasil kali (jumlah × waktu × prof × kesulitan)

3. **fix_biaya_calculation_operatif**
   - Parameter: `p_user_id`, `p_tahun`
   - Fungsi: Menghitung semua kolom biaya dan unit cost per tindakan

## 📝 Catatan Penting

1. **Kalkulasi Otomatis**: Setiap perubahan data (import, edit, update bahan) akan memicu kalkulasi ulang otomatis
2. **Indikator Warna**: Tombol Bahan berubah warna (hijau → orange) saat sudah ada bahan
3. **Validasi**: Input divalidasi untuk memastikan nilai dalam range yang benar
4. **Filter**: Bisa memfilter tampilan berdasarkan operator di toolbar
5. **Responsive**: UI responsive dan mudah digunakan

## ✨ Fitur Tambahan

- Real-time loading indicators saat import dan kalkulasi
- Konfirmasi sebelum menghapus data
- Toast notifications untuk semua aksi
- Counter jumlah data yang ditampilkan
- Format angka dengan separator ribuan

---

**Status**: ✅ Semua fitur berhasil diimplementasikan dan berjalan dengan baik!

