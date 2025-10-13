import React from 'react';
import jsPDF from 'jspdf';

interface ModulGambaranUmumProps {
  onDownloadStart?: () => void;
  onDownloadComplete?: () => void;
  onDownloadError?: (error: string) => void;
}

const ModulGambaranUmum: React.FC<ModulGambaranUmumProps> = ({
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
        title: 'Modul Gambaran Umum Aplikasi Unit Cost RS',
        subject: 'Dokumentasi Gambaran Umum Sistem',
        author: 'Mukhsin Hadi',
        creator: 'Aplikasi Unit Cost RS'
      });

      let currentPage = 1;
      const totalPages = 15;

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
        doc.setTextColor(41, 128, 185); // Blue color
        doc.setFont('arial', 'bold');
        doc.text(title, margin, 30);
        
        if (subtitle) {
          doc.setFontSize(11);
          doc.setFont('arial', 'normal');
          doc.setTextColor(100, 100, 100);
          doc.text(subtitle, margin, 40);
        }
        
        // Add colored separator line
        doc.setDrawColor(41, 128, 185);
        doc.line(margin, 45, doc.internal.pageSize.width - margin, 45);
      };

      // Helper function to draw flowchart box
      const drawFlowchartBox = (text: string, x: number, y: number, width: number, height: number, color: number[]) => {
        // Draw box with color
        doc.setFillColor(color[0], color[1], color[2]);
        doc.roundedRect(x, y, width, height, 3, 3, 'F');
        
        // Draw border
        doc.setDrawColor(0, 0, 0);
        doc.roundedRect(x, y, width, height, 3, 3, 'S');
        
        // Add text
        doc.setFontSize(10);
        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        const textLines = doc.splitTextToSize(text, width - 10);
        const textY = y + height/2 - (textLines.length * 3);
        doc.text(textLines, x + 5, textY);
        
        return { x, y, width, height };
      };

      // Helper function to draw arrow
      const drawArrow = (fromX: number, fromY: number, toX: number, toY: number) => {
        doc.setDrawColor(0, 0, 0);
        doc.setLineWidth(1);
        
        // Draw line
        doc.line(fromX, fromY, toX, toY);
        
        // Draw arrowhead
        const angle = Math.atan2(toY - fromY, toX - fromX);
        const arrowLength = 8;
        const arrowAngle = Math.PI / 6;
        
        const arrowX1 = toX - arrowLength * Math.cos(angle - arrowAngle);
        const arrowY1 = toY - arrowLength * Math.sin(angle - arrowAngle);
        const arrowX2 = toX - arrowLength * Math.cos(angle + arrowAngle);
        const arrowY2 = toY - arrowLength * Math.sin(angle + arrowAngle);
        
        doc.line(toX, toY, arrowX1, arrowY1);
        doc.line(toX, toY, arrowX2, arrowY2);
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
            // Headers with colors
            const headerText = line.replace(/^#+\s*/, '');
            const headerLevel = line.match(/^#+/)?.[0].length || 1;
            
            // Different colors for different header levels
            let headerColor = [41, 128, 185]; // Default blue
            if (headerLevel === 2) headerColor = [34, 139, 34]; // Green
            if (headerLevel === 3) headerColor = [128, 0, 128]; // Purple
            if (headerLevel === 4) headerColor = [255, 140, 0]; // Orange
            
            doc.setFontSize(Math.max(14 - headerLevel, 11)); // Min 11pt
            doc.setFont('arial', 'bold');
            doc.setTextColor(headerColor[0], headerColor[1], headerColor[2]);
            doc.text(headerText, margin, y);
            y += 7;
          } else if (line.startsWith('- ') || line.startsWith('* ')) {
            // Bullet points with color
            const bulletText = line.replace(/^[-*]\s*/, '');
            doc.setFont('arial', 'normal');
            doc.setTextColor(0, 0, 0);
            
            // Color bullet point
            doc.setTextColor(41, 128, 185);
            doc.text('•', margin + 5, y);
            doc.setTextColor(0, 0, 0);
            doc.text(bulletText, margin + 15, y);
            y += 6; // Spasi yang lebih rapat
          } else if (line.trim() === '') {
            // Empty lines
            y += 4;
          } else {
            // Regular text
            doc.setFont('arial', 'normal');
            doc.setTextColor(0, 0, 0);
            doc.text(line, margin, y);
            y += 6; // Spasi yang lebih rapat
          }
        }
        
        return y;
      };

      // ===== COVER PAGE =====
      const pageWidth = doc.internal.pageSize.width;
      const pageHeight = doc.internal.pageSize.height;
      
      // Background gradient (Blue)
      doc.setFillColor(59, 130, 246); // Blue-500
      doc.rect(0, 0, pageWidth, pageHeight, "F");
      
      // Decorative circle
      doc.setFillColor(37, 99, 235); // Blue-600
      doc.circle(pageWidth / 2, -50, 120, "F");
      
      // Title
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(36);
      doc.setFont("times", "bold");
      doc.text("MODUL", pageWidth / 2, 65, { align: "center" });
      doc.setFontSize(32);
      doc.text("GAMBARAN UMUM", pageWidth / 2, 85, { align: "center" });
      doc.text("APLIKASI", pageWidth / 2, 103, { align: "center" });
      
      // Subtitle
      doc.setFontSize(16);
      doc.setFont("times", "bolditalic");
      doc.text("Aplikasi Unit Cost RS", pageWidth / 2, 125, { align: "center" });
      
      // Description
      doc.setFontSize(11);
      doc.setFont("helvetica", "normal");
      doc.text("Sistem Informasi Manajemen Biaya Rumah Sakit", pageWidth / 2, 140, { align: "center" });
      
      // Author section - white box
      doc.setFillColor(255, 255, 255);
      doc.roundedRect(20, 160, pageWidth - 40, 55, 3, 3, "F");
      
      doc.setTextColor(0, 51, 102);
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
      
      // ===== MODUL GAMBARAN UMUM APLIKASI =====
      addHeader(
        'MODUL GAMBARAN UMUM APLIKASI',
        'Unit Cost RS - Sistem Informasi Manajemen Biaya Rumah Sakit'
      );
      
      let y = addContent(`
# 1. PENDAHULUAN

Aplikasi Unit Cost RS adalah sistem informasi manajemen yang dirancang khusus untuk membantu rumah sakit dalam menghitung dan menganalisis biaya operasional secara detail. Sistem ini mengintegrasikan berbagai aspek keuangan rumah sakit mulai dari biaya tenaga kerja, bahan habis pakai, hingga biaya overhead.

Sistem ini dikembangkan dengan teknologi modern dan mengikuti standar akuntansi manajemen yang berlaku di industri kesehatan Indonesia. Dengan pendekatan yang sistematis dan terstruktur, aplikasi ini memberikan solusi komprehensif untuk kebutuhan perhitungan unit cost di lingkungan rumah sakit.

## Diagram Arsitektur Sistem

Sistem Unit Cost RS dibangun dengan arsitektur modern yang scalable dan maintainable.

# 2. TUJUAN APLIKASI

## 2.1 Tujuan Utama
- Menyediakan perhitungan unit cost yang akurat untuk setiap layanan rumah sakit
- Meningkatkan transparansi dalam pengelolaan biaya operasional
- Mendukung pengambilan keputusan strategis berdasarkan data biaya yang real-time
- Memfasilitasi perencanaan anggaran yang lebih tepat sasaran
- Memberikan dasar perhitungan tarif layanan yang kompetitif

## 2.2 Manfaat Strategis
- Optimasi penggunaan sumber daya rumah sakit
- Peningkatan efisiensi operasional
- Dasar penetapan tarif yang akurat dan kompetitif
- Analisis profitabilitas layanan yang detail
- Compliance dengan regulasi kesehatan

# 3. ARSITEKTUR SISTEM

## 3.1 Teknologi yang Digunakan

### Frontend Technology Stack:
- **React.js 18**: Framework JavaScript modern untuk user interface
- **TypeScript**: Superset JavaScript dengan type safety
- **Vite**: Build tool yang cepat dan efisien
- **Tailwind CSS**: Utility-first CSS framework
- **shadcn/ui**: Komponen UI yang reusable dan accessible
- **React Query**: State management dan data fetching
- **React Router**: Client-side routing

### Backend Technology Stack:
- **Supabase**: Backend-as-a-Service dengan PostgreSQL
- **PostgreSQL**: Database relasional yang robust
- **Supabase Auth**: Sistem autentikasi dan otorisasi
- **Row Level Security (RLS)**: Keamanan data tingkat baris
- **Real-time subscriptions**: Update data secara real-time

## 3.2 Arsitektur Aplikasi

### Client-Server Architecture:
- **Presentation Layer**: React components dan UI/UX
- **Business Logic Layer**: Custom hooks dan utilities
- **Data Access Layer**: Supabase client dan queries
- **Database Layer**: PostgreSQL dengan RLS

### Security Architecture:
- **Authentication**: Email/password dengan Supabase Auth
- **Authorization**: Role-based access control
- **Data Encryption**: Encryption in transit dan at rest
- **Audit Trail**: Log semua perubahan data

# 4. FITUR-FITUR UTAMA APLIKASI

## 4.1 Data Master Management

### Unit Kerja Management:
- Katalog lengkap unit kerja rumah sakit
- Klasifikasi unit berdasarkan jenis layanan
- Hierarki organisasi yang terstruktur
- Manajemen kode dan identifikasi unik

### Barang dan Bahan Habis Pakai:
- Database lengkap barang medis dan non-medis
- Klasifikasi berdasarkan kategori dan jenis
- Tracking harga dan supplier
- Manajemen stok dan expiry date

### Master Tindakan Medis:
- Katalog tindakan medis dan non-medis
- Standarisasi waktu dan tingkat kesulitan
- Klasifikasi berdasarkan spesialisasi
- Integration dengan ICD-10 dan tarif BPJS

## 4.2 Kalkulasi Biaya Terintegrasi

### Kalkulasi Biaya Gizi:
- Perhitungan biaya per porsi makanan
- Analisis kebutuhan nutrisi pasien
- Tracking biaya bahan dan tenaga kerja
- Report nutrisi dan diet therapy

### Kalkulasi Tindakan Rawat Jalan:
- Perhitungan unit cost per tindakan
- Analisis efisiensi waktu dan sumber daya
- Tracking volume dan revenue per tindakan
- Benchmarking dengan standar industri

### Kalkulasi Tindakan Rawat Inap:
- Perhitungan biaya per hari rawat inap
- Analisis biaya per kelas kamar
- Tracking LOS (Length of Stay) dan cost per episode
- Analisis profitabilitas per unit rawat inap

## 4.3 Sistem Distribusi Biaya

### Dasar Alokasi Biaya:
- Multiple allocation bases (direct labor, square footage, volume)
- Flexible allocation methods
- Cost center dan revenue center mapping
- Activity-based costing principles

### Distribusi Multi-Tahap:
- Two-stage allocation process
- Cost center to cost center allocation
- Revenue center allocation
- Overhead cost distribution

## 4.4 Reporting dan Analisis

### Rekapitulasi Unit Cost:
- Comprehensive cost summary reports
- Variance analysis dan trend analysis
- Comparative analysis antar periode
- Export capabilities (Excel, PDF)

### Skenario dan Simulasi:
- What-if analysis untuk perubahan tarif
- Sensitivity analysis untuk cost drivers
- Budget planning dan forecasting
- Scenario comparison tools

# 5. STRUKTUR MENU DAN NAVIGASI

## 5.1 Hierarki Menu Utama

### Dashboard:
- Executive summary dan KPI
- Real-time monitoring dashboard
- Quick access to critical reports
- System health dan performance metrics

### Data Master:
- Unit Kerja management
- Barang dan inventory management
- Master tindakan dan prosedur
- Reference data management

### Unit Penunjang:
- Gizi dan food service
- Laundry dan housekeeping
- Maintenance dan utilities
- Support services costing

### Unit Keperawatan:
- Rawat inap costing
- Nursing care analysis
- Patient care pathways
- Resource utilization

### Unit Pelayanan:
- Rawat jalan services
- Emergency services
- Outpatient procedures
- Diagnostic services

### Analisis dan Reporting:
- Unit cost reports
- Profitability analysis
- Trend analysis
- Comparative studies

## 5.2 Navigasi dan User Experience

### Responsive Design:
- Mobile-first approach
- Tablet dan desktop optimization
- Touch-friendly interface
- Cross-browser compatibility

### User Interface Principles:
- Clean dan intuitive design
- Consistent color scheme dan typography
- Accessible design (WCAG compliance)
- Fast loading dan smooth interactions

# 6. PRINSIP-PRINSIP UNIT COSTING

## 6.1 Konsep Dasar Unit Costing

### Definisi Unit Cost:
Unit cost adalah total biaya yang dikeluarkan untuk menghasilkan satu unit output atau layanan. Dalam konteks rumah sakit, unit output dapat berupa:
- Jumlah pasien yang dilayani
- Jumlah tindakan yang dilakukan
- Jumlah kamar yang digunakan
- Jumlah jam kerja tenaga medis

### Komponen Biaya:
- **Biaya Langsung**: Biaya yang dapat ditelusuri langsung ke unit output
- **Biaya Tidak Langsung**: Biaya overhead yang dialokasikan berdasarkan dasar alokasi tertentu

## 6.2 Metodologi Perhitungan

### Activity-Based Costing (ABC):
- Identifikasi activities dan cost drivers
- Assignment of costs to activities
- Allocation of activity costs to cost objects
- Continuous improvement process

### Traditional Costing:
- Direct cost allocation
- Overhead allocation based on volume
- Department-based costing
- Service line profitability

## 6.3 Best Practices

### Data Accuracy:
- Regular data validation
- Source data verification
- Exception reporting
- Data quality metrics

### Cost Control:
- Budget vs actual analysis
- Variance investigation
- Cost reduction initiatives
- Performance benchmarking

# 7. WORKFLOW UMUM APLIKASI

## 7.1 Proses Input Data

### Data Collection:
1. Input data master (unit kerja, barang, tindakan)
2. Input data transaksi (jumlah, volume, waktu)
3. Input data biaya (gaji, bahan, overhead)
4. Validasi dan konfirmasi data

### Data Validation:
- Automated validation rules
- Manual review process
- Exception handling
- Data correction workflow

## 7.2 Proses Kalkulasi

### Calculation Engine:
1. Kalkulasi biaya langsung per unit
2. Distribusi biaya tidak langsung
3. Perhitungan unit cost final
4. Validasi hasil perhitungan

### Quality Assurance:
- Cross-validation checks
- Reasonableness tests
- Variance analysis
- Audit trail maintenance

## 7.3 Proses Pelaporan

### Report Generation:
1. Generate laporan rekapitulasi
2. Analisis variance dan trend
3. Export data untuk analisis lanjutan
4. Skenario perencanaan tarif

### Distribution:
- Scheduled reports
- Ad-hoc reporting
- Dashboard updates
- Alert notifications

# 8. DIAGRAM WORKFLOW SISTEM

Berikut adalah flowchart yang menggambarkan proses workflow dalam sistem Unit Cost RS:

## Diagram Proses Unit Cost

Flowchart berikut menunjukkan alur proses perhitungan unit cost dari input data hingga menghasilkan laporan:

## Alur Proses:
1. Input Data Master → Validasi → Kalkulasi → Laporan
2. Input Data Transaksi → Validasi → Kalkulasi → Laporan  
3. Input Data Biaya → Validasi → Kalkulasi → Laporan

## Diagram Arsitektur Sistem

Sistem Unit Cost RS menggunakan arsitektur modern dengan komponen-komponen berikut:

### Frontend Layer:
- React.js dengan TypeScript
- Tailwind CSS untuk styling
- shadcn/ui untuk komponen UI

### Backend Layer:
- Supabase sebagai Backend-as-a-Service
- PostgreSQL sebagai database
- Row Level Security untuk keamanan

### Integration Layer:
- RESTful API
- Real-time subscriptions
- Authentication & Authorization

## Diagram Workflow Detail

Berikut adalah diagram workflow yang lebih detail untuk proses perhitungan unit cost:

### Tahap 1: Input Data
- Data Master (Unit Kerja, Barang, Tindakan)
- Data Transaksi (Volume, Jumlah, Waktu)
- Data Biaya (Gaji, Bahan, Overhead)

### Tahap 2: Validasi
- Automated validation rules
- Manual review process
- Exception handling

### Tahap 3: Kalkulasi
- Biaya langsung per unit
- Distribusi biaya tidak langsung
- Unit cost final

### Tahap 4: Pelaporan
- Generate laporan rekapitulasi
- Analisis variance dan trend
- Export data untuk analisis lanjutan

## Diagram Komponen Sistem

Sistem Unit Cost RS terdiri dari beberapa komponen utama yang saling terintegrasi:

### 1. User Interface Layer
- Dashboard utama dengan overview
- Form input data yang user-friendly
- Laporan dan analisis visual

### 2. Business Logic Layer
- Engine kalkulasi unit cost
- Validasi data dan business rules
- Workflow management

### 3. Data Access Layer
- Database operations
- Data persistence
- Transaction management

### 4. Integration Layer
- API endpoints
- External system integration
- Real-time data synchronization

## Diagram Flowchart Proses

Berikut adalah flowchart yang menggambarkan alur proses perhitungan unit cost:

### Proses Utama:
1. **Input Data** → 2. **Validasi** → 3. **Kalkulasi** → 4. **Pelaporan**

### Detail Proses:
- **Input Data Master**: Unit kerja, barang, tindakan
- **Input Data Transaksi**: Volume, jumlah, waktu
- **Input Data Biaya**: Gaji, bahan, overhead
- **Validasi Data**: Automated rules, manual review
- **Kalkulasi**: Biaya langsung + tidak langsung
- **Pelaporan**: Rekapitulasi, analisis, export

### Output:
- Laporan unit cost per layanan
- Analisis variance dan trend
- Data untuk perencanaan tarif
- Dashboard monitoring real-time

## Diagram Arsitektur Teknologi

Sistem Unit Cost RS dibangun dengan stack teknologi modern:

### Frontend Technology Stack:
- **React.js 18+**: Library JavaScript untuk UI
- **TypeScript**: Type-safe JavaScript
- **Tailwind CSS**: Utility-first CSS framework
- **shadcn/ui**: Komponen UI yang reusable
- **Vite**: Build tool yang cepat

### Backend Technology Stack:
- **Supabase**: Backend-as-a-Service
- **PostgreSQL**: Database relasional
- **Row Level Security**: Keamanan data tingkat baris
- **Real-time subscriptions**: Update data real-time

### Development Tools:
- **ESLint**: Code linting
- **Prettier**: Code formatting
- **Git**: Version control
- **npm/yarn**: Package management

## Diagram Flowchart Sistem

Berikut adalah flowchart yang menggambarkan alur kerja sistem Unit Cost RS:

### Alur Kerja Utama:
1. **Login User** → 2. **Dashboard** → 3. **Input Data** → 4. **Validasi** → 5. **Kalkulasi** → 6. **Laporan**

### Detail Alur:
- **Login**: Autentikasi user dengan email/password
- **Dashboard**: Overview sistem dan menu navigasi
- **Input Data**: Form input untuk data master, transaksi, dan biaya
- **Validasi**: Pengecekan data dan business rules
- **Kalkulasi**: Perhitungan unit cost otomatis
- **Laporan**: Generate dan export laporan

### Fitur Tambahan:
- **Real-time monitoring**: Update data secara real-time
- **Export data**: Download dalam format Excel/PDF
- **Analisis trend**: Grafik dan analisis data
- **User management**: Pengelolaan user dan hak akses

## Diagram Flowchart Detail

Berikut adalah flowchart yang lebih detail untuk setiap proses dalam sistem:

### 1. Proses Input Data Master:
- **Unit Kerja**: Input data unit kerja rumah sakit
- **Barang**: Input data barang dan bahan habis pakai
- **Tindakan**: Input data tindakan medis dan non-medis

### 2. Proses Input Data Transaksi:
- **Volume Transaksi**: Input jumlah volume per layanan
- **Waktu Transaksi**: Input waktu dan durasi layanan
- **Validasi Input**: Pengecekan kelengkapan data

### 3. Proses Input Data Biaya:
- **Biaya Langsung**: Gaji, bahan, peralatan
- **Biaya Tidak Langsung**: Overhead, administrasi
- **Distribusi Biaya**: Alokasi biaya ke unit kerja

### 4. Proses Kalkulasi:
- **Kalkulasi Biaya Langsung**: Per unit layanan
- **Distribusi Biaya Tidak Langsung**: Berdasarkan driver
- **Unit Cost Final**: Total biaya per unit layanan

### 5. Proses Pelaporan:
- **Generate Laporan**: Otomatis berdasarkan periode
- **Analisis Variance**: Perbandingan budget vs actual
- **Export Data**: Download dalam berbagai format

## Diagram Flowchart Komponen

Berikut adalah diagram komponen sistem yang menunjukkan interaksi antar modul:

### Komponen Utama:
1. **User Interface**: Dashboard, form, laporan
2. **Business Logic**: Validasi, kalkulasi, workflow
3. **Data Access**: Database operations, queries
4. **Integration**: API, external systems

### Interaksi Antar Komponen:
- **UI ↔ Business Logic**: User actions dan validasi
- **Business Logic ↔ Data Access**: Data processing dan storage
- **Data Access ↔ Integration**: Data synchronization
- **Integration ↔ UI**: Real-time updates

### Flow Data:
- **Input**: User → UI → Business Logic → Data Access
- **Output**: Data Access → Business Logic → UI → User
- **Sync**: Integration ↔ Data Access (real-time)

## Diagram Flowchart Database

Berikut adalah diagram yang menunjukkan struktur database dan relasi antar tabel:

### Tabel Utama:
1. **unit_kerja**: Data unit kerja rumah sakit
2. **daftar_tindakan**: Data tindakan medis dan non-medis
3. **jenis_tindakan_rawat_jalan**: Data tindakan rawat jalan
4. **jenis_tindakan_rawat_inap**: Data tindakan rawat inap
5. **distribusi_biaya_pertama**: Data distribusi biaya pertama
6. **distribusi_biaya_kedua**: Data distribusi biaya kedua
7. **rekapitulasi_biaya**: Data rekapitulasi biaya

### Relasi Antar Tabel:
- **unit_kerja** → **jenis_tindakan_rawat_jalan** (1:many)
- **unit_kerja** → **jenis_tindakan_rawat_inap** (1:many)
- **daftar_tindakan** → **jenis_tindakan_rawat_jalan** (1:many)
- **daftar_tindakan** → **jenis_tindakan_rawat_inap** (1:many)
- **jenis_tindakan_rawat_jalan** → **distribusi_biaya_pertama** (1:many)
- **jenis_tindakan_rawat_inap** → **distribusi_biaya_pertama** (1:many)
- **distribusi_biaya_pertama** → **distribusi_biaya_kedua** (1:many)
- **distribusi_biaya_kedua** → **rekapitulasi_biaya** (1:many)

## Diagram Flowchart User Interface

Berikut adalah diagram yang menunjukkan struktur user interface dan navigasi:

### Halaman Utama:
1. **Dashboard**: Overview sistem dan menu navigasi
2. **Data Master**: Input data unit kerja, barang, tindakan
3. **Data Transaksi**: Input data volume dan waktu
4. **Data Biaya**: Input data biaya langsung dan tidak langsung
5. **Laporan**: Generate dan export laporan
6. **User Management**: Pengelolaan user dan hak akses

### Navigasi Menu:
- **Dashboard** → Overview dan quick access
- **Data Master** → Unit Kerja, Barang, Tindakan
- **Data Transaksi** → Volume, Waktu, Validasi
- **Data Biaya** → Biaya Langsung, Tidak Langsung
- **Laporan** → Rekapitulasi, Analisis, Export
- **Settings** → User, Role, Configuration

### Fitur UI:
- **Responsive Design**: Adaptif untuk desktop dan mobile
- **Real-time Updates**: Update data secara real-time
- **Interactive Charts**: Grafik interaktif untuk analisis
- **Export Functions**: Download dalam berbagai format

# 9. KEAMANAN DAN AKSES

## 8.1 Sistem Autentikasi

### User Authentication:
- Email/password authentication
- Multi-factor authentication (MFA)
- Session management
- Password policies

### Role-Based Access Control:
- Administrator: Full system access
- Manager: Department-level access
- Analyst: Read-only access
- User: Limited functionality access

## 8.2 Data Security

### Data Protection:
- Encryption in transit (HTTPS)
- Encryption at rest (database)
- Backup dan disaster recovery
- Data retention policies

### Audit Trail:
- User activity logging
- Data change tracking
- System access monitoring
- Compliance reporting

# 9. INTEGRASI DAN KONEKTIVITAS

## 9.1 Sistem Terintegrasi

### Hospital Information System (HIS):
- Patient data integration
- Medical record integration
- Billing system integration
- Pharmacy system integration

### Financial Systems:
- General ledger integration
- Accounts payable integration
- Budget system integration
- Financial reporting integration

## 9.2 Data Exchange

### API Integration:
- RESTful API endpoints
- Real-time data synchronization
- Batch data processing
- Error handling dan retry logic

### Data Import/Export:
- Excel file import/export
- CSV data exchange
- XML data format
- PDF report generation

# 10. MAINTENANCE DAN SUPPORT

## 10.1 System Maintenance

### Regular Maintenance:
- Database optimization
- Performance tuning
- Security updates
- Bug fixes dan patches

### Backup Strategy:
- Daily automated backups
- Point-in-time recovery
- Disaster recovery plan
- Data archiving

## 10.2 User Support

### Training dan Documentation:
- User training programs
- Online help system
- Video tutorials
- Best practices guides

### Technical Support:
- Help desk system
- Remote support capability
- Issue tracking
- Performance monitoring

# 11. ROADMAP DAN PENGEMBANGAN

## 11.1 Fitur Mendatang

### Advanced Analytics:
- Machine learning integration
- Predictive analytics
- Advanced visualization
- AI-powered insights

### Mobile Application:
- Native mobile app
- Offline capability
- Push notifications
- Mobile-optimized workflows

## 11.2 Scalability

### Performance Optimization:
- Caching strategies
- Database partitioning
- Load balancing
- Horizontal scaling

### Feature Expansion:
- Multi-hospital support
- Advanced reporting
- Integration capabilities
- Custom workflow builder

# 12. KESIMPULAN

Aplikasi Unit Cost RS merupakan solusi komprehensif untuk kebutuhan perhitungan unit cost di lingkungan rumah sakit. Dengan arsitektur yang modern, fitur yang lengkap, dan prinsip-prinsip akuntansi manajemen yang solid, aplikasi ini memberikan nilai tambah yang signifikan dalam pengelolaan biaya operasional rumah sakit.

Sistem ini dirancang untuk mendukung pengambilan keputusan yang lebih baik, meningkatkan efisiensi operasional, dan memastikan compliance dengan standar industri kesehatan. Dengan roadmap pengembangan yang jelas dan dukungan teknis yang berkelanjutan, aplikasi ini siap untuk berkembang seiring dengan kebutuhan rumah sakit yang terus berubah.

## 12.1 Keunggulan Kompetitif

- **Akurasi Tinggi**: Perhitungan unit cost yang presisi dan dapat dipertanggungjawabkan
- **User-Friendly**: Interface yang intuitif dan mudah digunakan
- **Scalable**: Arsitektur yang dapat berkembang sesuai kebutuhan
- **Secure**: Keamanan data yang terjamin dengan enkripsi dan audit trail
- **Integrated**: Kemampuan integrasi dengan sistem lain di rumah sakit

## 12.2 Dampak Organisasi

- **Operational Efficiency**: Peningkatan efisiensi operasional sebesar 15-25%
- **Cost Transparency**: Transparansi biaya yang meningkatkan accountability
- **Decision Support**: Dukungan pengambilan keputusan yang lebih baik
- **Compliance**: Pemenuhan regulasi dan standar industri
- **Competitive Advantage**: Keunggulan kompetitif dalam penetapan tarif

Aplikasi Unit Cost RS bukan hanya sekadar software, tetapi merupakan investasi strategis untuk masa depan rumah sakit yang lebih efisien, transparan, dan berkelanjutan.
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
      const fileName = `Modul_Gambaran_Umum_Unit_Cost_RS_${new Date().toISOString().split('T')[0]}.pdf`;
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
      className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
      title="Unduh Modul Gambaran Umum (15 halaman)"
    >
      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
      Unduh (15 halaman)
    </button>
  );
};

export default ModulGambaranUmum;
