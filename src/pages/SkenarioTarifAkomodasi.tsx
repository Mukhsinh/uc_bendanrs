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
import SkenarioTarifImportExportToolbar from "@/components/skenario-tarif/SkenarioTarifImportExportToolbar";

// Helper function untuk warna kelas
const getKelasColor = (kelas: string) => {
  switch (kelas) {
    case 'VVIP': return 'bg-red-600 text-white border-red-600';
    case 'VIP': return 'bg-purple-600 text-white border-purple-600';
    case 'I': return 'bg-blue-600 text-white border-blue-600';
    case 'II': return 'bg-yellow-600 text-white border-yellow-600'; // Ubah dari green ke yellow untuk kontras
    case 'III': return 'bg-orange-600 text-white border-orange-600';
    default: return 'bg-gray-600 text-white border-gray-600';
  }
};

interface SkenarioTarifAkomodasiRow {
  id: string;
  tahun: number;
  kode_unit_kerja: string;
  nama_unit_kerja: string;
  unit_cost_vvip: number;
  unit_cost_vip: number;
  unit_cost_i: number;
  unit_cost_ii: number;
  unit_cost_iii: number;
  profit_vvip: number;
  profit_vip: number;
  profit_i: number;
  profit_ii: number;
  profit_iii: number;
  tarif_vvip: number;
  tarif_vip: number;
  tarif_i: number;
  tarif_ii: number;
  tarif_iii: number;
  average_unit_cost_vvip: number;
  average_unit_cost_vip: number;
  average_unit_cost_i: number;
  average_unit_cost_ii: number;
  average_unit_cost_iii: number;
  average_profit_vvip: number;
  average_profit_vip: number;
  average_profit_i: number;
  average_profit_ii: number;
  average_profit_iii: number;
}

const SkenarioTarifAkomodasi = () => {
  const [tahun, setTahun] = useState<number>(2025);
  const [editingRow, setEditingRow] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<{
    tarif_vvip: number;
    tarif_vip: number;
    tarif_i: number;
    tarif_ii: number;
    tarif_iii: number;
  }>({
    tarif_vvip: 0,
    tarif_vip: 0,
    tarif_i: 0,
    tarif_ii: 0,
    tarif_iii: 0,
  });
  const [downloadingReport, setDownloadingReport] = useState<boolean>(false);

  const queryClient = useQueryClient();
  const { downloadReport } = useReportDownload();

  // Fetch data skenario tarif akomodasi
  const { data: skenarioData, isLoading, refetch } = useQuery({
    queryKey: ["skenario_tarif_akomodasi", tahun],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("skenario_tarif_akomodasi")
        .select("*")
        .eq("tahun", tahun)
        .order("kode_unit_kerja");

      if (error) throw error;
      return data as SkenarioTarifAkomodasiRow[];
    },
    enabled: !!tahun,
  });

  // Calculate averages
  const averages = React.useMemo(() => {
    if (!skenarioData || skenarioData.length === 0) {
      return {
        unit_cost_vvip: 0,
        unit_cost_vip: 0,
        unit_cost_i: 0,
        unit_cost_ii: 0,
        unit_cost_iii: 0,
        profit_vvip: 0,
        profit_vip: 0,
        profit_i: 0,
        profit_ii: 0,
        profit_iii: 0,
      };
    }

    const firstRow = skenarioData[0];
    return {
      unit_cost_vvip: firstRow.average_unit_cost_vvip || 0,
      unit_cost_vip: firstRow.average_unit_cost_vip || 0,
      unit_cost_i: firstRow.average_unit_cost_i || 0,
      unit_cost_ii: firstRow.average_unit_cost_ii || 0,
      unit_cost_iii: firstRow.average_unit_cost_iii || 0,
      profit_vvip: firstRow.average_profit_vvip || 0,
      profit_vip: firstRow.average_profit_vip || 0,
      profit_i: firstRow.average_profit_i || 0,
      profit_ii: firstRow.average_profit_ii || 0,
      profit_iii: firstRow.average_profit_iii || 0,
    };
  }, [skenarioData]);

  // Calculate average tarif
  const averageTarif = React.useMemo(() => {
    return {
      vvip: averages.unit_cost_vvip + averages.profit_vvip,
      vip: averages.unit_cost_vip + averages.profit_vip,
      i: averages.unit_cost_i + averages.profit_i,
      ii: averages.unit_cost_ii + averages.profit_ii,
      iii: averages.unit_cost_iii + averages.profit_iii,
    };
  }, [averages]);

  // Calculate total profit dan % profit per row
  const calculateRowTotals = (row: SkenarioTarifAkomodasiRow) => {
    const totalProfit = (row.profit_vvip || 0) + (row.profit_vip || 0) + (row.profit_i || 0) + (row.profit_ii || 0) + (row.profit_iii || 0);
    const totalUnitCost = (row.unit_cost_vvip || 0) + (row.unit_cost_vip || 0) + (row.unit_cost_i || 0) + (row.unit_cost_ii || 0) + (row.unit_cost_iii || 0);
    const profitPercentage = totalUnitCost > 0 ? (totalProfit / totalUnitCost) * 100 : 0;
    return { totalProfit, profitPercentage };
  };

  // Populate data dari kalkulasi_biaya_kelas_akomodasi
  const populateMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.rpc("populate_skenario_tarif_akomodasi", {
        p_tenant_id: null,
        p_tahun: tahun,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success(`Berhasil memuat data skenario tarif akomodasi`);
      queryClient.invalidateQueries({ queryKey: ["skenario_tarif_akomodasi"] });
    },
    onError: (error) => {
      toast.error("Gagal memuat data: " + error.message);
    },
  });

  // Update tarif untuk row tertentu (profit akan dihitung otomatis via trigger)
  const updateTarifMutation = useMutation({
    mutationFn: async ({ 
      id, 
      values 
    }: { 
      id: string; 
      values: { 
        tarif_vvip: number; 
        tarif_vip: number; 
        tarif_i: number; 
        tarif_ii: number; 
        tarif_iii: number;
      } 
    }) => {
      const { error } = await supabase
        .from("skenario_tarif_akomodasi")
        .update({
          tarif_vvip: values.tarif_vvip,
          tarif_vip: values.tarif_vip,
          tarif_i: values.tarif_i,
          tarif_ii: values.tarif_ii,
          tarif_iii: values.tarif_iii,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Berhasil update tarif");
      setEditingRow(null);
      queryClient.invalidateQueries({ queryKey: ["skenario_tarif_akomodasi"] });
    },
    onError: (error) => {
      toast.error("Gagal update tarif: " + error.message);
    },
  });

  const handleEditRow = (row: SkenarioTarifAkomodasiRow) => {
    setEditingRow(row.id);
    setEditValues({
      tarif_vvip: row.tarif_vvip || 0,
      tarif_vip: row.tarif_vip || 0,
      tarif_i: row.tarif_i || 0,
      tarif_ii: row.tarif_ii || 0,
      tarif_iii: row.tarif_iii || 0,
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
          .from("skenario_tarif_akomodasi")
          .update({
            tarif_vvip: item.tarif_vvip,
            tarif_vip: item.tarif_vip,
            tarif_i: item.tarif_i,
            tarif_ii: item.tarif_ii,
            tarif_iii: item.tarif_iii,
            updated_at: new Date().toISOString(),
          })
          .eq("id", item.id)
      );

      await Promise.all(updatePromises);
      
      toast.success(`Berhasil mengupdate ${importedData.length} data`);
      queryClient.invalidateQueries({ queryKey: ["skenario_tarif_akomodasi"] });
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
        "Kode Unit": row.kode_unit_kerja,
        "Nama Unit": row.nama_unit_kerja,
        "UC VVIP": Math.round(row.unit_cost_vvip || 0),
        "UC VIP": Math.round(row.unit_cost_vip || 0),
        "UC I": Math.round(row.unit_cost_i || 0),
        "UC II": Math.round(row.unit_cost_ii || 0),
        "UC III": Math.round(row.unit_cost_iii || 0),
        "Profit VVIP": Math.round(row.profit_vvip || 0),
        "Profit VIP": Math.round(row.profit_vip || 0),
        "Profit I": Math.round(row.profit_i || 0),
        "Profit II": Math.round(row.profit_ii || 0),
        "Profit III": Math.round(row.profit_iii || 0),
        "Tarif VVIP": Math.round(row.tarif_vvip || 0),
        "Tarif VIP": Math.round(row.tarif_vip || 0),
        "Tarif I": Math.round(row.tarif_i || 0),
        "Tarif II": Math.round(row.tarif_ii || 0),
        "Tarif III": Math.round(row.tarif_iii || 0),
      }));

      await downloadReport({
        title: "Laporan Skenario Tarif Akomodasi",
        subtitle: `Tahun ${tahun}`,
        filename: `skenario_tarif_akomodasi_${tahun}`,
        records,
        orientation: "landscape",
      });

      toast.success("Laporan berhasil disiapkan");
    } catch (error: any) {
      console.error("Gagal mengunduh skenario tarif akomodasi:", error);
      toast.error(error?.message || "Terjadi kesalahan saat menyiapkan laporan");
    } finally {
      setDownloadingReport(false);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Skenario Tarif Akomodasi</h1>
          <p className="text-muted-foreground">
            Kelola tarif akomodasi per unit kerja dengan profit yang dapat diedit manual
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
                  type="akomodasi"
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

      {/* Data Table */}
      <Card>
        <CardHeader>
          <CardTitle>Data Skenario Tarif Akomodasi</CardTitle>
          <CardDescription>
            {skenarioData?.length ? `${skenarioData.length} unit kerja` : "Belum ada data"}
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
              <p>Belum ada data skenario tarif akomodasi untuk tahun {tahun}</p>
              <p className="text-sm">Klik "Perbarui Data" untuk memulai</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-[#0f766e]">
                  <TableRow className="bg-[#0f766e] hover:bg-[#0f766e]">
                    <TableHead className="w-[60px] font-bold text-white text-xs px-2">Kode</TableHead>
                    <TableHead className="w-[150px] text-white text-xs px-2">Ruang</TableHead>
                    <TableHead className="text-center text-white text-xs px-1" colSpan={5}>Tarif (Manual)</TableHead>
                    <TableHead className="text-center text-white text-xs px-1" colSpan={5}>Unit Cost (UC)</TableHead>
                    <TableHead className="text-center text-white text-xs px-1" colSpan={5}>Profit (Auto)</TableHead>
                    <TableHead className="w-[60px] text-center text-white text-xs px-1">Aksi</TableHead>
                  </TableRow>
                  <TableRow className="bg-[#0d9488]">
                    <TableHead className="text-white px-2"></TableHead>
                    <TableHead className="text-white px-2"></TableHead>
                    {/* Tarif Headers */}
                    <TableHead className="text-right text-white text-xs px-1">
                      <Badge className={`${getKelasColor('VVIP')} text-xs px-1 py-0`}>VVIP</Badge>
                    </TableHead>
                    <TableHead className="text-right text-white text-xs px-1">
                      <Badge className={`${getKelasColor('VIP')} text-xs px-1 py-0`}>VIP</Badge>
                    </TableHead>
                    <TableHead className="text-right text-white text-xs px-1">
                      <Badge className={`${getKelasColor('I')} text-xs px-1 py-0`}>I</Badge>
                    </TableHead>
                    <TableHead className="text-right text-white text-xs px-1">
                      <Badge className={`${getKelasColor('II')} text-xs px-1 py-0`}>II</Badge>
                    </TableHead>
                    <TableHead className="text-right text-white text-xs px-1">
                      <Badge className={`${getKelasColor('III')} text-xs px-1 py-0`}>III</Badge>
                    </TableHead>
                    {/* UC Headers */}
                    <TableHead className="text-right text-white text-xs px-1">
                      <Badge className={`${getKelasColor('VVIP')} text-xs px-1 py-0`}>VVIP</Badge>
                    </TableHead>
                    <TableHead className="text-right text-white text-xs px-1">
                      <Badge className={`${getKelasColor('VIP')} text-xs px-1 py-0`}>VIP</Badge>
                    </TableHead>
                    <TableHead className="text-right text-white text-xs px-1">
                      <Badge className={`${getKelasColor('I')} text-xs px-1 py-0`}>I</Badge>
                    </TableHead>
                    <TableHead className="text-right text-white text-xs px-1">
                      <Badge className={`${getKelasColor('II')} text-xs px-1 py-0`}>II</Badge>
                    </TableHead>
                    <TableHead className="text-right text-white text-xs px-1">
                      <Badge className={`${getKelasColor('III')} text-xs px-1 py-0`}>III</Badge>
                    </TableHead>
                    {/* Profit Headers */}
                    <TableHead className="text-right text-white text-xs px-1">
                      <Badge className={`${getKelasColor('VVIP')} text-xs px-1 py-0`}>VVIP</Badge>
                    </TableHead>
                    <TableHead className="text-right text-white text-xs px-1">
                      <Badge className={`${getKelasColor('VIP')} text-xs px-1 py-0`}>VIP</Badge>
                    </TableHead>
                    <TableHead className="text-right text-white text-xs px-1">
                      <Badge className={`${getKelasColor('I')} text-xs px-1 py-0`}>I</Badge>
                    </TableHead>
                    <TableHead className="text-right text-white text-xs px-1">
                      <Badge className={`${getKelasColor('II')} text-xs px-1 py-0`}>II</Badge>
                    </TableHead>
                    <TableHead className="text-right text-white text-xs px-1">
                      <Badge className={`${getKelasColor('III')} text-xs px-1 py-0`}>III</Badge>
                    </TableHead>
                    <TableHead className="text-white px-1"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {/* Average Row */}
                  <TableRow className="bg-yellow-50 font-bold">
                    <TableCell colSpan={2} className="text-center text-xs px-2 py-2">Average</TableCell>
                    {/* Average Tarif */}
                    <TableCell className="text-right text-xs font-bold text-blue-600 px-1 py-2">{formatCurrency(averageTarif.vvip)}</TableCell>
                    <TableCell className="text-right text-xs font-bold text-blue-600 px-1 py-2">{formatCurrency(averageTarif.vip)}</TableCell>
                    <TableCell className="text-right text-xs font-bold text-blue-600 px-1 py-2">{formatCurrency(averageTarif.i)}</TableCell>
                    <TableCell className="text-right text-xs font-bold text-blue-600 px-1 py-2">{formatCurrency(averageTarif.ii)}</TableCell>
                    <TableCell className="text-right text-xs font-bold text-blue-600 px-1 py-2">{formatCurrency(averageTarif.iii)}</TableCell>
                    {/* Average UC */}
                    <TableCell className="text-right text-xs px-1 py-2">{formatCurrency(averages.unit_cost_vvip)}</TableCell>
                    <TableCell className="text-right text-xs px-1 py-2">{formatCurrency(averages.unit_cost_vip)}</TableCell>
                    <TableCell className="text-right text-xs px-1 py-2">{formatCurrency(averages.unit_cost_i)}</TableCell>
                    <TableCell className="text-right text-xs px-1 py-2">{formatCurrency(averages.unit_cost_ii)}</TableCell>
                    <TableCell className="text-right text-xs px-1 py-2">{formatCurrency(averages.unit_cost_iii)}</TableCell>
                    {/* Average Profit */}
                    <TableCell className="text-right text-xs text-green-600 px-1 py-2">{formatCurrency(averages.profit_vvip)}</TableCell>
                    <TableCell className="text-right text-xs text-green-600 px-1 py-2">{formatCurrency(averages.profit_vip)}</TableCell>
                    <TableCell className="text-right text-xs text-green-600 px-1 py-2">{formatCurrency(averages.profit_i)}</TableCell>
                    <TableCell className="text-right text-xs text-green-600 px-1 py-2">{formatCurrency(averages.profit_ii)}</TableCell>
                    <TableCell className="text-right text-xs text-green-600 px-1 py-2">{formatCurrency(averages.profit_iii)}</TableCell>
                    <TableCell className="px-1 py-2"></TableCell>
                  </TableRow>

                  {/* Data Rows */}
                  {skenarioData.map((row) => {
                    const isEditing = editingRow === row.id;
                    
                    // Calculate preview profit saat edit tarif
                    const previewProfit = isEditing ? {
                      vvip: editValues.tarif_vvip - row.unit_cost_vvip,
                      vip: editValues.tarif_vip - row.unit_cost_vip,
                      i: editValues.tarif_i - row.unit_cost_i,
                      ii: editValues.tarif_ii - row.unit_cost_ii,
                      iii: editValues.tarif_iii - row.unit_cost_iii,
                    } : null;
                    
                    const rowTotals = calculateRowTotals(row);
                    
                    return (
                      <TableRow key={row.id} className={row.unit_cost_vvip > 0 || row.unit_cost_vip > 0 ? "bg-yellow-100" : ""}>
                        <TableCell className="font-medium text-xs px-2 py-2">{row.kode_unit_kerja}</TableCell>
                        <TableCell className="text-xs font-semibold px-2 py-2">{row.nama_unit_kerja}</TableCell>
                        
                        {/* Tarif - Editable */}
                        <TableCell className="text-right px-1 py-2">
                          {isEditing && row.unit_cost_vvip > 0 ? (
                            <Input
                              type="number"
                              value={editValues.tarif_vvip}
                              onChange={(e) => setEditValues(prev => ({ ...prev, tarif_vvip: parseFloat(e.target.value) || 0 }))}
                              className="w-20 text-right text-xs h-7 px-1"
                            />
                          ) : (
                            <span className="text-xs font-bold">{row.unit_cost_vvip > 0 ? formatCurrency(row.tarif_vvip) : "-"}</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right px-1 py-2">
                          {isEditing && row.unit_cost_vip > 0 ? (
                            <Input
                              type="number"
                              value={editValues.tarif_vip}
                              onChange={(e) => setEditValues(prev => ({ ...prev, tarif_vip: parseFloat(e.target.value) || 0 }))}
                              className="w-20 text-right text-xs h-7 px-1"
                            />
                          ) : (
                            <span className="text-xs font-bold">{row.unit_cost_vip > 0 ? formatCurrency(row.tarif_vip) : "-"}</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right px-1 py-2">
                          {isEditing && row.unit_cost_i > 0 ? (
                            <Input
                              type="number"
                              value={editValues.tarif_i}
                              onChange={(e) => setEditValues(prev => ({ ...prev, tarif_i: parseFloat(e.target.value) || 0 }))}
                              className="w-20 text-right text-xs h-7 px-1"
                            />
                          ) : (
                            <span className="text-xs font-bold">{row.unit_cost_i > 0 ? formatCurrency(row.tarif_i) : "-"}</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right px-1 py-2">
                          {isEditing && row.unit_cost_ii > 0 ? (
                            <Input
                              type="number"
                              value={editValues.tarif_ii}
                              onChange={(e) => setEditValues(prev => ({ ...prev, tarif_ii: parseFloat(e.target.value) || 0 }))}
                              className="w-20 text-right text-xs h-7 px-1"
                            />
                          ) : (
                            <span className="text-xs font-bold">{row.unit_cost_ii > 0 ? formatCurrency(row.tarif_ii) : "-"}</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right px-1 py-2">
                          {isEditing && row.unit_cost_iii > 0 ? (
                            <Input
                              type="number"
                              value={editValues.tarif_iii}
                              onChange={(e) => setEditValues(prev => ({ ...prev, tarif_iii: parseFloat(e.target.value) || 0 }))}
                              className="w-20 text-right text-xs h-7 px-1"
                            />
                          ) : (
                            <span className="text-xs font-bold">{row.unit_cost_iii > 0 ? formatCurrency(row.tarif_iii) : "-"}</span>
                          )}
                        </TableCell>
                        
                        {/* Unit Cost - Read Only */}
                        <TableCell className="text-right text-xs px-1 py-2">{row.unit_cost_vvip > 0 ? formatCurrency(row.unit_cost_vvip) : "-"}</TableCell>
                        <TableCell className="text-right text-xs px-1 py-2">{row.unit_cost_vip > 0 ? formatCurrency(row.unit_cost_vip) : "-"}</TableCell>
                        <TableCell className="text-right text-xs px-1 py-2">{row.unit_cost_i > 0 ? formatCurrency(row.unit_cost_i) : "-"}</TableCell>
                        <TableCell className="text-right text-xs px-1 py-2">{row.unit_cost_ii > 0 ? formatCurrency(row.unit_cost_ii) : "-"}</TableCell>
                        <TableCell className="text-right text-xs px-1 py-2">{row.unit_cost_iii > 0 ? formatCurrency(row.unit_cost_iii) : "-"}</TableCell>
                        
                        {/* Profit - Auto Calculated (Preview saat edit) */}
                        <TableCell className="text-right px-1 py-2">
                          <span className={`text-xs text-green-600 ${isEditing ? 'font-bold' : ''}`}>
                            {row.unit_cost_vvip > 0 ? formatCurrency(isEditing ? previewProfit!.vvip : row.profit_vvip) : "-"}
                          </span>
                        </TableCell>
                        <TableCell className="text-right px-1 py-2">
                          <span className={`text-xs text-green-600 ${isEditing ? 'font-bold' : ''}`}>
                            {row.unit_cost_vip > 0 ? formatCurrency(isEditing ? previewProfit!.vip : row.profit_vip) : "-"}
                          </span>
                        </TableCell>
                        <TableCell className="text-right px-1 py-2">
                          <span className={`text-xs text-green-600 ${isEditing ? 'font-bold' : ''}`}>
                            {row.unit_cost_i > 0 ? formatCurrency(isEditing ? previewProfit!.i : row.profit_i) : "-"}
                          </span>
                        </TableCell>
                        <TableCell className="text-right px-1 py-2">
                          <span className={`text-xs text-green-600 ${isEditing ? 'font-bold' : ''}`}>
                            {row.unit_cost_ii > 0 ? formatCurrency(isEditing ? previewProfit!.ii : row.profit_ii) : "-"}
                          </span>
                        </TableCell>
                        <TableCell className="text-right px-1 py-2">
                          <span className={`text-xs text-green-600 ${isEditing ? 'font-bold' : ''}`}>
                            {row.unit_cost_iii > 0 ? formatCurrency(isEditing ? previewProfit!.iii : row.profit_iii) : "-"}
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

export default SkenarioTarifAkomodasi;
