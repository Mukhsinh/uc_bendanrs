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

  const handleImportData = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!userId) {
      toast.error("User tidak ditemukan. Silakan login kembali.");
      return;
    }

    const file = event.target.files?.[0];
    if (file) {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: async (results) => {
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
        error: (error: any) => {
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

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Kode Barang</TableHead>
              <TableHead>Klasifikasi</TableHead>
              <TableHead>Nama Barang</TableHead>
              <TableHead>Gudang</TableHead>
              <TableHead>Unit Kerja</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  Memuat data...
                </TableCell>
              </TableRow>
            ) : barangList.length > 0 ? (
              barangList.map((barang) => (
                <TableRow key={barang.id}>
                  <TableCell className="font-medium">{barang.kode}</TableCell>
                  <TableCell>{barang.klasifikasi}</TableCell>
                  <TableCell>{barang.nama}</TableCell>
                  <TableCell>{barang.gudang}</TableCell>
                  <TableCell>{barang.unit_kerja ? `${barang.unit_kerja.kode} - ${barang.unit_kerja.nama}` : "-"}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(barang)}
                      className="mr-2"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(barang.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  Tidak ada data barang.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default BarangFormTable;