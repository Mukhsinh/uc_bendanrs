import React from "react";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import jsPDF from "jspdf";
import { toast } from "sonner";

const ModulDokumentasiSkemaStruktur: React.FC = () => {
  const generatePDF = () => {
    try {
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      let yPosition = 20;
      const pageHeight = doc.internal.pageSize.height;
      const pageWidth = doc.internal.pageSize.width;
      const margin = 15;
      const maxWidth = pageWidth - (margin * 2);

      // Helper function to add footer on each page
      const addFooter = () => {
        const currentPage = doc.getCurrentPageInfo().pageNumber;
        doc.setFontSize(8);
        doc.setFont("helvetica", "italic");
        doc.setTextColor(100, 100, 100);
        doc.text(
          "Copyright © 2024 Mukhsin Hadi. Hak Cipta Dilindungi Undang-Undang.",
          pageWidth / 2,
          pageHeight - 10,
          { align: "center" }
        );
        doc.setTextColor(0, 0, 0);
      };

      // Helper function to add new page if needed
      const checkPageBreak = (height: number = 10) => {
        if (yPosition + height > pageHeight - 20) {
          addFooter();
          doc.addPage();
          yPosition = 20;
        }
      };

      // Helper function to add text with word wrap
      const addText = (text: string, fontSize: number, isBold: boolean = false) => {
        doc.setFontSize(fontSize);
        doc.setFont("helvetica", isBold ? "bold" : "normal");
        const lines = doc.splitTextToSize(text, maxWidth);
        lines.forEach((line: string) => {
          checkPageBreak();
          doc.text(line, margin, yPosition);
          yPosition += fontSize * 0.5;
        });
        yPosition += 2;
      };

      // Helper function to add heading
      const addHeading = (text: string, level: number = 1) => {
        checkPageBreak(15);
        if (level === 1) {
          doc.setFontSize(18);
          doc.setFont("helvetica", "bold");
          doc.setTextColor(0, 51, 102); // Dark blue
        } else if (level === 2) {
          doc.setFontSize(14);
          doc.setFont("helvetica", "bold");
          doc.setTextColor(0, 102, 204); // Blue
        } else {
          doc.setFontSize(12);
          doc.setFont("helvetica", "bold");
          doc.setTextColor(51, 51, 51); // Dark gray
        }
        doc.text(text, margin, yPosition);
        yPosition += level === 1 ? 12 : 8;
        doc.setTextColor(0, 0, 0); // Reset to black
      };

      // Helper function to add table
      const addTable = (headers: string[], rows: string[][]) => {
        const colWidth = maxWidth / headers.length;
        checkPageBreak(20);

        // Header
        doc.setFillColor(0, 102, 204);
        doc.rect(margin, yPosition - 5, maxWidth, 8, "F");
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(9);
        doc.setFont("helvetica", "bold");
        headers.forEach((header, i) => {
          doc.text(header, margin + (i * colWidth) + 2, yPosition);
        });
        yPosition += 8;
        doc.setTextColor(0, 0, 0);

        // Rows
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        rows.forEach((row, rowIndex) => {
          checkPageBreak(8);
          if (rowIndex % 2 === 0) {
            doc.setFillColor(240, 240, 240);
            doc.rect(margin, yPosition - 5, maxWidth, 7, "F");
          }
          row.forEach((cell, i) => {
            const cellText = doc.splitTextToSize(cell, colWidth - 4);
            doc.text(cellText[0] || "", margin + (i * colWidth) + 2, yPosition);
          });
          yPosition += 7;
        });
        yPosition += 5;
      };

      // ==========================================
      // COVER PAGE - Elegant Design
      // ==========================================
      // Background gradient effect (using multiple rectangles)
      doc.setFillColor(59, 130, 246); // Blue-500
      doc.rect(0, 0, pageWidth, pageHeight, "F");
      
      // Decorative top arc
      doc.setFillColor(37, 99, 235); // Blue-600
      doc.circle(pageWidth / 2, -50, 120, "F");
      
      // Title
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(32);
      doc.setFont("times", "bold");
      doc.text("DOKUMENTASI", pageWidth / 2, 70, { align: "center" });
      
      doc.setFontSize(28);
      doc.text("SKEMA STRUKTUR", pageWidth / 2, 88, { align: "center" });
      doc.text("DATABASE", pageWidth / 2, 103, { align: "center" });
      
      // Subtitle
      doc.setFontSize(16);
      doc.setFont("times", "bolditalic");
      doc.text("Aplikasi Unit Cost RS", pageWidth / 2, 125, { align: "center" });
      
      // Description
      doc.setFontSize(11);
      doc.setFont("helvetica", "normal");
      doc.text("Sistem Perhitungan Unit Cost", pageWidth / 2, 140, { align: "center" });
      doc.text("Metode Activity Based Costing (ABC)", pageWidth / 2, 148, { align: "center" });
      
      // Author section - white box
      doc.setFillColor(255, 255, 255);
      doc.roundedRect(margin + 10, 165, maxWidth - 20, 50, 3, 3, "F");
      
      doc.setTextColor(0, 51, 102);
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.text("Disusun oleh:", pageWidth / 2, 175, { align: "center" });
      
      doc.setFontSize(13);
      doc.setFont("times", "bold");
      doc.text("MUKHSIN HADI, SE, M.Si", pageWidth / 2, 186, { align: "center" });
      
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.text("CGAA, CPFRM, CSEP, CRP, CPRM, CSCAP, CPABC", pageWidth / 2, 195, { align: "center" });
      
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.text("Hak Cipta: 000831709", pageWidth / 2, 207, { align: "center" });
      
      // Version & Date
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(`Versi 1.0 | ${new Date().toLocaleDateString("id-ID", { day: 'numeric', month: 'long', year: 'numeric' })}`, pageWidth / 2, 235, { align: "center" });
      
      // Footer
      doc.setFontSize(8);
      doc.setFont("helvetica", "italic");
      doc.text("Copyright © 2024 Mukhsin Hadi. Hak Cipta Dilindungi Undang-Undang.", pageWidth / 2, pageHeight - 10, { align: "center" });
      
      doc.addPage();
      yPosition = 20;
      doc.setTextColor(0, 0, 0);

      // ==========================================
      // DAFTAR ISI
      // ==========================================
      addHeading("DAFTAR ISI", 1);
      yPosition += 5;
      
      const toc = [
        "1. Gambaran Umum",
        "2. Diagram Relasi Database",
        "3. Tabel Master Data",
        "4. Tabel Transaksi",
        "5. Tabel Kalkulasi",
        "6. Tabel Distribusi Biaya",
        "7. Tabel Output & Reporting",
        "8. Views & Stored Procedures",
        "9. Relasi Antar Tabel",
        "10. Data Flow & Process",
        "11. Formula & Metodologi",
        "12. Best Practices",
      ];
      
      doc.setFontSize(11);
      doc.setFont("helvetica", "normal");
      toc.forEach(item => {
        checkPageBreak();
        doc.text(item, margin + 5, yPosition);
        yPosition += 7;
      });
      
      doc.addPage();
      yPosition = 20;

      // ==========================================
      // 1. GAMBARAN UMUM
      // ==========================================
      addHeading("1. GAMBARAN UMUM", 1);
      
      addText(
        "Aplikasi Unit Cost RS adalah sistem informasi untuk menghitung unit cost layanan rumah sakit " +
        "menggunakan pendekatan Activity Based Costing (ABC). Sistem ini membantu manajemen rumah sakit " +
        "dalam menetapkan tarif yang tepat berdasarkan biaya riil operasional.",
        10
      );

      addHeading("Teknologi Stack", 2);
      const techStack = [
        ["Komponen", "Teknologi", "Deskripsi"],
        ["Database", "PostgreSQL (Supabase)", "Database relasional dengan RLS"],
        ["Backend", "Supabase BaaS", "Backend as a Service"],
        ["Frontend", "React + TypeScript", "Framework modern & type-safe"],
        ["Build Tool", "Vite", "Fast build & HMR"],
        ["UI Library", "Tailwind + shadcn/ui", "Modern component library"],
        ["State Management", "TanStack Query", "Server state management"],
      ];
      addTable(techStack[0], techStack.slice(1));

      addHeading("Ringkasan Database", 2);
      addText("• Total Tabel: 43+ tabel", 10);
      addText("• Master Data: 14 tabel", 10);
      addText("• Transaksi: 3 tabel", 10);
      addText("• Kalkulasi: 8 tabel", 10);
      addText("• Distribusi Biaya: 3 tabel", 10);
      addText("• Output & Reporting: 7 tabel", 10);
      addText("• Stored Procedures: 8+ functions", 10);
      yPosition += 5;

      // ==========================================
      // 2. DIAGRAM RELASI DATABASE
      // ==========================================
      doc.addPage();
      yPosition = 20;
      addHeading("2. DIAGRAM RELASI DATABASE", 1);

      addHeading("Alur Data Utama", 2);
      addText(
        "Master Data → Transaksi → Kalkulasi → Distribusi Biaya I → " +
        "Distribusi Biaya II → Rekapitulasi & Output",
        9
      );
      yPosition += 5;

      addHeading("Kategori Tabel", 2);
      const kategoriTabel = [
        ["Kategori", "Jumlah", "Fungsi Utama"],
        ["Master Data", "14", "Data referensi: unit kerja, tindakan, barang"],
        ["Transaksi", "3", "Data operasional: kegiatan, biaya, pendapatan"],
        ["Kalkulasi", "8", "Perhitungan unit cost per jenis layanan"],
        ["Distribusi", "3", "Alokasi biaya dengan metode ABC 2 tahap"],
        ["Output", "7", "Rekapitulasi, tarif, budgeting, analisis"],
      ];
      addTable(kategoriTabel[0], kategoriTabel.slice(1));

      // ==========================================
      // 3. TABEL MASTER DATA
      // ==========================================
      doc.addPage();
      yPosition = 20;
      addHeading("3. TABEL MASTER DATA", 1);

      // 3.1 Unit Kerja
      addHeading("3.1. unit_kerja", 2);
      addText("Menyimpan informasi unit kerja/cost center di rumah sakit.", 9);
      const unitKerjaFields = [
        ["Kolom", "Tipe", "Keterangan"],
        ["id", "UUID", "Primary Key"],
        ["kode", "VARCHAR(50)", "Kode unit: UK001, UK002, dst"],
        ["nama", "TEXT", "Nama unit kerja"],
        ["lokasi", "TEXT", "Lokasi fisik"],
        ["luas_ruangan", "INTEGER", "Luas dalam m²"],
        ["jenis", "TEXT", "Pusat Biaya / Pusat Pendapatan"],
        ["kategori", "TEXT", "Administrasi / Penunjang / Pelayanan"],
        ["user_id", "UUID", "Foreign Key ke auth.users"],
      ];
      addTable(unitKerjaFields[0], unitKerjaFields.slice(1));

      // 3.2 Data Kamar
      addHeading("3.2. data_kamar", 2);
      addText("Master data kamar rawat inap beserta klasifikasinya.", 9);
      const kamarFields = [
        ["Kolom", "Tipe", "Keterangan"],
        ["Kode_Kamar", "VARCHAR(50)", "Kode kamar"],
        ["Nama_Kamar", "TEXT", "Nama kamar"],
        ["Kelas_SVIP", "BOOLEAN", "Kamar SVIP/VVIP"],
        ["Kelas_VIP", "BOOLEAN", "Kamar VIP"],
        ["Kelas_I", "BOOLEAN", "Kamar kelas I"],
        ["Kelas_II", "BOOLEAN", "Kamar kelas II"],
        ["Kelas_III", "BOOLEAN", "Kamar kelas III"],
      ];
      addTable(kamarFields[0], kamarFields.slice(1));

      // 3.3 Daftar Tindakan
      addHeading("3.3. daftar_tindakan", 2);
      addText("Master tindakan medis dan non-medis dengan parameter waktu & kesulitan.", 9);
      const tindakanFields = [
        ["Kolom", "Tipe", "Keterangan"],
        ["kode_tindakan", "VARCHAR(50)", "Kode tindakan"],
        ["nama_tindakan", "TEXT", "Nama tindakan"],
        ["medis", "BOOLEAN", "Tindakan medis"],
        ["paramedis", "BOOLEAN", "Tindakan paramedis"],
        ["hk_waktu", "NUMERIC", "HK waktu"],
        ["alokasi_waktu", "NUMERIC", "Alokasi waktu"],
        ["profesionalisme", "INTEGER", "Tingkat 1-4"],
        ["tingkat_kesulitan", "INTEGER", "Tingkat 1-5"],
        ["biaya_bahan_tindakan", "NUMERIC", "Biaya bahan"],
      ];
      addTable(tindakanFields[0], tindakanFields.slice(1));

      // 3.4 Data Barang Farmasi
      addHeading("3.4. data_barang_farmasi", 2);
      addText("Master data obat dan bahan habis pakai (BHP).", 9);
      const barangFields = [
        ["Kolom", "Tipe", "Keterangan"],
        ["kode_barang", "VARCHAR(50)", "Kode barang"],
        ["nama_barang", "TEXT", "Nama barang"],
        ["satuan", "VARCHAR(20)", "Satuan: tablet, botol, dll"],
        ["gudang", "VARCHAR(10)", "Tipe: obat / bhp"],
        ["harga", "NUMERIC", "Harga per satuan"],
      ];
      addTable(barangFields[0], barangFields.slice(1));

      // Tabel master lainnya (ringkas)
      addHeading("3.5. Tabel Master Lainnya", 2);
      const masterLainnya = [
        ["Tabel", "Deskripsi", "Kolom Utama"],
        ["klinik", "Data klinik/poli", "kode_klinik, nama_klinik, layanan"],
        ["menu_gizi", "Menu makanan", "kode_makanan, nama_makanan"],
        ["data_barang_gizi", "Bahan makanan", "kode_barang, nama, satuan, harga"],
        ["data_diklat", "Materi diklat", "kode_strata, kode_materi, nama"],
        ["tindakan_cathlab", "Tindakan cathlab", "kode, nama"],
        ["tindakan_bdrs", "Tindakan BDRS", "kode, nama"],
        ["tindakan_ibs", "Tindakan IBS", "kode, nama, operator"],
        ["tindakan_laboratorium", "Tindakan lab", "jenis (PK/PA/Mi), kode, nama"],
        ["tindakan_radiologi", "Tindakan radiologi", "kode, nama"],
        ["tindakan_operatif", "Tindakan operatif", "kode, nama, operator"],
      ];
      addTable(masterLainnya[0], masterLainnya.slice(1));

      // ==========================================
      // 4. TABEL TRANSAKSI
      // ==========================================
      doc.addPage();
      yPosition = 20;
      addHeading("4. TABEL TRANSAKSI", 1);

      addHeading("4.1. data_kegiatan", 2);
      addText(
        "Menyimpan data aktivitas unit kerja per tahun. Tabel ini memiliki 40+ kolom untuk berbagai " +
        "jenis aktivitas (rawat inap, tindakan, pendukung, dll).",
        9
      );
      const kegiatanFields = [
        ["Kategori Aktivitas", "Kolom", "Keterangan"],
        ["1. Layanan Administrasi", "kunjungan_pasien_baru", "Jumlah pasien baru"],
        ["", "kunjungan_pasien_lama", "Jumlah pasien lama"],
        ["2. Rawat Inap", "lama_hari_svip/vip/i/ii/iii", "Lama hari rawat per kelas"],
        ["", "kamar_luas_svip/vip/i/ii/iii", "Luas kamar per kelas"],
        ["3. Layanan", "Jumlah_Tindakan", "Total tindakan"],
        ["", "Resep_Lembar_Resep", "Jumlah resep"],
        ["4. Pendukung", "Cucian_kg_Cucian", "Berat cucian (kg)"],
        ["", "jumlah_porsi_*", "Porsi makanan per kelas"],
        ["5. Investasi", "nilai_aset", "Nilai investasi aset"],
        ["6. Ruangan", "total_luas_ruangan", "Total luas (m²)"],
        ["7. Diklat", "Diklat_Lama_Hari", "Lama diklat (hari)"],
        ["8. SDM", "jumlah_pegawai", "Total pegawai"],
      ];
      addTable(kegiatanFields[0], kegiatanFields.slice(1));

      addHeading("4.2. data_biaya", 2);
      addText("Menyimpan data biaya operasional unit kerja per tahun.", 9);
      const biayaFields = [
        ["Kolom", "Kategori", "Keterangan"],
        ["biaya_pegawai", "SDM", "Gaji & tunjangan"],
        ["biaya_bahan", "Material", "Bahan habis pakai"],
        ["biaya_jasa_pelayanan", "Jasa", "Jasa pelayanan"],
        ["biaya_pemeliharaan", "Maintenance", "Pemeliharaan"],
        ["biaya_barang_jasa", "Operasional", "Barang & jasa"],
        ["biaya_penyusutan", "Depresiasi", "Penyusutan aset"],
        ["biaya_farmasi", "Farmasi", "Obat & farmasi"],
        ["biaya_operasional_lainnya", "Lain-lain", "Biaya lainnya"],
      ];
      addTable(biayaFields[0], biayaFields.slice(1));

      addHeading("4.3. data_pendapatan", 2);
      addText("Menyimpan data pendapatan unit kerja per tahun.", 9);
      const pendapatanFields = [
        ["Kolom", "Deskripsi", "Keterangan"],
        ["pendapatan_umum", "Pendapatan Umum", "Dari pasien umum"],
        ["pendapatan_bpjs", "Pendapatan BPJS", "Dari BPJS Kesehatan"],
        ["total_pendapatan", "Total", "Calculated: umum + bpjs"],
      ];
      addTable(pendapatanFields[0], pendapatanFields.slice(1));

      // ==========================================
      // 5. TABEL KALKULASI
      // ==========================================
      doc.addPage();
      yPosition = 20;
      addHeading("5. TABEL KALKULASI", 1);

      addText(
        "Tabel kalkulasi menyimpan perhitungan unit cost untuk berbagai jenis layanan. " +
        "Setiap tabel memiliki struktur serupa dengan komponen biaya yang sama.",
        9
      );
      yPosition += 3;

      addHeading("Struktur Umum Tabel Kalkulasi", 2);
      const kalkulasiStructure = [
        ["Komponen", "Kolom", "Keterangan"],
        ["Identifikasi", "kode_unit_kerja, nama_unit_kerja", "Unit yang melakukan"],
        ["", "kode_tindakan, nama_tindakan", "Tindakan yang dikalkulasi"],
        ["Volume", "jumlah_pemeriksaan/tindakan", "Volume aktivitas"],
        ["Biaya Overhead", "biaya_overhead", "Hasil distribusi biaya"],
        ["Biaya SDM", "biaya_sdm", "Berdasarkan waktu & kompleksitas"],
        ["Biaya Bahan", "biaya_bahan_farmasi", "Total biaya bahan"],
        ["Detail Bahan", "bahan_farmasi_list (JSONB)", "Detail item bahan"],
        ["Parameter", "waktu_pemeriksaan", "Waktu dalam menit"],
        ["", "profesionalisme (1-4)", "Tingkat profesionalisme"],
        ["", "tingkat_kesulitan (1-7)", "Tingkat kesulitan"],
        ["Output", "unit_cost_per_pemeriksaan", "Unit cost final"],
      ];
      addTable(kalkulasiStructure[0], kalkulasiStructure.slice(1));

      addHeading("Daftar Tabel Kalkulasi", 2);
      const kalkulasiList = [
        ["Tabel", "Jenis Layanan", "Output Field"],
        ["kalkulasi_biaya_bdrs", "Bedah Digestif", "unit_cost_per_pemeriksaan"],
        ["kalkulasi_biaya_laboratorium", "Lab (PK/PA/Mi)", "unit_cost_per_pemeriksaan"],
        ["kalkulasi_biaya_radiologi", "Radiologi", "unit_cost_per_pemeriksaan"],
        ["kalkulasi_biaya_operatif", "Bedah Operatif", "unit_cost_per_tindakan"],
        ["kalkulasi_biaya_cathlab", "Cathlab", "unit_cost_per_tindakan"],
        ["kalkulasi_biaya_ibs", "IBS", "unit_cost_per_pemeriksaan"],
        ["kalkulasi_biaya_gizi", "Gizi/Menu", "unit_cost_per_porsi"],
        ["kalkulasi_biaya_kelas_akomodasi", "Rawat Inap", "unit_cost (per hari)"],
      ];
      addTable(kalkulasiList[0], kalkulasiList.slice(1));

      addHeading("Format JSONB: bahan_farmasi_list", 2);
      addText("Contoh struktur data bahan farmasi yang disimpan dalam format JSONB:", 9);
      doc.setFontSize(8);
      doc.setFont("courier", "normal");
      checkPageBreak(40);
      const jsonExample = `[
  {
    "kode_barang": "BRG001",
    "nama": "Hansaplast 1.25 cm",
    "qty": 2,
    "harga_satuan": 5000,
    "harga_total": 10000
  },
  {
    "kode_barang": "BRG002",
    "nama": "Kasa Steril",
    "qty": 5,
    "harga_satuan": 3000,
    "harga_total": 15000
  }
]`;
      const jsonLines = jsonExample.split('\n');
      jsonLines.forEach(line => {
        checkPageBreak();
        doc.text(line, margin + 5, yPosition);
        yPosition += 4;
      });
      yPosition += 5;
      doc.setFont("helvetica", "normal");

      // ==========================================
      // 6. TABEL DISTRIBUSI BIAYA
      // ==========================================
      doc.addPage();
      yPosition = 20;
      addHeading("6. TABEL DISTRIBUSI BIAYA", 1);

      addText(
        "Tabel distribusi biaya mengimplementasikan metode Activity Based Costing (ABC) dengan " +
        "2 tahap distribusi untuk mengalokasikan biaya overhead dari unit non-produktif ke unit produktif.",
        9
      );
      yPosition += 3;

      addHeading("6.1. distribusi_biaya_pertama", 2);
      addText("Distribusi Tahap I: Unit Administrasi Umum → Semua Unit (UK001-UK077)", 9);
      const distrib1Fields = [
        ["Kolom", "Tipe", "Keterangan"],
        ["unit_kerja_pusat_biaya", "TEXT", "Unit sumber biaya"],
        ["biaya_tahunan", "NUMERIC", "Total biaya unit"],
        ["dasar_alokasi", "TEXT", "Dasar: m², pegawai, dll"],
        ["uk001_direktur", "NUMERIC", "Alokasi ke UK001"],
        ["uk002_komite_ppi", "NUMERIC", "Alokasi ke UK002"],
        ["... (UK003-UK076)", "NUMERIC", "74 kolom lainnya"],
        ["uk077_unit_diklat", "NUMERIC", "Alokasi ke UK077"],
        ["jumlah_biaya_terdistribusi_i", "NUMERIC", "Total distribusi"],
        ["audit_check", "TEXT", "Status audit"],
      ];
      addTable(distrib1Fields[0], distrib1Fields.slice(1));

      addText("Total Kolom UK: 77 kolom (UK001 - UK077)", 9, true);
      yPosition += 3;

      addHeading("6.2. distribusi_biaya_kedua", 2);
      addText("Distribusi Tahap II: Unit Penunjang (UK037-UK046) → Unit Pelayanan (UK047-UK077)", 9);
      const distrib2Fields = [
        ["Kolom", "Tipe", "Keterangan"],
        ["unit_kerja_pusat_biaya", "TEXT", "Unit sumber biaya"],
        ["biaya_alokasi_i", "NUMERIC", "Biaya dari distribusi I"],
        ["dasar_alokasi", "TEXT", "Dasar alokasi"],
        ["uk037_ambulance", "NUMERIC", "Alokasi ke UK037"],
        ["... (UK038-UK076)", "NUMERIC", "39 kolom lainnya"],
        ["uk077_unit_diklat", "NUMERIC", "Alokasi ke UK077"],
        ["total_alokasi_biaya_kedua", "NUMERIC", "Total distribusi II"],
      ];
      addTable(distrib2Fields[0], distrib2Fields.slice(1));

      addText("Total Kolom UK: 41 kolom (UK037 - UK077)", 9, true);
      yPosition += 3;

      addHeading("6.3. distribusi_biaya_rekap", 2);
      addText("Rekapitulasi final distribusi biaya per jenis biaya.", 9);
      const distribRekapFields = [
        ["Kolom", "Tipe", "Keterangan"],
        ["biaya", "TEXT", "Jenis biaya"],
        ["urutan", "INTEGER", "Urutan tampilan"],
        ["uk037_ambulance", "NUMERIC", "Total biaya UK037"],
        ["... (UK038-UK076)", "NUMERIC", "39 kolom lainnya"],
        ["uk077_unit_diklat", "NUMERIC", "Total biaya UK077"],
      ];
      addTable(distribRekapFields[0], distribRekapFields.slice(1));

      // ==========================================
      // 7. TABEL OUTPUT & REPORTING
      // ==========================================
      doc.addPage();
      yPosition = 20;
      addHeading("7. TABEL OUTPUT & REPORTING", 1);

      addHeading("7.1. rekapitulasi_unit_cost", 2);
      addText("Rekapitulasi final unit cost dari semua tabel kalkulasi.", 9);
      const rekapFields = [
        ["Kolom", "Tipe", "Keterangan"],
        ["kode_unit_kerja", "VARCHAR(50)", "Kode unit kerja"],
        ["nama_unit_kerja", "TEXT", "Nama unit kerja"],
        ["kode_operator", "VARCHAR(50)", "Kode operator (optional)"],
        ["nama_operator", "TEXT", "Nama operator (optional)"],
        ["kode_tindakan", "VARCHAR(50)", "Kode tindakan"],
        ["nama_tindakan", "TEXT", "Nama tindakan"],
        ["biaya_bahan", "NUMERIC", "Total biaya bahan"],
        ["unit_cost_per_tindakan", "NUMERIC", "Unit cost final"],
        ["sumber_tabel", "TEXT", "Sumber: kalkulasi_biaya_*"],
      ];
      addTable(rekapFields[0], rekapFields.slice(1));

      addHeading("7.2. skenario_tarif", 2);
      addText("Skenario penetapan tarif dengan analisis profit margin.", 9);
      const tarifFields = [
        ["Kolom", "Tipe", "Keterangan"],
        ["unit_cost_per_tindakan", "NUMERIC", "Unit cost"],
        ["biaya_bahan", "NUMERIC", "Biaya bahan"],
        ["jasa_sarana", "NUMERIC", "30% dari unit cost"],
        ["jasa_pelayanan_medis", "NUMERIC", "Jasa medis"],
        ["jasa_pelayanan_non_medis", "NUMERIC", "Jasa non-medis"],
        ["jasa_pelayanan", "NUMERIC", "Total jasa pelayanan"],
        ["tarif_per_tindakan", "NUMERIC", "Tarif yang diusulkan"],
        ["prosentase_profit", "NUMERIC", "% Profit"],
      ];
      addTable(tarifFields[0], tarifFields.slice(1));

      addHeading("7.3. skenario_tarif_akomodasi", 2);
      addText("Skenario tarif rawat inap per kelas dengan analisis profit.", 9);
      const tarifAkomodasiFields = [
        ["Kolom", "Deskripsi", "Keterangan"],
        ["rata_rata_uc_vvip/vip/i/ii/iii", "Rata-rata UC", "Per kelas"],
        ["tarif_vvip/vip/i/ii/iii", "Tarif", "Tarif per kelas"],
        ["profit_rupiah_*", "Profit (Rp)", "Profit dalam rupiah"],
        ["profit_persen_*", "Profit (%)", "Persentase profit"],
      ];
      addTable(tarifAkomodasiFields[0], tarifAkomodasiFields.slice(1));

      addHeading("7.4. rincian_budgeting_bhp", 2);
      addText("Detail rincian budgeting bahan habis pakai per tindakan.", 9);
      const rincianBHPFields = [
        ["Kolom", "Tipe", "Keterangan"],
        ["kode_unit_kerja", "VARCHAR(50)", "Unit kerja"],
        ["kode_tindakan", "VARCHAR(50)", "Tindakan"],
        ["jumlah_tindakan", "NUMERIC", "Volume tindakan"],
        ["kode_barang", "VARCHAR(50)", "Kode bahan"],
        ["nama_barang", "TEXT", "Nama bahan"],
        ["qty_per_tindakan", "NUMERIC", "Qty per tindakan"],
        ["harga_satuan", "NUMERIC", "Harga satuan"],
        ["jumlah_total", "NUMERIC", "Total qty"],
        ["total_rupiah", "NUMERIC", "Total nilai"],
      ];
      addTable(rincianBHPFields[0], rincianBHPFields.slice(1));

      addHeading("7.5. rupiah_budgeting_bhp", 2);
      addText("Rekapitulasi budgeting BHP per unit kerja.", 9);
      const rupiahBHPFields = [
        ["Kolom", "Tipe", "Keterangan"],
        ["kode_unit_kerja", "VARCHAR(50)", "Unit kerja"],
        ["nama_unit_kerja", "TEXT", "Nama unit"],
        ["total_budgeting", "NUMERIC", "Total budgeting BHP"],
        ["jumlah_item_bahan", "INTEGER", "Jumlah jenis bahan"],
      ];
      addTable(rupiahBHPFields[0], rupiahBHPFields.slice(1));

      // ==========================================
      // 8. VIEWS & STORED PROCEDURES
      // ==========================================
      doc.addPage();
      yPosition = 20;
      addHeading("8. VIEWS & STORED PROCEDURES", 1);

      addHeading("8.1. Views", 2);
      addHeading("view_cost_recovery", 3);
      addText("View untuk analisis cost recovery rate (perbandingan pendapatan vs biaya).", 9);
      addText("Formula: Cost Recovery Rate = (Total Pendapatan / Total Biaya) × 100%", 9);
      yPosition += 3;

      addHeading("8.2. Stored Procedures", 2);
      const storedProcs = [
        ["Function", "Parameter", "Deskripsi"],
        ["populate_distribusi_biaya_pertama", "user_id, tahun", "Generate distribusi biaya tahap I"],
        ["populate_distribusi_biaya_kedua", "user_id, tahun", "Generate distribusi biaya tahap II"],
        ["populate_distribusi_biaya_rekap", "user_id, tahun", "Generate rekapitulasi distribusi"],
        ["populate_rekapitulasi_unit_cost", "user_id, tahun", "Aggregate semua kalkulasi"],
        ["populate_skenario_tarif", "user_id, tahun", "Generate skenario tarif"],
        ["populate_skenario_tarif_akomodasi", "user_id, tahun", "Generate tarif akomodasi"],
        ["populate_rincian_budgeting_bhp", "user_id, tahun", "Generate rincian BHP"],
        ["populate_rupiah_budgeting_bhp", "user_id, tahun", "Generate rekap BHP"],
      ];
      addTable(storedProcs[0], storedProcs.slice(1));

      // ==========================================
      // 9. RELASI ANTAR TABEL
      // ==========================================
      doc.addPage();
      yPosition = 20;
      addHeading("9. RELASI ANTAR TABEL", 1);

      addHeading("9.1. Relasi Master Data", 2);
      const relasiMaster = [
        ["Tabel Parent", "Relasi", "Tabel Child", "Foreign Key"],
        ["auth.users", "1 to N", "unit_kerja", "user_id"],
        ["auth.users", "1 to N", "data_kegiatan", "user_id"],
        ["auth.users", "1 to N", "data_biaya", "user_id"],
        ["unit_kerja", "1 to N", "data_kegiatan", "kode_unit_kerja"],
        ["unit_kerja", "1 to N", "data_biaya", "kode_unit_kerja"],
        ["unit_kerja", "1 to N", "data_pendapatan", "kode_unit_kerja"],
      ];
      addTable(relasiMaster[0], relasiMaster.slice(1));

      addHeading("9.2. Relasi Kalkulasi", 2);
      const relasiKalkulasi = [
        ["Tabel Parent", "Relasi", "Tabel Child", "Foreign Key"],
        ["daftar_tindakan", "1 to N", "rekapitulasi_unit_cost", "kode_tindakan"],
        ["tindakan_bdrs", "1 to N", "kalkulasi_biaya_bdrs", "kode_tindakan"],
        ["tindakan_laboratorium", "1 to N", "kalkulasi_biaya_laboratorium", "kode_tindakan"],
        ["menu_gizi", "1 to N", "kalkulasi_biaya_gizi", "kode"],
        ["data_barang_farmasi", "JSONB", "bahan_farmasi_list", "kode_barang"],
      ];
      addTable(relasiKalkulasi[0], relasiKalkulasi.slice(1));

      addHeading("9.3. Relasi Distribusi", 2);
      const relasiDistribusi = [
        ["Tabel Source", "Relasi", "Tabel Target", "Keterangan"],
        ["data_biaya", "1 to N", "distribusi_biaya_pertama", "Biaya yang didistribusi"],
        ["distribusi_biaya_pertama", "1 to N", "distribusi_biaya_kedua", "Hasil tahap I"],
        ["distribusi_biaya_kedua", "1 to N", "distribusi_biaya_rekap", "Hasil tahap II"],
      ];
      addTable(relasiDistribusi[0], relasiDistribusi.slice(1));

      // ==========================================
      // 10. DATA FLOW & PROCESS
      // ==========================================
      doc.addPage();
      yPosition = 20;
      addHeading("10. DATA FLOW & PROCESS", 1);

      addHeading("10.1. Alur Input Data", 2);
      addText("1. User login → Autentikasi", 9);
      addText("2. Input Master Data:", 9);
      addText("   • Unit Kerja (kode, nama, kategori)", 9);
      addText("   • Tindakan (medis/non-medis dengan parameter)", 9);
      addText("   • Barang Farmasi & Gizi", 9);
      addText("3. Input Data Transaksi:", 9);
      addText("   • Data Kegiatan (volume aktivitas)", 9);
      addText("   • Data Biaya (8 kategori biaya)", 9);
      addText("   • Data Pendapatan (umum & BPJS)", 9);
      yPosition += 5;

      addHeading("10.2. Alur Kalkulasi", 2);
      addText("1. Pilih unit kerja dan tindakan", 9);
      addText("2. Input bahan farmasi (kode, qty, harga)", 9);
      addText("3. Input parameter:", 9);
      addText("   • Waktu pemeriksaan (menit)", 9);
      addText("   • Profesionalisme (1-4)", 9);
      addText("   • Tingkat kesulitan (1-7)", 9);
      addText("4. System auto-calculate:", 9);
      addText("   • Biaya overhead (dari distribusi)", 9);
      addText("   • Biaya SDM (waktu × profesionalisme × kesulitan)", 9);
      addText("   • Biaya bahan (Σ qty × harga)", 9);
      addText("5. Output: Unit Cost per Tindakan", 9);
      yPosition += 5;

      addHeading("10.3. Alur Distribusi Biaya (ABC)", 2);
      addText("TAHAP I: Administrasi Umum → Semua Unit", 9, true);
      addText("• Sumber: Unit Administrasi Umum (UK001-UK036)", 9);
      addText("• Target: Semua unit (UK001-UK077)", 9);
      addText("• Dasar Alokasi:", 9);
      addText("  - Luas ruangan (m²)", 9);
      addText("  - Jumlah pegawai", 9);
      addText("  - Volume aktivitas", 9);
      yPosition += 3;

      addText("TAHAP II: Penunjang → Pelayanan", 9, true);
      addText("• Sumber: Unit Penunjang (UK037-UK046)", 9);
      addText("  - Ambulance, Lab, Radiologi, Farmasi,", 9);
      addText("    Rehab Medik, Gizi, Laundry, BDRS,", 9);
      addText("    Cathlab, IBS", 9);
      addText("• Target: Unit Pelayanan (UK047-UK077)", 9);
      addText("  - Rawat Inap, VK, IGD, Klinik-klinik", 9);
      addText("• Dasar Alokasi: Volume layanan/aktivitas", 9);
      yPosition += 5;

      // ==========================================
      // 11. FORMULA & METODOLOGI
      // ==========================================
      doc.addPage();
      yPosition = 20;
      addHeading("11. FORMULA & METODOLOGI", 1);

      addHeading("11.1. Formula Unit Cost", 2);
      doc.setFillColor(230, 240, 255);
      doc.rect(margin, yPosition - 5, maxWidth, 25, "F");
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.text("Unit Cost = (Biaya Overhead + Biaya SDM + Biaya Bahan) / Volume", margin + 5, yPosition + 3);
      yPosition += 12;
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.text("• Biaya Overhead: Hasil distribusi biaya tahap I & II", margin + 5, yPosition + 3);
      doc.text("• Biaya SDM: Waktu × Profesionalisme × Tingkat Kesulitan", margin + 5, yPosition + 9);
      doc.text("• Biaya Bahan: Σ(Qty × Harga Satuan)", margin + 5, yPosition + 15);
      yPosition += 30;

      addHeading("11.2. Komponen Biaya Overhead", 2);
      const overheadComp = [
        ["Komponen", "Sumber", "Metode Alokasi"],
        ["Biaya Pegawai", "data_biaya", "Proporsi pegawai"],
        ["Biaya Pemeliharaan", "data_biaya", "Proporsi luas ruangan"],
        ["Biaya Operasional", "data_biaya", "Proporsi aktivitas"],
        ["Biaya Penyusutan", "data_biaya", "Proporsi nilai aset"],
      ];
      addTable(overheadComp[0], overheadComp.slice(1));

      addHeading("11.3. Formula Biaya SDM", 2);
      doc.setFillColor(255, 245, 230);
      doc.rect(margin, yPosition - 5, maxWidth, 20, "F");
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.text("Biaya SDM = Waktu Pemeriksaan × Faktor Profesionalisme × Faktor Kesulitan", margin + 5, yPosition + 3);
      yPosition += 12;
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.text("• Waktu: dalam menit", margin + 5, yPosition + 3);
      doc.text("• Profesionalisme: 1 (rendah) - 4 (sangat tinggi)", margin + 5, yPosition + 8);
      yPosition += 25;

      addHeading("11.4. Formula Skenario Tarif", 2);
      addText("Komponen Tarif:", 9, true);
      addText("1. Unit Cost (dari kalkulasi)", 9);
      addText("2. + Jasa Sarana (30% dari unit cost)", 9);
      addText("3. + Jasa Pelayanan Medis", 9);
      addText("4. + Jasa Pelayanan Non-Medis", 9);
      addText("5. = Tarif per Tindakan", 9);
      yPosition += 3;
      addText("Profit = Tarif - Unit Cost", 9, true);
      addText("% Profit = (Profit / Tarif) × 100%", 9, true);
      yPosition += 5;

      // ==========================================
      // 12. BEST PRACTICES
      // ==========================================
      doc.addPage();
      yPosition = 20;
      addHeading("12. BEST PRACTICES", 1);

      addHeading("12.1. Normalisasi Data", 2);
      addText("✓ Master data dinormalisasi untuk menghindari redundansi", 9);
      addText("✓ Gunakan foreign key untuk integritas referensial", 9);
      addText("✓ JSONB untuk data dinamis (bahan_farmasi_list)", 9);
      yPosition += 3;

      addHeading("12.2. Indexing Strategy", 2);
      addText("✓ Index pada kolom yang sering di-query:", 9);
      addText("  • kode_unit_kerja", 9);
      addText("  • tahun", 9);
      addText("  • user_id", 9);
      addText("✓ Composite index untuk kombinasi filter", 9);
      yPosition += 3;

      addHeading("12.3. Naming Convention", 2);
      addText("✓ Table names: lowercase_underscore", 9);
      addText("✓ Column names: lowercase_underscore", 9);
      addText("✓ FK names: <table>_id", 9);
      addText("✓ Index names: idx_<table>_<column>", 9);
      yPosition += 3;

      addHeading("12.4. Data Types", 2);
      addText("✓ UUID untuk primary keys (distributed friendly)", 9);
      addText("✓ NUMERIC untuk nilai moneter (presisi tinggi)", 9);
      addText("✓ TIMESTAMP WITH TIME ZONE untuk datetime", 9);
      addText("✓ JSONB untuk semi-structured data", 9);
      yPosition += 3;

      addHeading("12.5. Row Level Security (RLS)", 2);
      addText("✓ Semua tabel protected dengan RLS", 9);
      addText("✓ User hanya akses data sendiri (WHERE user_id = auth.uid())", 9);
      addText("✓ Admin memiliki akses penuh (policy terpisah)", 9);
      yPosition += 3;

      addHeading("12.6. Audit Trail", 2);
      addText("✓ created_at: tracking waktu pembuatan", 9);
      addText("✓ updated_at: tracking waktu update", 9);
      addText("✓ user_id: tracking ownership", 9);
      yPosition += 5;

      // ==========================================
      // APPENDIX: DAFTAR 77 UNIT KERJA
      // ==========================================
      doc.addPage();
      yPosition = 20;
      addHeading("APPENDIX A: DAFTAR 77 UNIT KERJA", 1);

      const unitKerjaList = [
        ["Kode", "Nama Unit Kerja", "Kategori"],
        ["UK001", "Direktur", "Administrasi Umum"],
        ["UK002", "Komite PPI", "Administrasi Umum"],
        ["UK003", "Komite PMKP", "Administrasi Umum"],
        ["UK004", "Komite Medik", "Administrasi Umum"],
        ["UK005", "Akreditasi", "Administrasi Umum"],
        ["UK019", "Bag Tata Usaha", "Administrasi Umum"],
        ["UK020", "Subag Keuangan", "Administrasi Umum"],
        ["UK037", "Ambulance", "Unit Penunjang"],
        ["UK038", "Laboratorium PK PA", "Unit Penunjang"],
        ["UK039", "Radiologi", "Unit Penunjang"],
        ["UK040", "Farmasi", "Unit Penunjang"],
        ["UK041", "Rehab Medik", "Unit Penunjang"],
        ["UK042", "Gizi Dapur", "Unit Penunjang"],
        ["UK043", "Laundry CSSD", "Unit Penunjang"],
        ["UK044", "BDRS", "Unit Penunjang"],
        ["UK045", "Cathlab", "Unit Penunjang"],
        ["UK046", "Terang Bulan VIP VVIP", "Unit Pelayanan"],
        ["UK047", "Truntum", "Unit Pelayanan"],
        ["UK055", "IGD PONEK", "Unit Pelayanan"],
        ["UK056", "Klinik Kebid Kandungan", "Unit Pelayanan"],
        ["UK062", "Klinik Anak", "Unit Pelayanan"],
        ["UK063", "Klinik Penyakit Dalam", "Unit Pelayanan"],
        ["UK074", "IBS", "Unit Penunjang"],
        ["UK077", "Unit Diklat", "Administrasi Umum"],
      ];
      addTable(unitKerjaList[0], unitKerjaList.slice(1));

      addText("Catatan: Daftar lengkap 77 unit kerja (UK001-UK077) tersedia di database.", 8);
      yPosition += 5;

      // ==========================================
      // APPENDIX: CONTOH QUERY
      // ==========================================
      doc.addPage();
      yPosition = 20;
      addHeading("APPENDIX B: CONTOH QUERY PENTING", 1);

      addHeading("B.1. Total Biaya per Unit Kerja", 2);
      doc.setFontSize(8);
      doc.setFont("courier", "normal");
      checkPageBreak(30);
      const query1 = `SELECT 
  kode_unit_kerja,
  nama_unit_kerja,
  biaya_pegawai + biaya_bahan + biaya_jasa_pelayanan + 
  biaya_pemeliharaan + biaya_barang_jasa + 
  biaya_penyusutan + biaya_farmasi + 
  biaya_operasional_lainnya AS total_biaya
FROM data_biaya
WHERE tahun = 2025 AND user_id = auth.uid()
ORDER BY total_biaya DESC;`;
      query1.split('\n').forEach(line => {
        checkPageBreak();
        doc.text(line, margin + 2, yPosition);
        yPosition += 4;
      });
      yPosition += 5;

      addHeading("B.2. Cost Recovery Rate", 2);
      doc.setFontSize(8);
      const query2 = `SELECT 
  uk.nama,
  db.total_biaya,
  dp.total_pendapatan,
  (dp.total_pendapatan / NULLIF(db.total_biaya, 0)) 
    * 100 AS cost_recovery_rate
FROM unit_kerja uk
JOIN data_biaya db ON uk.kode = db.kode_unit_kerja
JOIN data_pendapatan dp ON uk.kode = dp.kode_unit_kerja 
  AND db.tahun = dp.tahun
WHERE uk.jenis = 'Pusat Pendapatan';`;
      query2.split('\n').forEach(line => {
        checkPageBreak();
        doc.text(line, margin + 2, yPosition);
        yPosition += 4;
      });
      yPosition += 5;

      addHeading("B.3. Top 10 Tindakan Termahal", 2);
      doc.setFontSize(8);
      const query3 = `SELECT 
  nama_unit_kerja,
  nama_tindakan,
  unit_cost_per_tindakan,
  biaya_bahan
FROM rekapitulasi_unit_cost
WHERE tahun = 2025
ORDER BY unit_cost_per_tindakan DESC
LIMIT 10;`;
      query3.split('\n').forEach(line => {
        checkPageBreak();
        doc.text(line, margin + 2, yPosition);
        yPosition += 4;
      });
      yPosition += 5;

      // ==========================================
      // PENUTUP
      // ==========================================
      addFooter(); // Footer untuk halaman terakhir sebelum penutup
      doc.addPage();
      yPosition = pageHeight / 2 - 30;
      
      doc.setFillColor(59, 130, 246); // Blue-500
      doc.rect(margin, yPosition - 10, maxWidth, 60, "F");
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(16);
      doc.setFont("times", "bold");
      doc.text("DOKUMENTASI SKEMA STRUKTUR", pageWidth / 2, yPosition + 5, { align: "center" });
      doc.text("DATABASE APLIKASI UNIT COST RS", pageWidth / 2, yPosition + 15, { align: "center" });
      
      doc.setFontSize(12);
      doc.setFont("helvetica", "normal");
      doc.text("Versi 1.0", pageWidth / 2, yPosition + 28, { align: "center" });
      doc.text(`Tanggal: ${new Date().toLocaleDateString("id-ID", { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      })}`, pageWidth / 2, yPosition + 36, { align: "center" });

      // Footer pada halaman penutup
      addFooter();

      // Save PDF
      doc.save("Dokumentasi_Skema_Struktur_Database_Aplikasi_Unit_Cost_RS.pdf");
      
      toast.success("PDF Dokumentasi Skema berhasil diunduh!");
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error("Gagal membuat PDF. Silakan coba lagi.");
    }
  };

  return (
    <Button
      onClick={generatePDF}
      className="w-full bg-blue-600 hover:bg-blue-700 text-white"
      size="lg"
    >
      <Download className="mr-2 h-5 w-5" />
      Unduh
    </Button>
  );
};

export default ModulDokumentasiSkemaStruktur;

