import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Trash2, Edit, Plus, Upload, Download, RefreshCcw } from "lucide-react";
import * as XLSX from "xlsx";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import LayananInputTable from "@/components/produk-layanan/LayananInputTable";
import LayananImportExportToolbar from "@/components/produk-layanan/LayananImportExportToolbar";
import FarmasiInputTable from "@/components/produk-layanan/FarmasiInputTable";
import { useReportDownload } from "@/components/report";

interface ProdukLayanan {
  id: string;
  tahun: number;
  jenis: string;
  deskripsi_inacbg: string | null;
  grouper: string | null;
  diaglist: string | null;
  diagnosa_1: string | null;
  diagnosa_2: string | null;
  diagnosa_3: string | null;
  diagnosa_4: string | null;
  diagnosa_5: string | null;
  proclist: string | null;
  proc_1: string | null;
  proc_2: string | null;
  proc_3: string | null;
  proc_4: string | null;
  proc_5: string | null;
  los: number;
  spesialisasi_dokter: string | null;
  nama_dokter: string | null;
  kode_dokter: string | null;
  tindakan: any[];
  ibs: any[];
  laboratorium: any[];
  radiologi: any[];
  farmasi: any[];
  kamar_akomodasi: any[];
  visite: any[];
  konsultasi: any[];
  total_biaya: number;
  tarif_inacbgs_numeric: number;
  saldo_distribusi: number;
  prosentase_saldo: number;
  jp_tindakan: number;
  jp_ibs: number;
  jp_laboratorium: number;
  jp_radiologi: number;
  jp_farmasi: number;
  jp_kamar_akomodasi: number;
  jp_visite: number;
  jp_konsultasi: number;
  jp_farmasi_prosentase: number;
}

const ProdukLayanan = () => {
  const { toast } = useToast();
  const { downloadReport } = useReportDownload();
  const [data, setData] = useState<ProdukLayanan[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [tahun, setTahun] = useState(2025);
  const [refreshKey, setRefreshKey] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [formData, setFormData] = useState<Partial<ProdukLayanan>>({
    tahun: 2025,
    jenis: "rawat jalan",
    los: 0,
    tindakan: [],
    ibs: [],
    laboratorium: [],
    radiologi: [],
    farmasi: [],
    kamar_akomodasi: [],
    visite: [],
    konsultasi: [],
  });
  
  // State untuk menyimpan available services dari setiap jenis layanan
  const [availableServices, setAvailableServices] = useState({
    tindakan: [] as any[],
    ibs: [] as any[],
    laboratorium: [] as any[],
    radiologi: [] as any[],
    akomodasi: [] as any[],
    visite: [] as any[],
    konsultasi: [] as any[],
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: "Error",
          description: "User not authenticated",
          variant: "destructive",
        });
        return;
      }

      const { data: produkLayanan, error } = await supabase
        .from("produk_layanan")
        .select("*")
        .eq("tahun", tahun)
        .order("created_at", { ascending: false });

      if (error) throw error;

      setData(produkLayanan || []);
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

  useEffect(() => {
    fetchData();
  }, [tahun]);

  const handleRefreshData = async () => {
    try {
      setRefreshing(true);
      const { data, error } = await supabase.rpc("populate_skenario_tarif_from_rekapitulasi", {
        p_user_id: null,
        p_tahun: tahun,
        p_prosentase_jasa_pelayanan: 0,
        p_prosentase_profit: 0,
      });

      if (error) throw error;

      toast({
        title: "Berhasil",
        description: `Data layanan berhasil diperbarui (${data ?? 0} entri).`,
      });

      setRefreshKey((prev) => prev + 1);
      await fetchData();
    } catch (error: any) {
      toast({
        title: "Gagal memperbarui",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setRefreshing(false);
    }
  };

  const handleSave = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: "Error",
          description: "User not authenticated",
          variant: "destructive",
        });
        return;
      }

      const dataToSave = {
        ...formData,
        user_id: user.id,
        tahun,
      };

      if (editingId) {
        const { error } = await supabase
          .from("produk_layanan")
          .update(dataToSave)
          .eq("id", editingId);

        if (error) throw error;

        toast({
          title: "Berhasil",
          description: "Data berhasil diupdate",
        });
      } else {
        const { error } = await supabase
          .from("produk_layanan")
          .insert(dataToSave);

        if (error) throw error;

        toast({
          title: "Berhasil",
          description: "Data berhasil ditambahkan",
        });
      }

      setDialogOpen(false);
      setEditingId(null);
      setFormData({
        tahun: 2025,
        jenis: "rawat jalan",
        los: 0,
        tindakan: [],
        ibs: [],
        laboratorium: [],
        radiologi: [],
        farmasi: [],
        kamar_akomodasi: [],
        visite: [],
        konsultasi: [],
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

  const handleEdit = (item: ProdukLayanan) => {
    setEditingId(item.id);
    setFormData(item);
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus data ini?")) return;

    try {
      const { error } = await supabase
        .from("produk_layanan")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Berhasil",
        description: "Data berhasil dihapus",
      });

      fetchData();
    } catch (error: any) {
      toast({
        title: "Error deleting data",
        description: error.message,
        variant: "destructive",
      });
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

    const dataForExport = data.map(item => ({
      "ID": item.id || "",
      "Tahun": item.tahun || tahun,
      "Jenis": item.jenis || "",
      "Deskripsi INA-CBG": item.deskripsi_inacbg || "",
      "Grouper": item.grouper || "",
      "Diaglist": item.diaglist || "",
      "Diagnosa 1": item.diagnosa_1 || "",
      "Diagnosa 2": item.diagnosa_2 || "",
      "Diagnosa 3": item.diagnosa_3 || "",
      "Diagnosa 4": item.diagnosa_4 || "",
      "Diagnosa 5": item.diagnosa_5 || "",
      "Proclist": item.proclist || "",
      "Prosedur 1": item.proc_1 || "",
      "Prosedur 2": item.proc_2 || "",
      "Prosedur 3": item.proc_3 || "",
      "Prosedur 4": item.proc_4 || "",
      "Prosedur 5": item.proc_5 || "",
      "LOS": item.los || 0,
      "Spesialisasi Dokter": item.spesialisasi_dokter || "",
      "Nama Dokter": item.nama_dokter || "",
      "Kode Dokter": item.kode_dokter || "",
      "Tarif INA-CBGs": item.tarif_inacbgs_numeric || 0,
      "JP Farmasi Prosentase": item.jp_farmasi_prosentase || 0,
      "Total Biaya": item.total_biaya || 0,
      "Saldo Distribusi": item.saldo_distribusi || 0,
      "Prosentase Saldo": item.prosentase_saldo || 0,
      "JP Tindakan": item.jp_tindakan || 0,
      "JP IBS": item.jp_ibs || 0,
      "JP Laboratorium": item.jp_laboratorium || 0,
      "JP Radiologi": item.jp_radiologi || 0,
      "JP Farmasi": item.jp_farmasi || 0,
      "JP Kamar Akomodasi": item.jp_kamar_akomodasi || 0,
      "JP Visite": item.jp_visite || 0,
      "JP Konsultasi": item.jp_konsultasi || 0
    }));

    await downloadReport({
      title: "Laporan Produk Layanan",
      subtitle: `Data tahun ${tahun}`,
      filename: `produk_layanan_${tahun}`,
      records: dataForExport,
      filters: {
        Tahun: tahun,
      },
    });
  };

  const handleDownloadTemplate = () => {
    const headers = [
      "tahun",
      "jenis",
      "deskripsi_inacbg",
      "grouper",
      "diaglist",
      "diagnosa_1",
      "diagnosa_2",
      "diagnosa_3",
      "diagnosa_4",
      "diagnosa_5",
      "proclist",
      "proc_1",
      "proc_2",
      "proc_3",
      "proc_4",
      "proc_5",
      "los",
      "spesialisasi_dokter",
      "nama_dokter",
      "kode_dokter",
      "tarif_inacbgs_numeric",
      "jp_farmasi_prosentase"
    ];
    const sampleData = [
      [
        2025,
        "rawat jalan",
        "Hipertensi Esensial",
        "Mild",
        "I10",
        "Hipertensi Esensial",
        "",
        "",
        "",
        "",
        "Z00.0",
        "Pemeriksaan Medis Umum",
        "",
        "",
        "",
        "",
        1,
        "Spesialis Penyakit Dalam",
        "Dr. Andi",
        "DK001",
        300000,
        15.0
      ],
      [
        2025,
        "rawat inap",
        "Pneumonia",
        "Moderate",
        "J18",
        "Pneumonia",
        "",
        "",
        "",
        "",
        "J44.1",
        "Bronkitis Kronis",
        "",
        "",
        "",
        "",
        3,
        "Spesialis Paru",
        "Dr. Budi",
        "DK002",
        8000000,
        20.0
      ]
    ];
    
    const ws = XLSX.utils.aoa_to_sheet([headers, ...sampleData]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template Produk Layanan");
    XLSX.writeFile(wb, "template_produk_layanan.xlsx");
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: "Error",
          description: "User not authenticated",
          variant: "destructive",
        });
        return;
      }

      const text = await file.text();
      const rows = text.split("\n").map((row) => row.split(","));
      const headers = rows[0];
      const dataRows = rows.slice(1);

      const importData = dataRows
        .filter((row) => row.length === headers.length && row[0])
        .map((row) => {
          const obj: any = { user_id: user.id, tahun };
          headers.forEach((header, index) => {
            const value = row[index]?.trim();
            if (header === "los" || header === "tahun" || header === "tarif_inacbgs_numeric") {
              obj[header] = value ? parseInt(value) : 0;
            } else if (header === "jp_farmasi_prosentase") {
              obj[header] = value ? parseFloat(value) : 0;
            } else {
              obj[header] = value || null;
            }
          });
          // Initialize arrays
          obj.tindakan = [];
          obj.ibs = [];
          obj.laboratorium = [];
          obj.radiologi = [];
          obj.farmasi = [];
          obj.kamar_akomodasi = [];
          obj.visite = [];
          obj.konsultasi = [];
          return obj;
        });

      const { error } = await supabase.from("produk_layanan").insert(importData);

      if (error) throw error;

      toast({
        title: "Berhasil",
        description: `${importData.length} data berhasil di-import`,
      });

      fetchData();
    } catch (error: any) {
      toast({
        title: "Error importing data",
        description: error.message,
        variant: "destructive",
      });
    }

    event.target.value = "";
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(value);
  };

  const getProsentaseBadge = (prosentase: number) => {
    const isProfit = prosentase >= 38;
    return (
      <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
        isProfit 
          ? "bg-green-100 text-green-800 border border-green-300" 
          : "bg-red-100 text-red-800 border border-red-300"
      }`}>
        {prosentase.toFixed(2)}%
      </div>
    );
  };

  // Hitung rata-rata prosentase saldo
  const rataRataProsentase = data.length > 0
    ? data.reduce((sum, item) => sum + (item.prosentase_saldo || 0), 0) / data.length
    : 0;

  return (
    <div className="container mx-auto py-10">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <CardTitle>Produk Layanan</CardTitle>
                {data.length > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-muted-foreground">
                      Rata-rata Prosentase Saldo:
                    </span>
                    {getProsentaseBadge(rataRataProsentase)}
                  </div>
                )}
              </div>
              <CardDescription>
                Kelola data produk layanan rumah sakit dengan referensi ke rekapitulasi unit cost
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
        <CardContent>
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <Button
              variant="template"
              onClick={handleDownloadTemplate}
              className="shadow-sm"
            >
              <Download className="h-4 w-4 mr-2" />
              Unduh Template Impor
            </Button>

            <label className="cursor-pointer">
              <Button asChild variant="import" className="shadow-sm">
                <span className="flex items-center gap-2">
                  <Upload className="h-4 w-4" />
                  Impor Data
                </span>
              </Button>
              <input
                type="file"
                accept=".csv"
                className="hidden"
                onChange={handleImport}
              />
            </label>

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  variant="destructive"
                  className="shadow-sm"
                  onClick={() => {
                    setEditingId(null);
                    setFormData({
                      tahun: 2025,
                      jenis: "rawat jalan",
                      los: 0,
                      tindakan: [],
                      ibs: [],
                      laboratorium: [],
                      radiologi: [],
                      farmasi: [],
                      kamar_akomodasi: [],
                      visite: [],
                      konsultasi: [],
                    });
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Tambah Data
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editingId ? "Edit Produk Layanan" : "Tambah Produk Layanan"}
                  </DialogTitle>
                  <DialogDescription>
                    Lengkapi form di bawah untuk {editingId ? "mengupdate" : "menambahkan"} produk layanan
                  </DialogDescription>
                </DialogHeader>

                <Tabs defaultValue="basic" className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="basic">Informasi Dasar</TabsTrigger>
                    <TabsTrigger value="diagnosa">Diagnosa & Prosedur</TabsTrigger>
                    <TabsTrigger value="layanan">Layanan</TabsTrigger>
                  </TabsList>

                  <TabsContent value="basic" className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="jenis">Jenis</Label>
                        <Select
                          value={formData.jenis}
                          onValueChange={(value) =>
                            setFormData({ ...formData, jenis: value })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Pilih jenis" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="rawat jalan">Rawat Jalan</SelectItem>
                            <SelectItem value="rawat inap">Rawat Inap</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="los">LOS (Length of Stay)</Label>
                        <Input
                          id="los"
                          type="number"
                          value={formData.los}
                          onChange={(e) =>
                            setFormData({ ...formData, los: parseInt(e.target.value) || 0 })
                          }
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="deskripsi_inacbg">Deskripsi INA-CBG</Label>
                        <Input
                          id="deskripsi_inacbg"
                          value={formData.deskripsi_inacbg || ""}
                          onChange={(e) =>
                            setFormData({ ...formData, deskripsi_inacbg: e.target.value })
                          }
                        />
                      </div>
                      <div>
                        <Label htmlFor="grouper">Grouper</Label>
                        <Input
                          id="grouper"
                          value={formData.grouper || ""}
                          onChange={(e) =>
                            setFormData({ ...formData, grouper: e.target.value })
                          }
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="tarif_inacbgs">Tarif INA-CBG's (Rp)</Label>
                      <Input
                        id="tarif_inacbgs"
                        type="number"
                        value={formData.tarif_inacbgs_numeric || 0}
                        onChange={(e) =>
                          setFormData({ ...formData, tarif_inacbgs_numeric: parseInt(e.target.value) || 0 })
                        }
                        placeholder="Masukkan tarif INA-CBG's dalam rupiah"
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="spesialisasi_dokter">Spesialisasi Dokter</Label>
                        <Input
                          id="spesialisasi_dokter"
                          value={formData.spesialisasi_dokter || ""}
                          onChange={(e) =>
                            setFormData({ ...formData, spesialisasi_dokter: e.target.value })
                          }
                        />
                      </div>
                      <div>
                        <Label htmlFor="nama_dokter">Nama Dokter</Label>
                        <Input
                          id="nama_dokter"
                          value={formData.nama_dokter || ""}
                          onChange={(e) =>
                            setFormData({ ...formData, nama_dokter: e.target.value })
                          }
                        />
                      </div>
                      <div>
                        <Label htmlFor="kode_dokter">Kode Dokter</Label>
                        <Input
                          id="kode_dokter"
                          value={formData.kode_dokter || ""}
                          onChange={(e) =>
                            setFormData({ ...formData, kode_dokter: e.target.value })
                          }
                        />
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="diagnosa" className="space-y-4">
                    <div>
                      <Label htmlFor="diaglist">Diaglist</Label>
                      <Input
                        id="diaglist"
                        value={formData.diaglist || ""}
                        onChange={(e) =>
                          setFormData({ ...formData, diaglist: e.target.value })
                        }
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      {[1, 2, 3, 4, 5].map((num) => (
                        <div key={`diagnosa_${num}`}>
                          <Label htmlFor={`diagnosa_${num}`}>Diagnosa {num}</Label>
                          <Input
                            id={`diagnosa_${num}`}
                            value={formData[`diagnosa_${num}` as keyof ProdukLayanan] as string || ""}
                            onChange={(e) =>
                              setFormData({ ...formData, [`diagnosa_${num}`]: e.target.value })
                            }
                          />
                        </div>
                      ))}
                    </div>

                    <div>
                      <Label htmlFor="proclist">Proclist</Label>
                      <Input
                        id="proclist"
                        value={formData.proclist || ""}
                        onChange={(e) =>
                          setFormData({ ...formData, proclist: e.target.value })
                        }
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      {[1, 2, 3, 4, 5].map((num) => (
                        <div key={`proc_${num}`}>
                          <Label htmlFor={`proc_${num}`}>Prosedur {num}</Label>
                          <Input
                            id={`proc_${num}`}
                            value={formData[`proc_${num}` as keyof ProdukLayanan] as string || ""}
                            onChange={(e) =>
                              setFormData({ ...formData, [`proc_${num}`]: e.target.value })
                            }
                          />
                        </div>
                      ))}
                    </div>
                  </TabsContent>

                  <TabsContent value="layanan" className="space-y-6">
                    {/* Toolbar Import/Export Terpusat */}
                    <LayananImportExportToolbar
                      tahun={tahun}
                      allServices={availableServices}
                      onImport={(importedData) => {
                        // Merge imported data dengan data yang sudah ada
                        setFormData({
                          ...formData,
                          tindakan: [...(formData.tindakan || []), ...importedData.tindakan],
                          ibs: [...(formData.ibs || []), ...importedData.ibs],
                          laboratorium: [...(formData.laboratorium || []), ...importedData.laboratorium],
                          radiologi: [...(formData.radiologi || []), ...importedData.radiologi],
                          kamar_akomodasi: [...(formData.kamar_akomodasi || []), ...importedData.akomodasi],
                          visite: [...(formData.visite || []), ...importedData.visite],
                          konsultasi: [...(formData.konsultasi || []), ...importedData.konsultasi],
                        });
                      }}
                    />

                    {/* URUTAN 1: Kamar Akomodasi - Dipindahkan ke urutan pertama */}
                    <LayananInputTable
                      label="Kamar Akomodasi"
                      value={formData.kamar_akomodasi || []}
                      onChange={(value) => setFormData({ ...formData, kamar_akomodasi: value })}
                      tahun={tahun}
                      filterType="akomodasi"
                      refreshKey={refreshKey}
                      onServicesLoaded={(services) => 
                        setAvailableServices(prev => ({ ...prev, akomodasi: services }))
                      }
                    />

                    {/* URUTAN 2: Tindakan - Sekarang bergantung pada kamar yang dipilih */}
                    <LayananInputTable
                      label="Tindakan"
                      value={formData.tindakan || []}
                      onChange={(value) => setFormData({ ...formData, tindakan: value })}
                      tahun={tahun}
                      filterType="tindakan"
                      jenisProduk={formData.jenis}
                      refreshKey={refreshKey}
                      selectedKamarAkomodasi={formData.kamar_akomodasi || []}
                      onServicesLoaded={(services) => 
                        setAvailableServices(prev => ({ ...prev, tindakan: services }))
                      }
                    />

                    <LayananInputTable
                      label="IBS (Tindakan Operatif)"
                      value={formData.ibs || []}
                      onChange={(value) => setFormData({ ...formData, ibs: value })}
                      tahun={tahun}
                      filterType="ibs"
                      spesialisasiDokter={formData.spesialisasi_dokter || undefined}
                      refreshKey={refreshKey}
                      onServicesLoaded={(services) => 
                        setAvailableServices(prev => ({ ...prev, ibs: services }))
                      }
                    />

                    <LayananInputTable
                      label="Laboratorium"
                      value={formData.laboratorium || []}
                      onChange={(value) => setFormData({ ...formData, laboratorium: value })}
                      tahun={tahun}
                      filterType="laboratorium"
                      refreshKey={refreshKey}
                      onServicesLoaded={(services) => 
                        setAvailableServices(prev => ({ ...prev, laboratorium: services }))
                      }
                    />

                    <LayananInputTable
                      label="Radiologi"
                      value={formData.radiologi || []}
                      onChange={(value) => setFormData({ ...formData, radiologi: value })}
                      tahun={tahun}
                      filterType="radiologi"
                      refreshKey={refreshKey}
                      onServicesLoaded={(services) => 
                        setAvailableServices(prev => ({ ...prev, radiologi: services }))
                      }
                    />

                    <div className="space-y-2">
                      <Label htmlFor="jp_farmasi_prosentase">Prosentase JP Farmasi (%)</Label>
                      <Input
                        id="jp_farmasi_prosentase"
                        type="number"
                        value={formData.jp_farmasi_prosentase || 0}
                        onChange={(e) =>
                          setFormData({ ...formData, jp_farmasi_prosentase: parseFloat(e.target.value) || 0 })
                        }
                        placeholder="Masukkan prosentase JP Farmasi"
                        min="0"
                        max="100"
                        step="0.01"
                      />
                    </div>

                    <FarmasiInputTable
                      label="Farmasi"
                      value={formData.farmasi || []}
                      onChange={(value) => setFormData({ ...formData, farmasi: value })}
                      refreshKey={refreshKey}
                    />

                    <LayananInputTable
                      label="Visite"
                      value={formData.visite || []}
                      onChange={(value) => setFormData({ ...formData, visite: value })}
                      tahun={tahun}
                      filterType="visite"
                      refreshKey={refreshKey}
                      onServicesLoaded={(services) => 
                        setAvailableServices(prev => ({ ...prev, visite: services }))
                      }
                    />

                    <LayananInputTable
                      label="Konsultasi"
                      value={formData.konsultasi || []}
                      onChange={(value) => setFormData({ ...formData, konsultasi: value })}
                      tahun={tahun}
                      filterType="konsultasi"
                      refreshKey={refreshKey}
                      onServicesLoaded={(services) => 
                        setAvailableServices(prev => ({ ...prev, konsultasi: services }))
                      }
                    />
                  </TabsContent>
                </Tabs>

                <DialogFooter>
                  <Button variant="outline" onClick={() => setDialogOpen(false)}>
                    Batal
                  </Button>
                  <Button onClick={handleSave}>Simpan</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Button variant="report" onClick={handleExport} className="shadow-sm">
              <Download className="h-4 w-4 mr-2" />
              Unduh Laporan
            </Button>

            <Button
              variant="outline"
              onClick={handleRefreshData}
              disabled={refreshing}
              className="shadow-sm"
            >
              <RefreshCcw className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
              {refreshing ? "Memperbarui…" : "Perbarui Data"}
            </Button>
          </div>

          {loading ? (
            <div className="text-center py-10">Loading...</div>
          ) : data.length === 0 ? (
            <div className="text-center py-10 text-gray-500">
              Belum ada data. Klik "Tambah Data" untuk memulai.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-[#0f766e]">
                  <TableRow className="bg-[#0f766e] hover:bg-[#0f766e]">
                    <TableHead className="text-white font-bold">Jenis</TableHead>
                    <TableHead className="text-white font-bold">Deskripsi INA-CBG</TableHead>
                    <TableHead className="text-white font-bold">LOS</TableHead>
                    <TableHead className="text-white font-bold">Dokter</TableHead>
                    <TableHead className="text-right text-white font-bold">Tarif INA-CBGs</TableHead>
                    <TableHead className="text-right text-white font-bold">Total Biaya</TableHead>
                    <TableHead className="text-right text-white font-bold">JP Tindakan</TableHead>
                    <TableHead className="text-right text-white font-bold">JP IBS</TableHead>
                    <TableHead className="text-right text-white font-bold">JP Lab</TableHead>
                    <TableHead className="text-right text-white font-bold">JP Radiologi</TableHead>
                    <TableHead className="text-right text-white font-bold">JP Farmasi</TableHead>
                    <TableHead className="text-right text-white font-bold">JP Kamar</TableHead>
                    <TableHead className="text-right text-white font-bold">JP Visite</TableHead>
                    <TableHead className="text-right text-white font-bold">JP Konsultasi</TableHead>
                    <TableHead className="text-right text-white font-bold">Total JP</TableHead>
                    <TableHead className="text-right text-white font-bold">Saldo Distribusi</TableHead>
                    <TableHead className="text-center text-white font-bold">% Saldo</TableHead>
                    <TableHead className="text-right text-white font-bold">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium capitalize">{item.jenis}</TableCell>
                      <TableCell>{item.deskripsi_inacbg || "-"}</TableCell>
                      <TableCell>{item.los} hari</TableCell>
                      <TableCell>{item.nama_dokter || "-"}</TableCell>
                      <TableCell className="text-right">{formatCurrency(item.tarif_inacbgs_numeric || 0)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(item.total_biaya)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(item.jp_tindakan || 0)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(item.jp_ibs || 0)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(item.jp_laboratorium || 0)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(item.jp_radiologi || 0)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(item.jp_farmasi || 0)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(item.jp_kamar_akomodasi || 0)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(item.jp_visite || 0)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(item.jp_konsultasi || 0)}</TableCell>
                      <TableCell className="text-right font-bold text-green-600">
                        {formatCurrency((item.jp_tindakan || 0) + (item.jp_ibs || 0) + (item.jp_laboratorium || 0) + (item.jp_radiologi || 0) + (item.jp_farmasi || 0) + (item.jp_kamar_akomodasi || 0) + (item.jp_visite || 0) + (item.jp_konsultasi || 0))}
                      </TableCell>
                      <TableCell className={`text-right font-semibold ${
                        (item.saldo_distribusi || 0) >= 0 ? "text-green-600" : "text-red-600"
                      }`}>
                        {formatCurrency(item.saldo_distribusi || 0)}
                      </TableCell>
                      <TableCell className="text-center">
                        {getProsentaseBadge(item.prosentase_saldo || 0)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="edit" size="sm" onClick={() => handleEdit(item)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDelete(item.id)}
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
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ProdukLayanan;

