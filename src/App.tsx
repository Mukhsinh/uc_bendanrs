import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Layout from "./components/Layout"; // Import the new Layout component
import DataUnitKerja from "./pages/DataUnitKerja";
import DataBarang from "./pages/DataBarang";
import DataKegiatan from "./pages/DataKegiatan";
import DataPendapatan from "./pages/DataPendapatan";
import DataBiaya from "./pages/DataBiaya";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/" element={<Layout />}> {/* Wrap main application routes with Layout */}
            <Route path="/data-master/unit-kerja" element={<DataUnitKerja />} />
            <Route path="/data-master/barang" element={<DataBarang />} />
            <Route path="/data-master/kegiatan" element={<DataKegiatan />} />
            <Route path="/data-master/pendapatan" element={<DataPendapatan />} />
            <Route path="/data-master/biaya" element={<DataBiaya />} />
          </Route>
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;