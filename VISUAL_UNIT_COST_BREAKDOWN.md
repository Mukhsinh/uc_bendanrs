# 📊 Visual Breakdown: Unit Cost Tindakan Inap

## 💰 Struktur Biaya Per Tindakan

```
┌─────────────────────────────────────────────────────────────────┐
│                 TOTAL BIAYA PER TINDAKAN                        │
│                                                                 │
│  ┌──────────────────────────────────┐  ┌───────────────────┐  │
│  │  UNIT COST TINDAKAN INAP         │  │  BIAYA BAHAN      │  │
│  │  (24 Komponen Biaya)             │  │  TINDAKAN         │  │
│  │                                  │  │  (Terpisah)       │  │
│  │  Rp 271,722                      │  │  Rp 1,569         │  │
│  └──────────────────────────────────┘  └───────────────────┘  │
│                                                                 │
│              = Rp 273,291 (Total)                              │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔍 Detail: Unit Cost Tindakan Inap (24 Komponen)

### Contoh: UK046 - T.001 (rawat luka) - 21 tindakan

```
┌─────────────────────────────────────────────────────────────┐
│  UNIT COST TINDAKAN INAP = Rp 271,722                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  A. BIAYA SDM (3 komponen)                  = Rp 194,205   │
│     ├─ Gaji & Tunjangan            194,205                 │
│     ├─ Jasa Pelayanan                    0                 │
│     └─ Pendidikan & Pelatihan            0                 │
│                                                             │
│  B. BIAYA BAHAN (4 komponen)                = Rp 0         │
│     ├─ Obat                              0                 │
│     ├─ BHP                               0                 │
│     ├─ Makan Karyawan                    0                 │
│     └─ Makan Pasien                      0                 │
│                                                             │
│  C. BIAYA OPERASIONAL (18 komponen)         = Rp 42,327    │
│     ├─ Rumah Tangga                      xxx                │
│     ├─ Cetak                             xxx                │
│     ├─ ATK                               xxx                │
│     ├─ Listrik                        10,047                │
│     ├─ Air                               xxx                │
│     ├─ Telepon                           xxx                │
│     ├─ Pemeliharaan Bangunan            xxx                │
│     ├─ Pemeliharaan Alat Medis          xxx                │
│     ├─ Pemeliharaan Alat Non Medis      xxx                │
│     ├─ Operasional Lainnya              xxx                │
│     ├─ Penyusutan Gedung                xxx                │
│     ├─ Penyusutan Jaringan              xxx                │
│     ├─ Penyusutan Alat Medis            xxx                │
│     ├─ Penyusutan Alat Non Medis        xxx                │
│     ├─ Laundry                          xxx                │
│     └─ Sterilisasi                      xxx                │
│                                                             │
│  D. BIAYA TIDAK LANGSUNG (1 komponen)       = Rp 35,190    │
│     └─ Biaya Tidak Langsung           35,190                │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  TOTAL (A + B + C + D)                      = Rp 271,722   │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  BIAYA BAHAN TINDAKAN (TERPISAH)           = Rp 1,569      │
│  ↑                                                          │
│  Dari tabel daftar_tindakan (master data)                  │
│  Nilai SAMA untuk semua unit kerja                         │
└─────────────────────────────────────────────────────────────┘

═══════════════════════════════════════════════════════════════
  TOTAL BIAYA PER TINDAKAN = 271,722 + 1,569 = Rp 273,291
═══════════════════════════════════════════════════════════════
```

---

## 📈 Perbandingan 3 Tindakan Berbeda

### Data: UK046 - Terang bulan (VIP-VVIP)

```
┌────────────────────────────────────────────────────────────────────────┐
│                     T.001 (rawat luka)                                 │
│  Jumlah: 21 | Waktu: 15 | Prof: 2 | Tingkat: 3                        │
├────────────────────────────────────────────────────────────────────────┤
│  Unit Cost (24 biaya):              Rp 271,722                         │
│  Biaya Bahan (terpisah):            Rp   1,569                         │
│  ─────────────────────────────────────────────                         │
│  TOTAL:                             Rp 273,291                         │
└────────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────────┐
│                     T.002 (injeksi 5 cc)                               │
│  Jumlah: 585 | Waktu: 15 | Prof: 1 | Tingkat: 1                       │
├────────────────────────────────────────────────────────────────────────┤
│  Unit Cost (24 biaya):            Rp 3,061,056                         │
│  Biaya Bahan (terpisah):          Rp     1,790                         │
│  ─────────────────────────────────────────────                         │
│  TOTAL:                           Rp 3,062,846                         │
└────────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────────┐
│                   T.003 (rawat luka sedang)                            │
│  Jumlah: 104 | Waktu: 10 | Prof: 1 | Tingkat: 1                       │
├────────────────────────────────────────────────────────────────────────┤
│  Unit Cost (24 biaya):              Rp 362,792                         │
│  Biaya Bahan (terpisah):            Rp   6,976                         │
│  ─────────────────────────────────────────────                         │
│  TOTAL:                             Rp 369,768                         │
└────────────────────────────────────────────────────────────────────────┘
```

**Observasi:**
- ✅ Unit Cost **BERVARIASI** antar tindakan (tergantung jumlah & kompleksitas)
- ✅ Biaya Bahan **TETAP** per jenis tindakan (dari master)
- ✅ Total = Unit Cost + Biaya Bahan

---

## 🎯 Pertanyaan & Jawaban

### ❓ Apakah biaya_bahan_tindakan sudah termasuk dalam unit_cost?
**❌ TIDAK!** Unit cost dan biaya bahan adalah dua kolom terpisah.

### ❓ Berapa komponen biaya dalam unit_cost?
**✅ 24 komponen** (SDM, Operasional, Tidak Langsung)

### ❓ Bagaimana cara menghitung total biaya per tindakan?
**✅ Total = unit_cost_tindakan_inap + biaya_bahan_tindakan**

### ❓ Apakah saya perlu mengisi unit_cost manual?
**❌ TIDAK!** Unit cost adalah **GENERATED COLUMN** yang otomatis dihitung oleh database.

### ❓ Apakah saya perlu mengisi 24 kolom biaya manual?
**❌ TIDAK!** Sistem otomatis distribusikan biaya dari:
- `data_biaya` (biaya tahunan)
- `distribusi_biaya_rekap` (biaya tidak langsung)

---

## 📊 Diagram Alur

```
DATA INPUT (Manual)
    ↓
┌─────────────────────────┐
│ jenis_tindakan_inap     │
│ - jumlah tindakan       │
└───────────┬─────────────┘
            ↓
      AUTO SYNC
            ↓
┌─────────────────────────────────────────────────────────┐
│ kalkulasi_tindakan_inap                                 │
│                                                         │
│  1. Copy: jumlah, waktu, prof, tingkat                  │
│  2. Calculate: dasar_alokasi (DA_waktu, DA_hasil)       │
│  3. Distribute: 24 kolom biaya                          │
│     ├─ Biaya SDM (× DA_hasil_kali)                      │
│     ├─ Biaya Operasional (× DA_kali_waktu)              │
│     └─ Biaya Tidak Langsung (× DA_kali_waktu)           │
│                                                         │
│  4. AUTO-CALCULATE:                                     │
│     unit_cost = SUM(24 biaya) ← GENERATED COLUMN        │
│                                                         │
│  5. biaya_bahan_tindakan (copy dari daftar_tindakan)    │
│     ↑ TERPISAH, TIDAK termasuk dalam unit_cost          │
└─────────────────────────────────────────────────────────┘
            ↓
     HASIL AKHIR
            ↓
┌─────────────────────────────────────────────────────────┐
│ TAMPILAN DI HALAMAN                                     │
│                                                         │
│  Unit Cost: Rp 271,722  (24 biaya)                      │
│  Biaya Bahan: Rp 1,569  (terpisah)                      │
│  ───────────────────────────────                        │
│  Total: Rp 273,291                                      │
└─────────────────────────────────────────────────────────┘
```

---

## ✅ Kesimpulan

### 1. **Unit Cost Tindakan Inap**
- ✅ **Otomatis dihitung** oleh database (GENERATED COLUMN)
- ✅ Berisi **24 komponen biaya** (SDM + Operasional + Tidak Langsung)
- ❌ **TIDAK termasuk** biaya_bahan_tindakan

### 2. **Biaya Bahan Tindakan**
- ✅ Kolom **terpisah** dari unit_cost
- ✅ Nilai dari tabel `daftar_tindakan`
- ✅ Tetap sama untuk semua unit kerja (per jenis tindakan)

### 3. **Total Biaya**
- ✅ Total = `unit_cost_tindakan_inap` + `biaya_bahan_tindakan`
- ✅ Ini adalah biaya sebenarnya per tindakan

---

**Dokumentasi lengkap telah dibuat:** `PENJELASAN_UNIT_COST_TINDAKAN_INAP.md` ✅



