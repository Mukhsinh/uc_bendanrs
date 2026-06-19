import React, { useEffect, useMemo, useState } from "react";
import { useYear } from "@/contexts/YearContext";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import Papa from "papaparse";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { tenantSupabase } from "@/lib/supabase-tenant-wrapper";
import { useTenant } from "@/contexts/TenantContext";
import BahanFarmasiForm from "@/components/BahanFarmasiForm";
import { Edit, Trash2, Download, Calculator, RefreshCw, Check } from "lucide-react";
import { useReportDownload } from "@/components/report";
import { manualRecalculateOperatif, recalculateOperatifBatched, handleDatabaseError } from "@/utils/database-operations";
import * as XLSX from "xlsx";

const KalkulasiBiayaOperatif: React.FC = () => {
  const { selectedYear: contextYear } = useYear();
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [year, setYear] = useState<number>(contextYear);
  const [userId, setUserId] = useState<string | null>(null);
  const [importing, setImporting] = useState<boolean>(false);
  const [autoCalculating, setAutoCalculating] = useState<boolean>(false);
  const [showBahanFarmasiForm, setShowBahanFarmasiForm] = useState<boolean>(false);
  const [selectedRowForBahan, setSelectedRowForBahan] = useState<any | null>(null);
  const [bahanFarmasiList, setBahanFarmasiList] = useState<any[]>([]);
  const [showManualInput, setShowManualInput] = useState<boolean>(false);
  const [manualInputData, setManualInputData] = useState<any>({});
  const [filterOperator, setFilterOperator] = useState<string>('all');
  const [operators, setOperators] = useState<{kode: string, nama: string}[]>([]);
  const [showReportFilter, setShowReportFilter] = useState<boolean>(false);
  const [reportFilter, setReportFilter] = useState<{type: 'all' | 'operator' | 'tindakan', value: string}>({type: 'all', value: ''});
  const [downloadingReport, setDownloadingReport] = useState(false);
  const { downloadReport } = useReportDownload();
  const [tindakanList, setTindakanList] = useState<{kode: string, nama: string}[]>([]);
  const [recalculating, setRecalculating] = useState<boolean>(false);
  const [recalcProgress, setRecalcProgress] = useState<{step: number, total: number, message: string}>({step: 0, total: 5, message: ''});
  const [dataOwnerId, setDataOwnerId] = useState<string | null>(null);
  const [tindakanFilterOpen, setTindakanFilterOpen] = useState(false);
  const [selectedTindakanFilters, setSelectedTindakanFilters] = useState<string[]>([]);

  // Total biaya bahan dari daftar saat ini (untuk ringkasan di footer form bahan)
  const totalBahanFarmasi = useMemo(() => {
    return (bahanFarmasiList || []).reduce((sum: number, item: any) => {
      const hargaTotal = Number(
        item?.harga_total ?? item?.hargaTotal ?? ((Number(item?.qty || 0)) * (Number(item?.harga_satuan || item?.hargaSatuan || 0)))
      );
      return sum + (isNaN(hargaTotal) ? 0 : hargaTotal);
    }, 0);
  }, [bahanFarmasiList]);

  // Initialize user session
  useEffect(() => {
    const initializeUser = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const currentUserId = session?.user?.id || null;
        setUserId(currentUserId);
      } catch (err) {
        console.error("Error getting session:", err);
      }
    };
    initializeUser();
  }, []);

  useEffect(() => {
    setDataOwnerId(null);
  }, [year]);

  // Load data when userId and year are available
  useEffect(() => {
    if (userId) {
      loadData(userId);
      loadOperators();
      loadTindakanList();
    }
  }, [userId, year, filterOperator]);

  const loadOperators = async () => {
    try {
      const { data, error } = await supabase
        .from("tindakan_operatif")
        .select("kode_operator_spesialistik, nama_operator_spesialistik")
        .order("kode_operator_spesialistik");
      
      if (error) throw error;
      
      // Get unique operators
      const uniqueOperators = Array.from(
        new Set(data?.map(d => JSON.stringify({kode: d.kode_operator_spesialistik, nama: d.nama_operator_spesialistik})))
      ).map(str => JSON.parse(str));
      
      setOperators(uniqueOperators);
    } catch (err: any) {
      console.error("Error loading operators:", err);
    }
  };

  const loadTindakanList = async () => {
    try {
      const { data, error } = await supabase
        .from("tindakan_operatif")
        .select("kode_tindakan_operatif, nama_tindakan_operatif")
        .order("nama_tindakan_operatif");
      
      if (error) throw error;
      
      const uniqueTindakan = Array.from(
        new Set(data?.map(d => JSON.stringify({kode: d.kode_tindakan_operatif, nama: d.nama_tindakan_operatif})))
      ).map(str => JSON.parse(str));
      
      setTindakanList(uniqueTindakan);
    } catch (err: any) {
      console.error("Error loading tindakan:", err);
    }
  };

  const toggleTindakanFilter = (namaTindakan: string) => {
    setSelectedTindakanFilters((prev) => {
      if (prev.includes(namaTindakan)) {
        return prev.filter((nama) => nama !== namaTindakan);
      }
      return [...prev, namaTindakan];
    });
  };

  const clearTindakanFilters = () => setSelectedTindakanFilters([]);

  const generateInitialData = async (currentUserId: string): Promise<string | null> => {
    try {
      const { data: existingData, error: checkError } = await tenantSupabase
        .from("kalkulasi_biaya_operatif")
        .select("id, user_id")
        .eq("tahun", year)
        .limit(1);

      if (checkError) throw checkError;

      if (existingData && existingData.length > 0) {
        return existingData[0]?.user_id ?? null;
      }

      const { error: createError } = await supabase.rpc('create_kalkulasi_biaya_operatif_data', {
        p_user_id: currentUserId,
        p_tahun: year
      });

      if (createError) throw createError;

      const ownerId = currentUserId;

      const { error: alokasiError } = await supabase.rpc('fix_dasar_alokasi_operatif', {
        p_user_id: ownerId,
        p_tahun: year
      });

      if (alokasiError) console.error("Error calculating dasar alokasi:", alokasiError);

      const { error: biayaError } = await supabase.rpc('fix_biaya_calculation_operatif', {
        p_user_id: ownerId,
        p_tahun: year
      });

      if (biayaError) console.error("Error calculating biaya:", biayaError);

      return ownerId;
    } catch (err: any) {
      console.error("Error in generateInitialData:", err);
      return null;
    }
  };

  const loadData = async (currentUserId?: string) => {
    const userIdToUse = currentUserId || userId;
    if (!userIdToUse) return;

    setLoading(true);
    try {
      const startTime = performance.now();

      // Use tenant-aware client for automatic tenant filtering
      let query = tenantSupabase
        .from("kalkulasi_biaya_operatif")
        .select(`
          id,
          kode,
          kode_operator_spesialistik,
          nama_operator_spesialistik,
          jenis_pemeriksaan,
          jumlah,
          waktu_pemeriksaan,
          profesionalisme,
          tingkat_kesulitan,
          biaya_bahan_pemeriksaan_numeric,
          biaya_tidak_langsung_terdistribusi,
          unit_cost_per_tindakan,
          bahan_pemeriksaan,
          created_at,
          updated_at,
          user_id
        `)
        .eq("tahun", year);

      if (filterOperator !== 'all') {
        query = query.eq("kode_operator_spesialistik", filterOperator);
      }

      const { data, error } = await query.order("kode", { ascending: true });

      const endTime = performance.now();
      console.log(`📊 Data fetch took ${(endTime - startTime).toFixed(2)}ms`);

      if (error) {
        toast.error(`Gagal memuat data: ${error.message}`);
        setRows([]);
      } else {
        setRows(data || []);
      }
    } catch (err: any) {
      toast.error("Gagal memuat data kalkulasi.");
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  const handleManualRecalculation = async () => {
    const ownerId = dataOwnerId || userId;
    if (!ownerId) {
      toast.error("User tidak ditemukan. Silakan login kembali.");
      return;
    }

    if (!confirm("Apakah Anda yakin ingin melakukan rekalkulasi? Proses ini akan memperbarui semua kalkulasi biaya Operatif (IBS/UK074) berdasarkan rumus tabel.")) {
      return;
    }

    try {
      setRecalculating(true);
      setRecalcProgress({step: 0, total: 1, message: 'Menyiapkan batch operator...'});

      console.log("🔄 Starting batched manual recalculation for operatif (IBS/UK074)...");
      const startTime = performance.now();

      const batchResult = await recalculateOperatifBatched(year, ownerId, ({ current, total, operator, message }) => {
        setRecalcProgress({ step: current, total: Math.max(total, 1), message: message || `Memproses operator ${operator || ''}...` });
      });

      setRecalcProgress(prev => ({ ...prev, message: 'Memperbarui tampilan data...' }));

      // Refresh data setelah recalculation
      await loadData();

      const endTime = performance.now();
      const totalTime = (endTime - startTime) / 1000;

      setRecalcProgress(prev => ({ ...prev, step: prev.total, message: 'Selesai!' }));

      // Show detailed success message with batch results
      toast.success(
        `🎉 Rekalkulasi batch Operatif selesai!\n` +
        `👨‍⚕️ Operator diproses: ${batchResult.totalOperators}\n` +
        `✅ Berhasil: ${batchResult.succeeded} | ❌ Gagal: ${batchResult.failed}\n` +
        `📊 Rows diperbarui: ${batchResult.totalAffected}\n` +
        `⏱️ Total waktu: ${totalTime.toFixed(2)}s (DB ~${batchResult.totalDbSeconds.toFixed(2)}s)`
      );

      console.log("✅ Batched manual recalculation completed successfully");
      console.log("📈 Recalculation stats:", batchResult);
      console.log(`⚡ Performance: Total ${totalTime.toFixed(2)}s, DB ${batchResult.totalDbSeconds.toFixed(2)}s`);
      
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
      
      toast.error(`❌ Gagal melakukan rekalkulasi Operatif: ${errorMessage}`);
    } finally {
      setRecalculating(false);
      setRecalcProgress({step: 0, total: 1, message: ''});
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      const { data, error } = await supabase
        .from("tindakan_operatif")
        .select("kode_tindakan_operatif, nama_tindakan_operatif, kode_operator_spesialistik, nama_operator_spesialistik")
        .order("kode_tindakan_operatif");
        
      if (error) throw error;
      if (!data || data.length === 0) {
        toast.error("Tidak ada data tindakan operatif.");
        return;
      }

      const headers = [
        "Kode Tindakan",
        "Nama Tindakan",
        "Kode Operator",
        "Nama Operator",
        "Jumlah",
        "Waktu Pemeriksaan",
        "Profesionalisme (1-4)",
        "Tingkat Kesulitan (1-7)",
      ];

      const rowsCsv = data.map((d: any) => ({
        "Kode Tindakan": d.kode_tindakan_operatif,
        "Nama Tindakan": d.nama_tindakan_operatif,
        "Kode Operator": d.kode_operator_spesialistik,
        "Nama Operator": d.nama_operator_spesialistik,
        "Jumlah": "",
        "Waktu Pemeriksaan": "",
        "Profesionalisme (1-4)": "",
        "Tingkat Kesulitan (1-7)": "",
      }));

      const ws = XLSX.utils.aoa_to_sheet([headers, ...rowsCsv.map(row => Object.values(row))]);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Template Kalkulasi Operatif");
      XLSX.writeFile(wb, `template_kalkulasi_operatif_${year}.xlsx`);
      toast.success(`Template berisi ${rowsCsv.length} tindakan berhasil dibuat.`);
    } catch (e: any) {
      toast.error(`Gagal membuat template: ${e.message}`);
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const ownerId = dataOwnerId || userId;
    if (!file || !ownerId) return;
    
    e.target.value = "";
    setImporting(true);
    
    try {
      const text = await file.text();
      Papa.parse(text, {
        header: true,
        skipEmptyLines: true,
        complete: async (res) => {
          const records = res.data as any[];
          
          if (!records || records.length === 0) {
            toast.error("File CSV kosong.");
            setImporting(false);
            return;
          }

          await generateInitialData(ownerId);
          
          let successCount = 0;
          let errorCount = 0;

          for (let i = 0; i < records.length; i++) {
            const r = records[i];
            const kodeTindakan = (r["Kode Tindakan"] || "").toString().trim();
            const jumlah = parseInt(r["Jumlah"] || "0", 10) || 0;
            const waktu = parseInt(r["Waktu Pemeriksaan"] || "0", 10) || 0;
            const prof = Math.max(1, Math.min(4, parseInt(r["Profesionalisme (1-4)"] || "1", 10) || 1));
            const sulit = Math.max(1, Math.min(7, parseInt(r["Tingkat Kesulitan (1-7)"] || "1", 10) || 1));

            try {
              const { data: existingRecord, error: checkError } = await tenantSupabase
                .from("kalkulasi_biaya_operatif")
                .select("id")
                .eq("tahun", year)
                .eq("kode", kodeTindakan)
                .maybeSingle();

              if (checkError || !existingRecord) {
                errorCount++;
                continue;
              }

              const { error: updateError } = await tenantSupabase
                .from("kalkulasi_biaya_operatif")
                .update({ jumlah, waktu_pemeriksaan: waktu, profesionalisme: prof, tingkat_kesulitan: sulit })
                .eq("id", existingRecord.id);

              if (updateError) {
                errorCount++;
              } else {
                successCount++;
              }
            } catch (err: any) {
              errorCount++;
            }
          }
          
          if (successCount > 0) {
            setAutoCalculating(true);
            toast.info("Menjalankan kalkulasi otomatis...");
            
            const { error: alokasiError } = await supabase.rpc('fix_dasar_alokasi_operatif', {
              p_user_id: ownerId,
              p_tahun: year
            });
            
            if (alokasiError) {
              console.error("Error fix_dasar_alokasi_operatif:", alokasiError);
              toast.error(`Gagal menghitung dasar alokasi: ${alokasiError.message}`);
            }
            
            const { error: biayaError } = await supabase.rpc('fix_biaya_calculation_operatif', {
              p_user_id: ownerId,
              p_tahun: year
            });
            
            if (biayaError) {
              console.error("Error fix_biaya_calculation_operatif:", biayaError);
              toast.error(`Gagal menghitung biaya: ${biayaError.message}`);
            }
            
            await loadData(userId);
            setAutoCalculating(false);
            toast.success(`✅ Import & kalkulasi selesai! Berhasil: ${successCount}, Gagal: ${errorCount}`);
          } else {
            toast.warning(`Import selesai. Gagal: ${errorCount}`);
          }
          
          setImporting(false);
        },
        error: (err: any) => {
          toast.error(`Gagal membaca CSV: ${err.message}`);
          setImporting(false);
        },
      });
    } catch (err: any) {
      toast.error(`Gagal memproses file: ${err.message}`);
      setImporting(false);
    }
  };

  const handleEditRow = (row: any) => {
    setManualInputData({
      id: row.id,
      kode_tindakan: row.kode,
      nama_tindakan: row.jenis_pemeriksaan,
      jumlah: row.jumlah,
      waktu_pemeriksaan: row.waktu_pemeriksaan,
      profesionalisme: row.profesionalisme,
      tingkat_kesulitan: row.tingkat_kesulitan
    });
    setShowManualInput(true);
  };

  const handleDeleteRow = async (row: any) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus data "${row.jenis_pemeriksaan}"?`)) {
      return;
    }

    try {
      setAutoCalculating(true);
      
      // Use tenant-aware client for automatic tenant filtering
      const { error } = await tenantSupabase
        .from("kalkulasi_biaya_operatif")
        .delete()
        .eq("id", row.id);

      if (error) {
        console.error("Delete error:", error);
        throw error;
      }

      toast.success("Data berhasil dihapus!");
      await loadData(userId);
      setAutoCalculating(false);
    } catch (err: any) {
      toast.error(`Gagal menghapus data: ${err.message}`);
      setAutoCalculating(false);
    }
  };

  const handleManualInput = async (data: any) => {
    try {
      const ownerId = dataOwnerId || userId;
      if (!ownerId) {
        toast.error("User tidak ditemukan. Silakan login kembali.");
        return;
      }

      setAutoCalculating(true);

      if (data.id) {
        // Update existing data
        // Use tenant-aware client for automatic tenant filtering
        const { error: updateError } = await tenantSupabase
          .from("kalkulasi_biaya_operatif")
          .update({
            jumlah: data.jumlah || 0,
            waktu_pemeriksaan: data.waktu_pemeriksaan || 0,
            profesionalisme: data.profesionalisme || 1,
            tingkat_kesulitan: data.tingkat_kesulitan || 1
          })
          .eq("id", data.id);

        if (updateError) {
          console.error("Update error:", updateError);
          throw updateError;
        }

        toast.success("Data berhasil diupdate!");
      } else {
        // Insert data baru (jika memungkinkan)
        toast.info("Fitur menambah data baru akan segera tersedia.");
        setAutoCalculating(false);
        return;
      }

      // Run calculations
      await supabase.rpc('fix_dasar_alokasi_operatif', {
        p_user_id: ownerId,
        p_tahun: year
      });
      
      await supabase.rpc('fix_biaya_calculation_operatif', {
        p_user_id: ownerId,
        p_tahun: year
      });

      await loadData(userId);
      setShowManualInput(false);
      setManualInputData({});
      setAutoCalculating(false);
    } catch (err: any) {
      toast.error(`Gagal menyimpan data: ${err.message}`);
      setAutoCalculating(false);
    }
  };

  const handleDownloadReport = async () => {
    try {
      setDownloadingReport(true);

      // Records untuk PDF: menggunakan data frontend (filteredRows yang ditampilkan di tabel)
      const recordsForPdf = filteredRows.map((r: any) => ({
        "Kode": r.kode || '',
        "Nama Tindakan": r.jenis_pemeriksaan || '',
        "Jumlah": r.jumlah || 0,
        "Waktu": r.waktu_pemeriksaan || 0,
        "Prof": r.profesionalisme || 1,
        "Kesulitan": r.tingkat_kesulitan || 1,
        "Bahan": r.bahan_pemeriksaan && Array.isArray(r.bahan_pemeriksaan) && r.bahan_pemeriksaan.length > 0
          ? `${r.bahan_pemeriksaan.length} item`
          : "Tambah",
        "Bahan Rp": Math.round(r.biaya_bahan_pemeriksaan_numeric || 0),
        "Unit Cost": Math.round(r.unit_cost_per_tindakan || 0),
      }));

      // Records untuk Excel: menggunakan data database (fetch langsung dari database)
      const { data: latestData, error: fetchError } = await tenantSupabase
        .from('kalkulasi_biaya_operatif')
        .select('*')
        .eq('tahun', year)
        .order('jenis_pemeriksaan');

      if (fetchError) {
        throw fetchError;
      }

      const allRows = latestData || [];
      const filteredRowsDb = allRows.filter((row) => {
        if (reportFilter.type === 'operator' && reportFilter.value) {
          return row.kode_operator_spesialistik === reportFilter.value;
        }
        if (reportFilter.type === 'tindakan' && reportFilter.value) {
          return row.kode === reportFilter.value || row.jenis_pemeriksaan === reportFilter.value;
        }
        return true;
      });

      if (filteredRowsDb.length === 0) {
        toast.error('Tidak ada data yang sesuai filter untuk diunduh.');
        return;
      }

      const recordsForExcel = filteredRowsDb.map((row: any) => ({
        "Kode": row.kode || '',
        "Kode Unit Kerja": row.kode_unit_kerja || 'UK041',
        "Jenis Pemeriksaan": row.jenis_pemeriksaan || '',
        "Jumlah": row.jumlah || 0,
        "Waktu (menit)": row.waktu_pemeriksaan || 0,
        "Profesionalisme": row.profesionalisme || 1,
        "Tingkat Kesulitan": row.tingkat_kesulitan || 1,
        "Hasil Kali": row.hasil_kali || 0,
        "Hasil Kali Waktu": row.hasil_kali_waktu || 0,
        "Dasar Alokasi Waktu": row.dasar_alokasi_waktu || 0,
        "Dasar Alokasi Hasil Kali": row.dasar_alokasi_hasil_kali || 0,
        "Biaya Bahan": Math.round(row.biaya_bahan_pemeriksaan_numeric || 0),
        "Biaya Gaji & Tunjangan": Math.round(row.biaya_gaji_tunjangan || 0),
        "Biaya Jasa Pelayanan": Math.round(row.biaya_jasa_pelayanan || 0),
        "Biaya Obat": Math.round(row.biaya_obat || 0),
        "Biaya BHP": Math.round(row.biaya_bhp || 0),
        "Biaya Makan Karyawan": Math.round(row.biaya_makan_karyawan || 0),
        "Biaya Makan Pasien": Math.round(row.biaya_makan_pasien || 0),
        "Biaya Rumah Tangga": Math.round(row.biaya_rumah_tangga || 0),
        "Biaya Cetak": Math.round(row.biaya_cetak || 0),
        "Biaya ATK": Math.round(row.biaya_atk || 0),
        "Biaya Listrik": Math.round(row.biaya_listrik || 0),
        "Biaya Air": Math.round(row.biaya_air || 0),
        "Biaya Telepon": Math.round(row.biaya_telp || 0),
        "Biaya Pemeliharaan Bangunan": Math.round(row.biaya_pemeliharaan_bangunan || 0),
        "Biaya Pemeliharaan Alat Medis": Math.round(row.biaya_pemeliharaan_alat_medis || 0),
        "Biaya Pemeliharaan Alat Non Medis": Math.round(row.biaya_pemeliharaan_alat_non_medis || 0),
        "Biaya Operasional Lainnya": Math.round(row.biaya_operasional_lainnya || 0),
        "Biaya Penyusutan Gedung": Math.round(row.biaya_penyusutan_gedung || 0),
        "Biaya Penyusutan Jaringan": Math.round(row.biaya_penyusutan_jaringan || 0),
        "Biaya Penyusutan Alat Medis": Math.round(row.biaya_penyusutan_alat_medis || 0),
        "Biaya Penyusutan Alat Non Medis": Math.round(row.biaya_penyusutan_alat_non_medis || 0),
        "Biaya Pendidikan & Pelatihan": Math.round(row.biaya_pendidikan_pelatihan || 0),
        "Biaya Laundry": Math.round(row.biaya_laundry || 0),
        "Biaya Sterilisasi": Math.round(row.biaya_sterilisasi || 0),
        "Biaya Tidak Langsung Terdistribusi": Math.round(row.biaya_tidak_langsung_terdistribusi || 0),
        "Unit Cost": Math.round(row.unit_cost_per_tindakan || 0),
      }));

      let filename = `laporan_kalkulasi_operatif_${year}`;
      if (reportFilter.type === 'operator' && reportFilter.value) {
        filename += `_operator_${reportFilter.value.replace(/[^a-zA-Z0-9]/g, '_')}`;
      } else if (reportFilter.type === 'tindakan' && reportFilter.value) {
        filename += `_tindakan_${reportFilter.value.replace(/[^a-zA-Z0-9]/g, '_')}`;
      }

      const operatorLabel = operators.find((op) => op.kode === reportFilter.value)?.nama;
      const tindakanLabel = tindakanList.find((t) => t.kode === reportFilter.value)?.nama;

      await downloadReport({
        title: "Laporan Kalkulasi Biaya Operatif",
        subtitle:
          reportFilter.type === 'operator' && reportFilter.value
            ? `Tahun ${year} • Operator ${operatorLabel ? `${reportFilter.value} - ${operatorLabel}` : reportFilter.value}`
            : reportFilter.type === 'tindakan' && reportFilter.value
              ? `Tahun ${year} • Tindakan ${tindakanLabel ? `${reportFilter.value} - ${tindakanLabel}` : reportFilter.value}`
              : `Tahun ${year}`,
        filename,
        recordsForPdf,
        recordsForExcel,
        orientation: "landscape",
      });

      toast.success(`Laporan kalkulasi operatif dengan ${recordsForExcel.length} data berhasil disiapkan.`);

      setShowReportFilter(false);
    } catch (e: any) {
      console.error(e);
      toast.error(`Gagal mengunduh laporan: ${e.message || e}`);
    } finally {
      setDownloadingReport(false);
    }
  };

  const filteredRows = useMemo(() => {
    let currentRows = filterOperator === 'all'
      ? rows
      : rows.filter((r) => r.kode_operator_spesialistik === filterOperator);

    if (selectedTindakanFilters.length > 0) {
      const tindakanSet = new Set(selectedTindakanFilters);
      currentRows = currentRows.filter((r) => tindakanSet.has(r.jenis_pemeriksaan));
    }

    return currentRows;
  }, [rows, filterOperator, selectedTindakanFilters]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Kalkulasi Biaya Operatif</h1>
        <p className="text-muted-foreground">
          Hitung biaya operasi dan prosedur operatif
        </p>
      </div>

      <Card>
        <CardContent className="space-y-4 pt-6">
          <div className="flex flex-wrap items-center gap-3">
            <Input 
              type="number" 
              value={year} 
              onChange={(e) => setYear(parseInt(e.target.value || "0", 10) || year)} 
              className="w-[140px] border-slate-200 bg-white text-slate-700"
              placeholder="Tahun"
            />
            <select 
              value={filterOperator} 
              onChange={(e) => setFilterOperator(e.target.value)}
              className="h-10 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
            >
              <option value="all">Semua Operator</option>
              {operators.map((op, idx) => (
                <option key={idx} value={op.kode}>
                  {op.kode} - {op.nama}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Popover open={tindakanFilterOpen} onOpenChange={setTindakanFilterOpen}>
              <PopoverTrigger asChild>
            <Button 
              variant="outline" 
                  className="border-slate-200 bg-white text-slate-700 hover:bg-slate-100"
            >
                  {selectedTindakanFilters.length > 0
                    ? `Tindakan (${selectedTindakanFilters.length})`
                    : "Filter Tindakan"}
            </Button>
              </PopoverTrigger>
              <PopoverContent className="w-72 p-0" align="start">
                <Command>
                  <CommandInput placeholder="Cari nama tindakan..." />
                  <CommandList>
                    <CommandEmpty>Tidak ada tindakan</CommandEmpty>
                    <CommandGroup>
                      {tindakanList.map((t) => {
                        const isSelected = selectedTindakanFilters.includes(t.nama);
                        return (
                          <CommandItem
                            key={`${t.kode}-${t.nama}`}
                            value={t.nama}
                            onSelect={() => toggleTindakanFilter(t.nama)}
                            className="flex items-center justify-between"
                          >
                            <span className="truncate">{t.nama}</span>
                            {isSelected && <Check className="h-4 w-4 text-emerald-600" />}
                          </CommandItem>
                        );
                      })}
                    </CommandGroup>
                  </CommandList>
                </Command>
                {selectedTindakanFilters.length > 0 && (
                  <div className="border-t border-slate-100 px-3 py-2">
                    <Button
                      variant="link"
                      className="px-0 text-sm text-rose-600"
                      onClick={clearTindakanFilters}
                    >
                      Bersihkan pilihan
                    </Button>
                  </div>
                )}
              </PopoverContent>
            </Popover>
            <Button
              onClick={handleDownloadTemplate}
              className="bg-orange-500 text-white hover:bg-orange-600"
              disabled={loading || importing || autoCalculating}
            >
              Unduh Template
            </Button>
            <label className="inline-flex cursor-pointer items-center justify-center rounded-md bg-emerald-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-600">
              Import Data
              <Input type="file" accept=".csv" onChange={handleImport} className="sr-only" />
            </label>
            <Button 
              onClick={() => {
                setManualInputData({});
                setShowManualInput(true);
              }} 
              disabled={loading || importing || autoCalculating}
              className="bg-rose-500 text-white hover:bg-rose-600"
            >
              Input Manual
            </Button>
            <Button 
              onClick={() => setShowReportFilter(true)}
              disabled={loading || importing || autoCalculating || rows.length === 0}
              className="bg-sky-500 text-white hover:bg-sky-600"
            >
              <Download className="mr-2 h-4 w-4" />
              Unduh Laporan
            </Button>
            <Button
              onClick={handleManualRecalculation}
              disabled={loading || importing || autoCalculating || recalculating}
              className="bg-blue-500 text-white hover:bg-blue-600"
            >
              {recalculating ? (
                <span className="flex items-center">
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  {recalcProgress.message || "Rekalkulasi..."}
                </span>
              ) : (
                <span className="flex items-center">
                  <Calculator className="mr-2 h-4 w-4" />
                  Rekalkulasi Semua
                </span>
              )}
            </Button>
            <Button
              onClick={() => loadData()}
              disabled={loading}
              className="bg-purple-600 text-white hover:bg-purple-700"
            >
              Perbarui Data
            </Button>
          </div>
          {selectedTindakanFilters.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {selectedTindakanFilters.map((nama) => (
                <button
                  key={nama}
                  type="button"
                  onClick={() => toggleTindakanFilter(nama)}
                  className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-700 transition hover:bg-slate-100"
                >
                  {nama}
                  <span aria-hidden="true" className="text-slate-400">&times;</span>
                </button>
              ))}
            </div>
          )}
            {recalculating && (
            <div className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-600">
                <div className="flex items-center space-x-2">
                <div className="h-2 w-full rounded-full bg-blue-200">
                    <div 
                    className="h-2 rounded-full bg-blue-600 transition-all duration-300"
                    style={{ width: `${(recalcProgress.step / recalcProgress.total) * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-xs font-medium">
                    {recalcProgress.step}/{recalcProgress.total}
                  </span>
                </div>
              <div className="mt-1 text-xs">{recalcProgress.message}</div>
              </div>
            )}

          {(importing || autoCalculating) && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                <span className="text-sm font-medium text-blue-800">
                  {importing && "Sedang mengimpor data..."}
                  {autoCalculating && "Perhitungan otomatis sedang berjalan..."}
                </span>
              </div>
            </div>
          )}

          <div className="overflow-auto rounded-md border">
            <Table>
              <TableHeader className="bg-[#0f766e]">
                <TableRow className="bg-[#0f766e] hover:bg-[#0f766e]">
                  <TableHead className="text-white">Kode</TableHead>
                  <TableHead className="text-white">Nama Tindakan</TableHead>
                  <TableHead className="text-white">Jumlah</TableHead>
                  <TableHead className="text-white">Waktu</TableHead>
                  <TableHead className="text-white">Prof</TableHead>
                  <TableHead className="text-white">Kesulitan</TableHead>
                  <TableHead className="text-white">Bahan</TableHead>
                  <TableHead className="text-right text-white">Bahan Rp</TableHead>
                  <TableHead className="text-right text-white">Unit Cost</TableHead>
                  <TableHead className="w-[140px] text-center text-white">Aksi</TableHead>
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
                      <div className="text-gray-500">Tidak ada data untuk ditampilkan</div>
                    </TableCell>
                  </TableRow>
                ) : filteredRows.map((r) => {
                  const hasBahan = r.bahan_pemeriksaan && Array.isArray(r.bahan_pemeriksaan) && r.bahan_pemeriksaan.length > 0;
                  
                  // Hitung total biaya bahan dari array bahan_pemeriksaan jika nilai database tidak ada atau 0
                  let totalBiayaBahan = r.biaya_bahan_pemeriksaan_numeric || 0;
                  if ((!totalBiayaBahan || totalBiayaBahan === 0) && hasBahan) {
                    totalBiayaBahan = r.bahan_pemeriksaan.reduce((sum: number, item: any) => {
                      const hargaTotal = Number(
                        item?.harga_total ?? item?.hargaTotal ?? ((Number(item?.qty || 0)) * (Number(item?.harga_satuan || item?.hargaSatuan || 0)))
                      );
                      return sum + (isNaN(hargaTotal) ? 0 : hargaTotal);
                    }, 0);
                  }
                  
                  return (
                    <TableRow key={r.id}>
                      <TableCell className="font-mono text-xs bg-blue-50 font-semibold">{r.kode}</TableCell>
                      <TableCell className="font-medium max-w-[200px]">{r.jenis_pemeriksaan}</TableCell>
                      <TableCell>{r.jumlah}</TableCell>
                      <TableCell>{r.waktu_pemeriksaan}</TableCell>
                      <TableCell>{r.profesionalisme}</TableCell>
                      <TableCell>{r.tingkat_kesulitan}</TableCell>
                      <TableCell>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            setSelectedRowForBahan(r);
                            setBahanFarmasiList(r.bahan_pemeriksaan || []);
                            setShowBahanFarmasiForm(true);
                          }}
                          className={`text-xs ${hasBahan ? 'bg-orange-100 hover:bg-orange-200 text-orange-800 font-semibold' : 'bg-green-100 hover:bg-green-200 text-green-800'}`}
                        >
                          {hasBahan ? `✓ ${r.bahan_pemeriksaan.length}` : 'Tambah'}
                        </Button>
                      </TableCell>
                      <TableCell className="text-right font-semibold">{totalBiayaBahan.toLocaleString()}</TableCell>
                      <TableCell className="text-right font-semibold text-blue-600">{r.unit_cost_per_tindakan?.toLocaleString() || 0}</TableCell>
                      <TableCell className="w-[140px]">
                        <div className="flex items-center justify-center gap-2">
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
                  );
                })}
              </TableBody>
            </Table>
          </div>
          
          <div className="mt-4 text-sm text-muted-foreground">
            Total tindakan ditampilkan: {filteredRows.length} dari {rows.length}
          </div>
        </CardContent>
      </Card>

      {/* Dialog Bahan Farmasi */}
      {showBahanFarmasiForm && selectedRowForBahan && (
        <Dialog 
          open={showBahanFarmasiForm} 
          onOpenChange={() => {
            // Jangan izinkan penutupan melalui onOpenChange
            // Dialog hanya bisa ditutup melalui tombol Batal atau Simpan
          }}
        >
          <DialogContent 
            className="sm:max-w-[900px] max-h-[80vh] overflow-y-auto" 
            onInteractOutside={(e) => {
              // Mencegah penutupan saat klik di luar dialog
              e.preventDefault();
            }} 
            onEscapeKeyDown={(e) => {
              // Mencegah penutupan saat tekan ESC
              e.preventDefault();
            }}
          >
            <DialogHeader>
              <DialogTitle>Update Bahan - {selectedRowForBahan.jenis_pemeriksaan}</DialogTitle>
              <DialogDescription>
                Tambahkan bahan yang digunakan untuk tindakan ini
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <BahanFarmasiForm
                kode={selectedRowForBahan.kode}
                jenisPemeriksaan={selectedRowForBahan.jenis_pemeriksaan}
                onSave={(bahanData: any) => {
                  setBahanFarmasiList([...bahanFarmasiList, bahanData]);
                  toast.success("Bahan berhasil ditambahkan!");
                }}
                onCancel={() => setShowBahanFarmasiForm(false)}
              />
              
              {bahanFarmasiList.length > 0 && (
                <div className="mt-6">
                  <h4 className="font-semibold mb-3">Daftar Bahan ({bahanFarmasiList.length}):</h4>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {bahanFarmasiList.map((bahan, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex-1">
                          <div className="font-medium">{bahan.nama}</div>
                          <div className="text-sm text-gray-600">
                            {bahan.kode_barang} - {bahan.qty} pcs - Rp {bahan.harga_total?.toLocaleString()}
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setBahanFarmasiList(bahanFarmasiList.filter((_, i) => i !== index));
                            toast.success("Bahan dihapus!");
                          }}
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
            
            <DialogFooter className="gap-2 w-full">
              <div className="w-full flex flex-col items-end gap-3">
                {/* Ringkasan total biaya bahan - posisikan kanan bawah di atas tombol simpan */}
                <div className="bg-gray-50 rounded-lg border p-4 text-right w-full sm:w-auto">
                  <div className="text-sm text-gray-600">Jumlah Biaya Bahan</div>
                  <div className="text-2xl font-bold text-blue-700">Rp {totalBahanFarmasi.toLocaleString()}</div>
                  <div className="text-xs text-gray-500 mt-1">Total {bahanFarmasiList.length} item</div>
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setShowBahanFarmasiForm(false);
                      setBahanFarmasiList([]);
                      setSelectedRowForBahan(null);
                    }}
                  >
                    Batal
                  </Button>
                  <Button 
                onClick={async () => {
                  const ownerId = dataOwnerId || userId;
                  if (!ownerId) {
                    toast.error("User tidak ditemukan. Silakan login kembali.");
                    return;
                  }
                  try {
                    setAutoCalculating(true);
                    const { error } = await tenantSupabase
                      .from("kalkulasi_biaya_operatif")
                      .update({ bahan_pemeriksaan: bahanFarmasiList })
                      .eq("id", selectedRowForBahan.id);
                    
                    if (error) throw error;
                    
                    // Run calculations
                    await supabase.rpc('fix_biaya_calculation_operatif', {
                      p_user_id: ownerId,
                      p_tahun: year
                    });
                    
                    toast.success("Bahan disimpan dan biaya dihitung ulang!");
                    setShowBahanFarmasiForm(false);
                    setBahanFarmasiList([]);
                    setSelectedRowForBahan(null);
                    await loadData(userId);
                    setAutoCalculating(false);
                  } catch (e: any) {
                    toast.error(`Gagal menyimpan: ${e.message}`);
                    setAutoCalculating(false);
                  }
                }}
                disabled={autoCalculating}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {autoCalculating ? "Menyimpan..." : "Simpan Semua Bahan"}
              </Button>
                </div>
              </div>
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
                {manualInputData.id ? "Edit Data Tindakan" : "Input Manual Data Tindakan"}
              </DialogTitle>
              <DialogDescription>
                {manualInputData.id ? "Edit data tindakan operatif" : "Tambahkan data tindakan operatif baru"}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              {manualInputData.id && (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-2">Kode Tindakan</label>
                    <Input
                      value={manualInputData.kode_tindakan || ''}
                      disabled
                      className="bg-gray-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Nama Tindakan</label>
                    <Input
                      value={manualInputData.nama_tindakan || ''}
                      disabled
                      className="bg-gray-100"
                    />
                  </div>
                </>
              )}
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Jumlah</label>
                  <Input
                    type="number"
                    min="0"
                    value={manualInputData.jumlah || ''}
                    onChange={(e) => setManualInputData(prev => ({ ...prev, jumlah: parseInt(e.target.value) || 0 }))}
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Waktu Pemeriksaan (menit)</label>
                  <Input
                    type="number"
                    min="0"
                    value={manualInputData.waktu_pemeriksaan || ''}
                    onChange={(e) => setManualInputData(prev => ({ ...prev, waktu_pemeriksaan: parseInt(e.target.value) || 0 }))}
                    placeholder="0"
                  />
                </div>
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
                  <label className="block text-sm font-medium mb-2">Tingkat Kesulitan (1-7)</label>
                  <Input
                    type="number"
                    min="1"
                    max="7"
                    value={manualInputData.tingkat_kesulitan || ''}
                    onChange={(e) => setManualInputData(prev => ({ ...prev, tingkat_kesulitan: parseInt(e.target.value) || 1 }))}
                    placeholder="1-7"
                  />
                </div>
              </div>
            </div>
            
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setShowManualInput(false)}>
                Batal
              </Button>
              <Button 
                onClick={() => handleManualInput(manualInputData)}
                disabled={autoCalculating || (!manualInputData.id && !manualInputData.kode_tindakan)}
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
                      onChange={(e) => setReportFilter({ ...reportFilter, type: 'all', value: '' })}
                      className="w-4 h-4"
                    />
                    <span>Semua Data</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="radio"
                      name="reportType"
                      value="operator"
                      checked={reportFilter.type === 'operator'}
                      onChange={(e) => setReportFilter({ ...reportFilter, type: 'operator', value: '' })}
                      className="w-4 h-4"
                    />
                    <span>Per Operator</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="radio"
                      name="reportType"
                      value="tindakan"
                      checked={reportFilter.type === 'tindakan'}
                      onChange={(e) => setReportFilter({ ...reportFilter, type: 'tindakan', value: '' })}
                      className="w-4 h-4"
                    />
                    <span>Per Jenis Tindakan</span>
                  </label>
                </div>
              </div>
              
              {reportFilter.type === 'operator' && (
                <div>
                  <label className="block text-sm font-medium mb-2">Pilih Operator</label>
                  <select
                    value={reportFilter.value}
                    onChange={(e) => setReportFilter({ ...reportFilter, value: e.target.value })}
                    className="w-full h-10 px-3 py-2 text-sm border border-input rounded-md bg-background"
                  >
                    <option value="">-- Pilih Operator --</option>
                    {operators.map((op, idx) => (
                      <option key={idx} value={op.kode}>
                        {op.kode} - {op.nama}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              
              {reportFilter.type === 'tindakan' && (
                <div>
                  <label className="block text-sm font-medium mb-2">Pilih Jenis Tindakan</label>
                  <select
                    value={reportFilter.value}
                    onChange={(e) => setReportFilter({ ...reportFilter, value: e.target.value })}
                    className="w-full h-10 px-3 py-2 text-sm border border-input rounded-md bg-background"
                  >
                    <option value="">-- Pilih Tindakan --</option>
                    {tindakanList.map((t, idx) => (
                      <option key={idx} value={t.kode}>
                        {t.kode} - {t.nama}
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
                onClick={() => {
                  void handleDownloadReport();
                }}
                disabled={((reportFilter.type === 'operator' || reportFilter.type === 'tindakan') && !reportFilter.value) || downloadingReport}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {downloadingReport ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Download className="h-4 w-4 mr-2" />
                )}
                {downloadingReport ? "Menyiapkan..." : "Unduh Laporan"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default KalkulasiBiayaOperatif;
