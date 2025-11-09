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
import * as XLSX from 'xlsx';

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
  const { toast } = useToast();

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
        .from('kalkulasi_tindakan_rawat_jalan')
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

  const exportToExcel = () => {
    if (filteredData.length === 0) {
      toast({
        title: "Error",
        description: "Tidak ada data untuk diekspor",
        variant: "destructive",
      });
      return;
    }

    const worksheet = XLSX.utils.json_to_sheet(
      filteredData.map(item => ({
        'Tahun': item.tahun,
        'Kode Unit Kerja': item.kode_unit_kerja,
        'Nama Unit Kerja': item.nama_unit_kerja,
        'Kode Jenis Tindakan': item.kode_jenis_tindakan,
        'Jenis Tindakan': item.jenis_tindakan,
        'Jumlah': item.jumlah,
        'Biaya Bahan Tindakan': item.biaya_bahan_tindakan,
        'Unit Cost Tindakan Rawat Jalan': item.unit_cost_tindakan_rawat_jalan,
      }))
    );

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Kalkulasi Tindakan RJ');

    const fileName = `kalkulasi_tindakan_rawat_jalan_${filters.tahun || 'all'}_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(workbook, fileName);

    toast({
      title: "Success",
      description: "Data berhasil diekspor ke Excel",
    });
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
          onClick={exportToExcel}
          className="bg-red-500 hover:bg-red-600 text-white"
          disabled={filteredData.length === 0 || loading}
        >
          <Download className="h-4 w-4 mr-2" />
          Unduh Laporan
        </Button>
        <Button
          onClick={fetchData}
          className="bg-purple-600 hover:bg-purple-700 text-white"
          disabled={loading}
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Perbarui Data
        </Button>
      </div>

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
        <Card className="border-none bg-violet-50 shadow-sm">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-violet-700">Top 3 Tindakan Terbanyak</p>
                <p className="text-xs text-violet-500">Berdasarkan jumlah tindakan</p>
              </div>
              <div className="rounded-full bg-white/80 p-3 text-violet-500">
                <ListOrdered className="h-6 w-6" />
              </div>
            </div>
            {topTindakanTerbanyak.length > 0 ? (
              <ChartContainer
                className="h-[220px] w-full"
                config={{ value: { label: "Jumlah", color: "#7c3aed" } }}
              >
                <BarChart
                  data={topTindakanTerbanyak.map(item => ({
                    label:
                      item.jenis_tindakan.length > 18
                        ? `${item.jenis_tindakan.slice(0, 18)}…`
                        : item.jenis_tindakan,
                    fullLabel: item.jenis_tindakan,
                    value: item.jumlah,
                  }))}
                  margin={{ top: 10, right: 16, left: -12, bottom: 8 }}
                >
                  <defs>
                    <linearGradient id="rjTopGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#c4b5fd" />
                      <stop offset="70%" stopColor="#7c3aed" />
                      <stop offset="100%" stopColor="#4c1d95" />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} stroke="rgba(124,58,237,0.12)" strokeDasharray="6 10" />
                  <XAxis
                    dataKey="label"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#4c1d95", fontSize: 12 }}
                  />
                  <YAxis hide />
                  <ChartTooltip content={<ChartTooltipContent labelKey="fullLabel" />} cursor={{ fill: "rgba(124,58,237,0.08)" }} />
                  <Bar
                    dataKey="value"
                    shape={(props) => (
                      <ThreeDBar
                        {...props}
                        frontFill="url(#rjTopGradient)"
                        topFill="#ede9fe"
                        sideFill="#5b21b6"
                      />
                    )}
                    barSize={44}
                  />
                </BarChart>
              </ChartContainer>
            ) : (
              <div className="rounded-lg bg-white/70 px-4 py-6 text-center text-sm text-violet-500">
                Data tidak tersedia
              </div>
            )}
          </CardContent>
        </Card>
        <Card className="border-none bg-amber-50 shadow-sm">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-amber-700">Top 3 Tindakan Tersedikit</p>
                <p className="text-xs text-amber-500">Berdasarkan jumlah tindakan</p>
              </div>
              <div className="rounded-full bg-white/80 p-3 text-amber-500">
                <TrendingDown className="h-6 w-6" />
              </div>
            </div>
            {topTindakanTersedikit.length > 0 ? (
              <ChartContainer
                className="h-[220px] w-full"
                config={{ value: { label: "Jumlah", color: "#f97316" } }}
              >
                <BarChart
                  data={topTindakanTersedikit.map(item => ({
                    label:
                      item.jenis_tindakan.length > 18
                        ? `${item.jenis_tindakan.slice(0, 18)}…`
                        : item.jenis_tindakan,
                    fullLabel: item.jenis_tindakan,
                    value: item.jumlah,
                  }))}
                  margin={{ top: 10, right: 16, left: -12, bottom: 8 }}
                >
                  <defs>
                    <linearGradient id="rjLowGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#fde68a" />
                      <stop offset="70%" stopColor="#f97316" />
                      <stop offset="100%" stopColor="#b45309" />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} stroke="rgba(249,115,22,0.12)" strokeDasharray="6 10" />
                  <XAxis
                    dataKey="label"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#b45309", fontSize: 12 }}
                  />
                  <YAxis hide />
                  <ChartTooltip content={<ChartTooltipContent labelKey="fullLabel" />} cursor={{ fill: "rgba(249,115,22,0.08)" }} />
                  <Bar
                    dataKey="value"
                    shape={(props) => (
                      <ThreeDBar
                        {...props}
                        frontFill="url(#rjLowGradient)"
                        topFill="#fef3c7"
                        sideFill="#c2410c"
                      />
                    )}
                    barSize={44}
                  />
                </BarChart>
              </ChartContainer>
            ) : (
              <div className="rounded-lg bg-white/70 px-4 py-6 text-center text-sm text-amber-500">
                Data tidak tersedia
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
                  <TableHead className="text-white">Biaya Bahan Tindakan</TableHead>
                  <TableHead className="text-white">
                    <div>
                      Unit Cost
                      <div className="text-xs font-normal text-white/80">(exclude biaya bahan)</div>
                    </div>
                  </TableHead>
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

