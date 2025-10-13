import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Download, RefreshCw, BarChart3 } from "lucide-react";
import * as XLSX from "xlsx";

type RekapRow = {
  id?: string;
  biaya: string;
  [key: string]: any;
};

const ukSuffixes = [
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

const ukDisplayNames = [
  'Direktur','Komite PPI','Komite PMKP','Komite Medik','Akreditasi','Dewan Pengawas',
  'Bid. Pengembangan & Penunjang Pelayanan','Seksi Penunjang Non Medis & Pengembangan Penunjang Pelayanan',
  'IPSRS Medis & Non Medis','Seksi Penunjang Pelayanan Medis','Bid. Keperawatan',
  'Seksi Asuhan Pelayanan Keperawatan','Seksi Pengembangan & Etika Keperawatan','Bid. Pelayanan Medis',
  'Seksi Pengembangan Pelayanan Medis','Seksi Pelayanan Medis & Rekam Medis','TPPRJ','TPPRI',
  'Bag. Tata Usaha','Subag. Keuangan','Unit Perbendaharaan','Unit Pendapatan',
  'Unit Akuntansi & Verifikasi','Unit Akuntansi Manajemen','Analis Biaya & Kasir',
  'Subag. UMPEG','Staf Umum & Kepegawaian','Unit IT','Rumah Tangga','Cleaning Service',
  'Security','Unit Aset','Instalasi Humas & Komplain','Subag. RENVAL','Staf RENVAL',
  'Rekam Medik','Ambulance','Laboratorium PK/PA','Radiologi','Farmasi','Rehab Medik',
  'Gizi Dapur','Laundry/CSSD','BDRS','Cathlab','Terang Bulan VIP/VVIP','Truntum',
  'Sekarjagat','Jlamprang','Nifas','Perinatologi','Buketan','ICU/PICU/NICU','VK',
  'IGD Ponek','Klinik Kebid. & Kandungan','Klinik Bedah Mulut','Klinik Syaraf',
  'Klinik Bedah Syaraf','Klinik Bedah Digestif','Klinik Bedah Umum','Klinik Anak',
  'Klinik Penyakit Dalam','Klinik Mata','Klinik Kulit & Kelamin','Klinik THT','Klinik Gigi',
  'Klinik Jantung','Klinik DOT/VCT/CST','Klinik Paru','Klinik Orthopedi','Klinik Jiwa',
  'Klinik Parikesit','IBS','Pemulasaran Jenazah','Hemodialisis','Unit Diklat'
];

const getUkColumnName = (i: number): string => `uk${i.toString().padStart(3, '0')}` + ukSuffixes[i - 1];
const getUkDisplayName = (i: number): string => ukDisplayNames[i - 1] || `UK${i.toString().padStart(3,'0')}`;

export default function DistribusiBiayaRekap() {
  const [rows, setRows] = useState<RekapRow[]>([]);
  const [tahun, setTahun] = useState<number>(new Date().getFullYear());
  const [loading, setLoading] = useState<boolean>(false);
  const { toast } = useToast();
  const [filterNama, setFilterNama] = useState<string>("");

  const rowTotals = useMemo(() => rows.map(r => {
    let sum = 0;
    for (let i = 37; i <= 77; i++) {
      const col = getUkColumnName(i);
      sum += Number((r as any)[col] ?? 0);
    }
    return sum;
  }), [rows]);

  const filteredIndices = useMemo(() => {
    const term = filterNama.trim().toLowerCase();
    const allIdx = Array.from({ length: 41 }, (_, k) => 37 + k);
    if (!term) return allIdx;
    return allIdx.filter(i => getUkDisplayName(i).toLowerCase().includes(term));
  }, [filterNama]);

  useEffect(() => {
    void fetchRows();
  }, [tahun]);

  const fetchRows = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("distribusi_biaya_rekap")
        .select("*")
        .order("urutan");

      if (error) throw error;
      setRows((data as any[]) as RekapRow[]);
    } catch (err: any) {
      toast({ title: "Gagal memuat data", description: err.message || String(err), variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const exportExcel = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("distribusi_biaya_rekap")
        .select("*")
        .order("urutan");
      if (error) throw error;
      const rowsForDownload: RekapRow[] = (data as any[]) as RekapRow[];
      if (rowsForDownload.length === 0) {
        toast({ title: "Tidak ada data", description: "Belum ada data untuk diunduh.", variant: "destructive" });
        return;
      }

      const headers = [
        "Biaya",
        ...Array.from({ length: 77 - 37 + 1 }, (_, idx) => `UK${(37 + idx).toString().padStart(3, '0')}`),
        "Total"
      ];

      const dataForExport = rowsForDownload.map((r) => {
        const values = Array.from({ length: 41 }, (_, idx) => Number(((r as any)[getUkColumnName(37 + idx)] ?? 0)));
        const total = values.reduce((s, v) => s + v, 0);
        return {
          "Biaya": r.biaya || "",
          ...Object.fromEntries(
            Array.from({ length: 41 }, (_, idx) => [
              `UK${(37 + idx).toString().padStart(3, '0')}`,
              values[idx]
            ])
          ),
          "Total": total
        };
      });

      const ws = XLSX.utils.json_to_sheet(dataForExport);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Distribusi Biaya Rekap");
      
      const fileName = `distribusi_biaya_rekap_${tahun}.xlsx`;
      XLSX.writeFile(wb, fileName);
      
      toast({
        title: "Berhasil",
        description: `Laporan Excel berhasil diunduh dengan ${rowsForDownload.length} data`,
      });
    } catch (err: any) {
      toast({ title: "Gagal mengunduh", description: err.message || String(err), variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Distribusi Biaya Rekap
          </CardTitle>
          <CardDescription>
            Ringkasan total biaya final per unit kerja dari hasil distribusi biaya tahap kedua.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            <div>
              <Label htmlFor="tahun">Tahun</Label>
              <Input id="tahun" type="number" value={tahun} min={2020} max={2035} onChange={(e) => setTahun(parseInt(e.target.value))} />
            </div>
            <div>
              <Label htmlFor="filter">Filter Nama Unit Kerja</Label>
              <Input id="filter" placeholder="ketik nama unit kerja..." value={filterNama} onChange={(e) => setFilterNama(e.target.value)} />
            </div>
            <div className="flex items-end gap-2">
              <Button variant="secondary" disabled={loading} onClick={exportExcel}>
                <Download className="h-4 w-4 mr-2" />
                Unduh Excel
              </Button>
              <Button variant="outline" disabled={loading} onClick={fetchRows}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Tabel Rekap</CardTitle>
          <CardDescription>Rekap berdasarkan tabel `distribusi_biaya_rekap` (baris per jenis biaya, kolom UK037–UK077).</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[240px]">Biaya</TableHead>
                  {filteredIndices.map((i) => (
                    <TableHead key={i} className="text-right min-w-[160px]">{getUkDisplayName(i)}</TableHead>
                  ))}
                  <TableHead className="min-w-[160px] text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r, idx) => (
                  <TableRow key={(r.id as string) || `${r.biaya}-${idx}`}>
                    <TableCell className="font-medium">{r.biaya}</TableCell>
                    {filteredIndices.map((i) => {
                      const col = getUkColumnName(i);
                      const val = Number(((r as any)[col] ?? 0));
                      return <TableCell key={col} className="text-right">{val.toLocaleString("id-ID", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>;
                    })}
                    <TableCell className="text-right font-semibold">{rowTotals[idx]?.toLocaleString("id-ID", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


