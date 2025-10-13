"use client";

import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import Papa from "papaparse";
import { saveAs } from "file-saver";
import * as XLSX from "xlsx";
import { toast } from "sonner";
import { LoadingButton } from "@/components/ui/loading-button";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useFormOperations } from "@/hooks/use-form-operations";
import { showSuccess, showError, showLoading, showInfo, NotificationMessages } from "@/utils/notifications";
import { supabase } from "@/integrations/supabase/client";

import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Pencil, Trash2, Upload, Download, FileText, RefreshCw, Plus, X, Search, Loader2, Clock, Star, AlertTriangle } from "lucide-react";

interface BahanTindakan {
  nama: string;
  jumlah: number;
  satuan: string;
  harga_satuan: number;
  harga_total: number;
}

interface DaftarTindakan {
  id: string;
  kode_tindakan: string;
  nama_tindakan: string;
  medis: boolean;
  paramedis: boolean;
  waktu?: number;
  profesionalisme?: number;
  tingkat_kesulitan?: number;
  bahan_tindakan?: BahanTindakan[] | null;
  biaya_bahan_tindakan?: number;
  created_at?: string;
}

interface BarangFarmasi {
  id: string;
  kode_barang: string;
  nama_barang: string;
  satuan: string;
  harga: number;
  gudang: string;
}

const formSchema = z.object({
  kode_tindakan: z.string().optional(),
  nama_tindakan: z.string().min(1, { message: "Nama wajib." }),
  medis: z.boolean().default(false),
  paramedis: z.boolean().default(false),
  waktu: z.number().min(0, { message: "Waktu tidak boleh negatif" }).optional(),
  profesionalisme: z.number().min(1).max(4, { message: "Profesionalisme harus antara 1-4" }).optional(),
  tingkat_kesulitan: z.number().min(1).max(5, { message: "Tingkat kesulitan harus antara 1-5" }).optional(),
}).refine((data) => data.medis || data.paramedis, {
  message: "Minimal satu pelaksana harus dipilih (Medis atau Paramedis)",
  path: ["medis"],
});

const DaftarTindakanFormTable: React.FC = () => {
  const [list, setList] = useState<DaftarTindakan[]>([]);
  const [editing, setEditing] = useState<DaftarTindakan | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [filterPelaksana, setFilterPelaksana] = useState<"all" | "medis" | "paramedis">("all");
  const [searchTerm, setSearchTerm] = useState("");
  
  // Bahan Tindakan states
  const [bahanList, setBahanList] = useState<BahanTindakan[]>([]);
  const [showBahanDialog, setShowBahanDialog] = useState(false);
  const [searchBarangTerm, setSearchBarangTerm] = useState("");
  const [searchResults, setSearchResults] = useState<BarangFarmasi[]>([]);
  const [selectedBarang, setSelectedBarang] = useState<BarangFarmasi | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [bahanJumlah, setBahanJumlah] = useState(1);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { 
      kode_tindakan: "", 
      nama_tindakan: "", 
      medis: false, 
      paramedis: false,
      waktu: 0,
      profesionalisme: 1,
      tingkat_kesulitan: 1,
    },
  });

  useEffect(() => { fetchAll(); }, []);

  useEffect(() => {
    if (editing) {
      form.reset({ 
        kode_tindakan: editing.kode_tindakan, 
        nama_tindakan: editing.nama_tindakan, 
        medis: editing.medis, 
        paramedis: editing.paramedis,
        waktu: editing.waktu || 0,
        profesionalisme: editing.profesionalisme || 1,
        tingkat_kesulitan: editing.tingkat_kesulitan || 1,
      });
      setBahanList(editing.bahan_tindakan || []);
    } else {
      form.reset({ 
        kode_tindakan: "", 
        nama_tindakan: "", 
        medis: false, 
        paramedis: false,
        waktu: 0,
        profesionalisme: 1,
        tingkat_kesulitan: 1,
      });
      setBahanList([]);
    }
  }, [editing, form]);

  const fetchAll = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("daftar_tindakan")
      .select("id, kode_tindakan, nama_tindakan, medis, paramedis, waktu, profesionalisme, tingkat_kesulitan, bahan_tindakan, biaya_bahan_tindakan, created_at")
      .order("created_at", { ascending: false });
    if (error) { toast.error("Gagal memuat data."); console.error(error); setList([]); }
    else setList(data || []);
    setLoading(false);
  };

  const searchBarangFarmasi = async (term: string) => {
    if (term.length < 2) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const { data, error } = await supabase
        .from('data_barang_farmasi')
        .select('id, kode_barang, nama_barang, satuan, harga, gudang')
        .or(`nama_barang.ilike.%${term}%,kode_barang.ilike.%${term}%`)
        .limit(10);

      if (error) throw error;
      
      setSearchResults(data || []);
      setShowResults(true);
    } catch (error) {
      console.error('Error searching barang farmasi:', error);
      toast.error('Gagal mencari barang farmasi');
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearchBarangChange = (value: string) => {
    setSearchBarangTerm(value);
    if (selectedBarang) {
      setSelectedBarang(null);
    }
    searchBarangFarmasi(value);
  };

  const handleBarangSelect = (barang: BarangFarmasi) => {
    setSelectedBarang(barang);
    setSearchBarangTerm(`${barang.nama_barang} (${barang.kode_barang})`);
    setShowResults(false);
  };

  const handleAddBahan = () => {
    if (!selectedBarang) {
      toast.error('Pilih barang farmasi terlebih dahulu');
      return;
    }

    if (bahanJumlah <= 0) {
      toast.error('Jumlah harus lebih dari 0');
      return;
    }

    const newBahan: BahanTindakan = {
      nama: selectedBarang.nama_barang,
      jumlah: bahanJumlah,
      satuan: selectedBarang.satuan,
      harga_satuan: selectedBarang.harga,
      harga_total: selectedBarang.harga * bahanJumlah
    };

    setBahanList([...bahanList, newBahan]);
    
    setSearchBarangTerm("");
    setSelectedBarang(null);
    setBahanJumlah(1);
    setShowBahanDialog(false);
    
    toast.success('Bahan berhasil ditambahkan');
  };

  const handleRemoveBahan = (index: number) => {
    const newList = bahanList.filter((_, i) => i !== index);
    setBahanList(newList);
    toast.info('Bahan dihapus');
  };

  const calculateTotalBiayaBahan = () => {
    return bahanList.reduce((total, bahan) => total + bahan.harga_total, 0);
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      const payload = {
        kode_tindakan: editing ? values.kode_tindakan : null,
        nama_tindakan: values.nama_tindakan,
        medis: values.medis,
        paramedis: values.paramedis,
        waktu: values.waktu || 0,
        profesionalisme: values.profesionalisme || 1,
        tingkat_kesulitan: values.tingkat_kesulitan || 1,
        bahan_tindakan: bahanList.length > 0 ? bahanList : null
      };

      if (editing) {
        const { error } = await supabase
          .from("daftar_tindakan")
          .update(payload)
          .eq("id", editing.id);
        if (error) throw error;
        toast.success("Data diperbarui.");
      } else {
        const { error } = await supabase
          .from("daftar_tindakan")
          .insert([payload]);
        if (error) throw error;
        toast.success("Data ditambahkan dengan kode otomatis.");
      }
      await fetchAll();
      setEditing(null);
      setIsDialogOpen(false);
      form.reset();
      setBahanList([]);
    } catch (err: any) {
      console.error(err);
      toast.error(`Gagal menyimpan: ${err.message}`);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from("daftar_tindakan").delete().eq("id", id);
      if (error) throw error;
      await fetchAll();
      toast.success("Data dihapus.");
    } catch (err: any) {
      console.error(err);
      toast.error(`Gagal menghapus: ${err.message}`);
    }
  };

  const handleDownloadTemplate = () => {
    const headers = [
      "Nama Tindakan", 
      "Medis (true/false)", 
      "Paramedis (true/false)",
      "Waktu (menit)",
      "Profesionalisme (1-4)",
      "Tingkat Kesulitan (1-5)"
    ];
    const sampleData = [
      ["Konsultasi Dokter Umum", "true", "false", "15", "2", "2"],
      ["Pemeriksaan Tekanan Darah", "false", "true", "5", "1", "1"],
      ["Pemberian Obat", "true", "true", "10", "2", "2"],
      ["Operasi Kecil", "true", "false", "60", "4", "4"]
    ];
    const ws = XLSX.utils.aoa_to_sheet([headers, ...sampleData]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template Daftar Tindakan");
    XLSX.writeFile(wb, "template_daftar_tindakan.xlsx");
    toast.info("Template impor diunduh. Kode tindakan akan otomatis digenerate.");
  };

  const handleImportData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    file.text().then((text) => {
      (Papa as any).parse(text, {
        header: true,
        skipEmptyLines: true,
        complete: async (results: Papa.ParseResult<any>) => {
          try {
            const rows: any[] = [];
            let skippedRows = 0;
            
            for (const row of results.data) {
              const nama = (row["Nama Tindakan"] || "").toString().trim();
              const medis = (row["Medis (true/false)"] || "false").toString().toLowerCase() === "true";
              const paramedis = (row["Paramedis (true/false)"] || "false").toString().toLowerCase() === "true";
              const waktu = parseInt(row["Waktu (menit)"] || "0") || 0;
              const profesionalisme = parseInt(row["Profesionalisme (1-4)"] || "1") || 1;
              const tingkat_kesulitan = parseInt(row["Tingkat Kesulitan (1-5)"] || "1") || 1;
              
              if (!nama || (!medis && !paramedis)) {
                skippedRows++;
                continue;
              }
              
              // Validate ranges
              if (profesionalisme < 1 || profesionalisme > 4) {
                skippedRows++;
                continue;
              }
              if (tingkat_kesulitan < 1 || tingkat_kesulitan > 5) {
                skippedRows++;
                continue;
              }
              
              rows.push({ 
                kode_tindakan: null,
                nama_tindakan: nama, 
                medis: medis,
                paramedis: paramedis,
                waktu: waktu,
                profesionalisme: profesionalisme,
                tingkat_kesulitan: tingkat_kesulitan
              });
            }
            
            if (rows.length === 0) { 
              toast.warning("Tidak ada data valid untuk diimpor."); 
              return; 
            }
            
            const { error } = await supabase.from("daftar_tindakan").insert(rows);
            if (error) throw error;
            
            await fetchAll();
            
            let message = `${rows.length} data berhasil diimpor dengan kode otomatis.`;
            if (skippedRows > 0) {
              message += ` ${skippedRows} baris dilewati karena data tidak valid.`;
            }
            toast.success(message);
          } catch (err: any) {
            console.error(err);
            toast.error(`Gagal impor: ${err.message}`);
          }
        },
        error: (error: Papa.ParseError) => toast.error(`Gagal impor: ${error.message}`),
      });
    });
  };

  const handleDownloadReport = () => {
    const data = list
      .filter(item => {
        if (filterPelaksana === "all") return true;
        if (filterPelaksana === "medis") return item.medis;
        if (filterPelaksana === "paramedis") return item.paramedis;
        return true;
      })
      .map(item => ({ 
        Kode: item.kode_tindakan, 
        Nama: item.nama_tindakan,
        Medis: item.medis ? "Ya" : "Tidak",
        Paramedis: item.paramedis ? "Ya" : "Tidak",
        "Waktu (menit)": item.waktu || 0,
        "Profesionalisme (1-4)": item.profesionalisme || 1,
        "Tingkat Kesulitan (1-5)": item.tingkat_kesulitan || 1,
        "Biaya Bahan": item.biaya_bahan_tindakan || 0
      }));
    if (data.length === 0) { toast.warning("Tidak ada data untuk laporan."); return; }
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Laporan Daftar Tindakan");
    XLSX.writeFile(wb, `laporan_daftar_tindakan_${filterPelaksana}.xlsx`);
    toast.info("Laporan diunduh.");
  };

  const getProfesionalismeLabel = (level: number) => {
    const labels: Record<number, string> = {
      1: "Dasar",
      2: "Menengah",
      3: "Tinggi",
      4: "Ahli"
    };
    return labels[level] || "Tidak diketahui";
  };

  const getTingkatKesulitanLabel = (level: number) => {
    const labels: Record<number, string> = {
      1: "Sangat Mudah",
      2: "Mudah",
      3: "Sedang",
      4: "Sulit",
      5: "Sangat Sulit"
    };
    return labels[level] || "Tidak diketahui";
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold">Manajemen Daftar Tindakan</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Kode tindakan otomatis digenerate dengan format T.001, T.002, dst.
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => fetchAll()} variant="outline" size="icon"><RefreshCw className="h-4 w-4" /></Button>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setEditing(null)}>Tambah Tindakan</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editing ? "Edit Tindakan" : "Tambah Tindakan"}</DialogTitle>
                <DialogDescription>
                  {editing ? "Perbarui detail tindakan." : "Tambahkan tindakan baru dengan informasi lengkap."}
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 py-4">
                  {editing && (
                    <FormField
                      control={form.control}
                      name="kode_tindakan"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Kode Tindakan</FormLabel>
                          <FormControl>
                            <Input placeholder="T.001" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                  {!editing && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Kode Tindakan</label>
                      <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                        <div className="flex items-center gap-2 text-sm text-blue-800">
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          <span className="font-medium">Auto-Generate Aktif</span>
                        </div>
                        <p className="text-sm text-blue-600 mt-1">
                          Kode akan otomatis digenerate: T.001, T.002, T.003, dst.
                        </p>
                      </div>
                    </div>
                  )}
                  
                  <FormField
                    control={form.control}
                    name="nama_tindakan"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nama Tindakan</FormLabel>
                        <FormControl>
                          <Input placeholder="Contoh: Konsultasi Dokter, Pemeriksaan Fisik, Operasi Kecil" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="waktu"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Waktu (menit)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              min="0"
                              placeholder="0" 
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                            />
                          </FormControl>
                          <FormDescription className="text-xs">
                            Durasi pelaksanaan
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="profesionalisme"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Profesionalisme</FormLabel>
                          <Select 
                            onValueChange={(v) => field.onChange(parseInt(v))} 
                            defaultValue={field.value?.toString()}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Pilih level" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="1">1 - Dasar</SelectItem>
                              <SelectItem value="2">2 - Menengah</SelectItem>
                              <SelectItem value="3">3 - Tinggi</SelectItem>
                              <SelectItem value="4">4 - Ahli</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormDescription className="text-xs">
                            Level keahlian
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="tingkat_kesulitan"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tingkat Kesulitan</FormLabel>
                          <Select 
                            onValueChange={(v) => field.onChange(parseInt(v))} 
                            defaultValue={field.value?.toString()}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Pilih level" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="1">1 - Sangat Mudah</SelectItem>
                              <SelectItem value="2">2 - Mudah</SelectItem>
                              <SelectItem value="3">3 - Sedang</SelectItem>
                              <SelectItem value="4">4 - Sulit</SelectItem>
                              <SelectItem value="5">5 - Sangat Sulit</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormDescription className="text-xs">
                            Level kompleksitas
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="medis"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              className="border-blue-500 data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500"
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel className="text-blue-700 font-medium">Medis</FormLabel>
                            <p className="text-sm text-muted-foreground">
                              Dokter, Spesialis, atau tenaga medis
                            </p>
                          </div>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="paramedis"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              className="border-green-500 data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500"
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel className="text-green-700 font-medium">Paramedis</FormLabel>
                            <p className="text-sm text-muted-foreground">
                              Perawat, Bidan, atau tenaga paramedis
                            </p>
                          </div>
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Bahan Tindakan Section */}
                  <div className="border-t pt-4 mt-4">
                    <div className="flex justify-between items-center mb-3">
                      <div>
                        <h4 className="font-semibold text-sm">Bahan Tindakan</h4>
                        <p className="text-xs text-muted-foreground">Tambahkan bahan dari master barang farmasi</p>
                      </div>
                      <Button 
                        type="button" 
                        size="sm" 
                        variant="outline"
                        onClick={() => setShowBahanDialog(true)}
                      >
                        <Plus className="h-4 w-4 mr-1" /> Tambah Bahan
                      </Button>
                    </div>

                    {bahanList.length > 0 ? (
                      <div className="space-y-2">
                        {bahanList.map((bahan, index) => (
                          <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded border">
                            <div className="flex-1">
                              <div className="font-medium text-sm">{bahan.nama}</div>
                              <div className="text-xs text-muted-foreground">
                                {bahan.jumlah} {bahan.satuan} × Rp {bahan.harga_satuan.toLocaleString()} = Rp {bahan.harga_total.toLocaleString()}
                              </div>
                            </div>
                            <Button 
                              type="button" 
                              size="icon" 
                              variant="ghost"
                              onClick={() => handleRemoveBahan(index)}
                            >
                              <X className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        ))}
                        <div className="flex justify-between items-center p-2 bg-blue-50 border border-blue-200 rounded font-semibold text-sm">
                          <span>Total Biaya Bahan:</span>
                          <span className="text-blue-700">Rp {calculateTotalBiayaBahan().toLocaleString()}</span>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground italic text-center py-2">
                        Belum ada bahan ditambahkan
                      </p>
                    )}
                  </div>

                  <DialogFooter><Button type="submit">{editing ? "Simpan Perubahan" : "Tambah"}</Button></DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-4 items-center">
        <Select onValueChange={(v: any) => setFilterPelaksana(v)} defaultValue={filterPelaksana}>
          <SelectTrigger className="w-[200px]"><SelectValue placeholder="Filter Pelaksana" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Pelaksana</SelectItem>
            <SelectItem value="medis">Medis</SelectItem>
            <SelectItem value="paramedis">Paramedis</SelectItem>
          </SelectContent>
        </Select>
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari nama atau kode tindakan..."
            className="pl-10 w-[300px]"
          />
        </div>
        <Button onClick={handleDownloadTemplate} variant="outline">
          <Download className="mr-2 h-4 w-4" /> 
          Unduh Template CSV
        </Button>
        <label htmlFor="import-file-daftar-tindakan" className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2 cursor-pointer">
          <Upload className="mr-2 h-4 w-4" /> Impor Data
          <Input id="import-file-daftar-tindakan" type="file" accept=".csv" onChange={handleImportData} className="sr-only" />
        </label>
        <Button onClick={handleDownloadReport} variant="outline"><FileText className="mr-2 h-4 w-4" /> Unduh Laporan</Button>
      </div>

      {/* Dialog for Adding Bahan */}
      <Dialog open={showBahanDialog} onOpenChange={setShowBahanDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Tambah Bahan Tindakan</DialogTitle>
            <DialogDescription>
              Cari dan pilih barang dari master barang farmasi
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="relative">
              <label className="text-sm font-medium">Cari Barang Farmasi</label>
              <div className="relative mt-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  value={searchBarangTerm}
                  onChange={(e) => handleSearchBarangChange(e.target.value)}
                  placeholder="Ketik nama atau kode barang..."
                  className="pl-10"
                />
                {isSearching && (
                  <Loader2 className="absolute right-3 top-3 h-4 w-4 animate-spin text-gray-400" />
                )}
              </div>
              
              {showResults && searchResults.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                  {searchResults.map((barang) => (
                    <div
                      key={barang.id}
                      className="px-4 py-2 hover:bg-gray-100 cursor-pointer border-b border-gray-100"
                      onClick={() => handleBarangSelect(barang)}
                    >
                      <div className="font-medium">{barang.nama_barang}</div>
                      <div className="text-sm text-gray-500">
                        {barang.kode_barang} - {barang.satuan} - {barang.gudang} - Rp {barang.harga?.toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {selectedBarang && (
              <div className="p-3 bg-green-50 border border-green-200 rounded">
                <div className="font-medium text-sm">Barang Terpilih:</div>
                <div className="text-sm">{selectedBarang.nama_barang}</div>
                <div className="text-xs text-muted-foreground">
                  {selectedBarang.kode_barang} - {selectedBarang.satuan} - Rp {selectedBarang.harga.toLocaleString()}
                </div>
              </div>
            )}

            <div>
              <label className="text-sm font-medium">Jumlah</label>
              <Input
                type="number"
                min="1"
                value={bahanJumlah}
                onChange={(e) => setBahanJumlah(parseInt(e.target.value) || 1)}
                className="mt-1"
              />
            </div>

            {selectedBarang && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded">
                <div className="font-semibold text-sm">Total Harga:</div>
                <div className="text-lg font-bold text-blue-700">
                  Rp {(selectedBarang.harga * bahanJumlah).toLocaleString()}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {bahanJumlah} × Rp {selectedBarang.harga.toLocaleString()}
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowBahanDialog(false);
              setSearchBarangTerm("");
              setSelectedBarang(null);
              setBahanJumlah(1);
            }}>
              Batal
            </Button>
            <Button 
              onClick={handleAddBahan}
              disabled={!selectedBarang || bahanJumlah <= 0}
            >
              Tambah Bahan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Kode</TableHead>
              <TableHead>Nama Tindakan</TableHead>
              <TableHead className="text-center">
                <div className="flex items-center justify-center gap-1">
                  <Clock className="h-3 w-3" />
                  Waktu
                </div>
              </TableHead>
              <TableHead className="text-center">
                <div className="flex items-center justify-center gap-1">
                  <Star className="h-3 w-3" />
                  Prof.
                </div>
              </TableHead>
              <TableHead className="text-center">
                <div className="flex items-center justify-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  Kesulitan
                </div>
              </TableHead>
              <TableHead>Pelaksana</TableHead>
              <TableHead className="text-right">Biaya Bahan</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={8} className="h-24 text-center">Memuat data...</TableCell></TableRow>
            ) : (
              list
                .filter(item => {
                  if (filterPelaksana === "all") return true;
                  if (filterPelaksana === "medis") return item.medis;
                  if (filterPelaksana === "paramedis") return item.paramedis;
                  return true;
                })
                .filter(item => {
                  if (!searchTerm) return true;
                  const term = searchTerm.toLowerCase();
                  return (
                    (item.nama_tindakan || "").toLowerCase().includes(term) ||
                    (item.kode_tindakan || "").toLowerCase().includes(term)
                  );
                })
                .map(item => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.kode_tindakan}</TableCell>
                  <TableCell>
                    <div>{item.nama_tindakan}</div>
                    {item.bahan_tindakan && item.bahan_tindakan.length > 0 && (
                      <div className="text-xs text-muted-foreground mt-1">
                        {item.bahan_tindakan.length} bahan tindakan
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="outline">{item.waktu || 0} mnt</Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="secondary">{item.profesionalisme || 1}</Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="secondary">{item.tingkat_kesulitan || 1}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {item.medis && <Badge className="text-xs bg-blue-500 text-white hover:bg-blue-600">Medis</Badge>}
                      {item.paramedis && <Badge className="text-xs bg-green-500 text-white hover:bg-green-600">Paramedis</Badge>}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    {item.biaya_bahan_tindakan ? (
                      <span className="font-medium text-green-700">
                        Rp {item.biaya_bahan_tindakan.toLocaleString()}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => { setEditing(item); setIsDialogOpen(true); }} className="mr-2"><Pencil className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)}><Trash2 className="h-4 w-4" /></Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default DaftarTindakanFormTable;
