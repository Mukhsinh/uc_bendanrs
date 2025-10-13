# SKEMA DATA AKOMODASI INAP - DOKUMENTASI LENGKAP

## OVERVIEW
Tabel `data_akomodasi_inap` adalah tabel utama untuk menghitung alokasi biaya gizi per unit kerja rawat inap. Tabel ini mengintegrasikan data dari `kalkulasi_biaya_gizi` dan `data_kegiatan` dengan perhitungan otomatis untuk total biaya gizi.

## STRUKTUR TABEL

### Kolom Utama
```sql
CREATE TABLE data_akomodasi_inap (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    tahun INTEGER NOT NULL,
    kode_unit_kerja TEXT NOT NULL,
    nama_unit_kerja TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Kolom AUC Gizi (Average Unit Cost Gizi)
```sql
-- Relasi ke kalkulasi_biaya_gizi (nilai rata-rata)
auc_gizi_vvip BIGINT DEFAULT 0,     -- Average Unit Cost gizi kelas VVIP
auc_gizi_vip BIGINT DEFAULT 0,      -- Average Unit Cost gizi kelas VIP  
auc_gizi_i BIGINT DEFAULT 0,        -- Average Unit Cost gizi kelas I
auc_gizi_ii BIGINT DEFAULT 0,       -- Average Unit Cost gizi kelas II
auc_gizi_iii BIGINT DEFAULT 0       -- Average Unit Cost gizi kelas III
```

### Kolom Hari Rawat
```sql
-- Relasi ke data_kegiatan.Hari_Rawat_*
hari_rawat_vvip INTEGER DEFAULT 0,  -- Jumlah hari rawat VVIP
hari_rawat_vip INTEGER DEFAULT 0,   -- Jumlah hari rawat VIP
hari_rawat_i INTEGER DEFAULT 0,     -- Jumlah hari rawat kelas I
hari_rawat_ii INTEGER DEFAULT 0,    -- Jumlah hari rawat kelas II
hari_rawat_iii INTEGER DEFAULT 0    -- Jumlah hari rawat kelas III
```

### Kolom Tempat Tidur
```sql
-- Relasi ke data_kegiatan.Tempat_Tidur_*
tempat_tidur_svip INTEGER DEFAULT 0,  -- Jumlah tempat tidur SVIP
tempat_tidur_vip INTEGER DEFAULT 0,   -- Jumlah tempat tidur VIP
tempat_tidur_i INTEGER DEFAULT 0,     -- Jumlah tempat tidur kelas I
tempat_tidur_ii INTEGER DEFAULT 0,    -- Jumlah tempat tidur kelas II
tempat_tidur_iii INTEGER DEFAULT 0    -- Jumlah tempat tidur kelas III
```

### Kolom Jumlah Porsi
```sql
-- Relasi ke data_kegiatan.jumlah_porsi_*
jumlah_porsi_svip INTEGER DEFAULT 0,  -- Jumlah porsi SVIP
jumlah_porsi_vip INTEGER DEFAULT 0,   -- Jumlah porsi VIP
jumlah_porsi_i INTEGER DEFAULT 0,     -- Jumlah porsi kelas I
jumlah_porsi_ii INTEGER DEFAULT 0,    -- Jumlah porsi kelas II
jumlah_porsi_iii INTEGER DEFAULT 0    -- Jumlah porsi kelas III
```

### Kolom Kamar Luas
```sql
-- Relasi ke data_kegiatan.kamar_luas_*
kamar_luas_svip DOUBLE PRECISION DEFAULT 0,  -- Luas kamar SVIP (m²)
kamar_luas_vip DOUBLE PRECISION DEFAULT 0,   -- Luas kamar VIP (m²)
kamar_luas_i DOUBLE PRECISION DEFAULT 0,     -- Luas kamar kelas I (m²)
kamar_luas_ii DOUBLE PRECISION DEFAULT 0,    -- Luas kamar kelas II (m²)
kamar_luas_iii DOUBLE PRECISION DEFAULT 0    -- Luas kamar kelas III (m²)
```

### Kolom Perhitungan Otomatis (Generated Columns)
```sql
-- Perhitungan: AUC Gizi × Jumlah Porsi
jumlah_kali_porsi_vvip BIGINT GENERATED ALWAYS AS (
    COALESCE(jumlah_porsi_svip, 0) * COALESCE(auc_gizi_vvip, 0)
) STORED,

jumlah_kali_porsi_vip BIGINT GENERATED ALWAYS AS (
    COALESCE(jumlah_porsi_vip, 0) * COALESCE(auc_gizi_vip, 0)
) STORED,

jumlah_kali_porsi_i BIGINT GENERATED ALWAYS AS (
    COALESCE(jumlah_porsi_i, 0) * COALESCE(auc_gizi_i, 0)
) STORED,

jumlah_kali_porsi_ii BIGINT GENERATED ALWAYS AS (
    COALESCE(jumlah_porsi_ii, 0) * COALESCE(auc_gizi_ii, 0)
) STORED,

jumlah_kali_porsi_iii BIGINT GENERATED ALWAYS AS (
    COALESCE(jumlah_porsi_iii, 0) * COALESCE(auc_gizi_iii, 0)
) STORED,

-- Total Gizi: Penjumlahan semua jumlah_kali_porsi
total_gizi BIGINT GENERATED ALWAYS AS (
    COALESCE(jumlah_kali_porsi_vvip, 0) +
    COALESCE(jumlah_kali_porsi_vip, 0) +
    COALESCE(jumlah_kali_porsi_i, 0) +
    COALESCE(jumlah_kali_porsi_ii, 0) +
    COALESCE(jumlah_kali_porsi_iii, 0)
) STORED
```

## RELASI DATABASE

### 1. Relasi ke Kalkulasi Biaya Gizi
```sql
-- AUC Gizi diambil dari rata-rata semua nilai di kalkulasi_biaya_gizi
SELECT 
    AVG(auc_gizi_vvip) as avg_vvip,
    AVG(auc_gizi_vip) as avg_vip,
    AVG(auc_gizi_i) as avg_i,
    AVG(auc_gizi_ii) as avg_ii,
    AVG(auc_gizi_iii) as avg_iii
FROM kalkulasi_biaya_gizi 
WHERE auc_gizi_* > 0;
```

### 2. Relasi ke Data Kegiatan
```sql
-- Data diambil berdasarkan kode_unit_kerja dan tahun
SELECT 
    "Hari_Rawat_SVIP", "Hari_Rawat_VIP", "Hari_Rawat_I", "Hari_Rawat_II", "Hari_Rawat_III",
    "Tempat_Tidur_SVIP", "Tempat_Tidur_VIP", "Tempat_Tidur_I", "Tempat_Tidur_II", "Tempat_Tidur_III",
    jumlah_porsi_svip, jumlah_porsi_vip, jumlah_porsi_i, jumlah_porsi_ii, jumlah_porsi_iii,
    kamar_luas_svip, kamar_luas_vip, kamar_luas_i, kamar_luas_ii, kamar_luas_iii
FROM data_kegiatan 
WHERE "Kode_UK" = data_akomodasi_inap.kode_unit_kerja 
AND tahun = data_akomodasi_inap.tahun;
```

## FUNGSI SINKRONISASI OTOMATIS

### Fungsi Utama: sync_data_akomodasi_inap()
```sql
CREATE OR REPLACE FUNCTION sync_data_akomodasi_inap()
RETURNS void AS $$
BEGIN
    -- Update AUC gizi dari rata-rata kalkulasi_biaya_gizi
    UPDATE data_akomodasi_inap 
    SET 
        auc_gizi_vvip = (SELECT COALESCE(AVG(auc_gizi_vvip), 0) FROM kalkulasi_biaya_gizi WHERE auc_gizi_vvip > 0),
        auc_gizi_vip = (SELECT COALESCE(AVG(auc_gizi_vip), 0) FROM kalkulasi_biaya_gizi WHERE auc_gizi_vip > 0),
        auc_gizi_i = (SELECT COALESCE(AVG(auc_gizi_i), 0) FROM kalkulasi_biaya_gizi WHERE auc_gizi_i > 0),
        auc_gizi_ii = (SELECT COALESCE(AVG(auc_gizi_ii), 0) FROM kalkulasi_biaya_gizi WHERE auc_gizi_ii > 0),
        auc_gizi_iii = (SELECT COALESCE(AVG(auc_gizi_iii), 0) FROM kalkulasi_biaya_gizi WHERE auc_gizi_iii > 0);
    
    -- Update hari_rawat dari data_kegiatan
    UPDATE data_akomodasi_inap 
    SET 
        hari_rawat_vvip = COALESCE((SELECT "Hari_Rawat_SVIP" FROM data_kegiatan WHERE "Kode_UK" = data_akomodasi_inap.kode_unit_kerja AND tahun = data_akomodasi_inap.tahun), 0),
        hari_rawat_vip = COALESCE((SELECT "Hari_Rawat_VIP" FROM data_kegiatan WHERE "Kode_UK" = data_akomodasi_inap.kode_unit_kerja AND tahun = data_akomodasi_inap.tahun), 0),
        hari_rawat_i = COALESCE((SELECT "Hari_Rawat_I" FROM data_kegiatan WHERE "Kode_UK" = data_akomodasi_inap.kode_unit_kerja AND tahun = data_akomodasi_inap.tahun), 0),
        hari_rawat_ii = COALESCE((SELECT "Hari_Rawat_II" FROM data_kegiatan WHERE "Kode_UK" = data_akomodasi_inap.kode_unit_kerja AND tahun = data_akomodasi_inap.tahun), 0),
        hari_rawat_iii = COALESCE((SELECT "Hari_Rawat_III" FROM data_kegiatan WHERE "Kode_UK" = data_akomodasi_inap.kode_unit_kerja AND tahun = data_akomodasi_inap.tahun), 0);
    
    -- Update tempat_tidur dari data_kegiatan
    UPDATE data_akomodasi_inap 
    SET 
        tempat_tidur_svip = COALESCE((SELECT "Tempat_Tidur_SVIP" FROM data_kegiatan WHERE "Kode_UK" = data_akomodasi_inap.kode_unit_kerja AND tahun = data_akomodasi_inap.tahun), 0),
        tempat_tidur_vip = COALESCE((SELECT "Tempat_Tidur_VIP" FROM data_kegiatan WHERE "Kode_UK" = data_akomodasi_inap.kode_unit_kerja AND tahun = data_akomodasi_inap.tahun), 0),
        tempat_tidur_i = COALESCE((SELECT "Tempat_Tidur_I" FROM data_kegiatan WHERE "Kode_UK" = data_akomodasi_inap.kode_unit_kerja AND tahun = data_akomodasi_inap.tahun), 0),
        tempat_tidur_ii = COALESCE((SELECT "Tempat_Tidur_II" FROM data_kegiatan WHERE "Kode_UK" = data_akomodasi_inap.kode_unit_kerja AND tahun = data_akomodasi_inap.tahun), 0),
        tempat_tidur_iii = COALESCE((SELECT "Tempat_Tidur_III" FROM data_kegiatan WHERE "Kode_UK" = data_akomodasi_inap.kode_unit_kerja AND tahun = data_akomodasi_inap.tahun), 0);
    
    -- Update jumlah_porsi dari data_kegiatan
    UPDATE data_akomodasi_inap 
    SET 
        jumlah_porsi_svip = COALESCE((SELECT jumlah_porsi_svip FROM data_kegiatan WHERE "Kode_UK" = data_akomodasi_inap.kode_unit_kerja AND tahun = data_akomodasi_inap.tahun), 0),
        jumlah_porsi_vip = COALESCE((SELECT jumlah_porsi_vip FROM data_kegiatan WHERE "Kode_UK" = data_akomodasi_inap.kode_unit_kerja AND tahun = data_akomodasi_inap.tahun), 0),
        jumlah_porsi_i = COALESCE((SELECT jumlah_porsi_i FROM data_kegiatan WHERE "Kode_UK" = data_akomodasi_inap.kode_unit_kerja AND tahun = data_akomodasi_inap.tahun), 0),
        jumlah_porsi_ii = COALESCE((SELECT jumlah_porsi_ii FROM data_kegiatan WHERE "Kode_UK" = data_akomodasi_inap.kode_unit_kerja AND tahun = data_akomodasi_inap.tahun), 0),
        jumlah_porsi_iii = COALESCE((SELECT jumlah_porsi_iii FROM data_kegiatan WHERE "Kode_UK" = data_akomodasi_inap.kode_unit_kerja AND tahun = data_akomodasi_inap.tahun), 0);
    
    -- Update kamar_luas dari data_kegiatan
    UPDATE data_akomodasi_inap 
    SET 
        kamar_luas_svip = COALESCE((SELECT kamar_luas_svip FROM data_kegiatan WHERE "Kode_UK" = data_akomodasi_inap.kode_unit_kerja AND tahun = data_akomodasi_inap.tahun), 0),
        kamar_luas_vip = COALESCE((SELECT kamar_luas_vip FROM data_kegiatan WHERE "Kode_UK" = data_akomodasi_inap.kode_unit_kerja AND tahun = data_akomodasi_inap.tahun), 0),
        kamar_luas_i = COALESCE((SELECT kamar_luas_i FROM data_kegiatan WHERE "Kode_UK" = data_akomodasi_inap.kode_unit_kerja AND tahun = data_akomodasi_inap.tahun), 0),
        kamar_luas_ii = COALESCE((SELECT kamar_luas_ii FROM data_kegiatan WHERE "Kode_UK" = data_akomodasi_inap.kode_unit_kerja AND tahun = data_akomodasi_inap.tahun), 0),
        kamar_luas_iii = COALESCE((SELECT kamar_luas_iii FROM data_kegiatan WHERE "Kode_UK" = data_akomodasi_inap.kode_unit_kerja AND tahun = data_akomodasi_inap.tahun), 0);
    
    -- Update timestamp
    UPDATE data_akomodasi_inap SET updated_at = NOW();
END;
$$ LANGUAGE plpgsql;
```

### Trigger Otomatis
```sql
-- Trigger function
CREATE OR REPLACE FUNCTION trigger_sync_data_akomodasi_inap()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM sync_data_akomodasi_inap();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pada kalkulasi_biaya_gizi
CREATE TRIGGER trigger_sync_akomodasi_on_gizi_update
    AFTER INSERT OR UPDATE ON kalkulasi_biaya_gizi
    FOR EACH STATEMENT
    EXECUTE FUNCTION trigger_sync_data_akomodasi_inap();

-- Trigger pada data_kegiatan
CREATE TRIGGER trigger_sync_akomodasi_on_kegiatan_update
    AFTER INSERT OR UPDATE ON data_kegiatan
    FOR EACH STATEMENT
    EXECUTE FUNCTION trigger_sync_data_akomodasi_inap();
```

## FORMULA PERHITUNGAN

### 1. Jumlah Kali Porsi
```
jumlah_kali_porsi_vvip = auc_gizi_vvip × jumlah_porsi_svip
jumlah_kali_porsi_vip = auc_gizi_vip × jumlah_porsi_vip
jumlah_kali_porsi_i = auc_gizi_i × jumlah_porsi_i
jumlah_kali_porsi_ii = auc_gizi_ii × jumlah_porsi_ii
jumlah_kali_porsi_iii = auc_gizi_iii × jumlah_porsi_iii
```

### 2. Total Gizi
```
total_gizi = jumlah_kali_porsi_vvip + jumlah_kali_porsi_vip + jumlah_kali_porsi_i + jumlah_kali_porsi_ii + jumlah_kali_porsi_iii
```

## CONTOH DATA AKTUAL

### UK046 - Terang Bulan (VIP-VVIP)
```sql
-- Input Data
auc_gizi_vvip = 15760
auc_gizi_vip = 13117
jumlah_porsi_svip = 189
jumlah_porsi_vip = 3824

-- Perhitungan
jumlah_kali_porsi_vvip = 189 × 15760 = 2,978,640
jumlah_kali_porsi_vip = 3824 × 13117 = 50,159,408
total_gizi = 2,978,640 + 50,159,408 = 53,138,048
```

### UK047 - Truntum
```sql
-- Input Data
auc_gizi_i = 9471
auc_gizi_ii = 8621
auc_gizi_iii = 9448
jumlah_porsi_i = 6149
jumlah_porsi_ii = 5634
jumlah_porsi_iii = 22972

-- Perhitungan
jumlah_kali_porsi_i = 6149 × 9471 = 58,237,179
jumlah_kali_porsi_ii = 5634 × 8621 = 48,570,714
jumlah_kali_porsi_iii = 22972 × 9448 = 217,039,456
total_gizi = 58,237,179 + 48,570,714 + 217,039,456 = 323,847,349
```

### UK049 - Jlamprang
```sql
-- Input Data
auc_gizi_i = 9471
auc_gizi_ii = 8621
auc_gizi_iii = 9448
jumlah_porsi_i = 3780
jumlah_porsi_ii = 4511
jumlah_porsi_iii = 26939

-- Perhitungan
jumlah_kali_porsi_i = 3780 × 9471 = 35,800,380
jumlah_kali_porsi_ii = 4511 × 8621 = 38,889,331
jumlah_kali_porsi_iii = 26939 × 9448 = 254,519,672
total_gizi = 35,800,380 + 38,889,331 + 254,519,672 = 329,209,383
```

## CARA PENGGUNAAN

### 1. Sinkronisasi Manual
```sql
SELECT sync_data_akomodasi_inap();
```

### 2. Query Data
```sql
SELECT 
    kode_unit_kerja,
    nama_unit_kerja,
    auc_gizi_vvip,
    auc_gizi_vip,
    auc_gizi_i,
    auc_gizi_ii,
    auc_gizi_iii,
    jumlah_porsi_svip,
    jumlah_porsi_vip,
    jumlah_porsi_i,
    jumlah_porsi_ii,
    jumlah_porsi_iii,
    jumlah_kali_porsi_vvip,
    jumlah_kali_porsi_vip,
    jumlah_kali_porsi_i,
    jumlah_kali_porsi_ii,
    jumlah_kali_porsi_iii,
    total_gizi
FROM data_akomodasi_inap 
ORDER BY total_gizi DESC;
```

### 3. Verifikasi Perhitungan
```sql
-- Manual verification
SELECT 
    'Manual' as type,
    189 * 15760 as vvip_calc,
    3824 * 13117 as vip_calc,
    189 * 15760 + 3824 * 13117 as total_calc
UNION ALL
SELECT 
    'Database' as type,
    jumlah_kali_porsi_vvip,
    jumlah_kali_porsi_vip,
    total_gizi
FROM data_akomodasi_inap 
WHERE kode_unit_kerja = 'UK046';
```

## MAINTENANCE

### 1. Update Data Sumber
- Data akan otomatis tersinkronisasi melalui trigger
- Untuk update manual, jalankan `SELECT sync_data_akomodasi_inap();`

### 2. Monitoring
- Periksa kolom `updated_at` untuk melihat kapan terakhir diupdate
- Verifikasi perhitungan dengan query manual

### 3. Troubleshooting
- Jika data tidak tersinkronisasi, cek trigger dan function
- Pastikan data sumber (kalkulasi_biaya_gizi dan data_kegiatan) sudah lengkap

## KETERBATASAN

1. **Data Sumber**: Tabel ini bergantung pada kelengkapan data di `kalkulasi_biaya_gizi` dan `data_kegiatan`
2. **AUC Gizi**: Menggunakan rata-rata global, tidak spesifik per unit kerja
3. **Generated Columns**: Tidak dapat diupdate manual, hanya melalui perubahan data sumber

## VERSION HISTORY

- **v1.0** (2025-01-XX): Initial implementation dengan relasi dan perhitungan otomatis
- **v1.1** (2025-01-XX): Penambahan trigger otomatis dan fungsi sinkronisasi
- **v1.2** (2025-01-XX): Penghapusan kolom duplikasi dan optimasi generated columns

---
**Dokumentasi ini dibuat otomatis berdasarkan implementasi aktual di database.**
**Terakhir diupdate**: $(date)
