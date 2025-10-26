import React, { useState, useEffect, useMemo } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Download, Search, Filter, PieChart, BarChart3, TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PieChart as RechartsPieChart, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Pie, ComposedChart, Line, LineChart } from "recharts";

interface Biaya {
  id: string;
  tahun: number;
  unit_kerja?: {
    id: string;
    kode: string;
    nama: string;
    kategori: string;
  };
  biaya_bahan: number;
  biaya_pegawai: number;
  biaya_jasa_pelayanan: number;
  biaya_daya: number;
  biaya_pemeliharaan: number;
  biaya_penyusutan: number;
  biaya_operasional_lainnya: number;
  total_biaya: number;
  total_biaya_tanpa_jp: number;
}

interface Pendapatan {
  id: string;
  tahun: number;
  unit_kerja?: {
    id: string;
    kode: string;
    nama: string;
    kategori: string;
  };
  total_pendapatan: number;
}

interface Kegiatan {
  id: number;
  tahun: number;
  Kode_UK: string;
  Nama_Unit_Kerja: string;
  Total_Kunjungan_Pasien: number;
  Jumlah_Hari_Rawat: number;
  Jenis: string; // 'Rawat Jalan', 'Rawat Inap', 'Operatif', 'Non Layanan'
}

interface StrukturBiayaData {
  kategori: string;
  nilai: number;
  persentase: number;
  warna: string;
}

const StrukturBiaya: React.FC = () => {
  const [biayaList, setBiayaList] = useState<Biaya[]>([]);
  const [pendapatanList, setPendapatanList] = useState<Pendapatan[]>([]);
  const [kegiatanList, setKegiatanList] = useState<Kegiatan[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedYear, setSelectedYear] = useState<number>(2025);
  const [selectedUnitIds, setSelectedUnitIds] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedJenisKegiatan, setSelectedJenisKegiatan] = useState<string>("all");
  const [unitKerjaList, setUnitKerjaList] = useState<any[]>([]);
  const [kalkulasiBiayaList, setKalkulasiBiayaList] = useState<any[]>([]);

  // Fetch data biaya
  useEffect(() => {
    fetchBiayaData();
    fetchPendapatanData();
    fetchKegiatanData();
    fetchUnitKerjaData();
    fetchKalkulasiBiayaData();
  }, []);

  const fetchBiayaData = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('data_biaya')
        .select(`
          *,
          unit_kerja (
            id,
            kode,
            nama,
            kategori
          )
        `)
        .eq('unit_kerja.kategori', 'Pusat Pendapatan')
        .order('tahun', { ascending: false });

      if (error) throw error;
      console.log('📊 Data Biaya fetched:', data?.length || 0, 'records');
      setBiayaList(data || []);
    } catch (error) {
      console.error('Error fetching biaya data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPendapatanData = async () => {
    try {
      const { data, error } = await supabase
        .from('data_pendapatan')
        .select(`
          *,
          unit_kerja (
            id,
            kode,
            nama,
            kategori
          )
        `)
        .eq('unit_kerja.kategori', 'Pusat Pendapatan')
        .order('tahun', { ascending: false });

      if (error) throw error;
      console.log('💰 Data Pendapatan fetched:', data?.length || 0, 'records');
      setPendapatanList(data || []);
    } catch (error) {
      console.error('Error fetching pendapatan data:', error);
    }
  };

  const fetchKegiatanData = async () => {
    try {
      const { data, error } = await supabase
        .from('data_kegiatan')
        .select(`
          id,
          tahun,
          "Kode_UK",
          "Nama_Unit_Kerja",
          "Total_Kunjungan_Pasien",
          "Jumlah_Hari_Rawat",
          "Jenis"
        `)
        .in('Kode_UK', ['UK038', 'UK039', 'UK040', 'UK041', 'UK042', 'UK043', 'UK044', 'UK045', 'UK046', 'UK047', 'UK048', 'UK049', 'UK050', 'UK051', 'UK052', 'UK053', 'UK054', 'UK055', 'UK056', 'UK057', 'UK058', 'UK059', 'UK060', 'UK061', 'UK062', 'UK063', 'UK064', 'UK065', 'UK066', 'UK067', 'UK068', 'UK069', 'UK070', 'UK071', 'UK072', 'UK073', 'UK074', 'UK075', 'UK076', 'UK077'])
        .order('tahun', { ascending: false });

      if (error) throw error;
      console.log('📈 Data Kegiatan fetched:', data?.length || 0, 'records');
      setKegiatanList(data || []);
    } catch (error) {
      console.error('Error fetching kegiatan data:', error);
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

  const fetchKalkulasiBiayaData = async () => {
    try {
      // Fetch from all kalkulasi tables
      const [labResult, radResult, bdrsResult, operatifResult, cathlabResult] = await Promise.all([
        supabase
          .from('kalkulasi_biaya_laboratorium')
          .select('kode_unit_kerja, jumlah')
          .eq('tahun', selectedYear),
        supabase
          .from('kalkulasi_biaya_radiologi')
          .select('kode_unit_kerja, jumlah')
          .eq('tahun', selectedYear),
        supabase
          .from('kalkulasi_bdrs')
          .select('kode_unit_kerja, jumlah')
          .eq('tahun', selectedYear),
        supabase
          .from('kalkulasi_biaya_operatif')
          .select('kode_unit_kerja, jumlah')
          .eq('tahun', selectedYear),
        supabase
          .from('kalkulasi_biaya_cathlab')
          .select('kode_unit_kerja, jumlah')
          .eq('tahun', selectedYear)
      ]);

      // Combine all results
      const allData = [
        ...(labResult.data || []),
        ...(radResult.data || []),
        ...(bdrsResult.data || []),
        ...(operatifResult.data || []),
        ...(cathlabResult.data || [])
      ];

      // Group by unit kerja and sum the jumlah
      const unitDataMap = new Map();
      allData.forEach(item => {
        const kode = item.kode_unit_kerja;
        if (!unitDataMap.has(kode)) {
          unitDataMap.set(kode, {
            kode_unit_kerja: kode,
            total_pemeriksaan: 0
          });
        }
        unitDataMap.get(kode).total_pemeriksaan += item.jumlah || 0;
      });

      console.log('💰 Data Kalkulasi Biaya fetched:', Array.from(unitDataMap.values()).length, 'units');
      setKalkulasiBiayaList(Array.from(unitDataMap.values()));
    } catch (error) {
      console.error('Error fetching kalkulasi biaya data:', error);
    }
  };

  // Filter data berdasarkan tahun, unit kerja, dan search term
  const filteredBiayaList = useMemo(() => {
    return biayaList
      .filter(biaya => {
        const yearMatch = biaya.tahun === selectedYear;
        const unitMatch = selectedUnitIds.length === 0 || selectedUnitIds.includes(biaya.unit_kerja?.kode || '');
        const searchMatch = !searchTerm || 
          biaya.unit_kerja?.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
          biaya.unit_kerja?.kode.toLowerCase().includes(searchTerm.toLowerCase());
        
        return yearMatch && unitMatch && searchMatch;
      })
      .sort((a, b) => {
        const aKode = a.unit_kerja?.kode || '';
        const bKode = b.unit_kerja?.kode || '';
        return aKode.localeCompare(bKode);
      });
  }, [biayaList, selectedYear, selectedUnitIds, searchTerm]);

  const filteredPendapatanList = useMemo(() => {
    return pendapatanList
      .filter(pendapatan => {
        const yearMatch = pendapatan.tahun === selectedYear;
        const unitMatch = selectedUnitIds.length === 0 || selectedUnitIds.includes(pendapatan.unit_kerja?.kode || '');
        const searchMatch = !searchTerm || 
          pendapatan.unit_kerja?.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
          pendapatan.unit_kerja?.kode.toLowerCase().includes(searchTerm.toLowerCase());
        
        return yearMatch && unitMatch && searchMatch;
      })
      .sort((a, b) => {
        const aKode = a.unit_kerja?.kode || '';
        const bKode = b.unit_kerja?.kode || '';
        return aKode.localeCompare(bKode);
      });
  }, [pendapatanList, selectedYear, selectedUnitIds, searchTerm]);

  const filteredKegiatanList = useMemo(() => {
    return kegiatanList
      .filter(kegiatan => {
        const yearMatch = kegiatan.tahun === selectedYear;
        const unitMatch = selectedUnitIds.length === 0 || selectedUnitIds.includes(kegiatan.Kode_UK);
        const jenisMatch = selectedJenisKegiatan === "all" || kegiatan.Jenis === selectedJenisKegiatan;
        const searchMatch = !searchTerm || 
          kegiatan.Nama_Unit_Kerja.toLowerCase().includes(searchTerm.toLowerCase()) ||
          kegiatan.Kode_UK.toLowerCase().includes(searchTerm.toLowerCase());
        
        return yearMatch && unitMatch && jenisMatch && searchMatch;
      })
      .sort((a, b) => {
        const aKode = a.Kode_UK || '';
        const bKode = b.Kode_UK || '';
        return aKode.localeCompare(bKode);
      });
  }, [kegiatanList, selectedYear, selectedUnitIds, selectedJenisKegiatan, searchTerm]);

  // Hitung struktur biaya berdasarkan total biaya per kategori
  const strukturBiayaData = useMemo(() => {
    console.log('🔍 Filtered Biaya List:', filteredBiayaList.length, 'records');
    const totalBiaya = filteredBiayaList.reduce((sum, biaya) => sum + (biaya.total_biaya || 0), 0);
    console.log('💰 Total Biaya:', totalBiaya);
    
    if (totalBiaya === 0) return [];

    const categories = [
      { key: 'biaya_bahan', label: 'Biaya Bahan', color: '#3B82F6' },
      { key: 'biaya_pegawai', label: 'Biaya Pegawai', color: '#10B981' },
      { key: 'biaya_jasa_pelayanan', label: 'Jasa Pelayanan', color: '#F59E0B' },
      { key: 'biaya_daya', label: 'Biaya Daya', color: '#EF4444' },
      { key: 'biaya_pemeliharaan', label: 'Pemeliharaan', color: '#8B5CF6' },
      { key: 'biaya_penyusutan', label: 'Penyusutan', color: '#06B6D4' },
      { key: 'biaya_operasional_lainnya', label: 'Operasional Lainnya', color: '#84CC16' },
    ];

    return categories.map(category => {
      let total = 0;
      
      if (category.key === 'biaya_pegawai') {
        // Untuk biaya pegawai, kurangi dengan jasa pelayanan
        total = filteredBiayaList.reduce((sum, biaya) => {
          const biayaPegawai = biaya.biaya_pegawai || 0;
          const jasaPelayanan = biaya.biaya_jasa_pelayanan || 0;
          return sum + Math.max(0, biayaPegawai - jasaPelayanan);
        }, 0);
      } else {
        total = filteredBiayaList.reduce((sum, biaya) => 
          sum + (biaya[category.key as keyof Biaya] as number || 0), 0);
      }
      
      const persentase = totalBiaya > 0 ? (total / totalBiaya) * 100 : 0;
      
      return {
        kategori: category.label,
        nilai: total,
        persentase: Math.round(persentase * 100) / 100,
        warna: category.color,
      };
    }).filter(item => item.nilai > 0);
  }, [filteredBiayaList]);

  // Hitung total pendapatan
  const totalPendapatan = useMemo(() => {
    return filteredPendapatanList.reduce((sum, pendapatan) => sum + (pendapatan.total_pendapatan || 0), 0);
  }, [filteredPendapatanList]);

  // Hitung total biaya dengan JP
  const totalBiayaDenganJP = useMemo(() => {
    return filteredBiayaList.reduce((sum, biaya) => sum + (biaya.total_biaya || 0), 0);
  }, [filteredBiayaList]);

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
      ratio: Math.round(ratio * 100) / 100,
      persentase: Math.round(persentase * 100) / 100,
      isEfficient,
      selisih: pendapatan - biaya
    };
  }, [totalBiayaDenganJP, totalPendapatan]);

  // Data untuk bar chart dengan pendapatan dan kegiatan
  const barChartData = useMemo(() => {
    console.log('📊 Creating bar chart data...');
    console.log('🔍 Filtered Biaya:', filteredBiayaList.length);
    console.log('🔍 Filtered Pendapatan:', filteredPendapatanList.length);
    console.log('🔍 Filtered Kegiatan:', filteredKegiatanList.length);
    
    // Gabungkan data biaya, pendapatan, dan kegiatan per unit kerja
    const unitDataMap = new Map();
    
    // Tambahkan data biaya (hanya yang memiliki unit kerja valid)
    filteredBiayaList.forEach(biaya => {
      const unitId = biaya.unit_kerja?.kode;
      const unitName = biaya.unit_kerja?.nama;
      
      // Skip jika tidak ada unit kerja yang valid
      if (!unitId || !unitName) return;
      
      if (!unitDataMap.has(unitId)) {
        unitDataMap.set(unitId, {
          unit: unitName,
          kode: unitId,
          totalBiaya: 0,
          totalPendapatan: 0,
          totalKunjungan: 0,
          jumlahHariRawat: 0,
        });
      }
      unitDataMap.get(unitId).totalBiaya += biaya.total_biaya || 0;
    });
    
    // Tambahkan data pendapatan (hanya yang memiliki unit kerja valid)
    filteredPendapatanList.forEach(pendapatan => {
      const unitId = pendapatan.unit_kerja?.kode;
      const unitName = pendapatan.unit_kerja?.nama;
      
      // Skip jika tidak ada unit kerja yang valid
      if (!unitId || !unitName) return;
      
      if (!unitDataMap.has(unitId)) {
        unitDataMap.set(unitId, {
          unit: unitName,
          kode: unitId,
          totalBiaya: 0,
          totalPendapatan: 0,
          totalKunjungan: 0,
          jumlahHariRawat: 0,
        });
      }
      unitDataMap.get(unitId).totalPendapatan += pendapatan.total_pendapatan || 0;
    });
    
    // Tambahkan data kegiatan (hanya yang memiliki unit kerja valid)
    filteredKegiatanList.forEach(kegiatan => {
      const unitId = kegiatan.Kode_UK;
      const unitName = kegiatan.Nama_Unit_Kerja;
      
      // Skip jika tidak ada unit kerja yang valid
      if (!unitId || !unitName) return;
      
      if (!unitDataMap.has(unitId)) {
        unitDataMap.set(unitId, {
          unit: unitName,
          kode: unitId,
          totalBiaya: 0,
          totalPendapatan: 0,
          totalKunjungan: 0,
          jumlahHariRawat: 0,
        });
      }
      unitDataMap.get(unitId).totalKunjungan += kegiatan.Total_Kunjungan_Pasien || 0;
      unitDataMap.get(unitId).jumlahHariRawat += kegiatan.Jumlah_Hari_Rawat || 0;
    });
    
    return Array.from(unitDataMap.values()).sort((a, b) => a.kode.localeCompare(b.kode));
  }, [filteredBiayaList, filteredPendapatanList, filteredKegiatanList]);

  // Data untuk grafik kombinasi dengan perhitungan pembagian
  const combinedChartData = useMemo(() => {
    return barChartData.map(item => {
      const pendapatanPerKunjungan = item.totalKunjungan > 0 ? item.totalPendapatan / item.totalKunjungan : 0;
      const pendapatanPerHariRawat = item.jumlahHariRawat > 0 ? item.totalPendapatan / item.jumlahHariRawat : 0;
      const biayaPerKunjungan = item.totalKunjungan > 0 ? item.totalBiaya / item.totalKunjungan : 0;
      const biayaPerHariRawat = item.jumlahHariRawat > 0 ? item.totalBiaya / item.jumlahHariRawat : 0;
      
      return {
        ...item,
        pendapatanPerKunjungan: Math.round(pendapatanPerKunjungan),
        pendapatanPerHariRawat: Math.round(pendapatanPerHariRawat),
        biayaPerKunjungan: Math.round(biayaPerKunjungan),
        biayaPerHariRawat: Math.round(biayaPerHariRawat),
      };
    });
  }, [barChartData]);

  // Data untuk tabel perhitungan yang dipecah menjadi 3 kategori
  const calculationTablesData = useMemo(() => {
    const rawatInapData: any[] = [];
    const rawatJalanData: any[] = [];
    const penunjangData: any[] = [];

    // Gabungkan data biaya, pendapatan, dan kegiatan per unit kerja
    const unitDataMap = new Map();
    
    // Tambahkan data biaya (hanya yang memiliki unit kerja valid)
    filteredBiayaList.forEach(biaya => {
      const unitKode = biaya.unit_kerja?.kode;
      const unitName = biaya.unit_kerja?.nama;
      
      // Skip jika tidak ada unit kerja yang valid
      if (!unitKode || !unitName) return;
      
      if (!unitDataMap.has(unitKode)) {
        unitDataMap.set(unitKode, {
          unit: unitName,
          kode: unitKode,
          totalBiaya: 0,
          totalPendapatan: 0,
          totalKunjungan: 0,
          totalHariRawat: 0,
          totalPemeriksaan: 0,
        });
      }
      unitDataMap.get(unitKode).totalBiaya += biaya.total_biaya || 0;
    });
    
    // Tambahkan data pendapatan (hanya yang memiliki unit kerja valid)
    filteredPendapatanList.forEach(pendapatan => {
      const unitKode = pendapatan.unit_kerja?.kode;
      const unitName = pendapatan.unit_kerja?.nama;
      
      // Skip jika tidak ada unit kerja yang valid
      if (!unitKode || !unitName) return;
      
      if (!unitDataMap.has(unitKode)) {
        unitDataMap.set(unitKode, {
          unit: unitName,
          kode: unitKode,
          totalBiaya: 0,
          totalPendapatan: 0,
          totalKunjungan: 0,
          totalHariRawat: 0,
          totalPemeriksaan: 0,
        });
      }
      unitDataMap.get(unitKode).totalPendapatan += pendapatan.total_pendapatan || 0;
    });
    
    // Tambahkan data kegiatan (hanya yang memiliki unit kerja valid)
    filteredKegiatanList.forEach(kegiatan => {
      const unitKode = kegiatan.Kode_UK;
      const unitName = kegiatan.Nama_Unit_Kerja;
      
      // Skip jika tidak ada unit kerja yang valid
      if (!unitKode || !unitName) return;
      
      if (!unitDataMap.has(unitKode)) {
        unitDataMap.set(unitKode, {
          unit: unitName,
          kode: unitKode,
          totalBiaya: 0,
          totalPendapatan: 0,
          totalKunjungan: 0,
          totalHariRawat: 0,
          totalPemeriksaan: 0,
        });
      }
      unitDataMap.get(unitKode).totalKunjungan += kegiatan.Total_Kunjungan_Pasien || 0;
      unitDataMap.get(unitKode).totalHariRawat += kegiatan.Jumlah_Hari_Rawat || 0;
    });

    // Tambahkan data kalkulasi biaya untuk total pemeriksaan
    kalkulasiBiayaList.forEach(kalkulasi => {
      const unitKode = kalkulasi.kode_unit_kerja || '';
      if (unitDataMap.has(unitKode)) {
        unitDataMap.get(unitKode).totalPemeriksaan += kalkulasi.total_pemeriksaan || 0;
      }
    });

    // Hitung perhitungan pembagian untuk setiap unit
    Array.from(unitDataMap.values()).forEach(item => {
      // Debug logging untuk unit kerja "Unknown"
      if (item.unit === 'Unknown' || item.kode === '') {
        console.warn('⚠️ Unit kerja dengan data tidak lengkap:', {
          unit: item.unit,
          kode: item.kode,
          totalBiaya: item.totalBiaya,
          totalPendapatan: item.totalPendapatan,
          totalKunjungan: item.totalKunjungan
        });
      }

      const pendapatanPerKunjungan = item.totalKunjungan > 0 ? item.totalPendapatan / item.totalKunjungan : 0;
      const pendapatanPerHariRawat = item.totalHariRawat > 0 ? item.totalPendapatan / item.totalHariRawat : 0;
      const biayaPerKunjungan = item.totalKunjungan > 0 ? item.totalBiaya / item.totalKunjungan : 0;
      const biayaPerHariRawat = item.totalHariRawat > 0 ? item.totalBiaya / item.totalHariRawat : 0;
      const biayaPerPemeriksaan = item.totalPemeriksaan > 0 ? item.totalBiaya / item.totalPemeriksaan : 0;

      const enhancedItem = {
        ...item,
        pendapatanPerKunjungan: Math.round(pendapatanPerKunjungan),
        pendapatanPerHariRawat: Math.round(pendapatanPerHariRawat),
        biayaPerKunjungan: Math.round(biayaPerKunjungan),
        biayaPerHariRawat: Math.round(biayaPerHariRawat),
        biayaPerPemeriksaan: Math.round(biayaPerPemeriksaan),
      };

      // Kategorikan berdasarkan jenis layanan yang sebenarnya
      const unitKode = item.kode;
      const unitName = item.unit.toLowerCase();
      
      // Rawat Inap: Unit yang melayani pasien rawat inap
      if (unitKode === 'UK046' || unitKode === 'UK047' || unitKode === 'UK048' || unitKode === 'UK049' || 
          unitKode === 'UK050' || unitKode === 'UK051' || unitKode === 'UK052' || unitKode === 'UK053' || 
          unitKode === 'UK054' || unitName.includes('vip') || unitName.includes('rawat inap') || 
          unitName.includes('icu') || unitName.includes('nicu') || unitName.includes('picu') || 
          unitName.includes('nifas') || unitName.includes('perinatologi') || unitName.includes('buketan')) {
        rawatInapData.push(enhancedItem);
      } 
      // Rawat Jalan: Unit yang melayani pasien rawat jalan
      else if (unitKode === 'UK056' || unitKode === 'UK057' || unitKode === 'UK058' || unitKode === 'UK059' || 
               unitKode === 'UK060' || unitKode === 'UK061' || unitKode === 'UK062' || unitKode === 'UK063' || 
               unitKode === 'UK064' || unitKode === 'UK065' || unitKode === 'UK066' || unitKode === 'UK067' || 
               unitKode === 'UK068' || unitKode === 'UK069' || unitKode === 'UK070' || unitKode === 'UK071' || 
               unitKode === 'UK072' || unitKode === 'UK073' || unitName.includes('klinik') || 
               unitName.includes('rawat jalan')) {
        rawatJalanData.push(enhancedItem);
      } 
      // Penunjang: Unit penunjang medis dan non-medis
      else {
        penunjangData.push(enhancedItem);
      }
    });

    return {
      rawatInap: rawatInapData.sort((a, b) => a.kode.localeCompare(b.kode)),
      rawatJalan: rawatJalanData.sort((a, b) => a.kode.localeCompare(b.kode)),
      penunjang: penunjangData.sort((a, b) => a.kode.localeCompare(b.kode)),
    };
  }, [filteredBiayaList, filteredPendapatanList, filteredKegiatanList, kalkulasiBiayaList, selectedYear, selectedUnitIds, searchTerm]);

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

  const handleDownloadReport = () => {
    // Generate report content
    const reportContent = `
ANALISIS STRUKTUR BIAYA
Tahun: ${selectedYear}
Unit Kerja: ${selectedUnitIds.length === 0 ? "Semua Unit" : selectedUnitIds.map(kode => unitKerjaList.find(u => u.kode === kode)?.nama || kode).join(", ")}
Jenis Kegiatan: ${selectedJenisKegiatan === "all" ? "Semua Jenis" : selectedJenisKegiatan}

STRUKTUR BIAYA:
${strukturBiayaData.map(item => 
  `${item.kategori}: ${formatCurrency(item.nilai)} (${item.persentase}%)`
).join('\n')}

RINGKASAN FINANSIAL:
- Total Biaya dengan JP: ${formatCurrency(totalBiayaDenganJP)}
- Total Pendapatan: ${formatCurrency(totalPendapatan)}
- Perbandingan: ${perbandinganBiayaPendapatan.persentase}% (${perbandinganBiayaPendapatan.isProfit ? 'Profit' : 'Loss'})
- Selisih: ${formatCurrency(Math.abs(perbandinganBiayaPendapatan.selisih))}

DETAIL PER UNIT KERJA:
${barChartData.map(item => 
  `${item.kode} - ${item.unit}:
  - Total Biaya: ${formatCurrency(item.totalBiaya)}
  - Total Pendapatan: ${formatCurrency(item.totalPendapatan)}
  - Total Kunjungan: ${item.totalKunjungan.toLocaleString()}
  - Jumlah Hari Rawat: ${item.jumlahHariRawat.toLocaleString()}`
).join('\n\n')}

Generated on: ${new Date().toLocaleString()}
    `;

    // Create and download file
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
                  {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(year => (
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

            <Button onClick={handleDownloadReport} className="ml-auto">
              <Download className="h-4 w-4 mr-2" />
              Unduh Laporan
            </Button>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="text-sm text-muted-foreground">Total Unit Kerja Pusat Pendapatan</div>
                <div className="text-2xl font-bold">{barChartData.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-sm text-muted-foreground">Total Biaya</div>
                <div className="text-2xl font-bold text-green-600">
                  {formatCurrency(totalBiayaDenganJP)}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-sm text-muted-foreground">Total Pendapatan</div>
                <div className="text-2xl font-bold text-blue-600">
                  {formatCurrency(totalPendapatan)}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-sm text-muted-foreground">Perbandingan Revenue to Cost</div>
                <div className="text-2xl font-bold">
                  <Badge 
                    variant={perbandinganRevenueToCost.isEfficient ? "default" : "destructive"}
                    className={perbandinganRevenueToCost.isEfficient ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}
                  >
                    {perbandinganRevenueToCost.ratio}
                  </Badge>
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {perbandinganRevenueToCost.isEfficient ? 'Efficient' : 'Inefficient'} 
                  ({perbandinganRevenueToCost.persentase}%)
                </div>
              </CardContent>
            </Card>
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
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="h-96">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsPieChart>
                        <Pie
                          data={strukturBiayaData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ kategori, persentase }) => `${kategori}: ${persentase}%`}
                          outerRadius={120}
                          fill="#8884d8"
                          dataKey="nilai"
                        >
                          {strukturBiayaData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.warna} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => [formatCurrency(Number(value)), 'Nilai']} />
                        <Legend />
                      </RechartsPieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-semibold">Detail Struktur Biaya:</h4>
                    {strukturBiayaData.map((item, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
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
          <Card>
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
                      <Bar dataKey="totalBiaya" fill="#EF4444" name="Total Biaya dengan JP" />
                      <Bar dataKey="totalPendapatan" fill="#10B981" name="Total Pendapatan" />
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
                          <Bar dataKey="totalBiaya" fill="#EF4444" name="Total Biaya dengan JP" />
                          <Bar dataKey="totalPendapatan" fill="#10B981" name="Total Pendapatan" />
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
                          <YAxis tickFormatter={(value) => formatCurrency(value)} />
                          <Tooltip formatter={(value, name) => [formatCurrency(Number(value)), name]} />
                          <Legend />
                          <Line type="monotone" dataKey="pendapatanPerKunjungan" stroke="#10B981" strokeWidth={3} name="Pendapatan per Kunjungan" />
                          <Line type="monotone" dataKey="pendapatanPerHariRawat" stroke="#3B82F6" strokeWidth={3} name="Pendapatan per Hari Rawat" />
                          <Line type="monotone" dataKey="biayaPerKunjungan" stroke="#EF4444" strokeWidth={3} name="Biaya per Kunjungan" />
                          <Line type="monotone" dataKey="biayaPerHariRawat" stroke="#F59E0B" strokeWidth={3} name="Biaya per Hari Rawat" />
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
                          <tr className="bg-blue-50">
                            <th className="border border-gray-300 px-4 py-2 text-left">Unit Kerja</th>
                            <th className="border border-gray-300 px-4 py-2 text-right">Total Biaya dengan JP</th>
                            <th className="border border-gray-300 px-4 py-2 text-right">Total Pendapatan</th>
                            <th className="border border-gray-300 px-4 py-2 text-right">Total Kunjungan</th>
                            <th className="border border-gray-300 px-4 py-2 text-right">Total Hari Rawat</th>
                            <th className="border border-gray-300 px-4 py-2 text-right">Pendapatan/Kunjungan</th>
                            <th className="border border-gray-300 px-4 py-2 text-right">Pendapatan/Hari Rawat</th>
                            <th className="border border-gray-300 px-4 py-2 text-right">Biaya/Kunjungan</th>
                            <th className="border border-gray-300 px-4 py-2 text-right">Biaya/Hari Rawat</th>
                          </tr>
                        </thead>
                        <tbody>
                          {calculationTablesData.rawatInap.map((item, index) => (
                            <tr key={index}>
                              <td className="border border-gray-300 px-4 py-2 font-medium">{item.unit}</td>
                              <td className="border border-gray-300 px-4 py-2 text-right">{formatCurrency(item.totalBiaya)}</td>
                              <td className="border border-gray-300 px-4 py-2 text-right">{formatCurrency(item.totalPendapatan)}</td>
                              <td className="border border-gray-300 px-4 py-2 text-right">{item.totalKunjungan.toLocaleString()}</td>
                              <td className="border border-gray-300 px-4 py-2 text-right">{item.totalHariRawat.toLocaleString()}</td>
                              <td className="border border-gray-300 px-4 py-2 text-right">{formatCurrency(item.pendapatanPerKunjungan)}</td>
                              <td className="border border-gray-300 px-4 py-2 text-right">{formatCurrency(item.pendapatanPerHariRawat)}</td>
                              <td className="border border-gray-300 px-4 py-2 text-right">{formatCurrency(item.biayaPerKunjungan)}</td>
                              <td className="border border-gray-300 px-4 py-2 text-right">{formatCurrency(item.biayaPerHariRawat)}</td>
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
                          <tr className="bg-green-50">
                            <th className="border border-gray-300 px-4 py-2 text-left">Unit Kerja</th>
                            <th className="border border-gray-300 px-4 py-2 text-right">Total Biaya dengan JP</th>
                            <th className="border border-gray-300 px-4 py-2 text-right">Total Pendapatan</th>
                            <th className="border border-gray-300 px-4 py-2 text-right">Total Kunjungan</th>
                            <th className="border border-gray-300 px-4 py-2 text-right">Pendapatan/Kunjungan</th>
                            <th className="border border-gray-300 px-4 py-2 text-right">Biaya/Kunjungan</th>
                          </tr>
                        </thead>
                        <tbody>
                          {calculationTablesData.rawatJalan.map((item, index) => (
                            <tr key={index}>
                              <td className="border border-gray-300 px-4 py-2 font-medium">{item.unit}</td>
                              <td className="border border-gray-300 px-4 py-2 text-right">{formatCurrency(item.totalBiaya)}</td>
                              <td className="border border-gray-300 px-4 py-2 text-right">{formatCurrency(item.totalPendapatan)}</td>
                              <td className="border border-gray-300 px-4 py-2 text-right">{item.totalKunjungan.toLocaleString()}</td>
                              <td className="border border-gray-300 px-4 py-2 text-right">{formatCurrency(item.pendapatanPerKunjungan)}</td>
                              <td className="border border-gray-300 px-4 py-2 text-right">{formatCurrency(item.biayaPerKunjungan)}</td>
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
                          <tr className="bg-yellow-50">
                            <th className="border border-gray-300 px-4 py-2 text-left">Unit Kerja</th>
                            <th className="border border-gray-300 px-4 py-2 text-right">Total Biaya dengan JP</th>
                            <th className="border border-gray-300 px-4 py-2 text-right">Total Pendapatan</th>
                            <th className="border border-gray-300 px-4 py-2 text-right">Total Kunjungan</th>
                            <th className="border border-gray-300 px-4 py-2 text-right">Total Pemeriksaan</th>
                            <th className="border border-gray-300 px-4 py-2 text-right">Pendapatan/Kunjungan</th>
                            <th className="border border-gray-300 px-4 py-2 text-right">Biaya/Kunjungan</th>
                            <th className="border border-gray-300 px-4 py-2 text-right">Biaya/Pemeriksaan</th>
                          </tr>
                        </thead>
                        <tbody>
                          {calculationTablesData.penunjang.map((item, index) => (
                            <tr key={index}>
                              <td className="border border-gray-300 px-4 py-2 font-medium">{item.unit}</td>
                              <td className="border border-gray-300 px-4 py-2 text-right">{formatCurrency(item.totalBiaya)}</td>
                              <td className="border border-gray-300 px-4 py-2 text-right">{formatCurrency(item.totalPendapatan)}</td>
                              <td className="border border-gray-300 px-4 py-2 text-right">{item.totalKunjungan.toLocaleString()}</td>
                              <td className="border border-gray-300 px-4 py-2 text-right">{item.totalPemeriksaan.toLocaleString()}</td>
                              <td className="border border-gray-300 px-4 py-2 text-right">{formatCurrency(item.pendapatanPerKunjungan)}</td>
                              <td className="border border-gray-300 px-4 py-2 text-right">{formatCurrency(item.biayaPerKunjungan)}</td>
                              <td className="border border-gray-300 px-4 py-2 text-right">{formatCurrency(item.biayaPerPemeriksaan)}</td>
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
