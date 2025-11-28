import React, { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Loader2, Download, Upload, Calculator, Pencil, Check, X } from "lucide-react";
import { useReportDownload } from "@/components/report";
import { formatCurrency } from "@/lib/utils";
import { calculateTariff } from "@/utils/calculations";

interface SkenarioTarifVisitData {
  id: string;
  tahun: number;
  // Visit Dokter Umum
  visit_dokter_umum: number;
  jasa_sarana_visit_umum: number;
  jasa_pelayanan_medis_visit_umum: number;
  jasa_pelayanan_non_medis_visit_umum: number;
  jasa_pelayanan_visit_umum: number;
  prosentase_jasa_pelayanan_visit_umum: number;
  // Visit Dokter Spesialis
  visit_dokter_spesialis: number;
  jasa_sarana_visit_spesialis: number;
  jasa_pelayanan_medis_visit_spesialis: number;
  jasa_pelayanan_non_medis_visit_spesialis: number;
  jasa_pelayanan_visit_spesialis: number;
  prosentase_jasa_pelayanan_visit_spesialis: number;
  // Visit Dokter Subspesialis
  visit_dokter_subspesialis: number;
  jasa_sarana_visit_subspesialis: number;
  jasa_pelayanan_medis_visit_subspesialis: number;
  jasa_pelayanan_non_medis_visit_subspesialis: number;
  jasa_pelayanan_visit_subspesialis: number;
  prosentase_jasa_pelayanan_visit_subspesialis: number;
  // Konsultasi Dokter Spesialis
  konsultasi_dokter_spesialis: number;
  jasa_sarana_konsultasi_spesialis: number;
  jasa_pelayanan_medis_konsultasi_spesialis: number;
  jasa_pelayanan_non_medis_konsultasi_spesialis: number;
  jasa_pelayanan_konsultasi_spesialis: number;
  prosentase_jasa_pelayanan_konsultasi_spesialis: number;
  // Konsultasi Dokter Subspesialis
  konsultasi_dokter_subspesialis: number;
  jasa_sarana_konsultasi_subspesialis: number;
  jasa_pelayanan_medis_konsultasi_subspesialis: number;
  jasa_pelayanan_non_medis_konsultasi_subspesialis: number;
  jasa_pelayanan_konsultasi_subspesialis: number;
  prosentase_jasa_pelayanan_konsultasi_subspesialis: number;
}

interface JenisData {
  jenis: string;
  tarif: number;
  jasaSarana: number;
  jasaPelayananMedis: number;
  jasaPelayananNonMedis: number;
  jasaPelayanan: number;
  prosentaseJasaPelayanan: number;
}

const SkenarioTarifVisit = () => {
  const [tahun, setTahun] = useState<number>(2025);
  const [editingJenis, setEditingJenis] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<{
    jasaSarana: number;
    jasaPelayananMedis: number;
    jasaPelayananNonMedis: number;
  }>({
    jasaSarana: 0,
    jasaPelayananMedis: 0,
    jasaPelayananNonMedis: 0,
  });
  const [downloadingReport, setDownloadingReport] = useState<boolean>(false);

  const queryClient = useQueryClient();
  const { downloadReport } = useReportDownload();

  // Fetch data skenario tarif visit
  const { data: skenarioData, isLoading, refetch } = useQuery({
    queryKey: ["skenario_tarif_visit", tahun],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("skenario_tarif_visit")
        .select("*")
        .eq("tahun", tahun)
        .maybeSingle();

      if (error) throw error;
      return data as SkenarioTarifVisitData | null;
    },
    enabled: !!tahun,
  });

  // Transform data into table format
  const jenisDataArray: JenisData[] = React.useMemo(() => {
    if (!skenarioData) return [];
    
    return [
      {
        jenis: "Visit Dokter Umum",
        tarif: skenarioData.visit_dokter_umum || 0,
        jasaSarana: skenarioData.jasa_sarana_visit_umum || 0,
        jasaPelayananMedis: skenarioData.jasa_pelayanan_medis_visit_umum || 0,
        jasaPelayananNonMedis: skenarioData.jasa_pelayanan_non_medis_visit_umum || 0,
        jasaPelayanan: skenarioData.jasa_pelayanan_visit_umum || 0,
        prosentaseJasaPelayanan: skenarioData.prosentase_jasa_pelayanan_visit_umum || 0,
      },
      {
        jenis: "Visit Dokter Spesialis",
        tarif: skenarioData.visit_dokter_spesialis || 0,
        jasaSarana: skenarioData.jasa_sarana_visit_spesialis || 0,
        jasaPelayananMedis: skenarioData.jasa_pelayanan_medis_visit_spesialis || 0,
        jasaPelayananNonMedis: skenarioData.jasa_pelayanan_non_medis_visit_spesialis || 0,
        jasaPelayanan: skenarioData.jasa_pelayanan_visit_spesialis || 0,
        prosentaseJasaPelayanan: skenarioData.prosentase_jasa_pelayanan_visit_spesialis || 0,
      },
      {
        jenis: "Visit Dokter Subspesialis",
        tarif: skenarioData.visit_dokter_subspesialis || 0,
        jasaSarana: skenarioData.jasa_sarana_visit_subspesialis || 0,
        jasaPelayananMedis: skenarioData.jasa_pelayanan_medis_visit_subspesialis || 0,
        jasaPelayananNonMedis: skenarioData.jasa_pelayanan_non_medis_visit_subspesialis || 0,
        jasaPelayanan: skenarioData.jasa_pelayanan_visit_subspesialis || 0,
        prosentaseJasaPelayanan: skenarioData.prosentase_jasa_pelayanan_visit_subspesialis || 0,
      },
      {
        jenis: "Konsultasi Dokter Spesialis",
        tarif: skenarioData.konsultasi_dokter_spesialis || 0,
        jasaSarana: skenarioData.jasa_sarana_konsultasi_spesialis || 0,
        jasaPelayananMedis: skenarioData.jasa_pelayanan_medis_konsultasi_spesialis || 0,
        jasaPelayananNonMedis: skenarioData.jasa_pelayanan_non_medis_konsultasi_spesialis || 0,
        jasaPelayanan: skenarioData.jasa_pelayanan_konsultasi_spesialis || 0,
        prosentaseJasaPelayanan: skenarioData.prosentase_jasa_pelayanan_konsultasi_spesialis || 0,
      },
      {
        jenis: "Konsultasi Dokter Subspesialis",
        tarif: skenarioData.konsultasi_dokter_subspesialis || 0,
        jasaSarana: skenarioData.jasa_sarana_konsultasi_subspesialis || 0,
        jasaPelayananMedis: skenarioData.jasa_pelayanan_medis_konsultasi_subspesialis || 0,
        jasaPelayananNonMedis: skenarioData.jasa_pelayanan_non_medis_konsultasi_subspesialis || 0,
        jasaPelayanan: skenarioData.jasa_pelayanan_konsultasi_subspesialis || 0,
        prosentaseJasaPelayanan: skenarioData.prosentase_jasa_pelayanan_konsultasi_subspesialis || 0,
      },
    ];
  }, [skenarioData]);

  // Populate data dari kalkulasi
  const populateMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.rpc("populate_skenario_tarif_visit", {
        p_user_id: (await supabase.auth.getUser()).data.user?.id,
        p_tahun: tahun,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (count) => {
      toast.success(`Berhasil memuat data skenario tarif visit dan konsultasi`);
      queryClient.invalidateQueries({ queryKey: ["skenario_tarif_visit"] });
    },
    onError: (error) => {
      toast.error("Gagal memuat data: " + error.message);
    },
  });

  // Update tarif for a specific jenis dengan calculation
  const updateTarifMutation = useMutation({
    mutationFn: async ({ 
      jenis, 
      values 
    }: { 
      jenis: string; 
      values: { jasaSarana: number; jasaPelayananMedis: number; jasaPelayananNonMedis: number } 
    }) => {
      if (!skenarioData) throw new Error("No data found");
      
      // Get tarif untuk jenis ini
      const jenisKey = jenis.toLowerCase()
        .replace("visit dokter umum", "visit_umum")
        .replace("visit dokter spesialis", "visit_spesialis")
        .replace("visit dokter subspesialis", "visit_subspesialis")
        .replace("konsultasi dokter spesialis", "konsultasi_spesialis")
        .replace("konsultasi dokter subspesialis", "konsultasi_subspesialis");
      
      // Calculate derived values menggunakan shared utility
      const calculated = calculateTariff({
        jasaSarana: values.jasaSarana,
        jasaPelayananMedis: values.jasaPelayananMedis,
        jasaPelayananNonMedis: values.jasaPelayananNonMedis,
        unitCost: 0, // Visit tidak punya unit cost
      });
      
      // Prepare update object dengan semua field yang dikalkulasi
      const updateData = {
        [`jasa_sarana_${jenisKey}`]: values.jasaSarana,
        [`jasa_pelayanan_medis_${jenisKey}`]: values.jasaPelayananMedis,
        [`jasa_pelayanan_non_medis_${jenisKey}`]: values.jasaPelayananNonMedis,
        [`jasa_pelayanan_${jenisKey}`]: calculated.jasaPelayanan,
        [`prosentase_jasa_pelayanan_${jenisKey}`]: calculated.prosentaseJasaPelayanan,
        updated_at: new Date().toISOString(),
      };
      
      const { error } = await supabase
        .from("skenario_tarif_visit")
        .update(updateData)
        .eq("id", skenarioData.id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Berhasil update tarif");
      setEditingJenis(null);
      queryClient.invalidateQueries({ queryKey: ["skenario_tarif_visit"] });
    },
    onError: (error) => {
      toast.error("Gagal update tarif: " + error.message);
    },
  });

  const handleEditJenis = (item: JenisData) => {
    setEditingJenis(item.jenis);
    setEditValues({
      jasaSarana: item.jasaSarana,
      jasaPelayananMedis: item.jasaPelayananMedis,
      jasaPelayananNonMedis: item.jasaPelayananNonMedis,
    });
  };

  const handleSaveJenis = (jenis: string) => {
    updateTarifMutation.mutate({ jenis, values: editValues });
  };

  const handleCancelEdit = () => {
    setEditingJenis(null);
  };

  const handleDownloadReport = async () => {
    if (!jenisDataArray || jenisDataArray.length === 0) {
      toast.error("Belum ada data untuk diunduh");
      return;
    }

    try {
      setDownloadingReport(true);

      const records = jenisDataArray.map((item) => ({
        "Tahun": tahun,
        "Jenis": item.jenis,
        "Tarif": Math.round(item.tarif || 0),
        "Jasa Sarana": Math.round(item.jasaSarana || 0),
        "JP Medis": Math.round(item.jasaPelayananMedis || 0),
        "JP Non Medis": Math.round(item.jasaPelayananNonMedis || 0),
        "JP Total": Math.round(item.jasaPelayanan || 0),
        "% JP": Number((item.prosentaseJasaPelayanan || 0).toFixed(2)),
      }));

      await downloadReport({
        title: "Laporan Skenario Tarif Visit dan Konsultasi",
        subtitle: `Tahun ${tahun}`,
        filename: `skenario_tarif_visit_${tahun}`,
        records,
        orientation: "landscape",
      });

      toast.success("Laporan berhasil disiapkan");
    } catch (error: any) {
      console.error("Gagal mengunduh skenario tarif visit:", error);
      toast.error(error?.message || "Terjadi kesalahan saat menyiapkan laporan");
    } finally {
      setDownloadingReport(false);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Skenario Tarif Visit dan Konsultasi</h1>
          <p className="text-muted-foreground">
            Kelola tarif visit dan konsultasi dokter dengan perhitungan komponen otomatis
          </p>
        </div>
      </div>

      {/* Configuration Panel */}
      <Card>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tahun">Tahun</Label>
              <Input
                id="tahun"
                type="number"
                value={tahun}
                onChange={(e) => setTahun(parseInt(e.target.value))}
                min="2020"
                max="2030"
              />
            </div>
          </div>
          
          <Separator />
          
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex flex-wrap gap-2 items-center">
              <Button 
                onClick={() => populateMutation.mutate()} 
                disabled={populateMutation.isPending}
                className="bg-blue-600 text-white hover:bg-blue-700 disabled:bg-blue-300 disabled:text-white/80"
              >
                {populateMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4 mr-2" />
                )}
                Update Data
              </Button>
              
              <Button 
                onClick={() => {
                  void handleDownloadReport();
                }} 
                disabled={!jenisDataArray.length || downloadingReport}
                className="bg-red-600 text-white hover:bg-red-700 disabled:bg-red-400 disabled:cursor-not-allowed"
              >
                {downloadingReport ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Download className="h-4 w-4 mr-2" />
                )}
                {downloadingReport ? "Menyiapkan..." : "Unduh Laporan"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data Table */}
      <Card>
        <CardHeader>
          <CardTitle>Data Skenario Tarif Visit dan Konsultasi</CardTitle>
          <CardDescription>
            {jenisDataArray.length > 0 ? `${jenisDataArray.length} jenis layanan` : "Belum ada data"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
              <span className="ml-2">Memuat data...</span>
            </div>
          ) : jenisDataArray.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Calculator className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Belum ada data skenario tarif visit dan konsultasi untuk tahun {tahun}</p>
              <p className="text-sm">Klik "Update Data" untuk memulai</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-[#0f766e]">
                  <TableRow className="bg-[#0f766e] hover:bg-[#0f766e]">
                    <TableHead className="w-[200px] font-bold text-white">Jenis Layanan</TableHead>
                    <TableHead className="text-right w-[130px] text-white">Tarif</TableHead>
                    <TableHead className="text-right w-[130px] text-white">Jasa Sarana</TableHead>
                    <TableHead className="text-right w-[130px] text-white">JP Medis</TableHead>
                    <TableHead className="text-right w-[130px] text-white">JP Non Medis</TableHead>
                    <TableHead className="text-right w-[130px] text-white">JP Total</TableHead>
                    <TableHead className="text-right w-[100px] text-white">% JP</TableHead>
                    <TableHead className="w-[100px] text-center text-white">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {jenisDataArray.map((item) => {
                    const isEditing = editingJenis === item.jenis;
                    
                    // Calculate preview values saat edit
                    const previewValues = isEditing ? calculateTariff({
                      jasaSarana: editValues.jasaSarana,
                      jasaPelayananMedis: editValues.jasaPelayananMedis,
                      jasaPelayananNonMedis: editValues.jasaPelayananNonMedis,
                      unitCost: 0,
                    }) : null;
                    
                    return (
                      <TableRow key={item.jenis}>
                        <TableCell className="font-bold">
                          <Badge 
                            variant="outline" 
                            className={`text-sm px-2 py-1 ${
                              item.jenis.includes('Umum') ? 'bg-purple-500 text-white border-purple-500' :
                              item.jenis.includes('Spesialis') && !item.jenis.includes('Sub') ? 'bg-blue-500 text-white border-blue-500' :
                              item.jenis.includes('Subspesialis') ? 'bg-green-500 text-white border-green-500' :
                              'bg-gray-500 text-white border-gray-500'
                            }`}
                          >
                            {item.jenis}
                          </Badge>
                        </TableCell>
                        
                        {/* Tarif */}
                        <TableCell className="text-right font-medium text-sm">
                          {formatCurrency(item.tarif)}
                        </TableCell>
                        
                        {/* Jasa Sarana - Editable */}
                        <TableCell className="text-right">
                          {isEditing ? (
                            <Input
                              type="number"
                              value={editValues.jasaSarana}
                              onChange={(e) => setEditValues(prev => ({ 
                                ...prev, 
                                jasaSarana: parseInt(e.target.value) || 0 
                              }))}
                              className="w-28 text-right text-sm"
                            />
                          ) : (
                            <span className="text-sm">{formatCurrency(item.jasaSarana)}</span>
                          )}
                        </TableCell>
                        
                        {/* JP Medis - Editable */}
                        <TableCell className="text-right">
                          {isEditing ? (
                            <Input
                              type="number"
                              value={editValues.jasaPelayananMedis}
                              onChange={(e) => setEditValues(prev => ({ 
                                ...prev, 
                                jasaPelayananMedis: parseInt(e.target.value) || 0 
                              }))}
                              className="w-28 text-right text-sm"
                            />
                          ) : (
                            <span className="text-sm">{formatCurrency(item.jasaPelayananMedis)}</span>
                          )}
                        </TableCell>
                        
                        {/* JP Non Medis - Editable */}
                        <TableCell className="text-right">
                          {isEditing ? (
                            <Input
                              type="number"
                              value={editValues.jasaPelayananNonMedis}
                              onChange={(e) => setEditValues(prev => ({ 
                                ...prev, 
                                jasaPelayananNonMedis: parseInt(e.target.value) || 0 
                              }))}
                              className="w-28 text-right text-sm"
                            />
                          ) : (
                            <span className="text-sm">{formatCurrency(item.jasaPelayananNonMedis)}</span>
                          )}
                        </TableCell>
                        
                        {/* JP Total - Calculated */}
                        <TableCell className="text-right">
                          <span className={`text-sm font-medium ${isEditing ? 'text-blue-600' : ''}`}>
                            {formatCurrency(isEditing ? previewValues?.jasaPelayanan || 0 : item.jasaPelayanan)}
                          </span>
                        </TableCell>
                        
                        {/* % JP - Calculated */}
                        <TableCell className="text-right">
                          <span className={`text-sm font-medium ${isEditing ? 'text-blue-600' : ''}`}>
                            {(isEditing ? previewValues?.prosentaseJasaPelayanan || 0 : item.prosentaseJasaPelayanan).toFixed(2)}%
                          </span>
                        </TableCell>
                        
                        {/* Actions */}
                        <TableCell className="text-center">
                          {isEditing ? (
                            <div className="flex gap-1 justify-center">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleSaveJenis(item.jenis)}
                                disabled={updateTarifMutation.isPending}
                                className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
                              >
                                <Check className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={handleCancelEdit}
                                disabled={updateTarifMutation.isPending}
                                className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ) : (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleEditJenis(item)}
                              className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SkenarioTarifVisit;
