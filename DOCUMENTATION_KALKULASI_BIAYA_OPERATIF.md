# 📋 DOKUMENTASI KALKULASI BIAYA OPERATIF

## 🎯 OVERVIEW

Sistem kalkulasi biaya untuk tindakan operatif yang mengacu pada tabel `tindakan_operatif` dengan 213 tindakan operasi. Sistem ini menggantikan submenu "Kalkulasi Biaya Operatif" yang sebelumnya masih dalam pengembangan.

**Status**: ✅ SIAP PRODUCTION

---

## 📊 STRUKTUR DATABASE

### 1. Tabel `tindakan_operatif` (Master Data)

**Jumlah Data**: 213 tindakan operatif

**Struktur:**
```sql
CREATE TABLE tindakan_operatif (
    id uuid PRIMARY KEY,
    kode_jenis smallint DEFAULT 3 CHECK (kode_jenis IN (1, 2, 3)),
    kode_operator_spesialistik varchar,
    nama_operator_spesialistik varchar,
    kode_tindakan_operatif varchar UNIQUE,
    nama_tindakan_operatif varchar,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);
```

**Contoh Data:**
| Kode Jenis | Kode Operator | Nama Operator | Kode Tindakan | Nama Tindakan |
|------------|---------------|---------------|---------------|---------------|
| 3 | 3.01 | Bedah Mulut | 3.01.001 | ODONTECTOMY |
| 3 | 3.01 | Bedah Mulut | 3.01.002 | INCISI DRAINAGE + DEBRIDEMENT |
| 3 | 3.01 | Bedah Mulut | 3.01.003 | WIDE EXSISI TUMOR |

---

### 2. Tabel `kalkulasi_biaya_operatif` (Kalkulasi Biaya)

**Total Kolom**: 47 kolom

**Unit Kerja Rujukan**: UK054 - VK (Kamar Operasi)

**Struktur Kolom:**

| Kategori | Kolom | Tipe | Keterangan |
|----------|-------|------|------------|
| **Primary Key** | id | uuid | Auto-generated |
| **Foreign Key** | user_id | uuid | Referensi ke auth.users |
| **Identifikasi** | tahun | integer | Tahun kalkulasi |
| | kode_jenis | smallint | 1, 2, atau 3 |
| | kode_operator_spesialistik | text | Kode operator (3.01, 3.02, dst) |
| | nama_operator_spesialistik | text | Nama operator (Bedah Mulut, dll) |
| | kode | text | Kode tindakan (3.01.001, dst) |
| | jenis_pemeriksaan | text | Nama tindakan operatif |
| **Bahan** | bahan_pemeriksaan | jsonb | Array bahan dalam format JSON |
| | biaya_bahan_pemeriksaan_numeric | integer | Total biaya bahan (auto-calculated) |
| **Input Manual** | jumlah | integer | Jumlah tindakan per tahun |
| | waktu_pemeriksaan | integer | Waktu dalam menit |
| | profesionalisme | integer | Level 1-4 |
| | tingkat_kesulitan | integer | Level 1-5 |
| **Auto-Calculated** | hasil_kali | integer | jumlah × prof × kesulitan × waktu |
| | hasil_kali_waktu | numeric | waktu × jumlah |
| | dasar_alokasi_waktu | numeric | Proporsi alokasi (6 decimal) |
| | dasar_alokasi_hasil_kali | numeric | Proporsi alokasi (6 decimal) |
| **Biaya (24 fields)** | biaya_gaji_tunjangan | bigint | Dari data_biaya UK054 |
| | biaya_jasa_pelayanan | bigint | Selalu 0 |
| | biaya_obat | bigint | Dari data_biaya UK054 |
| | ... | ... | 20 kolom biaya lainnya |
| | biaya_tidak_langsung_terdistribusi | bigint | Dari distribusi uk054_vk |
| **Generated Column** | unit_cost_per_pemeriksaan | bigint | SUM semua 25 biaya |
| **Timestamps** | created_at, updated_at | timestamptz | Auto-managed |

---

## ⚙️ FUNGSI DATABASE

### 1. `create_kalkulasi_biaya_operatif_data(p_tahun, p_user_id)`

**Tujuan:** Generate data awal dari tabel tindakan_operatif (213 tindakan)

**Usage:**
```sql
SELECT create_kalkulasi_biaya_operatif_data(2025, auth.uid());
```

**Proses:**
- Insert semua tindakan dari tindakan_operatif
- Set default values untuk jumlah, waktu, profesionalisme, tingkat_kesulitan = 0
- Skip jika data sudah ada

---

### 2. `fix_dasar_alokasi_operatif(p_tahun, p_user_id)`

**Tujuan:** Hitung dasar_alokasi_waktu dan dasar_alokasi_hasil_kali

**Usage:**
```sql
SELECT fix_dasar_alokasi_operatif(2025, auth.uid());
```

**Rumus:**
- `dasar_alokasi_waktu` = hasil_kali_waktu ÷ SUM(hasil_kali_waktu) [6 decimal]
- `dasar_alokasi_hasil_kali` = hasil_kali ÷ SUM(hasil_kali) [6 decimal]

---

### 3. `fix_biaya_calculation_operatif(p_tahun, p_user_id)`

**Tujuan:** Hitung semua kolom biaya

**Usage:**
```sql
SELECT fix_biaya_calculation_operatif(2025, auth.uid());
```

**Sumber Data:**
- `data_biaya` WHERE kode_unit_kerja = 'UK054' (VK - Kamar Operasi)
- `distribusi_biaya_rekap` kolom `uk054_vk`

**Rumus:**
- **biaya_gaji_tunjangan**: data_biaya × (dasar_alokasi_hasil_kali ÷ jumlah)
- **biaya_jasa_pelayanan**: 0 (selalu dikosongkan)
- **biaya operasional (20 kolom)**: data_biaya × (dasar_alokasi_waktu ÷ jumlah)
- **biaya_tidak_langsung**: distribusi.uk054_vk × (dasar_alokasi_waktu ÷ jumlah)

---

### 4. Triggers (Auto-Calculated)

**a. `trigger_calculate_hasil_kali_operatif`**
- **When**: BEFORE INSERT OR UPDATE (jumlah, waktu, prof, kesulitan)
- **Action**: Auto-calculate hasil_kali dan hasil_kali_waktu

**b. `trigger_calculate_biaya_bahan_operatif`**
- **When**: BEFORE INSERT OR UPDATE (bahan_pemeriksaan)
- **Action**: Auto-calculate biaya_bahan_pemeriksaan_numeric from JSON

**c. `update_kalkulasi_biaya_operatif_timestamp`**
- **When**: BEFORE UPDATE
- **Action**: Auto-update updated_at timestamp

---

## 🎨 HALAMAN APLIKASI

### Path: `/kalkulasi-biaya-operatif`

**Menu**: Unit Pelayanan → Kalkulasi Biaya Operatif

**Fitur:**

✅ **Auto-Generate Data**
- 213 tindakan operatif dari tabel master
- Dikelompokkan berdasarkan operator spesialistik
- Kode format: 3.01.001, 3.01.002, dst.

✅ **Filter Operator**
- Dropdown untuk filter berdasarkan kode_operator_spesialistik
- Contoh: 3.01 - Bedah Mulut, 3.02 - Bedah Saraf, dst.
- Opsi "Semua Operator" untuk lihat semua

✅ **Import Data CSV**
- Template include: Kode Tindakan, Nama, Kode Operator, Nama Operator
- Import: Jumlah, Waktu, Profesionalisme, Tingkat Kesulitan
- Auto-calculation setelah import

✅ **Update Bahan Pemeriksaan**
- Form interaktif untuk tambah bahan farmasi
- Pilih dari data master barang farmasi
- Auto-calculate biaya bahan

✅ **Display Table**
- Kolom utama: Kode, Operator, Nama Tindakan, Jumlah, Waktu, Prof, Kesulitan
- Kolom biaya: Bahan Rp, Unit Cost
- Responsive & scrollable

---

## 🔄 WORKFLOW PENGGUNAAN

### Step 1: Buka Halaman
```
Unit Pelayanan → Kalkulasi Biaya Operatif
```

### Step 2: Data Auto-Generated
```
- Sistem otomatis cek data untuk user & tahun
- Jika belum ada, generate 213 tindakan dari tindakan_operatif
- Loading indicator ditampilkan
```

### Step 3: Filter Data (Optional)
```
- Pilih operator spesialistik dari dropdown
- Contoh: "3.01 - Bedah Mulut"
- Table hanya tampilkan tindakan operator tersebut
```

### Step 4: Import Data
```
1. Klik "Unduh Template Import"
2. Isi kolom: Jumlah, Waktu Pemeriksaan, Profesionalisme, Tingkat Kesulitan
3. Klik "Import Data" dan pilih file CSV
4. Sistem akan:
   - Update data untuk setiap tindakan
   - Hitung dasar alokasi
   - Hitung semua biaya
   - Refresh tampilan
```

### Step 5: Update Bahan (Optional)
```
1. Klik tombol "Update Bahan" pada baris tindakan
2. Pilih bahan dari data master farmasi
3. Tambahkan qty dan harga
4. Klik "Simpan Semua Bahan"
5. Biaya bahan akan auto-calculated
```

### Step 6: Lihat Hasil
```
- Unit Cost ditampilkan di kolom terakhir
- Unit Cost = SUM(semua 25 kolom biaya)
- Format: Rp xxx,xxx (dengan thousand separator)
```

---

## 📝 FORMAT CSV IMPORT

**Headers:**
```
Kode Tindakan | Nama Tindakan | Kode Operator | Nama Operator | Jumlah | Waktu Pemeriksaan | Profesionalisme (1-4) | Tingkat Kesulitan (1-5)
```

**Contoh Data:**
```csv
3.01.001,ODONTECTOMY,3.01,Bedah Mulut,50,30,3,2
3.01.002,INCISI DRAINAGE + DEBRIDEMENT,3.01,Bedah Mulut,35,45,3,3
```

---

## 🧮 RUMUS PERHITUNGAN

### 1. Hasil Kali (Auto via Trigger)
```
hasil_kali_waktu = waktu_pemeriksaan × jumlah
hasil_kali = jumlah × profesionalisme × tingkat_kesulitan × waktu_pemeriksaan
```

### 2. Dasar Alokasi (Via RPC Function)
```
dasar_alokasi_waktu = hasil_kali_waktu ÷ SUM(hasil_kali_waktu semua tindakan)
dasar_alokasi_hasil_kali = hasil_kali ÷ SUM(hasil_kali semua tindakan)
```

### 3. Distribusi Biaya (Via RPC Function)

**Biaya SDM:**
```
biaya_gaji_tunjangan = data_biaya.biaya_gaji_tunjangan × (dasar_alokasi_hasil_kali ÷ jumlah)
biaya_jasa_pelayanan = 0
```

**Biaya Operasional (20 kolom):**
```
biaya_X = data_biaya.biaya_X × (dasar_alokasi_waktu ÷ jumlah)
```

**Biaya Tidak Langsung:**
```
biaya_tidak_langsung = distribusi_biaya_rekap.uk054_vk × (dasar_alokasi_waktu ÷ jumlah)
```

### 4. Unit Cost (Auto via Generated Column)
```
unit_cost_per_pemeriksaan = SUM(semua 25 kolom biaya)
```

---

## 🗺️ RELASI TABEL

```
kalkulasi_biaya_operatif
├── user_id → auth.users(id)
├── kode → tindakan_operatif.kode_tindakan_operatif
├── kode_operator_spesialistik → tindakan_operatif.kode_operator_spesialistik
├── biaya_* → data_biaya (WHERE kode_unit_kerja = 'UK054')
└── biaya_tidak_langsung → distribusi_biaya_rekap.uk054_vk
```

---

## 📊 STATISTIK

- **Total Tindakan Operatif**: 213 tindakan
- **Total Kolom Tabel**: 47 kolom
- **Total Fungsi**: 9 functions (5 RPC + 4 Triggers)
- **Unit Kerja Rujukan**: UK054 - VK (Kamar Operasi)
- **Distribusi Biaya**: uk054_vk

---

## ✅ FITUR UNGGULAN

### 1. Filter Berdasarkan Operator
- Dropdown untuk filter tindakan berdasarkan operator spesialistik
- Contoh: Bedah Mulut, Bedah Saraf, Bedah Digestif, dll.
- Memudahkan manajemen data per spesialisasi

### 2. Auto-Calculation System
- Trigger otomatis untuk hasil_kali dan biaya_bahan
- RPC function untuk dasar alokasi dan distribusi biaya
- Generated column untuk unit cost
- Tidak perlu kalkulasi manual!

### 3. Import/Export CSV
- Template lengkap dengan semua operator
- Bulk import untuk efisiensi
- Progress indicator saat import
- Auto-calculation setelah import selesai

### 4. Update Bahan Interaktif
- Form modal untuk manage bahan per tindakan
- Pilih dari data master farmasi
- Add/Remove bahan dinamis
- Auto-calculate total biaya bahan

---

## 🎯 PERBEDAAN DENGAN UNIT LAIN

| Fitur | Radiologi | Operatif | Keterangan |
|-------|-----------|----------|------------|
| **Jumlah Tindakan** | 86 | 213 | Operatif lebih banyak |
| **Kode Format** | Rad.001 | 3.01.001 | Operatif lebih detail |
| **Operator** | Tidak ada | Ada (3.01, 3.02, dst) | Unique feature |
| **Filter** | Tidak ada | Filter by operator | Unique feature |
| **Unit Kerja** | UK039 | UK054 (VK) | Berbeda |
| **Rumus Kalkulasi** | Sama | Sama | Konsisten |

---

## 🚀 QUICK START

### Untuk User:
1. Login ke aplikasi
2. Navigate: **Unit Pelayanan** → **Kalkulasi Biaya Operatif**
3. Pilih tahun (default: tahun berjalan)
4. Data otomatis ter-generate (213 tindakan)
5. Filter operator jika diperlukan
6. Download template → Isi data → Import
7. Lihat hasil Unit Cost

### Untuk Developer:
```sql
-- 1. Generate data
SELECT create_kalkulasi_biaya_operatif_data(2025, 'user-id');

-- 2. Update sample data
UPDATE kalkulasi_biaya_operatif
SET jumlah = 50, waktu_pemeriksaan = 30, profesionalisme = 3, tingkat_kesulitan = 2
WHERE kode = '3.01.001' AND tahun = 2025;

-- 3. Calculate dasar alokasi
SELECT fix_dasar_alokasi_operatif(2025, 'user-id');

-- 4. Calculate biaya
SELECT fix_biaya_calculation_operatif(2025, 'user-id');

-- 5. View results
SELECT kode, jenis_pemeriksaan, unit_cost_per_pemeriksaan
FROM kalkulasi_biaya_operatif
WHERE tahun = 2025 AND user_id = 'user-id'
ORDER BY kode;
```

---

## 📋 TROUBLESHOOTING

### Problem: Data tidak muncul
**Solution:**
```
- Pastikan sudah login
- Cek tahun yang dipilih
- Refresh halaman
- Cek console untuk error
```

### Problem: Import gagal
**Solution:**
```
- Cek format CSV (harus sesuai template)
- Pastikan Kode Tindakan valid (ada di tindakan_operatif)
- Cek nilai Profesionalisme (1-4) dan Kesulitan (1-5)
```

### Problem: Unit Cost = 0
**Solution:**
```
- Pastikan data biaya untuk UK054 sudah diinput
- Pastikan distribusi biaya rekap sudah dihitung
- Run fix_biaya_calculation_operatif()
```

---

## 🎯 KESIMPULAN

✅ **Sistem Kalkulasi Biaya Operatif SIAP DIGUNAKAN**

- Tabel `kalkulasi_biaya_operatif` dengan 47 kolom
- Mengacu pada `tindakan_operatif` (213 tindakan)
- 9 Functions & Triggers untuk auto-calculation
- Frontend lengkap dengan filter operator
- Import/Export CSV support
- Update bahan pemeriksaan interaktif
- Unit Cost auto-calculated
- RLS policies aktif

**Menggantikan submenu lama "Kalkulasi Biaya Operatif" yang sebelumnya masih placeholder!**

---

*Last Updated: 2025-10-01*
*Unit Kerja: UK054 - VK (Kamar Operasi)*
*Total Tindakan: 213 operatif procedures*

