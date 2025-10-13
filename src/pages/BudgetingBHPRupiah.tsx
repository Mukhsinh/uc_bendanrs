import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, FileDown, TrendingUp, CreditCard, Package, RefreshCw } from "lucide-react";
import { PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';
import { useToast } from "@/hooks/use-toast";
import * as XLSX from "xlsx";

interface BudgetingData {
  id: string;
  kode_unit_kerja: string;
  nama_unit_kerja: string;
  kode_tindakan: string;
  nama_tindakan: string;
  kode_operator: string | null;
  nama_operator: string | null;
  biaya_bahan: number;
  unit_cost_per_tindakan: number;
  jumlah_tindakan: number;
  total_budgeting_bhp: number;
  total_budgeting_rincian: number;
  pendapatan: number;
  rasio_bhp_pendapatan: number;
  sumber_tabel: string;
}

interface RasioPerUnit {
  nama_unit_kerja: string;
  kode_unit_kerja: string;
  total_budgeting: number;
  pendapatan: number;
  rasio: number;
}

const BudgetingBHPRupiah = () => {
  const [data, setData] = useState<BudgetingData[]>([]);
  const [filteredData, setFilteredData] = useState<BudgetingData[]>([]);
  const [rasioPerUnit, setRasioPerUnit] = useState<RasioPerUnit[]>([]);
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

      const { data: budgetingData, error } = await supabase
        .from("budgeting_bhp_farmasi")
        .select("*")
        .eq("user_id", session.session.user.id)
        .eq("tahun", 2025)
        .order("total_budgeting_bhp", { ascending: false });

      if (error) throw error;

      setData(budgetingData || []);
      setFilteredData(budgetingData || []);
      
      // Extract unique unit kerja
      const units = Array.from(new Set((budgetingData || []).map(item => item.nama_unit_kerja)));
      setUnitKerjaList(units.sort());

      // Calculate rasio per unit kerja
      const rasioData: RasioPerUnit[] = [];
      const unitMap = new Map<string, { budgeting: number; pendapatan: number; kode: string }>();
      
      (budgetingData || []).forEach(item => {
        const existing = unitMap.get(item.nama_unit_kerja);
        if (existing) {
          existing.budgeting += item.total_budgeting_bhp;
          existing.pendapatan = Math.max(existing.pendapatan, item.pendapatan);
        } else {
          unitMap.set(item.nama_unit_kerja, {
            budgeting: item.total_budgeting_bhp,
            pendapatan: item.pendapatan,
            kode: item.kode_unit_kerja,
          });
        }
      });

      unitMap.forEach((value, key) => {
        const rasio = value.pendapatan > 0 ? (value.budgeting / value.pendapatan) * 100 : 0;
        rasioData.push({
          nama_unit_kerja: key,
          kode_unit_kerja: value.kode,
          total_budgeting: value.budgeting,
          pendapatan: value.pendapatan,
          rasio: rasio,
        });
      });

      setRasioPerUnit(rasioData.sort((a, b) => b.rasio - a.rasio));
    } catch (error: any) {
      console.error("Error fetching data:", error);
      toast({
        title: "Error",
        description: error.message || "Gagal mengambil data budgeting",
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

      const { error } = await supabase.rpc("populate_budgeting_bhp_farmasi", {
        p_user_id: session.session.user.id,
        p_tahun: 2025,
      });

      if (error) throw error;

      toast({
        title: "Berhasil",
        description: "Data berhasil diperbarui",
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
    return new Intl.NumberFormat("id-ID").format(value);
  };

  const exportToExcel = () => {
      const exportData = filteredData.map((item, index) => ({
      No: index + 1,
      "Unit Kerja": item.nama_unit_kerja,
      "Kode Tindakan": item.kode_tindakan,
      "Nama Tindakan": item.nama_tindakan,
      "Operator": item.nama_operator || "-",
      "Biaya Bahan": item.biaya_bahan,
      "Jumlah Tindakan": item.jumlah_tindakan,
      "Total Budgeting BHP": item.total_budgeting_bhp,
        "Total Pendapatan": item.pendapatan,
      "Rasio BHP Pendapatan (%)": item.rasio_bhp_pendapatan,
      "Sumber": item.sumber_tabel,
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Budgeting BHP");
    
    const fileName = `Budgeting_BHP_Rupiah_${selectedUnit}_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);

    toast({
      title: "Berhasil",
      description: `File ${fileName} berhasil diunduh`,
    });
  };

  // Calculate statistics
  const topVolume = filteredData.length > 0 
    ? filteredData.reduce((prev, current) => prev.jumlah_tindakan > current.jumlah_tindakan ? prev : current)
    : null;

  const topBudget = filteredData.length > 0
    ? filteredData.reduce((prev, current) => prev.total_budgeting_bhp > current.total_budgeting_bhp ? prev : current)
    : null;

  const totalBudgeting = filteredData.reduce((sum, item) => sum + item.total_budgeting_bhp, 0);
  const totalTindakan = filteredData.reduce((sum, item) => sum + item.jumlah_tindakan, 0);
  const totalPendapatan = filteredData.reduce((sum, item) => sum + item.pendapatan, 0);
  const pieData = [
    { name: 'Budgeting BHP', value: totalBudgeting },
    { name: 'Pendapatan', value: Math.max(totalPendapatan - totalBudgeting, 0) },
  ];
  const pieColors = ['#0f766e', '#cbd5e1'];

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
          <h1 className="text-3xl font-bold text-gray-900">Budgeting BHP (Rupiah)</h1>
          <p className="text-gray-600 mt-1">
            Total budgeting BHP berdasarkan biaya bahan dan jumlah tindakan
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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-teal-500">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Total Items</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-gray-900">{formatNumber(filteredData.length)}</p>
            <p className="text-xs text-gray-500 mt-1">Jenis tindakan</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Total Tindakan</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-gray-900">{formatNumber(totalTindakan)}</p>
            <p className="text-xs text-gray-500 mt-1">Volume periode</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Total Budgeting</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalBudgeting)}</p>
            <p className="text-xs text-gray-500 mt-1">BHP keseluruhan</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Avg per Tindakan</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-gray-900">
              {totalTindakan > 0 ? formatCurrency(totalBudgeting / totalTindakan) : "Rp 0"}
            </p>
            <p className="text-xs text-gray-500 mt-1">Rata-rata biaya</p>
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
                Volume Terbanyak
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-semibold text-lg text-blue-900">{topVolume.nama_tindakan}</p>
              <div className="flex items-center justify-between mt-2">
                <Badge className="bg-blue-600 text-white">{topVolume.nama_unit_kerja}</Badge>
                <p className="text-sm text-blue-700">
                  <span className="font-bold text-xl">{formatNumber(topVolume.jumlah_tindakan)}</span> tindakan
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {topBudget && topBudget.total_budgeting_bhp > 0 && (
          <Card className="bg-gradient-to-r from-purple-50 to-purple-100 border-purple-300">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-purple-800">
                <CreditCard className="h-5 w-5" />
                Budgeting Tertinggi
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-semibold text-lg text-purple-900">{topBudget.nama_tindakan}</p>
              <div className="flex items-center justify-between mt-2">
                <Badge className="bg-purple-600 text-white">{topBudget.nama_unit_kerja}</Badge>
                <p className="text-sm text-purple-700">
                  <span className="font-bold text-xl">{formatCurrency(topBudget.total_budgeting_bhp)}</span>
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Rasio BHP Pendapatan per Unit Kerja */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-teal-600" />
            Rasio BHP terhadap Pendapatan per Unit Kerja
          </CardTitle>
          <CardDescription>
            Persentase budgeting BHP dibandingkan dengan total pendapatan unit kerja
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Pie Chart Total Rasio */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-center mb-6">
            <div className="col-span-1 lg:col-span-1 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={60} outerRadius={90} paddingAngle={2}>
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip formatter={(v: any) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(v as number)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="col-span-1 lg:col-span-2">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded border">
                  <div className="text-xs text-gray-600">Total Budgeting BHP</div>
                  <div className="text-xl font-bold text-teal-700">{formatCurrency(totalBudgeting)}</div>
                </div>
                <div className="p-4 rounded border">
                  <div className="text-xs text-gray-600">Total Pendapatan</div>
                  <div className="text-xl font-bold text-slate-700">{formatCurrency(totalPendapatan)}</div>
                </div>
              </div>
            </div>
          </div>
          {/* Per-unit chart hanya saat unit dipilih */}
          {selectedUnit !== 'all' && (
            <Card className="mt-4">
              <CardHeader>
                <CardTitle>Perbandingan BHP vs Total Pendapatan - {selectedUnit}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={[{
                      name: selectedUnit,
                      BHP: rasioPerUnit.find(u => u.nama_unit_kerja === selectedUnit)?.total_budgeting || 0,
                      Pendapatan: rasioPerUnit.find(u => u.nama_unit_kerja === selectedUnit)?.pendapatan || 0,
                    }]}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis tickFormatter={(v)=> new Intl.NumberFormat('id-ID').format(v)} />
                      <Legend />
                      <RechartsTooltip formatter={(v: any)=> new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0}).format(v as number)} />
                      <Bar dataKey="BHP" fill="#0f766e" />
                      <Bar dataKey="Pendapatan" fill="#64748b" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Total Keseluruhan */}
          {rasioPerUnit.length > 0 && (
            <Card className="mt-4 bg-gradient-to-r from-teal-50 to-teal-100 border-teal-300">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-teal-900">Total Keseluruhan Unit Kerja</p>
                    <p className="text-xs text-teal-700 mt-1">{rasioPerUnit.length} unit kerja</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-teal-700">Total Budgeting BHP</p>
                    <p className="text-xl font-bold text-teal-900">
                      {formatCurrency(rasioPerUnit.reduce((sum, u) => sum + u.total_budgeting, 0))}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-teal-700">Total Pendapatan</p>
                    <p className="text-xl font-bold text-teal-900">
                      {formatCurrency(rasioPerUnit.reduce((sum, u) => sum + u.pendapatan, 0))}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-teal-700">Rasio Total</p>
                    <Badge className="bg-teal-700 text-white text-lg font-bold px-4 py-2 min-w-[100px] justify-center">
                      {(
                        rasioPerUnit.reduce((sum, u) => sum + u.pendapatan, 0) > 0
                          ? (rasioPerUnit.reduce((sum, u) => sum + u.total_budgeting, 0) / 
                             rasioPerUnit.reduce((sum, u) => sum + u.pendapatan, 0) * 100)
                          : 0
                      ).toFixed(2)}%
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>

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
          <CardTitle>Data Budgeting BHP</CardTitle>
          <CardDescription>
            Menampilkan {filteredData.length} dari {data.length} total tindakan
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">No</TableHead>
                  <TableHead>Unit Kerja</TableHead>
                  <TableHead>Kode</TableHead>
                  <TableHead>Nama Tindakan</TableHead>
                  <TableHead>Operator</TableHead>
                  <TableHead className="text-right">Biaya Bahan</TableHead>
                  <TableHead className="text-right">Jumlah</TableHead>
                  <TableHead className="text-right">Total Budgeting BHP</TableHead>
                  <TableHead className="text-right">Total Pendapatan</TableHead>
                  <TableHead className="text-right">Rasio %</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-8 text-gray-500">
                      <Package className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                      <p>Belum ada data budgeting BHP</p>
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
                      <TableCell className="font-mono text-xs">{item.kode_tindakan}</TableCell>
                      <TableCell>
                        <div className="max-w-xs">
                          <p className="text-sm">{item.nama_tindakan}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {item.nama_operator || "-"}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(item.biaya_bahan)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant="outline" className="font-mono">
                          {formatNumber(item.jumlah_tindakan)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-bold text-teal-600">
                        {formatCurrency(item.total_budgeting_bhp)}
                      </TableCell>
                      <TableCell className="text-right font-medium text-gray-700">
                        {formatCurrency(item.pendapatan)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge 
                          className={`font-bold px-2 py-1 min-w-[70px] justify-center ${
                            item.rasio_bhp_pendapatan > 10 
                              ? "bg-red-600 text-white" 
                              : item.rasio_bhp_pendapatan > 5 
                              ? "bg-orange-600 text-white"
                              : item.rasio_bhp_pendapatan > 0
                              ? "bg-green-600 text-white"
                              : "bg-gray-400 text-white"
                          }`}
                        >
                          {item.rasio_bhp_pendapatan.toFixed(2)}%
                        </Badge>
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

export default BudgetingBHPRupiah;

