"use client";

import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { v4 as uuidv4 } from "uuid";
import Papa from "papaparse";
import { saveAs } from "file-saver";
import { toast } from "sonner";

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
import { Pencil, Trash2, Upload, Download, FileText } from "lucide-react";

interface UnitKerja {
  id: string;
  kode: string;
  nama: string;
  lokasi: string;
  luasRuangan: number;
  kategori: "Pusat Biaya" | "Pusat Pendapatan";
}

const formSchema = z.object({
  kode: z.string().min(1, { message: "Kode Unit Kerja harus diisi." }),
  nama: z.string().min(1, { message: "Nama Unit Kerja harus diisi." }),
  lokasi: z.string().min(1, { message: "Lokasi Unit Kerja harus diisi." }),
  luasRuangan: z.coerce.number().min(0, { message: "Luas Ruangan harus angka positif." }),
  kategori: z.enum(["Pusat Biaya", "Pusat Pendapatan"], {
    required_error: "Kategori harus dipilih.",
  }),
});

const UnitKerjaFormTable: React.FC = () => {
  const [unitKerjaList, setUnitKerjaList] = useState<UnitKerja[]>([]);
  const [editingUnitKerja, setEditingUnitKerja] = useState<UnitKerja | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [reportFilter, setReportFilter] = useState<"all" | "Pusat Biaya" | "Pusat Pendapatan">("all");

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      kode: "",
      nama: "",
      lokasi: "",
      luasRuangan: 0,
      kategori: "Pusat Biaya",
    },
  });

  useEffect(() => {
    if (editingUnitKerja) {
      form.reset(editingUnitKerja);
    } else {
      form.reset({
        kode: "",
        nama: "",
        lokasi: "",
        luasRuangan: 0,
        kategori: "Pusat Biaya",
      });
    }
  }, [editingUnitKerja, form]);

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    if (editingUnitKerja) {
      setUnitKerjaList(
        unitKerjaList.map((item) =>
          item.id === editingUnitKerja.id ? { ...values, id: item.id } : item
        )
      );
      toast.success("Data Unit Kerja berhasil diperbarui.");
    } else {
      setUnitKerjaList([...unitKerjaList, { ...values, id: uuidv4() }]);
      toast.success("Data Unit Kerja berhasil ditambahkan.");
    }
    setEditingUnitKerja(null);
    setIsDialogOpen(false);
    form.reset();
  };

  const handleEdit = (unitKerja: UnitKerja) => {
    setEditingUnitKerja(unitKerja);
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    setUnitKerjaList(unitKerjaList.filter((item) => item.id !== id));
    toast.success("Data Unit Kerja berhasil dihapus.");
  };

  const handleImportData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          const importedData: UnitKerja[] = results.data.map((row: any) => ({
            id: uuidv4(),
            kode: row["Kode Unit Kerja"] || "",
            nama: row["Nama Unit Kerja"] || "",
            lokasi: row["Lokasi Unit Kerja"] || "",
            luasRuangan: parseFloat(row["Luas Ruangan (M2)"]) || 0,
            kategori: row["Kategori"] === "Pusat Pendapatan" ? "Pusat Pendapatan" : "Pusat Biaya",
          }));
          setUnitKerjaList((prev) => [...prev, ...importedData]);
          toast.success(`${importedData.length} data berhasil diimpor.`);
        },
        error: (error) => {
          toast.error(`Gagal mengimpor data: ${error.message}`);
        }
      });
    }
  };

  const handleDownloadTemplate = () => {
    const headers = ["Kode Unit Kerja", "Nama Unit Kerja", "Lokasi Unit Kerja", "Luas Ruangan (M2)", "Kategori"];
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
      "Luas Ruangan (M2)": item.luasRuangan,
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
                  name="kode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Kode Unit Kerja</FormLabel>
                      <FormControl>
                        <Input placeholder="Contoh: UK001" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
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
                  name="luasRuangan"
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
            {unitKerjaList.length > 0 ? (
              unitKerjaList.map((unitKerja) => (
                <TableRow key={unitKerja.id}>
                  <TableCell className="font-medium">{unitKerja.kode}</TableCell>
                  <TableCell>{unitKerja.nama}</TableCell>
                  <TableCell>{unitKerja.lokasi}</TableCell>
                  <TableCell>{unitKerja.luasRuangan}</TableCell>
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