# Perbaikan Implementasi Biaya Bahan Porsi untuk Multiple Bahan per Jenis Makanan

## Masalah yang Ditemukan
Implementasi sebelumnya tidak mempertimbangkan bahwa satu jenis makanan dapat menggunakan lebih dari satu bahan. Perhitungan dilakukan per bahan individual tanpa mengelompokkan berdasarkan jenis makanan.

## Perbaikan yang Dilakukan

### 1. Penambahan Data Sample Multiple Bahan
Menambahkan data sample yang lebih realistis dengan multiple bahan per jenis makanan:

```sql
-- Contoh data yang ditambahkan:
- Nasi Putih: 4 bahan (Beras, Minyak Goreng, Garam, Air)
- Sayur Asem: 5 bahan (Kacang Panjang, Asam Jawa, Terasi, Cabai Merah, Bawang Merah)  
- Daging Rendang: 3 bahan (Daging Sapi, Santan, Bumbu Rendang)
- Gado-gado: 5 bahan (Sayuran Campur, Tahu, Tempe, Bumbu Kacang, Kerupuk)
```

### 2. Fungsi Perhitungan per Jenis Makanan
Membuat fungsi `calculate_biaya_bahan_porsi_per_jenis_makanan()` yang mengelompokkan perhitungan berdasarkan jenis makanan:

```sql
CREATE OR REPLACE FUNCTION calculate_biaya_bahan_porsi_per_jenis_makanan()
RETURNS TABLE (
    jenis_makanan TEXT,
    jumlah_bahan BIGINT,
    daftar_bahan TEXT,
    total_harga_bahan NUMERIC,
    total_biaya_produksi NUMERIC,
    total_biaya_bahan_porsi NUMERIC,
    breakdown_perhitungan TEXT
) 
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        bp.jenis_makanan,
        COUNT(*) as jumlah_bahan,
        STRING_AGG(bp.nama_barang, ', ' ORDER BY bp.kode) as daftar_bahan,
        -- Poin 1: Total penjumlahan seluruh harga bahan per jenis makanan
        SUM(bp.harga_bah) as total_harga_bahan,
        -- Poin 2: Total perkalian harga bahan dengan persentase biaya produksi per jenis makanan
        SUM(bp.harga_bah * COALESCE(bp.biaya_produksi, 0) / 100) as total_biaya_produksi,
        -- Poin 3: Total biaya bahan porsi per jenis makanan (poin 1 + poin 2)
        SUM(bp.biaya_bahan_porsi) as total_biaya_bahan_porsi,
        -- Breakdown perhitungan
        CONCAT(
            'Poin 1 (Total Harga Bahan): ', SUM(bp.harga_bah),
            ' + Poin 2 (Total Biaya Produksi): ', ROUND(SUM(bp.harga_bah * COALESCE(bp.biaya_produksi, 0) / 100), 2),
            ' = Total Biaya Bahan Porsi: ', SUM(bp.biaya_bahan_porsi)
        ) as breakdown_perhitungan
    FROM bahan_porsi bp
    GROUP BY bp.jenis_makanan
    ORDER BY SUM(bp.biaya_bahan_porsi) DESC;
END;
$$;
```

### 3. View Detail untuk Analisis
Membuat view `view_detail_biaya_bahan_porsi` untuk melihat detail per bahan:

```sql
CREATE OR REPLACE VIEW view_detail_biaya_bahan_porsi AS
SELECT 
    kode,
    jenis_makanan,
    nama_barang,
    satuan,
    konsumsi,
    harga,
    harga_bah,
    biaya_produksi,
    -- Perhitungan biaya produksi per bahan
    ROUND(harga_bah * COALESCE(biaya_produksi, 0) / 100, 2) AS biaya_produksi_amount,
    biaya_bahan_porsi,
    -- Menampilkan urutan bahan dalam jenis makanan
    ROW_NUMBER() OVER (PARTITION BY jenis_makanan ORDER BY kode) as urutan_bahan,
    -- Menampilkan total bahan dalam jenis makanan
    COUNT(*) OVER (PARTITION BY jenis_makanan) as total_bahan_per_jenis,
    -- Menampilkan persentase bahan terhadap total jenis makanan
    ROUND((biaya_bahan_porsi / NULLIF(SUM(biaya_bahan_porsi) OVER (PARTITION BY jenis_makanan), 0) * 100), 2) AS persentase_dalam_jenis_makanan
FROM bahan_porsi
ORDER BY jenis_makanan, kode;
```

## Contoh Perhitungan Detail

### Contoh 1: Nasi Putih (4 Bahan)

| Urutan | Bahan | Jumlah | Harga | Harga Bahan | Biaya Produksi (%) | Biaya Produksi (Rp) | Biaya Bahan Porsi |
|--------|-------|--------|-------|-------------|-------------------|-------------------|------------------|
| 1 | Beras | 2.5 kg | 15,000 | 37,500 | 10% | 3,750 | 41,250 |
| 2 | Minyak Goreng | 0.3 liter | 25,000 | 7,500 | 15% | 1,125 | 8,625 |
| 3 | Garam | 10 gram | 500 | 5,000 | 5% | 250 | 5,250 |
| 4 | Air | 3 liter | 2,000 | 6,000 | 0% | 0 | 6,000 |

**Total Nasi Putih:**
- **Poin 1 (Total Harga Bahan)**: 37,500 + 7,500 + 5,000 + 6,000 = **56,000**
- **Poin 2 (Total Biaya Produksi)**: 3,750 + 1,125 + 250 + 0 = **5,125**
- **Poin 3 (Total Biaya Bahan Porsi)**: 41,250 + 8,625 + 5,250 + 6,000 = **61,125**

### Contoh 2: Sayur Asem (5 Bahan)

| Urutan | Bahan | Jumlah | Harga | Harga Bahan | Biaya Produksi (%) | Biaya Produksi (Rp) | Biaya Bahan Porsi |
|--------|-------|--------|-------|-------------|-------------------|-------------------|------------------|
| 1 | Kacang Panjang | 0.5 kg | 12,000 | 6,000 | 20% | 1,200 | 7,200 |
| 2 | Asam Jawa | 0.1 kg | 8,000 | 800 | 10% | 80 | 880 |
| 3 | Terasi | 5 gram | 3,000 | 15,000 | 10% | 1,500 | 16,500 |
| 4 | Cabai Merah | 20 gram | 25,000 | 500,000 | 15% | 75,000 | 575,000 |
| 5 | Bawang Merah | 30 gram | 15,000 | 450,000 | 12% | 54,000 | 504,000 |

**Total Sayur Asem:**
- **Poin 1 (Total Harga Bahan)**: 6,000 + 800 + 15,000 + 500,000 + 450,000 = **971,800**
- **Poin 2 (Total Biaya Produksi)**: 1,200 + 80 + 1,500 + 75,000 + 54,000 = **131,780**
- **Poin 3 (Total Biaya Bahan Porsi)**: 7,200 + 880 + 16,500 + 575,000 + 504,000 = **1,103,580**

## Hasil Perhitungan per Jenis Makanan

| Jenis Makanan | Jumlah Bahan | Total Harga Bahan (Poin 1) | Total Biaya Produksi (Poin 2) | Total Biaya Bahan Porsi (Poin 3) |
|---------------|--------------|---------------------------|------------------------------|--------------------------------|
| Gado-gado | 5 | 1,244,000 | 306,700 | 1,550,700 |
| Sayur Asem | 5 | 971,800 | 131,780 | 1,103,580 |
| Daging Rendang | 3 | 486,000 | 92,480 | 578,480 |
| Nasi Putih | 4 | 56,000 | 5,125 | 61,125 |

## Grand Total Keseluruhan

- **Total Jenis Makanan**: 4 jenis
- **Total Bahan Seluruhnya**: 17 bahan
- **GRAND TOTAL Harga Bahan (Poin 1)**: 2,757,800
- **GRAND TOTAL Biaya Produksi (Poin 2)**: 536,085
- **GRAND TOTAL Biaya Bahan Porsi (Poin 3)**: 3,293,885

## Cara Menggunakan

### 1. Lihat Perhitungan per Jenis Makanan:
```sql
SELECT * FROM calculate_biaya_bahan_porsi_per_jenis_makanan();
```

### 2. Lihat Detail per Bahan:
```sql
SELECT 
    jenis_makanan,
    urutan_bahan,
    nama_barang,
    harga_bah,
    biaya_produksi,
    biaya_bahan_porsi,
    persentase_dalam_jenis_makanan
FROM view_detail_biaya_bahan_porsi
ORDER BY jenis_makanan, urutan_bahan;
```

### 3. Lihat Grand Total:
```sql
SELECT 
    COUNT(DISTINCT jenis_makanan) as total_jenis_makanan,
    SUM(jumlah_bahan) as total_bahan_seluruhnya,
    SUM(total_harga_bahan) as grand_total_harga_bahan,
    SUM(total_biaya_produksi) as grand_total_biaya_produksi,
    SUM(total_biaya_bahan_porsi) as grand_total_biaya_bahan_porsi
FROM calculate_biaya_bahan_porsi_per_jenis_makanan();
```

## Keunggulan Perbaikan

1. **Akurat**: Perhitungan dilakukan per jenis makanan, bukan per bahan individual
2. **Transparan**: Breakdown jelas untuk setiap jenis makanan dan bahan
3. **Fleksibel**: Dapat menangani berapa pun jumlah bahan per jenis makanan
4. **Analisis Mendalam**: Menampilkan persentase kontribusi setiap bahan
5. **Skalable**: Mudah ditambahkan jenis makanan atau bahan baru

## Rumus yang Benar

Untuk setiap jenis makanan:
```
Total Biaya Bahan Porsi = Σ(harga_bahan_i) + Σ(harga_bahan_i × biaya_produksi_i ÷ 100)
```

Dimana `i` adalah setiap bahan dalam jenis makanan tersebut.
