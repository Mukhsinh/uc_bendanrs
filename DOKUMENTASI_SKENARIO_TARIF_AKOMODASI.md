# Dokumentasi Skenario Tarif Akomodasi

## 📋 Overview
Fitur **Skenario Tarif Akomodasi** memungkinkan user untuk mengatur tarif per kelas akomodasi rawat inap (VVIP, VIP, I, II, III) dengan perhitungan profit otomatis berdasarkan rata-rata unit cost dari kalkulasi biaya kelas akomodasi.

## 🗄️ Database Schema

### Tabel: `skenario_tarif_akomodasi`

**Kolom-kolom:**

#### 1. **Rata-rata Unit Cost** (Auto-generated dari `kalkulasi_biaya_kelas_akomodasi`)
- `rata_rata_uc_vvip` - Rata-rata UC kelas VVIP
- `rata_rata_uc_vip` - Rata-rata UC kelas VIP
- `rata_rata_uc_i` - Rata-rata UC kelas I
- `rata_rata_uc_ii` - Rata-rata UC kelas II
- `rata_rata_uc_iii` - Rata-rata UC kelas III

#### 2. **Tarif** (Input Manual)
- `tarif_vvip` - Tarif kelas VVIP
- `tarif_vip` - Tarif kelas VIP
- `tarif_i` - Tarif kelas I
- `tarif_ii` - Tarif kelas II
- `tarif_iii` - Tarif kelas III

#### 3. **Profit Rupiah** (Auto-calculated)
- `profit_rupiah_vvip` = tarif_vvip - rata_rata_uc_vvip
- `profit_rupiah_vip` = tarif_vip - rata_rata_uc_vip
- `profit_rupiah_i` = tarif_i - rata_rata_uc_i
- `profit_rupiah_ii` = tarif_ii - rata_rata_uc_ii
- `profit_rupiah_iii` = tarif_iii - rata_rata_uc_iii

#### 4. **Profit Persen** (Auto-calculated)
- `profit_persen_vvip` = (profit_rupiah_vvip / rata_rata_uc_vvip) × 100
- `profit_persen_vip` = (profit_rupiah_vip / rata_rata_uc_vip) × 100
- `profit_persen_i` = (profit_rupiah_i / rata_rata_uc_i) × 100
- `profit_persen_ii` = (profit_rupiah_ii / rata_rata_uc_ii) × 100
- `profit_persen_iii` = (profit_rupiah_iii / rata_rata_uc_iii) × 100

#### 5. **Metadata**
- `id` - UUID primary key
- `user_id` - Foreign key ke auth.users
- `tahun` - Tahun periode
- `created_at` - Timestamp created
- `updated_at` - Timestamp updated

## 🔄 Auto-Update Mechanism

### Trigger System
Tabel `skenario_tarif_akomodasi` akan **otomatis ter-update** ketika ada perubahan di tabel `kalkulasi_biaya_kelas_akomodasi`.

**Trigger:** `trg_update_skenario_tarif_akomodasi`
- **Event:** INSERT, UPDATE, DELETE pada `kalkulasi_biaya_kelas_akomodasi`
- **Action:** Memanggil function `populate_skenario_tarif_akomodasi()` untuk recalculate rata-rata UC

### Function: `populate_skenario_tarif_akomodasi(p_user_id, p_tahun)`
Function ini akan:
1. Menghitung rata-rata `unit_cost_per_kelas` dari `kalkulasi_biaya_kelas_akomodasi` untuk setiap kelas (VVIP, VIP, I, II, III)
2. Update data yang sudah ada, atau insert data baru jika belum ada
3. Return jumlah record yang di-update/insert

## 🖥️ Frontend Interface

### Halaman: Skenario Tarif Akomodasi
**Path:** `/skenario-tarif-akomodasi`

**Fitur:**
1. **Filter Tahun** - Pilih tahun periode
2. **Update Data dari Kalkulasi** - Button untuk populate/update rata-rata UC dari `kalkulasi_biaya_kelas_akomodasi`
3. **Unduh Laporan** - Export data ke CSV
4. **Edit Tarif** - Edit tarif per kelas dengan inline editing
5. **Badge Rata-rata Profit** - Menampilkan rata-rata profit dari semua kelas

### Tabel Display
Tabel menampilkan 5 baris untuk setiap kelas akomodasi dengan kolom:
- **Kelas** - Badge dengan nama kelas (VVIP, VIP, I, II, III)
- **Rata-rata UC** - Auto-calculated dari tabel sumber
- **Tarif** - Editable field (click icon edit untuk mengubah)
- **Profit (Rp)** - Auto-calculated (hijau jika positif, merah jika negatif)
- **Profit (%)** - Auto-calculated dengan badge
- **Aksi** - Button edit untuk mengubah tarif

### UI Components
- **Card** - Container untuk konfigurasi dan tabel
- **Input** - Input field untuk tahun
- **Button** - Actions (Update, Export, Edit, Save, Cancel)
- **Table** - Data display dengan styling responsive
- **Badge** - Status indicators untuk kelas, profit, dll
- **Toast** - Notification untuk success/error messages

## 📊 Workflow Penggunaan

### 1. Persiapan Data
Pastikan data di tabel `kalkulasi_biaya_kelas_akomodasi` sudah terisi untuk tahun yang diinginkan.

### 2. Populate Data
1. Buka halaman **Skenario Tarif Akomodasi**
2. Pilih **Tahun**
3. Klik button **"Update Data dari Kalkulasi"**
4. Sistem akan:
   - Menghitung rata-rata UC dari `kalkulasi_biaya_kelas_akomodasi`
   - Populate/update tabel `skenario_tarif_akomodasi`
   - Menampilkan data di tabel

### 3. Input Tarif Manual
1. Klik icon **Edit** (pensil) pada baris kelas yang ingin diubah
2. Input **Tarif** baru
3. Klik icon **Check** (centang) untuk save, atau **X** untuk cancel
4. Sistem akan:
   - Update field `tarif_xxx` di database
   - Auto-calculate `profit_rupiah_xxx` dan `profit_persen_xxx`
   - Refresh tampilan tabel

### 4. Review & Export
1. Review data profit per kelas
2. Lihat **Badge Rata-rata Profit** untuk overview
3. Klik **"Unduh Laporan"** untuk export ke CSV

## 🔐 Security (Row Level Security)

Tabel `skenario_tarif_akomodasi` menggunakan RLS dengan policies:
- **SELECT** - User hanya bisa melihat data miliknya sendiri
- **INSERT** - User hanya bisa insert data dengan user_id sendiri
- **UPDATE** - User hanya bisa update data miliknya sendiri
- **DELETE** - User hanya bisa delete data miliknya sendiri

## 📝 SQL Examples

### Manual Populate
```sql
SELECT populate_skenario_tarif_akomodasi(
  'user-uuid-here'::uuid,
  2025
);
```

### Query Data
```sql
SELECT 
  kelas,
  rata_rata_uc_vvip,
  tarif_vvip,
  profit_rupiah_vvip,
  profit_persen_vvip
FROM skenario_tarif_akomodasi
WHERE user_id = 'user-uuid-here'
  AND tahun = 2025;
```

### Update Tarif
```sql
UPDATE skenario_tarif_akomodasi
SET tarif_vvip = 500000
WHERE user_id = 'user-uuid-here'
  AND tahun = 2025;
-- Profit akan auto-update karena generated column
```

## 🎨 UI Preview

### Layout
```
┌─────────────────────────────────────────────────────────┐
│ Skenario Tarif Akomodasi                                │
│ Kelola tarif akomodasi per kelas dengan perhitungan... │
├─────────────────────────────────────────────────────────┤
│ ┌─ Konfigurasi ────────────────────────────────────┐   │
│ │ Tahun: [2025]                                     │   │
│ │ [Update Data] [Unduh Laporan] [Rata-rata: 15.5%] │   │
│ └───────────────────────────────────────────────────┘   │
│                                                          │
│ ┌─ Data Skenario Tarif Akomodasi ─────────────────┐    │
│ │ Kelas  │ Rata UC │ Tarif │ Profit Rp │ % │ Aksi │    │
│ ├────────┼─────────┼───────┼───────────┼───┼──────┤    │
│ │ VVIP   │ 300,000 │ 400K  │ +100,000  │33%│ ✏️   │    │
│ │ VIP    │ 250,000 │ 350K  │ +100,000  │40%│ ✏️   │    │
│ │ I      │ 200,000 │ 280K  │ +80,000   │40%│ ✏️   │    │
│ │ II     │ 150,000 │ 200K  │ +50,000   │33%│ ✏️   │    │
│ │ III    │ 100,000 │ 120K  │ +20,000   │20%│ ✏️   │    │
│ └───────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘
```

## 🔧 Technical Details

### React Query Keys
- `["skenario_tarif_akomodasi", tahun]` - Main data query

### Mutations
- `populateMutation` - Populate dari kalkulasi
- `updateTarifMutation` - Update tarif per kelas

### State Management
- `tahun` - Selected year
- `editingKelas` - Currently editing class
- `editTarif` - Temp edit value

### Dependencies
- `@tanstack/react-query` - Data fetching & caching
- `sonner` - Toast notifications
- `lucide-react` - Icons
- Shadcn UI components

## 🐛 Troubleshooting

### Data tidak muncul
1. Pastikan tabel `kalkulasi_biaya_kelas_akomodasi` sudah terisi
2. Klik "Update Data dari Kalkulasi"
3. Check console untuk error messages

### Profit tidak ter-calculate
- Profit dihitung otomatis oleh generated columns
- Pastikan tarif sudah di-input
- Refresh page jika perlu

### Auto-update tidak jalan
1. Check trigger `trg_update_skenario_tarif_akomodasi` sudah aktif
2. Check function `populate_skenario_tarif_akomodasi()` tidak error
3. Check RLS policies

## ✅ Testing Checklist

- [x] Database table created dengan semua kolom
- [x] Trigger untuk auto-update created
- [x] Function populate created dan tested
- [x] Frontend page created dengan semua fitur
- [x] Route added di App.tsx
- [x] Menu item added di sidebar
- [x] RLS policies configured
- [x] No linter errors
- [x] Responsive design
- [x] Error handling
- [x] Toast notifications

## 📚 Related Documentation
- `SKEMA_DATA_AKOMODASI_INAP_DOCUMENTATION.md` - Schema dokumentasi akomodasi inap
- `SKENARIO_TARIF_UPDATE_DOCUMENTATION.md` - Dokumentasi skenario tarif tindakan
- `KALKULASI_BIAYA_KELAS_AKOMODASI` - Source table documentation

## 🎯 Future Enhancements
1. Batch update multiple tarif sekaligus
2. History tracking perubahan tarif
3. Comparison dengan tarif RS lain
4. Grafik visualisasi profit trends
5. Export to PDF dengan chart
6. Import tarif dari file Excel/CSV
7. Notification jika profit dibawah threshold tertentu

