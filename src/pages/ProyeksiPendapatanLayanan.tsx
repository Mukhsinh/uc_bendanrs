import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { LineChart, Activity, TrendingUp, RefreshCcw, Crown, Award, Sparkles } from "lucide-react";
import * as XLSX from "xlsx";

interface UnitOption { id: string; kode: string; nama: string; kategori?: string; jenis?: string }
interface RowData {
  id?: number;
  unit_kerja_id?: string;
  jenis?: string;
  kode_unit_kerja?: string;
  nama_unit_kerja?: string;
  tahun: number;
  total_kunjungan_historis: number;
  total_hari_rawat_historis: number;
  persentase_kunjungan: number;
  persentase_hari_rawat: number;
  proyeksi_kunjungan: number;
  proyeksi_hari_rawat: number;
  avg_pendapatan_per_kunjungan: number;
  avg_pendapatan_per_hari_rawat: number;
  prognosa_pendapatan_rawat_jalan: number;
  prognosa_pendapatan_rawat_inap: number;
  prognosa_total_pendapatan: number;
  breakdown_bulanan_rawat_jalan: number;
  breakdown_bulanan_rawat_inap: number;
  breakdown_bulanan_total: number;
  // derived-only fields (tidak disimpan DB)
  pendapatan_rj_hist?: number;
  pendapatan_ri_hist?: number;
}

interface StrukturBiayaRecord {
  id?: string;
  tahun: number;
  unitKerjaId?: string;
  kodeUnitKerja: string;
  namaUnitKerja: string;
  kategoriUnit?: string | null;
  jenisLayanan?: string | null;
  totalPendapatan: number;
  totalKunjungan: number;
  totalHariRawat: number;
  pendapatanPerKunjungan?: number;
  pendapatanPerHariRawat?: number;
}

interface PendapatanAggregated {
  umum: number;
  bpjs: number;
  apbd: number;
}

const EXCLUDED_RAWAT_INAP_CODES = new Set(["UK074", "UK045", "UK042"]);

const ProyeksiPendapatanLayanan: React.FC = () => {
  const [tahun, setTahun] = useState<number>(new Date().getFullYear());
  const [unitOptions, setUnitOptions] = useState<UnitOption[]>([]);
  const [strukturBiayaData, setStrukturBiayaData] = useState<StrukturBiayaRecord[]>([]);
  const [pendapatanMap, setPendapatanMap] = useState<Record<string, PendapatanAggregated>>({});
  const [selectedUnit, setSelectedUnit] = useState<string>("all");
  const [selectedJenis, setSelectedJenis] = useState<string>("all");
  const [rows, setRows] = useState<RowData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [persenKunjungan, setPersenKunjungan] = useState<number>(5);
  const [persenHariRawat, setPersenHariRawat] = useState<number>(5);
  const [isDownloadOpen, setIsDownloadOpen] = useState<boolean>(false);

  const normalizeJenis = (val: unknown): string => {
    if (typeof val === 'number') {
      return val === 1 ? 'rawat jalan' : val === 2 ? 'rawat inap' : val === 3 ? 'operatif' : 'non layanan';
    }
    if (typeof val === 'string') return val.toLowerCase();
    return '';
  };

  const toNumber = (value: unknown, defaultValue = 0): number => {
    if (value === null || value === undefined || value === "") {
      return defaultValue;
    }
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : defaultValue;
  };

  const toNumberOrUndefined = (value: unknown): number | undefined => {
    if (value === null || value === undefined || value === "") {
      return undefined;
    }
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  };

  const fetchStrukturBiaya = useCallback(async () => {
    setLoading(true);
    try {
      const [{ data, error }, { data: pendapatanData, error: pendapatanError }] = await Promise.all([
        supabase
        .from("struktur_biaya")
        .select("id, tahun, unit_kerja_id, kode_unit_kerja, nama_unit_kerja, kategori_unit, jenis_layanan, total_pendapatan, total_kunjungan, jumlah_hari_rawat, pendapatan_per_kunjungan, pendapatan_per_hari_rawat")
        .eq("tahun", tahun),
        supabase
          .from("data_pendapatan")
          .select("kode_unit_kerja, pendapatan_umum, pendapatan_bpjs, pendapatan_apbd, unit_kerja(kode), tahun")
          .eq("tahun", tahun),
      ]);

      if (error) {
        throw error;
      }
      if (pendapatanError) {
        throw pendapatanError;
      }

      const normalized: StrukturBiayaRecord[] = (data || []).map((item: any) => ({
        id: item.id ?? undefined,
        tahun: Number(item.tahun) || tahun,
        unitKerjaId: item.unit_kerja_id ?? undefined,
        kodeUnitKerja: item.kode_unit_kerja,
        namaUnitKerja: item.nama_unit_kerja,
        kategoriUnit: item.kategori_unit ?? null,
        jenisLayanan: item.jenis_layanan ?? null,
        totalPendapatan: toNumber(item.total_pendapatan),
        totalKunjungan: toNumber(item.total_kunjungan),
        totalHariRawat: toNumber(item.jumlah_hari_rawat),
        pendapatanPerKunjungan: toNumberOrUndefined(item.pendapatan_per_kunjungan),
        pendapatanPerHariRawat: toNumberOrUndefined(item.pendapatan_per_hari_rawat),
      }));

      setStrukturBiayaData(normalized);

      const pendapatanAggregated: Record<string, PendapatanAggregated> = {};
      (pendapatanData || []).forEach((item: any) => {
        const kode = (item.kode_unit_kerja || item.unit_kerja?.kode || "").toString().toUpperCase();
        if (!kode) return;
        if (!pendapatanAggregated[kode]) {
          pendapatanAggregated[kode] = { umum: 0, bpjs: 0, apbd: 0 };
        }
        pendapatanAggregated[kode].umum += toNumber(item.pendapatan_umum);
        pendapatanAggregated[kode].bpjs += toNumber(item.pendapatan_bpjs);
        pendapatanAggregated[kode].apbd += toNumber(item.pendapatan_apbd);
      });
      setPendapatanMap(pendapatanAggregated);

      const unitMap = new Map<string, UnitOption>();
      normalized.forEach((row) => {
        const key = row.kodeUnitKerja;
        if (!unitMap.has(key)) {
          unitMap.set(key, {
            id: row.unitKerjaId || row.kodeUnitKerja,
            kode: row.kodeUnitKerja,
            nama: row.namaUnitKerja,
            kategori: row.kategoriUnit || undefined,
            jenis: normalizeJenis(row.jenisLayanan),
          });
        }
      });
      setUnitOptions(Array.from(unitMap.values()));
    } catch (error) {
      console.error("Gagal memuat data struktur biaya:", error);
      alert(`Gagal memuat data struktur biaya: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setLoading(false);
    }
  }, [tahun]);

  useEffect(() => {
    fetchStrukturBiaya();
  }, [fetchStrukturBiaya]);

  useEffect(() => {
    const pKunj = (Number(persenKunjungan) || 0) / 100;
    const pHari = (Number(persenHariRawat) || 0) / 100;

    const mapped: RowData[] = strukturBiayaData
      .filter(row => normalizeJenis(row.kategoriUnit) === 'pusat pendapatan' || (row.kategoriUnit ?? '').toLowerCase() === 'pusat pendapatan')
      .filter(row => {
        const jenis = normalizeJenis(row.jenisLayanan);
        const kode = (row.kodeUnitKerja || "").toUpperCase();
        if (jenis === 'rawat inap' && EXCLUDED_RAWAT_INAP_CODES.has(kode)) {
          return false;
        }
        return true;
      })
      .map((row) => {
        const jenis = normalizeJenis(row.jenisLayanan);
        const kode = (row.kodeUnitKerja || "").toUpperCase();
        const totalKunjungan = row.totalKunjungan;
        const totalHari = row.totalHariRawat;
        const pendapatanSource = pendapatanMap[kode];
        const totalPendapatan = pendapatanSource
          ? pendapatanSource.umum + pendapatanSource.bpjs
          : row.totalPendapatan;
        const avgPerKunjungan = totalKunjungan > 0 ? totalPendapatan / totalKunjungan : 0;
        const avgPerHari = totalHari > 0 ? totalPendapatan / totalHari : 0;

        const proyeksiKunjungan = Math.round((1 + pKunj) * totalKunjungan);
        const proyeksiHariRawat = Math.round((1 + pHari) * totalHari);

        const prognosaRJ = jenis === 'rawat jalan' ? Math.round(proyeksiKunjungan * avgPerKunjungan) : 0;
        const prognosaRI = jenis === 'rawat inap' ? Math.round(proyeksiHariRawat * avgPerHari) : 0;
        const prognosaTotal = prognosaRJ + prognosaRI;

        return {
          tahun: row.tahun,
          unit_kerja_id: row.unitKerjaId,
          jenis,
          kode_unit_kerja: row.kodeUnitKerja,
          nama_unit_kerja: row.namaUnitKerja,
          total_kunjungan_historis: totalKunjungan,
          total_hari_rawat_historis: totalHari,
          persentase_kunjungan: pKunj,
          persentase_hari_rawat: pHari,
          proyeksi_kunjungan: proyeksiKunjungan,
          proyeksi_hari_rawat: proyeksiHariRawat,
          avg_pendapatan_per_kunjungan: Math.round(avgPerKunjungan),
          avg_pendapatan_per_hari_rawat: Math.round(avgPerHari),
          prognosa_pendapatan_rawat_jalan: prognosaRJ,
          prognosa_pendapatan_rawat_inap: prognosaRI,
          prognosa_total_pendapatan: prognosaTotal,
          breakdown_bulanan_rawat_jalan: Math.round(prognosaRJ / 12),
          breakdown_bulanan_rawat_inap: Math.round(prognosaRI / 12),
          breakdown_bulanan_total: Math.round(prognosaTotal / 12),
          pendapatan_rj_hist: jenis === 'rawat jalan' ? Math.round(totalPendapatan) : 0,
          pendapatan_ri_hist: jenis === 'rawat inap' ? Math.round(totalPendapatan) : 0,
        };
      });

    setRows(mapped);
  }, [strukturBiayaData, persenKunjungan, persenHariRawat, pendapatanMap]);

  const filteredRows = useMemo(() => {
    return rows.filter(r => {
      const unitOk = selectedUnit === "all" || r.kode_unit_kerja === selectedUnit;
      const jenisVal = normalizeJenis(r.jenis);
      const jenisAllowed = jenisVal.includes("rawat jalan") || jenisVal.includes("rawat inap");
      const jenisFilter = selectedJenis === "all" || jenisVal === selectedJenis.toLowerCase();
      return unitOk && jenisAllowed && jenisFilter;
    });
  }, [rows, selectedUnit, selectedJenis]);

  const totalPrognosa = useMemo(() => filteredRows.reduce((s, r) => s + (r.prognosa_total_pendapatan || 0), 0), [filteredRows]);
  const totalPrognosaRJ = useMemo(() => filteredRows.reduce((s, r) => s + (r.prognosa_pendapatan_rawat_jalan || 0), 0), [filteredRows]);
  const totalPrognosaRI = useMemo(() => filteredRows.reduce((s, r) => s + (r.prognosa_pendapatan_rawat_inap || 0), 0), [filteredRows]);
  const totalKunjRJ = useMemo(() => filteredRows.filter(r=>normalizeJenis(r.jenis)==='rawat jalan').reduce((s,r)=>s+(r.total_kunjungan_historis||0),0), [filteredRows]);
  const totalKunjRI = useMemo(() => filteredRows.filter(r=>normalizeJenis(r.jenis)==='rawat inap').reduce((s,r)=>s+(r.total_kunjungan_historis||0),0), [filteredRows]);
  const totalHariRawat = useMemo(() => filteredRows.reduce((s,r)=>s+(r.total_hari_rawat_historis||0),0), [filteredRows]);

  const percent = (val: number, total: number) => total > 0 ? Math.round((val / total) * 10000) / 100 : 0;

  const handleRefreshFromSource = async () => {
    await fetchStrukturBiaya();
  };

  const downloadExcel = (scope: "all" | "rawat jalan" | "rawat inap") => {
    const scopedRows = filteredRows.filter(r => {
      if (scope === "all") return true;
      return normalizeJenis(r.jenis) === scope;
    });

    const rows = scopedRows.map(r => ({
      Kode: r.kode_unit_kerja,
      Unit: r.nama_unit_kerja,
      Tahun: r.tahun,
      Jenis: normalizeJenis(r.jenis),
      Kunjungan_Hist: r.total_kunjungan_historis,
      Hari_Rawat_Hist: r.total_hari_rawat_historis,
      Proyeksi_Kunjungan: r.proyeksi_kunjungan,
      Proyeksi_Hari_Rawat: r.proyeksi_hari_rawat,
      Avg_per_Kunjungan: r.avg_pendapatan_per_kunjungan,
      Avg_per_Hari_Rawat: r.avg_pendapatan_per_hari_rawat,
      Pendapatan_RJ: r.pendapatan_rj_hist || 0,
      Pendapatan_RI: r.pendapatan_ri_hist || 0,
      Prognosa_RJ: r.prognosa_pendapatan_rawat_jalan,
      Prognosa_RI: r.prognosa_pendapatan_rawat_inap,
      Prognosa_Total: r.prognosa_total_pendapatan,
      Bulanan_RJ: r.breakdown_bulanan_rawat_jalan,
      Bulanan_RI: r.breakdown_bulanan_rawat_inap,
      Bulanan_Total: r.breakdown_bulanan_total,
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    const sheetName =
      scope === "all"
        ? `Proyeksi_${tahun}`
        : `Proyeksi_${scope.replace(" ", "_")}_${tahun}`;
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
    XLSX.writeFile(wb, `proyeksi-pendapatan-${scope.replace(" ", "-")}-${tahun}.xlsx`);
  };

  const topRankByJenis = useMemo(() => {
    const typeConfigs: Array<{
      key: "rawat jalan" | "rawat inap";
      label: string;
      color: string;
      accent: string;
      icon: "crown" | "award";
    }> = [
      { key: "rawat jalan", label: "Rawat Jalan", color: "bg-indigo-50", accent: "text-indigo-700", icon: "crown" },
      { key: "rawat inap", label: "Rawat Inap", color: "bg-emerald-50", accent: "text-emerald-700", icon: "award" },
    ];

    return typeConfigs.map((config) => {
      const candidates = rows
        .filter(r => normalizeJenis(r.jenis) === config.key)
        .sort((a, b) => (b.prognosa_total_pendapatan || 0) - (a.prognosa_total_pendapatan || 0))
        .slice(0, 3);
      return { ...config, items: candidates };
    });
  }, [rows]);

  const renderRankIcon = (icon: "crown" | "award", className: string) => {
    if (icon === "crown") return <Crown className={className} />;
    return <Award className={className} />;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="space-y-1">
          <CardTitle>Proyeksi Pendapatan Layanan</CardTitle>
          <p className="text-sm text-muted-foreground">Proyeksikan pendapatan berbasis analisis data</p>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-end gap-4">
            <div>
              <div className="text-sm mb-1">Prosentase Kunjungan</div>
              <div className="flex items-center gap-2">
                <Input type="number" step="1" value={persenKunjungan} onChange={(e) => setPersenKunjungan(parseFloat(e.target.value || "0"))} className="w-32" />
                <Badge variant="secondary">% (otomatis dikonversi)</Badge>
              </div>
            </div>
            <div>
              <div className="text-sm mb-1">Prosentase Hari Rawat</div>
              <div className="flex items-center gap-2">
                <Input type="number" step="1" value={persenHariRawat} onChange={(e) => setPersenHariRawat(parseFloat(e.target.value || "0"))} className="w-32" />
                <Badge variant="secondary">% (otomatis dikonversi)</Badge>
              </div>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <Activity className="h-8 w-8 text-teal-600" />
                <div>
                  <div className="text-sm text-muted-foreground">Total Unit</div>
                  <div className="text-2xl font-bold">{filteredRows.length}</div>
                </div>
              </CardContent>
            </Card>
            {topRankByJenis.map(({ key, label, color, accent, icon, items }) => (
              <Card key={key} className={`${color} border-0 shadow-sm`}>
                <CardContent className="p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className={`flex items-center gap-2 font-semibold ${accent}`}>
                      {renderRankIcon(icon, "h-5 w-5")}
                      <span>{key === "rawat jalan" ? "TOP Rawat Jalan" : "TOP Rawat Inap"}</span>
                    </div>
                    <Sparkles className={`${accent} h-5 w-5`} />
                  </div>
                  <div className="space-y-3">
                    {items.length > 0 ? (
                      items.map((item) => (
                        <div key={item.kode_unit_kerja} className="flex items-start justify-between gap-3">
                          <div className="text-base font-semibold text-gray-700 leading-snug">
                            {item.nama_unit_kerja}
                          </div>
                          <div className="text-sm font-bold text-gray-700">
                            {new Intl.NumberFormat('id-ID',{style:'currency',currency:'IDR',maximumFractionDigits:0}).format(item.prognosa_total_pendapatan || 0)}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-sm text-gray-500">Belum ada data untuk {label.toLowerCase()}.</div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <TrendingUp className="h-8 w-8 text-blue-600" />
                <div>
                  <div className="text-sm text-muted-foreground">Total Prognosa</div>
                  <div className="text-3xl font-bold text-blue-600">{new Intl.NumberFormat('id-ID',{style:'currency',currency:'IDR',maximumFractionDigits:0}).format(totalPrognosa)}</div>
                  <div className="text-xs text-muted-foreground">100%</div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <LineChart className="h-8 w-8 text-emerald-600" />
                <div>
                  <div className="text-sm text-muted-foreground">Prognosa Rawat Jalan</div>
                  <div className="text-2xl font-bold">{new Intl.NumberFormat('id-ID',{style:'currency',currency:'IDR',maximumFractionDigits:0}).format(totalPrognosaRJ)}</div>
                  <div className="text-xs text-muted-foreground">{percent(totalPrognosaRJ, totalPrognosa)}%</div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <LineChart className="h-8 w-8 text-indigo-600" />
                <div>
                  <div className="text-sm text-muted-foreground">Prognosa Rawat Inap</div>
                  <div className="text-2xl font-bold">{new Intl.NumberFormat('id-ID',{style:'currency',currency:'IDR',maximumFractionDigits:0}).format(totalPrognosaRI)}</div>
                  <div className="text-xs text-muted-foreground">{percent(totalPrognosaRI, totalPrognosa)}%</div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="mt-6 flex flex-wrap items-end gap-3">
            <Select value={tahun.toString()} onValueChange={(v) => setTahun(parseInt(v))}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Tahun" />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(y => (
                  <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedJenis} onValueChange={setSelectedJenis}>
              <SelectTrigger className="w-44">
                <SelectValue placeholder="Jenis Unit" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Jenis</SelectItem>
                <SelectItem value="rawat jalan">Rawat Jalan</SelectItem>
                <SelectItem value="rawat inap">Rawat Inap</SelectItem>
                <SelectItem value="penunjang">Penunjang</SelectItem>
              </SelectContent>
            </Select>

            <Select value={selectedUnit} onValueChange={setSelectedUnit}>
              <SelectTrigger className="w-64">
                <SelectValue placeholder="Unit Kerja" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Unit</SelectItem>
                {unitOptions.filter(u=>u.kategori === "Pusat Pendapatan").map(u => (
                  <SelectItem key={u.id} value={u.kode}>{u.kode} - {u.nama}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <DropdownMenu open={isDownloadOpen} onOpenChange={setIsDownloadOpen}>
              <DropdownMenuTrigger asChild>
                <Button className="bg-red-600 hover:bg-red-700 text-white">
                  Unduh Laporan
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                <DropdownMenuItem
                  onClick={() => {
                    downloadExcel("all");
                    setIsDownloadOpen(false);
                  }}
                >
                  Unduh Keseluruhan
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    downloadExcel("rawat inap");
                    setIsDownloadOpen(false);
                  }}
                >
                  Unduh Rawat Inap
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    downloadExcel("rawat jalan");
                    setIsDownloadOpen(false);
                  }}
                >
                  Unduh Rawat Jalan
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button
              variant="ghost"
              className="h-11 w-11 flex items-center justify-center text-blue-600 hover:text-blue-700 hover:bg-blue-50"
              onClick={handleRefreshFromSource}
            >
              <RefreshCcw className="h-5 w-5" />
            </Button>
          </div>

          <div className="mt-4">
            <Table className="text-xs">
              <TableHeader>
                <TableRow className="bg-emerald-600 text-white">
                  <TableHead className="text-white">Unit</TableHead>
                  <TableHead className="text-right text-white">Kunj (Hist)</TableHead>
                  <TableHead className="text-right text-white">Hari (Hist)</TableHead>
                  <TableHead className="text-right text-white">Proy Kunj</TableHead>
                  <TableHead className="text-right text-white">Proy Hari</TableHead>
                  <TableHead className="text-right hidden lg:table-cell text-white">Avg/Kunj</TableHead>
                  <TableHead className="text-right hidden lg:table-cell text-white">Avg/Hari</TableHead>
                  <TableHead className="text-right text-white">Prog RJ</TableHead>
                  <TableHead className="text-right text-white">Prog RI</TableHead>
                  <TableHead className="text-right text-white">Total</TableHead>
                  <TableHead className="text-right hidden md:table-cell text-white">Bulanan RJ</TableHead>
                  <TableHead className="text-right hidden md:table-cell text-white">Bulanan RI</TableHead>
                  <TableHead className="text-right hidden md:table-cell text-white">Bulanan Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRows.map((r) => (
                  <TableRow key={r.kode_unit_kerja}>
                    <TableCell className="font-medium">{r.nama_unit_kerja}</TableCell>
                    <TableCell className="text-right">{r.total_kunjungan_historis.toLocaleString()}</TableCell>
                    <TableCell className="text-right">{r.total_hari_rawat_historis.toLocaleString()}</TableCell>
                    <TableCell className="text-right">{r.proyeksi_kunjungan.toLocaleString()}</TableCell>
                    <TableCell className="text-right">{r.proyeksi_hari_rawat.toLocaleString()}</TableCell>
                    <TableCell className="text-right hidden lg:table-cell">{new Intl.NumberFormat('id-ID',{style:'currency',currency:'IDR',maximumFractionDigits:0}).format(r.avg_pendapatan_per_kunjungan)}</TableCell>
                    <TableCell className="text-right hidden lg:table-cell">{new Intl.NumberFormat('id-ID',{style:'currency',currency:'IDR',maximumFractionDigits:0}).format(r.avg_pendapatan_per_hari_rawat)}</TableCell>
                    <TableCell className="text-right">{new Intl.NumberFormat('id-ID',{style:'currency',currency:'IDR',maximumFractionDigits:0}).format(r.prognosa_pendapatan_rawat_jalan)}</TableCell>
                    <TableCell className="text-right">{new Intl.NumberFormat('id-ID',{style:'currency',currency:'IDR',maximumFractionDigits:0}).format(r.prognosa_pendapatan_rawat_inap)}</TableCell>
                    <TableCell className="text-right">{new Intl.NumberFormat('id-ID',{style:'currency',currency:'IDR',maximumFractionDigits:0}).format(r.prognosa_total_pendapatan)}</TableCell>
                    <TableCell className="text-right hidden md:table-cell">{new Intl.NumberFormat('id-ID',{style:'currency',currency:'IDR',maximumFractionDigits:0}).format(r.breakdown_bulanan_rawat_jalan)}</TableCell>
                    <TableCell className="text-right hidden md:table-cell">{new Intl.NumberFormat('id-ID',{style:'currency',currency:'IDR',maximumFractionDigits:0}).format(r.breakdown_bulanan_rawat_inap)}</TableCell>
                    <TableCell className="text-right hidden md:table-cell">{new Intl.NumberFormat('id-ID',{style:'currency',currency:'IDR',maximumFractionDigits:0}).format(r.breakdown_bulanan_total)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProyeksiPendapatanLayanan;


