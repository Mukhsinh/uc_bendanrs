import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

import { Button } from "@/components/ui/button";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Pencil, Trash2, Upload, Download, FileText, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const formSchema = z.object({
  kode_uk: z.string().min(1, "Kode UK harus diisi"),
  tahun: z.number().min(2000, "Tahun harus minimal 2000"),
  unit_kerja_id: z.string().min(1, "Unit Kerja harus dipilih"),
});

interface DataKegiatan {
  id?: string;
  kode_uk: string;
  tahun: number;
  unit_kerja_id: string;
  created_at?: string;
  updated_at?: string;
}

interface UnitKerja {
  id: string;
  kode_unit_kerja: string;
  nama_unit_kerja: string;
}

export default function DataKegiatanFormTable() {
  const [data, setData] = useState<DataKegiatan[]>([]);
  const [unitKerja, setUnitKerja] = useState<UnitKerja[]>([]);
  const [loading, setLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<DataKegiatan | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      kode_uk: "",
      tahun: new Date().getFullYear(),
      unit_kerja_id: "",
    },
  });

  // Load data
  const loadData = async () => {
    setLoading(true);
    try {
      const { data: kegiatan, error } = await supabase
        .from("Data_Kegiatan")
        .select(`
          *,
          unit_kerja:kode_uk
        `);

      if (error) throw error;
      setData(kegiatan || []);
    } catch (error) {
      console.error("Error loading data:", error);
      toast.error("Gagal memuat data");
    } finally {
      setLoading(false);
    }
  };

  // Load unit kerja
  const loadUnitKerja = async () => {
    try {
      const { data: units, error } = await supabase
        .from("unit_kerja")
        .select("*")
        .order("nama_unit_kerja");

      if (error) throw error;
      setUnitKerja(units || []);
    } catch (error) {
      console.error("Error loading unit kerja:", error);
      toast.error("Gagal memuat unit kerja");
    }
  };

  useEffect(() => {
    loadData();
    loadUnitKerja();
  }, []);

  // Handle form submit
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setLoading(true);
    try {
      if (editingItem) {
        // Update existing
        const { error } = await supabase
          .from("Data_Kegiatan")
          .update(values)
          .eq("id", editingItem.id);

        if (error) throw error;
        toast.success("Data berhasil diperbarui");
      } else {
        // Create new
        const { error } = await supabase
          .from("Data_Kegiatan")
          .insert([values]);

        if (error) throw error;
        toast.success("Data berhasil ditambahkan");
      }

      setIsDialogOpen(false);
      setEditingItem(null);
      form.reset();
      loadData();
    } catch (error) {
      console.error("Error saving data:", error);
      toast.error("Gagal menyimpan data");
    } finally {
      setLoading(false);
    }
  };

  // Handle edit
  const handleEdit = (item: DataKegiatan) => {
    setEditingItem(item);
    form.reset({
      kode_uk: item.kode_uk,
      tahun: item.tahun,
      unit_kerja_id: item.unit_kerja_id,
    });
    setIsDialogOpen(true);
  };

  // Handle delete
  const handleDelete = async (id: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus data ini?")) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from("Data_Kegiatan")
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
    setEditingItem(null);
    form.reset();
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Data Kegiatan
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 mb-4">
            <Dialog open={isDialogOpen} onOpenChange={handleDialogClose}>
              <DialogTrigger asChild>
                <Button>
                  <Pencil className="h-4 w-4 mr-2" />
                  Tambah Data
                </Button>
              </DialogTrigger>
              <DialogContent>
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
                    <FormField
                      control={form.control}
                      name="kode_uk"
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
                      name="unit_kerja_id"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Unit Kerja</FormLabel>
                          <FormControl>
                            <select
                              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                              {...field}
                            >
                              <option value="">Pilih Unit Kerja</option>
                              {unitKerja.map((unit) => (
                                <option key={unit.id} value={unit.id}>
                                  {unit.kode_unit_kerja} - {unit.nama_unit_kerja}
                                </option>
                              ))}
                            </select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
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
          </div>

          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Kode UK</TableHead>
                  <TableHead>Tahun</TableHead>
                  <TableHead>Unit Kerja</TableHead>
                  <TableHead>Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.kode_uk}</TableCell>
                    <TableCell>{item.tahun}</TableCell>
                    <TableCell>
                      {unitKerja.find(unit => unit.id === item.unit_kerja_id)?.nama_unit_kerja || "Unknown"}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(item)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDelete(item.id!)}
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
    </div>
  );
}
