import React, { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { useReportDownload } from "@/components/report";

interface UnitOption {
  id: string;
  kode: string;
  nama: string;
}

interface AggregatedRow {
  unitId: string;
  kode: string;
  nama: string;
  alokasiPertama: number;
  alokasiKedua: number;
  btlTidakLangsung: number;
  btlTotal: number;
}

interface UpdateResponse {
  success?: boolean;
  message?: string;
  user_id?: string;
  userId?: string;
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value || 0);

const toNumber = (value: any): number => {
  if (value === null || value === undefined) return 0;
  const numeric = Number.parseFloat(typeof value === "string" ? value.replace(/,/g, "") : value);
  return Number.isFinite(numeric) ? numeric : 0;
};

const TotalBiayaDenganJP: React.FC = () => {
  const currentYear = new Date().getFullYear();
  const [tahun, setTahun] = useState<number>(currentYear);
  const [unitOptions, setUnitOptions] = useState<UnitOption[]>([]);
  const [unitFilter, setUnitFilter] = useState<string>("all");
  const [rows, setRows] = useState<AggregatedRow[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [downloading, setDownloading] = useState<boolean>(false);
  const { downloadReport } = useReportDownload();

  const loadData = useCallback(
    async (selectedYear: number, opts?: { silent?: boolean }) => {
      const isRefresh = opts?.silent === true;
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      try {
        const { data, error } = await supabase.rpc("api_total_biaya_dengan_jp", {
          p_tahun: selectedYear,
        });

        if (error) {
          console.error("Gagal memuat data Total Biaya dengan JP:", error);
          toast.error(`Gagal memuat data Total Biaya dengan JP: ${error.message}`);
          setRows([]);
          setUnitOptions([]);
          return;
        }

        const rpcRows = (data as any[]) || [];

        const unitList: UnitOption[] = rpcRows
          .map((row) => ({
            id: row.unit_id,
            kode: row.unit_kode,
            nama: row.unit_nama,
          }))
          .sort((a, b) => a.kode.localeCompare(b.kode));
        setUnitOptions(unitList);

        const aggregatedRows: AggregatedRow[] = rpcRows.map((row) => ({
          unitId: row.unit_id,
          kode: row.unit_kode,
          nama: row.unit_nama,
          alokasiPertama: toNumber(row.alokasi_biaya_pertama),
          alokasiKedua: toNumber(row.alokasi_biaya_kedua),
          btlTidakLangsung: toNumber(row.btl_biaya_tidak_langsung),
          btlTotal: toNumber(row.btl_total_biaya),
        }));

        aggregatedRows.sort((a, b) => a.kode.localeCompare(b.kode));

        setRows(aggregatedRows);
      } catch (error) {
        console.error("Terjadi kesalahan saat memuat Total Biaya dengan JP:", error);
        toast.error("Terjadi kesalahan saat memuat data Total Biaya dengan JP.");
      } finally {
        if (isRefresh) {
          setRefreshing(false);
        } else {
          setLoading(false);
        }
      }
    },
    [],
  );

  useEffect(() => {
    loadData(tahun);
  }, [loadData, tahun]);

  useEffect(() => {
    if (unitFilter !== "all" && !unitOptions.some((unit) => unit.id === unitFilter)) {
      setUnitFilter("all");
    }
  }, [unitOptions, unitFilter]);

  const filteredRows = useMemo(() => {
    if (unitFilter === "all") return rows;
    return rows.filter((row) => row.unitId === unitFilter);
  }, [rows, unitFilter]);

  const summaryTotals = useMemo(() => {
    return filteredRows.reduce(
      (acc, row) => {
        acc.alokasiPertama += row.alokasiPertama;
        acc.alokasiKedua += row.alokasiKedua;
        acc.btlTidakLangsung += row.btlTidakLangsung;
        acc.btlTotal += row.btlTotal;
        return acc;
      },
      {
        alokasiPertama: 0,
        alokasiKedua: 0,
        btlTidakLangsung: 0,
        btlTotal: 0,
      },
    );
  }, [filteredRows]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);

    try {
      const { data: tahapPertama, error: errorPertama } = await supabase.rpc("api_update_distribusi_biaya_pertama_dengan_jp", {
        p_tahun: tahun,
      });

      if (errorPertama) {
        throw new Error(errorPertama.message || "Gagal memperbarui Alokasi Biaya Pertama dengan JP.");
      }

      const resultPertama = (tahapPertama as UpdateResponse) ?? {};
      if (!resultPertama.success) {
        throw new Error(resultPertama.message || "Proses alokasi biaya pertama gagal.");
      }

      const userId = resultPertama.user_id ?? resultPertama.userId;
      if (!userId) {
        throw new Error("User ID hasil pembaruan tahap pertama tidak ditemukan.");
      }

      const { data: tahapKedua, error: errorKedua } = await supabase.rpc("recalculate_alokasi_biaya_kedua_dengan_jp", {
        p_tahun: tahun,
      });

      if (errorKedua) {
        throw new Error(errorKedua.message || "Gagal memperbarui Alokasi Biaya Kedua dengan JP.");
      }

      const resultKedua = (tahapKedua as UpdateResponse) ?? {};
      if (resultKedua.success === false) {
        throw new Error(resultKedua.message || "Proses alokasi biaya kedua gagal.");
      }

      const { error: errorBtl } = await supabase.rpc("populate_alokasi_btl_dengan_jp", {
        p_tahun: tahun,
        p_user_id: userId,
      });

      if (errorBtl) {
        throw new Error(errorBtl.message || "Gagal memperbarui Alokasi BTL dengan JP.");
      }

      await loadData(tahun, { silent: true });
      toast.success("Data berhasil diperbarui.");
    } catch (err) {
      console.error("Gagal memperbarui data Total Biaya dengan JP:", err);
      const message = err instanceof Error ? err.message : "Terjadi kesalahan saat memperbarui data.";
      toast.error(message);
    } finally {
      setRefreshing(false);
    }
  }, [loadData, tahun]);

  const handleDownload = useCallback(async () => {
    if (rows.length === 0) {
      toast.info("Tidak ada data yang dapat diunduh.");
      return;
    }

    try {
      setDownloading(true);
      const data = filteredRows.length > 0 ? filteredRows : rows;
      const records = data.map((row) => ({
        "Kode Unit": row.kode,
        "Nama Unit": row.nama,
        "Alokasi Biaya Pertama": row.alokasiPertama,
        "Alokasi Biaya Kedua": row.alokasiKedua,
        "BTL - Biaya Tidak Langsung Terdistribusi": row.btlTidakLangsung,
        "BTL - Total Biaya": row.btlTotal,
      }));

      records.push({
        "Kode Unit": "Total",
        "Nama Unit": "",
        "Alokasi Biaya Pertama": summaryTotals.alokasiPertama,
        "Alokasi Biaya Kedua": summaryTotals.alokasiKedua,
        "BTL - Biaya Tidak Langsung Terdistribusi": summaryTotals.btlTidakLangsung,
        "BTL - Total Biaya": summaryTotals.btlTotal,
      });

      await downloadReport({
        title: "Laporan Total Biaya Dengan JP",
        subtitle: `Tahun ${tahun}`,
        filename: `total_biaya_dengan_jp_${tahun}`,
        filters: {
          "Unit Kerja": unitFilter === "all" ? "Semua" : unitFilter,
        },
        records,
        orientation: "landscape",
      });
    } catch (error) {
      console.error("Gagal mengunduh laporan Total Biaya dengan JP:", error);
      toast.error("Gagal mengunduh laporan Total Biaya dengan JP.");
    } finally {
      setDownloading(false);
    }
  }, [rows, filteredRows, summaryTotals, tahun, unitFilter, downloadReport]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">Total Biaya dengan JP</h1>
        <p className="text-sm text-muted-foreground">Distribusi biaya dengan memperhitungkan biaya jasa pelayanan.</p>
      </div>

      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Tahun</label>
              <Select value={tahun.toString()} onValueChange={(value) => setTahun(parseInt(value, 10))}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih tahun" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 7 }, (_, index) => {
                    const year = currentYear - index;
                    return (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-2">
              <label className="text-sm font-medium mb-2 block">Unit Kerja</label>
              <Select value={unitFilter} onValueChange={setUnitFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih unit kerja" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Unit (Pusat Pendapatan)</SelectItem>
                  {unitOptions.map((unit) => (
                    <SelectItem key={unit.id} value={unit.id}>
                      {unit.kode} - {unit.nama}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              onClick={() => {
                void handleDownload();
              }}
              disabled={downloading || loading || rows.length === 0}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              <Download className="h-4 w-4 mr-2" />
              {downloading ? "Menyiapkan…" : "Unduh Laporan"}
            </Button>
            <Button
              onClick={handleRefresh}
              disabled={loading || refreshing}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
              {refreshing ? "Memperbarui…" : "Perbarui Data"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          {loading ? (
            <div className="h-64 flex items-center justify-center text-sm text-muted-foreground">Memuat data…</div>
          ) : filteredRows.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-sm text-muted-foreground">Tidak ada data untuk filter yang dipilih.</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-teal-600">
                    <TableHead className="w-[220px] text-white">Unit Kerja</TableHead>
                    <TableHead className="text-right text-white">Alokasi Biaya Pertama</TableHead>
                    <TableHead className="text-right text-white">Alokasi Biaya Kedua</TableHead>
                    <TableHead className="text-right text-white">BTL - Biaya Tidak Langsung Terdistribusi</TableHead>
                    <TableHead className="text-right text-white">BTL - Total Biaya</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRows.map((row) => (
                    <TableRow key={row.unitId}>
                      <TableCell>
                        <div className="font-medium">{row.kode}</div>
                        <div className="text-sm text-muted-foreground">{row.nama}</div>
                      </TableCell>
                      <TableCell className="text-right">{formatCurrency(row.alokasiPertama)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(row.alokasiKedua)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(row.btlTidakLangsung)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(row.btlTotal)}</TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="bg-muted/30 font-semibold">
                    <TableCell>Total</TableCell>
                    <TableCell className="text-right">{formatCurrency(summaryTotals.alokasiPertama)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(summaryTotals.alokasiKedua)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(summaryTotals.btlTidakLangsung)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(summaryTotals.btlTotal)}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TotalBiayaDenganJP;
