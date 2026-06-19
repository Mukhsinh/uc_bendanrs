"use client";

import React, { useState, useEffect } from "react";
import { useYear } from "@/contexts/YearContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
} from "@/components/ui/dialog";
import {
  FileText,
  Download,
  Upload,
  FileSpreadsheet,
  Eye,
  Search,
  Filter,
  RefreshCw,
  BarChart3,
  Users,
  Building2,
  Activity,
} from "lucide-react";
import { useReportDownload } from "@/components/report";

interface UnitKerjaData {
  Kode_UK: string;
  Nama_Unit_Kerja: string;
  Jenis: string;
  SDM_dokter: number;
  SDM_Perawat: number;
  SDM_Non: number;
  Kunjungan_Pasien_Lama: number;
  Kunjungan_Pasien_Baru: number;
  Jumlah_Tindakan: number;
  tahun: number;
}

interface GroupedData {
  [key: string]: UnitKerjaData[];
}

const PengelompokanData = () => {
  const [data, setData] = useState<UnitKerjaData[]>([]);
  const [groupedData, setGroupedData] = useState<GroupedData>({});
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterJenis, setFilterJenis] = useState("Semua");
  const [filterTahun, setFilterTahun] = useState(new Date().getFullYear().toString());
  const [selectedUnit, setSelectedUnit] = useState<string | null>(null);
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [downloadingReport, setDownloadingReport] = useState(false);
  const { downloadReport } = useReportDownload();

  // Load data
  const loadData = async () => {
    setLoading(true);
    try {
      const { data: kegiatan, error } = await supabase
        .from("data_kegiatan")
        .select("*")
        .order("Kode_UK");

      if (error) throw error;
      
      const kegiatanData = kegiatan || [];
      setData(kegiatanData);

      // Group data by Jenis
      const grouped = kegiatanData.reduce((acc: GroupedData, item) => {
        const jenis = item.Jenis || "Non Layanan";
        if (!acc[jenis]) {
          acc[jenis] = [];
        }
        acc[jenis].push(item);
        return acc;
      }, {});
      
      setGroupedData(grouped);
    } catch (error) {
      console.error("Error loading data:", error);
      toast.error("Gagal memuat data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filter data
  const filteredData = data.filter(item => {
    const matchesSearch = item.Nama_Unit_Kerja.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.Kode_UK.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesJenis = filterJenis === "Semua" || item.Jenis === filterJenis;
    const matchesTahun = item.tahun.toString() === filterTahun;
    
    return matchesSearch && matchesJenis && matchesTahun;
  });

  // Download template
  const downloadTemplate = () => {
    const headers = [
      "Kode UK",
      "Nama Unit Kerja", 
      "Tahun",
      "Jenis",
      "SDM Dokter",
      "SDM Perawat", 
      "SDM Non Medis",
      "Kunjungan Lama",
      "Kunjungan Baru",
      "Jumlah Tindakan"
    ];
    
    const csvContent = headers.join(",") + "\n" +
      "UK001,Contoh Unit Kerja,2025,Non Layanan,1,2,1,100,50,25";
    
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "template_data_kegiatan.csv");
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success("Template berhasil diunduh");
  };

  // Download report
  const handleDownloadReport = async () => {
    if (filteredData.length === 0) {
      toast.error("Belum ada data untuk diunduh");
      return;
    }

    try {
      setDownloadingReport(true);

      const records = filteredData.map((item) => ({
        "Kode UK": item.Kode_UK,
        "Unit Kerja": item.Nama_Unit_Kerja,
        "Tahun": item.tahun,
        "Jenis": item.Jenis,
        "SDM Dokter": item.SDM_dokter || 0,
        "SDM Perawat": item.SDM_Perawat || 0,
        "SDM Non Medis": item.SDM_Non || 0,
        "Total SDM": (item.SDM_dokter || 0) + (item.SDM_Perawat || 0) + (item.SDM_Non || 0),
        "Kunjungan Lama": item.Kunjungan_Pasien_Lama || 0,
        "Kunjungan Baru": item.Kunjungan_Pasien_Baru || 0,
        "Total Kunjungan": (item.Kunjungan_Pasien_Lama || 0) + (item.Kunjungan_Pasien_Baru || 0),
        "Jumlah Tindakan": item.Jumlah_Tindakan || 0,
      }));

      await downloadReport({
        title: "Laporan Pengelompokan Data",
        subtitle: `Tahun ${filterTahun} • Jenis ${filterJenis}`,
        filename: `laporan_pengelompokan_data_${filterTahun}`,
        records,
        orientation: "landscape",
      });

      toast.success("Laporan berhasil disiapkan");
    } catch (error: any) {
      console.error("Gagal mengunduh laporan pengelompokan data:", error);
      toast.error(error?.message || "Terjadi kesalahan saat mengunduh laporan");
    } finally {
      setDownloadingReport(false);
    }
  };

  const getJenisBadgeVariant = (jenis: string | null | undefined) => {
    switch (jenis) {
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

  const getJenisIcon = (jenis: string | null | undefined) => {
    switch (jenis) {
      case "Rawat Jalan":
        return <Activity className="h-4 w-4" />;
      case "Rawat Inap":
        return <Building2 className="h-4 w-4" />;
      case "Operatif":
        return <BarChart3 className="h-4 w-4" />;
      case "Non Layanan":
        return <Users className="h-4 w-4" />;
      default:
        return <Users className="h-4 w-4" />;
    }
  };

  return (
    <div className="flex flex-col h-full bg-background text-foreground">
      <div className="flex-1 p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Pengelompokan Data</h1>
          <div className="flex gap-2">
            <Dialog open={isTemplateDialogOpen} onOpenChange={setIsTemplateDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <FileSpreadsheet className="h-4 w-4 mr-2" />
                  Template
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Download Template Data</DialogTitle>
                  <DialogDescription>
                    Unduh template untuk mengisi data kegiatan
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <p className="text-sm text-gray-600">
                    Template ini berisi format yang benar untuk mengisi data kegiatan. 
                    Anda dapat mengisi template ini dan mengimpornya kembali ke sistem.
                  </p>
                  <Button onClick={downloadTemplate} className="w-full">
                    <Download className="h-4 w-4 mr-2" />
                    Unduh Template CSV
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Upload className="h-4 w-4 mr-2" />
                  Import Data
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Import Data dari File</DialogTitle>
                  <DialogDescription>
                    Unggah file CSV yang sudah diisi sesuai template
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="file">Pilih File CSV</Label>
                    <Input
                      id="file"
                      type="file"
                      accept=".csv"
                      onChange={(e) => {
                        // Handle file upload logic here
                        toast.info("Fitur import sedang dikembangkan");
                        setIsImportDialogOpen(false);
                      }}
                    />
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            <Button
              onClick={() => {
                void handleDownloadReport();
              }}
              disabled={loading || downloadingReport}
            >
              {downloadingReport ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Download className="h-4 w-4 mr-2" />
              )}
              {downloadingReport ? "Menyiapkan..." : "Unduh Laporan"}
            </Button>

            <Button variant="outline" onClick={loadData} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Filter Section */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filter Data
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="search">Cari Unit Kerja</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="search"
                    placeholder="Cari kode atau nama unit..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="jenis">Filter Jenis</Label>
                <Select value={filterJenis} onValueChange={setFilterJenis}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih jenis" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Semua">Semua Jenis</SelectItem>
                    <SelectItem value="Rawat Jalan">Rawat Jalan</SelectItem>
                    <SelectItem value="Rawat Inap">Rawat Inap</SelectItem>
                    <SelectItem value="Operatif">Operatif</SelectItem>
                    <SelectItem value="Non Layanan">Non Layanan</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="tahun">Filter Tahun</Label>
                <Select value={filterTahun} onValueChange={setFilterTahun}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih tahun" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2023">2023</SelectItem>
                    <SelectItem value="2024">2024</SelectItem>
                    <SelectItem value="2025">2025</SelectItem>
                    <SelectItem value="2026">2026</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setSearchTerm("");
                    setFilterJenis("Semua");
                    setFilterTahun(new Date().getFullYear().toString());
                  }}
                  className="w-full"
                >
                  Reset Filter
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Unit Kerja</p>
                  <p className="text-2xl font-bold">{filteredData.length}</p>
                </div>
                <Building2 className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total SDM</p>
                  <p className="text-2xl font-bold">
                    {filteredData.reduce((sum, item) => 
                      sum + (item.SDM_dokter || 0) + (item.SDM_Perawat || 0) + (item.SDM_Non || 0), 0
                    )}
                  </p>
                </div>
                <Users className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Kunjungan</p>
                  <p className="text-2xl font-bold">
                    {filteredData.reduce((sum, item) => 
                      sum + (item.Kunjungan_Pasien_Lama || 0) + (item.Kunjungan_Pasien_Baru || 0), 0
                    )}
                  </p>
                </div>
                <Activity className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Tindakan</p>
                  <p className="text-2xl font-bold">
                    {filteredData.reduce((sum, item) => sum + (item.Jumlah_Tindakan || 0), 0)}
                  </p>
                </div>
                <BarChart3 className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Grouped Data View */}
        <Tabs defaultValue="grouped" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="grouped">Tampilan Terkelompok</TabsTrigger>
            <TabsTrigger value="table">Tampilan Tabel</TabsTrigger>
          </TabsList>

          <TabsContent value="grouped" className="space-y-6">
            {Object.entries(groupedData).map(([jenis, items]) => {
              const filteredItems = items.filter(item => {
                const matchesSearch = item.Nama_Unit_Kerja.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                     item.Kode_UK.toLowerCase().includes(searchTerm.toLowerCase());
                const matchesJenis = filterJenis === "Semua" || item.Jenis === filterJenis;
                const matchesTahun = item.tahun.toString() === filterTahun;
                
                return matchesSearch && matchesJenis && matchesTahun;
              });

              if (filteredItems.length === 0) return null;

              return (
                <Card key={jenis}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      {getJenisIcon(jenis)}
                      {jenis}
                      <Badge variant={getJenisBadgeVariant(jenis)}>
                        {filteredItems.length} Unit
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {filteredItems.map((item) => (
                        <Card key={`${item.Kode_UK}-${item.tahun}`} className="hover:shadow-md transition-shadow">
                          <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-medium text-sm">{item.Kode_UK}</p>
                                <p className="text-sm text-gray-600">{item.Nama_Unit_Kerja}</p>
                              </div>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setSelectedUnit(`${item.Kode_UK}-${item.tahun}`)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </div>
                          </CardHeader>
                          <CardContent className="pt-0">
                            <div className="space-y-2 text-sm">
                              <div className="flex justify-between">
                                <span>SDM Dokter:</span>
                                <span className="font-medium">{item.SDM_dokter || 0}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>SDM Perawat:</span>
                                <span className="font-medium">{item.SDM_Perawat || 0}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>SDM Non Medis:</span>
                                <span className="font-medium">{item.SDM_Non || 0}</span>
                              </div>
                              <div className="flex justify-between border-t pt-2">
                                <span>Total Kunjungan:</span>
                                <span className="font-medium">
                                  {(item.Kunjungan_Pasien_Lama || 0) + (item.Kunjungan_Pasien_Baru || 0)}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span>Tindakan:</span>
                                <span className="font-medium">{item.Jumlah_Tindakan || 0}</span>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </TabsContent>

          <TabsContent value="table">
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Kode UK</TableHead>
                        <TableHead>Unit Kerja</TableHead>
                        <TableHead>Tahun</TableHead>
                        <TableHead>Jenis</TableHead>
                        <TableHead>SDM Dokter</TableHead>
                        <TableHead>SDM Perawat</TableHead>
                        <TableHead>SDM Non Medis</TableHead>
                        <TableHead>Kunjungan Lama</TableHead>
                        <TableHead>Kunjungan Baru</TableHead>
                        <TableHead>Total Kunjungan</TableHead>
                        <TableHead>Tindakan</TableHead>
                        <TableHead>Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredData.map((item) => (
                        <TableRow key={`${item.Kode_UK}-${item.tahun}`}>
                          <TableCell className="font-medium">{item.Kode_UK}</TableCell>
                          <TableCell>{item.Nama_Unit_Kerja}</TableCell>
                          <TableCell>{item.tahun}</TableCell>
                          <TableCell>
                            <Badge variant={getJenisBadgeVariant(item.Jenis)}>
                              {item.Jenis || "Non Layanan"}
                            </Badge>
                          </TableCell>
                          <TableCell>{item.SDM_dokter || 0}</TableCell>
                          <TableCell>{item.SDM_Perawat || 0}</TableCell>
                          <TableCell>{item.SDM_Non || 0}</TableCell>
                          <TableCell>{item.Kunjungan_Pasien_Lama || 0}</TableCell>
                          <TableCell>{item.Kunjungan_Pasien_Baru || 0}</TableCell>
                          <TableCell>
                            {(item.Kunjungan_Pasien_Lama || 0) + (item.Kunjungan_Pasien_Baru || 0)}
                          </TableCell>
                          <TableCell>{item.Jumlah_Tindakan || 0}</TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setSelectedUnit(`${item.Kode_UK}-${item.tahun}`)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Detail View Dialog */}
        <Dialog open={selectedUnit !== null} onOpenChange={() => setSelectedUnit(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Detail Unit Kerja</DialogTitle>
              <DialogDescription>
                Informasi lengkap unit kerja dan aktivitasnya
              </DialogDescription>
            </DialogHeader>
            {selectedUnit && (() => {
              const [kodeUK, tahun] = selectedUnit.split('-');
              const item = data.find(d => d.Kode_UK === kodeUK && d.tahun.toString() === tahun);
              
              if (!item) return null;
              
              return (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium mb-2">Informasi Dasar</h4>
                      <div className="space-y-2 text-sm">
                        <div><strong>Kode UK:</strong> {item.Kode_UK}</div>
                        <div><strong>Unit Kerja:</strong> {item.Nama_Unit_Kerja}</div>
                        <div><strong>Tahun:</strong> {item.tahun}</div>
                        <div><strong>Jenis:</strong> 
                          <Badge variant={getJenisBadgeVariant(item.Jenis)} className="ml-2">
                            {item.Jenis || "Non Layanan"}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium mb-2">Sumber Daya Manusia</h4>
                      <div className="space-y-2 text-sm">
                        <div><strong>Dokter:</strong> {item.SDM_dokter || 0}</div>
                        <div><strong>Perawat:</strong> {item.SDM_Perawat || 0}</div>
                        <div><strong>Non Medis:</strong> {item.SDM_Non || 0}</div>
                        <div className="border-t pt-2">
                          <strong>Total SDM:</strong> {(item.SDM_dokter || 0) + (item.SDM_Perawat || 0) + (item.SDM_Non || 0)}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Aktivitas & Pelayanan</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <div><strong>Kunjungan Lama:</strong> {item.Kunjungan_Pasien_Lama || 0}</div>
                        <div><strong>Kunjungan Baru:</strong> {item.Kunjungan_Pasien_Baru || 0}</div>
                      </div>
                      <div>
                        <div><strong>Total Kunjungan:</strong> {(item.Kunjungan_Pasien_Lama || 0) + (item.Kunjungan_Pasien_Baru || 0)}</div>
                        <div><strong>Jumlah Tindakan:</strong> {item.Jumlah_Tindakan || 0}</div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default PengelompokanData;
