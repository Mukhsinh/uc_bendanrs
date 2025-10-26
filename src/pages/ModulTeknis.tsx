import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Download, 
  FileText, 
  Shield, 
  Users, 
  Database, 
  Settings,
  Calendar,
  User,
  BookOpen,
  ChevronRight,
  Calculator,
  BarChart3,
  AlertTriangle
} from "lucide-react";
import { downloadModulPDF } from "@/utils/pdfGenerator";

interface Modul {
  id: string;
  title: string;
  description: string;
  version: string;
  lastUpdated: string;
  category: string;
  size: string;
  pages: number;
  icon: React.ReactNode;
  badge: string;
  badgeVariant: "default" | "secondary" | "outline" | "destructive";
  downloadUrl: string;
}

const moduls: Modul[] = [
  {
    id: "modul-pelatihan",
    title: "Modul Pelatihan Komprehensif Aplikasi Unit Cost RS",
    description: "Panduan lengkap penggunaan aplikasi dari awal sampai akhir. Mencakup login, navigasi, manajemen data master, kalkulasi unit cost, distribusi biaya, skenario tarif, laporan, dan troubleshooting. Cocok untuk pelatihan pengguna baru dan referensi harian. Dilengkapi dengan screenshot, step-by-step guide, dan best practices.",
    version: "v2.0",
    lastUpdated: "2025-01-15",
    category: "Pelatihan",
    size: "8.2 MB",
    pages: 68,
    icon: <User className="h-8 w-8 text-purple-600" />,
    badge: "Terbaru!",
    badgeVariant: "default",
    downloadUrl: "/downloads/MODUL_PELATIHAN_KOMPREHENSIF_APLIKASI_UNIT_COST_RS_v2.0.pdf"
  },
  {
    id: "gambaran-umum",
    title: "Modul Gambaran Umum dan Arsitektur Sistem Unit Cost RS",
    description: "Panduan lengkap tentang gambaran umum, latar belakang, tujuan, manfaat, dan arsitektur sistem Aplikasi Unit Cost Rumah Sakit. Mencakup teknologi yang digunakan, fitur utama, roadmap pengembangan, dan metodologi Activity Based Costing dengan pendekatan Double Distribution.",
    version: "v2.0",
    lastUpdated: "2025-01-15",
    category: "Dokumentasi",
    size: "5.8 MB",
    pages: 42,
    icon: <BookOpen className="h-8 w-8 text-emerald-600" />,
    badge: "Update",
    badgeVariant: "secondary",
    downloadUrl: "/downloads/MODUL_GAMBARAN_UMUM_DAN_ARSITEKTUR_SISTEM_UNIT_COST_RS_v2.0.pdf"
  },
  {
    id: "database-schema",
    title: "Dokumentasi Lengkap Skema Struktur Database Unit Cost RS",
    description: "Dokumentasi komprehensif tentang struktur database, tabel, relasi, dan prosedur dalam sistem Aplikasi Unit Cost Rumah Sakit. Mencakup 77 tabel, 285 fungsi, 248 trigger, 17 view, 280 RLS policies, dan metodologi Activity Based Costing. Dilengkapi dengan diagram ERD dan penjelasan relasi antar tabel.",
    version: "v2.0",
    lastUpdated: "2025-01-15",
    category: "Teknis",
    size: "12.5 MB",
    pages: 85,
    icon: <Database className="h-8 w-8 text-blue-600" />,
    badge: "Komprehensif",
    badgeVariant: "default",
    downloadUrl: "/downloads/DOKUMENTASI_LENGKAP_SKEMA_STRUKTUR_DATABASE_UNIT_COST_RS_v2.0.pdf"
  },
  {
    id: "role-access",
    title: "Modul Role Akses dan Privilege Sistem Unit Cost RS",
    description: "Panduan lengkap tentang struktur role, privilege, dan hak akses dalam sistem aplikasi Unit Cost Rumah Sakit. Mencakup 5 level role dengan detail permission matrix, implementasi keamanan, RLS policies, dan best practices untuk manajemen akses. Dilengkapi dengan contoh konfigurasi dan troubleshooting.",
    version: "v2.0",
    lastUpdated: "2025-01-15",
    category: "Sistem & Keamanan",
    size: "4.2 MB",
    pages: 38,
    icon: <Shield className="h-8 w-8 text-blue-600" />,
    badge: "Update",
    badgeVariant: "outline",
    downloadUrl: "/downloads/MODUL_ROLE_AKSES_DAN_PRIVILEGE_SISTEM_UNIT_COST_RS_v2.0.pdf"
  },
  {
    id: "user-management",
    title: "Panduan Manajemen User dan Administrasi Sistem Unit Cost RS",
    description: "Petunjuk lengkap untuk mengelola user, assign role, dan mengatur hak akses dalam sistem. Termasuk prosedur keamanan, best practices, troubleshooting administrasi, dan panduan untuk Super Admin. Dilengkapi dengan workflow approval dan audit trail.",
    version: "v2.0",
    lastUpdated: "2025-01-15",
    category: "Administrasi",
    size: "3.8 MB",
    pages: 35,
    icon: <Users className="h-8 w-8 text-green-600" />,
    badge: "Update",
    badgeVariant: "secondary",
    downloadUrl: "/downloads/PANDUAN_MANAJEMEN_USER_DAN_ADMINISTRASI_SISTEM_UNIT_COST_RS_v2.0.pdf"
  },
  {
    id: "system-config",
    title: "Panduan Konfigurasi dan Maintenance Sistem Unit Cost RS",
    description: "Panduan konfigurasi sistem, maintenance rutin, backup, dan troubleshooting. Termasuk prosedur update, monitoring, optimasi performa sistem, dan disaster recovery. Dilengkapi dengan checklist maintenance dan monitoring dashboard.",
    version: "v2.0",
    lastUpdated: "2025-01-15",
    category: "Teknis",
    size: "4.5 MB",
    pages: 42,
    icon: <Settings className="h-8 w-8 text-orange-600" />,
    badge: "Update",
    badgeVariant: "destructive",
    downloadUrl: "/downloads/PANDUAN_KONFIGURASI_DAN_MAINTENANCE_SISTEM_UNIT_COST_RS_v2.0.pdf"
  },
  {
    id: "kalkulasi-biaya",
    title: "Panduan Kalkulasi Biaya dan Unit Cost Rumah Sakit",
    description: "Panduan komprehensif untuk melakukan kalkulasi biaya dan unit cost menggunakan metodologi Activity Based Costing. Mencakup kalkulasi biaya gizi, akomodasi, laboratorium, operatif, radiologi, dan tindakan medis. Dilengkapi dengan contoh perhitungan dan formula yang digunakan.",
    version: "v2.0",
    lastUpdated: "2025-01-15",
    category: "Kalkulasi",
    size: "6.8 MB",
    pages: 58,
    icon: <Calculator className="h-8 w-8 text-indigo-600" />,
    badge: "Baru!",
    badgeVariant: "default",
    downloadUrl: "/downloads/PANDUAN_KALKULASI_BIAYA_DAN_UNIT_COST_RUMAH_SAKIT_v2.0.pdf"
  },
  {
    id: "distribusi-biaya",
    title: "Panduan Distribusi Biaya Double Distribution Method",
    description: "Panduan lengkap untuk melakukan distribusi biaya menggunakan metode Double Distribution. Mencakup distribusi biaya tahap pertama dan kedua, step-down method, dasar alokasi, dan rekapitulasi. Dilengkapi dengan contoh perhitungan dan analisis hasil distribusi.",
    version: "v2.0",
    lastUpdated: "2025-01-15",
    category: "Distribusi",
    size: "5.2 MB",
    pages: 48,
    icon: <BarChart3 className="h-8 w-8 text-teal-600" />,
    badge: "Baru!",
    badgeVariant: "default",
    downloadUrl: "/downloads/PANDUAN_DISTRIBUSI_BIAYA_DOUBLE_DISTRIBUTION_METHOD_v2.0.pdf"
  },
  {
    id: "laporan-analisis",
    title: "Panduan Laporan dan Analisis Unit Cost RS",
    description: "Panduan lengkap untuk membuat laporan dan analisis unit cost rumah sakit. Mencakup rekapitulasi unit cost, cost recovery, budgeting BHP, skenario tarif, dan analisis performa. Dilengkapi dengan template laporan dan interpretasi hasil analisis.",
    version: "v2.0",
    lastUpdated: "2025-01-15",
    category: "Laporan",
    size: "4.8 MB",
    pages: 45,
    icon: <FileText className="h-8 w-8 text-rose-600" />,
    badge: "Baru!",
    badgeVariant: "default",
    downloadUrl: "/downloads/PANDUAN_LAPORAN_DAN_ANALISIS_UNIT_COST_RS_v2.0.pdf"
  },
  {
    id: "troubleshooting",
    title: "Panduan Troubleshooting dan FAQ Sistem Unit Cost RS",
    description: "Panduan troubleshooting untuk mengatasi masalah umum dalam sistem. Mencakup error handling, performance optimization, data validation, dan FAQ yang sering ditanyakan. Dilengkapi dengan solusi step-by-step dan contact support.",
    version: "v2.0",
    lastUpdated: "2025-01-15",
    category: "Troubleshooting",
    size: "3.2 MB",
    pages: 32,
    icon: <AlertTriangle className="h-8 w-8 text-red-600" />,
    badge: "Baru!",
    badgeVariant: "outline",
    downloadUrl: "/downloads/PANDUAN_TROUBLESHOOTING_DAN_FAQ_SISTEM_UNIT_COST_RS_v2.0.pdf"
  }
];

const getCategoryIcon = (category: string) => {
  switch (category) {
    case "Pelatihan":
      return <User className="h-4 w-4 text-purple-500" />;
    case "Dokumentasi":
      return <BookOpen className="h-4 w-4 text-emerald-500" />;
    case "Sistem & Keamanan":
      return <Shield className="h-4 w-4 text-blue-500" />;
    case "Administrasi":
      return <Users className="h-4 w-4 text-green-500" />;
    case "Teknis":
      return <Settings className="h-4 w-4 text-purple-500" />;
    case "Kalkulasi":
      return <Calculator className="h-4 w-4 text-indigo-500" />;
    case "Distribusi":
      return <BarChart3 className="h-4 w-4 text-teal-500" />;
    case "Laporan":
      return <FileText className="h-4 w-4 text-rose-500" />;
    case "Troubleshooting":
      return <AlertTriangle className="h-4 w-4 text-red-500" />;
    default:
      return <FileText className="h-4 w-4 text-gray-500" />;
  }
};

export default function ModulTeknis() {
  const handleDownload = (modul: Modul) => {
    try {
      // Generate and download PDF using the PDF generator
      downloadModulPDF(modul.id);
    } catch (error) {
      console.error('Error generating PDF:', error);
      // Fallback to simple download
      const link = document.createElement('a');
      link.href = modul.downloadUrl;
      link.download = `${modul.title}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-3">
          <BookOpen className="h-10 w-10 text-blue-600" />
          <h1 className="text-4xl font-bold text-gray-900">Modul Teknis</h1>
        </div>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          Kumpulan dokumentasi teknis, panduan sistem, dan modul pembelajaran untuk Aplikasi Unit Cost Rumah Sakit
        </p>
        <div className="flex items-center justify-center gap-6 text-sm text-gray-500">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            <span>{moduls.length} Modul Tersedia</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <span>Terakhir Update: 15 Januari 2025</span>
          </div>
        </div>
      </div>

      {/* Author Info */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-100 rounded-full">
              <User className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Penulis & Pengembang</h3>
              <p className="text-sm text-gray-600">
                <strong>MUKHSIN HADI, SE, M.Si, CGAA, CPFRM, CSEP, CRP, CPRM, CSCAP, CPABC</strong>
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Hak Cipta: 000831709 | Copyright © 2025 Mukhsin Hadi. Hak Cipta Dilindungi Undang-Undang
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Modul Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {moduls.map((modul) => (
          <Card key={modul.id} className="group hover:shadow-lg transition-all duration-300 border-l-4 border-l-blue-500">
            <CardHeader className="pb-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gray-100 rounded-lg group-hover:bg-blue-100 transition-colors">
                    {modul.icon}
                  </div>
                  <div>
                    <CardTitle className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                      {modul.title}
                    </CardTitle>
                    <div className="flex items-center gap-2 mt-1">
                      {getCategoryIcon(modul.category)}
                      <span className="text-sm text-gray-500">{modul.category}</span>
                    </div>
                  </div>
                </div>
                <Badge variant={modul.badgeVariant} className="text-xs">
                  {modul.badge}
                </Badge>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <CardDescription className="text-gray-600 leading-relaxed">
                {modul.description}
              </CardDescription>
              
              <div className="grid grid-cols-2 gap-4 text-sm text-gray-500">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  <span>{modul.pages} halaman</span>
                </div>
                <div className="flex items-center gap-2">
                  <Download className="h-4 w-4" />
                  <span>{modul.size}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>{modul.lastUpdated}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  <span>{modul.version}</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between pt-4 border-t">
                <div className="text-xs text-gray-400">
                  Klik untuk mengunduh modul
                </div>
                <Button 
                  onClick={() => handleDownload(modul)}
                  className="group/btn flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Download className="h-4 w-4" />
                  Unduh
                  <ChevronRight className="h-4 w-4 group-hover/btn:translate-x-1 transition-transform" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Footer Info */}
      <Card className="bg-gray-50 border-gray-200">
        <CardContent className="pt-6">
          <div className="text-center space-y-2">
            <p className="text-sm text-gray-600">
              Semua modul telah disusun dengan standar dokumentasi teknis yang tinggi dan layak terbit
            </p>
            <p className="text-xs text-gray-500">
              Untuk pertanyaan teknis atau permintaan modul tambahan, hubungi administrator sistem
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}