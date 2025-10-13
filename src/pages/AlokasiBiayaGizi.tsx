import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Download, Edit, Save, X, Calculator, RefreshCw } from "lucide-react";
import * as XLSX from 'xlsx';

interface AlokasiBiayaGiziData {
  id: string;
  user_id: string;
  tahun: number;
  kode_unit_kerja: string;
  nama_unit_kerja: string;
  auc_gizi_vvip: number;
  auc_gizi_vip: number;
  auc_gizi_i: number;
  auc_gizi_ii: number;
  auc_gizi_iii: number;
  hari_rawat_vvip: number;
  hari_rawat_vip: number;
  hari_rawat_i: number;
  hari_rawat_ii: number;
  hari_rawat_iii: number;
  jumlah_porsi_pasien_vvip: number;
  jumlah_porsi_pasien_vip: number;
  jumlah_porsi_pasien_i: number;
  jumlah_porsi_pasien_ii: number;
  jumlah_porsi_pasien_iii: number;
  jumlah_kali_porsi_vvip: number;
  jumlah_kali_porsi_vip: number;
  jumlah_kali_porsi_i: number;
  jumlah_kali_porsi_ii: number;
  jumlah_kali_porsi_iii: number;
  total_gizi: number;
  // Kolom baru untuk tempat tidur
  tempat_tidur_svip: number;
  tempat_tidur_vip: number;
  tempat_tidur_i: number;
  tempat_tidur_ii: number;
  tempat_tidur_iii: number;
  // Kolom baru untuk jumlah porsi
  jumlah_porsi_svip: number;
  jumlah_porsi_vip: number;
  jumlah_porsi_i: number;
  jumlah_porsi_ii: number;
  jumlah_porsi_iii: number;
  // Kolom baru untuk kamar luas
  kamar_luas_svip: number;
  kamar_luas_vip: number;
  kamar_luas_i: number;
  kamar_luas_ii: number;
  kamar_luas_iii: number;
  created_at: string;
  updated_at: string;
}

interface EditFormData {
  id: string;
  kode_unit_kerja: string;
  nama_unit_kerja: string;
  hari_rawat_vvip: number;
  hari_rawat_vip: number;
  hari_rawat_i: number;
  hari_rawat_ii: number;
  hari_rawat_iii: number;
}

const AlokasiBiayaGizi: React.FC = () => {
  const [data, setData] = useState<AlokasiBiayaGiziData[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [tahun, setTahun] = useState<number>(new Date().getFullYear());
  const [editDialog, setEditDialog] = useState<boolean>(false);
  const [editForm, setEditForm] = useState<EditFormData | null>(null);
  const [saving, setSaving] = useState<boolean>(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, [tahun]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Error",
          description: "User tidak terautentikasi",
          variant: "destructive",
        });
        return;
      }

      // Ambil unit kerja yang ada di jenis_tindakan_inap (tanpa filter user_id)
      const { data: unitKerjaInJenisTindakan, error: errorUnitKerja } = await supabase
        .from("jenis_tindakan_inap")
        .select("kode_unit_kerja");

      if (errorUnitKerja) throw errorUnitKerja;

      const kodeUnitKerjaList = unitKerjaInJenisTindakan?.map(item => item.kode_unit_kerja) || [];
      
      // Hapus duplikasi
      const uniqueKodeUnitKerjaList = [...new Set(kodeUnitKerjaList)];

      if (uniqueKodeUnitKerjaList.length === 0) {
        setData([]);
        toast({
          title: "Info",
          description: "Tidak ada unit kerja yang memiliki tindakan inap untuk tahun ini.",
        });
        return;
      }

      // Ambil data dari data_akomodasi_inap yang sesuai dengan unit kerja di jenis_tindakan_inap
      // Tanpa filter user_id karena data master memiliki user_id = NULL
      const { data: alokasiData, error } = await supabase
        .from("data_akomodasi_inap")
        .select("*")
        .eq("tahun", tahun)
        .in("kode_unit_kerja", uniqueKodeUnitKerjaList)
        .order("kode_unit_kerja");

      if (error) throw error;

      setData(alokasiData || []);
      
      if (!alokasiData || alokasiData.length === 0) {
        toast({
          title: "Info",
          description: `Tidak ada data alokasi biaya gizi untuk tahun ${tahun}.`,
        });
      }
    } catch (error: any) {
      console.error("Error fetching data:", error);
      toast({
        title: "Error",
        description: error.message || "Gagal mengambil data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (row: AlokasiBiayaGiziData) => {
    setEditForm({
      id: row.id,
      kode_unit_kerja: row.kode_unit_kerja,
      nama_unit_kerja: row.nama_unit_kerja,
      hari_rawat_vvip: row.hari_rawat_vvip,
      hari_rawat_vip: row.hari_rawat_vip,
      hari_rawat_i: row.hari_rawat_i,
      hari_rawat_ii: row.hari_rawat_ii,
      hari_rawat_iii: row.hari_rawat_iii,
    });
    setEditDialog(true);
  };

  const handleSave = async () => {
    if (!editForm) return;

    try {
      setSaving(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User tidak terautentikasi");

      // Verifikasi bahwa unit kerja ada di jenis_tindakan_inap (tanpa filter user_id)
      const { data: unitKerjaExists, error: checkError } = await supabase
        .from("jenis_tindakan_inap")
        .select("kode_unit_kerja")
        .eq("kode_unit_kerja", editForm.kode_unit_kerja)
        .single();

      if (checkError || !unitKerjaExists) {
        throw new Error("Unit kerja tidak ditemukan dalam tindakan inap");
      }

      // Update hari rawat di data_kegiatan
      const { error: updateError } = await supabase
        .from("data_kegiatan")
        .update({
          "Hari_Rawat_SVIP": editForm.hari_rawat_vvip,
          "Hari_Rawat_VIP": editForm.hari_rawat_vip,
          "Hari_Rawat_I": editForm.hari_rawat_i,
          "Hari_Rawat_II": editForm.hari_rawat_ii,
          "Hari_Rawat_III": editForm.hari_rawat_iii,
        })
        .eq("Kode_UK", editForm.kode_unit_kerja)
        .eq("tahun", tahun);

      if (updateError) throw updateError;

      // Trigger akan otomatis update data_akomodasi_inap
      toast({
        title: "Berhasil",
        description: "Data hari rawat berhasil diperbarui. Perhitungan otomatis akan dijalankan.",
      });

      setEditDialog(false);
      setEditForm(null);
      
      // Refresh data setelah update
      setTimeout(() => {
        fetchData();
      }, 1000);

    } catch (error: any) {
      console.error("Error saving data:", error);
      toast({
        title: "Error",
        description: error.message || "Gagal menyimpan data",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const exportToExcel = () => {
    if (data.length === 0) {
      toast({
        title: "Info",
        description: "Tidak ada data untuk diekspor",
        variant: "destructive",
      });
      return;
    }

    const exportData = data.map(row => ({
      "Kode Unit Kerja": row.kode_unit_kerja,
      "Nama Unit Kerja": row.nama_unit_kerja,
      // Data tempat tidur
      "Tempat Tidur SVIP": row.tempat_tidur_svip,
      "Tempat Tidur VIP": row.tempat_tidur_vip,
      "Tempat Tidur I": row.tempat_tidur_i,
      "Tempat Tidur II": row.tempat_tidur_ii,
      "Tempat Tidur III": row.tempat_tidur_iii,
      // Data jumlah porsi
      "Jumlah Porsi SVIP": row.jumlah_porsi_svip,
      "Jumlah Porsi VIP": row.jumlah_porsi_vip,
      "Jumlah Porsi I": row.jumlah_porsi_i,
      "Jumlah Porsi II": row.jumlah_porsi_ii,
      "Jumlah Porsi III": row.jumlah_porsi_iii,
      // Data kamar luas
      "Kamar Luas SVIP": row.kamar_luas_svip,
      "Kamar Luas VIP": row.kamar_luas_vip,
      "Kamar Luas I": row.kamar_luas_i,
      "Kamar Luas II": row.kamar_luas_ii,
      "Kamar Luas III": row.kamar_luas_iii,
      // Data hari rawat
      "Hari Rawat VVIP": row.hari_rawat_vvip,
      "Hari Rawat VIP": row.hari_rawat_vip,
      "Hari Rawat I": row.hari_rawat_i,
      "Hari Rawat II": row.hari_rawat_ii,
      "Hari Rawat III": row.hari_rawat_iii,
      // Data porsi pasien (computed)
      "Jumlah Porsi Pasien VVIP": row.jumlah_porsi_pasien_vvip,
      "Jumlah Porsi Pasien VIP": row.jumlah_porsi_pasien_vip,
      "Jumlah Porsi Pasien I": row.jumlah_porsi_pasien_i,
      "Jumlah Porsi Pasien II": row.jumlah_porsi_pasien_ii,
      "Jumlah Porsi Pasien III": row.jumlah_porsi_pasien_iii,
      // Data AUC gizi
      "AUC Gizi VVIP": row.auc_gizi_vvip,
      "AUC Gizi VIP": row.auc_gizi_vip,
      "AUC Gizi I": row.auc_gizi_i,
      "AUC Gizi II": row.auc_gizi_ii,
      "AUC Gizi III": row.auc_gizi_iii,
      // Data kali porsi (computed)
      "Jumlah Kali Porsi VVIP": row.jumlah_kali_porsi_vvip,
      "Jumlah Kali Porsi VIP": row.jumlah_kali_porsi_vip,
      "Jumlah Kali Porsi I": row.jumlah_kali_porsi_i,
      "Jumlah Kali Porsi II": row.jumlah_kali_porsi_ii,
      "Jumlah Kali Porsi III": row.jumlah_kali_porsi_iii,
      "Total Gizi": row.total_gizi,
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Alokasi Biaya Gizi");

    const fileName = `data_akomodasi_inap_${tahun}_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);

    toast({
      title: "Berhasil",
      description: `Laporan berhasil diekspor sebagai ${fileName}`,
    });
  };

  const totalGizi = data.reduce((sum, row) => sum + row.total_gizi, 0);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Data Akomodasi Inap</h1>
          <p className="text-muted-foreground">
            Kelola data akomodasi inap per unit kerja rawat inap
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={fetchData}
            variant="outline"
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            onClick={exportToExcel}
            disabled={loading || data.length === 0}
          >
            <Download className="h-4 w-4 mr-2" />
            Unduh Laporan
          </Button>
        </div>
      </div>

      {/* Filter Tahun */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Filter Data
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Label htmlFor="tahun">Tahun:</Label>
            <Input
              id="tahun"
              type="number"
              value={tahun}
              onChange={(e) => setTahun(parseInt(e.target.value))}
              className="w-32"
              min="2020"
              max="2030"
            />
            <Badge variant="secondary">
              Total Biaya Gizi: {formatCurrency(totalGizi)}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Tabel Data */}
      <Card>
        <CardHeader>
          <CardTitle>Data Akomodasi Inap</CardTitle>
          <CardDescription>
            Data ini tersinkronisasi otomatis dari data kegiatan dan dihitung berdasarkan hari rawat dan AUC gizi. 
            Hanya menampilkan unit kerja yang memiliki tindakan inap. Anda dapat mengedit jumlah hari rawat untuk mengubah perhitungan.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin mr-2" />
              Memuat data...
            </div>
          ) : data.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Tidak ada data untuk tahun {tahun}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Unit Kerja</TableHead>
                    <TableHead className="text-center">Tempat Tidur</TableHead>
                    <TableHead className="text-center">Kamar Luas (m²)</TableHead>
                    <TableHead className="text-center">Jumlah Porsi</TableHead>
                    <TableHead className="text-center">Hari Rawat</TableHead>
                    <TableHead className="text-center">AUC Gizi</TableHead>
                    <TableHead className="text-center">Kali Porsi</TableHead>
                    <TableHead className="text-right">Total Gizi</TableHead>
                    <TableHead className="text-center">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{row.kode_unit_kerja}</div>
                          <div className="text-sm text-muted-foreground">{row.nama_unit_kerja}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm space-y-1">
                          <div>SVIP: {formatNumber(row.tempat_tidur_svip)}</div>
                          <div>VIP: {formatNumber(row.tempat_tidur_vip)}</div>
                          <div>I: {formatNumber(row.tempat_tidur_i)}</div>
                          <div>II: {formatNumber(row.tempat_tidur_ii)}</div>
                          <div>III: {formatNumber(row.tempat_tidur_iii)}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm space-y-1">
                          <div>SVIP: {row.kamar_luas_svip.toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                          <div>VIP: {row.kamar_luas_vip.toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                          <div>I: {row.kamar_luas_i.toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                          <div>II: {row.kamar_luas_ii.toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                          <div>III: {row.kamar_luas_iii.toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm space-y-1">
                          <div>SVIP: {formatNumber(row.jumlah_porsi_svip)}</div>
                          <div>VIP: {formatNumber(row.jumlah_porsi_vip)}</div>
                          <div>I: {formatNumber(row.jumlah_porsi_i)}</div>
                          <div>II: {formatNumber(row.jumlah_porsi_ii)}</div>
                          <div>III: {formatNumber(row.jumlah_porsi_iii)}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm space-y-1">
                          <div>VVIP: {formatNumber(row.hari_rawat_vvip)}</div>
                          <div>VIP: {formatNumber(row.hari_rawat_vip)}</div>
                          <div>I: {formatNumber(row.hari_rawat_i)}</div>
                          <div>II: {formatNumber(row.hari_rawat_ii)}</div>
                          <div>III: {formatNumber(row.hari_rawat_iii)}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm space-y-1">
                          <div>VVIP: {formatCurrency(row.auc_gizi_vvip)}</div>
                          <div>VIP: {formatCurrency(row.auc_gizi_vip)}</div>
                          <div>I: {formatCurrency(row.auc_gizi_i)}</div>
                          <div>II: {formatCurrency(row.auc_gizi_ii)}</div>
                          <div>III: {formatCurrency(row.auc_gizi_iii)}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm space-y-1">
                          <div>VVIP: {formatCurrency(row.jumlah_kali_porsi_vvip)}</div>
                          <div>VIP: {formatCurrency(row.jumlah_kali_porsi_vip)}</div>
                          <div>I: {formatCurrency(row.jumlah_kali_porsi_i)}</div>
                          <div>II: {formatCurrency(row.jumlah_kali_porsi_ii)}</div>
                          <div>III: {formatCurrency(row.jumlah_kali_porsi_iii)}</div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(row.total_gizi)}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(row)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog Edit */}
      <Dialog open={editDialog} onOpenChange={setEditDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Hari Rawat</DialogTitle>
            <DialogDescription>
              Edit jumlah hari rawat untuk {editForm?.nama_unit_kerja} ({editForm?.kode_unit_kerja}).
              Perhitungan porsi dan biaya akan otomatis diperbarui.
            </DialogDescription>
          </DialogHeader>
          
          {editForm && (
            <div className="grid grid-cols-2 gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="hari_rawat_vvip">Hari Rawat VVIP</Label>
                <Input
                  id="hari_rawat_vvip"
                  type="number"
                  value={editForm.hari_rawat_vvip}
                  onChange={(e) => setEditForm({
                    ...editForm,
                    hari_rawat_vvip: parseInt(e.target.value) || 0
                  })}
                  min="0"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="hari_rawat_vip">Hari Rawat VIP</Label>
                <Input
                  id="hari_rawat_vip"
                  type="number"
                  value={editForm.hari_rawat_vip}
                  onChange={(e) => setEditForm({
                    ...editForm,
                    hari_rawat_vip: parseInt(e.target.value) || 0
                  })}
                  min="0"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="hari_rawat_i">Hari Rawat Kelas I</Label>
                <Input
                  id="hari_rawat_i"
                  type="number"
                  value={editForm.hari_rawat_i}
                  onChange={(e) => setEditForm({
                    ...editForm,
                    hari_rawat_i: parseInt(e.target.value) || 0
                  })}
                  min="0"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="hari_rawat_ii">Hari Rawat Kelas II</Label>
                <Input
                  id="hari_rawat_ii"
                  type="number"
                  value={editForm.hari_rawat_ii}
                  onChange={(e) => setEditForm({
                    ...editForm,
                    hari_rawat_ii: parseInt(e.target.value) || 0
                  })}
                  min="0"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="hari_rawat_iii">Hari Rawat Kelas III</Label>
                <Input
                  id="hari_rawat_iii"
                  type="number"
                  value={editForm.hari_rawat_iii}
                  onChange={(e) => setEditForm({
                    ...editForm,
                    hari_rawat_iii: parseInt(e.target.value) || 0
                  })}
                  min="0"
                />
              </div>
              
              <div className="space-y-2">
                <Label>Total Porsi (Otomatis)</Label>
                <div className="text-sm text-muted-foreground">
                  VVIP: {(editForm.hari_rawat_vvip * 3).toLocaleString()} porsi<br/>
                  VIP: {(editForm.hari_rawat_vip * 3).toLocaleString()} porsi<br/>
                  I: {(editForm.hari_rawat_i * 3).toLocaleString()} porsi<br/>
                  II: {(editForm.hari_rawat_ii * 3).toLocaleString()} porsi<br/>
                  III: {(editForm.hari_rawat_iii * 3).toLocaleString()} porsi
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditDialog(false)}
              disabled={saving}
            >
              <X className="h-4 w-4 mr-2" />
              Batal
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving}
            >
              <Save className="h-4 w-4 mr-2" />
              {saving ? "Menyimpan..." : "Simpan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AlokasiBiayaGizi;
