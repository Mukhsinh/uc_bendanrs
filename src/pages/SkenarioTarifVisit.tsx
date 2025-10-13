import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Save, RefreshCw, User, Plus, Stethoscope, UserCog, Edit2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface SkenarioTarifVisit {
  id?: string;
  user_id?: string;
  tahun: number;
  visit_dokter_umum: number;
  visit_dokter_spesialis: number;
  visit_dokter_subspesialis: number;
  konsultasi_dokter_spesialis: number;
  konsultasi_dokter_subspesialis: number;
  created_at?: string;
  updated_at?: string;
}

const SkenarioTarifVisit = () => {
  const { toast } = useToast();
  const [tahun, setTahun] = useState(2025);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [data, setData] = useState<SkenarioTarifVisit>({
    tahun: 2025,
    visit_dokter_umum: 0,
    visit_dokter_spesialis: 0,
    visit_dokter_subspesialis: 0,
    konsultasi_dokter_spesialis: 0,
    konsultasi_dokter_subspesialis: 0,
  });
  const [tempData, setTempData] = useState<SkenarioTarifVisit>({
    tahun: 2025,
    visit_dokter_umum: 0,
    visit_dokter_spesialis: 0,
    visit_dokter_subspesialis: 0,
    konsultasi_dokter_spesialis: 0,
    konsultasi_dokter_subspesialis: 0,
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: "Error",
          description: "User not authenticated",
          variant: "destructive",
        });
        return;
      }

      const { data: existingData, error } = await supabase
        .from("skenario_tarif_visit")
        .select("*")
        .eq("user_id", user.id)
        .eq("tahun", tahun)
        .maybeSingle();

      if (error && error.code !== "PGRST116") {
        throw error;
      }

      if (existingData) {
        setData(existingData);
        setTempData(existingData);
      } else {
        const defaultData = {
          tahun,
          visit_dokter_umum: 0,
          visit_dokter_spesialis: 0,
          visit_dokter_subspesialis: 0,
          konsultasi_dokter_spesialis: 0,
          konsultasi_dokter_subspesialis: 0,
        };
        setData(defaultData);
        setTempData(defaultData);
      }
    } catch (error: any) {
      toast({
        title: "Error fetching data",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [tahun]);

  const handleOpenDialog = () => {
    setTempData(data);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: "Error",
          description: "User not authenticated",
          variant: "destructive",
        });
        return;
      }

      const saveData = {
        user_id: user.id,
        tahun,
        visit_dokter_umum: tempData.visit_dokter_umum || 0,
        visit_dokter_spesialis: tempData.visit_dokter_spesialis || 0,
        visit_dokter_subspesialis: tempData.visit_dokter_subspesialis || 0,
        konsultasi_dokter_spesialis: tempData.konsultasi_dokter_spesialis || 0,
        konsultasi_dokter_subspesialis: tempData.konsultasi_dokter_subspesialis || 0,
      };

      const { error } = await supabase
        .from("skenario_tarif_visit")
        .upsert(saveData, {
          onConflict: "user_id,tahun",
        });

      if (error) throw error;

      toast({
        title: "Berhasil",
        description: "Data tarif visit dan konsultasi berhasil disimpan",
      });

      setDialogOpen(false);
      fetchData();
    } catch (error: any) {
      toast({
        title: "Error saving data",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(value);
  };

  const hasData = data.visit_dokter_umum > 0 || 
                  data.visit_dokter_spesialis > 0 || 
                  data.visit_dokter_subspesialis > 0 || 
                  data.konsultasi_dokter_spesialis > 0 || 
                  data.konsultasi_dokter_subspesialis > 0;

  return (
    <div className="container mx-auto py-10">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Skenario Tarif Visit dan Konsultasi</CardTitle>
              <CardDescription>
                Kelola tarif visit dan konsultasi dokter berdasarkan tingkat kompetensi
              </CardDescription>
            </div>
            <div className="flex gap-2 items-center">
              <Label htmlFor="tahun">Tahun:</Label>
              <Select value={String(tahun)} onValueChange={(value) => setTahun(Number(value))}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="Tahun" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2024">2024</SelectItem>
                  <SelectItem value="2025">2025</SelectItem>
                  <SelectItem value="2026">2026</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-10">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto text-gray-400" />
              <p className="mt-2 text-gray-500">Memuat data...</p>
            </div>
          ) : !hasData ? (
            <div className="text-center py-16">
              <Stethoscope className="h-16 w-16 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-semibold text-gray-700 mb-2">Belum Ada Data Tarif</h3>
              <p className="text-gray-500 mb-6">Klik tombol di bawah untuk menambahkan tarif visit dan konsultasi</p>
              <Button onClick={handleOpenDialog} size="lg">
                <Plus className="h-5 w-5 mr-2" />
                Tambah Tarif
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Ringkasan Tarif - Editable */}
              <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-300 shadow-lg">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">📊 Ringkasan Tarif</CardTitle>
                    <Button variant="outline" size="sm" onClick={handleOpenDialog}>
                      <Edit2 className="h-4 w-4 mr-2" />
                      Edit Tarif
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Visit Dokter Umum */}
                    <div className="p-4 rounded-lg bg-white border-2 border-purple-300 shadow-sm">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="bg-purple-500 p-3 rounded-lg">
                          <User className="h-6 w-6 text-white" />
                        </div>
                        <div className="flex-1">
                          <p className="text-xs text-gray-500 uppercase tracking-wide">Visit</p>
                          <p className="font-bold text-purple-700">Dokter Umum</p>
                        </div>
                      </div>
                      <p className="text-2xl font-bold text-purple-700">
                        {formatCurrency(data.visit_dokter_umum)}
                      </p>
                    </div>

                    {/* Visit Dokter Spesialis */}
                    <div className="p-4 rounded-lg bg-white border-2 border-green-300 shadow-sm">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="bg-green-500 p-3 rounded-lg">
                          <Stethoscope className="h-6 w-6 text-white" />
                        </div>
                        <div className="flex-1">
                          <p className="text-xs text-gray-500 uppercase tracking-wide">Visit</p>
                          <p className="font-bold text-green-700">Dokter Spesialis</p>
                        </div>
                      </div>
                      <p className="text-2xl font-bold text-green-700">
                        {formatCurrency(data.visit_dokter_spesialis)}
                      </p>
                    </div>

                    {/* Visit Dokter Subspesialis */}
                    <div className="p-4 rounded-lg bg-white border-2 border-orange-300 shadow-sm">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="bg-orange-500 p-3 rounded-lg">
                          <UserCog className="h-6 w-6 text-white" />
                        </div>
                        <div className="flex-1">
                          <p className="text-xs text-gray-500 uppercase tracking-wide">Visit</p>
                          <p className="font-bold text-orange-700">Dokter Subspesialis</p>
                        </div>
                      </div>
                      <p className="text-2xl font-bold text-orange-700">
                        {formatCurrency(data.visit_dokter_subspesialis)}
                      </p>
                    </div>

                    {/* Konsultasi Dokter Spesialis */}
                    <div className="p-4 rounded-lg bg-white border-2 border-green-300 shadow-sm md:col-span-1">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="bg-green-500 p-3 rounded-lg">
                          <Stethoscope className="h-6 w-6 text-white" />
                        </div>
                        <div className="flex-1">
                          <p className="text-xs text-gray-500 uppercase tracking-wide">Konsultasi</p>
                          <p className="font-bold text-green-700">Dokter Spesialis</p>
                        </div>
                      </div>
                      <p className="text-2xl font-bold text-green-700">
                        {formatCurrency(data.konsultasi_dokter_spesialis)}
                      </p>
                    </div>

                    {/* Konsultasi Dokter Subspesialis */}
                    <div className="p-4 rounded-lg bg-white border-2 border-orange-300 shadow-sm md:col-span-1">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="bg-orange-500 p-3 rounded-lg">
                          <UserCog className="h-6 w-6 text-white" />
                        </div>
                        <div className="flex-1">
                          <p className="text-xs text-gray-500 uppercase tracking-wide">Konsultasi</p>
                          <p className="font-bold text-orange-700">Dokter Subspesialis</p>
                        </div>
                      </div>
                      <p className="text-2xl font-bold text-orange-700">
                        {formatCurrency(data.konsultasi_dokter_subspesialis)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog Input/Edit Tarif */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Input Tarif Visit dan Konsultasi</DialogTitle>
            <DialogDescription>
              Masukkan tarif untuk setiap kategori dokter
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Visit Section */}
            <div>
              <h4 className="text-base font-semibold mb-4 flex items-center gap-2">
                <Stethoscope className="h-5 w-5" />
                Tarif Visit
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Visit Dokter Umum */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="bg-purple-500 p-2 rounded-lg">
                      <User className="h-5 w-5 text-white" />
                    </div>
                    <Label className="font-semibold text-purple-700">Dokter Umum</Label>
                  </div>
                  <Input
                    type="number"
                    value={tempData.visit_dokter_umum}
                    onChange={(e) =>
                      setTempData({ ...tempData, visit_dokter_umum: parseInt(e.target.value) || 0 })
                    }
                    placeholder="0"
                    className="text-lg"
                  />
                  <p className="text-sm font-semibold text-purple-600">
                    {formatCurrency(tempData.visit_dokter_umum)}
                  </p>
                </div>

                {/* Visit Dokter Spesialis */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="bg-green-500 p-2 rounded-lg">
                      <Stethoscope className="h-5 w-5 text-white" />
                    </div>
                    <Label className="font-semibold text-green-700">Dokter Spesialis</Label>
                  </div>
                  <Input
                    type="number"
                    value={tempData.visit_dokter_spesialis}
                    onChange={(e) =>
                      setTempData({ ...tempData, visit_dokter_spesialis: parseInt(e.target.value) || 0 })
                    }
                    placeholder="0"
                    className="text-lg"
                  />
                  <p className="text-sm font-semibold text-green-600">
                    {formatCurrency(tempData.visit_dokter_spesialis)}
                  </p>
                </div>

                {/* Visit Dokter Subspesialis */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="bg-orange-500 p-2 rounded-lg">
                      <UserCog className="h-5 w-5 text-white" />
                    </div>
                    <Label className="font-semibold text-orange-700">Dokter Subspesialis</Label>
                  </div>
                  <Input
                    type="number"
                    value={tempData.visit_dokter_subspesialis}
                    onChange={(e) =>
                      setTempData({ ...tempData, visit_dokter_subspesialis: parseInt(e.target.value) || 0 })
                    }
                    placeholder="0"
                    className="text-lg"
                  />
                  <p className="text-sm font-semibold text-orange-600">
                    {formatCurrency(tempData.visit_dokter_subspesialis)}
                  </p>
                </div>
              </div>
            </div>

            {/* Konsultasi Section */}
            <div>
              <h4 className="text-base font-semibold mb-4 flex items-center gap-2">
                <UserCog className="h-5 w-5" />
                Tarif Konsultasi
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Konsultasi Dokter Spesialis */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="bg-green-500 p-2 rounded-lg">
                      <Stethoscope className="h-5 w-5 text-white" />
                    </div>
                    <Label className="font-semibold text-green-700">Dokter Spesialis</Label>
                  </div>
                  <Input
                    type="number"
                    value={tempData.konsultasi_dokter_spesialis}
                    onChange={(e) =>
                      setTempData({ ...tempData, konsultasi_dokter_spesialis: parseInt(e.target.value) || 0 })
                    }
                    placeholder="0"
                    className="text-lg"
                  />
                  <p className="text-sm font-semibold text-green-600">
                    {formatCurrency(tempData.konsultasi_dokter_spesialis)}
                  </p>
                </div>

                {/* Konsultasi Dokter Subspesialis */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="bg-orange-500 p-2 rounded-lg">
                      <UserCog className="h-5 w-5 text-white" />
                    </div>
                    <Label className="font-semibold text-orange-700">Dokter Subspesialis</Label>
                  </div>
                  <Input
                    type="number"
                    value={tempData.konsultasi_dokter_subspesialis}
                    onChange={(e) =>
                      setTempData({ ...tempData, konsultasi_dokter_subspesialis: parseInt(e.target.value) || 0 })
                    }
                    placeholder="0"
                    className="text-lg"
                  />
                  <p className="text-sm font-semibold text-orange-600">
                    {formatCurrency(tempData.konsultasi_dokter_subspesialis)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Batal
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              <Save className="h-4 w-4 mr-2" />
              {saving ? "Menyimpan..." : "Simpan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SkenarioTarifVisit;
