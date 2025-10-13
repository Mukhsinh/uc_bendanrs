# Dokumentasi Sistem Auto-Sync Triggers untuk Tabel Kalkulasi

## 📋 Ringkasan

Sistem trigger otomatis telah diimplementasikan untuk **6 tabel kalkulasi** agar selalu sinkron dengan tabel master mereka. Trigger ini memastikan bahwa setiap kali ada penambahan atau perubahan data di tabel master, data di tabel kalkulasi akan otomatis diperbarui.

---

## ✅ Tabel yang Telah Diimplementasikan

| No | Tabel Master | Tabel Kalkulasi | Kode UK | Nama UK | Status |
|----|-------------|-----------------|---------|---------|--------|
| 1 | `menu_gizi` | `kalkulasi_biaya_gizi` | - | Gizi | ✅ Aktif |
| 2 | `tindakan_laboratorium` | `kalkulasi_biaya_laboratorium` | UK038 | Laboratorium | ✅ Aktif |
| 3 | `tindakan_radiologi` | `kalkulasi_biaya_radiologi` | UK039 | Radiologi | ✅ Aktif |
| 4 | `tindakan_operatif` | `kalkulasi_biaya_operatif` | UK074 | IBS | ✅ Aktif |
| 5 | `tindakan_bdrs` | `kalkulasi_bdrs` | UK044 | BDRS | ✅ Aktif |
| 6 | `tindakan_cathlab` | `kalkulasi_biaya_cathlab` | UK045 | Cathlab | ✅ Aktif |

---

## 🔧 Cara Kerja Trigger

### 1. **INSERT Trigger** - Sinkronisasi Tindakan Baru

Ketika tindakan/menu baru ditambahkan di tabel master:

```sql
-- Contoh: Menambah tindakan cathlab baru
INSERT INTO tindakan_cathlab (kode_tindakan, nama_tindakan)
VALUES ('CL.18', 'PCI dengan 4 stent');
```

**Yang Terjadi Otomatis:**
- Trigger akan mencari semua kombinasi `user_id` + `tahun` yang sudah ada di `kalkulasi_biaya_cathlab`
- Untuk setiap kombinasi, akan membuat record baru dengan:
  - `kode` = kode tindakan dari master
  - `jenis_pemeriksaan` = nama tindakan dari master
  - `kode_unit_kerja` dan `nama_unit_kerja` (sesuai tabel)
  - Nilai default: `jumlah=0`, `waktu=0`, `profesionalisme=1`, `kesulitan=1`

### 2. **UPDATE Trigger** - Sinkronisasi Perubahan Nama

Ketika nama tindakan/menu diubah di tabel master:

```sql
-- Contoh: Mengubah nama tindakan
UPDATE tindakan_cathlab
SET nama_tindakan = 'PCI (Percutaneous Coronary Intervention) - 4 Stent'
WHERE kode_tindakan = 'CL.18';
```

**Yang Terjadi Otomatis:**
- Trigger akan update field `jenis_pemeriksaan` di semua record `kalkulasi_biaya_cathlab` yang memiliki `kode = 'CL.18'`
- Field `updated_at` juga akan diperbarui otomatis

---

## 📊 Mapping Kolom

### Kalkulasi Biaya Gizi
- **Master:** `menu_gizi.kode_makanan` → **Kalkulasi:** `kalkulasi_biaya_gizi.kode`
- **Master:** `menu_gizi.nama_makanan` → **Kalkulasi:** `kalkulasi_biaya_gizi.jenis_makanan`

### Kalkulasi Biaya Laboratorium
- **Master:** `tindakan_laboratorium.kode` → **Kalkulasi:** `kalkulasi_biaya_laboratorium.kode`
- **Master:** `tindakan_laboratorium.nama` → **Kalkulasi:** `kalkulasi_biaya_laboratorium.jenis_pemeriksaan`

### Kalkulasi Biaya Radiologi
- **Master:** `tindakan_radiologi.kode_tindakan` → **Kalkulasi:** `kalkulasi_biaya_radiologi.kode`
- **Master:** `tindakan_radiologi.nama_tindakan` → **Kalkulasi:** `kalkulasi_biaya_radiologi.jenis_pemeriksaan`

### Kalkulasi Biaya Operatif
- **Master:** `tindakan_operatif.kode_tindakan_operatif` → **Kalkulasi:** `kalkulasi_biaya_operatif.kode`
- **Master:** `tindakan_operatif.nama_tindakan_operatif` → **Kalkulasi:** `kalkulasi_biaya_operatif.jenis_pemeriksaan`
- **Master:** `tindakan_operatif.kode_operator_spesialistik` → **Kalkulasi:** `kalkulasi_biaya_operatif.kode_operator_spesialistik`
- **Master:** `tindakan_operatif.nama_operator_spesialistik` → **Kalkulasi:** `kalkulasi_biaya_operatif.nama_operator_spesialistik`

### Kalkulasi BDRS
- **Master:** `tindakan_bdrs.kode` → **Kalkulasi:** `kalkulasi_bdrs.kode`
- **Master:** `tindakan_bdrs.nama` → **Kalkulasi:** `kalkulasi_bdrs.jenis_pemeriksaan`

### Kalkulasi Biaya Cathlab
- **Master:** `tindakan_cathlab.kode_tindakan` → **Kalkulasi:** `kalkulasi_biaya_cathlab.kode`
- **Master:** `tindakan_cathlab.nama_tindakan` → **Kalkulasi:** `kalkulasi_biaya_cathlab.jenis_pemeriksaan`

---

## 🎯 Keuntungan Sistem Ini

1. ✅ **Data Consistency** - Master dan kalkulasi selalu sinkron
2. ✅ **No Manual Work** - Tidak perlu manual insert ke tabel kalkulasi
3. ✅ **Multi-User Support** - Semua user otomatis mendapat tindakan baru
4. ✅ **Multi-Year Support** - Berlaku untuk semua tahun yang sudah ada
5. ✅ **Real-time Update** - Perubahan nama langsung tersinkronisasi
6. ✅ **Audit Trail** - Timestamp `updated_at` otomatis diperbarui
7. ✅ **Maintainability** - Mudah maintain karena logic terpusat di trigger

---

## 💡 Cara Menggunakan

### Untuk Admin/Data Manager:

#### **Menambah Tindakan Baru**
```sql
-- Contoh 1: Tambah menu gizi baru
INSERT INTO menu_gizi (kode_makanan, nama_makanan)
VALUES ('gz.116', 'Nasi Goreng Spesial');

-- Contoh 2: Tambah tindakan laboratorium baru
INSERT INTO tindakan_laboratorium (kode, nama, jenis)
VALUES ('PK.999', 'Tes Baru', 'PK');

-- Trigger akan otomatis membuat record di kalkulasi untuk semua user!
```

#### **Mengubah Nama Tindakan**
```sql
-- Contoh: Update nama tindakan operatif
UPDATE tindakan_operatif
SET nama_tindakan_operatif = 'Odontectomy (Updated Name)'
WHERE kode_tindakan_operatif = '3.01.001';

-- Trigger akan otomatis update semua record kalkulasi dengan kode tersebut!
```

### Untuk User/Pengguna Aplikasi:

1. **Buka halaman kalkulasi** (contoh: "Kalkulasi Biaya Cathlab")
2. **Pilih tahun** yang ingin dikalkulasi
3. **Data akan auto-generate** dari tabel master untuk tahun tersebut
4. Setelah itu, **setiap tindakan baru** yang ditambahkan admin akan **otomatis muncul** di kalkulasi Anda!

---

## ⚠️ Catatan Penting

### 1. **Trigger Bekerja Setelah Initial Data Ada**
- Trigger hanya membuat data untuk user yang **sudah memiliki data** di tabel kalkulasi
- User baru perlu membuka halaman kalkulasi sekali untuk generate initial data
- Setelah itu, semua tindakan baru akan otomatis tersinkronisasi

### 2. **Penghapusan Data**
- **Trigger TIDAK menghapus data** dari tabel kalkulasi ketika tindakan dihapus dari master
- Ini disengaja untuk **menjaga history** data kalkulasi
- Jika perlu menghapus, harus dilakukan manual

### 3. **Performance**
- Trigger dirancang untuk **efisien** dan **tidak memblokir** operasi lain
- Menggunakan `SECURITY DEFINER` untuk memastikan konsistensi data
- Hanya membuat record untuk user/tahun yang sudah ada (tidak scan seluruh database)

### 4. **Multi-Year Support**
- Jika user sudah punya data untuk tahun 2024 dan 2025, tindakan baru akan dibuat untuk **kedua tahun**
- Ini memastikan konsistensi data across years

---

## 🔍 Troubleshooting

### **Masalah: Tindakan baru tidak muncul di kalkulasi saya**

**Solusi:**
1. Pastikan Anda sudah membuka halaman kalkulasi tersebut minimal sekali
2. Refresh halaman dengan menekan F5 atau reload button
3. Jika masih tidak muncul, cek apakah tindakan benar-benar ada di tabel master
4. Hubungi admin untuk verifikasi

### **Masalah: Nama tindakan tidak update setelah diubah di master**

**Solusi:**
1. Refresh halaman (F5)
2. Cek field `updated_at` - seharusnya berubah
3. Jika masih tidak berubah, hubungi admin

---

## 🛠️ Technical Details

### **Function Names:**
- `auto_sync_menu_gizi_to_kalkulasi()`
- `auto_update_menu_gizi_in_kalkulasi()`
- `auto_sync_tindakan_lab_to_kalkulasi()`
- `auto_update_tindakan_lab_in_kalkulasi()`
- `auto_sync_tindakan_radiologi_to_kalkulasi()`
- `auto_update_tindakan_radiologi_in_kalkulasi()`
- `auto_sync_tindakan_operatif_to_kalkulasi()`
- `auto_update_tindakan_operatif_in_kalkulasi()`
- `auto_sync_tindakan_bdrs_to_kalkulasi()`
- `auto_update_tindakan_bdrs_in_kalkulasi()`
- `auto_sync_tindakan_cathlab_to_kalkulasi()`
- `auto_update_tindakan_cathlab_in_kalkulasi()`

### **Trigger Names:**
- `trigger_sync_new_[table]` - For INSERT
- `trigger_update_[table]` - For UPDATE

### **Security:**
- All functions use `SECURITY DEFINER`
- RLS policies apply to end-user operations
- Triggers execute with elevated privileges to ensure data consistency

---

## 📅 Maintenance & Monitoring

### **Untuk Admin:**

#### **Check Trigger Status**
```sql
-- Verify all triggers are active
SELECT 
  event_object_table,
  trigger_name,
  event_manipulation,
  action_statement
FROM information_schema.triggers
WHERE event_object_table IN (
  'menu_gizi', 'tindakan_laboratorium', 'tindakan_radiologi',
  'tindakan_operatif', 'tindakan_bdrs', 'tindakan_cathlab'
)
ORDER BY event_object_table, trigger_name;
```

#### **Check Data Consistency**
```sql
-- Verify all tables are in sync
SELECT 
  'menu_gizi -> kalkulasi_biaya_gizi' as relasi,
  (SELECT COUNT(*) FROM menu_gizi) as master_count,
  (SELECT COUNT(DISTINCT kode) FROM kalkulasi_biaya_gizi WHERE user_id IS NOT NULL) as kalkulasi_count
UNION ALL
SELECT 
  'tindakan_laboratorium -> kalkulasi_biaya_laboratorium',
  (SELECT COUNT(*) FROM tindakan_laboratorium),
  (SELECT COUNT(DISTINCT kode) FROM kalkulasi_biaya_laboratorium WHERE user_id IS NOT NULL)
-- ... dst untuk tabel lainnya
```

---

## 📝 Changelog

### Version 1.0.0 (2025-10-02)
- ✅ Implemented auto-sync triggers for 6 kalkulasi tables
- ✅ INSERT trigger for automatic data creation
- ✅ UPDATE trigger for automatic name synchronization
- ✅ Multi-user and multi-year support
- ✅ Comprehensive documentation

---

## 👥 Support

Jika ada pertanyaan atau masalah:
1. Baca dokumentasi ini terlebih dahulu
2. Cek bagian Troubleshooting
3. Hubungi tim IT/Admin untuk bantuan lebih lanjut

---

**Dibuat:** 2 Oktober 2025  
**Terakhir Diupdate:** 2 Oktober 2025  
**Versi:** 1.0.0

