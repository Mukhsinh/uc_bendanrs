"use client";

import React, { useEffect, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  Database,
  Briefcase,
  Package,
  Activity,
  Wallet,
  Landmark,
  Calculator,
  Utensils,
  Bed,
  Stethoscope,
  Scissors,
  Microscope,
  Scan,
  Heart,
  GraduationCap,
  BarChart3,
  FileText,
  Home,
  Droplet,
  ActivitySquare,
  Settings,
  Users,
  Building,
  BookOpen,
  PieChart,
  TrendingUp,
  CreditCard,
  ShoppingCart,
  BookOpenCheck,
  Shield,
} from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { supabase } from "@/integrations/supabase/client";

interface NavItem {
  title: string;
  href?: string;
  icon?: React.ElementType;
  subItems?: NavItem[];
  allowedRoles?: string[]; // Roles yang diizinkan mengakses menu ini
}

const navItems: NavItem[] = [
  {
    title: "Dashboard",
    icon: Home,
    href: "/",
  },
  {
    title: "Data Master",
    icon: Database,
    allowedRoles: ["Super Admin", "Admin"], // Sesuai gambar: Admin bisa akses semua kecuali Modul Teknis & Manajemen Akses
    subItems: [
      { title: "Data Unit Kerja", href: "/data-master/unit-kerja", icon: Briefcase },
      { title: "Barang Farmasi", href: "/data-master/barang", icon: Package },
      { title: "Barang Gizi", href: "/data-master/barang-gizi", icon: Utensils },
      { title: "Data Kamar", href: "/data-master/kamar", icon: Bed },
      { title: "Data Klinik", href: "/data-master/klinik", icon: Stethoscope },
      { title: "Data Dokter", href: "/data-master/data-dokter", icon: Users },
      { title: "Menu Gizi", href: "/data-master/menu-gizi", icon: Utensils },
      { title: "Daftar Tindakan", href: "/data-master/daftar-tindakan", icon: Scissors },
      { title: "Tindakan Laboratorium", href: "/data-master/tindakan-lab", icon: Microscope },
      { title: "Tindakan Radiologi", href: "/data-master/tindakan-radiologi", icon: Scan },
      { title: "Tindakan Operatif", href: "/data-master/tindakan-operatif", icon: Scissors },
      { title: "Tindakan BDRS", href: "/data-master/tindakan-bdrs", icon: Droplet },
      { title: "Tindakan Cathlab", href: "/data-master/tindakan-cathlab", icon: ActivitySquare },
    ],
  },
  {
    title: "Data Operasional",
    icon: Settings,
    allowedRoles: ["Super Admin", "Admin"], // Sesuai gambar: Admin bisa akses semua kecuali Modul Teknis & Manajemen Akses
    subItems: [
      { title: "Data Kegiatan RS", href: "/data-operasional/kegiatan-rs", icon: ActivitySquare },
      { title: "Data Pendapatan", href: "/data-operasional/pendapatan", icon: Wallet },
      { title: "Data Biaya", href: "/data-operasional/biaya", icon: Landmark },
    ],
  },
  {
    title: "Unit Penunjang",
    icon: Building,
    allowedRoles: ["Super Admin", "Admin", "Operator", "Operator Penunjang"], // Sesuai gambar: Admin bisa akses semua kecuali Modul Teknis & Manajemen Akses
    subItems: [
      { title: "Kalkulasi Biaya Gizi", href: "/kalkulasi-biaya-gizi", icon: Utensils },
      { title: "Kalkulasi Biaya Laboratorium", href: "/kalkulasi-biaya-laboratorium", icon: Microscope },
      { title: "Kalkulasi Biaya Radiologi", href: "/kalkulasi-biaya-radiologi", icon: Scan },
      { title: "Kalkulasi BDRS", href: "/kalkulasi-biaya-bdrs", icon: Droplet },
    ],
  },
    {
      title: "Unit Keperawatan",
      icon: Users,
      allowedRoles: ["Super Admin", "Admin", "Operator", "Operator Keperawatan"], // Sesuai gambar: Admin bisa akses semua kecuali Modul Teknis & Manajemen Akses
      subItems: [
        { title: "Manajemen Tindakan Inap", href: "/keperawatan/manajemen-tindakan-inap", icon: Scissors },
        { title: "Data Akomodasi Inap", href: "/keperawatan/data-akomodasi-inap", icon: Utensils },
        { title: "Kalkulasi Tindakan Inap", href: "/keperawatan/kalkulasi-tindakan-inap", icon: Calculator },
        { title: "Kalkulasi Biaya Kelas Akomodasi", href: "/keperawatan/kalkulasi-biaya-kelas-akomodasi", icon: Bed },
      ],
    },
  {
    title: "Unit Pelayanan",
    icon: Activity,
    allowedRoles: ["Super Admin", "Admin", "Operator", "Operator Pelayanan"], // Sesuai gambar: Admin bisa akses semua kecuali Modul Teknis & Manajemen Akses
    subItems: [
      { title: "Manajemen Tindakan Rawat Jalan", href: "/pelayanan/manajemen-tindakan-rawat-jalan", icon: Scissors },
      { title: "Kalkulasi Tindakan Rawat Jalan", href: "/pelayanan/kalkulasi-tindakan-rawat-jalan", icon: Calculator },
      { title: "Kalkulasi Pendaftaran dan Peresepan", href: "/pelayanan/kalkulasi-pendaftaran-resep", icon: FileText },
      { title: "Kalkulasi Biaya Operatif", href: "/kalkulasi-biaya-operatif", icon: Scissors },
      { title: "Kalkulasi Biaya Cathlab", href: "/kalkulasi-biaya-cathlab", icon: Heart },
    ],
  },
  {
    title: "Unit Diklat",
    icon: BookOpen,
    subItems: [
      { title: "Kalkulasi Biaya Diklat", href: "/kalkulasi-biaya-diklat", icon: GraduationCap },
      { title: "Kalkulasi Aktivitas Diklat", href: "/unit-diklat/kalkulasi-aktivitas", icon: Calculator },
    ],
  },
  {
    title: "Rekapitulasi Unit Cost",
    icon: BarChart3,
    href: "/rekapitulasi-unit-cost",
    allowedRoles: ["Super Admin", "Admin", "Manager", "Viewer"], // Menu laporan bisa diakses oleh Manager dan Viewer
  },
  // Produk Layanan dipindah ke bawah Budgeting BHP
  {
    title: "Skenario Tarif",
    icon: FileText,
    allowedRoles: ["Super Admin", "Admin", "Manager", "Viewer"], // Menu laporan bisa diakses oleh Manager dan Viewer
    subItems: [
      { title: "Skenario Tarif Tindakan", href: "/skenario-tarif-tindakan", icon: FileText },
      { title: "Skenario Tarif Akomodasi", href: "/skenario-tarif-akomodasi", icon: Bed },
      { title: "Skenario Tarif Visit & Konsultasi", href: "/skenario-tarif-visit", icon: Stethoscope },
    ],
  },
  {
    title: "Distribusi Biaya",
    icon: TrendingUp,
    allowedRoles: ["Super Admin", "Admin", "Manager", "Viewer"], // Menu laporan bisa diakses oleh Manager dan Viewer
    subItems: [
      { title: "Distribusi Biaya Pertama", href: "/distribusi-biaya-pertama", icon: TrendingUp },
      { title: "Distribusi Biaya Kedua", href: "/distribusi-biaya-kedua", icon: TrendingUp },
      { title: "Distribusi Biaya Rekap", href: "/distribusi-biaya-rekap", icon: TrendingUp },
    ],
  },
  {
    title: "Analisis Revenue Cost",
    icon: PieChart,
    allowedRoles: ["Super Admin", "Admin", "Manager", "Viewer"], // Menu laporan bisa diakses oleh Manager dan Viewer
    subItems: [
      { title: "Cost Recovery", href: "/cost-recovery", icon: PieChart },
      { title: "Struktur Biaya", href: "/analisis-revenue-cost/struktur-biaya", icon: BarChart3 },
    ],
  },
        {
          title: "Budgeting BHP",
          icon: Package,
          allowedRoles: ["Super Admin", "Admin", "Manager", "Viewer"], // Menu laporan bisa diakses oleh Manager dan Viewer
          subItems: [
            { title: "Budgeting BHP (Rupiah)", href: "/budgeting-bhp/rupiah", icon: CreditCard },
            { title: "Budgeting BHP (Rincian)", href: "/budgeting-bhp/rincian", icon: FileText },
          ],
        },
  {
    title: "Analisis Bisnis",
    icon: TrendingUp,
    allowedRoles: ["Super Admin", "Admin", "Manager", "Viewer"], // Menu laporan bisa diakses oleh Manager dan Viewer
    subItems: [
      { title: "Produk Layanan", href: "/produk-layanan", icon: ShoppingCart },
      { title: "Pola Remunerasi", href: "/pola-remunerasi", icon: PieChart },
    ],
  },
  {
    title: "Modul Teknis",
    icon: BookOpenCheck,
    href: "/modul-teknis",
    allowedRoles: ["Super Admin"], // Hanya Super Admin yang bisa akses
  },
  {
    title: "Manajemen Akses",
    icon: Shield,
    href: "/manajemen-akses",
    allowedRoles: ["Super Admin"], // Hanya Super Admin yang bisa akses
  },
  {
    title: "Audit Trail",
    icon: FileText,
    href: "/audit-trail",
    allowedRoles: ["Super Admin"], // Hanya Super Admin yang bisa akses
  },
];

interface SidebarNavProps extends React.HTMLAttributes<HTMLDivElement> {
  isMobile?: boolean;
  onLinkClick?: () => void;
}

export function SidebarNav({ isMobile = false, onLinkClick, className, ...props }: SidebarNavProps) {
  const location = useLocation();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [filteredNavItems, setFilteredNavItems] = useState<NavItem[]>(navItems);
  const [openGroup, setOpenGroup] = useState<string | undefined>(undefined);

  useEffect(() => {
    getUserRole();
  }, []);

  const getUserRole = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        // Cek jika superadmin
        const { data: isSuperadmin } = await supabase.rpc('is_superadmin', { check_user_id: user.id });
        
        if (isSuperadmin) {
          setUserRole("Super Admin");
          setFilteredNavItems(navItems); // Super Admin bisa akses semua
          return;
        }

        // Ambil role dari user_roles table dengan join ke role_akses_aplikasi
        const { data: userRoles } = await supabase
          .from('user_roles')
          .select(`
            role_akses_aplikasi!inner(role_name)
          `)
          .eq('user_id', user.id)
          .eq('is_active', true)
          .single();

        if (userRoles && userRoles.role_akses_aplikasi) {
          const roleName = (userRoles.role_akses_aplikasi as any).role_name;
          setUserRole(roleName);
          // Filter menu berdasarkan role
          const filtered = navItems.filter(item => {
            // Jika item tidak punya allowedRoles, berarti semua role bisa akses
            if (!item.allowedRoles || item.allowedRoles.length === 0) {
              return true;
            }
            // Jika item punya allowedRoles, cek apakah user role ada di list
            return item.allowedRoles.includes(roleName);
          });
          setFilteredNavItems(filtered);
        } else {
          // Default: tampilkan semua menu kecuali yang restricted
          const filtered = navItems.filter(item => !item.allowedRoles || item.allowedRoles.length === 0);
          setFilteredNavItems(filtered);
        }
      }
    } catch (error) {
      console.error("Error getting user role:", error);
      // Fallback: tampilkan semua menu kecuali yang restricted
      const filtered = navItems.filter(item => !item.allowedRoles || item.allowedRoles.length === 0);
      setFilteredNavItems(filtered);
    }
  };

  // Prefetch halaman saat hover agar modul sudah siap sebelum diklik
  const prefetchRoute = (path?: string) => {
    if (!path) return;
    // Map beberapa rute ke dynamic import yang sama seperti di App.tsx
    const routeMap: Record<string, () => Promise<unknown>> = {
      "/": () => import("@/pages/Index"),
      "/manajemen-akses": () => import("@/pages/ManajemenAkses"),
      "/modul-teknis": () => import("@/pages/ModulTeknis"),
      "/rekapitulasi-unit-cost": () => import("@/pages/RekapitulasiUnitCost"),
      "/produk-layanan": () => import("@/pages/ProdukLayanan"),
      "/pola-remunerasi": () => import("@/pages/PolaRemunerasi"),
      "/cost-recovery": () => import("@/pages/CostRecovery"),
      "/budgeting-bhp/rupiah": () => import("@/pages/BudgetingBHPRupiah"),
      "/budgeting-bhp/rincian": () => import("@/pages/BudgetingBHPRincian"),
      "/distribusi-biaya-pertama": () => import("@/pages/DistribusiBiayaPertama"),
      "/distribusi-biaya-kedua": () => import("@/pages/DistribusiBiayaKedua"),
      "/distribusi-biaya-rekap": () => import("@/pages/DistribusiBiayaRekap"),
      "/kalkulasi-biaya-gizi": () => import("@/pages/KalkulasiBiayaGizi"),
      "/kalkulasi-biaya-laboratorium": () => import("@/pages/KalkulasiBiayaLaboratorium"),
      "/kalkulasi-biaya-radiologi": () => import("@/pages/KalkulasiBiayaRadiologi"),
      "/kalkulasi-biaya-bdrs": () => import("@/pages/KalkulasiBiayaBDRS"),
      "/pelayanan/manajemen-tindakan-rawat-jalan": () => import("@/pages/ManajemenTindakanRawatJalan"),
      "/pelayanan/kalkulasi-tindakan-rawat-jalan": () => import("@/pages/KalkulasiTindakanRawatJalan"),
      "/pelayanan/kalkulasi-pendaftaran-resep": () => import("@/pages/KalkulasiPendaftaranDanPeresepan"),
      "/kalkulasi-biaya-operatif": () => import("@/pages/KalkulasiBiayaOperatif"),
      "/kalkulasi-biaya-cathlab": () => import("@/pages/KalkulasiBiayaCathlab"),
      "/keperawatan/manajemen-tindakan-inap": () => import("@/pages/ManajemenTindakanInap"),
      "/keperawatan/kalkulasi-tindakan-inap": () => import("@/pages/KalkulasiTindakanInap"),
      "/keperawatan/kalkulasi-biaya-kelas-akomodasi": () => import("@/pages/KalkulasiBiayaKelasAkomodasi"),
      "/keperawatan/data-akomodasi-inap": () => import("@/pages/AlokasiBiayaGizi"),
      "/data-master/unit-kerja": () => import("@/pages/DataUnitKerja"),
      "/data-master/barang": () => import("@/pages/DataBarang"),
      "/data-master/barang-gizi": () => import("@/pages/DataBarangGizi"),
      "/data-master/kamar": () => import("@/pages/DataKamar"),
      "/data-master/klinik": () => import("@/pages/DataKlinik"),
      "/data-master/kegiatan": () => import("@/pages/DataKegiatan"),
      "/data-operasional/kegiatan": () => import("@/pages/DataKegiatan"),
      "/data-operasional/kegiatan-rs": () => import("@/pages/DataKegiatanRS"),
      "/data-master/pendapatan": () => import("@/pages/DataPendapatan"),
      "/data-master/biaya": () => import("@/pages/DataBiaya"),
      "/data-master/menu-gizi": () => import("@/pages/MenuGizi"),
      "/data-master/daftar-tindakan": () => import("@/pages/DataTindakan"),
      "/data-master/tindakan-lab": () => import("@/pages/DataTindakanLaboratorium"),
      "/data-master/tindakan-radiologi": () => import("@/pages/DataTindakanRadiologi"),
      "/data-master/tindakan-operatif": () => import("@/pages/DataTindakanOperatif"),
      "/data-master/tindakan-bdrs": () => import("@/pages/DataTindakanBDRS"),
      "/data-master/tindakan-cathlab": () => import("@/pages/DataTindakanCathlab"),
      "/skenario-tarif-tindakan": () => import("@/pages/SkenarioTarif"),
      "/skenario-tarif-akomodasi": () => import("@/pages/SkenarioTarifAkomodasi"),
      "/skenario-tarif-visit": () => import("@/pages/SkenarioTarifVisit"),
      "/kalkulasi-biaya-diklat": () => import("@/pages/KalkulasiBiayaDiklat"),
      "/unit-diklat/kalkulasi-aktivitas": () => import("@/pages/KalkulasiAktivitasDiklat"),
      "/analisis-revenue-cost/struktur-biaya": () => import("@/pages/StrukturBiaya"),
    };
    const importer = routeMap[path];
    if (importer) importer().catch(() => {});
  };

  const renderLink = (item: NavItem) => (
    <NavLink
      key={item.title}
      to={item.href || "#"}
      className={({ isActive }) =>
        cn(
          "flex items-center gap-3 rounded-lg px-3 py-2 text-white transition-all hover:text-teal-200 hover:bg-teal-700",
          isActive && "bg-teal-700 text-white",
          isMobile && "text-base",
        )
      }
      onClick={isMobile ? onLinkClick : undefined}
      onMouseEnter={() => prefetchRoute(item.href)}
    >
      {item.icon && <item.icon className="h-4 w-4 flex-shrink-0" />}
      <span className="text-left flex-1">{item.title}</span>
    </NavLink>
  );

  // Tentukan grup accordion yang harus terbuka berdasarkan path aktif
  useEffect(() => {
    const currentPath = location.pathname;
    const resolveGroupForPath = (): string | undefined => {
      if (currentPath.startsWith("/data-master")) return "Data Master";
      if (["/data-operasional/kegiatan","/data-operasional/kegiatan-rs","/data-operasional/pendapatan","/data-operasional/biaya"].some(p => currentPath.startsWith(p))) return "Data Operasional";
      if (["kalkulasi-biaya-gizi","kalkulasi-biaya-laboratorium","kalkulasi-biaya-radiologi","kalkulasi-biaya-bdrs"].some(seg => currentPath.includes(seg))) return "Unit Penunjang";
      if (currentPath.startsWith("/keperawatan/")) return "Unit Keperawatan";
      if (currentPath.startsWith("/pelayanan/")) return "Unit Pelayanan";
      if (currentPath.includes("kalkulasi-biaya-diklat")) return "Unit Diklat";
      if (currentPath.startsWith("/skenario-tarif")) return "Skenario Tarif";
      if (currentPath.startsWith("/distribusi-biaya")) return "Distribusi Biaya";
      if (currentPath.startsWith("/budgeting-bhp/")) return "Budgeting BHP";
      if (currentPath.startsWith("/analisis-revenue-cost/")) return "Analisis Revenue Cost";
      if (currentPath.startsWith("/produk-layanan") || currentPath.startsWith("/pola-remunerasi")) return "Analisis Bisnis";
      return undefined;
    };
    setOpenGroup(resolveGroupForPath());
  }, [location.pathname]);

  return (
    <div className={cn("flex flex-col gap-2 bg-teal-800 text-white", className)} {...props}>
      <Accordion 
        type="single" 
        collapsible 
        value={openGroup} 
        onValueChange={setOpenGroup}
      >
        {filteredNavItems.map((item) => (
          item.subItems ? (
            <AccordionItem value={item.title} className="border-none" key={item.title}>
              <AccordionTrigger 
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-white hover:text-teal-200 transition-all [&[data-state=open]>svg]:rotate-180 [&[data-state=open]]:bg-teal-900"
              >
                {item.icon && <item.icon className="h-4 w-4 flex-shrink-0" />}
                <span className="text-left flex-1">{item.title}</span>
              </AccordionTrigger>
              <AccordionContent className="pl-6 pt-2 pb-0 bg-black">
                <div className="flex flex-col gap-1">
                  {item.subItems.map((subItem) => renderLink(subItem))}
                </div>
              </AccordionContent>
            </AccordionItem>
          ) : (
            <div key={item.title}>{renderLink(item)}</div>
          )
        ))}
      </Accordion>
    </div>
  );
}