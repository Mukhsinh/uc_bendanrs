# 📋 Dokumentasi Lengkap Struktur Skema Aplikasi Unit Cost RS

## 🎯 Overview

**Aplikasi Unit Cost RS** adalah sistem komprehensif untuk penghitungan Unit Cost di rumah sakit dengan pendekatan **Integratif, Analitik, dan Rasional** berdasarkan Keputusan Menteri Kesehatan Republik Indonesia Nomor HK.01.07/MENKES/346/2025 tentang Pedoman Penghitungan Biaya Satuan Pelayanan di Rumah Sakit.

---

## 🏗️ Arsitektur Sistem

### **Frontend Architecture**
- **Framework**: React 18.3.1 dengan TypeScript
- **Build Tool**: Vite 6.3.4
- **UI Framework**: Tailwind CSS 3.4.11
- **Component Library**: Radix UI + Custom Components
- **State Management**: TanStack React Query 5.56.2
- **Routing**: React Router DOM 6.26.2
- **Authentication**: Supabase Auth UI React 0.4.7

### **Backend Architecture**
- **Database**: PostgreSQL (Supabase)
- **Authentication**: Supabase Auth
- **Real-time**: Supabase Realtime
- **Storage**: Supabase Storage
- **API**: Supabase REST & GraphQL

---

## 📁 Struktur Folder Aplikasi

```
src/
├── components/              # Komponen UI Reusable
│   ├── ui/                 # Komponen UI Base (Radix UI)
│   ├── Layout.tsx          # Layout utama aplikasi
│   ├── SidebarNav.tsx      # Navigasi sidebar
│   ├── SidebarToggleContext.tsx # Context untuk toggle sidebar
│   └── [Form Components]   # Komponen form untuk setiap modul
├── pages/                  # Halaman aplikasi
│   ├── Index.tsx          # Dashboard utama
│   ├── Login.tsx          # Halaman login
│   ├── data-master/       # Halaman data master
│   ├── kalkulasi/         # Halaman kalkulasi biaya
│   └── [Other Pages]      # Halaman lainnya
├── hooks/                 # Custom React Hooks
├── integrations/          # Integrasi eksternal
│   └── supabase/         # Konfigurasi Supabase
├── lib/                  # Utility libraries
├── services/             # Business logic services
├── types/               # TypeScript type definitions
└── utils/              # Utility functions
```

---

## 🗄️ Database Schema

### **1. Tabel Master Data**

#### **unit_kerja**
```sql
CREATE TABLE unit_kerja (
  id UUID PRIMARY KEY,
  kode VARCHAR(50) UNIQUE NOT NULL,
  nama VARCHAR(255) NOT NULL,
  lokasi VARCHAR(255),
  luas_ruangan DECIMAL(10,2),
  kategori VARCHAR(50) CHECK (kategori IN ('Pusat Biaya', 'Pusat Pendapatan')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### **barang**
```sql
CREATE TABLE barang (
  id UUID PRIMARY KEY,
  kode VARCHAR(50) UNIQUE NOT NULL,
  nama VARCHAR(255) NOT NULL,
  satuan VARCHAR(50),
  harga DECIMAL(15,2),
  kategori VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### **barang_gizi**
```sql
CREATE TABLE barang_gizi (
  id UUID PRIMARY KEY,
  kode VARCHAR(50) UNIQUE NOT NULL,
  nama VARCHAR(255) NOT NULL,
  satuan VARCHAR(50),
  harga DECIMAL(15,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### **2. Tabel Data Operasional**

#### **Data_Kegiatan**
```sql
CREATE TABLE "Data_Kegiatan" (
  id SERIAL PRIMARY KEY,
  "Kode_UK" VARCHAR(50),
  "Nama_Unit_Kerja" VARCHAR(255),
  tahun INTEGER,
  unit_kerja_id UUID,
  
  -- SDM
  "Jml_jam_Praktek_per_hari" INTEGER,
  "SDM_Dr" INTEGER,
  "SDM_Prwt" INTEGER,
  "SDM_Non" INTEGER,
  
  -- Sumber Daya
  "Listrik_kwh" FLOAT,
  "Air_m3" FLOAT,
  "Telepon_Freq_pakai_per_titik" INTEGER,
  "Komputer_SIMRS_jml_User" INTEGER,
  
  -- Fasilitas
  "Tempat_Tidur_SVIP" INTEGER,
  "Tempat_Tidur_VIP" INTEGER,
  "Tempat_Tidur_I" INTEGER,
  "Tempat_Tidur_II" INTEGER,
  "Tempat_Tidur_III" INTEGER,
  "Tempat_Tidur_Khusus" INTEGER,
  
  -- Kunjungan & Pelayanan
  "Kunjungan_jml_pasien_Lama" INTEGER,
  "Kunjungan_jml_pasien_Baru" INTEGER,
  "Kunjungan_jml_pasien_Total" INTEGER,
  "Tindakan_Pemeriksaan_jml_Tindakan" INTEGER,
  "Resep_Lembar_Resep" INTEGER,
  
  -- Lainnya
  "Cucian_kg_Cucian" FLOAT,
  "Instrumen_Besar" INTEGER,
  "Instrumen_Sedang" INTEGER,
  "Instrumen_Kecil" INTEGER,
  "Set_Pack_Besar" INTEGER,
  "Set_Pack_Sedang" INTEGER,
  "Set_Pack_Kecil" INTEGER,
  "Makanan_Karyawan_jml_Porsi" INTEGER,
  "Makanan_Pasien_jml_Porsi" INTEGER,
  
  -- Hari Rawat
  "Hari_Rawat_SVIP" INTEGER,
  "Hari_Rawat_VIP" INTEGER,
  "Hari_Rawat_Utama" INTEGER,
  "Hari_Rawat_I" INTEGER,
  "Hari_Rawat_II" INTEGER,
  "Hari_Rawat_III" INTEGER,
  "Hari_Rawat_Khusus" INTEGER,
  
  -- Pendidikan
  "Pelayanan_Pendidikan_Total" INTEGER,
  "Pelayanan_Pendidikan_jml_Siswa" INTEGER,
  "Pelayanan_Pendidikan_Baru" INTEGER,
  "Pelayanan_Pendidikan_Lama" INTEGER,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### **data_biaya**
```sql
CREATE TABLE data_biaya (
  id UUID PRIMARY KEY,
  kode_uk VARCHAR(50),
  nama_unit_kerja VARCHAR(255),
  unit_kerja_id UUID,
  
  -- Biaya Langsung
  biaya_gaji_dokter DECIMAL(15,2),
  biaya_gaji_perawat DECIMAL(15,2),
  biaya_gaji_non_medis DECIMAL(15,2),
  biaya_obat DECIMAL(15,2),
  biaya_alkes DECIMAL(15,2),
  
  -- Biaya Tidak Langsung
  biaya_listrik DECIMAL(15,2),
  biaya_air DECIMAL(15,2),
  biaya_telepon DECIMAL(15,2),
  biaya_internet DECIMAL(15,2),
  biaya_maintenance DECIMAL(15,2),
  
  -- Computed Fields
  total_biaya_langsung DECIMAL(15,2) GENERATED ALWAYS AS (
    COALESCE(biaya_gaji_dokter, 0) + 
    COALESCE(biaya_gaji_perawat, 0) + 
    COALESCE(biaya_gaji_non_medis, 0) + 
    COALESCE(biaya_obat, 0) + 
    COALESCE(biaya_alkes, 0)
  ) STORED,
  
  total_biaya_tidak_langsung DECIMAL(15,2) GENERATED ALWAYS AS (
    COALESCE(biaya_listrik, 0) + 
    COALESCE(biaya_air, 0) + 
    COALESCE(biaya_telepon, 0) + 
    COALESCE(biaya_internet, 0) + 
    COALESCE(biaya_maintenance, 0)
  ) STORED,
  
  total_biaya DECIMAL(15,2) GENERATED ALWAYS AS (
    total_biaya_langsung + total_biaya_tidak_langsung
  ) STORED,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### **3. Tabel Distribusi Biaya**

#### **Dasar_Alokasi**
```sql
CREATE TABLE "Dasar_Alokasi" (
  id SERIAL PRIMARY KEY,
  "Kode_UK" VARCHAR(50) NOT NULL,
  "Nama_Unit_Kerja" VARCHAR(255) NOT NULL,
  "Kategori" VARCHAR(50) NOT NULL,
  "Dasar_Alokasi_Field" VARCHAR(100) NOT NULL,
  "Dasar_Alokasi_Value" DECIMAL(15,2) DEFAULT 0,
  "Tahun" INTEGER NOT NULL,
  "Unit_Kerja_ID" UUID,
  "Data_Kegiatan_ID" INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### **Distribusi_Biaya**
```sql
CREATE TABLE "Distribusi_Biaya" (
  id SERIAL PRIMARY KEY,
  "Kode_UK" VARCHAR(50) NOT NULL,
  "Nama_Unit_Kerja" VARCHAR(255) NOT NULL,
  "Kategori" VARCHAR(50) NOT NULL,
  "Dasar_Alokasi_Field" VARCHAR(100) NOT NULL,
  "Dasar_Alokasi_Value" DECIMAL(15,2) DEFAULT 0,
  "Total_Dasar_Alokasi" DECIMAL(15,2) DEFAULT 0,
  "Persentase_Alokasi" DECIMAL(5,4) DEFAULT 0,
  "Biaya_Dialokasikan" DECIMAL(15,2) DEFAULT 0,
  "Tahun" INTEGER NOT NULL,
  "Unit_Kerja_ID" UUID,
  "Data_Kegiatan_ID" INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

---

## 🧭 Struktur Navigasi & Routing

### **1. Dashboard**
- **Route**: `/`
- **Component**: `Index.tsx`
- **Fitur**: Landing page dengan overview sistem

### **2. Data Master**
- **Route**: `/data-master/*`
- **Sub-modules**:
  - `/data-master/unit-kerja` - Data Unit Kerja
  - `/data-master/barang` - Barang Farmasi
  - `/data-master/barang-gizi` - Barang Gizi
  - `/data-master/kamar` - Data Kamar
  - `/data-master/klinik` - Data Klinik
  - `/data-master/kegiatan` - Data Kegiatan
  - `/data-master/daftar-tindakan` - Daftar Tindakan
  - `/data-master/tindakan-*` - Tindakan spesifik (Lab, Radiologi, Operatif, BDRS, Cathlab)
  - `/data-master/pendapatan` - Data Pendapatan
  - `/data-master/biaya` - Data Biaya
  - `/data-master/menu-gizi` - Menu Gizi
  - `/data-master/diklat` - Data Diklat

### **3. Unit Penunjang**
- **Route**: `/kalkulasi-biaya-*`
- **Sub-modules**:
  - `/kalkulasi-biaya-gizi` - Kalkulasi Biaya Gizi
  - `/kalkulasi-biaya-laboratorium` - Kalkulasi Biaya Laboratorium
  - `/kalkulasi-biaya-radiologi` - Kalkulasi Biaya Radiologi
  - `/kalkulasi-biaya-bdrs` - Kalkulasi BDRS

### **4. Unit Keperawatan**
- **Route**: `/keperawatan/*`
- **Sub-modules**:
  - `/keperawatan/manajemen-tindakan-inap` - Manajemen Tindakan Inap
  - `/keperawatan/data-akomodasi-inap` - Data Akomodasi Inap
  - `/keperawatan/kalkulasi-tindakan-inap` - Kalkulasi Tindakan Inap
  - `/keperawatan/kalkulasi-biaya-kelas-akomodasi` - Kalkulasi Biaya Kelas Akomodasi

### **5. Unit Pelayanan**
- **Route**: `/kalkulasi-biaya-*`
- **Sub-modules**:
  - `/kalkulasi-biaya-rawat-jalan` - Kalkulasi Biaya Rawat Jalan
  - `/kalkulasi-biaya-operatif` - Kalkulasi Biaya Operatif
  - `/kalkulasi-biaya-cathlab` - Kalkulasi Biaya Cathlab

### **6. Unit Diklat**
- **Route**: `/kalkulasi-biaya-diklat`
- **Component**: `KalkulasiBiayaDiklat.tsx`

### **7. Rekapitulasi & Analisis**
- **Routes**:
  - `/rekapitulasi-unit-cost` - Rekapitulasi Unit Cost
  - `/skenario-tarif-tindakan` - Skenario Tarif Tindakan
  - `/skenario-tarif-akomodasi` - Skenario Tarif Akomodasi

### **8. Distribusi Biaya**
- **Route**: `/distribusi-biaya-*`
- **Sub-modules**:
  - `/distribusi-biaya-pertama` - Distribusi Biaya Pertama
  - `/distribusi-biaya-kedua` - Distribusi Biaya Kedua
  - `/distribusi-biaya-rekap` - Distribusi Biaya Rekap

### **9. Cost Recovery**
- **Route**: `/cost-recovery`
- **Component**: `CostRecovery.tsx`

---

## 🔧 Komponen Utama

### **1. Layout Components**
- **Layout.tsx**: Layout utama dengan sidebar dan header
- **SidebarNav.tsx**: Navigasi sidebar dengan accordion menu
- **SidebarToggleContext.tsx**: Context untuk toggle sidebar mobile

### **2. Form Components**
- **UnitKerjaFormTable.tsx**: Form data unit kerja
- **DataKegiatanFormTable.tsx**: Form data kegiatan
- **DataBiayaFormTable.tsx**: Form data biaya
- **PendapatanFormTable.tsx**: Form data pendapatan
- **[Spesifik Form Components]**: Form untuk setiap modul kalkulasi

### **3. UI Components**
- **ui/**: Komponen UI base menggunakan Radix UI
- **Button, Input, Select, Table, Dialog, dll.**

### **4. Hooks**
- **use-form-operations.ts**: Hook untuk operasi CRUD
- **use-mobile.tsx**: Hook untuk deteksi mobile
- **use-toast.ts**: Hook untuk notifikasi
- **useBahanPorsi.ts**: Hook khusus untuk bahan porsi

---

## 🔐 Authentication & Security

### **Authentication Flow**
1. **Login**: Menggunakan Supabase Auth UI
2. **Session Management**: Automatic session handling
3. **Protected Routes**: Semua route kecuali login dilindungi
4. **Role-based Access**: Menggunakan RLS (Row Level Security)

### **Security Features**
- **Row Level Security (RLS)**: Diaktifkan di semua tabel
- **Environment Variables**: Konfigurasi sensitif di env vars
- **HTTPS**: Wajib untuk production
- **Input Validation**: Validasi di frontend dan backend

---

## 📊 Fitur Utama

### **1. Data Master Management**
- ✅ CRUD operations untuk semua data master
- ✅ Import/Export data dengan template Excel/CSV
- ✅ Validasi data input
- ✅ Auto-populate relasi antar tabel

### **2. Kalkulasi Unit Cost**
- ✅ Kalkulasi biaya per unit kerja
- ✅ Activity Based Costing (ABC)
- ✅ Double Distribution Method
- ✅ Real-time calculation updates

### **3. Distribusi Biaya**
- ✅ Distribusi biaya tahap 1 dan 2
- ✅ Step-down method untuk departemen penunjang
- ✅ Dasar alokasi otomatis berdasarkan unit kerja
- ✅ Audit trail lengkap

### **4. Reporting & Analytics**
- ✅ Rekapitulasi unit cost
- ✅ Skenario tarif tindakan dan akomodasi
- ✅ Export laporan Excel
- ✅ Dashboard analytics

### **5. Cost Recovery**
- ✅ Analisis cost recovery
- ✅ Perhitungan profit margin
- ✅ Monitoring efisiensi biaya

---

## 🚀 Deployment & Environment

### **Development**
- **URL**: `http://localhost:8080`
- **Environment**: Development
- **Database**: Supabase Development

### **Production**
- **Platform**: Vercel (configured)
- **Database**: Supabase Production
- **Build Command**: `npm run build`
- **Environment Variables**: 
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`

---

## 📝 Dependencies

### **Core Dependencies**
```json
{
  "react": "^18.3.1",
  "react-dom": "^18.3.1",
  "react-router-dom": "^6.26.2",
  "@supabase/supabase-js": "^2.57.2",
  "@supabase/auth-ui-react": "^0.4.7",
  "@tanstack/react-query": "^5.56.2"
}
```

### **UI Dependencies**
```json
{
  "@radix-ui/react-*": "^1.x.x",
  "tailwindcss": "^3.4.11",
  "lucide-react": "^0.462.0",
  "class-variance-authority": "^0.7.1"
}
```

### **Utility Dependencies**
```json
{
  "chart.js": "^4.5.0",
  "papaparse": "^5.5.3",
  "xlsx": "^0.18.5",
  "date-fns": "^3.6.0",
  "zod": "^3.23.8"
}
```

---

## 🎯 Kesimpulan

**Aplikasi Unit Cost RS** adalah sistem yang komprehensif dengan:

1. **Arsitektur Modern**: React + TypeScript + Supabase
2. **Database Terstruktur**: PostgreSQL dengan RLS
3. **UI/UX Professional**: Tailwind CSS + Radix UI
4. **Fitur Lengkap**: CRUD, Kalkulasi, Distribusi, Reporting
5. **Security**: Authentication + Authorization
6. **Scalability**: Modular architecture
7. **Maintainability**: TypeScript + Clean Code

Sistem ini mengimplementasikan standar perhitungan unit cost sesuai dengan regulasi Kemenkes RI dan menggunakan pendekatan Activity Based Costing untuk akurasi perhitungan yang tinggi.

---

**Copyright © 2024 Mukhsin Hadi. Hak Cipta Dilindungi Undang-Undang**
