# Dokumentasi Produk Layanan

## Deskripsi

Halaman **Produk Layanan** adalah fitur baru dalam aplikasi Unit Cost RS yang memungkinkan pengguna untuk mengelola data produk layanan rumah sakit dengan referensi otomatis ke **Rekapitulasi Unit Cost**. Fitur ini mendukung input data melalui form manual, import CSV, dan edit data.

## Fitur Utama

### 1. Tabel Database: `produk_layanan`

#### Struktur Kolom

| Kolom | Tipe Data | Keterangan |
|-------|-----------|------------|
| `id` | UUID | Primary key (auto-generated) |
| `user_id` | UUID | Foreign key ke auth.users |
| `tahun` | INTEGER | Tahun periode (default: 2025) |
| `jenis` | TEXT | Jenis layanan: 'rawat jalan' atau 'rawat inap' |
| `inacbg` | TEXT | Kode INA-CBG |
| `grouper` | TEXT | Grouper INA-CBG |
| `inacbgs` | TEXT | INA-CBG's |
| `diaglist` | TEXT | Daftar diagnosa |
| `diagnosa_1` s/d `diagnosa_5` | TEXT | Diagnosa 1-5 |
| `proclist` | TEXT | Daftar prosedur |
| `proc_1` s/d `proc_5` | TEXT | Prosedur 1-5 |
| `los` | INTEGER | Length of Stay (lama hari rawat) |
| `spesialisasi_dokter` | TEXT | Spesialisasi dokter |
| `nama_dokter` | TEXT | Nama dokter |
| `kode_dokter` | TEXT | Kode dokter |
| `tindakan` | JSONB | Array tindakan medis dengan unit cost + BHP |
| `ibs` | JSONB | Array tindakan IBS/Operatif |
| `laboratorium` | JSONB | Array pemeriksaan laboratorium |
| `radiologi` | JSONB | Array pemeriksaan radiologi |
| `farmasi` | JSONB | Array item farmasi |
| `kamar_akomodasi` | JSONB | Array kamar akomodasi |
| `visite` | JSONB | Array visite dokter |
| `konsultasi` | JSONB | Array konsultasi |
| `total_biaya` | BIGINT | Total biaya (auto-calculated) |
| `created_at` | TIMESTAMPTZ | Timestamp pembuatan |
| `updated_at` | TIMESTAMPTZ | Timestamp update |

#### Format JSONB untuk Layanan

Setiap field layanan (tindakan, ibs, laboratorium, dll.) menggunakan format JSONB array:

```json
[
  {
    "kode_tindakan": "T.001",
    "nama_tindakan": "Konsultasi Dokter Umum",
    "unit_cost": 50000,
    "biaya_bhp": 10000,
    "qty": 1,
    "subtotal": 60000
  },
  {
    "kode_tindakan": "T.002",
    "nama_tindakan": "Pemeriksaan Fisik Lengkap",
    "unit_cost": 75000,
    "biaya_bhp": 15000,
    "qty": 1,
    "subtotal": 90000
  }
]
```

#### Auto-Calculation

**Total Biaya** dihitung otomatis menggunakan trigger `calculate_total_biaya_trigger`:
- Menjumlahkan semua `subtotal` dari setiap field layanan
- Update otomatis saat data di-insert atau di-update
- Formula: `SUM(subtotal dari semua array layanan)`

### 2. Fitur Input Data

#### a. Input Manual

1. Klik tombol **"Tambah Data"**
2. Isi form dengan 3 tab:
   - **Informasi Dasar**: Jenis, LOS, INA-CBG, Grouper, Data Dokter
   - **Diagnosa & Prosedur**: Diaglist, Diagnosa 1-5, Proclist, Prosedur 1-5
   - **Layanan**: Pilih layanan dari rekapitulasi unit cost

3. Pada tab **Layanan**, klik tombol "Tambah [Nama Layanan]" untuk:
   - Memilih layanan dari dropdown (data dari `rekapitulasi_unit_cost`)
   - Melihat Unit Cost dan Biaya BHP otomatis
   - Mengatur quantity
   - Melihat subtotal otomatis: `(Unit Cost + BHP) × Quantity`

4. Klik **"Simpan"** untuk menyimpan data

#### b. Import dari CSV

1. Klik tombol **"Import CSV"**
2. Pilih file CSV dengan format sesuai `template_produk_layanan.csv`
3. Sistem akan membaca dan meng-import data ke database
4. Kolom layanan (tindakan, lab, radiologi, dll.) akan ter-initialize sebagai array kosong
5. Setelah import, edit data untuk menambahkan layanan

**Template CSV:**
```csv
jenis,inacbg,grouper,inacbgs,diaglist,diagnosa_1,diagnosa_2,diagnosa_3,diagnosa_4,diagnosa_5,proclist,proc_1,proc_2,proc_3,proc_4,proc_5,los,spesialisasi_dokter,nama_dokter,kode_dokter,total_biaya
rawat jalan,A-4-10-I,Mild,A-4-10-I,I10,Hipertensi Esensial,,,,,Z00.0,Pemeriksaan Medis Umum,,,,1,Spesialis Penyakit Dalam,Dr. Andi,DK001,0
```

#### c. Edit Data

1. Klik tombol **Edit** (ikon pensil) pada baris data
2. Form edit akan terbuka dengan data yang sudah ada
3. Ubah data sesuai kebutuhan
4. Pada tab Layanan, bisa:
   - Menambah layanan baru
   - Menghapus layanan yang sudah ada
5. Klik **"Simpan"** untuk menyimpan perubahan

#### d. Export ke CSV

1. Klik tombol **"Export CSV"**
2. Sistem akan men-download file CSV dengan nama `produk_layanan_[tahun].csv`
3. File berisi semua data produk layanan untuk tahun yang dipilih

### 3. Relasi dengan Rekapitulasi Unit Cost

Komponen **ServiceSelector** secara otomatis mengambil data dari tabel `rekapitulasi_unit_cost` dengan filter:

| Jenis Layanan | Filter Query | Keterangan |
|---------------|--------------|------------|
| **Tindakan** | `sumber_tabel IN ('kalkulasi_tindakan_rawat_jalan', 'kalkulasi_tindakan_inap')` | Tindakan rawat jalan & inap |
| **IBS** | `sumber_tabel = 'kalkulasi_biaya_operatif'` | Tindakan operatif |
| **Laboratorium** | `sumber_tabel = 'kalkulasi_biaya_laboratorium'` | Pemeriksaan laboratorium |
| **Radiologi** | `sumber_tabel = 'kalkulasi_biaya_radiologi'` | Pemeriksaan radiologi |
| **Farmasi** | `kode_unit_kerja = 'UK040'` | Unit Farmasi |
| **Kamar Akomodasi** | Custom query (future) | Akomodasi rawat inap |
| **Visite** | `kode_unit_kerja = 'UK055'` | Visite dokter |
| **Konsultasi** | Custom filter (future) | Konsultasi dokter |

Setiap layanan menampilkan:
- **Kode Tindakan**
- **Nama Tindakan**
- **Unit Cost** (dari `unit_cost_per_tindakan`)
- **Biaya BHP** (dari `biaya_bahan`)
- **Subtotal otomatis**: `(Unit Cost + BHP) × Quantity`

### 4. Menu Navigasi

Menu **Produk Layanan** ditambahkan di sidebar setelah **Rekapitulasi Unit Cost**:
- Icon: ShoppingCart (🛒)
- URL: `/produk-layanan`
- Position: Setelah "Rekapitulasi Unit Cost"

### 5. Row Level Security (RLS)

Tabel `produk_layanan` dilindungi dengan RLS policies:
- **SELECT**: User hanya bisa melihat data miliknya (`user_id = auth.uid()`)
- **INSERT**: User hanya bisa insert dengan `user_id` miliknya
- **UPDATE**: User hanya bisa update data miliknya
- **DELETE**: User hanya bisa delete data miliknya

## Komponen Frontend

### 1. ProdukLayanan.tsx (Main Page)

**Path**: `src/pages/ProdukLayanan.tsx`

**Fitur**:
- Tabel data produk layanan
- Filter tahun
- Tombol Tambah Data, Import CSV, Export CSV
- Dialog form dengan 3 tabs (Informasi Dasar, Diagnosa & Prosedur, Layanan)
- Auto-format currency untuk total biaya
- Konfirmasi delete

### 2. ServiceSelector.tsx (Component)

**Path**: `src/components/produk-layanan/ServiceSelector.tsx`

**Props**:
```typescript
interface ServiceSelectorProps {
  label: string;                    // Label komponen
  value: ServiceItem[];              // Array layanan yang dipilih
  onChange: (value: ServiceItem[]) => void; // Callback saat perubahan
  tahun: number;                     // Tahun untuk filter data
  filterType: string;                // Type filter ('tindakan', 'ibs', 'laboratorium', dll)
}
```

**Fitur**:
- Dropdown untuk memilih layanan dari rekapitulasi unit cost
- Input quantity
- Preview subtotal otomatis
- Tabel layanan yang sudah dipilih
- Tombol hapus per item
- Total biaya semua layanan

## Cara Penggunaan

### Skenario 1: Input Manual Produk Layanan Rawat Jalan

1. Buka halaman **Produk Layanan**
2. Pilih tahun (misal: 2025)
3. Klik **"Tambah Data"**
4. Tab **Informasi Dasar**:
   - Jenis: Rawat Jalan
   - INA-CBG: A-4-10-I
   - Grouper: Mild
   - LOS: 1
   - Nama Dokter: Dr. Andi
   - Spesialisasi: Spesialis Penyakit Dalam
5. Tab **Diagnosa & Prosedur**:
   - Diagnosa 1: Hipertensi Esensial (I10)
   - Prosedur 1: Pemeriksaan Medis Umum (Z00.0)
6. Tab **Layanan**:
   - **Tindakan**: 
     - Tambah: Konsultasi Dokter Umum (T.001) - Qty: 1
     - Subtotal otomatis: Rp 60.000
   - **Laboratorium**:
     - Tambah: Pemeriksaan Darah Lengkap (Lab.001) - Qty: 1
     - Subtotal otomatis: Rp 150.000
   - **Farmasi**:
     - Tambah: Obat Hipertensi (FARM.001) - Qty: 1
     - Subtotal otomatis: Rp 50.000
7. Klik **"Simpan"**
8. Total Biaya otomatis terhitung: **Rp 260.000**

### Skenario 2: Import Data dari CSV

1. Buka halaman **Produk Layanan**
2. Download template: `template_produk_layanan.csv`
3. Isi data di Excel sesuai template
4. Klik **"Import CSV"**
5. Pilih file yang sudah diisi
6. Data ter-import ke database
7. Edit data untuk menambahkan layanan (tindakan, lab, radiologi, dll.)

### Skenario 3: Edit dan Tambah Layanan

1. Pada tabel data, klik tombol **Edit** (ikon pensil)
2. Form edit terbuka dengan data yang ada
3. Buka tab **Layanan**
4. Tambah layanan baru:
   - Radiologi: Foto Thorax (Rad.001) - Qty: 1
5. Klik **"Simpan"**
6. Total biaya otomatis terupdate

## Database Triggers dan Functions

### 1. update_produk_layanan_timestamp()

**Tipe**: Trigger Function
**Waktu**: BEFORE UPDATE
**Fungsi**: Mengupdate kolom `updated_at` dengan timestamp saat ini

### 2. calculate_total_biaya_produk_layanan()

**Tipe**: Trigger Function
**Waktu**: BEFORE INSERT OR UPDATE
**Fungsi**: 
- Iterate semua array layanan (tindakan, ibs, laboratorium, dll.)
- Sum semua `subtotal` dari setiap item
- Set nilai `total_biaya` dengan hasil penjumlahan

**Pseudocode**:
```sql
total_biaya := 
  SUM(tindakan[].subtotal) +
  SUM(ibs[].subtotal) +
  SUM(laboratorium[].subtotal) +
  SUM(radiologi[].subtotal) +
  SUM(farmasi[].subtotal) +
  SUM(kamar_akomodasi[].subtotal) +
  SUM(visite[].subtotal) +
  SUM(konsultasi[].subtotal)
```

## Keunggulan Fitur

1. **Multiple Selection**: Bisa memilih lebih dari satu layanan untuk setiap kategori
2. **Auto-Calculation**: Total biaya dihitung otomatis dari semua layanan
3. **Real-time Preview**: Lihat subtotal langsung saat memilih layanan
4. **Referensi Unit Cost**: Data unit cost diambil langsung dari rekapitulasi
5. **Flexible Input**: Support manual entry, import CSV, dan edit
6. **Export Ready**: Bisa export data ke CSV untuk reporting
7. **User Isolation**: Data terisolasi per user dengan RLS

## Roadmap / Future Enhancement

1. **Tambah Filter Kelas Akomodasi**: Filter akomodasi berdasarkan kelas (VVIP, VIP, I, II, III)
2. **Preset Produk Layanan**: Template produk layanan yang bisa di-clone
3. **Batch Import Layanan**: Import layanan dari CSV ke produk layanan yang sudah ada
4. **Report/Print**: Generate PDF report untuk produk layanan
5. **Analisis Margin**: Hitung margin profit dari unit cost vs tarif INA-CBG
6. **Integration dengan Skenario Tarif**: Auto-populate skenario tarif dari produk layanan
7. **History/Audit**: Track perubahan data produk layanan

## Troubleshooting

### Problem: Layanan tidak muncul di dropdown

**Solusi**:
1. Pastikan data sudah ada di tabel `rekapitulasi_unit_cost` untuk tahun yang dipilih
2. Cek apakah user sudah melakukan kalkulasi unit cost untuk layanan terkait
3. Verifikasi `sumber_tabel` di rekapitulasi sesuai dengan filter yang digunakan

### Problem: Total biaya tidak terupdate otomatis

**Solusi**:
1. Trigger `calculate_total_biaya_trigger` harus aktif
2. Format JSONB layanan harus sesuai dengan yang didefinisikan
3. Pastikan field `subtotal` ada di setiap item layanan

### Problem: Import CSV gagal

**Solusi**:
1. Pastikan format CSV sesuai template
2. Cek encoding file (harus UTF-8)
3. Pastikan tidak ada karakter special di delimiter (koma)
4. Validasi data type (los dan total_biaya harus angka)

## File-file Terkait

1. **Migration SQL**: `migrations/create_produk_layanan_table_fixed.sql`
2. **Main Page**: `src/pages/ProdukLayanan.tsx`
3. **Service Selector Component**: `src/components/produk-layanan/ServiceSelector.tsx`
4. **Sidebar Navigation**: `src/components/SidebarNav.tsx`
5. **App Routes**: `src/App.tsx`
6. **Template CSV**: `template_produk_layanan.csv`
7. **Documentation**: `DOKUMENTASI_PRODUK_LAYANAN.md` (file ini)

---

**Dibuat**: Januari 2025
**Versi**: 1.0
**Status**: ✅ Production Ready

