import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Download, Upload, RefreshCw, Plus, Edit, Trash2, Calculator, FileSpreadsheet, Check, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { useReportDownload } from "@/components/report";

interface DataDiklat {
  id: string;
  kode_strata: string;
  nama_strata: string;
  kode_materi: string;
  nama_materi: string;
  lama_hari: number;
  unit_cost_per_hari: number;
  total_uc: number;
  kalkulasi_diklat_id: string;
  jenis_diklat: string;
  biaya_bahan: number;
  jasa_sarana: number;
  jasa_pel_medis: number;
  jasa_pel_non_medis: number;
  jasa_pelayanan: number;
  persen_jasa_pel: number;
  persen_profit: number;
  tarif: number;
  created_at: string;
  updated_at: string;
}

interface KalkulasiDiklat {
  id: string;
  jenis_diklat: string;
  lama_hari_diklat: number;
  biaya_diklat_per_hari: number;
  biaya_unit_diklat: number;
  unit_cost_per_jenis_layanan: number | null;
}

export default function KalkulasiAktivitasDiklat() {
  const [dataDiklat, setDataDiklat] = useState<DataDiklat[]>([]);
  const [kalkulasiDiklat, setKalkulasiDiklat] = useState<KalkulasiDiklat[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<DataDiklat | null>(null);
  const [editingRow, setEditingRow] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<{
    jasa_sarana: number;
    jasa_pel_medis: number;
    jasa_pel_non_medis: number;
  }>({
    jasa_sarana: 0,
    jasa_pel_medis: 0,
    jasa_pel_non_medis: 0,
  });
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [isProcessingImport, setIsProcessingImport] = useState(false);
  const [downloadingReport, setDownloadingReport] = useState(false);
  const { downloadReport } = useReportDownload();
  const [formData, setFormData] = useState({
    kode_strata: '',
    nama_strata: '',
    kode_materi: '',
    nama_materi: '',
    lama_hari: 0,
    jenis_diklat: 'basis_harian',
    unit_cost_per_hari: 0,
    total_uc: 0,
    biaya_bahan: 0,
    jasa_sarana: 0,
    jasa_pel_medis: 0,
    jasa_pel_non_medis: 0,
    jasa_pelayanan: 0,
    persen_jasa_pel: 0,
    persen_profit: 0,
    tarif: 0
  });

  useEffect(() => {
    fetchData();
    fetchKalkulasiDiklat();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('data_diklat')
        .select(`
          *,
          kalkulasi_diklat:kalkulasi_diklat_id (
            jenis_diklat,
            biaya_diklat_per_hari
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Calculate missing values for existing records
      const processedData = (data || []).map(item => {
        // Get unit_cost_per_hari from kalkulasi_diklat relation
        const kalkulasiDiklatItem = kalkulasiDiklat.find(k => k.id === item.kalkulasi_diklat_id);
        const unit_cost_per_hari = kalkulasiDiklatItem?.biaya_diklat_per_hari || 0;
        
        // jasa_sarana should be input manually, not auto-generated
        // If tarif is 0, set it to jasa_sarana
        if (item.tarif === 0) {
          item.tarif = item.jasa_sarana;
        }
        return item;
      });
      
      setDataDiklat(processedData);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Gagal memuat data diklat');
    } finally {
      setLoading(false);
    }
  };

  const fetchKalkulasiDiklat = async () => {
    try {
      const { data, error } = await supabase
        .from('kalkulasi_diklat')
        .select('*')
        .order('jenis_diklat');

      if (error) throw error;
      setKalkulasiDiklat(data || []);
    } catch (error) {
      console.error('Error fetching kalkulasi diklat:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('User tidak ditemukan. Silakan login ulang.');
        return;
      }

      // Pastikan data kalkulasi diklat sudah dimuat
      if (kalkulasiDiklat.length === 0) {
        await fetchKalkulasiDiklat();
      }

      // Cari kalkulasi_diklat_id berdasarkan jenis_diklat (default: basis_harian)
      const kalkulasiDiklatItem = kalkulasiDiklat.find(item => item.jenis_diklat === 'basis_harian');
      if (!kalkulasiDiklatItem) {
        toast.error('Data kalkulasi diklat basis harian tidak ditemukan. Silakan refresh halaman.');
        return;
      }

      // Hitung ulang nilai turunan agar konsisten saat disimpan
      const unit_cost_per_hari = kalkulasiDiklatItem.biaya_diklat_per_hari || 0;
      const recalculated = {
        unit_cost_per_hari: unit_cost_per_hari,
        lama_hari: Number(formData.lama_hari) || 0,
        jasa_sarana: Number(formData.jasa_sarana) || 0,
        jasa_pel_medis: Number(formData.jasa_pel_medis) || 0,
        jasa_pel_non_medis: Number(formData.jasa_pel_non_medis) || 0,
        persen_profit: Number(formData.persen_profit) || 0,
      };
      const total_uc = Math.round(calculateTotalUC(unit_cost_per_hari, recalculated.lama_hari));
      const jasa_pelayanan = Math.round(recalculated.jasa_pel_medis + recalculated.jasa_pel_non_medis);
      const tarif = calculateFinalTariff(recalculated.jasa_sarana, jasa_pelayanan);
      const persen_jasa_pel = calculatePersenJasaPel(jasa_pelayanan, tarif);
      const persen_profit = calculatePersenProfit(recalculated.jasa_sarana, total_uc);

      // Susun payload eksplisit sesuai kolom tabel
      // Hapus kolom yang dihitung otomatis oleh database (generated columns)
      const basePayload = {
        kode_strata: formData.kode_strata,
        nama_strata: formData.nama_strata,
        kode_materi: formData.kode_materi,
        nama_materi: formData.nama_materi,
        lama_hari: recalculated.lama_hari,
        jenis_diklat: formData.jenis_diklat,
        unit_cost_per_hari: recalculated.unit_cost_per_hari,
        // total_uc, jasa_pelayanan, persen_jasa_pel, persen_profit, dan tarif dihitung otomatis oleh database
        biaya_bahan: Number(formData.biaya_bahan) || 0,
        jasa_sarana: recalculated.jasa_sarana,
        jasa_pel_medis: recalculated.jasa_pel_medis,
        jasa_pel_non_medis: recalculated.jasa_pel_non_medis,
        kalkulasi_diklat_id: kalkulasiDiklatItem.id,
      };

      if (editingItem) {
        // Update existing item
        const { error } = await supabase
          .from('data_diklat')
          .update(basePayload)
          .eq('id', editingItem.id);

        if (error) throw error;
        toast.success('Data diklat berhasil diperbarui');
      } else {
        // Create new item
        const { error } = await supabase
          .from('data_diklat')
          .insert([{ ...basePayload, user_id: user.id }]);

        if (error) throw error;
        toast.success('Data diklat berhasil ditambahkan');
      }

      setIsDialogOpen(false);
      setEditingItem(null);
      
      setFormData({
        kode_strata: '',
        nama_strata: '',
        kode_materi: '',
        nama_materi: '',
        lama_hari: 0,
        jenis_diklat: 'basis_harian',
        unit_cost_per_hari: kalkulasiDiklatItem?.biaya_diklat_per_hari || 0,
        total_uc: 0,
        biaya_bahan: 0,
        jasa_sarana: 0,
        jasa_pel_medis: 0,
        jasa_pel_non_medis: 0,
        jasa_pelayanan: 0,
        persen_jasa_pel: 0,
        persen_profit: 0,
        tarif: kalkulasiDiklatItem?.biaya_diklat_per_hari || 0
      });
      fetchData();
    } catch (error: any) {
      console.error('Error saving data:', error);
      toast.error(`Gagal menyimpan data diklat: ${error?.message || 'Unknown error'}`);
    }
  };

  const handleEdit = (item: DataDiklat) => {
    setEditingItem(item);
    // Get unit_cost_per_hari from kalkulasi_diklat relation
    const kalkulasiDiklatItem = kalkulasiDiklat.find(k => k.id === item.kalkulasi_diklat_id);
    const unit_cost_per_hari = kalkulasiDiklatItem?.biaya_diklat_per_hari || 0;
    
    setFormData({
      kode_strata: item.kode_strata,
      nama_strata: item.nama_strata,
      kode_materi: item.kode_materi,
      nama_materi: item.nama_materi,
      lama_hari: item.lama_hari,
      jenis_diklat: item.jenis_diklat,
      unit_cost_per_hari: unit_cost_per_hari,
      total_uc: item.total_uc || 0,
      biaya_bahan: item.biaya_bahan || 0,
      jasa_sarana: item.jasa_sarana || unit_cost_per_hari,
      jasa_pel_medis: item.jasa_pel_medis || 0,
      jasa_pel_non_medis: item.jasa_pel_non_medis || 0,
      jasa_pelayanan: item.jasa_pelayanan || 0,
      persen_jasa_pel: item.persen_jasa_pel || 0,
      persen_profit: item.persen_profit || 0,
      tarif: item.tarif || item.jasa_sarana || unit_cost_per_hari
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus data ini?')) return;

    try {
      const { error } = await supabase
        .from('data_diklat')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Data diklat berhasil dihapus');
      fetchData();
    } catch (error) {
      console.error('Error deleting data:', error);
      toast.error('Gagal menghapus data diklat');
    }
  };

  // Inline edit functions
  const handleStartEdit = (item: DataDiklat) => {
    setEditingRow(item.id);
    // Get unit_cost_per_hari from kalkulasi_diklat relation
    const kalkulasiDiklatItem = kalkulasiDiklat.find(k => k.id === item.kalkulasi_diklat_id);
    const unit_cost_per_hari = kalkulasiDiklatItem?.biaya_diklat_per_hari || 0;
    
    setEditValues({
      jasa_sarana: item.jasa_sarana || unit_cost_per_hari,
      jasa_pel_medis: item.jasa_pel_medis || 0,
      jasa_pel_non_medis: item.jasa_pel_non_medis || 0,
    });
  };

  const handleCancelEdit = () => {
    setEditingRow(null);
    setEditValues({
      jasa_sarana: 0,
      jasa_pel_medis: 0,
      jasa_pel_non_medis: 0,
    });
  };

  const handleSaveRow = async (id: string) => {
    try {
      setLoading(true);
      
      // Calculate jasa_pelayanan from the sum of jasa_pel_medis and jasa_pel_non_medis
      const jasa_pelayanan = Math.round(editValues.jasa_pel_medis + editValues.jasa_pel_non_medis);
      
      const { error } = await supabase
        .from('data_diklat')
        .update({
          jasa_sarana: editValues.jasa_sarana,
          jasa_pel_medis: editValues.jasa_pel_medis,
          jasa_pel_non_medis: editValues.jasa_pel_non_medis,
          // jasa_pelayanan dihitung otomatis oleh database
        })
        .eq('id', id);

      if (error) throw error;
      
      toast.success("Data berhasil diperbarui");
      setEditingRow(null);
      fetchData();
    } catch (error: any) {
      console.error("Error updating data:", error);
      toast.error(error.message || "Gagal memperbarui data");
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getStrataBadgeVariant = (kodeStrata: string) => {
    const variants = {
      'L.1': 'default',
      'L.2': 'secondary', 
      'L.3': 'destructive',
      'L.4': 'outline',
      'L.5': 'default'
    };
    return variants[kodeStrata as keyof typeof variants] || 'default';
  };

  const getStrataBadgeColor = (kodeStrata: string) => {
    const colors = {
      'L.1': 'bg-blue-100 text-blue-800 border-blue-200',
      'L.2': 'bg-green-100 text-green-800 border-green-200',
      'L.3': 'bg-red-100 text-red-800 border-red-200',
      'L.4': 'bg-purple-100 text-purple-800 border-purple-200',
      'L.5': 'bg-orange-100 text-orange-800 border-orange-200'
    };
    return colors[kodeStrata as keyof typeof colors] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  // Function to calculate total unit cost
  const calculateTotalUC = (unitCostPerHari: number, lamaHari: number) => {
    return unitCostPerHari * lamaHari;
  };

  // Function to calculate final tariff
  const calculateFinalTariff = (jasaSarana: number, jasaPelayanan: number) => {
    return Math.round(jasaSarana + jasaPelayanan);
  };

  // Function to calculate percentage of service fee
  const calculatePersenJasaPel = (jasaPelayanan: number, tarif: number) => {
    if (tarif === 0) return 0;
    return Math.round((jasaPelayanan / tarif) * 100);
  };

  // Function to calculate percentage profit
  const calculatePersenProfit = (jasaSarana: number, totalUC: number) => {
    if (totalUC === 0) return 0;
    return Math.round(((jasaSarana - totalUC) / totalUC) * 100);
  };

  const handleDownloadTemplate = () => {
    try {
      // Buat template Excel dengan header yang sesuai
      const templateData = [
        {
          'Kode Strata': 'L.1',
          'Nama Strata': 'SMA',
          'Kode Materi': 'L.1.01',
          'Nama Materi': 'Contoh Materi Pelatihan',
          'Lama Hari': 3
        }
      ];

      const worksheet = XLSX.utils.json_to_sheet(templateData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Template Data Diklat');

      // Set column widths
      const columnWidths = [
        { wch: 12 }, // Kode Strata
        { wch: 15 }, // Nama Strata
        { wch: 15 }, // Kode Materi
        { wch: 30 }, // Nama Materi
        { wch: 10 }  // Lama Hari
      ];
      worksheet['!cols'] = columnWidths;

      const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      const data = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      
      saveAs(data, 'Template_Data_Diklat.xlsx');
      toast.success('Template berhasil diunduh');
    } catch (error) {
      console.error('Error downloading template:', error);
      toast.error('Gagal mengunduh template');
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || 
          file.type === 'application/vnd.ms-excel' ||
          file.name.endsWith('.xlsx') || 
          file.name.endsWith('.xls')) {
        setImportFile(file);
        toast.success('File berhasil dipilih');
      } else {
        toast.error('Format file tidak didukung. Gunakan file Excel (.xlsx atau .xls)');
      }
    }
  };

  const handleImportData = async () => {
    if (!importFile) {
      toast.error('Pilih file terlebih dahulu');
      return;
    }

    try {
      setIsProcessingImport(true);
      
      const data = await importFile.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      if (jsonData.length === 0) {
        toast.error('File kosong atau format tidak sesuai');
        return;
      }

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('User tidak ditemukan. Silakan login ulang.');
        return;
      }

      // Validasi dan transformasi data
      const transformedData = [];
      const errors = [];

      for (const row of jsonData) {
        const kodeStrata = (row['Kode Strata'] || '').toString().trim();
        const namaStrata = (row['Nama Strata'] || '').toString().trim();
        const kodeMateri = (row['Kode Materi'] || '').toString().trim();
        const namaMateri = (row['Nama Materi'] || '').toString().trim();
        const lamaHari = parseInt((row['Lama Hari'] || '0').toString()) || 0;
        // Set default jenis_diklat ke basis_harian
        const jenisDiklat = 'basis_harian';

        // Validasi data
        if (!kodeStrata || !namaStrata || !kodeMateri || !namaMateri || lamaHari <= 0) {
          errors.push(`Baris dengan kode materi ${kodeMateri}: Data tidak lengkap`);
          continue;
        }

        // Cari kalkulasi_diklat_id berdasarkan jenis_diklat (default: basis_harian)
        const kalkulasiDiklatItem = kalkulasiDiklat.find(item => item.jenis_diklat === 'basis_harian');
        if (!kalkulasiDiklatItem) {
          errors.push(`Baris dengan kode materi ${kodeMateri}: Data kalkulasi diklat basis harian tidak ditemukan`);
          continue;
        }

        // Cek duplikasi kode_materi
        const existingData = dataDiklat.find(item => item.kode_materi === kodeMateri);
        if (existingData) {
          errors.push(`Baris dengan kode materi ${kodeMateri}: Kode materi sudah ada`);
          continue;
        }

        transformedData.push({
          user_id: user.id,
          kode_strata: kodeStrata,
          nama_strata: namaStrata,
          kode_materi: kodeMateri,
          nama_materi: namaMateri,
          lama_hari: lamaHari,
          jenis_diklat: jenisDiklat,
          kalkulasi_diklat_id: kalkulasiDiklatItem.id
        });
      }

      if (errors.length > 0) {
        toast.error(`Terdapat ${errors.length} error:\n${errors.slice(0, 5).join('\n')}${errors.length > 5 ? '\n...' : ''}`);
        return;
      }

      if (transformedData.length === 0) {
        toast.error('Tidak ada data yang valid untuk diimpor');
        return;
      }

      // Insert data ke database
      const { error } = await supabase
        .from('data_diklat')
        .insert(transformedData);

      if (error) throw error;

      toast.success(`${transformedData.length} data berhasil diimpor`);
      setIsImportDialogOpen(false);
      setImportFile(null);
      fetchData();
    } catch (error) {
      console.error('Error importing data:', error);
      toast.error('Gagal mengimpor data. Periksa format file dan coba lagi.');
    } finally {
      setIsProcessingImport(false);
    }
  };

  const handleDownloadReport = async () => {
    if (dataDiklat.length === 0) {
      toast.error('Tidak ada data untuk diunduh');
      return;
    }

    try {
      setDownloadingReport(true);

      // Records untuk PDF dan Excel: menggunakan data frontend (sesuai tabel yang ditampilkan)
      const records = dataDiklat.map((item) => ({
        "Nama Strata": item.nama_strata,
        "Nama Materi": item.nama_materi,
        "Lama Hari": item.lama_hari,
        "Total UC": Math.round(item.total_uc || 0),
        "Biaya Bahan": Math.round(item.biaya_bahan || 0),
        "Jasa Sarana": Math.round(item.jasa_sarana || item.unit_cost_per_hari || 0),
        "Jasa Pel. Medis": Math.round(item.jasa_pel_medis || 0),
        "Jasa Pel. Non Medis": Math.round(item.jasa_pel_non_medis || 0),
        "Jasa Pelayanan": Math.round(item.jasa_pelayanan || 0),
        "% Jasa Pel.": (item.persen_jasa_pel || 0).toFixed(1),
        "% Profit": (item.persen_profit || 0).toFixed(1),
        "Tarif": Math.round(item.tarif || item.jasa_sarana || item.unit_cost_per_hari || 0),
      }));

      await downloadReport({
        title: "Laporan Kalkulasi Aktivitas Diklat",
        filename: `laporan_kalkulasi_aktivitas_diklat_${new Date().toISOString().split('T')[0]}`,
        records,
        orientation: "landscape",
      });

      toast.success('Laporan berhasil disiapkan');
    } catch (error: any) {
      console.error('Gagal mengunduh laporan:', error);
      toast.error(`Gagal mengunduh laporan: ${error?.message || 'Unknown error'}`);
    } finally {
      setDownloadingReport(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Kalkulasi Aktivitas Diklat</h1>
          <p className="text-gray-600 mt-2">Kelola aktivitas diklat dengan perhitungan unit cost otomatis</p>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Button
            onClick={handleDownloadReport}
            className="bg-rose-600 text-white hover:bg-rose-700"
            disabled={downloadingReport || dataDiklat.length === 0}
          >
            {downloadingReport ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Memproses...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Unduh Laporan
              </>
            )}
          </Button>
          <Button
            onClick={handleDownloadTemplate}
            className="bg-orange-500 text-white hover:bg-orange-600"
          >
            <Download className="h-4 w-4 mr-2" />
            Unduh Template
          </Button>
          <Button
            onClick={() => setIsImportDialogOpen(true)}
            className="bg-emerald-500 text-white hover:bg-emerald-600"
          >
            <Upload className="h-4 w-4 mr-2" />
            Impor Data
          </Button>
          <Button
            onClick={fetchData}
            className="bg-purple-600 text-white hover:bg-purple-700"
            disabled={loading}
          >
            <RefreshCw className={loading ? "h-4 w-4 mr-2 animate-spin" : "h-4 w-4 mr-2"} />
            Perbarui Data
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button
                className="bg-sky-500 text-white hover:bg-sky-600"
                onClick={async () => {
                setEditingItem(null);
                
                // Pastikan data kalkulasi diklat sudah dimuat
                if (kalkulasiDiklat.length === 0) {
                  await fetchKalkulasiDiklat();
                }
                
                // Get unit_cost_per_hari from kalkulasi_diklat relation
                const kalkulasiDiklatItem = kalkulasiDiklat.find(item => item.jenis_diklat === 'basis_harian');
                if (!kalkulasiDiklatItem) {
                  toast.error('Data kalkulasi diklat basis harian tidak ditemukan. Silakan refresh halaman.');
                  return;
                }
                const unit_cost_per_hari = kalkulasiDiklatItem.biaya_diklat_per_hari || 0;
                
                setFormData({
                  kode_strata: '',
                  nama_strata: '',
                  kode_materi: '',
                  nama_materi: '',
                  lama_hari: 0,
                  jenis_diklat: 'basis_harian',
                  unit_cost_per_hari: unit_cost_per_hari,
                  total_uc: 0,
                  biaya_bahan: 0,
                  jasa_sarana: 0,
                  jasa_pel_medis: 0,
                  jasa_pel_non_medis: 0,
                  jasa_pelayanan: 0,
                  persen_jasa_pel: 0,
                  persen_profit: 0,
                  tarif: 0
                });
              }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Tambah Data Diklat
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingItem ? 'Edit Data Diklat' : 'Tambah Data Diklat'}
                </DialogTitle>
                <DialogDescription>
                  {editingItem ? 'Perbarui informasi data diklat' : 'Tambahkan data diklat baru dengan perhitungan unit cost otomatis'}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="kode_strata">Kode Strata</Label>
                    <Input
                      id="kode_strata"
                      value={formData.kode_strata}
                      onChange={(e) => setFormData({ ...formData, kode_strata: e.target.value })}
                      placeholder="Contoh: L.1"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="nama_strata">Nama Strata</Label>
                    <Input
                      id="nama_strata"
                      value={formData.nama_strata}
                      onChange={(e) => setFormData({ ...formData, nama_strata: e.target.value })}
                      placeholder="Contoh: SMA"
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="kode_materi">Kode Materi</Label>
                    <Input
                      id="kode_materi"
                      value={formData.kode_materi}
                      onChange={(e) => setFormData({ ...formData, kode_materi: e.target.value })}
                      placeholder="Contoh: L.1.01"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="nama_materi">Nama Materi</Label>
                    <Input
                      id="nama_materi"
                      value={formData.nama_materi}
                      onChange={(e) => setFormData({ ...formData, nama_materi: e.target.value })}
                      placeholder="Nama materi pelatihan"
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="lama_hari">Lama Hari</Label>
                    <Input
                      id="lama_hari"
                      type="number"
                      value={formData.lama_hari}
                      onChange={(e) => setFormData({ ...formData, lama_hari: parseInt(e.target.value) || 0 })}
                      placeholder="Jumlah hari"
                      min="1"
                      required
                    />
                  </div>
                </div>
                
                {/* Cost Breakdown Section */}
                <div className="space-y-6">
                  <div className="border-t pt-4">
                    <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <Calculator className="h-5 w-5" />
                      Rincian Biaya dan Perhitungan Tarif
                    </h4>
                    

                    {/* Cost Breakdown */}
                    <div className="bg-gray-50 p-4 rounded-lg mb-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="jasa_sarana" className="text-gray-700">Jasa Sarana</Label>
                          <Input
                            id="jasa_sarana"
                            type="number"
                            value={formData.jasa_sarana}
                            onChange={(e) => {
                              const value = parseFloat(e.target.value) || 0;
                              setFormData({ 
                                ...formData, 
                                jasa_sarana: value
                              });
                            }}
                            placeholder="0"
                            min="0"
                            step="0.01"
                            className="bg-white"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Service Fees */}
                    <div className="bg-green-50 p-4 rounded-lg mb-4">
                      <h5 className="font-medium text-green-900 mb-3">Jasa Pelayanan</h5>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="jasa_pel_medis" className="text-green-800">Jasa Pel. Medis</Label>
                          <Input
                            id="jasa_pel_medis"
                            type="number"
                            value={formData.jasa_pel_medis}
                            onChange={(e) => {
                              const value = parseFloat(e.target.value) || 0;
                              const totalJasaPel = Math.round(value + formData.jasa_pel_non_medis);
                              const finalTariff = calculateFinalTariff(formData.jasa_sarana, totalJasaPel);
                              const persenJasaPel = calculatePersenJasaPel(totalJasaPel, finalTariff);
                              const persenProfit = calculatePersenProfit(formData.jasa_sarana, formData.total_uc);
                              setFormData({ 
                                ...formData, 
                                jasa_pel_medis: value,
                                jasa_pelayanan: totalJasaPel,
                                persen_jasa_pel: persenJasaPel,
                                persen_profit: persenProfit,
                                tarif: finalTariff
                              });
                            }}
                            placeholder="0"
                            min="0"
                            step="0.01"
                            className="bg-white"
                          />
                          
                        </div>
                        <div>
                          <Label htmlFor="jasa_pel_non_medis" className="text-green-800">Jasa Pel. Non Medis</Label>
                          <Input
                            id="jasa_pel_non_medis"
                            type="number"
                            value={formData.jasa_pel_non_medis}
                            onChange={(e) => {
                              const value = parseFloat(e.target.value) || 0;
                              const totalJasaPel = Math.round(formData.jasa_pel_medis + value);
                              const finalTariff = calculateFinalTariff(formData.jasa_sarana, totalJasaPel);
                              const persenJasaPel = calculatePersenJasaPel(totalJasaPel, finalTariff);
                              const persenProfit = calculatePersenProfit(formData.jasa_sarana, formData.total_uc);
                              setFormData({ 
                                ...formData, 
                                jasa_pel_non_medis: value,
                                jasa_pelayanan: totalJasaPel,
                                persen_jasa_pel: persenJasaPel,
                                persen_profit: persenProfit,
                                tarif: finalTariff
                              });
                            }}
                            placeholder="0"
                            min="0"
                            step="0.01"
                            className="bg-white"
                          />
                        </div>
                        <div className="col-span-2">
                          <Label htmlFor="jasa_pelayanan" className="text-green-800">Jasa Pelayanan (Total)</Label>
                          <Input
                            id="jasa_pelayanan"
                            type="number"
                            value={formData.jasa_pelayanan}
                            onChange={(e) => {
                              const value = parseFloat(e.target.value) || 0;
                              const finalTariff = calculateFinalTariff(formData.jasa_sarana, value);
                              const persenJasaPel = calculatePersenJasaPel(value, finalTariff);
                              const persenProfit = calculatePersenProfit(formData.jasa_sarana, formData.total_uc);
                              setFormData({ 
                                ...formData, 
                                jasa_pelayanan: value,
                                persen_jasa_pel: persenJasaPel,
                                persen_profit: persenProfit,
                                tarif: finalTariff
                              });
                            }}
                            placeholder="0"
                            min="0"
                            step="0.01"
                            className="bg-white"
                            readOnly
                          />
                        </div>
                      </div>
                    </div>

                    {/* Percentage Calculations */}
                    <div className="bg-yellow-50 p-4 rounded-lg mb-4">
                      <h5 className="font-medium text-yellow-900 mb-3">Persentase</h5>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="persen_jasa_pel" className="text-yellow-800">% Jasa Pelayanan (Computed)</Label>
                          <Input
                            id="persen_jasa_pel"
                            type="number"
                            value={formData.persen_jasa_pel.toFixed(1)}
                            placeholder="0.0"
                            min="0"
                            max="100"
                            step="0.1"
                            className="bg-gray-100"
                            readOnly
                            disabled
                          />
                          <p className="text-xs text-gray-500 mt-1">Nilai ini dihitung otomatis</p>
                        </div>
                        <div>
                          <Label htmlFor="persen_profit" className="text-yellow-800">% Profit (Computed)</Label>
                          <Input
                            id="persen_profit"
                            type="number"
                            value={formData.persen_profit.toFixed(1)}
                            placeholder="0.0"
                            min="0"
                            className="bg-gray-100"
                            readOnly
                            disabled
                          />
                          <p className="text-xs text-gray-500 mt-1">Nilai ini dihitung otomatis berdasarkan jasa_sarana dan unit_cost</p>
                        </div>
                      </div>
                    </div>

                    {/* Final Tariff */}
                    <div className="bg-teal-50 p-4 rounded-lg">
                      <h5 className="font-medium text-teal-900 mb-3">Tarif Final</h5>
                      <div className="grid grid-cols-1 gap-4">
                        <div>
                          <Label htmlFor="tarif" className="text-teal-800">Tarif Final</Label>
                          <Input
                            id="tarif"
                            type="number"
                            value={formData.tarif}
                            onChange={(e) => {
                              const value = parseFloat(e.target.value) || 0;
                              setFormData({ ...formData, tarif: value });
                            }}
                            placeholder="0"
                            min="0"
                            step="0.01"
                            className="bg-white font-semibold text-teal-900"
                            readOnly
                          />
                          
                        </div>
                      </div>
                    </div>
                    
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Batal
                  </Button>
                  <Button type="submit">
                    {editingItem ? 'Perbarui' : 'Simpan'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
          
          {/* Import Data Dialog */}
          <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <FileSpreadsheet className="h-5 w-5" />
                  Impor Data Diklat
                </DialogTitle>
                <DialogDescription>
                  Pilih file Excel (.xlsx atau .xls) yang berisi data diklat untuk diimpor ke sistem.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="import-file">Pilih File Excel</Label>
                  <Input
                    id="import-file"
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={handleFileChange}
                    className="mt-2"
                  />
                  {importFile && (
                    <p className="text-sm text-green-600 mt-2">
                      File dipilih: {importFile.name}
                    </p>
                  )}
                </div>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2">Format File yang Diperlukan:</h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• <strong>Kode Strata:</strong> Kode strata (contoh: L.1, L.2, dst)</li>
                    <li>• <strong>Nama Strata:</strong> Nama strata (contoh: SMA, D3, S1, dst)</li>
                    <li>• <strong>Kode Materi:</strong> Kode materi (contoh: L.1.01, L.1.02, dst)</li>
                    <li>• <strong>Nama Materi:</strong> Nama lengkap materi pelatihan</li>
                    <li>• <strong>Lama Hari:</strong> Jumlah hari (angka)</li>
                    <li>• <strong>Jenis Diklat:</strong> Otomatis menggunakan "basis harian"</li>
                  </ul>
                  <p className="text-sm text-blue-800 mt-2">
                    <strong>Catatan:</strong> Unit cost akan di-set otomatis berdasarkan jenis diklat yang dipilih.
                  </p>
                </div>
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <h4 className="font-medium text-yellow-900 mb-2">Catatan:</h4>
                  <p className="text-sm text-yellow-800">
                    Pastikan file Excel memiliki header yang sesuai dengan template. 
                    Unduh template terlebih dahulu untuk format yang benar.
                  </p>
                </div>
              </div>
              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setIsImportDialogOpen(false);
                    setImportFile(null);
                  }}
                >
                  Batal
                </Button>
                <Button 
                  onClick={handleImportData}
                  disabled={!importFile || isProcessingImport}
                >
                  {isProcessingImport ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Memproses...
                    </>
                  ) : (
                    'Impor Data'
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          {dataDiklat.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Calculator className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>Tidak ada data aktivitas diklat</p>
              <p className="text-sm">Klik "Tambah Data Diklat" untuk menambahkan data baru</p>
            </div>
          ) : (
            <div className="overflow-x-auto max-w-full">
              <Table className="min-w-full">
                <TableHeader className="bg-[#0f766e]">
                  <TableRow className="bg-[#0f766e] hover:bg-[#0f766e]">
                    <TableHead className="w-[120px] text-white">Nama Strata</TableHead>
                    <TableHead className="w-[180px] text-white">Nama Materi</TableHead>
                    <TableHead className="w-20 text-white">Lama Hari</TableHead>
                    <TableHead className="w-24 text-white">Total UC</TableHead>
                    <TableHead className="w-24 text-white">Biaya Bahan</TableHead>
                    <TableHead className="w-24 text-white">Jasa Sarana</TableHead>
                    <TableHead className="w-24 text-white">Jasa Pel. Medis</TableHead>
                    <TableHead className="w-24 text-white">Jasa Pel. Non Medis</TableHead>
                    <TableHead className="w-24 text-white">Jasa Pelayanan</TableHead>
                    <TableHead className="w-20 text-white">% Jasa Pel.</TableHead>
                    <TableHead className="w-20 text-white">% Profit</TableHead>
                    <TableHead className="w-24 text-white">Tarif</TableHead>
                    <TableHead className="w-20 text-right text-white">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dataDiklat.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="w-[120px]">
                        <Badge 
                          variant="secondary"
                          className={getStrataBadgeColor(item.kode_strata)}
                        >
                          {item.nama_strata}
                        </Badge>
                      </TableCell>
                      <TableCell className="w-[180px] font-medium">{item.nama_materi}</TableCell>
                      <TableCell>{item.lama_hari} hari</TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(item.total_uc || 0)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(item.biaya_bahan || 0)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          {editingRow === item.id ? (
                            <Input
                              type="number"
                              value={editValues.jasa_sarana}
                              onChange={(e) => setEditValues({ ...editValues, jasa_sarana: parseFloat(e.target.value) || 0 })}
                              className="w-24 text-right text-sm"
                            />
                          ) : (
                            <span className="text-sm">{formatCurrency(item.jasa_sarana || item.unit_cost_per_hari)}</span>
                          )}
                          {editingRow === item.id && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 w-6 p-0"
                              onClick={() => handleSaveRow(item.id)}
                              disabled={loading}
                            >
                              {loading ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <Check className="h-3 w-3 text-green-600" />
                              )}
                            </Button>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          {editingRow === item.id ? (
                            <Input
                              type="number"
                              value={editValues.jasa_pel_medis}
                              onChange={(e) => setEditValues({ ...editValues, jasa_pel_medis: parseFloat(e.target.value) || 0 })}
                              className="w-24 text-right text-sm"
                            />
                          ) : (
                            <span className="text-sm">{formatCurrency(item.jasa_pel_medis || 0)}</span>
                          )}
                          {editingRow === item.id && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 w-6 p-0"
                              onClick={() => handleSaveRow(item.id)}
                              disabled={loading}
                            >
                              {loading ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <Check className="h-3 w-3 text-green-600" />
                              )}
                            </Button>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          {editingRow === item.id ? (
                            <Input
                              type="number"
                              value={editValues.jasa_pel_non_medis}
                              onChange={(e) => setEditValues({ ...editValues, jasa_pel_non_medis: parseFloat(e.target.value) || 0 })}
                              className="w-24 text-right text-sm"
                            />
                          ) : (
                            <span className="text-sm">{formatCurrency(item.jasa_pel_non_medis || 0)}</span>
                          )}
                          {editingRow === item.id && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 w-6 p-0"
                              onClick={() => handleSaveRow(item.id)}
                              disabled={loading}
                            >
                              {loading ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <Check className="h-3 w-3 text-green-600" />
                              )}
                            </Button>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-medium text-sm">
                        {formatCurrency(item.jasa_pelayanan || 0)}
                      </TableCell>
                      <TableCell className="text-right text-sm">
                        <Badge variant="outline" className="text-xs">
                          {(item.persen_jasa_pel || 0).toFixed(1)}%
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right text-sm">
                        <Badge variant={(item.persen_profit || 0) >= 0 ? "default" : "destructive"} className="text-xs">
                          {(item.persen_profit || 0).toFixed(1)}%
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-bold text-primary text-sm">
                        {formatCurrency(item.tarif || item.jasa_sarana || item.unit_cost_per_hari)}
                      </TableCell>
                      <TableCell>
                        {editingRow === item.id ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={handleCancelEdit}
                            className="text-xs"
                          >
                            Batal
                          </Button>
                        ) : (
                          <div className="flex justify-end gap-2">
                            <Button variant="edit" size="sm" onClick={() => handleStartEdit(item)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="destructive" size="sm" onClick={() => handleDelete(item.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
