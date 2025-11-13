import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Download, RefreshCw, FileText } from "lucide-react";
import { useReportDownload } from "@/components/report";

type DistribusiKeduaRow = {
  id: string;
  user_id?: string | null;
  tahun?: number | null;
  unit_kerja_pusat_biaya?: string | null;
  biaya_alokasi_i?: number | null;
  dasar_alokasi?: string | null;
  keterangan?: string | null;
  total_alokasi_i?: number | null;
  audit_check?: string | null;
  total_alokasi_biaya_kedua?: number | null;
  updated_at?: string | null;
  selisih_pembulatan?: number | null;
  [key: string]: any;
};

const getColumnName = (i: number): string => {
  const ukCode = `uk${i.toString().padStart(3, '0')}`;
  const suffixes = [
    '_direktur', '_komite_ppi', '_komite_pmkp', '_komite_medik', '_akreditasi', '_dewan_pengawas',
    '_bid_pengembangan_dan_penunjang_pelayanan', '_seksi_penunjang_non_medis_dan_pengembangan_penunjang_pela',
    '_ipsrs_medis_dan_non_medis', '_seksi_penunjang_pelayanan_medis', '_bid_keperawatan',
    '_seksi_asuhan_pelayanan_keperawatan', '_seksi_pengembangan_dan_etika_keperawatan', '_bid_pelayanan_medis',
    '_seksi_pengembangan_pelayanan_medis', '_seksi_pelayanan_medis_dan_rekam_medis', '_tpprj', '_tppri',
    '_bag_tata_usaha', '_subag_keuangan', '_unit_perbendaharaan', '_unit_pendapatan',
    '_unit_akuntansi_dan_verifikasi', '_unit_akuntansi_manajemen', '_analis_biaya_dan_kasir',
    '_subag_umpeg', '_staf_umum_dan_kepegawaian', '_unit_it', '_rumah_tangga', '_cleaning_service',
    '_security', '_unit_aset', '_instalasi_humas_komplain', '_subag_renval', '_staf_renval',
    '_rekam_medik', '_ambulance', '_laboratorium_pk_pa', '_radiologi', '_farmasi', '_rehab_medik',
    '_gizi_dapur', '_laundry_cssd', '_bdrs', '_cathlab', '_terang_bulan_vip_vvip', '_truntum',
    '_sekarjagat', '_jlamprang', '_nifas', '_perinatologi', '_buketan', '_icu_picu_nicu', '_vk',
    '_igd_ponek', '_klinik_kebid_kandungan', '_klinik_bedah_mulut', '_klinik_syaraf',
    '_klinik_bedah_syaraf', '_klinik_bedah_digestif', '_klinik_bedah_umum', '_klinik_anak',
    '_klinik_penyakit_dalam', '_klinik_mata', '_klinik_kulit_kelamin', '_klinik_tht', '_klinik_gigi',
    '_klinik_jantung', '_klinik_dot_vct_cst', '_klinik_paru', '_klinik_orthopedi', '_klinik_jiwa',
    '_klinik_parikesit', '_ibs', '_pemulasaran_jenazah', '_hemodialisis', '_unit_diklat'
  ];
  return ukCode + suffixes[i - 1];
};

export default function DistribusiBiayaKedua() {
  const { downloadReport } = useReportDownload();
  const [rows, setRows] = useState<DistribusiKeduaRow[]>([]);
  const [filteredRows, setFilteredRows] = useState<DistribusiKeduaRow[]>([]);
  const [tahun, setTahun] = useState<number>(2025);
  const [selectedUnitKerja, setSelectedUnitKerja] = useState<string>("");
  const [unitKerjaOptions, setUnitKerjaOptions] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [downloadingReport, setDownloadingReport] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [showFilters, setShowFilters] = useState<boolean>(true);
  const { toast } = useToast();

  // Peta basis dari data_kegiatan_transpose dan unit_kerja (untuk Luas_Ruangan)
  const [basisByUnit, setBasisByUnit] = useState<Record<string, any>>({});
  const [luasByUnit, setLuasByUnit] = useState<Record<string, number>>({});

  // Fetch basis dari data_kegiatan_transpose dan luas dari unit_kerja untuk tahun aktif
  // Sesuai instruksi: menggunakan data_kegiatan_transpose dengan kombinasi dasar_alokasi dan sub_kategori
  const fetchBasisData = async (tahunFetch: number) => {
    try {
      // data_kegiatan_transpose: ambil data untuk Total_SDM, Total_Kunjungan_Pasien, dan Komputer_SIMRS
      // Total_SDM: dasar_alokasi='SDM' dan sub_kategori='Total'
      // Total_Kunjungan_Pasien: dasar_alokasi='Kunjungan' dan sub_kategori='Total'
      // Komputer_SIMRS: dasar_alokasi='Komputer' dan sub_kategori='jml. User'
      
      const mapBasis: Record<string, any> = {};
      
      // Ambil data untuk Total_SDM
      const { data: sdmData, error: sdmErr } = await supabase
        .from("data_kegiatan_transpose")
        .select("*")
        .eq("tahun", tahunFetch)
        .eq("dasar_alokasi", "SDM")
        .eq("sub_kategori", "Total")
        .single();
      if (sdmErr && sdmErr.code !== 'PGRST116') {
        console.warn("Gagal mengambil data SDM:", sdmErr);
      } else if (sdmData) {
        // Map kolom unit kerja pusat pendapatan (UK037-UK077) dari data_kegiatan_transpose
        const ukColumns = [
          'ambulance', 'laboratorium_pk_pa', 'radiologi', 'farmasi', 'rehab_medik',
          'gizi_dapur', 'laundry_cssd', 'bdrs', 'cathlab', 'terang_bulan_vip_vvip',
          'truntum', 'sekarjagat', 'jlamprang', 'nifas', 'perinatologi', 'buketan',
          'icu_picu_nicu', 'vk', 'igd_ponek', 'klinik_kebid_kandungan', 'klinik_bedah_mulut',
          'klinik_syaraf', 'klinik_bedah_syaraf', 'klinik_bedah_digestif', 'klinik_bedah_umum',
          'klinik_anak', 'klinik_penyakit_dalam', 'klinik_mata', 'klinik_kulit_kelamin',
          'klinik_tht', 'klinik_gigi', 'klinik_jantung', 'klinik_dot_vct_cst', 'klinik_paru',
          'klinik_orthopedi', 'klinik_jiwa', 'klinik_parikesit', 'ibs', 'pemulasaran_jenazah',
          'hemodialisis', 'unit_diklat'
        ];
        const ukCodes = Array.from({ length: 41 }, (_, i) => `UK${(37 + i).toString().padStart(3, '0')}`);
        
        ukCodes.forEach((code, idx) => {
          if (!mapBasis[code]) {
            mapBasis[code] = {};
          }
          const colName = ukColumns[idx];
          mapBasis[code].Total_SDM = Number(sdmData[colName] || 0);
        });
        mapBasis['_total_SDM'] = Number(sdmData.total_dasar_alokasi_pusat_pendapatan || 0);
      }
      
      // Ambil data untuk Total_Kunjungan_Pasien
      const { data: kunjunganData, error: kunjErr } = await supabase
        .from("data_kegiatan_transpose")
        .select("*")
        .eq("tahun", tahunFetch)
        .eq("dasar_alokasi", "Kunjungan")
        .eq("sub_kategori", "Total")
        .single();
      if (kunjErr && kunjErr.code !== 'PGRST116') {
        console.warn("Gagal mengambil data Kunjungan:", kunjErr);
      } else if (kunjunganData) {
        const ukColumns = [
          'ambulance', 'laboratorium_pk_pa', 'radiologi', 'farmasi', 'rehab_medik',
          'gizi_dapur', 'laundry_cssd', 'bdrs', 'cathlab', 'terang_bulan_vip_vvip',
          'truntum', 'sekarjagat', 'jlamprang', 'nifas', 'perinatologi', 'buketan',
          'icu_picu_nicu', 'vk', 'igd_ponek', 'klinik_kebid_kandungan', 'klinik_bedah_mulut',
          'klinik_syaraf', 'klinik_bedah_syaraf', 'klinik_bedah_digestif', 'klinik_bedah_umum',
          'klinik_anak', 'klinik_penyakit_dalam', 'klinik_mata', 'klinik_kulit_kelamin',
          'klinik_tht', 'klinik_gigi', 'klinik_jantung', 'klinik_dot_vct_cst', 'klinik_paru',
          'klinik_orthopedi', 'klinik_jiwa', 'klinik_parikesit', 'ibs', 'pemulasaran_jenazah',
          'hemodialisis', 'unit_diklat'
        ];
        const ukCodes = Array.from({ length: 41 }, (_, i) => `UK${(37 + i).toString().padStart(3, '0')}`);
        
        ukCodes.forEach((code, idx) => {
          if (!mapBasis[code]) {
            mapBasis[code] = {};
          }
          const colName = ukColumns[idx];
          mapBasis[code].Total_Kunjungan_Pasien = Number(kunjunganData[colName] || 0);
        });
        mapBasis['_total_Kunjungan_Pasien'] = Number(kunjunganData.total_dasar_alokasi_pusat_pendapatan || 0);
      }
      
      // Ambil data untuk Komputer_SIMRS
      const { data: komputerData, error: kompErr } = await supabase
        .from("data_kegiatan_transpose")
        .select("*")
        .eq("tahun", tahunFetch)
        .eq("dasar_alokasi", "Komputer")
        .eq("sub_kategori", "jml. User")
        .single();
      if (kompErr && kompErr.code !== 'PGRST116') {
        console.warn("Gagal mengambil data Komputer:", kompErr);
      } else if (komputerData) {
        const ukColumns = [
          'ambulance', 'laboratorium_pk_pa', 'radiologi', 'farmasi', 'rehab_medik',
          'gizi_dapur', 'laundry_cssd', 'bdrs', 'cathlab', 'terang_bulan_vip_vvip',
          'truntum', 'sekarjagat', 'jlamprang', 'nifas', 'perinatologi', 'buketan',
          'icu_picu_nicu', 'vk', 'igd_ponek', 'klinik_kebid_kandungan', 'klinik_bedah_mulut',
          'klinik_syaraf', 'klinik_bedah_syaraf', 'klinik_bedah_digestif', 'klinik_bedah_umum',
          'klinik_anak', 'klinik_penyakit_dalam', 'klinik_mata', 'klinik_kulit_kelamin',
          'klinik_tht', 'klinik_gigi', 'klinik_jantung', 'klinik_dot_vct_cst', 'klinik_paru',
          'klinik_orthopedi', 'klinik_jiwa', 'klinik_parikesit', 'ibs', 'pemulasaran_jenazah',
          'hemodialisis', 'unit_diklat'
        ];
        const ukCodes = Array.from({ length: 41 }, (_, i) => `UK${(37 + i).toString().padStart(3, '0')}`);
        
        ukCodes.forEach((code, idx) => {
          if (!mapBasis[code]) {
            mapBasis[code] = {};
          }
          const colName = ukColumns[idx];
          mapBasis[code].Komputer_SIMRS = Number(komputerData[colName] || 0);
        });
        mapBasis['_total_Komputer_SIMRS'] = Number(komputerData.total_dasar_alokasi_pusat_pendapatan || 0);
      }

      // unit_kerja: ambil luas_ruangan untuk unit kerja pusat pendapatan
      const { data: unitKerja, error: ukErr } = await supabase
        .from("unit_kerja")
        .select("kode, luas_ruangan")
        .in("kategori", ["Pusat Pendapatan"]);
      if (ukErr) throw ukErr;

      const mapLuas: Record<string, number> = {};
      let totalLuasRuangan = 0;
      (unitKerja || []).forEach((u: any) => {
        const kode = String(u.kode || "").toUpperCase();
        if (!kode) return;
        const luas = Number(u.luas_ruangan || 0);
        mapLuas[kode] = luas;
        // Hitung total luas ruangan untuk unit kerja pusat pendapatan (UK037-UK077)
        if (kode.match(/^UK(0[3-7][7-9]|[4-7][0-7])$/)) {
          totalLuasRuangan += luas;
        }
      });
      mapBasis['_total_Luas_Ruangan'] = totalLuasRuangan;
      setLuasByUnit(mapLuas);
      setBasisByUnit(mapBasis);
    } catch (e: any) {
      console.error("Gagal fetch basis data:", e);
      toast({ title: "Gagal memuat basis alokasi", description: e.message || String(e), variant: "destructive" });
    }
  };

  // Helper: ambil nilai dasar alokasi untuk sebuah unit dan jenis dasar
  // Menggunakan data dari data_kegiatan_transpose yang sudah di-fetch di fetchBasisData()
  // Untuk Luas_Ruangan, menggunakan data dari unit_kerja.luas_ruangan
  const getBasisValue = (unitKode: string, dasar: string | null | undefined): number => {
    const kode = String(unitKode || "").toUpperCase();
    const key = String(dasar || "");
    if (!kode || !key) return 0;
    
    // Luas_Ruangan: ambil dari unit_kerja.luas_ruangan
    if (key === 'Luas_Ruangan' || key === 'Luas_ruangan') {
      return Number(luasByUnit[kode] || 0);
    }
    
    // Ambil nilai basis dari map yang sudah dibuat dari data_kegiatan_transpose
    const entry = basisByUnit[kode];
    if (!entry) return 0;
    
    // Mapping dasar alokasi sesuai dengan data yang di-fetch
    switch (key) {
      case 'Total_SDM':
      case 'Total SDM':
      case 'SDM':
        return Number(entry.Total_SDM || 0);
      case 'Total_Kunjungan_Pasien':
      case 'Total_Kunjungan':
      case 'Kunjungan Pasien':
      case 'Kunjungan':
        return Number(entry.Total_Kunjungan_Pasien || 0);
      case 'Komputer_SIMRS':
      case 'Komputer_simrs_user':
      case 'Komputer':
        return Number(entry.Komputer_SIMRS || 0);
      // Fallback untuk nama lama (jika masih digunakan)
      case 'Jumlah_SDM':
        return Number(entry.Total_SDM || 0);
      default:
        return 0;
    }
  };

  // Daftar kode target penerima (UK037–UK077)
  const targetUnitCodes = useMemo(() => {
    const arr: string[] = [];
    for (let i = 37; i <= 77; i++) {
      arr.push(`UK${i.toString().padStart(3, '0')}`);
    }
    return arr;
  }, []);

  // Hitung nilai alokasi sesuai rumus untuk satu baris, sebelum pembulatan
  // Menggunakan total_dasar_alokasi_pusat_pendapatan dari data_kegiatan_transpose
  const computeRawAllocationsForRow = (r: DistribusiKeduaRow): { colToValue: Record<string, number>; sumBasis: number } => {
    const dasar = r.dasar_alokasi || '';
    const biaya = Number(r.biaya_alokasi_i || 0);
    const colToValue: Record<string, number> = {};
    
    // Ambil total dasar alokasi pusat pendapatan dari basisByUnit (yang diambil dari data_kegiatan_transpose)
    let totalBasis = 0;
    const basisKey = dasar === 'Luas_Ruangan' || dasar === 'Luas_ruangan' 
      ? '_total_Luas_Ruangan' 
      : dasar === 'Total_SDM' || dasar === 'Total SDM' || dasar === 'SDM'
      ? '_total_SDM'
      : dasar === 'Total_Kunjungan_Pasien' || dasar === 'Total_Kunjungan' || dasar === 'Kunjungan Pasien' || dasar === 'Kunjungan'
      ? '_total_Kunjungan_Pasien'
      : dasar === 'Komputer_SIMRS' || dasar === 'Komputer_simrs_user' || dasar === 'Komputer'
      ? '_total_Komputer_SIMRS'
      : null;
    
    if (basisKey && basisByUnit[basisKey] !== undefined) {
      totalBasis = Number(basisByUnit[basisKey] || 0);
    } else {
      // Fallback: hitung sum basis pada target penerima (jika total tidak tersedia)
      for (let i = 37; i <= 77; i++) {
        const code = `UK${i.toString().padStart(3, '0')}`;
        const b = getBasisValue(code, dasar);
        totalBasis += Number(b || 0);
      }
    }

    if (totalBasis <= 0 || biaya === 0) {
      // Tidak ada basis atau biaya, semua 0
      for (let i = 37; i <= 77; i++) {
        const col = getColumnName(i);
        colToValue[col] = 0;
      }
      return { colToValue, sumBasis: totalBasis };
    }

    // Alokasi proporsional sebelum pembulatan
    // Rumus: (nilai basis unit kerja / total dasar alokasi pusat pendapatan) * biaya_alokasi_i
    for (let i = 37; i <= 77; i++) {
      const code = `UK${i.toString().padStart(3, '0')}`;
      const col = getColumnName(i);
      const b = getBasisValue(code, dasar);
      const val = (Number(b || 0) / totalBasis) * biaya;
      colToValue[col] = val;
    }
    return { colToValue, sumBasis: totalBasis };
  };

  // Terapkan Hamilton rounding agar jumlah persis sama dengan biaya_alokasi_i
  const computeHamiltonRoundedForRow = (r: DistribusiKeduaRow): Record<string, number> => {
    const biaya = Number(r.biaya_alokasi_i || 0);
    const { colToValue } = computeRawAllocationsForRow(r);
    // Floor
    const floors: Record<string, number> = {};
    const fracs: { col: string; frac: number }[] = [];
    let sumFloors = 0;
    for (let i = 37; i <= 77; i++) {
      const col = getColumnName(i);
      const v = Number(colToValue[col] || 0);
      const f = Math.floor(v);
      floors[col] = f;
      sumFloors += f;
      fracs.push({ col, frac: v - f });
    }
    let remainder = Math.max(0, Math.round(biaya - sumFloors));
    // Bagi sisa ke fraksional terbesar
    fracs.sort((a, b) => b.frac - a.frac);
    for (let k = 0; k < fracs.length && remainder > 0; k++) {
      floors[fracs[k].col] += 1;
      remainder -= 1;
    }
    return floors;
  };

  // Fetch basis data saat tahun berubah atau saat mount, sebelum fetchRows agar konsisten
  useEffect(() => {
    void fetchBasisData(tahun);
  }, [tahun]);

  console.log('DistribusiBiayaKedua component rendered');

  // Menghitung total alokasi I dari semua baris yang difilter
  const totalAlokasiI = useMemo(() => filteredRows.reduce((s, r) => s + (r.total_alokasi_i ?? 0), 0), [filteredRows]);
  
  // Menghitung total untuk setiap kolom UK (UK037-UK077)
  // Rumus konsisten untuk semua baris: menjumlahkan nilai dari setiap baris untuk kolom yang sama
  const columnTotals = useMemo(() => {
    const totals: Record<string, number> = {};
    // Inisialisasi semua kolom UK037-UK077 dengan nilai 0
    for (let i = 37; i <= 77; i++) {
      const col = getColumnName(i);
      totals[col] = 0;
    }
    // Jumlahkan nilai dari setiap baris untuk setiap kolom
    filteredRows.forEach((r) => {
      for (let i = 37; i <= 77; i++) {
        const col = getColumnName(i);
        const val = (r as any)[col] ?? 0; // Handle null/undefined dengan default 0
        totals[col] += val;
      }
    });
    return totals;
  }, [filteredRows]);

  // Helper: identifikasi apakah kolom adalah target distribusi tahap II (UK037–UK077)
  const isTargetColumn = (col: string): boolean => {
    const match = col.match(/^uk(\d{3})_/i);
    if (!match) return false;
    const num = parseInt(match[1], 10);
    return num >= 37 && num <= 77;
  };

  // Hitung total alokasi biaya kedua per baris (sum UK037-UK077)
  const getRowTotalAlokasiKedua = (r: DistribusiKeduaRow): number => {
    let sum = 0;
    for (let i = 37; i <= 77; i++) {
      const col = getColumnName(i);
      sum += Number(((r as any)[col] ?? 0)) || 0;
    }
    return sum;
  };

  // Hitung grand total alokasi kedua (menjumlahkan semua columnTotals UK037-UK077)
  // Total selisih dari DB (bila tersedia), fallback ke selisih hitung tampilan
  const totalSelisihFromDB = useMemo(() => {
    return filteredRows.reduce((sum, r) => sum + Number(r.selisih_pembulatan ?? 0), 0);
  }, [filteredRows]);

  // Tambahan: hitung total biaya_alokasi_i (untuk perbandingan footer)
  const totalBiayaAlokasiI = useMemo(() => {
    return filteredRows.reduce((sum, r) => sum + (r.biaya_alokasi_i ?? 0), 0);
  }, [filteredRows]);

  // Tambahan: fungsi untuk menghitung selisih per baris (biaya_alokasi_i - sum UK037-UK077)
  const getRowSelisih = (r: DistribusiKeduaRow): number => {
    const totalKedua = getRowTotalAlokasiKedua(r);
    const alokasiI = Number(r.biaya_alokasi_i ?? 0);
    return alokasiI - totalKedua;
  };

  // Pilih kolom target penyesuaian per baris (deterministik: ambil kolom target dengan nilai terbesar)
  const getAdjustmentTargetColumn = (r: DistribusiKeduaRow): string | null => {
    let targetCol: string | null = null;
    let maxVal = Number.NEGATIVE_INFINITY;
    for (let i = 37; i <= 77; i++) {
      const col = getColumnName(i);
      const val = Number(((r as any)[col] ?? 0)) || 0;
      if (val > maxVal) {
        maxVal = val;
        targetCol = col;
      }
    }
    return targetCol;
  };

  // Nilai sel untuk tampilan: gunakan nilai dari database lalu bulatkan (sinkron dengan DB)
  const getRoundedCellValue = (r: DistribusiKeduaRow, col: string): number => {
    if (!isTargetColumn(col)) return 0;
    const raw = Number(((r as any)[col] ?? 0)) || 0;
    return Math.round(raw);
  };

  // Hitung total per baris (jumlah UK037–UK077 yang sudah dibulatkan kolom-per-kolom)
  const getRowTotalAlokasiKeduaAdjusted = (r: DistribusiKeduaRow): number => {
    let sum = 0;
    for (let i = 37; i <= 77; i++) {
      const col = getColumnName(i);
      sum += getRoundedCellValue(r, col);
    }
    return sum;
  };

  // Total per kolom UK setelah pembulatan per kolom (untuk footer)
  const columnTotalsAdjusted = useMemo(() => {
    const totals: Record<string, number> = {};
    for (let i = 37; i <= 77; i++) {
      const col = getColumnName(i);
      totals[col] = 0;
    }
    filteredRows.forEach((r) => {
      for (let i = 37; i <= 77; i++) {
        const col = getColumnName(i);
        totals[col] += getRoundedCellValue(r, col);
      }
    });
    return totals;
  }, [filteredRows]);

  // Grand total setelah pembulatan per kolom (bisa berbeda sedikit dari totalBiayaAlokasiI)
  const grandTotalAlokasiKeduaAdjusted = useMemo(() => {
    let total = 0;
    for (let i = 37; i <= 77; i++) {
      const col = getColumnName(i);
      total += columnTotalsAdjusted[col] ?? 0;
    }
    return total;
  }, [columnTotalsAdjusted]);

  // Selisih total (menunjukkan dampak pembulatan kolom-per-kolom)
  const totalSelisih = useMemo(() => {
    return Math.round(totalBiayaAlokasiI - grandTotalAlokasiKeduaAdjusted);
  }, [totalBiayaAlokasiI, grandTotalAlokasiKeduaAdjusted]);


  useEffect(() => {
    console.log('useEffect triggered, tahun:', tahun);
    void fetchRows();
  }, [tahun]);

  // Component mounted - fetch data from database
  useEffect(() => {
    console.log('Component mounted, fetching data from database...');
  }, []);

  useEffect(() => {
    // Filter data berdasarkan unit kerja yang dipilih
    if (selectedUnitKerja === "") {
      setFilteredRows(rows);
    } else {
      setFilteredRows(rows.filter(row => row.unit_kerja_pusat_biaya === selectedUnitKerja));
    }
  }, [rows, selectedUnitKerja]);

  /**
   * Fungsi untuk memperbarui data dari database
   * Memanggil fungsi ini saat tombol "Perbarui Data" diklik atau tahun berubah
   * 1. Memanggil fungsi SQL untuk recalculate distribusi biaya kedua
   * 2. Mengambil data dari database yang sudah dihitung
   * 3. Memfilter hanya unit kerja dengan kategori "Pusat Biaya"
   * 4. Menghindari duplikasi dengan mengambil 1 record per unit_kerja_pusat_biaya + tahun
   */
  const fetchRows = async () => {
    try {
      setLoading(true);
      setError("");
      console.log('Fetching distribusi_biaya_kedua for tahun:', tahun);
      
      // Step 1: Panggil fungsi SQL untuk recalculate distribusi biaya kedua
      // Menggunakan recalc_distribusi_biaya_kedua_safe yang melakukan kalkulasi aman + perbaikan vertical sum dan rescale
      console.log('Memanggil fungsi recalc_distribusi_biaya_kedua_safe untuk tahun:', tahun);
      const { data: recalcResult, error: recalcError } = await supabase.rpc(
        'recalc_distribusi_biaya_kedua_safe',
        { p_tahun: tahun }
      );
      
      if (recalcError) {
        console.error('Error: Recalculate distribusi biaya kedua gagal:', recalcError);
        const errorMessage = recalcError.message || 'Gagal menghitung distribusi biaya kedua';
        toast({
          title: "Peringatan",
          description: `${errorMessage}. Mencoba menggunakan data yang sudah ada di database.`,
          variant: "default",
        });
        // Lanjutkan meskipun recalculate gagal, mungkin data sudah ada
      } else {
        const result = recalcResult as any;
        const updatedCount = result?.result?.updated_count ?? 0;
        console.log('Recalculate berhasil:', { updatedCount, tahun: result?.result?.tahun });
        if (updatedCount > 0) {
          toast({
            title: "Berhasil",
            description: `Berhasil menghitung ${updatedCount} data distribusi biaya kedua untuk tahun ${tahun}`,
          });
        }
      }
      
      // Step 2: Ambil daftar unit kerja pusat biaya untuk filtering
      const { data: unitKerjaPusatBiaya, error: ukError } = await supabase
        .from("unit_kerja")
        .select("kode, nama")
        .eq("kategori", "Pusat Biaya")
        .order("kode", { ascending: true });
      
      if (ukError) {
        console.warn('Warning: Gagal mengambil unit kerja pusat biaya:', ukError);
      }
      
      const pusatBiayaKodes = new Set<string>();
      if (unitKerjaPusatBiaya) {
        unitKerjaPusatBiaya.forEach((uk: any) => {
          const kode = String(uk.kode || "").toUpperCase();
          if (kode) {
            pusatBiayaKodes.add(kode);
            // Juga tambahkan variasi nama seperti "UK001 - Direktur"
            pusatBiayaKodes.add(`${kode} - ${uk.nama || ''}`);
          }
        });
      }
      
      // Step 3: Fetch data untuk tahun yang dipilih
      const { data, error } = await supabase
        .from("distribusi_biaya_kedua")
        .select("*")
        .eq("tahun", tahun)
        .order("unit_kerja_pusat_biaya", { ascending: true })
        .order("updated_at", { ascending: false });

      console.log('Supabase response:', { data, error });

      if (error) {
        console.error('Supabase error:', error);
        throw new Error(`Database query error: ${error.message}`);
      }
      
      const all = (data as any[]) || [];
      console.log('Data received:', all.length, 'records');
      
      if (all.length === 0) {
        console.warn('Tidak ada data ditemukan untuk tahun:', tahun);
        setRows([]);
        setUnitKerjaOptions([]);
        toast({
          title: "Info",
          description: `Tidak ada data untuk tahun ${tahun}. Pastikan data distribusi biaya pertama sudah dihitung terlebih dahulu. Silakan klik tombol "Perbarui Data" untuk menghitung ulang.`,
          variant: "default",
        });
        return;
      }
      
      // Step 4: Filter hanya unit kerja pusat biaya dengan validasi dari tabel unit_kerja
      // Ambil semua kode unit kerja pusat biaya untuk validasi
      const { data: validPusatBiaya, error: validError } = await supabase
        .from("unit_kerja")
        .select("kode")
        .eq("kategori", "Pusat Biaya");
      
      if (validError) {
        console.warn('Warning: Gagal mengambil validasi unit kerja pusat biaya:', validError);
      }
      
      const validKodes = new Set<string>();
      if (validPusatBiaya) {
        validPusatBiaya.forEach((uk: any) => {
          const kode = String(uk.kode || "").toUpperCase().trim();
          if (kode) {
            validKodes.add(kode);
          }
        });
      }
      
      // Filter dengan validasi menggunakan set kode yang valid
      const filteredByKategori = all.filter((row) => {
        const unitKerja = String(row.unit_kerja_pusat_biaya || '').trim();
        if (!unitKerja) return false;
        
        // Extract kode UK (5 karakter pertama: UK001, UK002, dll)
        const kodeMatch = unitKerja.match(/^(UK\d{3})/i);
        if (!kodeMatch) return false;
        
        const kode = kodeMatch[1].toUpperCase();
        
        // Validasi: kode harus ada di daftar unit kerja pusat biaya
        return validKodes.has(kode);
      });
      
      console.log('Filtered by kategori (Pusat Biaya only):', filteredByKategori.length, 'records');
      
      if (filteredByKategori.length === 0) {
        console.warn('Tidak ada data untuk unit kerja pusat biaya pada tahun:', tahun);
        setRows([]);
        setUnitKerjaOptions([]);
        toast({
          title: "Info",
          description: `Tidak ada data untuk unit kerja pusat biaya pada tahun ${tahun}. Pastikan data distribusi biaya pertama sudah dihitung untuk unit kerja pusat biaya.`,
          variant: "default",
        });
        return;
      }
      
      // Step 5: Urutkan dan deduplikasi berdasarkan KODE UK saja (bukan nama lengkap)
      // Extract kode UK untuk deduplikasi
      const rowsWithKode = filteredByKategori.map(row => {
        const unitKerja = String(row.unit_kerja_pusat_biaya || '').trim();
        const kodeMatch = unitKerja.match(/^(UK\d{3})/i);
        const kode = kodeMatch ? kodeMatch[1].toUpperCase() : '';
        return { ...row, _kode_uk: kode };
      }).filter(r => r._kode_uk); // Hanya ambil yang punya kode valid
      
      const sorted = [...rowsWithKode].sort((a, b) => {
        // Urutkan berdasarkan kode UK
        const kodeCompare = (a._kode_uk || '').localeCompare(b._kode_uk || '');
        if (kodeCompare !== 0) return kodeCompare;
        
        // Jika kode sama, prioritas updated_at terbaru
        const ta = new Date(a.updated_at || a.created_at || 0).getTime();
        const tb = new Date(b.updated_at || b.created_at || 0).getTime();
        if (tb !== ta) return tb - ta;
        
        // Jika timestamp sama, prioritaskan yang memiliki dasar_alokasi
        const da = a.dasar_alokasi ? 1 : 0;
        const db = b.dasar_alokasi ? 1 : 0;
        if (db !== da) return db - da;
        return 0;
      });
      
      // Deduplikasi berdasarkan kode UK saja (bukan nama lengkap)
      const seen = new Map<string, DistribusiKeduaRow>();
      for (const row of sorted) {
        const kode = row._kode_uk || '';
        if (!seen.has(kode)) {
          // Ambil yang paling BARU per kode UK (sudah diprioritaskan oleh sort di atas)
          // Hapus field _kode_uk sebelum menyimpan
          const { _kode_uk, ...cleanRow } = row;
          seen.set(kode, cleanRow as DistribusiKeduaRow);
        }
      }
      
      const deduplicated = Array.from(seen.values());
      console.log('Deduplicated data (latest per unit):', deduplicated.length, 'records');
      
      // Set data rows - hanya unit kerja pusat biaya
      setRows(deduplicated as DistribusiKeduaRow[]);

      // Ambil daftar unit kerja untuk filter (hanya pusat biaya)
      const unitKerjaList = [...new Set(deduplicated.map(item => item.unit_kerja_pusat_biaya).filter(Boolean))] as string[];
      console.log('Unit kerja options (Pusat Biaya only):', unitKerjaList);
      setUnitKerjaOptions(unitKerjaList);
      
      toast({
        title: "Berhasil",
        description: `Data terbaru berhasil dimuat: ${deduplicated.length} unit kerja pusat biaya untuk tahun ${tahun}`,
      });
    } catch (err: any) {
      console.error('Error in fetchRows:', err);
      const errorMessage = err.message || String(err) || 'Terjadi kesalahan saat memuat data';
      setError(errorMessage);
      toast({ 
        title: "Gagal memuat data", 
        description: `${errorMessage}. Silakan coba lagi atau hubungi administrator jika masalah berlanjut.`, 
        variant: "destructive" 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadReport = async () => {
    if (filteredRows.length === 0) {
      toast({
        title: "Tidak ada data",
        description: "Belum ada data untuk diunduh.",
        variant: "destructive",
      });
      return;
    }

    try {
      setDownloadingReport(true);

      const unitKerjaLabel = selectedUnitKerja ? `Unit ${selectedUnitKerja}` : "Semua Unit Kerja";
      const subtitleParts = [`Tahun ${tahun}`, unitKerjaLabel];

      const records = filteredRows.map((row) => {
        const record: Record<string, string | number> = {
          "Unit Kerja (Pusat Biaya)": row.unit_kerja_pusat_biaya || "",
          "Biaya Alokasi I": Math.round(row.biaya_alokasi_i ?? 0),
          "Dasar Alokasi": row.dasar_alokasi || "",
          "Keterangan": row.keterangan || "",
          "Audit Check": row.audit_check || "",
        };

        for (let i = 37; i <= 77; i++) {
          const code = `UK${i.toString().padStart(3, "0")}`;
          const columnKey = getColumnName(i);
          record[code] = Math.round(Number((row as any)[columnKey] ?? 0));
        }

        record["Total Alokasi Biaya Kedua"] = Math.round(getRowTotalAlokasiKeduaAdjusted(row));
        record["Selisih Pembulatan"] = Math.round(Number(row.selisih_pembulatan ?? getRowSelisih(row)));
        record["Total Alokasi I (DB)"] = Math.round(row.total_alokasi_i ?? row.biaya_alokasi_i ?? 0);
        record["Tahun"] = row.tahun ?? tahun;
        record["Updated At"] = row.updated_at || "";

        return record;
      });

      await downloadReport({
        title: "Laporan Distribusi Biaya Kedua",
        subtitle: subtitleParts.filter(Boolean).join(" • "),
        filename: `distribusi_biaya_kedua_${tahun}${selectedUnitKerja ? `_${selectedUnitKerja.replace(/[^a-zA-Z0-9]/g, "_")}` : ""}`,
        records,
        orientation: "landscape",
      });

      toast({
        title: "Berhasil",
        description: `Laporan berhasil disiapkan untuk ${filteredRows.length} baris data`,
      });
    } catch (error: any) {
      console.error("Gagal mengunduh laporan distribusi biaya kedua:", error);
      toast({
        title: "Gagal mengunduh",
        description: error?.message || String(error),
        variant: "destructive",
      });
    } finally {
      setDownloadingReport(false);
    }
  };


  // Loading state
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-12">
        <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
        <p className="text-muted-foreground">Memuat data distribusi biaya kedua...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Distribusi Biaya Kedua</h1>
      </div>
          
      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
          </div>
      )}

      <div className="flex flex-wrap items-center gap-2 mt-2">
        <Button
          variant="outline"
          onClick={() => setShowFilters((prev) => !prev)}
          className="min-w-[110px] border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
        >
          Filter
        </Button>
        <Button
          onClick={() => {
            void handleDownloadReport();
          }}
          disabled={downloadingReport}
          className="bg-emerald-600 hover:bg-emerald-700 text-white disabled:bg-emerald-400 disabled:cursor-not-allowed"
        >
          {downloadingReport ? (
            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Download className="h-4 w-4 mr-2" />
          )}
          {downloadingReport ? "Menyiapkan..." : "Unduh Laporan"}
        </Button>
        <Button
          className="bg-blue-600 text-white hover:bg-blue-700 disabled:bg-blue-300 disabled:text-white/80"
          onClick={fetchRows}
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Perbarui Data
        </Button>
      </div>

      {showFilters && (
        <Card>
          <CardContent>
            <div className="flex flex-wrap items-end gap-3">
              <div className="flex flex-col gap-2 w-[120px]">
                <Label htmlFor="tahun">Tahun</Label>
                <Input
                  id="tahun"
                  type="number"
                  value={tahun}
                  min={2020}
                  max={2035}
                  onChange={(e) => setTahun(parseInt(e.target.value) || tahun)}
                />
              </div>
              <div className="flex flex-col gap-2 min-w-[220px]">
                <Label htmlFor="unit-kerja">Unit Kerja Pusat Biaya</Label>
                <select
                  id="unit-kerja"
                  value={selectedUnitKerja}
                  onChange={(e) => setSelectedUnitKerja(e.target.value)}
                  className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-sky-500"
                >
                  <option value="">Semua Unit Kerja</option>
                  {unitKerjaOptions.map((unit) => (
                    <option key={unit} value={unit}>
                      {unit}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-[#0f766e]">
                <TableRow className="bg-[#0f766e] hover:bg-[#0f766e]">
                  <TableHead className="min-w-[200px] text-white">Unit Kerja (Pusat Biaya)</TableHead>
                  <TableHead className="min-w-[140px] text-right text-white">Biaya Alokasi I</TableHead>
                  <TableHead className="min-w-[120px] text-white">Dasar Alokasi</TableHead>
                  <TableHead className="min-w-[120px] text-white">Status</TableHead>
                  {Array.from({ length: 77 - 37 + 1 }, (_, idx) => {
                    const ukCode = `UK${(37 + idx).toString().padStart(3, '0')}`;
                    return (
                      <TableHead key={ukCode} className="min-w-[110px] text-right text-white">
                        {ukCode}
                      </TableHead>
                    );
                  })}
                  <TableHead className="min-w-[140px] text-right text-white">Total Alokasi Biaya Kedua</TableHead>
                  <TableHead className="min-w-[120px] text-right text-white">Selisih</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRows.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{r.unit_kerja_pusat_biaya}</TableCell>
                    <TableCell className="text-right">{(r.biaya_alokasi_i ?? 0).toLocaleString("id-ID")}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{r.dasar_alokasi || '-'}</Badge>
                      {r.updated_at && (
                        <div className="text-[10px] text-muted-foreground">upd: {new Date(r.updated_at).toLocaleString("id-ID")}</div>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={
                          r.audit_check === 'OK'
                            ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
                            : 'bg-red-100 text-red-700 border-red-200'
                        }
                      >
                        {r.audit_check || 'Unknown'}
                      </Badge>
                    </TableCell>
                    {/* Render kolom UK037-UK077 dengan format yang konsisten untuk semua baris */}
                    {Array.from({ length: 77 - 37 + 1 }, (_, idx) => {
                      const col = getColumnName(37 + idx);
                      const val = getRoundedCellValue(r, col);
                      return (
                        <TableCell key={col} className="text-right">{Math.round(val).toLocaleString("id-ID")}</TableCell>
                      );
                    })}
                    {/* Tampilkan total sebagai penjumlahan UK037-UK077 (pembulatan per kolom) */}
                    <TableCell className="text-right font-medium">{Math.round(getRowTotalAlokasiKeduaAdjusted(r)).toLocaleString("id-ID")}</TableCell>
                    {/* Tampilkan selisih dari DB bila ada */}
                    <TableCell className="text-right font-medium">
                      {Math.round(Number(r.selisih_pembulatan ?? ((r.biaya_alokasi_i ?? 0) - getRowTotalAlokasiKeduaAdjusted(r)))).toLocaleString("id-ID")}
                    </TableCell>
                  </TableRow>
                ))}
                {filteredRows.length === 0 && !loading && (
                  <TableRow>
                    <TableCell colSpan={77 - 37 + 5} className="text-center py-8 text-muted-foreground">
                      <div className="flex flex-col items-center gap-2">
                        <FileText className="h-8 w-8 text-muted-foreground" />
                        <p>Tidak ada data untuk ditampilkan</p>
                        <p className="text-sm">Periksa filter tahun ({tahun}) atau unit kerja yang dipilih</p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
                <TableRow className="bg-gray-50 border-t-2 border-gray-300">
                  <TableCell className="font-semibold">Total</TableCell>
                  <TableCell className="text-right font-semibold">{filteredRows.reduce((sum, r) => sum + (r.biaya_alokasi_i ?? 0), 0).toLocaleString("id-ID")}</TableCell>
                  <TableCell />
                  <TableCell />
                  {/* Total untuk setiap kolom UK - menggunakan total yang SUDAH disesuaikan */}
                  {Array.from({ length: 77 - 37 + 1 }, (_, idx) => {
                    const col = getColumnName(37 + idx);
                    const total = columnTotalsAdjusted[col] ?? 0;
                    return (
                      <TableCell key={col} className="text-right font-semibold">{Math.round(total).toLocaleString("id-ID")}</TableCell>
                    );
                  })}
                  {/* Grand total (setelah pembulatan per kolom) */}
                  <TableCell className="text-right font-semibold">{Math.round(grandTotalAlokasiKeduaAdjusted).toLocaleString("id-ID")}</TableCell>
                  {/* Total selisih dari DB jika tersedia */}
                  <TableCell className="text-right font-semibold">{Math.round(totalSelisihFromDB).toLocaleString("id-ID")}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


