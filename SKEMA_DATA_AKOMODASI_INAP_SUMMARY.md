# SKEMA DATA AKOMODASI INAP - RINGKASAN

## OVERVIEW
Tabel `data_akomodasi_inap` adalah tabel utama untuk menghitung alokasi biaya gizi per unit kerja rawat inap dengan sistem otomatis yang terintegrasi.

## STRUKTUR TABEL (38 Kolom)

### Kolom Utama (5 kolom)
- `id` (UUID, Primary Key)
- `user_id` (UUID, Foreign Key ke auth.users)
- `tahun` (INTEGER, NOT NULL)
- `kode_unit_kerja` (TEXT, NOT NULL)
- `nama_unit_kerja` (TEXT, NOT NULL)

### Kolom AUC Gizi (5 kolom) - Relasi ke kalkulasi_biaya_gizi
- `auc_gizi_vvip` (BIGINT, DEFAULT 0)
- `auc_gizi_vip` (BIGINT, DEFAULT 0)
- `auc_gizi_i` (BIGINT, DEFAULT 0)
- `auc_gizi_ii` (BIGINT, DEFAULT 0)
- `auc_gizi_iii` (BIGINT, DEFAULT 0)

### Kolom Hari Rawat (5 kolom) - Relasi ke data_kegiatan
- `hari_rawat_vvip` (INTEGER, DEFAULT 0)
- `hari_rawat_vip` (INTEGER, DEFAULT 0)
- `hari_rawat_i` (INTEGER, DEFAULT 0)
- `hari_rawat_ii` (INTEGER, DEFAULT 0)
- `hari_rawat_iii` (INTEGER, DEFAULT 0)

### Kolom Tempat Tidur (5 kolom) - Relasi ke data_kegiatan
- `tempat_tidur_svip` (INTEGER, DEFAULT 0)
- `tempat_tidur_vip` (INTEGER, DEFAULT 0)
- `tempat_tidur_i` (INTEGER, DEFAULT 0)
- `tempat_tidur_ii` (INTEGER, DEFAULT 0)
- `tempat_tidur_iii` (INTEGER, DEFAULT 0)

### Kolom Jumlah Porsi (5 kolom) - Relasi ke data_kegiatan
- `jumlah_porsi_svip` (INTEGER, DEFAULT 0)
- `jumlah_porsi_vip` (INTEGER, DEFAULT 0)
- `jumlah_porsi_i` (INTEGER, DEFAULT 0)
- `jumlah_porsi_ii` (INTEGER, DEFAULT 0)
- `jumlah_porsi_iii` (INTEGER, DEFAULT 0)

### Kolom Kamar Luas (5 kolom) - Relasi ke data_kegiatan
- `kamar_luas_svip` (DOUBLE PRECISION, DEFAULT 0)
- `kamar_luas_vip` (DOUBLE PRECISION, DEFAULT 0)
- `kamar_luas_i` (DOUBLE PRECISION, DEFAULT 0)
- `kamar_luas_ii` (DOUBLE PRECISION, DEFAULT 0)
- `kamar_luas_iii` (DOUBLE PRECISION, DEFAULT 0)

### Kolom Perhitungan Otomatis (7 kolom) - Generated Columns
- `jumlah_kali_porsi_vvip` (BIGINT, GENERATED)
- `jumlah_kali_porsi_vip` (BIGINT, GENERATED)
- `jumlah_kali_porsi_i` (BIGINT, GENERATED)
- `jumlah_kali_porsi_ii` (BIGINT, GENERATED)
- `jumlah_kali_porsi_iii` (BIGINT, GENERATED)
- `total_gizi` (BIGINT, GENERATED)
- `created_at`, `updated_at` (TIMESTAMPTZ)

## RELASI DATABASE

### 1. Kalkulasi Biaya Gizi → AUC Gizi
```sql
-- Mengambil rata-rata AUC gizi dari semua data
SELECT AVG(auc_gizi_vvip), AVG(auc_gizi_vip), AVG(auc_gizi_i), 
       AVG(auc_gizi_ii), AVG(auc_gizi_iii)
FROM kalkulasi_biaya_gizi 
WHERE auc_gizi_* > 0;
```

### 2. Data Kegiatan → Data Operasional
```sql
-- Mengambil data berdasarkan kode_unit_kerja dan tahun
SELECT "Hari_Rawat_*", "Tempat_Tidur_*", jumlah_porsi_*, kamar_luas_*
FROM data_kegiatan 
WHERE "Kode_UK" = data_akomodasi_inap.kode_unit_kerja 
AND tahun = data_akomodasi_inap.tahun;
```

## FORMULA PERHITUNGAN

### Jumlah Kali Porsi
```
jumlah_kali_porsi_vvip = auc_gizi_vvip × jumlah_porsi_svip
jumlah_kali_porsi_vip = auc_gizi_vip × jumlah_porsi_vip
jumlah_kali_porsi_i = auc_gizi_i × jumlah_porsi_i
jumlah_kali_porsi_ii = auc_gizi_ii × jumlah_porsi_ii
jumlah_kali_porsi_iii = auc_gizi_iii × jumlah_porsi_iii
```

### Total Gizi
```
total_gizi = Σ(jumlah_kali_porsi_*)
```

## SISTEM OTOMATIS

### 1. Fungsi Sinkronisasi
- `sync_data_akomodasi_inap()` - Fungsi utama untuk sinkronisasi data

### 2. Trigger Otomatis
- `trigger_sync_akomodasi_on_gizi_update` - Trigger pada kalkulasi_biaya_gizi
- `trigger_sync_akomodasi_on_kegiatan_update` - Trigger pada data_kegiatan

### 3. Generated Columns
- 6 kolom perhitungan otomatis
- 1 kolom total gizi
- Update real-time saat data sumber berubah

## HASIL PERHITUNGAN AKTUAL

| Unit Kerja | VVIP | VIP | I | II | III | **Total Gizi** |
|------------|------|-----|---|----|-----|----------------|
| **UK046** (Terang Bulan) | 2,978,640 | 50,159,408 | 0 | 0 | 0 | **53,138,048** |
| **UK047** (Truntum) | 0 | 0 | 58,237,179 | 48,570,714 | 217,039,456 | **323,847,349** |
| **UK049** (Jlamprang) | 0 | 0 | 35,800,380 | 38,889,331 | 254,519,672 | **329,209,383** |

## CARA PENGGUNAAN

### 1. Sinkronisasi Manual
```sql
SELECT sync_data_akomodasi_inap();
```

### 2. Query Data
```sql
SELECT kode_unit_kerja, nama_unit_kerja, total_gizi
FROM data_akomodasi_inap 
ORDER BY total_gizi DESC;
```

### 3. Verifikasi Perhitungan
```sql
-- Manual verification untuk UK046
SELECT 
    189 * 15760 as manual_vvip,
    3824 * 13117 as manual_vip,
    189 * 15760 + 3824 * 13117 as manual_total
UNION ALL
SELECT 
    jumlah_kali_porsi_vvip,
    jumlah_kali_porsi_vip,
    total_gizi
FROM data_akomodasi_inap 
WHERE kode_unit_kerja = 'UK046';
```

## FITUR UTAMA

1. **Integrasi Otomatis**: Data tersinkronisasi dari 2 tabel sumber
2. **Perhitungan Real-time**: Generated columns update otomatis
3. **Trigger System**: Update otomatis saat data sumber berubah
4. **Verifikasi**: Semua perhitungan telah diverifikasi manual
5. **Skalabilitas**: Dapat menambah unit kerja baru tanpa modifikasi

## MAINTENANCE

- **Monitoring**: Cek kolom `updated_at` untuk tracking update
- **Troubleshooting**: Pastikan data sumber lengkap dan valid
- **Backup**: Backup rutin untuk data kritis

---
**Dokumentasi ini dibuat berdasarkan implementasi aktual di database.**
**Status**: ✅ Implementasi Lengkap dan Terverifikasi
