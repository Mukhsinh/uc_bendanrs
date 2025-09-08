"use client";

import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import Papa from "papaparse";
import { saveAs } from "file-saver";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

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

interface UnitKerja {
  id: string;
  user_id: string;
  kode: string;
  nama: string;
  lokasi: string;
  luas_ruangan: number;
  kategori: "Pusat Biaya" | "Pusat Pendapatan";
  created_at?: string;
  updated_at?: string;
}

const formSchema = z.object({
  nama: z.string().min(1, { message: "Nama Unit Kerja harus diisi." }),
  lokasi: z.string().min(1, { message: "Lokasi Unit Kerja harus diisi." }),
  luas_ruangan: z.coerce.number().min(0, { message: "Luas Ruangan harus angka positif." }),
  kategori: z.enum(["Pusat Biaya", "Pusat Pendapatan"], {
    required_error: "Kategori harus dipilih.",
  }),
});

const UnitKerjaFormTable: React.FC = () => {
  const [unitKerjaList, setUnitKerjaList] = useState<UnitKerja[]>([]);
  const [editingUnitKerja, setEditingUnitKerja] = useState<UnitKerja | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [reportFilter, setReportFilter] = useState<"all" | "Pusat Biaya" | "Pusat Pendapatan">("all");
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nama: "",
      lokasi: "",
      luas_ruangan: 0,
      kategori: "Pusat Biaya",
    },
  });

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUserId(session.user.id);
        fetchUnitKerja(session.user.id);
      }
    };
    
    fetchUser();
  }, []);

  useEffect(() => {
    if (editingUnitKerja) {
      form.reset({
        nama: editingUnitKerja.nama,
        lokasi: editingUnitKerja.lokasi,
        luas_ruangan: editingUnitKerja.luas_ruangan,
        kategori: editingUnitKerja.kategori,
      });
    } else {
      form.reset({
        nama: "",
        lokasi: "",
        luas_ruangan: 0,
        kategori: "Pusat Biaya",
      });
    }
  }, [editingUnitKerja, form]);

  const fetchUnitKerja = async (currentUserId: string) => {
    setLoading(true);
    const { data, error } = await supabase
      .from('unit_kerja')
      .select('*')
      .eq('user_id', currentUserId)
      .order('created_at', { ascending: false });

    if (error) {
      toast.error("Gagal memuat data unit kerja.");
      console.error(error);
    } else {
      setUnitKerjaList(data || []);
    }
    setLoading(false);
  };

  const generateKodeUnitKerja = async (userId: string) => {
    // Get the latest unit kerja for this user to determine the next number
    const { data, error } = await supabase
      .from('unit_kerja')
      .select('kode')
      .eq('user_id', userId)
      .order('kode', { ascending: false })
      .limit(1);

    if (error) {
      console.error('Error fetching latest kode:', error);
      // If there's an error, start from UK001
      return 'UK001';
    }

    if (!data || data.length === 0) {
      // If no data exists, start from UK001
      return 'UK001';
    }

    // Extract the number from the latest kode and increment
    const latestKode = data[0].kode;
    const numberPart = parseInt(latestKode.substring(2));
    const nextNumber = numberPart + 1;
    return `UK${nextNumber.toString().padStart(3, '0')}`;
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!userId) {
      toast.error("User tidak ditemukan. Silakan login kembali.");
      return;
    }

    try {
      let kode: string;
      
      if (editingUnitKerja) {
        // For editing, keep the existing kode
        kode = editingUnitKerja.kode;
        const { error } = await supabase
          .from('unit_kerja')
          .update({ ...values, user_id: userId, kode })
          .eq('id', editingUnitKerja.id);

        if (error) throw error;
        toast.success("Data Unit Kerja berhasil diperbarui.");
      } else {
        // Generate new kode for new entries
        kode = await generateKodeUnitKerja(userId);
        
        // Check if kode already exists (shouldn't happen but just in case)
        const { data: existingData, error: checkError } = await supabase
          .from('unit_kerja')
          .select('id')
          .eq('kode', kode)
          .eq('user_id', userId)
          .maybeSingle();

        if (checkError) throw checkError;
        
        if (existingData) {
          // This should be very rare, but if it happens, generate a new one
          toast.error("Terjadi kesalahan saat membuat kode unit kerja. Silakan coba lagi.");
          return;
        }

        const { error } = await supabase
          .from('unit_kerja')
          .insert([{ ...values, user_id: userId, kode }]);

        if (error) throw error;
        toast.success("Data Unit Kerja berhasil ditambahkan.");
      }
      await fetchUnitKerja(userId);
      setEditingUnitKerja(null);
      setIsDialogOpen(false);
      form.reset();
    } catch (error: any) {
      console.error(error);
      toast.error("Terjadi kesalahan saat menyimpan data.");
    }
  };

  const handleEdit = (unitKerja: UnitKerja) => {
    setEditingUnitKerja(unitKerja);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('unit_kerja')
        .delete()
        .eq('id', id);

      if (error) throw error;
      if (userId) await fetchUnitKerja(userId);
      toast.success("Data Unit Kerja berhasil dihapus.");
    } catch (error: any) {
      console.error(error);
      toast.error("Terjadi kesalahan saat menghapus data.");
    }
  };

  const handleImportData = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!userId) {
      toast.error("User tidak ditemukan. Silakan login kembali.");
      return;
    }

    const file = event.target.files?.[0];
    if (file) {
      file.text().then((text) => {
        (Papa as any).parse(text, {
          header: true,
          skipEmptyLines: true,
          complete: async (results: Papa.ParseResult<any>) => {
            try {
              // Generate unique codes for each imported item
              const importedData: any[] = [];
              for (const row of results.data) {
                const kode = await generateKodeUnitKerja(userId);
                importedData.push({
                  kode,
                  nama: row["Nama Unit Kerja"] || "",
                  lokasi: row["Lokasi Unit Kerja"] || "",
                  luas_ruangan: parseFloat(row["Luas Ruangan (M2)"]) || 0,
                  kategori: row["Kategori"] === "Pusat Pendapatan" ? "Pusat Pendapatan" : "Pusat Biaya",
                  user_id: userId,
                });
              }

              const { error } = await supabase
                .from('unit_kerja')
                .insert(importedData);

              if (error) throw error;
              if (userId) await fetchUnitKerja(userId);
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
      });
    }
  };

  const handleDownloadTemplate = () => {
    const headers = ["Nama Unit Kerja", "Lokasi Unit Kerja", "Luas Ruangan (M2)", "Kategori"];
    const csv = Papa.unparse([headers]);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    saveAs(blob, "template_unit_kerja.csv");
    toast.info("Template impor data berhasil diunduh.");
  };

  const handleDownloadReport = () => {
    const filteredData = unitKerjaList.filter(item =>
      reportFilter === "all" ? true : item.kategori === reportFilter
    );

    if (filteredData.length === 0) {
      toast.warning("Tidak ada data untuk dibuat laporan dengan filter ini.");
      return;
    }

    const dataToExport = filteredData.map(item => ({
      "Kode Unit Kerja": item.kode,
      "Nama Unit Kerja": item.nama,
      "Lokasi Unit Kerja": item.lokasi,
      "Luas Ruangan (M2)": item.luas_ruangan,
      "Kategori": item.kategori,
    }));

    const csv = Papa.unparse(dataToExport);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    saveAs(blob, `laporan_unit_kerja_${reportFilter.replace(/\s/g, '_')}.csv`);
    toast.info("Laporan berhasil diunduh.");
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Manajemen Data Unit Kerja</h2>
        <div className="flex gap-2">
          {userId && (
            <Button onClick={() => fetchUnitKerja(userId)} variant="outline" size="icon">
              <RefreshCw className="h-4 w-4" />
            </Button>
          )}
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setEditingUnitKerja(null)}>Tambah Data Unit Kerja</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>{editingUnitKerja ? "Edit Data Unit Kerja" : "Tambah Data Unit Kerja"}</DialogTitle>
                <DialogDescription>
                  {editingUnitKerja ? "Perbarui detail unit kerja." : "Tambahkan unit kerja baru ke sistem."}
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 py-4">
                  <FormField
                    control={form.control}
                    name="nama"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nama Unit Kerja</FormLabel>
                        <FormControl>
                          <Input placeholder="Contoh: IGD" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="lokasi"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Lokasi Unit Kerja</FormLabel>
                        <FormControl>
                          <Input placeholder="Contoh: Gedung A Lantai 1" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="luas_ruangan"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Luas Ruangan (M2)</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="kategori"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Kategori</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Pilih Kategori" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Pusat Biaya">Pusat Biaya</SelectItem>
                            <SelectItem value="Pusat Pendapatan">Pusat Pendapatan</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <DialogFooter>
                    <Button type="submit">{editingUnitKerja ? "Simpan Perubahan" : "Tambah"}</Button>
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
          <Select onValueChange={(value: "all" | "Pusat Biaya" | "Pusat Pendapatan") => setReportFilter(value)} defaultValue={reportFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter Kategori" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Kategori</SelectItem>
              <SelectItem value="Pusat Biaya">Pusat Biaya</SelectItem>
              <SelectItem value="Pusat Pendapatan">Pusat Pendapatan</SelectItem>
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
              <TableHead>Kode Unit Kerja</TableHead>
              <TableHead>Nama Unit Kerja</TableHead>
              <TableHead>Lokasi Unit Kerja</TableHead>
              <TableHead>Luas Ruangan (M2)</TableHead>
              <TableHead>Kategori</TableHead>
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
            ) : unitKerjaList.length > 0 ? (
              unitKerjaList.map((unitKerja) => (
                <TableRow key={unitKerja.id}>
                  <TableCell className="font-medium">{unitKerja.kode}</TableCell>
                  <TableCell>{unitKerja.nama}</TableCell>
                  <TableCell>{unitKerja.lokasi}</TableCell>
                  <TableCell>{unitKerja.luas_ruangan}</TableCell>
                  <TableCell>{unitKerja.kategori}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(unitKerja)}
                      className="mr-2"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(unitKerja.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  Tidak ada data unit kerja.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default UnitKerjaFormTable;