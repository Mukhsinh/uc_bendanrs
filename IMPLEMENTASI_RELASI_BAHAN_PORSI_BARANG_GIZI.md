# Implementasi Relasi Bahan Porsi dengan Data Barang Gizi

## Ringkasan
Berhasil mengimplementasikan relasi antara tabel `bahan_porsi` dan `data_barang_gizi` sehingga nama barang, satuan, dan harga dapat diisi otomatis melalui pencarian, dan sistem akan menggenerate kalkulasi otomatis.

## Implementasi Database

### 1. Penambahan Foreign Key
```sql
-- Menambahkan kolom foreign key untuk merujuk ke data_barang_gizi
ALTER TABLE bahan_porsi 
ADD COLUMN data_barang_gizi_id UUID REFERENCES data_barang_gizi(id);
```

### 2. Trigger Auto-Update
```sql
-- Fungsi trigger untuk auto-update data dari data_barang_gizi
CREATE OR REPLACE FUNCTION update_bahan_porsi_from_barang_gizi()
RETURNS TRIGGER AS $$
BEGIN
    -- Jika data_barang_gizi_id diisi, update nama_barang, satuan, dan harga
    IF NEW.data_barang_gizi_id IS NOT NULL THEN
        SELECT 
            dbg.nama_barang,
            dbg.satuan,
            dbg.harga
        INTO 
            NEW.nama_barang,
            NEW.satuan,
            NEW.harga
        FROM data_barang_gizi dbg
        WHERE dbg.id = NEW.data_barang_gizi_id;
        
        -- Jika data tidak ditemukan, set NULL
        IF NOT FOUND THEN
            NEW.nama_barang := NULL;
            NEW.satuan := NULL;
            NEW.harga := 0;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger untuk INSERT dan UPDATE
CREATE TRIGGER trigger_update_bahan_porsi_from_barang_gizi
    BEFORE INSERT OR UPDATE OF data_barang_gizi_id
    ON bahan_porsi
    FOR EACH ROW
    EXECUTE FUNCTION update_bahan_porsi_from_barang_gizi();
```

### 3. Fungsi Pencarian
```sql
-- Fungsi untuk pencarian barang gizi
CREATE OR REPLACE FUNCTION search_barang_gizi(search_term TEXT DEFAULT '')
RETURNS TABLE (
    id UUID,
    kode_barang TEXT,
    nama_barang TEXT,
    satuan TEXT,
    harga NUMERIC,
    display_text TEXT
) 
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        dbg.id,
        dbg.kode_barang,
        dbg.nama_barang,
        dbg.satuan,
        dbg.harga,
        CONCAT(dbg.kode_barang, ' - ', dbg.nama_barang, ' (', COALESCE(dbg.satuan, 'N/A'), ')') as display_text
    FROM data_barang_gizi dbg
    WHERE 
        CASE 
            WHEN search_term = '' OR search_term IS NULL THEN TRUE
            ELSE LOWER(dbg.nama_barang) LIKE LOWER('%' || search_term || '%')
               OR LOWER(dbg.kode_barang) LIKE LOWER('%' || search_term || '%')
        END
    ORDER BY dbg.nama_barang;
END;
$$;
```

### 4. Fungsi Autocomplete untuk Frontend
```sql
-- Fungsi untuk autocomplete frontend
CREATE OR REPLACE FUNCTION get_barang_gizi_for_autocomplete(search_term TEXT DEFAULT '')
RETURNS TABLE (
    id UUID,
    value TEXT,
    label TEXT,
    kode_barang TEXT,
    nama_barang TEXT,
    satuan TEXT,
    harga NUMERIC
) 
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        dbg.id,
        dbg.id::TEXT as value,
        CONCAT(dbg.kode_barang, ' - ', dbg.nama_barang, ' (', COALESCE(dbg.satuan, 'N/A'), ' - Rp ', COALESCE(dbg.harga, 0)) as label,
        dbg.kode_barang,
        dbg.nama_barang,
        dbg.satuan,
        dbg.harga
    FROM data_barang_gizi dbg
    WHERE 
        CASE 
            WHEN search_term = '' OR search_term IS NULL THEN TRUE
            ELSE LOWER(dbg.nama_barang) LIKE LOWER('%' || search_term || '%')
               OR LOWER(dbg.kode_barang) LIKE LOWER('%' || search_term || '%')
        END
    ORDER BY dbg.nama_barang
    LIMIT 50;
END;
$$;
```

### 5. View Lengkap
```sql
-- View untuk bahan_porsi dengan informasi lengkap dari data_barang_gizi
CREATE OR REPLACE VIEW view_bahan_porsi_with_barang_gizi AS
SELECT 
    bp.id,
    bp.kode,
    bp.jenis_makanan,
    bp.nama_barang,
    bp.satuan,
    bp.konsumsi,
    bp.harga,
    bp.harga_bah,
    bp.biaya_produksi,
    bp.biaya_bahan_porsi,
    bp.data_barang_gizi_id,
    dbg.kode_barang as kode_barang_gizi,
    dbg.nama_barang as nama_barang_gizi,
    dbg.satuan as satuan_gizi,
    dbg.harga as harga_gizi,
    -- Informasi tambahan
    CASE 
        WHEN bp.data_barang_gizi_id IS NOT NULL THEN 'Auto-filled from data_barang_gizi'
        ELSE 'Manual input'
    END as sumber_data,
    -- Breakdown perhitungan
    ROUND(bp.harga_bah * COALESCE(bp.biaya_produksi, 0) / 100, 2) AS biaya_produksi_amount,
    CONCAT(
        'Poin 1 (Harga Bahan): ', bp.harga_bah,
        ' + Poin 2 (Biaya Produksi): ', ROUND(bp.harga_bah * COALESCE(bp.biaya_produksi, 0) / 100, 2),
        ' = Total: ', bp.biaya_bahan_porsi
    ) AS breakdown_perhitungan
FROM bahan_porsi bp
LEFT JOIN data_barang_gizi dbg ON bp.data_barang_gizi_id = dbg.id
ORDER BY bp.jenis_makanan, bp.kode;
```

## Mekanisme Perhitungan

### 1. Flow Data Input
```
User Input data_barang_gizi_id → Trigger Auto-Update → nama_barang, satuan, harga terisi otomatis → 
konsumsi diisi user → harga_bah = konsumsi × harga (auto-calculated) → 
biaya_bahan_porsi = harga_bah + (harga_bah × biaya_produksi ÷ 100) (auto-calculated)
```

### 2. Rumus Kalkulasi Otomatis
```sql
-- Harga Bahan (auto-calculated)
harga_bah = konsumsi × harga

-- Biaya Bahan Porsi (auto-calculated)
biaya_bahan_porsi = harga_bah + (harga_bah × biaya_produksi ÷ 100)

-- Breakdown:
-- Poin 1: harga_bah
-- Poin 2: harga_bah × biaya_produksi ÷ 100
-- Poin 3: Poin 1 + Poin 2 = biaya_bahan_porsi
```

## Contoh Perhitungan

### Data Test yang Berhasil:
| Kode | Nama Barang | Satuan | Konsumsi | Harga | Harga Bahan | Biaya Produksi | Biaya Bahan Porsi |
|------|-------------|--------|----------|-------|-------------|----------------|------------------|
| test.001 | Beras | kg | 2.5 | 16,500 | 41,250 | 10% | 45,375 |
| test.002 | Minyak Goreng | Liter | 0.3 | 21,500 | 6,450 | 15% | 7,417.50 |
| test.003 | Garam | bungkus | 10 | 5,200 | 52,000 | 5% | 54,600 |
| test.004 | Daging Ayam | kg | 1.0 | 42,000 | 42,000 | 20% | 50,400 |

### Breakdown Perhitungan Detail:

#### Contoh: Beras (test.001)
- **Data Source**: Auto-filled from data_barang_gizi
- **Konsumsi**: 2.5 kg
- **Harga**: Rp 16,500/kg
- **Poin 1 (Harga Bahan)**: 2.5 × 16,500 = 41,250
- **Poin 2 (Biaya Produksi)**: 41,250 × 10% = 4,125
- **Poin 3 (Total)**: 41,250 + 4,125 = **45,375**

#### Contoh: Minyak Goreng (test.002)
- **Data Source**: Auto-filled from data_barang_gizi
- **Konsumsi**: 0.3 Liter
- **Harga**: Rp 21,500/Liter
- **Poin 1 (Harga Bahan)**: 0.3 × 21,500 = 6,450
- **Poin 2 (Biaya Produksi)**: 6,450 × 15% = 967.50
- **Poin 3 (Total)**: 6,450 + 967.50 = **7,417.50**

## Cara Kerja Rujukan Data

### 1. Pencarian Barang Gizi
```sql
-- Pencarian dengan kata kunci "beras"
SELECT * FROM search_barang_gizi('beras');

-- Hasil:
-- id: eb367ea4-1e87-4705-9898-b6943ea5bc0a
-- nama_barang: Beras
-- satuan: kg
-- harga: 16500
```

### 2. Input Data dengan Auto-Fill
```sql
-- Input data baru dengan data_barang_gizi_id
INSERT INTO bahan_porsi (kode, jenis_makanan, data_barang_gizi_id, konsumsi, biaya_produksi) 
VALUES ('test.001', 'Test Makanan', 'eb367ea4-1e87-4705-9898-b6943ea5bc0a', 2.5, 10);

-- Trigger otomatis mengisi:
-- nama_barang: "Beras"
-- satuan: "kg"  
-- harga: 16500
-- harga_bah: 41250 (2.5 × 16500)
-- biaya_bahan_porsi: 45375 (41250 + 4125)
```

### 3. Autocomplete untuk Frontend
```sql
-- Fungsi untuk autocomplete
SELECT * FROM get_barang_gizi_for_autocomplete('beras');

-- Hasil format untuk frontend:
-- value: "eb367ea4-1e87-4705-9898-b6943ea5bc0a"
-- label: "01.01.07.01.07.01.01.273 - Beras (kg - Rp 16500"
-- nama_barang: "Beras"
-- satuan: "kg"
-- harga: 16500
```

## API Endpoints untuk Frontend

### 1. Pencarian Barang Gizi
```sql
-- Endpoint: GET /api/barang-gizi/search?q=beras
SELECT * FROM get_barang_gizi_for_autocomplete('beras');
```

### 2. Input Bahan Porsi
```sql
-- Endpoint: POST /api/bahan-porsi
INSERT INTO bahan_porsi (kode, jenis_makanan, data_barang_gizi_id, konsumsi, biaya_produksi) 
VALUES (?, ?, ?, ?, ?);
```

### 3. View Data Lengkap
```sql
-- Endpoint: GET /api/bahan-porsi
SELECT * FROM view_bahan_porsi_with_barang_gizi;
```

## Keunggulan Implementasi

1. **Auto-Fill**: Nama barang, satuan, dan harga terisi otomatis
2. **Auto-Calculate**: Kalkulasi biaya bahan porsi otomatis
3. **Data Consistency**: Data konsisten dengan master data barang gizi
4. **Searchable**: Pencarian mudah dengan autocomplete
5. **Audit Trail**: Dapat melacak sumber data (auto-filled vs manual)
6. **Performance**: Menggunakan trigger untuk performa optimal

## Cara Penggunaan

### 1. Pencarian Barang:
```sql
SELECT * FROM get_barang_gizi_for_autocomplete('minyak');
```

### 2. Input Data Baru:
```sql
INSERT INTO bahan_porsi (kode, jenis_makanan, data_barang_gizi_id, konsumsi, biaya_produksi) 
VALUES ('gz.001', 'Nasi Putih', 'eb367ea4-1e87-4705-9898-b6943ea5bc0a', 2.5, 10);
```

### 3. Lihat Hasil:
```sql
SELECT * FROM view_bahan_porsi_with_barang_gizi WHERE kode = 'gz.001';
```

Implementasi ini memungkinkan frontend untuk membuat autocomplete search yang akan otomatis mengisi nama barang, satuan, dan harga, serta sistem akan menghitung biaya bahan porsi secara otomatis sesuai rumus yang ditentukan.
