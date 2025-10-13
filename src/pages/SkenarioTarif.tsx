import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Loader2, Download, Upload, Calculator, Settings, Pencil, Check } from "lucide-react";
import * as XLSX from "xlsx";
import { formatCurrency } from "@/lib/utils";

interface SkenarioTarifData {
  id: string;
  tahun: number;
  kode_jenis?: number;
  kode_unit_kerja: string;
  nama_unit_kerja: string;
  kode_operator?: string;
  nama_operator?: string;
  kode_tindakan: string;
  nama_tindakan: string;
  biaya_bahan: number;
  unit_cost_per_tindakan: number;
  prosentase_jasa_pelayanan: number;
  prosentase_profit: number;
  jasa_sarana: number;
  jasa_pelayanan_medis: number;
  jasa_pelayanan_non_medis: number;
  jasa_pelayanan: number;
  tarif_per_tindakan: number;
  sumber_tabel: string;
}

const SkenarioTarif = () => {
  const [tahun, setTahun] = useState<number>(2025);
  const [selectedUnitKerja, setSelectedUnitKerja] = useState<string>("all");
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

  const queryClient = useQueryClient();

  // Fetch data skenario tarif
  const { data: skenarioData, isLoading, refetch } = useQuery({
    queryKey: ["skenario_tarif", tahun],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("skenario_tarif")
        .select("*")
        .eq("tahun", tahun)
        .order("nama_unit_kerja", { ascending: true })
        .order("nama_tindakan", { ascending: true });

      if (error) throw error;
      return data as SkenarioTarifData[];
    },
    enabled: !!tahun,
  });

  // Filter data berdasarkan unit kerja
  const filteredData = React.useMemo(() => {
    if (!skenarioData) return [];
    if (selectedUnitKerja === "all") return skenarioData;
    return skenarioData.filter(item => item.kode_unit_kerja === selectedUnitKerja);
  }, [skenarioData, selectedUnitKerja]);

  // Get unique unit kerja untuk filter
  const unitKerjaOptions = React.useMemo(() => {
    if (!skenarioData) return [];
    const unique = [...new Set(skenarioData.map(item => `${item.kode_unit_kerja} - ${item.nama_unit_kerja}`))];
    return unique.sort();
  }, [skenarioData]);

  // Calculate average jasa pelayanan and profit
  const averageStats = React.useMemo(() => {
    if (!filteredData || filteredData.length === 0) {
      return { avgJasaPelayanan: 0, avgProfit: 0 };
    }

    const totalJasaPelayananPercentage = filteredData.reduce((sum, item) => sum + item.prosentase_jasa_pelayanan, 0);
    const totalProfit = filteredData.reduce((sum, item) => sum + item.prosentase_profit, 0);
    
    return {
      avgJasaPelayanan: totalJasaPelayananPercentage / filteredData.length,
      avgProfit: totalProfit / filteredData.length
    };
  }, [filteredData]);

  // Populate data dari rekapitulasi unit cost
  const populateMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.rpc("populate_skenario_tarif_from_rekapitulasi", {
        p_user_id: (await supabase.auth.getUser()).data.user?.id,
        p_tahun: tahun,
        p_prosentase_jasa_pelayanan: 0,
        p_prosentase_profit: 0,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (count) => {
      toast.success(`Berhasil memuat ${count} data skenario tarif`);
      queryClient.invalidateQueries({ queryKey: ["skenario_tarif"] });
    },
    onError: (error) => {
      toast.error("Gagal memuat data: " + error.message);
    },
  });


  // Update individual row
  const updateRowMutation = useMutation({
    mutationFn: async ({ id, values }: { id: string; values: typeof editValues }) => {
      const { error } = await supabase
        .from("skenario_tarif")
        .update({
          jasa_sarana: values.jasa_sarana,
          jasa_pelayanan_medis: values.jasa_pelayanan_medis,
          jasa_pelayanan_non_medis: values.jasa_pelayanan_non_medis,
        })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Berhasil update data");
      setEditingRow(null);
      queryClient.invalidateQueries({ queryKey: ["skenario_tarif"] });
    },
    onError: (error) => {
      toast.error("Gagal update data: " + error.message);
    },
  });

  const handleEditRow = (item: SkenarioTarifData) => {
    setEditingRow(item.id);
    setEditValues({
      jasa_sarana: item.jasa_sarana || 0,
      jasa_pelayanan_medis: item.jasa_pelayanan_medis || 0,
      jasa_pelayanan_non_medis: item.jasa_pelayanan_non_medis || 0,
    });
  };

  const handleSaveRow = (id: string) => {
    updateRowMutation.mutate({ id, values: editValues });
  };

  const handleCancelEdit = () => {
    setEditingRow(null);
  };


  const handleExport = () => {
    if (!filteredData) return;
    
    const csvContent = [
      ["Unit Kerja", "Operator", "Tindakan", "Unit Cost", "Biaya Bahan", "Jasa Sarana", "Jasa Pelayanan Medis", "Jasa Pelayanan Non Medis", "Jasa Pelayanan", "% Jasa Pelayanan", "% Profit", "Tarif per Tindakan"],
      ...filteredData.map(item => [
        `${item.kode_unit_kerja} - ${item.nama_unit_kerja}`,
        item.nama_operator || "-",
        `${item.kode_tindakan} - ${item.nama_tindakan}`,
        formatCurrency(item.unit_cost_per_tindakan),
        formatCurrency(item.biaya_bahan),
        formatCurrency(item.jasa_sarana),
        formatCurrency(item.jasa_pelayanan_medis || 0),
        formatCurrency(item.jasa_pelayanan_non_medis || 0),
        formatCurrency(item.jasa_pelayanan),
        `${item.prosentase_jasa_pelayanan.toFixed(2)}%`,
        `${item.prosentase_profit.toFixed(2)}%`,
        formatCurrency(item.tarif_per_tindakan),
      ])
    ].map(row => row.join(",")).join("\n");

    const dataForExport = filteredData.map(item => ({
      "Tahun": item.tahun || tahun,
      "Kode Unit Kerja": item.kode_unit_kerja || "",
      "Nama Unit Kerja": item.nama_unit_kerja || "",
      "Kode Tindakan": item.kode_tindakan || "",
      "Nama Tindakan": item.nama_tindakan || "",
      "Unit Cost": item.unit_cost_per_tindakan || 0,
      "Biaya Bahan": item.biaya_bahan || 0,
      "Jasa Sarana": item.jasa_sarana || 0,
      "Jasa Pelayanan Medis": item.jasa_pelayanan_medis || 0,
      "Jasa Pelayanan Non Medis": item.jasa_pelayanan_non_medis || 0,
      "Jasa Pelayanan": item.jasa_pelayanan || 0,
      "Tarif Per Tindakan": item.tarif_per_tindakan || 0,
      "Prosentase Profit": item.prosentase_profit || 0,
      "Sumber Tabel": item.sumber_tabel || ""
    }));

    const ws = XLSX.utils.json_to_sheet(dataForExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Skenario Tarif");
    XLSX.writeFile(wb, `skenario_tarif_${tahun}.xlsx`);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Skenario Tarif</h1>
          <p className="text-muted-foreground">
            Kelola skenario tarif dengan input manual jasa sarana, jasa pelayanan medis & non medis
          </p>
        </div>
      </div>

      {/* Configuration Panel */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Konfigurasi Skenario Tarif
          </CardTitle>
          <CardDescription>
            Setel tahun dan persentase untuk kalkulasi tarif
          </CardDescription>
        </CardHeader>
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
            <div className="space-y-2">
              <Label htmlFor="unit-kerja">Unit Kerja</Label>
              <Select value={selectedUnitKerja} onValueChange={setSelectedUnitKerja}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih Unit Kerja" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Unit Kerja</SelectItem>
                  {unitKerjaOptions.map((option) => (
                    <SelectItem key={option} value={option.split(" - ")[0]}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <Separator />
          
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex flex-wrap gap-2 items-center">
              <Button 
                onClick={() => populateMutation.mutate()} 
                disabled={populateMutation.isPending}
              >
                {populateMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4 mr-2" />
                )}
                Update Data
              </Button>
              
              <Button 
                onClick={handleExport} 
                disabled={!filteredData?.length}
                className="bg-red-600 text-white hover:bg-red-700"
              >
                <Download className="h-4 w-4 mr-2" />
                Unduh Laporan
              </Button>
              
              {/* Average Statistics Badges */}
              {filteredData && filteredData.length > 0 && (
                <>
                  <Badge className="px-3 py-1 bg-purple-600 text-white">
                    <span className="font-medium">Rata-rata Jasa Pelayanan:</span>
                    <span className="ml-2 text-sm font-bold">{averageStats.avgJasaPelayanan.toFixed(2)}%</span>
                  </Badge>
                  <Badge className="px-3 py-1 bg-green-600 text-white">
                    <span className="font-medium">Rata-rata Profit:</span>
                    <span className="ml-2 text-sm font-bold">{averageStats.avgProfit.toFixed(2)}%</span>
                  </Badge>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data Table */}
      <Card>
        <CardHeader>
          <CardTitle>Data Skenario Tarif</CardTitle>
          <CardDescription>
            {filteredData?.length || 0} tindakan ditemukan
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
              <span className="ml-2">Memuat data...</span>
            </div>
          ) : filteredData?.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Calculator className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Belum ada data skenario tarif untuk tahun {tahun}</p>
              <p className="text-sm">Klik "Muat Data dari Rekapitulasi" untuk memulai</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[200px]">Unit Kerja</TableHead>
                    <TableHead className="w-[150px]">Tindakan</TableHead>
                    <TableHead className="text-right w-[100px]">Unit Cost</TableHead>
                    <TableHead className="text-right w-[100px]">Biaya Bahan</TableHead>
                    <TableHead className="text-right w-[120px]">
                      <div className="flex items-center justify-end gap-1">
                        Jasa Sarana
                        {editingRow && (
                          <Pencil className="h-3 w-3 text-muted-foreground" />
                        )}
                      </div>
                    </TableHead>
                    <TableHead className="text-right w-[120px]">
                      <div className="flex items-center justify-end gap-1">
                        Jasa Pel. Medis
                        {editingRow && (
                          <Pencil className="h-3 w-3 text-muted-foreground" />
                        )}
                      </div>
                    </TableHead>
                    <TableHead className="text-right w-[120px]">
                      <div className="flex items-center justify-end gap-1">
                        Jasa Pel. Non Medis
                        {editingRow && (
                          <Pencil className="h-3 w-3 text-muted-foreground" />
                        )}
                      </div>
                    </TableHead>
                    <TableHead className="text-right w-[100px]">Jasa Pelayanan</TableHead>
                    <TableHead className="text-right w-[80px]">% Jasa Pel.</TableHead>
                    <TableHead className="text-right w-[80px]">% Profit</TableHead>
                    <TableHead className="text-right font-bold w-[100px]">Tarif</TableHead>
                    <TableHead className="w-[80px]">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredData?.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium text-sm">{item.nama_unit_kerja}</div>
                          <div className="text-xs text-muted-foreground">{item.kode_unit_kerja}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-[150px]">
                          <div className="font-medium text-sm truncate">{item.nama_tindakan}</div>
                          <div className="text-xs text-muted-foreground">{item.kode_tindakan}</div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right text-sm">
                        {formatCurrency(item.unit_cost_per_tindakan)}
                      </TableCell>
                      <TableCell className="text-right text-sm">
                        {formatCurrency(item.biaya_bahan)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          {editingRow === item.id ? (
                            <Input
                              type="number"
                              value={editValues.jasa_sarana}
                              onChange={(e) => setEditValues({ ...editValues, jasa_sarana: parseInt(e.target.value) || 0 })}
                              className="w-24 text-right text-sm"
                            />
                          ) : (
                            <span className="font-medium text-sm">{formatCurrency(item.jasa_sarana)}</span>
                          )}
                          {editingRow === item.id && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 w-6 p-0"
                              onClick={() => handleSaveRow(item.id)}
                              disabled={updateRowMutation.isPending}
                            >
                              {updateRowMutation.isPending ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <Check className="h-3 w-3 text-green-600" />
                              )}
                            </Button>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          {editingRow === item.id ? (
                            <Input
                              type="number"
                              value={editValues.jasa_pelayanan_medis}
                              onChange={(e) => setEditValues({ ...editValues, jasa_pelayanan_medis: parseInt(e.target.value) || 0 })}
                              className="w-24 text-right text-sm"
                            />
                          ) : (
                            <span className="text-sm">{formatCurrency(item.jasa_pelayanan_medis || 0)}</span>
                          )}
                          {editingRow === item.id && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 w-6 p-0"
                              onClick={() => handleSaveRow(item.id)}
                              disabled={updateRowMutation.isPending}
                            >
                              {updateRowMutation.isPending ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <Check className="h-3 w-3 text-green-600" />
                              )}
                            </Button>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          {editingRow === item.id ? (
                            <Input
                              type="number"
                              value={editValues.jasa_pelayanan_non_medis}
                              onChange={(e) => setEditValues({ ...editValues, jasa_pelayanan_non_medis: parseInt(e.target.value) || 0 })}
                              className="w-24 text-right text-sm"
                            />
                          ) : (
                            <span className="text-sm">{formatCurrency(item.jasa_pelayanan_non_medis || 0)}</span>
                          )}
                          {editingRow === item.id && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 w-6 p-0"
                              onClick={() => handleSaveRow(item.id)}
                              disabled={updateRowMutation.isPending}
                            >
                              {updateRowMutation.isPending ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <Check className="h-3 w-3 text-green-600" />
                              )}
                            </Button>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-medium text-sm">
                        {formatCurrency(item.jasa_pelayanan)}
                      </TableCell>
                      <TableCell className="text-right text-sm">
                        <Badge variant="outline" className="text-xs">
                          {item.prosentase_jasa_pelayanan.toFixed(1)}%
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right text-sm">
                        <Badge variant={item.prosentase_profit >= 0 ? "default" : "destructive"} className="text-xs">
                          {item.prosentase_profit.toFixed(1)}%
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-bold text-primary text-sm">
                        {formatCurrency(item.tarif_per_tindakan)}
                      </TableCell>
                      <TableCell>
                        {editingRow === item.id ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={handleCancelEdit}
                            className="text-xs"
                          >
                            Batal
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEditRow(item)}
                            className="h-8 w-8 p-0"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        )}
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

export default SkenarioTarif;