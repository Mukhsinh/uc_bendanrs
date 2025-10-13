import React from 'react';
import jsPDF from 'jspdf';

interface ModulRelasiDatabaseProps {
  onDownloadStart?: () => void;
  onDownloadComplete?: () => void;
  onDownloadError?: (error: string) => void;
}

const ModulRelasiDatabase: React.FC<ModulRelasiDatabaseProps> = ({
  onDownloadStart,
  onDownloadComplete,
  onDownloadError
}) => {
  const generatePDF = async () => {
    try {
      onDownloadStart?.();
      
      // Create new PDF document
      const doc = new jsPDF();
      
      // Set document properties
      doc.setProperties({
        title: 'Modul Relasi Antar Tabel Database Unit Cost RS',
        subject: 'Dokumentasi Struktur Database',
        author: 'Mukhsin Hadi',
        creator: 'Aplikasi Unit Cost RS'
      });

      let currentPage = 1;
      const totalPages = 25;

      // Helper function to add page numbers
      const addPageNumber = (pageNum: number, totalPages: number) => {
        const margin = 42.5;
        doc.setFontSize(10);
        doc.setTextColor(128, 128, 128);
        doc.text(
          `Halaman ${pageNum} dari ${totalPages}`,
          doc.internal.pageSize.width - margin - 20,
          doc.internal.pageSize.height - 10
        );
      };

      // Helper function to add header with color
      const addHeader = (title: string, subtitle?: string) => {
        const margin = 42.5;
        doc.setFontSize(18);
        doc.setTextColor(128, 0, 128); // Purple color
        doc.setFont('arial', 'bold');
        doc.text(title, margin, 30);
        
        if (subtitle) {
          doc.setFontSize(11);
          doc.setFont('arial', 'normal');
          doc.setTextColor(100, 100, 100);
          doc.text(subtitle, margin, 40);
        }
        
        // Add colored separator line
        doc.setDrawColor(128, 0, 128);
        doc.line(margin, 45, doc.internal.pageSize.width - margin, 45);
      };

      // Helper function to add content with proper formatting
      const addContent = (content: string, startY: number = 60) => {
        const pageWidth = doc.internal.pageSize.width;
        const pageHeight = doc.internal.pageSize.height;
        const margin = 42.5; // 1.5cm margin untuk A4
        const maxWidth = pageWidth - (margin * 2) - 10; // Extra margin untuk keamanan
        
        doc.setFontSize(11);
        doc.setFont('arial', 'normal');
        doc.setTextColor(0, 0, 0);
        
        const lines = doc.splitTextToSize(content, maxWidth);
        let y = startY;
        
        for (let i = 0; i < lines.length; i++) {
          // Check if we need a new page
          if (y > pageHeight - 70) {
            addPageNumber(currentPage, totalPages);
            doc.addPage();
            currentPage++;
            y = 50;
          }
          
          const line = lines[i] as string;
          
          // Skip empty lines at the start of new page
          if (y === 50 && line.trim() === '') {
            continue;
          }
          
          // Handle different formatting
          if (line.startsWith('#')) {
            // Headers
            const headerText = line.replace(/^#+\s*/, '');
            const headerLevel = line.match(/^#+/)?.[0].length || 1;
            
            doc.setFontSize(16 - headerLevel);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(128, 0, 128); // Purple color for headers
            doc.text(headerText, margin, y);
            y += 8;
          } else if (line.startsWith('- ') || line.startsWith('* ')) {
            // Bullet points
            const bulletText = line.replace(/^[-*]\s*/, '');
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(0, 0, 0);
            doc.text('• ' + bulletText, margin + 10, y);
            y += 6;
          } else if (line.trim() === '') {
            // Empty lines
            y += 4;
          } else {
            // Regular text
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(0, 0, 0);
            doc.text(line, margin, y);
            y += 6;
          }
        }
        
        return y;
      };

      // ===== COVER PAGE =====
      const pageWidth = doc.internal.pageSize.width;
      const pageHeight = doc.internal.pageSize.height;
      
      // Background (Purple)
      doc.setFillColor(168, 85, 247); // Purple-500
      doc.rect(0, 0, pageWidth, pageHeight, "F");
      
      // Decorative circle
      doc.setFillColor(147, 51, 234); // Purple-600
      doc.circle(pageWidth / 2, -50, 120, "F");
      
      // Title
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(36);
      doc.setFont("times", "bold");
      doc.text("MODUL", pageWidth / 2, 65, { align: "center" });
      doc.setFontSize(28);
      doc.text("RELASI ANTAR TABEL", pageWidth / 2, 85, { align: "center" });
      doc.text("DATABASE", pageWidth / 2, 103, { align: "center" });
      
      // Subtitle
      doc.setFontSize(16);
      doc.setFont("times", "bolditalic");
      doc.text("Aplikasi Unit Cost RS", pageWidth / 2, 125, { align: "center" });
      
      // Description
      doc.setFontSize(11);
      doc.setFont("helvetica", "normal");
      doc.text("Struktur Database dan Hubungan Antar Tabel", pageWidth / 2, 140, { align: "center" });
      
      // Author section - white box
      doc.setFillColor(255, 255, 255);
      doc.roundedRect(20, 160, pageWidth - 40, 55, 3, 3, "F");
      
      doc.setTextColor(102, 0, 102);
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.text("Disusun oleh:", pageWidth / 2, 172, { align: "center" });
      
      doc.setFontSize(14);
      doc.setFont("times", "bold");
      doc.text("MUKHSIN HADI, SE, M.Si", pageWidth / 2, 185, { align: "center" });
      
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.text("CGAA, CPFRM, CSEP, CRP, CPRM, CSCAP, CPABC", pageWidth / 2, 195, { align: "center" });
      
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.text("Hak Cipta: 000831709", pageWidth / 2, 207, { align: "center" });
      
      // Footer
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(8);
      doc.setFont("helvetica", "italic");
      doc.text("Copyright © 2024 Mukhsin Hadi. Hak Cipta Dilindungi Undang-Undang.", pageWidth / 2, pageHeight - 10, { align: "center" });
      
      // New page for content
      doc.addPage();
      currentPage++;
      
      // ===== MODUL RELASI ANTAR TABEL DATABASE =====
      addHeader(
        'MODUL RELASI ANTAR TABEL DATABASE',
        'Struktur Database dan Hubungan Antar Tabel Unit Cost RS'
      );
      
      let y = addContent(`
# 1. STRUKTUR DATABASE UMUM

## 1.1 Overview Database
Database menggunakan PostgreSQL dengan struktur normalisasi yang optimal untuk aplikasi unit cost rumah sakit. Database terdiri dari 45+ tabel yang terorganisir dalam beberapa kategori utama dengan relasi yang terstruktur dan efisien.

## 1.2 Arsitektur Database
- **Database Engine**: PostgreSQL 14+
- **Character Set**: UTF-8
- **Collation**: Indonesian
- **Timezone**: Asia/Jakarta
- **Encoding**: UTF-8
- **Connection Pooling**: Supabase Pooler

## 1.3 Kategori Tabel Utama
- **Data Master**: 15 tabel
- **Data Transaksi**: 20 tabel
- **Data Kalkulasi**: 8 tabel
- **Data Distribusi**: 5 tabel
- **Data Laporan**: 7 tabel
- **System Tables**: 10 tabel

# 2. DIAGRAM ERD LENGKAP

## 2.1 Entity Relationship Diagram
Diagram ERD menunjukkan hubungan antar entitas dalam sistem database Unit Cost RS:

### Core Entities:
1. **Unit Kerja** (unit_kerja)
   - Primary Key: id (UUID)
   - Attributes: kode, nama, jenis, status
   - Relationships: One-to-Many dengan semua tabel transaksi

2. **Daftar Tindakan** (daftar_tindakan)
   - Primary Key: id (UUID)
   - Attributes: kode_tindakan, nama_tindakan, kategori
   - Relationships: One-to-Many dengan jenis_tindakan_*

3. **Data Barang** (data_barang)
   - Primary Key: id (UUID)
   - Attributes: kode_barang, nama_barang, harga_satuan
   - Relationships: One-to-Many dengan penggunaan_barang

4. **User** (auth.users)
   - Primary Key: id (UUID)
   - Attributes: email, role, created_at
   - Relationships: One-to-Many dengan semua tabel transaksi

## 2.2 Relationship Cardinalities
- **1:1 Relationships**: 5 relationships
- **1:Many Relationships**: 35 relationships
- **Many:Many Relationships**: 3 relationships (dengan junction tables)

## 2.3 Key Relationships
- unit_kerja (1) → jenis_tindakan_rawat_jalan (many)
- unit_kerja (1) → jenis_tindakan_rawat_inap (many)
- daftar_tindakan (1) → jenis_tindakan_rawat_jalan (many)
- daftar_tindakan (1) → jenis_tindakan_rawat_inap (many)
- auth.users (1) → semua_tabel_transaksi (many)

# 3. PENJELASAN SETIAP TABEL

## 3.1 Tabel Data Master

### A. Tabel unit_kerja
**Fungsi**: Menyimpan data unit kerja rumah sakit
**Primary Key**: id (UUID)
**Unique Constraint**: kode (VARCHAR)

**Struktur Tabel**:
- id: UUID, NOT NULL, PRIMARY KEY
- kode: VARCHAR(10), NOT NULL, UNIQUE
- nama: VARCHAR(255), NOT NULL
- jenis: INTEGER, NOT NULL (1=Rawat Jalan, 2=Rawat Inap, 3=Penunjang)
- status: BOOLEAN, DEFAULT true
- created_at: TIMESTAMP, DEFAULT NOW()
- updated_at: TIMESTAMP, DEFAULT NOW()

**Indexes**:
- PRIMARY KEY (id)
- UNIQUE INDEX idx_unit_kerja_kode (kode)
- INDEX idx_unit_kerja_jenis (jenis)
- INDEX idx_unit_kerja_status (status)

**Foreign Keys**: None (Master table)

### B. Tabel daftar_tindakan
**Fungsi**: Master data tindakan medis dan non-medis
**Primary Key**: id (UUID)
**Unique Constraint**: kode_tindakan (VARCHAR)

**Struktur Tabel**:
- id: UUID, NOT NULL, PRIMARY KEY
- kode_tindakan: VARCHAR(20), NOT NULL, UNIQUE
- nama_tindakan: VARCHAR(255), NOT NULL
- kategori: VARCHAR(50), NOT NULL
- waktu_standar: INTEGER, DEFAULT 0 (menit)
- tingkat_profesionalisme: INTEGER, DEFAULT 1 (1-5)
- tingkat_kesulitan: INTEGER, DEFAULT 1 (1-5)
- biaya_bahan: DECIMAL(15,2), DEFAULT 0
- tarif_bpjs: DECIMAL(15,2), DEFAULT 0
- created_at: TIMESTAMP, DEFAULT NOW()
- updated_at: TIMESTAMP, DEFAULT NOW()

**Indexes**:
- PRIMARY KEY (id)
- UNIQUE INDEX idx_daftar_tindakan_kode (kode_tindakan)
- INDEX idx_daftar_tindakan_kategori (kategori)
- INDEX idx_daftar_tindakan_waktu (waktu_standar)

**Foreign Keys**: None (Master table)

### C. Tabel data_barang
**Fungsi**: Katalog barang dan bahan habis pakai
**Primary Key**: id (UUID)
**Unique Constraint**: kode_barang (VARCHAR)

**Struktur Tabel**:
- id: UUID, NOT NULL, PRIMARY KEY
- kode_barang: VARCHAR(20), NOT NULL, UNIQUE
- nama_barang: VARCHAR(255), NOT NULL
- satuan: VARCHAR(20), NOT NULL
- harga_satuan: DECIMAL(15,2), NOT NULL
- kategori: VARCHAR(50), NOT NULL
- supplier: VARCHAR(100)
- min_stock: INTEGER, DEFAULT 0
- max_stock: INTEGER, DEFAULT 0
- status: BOOLEAN, DEFAULT true
- created_at: TIMESTAMP, DEFAULT NOW()
- updated_at: TIMESTAMP, DEFAULT NOW()

**Indexes**:
- PRIMARY KEY (id)
- UNIQUE INDEX idx_data_barang_kode (kode_barang)
- INDEX idx_data_barang_kategori (kategori)
- INDEX idx_data_barang_supplier (supplier)
- INDEX idx_data_barang_status (status)

**Foreign Keys**: None (Master table)

## 3.2 Tabel Data Transaksi

### A. Tabel jenis_tindakan_rawat_jalan
**Fungsi**: Menyimpan data tindakan yang dilakukan di unit rawat jalan
**Primary Key**: id (UUID)

**Struktur Tabel**:
- id: UUID, NOT NULL, PRIMARY KEY
- user_id: UUID, NOT NULL, REFERENCES auth.users(id)
- kode_jenis: INTEGER, NOT NULL, DEFAULT 1
- kode_unit_kerja: VARCHAR(10), NOT NULL
- nama_unit_kerja: VARCHAR(255), NOT NULL
- kode_jenis_tindakan: VARCHAR(20), NOT NULL
- jenis_tindakan: VARCHAR(255), NOT NULL
- jumlah: INTEGER, DEFAULT 0
- waktu: INTEGER, DEFAULT 0 (menit)
- profesionalisme: INTEGER, DEFAULT 1
- tingkat_kesulitan: INTEGER, DEFAULT 1
- biaya_bahan_tindakan: DECIMAL(15,2), DEFAULT 0
- hasil_kali_waktu: DECIMAL(15,2), DEFAULT 0
- hasil_kali: DECIMAL(15,2), DEFAULT 0
- created_at: TIMESTAMP, DEFAULT NOW()
- updated_at: TIMESTAMP, DEFAULT NOW()

**Indexes**:
- PRIMARY KEY (id)
- INDEX idx_jenis_tindakan_rj_user (user_id)
- INDEX idx_jenis_tindakan_rj_unit (kode_unit_kerja)
- INDEX idx_jenis_tindakan_rj_tindakan (kode_jenis_tindakan)
- INDEX idx_jenis_tindakan_rj_jumlah (jumlah)

**Foreign Keys**:
- user_id → auth.users(id) ON DELETE CASCADE
- kode_unit_kerja → unit_kerja(kode) ON DELETE RESTRICT
- kode_jenis_tindakan → daftar_tindakan(kode_tindakan) ON DELETE RESTRICT

### B. Tabel jenis_tindakan_rawat_inap
**Fungsi**: Menyimpan data tindakan yang dilakukan di unit rawat inap
**Primary Key**: id (UUID)

**Struktur Tabel**: Serupa dengan jenis_tindakan_rawat_jalan dengan kode_jenis = 2

**Foreign Keys**:
- user_id → auth.users(id) ON DELETE CASCADE
- kode_unit_kerja → unit_kerja(kode) ON DELETE RESTRICT
- kode_jenis_tindakan → daftar_tindakan(kode_tindakan) ON DELETE RESTRICT

### C. Tabel kalkulasi_biaya_gizi
**Fungsi**: Menyimpan hasil kalkulasi biaya layanan gizi
**Primary Key**: id (UUID)

**Struktur Tabel**:
- id: UUID, NOT NULL, PRIMARY KEY
- user_id: UUID, NOT NULL
- tahun: INTEGER, NOT NULL
- kode_unit_kerja: VARCHAR(10), NOT NULL
- nama_unit_kerja: VARCHAR(255), NOT NULL
- jumlah_pasien: INTEGER, DEFAULT 0
- biaya_bahan_makanan: DECIMAL(15,2), DEFAULT 0
- biaya_tenaga_kerja: DECIMAL(15,2), DEFAULT 0
- biaya_overhead: DECIMAL(15,2), DEFAULT 0
- total_biaya: DECIMAL(15,2), DEFAULT 0
- unit_cost_per_pasien: DECIMAL(15,2), DEFAULT 0
- created_at: TIMESTAMP, DEFAULT NOW()
- updated_at: TIMESTAMP, DEFAULT NOW()

**Indexes**:
- PRIMARY KEY (id)
- INDEX idx_kalkulasi_gizi_user (user_id)
- INDEX idx_kalkulasi_gizi_tahun (tahun)
- INDEX idx_kalkulasi_gizi_unit (kode_unit_kerja)

**Foreign Keys**:
- user_id → auth.users(id) ON DELETE CASCADE
- kode_unit_kerja → unit_kerja(kode) ON DELETE RESTRICT

## 3.3 Tabel Distribusi Biaya

### A. Tabel dasar_alokasi
**Fungsi**: Menyimpan konfigurasi dasar alokasi biaya overhead
**Primary Key**: id (UUID)

**Struktur Tabel**:
- id: UUID, NOT NULL, PRIMARY KEY
- nama_biaya: VARCHAR(255), NOT NULL
- jenis_dasar_alokasi: VARCHAR(50), NOT NULL
- total_biaya: DECIMAL(15,2), DEFAULT 0
- periode: DATE, NOT NULL
- status: BOOLEAN, DEFAULT true
- created_at: TIMESTAMP, DEFAULT NOW()
- updated_at: TIMESTAMP, DEFAULT NOW()

**Indexes**:
- PRIMARY KEY (id)
- INDEX idx_dasar_alokasi_periode (periode)
- INDEX idx_dasar_alokasi_jenis (jenis_dasar_alokasi)
- INDEX idx_dasar_alokasi_status (status)

**Foreign Keys**: None (Master table)

### B. Tabel distribusi_biaya_pertama
**Fungsi**: Menyimpan hasil distribusi biaya overhead ke cost center
**Primary Key**: id (UUID)

**Struktur Tabel**:
- id: UUID, NOT NULL, PRIMARY KEY
- periode: DATE, NOT NULL
- kode_biaya: UUID, NOT NULL
- kode_unit_kerja: VARCHAR(10), NOT NULL
- nilai_dasar_alokasi: DECIMAL(15,2), DEFAULT 0
- persentase_alokasi: DECIMAL(5,2), DEFAULT 0
- nilai_biaya_dialokasi: DECIMAL(15,2), DEFAULT 0
- created_at: TIMESTAMP, DEFAULT NOW()

**Indexes**:
- PRIMARY KEY (id)
- INDEX idx_dist_pertama_periode (periode)
- INDEX idx_dist_pertama_biaya (kode_biaya)
- INDEX idx_dist_pertama_unit (kode_unit_kerja)

**Foreign Keys**:
- kode_biaya → dasar_alokasi(id) ON DELETE CASCADE
- kode_unit_kerja → unit_kerja(kode) ON DELETE RESTRICT

### C. Tabel distribusi_biaya_kedua
**Fungsi**: Menyimpan hasil distribusi biaya dari cost center ke revenue center
**Primary Key**: id (UUID)

**Struktur Tabel**:
- id: UUID, NOT NULL, PRIMARY KEY
- periode: DATE, NOT NULL
- kode_cost_center: VARCHAR(10), NOT NULL
- kode_revenue_center: VARCHAR(10), NOT NULL
- nilai_biaya_dialokasi: DECIMAL(15,2), DEFAULT 0
- volume_layanan: INTEGER, DEFAULT 0
- unit_cost_dialokasi: DECIMAL(15,2), DEFAULT 0
- created_at: TIMESTAMP, DEFAULT NOW()

**Indexes**:
- PRIMARY KEY (id)
- INDEX idx_dist_kedua_periode (periode)
- INDEX idx_dist_kedua_cost_center (kode_cost_center)
- INDEX idx_dist_kedua_revenue_center (kode_revenue_center)

**Foreign Keys**:
- kode_cost_center → unit_kerja(kode) ON DELETE RESTRICT
- kode_revenue_center → unit_kerja(kode) ON DELETE RESTRICT

# 4. RELASI FOREIGN KEY

## 4.1 Referential Integrity Rules

### Cascade Delete Rules:
- **auth.users** → **semua_tabel_transaksi**: CASCADE DELETE
- **dasar_alokasi** → **distribusi_biaya_pertama**: CASCADE DELETE
- **unit_kerja** → **semua_tabel_referensi**: RESTRICT DELETE

### Restrict Delete Rules:
- **unit_kerja** → **jenis_tindakan_***: RESTRICT DELETE
- **daftar_tindakan** → **jenis_tindakan_***: RESTRICT DELETE
- **data_barang** → **penggunaan_barang**: RESTRICT DELETE

### Set Null Rules:
- **auth.users** → **semua_tabel_transaksi**: SET NULL (untuk data historis)

## 4.2 Foreign Key Constraints

### Tabel jenis_tindakan_rawat_jalan:
ALTER TABLE jenis_tindakan_rawat_jalan
ADD CONSTRAINT fk_jenis_tindakan_rj_user
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE jenis_tindakan_rawat_jalan
ADD CONSTRAINT fk_jenis_tindakan_rj_unit
FOREIGN KEY (kode_unit_kerja) REFERENCES unit_kerja(kode) ON DELETE RESTRICT;

ALTER TABLE jenis_tindakan_rawat_jalan
ADD CONSTRAINT fk_jenis_tindakan_rj_tindakan
FOREIGN KEY (kode_jenis_tindakan) REFERENCES daftar_tindakan(kode_tindakan) ON DELETE RESTRICT;

### Tabel distribusi_biaya_pertama:
ALTER TABLE distribusi_biaya_pertama
ADD CONSTRAINT fk_dist_pertama_biaya
FOREIGN KEY (kode_biaya) REFERENCES dasar_alokasi(id) ON DELETE CASCADE;

ALTER TABLE distribusi_biaya_pertama
ADD CONSTRAINT fk_dist_pertama_unit
FOREIGN KEY (kode_unit_kerja) REFERENCES unit_kerja(kode) ON DELETE RESTRICT;

## 4.3 Check Constraints

### Tabel unit_kerja:
ALTER TABLE unit_kerja
ADD CONSTRAINT chk_unit_kerja_jenis
CHECK (jenis IN (1, 2, 3));

### Tabel daftar_tindakan:
ALTER TABLE daftar_tindakan
ADD CONSTRAINT chk_daftar_tindakan_profesionalisme
CHECK (tingkat_profesionalisme BETWEEN 1 AND 5);

ALTER TABLE daftar_tindakan
ADD CONSTRAINT chk_daftar_tindakan_kesulitan
CHECK (tingkat_kesulitan BETWEEN 1 AND 5);

### Tabel jenis_tindakan_rawat_jalan:
ALTER TABLE jenis_tindakan_rawat_jalan
ADD CONSTRAINT chk_jenis_tindakan_rj_jumlah
CHECK (jumlah >= 0);

ALTER TABLE jenis_tindakan_rawat_jalan
ADD CONSTRAINT chk_jenis_tindakan_rj_waktu
CHECK (waktu >= 0);

# 5. INDEX DAN CONSTRAINT

## 5.1 Primary Keys
Semua tabel menggunakan UUID sebagai primary key untuk memastikan unikness dan performa yang optimal.

### UUID Implementation:
- **Format**: UUID v4 (random)
- **Storage**: 16 bytes
- **Performance**: Optimal untuk distributed systems
- **Uniqueness**: Guaranteed across all tables

## 5.2 Unique Constraints

### Business Unique Keys:
- **unit_kerja.kode**: Kode unit kerja harus unik
- **daftar_tindakan.kode_tindakan**: Kode tindakan harus unik
- **data_barang.kode_barang**: Kode barang harus unik
- **dasar_alokasi**: Kombinasi nama_biaya + periode harus unik

### Composite Unique Keys:
-- Unique constraint untuk dasar_alokasi
ALTER TABLE dasar_alokasi
ADD CONSTRAINT uk_dasar_alokasi_nama_periode
UNIQUE (nama_biaya, periode);

-- Unique constraint untuk distribusi_biaya_pertama
ALTER TABLE distribusi_biaya_pertama
ADD CONSTRAINT uk_dist_pertama_biaya_unit_periode
UNIQUE (kode_biaya, kode_unit_kerja, periode);

## 5.3 Indexes Strategy

### Performance Indexes:
- **Single Column Indexes**: Untuk frequently queried columns
- **Composite Indexes**: Untuk complex queries
- **Partial Indexes**: Untuk filtered queries
- **Expression Indexes**: Untuk computed columns

### Index Examples:

#### Single Column Indexes:
-- Index untuk kode unit kerja
CREATE INDEX idx_unit_kerja_kode ON unit_kerja(kode);

-- Index untuk periode
CREATE INDEX idx_kalkulasi_gizi_tahun ON kalkulasi_biaya_gizi(tahun);

-- Index untuk user_id
CREATE INDEX idx_jenis_tindakan_rj_user ON jenis_tindakan_rawat_jalan(user_id);

#### Composite Indexes:
-- Index untuk query berdasarkan user dan periode
CREATE INDEX idx_jenis_tindakan_rj_user_periode 
ON jenis_tindakan_rawat_jalan(user_id, created_at);

-- Index untuk query berdasarkan unit dan tindakan
CREATE INDEX idx_jenis_tindakan_rj_unit_tindakan 
ON jenis_tindakan_rawat_jalan(kode_unit_kerja, kode_jenis_tindakan);

#### Partial Indexes:
-- Index hanya untuk data aktif
CREATE INDEX idx_unit_kerja_aktif 
ON unit_kerja(kode) WHERE status = true;

-- Index hanya untuk data dengan jumlah > 0
CREATE INDEX idx_jenis_tindakan_rj_jumlah_positive 
ON jenis_tindakan_rawat_jalan(jumlah) WHERE jumlah > 0;

## 5.4 Constraint Examples

### Not Null Constraints:
ALTER TABLE unit_kerja ALTER COLUMN kode SET NOT NULL;
ALTER TABLE unit_kerja ALTER COLUMN nama SET NOT NULL;
ALTER TABLE daftar_tindakan ALTER COLUMN kode_tindakan SET NOT NULL;
ALTER TABLE daftar_tindakan ALTER COLUMN nama_tindakan SET NOT NULL;

### Default Values:
ALTER TABLE unit_kerja ALTER COLUMN status SET DEFAULT true;
ALTER TABLE daftar_tindakan ALTER COLUMN waktu_standar SET DEFAULT 0;
ALTER TABLE jenis_tindakan_rawat_jalan ALTER COLUMN jumlah SET DEFAULT 0;
ALTER TABLE jenis_tindakan_rawat_jalan ALTER COLUMN kode_jenis SET DEFAULT 1;

# 6. STORED PROCEDURES & TRIGGERS

## 6.1 Triggers

### A. Update Timestamp Trigger:
-- Function untuk update timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger untuk semua tabel
CREATE TRIGGER update_unit_kerja_updated_at 
    BEFORE UPDATE ON unit_kerja 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_daftar_tindakan_updated_at 
    BEFORE UPDATE ON daftar_tindakan 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

### B. Calculate Unit Cost Trigger:
-- Function untuk kalkulasi unit cost
CREATE OR REPLACE FUNCTION calculate_unit_cost()
RETURNS TRIGGER AS $$
BEGIN
    -- Kalkulasi hasil_kali_waktu
    NEW.hasil_kali_waktu = NEW.jumlah * NEW.waktu;
    
    -- Kalkulasi hasil_kali
    NEW.hasil_kali = NEW.hasil_kali_waktu * NEW.profesionalisme * NEW.tingkat_kesulitan;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger untuk jenis_tindakan_rawat_jalan
CREATE TRIGGER calculate_unit_cost_trigger
    BEFORE INSERT OR UPDATE ON jenis_tindakan_rawat_jalan
    FOR EACH ROW EXECUTE FUNCTION calculate_unit_cost();

### C. Validate Data Trigger:
-- Function untuk validasi data
CREATE OR REPLACE FUNCTION validate_tindakan_data()
RETURNS TRIGGER AS $$
BEGIN
    -- Validasi jumlah tidak boleh negatif
    IF NEW.jumlah < 0 THEN
        RAISE EXCEPTION 'Jumlah tidak boleh negatif';
    END IF;
    
    -- Validasi waktu tidak boleh negatif
    IF NEW.waktu < 0 THEN
        RAISE EXCEPTION 'Waktu tidak boleh negatif';
    END IF;
    
    -- Validasi tingkat profesionalisme
    IF NEW.profesionalisme < 1 OR NEW.profesionalisme > 5 THEN
        RAISE EXCEPTION 'Tingkat profesionalisme harus antara 1-5';
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger untuk validasi
CREATE TRIGGER validate_tindakan_trigger
    BEFORE INSERT OR UPDATE ON jenis_tindakan_rawat_jalan
    FOR EACH ROW EXECUTE FUNCTION validate_tindakan_data();

## 6.2 Stored Procedures

### A. Calculate Unit Cost Procedure:
CREATE OR REPLACE FUNCTION calculate_unit_cost_procedure(
    p_user_id UUID,
    p_periode DATE
)
RETURNS TABLE (
    kode_unit_kerja VARCHAR,
    nama_unit_kerja VARCHAR,
    total_biaya DECIMAL,
    total_volume INTEGER,
    unit_cost DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        jt.kode_unit_kerja,
        jt.nama_unit_kerja,
        SUM(jt.hasil_kali + jt.biaya_bahan_tindakan) as total_biaya,
        SUM(jt.jumlah) as total_volume,
        CASE 
            WHEN SUM(jt.jumlah) > 0 THEN 
                SUM(jt.hasil_kali + jt.biaya_bahan_tindakan) / SUM(jt.jumlah)
            ELSE 0
        END as unit_cost
    FROM jenis_tindakan_rawat_jalan jt
    WHERE jt.user_id = p_user_id
        AND DATE_TRUNC('month', jt.created_at) = DATE_TRUNC('month', p_periode)
    GROUP BY jt.kode_unit_kerja, jt.nama_unit_kerja;
END;
$$ LANGUAGE plpgsql;

### B. Distribute Overhead Cost Procedure:
CREATE OR REPLACE FUNCTION distribute_overhead_cost(
    p_periode DATE,
    p_biaya_id UUID
)
RETURNS VOID AS $$
DECLARE
    total_dasar_alokasi DECIMAL;
    biaya_total DECIMAL;
    rec RECORD;
BEGIN
    -- Ambil total biaya
    SELECT total_biaya INTO biaya_total
    FROM dasar_alokasi
    WHERE id = p_biaya_id;
    
    -- Hitung total dasar alokasi
    SELECT SUM(nilai_dasar_alokasi) INTO total_dasar_alokasi
    FROM distribusi_biaya_pertama
    WHERE periode = p_periode AND kode_biaya = p_biaya_id;
    
    -- Update distribusi biaya
    FOR rec IN 
        SELECT id, nilai_dasar_alokasi
        FROM distribusi_biaya_pertama
        WHERE periode = p_periode AND kode_biaya = p_biaya_id
    LOOP
        UPDATE distribusi_biaya_pertama
        SET 
            persentase_alokasi = (rec.nilai_dasar_alokasi / total_dasar_alokasi) * 100,
            nilai_biaya_dialokasi = (rec.nilai_dasar_alokasi / total_dasar_alokasi) * biaya_total
        WHERE id = rec.id;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

### C. Generate Report Procedure:
CREATE OR REPLACE FUNCTION generate_unit_cost_report(
    p_user_id UUID,
    p_start_date DATE,
    p_end_date DATE
)
RETURNS TABLE (
    periode DATE,
    kode_unit_kerja VARCHAR,
    nama_unit_kerja VARCHAR,
    total_biaya DECIMAL,
    total_volume INTEGER,
    unit_cost DECIMAL,
    variance_budget DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        DATE_TRUNC('month', jt.created_at)::DATE as periode,
        jt.kode_unit_kerja,
        jt.nama_unit_kerja,
        SUM(jt.hasil_kali + jt.biaya_bahan_tindakan) as total_biaya,
        SUM(jt.jumlah) as total_volume,
        CASE 
            WHEN SUM(jt.jumlah) > 0 THEN 
                SUM(jt.hasil_kali + jt.biaya_bahan_tindakan) / SUM(jt.jumlah)
            ELSE 0
        END as unit_cost,
        0 as variance_budget -- TODO: implement budget comparison
    FROM jenis_tindakan_rawat_jalan jt
    WHERE jt.user_id = p_user_id
        AND jt.created_at >= p_start_date
        AND jt.created_at <= p_end_date
    GROUP BY 
        DATE_TRUNC('month', jt.created_at),
        jt.kode_unit_kerja, 
        jt.nama_unit_kerja
    ORDER BY periode DESC, jt.nama_unit_kerja;
END;
$$ LANGUAGE plpgsql;

# 7. VIEWS DAN MATERIALIZED VIEWS

## 7.1 Regular Views

### A. View v_unit_cost_summary:
CREATE VIEW v_unit_cost_summary AS
SELECT 
    uk.nama_unit_kerja,
    rc.jenis_layanan,
    rc.unit_cost,
    rc.margin_profit,
    rc.periode
FROM unit_kerja uk
JOIN rekapitulasi_unit_cost rc ON uk.kode = rc.kode_unit_kerja
WHERE rc.periode >= CURRENT_DATE - INTERVAL '1 month';

### B. View v_distribusi_biaya_detail:
CREATE VIEW v_distribusi_biaya_detail AS
SELECT 
    dbp.periode,
    da.nama_biaya,
    uk.nama_unit_kerja,
    dbp.nilai_biaya_dialokasi,
    dbp.persentase_alokasi
FROM distribusi_biaya_pertama dbp
JOIN dasar_alokasi da ON dbp.kode_biaya = da.id
JOIN unit_kerja uk ON dbp.kode_unit_kerja = uk.kode;

### C. View v_tindakan_performance:
CREATE VIEW v_tindakan_performance AS
SELECT 
    jt.kode_unit_kerja,
    uk.nama_unit_kerja,
    jt.kode_jenis_tindakan,
    dt.nama_tindakan,
    SUM(jt.jumlah) as total_jumlah,
    AVG(jt.waktu) as rata_waktu,
    SUM(jt.hasil_kali) as total_hasil_kali,
    CASE 
        WHEN SUM(jt.jumlah) > 0 THEN 
            SUM(jt.hasil_kali) / SUM(jt.jumlah)
        ELSE 0
    END as unit_cost_rata
FROM jenis_tindakan_rawat_jalan jt
JOIN unit_kerja uk ON jt.kode_unit_kerja = uk.kode
JOIN daftar_tindakan dt ON jt.kode_jenis_tindakan = dt.kode_tindakan
GROUP BY 
    jt.kode_unit_kerja, uk.nama_unit_kerja,
    jt.kode_jenis_tindakan, dt.nama_tindakan;

## 7.2 Materialized Views

### A. Materialized View mv_monthly_unit_cost:
CREATE MATERIALIZED VIEW mv_monthly_unit_cost AS
SELECT 
    DATE_TRUNC('month', jt.created_at)::DATE as bulan,
    jt.kode_unit_kerja,
    uk.nama_unit_kerja,
    uk.jenis as jenis_unit,
    COUNT(*) as jumlah_tindakan,
    SUM(jt.jumlah) as total_volume,
    SUM(jt.hasil_kali + jt.biaya_bahan_tindakan) as total_biaya,
    CASE 
        WHEN SUM(jt.jumlah) > 0 THEN 
            SUM(jt.hasil_kali + jt.biaya_bahan_tindakan) / SUM(jt.jumlah)
        ELSE 0
    END as unit_cost_rata,
    AVG(jt.waktu) as rata_waktu_tindakan
FROM jenis_tindakan_rawat_jalan jt
JOIN unit_kerja uk ON jt.kode_unit_kerja = uk.kode
GROUP BY 
    DATE_TRUNC('month', jt.created_at),
    jt.kode_unit_kerja, uk.nama_unit_kerja, uk.jenis;

-- Index untuk materialized view
CREATE INDEX idx_mv_monthly_unit_cost_bulan ON mv_monthly_unit_cost(bulan);
CREATE INDEX idx_mv_monthly_unit_cost_unit ON mv_monthly_unit_cost(kode_unit_kerja);

### B. Refresh Strategy:
-- Refresh materialized view setiap hari
CREATE OR REPLACE FUNCTION refresh_materialized_views()
RETURNS VOID AS $$
BEGIN
    REFRESH MATERIALIZED VIEW mv_monthly_unit_cost;
    -- Tambahkan materialized view lain jika ada
END;
$$ LANGUAGE plpgsql;

-- Schedule refresh dengan pg_cron (jika tersedia)
-- SELECT cron.schedule('refresh-mv-daily', '0 2 * * *', 'SELECT refresh_materialized_views();');

# 8. BACKUP DAN MAINTENANCE

## 8.1 Backup Strategy

### A. Full Backup:
-- Full backup harian
pg_dump -h hostname -U username -d database_name \
    --format=custom \
    --compress=9 \
    --file=backup_$(date +%Y%m%d).dump

### B. Incremental Backup:
-- WAL archiving untuk point-in-time recovery
-- Konfigurasi di postgresql.conf:
-- archive_mode = on
-- archive_command = 'cp %p /backup/wal/%f'

### C. Backup Script:
bash
#!/bin/bash
# backup_database.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backup/postgresql"
DB_NAME="unit_cost_rs"

# Full backup
pg_dump -h localhost -U postgres -d $DB_NAME \
    --format=custom \
    --compress=9 \
    --file="$BACKUP_DIR/full_backup_$DATE.dump"

# Cleanup old backups (keep 7 days)
find $BACKUP_DIR -name "full_backup_*.dump" -mtime +7 -delete

echo "Backup completed: full_backup_$DATE.dump"

## 8.2 Maintenance Tasks

### A. VACUUM dan ANALYZE:
-- VACUUM ANALYZE untuk semua tabel
VACUUM ANALYZE;

-- VACUUM FULL untuk tabel yang sangat fragmented
VACUUM FULL unit_kerja;
VACUUM FULL daftar_tindakan;

### B. Update Statistics:
-- Update statistics untuk query planner
ANALYZE unit_kerja;
ANALYZE daftar_tindakan;
ANALYZE jenis_tindakan_rawat_jalan;
ANALYZE jenis_tindakan_rawat_inap;
ANALYZE kalkulasi_biaya_gizi;

### C. Reindex:
-- Reindex untuk tabel yang sering diupdate
REINDEX TABLE jenis_tindakan_rawat_jalan;
REINDEX TABLE jenis_tindakan_rawat_inap;
REINDEX TABLE kalkulasi_biaya_gizi;

### D. Maintenance Script:
-- Script maintenance harian
DO $$
BEGIN
    -- VACUUM ANALYZE
    PERFORM pg_stat_statements_reset();
    
    -- Update statistics
    ANALYZE;
    
    -- Refresh materialized views
    PERFORM refresh_materialized_views();
    
    -- Log maintenance
    INSERT INTO system_log (log_type, log_message, created_at)
    VALUES ('maintenance', 'Daily maintenance completed', NOW());
END $$;

# 9. MONITORING DAN PERFORMANCE

## 9.1 Performance Monitoring

### A. Query Performance:
-- Enable pg_stat_statements
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- Monitor slow queries
SELECT 
    query,
    calls,
    total_time,
    mean_time,
    rows
FROM pg_stat_statements 
WHERE mean_time > 1000 -- queries > 1 second
ORDER BY mean_time DESC
LIMIT 10;

### B. Table Statistics:
-- Table size monitoring
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

### C. Index Usage:
-- Monitor index usage
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan,
    idx_tup_read,
    idx_tup_fetch
FROM pg_stat_user_indexes 
ORDER BY idx_scan DESC;

## 9.2 Performance Optimization

### A. Query Optimization:
- Gunakan EXPLAIN ANALYZE untuk analisis query
- Optimasi JOIN dan WHERE clauses
- Gunakan appropriate indexes
- Avoid N+1 queries dengan proper JOINs

### B. Index Optimization:
- Monitor index usage dan drop unused indexes
- Create composite indexes untuk complex queries
- Use partial indexes untuk filtered queries
- Regular REINDEX untuk fragmented indexes

### C. Connection Pooling:
- Use Supabase connection pooler
- Configure appropriate pool size
- Monitor connection usage
- Implement connection timeout

# 10. SECURITY DAN COMPLIANCE

## 10.1 Row Level Security (RLS)

### A. Enable RLS:
-- Enable RLS untuk semua tabel
ALTER TABLE unit_kerja ENABLE ROW LEVEL SECURITY;
ALTER TABLE daftar_tindakan ENABLE ROW LEVEL SECURITY;
ALTER TABLE jenis_tindakan_rawat_jalan ENABLE ROW LEVEL SECURITY;

### B. RLS Policies:
-- Policy untuk user hanya bisa akses data mereka sendiri
CREATE POLICY user_data_policy ON jenis_tindakan_rawat_jalan
    FOR ALL TO authenticated
    USING (auth.uid() = user_id);

-- Policy untuk admin bisa akses semua data
CREATE POLICY admin_access_policy ON unit_kerja
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE id = auth.uid() 
            AND raw_user_meta_data->>'role' = 'admin'
        )
    );

## 10.2 Data Encryption

### A. Encryption at Rest:
- PostgreSQL menggunakan Transparent Data Encryption (TDE)
- Supabase menyediakan encryption at rest secara default
- Backup files di-encrypt dengan AES-256

### B. Encryption in Transit:
- SSL/TLS untuk semua koneksi database
- HTTPS untuk semua API calls
- Certificate validation

## 10.3 Audit Trail

### A. Audit Table:
CREATE TABLE audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    table_name VARCHAR(100) NOT NULL,
    operation VARCHAR(10) NOT NULL, -- INSERT, UPDATE, DELETE
    old_data JSONB,
    new_data JSONB,
    user_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMP DEFAULT NOW()
);

### B. Audit Trigger:
CREATE OR REPLACE FUNCTION audit_trigger_function()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        INSERT INTO audit_log (table_name, operation, old_data, user_id)
        VALUES (TG_TABLE_NAME, TG_OP, row_to_json(OLD), auth.uid());
        RETURN OLD;
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO audit_log (table_name, operation, old_data, new_data, user_id)
        VALUES (TG_TABLE_NAME, TG_OP, row_to_json(OLD), row_to_json(NEW), auth.uid());
        RETURN NEW;
    ELSIF TG_OP = 'INSERT' THEN
        INSERT INTO audit_log (table_name, operation, new_data, user_id)
        VALUES (TG_TABLE_NAME, TG_OP, row_to_json(NEW), auth.uid());
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

# 11. KESIMPULAN

Database Unit Cost RS dirancang dengan arsitektur yang robust, scalable, dan maintainable. Dengan menggunakan PostgreSQL sebagai database engine dan mengimplementasikan best practices dalam database design, sistem ini mampu menangani kebutuhan perhitungan unit cost yang kompleks dengan performa yang optimal.

## 11.1 Key Features:
- **Normalized Design**: Struktur database yang ter-normalisasi dengan relasi yang efisien
- **Performance Optimized**: Indexes dan constraints yang optimal untuk performa
- **Data Integrity**: Foreign key constraints dan check constraints untuk menjaga integritas data
- **Security**: Row Level Security dan audit trail untuk keamanan data
- **Scalability**: Arsitektur yang dapat berkembang sesuai kebutuhan

## 11.2 Maintenance Best Practices:
- Regular backup dan testing restore
- Performance monitoring dan optimization
- Security updates dan patches
- Documentation updates

## 11.3 Future Enhancements:
- Partitioning untuk tabel besar
- Read replicas untuk performance
- Advanced analytics dengan extensions
- Integration dengan data warehouse

Database ini merupakan fondasi yang solid untuk aplikasi Unit Cost RS dan siap untuk berkembang seiring dengan kebutuhan bisnis yang terus berubah.
`, 60);

      // Add copyright footer to all pages
      for (let i = 1; i <= currentPage; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(100, 100, 100);
        doc.text('Copyright © 2024 Mukhsin Hadi. Hak Cipta Dilindungi Undang-Undang', 20, doc.internal.pageSize.height - 15);
        addPageNumber(i, currentPage);
      }

      // Save the PDF
      const fileName = `Modul_Relasi_Database_Unit_Cost_RS_${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(fileName);
      
      onDownloadComplete?.();
      
    } catch (error) {
      console.error('Error generating PDF:', error);
      onDownloadError?.(error instanceof Error ? error.message : 'Unknown error occurred');
    }
  };

  return (
    <button
      onClick={generatePDF}
      className="inline-flex items-center gap-1 px-3 py-1.5 bg-purple-600 text-white text-sm rounded-md hover:bg-purple-700 transition-colors"
      title="Unduh Modul Relasi Database (25 halaman)"
    >
      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
      Unduh (25 halaman)
    </button>
  );
};

export default ModulRelasiDatabase;
