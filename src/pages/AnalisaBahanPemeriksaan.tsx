import React, { useState, useEffect, useMemo } from "react";
import { useYear } from "@/contexts/YearContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Download, ChevronDown, ChevronRight, FlaskConical, Activity, Droplet, Radiation, Scissors, RefreshCw } from "lucide-react";
import { useReportDownload } from "@/components/report";

interface AnalisaBahanData {
  id: string;
  tahun: number;
  kode_unit_kerja: string;
  nama_unit_kerja: string;
  kode_operator: string | null;
  nama_operator: string | null;
  kode_tindakan: string;
  nama_tindakan: string;
  jenis_tindakan: string;
  kode_bahan: string;
  nama_bahan: string;
  satuan: string | null;
  harga_satuan: number;
  jumlah_satuan: number;
  total_harga: number;
}

interface GroupedData {
  [jenisTindakan: string]: {
    data: AnalisaBahanData[];
    totalHarga: number;
  };
}

const AnalisaBahanPemeriksaan = () => {
  const { toast } = useToast();
  const { downloadReport } = useReportDownload();
  const [data, setData] = useState<AnalisaBahanData[]>([]);
  const [loading, setLoading] = useState(true);
  const [tahun, setTahun] = useState(new Date().getFullYear());
  const [filters, setFilters] = useState({
    unit_kerja: "",
    operator: "",
    tindakan: "",
  });
  const [expandedJenis, setExpandedJenis] = useState<{ [key: string]: boolean }>({
    laboratorium: true,
    BDRS: false,
    radiologi: false,
    tindakan: false,
    IBS: false,
  });

  useEffect(() => {
    fetchData();
  }, [tahun]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const { data: result, error } = await supabase
        .from("analisa_bahan_pemeriksaan")
        .select("*")
        .eq("tahun", tahun)
        .order("jenis_tindakan", { ascending: true })
        .order("nama_tindakan", { ascending: true });

      if (error) throw error;
      setData(result || []);
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

  const handleRefreshData = async () => {
    try {
      setLoading(true);
      toast({
        title: "Memperbarui data...",
        description: "Sedang mengambil data dari tabel kalkulasi",
      });

      const { data: result, error } = await supabase
        .rpc("populate_analisa_bahan_pemeriksaan", {
          p_tahun: tahun,
        });

      if (error) throw error;

      toast({
        title: "Berhasil",
        description: `Data berhasil diperbarui: ${result?.inserted_count || 0} record ditambahkan`,
      });

      // Fetch ulang data
      await fetchData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Gagal memperbarui data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredData = useMemo(() => {
    return data.filter((item) => {
      if (filters.unit_kerja && !item.nama_unit_kerja?.toLowerCase().includes(filters.unit_kerja.toLowerCase())) {
        return false;
      }
      if (filters.operator && !item.nama_operator?.toLowerCase().includes(filters.operator.toLowerCase())) {
        return false;
      }
      if (filters.tindakan && !item.nama_tindakan?.toLowerCase().includes(filters.tindakan.toLowerCase())) {
        return false;
      }
      return true;
    });
  }, [data, filters]);

  const groupedData: GroupedData = useMemo(() => {
    const grouped: GroupedData = {};
    
    filteredData.forEach((item) => {
      if (!grouped[item.jenis_tindakan]) {
        grouped[item.jenis_tindakan] = {
          data: [],
          totalHarga: 0,
        };
      }
      grouped[item.jenis_tindakan].data.push(item);
      grouped[item.jenis_tindakan].totalHarga += item.total_harga;
    });
    
    return grouped;
  }, [filteredData]);

  // Statistik
  const totalTindakan = useMemo(() => {
    const unique = new Set(filteredData.map(item => item.kode_tindakan));
    return unique.size;
  }, [filteredData]);

  const top3Termahal = useMemo(() => {
    const byTindakan = new Map<string, { nama: string; total: number }>();
    
    filteredData.forEach((item) => {
      const key = item.kode_tindakan;
      if (!byTindakan.has(key)) {
        byTindakan.set(key, { nama: item.nama_tindakan, total: 0 });
      }
      byTindakan.get(key)!.total += item.total_harga;
    });
    
    return Array.from(byTindakan.entries())
      .map(([kode, { nama, total }]) => ({ kode, nama, total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 3);
  }, [filteredData]);

  const top3Termurah = useMemo(() => {
    const byTindakan = new Map<string, { nama: string; total: number }>();
    
    filteredData.forEach((item) => {
      const key = item.kode_tindakan;
      if (!byTindakan.has(key)) {
        byTindakan.set(key, { nama: item.nama_tindakan, total: 0 });
      }
      byTindakan.get(key)!.total += item.total_harga;
    });
    
    return Array.from(byTindakan.entries())
      .map(([kode, { nama, total }]) => ({ kode, nama, total }))
      .filter((item) => item.total > 0)
      .sort((a, b) => a.total - b.total)
      .slice(0, 3);
  }, [filteredData]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(value);
  };

  const toggleJenis = (jenis: string) => {
    setExpandedJenis((prev) => ({
      ...prev,
      [jenis]: !prev[jenis],
    }));
  };

  const getJenisIcon = (jenis: string) => {
    switch (jenis) {
      case "laboratorium":
        return <FlaskConical className="h-4 w-4" />;
      case "radiologi":
        return <Radiation className="h-4 w-4" />;
      case "BDRS":
        return <Droplet className="h-4 w-4" />;
      case "tindakan":
        return <Activity className="h-4 w-4" />;
      case "IBS":
        return <Scissors className="h-4 w-4" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
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

    const dataForExport = filteredData.map((item) => ({
      "Jenis Tindakan": item.jenis_tindakan,
      "Kode Unit Kerja": item.kode_unit_kerja,
      "Nama Unit Kerja": item.nama_unit_kerja,
      "Kode Operator": item.kode_operator || "-",
      "Nama Operator": item.nama_operator || "-",
      "Kode Tindakan": item.kode_tindakan,
      "Nama Tindakan": item.nama_tindakan,
      "Kode Bahan": item.kode_bahan,
      "Nama Bahan": item.nama_bahan,
      "Satuan": item.satuan || "-",
      "Harga Satuan": item.harga_satuan,
      "Jumlah Satuan": item.jumlah_satuan,
      "Total Harga": item.total_harga,
    }));

    await downloadReport({
      title: "Laporan Analisa Bahan Pemeriksaan",
      subtitle: `Data tahun ${tahun}`,
      filename: `analisa_bahan_pemeriksaan_${tahun}`,
      records: dataForExport,
      filters: { Tahun: tahun, ...filters },
    });
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="space-y-3">
        <h1 className="text-3xl font-bold">Analisa Bahan Pemeriksaan</h1>
        <div className="flex flex-wrap items-center gap-3">
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
          
          <Input
            value={filters.unit_kerja}
            onChange={(e) => setFilters({ ...filters, unit_kerja: e.target.value })}
            placeholder="Filter unit kerja"
            className="w-[200px]"
          />
          
          <Input
            value={filters.operator}
            onChange={(e) => setFilters({ ...filters, operator: e.target.value })}
            placeholder="Filter operator"
            className="w-[200px]"
          />
          
          <Input
            value={filters.tindakan}
            onChange={(e) => setFilters({ ...filters, tindakan: e.target.value })}
            placeholder="Filter tindakan"
            className="w-[200px]"
          />

          <Button variant="outline" onClick={handleRefreshData} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Perbarui Data
          </Button>

          <Button variant="report" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Unduh Laporan
          </Button>
        </div>
      </div>

      {/* Kartu Statistik */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border border-sky-100 bg-sky-50">
          <CardContent className="p-6 space-y-1">
            <p className="text-sm font-medium text-sky-700">Total Tindakan</p>
            <p className="text-2xl font-bold text-sky-900">{totalTindakan}</p>
            <p className="text-xs text-sky-600">Jumlah tindakan unik</p>
          </CardContent>
        </Card>

        <Card className="border border-red-100 bg-red-50">
          <CardContent className="p-6 space-y-2">
            <p className="text-sm font-medium text-red-700">Top 3 Tindakan Termahal</p>
            {top3Termahal.length === 0 ? (
              <p className="text-xs text-red-600">Tidak ada data</p>
            ) : (
              <div className="space-y-1">
                {top3Termahal.map((item, idx) => (
                  <div key={item.kode} className="text-xs">
                    <span className="font-semibold">{idx + 1}. {item.nama}</span>
                    <br />
                    <span className="text-red-800">{formatCurrency(item.total)}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border border-green-100 bg-green-50">
          <CardContent className="p-6 space-y-2">
            <p className="text-sm font-medium text-green-700">Top 3 Tindakan Termurah</p>
            {top3Termurah.length === 0 ? (
              <p className="text-xs text-green-600">Tidak ada data</p>
            ) : (
              <div className="space-y-1">
                {top3Termurah.map((item, idx) => (
                  <div key={item.kode} className="text-xs">
                    <span className="font-semibold">{idx + 1}. {item.nama}</span>
                    <br />
                    <span className="text-green-800">{formatCurrency(item.total)}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Expandable Tables per Jenis Tindakan */}
      {loading ? (
        <div className="text-center py-10">Loading...</div>
      ) : Object.keys(groupedData).length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-gray-500">
            Tidak ada data analisa bahan pemeriksaan
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {Object.entries(groupedData).map(([jenis, { data: jenisData, totalHarga }]) => (
            <Card key={jenis}>
              <Collapsible
                open={expandedJenis[jenis]}
                onOpenChange={() => toggleJenis(jenis)}
              >
                <CollapsibleTrigger asChild>
                  <CardHeader className="cursor-pointer hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {expandedJenis[jenis] ? (
                          <ChevronDown className="h-5 w-5 text-gray-500" />
                        ) : (
                          <ChevronRight className="h-5 w-5 text-gray-500" />
                        )}
                        {getJenisIcon(jenis)}
                        <CardTitle className="text-lg capitalize">{jenis}</CardTitle>
                        <Badge variant="outline">{jenisData.length} bahan</Badge>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">Total</p>
                        <p className="text-lg font-bold text-teal-700">
                          {formatCurrency(totalHarga)}
                        </p>
                      </div>
                    </div>
                  </CardHeader>
                </CollapsibleTrigger>
                
                <CollapsibleContent>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader className="bg-gray-100">
                          <TableRow>
                            <TableHead>Unit Kerja</TableHead>
                            <TableHead>Operator</TableHead>
                            <TableHead>Tindakan</TableHead>
                            <TableHead>Bahan</TableHead>
                            <TableHead className="text-right">Harga Satuan</TableHead>
                            <TableHead className="text-right">Jumlah</TableHead>
                            <TableHead className="text-right">Total</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {jenisData.map((item) => (
                            <TableRow key={item.id}>
                              <TableCell>
                                <div className="font-medium">{item.nama_unit_kerja}</div>
                                <div className="text-xs text-muted-foreground">
                                  {item.kode_unit_kerja}
                                </div>
                              </TableCell>
                              <TableCell>
                                {item.nama_operator ? (
                                  <>
                                    <div className="font-medium">{item.nama_operator}</div>
                                    <div className="text-xs text-muted-foreground">
                                      {item.kode_operator}
                                    </div>
                                  </>
                                ) : (
                                  <span className="text-muted-foreground">-</span>
                                )}
                              </TableCell>
                              <TableCell>
                                <div className="font-medium">{item.nama_tindakan}</div>
                                <div className="text-xs text-muted-foreground">
                                  {item.kode_tindakan}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="font-medium">{item.nama_bahan}</div>
                                <div className="text-xs text-muted-foreground">
                                  {item.kode_bahan}
                                </div>
                              </TableCell>
                              <TableCell className="text-right">
                                {formatCurrency(item.harga_satuan)}
                              </TableCell>
                              <TableCell className="text-right">
                                {item.jumlah_satuan} {item.satuan}
                              </TableCell>
                              <TableCell className="text-right font-semibold text-teal-700">
                                {formatCurrency(item.total_harga)}
                              </TableCell>
                            </TableRow>
                          ))}
                          <TableRow className="bg-gray-50 font-bold">
                            <TableCell colSpan={6} className="text-right">
                              Subtotal {jenis}:
                            </TableCell>
                            <TableCell className="text-right text-teal-700 text-lg">
                              {formatCurrency(totalHarga)}
                            </TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </CollapsibleContent>
              </Collapsible>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default AnalisaBahanPemeriksaan;

