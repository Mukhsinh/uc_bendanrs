import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, ClipboardList, FileText, Pill, Building2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface KalkulasiData {
  jenis_layanan: string;
  biaya_unit: number;
  biaya_distribusi_kedua: number;
  total_biaya_unit: number;
  jumlah_pembagi: number;
  biaya_layanan: number;
  created_at: string;
  updated_at: string;
}

const KalkulasiPendaftaranDanPeresepan = () => {
  const [data, setData] = useState<KalkulasiData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { toast } = useToast();

  const fetchData = async () => {
    try {
      setLoading(true);
      const { data: session } = await supabase.auth.getSession();
      
      if (!session.session?.user.id) {
        throw new Error("User tidak terautentikasi");
      }

      const { data: kalkulasiData, error } = await supabase
        .from("kalkulasi_daftar_dan_resep")
        .select("*")
        .eq("user_id", session.session.user.id)
        .eq("tahun", 2025)
        .order("jenis_layanan");

      if (error) throw error;

      setData(kalkulasiData || []);
    } catch (error: any) {
      console.error("Error fetching data:", error);
      toast({
        title: "Error",
        description: error.message || "Gagal mengambil data kalkulasi",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const refreshData = async () => {
    try {
      setRefreshing(true);
      const { data: session } = await supabase.auth.getSession();
      
      if (!session.session?.user.id) {
        throw new Error("User tidak terautentikasi");
      }

      // Call populate function
      const { error } = await supabase.rpc("populate_kalkulasi_daftar_resep", {
        p_user_id: session.session.user.id,
        p_tahun: 2025,
      });

      if (error) throw error;

      toast({
        title: "Berhasil",
        description: "Data berhasil diperbarui",
      });

      // Refresh display
      await fetchData();
    } catch (error: any) {
      console.error("Error refreshing data:", error);
      toast({
        title: "Error",
        description: error.message || "Gagal memperbarui data",
        variant: "destructive",
      });
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat("id-ID").format(value);
  };

  const getIcon = (jenisLayanan: string) => {
    if (jenisLayanan.includes("Pendaftaran")) {
      return <ClipboardList className="h-5 w-5" />;
    } else if (jenisLayanan.includes("Peresepan")) {
      return <Pill className="h-5 w-5" />;
    }
    return <FileText className="h-5 w-5" />;
  };

  const getBadgeColor = (jenisLayanan: string) => {
    if (jenisLayanan.includes("Rawat Jalan")) {
      return "bg-blue-500 text-white hover:bg-blue-600";
    } else if (jenisLayanan.includes("Rawat Inap")) {
      return "bg-green-500 text-white hover:bg-green-600";
    }
    return "bg-gray-500 text-white";
  };

  const getCardGradient = (jenisLayanan: string) => {
    if (jenisLayanan.includes("Rawat Jalan")) {
      return "from-blue-600 to-blue-700";
    } else if (jenisLayanan.includes("Rawat Inap")) {
      return "from-green-600 to-green-700";
    }
    return "from-teal-600 to-teal-700";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Kalkulasi Pendaftaran dan Peresepan</h1>
          <p className="text-gray-600 mt-1">
            Biaya per layanan pendaftaran dan peresepan untuk Rawat Jalan, Rawat Inap, dan Farmasi
          </p>
        </div>
        <Button
          onClick={refreshData}
          disabled={refreshing}
          className="bg-teal-600 hover:bg-teal-700"
        >
          {refreshing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Memperbarui...
            </>
          ) : (
            <>
              <RefreshCw className="mr-2 h-4 w-4" />
              Perbarui Data
            </>
          )}
        </Button>
      </div>

      {/* Info Card */}
      <Card className="bg-gradient-to-r from-teal-50 to-blue-50 border-teal-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-teal-800">
            <Building2 className="h-5 w-5" />
            Informasi Kalkulasi
          </CardTitle>
          <CardDescription className="text-gray-700">
            Data kalkulasi otomatis berdasarkan biaya unit (TPPRJ, TPPRI, Farmasi), distribusi biaya kedua, 
            dan jumlah kunjungan/lembar resep dari data kegiatan.
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Data Cards */}
      {data.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-gray-400 mb-4" />
            <p className="text-gray-600 text-center">
              Belum ada data kalkulasi. Klik tombol "Perbarui Data" untuk menghitung ulang.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Baris 1: Rawat Jalan */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {data
              .filter((item) => item.jenis_layanan.includes("Rawat Jalan"))
              .sort((a, b) => {
                // Pendaftaran dulu, baru Peresepan
                if (a.jenis_layanan.includes("Pendaftaran")) return -1;
                if (b.jenis_layanan.includes("Pendaftaran")) return 1;
                return 0;
              })
              .map((item, index) => (
                <Card key={index} className="hover:shadow-lg transition-shadow duration-200 border-l-4 border-l-blue-500">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-lg text-blue-700">
                          {getIcon(item.jenis_layanan)}
                        </div>
                        <div>
                          <CardTitle className="text-lg">{item.jenis_layanan}</CardTitle>
                          <Badge className={`mt-1 ${getBadgeColor(item.jenis_layanan)}`}>
                            Rawat Jalan
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Biaya Layanan - Highlight */}
                    <div className={`bg-gradient-to-r ${getCardGradient(item.jenis_layanan)} rounded-lg p-4 text-white`}>
                      <p className="text-sm font-medium text-blue-100 mb-1">Biaya Per Layanan</p>
                      <p className="text-3xl font-bold">{formatCurrency(item.biaya_layanan)}</p>
                    </div>

                    {/* Detail Breakdown */}
                    <div className="space-y-2 bg-gray-50 rounded-lg p-4">
                      <h4 className="text-xs font-semibold text-gray-600 uppercase mb-3">Rincian Kalkulasi</h4>
                      
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Biaya Unit</span>
                        <span className="font-medium text-gray-900">{formatCurrency(item.biaya_unit)}</span>
                      </div>
                      
                      {item.biaya_distribusi_kedua > 0 && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Distribusi Kedua</span>
                          <span className="font-medium text-gray-900">{formatCurrency(item.biaya_distribusi_kedua)}</span>
                        </div>
                      )}
                      
                      <div className="flex justify-between text-sm pt-2 border-t border-gray-200">
                        <span className="text-gray-600 font-medium">Total Biaya Unit</span>
                        <span className="font-semibold text-gray-900">{formatCurrency(item.total_biaya_unit)}</span>
                      </div>
                      
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Jumlah Pembagi</span>
                        <span className="font-medium text-blue-600">{formatNumber(item.jumlah_pembagi)}</span>
                      </div>
                    </div>

                    {/* Footer Info */}
                    <div className="text-xs text-gray-500 pt-2 border-t">
                      <div className="flex justify-between">
                        <span>Diperbarui: {new Date(item.updated_at).toLocaleString("id-ID")}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>

          {/* Baris 2: Rawat Inap */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {data
              .filter((item) => item.jenis_layanan.includes("Rawat Inap"))
              .sort((a, b) => {
                // Pendaftaran dulu, baru Peresepan
                if (a.jenis_layanan.includes("Pendaftaran")) return -1;
                if (b.jenis_layanan.includes("Pendaftaran")) return 1;
                return 0;
              })
              .map((item, index) => (
                <Card key={index} className="hover:shadow-lg transition-shadow duration-200 border-l-4 border-l-green-500">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-100 rounded-lg text-green-700">
                          {getIcon(item.jenis_layanan)}
                        </div>
                        <div>
                          <CardTitle className="text-lg">{item.jenis_layanan}</CardTitle>
                          <Badge className={`mt-1 ${getBadgeColor(item.jenis_layanan)}`}>
                            Rawat Inap
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Biaya Layanan - Highlight */}
                    <div className={`bg-gradient-to-r ${getCardGradient(item.jenis_layanan)} rounded-lg p-4 text-white`}>
                      <p className="text-sm font-medium text-green-100 mb-1">Biaya Per Layanan</p>
                      <p className="text-3xl font-bold">{formatCurrency(item.biaya_layanan)}</p>
                    </div>

                    {/* Detail Breakdown */}
                    <div className="space-y-2 bg-gray-50 rounded-lg p-4">
                      <h4 className="text-xs font-semibold text-gray-600 uppercase mb-3">Rincian Kalkulasi</h4>
                      
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Biaya Unit</span>
                        <span className="font-medium text-gray-900">{formatCurrency(item.biaya_unit)}</span>
                      </div>
                      
                      {item.biaya_distribusi_kedua > 0 && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Distribusi Kedua</span>
                          <span className="font-medium text-gray-900">{formatCurrency(item.biaya_distribusi_kedua)}</span>
                        </div>
                      )}
                      
                      <div className="flex justify-between text-sm pt-2 border-t border-gray-200">
                        <span className="text-gray-600 font-medium">Total Biaya Unit</span>
                        <span className="font-semibold text-gray-900">{formatCurrency(item.total_biaya_unit)}</span>
                      </div>
                      
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Jumlah Pembagi</span>
                        <span className="font-medium text-green-600">{formatNumber(item.jumlah_pembagi)}</span>
                      </div>
                    </div>

                    {/* Footer Info */}
                    <div className="text-xs text-gray-500 pt-2 border-t">
                      <div className="flex justify-between">
                        <span>Diperbarui: {new Date(item.updated_at).toLocaleString("id-ID")}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        </div>
      )}

    </div>
  );
};

export default KalkulasiPendaftaranDanPeresepan;

