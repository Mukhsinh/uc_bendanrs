import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Download, RefreshCw, Settings2, Filter, FileText } from "lucide-react";
import * as XLSX from "xlsx";

type DistribusiKeduaRow = {
  id: string;
  tahun?: number | null;
  unit_kerja_pusat_biaya?: string | null;
  biaya_alokasi_i?: number | null;
  dasar_alokasi?: string | null;
  keterangan?: string | null;
  total_alokasi_i?: number | null;
  audit_check?: string | null;
  total_alokasi_biaya_kedua?: number | null;
  updated_at?: string | null;
  [key: string]: any;
};

const getColumnName = (i: number): string => {
  const ukCode = `uk${i.toString().padStart(3, '0')}`;
  const suffixes = [
    '_direktur', '_komite_ppi', '_komite_pmkp', '_komite_medik', '_akreditasi', '_dewan_pengawas',
    '_bid_pengembangan_dan_penunjang_pelayanan', '_seksi_penunjang_non_medis_dan_pengembangan_penunjang_pela',
    '_ipsrs_medis_dan_non_medis', '_seksi_penunjang_pelayanan_medis', '_bid_keperawatan',
    '_seksi_asuhan_pelayanan_keperawatan', '_seksi_pengembangan_dan_etika_keperawatan', '_bid_pelayanan_medis',
    '_seksi_pengembangan_pelayanan_medis', '_seksi_pelayanan_medis_dan_rekam_medis', '_tpprj', '_tppri',
    '_bag_tata_usaha', '_subag_keuangan', '_unit_perbendaharaan', '_unit_pendapatan',
    '_unit_akuntansi_dan_verifikasi', '_unit_akuntansi_manajemen', '_analis_biaya_dan_kasir',
    '_subag_umpeg', '_staf_umum_dan_kepegawaian', '_unit_it', '_rumah_tangga', '_cleaning_service',
    '_security', '_unit_aset', '_instalasi_humas_komplain', '_subag_renval', '_staf_renval',
    '_rekam_medik', '_ambulance', '_laboratorium_pk_pa', '_radiologi', '_farmasi', '_rehab_medik',
    '_gizi_dapur', '_laundry_cssd', '_bdrs', '_cathlab', '_terang_bulan_vip_vvip', '_truntum',
    '_sekarjagat', '_jlamprang', '_nifas', '_perinatologi', '_buketan', '_icu_picu_nicu', '_vk',
    '_igd_ponek', '_klinik_kebid_kandungan', '_klinik_bedah_mulut', '_klinik_syaraf',
    '_klinik_bedah_syaraf', '_klinik_bedah_digestif', '_klinik_bedah_umum', '_klinik_anak',
    '_klinik_penyakit_dalam', '_klinik_mata', '_klinik_kulit_kelamin', '_klinik_tht', '_klinik_gigi',
    '_klinik_jantung', '_klinik_dot_vct_cst', '_klinik_paru', '_klinik_orthopedi', '_klinik_jiwa',
    '_klinik_parikesit', '_ibs', '_pemulasaran_jenazah', '_hemodialisis', '_unit_diklat'
  ];
  return ukCode + suffixes[i - 1];
};

export default function DistribusiBiayaKedua() {
  const [rows, setRows] = useState<DistribusiKeduaRow[]>([]);
  const [filteredRows, setFilteredRows] = useState<DistribusiKeduaRow[]>([]);
  const [tahun, setTahun] = useState<number>(2025);
  const [selectedUnitKerja, setSelectedUnitKerja] = useState<string>("");
  const [unitKerjaOptions, setUnitKerjaOptions] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const { toast } = useToast();

  console.log('DistribusiBiayaKedua component rendered');

  const totalAlokasiI = useMemo(() => filteredRows.reduce((s, r) => s + (r.total_alokasi_i ?? 0), 0), [filteredRows]);
  const columnTotals = useMemo(() => {
    const totals: Record<string, number> = {};
    for (let i = 37; i <= 77; i++) {
      const col = getColumnName(i);
      totals[col] = 0;
    }
    filteredRows.forEach((r) => {
      for (let i = 37; i <= 77; i++) {
        const col = getColumnName(i);
        const val = (r as any)[col] ?? 0;
        totals[col] += val;
      }
    });
    return totals;
  }, [filteredRows]);

  useEffect(() => {
    console.log('useEffect triggered, tahun:', tahun);
    void fetchRows();
  }, [tahun]);

  // Component mounted - fetch data from database
  useEffect(() => {
    console.log('Component mounted, fetching data from database...');
  }, []);

  useEffect(() => {
    // Filter data berdasarkan unit kerja yang dipilih
    if (selectedUnitKerja === "") {
      setFilteredRows(rows);
    } else {
      setFilteredRows(rows.filter(row => row.unit_kerja_pusat_biaya === selectedUnitKerja));
    }
  }, [rows, selectedUnitKerja]);

  const fetchRows = async () => {
    try {
      setLoading(true);
      setError("");
      console.log('Fetching distribusi_biaya_kedua for tahun:', tahun);
      
      // Check current user session
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      console.log('Current user:', user, 'User error:', userError);
      
      // Test Supabase connection first
      const { data: testData, error: testError } = await supabase
        .from("distribusi_biaya_kedua")
        .select("count", { count: 'exact', head: true });
      
      console.log('Supabase connection test:', { testData, testError });
      
      if (testError) {
        console.error('Supabase connection error:', testError);
        throw new Error(`Database connection error: ${testError.message}`);
      }
      
      const { data, error } = await supabase
        .from("distribusi_biaya_kedua")
        .select("*")
        .eq("tahun", tahun)
        .order("unit_kerja_pusat_biaya");

      console.log('Supabase response:', { data, error });

      if (error) {
        console.error('Supabase error:', error);
        throw new Error(`Database query error: ${error.message}`);
      }
      
      const all = (data as any[]) || [];
      console.log('Data received:', all.length, 'records');
      console.log('Sample data:', all[0]);
      
      if (all.length === 0) {
        console.log('No data found for tahun:', tahun);
        setRows([]);
        setUnitKerjaOptions([]);
        toast({
          title: "Info",
          description: `Tidak ada data untuk tahun ${tahun}. Silakan coba tahun lain.`,
        });
        return;
      }
      
      setRows(all as DistribusiKeduaRow[]);

      // Ambil daftar unit kerja untuk filter
      const unitKerjaList = [...new Set(all.map(item => item.unit_kerja_pusat_biaya).filter(Boolean))] as string[];
      console.log('Unit kerja options:', unitKerjaList);
      setUnitKerjaOptions(unitKerjaList);
      
      toast({
        title: "Berhasil",
        description: `Data berhasil dimuat: ${all.length} record`,
      });
    } catch (err: any) {
      console.error('Error in fetchRows:', err);
      setError(err.message || String(err));
      toast({ 
        title: "Gagal memuat data", 
        description: err.message || String(err), 
        variant: "destructive" 
      });
    } finally {
      setLoading(false);
    }
  };

  const exportExcel = async () => {
    try {
      setLoading(true);
      
      if (filteredRows.length === 0) {
        toast({ title: "Tidak ada data", description: "Belum ada data untuk diunduh.", variant: "destructive" });
        return;
      }

      const dataForExport = filteredRows.map((r) => {
        const ukColumns = Array.from({ length: 77 - 37 + 1 }, (_, idx) => [
          `UK${(37 + idx).toString().padStart(3, '0')}`,
          Math.round(((r as any)[getColumnName(37 + idx)] ?? 0))
        ]);

        return {
          "Unit Kerja (Pusat Biaya)": r.unit_kerja_pusat_biaya || "",
          "Biaya Alokasi I": Math.round(r.biaya_alokasi_i ?? 0),
          "Dasar Alokasi": r.dasar_alokasi || "",
          "Keterangan": r.keterangan || "",
          "Total Alokasi I": Math.round(r.total_alokasi_i ?? 0),
          "Audit Check": r.audit_check || "",
          ...Object.fromEntries(ukColumns),
          "Total Alokasi Biaya Kedua": Math.round(r.total_alokasi_biaya_kedua ?? 0),
          "Tahun": r.tahun ?? tahun,
          "Updated At": r.updated_at || "",
        };
      });

      const ws = XLSX.utils.json_to_sheet(dataForExport);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Distribusi Biaya Kedua");
      
      const fileName = `distribusi_biaya_kedua_${tahun}${selectedUnitKerja ? `_${selectedUnitKerja.replace(/[^a-zA-Z0-9]/g, '_')}` : ''}.xlsx`;
      XLSX.writeFile(wb, fileName);
      
      toast({
        title: "Berhasil",
        description: `Laporan Excel berhasil diunduh dengan ${filteredRows.length} data`,
      });
    } catch (err: any) {
      toast({ title: "Gagal mengunduh", description: err.message || String(err), variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings2 className="h-5 w-5" />
              Distribusi Biaya Kedua
            </CardTitle>
            <CardDescription>
              Pratinjau hasil distribusi biaya tahap kedua (step-down) berdasarkan data tabel `distribusi_biaya_kedua`.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
                <p className="text-muted-foreground">Memuat data...</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings2 className="h-5 w-5" />
            Distribusi Biaya Kedua
          </CardTitle>
          <CardDescription>
            Pratinjau hasil distribusi biaya tahap kedua (step-down) berdasarkan data tabel `distribusi_biaya_kedua`.
            <br />
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="tahun">Tahun</Label>
              <Input id="tahun" type="number" value={tahun} min={2020} max={2035} onChange={(e) => setTahun(parseInt(e.target.value))} />
            </div>
            <div className="flex items-end gap-2">
              <Button variant="outline" disabled={loading} onClick={fetchRows}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="unit-kerja">Filter Unit Kerja</Label>
              <select 
                id="unit-kerja"
                value={selectedUnitKerja} 
                onChange={(e) => setSelectedUnitKerja(e.target.value)}
                className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
              >
                <option value="">Semua Unit Kerja</option>
                {unitKerjaOptions.map((unit) => (
                  <option key={unit} value={unit}>
                    {unit}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" disabled={loading || filteredRows.length === 0} onClick={exportExcel}>
                <Download className="h-4 w-4 mr-2" />
                Unduh Laporan Excel
              </Button>
            </div>
          </div>
          <div className="text-sm text-muted-foreground space-y-1">
            {filteredRows.length !== rows.length && (
              <div>Menampilkan {filteredRows.length} dari {rows.length} data berdasarkan filter</div>
            )}
            <div>Total data tersedia: {rows.length} | Data difilter: {filteredRows.length}</div>
            {rows.length === 0 && !loading && (
              <div className="text-orange-600 bg-orange-50 p-3 rounded-md">
                ⚠️ Tidak ada data di database untuk tahun {tahun}. 
                <br />
                Data tersedia untuk tahun 2025. 
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setTahun(2025)}
                  className="ml-2"
                >
                  Reset ke 2025
                </Button>
              </div>
            )}
            {rows.length > 0 && (
              <div className="text-green-600 bg-green-50 p-3 rounded-md">
                ✅ Berhasil memuat {rows.length} data dari database untuk tahun {tahun}
              </div>
            )}
            {error && (
              <div className="text-red-600 bg-red-50 p-2 rounded">
                ❌ Error: {error}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Tabel Distribusi Biaya Kedua</CardTitle>
          <CardDescription>Data dari tabel `distribusi_biaya_kedua`</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[200px]">Unit Kerja (Pusat Biaya)</TableHead>
                  <TableHead className="min-w-[140px] text-right">Biaya Alokasi I</TableHead>
                  <TableHead className="min-w-[120px]">Dasar Alokasi</TableHead>
                  <TableHead className="min-w-[120px]">Status</TableHead>
                  {Array.from({ length: 77 - 37 + 1 }, (_, idx) => {
                    const ukCode = `UK${(37 + idx).toString().padStart(3, '0')}`;
                    return (
                      <TableHead key={ukCode} className="text-right min-w-[110px]">{ukCode}</TableHead>
                    );
                  })}
                  <TableHead className="min-w-[140px] text-right">Total Alokasi Biaya Kedua</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRows.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{r.unit_kerja_pusat_biaya}</TableCell>
                    <TableCell className="text-right">{(r.biaya_alokasi_i ?? 0).toLocaleString("id-ID")}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{r.dasar_alokasi || '-'}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={r.audit_check === 'OK' ? 'default' : 'destructive'}>
                        {r.audit_check || 'Unknown'}
                      </Badge>
                    </TableCell>
                    {Array.from({ length: 77 - 37 + 1 }, (_, idx) => {
                      const col = getColumnName(37 + idx);
                      const val = (r as any)[col] ?? 0;
                      return (
                        <TableCell key={col} className="text-right">{Math.round(val).toLocaleString("id-ID")}</TableCell>
                      );
                    })}
                    <TableCell className="text-right font-medium">{(r.total_alokasi_biaya_kedua ?? 0).toLocaleString("id-ID")}</TableCell>
                  </TableRow>
                ))}
                {filteredRows.length === 0 && !loading && (
                  <TableRow>
                    <TableCell colSpan={77 - 37 + 5} className="text-center py-8 text-muted-foreground">
                      <div className="flex flex-col items-center gap-2">
                        <FileText className="h-8 w-8 text-muted-foreground" />
                        <p>Tidak ada data untuk ditampilkan</p>
                        <p className="text-sm">Periksa filter tahun ({tahun}) atau unit kerja yang dipilih</p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
                <TableRow className="bg-gray-50 border-t-2 border-gray-300">
                  <TableCell className="font-semibold">Total</TableCell>
                  <TableCell className="text-right font-semibold">{filteredRows.reduce((sum, r) => sum + (r.biaya_alokasi_i ?? 0), 0).toLocaleString("id-ID")}</TableCell>
                  <TableCell />
                  <TableCell />
                  {Array.from({ length: 77 - 37 + 1 }, (_, idx) => {
                    const col = getColumnName(37 + idx);
                    const total = columnTotals[col] ?? 0;
                    return (
                      <TableCell key={col} className="text-right font-semibold">{Math.round(total).toLocaleString("id-ID")}</TableCell>
                    );
                  })}
                  <TableCell className="text-right font-semibold">{filteredRows.reduce((sum, r) => sum + (r.total_alokasi_biaya_kedua ?? 0), 0).toLocaleString("id-ID")}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


