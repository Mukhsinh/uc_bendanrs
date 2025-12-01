import React, { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Loader2, Download, Upload, Calculator, Pencil, Check, X, TrendingUp } from "lucide-react";
import { useReportDownload } from "@/components/report";
import { formatCurrency } from "@/lib/utils";
import SkenarioTarifImportExportToolbar from "@/components/skenario-tarif/SkenarioTarifImportExportToolbar";

interface SkenarioTarifVisitRow {
  id: string;
  tahun: number;
  tindakan: string;
  jasa_sarana: number;
  jasa_pelayanan_medis: number;
  jasa_pelayanan_non_medis: number;
  tarif: number;
  created_at: string;
  updated_at: string;
}

const SkenarioTarifVisit = () => {
  const [tahun, setTahun] = useState<number>(2025);
  const [editingRow, setEditingRow] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<{
    jasa_sarana: number;
    jasa_pelayanan_medis: number;
    jasa_pelayanan_non_medis: number;
  }>({
    jasa_sarana: 0,
    jasa_pelayanan_medis: 0,
    jasa_pelayanan_non_medis: 0,
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
        .order("tindakan");

      if (error) throw error;
      return data as SkenarioTarifVisitRow[];
    },
    enabled: !!tahun,
  });

  // Calculate statistics
  const statistics = React.useMemo(() => {
    if (!skenarioData || skenarioData.length === 0) {
      return {
        totalTindakan: 0,
        avgJasaSarana: 0,
        avgJasaPelMedis: 0,
        avgJasaPelNonMedis: 0,
        avgTarif: 0,
        totalTarif: 0,
      };
    }

    const totalTindakan = skenarioData.length;
    const avgJasaSarana = skenarioData.reduce((sum, row) => sum + (row.jasa_sarana || 0), 0) / totalTindakan;
    const avgJasaPelMedis = skenarioData.reduce((sum, row) => sum + (row.jasa_pelayanan_medis || 0), 0) / totalTindakan;
    const avgJasaPelNonMedis = skenarioData.reduce((sum, row) => sum + (row.jasa_pelayanan_non_medis || 0), 0) / totalTindakan;
    const avgTarif = skenarioData.reduce((sum, row) => sum + (row.tarif || 0), 0) / totalTindakan;
    const totalTarif = skenarioData.reduce((sum, row) => sum + (row.tarif || 0), 0);

    return {
      totalTindakan,
      avgJasaSarana,
      avgJasaPelMedis,
      avgJasaPelNonMedis,
      avgTarif,
      totalTarif,
    };
  }, [skenarioData]);

  // Populate data dari produk_layanan
  const populateMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.rpc("populate_skenario_tarif_visit", {
        p_tenant_id: null,
        p_tahun: tahun,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success(`Berhasil memuat data skenario tarif visit`);
      queryClient.invalidateQueries({ queryKey: ["skenario_tarif_visit"] });
    },
    onError: (error) => {
      toast.error("Gagal memuat data: " + error.message);
    },
  });

  // Update tarif untuk row tertentu
  const updateTarifMutation = useMutation({
    mutationFn: async ({ 
      id, 
      values 
    }: { 
      id: string; 
      values: { 
        jasa_sarana: number; 
        jasa_pelayanan_medis: number; 
        jasa_pelayanan_non_medis: number;
      } 
    }) => {
      const { error } = await supabase
        .from("skenario_tarif_visit")
        .update({
          jasa_sarana: values.jasa_sarana,
          jasa_pelayanan_medis: values.jasa_pelayanan_medis,
          jasa_pelayanan_non_medis: values.jasa_pelayanan_non_medis,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Berhasil update tarif");
      setEditingRow(null);
      queryClient.invalidateQueries({ queryKey: ["skenario_tarif_visit"] });
    },
    onError: (error) => {
      toast.error("Gagal update tarif: " + error.message);
    },
  });

  const handleEditRow = (row: SkenarioTarifVisitRow) => {
    setEditingRow(row.id);
    setEditValues({
      jasa_sarana: row.jasa_sarana || 0,
      jasa_pelayanan_medis: row.jasa_pelayanan_medis || 0,
      jasa_pelayanan_non_medis: row.jasa_pelayanan_non_medis || 0,
    });
  };

  const handleSaveRow = (id: string) => {
    updateTarifMutation.mutate({ id, values: editValues });
  };

  const handleCancelEdit = () => {
    setEditingRow(null);
  };

  // Handle bulk import
  const handleBulkImport = async (importedData: any[]) => {
    try {
      // Update multiple rows
      const updatePromises = importedData.map((item) =>
        supabase
          .from("skenario_tarif_visit")
          .update({
            jasa_sarana: item.jasa_sarana,
            jasa_pelayanan_medis: item.jasa_pelayanan_medis,
            jasa_pelayanan_non_medis: item.jasa_pelayanan_non_medis,
            updated_at: new Date().toISOString(),
          })
          .eq("id", item.id)
      );

      await Promise.all(updatePromises);
      
      toast.success(`Berhasil mengupdate ${importedData.length} data`);
      queryClient.invalidateQueries({ queryKey: ["skenario_tarif_visit"] });
    } catch (error: any) {
      console.error("Error bulk import:", error);
      toast.error("Gagal mengupdate data: " + error.message);
    }
  };

  const handleDownloadReport = async () => {
    if (!skenarioData || skenarioData.length === 0) {
      toast.error("Belum ada data untuk diunduh");
      return;
    }

    try {
      setDownloadingReport(true);

      const records = skenarioData.map((row) => ({
        "Tindakan": row.tindakan,
        "Jasa Sarana": Math.round(row.jasa_sarana || 0),
        "Jasa Pelayanan Medis": Math.round(row.jasa_pelayanan_medis || 0),
        "Jasa Pelayanan Non Medis": Math.round(row.jasa_pelayanan_non_medis || 0),
        "Tarif": Math.round(row.tarif || 0),
      }));

      await downloadReport({
        title: "Laporan Skenario Tarif Visit & Konsultasi",
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
          <h1 className="text-3xl font-bold">Skenario Tarif Visit & Konsultasi</h1>
          <p className="text-muted-foreground">
            Kelola tarif visit dan konsultasi dokter dengan komponen jasa yang dapat diedit manual
          </p>
        </div>
      </div>

      {/* Configuration Panel */}
      <Card>
        <CardContent className="pt-6 space-y-4">
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
              {/* Import/Export Toolbar */}
              {skenarioData && skenarioData.length > 0 && (
                <SkenarioTarifImportExportToolbar
                  tahun={tahun}
                  type="visit"
                  data={skenarioData}
                  onImport={handleBulkImport}
                />
              )}
              
              <Button 
                onClick={() => populateMutation.mutate()} 
                disabled={populateMutation.isPending}
                className="bg-blue-600 text-white hover:bg-blue-700"
              >
                {populateMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4 mr-2" />
                )}
                Perbarui Data
              </Button>
              
              <Button 
                onClick={() => {
                  void handleDownloadReport();
                }} 
                disabled={!skenarioData?.length || downloadingReport}
                className="bg-red-600 text-white hover:bg-red-700"
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

      {/* Statistics Cards - Compact */}
      {skenarioData && skenarioData.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100">
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-blue-600 font-medium">Total Tindakan</p>
                  <p className="text-lg font-bold text-blue-900">{statistics.totalTindakan}</p>
                </div>
                <TrendingUp className="h-6 w-6 text-blue-600 opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100">
            <CardContent className="p-3">
              <div>
                <p className="text-xs text-green-600 font-medium">Avg Jasa Sarana</p>
                <p className="text-sm font-bold text-green-900">{formatCurrency(statistics.avgJasaSarana)}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100">
            <CardContent className="p-3">
              <div>
                <p className="text-xs text-purple-600 font-medium">Avg JP Medis</p>
                <p className="text-sm font-bold text-purple-900">{formatCurrency(statistics.avgJasaPelMedis)}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-50 to-orange-100">
            <CardContent className="p-3">
              <div>
                <p className="text-xs text-orange-600 font-medium">Avg JP Non Medis</p>
                <p className="text-sm font-bold text-orange-900">{formatCurrency(statistics.avgJasaPelNonMedis)}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-teal-50 to-teal-100">
            <CardContent className="p-3">
              <div>
                <p className="text-xs text-teal-600 font-medium">Avg Tarif</p>
                <p className="text-sm font-bold text-teal-900">{formatCurrency(statistics.avgTarif)}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-red-50 to-red-100">
            <CardContent className="p-3">
              <div>
                <p className="text-xs text-red-600 font-medium">Total Tarif</p>
                <p className="text-sm font-bold text-red-900">{formatCurrency(statistics.totalTarif)}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Data Table */}
      <Card>
        <CardHeader>
          <CardTitle>Data Skenario Tarif Visit & Konsultasi</CardTitle>
          <CardDescription>
            {skenarioData?.length ? `${skenarioData.length} jenis tindakan` : "Belum ada data"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
              <span className="ml-2">Memuat data...</span>
            </div>
          ) : !skenarioData || skenarioData.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Calculator className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Belum ada data skenario tarif visit untuk tahun {tahun}</p>
              <p className="text-sm">Klik "Perbarui Data" untuk memulai</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-[#0f766e]">
                  <TableRow className="bg-[#0f766e] hover:bg-[#0f766e]">
                    <TableHead className="w-[250px] font-bold text-white text-xs px-2">Tindakan</TableHead>
                    <TableHead className="text-right text-white text-xs px-2">Jasa Sarana</TableHead>
                    <TableHead className="text-right text-white text-xs px-2">Jasa Pel. Medis</TableHead>
                    <TableHead className="text-right text-white text-xs px-2">Jasa Pel. Non Medis</TableHead>
                    <TableHead className="text-right text-white text-xs px-2">Tarif (Auto)</TableHead>
                    <TableHead className="w-[60px] text-center text-white text-xs px-1">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {skenarioData.map((row) => {
                    const isEditing = editingRow === row.id;
                    
                    // Calculate preview tarif saat edit
                    const previewTarif = isEditing 
                      ? editValues.jasa_sarana + editValues.jasa_pelayanan_medis + editValues.jasa_pelayanan_non_medis
                      : row.tarif;
                    
                    return (
                      <TableRow key={row.id} className="hover:bg-gray-50">
                        <TableCell className="font-semibold text-xs px-2 py-2">{row.tindakan}</TableCell>
                        
                        {/* Jasa Sarana - Editable */}
                        <TableCell className="text-right px-2 py-2">
                          {isEditing ? (
                            <Input
                              type="number"
                              value={editValues.jasa_sarana}
                              onChange={(e) => setEditValues(prev => ({ ...prev, jasa_sarana: parseFloat(e.target.value) || 0 }))}
                              className="w-24 text-right text-xs h-7 px-1"
                            />
                          ) : (
                            <span className="text-xs">{formatCurrency(row.jasa_sarana)}</span>
                          )}
                        </TableCell>
                        
                        {/* Jasa Pelayanan Medis - Editable */}
                        <TableCell className="text-right px-2 py-2">
                          {isEditing ? (
                            <Input
                              type="number"
                              value={editValues.jasa_pelayanan_medis}
                              onChange={(e) => setEditValues(prev => ({ ...prev, jasa_pelayanan_medis: parseFloat(e.target.value) || 0 }))}
                              className="w-24 text-right text-xs h-7 px-1"
                            />
                          ) : (
                            <span className="text-xs">{formatCurrency(row.jasa_pelayanan_medis)}</span>
                          )}
                        </TableCell>
                        
                        {/* Jasa Pelayanan Non Medis - Editable */}
                        <TableCell className="text-right px-2 py-2">
                          {isEditing ? (
                            <Input
                              type="number"
                              value={editValues.jasa_pelayanan_non_medis}
                              onChange={(e) => setEditValues(prev => ({ ...prev, jasa_pelayanan_non_medis: parseFloat(e.target.value) || 0 }))}
                              className="w-24 text-right text-xs h-7 px-1"
                            />
                          ) : (
                            <span className="text-xs">{formatCurrency(row.jasa_pelayanan_non_medis)}</span>
                          )}
                        </TableCell>
                        
                        {/* Tarif - Auto Calculated */}
                        <TableCell className="text-right px-2 py-2">
                          <span className={`text-xs font-bold text-blue-600 ${isEditing ? 'animate-pulse' : ''}`}>
                            {formatCurrency(previewTarif)}
                          </span>
                        </TableCell>
                        
                        {/* Aksi */}
                        <TableCell className="text-center px-1 py-2">
                          {isEditing ? (
                            <div className="flex items-center justify-center gap-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleSaveRow(row.id)}
                                disabled={updateTarifMutation.isPending}
                                className="h-6 w-6 p-0 hover:bg-green-100"
                              >
                                {updateTarifMutation.isPending ? (
                                  <Loader2 className="h-3 w-3 animate-spin text-green-600" />
                                ) : (
                                  <Check className="h-3 w-3 text-green-600" />
                                )}
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={handleCancelEdit}
                                className="h-6 w-6 p-0 hover:bg-red-100"
                              >
                                <X className="h-3 w-3 text-red-600" />
                              </Button>
                            </div>
                          ) : (
                            <Button
                              size="sm"
                              onClick={() => handleEditRow(row)}
                              className="h-6 w-6 p-0 bg-blue-600 hover:bg-blue-700 text-white"
                            >
                              <Pencil className="h-3 w-3" />
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
