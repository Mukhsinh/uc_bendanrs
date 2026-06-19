import React, { useEffect, useMemo, useState } from "react";
import { useYear } from "@/contexts/YearContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Download, RefreshCw } from "lucide-react";
import { useReportDownload } from "@/components/report";

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
  const { downloadReport } = useReportDownload();
  const [rows, setRows] = useState<RekapRow[]>([]);
  const [tahun, setTahun] = useState<number>(new Date().getFullYear());
  const [loading, setLoading] = useState<boolean>(false);
  const [downloadingReport, setDownloadingReport] = useState<boolean>(false);
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const { toast } = useToast();
  const [filterNama, setFilterNama] = useState<string>("");
  const [showFilters, setShowFilters] = useState<boolean>(true);

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
      console.log('🔄 Memulai fetchRows untuk tahun:', tahun);
      setLoading(true);
      
      const { data, error } = await supabase
        .from("distribusi_biaya_rekap")
        .select("*")
        .eq("tahun", tahun)
        .order("urutan");

      console.log('📊 Data diterima:', data?.length || 0, 'rows');

      if (error) {
        console.error('❌ Error dari Supabase:', error);
        throw error;
      }
      
      setRows((data as any[]) || []);
      
      // Hanya tampilkan toast sukses jika data berhasil dimuat
      if (data && data.length > 0) {
        toast({ 
          title: "✅ Data berhasil dimuat", 
          description: `${data.length} baris data dimuat untuk tahun ${tahun}`,
          duration: 3000
        });
      }
    } catch (err: any) {
      console.error('❌ Error fetchRows:', err);
      const errorMessage = err?.message || err?.error?.message || String(err) || 'Gagal memuat data';
      toast({ 
        title: "Gagal memuat data", 
        description: errorMessage, 
        variant: "destructive" 
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePerbaruiData = async () => {
    try {
      setIsUpdating(true);
      console.log('🔄 Memulai proses perbarui data distribusi biaya rekap untuk tahun:', tahun);
      
      // Ambil user_id dari session
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        throw new Error("User tidak ditemukan. Silakan login kembali.");
      }
      
      toast({
        title: "Memperbarui data...",
        description: "Sedang memperbarui data distribusi biaya rekap dari tabel sumber",
        duration: 3000
      });
      
      // Panggil fungsi RPC untuk populate distribusi_biaya_rekap
      console.log('📤 Memanggil RPC dengan parameter:', { p_user_id: user.id, p_tahun: tahun });
      
      const { data: rpcData, error: rpcError } = await supabase.rpc('populate_distribusi_biaya_rekap', {
        p_user_id: user.id,
        p_tahun: tahun
      });
      
      if (rpcError) {
        console.error('❌ Error dari RPC populate_distribusi_biaya_rekap:', rpcError);
        console.error('❌ Error code:', rpcError.code);
        console.error('❌ Error message:', rpcError.message);
        console.error('❌ Error details:', rpcError.details);
        console.error('❌ Error hint:', rpcError.hint);
        
        // Buat error message yang lebih informatif
        let errorMsg = rpcError.message || 'Gagal memperbarui data distribusi biaya rekap';
        if (rpcError.details) {
          errorMsg += ` - Detail: ${rpcError.details}`;
        }
        if (rpcError.hint) {
          errorMsg += ` - Hint: ${rpcError.hint}`;
        }
        
        throw new Error(errorMsg);
      }
      
      console.log('✅ RPC response data:', rpcData);
      
      console.log('✅ Fungsi populate_distribusi_biaya_rekap berhasil dijalankan');
      
      // Setelah RPC selesai, reload data dari tabel
      await fetchRows();
      
      toast({
        title: "✅ Data berhasil diperbarui",
        description: "Data distribusi biaya rekap telah diperbarui dari tabel sumber",
        duration: 3000
      });
    } catch (err: any) {
      console.error('❌ Error saat memperbarui data:', err);
      console.error('❌ Error type:', typeof err);
      console.error('❌ Error keys:', err ? Object.keys(err) : 'null');
      console.error('❌ Full error object:', JSON.stringify(err, null, 2));
      
      let errorMessage = "Gagal memperbarui data distribusi biaya rekap";
      
      if (err?.message) {
        errorMessage = err.message;
      } else if (err?.error?.message) {
        errorMessage = err.error.message;
      } else if (typeof err === 'string') {
        errorMessage = err;
      } else if (err?.code) {
        errorMessage = `Error ${err.code}: ${err.message || 'Unknown error'}`;
      }
      
      toast({
        title: "Gagal memperbarui data",
        description: errorMessage,
        variant: "destructive",
        duration: 8000
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDownloadReport = async () => {
    try {
      setDownloadingReport(true);

      const { data, error } = await supabase
        .from("distribusi_biaya_rekap")
        .select("*")
        .eq("tahun", tahun)
        .order("urutan");

      if (error) {
        throw error;
      }

      const rowsForDownload: RekapRow[] = (data as any[]) ?? [];

      if (rowsForDownload.length === 0) {
        toast({
          title: "Tidak ada data",
          description: "Belum ada data untuk diunduh.",
          variant: "destructive",
        });
        return;
      }

      const records = rowsForDownload.map((row) => {
        const record: Record<string, string | number> = {
          "Biaya": row.biaya || "",
        };

        for (let i = 37; i <= 77; i++) {
          const code = `UK${i.toString().padStart(3, "0")}`;
          const columnKey = getUkColumnName(i);
          const displayName = getUkDisplayName(i);
          const keyLabel = `${code} - ${displayName}`;
          record[keyLabel] = Math.round(Number((row as any)[columnKey] ?? 0));
        }

        const total = Object.keys(record)
          .filter((key) => key.startsWith("UK"))
          .reduce((sum, key) => sum + Number(record[key] ?? 0), 0);

        record["Total"] = Math.round(total);
        record["Tahun"] = tahun;

        return record;
      });

      await downloadReport({
        title: "Laporan Distribusi Biaya Rekap",
        subtitle: `Tahun ${tahun}`,
        filename: `distribusi_biaya_rekap_${tahun}`,
        records,
        orientation: "landscape",
      });

      toast({
        title: "Berhasil",
        description: `Laporan berhasil disiapkan dengan ${rowsForDownload.length} baris data`,
      });
    } catch (err: any) {
      console.error("Gagal mengunduh laporan distribusi biaya rekap:", err);
      toast({
        title: "Gagal mengunduh",
        description: err?.message || String(err),
        variant: "destructive",
      });
    } finally {
      setDownloadingReport(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Distribusi Biaya Rekap</h1>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant="outline"
          onClick={() => setShowFilters((prev) => !prev)}
          className="min-w-[110px] border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
        >
          Filter
        </Button>
        <Button
          className="bg-red-600 text-white hover:bg-red-700 disabled:bg-red-300 disabled:text-white/70"
          disabled={loading || downloadingReport || rows.length === 0}
          onClick={() => {
            void handleDownloadReport();
          }}
        >
          {downloadingReport ? (
            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Download className="h-4 w-4 mr-2" />
          )}
          {downloadingReport ? "Menyiapkan..." : "Unduh Laporan"}
        </Button>
        <Button
          className="bg-blue-600 text-white hover:bg-blue-700 disabled:bg-blue-300 disabled:text-white/80"
          disabled={isUpdating}
          onClick={(e) => {
            e.preventDefault();
            handlePerbaruiData().catch((err) => console.error('❌ Error saat handlePerbaruiData:', err));
          }}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isUpdating ? 'animate-spin' : ''}`} />
          {isUpdating ? 'Memperbarui...' : 'Perbarui Data'}
        </Button>
      </div>

      {showFilters && (
        <Card>
          <CardContent>
            <div className="flex flex-wrap items-end gap-3">
              <div className="flex flex-col gap-2 w-[120px]">
                <Label htmlFor="tahun">Tahun</Label>
                <Input
                  id="tahun"
                  type="number"
                  value={tahun}
                  min={2020}
                  max={2035}
                  onChange={(e) => setTahun(parseInt(e.target.value) || tahun)}
                />
              </div>
              <div className="flex flex-col gap-2 min-w-[220px]">
                <Label htmlFor="filter">Filter Nama Unit Kerja</Label>
                <Input
                  id="filter"
                  placeholder="Ketik nama unit kerja..."
                  value={filterNama}
                  onChange={(e) => setFilterNama(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-[#0f766e]">
                <TableRow className="bg-[#0f766e] hover:bg-[#0f766e]">
                  <TableHead className="min-w-[240px] text-white">Biaya</TableHead>
                  {filteredIndices.map((i) => (
                    <TableHead key={i} className="min-w-[160px] text-right text-white">
                      {getUkDisplayName(i)}
                    </TableHead>
                  ))}
                  <TableHead className="min-w-[160px] text-right text-white">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r, idx) => (
                  <TableRow key={(r.id as string) || `${r.biaya}-${idx}`}>
                    <TableCell className="font-medium">{r.biaya}</TableCell>
                    {filteredIndices.map((i) => {
                      const col = getUkColumnName(i);
                      const val = Number(((r as any)[col] ?? 0));
                      return (
                        <TableCell key={col} className="text-right">
                          {val.toLocaleString("id-ID", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </TableCell>
                      );
                    })}
                    <TableCell className="text-right font-semibold">
                      {rowTotals[idx]?.toLocaleString("id-ID", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </TableCell>
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


