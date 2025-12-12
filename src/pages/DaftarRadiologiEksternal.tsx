import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Trash2, Edit, Plus, Upload, Download, FileText } from "lucide-react";
import * as XLSX from "xlsx";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useReportDownload } from "@/components/report";
import Papa from "papaparse";

interface RadiologiEksternal {
  id: string;
  tenant_id: string;
  user_id: string;
  tahun: number;
  kode_pemeriksaan: string;
  nama_pemeriksaan: string;
  jasa_sarana: number;
  jp_medis: number;
  jp_non_medis: number;
  tarif: number;
  created_at: string;
  updated_at: string;
}

const DaftarRadiologiEksternal = () => {
  const { toast } = useToast();
  const { downloadReport } = useReportDownload();
  const [data, setData] = useState<RadiologiEksternal[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [tahun, setTahun] = useState(new Date().getFullYear());
  const [searchQuery, setSearchQuery] = useState("");
  const [formData, setFormData] = useState<Partial<RadiologiEksternal>>({
    tahun: new Date().getFullYear(),
    kode_pemeriksaan: "",
    nama_pemeriksaan: "",
    jasa_sarana: 0,
    jp_medis: 0,
    jp_non_medis: 0,
  });

  useEffect(() => {
    fetchData();
  }, [tahun]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const { data: result, error } = await supabase
        .from("daftar_radiologi_eksternal")
        .select("*")
        .eq("tahun", tahun)
        .order("kode_pemeriksaan", { ascending: true });

      if (error) throw error;
      setData(result || []);
    } catch (error: any) {
      toast({
        title: "Error fetching data",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const dataToSave = {
        ...formData,
        user_id: user.id,
        tahun,
      };

      if (editingId) {
        const { error } = await supabase
          .from("daftar_radiologi_eksternal")
          .update(dataToSave)
          .eq("id", editingId);

        if (error) throw error;
        toast({ title: "Berhasil", description: "Data berhasil diupdate" });
      } else {
        const { error } = await supabase
          .from("daftar_radiologi_eksternal")
          .insert(dataToSave);

        if (error) throw error;
        toast({ title: "Berhasil", description: "Data berhasil ditambahkan" });
      }

      setDialogOpen(false);
      setEditingId(null);
      setFormData({
        tahun: new Date().getFullYear(),
        kode_pemeriksaan: "",
        nama_pemeriksaan: "",
        jasa_sarana: 0,
        jp_medis: 0,
        jp_non_medis: 0,
      });
      fetchData();
    } catch (error: any) {
      toast({
        title: "Error saving data",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleEdit = (item: RadiologiEksternal) => {
    setEditingId(item.id);
    setFormData(item);
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus data ini?")) return;

    try {
      const { error } = await supabase
        .from("daftar_radiologi_eksternal")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast({ title: "Berhasil", description: "Data berhasil dihapus" });
      fetchData();
    } catch (error: any) {
      toast({
        title: "Error deleting data",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDownloadTemplate = () => {
    const headers = [
      "kode_pemeriksaan",
      "nama_pemeriksaan",
      "jasa_sarana",
      "jp_medis",
      "jp_non_medis",
    ];
    const sampleData = [
      ["Rad.Eks.001", "Foto Rontgen Thorax", "75000", "50000", "25000"],
      ["Rad.Eks.002", "USG Abdomen", "150000", "100000", "50000"],
    ];

    const ws = XLSX.utils.aoa_to_sheet([headers, ...sampleData]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template Radiologi Eksternal");
    XLSX.writeFile(wb, "template_radiologi_eksternal.xlsx");
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    event.target.value = "";

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const fileExtension = file.name.split(".").pop()?.toLowerCase();

      if (fileExtension === "xlsx" || fileExtension === "xls") {
        const data = await file.arrayBuffer();
        const workbook = XLSX.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

        if (jsonData.length < 2) {
          throw new Error("File Excel kosong atau tidak memiliki data");
        }

        const headers = jsonData[0] as string[];
        const dataObjects = jsonData.slice(1).map((row: any[]) => {
          const obj: any = {};
          headers.forEach((header, index) => {
            obj[header] = row[index] || "";
          });
          return obj;
        });

        await processImportData(dataObjects, user.id);
      } else {
        Papa.parse(file, {
          header: true,
          skipEmptyLines: true,
          complete: async (results) => {
            await processImportData(results.data as any[], user.id);
          },
          error: (error) => {
            throw error;
          },
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: `Gagal mengimpor data: ${error.message}`,
        variant: "destructive",
      });
    }
  };

  const processImportData = async (data: any[], userId: string) => {
    try {
      const validData = data
        .filter((row) => row.kode_pemeriksaan && row.nama_pemeriksaan)
        .map((row) => ({
          user_id: userId,
          tahun,
          kode_pemeriksaan: row.kode_pemeriksaan.toString().trim(),
          nama_pemeriksaan: row.nama_pemeriksaan.toString().trim(),
          jasa_sarana: parseInt(row.jasa_sarana) || 0,
          jp_medis: parseInt(row.jp_medis) || 0,
          jp_non_medis: parseInt(row.jp_non_medis) || 0,
        }));

      if (validData.length === 0) {
        throw new Error("Tidak ada data valid untuk diimpor");
      }

      const { error } = await supabase
        .from("daftar_radiologi_eksternal")
        .insert(validData);

      if (error) throw error;

      toast({
        title: "Berhasil",
        description: `${validData.length} data berhasil di-import`,
      });

      fetchData();
    } catch (error: any) {
      throw error;
    }
  };

  const handleExport = async () => {
    if (data.length === 0) {
      toast({
        title: "Tidak ada data",
        description: "Tidak ada data untuk di-export",
        variant: "destructive",
      });
      return;
    }

    const dataForExport = data.map((item) => ({
      "Kode Pemeriksaan": item.kode_pemeriksaan,
      "Nama Pemeriksaan": item.nama_pemeriksaan,
      "Jasa Sarana": item.jasa_sarana,
      "JP Medis": item.jp_medis,
      "JP Non Medis": item.jp_non_medis,
      "Tarif": item.tarif,
    }));

    await downloadReport({
      title: "Laporan Daftar Radiologi Eksternal",
      subtitle: `Data tahun ${tahun}`,
      filename: `radiologi_eksternal_${tahun}`,
      records: dataForExport,
      filters: { Tahun: tahun },
    });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(value);
  };

  const filteredData = data.filter(
    (item) =>
      item.kode_pemeriksaan.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.nama_pemeriksaan.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="container mx-auto py-6 px-4 max-w-full">
      <Card className="w-full">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <CardTitle>Daftar Radiologi Eksternal</CardTitle>
              <CardDescription>
                Kelola data pemeriksaan radiologi eksternal dengan tarif otomatis
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Select value={String(tahun)} onValueChange={(value) => setTahun(Number(value))}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="Tahun" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2024">2024</SelectItem>
                  <SelectItem value="2025">2025</SelectItem>
                  <SelectItem value="2026">2026</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <Button variant="template" onClick={handleDownloadTemplate}>
              <FileText className="h-4 w-4 mr-2" />
              Unduh Template
            </Button>

            <label className="cursor-pointer">
              <Button asChild variant="import">
                <span className="flex items-center gap-2">
                  <Upload className="h-4 w-4" />
                  Impor Data
                </span>
              </Button>
              <input
                type="file"
                accept=".csv,.xlsx,.xls"
                className="hidden"
                onChange={handleImport}
              />
            </label>

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  variant="destructive"
                  onClick={() => {
                    setEditingId(null);
                    setFormData({
                      tahun: new Date().getFullYear(),
                      kode_pemeriksaan: "",
                      nama_pemeriksaan: "",
                      jasa_sarana: 0,
                      jp_medis: 0,
                      jp_non_medis: 0,
                    });
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Tambah Data
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>
                    {editingId ? "Edit" : "Tambah"} Radiologi Eksternal
                  </DialogTitle>
                  <DialogDescription>
                    Tarif akan dihitung otomatis dari Jasa Sarana + JP Medis + JP Non Medis
                  </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="kode_pemeriksaan">Kode Pemeriksaan *</Label>
                      <Input
                        id="kode_pemeriksaan"
                        value={formData.kode_pemeriksaan}
                        onChange={(e) =>
                          setFormData({ ...formData, kode_pemeriksaan: e.target.value })
                        }
                        placeholder="Rad.Eks.001"
                      />
                    </div>
                    <div>
                      <Label htmlFor="nama_pemeriksaan">Nama Pemeriksaan *</Label>
                      <Input
                        id="nama_pemeriksaan"
                        value={formData.nama_pemeriksaan}
                        onChange={(e) =>
                          setFormData({ ...formData, nama_pemeriksaan: e.target.value })
                        }
                        placeholder="Nama pemeriksaan"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="jasa_sarana">Jasa Sarana</Label>
                      <Input
                        id="jasa_sarana"
                        type="number"
                        value={formData.jasa_sarana}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            jasa_sarana: parseInt(e.target.value) || 0,
                          })
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor="jp_medis">JP Medis</Label>
                      <Input
                        id="jp_medis"
                        type="number"
                        value={formData.jp_medis}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            jp_medis: parseInt(e.target.value) || 0,
                          })
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor="jp_non_medis">JP Non Medis</Label>
                      <Input
                        id="jp_non_medis"
                        type="number"
                        value={formData.jp_non_medis}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            jp_non_medis: parseInt(e.target.value) || 0,
                          })
                        }
                      />
                    </div>
                  </div>

                  <div className="bg-teal-50 border border-teal-200 rounded p-3">
                    <p className="text-sm font-semibold text-teal-800">
                      Tarif: {formatCurrency(
                        (formData.jasa_sarana || 0) +
                          (formData.jp_medis || 0) +
                          (formData.jp_non_medis || 0)
                      )}
                    </p>
                    <p className="text-xs text-teal-600 mt-1">
                      Tarif akan dihitung otomatis oleh sistem
                    </p>
                  </div>
                </div>

                <DialogFooter>
                  <Button variant="outline" onClick={() => setDialogOpen(false)}>
                    Batal
                  </Button>
                  <Button onClick={handleSave}>Simpan</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Button variant="report" onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" />
              Unduh Laporan
            </Button>

            <Input
              placeholder="Cari kode atau nama pemeriksaan..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 min-w-[200px]"
            />
          </div>

          {loading ? (
            <div className="text-center py-10">Loading...</div>
          ) : filteredData.length === 0 ? (
            <div className="text-center py-10 text-gray-500">
              {searchQuery ? "Tidak ada data yang sesuai pencarian" : "Belum ada data. Klik 'Tambah Data' untuk memulai."}
            </div>
          ) : (
            <div className="w-full overflow-x-auto">
              <Table>
                <TableHeader className="bg-[#0f766e]">
                  <TableRow className="bg-[#0f766e] hover:bg-[#0f766e]">
                    <TableHead className="text-white font-bold">Kode Pemeriksaan</TableHead>
                    <TableHead className="text-white font-bold">Nama Pemeriksaan</TableHead>
                    <TableHead className="text-white font-bold text-right">Jasa Sarana</TableHead>
                    <TableHead className="text-white font-bold text-right">JP Medis</TableHead>
                    <TableHead className="text-white font-bold text-right">JP Non Medis</TableHead>
                    <TableHead className="text-white font-bold text-right">Tarif</TableHead>
                    <TableHead className="text-white font-bold text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredData.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-mono">{item.kode_pemeriksaan}</TableCell>
                      <TableCell>{item.nama_pemeriksaan}</TableCell>
                      <TableCell className="text-right">{formatCurrency(item.jasa_sarana)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(item.jp_medis)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(item.jp_non_medis)}</TableCell>
                      <TableCell className="text-right font-bold text-teal-700">
                        {formatCurrency(item.tarif)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="edit" size="sm" onClick={() => handleEdit(item)}>
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDelete(item.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
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
};

export default DaftarRadiologiEksternal;


