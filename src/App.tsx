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
import DataKegiatan from "./pages/DataKegiatan";
import DataPendapatan from "./pages/DataPendapatan";
import DataBiaya from "./pages/DataBiaya";
import Login from "./pages/Login";
import Health from "./pages/Health";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";

const queryClient = new QueryClient();

const App = () => {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      setLoading(false);
      
      supabase.auth.onAuthStateChange((_event, session) => {
        setSession(session);
      });
    };
    
    checkSession();
  }, []);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
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
              <Route path="/data-master/kegiatan" element={
                <ProtectedRoute>
                  <DataKegiatan />
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
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;