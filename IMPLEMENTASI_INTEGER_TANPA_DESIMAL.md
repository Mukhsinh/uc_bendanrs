# Implementasi Biaya Bahan Porsi dengan Integer Tanpa Desimal

## Ringkasan
Berhasil mengubah implementasi biaya bahan porsi untuk menggunakan angka integer tanpa desimal, sesuai permintaan user. Semua perhitungan dan tampilan sekarang menggunakan bilangan bulat.

## Perubahan Database

### 1. Update Kolom Generated
```sql
-- Hapus dan buat ulang kolom dengan tipe INTEGER
ALTER TABLE bahan_porsi DROP COLUMN IF EXISTS harga_bah;
ALTER TABLE bahan_porsi DROP COLUMN IF EXISTS biaya_bahan_porsi;

-- Tambahkan kembali kolom dengan tipe integer
ALTER TABLE bahan_porsi 
ADD COLUMN harga_bah INTEGER GENERATED ALWAYS AS (ROUND(konsumsi * harga)) STORED,
ADD COLUMN biaya_bahan_porsi INTEGER GENERATED ALWAYS AS (
  ROUND(konsumsi * harga) + 
  ROUND(ROUND(konsumsi * harga) * COALESCE(biaya_produksi, 0) / 100)
) STORED;
```

### 2. Update Fungsi Perhitungan
```sql
-- Fungsi perhitungan dengan integer
CREATE OR REPLACE FUNCTION calculate_biaya_bahan_porsi_per_jenis_makanan()
RETURNS TABLE (
    jenis_makanan TEXT,
    jumlah_bahan BIGINT,
    daftar_bahan TEXT,
    total_harga_bahan INTEGER,
    total_biaya_produksi INTEGER,
    total_biaya_bahan_porsi INTEGER,
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
        -- Poin 1: Total penjumlahan seluruh harga bahan per jenis makanan (integer)
        SUM(bp.harga_bah)::INTEGER as total_harga_bahan,
        -- Poin 2: Total perkalian harga bahan dengan persentase biaya produksi per jenis makanan (integer)
        SUM(ROUND(bp.harga_bah * COALESCE(bp.biaya_produksi, 0) / 100))::INTEGER as total_biaya_produksi,
        -- Poin 3: Total biaya bahan porsi per jenis makanan (poin 1 + poin 2) (integer)
        SUM(bp.biaya_bahan_porsi)::INTEGER as total_biaya_bahan_porsi,
        -- Breakdown perhitungan
        CONCAT(
            'Poin 1 (Total Harga Bahan): ', SUM(bp.harga_bah)::INTEGER,
            ' + Poin 2 (Total Biaya Produksi): ', SUM(ROUND(bp.harga_bah * COALESCE(bp.biaya_produksi, 0) / 100))::INTEGER,
            ' = Total Biaya Bahan Porsi: ', SUM(bp.biaya_bahan_porsi)::INTEGER
        ) as breakdown_perhitungan
    FROM bahan_porsi bp
    GROUP BY bp.jenis_makanan
    ORDER BY SUM(bp.biaya_bahan_porsi) DESC;
END;
$$;
```

### 3. Update View
```sql
-- View dengan integer
CREATE OR REPLACE VIEW view_bahan_porsi_with_barang_gizi AS
SELECT 
    bp.id,
    bp.kode,
    bp.jenis_makanan,
    bp.nama_barang,
    bp.satuan,
    bp.konsumsi,
    bp.harga,
    bp.harga_bah, -- INTEGER
    bp.biaya_produksi,
    bp.biaya_bahan_porsi, -- INTEGER
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
    -- Breakdown perhitungan (integer)
    ROUND(bp.harga_bah * COALESCE(bp.biaya_produksi, 0) / 100) AS biaya_produksi_amount,
    CONCAT(
        'Poin 1 (Harga Bahan): ', bp.harga_bah,
        ' + Poin 2 (Biaya Produksi): ', ROUND(bp.harga_bah * COALESCE(bp.biaya_produksi, 0) / 100),
        ' = Total: ', bp.biaya_bahan_porsi
    ) AS breakdown_perhitungan
FROM bahan_porsi bp
LEFT JOIN data_barang_gizi dbg ON bp.data_barang_gizi_id = dbg.id
ORDER BY bp.jenis_makanan, bp.kode;
```

## Rumus Perhitungan Integer

### Rumus Matematis:
```
harga_bah = ROUND(konsumsi × harga)
biaya_produksi_amount = ROUND(harga_bah × biaya_produksi ÷ 100)
biaya_bahan_porsi = harga_bah + biaya_produksi_amount
```

### Langkah-langkah:
1. **Poin 1**: `harga_bah = ROUND(konsumsi × harga)`
2. **Poin 2**: `biaya_produksi_amount = ROUND(harga_bah × biaya_produksi ÷ 100)`
3. **Poin 3**: `biaya_bahan_porsi = harga_bah + biaya_produksi_amount`

## Contoh Perhitungan Integer

### Data Test:
| Kode | Nama Barang | Konsumsi | Harga | Harga Bahan | Biaya Produksi | Biaya Bahan Porsi |
|------|-------------|----------|-------|-------------|----------------|------------------|
| test-int.001 | Tepung Beras | 2.5 bungkus | 8,250 | 20,625 | 10% | 22,688 |
| test-int.002 | Minyak Goreng | 0.3 Liter | 21,500 | 6,450 | 15% | 7,418 |
| test-int.003 | Garam | 10 bungkus | 5,200 | 52,000 | 5% | 54,600 |

### Breakdown Perhitungan Detail:

#### Contoh 1: Tepung Beras (test-int.001)
- **Konsumsi**: 2.5 bungkus
- **Harga**: Rp 8,250/bungkus
- **Poin 1 (Harga Bahan)**: ROUND(2.5 × 8,250) = ROUND(20,625) = **20,625**
- **Poin 2 (Biaya Produksi)**: ROUND(20,625 × 10%) = ROUND(2,062.5) = **2,063**
- **Poin 3 (Total)**: 20,625 + 2,063 = **22,688**

#### Contoh 2: Minyak Goreng (test-int.002)
- **Konsumsi**: 0.3 Liter
- **Harga**: Rp 21,500/Liter
- **Poin 1 (Harga Bahan)**: ROUND(0.3 × 21,500) = ROUND(6,450) = **6,450**
- **Poin 2 (Biaya Produksi)**: ROUND(6,450 × 15%) = ROUND(967.5) = **968**
- **Poin 3 (Total)**: 6,450 + 968 = **7,418**

#### Contoh 3: Garam (test-int.003)
- **Konsumsi**: 10 bungkus
- **Harga**: Rp 5,200/bungkus
- **Poin 1 (Harga Bahan)**: ROUND(10 × 5,200) = ROUND(52,000) = **52,000**
- **Poin 2 (Biaya Produksi)**: ROUND(52,000 × 5%) = ROUND(2,600) = **2,600**
- **Poin 3 (Total)**: 52,000 + 2,600 = **54,600**

## Total per Jenis Makanan

### Jenis Makanan "Test Integer":
- **Jumlah Bahan**: 3 bahan
- **Total Harga Bahan (Poin 1)**: 79,075
- **Total Biaya Produksi (Poin 2)**: 5,631
- **Total Biaya Bahan Porsi (Poin 3)**: 84,706

### Breakdown Total:
```
Poin 1 (Total Harga Bahan): 79075 + Poin 2 (Total Biaya Produksi): 5631 = Total Biaya Bahan Porsi: 84706
```

## Perubahan Frontend

### 1. Update Komponen BahanPorsiForm
```typescript
// Calculate biaya bahan porsi (integer tanpa desimal)
const calculateBiayaBahanPorsi = () => {
  if (!selectedBarang || formData.konsumsi <= 0) return 0;
  
  const hargaBahan = Math.round(formData.konsumsi * selectedBarang.harga);
  const biayaProduksi = Math.round(hargaBahan * (formData.biayaProduksi / 100));
  
  return hargaBahan + biayaProduksi;
};
```

### 2. Update Display
```typescript
// Harga Bahan - Auto-calculated (integer)
<Input 
  id="harga-bahan" 
  value={selectedBarang && formData.konsumsi > 0 
    ? Math.round(formData.konsumsi * selectedBarang.harga).toLocaleString() 
    : '0'
  } 
  readOnly 
  className="bg-gray-100"
/>

// Breakdown Perhitungan (integer)
<div>Poin 1 (Harga Bahan): {formData.konsumsi} × {selectedBarang.harga?.toLocaleString()} = {Math.round(formData.konsumsi * selectedBarang.harga).toLocaleString()}</div>
<div>Poin 2 (Biaya Produksi): {Math.round(formData.konsumsi * selectedBarang.harga).toLocaleString()} × {formData.biayaProduksi}% = {Math.round(Math.round(formData.konsumsi * selectedBarang.harga) * formData.biayaProduksi / 100).toLocaleString()}</div>
<div className="font-semibold">Poin 3 (Total): {Math.round(formData.konsumsi * selectedBarang.harga).toLocaleString()} + {Math.round(Math.round(formData.konsumsi * selectedBarang.harga) * formData.biayaProduksi / 100).toLocaleString()} = {calculateBiayaBahanPorsi().toLocaleString()}</div>
```

### 3. Update Interface
```typescript
export interface BahanPorsi {
  id?: string;
  kode: string;
  jenis_makanan: string;
  nama_barang: string;
  satuan: string;
  konsumsi: number;
  harga: number;
  harga_bah: number; // Integer tanpa desimal
  biaya_produksi: number;
  biaya_bahan_porsi: number; // Integer tanpa desimal
  data_barang_gizi_id?: string;
  sumber_data?: string;
  breakdown_perhitungan?: string;
}
```

## Keunggulan Implementasi Integer

### 1. **Konsistensi Data**:
- Semua perhitungan menggunakan integer tanpa desimal
- Tidak ada rounding error pada display
- Data lebih mudah dibaca dan dipahami

### 2. **Performance**:
- Perhitungan integer lebih cepat daripada decimal
- Storage lebih efisien
- Query performance lebih baik

### 3. **User Experience**:
- Angka yang ditampilkan lebih bersih tanpa desimal
- Format currency yang konsisten
- Perhitungan yang mudah dipahami

### 4. **Business Logic**:
- Sesuai dengan praktik akuntansi umum
- Mudah untuk laporan keuangan
- Konsisten dengan sistem lainnya

## Cara Penggunaan

### 1. Database Query:
```sql
-- Lihat data dengan integer
SELECT * FROM view_bahan_porsi_with_barang_gizi WHERE kode LIKE 'test-int.%';

-- Lihat total per jenis makanan
SELECT * FROM calculate_biaya_bahan_porsi_per_jenis_makanan() WHERE jenis_makanan = 'Test Integer';
```

### 2. Frontend Usage:
```typescript
// Kalkulasi otomatis dengan integer
const hargaBahan = Math.round(konsumsi * harga);
const biayaProduksi = Math.round(hargaBahan * (biayaProduksiPercent / 100));
const totalBiaya = hargaBahan + biayaProduksi;

// Display dengan format currency
const formattedAmount = totalBiaya.toLocaleString('id-ID');
```

### 3. API Response:
```json
{
  "kode": "test-int.001",
  "nama_barang": "Tepung Beras",
  "harga_bah": 20625,
  "biaya_bahan_porsi": 22688,
  "breakdown_perhitungan": "Poin 1 (Harga Bahan): 20625 + Poin 2 (Biaya Produksi): 2063 = Total: 22688"
}
```

## Testing dan Validasi

### 1. Data Test yang Berhasil:
- ✅ Perhitungan integer tanpa desimal
- ✅ Rounding function bekerja dengan benar
- ✅ Breakdown perhitungan akurat
- ✅ Display format currency konsisten
- ✅ Database trigger berfungsi normal

### 2. Edge Cases:
- ✅ Konsumsi dengan desimal (2.5, 0.3)
- ✅ Harga dengan angka besar
- ✅ Persentase biaya produksi yang menghasilkan desimal
- ✅ Rounding ke integer yang benar

Implementasi integer tanpa desimal ini memberikan hasil yang lebih bersih, konsisten, dan mudah dipahami untuk perhitungan biaya bahan porsi!
