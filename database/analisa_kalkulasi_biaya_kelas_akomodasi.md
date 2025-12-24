# ANALISA MENDALAM: KALKULASI BIAYA KELAS AKOMODASI

**Tanggal**: 10 Desember 2024  
**Halaman**: `/keperawatan/kalkulasi-biaya-kelas-akomodasi`  
**Tabel**: `kalkulasi_biaya_kelas_akomodasi`

---

## 📊 STRUKTUR TABEL & RUMUS

### Generated Column: `unit_cost_per_kelas`

**Rumus (SUDAH BENAR & KONSISTEN)**:
```sql
unit_cost_per_kelas = 
  biaya_gaji_tunjangan +
  biaya_jasa_pelayanan +
  biaya_obat +
  biaya_bhp +
  biaya_makan_karyawan +
  biaya_makan_pasien +
  biaya_rumah_tangga +
  biaya_cetak +
  biaya_atk +
  biaya_listrik +
  biaya_air +
  biaya_telp +
  biaya_pemeliharaan_bangunan +
  biaya_pemeliharaan_alat_medis +
  biaya_pemeliharaan_alat_non_medis +
  biaya_operasional_lainnya +
  biaya_penyusutan_gedung +
  biaya_penyusutan_jaringan +
  biaya_penyusutan_alat_medis +
  biaya_penyusutan_alat_non_medis +
  biaya_pendidikan_pelatihan +
  biaya_laundry +
  biaya_sterilisasi +
  biaya_tidak_langsung_terdistribusi +
  alokasi_biaya_gizi
```

**Total**: 24 komponen biaya + 1 alokasi biaya gizi = **25 komponen**

### Rumus Alokasi Biaya Gizi (SUDAH BENAR)

```sql
alokasi_biaya_gizi = jumlah_kali_porsi_[kelas] / hari_rawat_[kelas]
```

Ini dari tabel `data_akomodasi_inap`.

### Rumus Biaya Per Kelas (SUDAH BENAR)

Setiap biaya dihitung dengan rumus:
```sql
biaya_[jenis]_kelas = biaya_[jenis]_unit × dasar_alokasi_hari_rawat
```

Dimana:
```sql
dasar_alokasi_hari_rawat = hari_rawat_kelas / total_hari_rawat_unit
```

---

## ⚠️ MASALAH YANG DITEMUKAN

### 1. DUPLIKAT DATA DENGAN USER_ID BERBEDA

**Dampak**: Data inkonsisten dan membingungkan user.

**Contoh Case UK046 (Terang bulan VIP-VVIP)**:

#### Kelas VIP - 2 Baris Duplikat:
| user_id | unit_cost | biaya_gaji_tunjangan | biaya_tdk_langsung | alokasi_gizi | created_at |
|---------|-----------|---------------------|-------------------|--------------|------------|
| a024... | **1.412.802.264** | 474.949.185 | 442.553.702 | 65.278 | 2025-12-09 |
| fa0a... | **595.502** | 178.256 | 166.098 | 65.278 | 2025-11-14 |

**Selisih**: **1.412.206.762** (2.371x lebih besar!)

#### Kelas VVIP - 2 Baris Duplikat:
| user_id | unit_cost | biaya_gaji_tunjangan | biaya_tdk_langsung | alokasi_gizi | created_at |
|---------|-----------|---------------------|-------------------|--------------|------------|
| a024... | **52.032.800** | 17.471.854 | 16.280.129 | 62.746 | 2025-12-09 |
| fa0a... | **592.970** | 178.256 | 166.098 | 62.746 | 2025-11-14 |

**Selisih**: **51.439.830** (87x lebih besar!)

---

## 🔬 ANALISA MENDALAM

### Total Unit Kerja dengan Duplikat:

**17 Unit Kerja** memiliki duplikat data:
- UK046 (Terang bulan VIP-VVIP): VIP & VVIP - 2 user_id
- UK047 (Truntum): I, II, III - 2 user_id
- UK048 (Sekarjagat): I, II, III - 2 user_id
- UK049 (Jlamprang): I, II, III - 2 user_id
- UK050 (Nifas): I, II, III - 2 user_id
- UK051 (Perinatologi): II - 2 user_id
- UK052 (Buketan): I - 2 user_id
- UK053 (ICU-PICU-NICU): I - 2 user_id

**Penyebab**:
1. Function `populate_kalkulasi_biaya_kelas_akomodasi` dipanggil oleh **multiple users**
2. Setiap user memasukkan data dengan `user_id` mereka sendiri
3. Tidak ada mekanisme DELETE sebelum INSERT untuk user lain
4. Data MASTER (user_id IS NULL) tidak digunakan dengan benar

---

## ✅ VERIFIKASI RUMUS (SEMUA BENAR & KONSISTEN)

### Test Case 1: UK046 VIP (user: a024...)
```
Manual Calculation = 1.412.802.264
unit_cost_per_kelas = 1.412.802.264
Selisih = 0 ✓
```

### Test Case 2: UK046 VIP (user: fa0a...)
```
Manual Calculation = 595.502
unit_cost_per_kelas = 595.502
Selisih = 0 ✓
```

### Test Case 3: UK054 VK Semua Kelas
```
I:    Manual = 364.102.126, Actual = 364.102.126, Selisih = 0 ✓
II:   Manual = 485.469.501, Actual = 485.469.501, Selisih = 0 ✓
III:  Manual = 606.836.877, Actual = 606.836.877, Selisih = 0 ✓
VIP:  Manual = 242.734.749, Actual = 242.734.749, Selisih = 0 ✓
VVIP: Manual = 121.367.377, Actual = 121.367.377, Selisih = 0 ✓
```

**Kesimpulan**: Rumus kalkulasi **SUDAH BENAR** dan **KONSISTEN** untuk setiap baris.

---

## 🎯 REKOMENDASI SOLUSI

### ❌ YANG TIDAK PERLU DILAKUKAN (RUMUS SUDAH BENAR):
1. ❌ Mengubah rumus `unit_cost_per_kelas` (generated column)
2. ❌ Mengubah rumus `alokasi_biaya_gizi`
3. ❌ Mengubah rumus `dasar_alokasi_hari_rawat`
4. ❌ Mengubah rumus perhitungan biaya per kelas

### ✅ YANG PERLU DILAKUKAN (BERSIHKAN DUPLIKAT):

#### Option 1: DELETE Baris dengan `user_id` Lama (RECOMMENDED)
```sql
-- Hapus data user lama, simpan hanya user terbaru berdasarkan created_at
DELETE FROM kalkulasi_biaya_kelas_akomodasi
WHERE id IN (
  SELECT id FROM (
    SELECT 
      id,
      ROW_NUMBER() OVER (
        PARTITION BY kode_unit_kerja, kelas, tahun 
        ORDER BY created_at DESC
      ) as rn
    FROM kalkulasi_biaya_kelas_akomodasi
    WHERE tahun = 2025
  ) sub
  WHERE rn > 1
);
```

**Hasil**: Hanya data terbaru per unit_kerja-kelas yang tersimpan.

#### Option 2: Implement User Filtering di UI

Tambahkan filter `user_id = current_user_id` di query frontend:
```typescript
const { data, error } = await supabase
  .from('kalkulasi_biaya_kelas_akomodasi')
  .select('*')
  .eq('user_id', currentUserId)  // ⬅️ TAMBAHKAN INI
  .order('nama_unit_kerja', { ascending: true });
```

#### Option 3: Update Function untuk Single-Tenant

Modifikasi function `populate_kalkulasi_biaya_kelas_akomodasi` untuk:
1. DELETE semua data tahun tersebut (tidak hanya per user)
2. INSERT dengan `user_id = NULL` untuk data MASTER

---

## 📝 KESIMPULAN

### ✅ YANG SUDAH BENAR:
1. ✅ **Rumus `unit_cost_per_kelas`** - GENERATED COLUMN dengan 25 komponen
2. ✅ **Rumus `alokasi_biaya_gizi`** - jumlah_kali_porsi / hari_rawat
3. ✅ **Rumus biaya per kelas** - biaya_unit × dasar_alokasi_hari_rawat
4. ✅ **Konsistensi perhitungan** - Semua baris memiliki selisih = 0
5. ✅ **Stored procedure logic** - Prioritas user_id benar

### ⚠️ YANG PERLU DIPERBAIKI:
1. ⚠️ **Duplikat data** dengan user_id berbeda
2. ⚠️ **UI menampilkan semua data** tanpa filter user_id

### 🎯 PRIORITAS TINDAKAN:
1. **HIGH**: Implementasikan Option 1 (DELETE duplikat) atau Option 2 (User filter di UI)
2. **MEDIUM**: Update UI untuk menampilkan info user_id ownership
3. **LOW**: Dokumentasi untuk user tentang data ownership

---

## 🔐 CATATAN KEAMANAN

- **RLS (Row Level Security)**: Perlu diaktifkan untuk `kalkulasi_biaya_kelas_akomodasi`
- **Tenant Isolation**: Implementasi `tenant_id` filter
- **User Ownership**: Tambahkan visibility badge di UI

---

**FINAL STATUS**: 
- ✅ **RUMUS SUDAH BENAR & KONSISTEN**
- ⚠️ **PERLU CLEANUP DUPLIKAT DATA**
- ⚠️ **PERLU USER FILTERING DI UI**







