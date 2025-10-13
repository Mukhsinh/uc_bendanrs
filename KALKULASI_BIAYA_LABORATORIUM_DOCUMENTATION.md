# Dokumentasi Kalkulasi Biaya Laboratorium

## Overview
Aplikasi Kalkulasi Biaya Laboratorium adalah sistem untuk menghitung unit cost pemeriksaan laboratorium berdasarkan metode Activity Based Costing (ABC). Sistem ini mengintegrasikan berbagai komponen biaya dan secara otomatis menghitung unit cost per pemeriksaan.

## Table of Contents
1. [Skema Database](#skema-database)
2. [Fitur Aplikasi](#fitur-aplikasi)
3. [Struktur Data](#struktur-data)
4. [Sistem Auto-Update](#sistem-auto-update)
5. [Fitur Import/Export](#fitur-importexport)
6. [API dan Fungsi](#api-dan-fungsi)
7. [User Interface](#user-interface)

---

## Skema Database

### Tabel: `kalkulasi_biaya_laboratorium`

#### Kolom Identitas
- `id` (uuid) - Primary key
- `user_id` (uuid) - Foreign key ke tabel users
- `tahun` (integer) - Tahun kalkulasi
- `kode` (text) - Kode pemeriksaan dari tabel tindakan_laboratorium (PK.001, PA.001, dll)
- `kode_unit_kerja` (text) - Kode unit kerja (UK038 untuk Laboratorium)
- `jenis_pemeriksaan` (text) - Nama pemeriksaan laboratorium

#### Kolom Input Dasar
- `jumlah` (integer) - Jumlah pemeriksaan yang dilakukan
- `waktu_pemeriksaan` (integer) - Waktu pemeriksaan dalam menit
- `profesionalisme` (integer) - Tingkat profesionalisme (1-4)
- `tingkat_kesulitan` (integer) - Tingkat kesulitan (1-5)

#### Kolom Kalkulasi Dasar Alokasi
- `hasil_kali_waktu` (numeric) - Hasil kali waktu = jumlah × waktu_pemeriksaan
- `dasar_alokasi_waktu` (numeric) - Proporsi alokasi berdasarkan waktu
- `hasil_kali` (integer) - Hasil kali = profesionalisme × tingkat_kesulitan
- `dasar_alokasi_hasil_kali` (numeric) - Proporsi alokasi berdasarkan hasil kali

#### Kolom Biaya Bahan
- `bahan_pemeriksaan` (jsonb) - Detail bahan pemeriksaan dalam format JSON
- `biaya_bahan_pemeriksaan_numeric` (integer) - Total biaya bahan dalam Rupiah

#### Kolom Biaya Langsung
- `biaya_gaji_tunjangan` (bigint) - Biaya gaji dan tunjangan
- `biaya_jasa_pelayanan` (bigint) - Biaya jasa pelayanan
- `biaya_obat` (bigint) - Biaya obat
- `biaya_bhp` (bigint) - Biaya bahan habis pakai

#### Kolom Biaya Operasional
- `biaya_makan_karyawan` (bigint) - Biaya makan karyawan
- `biaya_makan_pasien` (bigint) - Biaya makan pasien
- `biaya_rumah_tangga` (bigint) - Biaya rumah tangga
- `biaya_cetak` (bigint) - Biaya cetak dan ATK
- `biaya_atk` (bigint) - Biaya ATK

#### Kolom Biaya Utilitas
- `biaya_listrik` (bigint) - Biaya listrik
- `biaya_air` (bigint) - Biaya air
- `biaya_telp` (bigint) - Biaya telepon

#### Kolom Biaya Pemeliharaan
- `biaya_pemeliharaan_bangunan` (bigint) - Biaya pemeliharaan bangunan
- `biaya_pemeliharaan_alat_medis` (bigint) - Biaya pemeliharaan alat medis
- `biaya_pemeliharaan_alat_non_medis` (bigint) - Biaya pemeliharaan alat non medis
- `biaya_operasional_lainnya` (bigint) - Biaya operasional lainnya

#### Kolom Biaya Penyusutan
- `biaya_penyusutan_gedung` (bigint) - Biaya penyusutan gedung
- `biaya_penyusutan_jaringan` (bigint) - Biaya penyusutan jaringan
- `biaya_penyusutan_alat_medis` (bigint) - Biaya penyusutan alat medis
- `biaya_penyusutan_alat_non_medis` (bigint) - Biaya penyusutan alat non medis

#### Kolom Biaya Lainnya
- `biaya_pendidikan_pelatihan` (bigint) - Biaya pendidikan dan pelatihan
- `biaya_laundry` (bigint) - Biaya laundry
- `biaya_sterilisasi` (bigint) - Biaya sterilisasi

#### Kolom Biaya Tidak Langsung
- `biaya_tidak_langsung_terdistribusi` (bigint) - Total biaya tidak langsung yang terdistribusi

#### Kolom Hasil Akhir
- `unit_cost_per_pemeriksaan` (bigint) - Unit cost per pemeriksaan (hasil akhir)

---

## Fitur Aplikasi

### 1. Input Data
#### a. Input Manual
- Form input untuk menambah data pemeriksaan baru
- Validasi otomatis terhadap master data tindakan_laboratorium
- Auto-generate kode pemeriksaan dari tabel tindakan_laboratorium
- Field input:
  - Jenis Pemeriksaan (dropdown dari master data)
  - Jumlah
  - Waktu Pemeriksaan (menit)
  - Profesionalisme (1-4)
  - Tingkat Kesulitan (1-5)

#### b. Import Data CSV
- Upload file CSV dengan format template
- Validasi data sebelum import
- Progress indicator saat import
- Error handling untuk data yang tidak valid
- Auto-update setelah import berhasil

#### c. Update Bahan Farmasi
- Form pencarian bahan farmasi
- Autocomplete dari tabel data_barang_farmasi
- Input quantity dan harga otomatis
- Menambahkan multiple bahan untuk satu pemeriksaan
- Kalkulasi otomatis total biaya bahan

### 2. Edit dan Delete Data
#### a. Edit Data
- Edit semua field input dasar
- Validasi terhadap master data
- Auto-update kalkulasi setelah edit
- Preserve data bahan yang sudah ada

#### b. Delete Data
- Konfirmasi sebelum delete
- Auto-update tampilan setelah delete
- Soft delete (data masih ada di database)

### 3. Sistem Perhitungan Otomatis
#### a. Database Triggers
Sistem menggunakan database triggers untuk perhitungan otomatis:
- `t_populate_lab_aiu` - Trigger INSERT/UPDATE pada tabel kalkulasi_biaya_laboratorium
- `t_populate_lab_on_data_biaya_au` - Trigger UPDATE pada tabel data_biaya
- `t_populate_lab_on_dbr_au` - Trigger UPDATE pada tabel distribusi_biaya_rekap

#### b. Calculated Fields
Kolom yang dihitung otomatis:
- `hasil_kali_waktu` = jumlah × waktu_pemeriksaan
- `dasar_alokasi_waktu` = hasil_kali_waktu / total_hasil_kali_waktu_semua_pemeriksaan
- `hasil_kali` = profesionalisme × tingkat_kesulitan
- `dasar_alokasi_hasil_kali` = hasil_kali / total_hasil_kali_semua_pemeriksaan
- `biaya_bahan_pemeriksaan_numeric` = SUM(bahan_pemeriksaan[].harga_total)
- Semua kolom biaya dihitung berdasarkan dasar alokasi
- `unit_cost_per_pemeriksaan` = total_biaya / jumlah

#### c. Sumber Data Biaya
- `data_biaya` (kode_unit_kerja = 'UK038') - Biaya langsung unit kerja
- `distribusi_biaya_rekap` (kode_unit_kerja = 'UK038') - Biaya tidak langsung terdistribusi

### 4. Realtime Updates
#### a. Event-Driven System
Sistem menggunakan Supabase Realtime untuk auto-update:
- Monitor perubahan di tabel kalkulasi_biaya_laboratorium
- Monitor perubahan di tabel data_biaya (UK038)
- Monitor perubahan di tabel distribusi_biaya_rekap (UK038)
- Auto-update data saat ada perubahan

#### b. Manual Triggers
Update data juga dilakukan setelah:
- Input manual
- Edit data
- Delete data
- Import data
- Update bahan farmasi

### 5. Export Laporan
#### a. Unduh Template Import
- Template CSV dengan format standar
- Berisi semua jenis pemeriksaan dari master data
- Field kosong siap diisi

#### b. Unduh Laporan
Fitur export dengan filter:
- **Semua Data** - Export semua data kalkulasi
- **Per Jenis Pemeriksaan** - Export data spesifik

Format laporan (37 kolom):
- Semua kolom input dasar
- Semua kolom biaya (25 jenis biaya)
- Unit cost per pemeriksaan

---

## Struktur Data

### 1. Format JSON Bahan Pemeriksaan
```json
[
  {
    "kode_barang": "BRG001",
    "nama": "Nama Bahan",
    "qty": 1,
    "satuan": "pcs",
    "gudang": "Farmasi",
    "harga_satuan": 10000,
    "harga_total": 10000
  }
]
```

### 2. Format CSV Import
```csv
Kode Tindakan,Jenis Pemeriksaan,Jumlah,Waktu Pemeriksaan,Profesionalisme (1-4),Tingkat Kesulitan (1-5)
PK.001,Darah Lengkap Xn 1000,1314,15,1,1
PK.002,Darah Lengkap Xn 330,308,15,1,1
```

### 3. Format CSV Export Laporan
```csv
Kode,Kode Unit Kerja,Jenis Pemeriksaan,Jumlah,Waktu (menit),Prof,Kesulitan,HK Waktu,Alokasi Waktu,Hasil Kali,Alokasi HK,Bahan Rp,Gaji Rp,Jasa Pelayanan Rp,Obat Rp,BHP Rp,Makan Karyawan Rp,Makan Pasien Rp,Rumah Tangga Rp,Cetak Rp,ATK Rp,Listrik Rp,Air Rp,Telp Rp,Pemeliharaan Bangunan Rp,Pemeliharaan Alat Medis Rp,Pemeliharaan Alat Non Medis Rp,Operasional Lainnya Rp,Penyusutan Gedung Rp,Penyusutan Jaringan Rp,Penyusutan Alat Medis Rp,Penyusutan Alat Non Medis Rp,Pendidikan Pelatihan Rp,Laundry Rp,Sterilisasi Rp,Biaya Tidak Langsung Terdistribusi Rp,Unit Cost
```

---

## Sistem Auto-Update

### 1. Realtime Database Listener
```typescript
const channel = supabase
  .channel('kalkulasi_biaya_laboratorium_changes')
  .on('postgres_changes', 
    { 
      event: '*', 
      schema: 'public', 
      table: 'kalkulasi_biaya_laboratorium',
      filter: `user_id=eq.${userId}`
    }, 
    (payload) => {
      console.log('Kalkulasi biaya laboratorium change detected:', payload);
      updateData();
    }
  )
  .on('postgres_changes', 
    { 
      event: '*', 
      schema: 'public', 
      table: 'data_biaya',
      filter: `kode_unit_kerja=eq.UK038`
    }, 
    (payload) => {
      console.log('Data biaya change detected:', payload);
      updateData();
    }
  )
  .on('postgres_changes', 
    { 
      event: '*', 
      schema: 'public', 
      table: 'distribusi_biaya_rekap',
      filter: `kode_unit_kerja=eq.UK038`
    }, 
    (payload) => {
      console.log('Distribusi biaya rekap change detected:', payload);
      updateData();
    }
  )
  .subscribe();
```

### 2. Event-Driven Updates
Update dilakukan secara otomatis saat:
- **INSERT** - Data baru ditambahkan
- **UPDATE** - Data diubah
- **DELETE** - Data dihapus

### 3. Smart Update Logic
```typescript
if (isMounted && !loading && !importing && !autoCalculating) {
  console.log('Auto-updating data due to database change...');
  updateData();
}
```

---

## Fitur Import/Export

### 1. Import Data CSV
#### Flow:
1. User klik "Import Data" dan pilih file CSV
2. Sistem parse file dengan Papa Parse
3. Validasi data terhadap master data tindakan_laboratorium
4. Generate atau update data di database
5. Trigger auto-calculation
6. Update tampilan

#### Error Handling:
- File tidak valid
- Format CSV salah
- Data tidak ditemukan di master data
- Duplikasi data

### 2. Export Template
#### Flow:
1. User klik "Unduh Template Import"
2. Sistem query master data tindakan_laboratorium
3. Generate CSV dengan format standar
4. Download file

### 3. Export Laporan
#### Flow:
1. User klik "Unduh Laporan"
2. Dialog filter muncul
3. User pilih "Semua Data" atau "Per Jenis Pemeriksaan"
4. Sistem filter data sesuai pilihan
5. Generate CSV dengan 37 kolom lengkap
6. Download file dengan nama dinamis

---

## API dan Fungsi

### 1. Database Functions
```sql
-- Generate initial data
generate_kalkulasi_biaya_laboratorium(p_user_id UUID, p_tahun INTEGER)

-- Populate kalkulasi data
populate_kalkulasi_biaya_laboratorium()

-- Trigger functions
trg_populate_lab_after_change()
trg_populate_lab_on_data_biaya()
trg_populate_lab_on_dbr()
```

### 2. Frontend Functions

#### Data Loading
```typescript
loadData(currentUserId?: string) // Load data from database
updateData() // Update data (refresh)
```

#### Data Manipulation
```typescript
handleManualInput(data: any) // Insert or update data
handleEditRow(row: any) // Edit existing data
handleDeleteRow(row: any) // Delete data
```

#### Import/Export
```typescript
handleImport(e: React.ChangeEvent<HTMLInputElement>) // Import CSV
handleDownloadTemplate() // Download import template
handleDownloadReport() // Download report with filter
```

#### Bahan Management
```typescript
handleOpenBahanFarmasiForm(row: any) // Open bahan form
handleSaveBahanFarmasi(bahanData: any) // Add single bahan
handleSaveAllBahanFarmasi() // Save all bahan to database
handleRemoveBahanFarmasi(index: number) // Remove bahan from list
```

---

## User Interface

### 1. Halaman Utama
- **Header**: Judul dan deskripsi
- **Toolbar**: 
  - Input tahun
  - Tombol "Unduh Template Import"
  - Tombol "Unduh Laporan"
  - Tombol "Import Data"
  - Tombol "Input Manual"
- **Status Indicator**: 
  - Loading state
  - Import progress
  - Auto-calculation status
  - System status
- **Data Table**: 
  - 17 kolom tampilan
  - Sortable columns
  - Action buttons (Update Bahan, Edit, Hapus)

### 2. Dialog Forms

#### a. Dialog Input Manual
Fields:
- Jenis Pemeriksaan (required)
- Jumlah (required)
- Waktu Pemeriksaan (required)
- Profesionalisme (1-4)
- Tingkat Kesulitan (1-5)

#### b. Dialog Update Bahan Farmasi
Components:
- Search autocomplete
- Bahan form (nama, satuan, harga, qty)
- List bahan yang sudah ditambahkan
- Tombol hapus per bahan
- Tombol simpan semua

#### c. Dialog Filter Laporan
Options:
- Radio button: Semua Data / Per Jenis Pemeriksaan
- Dropdown jenis pemeriksaan (conditional)
- Tombol Unduh Laporan

### 3. Komponen UI

#### Table Columns (Display)
1. Kode
2. Kode Unit Kerja
3. Jenis Pemeriksaan
4. Jumlah
5. Waktu (menit)
6. Prof
7. Kesulitan
8. HK Waktu
9. Alokasi Waktu
10. Hasil Kali
11. Alokasi HK
12. Bahan Rp
13. Biaya Tidak Langsung Terdistribusi
14. Unit Cost
15. Update Bahan (action)
16. Edit (action)
17. Hapus (action)

#### Status Indicators
- 🔄 Loading... (saat load data)
- 📤 Mengimpor data... (saat import)
- 🔢 Perhitungan otomatis... (saat auto-calculate)
- ✅ Sistem perhitungan otomatis aktif (saat idle)

---

## Row Level Security (RLS)

### Policies
```sql
-- Enable insert for authenticated users
CREATE POLICY "Enable insert for authenticated users"
ON kalkulasi_biaya_laboratorium FOR INSERT
TO authenticated WITH CHECK (true);

-- Enable select for authenticated users
CREATE POLICY "Enable select for authenticated users"
ON kalkulasi_biaya_laboratorium FOR SELECT
TO authenticated USING (true);

-- Enable update for authenticated users
CREATE POLICY "Enable update for authenticated users"
ON kalkulasi_biaya_laboratorium FOR UPDATE
TO authenticated USING (true) WITH CHECK (true);

-- Enable delete for authenticated users
CREATE POLICY "Enable delete for authenticated users"
ON kalkulasi_biaya_laboratorium FOR DELETE
TO authenticated USING (true);
```

---

## Relasi Tabel

### 1. Tindakan Laboratorium (Master Data)
```
kalkulasi_biaya_laboratorium.kode -> tindakan_laboratorium.kode
kalkulasi_biaya_laboratorium.jenis_pemeriksaan -> tindakan_laboratorium.nama
```

### 2. Data Barang Farmasi
```
kalkulasi_biaya_laboratorium.bahan_pemeriksaan[].kode_barang -> data_barang_farmasi.kode_barang
```

### 3. Data Biaya
```
kalkulasi_biaya_laboratorium.kode_unit_kerja = data_biaya.kode_unit_kerja (UK038)
```

### 4. Distribusi Biaya Rekap
```
kalkulasi_biaya_laboratorium.kode_unit_kerja = distribusi_biaya_rekap.kode_unit_kerja (UK038)
```

---

## Workflow Perhitungan

### 1. Input Data
```
User Input -> Validate -> Insert/Update Database
```

### 2. Auto Calculation (Database Trigger)
```
Database Change -> Trigger Fired -> Calculate Fields:
  - hasil_kali_waktu
  - dasar_alokasi_waktu
  - hasil_kali
  - dasar_alokasi_hasil_kali
  - biaya_bahan_pemeriksaan_numeric
  - All cost fields
  - unit_cost_per_pemeriksaan
```

### 3. Realtime Update (Frontend)
```
Database Change -> Realtime Listener -> Update State -> Refresh UI
```

---

## Best Practices

### 1. Data Input
- Selalu validasi data terhadap master data
- Gunakan template CSV untuk import massal
- Periksa data sebelum save
- Gunakan autocomplete untuk menghindari typo

### 2. Performance
- Event-driven updates (bukan polling)
- Lazy loading untuk data besar
- Cache data di localStorage
- Minimize database queries

### 3. Error Handling
- Validasi input di frontend
- Toast notification untuk feedback
- Console logging untuk debugging
- Try-catch untuk semua async operations

### 4. Data Integrity
- Database triggers untuk consistency
- Foreign key constraints
- RLS policies untuk security
- Backup data secara berkala

---

## Troubleshooting

### 1. Data Tidak Tampil
- Periksa console untuk error
- Periksa user session
- Periksa RLS policies
- Refresh halaman

### 2. Import Gagal
- Periksa format CSV
- Validasi data terhadap master data
- Periksa size file
- Periksa encoding (UTF-8)

### 3. Kalkulasi Tidak Update
- Periksa database triggers
- Periksa realtime listener
- Periksa console untuk error
- Manual refresh data

### 4. Export Laporan Gagal
- Periksa data tersedia
- Periksa filter yang dipilih
- Periksa browser permission
- Periksa space disk

---

## Version History

### Version 1.0 (Current)
- ✅ Input manual data
- ✅ Import CSV
- ✅ Edit dan delete data
- ✅ Auto-calculation dengan database triggers
- ✅ Realtime updates event-driven
- ✅ Update bahan farmasi
- ✅ Export laporan dengan filter
- ✅ 37 kolom biaya lengkap
- ✅ Row Level Security

### Future Enhancements
- [ ] Export ke Excel format
- [ ] Grafik analisis biaya
- [ ] Perbandingan antar periode
- [ ] Export PDF
- [ ] Batch operations
- [ ] Advanced filtering
- [ ] Data validation rules
- [ ] Audit trail

---

## Contact & Support

Untuk pertanyaan atau dukungan teknis, silakan hubungi tim development atau dokumentasi lengkap dapat dilihat di repository project.

---

**Dokumentasi ini dibuat pada:** 30 September 2025  
**Versi:** 1.0  
**Status:** Production Ready
