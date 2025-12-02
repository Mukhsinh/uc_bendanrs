import React, { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Download, Calculator, RefreshCw, Building, TrendingUp, TrendingDown, Layers, ListOrdered } from "lucide-react";
import { BarChart, Bar, CartesianGrid, XAxis, YAxis } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { useReportDownload } from "@/components/report";

interface KalkulasiTindakanRawatJalanData {
  id: string;
  user_id: string;
  tahun: number;
  kode_jenis: number;
  kode_unit_kerja: string;
  nama_unit_kerja: string;
  kode_jenis_tindakan: string;
  jenis_tindakan: string;
  jumlah: number;
  waktu: number;
  profesionalisme: number;
  tingkat_kesulitan: number;
  hasil_kali_waktu: number;
  hasil_kali: number;
  biaya_bahan_tindakan: number;
  kali_bahan: number;
  dasar_alokasi_kali_waktu: number;
  dasar_alokasi_hasil_kali: number;
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
  unit_cost_tindakan_rawat_jalan: number;
  created_at: string;
  updated_at: string;
}

const KalkulasiTindakanRawatJalan = () => {
  const [data, setData] = useState<KalkulasiTindakanRawatJalanData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filteredData, setFilteredData] = useState<KalkulasiTindakanRawatJalanData[]>([]);
  const [showFilters, setShowFilters] = useState(true);
  const [filters, setFilters] = useState({
    tahun: new Date().getFullYear().toString(),
    nama_unit_kerja: "",
    jenis_tindakan: "",
    search: ""
  });
  const [recalculateProgress, setRecalculateProgress] = useState(0);
  const [isRecalculating, setIsRecalculating] = useState(false);
  const { toast } = useToast();
  const { downloadReport } = useReportDownload();

  const toNumber = (value: number | string | null | undefined): number => {
    if (typeof value === "number") {
      return Number.isFinite(value) ? value : 0;
    }
    if (typeof value === "string") {
      const parsed = parseFloat(value);
      return Number.isFinite(parsed) ? parsed : 0;
    }
    return 0;
  };

  const biayaFields: Array<keyof Pick<KalkulasiTindakanRawatJalanData,
    'biaya_gaji_tunjangan' |
    'biaya_jasa_pelayanan' |
    'biaya_obat' |
    'biaya_bhp' |
    'biaya_makan_karyawan' |
    'biaya_makan_pasien' |
    'biaya_rumah_tangga' |
    'biaya_cetak' |
    'biaya_atk' |
    'biaya_listrik' |
    'biaya_air' |
    'biaya_telp' |
    'biaya_pemeliharaan_bangunan' |
    'biaya_pemeliharaan_alat_medis' |
    'biaya_pemeliharaan_alat_non_medis' |
    'biaya_operasional_lainnya' |
    'biaya_penyusutan_gedung' |
    'biaya_penyusutan_jaringan' |
    'biaya_penyusutan_alat_medis' |
    'biaya_penyusutan_alat_non_medis' |
    'biaya_pendidikan_pelatihan' |
    'biaya_laundry' |
    'biaya_sterilisasi' |
    'biaya_tidak_langsung_terdistribusi'
  >> = [
    'biaya_gaji_tunjangan',
    'biaya_jasa_pelayanan',
    'biaya_obat',
    'biaya_bhp',
    'biaya_makan_karyawan',
    'biaya_makan_pasien',
    'biaya_rumah_tangga',
    'biaya_cetak',
    'biaya_atk',
    'biaya_listrik',
    'biaya_air',
    'biaya_telp',
    'biaya_pemeliharaan_bangunan',
    'biaya_pemeliharaan_alat_medis',
    'biaya_pemeliharaan_alat_non_medis',
    'biaya_operasional_lainnya',
    'biaya_penyusutan_gedung',
    'biaya_penyusutan_jaringan',
    'biaya_penyusutan_alat_medis',
    'biaya_penyusutan_alat_non_medis',
    'biaya_pendidikan_pelatihan',
    'biaya_laundry',
    'biaya_sterilisasi',
    'biaya_tidak_langsung_terdistribusi',
  ];

  useEffect(() => {
    console.log('Component mounted, fetching data...');
    fetchData();
  }, []);

  useEffect(() => {
    console.log('Applying filters...', filters);
    applyFilters();
  }, [data, filters]);

  const recalculateData = async () => {
    try {
      console.log('Starting recalculation...');
      setIsRecalculating(true);
      setRecalculateProgress(0);
      setError(null);
      
      const tahun = filters.tahun ? parseInt(filters.tahun) : new Date().getFullYear();
      
      toast({
        title: "Memproses",
        description: `Memulai rekalkulasi untuk tahun ${tahun}...`,
      });
      
      const startTime = Date.now();
      
      // Panggil fungsi untuk semua data sekaligus (fungsi database sudah dioptimasi)
      const { data: recalcResult, error: recalcError } = await supabase
        .rpc('manual_recalculate_kalkulasi_tindakan_rawat_jalan', {
          p_tahun: tahun,
          p_kode_unit_kerja: null // Process all units at once
        });
      
      if (recalcError) {
        console.error('RPC Error:', recalcError);
        throw new Error(recalcError.message || 'Gagal memanggil fungsi rekalkulasi');
      }
      
      if (!recalcResult || !recalcResult.success) {
        throw new Error(recalcResult?.message || 'Rekalkulasi gagal');
      }
      
      setRecalculateProgress(100);
      
      const executionTime = ((Date.now() - startTime) / 1000).toFixed(2);
      const affectedRows = recalcResult?.affected_rows || 0;
      
      toast({
        title: "Berhasil",
        description: `Rekalkulasi selesai! ${affectedRows} baris diproses dalam ${executionTime}s`,
      });
      
      // Refresh data setelah selesai
      console.log('Refreshing data...');
      await fetchData();
      console.log('Data refreshed successfully');
      
    } catch (error) {
      console.error('Error recalculating data:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setError(errorMessage);
      toast({
        title: "Error",
        description: `Gagal melakukan rekalkulasi: ${errorMessage}`,
        variant: "destructive",
      });
    } finally {
      setIsRecalculating(false);
      setRecalculateProgress(0);
    }
  };

  const fetchData = async () => {
    try {
      console.log('Starting data fetch...');
      setLoading(true);
      setError(null);
      
      const { data: result, error: fetchError } = await supabase
        .from('kalkulasi_tindakan_rawat_jalan')
        .select('*')
        .order('nama_unit_kerja', { ascending: true })
        .limit(5000);

      console.log('Fetch result:', result);
      console.log('Fetch error:', fetchError);

      if (fetchError) {
        console.error('Supabase error:', fetchError);
        throw fetchError;
      }

      const normalizedData: KalkulasiTindakanRawatJalanData[] = (result || []).map((item) => {
        const normalizedItem: KalkulasiTindakanRawatJalanData = {
          ...item,
          tahun: toNumber(item.tahun),
          kode_jenis: toNumber(item.kode_jenis),
          jumlah: toNumber(item.jumlah),
          waktu: toNumber(item.waktu),
          profesionalisme: toNumber(item.profesionalisme),
          tingkat_kesulitan: toNumber(item.tingkat_kesulitan),
          hasil_kali_waktu: toNumber(item.hasil_kali_waktu),
          hasil_kali: toNumber(item.hasil_kali),
          biaya_bahan_tindakan: toNumber(item.biaya_bahan_tindakan),
          kali_bahan: toNumber(item.kali_bahan),
          dasar_alokasi_kali_waktu: toNumber(item.dasar_alokasi_kali_waktu),
          dasar_alokasi_hasil_kali: toNumber(item.dasar_alokasi_hasil_kali),
          biaya_gaji_tunjangan: toNumber(item.biaya_gaji_tunjangan),
          biaya_jasa_pelayanan: toNumber(item.biaya_jasa_pelayanan),
          biaya_obat: toNumber(item.biaya_obat),
          biaya_bhp: toNumber(item.biaya_bhp),
          biaya_makan_karyawan: toNumber(item.biaya_makan_karyawan),
          biaya_makan_pasien: toNumber(item.biaya_makan_pasien),
          biaya_rumah_tangga: toNumber(item.biaya_rumah_tangga),
          biaya_cetak: toNumber(item.biaya_cetak),
          biaya_atk: toNumber(item.biaya_atk),
          biaya_listrik: toNumber(item.biaya_listrik),
          biaya_air: toNumber(item.biaya_air),
          biaya_telp: toNumber(item.biaya_telp),
          biaya_pemeliharaan_bangunan: toNumber(item.biaya_pemeliharaan_bangunan),
          biaya_pemeliharaan_alat_medis: toNumber(item.biaya_pemeliharaan_alat_medis),
          biaya_pemeliharaan_alat_non_medis: toNumber(item.biaya_pemeliharaan_alat_non_medis),
          biaya_operasional_lainnya: toNumber(item.biaya_operasional_lainnya),
          biaya_penyusutan_gedung: toNumber(item.biaya_penyusutan_gedung),
          biaya_penyusutan_jaringan: toNumber(item.biaya_penyusutan_jaringan),
          biaya_penyusutan_alat_medis: toNumber(item.biaya_penyusutan_alat_medis),
          biaya_penyusutan_alat_non_medis: toNumber(item.biaya_penyusutan_alat_non_medis),
          biaya_pendidikan_pelatihan: toNumber(item.biaya_pendidikan_pelatihan),
          biaya_laundry: toNumber(item.biaya_laundry),
          biaya_sterilisasi: toNumber(item.biaya_sterilisasi),
          biaya_tidak_langsung_terdistribusi: toNumber(item.biaya_tidak_langsung_terdistribusi),
          unit_cost_tindakan_rawat_jalan: toNumber(item.unit_cost_tindakan_rawat_jalan),
        } as KalkulasiTindakanRawatJalanData;

        if (normalizedItem.unit_cost_tindakan_rawat_jalan <= 0) {
          const computedUnitCost = biayaFields.reduce(
            (sum, field) => sum + toNumber(item[field]),
            0
          );
          normalizedItem.unit_cost_tindakan_rawat_jalan = computedUnitCost;
        }

        return normalizedItem;
      });

      setData(normalizedData);
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

    if (filters.jenis_tindakan) {
      filtered = filtered.filter(item => 
        item.jenis_tindakan.toLowerCase().includes(filters.jenis_tindakan.toLowerCase())
      );
    }

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(item =>
        item.nama_unit_kerja.toLowerCase().includes(searchLower) ||
        item.jenis_tindakan.toLowerCase().includes(searchLower) ||
        item.kode_jenis_tindakan.toLowerCase().includes(searchLower)
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

  const exportToExcel = async () => {
    if (filteredData.length === 0) {
      toast({
        title: "Error",
        description: "Tidak ada data untuk diekspor",
        variant: "destructive",
      });
      return;
    }

    try {
      // Records untuk PDF: menggunakan data frontend (filteredData yang ditampilkan di tabel)
      const recordsForPdf = filteredData.map((item) => ({
        Tahun: item.tahun,
        "Unit Kerja": `${item.nama_unit_kerja} (${item.kode_unit_kerja})`,
        "Jenis Tindakan": `${item.jenis_tindakan} (${item.kode_jenis_tindakan})`,
        Jumlah: item.jumlah,
        "Biaya Bahan Tindakan": item.biaya_bahan_tindakan,
        "Unit Cost": item.unit_cost_tindakan_rawat_jalan,
      }));

      // Records untuk Excel: menggunakan data database (fetch langsung dari database)
      const { data: dbData, error: fetchError } = await supabase
        .from('kalkulasi_tindakan_rawat_jalan')
        .select('*')
        .order('tahun', { ascending: false })
        .order('nama_unit_kerja')
        .order('jenis_tindakan')
        .limit(5000);

      if (fetchError) {
        throw fetchError;
      }

      // Apply same filters as frontend
      let filteredDbData = dbData || [];
      if (filters.tahun) {
        filteredDbData = filteredDbData.filter((item: any) => item.tahun.toString() === filters.tahun);
      }
      if (filters.nama_unit_kerja) {
        filteredDbData = filteredDbData.filter((item: any) =>
          item.nama_unit_kerja?.toLowerCase().includes(filters.nama_unit_kerja.toLowerCase())
        );
      }
      if (filters.jenis_tindakan) {
        filteredDbData = filteredDbData.filter((item: any) =>
          item.jenis_tindakan?.toLowerCase().includes(filters.jenis_tindakan.toLowerCase())
        );
      }

      const recordsForExcel = filteredDbData.map((item: any) => ({
        Tahun: item.tahun,
        "Kode Unit Kerja": item.kode_unit_kerja,
        "Nama Unit Kerja": item.nama_unit_kerja,
        "Kode Jenis Tindakan": item.kode_jenis_tindakan,
        "Jenis Tindakan": item.jenis_tindakan,
        Jumlah: item.jumlah,
        "Waktu (menit)": item.waktu,
        "Profesionalisme": item.profesionalisme,
        "Tingkat Kesulitan": item.tingkat_kesulitan,
        "Biaya Bahan Tindakan": item.biaya_bahan_tindakan,
        "Biaya Gaji & Tunjangan": item.biaya_gaji_tunjangan || 0,
        "Biaya BHP": item.biaya_bhp || 0,
        "Biaya Makan Karyawan": item.biaya_makan_karyawan || 0,
        "Biaya Rumah Tangga": item.biaya_rumah_tangga || 0,
        "Biaya Cetak": item.biaya_cetak || 0,
        "Biaya ATK": item.biaya_atk || 0,
        "Biaya Listrik": item.biaya_listrik || 0,
        "Biaya Air": item.biaya_air || 0,
        "Biaya Telepon": item.biaya_telp || 0,
        "Biaya Pemeliharaan Bangunan": item.biaya_pemeliharaan_bangunan || 0,
        "Biaya Pemeliharaan Alat Medis": item.biaya_pemeliharaan_alat_medis || 0,
        "Biaya Pemeliharaan Alat Non Medis": item.biaya_pemeliharaan_alat_non_medis || 0,
        "Biaya Operasional Lainnya": item.biaya_operasional_lainnya || 0,
        "Biaya Penyusutan Gedung": item.biaya_penyusutan_gedung || 0,
        "Biaya Penyusutan Jaringan": item.biaya_penyusutan_jaringan || 0,
        "Biaya Penyusutan Alat Medis": item.biaya_penyusutan_alat_medis || 0,
        "Biaya Penyusutan Alat Non Medis": item.biaya_penyusutan_alat_non_medis || 0,
        "Biaya Pendidikan & Pelatihan": item.biaya_pendidikan_pelatihan || 0,
        "Biaya Laundry": item.biaya_laundry || 0,
        "Biaya Sterilisasi": item.biaya_sterilisasi || 0,
        "Biaya Tidak Langsung Terdistribusi": item.biaya_tidak_langsung_terdistribusi || 0,
        "Unit Cost": item.unit_cost_tindakan_rawat_jalan,
      }));

      const fileName = `kalkulasi_tindakan_rawat_jalan_${filters.tahun || "all"}_${new Date()
        .toISOString()
        .split("T")[0]}`;

      await downloadReport({
        title: "Laporan Kalkulasi Tindakan Rawat Jalan",
        subtitle: filters.tahun ? `Tahun ${filters.tahun}` : undefined,
        filename: fileName,
        recordsForPdf,
        recordsForExcel,
        orientation: "landscape",
      });

      toast({
        title: "Success",
        description: "Data berhasil diekspor.",
      });
    } catch (error) {
      console.error("Gagal mengunduh laporan kalkulasi tindakan rawat jalan:", error);
      toast({
        title: "Error",
        description: "Gagal mengunduh laporan.",
        variant: "destructive",
      });
    }
  };

  const getTotalUnitCost = () => {
    return filteredData.reduce((total, item) => total + item.unit_cost_tindakan_rawat_jalan, 0);
  };

  const totalKlinik = useMemo(() => {
    const uniqueUnits = new Set(filteredData.map(item => item.kode_unit_kerja));
    return uniqueUnits.size;
  }, [filteredData]);

  const topTindakanTerbanyak = useMemo(() => {
    const sorted = [...filteredData].sort((a, b) => b.jumlah - a.jumlah);
    return sorted.slice(0, 3);
  }, [filteredData]);

  const topTindakanTersedikit = useMemo(() => {
    const sorted = [...filteredData].sort((a, b) => a.jumlah - b.jumlah);
    return sorted.slice(0, 3);
  }, [filteredData]);

  const ThreeDBar = ({
    x,
    y,
    width,
    height,
    frontFill,
    topFill,
    sideFill,
    depth = 12,
  }: {
    x: number;
    y: number;
    width: number;
    height: number;
    frontFill: string;
    topFill: string;
    sideFill: string;
    depth?: number;
  }) => {
    if (width <= 0 || height <= 0) return null;
    const adjustedY = y;
    const adjustedHeight = height;
    const topY = adjustedY - depth;
    const bottomY = adjustedY + adjustedHeight;
    const rightX = x + width;
    const leftX = x;
    const rightTopX = rightX - depth;
    const leftTopX = leftX - depth;
    const rightBottomX = rightX - depth;
    const bottomTopY = bottomY - depth;

    return (
      <g>
        <path
          d={`M${leftX},${adjustedY} L${rightX},${adjustedY} L${rightX},${bottomY} L${leftX},${bottomY} Z`}
          fill={frontFill}
        />
        <path
          d={`M${leftX},${adjustedY} L${rightX},${adjustedY} L${rightTopX},${topY} L${leftTopX},${topY} Z`}
          fill={topFill}
        />
        <path
          d={`M${rightX},${adjustedY} L${rightX},${bottomY} L${rightBottomX},${bottomTopY} L${rightTopX},${topY} Z`}
          fill={sideFill}
        />
      </g>
    );
  };

  const getTotalJumlah = () => {
    return filteredData.reduce((total, item) => total + item.jumlah, 0);
  };

  const getTotalBiayaBahanTindakan = () => {
    return filteredData.reduce((total, item) => total + item.biaya_bahan_tindakan, 0);
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

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Kalkulasi Tindakan Rawat Jalan</h1>
          <p className="text-muted-foreground">
            Manajemen dan analisis biaya tindakan rawat jalan
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button
          variant="outline"
          onClick={() => setShowFilters((prev) => !prev)}
          className="border-slate-300 text-slate-700 hover:bg-slate-100"
        >
          Filter
        </Button>
        <Button
          onClick={() => {
            void exportToExcel();
          }}
          className="bg-red-500 hover:bg-red-600 text-white"
          disabled={filteredData.length === 0 || loading || isRecalculating}
        >
          <Download className="h-4 w-4 mr-2" />
          Unduh Laporan
        </Button>
        <Button
          onClick={recalculateData}
          className="bg-purple-600 hover:bg-purple-700 text-white"
          disabled={loading || isRecalculating}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isRecalculating ? 'animate-spin' : ''}`} />
          {isRecalculating ? 'Memproses...' : 'Perbarui Data'}
        </Button>
      </div>

      {isRecalculating && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="pt-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-blue-900">
                  Rekalkulasi sedang berjalan...
                </span>
                <span className="text-sm font-bold text-blue-900">
                  {recalculateProgress}%
                </span>
              </div>
              <div className="w-full bg-blue-200 rounded-full h-3 overflow-hidden">
                <div
                  className="bg-blue-600 h-full rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${recalculateProgress}%` }}
                />
              </div>
              <p className="text-xs text-blue-700">
                Mohon tunggu, proses ini mungkin memakan waktu beberapa menit tergantung jumlah data.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {showFilters && (
        <Card className="border-none bg-slate-50 shadow-sm">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Input
                id="tahun"
                type="number"
                value={filters.tahun}
                onChange={(e) => handleFilterChange('tahun', e.target.value)}
                placeholder="Tahun"
              />
              <Input
                id="unit-kerja"
                value={filters.nama_unit_kerja}
                onChange={(e) => handleFilterChange('nama_unit_kerja', e.target.value)}
                placeholder="Nama Unit Kerja"
              />
              <Input
                id="jenis-tindakan"
                value={filters.jenis_tindakan}
                onChange={(e) => handleFilterChange('jenis_tindakan', e.target.value)}
                placeholder="Jenis Tindakan"
              />
              <Input
                id="search"
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                placeholder="Cari unit kerja atau jenis tindakan..."
              />
          </div>
        </CardContent>
      </Card>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card className="border-none bg-emerald-50 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-emerald-700">Total Data</p>
                <p className="text-2xl font-bold text-emerald-900">{filteredData.length}</p>
              </div>
              <div className="rounded-full bg-white/80 p-3 text-emerald-600">
                <Layers className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-none bg-sky-50 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-sky-700">Total Jumlah Tindakan</p>
                <p className="text-2xl font-bold text-sky-900">{getTotalJumlah().toLocaleString('id-ID')}</p>
              </div>
              <div className="rounded-full bg-white/80 p-3 text-sky-500">
                <TrendingUp className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-none bg-rose-50 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-rose-700">Jumlah Klinik</p>
                <p className="text-2xl font-bold text-rose-900">{totalKlinik}</p>
              </div>
              <div className="rounded-full bg-white/80 p-3 text-rose-500">
                <Building className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-none bg-indigo-50 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-indigo-700">Total Unit Cost</p>
                <p className="text-2xl font-bold text-indigo-900">{formatCurrency(getTotalUnitCost())}</p>
              </div>
              <div className="rounded-full bg-white/80 p-3 text-indigo-500">
                <Calculator className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="border border-violet-100 bg-violet-50 shadow-sm">
          <CardHeader className="flex items-center justify-between space-y-0 pb-2">
            <div>
              <CardTitle className="text-sm font-semibold text-violet-700">Top 3 Tindakan Terbanyak</CardTitle>
              <CardDescription className="text-xs text-violet-500">Berdasarkan jumlah tindakan</CardDescription>
            </div>
            <ListOrdered className="h-5 w-5 text-violet-500" />
          </CardHeader>
          <CardContent className="space-y-2">
            {topTindakanTerbanyak.length > 0 ? (
              <ol className="space-y-2">
                {topTindakanTerbanyak.map((item, index) => (
                  <li key={item.kode_jenis_tindakan} className="flex items-center justify-between rounded-md bg-white/70 px-3 py-2">
                    <div className="flex items-start gap-2">
                      <span className="mt-1 text-xs font-semibold text-violet-600">{index + 1}.</span>
                      <div>
                        <p className="font-medium text-sm text-violet-900">{item.jenis_tindakan}</p>
                        <p className="text-xs text-violet-500">Unit {item.nama_unit_kerja}</p>
                      </div>
                    </div>
                    <span className="rounded-full bg-violet-100 px-2 py-1 text-xs font-semibold text-violet-600">
                      {item.jumlah.toLocaleString('id-ID')} tindakan
                    </span>
                  </li>
                ))}
              </ol>
            ) : (
              <div className="rounded-lg bg-white/70 px-4 py-6 text-center text-sm text-violet-500">
                Belum ada data yang dapat ditampilkan
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border border-amber-100 bg-amber-50 shadow-sm">
          <CardHeader className="flex items-center justify-between space-y-0 pb-2">
            <div>
              <CardTitle className="text-sm font-semibold text-amber-700">Top 3 Tindakan Tersedikit</CardTitle>
              <CardDescription className="text-xs text-amber-500">Berdasarkan jumlah tindakan</CardDescription>
            </div>
            <TrendingDown className="h-5 w-5 text-amber-500" />
          </CardHeader>
          <CardContent className="space-y-2">
            {topTindakanTersedikit.length > 0 ? (
              <ol className="space-y-2">
                {topTindakanTersedikit.map((item, index) => (
                  <li key={item.kode_jenis_tindakan} className="flex items-center justify-between rounded-md bg-white/70 px-3 py-2">
                    <div className="flex items-start gap-2">
                      <span className="mt-1 text-xs font-semibold text-amber-600">{index + 1}.</span>
                      <div>
                        <p className="font-medium text-sm text-amber-900">{item.jenis_tindakan}</p>
                        <p className="text-xs text-amber-500">Unit {item.nama_unit_kerja}</p>
                      </div>
                    </div>
                    <span className="rounded-full bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-600">
                      {item.jumlah.toLocaleString('id-ID')} tindakan
                    </span>
                  </li>
                ))}
              </ol>
            ) : (
              <div className="rounded-lg bg-white/70 px-4 py-6 text-center text-sm text-amber-500">
                Belum ada data yang dapat ditampilkan
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Data Table */}
      <Card>
        <CardHeader>
          <CardTitle>Data Kalkulasi Tindakan Rawat Jalan</CardTitle>
          <CardDescription>
            Menampilkan {filteredData.length} dari {data.length} data
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-[#0f766e]">
                <TableRow className="bg-[#0f766e] hover:bg-[#0f766e]">
                  <TableHead className="text-white">Tahun</TableHead>
                  <TableHead className="text-white">Unit Kerja</TableHead>
                  <TableHead className="text-white">Jenis Tindakan</TableHead>
                  <TableHead className="text-white">Jumlah</TableHead>
                  <TableHead className="text-white text-center">Waktu (mnt)</TableHead>
                  <TableHead className="text-white text-center">Prof.</TableHead>
                  <TableHead className="text-white text-center">Tingkat</TableHead>
                  <TableHead className="text-white">Biaya Bahan Tindakan</TableHead>
                  <TableHead className="text-white">Unit Cost</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredData.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.tahun}</TableCell>
                    <TableCell>
                      <div>
                        <Badge variant="outline" className="mb-1">
                          {item.kode_unit_kerja}
                        </Badge>
                        <div className="text-sm">{item.nama_unit_kerja}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <Badge variant="secondary" className="mb-1">
                          {item.kode_jenis_tindakan}
                        </Badge>
                        <div className="text-sm">{item.jenis_tindakan}</div>
                      </div>
                    </TableCell>
                    <TableCell>{item.jumlah.toLocaleString('id-ID')}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className="text-xs">
                        {item.waktu || 0} mnt
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="secondary" className="text-xs">
                        {item.profesionalisme || 1}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="secondary" className="text-xs">
                        {item.tingkat_kesulitan || 1}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">
                      {formatCurrency(item.biaya_bahan_tindakan)}
                    </TableCell>
                    <TableCell className="font-medium">
                      {formatCurrency(item.unit_cost_tindakan_rawat_jalan)}
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

export default KalkulasiTindakanRawatJalan;

