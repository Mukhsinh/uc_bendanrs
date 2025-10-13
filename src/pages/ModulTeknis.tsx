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
  ChevronRight
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
    title: "Modul Pelatihan Komprehensif",
    description: "Panduan lengkap penggunaan aplikasi dari awal sampai akhir. Mencakup login, navigasi, manajemen data master, kalkulasi unit cost, distribusi biaya, skenario tarif, laporan, dan troubleshooting. Cocok untuk pelatihan pengguna baru dan referensi harian.",
    version: "v1.0",
    lastUpdated: "2024-10-13",
    category: "Pelatihan",
    size: "5.8 MB",
    pages: 48,
    icon: <User className="h-8 w-8 text-purple-600" />,
    badge: "Baru!",
    badgeVariant: "default",
    downloadUrl: "/downloads/MODUL_PELATIHAN_KOMPREHENSIF.pdf"
  },
  {
    id: "gambaran-umum",
    title: "Modul Gambaran Umum Aplikasi Unit Cost",
    description: "Panduan lengkap tentang gambaran umum, latar belakang, tujuan, manfaat, dan arsitektur sistem Aplikasi Unit Cost Rumah Sakit. Mencakup teknologi yang digunakan, fitur utama, dan roadmap pengembangan.",
    version: "v1.0",
    lastUpdated: "2024-10-12",
    category: "Dokumentasi",
    size: "3.2 MB",
    pages: 28,
    icon: <BookOpen className="h-8 w-8 text-emerald-600" />,
    badge: "Update",
    badgeVariant: "secondary",
    downloadUrl: "/downloads/MODUL_GAMBARAN_UMUM_APLIKASI_UNIT_COST.pdf"
  },
  {
    id: "database-schema",
    title: "Dokumentasi Skema Struktur Database",
    description: "Dokumentasi lengkap tentang struktur database, tabel, relasi, dan prosedur dalam sistem Aplikasi Unit Cost Rumah Sakit. Mencakup 43+ tabel, views, stored procedures, dan metodologi Activity Based Costing.",
    version: "v1.0",
    lastUpdated: "2024-10-12",
    category: "Teknis",
    size: "4.5 MB",
    pages: 32,
    icon: <Database className="h-8 w-8 text-blue-600" />,
    badge: "Standar",
    badgeVariant: "secondary",
    downloadUrl: "/downloads/DOKUMENTASI_SKEMA_STRUKTUR_DATABASE.pdf"
  },
  {
    id: "role-access",
    title: "Modul Role Akses dan Privilege Sistem",
    description: "Panduan lengkap tentang struktur role, privilege, dan hak akses dalam sistem aplikasi Unit Cost Rumah Sakit. Mencakup 5 level role dengan detail permission matrix dan implementasi keamanan.",
    version: "v1.0",
    lastUpdated: "2024-10-12",
    category: "Sistem & Keamanan",
    size: "2.5 MB",
    pages: 24,
    icon: <Shield className="h-8 w-8 text-blue-600" />,
    badge: "Update",
    badgeVariant: "outline",
    downloadUrl: "/downloads/MODUL_ROLE_AKSES_DAN_PRIVILEGE_SISTEM.pdf"
  },
  {
    id: "user-management",
    title: "Panduan Manajemen User dan Administrasi",
    description: "Petunjuk lengkap untuk mengelola user, assign role, dan mengatur hak akses dalam sistem. Termasuk prosedur keamanan, best practices, dan troubleshooting administrasi.",
    version: "v1.0",
    lastUpdated: "2024-10-10",
    category: "Administrasi",
    size: "2.2 MB",
    pages: 22,
    icon: <Users className="h-8 w-8 text-green-600" />,
    badge: "Standar",
    badgeVariant: "secondary",
    downloadUrl: "/downloads/PANDUAN_MANAJEMEN_USER_DAN_ADMINISTRASI.pdf"
  },
  {
    id: "system-config",
    title: "Panduan Konfigurasi dan Maintenance Sistem",
    description: "Panduan konfigurasi sistem, maintenance rutin, backup, dan troubleshooting. Termasuk prosedur update, monitoring, dan optimasi performa sistem.",
    version: "v1.5",
    lastUpdated: "2024-10-05",
    category: "Teknis",
    size: "2.8 MB",
    pages: 26,
    icon: <Settings className="h-8 w-8 text-orange-600" />,
    badge: "Maintenance",
    badgeVariant: "destructive",
    downloadUrl: "/downloads/PANDUAN_KONFIGURASI_DAN_MAINTENANCE_SISTEM.pdf"
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
            <span>Terakhir Update: 13 Oktober 2024</span>
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
                Hak Cipta: 000831709 | Copyright © 2024 Mukhsin Hadi. Hak Cipta Dilindungi Undang-Undang
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
              Semua modul telah disusun dengan standar dokumentasi teknis yang tinggi
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