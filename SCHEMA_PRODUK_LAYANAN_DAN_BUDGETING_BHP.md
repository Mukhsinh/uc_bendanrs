## Skema: Produk Layanan dan Budgeting BHP

### 1) Tabel: `produk_layanan`

- id uuid pk default gen_random_uuid()
- user_id uuid fk -> auth.users(id) [RLS aktif]
- tahun int default 2025
- jenis text check ('rawat jalan','rawat inap')
- inacbg, grouper, inacbgs text
- diaglist text; diagnosa_1..5 text
- proclist text; proc_1..5 text
- los int default 0
- spesialisasi_dokter, nama_dokter, kode_dokter text
- tindakan jsonb default []
- ibs jsonb default []
- laboratorium jsonb default []
- radiologi jsonb default []
- farmasi jsonb default []
- kamar_akomodasi jsonb default []
- visite jsonb default []
- konsultasi jsonb default []
- total_biaya bigint default 0 (diisi trigger)
- created_at, updated_at timestamptz default now()

Triggers/Functions:
- update_produk_layanan_timestamp(): BEFORE UPDATE → set NEW.updated_at
- calculate_total_biaya_produk_layanan(): BEFORE INSERT/UPDATE → jumlahkan subtotal dari semua array layanan ke `total_biaya`

RLS Policies: SELECT/INSERT/UPDATE/DELETE terbatas ke auth.uid() = user_id

Format item JSON layanan:
```
{
  "kode_tindakan": "T.001",
  "nama_tindakan": "Konsultasi Dokter",
  "unit_cost": 50000,
  "biaya_bhp": 10000,
  "qty": 1,
  "subtotal": 60000
}
```

Sumber nilai UC/BHP: tabel `rekapitulasi_unit_cost` (lihat bagian 3)

---

### 2) Budgeting BHP

#### 2.1) Tabel: `budgeting_bhp_farmasi` (rekap per tindakan)
- id uuid pk
- user_id uuid (RLS)
- tahun int
- kode_jenis smallint
- kode_unit_kerja, nama_unit_kerja text
- kode_operator, nama_operator text nullable
- kode_tindakan, nama_tindakan text
- biaya_bahan bigint (dari tabel sumber)
- unit_cost_per_tindakan bigint (dari tabel sumber)
- jumlah_tindakan int
- rincian_bahan jsonb nullable (array bahan per tindakan)
- total_budgeting_bhp bigint GENERATED ALWAYS AS (biaya_bahan * jumlah_tindakan)
- total_budgeting_rincian bigint (terisi oleh trigger di tabel rincian)
- pendapatan bigint (lookup dari `data_pendapatan`)
- rasio_bhp_pendapatan numeric GENERATED (total_budgeting_bhp / pendapatan * 100)
- sumber_tabel text check salah satu tabel kalkulasi (lab, radiologi, bdrs, rj, ri, operatif, cathlab)
- created_at, updated_at timestamptz default now()

Catatan: kolom `rincian_bahan` digunakan sebagai sumber resmi quantity per tindakan dan harga satuan untuk sinkronisasi rincian (lihat 2.3 dan 4).

Contoh `rincian_bahan`:
```
[
  {"nama":"Nacl 0,9% Infus 500 Ml","jumlah":1,"satuan":"FLS","harga_total":5755,"harga_satuan":5755},
  {"nama":"Kasa Lipat 6X10Cm","jumlah":2,"satuan":"BUAH","harga_total":1708,"harga_satuan":854}
]
```

#### 2.2) Tabel: `rincian_budgeting_bhp` (detail bahan per tindakan)
- id uuid pk
- user_id uuid (RLS)
- budgeting_bhp_farmasi_id uuid fk → budgeting_bhp_farmasi(id)
- tahun int default 2025
- kode_unit_kerja, nama_unit_kerja text
- kode_tindakan, nama_tindakan text
- jumlah_tindakan int (volume periode)
- kode_barang text (diisi dari mapping/JSON atau master barang)
- nama_barang text
- qty_per_tindakan numeric NOT NULL (bahan per 1 tindakan)
- satuan text
- harga_satuan numeric
- jumlah_total numeric GENERATED ALWAYS AS (jumlah_tindakan * COALESCE(qty_per_tindakan,0))
- total_rupiah numeric GENERATED ALWAYS AS (jumlah_total * COALESCE(harga_satuan,0))
- sumber_tabel text nullable
- created_at, updated_at timestamptz default now()

Kolom turunan tambahan:
- jumlah numeric GENERATED ALWAYS AS (qty_per_tindakan) STORED (alias untuk kompatibilitas lama UI)

Sinkronisasi data:
- `kode_barang` → prioritas: rincian_bahan.kode_barang; jika kosong, cocokkan `nama_barang` ke `data_barang_farmasi` lalu `data_barang_gizi`.
- `qty_per_tindakan` → disinkron dari field `jumlah` (atau `qty_per_tindakan`) pada JSON `rincian_bahan`.

#### 2.3) RPC & Proses Penyegaran
- `populate_budgeting_bhp_farmasi(p_user_id uuid, p_tahun int)`
  - Mengisi/menyegarkan tabel rekap `budgeting_bhp_farmasi` dari sumber kalkulasi dan pendapatan.
- `populate_rincian_budgeting_bhp(p_user_id uuid, p_tahun int)`
  - Menghasilkan baris `rincian_budgeting_bhp` per item bahan untuk setiap tindakan pada `budgeting_bhp_farmasi`.
  - Menggunakan `budgeting_bhp_farmasi.rincian_bahan` sebagai sumber resmi.

Job perbaikan data (migrasi yang diterapkan):
- Sinkron `qty_per_tindakan` dari JSON `rincian_bahan` → tidak boleh 0.
- Isi `kode_barang` dari JSON / master barang.
- Tambah kolom generated `jumlah` (= `qty_per_tindakan`) untuk kompatibilitas UI/kueri lama.

---

### 3) Sumber Nilai Unit Cost (Referensi)

Tabel: `rekapitulasi_unit_cost`
- Menyimpan gabungan hasil perhitungan dari: `kalkulasi_biaya_laboratorium`, `kalkulasi_biaya_radiologi`, `kalkulasi_bdrs`, `kalkulasi_tindakan_inap`, `kalkulasi_tindakan_rawat_jalan`, `kalkulasi_biaya_operatif`, `kalkulasi_biaya_cathlab`.
- Kolom kunci: tahun, kode_jenis, kode_unit_kerja, (opsional) kode_operator, kode_tindakan, nama_tindakan, biaya_bahan, unit_cost_per_tindakan, sumber_tabel.

Komponen UI `ServiceSelector` mengambil daftar layanan dari tabel ini dan membentuk item JSON layanan di `produk_layanan`.

---

### 4) Alur Data BHP (Ringkas)

1. Hasil kalkulasi per tindakan → diangkat ke `rekapitulasi_unit_cost`.
2. `populate_budgeting_bhp_farmasi()` membuat rekap BHP per tindakan + jumlah tindakan per periode.
3. `populate_rincian_budgeting_bhp()` mem-"explode" rincian bahan per tindakan:
   - qty per tindakan = `rincian_bahan[].jumlah`
   - harga satuan = `rincian_bahan[].harga_satuan`
   - kode barang = `rincian_bahan[].kode_barang` (bila ada) atau hasil mapping nama ke master barang.
4. Nilai turunan:
   - jumlah_total = jumlah_tindakan × qty_per_tindakan
   - total_rupiah = jumlah_total × harga_satuan

---

### 5) Catatan Implementasi & Validasi

- Integritas nilai qty: seluruh baris `rincian_budgeting_bhp` sekarang memiliki `qty_per_tindakan > 0` (hasil sinkronisasi dari JSON sumber).
- Integritas kode barang: diisi dari JSON/mapping master; tidak ada baris dengan kode_barang kosong setelah backfill.
- UI:
  - Halaman "Budgeting BHP (Rincian)" menampilkan Qty/Tindakan, Kode Barang, Jumlah Total, Total Rupiah yang konsisten dengan rumus di atas.
  - Tombol "Perbarui" memanggil RPC, aman karena kolom turunan dihitung otomatis.

---

### 6) Kebijakan Keamanan (RLS)

Semua tabel aplikasi utama menggunakan RLS dan terikat ke `auth.uid()`:
- `produk_layanan`, `budgeting_bhp_farmasi`, `rincian_budgeting_bhp`

Disarankan meninjau tabel non-RLS (mis. tabel staging/lookup) agar tidak terekspos langsung via PostgREST.

---

### 7) Perubahan Skema Terakhir (Okt 2025)

- Penambahan tabel `produk_layanan` + triggers RLS lengkap.
- Penambahan kolom generated `jumlah` pada `rincian_budgeting_bhp` (alias dari qty_per_tindakan).
- Backfill dan sinkronisasi `kode_barang` dan `qty_per_tindakan` dari `budgeting_bhp_farmasi.rincian_bahan`/master barang.

Dokumen ini menggambarkan struktur dan alur terbaru agar analisis/reporting dan pengembangan lanjutan konsisten.


