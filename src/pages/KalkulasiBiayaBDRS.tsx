import React, { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import Papa from "papaparse";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import BahanFarmasiForm from "@/components/BahanFarmasiForm";
import { Edit, Trash2, Calculator, RefreshCw, Download, Upload, Plus } from "lucide-react";
import { manualRecalculateBdrs, handleDatabaseError } from "@/utils/database-operations";
import * as XLSX from "xlsx";
import { useReportDownload } from "@/components/report";


const KalkulasiBiayaBDRS: React.FC = () => {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [userId, setUserId] = useState<string | null>(null);
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
  const [autoUpdateInterval, setAutoUpdateInterval] = useState<any>(null);
  const [showBahanFarmasiForm, setShowBahanFarmasiForm] = useState<boolean>(false);
  const [selectedRowForBahan, setSelectedRowForBahan] = useState<any | null>(null);
  const [bahanFarmasiList, setBahanFarmasiList] = useState<any[]>([]);
  const [showManualInput, setShowManualInput] = useState<boolean>(false);
  const [manualInputData, setManualInputData] = useState<any>({});
  const [showReportFilter, setShowReportFilter] = useState<boolean>(false);
  const [reportFilter, setReportFilter] = useState<{type: 'all' | 'specific', jenisPemeriksaan: string}>({type: 'all', jenisPemeriksaan: ''});
  const [jenisFilterInput, setJenisFilterInput] = useState<string>('');
  const [selectedJenisFilters, setSelectedJenisFilters] = useState<string[]>([]);
  const [showFilterSuggestions, setShowFilterSuggestions] = useState<boolean>(false);
  const [recalculating, setRecalculating] = useState<boolean>(false);
  const [recalcProgress, setRecalcProgress] = useState<{step: number, total: number, message: string}>({step: 0, total: 5, message: ''});
  const [downloadingReport, setDownloadingReport] = useState<boolean>(false);
  const { downloadReport } = useReportDownload();

  // Total biaya bahan (Rp) dari daftar, untuk ringkasan di bagian bawah form
  const totalBiayaBahan = useMemo(() => {
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
        console.log("Session user ID:", currentUserId);
        setUserId(currentUserId);
        
        // If no session, try to load data anyway (for testing)
        if (!currentUserId) {
          console.log("No session found, trying to load data anyway...");
          setTimeout(async () => {
            try {
              await loadData('3394a4f5-b2ec-444d-b290-a6bdf477dc99'); // Fallback user ID
            } catch (err) {
              console.error("Fallback load failed:", err);
            }
          }, 1000);
        }
      } catch (err) {
        console.error("Error getting session:", err);
      }
    };
    
    initializeUser();
  }, []);

  // Load data when userId and year are available
  useEffect(() => {
    console.log("=== USEEFFECT TRIGGERED ===");
    console.log("UserId:", userId);
    console.log("Year:", year);
    
    let isMounted = true;
    
    const loadDataWhenReady = async () => {
      console.log("loadDataWhenReady called");
      if (userId && isMounted) {
        console.log("UserId available, starting data load");
        try {
          // Generate initial data if not exists
          console.log("Generating initial data...");
          await generateInitialData(userId);
          
          // Load data
          console.log("Loading data...");
          await loadData(userId);
          
          // Setup realtime listener for automatic updates
          const channel = supabase
            .channel('kalkulasi_bdrs_changes')
            .on('postgres_changes', 
              { 
                event: '*', 
                schema: 'public', 
                table: 'kalkulasi_bdrs'
              }, 
              (payload) => {
                console.log('Kalkulasi BDRS change detected:', payload);
                if (isMounted && !loading && !importing && !autoCalculating) {
                  console.log('Auto-updating data due to kalkulasi change...');
                  updateData();
                }
              }
            )
            .on('postgres_changes', 
              { 
                event: '*', 
                schema: 'public', 
                table: 'data_biaya',
                filter: `kode_unit_kerja=eq.UK044`
              }, 
              (payload) => {
                console.log('Data biaya change detected:', payload);
                if (isMounted && !loading && !importing && !autoCalculating) {
                  console.log('Auto-updating data due to data_biaya change...');
                  updateData();
                }
              }
            )
            .on('postgres_changes', 
              { 
                event: '*', 
                schema: 'public', 
                table: 'distribusi_biaya_rekap',
                filter: `kode_unit_kerja=eq.UK044`
              }, 
              (payload) => {
                console.log('Distribusi biaya rekap change detected:', payload);
                if (isMounted && !loading && !importing && !autoCalculating) {
                  console.log('Auto-updating data due to distribusi_biaya_rekap change...');
                  updateData();
                }
              }
            )
            .subscribe();
          
          setAutoUpdateInterval(channel);
        } catch (err) {
          console.error("Error loading data:", err);
        }
      } else {
        console.log("UserId not available or component unmounted");
      }
    };
    
    loadDataWhenReady();
    
    return () => {
      isMounted = false;
      if (autoUpdateInterval) {
        console.log('Unsubscribing from realtime channel...');
        supabase.removeChannel(autoUpdateInterval);
      }
    };
  }, [userId, year]);

  const generateInitialData = async (currentUserId: string) => {
    try {
      console.log("Checking existing data for user:", currentUserId, "year:", year);
      const { data: existingData, error: checkError } = await supabase
        .from("kalkulasi_bdrs")
        .select("id")
        .eq("tahun", year)
        .limit(1);
        
      console.log("Existing data check result:", { existingData, checkError });
        
      if (checkError) {
        console.error("Error checking existing data:", checkError);
        throw checkError;
      }
        
      if (!existingData || existingData.length === 0) {
        console.log("No existing data found, generating initial data for user:", currentUserId);
        
        // Get all BDRS tindakan
        const { data: tindakanList, error: tindakanError } = await supabase
          .from("tindakan_bdrs")
          .select("kode, nama")
          .order("kode", { ascending: true });
        
        if (tindakanError) {
          console.error("Error fetching tindakan_bdrs:", tindakanError);
          throw tindakanError;
        }
        
        if (!tindakanList || tindakanList.length === 0) {
          console.log("No tindakan_bdrs found, cannot generate initial data");
          toast.error("Tidak ada data tindakan BDRS. Silakan tambahkan data tindakan BDRS terlebih dahulu.");
          return;
        }
        
        // Create initial data for each tindakan (akan di-UPSERT via RPC)
        const initialData = tindakanList.map(tindakan => ({
          kode: tindakan.kode,
          jenis_pemeriksaan: tindakan.nama,
          jumlah: 0,
          waktu_pemeriksaan: 0,
          profesionalisme: 1,
          tingkat_kesulitan: 1,
          biaya_bahan_pemeriksaan_numeric: 0,
          bahan_pemeriksaan: null
        }));
        
        // Gunakan RPC bulk_upsert untuk menghindari pelanggaran unique constraint
        const { data: insertResult, error: insertError } = await supabase.rpc('bulk_upsert_kalkulasi_bdrs', {
          p_user_id: currentUserId,
          p_tahun: year,
          p_data: initialData
        } as any);
        
        if (insertError) {
          console.error("Error inserting initial data:", insertError);
          throw insertError;
        }
        
        const generateResult = { insertResult };
        const generateError = null;
        
        console.log("Generate function result:", { generateResult, generateError });
        
        if (generateError) {
          console.error("Error generating initial data:", generateError);
          throw generateError;
        }
        
        console.log("Initial data generated successfully:", insertResult?.length, "records");
        
        // Jalankan kalkulasi otomatis setelah generate data awal
        try {
          // 1. Hitung hasil_kali
          await supabase.rpc('fix_hasil_kali_bdrs', {
            p_user_id: currentUserId,
            p_tahun: year
          });
          
          // 2. Hitung dasar_alokasi
          await supabase.rpc('fix_dasar_alokasi_bdrs', {
            p_user_id: currentUserId,
            p_tahun: year
          });
          
          // 3. Hitung semua biaya
          await supabase.rpc('fix_biaya_calculation_bdrs_correct', {
            p_user_id: currentUserId,
            p_tahun: year
          });
          
          console.log("Initial calculations completed successfully");
        } catch (calcError) {
          console.error("Error in initial calculations:", calcError);
        }
      } else {
        console.log("Data already exists for user:", currentUserId, "year:", year);
      }
    } catch (err: any) {
      console.error("Error in generateInitialData:", err);
      throw err;
    }
  };

  const loadData = async (currentUserId?: string) => {
    const userIdToUse = currentUserId || userId;
    console.log("=== LOAD DATA START ===");
    console.log("User ID:", userIdToUse);
    console.log("Year:", year);
    
    setLoading(true);
    try {
      // Pastikan user_id ada sebelum query
      if (!userIdToUse) {
        console.log("No user ID, skipping load");
        setRows([]);
        setLoading(false);
        return;
      }

    const { data, error } = await supabase
      .from("kalkulasi_bdrs")
        .select(`
        id, kode, kode_unit_kerja, jenis_pemeriksaan, jumlah, waktu_pemeriksaan, profesionalisme, tingkat_kesulitan, 
        hasil_kali_waktu, dasar_alokasi_waktu, hasil_kali, dasar_alokasi_hasil_kali, 
        biaya_bahan_pemeriksaan_numeric, unit_cost_per_pemeriksaan, bahan_pemeriksaan,
        biaya_gaji_tunjangan, biaya_rumah_tangga, biaya_cetak, biaya_atk, biaya_listrik, 
        biaya_air, biaya_telp, biaya_pemeliharaan_bangunan, biaya_pemeliharaan_alat_medis,
        biaya_pemeliharaan_alat_non_medis, biaya_operasional_lainnya, biaya_penyusutan_gedung,
        biaya_penyusutan_jaringan, biaya_penyusutan_alat_medis, biaya_penyusutan_alat_non_medis,
        biaya_pendidikan_pelatihan, biaya_laundry, biaya_sterilisasi, biaya_tidak_langsung_terdistribusi
      `)
      .eq("tahun", year)
      .order("jenis_pemeriksaan", { ascending: true });
        
      console.log("Load query result:", { data, error });
      console.log("Data length:", data?.length);
      console.log("Error details:", error);
        
    if (error) {
        console.error("Error fetching data:", error);
        toast.error(`Gagal memuat data kalkulasi: ${error.message}`);
        setRows([]);
      } else {
        console.log("Fetched data:", data?.length, "rows");
        console.log("Sample data:", data?.slice(0, 2));
        
        // Store data in state - always set data, even if empty
        const processedData = data || [];
        setRows(processedData);
        
        console.log("Data set to state:", processedData.length, "rows");
        
        // Store in localStorage for persistence
        try {
          localStorage.setItem(`kalkulasi_bdrs_${userIdToUse}_${year}`, JSON.stringify(processedData));
          console.log("Data saved to localStorage");
        } catch (storageError) {
          console.warn("Could not save to localStorage:", storageError);
        }
      }
    } catch (err: any) {
      console.error("Load error:", err);
      toast.error("Gagal memuat data kalkulasi.");
      setRows([]);
    } finally {
      setLoading(false);
      console.log("=== LOAD DATA END ===");
    }
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
    const selectedSet = new Set(selectedJenisFilters);
    return [...base.filter(j => !selectedSet.has(j)), ...base.filter(j => selectedSet.has(j))].slice(0, 12);
  }, [jenisOptions, jenisFilterInput, selectedJenisFilters]);

  const handleManualRecalculation = async () => {
    if (!userId) {
      toast.error("User tidak ditemukan. Silakan login kembali.");
      return;
    }

    if (!confirm("Apakah Anda yakin ingin melakukan rekalkulasi? Proses ini akan memperbarui semua kalkulasi biaya berdasarkan rumus tabel.")) {
      return;
    }

    try {
      setRecalculating(true);
      setRecalcProgress({step: 1, total: 5, message: 'Memulai rekalkulasi...'});

      console.log("🔄 Starting manual recalculation...");

      setRecalcProgress({step: 2, total: 5, message: 'Menghitung hasil kali dan dasar alokasi...'});
      
      // Jalankan rekalkulasi secara global (tanpa filter user) agar sesuai desain data saat ini
      // Rekalkulasi menggunakan data terupdate dari data sumber sesuai kombinasi kode dan tahun
      const result = await manualRecalculateBdrs(year, undefined);

      setRecalcProgress({step: 4, total: 5, message: 'Memperbarui tampilan data...'});
      
      // Refresh data setelah recalculation
      await updateData();
      // Tambahan: pastikan sinkron dengan DB (beberapa generated column baru tersaji setelah commit selesai)
      await new Promise((r) => setTimeout(r, 600));
      await updateData();

      setRecalcProgress({step: 5, total: 5, message: 'Selesai!'});

      // Show detailed success message
      toast.success(
        `🎉 Rekalkulasi berhasil diselesaikan!\n` +
        `📊 ${result.affected_rows} records diperbarui\n` +
        `⏱️ Waktu eksekusi: ${result.execution_time_seconds?.toFixed(2)}s`
      );

      console.log("✅ Manual recalculation completed successfully");
      console.log("📈 Recalculation stats:", result);
      
    } catch (error: any) {
      console.error("Manual recalculation failed:", error);
      toast.error(`❌ Gagal melakukan rekalkulasi: ${error.message}`);
    } finally {
      setRecalculating(false);
      setRecalcProgress({step: 0, total: 5, message: ''});
    }
  };

  const updateData = async () => {
    console.log("=== UPDATE DATA START ===");
    try {
      if (!userId) {
        console.log("No user ID, skipping update");
        return;
      }

      // Use loadData function for consistency
      await loadData(userId);
      
    } catch (err: any) {
      console.error("Update error:", err);
      toast.error("Gagal memperbarui data.");
    } finally {
      console.log("=== UPDATE DATA END ===");
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
        .from("kalkulasi_bdrs")
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
        .from("kalkulasi_bdrs")
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
      if (!userId) {
        toast.error("User tidak ditemukan. Silakan login kembali.");
        return;
      }

      setAutoCalculating(true);
      
      // Cari tindakan BDRS berdasarkan nama
      const { data: tindakan, error: tindakanError } = await supabase
        .from("tindakan_bdrs")
        .select("kode, nama")
        .eq("nama", data.jenis_pemeriksaan)
        .single();

      if (tindakanError || !tindakan) {
        toast.error("Jenis pemeriksaan tidak ditemukan dalam master data");
        setAutoCalculating(false);
        return;
      }

      if (data.id) {
        // Update existing data
        const { error: updateError } = await supabase
          .from("kalkulasi_bdrs")
          .update({
            kode: tindakan.kode,
            jenis_pemeriksaan: data.jenis_pemeriksaan,
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
        // Insert/Update data baru via UPSERT RPC untuk menghormati unique (kode, tahun)
        const { error: upsertError } = await supabase.rpc('upsert_kalkulasi_bdrs', {
          p_user_id: userId,
          p_tahun: year,
          p_kode: tindakan.kode,
          p_jenis_pemeriksaan: data.jenis_pemeriksaan,
          p_bahan_pemeriksaan: null,
          p_jumlah: data.jumlah || 0,
          p_waktu_pemeriksaan: data.waktu_pemeriksaan || 0,
          p_profesionalisme: data.profesionalisme || 1,
          p_tingkat_kesulitan: data.tingkat_kesulitan || 1,
          p_bahan_pemeriksaan_numeric: 0
        } as any);

        if (upsertError) {
          console.error("Upsert error:", upsertError);
          throw upsertError;
        }

        toast.success("Data berhasil disimpan!");
      }

      setShowManualInput(false);
      setManualInputData({});
      
      // Trigger kalkulasi otomatis setelah manual input
      setAutoCalculating(true);
      
      try {
        // 1. Hitung hasil_kali
        await supabase.rpc('fix_hasil_kali_bdrs', {
          p_user_id: userId,
          p_tahun: year
        });
        
        // 2. Hitung dasar_alokasi
        await supabase.rpc('fix_dasar_alokasi_bdrs', {
          p_user_id: userId,
          p_tahun: year
        });
        
        // 3. Hitung semua biaya
        await supabase.rpc('fix_biaya_calculation_bdrs_correct', {
          p_user_id: userId,
          p_tahun: year
        });
        
        // 4. Update data di aplikasi
        await updateData();
        
        toast.success("Data berhasil dihitung!");
      } catch (err: any) {
        console.error("Error in calculations:", err);
        toast.error("Gagal menghitung data");
      }
      
      setAutoCalculating(false);
      
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

  const handleDeleteRow = async (row: any) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus data "${row.jenis_pemeriksaan}"?`)) {
      return;
    }

    try {
      setAutoCalculating(true);
      
      const { error } = await supabase
        .from("kalkulasi_bdrs")
        .delete()
        .eq("id", row.id);

      if (error) {
        console.error("Delete error:", error);
        throw error;
      }

      toast.success("Data berhasil dihapus!");
      
      // Trigger kalkulasi otomatis setelah delete
      setAutoCalculating(true);
      
      try {
        // 1. Hitung hasil_kali
        await supabase.rpc('fix_hasil_kali_bdrs', {
          p_user_id: userId,
          p_tahun: year
        });
        
        // 2. Hitung dasar_alokasi
        await supabase.rpc('fix_dasar_alokasi_bdrs', {
          p_user_id: userId,
          p_tahun: year
        });
        
        // 3. Hitung semua biaya
        await supabase.rpc('fix_biaya_calculation_bdrs_correct', {
          p_user_id: userId,
          p_tahun: year
        });
        
        // 4. Update data di aplikasi
        await updateData();
      } catch (err: any) {
        console.error("Error in calculations:", err);
      }
      
      setAutoCalculating(false);
      
    } catch (e: any) {
      console.error("Delete error:", e);
      toast.error(`Gagal menghapus data: ${e.message}`);
      setAutoCalculating(false);
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      const { data, error } = await supabase
        .from("tindakan_bdrs")
        .select("kode, nama")
        .order("nama", { ascending: true });
      if (error) throw error;
      if (!data || data.length === 0) {
        toast.error("Tidak ada data tindakan BDRS.");
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
      XLSX.utils.book_append_sheet(wb, ws, "Template Kalkulasi BDRS");
      XLSX.writeFile(wb, `template_kalkulasi_bdrs_${year}.xlsx`);
      toast.success(`Template berisi ${rowsCsv.length} tindakan berhasil dibuat.`);
    } catch (e: any) {
      console.error(e);
      toast.error(`Gagal membuat template: ${e.message}`);
    }
  };

  const handleDownloadReport = async () => {
    try {
      setDownloadingReport(true);

      const { data: latestData, error: fetchError } = await supabase
        .from('kalkulasi_bdrs')
        .select('*')
        .eq('tahun', year)
        .order('jenis_pemeriksaan');

      if (fetchError) {
        throw fetchError;
      }

      const filteredRows = (latestData || []).filter((row) => {
        if (reportFilter.type === 'specific' && reportFilter.jenisPemeriksaan) {
          return row.jenis_pemeriksaan === reportFilter.jenisPemeriksaan;
        }
        return true;
      });

      if (filteredRows.length === 0) {
        toast.error('Tidak ada data yang sesuai filter untuk diunduh.');
        return;
      }

      const records = filteredRows.map((row: any) => ({
        "Kode": row.kode || '',
        "Kode Unit Kerja": row.kode_unit_kerja || 'UK044',
        "Jenis Pemeriksaan": row.jenis_pemeriksaan || '',
        "Jumlah": row.jumlah || 0,
        "Waktu (menit)": row.waktu_pemeriksaan || 0,
        "Profesionalisme": row.profesionalisme || 1,
        "Tingkat Kesulitan": row.tingkat_kesulitan || 1,
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
        "Unit Cost": Math.round(row.unit_cost_per_pemeriksaan || 0),
      }));

      const filterSuffix = reportFilter.type === 'specific'
        ? `_${reportFilter.jenisPemeriksaan.replace(/[^a-zA-Z0-9]/g, '_')}`
        : '_semua';

      await downloadReport({
        title: "Laporan Kalkulasi Biaya BDRS",
        subtitle:
          reportFilter.type === 'specific' && reportFilter.jenisPemeriksaan
            ? `Tahun ${year} • Jenis ${reportFilter.jenisPemeriksaan}`
            : `Tahun ${year}`,
        filename: `laporan_kalkulasi_biaya_bdrs_${year}${filterSuffix}`,
        records,
        orientation: "landscape",
      });

      const filterText = reportFilter.type === 'specific' ? `untuk ${reportFilter.jenisPemeriksaan}` : 'semua data';
      toast.success(`Laporan ${filterText} berisi ${records.length} data berhasil disiapkan.`);

      setShowReportFilter(false);
    } catch (e: any) {
      console.error(e);
      toast.error(`Gagal mengunduh laporan: ${e.message || e}`);
    } finally {
      setDownloadingReport(false);
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (!userId) {
      toast.error("User tidak ditemukan. Silakan login kembali.");
      return;
    }
    
    console.log("=== IMPORT START ===");
    console.log("User ID:", userId);
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
          
          // First, ensure data exists for this user/year
          console.log("Ensuring initial data exists...");
          setImportProgress({current: 0, total: records.length, message: "Menyiapkan data awal...", status: "preparing"});
          await generateInitialData(userId);
          
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
                  .from("tindakan_bdrs")
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
              const { data: existingRecord, error: checkError } = await supabase
                .from("kalkulasi_bdrs")
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
                .from("kalkulasi_bdrs")
                .update({ 
                  jumlah, 
                  waktu_pemeriksaan: waktu, 
                  profesionalisme: prof, 
                  tingkat_kesulitan: sulit 
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
          
          // Trigger kalkulasi otomatis setelah import
          if (successCount > 0) {
            setAutoCalculating(true);
            setImportProgress({current: records.length, total: records.length, message: "Menjalankan kalkulasi otomatis...", status: "calculating"});
            
            try {
              // Jalankan kalkulasi otomatis untuk semua kolom yang perlu dihitung
              console.log("Running automatic calculations after import...");
              
              // 1. Hitung hasil_kali
              const { error: hasilKaliError } = await supabase.rpc('fix_hasil_kali_bdrs', {
                p_user_id: userId,
                p_tahun: year
              });
              
              if (hasilKaliError) {
                console.error("Error calculating hasil_kali:", hasilKaliError);
                toast.error("Error dalam perhitungan hasil_kali");
              }
              
              // 2. Hitung dasar_alokasi
              const { error: alokasiError } = await supabase.rpc('fix_dasar_alokasi_bdrs', {
                p_user_id: userId,
                p_tahun: year
              });
              
              if (alokasiError) {
                console.error("Error calculating dasar alokasi:", alokasiError);
                toast.error("Error dalam perhitungan dasar alokasi");
              }
              
              // 3. Hitung semua biaya
              const { error: biayaError } = await supabase.rpc('fix_biaya_calculation_bdrs_correct', {
                p_user_id: userId,
                p_tahun: year
              });
              
              if (biayaError) {
                console.error("Error calculating biaya:", biayaError);
                toast.error("Error dalam perhitungan biaya");
              }
              
              // 4. Update data di aplikasi
              await updateData();
              
              console.log("Automatic calculations completed successfully");
              toast.success("✅ Import berhasil! Kalkulasi otomatis selesai.");
              
            } catch (calcError: any) {
              console.error("Error in automatic calculations:", calcError);
              toast.error("Import berhasil, tetapi ada error dalam kalkulasi otomatis");
            }
            
            setAutoCalculating(false);
          }
          
          setImporting(false);
          setImportProgress({current: 0, total: 0, message: "", status: ""});
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
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Kalkulasi Biaya BDRS</h1>
        <p className="text-muted-foreground">
          Hitung biaya pemeriksaan BDRS (Bank Darah Rumah Sakit)
        </p>
      </div>
      
      <Card className="border border-sky-100 bg-[#F8FBFF] shadow-sm">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-semibold text-slate-800">Kalkulasi Biaya BDRS</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="template" onClick={handleDownloadTemplate}>
              <Download className="mr-2 h-4 w-4" />
              Unduh Template Impor
            </Button>
            <label htmlFor="bdrs-import" className="cursor-pointer">
              <Button asChild variant="import" disabled={loading || importing || autoCalculating}>
                <span>
                  <Upload className="mr-2 h-4 w-4" />
                  Impor Data
                </span>
              </Button>
            </label>
            <Input id="bdrs-import" type="file" accept=".csv,.xlsx" onChange={handleImport} className="hidden" />
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
                <div className="absolute z-10 mt-1 w-full max-h-60 overflow-auto rounded-md border border-gray-200 bg-white shadow-md">
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
                    {importProgress.status === "calculating" && "🧮 Menjalankan kalkulasi otomatis..."}
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


          <div className="max-w-full overflow-auto rounded-md border border-emerald-100 bg-white">
            <Table className="min-w-full">
              <TableHeader className="bg-[#0f766e]">
                <TableRow className="bg-[#0f766e] hover:bg-[#0f766e]">
                  <TableHead className="min-w-[200px] text-white font-semibold">Jenis Pemeriksaan</TableHead>
                  <TableHead className="w-20 text-white font-semibold">Jumlah</TableHead>
                  <TableHead className="w-20 text-white font-semibold">Waktu</TableHead>
                  <TableHead className="w-20 text-white font-semibold">Prof</TableHead>
                  <TableHead className="w-20 text-white font-semibold">Kesulitan</TableHead>
                  {/* Hidden columns: HK Waktu, Alokasi Waktu, Hasil Kali, Alokasi HK */}
                  <TableHead className="w-24 text-white font-semibold">Bahan Rp</TableHead>
                  <TableHead className="w-32 text-white font-semibold">Biaya Tidak Langsung Terdistribusi</TableHead>
                  <TableHead className="w-24 text-white font-semibold">Unit Cost</TableHead>
                  <TableHead className="w-28 text-white font-semibold">Update Bahan</TableHead>
                  <TableHead className="w-20 text-white font-semibold">Aksi</TableHead>
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
                    <TableCell className="font-medium">{r.jenis_pemeriksaan}</TableCell>
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
                      <div className="flex gap-1">
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
            
            {/* Ringkasan biaya bahan - ditempatkan di bagian bawah, tepat di atas tombol simpan */}
            <div className="bg-gray-50 rounded-lg border p-4 mt-4">
              <div className="text-sm text-gray-600">Jumlah Biaya Bahan</div>
              <div className="text-2xl font-bold text-blue-700">Rp {totalBiayaBahan.toLocaleString()}</div>
              <div className="text-xs text-gray-500 mt-1">Total {bahanFarmasiList.length} item</div>
            </div>
            
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
                {manualInputData.id ? "Edit data pemeriksaan BDRS" : "Tambahkan data pemeriksaan BDRS baru"}
              </DialogDescription>
            </DialogHeader>
            
          <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Jenis Pemeriksaan</label>
                <Input
                  value={manualInputData.jenis_pemeriksaan || ''}
                  onChange={(e) => setManualInputData(prev => ({ ...prev, jenis_pemeriksaan: e.target.value }))}
                  placeholder="Masukkan jenis pemeriksaan"
                />
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
                onClick={() => {
                  void handleDownloadReport();
                }}
                disabled={(reportFilter.type === 'specific' && !reportFilter.jenisPemeriksaan) || downloadingReport}
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

export default KalkulasiBiayaBDRS;