import React, { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { DataKegiatan } from "@/types/data-kegiatan";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Pencil, Trash2, RefreshCw, FileText, Eye, Download, Upload, Users, Zap, Bed, Stethoscope, Utensils } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import * as XLSX from "xlsx";
import Papa from "papaparse";
import { ImportProgressModal } from "@/components/ui/ImportProgressModal";
import { useUploadProgress } from "@/hooks/use-upload-progress";
import { useReportDownload } from "@/components/report";

const formSchema = z.object({
  Kode_UK: z.string().min(1, "Kode UK harus diisi"),
  Nama_Unit_Kerja: z.string().min(1, "Nama Unit Kerja harus diisi"),
  tahun: z.number().min(2000, "Tahun harus minimal 2000"),
  // Jenis harus sesuai dengan constraint database (1-4)
  Jenis: z.enum(["Rawat Jalan", "Rawat Inap", "Operatif", "Non Layanan"]).default("Operatif"),
  // Utilisasi Pegawai
  Jml_jam_Praktek_Harian: z.number().min(0).optional(),
  Diklat_Jumlah_Siswa: z.number().min(0).optional(),
  Diklat_Lama_Hari: z.number().min(0).optional(),
  SDM_dokter: z.number().min(0).optional(),
  SDM_Perawat: z.number().min(0).optional(),
  SDM_Non: z.number().min(0).optional(),
  // Utilisasi Daya
  Listrik_kwh: z.number().min(0).optional(),
  Air_m3: z.number().min(0).optional(),
  Telepon_Freq_pakai_per_titik: z.number().min(0).optional(),
  Komputer_simrs_user: z.number().min(0).optional(),
  // Sarana dan luas kamar
  Tempat_Tidur_SVIP: z.number().min(0).optional(),
  Tempat_Tidur_VIP: z.number().min(0).optional(),
  Tempat_Tidur_I: z.number().min(0).optional(),
  Tempat_Tidur_II: z.number().min(0).optional(),
  Tempat_Tidur_III: z.number().min(0).optional(),
  Tempat_Tidur_Khusus: z.number().min(0).optional(),
  kamar_luas_svip: z.number().min(0).optional(),
  kamar_luas_vip: z.number().min(0).optional(),
  kamar_luas_i: z.number().min(0).optional(),
  kamar_luas_ii: z.number().min(0).optional(),
  kamar_luas_iii: z.number().min(0).optional(),
  // Kunjungan & Pelayanan
  Kunjungan_Pasien_Lama: z.number().min(0).optional(),
  Kunjungan_Pasien_Baru: z.number().min(0).optional(),
  Jumlah_Tindakan: z.number().min(0).optional(),
  Resep_Lembar_Resep: z.number().min(0).optional(),
  Hari_Rawat_SVIP: z.number().min(0).optional(),
  Hari_Rawat_VIP: z.number().min(0).optional(),
  Hari_Rawat_I: z.number().min(0).optional(),
  Hari_Rawat_II: z.number().min(0).optional(),
  Hari_Rawat_III: z.number().min(0).optional(),
  // Penunjang
  Cucian_kg_Cucian: z.number().min(0).optional(),
  Instrumen_Besar: z.number().min(0).optional(),
  Instrumen_Sedang: z.number().min(0).optional(),
  Instrumen_Kecil: z.number().min(0).optional(),
  Set_Pack_Besar: z.number().min(0).optional(),
  Set_Pack_Sedang: z.number().min(0).optional(),
  Set_Pack_Kecil: z.number().min(0).optional(),
  Makanan_Karyawan_jml_Porsi: z.number().min(0).optional(),
  Makanan_Pasien_jml_Porsi: z.number().min(0).optional(),
  jumlah_porsi_svip: z.number().min(0).optional(),
  jumlah_porsi_vip: z.number().min(0).optional(),
  jumlah_porsi_i: z.number().min(0).optional(),
  jumlah_porsi_ii: z.number().min(0).optional(),
  jumlah_porsi_iii: z.number().min(0).optional(),
});

interface DataKegiatanExtra {
  kamar_luas_svip?: number | null;
  kamar_luas_vip?: number | null;
  kamar_luas_i?: number | null;
  kamar_luas_ii?: number | null;
  kamar_luas_iii?: number | null;
  jumlah_porsi_svip?: number | null;
  jumlah_porsi_vip?: number | null;
  jumlah_porsi_i?: number | null;
  jumlah_porsi_ii?: number | null;
  jumlah_porsi_iii?: number | null;
}

// Helper function to validate jenis label
const validateJenisLabel = (label: string): string => {
  const validLabels = ['Rawat Jalan', 'Rawat Inap', 'Operatif', 'Non Layanan'];
  return validLabels.includes(label) ? label : 'Operatif';
};

export default function DataKegiatanFormTable() {
  const { downloadReport } = useReportDownload();
  const [data, setData] = useState<(DataKegiatan & DataKegiatanExtra)[]>([]);
  const [loading, setLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<DataKegiatan | null>(null);
  const [viewingItem, setViewingItem] = useState<DataKegiatan | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [selectedUnitName, setSelectedUnitName] = useState<string|"all">("all");
  const [unitKerjaList, setUnitKerjaList] = useState<{id:string; kode:string; nama:string; jenis?: string | null;}[]>([]);
  const { uploadProgress, startUpload, updateProgress, completeUpload, showError: showUploadError } = useUploadProgress();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      Kode_UK: "",
      Nama_Unit_Kerja: "",
      tahun: new Date().getFullYear(),
      // Default gunakan salah satu nilai yang diizinkan oleh constraint
      Jenis: "Operatif",
      Jml_jam_Praktek_Harian: 0,
      Diklat_Jumlah_Siswa: 0,
      Diklat_Lama_Hari: 0,
      SDM_dokter: 0,
      SDM_Perawat: 0,
      SDM_Non: 0,
      Listrik_kwh: 0,
      Air_m3: 0,
      Telepon_Freq_pakai_per_titik: 0,
      Komputer_simrs_user: 0,
      Tempat_Tidur_SVIP: 0,
      Tempat_Tidur_VIP: 0,
      Tempat_Tidur_I: 0,
      Tempat_Tidur_II: 0,
      Tempat_Tidur_III: 0,
      Tempat_Tidur_Khusus: 0,
      kamar_luas_svip: 0,
      kamar_luas_vip: 0,
      kamar_luas_i: 0,
      kamar_luas_ii: 0,
      kamar_luas_iii: 0,
      Kunjungan_Pasien_Lama: 0,
      Kunjungan_Pasien_Baru: 0,
      Jumlah_Tindakan: 0,
      Resep_Lembar_Resep: 0,
      Hari_Rawat_SVIP: 0,
      Hari_Rawat_VIP: 0,
      Hari_Rawat_I: 0,
      Hari_Rawat_II: 0,
      Hari_Rawat_III: 0,
      Cucian_kg_Cucian: 0,
      Instrumen_Besar: 0,
      Instrumen_Sedang: 0,
      Instrumen_Kecil: 0,
      Set_Pack_Besar: 0,
      Set_Pack_Sedang: 0,
      Set_Pack_Kecil: 0,
      Makanan_Karyawan_jml_Porsi: 0,
      Makanan_Pasien_jml_Porsi: 0,
      jumlah_porsi_svip: 0,
      jumlah_porsi_vip: 0,
      jumlah_porsi_i: 0,
      jumlah_porsi_ii: 0,
      jumlah_porsi_iii: 0,
    },
  });

  // Load data
  const loadData = async () => {
    setLoading(true);
    try {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error("User tidak ditemukan. Silakan login kembali.");
      }

              let query = supabase
          .from("data_kegiatan")
          .select("*")
          .eq("tahun", selectedYear)
          // Removed user_id filter - all users can see all data
          .order("Kode_UK");

      if (selectedUnitName !== "all") {
        query = query.eq("Nama_Unit_Kerja", selectedUnitName);
      }

      const { data: kegiatan, error } = await query;

      if (error) throw error;
      setData((kegiatan || []).map((d:any)=> ({ ...d, Jenis: validateJenisLabel(d.Jenis || 'Operatif') })));
    } catch (error: any) {
      console.error("Error loading data:", error);
      toast.error(error.message || "Gagal memuat data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // Load unit kerja for filter
    (supabase
      .from('unit_kerja')
      .select('id,kode,nama,jenis')
      .order('nama', { ascending: true })
      .then(({ data }) => setUnitKerjaList(data || []))) as any;
  }, []);

  useEffect(() => {
    loadData();
  }, [selectedYear, selectedUnitName]);

  // Handle dialog close safely
  useEffect(() => {
    if (!isDialogOpen) {
      setEditingItem(null);
      form.reset();
    }
  }, [isDialogOpen, form]);

  // Handle form submit
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setLoading(true);
    try {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error("User tidak ditemukan. Silakan login kembali.");
      }

      // Keep jenis as text value for the constraint
      const payload = { 
        ...values, 
        Jenis: values.Jenis, // Keep as text value
        user_id: user.id  // Add user_id for RLS
      } as any;
      
              if (editingItem) {
          // Update existing - all users can update all data
          const { error } = await supabase
            .from("data_kegiatan")
            .update(payload)
            .eq("id", editingItem.id);
            // Removed user_id filter - all users can update all data

        if (error) throw error;
        toast.success("Data berhasil diperbarui");
      } else {
                  // Create new - check for duplicates first
          // Check based on unique constraint (tahun, Kode_UK) - all users share the same data
          const { data: existingData, error: checkError } = await supabase      
            .from("data_kegiatan")
            .select("id")
            .eq("Kode_UK", values.Kode_UK)
            .eq("tahun", values.tahun)
            // Removed user_id filter - check duplicate across all users
            .maybeSingle();

        if (checkError) throw checkError;
        
        if (existingData) {
          throw new Error("Data dengan Kode UK dan tahun ini sudah ada.");
        }

        const { error } = await supabase
          .from("data_kegiatan")
          .insert([payload]);

        if (error) throw error;
        toast.success("Data berhasil ditambahkan");
      }

      setIsDialogOpen(false);
      // setEditingItem(null) and form.reset() will be handled by useEffect
      loadData();
    } catch (error: any) {
      console.error("Error saving data:", error);
      toast.error(error.message || "Gagal menyimpan data");
    } finally {
      setLoading(false);
    }
  };

  // Handle edit
  const handleEdit = (item: DataKegiatan) => {
    setEditingItem(item);
    form.reset({
      Kode_UK: item.Kode_UK || "",
      Nama_Unit_Kerja: item.Nama_Unit_Kerja || "",
      tahun: item.tahun || new Date().getFullYear(),
      Jenis: (item.Jenis as any) || "Operatif",
      Jml_jam_Praktek_Harian: item.Jml_jam_Praktek_Harian || 0,
      Diklat_Jumlah_Siswa: item.Diklat_Jumlah_Siswa || 0,
      Diklat_Lama_Hari: item.Diklat_Lama_Hari || 0,
      SDM_dokter: item.SDM_dokter || 0,
      SDM_Perawat: item.SDM_Perawat || 0,
      SDM_Non: item.SDM_Non || 0,
      Listrik_kwh: item.Listrik_kwh || 0,
      Air_m3: item.Air_m3 || 0,
      Telepon_Freq_pakai_per_titik: item.Telepon_Freq_pakai_per_titik || 0,
      Komputer_simrs_user: item.Komputer_simrs_user || 0,
      Tempat_Tidur_SVIP: item.Tempat_Tidur_SVIP || 0,
      Tempat_Tidur_VIP: item.Tempat_Tidur_VIP || 0,
      Tempat_Tidur_I: item.Tempat_Tidur_I || 0,
      Tempat_Tidur_II: item.Tempat_Tidur_II || 0,
      Tempat_Tidur_III: item.Tempat_Tidur_III || 0,
      Tempat_Tidur_Khusus: item.Tempat_Tidur_Khusus || 0,
      kamar_luas_svip: (item as any).kamar_luas_svip || 0,
      kamar_luas_vip: (item as any).kamar_luas_vip || 0,
      kamar_luas_i: (item as any).kamar_luas_i || 0,
      kamar_luas_ii: (item as any).kamar_luas_ii || 0,
      kamar_luas_iii: (item as any).kamar_luas_iii || 0,
      Kunjungan_Pasien_Lama: item.Kunjungan_Pasien_Lama || 0,
      Kunjungan_Pasien_Baru: item.Kunjungan_Pasien_Baru || 0,
      Jumlah_Tindakan: item.Jumlah_Tindakan || 0,
      Resep_Lembar_Resep: item.Resep_Lembar_Resep || 0,
      Hari_Rawat_SVIP: item.Hari_Rawat_SVIP || 0,
      Hari_Rawat_VIP: item.Hari_Rawat_VIP || 0,
      Hari_Rawat_I: item.Hari_Rawat_I || 0,
      Hari_Rawat_II: item.Hari_Rawat_II || 0,
      Hari_Rawat_III: item.Hari_Rawat_III || 0,
      Cucian_kg_Cucian: item.Cucian_kg_Cucian || 0,
      Instrumen_Besar: item.Instrumen_Besar || 0,
      Instrumen_Sedang: item.Instrumen_Sedang || 0,
      Instrumen_Kecil: item.Instrumen_Kecil || 0,
      Set_Pack_Besar: item.Set_Pack_Besar || 0,
      Set_Pack_Sedang: item.Set_Pack_Sedang || 0,
      Set_Pack_Kecil: item.Set_Pack_Kecil || 0,
      Makanan_Karyawan_jml_Porsi: item.Makanan_Karyawan_jml_Porsi || 0,
      Makanan_Pasien_jml_Porsi: item.Makanan_Pasien_jml_Porsi || 0,
      jumlah_porsi_svip: (item as any).jumlah_porsi_svip || 0,
      jumlah_porsi_vip: (item as any).jumlah_porsi_vip || 0,
      jumlah_porsi_i: (item as any).jumlah_porsi_i || 0,
      jumlah_porsi_ii: (item as any).jumlah_porsi_ii || 0,
      jumlah_porsi_iii: (item as any).jumlah_porsi_iii || 0,
    });
    setIsDialogOpen(true);
  };

  // Handle view
  const handleView = (item: DataKegiatan) => {
    setViewingItem(item);
    setIsViewDialogOpen(true);
  };

  // Handle delete
  const handleDelete = async (id: number) => {
    if (!confirm("Apakah Anda yakin ingin menghapus data ini?")) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from("data_kegiatan")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast.success("Data berhasil dihapus");
      loadData();
    } catch (error) {
      console.error("Error deleting data:", error);
      toast.error("Gagal menghapus data");
    } finally {
      setLoading(false);
    }
  };

  // Handle dialog close
  const handleDialogClose = () => {
    setIsDialogOpen(false);
    // setEditingItem(null) and form.reset() will be handled by useEffect
  };

  const handleViewDialogClose = () => {
    setIsViewDialogOpen(false);
    setViewingItem(null);
  };

  // Helpers for import/export/template
  const handleDownloadTemplate = async () => {
    // Prepare headers
    const headers = [
      // Urutan mengikuti struktur tabel Data_Kegiatan (tanpa kolom computed)
      "Kode UK",
      "Nama Unit Kerja",
      "Tahun",
      "Jenis",
      // 4. Utilisasi Pegawai
      "Jml Jam Praktek Harian",
      "Diklat_Jumlah_Siswa",
      "Diklat_Lama_Hari",
      "SDM Dokter",
      "SDM Perawat",
      "SDM Non",
      // 5. Utilisasi Daya
      "Listrik (kwh)",
      "Air (m3)",
      "Telepon Freq/Titik",
      "Komputer SIMRS User",
      // 6. Utilitas Tempat Tidur
      "Tempat Tidur SVIP",
      "Tempat Tidur VIP",
      "Tempat Tidur I",
      "Tempat Tidur II",
      "Tempat Tidur III",
      "Tempat Tidur Khusus",
      // Luas kamar per kelas
      "Kamar Luas SVIP",
      "Kamar Luas VIP",
      "Kamar Luas I",
      "Kamar Luas II",
      "Kamar Luas III",
      // 7. Kunjungan & Pelayanan
      "Kunjungan Pasien Lama",
      "Kunjungan Pasien Baru",
      "Jumlah Tindakan",
      "Resep Lembar Resep",
      // 8. Utilitas Perawatan (hari rawat per kelas)
      "Hari Rawat SVIP",
      "Hari Rawat VIP",
      "Hari Rawat I",
      "Hari Rawat II",
      "Hari Rawat III",
      // 2. Utilisasi Bahan Non Medis & 3. Penunjang
      "Cucian (kg)",
      "Instrumen Besar",
      "Instrumen Sedang",
      "Instrumen Kecil",
      "Set Pack Besar",
      "Set Pack Sedang",
      "Set Pack Kecil",
      "Makanan Karyawan (porsi)",
      "Makanan Pasien (porsi)",
      // porsi per kelas
      "Jumlah Porsi SVIP",
      "Jumlah Porsi VIP",
      "Jumlah Porsi I",
      "Jumlah Porsi II",
      "Jumlah Porsi III",
    ];
    // Prefill rows from unit_kerja with kode, nama, jenis
    const currentYear = new Date().getFullYear();
    const prefilled = unitKerjaList.map((uk) => ([
      uk.kode,
      uk.nama,
      currentYear,
      // DB expects one of four allowed labels; normalize
      validateJenisLabel(uk.jenis || 'Operatif'),
      // Rest columns left blank for user to fill
    ]));

    const sheetData = [headers, ...prefilled];
    const ws = XLSX.utils.aoa_to_sheet(sheetData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template Data Kegiatan");
    XLSX.writeFile(wb, `template_data_kegiatan_${currentYear}.xlsx`);
  };

  const parseNum = (v: any) => {
    const n = Number(String(v ?? "").replace(/,/g, "."));
    return isNaN(n) ? 0 : n;
  };

  const handleImportData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      console.log("No file selected");
      toast.error("Tidak ada file yang dipilih");
      return;
    }
    console.log("File selected:", file.name, file.type, file.size);
    toast.info(`Memulai import file: ${file.name}`);
    
    // Show progress modal immediately
    startUpload(1, "Sedang membaca file...");
    
    event.target.value = "";
    const runCsvParse = async (text: string) => {
      try {
        (Papa as any).parse(text, {
          header: true,
          skipEmptyLines: true,
          complete: async (results: Papa.ParseResult<any>) => {
          try {
            console.log("Papa.parse completed, results:", results);
            console.log("Parsed data rows:", results.data?.length);
            const rows: any[] = [];
            for (const r of results.data as any[]) {
              const kode = (r["Kode UK"] || "").toString().trim();
              const nama = (r["Nama Unit Kerja"] || "").toString().trim();
              const tahun = parseInt(r["Tahun"] || new Date().getFullYear());
              if (!kode || !nama) continue;
              
              // Clean the row data to ensure no undefined values
              const cleanRow = {
                Kode_UK: kode,
                Nama_Unit_Kerja: nama,
                tahun,
                // Validate Jenis as text value for constraint
                Jenis: validateJenisLabel((r['Jenis'] ?? '').toString().trim()),
                SDM_dokter: parseNum(r["SDM Dokter"]),
                SDM_Perawat: parseNum(r["SDM Perawat"]),
                SDM_Non: parseNum(r["SDM Non"]),
                Diklat_Jumlah_Siswa: parseNum(r["Diklat Jumlah Siswa"]),
                Diklat_Lama_Hari: parseNum(r["Diklat Lama Hari"]),
                Jml_jam_Praktek_Harian: parseNum(r["Jml Jam Praktek Harian"]),
                Listrik_kwh: parseNum(r["Listrik (kwh)"]),
                Air_m3: parseNum(r["Air (m3)"]),
                Telepon_Freq_pakai_per_titik: parseNum(r["Telepon Freq/Titik"]),
                Komputer_simrs_user: parseNum(r["Komputer SIMRS User"]),
                Tempat_Tidur_SVIP: parseNum(r["Tempat Tidur SVIP"]),
                Tempat_Tidur_VIP: parseNum(r["Tempat Tidur VIP"]),
                Tempat_Tidur_I: parseNum(r["Tempat Tidur I"]),
                Tempat_Tidur_II: parseNum(r["Tempat Tidur II"]),
                Tempat_Tidur_III: parseNum(r["Tempat Tidur III"]),
                Tempat_Tidur_Khusus: parseNum(r["Tempat Tidur Khusus"]),
                kamar_luas_svip: parseNum(r["Kamar Luas SVIP"]),
                kamar_luas_vip: parseNum(r["Kamar Luas VIP"]),
                kamar_luas_i: parseNum(r["Kamar Luas I"]),
                kamar_luas_ii: parseNum(r["Kamar Luas II"]),
                kamar_luas_iii: parseNum(r["Kamar Luas III"]),
                Kunjungan_Pasien_Lama: parseNum(r["Kunjungan Pasien Lama"]),
                Kunjungan_Pasien_Baru: parseNum(r["Kunjungan Pasien Baru"]),
                Jumlah_Tindakan: parseNum(r["Jumlah Tindakan"]),
                Resep_Lembar_Resep: parseNum(r["Resep Lembar Resep"]),
                Hari_Rawat_SVIP: parseNum(r["Hari Rawat SVIP"]),
                Hari_Rawat_VIP: parseNum(r["Hari Rawat VIP"]),
                Hari_Rawat_I: parseNum(r["Hari Rawat I"]),
                Hari_Rawat_II: parseNum(r["Hari Rawat II"]),
                Hari_Rawat_III: parseNum(r["Hari Rawat III"]),
                Cucian_kg_Cucian: parseNum(r["Cucian (kg)"]),
                Instrumen_Besar: parseNum(r["Instrumen Besar"]),
                Instrumen_Sedang: parseNum(r["Instrumen Sedang"]),
                Instrumen_Kecil: parseNum(r["Instrumen Kecil"]),
                Set_Pack_Besar: parseNum(r["Set Pack Besar"]),
                Set_Pack_Sedang: parseNum(r["Set Pack Sedang"]),
                Set_Pack_Kecil: parseNum(r["Set Pack Kecil"]),
                Makanan_Karyawan_jml_Porsi: parseNum(r["Makanan Karyawan (porsi)"]),
                Makanan_Pasien_jml_Porsi: parseNum(r["Makanan Pasien (porsi)"]),
                jumlah_porsi_svip: parseNum(r["Jumlah Porsi SVIP"]),
                jumlah_porsi_vip: parseNum(r["Jumlah Porsi VIP"]),
                jumlah_porsi_i: parseNum(r["Jumlah Porsi I"]),
                jumlah_porsi_ii: parseNum(r["Jumlah Porsi II"]),
                jumlah_porsi_iii: parseNum(r["Jumlah Porsi III"]),
              };
              
              // Remove any undefined or null values
              Object.keys(cleanRow).forEach(key => {
                if (cleanRow[key as keyof typeof cleanRow] === undefined) {
                  delete cleanRow[key as keyof typeof cleanRow];
                }
              });
              
              rows.push(cleanRow);
            }
            if (rows.length === 0) {
              console.log("No valid rows found in CSV");
              toast.error("Tidak ada data valid untuk diimpor. Pastikan file memiliki kolom 'Kode UK' dan 'Nama Unit Kerja' yang terisi.");
              showUploadError("Tidak ada data valid untuk diimpor.");
              return;
            }
            console.log("Starting upload with", rows.length, "rows");
            console.log("Sample row data:", rows[0]);
            
            // Force progress modal to show
            startUpload(rows.length, "Sedang mengimpor data kegiatan...");
            console.log("startUpload called, progress should be visible now");
            
            // Force a small delay to ensure state updates
            await new Promise(resolve => setTimeout(resolve, 100));
            // Bounded concurrency importer to avoid stalls
            let success = 0; let failed = 0; let processed = 0;
            const errorSamples: { index: number; message: string }[] = [];
            let cursor = 0;
            const MAX_CONCURRENCY = 8;

            const processRow = async () => {
              const myIndex = cursor++;
              if (myIndex >= rows.length) return;
              const row = rows[myIndex];
              
              try {
                // Validate required fields first
                if (!row.Kode_UK || !row.Nama_Unit_Kerja || !row.tahun) {
                  console.error(`Invalid data for row ${myIndex + 1}: missing required fields`);
                  failed++; 
                  errorSamples.push({ index: myIndex+1, message: 'Missing required fields: Kode_UK, Nama_Unit_Kerja, or tahun' }); 
                  processed++;
                  updateProgress(processed, success, failed, `Memproses ${processed}/${rows.length}...`);
                  if (cursor < rows.length) {
                    await processRow();
                  }
                  return;
                }
                
                // Try to insert first (upsert approach)
                console.log(`Processing row ${myIndex + 1}:`, row);
                
                // Get current user for this row
                const { data: { user }, error: userError } = await supabase.auth.getUser();
                if (userError || !user) {
                  throw new Error("User tidak ditemukan. Silakan login kembali.");
                }

                // Add user_id to row data
                const rowWithUser = { ...row, user_id: user.id };

                // Existence check then update-by-id or insert
                const { data: existingRec, error: findErr } = await supabase
                  .from("data_kegiatan")
                  .select('id')
                  .eq('tahun', row.tahun)
                  .eq('Kode_UK', row.Kode_UK)
                  .eq('Nama_Unit_Kerja', row.Nama_Unit_Kerja)
                  .eq('user_id', user.id)
                  .maybeSingle();

                if (findErr) {
                  console.error(`Find existing error for row ${myIndex + 1}:`, findErr);
                  failed++;
                  errorSamples.push({ index: myIndex+1, message: findErr.message || 'Find existing failed' });
                } else if (existingRec && (existingRec as any).id) {
                  const { error: updErr } = await supabase
                    .from('data_kegiatan')
                    .update(rowWithUser)
                    .eq('id', (existingRec as any).id)
                    .eq('user_id', user.id);
                  if (updErr) {
                    console.error(`Update-by-id error for row ${myIndex + 1}:`, updErr);
                    failed++;
                    errorSamples.push({ index: myIndex+1, message: updErr.message || 'Update failed' });
                  } else {
                    success++;
                  }
                } else {
                  const { error: insErr } = await supabase
                    .from('data_kegiatan')
                    .insert([rowWithUser]);
                  if (insErr) {
                    console.error(`Insert error for row ${myIndex + 1}:`, insErr);
                    failed++;
                    errorSamples.push({ index: myIndex+1, message: insErr.message || 'Insert failed' });
                  } else {
                    success++;
                  }
                }
                
              } catch (error: any) {
                console.error(`Unexpected error for row ${myIndex + 1}:`, error);
                failed++; 
                errorSamples.push({ index: myIndex+1, message: `Unexpected error: ${error.message || 'Unknown error'}` });
              }
              
              // Update progress after processing each row
              processed++;
              updateProgress(processed, success, failed, `Memproses ${processed}/${rows.length}...`);
              
              // chain next row
              if (cursor < rows.length) {
                await processRow();
              }
            };

            // start workers
            const workers = Array.from({ length: Math.min(MAX_CONCURRENCY, rows.length) }, () => processRow());
            await Promise.all(workers);
            console.log("Import completed. Success:", success, "Failed:", failed);
            completeUpload(success, failed, 0);
            
            // Show toast notifications
            if (failed === 0) {
              toast.success(`Import berhasil! ${success} data berhasil diimpor.`);
            } else if (success > 0) {
              toast.warning(`Import selesai dengan beberapa error. ${success} berhasil, ${failed} gagal.`);
            } else {
              toast.error(`Import gagal! ${failed} data gagal diimpor.`);
            }
            
            if (failed > 0 && errorSamples.length > 0) {
              const first = errorSamples[0];
              showUploadError(`Sebagian baris gagal diimpor. Contoh error pada baris ${first.index}: ${first.message}`);
              console.error('Import errors (sampled):', errorSamples.slice(0, 10));
            }
            await loadData();
          } catch (err: any) {
            console.error("Error in import process:", err);
            toast.error("Gagal impor: " + err.message);
            showUploadError("Gagal impor: " + err.message);
          }
        },
        error: (e) => {
          console.error("Papa.parse error:", e);
          toast.error("Gagal membaca file: " + e.message);
          showUploadError("Gagal membaca file: " + e.message);
        },
        });
      } catch (parseError) {
        console.error("Papa.parse error:", parseError);
        toast.error("Gagal memparse file: " + (parseError as Error).message);
        showUploadError("Gagal memparse file: " + (parseError as Error).message);
      }
    };

    if (file.name.endsWith('.csv')) {
      file.text()
        .then(runCsvParse)
        .catch((error) => {
          console.error("Error reading CSV file:", error);
          toast.error('Gagal membaca file CSV: ' + error.message);
          showUploadError('Gagal membaca file CSV: ' + error.message);
        });
    } else {
      // Dukungan sederhana untuk Excel: convert sheet pertama ke CSV
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const wb = XLSX.read(data, { type: 'array' });
          const wsname = wb.SheetNames[0];
          const ws = wb.Sheets[wsname];
          const csv = XLSX.utils.sheet_to_csv(ws);
          runCsvParse(csv);
        } catch (err: any) {
          console.error("Error reading Excel file:", err);
          toast.error('Gagal membaca file Excel: ' + (err?.message || 'Unknown error'));
          showUploadError('Gagal membaca file Excel: ' + (err?.message || 'Unknown error'));
        }
      };
      reader.onerror = (error) => {
        console.error("FileReader error:", error);
        toast.error('Gagal membaca file.');
        showUploadError('Gagal membaca file.');
      };
      reader.readAsArrayBuffer(file);
    }
  };

  const handleDownloadReport = async () => {
    if (!data || data.length === 0) {
      toast.warning("Tidak ada data untuk laporan.");
      return;
    }

    try {
      const records = data.map((d) => ({
        Tahun: d.tahun,
        "Kode UK": d.Kode_UK,
        "Nama Unit Kerja": d.Nama_Unit_Kerja,
        "SDM Dokter": d.SDM_dokter || 0,
        "SDM Perawat": d.SDM_Perawat || 0,
        "SDM Non": d.SDM_Non || 0,
        "Jumlah SDM": d.Jumlah_SDM || 0,
        "Diklat Jumlah Siswa": d.Diklat_Jumlah_Siswa || 0,
        "Diklat Lama Hari": d.Diklat_Lama_Hari || 0,
        "Total Diklat": d.Total_Diklat || 0,
        "Jam Praktek Harian": d.Jml_jam_Praktek_Harian || 0,
        "Listrik (kwh)": d.Listrik_kwh || 0,
        "Air (m3)": d.Air_m3 || 0,
        "Telepon Freq/Titik": d.Telepon_Freq_pakai_per_titik || 0,
        "Komputer SIMRS": d.Komputer_simrs_user || 0,
        "TT SVIP": d.Tempat_Tidur_SVIP || 0,
        "TT VIP": d.Tempat_Tidur_VIP || 0,
        "TT I": d.Tempat_Tidur_I || 0,
        "TT II": d.Tempat_Tidur_II || 0,
        "TT III": d.Tempat_Tidur_III || 0,
        "TT Khusus": d.Tempat_Tidur_Khusus || 0,
        "Luas SVIP": (d as any).kamar_luas_svip || 0,
        "Luas VIP": (d as any).kamar_luas_vip || 0,
        "Luas I": (d as any).kamar_luas_i || 0,
        "Luas II": (d as any).kamar_luas_ii || 0,
        "Luas III": (d as any).kamar_luas_iii || 0,
        "Kunjungan Lama": d.Kunjungan_Pasien_Lama || 0,
        "Kunjungan Baru": d.Kunjungan_Pasien_Baru || 0,
        "Total Kunjungan": d.Total_Kunjungan_Pasien || 0,
        "Jumlah Tindakan": d.Jumlah_Tindakan || 0,
        "Resep": d.Resep_Lembar_Resep || 0,
        "Hari Rawat SVIP": d.Hari_Rawat_SVIP || 0,
        "Hari Rawat VIP": d.Hari_Rawat_VIP || 0,
        "Hari Rawat I": d.Hari_Rawat_I || 0,
        "Hari Rawat II": d.Hari_Rawat_II || 0,
        "Hari Rawat III": d.Hari_Rawat_III || 0,
        "Cucian (kg)": d.Cucian_kg_Cucian || 0,
        "Instrumen Besar": d.Instrumen_Besar || 0,
        "Instrumen Sedang": d.Instrumen_Sedang || 0,
        "Instrumen Kecil": d.Instrumen_Kecil || 0,
        "Set Pack Besar": d.Set_Pack_Besar || 0,
        "Set Pack Sedang": d.Set_Pack_Sedang || 0,
        "Set Pack Kecil": d.Set_Pack_Kecil || 0,
        "Porsi Karyawan": d.Makanan_Karyawan_jml_Porsi || 0,
        "Porsi Pasien": d.Makanan_Pasien_jml_Porsi || 0,
      }));

      await downloadReport({
        title: "Laporan Data Kegiatan",
        subtitle: `Tahun ${selectedYear}`,
        filename: `data_kegiatan_${selectedYear}_${selectedUnitName}`,
        records,
        orientation: "landscape",
      });
    } catch (error) {
      console.error("Gagal mengunduh laporan data kegiatan:", error);
      toast.error("Gagal mengunduh laporan.");
    }
  };

  const getJenisBadgeVariant = (jenis: string | number | null | undefined) => {
    const label = validateJenisLabel((jenis || 'Operatif').toString());
    switch (label) {
      case "Rawat Jalan":
        return "default";
      case "Rawat Inap":
        return "secondary";
      case "Operatif":
        return "destructive";
      case "Non Layanan":
        return "outline";
      default:
        return "outline";
    }
  };

  return (
    <div className="space-y-6">
      {/* Upload Progress Modal */}
      <ImportProgressModal progress={uploadProgress} />
      {/* Debug info */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed top-4 right-4 bg-yellow-100 p-2 rounded text-xs z-50">
          Progress visible: {uploadProgress.isVisible ? 'YES' : 'NO'}<br/>
          Status: {uploadProgress.status}<br/>
          Current: {uploadProgress.current}/{uploadProgress.total}
        </div>
      )}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Data Kegiatan
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* KPI badges */}
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-4">
            <div className="p-3 rounded-md bg-slate-50 border"><div className="text-xs text-slate-500">Total Unit Kerja</div><div className="text-lg font-semibold">{new Set(data.map(d=>d.Nama_Unit_Kerja)).size}</div></div>
            <div className="p-3 rounded-md bg-sky-50 border"><div className="text-xs text-sky-600">Total SDM</div><div className="text-lg font-semibold">{data.reduce((s,d)=>s+(d.Jumlah_SDM||0),0)}</div></div>
            <div className="p-3 rounded-md bg-blue-50 border"><div className="text-xs text-blue-600">Total Kunjungan</div><div className="text-lg font-semibold">{data.reduce((s,d)=>s+(d.Total_Kunjungan_Pasien||0),0)}</div></div>
            <div className="p-3 rounded-md bg-emerald-50 border"><div className="text-xs text-emerald-600">Total Tempat Tidur</div><div className="text-lg font-semibold">{data.reduce((s,d)=>s+((d.Tempat_Tidur_SVIP||0)+(d.Tempat_Tidur_VIP||0)+(d.Tempat_Tidur_I||0)+(d.Tempat_Tidur_II||0)+(d.Tempat_Tidur_III||0)+(d.Tempat_Tidur_Khusus||0)),0)}</div></div>
            <div className="p-3 rounded-md bg-teal-50 border"><div className="text-xs text-teal-600">Total Hari Rawat</div><div className="text-lg font-semibold">{data.reduce((s,d)=>s+((d.Hari_Rawat_SVIP||0)+(d.Hari_Rawat_VIP||0)+(d.Hari_Rawat_I||0)+(d.Hari_Rawat_II||0)+(d.Hari_Rawat_III||0)),0)}</div></div>
            <div className="p-3 rounded-md bg-rose-50 border"><div className="text-xs text-rose-600">Total Porsi Makan Pasien</div><div className="text-lg font-semibold">{data.reduce((s,d)=>s+(d.Makanan_Pasien_jml_Porsi||0),0)}</div></div>
          </div>
          <div className="flex gap-2 mb-4 flex-wrap items-center">
            <div className="flex items-center gap-2">
              <Label htmlFor="filter-year">Tahun</Label>
              <Input id="filter-year" className="w-24" type="number" value={selectedYear} onChange={(e)=>setSelectedYear(parseInt(e.target.value)||new Date().getFullYear())} />
            </div>
            <div className="flex items-center gap-2">
              <Label htmlFor="filter-unit">Unit Kerja</Label>
              <Select value={selectedUnitName} onValueChange={(v)=>setSelectedUnitName(v as any)}>
                <SelectTrigger id="filter-unit" className="w-72">
                  <SelectValue placeholder="Pilih Unit Kerja" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Unit Kerja</SelectItem>
                  {unitKerjaList.map(uk => (
                    <SelectItem key={uk.id} value={uk.nama}>{uk.kode} - {uk.nama}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button variant="ghost" onClick={()=>{ setSelectedUnitName("all"); setSelectedYear(new Date().getFullYear()); }}>
              Reset
            </Button>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={()=>{ setEditingItem(null); form.reset({
                  Kode_UK: "",
                  Nama_Unit_Kerja: "",
                  tahun: new Date().getFullYear(),
                  Jenis: "Operatif",
                  Jml_jam_Praktek_Harian: 0,
                  Diklat_Jumlah_Siswa: 0,
                  Diklat_Lama_Hari: 0,
                  SDM_dokter: 0,
                  SDM_Perawat: 0,
                  SDM_Non: 0,
                  Listrik_kwh: 0,
                  Air_m3: 0,
                  Telepon_Freq_pakai_per_titik: 0,
                  Komputer_simrs_user: 0,
                  Tempat_Tidur_SVIP: 0,
                  Tempat_Tidur_VIP: 0,
                  Tempat_Tidur_I: 0,
                  Tempat_Tidur_II: 0,
                  Tempat_Tidur_III: 0,
                  Tempat_Tidur_Khusus: 0,
                  kamar_luas_svip: 0,
                  kamar_luas_vip: 0,
                  kamar_luas_i: 0,
                  kamar_luas_ii: 0,
                  kamar_luas_iii: 0,
                  Kunjungan_Pasien_Lama: 0,
                  Kunjungan_Pasien_Baru: 0,
                  Jumlah_Tindakan: 0,
                  Resep_Lembar_Resep: 0,
                  Hari_Rawat_SVIP: 0,
                  Hari_Rawat_VIP: 0,
                  Hari_Rawat_I: 0,
                  Hari_Rawat_II: 0,
                  Hari_Rawat_III: 0,
                  Cucian_kg_Cucian: 0,
                  Instrumen_Besar: 0,
                  Instrumen_Sedang: 0,
                  Instrumen_Kecil: 0,
                  Set_Pack_Besar: 0,
                  Set_Pack_Sedang: 0,
                  Set_Pack_Kecil: 0,
                  Makanan_Karyawan_jml_Porsi: 0,
                  Makanan_Pasien_jml_Porsi: 0,
                  jumlah_porsi_svip: 0,
                  jumlah_porsi_vip: 0,
                  jumlah_porsi_i: 0,
                  jumlah_porsi_ii: 0,
                  jumlah_porsi_iii: 0,
                }); }}>
                  <Pencil className="h-4 w-4 mr-2" />
                  Tambah Data
                </Button>
              </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editingItem ? "Edit Data Kegiatan" : "Tambah Data Kegiatan"}
                  </DialogTitle>
                  <DialogDescription>
                    {editingItem 
                      ? "Perbarui informasi data kegiatan" 
                      : "Tambahkan data kegiatan baru"
                    }
                  </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Pilih Unit Kerja -> auto isi Kode & Nama & Jenis */}
                      <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-4">
                        <FormItem>
                          <FormLabel>Pilih Unit Kerja</FormLabel>
                          <Select onValueChange={(namaUK)=>{
                            const uk = unitKerjaList.find(u=>u.nama===namaUK);
                            if (uk) {
                              form.setValue('Nama_Unit_Kerja', uk.nama);
                              form.setValue('Kode_UK', uk.kode);
                              // Peta jenis unit kerja (string) ke label enum form
                              const jenisLabel = validateJenisLabel(uk.jenis || 'Non Layanan');
                              form.setValue('Jenis', jenisLabel as "Rawat Jalan" | "Rawat Inap" | "Operatif" | "Non Layanan");
                            }
                          }}>
                            <SelectTrigger>
                              <SelectValue placeholder="Cari/Pilih Unit Kerja" />
                            </SelectTrigger>
                            <SelectContent>
                              {unitKerjaList.map(uk=>(
                                <SelectItem key={uk.id} value={uk.nama}>{uk.kode} - {uk.nama}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormItem>
                      </div>
                      <FormField
                        control={form.control}
                        name="Kode_UK"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Kode UK</FormLabel>
                            <FormControl>
                              <Input placeholder="Masukkan kode UK" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="Nama_Unit_Kerja"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nama Unit Kerja</FormLabel>
                            <FormControl>
                              <Input placeholder="Masukkan nama unit kerja" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="tahun"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Tahun</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                placeholder="Masukkan tahun"
                                {...field}
                                onChange={(e) => field.onChange(parseInt(e.target.value))}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="Jenis"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Jenis Unit</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Pilih jenis unit" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="Rawat Jalan">Rawat Jalan</SelectItem>
                                <SelectItem value="Rawat Inap">Rawat Inap</SelectItem>
                                <SelectItem value="Operatif">Operatif</SelectItem>
                                <SelectItem value="Non Layanan">Non Layanan</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="border-t pt-4">
                      <h4 className="text-sm font-medium mb-3">Utilisasi Pegawai</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="Jml_jam_Praktek_Harian"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Jam Praktek Harian</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  placeholder="0"
                                  {...field}
                                  onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="Diklat_Jumlah_Siswa"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Diklat Jumlah Siswa</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  placeholder="0"
                                  {...field}
                                  onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="Diklat_Lama_Hari"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Diklat Lama Hari</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  placeholder="0"
                                  {...field}
                                  onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="SDM_dokter"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>SDM Dokter</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  placeholder="0"
                                  {...field}
                                  onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="SDM_Perawat"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>SDM Perawat</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  placeholder="0"
                                  {...field}
                                  onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="SDM_Non"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>SDM Non Medis</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  placeholder="0"
                                  {...field}
                                  onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                  <div className="border-t pt-4">
                    <h4 className="text-sm font-medium mb-3">Sarana dan Prasarana</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {[
                        ["Tempat_Tidur_SVIP","Tempat Tidur SVIP"],
                        ["Tempat_Tidur_VIP","Tempat Tidur VIP"],
                        ["Tempat_Tidur_I","Tempat Tidur I"],
                        ["Tempat_Tidur_II","Tempat Tidur II"],
                        ["Tempat_Tidur_III","Tempat Tidur III"],
                        ["Tempat_Tidur_Khusus","Tempat Tidur Khusus"],
                        ["kamar_luas_svip","Luas Kamar SVIP (m²)"],
                        ["kamar_luas_vip","Luas Kamar VIP (m²)"],
                        ["kamar_luas_i","Luas Kamar I (m²)"],
                        ["kamar_luas_ii","Luas Kamar II (m²)"],
                        ["kamar_luas_iii","Luas Kamar III (m²)"]
                      ].map(([name,label]) => (
                        <FormField
                          key={name as string}
                          control={form.control}
                          name={name as any}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{label as string}</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  placeholder="0" 
                                  {...field}
                                  onChange={(e)=>field.onChange(parseFloat(e.target.value)||0)}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <h4 className="text-sm font-medium mb-3">Penunjang</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {[
                        ["Cucian_kg_Cucian","Cucian (kg)"],
                        ["Instrumen_Besar","Instrumen Besar"],
                        ["Instrumen_Sedang","Instrumen Sedang"],
                        ["Instrumen_Kecil","Instrumen Kecil"],
                        ["Set_Pack_Besar","Set Pack Besar"],
                        ["Set_Pack_Sedang","Set Pack Sedang"],
                        ["Set_Pack_Kecil","Set Pack Kecil"],
                        ["Makanan_Karyawan_jml_Porsi","Makanan Karyawan (porsi)"],
                        ["Makanan_Pasien_jml_Porsi","Makanan Pasien (porsi)"],
                        ["jumlah_porsi_svip","Jumlah Porsi SVIP"],
                        ["jumlah_porsi_vip","Jumlah Porsi VIP"],
                        ["jumlah_porsi_i","Jumlah Porsi I"],
                        ["jumlah_porsi_ii","Jumlah Porsi II"],
                        ["jumlah_porsi_iii","Jumlah Porsi III"],
                        ["Resep_Lembar_Resep","Resep (lembar)"],
                        ["Hari_Rawat_SVIP","Hari Rawat SVIP"],
                        ["Hari_Rawat_VIP","Hari Rawat VIP"],
                        ["Hari_Rawat_I","Hari Rawat I"],
                        ["Hari_Rawat_II","Hari Rawat II"],
                        ["Hari_Rawat_III","Hari Rawat III"],
                      ].map(([name,label]) => (
                        <FormField
                          key={name as string}
                          control={form.control}
                          name={name as any}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{label as string}</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  placeholder="0" 
                                  {...field}
                                  onChange={(e)=>field.onChange(parseFloat(e.target.value)||0)}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      ))}
                      </div>
                    </div>

                    <div className="border-t pt-4">
                      <h4 className="text-sm font-medium mb-3">Utilisasi Daya</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="Listrik_kwh"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Listrik (kWh)</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  placeholder="0"
                                  {...field}
                                  onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="Air_m3"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Air (m³)</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  placeholder="0"
                                  {...field}
                                  onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="Telepon_Freq_pakai_per_titik"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Telepon (Frekuensi per Titik)</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  placeholder="0"
                                  {...field}
                                  onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="Komputer_simrs_user"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Komputer SIMRS (User)</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  placeholder="0"
                                  {...field}
                                  onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    <div className="border-t pt-4">
                      <h4 className="text-sm font-medium mb-3">Kunjungan & Pelayanan</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="Kunjungan_Pasien_Lama"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Kunjungan Pasien Lama</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  placeholder="0"
                                  {...field}
                                  onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="Kunjungan_Pasien_Baru"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Kunjungan Pasien Baru</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  placeholder="0"
                                  {...field}
                                  onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="Jumlah_Tindakan"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Jumlah Tindakan</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  placeholder="0"
                                  {...field}
                                  onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={handleDialogClose}>
                        Batal
                      </Button>
                      <Button type="submit" disabled={loading}>
                        {loading ? "Menyimpan..." : editingItem ? "Perbarui" : "Simpan"}
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
            <Button variant="outline" onClick={loadData} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Button variant="outline" onClick={handleDownloadTemplate}>
              <Download className="h-4 w-4 mr-2" /> Unduh Template
            </Button>
            <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
              <Upload className="h-4 w-4 mr-2" /> Import Data
            </Button>
            <input ref={fileInputRef} type="file" accept=".csv,.xlsx,.xls" onChange={handleImportData} className="hidden" />
            <Button
              variant="outline"
              onClick={() => {
                void handleDownloadReport();
              }}
            >
              <FileText className="h-4 w-4 mr-2" /> Unduh Laporan
            </Button>
          </div>

          <div className="border rounded-md overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Kode UK</TableHead>
                  <TableHead>Unit Kerja</TableHead>
                  <TableHead>Tahun</TableHead>
                  <TableHead className="min-w-[220px]">Kepegawaian</TableHead>
                  <TableHead className="min-w-[200px]">Daya</TableHead>
                  <TableHead className="min-w-[260px]">Sarana & Prasarana</TableHead>
                  <TableHead className="min-w-[260px]">Kunjungan Pasien</TableHead>
                  <TableHead className="min-w-[280px]">Penunjang</TableHead>
                  <TableHead>Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.Kode_UK}</TableCell>
                    <TableCell>{item.Nama_Unit_Kerja}</TableCell>
                    <TableCell>{item.tahun}</TableCell>
                    {/* Kepegawaian */}
                    <TableCell>
                      <div className="text-sm space-y-1">
                        <div className="flex items-center gap-2 text-sky-700"><Users className="h-3 w-3" /> Dokter: {item.SDM_dokter || 0}</div>
                        <div className="flex items-center gap-2 text-sky-700"><Users className="h-3 w-3" /> Perawat: {item.SDM_Perawat || 0}</div>
                        <div className="flex items-center gap-2 text-sky-700"><Users className="h-3 w-3" /> Non: {item.SDM_Non || 0}</div>
                        <div className="flex items-center gap-2 text-sky-900"><Users className="h-3 w-3" /> Jumlah SDM: {item.Jumlah_SDM || 0}</div>
                        <div className="flex items-center gap-2 text-indigo-700"><Users className="h-3 w-3" /> Diklat Siswa: {item.Diklat_Jumlah_Siswa || 0}</div>
                        <div className="flex items-center gap-2 text-indigo-700"><Users className="h-3 w-3" /> Diklat Hari: {item.Diklat_Lama_Hari || 0}</div>
                        <div className="flex items-center gap-2 text-indigo-900"><Users className="h-3 w-3" /> Total Diklat: {item.Total_Diklat || 0}</div>
                        <div className="flex items-center gap-2 text-gray-700"><Users className="h-3 w-3" /> Jam Praktek: {item.Jml_jam_Praktek_Harian || 0}</div>
                      </div>
                    </TableCell>
                    {/* Daya */}
                    <TableCell>
                      <div className="text-sm space-y-1">
                        <div className="flex items-center gap-2 text-orange-700"><Zap className="h-3 w-3" /> Listrik: {item.Listrik_kwh || 0}</div>
                        <div className="flex items-center gap-2 text-cyan-700"><Zap className="h-3 w-3" /> Air: {item.Air_m3 || 0}</div>
                        <div className="flex items-center gap-2 text-amber-700"><Zap className="h-3 w-3" /> Telepon: {item.Telepon_Freq_pakai_per_titik || 0}</div>
                        <div className="flex items-center gap-2 text-slate-700"><Zap className="h-3 w-3" /> Komputer SIMRS: {item.Komputer_simrs_user || 0}</div>
                      </div>
                    </TableCell>
                    {/* Sarana & Prasarana */}
                    <TableCell>
                      <div className="text-sm grid grid-cols-2 gap-x-3 gap-y-1">
                        <div className="flex items-center gap-2 text-emerald-700"><Bed className="h-3 w-3" /> SVIP: {item.Tempat_Tidur_SVIP || 0}</div>
                        <div className="flex items-center gap-2 text-emerald-700"><Bed className="h-3 w-3" /> VIP: {item.Tempat_Tidur_VIP || 0}</div>
                        <div className="flex items-center gap-2 text-emerald-700"><Bed className="h-3 w-3" /> I: {item.Tempat_Tidur_I || 0}</div>
                        <div className="flex items-center gap-2 text-emerald-700"><Bed className="h-3 w-3" /> II: {item.Tempat_Tidur_II || 0}</div>
                        <div className="flex items-center gap-2 text-emerald-700"><Bed className="h-3 w-3" /> III: {item.Tempat_Tidur_III || 0}</div>
                        <div className="flex items-center gap-2 text-emerald-700"><Bed className="h-3 w-3" /> Khusus: {item.Tempat_Tidur_Khusus || 0}</div>
                        <div className="text-xs col-span-2 text-muted-foreground">Luas (m²): SVIP {(item as any).kamar_luas_svip || 0} · VIP {(item as any).kamar_luas_vip || 0} · I {(item as any).kamar_luas_i || 0} · II {(item as any).kamar_luas_ii || 0} · III {(item as any).kamar_luas_iii || 0}</div>
                      </div>
                    </TableCell>
                    {/* Kunjungan Pasien */}
                    <TableCell>
                      <div className="text-sm space-y-1">
                        <div className="flex items-center gap-2 text-blue-700"><Stethoscope className="h-3 w-3" /> Lama: {item.Kunjungan_Pasien_Lama || 0}</div>
                        <div className="flex items-center gap-2 text-blue-700"><Stethoscope className="h-3 w-3" /> Baru: {item.Kunjungan_Pasien_Baru || 0}</div>
                        <div className="flex items-center gap-2 text-blue-900"><Stethoscope className="h-3 w-3" /> Total: {item.Total_Kunjungan_Pasien || 0}</div>
                        <div className="flex items-center gap-2 text-fuchsia-700"><Stethoscope className="h-3 w-3" /> Resep: {item.Resep_Lembar_Resep || 0}</div>
                        <div className="flex items-center gap-2 text-teal-700"><Bed className="h-3 w-3" /> HR SVIP: {item.Hari_Rawat_SVIP || 0}</div>
                        <div className="flex items-center gap-2 text-teal-700"><Bed className="h-3 w-3" /> HR VIP: {item.Hari_Rawat_VIP || 0}</div>
                        <div className="flex items-center gap-2 text-teal-700"><Bed className="h-3 w-3" /> HR I: {item.Hari_Rawat_I || 0}</div>
                        <div className="flex items-center gap-2 text-teal-700"><Bed className="h-3 w-3" /> HR II: {item.Hari_Rawat_II || 0}</div>
                        <div className="flex items-center gap-2 text-teal-700"><Bed className="h-3 w-3" /> HR III: {item.Hari_Rawat_III || 0}</div>
                        <div className="flex items-center gap-2 text-teal-900"><Bed className="h-3 w-3" /> Jumlah HR: {item.Jumlah_Hari_Rawat || 0}</div>
                      </div>
                    </TableCell>
                    {/* Penunjang */}
                    <TableCell>
                      <div className="text-sm grid grid-cols-2 gap-x-3 gap-y-1">
                        <div className="flex items-center gap-2 text-rose-700"><Utensils className="h-3 w-3" /> Cucian: {item.Cucian_kg_Cucian || 0} kg</div>
                        <div className="flex items-center gap-2 text-rose-700"><Utensils className="h-3 w-3" /> Instr. Besar: {item.Instrumen_Besar || 0}</div>
                        <div className="flex items-center gap-2 text-rose-700"><Utensils className="h-3 w-3" /> Instr. Sedang: {item.Instrumen_Sedang || 0}</div>
                        <div className="flex items-center gap-2 text-rose-700"><Utensils className="h-3 w-3" /> Instr. Kecil: {item.Instrumen_Kecil || 0}</div>
                        <div className="flex items-center gap-2 text-rose-700"><Utensils className="h-3 w-3" /> Pack Besar: {item.Set_Pack_Besar || 0}</div>
                        <div className="flex items-center gap-2 text-rose-700"><Utensils className="h-3 w-3" /> Pack Sedang: {item.Set_Pack_Sedang || 0}</div>
                        <div className="flex items-center gap-2 text-rose-700"><Utensils className="h-3 w-3" /> Pack Kecil: {item.Set_Pack_Kecil || 0}</div>
                        <div className="flex items-center gap-2 text-rose-700"><Utensils className="h-3 w-3" /> Porsi Karyawan: {item.Makanan_Karyawan_jml_Porsi || 0}</div>
                        <div className="flex items-center gap-2 text-rose-700"><Utensils className="h-3 w-3" /> Porsi Pasien: {item.Makanan_Pasien_jml_Porsi || 0}</div>
                        <div className="text-xs col-span-2 text-muted-foreground">Porsi: SVIP {(item as any).jumlah_porsi_svip || 0} · VIP {(item as any).jumlah_porsi_vip || 0} · I {(item as any).jumlah_porsi_i || 0} · II {(item as any).jumlah_porsi_ii || 0} · III {(item as any).jumlah_porsi_iii || 0}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleView(item)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="edit" onClick={() => handleEdit(item)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => handleDelete(item.id!)}>
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

      {/* View Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={handleViewDialogClose}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detail Data Kegiatan</DialogTitle>
            <DialogDescription>
              Informasi lengkap data kegiatan
            </DialogDescription>
          </DialogHeader>
          {viewingItem && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-2">Informasi Dasar</h4>
                  <div className="space-y-2 text-sm">
                    <div><strong>Kode UK:</strong> {viewingItem.Kode_UK}</div>
                    <div><strong>Unit Kerja:</strong> {viewingItem.Nama_Unit_Kerja}</div>
                    <div><strong>Tahun:</strong> {viewingItem.tahun}</div>
                    <div><strong>Jenis:</strong> 
                      <Badge variant={getJenisBadgeVariant(viewingItem.Jenis)} className="ml-2">
                        {viewingItem.Jenis || "Non Layanan"}
                      </Badge>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Utilisasi Pegawai</h4>
                  <div className="space-y-2 text-sm">
                    <div><strong>Jam Praktek Harian:</strong> {viewingItem.Jml_jam_Praktek_Harian || 0}</div>
                    <div><strong>SDM Dokter:</strong> {viewingItem.SDM_dokter || 0}</div>
                    <div><strong>SDM Perawat:</strong> {viewingItem.SDM_Perawat || 0}</div>
                    <div><strong>SDM Non Medis:</strong> {viewingItem.SDM_Non || 0}</div>
                    <div><strong>Total SDM:</strong> {viewingItem.Jumlah_SDM || 0}</div>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Utilisasi Daya</h4>
                  <div className="space-y-2 text-sm">
                    <div><strong>Listrik:</strong> {viewingItem.Listrik_kwh || 0} kWh</div>
                    <div><strong>Air:</strong> {viewingItem.Air_m3 || 0} m³</div>
                    <div><strong>Telepon:</strong> {viewingItem.Telepon_Freq_pakai_per_titik || 0} frekuensi</div>
                    <div><strong>Komputer SIMRS:</strong> {viewingItem.Komputer_simrs_user || 0} user</div>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Kunjungan & Pelayanan</h4>
                  <div className="space-y-2 text-sm">
                    <div><strong>Pasien Lama:</strong> {viewingItem.Kunjungan_Pasien_Lama || 0}</div>
                    <div><strong>Pasien Baru:</strong> {viewingItem.Kunjungan_Pasien_Baru || 0}</div>
                    <div><strong>Total Kunjungan:</strong> {viewingItem.Total_Kunjungan_Pasien || 0}</div>
                    <div><strong>Jumlah Tindakan:</strong> {viewingItem.Jumlah_Tindakan || 0}</div>
                  </div>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={handleViewDialogClose}>Tutup</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}