# Dokumentasi Tabel dan Halaman Jenis Tindakan Inap

## 📋 Ringkasan

Telah dibuat tabel `jenis_tindakan_inap` dan halaman aplikasi **Manajemen Tindakan Inap** di bawah menu **Unit Keperawatan**.

---

## 🗄️ Struktur Database

### Tabel: `jenis_tindakan_inap`

Tabel ini mengelola hubungan antara unit kerja rawat inap dengan jenis tindakan yang tersedia.

#### Kolom-kolom:

| Kolom | Tipe Data | Nullable | Default | Deskripsi |
|-------|-----------|----------|---------|-----------|
| `id` | UUID | NO | gen_random_uuid() | Primary key |
| `user_id` | UUID | YES | NULL | Foreign key ke auth.users |
| `kode_jenis` | SMALLINT | NO | - | Kode jenis = 2 (rawat inap), CHECK constraint |
| `kode_unit_kerja` | TEXT | NO | - | Foreign key ke unit_kerja.kode |
| `nama_unit_kerja` | TEXT | NO | - | Nama unit kerja (auto-populated) |
| `kode_jenis_tindakan` | VARCHAR(50) | NO | - | Foreign key ke daftar_tindakan.kode_tindakan |
| `jenis_tindakan` | VARCHAR(255) | NO | - | Nama tindakan (auto-populated) |
| `created_at` | TIMESTAMPTZ | YES | now() | Waktu pembuatan |
| `updated_at` | TIMESTAMPTZ | YES | now() | Waktu update terakhir |

#### Constraints:

1. **Primary Key**: `id`
2. **Foreign Keys**:
   - `user_id` → `auth.users(id)`
   - `kode_unit_kerja` → `unit_kerja(kode)`
   - `kode_jenis_tindakan` → `daftar_tindakan(kode_tindakan)`
3. **Unique Constraint**: `(kode_unit_kerja, kode_jenis_tindakan)` - Mencegah duplikasi
4. **Check Constraint**: `kode_jenis = 2` - Hanya rawat inap

#### Indexes:

1. `idx_jenis_tindakan_inap_kode_unit` - Index pada `kode_unit_kerja`
2. `idx_jenis_tindakan_inap_kode_tindakan` - Index pada `kode_jenis_tindakan`
3. `idx_jenis_tindakan_inap_user_id` - Index pada `user_id`
4. `unique_unit_tindakan` - Unique index pada kombinasi unit kerja dan tindakan

#### Row Level Security (RLS):

RLS telah diaktifkan dengan policies:
- **SELECT**: User dapat melihat data mereka sendiri atau data tanpa user_id
- **INSERT**: User hanya dapat menambahkan data untuk diri mereka sendiri
- **UPDATE**: User hanya dapat mengupdate data mereka sendiri
- **DELETE**: User hanya dapat menghapus data mereka sendiri

#### Triggers:

- `trigger_update_jenis_tindakan_inap_updated_at`: Auto-update kolom `updated_at` saat data diubah

---

## 🖥️ Halaman Aplikasi

### Lokasi Menu

**Unit Keperawatan** → **Manajemen Tindakan Inap**

URL: `/keperawatan/manajemen-tindakan-inap`

### Fitur Halaman

#### 1. **Tampilan Tabel**
   - Menampilkan semua data jenis tindakan inap
   - Kolom yang ditampilkan:
     - Kode Unit (kode_unit_kerja)
     - Nama Unit Kerja (nama_unit_kerja)
     - Kode Tindakan (kode_jenis_tindakan)
     - Jenis Tindakan (jenis_tindakan)
     - Aksi (Edit & Hapus)
   - Counter total data di bagian bawah

#### 2. **Tambah Data**
   - Tombol "Tambah Data" di kanan atas
   - Dialog form dengan 2 dropdown:
     - **Unit Kerja Rawat Inap**: Dropdown dari tabel `unit_kerja` yang difilter `jenis = 2`
     - **Jenis Tindakan**: Dropdown dari tabel `daftar_tindakan`
   - Nama unit kerja dan jenis tindakan akan **auto-populated** berdasarkan pilihan
   - Validasi: tidak boleh ada duplikasi kombinasi unit kerja + tindakan

#### 3. **Edit Data**
   - Klik icon pensil pada baris data
   - Dapat mengubah unit kerja atau jenis tindakan
   - Data nama akan ter-update otomatis sesuai relasi

#### 4. **Hapus Data**
   - Klik icon tempat sampah pada baris data
   - Konfirmasi sebelum menghapus
   - Data terhapus permanen

#### 5. **Refresh Data**
   - Tombol "Refresh" untuk memuat ulang data terbaru

---

## 📁 File yang Dibuat/Diubah

### File Baru:

1. **Component**: `src/components/ManajemenTindakanInapFormTable.tsx`
   - Component utama untuk mengelola tampilan dan logika
   - Menggunakan React Hook Form + Zod untuk validasi
   - Integrasi dengan Supabase

2. **Page**: `src/pages/ManajemenTindakanInap.tsx`
   - Halaman wrapper yang memanggil component

### File yang Diubah:

1. **src/App.tsx**
   - Import: `ManajemenTindakanInap`
   - Route: `/keperawatan/manajemen-tindakan-inap`

2. **src/components/SidebarNav.tsx**
   - Menambahkan menu "Manajemen Tindakan Inap" di bawah "Unit Keperawatan"
   - Update logic untuk highlight menu aktif

---

## 🔄 Cara Kerja Auto-Population

### Saat Menambah/Edit Data:

1. User memilih **Unit Kerja** dari dropdown
   - Data diambil dari tabel `unit_kerja` WHERE `jenis = 2`
   - Format: "UK046 - Terang Bulan VIP/VVIP"

2. User memilih **Jenis Tindakan** dari dropdown
   - Data diambil dari tabel `daftar_tindakan`
   - Format: "T.001 - Nama Tindakan"

3. Saat menyimpan:
   - `kode_unit_kerja` = nilai yang dipilih dari dropdown unit kerja
   - `nama_unit_kerja` = nama yang dipilih dari dropdown unit kerja (auto)
   - `kode_jenis_tindakan` = nilai yang dipilih dari dropdown tindakan
   - `jenis_tindakan` = nama yang dipilih dari dropdown tindakan (auto)
   - `kode_jenis` = 2 (hardcoded untuk rawat inap)
   - `user_id` = user yang sedang login

---

## 🎯 Use Case

### Contoh Penggunaan:

**Skenario**: Menambahkan tindakan "Pemasangan Infus" untuk ruang "Terang Bulan VIP/VVIP"

1. Klik tombol **Tambah Data**
2. Pilih **Unit Kerja**: UK046 - Terang Bulan VIP/VVIP
3. Pilih **Jenis Tindakan**: T.001 - Pemasangan Infus
4. Klik **Simpan**
5. Data tersimpan dengan:
   - `kode_jenis` = 2
   - `kode_unit_kerja` = "UK046"
   - `nama_unit_kerja` = "Terang Bulan VIP/VVIP"
   - `kode_jenis_tindakan` = "T.001"
   - `jenis_tindakan` = "Pemasangan Infus"

---

## 🔒 Keamanan

1. **Row Level Security (RLS)**: Aktif
   - User hanya bisa melihat/edit/hapus data mereka sendiri
   - Admin bisa melihat semua data (user_id = NULL)

2. **Validasi**:
   - Tidak boleh duplikasi kombinasi unit kerja + tindakan
   - Foreign key constraint memastikan data valid
   - Check constraint memastikan kode_jenis = 2

3. **Authentication**:
   - Halaman dilindungi dengan `ProtectedRoute`
   - User harus login untuk mengakses

---

## 🧪 Testing

### Cara Test:

1. **Jalankan aplikasi**:
   ```bash
   npm run dev
   ```

2. **Login ke aplikasi**

3. **Akses halaman**:
   - Buka sidebar → **Unit Keperawatan**
   - Klik **Manajemen Tindakan Inap**

4. **Test CRUD**:
   - ✅ Tambah data baru
   - ✅ Edit data yang ada
   - ✅ Hapus data
   - ✅ Refresh data

5. **Test Validasi**:
   - ❌ Coba tambah data duplikat (harus error)
   - ❌ Coba submit tanpa memilih unit kerja (harus error)
   - ❌ Coba submit tanpa memilih tindakan (harus error)

---

## 📊 Query untuk Verifikasi

### Cek struktur tabel:
```sql
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'jenis_tindakan_inap'
ORDER BY ordinal_position;
```

### Cek data:
```sql
SELECT * FROM jenis_tindakan_inap
ORDER BY kode_unit_kerja, kode_jenis_tindakan;
```

### Cek foreign keys:
```sql
SELECT
  conname AS constraint_name,
  conrelid::regclass AS table_name,
  confrelid::regclass AS referenced_table,
  a.attname AS column_name,
  af.attname AS referenced_column
FROM pg_constraint c
JOIN pg_attribute a ON a.attnum = ANY(c.conkey) AND a.attrelid = c.conrelid
JOIN pg_attribute af ON af.attnum = ANY(c.confkey) AND af.attrelid = c.confrelid
WHERE conrelid = 'jenis_tindakan_inap'::regclass
  AND contype = 'f';
```

### Cek RLS policies:
```sql
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE tablename = 'jenis_tindakan_inap';
```

---

## ✅ Checklist Selesai

- [x] Tabel `jenis_tindakan_inap` dibuat dengan struktur lengkap
- [x] Foreign key constraints dibuat
- [x] Indexes dibuat untuk performa
- [x] Unique constraint untuk mencegah duplikasi
- [x] RLS policies dibuat dan diaktifkan
- [x] Trigger auto-update `updated_at` dibuat
- [x] Component React dibuat (`ManajemenTindakanInapFormTable.tsx`)
- [x] Page React dibuat (`ManajemenTindakanInap.tsx`)
- [x] Route ditambahkan di `App.tsx`
- [x] Menu ditambahkan di `SidebarNav.tsx`
- [x] Auto-population untuk nama unit kerja dan jenis tindakan
- [x] Validasi form dengan Zod
- [x] CRUD operations (Create, Read, Update, Delete)
- [x] No linting errors

---

## 🚀 Status

**✅ SELESAI & SIAP DIGUNAKAN**

Tabel dan halaman aplikasi sudah sepenuhnya fungsional dan siap untuk digunakan!

