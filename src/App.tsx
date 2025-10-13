import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { lazy, Suspense, useEffect, useState } from "react";
const Index = lazy(() => import("./pages/Index"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Layout = lazy(() => import("./components/Layout"));
const DataUnitKerja = lazy(() => import("./pages/DataUnitKerja"));
const DataBarang = lazy(() => import("./pages/DataBarang"));
const DataBarangGizi = lazy(() => import("./pages/DataBarangGizi"));
const DataKamar = lazy(() => import("./pages/DataKamar"));
const DataKlinik = lazy(() => import("./pages/DataKlinik"));
const DataKegiatan = lazy(() => import("./pages/DataKegiatan"));
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
const KalkulasiBiayaBDRS = lazy(() => import("./pages/KalkulasiBiayaBDRS"));
const RekapitulasiUnitCost = lazy(() => import("./pages/RekapitulasiUnitCost"));
const ProdukLayanan = lazy(() => import("./pages/ProdukLayanan"));
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
const TestDasarAlokasi = lazy(() => import("./pages/TestDasarAlokasi"));
const ManajemenAkses = lazy(() => import("./pages/ManajemenAkses"));
const ModulTeknis = lazy(() => import("./pages/ModulTeknis"));
const Login = lazy(() => import("./pages/Login"));
const Health = lazy(() => import("./pages/Health"));
const TestSupabase = lazy(() => import("./pages/TestSupabase"));
const TestPage = lazy(() => import("./pages/TestPage"));
const SimpleTest = lazy(() => import("./pages/SimpleTest"));
const ModulTeknisTest = lazy(() => import("./pages/ModulTeknisTest"));
const ModulTeknisSimple = lazy(() => import("./pages/ModulTeknisSimple"));
const VercelDebug = lazy(() => import("./pages/VercelDebug"));
import { supabase } from "@/integrations/supabase/client";
import RoleProtectedRoute from "@/components/RoleProtectedRoute";

const queryClient = new QueryClient();

const App = () => {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkSession = async () => {
      try {
        console.log('Checking Supabase session...');
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Supabase session error:', error);
          setLoading(false);
          return;
        }
        
        console.log('Session result:', session);
        setSession(session);
        setLoading(false);
        
        supabase.auth.onAuthStateChange((_event, session) => {
          console.log('Auth state change:', _event, session);
          setSession(session);
        });
      } catch (error) {
        console.error('Error checking session:', error);
        setLoading(false);
      }
    };
    
    checkSession();
  }, []);

  if (loading) {
    console.log('App.tsx - Showing loading screen');
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-50 to-cyan-50">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto mb-4"></div>
          <p className="text-teal-700 font-medium">Memuat Aplikasi...</p>
          <p className="text-sm text-gray-500 mt-2">Jika loading terlalu lama, coba akses halaman test di bawah:</p>
          <div className="mt-4 space-y-2">
            <a href="/test" className="block px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors">
              Halaman Test
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
  }

  const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
    if (!session) {
      return <Navigate to="/login" replace />;
    }
    return children;
  };

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Memuat halaman...</div>}>
          <Routes>
            <Route path="/test" element={<TestPage />} />
            <Route path="/debug" element={<VercelDebug />} />
            <Route path="/login" element={<Login />} />
            <Route path="/health" element={<Health />} />
            <Route path="/simple" element={<SimpleTest />} />
            <Route path="/modul-teknis-test" element={<ModulTeknisTest />} />
            <Route path="/modul-teknis-simple" element={<ModulTeknisSimple />} />
            <Route path="/test-supabase" element={<TestSupabase />} />
            <Route path="/" element={session ? <Layout /> : <Navigate to="/test" replace />}>
              <Route index element={<Index />} />
              <Route path="/data-master/unit-kerja" element={
                <ProtectedRoute>
                  <DataUnitKerja />
                </ProtectedRoute>
              } />
              <Route path="/data-master/barang" element={
                <ProtectedRoute>
                  <DataBarang />
                </ProtectedRoute>
              } />
              <Route path="/data-master/barang-gizi" element={
                <ProtectedRoute>
                  <DataBarangGizi />
                </ProtectedRoute>
              } />
              <Route path="/data-master/kamar" element={
                <ProtectedRoute>
                  <DataKamar />
                </ProtectedRoute>
              } />
              <Route path="/data-master/klinik" element={
                <ProtectedRoute>
                  <DataKlinik />
                </ProtectedRoute>
              } />
              <Route path="/data-master/kegiatan" element={
                <ProtectedRoute>
                  <DataKegiatan />
                </ProtectedRoute>
              } />
              <Route path="/data-master/daftar-tindakan" element={
                <ProtectedRoute>
                  <DataTindakan />
                </ProtectedRoute>
              } />
              <Route path="/data-master/tindakan-lab" element={
                <ProtectedRoute>
                  <DataTindakanLaboratorium />
                </ProtectedRoute>
              } />
              <Route path="/data-master/tindakan-radiologi" element={
                <ProtectedRoute>
                  <DataTindakanRadiologi />
                </ProtectedRoute>
              } />
              <Route path="/data-master/tindakan-operatif" element={
                <ProtectedRoute>
                  <DataTindakanOperatif />
                </ProtectedRoute>
              } />
              <Route path="/data-master/tindakan-bdrs" element={
                <ProtectedRoute>
                  <DataTindakanBDRS />
                </ProtectedRoute>
              } />
              <Route path="/data-master/tindakan-cathlab" element={
                <ProtectedRoute>
                  <DataTindakanCathlab />
                </ProtectedRoute>
              } />
              <Route path="/data-master/pendapatan" element={
                <ProtectedRoute>
                  <DataPendapatan />
                </ProtectedRoute>
              } />
              <Route path="/data-master/biaya" element={
                <ProtectedRoute>
                  <DataBiaya />
                </ProtectedRoute>
              } />
              <Route path="/data-master/menu-gizi" element={
                <ProtectedRoute>
                  <MenuGizi />
                </ProtectedRoute>
              } />
              <Route path="/data-master/diklat" element={
                <ProtectedRoute>
                  <DataDiklat />
                </ProtectedRoute>
              } />
              <Route path="/unit-penunjang" element={
                <ProtectedRoute>
                  <UnitPenunjang />
                </ProtectedRoute>
              } />
              <Route path="/unit-keperawatan" element={
                <ProtectedRoute>
                  <UnitKeperawatan />
                </ProtectedRoute>
              } />
              <Route path="/unit-pelayanan" element={
                <ProtectedRoute>
                  <UnitPelayanan />
                </ProtectedRoute>
              } />
              <Route path="/unit-diklat" element={
                <ProtectedRoute>
                  <UnitDiklat />
                </ProtectedRoute>
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
                <ProtectedRoute>
                  <KalkulasiBiayaOperatif />
                </ProtectedRoute>
              } />
              <Route path="/kalkulasi-biaya-laboratorium" element={
                <ProtectedRoute>
                  <KalkulasiBiayaLaboratorium />
                </ProtectedRoute>
              } />
              <Route path="/kalkulasi-biaya-radiologi" element={
                <ProtectedRoute>
                  <KalkulasiBiayaRadiologi />
                </ProtectedRoute>
              } />
              <Route path="/kalkulasi-biaya-cathlab" element={
                <ProtectedRoute>
                  <KalkulasiBiayaCathlab />
                </ProtectedRoute>
              } />
              <Route path="/pelayanan/kalkulasi-pendaftaran-resep" element={
                <ProtectedRoute>
                  <KalkulasiPendaftaranDanPeresepan />
                </ProtectedRoute>
              } />
              <Route path="/pelayanan/manajemen-tindakan-rawat-jalan" element={
                <ProtectedRoute>
                  <ManajemenTindakanRawatJalan />
                </ProtectedRoute>
              } />
              <Route path="/pelayanan/kalkulasi-tindakan-rawat-jalan" element={
                <ProtectedRoute>
                  <KalkulasiTindakanRawatJalan />
                </ProtectedRoute>
              } />
              {/* Redirect old IBS route to Operatif */}
              <Route path="/kalkulasi-biaya-ibs" element={<Navigate to="/kalkulasi-biaya-operatif" replace />} />
              <Route path="/kalkulasi-biaya-diklat" element={
                <ProtectedRoute>
                  <KalkulasiBiayaDiklat />
                </ProtectedRoute>
              } />
              <Route path="/kalkulasi-biaya-bdrs" element={
                <ProtectedRoute>
                  <KalkulasiBiayaBDRS />
                </ProtectedRoute>
              } />
              <Route path="/rekapitulasi-unit-cost" element={
                <ProtectedRoute>
                  <RekapitulasiUnitCost />
                </ProtectedRoute>
              } />
              <Route path="/produk-layanan" element={
                <ProtectedRoute>
                  <ProdukLayanan />
                </ProtectedRoute>
              } />
              <Route path="/skenario-tarif-tindakan" element={
                <ProtectedRoute>
                  <SkenarioTarif />
                </ProtectedRoute>
              } />
              {/* Redirect old URL to new URL */}
              <Route path="/skenario-tarif" element={<Navigate to="/skenario-tarif-tindakan" replace />} />
              <Route path="/skenario-tarif-akomodasi" element={
                <ProtectedRoute>
                  <SkenarioTarifAkomodasi />
                </ProtectedRoute>
              } />
              <Route path="/skenario-tarif-visit" element={
                <ProtectedRoute>
                  <SkenarioTarifVisit />
                </ProtectedRoute>
              } />
              <Route path="/dasar-alokasi" element={
                <ProtectedRoute>
                  <DasarAlokasi />
                </ProtectedRoute>
              } />
              <Route path="/distribusi-biaya" element={
                <ProtectedRoute>
                  <DistribusiBiaya />
                </ProtectedRoute>
              } />
              <Route path="/distribusi-biaya-pertama" element={
                <ProtectedRoute>
                  <DistribusiBiayaPertama />
                </ProtectedRoute>
              } />
              <Route path="/distribusi-biaya-kedua" element={
                <ProtectedRoute>
                  <DistribusiBiayaKedua />
                </ProtectedRoute>
              } />
              <Route path="/distribusi-biaya-rekap" element={
                <ProtectedRoute>
                  <DistribusiBiayaRekap />
                </ProtectedRoute>
              } />
              <Route path="/cost-recovery" element={
                <ProtectedRoute>
                  <CostRecovery />
                </ProtectedRoute>
              } />
              <Route path="/budgeting-bhp/rupiah" element={
                <ProtectedRoute>
                  <BudgetingBHPRupiah />
                </ProtectedRoute>
              } />
              <Route path="/budgeting-bhp/rincian" element={
                <ProtectedRoute>
                  <BudgetingBHPRincian />
                </ProtectedRoute>
              } />
              <Route path="/test-dasar-alokasi" element={
                <ProtectedRoute>
                  <TestDasarAlokasi />
                </ProtectedRoute>
              } />
              <Route path="/modul-teknis" element={
                <RoleProtectedRoute allowedRoles={["Super Admin"]} fallbackMessage="Hanya Super Admin yang dapat mengakses halaman Modul Teknis.">
                  <ModulTeknis />
                </RoleProtectedRoute>
              } />
              <Route path="/manajemen-akses" element={
                <RoleProtectedRoute allowedRoles={["Super Admin"]} fallbackMessage="Hanya Super Admin yang dapat mengakses halaman Manajemen Akses.">
                  <ManajemenAkses />
                </RoleProtectedRoute>
              } />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
          </Suspense>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;