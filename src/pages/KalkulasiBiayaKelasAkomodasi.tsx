import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Download, Filter, Calculator, Bed } from "lucide-react";
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
        'Kelas': item.kelas,
        'Alokasi Biaya Gizi': item.alokasi_biaya_gizi,
        'Unit Cost Per Kelas': item.unit_cost_per_kelas,
      }))
    );

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Kalkulasi Biaya Kelas Akomodasi');

    const fileName = `kalkulasi_biaya_kelas_akomodasi_${filters.tahun || 'all'}_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(workbook, fileName);

    toast({
      title: "Success",
      description: "Data berhasil diekspor ke Excel",
    });
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

  const getKelasBadgeVariant = (kelas: string) => {
    switch (kelas) {
      case 'VVIP':
        return 'destructive';
      case 'VIP':
        return 'default';
      case 'I':
        return 'secondary';
      case 'II':
        return 'outline';
      case 'III':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  const getKelasBadgeStyle = (kelas: string) => {
    switch (kelas) {
      case 'VVIP':
        return 'bg-gradient-to-r from-red-500 to-red-600 text-white border-red-500';
      case 'VIP':
        return 'bg-gradient-to-r from-purple-500 to-purple-600 text-white border-purple-500';
      case 'I':
        return 'bg-gradient-to-r from-blue-500 to-blue-600 text-white border-blue-500';
      case 'II':
        return 'bg-gradient-to-r from-green-500 to-green-600 text-white border-green-500';
      case 'III':
        return 'bg-gradient-to-r from-orange-500 to-orange-600 text-white border-orange-500';
      default:
        return 'bg-gradient-to-r from-gray-500 to-gray-600 text-white border-gray-500';
    }
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

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Kalkulasi Biaya Kelas Akomodasi</h1>
          <p className="text-muted-foreground">
            Analisis biaya akomodasi per kelas perawatan rawat inap
          </p>
        </div>
      </div>

      {/* Filter Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filter Data
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tahun">Tahun</Label>
              <Input
                id="tahun"
                type="number"
                value={filters.tahun}
                onChange={(e) => handleFilterChange('tahun', e.target.value)}
                placeholder="Tahun"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="unit-kerja">Nama Unit Kerja</Label>
              <Input
                id="unit-kerja"
                value={filters.nama_unit_kerja}
                onChange={(e) => handleFilterChange('nama_unit_kerja', e.target.value)}
                placeholder="Nama Unit Kerja"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="kelas">Kelas</Label>
              <Input
                id="kelas"
                value={filters.kelas}
                onChange={(e) => handleFilterChange('kelas', e.target.value)}
                placeholder="Kelas (VVIP, VIP, I, II, III)"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="search">Pencarian</Label>
              <Input
                id="search"
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                placeholder="Cari unit kerja, kelas..."
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Data</p>
                <p className="text-2xl font-bold">{filteredData.length}</p>
              </div>
              <Calculator className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Rata-rata Unit Cost</p>
                <p className="text-2xl font-bold">
                  {filteredData.length > 0 ? formatCurrency(getTotalUnitCost() / filteredData.length) : formatCurrency(0)}
                </p>
              </div>
              <Calculator className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Unit Kerja</p>
                <p className="text-2xl font-bold">
                  {new Set(filteredData.map(item => item.kode_unit_kerja)).size}
                </p>
              </div>
              <Button onClick={exportToExcel} size="sm" className="ml-4">
                <Download className="h-4 w-4 mr-2" />
                Unduh Laporan
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Kelas Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {Object.entries(kelasStats).map(([kelas, count]) => (
          <Card key={kelas}>
            <CardContent className="p-6">
              <div className="flex flex-col items-center text-center space-y-4">
                <Badge className={`${getKelasBadgeStyle(kelas)} text-lg px-4 py-2`}>
                  {kelas}
                </Badge>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Kelas {kelas}</p>
                  <p className="text-2xl font-bold">
                    {kelasAverageStats[kelas as keyof typeof kelasAverageStats].average > 0 
                      ? formatCurrency(kelasAverageStats[kelas as keyof typeof kelasAverageStats].average)
                      : formatCurrency(0)
                    }
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {count} data
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Data Table */}
      <Card>
        <CardHeader>
          <CardTitle>Data Kalkulasi Biaya Kelas Akomodasi</CardTitle>
          <CardDescription>
            Menampilkan {filteredData.length} dari {data.length} data
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tahun</TableHead>
                  <TableHead>Unit Kerja</TableHead>
                  <TableHead>Kelas</TableHead>
                  <TableHead>Alokasi Biaya Gizi</TableHead>
                  <TableHead>Unit Cost Per Kelas</TableHead>
                  {/* Hidden column: Rata-rata UC */}
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
                      <Badge className={getKelasBadgeStyle(item.kelas)}>
                        {item.kelas}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatCurrency(item.alokasi_biaya_gizi)}</TableCell>
                    <TableCell className="font-medium">
                      {formatCurrency(item.unit_cost_per_kelas)}
                    </TableCell>
                    {/* Hidden column: Rata-rata UC */}
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