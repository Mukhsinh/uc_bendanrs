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
import { Edit, Trash2 } from "lucide-react";
import * as XLSX from "xlsx";


const KalkulasiBiayaIBS: React.FC = () => {
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
            .channel('kalkulasi_biaya_ibs_changes')
            .on('postgres_changes', 
              { 
                event: '*', 
                schema: 'public', 
                table: 'kalkulasi_biaya_ibs',
                filter: `user_id=eq.${userId}`
              }, 
              (payload) => {
                console.log('Kalkulasi biaya IBS change detected:', payload);
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
                filter: `kode_unit_kerja=eq.UK074`
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
                filter: `kode_unit_kerja=eq.UK074`
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
        .from("kalkulasi_biaya_ibs")
        .select("id")
        .eq("user_id", currentUserId)
        .eq("tahun", year)
        .limit(1);
        
      console.log("Existing data check result:", { existingData, checkError });
        
      if (checkError) {
        console.error("Error checking existing data:", checkError);
        throw checkError;
      }
        
      if (!existingData || existingData.length === 0) {
        console.log("No existing data found, generating initial data for user:", currentUserId);
        
        // Buat data awal dengan fungsi sederhana
        const { data: createResult, error: createError } = await supabase.rpc('create_kalkulasi_biaya_ibs_data', {
          p_user_id: currentUserId,
          p_tahun: year
        });
        
        if (createError) {
          console.error("Error creating initial data:", createError);
          throw createError;
        }
        
        // Hitung dasar alokasi
        const { data: alokasiResult, error: alokasiError } = await supabase.rpc('fix_dasar_alokasi_ibs', {
          p_user_id: currentUserId,
          p_tahun: year
        });
        
        if (alokasiError) {
          console.error("Error calculating dasar alokasi:", alokasiError);
          throw alokasiError;
        }
        
        // Hitung biaya
        const { data: biayaResult, error: biayaError } = await supabase.rpc('fix_biaya_calculation_ibs', {
          p_user_id: currentUserId,
          p_tahun: year
        });
        
        if (biayaError) {
          console.error("Error calculating biaya:", biayaError);
          throw biayaError;
        }
        
        const generateResult = { createResult, alokasiResult, biayaResult };
        const generateError = null;
        
        console.log("Generate function result:", { generateResult, generateError });
        
        if (generateError) {
          console.error("Error generating initial data:", generateError);
          if (generateError.message.includes("row-level security policy")) {
            console.error("RLS Policy Error: Akses database terbatas");
          } else {
            console.error(`Gagal membuat data awal: ${generateError.message}`);
          }
          throw generateError;
        } else {
          console.log("Initial data generated successfully");
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
      .from("kalkulasi_biaya_ibs")
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
      .eq("user_id", userIdToUse)
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
          localStorage.setItem(`kalkulasi_ibs_${userIdToUse}_${year}`, JSON.stringify(processedData));
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
        .from("kalkulasi_biaya_ibs")
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
        .from("kalkulasi_biaya_ibs")
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
      
      // Cari tindakan IBS berdasarkan nama
      const { data: tindakan, error: tindakanError } = await supabase
        .from("tindakan_ibs")
        .select("kode_tindakan, nama_tindakan")
        .eq("nama_tindakan", data.jenis_pemeriksaan)
        .single();

      if (tindakanError || !tindakan) {
        toast.error("Jenis pemeriksaan tidak ditemukan dalam master data");
        setAutoCalculating(false);
        return;
      }

      if (data.id) {
        // Update existing data
        const { error: updateError } = await supabase
          .from("kalkulasi_biaya_ibs")
          .update({
            kode: tindakan.kode_tindakan,
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
        // Insert data baru
        const { error: insertError } = await supabase
          .from("kalkulasi_biaya_ibs")
          .insert({
            user_id: userId,
            tahun: year,
            kode: tindakan.kode_tindakan,
            kode_unit_kerja: 'UK074',
            jenis_pemeriksaan: data.jenis_pemeriksaan,
            jumlah: data.jumlah || 0,
            waktu_pemeriksaan: data.waktu_pemeriksaan || 0,
            profesionalisme: data.profesionalisme || 1,
            tingkat_kesulitan: data.tingkat_kesulitan || 1
          });

        if (insertError) {
          console.error("Insert error:", insertError);
          throw insertError;
        }

        toast.success("Data berhasil ditambahkan!");
      }

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

  const handleDeleteRow = async (row: any) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus data "${row.jenis_pemeriksaan}"?`)) {
      return;
    }

    try {
      setAutoCalculating(true);
      
      const { error } = await supabase
        .from("kalkulasi_biaya_ibs")
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
        .from("tindakan_ibs")
        .select("kode_tindakan, nama_tindakan")
        .order("nama_tindakan", { ascending: true });
      if (error) throw error;
      if (!data || data.length === 0) {
        toast.error("Tidak ada data tindakan IBS.");
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
        "Kode Tindakan": d.kode_tindakan,
        "Jenis Pemeriksaan": d.nama_tindakan,
        "Jumlah": "",
        "Waktu Pemeriksaan": "",
        "Profesionalisme (1-4)": "",
        "Tingkat Kesulitan (1-5)": "",
      }));

      const ws = XLSX.utils.aoa_to_sheet([headers, ...rowsCsv.map(row => Object.values(row))]);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Template Kalkulasi IBS");
      XLSX.writeFile(wb, `template_kalkulasi_ibs_${year}.xlsx`);
      a.click();
      toast.success(`Template berisi ${rowsCsv.length} tindakan berhasil dibuat.`);
    } catch (e: any) {
      console.error(e);
      toast.error(`Gagal membuat template: ${e.message}`);
    }
  };

  const handleDownloadReport = async () => {
    try {
      if (!rows || rows.length === 0) {
        toast.error("Tidak ada data untuk diunduh.");
        return;
      }

      // Filter data berdasarkan jenis pemeriksaan jika dipilih
      let filteredRows = rows;
      if (reportFilter.type === 'specific' && reportFilter.jenisPemeriksaan) {
        filteredRows = rows.filter(row => row.jenis_pemeriksaan === reportFilter.jenisPemeriksaan);
        if (filteredRows.length === 0) {
          toast.error("Tidak ada data untuk jenis pemeriksaan yang dipilih.");
          return;
        }
      }

      // Create CSV content for report with all cost columns
      const headers = [
        "Kode",
        "Kode Unit Kerja", 
        "Jenis Pemeriksaan",
        "Jumlah",
        "Waktu (menit)",
        "Prof",
        "Kesulitan",
        "HK Waktu",
        "Alokasi Waktu",
        "Hasil Kali",
        "Alokasi HK",
        "Bahan Rp",
        "Gaji Rp",
        "Jasa Pelayanan Rp",
        "Obat Rp",
        "BHP Rp",
        "Makan Karyawan Rp",
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
        "Kode Unit Kerja": row.kode_unit_kerja || 'UK074',
        "Jenis Pemeriksaan": row.jenis_pemeriksaan || '',
        "Jumlah": row.jumlah || 0,
        "Waktu (menit)": row.waktu_pemeriksaan || 0,
        "Prof": row.profesionalisme || 1,
        "Kesulitan": row.tingkat_kesulitan || 1,
        "HK Waktu": row.hasil_kali_waktu || 0,
        "Alokasi Waktu": row.dasar_alokasi_waktu || 0,
        "Hasil Kali": row.hasil_kali || 0,
        "Alokasi HK": row.dasar_alokasi_hasil_kali || 0,
        "Bahan Rp": row.biaya_bahan_pemeriksaan_numeric || 0,
        "Gaji Rp": row.biaya_gaji_tunjangan || 0,
        "Jasa Pelayanan Rp": row.biaya_jasa_pelayanan || 0,
        "Obat Rp": row.biaya_obat || 0,
        "BHP Rp": row.biaya_bhp || 0,
        "Makan Karyawan Rp": row.biaya_makan_karyawan || 0,
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
      XLSX.utils.book_append_sheet(wb, ws, "Laporan Kalkulasi IBS");
      
      const filterSuffix = reportFilter.type === 'specific' ? `_${reportFilter.jenisPemeriksaan.replace(/[^a-zA-Z0-9]/g, '_')}` : '_semua';
      XLSX.writeFile(wb, `laporan_kalkulasi_biaya_ibs_${year}${filterSuffix}.xlsx`);
      a.click();
      
      const filterText = reportFilter.type === 'specific' ? `untuk ${reportFilter.jenisPemeriksaan}` : 'semua data';
      toast.success(`Laporan ${filterText} berisi ${rowsCsv.length} data berhasil diunduh.`);
      
      setShowReportFilter(false);
    } catch (e: any) {
      console.error(e);
      toast.error(`Gagal mengunduh laporan: ${e.message}`);
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
                  .from("tindakan_ibs")
                  .select("nama_tindakan")
                  .eq("kode_tindakan", kodeTindakan)
                  .maybeSingle();
                
                console.log(`Tindakan lookup result:`, { tind, errT });
                
                if (!errT && tind?.nama_tindakan) {
                  targetJenis = tind.nama_tindakan;
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
                .from("kalkulasi_biaya_ibs")
                .select("id, jenis_pemeriksaan")
                .eq("tahun", year)
                .eq("user_id", userId)
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
                .from("kalkulasi_biaya_ibs")
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
              
              // 1. Hitung hasil_kali dan dasar_alokasi
              const { error: alokasiError } = await supabase.rpc('fix_dasar_alokasi_ibs', {
                p_user_id: userId,
                p_tahun: year
              });
              
              if (alokasiError) {
                console.error("Error calculating dasar alokasi:", alokasiError);
                toast.error("Error dalam perhitungan dasar alokasi");
              }
              
              // 2. Hitung semua biaya
              const { error: biayaError } = await supabase.rpc('fix_biaya_calculation_ibs', {
                p_user_id: userId,
                p_tahun: year
              });
              
              if (biayaError) {
                console.error("Error calculating biaya:", biayaError);
                toast.error("Error dalam perhitungan biaya");
              }
              
              // 3. Update data di aplikasi
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
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Kalkulasi Biaya IBS</h1>
        <p className="text-muted-foreground">
          Hitung biaya pemeriksaan IBS (Instalasi Bank Darah)
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Kalkulasi Biaya IBS</CardTitle>
          <CardDescription>
            Kelola bahan pemeriksaan, impor jumlah & parameter kalkulasi, dan lihat hasil.
            <br />
            <span className="text-green-600 font-medium">✅ Sistem perhitungan otomatis aktif - semua kolom biaya akan dihitung ulang saat data berubah</span>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2 mb-4 items-center">
            <Input type="number" value={year} onChange={(e) => setYear(parseInt(e.target.value || "0", 10) || year)} className="w-[120px]" />
            <Button variant="outline" onClick={handleDownloadTemplate}>Unduh Template Import</Button>
            <Button variant="outline" onClick={() => setShowReportFilter(true)} disabled={loading || importing || autoCalculating || rows.length === 0}>
              Unduh Laporan
            </Button>
            <label className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2 cursor-pointer">
              Import Data
              <Input type="file" accept=".csv,.xlsx" onChange={handleImport} className="sr-only" />
            </label>
            <Button 
              onClick={() => setShowManualInput(true)} 
              disabled={loading || importing || autoCalculating}
              className="bg-green-600 hover:bg-green-700"
            >
              Input Manual
            </Button>
          </div>

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

          {!loading && !importing && !autoCalculating && rows.length > 0 && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-blue-700">
                  ✅ Sistem perhitungan otomatis aktif - data diperbarui saat ada perubahan
                </span>
              </div>
            </div>
          )}


          <div className="rounded-md border overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Kode</TableHead>
                  <TableHead>Kode Unit Kerja</TableHead>
                  <TableHead>Jenis Pemeriksaan</TableHead>
                  <TableHead>Jumlah</TableHead>
                  <TableHead>Waktu</TableHead>
                  <TableHead>Prof</TableHead>
                  <TableHead>Kesulitan</TableHead>
                  <TableHead>HK Waktu</TableHead>
                  <TableHead>Alokasi Waktu</TableHead>
                  <TableHead>Hasil Kali</TableHead>
                  <TableHead>Alokasi HK</TableHead>
                  <TableHead>Bahan Rp</TableHead>
                  <TableHead>Biaya Tidak Langsung Terdistribusi</TableHead>
                  <TableHead>Unit Cost</TableHead>
                  <TableHead>Update Bahan</TableHead>
                  <TableHead>Edit</TableHead>
                  <TableHead>Hapus</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={17} className="h-24 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                        <div className="text-gray-500">Memuat data...</div>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={17} className="h-24 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <div className="text-gray-500">Tidak ada data.</div>
                        <div className="text-xs text-blue-600">
                          💡 Klik "Import Data" untuk mengimpor data
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : rows.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-mono text-sm bg-blue-50 font-semibold">{r.kode}</TableCell>
                    <TableCell className="font-mono text-sm bg-green-50 font-semibold">{r.kode_unit_kerja || 'UK074'}</TableCell>
                    <TableCell className="font-medium">{r.jenis_pemeriksaan}</TableCell>
                    <TableCell>{r.jumlah}</TableCell>
                    <TableCell>{r.waktu_pemeriksaan}</TableCell>
                    <TableCell>{r.profesionalisme}</TableCell>
                    <TableCell>{r.tingkat_kesulitan}</TableCell>
                    <TableCell>{r.hasil_kali_waktu}</TableCell>
                    <TableCell>{r.dasar_alokasi_waktu}</TableCell>
                    <TableCell>{r.hasil_kali}</TableCell>
                    <TableCell>{r.dasar_alokasi_hasil_kali}</TableCell>
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
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleEditRow(r)}
                        className="bg-blue-100 hover:bg-blue-200 text-blue-800"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </TableCell>
                    <TableCell>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleDeleteRow(r)}
                        className="bg-red-100 hover:bg-red-200 text-red-800"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
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
                {manualInputData.id ? "Edit data pemeriksaan IBS" : "Tambahkan data pemeriksaan IBS baru"}
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

export default KalkulasiBiayaIBS;

