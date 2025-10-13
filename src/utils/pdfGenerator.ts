/**
 * PDF Generator untuk Modul Teknis
 * Menggunakan jsPDF untuk generate PDF dengan cover yang menarik
 */

import jsPDF from 'jspdf';

interface ModulData {
  title: string;
  subtitle?: string;
  author: string;
  credentials: string;
  copyright: string;
  hakCipta: string;
  content: string[];
  footer: string;
}

export const generateModulPDF = (data: ModulData): jsPDF => {
  // Create PDF with A4 size
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });
  
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  
  // Set font to Arial Narrow
  pdf.setFont('helvetica');
  
  // Cover Page (Separate page)
  generateCoverPage(pdf, data, pageWidth, pageHeight);
  
  // Add Table of Contents page
  pdf.addPage();
  generateTableOfContents(pdf, data, pageWidth, pageHeight);
  
  // Add content pages
  data.content.forEach((content, index) => {
    pdf.addPage();
    generateContentPage(pdf, content, pageWidth, pageHeight, data.footer);
  });

  return pdf;
};

const generateCoverPage = (pdf: jsPDF, data: ModulData, pageWidth: number, pageHeight: number) => {
  // A4 dimensions: 210mm x 297mm
  // Gradient blue background - more vibrant and professional
  pdf.setFillColor(20, 53, 147); // Royal blue background
  pdf.rect(0, 0, pageWidth, pageHeight, 'F');
  
  // Add gradient effect with overlays
  pdf.setFillColor(30, 70, 190, 0.7);
  pdf.rect(0, 0, pageWidth, pageHeight / 2, 'F');
  
  // Modern geometric pattern overlay (reduced for A4)
  pdf.setFillColor(255, 255, 255, 0.05);
  for (let i = 0; i < 5; i++) {
    for (let j = 0; j < 8; j++) {
      if ((i + j) % 3 === 0) {
        const size = 8 + Math.random() * 6;
        pdf.circle(i * 42 + 15, j * 37 + 15, size, 'F');
      }
    }
  }
  
  // Diagonal accent lines for modern look (adjusted for A4)
  pdf.setDrawColor(255, 255, 255, 0.1);
  pdf.setLineWidth(0.3);
  for (let i = 0; i < 12; i++) {
    pdf.line(i * 17, 0, i * 17 + 85, pageHeight);
  }
  
  // Main content area - elegant white card with shadow effect (optimized for A4)
  const contentWidth = pageWidth * 0.85;
  const contentHeight = pageHeight * 0.75;
  const contentX = (pageWidth - contentWidth) / 2;
  const contentY = (pageHeight - contentHeight) / 2;
  
  // Shadow effect
  pdf.setFillColor(0, 0, 0, 0.15);
  pdf.rect(contentX + 1.5, contentY + 1.5, contentWidth, contentHeight, 'F');
  
  // White content area
  pdf.setFillColor(255, 255, 255);
  pdf.rect(contentX, contentY, contentWidth, contentHeight, 'F');
  
  // Modern border with gradient effect
  pdf.setDrawColor(20, 53, 147);
  pdf.setLineWidth(2);
  pdf.rect(contentX, contentY, contentWidth, contentHeight, 'S');
  
  // Inner decorative border
  pdf.setDrawColor(59, 130, 246); // Light blue
  pdf.setLineWidth(0.8);
  pdf.rect(contentX + 4, contentY + 4, contentWidth - 8, contentHeight - 8, 'S');
  
  // Top accent bar with gradient (smaller for A4)
  pdf.setFillColor(20, 53, 147);
  pdf.rect(contentX, contentY, contentWidth, 18, 'F');
  pdf.setFillColor(59, 130, 246);
  pdf.rect(contentX, contentY + 18, contentWidth, 2, 'F');
  
  // Title section - centered and well-spaced (adjusted for A4)
  let currentY = contentY + 35;
  
  // Main title - size adjusted for A4
  pdf.setFontSize(16);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(20, 53, 147); // Royal blue
  const titleLines = pdf.splitTextToSize(data.title, contentWidth - 40);
  titleLines.forEach((line: string) => {
    pdf.text(line, pageWidth / 2, currentY, { align: 'center' });
    currentY += 10;
  });
  
  // Subtitle - size adjusted for A4
  if (data.subtitle) {
    currentY += 12;
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(59, 130, 246); // Light blue
    const subtitleLines = pdf.splitTextToSize(data.subtitle, contentWidth - 40);
    subtitleLines.forEach((line: string) => {
      pdf.text(line, pageWidth / 2, currentY, { align: 'center' });
      currentY += 9;
    });
  }
  
  // Decorative separator with modern design (adjusted for A4)
  currentY += 20;
  
  // Center decorative element
  const centerX = pageWidth / 2;
  pdf.setFillColor(59, 130, 246);
  pdf.circle(centerX, currentY, 2, 'F');
  
  // Decorative lines
  pdf.setDrawColor(59, 130, 246);
  pdf.setLineWidth(1);
  pdf.line(contentX + 30, currentY, centerX - 6, currentY);
  pdf.line(centerX + 6, currentY, pageWidth - contentX - 30, currentY);
  
  // Small accent dots
  pdf.setFillColor(20, 53, 147);
  pdf.circle(centerX - 10, currentY, 1, 'F');
  pdf.circle(centerX + 10, currentY, 1, 'F');
  
  // Author section with elegant box (adjusted for A4)
  currentY += 18;
  
  // Author label - "Penulis dan Pengembang"
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(71, 85, 105); // Dark slate
  pdf.text('Penulis dan Pengembang:', pageWidth / 2, currentY, { align: 'center' });
  
  currentY += 12;
  
  // Author box background (smaller for A4)
  const boxWidth = contentWidth - 40;
  const boxHeight = 32;
  const boxX = (pageWidth - boxWidth) / 2;
  const boxY = currentY - 3;
  
  pdf.setFillColor(245, 247, 250); // Very light gray
  pdf.roundedRect(boxX, boxY, boxWidth, boxHeight, 3, 3, 'F');
  
  pdf.setDrawColor(59, 130, 246);
  pdf.setLineWidth(0.8);
  pdf.roundedRect(boxX, boxY, boxWidth, boxHeight, 3, 3, 'S');
  
  currentY += 5;
  
  // Author name - prominent and elegant (adjusted size)
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(20, 53, 147); // Royal blue
  pdf.text(data.author, pageWidth / 2, currentY, { align: 'center' });
  
  currentY += 12;
  
  // Credentials - professional formatting with better spacing (font 12 as requested)
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(71, 85, 105); // Dark slate
  const credentialLines = pdf.splitTextToSize(data.credentials, contentWidth - 50);
  credentialLines.forEach((line: string) => {
    pdf.text(line, pageWidth / 2, currentY, { align: 'center' });
    currentY += 8;
  });
  
  currentY += 18;
  
  // Copyright info box (adjusted for A4)
  pdf.setFillColor(255, 249, 235); // Light yellow/gold tint
  const copyrightBoxHeight = 35;
  const copyrightBoxY = currentY - 6;
  const copyrightBoxWidth = contentWidth - 50;
  const copyrightBoxX = (pageWidth - copyrightBoxWidth) / 2;
  pdf.roundedRect(copyrightBoxX, copyrightBoxY, copyrightBoxWidth, copyrightBoxHeight, 3, 3, 'F');
  
  pdf.setDrawColor(251, 191, 36); // Gold border
  pdf.setLineWidth(1);
  pdf.roundedRect(copyrightBoxX, copyrightBoxY, copyrightBoxWidth, copyrightBoxHeight, 3, 3, 'S');
  
  // Label "Nomor Pencatatan Hak Cipta"
  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(120, 53, 15);
  pdf.text('Nomor Pencatatan Hak Cipta:', pageWidth / 2, currentY, { align: 'center' });
  
  currentY += 10;
  
  // Nomor Hak Cipta
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(180, 83, 9); // Dark orange
  pdf.text(data.hakCipta, pageWidth / 2, currentY, { align: 'center' });
  
  currentY += 12;
  
  // Copyright text
  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(120, 53, 15);
  pdf.text('Copyright © 2024 • Versi 1.0', pageWidth / 2, currentY, { align: 'center' });
  
  // Bottom accent bar (smaller for A4)
  pdf.setFillColor(20, 53, 147);
  pdf.rect(contentX, contentY + contentHeight - 20, contentWidth, 20, 'F');
  
  // Footer - white text on blue background with icon-like elements
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(255, 255, 255); // White
  pdf.text('Hak Cipta Dilindungi Undang-Undang', pageWidth / 2, contentY + contentHeight - 11, { align: 'center' });
  
  // Year on colored background
  pdf.setFontSize(8);
  pdf.setTextColor(200, 220, 255);
  pdf.text(data.footer, pageWidth / 2, contentY + contentHeight - 4, { align: 'center' });
};

const generateTableOfContents = (pdf: jsPDF, data: ModulData, pageWidth: number, pageHeight: number) => {
  const margin = 20; // Reduced margin for A4
  
  // Header background (smaller for A4)
  pdf.setFillColor(245, 247, 250);
  pdf.rect(0, 0, pageWidth, 60, 'F');
  
  // Header - Professional styling with accent (adjusted for A4)
  pdf.setFontSize(18);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(20, 53, 147);
  pdf.text('DAFTAR ISI', pageWidth / 2, margin + 25, { align: 'center' });
  
  // Subtitle under header
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(100, 116, 139);
  pdf.text('Table of Contents', pageWidth / 2, margin + 35, { align: 'center' });
  
  // Decorative line with dots
  const centerX = pageWidth / 2;
  pdf.setDrawColor(59, 130, 246);
  pdf.setLineWidth(1.5);
  pdf.line(margin + 30, margin + 45, pageWidth - margin - 30, margin + 45);
  
  // Decorative dots
  pdf.setFillColor(20, 53, 147);
  pdf.circle(centerX, margin + 45, 1.5, 'F');
  
  // Table of contents items - dynamic based on content
  const getTocItems = (title: string) => {
    if (title.includes('DATABASE')) {
      return [
        '1. GAMBARAN UMUM',
        '2. DIAGRAM RELASI DATABASE',
        '3. TABEL MASTER DATA',
        '4. TABEL TRANSAKSI',
        '5. TABEL KALKULASI',
        '6. TABEL DISTRIBUSI BIAYA',
        '7. TABEL OUTPUT & REPORTING',
        '8. VIEWS & STORED PROCEDURES',
        '9. RELASI ANTAR TABEL',
        '10. DATA FLOW & PROCESS',
        '11. FORMULA & METODOLOGI',
        '12. BEST PRACTICES'
      ];
    } else if (title.includes('ROLE')) {
      return [
        '1. PENDAHULUAN',
        '2. GAMBARAN UMUM',
        '3. DASAR TEORITIS DAN REGULASI PENDUKUNG',
        '4. STRUKTUR ROLE SISTEM',
        '5. DETAIL ROLE DAN PRIVILEGE',
        '6. MATRIX AKSES MENU',
        '7. IMPLEMENTASI KEAMANAN',
        '8. PANDUAN PENGGUNAAN',
        '9. KESIMPULAN'
      ];
    } else if (title.includes('PELATIHAN')) {
      return [
        '1. PENGENALAN APLIKASI',
        '2. PERSIAPAN DAN LOGIN',
        '3. NAVIGASI DAN INTERFACE',
        '4. MANAJEMEN DATA MASTER',
        '5. DATA OPERASIONAL',
        '6. KALKULASI UNIT COST',
        '7. DISTRIBUSI BIAYA',
        '8. SKENARIO TARIF',
        '9. LAPORAN DAN ANALISIS',
        '10. MANAJEMEN USER',
        '11. TROUBLESHOOTING',
        '12. BEST PRACTICES'
      ];
    } else if (title.includes('MANAJEMEN USER')) {
      return [
        '1. PENDAHULUAN',
        '2. OVERVIEW SISTEM',
        '3. STRUKTUR ROLE',
        '4. PROSEDUR PENAMBAHAN USER',
        '5. MANAJEMEN ROLE',
        '6. ADMINISTRASI SISTEM',
        '7. KEAMANAN DAN AUDIT',
        '8. TROUBLESHOOTING',
        '9. BEST PRACTICES'
      ];
    } else if (title.includes('KONFIGURASI')) {
      return [
        '1. PENDAHULUAN',
        '2. ARSITEKTUR SISTEM',
        '3. KONFIGURASI SISTEM',
        '4. MAINTENANCE RUTIN',
        '5. BACKUP DAN RECOVERY',
        '6. MONITORING DAN ALERTING',
        '7. PERFORMANCE OPTIMIZATION',
        '8. SECURITY MAINTENANCE',
        '9. TROUBLESHOOTING',
        '10. DISASTER RECOVERY'
      ];
    } else {
      return [
        '1. PENDAHULUAN',
        '2. LATAR BELAKANG',
        '3. TUJUAN DAN MANFAAT',
        '4. RUANG LINGKUP SISTEM',
        '5. ARSITEKTUR SISTEM',
        '6. FITUR UTAMA',
        '7. TEKNOLOGI YANG DIGUNAKAN',
        '8. IMPLEMENTASI DAN DEPLOYMENT',
        '9. KESIMPULAN'
      ];
    }
  };
  
  const tocItems = getTocItems(data.title);
  
  let yPos = margin + 65; // Adjusted for A4
  
  tocItems.forEach((item, index) => {
    // Alternating background for better readability
    if (index % 2 === 0) {
      pdf.setFillColor(249, 250, 251);
      pdf.rect(margin + 15, yPos - 8, pageWidth - 2 * margin - 30, 12, 'F');
    }
    
    // Item number and text (font size 12 as requested)
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(59, 130, 246);
    pdf.text(`${index + 1}.`, margin + 22, yPos);
    
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(30, 41, 59);
    const itemText = item.replace(/^\d+\.\s*/, '');
    pdf.text(itemText, margin + 32, yPos);
    
    // Dotted line
    const dotsStartX = margin + 37 + pdf.getTextWidth(itemText);
    const dotsEndX = pageWidth - margin - 35;
    
    pdf.setDrawColor(203, 213, 225);
    pdf.setLineWidth(0.3);
    for (let x = dotsStartX + 3; x < dotsEndX; x += 2) {
      pdf.circle(x, yPos - 1.5, 0.3, 'F');
    }
    
    // Page number with circle background (smaller for A4)
    const pageNum = `${index + 3}`;
    pdf.setFillColor(59, 130, 246);
    pdf.circle(pageWidth - margin - 20, yPos - 2, 6, 'F');
    
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(255, 255, 255);
    pdf.text(pageNum, pageWidth - margin - 20, yPos + 0.5, { align: 'center' });
    
    yPos += 13; // Reduced spacing for A4
  });
  
  // Bottom decorative line
  pdf.setDrawColor(59, 130, 246);
  pdf.setLineWidth(0.8);
  pdf.line(margin + 30, pageHeight - 30, pageWidth - margin - 30, pageHeight - 30);
  
  // Footer with page number
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(100, 116, 139);
  pdf.text(data.footer, pageWidth / 2, pageHeight - 15, { align: 'center' });
  
  pdf.setFontSize(8);
  pdf.setTextColor(148, 163, 184);
  pdf.text('Halaman 2', pageWidth / 2, pageHeight - 8, { align: 'center' });
};

const generateContentPage = (pdf: jsPDF, content: string, pageWidth: number, pageHeight: number, footer: string) => {
  // Content area with professional margins (adjusted for A4)
  const margin = 20;
  const contentWidth = pageWidth - (margin * 2);
  const contentHeight = pageHeight - 60; // Leave space for header and footer
  
  // Top border accent (smaller for A4)
  pdf.setFillColor(59, 130, 246);
  pdf.rect(0, 0, pageWidth, 2, 'F');
  
  // Parse content for sections and styling
  const sections = content.split('\n\n');
  
  let yPosition = margin + 12;
  const lineHeight = 5.5; // Adjusted for A4
  const paragraphSpacing = 8;
  
  sections.forEach((section) => {
    // Check if section is a title (all caps or starts with a number)
    const isTitle = section === section.toUpperCase() || /^\d+\./.test(section);
    
    if (isTitle) {
      // Add extra space before title
      if (yPosition > margin + 20) {
        yPosition += 15;
      }
      
      // Title background
      if (yPosition + 12 < contentHeight) {
        pdf.setFillColor(245, 247, 250);
        pdf.rect(margin - 5, yPosition - 8, contentWidth + 10, 12, 'F');
        
        // Left accent bar
        pdf.setFillColor(59, 130, 246);
        pdf.rect(margin - 5, yPosition - 8, 3, 12, 'F');
      }
      
      // Title text
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(20, 53, 147);
      
      const titleLines = pdf.splitTextToSize(section, contentWidth - 10);
      titleLines.forEach((line: string) => {
        if (yPosition > contentHeight) {
          pdf.addPage();
          pdf.setFillColor(59, 130, 246);
          pdf.rect(0, 0, pageWidth, 3, 'F');
          yPosition = margin + 15;
        }
        pdf.text(line, margin + 5, yPosition);
        yPosition += 10;
      });
      
      yPosition += 5;
    } else {
      // Regular paragraph text with better formatting
  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(30, 41, 59);
      
      // Check for bullet points or numbered lists
      const lines = section.split('\n');
      
      lines.forEach((line) => {
        // Handle bullet points
        if (line.trim().startsWith('•') || line.trim().startsWith('-')) {
          const bulletText = line.trim().substring(1).trim();
          const textLines = pdf.splitTextToSize(bulletText, contentWidth - 15);
          
          textLines.forEach((textLine: string, index: number) => {
            if (yPosition > contentHeight) {
              pdf.addPage();
              pdf.setFillColor(59, 130, 246);
              pdf.rect(0, 0, pageWidth, 3, 'F');
              yPosition = margin + 15;
            }
            
            if (index === 0) {
              // Draw bullet
              pdf.setFillColor(59, 130, 246);
              pdf.circle(margin + 3, yPosition - 2, 1.5, 'F');
            }
            
            pdf.text(textLine, margin + 10, yPosition);
            yPosition += lineHeight;
          });
        } else if (line.trim()) {
          // Regular text with justified alignment
          const textLines = pdf.splitTextToSize(line, contentWidth);
          
          textLines.forEach((textLine: string) => {
    if (yPosition > contentHeight) {
      pdf.addPage();
              pdf.setFillColor(59, 130, 246);
              pdf.rect(0, 0, pageWidth, 3, 'F');
              yPosition = margin + 15;
            }
            pdf.text(textLine, margin, yPosition);
            yPosition += lineHeight;
          });
        }
      });
      
      yPosition += paragraphSpacing;
    }
  });
  
  // Bottom border
  pdf.setDrawColor(203, 213, 225);
  pdf.setLineWidth(0.5);
  pdf.line(margin, pageHeight - 25, pageWidth - margin, pageHeight - 25);
  
  // Footer (only once per page)
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(100, 116, 139);
  pdf.text(footer, pageWidth / 2, pageHeight - 12, { align: 'center' });
  
  // Page number
  pdf.setFontSize(8);
  pdf.setTextColor(148, 163, 184);
  const pageNum = pdf.internal.pages.length - 1;
  pdf.text(`Halaman ${pageNum}`, pageWidth / 2, pageHeight - 6, { align: 'center' });
};

// Specific modul data
export const getRoleAccessModulData = (): ModulData => {
  return {
    title: 'MODUL ROLE AKSES DAN PRIVILEGE SISTEM',
    subtitle: 'APLIKASI UNIT COST RUMAH SAKIT',
    author: 'MUKHSIN HADI, SE, M.Si',
    credentials: 'CGAA, CPFRM, CSEP, CRP, CPRM, CSCAP, CPABC',
    copyright: '000831709',
    hakCipta: '000831709',
    footer: 'Copyright © 2024 Mukhsin Hadi. Hak Cipta Dilindungi Undang-Undang',
    content: [
      'PENDAHULUAN\n\nSistem Manajemen Akses pada Aplikasi Unit Cost Rumah Sakit dirancang untuk memberikan kontrol akses yang ketat dan terstruktur terhadap berbagai fitur dan data dalam sistem. Modul ini menjelaskan secara detail tentang struktur role, privilege, dan hak akses yang dapat diberikan kepada setiap pengguna sistem.\n\nTujuan Sistem Role Akses:\n• Memastikan keamanan data dan informasi\n• Memberikan kontrol akses yang granular\n• Mencegah akses yang tidak sah\n• Memudahkan administrasi user\n• Memberikan audit trail yang jelas',
      
      'GAMBARAN UMUM\n\nAplikasi Unit Cost Rumah Sakit merupakan sistem informasi terintegrasi yang dirancang untuk menghitung dan mengelola biaya satuan pelayanan di rumah sakit. Sistem ini mengimplementasikan pendekatan Activity-Based Costing (ABC) untuk menghasilkan informasi biaya yang akurat dan transparan.\n\nLatar Belakang:\nDalam era transformasi digital kesehatan, rumah sakit membutuhkan sistem informasi yang mampu memberikan data biaya yang akurat untuk mendukung pengambilan keputusan manajemen.\n\nRuang Lingkup Sistem:\n• Unit Pelayanan Medis - Rawat inap, rawat jalan, gawat darurat\n• Unit Penunjang - Laboratorium, radiologi, farmasi, gizi\n• Unit Keperawatan - Berbagai kelas perawatan dan unit khusus\n• Unit Diklat - Pendidikan dan pelatihan tenaga kesehatan',
      
      'DASAR TEORITIS DAN REGULASI PENDUKUNG\n\nDasar Teoritis:\n\n1. Activity-Based Costing (ABC)\nActivity-Based Costing adalah metode perhitungan biaya yang mengalokasikan biaya berdasarkan aktivitas yang sebenarnya dilakukan untuk menghasilkan produk atau layanan.\n\nPrinsip Dasar ABC:\n• Cost Objects - Unit layanan yang akan dihitung biayanya\n• Activities - Aktivitas yang mendukung penyediaan layanan\n• Resources - Sumber daya yang dikonsumsi oleh aktivitas\n• Cost Drivers - Faktor yang menyebabkan terjadinya biaya\n\n2. Cost Center Management\nSistem ini mengimplementasikan manajemen cost center yang memungkinkan pengelompokan biaya berdasarkan unit organisasi dan aktivitas.\n\n3. Responsibility Accounting\nPrinsip akuntansi pertanggungjawaban diterapkan dimana setiap unit atau individu bertanggung jawab terhadap biaya yang dapat mereka kontrol.',
      
      'REGULASI PENDUKUNG\n\n1. Keputusan Menteri Kesehatan RI No. HK.01.07/MENKES/346/2025\nTentang Pedoman Penghitungan Biaya Satuan Pelayanan di Rumah Sakit\n\nKetentuan Utama:\n• Rumah sakit wajib menghitung biaya satuan pelayanan secara akurat\n• Perhitungan biaya harus menggunakan metode yang dapat dipertanggungjawabkan\n• Laporan biaya harus transparan dan dapat diaudit\n• Sistem informasi harus mendukung proses perhitungan biaya\n\nPasal-pasal Relevan:\n• Pasal 5: Rumah sakit wajib memiliki sistem informasi yang mendukung perhitungan biaya\n• Pasal 8: Perhitungan biaya harus mencakup biaya langsung dan tidak langsung\n• Pasal 12: Sistem harus mampu menghasilkan laporan perhitungan biaya\n• Pasal 15: Data dan proses perhitungan biaya harus dapat diaudit\n\n2. Peraturan Menteri Kesehatan RI No. 44 Tahun 2016\nTentang Standar Teknis Pelayanan Minimal Rumah Sakit\n\n3. Undang-Undang No. 36 Tahun 2009\nTentang Kesehatan\n\n4. Standar Akuntansi Keuangan (SAK)\nPSAK 45: Pelaporan Keuangan Organisasi Nirlaba',
      
      'STRUKTUR ROLE SISTEM\n\nSistem menggunakan 5 level role dengan hierarki yang jelas:\n\n🟣 SUPER ADMIN (Level 1)\n• Deskripsi: Akses penuh ke semua fitur sistem\n• Jumlah Menu: 15 menus\n• Privilege Level: Tertinggi\n• Kemampuan: User Management, Delete Users, System Administration\n\n🔵 ADMIN (Level 2)\n• Deskripsi: Administrator dengan akses terbatas\n• Jumlah Menu: 13 menus\n• Privilege Level: Tinggi (tanpa delete dan user management)\n• Kemampuan: Data Management, Create/Edit, No Delete\n\n🟢 MANAGER (Level 3)\n• Deskripsi: Manager dengan akses laporan dan monitoring\n• Jumlah Menu: 7 menus\n• Privilege Level: Menengah (view only)\n• Kemampuan: Reports, Monitoring, No Data Modification\n\n🟠 OPERATOR (Level 4)\n• Deskripsi: Operator dengan akses input data\n• Jumlah Menu: 5 menus\n• Privilege Level: Menengah (create/edit tanpa delete)\n• Kemampuan: Data Input, Unit Operations\n\n⚫ VIEWER (Level 5)\n• Deskripsi: Hanya dapat melihat data dan laporan\n• Jumlah Menu: 7 menus\n• Privilege Level: Terendah (view only)\n• Kemampuan: Read-Only Access, Reports',
      
      'DETAIL ROLE DAN PRIVILEGE\n\nSUPER ADMIN - Hak Akses Lengkap:\n• Full Access ke semua menu (15 menus)\n• View, Create, Edit, Delete semua data\n• User Management - Kelola semua user dan role\n• System Administration - Konfigurasi sistem\n• Audit Access - Akses log dan audit trail\n• Kemampuan Khusus: Menghapus user secara permanen, Assign role ke user lain, Mengubah permission system\n\nADMIN - Hak Akses Terbatas:\n• View, Create, Edit (tidak ada Delete)\n• Tidak ada akses ke Manajemen Akses\n• Tidak ada akses ke Modul Teknis\n• Administrative Control untuk data operasional\n• Kemampuan: Mengelola data master dan operasional, Membuat dan mengedit laporan, Mengatur skenario tarif',
      
      'MATRIX AKSES MENU\n\nDashboard:\n• Super Admin: ✅ Full Access\n• Admin: ✅ Create/Edit\n• Manager: ✅ View Only\n• Operator: ✅ Create/Edit\n• Viewer: ✅ View Only\n\nData Master:\n• Super Admin: ✅ Full Access\n• Admin: ✅ Create/Edit\n• Manager: ❌ No Access\n• Operator: ❌ No Access\n• Viewer: ❌ No Access\n\nData Operasional:\n• Super Admin: ✅ Full Access\n• Admin: ✅ Create/Edit\n• Manager: ❌ No Access\n• Operator: ❌ No Access\n• Viewer: ❌ No Access\n\nUnit Penunjang:\n• Super Admin: ✅ Full Access\n• Admin: ✅ Create/Edit\n• Manager: ❌ No Access\n• Operator: ✅ Create/Edit\n• Viewer: ❌ No Access\n\nManajemen Akses:\n• Super Admin: ✅ Full Access\n• Admin: ❌ No Access\n• Manager: ❌ No Access\n• Operator: ❌ No Access\n• Viewer: ❌ No Access',
      
      'IMPLEMENTASI KEAMANAN\n\n1. Row Level Security (RLS)\n• Semua tabel menggunakan RLS untuk kontrol akses\n• Policy berdasarkan role user yang aktif\n• Otomatis filter data berdasarkan permission\n\n2. Function-Based Security\n• Menggunakan SECURITY DEFINER functions\n• Centralized permission checking\n• Audit trail untuk semua aksi user\n\n3. Role Hierarchy\n• Super Admin > Admin > Manager > Operator > Viewer\n• Higher role memiliki akses ke semua fitur lower role\n• Tidak ada privilege escalation tanpa otorisasi\n\n4. Session Management\n• Token-based authentication\n• Automatic session timeout\n• Multi-device login tracking\n\n5. Audit Trail\n• Log semua aktivitas user\n• Track perubahan data\n• Monitor akses sistem\n• Generate laporan keamanan',
      
      'PANDUAN PENGGUNAAN\n\nUntuk Super Admin:\n1. Login dengan kredensial Super Admin\n2. Akses menu "Manajemen Akses"\n3. Kelola user dan assign role sesuai kebutuhan\n4. Monitor aktivitas user melalui audit log\n5. Konfigurasi sistem dan security settings\n\nUntuk Admin:\n1. Fokus pada pengelolaan data operasional\n2. Tidak bisa mengakses user management\n3. Dapat membuat dan mengedit data (tidak bisa delete)\n4. Akses ke semua fitur kecuali sistem administration\n5. Generate laporan untuk manajemen\n\nUntuk Manager:\n1. Fokus pada monitoring dan reporting\n2. Akses terbatas pada menu laporan\n3. Tidak bisa mengubah data apapun\n4. Dapat export laporan untuk analisis\n5. Monitor performance unit-unit pelayanan\n\nUntuk Operator:\n1. Input data operasional harian\n2. Fokus pada unit-unit operasional\n3. Tidak bisa mengakses data master\n4. Tidak bisa menghapus data\n5. Maintain data akurasi unit kerja\n\nUntuk Viewer:\n1. Hanya dapat melihat laporan\n2. Tidak bisa mengubah data apapun\n3. Akses terbatas pada menu reporting\n4. Dapat export data untuk review\n5. Monitor tren dan performa sistem',
      
      'KESIMPULAN\n\nSistem Role Akses pada Aplikasi Unit Cost Rumah Sakit telah dirancang dengan prinsip:\n\n1. Security First - Keamanan data adalah prioritas utama\n2. Principle of Least Privilege - User hanya mendapat akses yang diperlukan\n3. Audit Trail - Semua aktivitas dapat di-track dan diaudit\n4. Scalability - Sistem dapat dikembangkan sesuai kebutuhan\n5. User-Friendly - Interface yang mudah digunakan\n\nDengan implementasi sistem ini, organisasi dapat memastikan bahwa setiap pengguna memiliki akses yang sesuai dengan tanggung jawab dan wewenangnya, sekaligus menjaga keamanan dan integritas data sistem.\n\nManfaat Implementasi:\n• Keamanan data yang terjamin\n• Kontrol akses yang granular\n• Audit trail yang lengkap\n• Administrasi user yang efisien\n• Kepatuhan terhadap regulasi\n• Transparansi dalam pengelolaan sistem\n\nSistem ini mendukung transformasi digital rumah sakit dengan menyediakan platform yang aman, transparan, dan dapat dipertanggungjawabkan untuk perhitungan biaya unit pelayanan.'
    ]
  };
};

// Specific modul data for Database Schema Documentation
export const getDatabaseSchemaModulData = (): ModulData => {
  return {
    title: 'DOKUMENTASI SKEMA STRUKTUR DATABASE',
    subtitle: 'APLIKASI UNIT COST RUMAH SAKIT',
    author: 'MUKHSIN HADI, SE, M.Si',
    credentials: 'CGAA, CPFRM, CSEP, CRP, CPRM, CSCAP, CPABC',
    copyright: '000831709',
    hakCipta: '000831709',
    footer: 'Copyright © 2024 Mukhsin Hadi. Hak Cipta Dilindungi Undang-Undang',
    content: [
      'GAMBARAN UMUM\n\nAplikasi Unit Cost RS adalah sistem informasi untuk menghitung unit cost layanan rumah sakit menggunakan pendekatan Activity Based Costing (ABC). Sistem ini membantu manajemen rumah sakit dalam menetapkan tarif yang tepat berdasarkan biaya riil operasional.\n\nTeknologi Stack:\n• Database: PostgreSQL (Supabase) - Database relasional dengan RLS\n• Backend: Supabase BaaS - Backend as a Service\n• Frontend: React + TypeScript - Framework modern & type-safe\n• Build Tool: Vite - Fast build & HMR\n• UI Library: Tailwind + shadcn/ui - Modern component library\n• State Management: TanStack Query - Server state management\n\nRingkasan Database:\n• Total Tabel: 43+ tabel\n• Master Data: 14 tabel\n• Transaksi: 3 tabel\n• Kalkulasi: 8 tabel\n• Distribusi Biaya: 3 tabel\n• Output & Reporting: 7 tabel\n• Stored Procedures: 8+ functions',
      
      'DIAGRAM RELASI DATABASE\n\nEntity Relationship Diagram (ERD):\nSistem database dirancang dengan struktur normalisasi yang optimal untuk mendukung perhitungan unit cost dengan metodologi Activity Based Costing.\n\nCore Entities:\n• Master Data Entities - Data referensi dan konfigurasi\n• Transaction Entities - Data transaksi operasional\n• Calculation Entities - Data perhitungan biaya\n• Distribution Entities - Data distribusi biaya\n• Reporting Entities - Data output dan laporan\n\nKey Relationships:\n• One-to-Many - Master data ke transaksi\n• Many-to-Many - Transaksi ke kalkulasi\n• Hierarchical - Struktur organisasi unit kerja\n• Temporal - Data historis dan versi',
      
      'TABEL MASTER DATA\n\n1. Data Unit Kerja\n• Primary Key: id (UUID)\n• Fields: kode_unit, nama_unit, jenis_unit, parent_id\n• Relationships: Self-referencing untuk hierarki\n\n2. Data Barang\n• Primary Key: id (UUID)\n• Fields: kode_barang, nama_barang, satuan, harga_satuan\n• Purpose: Katalog barang habis pakai\n\n3. Data Barang Gizi\n• Primary Key: id (UUID)\n• Fields: kode_barang, nama_barang, kandungan_gizi (JSONB)\n• Purpose: Katalog barang gizi dengan informasi nutrisi\n\n4. Data Kamar\n• Primary Key: id (UUID)\n• Fields: kode_kamar, nama_kamar, kelas_kamar, tarif_kamar\n• Relationships: Foreign key ke unit_kerja\n\n5. Data Klinik\n• Primary Key: id (UUID)\n• Fields: kode_klinik, nama_klinik, jenis_klinik\n• Relationships: Foreign key ke unit_kerja\n\n6. Data Kegiatan\n• Primary Key: id (UUID)\n• Fields: kode_kegiatan, nama_kegiatan, jenis_kegiatan\n• Purpose: Katalog aktivitas operasional\n\n7-14. Data Tindakan (7 jenis)\n• Laboratorium, Radiologi, Operatif, Cathlab, BDRS\n• Fields: kode_tindakan, nama_tindakan, tarif_tindakan\n• Relationships: Foreign key ke unit_kerja\n\n15. Data Diklat\n• Primary Key: id (UUID)\n• Fields: kode_diklat, nama_diklat, durasi_jam, biaya_diklat\n\n16. Dasar Alokasi\n• Primary Key: id (UUID)\n• Fields: nama_alokasi, metode_alokasi, basis_alokasi, persentase',
      
      'TABEL TRANSAKSI\n\n1. Data Pendapatan\n• Primary Key: id (UUID)\n• Fields: unit_id, periode, jenis_pendapatan, jumlah_pendapatan, jumlah_volume\n• Purpose: Data pendapatan per periode per unit\n• Relationships: Foreign key ke unit_kerja\n\n2. Data Biaya\n• Primary Key: id (UUID)\n• Fields: unit_id, periode, jenis_biaya, jumlah_biaya, jumlah_volume\n• Purpose: Data biaya operasional per periode per unit\n• Relationships: Foreign key ke unit_kerja\n\n3. Data Akomodasi Inap\n• Primary Key: id (UUID)\n• Fields: kamar_id, periode, jumlah_hari, tarif_per_hari, occupancy_rate\n• Purpose: Data akomodasi dan occupancy rate\n• Relationships: Foreign key ke data_kamar\n\nData Flow Transaksi:\n• Input: Data operasional harian\n• Processing: Validasi dan normalisasi data\n• Storage: Penyimpanan dengan timestamp\n• Output: Data untuk perhitungan unit cost',
      
      'TABEL KALKULASI\n\n1. Kalkulasi Biaya Gizi\n• Primary Key: id (UUID)\n• Fields: periode, unit_id, total_biaya_bahan, total_biaya_tenaga, biaya_per_pori\n• Purpose: Perhitungan biaya gizi per pori\n• Formula: (Total Biaya Bahan + Tenaga + Overhead) / Jumlah Pori\n\n2. Kalkulasi Tindakan Rawat Jalan\n• Primary Key: id (UUID)\n• Fields: tindakan_id, periode, biaya_bahan, biaya_tenaga, total_biaya, tarif_jual\n• Purpose: Perhitungan unit cost tindakan rawat jalan\n• Relationships: Foreign key ke data_tindakan\n\n3. Kalkulasi Biaya Operatif\n• Primary Key: id (UUID)\n• Fields: tindakan_id, periode, biaya_instrumen, biaya_bahan, biaya_tenaga\n• Purpose: Perhitungan biaya operasi\n• Special Fields: durasi_standar untuk perhitungan biaya fasilitas\n\n4. Kalkulasi Biaya Laboratorium\n• Primary Key: id (UUID)\n• Fields: tindakan_id, periode, biaya_reagen, biaya_alat\n• Purpose: Perhitungan biaya pemeriksaan lab\n\n5. Kalkulasi Biaya Radiologi\n• Primary Key: id (UUID)\n• Fields: tindakan_id, periode, biaya_kontras, biaya_alat\n• Purpose: Perhitungan biaya pemeriksaan radiologi\n\n6. Kalkulasi Biaya Cathlab\n• Primary Key: id (UUID)\n• Fields: tindakan_id, periode, biaya_kateter, biaya_fasilitas\n• Purpose: Perhitungan biaya prosedur cathlab\n\n7. Kalkulasi Biaya Diklat\n• Primary Key: id (UUID)\n• Fields: diklat_id, periode, biaya_instructor, biaya_materi\n• Purpose: Perhitungan biaya per peserta diklat\n\n8. Kalkulasi Biaya BDRS\n• Primary Key: id (UUID)\n• Fields: tindakan_id, periode, biaya_bahan, biaya_alat\n• Purpose: Perhitungan biaya layanan BDRS',
      
      'TABEL DISTRIBUSI BIAYA\n\n1. Distribusi Biaya Pertama\n• Primary Key: id (UUID)\n• Fields: periode, unit_pengirim, unit_penerima, jenis_biaya, jumlah_biaya\n• Purpose: Distribusi biaya overhead dari unit support ke unit operasional\n• Basis Alokasi: jumlah_bed, jumlah_volume, direct_cost\n\n2. Distribusi Biaya Kedua\n• Primary Key: id (UUID)\n• Fields: periode, unit_pengirim, unit_penerima, persentase_alokasi\n• Purpose: Redistribusi biaya antar unit operasional\n• Method: Step-down method atau reciprocal method\n\n3. Dasar Alokasi Biaya Gizi\n• Primary Key: id (UUID)\n• Fields: periode, unit_id, jumlah_bed, persentase_alokasi\n• Purpose: Alokasi biaya gizi berdasarkan jumlah tempat tidur\n• Formula: (Jumlah Bed Unit / Total Bed) × Total Biaya Gizi\n\nProses Distribusi:\n• Step 1: Identifikasi biaya overhead\n• Step 2: Tentukan basis alokasi\n• Step 3: Hitung persentase alokasi\n• Step 4: Distribusi biaya\n• Step 5: Update unit cost final',
      
      'TABEL OUTPUT & REPORTING\n\n1. Rekapitulasi Unit Cost\n• Primary Key: id (UUID)\n• Fields: periode, unit_id, total_pendapatan, total_biaya, unit_cost, margin_profit\n• Purpose: Ringkasan unit cost per unit per periode\n• Formula: Unit Cost = Total Biaya / Total Volume\n\n2. Skenario Tarif\n• Primary Key: id (UUID)\n• Fields: nama_skenario, jenis_layanan, tarif_awal, tarif_baru, dampak_pendapatan\n• Purpose: Simulasi perubahan tarif dan dampaknya\n\n3. Cost Recovery\n• Primary Key: id (UUID)\n• Fields: periode, unit_id, target_pendapatan, realisasi_pendapatan, recovery_rate\n• Purpose: Analisis pencapaian target pendapatan\n• Formula: Recovery Rate = Realisasi / Target × 100%\n\n4. Budgeting BHP\n• Primary Key: id (UUID)\n• Fields: periode, unit_id, jenis_bhp, budget_awal, realisasi_bhp, variance_bhp\n• Purpose: Analisis budget vs realisasi BHP\n\n5. Produk Layanan\n• Primary Key: id (UUID)\n• Fields: kode_produk, nama_produk, unit_cost, tarif_jual, margin_profit\n• Purpose: Katalog produk dengan analisis profitabilitas\n\n6. Menu Gizi\n• Primary Key: id (UUID)\n• Fields: nama_menu, kandungan_kalori, kandungan_protein, biaya_menu\n• Purpose: Katalog menu dengan informasi nutrisi dan biaya\n\n7. Manajemen Tindakan Inap\n• Primary Key: id (UUID)\n• Fields: tindakan_id, kelas_kamar, biaya_tindakan, biaya_akomodasi\n• Purpose: Tarif tindakan berdasarkan kelas kamar',
      
      'VIEWS & STORED PROCEDURES\n\nViews:\n\n1. View Rekapitulasi Unit Cost\n• Purpose: Menampilkan ringkasan unit cost per unit\n• Fields: kode_unit, nama_unit, total_pendapatan, total_biaya, unit_cost\n• Logic: LEFT JOIN antara unit_kerja, data_pendapatan, data_biaya\n• Calculation: Unit Cost = Total Biaya / Total Volume\n\n2. View Cost Recovery Summary\n• Purpose: Menampilkan status cost recovery per unit\n• Fields: kode_unit, nama_unit, target_pendapatan, realisasi_pendapatan, recovery_rate\n• Status Logic: Excellent (≥100%), Good (≥80%), Fair (≥60%), Poor (<60%)\n\nStored Procedures:\n\n1. calculate_unit_cost(unit_id, periode)\n• Purpose: Menghitung unit cost untuk unit tertentu dalam periode tertentu\n• Parameters: p_unit_id (UUID), p_periode (DATE)\n• Returns: DECIMAL(15,2) - Unit cost value\n• Logic: (Total Biaya / Total Volume) dengan validasi division by zero\n\n2. distribute_overhead_cost(periode, basis_alokasi)\n• Purpose: Mendistribusikan biaya overhead berdasarkan basis alokasi\n• Parameters: p_periode (DATE), p_basis_alokasi (VARCHAR)\n• Returns: VOID - Inserts records ke distribusi_biaya_pertama\n• Basis Options: jumlah_bed, jumlah_volume, direct_cost\n• Logic: Proportional distribution berdasarkan basis value',
      
      'RELASI ANTAR TABEL\n\nPrimary Relationships:\n\n1. Unit Kerja sebagai Central Hub\n• One-to-Many: unit_kerja → data_kamar, data_klinik, data_kegiatan\n• One-to-Many: unit_kerja → data_pendapatan, data_biaya\n• One-to-Many: unit_kerja → rekapitulasi_unit_cost, cost_recovery\n\n2. Master Data Relationships\n• One-to-Many: data_tindakan → kalkulasi_tindakan_rawat_jalan\n• One-to-Many: data_tindakan_operatif → kalkulasi_biaya_operatif\n• One-to-Many: data_tindakan_lab → kalkulasi_biaya_laboratorium\n\n3. Transaction Relationships\n• Many-to-One: data_pendapatan → unit_kerja\n• Many-to-One: data_biaya → unit_kerja\n• Many-to-One: data_akomodasi_inap → data_kamar\n\n4. Calculation Relationships\n• One-to-Many: unit_kerja → kalkulasi_biaya_gizi\n• One-to-Many: data_tindakan → kalkulasi_tindakan_rawat_jalan\n• One-to-Many: data_diklat → kalkulasi_biaya_diklat\n\nForeign Key Constraints:\n• ALTER TABLE data_kamar ADD CONSTRAINT fk_kamar_unit FOREIGN KEY (unit_id) REFERENCES unit_kerja(id)\n• ALTER TABLE data_pendapatan ADD CONSTRAINT fk_pendapatan_unit FOREIGN KEY (unit_id) REFERENCES unit_kerja(id)\n• ALTER TABLE kalkulasi_biaya_gizi ADD CONSTRAINT fk_kbg_unit FOREIGN KEY (unit_id) REFERENCES unit_kerja(id)\n• ALTER TABLE kalkulasi_tindakan_rawat_jalan ADD CONSTRAINT fk_ktrj_tindakan FOREIGN KEY (tindakan_id) REFERENCES data_tindakan(id)',
      
      'DATA FLOW & PROCESS\n\n1. Data Input Process:\n\nMaster Data Input:\n• Setup Unit Kerja - Definisi struktur organisasi\n• Input Data Barang - Katalog barang habis pakai\n• Setup Tindakan - Katalog layanan medis\n• Konfigurasi Tarif - Setup tarif dasar\n\nTransaction Data Input:\n• Input Pendapatan - Data pendapatan per periode\n• Input Biaya - Data biaya operasional\n• Input Volume - Data volume layanan\n\n2. Calculation Process:\n\nActivity Based Costing (ABC):\n• Identify Activities - Mapping aktivitas per unit\n• Cost Assignment - Alokasi biaya ke aktivitas\n• Cost Driver Analysis - Analisis cost driver\n• Unit Cost Calculation - Perhitungan biaya per unit\n\nCost Distribution Process:\n• Direct Cost Assignment - Biaya langsung ke unit\n• Overhead Distribution - Distribusi biaya overhead\n• Cost Allocation - Alokasi biaya berdasarkan basis\n• Final Cost Calculation - Perhitungan biaya final\n\n3. Reporting Process:\n\nUnit Cost Reports:\n• Calculate Unit Cost - Perhitungan unit cost\n• Generate Summary - Ringkasan per unit\n• Create Reports - Pembuatan laporan\n• Export Data - Export untuk analisis',
      
      'FORMULA & METODOLOGI\n\n1. Unit Cost Formula:\n\nBasic Unit Cost Formula:\nUnit Cost = Total Biaya / Total Volume\n\nActivity Based Costing Formula:\nUnit Cost = (Direct Cost + Allocated Overhead) / Activity Volume\n\n2. Cost Distribution Formulas:\n\nOverhead Distribution:\nUnit Overhead = (Unit Basis / Total Basis) × Total Overhead\n\nBasis Allocation Methods:\n• Bed Count - Berdasarkan jumlah tempat tidur\n• Volume - Berdasarkan volume layanan\n• Revenue - Berdasarkan pendapatan\n• Direct Cost - Berdasarkan biaya langsung\n\n3. Profitability Analysis:\n\nMargin Calculation:\nProfit Margin = (Tarif Jual - Unit Cost) / Tarif Jual × 100%\n\nCost Recovery:\nRecovery Rate = Realisasi Pendapatan / Target Pendapatan × 100%\n\n4. Performance Metrics:\n\nEfficiency Ratio:\nEfficiency = Output Volume / Input Cost\n\nUtilization Rate:\nUtilization = Actual Usage / Capacity × 100%',
      
      'BEST PRACTICES\n\n1. Database Design:\n\nNormalization:\n• 3rd Normal Form - Menghindari redundancy\n• Proper Indexing - Optimasi query performance\n• Foreign Key Constraints - Data integrity\n• Data Types - Penggunaan tipe data yang tepat\n\nPerformance Optimization:\n• Index Strategy - Index pada kolom yang sering diquery\n• Query Optimization - Efficient query design\n• Partitioning - Partition tabel besar\n• Archiving - Archive data historis\n\n2. Data Management:\n\nData Quality:\n• Validation Rules - Validasi data input\n• Data Cleaning - Pembersihan data\n• Consistency Checks - Konsistensi data\n• Audit Trail - Tracking perubahan data\n\nSecurity:\n• Row Level Security (RLS) - Keamanan tingkat baris\n• User Authentication - Autentikasi user\n• Access Control - Kontrol akses\n• Data Encryption - Enkripsi data sensitif\n\n3. Reporting & Analytics:\n\nReport Design:\n• Consistent Format - Format laporan konsisten\n• Performance Metrics - KPI yang relevan\n• Visualization - Grafik dan chart yang jelas\n• Drill-down Capability - Analisis detail\n\nData Analysis:\n• Trend Analysis - Analisis tren\n• Comparative Analysis - Analisis perbandingan\n• Variance Analysis - Analisis variansi\n• Forecasting - Prediksi masa depan\n\n4. Maintenance & Support:\n\nRegular Maintenance:\n• Data Backup - Backup data reguler\n• Performance Monitoring - Monitoring performa\n• Update Procedures - Prosedur update\n• Documentation - Dokumentasi sistem\n\nUser Training:\n• System Training - Pelatihan sistem\n• Best Practices - Praktik terbaik\n• Troubleshooting - Pemecahan masalah\n• Support Documentation - Dokumentasi support'
    ]
  };
};

// Specific modul data for Gambaran Umum
export const getGambaranUmumModulData = (): ModulData => {
  return {
    title: 'MODUL GAMBARAN UMUM',
    subtitle: 'APLIKASI UNIT COST RUMAH SAKIT',
    author: 'MUKHSIN HADI, SE, M.Si',
    credentials: 'CGAA, CPFRM, CSEP, CRP, CPRM, CSCAP, CPABC',
    copyright: '000831709',
    hakCipta: '000831709',
    footer: 'Copyright © 2024 Mukhsin Hadi. Hak Cipta Dilindungi Undang-Undang',
    content: [
      'PENDAHULUAN\n\nAplikasi Unit Cost Rumah Sakit adalah sistem informasi terintegrasi yang dirancang khusus untuk menghitung dan mengelola biaya satuan pelayanan di rumah sakit. Sistem ini mengimplementasikan pendekatan Activity-Based Costing (ABC) untuk menghasilkan informasi biaya yang akurat, transparan, dan dapat dipertanggungjawabkan.\n\nDalam era transformasi digital kesehatan, rumah sakit membutuhkan sistem informasi yang mampu memberikan data biaya yang akurat untuk mendukung pengambilan keputusan manajemen, perencanaan anggaran, dan evaluasi kinerja unit pelayanan.',
      
      'LATAR BELAKANG\n\nPerkembangan Sistem Informasi Kesehatan:\nTransformasi digital dalam sektor kesehatan telah mengubah cara rumah sakit mengelola operasional dan keuangan. Kebutuhan akan transparansi biaya, akuntabilitas keuangan, dan efisiensi operasional menjadi semakin penting.\n\nTantangan dalam Perhitungan Biaya Rumah Sakit:\n1. Kompleksitas Struktur Biaya - Biaya langsung dan tidak langsung, alokasi biaya overhead yang tepat\n2. Kebutuhan Akurasi Data - Data real-time yang akurat, konsistensi perhitungan, audit trail yang lengkap\n3. Kepatuhan Regulasi - Sesuai dengan pedoman Kementerian Kesehatan, standar akuntansi yang berlaku\n\nSolusi yang Ditawarkan:\nAplikasi Unit Cost Rumah Sakit memberikan solusi komprehensif melalui sistem perhitungan biaya yang terintegrasi, metodologi Activity-Based Costing (ABC), interface yang user-friendly, dan pelaporan yang komprehensif.',
      
      'TUJUAN DAN MANFAAT\n\nTujuan Utama:\n1. Akurasi Perhitungan Biaya - Menghasilkan data biaya yang akurat dan dapat dipertanggungjawabkan\n2. Transparansi Keuangan - Memberikan visibilitas penuh terhadap struktur biaya\n3. Efisiensi Operasional - Mengotomasi proses perhitungan biaya yang kompleks\n4. Dukungan Pengambilan Keputusan - Menyediakan data untuk strategi bisnis\n\nManfaat untuk Stakeholder:\n• Manajemen Rumah Sakit - Data biaya akurat, identifikasi area efisiensi, perencanaan anggaran\n• Unit Operasional - Otomasi perhitungan, standarisasi proses, akses real-time\n• Tim Keuangan - Transparansi penuh, konsistensi perhitungan, audit trail lengkap\n• Tim IT - Sistem terintegrasi, scalability, maintenance mudah, security terjamin',
      
      'RUANG LINGKUP SISTEM\n\nUnit Pelayanan yang Dicakup:\n\n1. Unit Pelayanan Medis:\n• Rawat Inap - Berbagai kelas perawatan (VIP, Kelas 1, 2, 3)\n• Rawat Jalan - Poliklinik dan layanan konsultasi\n• Gawat Darurat - Unit gawat darurat dan ICU\n• Unit Operasi - Kamar operasi dan recovery\n\n2. Unit Penunjang Medis:\n• Laboratorium - Pemeriksaan laboratorium rutin dan khusus\n• Radiologi - Pemeriksaan imaging dan diagnostik\n• Farmasi - Layanan apotek dan distribusi obat\n• Gizi - Konsultasi gizi dan catering pasien\n\n3. Unit Keperawatan:\n• Perawatan Umum - Berbagai tingkat perawatan\n• Perawatan Khusus - ICU, NICU, PICU\n• Perawatan Lansia - Geriatric care\n• Perawatan Anak - Pediatric care\n\n4. Unit Diklat dan Pendidikan:\n• Pendidikan Medis - Program residensi dan fellowship\n• Pelatihan Tenaga Kesehatan - Continuous medical education\n• Penelitian - Unit penelitian dan pengembangan\n• Konsultasi - Layanan konsultasi medis',
      
      'ARSITEKTUR SISTEM\n\nKomponen Utama:\n\n1. Frontend (User Interface):\n• React.js - Framework untuk user interface\n• TypeScript - Type-safe development\n• Tailwind CSS - Utility-first CSS framework\n• Shadcn UI - Komponen UI yang konsisten\n\n2. Backend (Server):\n• Supabase - Backend-as-a-Service\n• PostgreSQL - Database management system\n• Row Level Security (RLS) - Keamanan data\n• Real-time Subscriptions - Update data real-time\n\n3. Database Schema:\n• Normalized Tables - Struktur database yang efisien\n• Relationships - Relasi antar tabel yang terstruktur\n• Indexes - Optimasi query performance\n• Triggers - Otomasi proses bisnis\n\n4. Security Layer:\n• Authentication - Sistem login yang aman\n• Authorization - Role-based access control\n• Data Encryption - Enkripsi data sensitif\n• Audit Trail - Log semua aktivitas user',
      
      'FITUR UTAMA\n\n1. Dashboard dan Monitoring:\n• Dashboard Utama - Overview kinerja seluruh unit, trend analysis, KPI\n• Real-time Monitoring - Live data updates, performance metrics, cost tracking\n\n2. Manajemen Data Master:\n• Data Unit Kerja - Struktur organisasi, cost center setup, resource allocation\n• Data Barang dan Jasa - Master data barang, master data jasa, price management\n\n3. Kalkulasi Biaya:\n• Activity-Based Costing - Activity mapping, cost driver analysis, resource consumption\n• Unit Cost Calculation - Direct cost calculation, indirect cost allocation, overhead distribution\n\n4. Laporan dan Analisis:\n• Financial Reports - Income statement, cost analysis report, profitability analysis\n• Operational Reports - Utilization report, efficiency analysis, performance dashboard',
      
      'TEKNOLOGI YANG DIGUNAKAN\n\nFrontend Technologies:\n• React Ecosystem - React 18, TypeScript, Vite, React Router\n• UI/UX Framework - Tailwind CSS, Shadcn UI, Lucide React, React Hook Form\n• State Management - TanStack Query, Zustand, React Context, Local Storage\n\nBackend Technologies:\n• Supabase Platform - PostgreSQL, Real-time, Authentication, Storage\n• Database Features - Row Level Security (RLS), Triggers, Functions, Views\n• API Integration - REST API, GraphQL, Webhooks, Real-time Subscriptions\n\nDevelopment Tools:\n• Code Quality - ESLint, Prettier, Husky, TypeScript\n• Testing - Jest, React Testing Library, Cypress, Vitest',
      
      'IMPLEMENTASI DAN DEPLOYMENT\n\nDevelopment Environment:\n• Local Development - Node.js, npm/pnpm, Git, VS Code\n• Development Workflow - Feature Branch, Code Review, Automated Testing, Quality Gates\n\nProduction Deployment:\n• Hosting Platform - Vercel, Supabase Cloud, CDN, SSL Certificate\n• Performance Optimization - Code Splitting, Image Optimization, Caching Strategy, Bundle Optimization\n\nMonitoring dan Maintenance:\n• Application Monitoring - Error Tracking, Performance Monitoring, User Analytics, Uptime Monitoring\n• Database Monitoring - Query Performance, Connection Pooling, Backup Strategy, Security Auditing',
      
      'KESIMPULAN\n\nAplikasi Unit Cost Rumah Sakit merupakan solusi komprehensif yang dirancang untuk mengatasi tantangan dalam perhitungan biaya satuan pelayanan di rumah sakit. Dengan mengimplementasikan metodologi Activity-Based Costing (ABC) dan teknologi modern, sistem ini memberikan manfaat yang signifikan bagi semua stakeholder.\n\nKeunggulan Sistem:\n• Akurasi Tinggi - Perhitungan biaya yang akurat dan dapat dipertanggungjawabkan\n• Transparansi Penuh - Visibilitas lengkap terhadap struktur biaya\n• Efisiensi Operasional - Otomasi proses yang kompleks dan memakan waktu\n• Scalability - Sistem yang dapat dikembangkan sesuai kebutuhan\n• User-Friendly - Interface yang intuitif dan mudah digunakan\n• Security - Keamanan data yang terjamin dengan role-based access control\n\nDampak Implementasi:\n• Untuk Organisasi - Peningkatan efisiensi, pengurangan biaya, peningkatan profitabilitas\n• Untuk Stakeholder - Data akurat untuk pengambilan keputusan, tools efisien, transparansi lengkap\n\nSistem ini mendukung transformasi digital rumah sakit dengan menyediakan platform yang aman, transparan, dan dapat dipertanggungjawabkan untuk perhitungan biaya unit pelayanan.'
    ]
  };
};

// Specific modul data for User Management
export const getUserManagementModulData = (): ModulData => {
  return {
    title: 'PANDUAN MANAJEMEN USER DAN ADMINISTRASI',
    subtitle: 'APLIKASI UNIT COST RUMAH SAKIT',
    author: 'MUKHSIN HADI, SE, M.Si',
    credentials: 'CGAA, CPFRM, CSEP, CRP, CPRM, CSCAP, CPABC',
    copyright: '000831709',
    hakCipta: '000831709',
    footer: 'Copyright © 2024 Mukhsin Hadi. Hak Cipta Dilindungi Undang-Undang',
    content: [
      'PENDAHULUAN\n\nSistem Manajemen User dan Administrasi pada Aplikasi Unit Cost Rumah Sakit dirancang untuk memberikan kontrol akses yang granular dan aman terhadap semua fitur dan data dalam sistem. Sistem ini mengimplementasikan Role-Based Access Control (RBAC) untuk memastikan setiap pengguna memiliki akses yang sesuai dengan tanggung jawab dan wewenangnya.\n\nTujuan Panduan:\n• Memberikan panduan lengkap untuk mengelola pengguna sistem\n• Menjelaskan prosedur administrasi yang aman dan efisien\n• Menyediakan referensi troubleshooting untuk masalah umum\n• Menetapkan best practices untuk keamanan sistem\n\nSasaran Pengguna:\n• Super Admin - Pengelola penuh sistem\n• Admin - Administrator sistem dengan akses terbatas\n• Operator - Pengguna operasional dengan akses dasar',
      
      'OVERVIEW SISTEM MANAJEMEN USER\n\nArsitektur Sistem:\nSistem Manajemen User dibangun dengan arsitektur yang aman dan scalable:\n\nKomponen Utama:\n• Authentication Layer - Verifikasi identitas pengguna\n• Authorization Layer - Kontrol akses berdasarkan role\n• User Management Layer - Pengelolaan data pengguna\n• Audit Layer - Pencatatan aktivitas pengguna\n\nDatabase Schema:\n• auth.users - Tabel utama untuk manajemen user\n• roles - Tabel role dengan permissions\n• user_profiles - Profil pengguna dengan role assignment\n• permissions - Tabel permissions sistem\n• role_permissions - Mapping role ke permissions\n\nFlow Authentication:\n1. Login - User memasukkan email dan password\n2. Verification - Sistem memverifikasi kredensial\n3. Role Assignment - Sistem menetapkan role berdasarkan profil\n4. Permission Check - Sistem memeriksa izin akses\n5. Session Creation - Sistem membuat sesi pengguna',
      
      'STRUKTUR ROLE DAN PERMISSION\n\nHierarki Role:\n\n1. Super Admin:\n• Akses Penuh - Semua fitur dan data\n• User Management - Kelola semua pengguna\n• System Configuration - Konfigurasi sistem\n• Audit Access - Akses log dan audit trail\n\n2. Admin:\n• Operational Access - 13 menu operasional\n• Data Management - Kelola data master dan transaksi\n• Reporting - Akses laporan dan analisis\n• No User Management - Tidak dapat kelola pengguna\n\n3. Operator:\n• Limited Access - 7 menu terbatas\n• Data Entry - Input data operasional\n• View Only - Akses baca pada beberapa menu\n• No Administrative Access - Tidak ada akses administrasi\n\nPermission Matrix:\n• Dashboard: Super Admin ✅, Admin ✅, Operator ✅\n• Data Master: Super Admin ✅, Admin ✅, Operator ❌\n• Data Operasional: Super Admin ✅, Admin ✅, Operator ❌\n• Unit Penunjang: Super Admin ✅, Admin ✅, Operator ✅\n• Manajemen Akses: Super Admin ✅, Admin ❌, Operator ❌\n• Modul Teknis: Super Admin ✅, Admin ❌, Operator ❌',
      
      'PROSEDUR PENAMBAHAN USER\n\n1. Persiapan Data User:\nInformasi yang Diperlukan:\n• Email Address - Alamat email yang valid dan unik\n• Full Name - Nama lengkap pengguna\n• Role Assignment - Role yang akan diberikan\n• Department - Unit kerja atau departemen\n• Access Level - Level akses yang diperlukan\n\nValidasi Data:\n• Validasi email format dengan regex\n• Validasi role assignment dengan enum\n• Validasi department dengan master data\n• Validasi access level dengan permission matrix\n\n2. Proses Penambahan User:\nStep 1: Akses User Management\n• Login sebagai Super Admin\n• Navigate ke menu "Manajemen Akses"\n• Pilih tab "Kelola User"\n• Klik tombol "Tambah User Baru"\n\nStep 2: Input Data User\n• Masukkan email dan password\n• Pilih role yang sesuai\n• Tetapkan department\n• Konfigurasi permissions\n\nStep 3: Konfirmasi dan Aktivasi\n• Email Verification - Kirim email konfirmasi\n• Role Assignment - Tetapkan role yang sesuai\n• Permission Setup - Konfigurasi izin akses\n• Activation - Aktifkan akun pengguna',
      
      'MANAJEMEN ROLE DAN AKSES\n\n1. Assignment Role:\nProsedur Assignment:\n• Select User - Pilih pengguna yang akan di-assign\n• Choose Role - Pilih role yang sesuai\n• Validate Permission - Pastikan role memiliki izin yang tepat\n• Execute Assignment - Jalankan assignment\n• Audit Log - Catat aktivitas assignment\n\nCode Implementation:\n• Validasi user dan role existence\n• Update role assignment dengan transaction\n• Log audit trail untuk compliance\n• Send notification ke user\n• Update session permissions\n\n2. Permission Management:\nDynamic Permission Check:\n• Function check_user_permission untuk validasi real-time\n• Cache permissions untuk performa optimal\n• Automatic permission refresh pada role change\n• Fallback mechanism untuk permission errors\n\nMenu Access Control:\n• getMenuAccess function untuk filtering menu\n• Menu requirements mapping\n• Permission-based menu visibility\n• Dynamic menu generation',
      
      'ADMINISTRASI SISTEM\n\n1. User Monitoring:\nDashboard Monitoring:\n• Active Users - Jumlah pengguna aktif\n• Login Frequency - Frekuensi login harian\n• Role Distribution - Distribusi role pengguna\n• Failed Attempts - Upaya login gagal\n• Session Duration - Durasi sesi rata-rata\n\nKey Metrics:\n• Total active users per day\n• Login success rate\n• Average session duration\n• Most accessed features\n• Error rates per user\n\n2. System Health Check:\nAutomated Health Check:\n• Database connectivity test\n• Authentication service status\n• User management functionality\n• Permission system validation\n• Audit logging verification\n\nHealth Status Indicators:\n• Database: Connection, query performance, storage\n• Authentication: Login success rate, session management\n• User Management: CRUD operations, role assignments\n• Permissions: Access control, menu filtering\n• Audit: Logging completeness, retention compliance',
      
      'KEAMANAN DAN AUDIT\n\n1. Security Measures:\nPassword Policy:\n• Minimum Length - 8 karakter\n• Complexity - Kombinasi huruf, angka, simbol\n• Expiration - 90 hari\n• History - Tidak boleh menggunakan 5 password terakhir\n\nSession Management:\n• Max Age - 24 hours\n• Secure - HTTPS only\n• HttpOnly - No client-side access\n• SameSite - CSRF protection\n\nTwo-Factor Authentication (2FA):\n• Secret generation dengan authenticator\n• QR Code generation untuk setup\n• Backup codes untuk recovery\n• Integration dengan mobile apps\n\n2. Audit Logging:\nComprehensive Audit Trail:\n• User actions dengan timestamp\n• Resource access dengan IP tracking\n• Permission changes dengan approval workflow\n• System changes dengan rollback capability\n\nCritical Events to Log:\n• Login/Logout - Autentikasi pengguna\n• Role Changes - Perubahan role\n• Permission Updates - Update izin akses\n• Data Access - Akses data sensitif\n• System Changes - Perubahan konfigurasi',
      
      'TROUBLESHOOTING\n\n1. Common Issues:\nLogin Problems:\n• User tidak dapat login - Check account status, email confirmation, password reset\n• Role tidak muncul - Verify role assignment, permission setup\n• Menu tidak tampil - Check menu permissions, role mapping\n\nPermission Issues:\n• User tidak dapat mengakses menu - Debug permissions, check role assignment\n• Error "Insufficient permissions" - Verify permission matrix, role configuration\n• Menu hilang setelah login - Check session permissions, refresh token\n\n2. Error Handling:\nCommon Error Codes:\n• AUTH_001 - Invalid credentials\n• AUTH_002 - Account locked\n• AUTH_003 - Email not confirmed\n• PERM_001 - Insufficient permissions\n• PERM_002 - Role not found\n• SYS_001 - Database connection error\n\nError Response Format:\n• Standardized error response structure\n• Error codes dengan human-readable messages\n• Request ID untuk tracking\n• Timestamp untuk debugging\n• Context information untuk troubleshooting',
      
      'BEST PRACTICES\n\n1. User Management:\nAccount Lifecycle:\n• Onboarding - Proses masuk pengguna baru\n• Regular Review - Review akses secara berkala\n• Role Updates - Update role sesuai kebutuhan\n• Offboarding - Proses keluar pengguna\n\nSecurity Guidelines:\n• Principle of Least Privilege - Berikan akses minimal yang diperlukan\n• Regular Audits - Audit akses secara berkala\n• Strong Authentication - Gunakan autentikasi yang kuat\n• Monitor Activity - Monitor aktivitas pengguna\n\n2. Administrative Procedures:\nDaily Tasks:\n• Monitor Login Activity - Pantau aktivitas login\n• Check System Health - Cek kesehatan sistem\n• Review Audit Logs - Review log audit\n• Backup Verification - Verifikasi backup\n\nWeekly Tasks:\n• User Access Review - Review akses pengguna\n• Security Assessment - Assessment keamanan\n• Performance Analysis - Analisis performa\n• Update Documentation - Update dokumentasi\n\nMonthly Tasks:\n• Comprehensive Audit - Audit menyeluruh\n• Security Training - Pelatihan keamanan\n• System Updates - Update sistem\n• Disaster Recovery Test - Test recovery'
    ]
  };
};

// Specific modul data for System Configuration
export const getSystemConfigModulData = (): ModulData => {
  return {
    title: 'PANDUAN KONFIGURASI DAN MAINTENANCE SISTEM',
    subtitle: 'APLIKASI UNIT COST RUMAH SAKIT',
    author: 'MUKHSIN HADI, SE, M.Si',
    credentials: 'CGAA, CPFRM, CSEP, CRP, CPRM, CSCAP, CPABC',
    copyright: '000831709',
    hakCipta: '000831709',
    footer: 'Copyright © 2024 Mukhsin Hadi. Hak Cipta Dilindungi Undang-Undang',
    content: [
      'PENDAHULUAN\n\nPanduan Konfigurasi dan Maintenance Sistem untuk Aplikasi Unit Cost Rumah Sakit memberikan petunjuk lengkap untuk mengelola, memelihara, dan mengoptimalkan sistem secara berkelanjutan. Sistem ini dibangun dengan teknologi modern dan memerlukan pemeliharaan rutin untuk memastikan performa optimal dan keamanan data.\n\nTujuan Panduan:\n• Memberikan panduan konfigurasi sistem yang komprehensif\n• Menetapkan prosedur maintenance rutin yang efektif\n• Menyediakan protokol backup dan recovery yang handal\n• Menetapkan standar monitoring dan alerting\n• Menyediakan panduan troubleshooting yang sistematis\n\nSasaran Pengguna:\n• System Administrator - Administrator sistem\n• Database Administrator - Administrator database\n• IT Support - Tim support teknis\n• Security Officer - Petugas keamanan sistem',
      
      'ARSITEKTUR SISTEM\n\nTechnology Stack:\n\n1. Frontend Layer:\n• React 18 - Framework UI modern\n• TypeScript - Type-safe JavaScript\n• Tailwind CSS - Utility-first CSS framework\n• Vite - Fast build tool dan dev server\n• TanStack Query - Server state management\n\n2. Backend Layer:\n• Supabase - Backend as a Service (BaaS)\n• PostgreSQL - Database relasional\n• Row Level Security (RLS) - Keamanan tingkat baris\n• Edge Functions - Serverless functions\n\n3. Infrastructure Layer:\n• Cloud Hosting - Supabase Cloud\n• CDN - Content Delivery Network\n• SSL/TLS - Enkripsi data transit\n• Auto-scaling - Scaling otomatis\n\nSystem Architecture:\n• Frontend (React) ↔ Backend (Supabase) ↔ Database (PostgreSQL)\n• CDN untuk static assets dan caching\n• Monitoring untuk logs, metrics, dan alerts\n• Backup untuk automated dan point-in-time recovery',
      
      'KONFIGURASI SISTEM\n\n1. Environment Configuration:\nDevelopment Environment:\n• VITE_SUPABASE_URL - URL Supabase development\n• VITE_SUPABASE_ANON_KEY - Anonymous key development\n• VITE_APP_ENV=development\n• VITE_DEBUG_MODE=true\n• VITE_LOG_LEVEL=debug\n\nProduction Environment:\n• VITE_SUPABASE_URL - URL Supabase production\n• VITE_SUPABASE_ANON_KEY - Anonymous key production\n• VITE_APP_ENV=production\n• VITE_DEBUG_MODE=false\n• VITE_LOG_LEVEL=error\n\n2. Database Configuration:\nConnection Pool Settings:\n• max_connections = 200\n• shared_buffers = 256MB\n• effective_cache_size = 1GB\n• maintenance_work_mem = 64MB\n• checkpoint_completion_target = 0.9\n• wal_buffers = 16MB\n\nRow Level Security (RLS) Setup:\n• Enable RLS pada semua tabel\n• Create policies untuk user access\n• Implement role-based access control\n• Setup audit logging untuk security\n\n3. Application Configuration:\nSupabase Client Configuration:\n• Auto refresh token enabled\n• Persistent session management\n• Session detection in URL\n• Realtime events configuration\n• API timeout dan retry settings',
      
      'MAINTENANCE RUTIN\n\n1. Daily Maintenance Tasks:\nSystem Health Check:\n• Check database connectivity\n• Monitor disk space usage\n• Check memory usage\n• Review application logs for errors\n• Verify backup completion\n\nAutomated Tasks:\n• Database Statistics Update - Update statistik database\n• Log Rotation - Rotasi log files\n• Cache Cleanup - Pembersihan cache\n• Performance Metrics - Koleksi metrik performa\n\n2. Weekly Maintenance Tasks:\nDatabase Maintenance:\n• ANALYZE untuk update table statistics\n• VACUUM ANALYZE untuk cleanup\n• Check long-running queries\n• Monitor database size growth\n• Review connection usage\n\nSecurity Updates:\n• Update system packages\n• Check for security vulnerabilities\n• Update application dependencies\n• Check SSL certificate expiry\n• Review access logs\n\n3. Monthly Maintenance Tasks:\nComprehensive System Review:\n• Generate system performance report\n• Database performance analysis\n• Application performance metrics\n• Security audit review\n• Backup verification\n• Capacity planning analysis',
      
      'BACKUP DAN RECOVERY\n\n1. Backup Strategy:\nBackup Types:\n• Full Backup - Backup lengkap seluruh database\n• Incremental Backup - Backup perubahan sejak backup terakhir\n• Differential Backup - Backup perubahan sejak full backup\n• Point-in-Time Recovery - Recovery ke waktu tertentu\n\nAutomated Backup Script:\n• Full database backup dengan pg_dump\n• User data backup terpisah\n• Application files backup dengan tar\n• Cleanup old backups (30 days retention)\n• Backup verification dan integrity check\n\n2. Recovery Procedures:\nFull Database Recovery:\n• Stop application services\n• Drop dan recreate database\n• Restore dari backup file\n• Restart application services\n• Verify recovery success\n\nPoint-in-Time Recovery:\n• Restore base backup\n• Apply WAL files up to target time\n• Configure recovery target\n• Promote database setelah recovery\n\n3. Backup Verification:\nBackup Integrity Check:\n• Test backup file dengan pg_restore --list\n• Verify backup completeness\n• Check backup file timestamps\n• Monitor backup storage usage\n• Generate backup verification report',
      
      'MONITORING DAN ALERTING\n\n1. System Monitoring:\nKey Metrics to Monitor:\n• CPU Usage - Penggunaan CPU\n• Memory Usage - Penggunaan memori\n• Disk I/O - Input/Output disk\n• Network Traffic - Traffic jaringan\n• Database Connections - Koneksi database\n• Response Time - Waktu respons aplikasi\n\nMonitoring Script:\n• CPU usage monitoring\n• Memory usage tracking\n• Disk usage alerts\n• Database connection monitoring\n• Application response time measurement\n\n2. Application Monitoring:\nHealth Check Endpoint:\n• System status indicator\n• Uptime monitoring\n• Environment information\n• Service health status\n• Version information\n\nPerformance Monitoring:\n• API response time tracking\n• Database query performance\n• Memory usage monitoring\n• Error rate tracking\n• User interaction analytics\n\n3. Alerting System:\nAlert Configuration:\n• High CPU Usage (>80%) - 5 minutes - WARNING\n• High Memory Usage (>85%) - 3 minutes - CRITICAL\n• Database Connection Failure - 1 minute - CRITICAL\n• Disk Space Low (>90%) - 10 minutes - WARNING\n\nAlert Handler:\n• Email notifications untuk warnings\n• SMS alerts untuk critical issues\n• Phone calls untuk emergency situations\n• Slack/Teams integration untuk team notifications',
      
      'PERFORMANCE OPTIMIZATION\n\n1. Database Optimization:\nQuery Optimization:\n• Analyze slow queries dengan pg_stat_statements\n• Create indexes untuk frequently queried columns\n• Update table statistics dengan ANALYZE\n• Optimize query execution plans\n• Monitor query performance trends\n\nConnection Pooling:\n• Configure connection pool settings\n• Set maximum connections (20)\n• Configure idle timeout (30 seconds)\n• Set connection timeout (2 seconds)\n• Monitor connection usage\n\n2. Application Optimization:\nCaching Strategy:\n• Redis caching untuk user data\n• API response caching\n• Database query result caching\n• Session data caching\n• Static asset caching\n\nCode Splitting dan Lazy Loading:\n• Lazy loading components\n• Route-based code splitting\n• Dynamic imports untuk large modules\n• Bundle size optimization\n• Tree shaking untuk unused code\n\n3. Frontend Optimization:\nBundle Analysis:\n• Analyze bundle size dengan vite-bundle-analyzer\n• Optimize images dengan imagemin\n• Compress assets dengan gzip\n• Implement service worker caching\n• Use CDN untuk static assets\n\nPerformance Monitoring:\n• Track page load times\n• Monitor user interactions\n• Track JavaScript errors\n• Measure Core Web Vitals\n• Monitor resource loading times',
      
      'SECURITY MAINTENANCE\n\n1. Security Updates:\nAutomated Security Scanning:\n• Check vulnerable packages dengan npm audit\n• Scan for malware dengan clamscan\n• Check file permissions\n• Look for suspicious files\n• Review access logs\n\nSSL Certificate Management:\n• Check certificate expiry dates\n• Automated renewal dengan certbot\n• Monitor certificate chain validity\n• Configure certificate alerts\n• Backup certificate files\n\n2. Access Control:\nRegular Access Review:\n• Review user access permissions\n• Check inactive user accounts\n• Audit role assignments\n• Verify permission changes\n• Monitor privileged access\n\nSecurity Monitoring:\n• Monitor failed login attempts\n• Track suspicious IP addresses\n• Check for unusual file modifications\n• Monitor privilege escalation attempts\n• Review security event logs\n\n3. Security Monitoring:\nIntrusion Detection:\n• Monitor failed login attempts\n• Track suspicious IP addresses\n• Check for unusual file modifications\n• Monitor system file integrity\n• Review network traffic patterns\n\nThreat Response:\n• Automated account locking\n• IP address blocking\n• Alert escalation procedures\n• Incident response workflow\n• Recovery procedures',
      
      'TROUBLESHOOTING\n\n1. Common Issues:\nDatabase Connection Issues:\n• Check database service status\n• Verify database connectivity\n• Check connection limits\n• Review database logs\n• Monitor connection pool usage\n\nApplication Performance Issues:\n• Check application processes\n• Monitor memory usage\n• Check disk I/O performance\n• Review application logs\n• Analyze response times\n\n2. Error Handling:\nApplication Error Handling:\n• Global error handler implementation\n• Database error handling\n• API error responses\n• Client-side error tracking\n• Error logging dan reporting\n\nRecovery Procedures:\n• System recovery checklist\n• Service restart procedures\n• Database recovery steps\n• Application recovery workflow\n• Data integrity verification\n\n3. Recovery Procedures:\nSystem Recovery Checklist:\n• Check system resources (CPU, memory, disk)\n• Verify service status (postgresql, nginx, app)\n• Review application logs\n• Check database status\n• Test application endpoints\n\nDisaster Recovery:\n• Recovery Time Objectives (RTO)\n• Recovery Point Objectives (RPO)\n• Full system recovery procedures\n• Business continuity planning\n• High availability setup',
      
      'DISASTER RECOVERY\n\n1. Disaster Recovery Plan:\nRecovery Time Objectives (RTO):\n• Critical Systems - 4 hours\n• Important Systems - 8 hours\n• Non-Critical Systems - 24 hours\n\nRecovery Point Objectives (RPO):\n• Database - 15 minutes\n• Application Data - 1 hour\n• Configuration Files - 4 hours\n\n2. Backup and Recovery Procedures:\nFull System Recovery:\n• Prepare recovery environment\n• Restore database dari backup\n• Restore application files\n• Restore configuration files\n• Restart services\n• Verify recovery success\n\nHigh Availability Setup:\n• Load balancing configuration\n• Database replication\n• Application clustering\n• Failover procedures\n• Health check monitoring\n\n3. Business Continuity:\nHigh Availability Configuration:\n• Docker Compose untuk HA setup\n• Multiple application instances\n• Database replication\n• Redis clustering\n• Nginx load balancing\n\nLoad Balancing:\n• Upstream server configuration\n• Health check endpoints\n• SSL termination\n• Request routing\n• Failover handling'
    ]
  };
};

// Modul Pelatihan - Training Module
export const getModulPelatihanData = (): ModulData => {
  return {
    title: 'MODUL PELATIHAN KOMPREHENSIF',
    subtitle: 'PANDUAN LENGKAP PENGGUNAAN APLIKASI UNIT COST RUMAH SAKIT',
    author: 'MUKHSIN HADI, SE, M.Si',
    credentials: 'CGAA, CPFRM, CSEP, CRP, CPRM, CSCAP, CPABC',
    copyright: '000831709',
    hakCipta: '000831709',
    footer: 'Copyright © 2024 Mukhsin Hadi. Hak Cipta Dilindungi Undang-Undang',
    content: [
      'PENGENALAN APLIKASI\n\nSelamat datang di Modul Pelatihan Komprehensif Aplikasi Unit Cost Rumah Sakit!\n\nApa itu Aplikasi Unit Cost RS?\nAplikasi Unit Cost Rumah Sakit adalah sistem informasi terintegrasi yang dirancang untuk menghitung dan mengelola biaya satuan pelayanan di rumah sakit menggunakan metodologi Activity-Based Costing (ABC). Sistem ini membantu manajemen dalam menetapkan tarif yang tepat berdasarkan biaya riil operasional.\n\nTujuan Modul Pelatihan:\n• Memahami konsep dasar aplikasi dan metodologi ABC\n• Menguasai navigasi dan fitur utama aplikasi\n• Mampu mengelola data master dan operasional\n• Dapat melakukan kalkulasi unit cost dengan tepat\n• Memahami distribusi biaya dan pembuatan laporan\n• Menguasai manajemen user dan troubleshooting\n\nSiapa yang Membutuhkan Pelatihan Ini?\n• Staf Keuangan - Mengelola biaya dan pendapatan\n• Manajer Unit - Monitoring performa unit kerja\n• Operator Data - Input dan validasi data operasional\n• Administrator Sistem - Manajemen user dan sistem\n• Management - Analisis dan pengambilan keputusan\n\nMetodologi Pelatihan:\nPelatihan ini menggunakan pendekatan hands-on dengan langkah-langkah praktis dari awal hingga akhir. Setiap bab dilengkapi dengan contoh kasus, screenshot, dan tips praktis untuk memudahkan pembelajaran.',
      
      'PERSIAPAN DAN LOGIN\n\nSebelum Memulai:\nPastikan Anda memiliki hal-hal berikut:\n• Akses internet yang stabil\n• Browser modern (Chrome, Firefox, Edge, atau Safari versi terbaru)\n• Kredensial login (email dan password) yang telah diberikan oleh administrator\n• Pemahaman dasar tentang perhitungan biaya rumah sakit\n\nMengakses Aplikasi:\n1. Buka browser web favorit Anda\n2. Ketik alamat URL aplikasi di address bar\n3. Tekan Enter untuk membuka halaman login\n\nProses Login:\n\nLangkah 1 - Masukkan Email:\n• Pada kolom "Email", masukkan alamat email yang telah terdaftar\n• Pastikan email ditulis dengan benar (huruf kecil semua)\n• Contoh: admin@rumahsakit.com\n\nLangkah 2 - Masukkan Password:\n• Pada kolom "Password", ketik password Anda\n• Password bersifat case-sensitive (huruf besar/kecil berpengaruh)\n• Gunakan fitur "Show Password" jika perlu memverifikasi\n\nLangkah 3 - Klik Tombol Login:\n• Klik tombol "Masuk" atau "Login"\n• Tunggu beberapa saat hingga sistem memverifikasi\n• Anda akan diarahkan ke Dashboard utama\n\nTroubleshooting Login:\n• Email/Password Salah - Periksa kembali kredensial Anda, pastikan Caps Lock tidak aktif\n• Lupa Password - Gunakan fitur "Lupa Password" untuk reset\n• Akun Terkunci - Hubungi administrator sistem untuk unlock\n• Koneksi Timeout - Periksa koneksi internet Anda\n\nKeamanan Login:\n• Jangan pernah share password Anda dengan orang lain\n• Gunakan password yang kuat (minimal 8 karakter, kombinasi huruf, angka, simbol)\n• Logout setelah selesai menggunakan aplikasi\n• Jangan simpan password di browser publik\n• Ganti password secara berkala (setiap 3 bulan)',
      
      'NAVIGASI DAN INTERFACE\n\nTampilan Utama Dashboard:\nSetelah login berhasil, Anda akan melihat Dashboard utama dengan komponen berikut:\n\n1. Header/Top Bar:\n• Logo aplikasi dan nama rumah sakit\n• Notifikasi sistem\n• Profil user dan menu logout\n• Breadcrumb navigation\n\n2. Sidebar Menu (Kiri):\n• Dashboard - Halaman utama dengan ringkasan\n• Data Master - Menu untuk data referensi\n• Data Operasional - Menu untuk data transaksi\n• Unit Penunjang - Kalkulasi unit penunjang\n• Unit Keperawatan - Kalkulasi unit keperawatan\n• Unit Pelayanan - Kalkulasi unit pelayanan\n• Unit Diklat - Kalkulasi unit diklat\n• Rekapitulasi Unit Cost - Ringkasan biaya\n• Skenario Tarif - Simulasi tarif\n• Distribusi Biaya - Alokasi biaya overhead\n• Cost Recovery - Analisis pencapaian target\n• Budgeting BHP - Budget barang habis pakai\n• Produk Layanan - Katalog produk\n• Manajemen Akses - Kelola user (Super Admin only)\n• Modul Teknis - Dokumentasi sistem\n\n3. Main Content Area:\n• Area utama untuk menampilkan konten\n• Tabel data dengan fitur search, filter, sort\n• Form input dan edit data\n• Grafik dan chart untuk visualisasi\n\n4. Footer:\n• Copyright information\n• Version aplikasi\n• Support contact\n\nMenggunakan Sidebar Menu:\n\nMenu Dropdown:\n• Klik pada menu dengan icon panah untuk expand\n• Akan muncul sub-menu di bawahnya\n• Klik sub-menu untuk membuka halaman terkait\n• Menu akan auto-collapse setelah navigasi\n\nSearch & Filter:\n• Gunakan search box untuk mencari data spesifik\n• Filter berdasarkan periode, unit, atau kategori\n• Sort ascending/descending dengan klik header kolom\n• Export data ke Excel atau PDF\n\nShortcut Keyboard:\n• Ctrl + S - Save/Simpan data\n• Ctrl + F - Search/Cari data\n• Esc - Close dialog/modal\n• Tab - Navigate antar field input',
      
      'MANAJEMEN DATA MASTER\n\nApa itu Data Master?\nData Master adalah data referensi atau data induk yang menjadi dasar untuk transaksi dan perhitungan dalam sistem. Data master bersifat relatif statis dan jarang berubah.\n\nJenis-jenis Data Master:\n\n1. DATA UNIT KERJA\nUnit kerja adalah struktur organisasi rumah sakit yang menjadi cost center.\n\nCara Mengelola Data Unit Kerja:\n• Akses Menu: Data Master → Data Unit Kerja\n• Klik "Tambah Unit Kerja" untuk entry baru\n• Isi form dengan informasi berikut:\n  - Kode Unit: Kode unik unit kerja (contoh: LAB-001)\n  - Nama Unit: Nama lengkap unit (contoh: Laboratorium Klinik)\n  - Jenis Unit: Pilih kategori (Pelayanan, Penunjang, Keperawatan, dll)\n  - Parent Unit: Unit atasan (jika ada hierarki)\n  - Status: Aktif/Non-aktif\n• Klik "Simpan" untuk menyimpan data\n\nTips Data Unit Kerja:\n• Gunakan kode yang konsisten dan mudah diingat\n• Tentukan hierarki unit dengan jelas\n• Review dan update status unit secara berkala\n\n2. DATA BARANG\nKatalog barang habis pakai yang digunakan dalam operasional rumah sakit.\n\nCara Mengelola Data Barang:\n• Akses Menu: Data Master → Barang Farmasi\n• Klik "Tambah Barang" untuk entry baru\n• Isi form dengan informasi:\n  - Kode Barang: Kode unik barang (contoh: BRG-001)\n  - Nama Barang: Nama lengkap barang\n  - Satuan: Unit of measure (box, strip, botol, dll)\n  - Harga Satuan: Harga per satuan\n  - Kategori: Klasifikasi barang\n• Import data barang dari Excel jika volume besar\n• Klik "Simpan" untuk menyimpan\n\n3. DATA BARANG GIZI\nKatalog bahan makanan dengan informasi nutrisi.\n\nCara Mengelola Data Barang Gizi:\n• Akses Menu: Data Master → Barang Gizi\n• Isi informasi barang gizi:\n  - Kode dan Nama Barang\n  - Kandungan Kalori\n  - Kandungan Protein\n  - Kandungan Karbohidrat\n  - Kandungan Lemak\n  - Harga per satuan\n\n4. DATA KAMAR\nData ruang perawatan dan kelas kamar.\n\nCara Mengelola Data Kamar:\n• Akses Menu: Data Master → Data Kamar\n• Isi informasi:\n  - Kode Kamar: Identifikasi unik kamar\n  - Nama/Nomor Kamar\n  - Kelas Kamar: VIP, Kelas 1, 2, 3\n  - Kapasitas: Jumlah bed\n  - Tarif Kamar: Tarif per hari\n  - Unit Kerja: Unit yang mengelola\n\n5. DATA TINDAKAN\nKatalog tindakan medis yang tersedia.\n\nJenis Tindakan:\n• Tindakan Umum - Tindakan rawat jalan\n• Tindakan Laboratorium - Pemeriksaan lab\n• Tindakan Radiologi - Pemeriksaan imaging\n• Tindakan Operatif - Prosedur bedah\n• Tindakan Cathlab - Prosedur jantung\n• Tindakan BDRS - Hemodialisis\n\nCara Mengelola Data Tindakan:\n• Pilih jenis tindakan yang sesuai\n• Isi kode, nama, dan tarif tindakan\n• Tetapkan unit kerja yang bertanggung jawab\n• Set standar waktu untuk tindakan operatif\n\nBest Practices Data Master:\n• Lakukan validasi data sebelum save\n• Gunakan naming convention yang konsisten\n• Backup data master secara berkala\n• Review dan cleanup data yang tidak aktif\n• Dokumentasikan perubahan data master',
      
      'DATA OPERASIONAL\n\nApa itu Data Operasional?\nData operasional adalah data transaksi harian yang mencatat aktivitas dan kinerja unit kerja. Data ini bersifat dinamis dan ter-update secara berkala.\n\nJenis Data Operasional:\n\n1. DATA PENDAPATAN\nData pendapatan yang diterima oleh setiap unit kerja dalam periode tertentu.\n\nCara Input Data Pendapatan:\n• Akses Menu: Data Operasional → Data Pendapatan\n• Klik "Tambah Data Pendapatan"\n• Isi form dengan informasi:\n  - Periode: Pilih bulan dan tahun\n  - Unit Kerja: Pilih unit kerja terkait\n  - Jenis Pendapatan: Kategori pendapatan (Pelayanan, Penunjang, dll)\n  - Jumlah Pendapatan: Total rupiah pendapatan\n  - Jumlah Volume: Total volume layanan (jumlah pasien, tindakan, dll)\n• Klik "Simpan" untuk menyimpan data\n\nTips Input Pendapatan:\n• Pastikan periode sudah benar\n• Verifikasi jumlah pendapatan dengan laporan keuangan\n• Input volume layanan dengan akurat untuk perhitungan unit cost\n• Review data secara berkala untuk mendeteksi anomali\n\n2. DATA BIAYA\nData biaya yang dikeluarkan oleh setiap unit kerja.\n\nKategori Biaya:\n• Biaya Tenaga Kerja - Gaji, tunjangan, insentif\n• Biaya Bahan Habis Pakai - Obat, alat medis habis pakai\n• Biaya Pemeliharaan - Maintenance gedung dan peralatan\n• Biaya Utilitas - Listrik, air, telepon\n• Biaya Penyusutan - Depresiasi aset tetap\n• Biaya Overhead - Biaya administrasi dan umum\n\nCara Input Data Biaya:\n• Akses Menu: Data Operasional → Data Biaya\n• Klik "Tambah Data Biaya"\n• Isi form:\n  - Periode: Bulan dan tahun\n  - Unit Kerja: Unit yang mengeluarkan biaya\n  - Jenis Biaya: Kategori biaya\n  - Jumlah Biaya: Total rupiah\n  - Keterangan: Deskripsi tambahan (opsional)\n• Klik "Simpan"\n\nTips Input Biaya:\n• Klasifikasikan biaya dengan tepat\n• Pisahkan biaya langsung dan tidak langsung\n• Alokasikan biaya ke unit yang tepat\n• Dokumentasikan dasar perhitungan biaya\n\n3. DATA AKOMODASI INAP\nData occupancy dan pemanfaatan kamar inap.\n\nCara Input Data Akomodasi:\n• Akses Menu: Unit Keperawatan → Data Akomodasi Inap\n• Input data untuk setiap kelas kamar:\n  - Kamar: Pilih kamar/kelas\n  - Periode: Bulan dan tahun\n  - Jumlah Hari Rawat: Total hari rawat pasien\n  - Bed Days Available: Kapasitas bed × hari dalam bulan\n  - Occupancy Rate: Persentase hunian (auto-calculated)\n• Sistem akan menghitung BOR (Bed Occupancy Rate) otomatis\n\nImport Data dari Excel:\nUntuk mempercepat input data operasional:\n• Download template Excel dari sistem\n• Isi data sesuai format template\n• Upload file Excel ke sistem\n• Sistem akan validasi dan import data\n• Review hasil import dan perbaiki jika ada error\n\nValidasi Data Operasional:\n• Cek konsistensi data antar periode\n• Bandingkan dengan laporan keuangan resmi\n• Verifikasi total pendapatan = sum per unit\n• Verifikasi total biaya = sum per kategori\n• Deteksi outlier atau data yang tidak wajar',
      
      'KALKULASI UNIT COST\n\nApa itu Unit Cost?\nUnit Cost adalah biaya per satuan layanan yang dihitung menggunakan metodologi Activity-Based Costing (ABC). Unit cost membantu rumah sakit menentukan tarif yang tepat dan menganalisis efisiensi operasional.\n\nMetodologi Activity-Based Costing (ABC):\nABC mengalokasikan biaya berdasarkan aktivitas yang sebenarnya dilakukan untuk menghasilkan layanan. Prinsip dasar ABC:\n• Cost Objects - Layanan yang akan dihitung biayanya\n• Activities - Aktivitas yang mendukung layanan\n• Resources - Sumber daya yang dikonsumsi\n• Cost Drivers - Faktor penyebab biaya\n\nJenis Kalkulasi Unit Cost:\n\n1. KALKULASI BIAYA GIZI\nMenghitung biaya per pori makanan pasien.\n\nCara Melakukan Kalkulasi:\n• Akses Menu: Unit Penunjang → Kalkulasi Biaya Gizi\n• Klik "Kalkulasi Baru"\n• Pilih periode kalkulasi\n• Sistem akan mengambil data:\n  - Total biaya bahan gizi\n  - Total biaya tenaga gizi\n  - Total biaya overhead unit gizi\n  - Total jumlah pori yang diproduksi\n• Formula: Unit Cost Gizi = Total Biaya / Total Pori\n• Review hasil kalkulasi\n• Klik "Simpan Kalkulasi"\n\nKomponen Biaya Gizi:\n• Biaya Bahan Baku - Beras, lauk, sayur, buah\n• Biaya Tenaga - Gaji ahli gizi dan cook\n• Biaya Utilitas - Gas, listrik, air\n• Biaya Overhead - Penyusutan peralatan, maintenance\n\n2. KALKULASI TINDAKAN RAWAT JALAN\nMenghitung biaya per tindakan di poliklinik.\n\nCara Kalkulasi:\n• Akses Menu: Unit Pelayanan → Kalkulasi Tindakan Rawat Jalan\n• Pilih tindakan yang akan dikalkulasi\n• Input atau verifikasi data:\n  - Biaya Bahan Habis Pakai\n  - Biaya Tenaga Medis (dokter, perawat)\n  - Biaya Overhead (fasilitas, utilitas)\n  - Volume tindakan dalam periode\n• Formula: Unit Cost = (Biaya Bahan + Biaya Tenaga + Overhead) / Volume\n• Bandingkan dengan tarif yang berlaku\n• Analisis margin profit/loss\n\n3. KALKULASI BIAYA LABORATORIUM\nMenghitung biaya per pemeriksaan lab.\n\nKomponen Biaya Lab:\n• Biaya Reagen - Bahan kimia untuk pemeriksaan\n• Biaya Alat - Penyusutan dan maintenance alat lab\n• Biaya Tenaga - Analis dan teknisi lab\n• Biaya QC - Quality control dan kalibrasi\n\nCara Kalkulasi Lab:\n• Pilih jenis pemeriksaan lab\n• Input biaya reagen per pemeriksaan\n• Alokasi biaya alat berdasarkan usage time\n• Alokasi biaya tenaga berdasarkan waktu pemeriksaan\n• Sistem akan menghitung unit cost otomatis\n\n4. KALKULASI BIAYA RADIOLOGI\nMenghitung biaya per pemeriksaan imaging.\n\nKomponen Biaya Radiologi:\n• Biaya Film dan Kontras\n• Biaya Penyusutan Alat (X-Ray, CT-Scan, MRI)\n• Biaya Tenaga Radiografer\n• Biaya Maintenance Alat\n• Biaya Utilitas (listrik tinggi untuk alat imaging)\n\n5. KALKULASI BIAYA OPERATIF\nMenghitung biaya tindakan pembedahan.\n\nKomponen Biaya Operasi:\n• Biaya Instrumen Operasi\n• Biaya Bahan Habis Pakai (benang, implant, dll)\n• Biaya Tenaga (dokter bedah, anestesi, perawat)\n• Biaya Ruang Operasi (per jam)\n• Biaya Sterilisasi\n\nCara Kalkulasi:\n• Tentukan standar durasi operasi\n• Hitung biaya fasilitas kamar operasi per jam\n• Alokasi biaya tenaga berdasarkan waktu\n• Sum semua komponen biaya\n• Bagi dengan jumlah tindakan\n\n6. KALKULASI TINDAKAN INAP\nMenghitung biaya tindakan untuk pasien rawat inap.\n\nCara Kalkulasi:\n• Akses Menu: Unit Keperawatan → Kalkulasi Tindakan Inap\n• Pilih tindakan keperawatan\n• Input biaya per tindakan:\n  - Bahan medis yang digunakan\n  - Waktu perawat untuk tindakan\n  - Overhead unit keperawatan\n• Kalkulasi untuk berbagai kelas kamar\n• Sistem akan generate tarif per kelas\n\n7. KALKULASI BIAYA AKOMODASI\nMenghitung biaya per hari rawat inap.\n\nCara Kalkulasi:\n• Akses Menu: Unit Keperawatan → Kalkulasi Biaya Kelas Akomodasi\n• Sistem akan kalkulasi:\n  - Total biaya unit keperawatan\n  - Total hari rawat per kelas\n  - Alokasi biaya gizi per hari\n  - Alokasi biaya laundry dan housekeeping\n• Formula: Biaya per Hari = Total Biaya Alokasi / Total Hari Rawat\n• Review untuk setiap kelas kamar\n\nBest Practices Kalkulasi:\n• Lakukan kalkulasi setiap bulan secara konsisten\n• Verifikasi input data sebelum kalkulasi\n• Bandingkan hasil dengan periode sebelumnya\n• Analisis varians yang signifikan\n• Dokumentasikan asumsi dan metodologi\n• Update tarif berdasarkan hasil kalkulasi',
      
      'DISTRIBUSI BIAYA\n\nApa itu Distribusi Biaya?\nDistribusi biaya adalah proses mengalokasikan biaya overhead dari unit-unit support (penunjang) ke unit-unit produksi (pelayanan) berdasarkan basis alokasi tertentu. Proses ini penting untuk mendapatkan unit cost yang akurat.\n\nTujuan Distribusi Biaya:\n• Mengalokasikan biaya tidak langsung ke unit yang menggunakan\n• Mendapatkan full cost per unit layanan\n• Menghitung tarif yang mencerminkan biaya sesungguhnya\n• Menganalisis profitabilitas per unit\n\nJenis Distribusi Biaya:\n\n1. DISTRIBUSI BIAYA PERTAMA (FIRST STEP ALLOCATION)\nMengalokasikan biaya dari unit support ke unit produksi.\n\nUnit Support (Penunjang):\n• Unit Administrasi dan Manajemen\n• Unit Keuangan\n• Unit SDM dan Diklat\n• Unit IT dan Sistem Informasi\n• Unit Pemeliharaan dan Teknik\n• Unit Laundry dan Housekeeping\n• Unit Keamanan\n• Unit IPSRS (Instalasi Pemeliharaan Sarana RS)\n\nUnit Produksi (Pelayanan):\n• Unit Rawat Jalan\n• Unit Rawat Inap\n• Unit Gawat Darurat\n• Unit Operasi\n• Unit ICU/NICU/PICU\n• Unit Laboratorium\n• Unit Radiologi\n• Unit Farmasi\n• Unit Gizi\n\nBasis Alokasi yang Digunakan:\n• Jumlah Bed - Untuk alokasi ke unit rawat inap\n• Jumlah Volume Layanan - Untuk unit dengan volume jelas\n• Direct Cost - Untuk alokasi proporsional\n• Square Meter - Untuk biaya pemeliharaan gedung\n• Jumlah Pegawai - Untuk biaya SDM dan diklat\n• Jumlah Transaksi - Untuk biaya administrasi\n\nCara Melakukan Distribusi Biaya Pertama:\n• Akses Menu: Distribusi Biaya → Distribusi Biaya Pertama\n• Klik "Proses Distribusi Baru"\n• Pilih periode distribusi\n• Review unit support dan unit produksi\n• Pilih basis alokasi untuk setiap unit support:\n  - Unit Administrasi → Basis: Direct Cost\n  - Unit Pemeliharaan → Basis: Square Meter\n  - Unit Laundry → Basis: Jumlah Bed\n  - Unit IT → Basis: Jumlah User\n• Klik "Hitung Distribusi"\n• Sistem akan:\n  - Mengambil total biaya unit support\n  - Menghitung basis alokasi per unit produksi\n  - Menghitung persentase alokasi\n  - Mendistribusikan biaya\n• Review hasil distribusi\n• Klik "Simpan Distribusi"\n\nContoh Perhitungan:\nUnit Laundry memiliki total biaya Rp 50.000.000\nBasis alokasi: Jumlah Bed\n• Unit Rawat Inap Kelas 3: 30 bed (30%)\n• Unit Rawat Inap Kelas 2: 20 bed (20%)\n• Unit Rawat Inap Kelas 1: 15 bed (15%)\n• Unit Rawat Inap VIP: 10 bed (10%)\n• Unit ICU: 15 bed (15%)\n• Unit NICU: 10 bed (10%)\nTotal: 100 bed\n\nDistribusi:\n• Kelas 3: Rp 50 juta × 30% = Rp 15 juta\n• Kelas 2: Rp 50 juta × 20% = Rp 10 juta\n• Kelas 1: Rp 50 juta × 15% = Rp 7,5 juta\n• VIP: Rp 50 juta × 10% = Rp 5 juta\n• ICU: Rp 50 juta × 15% = Rp 7,5 juta\n• NICU: Rp 50 juta × 10% = Rp 5 juta\n\n2. DISTRIBUSI BIAYA KEDUA (SECOND STEP ALLOCATION)\nRedistribusi biaya antar unit produksi yang saling menggunakan layanan.\n\nCara Melakukan Distribusi Biaya Kedua:\n• Akses Menu: Distribusi Biaya → Distribusi Biaya Kedua\n• Identifikasi unit yang saling menggunakan layanan:\n  - Lab digunakan oleh Rawat Jalan, Rawat Inap, IGD\n  - Radiologi digunakan oleh Rawat Jalan, Rawat Inap, IGD\n  - Farmasi digunakan oleh semua unit klinis\n• Tentukan basis alokasi antar unit\n• Proses redistribusi\n• Review dan simpan\n\n3. DISTRIBUSI BIAYA REKAP\nRingkasan total biaya setelah distribusi.\n\nCara Melihat Rekap:\n• Akses Menu: Distribusi Biaya → Distribusi Biaya Rekap\n• Pilih periode\n• Sistem akan menampilkan:\n  - Biaya Langsung per unit\n  - Biaya Alokasi Pertama\n  - Biaya Alokasi Kedua\n  - Total Biaya Penuh (Full Cost)\n• Export ke Excel untuk analisis lebih lanjut\n\nDasar Alokasi Biaya Gizi:\nKhusus untuk distribusi biaya gizi ke unit rawat inap:\n• Akses Menu: Unit Keperawatan → Dasar Alokasi Biaya Gizi\n• Input jumlah bed per unit rawat inap\n• Sistem akan menghitung persentase alokasi\n• Distribusi otomatis ke setiap unit\n\nBest Practices Distribusi Biaya:\n• Lakukan distribusi setiap bulan setelah semua data complete\n• Gunakan basis alokasi yang paling relevan\n• Dokumentasikan metode dan basis yang digunakan\n• Review hasil distribusi untuk mendeteksi anomali\n• Konsisten menggunakan metode yang sama\n• Update basis alokasi jika ada perubahan signifikan',
      
      'SKENARIO TARIF\n\nApa itu Skenario Tarif?\nSkenario Tarif adalah fitur untuk melakukan simulasi perubahan tarif dan melihat dampaknya terhadap pendapatan, profitabilitas, dan cost recovery. Fitur ini membantu manajemen dalam pengambilan keputusan penetapan tarif.\n\nTujuan Skenario Tarif:\n• Mensimulasikan dampak perubahan tarif\n• Menganalisis profitabilitas per layanan\n• Mengevaluasi kebijakan tarif\n• Membandingkan berbagai alternatif tarif\n• Mendukung penetapan tarif yang optimal\n\nJenis Skenario Tarif:\n\n1. SKENARIO TARIF TINDAKAN\nSimulasi tarif untuk tindakan medis.\n\nCara Membuat Skenario:\n• Akses Menu: Skenario Tarif → Skenario Tarif Tindakan\n• Klik "Buat Skenario Baru"\n• Isi informasi skenario:\n  - Nama Skenario: Contoh "Skenario Kenaikan 10%"\n  - Deskripsi: Penjelasan singkat skenario\n  - Periode Simulasi: Pilih periode\n• Pilih tindakan yang akan disimulasikan\n• Input tarif yang akan diuji:\n  - Tarif Saat Ini: Tarif yang berlaku\n  - Unit Cost: Biaya per tindakan (dari kalkulasi)\n  - Tarif Usulan: Tarif baru yang akan disimulasi\n  - Estimasi Volume: Proyeksi jumlah tindakan\n• Sistem akan menghitung:\n  - Pendapatan Proyeksi = Tarif Usulan × Volume\n  - Total Biaya = Unit Cost × Volume\n  - Profit/Loss = Pendapatan - Biaya\n  - Margin = (Profit / Pendapatan) × 100%\n  - Cost Recovery Rate = (Pendapatan / Biaya) × 100%\n• Review hasil simulasi\n• Bandingkan dengan skenario lain\n• Export untuk presentasi manajemen\n\nContoh Analisis Skenario:\nTindakan: Pemeriksaan CT-Scan Kepala\n• Unit Cost: Rp 800.000\n• Tarif Saat Ini: Rp 850.000\n• Estimasi Volume: 100 tindakan/bulan\n\nSkenario 1 - Maintain (Tarif Tetap):\n• Tarif: Rp 850.000\n• Pendapatan: Rp 85.000.000\n• Biaya: Rp 80.000.000\n• Profit: Rp 5.000.000\n• Margin: 5,88%\n• Cost Recovery: 106,25%\n\nSkenario 2 - Kenaikan 10%:\n• Tarif: Rp 935.000\n• Pendapatan: Rp 93.500.000\n• Biaya: Rp 80.000.000\n• Profit: Rp 13.500.000\n• Margin: 14,44%\n• Cost Recovery: 116,88%\n\nSkenario 3 - Kenaikan 20%:\n• Tarif: Rp 1.020.000\n• Pendapatan: Rp 102.000.000\n• Biaya: Rp 80.000.000\n• Profit: Rp 22.000.000\n• Margin: 21,57%\n• Cost Recovery: 127,50%\n\nAnalisis:\nSkenario 3 memberikan margin terbaik namun perlu mempertimbangkan daya beli pasien dan kompetitor.\n\n2. SKENARIO TARIF AKOMODASI\nSimulasi tarif kamar rawat inap.\n\nCara Membuat Skenario:\n• Akses Menu: Skenario Tarif → Skenario Tarif Akomodasi\n• Pilih kelas kamar yang akan disimulasikan\n• Input data:\n  - Unit Cost per Hari: Dari kalkulasi biaya akomodasi\n  - Tarif Saat Ini: Tarif yang berlaku\n  - Tarif Usulan: Tarif baru\n  - Estimasi Hari Rawat: Proyeksi bed days\n  - Estimasi BOR: Bed Occupancy Rate\n• Sistem menghitung impact per kelas kamar\n• Analisis total impact untuk seluruh rumah sakit\n\n3. SKENARIO TARIF VISIT & KONSULTASI\nSimulasi tarif visite dokter dan konsultasi.\n\nKomponen Tarif Visit:\n• Visit Dokter Spesialis\n• Visit Dokter Umum\n• Konsultasi Gizi\n• Konsultasi Farmasi\n• Konsultasi Psikologi\n\nCara Simulasi:\n• Input tarif visit saat ini dan usulan\n• Estimasi frekuensi visit per hari\n• Kalkulasi impact revenue\n• Bandingkan dengan standar pelayanan minimal\n\nMenganalisis Hasil Skenario:\n\n1. Analisis Profitabilitas:\n• Identifikasi layanan yang loss/profit\n• Tentukan layanan yang perlu penyesuaian tarif\n• Prioritaskan layanan dengan volume tinggi\n\n2. Analisis Cost Recovery:\n• Target: Minimal 100% untuk break-even\n• Good: 110-125% untuk sustainability\n• Excellent: >125% untuk investasi\n\n3. Analisis Sensitivitas:\n• Bagaimana jika volume turun 10%?\n• Bagaimana jika cost naik 15%?\n• Titik impas (break-even point)\n\n4. Analisis Kompetitor:\n• Bandingkan tarif dengan RS sejenis\n• Pertimbangkan positioning rumah sakit\n• Evaluasi value proposition\n\nMembuat Keputusan Tarif:\n• Pertimbangkan hasil analisis unit cost\n• Evaluasi daya beli target market\n• Analisis regulasi (tarif INA-CBG, dll)\n• Diskusi dengan stakeholder\n• Dokumentasikan keputusan dan rasionalnya\n• Implementasi bertahap jika perlu\n• Monitor dampak setelah implementasi',
      
      'LAPORAN DAN ANALISIS\n\nSistem menyediakan berbagai laporan untuk monitoring, evaluasi, dan pengambilan keputusan. Setiap laporan dapat diexport ke Excel atau PDF untuk analisis lebih lanjut.\n\nJenis-jenis Laporan:\n\n1. REKAPITULASI UNIT COST\nLaporan ringkasan unit cost untuk semua unit kerja.\n\nCara Mengakses:\n• Akses Menu: Rekapitulasi Unit Cost\n• Pilih periode laporan\n• Sistem akan menampilkan tabel dengan kolom:\n  - Kode dan Nama Unit\n  - Total Pendapatan\n  - Total Biaya Langsung\n  - Total Biaya Alokasi\n  - Total Biaya Penuh\n  - Total Volume Layanan\n  - Unit Cost (Biaya/Volume)\n  - Tarif Rata-rata\n  - Cost Recovery Rate\n  - Profit/Loss\n• Filter berdasarkan jenis unit\n• Sort berdasarkan kolom tertentu\n• Export ke Excel untuk analisis pivot\n\nAnalisis Rekapitulasi:\n• Identifikasi unit dengan cost recovery rendah\n• Bandingkan unit cost antar periode\n• Analisis trend unit cost\n• Deteksi anomali atau outlier\n\n2. COST RECOVERY ANALYSIS\nAnalisis pencapaian target pendapatan vs realisasi.\n\nMetrik Cost Recovery:\n• Recovery Rate = Realisasi Pendapatan / Target × 100%\n• Status Indicator:\n  - Excellent: ≥ 100% (hijau)\n  - Good: ≥ 80% (kuning)\n  - Fair: ≥ 60% (orange)\n  - Poor: < 60% (merah)\n\nCara Mengakses:\n• Akses Menu: Cost Recovery\n• Pilih periode dan unit kerja\n• Review dashboard dengan:\n  - Gauge chart cost recovery rate\n  - Bar chart perbandingan target vs realisasi\n  - Trend chart recovery rate bulanan\n  - Tabel detail per unit\n• Drill-down ke unit spesifik untuk analisis mendalam\n• Export report untuk review manajemen\n\n3. BUDGETING BHP (BARANG HABIS PAKAI)\nMonitoring budget vs realisasi penggunaan BHP.\n\nCara Mengakses:\n• Akses Menu: Budgeting BHP\n• Pilih periode dan kategori BHP\n• Review:\n  - Budget Awal yang dialokasikan\n  - Realisasi Penggunaan\n  - Variance (Selisih)\n  - Variance % = (Realisasi - Budget) / Budget × 100%\n  - Status: Over Budget atau Under Budget\n• Analisis penyebab variance yang signifikan\n• Adjustment budget untuk periode berikutnya\n\n4. PRODUK LAYANAN\nKatalog produk layanan dengan analisis profitabilitas.\n\nCara Mengakses:\n• Akses Menu: Produk Layanan\n• Review katalog layanan dengan informasi:\n  - Kode dan Nama Produk\n  - Unit Cost\n  - Tarif Jual\n  - Margin Profit Rp dan %\n  - Volume Bulanan\n  - Total Revenue\n  - Total Profit\n• Sortir berdasarkan profitabilitas\n• Identifikasi:\n  - Top Profit Products\n  - High Volume Products\n  - Loss-Making Products\n• Buat strategi untuk setiap kategori produk\n\n5. LAPORAN DISTRIBUSI BIAYA\nDetail alokasi biaya overhead.\n\nCara Mengakses:\n• Akses Menu: Distribusi Biaya → Distribusi Biaya Rekap\n• Pilih periode\n• Review matriks distribusi:\n  - Baris: Unit Pengirim (support units)\n  - Kolom: Unit Penerima (production units)\n  - Sel: Jumlah biaya yang dialokasikan\n• Analisis:\n  - Unit mana yang menerima alokasi terbesar\n  - Apakah basis alokasi sudah tepat\n  - Impact distribusi terhadap unit cost\n\n6. DASHBOARD ANALYTICS\nVisualisasi data dan KPI dalam satu halaman.\n\nKomponen Dashboard:\n• KPI Cards: Total Pendapatan, Total Biaya, Profit Margin, Recovery Rate\n• Charts:\n  - Line Chart: Trend pendapatan dan biaya bulanan\n  - Bar Chart: Top 10 unit by revenue\n  - Pie Chart: Komposisi biaya per kategori\n  - Gauge Chart: Cost recovery rate\n• Tabel: Recent transactions dan alerts\n• Filters: Periode, unit kerja, kategori\n\nMenggunakan Dashboard:\n• Pilih periode untuk real-time update\n• Klik chart untuk drill-down\n• Export dashboard sebagai PDF\n• Schedule automated report via email\n\nBest Practices Reporting:\n• Generate laporan secara berkala (bulanan)\n• Distribusikan laporan ke stakeholder terkait\n• Review laporan dalam rapat manajemen\n• Dokumentasikan findings dan action plans\n• Follow-up action items dari periode sebelumnya\n• Gunakan visualisasi untuk komunikasi yang efektif\n• Archive laporan untuk reference masa depan',
      
      'MANAJEMEN USER\n\nManajemen user adalah fungsi khusus untuk Super Admin dalam mengelola pengguna sistem, role, dan hak akses.\n\n⚠️ PERHATIAN:\nFitur ini hanya dapat diakses oleh user dengan role Super Admin. Admin dan user lain tidak memiliki akses ke menu ini.\n\nCara Mengakses:\n• Akses Menu: Manajemen Akses (hanya muncul untuk Super Admin)\n\nFungsi Manajemen User:\n\n1. MELIHAT DAFTAR USER\nTampilan semua user yang terdaftar dalam sistem.\n\nInformasi yang Ditampilkan:\n• Email user (sebagai username)\n• Nama Lengkap\n• Role yang di-assign\n• Status Akun (Aktif/Non-aktif)\n• Tanggal Dibuat\n• Last Login\n• Action buttons (Edit, Delete)\n\nFitur Table:\n• Search by email atau nama\n• Filter by role\n• Sort by kolom\n• Pagination untuk data banyak\n\n2. MENAMBAH USER BARU\nProses membuat akun user baru.\n\nLangkah-langkah:\n• Klik tombol "Tambah User Baru"\n• Dialog form akan muncul\n• Isi form dengan informasi:\n  - Email: Alamat email valid (akan jadi username)\n  - Password: Minimal 8 karakter, kombinasi huruf-angka-simbol\n  - Confirm Password: Ketik ulang password untuk verifikasi\n  - Nama Lengkap: Full name user\n  - Role: Pilih dari dropdown:\n    * Super Admin - Full access\n    * Admin - Access terbatas tanpa user management\n    * Manager - View only untuk reporting\n    * Operator - Input data operasional\n    * Operator Penunjang - Khusus unit penunjang\n    * Operator Keperawatan - Khusus unit keperawatan\n    * Operator Pelayanan - Khusus unit pelayanan\n    * Viewer - Read only\n• Klik "Simpan"\n• Sistem akan:\n  - Validasi email belum terdaftar\n  - Create user di authentication system\n  - Assign role yang dipilih\n  - Kirim notifikasi (jika configured)\n• User baru dapat langsung login\n\nTips Menambah User:\n• Gunakan email corporate yang resmi\n• Set role sesuai job description user\n• Berikan password sementara dan minta user ganti\n• Dokumentasikan user yang dibuat dan tanggalnya\n\n3. MENGUBAH ROLE USER\nMengupdate role user yang sudah ada.\n\nCara Mengubah Role:\n• Cari user yang akan diubah\n• Klik tombol "Edit" pada baris user\n• Update field "Role" dengan role baru\n• Klik "Simpan Perubahan"\n• User akan otomatis mendapat akses sesuai role baru\n• User yang sedang login akan logout otomatis dan harus login ulang\n\nKapan Mengubah Role:\n• User promosi atau mutasi jabatan\n• Penyesuaian akses berdasarkan kebutuhan\n• Temporary access untuk project tertentu\n• Downgrade akses untuk security\n\n4. MENONAKTIFKAN USER\nMenonaktifkan akun tanpa menghapus data.\n\nCara Menonaktifkan:\n• Edit user yang akan dinonaktifkan\n• Ubah status menjadi "Non-aktif"\n• User tidak dapat login lagi\n• Data user dan activity log tetap tersimpan\n\nKapan Menonaktifkan:\n• User resign atau pindah\n• Temporary suspension\n• Security breach investigation\n\n5. MENGHAPUS USER\nMenghapus user secara permanen dari sistem.\n\n⚠️ PERINGATAN:\nPenghapusan user bersifat PERMANEN dan TIDAK DAPAT DIBATALKAN!\n\nCara Menghapus:\n• Klik tombol "Delete" pada baris user\n• Konfirmasi dialog akan muncul\n• Baca peringatan dengan seksama\n• Ketik konfirmasi jika diminta\n• Klik "Ya, Hapus Permanen"\n• Sistem akan:\n  - Hapus user dari authentication\n  - Hapus role assignment\n  - Hapus profile data\n  - Keep activity log untuk audit\n\nKapan Menghapus User:\n• User test/dummy setelah tidak diperlukan\n• User yang sudah lama non-aktif\n• Cleanup database berkala\n\nTips Keamanan User Management:\n• Jangan share Super Admin password\n• Review daftar user secara berkala\n• Nonaktifkan user yang sudah resign\n• Audit log aktivitas user sensitive\n• Enforce strong password policy\n• Implementasi periodic password change\n• Monitor failed login attempts\n• Limit concurrent sessions',
      
      'TROUBLESHOOTING\n\nPanduan mengatasi masalah umum dalam penggunaan aplikasi.\n\n1. MASALAH LOGIN\n\nMasalah: Tidak Bisa Login\n• Gejala: Muncul error "Invalid credentials" atau "Email/Password salah"\n• Penyebab:\n  - Email atau password salah\n  - Caps Lock aktif\n  - Akun belum aktif\n  - Akun terkunci karena failed attempts\n• Solusi:\n  - Periksa kembali email dan password\n  - Pastikan Caps Lock tidak aktif\n  - Coba fitur "Lupa Password" untuk reset\n  - Hubungi admin untuk unlock akun\n  - Clear browser cache dan cookies\n\nMasalah: Logout Otomatis\n• Gejala: Aplikasi logout sendiri saat sedang bekerja\n• Penyebab:\n  - Session timeout (default 24 jam)\n  - Multiple login dari device berbeda\n  - Network connection unstable\n• Solusi:\n  - Login kembali\n  - Hindari multiple login simultan\n  - Periksa koneksi internet\n  - Simpan pekerjaan secara berkala\n\n2. MASALAH DATA\n\nMasalah: Data Tidak Muncul\n• Gejala: Tabel kosong atau data tidak tampil\n• Penyebab:\n  - Belum ada data untuk periode tersebut\n  - Filter terlalu spesifik\n  - Permission issue\n  - Data loading slow\n• Solusi:\n  - Cek filter periode dan unit\n  - Reset filter ke default\n  - Refresh halaman (F5)\n  - Tunggu loading selesai\n  - Cek koneksi internet\n\nMasalah: Error Saat Menyimpan Data\n• Gejala: Muncul error message saat klik "Simpan"\n• Penyebab:\n  - Validasi data gagal\n  - Field required kosong\n  - Duplikasi data\n  - Network error\n• Solusi:\n  - Baca error message dengan teliti\n  - Isi semua field yang required\n  - Periksa format input (angka, tanggal, dll)\n  - Cek apakah data sudah ada sebelumnya\n  - Coba simpan ulang setelah beberapa saat\n\nMasalah: Data Tidak Akurat\n• Gejala: Angka tidak sesuai dengan yang diinput\n• Penyebab:\n  - Input data salah\n  - Formula kalkulasi error\n  - Distribusi biaya belum dilakukan\n  - Data periode sebelumnya mempengaruhi\n• Solusi:\n  - Verifikasi input data mentah\n  - Recalculate kalkulasi\n  - Lakukan distribusi biaya\n  - Bandingkan dengan source data\n  - Hubungi support jika tetap error\n\n3. MASALAH KALKULASI\n\nMasalah: Unit Cost Tidak Terhitung\n• Gejala: Unit cost 0 atau null\n• Penyebab:\n  - Volume layanan belum diinput\n  - Data biaya belum lengkap\n  - Distribusi biaya belum dijalankan\n• Solusi:\n  - Lengkapi data pendapatan dan biaya\n  - Input volume layanan\n  - Jalankan distribusi biaya\n  - Jalankan ulang kalkulasi\n\nMasalah: Unit Cost Tidak Wajar\n• Gejala: Unit cost terlalu tinggi atau rendah\n• Penyebab:\n  - Input data salah (misalnya kurang/lebih nol)\n  - Volume layanan salah\n  - Alokasi biaya error\n• Solusi:\n  - Review input data mentah\n  - Cek kewajaran volume\n  - Verifikasi basis alokasi\n  - Bandingkan dengan periode sebelumnya\n  - Lakukan analisis variance\n\n4. MASALAH PERFORMA\n\nMasalah: Aplikasi Lambat\n• Gejala: Loading lama, response time tinggi\n• Penyebab:\n  - Internet connection slow\n  - Browser overload\n  - Cache penuh\n  - Data volume besar\n• Solusi:\n  - Periksa kecepatan internet\n  - Close tab browser yang tidak perlu\n  - Clear browser cache\n  - Gunakan browser modern (Chrome, Edge, Firefox)\n  - Restart browser\n\nMasalah: Export Gagal\n• Gejala: File Excel atau PDF tidak terdownload\n• Penyebab:\n  - Browser block popup\n  - Download folder permission\n  - Data terlalu besar\n• Solusi:\n  - Allow popup untuk situs ini\n  - Periksa download folder browser\n  - Reduce data dengan filter\n  - Coba browser lain\n\n5. MASALAH AKSES\n\nMasalah: Menu Tidak Muncul\n• Gejala: Menu tertentu tidak tampil di sidebar\n• Penyebab:\n  - Role tidak memiliki akses\n  - Permission belum di-set\n  - Bug sistem\n• Solusi:\n  - Cek role user Anda\n  - Hubungi admin untuk assign permission\n  - Logout dan login ulang\n  - Clear cache browser\n\nMasalah: Error "Insufficient Permission"\n• Gejala: Muncul error saat akses fitur tertentu\n• Penyebab:\n  - Role tidak memiliki permission\n  - Session expired\n• Solusi:\n  - Hubungi Super Admin untuk update role\n  - Login ulang\n  - Verifikasi menu access matrix\n\nKapan Harus Hubungi Support:\n• Error yang tidak bisa diatasi sendiri\n• Suspicious activity atau security issue\n• Bug atau system error\n• Request fitur baru\n• Kebutuhan training tambahan\n\nInformasi yang Perlu Disiapkan:\n• Email user dan role\n• Screenshot error message\n• Langkah-langkah yang sudah dicoba\n• Waktu kejadian error\n• Browser dan device yang digunakan',
      
      'BEST PRACTICES\n\nPanduan praktik terbaik dalam menggunakan Aplikasi Unit Cost untuk hasil yang optimal.\n\n1. DATA MANAGEMENT\n\nKonsistensi Input Data:\n• Input data secara rutin dan tepat waktu (mingguan atau bulanan)\n• Gunakan naming convention yang konsisten\n• Validasi data sebelum save\n• Backup data secara berkala\n• Dokumentasikan sumber data\n\nKualitas Data:\n• Prinsip GIGO (Garbage In, Garbage Out)\n• Lakukan data validation:\n  - Cek format angka (tidak ada karakter text)\n  - Cek range nilai (tidak ada nilai negatif atau nol pada data yang seharusnya positif)\n  - Cek kelengkapan data (no missing values)\n  - Cek duplikasi\n• Cross-check dengan sistem lain (SIMRS, Sistem Keuangan)\n• Reconciliation data bulanan\n\nData Review Cycle:\n• Weekly: Review data input mingguan\n• Monthly: Validasi dan close periode\n• Quarterly: Analisis trend dan pola\n• Yearly: Comprehensive audit dan cleanup\n\n2. KALKULASI DAN ANALISIS\n\nKonsistensi Metodologi:\n• Gunakan metodologi yang sama setiap periode\n• Dokumentasikan asumsi yang digunakan\n• Update asumsi jika ada perubahan signifikan\n• Bandingkan hasil dengan periode sebelumnya\n• Analisis variance yang signifikan (>10%)\n\nDistribusi Biaya:\n• Pilih basis alokasi yang paling relevan dan fair\n• Review basis alokasi setiap 6 bulan\n• Dokumentasikan metode distribusi\n• Konsisten dengan basis yang dipilih\n• Lakukan sensitivity analysis untuk basis alternatif\n\nUnit Cost Analysis:\n• Bandingkan unit cost dengan:\n  - Periode sebelumnya (time series)\n  - Target atau benchmark\n  - Rumah sakit sejenis (benchmarking)\n  - Standar industri\n• Investigasi variance >15%\n• Identifikasi opportunities untuk efisiensi\n\n3. REPORTING DAN KOMUNIKASI\n\nPeriodic Reporting:\n• Monthly Report: Unit cost per unit, variance analysis, alert issues\n• Quarterly Report: Trend analysis, cost recovery, profitability\n• Annual Report: Comprehensive analysis, recommendations, action plans\n\nReport Distribution:\n• Kirim laporan ke stakeholder terkait\n• Sesuaikan detail laporan dengan audience:\n  - Executive: Summary dan highlights\n  - Operational: Detail dan action items\n  - Finance: Full data dan calculations\n• Gunakan visualisasi yang efektif\n• Sertakan interpretasi dan recommendations\n\nMeeting dan Follow-up:\n• Monthly review meeting dengan tim operasional\n• Quarterly strategic review dengan manajemen\n• Dokumentasikan decisions dan action items\n• Track progress action items\n• Follow-up pada deadline\n\n4. USER MANAGEMENT\n\nPrinsip Least Privilege:\n• Berikan akses minimal yang diperlukan user\n• Review user access setiap 6 bulan\n• Revoke access untuk user yang sudah tidak aktif\n• Monitor suspicious activities\n\nPassword Security:\n• Enforce strong password policy\n• Periodic password change (3 months)\n• No password sharing\n• Use password manager untuk simpan password\n• Multi-factor authentication jika tersedia\n\nUser Training:\n• Onboarding training untuk user baru\n• Refresher training setiap tahun\n• Training untuk fitur baru\n• Dokumentasi self-help (user manual, FAQ)\n• Support channel yang jelas\n\n5. SYSTEM MAINTENANCE\n\nRegular Maintenance:\n• Monthly: Data cleanup, archive old data\n• Quarterly: Performance review, optimization\n• Yearly: Comprehensive system audit, update\n\nBackup Strategy:\n• Daily: Automated backup oleh sistem\n• Weekly: Manual export data penting\n• Monthly: Full backup dan verification\n• Yearly: Archive to external storage\n• Test restore procedure\n\nPerformance Monitoring:\n• Monitor response time dan loading speed\n• Identify slow queries atau bottlenecks\n• Optimize jika diperlukan\n• Keep browser updated\n• Clear cache regularly\n\n6. CONTINUOUS IMPROVEMENT\n\nFeedback Loop:\n• Kumpulkan feedback dari users\n• Identifikasi pain points\n• Prioritaskan improvement opportunities\n• Implement changes\n• Measure impact\n\nBenchmarking:\n• Compare dengan best practices industri\n• Pelajari dari rumah sakit lain\n• Adopt practices yang relevan\n• Customize sesuai konteks\n• Share learning dengan team\n\nInnovation:\n• Eksplorasi fitur baru aplikasi\n• Propose improvement ideas\n• Test new methodologies\n• Document lessons learned\n• Celebrate wins and learn from failures\n\n7. COMPLIANCE DAN AUDIT\n\nDocumentation:\n• Dokumentasikan semua proses dan prosedur\n• Maintain change log\n• Keep evidence untuk audit\n• Store documents secara terorganisir\n• Regular review dan update dokumentasi\n\nAudit Trail:\n• Semua transaksi tercatat otomatis\n• Review audit log secara berkala\n• Investigasi unusual activities\n• Maintain audit readiness\n• Prepare audit materials in advance\n\nCompliance Checklist:\n• Pastikan sesuai dengan regulasi (Kemenkes, standar akuntansi)\n• Review compliance quarterly\n• Update prosedur jika ada perubahan regulasi\n• Training staff tentang compliance requirements\n• Document compliance activities\n\nKESIMPULAN\n\nPenggunaan aplikasi Unit Cost yang efektif memerlukan:\n• Pemahaman konsep dan metodologi ABC\n• Disiplin dalam input dan validasi data\n• Konsistensi dalam kalkulasi dan analisis\n• Komunikasi yang efektif dengan stakeholder\n• Continuous improvement mindset\n• Compliance dengan standar dan regulasi\n\nDengan mengikuti best practices ini, rumah sakit dapat:\n• Menghasilkan data unit cost yang akurat\n• Membuat keputusan pricing yang tepat\n• Meningkatkan efisiensi operasional\n• Mencapai sustainability financial\n• Memberikan pelayanan berkualitas dengan tarif yang fair\n\nSelamat menggunakan Aplikasi Unit Cost Rumah Sakit! Untuk pertanyaan lebih lanjut, hubungi tim support atau administrator sistem Anda.'
    ]
  };
};

export const downloadModulPDF = (modulType: string) => {
  let modulData: ModulData;
  
  switch (modulType) {
    case 'database-schema':
      modulData = getDatabaseSchemaModulData();
      break;
    case 'role-access':
      modulData = getRoleAccessModulData();
      break;
    case 'gambaran-umum':
      modulData = getGambaranUmumModulData();
      break;
    case 'user-management':
      modulData = getUserManagementModulData();
      break;
    case 'system-config':
      modulData = getSystemConfigModulData();
      break;
    case 'modul-pelatihan':
      modulData = getModulPelatihanData();
      break;
    default:
      modulData = getRoleAccessModulData();
  }
  
  const pdf = generateModulPDF(modulData);
  pdf.save(`${modulData.title.replace(/\s+/g, '_')}.pdf`);
};
