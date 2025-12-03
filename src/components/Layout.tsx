"use client";

import React, { Suspense, useMemo } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { Menu, LogOut, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { SidebarNav } from "@/components/SidebarNav";
import { useIsMobile } from "@/hooks/use-mobile";
import { toast } from "sonner";
import { SidebarToggleProvider } from "@/components/SidebarToggleContext";
import { useBrandingSettings } from "@/hooks/useBrandingSettings";
import { useAuth } from "@/contexts/AuthContext";
import { useTenant } from "@/contexts/TenantContext";
import { TenantBranding } from "@/components/TenantBranding";
import { ReportHeader, ReportToolbar } from "@/components/report";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface LayoutProps {
  children?: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const isMobile = useIsMobile();
  const [isSheetOpen, setIsSheetOpen] = React.useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { settings: brandingSettings } = useBrandingSettings();
  const { user, signOut, loading } = useAuth();
  const { tenant } = useTenant();

  const segmentLabelMap: Record<string, string> = {
    "data-master": "Data Master",
    "unit-kerja": "Unit Kerja",
    barang: "Barang Farmasi",
    "barang-gizi": "Barang Gizi",
    kamar: "Data Kamar",
    klinik: "Data Klinik",
    "data-dokter": "Data Dokter",
    "menu-gizi": "Menu Gizi",
    "daftar-tindakan": "Daftar Tindakan",
    "tindakan-lab": "Tindakan Laboratorium",
    "tindakan-radiologi": "Tindakan Radiologi",
    "tindakan-operatif": "Tindakan Operatif",
    "tindakan-bdrs": "Tindakan BDRS",
    "tindakan-cathlab": "Tindakan Cathlab",
    "data-operasional": "Data Operasional",
    kegiatan: "Data Kegiatan",
    "kegiatan-rs": "Data Kegiatan RS",
    pendapatan: "Data Pendapatan",
    biaya: "Data Biaya",
    "unit-penunjang": "Unit Penunjang",
    "kalkulasi-biaya-gizi": "Kalkulasi Biaya Gizi",
    "kalkulasi-biaya-laboratorium": "Kalkulasi Biaya Laboratorium",
    "kalkulasi-biaya-radiologi": "Kalkulasi Biaya Radiologi",
    "kalkulasi-biaya-bdrs": "Kalkulasi BDRS",
    "unit-keperawatan": "Unit Keperawatan",
    "manajemen-tindakan-inap": "Manajemen Tindakan Inap",
    "data-akomodasi-inap": "Data Akomodasi Inap",
    "kalkulasi-tindakan-inap": "Kalkulasi Tindakan Inap",
    "kalkulasi-biaya-kelas-akomodasi": "Kalkulasi Biaya Kelas Akomodasi",
    "unit-pelayanan": "Unit Pelayanan",
    "manajemen-tindakan-rawat-jalan": "Manajemen Tindakan Rawat Jalan",
    "kalkulasi-tindakan-rawat-jalan": "Kalkulasi Tindakan Rawat Jalan",
    "kalkulasi-pendaftaran-resep": "Kalkulasi Pendaftaran & Resep",
    "kalkulasi-biaya-operatif": "Kalkulasi Biaya Operatif",
    "kalkulasi-biaya-cathlab": "Kalkulasi Biaya Cathlab",
    "unit-diklat": "Unit Diklat",
    "kalkulasi-biaya-diklat": "Kalkulasi Biaya Diklat",
    "kalkulasi-aktivitas": "Kalkulasi Aktivitas Diklat",
    "rekapitulasi-unit-cost": "Rekapitulasi Unit Cost",
    "skenario-tarif-tindakan": "Skenario Tarif Tindakan",
    "skenario-tarif-akomodasi": "Skenario Tarif Akomodasi",
    "skenario-tarif-visit": "Skenario Tarif Visit",
    "distribusi-biaya": "Distribusi Biaya",
    "distribusi-biaya-pertama": "Distribusi Biaya Pertama",
    "distribusi-biaya-kedua": "Distribusi Biaya Kedua",
    "distribusi-biaya-rekap": "Distribusi Biaya Rekap",
    "analisis-revenue-cost": "Analisis Revenue Cost",
    "total-biaya-jp": "Total Biaya dengan JP",
    "cost-recovery": "Cost Recovery",
    "struktur-biaya": "Struktur Biaya",
    "proyeksi-pendapatan": "Proyeksi Pendapatan Layanan",
    "budgeting-bhp": "Budgeting BHP",
    rupiah: "Budgeting BHP (Rupiah)",
    rincian: "Budgeting BHP (Rincian)",
    "analisis-bisnis": "Analisis Bisnis",
    "produk-layanan": "Produk Layanan",
    "pola-remunerasi": "Pola Remunerasi",
    "pengaturan-umum": "Pengaturan Umum",
    "modul-teknis": "Modul Teknis",
    "manajemen-akses": "Manajemen Akses",
    "audit-trail": "Audit Trail",
    "pengelompokan-data": "Pengelompokan Data",
    "unit-pelayanan-lain": "Unit Pelayanan",
  };

  const formatSegment = (segment: string) => {
    if (!segment) return "";
    if (segmentLabelMap[segment]) return segmentLabelMap[segment];
    return segment
      .split("-")
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ");
  };

  const reportMeta = useMemo(() => {
    const path = location.pathname;
    if (path === "/" || path === "") {
      return null;
    }

    const segments = path.split("/").filter(Boolean);

    // Khusus halaman skenario tarif tindakan, tidak menampilkan ReportHeader global
    const lastSegment = segments[segments.length - 1];
    if (lastSegment === "skenario-tarif-tindakan") {
      return null;
    }

    const labels = segments.map(formatSegment);
    const title = labels.join(" · ");
    const subtitle =
      labels.length > 0
        ? `Laporan ${labels[labels.length - 1]}`
        : "Laporan sistem";

    return {
      title,
      subtitle,
      filename: segments.join("-") || "laporan",
    };
  }, [location.pathname]);

  const handleLinkClick = () => {
    if (isMobile) {
      // Pastikan menu mobile tertutup dengan satu klik
      setTimeout(() => {
        setIsSheetOpen(false);
      }, 100); // Small delay to ensure click is processed
    }
  };

  const handleLogout = async () => {
    const error = await signOut();
    if (error) {
      toast.error("Gagal logout: " + error.message);
    } else {
      navigate("/login");
      toast.success("Berhasil logout");
    }
  };

  return (
    <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
      {/* Desktop Sidebar */}
      <div className="hidden bg-sidebar md:block will-change-transform">
        <div className="flex h-full max-h-screen flex-col gap-2">
          <div className="flex h-14 items-center px-4 lg:h-[60px] lg:px-6">
            <Link to="/" className="flex items-center gap-2 font-semibold text-sidebar-foreground">
              <div className="flex items-center gap-2">
                {brandingSettings.logo_url && (
                  <img
                    src={brandingSettings.logo_url}
                    alt={brandingSettings.logo_alt_text}
                    className="h-8 w-8 object-contain"
                  />
                )}
                <span className="text-2xl font-bold">{brandingSettings.app_title}</span>
              </div>
            </Link>
          </div>
          <div className="flex-1">
            <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
              <SidebarNav onLinkClick={handleLinkClick} />
            </nav>
          </div>
          <div className="p-4">
            <Button
              variant="outline" 
              className="w-full justify-start bg-teal-600 text-white border-teal-600 hover:bg-teal-500 hover:text-white"
              onClick={handleLogout}
              disabled={loading}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex flex-col min-h-screen bg-gradient-to-br from-teal-50 to-cyan-50 transition-colors will-change-transform">
        {/* Mobile Header */}
        <header className="flex h-14 items-center gap-4 border-b bg-sidebar px-4 lg:h-[60px] lg:px-6 md:hidden will-change-transform">
          <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="shrink-0 md:hidden"
              >
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle navigation menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="flex flex-col bg-sidebar">
              <Link to="/" className="flex items-center gap-2 font-semibold text-lg text-sidebar-foreground">
                <div className="flex items-center gap-2">
                  {brandingSettings.logo_url && (
                    <img
                      src={brandingSettings.logo_url}
                      alt={brandingSettings.logo_alt_text}
                      className="h-7 w-7 object-contain"
                    />
                  )}
                  <span className="font-bold text-xl">{brandingSettings.app_title}</span>
                </div>
              </Link>
              <nav className="grid gap-2 text-lg font-medium mt-4">
                <SidebarNav isMobile onLinkClick={handleLinkClick} />
              </nav>
              <div className="mt-auto pt-4">
                <Button
                  variant="outline" 
                  className="w-full justify-start bg-teal-600 text-white border-teal-600 hover:bg-teal-500 hover:text-white"
                  onClick={handleLogout}
                  disabled={loading}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </Button>
              </div>
            </SheetContent>
          </Sheet>
          <Link to="/" className="flex items-center gap-2 font-semibold text-lg text-sidebar-foreground">
            <span className="font-bold">PINTAR UC</span>
          </Link>
          <Button
            variant="ghost" 
            size="icon"
            className="ml-auto text-white hover:bg-white/20"
            onClick={handleLogout}
            disabled={loading}
          >
            <LogOut className="h-5 w-5" />
          </Button>
        </header>

        {/* Header dengan nama user dan tenant branding */}
        <header className="hidden md:flex h-14 items-center justify-between border-b bg-sidebar px-6 shadow-sm will-change-transform">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setIsSheetOpen(true)}
              className="lg:hidden"
            >
              <Menu className="h-5 w-5" />
            </Button>
            {/* Tenant Branding - Tenant selector dipindahkan ke halaman Manajemen Akses */}
            <TenantBranding showLogo={true} showName={true} className="ml-2" />
          </div>
          
          <div className="flex items-center gap-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-auto px-3 py-1.5 rounded-full bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 text-white shadow-lg border border-teal-500/20">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-full bg-white/20 backdrop-blur-sm">
                      <User className="h-4 w-4" />
                    </div>
                    <div className="text-left">
                      <div className="text-sm font-semibold">
                        {user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User'}
                      </div>
                      <div className="text-xs text-teal-100/80">
                        {user?.email?.split('@')[1] || ''}
                      </div>
                    </div>
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-64" align="end" forceMount>
                <DropdownMenuLabel className="font-normal bg-gradient-to-r from-teal-50 to-teal-100 border-b border-teal-200/50">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 rounded-full bg-gradient-to-r from-teal-600 to-teal-700">
                      <User className="h-4 w-4 text-white" />
                    </div>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-semibold leading-none text-teal-900">
                        {user?.user_metadata?.full_name || 'User'}
                      </p>
                      <p className="text-xs leading-none text-teal-600">
                        {user?.email}
                      </p>
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50 focus:text-red-700 focus:bg-red-50"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Page Content */}
        <SidebarToggleProvider onOpen={() => setIsSheetOpen(true)}>
          <main className="flex flex-1 flex-col gap-6 p-4 lg:gap-8 lg:p-6 bg-transparent">
            {reportMeta && (
              <ReportHeader title={reportMeta.title} subtitle={reportMeta.subtitle} />
            )}
            <Suspense fallback={<div className="flex flex-1 items-center justify-center text-teal-800"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600 mr-3"></div><span>Memuat konten...</span></div>}>
              {children || <Outlet />}
            </Suspense>
          </main>
        </SidebarToggleProvider>
      </div>
    </div>
  );
};

export default Layout;