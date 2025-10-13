# Panduan Lengkap: Produk Layanan

## 📋 Pengantar

Fitur **Produk Layanan** memungkinkan Anda mengelola paket layanan rumah sakit yang terdiri dari berbagai komponen tindakan medis dengan referensi otomatis ke unit cost yang telah dihitung.

---

## 🚀 Akses Menu

1. Login ke aplikasi
2. Buka sidebar menu
3. Klik **"Produk Layanan"** (ikon 🛒 ShoppingCart)

---

## ✨ Fitur-Fitur Utama

### 1. Tambah Data Manual

#### Langkah-langkah:

**Step 1: Klik Tombol "Tambah Data"**
```
┌─────────────────────────────────────┐
│ 🛒 Produk Layanan          Tahun: 2025 │
├─────────────────────────────────────┤
│ [+Tambah Data] [↓Export] [↑Import] │
└─────────────────────────────────────┘
```

**Step 2: Isi Tab "Informasi Dasar"**
```
┌─ Informasi Dasar ──────────────────────┐
│                                         │
│ Jenis:             [Rawat Jalan ▼]     │
│ LOS:               [1          ]        │
│                                         │
│ INA-CBG:           [A-4-10-I   ]        │
│ Grouper:           [Mild       ]        │
│ INA-CBG's:         [A-4-10-I   ]        │
│                                         │
│ Spesialisasi:      [Sp. PD     ]        │
│ Nama Dokter:       [Dr. Andi   ]        │
│ Kode Dokter:       [DK001      ]        │
└─────────────────────────────────────────┘
```

**Step 3: Isi Tab "Diagnosa & Prosedur"**
```
┌─ Diagnosa & Prosedur ──────────────────┐
│                                         │
│ Diaglist:          [I10        ]        │
│                                         │
│ Diagnosa 1:        [Hipertensi ]        │
│ Diagnosa 2:        [           ]        │
│ Diagnosa 3:        [           ]        │
│ Diagnosa 4:        [           ]        │
│ Diagnosa 5:        [           ]        │
│                                         │
│ Proclist:          [Z00.0      ]        │
│                                         │
│ Prosedur 1:        [Pemeriksaan]        │
│ Prosedur 2:        [           ]        │
└─────────────────────────────────────────┘
```

**Step 4: Tambah Layanan di Tab "Layanan"**
```
┌─ Layanan ──────────────────────────────┐
│                                         │
│ TINDAKAN                                │
│ ┌───────────────────────────────────┐  │
│ │ Belum ada layanan dipilih         │  │
│ │ [+ Tambah Tindakan]               │  │
│ └───────────────────────────────────┘  │
│                                         │
│ LABORATORIUM                            │
│ ┌───────────────────────────────────┐  │
│ │ Belum ada layanan dipilih         │  │
│ │ [+ Tambah Laboratorium]           │  │
│ └───────────────────────────────────┘  │
│                                         │
│ RADIOLOGI                               │
│ ┌───────────────────────────────────┐  │
│ │ Belum ada layanan dipilih         │  │
│ │ [+ Tambah Radiologi]              │  │
│ └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

**Step 5: Dialog Pilih Layanan**
```
┌─ Pilih Tindakan ───────────────────────┐
│                                         │
│ Pilih Layanan:                          │
│ [T.001 - Konsultasi Dokter (UC:50K)▼]  │
│                                         │
│ Quantity:          [1          ]        │
│                                         │
│ ┌─────────────────────────────────────┐│
│ │ Unit Cost:        Rp     50.000    ││
│ │ Biaya BHP:        Rp     10.000    ││
│ │ Quantity:                      1    ││
│ │ ──────────────────────────────────  ││
│ │ Subtotal:         Rp     60.000    ││
│ └─────────────────────────────────────┘│
│                                         │
│            [Batal]  [Tambah]            │
└─────────────────────────────────────────┘
```

**Step 6: Lihat Layanan yang Ditambahkan**
```
┌─ Tindakan ─────────────────────────────────────────┐
│ Kode   │ Nama           │ UC     │ BHP    │ Qty │ Subtotal │ [X] │
├────────┼────────────────┼────────┼────────┼─────┼──────────┼─────┤
│ T.001  │ Konsultasi     │ 50.000 │ 10.000 │  1  │  60.000  │ [🗑] │
│ T.002  │ Pemeriksaan    │ 75.000 │ 15.000 │  1  │  90.000  │ [🗑] │
├────────┴────────────────┴────────┴────────┴─────┼──────────┼─────┤
│                                    Total:        │ 150.000  │     │
└──────────────────────────────────────────────────┴──────────┴─────┘
```

**Step 7: Simpan**
- Klik tombol **"Simpan"**
- Total biaya otomatis terhitung dari semua layanan
- Data tersimpan di database

---

### 2. Import dari CSV

#### Langkah-langkah:

**Step 1: Download Template**
- File template: `template_produk_layanan.csv`
- Atau export data existing sebagai template

**Step 2: Isi Template di Excel**
```csv
jenis,inacbg,grouper,los,nama_dokter,...
rawat jalan,A-4-10-I,Mild,1,Dr. Andi,...
rawat inap,O-8-10-I,Moderate,3,Dr. Siti,...
```

**Step 3: Import File**
- Klik tombol **"Import CSV"**
- Pilih file CSV yang sudah diisi
- Sistem akan mengimport data

**Step 4: Edit untuk Tambah Layanan**
- Setelah import, data belum memiliki layanan
- Edit setiap data untuk menambahkan tindakan, lab, radiologi, dll.

---

### 3. Edit Data Existing

#### Langkah-langkah:

**Step 1: Klik Tombol Edit (✏️)**
```
┌────────────────────────────────────────────────────┐
│ Jenis       │ INA-CBG   │ Dokter    │ Total  │ Aksi │
├─────────────┼───────────┼───────────┼────────┼──────┤
│ Rawat Jalan │ A-4-10-I  │ Dr. Andi  │ 260K   │ ✏️ 🗑 │
└────────────────────────────────────────────────────┘
```

**Step 2: Ubah Data**
- Form akan terbuka dengan data yang ada
- Ubah field yang diperlukan
- Tambah/hapus layanan

**Step 3: Simpan Perubahan**
- Klik **"Simpan"**
- Data terupdate dengan total biaya yang baru

---

### 4. Export ke CSV

#### Langkah-langkah:

**Step 1: Klik Tombol "Export CSV"**
- File akan ter-download otomatis
- Nama file: `produk_layanan_2025.csv`

**Step 2: Buka di Excel**
- File berisi semua data untuk tahun yang dipilih
- Bisa digunakan untuk reporting atau analisis

---

## 🎯 Contoh Kasus Penggunaan

### Kasus 1: Paket Rawat Jalan Hipertensi

**Data Input:**
- Jenis: Rawat Jalan
- INA-CBG: A-4-10-I (Hipertensi Ringan)
- LOS: 1 hari
- Dokter: Dr. Andi (Spesialis Penyakit Dalam)

**Layanan:**
1. **Tindakan**: Konsultasi Dokter (T.001)
   - UC: Rp 50.000 + BHP: Rp 10.000 = **Rp 60.000**

2. **Laboratorium**: Pemeriksaan Darah Lengkap (Lab.001)
   - UC: Rp 120.000 + BHP: Rp 30.000 = **Rp 150.000**

3. **Farmasi**: Obat Hipertensi (FARM.001)
   - UC: Rp 40.000 + BHP: Rp 10.000 = **Rp 50.000**

**Total Biaya Paket**: **Rp 260.000** (auto-calculated)

---

### Kasus 2: Paket Rawat Inap Operasi Sectio Caesarea

**Data Input:**
- Jenis: Rawat Inap
- INA-CBG: O-6-10-I
- LOS: 3 hari
- Dokter: Dr. Siti (Spesialis Kebidanan)

**Layanan:**
1. **IBS (Operatif)**: Sectio Caesarea (3.01.001)
   - UC: Rp 3.500.000 + BHP: Rp 1.500.000 = **Rp 5.000.000**

2. **Tindakan**: Perawatan Luka Post Op (T.050)
   - UC: Rp 100.000 + BHP: Rp 25.000 × 3 hari = **Rp 375.000**

3. **Laboratorium**: Lab Darah + Urine (Lab.001, Lab.015)
   - Total: **Rp 200.000**

4. **Radiologi**: USG Post Op (Rad.010)
   - UC: Rp 150.000 + BHP: Rp 30.000 = **Rp 180.000**

5. **Kamar Akomodasi**: Kelas II × 3 hari
   - UC: Rp 300.000/hari + BHP: Rp 50.000/hari × 3 = **Rp 1.050.000**

6. **Visite**: Visite Dokter × 3 hari
   - UC: Rp 50.000/hari × 3 = **Rp 150.000**

**Total Biaya Paket**: **Rp 6.955.000** (auto-calculated)

---

## 💡 Tips & Tricks

### Tip 1: Multiple Selection untuk Satu Jenis Layanan
Anda bisa menambahkan **lebih dari satu** tindakan untuk setiap kategori:

```
LABORATORIUM:
├─ Lab.001: Darah Lengkap       → Rp 150.000
├─ Lab.015: Urine Lengkap       → Rp  50.000
├─ Lab.023: Fungsi Ginjal       → Rp 200.000
└─ TOTAL                        → Rp 400.000
```

### Tip 2: Edit Quantity untuk Layanan Berulang
Untuk layanan yang dilakukan berulang (misal: visite harian):
- Pilih layanan visite
- Set Quantity = jumlah hari (misal: 3)
- Subtotal otomatis: UC × Qty

### Tip 3: Export-Import untuk Backup
- Export data secara berkala sebagai backup
- Import kembali jika perlu restore data

### Tip 4: Filter by Tahun
- Gunakan dropdown tahun untuk melihat data tahun tertentu
- Setiap tahun memiliki data terpisah

---

## ❓ FAQ (Frequently Asked Questions)

### Q1: Mengapa layanan tidak muncul di dropdown?
**A**: Pastikan Anda sudah melakukan kalkulasi unit cost untuk layanan tersebut di tahun yang dipilih. Cek di menu Rekapitulasi Unit Cost.

### Q2: Bagaimana cara menghapus layanan yang sudah ditambahkan?
**A**: Pada tabel layanan di dialog form, klik tombol 🗑 (trash) di kolom Aksi untuk menghapus item.

### Q3: Apakah total biaya otomatis terupdate?
**A**: Ya! Total biaya otomatis terhitung dari semua layanan yang ditambahkan menggunakan database trigger.

### Q4: Bisakah menambahkan layanan kustom (tidak dari rekapitulasi)?
**A**: Saat ini belum. Semua layanan harus ada di tabel Rekapitulasi Unit Cost terlebih dahulu.

### Q5: Bagaimana cara melihat detail biaya per layanan?
**A**: Pada tabel layanan di form edit, Anda bisa melihat breakdown:
- Unit Cost
- Biaya BHP
- Quantity
- Subtotal per item

### Q6: Apakah bisa import layanan dari CSV?
**A**: Untuk versi saat ini, import CSV hanya untuk data dasar (INA-CBG, diagnosa, dll.). Layanan harus ditambahkan manual setelah import.

---

## 🔧 Troubleshooting

### Problem: "User not authenticated"
**Solusi**: Login ulang ke aplikasi

### Problem: Data tidak tersimpan
**Solusi**: 
1. Cek koneksi internet
2. Cek console browser untuk error
3. Pastikan semua field required terisi

### Problem: Total biaya = 0
**Solusi**: Pastikan Anda sudah menambahkan minimal 1 layanan

### Problem: CSV import gagal
**Solusi**: 
1. Gunakan template yang disediakan
2. Pastikan encoding UTF-8
3. Jangan ada baris kosong di akhir file

---

## 📊 Struktur Data Layanan

Setiap layanan yang ditambahkan memiliki struktur:

```json
{
  "kode_tindakan": "T.001",
  "nama_tindakan": "Konsultasi Dokter Umum",
  "unit_cost": 50000,
  "biaya_bhp": 10000,
  "qty": 1,
  "subtotal": 60000
}
```

### Calculation Formula:
```
subtotal = (unit_cost + biaya_bhp) × qty

total_biaya = SUM(
  tindakan[].subtotal +
  ibs[].subtotal +
  laboratorium[].subtotal +
  radiologi[].subtotal +
  farmasi[].subtotal +
  kamar_akomodasi[].subtotal +
  visite[].subtotal +
  konsultasi[].subtotal
)
```

---

## 🎨 Screenshot Walkthrough

### 1. Halaman Utama
```
╔══════════════════════════════════════════════════════════╗
║ 🛒 PRODUK LAYANAN                          Tahun: 2025  ║
╠══════════════════════════════════════════════════════════╣
║ [+ Tambah Data] [↓ Export CSV] [↑ Import CSV]           ║
║                                                          ║
║ ┌──────────────────────────────────────────────────────┐║
║ │ Jenis│INA-CBG │Grouper│LOS│Dokter  │Total   │Aksi   │║
║ ├──────┼────────┼───────┼───┼────────┼────────┼───────┤║
║ │ RJ   │A-4-10-I│Mild   │ 1 │Dr.Andi │260.000 │ ✏️ 🗑 │║
║ │ RI   │O-8-10-I│Moderate│3 │Dr.Siti │6.9M    │ ✏️ 🗑 │║
║ └──────────────────────────────────────────────────────┘║
╚══════════════════════════════════════════════════════════╝
```

### 2. Form Input (Tab Layanan)
```
╔══════════════════════════════════════════════════════════╗
║ Tambah Produk Layanan                                   ║
╠══════════════════════════════════════════════════════════╣
║ [Info Dasar] [Diagnosa & Prosedur] [✓ Layanan]         ║
║                                                          ║
║ TINDAKAN ──────────────────────────────────────────     ║
║ ┌────────────────────────────────────────────────────┐  ║
║ │ Kode │ Nama       │ UC     │ BHP   │Qty│Subtotal│ X│  ║
║ │ T.001│ Konsultasi │ 50.000 │10.000 │ 1 │ 60.000 │🗑│  ║
║ │ T.002│ Periksa    │ 75.000 │15.000 │ 1 │ 90.000 │🗑│  ║
║ │                           Total: 150.000           │  ║
║ │ [+ Tambah Tindakan]                                │  ║
║ └────────────────────────────────────────────────────┘  ║
║                                                          ║
║ LABORATORIUM ──────────────────────────────────────     ║
║ ┌────────────────────────────────────────────────────┐  ║
║ │ Lab.001│ Darah Lengkap │120K│30K│ 1 │ 150.000 │🗑│  ║
║ │                           Total: 150.000           │  ║
║ │ [+ Tambah Laboratorium]                            │  ║
║ └────────────────────────────────────────────────────┘  ║
║                                                          ║
║                              [Batal]  [💾 Simpan]       ║
╚══════════════════════════════════════════════════════════╝
```

---

## 📈 Alur Kerja Lengkap

```
┌─────────────┐
│  Login      │
└──────┬──────┘
       │
       ▼
┌─────────────────────┐
│ Buka Menu           │
│ "Produk Layanan"    │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐     ┌──────────────────┐
│ Pilih Tahun         │────▶│ Data Terfilter   │
└──────┬──────────────┘     └──────────────────┘
       │
       ├─────────────┬─────────────┬────────────┐
       ▼             ▼             ▼            ▼
┌──────────┐  ┌──────────┐  ┌──────────┐ ┌──────────┐
│ Tambah   │  │ Import   │  │ Edit     │ │ Export   │
│ Manual   │  │ CSV      │  │ Data     │ │ CSV      │
└────┬─────┘  └────┬─────┘  └────┬─────┘ └────┬─────┘
     │             │              │            │
     ▼             ▼              ▼            ▼
┌─────────────────────────────────────────────────────┐
│ 1. Isi Info Dasar (jenis, INA-CBG, dokter)         │
│ 2. Isi Diagnosa & Prosedur                         │
│ 3. Pilih Layanan:                                  │
│    - Tindakan                                      │
│    - IBS/Operatif                                  │
│    - Laboratorium                                  │
│    - Radiologi                                     │
│    - Farmasi                                       │
│    - Kamar Akomodasi                               │
│    - Visite                                        │
│    - Konsultasi                                    │
│ 4. Sistem hitung Total Biaya otomatis              │
└─────────────────────────────────────────────────────┘
     │
     ▼
┌─────────────────────┐
│ Data Tersimpan      │
│ di Database         │
└─────────────────────┘
```

---

## 🔐 Keamanan Data

- ✅ **Row Level Security (RLS)** aktif
- ✅ Data terisolasi per user
- ✅ Hanya user yang bersangkutan bisa akses datanya
- ✅ Auto-populate `user_id` saat insert
- ✅ Validasi data di level database

---

## 📝 Catatan Penting

1. **Data Layanan dari Rekapitulasi**
   - Layanan yang muncul di dropdown adalah yang sudah ada di Rekapitulasi Unit Cost
   - Pastikan sudah melakukan kalkulasi unit cost terlebih dahulu

2. **Total Biaya Auto-Calculate**
   - Total biaya dihitung otomatis oleh database trigger
   - Tidak perlu input manual

3. **Filter by Jenis Layanan**
   - Tindakan: Rawat jalan + rawat inap
   - IBS: Tindakan operatif
   - Laboratorium: Pemeriksaan lab
   - Radiologi: Pemeriksaan radiologi
   - Farmasi: Unit Farmasi (UK040)
   - Visite: Unit IGD (UK055)

4. **Data Persistence**
   - Data tersimpan per user
   - Data tersimpan per tahun
   - Tidak ada relasi antar tahun

---

## 🚀 Future Features (Coming Soon)

- [ ] Filter advanced (by jenis, INA-CBG, dokter)
- [ ] Clone produk layanan existing
- [ ] Preset template produk layanan
- [ ] Generate PDF report
- [ ] Integration dengan Skenario Tarif
- [ ] Bulk operations (edit/delete multiple)
- [ ] Chart visualisasi distribusi biaya
- [ ] History/audit trail

---

## 📞 Support

Jika mengalami kesulitan, cek:
1. **DOKUMENTASI_PRODUK_LAYANAN.md** - Dokumentasi teknis lengkap
2. **SUMMARY_PRODUK_LAYANAN.md** - Summary implementasi
3. Console browser untuk error messages
4. Database advisor untuk security issues

---

**Version**: 1.0.0  
**Last Updated**: Januari 2025  
**Status**: ✅ Production Ready

