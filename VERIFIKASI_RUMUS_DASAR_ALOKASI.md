# ✅ VERIFIKASI RUMUS DASAR ALOKASI - KALKULASI BIAYA OPERATIF

Tanggal: 1 Oktober 2025  
Status: **VERIFIED & CORRECT**

---

## 📐 RUMUS YANG DIGUNAKAN

### 1. Dasar Alokasi Waktu
```
dasar_alokasi_waktu = hasil_kali_waktu / TOTAL(hasil_kali_waktu)
```
**Presisi**: 6 angka di belakang desimal (ROUND(..., 6))

### 2. Dasar Alokasi Hasil Kali
```
dasar_alokasi_hasil_kali = hasil_kali / TOTAL(hasil_kali)
```
**Presisi**: 6 angka di belakang desimal (ROUND(..., 6))

---

## 🔍 IMPLEMENTASI FUNCTION

### Function: `fix_dasar_alokasi_operatif`

```sql
CREATE OR REPLACE FUNCTION public.fix_dasar_alokasi_operatif(
    p_tahun integer, 
    p_user_id uuid DEFAULT auth.uid()
)
RETURNS void
LANGUAGE plpgsql
AS $function$
DECLARE
    v_total_hasil_kali numeric := 0;
    v_total_hasil_kali_waktu numeric := 0;
BEGIN
    -- Step 1: Hitung total hasil_kali dan hasil_kali_waktu
    SELECT 
        COALESCE(SUM(hasil_kali), 0),
        COALESCE(SUM(hasil_kali_waktu), 0)
    INTO 
        v_total_hasil_kali,
        v_total_hasil_kali_waktu
    FROM public.kalkulasi_biaya_operatif
    WHERE tahun = p_tahun AND user_id = p_user_id;

    -- Step 2: Update dasar alokasi untuk setiap baris
    UPDATE public.kalkulasi_biaya_operatif
    SET
        dasar_alokasi_waktu = CASE 
            WHEN v_total_hasil_kali_waktu > 0 
            THEN ROUND((hasil_kali_waktu::numeric / v_total_hasil_kali_waktu)::numeric, 6)
            ELSE 0
        END,
        dasar_alokasi_hasil_kali = CASE 
            WHEN v_total_hasil_kali > 0 
            THEN ROUND((hasil_kali::numeric / v_total_hasil_kali)::numeric, 6)
            ELSE 0
        END
    WHERE tahun = p_tahun AND user_id = p_user_id;
END;
$function$
```

---

## 📊 DATA AKTUAL (Tahun 2025)

### Total Absolut:
| Kolom | Nilai Total |
|-------|-------------|
| **Total hasil_kali** | 5,698,040 |
| **Total hasil_kali_waktu** | 308,875 |

---

## 💡 CONTOH PERHITUNGAN DETAIL

### Tindakan 1: EXSOSTOMY (Kode: 3.01.013)

**Input Data:**
- Jumlah: 1
- Waktu Pemeriksaan: 30 menit
- Profesionalisme: 4
- Tingkat Kesulitan: 1
- **hasil_kali**: 4 × 1 × 30 = 120
- **hasil_kali_waktu**: 30

**Perhitungan:**

#### 1. Dasar Alokasi Waktu:
```
dasar_alokasi_waktu = hasil_kali_waktu / TOTAL(hasil_kali_waktu)
                    = 30 / 308,875
                    = 0.000097122...
                    = 0.000097 (rounded to 6 decimals)
```

#### 2. Dasar Alokasi Hasil Kali:
```
dasar_alokasi_hasil_kali = hasil_kali / TOTAL(hasil_kali)
                         = 120 / 5,698,040
                         = 0.000021062...
                         = 0.000021 (rounded to 6 decimals)
```

**Verifikasi**: ✅ MATCH dengan data di database

---

### Tindakan 2: CRANIOTOMY TUMOR REMOVAL (Kode: 3.02.001)

**Input Data:**
- Jumlah: 26
- Waktu Pemeriksaan: 240 menit
- Profesionalisme: 4
- Tingkat Kesulitan: 7
- **hasil_kali**: 4 × 7 × 240 × 26 = 174,720
- **hasil_kali_waktu**: 240 × 26 = 6,240

**Perhitungan:**

#### 1. Dasar Alokasi Waktu:
```
dasar_alokasi_waktu = 6,240 / 308,875
                    = 0.020202121...
                    = 0.020202 (rounded to 6 decimals)
```

#### 2. Dasar Alokasi Hasil Kali:
```
dasar_alokasi_hasil_kali = 174,720 / 5,698,040
                         = 0.030663436...
                         = 0.030663 (rounded to 6 decimals)
```

**Verifikasi**: ✅ MATCH dengan data di database

---

### Tindakan 3: MILES (Kode: 3.04.017)

**Input Data:**
- Jumlah: 11
- Waktu Pemeriksaan: 240 menit
- Profesionalisme: 4
- Tingkat Kesulitan: 4
- **hasil_kali**: 4 × 4 × 240 × 11 = 42,240
- **hasil_kali_waktu**: 240 × 11 = 2,640

**Perhitungan:**

#### 1. Dasar Alokasi Waktu:
```
dasar_alokasi_waktu = 2,640 / 308,875
                    = 0.008547487...
                    = 0.008547 (rounded to 6 decimals)
```

#### 2. Dasar Alokasi Hasil Kali:
```
dasar_alokasi_hasil_kali = 42,240 / 5,698,040
                         = 0.007412585...
                         = 0.007413 (rounded to 6 decimals)
```

**Verifikasi**: ✅ MATCH dengan data di database

---

## 🎯 VERIFIKASI LENGKAP (Top 10 Tindakan)

| No | Kode | Nama Tindakan | hasil_kali | hasil_kali_waktu | dasar_waktu | dasar_hasil_kali | Status |
|----|------|---------------|------------|------------------|-------------|------------------|--------|
| 1 | 3.02.001 | CRANIOTOMY TUMOR REMOVAL | 174,720 | 6,240 | 0.020202 | 0.030663 | ✅ MATCH |
| 2 | 3.04.017 | MILES | 42,240 | 2,640 | 0.008547 | 0.007413 | ✅ MATCH |
| 3 | 3.04.016 | WHIPPLE | 21,120 | 2,640 | 0.008547 | 0.003707 | ✅ MATCH |
| 4 | 3.05.021 | PARTIAL HIP/THR | 146,880 | 6,120 | 0.019814 | 0.025777 | ✅ MATCH |
| 5 | 3.05.020 | TKR | 43,200 | 2,160 | 0.006993 | 0.007582 | ✅ MATCH |
| 6 | 3.02.007 | LAMINEKTOMY | 23,520 | 840 | 0.002720 | 0.004128 | ✅ MATCH |
| 7 | 3.04.014 | LAR/V LAR | 40,320 | 1,440 | 0.004662 | 0.007076 | ✅ MATCH |
| 8 | 3.06.037 | LAPARASCOPY CHOLECYSTECTOMY | 8,640 | 360 | 0.001166 | 0.001516 | ✅ MATCH |
| 9 | 3.05.002 | ORIF FEMUR | 55,200 | 2,760 | 0.008936 | 0.009688 | ✅ MATCH |
| 10 | 3.04.024 | HEPATECTOMY | 9,600 | 480 | 0.001554 | 0.001685 | ✅ MATCH |

---

## 📈 VALIDASI TOTAL

### Validasi 1: Semua Row Match
- **Total Rows**: 213
- **Rows Match (dasar_waktu)**: 213 (100%)
- **Rows Match (dasar_hasil_kali)**: 213 (100%)
- **Status**: ✅ **ALL MATCH**

### Validasi 2: Total Harus = 1.00
Karena kita membagi setiap nilai dengan total absolut, maka penjumlahan semua dasar alokasi harus = 1.00

```
SUM(dasar_alokasi_waktu) = 1.000004 ≈ 1.00 ✅
SUM(dasar_alokasi_hasil_kali) = 0.999994 ≈ 1.00 ✅
```

> **Catatan**: Perbedaan kecil (±0.000006) disebabkan oleh pembulatan 6 desimal di setiap row.

---

## 🔍 FORMULA STEP-BY-STEP

### Untuk Setiap Tindakan Operatif:

1. **Hitung hasil_kali**:
   ```
   hasil_kali = profesionalisme × tingkat_kesulitan × waktu_pemeriksaan × jumlah
   ```

2. **Hitung hasil_kali_waktu**:
   ```
   hasil_kali_waktu = waktu_pemeriksaan × jumlah
   ```

3. **Hitung TOTAL untuk semua tindakan**:
   ```
   TOTAL_hasil_kali = SUM(hasil_kali untuk semua row)
   TOTAL_hasil_kali_waktu = SUM(hasil_kali_waktu untuk semua row)
   ```

4. **Hitung dasar_alokasi_waktu**:
   ```
   dasar_alokasi_waktu = ROUND(hasil_kali_waktu / TOTAL_hasil_kali_waktu, 6)
   ```

5. **Hitung dasar_alokasi_hasil_kali**:
   ```
   dasar_alokasi_hasil_kali = ROUND(hasil_kali / TOTAL_hasil_kali, 6)
   ```

---

## ✅ KESIMPULAN

### Status: **VERIFIED ✅**

1. ✅ Rumus **dasar_alokasi_waktu** sudah benar
   - Formula: `hasil_kali_waktu / TOTAL(hasil_kali_waktu)`
   - Presisi: 6 desimal
   
2. ✅ Rumus **dasar_alokasi_hasil_kali** sudah benar
   - Formula: `hasil_kali / TOTAL(hasil_kali)`
   - Presisi: 6 desimal

3. ✅ **100% data match** (213/213 rows)

4. ✅ **Total validasi** = 1.00 (dengan toleransi ±0.000006)

5. ✅ **Function** `fix_dasar_alokasi_operatif` berjalan dengan benar

### Tidak Ada Perubahan yang Diperlukan
Sistem sudah menggunakan rumus yang benar sesuai dengan spesifikasi:
- Nilai baris dibagi dengan total absolut
- Menggunakan 6 angka di belakang desimal
- Semua perhitungan akurat dan terverifikasi

---

**Generated by**: Sistem Verifikasi Kalkulasi  
**Date**: 1 Oktober 2025  
**Status**: ✅ PRODUCTION VERIFIED

