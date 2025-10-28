import React, { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { LineChart, Activity, TrendingUp } from "lucide-react";
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

const ProyeksiPendapatanLayanan: React.FC = () => {
  const [tahun, setTahun] = useState<number>(new Date().getFullYear());
  const [unitOptions, setUnitOptions] = useState<UnitOption[]>([]);
  const [selectedUnit, setSelectedUnit] = useState<string>("all");
  const [selectedJenis, setSelectedJenis] = useState<string>("all");
  const [rows, setRows] = useState<RowData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [persenKunjungan, setPersenKunjungan] = useState<number>(10); // input dalam persen, contoh 10 = 10%
  const [persenHariRawat, setPersenHariRawat] = useState<number>(10); // input dalam persen, contoh 10 = 10%

  const normalizeJenis = (val: unknown): string => {
    if (typeof val === 'number') {
      return val === 1 ? 'rawat jalan' : val === 2 ? 'rawat inap' : val === 3 ? 'operatif' : 'non layanan';
    }
    if (typeof val === 'string') return val.toLowerCase();
    return '';
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      try {
        // Cek data proyeksi di DB dulu agar sinkron
        const { data: proyeksi } = await supabase
          .from("proyeksi_pendapatan")
          .select("*")
          .eq("tahun", tahun);

        if ((proyeksi || []).length > 0) {
          const mapped: RowData[] = (proyeksi as any[]).map((r: any) => ({
            id: r.id,
            unit_kerja_id: r.unit_kerja_id,
            jenis: normalizeJenis(r.jenis),
            kode_unit_kerja: r.kode_unit_kerja,
            nama_unit_kerja: r.nama_unit_kerja,
            tahun: r.tahun,
            total_kunjungan_historis: r.total_kunjungan_historis || 0,
            total_hari_rawat_historis: r.total_hari_rawat_historis || 0,
            persentase_kunjungan: r.persentase_kunjungan || 0,
            persentase_hari_rawat: r.persentase_hari_rawat || 0,
            proyeksi_kunjungan: r.proyeksi_kunjungan || 0,
            proyeksi_hari_rawat: r.proyeksi_hari_rawat || 0,
            avg_pendapatan_per_kunjungan: r.avg_pendapatan_per_kunjungan || 0,
            avg_pendapatan_per_hari_rawat: r.avg_pendapatan_per_hari_rawat || 0,
            prognosa_pendapatan_rawat_jalan: r.prognosa_pendapatan_rawat_jalan || 0,
            prognosa_pendapatan_rawat_inap: r.prognosa_pendapatan_rawat_inap || 0,
            prognosa_total_pendapatan: r.prognosa_total_pendapatan || 0,
            breakdown_bulanan_rawat_jalan: r.breakdown_bulanan_rawat_jalan || 0,
            breakdown_bulanan_rawat_inap: r.breakdown_bulanan_rawat_inap || 0,
            breakdown_bulanan_total: r.breakdown_bulanan_total || 0,
            pendapatan_rj_hist: normalizeJenis(r.jenis) === 'rawat jalan' ? Math.round((r.total_kunjungan_historis||0) * (r.avg_pendapatan_per_kunjungan||0)) : 0,
            pendapatan_ri_hist: normalizeJenis(r.jenis) === 'rawat inap' ? Math.round((r.total_hari_rawat_historis||0) * (r.avg_pendapatan_per_hari_rawat||0)) : 0,
          }));
          setRows(mapped);
          return; // skip kalkulasi lokal bila data DB sudah ada
        }
        const { data: units } = await supabase
          .from("unit_kerja")
          .select("id, kode, nama, kategori, jenis");
        const unitsList: UnitOption[] = (units || []).map((u: any) => ({ id: u.id, kode: u.kode, nama: u.nama, kategori: u.kategori, jenis: normalizeJenis(u.jenis) }));
        setUnitOptions(unitsList);

        const { data: kegiatan } = await supabase
          .from("data_kegiatan")
          .select("\"Kode_UK\", tahun, \"Total_Kunjungan_Pasien\", \"Jumlah_Hari_Rawat\"")
          .eq("tahun", tahun);

        const { data: pendapatan } = await supabase
          .from("data_pendapatan")
          .select("total_pendapatan, tahun, unit_kerja(kode)")
          .eq("tahun", tahun);

        const kunjunganMap = new Map<string, { kunjungan: number; hari: number }>();
        (kegiatan || []).forEach((k: any) => {
          kunjunganMap.set(k["Kode_UK"], {
            kunjungan: (kunjunganMap.get(k["Kode_UK"])?.kunjungan || 0) + (k["Total_Kunjungan_Pasien"] || 0),
            hari: (kunjunganMap.get(k["Kode_UK"])?.hari || 0) + (k["Jumlah_Hari_Rawat"] || 0),
          });
        });

        const pendapatanMap = new Map<string, number>();
        (pendapatan || []).forEach((p: any) => {
          const kode = p.unit_kerja?.kode;
          if (!kode) return;
          pendapatanMap.set(kode, (pendapatanMap.get(kode) || 0) + (p.total_pendapatan || 0));
        });

        const merged: RowData[] = unitsList
          .filter(u => u.kategori === "Pusat Pendapatan")
          .map(u => {
            const agg = kunjunganMap.get(u.kode) || { kunjungan: 0, hari: 0 };
            const pend = pendapatanMap.get(u.kode) || 0;
            const avgPerKunjungan = agg.kunjungan > 0 ? pend / agg.kunjungan : 0;
            const avgPerHariRawat = agg.hari > 0 ? pend / agg.hari : 0;
            // konversi persen (input) ke desimal untuk perhitungan
            const pKunj = (Number(persenKunjungan) || 0) / 100;
            const pHari = (Number(persenHariRawat) || 0) / 100;
            return {
              tahun,
              unit_kerja_id: u.id,
              jenis: normalizeJenis(u.jenis) || normalizeJenis(u.kategori),
              kode_unit_kerja: u.kode,
              nama_unit_kerja: u.nama,
              total_kunjungan_historis: agg.kunjungan,
              total_hari_rawat_historis: agg.hari,
              // simpan ke baris dalam bentuk desimal sesuai skema DB
              persentase_kunjungan: pKunj,
              persentase_hari_rawat: pHari,
              proyeksi_kunjungan: Math.round((1 + pKunj) * agg.kunjungan),
              proyeksi_hari_rawat: Math.round((1 + pHari) * agg.hari),
              avg_pendapatan_per_kunjungan: Math.round(avgPerKunjungan),
              avg_pendapatan_per_hari_rawat: Math.round(avgPerHariRawat),
              // Prognosa: RJ hanya untuk jenis rawat jalan, RI hanya untuk rawat inap
              prognosa_pendapatan_rawat_jalan: (normalizeJenis(u.jenis) === 'rawat jalan') ? Math.round(((1 + pKunj) * agg.kunjungan) * avgPerKunjungan) : 0,
              prognosa_pendapatan_rawat_inap: (normalizeJenis(u.jenis) === 'rawat inap') ? Math.round(((1 + pHari) * agg.hari) * avgPerHariRawat) : 0,
              prognosa_total_pendapatan: 0,
              breakdown_bulanan_rawat_jalan: 0,
              breakdown_bulanan_rawat_inap: 0,
              breakdown_bulanan_total: 0,
              // Pendapatan historis per jenis (poin 3-4)
              pendapatan_rj_hist: normalizeJenis(u.jenis) === 'rawat jalan' ? Math.round(agg.kunjungan * avgPerKunjungan) : 0,
              pendapatan_ri_hist: normalizeJenis(u.jenis) === 'rawat inap' ? Math.round(agg.hari * avgPerHariRawat) : 0,
            };
          });

        merged.forEach(m => {
          m.prognosa_total_pendapatan = m.prognosa_pendapatan_rawat_jalan + m.prognosa_pendapatan_rawat_inap;
          m.breakdown_bulanan_rawat_jalan = Math.round(m.prognosa_pendapatan_rawat_jalan / 12);
          m.breakdown_bulanan_rawat_inap = Math.round(m.prognosa_pendapatan_rawat_inap / 12);
          m.breakdown_bulanan_total = Math.round(m.prognosa_total_pendapatan / 12);
        });

        setRows(merged);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [tahun, persenKunjungan, persenHariRawat]);

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

  const handleSave = async () => {
    // upsert berdasarkan (kode_unit_kerja, tahun)
    const payload = filteredRows.map(r => ({ ...r }));
    // insert; bila unique constraint, lakukan update
    for (const row of payload) {
      await supabase.from("proyeksi_pendapatan").upsert(row as any, { onConflict: "kode_unit_kerja,tahun" as any });
    }
  };

  const handleRefreshFromSource = async () => {
    setLoading(true);
    try {
      // Convert percentage to decimal for RPC call
      const pKunj = (Number(persenKunjungan) || 0) / 100;
      const pHari = (Number(persenHariRawat) || 0) / 100;
      
      // First, update the percentages in the database
      await supabase
        .from("proyeksi_pendapatan")
        .update({
          persentase_kunjungan: pKunj,
          persentase_hari_rawat: pHari
        })
        .eq("tahun", tahun);

      // Then call the RPC function to refresh calculations
      const { error: rpcError } = await supabase.rpc('refresh_proyeksi_pendapatan', { p_tahun: tahun });
      
      if (rpcError) {
        console.error("RPC Error:", rpcError);
        throw new Error(`Gagal refresh data: ${rpcError.message}`);
      }

      // Re-fetch data from the database
      const { data: proyeksi, error: fetchError } = await supabase
        .from('proyeksi_pendapatan')
        .select('*')
        .eq('tahun', tahun);

      if (fetchError) throw fetchError;

      const mapped: RowData[] = (proyeksi || []).map((r: any) => ({
        id: r.id,
        unit_kerja_id: r.unit_kerja_id,
        jenis: normalizeJenis(r.jenis),
        kode_unit_kerja: r.kode_unit_kerja,
        nama_unit_kerja: r.nama_unit_kerja,
        tahun: r.tahun,
        total_kunjungan_historis: r.total_kunjungan_historis || 0,
        total_hari_rawat_historis: r.total_hari_rawat_historis || 0,
        persentase_kunjungan: persenKunjungan, // Display percentage format
        persentase_hari_rawat: persenHariRawat, // Display percentage format
        proyeksi_kunjungan: r.proyeksi_kunjungan || 0,
        proyeksi_hari_rawat: r.proyeksi_hari_rawat || 0,
        avg_pendapatan_per_kunjungan: r.avg_pendapatan_per_kunjungan || 0,
        avg_pendapatan_per_hari_rawat: r.avg_pendapatan_per_hari_rawat || 0,
        prognosa_pendapatan_rawat_jalan: r.prognosa_pendapatan_rawat_jalan || 0,
        prognosa_pendapatan_rawat_inap: r.prognosa_pendapatan_rawat_inap || 0,
        prognosa_total_pendapatan: r.prognosa_total_pendapatan || 0,
        breakdown_bulanan_rawat_jalan: r.breakdown_bulanan_rawat_jalan || 0,
        breakdown_bulanan_rawat_inap: r.breakdown_bulanan_rawat_inap || 0,
        breakdown_bulanan_total: r.breakdown_bulanan_total || 0,
        pendapatan_rj_hist: normalizeJenis(r.jenis) === 'rawat jalan' ? Math.round((r.total_kunjungan_historis||0) * (r.avg_pendapatan_per_kunjungan||0)) : 0,
        pendapatan_ri_hist: normalizeJenis(r.jenis) === 'rawat inap' ? Math.round((r.total_hari_rawat_historis||0) * (r.avg_pendapatan_per_hari_rawat||0)) : 0,
      }));
      setRows(mapped);
    } catch (error) {
      console.error("Error refreshing data:", error);
      alert(`Error: ${error instanceof Error ? error.message : 'Gagal refresh data'}`);
    } finally {
      setLoading(false);
    }
  };

  const downloadExcel = () => {
    const rows = filteredRows.map(r => ({
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
    XLSX.utils.book_append_sheet(wb, ws, `Proyeksi_${tahun}`);
    XLSX.writeFile(wb, `proyeksi-pendapatan-${tahun}.xlsx`);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Proyeksi Pendapatan Layanan</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3 flex-wrap items-end">
            <div>
              <div className="text-sm mb-1">Tahun</div>
              <Select value={tahun.toString()} onValueChange={(v) => setTahun(parseInt(v))}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(y => (
                    <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <div className="text-sm mb-1">Jenis Unit</div>
              <Select value={selectedJenis} onValueChange={setSelectedJenis}>
                <SelectTrigger className="w-56">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Jenis</SelectItem>
                  <SelectItem value="rawat jalan">Rawat Jalan</SelectItem>
                  <SelectItem value="rawat inap">Rawat Inap</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <div className="text-sm mb-1">Unit Kerja</div>
              <Select value={selectedUnit} onValueChange={setSelectedUnit}>
                <SelectTrigger className="w-72">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Unit</SelectItem>
                  {unitOptions.filter(u=>u.kategori === "Pusat Pendapatan").map(u => (
                    <SelectItem key={u.id} value={u.kode}>{u.kode} - {u.nama}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
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
            <div className="ml-auto">
              <div className="flex gap-2">
                <Button className="bg-green-600 hover:bg-green-700 text-white" onClick={downloadExcel}>Unduh Laporan</Button>
                <Button variant="outline" onClick={handleRefreshFromSource}>Refresh Data</Button>
                <Button onClick={handleSave}>Simpan Proyeksi</Button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <Activity className="h-8 w-8 text-teal-600" />
                <div>
                  <div className="text-sm text-muted-foreground">Total Unit</div>
                  <div className="text-2xl font-bold">{filteredRows.length}</div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <TrendingUp className="h-8 w-8 text-blue-600" />
                <div>
                  <div className="text-sm text-muted-foreground">Total Prognosa</div>
                  <div className="text-2xl font-bold text-blue-600">{new Intl.NumberFormat('id-ID',{style:'currency',currency:'IDR',maximumFractionDigits:0}).format(totalPrognosa)}</div>
                  <div className="text-xs text-muted-foreground">100%</div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <LineChart className="h-8 w-8 text-emerald-600" />
                <div>
                  <div className="text-sm text-muted-foreground">Prognosa RJ</div>
                  <div className="text-xl font-bold">{new Intl.NumberFormat('id-ID',{style:'currency',currency:'IDR',maximumFractionDigits:0}).format(totalPrognosaRJ)}</div>
                  <div className="text-xs text-muted-foreground">{percent(totalPrognosaRJ, totalPrognosa)}%</div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <LineChart className="h-8 w-8 text-indigo-600" />
                <div>
                  <div className="text-sm text-muted-foreground">Prognosa RI</div>
                  <div className="text-xl font-bold">{new Intl.NumberFormat('id-ID',{style:'currency',currency:'IDR',maximumFractionDigits:0}).format(totalPrognosaRI)}</div>
                  <div className="text-xs text-muted-foreground">{percent(totalPrognosaRI, totalPrognosa)}%</div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="mt-6">
            <Table className="text-xs">
              <TableHeader>
                <TableRow>
                  <TableHead>Unit</TableHead>
                  <TableHead className="text-right">Kunj (Hist)</TableHead>
                  <TableHead className="text-right">Hari (Hist)</TableHead>
                  <TableHead className="text-right">Proy Kunj</TableHead>
                  <TableHead className="text-right">Proy Hari</TableHead>
                  <TableHead className="text-right hidden lg:table-cell">Avg/Kunj</TableHead>
                  <TableHead className="text-right hidden lg:table-cell">Avg/Hari</TableHead>
                  <TableHead className="text-right">Prog RJ</TableHead>
                  <TableHead className="text-right">Prog RI</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right hidden md:table-cell">Bulanan RJ</TableHead>
                  <TableHead className="text-right hidden md:table-cell">Bulanan RI</TableHead>
                  <TableHead className="text-right hidden md:table-cell">Bulanan Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRows.map((r) => (
                  <TableRow key={r.kode_unit_kerja}>
                    <TableCell className="font-medium">{r.kode_unit_kerja} - {r.nama_unit_kerja}</TableCell>
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


