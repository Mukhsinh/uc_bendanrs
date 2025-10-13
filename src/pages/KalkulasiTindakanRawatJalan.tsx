import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Download, Filter, Calculator } from "lucide-react";
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
              <Label htmlFor="jenis-tindakan">Jenis Tindakan</Label>
              <Input
                id="jenis-tindakan"
                value={filters.jenis_tindakan}
                onChange={(e) => handleFilterChange('jenis_tindakan', e.target.value)}
                placeholder="Jenis Tindakan"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="search">Pencarian</Label>
              <Input
                id="search"
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                placeholder="Cari unit kerja, jenis tindakan..."
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                <p className="text-sm font-medium text-muted-foreground">Total Jumlah Tindakan</p>
                <p className="text-2xl font-bold">{getTotalJumlah().toLocaleString('id-ID')}</p>
              </div>
              <Button onClick={exportToExcel} size="sm" className="ml-4">
                <Download className="h-4 w-4 mr-2" />
                Unduh Laporan
              </Button>
            </div>
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
              <TableHeader>
                <TableRow>
                  <TableHead>Tahun</TableHead>
                  <TableHead>Unit Kerja</TableHead>
                  <TableHead>Jenis Tindakan</TableHead>
                  <TableHead>Jumlah</TableHead>
                  <TableHead>Biaya Bahan Tindakan</TableHead>
                  <TableHead>
                    <div>
                      Unit Cost
                      <div className="text-xs font-normal text-muted-foreground">(exclude biaya bahan)</div>
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

