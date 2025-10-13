import React from 'react';
import jsPDF from 'jspdf';

interface ModulDokumentasiSkemaProps {
  onDownloadStart?: () => void;
  onDownloadComplete?: () => void;
  onDownloadError?: (error: string) => void;
}

const ModulDokumentasiSkema: React.FC<ModulDokumentasiSkemaProps> = ({
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
        title: 'Modul Dokumentasi Struktur Skema Unit Cost RS',
        subject: 'Dokumentasi Struktur Skema Sistem',
        author: 'Mukhsin Hadi',
        creator: 'Aplikasi Unit Cost RS'
      });

      let currentPage = 1;
      const totalPages = 30;

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
        doc.setTextColor(255, 140, 0); // Orange color
        doc.setFont('arial', 'bold');
        doc.text(title, margin, 30);
        
        if (subtitle) {
          doc.setFontSize(11);
          doc.setFont('arial', 'normal');
          doc.setTextColor(100, 100, 100);
          doc.text(subtitle, margin, 40);
        }
        
        // Add colored separator line
        doc.setDrawColor(255, 140, 0);
        doc.line(margin, 45, doc.internal.pageSize.width - margin, 45);
      };

      // Helper function to add content with proper formatting
      const addContent = (content: string, startY: number = 60) => {
        const pageWidth = doc.internal.pageSize.width;
        const pageHeight = doc.internal.pageSize.height;
        const margin = 42.5;
        const maxWidth = pageWidth - (margin * 2) - 10;
        
        doc.setFontSize(11);
        doc.setFont('arial', 'normal');
        doc.setTextColor(0, 0, 0);
        
        const lines = doc.splitTextToSize(content, maxWidth);
        let y = startY;
        
        for (let i = 0; i < lines.length; i++) {
          if (y > pageHeight - 70) {
            addPageNumber(currentPage, totalPages);
            doc.addPage();
            currentPage++;
            y = 50;
          }
          
          const line = lines[i] as string;
          
          if (y === 50 && line.trim() === '') {
            continue;
          }
          
          if (line.startsWith('#')) {
            const headerText = line.replace(/^#+\s*/, '');
            const headerLevel = line.match(/^#+/)?.[0].length || 1;
            
            let headerColor = [255, 140, 0]; // Orange
            if (headerLevel === 2) headerColor = [34, 139, 34]; // Green
            if (headerLevel === 3) headerColor = [128, 0, 128]; // Purple
            if (headerLevel === 4) headerColor = [41, 128, 185]; // Blue
            
            doc.setFontSize(Math.max(14 - headerLevel, 11));
            doc.setFont('arial', 'bold');
            doc.setTextColor(headerColor[0], headerColor[1], headerColor[2]);
            doc.text(headerText, margin, y);
            y += 7;
          } else if (line.startsWith('- ') || line.startsWith('* ')) {
            const bulletText = line.replace(/^[-*]\s*/, '');
            doc.setFont('arial', 'normal');
            doc.setTextColor(0, 0, 0);
            
            doc.setTextColor(255, 140, 0);
            doc.text('•', margin + 5, y);
            doc.setTextColor(0, 0, 0);
            doc.text(bulletText, margin + 15, y);
            y += 6;
          } else if (line.trim() === '') {
            y += 4;
          } else {
            doc.setFont('arial', 'normal');
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
      
      // Background (Orange)
      doc.setFillColor(249, 115, 22); // Orange-500
      doc.rect(0, 0, pageWidth, pageHeight, "F");
      
      // Decorative circle
      doc.setFillColor(234, 88, 12); // Orange-600
      doc.circle(pageWidth / 2, -50, 120, "F");
      
      // Title
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(36);
      doc.setFont("times", "bold");
      doc.text("MODUL", pageWidth / 2, 65, { align: "center" });
      doc.setFontSize(26);
      doc.text("DOKUMENTASI", pageWidth / 2, 85, { align: "center" });
      doc.text("STRUKTUR SKEMA", pageWidth / 2, 103, { align: "center" });
      
      // Subtitle
      doc.setFontSize(16);
      doc.setFont("times", "bolditalic");
      doc.text("Aplikasi Unit Cost RS", pageWidth / 2, 125, { align: "center" });
      
      // Description
      doc.setFontSize(11);
      doc.setFont("helvetica", "normal");
      doc.text("Dokumentasi Lengkap Struktur Database dan Aplikasi", pageWidth / 2, 140, { align: "center" });
      
      // Author section - white box
      doc.setFillColor(255, 255, 255);
      doc.roundedRect(20, 160, pageWidth - 40, 55, 3, 3, "F");
      
      doc.setTextColor(102, 51, 0);
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
      
      // ===== MODUL DOKUMENTASI STRUKTUR SKEMA =====
      addHeader(
        'MODUL DOKUMENTASI STRUKTUR SKEMA',
        'Unit Cost RS - Dokumentasi Lengkap Struktur Database dan Aplikasi'
      );
      
      let y = addContent(`
# 1. PENDAHULUAN

Dokumentasi struktur skema ini berisi analisis lengkap terhadap arsitektur database dan struktur aplikasi Unit Cost RS. Dokumen ini memberikan gambaran komprehensif tentang bagaimana data disimpan, diorganisir, dan diakses dalam sistem.

## 1.1 Tujuan Dokumentasi

- Memberikan pemahaman mendalam tentang struktur database
- Dokumentasi relasi antar tabel dan dependencies
- Analisis performa dan optimasi database
- Panduan untuk maintenance dan development

# 2. STRUKTUR DATABASE UTAMA

## 2.1 Tabel Master Data

### Unit Kerja (unit_kerja)
- **Primary Key**: kode (VARCHAR)
- **Fields**: nama_unit_kerja, jenis, status
- **Relationships**: One-to-Many dengan berbagai tabel transaksi
- **Indexes**: kode (PRIMARY), nama_unit_kerja

### Daftar Tindakan (daftar_tindakan)
- **Primary Key**: id (SERIAL)
- **Fields**: kode_tindakan, nama_tindakan, jenis, satuan
- **Relationships**: One-to-Many dengan jenis_tindakan_*
- **Indexes**: id (PRIMARY), kode_tindakan

### Barang (barang)
- **Primary Key**: id (SERIAL)
- **Fields**: kode_barang, nama_barang, jenis, satuan, harga
- **Relationships**: One-to-Many dengan berbagai tabel penggunaan
- **Indexes**: id (PRIMARY), kode_barang

## 2.2 Tabel Transaksi

### Jenis Tindakan Rawat Jalan (jenis_tindakan_rawat_jalan)
- **Primary Key**: id (SERIAL)
- **Foreign Keys**: kode_unit_kerja, tindakan_id
- **Fields**: jumlah, waktu, biaya_tenaga_kerja, biaya_bahan
- **Relationships**: Many-to-One dengan unit_kerja dan daftar_tindakan
- **Indexes**: id (PRIMARY), kode_unit_kerja, tindakan_id

### Jenis Tindakan Rawat Inap (jenis_tindakan_rawat_inap)
- **Primary Key**: id (SERIAL)
- **Foreign Keys**: kode_unit_kerja, tindakan_id
- **Fields**: jumlah, waktu, biaya_tenaga_kerja, biaya_bahan
- **Relationships**: Many-to-One dengan unit_kerja dan daftar_tindakan
- **Indexes**: id (PRIMARY), kode_unit_kerja, tindakan_id

# 3. RELASI DAN DEPENDENCIES

## 3.1 Entity Relationship Diagram (ERD)

### Hubungan Utama:
- **unit_kerja** → **jenis_tindakan_rawat_jalan** (1:N)
- **unit_kerja** → **jenis_tindakan_rawat_inap** (1:N)
- **daftar_tindakan** → **jenis_tindakan_rawat_jalan** (1:N)
- **daftar_tindakan** → **jenis_tindakan_rawat_inap** (1:N)

### Hubungan Sekunder:
- **barang** → **penggunaan_barang** (1:N)
- **unit_kerja** → **biaya_operasional** (1:N)
- **jenis_tindakan_*** → **distribusi_biaya** (1:N)

## 3.2 Foreign Key Constraints

### Constraints Utama:
- FK_unit_kerja_rawat_jalan: jenis_tindakan_rawat_jalan.kode_unit_kerja → unit_kerja.kode
- FK_tindakan_rawat_jalan: jenis_tindakan_rawat_jalan.tindakan_id → daftar_tindakan.id
- FK_unit_kerja_rawat_inap: jenis_tindakan_rawat_inap.kode_unit_kerja → unit_kerja.kode
- FK_tindakan_rawat_inap: jenis_tindakan_rawat_inap.tindakan_id → daftar_tindakan.id

# 4. STRUKTUR APLIKASI

## 4.1 Arsitektur Frontend

### Komponen Utama:
- **Layout**: Struktur halaman utama dengan sidebar navigation
- **Pages**: Halaman-halaman fungsional aplikasi
- **Components**: Komponen UI yang dapat digunakan ulang
- **Hooks**: Custom hooks untuk logika bisnis
- **Utils**: Fungsi-fungsi utilitas

### Struktur Folder:

Struktur folder aplikasi:
- src/components/ui/ - Komponen UI dasar
- src/components/ModulTeknis/ - Komponen modul teknis
- src/pages/ - Halaman aplikasi
- src/hooks/ - Custom hooks
- src/utils/ - Utility functions
- src/types/ - TypeScript types
- src/integrations/ - Integrasi eksternal

## 4.2 Arsitektur Backend (Supabase)

### Database Schema:
- **Public Schema**: Tabel-tabel utama aplikasi
- **Auth Schema**: Tabel autentikasi Supabase
- **Storage**: File storage untuk dokumen dan gambar

### Row Level Security (RLS):
- **Policies**: Keamanan data tingkat baris
- **Roles**: Berbagai peran user dengan akses berbeda
- **Permissions**: Kontrol akses granular

# 5. ANALISIS PERFORMANCE

## 5.1 Indexing Strategy

### Primary Indexes:
- **Clustered Indexes**: Pada primary key semua tabel
- **Unique Indexes**: Pada field yang harus unik
- **Composite Indexes**: Pada kombinasi field yang sering di-query

### Performance Indexes:
- **unit_kerja**: (jenis, status)
- **daftar_tindakan**: (jenis, nama_tindakan)
- **jenis_tindakan_rawat_jalan**: (kode_unit_kerja, created_at)
- **jenis_tindakan_rawat_inap**: (kode_unit_kerja, created_at)

## 5.2 Query Optimization

### Optimized Queries:
- **Join Optimization**: Menggunakan INNER JOIN yang efisien
- **Subquery Reduction**: Mengurangi nested subquery
- **Aggregation**: Mengoptimalkan fungsi agregat
- **Pagination**: Implementasi LIMIT dan OFFSET yang efisien

# 6. STRUKTUR DATA FLOW

## 6.1 Input Data Flow

### Proses Input:
1. **User Input** → Form Validation
2. **Form Validation** → Database Insert
3. **Database Insert** → Success/Error Response
4. **Response** → UI Update

### Data Validation:
- **Client-side**: Validasi format dan kelengkapan
- **Server-side**: Validasi bisnis logic dan constraints
- **Database**: Constraint validation dan referential integrity

## 6.2 Output Data Flow

### Proses Output:
1. **User Request** → Query Building
2. **Query Building** → Database Query
3. **Database Query** → Data Processing
4. **Data Processing** → Response Formatting
5. **Response Formatting** → UI Rendering

# 7. API ENDPOINTS

## 7.1 RESTful API Structure

### Authentication Endpoints:
- POST /auth/signup - Registrasi user baru
- POST /auth/login - Login user
- POST /auth/logout - Logout user
- GET /auth/user - Get user info

### Data Endpoints:
- GET /unit-kerja - Get semua unit kerja
- POST /unit-kerja - Create unit kerja baru
- PUT /unit-kerja/:id - Update unit kerja
- DELETE /unit-kerja/:id - Delete unit kerja

### Report Endpoints:
- GET /reports/unit-cost - Generate laporan unit cost
- GET /reports/distribusi-biaya - Generate laporan distribusi biaya
- POST /reports/export - Export laporan ke PDF/Excel

## 7.2 Real-time Subscriptions

### Supabase Real-time:
- **unit_kerja_changes**: Subscribe perubahan data unit kerja
- **tindakan_changes**: Subscribe perubahan data tindakan
- **biaya_changes**: Subscribe perubahan data biaya

# 8. SECURITY IMPLEMENTATION

## 8.1 Authentication & Authorization

### Supabase Auth:
- **Email/Password**: Autentikasi dasar
- **JWT Tokens**: Token-based authentication
- **Session Management**: Automatic session handling

### Role-Based Access Control:
- **Admin**: Full system access
- **Manager**: Department-level access
- **Analyst**: Read-only access
- **User**: Limited functionality access

## 8.2 Data Security

### Row Level Security Policies:

SQL Policies untuk keamanan data:

-- Policy untuk unit_kerja
CREATE POLICY "Users can view unit kerja" ON unit_kerja
FOR SELECT USING (auth.role() IN ('admin', 'manager', 'analyst'));

-- Policy untuk jenis_tindakan_rawat_jalan
CREATE POLICY "Users can view tindakan rawat jalan" ON jenis_tindakan_rawat_jalan
FOR SELECT USING (auth.role() IN ('admin', 'manager', 'analyst'));

### Data Encryption:
- **In Transit**: HTTPS/TLS encryption
- **At Rest**: Database-level encryption
- **Application Level**: Sensitive data encryption

# 9. BACKUP DAN RECOVERY

## 9.1 Backup Strategy

### Automated Backups:
- **Daily Backups**: Full database backup setiap hari
- **Incremental Backups**: Backup perubahan data setiap jam
- **Point-in-time Recovery**: Recovery ke titik waktu tertentu

### Backup Storage:
- **Local Storage**: Backup lokal untuk akses cepat
- **Cloud Storage**: Backup cloud untuk disaster recovery
- **Retention Policy**: Kebijakan penyimpanan backup

## 9.2 Disaster Recovery

### Recovery Procedures:
- **Database Recovery**: Restore dari backup
- **Application Recovery**: Redeploy aplikasi
- **Data Validation**: Validasi data setelah recovery

# 10. MONITORING DAN MAINTENANCE

## 10.1 Performance Monitoring

### Key Metrics:
- **Query Performance**: Response time queries
- **Database Size**: Growth monitoring
- **Connection Pool**: Active connections
- **Cache Hit Rate**: Cache effectiveness

### Monitoring Tools:
- **Supabase Dashboard**: Built-in monitoring
- **Custom Logging**: Application-specific logs
- **Error Tracking**: Error monitoring dan alerting

## 10.2 Maintenance Tasks

### Regular Maintenance:
- **Database Optimization**: Regular VACUUM dan ANALYZE
- **Index Maintenance**: Rebuild indexes jika diperlukan
- **Data Cleanup**: Hapus data lama yang tidak diperlukan
- **Security Updates**: Update dependencies dan security patches

# 11. SCALABILITY CONSIDERATIONS

## 11.1 Horizontal Scaling

### Database Scaling:
- **Read Replicas**: Untuk meningkatkan read performance
- **Connection Pooling**: Mengoptimalkan koneksi database
- **Caching Strategy**: Implementasi cache untuk data yang sering diakses

### Application Scaling:
- **Load Balancing**: Distribusi beban antar server
- **CDN**: Content delivery network untuk static assets
- **Microservices**: Pemisahan layanan jika diperlukan

## 11.2 Vertical Scaling

### Resource Optimization:
- **Memory Usage**: Optimasi penggunaan memory
- **CPU Usage**: Optimasi processing power
- **Storage**: Optimasi penggunaan storage

# 12. FUTURE ENHANCEMENTS

## 12.1 Planned Features

### Advanced Analytics:
- **Machine Learning**: Predictive analytics untuk unit cost
- **Data Visualization**: Advanced charts dan dashboards
- **Real-time Analytics**: Live data analysis

### Integration Capabilities:
- **Hospital Information System**: Integration dengan HIS
- **Financial Systems**: Integration dengan sistem keuangan
- **External APIs**: Integration dengan layanan eksternal

## 12.2 Technical Improvements

### Performance Enhancements:
- **Database Partitioning**: Partitioning tabel besar
- **Query Optimization**: Advanced query optimization
- **Caching Layer**: Advanced caching strategies

### Security Enhancements:
- **Multi-factor Authentication**: MFA implementation
- **Advanced Encryption**: Enhanced encryption methods
- **Audit Logging**: Comprehensive audit trails

# 13. KESIMPULAN

Dokumentasi struktur skema ini memberikan gambaran komprehensif tentang arsitektur database dan aplikasi Unit Cost RS. Dengan struktur yang well-designed dan implementasi yang robust, sistem ini siap untuk mendukung kebutuhan operasional rumah sakit dengan performa yang optimal.

## 13.1 Key Takeaways

- **Structured Design**: Database design yang terstruktur dengan relasi yang jelas
- **Performance Optimized**: Implementasi indexing dan optimization yang tepat
- **Security First**: Keamanan data yang terjamin dengan RLS dan encryption
- **Scalable Architecture**: Arsitektur yang dapat berkembang sesuai kebutuhan

## 13.2 Best Practices

- **Regular Monitoring**: Monitoring performa dan kesehatan sistem secara berkala
- **Proactive Maintenance**: Maintenance yang proaktif untuk mencegah masalah
- **Documentation**: Dokumentasi yang selalu up-to-date
- **Testing**: Testing yang komprehensif sebelum deployment

Sistem Unit Cost RS dengan struktur skema yang solid ini memberikan fondasi yang kuat untuk pengembangan dan maintenance jangka panjang.
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
      const fileName = `Modul_Dokumentasi_Skema_Unit_Cost_RS_${new Date().toISOString().split('T')[0]}.pdf`;
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
      className="inline-flex items-center gap-1 px-3 py-1.5 bg-orange-600 text-white text-sm rounded-md hover:bg-orange-700 transition-colors"
      title="Unduh Modul Dokumentasi Struktur Skema (30 halaman)"
    >
      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
      Unduh (30 halaman)
    </button>
  );
};

export default ModulDokumentasiSkema;
