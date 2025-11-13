import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { 
  Download, 
  RefreshCw, 
  GraduationCap,
  Users,
  TrendingUp,
  Banknote,
  Loader2
} from "lucide-react";
import { useReportDownload } from "@/components/report";

interface KalkulasiDiklat {
  id: string;
  user_id: string;
  tahun: number;
  jenis_diklat: string;
  lama_hari_diklat: number;
  biaya_unit_diklat: number;
  biaya_distribusi_kedua: number;
  total_biaya_unit_diklat: number;
  total_diklat: number;
  biaya_diklat_per_hari: number;
  unit_cost_per_jenis_layanan: number;
  created_at?: string;
  updated_at?: string;
}

const KalkulasiBiayaDiklat: React.FC = () => {
  const [data, setData] = useState<KalkulasiDiklat[]>([]);
  const [loading, setLoading] = useState(false);
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [showFilters, setShowFilters] = useState(true);
  const [downloadingReport, setDownloadingReport] = useState(false);
  const { downloadReport } = useReportDownload();

  const jenisDiklatOptions = [
    { value: "basis_harian", label: "Basis Harian" }
  ];

  useEffect(() => {
    loadData();
  }, [year]);

  const loadData = async () => {
    setLoading(true);
    try {
      const { data: result, error } = await supabase
        .from("kalkulasi_diklat")
        .select("*")
        .eq("tahun", year)
        .eq("jenis_diklat", "basis_harian")
        .order("jenis_diklat");

      if (error) {
        console.error("Database error:", error);
        if (error.message.includes("Could not find the table") || 
            error.message.includes("does not exist")) {
          toast.error("Tabel kalkulasi_diklat belum dibuat. Silakan jalankan script SQL di Supabase terlebih dahulu.");
        } else {
          toast.error("Gagal memuat data: " + error.message);
        }
        setData([]);
        return;
      }
      
      // Jika tidak ada data, buat data otomatis
      if (!result || result.length === 0) {
        await createDefaultData();
        // Reload data setelah membuat data default
        const { data: newResult } = await supabase
          .from("kalkulasi_diklat")
          .select("*")
          .eq("tahun", year)
          .eq("jenis_diklat", "basis_harian");
        setData(newResult || []);
      } else {
        setData(result);
      }
    } catch (error: any) {
      console.error("Error loading data:", error);
      toast.error("Gagal memuat data: " + error.message);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  const createDefaultData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("User tidak terautentikasi");
        return;
      }

      const defaultData = {
        user_id: user.id,
        tahun: year,
        jenis_diklat: "basis_harian",
        lama_hari_diklat: 1,
        biaya_unit_diklat: 0,
        biaya_distribusi_kedua: 0,
        total_diklat: 1
      };

      const { error } = await supabase
        .from("kalkulasi_diklat")
        .insert(defaultData);

      if (error) throw error;
      toast.success("Data kalkulasi diklat otomatis dibuat");
    } catch (error: any) {
      console.error("Error creating default data:", error);
      toast.error("Gagal membuat data default: " + error.message);
    }
  };


  const handleDownloadReport = async () => {
    if (data.length === 0) {
      toast.error("Tidak ada data untuk diunduh");
      return;
    }

    try {
      setDownloadingReport(true);

      const records = data.map((item) => ({
        "Jenis Diklat": jenisDiklatOptions.find((opt) => opt.value === item.jenis_diklat)?.label || item.jenis_diklat,
        "Lama Hari Diklat": item.lama_hari_diklat,
        "Biaya Unit Diklat": Math.round(item.biaya_unit_diklat || 0),
        "Biaya Distribusi Kedua": Math.round(item.biaya_distribusi_kedua || 0),
        "Total Biaya Unit Diklat": Math.round(item.total_biaya_unit_diklat || 0),
        "Total Diklat": Math.round(item.total_diklat || 0),
        "Biaya Diklat per Hari": Math.round(item.biaya_diklat_per_hari || 0),
        "Unit Cost per Jenis Layanan": Math.round(item.unit_cost_per_jenis_layanan || 0),
        "Tahun": item.tahun,
      }));

      await downloadReport({
        title: "Laporan Kalkulasi Biaya Diklat",
        subtitle: `Tahun ${year}`,
        filename: `kalkulasi_biaya_diklat_${year}`,
        records,
        orientation: "portrait",
      });

      toast.success("Laporan berhasil disiapkan");
    } catch (error: any) {
      console.error("Gagal mengunduh kalkulasi biaya diklat:", error);
      toast.error(error?.message || "Terjadi kesalahan saat menyiapkan laporan");
    } finally {
      setDownloadingReport(false);
    }
  };

  // Calculate statistics
  const stats = {
    totalJenis: data.length,
    totalBiaya: data.reduce((sum, item) => sum + (item.total_biaya_unit_diklat || 0), 0),
    totalDiklat: data.reduce((sum, item) => sum + (item.total_diklat || 0), 0),
    avgBiayaPerHari: data.length > 0 ? data.reduce((sum, item) => sum + (item.biaya_diklat_per_hari || 0), 0) / data.length : 0
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Kalkulasi Biaya Diklat</h1>
          <p className="text-gray-600 mt-1">
            Data kalkulasi biaya diklat basis harian (otomatis dari sistem)
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => setShowFilters((prev) => !prev)}
            className="border-slate-300 text-slate-700 hover:bg-slate-100"
          >
            Filter
          </Button>
          <Button
            onClick={() => {
              void handleDownloadReport();
            }}
            className="bg-red-500 text-white hover:bg-red-600 disabled:bg-red-400 disabled:cursor-not-allowed"
            disabled={loading || data.length === 0 || downloadingReport}
          >
            {downloadingReport ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Download className="h-4 w-4 mr-2" />
            )}
            {downloadingReport ? "Menyiapkan..." : "Unduh Laporan"}
          </Button>
          <Button
            onClick={loadData}
            size="icon"
            className="bg-slate-100 text-slate-600 hover:bg-slate-200"
            disabled={loading}
          >
            <RefreshCw className={loading ? "h-4 w-4 animate-spin" : "h-4 w-4"} />
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-none bg-blue-50 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-700">Total Jenis Diklat</p>
                <p className="mt-1 text-2xl font-bold text-blue-900">{stats.totalJenis}</p>
              </div>
              <div className="rounded-full bg-white/80 p-3 text-blue-600">
                <GraduationCap className="h-7 w-7" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none bg-emerald-50 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-emerald-700">Total Biaya</p>
                <p className="mt-1 text-2xl font-bold text-emerald-900">Rp {stats.totalBiaya.toLocaleString()}</p>
              </div>
              <div className="rounded-full bg-white/80 p-3 text-emerald-600">
                <Banknote className="h-7 w-7" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none bg-purple-50 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-700">Total Diklat</p>
                <p className="mt-1 text-2xl font-bold text-purple-900">{stats.totalDiklat}</p>
              </div>
              <div className="rounded-full bg-white/80 p-3 text-purple-600">
                <Users className="h-7 w-7" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none bg-amber-50 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-amber-700">Rata-rata Biaya/Hari</p>
                <p className="mt-1 text-2xl font-bold text-amber-900">Rp {stats.avgBiayaPerHari.toLocaleString()}</p>
              </div>
              <div className="rounded-full bg-white/80 p-3 text-amber-600">
                <TrendingUp className="h-7 w-7" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Year Filter */}
      {showFilters && (
        <Card className="border-none bg-slate-50 shadow-sm">
          <CardContent className="pt-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="w-full sm:max-w-xs">
                <Select value={String(year)} onValueChange={(value) => setYear(Number(value))}>
                  <SelectTrigger className="border-slate-200 bg-white text-slate-700">
                    <SelectValue placeholder="Pilih Tahun" />
                  </SelectTrigger>
                  <SelectContent>
                    {[2024, 2025, 2026].map((y) => (
                      <SelectItem key={y} value={String(y)}>
                        {y}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Data Table */}
      <Card>
        <CardContent className="pt-6">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <RefreshCw className="h-8 w-8 animate-spin text-teal-600" />
            </div>
          ) : data.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <GraduationCap className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p>Tidak ada data untuk tahun {year}</p>
              <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                  <strong>Catatan:</strong> Jika Anda melihat error "Could not find the table", 
                  silakan jalankan script SQL di Supabase SQL Editor terlebih dahulu.
                </p>
                <p className="text-xs text-yellow-600 mt-2">
                  File script tersedia di: <code>database/create_kalkulasi_diklat_manual.sql</code>
                </p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-[#0f766e]">
                  <TableRow className="bg-[#0f766e] hover:bg-[#0f766e]">
                    <TableHead className="text-white">Jenis Diklat</TableHead>
                    <TableHead className="text-right text-white">Lama Hari</TableHead>
                    <TableHead className="text-right text-white">Biaya Unit</TableHead>
                    <TableHead className="text-right text-white">Distribusi Kedua</TableHead>
                    <TableHead className="text-right text-white">Total Biaya Unit</TableHead>
                    <TableHead className="text-right text-white">Total Diklat</TableHead>
                    <TableHead className="text-right text-white">Biaya/Hari</TableHead>
                    <TableHead className="text-right text-white">Unit Cost</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <Badge className="bg-sky-100 text-sky-700">
                          {jenisDiklatOptions.find(opt => opt.value === item.jenis_diklat)?.label || item.jenis_diklat}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">{item.lama_hari_diklat}</TableCell>
                      <TableCell className="text-right">Rp {item.biaya_unit_diklat?.toLocaleString() || '0'}</TableCell>
                      <TableCell className="text-right">Rp {item.biaya_distribusi_kedua?.toLocaleString() || '0'}</TableCell>
                      <TableCell className="text-right font-semibold">Rp {item.total_biaya_unit_diklat?.toLocaleString() || '0'}</TableCell>
                      <TableCell className="text-right">{item.total_diklat || '0'}</TableCell>
                      <TableCell className="text-right">Rp {item.biaya_diklat_per_hari?.toLocaleString() || '0'}</TableCell>
                      <TableCell className="text-right font-bold text-green-600">Rp {item.unit_cost_per_jenis_layanan?.toLocaleString() || '0'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

    </div>
  );
};

export default KalkulasiBiayaDiklat;