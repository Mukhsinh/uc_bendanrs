import React, { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Papa from "papaparse";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import BahanFarmasiForm from "@/components/BahanFarmasiForm";
import { Edit, Trash2, Download, Calculator, RefreshCw } from "lucide-react";
import { manualRecalculateOperatif, handleDatabaseError } from "@/utils/database-operations";
import * as XLSX from "xlsx";

const KalkulasiBiayaOperatif: React.FC = () => {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [year, setYear] = useState<number>(new Date().getFullYear());
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
  const [tindakanList, setTindakanList] = useState<{kode: string, nama: string}[]>([]);
  const [recalculating, setRecalculating] = useState<boolean>(false);
  const [recalcProgress, setRecalcProgress] = useState<{step: number, total: number, message: string}>({step: 0, total: 5, message: ''});

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

  const generateInitialData = async (currentUserId: string) => {
    try {
      const { data: existingData, error: checkError } = await supabase
        .from("kalkulasi_biaya_operatif")
        .select("id")
        .eq("user_id", currentUserId)
        .eq("tahun", year)
        .limit(1);
        
      if (checkError) throw checkError;
        
      if (!existingData || existingData.length === 0) {
        const { error: createError } = await supabase.rpc('create_kalkulasi_biaya_operatif_data', {
          p_user_id: currentUserId,
          p_tahun: year
        });
        
        if (createError) throw createError;
        
        const { error: alokasiError } = await supabase.rpc('fix_dasar_alokasi_operatif', {
          p_user_id: currentUserId,
          p_tahun: year
        });
        
        if (alokasiError) console.error("Error calculating dasar alokasi:", alokasiError);
        
        const { error: biayaError } = await supabase.rpc('fix_biaya_calculation_operatif', {
          p_user_id: currentUserId,
          p_tahun: year
        });
        
        if (biayaError) console.error("Error calculating biaya:", biayaError);
      }
    } catch (err: any) {
      console.error("Error in generateInitialData:", err);
    }
  };

  const loadData = async (currentUserId?: string) => {
    const userIdToUse = currentUserId || userId;
    if (!userIdToUse) return;
    
    setLoading(true);
    try {
      await generateInitialData(userIdToUse);
      
      let query = supabase
        .from("kalkulasi_biaya_operatif")
        .select(`*`)
        .eq("tahun", year)
        .eq("user_id", userIdToUse);
      
      if (filterOperator !== 'all') {
        query = query.eq("kode_operator_spesialistik", filterOperator);
      }
      
      const { data, error } = await query.order("kode", { ascending: true });
        
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
      
      const result = await manualRecalculateOperatif(year, userId);

      setRecalcProgress({step: 4, total: 5, message: 'Memperbarui tampilan data...'});
      
      // Refresh data setelah recalculation
      await loadData();

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
    if (!file || !userId) return;
    
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

          await generateInitialData(userId);
          
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
              const { data: existingRecord, error: checkError } = await supabase
                .from("kalkulasi_biaya_operatif")
                .select("id")
                .eq("tahun", year)
                .eq("user_id", userId)
                .eq("kode", kodeTindakan)
                .maybeSingle();

              if (checkError || !existingRecord) {
                errorCount++;
                continue;
              }

              const { error: updateError } = await supabase
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
              p_user_id: userId,
              p_tahun: year
            });
            
            if (alokasiError) {
              console.error("Error fix_dasar_alokasi_operatif:", alokasiError);
              toast.error(`Gagal menghitung dasar alokasi: ${alokasiError.message}`);
            }
            
            const { error: biayaError } = await supabase.rpc('fix_biaya_calculation_operatif', {
              p_user_id: userId,
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
      
      const { error } = await supabase
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
      if (!userId) {
        toast.error("User tidak ditemukan. Silakan login kembali.");
        return;
      }

      setAutoCalculating(true);

      if (data.id) {
        // Update existing data
        const { error: updateError } = await supabase
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
        p_user_id: userId,
        p_tahun: year
      });
      
      await supabase.rpc('fix_biaya_calculation_operatif', {
        p_user_id: userId,
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
      if (!rows || rows.length === 0) {
        toast.error("Tidak ada data untuk diunduh.");
        return;
      }

      let filteredRows = rows;
      
      if (reportFilter.type === 'operator' && reportFilter.value) {
        filteredRows = rows.filter(row => row.kode_operator_spesialistik === reportFilter.value);
        if (filteredRows.length === 0) {
          toast.error("Tidak ada data untuk operator yang dipilih.");
          return;
        }
      } else if (reportFilter.type === 'tindakan' && reportFilter.value) {
        filteredRows = rows.filter(row => row.kode === reportFilter.value);
        if (filteredRows.length === 0) {
          toast.error("Tidak ada data untuk tindakan yang dipilih.");
          return;
        }
      }

      const headers = [
        "Kode",
        "Kode Operator",
        "Nama Operator",
        "Kode Tindakan",
        "Nama Tindakan",
        "Jenis",
        "Unit Kerja",
        "Nama Unit Kerja",
        "Jumlah",
        "Waktu Pemeriksaan",
        "Profesionalisme",
        "Tingkat Kesulitan",
        "Hasil Kali",
        "Hasil Kali Waktu",
        "Dasar Alokasi Waktu",
        "Dasar Alokasi Hasil Kali",
        // 24 Komponen Biaya
        "Biaya Gaji & Tunjangan",
        "Biaya Jasa Pelayanan",
        "Biaya Obat",
        "Biaya BHP",
        "Biaya Makan Karyawan",
        "Biaya Makan Pasien",
        "Biaya Rumah Tangga",
        "Biaya Cetak",
        "Biaya ATK",
        "Biaya Listrik",
        "Biaya Air",
        "Biaya Telepon",
        "Biaya Pemeliharaan Bangunan",
        "Biaya Pemeliharaan Alat Medis",
        "Biaya Pemeliharaan Alat Non Medis",
        "Biaya Operasional Lainnya",
        "Biaya Penyusutan Gedung",
        "Biaya Penyusutan Jaringan",
        "Biaya Penyusutan Alat Medis",
        "Biaya Penyusutan Alat Non Medis",
        "Biaya Pendidikan & Pelatihan",
        "Biaya Laundry",
        "Biaya Sterilisasi",
        "Biaya Tidak Langsung Terdistribusi",
        "Biaya Bahan Pemeriksaan",
        // Hasil Akhir
        "Unit Cost Per Tindakan"
      ];

      const rowsCsv = filteredRows.map((r: any) => ({
        "Kode": r.kode,
        "Kode Operator": r.kode_operator_spesialistik,
        "Nama Operator": r.nama_operator_spesialistik,
        "Kode Tindakan": r.kode_tindakan_operatif,
        "Nama Tindakan": r.nama_tindakan_operatif,
        "Jenis": r.kode_jenis,
        "Unit Kerja": r.kode_unit_kerja,
        "Nama Unit Kerja": r.nama_unit_kerja,
        "Jumlah": r.jumlah,
        "Waktu Pemeriksaan": r.waktu_pemeriksaan,
        "Profesionalisme": r.profesionalisme,
        "Tingkat Kesulitan": r.tingkat_kesulitan,
        "Hasil Kali": r.hasil_kali,
        "Hasil Kali Waktu": r.hasil_kali_waktu,
        "Dasar Alokasi Waktu": r.dasar_alokasi_waktu,
        "Dasar Alokasi Hasil Kali": r.dasar_alokasi_hasil_kali,
        // 24 Komponen Biaya
        "Biaya Gaji & Tunjangan": r.biaya_gaji_tunjangan || 0,
        "Biaya Jasa Pelayanan": r.biaya_jasa_pelayanan || 0,
        "Biaya Obat": r.biaya_obat || 0,
        "Biaya BHP": r.biaya_bhp || 0,
        "Biaya Makan Karyawan": r.biaya_makan_karyawan || 0,
        "Biaya Makan Pasien": r.biaya_makan_pasien || 0,
        "Biaya Rumah Tangga": r.biaya_rumah_tangga || 0,
        "Biaya Cetak": r.biaya_cetak || 0,
        "Biaya ATK": r.biaya_atk || 0,
        "Biaya Listrik": r.biaya_listrik || 0,
        "Biaya Air": r.biaya_air || 0,
        "Biaya Telepon": r.biaya_telp || 0,
        "Biaya Pemeliharaan Bangunan": r.biaya_pemeliharaan_bangunan || 0,
        "Biaya Pemeliharaan Alat Medis": r.biaya_pemeliharaan_alat_medis || 0,
        "Biaya Pemeliharaan Alat Non Medis": r.biaya_pemeliharaan_alat_non_medis || 0,
        "Biaya Operasional Lainnya": r.biaya_operasional_lainnya || 0,
        "Biaya Penyusutan Gedung": r.biaya_penyusutan_gedung || 0,
        "Biaya Penyusutan Jaringan": r.biaya_penyusutan_jaringan || 0,
        "Biaya Penyusutan Alat Medis": r.biaya_penyusutan_alat_medis || 0,
        "Biaya Penyusutan Alat Non Medis": r.biaya_penyusutan_alat_non_medis || 0,
        "Biaya Pendidikan & Pelatihan": r.biaya_pendidikan_pelatihan || 0,
        "Biaya Laundry": r.biaya_laundry || 0,
        "Biaya Sterilisasi": r.biaya_sterilisasi || 0,
        "Biaya Tidak Langsung Terdistribusi": r.biaya_tidak_langsung_terdistribusi || 0,
        "Biaya Bahan Pemeriksaan": r.biaya_bahan_pemeriksaan_numeric || 0,
        // Hasil Akhir
        "Unit Cost Per Tindakan": r.unit_cost_per_tindakan || 0
      }));

      const csv = Papa.unparse({ fields: headers, data: rowsCsv });
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      
      let filename = `laporan_kalkulasi_operatif_${year}`;
      if (reportFilter.type === 'operator') {
        filename += `_operator_${reportFilter.value}`;
      } else if (reportFilter.type === 'tindakan') {
        filename += `_tindakan_${reportFilter.value}`;
      }
      filename += `.csv`;
      
      a.download = filename;
      a.click();
      
      toast.success(`Laporan berisi ${rowsCsv.length} data berhasil diunduh.`);
      setShowReportFilter(false);
    } catch (e: any) {
      toast.error(`Gagal membuat laporan: ${e.message}`);
    }
  };

  const filteredRows = filterOperator === 'all' ? rows : rows.filter(r => r.kode_operator_spesialistik === filterOperator);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Kalkulasi Biaya Operatif</h1>
        <p className="text-muted-foreground">
          Hitung biaya operasi dan prosedur operatif
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Kalkulasi Biaya Operatif</CardTitle>
          <CardDescription>
            Kelola bahan pemeriksaan, impor jumlah & parameter kalkulasi tindakan operatif, dan lihat hasil.
            <br />
            <span className="text-green-600 font-medium">✅ Sistem perhitungan otomatis aktif - semua kolom biaya akan dihitung ulang saat data berubah</span>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2 mb-4 items-center">
            <Input 
              type="number" 
              value={year} 
              onChange={(e) => setYear(parseInt(e.target.value || "0", 10) || year)} 
              className="w-[120px]" 
              placeholder="Tahun"
            />
            <select 
              value={filterOperator} 
              onChange={(e) => setFilterOperator(e.target.value)}
              className="h-10 px-3 py-2 text-sm border border-input rounded-md bg-background"
            >
              <option value="all">Semua Operator</option>
              {operators.map((op, idx) => (
                <option key={idx} value={op.kode}>
                  {op.kode} - {op.nama}
                </option>
              ))}
            </select>
            <Button variant="outline" onClick={handleDownloadTemplate}>
              Unduh Template Import
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setShowReportFilter(true)} 
              disabled={loading || importing || autoCalculating || rows.length === 0}
            >
              <Download className="h-4 w-4 mr-2" />
              Unduh Laporan
            </Button>
            <label className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2 cursor-pointer">
              Import Data
              <Input type="file" accept=".csv" onChange={handleImport} className="sr-only" />
            </label>
            <Button 
              onClick={() => {
                setManualInputData({});
                setShowManualInput(true);
              }} 
              disabled={loading || importing || autoCalculating}
              className="bg-green-600 hover:bg-green-700"
            >
              Input Manual
            </Button>
            <Button 
              variant="default" 
              disabled={loading || importing || autoCalculating || recalculating} 
              onClick={handleManualRecalculation}
              className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white"
            >
              {recalculating ? (
                <span className="flex items-center">
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  {recalcProgress.message || 'Rekalkulasi...'}
                </span>
              ) : (
                <span className="flex items-center">
                  <Calculator className="h-4 w-4 mr-2" />
                  Rekalkulasi Semua
                </span>
              )}
            </Button>
            
            {recalculating && (
              <div className="text-sm text-blue-600 bg-blue-50 px-3 py-2 rounded-lg border border-blue-200">
                <div className="flex items-center space-x-2">
                  <div className="w-full bg-blue-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                      style={{width: `${(recalcProgress.step / recalcProgress.total) * 100}%`}}
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
            
            {rows && rows.length > 0 && !recalculating && (
              <div className="text-sm text-orange-600 bg-orange-50 px-3 py-2 rounded-lg border border-orange-200">
                🔄 <strong>Alur Manual:</strong> Setelah input, edit, atau hapus data → klik <strong>"Rekalkulasi Semua"</strong> untuk menghitung ulang semua kolom biaya sesuai rumus tabel.
              </div>
            )}
          </div>

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

          <div className="rounded-md border overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Kode</TableHead>
                  <TableHead>Nama Tindakan</TableHead>
                  <TableHead>Jumlah</TableHead>
                  <TableHead>Waktu</TableHead>
                  <TableHead>Prof</TableHead>
                  <TableHead>Kesulitan</TableHead>
                  <TableHead>Bahan</TableHead>
                  <TableHead>Bahan Rp</TableHead>
                  <TableHead>Unit Cost</TableHead>
                  <TableHead>Edit</TableHead>
                  <TableHead>Hapus</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={11} className="h-24 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                        <div className="text-gray-500">Memuat data...</div>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredRows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={11} className="h-24 text-center">
                      <div className="text-gray-500">Tidak ada data untuk ditampilkan</div>
                    </TableCell>
                  </TableRow>
                ) : filteredRows.map((r) => {
                  const hasBahan = r.bahan_pemeriksaan && Array.isArray(r.bahan_pemeriksaan) && r.bahan_pemeriksaan.length > 0;
                  
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
                      <TableCell className="font-semibold">{r.biaya_bahan_pemeriksaan_numeric?.toLocaleString() || 0}</TableCell>
                      <TableCell className="font-semibold text-blue-600">{r.unit_cost_per_tindakan?.toLocaleString() || 0}</TableCell>
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
        <Dialog open={showBahanFarmasiForm} onOpenChange={setShowBahanFarmasiForm}>
          <DialogContent className="sm:max-w-[900px] max-h-[80vh] overflow-y-auto">
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
            
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setShowBahanFarmasiForm(false)}>Batal</Button>
              <Button 
                onClick={async () => {
                  try {
                    setAutoCalculating(true);
                    const { error } = await supabase
                      .from("kalkulasi_biaya_operatif")
                      .update({ bahan_pemeriksaan: bahanFarmasiList })
                      .eq("id", selectedRowForBahan.id);
                    
                    if (error) throw error;
                    
                    // Run calculations
                    await supabase.rpc('fix_biaya_calculation_operatif', {
                      p_user_id: userId,
                      p_tahun: year
                    });
                    
                    toast.success("Bahan disimpan dan biaya dihitung ulang!");
                    setShowBahanFarmasiForm(false);
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
                onClick={handleDownloadReport}
                disabled={(reportFilter.type === 'operator' || reportFilter.type === 'tindakan') && !reportFilter.value}
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

export default KalkulasiBiayaOperatif;
