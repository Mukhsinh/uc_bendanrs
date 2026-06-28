import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  BarChart2,
  Activity,
  Building2,
  Minus,
} from "lucide-react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useYear } from "@/contexts/YearContext";
import { useTenant } from "@/contexts/TenantContext";
import YearFilter from "@/components/ui/YearFilter";

// ──────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────

const formatRupiah = (value: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);

const formatRupiahFull = (value: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);

// ──────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────

interface BiayaRow {
  nama_unit_kerja: string;
  total_biaya: number;
}

interface PendapatanRow {
  nama_unit_kerja: string;
  total_pendapatan: number;
}

// ──────────────────────────────────────────────
// Metric Card
// ──────────────────────────────────────────────

interface MetricCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: React.ElementType;
  iconColor: string;
  cardColor: string;
  trend?: "up" | "down" | "neutral";
  trendLabel?: string;
}

const MetricCard = ({
  title,
  value,
  subtitle,
  icon: Icon,
  iconColor,
  cardColor,
  trend,
  trendLabel,
}: MetricCardProps) => (
  <Card className={`${cardColor} border-0 shadow-md hover:shadow-lg transition-shadow`}>
    <CardContent className="p-5">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-white/80 mb-1">{title}</p>
          <p className="text-2xl font-bold text-white leading-tight">{value}</p>
          {subtitle && <p className="text-xs text-white/70 mt-1">{subtitle}</p>}
          {trend && trendLabel && (
            <div className="flex items-center gap-1 mt-2">
              {trend === "up" && <TrendingUp className="h-3.5 w-3.5 text-green-300" />}
              {trend === "down" && <TrendingDown className="h-3.5 w-3.5 text-red-300" />}
              {trend === "neutral" && <Minus className="h-3.5 w-3.5 text-white/50" />}
              <span className="text-xs text-white/70">{trendLabel}</span>
            </div>
          )}
        </div>
        <div className={`p-3 rounded-xl bg-white/20 ${iconColor}`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
      </div>
    </CardContent>
  </Card>
);

// ──────────────────────────────────────────────
// Custom Tooltip for Charts
// ──────────────────────────────────────────────

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-100 rounded-xl shadow-lg p-3 text-xs">
      <p className="font-semibold text-gray-700 mb-1 truncate max-w-[200px]">{label}</p>
      {payload.map((entry: any) => (
        <div key={entry.dataKey} className="flex items-center gap-2 mt-0.5">
          <span className="w-2.5 h-2.5 rounded-full" style={{ background: entry.color }} />
          <span className="text-gray-500">{entry.name}:</span>
          <span className="font-medium text-gray-800">{formatRupiah(entry.value)}</span>
        </div>
      ))}
    </div>
  );
};

// ──────────────────────────────────────────────
// Dashboard Page
// ──────────────────────────────────────────────

const Dashboard = () => {
  const { selectedYear } = useYear();
  const { tenant } = useTenant();
  const tenantId = tenant?.id;

  // ── Fetch biaya ──
  const { data: biayaData, isLoading: loadingBiaya } = useQuery({
    queryKey: ["dashboard-biaya", selectedYear, tenantId],
    queryFn: async () => {
      if (!tenantId) return [];
      const { data, error } = await supabase
        .from("data_biaya")
        .select("nama_unit_kerja, total_biaya")
        .eq("tahun", selectedYear)
        .eq("tenant_id", tenantId)
        .order("total_biaya", { ascending: false });
      if (error) throw error;
      return (data ?? []) as BiayaRow[];
    },
    enabled: !!tenantId,
  });

  // ── Fetch pendapatan ──
  const { data: pendapatanData, isLoading: loadingPendapatan } = useQuery({
    queryKey: ["dashboard-pendapatan", selectedYear, tenantId],
    queryFn: async () => {
      if (!tenantId) return [];
      const { data, error } = await supabase
        .from("data_pendapatan")
        .select("nama_unit_kerja, total_pendapatan")
        .eq("tahun", selectedYear)
        .eq("tenant_id", tenantId)
        .order("total_pendapatan", { ascending: false });
      if (error) throw error;
      return (data ?? []) as PendapatanRow[];
    },
    enabled: !!tenantId,
  });

  // ── Fetch jumlah unit kerja ──
  const { data: unitKerjaData } = useQuery({
    queryKey: ["dashboard-unit-kerja", tenantId],
    queryFn: async () => {
      if (!tenantId) return [];
      const { data, error } = await supabase
        .from("unit_kerja")
        .select("id")
        .eq("tenant_id", tenantId);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!tenantId,
  });

  const isLoading = loadingBiaya || loadingPendapatan;

  // ── Metrics ──
  const metrics = useMemo(() => {
    const totalBiaya = (biayaData ?? []).reduce((sum, r) => sum + Number(r.total_biaya || 0), 0);
    const totalPendapatan = (pendapatanData ?? []).reduce((sum, r) => sum + Number(r.total_pendapatan || 0), 0);
    const costRecovery = totalBiaya > 0 ? (totalPendapatan / totalBiaya) * 100 : 0;
    const jumlahUnit = unitKerjaData?.length ?? 0;
    return { totalBiaya, totalPendapatan, costRecovery, jumlahUnit };
  }, [biayaData, pendapatanData, unitKerjaData]);

  // ── Top 10 biaya per unit kerja ──
  const top10Biaya = useMemo(() => {
    return (biayaData ?? [])
      .slice(0, 10)
      .map((r) => ({
        name: r.nama_unit_kerja?.length > 20
          ? r.nama_unit_kerja.substring(0, 20) + "…"
          : r.nama_unit_kerja,
        fullName: r.nama_unit_kerja,
        biaya: Number(r.total_biaya || 0),
      }));
  }, [biayaData]);

  // ── Perbandingan pendapatan vs biaya per unit (top 10 berdasarkan biaya) ──
  const perbandinganData = useMemo(() => {
    const topUnits = (biayaData ?? []).slice(0, 10).map((r) => r.nama_unit_kerja);
    return topUnits.map((unitNama) => {
      const biayaRow = (biayaData ?? []).find((r) => r.nama_unit_kerja === unitNama);
      const pendapatanRow = (pendapatanData ?? []).find((r) => r.nama_unit_kerja === unitNama);
      return {
        name: unitNama?.length > 15 ? unitNama.substring(0, 15) + "…" : unitNama,
        fullName: unitNama,
        pendapatan: Number(pendapatanRow?.total_pendapatan || 0),
        biaya: Number(biayaRow?.total_biaya || 0),
      };
    });
  }, [biayaData, pendapatanData]);

  const crColor = metrics.costRecovery >= 100
    ? "text-green-600"
    : metrics.costRecovery >= 75
    ? "text-yellow-600"
    : "text-red-600";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard Eksekutif</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Ringkasan data keuangan dan operasional tahun <span className="font-semibold text-teal-700">{selectedYear}</span>
          </p>
        </div>
        <div className="flex items-center gap-3">
          <YearFilter />
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <Activity className="h-4 w-4 text-teal-500" />
            <span className="hidden sm:inline">Data real-time dari database</span>
          </div>
        </div>
      </div>

      {/* Metric Cards */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <MetricCard
            title="Total Pendapatan"
            value={formatRupiah(metrics.totalPendapatan)}
            subtitle={formatRupiahFull(metrics.totalPendapatan)}
            icon={Wallet}
            iconColor=""
            cardColor="bg-gradient-to-br from-teal-500 to-teal-700"
            trend="neutral"
            trendLabel={`Tahun ${selectedYear}`}
          />
          <MetricCard
            title="Total Biaya"
            value={formatRupiah(metrics.totalBiaya)}
            subtitle={formatRupiahFull(metrics.totalBiaya)}
            icon={BarChart2}
            iconColor=""
            cardColor="bg-gradient-to-br from-orange-500 to-orange-700"
            trend="neutral"
            trendLabel={`Tahun ${selectedYear}`}
          />
          <MetricCard
            title="Cost Recovery"
            value={`${metrics.costRecovery.toFixed(1)}%`}
            subtitle={
              metrics.costRecovery >= 100
                ? "Pendapatan menutup biaya ✓"
                : "Pendapatan belum menutup biaya"
            }
            icon={TrendingUp}
            iconColor=""
            cardColor={
              metrics.costRecovery >= 100
                ? "bg-gradient-to-br from-green-500 to-green-700"
                : metrics.costRecovery >= 75
                ? "bg-gradient-to-br from-yellow-500 to-yellow-700"
                : "bg-gradient-to-br from-red-500 to-red-700"
            }
            trend={
              metrics.costRecovery >= 100
                ? "up"
                : metrics.costRecovery >= 75
                ? "neutral"
                : "down"
            }
            trendLabel={`Pendapatan / Biaya × 100%`}
          />
          <MetricCard
            title="Unit Kerja Aktif"
            value={String(metrics.jumlahUnit)}
            subtitle="Total unit kerja terdaftar"
            icon={Building2}
            iconColor=""
            cardColor="bg-gradient-to-br from-purple-500 to-purple-700"
          />
        </div>
      )}

      {/* Charts Row */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Perbandingan Pendapatan vs Biaya */}
        <Card className="shadow-sm border-gray-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold text-gray-800">
              Pendapatan vs Biaya per Unit Kerja
            </CardTitle>
            <CardDescription className="text-xs">
              Top 10 unit kerja dengan biaya tertinggi — tahun {selectedYear}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-64 w-full rounded-lg" />
            ) : perbandinganData.length === 0 ? (
              <div className="h-64 flex items-center justify-center text-sm text-gray-400">
                Belum ada data untuk tahun {selectedYear}
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={perbandinganData} margin={{ top: 4, right: 8, left: 8, bottom: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 10, fill: "#6b7280" }}
                    angle={-35}
                    textAnchor="end"
                    interval={0}
                    height={65}
                  />
                  <YAxis
                    tickFormatter={(v) => formatRupiah(v)}
                    tick={{ fontSize: 10, fill: "#6b7280" }}
                    width={70}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend
                    wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
                    iconType="circle"
                    iconSize={8}
                  />
                  <Bar dataKey="pendapatan" name="Pendapatan" fill="#14b8a6" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="biaya" name="Biaya" fill="#f97316" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Top 10 Biaya Unit Kerja */}
        <Card className="shadow-sm border-gray-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold text-gray-800">
              Distribusi Biaya Top 10 Unit Kerja
            </CardTitle>
            <CardDescription className="text-xs">
              Unit kerja dengan total biaya tertinggi — tahun {selectedYear}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-64 w-full rounded-lg" />
            ) : top10Biaya.length === 0 ? (
              <div className="h-64 flex items-center justify-center text-sm text-gray-400">
                Belum ada data untuk tahun {selectedYear}
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart
                  data={top10Biaya}
                  layout="vertical"
                  margin={{ top: 4, right: 16, left: 8, bottom: 4 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                  <XAxis
                    type="number"
                    tickFormatter={(v) => formatRupiah(v)}
                    tick={{ fontSize: 10, fill: "#6b7280" }}
                  />
                  <YAxis
                    dataKey="name"
                    type="category"
                    tick={{ fontSize: 10, fill: "#6b7280" }}
                    width={110}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="biaya" name="Total Biaya" fill="#8b5cf6" radius={[0, 3, 3, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tren Line Chart */}
      <Card className="shadow-sm border-gray-100">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold text-gray-800">
            Tren Pendapatan vs Biaya
          </CardTitle>
          <CardDescription className="text-xs">
            Perbandingan pendapatan dan biaya seluruh unit kerja — tahun {selectedYear}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-56 w-full rounded-lg" />
          ) : perbandinganData.length === 0 ? (
            <div className="h-56 flex items-center justify-center text-sm text-gray-400">
              Belum ada data untuk tahun {selectedYear}
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={perbandinganData} margin={{ top: 4, right: 16, left: 8, bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 10, fill: "#6b7280" }}
                  angle={-35}
                  textAnchor="end"
                  interval={0}
                  height={65}
                />
                <YAxis
                  tickFormatter={(v) => formatRupiah(v)}
                  tick={{ fontSize: 10, fill: "#6b7280" }}
                  width={70}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} iconType="circle" iconSize={8} />
                <Line
                  type="monotone"
                  dataKey="pendapatan"
                  name="Pendapatan"
                  stroke="#14b8a6"
                  strokeWidth={2}
                  dot={{ r: 3, fill: "#14b8a6" }}
                  activeDot={{ r: 5 }}
                />
                <Line
                  type="monotone"
                  dataKey="biaya"
                  name="Biaya"
                  stroke="#f97316"
                  strokeWidth={2}
                  dot={{ r: 3, fill: "#f97316" }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
