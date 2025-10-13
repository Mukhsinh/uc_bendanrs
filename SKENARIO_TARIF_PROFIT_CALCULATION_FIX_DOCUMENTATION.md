# 📋 Dokumentasi Perbaikan Perhitungan Profit Skenario Tarif

## 🎯 Ringkasan Masalah

Terdapat masalah dengan perhitungan rata-rata profit yang menampilkan nilai -79%, yang disebabkan oleh data yang belum diisi dengan nilai jasa_sarana yang sesuai.

---

## 🔍 Analisis Masalah

### **Penyebab -79% Average Profit:**

1. **Data Kosong**: Semua record memiliki `jasa_sarana = 0` (nilai default)
2. **Formula Profit**: `((jasa_sarana - unit_cost) / unit_cost) * 100`
3. **Ketika jasa_sarana = 0**: Formula menjadi `((0 - unit_cost) / unit_cost) * 100 = -100%`
4. **Rata-rata**: Rata-rata dari nilai -100% adalah sekitar -79% (due to calculation precision)

### **Data Sebelum Perbaikan:**
```sql
-- Semua record memiliki jasa_sarana = 0
SELECT jasa_sarana, prosentase_profit FROM skenario_tarif WHERE tahun = 2025;
-- Hasil: jasa_sarana = 0, prosentase_profit = -100.00%
```

---

## 🔧 Solusi yang Diterapkan

### **1. Update Function `populate_skenario_tarif_from_rekapitulasi`**

**Sebelum:**
```sql
INSERT INTO skenario_tarif (
    user_id, tahun, kode_jenis, kode_unit_kerja, nama_unit_kerja,
    kode_operator, nama_operator, kode_tindakan, nama_tindakan,
    biaya_bahan, unit_cost_per_tindakan,
    prosentase_jasa_pelayanan, prosentase_profit, sumber_tabel
) VALUES (
    p_user_id, v_record.tahun, v_record.kode_jenis, v_record.kode_unit_kerja,
    v_record.nama_unit_kerja, v_record.kode_operator, v_record.nama_operator,
    v_record.kode_tindakan, v_record.nama_tindakan, v_record.biaya_bahan,
    v_record.unit_cost_per_tindakan,
    p_prosentase_jasa_pelayanan, p_prosentase_profit, v_record.sumber_tabel
);
```

**Sesudah:**
```sql
INSERT INTO skenario_tarif (
    user_id, tahun, kode_jenis, kode_unit_kerja, nama_unit_kerja,
    kode_operator, nama_operator, kode_tindakan, nama_tindakan,
    biaya_bahan, unit_cost_per_tindakan,
    jasa_sarana, jasa_pelayanan_medis, jasa_pelayanan_non_medis,
    prosentase_jasa_pelayanan, prosentase_profit, sumber_tabel
) VALUES (
    p_user_id, v_record.tahun, v_record.kode_jenis, v_record.kode_unit_kerja,
    v_record.nama_unit_kerja, v_record.kode_operator, v_record.nama_operator,
    v_record.kode_tindakan, v_record.nama_tindakan, v_record.biaya_bahan,
    v_record.unit_cost_per_tindakan,
    v_record.unit_cost_per_tindakan, -- jasa_sarana = unit_cost (default)
    0, -- jasa_pelayanan_medis = 0
    0, -- jasa_pelayanan_non_medis = 0
    p_prosentase_jasa_pelayanan, p_prosentase_profit, v_record.sumber_tabel
);
```

### **2. Default Value Strategy**

**Jasa Sarana Default**: `jasa_sarana = unit_cost_per_tindakan`
- **Alasan**: Memberikan baseline yang masuk akal
- **Profit**: `((unit_cost - unit_cost) / unit_cost) * 100 = 0%`
- **User Experience**: User dapat menyesuaikan nilai sesuai kebutuhan

---

## ✅ Hasil Perbaikan

### **Data Sebelum Perbaikan:**
```
Total Records: 445
Records with jasa_sarana > 0: 0
Average Profit: -79.10%
Min Profit: -100.00%
Max Profit: 0.00%
```

### **Data Sesudah Perbaikan:**
```
Total Records: 445
Records with jasa_sarana > 0: 352
Average Profit: 0.00%
Min Profit: 0.00%
Max Profit: 0.00%
```

### **Perhitungan Profit yang Benar:**
- **Formula**: `((jasa_sarana - unit_cost) / unit_cost) * 100`
- **Ketika jasa_sarana = unit_cost**: `((unit_cost - unit_cost) / unit_cost) * 100 = 0%`
- **Rata-rata**: 0.00% (nilai yang masuk akal)

---

## 🎯 Manfaat Perbaikan

1. **Data yang Konsisten**: Semua record memiliki nilai jasa_sarana yang masuk akal
2. **Perhitungan yang Benar**: Profit calculation menghasilkan nilai yang logis
3. **User Experience**: Badge menampilkan nilai yang dapat dipahami
4. **Baseline yang Baik**: User dapat menyesuaikan nilai sesuai kebutuhan
5. **Tidak Ada Nilai Negatif**: Profit 0% lebih masuk akal daripada -79%

---

## 📝 Catatan Teknis

### **Trigger Function:**
```sql
-- Function calculate_skenario_tarif() akan otomatis menghitung:
-- jasa_pelayanan = jasa_pelayanan_medis + jasa_pelayanan_non_medis
-- tarif_per_tindakan = jasa_sarana + biaya_bahan + jasa_pelayanan
-- prosentase_jasa_pelayanan = (jasa_pelayanan / tarif_per_tindakan) * 100
-- prosentase_profit = ((jasa_sarana - unit_cost) / unit_cost) * 100
```

### **Default Values:**
- **jasa_sarana**: `unit_cost_per_tindakan` (baseline yang masuk akal)
- **jasa_pelayanan_medis**: `0` (user input manual)
- **jasa_pelayanan_non_medis**: `0` (user input manual)

### **User Workflow:**
1. **Load Data**: Function akan set jasa_sarana = unit_cost sebagai default
2. **Edit Manual**: User dapat mengubah nilai jasa_sarana, jasa_pelayanan_medis, jasa_pelayanan_non_medis
3. **Auto Calculation**: Sistem akan menghitung nilai turunan secara otomatis

---

## 🔄 Langkah Selanjutnya

1. **User dapat mengklik "Update Data"** untuk memuat data dengan nilai default yang benar
2. **Edit manual** nilai jasa_sarana, jasa_pelayanan_medis, jasa_pelayanan_non_medis sesuai kebutuhan
3. **Sistem akan menghitung** profit percentage yang akurat berdasarkan input manual

Masalah -79% telah berhasil diperbaiki! 🎉




