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
}
from "@/components/ui/table";
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

interface Barang {
  id: string;
  user_id: string;
  klasifikasi: "ASET" | "PERSEDIAAN";
  kode: string;
  nama: string;
  gudang: "Medis" | "Non Medis";
  unit_kerja_id: string | null;
  unit_kerja?: {
    nama: string;
    kode: string;
  };
  created_at?: string;
  updated_at?: string;
}

interface UnitKerja {
  id: string;
  kode: string;
  nama: string;
  kategori: string;
}

const formSchema = z.object({
  klasifikasi: z.enum(["ASET", "PERSEDIAAN"], {
    required_error: "Klasifikasi harus dipilih.",
  }),
  kode: z.string().min(1, { message: "Kode Barang harus diisi." }),
  nama: z.string().min(1, { message: "Nama Barang harus diisi." }),
  gudang: z.enum(["Medis", "Non Medis"], {
    required_error: "Gudang harus dipilih.",
  }),
  unit_kerja_id: z.string().optional().nullable(),
});

const BarangFormTable: React.FC = () => {
  const [barangList, setBarangList] = useState<Barang[]>([]);
  const [unitKerjaList, setUnitKerjaList] = useState<UnitKerja[]>([]);
  const [editingBarang, setEditingBarang] = useState<Barang | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [reportFilter, setReportFilter] = useState<"all" | "ASET" | "PERSEDIAAN">("all");
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      klasifikasi: "ASET",
      kode: "",
      nama: "",
      gudang: "Medis",
      unit_kerja_id: null,
    },
  });

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUserId(session.user.id);
        fetchBarang(session.user.id);
        fetchUnitKerja(session.user.id);
      }
    };
    
    fetchUser();
  }, []);

  useEffect(() => {
    if (editingBarang) {
      form.reset({
        klasifikasi: editingBarang.klasifikasi,
        kode: editingBarang.kode,
        nama: editingBarang.nama,
        gudang: editingBarang.gudang,
        unit_kerja_id: editingBarang.unit_kerja_id || undefined,
      });
    } else {
      form.reset({
        klasifikasi: "ASET",
        kode: "",
        nama: "",
        gudang: "Medis",
        unit_kerja_id: null,
      });
    }
  }, [editingBarang, form]);

  const fetchBarang = async (currentUserId: string) => {
    setLoading(true);
    const { data, error } = await supabase
      .from('barang')
      .select('*, unit_kerja:unit_kerja_id(kode, nama)')
      .eq('user_id', currentUserId)
      .order('created_at', { ascending: false });

    if (error) {
      toast.error("Gagal memuat data barang.");
      console.error(error);
    } else {
      setBarangList(data || []);
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

  const checkKodeExists = async (kode: string, currentUserId: string, excludeId?: string) => {
    let query = supabase
      .from('barang')
      .select('id')
      .eq('kode', kode)
      .eq('user_id', currentUserId);
      
    if (excludeId) {
      query = query.neq('id', excludeId);
    }
    
    const { data, error } = await query.maybeSingle();
    
    if (error) throw error;
    return !!data;
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!userId) {
      toast.error("User tidak ditemukan. Silakan login kembali.");
      return;
    }

    try {
      // Check if kode already exists
      const isKodeExists = await checkKodeExists(
        values.kode, 
        userId, 
        editingBarang?.id
      );
      
      if (isKodeExists) {
        toast.error("Kode Barang sudah digunakan. Silakan gunakan kode yang lain.");
        return;
      }

      if (editingBarang) {
        const { error } = await supabase
          .from('barang')
          .update({ 
            ...values, 
            user_id: userId,
            unit_kerja_id: values.unit_kerja_id || null
          })
          .eq('id', editingBarang.id);

        if (error) throw error;
        toast.success("Data Barang berhasil diperbarui.");
      } else {
        const { error } = await supabase
          .from('barang')
          .insert([{
            ...values,
            user_id: userId,
            unit_kerja_id: values.unit_kerja_id || null
          }]);

        if (error) throw error;
        toast.success("Data Barang berhasil ditambahkan.");
      }
      await fetchBarang(userId);
      setEditingBarang(null);
      setIsDialogOpen(false);
      form.reset();
    } catch (error: any) {
      console.error(error);
      toast.error(`Terjadi kesalahan saat menyimpan data: ${error.message}`);
    }
  };

  const handleEdit = (barang: Barang) => {
    setEditingBarang(barang);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('barang')
        .delete()
        .eq('id', id);

      if (error) throw error;
      if (userId) await fetchBarang(userId);
      toast.success("Data Barang berhasil dihapus.");
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
            const duplicateCodes: string[] = [];
            const unitKerjaMap = new Map(unitKerjaList.map(uk => [uk.kode, uk.id]));
            
            for (const row of results.data) {
              const kode = row["Kode Barang"] || "";
              
              if (!kode) {
                toast.error("Kode Barang tidak boleh kosong dalam file CSV.");
                return;
              }
              
              // Check if kode already exists in database
              const isKodeExists = await checkKodeExists(kode, userId);
              
              if (isKodeExists) {
                duplicateCodes.push(kode);
                continue;
              }
              
              // Check if kode already exists in this import batch
              const isDuplicateInBatch = importedData.some(item => item.kode === kode);
              if (isDuplicateInBatch) {
                duplicateCodes.push(kode);
                continue;
              }
              
              // Find unit kerja by kode if provided
              let unitKerjaId = null;
              const unitKerjaKode = row["Kode Unit Kerja"];
              if (unitKerjaKode) {
                unitKerjaId = unitKerjaMap.get(unitKerjaKode) || null;
                if (!unitKerjaId) {
                  toast.warning(`Kode Unit Kerja '${unitKerjaKode}' tidak ditemukan, melewatkan penautan unit kerja untuk barang ${kode}`);
                }
              }
              
              importedData.push({
                kode,
                klasifikasi: row["Klasifikasi"] === "PERSEDIAAN" ? "PERSEDIAAN" : "ASET",
                nama: row["Nama Barang"] || "",
                gudang: row["Gudang"] === "Non Medis" ? "Non Medis" : "Medis",
                unit_kerja_id: unitKerjaId,
                user_id: userId,
              });
            }
            
            if (duplicateCodes.length > 0) {
              toast.error(`Kode Barang berikut sudah ada: ${duplicateCodes.join(", ")}`);
              return;
            }
            
            if (importedData.length === 0) {
              toast.warning("Tidak ada data valid untuk diimpor.");
              return;
            }

            const { error } = await supabase
              .from('barang')
              .insert(importedData);

            if (error) throw error;
            if (userId) await fetchBarang(userId);
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
    const headers = ["Kode Barang", "Klasifikasi", "Nama Barang", "Gudang", "Kode Unit Kerja"];
    const csv = Papa.unparse([headers]);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    saveAs(blob, "template_barang.csv");
    toast.info("Template impor data berhasil diunduh.");
  };

  const handleDownloadReport = () => {
    const filteredData = barangList.filter(item =>
      reportFilter === "all" ? true : item.klasifikasi === reportFilter
    );

    if (filteredData.length === 0) {
      toast.warning("Tidak ada data untuk dibuat laporan dengan filter ini.");
      return;
    }

    const dataToExport = filteredData.map(item => ({
      "Kode Barang": item.kode,
      "Klasifikasi": item.klasifikasi,
      "Nama Barang": item.nama,
      "Gudang": item.gudang,
      "Kode Unit Kerja": item.unit_kerja?.kode || "-",
      "Nama Unit Kerja": item.unit_kerja?.nama || "-",
    }));

    const csv = Papa.unparse(dataToExport);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    saveAs(blob, `laporan_barang_${reportFilter}.csv`);
    toast.info("Laporan berhasil diunduh.");
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Manajemen Data Barang</h2>
        <div className="flex gap-2">
          {userId && (
            <Button onClick={() => fetchBarang(userId)} variant="outline" size="icon">
              <RefreshCw className="h-4 w-4" />
            </Button>
          )}
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setEditingBarang(null)}>Tambah Data Barang</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>{editingBarang ? "Edit Data Barang" : "Tambah Data Barang"}</DialogTitle>
                <DialogDescription>
                  {editingBarang ? "Perbarui detail barang." : "Tambahkan barang baru ke sistem."}
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 py-4">
                  <FormField
                    control={form.control}
                    name="kode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Kode Barang</FormLabel>
                        <FormControl>
                          <Input placeholder="Contoh: BRG001" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="klasifikasi"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Klasifikasi Barang</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Pilih Klasifikasi" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="ASET">ASET</SelectItem>
                            <SelectItem value="PERSEDIAAN">PERSEDIAAN</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="nama"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nama Barang</FormLabel>
                        <FormControl>
                          <Input placeholder="Contoh: Infus Set" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="gudang"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Gudang</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Pilih Gudang" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Medis">Medis</SelectItem>
                            <SelectItem value="Non Medis">Non Medis</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="unit_kerja_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Unit Kerja</FormLabel>
                        <Select onValueChange={(value) => field.onChange(value === "null" ? null : value)} value={field.value || "null"}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Pilih Unit Kerja" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="null">Tidak ada</SelectItem>
                            {unitKerjaList.map((unit) => (
                              <SelectItem key={unit.id} value={unit.id}>
                                {unit.kode} - {unit.nama}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <DialogFooter>
                    <Button type="submit">{editingBarang ? "Simpan Perubahan" : "Tambah"}</Button>
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
          <Select onValueChange={(value: "all" | "ASET" | "PERSEDIAAN") => setReportFilter(value)} defaultValue={reportFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter Klasifikasi" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Klasifikasi</SelectItem>
              <SelectItem value="ASET">ASET</SelectItem>
              <SelectItem value="PERSEDIAAN">PERSEDIAAN</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={handleDownloadReport} variant="outline">
            <FileText className="mr-2 h-4 w-4" /> Unduh Laporan
          </Button>
        </div>
      </div>

      <div className="rounded<dyad-write path="src/components/BiayaFormTable.tsx" description="Fixing file import error in BiayaFormTable.tsx">
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
}
from "@/components/ui/table";
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
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface Biaya {
  id: string;
  user_id: string;
  tahun: number;
  biaya_gaji_tunjangan: number | null;
  biaya_jasa_pelayanan: number | null;
  biaya_obat: number | null;
  biaya_bhp: number | null;
  biaya_makan_karyawan: number | null;
  biaya_makan_pasien: number | null;
  biaya_rumah_tangga: number | null;
  biaya_cetak: number | null;
  biaya_atk: number | null;
  biaya_listrik: number | null;
  biaya_air: number | null;
  biaya_telp: number | null;
  biaya_pemeliharaan_bangunan: number | null;
  biaya_pemeliharaan_alat_medis: number | null;
  biaya_pemeliharaan_alat_non_medis: number | null;
  biaya_operasional_lainnya: number | null;
  biaya_penyusutan_gedung: number | null;
  biaya_penyusutan_jaringan: number | null;
  biaya_penyusutan_alat_medis: number | null;
  biaya_penyusutan_alat_non_medis: number | null;
  biaya_pendidikan_pelatihan: number | null;
  created_at?: string;
  updated_at?: string;
}

const formSchema = z.object({
  tahun: z.coerce.number().min(1900, { message: "Tahun harus valid." }),
  biaya_gaji_tunjangan: z.coerce.number().min(0).optional(),
  biaya_jasa_pelayanan: z.coerce.number().min(0).optional(),
  biaya_obat: z.coerce.number().min(0).optional(),
  biaya_bhp: z.coerce.number().min(0).optional(),
  biaya_makan_karyawan: z.coerce.number().min(0).optional(),
  biaya_makan_pasien: z.coerce.number().min(0).optional(),
  biaya_rumah_tangga: z.coerce.number().min(0).optional(),
  biaya_cetak: z.coerce.number().min(0).optional(),
  biaya_atk: z.coerce.number().min(0).optional(),
  biaya_listrik: z.coerce.number().min(0).optional(),
  biaya_air: z.coerce.number().min(0).optional(),
  biaya_telp: z.coerce.number().min(0).optional(),
  biaya_pemeliharaan_bangunan: z.coerce.number().min(0).optional(),
  biaya_pemeliharaan_alat_medis: z.coerce.number().min(0).optional(),
  biaya_pemeliharaan_alat_non_medis: z.coerce.number().min(0).optional(),
  biaya_operasional_lainnya: z.coerce.number().min(0).optional(),
  biaya_penyusutan_gedung: z.coerce.number().min(0).optional(),
  biaya_penyusutan_jaringan: z.coerce.number().min(0).optional(),
  biaya_penyusutan_alat_medis: z.coerce.number().min(0).optional(),
  biaya_penyusutan_alat_non_medis: z.coerce.number().min(0).optional(),
  biaya_pendidikan_pelatihan: z.coerce.number().min(0).optional(),
});

const BiayaFormTable: React.FC = () => {
  const [biayaList, setBiayaList] = useState<Biaya[]>([]);
  const [editingBiaya, setEditingBiaya] = useState<Biaya | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      tahun: new Date().getFullYear(),
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
    },
  });

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUserId(session.user.id);
        fetchBiaya(session.user.id);
      }
    };
    
    fetchUser();
  }, []);

  useEffect(() => {
    if (editingBiaya) {
      form.reset({
        tahun: editingBiaya.tahun,
        biaya_gaji_tunjangan: editingBiaya.biaya_gaji_tunjangan || 0,
        biaya_jasa_pelayanan: editingBiaya.biaya_jasa_pelayanan || 0,
        biaya_obat: editingBiaya.biaya_obat || 0,
        biaya_bhp: editingBiaya.biaya_bhp || 0,
        biaya_makan_karyawan: editingBiaya.biaya_makan_karyawan || 0,
        biaya_makan_pasien: editingBiaya.biaya_makan_pasien || 0,
        biaya_rumah_tangga: editingBiaya.biaya_rumah_tangga || 0,
        biaya_cetak: editingBiaya.biaya_cetak || 0,
        biaya_atk: editingBiaya.biaya_atk || 0,
        biaya_listrik: editingBiaya.biaya_listrik || 0,
        biaya_air: editingBiaya.biaya_air || 0,
        biaya_telp: editingBiaya.biaya_telp || 0,
        biaya_pemeliharaan_bangunan: editingBiaya.biaya_pemeliharaan_bangunan || 0,
        biaya_pemeliharaan_alat_medis: editingBiaya.biaya_pemeliharaan_alat_medis || 0,
        biaya_pemeliharaan_alat_non_medis: editingBiaya.biaya_pemeliharaan_alat_non_medis || 0,
        biaya_operasional_lainnya: editingBiaya.biaya_operasional_lainnya || 0,
        biaya_penyusutan_gedung: editingBiaya.biaya_penyusutan_gedung || 0,
        biaya_penyusutan_jaringan: editingBiaya.biaya_penyusutan_jaringan || 0,
        biaya_penyusutan_alat_medis: editingBiaya.biaya_penyusutan_alat_medis || 0,
        biaya_penyusutan_alat_non_medis: editingBiaya.biaya_penyusutan_alat_non_medis || 0,
        biaya_pendidikan_pelatihan: editingBiaya.biaya_pendidikan_pelatihan || 0,
      });
    } else {
      form.reset({
        tahun: new Date().getFullYear(),
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
      });
    }
  }, [editingBiaya, form]);

  const fetchBiaya = async (currentUserId: string) => {
    setLoading(true);
    const { data, error } = await supabase
      .from('biaya')
      .select('*')
      .eq('user_id', currentUserId)
      .order('tahun', { ascending: false });

    if (error) {
      toast.error("Gagal memuat data biaya.");
      console.error(error);
    } else {
      setBiayaList(data || []);
    }
    setLoading(false);
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!userId) {
      toast.error("User tidak ditemukan. Silakan login kembali.");
      return;
    }

    try {
      if (editingBiaya) {
        const { error } = await supabase
          .from('biaya')
          .update({ ...values, user_id: userId })
          .eq('id', editingBiaya.id);

        if (error) throw error;
        toast.success("Data Biaya berhasil diperbarui.");
      } else {
        // Check if tahun already exists for this user
        const { data: existingData, error: checkError } = await supabase
          .from('biaya')
          .select('id')
          .eq('tahun', values.tahun)
          .eq('user_id', userId)
          .maybeSingle();

        if (checkError) throw checkError;
        
        if (existingData) {
          toast.error("Data biaya untuk tahun ini sudah ada.");
          return;
        }

        const { error } = await supabase
          .from('biaya')
          .insert([{ ...values, user_id: userId }]);

        if (error) throw error;
        toast.success("Data Biaya berhasil ditambahkan.");
      }
      await fetchBiaya(userId);
      setEditingBiaya(null);
      setIsDialogOpen(false);
      form.reset();
    } catch (error: any) {
      console.error(error);
      toast.error(`Terjadi kesalahan saat menyimpan data: ${error.message}`);
    }
  };

  const handleEdit = (biaya: Biaya) => {
    setEditingBiaya(biaya);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('biaya')
        .delete()
        .eq('id', id);

      if (error) throw error;
      if (userId) await fetchBiaya(userId);
      toast.success("Data Biaya berhasil dihapus.");
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
            const duplicateYears: number[] = [];
            
            for (const row of results.data) {
              const tahun = parseInt(row["Tahun"]);
              
              if (isNaN(tahun)) {
                toast.error("Tahun tidak valid dalam file CSV.");
                return;
              }
              
              // Check if tahun already exists in database
              const { data: existingData, error: checkError } = await supabase
                .from('biaya')
                .select('id')
                .eq('tahun', tahun)
                .eq('user_id', userId)
                .maybeSingle();
              
              if (checkError) throw checkError;
              
              if (existingData) {
                duplicateYears.push(tahun);
                continue;
              }
              
              // Check if tahun already exists in this import batch
              const isDuplicateInBatch = importedData.some(item => item.tahun === tahun);
              if (isDuplicateInBatch) {
                duplicateYears.push(tahun);
                continue;
              }
              
              importedData.push({
                tahun,
                biaya_gaji_tunjangan: parseFloat(row["Biaya Gaji dan Tunjangan"]) || 0,
                biaya_jasa_pelayanan: parseFloat(row["Biaya Jasa Pelayanan"]) || 0,
                biaya_obat: parseFloat(row["Biaya Obat"]) || 0,
                biaya_bhp: parseFloat(row["Biaya BHP"]) || 0,
                biaya_makan_karyawan: parseFloat(row["Biaya Bahan Makanan Karyawan"]) || 0,
                biaya_makan_pasien: parseFloat(row["Biaya Bahan Makanan Pasien"]) || 0,
                biaya_rumah_tangga: parseFloat(row["Biaya Alat Rumah Tangga"]) || 0,
                biaya_cetak: parseFloat(row["Biaya Cetak"]) || 0,
                biaya_atk: parseFloat(row["Biaya Alat Tulis Kantor"]) || 0,
                biaya_listrik: parseFloat(row["Biaya Listrik"]) || 0,
                biaya_air: parseFloat(row["Biaya Air"]) || 0,
                biaya_telp: parseFloat(row["Biaya Telepon"]) || 0,
                biaya_pemeliharaan_bangunan: parseFloat(row["Biaya Pemeliharaan Gedung dan Bangunan"]) || 0,
                biaya_pemeliharaan_alat_medis: parseFloat(row["Biaya Pemeliharaan Alat Medis"]) || 0,
                biaya_pemeliharaan_alat_non_medis: parseFloat(row["Biaya Pemeliharaan Alat Non Medis"]) || 0,
                biaya_operasional_lainnya: parseFloat(row["Biaya Operasional Lainnya"]) || 0,
                biaya_penyusutan_gedung: parseFloat(row["Biaya Penyusutan Gedung dan Bangunan"]) || 0,
                biaya_penyusutan_jaringan: parseFloat(row["Biaya Penyusutan Jaringan"]) || 0,
                biaya_penyusutan_alat_medis: parseFloat(row["Biaya Penyusutan Alat Medis"]) || 0,
                biaya_penyusutan_alat_non_medis: parseFloat(row["Biaya Penyusutan Alat Non Medis"]) || 0,
                biaya_pendidikan_pelatihan: parseFloat(row["Biaya Pendidikan Pelatihan"]) || 0,
                user_id: userId,
              });
            }
            
            if (duplicateYears.length > 0) {
              toast.error(`Data biaya untuk tahun berikut sudah ada: ${duplicateYears.join(", ")}`);
              return;
            }
            
            if (importedData.length === 0) {
              toast.warning("Tidak ada data valid untuk diimpor.");
              return;
            }

            const { error } = await supabase
              .from('biaya')
              .insert(importedData);

            if (error) throw error;
            if (userId) await fetchBiaya(userId);
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
      "Tahun",
      "Biaya Obat",
      "Biaya BHP",
      "Biaya Bahan Makanan Karyawan",
      "Biaya Bahan Makanan Pasien",
      "Biaya Alat Rumah Tangga",
      "Biaya Alat Tulis Kantor",
      "Biaya Cetak",
      "Biaya Gaji dan Tunjangan",
      "Biaya Jasa Pelayanan",
      "Biaya Air",
      "Biaya Listrik",
      "Biaya Telepon",
      "Biaya Pemeliharaan Gedung dan Bangunan",
      "Biaya Pemeliharaan Jaringan",
      "Biaya Pemeliharaan Alat Medis",
      "Biaya Pemeliharaan Alat Non Medis",
      "Biaya Penyusutan Gedung dan Bangunan",
      "Biaya Penyusutan Jaringan",
      "Biaya Penyusutan Alat Medis",
      "Biaya Penyusutan Alat Non Medis",
      "Biaya Operasional Lainnya",
      "Biaya Pendidikan Pelatihan"
    ];
    const csv = Papa.unparse([headers]);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    saveAs(blob, "template_biaya.csv");
    toast.info("Template impor data berhasil diunduh.");
  };

  const handleDownloadReport = () => {
    if (biayaList.length === 0) {
      toast.warning("Tidak ada data untuk dibuat laporan.");
      return;
    }

    const dataToExport = biayaList.map(item => ({
      "Tahun": item.tahun,
      "Biaya Obat": item.biaya_obat || 0,
      "Biaya BHP": item.biaya_bhp || 0,
      "Biaya Bahan Makanan Karyawan": item.biaya_makan_karyawan || 0,
      "Biaya Bahan Makanan Pasien": item.biaya_makan_pasien || 0,
      "Biaya Alat Rumah Tangga": item.biaya_rumah_tangga || 0,
      "Biaya Alat Tulis Kantor": item.biaya_atk || 0,
      "Biaya Cetak": item.biaya_cetak || 0,
      "Biaya Gaji dan Tunjangan": item.biaya_gaji_tunjangan || 0,
      "Biaya Jasa Pelayanan": item.biaya_jasa_pelayanan || 0,
      "Biaya Air": item.biaya_air || 0,
      "Biaya Listrik": item.biaya_listrik || 0,
      "Biaya Telepon": item.biaya_telp || 0,
      "Biaya Pemeliharaan Gedung dan Bangunan": item.biaya_pemeliharaan_bangunan || 0,
      "Biaya Pemeliharaan Jaringan": item.biaya_pemeliharaan_bangunan || 0,
      "Biaya Pemeliharaan Alat Medis": item.biaya_pemeliharaan_alat_medis || 0,
      "Biaya Pemeliharaan Alat Non Medis": item.biaya_pemeliharaan_alat_non_medis || 0,
      "Biaya Penyusutan Gedung dan Bangunan": item.biaya_penyusutan_gedung || 0,
      "Biaya Penyusutan Jaringan": item.biaya_penyusutan_jaringan || 0,
      "Biaya Penyusutan Alat Medis": item.biaya_penyusutan_alat_medis || 0,
      "Biaya Penyusutan Alat Non Medis": item.biaya_penyusutan_alat_non_medis || 0,
      "Biaya Operasional Lainnya": item.biaya_operasional_lainnya || 0,
      "Biaya Pendidikan Pelatihan": item.biaya_pendidikan_pelatihan || 0,
    }));

    const csv = Papa.unparse(dataToExport);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    saveAs(blob, "laporan_biaya.csv");
    toast.info("Laporan berhasil diunduh.");
  };

  // Format currency for display
  const formatCurrency = (value: number | null | undefined) => {
    if (value === null || value === undefined) return 'Rp0';
    return value.toLocaleString('id-ID', { style: 'currency', currency: 'IDR' });
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Manajemen Data Biaya</h2>
        <div className="flex gap-2">
          {userId && (
            <Button onClick={() => fetchBiaya(userId)} variant="outline" size="icon">
              <RefreshCw className="h-4 w-4" />
            </Button>
          )}
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setEditingBiaya(null)}>Tambah Data Biaya</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingBiaya ? "Edit Data Biaya" : "Tambah Data Biaya"}</DialogTitle>
                <DialogDescription>
                  {editingBiaya ? "Perbarui detail biaya tahunan." : "Tambahkan data biaya tahunan baru."}
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 py-4">
                  <FormField
                    control={form.control}
                    name="tahun"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tahun</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="Contoh: 2024" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <Accordion type="multiple" className="w-full">
                    <AccordionItem value="item-1">
                      <AccordionTrigger>Biaya Bahan</AccordionTrigger>
                      <AccordionContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="biaya_obat"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Biaya Obat</FormLabel>
                                <FormControl>
                                  <Input type="number" step="0.01" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name="biaya_bhp"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Biaya BHP</FormLabel>
                                <FormControl>
                                  <Input type="number" step="0.01" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name="biaya_makan_karyawan"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Biaya Bahan Makanan Karyawan</FormLabel>
                                <FormControl>
                                  <Input type="number" step="0.01" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name="biaya_makan_pasien"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Biaya Bahan Makanan Pasien</FormLabel>
                                <FormControl>
                                  <Input type="number" step="0.01" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name="biaya_rumah_tangga"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Biaya Alat Rumah Tangga</FormLabel>
                                <FormControl>
                                  <Input type="number" step="0.01" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name="biaya_atk"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Biaya Alat Tulis Kantor</FormLabel>
                                <FormControl>
                                  <Input type="number" step="0.01" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name="biaya_cetak"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Biaya Cetak</FormLabel>
                                <FormControl>
                                  <Input type="number" step="0.01" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                    
                    <AccordionItem value="item-2">
                      <AccordionTrigger>Biaya Pegawai</AccordionTrigger>
                      <AccordionContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="biaya_gaji_tunjangan"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Biaya Gaji dan Tunjangan</FormLabel>
                                <FormControl>
                                  <Input type="number" step="0.01" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name="biaya_jasa_pelayanan"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Biaya Jasa Pelayanan</FormLabel>
                                <FormControl>
                                  <Input type="number" step="0.01" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                    
                    <AccordionItem value="item-3">
                      <AccordionTrigger>Biaya Daya</AccordionTrigger>
                      <AccordionContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="biaya_air"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Biaya Air</FormLabel>
                                <FormControl>
                                  <Input type="number" step="0.01" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name="biaya_listrik"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Biaya Listrik</FormLabel>
                                <FormControl>
                                  <Input type="number" step="0.01" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name="biaya_telp"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Biaya Telepon</FormLabel>
                                <FormControl>
                                  <Input type="number" step="0.01" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                    
                    <AccordionItem value="item-4">
                      <AccordionTrigger>Biaya Pemeliharaan</AccordionTrigger>
                      <AccordionContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="biaya_pemeliharaan_bangunan"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Biaya Pemeliharaan Gedung dan Bangunan</FormLabel>
                                <FormControl>
                                  <Input type="number" step="0.01" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name="biaya_pemeliharaan_alat_medis"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Biaya Pemeliharaan Alat Medis</FormLabel>
                                <FormControl>
                                  <Input type="number" step="0.01" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name="biaya_pemeliharaan_alat_non_medis"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Biaya Pemeliharaan Alat Non Medis</FormLabel>
                                <FormControl>
                                  <Input type="number" step="0.01" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                    
                    <AccordionItem value="item-5">
                      <AccordionTrigger>Biaya Penyusutan</AccordionTrigger>
                      <AccordionContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="biaya_penyusutan_gedung"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Biaya Penyusutan Gedung dan Bangunan</FormLabel>
                                <FormControl>
                                  <Input type="number" step="0.01" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name="biaya_penyusutan_jaringan"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Biaya Penyusutan Jaringan</FormLabel>
                                <FormControl>
                                  <Input type="number" step="0.01" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name="biaya_penyusutan_alat_medis"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Biaya Penyusutan Alat Medis</FormLabel>
                                <FormControl>
                                  <Input type="number" step="0.01" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name="biaya_penyusutan_alat_non_medis"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Biaya Penyusutan Alat Non Medis</FormLabel>
                                <FormControl>
                                  <Input type="number" step="0.01" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                    
                    <AccordionItem value="item-6">
                      <AccordionTrigger>Biaya Operasional Lainnya</AccordionTrigger>
                      <AccordionContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="biaya_operasional_lainnya"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Biaya Operasional Lainnya</FormLabel>
                                <FormControl>
                                  <Input type="number" step="0.01" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name="biaya_pendidikan_pelatihan"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Biaya Pendidikan Pelatihan</FormLabel>
                                <FormControl>
                                  <Input type="number" step="0.01" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                  
                  <DialogFooter>
                    <Button type="submit">{editingBiaya ? "Simpan Perubahan" : "Tambah"}</Button>
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
        <Button onClick={handleDownloadReport} variant="outline">
          <FileText className="mr-2 h-4 w-4" /> Unduh Laporan
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tahun</TableHead>
              <TableHead>Biaya Bahan</TableHead>
              <TableHead>Biaya Pegawai</TableHead>
              <TableHead>Biaya Daya</TableHead>
              <TableHead>Biaya Pemeliharaan</TableHead>
              <TableHead>Biaya Penyusutan</TableHead>
              <TableHead>Biaya Operasional Lainnya</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} className="h-24 text-center">
                  Memuat data...
                </TableCell>
              </TableRow>
            ) : biayaList.length > 0 ? (
              biayaList.map((biaya) => (
                <TableRow key={biaya.id}>
                  <TableCell className="font-medium">{biaya.tahun}</TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div>Obat: {formatCurrency(biaya.biaya_obat)}</div>
                      <div>BHP: {formatCurrency(biaya.biaya_bhp)}</div>
                      <div>Makan Karyawan: {formatCurrency(biaya.biaya_makan_karyawan)}</div>
                      <div>Makan Pasien: {formatCurrency(biaya.biaya_makan_pasien)}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div>Gaji & Tunjangan: {formatCurrency(biaya.biaya_gaji_tunjangan)}</div>
                      <div>Jasa Pelayanan: {formatCurrency(biaya.biaya_jasa_pelayanan)}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div>Air: {formatCurrency(biaya.biaya_air)}</div>
                      <div>Listrik: {formatCurrency(biaya.biaya_listrik)}</div>
                      <div>Telepon: {formatCurrency(biaya.biaya_telp)}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div>Bangunan: {formatCurrency(biaya.biaya_pemeliharaan_bangunan)}</div>
                      <div>Alat Medis: {formatCurrency(biaya.biaya_pemeliharaan_alat_medis)}</div>
                      <div>Alat Non Medis: {formatCurrency(biaya.biaya_pemeliharaan_alat_non_medis)}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div>Gedung: {formatCurrency(biaya.biaya_penyusutan_gedung)}</div>
                      <div>Jaringan: {formatCurrency(biaya.biaya_penyusutan_jaringan)}</div>
                      <div>Alat Medis: {formatCurrency(biaya.biaya_penyusutan_alat_medis)}</div>
                      <div>Alat Non Medis: {formatCurrency(biaya.biaya_penyusutan_alat_non_medis)}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div>Lainnya: {formatCurrency(biaya.biaya_operasional_lainnya)}</div>
                      <div>Pelatihan: {formatCurrency(biaya.biaya_pendidikan_pelatihan)}</div>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(biaya)}
                      className="mr-2"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(biaya.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={8} className="h-24 text-center">
                  Tidak ada data biaya.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default BiayaFormTable;