import React, { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import Papa from "papaparse";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { recalculateLaboratoriumBatched } from "@/utils/database-operations";
import BahanFarmasiForm from "@/components/BahanFarmasiForm";
import { Edit, Trash2, Calculator, RefreshCw, Download, Upload, Plus } from "lucide-react";
import * as XLSX from "xlsx";
import { usePermissions } from "@/hooks/usePermissions";

const KalkulasiBiayaLaboratorium: React.FC = () => {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const { isAdmin, isSuperAdmin } = usePermissions();
  const [selectedRow, setSelectedRow] = useState<any | null>(null);
  const [bahanText, setBahanText] = useState<string>(
    JSON.stringify(
      [
        { kode_barang: "BRG001", nama: "Contoh A", qty: 1, harga_satuan: 10000, harga_total: 10000 },
        { kode_barang: "BRG002", nama: "Contoh B", qty: 2, harga_satuan: 15000, harga_total: 30000 },
      ],
      null,
      2
    )
  );
  const [importing, setImporting] = useState<boolean>(false);
  const [importProgress, setImportProgress] = useState<{current: number, total: number, message: string, status: string}>({current: 0, total: 0, message: "", status: ""});
  const [autoCalculating, setAutoCalculating] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [showBahanFarmasiForm, setShowBahanFarmasiForm] = useState<boolean>(false);
  const [selectedRowForBahan, setSelectedRowForBahan] = useState<any | null>(null);
  const [bahanFarmasiList, setBahanFarmasiList] = useState<any[]>([]);
  const [showManualInput, setShowManualInput] = useState<boolean>(false);
  const [manualInputData, setManualInputData] = useState<any>({});
  const [tindakanOptions, setTindakanOptions] = useState<{ kode: string; nama: string }[]>([]);
  const [tindakanQuery, setTindakanQuery] = useState<string>("");
  const [showReportFilter, setShowReportFilter] = useState<boolean>(false);
  const [reportFilter, setReportFilter] = useState<{type: 'all' | 'specific', jenisPemeriksaan: string}>({type: 'all', jenisPemeriksaan: ''});
  const [jenisFilterInput, setJenisFilterInput] = useState<string>("");
  const [selectedJenisFilters, setSelectedJenisFilters] = useState<string[]>([]);
  const [showFilterSuggestions, setShowFilterSuggestions] = useState<boolean>(false);
  // State untuk manual recalculation
  const [recalculating, setRecalculating] = useState<boolean>(false);
  const [recalcProgress, setRecalcProgress] = useState<{step: number, total: number, message: string}>({step: 0, total: 5, message: ''});

  useEffect(() => {
    fetchData();

    // Realtime subscription to auto-refresh when kalkulasi_biaya_laboratorium changes
    const channel = supabase
      .channel('kalkulasi_biaya_laboratorium_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'kalkulasi_biaya_laboratorium' }, () => {
        fetchData();
      })
      .subscribe();

    return () => {
      try { supabase.removeChannel(channel); } catch (_) {}
    };
  }, [year]);


  const fetchData = async () => {
    try {
      setLoading(true);
      const startTime = performance.now();
      
      const currentUserId = (await supabase.auth.getUser())?.data?.user?.id;
      if (!currentUserId) {
        setRows([]);
        setLoading(false);
        toast.error("User tidak ditemukan. Silakan login kembali.");
        return;
      }

      // Optimized query - only select columns needed for display and calculation
      const { data, error } = await supabase
        .from('kalkulasi_biaya_laboratorium')
        .select(`
          id,
          kode,
          jenis_pemeriksaan,
          jumlah,
          waktu_pemeriksaan,
          profesionalisme,
          tingkat_kesulitan,
          biaya_bahan_pemeriksaan_numeric,
          biaya_tidak_langsung_terdistribusi,
          unit_cost_per_pemeriksaan,
          bahan_pemeriksaan,
          created_at,
          updated_at
        `)
        .eq('tahun', year)
        .order('jenis_pemeriksaan');

      const endTime = performance.now();
      console.log(`📊 Data fetch took ${(endTime - startTime).toFixed(2)}ms`);

      if (error) throw error;
      console.log('Data kalkulasi loaded:', data);
      setRows(data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error("Gagal memuat data kalkulasi biaya laboratorium");
    } finally {
      setLoading(false);
    }
  };

  const updateData = async () => {
    await fetchData();
  };

  const jenisOptions = useMemo(() => {
    return Array.from(new Set((rows || []).map((r) => r.jenis_pemeriksaan))).filter(Boolean);
  }, [rows]);

  const filteredRows = useMemo(() => {
    if (selectedJenisFilters.length > 0) {
      const setSel = new Set(selectedJenisFilters);
      return (rows || []).filter((r) => setSel.has(r.jenis_pemeriksaan));
    }
    if (!jenisFilterInput) return rows;
    const q = jenisFilterInput.toLowerCase();
    return (rows || []).filter((r) => (r.jenis_pemeriksaan || '').toLowerCase().includes(q));
  }, [rows, jenisFilterInput, selectedJenisFilters]);

  const filteredJenisOptions = useMemo(() => {
    const q = (jenisFilterInput || '').toLowerCase();
    const base = jenisOptions.filter((j) => j && j.toLowerCase().includes(q));
    // Prioritaskan yang belum dipilih
    const selectedSet = new Set(selectedJenisFilters);
    return [...base.filter(j => !selectedSet.has(j)), ...base.filter(j => selectedSet.has(j))].slice(0, 12);
  }, [jenisOptions, jenisFilterInput, selectedJenisFilters]);

  const handleManualRecalculation = async () => {
    const userId = (await supabase.auth.getUser())?.data?.user?.id;
    if (!userId) {
      toast.error("User tidak ditemukan. Silakan login kembali.");
      return;
    }

    if (!confirm("Apakah Anda yakin ingin melakukan rekalkulasi? Proses ini akan memperbarui semua kalkulasi biaya berdasarkan rumus tabel.")) {
      return;
    }

    try {
      setRecalculating(true);
      setRecalcProgress({step: 0, total: 1, message: 'Menyiapkan batch unit...'});

      console.log("🔄 Starting batched manual recalculation for laboratorium...");
      const startTime = performance.now();

      const batchResult = await recalculateLaboratoriumBatched(year, userId, ({ current, total, unit, message }) => {
        setRecalcProgress({ step: current, total: Math.max(total, 1), message: message || `Memproses unit ${unit || ''}...` });
      });

      setRecalcProgress(prev => ({ ...prev, message: 'Memperbarui tampilan data...' }));

      // Refresh data setelah recalculation
      await fetchData();

      const endTime = performance.now();
      const totalTime = (endTime - startTime) / 1000;

      setRecalcProgress(prev => ({ ...prev, step: prev.total, message: 'Selesai!' }));

      // Ringkasan hasil
      toast.success(
        `🎉 Rekalkulasi batch selesai!\n` +
        `🏥 Unit diproses: ${batchResult.totalUnits}\n` +
        `✅ Berhasil: ${batchResult.succeeded} | ❌ Gagal: ${batchResult.failed}\n` +
        `📊 Rows diperbarui: ${batchResult.totalAffected}\n` +
        `⏱️ Total waktu: ${totalTime.toFixed(2)}s (DB ~${batchResult.totalDbSeconds.toFixed(2)}s)`
      );

      if (batchResult.failed > 0) {
        console.warn('Batch failures:', batchResult.failures);
      }

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
      
      toast.error(`❌ Gagal melakukan rekalkulasi: ${errorMessage}`);
    } finally {
      setRecalculating(false);
      setRecalcProgress({step: 0, total: 5, message: ''});
    }
  };


  const handleOpenBahanDialog = (row: any) => {
    setSelectedRow(row);
    // Load existing bahan data if available, otherwise use default
    if (row.bahan_pemeriksaan && Array.isArray(row.bahan_pemeriksaan) && row.bahan_pemeriksaan.length > 0) {
      setBahanText(JSON.stringify(row.bahan_pemeriksaan, null, 2));
    } else {
    setBahanText(JSON.stringify([
      { kode_barang: "BRG001", nama: "Contoh A", qty: 1, harga_satuan: 10000, harga_total: 10000 },
      { kode_barang: "BRG002", nama: "Contoh B", qty: 2, harga_satuan: 15000, harga_total: 30000 },
    ], null, 2));
    }
  };

  const handleSaveBahan = async () => {
    try {
      if (!selectedRow) return;
      
      // Validate JSON format
      let parsed: any;
      try {
        parsed = JSON.parse(bahanText);
      } catch (jsonError) {
        toast.error("Format JSON tidak valid. Silakan periksa kembali.");
        return;
      }
      
      if (!Array.isArray(parsed)) {
        toast.error("Format JSON harus berupa array.");
        return;
      }
      
      // Validate array items
      for (let i = 0; i < parsed.length; i++) {
        const item = parsed[i];
        if (!item.kode_barang || !item.nama || !item.qty || !item.harga_satuan || !item.harga_total) {
          toast.error(`Item ke-${i + 1} tidak lengkap. Pastikan ada: kode_barang, nama, qty, harga_satuan, harga_total`);
          return;
        }
      }
      
      setAutoCalculating(true);
      
      const { error } = await supabase
        .from("kalkulasi_biaya_laboratorium")
        .update({ bahan_pemeriksaan: parsed })
        .eq("id", selectedRow.id);
      
      if (error) {
        console.error("Database error:", error);
        throw error;
      }
      
      toast.success("Bahan pemeriksaan diperbarui. Memperbarui data...");
      setSelectedRow(null);
      
      // Trigger immediate update after save
      await updateData();
      setAutoCalculating(false);
      toast.success("Data berhasil diperbarui!");
      
    } catch (e: any) {
      console.error("Save bahan error:", e);
      toast.error(`Gagal menyimpan bahan: ${e.message}`);
      setAutoCalculating(false);
    }
  };

  const handleOpenBahanFarmasiForm = (row: any) => {
    setSelectedRowForBahan(row);
    setBahanFarmasiList(row.bahan_pemeriksaan || []);
    setShowBahanFarmasiForm(true);
  };

  const handleSaveBahanFarmasi = (bahanData: any) => {
    const newBahanList = [...bahanFarmasiList, bahanData];
    setBahanFarmasiList(newBahanList);
    toast.success("Bahan farmasi berhasil ditambahkan!");
  };

  const handleSaveAllBahanFarmasi = async () => {
    try {
      if (!selectedRowForBahan) return;
      
      setAutoCalculating(true);
      
      const { error } = await supabase
        .from("kalkulasi_biaya_laboratorium")
        .update({ bahan_pemeriksaan: bahanFarmasiList })
        .eq("id", selectedRowForBahan.id);
      
      if (error) {
        console.error("Database error:", error);
        throw error;
      }
      
      toast.success("Semua bahan farmasi disimpan. Memperbarui data...");
      setShowBahanFarmasiForm(false);
      setSelectedRowForBahan(null);
      setBahanFarmasiList([]);
      
      // Trigger immediate update after save
      await updateData();
      setAutoCalculating(false);
      toast.success("Data berhasil diperbarui!");
      
    } catch (e: any) {
      console.error("Save bahan farmasi error:", e);
      toast.error(`Gagal menyimpan bahan farmasi: ${e.message}`);
      setAutoCalculating(false);
    }
  };

  const handleRemoveBahanFarmasi = (index: number) => {
    const newBahanList = bahanFarmasiList.filter((_, i) => i !== index);
    setBahanFarmasiList(newBahanList);
    toast.success("Bahan farmasi dihapus!");
  };

  const handleManualInput = async (data: any) => {
    try {

      setAutoCalculating(true);
      const currentUserId = (await supabase.auth.getUser())?.data?.user?.id;
      if (!currentUserId) {
        toast.error("User tidak ditemukan. Silakan login kembali.");
        setAutoCalculating(false);
        return;
      }

      // Cari tindakan laboratorium berdasarkan nama
      const { data: tindakan, error: tindakanError } = await supabase
        .from("tindakan_laboratorium")
        .select("kode, nama")
        .eq("nama", data.jenis_pemeriksaan)
        .single();

      if (tindakanError || !tindakan) {
        toast.error("Jenis pemeriksaan tidak ditemukan dalam master data");
        setAutoCalculating(false);
        return;
      }

      // Upsert cepat via RPC (tanpa perhitungan)
      const { error: upsertError } = await supabase.rpc('lab_fast_upsert', {
        p_tahun: year,
        p_kode: tindakan.kode,
        p_kode_unit_kerja: 'UK038',
        p_jenis: data.jenis_pemeriksaan,
        p_jumlah: data.jumlah || 0,
        p_waktu: data.waktu_pemeriksaan || 0,
        p_prof: data.profesionalisme || 1,
        p_sulit: data.tingkat_kesulitan || 1,
        p_user: currentUserId
      });

      if (upsertError) {
        console.error("Upsert error:", upsertError);
        throw upsertError;
      }

      toast.success("✅ Data berhasil disimpan! Klik 'Rekalkulasi Manual' untuk menghitung semua kolom.");
      setShowManualInput(false);
      setManualInputData({});

      // Trigger immediate update after manual input
      setAutoCalculating(false);
      await updateData();

    } catch (e: any) {
      console.error("Manual input error:", e);
      toast.error(`Gagal ${data.id ? 'mengupdate' : 'menambah'} data: ${e.message}`);
      setAutoCalculating(false);
    }
  };

  const handleEditRow = (row: any) => {
    setManualInputData({
      id: row.id,
      jenis_pemeriksaan: row.jenis_pemeriksaan,
      jumlah: row.jumlah,
      waktu_pemeriksaan: row.waktu_pemeriksaan,
      profesionalisme: row.profesionalisme,
      tingkat_kesulitan: row.tingkat_kesulitan
    });
    setShowManualInput(true);
  };

  useEffect(() => {
    const loadOptions = async () => {
      const q = tindakanQuery.trim();
      if (!q) { setTindakanOptions([]); return; }
      const { data } = await supabase
        .from('tindakan_laboratorium')
        .select('kode, nama')
        .ilike('nama', `%${q}%`)
        .limit(20);
      setTindakanOptions(data || []);
    };
    const t = setTimeout(loadOptions, 250);
    return () => clearTimeout(t);
  }, [tindakanQuery]);

  const handleDeleteRow = async (row: any) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus data "${row.jenis_pemeriksaan}"?`)) {
      return;
    }

    try {
      setAutoCalculating(true);
      
      const { error } = await supabase
        .from("kalkulasi_biaya_laboratorium")
        .delete()
        .eq("id", row.id);

      if (error) {
        console.error("Delete error:", error);
        throw error;
      }

      toast.success("Data berhasil dihapus!");
      
      // Trigger immediate update after delete
      setAutoCalculating(false);
      await updateData();
      
    } catch (e: any) {
      console.error("Delete error:", e);
      toast.error(`Gagal menghapus data: ${e.message}`);
      setAutoCalculating(false);
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      const { data, error } = await supabase
        .from("tindakan_laboratorium")
        .select("kode, nama")
        .order("nama", { ascending: true });
      if (error) throw error;
      if (!data || data.length === 0) {
        toast.error("Tidak ada data tindakan laboratorium.");
        return;
      }

      const headers = [
        "Kode Tindakan",
        "Jenis Pemeriksaan",
        "Jumlah",
        "Waktu Pemeriksaan",
        "Profesionalisme (1-4)",
        "Tingkat Kesulitan (1-5)",
      ];

      const rowsCsv = data.map((d: any) => ({
        "Kode Tindakan": d.kode,
        "Jenis Pemeriksaan": d.nama,
        "Jumlah": "",
        "Waktu Pemeriksaan": "",
        "Profesionalisme (1-4)": "",
        "Tingkat Kesulitan (1-5)": "",
      }));

      const ws = XLSX.utils.aoa_to_sheet([headers, ...rowsCsv.map(row => Object.values(row))]);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Template Kalkulasi Lab");
      XLSX.writeFile(wb, `template_kalkulasi_lab_${year}.xlsx`);
      toast.success(`Template berisi ${rowsCsv.length} tindakan berhasil dibuat.`);
    } catch (e: any) {
      console.error(e);
      toast.error(`Gagal membuat template: ${e.message}`);
    }
  };

  const handleDownloadReport = async () => {
    try {
      // Query data langsung dari database untuk memastikan sinkronisasi
      const { data: reportData, error: reportError } = await supabase
        .from('kalkulasi_biaya_laboratorium')
        .select(`
          kode,
          kode_unit_kerja,
          jenis_pemeriksaan,
          jumlah,
          waktu_pemeriksaan,
          profesionalisme,
          tingkat_kesulitan,
          hasil_kali,
          hasil_kali_waktu,
          dasar_alokasi_waktu,
          dasar_alokasi_hasil_kali,
          biaya_bahan_pemeriksaan_numeric,
          biaya_gaji_tunjangan,
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
          unit_cost_per_pemeriksaan
        `)
        .eq('tahun', year)
        .order('kode');

      if (reportError) {
        console.error('Error fetching report data:', reportError);
        toast.error(`Gagal mengambil data dari database: ${reportError.message}`);
        return;
      }

      if (!reportData || reportData.length === 0) {
        toast.error("Tidak ada data untuk diunduh.");
        return;
      }

      // Filter data berdasarkan jenis pemeriksaan jika dipilih
      let filteredRows = reportData;
      if (reportFilter.type === 'specific' && reportFilter.jenisPemeriksaan) {
        filteredRows = reportData.filter(row => row.jenis_pemeriksaan === reportFilter.jenisPemeriksaan);
        if (filteredRows.length === 0) {
          toast.error("Tidak ada data untuk jenis pemeriksaan yang dipilih.");
          return;
        }
      }

      // Create CSV content for report with all cost columns (LENGKAP)
      const headers = [
        "Kode",
        "Kode Unit Kerja", 
        "Jenis Pemeriksaan",
        "Jumlah",
        "Waktu (menit)",
        "Prof",
        "Kesulitan",
        "Hasil Kali",
        "Hasil Kali Waktu",
        "Dasar Alokasi Waktu",
        "Dasar Alokasi Hasil Kali",
        "Bahan Rp",
        "Gaji Rp",
        "Makan Pasien Rp",
        "Rumah Tangga Rp",
        "Cetak Rp",
        "ATK Rp",
        "Listrik Rp",
        "Air Rp",
        "Telp Rp",
        "Pemeliharaan Bangunan Rp",
        "Pemeliharaan Alat Medis Rp",
        "Pemeliharaan Alat Non Medis Rp",
        "Operasional Lainnya Rp",
        "Penyusutan Gedung Rp",
        "Penyusutan Jaringan Rp",
        "Penyusutan Alat Medis Rp",
        "Penyusutan Alat Non Medis Rp",
        "Pendidikan Pelatihan Rp",
        "Laundry Rp",
        "Sterilisasi Rp",
        "Biaya Tidak Langsung Terdistribusi Rp",
        "Unit Cost"
      ];

      const rowsCsv = filteredRows.map((row: any) => ({
        "Kode": row.kode || '',
        "Kode Unit Kerja": row.kode_unit_kerja || 'UK038',
        "Jenis Pemeriksaan": row.jenis_pemeriksaan || '',
        "Jumlah": row.jumlah || 0,
        "Waktu (menit)": row.waktu_pemeriksaan || 0,
        "Prof": row.profesionalisme || 1,
        "Kesulitan": row.tingkat_kesulitan || 1,
        "Hasil Kali": row.hasil_kali || 0,
        "Hasil Kali Waktu": row.hasil_kali_waktu || 0,
        "Dasar Alokasi Waktu": row.dasar_alokasi_waktu || 0,
        "Dasar Alokasi Hasil Kali": row.dasar_alokasi_hasil_kali || 0,
        "Bahan Rp": row.biaya_bahan_pemeriksaan_numeric || 0,
        "Gaji Rp": row.biaya_gaji_tunjangan || 0,
        "Makan Pasien Rp": row.biaya_makan_pasien || 0,
        "Rumah Tangga Rp": row.biaya_rumah_tangga || 0,
        "Cetak Rp": row.biaya_cetak || 0,
        "ATK Rp": row.biaya_atk || 0,
        "Listrik Rp": row.biaya_listrik || 0,
        "Air Rp": row.biaya_air || 0,
        "Telp Rp": row.biaya_telp || 0,
        "Pemeliharaan Bangunan Rp": row.biaya_pemeliharaan_bangunan || 0,
        "Pemeliharaan Alat Medis Rp": row.biaya_pemeliharaan_alat_medis || 0,
        "Pemeliharaan Alat Non Medis Rp": row.biaya_pemeliharaan_alat_non_medis || 0,
        "Operasional Lainnya Rp": row.biaya_operasional_lainnya || 0,
        "Penyusutan Gedung Rp": row.biaya_penyusutan_gedung || 0,
        "Penyusutan Jaringan Rp": row.biaya_penyusutan_jaringan || 0,
        "Penyusutan Alat Medis Rp": row.biaya_penyusutan_alat_medis || 0,
        "Penyusutan Alat Non Medis Rp": row.biaya_penyusutan_alat_non_medis || 0,
        "Pendidikan Pelatihan Rp": row.biaya_pendidikan_pelatihan || 0,
        "Laundry Rp": row.biaya_laundry || 0,
        "Sterilisasi Rp": row.biaya_sterilisasi || 0,
        "Biaya Tidak Langsung Terdistribusi Rp": row.biaya_tidak_langsung_terdistribusi || 0,
        "Unit Cost": row.unit_cost_per_pemeriksaan || 0
      }));

      const ws = XLSX.utils.aoa_to_sheet([headers, ...rowsCsv.map(row => Object.values(row))]);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Laporan Kalkulasi Lab");
      
      const filterSuffix = reportFilter.type === 'specific' ? `_${reportFilter.jenisPemeriksaan.replace(/[^a-zA-Z0-9]/g, '_')}` : '_semua';
      XLSX.writeFile(wb, `laporan_kalkulasi_biaya_laboratorium_${year}${filterSuffix}.xlsx`);
      
      const filterText = reportFilter.type === 'specific' ? `untuk ${reportFilter.jenisPemeriksaan}` : 'semua data';
      toast.success(`Laporan ${filterText} berisi ${rowsCsv.length} data berhasil diunduh (sinkron dengan database).`);
      
      setShowReportFilter(false);
    } catch (e: any) {
      console.error(e);
      toast.error(`Gagal mengunduh laporan: ${e.message}`);
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    
    console.log("=== IMPORT START ===");
    console.log("Year:", year);
    console.log("File:", file.name);
    
    e.target.value = "";
    setImporting(true);
    setUploadProgress(0);
    setImportProgress({current: 0, total: 0, message: "Memulai import...", status: "uploading"});
    
    try {
      // Simulate file reading progress
      setImportProgress({current: 0, total: 0, message: "Membaca file...", status: "reading"});
      const text = await file.text();
      setUploadProgress(100);
      Papa.parse(text, {
        header: true,
        skipEmptyLines: true,
        complete: async (res) => {
          console.log("=== CSV PARSE COMPLETE ===");
          console.log("Parse result:", res);
          const records = res.data as any[];
          
          if (!records || records.length === 0) {
            console.log("No records found");
            toast.error("File CSV kosong atau tidak memiliki data valid.");
            setImporting(false);
            setImportProgress({current: 0, total: 0, message: "", status: ""});
            return;
          }

          console.log(`Processing ${records.length} records`);
          setImportProgress({current: 0, total: records.length, message: `Memproses ${records.length} baris data...`, status: "processing"});
          
          // Skip initial data generation for now
          
          let successCount = 0;
          let errorCount = 0;
          const errors: string[] = [];

          for (let i = 0; i < records.length; i++) {
            const r = records[i];
            setImportProgress({
              current: i + 1, 
              total: records.length, 
              message: `Memproses baris ${i + 1} dari ${records.length}...`, 
              status: "processing"
            });
            
            console.log(`=== PROCESSING ROW ${i + 1} ===`);
            console.log("Row data:", r);
            
            const kodeTindakan = (r["Kode Tindakan"] || "").toString().trim();
            const jenis = (r["Jenis Pemeriksaan"] || "").toString().trim();
            
            console.log("Extracted values:", { kodeTindakan, jenis });
            
            if (!jenis && !kodeTindakan) {
              errorCount++;
              errors.push(`Baris ${i + 1}: Tidak ada kode tindakan atau jenis pemeriksaan`);
              continue;
            }
            
            const jumlah = parseInt(r["Jumlah"] || "0", 10) || 0;
            const waktu = parseInt(r["Waktu Pemeriksaan"] || "0", 10) || 0;
            const prof = Math.max(1, Math.min(4, parseInt(r["Profesionalisme (1-4)"] || "1", 10) || 1));
            const sulit = Math.max(1, Math.min(5, parseInt(r["Tingkat Kesulitan (1-5)"] || "1", 10) || 1));

            console.log("Parsed values:", { jumlah, waktu, prof, sulit });

            try {
              let targetJenis = jenis;

              if (kodeTindakan) {
                console.log(`Looking up tindakan for kode: ${kodeTindakan}`);
                const { data: tind, error: errT } = await supabase
                  .from("tindakan_laboratorium")
                  .select("nama")
                  .eq("kode", kodeTindakan)
                  .maybeSingle();
                
                console.log(`Tindakan lookup result:`, { tind, errT });
                
                if (!errT && tind?.nama) {
                  targetJenis = tind.nama;
                  console.log(`Using tindakan name: ${targetJenis}`);
                } else {
                  errorCount++;
                  errors.push(`Baris ${i + 1}: Kode tindakan '${kodeTindakan}' tidak ditemukan`);
                  continue;
                }
              }

              if (!targetJenis) {
                errorCount++;
                errors.push(`Baris ${i + 1}: Tidak ada jenis pemeriksaan yang valid`);
                continue;
              }

              console.log(`Final target jenis: ${targetJenis}`);
              
              // First check if record exists
              const currentUserId = (await supabase.auth.getUser())?.data?.user?.id;
              const { data: existingRecord, error: checkError } = await supabase
                .from("kalkulasi_biaya_laboratorium")
                .select("id, jenis_pemeriksaan")
                .eq("tahun", year)
                .eq("jenis_pemeriksaan", targetJenis)
                .maybeSingle();
              
              console.log(`Check existing record for row ${i + 1}:`, { existingRecord, checkError });

              if (checkError) {
                errorCount++;
                errors.push(`Baris ${i + 1}: Error checking record - ${checkError.message}`);
                continue;
              }

              if (!existingRecord) {
                errorCount++;
                errors.push(`Baris ${i + 1}: Data tidak ditemukan untuk jenis '${targetJenis}' - pastikan data awal sudah dibuat`);
                continue;
              }

              // Now perform the update
              const { error: updateError, count } = await supabase
                .from("kalkulasi_biaya_laboratorium")
                .update({ 
                  jumlah, 
                  waktu_pemeriksaan: waktu, 
                  profesionalisme: prof, 
                  tingkat_kesulitan: sulit,
                  user_id: currentUserId || undefined
                })
                .eq("id", existingRecord.id);
              
              console.log(`Update result for row ${i + 1}:`, { updateError, count });

              if (updateError) {
                errorCount++;
                errors.push(`Baris ${i + 1}: ${updateError.message}`);
              } else if (count === 0) {
                errorCount++;
                errors.push(`Baris ${i + 1}: Update gagal - tidak ada baris yang diupdate`);
              } else {
                successCount++;
                console.log(`Row ${i + 1} updated successfully - trigger otomatis akan menghitung ulang`);
              }
            } catch (err: any) {
              errorCount++;
              errors.push(`Baris ${i + 1}: ${err.message}`);
            }
          }
          
          console.log(`=== IMPORT COMPLETED ===`);
          console.log(`Success: ${successCount}, Errors: ${errorCount}`);
          
          // Show detailed results
          const message = `Import selesai!\n✅ Berhasil: ${successCount}\n❌ Gagal: ${errorCount}\n📊 Total: ${records.length}`;
          if (errorCount > 0) {
            setImportProgress({current: records.length, total: records.length, message: "Import selesai dengan error", status: "error"});
            toast.error(message + `\n\nError detail:\n${errors.slice(0, 5).join('\n')}${errors.length > 5 ? `\n... dan ${errors.length - 5} error lainnya` : ''}`);
          } else {
            setImportProgress({current: records.length, total: records.length, message: "Import berhasil! Menghitung ulang...", status: "success"});
            toast.success(message + "\n🔄 Perhitungan otomatis sedang berjalan...");
          }
          
          // Trigger immediate update after import
          setAutoCalculating(true);
          await updateData();
          setAutoCalculating(false);
          setImporting(false);
          setImportProgress({current: 0, total: 0, message: "", status: ""});
          if (successCount > 0) {
            toast.success("✅ Import berhasil! Data telah diperbarui.");
          }
        },
        error: (err: any) => {
          console.error("CSV parse error:", err);
          toast.error(`Gagal membaca file CSV: ${err.message}`);
          setImporting(false);
          setImportProgress({current: 0, total: 0, message: "", status: ""});
        },
      });
    } catch (err: any) {
      console.error("Import error:", err);
      toast.error(`Gagal memproses file: ${err.message}`);
      setImporting(false);
      setImportProgress({current: 0, total: 0, message: "", status: ""});
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Kalkulasi Biaya Laboratorium</h1>
        <p className="text-muted-foreground">
          Hitung biaya pemeriksaan laboratorium
        </p>
      </div>

      <Card className="border border-sky-100 bg-[#F8FBFF] shadow-sm">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-semibold text-slate-800">Kalkulasi Biaya Laboratorium</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="template" onClick={handleDownloadTemplate}>
              <Download className="mr-2 h-4 w-4" />
              Unduh Template Impor
            </Button>
            <label htmlFor="laboratorium-import" className="cursor-pointer">
              <Button asChild variant="import" disabled={loading || importing || autoCalculating}>
                <span>
                  <Upload className="mr-2 h-4 w-4" />
                  Impor Data
                </span>
              </Button>
            </label>
            <Input id="laboratorium-import" type="file" accept=".csv,.xlsx" onChange={handleImport} className="hidden" />
            <Button
              variant="destructive"
              onClick={() => setShowManualInput(true)}
              disabled={loading || importing || autoCalculating}
            >
              <Plus className="mr-2 h-4 w-4" />
              Tambah Data Unit Kerja
            </Button>
            <Button
              variant="report"
              onClick={() => setShowReportFilter(true)}
              disabled={loading || importing || autoCalculating || rows.length === 0}
            >
              <Download className="mr-2 h-4 w-4" />
              Unduh Laporan
            </Button>
            <Button
              disabled={loading || importing || autoCalculating || recalculating}
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
              type="number"
              value={year}
              onChange={(e) => setYear(parseInt(e.target.value || "0", 10) || year)}
              className="w-[120px]"
            />
            <div className="relative w-[280px]">
              <Input
                value={jenisFilterInput}
                onChange={(e) => { setJenisFilterInput(e.target.value); setShowFilterSuggestions(true); }}
                onFocus={() => setShowFilterSuggestions(true)}
                onBlur={() => setTimeout(() => setShowFilterSuggestions(false), 150)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    const v = (jenisFilterInput || '').trim();
                    if (!v) return;
                    if (selectedJenisFilters.includes(v)) { setJenisFilterInput(''); return; }
                    setSelectedJenisFilters((prev) => [...prev, v]);
                    setJenisFilterInput('');
                  } else if (e.key === 'Backspace' && !jenisFilterInput) {
                    setSelectedJenisFilters((prev) => prev.slice(0, -1));
                  }
                }}
                placeholder="Filter jenis pemeriksaan..."
                className="pr-8"
              />
              {showFilterSuggestions && filteredJenisOptions.length > 0 && (
                <div className="absolute z-10 mt-1 w-full rounded-md border border-gray-200 bg-white shadow-md max-h-60 overflow-auto">
                  {filteredJenisOptions.map((opt) => {
                    const isSelected = selectedJenisFilters.includes(opt);
                    return (
                      <div
                        key={opt}
                        className={`cursor-pointer px-3 py-2 text-sm hover:bg-gray-50 ${isSelected ? 'bg-gray-50' : ''}`}
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => {
                          if (isSelected) {
                            setSelectedJenisFilters(prev => prev.filter(v => v !== opt));
                          } else {
                            setSelectedJenisFilters(prev => [...prev, opt]);
                          }
                          setJenisFilterInput('');
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <span className="truncate">{opt}</span>
                          {isSelected && <span className="text-xs text-gray-500">✓</span>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {selectedJenisFilters.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {selectedJenisFilters.map((tag) => (
                <span key={tag} className="inline-flex items-center gap-2 rounded border bg-gray-100 px-2 py-1 text-xs">
                  {tag}
                  <button
                    type="button"
                    onClick={() => setSelectedJenisFilters((prev) => prev.filter((t) => t !== tag))}
                    className="text-gray-500 hover:text-gray-700"
                    aria-label={`Hapus ${tag}`}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}

          {importing && (
            <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-3 mb-3">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                <div>
                  <span className="text-sm font-medium text-blue-800">
                    {importProgress.status === "uploading" && "📤 Mengunggah file..."}
                    {importProgress.status === "reading" && "📖 Membaca file..."}
                    {importProgress.status === "preparing" && "⚙️ Menyiapkan data..."}
                    {importProgress.status === "processing" && "🔄 Memproses data..."}
                    {importProgress.status === "success" && "✅ Import berhasil!"}
                    {importProgress.status === "error" && "❌ Import gagal!"}
                  </span>
                  <div className="text-xs text-blue-600 mt-1">{importProgress.message}</div>
                </div>
              </div>
              
              {/* Upload Progress */}
              {importProgress.status === "uploading" && (
                <div className="space-y-2">
                  <div className="flex justify-between text-xs text-blue-600">
                    <span>Progress Upload</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-blue-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                </div>
              )}
              
              {/* Processing Progress */}
              {importProgress.total > 0 && importProgress.status === "processing" && (
                <div className="space-y-2">
                  <div className="flex justify-between text-xs text-blue-600">
                    <span>{importProgress.message}</span>
                    <span>{importProgress.current} / {importProgress.total}</span>
                  </div>
                  <div className="w-full bg-blue-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                      style={{ width: `${(importProgress.current / importProgress.total) * 100}%` }}
                    ></div>
                  </div>
                </div>
              )}
              
              {/* Success/Error Status */}
              {(importProgress.status === "success" || importProgress.status === "error") && (
                <div className={`text-sm font-medium ${importProgress.status === "success" ? "text-green-600" : "text-red-600"}`}>
                  {importProgress.message}
                </div>
              )}
            </div>
          )}

          {autoCalculating && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md">
              <div className="flex items-center gap-2 mb-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600"></div>
                <span className="text-sm font-medium text-green-800">Perhitungan otomatis sedang berjalan...</span>
              </div>
              <div className="text-xs text-green-600">
                🔄 Database trigger sedang menghitung ulang semua kolom biaya secara otomatis
              </div>
            </div>
          )}


          <div className="overflow-auto rounded-md border border-emerald-100 bg-white">
            <Table>
              <TableHeader className="bg-teal-700">
                <TableRow>
                  <TableHead className="max-w-[200px] text-white font-semibold">Jenis Pemeriksaan</TableHead>
                  <TableHead className="text-white font-semibold">Jumlah</TableHead>
                  <TableHead className="text-white font-semibold">Waktu</TableHead>
                  <TableHead className="text-white font-semibold">Prof</TableHead>
                  <TableHead className="text-white font-semibold">Kesulitan</TableHead>
                  {/* Hidden columns: HK Waktu, Alokasi Waktu, Hasil Kali, Alokasi HK */}
                  <TableHead className="text-white font-semibold">Bahan Rp</TableHead>
                  <TableHead className="text-white font-semibold">Biaya Tidak Langsung Terdistribusi</TableHead>
                  <TableHead className="text-white font-semibold">Unit Cost</TableHead>
                  <TableHead className="text-white font-semibold">Update Bahan</TableHead>
                  <TableHead className="text-white font-semibold">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={10} className="h-24 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                        <div className="text-gray-500">Memuat data...</div>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredRows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="h-24 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <div className="text-gray-500">Tidak ada data.</div>
                        <div className="text-xs text-blue-600">
                          💡 Klik "Import Data" untuk mengimpor data
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredRows.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium max-w-[200px] truncate" title={r.jenis_pemeriksaan}>{r.jenis_pemeriksaan}</TableCell>
                    <TableCell>{r.jumlah}</TableCell>
                    <TableCell>{r.waktu_pemeriksaan}</TableCell>
                    <TableCell>{r.profesionalisme}</TableCell>
                    <TableCell>{r.tingkat_kesulitan}</TableCell>
                    {/* Hidden columns: HK Waktu, Alokasi Waktu, Hasil Kali, Alokasi HK */}
                    <TableCell>{r.biaya_bahan_pemeriksaan_numeric?.toLocaleString() || 0}</TableCell>
                    <TableCell>{r.biaya_tidak_langsung_terdistribusi?.toLocaleString() || 0}</TableCell>
                    <TableCell>{r.unit_cost_per_pemeriksaan?.toLocaleString() || 0}</TableCell>
                    <TableCell>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleOpenBahanFarmasiForm(r)}
                        className="bg-green-100 hover:bg-green-200 text-green-800"
                      >
                        Update Bahan
                      </Button>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button 
                          variant="edit" 
                          size="sm"
                          onClick={() => handleEditRow(r)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="destructive" 
                          size="sm"
                          onClick={() => handleDeleteRow(r)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Dialog Bahan Farmasi */}
      {showBahanFarmasiForm && selectedRowForBahan && (
        <Dialog open={showBahanFarmasiForm} onOpenChange={setShowBahanFarmasiForm}>
          <DialogContent className="sm:max-w-[900px] max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Update Bahan Farmasi - {selectedRowForBahan.jenis_pemeriksaan}</DialogTitle>
              <DialogDescription>
                Tambahkan bahan farmasi yang digunakan untuk pemeriksaan ini
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              {/* Form untuk menambah bahan baru */}
              <BahanFarmasiForm
                kode={selectedRowForBahan.kode}
                jenisPemeriksaan={selectedRowForBahan.jenis_pemeriksaan}
                onSave={handleSaveBahanFarmasi}
                onCancel={() => setShowBahanFarmasiForm(false)}
              />
              
              {/* Daftar bahan yang sudah ditambahkan */}
              {bahanFarmasiList.length > 0 && (
                <div className="mt-6">
                  <h4 className="font-semibold mb-3">Daftar Bahan Farmasi:</h4>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {bahanFarmasiList.map((bahan, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex-1">
                          <div className="font-medium">{bahan.nama}</div>
                          <div className="text-sm text-gray-600">
                            {bahan.kode_barang} - {bahan.qty} {bahan.qty > 1 ? 'pcs' : 'pcs'} - Rp {bahan.harga_total?.toLocaleString()}
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRemoveBahanFarmasi(index)}
                          className="text-red-600 hover:text-red-700"
                        >
                          Hapus
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            {/* Total Biaya Bahan */}
            {bahanFarmasiList.length > 0 && (
              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Total Biaya Bahan Pemeriksaan:</span>
                  <span className="text-xl font-bold text-blue-600">
                    Rp {bahanFarmasiList.reduce((total, bahan) => total + (bahan.harga_total || 0), 0).toLocaleString('id-ID')}
                  </span>
                </div>
                <div className="mt-2 text-xs text-gray-600">
                  Total dari {bahanFarmasiList.length} item bahan
                </div>
              </div>
            )}
            
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setShowBahanFarmasiForm(false)}>
                Batal
              </Button>
              <Button 
                onClick={handleSaveAllBahanFarmasi}
                disabled={autoCalculating}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {autoCalculating ? "Menyimpan..." : "Simpan Semua Bahan"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Dialog Input Manual */}
      {showManualInput && (
        <Dialog open={showManualInput} onOpenChange={setShowManualInput}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>
                {manualInputData.id ? "Edit Data Pemeriksaan" : "Input Manual Data Pemeriksaan"}
              </DialogTitle>
              <DialogDescription>
                {manualInputData.id ? "Edit data pemeriksaan laboratorium" : "Tambahkan data pemeriksaan laboratorium baru"}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Jenis Pemeriksaan</label>
                <Input
                  list="dl-tindakan-lab"
                  value={manualInputData.jenis_pemeriksaan || ''}
                  onChange={(e) => {
                    setManualInputData(prev => ({ ...prev, jenis_pemeriksaan: e.target.value }));
                    setTindakanQuery(e.target.value);
                  }}
                  placeholder="Cari/pilih dari master tindakan laboratorium"
                />
                <datalist id="dl-tindakan-lab">
                  {tindakanOptions.map((opt, idx) => (
                    <option key={idx} value={opt.nama}>{opt.kode}</option>
                  ))}
                </datalist>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Jumlah</label>
                  <Input
                    type="number"
                    value={manualInputData.jumlah || ''}
                    onChange={(e) => setManualInputData(prev => ({ ...prev, jumlah: parseInt(e.target.value) || 0 }))}
                    placeholder="Jumlah pemeriksaan"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Waktu Pemeriksaan (menit)</label>
                  <Input
                    type="number"
                    value={manualInputData.waktu_pemeriksaan || ''}
                    onChange={(e) => setManualInputData(prev => ({ ...prev, waktu_pemeriksaan: parseInt(e.target.value) || 0 }))}
                    placeholder="Waktu dalam menit"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Profesionalisme (1-4)</label>
                  <Input
                    type="number"
                    min="1"
                    max="4"
                    value={manualInputData.profesionalisme || ''}
                    onChange={(e) => setManualInputData(prev => ({ ...prev, profesionalisme: parseInt(e.target.value) || 1 }))}
                    placeholder="1-4"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Tingkat Kesulitan (1-5)</label>
                  <Input
                    type="number"
                    min="1"
                    max="5"
                    value={manualInputData.tingkat_kesulitan || ''}
                    onChange={(e) => setManualInputData(prev => ({ ...prev, tingkat_kesulitan: parseInt(e.target.value) || 1 }))}
                    placeholder="1-5"
                  />
                </div>
              </div>
            </div>
            
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => {
                setShowManualInput(false);
                setManualInputData({});
              }}>
                Batal
              </Button>
              <Button 
                onClick={() => handleManualInput(manualInputData)}
                disabled={autoCalculating || !manualInputData.jenis_pemeriksaan}
                className="bg-green-600 hover:bg-green-700"
              >
                {autoCalculating ? "Menyimpan..." : (manualInputData.id ? "Update" : "Simpan")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Dialog Filter Laporan */}
      {showReportFilter && (
        <Dialog open={showReportFilter} onOpenChange={setShowReportFilter}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Filter Laporan</DialogTitle>
              <DialogDescription>
                Pilih jenis laporan yang akan diunduh
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Jenis Laporan</label>
                <div className="space-y-2">
                  <label className="flex items-center space-x-2">
                    <input
                      type="radio"
                      name="reportType"
                      value="all"
                      checked={reportFilter.type === 'all'}
                      onChange={(e) => setReportFilter(prev => ({ ...prev, type: e.target.value as 'all' | 'specific' }))}
                      className="form-radio"
                    />
                    <span>Semua Data</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="radio"
                      name="reportType"
                      value="specific"
                      checked={reportFilter.type === 'specific'}
                      onChange={(e) => setReportFilter(prev => ({ ...prev, type: e.target.value as 'all' | 'specific' }))}
                      className="form-radio"
                    />
                    <span>Per Jenis Pemeriksaan</span>
                  </label>
                </div>
              </div>
              
              {reportFilter.type === 'specific' && (
                <div>
                  <label className="block text-sm font-medium mb-2">Jenis Pemeriksaan</label>
                  <select
                    value={reportFilter.jenisPemeriksaan}
                    onChange={(e) => setReportFilter(prev => ({ ...prev, jenisPemeriksaan: e.target.value }))}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  >
                    <option value="">Pilih jenis pemeriksaan...</option>
                    {rows.map((row, index) => (
                      <option key={index} value={row.jenis_pemeriksaan}>
                        {row.jenis_pemeriksaan}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
            
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setShowReportFilter(false)}>
                Batal
              </Button>
              <Button 
                onClick={handleDownloadReport}
                disabled={reportFilter.type === 'specific' && !reportFilter.jenisPemeriksaan}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Unduh Laporan
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default KalkulasiBiayaLaboratorium;



