import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { ChartContainer } from "@/components/ui/chart";
import { RadialBarChart, RadialBar, PolarAngleAxis } from "recharts";
import {
  Loader2,
  Download,
  RefreshCcw,
  Calculator,
  Pencil,
  Check,
  ArrowDownCircle,
  ArrowUpCircle,
  Activity,
} from "lucide-react";
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
  user_id?: string;
}

interface KalkulasiTindakanSourceBase {
  kode_tindakan?: string;
  kode_jenis_tindakan: string;
  jenis_tindakan: string;
  kode_jenis?: number | string | null;
  kode_unit_kerja: string;
  nama_unit_kerja: string;
  biaya_bahan_tindakan: number | string | null;
  kode_operator?: string | null;
  nama_operator?: string | null;
}

interface KalkulasiTindakanInapSource extends KalkulasiTindakanSourceBase {
  unit_cost_tindakan_inap: number | string | null;
}

interface KalkulasiTindakanRawatJalanSource extends KalkulasiTindakanSourceBase {
  unit_cost_tindakan_rawat_jalan: number | string | null;
}

const toNumber = (value: number | string | null | undefined): number => {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0;
  }

  if (typeof value === "string") {
    const parsed = parseFloat(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  return 0;
};

const roundToTwoDecimals = (value: number): number => Math.round(value * 100) / 100;

const normalizeSkenarioItem = (item: any): SkenarioTarifData => ({
  id: String(item.id),
  user_id: item.user_id ?? undefined,
  tahun: Number(item.tahun) || 0,
  kode_jenis: item.kode_jenis !== null && item.kode_jenis !== undefined ? Number(item.kode_jenis) : undefined,
  kode_unit_kerja: item.kode_unit_kerja ?? "",
  nama_unit_kerja: item.nama_unit_kerja ?? "",
  kode_operator: item.kode_operator ?? undefined,
  nama_operator: item.nama_operator ?? undefined,
  kode_tindakan: item.kode_tindakan ?? "",
  nama_tindakan: item.nama_tindakan ?? "",
  biaya_bahan: toNumber(item.biaya_bahan),
  unit_cost_per_tindakan: toNumber(item.unit_cost_per_tindakan),
  prosentase_jasa_pelayanan: toNumber(item.prosentase_jasa_pelayanan),
  prosentase_profit: toNumber(item.prosentase_profit),
  jasa_sarana: toNumber(item.jasa_sarana),
  jasa_pelayanan_medis: toNumber(item.jasa_pelayanan_medis),
  jasa_pelayanan_non_medis: toNumber(item.jasa_pelayanan_non_medis),
  jasa_pelayanan: toNumber(item.jasa_pelayanan),
  tarif_per_tindakan: toNumber(item.tarif_per_tindakan),
  sumber_tabel: item.sumber_tabel ?? "",
});

const recalculateRow = (
  item: SkenarioTarifData,
  overrides: Partial<SkenarioTarifData> = {}
): SkenarioTarifData => {
  const merged = { ...item, ...overrides };

  const jasaSarana = toNumber(merged.jasa_sarana);
  const jasaPelayananMedis = toNumber(merged.jasa_pelayanan_medis);
  const jasaPelayananNonMedis = toNumber(merged.jasa_pelayanan_non_medis);
  const biayaBahan = toNumber(merged.biaya_bahan);
  const unitCost = toNumber(merged.unit_cost_per_tindakan);

  const jasaPelayanan = jasaPelayananMedis + jasaPelayananNonMedis;
  const tarifPerTindakan = jasaSarana + biayaBahan + jasaPelayanan;
  const prosentaseJasaPelayanan =
    tarifPerTindakan > 0 ? roundToTwoDecimals((jasaPelayanan / tarifPerTindakan) * 100) : 0;
  const prosentaseProfit =
    unitCost > 0 ? roundToTwoDecimals(((jasaSarana - unitCost) / unitCost) * 100) : 0;

  return {
    ...merged,
    jasa_sarana: jasaSarana,
    jasa_pelayanan_medis: jasaPelayananMedis,
    jasa_pelayanan_non_medis: jasaPelayananNonMedis,
    jasa_pelayanan: jasaPelayanan,
    biaya_bahan: biayaBahan,
    unit_cost_per_tindakan: unitCost,
    tarif_per_tindakan: tarifPerTindakan,
    prosentase_jasa_pelayanan: prosentaseJasaPelayanan,
    prosentase_profit: prosentaseProfit,
  };
};

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
  const [namaTindakanFilter, setNamaTindakanFilter] = useState<string>("");
  const [showFilters, setShowFilters] = useState<boolean>(true);

  const queryClient = useQueryClient();

  // Fetch data skenario tarif
  const { data: skenarioData, isLoading } = useQuery({
    queryKey: ["skenario_tarif", tahun],
    queryFn: async () => {
      const [skenarioResponse, rawatInapResponse, rawatJalanResponse] = await Promise.all([
        supabase
          .from("skenario_tarif")
          .select("*")
          .eq("tahun", tahun)
          .order("nama_unit_kerja", { ascending: true })
          .order("nama_tindakan", { ascending: true }),
        supabase
          .from("kalkulasi_tindakan_inap")
          .select("*")
          .eq("tahun", tahun)
          .order("nama_unit_kerja", { ascending: true })
          .order("jenis_tindakan", { ascending: true }),
        supabase
          .from("kalkulasi_tindakan_rawat_jalan")
          .select("*")
          .eq("tahun", tahun)
          .order("nama_unit_kerja", { ascending: true })
          .order("jenis_tindakan", { ascending: true }),
      ]);

      if (skenarioResponse.error) throw skenarioResponse.error;
      if (rawatInapResponse.error) throw rawatInapResponse.error;
      if (rawatJalanResponse.error) throw rawatJalanResponse.error;

      const skenarioItems = (skenarioResponse.data ?? []).map(normalizeSkenarioItem);

      const toTimestamp = (value: string | null | undefined) => {
        if (!value) return 0;
        const time = new Date(value).getTime();
        return Number.isFinite(time) ? time : 0;
      };

      const buildMapKey = (kode: string | number | null | undefined, unit?: string | null | undefined) =>
        `${kode ?? ""}__${unit ?? ""}`;

      const rawatInapRows = [...(rawatInapResponse.data ?? [])].sort(
        (a, b) => toTimestamp(a.updated_at) - toTimestamp(b.updated_at)
      );
      const rawatJalanRows = [...(rawatJalanResponse.data ?? [])].sort(
        (a, b) => toTimestamp(a.updated_at) - toTimestamp(b.updated_at)
      );

      const rawatInapMap = new Map<string, KalkulasiTindakanInapSource>(
        rawatInapRows
          .map((row) => {
            const kode = row.kode_tindakan ?? row.kode_jenis_tindakan;
            if (!kode) return null;
            const normalized: KalkulasiTindakanInapSource = {
              ...row,
              kode_jenis_tindakan: String(kode),
              jenis_tindakan: row.jenis_tindakan ?? row.nama_tindakan ?? "",
              kode_jenis: row.kode_jenis ?? row.kode_jenis_tindakan ?? null,
              kode_unit_kerja: row.kode_unit_kerja ?? "",
              nama_unit_kerja: row.nama_unit_kerja ?? "",
              biaya_bahan_tindakan: row.biaya_bahan_tindakan ?? row.biaya_bahan ?? 0,
              unit_cost_tindakan_inap: row.unit_cost_tindakan_inap ?? row.unit_cost_per_tindakan ?? 0,
              kode_operator: row.kode_operator ?? null,
              nama_operator: row.nama_operator ?? null,
            };

            return [
              buildMapKey(String(kode), normalized.kode_unit_kerja),
              normalized,
            ] as [string, KalkulasiTindakanInapSource];
          })
          .filter(Boolean) as Array<[string, KalkulasiTindakanInapSource]>
      );

      rawatInapRows.forEach((row) => {
        const kode = row.kode_tindakan ?? row.kode_jenis_tindakan;
        if (!kode) return;

        const keyWithUnit = buildMapKey(String(kode), row.kode_unit_kerja ?? "");
        const existing = rawatInapMap.get(keyWithUnit);
        if (!existing) return;

        const fallbackKey = buildMapKey(String(kode));
        rawatInapMap.set(fallbackKey, existing);
      });

      const rawatJalanMap = new Map<string, KalkulasiTindakanRawatJalanSource>(
        rawatJalanRows
          .map((row) => {
            const kode = row.kode_tindakan ?? row.kode_jenis_tindakan;
            if (!kode) return null;
            const normalized: KalkulasiTindakanRawatJalanSource = {
              ...row,
              kode_jenis_tindakan: String(kode),
              jenis_tindakan: row.jenis_tindakan ?? row.nama_tindakan ?? "",
              kode_jenis: row.kode_jenis ?? row.kode_jenis_tindakan ?? null,
              kode_unit_kerja: row.kode_unit_kerja ?? "",
              nama_unit_kerja: row.nama_unit_kerja ?? "",
              biaya_bahan_tindakan: row.biaya_bahan_tindakan ?? row.biaya_bahan ?? 0,
              unit_cost_tindakan_rawat_jalan:
                row.unit_cost_tindakan_rawat_jalan ?? row.unit_cost_per_tindakan ?? 0,
              kode_operator: row.kode_operator ?? null,
              nama_operator: row.nama_operator ?? null,
            };

            return [
              buildMapKey(String(kode), normalized.kode_unit_kerja),
              normalized,
            ] as [string, KalkulasiTindakanRawatJalanSource];
          })
          .filter(Boolean) as Array<[string, KalkulasiTindakanRawatJalanSource]>
      );

      rawatJalanRows.forEach((row) => {
        const kode = row.kode_tindakan ?? row.kode_jenis_tindakan;
        if (!kode) return;

        const keyWithUnit = buildMapKey(String(kode), row.kode_unit_kerja ?? "");
        const existing = rawatJalanMap.get(keyWithUnit);
        if (!existing) return;

        const fallbackKey = buildMapKey(String(kode));
        rawatJalanMap.set(fallbackKey, existing);
      });

      const updatesToPersist: Array<{
        id: string;
        kode_jenis?: number | null;
        kode_tindakan: string;
        sumber_tabel: string;
        unit_cost_per_tindakan: number;
        biaya_bahan: number;
        kode_unit_kerja: string;
        nama_unit_kerja: string;
        nama_tindakan: string;
        kode_operator?: string | null;
        nama_operator?: string | null;
      }> = [];

      const mergedItems = skenarioItems.map((item) => {
        let overrides: Partial<SkenarioTarifData> | undefined;

        const kodeKey = buildMapKey(item.kode_tindakan, item.kode_unit_kerja);

        if (item.sumber_tabel === "kalkulasi_tindakan_inap") {
          let source = rawatInapMap.get(kodeKey);
          if (!source) {
            source = rawatInapMap.get(buildMapKey(item.kode_tindakan));
          }
          if (source) {
            const kodeTindakan = String(
              source.kode_tindakan ?? source.kode_jenis_tindakan ?? item.kode_tindakan
            );
            const sourceUnitCost = toNumber(source.unit_cost_tindakan_inap);
            const sourceBiayaBahan = toNumber(source.biaya_bahan_tindakan);

            overrides = {
              kode_tindakan: kodeTindakan,
              sumber_tabel: "kalkulasi_tindakan_inap",
              unit_cost_per_tindakan:
                sourceUnitCost > 0 ? sourceUnitCost : item.unit_cost_per_tindakan,
              biaya_bahan:
                sourceBiayaBahan > 0 || item.biaya_bahan === 0
                  ? sourceBiayaBahan
                  : item.biaya_bahan,
              nama_tindakan: source.jenis_tindakan || item.nama_tindakan,
              kode_unit_kerja: source.kode_unit_kerja || item.kode_unit_kerja,
              nama_unit_kerja: source.nama_unit_kerja || item.nama_unit_kerja,
              kode_jenis:
                source.kode_jenis !== null && source.kode_jenis !== undefined
                  ? toNumber(source.kode_jenis)
                  : item.kode_jenis,
              kode_operator: source.kode_operator ?? item.kode_operator,
              nama_operator: source.nama_operator ?? item.nama_operator,
            };
          }
        } else if (item.sumber_tabel === "kalkulasi_tindakan_rawat_jalan") {
          let source = rawatJalanMap.get(kodeKey);
          if (!source) {
            source = rawatJalanMap.get(buildMapKey(item.kode_tindakan));
          }
          if (source) {
            const kodeTindakan = String(
              source.kode_tindakan ?? source.kode_jenis_tindakan ?? item.kode_tindakan
            );
            const sourceUnitCost = toNumber(source.unit_cost_tindakan_rawat_jalan);
            const sourceBiayaBahan = toNumber(source.biaya_bahan_tindakan);

            overrides = {
              kode_tindakan: kodeTindakan,
              sumber_tabel: "kalkulasi_tindakan_rawat_jalan",
              unit_cost_per_tindakan:
                sourceUnitCost > 0 ? sourceUnitCost : item.unit_cost_per_tindakan,
              biaya_bahan:
                sourceBiayaBahan > 0 || item.biaya_bahan === 0
                  ? sourceBiayaBahan
                  : item.biaya_bahan,
              nama_tindakan: source.jenis_tindakan || item.nama_tindakan,
              kode_unit_kerja: source.kode_unit_kerja || item.kode_unit_kerja,
              nama_unit_kerja: source.nama_unit_kerja || item.nama_unit_kerja,
              kode_jenis:
                source.kode_jenis !== null && source.kode_jenis !== undefined
                  ? toNumber(source.kode_jenis)
                  : item.kode_jenis,
              kode_operator: source.kode_operator ?? item.kode_operator,
              nama_operator: source.nama_operator ?? item.nama_operator,
            };
          }
        }

        const recalculated = recalculateRow(item, overrides);

        if (overrides) {
          const fieldsToCheck: Array<keyof SkenarioTarifData> = [
            "kode_jenis",
            "kode_tindakan",
            "sumber_tabel",
            "unit_cost_per_tindakan",
            "biaya_bahan",
            "nama_tindakan",
            "kode_unit_kerja",
            "nama_unit_kerja",
            "kode_operator",
            "nama_operator",
          ];

          const hasDiff = fieldsToCheck.some((field) => recalculated[field] !== item[field]);

          if (hasDiff) {
            updatesToPersist.push({
              id: item.id,
              kode_jenis:
                recalculated.kode_jenis !== undefined && recalculated.kode_jenis !== null
                  ? recalculated.kode_jenis
                  : null,
              kode_tindakan: recalculated.kode_tindakan,
              sumber_tabel: recalculated.sumber_tabel,
              unit_cost_per_tindakan: recalculated.unit_cost_per_tindakan,
              biaya_bahan: recalculated.biaya_bahan,
              nama_tindakan: recalculated.nama_tindakan,
              kode_unit_kerja: recalculated.kode_unit_kerja,
              nama_unit_kerja: recalculated.nama_unit_kerja,
              kode_operator: recalculated.kode_operator ?? null,
              nama_operator: recalculated.nama_operator ?? null,
            });
          }
        }

        return recalculated;
      });

      if (updatesToPersist.length > 0) {
        const { error: persistError } = await supabase
          .from("skenario_tarif")
          .upsert(updatesToPersist, { onConflict: "id" });

        if (persistError) {
          console.warn("Gagal menyelaraskan data skenario tarif:", persistError);
        }
      }

      return mergedItems;
    },
    enabled: !!tahun,
  });

  // Filter data berdasarkan unit kerja
  const filteredData = React.useMemo(() => {
    if (!skenarioData) return [];

    let data = skenarioData;

    if (selectedUnitKerja !== "all") {
      data = data.filter(item => item.kode_unit_kerja === selectedUnitKerja);
    }

    if (namaTindakanFilter.trim() !== "") {
      const keyword = namaTindakanFilter.toLowerCase();
      data = data.filter(item =>
        item.nama_tindakan.toLowerCase().includes(keyword) ||
        item.kode_tindakan.toLowerCase().includes(keyword)
      );
    }

    return data;
  }, [skenarioData, selectedUnitKerja, namaTindakanFilter]);

  // Get unique unit kerja untuk filter
  const unitKerjaOptions = React.useMemo(() => {
    if (!skenarioData) return [];
    const unique = [...new Set(skenarioData.map(item => `${item.kode_unit_kerja} - ${item.nama_unit_kerja}`))];
    return unique.sort();
  }, [skenarioData]);

  const unitKerjaBadgeColor = React.useMemo(() => {
    const fallbackColor = "bg-gray-200 text-gray-700";
    if (!filteredData || filteredData.length === 0) {
      return () => fallbackColor;
    }

    const uniqueUnitKerja = Array.from(new Set(filteredData.map((item) => item.kode_unit_kerja))).sort();
    const palette = [
      "bg-sky-100 text-sky-800",
      "bg-green-100 text-green-800",
      "bg-amber-100 text-amber-800",
      "bg-purple-100 text-purple-800",
      "bg-pink-100 text-pink-800",
      "bg-indigo-100 text-indigo-800",
      "bg-teal-100 text-teal-800",
      "bg-rose-100 text-rose-800",
    ];

    const map = new Map<string, string>();

    uniqueUnitKerja.forEach((kode, index) => {
      const color = palette[index % palette.length];
      map.set(kode, color);
    });

    return (kodeUnitKerja: string) => map.get(kodeUnitKerja) ?? fallbackColor;
  }, [filteredData]);

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

  const unitCostStats = React.useMemo(() => {
    if (!filteredData || filteredData.length === 0) {
      return {
        min: 0,
        max: 0,
        avg: 0,
        isSingleValue: true,
        minIds: new Set<string>(),
        maxIds: new Set<string>(),
      };
    }

    const unitCosts = filteredData.map((item) => toNumber(item.unit_cost_per_tindakan));
    const min = Math.min(...unitCosts);
    const max = Math.max(...unitCosts);
    const sum = unitCosts.reduce((total, value) => total + value, 0);
    const minIds = new Set(
      filteredData.filter((item) => toNumber(item.unit_cost_per_tindakan) === min).map((item) => item.id)
    );
    const maxIds = new Set(
      filteredData.filter((item) => toNumber(item.unit_cost_per_tindakan) === max).map((item) => item.id)
    );
    const avg = sum / unitCosts.length;

    return {
      min,
      max,
      avg,
      isSingleValue: min === max,
      minIds,
      maxIds,
    };
  }, [filteredData]);

  // Populate data dari rekapitulasi unit cost
  const populateMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.rpc("populate_skenario_tarif_from_rekapitulasi", {
        p_user_id: null,
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

  const GaugeCard = ({
    title,
    value,
    max = 100,
    unit = "%",
    gradientId,
    accentColor,
  }: {
    title: string;
    value: number;
    max?: number;
    unit?: string;
    gradientId: string;
    accentColor: string;
  }) => {
    const clamped = Math.max(0, Math.min(max, value));
    const gaugeData = [
      {
        name: "meter",
        value: clamped,
        rest: Math.max(max - clamped, 0),
      },
    ];

    return (
      <Card className="flex-1 min-w-[240px] border border-slate-200 bg-white shadow-sm">
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-600">{title}</p>
            <span className="text-xs text-muted-foreground">Max {max}{unit}</span>
          </div>
          <ChartContainer
            className="mx-auto h-[180px] w-full max-w-[240px]"
            config={{ value: { label: title, color: accentColor } }}
          >
            <RadialBarChart
              data={gaugeData}
              startAngle={225}
              endAngle={-45}
              innerRadius="60%"
              outerRadius="100%"
            >
              <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor={accentColor} stopOpacity={0.2} />
                  <stop offset="65%" stopColor={accentColor} stopOpacity={0.85} />
                  <stop offset="100%" stopColor={accentColor} />
                </linearGradient>
              </defs>
              <PolarAngleAxis type="number" domain={[0, max]} tick={false} axisLine={false} />
              <RadialBar
                dataKey="rest"
                stackId="a"
                fill="rgba(226,232,240,0.85)"
                cornerRadius={18}
              />
              <RadialBar
                dataKey="value"
                stackId="a"
                fill={`url(#${gradientId})`}
                cornerRadius={18}
                style={{ filter: `drop-shadow(0px 8px 16px ${accentColor}45)` }}
              />
            </RadialBarChart>
          </ChartContainer>
          <div className="text-center space-y-1">
            <p className="text-3xl font-bold text-slate-800">
              {value.toFixed(2)}
              <span className="ml-1 text-sm font-medium text-muted-foreground">{unit}</span>
            </p>
            <p className="text-xs text-muted-foreground">Proporsi relatif terhadap total tarif</p>
          </div>
        </CardContent>
      </Card>
    );
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

      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className="text-sm text-gray-600">
          Menampilkan <span className="font-semibold">{filteredData?.length ?? 0}</span> dari{" "}
          <span className="font-semibold">{skenarioData?.length ?? 0}</span> data
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setShowFilters((prev) => !prev)}
            className="min-w-[110px] border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
          >
            Filter
          </Button>
          <Button
            onClick={handleExport}
            disabled={!filteredData?.length}
            className="bg-red-500 text-white hover:bg-red-600 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            <Download className="h-4 w-4 mr-2" />
            Unduh Laporan
          </Button>
          <Button
            onClick={() => populateMutation.mutate()}
            disabled={populateMutation.isPending}
            className="bg-blue-600 text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
          >
            {populateMutation.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RefreshCcw className="h-4 w-4 mr-2" />
            )}
            Perbarui Data
          </Button>
        </div>
      </div>

      {showFilters && (
      <Card>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-[auto_auto_auto] gap-4">
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
                  {unitKerjaOptions.map((option: string) => (
                    <SelectItem key={option} value={option.split(" - ")[0]}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 md:col-span-2 lg:col-span-1">
              <Label htmlFor="nama-tindakan">Nama Tindakan</Label>
              <Input
                id="nama-tindakan"
                placeholder="Cari berdasarkan nama atau kode tindakan"
                value={namaTindakanFilter}
                onChange={(e) => setNamaTindakanFilter(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>
                )}

              {filteredData && filteredData.length > 0 && (
        <div className="flex flex-wrap gap-4">
          <Card className="flex-1 min-w-[220px] max-w-[260px] border-rose-200 bg-rose-50">
            <CardContent className="flex items-center gap-3 p-4">
              <div className="rounded-full bg-rose-100 p-2">
                <Calculator className="h-6 w-6 text-rose-500" />
            </div>
              <div>
                <p className="text-sm text-rose-600">Total Tindakan</p>
                <p className="text-xl font-semibold text-rose-900">
                  {filteredData.length.toLocaleString()}
                </p>
          </div>
            </CardContent>
          </Card>
          <Card className="flex-1 min-w-[220px] max-w-[260px] border-blue-200 bg-blue-50">
            <CardContent className="flex items-center gap-3 p-4">
                  <div className="rounded-full bg-blue-100 p-2">
                    <ArrowDownCircle className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-blue-700">Unit Cost Terendah</p>
                    <p className="text-xl font-semibold text-blue-900">
                      {formatCurrency(unitCostStats.min)}
                    </p>
                    {unitCostStats.isSingleValue && (
                      <p className="text-xs text-blue-600">Semua tindakan memiliki nilai sama</p>
                    )}
                  </div>
                </CardContent>
              </Card>
          <Card className="flex-1 min-w-[220px] max-w-[260px] border-emerald-200 bg-emerald-50">
            <CardContent className="flex items-center gap-3 p-4">
                  <div className="rounded-full bg-emerald-100 p-2">
                    <ArrowUpCircle className="h-6 w-6 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-sm text-emerald-700">Unit Cost Tertinggi</p>
                    <p className="text-xl font-semibold text-emerald-900">
                      {formatCurrency(unitCostStats.max)}
                    </p>
                    {unitCostStats.isSingleValue && (
                      <p className="text-xs text-emerald-600">Semua tindakan memiliki nilai sama</p>
                    )}
                  </div>
                </CardContent>
              </Card>
          <Card className="flex-1 min-w-[220px] max-w-[260px] border-purple-200 bg-purple-50">
            <CardContent className="flex items-center gap-3 p-4">
                  <div className="rounded-full bg-purple-100 p-2">
                    <Activity className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-purple-700">Unit Cost Rata-rata</p>
                    <p className="text-xl font-semibold text-purple-900">
                      {formatCurrency(unitCostStats.avg)}
                    </p>
                    {unitCostStats.isSingleValue && (
                      <p className="text-xs text-purple-600">Semua tindakan memiliki nilai sama</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

      {filteredData && filteredData.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2">
          <GaugeCard
            title="Rata-rata Jasa Pelayanan"
            value={averageStats.avgJasaPelayanan}
            max={100}
            gradientId="gauge-avg-jasa"
            accentColor="#7c3aed"
          />
          <GaugeCard
            title="Rata-rata Profit"
            value={averageStats.avgProfit}
            max={100}
            gradientId="gauge-avg-profit"
            accentColor="#f97316"
          />
        </div>
      )}

      {/* Data Table */}
      <Card>
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
                <TableHeader className="bg-[#0f766e]">
                  <TableRow className="bg-[#0f766e] hover:bg-[#0f766e]">
                    <TableHead className="w-[200px] text-white">Unit Kerja</TableHead>
                    <TableHead className="w-[150px] text-white">Tindakan</TableHead>
                    <TableHead className="text-right w-[100px] text-white">Unit Cost</TableHead>
                    <TableHead className="text-right w-[100px] text-white">Biaya Bahan</TableHead>
                    <TableHead className="text-right w-[120px] text-white">
                      <div className="flex items-center justify-end gap-1">
                        Jasa Sarana
                        {editingRow && (
                          <Pencil className="h-3 w-3 text-white/80" />
                        )}
                      </div>
                    </TableHead>
                    <TableHead className="text-right w-[120px] text-white">
                      <div className="flex items-center justify-end gap-1">
                        Jasa Pel. Medis
                        {editingRow && (
                          <Pencil className="h-3 w-3 text-white/80" />
                        )}
                      </div>
                    </TableHead>
                    <TableHead className="text-right w-[120px] text-white">
                      <div className="flex items-center justify-end gap-1">
                        Jasa Pel. Non Medis
                        {editingRow && (
                          <Pencil className="h-3 w-3 text-white/80" />
                        )}
                      </div>
                    </TableHead>
                    <TableHead className="text-right w-[100px] text-white">Jasa Pelayanan</TableHead>
                    <TableHead className="text-right w-[80px] text-white">% Jasa Pel.</TableHead>
                    <TableHead className="text-right w-[80px] text-white">% Profit</TableHead>
                    <TableHead className="text-right font-bold w-[100px] text-white">Tarif</TableHead>
                    <TableHead className="w-[80px] text-white">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredData?.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <Badge
                            className={`text-sm font-semibold px-2 py-1 ${unitKerjaBadgeColor(item.kode_unit_kerja)}`}
                          >
                            {item.nama_unit_kerja}
                          </Badge>
                          <span className="text-[11px] text-muted-foreground">{item.kode_unit_kerja}</span>
                        </div>
                      </TableCell>
                      <TableCell
                        className={
                          unitCostStats.isSingleValue
                            ? ""
                            : unitCostStats.maxIds.has(item.id)
                            ? "bg-red-50"
                            : unitCostStats.minIds.has(item.id)
                            ? "bg-emerald-50"
                            : ""
                        }
                      >
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
                            onClick={() => handleEditRow(item)}
                            className="h-8 w-8 rounded-md bg-indigo-500 p-0 text-white hover:bg-indigo-600"
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