"use client";

import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import Papa from "papaparse";
import { saveAs } from "file-saver";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Pencil, Trash2, Upload, Download, FileText, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface DataKegiatan {
  id: number;
  Kode_UK: string | null;
  Nama_Unit_Kerja: string | null;
  unit_kerja?: {
    kode: string;
    nama: string;
  };
  // Utilisasi Bahan Medis
  Resep_Lembar_Resep: number | null;
  // Utilisasi Bahan Non Medis
  Cucian_kg_Cucian: number | null;
  Makanan_Karyawan_jml_Porsi: number | null;
  Makanan_Pasien_jml_Porsi: number | null;
  // Utilisasi Penunjang (Set dan Instrumen)
  Instrumen_Besar: number | null;
  Instrumen_Sedang: number | null;
  Instrumen_Kecil: number | null;
  Set_Pack_Besar: number | null;
  Set_Pack_Sedang: number | null;
  Set_Pack_Kecil: number | null;
  // Utilisasi Pegawai
  SDM_Dr: number | null;
  SDM_Prwt: number | null;
  SDM_Non: number | null;
  Jml_jam_Praktek_per_hari: number | null;
  // Utilisasi Daya
  Listrik_kwh: number | null;
  Air_m3: number | null;
  Telepon_Freq_pakai_per_titik: number | null;
  // Utilitas Tempat Tidur
  Tempat_Tidur_SVIP: number | null;
  Tempat_Tidur_VIP: number | null;
  Tempat_Tidur_I: number | null;
  Tempat_Tidur_II: number | null;
  Tempat_Tidur_III: number | null;
  Tempat_Tidur_Khusus: number | null;
  // Utilitas Perawatan
  Hari_Rawat_SVIP: number | null;
  Hari_Rawat_VIP: number | null;
  Hari_Rawat_Utama: number | null;
  Hari_Rawat_I: number | null;
  Hari_Rawat_II: number | null;
  Hari_Rawat_III: number | null;
  Hari_Rawat_Khusus: number | null;
  // Utilitas Kunjungan
  Kunjungan_jml_pasien_Lama: number | null;
  Kunjungan_jml_pasien_Baru: number | null;
  Kunjungan_jml_pasien_Total: number | null;
  // Utilitas Tindakan
  Tindakan_Pemeriksaan_jml_Tindakan: number | null;
  // Utilisasi Diklat
  Pelayanan_Pendidikan_jml_Siswa: number | null;
  Pelayanan_Pendidikan_Total: number | null;
  // Utilisasi Jaringan
  Komputer_SIMRS_jml_User: number | null;
  created_at?: string;
  updated_at?: string;
}

interface UnitKerja {
  id: string;
  kode: string;
  nama: string;
  kategori: string;
}

// Schema validation for all fields
const formSchema = z.object({
  Kode_UK: z.string().optional().nullable(),
  // Utilisasi Bahan Medis
  Resep_Lembar_Resep: z.coerce.number().nullable().optional(),
  // Utilisasi Bahan Non Medis
  Cucian_kg_Cucian: z.coerce.number().nullable().optional(),
  Makanan_Karyawan_jml_Porsi: z.coerce.number().nullable().optional(),
  Makanan_Pasien_jml_Porsi: z.coerce.number().nullable().optional(),
  // Utilisasi Penunjang (Set dan Instrumen)
  Instrumen_Besar: z.coerce.number().nullable().optional(),
  Instrumen_Sedang: z.coerce.number().nullable().optional(),
  Instrumen_Kecil: z.coerce.number().nullable().optional(),
  Set_Pack_Besar: z.coerce.number().nullable().optional(),
  Set_Pack_Sedang: z.coerce.number().nullable().optional(),
  Set_Pack_Kecil: z.coerce.number().nullable().optional(),
  // Utilisasi Pegawai
  SDM_Dr: z.coerce.number().nullable().optional(),
  SDM_Prwt: z.coerce.number().nullable().optional(),
  SDM_Non: z.coerce.number().nullable().optional(),
  Jml_jam_Praktek_per_hari: z.coerce.number().nullable().optional(),
  // Utilisasi Daya
  Listrik_kwh: z.coerce.number().nullable().optional(),
  Air_m3: z.coerce.number().nullable().optional(),
  Telepon_Freq_pakai_per_titik: z.coerce.number().nullable().optional(),
  // Utilitas Tempat Tidur
  Tempat_Tidur_SVIP: z.coerce.number().nullable().optional(),
  Tempat_Tidur_VIP: z.coerce.number().nullable().optional(),
  Tempat_Tidur_I: z.coerce.number().nullable().optional(),
  Tempat_Tidur_II: z.coerce.number().nullable().optional(),
  Tempat_Tidur_III: z.coerce.number().nullable().optional(),
  Tempat_Tidur_Khusus: z.coerce.number().nullable().optional(),
  // Utilitas Perawatan
  Hari_Rawat_SVIP: z.coerce.number().nullable().optional(),
  Hari_Rawat_VIP: z.coerce.number().nullable().optional(),
  Hari_Rawat_Utama: z.coerce.number().nullable().optional(),
  Hari_Rawat_I: z.coerce.number().nullable().optional(),
  Hari_Rawat_II: z.coerce.number().nullable().optional(),
  Hari_Rawat_III: z.coerce.number().nullable().optional(),
  Hari_Rawat_Khusus: z.coerce.number().nullable().optional(),
  // Utilitas Kunjungan
  Kunjungan_jml_pasien_Lama: z.coerce.number().nullable().optional(),
  Kunjungan_jml_pasien_Baru: z.coerce.number().nullable().optional(),
  // Utilitas Tindakan
  Tindakan_Pemeriksaan_jml_Tindakan: z.coerce.number().nullable().optional(),
  // Utilisasi Diklat
  Pelayanan_Pendidikan_jml_Siswa: z.coerce.number().nullable().optional(),
  // Utilisasi Jaringan
  Komputer_SIMRS_jml_User: z.coerce.number().nullable().optional(),
});

const DataKegiatanFormTable: React.FC = () => {
  const [dataKegiatanList, setDataKegiatanList] = useState<DataKegiatan[]>([]);
  const [unitKerjaList, setUnitKerjaList] = useState<UnitKerja[]>([]);
  const [editingData, setEditingData] = useState<DataKegiatan | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [reportFilter, setReportFilter] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      Kode_UK: "",
      // Utilisasi Bahan Medis
      Resep_Lembar_Resep: null,
      // Utilisasi Bahan Non Medis
      Cucian_kg_Cucian: null,
      Makanan_Karyawan_jml_Porsi: null,
      Makanan_Pasien_jml_Porsi: null,
      // Utilisasi Penunjang (Set dan Instrumen)
      Instrumen_Besar: null,
      Instrumen_Sedang: null,
      Instrumen_Kecil: null,
      Set_Pack_Besar: null,
      Set_Pack_Sedang: null,
      Set_Pack_Kecil: null,
      // Utilisasi Pegawai
      SDM_Dr: null,
      SDM_Prwt: null,
      SDM_Non: null,
      Jml_jam_Praktek_per_hari: null,
      // Utilisasi Daya
      Listrik_kwh: null,
      Air_m3: null,
      Telepon_Freq_pakai_per_titik: null,
      // Utilitas Tempat Tidur
      Tempat_Tidur_SVIP: null,
      Tempat_Tidur_VIP: null,
      Tempat_Tidur_I: null,
      Tempat_Tidur_II: null,
      Tempat_Tidur_III: null,
      Tempat_Tidur_Khusus: null,
      // Utilitas Perawatan
      Hari_Rawat_SVIP: null,
      Hari_Rawat_VIP: null,
      Hari_Rawat_Utama: null,
      Hari_Rawat_I: null,
      Hari_Rawat_II: null,
      Hari_Rawat_III: null,
      Hari_Rawat_Khusus: null,
      // Utilitas Kunjungan
      Kunjungan_jml_pasien_Lama: null,
      Kunjungan_jml_pasien_Baru: null,
      // Utilitas Tindakan
      Tindakan_Pemeriksaan_jml_Tindakan: null,
      // Utilisasi Diklat
      Pelayanan_Pendidikan_jml_Siswa: null,
      // Utilisasi Jaringan
      Komputer_SIMRS_jml_User: null,
    },
  });

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUserId(session.user.id);
        fetchDataKegiatan(session.user.id);
        fetchUnitKerja(session.user.id);
      }
    };
    
    fetchUser();
  }, []);

  useEffect(() => {
    if (editingData) {
      form.reset({
        Kode_UK: editingData.Kode_UK || "",
        // Utilisasi Bahan Medis
        Resep_Lembar_Resep: editingData.Resep_Lembar_Resep,
        // Utilisasi Bahan Non Medis
        Cucian_kg_Cucian: editingData.Cucian_kg_Cucian,
        Makanan_Karyawan_jml_Porsi: editingData.Makanan_Karyawan_jml_Porsi,
        Makanan_Pasien_jml_Porsi: editingData.Makanan_Pasien_jml_Porsi,
        // Utilisasi Penunjang (Set dan Instrumen)
        Instrumen_Besar: editingData.Instrumen_Besar,
        Instrumen_Sedang: editingData.Instrumen_Sedang,
        Instrumen_Kecil: editingData.Instrumen_Kecil,
        Set_Pack_Besar: editingData.Set_Pack_Besar,
        Set_Pack_Sedang: editingData.Set_Pack_Sedang,
        Set_Pack_Kecil: editingData.Set_Pack_Kecil,
        // Utilisasi Pegawai
        SDM_Dr: editingData.SDM_Dr,
        SDM_Prwt: editingData.SDM_Prwt,
        SDM_Non: editingData.SDM_Non,
        Jml_jam_Praktek_per_hari: editingData.Jml_jam_Praktek_per_hari,
        // Utilisasi Daya
        Listrik_kwh: editingData.Listrik_kwh,
        Air_m3: editingData.Air_m3,
        Telepon_Freq_pakai_per_titik: editingData.Telepon_Freq_pakai_per_titik,
        // Utilitas Tempat Tidur
        Tempat_Tidur_SVIP: editingData.Tempat_Tidur_SVIP,
        Tempat_Tidur_VIP: editingData.Tempat_Tidur_VIP,
        Tempat_Tidur_I: editingData.Tempat_Tidur_I,
        Tempat_Tidur_II: editingData.Tempat_Tidur_II,
        Tempat_Tidur_III: editingData.Tempat_Tidur_III,
        Tempat_Tidur_Khusus: editingData.Tempat_Tidur_Khusus,
        // Utilitas Perawatan
        Hari_Rawat_SVIP: editingData.Hari_Rawat_SVIP,
        Hari_Rawat_VIP: editingData.Hari_Rawat_VIP,
        Hari_Rawat_Utama: editingData.Hari_Rawat_Utama,
        Hari_Rawat_I: editingData.Hari_Rawat_I,
        Hari_Rawat_II: editingData.Hari_Rawat_II,
        Hari_Rawat_III: editingData.Hari_Rawat_III,
        Hari_Rawat_Khusus: editingData.Hari_Rawat_Khusus,
        // Utilitas Kunjungan
        Kunjungan_jml_pasien_Lama: editingData.Kunjungan_jml_pasien_Lama,
        Kunjungan_jml_pasien_Baru: editingData.Kunjungan_jml_pasien_Baru,
        // Utilitas Tindakan
        Tindakan_Pemeriksaan_jml_Tindakan: editingData.Tindakan_Pemeriksaan_jml_Tindakan,
        // Utilisasi Diklat
        Pelayanan_Pendidikan_jml_Siswa: editingData.Pelayanan_Pendidikan_jml_Siswa,
        // Utilisasi Jaringan
        Komputer_SIMRS_jml_User: editingData.Komputer_SIMRS_jml_User,
      });
    } else {
      form.reset({
        Kode_UK: "",
        // Utilisasi Bahan Medis
        Resep_Lembar_Resep: null,
        // Utilisasi Bahan Non Medis
        Cucian_kg_Cucian: null,
        Makanan_Karyawan_jml_Porsi: null,
        Makanan_Pasien_jml_Porsi: null,
        // Utilisasi Penunjang (Set dan Instrumen)
        Instrumen_Besar: null,
        Instrumen_Sedang: null,
        Instrumen_Kecil: null,
        Set_Pack_Besar: null,
        Set_Pack_Sedang: null,
        Set_Pack_Kecil: null,
        // Utilisasi Pegawai
        SDM_Dr: null,
        SDM_Prwt: null,
        SDM_Non: null,
        Jml_jam_Praktek_per_hari: null,
        // Utilisasi Daya
        Listrik_kwh: null,
        Air_m3: null,
        Telepon_Freq_pakai_per_titik: null,
        // Utilitas Tempat Tidur
        Tempat_Tidur_SVIP: null,
        Tempat_Tidur_VIP: null,
        Tempat_Tidur_I: null,
        Tempat_Tidur_II: null,
        Tempat_Tidur_III: null,
        Tempat_Tidur_Khusus: null,
        // Utilitas Perawatan
        Hari_Rawat_SVIP: null,
        Hari_Rawat_VIP: null,
        Hari_Rawat_Utama: null,
        Hari_Rawat_I: null,
        Hari_Rawat_II: null,
        Hari_Rawat_III: null,
        Hari_Rawat_Khusus: null,
        // Utilitas Kunjungan
        Kunjungan_jml_pasien_Lama: null,
        Kunjungan_jml_pasien_Baru: null,
        // Utilitas Tindakan
        Tindakan_Pemeriksaan_jml_Tindakan: null,
        // Utilisasi Diklat
        Pelayanan_Pendidikan_jml_Siswa: null,
        // Utilisasi Jaringan
        Komputer_SIMRS_jml_User: null,
      });
    }
  }, [editingData, form]);

  const fetchDataKegiatan = async (currentUserId: string) => {
    setLoading(true);
    const { data, error } = await supabase
      .from('Data_Kegiatan')
      .select('*, unit_kerja:Kode_UK!inner(kode, nama)')
      .eq('unit_kerja.user_id', currentUserId)
      .order('created_at', { ascending: false });

    if (error) {
      toast.error("Gagal memuat data kegiatan.");
      console.error(error);
    } else {
      setDataKegiatanList(data || []);
    }
    setLoading(false);
  };

  const fetchUnitKerja = async (currentUserId: string) => {
    const { data, error } = await supabase
      .from('unit_kerja')
      .select('id, kode, nama, kategori')
      .eq('user_id', currentUserId)
      .order('nama', { ascending: true });

    if (error) {
      toast.error("Gagal memuat data unit kerja.");
      console.error(error);
    } else {
      setUnitKerjaList(data || []);
    }
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!userId) {
      toast.error("User tidak ditemukan. Silakan login kembali.");
      return;
    }

    try {
      // Calculate total fields
      const kunjunganTotal = (values.Kunjungan_jml_pasien_Lama || 0) + (values.Kunjungan_jml_pasien_Baru || 0);
      const diklatTotal = (values.Pelayanan_Pendidikan_jml_Siswa || 0) * (values.Jml_jam_Praktek_per_hari || 0);

      const dataToSubmit = {
        ...values,
        Kunjungan_jml_pasien_Total: kunjunganTotal,
        Pelayanan_Pendidikan_Total: diklatTotal,
      };

      if (editingData) {
        const { error } = await supabase
          .from('Data_Kegiatan')
          .update(dataToSubmit)
          .eq('id', editingData.id);

        if (error) throw error;
        toast.success("Data Kegiatan berhasil diperbarui.");
      } else {
        const { error } = await supabase
          .from('Data_Kegiatan')
          .insert([dataToSubmit]);

        if (error) throw error;
        toast.success("Data Kegiatan berhasil ditambahkan.");
      }
      if (userId) await fetchDataKegiatan(userId);
      setEditingData(null);
      setIsDialogOpen(false);
      form.reset();
    } catch (error: any) {
      console.error(error);
      toast.error(`Terjadi kesalahan saat menyimpan data: ${error.message}`);
    }
  };

  const handleEdit = (data: DataKegiatan) => {
    setEditingData(data);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: number) => {
    try {
      const { error } = await supabase
        .from('Data_Kegiatan')
        .delete()
        .eq('id', id);

      if (error) throw error;
      if (userId) await fetchDataKegiatan(userId);
      toast.success("Data Kegiatan berhasil dihapus.");
    } catch (error: any) {
      console.error(error);
      toast.error(`Terjadi kesalahan saat menghapus data: ${error.message}`);
    }
  };

  const handleImportData = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!userId) {
      toast.error("User tidak ditemukan. Silakan login kembali.");
      return;
    }

    const file = event.target.files?.[0];
    if (file) {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: async (results: Papa.ParseResult<any>) => {
          try {
            const importedData: any[] = [];
            const unitKerjaMap = new Map(unitKerjaList.map(uk => [uk.kode, uk.kode]));
            
            for (const row of results.data) {
              // Find unit kerja by kode if provided
              let kodeUK = null;
              const unitKerjaKode = row["Kode Unit Kerja"];
              if (unitKerjaKode) {
                kodeUK = unitKerjaMap.get(unitKerjaKode) || null;
                if (!kodeUK) {
                  toast.warning(`Kode Unit Kerja '${unitKerjaKode}' tidak ditemukan, melewatkan data`);
                  continue;
                }
              }
              
              // Calculate totals
              const kunjunganTotal = (parseInt(row["Kunjungan_jml_pasien_Lama"]) || 0) + 
                                    (parseInt(row["Kunjungan_jml_pasien_Baru"]) || 0);
              const diklatTotal = (parseInt(row["Pelayanan_Pendidikan_jml_Siswa"]) || 0) * 
                                 (parseInt(row["Jml_jam_Praktek_per_hari"]) || 0);
              
              importedData.push({
                Kode_UK: kodeUK,
                // Utilisasi Bahan Medis
                Resep_Lembar_Resep: parseInt(row["Resep_Lembar_Resep"]) || null,
                // Utilisasi Bahan Non Medis
                Cucian_kg_Cucian: parseFloat(row["Cucian_kg_Cucian"]) || null,
                Makanan_Karyawan_jml_Porsi: parseInt(row["Makanan_Karyawan_jml_Porsi"]) || null,
                Makanan_Pasien_jml_Porsi: parseInt(row["Makanan_Pasien_jml_Porsi"]) || null,
                // Utilisasi Penunjang (Set dan Instrumen)
                Instrumen_Besar: parseInt(row["Instrumen_Besar"]) || null,
                Instrumen_Sedang: parseInt(row["Instrumen_Sedang"]) || null,
                Instrumen_Kecil: parseInt(row["Instrumen_Kecil"]) || null,
                Set_Pack_Besar: parseInt(row["Set_Pack_Besar"]) || null,
                Set_Pack_Sedang: parseInt(row["Set_Pack_Sedang"]) || null,
                Set_Pack_Kecil: parseInt(row["Set_Pack_Kecil"]) || null,
                // Utilisasi Pegawai
                SDM_Dr: parseInt(row["SDM_Dr"]) || null,
                SDM_Prwt: parseInt(row["SDM_Prwt"]) || null,
                SDM_Non: parseInt(row["SDM_Non"]) || null,
                Jml_jam_Praktek_per_hari: parseInt(row["Jml_jam_Praktek_per_hari"]) || null,
                // Utilisasi Daya
                Listrik_kwh: parseFloat(row["Listrik_kwh"]) || null,
                Air_m3: parseFloat(row["Air_m3"]) || null,
                Telepon_Freq_pakai_per_titik: parseInt(row["Telepon_Freq_pakai_per_titik"]) || null,
                // Utilitas Tempat Tidur
                Tempat_Tidur_SVIP: parseInt(row["Tempat_Tidur_SVIP"]) || null,
                Tempat_Tidur_VIP: parseInt(row["Tempat_Tidur_VIP"]) || null,
                Tempat_Tidur_I: parseInt(row["Tempat_Tidur_I"]) || null,
                Tempat_Tidur_II: parseInt(row["Tempat_Tidur_II"]) || null,
                Tempat_Tidur_III: parseInt(row["Tempat_Tidur_III"]) || null,
                Tempat_Tidur_Khusus: parseInt(row["Tempat_Tidur_Khusus"]) || null,
                // Utilitas Perawatan
                Hari_Rawat_SVIP: parseInt(row["Hari_Rawat_SVIP"]) || null,
                Hari_Rawat_VIP: parseInt(row["Hari_Rawat_VIP"]) || null,
                Hari_Rawat_Utama: parseInt(row["Hari_Rawat_Utama"]) || null,
                Hari_Rawat_I: parseInt(row["Hari_Rawat_I"]) || null,
                Hari_Rawat_II: parseInt(row["Hari_Rawat_II"]) || null,
                Hari_Rawat_III: parseInt(row["Hari_Rawat_III"]) || null,
                Hari_Rawat_Khusus: parseInt(row["Hari_Rawat_Khusus"]) || null,
                // Utilitas Kunjungan
                Kunjungan_jml_pasien_Lama: parseInt(row["Kunjungan_jml_pasien_Lama"]) || null,
                Kunjungan_jml_pasien_Baru: parseInt(row["Kunjungan_jml_pasien_Baru"]) || null,
                Kunjungan_jml_pasien_Total: kunjunganTotal,
                // Utilitas Tindakan
                Tindakan_Pemeriksaan_jml_Tindakan: parseInt(row["Tindakan_Pemeriksaan_jml_Tindakan"]) || null,
                // Utilisasi Diklat
                Pelayanan_Pendidikan_jml_Siswa: parseInt(row["Pelayanan_Pendidikan_jml_Siswa"]) || null,
                Pelayanan_Pendidikan_Total: diklatTotal,
                // Utilisasi Jaringan
                Komputer_SIMRS_jml_User: parseInt(row["Komputer_SIMRS_jml_User"]) || null,
              });
            }
            
            if (importedData.length === 0) {
              toast.warning("Tidak ada data valid untuk diimpor.");
              return;
            }

            const { error } = await supabase
              .from('Data_Kegiatan')
              .insert(importedData);

            if (error) throw error;
            if (userId) await fetchDataKegiatan(userId);
            toast.success(`${importedData.length} data berhasil diimpor.`);
          } catch (error: any) {
            console.error(error);
            toast.error(`Gagal mengimpor data: ${error.message}`);
          }
        },
        error: (error: Papa.ParseError) => {
          toast.error(`Gagal mengimpor data: ${error.message}`);
        }
      });
    }
  };

  const handleDownloadTemplate = () => {
    const headers = [
      "Kode Unit Kerja",
      // Utilisasi Bahan Medis
      "Resep_Lembar_Resep",
      // Utilisasi Bahan Non Medis
      "Cucian_kg_Cucian",
      "Makanan_Karyawan_jml_Porsi",
      "Makanan_Pasien_jml_Porsi",
      // Utilisasi Penunjang (Set dan Instrumen)
      "Instrumen_Besar",
      "Instrumen_Sedang",
      "Instrumen_Kecil",
      "Set_Pack_Besar",
      "Set_Pack_Sedang",
      "Set_Pack_Kecil",
      // Utilisasi Pegawai
      "SDM_Dr",
      "SDM_Prwt",
      "SDM_Non",
      "Jml_jam_Praktek_per_hari",
      // Utilisasi Daya
      "Listrik_kwh",
      "Air_m3",
      "Telepon_Freq_pakai_per_titik",
      // Utilitas Tempat Tidur
      "Tempat_Tidur_SVIP",
      "Tempat_Tidur_VIP",
      "Tempat_Tidur_I",
      "Tempat_Tidur_II",
      "Tempat_Tidur_III",
      "Tempat_Tidur_Khusus",
      // Utilitas Perawatan
      "Hari_Rawat_SVIP",
      "Hari_Rawat_VIP",
      "Hari_Rawat_Utama",
      "Hari_Rawat_I",
      "Hari_Rawat_II",
      "Hari_Rawat_III",
      "Hari_Rawat_Khusus",
      // Utilitas Kunjungan
      "Kunjungan_jml_pasien_Lama",
      "Kunjungan_jml_pasien_Baru",
      // Utilitas Tindakan
      "Tindakan_Pemeriksaan_jml_Tindakan",
      // Utilisasi Diklat
      "Pelayanan_Pendidikan_jml_Siswa",
      // Utilisasi Jaringan
      "Komputer_SIMRS_jml_User"
    ];
    const csv = Papa.unparse([headers]);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    saveAs(blob, "template_data_kegiatan.csv");
    toast.info("Template impor data berhasil diunduh.");
  };

  const handleDownloadReport = () => {
    const filteredData = dataKegiatanList.filter(item => {
      if (reportFilter === "all") return true;
      return item.unit_kerja?.kode === reportFilter;
    });

    if (filteredData.length === 0) {
      toast.warning("Tidak ada data untuk dibuat laporan dengan filter ini.");
      return;
    }

    const dataToExport = filteredData.map(item => ({
      "Kode Unit Kerja": item.unit_kerja?.kode || "-",
      "Nama Unit Kerja": item.unit_kerja?.nama || "-",
      // Utilisasi Bahan Medis
      "Resep_Lembar_Resep": item.Resep_Lembar_Resep || "",
      // Utilisasi Bahan Non Medis
      "Cucian_kg_Cucian": item.Cucian_kg_Cucian || "",
      "Makanan_Karyawan_jml_Porsi": item.Makanan_Karyawan_jml_Porsi || "",
      "Makanan_Pasien_jml_Porsi": item.Makanan_Pasien_jml_Porsi || "",
      // Utilisasi Penunjang (Set dan Instrumen)
      "Instrumen_Besar": item.Instrumen_Besar || "",
      "Instrumen_Sedang": item.Instrumen_Sedang || "",
      "Instrumen_Kecil": item.Instrumen_Kecil || "",
      "Set_Pack_Besar": item.Set_Pack_Besar || "",
      "Set_Pack_Sedang": item.Set_Pack_Sedang || "",
      "Set_Pack_Kecil": item.Set_Pack_Kecil || "",
      // Utilisasi Pegawai
      "SDM_Dr": item.SDM_Dr || "",
      "SDM_Prwt": item.SDM_Prwt || "",
      "SDM_Non": item.SDM_Non || "",
      "Jml_jam_Praktek_per_hari": item.Jml_jam_Praktek_per_hari || "",
      // Utilisasi Daya
      "Listrik_kwh": item.Listrik_kwh || "",
      "Air_m3": item.Air_m3 || "",
      "Telepon_Freq_pakai_per_titik": item.Telepon_Freq_pakai_per_titik || "",
      // Utilitas Tempat Tidur
      "Tempat_Tidur_SVIP": item.Tempat_Tidur_SVIP || "",
      "Tempat_Tidur_VIP": item.Tempat_Tidur_VIP || "",
      "Tempat_Tidur_I": item.Tempat_Tidur_I || "",
      "Tempat_Tidur_II": item.Tempat_Tidur_II || "",
      "Tempat_Tidur_III": item.Tempat_Tidur_III || "",
      "Tempat_Tidur_Khusus": item.Tempat_Tidur_Khusus || "",
      // Utilitas Perawatan
      "Hari_Rawat_SVIP": item.Hari_Rawat_SVIP || "",
      "Hari_Rawat_VIP": item.Hari_Rawat_VIP || "",
      "Hari_Rawat_Utama": item.Hari_Rawat_Utama || "",
      "Hari_Rawat_I": item.Hari_Rawat_I || "",
      "Hari_Rawat_II": item.Hari_Rawat_II || "",
      "Hari_Rawat_III": item.Hari_Rawat_III || "",
      "Hari_Rawat_Khusus": item.Hari_Rawat_Khusus || "",
      // Utilitas Kunjungan
      "Kunjungan_jml_pasien_Lama": item.Kunjungan_jml_pasien_Lama || "",
      "Kunjungan_jml_pasien_Baru": item.Kunjungan_jml_pasien_Baru || "",
      "Kunjungan_jml_pasien_Total": item.Kunjungan_jml_pasien_Total || "",
      // Utilitas Tindakan
      "Tindakan_Pemeriksaan_jml_Tindakan": item.Tindakan_Pemeriksaan_jml_Tindakan || "",
      // Utilisasi Diklat
      "Pelayanan_Pendidikan_jml_Siswa": item.Pelayanan_Pendidikan_jml_Siswa || "",
      "Pelayanan_Pendidikan_Total": item.Pelayanan_Pendidikan_Total || "",
      // Utilisasi Jaringan
      "Komputer_SIMRS_jml_User": item.Komputer_SIMRS_jml_User || "",
    }));

    const csv = Papa.unparse(dataToExport);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    saveAs(blob, `laporan_data_kegiatan.csv`);
    toast.info("Laporan berhasil diunduh.");
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Manajemen Data Kegiatan</h2>
        <div className="flex gap-2">
          {userId && (
            <Button onClick={() => fetchDataKegiatan(userId)} variant="outline" size="icon">
              <RefreshCw className="h-4 w-4" />
            </Button>
          )}
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setEditingData(null)}>Tambah Data Kegiatan</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingData ? "Edit Data Kegiatan" : "Tambah Data Kegiatan"}</DialogTitle>
                <DialogDescription>
                  {editingData ? "Perbarui detail kegiatan." : "Tambahkan data kegiatan baru."}
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 py-4">
                  <FormField
                    control={form.control}
                    name="Kode_UK"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Unit Kerja</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || ""}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Pilih Unit Kerja" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {unitKerjaList.map((unit) => (
                              <SelectItem key={unit.id} value={unit.kode}>
                                {unit.kode} - {unit.nama}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Utilisasi Bahan Medis */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Utilisasi Bahan Medis</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 gap-4">
                        <FormField
                          control={form.control}
                          name="Resep_Lembar_Resep"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Resep (Lembar Resep)</FormLabel>
                              <FormControl>
                                <Input type="number" placeholder="Jumlah lembar resep" {...field} 
                                  onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : null)} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </CardContent>
                  </Card>

                  {/* Utilisasi Bahan Non Medis */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Utilisasi Bahan Non Medis</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <FormField
                          control={form.control}
                          name="Cucian_kg_Cucian"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Cucian (kg)</FormLabel>
                              <FormControl>
                                <Input type="number" step="0.01" placeholder="Berat cucian (kg)" {...field} 
                                  onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : null)} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="Makanan_Karyawan_jml_Porsi"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Makanan Karyawan (Porsi)</FormLabel>
                              <FormControl>
                                <Input type="number" placeholder="Jumlah porsi karyawan" {...field} 
                                  onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : null)} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="Makanan_Pasien_jml_Porsi"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Makanan Pasien (Porsi)</FormLabel>
                              <FormControl>
                                <Input type="number" placeholder="Jumlah porsi pasien" {...field} 
                                  onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : null)} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </CardContent>
                  </Card>

                  {/* Utilisasi Penunjang (Set dan Instrumen) */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Utilisasi Penunjang (Set dan Instrumen)</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <FormField
                          control={form.control}
                          name="Instrumen_Besar"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Instrumen Besar</FormLabel>
                              <FormControl>
                                <Input type="number" placeholder="Jumlah instrumen besar" {...field} 
                                  onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : null)} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="Instrumen_Sedang"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Instrumen Sedang</FormLabel>
                              <FormControl>
                                <Input type="number" placeholder="Jumlah instrumen sedang" {...field} 
                                  onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : null)} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="Instrumen_Kecil"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Instrumen Kecil</FormLabel>
                              <FormControl>
                                <Input type="number" placeholder="Jumlah instrumen kecil" {...field} 
                                  onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : null)} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="Set_Pack_Besar"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Set Pack Besar</FormLabel>
                              <FormControl>
                                <Input type="number" placeholder="Jumlah set pack besar" {...field} 
                                  onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : null)} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="Set_Pack_Sedang"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Set Pack Sedang</FormLabel>
                              <FormControl>
                                <Input type="number" placeholder="Jumlah set pack sedang" {...field} 
                                  onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : null)} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="Set_Pack_Kecil"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Set Pack Kecil</FormLabel>
                              <FormControl>
                                <Input type="number" placeholder="Jumlah set pack kecil" {...field} 
                                  onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : null)} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </CardContent>
                  </Card>

                  {/* Utilisasi Pegawai */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Utilisasi Pegawai</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <FormField
                          control={form.control}
                          name="SDM_Dr"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>SDM Dokter</FormLabel>
                              <FormControl>
                                <Input type="number" placeholder="Jumlah dokter" {...field} 
                                  onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : null)} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="SDM_Prwt"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>SDM Perawat</FormLabel>
                              <FormControl>
                                <Input type="number" placeholder="Jumlah perawat" {...field} 
                                  onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : null)} />
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
                                <Input type="number" placeholder="Jumlah non medis" {...field} 
                                  onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : null)} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="Jml_jam_Praktek_per_hari"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Jam Praktek/Hari</FormLabel>
                              <FormControl>
                                <Input type="number" placeholder="Jam praktek per hari" {...field} 
                                  onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : null)} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </CardContent>
                  </Card>

                  {/* Utilisasi Daya */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Utilisasi Daya</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <FormField
                          control<dyad-write path="src/components/DataKegiatanFormTable.tsx" description="Creating Data Kegiatan form with all required fields, import, and reporting features">
"use client";

import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import Papa from "papaparse";
import { saveAs } from "file-saver";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Pencil, Trash2, Upload, Download, FileText, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface DataKegiatan {
  id: number;
  Kode_UK: string | null;
  Nama_Unit_Kerja: string | null;
  unit_kerja?: {
    kode: string;
    nama: string;
  };
  // Utilisasi Bahan Medis
  Resep_Lembar_Resep: number | null;
  // Utilisasi Bahan Non Medis
  Cucian_kg_Cucian: number | null;
  Makanan_Karyawan_jml_Porsi: number | null;
  Makanan_Pasien_jml_Porsi: number | null;
  // Utilisasi Penunjang (Set dan Instrumen)
  Instrumen_Besar: number | null;
  Instrumen_Sedang: number | null;
  Instrumen_Kecil: number | null;
  Set_Pack_Besar: number | null;
  Set_Pack_Sedang: number | null;
  Set_Pack_Kecil: number | null;
  // Utilisasi Pegawai
  SDM_Dr: number | null;
  SDM_Prwt: number | null;
  SDM_Non: number | null;
  Jml_jam_Praktek_per_hari: number | null;
  // Utilisasi Daya
  Listrik_kwh: number | null;
  Air_m3: number | null;
  Telepon_Freq_pakai_per_titik: number | null;
  // Utilitas Tempat Tidur
  Tempat_Tidur_SVIP: number | null;
  Tempat_Tidur_VIP: number | null;
  Tempat_Tidur_I: number | null;
  Tempat_Tidur_II: number | null;
  Tempat_Tidur_III: number | null;
  Tempat_Tidur_Khusus: number | null;
  // Utilitas Perawatan
  Hari_Rawat_SVIP: number | null;
  Hari_Rawat_VIP: number | null;
  Hari_Rawat_Utama: number | null;
  Hari_Rawat_I: number | null;
  Hari_Rawat_II: number | null;
  Hari_Rawat_III: number | null;
  Hari_Rawat_Khusus: number | null;
  // Utilitas Kunjungan
  Kunjungan_jml_pasien_Lama: number | null;
  Kunjungan_jml_pasien_Baru: number | null;
  Kunjungan_jml_pasien_Total: number | null;
  // Utilitas Tindakan
  Tindakan_Pemeriksaan_jml_Tindakan: number | null;
  // Utilisasi Diklat
  Pelayanan_Pendidikan_jml_Siswa: number | null;
  Pelayanan_Pendidikan_Total: number | null;
  // Utilisasi Jaringan
  Komputer_SIMRS_jml_User: number | null;
  created_at?: string;
  updated_at?: string;
}

interface UnitKerja {
  id: string;
  kode: string;
  nama: string;
  kategori: string;
}

// Schema validation for all fields
const formSchema = z.object({
  Kode_UK: z.string().optional().nullable(),
  // Utilisasi Bahan Medis
  Resep_Lembar_Resep: z.coerce.number().nullable().optional(),
  // Utilisasi Bahan Non Medis
  Cucian_kg_Cucian: z.coerce.number().nullable().optional(),
  Makanan_Karyawan_jml_Porsi: z.coerce.number().nullable().optional(),
  Makanan_Pasien_jml_Porsi: z.coerce.number().nullable().optional(),
  // Utilisasi Penunjang (Set dan Instrumen)
  Instrumen_Besar: z.coerce.number().nullable().optional(),
  Instrumen_Sedang: z.coerce.number().nullable().optional(),
  Instrumen_Kecil: z.coerce.number().nullable().optional(),
  Set_Pack_Besar: z.coerce.number().nullable().optional(),
  Set_Pack_Sedang: z.coerce.number().nullable().optional(),
  Set_Pack_Kecil: z.coerce.number().nullable().optional(),
  // Utilisasi Pegawai
  SDM_Dr: z.coerce.number().nullable().optional(),
  SDM_Prwt: z.coerce.number().nullable().optional(),
  SDM_Non: z.coerce.number().nullable().optional(),
  Jml_jam_Praktek_per_hari: z.coerce.number().nullable().optional(),
  // Utilisasi Daya
  Listrik_kwh: z.coerce.number().nullable().optional(),
  Air_m3: z.coerce.number().nullable().optional(),
  Telepon_Freq_pakai_per_titik: z.coerce.number().nullable().optional(),
  // Utilitas Tempat Tidur
  Tempat_Tidur_SVIP: z.coerce.number().nullable().optional(),
  Tempat_Tidur_VIP: z.coerce.number().nullable().optional(),
  Tempat_Tidur_I: z.coerce.number().nullable().optional(),
  Tempat_Tidur_II: z.coerce.number().nullable().optional(),
  Tempat_Tidur_III: z.coerce.number().nullable().optional(),
  Tempat_Tidur_Khusus: z.coerce.number().nullable().optional(),
  // Utilitas Perawatan
  Hari_Rawat_SVIP: z.coerce.number().nullable().optional(),
  Hari_Rawat_VIP: z.coerce.number().nullable().optional(),
  Hari_Rawat_Utama: z.coerce.number().nullable().optional(),
  Hari_Rawat_I: z.coerce.number().nullable().optional(),
  Hari_Rawat_II: z.coerce.number().nullable().optional(),
  Hari_Rawat_III: z.coerce.number().nullable().optional(),
  Hari_Rawat_Khusus: z.coerce.number().nullable().optional(),
  // Utilitas Kunjungan
  Kunjungan_jml_pasien_Lama: z.coerce.number().nullable().optional(),
  Kunjungan_jml_pasien_Baru: z.coerce.number().nullable().optional(),
  // Utilitas Tindakan
  Tindakan_Pemeriksaan_jml_Tindakan: z.coerce.number().nullable().optional(),
  // Utilisasi Diklat
  Pelayanan_Pendidikan_jml_Siswa: z.coerce.number().nullable().optional(),
  // Utilisasi Jaringan
  Komputer_SIMRS_jml_User: z.coerce.number().nullable().optional(),
});

const DataKegiatanFormTable: React.FC = () => {
  const [dataKegiatanList, setDataKegiatanList] = useState<DataKegiatan[]>([]);
  const [unitKerjaList, setUnitKerjaList] = useState<UnitKerja[]>([]);
  const [editingData, setEditingData] = useState<DataKegiatan | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [reportFilter, setReportFilter] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      Kode_UK: "",
      // Utilisasi Bahan Medis
      Resep_Lembar_Resep: null,
      // Utilisasi Bahan Non Medis
      Cucian_kg_Cucian: null,
      Makanan_Karyawan_jml_Porsi: null,
      Makanan_Pasien_jml_Porsi: null,
      // Utilisasi Penunjang (Set dan Instrumen)
      Instrumen_Besar: null,
      Instrumen_Sedang: null,
      Instrumen_Kecil: null,
      Set_Pack_Besar: null,
      Set_Pack_Sedang: null,
      Set_Pack_Kecil: null,
      // Utilisasi Pegawai
      SDM_Dr: null,
      SDM_Prwt: null,
      SDM_Non: null,
      Jml_jam_Praktek_per_hari: null,
      // Utilisasi Daya
      Listrik_kwh: null,
      Air_m3: null,
      Telepon_Freq_pakai_per_titik: null,
      // Utilitas Tempat Tidur
      Tempat_Tidur_SVIP: null,
      Tempat_Tidur_VIP: null,
      Tempat_Tidur_I: null,
      Tempat_Tidur_II: null,
      Tempat_Tidur_III: null,
      Tempat_Tidur_Khusus: null,
      // Utilitas Perawatan
      Hari_Rawat_SVIP: null,
      Hari_Rawat_VIP: null,
      Hari_Rawat_Utama: null,
      Hari_Rawat_I: null,
      Hari_Rawat_II: null,
      Hari_Rawat_III: null,
      Hari_Rawat_Khusus: null,
      // Utilitas Kunjungan
      Kunjungan_jml_pasien_Lama: null,
      Kunjungan_jml_pasien_Baru: null,
      // Utilitas Tindakan
      Tindakan_Pemeriksaan_jml_Tindakan: null,
      // Utilisasi Diklat
      Pelayanan_Pendidikan_jml_Siswa: null,
      // Utilisasi Jaringan
      Komputer_SIMRS_jml_User: null,
    },
  });

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUserId(session.user.id);
        fetchDataKegiatan(session.user.id);
        fetchUnitKerja(session.user.id);
      }
    };
    
    fetchUser();
  }, []);

  useEffect(() => {
    if (editingData) {
      form.reset({
        Kode_UK: editingData.Kode_UK || "",
        // Utilisasi Bahan Medis
        Resep_Lembar_Resep: editingData.Resep_Lembar_Resep,
        // Utilisasi Bahan Non Medis
        Cucian_kg_Cucian: editingData.Cucian_kg_Cucian,
        Makanan_Karyawan_jml_Porsi: editingData.Makanan_Karyawan_jml_Porsi,
        Makanan_Pasien_jml_Porsi: editingData.Makanan_Pasien_jml_Porsi,
        // Utilisasi Penunjang (Set dan Instrumen)
        Instrumen_Besar: editingData.Instrumen_Besar,
        Instrumen_Sedang: editingData.Instrumen_Sedang,
        Instrumen_Kecil: editingData.Instrumen_Kecil,
        Set_Pack_Besar: editingData.Set_Pack_Besar,
        Set_Pack_Sedang: editingData.Set_Pack_Sedang,
        Set_Pack_Kecil: editingData.Set_Pack_Kecil,
        // Utilisasi Pegawai
        SDM_Dr: editingData.SDM_Dr,
        SDM_Prwt: editingData.SDM_Prwt,
        SDM_Non: editingData.SDM_Non,
        Jml_jam_Praktek_per_hari: editingData.Jml_jam_Praktek_per_hari,
        // Utilisasi Daya
        Listrik_kwh: editingData.Listrik_kwh,
        Air_m3: editingData.Air_m3,
        Telepon_Freq_pakai_per_titik: editingData.Telepon_Freq_pakai_per_titik,
        // Utilitas Tempat Tidur
        Tempat_Tidur_SVIP: editingData.Tempat_Tidur_SVIP,
        Tempat_Tidur_VIP: editingData.Tempat_Tidur_VIP,
        Tempat_Tidur_I: editingData.Tempat_Tidur_I,
        Tempat_Tidur_II: editingData.Tempat_Tidur_II,
        Tempat_Tidur_III: editingData.Tempat_Tidur_III,
        Tempat_Tidur_Khusus: editingData.Tempat_Tidur_Khusus,
        // Utilitas Perawatan
        Hari_Rawat_SVIP: editingData.Hari_Rawat_SVIP,
        Hari_Rawat_VIP: editingData.Hari_Rawat_VIP,
        Hari_Rawat_Utama: editingData.Hari_Rawat_Utama,
        Hari_Rawat_I: editingData.Hari_Rawat_I,
        Hari_Rawat_II: editingData.Hari_Rawat_II,
        Hari_Rawat_III: editingData.Hari_Rawat_III,
        Hari_Rawat_Khusus: editingData.Hari_Rawat_Khusus,
        // Utilitas Kunjungan
        Kunjungan_jml_pasien_Lama: editingData.Kunjungan_jml_pasien_Lama,
        Kunjungan_jml_pasien_Baru: editingData.Kunjungan_jml_pasien_Baru,
        // Utilitas Tindakan
        Tindakan_Pemeriksaan_jml_Tindakan: editingData.Tindakan_Pemeriksaan_jml_Tindakan,
        // Utilisasi Diklat
        Pelayanan_Pendidikan_jml_Siswa: editingData.Pelayanan_Pendidikan_jml_Siswa,
        // Utilisasi Jaringan
        Komputer_SIMRS_jml_User: editingData.Komputer_SIMRS_jml_User,
      });
    } else {
      form.reset({
        Kode_UK: "",
        // Utilisasi Bahan Medis
        Resep_Lembar_Resep: null,
        // Utilisasi Bahan Non Medis
        Cucian_kg_Cucian: null,
        Makanan_Karyawan_jml_Porsi: null,
        Makanan_Pasien_jml_Porsi: null,
        // Utilisasi Penunjang (Set dan Instrumen)
        Instrumen_Besar: null,
        Instrumen_Sedang: null,
        Instrumen_Kecil: null,
        Set_Pack_Besar: null,
        Set_Pack_Sedang: null,
        Set_Pack_Kecil: null,
        // Utilisasi Pegawai
        SDM_Dr: null,
        SDM_Prwt: null,
        SDM_Non: null,
        Jml_jam_Praktek_per_hari: null,
        // Utilisasi Daya
        Listrik_kwh: null,
        Air_m3: null,
        Telepon_Freq_pakai_per_titik: null,
        // Utilitas Tempat Tidur
        Tempat_Tidur_SVIP: null,
        Tempat_Tidur_VIP: null,
        Tempat_Tidur_I: null,
        Tempat_Tidur_II: null,
        Tempat_Tidur_III: null,
        Tempat_Tidur_Khusus: null,
        // Utilitas Perawatan
        Hari_Rawat_SVIP: null,
        Hari_Rawat_VIP: null,
        Hari_Rawat_Utama: null,
        Hari_Rawat_I: null,
        Hari_Rawat_II: null,
        Hari_Rawat_III: null,
        Hari_Rawat_Khusus: null,
        // Utilitas Kunjungan
        Kunjungan_jml_pasien_Lama: null,
        Kunjungan_jml_pasien_Baru: null,
        // Utilitas Tindakan
        Tindakan_Pemeriksaan_jml_Tindakan: null,
        // Utilisasi Diklat
        Pelayanan_Pendidikan_jml_Siswa: null,
        // Utilisasi Jaringan
        Komputer_SIMRS_jml_User: null,
      });
    }
  }, [editingData, form]);

  const fetchDataKegiatan = async (currentUserId: string) => {
    setLoading(true);
    const { data, error } = await supabase
      .from('Data_Kegiatan')
      .select('*, unit_kerja:Kode_UK!inner(kode, nama)')
      .eq('unit_kerja.user_id', currentUserId)
      .order('created_at', { ascending: false });

    if (error) {
      toast.error("Gagal memuat data kegiatan.");
      console.error(error);
    } else {
      setDataKegiatanList(data || []);
    }
    setLoading(false);
  };

  const fetchUnitKerja = async (currentUserId: string) => {
    const { data, error } = await supabase
      .from('unit_kerja')
      .select('id, kode, nama, kategori')
      .eq('user_id', currentUserId)
      .order('nama', { ascending: true });

    if (error) {
      toast.error("Gagal memuat data unit kerja.");
      console.error(error);
    } else {
      setUnitKerjaList(data || []);
    }
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!userId) {
      toast.error("User tidak ditemukan. Silakan login kembali.");
      return;
    }

    try {
      // Calculate total fields
      const kunjunganTotal = (values.Kunjungan_jml_pasien_Lama || 0) + (values.Kunjungan_jml_pasien_Baru || 0);
      const diklatTotal = (values.Pelayanan_Pendidikan_jml_Siswa || 0) * (values.Jml_jam_Praktek_per_hari || 0);

      const dataToSubmit = {
        ...values,
        Kunjungan_jml_pasien_Total: kunjunganTotal,
        Pelayanan_Pendidikan_Total: diklatTotal,
      };

      if (editingData) {
        const { error } = await supabase
          .from('Data_Kegiatan')
          .update(dataToSubmit)
          .eq('id', editingData.id);

        if (error) throw error;
        toast.success("Data Kegiatan berhasil diperbarui.");
      } else {
        const { error } = await supabase
          .from('Data_Kegiatan')
          .insert([dataToSubmit]);

        if (error) throw error;
        toast.success("Data Kegiatan berhasil ditambahkan.");
      }
      if (userId) await fetchDataKegiatan(userId);
      setEditingData(null);
      setIsDialogOpen(false);
      form.reset();
    } catch (error: any) {
      console.error(error);
      toast.error(`Terjadi kesalahan saat menyimpan data: ${error.message}`);
    }
  };

  const handleEdit = (data: DataKegiatan) => {
    setEditingData(data);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: number) => {
    try {
      const { error } = await supabase
        .from('Data_Kegiatan')
        .delete()
        .eq('id', id);

      if (error) throw error;
      if (userId) await fetchDataKegiatan(userId);
      toast.success("Data Kegiatan berhasil dihapus.");
    } catch (error: any) {
      console.error(error);
      toast.error(`Terjadi kesalahan saat menghapus data: ${error.message}`);
    }
  };

  const handleImportData = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!userId) {
      toast.error("User tidak ditemukan. Silakan login kembali.");
      return;
    }

    const file = event.target.files?.[0];
    if (file) {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: async (results: Papa.ParseResult<any>) => {
          try {
            const importedData: any[] = [];
            const unitKerjaMap = new Map(unitKerjaList.map(uk => [uk.kode, uk.kode]));
            
            for (const row of results.data) {
              // Find unit kerja by kode if provided
              let kodeUK = null;
              const unitKerjaKode = row["Kode Unit Kerja"];
              if (unitKerjaKode) {
                kodeUK = unitKerjaMap.get(unitKerjaKode) || null;
                if (!kodeUK) {
                  toast.warning(`Kode Unit Kerja '${unitKerjaKode}' tidak ditemukan, melewatkan data`);
                  continue;
                }
              }
              
              // Calculate totals
              const kunjunganTotal = (parseInt(row["Kunjungan_jml_pasien_Lama"]) || 0) + 
                                    (parseInt(row["Kunjungan_jml_pasien_Baru"]) || 0);
              const diklatTotal = (parseInt(row["Pelayanan_Pendidikan_jml_Siswa"]) || 0) * 
                                 (parseInt(row["Jml_jam_Praktek_per_hari"]) || 0);
              
              importedData.push({
                Kode_UK: kodeUK,
                // Utilisasi Bahan Medis
                Resep_Lembar_Resep: parseInt(row["Resep_Lembar_Resep"]) || null,
                // Utilisasi Bahan Non Medis
                Cucian_kg_Cucian: parseFloat(row["Cucian_kg_Cucian"]) || null,
                Makanan_Karyawan_jml_Porsi: parseInt(row["Makanan_Karyawan_jml_Porsi"]) || null,
                Makanan_Pasien_jml_Porsi: parseInt(row["Makanan_Pasien_jml_Porsi"]) || null,
                // Utilisasi Penunjang (Set dan Instrumen)
                Instrumen_Besar: parseInt(row["Instrumen_Besar"]) || null,
                Instrumen_Sedang: parseInt(row["Instrumen_Sedang"]) || null,
                Instrumen_Kecil: parseInt(row["Instrumen_Kecil"]) || null,
                Set_Pack_Besar: parseInt(row["Set_Pack_Besar"]) || null,
                Set_Pack_Sedang: parseInt(row["Set_Pack_Sedang"]) || null,
                Set_Pack_Kecil: parseInt(row["Set_Pack_Kecil"]) || null,
                // Utilisasi Pegawai
                SDM_Dr: parseInt(row["SDM_Dr"]) || null,
                SDM_Prwt: parseInt(row["SDM_Prwt"]) || null,
                SDM_Non: parseInt(row["SDM_Non"]) || null,
                Jml_jam_Praktek_per_hari: parseInt(row["Jml_jam_Praktek_per_hari"]) || null,
                // Utilisasi Daya
                Listrik_kwh: parseFloat(row["Listrik_kwh"]) || null,
                Air_m3: parseFloat(row["Air_m3"]) || null,
                Telepon_Freq_pakai_per_titik: parseInt(row["Telepon_Freq_pakai_per_titik"]) || null,
                // Utilitas Tempat Tidur
                Tempat_Tidur_SVIP: parseInt(row["Tempat_Tidur_SVIP"]) || null,
                Tempat_Tidur_VIP: parseInt(row["Tempat_Tidur_VIP"]) || null,
                Tempat_Tidur_I: parseInt(row["Tempat_Tidur_I"]) || null,
                Tempat_Tidur_II: parseInt(row["Tempat_Tidur_II"]) || null,
                Tempat_Tidur_III: parseInt(row["Tempat_Tidur_III"]) || null,
                Tempat_Tidur_Khusus: parseInt(row["Tempat_Tidur_Khusus"]) || null,
                // Utilitas Perawatan
                Hari_Rawat_SVIP: parseInt(row["Hari_Rawat_SVIP"]) || null,
                Hari_Rawat_VIP: parseInt(row["Hari_Rawat_VIP"]) || null,
                Hari_Rawat_Utama: parseInt(row["Hari_Rawat_Utama"]) || null,
                Hari_Rawat_I: parseInt(row["Hari_Rawat_I"]) || null,
                Hari_Rawat_II: parseInt(row["Hari_Rawat_II"]) || null,
                Hari_Rawat_III: parseInt(row["Hari_Rawat_III"]) || null,
                Hari_Rawat_Khusus: parseInt(row["Hari_Rawat_Khusus"]) || null,
                // Utilitas Kunjungan
                Kunjungan_jml_pasien_Lama: parseInt(row["Kunjungan_jml_pasien_Lama"]) || null,
                Kunjungan_jml_pasien_Baru: parseInt(row["Kunjungan_jml_pasien_Baru"]) || null,
                Kunjungan_jml_pasien_Total: kunjunganTotal,
                // Utilitas Tindakan
                Tindakan_Pemeriksaan_jml_Tindakan: parseInt(row["Tindakan_Pemeriksaan_jml_Tindakan"]) || null,
                // Utilisasi Diklat
                Pelayanan_Pendidikan_jml_Siswa: parseInt(row["Pelayanan_Pendidikan_jml_Siswa"]) || null,
                Pelayanan_Pendidikan_Total: diklatTotal,
                // Utilisasi Jaringan
                Komputer_SIMRS_jml_User: parseInt(row["Komputer_SIMRS_jml_User"]) || null,
              });
            }
            
            if (importedData.length === 0) {
              toast.warning("Tidak ada data valid untuk diimpor.");
              return;
            }

            const { error } = await supabase
              .from('Data_Kegiatan')
              .insert(importedData);

            if (error) throw error;
            if (userId) await fetchDataKegiatan(userId);
            toast.success(`${importedData.length} data berhasil diimpor.`);
          } catch (error: any) {
            console.error(error);
            toast.error(`Gagal mengimpor data: ${error.message}`);
          }
        },
        error: (error: Papa.ParseError) => {
          toast.error(`Gagal mengimpor data: ${error.message}`);
        }
      });
    }
  };

  const handleDownloadTemplate = () => {
    const headers = [
      "Kode Unit Kerja",
      // Utilisasi Bahan Medis
      "Resep_Lembar_Resep",
      // Utilisasi Bahan Non Medis
      "Cucian_kg_Cucian",
      "Makanan_Karyawan_jml_Porsi",
      "Makanan_Pasien_jml_Porsi",
      // Utilisasi Penunjang (Set dan Instrumen)
      "Instrumen_Besar",
      "Instrumen_Sedang",
      "Instrumen_Kecil",
      "Set_Pack_Besar",
      "Set_Pack_Sedang",
      "Set_Pack_Kecil",
      // Utilisasi Pegawai
      "SDM_Dr",
      "SDM_Prwt",
      "SDM_Non",
      "Jml_jam_Praktek_per_hari",
      // Utilisasi Daya
      "Listrik_kwh",
      "Air_m3",
      "Telepon_Freq_pakai_per_titik",
      // Utilitas Tempat Tidur
      "Tempat_Tidur_SVIP",
      "Tempat_Tidur_VIP",
      "Tempat_Tidur_I",
      "Tempat_Tidur_II",
      "Tempat_Tidur_III",
      "Tempat_Tidur_Khusus",
      // Utilitas Perawatan
      "Hari_Rawat_SVIP",
      "Hari_Rawat_VIP",
      "Hari_Rawat_Utama",
      "Hari_Rawat_I",
      "Hari_Rawat_II",
      "Hari_Rawat_III",
      "Hari_Rawat_Khusus",
      // Utilitas Kunjungan
      "Kunjungan_jml_pasien_Lama",
      "Kunjungan_jml_pasien_Baru",
      // Utilitas Tindakan
      "Tindakan_Pemeriksaan_jml_Tindakan",
      // Utilisasi Diklat
      "Pelayanan_Pendidikan_jml_Siswa",
      // Utilisasi Jaringan
      "Komputer_SIMRS_jml_User"
    ];
    const csv = Papa.unparse([headers]);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    saveAs(blob, "template_data_kegiatan.csv");
    toast.info("Template impor data berhasil diunduh.");
  };

  const handleDownloadReport = () => {
    const filteredData = dataKegiatanList.filter(item => {
      if (reportFilter === "all") return true;
      return item.unit_kerja?.kode === reportFilter;
    });

    if (filteredData.length === 0) {
      toast.warning("Tidak ada data untuk dibuat laporan dengan filter ini.");
      return;
    }

    const dataToExport = filteredData.map(item => ({
      "Kode Unit Kerja": item.unit_kerja?.kode || "-",
      "Nama Unit Kerja": item.unit_kerja?.nama || "-",
      // Utilisasi Bahan Medis
      "Resep_Lembar_Resep": item.Resep_Lembar_Resep || "",
      // Utilisasi Bahan Non Medis
      "Cucian_kg_Cucian": item.Cucian_kg_Cucian || "",
      "Makanan_Karyawan_jml_Porsi": item.Makanan_Karyawan_jml_Porsi || "",
      "Makanan_Pasien_jml_Porsi": item.Makanan_Pasien_jml_Porsi || "",
      // Utilisasi Penunjang (Set dan Instrumen)
      "Instrumen_Besar": item.Instrumen_Besar || "",
      "Instrumen_Sedang": item.Instrumen_Sedang || "",
      "Instrumen_Kecil": item.Instrumen_Kecil || "",
      "Set_Pack_Besar": item.Set_Pack_Besar || "",
      "Set_Pack_Sedang": item.Set_Pack_Sedang || "",
      "Set_Pack_Kecil": item.Set_Pack_Kecil || "",
      // Utilisasi Pegawai
      "SDM_Dr": item.SDM_Dr || "",
      "SDM_Prwt": item.SDM_Prwt || "",
      "SDM_Non": item.SDM_Non || "",
      "Jml_jam_Praktek_per_hari": item.Jml_jam_Praktek_per_hari || "",
      // Utilisasi Daya
      "Listrik_kwh": item.Listrik_kwh || "",
      "Air_m3": item.Air_m3 || "",
      "Telepon_Freq_pakai_per_titik": item.Telepon_Freq_pakai_per_titik || "",
      // Utilitas Tempat Tidur
      "Tempat_Tidur_SVIP": item.Tempat_Tidur_SVIP || "",
      "Tempat_Tidur_VIP": item.Tempat_Tidur_VIP || "",
      "Tempat_Tidur_I": item.Tempat_Tidur_I || "",
      "Tempat_Tidur_II": item.Tempat_Tidur_II || "",
      "Tempat_Tidur_III": item.Tempat_Tidur_III || "",
      "Tempat_Tidur_Khusus": item.Tempat_Tidur_Khusus || "",
      // Utilitas Perawatan
      "Hari_Rawat_SVIP": item.Hari_Rawat_SVIP || "",
      "Hari_Rawat_VIP": item.Hari_Rawat_VIP || "",
      "Hari_Rawat_Utama": item.Hari_Rawat_Utama || "",
      "Hari_Rawat_I": item.Hari_Rawat_I || "",
      "Hari_Rawat_II": item.Hari_Rawat_II || "",
      "Hari_Rawat_III": item.Hari_Rawat_III || "",
      "Hari_Rawat_Khusus": item.Hari_Rawat_Khusus || "",
      // Utilitas Kunjungan
      "Kunjungan_jml_pasien_Lama": item.Kunjungan_jml_pasien_Lama || "",
      "Kunjungan_jml_pasien_Baru": item.Kunjungan_jml_pasien_Baru || "",
      "Kunjungan_jml_pasien_Total": item.Kunjungan_jml_pasien_Total || "",
      // Utilitas Tindakan
      "Tindakan_Pemeriksaan_jml_Tindakan": item.Tindakan_Pemeriksaan_jml_Tindakan || "",
      // Utilisasi Diklat
      "Pelayanan_Pendidikan_jml_Siswa": item.Pelayanan_Pendidikan_jml_Siswa || "",
      "Pelayanan_Pendidikan_Total": item.Pelayanan_Pendidikan_Total || "",
      // Utilisasi Jaringan
      "Komputer_SIMRS_jml_User": item.Komputer_SIMRS_jml_User || "",
    }));

    const csv = Papa.unparse(dataToExport);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    saveAs(blob, `laporan_data_kegiatan.csv`);
    toast.info("Laporan berhasil diunduh.");
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Manajemen Data Kegiatan</h2>
        <div className="flex gap-2">
          {userId && (
            <Button onClick={() => fetchDataKegiatan(userId)} variant="outline" size="icon">
              <RefreshCw className="h-4 w-4" />
            </Button>
          )}
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setEditingData(null)}>Tambah Data Kegiatan</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingData ? "Edit Data Kegiatan" : "Tambah Data Kegiatan"}</DialogTitle>
                <DialogDescription>
                  {editingData ? "Perbarui detail kegiatan." : "Tambahkan data kegiatan baru."}
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 py-4">
                  <FormField
                    control={form.control}
                    name="Kode_UK"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Unit Kerja</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || ""}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Pilih Unit Kerja" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {unitKerjaList.map((unit) => (
                              <SelectItem key={unit.id} value={unit.kode}>
                                {unit.kode} - {unit.nama}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Utilisasi Bahan Medis */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Utilisasi Bahan Medis</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 gap-4">
                        <FormField
                          control={form.control}
                          name="Resep_Lembar_Resep"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Resep (Lembar Resep)</FormLabel>
                              <FormControl>
                                <Input type="number" placeholder="Jumlah lembar resep" {...field} 
                                  onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : null)} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </CardContent>
                  </Card>

                  {/* Utilisasi Bahan Non Medis */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Utilisasi Bahan Non Medis</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <FormField
                          control={form.control}
                          name="Cucian_kg_Cucian"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Cucian (kg)</FormLabel>
                              <FormControl>
                                <Input type="number" step="0.01" placeholder="Berat cucian (kg)" {...field} 
                                  onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : null)} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="Makanan_Karyawan_jml_Porsi"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Makanan Karyawan (Porsi)</FormLabel>
                              <FormControl>
                                <Input type="number" placeholder="Jumlah porsi karyawan" {...field} 
                                  onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : null)} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="Makanan_Pasien_jml_Porsi"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Makanan Pasien (Porsi)</FormLabel>
                              <FormControl>
                                <Input type="number" placeholder="Jumlah porsi pasien" {...field} 
                                  onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : null)} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </CardContent>
                  </Card>

                  {/* Utilisasi Penunjang (Set dan Instrumen) */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Utilisasi Penunjang (Set dan Instrumen)</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <FormField
                          control={form.control}
                          name="Instrumen_Besar"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Instrumen Besar</FormLabel>
                              <FormControl>
                                <Input type="number" placeholder="Jumlah instrumen besar" {...field} 
                                  onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : null)} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="Instrumen_Sedang"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Instrumen Sedang</FormLabel>
                              <FormControl>
                                <Input type="number" placeholder="Jumlah instrumen sedang" {...field} 
                                  onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : null)} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="Instrumen_Kecil"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Instrumen Kecil</FormLabel>
                              <FormControl>
                                <Input type="number" placeholder="Jumlah instrumen kecil" {...field} 
                                  onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : null)} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="Set_Pack_Besar"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Set Pack Besar</FormLabel>
                              <FormControl>
                                <Input type="number" placeholder="Jumlah set pack besar" {...field} 
                                  onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : null)} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="Set_Pack_Sedang"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Set Pack Sedang</FormLabel>
                              <FormControl>
                                <Input type="number" placeholder="Jumlah set pack sedang" {...field} 
                                  onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : null)} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="Set_Pack_Kecil"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Set Pack Kecil</FormLabel>
                              <FormControl>
                                <Input type="number" placeholder="Jumlah set pack kecil" {...field} 
                                  onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : null)} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </CardContent>
                  </Card>

                  {/* Utilisasi Pegawai */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Utilisasi Pegawai</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <FormField
                          control={form.control}
                          name="SDM_Dr"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>SDM Dokter</FormLabel>
                              <FormControl>
                                <Input type="number" placeholder="Jumlah dokter" {...field} 
                                  onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : null)} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="SDM_Prwt"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>SDM Perawat</FormLabel>
                              <FormControl>
                                <Input type="number" placeholder="Jumlah perawat" {...field} 
                                  onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : null)} />
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
                                <Input type="number" placeholder="Jumlah non medis" {...field} 
                                  onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : null)} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="Jml_jam_Praktek_per_hari"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Jam Praktek/Hari</FormLabel>
                              <FormControl>
                                <Input type="number" placeholder="Jam praktek per hari" {...field} 
                                  onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : null)} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </CardContent>
                  </Card>

                  {/* Utilisasi Daya */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Utilisasi Daya</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <FormField
                          control={form.control}
                          name="Listrik_kwh"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Listrik (kWh)</FormLabel>
                              <FormControl>
                                <Input type="number" step="0.01" placeholder="Pemakaian listrik (kWh)" {...field} 
                                  onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : null)} />
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
                                <Input type="number" step="0.01" placeholder="Pemakaian air (m³)" {...field} 
                                  onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : null)} />
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
                              <FormLabel>Telepon (Frekuensi/titik)</FormLabel>
                              <FormControl>
                                <Input type="number" placeholder="Frekuensi telepon per titik" {...field} 
                                  onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : null)} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </CardContent>
                  </Card>

                  {/* Utilitas Tempat Tidur */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Utilitas Tempat Tidur</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <FormField
                          control={form.control}
                          name="Tempat_Tidur_SVIP"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Tempat Tidur SVIP</FormLabel>
                              <FormControl>
                                <Input type="number" placeholder="Jumlah tempat tidur SVIP" {...field} 
                                  onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : null)} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="Tempat_Tidur_VIP"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Tempat Tidur VIP</FormLabel>
                              <FormControl>
                                <Input type="number" placeholder="Jumlah tempat tidur VIP" {...field} 
                                  onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : null)} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="Tempat_Tidur_I"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Tempat Tidur Kelas I</FormLabel>
                              <FormControl>
                                <Input type="number" placeholder="Jumlah tempat tidur kelas I" {...field} 
                                  onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : null)} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="Tempat_Tidur_II"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Tempat Tidur Kelas II</FormLabel>
                              <FormControl>
                                <Input type="number" placeholder="Jumlah tempat tidur kelas II" {...field} 
                                  onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : null)} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="Tempat_Tidur_III"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Tempat Tidur Kelas III</FormLabel>
                              <FormControl>
                                <Input type="number" placeholder="Jumlah tempat tidur kelas III" {...field} 
                                  onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : null)} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="Tempat_Tidur_Khusus"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Tempat Tidur Khusus</FormLabel>
                              <FormControl>
                                <Input type="number" placeholder="Jumlah tempat tidur khusus" {...field} 
                                  onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : null)} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </CardContent>
                  </Card>

                  {/* Utilitas Perawatan */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Utilitas Perawatan</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <FormField
                          control={form.control}
                          name="Hari_Rawat_SVIP"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Hari Rawat SVIP</FormLabel>
                              <FormControl>
                                <Input type="number" placeholder="Jumlah hari rawat SVIP" {...field} 
                                  onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : null)} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="Hari_Rawat_VIP"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Hari Rawat VIP</FormLabel>
                              <FormControl>
                                <Input type="number" placeholder="Jumlah hari rawat VIP" {...field} 
                                  onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : null)} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="Hari_Rawat_Utama"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Hari Rawat Utama</FormLabel>
                              <FormControl>
                                <Input type="number" placeholder="Jumlah hari rawat utama" {...field} 
                                  onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : null)} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="Hari_Rawat_I"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Hari Rawat Kelas I</FormLabel>
                              <FormControl>
                                <Input type="number" placeholder="Jumlah hari rawat kelas I" {...field} 
                                  onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : null)} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="Hari_Rawat_II"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Hari Rawat Kelas II</FormLabel>
                              <FormControl>
                                <Input type="number" placeholder="Jumlah hari rawat kelas II" {...field} 
                                  onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : null)} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="Hari_Rawat_III"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Hari Rawat Kelas III</FormLabel>
                              <FormControl>
                                <Input type="number" placeholder="Jumlah hari rawat kelas III" {...field} 
                                  onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : null)} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="Hari_Rawat_Khusus"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Hari Rawat Khusus</FormLabel>
                              <FormControl>
                                <Input type="number" placeholder="Jumlah hari rawat khusus" {...field} 
                                  onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : null)} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </CardContent>
                  </Card>

                  {/* Utilitas Kunjungan */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Utilitas Kunjungan</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <FormField
                          control={form.control}
                          name="Kunjungan_jml_pasien_Lama"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Pasien Lama</FormLabel>
                              <FormControl>
                                <Input type="number" placeholder="Jumlah pasien lama" {...field} 
                                  onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : null)} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="Kunjungan_jml_pasien_Baru"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Pasien Baru</FormLabel>
                              <FormControl>
                                <Input type="number" placeholder="Jumlah pasien baru" {...field} 
                                  onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : null)} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </CardContent>
                  </Card>

                  {/* Utilitas Tindakan */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Utilitas Tindakan</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 gap-4">
                        <FormField
                          control={form.control}
                          name="Tindakan_Pemeriksaan_jml_Tindakan"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Jumlah Tindakan</FormLabel>
                              <FormControl>
                                <Input type="number" placeholder="Jumlah tindakan pemeriksaan" {...field} 
                                  onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : null)} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </CardContent>
                  </Card>

                  {/* Utilisasi Diklat */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Utilisasi Diklat</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="Pelayanan_Pendidikan_jml_Siswa"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Jumlah Siswa</FormLabel>
                              <FormControl>
                                <Input type="number" placeholder="Jumlah siswa diklat" {...field} 
                                  onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : null)} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </CardContent>
                  </Card>

                  {/* Utilisasi Jaringan */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Utilisasi Jaringan</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 gap-4">
                        <FormField
                          control={form.control}
                          name="Komputer_SIMRS_jml_User"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>User SIMRS</FormLabel>
                              <FormControl>
                                <Input type="number" placeholder="Jumlah user SIMRS" {...field} 
                                  onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : null)} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </CardContent>
                  </Card>

                  <DialogFooter>
                    <Button type="submit">{editingData ? "Simpan Perubahan" : "Tambah"}</Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="flex flex-wrap gap-4 mb-6">
        <Button onClick={handleDownloadTemplate} variant="outline">
          <Download className="mr-2 h-4 w-4" /> Unduh Template Impor
        </Button>
        <label htmlFor="import-file" className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2 cursor-pointer">
          <Upload className="mr-2 h-4 w-4" /> Impor Data
          <Input id="import-file" type="file" accept=".csv" onChange={handleImportData} className="sr-only" />
        </label>
        <div className="flex items-center gap-2">
          <Select onValueChange={(value: string) => setReportFilter(value)} defaultValue={reportFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter Unit Kerja" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Unit Kerja</SelectItem>
              {unitKerjaList.map((unit) => (
                <SelectItem key={unit.id} value={unit.kode}>
                  {unit.kode} - {unit.nama}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={handleDownloadReport} variant="outline">
            <FileText className="mr-2 h-4 w-4" /> Unduh Laporan
          </Button>
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Kode Unit</TableHead>
              <TableHead>Nama Unit Kerja</TableHead>
              <TableHead>Resep</TableHead>
              <TableHead>Cucian (kg)</TableHead>
              <TableHead>Makanan Karyawan</TableHead>
              <TableHead>Makanan Pasien</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                  Memuat data...
                </TableCell>
              </TableRow>
            ) : dataKegiatanList.length > 0 ? (
              dataKegiatanList.map((data) => (
                <TableRow key={data.id}>
                  <TableCell className="font-medium">{data.unit_kerja?.kode || "-"}</TableCell>
                  <TableCell>{data.unit_kerja?.nama || "-"}</TableCell>
                  <TableCell>{data.Resep_Lembar_Resep || "-"}</TableCell>
                  <TableCell>{data.Cucian_kg_Cucian || "-"}</TableCell>
                  <TableCell>{data.Makanan_Karyawan_jml_Porsi || "-"}</TableCell>
                  <TableCell>{data.Makanan_Pasien_jml_Porsi || "-"}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(data)}
                      className="mr-2"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(data.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                  Tidak ada data kegiatan.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default DataKegiatanFormTable;