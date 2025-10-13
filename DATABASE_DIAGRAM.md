# Diagram Visual Database - Aplikasi Unit Cost RS

## 📐 Entity Relationship Diagram (ERD)

### Diagram Lengkap

```mermaid
erDiagram
    %% ============================================
    %% MASTER DATA TABLES
    %% ============================================
    
    USERS {
        uuid id PK
        string email
        timestamp created_at
    }
    
    UNIT_KERJA {
        uuid id PK
        varchar kode UK
        text nama
        text lokasi
        integer luas_ruangan
        text jenis
        text kategori
        uuid user_id FK
        timestamp created_at
        timestamp updated_at
    }
    
    DATA_KAMAR {
        uuid id PK
        varchar Kode_Kamar
        text Nama_Kamar
        boolean Kelas_SVIP
        boolean Kelas_VIP
        boolean Kelas_I
        boolean Kelas_II
        boolean Kelas_III
        boolean Kelas_Khusus
        uuid user_id FK
    }
    
    KLINIK {
        uuid id PK
        varchar kode_klinik
        text nama_klinik
        boolean Layanan_BPJS_Kes
        boolean Layanan_Umum_Asuransi
        uuid user_id FK
    }
    
    DAFTAR_TINDAKAN {
        uuid id PK
        varchar kode_tindakan UK
        text nama_tindakan
        boolean medis
        boolean paramedis
        numeric hk_waktu
        numeric alokasi_waktu
        numeric hasil_kali
        numeric alokasi_hk
        integer profesionalisme
        integer tingkat_kesulitan
        numeric biaya_bahan_tindakan
        uuid user_id FK
    }
    
    DATA_BARANG_FARMASI {
        uuid id PK
        varchar kode_barang UK
        text nama_barang
        varchar satuan
        varchar gudang
        numeric harga
        uuid user_id FK
    }
    
    MENU_GIZI {
        uuid id PK
        varchar kode_makanan UK
        text nama_makanan
        uuid user_id FK
    }
    
    %% ============================================
    %% TRANSACTION TABLES
    %% ============================================
    
    DATA_KEGIATAN {
        uuid id PK
        integer tahun
        varchar kode_unit_kerja FK
        text nama_unit_kerja
        numeric kunjungan_pasien_baru
        numeric kunjungan_pasien_lama
        numeric lama_hari_svip
        numeric lama_hari_vip
        numeric lama_hari_i
        numeric lama_hari_ii
        numeric lama_hari_iii
        numeric Jumlah_Tindakan
        numeric jumlah_porsi_svip
        numeric jumlah_porsi_vip
        numeric total_luas_ruangan
        numeric jumlah_pegawai
        uuid user_id FK
        timestamp created_at
        timestamp updated_at
    }
    
    DATA_BIAYA {
        uuid id PK
        integer tahun
        varchar kode_unit_kerja FK
        text nama_unit_kerja
        numeric biaya_pegawai
        numeric biaya_bahan
        numeric biaya_jasa_pelayanan
        numeric biaya_pemeliharaan
        numeric biaya_barang_jasa
        numeric biaya_penyusutan
        numeric biaya_farmasi
        numeric biaya_operasional_lainnya
        uuid user_id FK
        timestamp created_at
        timestamp updated_at
    }
    
    DATA_PENDAPATAN {
        uuid id PK
        integer tahun
        varchar kode_unit_kerja FK
        text nama_unit_kerja
        numeric pendapatan_umum
        numeric pendapatan_bpjs
        uuid user_id FK
        timestamp created_at
        timestamp updated_at
    }
    
    %% ============================================
    %% CALCULATION TABLES
    %% ============================================
    
    KALKULASI_BIAYA_BDRS {
        uuid id PK
        integer tahun
        varchar kode_unit_kerja FK
        varchar kode_tindakan FK
        text nama_tindakan
        integer jumlah_pemeriksaan
        numeric biaya_overhead
        numeric biaya_sdm
        numeric biaya_bahan_farmasi
        jsonb bahan_farmasi_list
        numeric waktu_pemeriksaan
        integer profesionalisme
        integer tingkat_kesulitan
        numeric unit_cost_per_pemeriksaan
        uuid user_id FK
    }
    
    KALKULASI_BIAYA_GIZI {
        uuid id PK
        integer tahun
        varchar kode FK
        text jenis_makanan
        numeric jumlah
        numeric jumlah_svip
        numeric jumlah_vip
        numeric jumlah_kelas_i
        numeric jumlah_kelas_ii
        numeric jumlah_kelas_iii
        numeric biaya_bahan
        numeric biaya_overhead
        numeric biaya_sdm
        numeric unit_cost_per_porsi
        jsonb bahan_list
        uuid user_id FK
    }
    
    KALKULASI_BIAYA_KELAS_AKOMODASI {
        uuid id PK
        integer tahun
        varchar kode_unit_kerja FK
        text nama_unit_kerja
        text kelas_akomodasi
        numeric lama_hari
        numeric biaya_overhead
        numeric biaya_sdm
        numeric unit_cost
        uuid user_id FK
    }
    
    %% ============================================
    %% DISTRIBUTION TABLES
    %% ============================================
    
    DISTRIBUSI_BIAYA_PERTAMA {
        uuid id PK
        integer tahun
        text unit_kerja_pusat_biaya
        numeric biaya_tahunan
        text dasar_alokasi
        numeric jumlah_biaya_terdistribusi_i
        text audit_check
        numeric uk001_direktur
        numeric uk002_komite_ppi
        numeric uk077_unit_diklat
        uuid user_id FK
        timestamp created_at
    }
    
    DISTRIBUSI_BIAYA_KEDUA {
        uuid id PK
        integer tahun
        text unit_kerja_pusat_biaya
        numeric biaya_alokasi_i
        text dasar_alokasi
        text keterangan
        numeric total_alokasi_i
        text audit_check
        numeric uk037_ambulance
        numeric uk077_unit_diklat
        numeric total_alokasi_biaya_kedua
        uuid user_id FK
        timestamp updated_at
    }
    
    DISTRIBUSI_BIAYA_REKAP {
        uuid id PK
        integer tahun
        text biaya
        integer urutan
        numeric uk037_ambulance
        numeric uk077_unit_diklat
        uuid user_id FK
        timestamp updated_at
    }
    
    %% ============================================
    %% OUTPUT & REPORTING TABLES
    %% ============================================
    
    REKAPITULASI_UNIT_COST {
        uuid id PK
        integer tahun
        varchar kode_unit_kerja FK
        text nama_unit_kerja
        varchar kode_tindakan FK
        text nama_tindakan
        numeric biaya_bahan
        numeric unit_cost_per_tindakan
        text sumber_tabel
        uuid user_id FK
        timestamp created_at
    }
    
    SKENARIO_TARIF {
        uuid id PK
        integer tahun
        varchar kode_unit_kerja FK
        varchar kode_tindakan FK
        text nama_tindakan
        numeric unit_cost_per_tindakan
        numeric biaya_bahan
        numeric jasa_sarana
        numeric jasa_pelayanan_medis
        numeric jasa_pelayanan_non_medis
        numeric jasa_pelayanan
        numeric tarif_per_tindakan
        numeric prosentase_profit
        text sumber_tabel
        uuid user_id FK
    }
    
    SKENARIO_TARIF_AKOMODASI {
        uuid id PK
        integer tahun
        numeric rata_rata_uc_vvip
        numeric rata_rata_uc_vip
        numeric rata_rata_uc_i
        numeric rata_rata_uc_ii
        numeric rata_rata_uc_iii
        numeric tarif_vvip
        numeric tarif_vip
        numeric tarif_i
        numeric tarif_ii
        numeric tarif_iii
        numeric profit_rupiah_vvip
        numeric profit_persen_vvip
    }
    
    RINCIAN_BUDGETING_BHP {
        uuid id PK
        integer tahun
        varchar kode_unit_kerja FK
        varchar kode_tindakan FK
        text nama_tindakan
        numeric jumlah_tindakan
        varchar kode_barang FK
        text nama_barang
        numeric qty_per_tindakan
        varchar satuan
        numeric harga_satuan
        numeric jumlah_total
        numeric total_rupiah
        text sumber_tabel
        uuid user_id FK
    }
    
    RUPIAH_BUDGETING_BHP {
        uuid id PK
        integer tahun
        varchar kode_unit_kerja FK
        text nama_unit_kerja
        numeric total_budgeting
        integer jumlah_item_bahan
        uuid user_id FK
    }
    
    %% ============================================
    %% RELATIONSHIPS
    %% ============================================
    
    %% User ownership
    USERS ||--o{ UNIT_KERJA : owns
    USERS ||--o{ DATA_KEGIATAN : owns
    USERS ||--o{ DATA_BIAYA : owns
    USERS ||--o{ DATA_PENDAPATAN : owns
    USERS ||--o{ KALKULASI_BIAYA_BDRS : owns
    USERS ||--o{ REKAPITULASI_UNIT_COST : owns
    
    %% Master to Transaction
    UNIT_KERJA ||--o{ DATA_KEGIATAN : "has activities"
    UNIT_KERJA ||--o{ DATA_BIAYA : "has costs"
    UNIT_KERJA ||--o{ DATA_PENDAPATAN : "generates revenue"
    
    %% Master to Calculation
    UNIT_KERJA ||--o{ KALKULASI_BIAYA_BDRS : "performs"
    DAFTAR_TINDAKAN ||--o{ KALKULASI_BIAYA_BDRS : "calculated for"
    MENU_GIZI ||--o{ KALKULASI_BIAYA_GIZI : "calculated for"
    DATA_BARANG_FARMASI ||--o{ RINCIAN_BUDGETING_BHP : "used in"
    
    %% Calculation to Distribution
    DATA_BIAYA ||--|| DISTRIBUSI_BIAYA_PERTAMA : "distributed as"
    DISTRIBUSI_BIAYA_PERTAMA ||--|| DISTRIBUSI_BIAYA_KEDUA : "flows to"
    DISTRIBUSI_BIAYA_KEDUA ||--|| DISTRIBUSI_BIAYA_REKAP : "summarized in"
    
    %% Calculation to Output
    KALKULASI_BIAYA_BDRS ||--o{ REKAPITULASI_UNIT_COST : "aggregated to"
    REKAPITULASI_UNIT_COST ||--o{ SKENARIO_TARIF : "generates"
    KALKULASI_BIAYA_KELAS_AKOMODASI ||--|| SKENARIO_TARIF_AKOMODASI : "generates"
    KALKULASI_BIAYA_BDRS ||--o{ RINCIAN_BUDGETING_BHP : "details in"
    RINCIAN_BUDGETING_BHP ||--o{ RUPIAH_BUDGETING_BHP : "summarized in"
```

---

## 🔄 Data Flow Diagram

### 1. Alur Input Data Master

```mermaid
graph TD
    A[User Login] --> B[Input Master Data]
    B --> C1[Unit Kerja]
    B --> C2[Tindakan]
    B --> C3[Barang Farmasi]
    B --> C4[Menu Gizi]
    C1 --> D[Master Data Ready]
    C2 --> D
    C3 --> D
    C4 --> D
    
    style A fill:#e1f5ff
    style B fill:#fff4e1
    style D fill:#e7ffe7
```

### 2. Alur Transaksi

```mermaid
graph LR
    A[Data Master] --> B[Input Data Kegiatan]
    A --> C[Input Data Biaya]
    A --> D[Input Data Pendapatan]
    
    B --> E[Transaksi Complete]
    C --> E
    D --> E
    
    E --> F[Ready for Calculation]
    
    style A fill:#e1f5ff
    style E fill:#e7ffe7
    style F fill:#ffe7e7
```

### 3. Alur Kalkulasi Unit Cost

```mermaid
graph TD
    A[Data Kegiatan] --> B[Pilih Unit Kerja]
    B --> C[Pilih Tindakan]
    C --> D[Input Bahan Farmasi]
    D --> E[Input Waktu & Profesionalisme]
    
    E --> F{Tipe Unit?}
    
    F -->|BDRS| G1[Kalkulasi BDRS]
    F -->|Lab| G2[Kalkulasi Lab]
    F -->|Radiologi| G3[Kalkulasi Radiologi]
    F -->|Operatif| G4[Kalkulasi Operatif]
    F -->|Cathlab| G5[Kalkulasi Cathlab]
    F -->|IBS| G6[Kalkulasi IBS]
    F -->|Gizi| G7[Kalkulasi Gizi]
    F -->|Akomodasi| G8[Kalkulasi Akomodasi]
    
    G1 --> H[Unit Cost Calculated]
    G2 --> H
    G3 --> H
    G4 --> H
    G5 --> H
    G6 --> H
    G7 --> H
    G8 --> H
    
    style A fill:#e1f5ff
    style H fill:#e7ffe7
```

### 4. Alur Distribusi Biaya (ABC Method)

```mermaid
graph TD
    A[Data Biaya Unit Administrasi] --> B[Distribusi Biaya Pertama]
    
    B --> C1[UK001 - Direktur]
    B --> C2[UK002 - Komite PPI]
    B --> C3[UK003 - PMKP]
    B --> C4[... 74 unit lainnya]
    B --> C5[UK077 - Diklat]
    
    C1 --> D{Jenis Unit?}
    C2 --> D
    C3 --> D
    C4 --> D
    C5 --> D
    
    D -->|Unit Penunjang| E[UK037-UK046]
    D -->|Unit Pelayanan| F[UK047-UK077]
    
    E --> G[Distribusi Biaya Kedua]
    G --> F
    
    F --> H[Distribusi Biaya Rekap]
    H --> I[Total Biaya per Unit Final]
    
    style A fill:#e1f5ff
    style B fill:#fff4e1
    style G fill:#ffe7e7
    style H fill:#f0e7ff
    style I fill:#e7ffe7
```

### 5. Alur Output & Reporting

```mermaid
graph TD
    A[Kalkulasi Complete] --> B[Generate Rekapitulasi Unit Cost]
    
    B --> C1[Skenario Tarif]
    B --> C2[Produk Layanan]
    B --> C3[Budgeting BHP Rincian]
    
    C1 --> D1[Tarif dengan Profit]
    C2 --> D2[Cost Recovery Analysis]
    C3 --> D3[Budgeting BHP Rupiah]
    
    D1 --> E[Dashboard & Reports]
    D2 --> E
    D3 --> E
    
    E --> F[Export Excel/PDF]
    
    style A fill:#e1f5ff
    style B fill:#fff4e1
    style E fill:#e7ffe7
    style F fill:#ffe7e7
```

---

## 📊 Diagram Komponen Unit Cost

### Formula Kalkulasi Unit Cost

```mermaid
graph LR
    A[Total Biaya Unit] --> B[Unit Cost]
    
    A1[Biaya Overhead] --> A
    A2[Biaya SDM] --> A
    A3[Biaya Bahan] --> A
    
    V[Volume Aktivitas] --> B
    
    B --> C[Unit Cost per Tindakan]
    
    style A fill:#ffe7e7
    style B fill:#e7ffe7
    style C fill:#e1f5ff
```

### Detail Komponen Biaya

```mermaid
graph TD
    A[Biaya Overhead] --> A1[Hasil Distribusi Biaya I]
    A1 --> A2[Hasil Distribusi Biaya II]
    
    B[Biaya SDM] --> B1[Waktu Pemeriksaan]
    B1 --> B2[× Profesionalisme 1-4]
    B2 --> B3[× Tingkat Kesulitan 1-7]
    
    C[Biaya Bahan] --> C1[Qty per Tindakan]
    C1 --> C2[× Harga Satuan]
    C2 --> C3[× Jumlah Tindakan]
    
    A2 --> D[Total Biaya]
    B3 --> D
    C3 --> D
    
    D --> E[Unit Cost]
    
    style D fill:#ffe7e7
    style E fill:#e7ffe7
```

---

## 🎯 Diagram Skenario Tarif

### Komponen Tarif

```mermaid
graph TD
    A[Unit Cost] --> B[+ Jasa Sarana 30%]
    B --> C[+ Jasa Pelayanan Medis]
    C --> D[+ Jasa Pelayanan Non-Medis]
    
    D --> E[= Tarif per Tindakan]
    
    E --> F[Tarif - Unit Cost]
    F --> G[= Profit Margin]
    
    G --> H[% Profit = Profit / Tarif × 100]
    
    style A fill:#e1f5ff
    style E fill:#e7ffe7
    style G fill:#ffe7e7
    style H fill:#fff4e1
```

---

## 📈 Diagram Cost Recovery

### Analisis Cost Recovery Rate

```mermaid
graph LR
    A[Total Biaya] --> C{Cost Recovery Rate}
    B[Total Pendapatan] --> C
    
    C --> D[> 100% = Profit]
    C --> E[= 100% = Break Even]
    C --> F[< 100% = Subsidi]
    
    B1[Pendapatan Umum] --> B
    B2[Pendapatan BPJS] --> B
    
    A1[Biaya Pegawai] --> A
    A2[Biaya Bahan] --> A
    A3[Biaya Operasional] --> A
    A4[Biaya Penyusutan] --> A
    
    style D fill:#e7ffe7
    style E fill:#fff4e1
    style F fill:#ffe7e7
```

---

## 🔐 Security Architecture

### Row Level Security (RLS)

```mermaid
graph TD
    A[User Request] --> B{Authenticated?}
    B -->|No| C[Access Denied]
    B -->|Yes| D{Check user_id}
    
    D -->|Match| E[Data Filter: WHERE user_id = auth.uid]
    D -->|No Match| F[No Data Returned]
    
    E --> G[Query Execution]
    G --> H[Return Filtered Results]
    
    style C fill:#ffe7e7
    style F fill:#ffe7e7
    style H fill:#e7ffe7
```

---

## 🔄 Stored Procedures Flow

### Sequence Diagram - Generate Reports

```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend
    participant S as Supabase
    participant DB as Database
    
    U->>F: Click "Perbarui Data"
    F->>S: Call populate_distribusi_biaya_pertama()
    S->>DB: Execute Function
    DB->>DB: Read data_biaya
    DB->>DB: Read data_kegiatan
    DB->>DB: Calculate proportions
    DB->>DB: Insert to distribusi_biaya_pertama
    DB-->>S: Success
    S-->>F: Return status
    
    F->>S: Call populate_distribusi_biaya_kedua()
    S->>DB: Execute Function
    DB->>DB: Read distribusi_biaya_pertama
    DB->>DB: Calculate distributions
    DB->>DB: Insert to distribusi_biaya_kedua
    DB-->>S: Success
    S-->>F: Return status
    
    F->>S: Call populate_rekapitulasi_unit_cost()
    S->>DB: Execute Function
    DB->>DB: Aggregate all kalkulasi_biaya_*
    DB->>DB: Insert to rekapitulasi_unit_cost
    DB-->>S: Success
    S-->>F: Return status
    
    F-->>U: Display Success Message
```

---

## 📦 Data Structure - JSONB Fields

### bahan_farmasi_list Structure

```json
[
  {
    "kode_barang": "BRG001",
    "nama": "Hansaplast 1.25 cm",
    "qty": 2,
    "harga_satuan": 5000,
    "harga_total": 10000
  },
  {
    "kode_barang": "BRG002",
    "nama": "Kasa Steril 10x10",
    "qty": 5,
    "harga_satuan": 3000,
    "harga_total": 15000
  }
]
```

### bahan_list (Gizi) Structure

```json
[
  {
    "kode_barang": "GZI001",
    "nama_barang": "Beras Premium",
    "qty": 0.2,
    "satuan": "kg",
    "harga": 15000
  },
  {
    "kode_barang": "GZI002",
    "nama_barang": "Ayam Fillet",
    "qty": 0.1,
    "satuan": "kg",
    "harga": 45000
  }
]
```

---

## 🎨 Color Coding Legend

Dalam diagram di atas, warna menunjukkan:

| Warna | Kategori | Deskripsi |
|-------|----------|-----------|
| 🔵 Biru (`#e1f5ff`) | Input/Source | Data input awal atau sumber data |
| 🟡 Kuning (`#fff4e1`) | Process | Proses transformasi atau kalkulasi |
| 🔴 Merah (`#ffe7e7`) | Critical/Important | Node penting atau hasil kritis |
| 🟣 Ungu (`#f0e7ff`) | Intermediate | Hasil sementara atau tahap tengah |
| 🟢 Hijau (`#e7ffe7`) | Output/Success | Hasil akhir atau status sukses |

---

## 📝 Notes

1. **UUID sebagai Primary Key**: Semua tabel menggunakan UUID untuk distributed system compatibility
2. **JSONB untuk Flexibility**: Bahan farmasi disimpan sebagai JSONB untuk fleksibilitas
3. **Indexing**: Index dibuat pada kolom yang sering di-query (kode, tahun, user_id)
4. **RLS Enforcement**: Semua tabel protected dengan Row Level Security
5. **Soft Delete**: Tidak ada soft delete, semua delete adalah hard delete
6. **Audit Trail**: created_at dan updated_at untuk tracking perubahan
7. **Cascade Delete**: Tidak ada cascade, harus manual delete related records

---

**Versi**: 1.0  
**Terakhir Update**: 2025-01-11

