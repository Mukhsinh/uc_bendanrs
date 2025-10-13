# Auto-Generate Kode Tindakan - Dokumentasi

## Overview
Sistem auto-generate kode tindakan telah diimplementasikan untuk tabel `daftar_tindakan` dengan format **T.xxx** (T.001, T.002, T.003, dst.).

## Fitur yang Diimplementasikan

### 1. Database Functions
- **Function**: `generate_kode_tindakan()`
  - Fungsi untuk generate kode tindakan otomatis
  - Format: T.xxx (T.001, T.002, dst.)
  - Mengambil nomor terbesar dari kode yang ada dan increment

- **Trigger**: `auto_generate_kode_tindakan_trigger`
  - Trigger yang berjalan sebelum INSERT
  - Auto-generate kode jika kode_tindakan NULL atau kosong

### 2. Aplikasi Updates

#### Form Input
- **Mode Tambah Baru**: Kode tindakan tidak ditampilkan, akan otomatis digenerate
- **Mode Edit**: Kode tindakan ditampilkan dan bisa diedit
- **Validasi**: Minimal satu pelaksana (Medis atau Paramedis) harus dipilih

#### Import Data
- Template CSV tetap menyediakan kolom kode (opsional)
- Jika kode kosong, akan otomatis digenerate
- Validasi format kode jika diisi manual

### 3. Testing Results
```
T.001 - Pemeriksaan Fisik
T.002 - Pengukuran Tekanan Darah  
T.003 - Konsultasi Medis
T.004 - Pemberian Obat
T.005 - Pemeriksaan Mata
T.006 - Terapi Fisik
T.007 - Operasi Katarak
```

## Cara Penggunaan

### 1. Tambah Data Baru
1. Klik "Tambah Tindakan"
2. Isi nama tindakan
3. Pilih pelaksana (Medis/Paramedis)
4. Kode akan otomatis digenerate (T.001, T.002, dst.)

### 2. Edit Data Existing
1. Klik icon edit pada data yang ada
2. Kode tindakan dapat diedit manual
3. Simpan perubahan

### 3. Import Data
1. Download template CSV
2. Isi data dengan kode opsional (kosongkan untuk auto-generate)
3. Upload file CSV
4. Data akan diimpor dengan kode otomatis

## Database Schema
```sql
-- Tabel daftar_tindakan
CREATE TABLE daftar_tindakan (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  kode_tindakan VARCHAR UNIQUE CHECK (kode_tindakan ~ '^T\\.[0-9]+$'),
  nama_tindakan VARCHAR NOT NULL,
  medis BOOLEAN DEFAULT false,
  paramedis BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Technical Details

### Auto-Generate Logic
```sql
-- Ambil nomor terbesar dari kode tindakan yang ada
SELECT COALESCE(MAX(CAST(SUBSTRING(kode_tindakan FROM 'T\.(\d+)') AS INTEGER)), 0) + 1
FROM daftar_tindakan
WHERE kode_tindakan ~ '^T\.\d+$';

-- Format kode dengan padding 3 digit
kode_result := 'T.' || LPAD(next_number::TEXT, 3, '0');
```

### Trigger Implementation
```sql
CREATE TRIGGER auto_generate_kode_tindakan_trigger
    BEFORE INSERT ON daftar_tindakan
    FOR EACH ROW
    EXECUTE FUNCTION trigger_generate_kode_tindakan();
```

## Benefits
1. **Konsistensi**: Kode tindakan selalu berurutan dan konsisten
2. **Otomatis**: Tidak perlu input manual kode tindakan
3. **Fleksibel**: Tetap bisa edit kode untuk data existing
4. **Validasi**: Format kode selalu sesuai dengan standar T.xxx
5. **Import Support**: CSV import tetap mendukung auto-generate

## Status
✅ **COMPLETED** - Fitur auto-generate kode tindakan telah berhasil diimplementasikan dan ditest.
