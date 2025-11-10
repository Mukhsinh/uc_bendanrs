import React, { useState, useEffect, useMemo } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Download, Search, Filter, PieChart, BarChart3, TrendingUp, Layers, Wallet, Coins, Scale, Gauge } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PieChart as RechartsPieChart, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Pie, ComposedChart, Line, LineChart, RadialBarChart, RadialBar, PolarAngleAxis } from "recharts";

interface StrukturBiayaRow {
  id: string;
  tahun: number;
  unit_kerja_id?: string;
  kode_unit_kerja: string;
  nama_unit_kerja: string;
  kategori_unit?: string | null;
  jenis_layanan?: string | null;
  biaya_bahan: number;
  biaya_pegawai: number;
  biaya_jasa_pelayanan: number;
  biaya_pegawai_net: number;
  biaya_daya: number;
  biaya_pemeliharaan: number;
  biaya_penyusutan: number;
  biaya_operasional_lainnya: number;
  btl_terdistribusi: number;
  total_biaya_dengan_jp: number;
  total_pendapatan: number;
  total_kunjungan: number;
  jumlah_hari_rawat: number;
  total_pemeriksaan: number;
  pendapatan_per_kunjungan?: number;
  pendapatan_per_hari_rawat?: number;
  biaya_per_kunjungan?: number;
  biaya_per_hari_rawat?: number;
  biaya_per_pemeriksaan?: number;
  revenue_to_cost_ratio?: number;
  revenue_to_cost_percentage?: number;
  selisih_revenue_cost?: number;
  persentase_biaya_bahan?: number;
  persentase_biaya_pegawai_net?: number;
  persentase_biaya_jasa_pelayanan?: number;
  persentase_biaya_daya?: number;
  persentase_biaya_pemeliharaan?: number;
  persentase_biaya_penyusutan?: number;
  persentase_biaya_operasional_lainnya?: number;
  persentase_btl_terdistribusi?: number;
  created_at?: string;
  updated_at?: string;
}

interface StrukturBiayaData {
  kategori: string;
  nilai: number;
  persentase: number;
  warna: string;
}

interface CalculationItem {
  unit: string;
  kode: string;
  totalBiaya: number;
  totalPendapatan: number;
  btlTerdistribusi: number;
  totalKunjungan: number;
  totalHariRawat: number;
  totalPemeriksaan: number;
  pendapatanPerKunjungan: number;
  pendapatanPerHariRawat: number;
  biayaPerKunjungan: number;
  biayaPerHariRawat: number;
  biayaPerPemeriksaan: number;
  revenueToCostPercentage: number;
}

type ChartOptionKey = 'strukturBiaya' | 'analisisKomprehensif' | 'kegiatan' | 'kombinasi';
type TableOptionKey = 'rawatInap' | 'rawatJalan' | 'penunjang';

interface DownloadSelection {
  includeSummary: boolean;
  charts: Record<ChartOptionKey, boolean>;
  tables: Record<TableOptionKey, boolean>;
}

const chartLabels: Record<ChartOptionKey, string> = {
  strukturBiaya: 'Grafik Struktur Biaya',
  analisisKomprehensif: 'Grafik Analisis Komprehensif',
  kegiatan: 'Grafik Analisis Kegiatan',
  kombinasi: 'Grafik Analisis Pembagian',
};

const tableLabels: Record<TableOptionKey, string> = {
  rawatInap: 'Tabel Rawat Inap',
  rawatJalan: 'Tabel Rawat Jalan',
  penunjang: 'Tabel Penunjang',
};

const jenisKonfigurasi: Array<{ key: "Rawat Inap" | "Rawat Jalan" | "Penunjang"; color: string }> = [
  { key: "Rawat Inap", color: "#10B981" },
  { key: "Rawat Jalan", color: "#6366F1" },
  { key: "Penunjang", color: "#F97316" },
];

const jenisColorMap = jenisKonfigurasi.reduce((acc, item) => {
  acc[item.key] = item.color;
  return acc;
}, {} as Record<"Rawat Inap" | "Rawat Jalan" | "Penunjang", string>);

const StrukturBiaya: React.FC = () => {
  const [strukturBiayaList, setStrukturBiayaList] = useState<StrukturBiayaRow[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [selectedUnitIds, setSelectedUnitIds] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedJenisKegiatan, setSelectedJenisKegiatan] = useState<string>("all");
  const [unitKerjaList, setUnitKerjaList] = useState<any[]>([]);
  const [downloadDialogOpen, setDownloadDialogOpen] = useState<boolean>(false);
  const [downloadSelection, setDownloadSelection] = useState<DownloadSelection>({
    includeSummary: true,
    charts: {
      strukturBiaya: true,
      analisisKomprehensif: true,
      kegiatan: true,
      kombinasi: true,
    },
    tables: {
      rawatInap: true,
      rawatJalan: true,
      penunjang: true,
    },
  });

  const getSoftBackgroundColor = (hex: string, alpha = 0.12) => {
    const sanitized = (hex || '').replace('#', '');
    if (sanitized.length !== 6) {
      return `rgba(15, 118, 110, ${alpha})`;
    }
    const bigint = parseInt(sanitized, 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  const normalizeJenisLayanan = (jenis?: string | null): "Rawat Inap" | "Rawat Jalan" | "Penunjang" => {
    const normalized = (jenis || '').trim().toLowerCase();
    if (normalized === 'rawat inap') return 'Rawat Inap';
    if (normalized === 'rawat jalan') return 'Rawat Jalan';
    return 'Penunjang';
  };
  const parseNumber = (value: any, defaultValue = 0) => {
    if (value === null || value === undefined || value === '') {
      return defaultValue;
    }
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : defaultValue;
  };

  const parseOptionalNumber = (value: any) => {
    if (value === null || value === undefined || value === '') {
      return undefined;
    }
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  };

  const toggleChartOption = (key: ChartOptionKey) => {
    setDownloadSelection(prev => ({
      ...prev,
      charts: {
        ...prev.charts,
        [key]: !prev.charts[key],
      },
    }));
  };

  const toggleTableOption = (key: TableOptionKey) => {
    setDownloadSelection(prev => ({
      ...prev,
      tables: {
        ...prev.tables,
        [key]: !prev.tables[key],
      },
    }));
  };

  const toggleIncludeSummary = () => {
    setDownloadSelection(prev => ({
      ...prev,
      includeSummary: !prev.includeSummary,
    }));
  };

  const handleSelectAllDownloads = (value: boolean) => {
    setDownloadSelection({
      includeSummary: value,
      charts: {
        strukturBiaya: value,
        analisisKomprehensif: value,
        kegiatan: value,
        kombinasi: value,
      },
      tables: {
        rawatInap: value,
        rawatJalan: value,
        penunjang: value,
      },
    });
  };

  const fetchStrukturBiayaData = async () => {
    const { data, error } = await supabase
      .from('struktur_biaya')
      .select('*')
      .order('tahun', { ascending: false })
      .order('kode_unit_kerja');

    if (error) throw error;

    const numericFields: (keyof StrukturBiayaRow)[] = [
      'biaya_bahan',
      'biaya_pegawai',
      'biaya_jasa_pelayanan',
      'biaya_pegawai_net',
      'biaya_daya',
      'biaya_pemeliharaan',
      'biaya_penyusutan',
      'biaya_operasional_lainnya',
      'btl_terdistribusi',
      'total_biaya_dengan_jp',
      'total_pendapatan',
      'total_kunjungan',
      'jumlah_hari_rawat',
      'total_pemeriksaan',
      'selisih_revenue_cost',
    ];

    const optionalNumericFields: (keyof StrukturBiayaRow)[] = [
      'pendapatan_per_kunjungan',
      'pendapatan_per_hari_rawat',
      'biaya_per_kunjungan',
      'biaya_per_hari_rawat',
      'biaya_per_pemeriksaan',
      'revenue_to_cost_ratio',
      'revenue_to_cost_percentage',
      'persentase_biaya_bahan',
      'persentase_biaya_pegawai_net',
      'persentase_biaya_jasa_pelayanan',
      'persentase_biaya_daya',
      'persentase_biaya_pemeliharaan',
      'persentase_biaya_penyusutan',
      'persentase_biaya_operasional_lainnya',
      'persentase_btl_terdistribusi',
    ];

    const normalized = (data || []).map((item) => {
      const normalizedItem: any = { ...item };
      normalizedItem.tahun = parseNumber((item as any).tahun);
      numericFields.forEach((field) => {
        normalizedItem[field] = parseNumber((item as any)[field]);
      });
      optionalNumericFields.forEach((field) => {
        normalizedItem[field] = parseOptionalNumber((item as any)[field]);
      });
      return normalizedItem as StrukturBiayaRow;
    });

    setStrukturBiayaList(normalized);

    if (normalized.length > 0) {
      const latestYear = normalized.reduce((max, row) => Math.max(max, row.tahun), normalized[0].tahun);
      setSelectedYear((prev) => (normalized.some((row) => row.tahun === prev) ? prev : latestYear));
    }
  };

  const fetchUnitKerjaData = async () => {
    try {
      const { data, error } = await supabase
        .from('unit_kerja')
        .select('id, kode, nama, kategori')
        .eq('kategori', 'Pusat Pendapatan')
        .order('kode');

      if (error) throw error;
      console.log('🏢 Data Unit Kerja fetched:', data?.length || 0, 'records');
      setUnitKerjaList(data || []);
    } catch (error) {
      console.error('Error fetching unit kerja data:', error);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        await Promise.all([fetchStrukturBiayaData(), fetchUnitKerjaData()]);
      } catch (error) {
        console.error('Error loading struktur biaya data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  useEffect(() => {
    if (strukturBiayaList.length === 0) {
      return;
    }
    if (!strukturBiayaList.some((item) => item.tahun === selectedYear)) {
      const latestYear = strukturBiayaList.reduce((max, row) => Math.max(max, row.tahun), strukturBiayaList[0].tahun);
      setSelectedYear(latestYear);
    }
  }, [strukturBiayaList, selectedYear]);

  const availableYears = useMemo(() => {
    const years = Array.from(new Set(strukturBiayaList.map(item => item.tahun))).sort((a, b) => b - a);
    return years;
  }, [strukturBiayaList]);

  const yearOptions = availableYears.length > 0 ? availableYears : [selectedYear];

  const filteredStrukturList = useMemo(() => {
    const searchLower = searchTerm.toLowerCase();

    return strukturBiayaList
      .filter(item => {
        const yearMatch = item.tahun === selectedYear;
        const unitMatch = selectedUnitIds.length === 0 || selectedUnitIds.includes(item.kode_unit_kerja);
        const jenisValue = normalizeJenisLayanan(item.jenis_layanan);
        const jenisMatch = selectedJenisKegiatan === "all" || jenisValue === selectedJenisKegiatan;
        const searchMatch =
          !searchLower ||
          item.nama_unit_kerja.toLowerCase().includes(searchLower) ||
          item.kode_unit_kerja.toLowerCase().includes(searchLower);

        return yearMatch && unitMatch && jenisMatch && searchMatch;
      })
      .sort((a, b) => a.kode_unit_kerja.localeCompare(b.kode_unit_kerja));
  }, [strukturBiayaList, selectedYear, selectedUnitIds, selectedJenisKegiatan, searchTerm]);

  const strukturBiayaData = useMemo(() => {
    const totalBiaya = filteredStrukturList.reduce((sum, item) => sum + (item.total_biaya_dengan_jp || 0), 0);

    if (totalBiaya === 0) return [];

    const categories = [
      { key: 'biaya_bahan', label: 'Biaya Bahan', color: '#3B82F6' },
      { key: 'biaya_pegawai_net', label: 'Biaya Pegawai (Tanpa JP)', color: '#10B981' },
      { key: 'biaya_jasa_pelayanan', label: 'Jasa Pelayanan', color: '#F59E0B' },
      { key: 'biaya_daya', label: 'Biaya Daya', color: '#EF4444' },
      { key: 'biaya_pemeliharaan', label: 'Pemeliharaan', color: '#8B5CF6' },
      { key: 'biaya_penyusutan', label: 'Penyusutan', color: '#06B6D4' },
      { key: 'biaya_operasional_lainnya', label: 'Operasional Lainnya', color: '#84CC16' },
      { key: 'btl_terdistribusi', label: 'BTL Terdistribusi', color: '#0EA5E9' },
    ];

    return categories.map(category => {
      const total = filteredStrukturList.reduce((sum, item) => sum + (item[category.key as keyof StrukturBiayaRow] as number || 0), 0);
      const persentase = totalBiaya > 0 ? (total / totalBiaya) * 100 : 0;
      
      return {
        kategori: category.label,
        nilai: total,
        persentase: Math.round(persentase * 100) / 100,
        warna: category.color,
      };
    }).filter(item => item.nilai > 0);
  }, [filteredStrukturList]);

  // Hitung total pendapatan
  const totalPendapatan = useMemo(() => {
    return filteredStrukturList.reduce((sum, item) => sum + (item.total_pendapatan || 0), 0);
  }, [filteredStrukturList]);

  // Hitung total biaya dengan JP
  const totalBiayaDenganJP = useMemo(() => {
    return filteredStrukturList.reduce((sum, item) => sum + (item.total_biaya_dengan_jp || 0), 0);
  }, [filteredStrukturList]);

  const totalBTL = useMemo(() => {
    return filteredStrukturList.reduce((sum, item) => sum + (item.btl_terdistribusi || 0), 0);
  }, [filteredStrukturList]);

  const averageRevenueCostByJenis = useMemo(() => {
    return jenisKonfigurasi.map(({ key, color }) => {
      const records = filteredStrukturList.filter(item => normalizeJenisLayanan(item.jenis_layanan) === key);
      const average = records.length > 0
        ? records.reduce((sum, item) => sum + (item.revenue_to_cost_percentage || 0), 0) / records.length
        : 0;

      return {
        jenis: key,
        color,
        average: Number(average.toFixed(2)),
      };
    });
  }, [filteredStrukturList]);

  const biayaByJenisData = useMemo(() => {
    const totals: Record<"Rawat Inap" | "Rawat Jalan" | "Penunjang", number> = {
      "Rawat Inap": 0,
      "Rawat Jalan": 0,
      Penunjang: 0,
    };

    filteredStrukturList.forEach(item => {
      const jenis = normalizeJenisLayanan(item.jenis_layanan);
      totals[jenis] += item.total_biaya_dengan_jp || 0;
    });

    const totalKeseluruhan = Object.values(totals).reduce((sum, value) => sum + value, 0);
    if (totalKeseluruhan === 0) {
      return [];
    }

    return (Object.entries(totals) as Array<[ "Rawat Inap" | "Rawat Jalan" | "Penunjang", number]>)
      .filter(([, nilai]) => nilai > 0)
      .map(([jenis, nilai]) => ({
        kategori: jenis,
        nilai,
        persentase: Number(((nilai / totalKeseluruhan) * 100).toFixed(2)),
        warna: jenisColorMap[jenis],
      }));
  }, [filteredStrukturList]);

  // Perbandingan revenue to cost
  const perbandinganRevenueToCost = useMemo(() => {
    const biaya = totalBiayaDenganJP;
    const pendapatan = totalPendapatan;
    const ratio = biaya > 0 ? (pendapatan / biaya) : 0;
    const persentase = ratio * 100;
    const isEfficient = ratio >= 1; // Revenue >= Cost
    
    return {
      biaya,
      pendapatan,
      ratio: Number(ratio.toFixed(2)),
      persentase: Number(persentase.toFixed(2)),
      isEfficient,
      selisih: pendapatan - biaya
    };
  }, [totalBiayaDenganJP, totalPendapatan]);

  const hasDownloadSelection = useMemo(() => {
    const chartSelected = Object.values(downloadSelection.charts).some(Boolean);
    const tableSelected = Object.values(downloadSelection.tables).some(Boolean);
    return downloadSelection.includeSummary || chartSelected || tableSelected;
  }, [downloadSelection]);

  // Data untuk bar chart dengan pendapatan dan kegiatan
  const barChartData = useMemo(() => {
    return filteredStrukturList.map(item => {
      const totalBiaya = item.total_biaya_dengan_jp || 0;
      const totalPendapatan = item.total_pendapatan || 0;
      const totalKunjungan = item.total_kunjungan || 0;
      const jumlahHariRawat = item.jumlah_hari_rawat || 0;
      const totalPemeriksaan = item.total_pemeriksaan || 0;

      const pendapatanPerKunjungan = item.pendapatan_per_kunjungan ?? (totalKunjungan > 0 ? totalPendapatan / totalKunjungan : 0);
      const pendapatanPerHariRawat = item.pendapatan_per_hari_rawat ?? (jumlahHariRawat > 0 ? totalPendapatan / jumlahHariRawat : 0);
      const biayaPerKunjungan = item.biaya_per_kunjungan ?? (totalKunjungan > 0 ? totalBiaya / totalKunjungan : 0);
      const biayaPerHariRawat = item.biaya_per_hari_rawat ?? (jumlahHariRawat > 0 ? totalBiaya / jumlahHariRawat : 0);
      const biayaPerPemeriksaan = item.biaya_per_pemeriksaan ?? (totalPemeriksaan > 0 ? totalBiaya / totalPemeriksaan : 0);
      const revenueToCostPercentage = item.revenue_to_cost_percentage ?? (totalBiaya > 0 ? (totalPendapatan / totalBiaya) * 100 : 0);

      return {
        unit: item.nama_unit_kerja,
        kode: item.kode_unit_kerja,
        totalBiaya,
        totalPendapatan,
        btlTerdistribusi: item.btl_terdistribusi || 0,
        totalKunjungan,
        jumlahHariRawat,
        totalPemeriksaan,
        pendapatanPerKunjungan,
        pendapatanPerHariRawat,
        biayaPerKunjungan,
        biayaPerHariRawat,
        biayaPerPemeriksaan,
        revenueToCostPercentage,
      };
    }).sort((a, b) => a.kode.localeCompare(b.kode));
  }, [filteredStrukturList]);

  // Data untuk grafik kombinasi dengan perhitungan pembagian
  const combinedChartData = useMemo(() => {
    return barChartData.map(item => ({
      ...item,
      pendapatanPerKunjungan: Number(item.pendapatanPerKunjungan?.toFixed(2) || 0),
      pendapatanPerHariRawat: Number(item.pendapatanPerHariRawat?.toFixed(2) || 0),
      biayaPerKunjungan: Number(item.biayaPerKunjungan?.toFixed(2) || 0),
      biayaPerHariRawat: Number(item.biayaPerHariRawat?.toFixed(2) || 0),
      biayaPerPemeriksaan: Number(item.biayaPerPemeriksaan?.toFixed(2) || 0),
      revenueToCostPercentage: Number(item.revenueToCostPercentage?.toFixed(2) || 0),
    }));
  }, [barChartData]);

  // Data untuk tabel perhitungan yang dipecah menjadi 3 kategori
  const calculationTablesData = useMemo(() => {
    const rawatInapCodes = new Set<string>([
      'UK046','UK047','UK048','UK049','UK050','UK051','UK052','UK053','UK054','UK055'
    ]);
    const rawatJalanCodes = new Set<string>([
      'UK056','UK057','UK058','UK059','UK060','UK061','UK062','UK063',
      'UK064','UK065','UK066','UK067','UK068','UK069','UK070','UK071','UK072','UK073'
    ]);

    const rawatInapData: CalculationItem[] = [];
    const rawatJalanData: CalculationItem[] = [];
    const penunjangData: CalculationItem[] = [];

    filteredStrukturList.forEach(item => {
      const totalBiaya = item.total_biaya_dengan_jp || 0;
      const totalPendapatan = item.total_pendapatan || 0;
      const totalKunjungan = item.total_kunjungan || 0;
      const totalHariRawat = item.jumlah_hari_rawat || 0;
      const totalPemeriksaan = item.total_pemeriksaan || 0;

      const pendapatanPerKunjungan = item.pendapatan_per_kunjungan ?? (totalKunjungan > 0 ? totalPendapatan / totalKunjungan : 0);
      const pendapatanPerHariRawat = item.pendapatan_per_hari_rawat ?? (totalHariRawat > 0 ? totalPendapatan / totalHariRawat : 0);
      const biayaPerKunjungan = item.biaya_per_kunjungan ?? (totalKunjungan > 0 ? totalBiaya / totalKunjungan : 0);
      const biayaPerHariRawat = item.biaya_per_hari_rawat ?? (totalHariRawat > 0 ? totalBiaya / totalHariRawat : 0);
      const biayaPerPemeriksaan = item.biaya_per_pemeriksaan ?? (totalPemeriksaan > 0 ? totalBiaya / totalPemeriksaan : 0);
      const revenueToCostPercentage = item.revenue_to_cost_percentage ?? (totalBiaya > 0 ? (totalPendapatan / totalBiaya) * 100 : 0);

      const enhancedItem: CalculationItem = {
        unit: item.nama_unit_kerja,
        kode: item.kode_unit_kerja,
        totalBiaya,
        totalPendapatan,
        btlTerdistribusi: item.btl_terdistribusi || 0,
        totalKunjungan,
        totalHariRawat,
        totalPemeriksaan,
        pendapatanPerKunjungan: Number(pendapatanPerKunjungan.toFixed(2)),
        pendapatanPerHariRawat: Number(pendapatanPerHariRawat.toFixed(2)),
        biayaPerKunjungan: Number(biayaPerKunjungan.toFixed(2)),
        biayaPerHariRawat: Number(biayaPerHariRawat.toFixed(2)),
        biayaPerPemeriksaan: Number(biayaPerPemeriksaan.toFixed(2)),
        revenueToCostPercentage: Number(revenueToCostPercentage.toFixed(2)),
      };

      const kode = (item.kode_unit_kerja || '').toUpperCase();
      const jenisData = (item.jenis_layanan || '').trim();

      let jenis: 'Rawat Inap' | 'Rawat Jalan' | 'Penunjang';
      if (jenisData === 'Rawat Inap' || rawatInapCodes.has(kode)) {
        jenis = 'Rawat Inap';
      } else if (jenisData === 'Rawat Jalan' || rawatJalanCodes.has(kode)) {
        jenis = 'Rawat Jalan';
      } else if (jenisData === 'Penunjang') {
        jenis = 'Penunjang';
      } else {
        jenis = rawatInapCodes.has(kode)
          ? 'Rawat Inap'
          : rawatJalanCodes.has(kode)
            ? 'Rawat Jalan'
            : 'Penunjang';
      }

      if (jenis === 'Rawat Inap') {
        rawatInapData.push(enhancedItem);
      } else if (jenis === 'Rawat Jalan') {
        rawatJalanData.push(enhancedItem);
      } else if (jenis === 'Penunjang') {
        penunjangData.push(enhancedItem);
      }
    });

    const sortByKode = (data: CalculationItem[]) =>
      data.sort((a, b) => a.kode.localeCompare(b.kode));

    return {
      rawatInap: sortByKode(rawatInapData),
      rawatJalan: sortByKode(rawatJalanData),
      penunjang: sortByKode(penunjangData),
    };
  }, [filteredStrukturList]);

  const handleUnitKerjaToggle = (unitKode: string) => {
    setSelectedUnitIds(prev => {
      if (prev.includes(unitKode)) {
        return prev.filter(id => id !== unitKode);
      } else {
        return [...prev, unitKode];
      }
    });
  };

  const handleSelectAllUnits = () => {
    setSelectedUnitIds(unitKerjaList.map(unit => unit.kode));
  };

  const handleClearAllUnits = () => {
    setSelectedUnitIds([]);
  };

  const generateReportContent = (selection: DownloadSelection) => {
    const lines: string[] = [];
    const selectedUnitNames = selectedUnitIds.length === 0
      ? 'Semua Unit'
      : selectedUnitIds
          .map(kode => unitKerjaList.find(u => u.kode === kode)?.nama || kode)
          .join(', ');

    lines.push('ANALISIS STRUKTUR BIAYA');
    lines.push(`Tahun: ${selectedYear}`);
    lines.push(`Unit Kerja: ${selectedUnitNames}`);
    lines.push(`Jenis Layanan: ${selectedJenisKegiatan === 'all' ? 'Semua Jenis' : selectedJenisKegiatan}`);

    if (selection.includeSummary) {
      lines.push('');
      lines.push('RINGKASAN UTAMA:');
      lines.push(`- Total Unit Kerja: ${barChartData.length}`);
      lines.push(`- Total BTL Terdistribusi: ${formatCurrency(totalBTL)}`);
      lines.push(`- Total Biaya dengan JP: ${formatCurrency(totalBiayaDenganJP)}`);
      lines.push(`- Total Pendapatan: ${formatCurrency(totalPendapatan)}`);
      lines.push(`- Revenue to Cost Ratio: ${perbandinganRevenueToCost.ratio.toFixed(2)} (${perbandinganRevenueToCost.isEfficient ? 'Profit' : 'Loss'})`);
      lines.push(`- Revenue to Cost Percentage: ${perbandinganRevenueToCost.persentase.toFixed(2)}%`);
      lines.push(`- Selisih Revenue - Cost: ${formatCurrency(perbandinganRevenueToCost.selisih)}`);
    }

    if (selection.charts.strukturBiaya && strukturBiayaData.length > 0) {
      lines.push('');
      lines.push('GRAFIK: Struktur Biaya');
      strukturBiayaData.forEach(item => {
        lines.push(`- ${item.kategori}: ${formatCurrency(item.nilai)} (${item.persentase}%)`);
      });
    }

    if (selection.charts.analisisKomprehensif && barChartData.length > 0) {
      lines.push('');
      lines.push('GRAFIK: Analisis Komprehensif (Top 5 berdasarkan total biaya)');
      barChartData
        .slice(0, 5)
        .forEach(item => {
          lines.push(`${item.kode} - ${item.unit}`);
          lines.push(`  • BTL Terdistribusi: ${formatCurrency(filteredStrukturList.find(row => row.kode_unit_kerja === item.kode)?.btl_terdistribusi || 0)}`);
          lines.push(`  • Total Biaya dengan JP: ${formatCurrency(item.totalBiaya)}`);
          lines.push(`  • Total Pendapatan: ${formatCurrency(item.totalPendapatan)}`);
        });
    }

    if (selection.charts.kegiatan && barChartData.length > 0) {
      lines.push('');
      lines.push('GRAFIK: Analisis Kegiatan (Top 5 berdasarkan kunjungan)');
      [...barChartData]
        .sort((a, b) => b.totalKunjungan - a.totalKunjungan)
        .slice(0, 5)
        .forEach(item => {
          lines.push(`${item.kode} - ${item.unit}`);
          lines.push(`  • Total Kunjungan: ${item.totalKunjungan.toLocaleString('id-ID')}`);
          lines.push(`  • Jumlah Hari Rawat: ${item.jumlahHariRawat.toLocaleString('id-ID')}`);
        });
    }

    if (selection.charts.kombinasi && combinedChartData.length > 0) {
      lines.push('');
      lines.push('GRAFIK: Analisis Pembagian (Biaya & Pendapatan per Aktivitas)');
      combinedChartData
        .slice(0, 5)
        .forEach(item => {
          lines.push(`${item.kode} - ${item.unit}`);
          lines.push(`  • Pendapatan per Kunjungan: ${formatCurrency(item.pendapatanPerKunjungan)}`);
          lines.push(`  • Biaya per Kunjungan: ${formatCurrency(item.biayaPerKunjungan)}`);
          lines.push(`  • Biaya per Pemeriksaan: ${formatCurrency(item.biayaPerPemeriksaan)}`);
        });
    }

    const appendTableSection = (title: string, data: CalculationItem[], includeHariRawat = false, includePemeriksaan = false) => {
      if (data.length === 0) return;
      lines.push('');
      lines.push(`TABEL: ${title}`);
      data.forEach(item => {
        lines.push(`${item.kode} - ${item.unit}`);
        lines.push(`  • BTL Terdistribusi: ${formatCurrency(item.btlTerdistribusi)}`);
        lines.push(`  • Total Biaya dengan JP: ${formatCurrency(item.totalBiaya)}`);
        lines.push(`  • Total Pendapatan: ${formatCurrency(item.totalPendapatan)}`);
        lines.push(`  • Total Kunjungan: ${item.totalKunjungan.toLocaleString('id-ID')}`);
        if (includeHariRawat) {
          lines.push(`  • Total Hari Rawat: ${item.totalHariRawat.toLocaleString('id-ID')}`);
          lines.push(`  • Pendapatan per Hari Rawat: ${formatCurrency(item.pendapatanPerHariRawat)}`);
          lines.push(`  • Biaya per Hari Rawat: ${formatCurrency(item.biayaPerHariRawat)}`);
        }
        if (includePemeriksaan) {
          lines.push(`  • Total Pemeriksaan: ${item.totalPemeriksaan.toLocaleString('id-ID')}`);
          lines.push(`  • Biaya per Pemeriksaan: ${formatCurrency(item.biayaPerPemeriksaan)}`);
        }
        lines.push(`  • Pendapatan per Kunjungan: ${formatCurrency(item.pendapatanPerKunjungan)}`);
        lines.push(`  • Biaya per Kunjungan: ${formatCurrency(item.biayaPerKunjungan)}`);
        lines.push(`  • Revenue/Cost %: ${item.revenueToCostPercentage.toFixed(2)}%`);
      });
    };

    if (selection.tables.rawatInap) {
      appendTableSection(tableLabels.rawatInap, calculationTablesData.rawatInap, true, false);
    }

    if (selection.tables.rawatJalan) {
      appendTableSection(tableLabels.rawatJalan, calculationTablesData.rawatJalan, false, false);
    }

    if (selection.tables.penunjang) {
      appendTableSection(tableLabels.penunjang, calculationTablesData.penunjang, false, true);
    }

    lines.push('');
    lines.push(`Laporan dibuat: ${new Date().toLocaleString('id-ID')}`);

    return lines.join('\n');
  };

  const handleDownloadReport = (selection: DownloadSelection) => {
    const reportContent = generateReportContent(selection);
    if (!reportContent.trim()) {
      return;
    }

    const blob = new Blob([reportContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `struktur-biaya-${selectedYear}-${new Date().getTime()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleConfirmDownload = () => {
    if (!hasDownloadSelection) {
      return;
    }
    handleDownloadReport(downloadSelection);
    setDownloadDialogOpen(false);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600 mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PieChart className="h-5 w-5" />
            Analisis Struktur Biaya
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Filter Controls */}
          <div className="flex gap-4 mb-6 flex-wrap items-center">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              <span className="text-sm font-medium">Filter:</span>
            </div>
            
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Tahun:</label>
              <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {yearOptions.map(year => (
                    <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium">Unit Kerja:</label>
                  <Select>
                    <SelectTrigger className="w-64">
                      <SelectValue placeholder={`${selectedUnitIds.length} unit dipilih`} />
                    </SelectTrigger>
                    <SelectContent className="max-h-60">
                      <div className="p-2 border-b">
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleSelectAllUnits}
                            className="text-xs"
                          >
                            Pilih Semua
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleClearAllUnits}
                            className="text-xs"
                          >
                            Hapus Semua
                          </Button>
                        </div>
                      </div>
                      {unitKerjaList.map(unit => (
                        <div key={unit.id} className="flex items-center space-x-2 p-2 hover:bg-gray-50">
                          <Checkbox
                            id={`unit-${unit.id}`}
                            checked={selectedUnitIds.includes(unit.kode)}
                            onCheckedChange={() => handleUnitKerjaToggle(unit.kode)}
                          />
                          <label
                            htmlFor={`unit-${unit.id}`}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                          >
                            {unit.kode} - {unit.nama}
                          </label>
                        </div>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Jenis Kegiatan:</label>
              <Select value={selectedJenisKegiatan} onValueChange={setSelectedJenisKegiatan}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Jenis</SelectItem>
                  <SelectItem value="Rawat Inap">Rawat Inap</SelectItem>
                  <SelectItem value="Rawat Jalan">Rawat Jalan</SelectItem>
                  <SelectItem value="Penunjang">Penunjang</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <Search className="h-4 w-4" />
              <Input
                placeholder="Cari unit kerja..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-48"
              />
            </div>

            <Dialog open={downloadDialogOpen} onOpenChange={setDownloadDialogOpen}>
              <DialogTrigger asChild>
                <Button className="ml-auto">
                  <Download className="h-4 w-4 mr-2" />
                  Unduh Laporan
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                  <DialogTitle>Pilih Bagian Laporan</DialogTitle>
                  <DialogDescription>Pilih grafik dan tabel yang ingin disertakan dalam laporan unduhan.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="download-summary"
                        checked={downloadSelection.includeSummary}
                        onCheckedChange={toggleIncludeSummary}
                      />
                      <label htmlFor="download-summary" className="text-sm font-medium cursor-pointer">
                        Ringkasan Utama
                      </label>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleSelectAllDownloads(true)}>
                        Pilih Semua
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleSelectAllDownloads(false)}>
                        Kosongkan
                      </Button>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-semibold mb-2">Grafik</p>
                    <div className="space-y-2">
                      {(Object.keys(chartLabels) as ChartOptionKey[]).map(key => (
                        <div key={key} className="flex items-center gap-2">
                          <Checkbox
                            id={`chart-${key}`}
                            checked={downloadSelection.charts[key]}
                            onCheckedChange={() => toggleChartOption(key)}
                          />
                          <label htmlFor={`chart-${key}`} className="text-sm cursor-pointer">
                            {chartLabels[key]}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-semibold mb-2">Tabel</p>
                    <div className="space-y-2">
                      {(Object.keys(tableLabels) as TableOptionKey[]).map(key => (
                        <div key={key} className="flex items-center gap-2">
                          <Checkbox
                            id={`table-${key}`}
                            checked={downloadSelection.tables[key]}
                            onCheckedChange={() => toggleTableOption(key)}
                          />
                          <label htmlFor={`table-${key}`} className="text-sm cursor-pointer">
                            {tableLabels[key]}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setDownloadDialogOpen(false)}>
                    Batal
                  </Button>
                  <Button onClick={handleConfirmDownload} disabled={!hasDownloadSelection}>
                    Unduh
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-3 mb-4">
            <Card className="border-none bg-emerald-50 shadow-sm">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <div className="text-sm text-emerald-700 font-medium">Total Unit Kerja</div>
                  <div className="text-2xl font-bold text-emerald-900">{barChartData.length}</div>
                </div>
                <div className="p-3 rounded-full bg-emerald-200/70 text-emerald-700">
                  <Layers className="h-5 w-5" />
                </div>
              </CardContent>
            </Card>
            <Card className="border-none bg-sky-50 shadow-sm">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <div className="text-sm text-sky-700 font-medium">Total BTL Terdistribusi</div>
                  <div className="text-2xl font-bold text-sky-900">{formatCurrency(totalBTL)}</div>
                </div>
                <div className="p-3 rounded-full bg-sky-200/70 text-sky-700">
                  <Wallet className="h-5 w-5" />
                </div>
              </CardContent>
            </Card>
            <Card className="border-none bg-amber-50 shadow-sm">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <div className="text-sm text-amber-700 font-medium">Total Biaya dengan JP</div>
                  <div className="text-2xl font-bold text-amber-900">{formatCurrency(totalBiayaDenganJP)}</div>
                </div>
                <div className="p-3 rounded-full bg-amber-200/70 text-amber-700">
                  <Coins className="h-5 w-5" />
                </div>
              </CardContent>
            </Card>
            <Card className="border-none bg-indigo-50 shadow-sm">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <div className="text-sm text-indigo-700 font-medium">Total Pendapatan</div>
                  <div className="text-2xl font-bold text-indigo-900">{formatCurrency(totalPendapatan)}</div>
                </div>
                <div className="p-3 rounded-full bg-indigo-200/70 text-indigo-700">
                  <TrendingUp className="h-5 w-5" />
                </div>
              </CardContent>
            </Card>
            <Card className="border-none bg-rose-50 shadow-sm">
              <CardContent className="p-4 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-rose-700 font-medium">Revenue vs Cost</div>
                  <div className="p-3 rounded-full bg-rose-200/70 text-rose-700">
                    <Scale className="h-5 w-5" />
                  </div>
                </div>
                <div className="text-3xl font-bold text-rose-900">{perbandinganRevenueToCost.ratio.toFixed(2)}</div>
                <div className="text-xs text-rose-700">
                  {perbandinganRevenueToCost.persentase.toFixed(2)}% · {perbandinganRevenueToCost.isEfficient ? 'Profit' : 'Loss'}
                </div>
                <div className="text-xs text-rose-700">
                  Selisih: {formatCurrency(perbandinganRevenueToCost.selisih)}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Average Revenue to Cost by Jenis */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
            {averageRevenueCostByJenis.map(({ jenis, color, average }) => (
              <Card
                key={jenis}
                className="border-none shadow-sm"
                style={{ backgroundColor: getSoftBackgroundColor(color, 0.18) }}
              >
                <CardContent className="p-6 flex items-center gap-5">
                  <div className="w-32 h-24 flex items-center justify-center">
                    <RadialBarChart
                      width={140}
                      height={100}
                      innerRadius={45}
                      outerRadius={70}
                      startAngle={180}
                      endAngle={0}
                      data={[{ name: jenis, value: average }]}
                    >
                      <PolarAngleAxis type="number" domain={[0, 200]} tick={false} />
                      <RadialBar
                        minPointSize={15}
                        cornerRadius={8}
                        dataKey="value"
                        fill={color}
                        background={{ fill: "rgba(255,255,255,0.55)" }}
                      />
                    </RadialBarChart>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 text-base font-semibold text-gray-600">
                      <Gauge className="h-5 w-5 text-gray-500" />
                      <span>Avg Revenue/Cost %</span>
                    </div>
                    <div className="text-3xl font-bold text-gray-900 mt-2">{average.toFixed(2)}%</div>
                    <div className="text-base font-semibold text-gray-700">{jenis}</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Pie Chart */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="h-5 w-5" />
                Struktur Biaya (Pie Chart)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {strukturBiayaData.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-[minmax(320px,360px)_minmax(0,1fr)] gap-6 lg:items-start xl:gap-8">
                  <div className="h-[26rem]">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsPieChart>
                        <defs>
                          {strukturBiayaData.map((entry, index) => (
                            <linearGradient
                              key={`grad-${index}`}
                              id={`pieGradient-${index}`}
                              x1="0"
                              y1="0"
                              x2="0"
                              y2="1"
                            >
                              <stop offset="5%" stopColor={entry.warna} stopOpacity={0.95} />
                              <stop offset="95%" stopColor={entry.warna} stopOpacity={0.55} />
                            </linearGradient>
                          ))}
                        </defs>
                        <Pie
                          data={strukturBiayaData}
                          cx="50%"
                          cy="50%"
                          innerRadius={80}
                          outerRadius={150}
                          labelLine={false}
                          paddingAngle={2}
                          label={({ kategori, persentase }) => `${kategori}: ${persentase}%`}
                          dataKey="nilai"
                          nameKey="kategori"
                          stroke="#f8fafc"
                          strokeWidth={2}
                        >
                          {strukturBiayaData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={`url(#pieGradient-${index})`} />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value, _name, entry: any) => {
                            const kategori = entry?.payload?.kategori ?? '';
                            const persentase = entry?.payload?.persentase ?? 0;
                            return [
                              formatCurrency(Number(value)),
                              `${kategori} (${Number(persentase).toFixed(2)}%)`,
                            ];
                          }}
                        />
                        <Legend />
                      </RechartsPieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex flex-col xl:flex-row gap-6 xl:gap-10 items-start w-full">
                    <div className="flex-1 space-y-2 w-full xl:max-w-2xl">
                      <h4 className="font-semibold">Detail Struktur Biaya:</h4>
                      {strukturBiayaData.map((item, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-emerald-50 rounded">
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-4 h-4 rounded" 
                              style={{ backgroundColor: item.warna }}
                            />
                            <span className="text-sm font-medium">{item.kategori}</span>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-bold">{formatCurrency(item.nilai)}</div>
                            <div className="text-xs text-muted-foreground">{item.persentase}%</div>
                          </div>
                        </div>
                      ))}
                      <p className="text-xs text-muted-foreground mt-2">
                        BTL termasuk di dalamnya komponen JP untuk unit kerja pusat biaya.
                      </p>
                    </div>
                    {biayaByJenisData.length > 0 && (
                      <div className="w-full xl:w-[360px] xl:flex-1 rounded-lg border border-emerald-100 bg-white shadow-sm p-5">
                        <h4 className="font-semibold text-emerald-700 mb-4 text-lg">
                          Perbandingan Biaya per Jenis Layanan
                        </h4>
                        <div className="h-72">
                          <ResponsiveContainer width="100%" height="100%">
                            <RechartsPieChart>
                              <Pie
                                data={biayaByJenisData}
                                dataKey="nilai"
                                nameKey="kategori"
                                cx="45%"
                                cy="48%"
                                innerRadius={70}
                                outerRadius={130}
                                paddingAngle={4}
                                stroke="#f8fafc"
                                strokeWidth={2}
                                label={({ kategori, persentase }) => `${kategori}: ${persentase}%`}
                              >
                                {biayaByJenisData.map((entry, index) => (
                                  <Cell key={`jenis-cell-${index}`} fill={entry.warna} />
                                ))}
                              </Pie>
                              <Tooltip
                                formatter={(value, _name, entry: any) => {
                                  const kategori = entry?.payload?.kategori ?? '';
                                  const persentase = entry?.payload?.persentase ?? 0;
                                  return [
                                    formatCurrency(Number(value)),
                                    `${kategori} (${Number(persentase).toFixed(2)}%)`,
                                  ];
                                }}
                              />
                              <Legend />
                            </RechartsPieChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  Tidak ada data untuk ditampilkan
                </div>
              )}
            </CardContent>
          </Card>

          {/* Bar Chart */}
          <Card className="overflow-x-auto">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Analisis Komprehensif per Unit Kerja
              </CardTitle>
            </CardHeader>
            <CardContent>
              {barChartData.length > 0 ? (
                <div className="h-96">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={barChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="unit" 
                        angle={-45}
                        textAnchor="end"
                        height={100}
                      />
                      <YAxis tickFormatter={(value) => formatCurrency(value)} />
                      <Tooltip formatter={(value, name) => [formatCurrency(Number(value)), name]} />
                      <Legend />
                      <Bar dataKey="btlTerdistribusi" fill="#0EA5E9" name="BTL Terdistribusi" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="totalBiaya" fill="#EF4444" name="Total Biaya dengan JP" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="totalPendapatan" fill="#10B981" name="Total Pendapatan" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  Tidak ada data untuk ditampilkan
                </div>
              )}
            </CardContent>
          </Card>

          {/* Additional Bar Chart for Activities */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Analisis Kegiatan per Unit Kerja
              </CardTitle>
            </CardHeader>
            <CardContent>
              {barChartData.length > 0 ? (
                <div className="h-96">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={barChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="unit" 
                        angle={-45}
                        textAnchor="end"
                        height={100}
                      />
                      <YAxis />
                      <Tooltip formatter={(value, name) => [Number(value).toLocaleString(), name]} />
                      <Legend />
                      <Bar dataKey="totalKunjungan" fill="#3B82F6" name="Total Kunjungan" />
                      <Bar dataKey="jumlahHariRawat" fill="#F59E0B" name="Jumlah Hari Rawat" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  Tidak ada data untuk ditampilkan
                </div>
              )}
            </CardContent>
          </Card>

          {/* Combined Chart - Bar and Line */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Analisis Komprehensif dengan Perhitungan Pembagian
              </CardTitle>
            </CardHeader>
            <CardContent>
              {combinedChartData.length > 0 ? (
                <div className="space-y-6">
                  {/* Chart 1: Total Biaya dan Pendapatan */}
                  <div>
                    <h4 className="font-semibold mb-4">Total Biaya vs Total Pendapatan</h4>
                    <div className="h-96">
                      <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={combinedChartData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis 
                            dataKey="unit" 
                            angle={-45}
                            textAnchor="end"
                            height={100}
                          />
                          <YAxis tickFormatter={(value) => formatCurrency(value)} />
                          <Tooltip formatter={(value, name) => [formatCurrency(Number(value)), name]} />
                          <Legend />
                      <Bar dataKey="btlTerdistribusi" fill="#0EA5E9" name="BTL Terdistribusi" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="totalBiaya" fill="#EF4444" name="Total Biaya dengan JP" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="totalPendapatan" fill="#10B981" name="Total Pendapatan" radius={[4, 4, 0, 0]} />
                        </ComposedChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Chart 2: Kunjungan dan Hari Rawat */}
                  <div>
                    <h4 className="font-semibold mb-4">Total Kunjungan vs Jumlah Hari Rawat</h4>
                    <div className="h-96">
                      <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={combinedChartData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis 
                            dataKey="unit" 
                            angle={-45}
                            textAnchor="end"
                            height={100}
                          />
                          <YAxis />
                          <Tooltip formatter={(value, name) => [Number(value).toLocaleString(), name]} />
                          <Legend />
                          <Bar dataKey="totalKunjungan" fill="#3B82F6" name="Total Kunjungan" />
                          <Bar dataKey="jumlahHariRawat" fill="#F59E0B" name="Jumlah Hari Rawat" />
                        </ComposedChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Chart 3: Perhitungan Pembagian */}
                  <div>
                    <h4 className="font-semibold mb-4">Perhitungan Pembagian per Unit Kerja</h4>
                    <div className="h-96">
                      <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={combinedChartData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis 
                            dataKey="unit" 
                            angle={-45}
                            textAnchor="end"
                            height={100}
                          />
                          <YAxis yAxisId="left" tickFormatter={(value) => formatCurrency(value)} />
                          <YAxis yAxisId="right" orientation="right" tickFormatter={(value) => `${Number(value).toFixed(0)}%`} />
                          <Tooltip formatter={(value, name) => {
                            if (name === 'Revenue/Cost %') {
                              return [`${Number(value).toFixed(2)}%`, name];
                            }
                            return [formatCurrency(Number(value)), name];
                          }} />
                          <Legend />
                          <Line yAxisId="left" type="monotone" dataKey="pendapatanPerKunjungan" stroke="#10B981" strokeWidth={3} name="Pendapatan per Kunjungan" />
                          <Line yAxisId="left" type="monotone" dataKey="pendapatanPerHariRawat" stroke="#3B82F6" strokeWidth={3} name="Pendapatan per Hari Rawat" />
                          <Line yAxisId="left" type="monotone" dataKey="biayaPerKunjungan" stroke="#EF4444" strokeWidth={3} name="Biaya per Kunjungan" />
                          <Line yAxisId="left" type="monotone" dataKey="biayaPerHariRawat" stroke="#F59E0B" strokeWidth={3} name="Biaya per Hari Rawat" />
                          <Line yAxisId="right" type="monotone" dataKey="revenueToCostPercentage" stroke="#6366F1" strokeWidth={3} name="Revenue/Cost %" />
                        </ComposedChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Tabel Perhitungan Pembagian - Rawat Inap */}
                  <div>
                    <h4 className="font-semibold mb-4">Detail Perhitungan Pembagian - Rawat Inap</h4>
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse border border-gray-300">
                        <thead>
                          <tr className="bg-emerald-600 text-white">
                            <th className="border border-gray-300 px-4 py-2 text-left">Unit Kerja</th>
                            <th className="border border-gray-300 px-4 py-2 text-right">BTL Terdistribusi</th>
                            <th className="border border-gray-300 px-4 py-2 text-right">Total Biaya dengan JP</th>
                            <th className="border border-gray-300 px-4 py-2 text-right">Total Pendapatan</th>
                            <th className="border border-gray-300 px-4 py-2 text-right">Total Kunjungan</th>
                            <th className="border border-gray-300 px-4 py-2 text-right">Total Hari Rawat</th>
                            <th className="border border-gray-300 px-4 py-2 text-right">Pendapatan/Kunjungan</th>
                            <th className="border border-gray-300 px-4 py-2 text-right">Pendapatan/Hari Rawat</th>
                            <th className="border border-gray-300 px-4 py-2 text-right">Biaya/Kunjungan</th>
                            <th className="border border-gray-300 px-4 py-2 text-right">Biaya/Hari Rawat</th>
                            <th className="border border-gray-300 px-4 py-2 text-right">Revenue/Cost %</th>
                          </tr>
                        </thead>
                        <tbody>
                          {calculationTablesData.rawatInap.map((item, index) => (
                            <tr key={index}>
                              <td className="border border-gray-300 px-4 py-2 font-medium">{item.unit}</td>
                              <td className="border border-gray-300 px-4 py-2 text-right">{formatCurrency(item.btlTerdistribusi)}</td>
                              <td className="border border-gray-300 px-4 py-2 text-right">{formatCurrency(item.totalBiaya)}</td>
                              <td className="border border-gray-300 px-4 py-2 text-right">{formatCurrency(item.totalPendapatan)}</td>
                              <td className="border border-gray-300 px-4 py-2 text-right">{item.totalKunjungan.toLocaleString()}</td>
                              <td className="border border-gray-300 px-4 py-2 text-right">{item.totalHariRawat.toLocaleString()}</td>
                              <td className="border border-gray-300 px-4 py-2 text-right">{formatCurrency(item.pendapatanPerKunjungan)}</td>
                              <td className="border border-gray-300 px-4 py-2 text-right">{formatCurrency(item.pendapatanPerHariRawat)}</td>
                              <td className="border border-gray-300 px-4 py-2 text-right">{formatCurrency(item.biayaPerKunjungan)}</td>
                              <td className="border border-gray-300 px-4 py-2 text-right">{formatCurrency(item.biayaPerHariRawat)}</td>
                              <td className="border border-gray-300 px-4 py-2 text-right">{item.revenueToCostPercentage.toFixed(2)}%</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Tabel Perhitungan Pembagian - Rawat Jalan */}
                  <div>
                    <h4 className="font-semibold mb-4">Detail Perhitungan Pembagian - Rawat Jalan</h4>
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse border border-gray-300">
                        <thead>
                          <tr className="bg-emerald-600 text-white">
                            <th className="border border-gray-300 px-4 py-2 text-left">Unit Kerja</th>
                            <th className="border border-gray-300 px-4 py-2 text-right">BTL Terdistribusi</th>
                            <th className="border border-gray-300 px-4 py-2 text-right">Total Biaya dengan JP</th>
                            <th className="border border-gray-300 px-4 py-2 text-right">Total Pendapatan</th>
                            <th className="border border-gray-300 px-4 py-2 text-right">Total Kunjungan</th>
                            <th className="border border-gray-300 px-4 py-2 text-right">Pendapatan/Kunjungan</th>
                            <th className="border border-gray-300 px-4 py-2 text-right">Biaya/Kunjungan</th>
                            <th className="border border-gray-300 px-4 py-2 text-right">Revenue/Cost %</th>
                          </tr>
                        </thead>
                        <tbody>
                          {calculationTablesData.rawatJalan.map((item, index) => (
                            <tr key={index}>
                              <td className="border border-gray-300 px-4 py-2 font-medium">{item.unit}</td>
                              <td className="border border-gray-300 px-4 py-2 text-right">{formatCurrency(item.btlTerdistribusi)}</td>
                              <td className="border border-gray-300 px-4 py-2 text-right">{formatCurrency(item.totalBiaya)}</td>
                              <td className="border border-gray-300 px-4 py-2 text-right">{formatCurrency(item.totalPendapatan)}</td>
                              <td className="border border-gray-300 px-4 py-2 text-right">{item.totalKunjungan.toLocaleString()}</td>
                              <td className="border border-gray-300 px-4 py-2 text-right">{formatCurrency(item.pendapatanPerKunjungan)}</td>
                              <td className="border border-gray-300 px-4 py-2 text-right">{formatCurrency(item.biayaPerKunjungan)}</td>
                              <td className="border border-gray-300 px-4 py-2 text-right">{item.revenueToCostPercentage.toFixed(2)}%</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Tabel Perhitungan Pembagian - Penunjang */}
                  <div>
                    <h4 className="font-semibold mb-4">Detail Perhitungan Pembagian - Penunjang</h4>
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse border border-gray-300">
                        <thead>
                          <tr className="bg-emerald-600 text-white">
                            <th className="border border-gray-300 px-4 py-2 text-left">Unit Kerja</th>
                            <th className="border border-gray-300 px-4 py-2 text-right">BTL Terdistribusi</th>
                            <th className="border border-gray-300 px-4 py-2 text-right">Total Biaya dengan JP</th>
                            <th className="border border-gray-300 px-4 py-2 text-right">Total Pendapatan</th>
                            <th className="border border-gray-300 px-4 py-2 text-right">Total Kunjungan</th>
                            <th className="border border-gray-300 px-4 py-2 text-right">Total Pemeriksaan</th>
                            <th className="border border-gray-300 px-4 py-2 text-right">Pendapatan/Kunjungan</th>
                            <th className="border border-gray-300 px-4 py-2 text-right">Biaya/Kunjungan</th>
                            <th className="border border-gray-300 px-4 py-2 text-right">Biaya/Pemeriksaan</th>
                            <th className="border border-gray-300 px-4 py-2 text-right">Revenue/Cost %</th>
                          </tr>
                        </thead>
                        <tbody>
                          {calculationTablesData.penunjang.map((item, index) => (
                            <tr key={index}>
                              <td className="border border-gray-300 px-4 py-2 font-medium">{item.unit}</td>
                              <td className="border border-gray-300 px-4 py-2 text-right">{formatCurrency(item.btlTerdistribusi)}</td>
                              <td className="border border-gray-300 px-4 py-2 text-right">{formatCurrency(item.totalBiaya)}</td>
                              <td className="border border-gray-300 px-4 py-2 text-right">{formatCurrency(item.totalPendapatan)}</td>
                              <td className="border border-gray-300 px-4 py-2 text-right">{item.totalKunjungan.toLocaleString()}</td>
                              <td className="border border-gray-300 px-4 py-2 text-right">{item.totalPemeriksaan.toLocaleString()}</td>
                              <td className="border border-gray-300 px-4 py-2 text-right">{formatCurrency(item.pendapatanPerKunjungan)}</td>
                              <td className="border border-gray-300 px-4 py-2 text-right">{formatCurrency(item.biayaPerKunjungan)}</td>
                              <td className="border border-gray-300 px-4 py-2 text-right">{formatCurrency(item.biayaPerPemeriksaan)}</td>
                              <td className="border border-gray-300 px-4 py-2 text-right">{item.revenueToCostPercentage.toFixed(2)}%</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  Tidak ada data untuk ditampilkan
                </div>
              )}
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  );
};

export default StrukturBiaya;
