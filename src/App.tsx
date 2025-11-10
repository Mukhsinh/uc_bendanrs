import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { lazy, useEffect, useState } from "react";
const Index = lazy(() => import("./pages/Index"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Layout = lazy(() => import("./components/Layout"));
const DataUnitKerja = lazy(() => import("./pages/DataUnitKerja"));
const DataBarang = lazy(() => import("./pages/DataBarang"));
const DataBarangGizi = lazy(() => import("./pages/DataBarangGizi"));
const DataKamar = lazy(() => import("./pages/DataKamar"));
const DataKlinik = lazy(() => import("./pages/DataKlinik"));
const DataDokter = lazy(() => import("./pages/DataDokter"));
const DataKegiatan = lazy(() => import("./pages/DataKegiatan"));
const DataKegiatanRS = lazy(() => import("./pages/DataKegiatanRS"));
const DataTindakan = lazy(() => import("./pages/DataTindakan"));
const DataTindakanLaboratorium = lazy(() => import("./pages/DataTindakanLaboratorium"));
const DataTindakanRadiologi = lazy(() => import("./pages/DataTindakanRadiologi"));
const DataTindakanOperatif = lazy(() => import("./pages/DataTindakanOperatif"));
const DataTindakanCathlab = lazy(() => import("./pages/DataTindakanCathlab"));
const DataPendapatan = lazy(() => import("./pages/DataPendapatan"));
const DataBiaya = lazy(() => import("./pages/DataBiaya"));
const KalkulasiBiayaGizi = lazy(() => import("./pages/KalkulasiBiayaGizi"));
const KalkulasiTindakanRawatJalan = lazy(() => import("./pages/KalkulasiTindakanRawatJalan"));
const KalkulasiBiayaOperatif = lazy(() => import("./pages/KalkulasiBiayaOperatif"));
const KalkulasiBiayaLaboratorium = lazy(() => import("./pages/KalkulasiBiayaLaboratorium"));
const KalkulasiBiayaRadiologi = lazy(() => import("./pages/KalkulasiBiayaRadiologi"));
const KalkulasiBiayaCathlab = lazy(() => import("./pages/KalkulasiBiayaCathlab"));
const KalkulasiBiayaDiklat = lazy(() => import("./pages/KalkulasiBiayaDiklat"));
const KalkulasiAktivitasDiklat = lazy(() => import("./pages/KalkulasiAktivitasDiklat"));
const KalkulasiBiayaBDRS = lazy(() => import("./pages/KalkulasiBiayaBDRS"));
const RekapitulasiUnitCost = lazy(() => import("./pages/RekapitulasiUnitCost"));
const ProdukLayanan = lazy(() => import("./pages/ProdukLayanan"));
const PolaRemunerasi = lazy(() => import("./pages/PolaRemunerasi"));
const SkenarioTarif = lazy(() => import("./pages/SkenarioTarif"));
const SkenarioTarifAkomodasi = lazy(() => import("./pages/SkenarioTarifAkomodasi"));
const SkenarioTarifVisit = lazy(() => import("./pages/SkenarioTarifVisit"));
const DataTindakanBDRS = lazy(() => import("./pages/DataTindakanBDRS"));
const MenuGizi = lazy(() => import("./pages/MenuGizi"));
const DataDiklat = lazy(() => import("./pages/DataDiklat"));
const UnitPenunjang = lazy(() => import("./pages/UnitPenunjang"));
const UnitKeperawatan = lazy(() => import("./pages/UnitKeperawatan"));
const UnitPelayanan = lazy(() => import("./pages/UnitPelayanan"));
const UnitDiklat = lazy(() => import("./pages/UnitDiklat"));
const ManajemenTindakanInap = lazy(() => import("./pages/ManajemenTindakanInap"));
const KalkulasiTindakanInap = lazy(() => import("./pages/KalkulasiTindakanInap"));
const KalkulasiBiayaKelasAkomodasi = lazy(() => import("./pages/KalkulasiBiayaKelasAkomodasi"));
const AlokasiBiayaGizi = lazy(() => import("./pages/AlokasiBiayaGizi"));
const KalkulasiPendaftaranDanPeresepan = lazy(() => import("./pages/KalkulasiPendaftaranDanPeresepan"));
const ManajemenTindakanRawatJalan = lazy(() => import("./pages/ManajemenTindakanRawatJalan"));
const BudgetingBHPRupiah = lazy(() => import("./pages/BudgetingBHPRupiah"));
const BudgetingBHPRincian = lazy(() => import("./pages/BudgetingBHPRincian"));
const DasarAlokasi = lazy(() => import("./pages/DasarAlokasi"));
const DistribusiBiaya = lazy(() => import("./pages/DistribusiBiaya"));
const DistribusiBiayaPertama = lazy(() => import("./pages/DistribusiBiayaPertama"));
const DistribusiBiayaKedua = lazy(() => import("./pages/DistribusiBiayaKedua"));
const DistribusiBiayaRekap = lazy(() => import("./pages/DistribusiBiayaRekap"));
const CostRecovery = lazy(() => import("./pages/CostRecovery"));
const TotalBiayaDenganJP = lazy(() => import("./pages/TotalBiayaDenganJP"));
const StrukturBiaya = lazy(() => import("./pages/StrukturBiaya"));
const ProyeksiPendapatanLayanan = lazy(() => import("./pages/ProyeksiPendapatanLayanan"));
const TestDasarAlokasi = lazy(() => import("./pages/TestDasarAlokasi"));
const ManajemenAkses = lazy(() => import("./pages/ManajemenAkses"));
const AuditTrail = lazy(() => import("./pages/AuditTrail"));
const ModulTeknis = lazy(() => import("./pages/ModulTeknis"));
const PengelompokanData = lazy(() => import("./pages/PengelompokanData"));
const Login = lazy(() => import("./pages/Login"));
const Health = lazy(() => import("./pages/Health"));
const TestSupabase = lazy(() => import("./pages/TestSupabase"));
const SimpleTest = lazy(() => import("./pages/SimpleTest"));
const ModulTeknisTest = lazy(() => import("./pages/ModulTeknisTest"));
const ModulTeknisSimple = lazy(() => import("./pages/ModulTeknisSimple"));
const VercelDebug = lazy(() => import("./pages/VercelDebug"));
const SupabaseDebug = lazy(() => import("./pages/SupabaseDebug"));
import RoleProtectedRoute from "@/components/RoleProtectedRoute";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";

const queryClient = new QueryClient();

const LoadingScreen = () => (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-50 to-cyan-50">
    <div className="text-center max-w-md mx-auto p-6">
      <div className="relative mx-auto mb-6 h-16 w-16">
        <div className="absolute inset-0 rounded-full border-4 border-teal-200"></div>
        <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-teal-500 animate-spin"></div>
      </div>
      <p className="text-teal-800 font-semibold tracking-wide">Memuat Aplikasi...</p>
      <p className="text-sm text-gray-500 mt-2">Mohon tunggu, kami sedang menyiapkan sesi Anda.</p>
      <div className="mt-6">
        <div className="h-2 w-full bg-white/70 rounded-full overflow-hidden shadow-inner">
          <div className="h-full w-1/2 bg-gradient-to-r from-teal-400 via-teal-500 to-cyan-500 animate-loading-bar"></div>
        </div>
        <p className="text-xs text-gray-400 mt-2">Menjalankan pengecekan keamanan dan konfigurasi awal...</p>
      </div>
      <div className="mt-6 space-y-2">
        <a href="/login" className="block px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors">
          Halaman Login
        </a>
        <a href="/health" className="block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
          Health Check
        </a>
        <a href="/test-supabase" className="block px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
          Test Supabase
        </a>
        <a href="/debug" className="block px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
          Vercel Debug
        </a>
      </div>
      <div className="mt-4 text-xs text-gray-400">
        <p>Environment: {import.meta.env.MODE}</p>
        <p>Supabase URL: {import.meta.env.VITE_SUPABASE_URL ? 'Set' : 'Not Set'}</p>
        <p>Supabase Key: {import.meta.env.VITE_SUPABASE_ANON_KEY ? 'Set' : 'Not Set'}</p>
      </div>
    </div>
  </div>
);

const AppContent = () => {
  const { session, initializing } = useAuth();

  const [showLoading, setShowLoading] = useState(false);

  useEffect(() => {
    let timeout: number | undefined;

    if (initializing) {
      timeout = window.setTimeout(() => setShowLoading(true), 280);
    } else {
      setShowLoading(false);
    }

    return () => {
      if (timeout !== undefined) {
        window.clearTimeout(timeout);
      }
    };
  }, [initializing]);

  useEffect(() => {
    if (initializing && showLoading) {
      console.log("App.tsx - Showing loading screen");
    }
  }, [initializing, showLoading]);

  if (initializing && !showLoading) {
    return null;
  }

  if (initializing) {
    return <LoadingScreen />;
  }

  const SessionGuard = ({ children }: { children: JSX.Element }) => {
    if (!session) {
      return <Navigate to="/login" replace />;
    }
    return children;
  };

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/debug" element={<VercelDebug />} />
        <Route path="/supabase-debug" element={<SupabaseDebug />} />
        <Route path="/login" element={<Login />} />
        <Route path="/health" element={<Health />} />
        <Route path="/simple" element={<SimpleTest />} />
        <Route path="/modul-teknis-test" element={<ModulTeknisTest />} />
        <Route path="/modul-teknis-simple" element={<ModulTeknisSimple />} />
        <Route path="/test-supabase" element={<TestSupabase />} />
        <Route path="/" element={session ? <Layout /> : <Navigate to="/login" replace />}>
          <Route index element={<Index />} />
          <Route path="/data-master/unit-kerja" element={
            <SessionGuard>
              <DataUnitKerja />
            </SessionGuard>
          } />
          <Route path="/data-master/barang" element={
            <SessionGuard>
              <DataBarang />
            </SessionGuard>
          } />
          <Route path="/data-master/barang-gizi" element={
            <SessionGuard>
              <DataBarangGizi />
            </SessionGuard>
          } />
          <Route path="/data-master/kamar" element={
            <SessionGuard>
              <DataKamar />
            </SessionGuard>
          } />
          <Route path="/data-master/klinik" element={
            <SessionGuard>
              <DataKlinik />
            </SessionGuard>
          } />
          <Route path="/data-master/data-dokter" element={
            <SessionGuard>
              <DataDokter />
            </SessionGuard>
          } />
          <Route path="/data-master/kegiatan" element={
            <SessionGuard>
              <DataKegiatan />
            </SessionGuard>
          } />
          <Route path="/data-master/daftar-tindakan" element={
            <SessionGuard>
              <DataTindakan />
            </SessionGuard>
          } />
          <Route path="/data-master/tindakan-lab" element={
            <SessionGuard>
              <DataTindakanLaboratorium />
            </SessionGuard>
          } />
          <Route path="/data-master/tindakan-radiologi" element={
            <SessionGuard>
              <DataTindakanRadiologi />
            </SessionGuard>
          } />
          <Route path="/data-master/tindakan-operatif" element={
            <SessionGuard>
              <DataTindakanOperatif />
            </SessionGuard>
          } />
          <Route path="/data-master/tindakan-bdrs" element={
            <SessionGuard>
              <DataTindakanBDRS />
            </SessionGuard>
          } />
          <Route path="/data-master/tindakan-cathlab" element={
            <SessionGuard>
              <DataTindakanCathlab />
            </SessionGuard>
          } />
          <Route path="/data-master/pendapatan" element={
            <SessionGuard>
              <DataPendapatan />
            </SessionGuard>
          } />
          <Route path="/data-master/biaya" element={
            <SessionGuard>
              <DataBiaya />
            </SessionGuard>
          } />
          <Route path="/data-operasional/kegiatan" element={
            <SessionGuard>
              <DataKegiatan />
            </SessionGuard>
          } />
          <Route path="/data-operasional/kegiatan-rs" element={
            <SessionGuard>
              <DataKegiatanRS />
            </SessionGuard>
          } />
          <Route path="/data-operasional/pendapatan" element={
            <SessionGuard>
              <DataPendapatan />
            </SessionGuard>
          } />
          <Route path="/data-operasional/biaya" element={
            <SessionGuard>
              <DataBiaya />
            </SessionGuard>
          } />
          <Route path="/data-master/menu-gizi" element={
            <SessionGuard>
              <MenuGizi />
            </SessionGuard>
          } />
          <Route path="/data-master/diklat" element={
            <SessionGuard>
              <DataDiklat />
            </SessionGuard>
          } />
          <Route path="/unit-penunjang" element={
            <SessionGuard>
              <UnitPenunjang />
            </SessionGuard>
          } />
          <Route path="/unit-keperawatan" element={
            <SessionGuard>
              <UnitKeperawatan />
            </SessionGuard>
          } />
          <Route path="/unit-pelayanan" element={
            <SessionGuard>
              <UnitPelayanan />
            </SessionGuard>
          } />
          <Route path="/unit-diklat" element={
            <SessionGuard>
              <UnitDiklat />
            </SessionGuard>
          } />
          <Route path="/kalkulasi-biaya-gizi" element={
            <RoleProtectedRoute allowedRoles={["Super Admin", "Admin", "Operator", "Operator Penunjang"]} fallbackMessage="Hanya Super Admin, Admin, Operator, dan Operator Penunjang yang dapat mengakses halaman Kalkulasi Biaya Gizi.">
              <KalkulasiBiayaGizi />
            </RoleProtectedRoute>
          } />
          <Route path="/keperawatan/manajemen-tindakan-inap" element={
            <RoleProtectedRoute allowedRoles={["Super Admin", "Admin", "Operator", "Operator Keperawatan"]} fallbackMessage="Hanya Super Admin, Admin, Operator, dan Operator Keperawatan yang dapat mengakses halaman Manajemen Tindakan Inap.">
              <ManajemenTindakanInap />
            </RoleProtectedRoute>
          } />
          <Route path="/keperawatan/kalkulasi-tindakan-inap" element={
            <RoleProtectedRoute allowedRoles={["Super Admin", "Admin", "Operator", "Operator Keperawatan"]} fallbackMessage="Hanya Super Admin, Admin, Operator, dan Operator Keperawatan yang dapat mengakses halaman Kalkulasi Tindakan Inap.">
              <KalkulasiTindakanInap />
            </RoleProtectedRoute>
          } />
          <Route path="/keperawatan/kalkulasi-biaya-kelas-akomodasi" element={
            <RoleProtectedRoute allowedRoles={["Super Admin", "Admin", "Operator", "Operator Keperawatan"]} fallbackMessage="Hanya Super Admin, Admin, Operator, dan Operator Keperawatan yang dapat mengakses halaman Kalkulasi Biaya Kelas Akomodasi.">
              <KalkulasiBiayaKelasAkomodasi />
            </RoleProtectedRoute>
          } />
          <Route path="/keperawatan/data-akomodasi-inap" element={
            <RoleProtectedRoute allowedRoles={["Super Admin", "Admin", "Operator", "Operator Keperawatan"]} fallbackMessage="Hanya Super Admin, Admin, Operator, dan Operator Keperawatan yang dapat mengakses halaman Data Akomodasi Inap.">
              <AlokasiBiayaGizi />
            </RoleProtectedRoute>
          } />
          <Route path="/kalkulasi-biaya-operatif" element={
            <SessionGuard>
              <KalkulasiBiayaOperatif />
            </SessionGuard>
          } />
          <Route path="/kalkulasi-biaya-laboratorium" element={
            <SessionGuard>
              <KalkulasiBiayaLaboratorium />
            </SessionGuard>
          } />
          <Route path="/kalkulasi-biaya-radiologi" element={
            <SessionGuard>
              <KalkulasiBiayaRadiologi />
            </SessionGuard>
          } />
          <Route path="/kalkulasi-biaya-cathlab" element={
            <SessionGuard>
              <KalkulasiBiayaCathlab />
            </SessionGuard>
          } />
          <Route path="/pelayanan/kalkulasi-pendaftaran-resep" element={
            <SessionGuard>
              <KalkulasiPendaftaranDanPeresepan />
            </SessionGuard>
          } />
          <Route path="/pelayanan/manajemen-tindakan-rawat-jalan" element={
            <SessionGuard>
              <ManajemenTindakanRawatJalan />
            </SessionGuard>
          } />
          <Route path="/pelayanan/kalkulasi-tindakan-rawat-jalan" element={
            <SessionGuard>
              <KalkulasiTindakanRawatJalan />
            </SessionGuard>
          } />
          <Route path="/kalkulasi-biaya-ibs" element={<Navigate to="/kalkulasi-biaya-operatif" replace />} />
          <Route path="/kalkulasi-biaya-diklat" element={
            <SessionGuard>
              <KalkulasiBiayaDiklat />
            </SessionGuard>
          } />
          <Route path="/unit-diklat/kalkulasi-aktivitas" element={
            <SessionGuard>
              <KalkulasiAktivitasDiklat />
            </SessionGuard>
          } />
          <Route path="/kalkulasi-biaya-bdrs" element={
            <SessionGuard>
              <KalkulasiBiayaBDRS />
            </SessionGuard>
          } />
          <Route path="/rekapitulasi-unit-cost" element={
            <SessionGuard>
              <RekapitulasiUnitCost />
            </SessionGuard>
          } />
          <Route path="/produk-layanan" element={
            <SessionGuard>
              <ProdukLayanan />
            </SessionGuard>
          } />
          <Route path="/pola-remunerasi" element={
            <SessionGuard>
              <PolaRemunerasi />
            </SessionGuard>
          } />
          <Route path="/skenario-tarif-tindakan" element={
            <SessionGuard>
              <SkenarioTarif />
            </SessionGuard>
          } />
          <Route path="/skenario-tarif" element={<Navigate to="/skenario-tarif-tindakan" replace />} />
          <Route path="/skenario-tarif-akomodasi" element={
            <SessionGuard>
              <SkenarioTarifAkomodasi />
            </SessionGuard>
          } />
          <Route path="/skenario-tarif-visit" element={
            <SessionGuard>
              <SkenarioTarifVisit />
            </SessionGuard>
          } />
          <Route path="/dasar-alokasi" element={
            <SessionGuard>
              <DasarAlokasi />
            </SessionGuard>
          } />
          <Route path="/distribusi-biaya" element={
            <SessionGuard>
              <DistribusiBiaya />
            </SessionGuard>
          } />
          <Route path="/distribusi-biaya-pertama" element={
            <SessionGuard>
              <DistribusiBiayaPertama />
            </SessionGuard>
          } />
          <Route path="/distribusi-biaya-kedua" element={
            <SessionGuard>
              <DistribusiBiayaKedua />
            </SessionGuard>
          } />
          <Route path="/distribusi-biaya-rekap" element={
            <SessionGuard>
              <DistribusiBiayaRekap />
            </SessionGuard>
          } />
          <Route path="/analisis-revenue-cost/total-biaya-jp" element={
            <SessionGuard>
              <TotalBiayaDenganJP />
            </SessionGuard>
          } />
          <Route path="/cost-recovery" element={
            <SessionGuard>
              <CostRecovery />
            </SessionGuard>
          } />
          <Route path="/analisis-revenue-cost/struktur-biaya" element={
            <SessionGuard>
              <StrukturBiaya />
            </SessionGuard>
          } />
          <Route path="/analisis-revenue-cost/proyeksi-pendapatan" element={
            <SessionGuard>
              <ProyeksiPendapatanLayanan />
            </SessionGuard>
          } />
          <Route path="/budgeting-bhp/rupiah" element={
            <SessionGuard>
              <BudgetingBHPRupiah />
            </SessionGuard>
          } />
          <Route path="/budgeting-bhp/rincian" element={
            <SessionGuard>
              <BudgetingBHPRincian />
            </SessionGuard>
          } />
          <Route path="/test-dasar-alokasi" element={
            <SessionGuard>
              <TestDasarAlokasi />
            </SessionGuard>
          } />
          <Route path="/modul-teknis" element={
            <RoleProtectedRoute allowedRoles={["Super Admin"]} fallbackMessage="Hanya Super Admin yang dapat mengakses halaman Modul Teknis.">
              <ModulTeknis />
            </RoleProtectedRoute>
          } />
          <Route path="/pengelompokan-data" element={
            <SessionGuard>
              <PengelompokanData />
            </SessionGuard>
          } />
          <Route path="/manajemen-akses" element={
            <RoleProtectedRoute allowedRoles={["Super Admin"]} fallbackMessage="Hanya Super Admin yang dapat mengakses halaman Manajemen Akses.">
              <ManajemenAkses />
            </RoleProtectedRoute>
          } />
          <Route path="/audit-trail" element={
            <RoleProtectedRoute allowedRoles={["Super Admin"]} fallbackMessage="Hanya Super Admin yang dapat mengakses halaman Audit Trail.">
              <AuditTrail />
            </RoleProtectedRoute>
          } />
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
};

const App = () => (
  <AuthProvider>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <AppContent />
      </TooltipProvider>
    </QueryClientProvider>
  </AuthProvider>
);

export default App;