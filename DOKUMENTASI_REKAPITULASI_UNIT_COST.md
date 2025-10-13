# Dokumentasi Tabel Rekapitulasi Unit Cost

## Deskripsi
Tabel `rekapitulasi_unit_cost` adalah tabel rekapitulasi yang mengkonsolidasikan data unit cost dari berbagai tabel kalkulasi biaya di sistem. Tabel ini secara otomatis akan ter-update ketika data di tabel sumber berubah melalui sistem trigger.

## Struktur Tabel

### Kolom-Kolom

| Kolom | Tipe Data | Nullable | Default | Keterangan |
|-------|-----------|----------|---------|------------|
| `id` | UUID | NO | gen_random_uuid() | Primary key |
| `user_id` | UUID | YES | - | Foreign key ke auth.users |
| `tahun` | INTEGER | NO | - | Tahun periode |
| `kode_jenis` | SMALLINT | YES | - | Kode jenis unit kerja (1=Rawat Jalan, 2=Rawat Inap, 3=Operatif, 4=Non Layanan) |
| `kode_unit_kerja` | TEXT | NO | - | Kode unit kerja dari tabel sumber |
| `nama_unit_kerja` | TEXT | NO | - | Nama unit kerja |
| `kode_operator` | TEXT | YES | - | Kode operator spesialistik (hanya untuk tindakan operatif) |
| `nama_operator` | TEXT | YES | - | Nama operator spesialistik (hanya untuk tindakan operatif) |
| `kode_tindakan` | TEXT | NO | - | Kode tindakan/pemeriksaan |
| `nama_tindakan` | TEXT | NO | - | Nama tindakan/pemeriksaan |
| `biaya_bahan` | BIGINT | YES | 0 | Biaya bahan dari tabel sumber |
| `unit_cost_per_tindakan` | BIGINT | YES | 0 | Unit cost per tindakan dari tabel sumber |
| `sumber_tabel` | TEXT | NO | - | Nama tabel sumber data |
| `created_at` | TIMESTAMPTZ | YES | now() | Waktu pembuatan record |
| `updated_at` | TIMESTAMPTZ | YES | now() | Waktu update terakhir |

### Constraint

- **Primary Key**: `id`
- **Foreign Key**: `user_id` → `auth.users(id)`
- **Check Constraint**: `sumber_tabel` harus salah satu dari:
  - `kalkulasi_biaya_laboratorium`
  - `kalkulasi_biaya_radiologi`
  - `kalkulasi_bdrs`
  - `kalkulasi_tindakan_inap`
  - `kalkulasi_tindakan_rawat_jalan`
  - `kalkulasi_tindakan_operatif`
  - `kalkulasi_biaya_cathlab`

### Index

- `idx_rekapitulasi_unit_cost_user_id` pada kolom `user_id`
- `idx_rekapitulasi_unit_cost_tahun` pada kolom `tahun`
- `idx_rekapitulasi_unit_cost_kode_unit_kerja` pada kolom `kode_unit_kerja`
- `idx_rekapitulasi_unit_cost_sumber_tabel` pada kolom `sumber_tabel`

## Tabel Sumber Data

Tabel rekapitulasi ini mengambil data dari 7 tabel kalkulasi:

### 1. Kalkulasi Biaya Laboratorium
- **Tabel**: `kalkulasi_biaya_laboratorium`
- **Kode Unit Kerja**: UK038 (Laboratorium PK PA)
- **Kolom yang Diambil**:
  - `kode` → `kode_tindakan`
  - `jenis_pemeriksaan` → `nama_tindakan`
  - `biaya_bahan_pemeriksaan_numeric` → `biaya_bahan`
  - `unit_cost_per_pemeriksaan` → `unit_cost_per_tindakan`
- **Catatan**: `kode_operator` dan `nama_operator` = NULL

### 2. Kalkulasi Biaya Radiologi
- **Tabel**: `kalkulasi_biaya_radiologi`
- **Kode Unit Kerja**: UK039 (Radiologi)
- **Kolom yang Diambil**:
  - `kode` → `kode_tindakan`
  - `jenis_pemeriksaan` → `nama_tindakan`
  - `biaya_bahan_pemeriksaan_numeric` → `biaya_bahan`
  - `unit_cost_per_pemeriksaan` → `unit_cost_per_tindakan`
- **Catatan**: `kode_operator` dan `nama_operator` = NULL

### 3. Kalkulasi BDRS
- **Tabel**: `kalkulasi_bdrs`
- **Kode Unit Kerja**: UK044 (BDRS - Bank Darah Rumah Sakit)
- **Kolom yang Diambil**:
  - `kode` → `kode_tindakan`
  - `jenis_pemeriksaan` → `nama_tindakan`
  - `biaya_bahan_pemeriksaan_numeric` → `biaya_bahan`
  - `unit_cost_per_pemeriksaan` → `unit_cost_per_tindakan`
- **Catatan**: `kode_operator` dan `nama_operator` = NULL

### 4. Kalkulasi Tindakan Inap
- **Tabel**: `kalkulasi_tindakan_inap`
- **Kode Unit Kerja**: Berbagai unit kerja rawat inap (kode_jenis = 2)
- **Kolom yang Diambil**:
  - `kode_jenis_tindakan` → `kode_tindakan`
  - `jenis_tindakan` → `nama_tindakan`
  - `biaya_bahan_tindakan` → `biaya_bahan`
  - `unit_cost_tindakan_inap` → `unit_cost_per_tindakan`
- **Catatan**: `kode_operator` dan `nama_operator` = NULL

### 5. Kalkulasi Tindakan Rawat Jalan
- **Tabel**: `kalkulasi_tindakan_rawat_jalan`
- **Kode Unit Kerja**: Berbagai unit kerja rawat jalan (kode_jenis = 1)
- **Kolom yang Diambil**:
  - `kode_jenis_tindakan` → `kode_tindakan`
  - `jenis_tindakan` → `nama_tindakan`
  - `biaya_bahan_tindakan` → `biaya_bahan`
  - `unit_cost_tindakan_rawat_jalan` → `unit_cost_per_tindakan`
- **Catatan**: `kode_operator` dan `nama_operator` = NULL

### 6. Kalkulasi Tindakan Operatif
- **Tabel**: `kalkulasi_biaya_operatif`
- **Kode Unit Kerja**: Berbagai unit kerja operatif (kode_jenis = 3)
- **Kolom yang Diambil**:
  - `kode` → `kode_tindakan`
  - `jenis_pemeriksaan` → `nama_tindakan`
  - `biaya_bahan_pemeriksaan_numeric` → `biaya_bahan`
  - `unit_cost_per_tindakan` → `unit_cost_per_tindakan`
  - `kode_operator_spesialistik` → `kode_operator`
  - `nama_operator_spesialistik` → `nama_operator`
- **Catatan**: **HANYA** tabel ini yang memiliki `kode_operator` dan `nama_operator`

### 7. Kalkulasi Biaya Cathlab
- **Tabel**: `kalkulasi_biaya_cathlab`
- **Kode Unit Kerja**: UK045 (Cathlab)
- **Kolom yang Diambil**:
  - `kode` → `kode_tindakan`
  - `jenis_pemeriksaan` → `nama_tindakan`
  - `biaya_bahan_pemeriksaan_numeric` → `biaya_bahan`
  - `unit_cost_per_tindakan` → `unit_cost_per_tindakan`
- **Catatan**: `kode_operator` dan `nama_operator` = NULL

## Sistem Auto-Sync dengan Trigger

Tabel rekapitulasi ini **secara otomatis** akan ter-update ketika ada perubahan data di tabel sumber melalui sistem trigger.

### Trigger yang Dibuat

| Trigger Name | Tabel Sumber | Event | Waktu |
|--------------|--------------|-------|--------|
| `trigger_sync_rekapitulasi_laboratorium` | `kalkulasi_biaya_laboratorium` | INSERT, UPDATE, DELETE | AFTER |
| `trigger_sync_rekapitulasi_radiologi` | `kalkulasi_biaya_radiologi` | INSERT, UPDATE, DELETE | AFTER |
| `trigger_sync_rekapitulasi_bdrs` | `kalkulasi_bdrs` | INSERT, UPDATE, DELETE | AFTER |
| `trigger_sync_rekapitulasi_tindakan_inap` | `kalkulasi_tindakan_inap` | INSERT, UPDATE, DELETE | AFTER |
| `trigger_sync_rekapitulasi_rawat_jalan` | `kalkulasi_tindakan_rawat_jalan` | INSERT, UPDATE, DELETE | AFTER |
| `trigger_sync_rekapitulasi_operatif` | `kalkulasi_biaya_operatif` | INSERT, UPDATE, DELETE | AFTER |
| `trigger_sync_rekapitulasi_cathlab` | `kalkulasi_biaya_cathlab` | INSERT, UPDATE, DELETE | AFTER |

### Cara Kerja Trigger

1. Ketika ada **INSERT**, **UPDATE**, atau **DELETE** di salah satu tabel sumber
2. Trigger akan memanggil function `trigger_sync_rekapitulasi_unit_cost()`
3. Function akan memanggil `refresh_rekapitulasi_unit_cost(user_id, tahun)`
4. Function refresh akan:
   - Menghapus semua data rekapitulasi untuk `user_id` dan `tahun` tersebut
   - Memasukkan ulang semua data dari 7 tabel sumber untuk `user_id` dan `tahun` tersebut
5. Tabel rekapitulasi akan ter-update dengan data terbaru

## Function dan Stored Procedure

### 1. refresh_rekapitulasi_unit_cost(p_user_id, p_tahun)

**Deskripsi**: Function untuk me-refresh tabel rekapitulasi_unit_cost dari semua tabel sumber

**Parameter**:
- `p_user_id` (UUID): User ID yang datanya akan di-refresh
- `p_tahun` (INTEGER): Tahun periode yang akan di-refresh

**Return**: void

**Cara Menggunakan**:
```sql
-- Refresh untuk user tertentu dan tahun tertentu
SELECT refresh_rekapitulasi_unit_cost('xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx'::uuid, 2025);

-- Refresh untuk user yang sedang login
SELECT refresh_rekapitulasi_unit_cost(auth.uid(), 2025);
```

**Proses yang Dilakukan**:
1. Menghapus data rekapitulasi untuk user dan tahun yang ditentukan
2. Mengambil data dari `kalkulasi_biaya_laboratorium` dan memasukkan ke rekapitulasi
3. Mengambil data dari `kalkulasi_biaya_radiologi` dan memasukkan ke rekapitulasi
4. Mengambil data dari `kalkulasi_bdrs` dan memasukkan ke rekapitulasi
5. Mengambil data dari `kalkulasi_tindakan_inap` dan memasukkan ke rekapitulasi
6. Mengambil data dari `kalkulasi_tindakan_rawat_jalan` dan memasukkan ke rekapitulasi
7. Mengambil data dari `kalkulasi_biaya_operatif` dan memasukkan ke rekapitulasi
8. Mengambil data dari `kalkulasi_biaya_cathlab` dan memasukkan ke rekapitulasi

### 2. trigger_sync_rekapitulasi_unit_cost()

**Deskripsi**: Trigger function yang dipanggil otomatis ketika ada perubahan di tabel sumber

**Return**: TRIGGER

**Proses yang Dilakukan**:
- Pada INSERT/UPDATE: Memanggil `refresh_rekapitulasi_unit_cost(NEW.user_id, NEW.tahun)`
- Pada DELETE: Memanggil `refresh_rekapitulasi_unit_cost(OLD.user_id, OLD.tahun)`

## View Helper

### view_rekapitulasi_unit_cost

**Deskripsi**: View untuk mempermudah query data rekapitulasi dengan nama jenis dan nama sumber tabel yang lebih readable

**Kolom Tambahan**:
- `nama_jenis`: Nama jenis unit kerja
  - 1 → "Rawat Jalan"
  - 2 → "Rawat Inap"
  - 3 → "Operatif"
  - 4 → "Non Layanan"
- `nama_sumber_tabel`: Nama sumber tabel yang lebih readable
  - `kalkulasi_biaya_laboratorium` → "Laboratorium"
  - `kalkulasi_biaya_radiologi` → "Radiologi"
  - `kalkulasi_bdrs` → "BDRS"
  - `kalkulasi_tindakan_inap` → "Tindakan Rawat Inap"
  - `kalkulasi_tindakan_rawat_jalan` → "Tindakan Rawat Jalan"
  - `kalkulasi_tindakan_operatif` → "Tindakan Operatif"
  - `kalkulasi_biaya_cathlab` → "Cathlab"

**Cara Menggunakan**:
```sql
-- Query semua data untuk user yang sedang login
SELECT * FROM view_rekapitulasi_unit_cost 
WHERE user_id = auth.uid() 
ORDER BY tahun DESC, kode_unit_kerja;

-- Query untuk tahun tertentu
SELECT * FROM view_rekapitulasi_unit_cost 
WHERE user_id = auth.uid() AND tahun = 2025;

-- Query untuk jenis tertentu (Rawat Jalan)
SELECT * FROM view_rekapitulasi_unit_cost 
WHERE user_id = auth.uid() AND tahun = 2025 AND kode_jenis = 1;

-- Query untuk sumber tabel tertentu (Laboratorium)
SELECT * FROM view_rekapitulasi_unit_cost 
WHERE user_id = auth.uid() AND tahun = 2025 
AND sumber_tabel = 'kalkulasi_biaya_laboratorium';

-- Query hanya tindakan operatif yang memiliki operator
SELECT * FROM view_rekapitulasi_unit_cost 
WHERE user_id = auth.uid() AND tahun = 2025 
AND kode_operator IS NOT NULL
ORDER BY kode_operator, kode_tindakan;
```

## Row Level Security (RLS)

Tabel ini menggunakan RLS untuk memastikan user hanya bisa mengakses data mereka sendiri.

**Policy yang Diterapkan**:
1. **SELECT**: User dapat melihat data milik mereka sendiri
2. **INSERT**: User dapat memasukkan data dengan user_id mereka sendiri
3. **UPDATE**: User dapat mengupdate data milik mereka sendiri
4. **DELETE**: User dapat menghapus data milik mereka sendiri

## Contoh Penggunaan

### 1. Query Rekapitulasi untuk Semua Tindakan di Tahun 2025

```sql
SELECT 
    kode_unit_kerja,
    nama_unit_kerja,
    kode_tindakan,
    nama_tindakan,
    biaya_bahan,
    unit_cost_per_tindakan,
    sumber_tabel
FROM rekapitulasi_unit_cost
WHERE user_id = auth.uid() AND tahun = 2025
ORDER BY kode_unit_kerja, kode_tindakan;
```

### 2. Query Rekapitulasi Hanya untuk Tindakan Operatif

```sql
SELECT 
    kode_unit_kerja,
    nama_unit_kerja,
    kode_operator,
    nama_operator,
    kode_tindakan,
    nama_tindakan,
    biaya_bahan,
    unit_cost_per_tindakan
FROM rekapitulasi_unit_cost
WHERE user_id = auth.uid() 
    AND tahun = 2025 
    AND sumber_tabel = 'kalkulasi_tindakan_operatif'
ORDER BY kode_operator, kode_tindakan;
```

### 3. Query Total Unit Cost per Unit Kerja

```sql
SELECT 
    kode_unit_kerja,
    nama_unit_kerja,
    COUNT(*) as jumlah_tindakan,
    SUM(biaya_bahan) as total_biaya_bahan,
    SUM(unit_cost_per_tindakan) as total_unit_cost,
    AVG(unit_cost_per_tindakan) as rata_rata_unit_cost
FROM rekapitulasi_unit_cost
WHERE user_id = auth.uid() AND tahun = 2025
GROUP BY kode_unit_kerja, nama_unit_kerja
ORDER BY kode_unit_kerja;
```

### 4. Query Perbandingan Unit Cost Antar Sumber Tabel

```sql
SELECT 
    sumber_tabel,
    COUNT(*) as jumlah_tindakan,
    MIN(unit_cost_per_tindakan) as unit_cost_minimum,
    MAX(unit_cost_per_tindakan) as unit_cost_maksimum,
    AVG(unit_cost_per_tindakan) as unit_cost_rata_rata,
    SUM(unit_cost_per_tindakan) as total_unit_cost
FROM rekapitulasi_unit_cost
WHERE user_id = auth.uid() AND tahun = 2025
GROUP BY sumber_tabel
ORDER BY sumber_tabel;
```

### 5. Refresh Manual Data Rekapitulasi

```sql
-- Refresh untuk tahun 2025
SELECT refresh_rekapitulasi_unit_cost(auth.uid(), 2025);

-- Verifikasi jumlah data setelah refresh
SELECT 
    sumber_tabel,
    COUNT(*) as jumlah_record
FROM rekapitulasi_unit_cost
WHERE user_id = auth.uid() AND tahun = 2025
GROUP BY sumber_tabel
ORDER BY sumber_tabel;
```

## Maintenance dan Troubleshooting

### Cek Apakah Trigger Bekerja

```sql
-- Cek trigger yang aktif
SELECT 
    trigger_name,
    event_object_table,
    action_timing,
    event_manipulation
FROM information_schema.triggers
WHERE trigger_name LIKE '%rekapitulasi%'
ORDER BY event_object_table;
```

### Cek Jumlah Data di Tabel Rekapitulasi

```sql
SELECT 
    COUNT(*) as total_records,
    COUNT(DISTINCT user_id) as jumlah_user,
    COUNT(DISTINCT tahun) as jumlah_tahun,
    COUNT(DISTINCT kode_unit_kerja) as jumlah_unit_kerja,
    COUNT(DISTINCT sumber_tabel) as jumlah_sumber
FROM rekapitulasi_unit_cost;
```

### Cek Data yang Belum Masuk Rekapitulasi

```sql
-- Cek apakah semua data dari kalkulasi_biaya_laboratorium sudah masuk
SELECT 
    kl.user_id,
    kl.tahun,
    COUNT(*) as jumlah_di_sumber,
    COUNT(r.id) as jumlah_di_rekapitulasi
FROM kalkulasi_biaya_laboratorium kl
LEFT JOIN rekapitulasi_unit_cost r 
    ON r.user_id = kl.user_id 
    AND r.tahun = kl.tahun 
    AND r.sumber_tabel = 'kalkulasi_biaya_laboratorium'
GROUP BY kl.user_id, kl.tahun;
```

### Force Refresh untuk Semua User dan Tahun

```sql
-- HATI-HATI: Ini akan refresh semua data!
DO $$
DECLARE
    rec RECORD;
BEGIN
    FOR rec IN 
        SELECT DISTINCT user_id, tahun 
        FROM kalkulasi_biaya_laboratorium
    LOOP
        PERFORM refresh_rekapitulasi_unit_cost(rec.user_id, rec.tahun);
    END LOOP;
END $$;
```

## Catatan Penting

1. **Automatic Sync**: Data akan otomatis ter-update ketika tabel sumber berubah melalui trigger
2. **Kode Operator**: Hanya tindakan operatif yang memiliki `kode_operator` dan `nama_operator`, untuk yang lain akan NULL
3. **Performance**: Karena menggunakan trigger, perubahan di tabel sumber akan memicu refresh seluruh rekapitulasi untuk user dan tahun tersebut
4. **RLS**: Pastikan user sudah login (`auth.uid()` tidak NULL) ketika query tabel ini
5. **Index**: Sudah dibuat index pada kolom yang sering digunakan untuk query (user_id, tahun, kode_unit_kerja, sumber_tabel)

## Diagram Relasi

```
┌─────────────────────────────────────────────────────────────┐
│                   TABEL SUMBER DATA                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌────────────────────────────────────────────────┐        │
│  │ kalkulasi_biaya_laboratorium                   │        │
│  │ kalkulasi_biaya_radiologi                      │        │
│  │ kalkulasi_bdrs                                 │        │
│  │ kalkulasi_tindakan_inap           ───► Trigger │        │
│  │ kalkulasi_tindakan_rawat_jalan    ───► Auto   │        │
│  │ kalkulasi_biaya_operatif          ───► Sync   │        │
│  │ kalkulasi_biaya_cathlab                        │        │
│  └────────────────────────────────────────────────┘        │
│                        │                                    │
│                        ▼                                    │
│  ┌────────────────────────────────────────────────┐        │
│  │  refresh_rekapitulasi_unit_cost()              │        │
│  │  (Function untuk sync data)                    │        │
│  └────────────────────────────────────────────────┘        │
│                        │                                    │
│                        ▼                                    │
│  ┌────────────────────────────────────────────────┐        │
│  │       rekapitulasi_unit_cost                   │        │
│  │  (Tabel rekapitulasi konsolidasi)             │        │
│  └────────────────────────────────────────────────┘        │
│                        │                                    │
│                        ▼                                    │
│  ┌────────────────────────────────────────────────┐        │
│  │    view_rekapitulasi_unit_cost                 │        │
│  │  (View dengan nama yang readable)              │        │
│  └────────────────────────────────────────────────┘        │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Kesimpulan

Tabel `rekapitulasi_unit_cost` adalah tabel konsolidasi yang:
- ✅ Mengambil data dari 7 tabel kalkulasi
- ✅ Auto-update melalui trigger
- ✅ Memiliki kolom operator hanya untuk tindakan operatif
- ✅ Dilengkapi dengan view untuk query yang lebih mudah
- ✅ Menggunakan RLS untuk keamanan data
- ✅ Memiliki index untuk performa query yang optimal

Dengan tabel ini, Anda dapat dengan mudah membuat laporan rekapitulasi unit cost dari semua jenis tindakan/pemeriksaan di rumah sakit dalam satu query.

