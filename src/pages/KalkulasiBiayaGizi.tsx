import React, { useState, useEffect } from "react";
import { useYear } from "@/contexts/YearContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { tenantSupabase } from "@/lib/supabase-tenant-wrapper";
import { Download, Upload, Plus, Edit, Trash2, Calculator, Clock, RefreshCw, Search } from "lucide-react";
import * as XLSX from "xlsx";
import BahanPorsiForm from "@/components/BahanPorsiForm";
import { manualRecalculateGizi, handleDatabaseError } from "@/utils/database-operations";
import { useReportDownload } from "@/components/report";

interface MenuGizi {
  id: number;
  kode_makanan: string;
  nama_makanan: string;
}

interface DataBarangGizi {
  id: string;
  kode_barang: string;
  nama_barang: string;
  satuan: string;
  harga: number;
}

interface BahanPorsi {
  id: string;
  kode: string;
  jenis_makanan: string;
  nama_barang: string;
  satuan: string;
  konsumsi: number;
  harga: number;
  harga_bah: number; // Integer tanpa desimal
  biaya_produksi: number;
  biaya_bahan_porsi: number; // Integer tanpa desimal
  data_barang_gizi_id?: string;
  sumber_data?: string;
  breakdown_perhitungan?: string;
}

interface KalkulasiBiayaGiziData {
  id: string;
  tahun: number;
  kode: string;
  jenis_makanan: string;
  jumlah: number;
  jumlah_svip: number;
  jumlah_vip: number;
  jumlah_kelas_i: number;
  jumlah_kelas_ii: number;
  jumlah_kelas_iii: number;
  waktu_meracik: number;
  waktu_memasak: number;
  waktu_menata: number;
  waktu_total: number;
  bahan_porsi: BahanPorsi[];
  hasil_kali_waktu: number;
  dasar_alokasi_waktu: number;
  biaya_gaji_tunjangan: number;
  biaya_jasa_pelayanan: number;
  biaya_obat: number;
  biaya_bhp: number;
  biaya_makan_karyawan: number;
  biaya_makan_pasien: number;
  biaya_rumah_tangga: number;
  biaya_cetak: number;
  biaya_atk: number;
  biaya_listrik: number;
  biaya_air: number;
  biaya_telp: number;
  biaya_pemeliharaan_bangunan: number;
  biaya_pemeliharaan_alat_medis: number;
  biaya_pemeliharaan_alat_non_medis: number;
  biaya_operasional_lainnya: number;
  biaya_penyusutan_gedung: number;
  biaya_penyusutan_jaringan: number;
  biaya_penyusutan_alat_medis: number;
  biaya_penyusutan_alat_non_medis: number;
  biaya_pendidikan_pelatihan: number;
  biaya_laundry: number;
  biaya_sterilisasi: number;
  biaya_tidak_langsung_terdistribusi: number;
  unit_cost_per_porsi: number;
  biaya_bahan_porsi_numeric?: number;
}

const KalkulasiBiayaGizi: React.FC = () => {
  const { selectedYear: contextYear } = useYear();
  const [data, setData] = useState<KalkulasiBiayaGiziData[]>([]);
  const [menuGizi, setMenuGizi] = useState<MenuGizi[]>([]);
  const [bahanPorsi, setBahanPorsi] = useState<BahanPorsi[]>([]);
  const [dataBarangGizi, setDataBarangGizi] = useState<DataBarangGizi[]>([]);
  const [loading, setLoading] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importStatus, setImportStatus] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<KalkulasiBiayaGiziData | null>(null);
  const [currentYear, setCurrentYear] = useState(contextYear);
  const [isBahanPorsiDialogOpen, setIsBahanPorsiDialogOpen] = useState(false);
  const [selectedMenuForBahan, setSelectedMenuForBahan] = useState<MenuGizi | null>(null);
  const [menusWithBahan, setMenusWithBahan] = useState<Set<string>>(new Set());
  const [searchJenisMakanan, setSearchJenisMakanan] = useState<string>('');
  const [isUpdateWaktuDialogOpen, setIsUpdateWaktuDialogOpen] = useState(false);
  const [selectedItemForWaktu, setSelectedItemForWaktu] = useState<KalkulasiBiayaGiziData | null>(null);
  const { toast } = useToast();
  const { downloadReport } = useReportDownload();
  const [downloadingSummary, setDownloadingSummary] = useState(false);
  const [downloadingDetail, setDownloadingDetail] = useState(false);
  const [downloadingDetailBiaya, setDownloadingDetailBiaya] = useState(false);

  // State untuk manual recalculation
  const [recalculating, setRecalculating] = useState(false);
  const [recalcProgress, setRecalcProgress] = useState({ step: 0, total: 5, message: '' });

  // Summary AUC per kelas (SVIP/VIP/I/II/III)
  const [aucSummary, setAucSummary] = useState({
    svip: 0,
    vip: 0,
    i: 0,
    ii: 0,
    iii: 0,
  });
  const [exportJenisFilter, setExportJenisFilter] = useState<string>("");

  // Form state
  const [formData, setFormData] = useState({
    tahun: currentYear,
    kode: "",
    jenis_makanan: "",
    jumlah: 0,
    jumlah_svip: 0,
    jumlah_vip: 0,
    jumlah_kelas_i: 0,
    jumlah_kelas_ii: 0,
    jumlah_kelas_iii: 0,
    waktu_meracik: 0,
    waktu_memasak: 0,
    waktu_menata: 0,
    bahan_porsi: [] as BahanPorsi[],
    dasar_alokasi_waktu: 0,
    biaya_gaji_tunjangan: 0,
    biaya_jasa_pelayanan: 0,
    biaya_obat: 0,
    biaya_bhp: 0,
    biaya_makan_karyawan: 0,
    biaya_makan_pasien: 0,
    biaya_rumah_tangga: 0,
    biaya_cetak: 0,
    biaya_atk: 0,
    biaya_listrik: 0,
    biaya_air: 0,
    biaya_telp: 0,
    biaya_pemeliharaan_bangunan: 0,
    biaya_pemeliharaan_alat_medis: 0,
    biaya_pemeliharaan_alat_non_medis: 0,
    biaya_operasional_lainnya: 0,
    biaya_penyusutan_gedung: 0,
    biaya_penyusutan_jaringan: 0,
    biaya_penyusutan_alat_medis: 0,
    biaya_penyusutan_alat_non_medis: 0,
    biaya_pendidikan_pelatihan: 0,
    biaya_laundry: 0,
    biaya_sterilisasi: 0,
    biaya_tidak_langsung_terdistribusi: 0,
  });


  useEffect(() => {
    fetchData();
    fetchMenuGizi();
    fetchBahanPorsi();
    fetchDataBarangGizi();

    // Realtime subscription to auto-refresh when kalkulasi_biaya_gizi changes
    const channel = supabase
      .channel('kalkulasi_biaya_gizi_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'kalkulasi_biaya_gizi' }, () => {
        fetchData();
      })
      .subscribe();

    return () => {
      try { supabase.removeChannel(channel); } catch (_) { }
    };
  }, [currentYear]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const startTime = performance.now();

      // Optimized query - only select columns needed for display and calculation
      const { data: kalkulasiData, error } = await tenantSupabase
        .from('kalkulasi_biaya_gizi')
        .select(`
          id,
          tahun,
          kode,
          jenis_makanan,
          jumlah,
          jumlah_svip,
          jumlah_vip,
          jumlah_kelas_i,
          jumlah_kelas_ii,
          jumlah_kelas_iii,
          waktu_meracik,
          waktu_memasak,
          waktu_menata,
          waktu_total,
          bahan_porsi,
          hasil_kali_waktu,
          dasar_alokasi_waktu,
          biaya_gaji_tunjangan,
          biaya_jasa_pelayanan,
          biaya_obat,
          biaya_bhp,
          biaya_makan_karyawan,
          biaya_makan_pasien,
          biaya_rumah_tangga,
          biaya_cetak,
          biaya_atk,
          biaya_listrik,
          biaya_air,
          biaya_telp,
          biaya_pemeliharaan_bangunan,
          biaya_pemeliharaan_alat_medis,
          biaya_pemeliharaan_alat_non_medis,
          biaya_operasional_lainnya,
          biaya_penyusutan_gedung,
          biaya_penyusutan_jaringan,
          biaya_penyusutan_alat_medis,
          biaya_penyusutan_alat_non_medis,
          biaya_pendidikan_pelatihan,
          biaya_laundry,
          biaya_sterilisasi,
          biaya_tidak_langsung_terdistribusi,
          unit_cost_per_porsi,
          biaya_bahan_porsi_numeric,
          created_at,
          updated_at
        `)
        .eq('tahun', currentYear)
        .order('kode');

      const endTime = performance.now();
      console.log(`📊 Data fetch took ${(endTime - startTime).toFixed(2)}ms`);

      if (error) throw error;
      console.log('Data kalkulasi loaded:', kalkulasiData);
      setData(kalkulasiData || []);
      // Recompute summary when data loaded
      computeAndSetAucSummary(kalkulasiData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "Gagal memuat data kalkulasi biaya gizi",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Compute average unit cost per kelas using client-side aggregation
  const computeAndSetAucSummary = (rows: KalkulasiBiayaGiziData[]) => {
    const lowerIncludes = (text: string | undefined, needle: string) => (text || '').toLowerCase().includes(needle);

    let numSvip = 0, denSvip = 0;
    let numVip = 0, denVip = 0;
    let numI = 0, denI = 0;
    let numII = 0, denII = 0;
    let numIII = 0, denIII = 0;

    rows.forEach(r => {
      const jenis = r.jenis_makanan || '';
      const uc = Number(r.unit_cost_per_porsi || 0);
      // SVIP/VVIP
      if (lowerIncludes(jenis, 'vvip') || lowerIncludes(jenis, 'svip')) {
        numSvip += (r.jumlah || 0) * uc;
        denSvip += Number(r.jumlah_svip || 0);
      }
      // VIP (exclude VVIP)
      if (lowerIncludes(jenis, 'vip') && !lowerIncludes(jenis, 'vvip')) {
        numVip += (r.jumlah || 0) * uc;
        denVip += Number(r.jumlah_vip || 0);
      }
      // Kelas I only
      if (lowerIncludes(jenis, 'kelas i') && !lowerIncludes(jenis, 'kelas ii') && !lowerIncludes(jenis, 'kelas iii')) {
        numI += (r.jumlah || 0) * uc;
        denI += Number(r.jumlah_kelas_i || 0);
      }
      // Kelas II only
      if (lowerIncludes(jenis, 'kelas ii') && !lowerIncludes(jenis, 'kelas iii')) {
        numII += (r.jumlah || 0) * uc;
        denII += Number(r.jumlah_kelas_ii || 0);
      }
      // Kelas III only
      if (lowerIncludes(jenis, 'kelas iii')) {
        numIII += (r.jumlah || 0) * uc;
        denIII += Number(r.jumlah_kelas_iii || 0);
      }
    });

    setAucSummary({
      svip: denSvip > 0 ? Math.round(numSvip / denSvip) : 0,
      vip: denVip > 0 ? Math.round(numVip / denVip) : 0,
      i: denI > 0 ? Math.round(numI / denI) : 0,
      ii: denII > 0 ? Math.round(numII / denII) : 0,
      iii: denIII > 0 ? Math.round(numIII / denIII) : 0,
    });
  };

  // Excel download helpers
  const downloadExcel = (filename: string, rows: any[]) => {
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Laporan");
    XLSX.writeFile(wb, filename);
  };

  const handleDownloadSummary = async () => {
    try {
      setDownloadingSummary(true);

      const records = [
        { "Kelas": "SVIP/VVIP", "Unit Cost Rata-rata": Math.round(aucSummary.svip || 0) },
        { "Kelas": "VIP", "Unit Cost Rata-rata": Math.round(aucSummary.vip || 0) },
        { "Kelas": "Kelas I", "Unit Cost Rata-rata": Math.round(aucSummary.i || 0) },
        { "Kelas": "Kelas II", "Unit Cost Rata-rata": Math.round(aucSummary.ii || 0) },
        { "Kelas": "Kelas III", "Unit Cost Rata-rata": Math.round(aucSummary.iii || 0) },
      ];

      await downloadReport({
        title: "Ringkasan Average Unit Cost Gizi",
        subtitle: `Tahun ${currentYear}`,
        filename: `ringkasan_auc_gizi_${currentYear}`,
        records,
        orientation: "portrait",
      });

      toast({
        title: "Berhasil",
        description: "Ringkasan AUC berhasil disiapkan",
      });
    } catch (error: any) {
      console.error("Gagal mengunduh ringkasan AUC gizi:", error);
      toast({
        title: "Gagal mengunduh",
        description: error?.message || String(error),
        variant: "destructive",
      });
    } finally {
      setDownloadingSummary(false);
    }
  };

  const handleDownloadDetail = async () => {
    if (!data.length) {
      toast({
        title: "Tidak ada data",
        description: "Belum ada data detail kalkulasi untuk diunduh.",
        variant: "destructive",
      });
      return;
    }

    try {
      setDownloadingDetail(true);

      // Records untuk PDF: menggunakan data frontend (sesuai tabel yang ditampilkan)
      const recordsForPdf = data.map((d) => ({
        "Jenis Makanan": d.jenis_makanan,
        "Total Porsi": calculateTotalPorsi(d),
        "Waktu (Meracik/Memasak/Menata)": `${d.waktu_meracik}m / ${d.waktu_memasak}m / ${d.waktu_menata}m (Total: ${d.waktu_total}m)`,
        "Bahan Porsi": d.bahan_porsi && Array.isArray(d.bahan_porsi) && d.bahan_porsi.length > 0
          ? d.bahan_porsi.slice(0, 2).map((b: any) => `${b.nama_barang}: ${b.konsumsi} ${b.satuan}`).join(", ") + (d.bahan_porsi.length > 2 ? ` +${d.bahan_porsi.length - 2} lainnya` : "")
          : "Belum ada bahan",
        "Biaya Bahan Porsi": Math.round(d.biaya_bahan_porsi_numeric || 0),
        "Unit Cost/Porsi": Math.round(d.unit_cost_per_porsi || 0),
      }));

      // Records untuk Excel: menggunakan data database (fetch langsung dari database)
      const { data: dbData, error: fetchError } = await tenantSupabase
        .from('kalkulasi_biaya_gizi')
        .select('*')
        .eq('tahun', currentYear)
        .order('jenis_makanan');

      if (fetchError) {
        throw fetchError;
      }

      const recordsForExcel = (dbData || []).map((d: any) => ({
        "Tahun": d.tahun,
        "Kode": d.kode,
        "Jenis Makanan": d.jenis_makanan,
        "Jumlah Porsi": d.jumlah,
        "Jumlah SVIP/VVIP": d.jumlah_svip,
        "Jumlah VIP": d.jumlah_vip,
        "Jumlah Kelas I": d.jumlah_kelas_i,
        "Jumlah Kelas II": d.jumlah_kelas_ii,
        "Jumlah Kelas III": d.jumlah_kelas_iii,
        "Waktu Meracik": d.waktu_meracik,
        "Waktu Memasak": d.waktu_memasak,
        "Waktu Menata": d.waktu_menata,
        "Waktu Total": d.waktu_total,
        "Biaya Gaji & Tunjangan": Math.round(d.biaya_gaji_tunjangan || 0),
        "Biaya Jasa Pelayanan": Math.round(d.biaya_jasa_pelayanan || 0),
        "Biaya Obat": Math.round(d.biaya_obat || 0),
        "Biaya BHP": Math.round(d.biaya_bhp || 0),
        "Biaya Makan Karyawan": Math.round(d.biaya_makan_karyawan || 0),
        "Biaya Makan Pasien": Math.round(d.biaya_makan_pasien || 0),
        "Biaya Rumah Tangga": Math.round(d.biaya_rumah_tangga || 0),
        "Biaya Cetak": Math.round(d.biaya_cetak || 0),
        "Biaya ATK": Math.round(d.biaya_atk || 0),
        "Biaya Listrik": Math.round(d.biaya_listrik || 0),
        "Biaya Air": Math.round(d.biaya_air || 0),
        "Biaya Telepon": Math.round(d.biaya_telp || 0),
        "Biaya Pemeliharaan Bangunan": Math.round(d.biaya_pemeliharaan_bangunan || 0),
        "Biaya Pemeliharaan Alat Medis": Math.round(d.biaya_pemeliharaan_alat_medis || 0),
        "Biaya Pemeliharaan Alat Non Medis": Math.round(d.biaya_pemeliharaan_alat_non_medis || 0),
        "Biaya Operasional Lainnya": Math.round(d.biaya_operasional_lainnya || 0),
        "Biaya Penyusutan Gedung": Math.round(d.biaya_penyusutan_gedung || 0),
        "Biaya Penyusutan Jaringan": Math.round(d.biaya_penyusutan_jaringan || 0),
        "Biaya Penyusutan Alat Medis": Math.round(d.biaya_penyusutan_alat_medis || 0),
        "Biaya Penyusutan Alat Non Medis": Math.round(d.biaya_penyusutan_alat_non_medis || 0),
        "Biaya Pendidikan & Pelatihan": Math.round(d.biaya_pendidikan_pelatihan || 0),
        "Biaya Laundry": Math.round(d.biaya_laundry || 0),
        "Biaya Sterilisasi": Math.round(d.biaya_sterilisasi || 0),
        "Biaya Tidak Langsung Terdistribusi": Math.round(d.biaya_tidak_langsung_terdistribusi || 0),
        "Biaya Bahan per Porsi": Math.round(d.biaya_bahan_porsi_numeric || 0),
        "Unit Cost per Porsi": Math.round(d.unit_cost_per_porsi || 0),
      }));

      await downloadReport({
        title: "Detail Kalkulasi Biaya Gizi",
        subtitle: `Tahun ${currentYear}`,
        filename: `detail_kalkulasi_gizi_${currentYear}`,
        recordsForPdf,
        recordsForExcel,
        orientation: "landscape",
      });

      toast({
        title: "Berhasil",
        description: "Data detail kalkulasi berhasil disiapkan",
      });
    } catch (error: any) {
      console.error("Gagal mengunduh detail kalkulasi gizi:", error);
      toast({
        title: "Gagal mengunduh",
        description: error?.message || String(error),
        variant: "destructive",
      });
    } finally {
      setDownloadingDetail(false);
    }
  };

  // Manual recalculation function
  const handleManualRecalculation = async () => {
    const userId = (await supabase.auth.getUser())?.data?.user?.id;
    if (!userId) {
      toast({
        title: "❌ Error",
        description: "User tidak ditemukan. Silakan login kembali.",
        variant: "destructive",
      });
      return;
    }

    if (!confirm("Apakah Anda yakin ingin melakukan rekalkulasi? Proses ini akan memperbarui semua kalkulasi biaya berdasarkan rumus tabel.")) {
      return;
    }

    try {
      setRecalculating(true);
      setRecalcProgress({ step: 1, total: 5, message: 'Memulai rekalkulasi...' });

      console.log("🔄 Starting manual recalculation for gizi...");
      const startTime = performance.now();

      setRecalcProgress({ step: 2, total: 5, message: 'Menghitung hasil kali dan dasar alokasi...' });

      const result = await manualRecalculateGizi(currentYear, userId);

      setRecalcProgress({ step: 3, total: 5, message: 'Mendistribusikan biaya tidak langsung...' });

      setRecalcProgress({ step: 4, total: 5, message: 'Memperbarui tampilan data...' });

      // Refresh data setelah recalculation
      await fetchData();

      const endTime = performance.now();
      const totalTime = (endTime - startTime) / 1000;

      setRecalcProgress({ step: 5, total: 5, message: 'Selesai!' });

      // Show detailed success message with performance metrics
      toast({
        title: "🎉 Rekalkulasi berhasil diselesaikan!",
        description: `📊 ${result.affected_rows || 0} records diperbarui\n⏱️ Waktu total: ${totalTime.toFixed(2)}s\n🚀 Database: ${result.execution_time_seconds?.toFixed(2)}s`,
        duration: 6000,
      });

      console.log("✅ Manual recalculation completed successfully");
      console.log("📈 Recalculation stats:", result);
      console.log(`⚡ Performance: Total ${totalTime.toFixed(2)}s, DB ${result.execution_time_seconds?.toFixed(2)}s`);

    } catch (error: any) {
      console.error("Manual recalculation failed:", error);

      // Better error messages based on error type
      let errorMessage = error.message;
      if (error.message?.includes('timeout')) {
        errorMessage = "Rekalkulasi dibatalkan karena timeout - cobalah dengan data yang lebih sedikit";
      } else if (error.message?.includes('network')) {
        errorMessage = "Masalah koneksi internet. Periksa koneksi dan coba lagi.";
      } else if (error.message?.includes('permission')) {
        errorMessage = "Tidak memiliki izin untuk melakukan rekalkulasi. Hubungi administrator.";
      }

      toast({
        title: "❌ Gagal melakukan rekalkulasi",
        description: errorMessage,
        variant: "destructive",
        duration: 8000,
      });
    } finally {
      setRecalculating(false);
      setRecalcProgress({ step: 0, total: 5, message: '' });
    }
  };

  // Download laporan detail biaya (semua kolom biaya), dengan filter jenis makanan
  const handleDownloadDetailBiaya = async () => {
    try {
      setDownloadingDetailBiaya(true);
      const filter = exportJenisFilter?.trim();
      // Fetch fresh data from DB to ensure up-to-date export and include all columns
      let query = tenantSupabase
        .from('kalkulasi_biaya_gizi')
        .select('*')
        .eq('tahun', currentYear);
      // Note: we'll apply strict filter rules client-side to precisely match requirements
      const { data: rowsDb, error } = await query;
      if (error) throw error;

      const matchJenisStrict = (jenis: string, f: string) => {
        const j = (jenis || '').toLowerCase();
        const s = f.toLowerCase();
        if (!s) return true;
        if (s.includes('vvip') || s.includes('svip')) {
          // SVIP/VVIP sama, exclude VIP only
          return j.includes('vvip') || j.includes('svip');
        }
        if (s.includes('vip')) {
          // VIP tanpa VVIP
          return j.includes('vip') && !j.includes('vvip');
        }
        if (s.includes('kelas i')) {
          return j.includes('kelas i') && !j.includes('kelas ii') && !j.includes('kelas iii');
        }
        if (s.includes('kelas ii')) {
          return j.includes('kelas ii') && !j.includes('kelas iii');
        }
        if (s.includes('kelas iii')) {
          return j.includes('kelas iii');
        }
        // fallback: substring contains
        return j.includes(s);
      };

      const filteredDb = (rowsDb || []).filter((d: any) => matchJenisStrict(d.jenis_makanan, filter || ''));

      const records = filteredDb.map((d: any) => {
        // Compute biaya_bahan_porsi when numeric is missing using bahan_porsi JSON breakdown
        let biayaBahanPorsi = d.biaya_bahan_porsi_numeric || 0;
        if ((!biayaBahanPorsi || Number.isNaN(biayaBahanPorsi)) && Array.isArray(d.bahan_porsi)) {
          biayaBahanPorsi = d.bahan_porsi.reduce((sum: number, b: any) => sum + (Number(b?.biaya_bahan_porsi) || 0), 0);
        }

        return {
          "Tahun": d.tahun,
          "Kode": d.kode,
          "Jenis Makanan": d.jenis_makanan,
          "Jumlah Porsi": d.jumlah,
          "Unit Cost per Porsi": Math.round(d.unit_cost_per_porsi || 0),
          "Biaya Gaji & Tunjangan": Math.round(d.biaya_gaji_tunjangan || 0),
          "Biaya Jasa Pelayanan": Math.round(d.biaya_jasa_pelayanan || 0),
          "Biaya Obat": Math.round(d.biaya_obat || 0),
          "Biaya BHP": Math.round(d.biaya_bhp || 0),
          "Biaya Makan Karyawan": Math.round(d.biaya_makan_karyawan || 0),
          "Biaya Makan Pasien": Math.round(d.biaya_makan_pasien || 0),
          "Biaya Rumah Tangga": Math.round(d.biaya_rumah_tangga || 0),
          "Biaya Cetak": Math.round(d.biaya_cetak || 0),
          "Biaya ATK": Math.round(d.biaya_atk || 0),
          "Biaya Listrik": Math.round(d.biaya_listrik || 0),
          "Biaya Air": Math.round(d.biaya_air || 0),
          "Biaya Telepon": Math.round(d.biaya_telp || 0),
          "Biaya Pemeliharaan Bangunan": Math.round(d.biaya_pemeliharaan_bangunan || 0),
          "Biaya Pemeliharaan Alat Medis": Math.round(d.biaya_pemeliharaan_alat_medis || 0),
          "Biaya Pemeliharaan Alat Non Medis": Math.round(d.biaya_pemeliharaan_alat_non_medis || 0),
          "Biaya Operasional Lainnya": Math.round(d.biaya_operasional_lainnya || 0),
          "Biaya Penyusutan Gedung": Math.round(d.biaya_penyusutan_gedung || 0),
          "Biaya Penyusutan Jaringan": Math.round(d.biaya_penyusutan_jaringan || 0),
          "Biaya Penyusutan Alat Medis": Math.round(d.biaya_penyusutan_alat_medis || 0),
          "Biaya Penyusutan Alat Non Medis": Math.round(d.biaya_penyusutan_alat_non_medis || 0),
          "Biaya Pendidikan & Pelatihan": Math.round(d.biaya_pendidikan_pelatihan || 0),
          "Biaya Laundry": Math.round(d.biaya_laundry || 0),
          "Biaya Sterilisasi": Math.round(d.biaya_sterilisasi || 0),
          "Biaya Tidak Langsung Terdistribusi": Math.round(d.biaya_tidak_langsung_terdistribusi || 0),
          "Biaya Bahan per Porsi": Math.round(biayaBahanPorsi || 0),
        };
      });

      if (!records.length) {
        toast({ title: 'Tidak ada data', description: 'Tidak ada data sesuai filter jenis makanan.', variant: 'destructive' });
        return;
      }
      await downloadReport({
        title: "Detail Komponen Biaya Gizi",
        subtitle: [`Tahun ${currentYear}`, filter ? `Filter: ${filter}` : null].filter(Boolean).join(' • '),
        filename: `detail_biaya_gizi_${currentYear}${filter ? `_filter_${filter.replace(/[^a-zA-Z0-9]+/g, '_')}` : ''}`,
        records,
        orientation: "landscape",
      });
      toast({ title: 'Berhasil', description: 'Laporan detail biaya berhasil disiapkan' });
    } catch (e) {
      console.error('Export error:', e);
      toast({ title: 'Gagal mengunduh', description: 'Terjadi kesalahan saat menyiapkan laporan detail biaya.', variant: 'destructive' });
    } finally {
      setDownloadingDetailBiaya(false);
    }
  };

  const fetchMenuGizi = async () => {
    try {
      const { data: menuData, error } = await supabase
        .from('menu_gizi')
        .select('*')
        .order('kode_makanan');

      if (error) throw error;
      setMenuGizi(menuData || []);
    } catch (error) {
      console.error('Error fetching menu gizi:', error);
    }
  };

  const fetchBahanPorsi = async () => {
    try {
      const { data: bahanData, error } = await supabase
        .from('bahan_porsi')
        .select('*')
        .order('kode');

      if (error) throw error;
      setBahanPorsi(bahanData || []);

      // Update menus with bahan porsi
      const menusWithBahanSet = new Set(bahanData?.map(item => item.jenis_makanan) || []);
      setMenusWithBahan(menusWithBahanSet);

    } catch (error) {
      console.error('Error fetching bahan porsi:', error);
    }
  };

  const fetchDataBarangGizi = async () => {
    try {
      const { data: barangData, error } = await supabase
        .from('data_barang_gizi')
        .select('*')
        .order('nama_barang');

      if (error) throw error;
      setDataBarangGizi(barangData || []);
    } catch (error) {
      console.error('Error fetching data barang gizi:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);

      // Remove generated columns from submit data (these are calculated by database)
      const submitData = { ...formData };
      delete (submitData as any).jumlah;
      delete (submitData as any).waktu_total;
      delete (submitData as any).hasil_kali_waktu;
      delete (submitData as any).unit_cost_per_porsi;

      if (editingItem) {
        const { error } = await tenantSupabase
          .from('kalkulasi_biaya_gizi')
          .update(submitData)
          .eq('id', editingItem.id);

        if (error) throw error;
        toast({
          title: "Berhasil",
          description: "Data kalkulasi biaya gizi berhasil diperbarui",
        });
      } else {
        const { error } = await tenantSupabase
          .from('kalkulasi_biaya_gizi')
          .insert([submitData]);

        if (error) throw error;
        toast({
          title: "Berhasil",
          description: "Data kalkulasi biaya gizi berhasil ditambahkan",
        });
      }

      setIsDialogOpen(false);
      setEditingItem(null);
      resetForm();
      fetchData();
    } catch (error) {
      console.error('Error saving data:', error);
      toast({
        title: "Error",
        description: "Gagal menyimpan data kalkulasi biaya gizi",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (item: KalkulasiBiayaGiziData) => {
    setEditingItem(item);
    const svip = item.jumlah_svip || 0;
    const vip = item.jumlah_vip || 0;
    const kelasI = item.jumlah_kelas_i || 0;
    const kelasII = item.jumlah_kelas_ii || 0;
    const kelasIII = item.jumlah_kelas_iii || 0;
    const totalJumlah = calculateJumlah(svip, vip, kelasI, kelasII, kelasIII);

    setFormData({
      tahun: item.tahun,
      kode: item.kode,
      jenis_makanan: item.jenis_makanan,
      jumlah: totalJumlah,
      jumlah_svip: svip,
      jumlah_vip: vip,
      jumlah_kelas_i: kelasI,
      jumlah_kelas_ii: kelasII,
      jumlah_kelas_iii: kelasIII,
      waktu_meracik: item.waktu_meracik,
      waktu_memasak: item.waktu_memasak,
      waktu_menata: item.waktu_menata,
      bahan_porsi: item.bahan_porsi || [],
      dasar_alokasi_waktu: item.dasar_alokasi_waktu,
      biaya_gaji_tunjangan: item.biaya_gaji_tunjangan,
      biaya_jasa_pelayanan: item.biaya_jasa_pelayanan,
      biaya_obat: item.biaya_obat,
      biaya_bhp: item.biaya_bhp,
      biaya_makan_karyawan: item.biaya_makan_karyawan,
      biaya_makan_pasien: item.biaya_makan_pasien,
      biaya_rumah_tangga: item.biaya_rumah_tangga,
      biaya_cetak: item.biaya_cetak,
      biaya_atk: item.biaya_atk,
      biaya_listrik: item.biaya_listrik,
      biaya_air: item.biaya_air,
      biaya_telp: item.biaya_telp,
      biaya_pemeliharaan_bangunan: item.biaya_pemeliharaan_bangunan,
      biaya_pemeliharaan_alat_medis: item.biaya_pemeliharaan_alat_medis,
      biaya_pemeliharaan_alat_non_medis: item.biaya_pemeliharaan_alat_non_medis,
      biaya_operasional_lainnya: item.biaya_operasional_lainnya,
      biaya_penyusutan_gedung: item.biaya_penyusutan_gedung,
      biaya_penyusutan_jaringan: item.biaya_penyusutan_jaringan,
      biaya_penyusutan_alat_medis: item.biaya_penyusutan_alat_medis,
      biaya_penyusutan_alat_non_medis: item.biaya_penyusutan_alat_non_medis,
      biaya_pendidikan_pelatihan: item.biaya_pendidikan_pelatihan,
      biaya_laundry: item.biaya_laundry,
      biaya_sterilisasi: item.biaya_sterilisasi,
      biaya_tidak_langsung_terdistribusi: item.biaya_tidak_langsung_terdistribusi,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus data ini?')) return;

    try {
      setLoading(true);
      const { error } = await tenantSupabase
        .from('kalkulasi_biaya_gizi')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast({
        title: "Berhasil",
        description: "Data kalkulasi biaya gizi berhasil dihapus",
      });
      fetchData();
    } catch (error) {
      console.error('Error deleting data:', error);
      toast({
        title: "Error",
        description: "Gagal menghapus data kalkulasi biaya gizi",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      tahun: currentYear,
      kode: "",
      jenis_makanan: "",
      jumlah: 0, // Auto-calculated
      jumlah_svip: 0,
      jumlah_vip: 0,
      jumlah_kelas_i: 0,
      jumlah_kelas_ii: 0,
      jumlah_kelas_iii: 0,
      waktu_meracik: 0,
      waktu_memasak: 0,
      waktu_menata: 0,
      bahan_porsi: [],
      dasar_alokasi_waktu: 0,
      biaya_gaji_tunjangan: 0,
      biaya_jasa_pelayanan: 0,
      biaya_obat: 0,
      biaya_bhp: 0,
      biaya_makan_karyawan: 0,
      biaya_makan_pasien: 0,
      biaya_rumah_tangga: 0,
      biaya_cetak: 0,
      biaya_atk: 0,
      biaya_listrik: 0,
      biaya_air: 0,
      biaya_telp: 0,
      biaya_pemeliharaan_bangunan: 0,
      biaya_pemeliharaan_alat_medis: 0,
      biaya_pemeliharaan_alat_non_medis: 0,
      biaya_operasional_lainnya: 0,
      biaya_penyusutan_gedung: 0,
      biaya_penyusutan_jaringan: 0,
      biaya_penyusutan_alat_medis: 0,
      biaya_penyusutan_alat_non_medis: 0,
      biaya_pendidikan_pelatihan: 0,
      biaya_laundry: 0,
      biaya_sterilisasi: 0,
      biaya_tidak_langsung_terdistribusi: 0,
    });
  };

  const handleMenuGiziChange = (kode: string) => {
    const selectedMenu = menuGizi.find(menu => menu.kode_makanan === kode);
    if (selectedMenu) {
      setFormData(prev => ({
        ...prev,
        kode: selectedMenu.kode_makanan,
        jenis_makanan: selectedMenu.nama_makanan,
      }));
    }
  };

  // Auto-calculate jumlah when any kelas column changes
  const calculateJumlah = (svip: number, vip: number, kelasI: number, kelasII: number, kelasIII: number) => {
    return svip + vip + kelasI + kelasII + kelasIII;
  };

  // Handle kelas input changes with auto-calculation
  const handleKelasChange = (field: string, value: number) => {
    setFormData(prev => {
      const newData = { ...prev, [field]: value };
      const totalJumlah = calculateJumlah(
        newData.jumlah_svip,
        newData.jumlah_vip,
        newData.jumlah_kelas_i,
        newData.jumlah_kelas_ii,
        newData.jumlah_kelas_iii
      );
      return { ...newData, jumlah: totalJumlah };
    });
  };


  const handleMenuClickForBahan = (menu: MenuGizi) => {
    setSelectedMenuForBahan(menu);
    setIsBahanPorsiDialogOpen(true);
  };

  const handleUpdateWaktu = (item: KalkulasiBiayaGiziData) => {
    setSelectedItemForWaktu(item);
    setIsUpdateWaktuDialogOpen(true);
  };

  const handleSaveWaktu = async (waktuData: { waktu_meracik: number; waktu_memasak: number; waktu_menata: number }) => {
    if (!selectedItemForWaktu) return;

    try {
      setLoading(true);
      const { error } = await tenantSupabase
        .from('kalkulasi_biaya_gizi')
        .update({
          waktu_meracik: waktuData.waktu_meracik,
          waktu_memasak: waktuData.waktu_memasak,
          waktu_menata: waktuData.waktu_menata,
        })
        .eq('id', selectedItemForWaktu.id);

      if (error) throw error;

      toast({
        title: "Berhasil",
        description: "Waktu berhasil diperbarui",
      });

      setIsUpdateWaktuDialogOpen(false);
      setSelectedItemForWaktu(null);
      fetchData();
    } catch (error) {
      console.error('Error updating waktu:', error);
      toast({
        title: "Error",
        description: "Gagal memperbarui waktu",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getDefaultWaktu = (jenisMakanan: string) => {
    const lowerJenis = jenisMakanan.toLowerCase();
    if (lowerJenis.includes('cair') || lowerJenis.includes('saring')) {
      return { meracik: 15, memasak: 10, menata: 4 };
    } else {
      return { meracik: 20, memasak: 25, menata: 4 };
    }
  };

  const downloadTemplate = () => {
    const templateData = [
      {
        'Kode': 'gz.001',
        'Jenis_Makanan': 'Makanan Biasa nasi VVIP',
        'Satuan': 'porsi',
        'Jumlah_SVIP': 10,
        'Jumlah_VIP': 20,
        'Jumlah_Kelas_I': 30,
        'Jumlah_Kelas_II': 25,
        'Jumlah_Kelas_III': 15,
        'Waktu_Meracik (menit)': 15,
        'Waktu_Memasak (menit)': 30,
        'Waktu_Menata (menit)': 10,
        'Bahan_Porsi': 'Beras:0.35kg;Lauk hewani:4potong'
      }
    ];

    const ws = XLSX.utils.json_to_sheet(templateData);

    // Set column widths for better readability (removed Waktu_Total column)
    ws['!cols'] = [
      { width: 10 }, // Kode
      { width: 25 }, // Jenis_Makanan
      { width: 10 }, // Satuan
      { width: 12 }, // Jumlah_SVIP
      { width: 12 }, // Jumlah_VIP
      { width: 12 }, // Jumlah_Kelas_I
      { width: 12 }, // Jumlah_Kelas_II
      { width: 12 }, // Jumlah_Kelas_III
      { width: 15 }, // Waktu_Meracik
      { width: 15 }, // Waktu_Memasak
      { width: 15 }, // Waktu_Menata
      { width: 30 }  // Bahan_Porsi
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Template');
    XLSX.writeFile(wb, 'template_kalkulasi_biaya_gizi.xlsx');
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setLoading(true);
      setImportProgress(0);
      setImportStatus('Membaca file Excel...');

      const data = await file.arrayBuffer();
      setImportProgress(20);
      setImportStatus('Memproses data...');

      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      // Validate that we have data
      if (!jsonData || jsonData.length === 0) {
        throw new Error('File tidak mengandung data atau format tidak valid');
      }

      setImportProgress(40);
      setImportStatus('Validasi data...');

      // Get valid kode from menu_gizi
      const validKodes = menuGizi.map(menu => menu.kode_makanan);

      const importData = jsonData.map((row: any, index: number) => {
        const svip = Number(row['Jumlah_SVIP']) || 0;
        const vip = Number(row['Jumlah_VIP']) || 0;
        const kelasI = Number(row['Jumlah_Kelas_I']) || 0;
        const kelasII = Number(row['Jumlah_Kelas_II']) || 0;
        const kelasIII = Number(row['Jumlah_Kelas_III']) || 0;
        const totalJumlah = svip + vip + kelasI + kelasII + kelasIII;
        const waktuMeracik = Number(row['Waktu_Meracik (menit)']) || 0;
        const waktuMemasak = Number(row['Waktu_Memasak (menit)']) || 0;
        const waktuMenata = Number(row['Waktu_Menata (menit)']) || 0;
        const waktuTotal = waktuMeracik + waktuMemasak + waktuMenata;
        const kode = row['Kode'] || '';
        const jenisMakanan = row['Jenis_Makanan'] || '';

        // Validate kode
        if (!kode) {
          throw new Error(`Baris ${index + 2}: Kode tidak boleh kosong`);
        }

        if (!validKodes.includes(kode)) {
          throw new Error(`Baris ${index + 2}: Kode "${kode}" tidak ditemukan di menu gizi`);
        }

        if (!jenisMakanan) {
          throw new Error(`Baris ${index + 2}: Jenis makanan tidak boleh kosong`);
        }

        return {
          tahun: currentYear,
          kode: kode,
          jenis_makanan: jenisMakanan,
          // jumlah, waktu_total, hasil_kali_waktu, unit_cost_per_porsi are generated columns - don't include
          jumlah_svip: svip,
          jumlah_vip: vip,
          jumlah_kelas_i: kelasI,
          jumlah_kelas_ii: kelasII,
          jumlah_kelas_iii: kelasIII,
          waktu_meracik: waktuMeracik,
          waktu_memasak: waktuMemasak,
          waktu_menata: waktuMenata,
          bahan_porsi: row['Bahan_Porsi'] || '',
          dasar_alokasi_waktu: 0,
          biaya_gaji_tunjangan: 0,
          biaya_jasa_pelayanan: 0,
          biaya_obat: 0,
          biaya_bhp: 0,
          biaya_makan_karyawan: 0,
          biaya_makan_pasien: 0,
          biaya_rumah_tangga: 0,
          biaya_cetak: 0,
          biaya_atk: 0,
          biaya_listrik: 0,
          biaya_air: 0,
          biaya_telp: 0,
          biaya_pemeliharaan_bangunan: 0,
          biaya_pemeliharaan_alat_medis: 0,
          biaya_pemeliharaan_alat_non_medis: 0,
          biaya_operasional_lainnya: 0,
          biaya_penyusutan_gedung: 0,
          biaya_penyusutan_jaringan: 0,
          biaya_penyusutan_alat_medis: 0,
          biaya_penyusutan_alat_non_medis: 0,
          biaya_pendidikan_pelatihan: 0,
          biaya_laundry: 0,
          biaya_sterilisasi: 0,
          biaya_tidak_langsung_terdistribusi: 0,
        };
      });

      setImportProgress(60);
      setImportStatus('Menyimpan ke database...');

      console.log('Importing data:', importData);

      const { error } = await tenantSupabase
        .from('kalkulasi_biaya_gizi')
        .insert(importData);

      if (error) {
        console.error('Supabase error:', error);
        throw new Error(`Database error: ${error.message}`);
      }

      setImportProgress(100);
      setImportStatus('Import selesai!');

      toast({
        title: "Berhasil",
        description: `${importData.length} data berhasil diimpor`,
      });

      fetchData();

      // Reset progress after 2 seconds
      setTimeout(() => {
        setImportProgress(0);
        setImportStatus('');
      }, 2000);
    } catch (error) {
      console.error('Error importing data:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast({
        title: "Error",
        description: `Gagal mengimpor data: ${errorMessage}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setImportProgress(0);
      setImportStatus('');
    }
  };

  const calculateTotalBiaya = (item: KalkulasiBiayaGiziData) => {
    return (
      (item.biaya_gaji_tunjangan || 0) +
      (item.biaya_jasa_pelayanan || 0) +
      (item.biaya_obat || 0) +
      (item.biaya_bhp || 0) +
      (item.biaya_makan_karyawan || 0) +
      (item.biaya_makan_pasien || 0) +
      (item.biaya_rumah_tangga || 0) +
      (item.biaya_cetak || 0) +
      (item.biaya_atk || 0) +
      (item.biaya_listrik || 0) +
      (item.biaya_air || 0) +
      (item.biaya_telp || 0) +
      (item.biaya_pemeliharaan_bangunan || 0) +
      (item.biaya_pemeliharaan_alat_medis || 0) +
      (item.biaya_pemeliharaan_alat_non_medis || 0) +
      (item.biaya_operasional_lainnya || 0) +
      (item.biaya_penyusutan_gedung || 0) +
      (item.biaya_penyusutan_jaringan || 0) +
      (item.biaya_penyusutan_alat_medis || 0) +
      (item.biaya_penyusutan_alat_non_medis || 0) +
      (item.biaya_pendidikan_pelatihan || 0) +
      (item.biaya_laundry || 0) +
      (item.biaya_sterilisasi || 0) +
      (item.biaya_tidak_langsung_terdistribusi || 0)
    );
  };

  const calculateTotalPorsi = (item: KalkulasiBiayaGiziData) => {
    return (
      (item.jumlah_svip || 0) +
      (item.jumlah_vip || 0) +
      (item.jumlah_kelas_i || 0) +
      (item.jumlah_kelas_ii || 0) +
      (item.jumlah_kelas_iii || 0)
    );
  };

  // Filter bahan porsi berdasarkan pencarian jenis makanan
  const filteredBahanPorsi = bahanPorsi.filter(item =>
    searchJenisMakanan === '' ||
    item.jenis_makanan.toLowerCase().includes(searchJenisMakanan.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Kalkulasi Biaya Gizi</h1>
        <p className="text-muted-foreground">
          Hitung biaya gizi untuk pasien rawat inap
        </p>
      </div>

      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <Button onClick={downloadTemplate} variant="template">
            <Download className="h-4 w-4 mr-2" />
            Unduh Template Impor
          </Button>
          <label htmlFor="file-upload">
            <Button asChild variant="import">
              <span>
                <Upload className="h-4 w-4 mr-2" />
                Impor Data
              </span>
            </Button>
          </label>
          <input
            id="file-upload"
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileUpload}
            className="hidden"
          />
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-slate-700 whitespace-nowrap">Tahun:</label>
            <Select
              value={currentYear.toString()}
              onValueChange={(value) => setCurrentYear(parseInt(value))}
            >
              <SelectTrigger className="w-[100px] h-9 bg-white border-slate-200">
                <SelectValue placeholder="Tahun" />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 7 }, (_, i) => new Date().getFullYear() - 3 + i).map((year) => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2 flex-grow max-w-sm">
            <div className="relative w-full">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
              <Input
                placeholder="Cari jenis makanan..."
                className="pl-9 h-9 bg-white border-slate-200"
                value={searchJenisMakanan}
                onChange={(e) => setSearchJenisMakanan(e.target.value)}
              />
            </div>
          </div>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button
                onClick={() => {
                  setEditingItem(null);
                  resetForm();
                }}
                className="bg-blue-600 hover:bg-blue-700 h-9"
              >
                <Plus className="w-4 h-4 mr-2" />
                Tambah Data Gizi
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingItem ? 'Edit Kalkulasi Biaya Gizi' : 'Tambah Kalkulasi Biaya Gizi'}
                </DialogTitle>
                <DialogDescription>
                  {editingItem ? 'Perbarui data kalkulasi biaya gizi' : 'Tambahkan data kalkulasi biaya gizi baru'}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <Tabs defaultValue="basic" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="basic">Data Dasar</TabsTrigger>
                    <TabsTrigger value="time">Waktu</TabsTrigger>
                  </TabsList>

                  <TabsContent value="basic" className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="tahun">Tahun</Label>
                        <Input
                          id="tahun"
                          type="number"
                          value={formData.tahun}
                          onChange={(e) => setFormData(prev => ({ ...prev, tahun: Number(e.target.value) }))}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="kode">Kode Menu Gizi</Label>
                        <Select onValueChange={handleMenuGiziChange} value={formData.kode}>
                          <SelectTrigger>
                            <SelectValue placeholder="Pilih kode menu gizi" />
                          </SelectTrigger>
                          <SelectContent>
                            {menuGizi.map((menu) => (
                              <SelectItem key={menu.id} value={menu.kode_makanan}>
                                {menu.kode_makanan} - {menu.nama_makanan}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="jenis_makanan">Jenis Makanan</Label>
                      <Input
                        id="jenis_makanan"
                        value={formData.jenis_makanan}
                        readOnly
                        className="bg-gray-50"
                        placeholder="Otomatis terisi dari pilihan kode menu gizi"
                      />
                    </div>
                    <div>
                      <Label htmlFor="jumlah">Jumlah Porsi (Total)</Label>
                      <Input
                        id="jumlah"
                        type="number"
                        value={formData.jumlah}
                        readOnly
                        className="bg-gray-50"
                        placeholder="Otomatis dihitung dari jumlah kelas"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="jumlah_svip">Jumlah SVIP</Label>
                        <Input
                          id="jumlah_svip"
                          type="number"
                          value={formData.jumlah_svip}
                          onChange={(e) => handleKelasChange('jumlah_svip', Number(e.target.value))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="jumlah_vip">Jumlah VIP</Label>
                        <Input
                          id="jumlah_vip"
                          type="number"
                          value={formData.jumlah_vip}
                          onChange={(e) => handleKelasChange('jumlah_vip', Number(e.target.value))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="jumlah_kelas_i">Jumlah Kelas I</Label>
                        <Input
                          id="jumlah_kelas_i"
                          type="number"
                          value={formData.jumlah_kelas_i}
                          onChange={(e) => handleKelasChange('jumlah_kelas_i', Number(e.target.value))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="jumlah_kelas_ii">Jumlah Kelas II</Label>
                        <Input
                          id="jumlah_kelas_ii"
                          type="number"
                          value={formData.jumlah_kelas_ii}
                          onChange={(e) => handleKelasChange('jumlah_kelas_ii', Number(e.target.value))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="jumlah_kelas_iii">Jumlah Kelas III</Label>
                        <Input
                          id="jumlah_kelas_iii"
                          type="number"
                          value={formData.jumlah_kelas_iii}
                          onChange={(e) => handleKelasChange('jumlah_kelas_iii', Number(e.target.value))}
                        />
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="time" className="space-y-4">
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="waktu_meracik">Waktu Meracik (menit)</Label>
                        <Input
                          id="waktu_meracik"
                          type="number"
                          value={formData.waktu_meracik}
                          onChange={(e) => setFormData(prev => ({ ...prev, waktu_meracik: Number(e.target.value) }))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="waktu_memasak">Waktu Memasak (menit)</Label>
                        <Input
                          id="waktu_memasak"
                          type="number"
                          value={formData.waktu_memasak}
                          onChange={(e) => setFormData(prev => ({ ...prev, waktu_memasak: Number(e.target.value) }))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="waktu_menata">Waktu Menata (menit)</Label>
                        <Input
                          id="waktu_menata"
                          type="number"
                          value={formData.waktu_menata}
                          onChange={(e) => setFormData(prev => ({ ...prev, waktu_menata: Number(e.target.value) }))}
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="dasar_alokasi_waktu">Dasar Alokasi Waktu</Label>
                      <Input
                        id="dasar_alokasi_waktu"
                        type="number"
                        value={formData.dasar_alokasi_waktu}
                        onChange={(e) => setFormData(prev => ({ ...prev, dasar_alokasi_waktu: Number(e.target.value) }))}
                      />
                    </div>
                  </TabsContent>

                </Tabs>

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Batal
                  </Button>
                  <Button type="submit" disabled={loading}>
                    {loading ? 'Menyimpan...' : editingItem ? 'Perbarui' : 'Simpan'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
          <Button variant="report" onClick={handleDownloadDetail}>
            <Download className="h-4 w-4 mr-2" />
            Unduh Laporan
          </Button>
          <Button
            disabled={loading || recalculating}
            onClick={handleManualRecalculation}
            className="bg-purple-600 text-white hover:bg-purple-700"
          >
            {recalculating ? (
              <span className="flex items-center">
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                {recalcProgress.message || 'Rekalkulasi...'}
              </span>
            ) : (
              <span className="flex items-center">
                <Calculator className="mr-2 h-4 w-4" />
                Rekalkulasi Semua
              </span>
            )}
          </Button>
        </div>

        {recalculating && (
          <div className="rounded-lg border border-purple-200 bg-purple-50 px-3 py-2 text-sm text-purple-700">
            <div className="flex items-center space-x-2">
              <div className="h-2 w-full rounded-full bg-purple-200">
                <div
                  className="h-2 rounded-full bg-purple-600 transition-all duration-300"
                  style={{ width: `${(recalcProgress.step / recalcProgress.total) * 100}%` }}
                ></div>
              </div>
              <span className="text-xs font-medium">
                {recalcProgress.step}/{recalcProgress.total}
              </span>
            </div>
            <div className="mt-1 text-xs">
              {recalcProgress.message}
            </div>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3">
          <Input
            id="filter-jenis"
            placeholder="cth: Kelas I / VIP / VVIP / nasi"
            value={exportJenisFilter}
            onChange={(e) => setExportJenisFilter(e.target.value)}
            className="w-64"
          />
        </div>
      </div>

      <Card className="bg-[#F8FBFF] border border-sky-100 shadow-sm">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-semibold text-slate-800">
            Ringkasan Average Unit Cost per Kelas - {currentYear}
          </CardTitle>
          <CardDescription className="text-slate-600">
            Nilai rata-rata dihitung dari total biaya (jumlah × unit cost) per kelas dibagi total porsi per kelas, tersinkron otomatis dengan database.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-5">
            <div className="rounded-xl border border-sky-100 bg-gradient-to-br from-sky-50 to-sky-100 p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold text-sky-700">SVIP/VVIP</div>
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-sky-500/15 text-sky-600">
                  <span className="font-semibold">SV</span>
                </div>
              </div>
              <div className="mt-3 text-2xl font-bold text-sky-900">
                Rp {aucSummary.svip.toLocaleString('id-ID')}
              </div>
            </div>
            <div className="rounded-xl border border-indigo-100 bg-gradient-to-br from-indigo-50 to-indigo-100 p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold text-indigo-700">VIP</div>
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-500/15 text-indigo-600">
                  <span className="font-semibold">VIP</span>
                </div>
              </div>
              <div className="mt-3 text-2xl font-bold text-indigo-900">
                Rp {aucSummary.vip.toLocaleString('id-ID')}
              </div>
            </div>
            <div className="rounded-xl border border-emerald-100 bg-gradient-to-br from-emerald-50 to-emerald-100 p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold text-emerald-700">Kelas I</div>
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600">
                  <span className="font-semibold">I</span>
                </div>
              </div>
              <div className="mt-3 text-2xl font-bold text-emerald-900">
                Rp {aucSummary.i.toLocaleString('id-ID')}
              </div>
            </div>
            <div className="rounded-xl border border-amber-100 bg-gradient-to-br from-amber-50 to-amber-100 p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold text-amber-700">Kelas II</div>
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-500/15 text-amber-600">
                  <span className="font-semibold">II</span>
                </div>
              </div>
              <div className="mt-3 text-2xl font-bold text-amber-900">
                Rp {aucSummary.ii.toLocaleString('id-ID')}
              </div>
            </div>
            <div className="rounded-xl border border-rose-100 bg-gradient-to-br from-rose-50 to-rose-100 p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold text-rose-700">Kelas III</div>
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-rose-500/15 text-rose-600">
                  <span className="font-semibold">III</span>
                </div>
              </div>
              <div className="mt-3 text-2xl font-bold text-rose-900">
                Rp {aucSummary.iii.toLocaleString('id-ID')}
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="report"
              onClick={() => {
                void handleDownloadSummary();
              }}
              disabled={downloadingSummary}
            >
              {downloadingSummary ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Download className="h-4 w-4 mr-2" />
              )}
              {downloadingSummary ? "Menyiapkan..." : "Unduh Ringkasan AUC"}
            </Button>
            <Button
              variant="report"
              onClick={() => {
                void handleDownloadDetail();
              }}
              disabled={downloadingDetail}
            >
              {downloadingDetail ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Download className="h-4 w-4 mr-2" />
              )}
              {downloadingDetail ? "Menyiapkan..." : "Unduh Data Detail"}
            </Button>
            <Button
              variant="report"
              onClick={() => {
                void handleDownloadDetailBiaya();
              }}
              disabled={downloadingDetailBiaya}
            >
              {downloadingDetailBiaya ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Download className="h-4 w-4 mr-2" />
              )}
              {downloadingDetailBiaya ? "Menyiapkan..." : "Unduh Laporan Detail Biaya"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Import Progress */}
      {importProgress > 0 && (
        <Card className="border border-slate-200 bg-slate-50 shadow-sm">
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>{importStatus}</span>
                <span>{importProgress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${importProgress}%` }}
                ></div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="border border-emerald-100 bg-[#F7FBF9] shadow-sm">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-semibold text-slate-800">Data Kalkulasi Biaya Gizi - Tahun {currentYear}</CardTitle>
          <CardDescription className="text-slate-600">
            Daftar kalkulasi biaya gizi dengan perhitungan otomatis unit cost per porsi
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-[#0f766e]">
                  <TableRow className="bg-[#0f766e] hover:bg-[#0f766e]">
                    <TableHead className="text-white font-semibold">Jenis Makanan</TableHead>
                    <TableHead className="text-white font-semibold">Total Porsi</TableHead>
                    <TableHead className="text-white font-semibold">Waktu (Meracik/Memasak/Menata)</TableHead>
                    <TableHead className="text-white font-semibold">Bahan Porsi</TableHead>
                    <TableHead className="text-white font-semibold">Biaya Bahan Porsi</TableHead>
                    <TableHead className="text-white font-semibold">Unit Cost/Porsi</TableHead>
                    <TableHead className="text-white font-semibold">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.filter(item =>
                    searchJenisMakanan === '' ||
                    item.jenis_makanan?.toLowerCase().includes(searchJenisMakanan.toLowerCase()) ||
                    item.kode?.toLowerCase().includes(searchJenisMakanan.toLowerCase())
                  ).map((item) => {
                    const hasBahanPorsi = menusWithBahan.has(item.jenis_makanan);

                    // Debug logging
                    console.log('Rendering item:', {
                      kode: item.kode,
                      jenis_makanan: item.jenis_makanan,
                      length: item.jenis_makanan?.length
                    });

                    return (
                      <TableRow key={item.id}>
                        <TableCell className="min-w-[200px] max-w-[300px]">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium" title={item.jenis_makanan}>{item.jenis_makanan || 'N/A'}</span>
                            <div className="flex gap-1 ml-2">
                              <Button
                                size="sm"
                                variant={hasBahanPorsi ? "default" : "outline"}
                                className={`${hasBahanPorsi
                                  ? "bg-green-600 hover:bg-green-700 text-white"
                                  : "hover:bg-gray-50"
                                  } text-xs px-2 py-1 min-w-[60px]`}
                                onClick={() => {
                                  const selectedMenu = menuGizi.find(menu => menu.nama_makanan === item.jenis_makanan);
                                  if (selectedMenu) {
                                    handleMenuClickForBahan(selectedMenu);
                                  }
                                }}
                              >
                                <Calculator className="h-3 w-3 mr-1" />
                                Bahan
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-2 py-1 min-w-[60px]"
                                onClick={() => handleUpdateWaktu(item)}
                              >
                                <Clock className="h-3 w-3 mr-1" />
                                Waktu
                              </Button>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {calculateTotalPorsi(item)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div className="flex gap-2">
                              <Badge variant="outline" className="text-xs">
                                Meracik: {item.waktu_meracik}m
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                Memasak: {item.waktu_memasak}m
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                Menata: {item.waktu_menata}m
                              </Badge>
                            </div>
                            <div className="text-xs text-muted-foreground mt-1">
                              Total: {item.waktu_total}m
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {item.bahan_porsi && Array.isArray(item.bahan_porsi) && item.bahan_porsi.length > 0 ? (
                              <div className="space-y-1">
                                {item.bahan_porsi.slice(0, 2).map((bahan, index) => (
                                  <div key={index} className="text-xs">
                                    {bahan.nama_barang}: {bahan.konsumsi} {bahan.satuan}
                                  </div>
                                ))}
                                {item.bahan_porsi.length > 2 && (
                                  <div className="text-xs text-muted-foreground">
                                    +{item.bahan_porsi.length - 2} bahan lainnya
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span className="text-muted-foreground">Belum ada bahan</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            Rp {item.biaya_bahan_porsi_numeric?.toLocaleString('id-ID') || '0'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">
                            Rp {item.unit_cost_per_porsi?.toLocaleString('id-ID') || '0'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button size="sm" variant="edit" onClick={() => handleEdit(item)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="destructive" onClick={() => handleDelete(item.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
              {data.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  Belum ada data kalkulasi biaya gizi untuk tahun {currentYear}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bahan Porsi Management */}
      <Card className="border border-amber-100 bg-[#FFF8F1] shadow-sm">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-semibold text-slate-800">Manajemen Bahan Porsi</CardTitle>
          <CardDescription className="text-slate-600">
            Daftar bahan porsi dengan perhitungan otomatis biaya bahan porsi (integer)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Search Section */}
          <div className="flex justify-between items-center mb-4">
            <Badge variant="outline" className="px-3 py-1">
              Menampilkan {filteredBahanPorsi.length} dari {bahanPorsi.length} Menu Gizi
            </Badge>
            {searchJenisMakanan && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSearchJenisMakanan('')}
                className="text-slate-500 hover:text-slate-700"
              >
                Reset Pencarian
              </Button>
            )}
          </div>
          {/* Bahan Porsi Form Dialog */}
          <Dialog open={isBahanPorsiDialogOpen} onOpenChange={setIsBahanPorsiDialogOpen}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Manajemen Bahan Porsi</DialogTitle>
                <DialogDescription>
                  {selectedMenuForBahan ? `Tambah/Edit bahan porsi untuk: ${selectedMenuForBahan.nama_makanan}` : 'Pilih jenis makanan terlebih dahulu'}
                </DialogDescription>
              </DialogHeader>
              {selectedMenuForBahan && (
                <BahanPorsiForm
                  jenisMakanan={selectedMenuForBahan.nama_makanan}
                  kode={selectedMenuForBahan.kode_makanan}
                  onSave={async (dataArray) => {
                    try {
                      // 1. Simpan ke tabel bahan_porsi (untuk form management)
                      const { error: bahanError } = await supabase
                        .from('bahan_porsi')
                        .insert(dataArray);

                      if (bahanError) throw bahanError;

                      // 2. Simpan ke kolom bahan_porsi di kalkulasi_biaya_gizi (untuk tampilan utama)
                      // Format data untuk JSONB dengan informasi lengkap
                      const dataForKalkulasi = dataArray.map(item => ({
                        id: Math.random().toString(),
                        kode: selectedMenuForBahan.kode_makanan,
                        jenis_makanan: selectedMenuForBahan.nama_makanan,
                        nama_barang: item.nama_barang,
                        satuan: item.satuan,
                        harga: item.harga,
                        konsumsi: item.konsumsi,
                        harga_bah: Math.round(item.konsumsi * item.harga),
                        biaya_produksi: item.biaya_produksi,
                        biaya_bahan_porsi: Math.round(item.konsumsi * item.harga) + Math.round(item.konsumsi * item.harga * item.biaya_produksi / 100),
                        data_barang_gizi_id: item.id,
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString()
                      }));

                      const { error: kalkulasiError } = await tenantSupabase
                        .from('kalkulasi_biaya_gizi')
                        .update({
                          bahan_porsi: dataForKalkulasi,
                          biaya_bahan_porsi_numeric: dataForKalkulasi.reduce((sum, item) => sum + item.biaya_bahan_porsi, 0)
                        })
                        .eq('kode', selectedMenuForBahan.kode_makanan)
                        .eq('jenis_makanan', selectedMenuForBahan.nama_makanan);

                      if (kalkulasiError) throw kalkulasiError;

                      toast({
                        title: "Berhasil",
                        description: `${dataArray.length} bahan porsi berhasil ditambahkan`,
                      });

                      // 3. Refresh kedua data
                      fetchBahanPorsi();
                      fetchData(); // Refresh data utama agar tampilan langsung update
                      setIsBahanPorsiDialogOpen(false);
                    } catch (error) {
                      console.error('Error saving bahan porsi:', error);
                      const errorMessage = error instanceof Error ? error.message : 'Gagal menyimpan bahan porsi';
                      toast({
                        title: "Error",
                        description: errorMessage,
                        variant: "destructive",
                      });
                    }
                  }}
                  onCancel={() => setIsBahanPorsiDialogOpen(false)}
                />
              )}
            </DialogContent>
          </Dialog>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-[#0f766e]">
                <TableRow className="bg-[#0f766e] hover:bg-[#0f766e]">
                  <TableHead className="text-white font-semibold">Kode</TableHead>
                  <TableHead className="text-white font-semibold">Jenis Makanan</TableHead>
                  <TableHead className="text-white font-semibold">Nama Barang</TableHead>
                  <TableHead className="text-white font-semibold">Satuan</TableHead>
                  <TableHead className="text-white font-semibold">Konsumsi</TableHead>
                  <TableHead className="text-white font-semibold">Harga</TableHead>
                  <TableHead className="text-white font-semibold">Harga Bahan</TableHead>
                  <TableHead className="text-white font-semibold">Biaya Produksi</TableHead>
                  <TableHead className="text-white font-semibold">Biaya Bahan Porsi</TableHead>
                  <TableHead className="text-white font-semibold">Sumber Data</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBahanPorsi.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <Badge variant="outline">{item.kode}</Badge>
                    </TableCell>
                    <TableCell>{item.jenis_makanan}</TableCell>
                    <TableCell>{item.nama_barang}</TableCell>
                    <TableCell>{item.satuan}</TableCell>
                    <TableCell>{item.konsumsi}</TableCell>
                    <TableCell>Rp {item.harga.toLocaleString('id-ID')}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        Rp {item.harga_bah.toLocaleString('id-ID')}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {item.biaya_produksi || 15}%
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="default" className="bg-green-600">
                        Rp {item.biaya_bahan_porsi.toLocaleString('id-ID')}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={item.sumber_data === 'Auto-filled from data_barang_gizi' ? 'default' : 'outline'}>
                        {item.sumber_data || 'Manual input'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {filteredBahanPorsi.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                {searchJenisMakanan ?
                  `Tidak ada bahan porsi yang cocok dengan pencarian "${searchJenisMakanan}"` :
                  'Belum ada data bahan porsi'
                }
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Update Waktu Dialog */}
      <Dialog open={isUpdateWaktuDialogOpen} onOpenChange={setIsUpdateWaktuDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Update Waktu</DialogTitle>
            <DialogDescription>
              {selectedItemForWaktu ? `Update waktu untuk: ${selectedItemForWaktu.jenis_makanan}` : 'Pilih item terlebih dahulu'}
            </DialogDescription>
          </DialogHeader>
          {selectedItemForWaktu && (
            <UpdateWaktuForm
              item={selectedItemForWaktu}
              onSave={handleSaveWaktu}
              onCancel={() => {
                setIsUpdateWaktuDialogOpen(false);
                setSelectedItemForWaktu(null);
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Update Waktu Form Component
interface UpdateWaktuFormProps {
  item: KalkulasiBiayaGiziData;
  onSave: (waktuData: { waktu_meracik: number; waktu_memasak: number; waktu_menata: number }) => void;
  onCancel: () => void;
}

const UpdateWaktuForm: React.FC<UpdateWaktuFormProps> = ({ item, onSave, onCancel }) => {
  const [waktuData, setWaktuData] = useState({
    waktu_meracik: item.waktu_meracik,
    waktu_memasak: item.waktu_memasak,
    waktu_menata: item.waktu_menata,
  });

  const getDefaultWaktu = (jenisMakanan: string) => {
    const lowerJenis = jenisMakanan.toLowerCase();
    if (lowerJenis.includes('cair') || lowerJenis.includes('saring')) {
      return { meracik: 15, memasak: 10, menata: 4 };
    } else {
      return { meracik: 20, memasak: 25, menata: 4 };
    }
  };

  const handleSetDefault = () => {
    const defaultWaktu = getDefaultWaktu(item.jenis_makanan);
    setWaktuData({
      waktu_meracik: defaultWaktu.meracik,
      waktu_memasak: defaultWaktu.memasak,
      waktu_menata: defaultWaktu.menata,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(waktuData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
        <div>
          <Label htmlFor="waktu_meracik">Waktu Meracik (menit)</Label>
          <Input
            id="waktu_meracik"
            type="number"
            value={waktuData.waktu_meracik}
            onChange={(e) => setWaktuData(prev => ({ ...prev, waktu_meracik: Number(e.target.value) }))}
            required
          />
        </div>
        <div>
          <Label htmlFor="waktu_memasak">Waktu Memasak (menit)</Label>
          <Input
            id="waktu_memasak"
            type="number"
            value={waktuData.waktu_memasak}
            onChange={(e) => setWaktuData(prev => ({ ...prev, waktu_memasak: Number(e.target.value) }))}
            required
          />
        </div>
        <div>
          <Label htmlFor="waktu_menata">Waktu Menata (menit)</Label>
          <Input
            id="waktu_menata"
            type="number"
            value={waktuData.waktu_menata}
            onChange={(e) => setWaktuData(prev => ({ ...prev, waktu_menata: Number(e.target.value) }))}
            required
          />
        </div>
      </div>

      <div className="flex items-center justify-between">
        <Button type="button" variant="outline" onClick={handleSetDefault}>
          Set Default
        </Button>
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Batal
          </Button>
          <Button type="submit">
            Simpan
          </Button>
        </div>
      </div>
    </form>
  );
};

export default KalkulasiBiayaGizi;



