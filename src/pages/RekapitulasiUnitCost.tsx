import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { FileDown, RefreshCw, TrendingUp, Package, Users, Clock3, Trophy, ListOrdered } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useReportDownload } from "@/components/report";
import { useToast } from "@/hooks/use-toast";

interface RekapitulasiData {
  id: string;
  tahun: number;
  kode_jenis: number;
  kode_unit_kerja: string;
  nama_unit_kerja: string;
  kode_operator: string | null;
  nama_operator: string | null;
  kode_tindakan: string;
  nama_tindakan: string;
  biaya_bahan: number | null;
  unit_cost_per_tindakan: number | null;
  sumber_tabel: string;
  jumlah?: number | null;
  waktu_pemeriksaan?: number | null;
  created_at: string;
  updated_at?: string | null;
}

interface FilterState {
  unit_kerja: string;
  operator: string;
  nama_tindakan: string;
  tahun: number;
}

const RekapitulasiUnitCost: React.FC = () => {
  const [data, setData] = useState<RekapitulasiData[]>([]);
  const [filteredData, setFilteredData] = useState<RekapitulasiData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(true);
  
  const [unitKerjaList, setUnitKerjaList] = useState<string[]>([]);
  const [operatorList, setOperatorList] = useState<string[]>([]);
  
  const currentYear = new Date().getFullYear();
  const [filters, setFilters] = useState<FilterState>({
    unit_kerja: "",
    operator: "",
    nama_tindakan: "",
    tahun: currentYear,
  });
  const { downloadReport } = useReportDownload();
  const { toast } = useToast();
  const [downloadingReport, setDownloadingReport] = useState(false);
  const [refreshingData, setRefreshingData] = useState(false);

  // Statistics
  const [stats, setStats] = useState({
    totalRecords: 0,
    totalUnitCost: 0,
    totalBiayaBahan: 0,
    avgUnitCost: 0,
    totalUnitKerja: 0,
    totalOperator: 0,
  });

  const deduplicateRecords = React.useCallback((records: RekapitulasiData[]): RekapitulasiData[] => {
    const recordMap = new Map<string, RekapitulasiData>();

    const getTimestamp = (record: RekapitulasiData) => {
      const raw = record.updated_at ?? record.created_at ?? null;
      const parsed = raw ? new Date(raw).getTime() : NaN;
      return Number.isFinite(parsed) ? parsed : 0;
    };

    for (const item of records) {
      const key = [
        item.tahun,
        item.kode_unit_kerja,
        item.kode_tindakan,
        item.kode_operator ?? "-",
        item.sumber_tabel,
      ].join("|");

      const existing = recordMap.get(key);
      if (!existing) {
        recordMap.set(key, item);
        continue;
      }

      if (getTimestamp(item) >= getTimestamp(existing)) {
        recordMap.set(key, item);
      }
    }

    return Array.from(recordMap.values()).sort((a, b) => {
      const unitCompare = a.kode_unit_kerja.localeCompare(b.kode_unit_kerja);
      if (unitCompare !== 0) return unitCompare;

      const tindakanCompare = a.kode_tindakan.localeCompare(b.kode_tindakan);
      if (tindakanCompare !== 0) return tindakanCompare;

      return (a.kode_operator ?? "").localeCompare(b.kode_operator ?? "");
    });
  }, []);

  const fetchData = React.useCallback(async (targetYear?: number) => {
    const tahunTarget = Number.isFinite(targetYear) ? Number(targetYear) : currentYear;

    try {
      setLoading(true);
      setError(null);
      const { data: rekapData, error: rekapError } = await supabase
        .from("view_rekapitulasi_unit_cost")
        .select(
          "id, tahun, kode_jenis, kode_unit_kerja, nama_unit_kerja, kode_operator, nama_operator, kode_tindakan, nama_tindakan, biaya_bahan, unit_cost_per_tindakan, sumber_tabel, jumlah, waktu_pemeriksaan, created_at, updated_at"
        )
        .eq("tahun", tahunTarget)
        .order("kode_unit_kerja", { ascending: true })
        .order("kode_tindakan", { ascending: true });

      if (rekapError) throw rekapError;

      const normalized = (rekapData || []).map((item) => ({
        ...item,
        biaya_bahan: item.biaya_bahan === null || item.biaya_bahan === undefined ? null : Number(item.biaya_bahan),
        unit_cost_per_tindakan:
          item.unit_cost_per_tindakan === null || item.unit_cost_per_tindakan === undefined
            ? null
            : Number(item.unit_cost_per_tindakan),
        jumlah: item.jumlah === null || item.jumlah === undefined ? null : Number(item.jumlah),
        waktu_pemeriksaan:
          item.waktu_pemeriksaan === null || item.waktu_pemeriksaan === undefined
            ? null
            : Number(item.waktu_pemeriksaan),
      }));

      const deduplicated = deduplicateRecords(normalized);

      setData(deduplicated);

      const uniqueUnitKerja = [...new Set(deduplicated.map((d) => d.nama_unit_kerja))];
      const uniqueOperators = [
        ...new Set(
          deduplicated
            .filter((d) => d.kode_operator !== null)
            .map((d) => `${d.kode_operator} - ${d.nama_operator}`)
        ),
      ];

      setUnitKerjaList(uniqueUnitKerja.sort());
      setOperatorList(uniqueOperators.sort());

      calculateStats(deduplicated);
    } catch (err: any) {
      console.error("Error fetching data:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [currentYear, deduplicateRecords]);

  useEffect(() => {
    if (!Number.isFinite(filters.tahun)) return;
    fetchData(filters.tahun);
  }, [fetchData, filters.tahun]);

  useEffect(() => {
    if (!Number.isFinite(filters.tahun)) return;

    const targetYear = filters.tahun;
    const tables = [
      "kalkulasi_biaya_laboratorium",
      "kalkulasi_biaya_radiologi",
      "kalkulasi_bdrs",
      "kalkulasi_tindakan_inap",
      "kalkulasi_tindakan_rawat_jalan",
      "kalkulasi_biaya_operatif",
      "kalkulasi_biaya_cathlab",
    ] as const;

    const channel = supabase.channel("rekapitulasi_unit_cost_changes");

    tables.forEach((tableName) => {
      channel.on(
        "postgres_changes",
        { event: "*", schema: "public", table: tableName, filter: `tahun=eq.${targetYear}` },
        () => {
          fetchData(targetYear);
        }
      );
    });

    channel.subscribe((status, err) => {
      if (status === "CHANNEL_ERROR") {
        console.error("Gagal berlangganan perubahan rekapitulasi:", err);
      }
    });

    return () => {
      try {
        supabase.removeChannel(channel);
      } catch (err) {
        console.warn("Gagal melepas channel rekapitulasi:", err);
      }
    };
  }, [fetchData, filters.tahun]);

  useEffect(() => {
    applyFilters();
  }, [data, filters]);

  const calculateStats = (dataSet: RekapitulasiData[]) => {
    const totalRecords = dataSet.length;
    const totalUnitCost = dataSet.reduce((sum, d) => sum + (d.unit_cost_per_tindakan ?? 0), 0);
    const totalBiayaBahan = dataSet.reduce((sum, d) => sum + (d.biaya_bahan ?? 0), 0);
    const avgUnitCost = totalRecords > 0 ? totalUnitCost / totalRecords : 0;
    const totalUnitKerja = new Set(dataSet.map((d) => d.kode_unit_kerja)).size;
    const totalOperator = new Set(dataSet.filter((d) => d.kode_operator).map((d) => d.kode_operator)).size;

    setStats({
      totalRecords,
      totalUnitCost,
      totalBiayaBahan,
      avgUnitCost,
      totalUnitKerja,
      totalOperator,
    });
  };

  const applyFilters = () => {
    let filtered = [...data];

    // Filter by unit kerja
    if (filters.unit_kerja) {
      filtered = filtered.filter((d) => d.nama_unit_kerja === filters.unit_kerja);
    }

    // Filter by operator
    if (filters.operator) {
      const [kodeOp] = filters.operator.split(" - ");
      filtered = filtered.filter((d) => d.kode_operator === kodeOp);
    }

    // Filter by nama tindakan (search)
    if (filters.nama_tindakan) {
      filtered = filtered.filter((d) =>
        d.nama_tindakan.toLowerCase().includes(filters.nama_tindakan.toLowerCase()) ||
        d.kode_tindakan.toLowerCase().includes(filters.nama_tindakan.toLowerCase())
      );
    }

    // Filter by tahun
    if (filters.tahun) {
      filtered = filtered.filter((d) => d.tahun === filters.tahun);
    }

    setFilteredData(filtered);
    calculateStats(filtered);
  };

  const handleFilterChange = (key: keyof FilterState, value: string | number) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleRefreshData = async () => {
    if (!Number.isFinite(filters.tahun)) {
      toast({
        title: "Error",
        description: "Tahun tidak valid",
        variant: "destructive",
      });
      return;
    }

    try {
      setRefreshingData(true);
      
      toast({
        title: "Memperbarui data...",
        description: "Sedang menyinkronkan data dari tabel sumber",
      });

      // Panggil fungsi refresh_rekapitulasi_unit_cost
      const { error: refreshError } = await supabase.rpc('refresh_rekapitulasi_unit_cost', {
        p_user_id: null, // null untuk refresh semua data
        p_tahun: filters.tahun
      });

      if (refreshError) {
        throw refreshError;
      }

      // Reload data setelah refresh
      await fetchData(filters.tahun);

      toast({
        title: "Berhasil",
        description: `Data tahun ${filters.tahun} berhasil diperbarui dari tabel sumber`,
      });
    } catch (error: any) {
      console.error("Gagal memperbarui data rekapitulasi:", error);
      toast({
        title: "Gagal memperbarui data",
        description: error?.message || String(error),
        variant: "destructive",
      });
    } finally {
      setRefreshingData(false);
    }
  };

  const handleDownloadReport = async () => {
    if (filteredData.length === 0) {
      toast({
        title: "Tidak ada data",
        description: "Belum ada data untuk diunduh.",
        variant: "destructive",
      });
      return;
    }

    try {
      setDownloadingReport(true);

      const subtitleParts: string[] = [];
      if (filters.tahun) subtitleParts.push(`Tahun ${filters.tahun}`);
      if (filters.unit_kerja) subtitleParts.push(`Unit ${filters.unit_kerja}`);
      if (filters.operator) subtitleParts.push(`Operator ${filters.operator}`);

      const records = filteredData.map((item, index) => ({
        "No": index + 1,
        "Tahun": item.tahun,
        "Jenis": getJenisLabel(item.kode_jenis),
        "Kode Unit Kerja": item.kode_unit_kerja,
        "Nama Unit Kerja": item.nama_unit_kerja,
        "Kode Operator": item.kode_operator || "-",
        "Nama Operator": item.nama_operator || "-",
        "Kode Tindakan": item.kode_tindakan,
        "Nama Tindakan": item.nama_tindakan,
        "Jumlah": item.jumlah ?? 0,
        "Waktu (menit)": item.waktu_pemeriksaan ?? 0,
        "Biaya Bahan": Math.round(item.biaya_bahan ?? 0),
        "Unit Cost per Tindakan": Math.round(item.unit_cost_per_tindakan ?? 0),
        "Sumber": getSumberLabel(item.sumber_tabel),
      }));

      const result = await downloadReport({
        title: "Rekapitulasi Unit Cost",
        subtitle: subtitleParts.join(" • ") || undefined,
        filename: `rekapitulasi_unit_cost_${filters.tahun || "semua"}`,
        records,
        orientation: "landscape",
      });

      // Cek apakah dibatalkan
      if (result?.cancelled) {
        return;
      }

      toast({
        title: "Berhasil",
        description: `Laporan berhasil disiapkan dengan ${records.length} baris data`,
      });
    } catch (error: any) {
      console.error("Gagal mengunduh rekapitulasi unit cost:", error);
      toast({
        title: "Gagal mengunduh",
        description: error?.message || String(error),
        variant: "destructive",
      });
    } finally {
      setDownloadingReport(false);
    }
  };

  const formatCurrency = (value?: number | null) => {
    const safeValue = typeof value === "number" ? value : 0;
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(safeValue);
  };

  const getJenisLabel = (kode: number) => {
    switch (kode) {
      case 1: return "Rawat Jalan";
      case 2: return "Rawat Inap";
      case 3: return "Operatif";
      case 4: return "Non Layanan";
      default: return "Tidak Diketahui";
    }
  };

  const getSumberLabel = (sumber: string) => {
    switch (sumber) {
      case "kalkulasi_biaya_laboratorium": return "Laboratorium";
      case "kalkulasi_biaya_radiologi": return "Radiologi";
      case "kalkulasi_bdrs": return "BDRS";
      case "kalkulasi_tindakan_inap": return "Tindakan Rawat Inap";
      case "kalkulasi_tindakan_rawat_jalan": return "Tindakan Rawat Jalan";
      case "kalkulasi_tindakan_operatif": return "Tindakan Operatif";
      case "kalkulasi_biaya_cathlab": return "Cathlab";
      default: return sumber;
    }
  };

  // Derived rankings based on filtered data
  const topBhp = React.useMemo(() => {
    const byTindakan = new Map<string, { kode: string; nama: string; unit: string; bhp: number }>();
    for (const d of filteredData) {
      const key = d.kode_tindakan;
      const existing = byTindakan.get(key);
      const bhp = d.biaya_bahan || 0;
      if (!existing || bhp > existing.bhp) {
        byTindakan.set(key, { kode: d.kode_tindakan, nama: d.nama_tindakan, unit: d.nama_unit_kerja, bhp });
      }
    }
    return Array.from(byTindakan.values())
      .sort((a, b) => b.bhp - a.bhp)
      .slice(0, 5);
  }, [filteredData]);

  const topCount = React.useMemo(() => {
    const counter = new Map<string, { kode: string; nama: string; total: number }>();
    for (const d of filteredData) {
      if (d.jumlah == null) continue;
      const key = d.kode_tindakan;
      const curr = counter.get(key) || { kode: d.kode_tindakan, nama: d.nama_tindakan, total: 0 };
      curr.total += d.jumlah;
      counter.set(key, curr);
    }
    return Array.from(counter.values())
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);
  }, [filteredData]);

  const topDurasi = React.useMemo(() => {
    const byTindakan = new Map<string, { kode: string; nama: string; durasi: number }>();
    for (const d of filteredData) {
      const key = d.kode_tindakan;
      const existing = byTindakan.get(key);
      const durasi = d.waktu_pemeriksaan || 0;
      if (!existing || durasi > existing.durasi) {
        byTindakan.set(key, { kode: d.kode_tindakan, nama: d.nama_tindakan, durasi });
      }
    }
    return Array.from(byTindakan.values())
      .sort((a, b) => b.durasi - a.durasi)
      .slice(0, 5);
  }, [filteredData]);


  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Memuat data rekapitulasi...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
          <p className="text-red-800 font-medium mb-2">Error:</p>
          <p className="text-red-600">{error}</p>
          <button
            onClick={() => fetchData(filters.tahun)}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Coba Lagi
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          Rekapitulasi Unit Cost
        </h1>
        <p className="text-gray-600">
          Konsolidasi unit cost dari 7 tabel kalkulasi biaya
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="mb-8 flex flex-wrap gap-4">
        <div className="w-full rounded-xl border border-sky-100 bg-sky-50 p-4 shadow-sm md:w-[240px] lg:w-[220px]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-sky-600">Total Tindakan</p>
              <p className="mt-2 text-2xl font-bold text-sky-900">
                {stats.totalRecords.toLocaleString()}
              </p>
              <p className="text-xs text-sky-500">Jumlah tindakan/pemeriksaan</p>
            </div>
            <Package className="h-10 w-10 text-sky-500" />
          </div>
        </div>

        <div className="w-full rounded-xl border border-emerald-100 bg-emerald-50 p-4 shadow-sm md:w-[240px] lg:w-[220px]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-emerald-600">Total Unit Kerja</p>
              <p className="mt-2 text-2xl font-bold text-emerald-900">{stats.totalUnitKerja}</p>
              <p className="text-xs text-emerald-500">Unit kerja yang terdaftar</p>
            </div>
            <Package className="h-10 w-10 text-emerald-500" />
          </div>
        </div>

        <div className="w-full rounded-xl border border-violet-100 bg-violet-50 p-4 shadow-sm md:w-[240px] lg:w-[220px]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-violet-600">Total Operator</p>
              <p className="mt-2 text-2xl font-bold text-violet-900">{stats.totalOperator}</p>
              <p className="text-xs text-violet-500">Operator spesialistik</p>
            </div>
            <Users className="h-10 w-10 text-violet-500" />
          </div>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="mb-6 rounded-lg border border-slate-100 bg-white p-6 shadow-sm">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Unit Kerja</label>
              <select
                value={filters.unit_kerja}
                onChange={(e) => handleFilterChange("unit_kerja", e.target.value)}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
              >
                <option value="">Semua Unit Kerja</option>
                {unitKerjaList.map((uk) => (
                  <option key={uk} value={uk}>
                    {uk}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Operator</label>
              <select
                value={filters.operator}
                onChange={(e) => handleFilterChange("operator", e.target.value)}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
              >
                <option value="">Semua Operator</option>
                {operatorList.map((op) => (
                  <option key={op} value={op}>
                    {op}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Cari Tindakan</label>
              <input
                type="text"
                value={filters.nama_tindakan}
                onChange={(e) => handleFilterChange("nama_tindakan", e.target.value)}
                placeholder="Nama atau kode tindakan..."
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Tahun</label>
              <input
                type="number"
                value={filters.tahun}
                onChange={(e) => handleFilterChange("tahun", parseInt(e.target.value))}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
        <p className="text-sm text-gray-600">
          Menampilkan <span className="font-semibold">{filteredData.length}</span> dari{" "}
          <span className="font-semibold">{data.length}</span> data
        </p>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFilters((prev) => !prev)}
            className="min-w-[110px] rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 transition"
          >
            {showFilters ? "Sembunyikan Filter" : "Tampilkan Filter"}
          </button>
          <button
            onClick={() => {
              void handleRefreshData();
            }}
            disabled={refreshingData}
            className="flex items-center gap-2 rounded-md bg-blue-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-600 disabled:cursor-not-allowed disabled:bg-slate-300"
            title="Perbarui data dari tabel sumber"
          >
            <RefreshCw className={`h-4 w-4 ${refreshingData ? "animate-spin" : ""}`} />
            {refreshingData ? "Memperbarui..." : "Perbarui Data"}
          </button>
          <button
            onClick={() => {
              void handleDownloadReport();
            }}
            disabled={filteredData.length === 0 || downloadingReport}
            className="flex items-center gap-2 rounded-md bg-red-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-600 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {downloadingReport ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <FileDown className="h-4 w-4" />
            )}
            {downloadingReport ? "Menyiapkan..." : "Unduh Laporan"}
          </button>
          <button
            onClick={() => fetchData(filters.tahun)}
            aria-label="Muat ulang tampilan"
            title="Muat ulang tampilan data"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-100"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Top Rank Charts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 mb-6">
        <Card className="border border-rose-100 bg-rose-50 shadow-sm">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-rose-500" />
                <h3 className="text-sm font-semibold text-rose-700">Top 5 BHP Tertinggi</h3>
              </div>
              <Package className="w-5 h-5 text-rose-400" />
            </div>
            {topBhp.length > 0 ? (
              <ul className="space-y-2">
                {topBhp.map((item, index) => (
                  <li
                    key={item.kode}
                    className="rounded-lg border border-rose-100 bg-white/80 px-3 py-2"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-sm font-semibold text-rose-700">
                        {index + 1}. {item.nama}
                      </p>
                      <span className="text-sm font-semibold text-rose-600">
                        {formatCurrency(item.bhp)}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground text-center">Tidak ada data.</p>
            )}
          </CardContent>
        </Card>

        <Card className="border border-sky-100 bg-sky-50 shadow-sm">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock3 className="w-5 h-5 text-sky-500" />
                <h3 className="text-sm font-semibold text-sky-700">Top 5 Durasi Terlama</h3>
              </div>
              <TrendingUp className="w-5 h-5 text-sky-500" />
            </div>
            {topDurasi.length > 0 ? (
              <ul className="space-y-2">
                {topDurasi.map((item, index) => (
                  <li
                    key={item.kode}
                    className="rounded-lg border border-sky-100 bg-white/80 px-3 py-2"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-sm font-semibold text-sky-700">
                        {index + 1}. {item.nama}
                      </p>
                      <span className="text-sm font-semibold text-sky-600">
                        {item.durasi?.toLocaleString("id-ID")} menit
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground text-center">Durasi belum tersedia pada rekap.</p>
            )}
          </CardContent>
        </Card>

        <Card className="border border-lime-100 bg-lime-50 shadow-sm">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ListOrdered className="w-5 h-5 text-lime-600" />
                <h3 className="text-sm font-semibold text-lime-700">Top 5 Tindakan Terbanyak</h3>
              </div>
              <Package className="w-5 h-5 text-lime-500" />
            </div>
            {topCount.length > 0 ? (
              <ul className="space-y-2">
                {topCount.map((item, index) => (
                  <li
                    key={item.kode}
                    className="rounded-lg border border-lime-100 bg-white/80 px-3 py-2"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-sm font-semibold text-lime-700">
                        {index + 1}. {item.nama}
                      </p>
                      <span className="text-sm font-semibold text-lime-600">
                        {item.total.toLocaleString("id-ID")}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground text-center">Tidak ada data.</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-[#0f766e]">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-white">
                  No
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-white">
                  Jenis
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-white">
                  Unit Kerja
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-white">
                  Operator
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-white">
                  Kode Tindakan
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-white">
                  Nama Tindakan
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-white">
                  Jumlah
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-white">
                  Waktu (menit)
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-white">
                  Biaya Bahan
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-white">
                  Unit Cost
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-white">
                  Sumber
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-gray-500">
                    Tidak ada data yang ditemukan
                  </td>
                </tr>
              ) : (
                filteredData.map((row, index) => (
                  <tr key={row.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                      {index + 1}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                        row.kode_jenis === 1 ? "bg-sky-500 text-white" :
                        row.kode_jenis === 2 ? "bg-emerald-500 text-white" :
                        row.kode_jenis === 3 ? "bg-violet-500 text-white" :
                        "bg-gray-400 text-white"
                      }`}>
                        {getJenisLabel(row.kode_jenis)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      <div>
                        <p className="font-medium">{row.kode_unit_kerja}</p>
                        <p className="text-gray-500 text-xs">{row.nama_unit_kerja}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {row.kode_operator ? (
                        <div>
                          <p className="font-medium text-purple-600">{row.kode_operator}</p>
                          <p className="text-gray-500 text-xs">{row.nama_operator}</p>
                        </div>
                      ) : (
                        <span className="text-gray-400 text-xs">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-mono text-gray-900">
                      {row.kode_tindakan}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 max-w-[160px]">
                      <p className="truncate" title={row.nama_tindakan}>
                        {row.nama_tindakan}
                      </p>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-900">
                      {typeof row.jumlah === "number" ? row.jumlah.toLocaleString() : "-"}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-900">
                      {typeof row.waktu_pemeriksaan === "number" ? row.waktu_pemeriksaan : "-"}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-900">
                      {formatCurrency(row.biaya_bahan)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-right font-semibold text-gray-900">
                      {formatCurrency(row.unit_cost_per_tindakan)}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">
                      {getSumberLabel(row.sumber_tabel)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer Info */}
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-800">
          <strong>ℹ️ Informasi:</strong> Data ini merupakan rekapitulasi dari 7 tabel kalkulasi biaya 
          (Laboratorium, Radiologi, BDRS, Tindakan Rawat Jalan, Tindakan Rawat Inap, Tindakan Operatif, dan Cathlab). 
          Data akan otomatis ter-update ketika tabel sumber berubah melalui sistem trigger.
        </p>
      </div>
    </div>
  );
};

export default RekapitulasiUnitCost;
