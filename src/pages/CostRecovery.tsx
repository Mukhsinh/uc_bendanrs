import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Bar, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis, ComposedChart, Line } from "recharts";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FileDown, LineChart, TrendingUp } from "lucide-react";
import jsPDF from "jspdf";
import { useReportDownload } from "@/components/report";

type CostRecoveryRow = {
  unit_kerja_id: string;
  kode_unit_kerja: string;
  nama_unit_kerja: string;
  tahun: number;
  total_biaya: number | null;
  total_pendapatan: number | null;
  pendapatan_umum: number | null;
  pendapatan_bpjs: number | null;
  pendapatan_apbd: number | null;
};

const GAUGE_MAX = 200;

const clampRate = (rate: number) => {
  if (!Number.isFinite(rate)) return 0;
  return Math.max(0, Math.min(rate, GAUGE_MAX));
};

const polarToCartesian = (centerX: number, centerY: number, radius: number, angleInDegrees: number) => {
  const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180;
  return {
    x: centerX + radius * Math.cos(angleInRadians),
    y: centerY + radius * Math.sin(angleInRadians),
  };
};

const describeArc = (x: number, y: number, radius: number, startAngle: number, endAngle: number) => {
  const start = polarToCartesian(x, y, radius, endAngle);
  const end = polarToCartesian(x, y, radius, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
  return [`M ${start.x} ${start.y}`, `A ${radius} ${radius} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`].join(" ");
};

const CostRecoveryGaugeCard: React.FC<{ rate: number }> = ({ rate }) => {
  const clamped = clampRate(rate);
  const centerX = 100;
  const centerY = 100;
  const radius = 70;
  const pointerLength = 55;
  const startAngle = -90;
  const endAngle = 90;
  const angle = startAngle + (clamped / GAUGE_MAX) * (endAngle - startAngle);
  const angleRadians = (angle * Math.PI) / 180;
  const pointerX = centerX + pointerLength * Math.cos(angleRadians);
  const pointerY = centerY + pointerLength * Math.sin(angleRadians);
  const pointerColor = rate >= 100 ? "#16a34a" : "#ef4444";

  return (
    <Card className="w-full max-w-xs border border-slate-200 bg-white shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm font-medium text-slate-700">
          <TrendingUp className="h-4 w-4" />
          Cost Recovery Rate
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-2">
        <div className="flex flex-col items-center gap-2">
          <svg viewBox="0 0 200 120" className="w-40">
            <defs>
              <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#ef4444" />
                <stop offset="100%" stopColor="#16a34a" />
              </linearGradient>
            </defs>
            <path
              d={describeArc(centerX, centerY, radius, startAngle, endAngle)}
              stroke="#e2e8f0"
              strokeWidth={14}
              fill="none"
              strokeLinecap="round"
            />
            <path
              d={describeArc(centerX, centerY, radius, startAngle, angle)}
              stroke="url(#gaugeGradient)"
              strokeWidth={14}
              fill="none"
              strokeLinecap="round"
            />
            <line
              x1={centerX}
              y1={centerY}
              x2={pointerX}
              y2={pointerY}
              stroke={pointerColor}
              strokeWidth={6}
              strokeLinecap="round"
            />
            <circle cx={centerX} cy={centerY} r={8} fill="#0f172a" />
          </svg>
          <div className="text-3xl font-semibold text-slate-900">
            {Number.isFinite(rate) ? `${rate.toFixed(1)}%` : "0.0%"}
          </div>
          <p className="text-xs text-slate-500">Target ≥ 100%</p>
        </div>
      </CardContent>
    </Card>
  );
};

const renderCandle = (props: any) => {
  const { x, width, payload, yAxis } = props;
  const scale = yAxis?.scale;

  if (typeof scale !== "function" || !payload) {
    return null;
  }

  const toNumber = (val: number | null | undefined) => (Number.isFinite(Number(val)) ? Number(val) : 0);

  const highY = scale(toNumber(payload.candleHigh));
  const lowY = scale(toNumber(payload.candleLow));
  const openY = scale(toNumber(payload.candleOpen));
  const closeY = scale(toNumber(payload.candleClose));

  if (![highY, lowY, openY, closeY].every((val) => Number.isFinite(val))) {
    return null;
  }

  const color = (payload.candleDiff ?? 0) >= 0 ? "#16a34a" : "#ef4444";
  const centerX = x + width / 2;

  const bodyTop = Math.min(openY, closeY);
  const bodyBottom = Math.max(openY, closeY);
  const bodyHeight = Math.max(bodyBottom - bodyTop, 2);
  const bodyWidth = Math.max(width * 0.6, 6);
  const bodyX = x + (width - bodyWidth) / 2;

  return (
    <g>
      <line x1={centerX} x2={centerX} y1={highY} y2={lowY} stroke={color} strokeWidth={2} />
      <rect x={bodyX} y={bodyTop} width={bodyWidth} height={bodyHeight} fill={color} opacity={0.9} rx={2} />
    </g>
  );
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value || 0);

const CostRecovery: React.FC = () => {
  const [tahun, setTahun] = useState<number>(2025);
  const [unitOptions, setUnitOptions] = useState<{ id: string; kode: string; nama: string }[]>([]);
  const [unitFilter, setUnitFilter] = useState<string>("all");
  const [revenueFilter, setRevenueFilter] = useState<string>("total");
  const [rows, setRows] = useState<CostRecoveryRow[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<string>("comparison");
  const [downloadDialogOpen, setDownloadDialogOpen] = useState(false);
  const [selectedCharts, setSelectedCharts] = useState<string[]>(["comparison"]);

  const comparisonChartRef = useRef<HTMLDivElement>(null);
  const candleChartRef = useRef<HTMLDivElement>(null);
  const { downloadReport } = useReportDownload();

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      try {
        const { error: refreshError } = await supabase.rpc("api_refresh_cost_recovery", { p_tahun: tahun });
        if (refreshError) {
          console.error("Error refreshing cost_recovery:", refreshError);
        }

        const { data, error } = await supabase
          .from("cost_recovery")
          .select(
            "unit_kerja_id, kode_unit_kerja, nama_unit_kerja, tahun, total_biaya, pendapatan_umum, pendapatan_bpjs, pendapatan_apbd, total_pendapatan",
          )
          .eq("tahun", tahun)
          .order("kode_unit_kerja", { ascending: true });

        if (error) {
          console.error("Error loading cost_recovery:", error);
          setRows([]);
          return;
        }

        const rowsData = (data as CostRecoveryRow[]) || [];
        setRows(rowsData);

        const uniqueUnits = rowsData.map((row) => ({
          id: row.unit_kerja_id,
          kode: row.kode_unit_kerja,
          nama: row.nama_unit_kerja,
        }));
        setUnitOptions(uniqueUnits);
      } catch (err) {
        console.error("Error in init:", err);
        setRows([]);
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [tahun]);

  const filtered = useMemo(() => {
    if (unitFilter === "all") return rows;
    return rows.filter((r) => r.unit_kerja_id === unitFilter);
  }, [rows, unitFilter]);

  const chartData = useMemo(
    () =>
      filtered.map((r) => {
        const totalPendapatan =
          (Number(r.pendapatan_umum) || 0) +
          (Number(r.pendapatan_bpjs) || 0) +
          (Number(r.pendapatan_apbd) || 0);
        const totalBiaya = Number(r.total_biaya) || 0;

        let pendapatanValue = 0;
        switch (revenueFilter) {
          case "umum":
            pendapatanValue = r.pendapatan_umum || 0;
            break;
          case "bpjs":
            pendapatanValue = r.pendapatan_bpjs || 0;
            break;
          case "apbd":
            pendapatanValue = r.pendapatan_apbd || 0;
            break;
          case "total":
          default:
            pendapatanValue = totalPendapatan;
            break;
        }

        const difference = totalPendapatan - totalBiaya;
        const high = Math.max(totalPendapatan, totalBiaya);
        const low = Math.min(totalPendapatan, totalBiaya);

        return {
          unit: `${r.kode_unit_kerja} - ${r.nama_unit_kerja}`,
          pendapatan: pendapatanValue,
          pendapatanUmum: Number(r.pendapatan_umum) || 0,
          pendapatanBpjs: Number(r.pendapatan_bpjs) || 0,
          pendapatanApbd: Number(r.pendapatan_apbd) || 0,
          totalPendapatan,
          totalBiaya,
          candleHigh: high,
          candleLow: low,
          candleOpen: totalBiaya,
          candleClose: totalPendapatan,
          candleDiff: difference,
        };
      }),
    [filtered, revenueFilter],
  );

  const tableTotals = useMemo(() => {
    return filtered.reduce(
      (acc, row) => {
        acc.totalBiaya += Number(row.total_biaya) || 0;
        acc.pendapatanUmum += Number(row.pendapatan_umum) || 0;
        acc.pendapatanBpjs += Number(row.pendapatan_bpjs) || 0;
        acc.pendapatanApbd += Number(row.pendapatan_apbd) || 0;
        acc.totalPendapatan +=
          (Number(row.pendapatan_umum) || 0) +
          (Number(row.pendapatan_bpjs) || 0) +
          (Number(row.pendapatan_apbd) || 0);
        return acc;
      },
      {
        totalBiaya: 0,
        pendapatanUmum: 0,
        pendapatanBpjs: 0,
        pendapatanApbd: 0,
        totalPendapatan: 0,
      },
    );
  }, [filtered]);

  const costRecoveryRate = useMemo(() => {
    if (tableTotals.totalBiaya === 0) {
      return 0;
    }
    return (tableTotals.totalPendapatan / tableTotals.totalBiaya) * 100;
  }, [tableTotals]);

  const handleToggleChartSelection = useCallback((value: string) => {
    setSelectedCharts((prev) =>
      prev.includes(value) ? prev.filter((item) => item !== value) : [...prev, value],
    );
  }, []);

  const createImageFromSvg = useCallback(async (svgElement: SVGSVGElement) => {
    const serializer = new XMLSerializer();
    const svgString = serializer.serializeToString(svgElement);
    const blob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);

    try {
      const img = new Image();
      img.src = url;
      await new Promise((resolve, reject) => {
        img.onload = () => resolve(true);
        img.onerror = (error) => reject(error);
      });

      const width = svgElement.clientWidth || 800;
      const height = svgElement.clientHeight || 400;
      const scale = 2;

      const canvas = document.createElement("canvas");
      canvas.width = width * scale;
      canvas.height = height * scale;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        throw new Error("Canvas context tidak tersedia.");
      }

      ctx.scale(scale, scale);
      ctx.drawImage(img, 0, 0, width, height);

      const imgData = canvas.toDataURL("image/png");
      return { imgData, width, height };
    } finally {
      URL.revokeObjectURL(url);
    }
  }, []);

  const handleDownloadChartsPdf = useCallback(async () => {
    if (selectedCharts.length === 0) {
      setDownloadDialogOpen(false);
      return;
    }

    const pdf = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 32;

    for (let index = 0; index < selectedCharts.length; index++) {
      const chartKey = selectedCharts[index];
      const container = chartKey === "comparison" ? comparisonChartRef.current : candleChartRef.current;
      const svg = container?.querySelector("svg");

      if (!svg) {
        continue;
      }

      if (index > 0) {
        pdf.addPage();
      }

      const { imgData, width, height } = await createImageFromSvg(svg);

      const aspectRatio = width / height;
      const availableWidth = pageWidth - margin * 2;
      const availableHeight = pageHeight - margin * 2;

      let renderWidth = availableWidth;
      let renderHeight = renderWidth / aspectRatio;

      if (renderHeight > availableHeight) {
        renderHeight = availableHeight;
        renderWidth = renderHeight * aspectRatio;
      }

      const x = (pageWidth - renderWidth) / 2;
      const y = (pageHeight - renderHeight) / 2;

      const title =
        chartKey === "comparison"
          ? "Grafik Perbandingan Pendapatan vs Biaya"
          : "Grafik Selisih Pendapatan-Biaya";

      pdf.setFontSize(14);
      pdf.text(title, margin, margin - 6);
      pdf.addImage(imgData, "PNG", x, y, renderWidth, renderHeight);
    }

    pdf.save(`grafik-cost-recovery-${tahun}.pdf`);
    setDownloadDialogOpen(false);
  }, [selectedCharts, tahun, createImageFromSvg]);

  const handleDownloadReport = useCallback(async () => {
    if (filtered.length === 0) {
      toast.info("Tidak ada data untuk diunduh.");
      return;
    }

    try {
      const records = filtered.map((row) => ({
        "Kode Unit": row.kode_unit_kerja,
        "Nama Unit": row.nama_unit_kerja,
        "Total Biaya": Number(row.total_biaya) || 0,
        "Pendapatan Umum": Number(row.pendapatan_umum) || 0,
        "Pendapatan BPJS": Number(row.pendapatan_bpjs) || 0,
        "Pendapatan APBD": Number(row.pendapatan_apbd) || 0,
        "Total Pendapatan":
          (Number(row.pendapatan_umum) || 0) +
          (Number(row.pendapatan_bpjs) || 0) +
          (Number(row.pendapatan_apbd) || 0),
      }));

      await downloadReport({
        title: "Laporan Cost Recovery",
        subtitle: `Tahun ${tahun}`,
        filename: `laporan_cost_recovery_${tahun}`,
        records,
        orientation: "landscape",
      });
    } catch (error) {
      console.error("Gagal mengunduh laporan cost recovery:", error);
      toast.error("Gagal mengunduh laporan cost recovery.");
    }
  }, [filtered, tahun, downloadReport]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Cost Recovery</h1>
        <p className="text-sm text-muted-foreground">
          Perbandingan total pendapatan vs total biaya per unit kerja (Pusat Pendapatan).
        </p>
      </div>

      <Card>
        <CardHeader className="space-y-3">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex flex-col gap-3 flex-1">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                <div>
                  <label className="text-sm font-medium mb-2 block">Tahun</label>
                  <Select value={tahun.toString()} onValueChange={(v) => setTahun(parseInt(v))}>
                    <SelectTrigger className="w-full md:w-40">
                      <SelectValue placeholder="Pilih tahun" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 5 }, (_, i) => {
                        const y = new Date().getFullYear() - i;
                        return (
                          <SelectItem key={y} value={y.toString()}>
                            {y}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button
                      onClick={() => setDownloadDialogOpen(true)}
                      className="h-9 px-4 bg-red-600 hover:bg-red-700 text-white flex items-center gap-2"
                    >
                      <LineChart className="h-4 w-4" />
                      Unduh Grafik
                    </Button>
                    <Button
                      onClick={() => {
                        void handleDownloadReport();
                      }}
                      className="h-9 px-4 bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
                    >
                      <FileDown className="h-4 w-4" />
                      Unduh Laporan
                    </Button>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Jenis Pendapatan</label>
                  <Select value={revenueFilter} onValueChange={setRevenueFilter}>
                    <SelectTrigger className="w-full md:w-48">
                      <SelectValue placeholder="Pilih jenis pendapatan" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="total">Total Pendapatan</SelectItem>
                      <SelectItem value="umum">Pendapatan Umum</SelectItem>
                      <SelectItem value="bpjs">Pendapatan BPJS</SelectItem>
                      <SelectItem value="apbd">Pendapatan APBD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Unit Kerja</label>
                  <Select value={unitFilter} onValueChange={setUnitFilter}>
                    <SelectTrigger className="w-full md:w-60">
                      <SelectValue placeholder="Pilih unit kerja" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua Unit</SelectItem>
                      {unitOptions.map((u) => (
                        <SelectItem key={u.id} value={u.id}>
                          {u.kode} - {u.nama}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <CostRecoveryGaugeCard rate={costRecoveryRate} />
          </div>
        </CardHeader>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="comparison">Perbandingan Pendapatan vs Biaya</TabsTrigger>
          <TabsTrigger value="candlestick">Grafik Selisih Pendapatan-Biaya</TabsTrigger>
        </TabsList>
        
        <TabsContent value="comparison">
          <Card>
            <CardHeader>
              <CardTitle>Grafik Perbandingan Pendapatan dan Total Biaya</CardTitle>
              <CardDescription>
                Batang menunjukkan pendapatan {revenueFilter === "total" ? "total (Umum, BPJS, dan APBD)" : revenueFilter === "umum" ? "Umum" : revenueFilter === "bpjs" ? "BPJS" : "APBD"}.
                Garis merah menampilkan total biaya dan garis hijau menampilkan total pendapatan untuk setiap unit kerja.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="h-96 flex items-center justify-center text-sm text-muted-foreground">Memuat data…</div>
              ) : chartData.length === 0 ? (
                <div className="h-96 flex items-center justify-center text-sm text-muted-foreground">Tidak ada data</div>
              ) : (
                <div className="h-96" ref={comparisonChartRef}>
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="unit" angle={-45} textAnchor="end" height={100} fontSize={12} />
                      <YAxis tickFormatter={(v) => `${(v / 1_000_000).toFixed(0)}M`} fontSize={12} />
                      <Tooltip formatter={(v: any) => formatCurrency(Number(v))} />
                      <Legend />
                      {revenueFilter === "total" ? (
                        <>
                          <Bar dataKey="pendapatanUmum" name="Pendapatan Umum" fill="#3b82f6" stackId="pendapatan" radius={[2,2,0,0]} />
                          <Bar dataKey="pendapatanBpjs" name="Pendapatan BPJS" fill="#1d4ed8" stackId="pendapatan" radius={[2,2,0,0]} />
                          <Bar dataKey="pendapatanApbd" name="Pendapatan APBD" fill="#0f766e" stackId="pendapatan" radius={[2,2,0,0]} />
                        </>
                      ) : (
                        <Bar
                          dataKey="pendapatan"
                          name={
                            revenueFilter === "umum"
                              ? "Pendapatan Umum"
                              : revenueFilter === "bpjs"
                              ? "Pendapatan BPJS"
                              : "Pendapatan APBD"
                          }
                          fill={revenueFilter === "apbd" ? "#0f766e" : "#0ea5e9"}
                          radius={[2, 2, 0, 0]}
                        />
                      )}
                      <Line dataKey="totalBiaya" name="Total Biaya" stroke="#ef4444" strokeWidth={2} dot={false} />
                      <Line dataKey="totalPendapatan" name="Total Pendapatan" stroke="#16a34a" strokeWidth={2} dot={false} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="candlestick">
          <Card>
            <CardHeader>
              <CardTitle>Grafik Selisih Pendapatan-Biaya</CardTitle>
              <CardDescription>
                Batang candle menunjukkan jangkauan antara total biaya dan total pendapatan per unit. Warna merah ketika pendapatan lebih kecil dari biaya, hijau ketika pendapatan melampaui biaya.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="h-96 flex items-center justify-center text-sm text-muted-foreground">Memuat data…</div>
              ) : chartData.length === 0 ? (
                <div className="h-96 flex items-center justify-center text-sm text-muted-foreground">Tidak ada data</div>
              ) : (
                <div className="h-96" ref={candleChartRef}>
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="unit" angle={-45} textAnchor="end" height={100} fontSize={12} />
                      <YAxis tickFormatter={(v) => `${(v / 1_000_000).toFixed(0)}M`} fontSize={12} />
                      <Tooltip
                        formatter={(value: any, name: string) => {
                          if (name === "Selisih") {
                            return [formatCurrency(Number(value)), "Selisih"];
                          }
                          if (name === "Total Biaya" || name === "Total Pendapatan") {
                            return [formatCurrency(Number(value)), name];
                          }
                          return [formatCurrency(Number(value)), name];
                        }}
                      />
                      <Legend />
                      <Bar
                        dataKey="candleDiff"
                        name="Selisih"
                        fill="transparent"
                        legendType="none"
                        shape={renderCandle}
                        isAnimationActive={false}
                      />
                      <Line dataKey="totalBiaya" name="Total Biaya" stroke="#ef4444" strokeWidth={2} dot={false} />
                      <Line dataKey="totalPendapatan" name="Total Pendapatan" stroke="#16a34a" strokeWidth={2} dot={false} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-emerald-700">
                  <TableHead className="w-40 text-white">Kode Unit</TableHead>
                  <TableHead className="text-white">Nama Unit</TableHead>
                  <TableHead className="text-right text-white">Total Biaya</TableHead>
                  <TableHead className="text-right text-white">Pendapatan Umum</TableHead>
                  <TableHead className="text-right text-white">Pendapatan BPJS</TableHead>
                  <TableHead className="text-right text-white">Pendapatan APBD</TableHead>
                  <TableHead className="text-right text-white">Total Pendapatan</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-sm text-muted-foreground py-6">
                      Tidak ada data untuk filter saat ini.
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((row) => (
                    <TableRow key={row.unit_kerja_id}>
                      <TableCell className="font-medium">{row.kode_unit_kerja}</TableCell>
                      <TableCell>{row.nama_unit_kerja}</TableCell>
                      <TableCell className="text-right">{formatCurrency(Number(row.total_biaya) || 0)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(Number(row.pendapatan_umum) || 0)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(Number(row.pendapatan_bpjs) || 0)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(Number(row.pendapatan_apbd) || 0)}</TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(
                          (Number(row.pendapatan_umum) || 0) +
                            (Number(row.pendapatan_bpjs) || 0) +
                            (Number(row.pendapatan_apbd) || 0),
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
                {filtered.length > 0 && (
                  <TableRow className="bg-muted/50 font-semibold">
                    <TableCell colSpan={2}>Total</TableCell>
                    <TableCell className="text-right">{formatCurrency(tableTotals.totalBiaya)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(tableTotals.pendapatanUmum)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(tableTotals.pendapatanBpjs)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(tableTotals.pendapatanApbd)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(tableTotals.totalPendapatan)}</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={downloadDialogOpen} onOpenChange={setDownloadDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Pilih Grafik yang Akan Diunduh</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <Checkbox
                id="comparison-chart"
                checked={selectedCharts.includes("comparison")}
                onCheckedChange={() => handleToggleChartSelection("comparison")}
              />
              <label htmlFor="comparison-chart" className="text-sm leading-none">
                Grafik Perbandingan Pendapatan vs Biaya
              </label>
            </div>
            <div className="flex items-center space-x-3">
              <Checkbox
                id="candlestick-chart"
                checked={selectedCharts.includes("candlestick")}
                onCheckedChange={() => handleToggleChartSelection("candlestick")}
              />
              <label htmlFor="candlestick-chart" className="text-sm leading-none">
                Grafik Selisih Pendapatan-Biaya
              </label>
            </div>
          </div>
          <DialogFooter className="sm:justify-end">
            <Button variant="outline" onClick={() => setDownloadDialogOpen(false)}>
              Batal
            </Button>
            <Button className="bg-red-600 hover:bg-red-700 text-white" onClick={handleDownloadChartsPdf}>
              Unduh PDF
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CostRecovery;