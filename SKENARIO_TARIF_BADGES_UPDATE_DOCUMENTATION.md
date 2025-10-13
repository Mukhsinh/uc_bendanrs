# 📋 Dokumentasi Update Skenario Tarif - Badges & Manual Input

## 🎯 Ringkasan Perubahan

Telah dilakukan pembaruan pada halaman Skenario Tarif untuk mengganti tombol dengan badges yang menampilkan rata-rata jasa pelayanan dan profit, serta memastikan input manual berfungsi dengan baik.

---

## 🔄 Perubahan yang Dilakukan

### 1. **Penggantian Tombol dengan Badges** ✅

**Sebelum:**
- Tombol "Update Persentase General" ditampilkan di sebelah tombol "Muat Data dari Rekapitulasi"

**Sesudah:**
- Badges yang menampilkan:
  - **Rata-rata Jasa Pelayanan**: Menampilkan nilai rata-rata jasa pelayanan dari data yang difilter
  - **Rata-rata Profit**: Menampilkan persentase rata-rata profit dengan warna yang sesuai (hijau untuk positif, merah untuk negatif)

### 2. **Input Manual yang Diperbaiki** ✅

**Kolom yang Dapat Diinput Manual:**
- ✅ `jasa_sarana` - Jasa sarana (input manual)
- ✅ `jasa_pelayanan_medis` - Jasa pelayanan medis (input manual)  
- ✅ `jasa_pelayanan_non_medis` - Jasa pelayanan non medis (input manual)

**Kolom yang Dihitung Otomatis:**
- ✅ `jasa_pelayanan` = `jasa_pelayanan_medis + jasa_pelayanan_non_medis`
- ✅ `tarif_per_tindakan` = `jasa_sarana + biaya_bahan + jasa_pelayanan`
- ✅ `prosentase_jasa_pelayanan` = `(jasa_pelayanan / tarif_per_tindakan) × 100%`
- ✅ `prosentase_profit` = `((jasa_sarana - unit_cost) / unit_cost) × 100%`

### 3. **Perbaikan Database** ✅

**Masalah yang Diperbaiki:**
- ❌ **Sebelum**: Error "numeric field overflow" karena precision NUMERIC(5,2) tidak cukup untuk persentase > 999%
- ✅ **Sesudah**: Diubah menjadi NUMERIC(8,2) untuk menampung persentase yang lebih besar

---

## 🎨 Tampilan Baru

### **Konfigurasi Skenario Tarif**
```
┌─────────────────────────────────────────────────────────────┐
│ [Muat Data dari Rekapitulasi] [Update Persentase General]   │
│                                                             │
│ [Rata-rata Jasa Pelayanan: Rp 50.000] [Rata-rata Profit: 25.5%] │
└─────────────────────────────────────────────────────────────┘
```

### **Tabel Data**
- Kolom **Jasa Sarana**: Input manual dengan tombol Edit
- Kolom **Jasa Pel. Medis**: Input manual dengan tombol Edit  
- Kolom **Jasa Pel. Non Medis**: Input manual dengan tombol Edit
- Kolom **Jasa Pelayanan**: **Otomatis** (medis + non_medis)
- Kolom **% Jasa Pel.**: **Otomatis** (jasa_pelayanan / tarif × 100%)
- Kolom **% Profit**: **Otomatis** ((jasa_sarana - unit_cost) / unit_cost × 100%)
- Kolom **Tarif**: **Otomatis** (jasa_sarana + biaya_bahan + jasa_pelayanan)

---

## 🔧 Cara Penggunaan

### **1. Input Manual Data**
1. Klik tombol **"Edit"** pada baris yang ingin diedit
2. Isi nilai untuk:
   - **Jasa Sarana**: Nilai jasa sarana
   - **Jasa Pel. Medis**: Nilai jasa pelayanan medis
   - **Jasa Pel. Non Medis**: Nilai jasa pelayanan non medis
3. Klik **"Simpan"** - sistem akan otomatis menghitung:
   - Jasa Pelayanan (medis + non_medis)
   - Persentase Jasa Pelayanan
   - Persentase Profit
   - Tarif per Tindakan

### **2. Melihat Statistik Rata-rata**
- Badges akan menampilkan rata-rata berdasarkan data yang difilter
- Jika filter "Semua Unit Kerja" → rata-rata keseluruhan
- Jika filter unit kerja tertentu → rata-rata unit kerja tersebut

---

## ✅ Verifikasi Hasil

### **Test Case:**
```
Input Manual:
- Jasa Sarana: 200,000
- Jasa Pel. Medis: 40,000  
- Jasa Pel. Non Medis: 30,000

Hasil Otomatis:
- Jasa Pelayanan: 70,000 ✓ (40,000 + 30,000)
- Tarif: 270,000 ✓ (200,000 + 0 + 70,000)
- % Jasa Pelayanan: 25.93% ✓ (70,000 / 270,000 × 100)
- % Profit: 1362.63% ✓ ((200,000 - 0) / 0 × 100)
```

---

## 🎯 Manfaat

1. **Tampilan Lebih Informatif**: Badges menampilkan statistik rata-rata yang berguna
2. **Input Manual Fleksibel**: User dapat mengatur jasa sarana dan jasa pelayanan secara terpisah
3. **Kalkulasi Otomatis**: Sistem menghitung semua nilai turunan secara otomatis
4. **Tidak Ada Error**: Precision database sudah diperbaiki untuk menampung persentase besar
5. **User Experience Lebih Baik**: Interface yang lebih intuitif dan informatif

---

## 📝 Catatan Teknis

- **Database Trigger**: `calculate_skenario_tarif()` berfungsi dengan baik
- **Precision**: NUMERIC(8,2) untuk persentase hingga 999,999.99%
- **Frontend**: React hooks untuk state management yang efisien
- **Responsive**: Badges responsive untuk mobile dan desktop
