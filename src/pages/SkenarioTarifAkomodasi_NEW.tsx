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
    profit_vvip: number;
    profit_vip: number;
    profit_i: number;
    profit_ii: number;
    profit_iii: number;
  }>({
    profit_vvip: 0,
    profit_vip: 0,
    profit_i: 0,
    profit_ii: 0,
    profit_iii: 0,
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

  // Update profit untuk row tertentu
  const updateProfitMutation = useMutation({
    mutationFn: async ({ 
      id, 
      values 
    }: { 
      id: string; 
      values: { 
        profit_vvip: number; 
        profit_vip: number; 
        profit_i: number; 
        profit_ii: number; 
        profit_iii: number;
      } 
    }) => {
      const { error } = await supabase
        .from("skenario_tarif_akomodasi")
        .update({
          profit_vvip: values.profit_vvip,
          profit_vip: values.profit_vip,
          profit_i: values.profit_i,
          profit_ii: values.profit_ii,
          profit_iii: values.profit_iii,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Berhasil update profit");
      setEditingRow(null);
      queryClient.invalidateQueries({ queryKey: ["skenario_tarif_akomodasi"] });
    },
    onError: (error) => {
      toast.error("Gagal update profit: " + error.message);
    },
  });

  const handleEditRow = (row: SkenarioTarifAkomodasiRow) => {
    setEditingRow(row.id);
    setEditValues({
      profit_vvip: row.profit_vvip || 0,
      profit_vip: row.profit_vip || 0,
      profit_i: row.profit_i || 0,
      profit_ii: row.profit_ii || 0,
      profit_iii: row.profit_iii || 0,
    });
  };

  const handleSaveRow = (id: string) => {
    updateProfitMutation.mutate({ id, values: editValues });
  };

  const handleCancelEdit = () => {
    setEditingRow(null);
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
                    <TableHead className="w-[80px] font-bold text-white">Kode</TableHead>
                    <TableHead className="w-[200px] text-white">Ruang</TableHead>
                    <TableHead className="text-center text-white" colSpan={5}>Unit Cost (UC)</TableHead>
                    <TableHead className="text-center text-white" colSpan={5}>Profit (Manual)</TableHead>
                    <TableHead className="text-center text-white" colSpan={5}>Tarif (UC + Profit)</TableHead>
                    <TableHead className="w-[80px] text-center text-white">Aksi</TableHead>
                  </TableRow>
                  <TableRow className="bg-[#0d9488]">
                    <TableHead className="text-white"></TableHead>
                    <TableHead className="text-white"></TableHead>
                    {/* UC Headers */}
                    <TableHead className="text-right text-white text-xs">VVIP</TableHead>
                    <TableHead className="text-right text-white text-xs">VIP</TableHead>
                    <TableHead className="text-right text-white text-xs">I</TableHead>
                    <TableHead className="text-right text-white text-xs">II</TableHead>
                    <TableHead className="text-right text-white text-xs">III</TableHead>
                    {/* Profit Headers */}
                    <TableHead className="text-right text-white text-xs">VVIP</TableHead>
                    <TableHead className="text-right text-white text-xs">VIP</TableHead>
                    <TableHead className="text-right text-white text-xs">I</TableHead>
                    <TableHead className="text-right text-white text-xs">II</TableHead>
                    <TableHead className="text-right text-white text-xs">III</TableHead>
                    {/* Tarif Headers */}
                    <TableHead className="text-right text-white text-xs">VVIP</TableHead>
                    <TableHead className="text-right text-white text-xs">VIP</TableHead>
                    <TableHead className="text-right text-white text-xs">I</TableHead>
                    <TableHead className="text-right text-white text-xs">II</TableHead>
                    <TableHead className="text-right text-white text-xs">III</TableHead>
                    <TableHead className="text-white"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {/* Average Row */}
                  <TableRow className="bg-yellow-50 font-bold">
                    <TableCell colSpan={2} className="text-center">Average</TableCell>
                    {/* Average UC */}
                    <TableCell className="text-right text-sm">{formatCurrency(averages.unit_cost_vvip)}</TableCell>
                    <TableCell className="text-right text-sm">{formatCurrency(averages.unit_cost_vip)}</TableCell>
                    <TableCell className="text-right text-sm">{formatCurrency(averages.unit_cost_i)}</TableCell>
                    <TableCell className="text-right text-sm">{formatCurrency(averages.unit_cost_ii)}</TableCell>
                    <TableCell className="text-right text-sm">{formatCurrency(averages.unit_cost_iii)}</TableCell>
                    {/* Average Profit */}
                    <TableCell className="text-right text-sm text-green-600">{formatCurrency(averages.profit_vvip)}</TableCell>
                    <TableCell className="text-right text-sm text-green-600">{formatCurrency(averages.profit_vip)}</TableCell>
                    <TableCell className="text-right text-sm text-green-600">{formatCurrency(averages.profit_i)}</TableCell>
                    <TableCell className="text-right text-sm text-green-600">{formatCurrency(averages.profit_ii)}</TableCell>
                    <TableCell className="text-right text-sm text-green-600">{formatCurrency(averages.profit_iii)}</TableCell>
                    {/* Average Tarif */}
                    <TableCell className="text-right text-sm font-bold text-blue-600">{formatCurrency(averageTarif.vvip)}</TableCell>
                    <TableCell className="text-right text-sm font-bold text-blue-600">{formatCurrency(averageTarif.vip)}</TableCell>
                    <TableCell className="text-right text-sm font-bold text-blue-600">{formatCurrency(averageTarif.i)}</TableCell>
                    <TableCell className="text-right text-sm font-bold text-blue-600">{formatCurrency(averageTarif.ii)}</TableCell>
                    <TableCell className="text-right text-sm font-bold text-blue-600">{formatCurrency(averageTarif.iii)}</TableCell>
                    <TableCell></TableCell>
                  </TableRow>

                  {/* Data Rows */}
                  {skenarioData.map((row) => {
                    const isEditing = editingRow === row.id;
                    
                    // Calculate preview tarif saat edit
                    const previewTarif = isEditing ? {
                      vvip: row.unit_cost_vvip + editValues.profit_vvip,
                      vip: row.unit_cost_vip + editValues.profit_vip,
                      i: row.unit_cost_i + editValues.profit_i,
                      ii: row.unit_cost_ii + editValues.profit_ii,
                      iii: row.unit_cost_iii + editValues.profit_iii,
                    } : null;
                    
                    return (
                      <TableRow key={row.id} className={row.unit_cost_vvip > 0 || row.unit_cost_vip > 0 ? "bg-yellow-100" : ""}>
                        <TableCell className="font-medium text-xs">{row.kode_unit_kerja}</TableCell>
                        <TableCell className="text-sm">{row.nama_unit_kerja}</TableCell>
                        
                        {/* Unit Cost - Read Only */}
                        <TableCell className="text-right text-xs">{row.unit_cost_vvip > 0 ? formatCurrency(row.unit_cost_vvip) : "-"}</TableCell>
                        <TableCell className="text-right text-xs">{row.unit_cost_vip > 0 ? formatCurrency(row.unit_cost_vip) : "-"}</TableCell>
                        <TableCell className="text-right text-xs">{row.unit_cost_i > 0 ? formatCurrency(row.unit_cost_i) : "-"}</TableCell>
                        <TableCell className="text-right text-xs">{row.unit_cost_ii > 0 ? formatCurrency(row.unit_cost_ii) : "-"}</TableCell>
                        <TableCell className="text-right text-xs">{row.unit_cost_iii > 0 ? formatCurrency(row.unit_cost_iii) : "-"}</TableCell>
                        
                        {/* Profit - Editable */}
                        <TableCell className="text-right">
                          {isEditing && row.unit_cost_vvip > 0 ? (
                            <Input
                              type="number"
                              value={editValues.profit_vvip}
                              onChange={(e) => setEditValues(prev => ({ ...prev, profit_vvip: parseFloat(e.target.value) || 0 }))}
                              className="w-24 text-right text-xs h-8"
                            />
                          ) : (
                            <span className="text-xs">{row.unit_cost_vvip > 0 ? formatCurrency(row.profit_vvip) : "-"}</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {isEditing && row.unit_cost_vip > 0 ? (
                            <Input
                              type="number"
                              value={editValues.profit_vip}
                              onChange={(e) => setEditValues(prev => ({ ...prev, profit_vip: parseFloat(e.target.value) || 0 }))}
                              className="w-24 text-right text-xs h-8"
                            />
                          ) : (
                            <span className="text-xs">{row.unit_cost_vip > 0 ? formatCurrency(row.profit_vip) : "-"}</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {isEditing && row.unit_cost_i > 0 ? (
                            <Input
                              type="number"
                              value={editValues.profit_i}
                              onChange={(e) => setEditValues(prev => ({ ...prev, profit_i: parseFloat(e.target.value) || 0 }))}
                              className="w-24 text-right text-xs h-8"
                            />
                          ) : (
                            <span className="text-xs">{row.unit_cost_i > 0 ? formatCurrency(row.profit_i) : "-"}</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {isEditing && row.unit_cost_ii > 0 ? (
                            <Input
                              type="number"
                              value={editValues.profit_ii}
                              onChange={(e) => setEditValues(prev => ({ ...prev, profit_ii: parseFloat(e.target.value) || 0 }))}
                              className="w-24 text-right text-xs h-8"
                            />
                          ) : (
                            <span className="text-xs">{row.unit_cost_ii > 0 ? formatCurrency(row.profit_ii) : "-"}</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {isEditing && row.unit_cost_iii > 0 ? (
                            <Input
                              type="number"
                              value={editValues.profit_iii}
                              onChange={(e) => setEditValues(prev => ({ ...prev, profit_iii: parseFloat(e.target.value) || 0 }))}
                              className="w-24 text-right text-xs h-8"
                            />
                          ) : (
                            <span className="text-xs">{row.unit_cost_iii > 0 ? formatCurrency(row.profit_iii) : "-"}</span>
                          )}
                        </TableCell>
                        
                        {/* Tarif - Calculated */}
                        <TableCell className="text-right">
                          <span className={`text-xs font-bold ${isEditing ? 'text-blue-600' : ''}`}>
                            {row.unit_cost_vvip > 0 ? formatCurrency(isEditing ? previewTarif!.vvip : row.tarif_vvip) : "-"}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <span className={`text-xs font-bold ${isEditing ? 'text-blue-600' : ''}`}>
                            {row.unit_cost_vip > 0 ? formatCurrency(isEditing ? previewTarif!.vip : row.tarif_vip) : "-"}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <span className={`text-xs font-bold ${isEditing ? 'text-blue-600' : ''}`}>
                            {row.unit_cost_i > 0 ? formatCurrency(isEditing ? previewTarif!.i : row.tarif_i) : "-"}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <span className={`text-xs font-bold ${isEditing ? 'text-blue-600' : ''}`}>
                            {row.unit_cost_ii > 0 ? formatCurrency(isEditing ? previewTarif!.ii : row.tarif_ii) : "-"}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <span className={`text-xs font-bold ${isEditing ? 'text-blue-600' : ''}`}>
                            {row.unit_cost_iii > 0 ? formatCurrency(isEditing ? previewTarif!.iii : row.tarif_iii) : "-"}
                          </span>
                        </TableCell>
                        
                        {/* Aksi */}
                        <TableCell className="text-center">
                          {isEditing ? (
                            <div className="flex items-center justify-center gap-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleSaveRow(row.id)}
                                disabled={updateProfitMutation.isPending}
                                className="h-7 w-7 p-0"
                              >
                                {updateProfitMutation.isPending ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                  <Check className="h-3 w-3 text-green-600" />
                                )}
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={handleCancelEdit}
                                className="h-7 w-7 p-0"
                              >
                                <X className="h-3 w-3 text-red-600" />
                              </Button>
                            </div>
                          ) : (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleEditRow(row)}
                              className="h-7 w-7 p-0"
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
