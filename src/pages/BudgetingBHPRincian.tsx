import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2, FileDown, TrendingUp, CreditCard, Package, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useReportDownload } from "@/components/report";
import { calculateTotalBudgeting } from "@/utils/calculations";

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

interface AggregatedRincianData {
  kode_barang: string;
  nama_barang: string;
  satuan: string;
  harga_satuan: number;
  total_qty: number;
  total_jumlah_tindakan: number;
  total_rupiah: number;
}

interface ParentBudgetingData {
  total_budgeting_rincian: number;
  nama_unit_kerja: string;
  kode_unit_kerja: string;
}

const BudgetingBHPRincian = () => {
  const [rawData, setRawData] = useState<RincianData[]>([]);
  const [parentData, setParentData] = useState<ParentBudgetingData[]>([]);
  const [data, setData] = useState<AggregatedRincianData[]>([]);
  const [filteredData, setFilteredData] = useState<AggregatedRincianData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedUnit, setSelectedUnit] = useState<string>("all");
  const [unitKerjaList, setUnitKerjaList] = useState<string[]>([]);
  const [activeYear, setActiveYear] = useState<number | null>(null);
  const [totalItemTersedia, setTotalItemTersedia] = useState<number>(0);
  const [totalItemDigunakan, setTotalItemDigunakan] = useState<number>(0);
  const [totalItemValid, setTotalItemValid] = useState<number>(0);
  const [showItemDialog, setShowItemDialog] = useState(false);
  const { toast } = useToast();
  const { downloadReport } = useReportDownload();

  const aggregateByBarang = (items: RincianData[]): AggregatedRincianData[] => {
    const map = new Map<string, AggregatedRincianData>();

    items.forEach((item) => {
      const key = item.kode_barang || `${item.nama_barang}-${item.satuan}`;
      const jumlahTindakan = Number(item.jumlah_tindakan ?? 0);
      const qtyForRowRaw =
        item.jumlah_total ??
        (Number(item.jumlah_tindakan ?? 0) * Number(item.qty_per_tindakan ?? 0));
      const qtyForRow = Number(qtyForRowRaw) || 0;
      const hargaSatuan = Number(item.harga_satuan ?? 0);
      const totalRupiahForRow =
        item.total_rupiah ?? qtyForRow * hargaSatuan;
      const totalRupiah = Number(totalRupiahForRow) || 0;

      const existing = map.get(key);

      if (existing) {
        existing.total_qty += qtyForRow;
        existing.total_jumlah_tindakan += jumlahTindakan;
        existing.total_rupiah += totalRupiah;
        if (!existing.harga_satuan && hargaSatuan) {
          existing.harga_satuan = hargaSatuan;
        }
      } else {
        map.set(key, {
          kode_barang: item.kode_barang,
          nama_barang: item.nama_barang,
          satuan: item.satuan,
          harga_satuan: hargaSatuan,
          total_qty: qtyForRow,
          total_jumlah_tindakan: jumlahTindakan,
          total_rupiah: totalRupiah,
        });
      }
    });

    return Array.from(map.values()).sort(
      (a, b) => (b.total_rupiah || 0) - (a.total_rupiah || 0)
    );
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Gunakan tahun 2025 yang sama dengan halaman Rupiah untuk konsistensi
      const tahun = 2025;

      // Ambil data rincian untuk detail per barang
      const { data: rincianData, error: rincianError } = await supabase
        .from("rincian_budgeting_bhp_public")
        .select("*")
        .eq("tahun", tahun)
        .order("total_rupiah", { ascending: false });

      if (rincianError) throw rincianError;

      // Ambil data parent untuk mendapatkan total yang konsisten dengan halaman Rupiah
      const { data: parentData, error: parentError } = await supabase
        .from("budgeting_bhp_farmasi_public")
        .select("total_budgeting_rincian, nama_unit_kerja, kode_unit_kerja")
        .eq("tahun", tahun);

      if (parentError) throw parentError;

      const safeData = rincianData || [];
      // Filter hanya record yang total_budgeting_rincian tidak null/undefined
      // Ini memastikan konsistensi dengan halaman Rupiah yang juga hanya menghitung record yang punya total_budgeting_rincian
      const safeParentData = (parentData || [])
        .filter(item => item.total_budgeting_rincian !== null && item.total_budgeting_rincian !== undefined)
        .map(item => ({
          total_budgeting_rincian: Number(item.total_budgeting_rincian) || 0,
          nama_unit_kerja: item.nama_unit_kerja || '',
          kode_unit_kerja: item.kode_unit_kerja || '',
        }));

      setActiveYear(tahun);
      setRawData(safeData);
      setParentData(safeParentData);
      const aggregatedAll = aggregateByBarang(safeData);
      setData(aggregatedAll);
      setFilteredData(aggregatedAll);
      
      const units = Array.from(new Set(safeData.map(item => item.nama_unit_kerja)));
      setUnitKerjaList(units.sort());

      // Set nilai statis untuk total item tersedia (tidak perlu fungsi database)
      setTotalItemTersedia(1294); // Total barang farmasi
      setTotalItemDigunakan(aggregatedAll.length); // Jenis barang yang digunakan
      setTotalItemValid(0); // Tidak digunakan untuk sekarang
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

      toast({
        title: "Memproses...",
        description: "Sedang memperbarui data budgeting BHP. Proses ini mungkin memakan waktu beberapa menit.",
      });

      // Gunakan fungsi complete yang menggabungkan kedua proses untuk memastikan sinkronisasi
      // Fungsi ini tenant-aware dan tidak memerlukan user_id
      const { data: result, error } = await supabase.rpc("refresh_budgeting_bhp_complete", {
        p_tahun: 2025,
      });

      if (error) throw error;

      if (result && !result.success) {
        throw new Error(result.error || "Gagal memperbarui data");
      }

      toast({
        title: "Berhasil",
        description: result?.message || "Data berhasil diperbarui",
      });

      await fetchData();
    } catch (error: any) {
      console.error("Error refreshing data:", error);
      
      let errorMessage = error.message || "Gagal memperbarui data";
      
      if (error.message?.includes("timeout") || error.message?.includes("statement timeout")) {
        errorMessage = "Proses timeout. Data terlalu besar. Silakan coba lagi atau hubungi administrator.";
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    const aggregatedAll = aggregateByBarang(rawData);
    setData(aggregatedAll);

    if (selectedUnit === "all") {
      setFilteredData(aggregatedAll);
    } else {
      const filteredRaw = rawData.filter(
        (item) => item.nama_unit_kerja === selectedUnit
      );
      setFilteredData(aggregateByBarang(filteredRaw));
    }
  }, [rawData, selectedUnit]);

  useEffect(() => {
    fetchData();
  }, []);

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

  const exportToExcel = async () => {
    const exportData = filteredData.map((item, index) => ({
      No: index + 1,
      "Kode Barang": item.kode_barang,
      "Nama Barang": item.nama_barang,
      "Qty/Tindakan": item.total_qty,
      "Jumlah Tindakan": item.total_jumlah_tindakan,
      Satuan: item.satuan,
      "Harga Satuan": item.harga_satuan,
      "Total Rupiah": item.total_rupiah,
    }));

    if (exportData.length === 0) {
      toast({
        title: "Tidak ada data",
        description: "Tidak ada data untuk diunduh.",
        variant: "destructive",
      });
      return;
    }

    await downloadReport({
      title: "Budgeting BHP (Rincian)",
      subtitle: activeYear ? `Tahun ${activeYear}` : undefined,
      filename: `Budgeting_BHP_Rincian_${selectedUnit}_${new Date().toISOString().split("T")[0]}`,
      filters: {
        "Unit Kerja": selectedUnit === "all" ? "Semua" : selectedUnit,
      },
      records: exportData,
    });
  };

  // Calculate statistics
  const topVolume = filteredData.length > 0 
    ? filteredData.reduce((prev, current) => prev.total_qty > current.total_qty ? prev : current)
    : null;

  const topPrice = filteredData.length > 0
    ? filteredData.reduce((prev, current) => prev.total_rupiah > current.total_rupiah ? prev : current)
    : null;

  // Hitung total budgeting menggunakan data dari parent untuk konsistensi dengan halaman Rupiah
  // SELALU gunakan total_budgeting_rincian dari parent (sumber kebenaran)
  const totalBudgeting = useMemo(() => {
    // Jika menggunakan data parent (lebih akurat dan konsisten dengan halaman Rupiah)
    if (parentData.length > 0) {
      const filteredParent = selectedUnit === "all"
        ? parentData
        : parentData.filter(item => item.nama_unit_kerja === selectedUnit);
      
      // Jumlahkan total_budgeting_rincian dari parent (ini adalah sumber kebenaran)
      // Hanya hitung yang total_budgeting_rincian tidak null/undefined
      const totalFromParent = filteredParent.reduce((sum, item) => {
        // Hanya hitung jika total_budgeting_rincian tidak null/undefined
        if (item.total_budgeting_rincian !== null && item.total_budgeting_rincian !== undefined) {
          return sum + (Number(item.total_budgeting_rincian) || 0);
        }
        return sum;
      }, 0);
      
      // Gunakan total dari parent (meskipun 0, karena itu nilai yang benar)
      return totalFromParent;
    }
    
    // Fallback: hitung dari rincian jika data parent tidak tersedia
    return calculateTotalBudgeting(rawData, selectedUnit);
  }, [parentData, rawData, selectedUnit]);

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
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Budgeting BHP (Rincian)</h1>
          <p className="text-gray-600 mt-1">
            Detail rincian penggunaan bahan {activeYear ? `tahun ${activeYear}` : ""} dengan akumulasi jumlah dan biaya
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 justify-end">
          <Select value={selectedUnit} onValueChange={setSelectedUnit}>
            <SelectTrigger className="w-[220px] bg-teal-600 text-white border-teal-600 hover:bg-teal-700 focus:ring-teal-500 focus:ring-offset-0">
              <SelectValue placeholder="Semua Unit Kerja" className="text-white" />
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
          <Button
            onClick={refreshData}
            disabled={refreshing}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {refreshing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
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
        <Card 
          className="border-l-4 border-l-teal-500 cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => setShowItemDialog(true)}
        >
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Total Jenis Barang</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-gray-900">{formatNumber(filteredData.length)}</p>
            <p className="text-xs text-gray-500 mt-1">Jenis barang unik yang digunakan (klik untuk detail)</p>
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
            <CardTitle className="text-sm font-medium text-gray-600">Rasio Varians</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-gray-900">
              {(() => {
                // Rasio = jenis barang digunakan (filteredData.length) / total barang farmasi (1294)
                const totalFarmasi = 1294;
                const jenisBarangDigunakan = filteredData.length;
                const rasioVarians = totalFarmasi > 0 
                  ? ((jenisBarangDigunakan / totalFarmasi) * 100).toFixed(2) 
                  : "0.00";
                return `${rasioVarians}%`;
              })()}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {filteredData.length.toLocaleString('id-ID')} item digunakan / 1.294 total item tersedia
            </p>
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
                <Badge className="bg-blue-600 text-white">{topVolume.kode_barang}</Badge>
                <p className="text-sm text-blue-700">
                  <span className="font-bold text-xl">{formatNumber(topVolume.total_qty)}</span> {topVolume.satuan}
                </p>
              </div>
              <p className="text-xs text-gray-600 mt-1">Total penggunaan lintas tindakan dan unit kerja</p>
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
                <Badge className="bg-purple-600 text-white">{topPrice.kode_barang}</Badge>
                <p className="text-sm text-purple-700">
                  <span className="font-bold text-xl">{formatCurrency(topPrice.total_rupiah)}</span>
                </p>
              </div>
              <p className="text-xs text-gray-600 mt-1">Akumulasi nilai terbesar dari seluruh tindakan</p>
            </CardContent>
          </Card>
        )}
      </div>

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
                <TableRow className="bg-emerald-600 hover:bg-emerald-600">
                  <TableHead className="w-[50px] text-white">No</TableHead>
                  <TableHead className="text-white">Kode Barang</TableHead>
                  <TableHead className="text-white">Nama Barang</TableHead>
                  <TableHead className="text-right text-white">Qty/Tindakan</TableHead>
                  <TableHead className="text-right text-white">Jumlah Tindakan</TableHead>
                  <TableHead className="text-white">Satuan</TableHead>
                  <TableHead className="text-right text-white">Harga Satuan</TableHead>
                  <TableHead className="text-right text-white">Total Rupiah</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                      <Package className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                      <p>Belum ada data rincian bahan</p>
                      <p className="text-xs mt-1">Pastikan sudah input data bahan di halaman kalkulasi</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredData.map((item, index) => (
                    <TableRow key={`${item.kode_barang}-${index}`}>
                      <TableCell className="font-medium">{index + 1}</TableCell>
                      <TableCell className="font-mono text-xs">{item.kode_barang}</TableCell>
                      <TableCell>
                        <p className="text-sm font-medium">{item.nama_barang}</p>
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant="outline">{formatNumber(item.total_qty)}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant="secondary">{formatNumber(item.total_jumlah_tindakan)}</Badge>
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">{item.satuan}</TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(item.harga_satuan || 0)}
                      </TableCell>
                      <TableCell className="text-right font-bold text-purple-600">
                        {formatCurrency(item.total_rupiah || 0)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Dialog Detail Item Barang */}
      <Dialog open={showItemDialog} onOpenChange={setShowItemDialog}>
        <DialogContent className="max-w-5xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-gray-900">
              Detail Jenis Barang Digunakan
            </DialogTitle>
            <DialogDescription>
              Menampilkan {filteredData.length} jenis barang yang digunakan dengan total budgeting dan jumlah penggunaan
            </DialogDescription>
          </DialogHeader>
          
          <div className="mt-4">
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-teal-600 hover:bg-teal-600">
                    <TableHead className="w-[50px] text-white">No</TableHead>
                    <TableHead className="text-white">Kode Barang</TableHead>
                    <TableHead className="text-white">Nama Barang</TableHead>
                    <TableHead className="text-white">Satuan</TableHead>
                    <TableHead className="text-right text-white">Jumlah Digunakan</TableHead>
                    <TableHead className="text-right text-white">Harga Satuan</TableHead>
                    <TableHead className="text-right text-white">Total Budgeting</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredData.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                        <Package className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                        <p>Belum ada data item barang</p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredData.map((item, index) => (
                      <TableRow key={`dialog-${item.kode_barang}-${index}`}>
                        <TableCell className="font-medium">{index + 1}</TableCell>
                        <TableCell className="font-mono text-xs">{item.kode_barang}</TableCell>
                        <TableCell>
                          <p className="text-sm font-medium">{item.nama_barang}</p>
                        </TableCell>
                        <TableCell className="text-sm text-gray-600">{item.satuan}</TableCell>
                        <TableCell className="text-right">
                          <Badge variant="outline" className="font-semibold">
                            {formatNumber(item.total_qty)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(item.harga_satuan || 0)}
                        </TableCell>
                        <TableCell className="text-right font-bold text-purple-600">
                          {formatCurrency(item.total_rupiah || 0)}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
            
            {/* Summary di bagian bawah dialog */}
            <div className="mt-4 p-4 bg-gray-50 rounded-lg border">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-xs text-gray-600">Total Jenis Barang</p>
                  <p className="text-xl font-bold text-teal-600">{formatNumber(filteredData.length)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Total Quantity</p>
                  <p className="text-xl font-bold text-blue-600">
                    {formatNumber(filteredData.reduce((sum, item) => sum + item.total_qty, 0))}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Total Budgeting</p>
                  <p className="text-xl font-bold text-purple-600">{formatCurrency(totalBudgeting)}</p>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BudgetingBHPRincian;

