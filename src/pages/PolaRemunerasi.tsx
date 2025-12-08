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
import { Download, Search, Coins, BarChart3, TrendingUp, TrendingDown, Calculator } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useReportDownload } from "@/components/report";

interface PolaRemunerasiData {
  id: string;
  tahun: number;
  jenis: string;
  deskripsi_inacbg: string | null;
  grouper: string | null;
  diaglist: string | null;
  spesialisasi_dokter: string | null;
  tarif_inacbgs_numeric: number;
  jp_tindakan: number;
  jp_ibs: number;
  jp_laboratorium: number;
  jp_radiologi: number;
  jp_farmasi: number;
  jp_kamar_akomodasi: number;
  jp_visite: number;
  jp_konsultasi: number;
  total_jp: number;
  created_at: string;
}

const PolaRemunerasi = () => {
  const { toast } = useToast();
  const { downloadReport } = useReportDownload();
  const [data, setData] = useState<PolaRemunerasiData[]>([]);
  const [filteredData, setFilteredData] = useState<PolaRemunerasiData[]>([]);
  const [loading, setLoading] = useState(true);
  const [tahun, setTahun] = useState(2025);
  const [searchTerm, setSearchTerm] = useState("");
  const [jenisFilter, setJenisFilter] = useState("all");
  const [spesialisasiFilter, setSpesialisasiFilter] = useState("all");
  const [recalculatingJP, setRecalculatingJP] = useState(false);

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

      const { data: polaRemunerasi, error } = await supabase
        .from("produk_layanan")
        .select(`
          id,
          tahun,
          jenis,
          deskripsi_inacbg,
          grouper,
          diaglist,
          spesialisasi_dokter,
          tarif_inacbgs_numeric,
          jp_tindakan,
          jp_ibs,
          jp_laboratorium,
          jp_radiologi,
          jp_farmasi,
          jp_kamar_akomodasi,
          jp_visite,
          jp_konsultasi,
          created_at
        `)
        .eq("tahun", tahun)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Hitung total JP untuk setiap record
      const dataWithTotalJP = (polaRemunerasi || []).map(item => ({
        ...item,
        total_jp: (item.jp_tindakan || 0) + 
                 (item.jp_ibs || 0) + 
                 (item.jp_laboratorium || 0) + 
                 (item.jp_radiologi || 0) + 
                 (item.jp_farmasi || 0) + 
                 (item.jp_kamar_akomodasi || 0) + 
                 (item.jp_visite || 0) + 
                 (item.jp_konsultasi || 0)
      }));

      setData(dataWithTotalJP);
      setFilteredData(dataWithTotalJP);
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

  const handleRecalculateJP = async () => {
    try {
      setRecalculatingJP(true);
      const { data, error } = await supabase.rpc("recalculate_jp_produk_layanan_rpc", {
        p_tahun: tahun,
        p_id: null,
      });

      if (error) throw error;

      toast({
        title: "Berhasil",
        description: `Recalculate JP selesai. ${data?.affected_rows || 0} record diperbarui.`,
      });

      // Refresh data setelah recalculate
      await fetchData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setRecalculatingJP(false);
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

    // Filter berdasarkan spesialisasi dokter
    if (spesialisasiFilter !== "all") {
      filtered = filtered.filter(item => item.spesialisasi_dokter === spesialisasiFilter);
    }

    // Filter berdasarkan search term
    if (searchTerm) {
      filtered = filtered.filter(item => 
        item.deskripsi_inacbg?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.grouper?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.diaglist?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredData(filtered);
  }, [data, searchTerm, jenisFilter, spesialisasiFilter]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(value);
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
      "INA-CBG": item.deskripsi_inacbg || "",
      "Grouper": item.grouper || "",
      "Diaglist": item.diaglist || "",
      "Spesialisasi Dokter": item.spesialisasi_dokter || "",
      "Tarif INA-CBGs": item.tarif_inacbgs_numeric,
      "JP Tindakan": item.jp_tindakan,
      "JP IBS": item.jp_ibs,
      "JP Laboratorium": item.jp_laboratorium,
      "JP Radiologi": item.jp_radiologi,
      "JP Farmasi": item.jp_farmasi,
      "JP Kamar Akomodasi": item.jp_kamar_akomodasi,
      "JP Visite": item.jp_visite,
      "JP Konsultasi": item.jp_konsultasi,
      "Total JP": item.total_jp
    }));

    await downloadReport({
      title: "Laporan Pola Remunerasi",
      subtitle: `Data tahun ${tahun}`,
      filename: `pola_remunerasi_${tahun}`,
      filters: {
        Tahun: tahun,
        Jenis: jenisFilter === "all" ? "Semua" : jenisFilter,
        Spesialisasi: spesialisasiFilter === "all" ? "Semua" : spesialisasiFilter,
        Pencarian: searchTerm || "Tidak ada",
      },
      records: exportData,
    });
  };

  // Hitung statistik
  const totalJP = filteredData.reduce((sum, item) => sum + item.total_jp, 0);
  const avgJP = filteredData.length > 0 ? totalJP / filteredData.length : 0;
  const maxJP = Math.max(...filteredData.map(item => item.total_jp), 0);
  const minJP = Math.min(...filteredData.map(item => item.total_jp), 0);

  const statsCards = [
    {
      title: "Total JP",
      value: totalJP,
      icon: Coins,
      bg: "bg-emerald-50",
      border: "border-emerald-200",
      iconBg: "bg-emerald-100",
      iconColor: "text-emerald-600",
      textColor: "text-emerald-700",
    },
    {
      title: "Rata-rata JP",
      value: avgJP,
      icon: BarChart3,
      bg: "bg-sky-50",
      border: "border-sky-200",
      iconBg: "bg-sky-100",
      iconColor: "text-sky-600",
      textColor: "text-sky-700",
    },
    {
      title: "JP Tertinggi",
      value: maxJP,
      icon: TrendingUp,
      bg: "bg-amber-50",
      border: "border-amber-200",
      iconBg: "bg-amber-100",
      iconColor: "text-amber-600",
      textColor: "text-amber-700",
    },
    {
      title: "JP Terendah",
      value: minJP,
      icon: TrendingDown,
      bg: "bg-rose-50",
      border: "border-rose-200",
      iconBg: "bg-rose-100",
      iconColor: "text-rose-600",
      textColor: "text-rose-700",
    },
  ];

  return (
    <div className="container mx-auto py-10">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Pola Remunerasi</CardTitle>
              <CardDescription>
                Analisis Jasa Pelayanan (JP) berdasarkan produk layanan rumah sakit
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
                  placeholder="Cari berdasarkan Deskripsi INA-CBG, Grouper, atau Diaglist..."
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
            <div className="w-48">
              <Label htmlFor="spesialisasi">Spesialisasi Dokter</Label>
              <Select value={spesialisasiFilter} onValueChange={setSpesialisasiFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih spesialisasi" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua</SelectItem>
                  {Array.from(new Set(data.map(item => item.spesialisasi_dokter).filter(Boolean))).map(specialization => (
                    <SelectItem key={specialization} value={specialization}>
                      {specialization}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end gap-2">
              <Button
                variant="default"
                onClick={handleRecalculateJP}
                disabled={recalculatingJP}
                className="bg-purple-600 hover:bg-purple-700 text-white"
              >
                <Calculator className={`h-4 w-4 mr-2 ${recalculatingJP ? "animate-pulse" : ""}`} />
                {recalculatingJP ? "Menghitung Ulang JP…" : "Recalculate JP"}
              </Button>
              <Button onClick={handleExport} className="bg-red-600 hover:bg-red-700 text-white">
                <Download className="h-4 w-4 mr-2" />
                Unduh Laporan
              </Button>
            </div>
          </div>

          {/* Statistik */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            {statsCards.map((card) => {
              const Icon = card.icon;
              return (
                <Card
                  key={card.title}
                  className={`shadow-none border ${card.border} ${card.bg}`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-medium text-muted-foreground">
                          {card.title}
                        </div>
                        <div className={`text-2xl font-bold ${card.textColor}`}>
                          {formatCurrency(card.value)}
                        </div>
                      </div>
                      <div className={`rounded-full p-3 ${card.iconBg}`}>
                        <Icon className={`h-6 w-6 ${card.iconColor}`} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
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
                    <TableHead>Grouper</TableHead>
                    <TableHead>Diaglist</TableHead>
                    <TableHead>Spesialisasi Dokter</TableHead>
                    <TableHead className="text-right">Tarif INA-CBGs</TableHead>
                    <TableHead className="text-right">JP Tindakan</TableHead>
                    <TableHead className="text-right">JP IBS</TableHead>
                    <TableHead className="text-right">JP Lab</TableHead>
                    <TableHead className="text-right">JP Radiologi</TableHead>
                    <TableHead className="text-right">JP Farmasi</TableHead>
                    <TableHead className="text-right">JP Kamar</TableHead>
                    <TableHead className="text-right">JP Visite</TableHead>
                    <TableHead className="text-right">JP Konsultasi</TableHead>
                    <TableHead className="text-right font-bold">Total JP</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredData.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium capitalize">{item.jenis}</TableCell>
                      <TableCell>{item.deskripsi_inacbg || "-"}</TableCell>
                      <TableCell>{item.grouper || "-"}</TableCell>
                      <TableCell>{item.diaglist || "-"}</TableCell>
                      <TableCell>{item.spesialisasi_dokter || "-"}</TableCell>
                      <TableCell className="text-right">{formatCurrency(item.tarif_inacbgs_numeric || 0)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(item.jp_tindakan || 0)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(item.jp_ibs || 0)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(item.jp_laboratorium || 0)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(item.jp_radiologi || 0)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(item.jp_farmasi || 0)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(item.jp_kamar_akomodasi || 0)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(item.jp_visite || 0)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(item.jp_konsultasi || 0)}</TableCell>
                      <TableCell className="text-right font-bold text-green-600">
                        {formatCurrency(item.total_jp)}
                      </TableCell>
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

export default PolaRemunerasi;
