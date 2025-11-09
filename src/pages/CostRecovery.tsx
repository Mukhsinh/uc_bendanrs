import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { RefreshCw, Calculator } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis, ComposedChart, Line } from "recharts";
import { toast } from "sonner";

type CostRecoveryRow = {
  unit_kerja_id: string;
  kode_unit_kerja: string;
  nama_unit_kerja: string;
  tahun: number;
  total_biaya: number | null;
  total_pendapatan: number | null;
  pendapatan_umum: number | null;
  pendapatan_bpjs: number | null;
  "Proyeksi JP": number | null;
  "total biaya dengan JP": number | null;
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value || 0);

const CostRecovery: React.FC = () => {
  const [tahun, setTahun] = useState<number>(2025);
  const [unitOptions, setUnitOptions] = useState<{ id: string; kode: string; nama: string }[]>([]);
  const [unitFilter, setUnitFilter] = useState<string>("all");
  const [revenueFilter, setRevenueFilter] = useState<string>("total");
  const [rows, setRows] = useState<CostRecoveryRow[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [updating, setUpdating] = useState<boolean>(false);
  
  // Fungsi untuk update distribusi biaya pertama dengan JP
  const handleUpdateDistribusiBiaya = async () => {
    if (!confirm("Apakah Anda yakin ingin memperbarui data distribusi biaya pertama dengan JP? Proses ini akan melakukan recalculate dan rebuild table.")) {
      return;
    }
    
    try {
      setUpdating(true);
      
      // Ambil user_id dari session
      const { data: { user } } = await supabase.auth.getUser();
      const userId = user?.id;
      
      if (!userId) {
        toast.error('User tidak ditemukan. Silakan login kembali.');
        return;
      }
      
      toast.info('Memperbarui data distribusi biaya pertama dengan JP...');
      
      // Panggil fungsi RPC untuk update
      const { data, error } = await supabase.rpc('api_update_distribusi_biaya_pertama_dengan_jp', {
        p_tahun: tahun,
        p_user_id: userId
      });
      
      if (error) {
        console.error('Error updating:', error);
        toast.error(`Gagal memperbarui: ${error.message}`);
        return;
      }
      
      if (data && !data.success) {
        toast.error(`Gagal memperbarui: ${data.message || 'Unknown error'}`);
        return;
      }
      
      const execTime = data?.execution_time_seconds?.toFixed(2) || '0';
      toast.success(
        `✅ Data distribusi biaya pertama dengan JP berhasil diperbarui!\n` +
        `📊 ${data?.recalculate_rows || 0} rows dihitung ulang\n` +
        `⏱️ Waktu eksekusi: ${execTime}s\n\n` +
        `Silakan refresh halaman untuk melihat data terbaru.`
      );
      
      // Refresh data cost recovery setelah update
      // Data akan otomatis ter-refresh karena useEffect yang bergantung pada tahun
      // Tapi karena distribusi biaya pertama tidak langsung mempengaruhi cost recovery,
      // kita tidak perlu refresh rows di sini
      
    } catch (error: any) {
      console.error('Error updating distribusi biaya:', error);
      toast.error(`Terjadi kesalahan: ${error.message || 'Unknown error'}`);
    } finally {
      setUpdating(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      
      try {
        // Ambil data unit kerja pusat pendapatan
        const { data: units, error: unitsError } = await supabase
          .from("unit_kerja")
          .select("id, kode, nama, kategori")
          .eq("kategori", "Pusat Pendapatan");

        if (unitsError) {
          console.error("Error loading units:", unitsError);
        }

        setUnitOptions((units || []).map((u: any) => ({ id: u.id, kode: u.kode, nama: u.nama })));

        // Ambil data total biaya dari distribusi_biaya_rekap (baris "Total Biaya")
        // Ini adalah sumber data yang benar untuk total biaya Cost Recovery
        const { data: distribusiRows, error: distribusiError } = await supabase
          .from("distribusi_biaya_rekap")
          .select("*")
          .eq("biaya", "Total Biaya")
          .eq("tahun", tahun);

        if (distribusiError) {
          console.error("Error loading distribusi_biaya_rekap:", distribusiError);
        }

        // Ambil data pendapatan dari data_pendapatan (sumber data yang benar)
        // Ini adalah tabel yang berisi data pendapatan_umum dan pendapatan_bpjs
        const { data: pendapatanRows, error: pendapatanError } = await supabase
          .from("data_pendapatan")
          .select("unit_kerja_id, kode_unit_kerja, nama_unit_kerja, pendapatan_umum, pendapatan_bpjs, tahun")
          .eq("tahun", tahun);

        if (pendapatanError) {
          console.error("Error loading data_pendapatan:", pendapatanError);
        }

        // Mapping kolom distribusi_biaya_rekap ke kode unit kerja
        const ukColumnMapping: { [key: string]: string } = {
          'UK037': 'uk037_ambulance',
          'UK038': 'uk038_laboratorium_pk_pa',
          'UK039': 'uk039_radiologi',
          'UK040': 'uk040_farmasi',
          'UK041': 'uk041_rehab_medik',
          'UK042': 'uk042_gizi_dapur',
          'UK043': 'uk043_laundry_cssd',
          'UK044': 'uk044_bdrs',
          'UK045': 'uk045_cathlab',
          'UK046': 'uk046_terang_bulan_vip_vvip',
          'UK047': 'uk047_truntum',
          'UK048': 'uk048_sekarjagat',
          'UK049': 'uk049_jlamprang',
          'UK050': 'uk050_nifas',
          'UK051': 'uk051_perinatologi',
          'UK052': 'uk052_buketan',
          'UK053': 'uk053_icu_picu_nicu',
          'UK054': 'uk054_vk',
          'UK055': 'uk055_igd_ponek',
          'UK056': 'uk056_klinik_kebid_kandungan',
          'UK057': 'uk057_klinik_bedah_mulut',
          'UK058': 'uk058_klinik_syaraf',
          'UK059': 'uk059_klinik_bedah_syaraf',
          'UK060': 'uk060_klinik_bedah_digestif',
          'UK061': 'uk061_klinik_bedah_umum',
          'UK062': 'uk062_klinik_anak',
          'UK063': 'uk063_klinik_penyakit_dalam',
          'UK064': 'uk064_klinik_mata',
          'UK065': 'uk065_klinik_kulit_kelamin',
          'UK066': 'uk066_klinik_tht',
          'UK067': 'uk067_klinik_gigi',
          'UK068': 'uk068_klinik_jantung',
          'UK069': 'uk069_klinik_dot_vct_cst',
          'UK070': 'uk070_klinik_paru',
          'UK071': 'uk071_klinik_orthopedi',
          'UK072': 'uk072_klinik_jiwa',
          'UK073': 'uk073_klinik_parikesit',
          'UK074': 'uk074_ibs',
          'UK075': 'uk075_pemulasaran_jenazah',
          'UK076': 'uk076_hemodialisis',
          'UK077': 'uk077_unit_diklat'
        };

        // Buat mapping total biaya dari distribusi_biaya_rekap
        const totalBiayaMap = new Map<string, number>();
        if (distribusiRows && distribusiRows.length > 0) {
          const distribusiRow = distribusiRows[0]; // Ambil baris "Total Biaya"
          Object.entries(ukColumnMapping).forEach(([kodeUk, kolomDb]) => {
            const nilai = distribusiRow[kolomDb] || 0;
            totalBiayaMap.set(kodeUk, Number(nilai));
          });
        }

        // Buat mapping pendapatan dari data_pendapatan
        const revenueMap = new Map<string, any>();
        (pendapatanRows || []).forEach((r: any) => {
          revenueMap.set(r.kode_unit_kerja, {
            umum: parseFloat(r.pendapatan_umum || '0'),
            bpjs: parseFloat(r.pendapatan_bpjs || '0'),
            total: parseFloat(r.pendapatan_umum || '0') + parseFloat(r.pendapatan_bpjs || '0')
          });
        });

        // Gabungkan data untuk setiap unit kerja
        const merged: CostRecoveryRow[] = (units || [])
          .filter((unit: any) => ukColumnMapping[unit.kode]) // Hanya unit kerja yang ada di distribusi_biaya_rekap
          .map((unit: any) => {
            const totalBiaya = totalBiayaMap.get(unit.kode) || 0;
            const revenue = revenueMap.get(unit.kode) || { umum: 0, bpjs: 0, total: 0 };
            
            // Debug log untuk memastikan data sinkron
            console.log(`Unit ${unit.kode}: Biaya=${totalBiaya}, Pendapatan Umum=${revenue.umum}, Pendapatan BPJS=${revenue.bpjs}`);
            
            return {
              unit_kerja_id: unit.id,
              kode_unit_kerja: unit.kode,
              nama_unit_kerja: unit.nama,
              tahun: tahun,
              total_biaya: totalBiaya, // Dari distribusi_biaya_rekap baris "Total Biaya"
              total_pendapatan: revenue.total,
              pendapatan_umum: revenue.umum,
              pendapatan_bpjs: revenue.bpjs,
              "Proyeksi JP": null,
              "total biaya dengan JP": null,
            } as CostRecoveryRow;
          });

        console.log(`Cost Recovery data loaded: ${merged.length} units, tahun ${tahun}`);
        console.log(`Distribusi biaya rows: ${distribusiRows?.length || 0}`);
        console.log(`Pendapatan rows: ${pendapatanRows?.length || 0}`);
        
        setRows(merged);
      } catch (error) {
        console.error("Error in init:", error);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [tahun]);

  const filtered = useMemo(() => {
    if (unitFilter === "all") return rows;
    return rows.filter((r) => r.unit_kerja_id === unitFilter);
  }, [rows, unitFilter]);

  const chartData = useMemo(
    () =>
      filtered.map((r) => {
        let pendapatanValue = 0;
        switch (revenueFilter) {
          case "umum":
            pendapatanValue = r.pendapatan_umum || 0;
            break;
          case "bpjs":
            pendapatanValue = r.pendapatan_bpjs || 0;
            break;
          case "total":
          default:
            pendapatanValue = r.total_pendapatan || 0;
            break;
        }

        const proyeksi = r["Proyeksi JP"] ?? Math.round((r.total_pendapatan || 0) * 0.4);
        const totalBiayaJp = r["total biaya dengan JP"] ?? Math.round((r.total_biaya || 0) + proyeksi);

        return {
          unit: `${r.kode_unit_kerja} - ${r.nama_unit_kerja}`,
          pendapatan: pendapatanValue,
          pendapatanUmum: Number(r.pendapatan_umum) || 0,
          pendapatanBpjs: Number(r.pendapatan_bpjs) || 0,
          biaya: (r.total_biaya || 0),
          proyeksiJP: proyeksi,
          totalBiayaDenganJP: totalBiayaJp,
        };
      }),
    [filtered, revenueFilter],
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Cost Recovery</h1>
          <p className="text-sm text-muted-foreground">Perbandingan total pendapatan vs total biaya per unit kerja (Pusat Pendapatan). Total biaya dari distribusi_biaya_rekap baris "Total Biaya", pendapatan dari data_pendapatan</p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={handleUpdateDistribusiBiaya}
            disabled={updating}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {updating ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                Memperbarui...
              </>
            ) : (
              <>
                <Calculator className="h-4 w-4 mr-2" />
                Perbarui Total Biaya
              </>
            )}
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filter</CardTitle>
          <CardDescription>Pilih tahun, unit kerja, dan jenis pendapatan</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Tahun</label>
              <Select value={tahun.toString()} onValueChange={(v) => setTahun(parseInt(v))}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih tahun" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 5 }, (_, i) => {
                    const y = new Date().getFullYear() - i;
                    return (
                      <SelectItem key={y} value={y.toString()}>
                        {y}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Jenis Pendapatan</label>
              <Select value={revenueFilter} onValueChange={setRevenueFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih jenis pendapatan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="total">Total Pendapatan</SelectItem>
                  <SelectItem value="umum">Pendapatan Umum</SelectItem>
                  <SelectItem value="bpjs">Pendapatan BPJS</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-2">
              <label className="text-sm font-medium mb-2 block">Unit Kerja</label>
              <Select value={unitFilter} onValueChange={setUnitFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih unit kerja" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Unit</SelectItem>
                  {unitOptions.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.kode} - {u.nama}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Informasi Data Status */}
      {!loading && (
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span>Unit Kerja: {rows.length}</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span>Dengan Data Biaya: {rows.filter(r => r.total_biaya > 0).length}</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                <span>Dengan Data Pendapatan: {rows.filter(r => r.total_pendapatan > 0).length}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="comparison" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="comparison">Perbandingan Pendapatan vs Biaya</TabsTrigger>
          <TabsTrigger value="detailed">Detail Biaya dengan JP</TabsTrigger>
        </TabsList>
        
        <TabsContent value="comparison">
          <Card>
            <CardHeader>
              <CardTitle>
                Grafik Perbandingan {revenueFilter === "total" ? "Pendapatan (Umum & BPJS)" : revenueFilter === "umum" ? "Pendapatan Umum" : "Pendapatan BPJS"} vs Total Biaya dengan JP
              </CardTitle>
              <CardDescription>
                {revenueFilter === "total" ? (
                  <>Perbandingan antara Pendapatan Umum (biru muda) dan Pendapatan BPJS (biru tua) dengan Total Biaya yang sudah termasuk Proyeksi JP. 
                  Total Biaya dengan JP terdiri dari Total Biaya (merah) + Proyeksi JP (orange).</>
                ) : (
                  <>Perbandingan antara {revenueFilter === "umum" ? "Pendapatan Umum" : "Pendapatan BPJS"} dengan Total Biaya yang sudah termasuk Proyeksi JP. 
                  Total Biaya dengan JP terdiri dari Total Biaya (merah) + Proyeksi JP (orange).</>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="h-96 flex items-center justify-center text-sm text-muted-foreground">Memuat data…</div>
              ) : chartData.length === 0 ? (
                <div className="h-96 flex items-center justify-center text-sm text-muted-foreground">Tidak ada data</div>
              ) : (
                <div className="h-96">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="unit" angle={-45} textAnchor="end" height={100} fontSize={12} />
                      <YAxis tickFormatter={(v) => `${(v / 1_000_000).toFixed(0)}M`} fontSize={12} />
                      <Tooltip formatter={(v: any) => formatCurrency(Number(v))} />
                      <Legend />
                      {revenueFilter === "total" ? (
                        <>
                          <Bar dataKey="pendapatanUmum" name="Pendapatan Umum" fill="#3b82f6" radius={[2,2,0,0]} />
                          <Bar dataKey="pendapatanBpjs" name="Pendapatan BPJS" fill="#1d4ed8" radius={[2,2,0,0]} />
                        </>
                      ) : (
                        <Bar dataKey="pendapatan" name={revenueFilter === "umum" ? "Pendapatan Umum" : "Pendapatan BPJS"} fill="#0ea5e9" radius={[2,2,0,0]} />
                      )}
                      <Bar dataKey="totalBiayaDenganJP" name="Total Biaya dengan JP" fill="#ef4444" radius={[2,2,0,0]} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="detailed">
          <Card>
            <CardHeader>
              <CardTitle>Grafik Detail Total Biaya dengan JP</CardTitle>
              <CardDescription>
                Breakdown dari Total Biaya dengan JP yang terdiri dari Total Biaya (merah) dan Proyeksi JP (orange).
                {revenueFilter === "total" ? (
                  <> Garis biru muda menunjukkan Pendapatan Umum dan garis biru tua menunjukkan Pendapatan BPJS untuk perbandingan.</>
                ) : (
                  <> Garis biru menunjukkan {revenueFilter === "umum" ? "Pendapatan Umum" : "Pendapatan BPJS"} untuk perbandingan.</>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="h-96 flex items-center justify-center text-sm text-muted-foreground">Memuat data…</div>
              ) : chartData.length === 0 ? (
                <div className="h-96 flex items-center justify-center text-sm text-muted-foreground">Tidak ada data</div>
              ) : (
                <div className="h-96">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="unit" angle={-45} textAnchor="end" height={100} fontSize={12} />
                      <YAxis tickFormatter={(v) => `${(v / 1_000_000).toFixed(0)}M`} fontSize={12} />
                      <Tooltip formatter={(v: any) => formatCurrency(Number(v))} />
                      <Legend />
                      <Bar dataKey="biaya" name="Total Biaya" stackId="biaya" fill="#dc2626" />
                      <Bar dataKey="proyeksiJP" name="Proyeksi JP" stackId="biaya" fill="#ea580c" />
                      {revenueFilter === "total" ? (
                        <>
                          <Line dataKey="pendapatanUmum" name="Pendapatan Umum" stroke="#3b82f6" strokeWidth={2} />
                          <Line dataKey="pendapatanBpjs" name="Pendapatan BPJS" stroke="#1d4ed8" strokeWidth={2} />
                        </>
                      ) : (
                        <Line dataKey="pendapatan" name={revenueFilter === "umum" ? "Pendapatan Umum" : "Pendapatan BPJS"} stroke="#0ea5e9" strokeWidth={3} />
                      )}
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CostRecovery;


2. 