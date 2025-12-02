import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2, FileDown, TrendingUp, CreditCard, Package, RefreshCw, Users, BedDouble, Stethoscope, FlaskConical } from "lucide-react";
import { PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';
import { useToast } from "@/hooks/use-toast";
import { useReportDownload } from "@/components/report";

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

type CategoryKey = "rawatInap" | "rawatJalan" | "penunjang";

interface CategoryStatCard {
  key: CategoryKey;
  label: string;
  totalBudgeting: number;
  totalPendapatan: number;
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
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<CategoryKey | null>(null);
  const { toast } = useToast();
  const { downloadReport } = useReportDownload();
  const penunjangSources = new Set([
    "kalkulasi_biaya_laboratorium",
    "kalkulasi_biaya_radiologi",
    "kalkulasi_bdrs",
  ]);

  const rawatInapSources = new Set([
    "kalkulasi_tindakan_inap",
    "kalkulasi_biaya_operatif", // IBS
    "kalkulasi_biaya_cathlab",  // Cathlab
  ]);

  const getCategoryKey = (sumber: string): CategoryKey | null => {
    if (rawatInapSources.has(sumber)) return "rawatInap";
    if (sumber === "kalkulasi_tindakan_rawat_jalan") return "rawatJalan";
    if (penunjangSources.has(sumber)) return "penunjang";
    return null;
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const { data: session } = await supabase.auth.getSession();
      const userId = session.session?.user.id;

      if (!userId) {
        throw new Error("User tidak terautentikasi");
      }

      // Ambil data parent dengan semua kolom yang diperlukan
      const { data: budgetingData, error } = await supabase
        .from("budgeting_bhp_farmasi_public")
        .select("*")
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
        // Hanya hitung jika total_budgeting_rincian tidak null/undefined (konsisten dengan total budgeting)
        if (item.total_budgeting_rincian === null || item.total_budgeting_rincian === undefined) {
          return; // Skip record yang tidak punya total_budgeting_rincian
        }
        
        const existing = unitMap.get(item.nama_unit_kerja);
        const budgetingValue = Number(item.total_budgeting_rincian) || 0;
        
        if (existing) {
          existing.budgeting += budgetingValue;
          existing.pendapatan = Math.max(existing.pendapatan, item.pendapatan);
        } else {
          unitMap.set(item.nama_unit_kerja, {
            budgeting: budgetingValue,
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

      toast({
        title: "Memproses...",
        description: "Sedang memperbarui data budgeting BHP. Proses ini mungkin memakan waktu beberapa menit.",
      });

      // Gunakan fungsi optimized yang menggabungkan kedua proses
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
      
      // Berikan pesan error yang lebih informatif
      let errorMessage = error.message || "Gagal memperbarui data";
      
      if (error.message?.includes("timeout") || error.message?.includes("statement timeout")) {
        errorMessage = "Proses timeout. Data terlalu besar. Silakan coba lagi atau hubungi administrator.";
      } else if (error.message?.includes("schema cache")) {
        errorMessage = "Fungsi belum tersedia. Silakan jalankan migrasi database terlebih dahulu.";
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

  const exportToExcel = async (category: "all" | CategoryKey) => {
    const dataset =
      category === "all"
        ? filteredData
        : filteredData.filter((item) => getCategoryKey(item.sumber_tabel) === category);

    const exportData = dataset.map((item, index) => ({
      No: index + 1,
      "Unit Kerja": item.nama_unit_kerja,
      "Kode Tindakan": item.kode_tindakan,
      "Nama Tindakan": item.nama_tindakan,
      "Operator": item.nama_operator || "-",
      "Biaya Bahan": item.biaya_bahan,
      "Jumlah Tindakan": item.jumlah_tindakan,
      "Total Budgeting BHP": item.total_budgeting_bhp,
    }));

    if (exportData.length === 0) {
      toast({
        title: "Tidak ada data",
        description: "Tidak ada data untuk diunduh.",
        variant: "destructive",
      });
      return;
    }

    const label =
      category === "all"
        ? "Semua"
        : category === "rawatInap"
        ? "Rawat_Inap"
        : category === "rawatJalan"
        ? "Rawat_Jalan"
        : "Penunjang";

    await downloadReport({
      title: "Budgeting BHP (Rupiah)",
      subtitle: `Kategori ${label.replace("_", " ")}`,
      filename: `Budgeting_BHP_Rupiah_${label}_${new Date().toISOString().split("T")[0]}`,
      filters: {
        "Unit Kerja": selectedUnit === "all" ? "Semua" : selectedUnit,
        Kategori: label.replace("_", " "),
      },
      records: exportData,
    });
  };

  // Calculate statistics
  const pendapatanByUnit = new Map<string, number>();
  filteredData.forEach(item => {
    if (!pendapatanByUnit.has(item.kode_unit_kerja)) {
      pendapatanByUnit.set(item.kode_unit_kerja, item.pendapatan);
    }
  });

  // Hitung total pendapatan keseluruhan (dari semua unit kerja, tidak duplikat)
  const totalPendapatanKeseluruhan = Array.from(pendapatanByUnit.values())
    .reduce((sum, value) => sum + value, 0);

  const categoryAccumulator: Record<CategoryKey, { budgeting: number }> = {
    rawatInap: { budgeting: 0 },
    rawatJalan: { budgeting: 0 },
    penunjang: { budgeting: 0 },
  };

  filteredData.forEach(item => {
    const category = getCategoryKey(item.sumber_tabel);
    if (!category) return;

    // Hanya hitung jika total_budgeting_rincian tidak null/undefined (konsisten dengan total budgeting)
    if (item.total_budgeting_rincian === null || item.total_budgeting_rincian === undefined) {
      return; // Skip record yang tidak punya total_budgeting_rincian
    }
    
    categoryAccumulator[category].budgeting += (Number(item.total_budgeting_rincian) || 0);
  });

  const categoryStats: CategoryStatCard[] = (Object.entries(categoryAccumulator) as [CategoryKey, { budgeting: number }][]).map(([key, value]) => ({
    key,
    label: key === "rawatInap" ? "Rawat Inap" : key === "rawatJalan" ? "Rawat Jalan" : "Penunjang",
    totalBudgeting: value.budgeting,
    totalPendapatan: totalPendapatanKeseluruhan,
    rasio: totalPendapatanKeseluruhan > 0 ? (value.budgeting / totalPendapatanKeseluruhan) * 100 : 0,
  }));

  const topVolume = filteredData.length > 0 
    ? filteredData.reduce((prev, current) => prev.jumlah_tindakan > current.jumlah_tindakan ? prev : current)
    : null;

  // Cari top budget menggunakan total_budgeting_rincian untuk konsistensi
  const topBudget = filteredData.length > 0
    ? filteredData
        .filter(item => item.total_budgeting_rincian !== null && item.total_budgeting_rincian !== undefined)
        .reduce((prev, current) => {
          const prevValue = Number(prev.total_budgeting_rincian) || 0;
          const currentValue = Number(current.total_budgeting_rincian) || 0;
          return prevValue > currentValue ? prev : current;
        })
    : null;

  // Gunakan total_budgeting_rincian untuk konsistensi dengan halaman Rincian
  // SELALU gunakan total_budgeting_rincian jika tersedia (tidak null/undefined)
  // Ini memastikan konsistensi dengan halaman Rincian yang hanya menghitung dari total_budgeting_rincian
  const totalBudgeting = filteredData.reduce((sum, item) => {
    // Hanya hitung jika total_budgeting_rincian tidak null/undefined
    // Ini sama dengan logika di halaman Rincian yang hanya menghitung dari parent yang punya total_budgeting_rincian
    if (item.total_budgeting_rincian !== null && item.total_budgeting_rincian !== undefined) {
      return sum + (Number(item.total_budgeting_rincian) || 0);
    }
    // Skip record yang total_budgeting_rincian null/undefined
    // Karena halaman Rincian juga tidak menghitung record yang tidak punya total_budgeting_rincian
    return sum;
  }, 0);
  const totalTindakan = filteredData.reduce((sum, item) => sum + item.jumlah_tindakan, 0);
  const totalUnitKerjaAvailable = unitKerjaList.length;
  const pieData = [
    { name: 'Budgeting BHP', value: totalBudgeting },
    { name: 'Pendapatan', value: Math.max(totalPendapatanKeseluruhan - totalBudgeting, 0) },
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
      <div className="flex items-start flex-col gap-2">
        <h1 className="text-3xl font-bold text-gray-900">Budgeting BHP (Rupiah)</h1>
        <p className="text-gray-600">
          Total budgeting BHP berdasarkan biaya bahan dan jumlah tindakan
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-teal-500">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-teal-600" />
              <CardTitle className="text-sm font-medium text-gray-600">Total Items</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-gray-900">1.294</p>
            <p className="text-xs text-gray-500 mt-1">Total barang farmasi tersedia</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-blue-600" />
              <CardTitle className="text-sm font-medium text-gray-600">Total Tindakan</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-gray-900">{formatNumber(totalTindakan)}</p>
            <p className="text-xs text-gray-500 mt-1">Volume periode</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-purple-600" />
              <CardTitle className="text-sm font-medium text-gray-600">Total Budgeting</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalBudgeting)}</p>
            <p className="text-xs text-gray-500 mt-1">BHP keseluruhan</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-orange-500" />
              <CardTitle className="text-sm font-medium text-gray-600">Total Unit Kerja</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-gray-900">{formatNumber(totalUnitKerjaAvailable)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Category Ratio Scorecards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {categoryStats.map((stat) => {
          const IconComponent = stat.key === "rawatInap" ? BedDouble : stat.key === "rawatJalan" ? Stethoscope : FlaskConical;
          const iconColor = stat.key === "rawatInap" ? "text-emerald-600" : stat.key === "rawatJalan" ? "text-sky-600" : "text-purple-600";
          return (
            <Card 
              key={stat.key} 
              className="border-t-4 border-t-teal-600 cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => {
                setSelectedCategory(stat.key);
                setDialogOpen(true);
              }}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <IconComponent className={`h-5 w-5 ${iconColor}`} />
                  <CardTitle className="text-base font-semibold text-gray-700">
                    {stat.label}
                  </CardTitle>
                </div>
                <CardDescription>Rasio BHP vs Pendapatan (Klik untuk detail)</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-teal-700">{stat.rasio.toFixed(2)}%</p>
                <div className="mt-4 space-y-2 text-sm text-gray-600">
                  <div>
                    <p className="uppercase tracking-wide text-xs text-gray-500">Total Budgeting BHP</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {formatCurrency(stat.totalBudgeting)}
                    </p>
                  </div>
                  <div>
                    <p className="uppercase tracking-wide text-xs text-gray-500">Total Pendapatan</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {formatCurrency(stat.totalPendapatan)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
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

        {topBudget && topBudget.total_budgeting_rincian !== null && topBudget.total_budgeting_rincian !== undefined && (Number(topBudget.total_budgeting_rincian) || 0) > 0 && (
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
                  <span className="font-bold text-xl">{formatCurrency(Number(topBudget.total_budgeting_rincian) || 0)}</span>
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
                  <div className="text-xs text-gray-600">Total Pendapatan Keseluruhan</div>
                  <div className="text-xl font-bold text-slate-700">{formatCurrency(totalPendapatanKeseluruhan)}</div>
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

        </CardContent>
      </Card>

      {/* Data Table */}
      <Card>
        <CardHeader className="space-y-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-col md:flex-row md:items-center md:gap-3 gap-2 md:justify-start">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    disabled={filteredData.length === 0}
                    className="bg-red-600 hover:bg-red-700 text-white"
                  >
                    <FileDown className="mr-2 h-4 w-4" />
                    Unduh Laporan
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-48">
                  <DropdownMenuLabel>Pilih Data</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => exportToExcel("all")}>
                    Keseluruhan
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => exportToExcel("rawatJalan")}>
                    Rawat Jalan
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => exportToExcel("rawatInap")}>
                    Rawat Inap
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => exportToExcel("penunjang")}>
                    Penunjang
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button
                onClick={refreshData}
                disabled={refreshing}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {refreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              </Button>
              <Select value={selectedUnit} onValueChange={setSelectedUnit}>
                <SelectTrigger className="md:w-[240px] w-full">
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
          </div>
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-2">
            <div>
              <CardTitle>Data Budgeting BHP</CardTitle>
              <CardDescription>
                Menampilkan {filteredData.length} dari {data.length} total tindakan
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader className="bg-[#0f766e]">
                <TableRow className="bg-[#0f766e] hover:bg-[#0f766e]">
                  <TableHead className="w-[50px] text-white">No</TableHead>
                  <TableHead className="text-white">Unit Kerja</TableHead>
                  <TableHead className="text-white">Kode</TableHead>
                  <TableHead className="text-white">Nama Tindakan</TableHead>
                  <TableHead className="text-white">Operator</TableHead>
                  <TableHead className="text-right text-white">Biaya Bahan</TableHead>
                  <TableHead className="text-right text-white">Jumlah</TableHead>
                  <TableHead className="text-right text-white">Total Budgeting BHP</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-gray-500">
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
                        {formatCurrency(
                          (item.total_budgeting_rincian !== null && item.total_budgeting_rincian !== undefined)
                            ? Number(item.total_budgeting_rincian) || 0
                            : 0
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Dialog Rincian Unit Kerja */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Rincian Unit Kerja - {selectedCategory === "rawatInap" ? "Rawat Inap" : selectedCategory === "rawatJalan" ? "Rawat Jalan" : "Penunjang"}
            </DialogTitle>
            <DialogDescription>
              Daftar unit kerja dan total budgeting BHP per unit
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4">
            {selectedCategory && (() => {
              const categoryData = filteredData.filter(item => getCategoryKey(item.sumber_tabel) === selectedCategory);
              const unitSummary = new Map<string, { kode: string; total: number; count: number }>();
              
              categoryData.forEach(item => {
                // Hanya hitung jika total_budgeting_rincian tidak null/undefined (konsisten dengan total budgeting)
                if (item.total_budgeting_rincian === null || item.total_budgeting_rincian === undefined) {
                  return; // Skip record yang tidak punya total_budgeting_rincian
                }
                
                const existing = unitSummary.get(item.nama_unit_kerja);
                const budgetingValue = Number(item.total_budgeting_rincian) || 0;
                
                if (existing) {
                  existing.total += budgetingValue;
                  existing.count += 1;
                } else {
                  unitSummary.set(item.nama_unit_kerja, {
                    kode: item.kode_unit_kerja,
                    total: budgetingValue,
                    count: 1
                  });
                }
              });

              const sortedUnits = Array.from(unitSummary.entries())
                .sort((a, b) => b[1].total - a[1].total);

              return (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="text-sm text-gray-600">Total Unit Kerja</p>
                      <p className="text-2xl font-bold text-gray-900">{sortedUnits.length}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Total Budgeting BHP</p>
                      <p className="text-2xl font-bold text-teal-700">
                        {formatCurrency(Array.from(unitSummary.values()).reduce((sum, u) => sum + u.total, 0))}
                      </p>
                    </div>
                  </div>

                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[50px]">No</TableHead>
                        <TableHead>Kode</TableHead>
                        <TableHead>Nama Unit Kerja</TableHead>
                        <TableHead className="text-right">Jumlah Tindakan</TableHead>
                        <TableHead className="text-right">Total BHP</TableHead>
                        <TableHead className="text-right">% dari Kategori</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sortedUnits.map(([nama, data], index) => {
                        const totalKategori = Array.from(unitSummary.values()).reduce((sum, u) => sum + u.total, 0);
                        const persentase = (data.total / totalKategori) * 100;
                        return (
                          <TableRow key={nama}>
                            <TableCell className="font-medium">{index + 1}</TableCell>
                            <TableCell className="font-mono text-xs">{data.kode}</TableCell>
                            <TableCell className="font-medium">{nama}</TableCell>
                            <TableCell className="text-right">
                              <Badge variant="outline">{data.count}</Badge>
                            </TableCell>
                            <TableCell className="text-right font-semibold text-teal-600">
                              {formatCurrency(data.total)}
                            </TableCell>
                            <TableCell className="text-right">
                              <Badge className="bg-teal-100 text-teal-800">
                                {persentase.toFixed(2)}%
                              </Badge>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              );
            })()}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BudgetingBHPRupiah;

