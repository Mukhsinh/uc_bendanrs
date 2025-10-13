import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, FileDown, TrendingUp, CreditCard, Package, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import * as XLSX from "xlsx";

interface RincianData {
  id: string;
  kode_unit_kerja: string;
  nama_unit_kerja: string;
  kode_tindakan: string;
  nama_tindakan: string;
  jumlah_tindakan: number;
  kode_barang: string;
  nama_barang: string;
  qty_per_tindakan: number;
  satuan: string;
  harga_satuan: number;
  jumlah_total: number;
  total_rupiah: number;
  sumber_tabel: string;
}

const BudgetingBHPRincian = () => {
  const [data, setData] = useState<RincianData[]>([]);
  const [filteredData, setFilteredData] = useState<RincianData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedUnit, setSelectedUnit] = useState<string>("all");
  const [unitKerjaList, setUnitKerjaList] = useState<string[]>([]);
  const { toast } = useToast();

  const fetchData = async () => {
    try {
      setLoading(true);
      const { data: session } = await supabase.auth.getSession();
      
      if (!session.session?.user.id) {
        throw new Error("User tidak terautentikasi");
      }

      const { data: rincianData, error } = await supabase
        .from("rincian_budgeting_bhp")
        .select("*")
        .eq("user_id", session.session.user.id)
        .eq("tahun", 2025)
        .order("total_rupiah", { ascending: false });

      if (error) throw error;

      setData(rincianData || []);
      setFilteredData(rincianData || []);
      
      // Extract unique unit kerja
      const units = Array.from(new Set((rincianData || []).map(item => item.nama_unit_kerja)));
      setUnitKerjaList(units.sort());
    } catch (error: any) {
      console.error("Error fetching data:", error);
      toast({
        title: "Error",
        description: error.message || "Gagal mengambil data rincian",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const refreshData = async () => {
    try {
      setRefreshing(true);
      const { data: session } = await supabase.auth.getSession();
      
      if (!session.session?.user.id) {
        throw new Error("User tidak terautentikasi");
      }

      const { error } = await supabase.rpc("populate_rincian_budgeting_bhp", {
        p_user_id: session.session.user.id,
        p_tahun: 2025,
      });

      if (error) throw error;

      toast({
        title: "Berhasil",
        description: "Data rincian berhasil diperbarui",
      });

      await fetchData();
    } catch (error: any) {
      console.error("Error refreshing data:", error);
      toast({
        title: "Error",
        description: error.message || "Gagal memperbarui data",
        variant: "destructive",
      });
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (selectedUnit === "all") {
      setFilteredData(data);
    } else {
      setFilteredData(data.filter(item => item.nama_unit_kerja === selectedUnit));
    }
  }, [selectedUnit, data]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat("id-ID", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const exportToExcel = () => {
    const exportData = filteredData.map((item, index) => {
      const jumlahTotal = (item.jumlah_total ?? (item.jumlah_tindakan * item.qty_per_tindakan)) || 0;
      const totalRp = (item.total_rupiah ?? (jumlahTotal * item.harga_satuan)) || 0;
      return ({
      No: index + 1,
      "Unit Kerja": item.nama_unit_kerja,
      "Kode Tindakan": item.kode_tindakan,
      "Nama Tindakan": item.nama_tindakan,
      "Jumlah Tindakan": item.jumlah_tindakan,
      "Kode Barang": item.kode_barang,
      "Nama Barang": item.nama_barang,
      "Qty per Tindakan": item.qty_per_tindakan,
      "Satuan": item.satuan,
      "Harga Satuan": item.harga_satuan,
        "Jumlah Total": jumlahTotal,
        "Total Rupiah": totalRp,
      });
    });

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Rincian BHP");
    
    const fileName = `Budgeting_BHP_Rincian_${selectedUnit}_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);

    toast({
      title: "Berhasil",
      description: `File ${fileName} berhasil diunduh`,
    });
  };

  // Calculate statistics
  const topVolume = filteredData.length > 0 
    ? filteredData.reduce((prev, current) => prev.jumlah_total > current.jumlah_total ? prev : current)
    : null;

  const topPrice = filteredData.length > 0
    ? filteredData.reduce((prev, current) => prev.total_rupiah > current.total_rupiah ? prev : current)
    : null;

  const totalBudgeting = filteredData.reduce((sum, item) => sum + item.total_rupiah, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Budgeting BHP (Rincian)</h1>
          <p className="text-gray-600 mt-1">
            Detail rincian bahan per tindakan dengan kalkulasi jumlah dan harga
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={refreshData}
            disabled={refreshing}
            variant="outline"
            className="border-teal-600 text-teal-600 hover:bg-teal-50"
          >
            {refreshing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Memperbarui...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Perbarui
              </>
            )}
          </Button>
          <Button
            onClick={exportToExcel}
            disabled={filteredData.length === 0}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            <FileDown className="mr-2 h-4 w-4" />
            Unduh Laporan
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-l-4 border-l-teal-500">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Total Items Bahan</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-gray-900">{formatNumber(filteredData.length)}</p>
            <p className="text-xs text-gray-500 mt-1">Detail bahan</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Total Budgeting</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalBudgeting)}</p>
            <p className="text-xs text-gray-500 mt-1">Nilai keseluruhan</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Unique Barang</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-gray-900">
              {new Set(filteredData.map(item => item.kode_barang)).size}
            </p>
            <p className="text-xs text-gray-500 mt-1">Jenis barang</p>
          </CardContent>
        </Card>
      </div>

      {/* Badges */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {topVolume && (
          <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-300">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-blue-800">
                <TrendingUp className="h-5 w-5" />
                Quantity Terbanyak
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-semibold text-lg text-blue-900">{topVolume.nama_barang}</p>
              <div className="flex items-center justify-between mt-2">
                <Badge className="bg-blue-600 text-white">{topVolume.nama_unit_kerja}</Badge>
                <p className="text-sm text-blue-700">
                  <span className="font-bold text-xl">{formatNumber(topVolume.jumlah_total)}</span> {topVolume.satuan}
                </p>
              </div>
              <p className="text-xs text-gray-600 mt-1">Untuk tindakan: {topVolume.nama_tindakan}</p>
            </CardContent>
          </Card>
        )}

        {topPrice && (
          <Card className="bg-gradient-to-r from-purple-50 to-purple-100 border-purple-300">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-purple-800">
                <CreditCard className="h-5 w-5" />
                Nilai Tertinggi
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-semibold text-lg text-purple-900">{topPrice.nama_barang}</p>
              <div className="flex items-center justify-between mt-2">
                <Badge className="bg-purple-600 text-white">{topPrice.nama_unit_kerja}</Badge>
                <p className="text-sm text-purple-700">
                  <span className="font-bold text-xl">{formatCurrency(topPrice.total_rupiah)}</span>
                </p>
              </div>
              <p className="text-xs text-gray-600 mt-1">Untuk tindakan: {topPrice.nama_tindakan}</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Filter */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Filter Data</CardTitle>
            <Select value={selectedUnit} onValueChange={setSelectedUnit}>
              <SelectTrigger className="w-[300px]">
                <SelectValue placeholder="Pilih unit kerja" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Unit Kerja</SelectItem>
                {unitKerjaList.map((unit) => (
                  <SelectItem key={unit} value={unit}>
                    {unit}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
      </Card>

      {/* Data Table */}
      <Card>
        <CardHeader>
          <CardTitle>Rincian Budgeting BHP</CardTitle>
          <CardDescription>
            Menampilkan {filteredData.length} dari {data.length} total item bahan
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">No</TableHead>
                  <TableHead>Unit Kerja</TableHead>
                  <TableHead>Tindakan</TableHead>
                  <TableHead>Kode Barang</TableHead>
                  <TableHead>Nama Barang</TableHead>
                  <TableHead className="text-right">Qty/Tindakan</TableHead>
                  <TableHead className="text-right">Jumlah Tindakan</TableHead>
                  <TableHead>Satuan</TableHead>
                  <TableHead className="text-right">Harga Satuan</TableHead>
                  <TableHead className="text-right">Jumlah Total</TableHead>
                  <TableHead className="text-right">Total Rupiah</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={11} className="text-center py-8 text-gray-500">
                      <Package className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                      <p>Belum ada data rincian bahan</p>
                      <p className="text-xs mt-1">Pastikan sudah input data bahan di halaman kalkulasi</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredData.map((item, index) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{index + 1}</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium text-sm">{item.nama_unit_kerja}</p>
                          <p className="text-xs text-gray-500">{item.kode_unit_kerja}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-xs">
                          <p className="text-sm font-medium">{item.nama_tindakan}</p>
                          <p className="text-xs text-gray-500 font-mono">{item.kode_tindakan}</p>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-xs">{item.kode_barang}</TableCell>
                      <TableCell>
                        <p className="text-sm font-medium">{item.nama_barang}</p>
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant="outline">{formatNumber(item.qty_per_tindakan)}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant="secondary">{formatNumber(item.jumlah_tindakan)}</Badge>
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">{item.satuan}</TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(item.harga_satuan || 0)}
                      </TableCell>
                      <TableCell className="text-right font-bold text-blue-600">
                        {formatNumber((item.jumlah_total ?? (item.jumlah_tindakan * item.qty_per_tindakan)) || 0)}
                      </TableCell>
                      <TableCell className="text-right font-bold text-purple-600">
                        {formatCurrency((item.total_rupiah ?? (((item.jumlah_total ?? (item.jumlah_tindakan * item.qty_per_tindakan)) || 0) * (item.harga_satuan || 0))) || 0)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BudgetingBHPRincian;

