import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Download, RefreshCcw, ClipboardList, Scale, Building, Loader2 } from "lucide-react";
import { useReportDownload } from "@/components/report";
import * as XLSX from 'xlsx';

interface KalkulasiBiayaKelasAkomodasiData {
  id: string;
  user_id: string;
  tahun: number;
  kode_unit_kerja: string;
  nama_unit_kerja: string;
  kelas: string;
  dasar_alokasi_hari_rawat: number;
  biaya_gaji_tunjangan: number;
  biaya_jasa_pelayanan: number;
  biaya_obat: number;
  biaya_bhp: number;
  biaya_makan_karyawan: number;
  biaya_makan_pasien: number;
  biaya_rumah_tangga: number;
  biaya_cetak: number;
  biaya_atk: number;
  biaya_listrik: number;
  biaya_air: number;
  biaya_telp: number;
  biaya_pemeliharaan_bangunan: number;
  biaya_pemeliharaan_alat_medis: number;
  biaya_pemeliharaan_alat_non_medis: number;
  biaya_operasional_lainnya: number;
  biaya_penyusutan_gedung: number;
  biaya_penyusutan_jaringan: number;
  biaya_penyusutan_alat_medis: number;
  biaya_penyusutan_alat_non_medis: number;
  biaya_pendidikan_pelatihan: number;
  biaya_laundry: number;
  biaya_sterilisasi: number;
  biaya_tidak_langsung_terdistribusi: number;
  alokasi_biaya_gizi: number;
  unit_cost_per_kelas: number;
  created_at: string;
  updated_at: string;
  rata_rata_uc_kelas_vvip: number;
  rata_rata_uc_kelas_vip: number;
  rata_rata_uc_kelas_i: number;
  rata_rata_uc_kelas_ii: number;
  rata_rata_uc_kelas_iii: number;
  dasar_alokasi_tempat_tidur: number;
  dasar_alokasi_luas_kamar: number;
}

const KalkulasiBiayaKelasAkomodasi = () => {
  const [data, setData] = useState<KalkulasiBiayaKelasAkomodasiData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filteredData, setFilteredData] = useState<KalkulasiBiayaKelasAkomodasiData[]>([]);
  const [filters, setFilters] = useState({
    tahun: new Date().getFullYear().toString(),
    nama_unit_kerja: "",
    kelas: "",
    search: ""
  });
  const { toast } = useToast();
  const { downloadReport } = useReportDownload();
  const [downloadingReport, setDownloadingReport] = useState(false);

  useEffect(() => {
    console.log('Component mounted, fetching data...');
    fetchData();
  }, []);

  useEffect(() => {
    console.log('Applying filters...', filters);
    applyFilters();
  }, [data, filters]);

  const fetchData = async () => {
    try {
      console.log('Starting data fetch...');
      setLoading(true);
      setError(null);
      
      const { data: result, error: fetchError } = await supabase
        .from('kalkulasi_biaya_kelas_akomodasi')
        .select('*')
        .order('nama_unit_kerja', { ascending: true });

      console.log('Fetch result:', result);
      console.log('Fetch error:', fetchError);

      if (fetchError) {
        console.error('Supabase error:', fetchError);
        throw fetchError;
      }

      setData(result || []);
      console.log('Data set successfully:', result?.length || 0, 'items');
    } catch (error) {
      console.error('Error fetching data:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setError(errorMessage);
      toast({
        title: "Error",
        description: `Gagal mengambil data: ${errorMessage}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      console.log('Fetch completed, loading set to false');
    }
  };

  const applyFilters = () => {
    console.log('Applying filters to data:', data.length, 'items');
    let filtered = [...data];

    if (filters.tahun) {
      filtered = filtered.filter(item => item.tahun.toString() === filters.tahun);
    }

    if (filters.nama_unit_kerja) {
      filtered = filtered.filter(item => 
        item.nama_unit_kerja.toLowerCase().includes(filters.nama_unit_kerja.toLowerCase())
      );
    }

    if (filters.kelas) {
      filtered = filtered.filter(item => 
        item.kelas.toLowerCase().includes(filters.kelas.toLowerCase())
      );
    }

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(item =>
        item.nama_unit_kerja.toLowerCase().includes(searchLower) ||
        item.kelas.toLowerCase().includes(searchLower) ||
        item.kode_unit_kerja.toLowerCase().includes(searchLower)
      );
    }

    console.log('Filtered data:', filtered.length, 'items');
    setFilteredData(filtered);
  };

  const handleFilterChange = (key: string, value: string) => {
    console.log('Filter change:', key, value);
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const handleDownloadReport = async () => {
    if (filteredData.length === 0) {
      toast({
        title: "Error",
        description: "Tidak ada data untuk diunduh",
        variant: "destructive",
      });
      return;
    }

    try {
      setDownloadingReport(true);

      const subtitleParts: string[] = [];
      if (filters.tahun) subtitleParts.push(`Tahun ${filters.tahun}`);
      if (filters.nama_unit_kerja) subtitleParts.push(`Unit ${filters.nama_unit_kerja}`);
      if (filters.kelas) subtitleParts.push(`Kelas ${filters.kelas}`);

      const records = filteredData.map((item) => ({
        "Tahun": item.tahun,
        "Kode Unit Kerja": item.kode_unit_kerja,
        "Nama Unit Kerja": item.nama_unit_kerja,
        "Kelas": item.kelas,
        "Alokasi Biaya Gizi": Math.round(item.alokasi_biaya_gizi || 0),
        "Unit Cost Per Kelas": Math.round(item.unit_cost_per_kelas || 0),
      }));

      await downloadReport({
        title: "Laporan Kalkulasi Biaya Kelas Akomodasi",
        subtitle: subtitleParts.join(" • ") || undefined,
        filename: `kalkulasi_biaya_kelas_akomodasi_${filters.tahun || 'all'}`,
        records,
        orientation: "landscape",
      });

      toast({
        title: "Success",
        description: "Laporan berhasil disiapkan",
      });
    } catch (error: any) {
      console.error("Gagal mengunduh kalkulasi biaya kelas akomodasi:", error);
      toast({
        title: "Error",
        description: error?.message || String(error),
        variant: "destructive",
      });
    } finally {
      setDownloadingReport(false);
    }
  };

  const getTotalUnitCost = () => {
    return filteredData.reduce((total, item) => total + item.unit_cost_per_kelas, 0);
  };

  const getKelasStats = () => {
    const stats = {
      VVIP: 0,
      VIP: 0,
      I: 0,
      II: 0,
      III: 0
    };

    filteredData.forEach(item => {
      if (stats.hasOwnProperty(item.kelas)) {
        stats[item.kelas as keyof typeof stats]++;
      }
    });

    return stats;
  };

  const getKelasAverageUnitCost = () => {
    const stats = {
      VVIP: { total: 0, count: 0, average: 0 },
      VIP: { total: 0, count: 0, average: 0 },
      I: { total: 0, count: 0, average: 0 },
      II: { total: 0, count: 0, average: 0 },
      III: { total: 0, count: 0, average: 0 }
    };

    filteredData.forEach(item => {
      if (stats.hasOwnProperty(item.kelas)) {
        const kelasKey = item.kelas as keyof typeof stats;
        stats[kelasKey].total += item.unit_cost_per_kelas;
        stats[kelasKey].count += 1;
      }
    });

    // Calculate averages
    Object.keys(stats).forEach(kelas => {
      const kelasKey = kelas as keyof typeof stats;
      if (stats[kelasKey].count > 0) {
        stats[kelasKey].average = stats[kelasKey].total / stats[kelasKey].count;
      }
    });

    return stats;
  };

  console.log('Rendering component. Loading:', loading, 'Error:', error, 'Data length:', data.length);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p>Loading data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-red-500 text-lg mb-4">Error loading data</div>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={fetchData}>Retry</Button>
        </div>
      </div>
    );
  }

  const kelasStats = getKelasStats();
  const kelasAverageStats = getKelasAverageUnitCost();
  const totalData = filteredData.length;
  const uniqueUnitCount = new Set(filteredData.map((item) => item.kode_unit_kerja)).size;
  const averageUnitCost = filteredData.length > 0 ? getTotalUnitCost() / filteredData.length : 0;

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="space-y-3">
        <h1 className="text-3xl font-bold">Kalkulasi Biaya Kelas Akomodasi</h1>
        <div className="flex flex-wrap items-center gap-3">
          <Input
            value={filters.tahun}
            onChange={(e) => handleFilterChange('tahun', e.target.value)}
            placeholder="Tahun"
            className="w-24"
          />
          <Input
            value={filters.nama_unit_kerja}
            onChange={(e) => handleFilterChange('nama_unit_kerja', e.target.value)}
            placeholder="Filter unit kerja"
            className="w-48"
          />
          <Input
            value={filters.kelas}
            onChange={(e) => handleFilterChange('kelas', e.target.value)}
            placeholder="Filter kelas"
            className="flex-1 min-w-[160px]"
          />
          <Input
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            placeholder="Cari unit kerja atau kelas..."
            className="flex-1 min-w-[200px]"
          />
          <Button
            onClick={() => {
              void handleDownloadReport();
            }}
            disabled={loading || filteredData.length === 0 || downloadingReport}
            variant="report"
          >
            {downloadingReport ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Download className="h-4 w-4 mr-2" />
            )}
            {downloadingReport ? "Menyiapkan..." : "Unduh Laporan"}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={fetchData}
            disabled={loading}
            aria-label="Refresh data"
          >
            <RefreshCcw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <Card className="border border-sky-100 bg-sky-50">
          <CardContent className="p-6 space-y-1">
            <p className="text-sm font-medium text-sky-700">Total Data</p>
            <p className="text-2xl font-bold text-sky-900">{totalData}</p>
            <p className="text-xs text-sky-600">Jumlah baris sesuai filter aktif</p>
          </CardContent>
        </Card>
        <Card className="border border-emerald-100 bg-emerald-50">
          <CardContent className="p-6 space-y-1">
            <p className="text-sm font-medium text-emerald-700">Rata-rata Unit Cost</p>
            <p className="text-2xl font-bold text-emerald-900">
              {formatCurrency(averageUnitCost)}
            </p>
            <p className="text-xs text-emerald-600">Rata-rata biaya per kelas akomodasi</p>
          </CardContent>
        </Card>
        <Card className="border border-indigo-100 bg-indigo-50">
          <CardContent className="p-6 space-y-1">
            <p className="text-sm font-medium text-indigo-700">Unit Kerja</p>
            <p className="text-2xl font-bold text-indigo-900">
              {uniqueUnitCount.toLocaleString('id-ID')}
            </p>
            <p className="text-xs text-indigo-600">Total unit kerja unik dalam data</p>
          </CardContent>
        </Card>
        <Card className="border border-amber-100 bg-amber-50">
          <CardContent className="p-6 space-y-1">
            <p className="text-sm font-medium text-amber-700">Total Biaya Gizi</p>
            <p className="text-2xl font-bold text-amber-900">
              {formatCurrency(filteredData.reduce((sum, item) => sum + item.alokasi_biaya_gizi, 0))}
            </p>
            <p className="text-xs text-amber-600">Akumulasi alokasi biaya gizi</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {Object.entries(kelasStats).map(([kelas, count]) => (
          <Card key={kelas} className="border border-slate-200 bg-slate-50">
            <CardContent className="p-6">
              <div className="flex flex-col items-center text-center space-y-3">
                <Badge variant="outline" className="px-4 py-1 text-sm font-semibold">
                  {kelas}
                </Badge>
                <div>
                  <p className="text-sm font-medium text-slate-600">Kelas {kelas}</p>
                  <p className="text-xl font-bold text-slate-900">
                    {formatCurrency(
                      kelasAverageStats[kelas as keyof typeof kelasAverageStats].average || 0,
                    )}
                  </p>
                  <p className="text-xs text-slate-500">{count} data</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Data Kalkulasi Biaya Kelas Akomodasi</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-[#0f766e]">
                <TableRow className="bg-[#0f766e] hover:bg-[#0f766e]">
                  <TableHead className="text-white font-semibold">Tahun</TableHead>
                  <TableHead className="text-white font-semibold">Unit Kerja</TableHead>
                  <TableHead className="text-white font-semibold">Kelas</TableHead>
                  <TableHead className="text-white font-semibold">Alokasi Biaya Gizi</TableHead>
                  <TableHead className="text-white font-semibold">Unit Cost Per Kelas</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredData.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.tahun}</TableCell>
                    <TableCell>
                      <div className="font-medium">{item.nama_unit_kerja}</div>
                      <div className="text-sm text-muted-foreground">{item.kode_unit_kerja}</div>
                    </TableCell>
                    <TableCell>
                      <Badge className="bg-teal-100 text-teal-700 border-teal-200">
                        {item.kelas}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatCurrency(item.alokasi_biaya_gizi)}</TableCell>
                    <TableCell className="font-medium">
                      {formatCurrency(item.unit_cost_per_kelas)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {filteredData.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              Tidak ada data yang sesuai dengan filter
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default KalkulasiBiayaKelasAkomodasi;