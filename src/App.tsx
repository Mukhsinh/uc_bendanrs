import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Layout from "./components/Layout";
import DataUnitKerja from "./pages/DataUnitKerja";
import DataBarang from "./pages/DataBarang";
import DataBarangGizi from "./pages/DataBarangGizi";
import DataKamar from "./pages/DataKamar";
import DataKlinik from "./pages/DataKlinik";
import DataKegiatan from "./pages/DataKegiatan";
import DataTindakan from "./pages/DataTindakan";
import DataTindakanLaboratorium from "./pages/DataTindakanLaboratorium";
import DataTindakanRadiologi from "./pages/DataTindakanRadiologi";
import DataTindakanOperatif from "./pages/DataTindakanOperatif";
import DataTindakanCathlab from "./pages/DataTindakanCathlab";
import DataPendapatan from "./pages/DataPendapatan";
import DataBiaya from "./pages/DataBiaya";
import KalkulasiBiayaGizi from "./pages/KalkulasiBiayaGizi";
import KalkulasiTindakanRawatJalan from "./pages/KalkulasiTindakanRawatJalan";
import KalkulasiBiayaOperatif from "./pages/KalkulasiBiayaOperatif";
import KalkulasiBiayaLaboratorium from "./pages/KalkulasiBiayaLaboratorium";
import KalkulasiBiayaRadiologi from "./pages/KalkulasiBiayaRadiologi";
import KalkulasiBiayaCathlab from "./pages/KalkulasiBiayaCathlab";
import KalkulasiBiayaDiklat from "./pages/KalkulasiBiayaDiklat";
import KalkulasiBiayaBDRS from "./pages/KalkulasiBiayaBDRS";
import RekapitulasiUnitCost from "./pages/RekapitulasiUnitCost";
import ProdukLayanan from "./pages/ProdukLayanan";
import SkenarioTarif from "./pages/SkenarioTarif";
import SkenarioTarifAkomodasi from "./pages/SkenarioTarifAkomodasi";
import SkenarioTarifVisit from "./pages/SkenarioTarifVisit";
import DataTindakanBDRS from "./pages/DataTindakanBDRS";
import MenuGizi from "./pages/MenuGizi";
import DataDiklat from "./pages/DataDiklat";
import UnitPenunjang from "./pages/UnitPenunjang";
import UnitKeperawatan from "./pages/UnitKeperawatan";
import UnitPelayanan from "./pages/UnitPelayanan";
import UnitDiklat from "./pages/UnitDiklat";
import ManajemenTindakanInap from "./pages/ManajemenTindakanInap";
import KalkulasiTindakanInap from "./pages/KalkulasiTindakanInap";
import KalkulasiBiayaKelasAkomodasi from "./pages/KalkulasiBiayaKelasAkomodasi";
import AlokasiBiayaGizi from "./pages/AlokasiBiayaGizi";
import KalkulasiPendaftaranDanPeresepan from "./pages/KalkulasiPendaftaranDanPeresepan";
import ManajemenTindakanRawatJalan from "./pages/ManajemenTindakanRawatJalan";
import BudgetingBHPRupiah from "./pages/BudgetingBHPRupiah";
import BudgetingBHPRincian from "./pages/BudgetingBHPRincian";
import DasarAlokasi from "./pages/DasarAlokasi";
import DistribusiBiaya from "./pages/DistribusiBiaya";
import DistribusiBiayaPertama from "./pages/DistribusiBiayaPertama";
import DistribusiBiayaKedua from "./pages/DistribusiBiayaKedua";
import DistribusiBiayaRekap from "./pages/DistribusiBiayaRekap";
import CostRecovery from "./pages/CostRecovery.tsx";
import TestDasarAlokasi from "./pages/TestDasarAlokasi";
import ManajemenAkses from "./pages/ManajemenAkses";
import ModulTeknis from "./pages/ModulTeknis";
import Login from "./pages/Login";
import Health from "./pages/Health";
import TestSupabase from "./pages/TestSupabase";
import TestPage from "./pages/TestPage";
import SimpleTest from "./pages/SimpleTest";
import ModulTeknisTest from "./pages/ModulTeknisTest";
import ModulTeknisSimple from "./pages/ModulTeknisSimple";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
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
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto mb-4"></div>
          <p className="text-teal-700 font-medium">Memuat Aplikasi...</p>
          <p className="text-sm text-gray-500 mt-2">Jika loading terlalu lama, coba akses <a href="/test" className="text-blue-600 underline">halaman test</a></p>
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
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/health" element={<Health />} />
            <Route path="/test" element={<TestPage />} />
            <Route path="/simple" element={<SimpleTest />} />
            <Route path="/modul-teknis-test" element={<ModulTeknisTest />} />
            <Route path="/modul-teknis-simple" element={<ModulTeknisSimple />} />
            <Route path="/test-supabase" element={<TestSupabase />} />
            <Route path="/" element={session ? <Layout /> : <Navigate to="/login" replace />}>
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
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;