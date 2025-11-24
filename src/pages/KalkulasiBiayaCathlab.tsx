import React, { useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import Papa from "papaparse";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import BahanFarmasiForm from "@/components/BahanFarmasiForm";
import { Edit, Trash2, Download, Calculator, RefreshCw } from "lucide-react";
import { useReportDownload } from "@/components/report";
import { manualRecalculateCathlab, handleDatabaseError } from "@/utils/database-operations";
import * as XLSX from "xlsx";

const toNumber = (value: unknown): number => {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : 0;
};

const normalizeBahanList = (list: any[]): any[] => {
  return (list || []).map((item) => {
    const qty = toNumber(item?.qty);
    const hargaSatuan = toNumber(item?.harga_satuan ?? item?.hargaSatuan);
    const rawTotal = item?.harga_total ?? item?.hargaTotal;
    const totalCandidate = Number(rawTotal);
    const computedTotal = Number.isFinite(totalCandidate)
      ? totalCandidate
      : qty * hargaSatuan;
    const roundedTotal = Math.round(toNumber(computedTotal));

    return {
      ...item,
      qty,
      harga_satuan: hargaSatuan,
      hargaSatuan,
      harga_total: roundedTotal,
      hargaTotal: roundedTotal,
    };
  });
};

const formatCurrency = (value: number | null | undefined): string => {
  const rounded = Math.round(toNumber(value));
  return rounded.toLocaleString("id-ID", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
};

const KalkulasiBiayaCathlab: React.FC = () => {
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
  const [showReportFilter, setShowReportFilter] = useState<boolean>(false);
  const [reportFilter, setReportFilter] = useState<{type: 'all' | 'tindakan', value: string}>({type: 'all', value: ''});
  const [downloadingReport, setDownloadingReport] = useState(false);
  const { downloadReport } = useReportDownload();
  const [tindakanList, setTindakanList] = useState<{kode: string, nama: string}[]>([]);
  const [recalculating, setRecalculating] = useState<boolean>(false);
  const [recalcProgress, setRecalcProgress] = useState<{step: number, total: number, message: string}>({step: 0, total: 5, message: ''});
  const [jenisFilterInput, setJenisFilterInput] = useState<string>('');
  const [selectedJenisFilters, setSelectedJenisFilters] = useState<string[]>([]);
  const [showFilterSuggestions, setShowFilterSuggestions] = useState<boolean>(false);

  // Total biaya bahan (Rp) untuk ringkasan di footer form bahan
  const totalBahanFarmasi = useMemo(() => {
    const total = (bahanFarmasiList || []).reduce((sum: number, item: any) => {
      const hargaTotal = toNumber(item?.harga_total ?? item?.hargaTotal);
      return sum + hargaTotal;
    }, 0);

    return Math.round(total);
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

  // Load data when userId and year are available
  useEffect(() => {
    if (userId) {
      loadData(userId);
      loadTindakanList();
    }
  }, [userId, year]);

  const loadTindakanList = async () => {
    try {
      const { data, error } = await supabase
        .from("tindakan_cathlab")
        .select("kode_tindakan, nama_tindakan")
        .order("kode_tindakan");
      
      if (error) throw error;
      
      const uniqueTindakan = Array.from(
        new Set(data?.map(d => JSON.stringify({kode: d.kode_tindakan, nama: d.nama_tindakan})))
      ).map(str => JSON.parse(str));
      
      setTindakanList(uniqueTindakan);
    } catch (err: any) {
      console.error("Error loading tindakan:", err);
    }
  };

  const jenisOptions = useMemo(() => {
    return Array.from(new Set((rows || []).map((r) => r.jenis_pemeriksaan))).filter(Boolean);
  }, [rows]);

  const filteredJenisOptions = useMemo(() => {
    const q = (jenisFilterInput || '').toLowerCase();
    const base = jenisOptions.filter((j) => j && j.toLowerCase().includes(q));
    const selectedSet = new Set(selectedJenisFilters);
    return [...base.filter(j => !selectedSet.has(j)), ...base.filter(j => selectedSet.has(j))].slice(0, 12);
  }, [jenisOptions, jenisFilterInput, selectedJenisFilters]);

  const filteredRows = useMemo(() => {
    if (selectedJenisFilters.length > 0) {
      const setSel = new Set(selectedJenisFilters);
      return (rows || []).filter((r) => setSel.has(r.jenis_pemeriksaan));
    }
    if (!jenisFilterInput) return rows;
    const q = jenisFilterInput.toLowerCase();
    return (rows || []).filter((r) => (r.jenis_pemeriksaan || '').toLowerCase().includes(q));
  }, [rows, jenisFilterInput, selectedJenisFilters]);

  const generateInitialData = async (currentUserId: string) => {
    try {
      const { data: existingData, error: checkError } = await supabase
        .from("kalkulasi_biaya_cathlab")
        .select("id")
        .eq("tahun", year)
        .limit(1);
        
      if (checkError) throw checkError;
        
      if (!existingData || existingData.length === 0) {
        // Generate initial data from tindakan_cathlab
        const { data: tindakanData, error: tindakanError } = await supabase
          .from("tindakan_cathlab")
          .select("kode_tindakan, nama_tindakan")
          .order("kode_tindakan");
        
        if (tindakanError) throw tindakanError;
        
        if (tindakanData && tindakanData.length > 0) {
          const records = tindakanData.map(t => ({
            user_id: currentUserId,
            tahun: year,
            kode: t.kode_tindakan,
            jenis_pemeriksaan: t.nama_tindakan,
            kode_unit_kerja: 'UK045',
            nama_unit_kerja: 'Cathlab',
            jumlah: 0,
            waktu_pemeriksaan: 0,
            profesionalisme: 1,
            tingkat_kesulitan: 1
          }));
          
          const { error: insertError } = await supabase
            .from("kalkulasi_biaya_cathlab")
            .insert(records);
          
          if (insertError) {
            console.error("Error inserting initial data:", insertError);
          }
        }
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
      const { data, error } = await supabase
        .from("kalkulasi_biaya_cathlab")
        .select(`*`)
        .eq("tahun", year)
        .order("kode", { ascending: true });
        
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
      
      const result = await manualRecalculateCathlab(year, userId);

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
        .from("tindakan_cathlab")
        .select("kode_tindakan, nama_tindakan")
        .order("kode_tindakan");
        
      if (error) throw error;
      if (!data || data.length === 0) {
        toast.error("Tidak ada data tindakan cathlab.");
        return;
      }

      const headers = [
        "Kode Tindakan",
        "Nama Tindakan",
        "Jumlah",
        "Waktu Pemeriksaan",
        "Profesionalisme (1-4)",
        "Tingkat Kesulitan (1-5)",
      ];

      const rowsCsv = data.map((d: any) => ({
        "Kode Tindakan": d.kode_tindakan,
        "Nama Tindakan": d.nama_tindakan,
        "Jumlah": "",
        "Waktu Pemeriksaan": "",
        "Profesionalisme (1-4)": "",
        "Tingkat Kesulitan (1-5)": "",
      }));

      const csv = Papa.unparse({ fields: headers, data: rowsCsv });
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `template_kalkulasi_cathlab_${year}.csv`;
      a.click();
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
            const sulit = Math.max(1, Math.min(5, parseInt(r["Tingkat Kesulitan (1-5)"] || "1", 10) || 1));

            try {
              const { data: existingRecord, error: checkError } = await supabase
                .from("kalkulasi_biaya_cathlab")
                .select("id")
                .eq("tahun", year)
                .eq("kode", kodeTindakan)
                .maybeSingle();

              if (checkError || !existingRecord) {
                errorCount++;
                continue;
              }

              const { error: updateError } = await supabase
                .from("kalkulasi_biaya_cathlab")
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
            toast.success(`✅ Import selesai! Berhasil: ${successCount}, Gagal: ${errorCount}`);
            await loadData(userId);
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
        .from("kalkulasi_biaya_cathlab")
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
          .from("kalkulasi_biaya_cathlab")
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
        "Kode": r.kode,
        "Nama Tindakan": r.jenis_pemeriksaan,
        "Jumlah": r.jumlah,
        "Waktu": r.waktu_pemeriksaan,
        "Prof": r.profesionalisme,
        "Kesulitan": r.tingkat_kesulitan,
        "Bahan": r.bahan_pemeriksaan && Array.isArray(r.bahan_pemeriksaan) && r.bahan_pemeriksaan.length > 0
          ? `${r.bahan_pemeriksaan.length} item`
          : "Tambah",
        "Bahan Rp": Math.round(r.biaya_bahan_pemeriksaan_numeric || 0),
        "Unit Cost": Math.round(r.unit_cost_per_tindakan || 0),
      }));

      // Records untuk Excel: menggunakan data database (fetch langsung dari database)
      const { data: latestData, error: fetchError } = await supabase
        .from('kalkulasi_biaya_cathlab')
        .select('*')
        .eq('tahun', year)
        .order('jenis_pemeriksaan');

      if (fetchError) {
        throw fetchError;
      }

      const filteredRowsDb = (latestData || []).filter((row) => {
        if (reportFilter.type === 'tindakan' && reportFilter.value) {
          return row.jenis_pemeriksaan === reportFilter.value;
        }
        if (selectedJenisFilters.length > 0) {
          return selectedJenisFilters.includes(row.jenis_pemeriksaan);
        }
        return true;
      });

      if (filteredRowsDb.length === 0) {
        toast.error('Tidak ada data yang sesuai filter untuk diunduh.');
        return;
      }

      const recordsForExcel = filteredRowsDb.map((r: any) => ({
        "Kode": r.kode,
        "Kode Tindakan": r.kode,
        "Nama Tindakan": r.jenis_pemeriksaan,
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
        "Biaya Gaji & Tunjangan": Math.round(r.biaya_gaji_tunjangan || 0),
        "Biaya Jasa Pelayanan": Math.round(r.biaya_jasa_pelayanan || 0),
        "Biaya Obat": Math.round(r.biaya_obat || 0),
        "Biaya BHP": Math.round(r.biaya_bhp || 0),
        "Biaya Makan Karyawan": Math.round(r.biaya_makan_karyawan || 0),
        "Biaya Makan Pasien": Math.round(r.biaya_makan_pasien || 0),
        "Biaya Rumah Tangga": Math.round(r.biaya_rumah_tangga || 0),
        "Biaya Cetak": Math.round(r.biaya_cetak || 0),
        "Biaya ATK": Math.round(r.biaya_atk || 0),
        "Biaya Listrik": Math.round(r.biaya_listrik || 0),
        "Biaya Air": Math.round(r.biaya_air || 0),
        "Biaya Telepon": Math.round(r.biaya_telp || 0),
        "Biaya Pemeliharaan Bangunan": Math.round(r.biaya_pemeliharaan_bangunan || 0),
        "Biaya Pemeliharaan Alat Medis": Math.round(r.biaya_pemeliharaan_alat_medis || 0),
        "Biaya Pemeliharaan Alat Non Medis": Math.round(r.biaya_pemeliharaan_alat_non_medis || 0),
        "Biaya Operasional Lainnya": Math.round(r.biaya_operasional_lainnya || 0),
        "Biaya Penyusutan Gedung": Math.round(r.biaya_penyusutan_gedung || 0),
        "Biaya Penyusutan Jaringan": Math.round(r.biaya_penyusutan_jaringan || 0),
        "Biaya Penyusutan Alat Medis": Math.round(r.biaya_penyusutan_alat_medis || 0),
        "Biaya Penyusutan Alat Non Medis": Math.round(r.biaya_penyusutan_alat_non_medis || 0),
        "Biaya Pendidikan & Pelatihan": Math.round(r.biaya_pendidikan_pelatihan || 0),
        "Biaya Laundry": Math.round(r.biaya_laundry || 0),
        "Biaya Sterilisasi": Math.round(r.biaya_sterilisasi || 0),
        "Biaya Tidak Langsung Terdistribusi": Math.round(r.biaya_tidak_langsung_terdistribusi || 0),
        "Biaya Bahan Pemeriksaan": Math.round(r.biaya_bahan_pemeriksaan_numeric || 0),
        "Unit Cost Per Tindakan": Math.round(r.unit_cost_per_tindakan || 0),
      }));

      let filename = `laporan_kalkulasi_cathlab_${year}`;
      if (reportFilter.type === 'tindakan' && reportFilter.value) {
        filename += `_tindakan_${reportFilter.value.replace(/[^a-zA-Z0-9]/g, '_')}`;
      } else if (selectedJenisFilters.length > 0) {
        filename += `_selected_${selectedJenisFilters.length}`;
      }

      await downloadReport({
        title: "Laporan Kalkulasi Biaya Cathlab",
        subtitle:
          reportFilter.type === 'tindakan' && reportFilter.value
            ? `Tahun ${year} • Tindakan ${reportFilter.value}`
            : selectedJenisFilters.length > 0
              ? `Tahun ${year} • ${selectedJenisFilters.length} jenis dipilih`
              : `Tahun ${year}`,
        filename,
        recordsForPdf,
        recordsForExcel,
        orientation: "landscape",
      });

      toast.success(`Laporan berisi ${recordsForExcel.length} data berhasil disiapkan.`);
      setShowReportFilter(false);
    } catch (e: any) {
      toast.error(`Gagal membuat laporan: ${e.message || e}`);
    } finally {
      setDownloadingReport(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Kalkulasi Biaya Cathlab</h1>
        <p className="text-muted-foreground">
          Hitung biaya prosedur kateterisasi jantung
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
            <div className="flex flex-col gap-2">
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
                  placeholder={selectedJenisFilters.length ? "Tambah jenis tindakan..." : "Filter jenis tindakan..."}
                  className="pr-8"
                />
                {showFilterSuggestions && filteredJenisOptions.length > 0 && (
                  <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-md max-h-60 overflow-auto">
                    {filteredJenisOptions.map((opt) => {
                      const isSelected = selectedJenisFilters.includes(opt);
                      return (
                        <div
                          key={opt}
                          className={`px-3 py-2 text-sm cursor-pointer hover:bg-gray-50 ${isSelected ? 'bg-gray-50' : ''}`}
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
              {selectedJenisFilters.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {selectedJenisFilters.map((tag) => (
                    <span key={tag} className="inline-flex items-center gap-2 px-2 py-1 text-xs bg-gray-100 rounded border">
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
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
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
                  {recalcProgress.message || 'Rekalkulasi...'}
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
                            setBahanFarmasiList(
                              normalizeBahanList(r.bahan_pemeriksaan || [])
                            );
                            setShowBahanFarmasiForm(true);
                          }}
                          className={`text-xs ${hasBahan ? 'bg-orange-100 hover:bg-orange-200 text-orange-800 font-semibold' : 'bg-green-100 hover:bg-green-200 text-green-800'}`}
                        >
                          {hasBahan ? `✓ ${r.bahan_pemeriksaan.length}` : 'Tambah'}
                        </Button>
                      </TableCell>
                      <TableCell className="text-right font-semibold">{r.biaya_bahan_pemeriksaan_numeric?.toLocaleString() || 0}</TableCell>
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
            Total tindakan ditampilkan: {filteredRows.length}
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
                  const updatedList = normalizeBahanList([
                    ...bahanFarmasiList,
                    bahanData,
                  ]);
                  setBahanFarmasiList(updatedList);
                  toast.success("Bahan berhasil ditambahkan!");
                }}
                onCancel={() => {
                  // Reset form state saat cancel
                  // Dialog tetap terbuka, hanya reset form internal
                }}
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
                            {bahan.kode_barang} - {bahan.qty} pcs - Rp{" "}
                            {formatCurrency(bahan.harga_total ?? bahan.hargaTotal)}
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
                  <div className="text-2xl font-bold text-blue-700">
                    Rp {formatCurrency(totalBahanFarmasi)}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Total {bahanFarmasiList.length} item
                  </div>
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
                  try {
                    setAutoCalculating(true);
                    const normalizedList = normalizeBahanList(bahanFarmasiList);
                    const { error } = await supabase
                      .from("kalkulasi_biaya_cathlab")
                      .update({ bahan_pemeriksaan: normalizedList })
                      .eq("id", selectedRowForBahan.id);
                    
                    if (error) throw error;
                    
                    toast.success("Bahan disimpan!");
                    
                    // Tutup dialog dan reset state setelah simpan berhasil
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
                {manualInputData.id ? "Edit data tindakan cathlab" : "Tambahkan data tindakan cathlab baru"}
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
                      value="tindakan"
                      checked={reportFilter.type === 'tindakan'}
                      onChange={(e) => setReportFilter({ ...reportFilter, type: 'tindakan', value: '' })}
                      className="w-4 h-4"
                    />
                    <span>Per Jenis Tindakan</span>
                  </label>
                </div>
              </div>
              
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
                disabled={(reportFilter.type === 'tindakan' && !reportFilter.value) || downloadingReport}
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

export default KalkulasiBiayaCathlab;
