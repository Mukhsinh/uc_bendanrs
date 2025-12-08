import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Download, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useReportDownload } from "@/components/report";

interface RasioAktivitasData {
  id: string;
  tahun: number;
  jenis: string;
  deskripsi_inacbg: string | null;
  los: number;
  nama_dokter: string | null;
  tarif_inacbgs_numeric: number;
  total_biaya: number;
  kamar_akomodasi: any[];
  tindakan: any[];
  laboratorium: any[];
  radiologi: any[];
  farmasi: any[];
  visite: any[];
  konsultasi: any[];
  // Calculated fields
  total_biaya_akomodasi: number;
  total_biaya_tindakan: number;
  total_biaya_laboratorium: number;
  total_biaya_radiologi: number;
  total_biaya_farmasi: number;
  total_biaya_visite: number;
  total_biaya_konsultasi: number;
  rasio_akomodasi: number;
  rasio_tindakan: number;
  rasio_laboratorium: number;
  rasio_radiologi: number;
  rasio_farmasi: number;
  rasio_visite: number;
  rasio_konsultasi: number;
  selisih: number;
}

const RasioAktivitas = () => {
  const { toast } = useToast();
  const { downloadReport } = useReportDownload();
  const [data, setData] = useState<RasioAktivitasData[]>([]);
  const [filteredData, setFilteredData] = useState<RasioAktivitasData[]>([]);
  const [loading, setLoading] = useState(true);
  const [tahun, setTahun] = useState(2025);
  const [searchTerm, setSearchTerm] = useState("");
  const [jenisFilter, setJenisFilter] = useState("all");

  // Fungsi untuk menghitung total biaya dari array JSONB
  const calculateTotalFromArray = (array: any[]): number => {
    if (!array || !Array.isArray(array)) return 0;
    return array.reduce((sum, item) => {
      const subtotal = item.subtotal || item.harga_total || 0;
      return sum + (typeof subtotal === 'number' ? subtotal : parseFloat(subtotal) || 0);
    }, 0);
  };

  // Fungsi untuk menghitung rasio
  const calculateRatio = (totalKategori: number, totalBiaya: number): number => {
    if (!totalBiaya || totalBiaya === 0) return 0;
    return (totalKategori / totalBiaya) * 100;
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: "Error",
          description: "User not authenticated",
          variant: "destructive",
        });
        return;
      }

      const { data: produkLayanan, error } = await supabase
        .from("produk_layanan")
        .select(`
          id,
          tahun,
          jenis,
          deskripsi_inacbg,
          los,
          nama_dokter,
          tarif_inacbgs_numeric,
          total_biaya,
          kamar_akomodasi,
          tindakan,
          laboratorium,
          radiologi,
          farmasi,
          visite,
          konsultasi
        `)
        .eq("tahun", tahun)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Hitung total biaya per kategori dan rasio untuk setiap record
      const dataWithRatios = (produkLayanan || []).map(item => {
        const totalAkomodasi = calculateTotalFromArray(item.kamar_akomodasi || []);
        const totalTindakan = calculateTotalFromArray(item.tindakan || []);
        const totalLaboratorium = calculateTotalFromArray(item.laboratorium || []);
        const totalRadiologi = calculateTotalFromArray(item.radiologi || []);
        const totalFarmasi = calculateTotalFromArray(item.farmasi || []);
        const totalVisite = calculateTotalFromArray(item.visite || []);
        const totalKonsultasi = calculateTotalFromArray(item.konsultasi || []);
        const totalBiaya = item.total_biaya || 0;
        const tarifInacbgs = item.tarif_inacbgs_numeric || 0;
        const selisih = tarifInacbgs - totalBiaya;

        return {
          ...item,
          total_biaya_akomodasi: totalAkomodasi,
          total_biaya_tindakan: totalTindakan,
          total_biaya_laboratorium: totalLaboratorium,
          total_biaya_radiologi: totalRadiologi,
          total_biaya_farmasi: totalFarmasi,
          total_biaya_visite: totalVisite,
          total_biaya_konsultasi: totalKonsultasi,
          rasio_akomodasi: calculateRatio(totalAkomodasi, totalBiaya),
          rasio_tindakan: calculateRatio(totalTindakan, totalBiaya),
          rasio_laboratorium: calculateRatio(totalLaboratorium, totalBiaya),
          rasio_radiologi: calculateRatio(totalRadiologi, totalBiaya),
          rasio_farmasi: calculateRatio(totalFarmasi, totalBiaya),
          rasio_visite: calculateRatio(totalVisite, totalBiaya),
          rasio_konsultasi: calculateRatio(totalKonsultasi, totalBiaya),
          selisih: selisih,
        };
      });

      setData(dataWithRatios);
      setFilteredData(dataWithRatios);
    } catch (error: any) {
      toast({
        title: "Error fetching data",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [tahun]);

  useEffect(() => {
    let filtered = data;

    // Filter berdasarkan jenis
    if (jenisFilter !== "all") {
      filtered = filtered.filter(item => item.jenis === jenisFilter);
    }

    // Filter berdasarkan search term
    if (searchTerm) {
      filtered = filtered.filter(item => 
        item.deskripsi_inacbg?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.nama_dokter?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredData(filtered);
  }, [data, searchTerm, jenisFilter]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(2)}%`;
  };

  const handleExport = async () => {
    if (filteredData.length === 0) {
      toast({
        title: "Tidak ada data",
        description: "Tidak ada data untuk di-export",
        variant: "destructive",
      });
      return;
    }

    const exportData = filteredData.map(item => ({
      "Tahun": item.tahun,
      "Jenis": item.jenis,
      "Deskripsi INA-CBG": item.deskripsi_inacbg || "",
      "LOS": item.los,
      "Dokter": item.nama_dokter || "",
      "Tarif INA-CBGs": item.tarif_inacbgs_numeric,
      "Total Biaya": item.total_biaya,
      "Selisih": item.selisih,
      "Rasio Akomodasi (%)": item.rasio_akomodasi.toFixed(2),
      "Rasio Tindakan (%)": item.rasio_tindakan.toFixed(2),
      "Rasio Laboratorium (%)": item.rasio_laboratorium.toFixed(2),
      "Rasio Radiologi (%)": item.rasio_radiologi.toFixed(2),
      "Rasio Farmasi (%)": item.rasio_farmasi.toFixed(2),
      "Rasio Visite (%)": item.rasio_visite.toFixed(2),
      "Rasio Konsultasi (%)": item.rasio_konsultasi.toFixed(2),
    }));

    await downloadReport({
      title: "Laporan Rasio Aktivitas",
      subtitle: `Data tahun ${tahun}`,
      filename: `rasio_aktivitas_${tahun}`,
      filters: {
        Tahun: tahun,
        Jenis: jenisFilter === "all" ? "Semua" : jenisFilter,
        Pencarian: searchTerm || "Tidak ada",
      },
      records: exportData,
    });
  };

  return (
    <div className="container mx-auto py-10">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Rasio Aktivitas</CardTitle>
              <CardDescription>
                Analisis rasio biaya per kategori terhadap total biaya produk layanan
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Select value={String(tahun)} onValueChange={(value) => setTahun(Number(value))}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="Tahun" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2024">2024</SelectItem>
                  <SelectItem value="2025">2025</SelectItem>
                  <SelectItem value="2026">2026</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filter dan Search */}
          <div className="flex gap-4 mb-6">
            <div className="flex-1">
              <Label htmlFor="search">Cari</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Cari berdasarkan Deskripsi INA-CBG atau Nama Dokter..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="w-48">
              <Label htmlFor="jenis">Jenis Layanan</Label>
              <Select value={jenisFilter} onValueChange={setJenisFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih jenis" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua</SelectItem>
                  <SelectItem value="rawat jalan">Rawat Jalan</SelectItem>
                  <SelectItem value="rawat inap">Rawat Inap</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button onClick={handleExport} className="bg-red-600 hover:bg-red-700 text-white">
                <Download className="h-4 w-4 mr-2" />
                Unduh Laporan
              </Button>
            </div>
          </div>

          {/* Tabel Data */}
          {loading ? (
            <div className="text-center py-10">Loading...</div>
          ) : filteredData.length === 0 ? (
            <div className="text-center py-10 text-gray-500">
              {data.length === 0 
                ? "Belum ada data. Silakan tambah data di menu Produk Layanan terlebih dahulu."
                : "Tidak ada data yang sesuai dengan filter."
              }
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Jenis</TableHead>
                    <TableHead>Deskripsi INA-CBG</TableHead>
                    <TableHead className="text-center">LOS</TableHead>
                    <TableHead>Dokter</TableHead>
                    <TableHead className="text-right">Tarif INA-CBGs</TableHead>
                    <TableHead className="text-right">Total Biaya</TableHead>
                    <TableHead className="text-right">Selisih</TableHead>
                    <TableHead className="text-right">Rasio Akomodasi</TableHead>
                    <TableHead className="text-right">Rasio Tindakan</TableHead>
                    <TableHead className="text-right">Rasio Laboratorium</TableHead>
                    <TableHead className="text-right">Rasio Radiologi</TableHead>
                    <TableHead className="text-right">Rasio Farmasi</TableHead>
                    <TableHead className="text-right">Rasio Visite</TableHead>
                    <TableHead className="text-right">Rasio Konsultasi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredData.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium capitalize">{item.jenis}</TableCell>
                      <TableCell>{item.deskripsi_inacbg || "-"}</TableCell>
                      <TableCell className="text-center">{item.los || 0}</TableCell>
                      <TableCell>{item.nama_dokter || "-"}</TableCell>
                      <TableCell className="text-right">{formatCurrency(item.tarif_inacbgs_numeric || 0)}</TableCell>
                      <TableCell className="text-right font-medium">{formatCurrency(item.total_biaya || 0)}</TableCell>
                      <TableCell 
                        className={`text-right font-medium ${
                          item.selisih >= 0 
                            ? 'bg-green-50/50 text-green-700' 
                            : 'bg-red-50/50 text-red-700'
                        }`}
                      >
                        {formatCurrency(item.selisih || 0)}
                      </TableCell>
                      <TableCell className="text-right">{formatPercentage(item.rasio_akomodasi)}</TableCell>
                      <TableCell className="text-right">{formatPercentage(item.rasio_tindakan)}</TableCell>
                      <TableCell className="text-right">{formatPercentage(item.rasio_laboratorium)}</TableCell>
                      <TableCell className="text-right">{formatPercentage(item.rasio_radiologi)}</TableCell>
                      <TableCell className="text-right">{formatPercentage(item.rasio_farmasi)}</TableCell>
                      <TableCell className="text-right">{formatPercentage(item.rasio_visite)}</TableCell>
                      <TableCell className="text-right">{formatPercentage(item.rasio_konsultasi)}</TableCell>
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

export default RasioAktivitas;

