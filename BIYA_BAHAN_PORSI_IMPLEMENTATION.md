# Implementasi Kolom 'Biaya Bahan Porsi' pada Tabel Bahan Porsi

## Ringkasan
Berhasil menambahkan kolom baru `biaya_bahan_porsi` pada tabel `bahan_porsi` dengan rumus perhitungan sesuai urutan langkah yang diminta.

## Rumus Perhitungan

### Langkah-langkah Perhitungan:
1. **Poin 1**: Penjumlahan seluruh harga bahan (`konsumsi * harga`)
2. **Poin 2**: Perkalian harga bahan dikalikan dengan persentase biaya produksi (`(konsumsi * harga) * biaya_produksi / 100`)
3. **Poin 3**: Penjumlahan poin 1 dan poin 2 = biaya bahan porsi

### Formula Matematis:
```
biaya_bahan_porsi = (konsumsi * harga) + ((konsumsi * harga) * biaya_produksi / 100)
```

## Implementasi Database

### 1. Kolom Baru
```sql
ALTER TABLE bahan_porsi 
ADD COLUMN biaya_bahan_porsi NUMERIC GENERATED ALWAYS AS (
  -- Poin 1: Penjumlahan seluruh harga bahan (konsumsi * harga)
  (konsumsi * harga) + 
  -- Poin 2: Perkalian harga bahan dikalikan dengan persentase biaya produksi
  ((konsumsi * harga) * COALESCE(biaya_produksi, 0) / 100)
  -- Poin 3: Hasil penjumlahan poin 1 dan poin 2 = biaya bahan porsi
) STORED;
```

### 2. Fungsi Perhitungan Total
```sql
CREATE OR REPLACE FUNCTION calculate_total_biaya_bahan_porsi()
RETURNS TABLE (
    total_harga_bahan NUMERIC,
    total_biaya_produksi NUMERIC,
    total_biaya_bahan_porsi NUMERIC
) 
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        -- Poin 1: Total penjumlahan seluruh harga bahan
        SUM(harga_bah) as total_harga_bahan,
        -- Poin 2: Total perkalian harga bahan dengan persentase biaya produksi
        SUM(harga_bah * COALESCE(biaya_produksi, 0) / 100) as total_biaya_produksi,
        -- Poin 3: Total biaya bahan porsi (poin 1 + poin 2)
        SUM(biaya_bahan_porsi) as total_biaya_bahan_porsi
    FROM bahan_porsi;
END;
$$;
```

### 3. View Summary
```sql
CREATE OR REPLACE VIEW view_biaya_bahan_porsi_summary AS
SELECT 
    kode,
    jenis_makanan,
    nama_barang,
    satuan,
    konsumsi,
    harga,
    harga_bah,
    biaya_produksi,
    biaya_bahan_porsi,
    -- Breakdown perhitungan
    ROUND(harga_bah * COALESCE(biaya_produksi, 0) / 100, 2) AS biaya_produksi_amount,
    -- Persentase dari total
    ROUND((biaya_bahan_porsi / NULLIF((SELECT SUM(biaya_bahan_porsi) FROM bahan_porsi), 0) * 100), 2) AS persentase_dari_total
FROM bahan_porsi
ORDER BY biaya_bahan_porsi DESC;
```

## Contoh Perhitungan

### Data Sample:
| Kode | Jenis Makanan | Nama Barang | Konsumsi | Harga | Harga Bahan | Biaya Produksi (%) | Biaya Bahan Porsi |
|------|---------------|-------------|----------|-------|-------------|-------------------|------------------|
| gz.001 | Nasi Putih | Beras | 2.5 kg | 15,000 | 37,500 | 10% | 41,250 |
| gz.002 | Nasi Putih | Minyak Goreng | 0.3 liter | 25,000 | 7,500 | 15% | 8,625 |
| gz.003 | Sayur Asem | Kacang Panjang | 0.5 kg | 12,000 | 6,000 | 20% | 7,200 |
| gz.004 | Sayur Asem | Asam Jawa | 0.1 kg | 8,000 | 800 | 10% | 880 |
| gz.005 | Daging Rendang | Daging Sapi | 1.0 kg | 80,000 | 80,000 | 25% | 100,000 |

### Breakdown Perhitungan Detail:

#### Contoh 1: Beras (gz.001)
- **Poin 1**: Harga bahan = 2.5 × 15,000 = 37,500
- **Poin 2**: Biaya produksi = 37,500 × 10% = 3,750
- **Poin 3**: Biaya bahan porsi = 37,500 + 3,750 = **41,250**

#### Contoh 2: Daging Sapi (gz.005)
- **Poin 1**: Harga bahan = 1.0 × 80,000 = 80,000
- **Poin 2**: Biaya produksi = 80,000 × 25% = 20,000
- **Poin 3**: Biaya bahan porsi = 80,000 + 20,000 = **100,000**

## Total Keseluruhan

### Hasil Fungsi `calculate_total_biaya_bahan_porsi()`:
- **Total Harga Bahan**: 131,800
- **Total Biaya Produksi**: 26,155
- **Total Biaya Bahan Porsi**: 157,955

## Cara Penggunaan

### 1. Query Data dengan Perhitungan:
```sql
SELECT 
    kode,
    nama_barang,
    harga_bah,
    biaya_produksi,
    biaya_bahan_porsi,
    CONCAT(
        'Poin 1 (Harga Bahan): ', harga_bah, 
        ' + Poin 2 (Biaya Produksi): ', ROUND((harga_bah * biaya_produksi / 100), 2),
        ' = Total: ', biaya_bahan_porsi
    ) AS breakdown_perhitungan
FROM bahan_porsi 
ORDER BY kode;
```

### 2. Lihat Summary:
```sql
SELECT * FROM view_biaya_bahan_porsi_summary;
```

### 3. Hitung Total:
```sql
SELECT * FROM calculate_total_biaya_bahan_porsi();
```

## Keunggulan Implementasi

1. **Otomatis**: Kolom `biaya_bahan_porsi` dihitung otomatis setiap kali data diupdate
2. **Akurat**: Menggunakan GENERATED COLUMN untuk memastikan konsistensi data
3. **Fleksibel**: Bisa menangani nilai NULL pada `biaya_produksi`
4. **Transparan**: Breakdown perhitungan jelas dan bisa diakses
5. **Efisien**: Menggunakan STORED untuk performa optimal

## Catatan Teknis

- Kolom `biaya_bahan_porsi` adalah GENERATED COLUMN yang dihitung secara otomatis
- Menggunakan `COALESCE(biaya_produksi, 0)` untuk menangani nilai NULL
- Persentase biaya produksi dalam format decimal (10 untuk 10%, 25 untuk 25%)
- Semua perhitungan menggunakan tipe data NUMERIC untuk presisi tinggi
