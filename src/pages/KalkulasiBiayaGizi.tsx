import React, { useState, useEffect } from "react";
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
import { Download, Upload, Plus, Edit, Trash2, Calculator } from "lucide-react";
import * as XLSX from "xlsx";
import BahanPorsiForm from "@/components/BahanPorsiForm";

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
  const [data, setData] = useState<KalkulasiBiayaGiziData[]>([]);
  const [menuGizi, setMenuGizi] = useState<MenuGizi[]>([]);
  const [bahanPorsi, setBahanPorsi] = useState<BahanPorsi[]>([]);
  const [dataBarangGizi, setDataBarangGizi] = useState<DataBarangGizi[]>([]);
  const [loading, setLoading] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importStatus, setImportStatus] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<KalkulasiBiayaGiziData | null>(null);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [isBahanPorsiDialogOpen, setIsBahanPorsiDialogOpen] = useState(false);
  const [selectedMenuForBahan, setSelectedMenuForBahan] = useState<MenuGizi | null>(null);
  const [menusWithBahan, setMenusWithBahan] = useState<Set<string>>(new Set());
  const [bahanPorsiTotals, setBahanPorsiTotals] = useState<Map<string, number>>(new Map());
  const [searchJenisMakanan, setSearchJenisMakanan] = useState<string>('');
  const [isUpdateWaktuDialogOpen, setIsUpdateWaktuDialogOpen] = useState(false);
  const [selectedItemForWaktu, setSelectedItemForWaktu] = useState<KalkulasiBiayaGiziData | null>(null);
  const { toast } = useToast();

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
      try { supabase.removeChannel(channel); } catch (_) {}
    };
  }, [currentYear]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const { data: kalkulasiData, error } = await supabase
        .from('kalkulasi_biaya_gizi')
        .select('*')
        .eq('tahun', currentYear)
        .order('kode');

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

  const handleDownloadSummary = () => {
    const rows = [
      { kelas: 'SVIP/VVIP', average_unit_cost: aucSummary.svip },
      { kelas: 'VIP', average_unit_cost: aucSummary.vip },
      { kelas: 'Kelas I', average_unit_cost: aucSummary.i },
      { kelas: 'Kelas II', average_unit_cost: aucSummary.ii },
      { kelas: 'Kelas III', average_unit_cost: aucSummary.iii },
    ];
    downloadExcel(`ringkasan_auc_gizi_${currentYear}.xlsx`, rows);
  };

  const handleDownloadDetail = () => {
    const rows = data.map(d => ({
      tahun: d.tahun,
      kode: d.kode,
      jenis_makanan: d.jenis_makanan,
      jumlah: d.jumlah,
      jumlah_svip: d.jumlah_svip,
      jumlah_vip: d.jumlah_vip,
      jumlah_kelas_i: d.jumlah_kelas_i,
      jumlah_kelas_ii: d.jumlah_kelas_ii,
      jumlah_kelas_iii: d.jumlah_kelas_iii,
      unit_cost_per_porsi: d.unit_cost_per_porsi,
    }));
    downloadExcel(`detail_kalkulasi_gizi_${currentYear}.xlsx`, rows);
  };

  // Download laporan detail biaya (semua kolom biaya), dengan filter jenis makanan
  const handleDownloadDetailBiaya = async () => {
    try {
      const filter = exportJenisFilter?.trim();
      // Fetch fresh data from DB to ensure up-to-date export and include all columns
      let query = supabase
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

      const rowsMapped = filteredDb.map((d: any) => {
        // Compute biaya_bahan_porsi when numeric is missing using bahan_porsi JSON breakdown
        let biayaBahanPorsi = d.biaya_bahan_porsi_numeric || 0;
        if ((!biayaBahanPorsi || Number.isNaN(biayaBahanPorsi)) && Array.isArray(d.bahan_porsi)) {
          biayaBahanPorsi = d.bahan_porsi.reduce((sum: number, b: any) => sum + (Number(b?.biaya_bahan_porsi) || 0), 0);
        }

        return {
          tahun: d.tahun,
          kode: d.kode,
          jenis_makanan: d.jenis_makanan,
          jumlah: d.jumlah,
          unit_cost_per_porsi: d.unit_cost_per_porsi,
          biaya_gaji_tunjangan: d.biaya_gaji_tunjangan,
          biaya_jasa_pelayanan: d.biaya_jasa_pelayanan,
          biaya_obat: d.biaya_obat,
          biaya_bhp: d.biaya_bhp,
          biaya_makan_karyawan: d.biaya_makan_karyawan,
          biaya_makan_pasien: d.biaya_makan_pasien,
          biaya_rumah_tangga: d.biaya_rumah_tangga,
          biaya_cetak: d.biaya_cetak,
          biaya_atk: d.biaya_atk,
          biaya_listrik: d.biaya_listrik,
          biaya_air: d.biaya_air,
          biaya_telp: d.biaya_telp,
          biaya_pemeliharaan_bangunan: d.biaya_pemeliharaan_bangunan,
          biaya_pemeliharaan_alat_medis: d.biaya_pemeliharaan_alat_medis,
          biaya_pemeliharaan_alat_non_medis: d.biaya_pemeliharaan_alat_non_medis,
          biaya_operasional_lainnya: d.biaya_operasional_lainnya,
          biaya_penyusutan_gedung: d.biaya_penyusutan_gedung,
          biaya_penyusutan_jaringan: d.biaya_penyusutan_jaringan,
          biaya_penyusutan_alat_medis: d.biaya_penyusutan_alat_medis,
          biaya_penyusutan_alat_non_medis: d.biaya_penyusutan_alat_non_medis,
          biaya_pendidikan_pelatihan: d.biaya_pendidikan_pelatihan,
          biaya_laundry: d.biaya_laundry,
          biaya_sterilisasi: d.biaya_sterilisasi,
          biaya_tidak_langsung_terdistribusi: d.biaya_tidak_langsung_terdistribusi,
          biaya_bahan_porsi: biayaBahanPorsi,
        };
      });

      if (!rowsMapped.length) {
        toast({ title: 'Tidak ada data', description: 'Tidak ada data sesuai filter jenis makanan.', variant: 'destructive' });
        return;
      }
      downloadExcel(`detail_biaya_gizi_${currentYear}${filter ? `_filter_${filter}` : ''}.xlsx`, rowsMapped);
    } catch (e) {
      console.error('Export error:', e);
      toast({ title: 'Gagal mengunduh', description: 'Terjadi kesalahan saat menyiapkan laporan detail biaya.', variant: 'destructive' });
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
      
      // Calculate total biaya bahan porsi per jenis makanan
      const totals = new Map<string, number>();
      bahanData?.forEach(item => {
        const currentTotal = totals.get(item.jenis_makanan) || 0;
        totals.set(item.jenis_makanan, currentTotal + (item.biaya_bahan_porsi || 0));
      });
      setBahanPorsiTotals(totals);
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
        const { error } = await supabase
          .from('kalkulasi_biaya_gizi')
          .update(submitData)
          .eq('id', editingItem.id);

        if (error) throw error;
        toast({
          title: "Berhasil",
          description: "Data kalkulasi biaya gizi berhasil diperbarui",
        });
      } else {
        const { error } = await supabase
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
      const { error } = await supabase
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
      const { error } = await supabase
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

      const { error } = await supabase
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
      {/* Summary AUC per kelas + download */}
      <Card>
        <CardHeader>
          <CardTitle>Ringkasan Average Unit Cost per Kelas - {currentYear}</CardTitle>
          <CardDescription>
            Nilai rata-rata dihitung dari total biaya (jumlah × unit cost) per kelas dibagi total porsi per kelas, tersinkron otomatis dengan database.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="p-3 rounded-md border">
              <div className="text-xs text-muted-foreground">SVIP/VVIP</div>
              <div className="text-lg font-semibold">Rp {aucSummary.svip.toLocaleString('id-ID')}</div>
            </div>
            <div className="p-3 rounded-md border">
              <div className="text-xs text-muted-foreground">VIP</div>
              <div className="text-lg font-semibold">Rp {aucSummary.vip.toLocaleString('id-ID')}</div>
            </div>
            <div className="p-3 rounded-md border">
              <div className="text-xs text-muted-foreground">Kelas I</div>
              <div className="text-lg font-semibold">Rp {aucSummary.i.toLocaleString('id-ID')}</div>
            </div>
            <div className="p-3 rounded-md border">
              <div className="text-xs text-muted-foreground">Kelas II</div>
              <div className="text-lg font-semibold">Rp {aucSummary.ii.toLocaleString('id-ID')}</div>
            </div>
            <div className="p-3 rounded-md border">
              <div className="text-xs text-muted-foreground">Kelas III</div>
              <div className="text-lg font-semibold">Rp {aucSummary.iii.toLocaleString('id-ID')}</div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 mt-4">
            <Button onClick={handleDownloadSummary}>
              <Download className="h-4 w-4 mr-2" /> Unduh Ringkasan AUC
            </Button>
            <Button variant="outline" onClick={handleDownloadDetail}>
              <Download className="h-4 w-4 mr-2" /> Unduh Data Detail
            </Button>
            <Button variant="outline" onClick={handleDownloadDetailBiaya}>
              <Download className="h-4 w-4 mr-2" /> Unduh Laporan Detail Biaya
            </Button>
            <div className="ml-auto flex items-center gap-2">
              <Label htmlFor="filter-jenis" className="text-sm">Filter Jenis Makanan</Label>
              <Input
                id="filter-jenis"
                placeholder="cth: Kelas I / VIP / VVIP / nasi"
                value={exportJenisFilter}
                onChange={(e) => setExportJenisFilter(e.target.value)}
                className="w-64"
              />
            </div>
          </div>
        </CardContent>
      </Card>
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Kalkulasi Biaya Gizi</h1>
          <p className="text-muted-foreground">
            Hitung biaya gizi untuk pasien rawat inap
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={downloadTemplate} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Download Template
          </Button>
          <label htmlFor="file-upload">
            <Button asChild variant="outline">
              <span>
                <Upload className="h-4 w-4 mr-2" />
                Import Data
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
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => { setEditingItem(null); resetForm(); }}>
                <Plus className="h-4 w-4 mr-2" />
                Tambah Data
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
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="basic">Data Dasar</TabsTrigger>
                    <TabsTrigger value="time">Waktu</TabsTrigger>
                    <TabsTrigger value="cost">Biaya</TabsTrigger>
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

                  <TabsContent value="cost" className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="biaya_gaji_tunjangan">Biaya Gaji & Tunjangan</Label>
                        <Input
                          id="biaya_gaji_tunjangan"
                          type="number"
                          value={formData.biaya_gaji_tunjangan}
                          onChange={(e) => setFormData(prev => ({ ...prev, biaya_gaji_tunjangan: Number(e.target.value) }))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="biaya_jasa_pelayanan">Biaya Jasa Pelayanan</Label>
                        <Input
                          id="biaya_jasa_pelayanan"
                          type="number"
                          value={formData.biaya_jasa_pelayanan}
                          onChange={(e) => setFormData(prev => ({ ...prev, biaya_jasa_pelayanan: Number(e.target.value) }))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="biaya_obat">Biaya Obat</Label>
                        <Input
                          id="biaya_obat"
                          type="number"
                          value={formData.biaya_obat}
                          onChange={(e) => setFormData(prev => ({ ...prev, biaya_obat: Number(e.target.value) }))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="biaya_bhp">Biaya BHP</Label>
                        <Input
                          id="biaya_bhp"
                          type="number"
                          value={formData.biaya_bhp}
                          onChange={(e) => setFormData(prev => ({ ...prev, biaya_bhp: Number(e.target.value) }))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="biaya_makan_karyawan">Biaya Makan Karyawan</Label>
                        <Input
                          id="biaya_makan_karyawan"
                          type="number"
                          value={formData.biaya_makan_karyawan}
                          onChange={(e) => setFormData(prev => ({ ...prev, biaya_makan_karyawan: Number(e.target.value) }))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="biaya_makan_pasien">Biaya Makan Pasien</Label>
                        <Input
                          id="biaya_makan_pasien"
                          type="number"
                          value={formData.biaya_makan_pasien}
                          onChange={(e) => setFormData(prev => ({ ...prev, biaya_makan_pasien: Number(e.target.value) }))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="biaya_rumah_tangga">Biaya Rumah Tangga</Label>
                        <Input
                          id="biaya_rumah_tangga"
                          type="number"
                          value={formData.biaya_rumah_tangga}
                          onChange={(e) => setFormData(prev => ({ ...prev, biaya_rumah_tangga: Number(e.target.value) }))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="biaya_cetak">Biaya Cetak</Label>
                        <Input
                          id="biaya_cetak"
                          type="number"
                          value={formData.biaya_cetak}
                          onChange={(e) => setFormData(prev => ({ ...prev, biaya_cetak: Number(e.target.value) }))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="biaya_atk">Biaya ATK</Label>
                        <Input
                          id="biaya_atk"
                          type="number"
                          value={formData.biaya_atk}
                          onChange={(e) => setFormData(prev => ({ ...prev, biaya_atk: Number(e.target.value) }))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="biaya_listrik">Biaya Listrik</Label>
                        <Input
                          id="biaya_listrik"
                          type="number"
                          value={formData.biaya_listrik}
                          onChange={(e) => setFormData(prev => ({ ...prev, biaya_listrik: Number(e.target.value) }))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="biaya_air">Biaya Air</Label>
                        <Input
                          id="biaya_air"
                          type="number"
                          value={formData.biaya_air}
                          onChange={(e) => setFormData(prev => ({ ...prev, biaya_air: Number(e.target.value) }))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="biaya_telp">Biaya Telepon</Label>
                        <Input
                          id="biaya_telp"
                          type="number"
                          value={formData.biaya_telp}
                          onChange={(e) => setFormData(prev => ({ ...prev, biaya_telp: Number(e.target.value) }))}
                        />
                      </div>
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
        </div>
      </div>

      {/* Import Progress */}
      {importProgress > 0 && (
        <Card>
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

      <Card>
        <CardHeader>
          <CardTitle>Data Kalkulasi Biaya Gizi - Tahun {currentYear}</CardTitle>
          <CardDescription>
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
                <TableHeader>
                  <TableRow>
                    <TableHead>Kode</TableHead>
                    <TableHead>Jenis Makanan</TableHead>
                    <TableHead>Total Porsi</TableHead>
                    <TableHead>Waktu (Meracik/Memasak/Menata)</TableHead>
                    <TableHead>Bahan Porsi</TableHead>
                    <TableHead>Biaya Bahan Porsi</TableHead>
                    <TableHead>Unit Cost/Porsi</TableHead>
                    <TableHead>Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.map((item) => {
                    const totalBiayaBahanPorsi = bahanPorsiTotals.get(item.jenis_makanan) || 0;
                    const hasBahanPorsi = menusWithBahan.has(item.jenis_makanan);
                    
                    return (
                      <TableRow key={item.id}>
                        <TableCell>
                          <Badge variant="outline">{item.kode}</Badge>
                        </TableCell>
                        <TableCell className="max-w-xs">
                          <div className="flex items-center justify-between">
                            <span className="truncate">{item.jenis_makanan}</span>
                            <div className="flex gap-1 ml-2">
                              <Button
                                size="sm"
                                variant={hasBahanPorsi ? "default" : "outline"}
                                className={`${
                                  hasBahanPorsi 
                                    ? "bg-green-600 hover:bg-green-700 text-white" 
                                    : "hover:bg-gray-50"
                                }`}
                                onClick={() => {
                                  const selectedMenu = menuGizi.find(menu => menu.nama_makanan === item.jenis_makanan);
                                  if (selectedMenu) {
                                    handleMenuClickForBahan(selectedMenu);
                                  }
                                }}
                              >
                                <Calculator className="h-4 w-4 mr-1" />
                                {hasBahanPorsi ? 'Update Bahan Porsi' : 'Tambah Bahan Porsi'}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="bg-blue-600 hover:bg-blue-700 text-white"
                                onClick={() => handleUpdateWaktu(item)}
                              >
                                Update Waktu
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
                          <Badge variant="secondary">
                            Rp {(() => {
                              // Hitung total biaya bahan porsi dari data JSON di kalkulasi_biaya_gizi
                              if (item.bahan_porsi && Array.isArray(item.bahan_porsi) && item.bahan_porsi.length > 0) {
                                const total = item.bahan_porsi.reduce((sum, bahan) => {
                                  const biaya = Number(bahan.biaya_bahan_porsi) || 0;
                                  console.log('Bahan:', bahan.nama_barang, 'Biaya:', biaya);
                                  return sum + biaya;
                                }, 0);
                                console.log('Total bahan porsi untuk', item.jenis_makanan, ':', total);
                                return total.toLocaleString('id-ID');
                              }
                              console.log('Tidak ada data bahan porsi untuk', item.jenis_makanan);
                              return '0';
                            })()}
                          </Badge>
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
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEdit(item)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDelete(item.id)}
                            >
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
      <Card>
        <CardHeader>
          <CardTitle>Manajemen Bahan Porsi</CardTitle>
          <CardDescription>
            Daftar bahan porsi dengan perhitungan otomatis biaya bahan porsi (integer)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Search Section */}
          <div className="mb-6">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <Label htmlFor="search-jenis-makanan">Cari berdasarkan Jenis Makanan</Label>
                <Input
                  id="search-jenis-makanan"
                  placeholder="Ketik jenis makanan untuk mencari..."
                  value={searchJenisMakanan}
                  onChange={(e) => setSearchJenisMakanan(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline">
                  {filteredBahanPorsi.length} dari {bahanPorsi.length} bahan
                </Badge>
                {searchJenisMakanan && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSearchJenisMakanan('')}
                  >
                    Clear
                  </Button>
                )}
              </div>
            </div>
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
                  onSave={async (data) => {
                    try {
                      const { error } = await supabase
                        .from('bahan_porsi')
                        .insert([data]);

                      if (error) throw error;
                      
                      toast({
                        title: "Berhasil",
                        description: "Bahan porsi berhasil ditambahkan",
                      });
                      
                      fetchBahanPorsi();
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
              <TableHeader>
                <TableRow>
                  <TableHead>Kode</TableHead>
                  <TableHead>Jenis Makanan</TableHead>
                  <TableHead>Nama Barang</TableHead>
                  <TableHead>Satuan</TableHead>
                  <TableHead>Konsumsi</TableHead>
                  <TableHead>Harga</TableHead>
                  <TableHead>Harga Bahan</TableHead>
                  <TableHead>Biaya Produksi</TableHead>
                  <TableHead>Biaya Bahan Porsi</TableHead>
                  <TableHead>Sumber Data</TableHead>
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



