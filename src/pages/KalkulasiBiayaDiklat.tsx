import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
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
  Banknote
} from "lucide-react";
import * as XLSX from "xlsx";

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


  const handleDownloadReport = () => {
    if (data.length === 0) {
      toast.error("Tidak ada data untuk diunduh");
      return;
    }

    const exportData = data.map((item) => ({
      "Jenis Diklat": jenisDiklatOptions.find(opt => opt.value === item.jenis_diklat)?.label || item.jenis_diklat,
      "Lama Hari Diklat": item.lama_hari_diklat,
      "Biaya Unit Diklat": item.biaya_unit_diklat,
      "Biaya Distribusi Kedua": item.biaya_distribusi_kedua,
      "Total Biaya Unit Diklat": item.total_biaya_unit_diklat,
      "Total Diklat": item.total_diklat,
      "Biaya Diklat per Hari": item.biaya_diklat_per_hari,
      "Unit Cost per Jenis Layanan": item.unit_cost_per_jenis_layanan,
      "Tahun": item.tahun
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Kalkulasi Biaya Diklat");
    const fileName = `Kalkulasi_Biaya_Diklat_${year}.xlsx`;
    XLSX.writeFile(wb, fileName);
    toast.success("Laporan berhasil diunduh");
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
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Kalkulasi Biaya Diklat</h1>
          <p className="text-gray-600 mt-1">
            Data kalkulasi biaya diklat basis harian (otomatis dari sistem)
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleDownloadReport} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Unduh Laporan
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Total Jenis Diklat</p>
                <p className="text-2xl font-bold mt-1">{stats.totalJenis}</p>
              </div>
              <GraduationCap className="h-12 w-12 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Total Biaya</p>
                <p className="text-2xl font-bold mt-1">Rp {stats.totalBiaya.toLocaleString()}</p>
              </div>
              <Banknote className="h-12 w-12 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Total Diklat</p>
                <p className="text-2xl font-bold mt-1">{stats.totalDiklat}</p>
              </div>
              <Users className="h-12 w-12 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Rata-rata Biaya/Hari</p>
                <p className="text-2xl font-bold mt-1">Rp {stats.avgBiayaPerHari.toLocaleString()}</p>
              </div>
              <TrendingUp className="h-12 w-12 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Year Filter */}
      <Card>
        <CardHeader>
          <CardTitle>Filter Data</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <Label htmlFor="year">Tahun</Label>
              <Select value={String(year)} onValueChange={(value) => setYear(Number(value))}>
                <SelectTrigger>
                  <SelectValue />
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
            <Button onClick={loadData} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Data Table */}
      <Card>
        <CardHeader>
          <CardTitle>Data Kalkulasi Biaya Diklat ({data.length} data)</CardTitle>
          <CardDescription>
            Data kalkulasi biaya diklat basis harian yang dihitung otomatis oleh sistem
          </CardDescription>
        </CardHeader>
        <CardContent>
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
                <TableHeader>
                  <TableRow>
                    <TableHead>Jenis Diklat</TableHead>
                    <TableHead className="text-right">Lama Hari</TableHead>
                    <TableHead className="text-right">Biaya Unit</TableHead>
                    <TableHead className="text-right">Distribusi Kedua</TableHead>
                    <TableHead className="text-right">Total Biaya Unit</TableHead>
                    <TableHead className="text-right">Total Diklat</TableHead>
                    <TableHead className="text-right">Biaya/Hari</TableHead>
                    <TableHead className="text-right">Unit Cost</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <Badge variant="outline">
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