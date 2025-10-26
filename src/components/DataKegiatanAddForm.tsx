import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { DataKegiatan } from "@/types/data-kegiatan";

interface DataKegiatanAddFormProps {
  onSuccess: () => void;
  onCancel: () => void;
  selectedYear: number;
}

export const DataKegiatanAddForm: React.FC<DataKegiatanAddFormProps> = ({
  onSuccess,
  onCancel,
  selectedYear,
}) => {
  const [loading, setLoading] = useState(false);
  const [unitKerjaList, setUnitKerjaList] = useState<
    { id: string; kode: string; nama: string }[]
  >([]);
  const [formData, setFormData] = useState<Partial<DataKegiatan>>({
    tahun: selectedYear,
    Kode_UK: "",
    Nama_Unit_Kerja: "",
    SDM_dokter: 0,
    SDM_Perawat: 0,
    SDM_Non: 0,
    Jml_jam_Praktek_Harian: 0,
    Diklat_Jumlah_Siswa: 0,
    Diklat_Lama_Hari: 0,
    Listrik_kwh: 0,
    Air_m3: 0,
    Telepon_Freq_pakai_per_titik: 0,
    Komputer_simrs_user: 0,
    Tempat_Tidur_SVIP: 0,
    Tempat_Tidur_VIP: 0,
    Tempat_Tidur_I: 0,
    Tempat_Tidur_II: 0,
    Tempat_Tidur_III: 0,
    Tempat_Tidur_Khusus: 0,
    Kunjungan_Pasien_Lama: 0,
    Kunjungan_Pasien_Baru: 0,
    Jumlah_Tindakan: 0,
    Resep_Lembar_Resep: 0,
    Hari_Rawat_SVIP: 0,
    Hari_Rawat_VIP: 0,
    Hari_Rawat_I: 0,
    Hari_Rawat_II: 0,
    Hari_Rawat_III: 0,
    Cucian_kg_Cucian: 0,
    Instrumen_Besar: 0,
    Instrumen_Sedang: 0,
    Instrumen_Kecil: 0,
    Set_Pack_Besar: 0,
    Set_Pack_Sedang: 0,
    Set_Pack_Kecil: 0,
    Makanan_Karyawan_jml_Porsi: 0,
    Makanan_Pasien_jml_Porsi: 0,
  });

  useEffect(() => {
    loadUnitKerja();
  }, []);

  const loadUnitKerja = async () => {
    try {
      const { data: units, error } = await supabase
        .from("unit_kerja")
        .select("id, kode, nama")
        .order("nama");

      if (error) throw error;
      setUnitKerjaList(units || []);
    } catch (error) {
      console.error("Error loading unit kerja:", error);
      toast.error("Gagal memuat data unit kerja");
    }
  };

  const handleUnitKerjaChange = (value: string) => {
    const selectedUnit = unitKerjaList.find((u) => u.kode === value);
    if (selectedUnit) {
      setFormData({
        ...formData,
        Kode_UK: selectedUnit.kode,
        Nama_Unit_Kerja: selectedUnit.nama,
      });
    }
  };

  const handleInputChange = (field: keyof DataKegiatan, value: any) => {
    setFormData({
      ...formData,
      [field]: value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.Kode_UK || !formData.Nama_Unit_Kerja) {
      toast.error("Unit kerja harus dipilih");
      return;
    }

    setLoading(true);
    try {
      // Transform field names to match database schema
      // Only include fields that exist in the actual database
      const dbData: any = {
        Kode_UK: formData.Kode_UK,
        Nama_Unit_Kerja: formData.Nama_Unit_Kerja,
        tahun: formData.tahun,
      };

      // Add optional fields - names match database columns exactly
      if (formData.SDM_dokter !== undefined) dbData.SDM_dokter = formData.SDM_dokter;
      if (formData.SDM_Perawat !== undefined) dbData.SDM_Perawat = formData.SDM_Perawat;
      if (formData.SDM_Non !== undefined) dbData.SDM_Non = formData.SDM_Non;
      if (formData.Jml_jam_Praktek_Harian !== undefined) dbData.Jml_jam_Praktek_Harian = formData.Jml_jam_Praktek_Harian;
      if (formData.Diklat_Jumlah_Siswa !== undefined) dbData.Diklat_Jumlah_Siswa = formData.Diklat_Jumlah_Siswa;
      if (formData.Diklat_Lama_Hari !== undefined) dbData.Diklat_Lama_Hari = formData.Diklat_Lama_Hari;
      if (formData.Listrik_kwh !== undefined) dbData.Listrik_kwh = formData.Listrik_kwh;
      if (formData.Air_m3 !== undefined) dbData.Air_m3 = formData.Air_m3;
      if (formData.Telepon_Freq_pakai_per_titik !== undefined) dbData.Telepon_Freq_pakai_per_titik = formData.Telepon_Freq_pakai_per_titik;
      if (formData.Komputer_simrs_user !== undefined) dbData.Komputer_simrs_user = formData.Komputer_simrs_user;
      if (formData.Tempat_Tidur_SVIP !== undefined) dbData.Tempat_Tidur_SVIP = formData.Tempat_Tidur_SVIP;
      if (formData.Tempat_Tidur_VIP !== undefined) dbData.Tempat_Tidur_VIP = formData.Tempat_Tidur_VIP;
      if (formData.Tempat_Tidur_I !== undefined) dbData.Tempat_Tidur_I = formData.Tempat_Tidur_I;
      if (formData.Tempat_Tidur_II !== undefined) dbData.Tempat_Tidur_II = formData.Tempat_Tidur_II;
      if (formData.Tempat_Tidur_III !== undefined) dbData.Tempat_Tidur_III = formData.Tempat_Tidur_III;
      if (formData.Tempat_Tidur_Khusus !== undefined) dbData.Tempat_Tidur_Khusus = formData.Tempat_Tidur_Khusus;
      if (formData.Kunjungan_Pasien_Lama !== undefined) dbData.Kunjungan_Pasien_Lama = formData.Kunjungan_Pasien_Lama;
      if (formData.Kunjungan_Pasien_Baru !== undefined) dbData.Kunjungan_Pasien_Baru = formData.Kunjungan_Pasien_Baru;
      if (formData.Jumlah_Tindakan !== undefined) dbData.Jumlah_Tindakan = formData.Jumlah_Tindakan;
      if (formData.Resep_Lembar_Resep !== undefined) dbData.Resep_Lembar_Resep = formData.Resep_Lembar_Resep;
      if (formData.Hari_Rawat_SVIP !== undefined) dbData.Hari_Rawat_SVIP = formData.Hari_Rawat_SVIP;
      if (formData.Hari_Rawat_VIP !== undefined) dbData.Hari_Rawat_VIP = formData.Hari_Rawat_VIP;
      if (formData.Hari_Rawat_I !== undefined) dbData.Hari_Rawat_I = formData.Hari_Rawat_I;
      if (formData.Hari_Rawat_II !== undefined) dbData.Hari_Rawat_II = formData.Hari_Rawat_II;
      if (formData.Hari_Rawat_III !== undefined) dbData.Hari_Rawat_III = formData.Hari_Rawat_III;
      if (formData.Cucian_kg_Cucian !== undefined) dbData.Cucian_kg_Cucian = formData.Cucian_kg_Cucian;
      if (formData.Instrumen_Besar !== undefined) dbData.Instrumen_Besar = formData.Instrumen_Besar;
      if (formData.Instrumen_Sedang !== undefined) dbData.Instrumen_Sedang = formData.Instrumen_Sedang;
      if (formData.Instrumen_Kecil !== undefined) dbData.Instrumen_Kecil = formData.Instrumen_Kecil;
      if (formData.Set_Pack_Besar !== undefined) dbData.Set_Pack_Besar = formData.Set_Pack_Besar;
      if (formData.Set_Pack_Sedang !== undefined) dbData.Set_Pack_Sedang = formData.Set_Pack_Sedang;
      if (formData.Set_Pack_Kecil !== undefined) dbData.Set_Pack_Kecil = formData.Set_Pack_Kecil;
      if (formData.Makanan_Karyawan_jml_Porsi !== undefined) dbData.Makanan_Karyawan_jml_Porsi = formData.Makanan_Karyawan_jml_Porsi;
      if (formData.Makanan_Pasien_jml_Porsi !== undefined) dbData.Makanan_Pasien_jml_Porsi = formData.Makanan_Pasien_jml_Porsi;

      console.log("Attempting to insert data:", dbData);
      
      const { data, error } = await supabase
        .from("data_kegiatan")
        .insert([dbData])
        .select();

      if (error) {
        console.error("Supabase error:", error);
        throw error;
      }

      console.log("Insert successful:", data);
      toast.success("Data berhasil ditambahkan");
      onSuccess();
    } catch (error: any) {
      console.error("Error adding data:", error);
      toast.error(error.message || "Gagal menambahkan data");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <ScrollArea className="h-[500px] pr-4">
        {/* Unit Kerja Selection */}
        <div className="space-y-4 mb-6">
          <div>
            <Label htmlFor="unit">Unit Kerja *</Label>
            <Select
              value={formData.Kode_UK || ""}
              onValueChange={handleUnitKerjaChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="Pilih unit kerja" />
              </SelectTrigger>
              <SelectContent>
                {unitKerjaList.map((unit) => (
                  <SelectItem key={unit.id} value={unit.kode}>
                    {unit.kode} - {unit.nama}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="tahun">Tahun *</Label>
            <Input
              id="tahun"
              type="number"
              value={formData.tahun || ""}
              onChange={(e) =>
                handleInputChange("tahun", parseInt(e.target.value))
              }
              required
            />
          </div>
        </div>

        <Tabs defaultValue="kepegawaian" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="kepegawaian">Kepegawaian</TabsTrigger>
            <TabsTrigger value="daya">Daya</TabsTrigger>
            <TabsTrigger value="infrastruktur">Infrastruktur</TabsTrigger>
            <TabsTrigger value="layanan">Layanan</TabsTrigger>
          </TabsList>

          {/* Tab Kepegawaian */}
          <TabsContent value="kepegawaian" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="sdm_dokter">SDM Dokter</Label>
                <Input
                  id="sdm_dokter"
                  type="number"
                  value={formData.SDM_dokter || 0}
                  onChange={(e) =>
                    handleInputChange("SDM_dokter", parseInt(e.target.value) || 0)
                  }
                />
              </div>
              <div>
                <Label htmlFor="sdm_perawat">SDM Perawat</Label>
                <Input
                  id="sdm_perawat"
                  type="number"
                  value={formData.SDM_Perawat || 0}
                  onChange={(e) =>
                    handleInputChange("SDM_Perawat", parseInt(e.target.value) || 0)
                  }
                />
              </div>
              <div>
                <Label htmlFor="sdm_non">SDM Non-Medis</Label>
                <Input
                  id="sdm_non"
                  type="number"
                  value={formData.SDM_Non || 0}
                  onChange={(e) =>
                    handleInputChange("SDM_Non", parseInt(e.target.value) || 0)
                  }
                />
              </div>
              <div>
                <Label htmlFor="jam_praktek">Jam Praktek Harian</Label>
                <Input
                  id="jam_praktek"
                  type="number"
                  value={formData.Jml_jam_Praktek_Harian || 0}
                  onChange={(e) =>
                    handleInputChange("Jml_jam_Praktek_Harian", parseInt(e.target.value) || 0)
                  }
                />
              </div>
              <div>
                <Label htmlFor="diklat_siswa">Diklat Jumlah Siswa</Label>
                <Input
                  id="diklat_siswa"
                  type="number"
                  value={formData.Diklat_Jumlah_Siswa || 0}
                  onChange={(e) =>
                    handleInputChange("Diklat_Jumlah_Siswa", parseInt(e.target.value) || 0)
                  }
                />
              </div>
              <div>
                <Label htmlFor="diklat_hari">Diklat Lama Hari</Label>
                <Input
                  id="diklat_hari"
                  type="number"
                  value={formData.Diklat_Lama_Hari || 0}
                  onChange={(e) =>
                    handleInputChange("Diklat_Lama_Hari", parseInt(e.target.value) || 0)
                  }
                />
              </div>
            </div>
          </TabsContent>

          {/* Tab Daya */}
          <TabsContent value="daya" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="listrik">Listrik (kWh)</Label>
                <Input
                  id="listrik"
                  type="number"
                  step="0.01"
                  value={formData.Listrik_kwh || 0}
                  onChange={(e) =>
                    handleInputChange("Listrik_kwh", parseFloat(e.target.value) || 0)
                  }
                />
              </div>
              <div>
                <Label htmlFor="air">Air (m³)</Label>
                <Input
                  id="air"
                  type="number"
                  step="0.01"
                  value={formData.Air_m3 || 0}
                  onChange={(e) =>
                    handleInputChange("Air_m3", parseFloat(e.target.value) || 0)
                  }
                />
              </div>
              <div>
                <Label htmlFor="telepon">Telepon (Frekuensi)</Label>
                <Input
                  id="telepon"
                  type="number"
                  value={formData.Telepon_Freq_pakai_per_titik || 0}
                  onChange={(e) =>
                    handleInputChange("Telepon_Freq_pakai_per_titik", parseInt(e.target.value) || 0)
                  }
                />
              </div>
              <div>
                <Label htmlFor="komputer">Komputer SIMRS User</Label>
                <Input
                  id="komputer"
                  type="number"
                  value={formData.Komputer_simrs_user || 0}
                  onChange={(e) =>
                    handleInputChange("Komputer_simrs_user", parseInt(e.target.value) || 0)
                  }
                />
              </div>
            </div>
          </TabsContent>

          {/* Tab Infrastruktur */}
          <TabsContent value="infrastruktur" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="tt_svip">Tempat Tidur SVIP</Label>
                <Input
                  id="tt_svip"
                  type="number"
                  value={formData.Tempat_Tidur_SVIP || 0}
                  onChange={(e) =>
                    handleInputChange("Tempat_Tidur_SVIP", parseInt(e.target.value) || 0)
                  }
                />
              </div>
              <div>
                <Label htmlFor="tt_vip">Tempat Tidur VIP</Label>
                <Input
                  id="tt_vip"
                  type="number"
                  value={formData.Tempat_Tidur_VIP || 0}
                  onChange={(e) =>
                    handleInputChange("Tempat_Tidur_VIP", parseInt(e.target.value) || 0)
                  }
                />
              </div>
              <div>
                <Label htmlFor="tt_i">Tempat Tidur Kelas I</Label>
                <Input
                  id="tt_i"
                  type="number"
                  value={formData.Tempat_Tidur_I || 0}
                  onChange={(e) =>
                    handleInputChange("Tempat_Tidur_I", parseInt(e.target.value) || 0)
                  }
                />
              </div>
              <div>
                <Label htmlFor="tt_ii">Tempat Tidur Kelas II</Label>
                <Input
                  id="tt_ii"
                  type="number"
                  value={formData.Tempat_Tidur_II || 0}
                  onChange={(e) =>
                    handleInputChange("Tempat_Tidur_II", parseInt(e.target.value) || 0)
                  }
                />
              </div>
              <div>
                <Label htmlFor="tt_iii">Tempat Tidur Kelas III</Label>
                <Input
                  id="tt_iii"
                  type="number"
                  value={formData.Tempat_Tidur_III || 0}
                  onChange={(e) =>
                    handleInputChange("Tempat_Tidur_III", parseInt(e.target.value) || 0)
                  }
                />
              </div>
              <div>
                <Label htmlFor="tt_khusus">Tempat Tidur Khusus</Label>
                <Input
                  id="tt_khusus"
                  type="number"
                  value={formData.Tempat_Tidur_Khusus || 0}
                  onChange={(e) =>
                    handleInputChange("Tempat_Tidur_Khusus", parseInt(e.target.value) || 0)
                  }
                />
              </div>
            </div>
          </TabsContent>

          {/* Tab Layanan */}
          <TabsContent value="layanan" className="space-y-4">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="kunjungan_lama">Kunjungan Pasien Lama</Label>
                  <Input
                    id="kunjungan_lama"
                    type="number"
                    value={formData.Kunjungan_Pasien_Lama || 0}
                    onChange={(e) =>
                      handleInputChange("Kunjungan_Pasien_Lama", parseInt(e.target.value) || 0)
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="kunjungan_baru">Kunjungan Pasien Baru</Label>
                  <Input
                    id="kunjungan_baru"
                    type="number"
                    value={formData.Kunjungan_Pasien_Baru || 0}
                    onChange={(e) =>
                      handleInputChange("Kunjungan_Pasien_Baru", parseInt(e.target.value) || 0)
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="jumlah_tindakan">Jumlah Tindakan</Label>
                  <Input
                    id="jumlah_tindakan"
                    type="number"
                    value={formData.Jumlah_Tindakan || 0}
                    onChange={(e) =>
                      handleInputChange("Jumlah_Tindakan", parseInt(e.target.value) || 0)
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="resep">Resep Lembar</Label>
                  <Input
                    id="resep"
                    type="number"
                    value={formData.Resep_Lembar_Resep || 0}
                    onChange={(e) =>
                      handleInputChange("Resep_Lembar_Resep", parseInt(e.target.value) || 0)
                    }
                  />
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-medium mb-3">Hari Rawat</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="hr_svip">Hari Rawat SVIP</Label>
                    <Input
                      id="hr_svip"
                      type="number"
                      value={formData.Hari_Rawat_SVIP || 0}
                      onChange={(e) =>
                        handleInputChange("Hari_Rawat_SVIP", parseInt(e.target.value) || 0)
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="hr_vip">Hari Rawat VIP</Label>
                    <Input
                      id="hr_vip"
                      type="number"
                      value={formData.Hari_Rawat_VIP || 0}
                      onChange={(e) =>
                        handleInputChange("Hari_Rawat_VIP", parseInt(e.target.value) || 0)
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="hr_i">Hari Rawat Kelas I</Label>
                    <Input
                      id="hr_i"
                      type="number"
                      value={formData.Hari_Rawat_I || 0}
                      onChange={(e) =>
                        handleInputChange("Hari_Rawat_I", parseInt(e.target.value) || 0)
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="hr_ii">Hari Rawat Kelas II</Label>
                    <Input
                      id="hr_ii"
                      type="number"
                      value={formData.Hari_Rawat_II || 0}
                      onChange={(e) =>
                        handleInputChange("Hari_Rawat_II", parseInt(e.target.value) || 0)
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="hr_iii">Hari Rawat Kelas III</Label>
                    <Input
                      id="hr_iii"
                      type="number"
                      value={formData.Hari_Rawat_III || 0}
                      onChange={(e) =>
                        handleInputChange("Hari_Rawat_III", parseInt(e.target.value) || 0)
                      }
                    />
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-medium mb-3">Penunjang</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="cucian">Cucian (kg)</Label>
                    <Input
                      id="cucian"
                      type="number"
                      step="0.01"
                      value={formData.Cucian_kg_Cucian || 0}
                      onChange={(e) =>
                        handleInputChange("Cucian_kg_Cucian", parseFloat(e.target.value) || 0)
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="instrumen_besar">Instrumen Besar</Label>
                    <Input
                      id="instrumen_besar"
                      type="number"
                      value={formData.Instrumen_Besar || 0}
                      onChange={(e) =>
                        handleInputChange("Instrumen_Besar", parseInt(e.target.value) || 0)
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="instrumen_sedang">Instrumen Sedang</Label>
                    <Input
                      id="instrumen_sedang"
                      type="number"
                      value={formData.Instrumen_Sedang || 0}
                      onChange={(e) =>
                        handleInputChange("Instrumen_Sedang", parseInt(e.target.value) || 0)
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="instrumen_kecil">Instrumen Kecil</Label>
                    <Input
                      id="instrumen_kecil"
                      type="number"
                      value={formData.Instrumen_Kecil || 0}
                      onChange={(e) =>
                        handleInputChange("Instrumen_Kecil", parseInt(e.target.value) || 0)
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="set_pack_besar">Set Pack Besar</Label>
                    <Input
                      id="set_pack_besar"
                      type="number"
                      value={formData.Set_Pack_Besar || 0}
                      onChange={(e) =>
                        handleInputChange("Set_Pack_Besar", parseInt(e.target.value) || 0)
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="set_pack_sedang">Set Pack Sedang</Label>
                    <Input
                      id="set_pack_sedang"
                      type="number"
                      value={formData.Set_Pack_Sedang || 0}
                      onChange={(e) =>
                        handleInputChange("Set_Pack_Sedang", parseInt(e.target.value) || 0)
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="set_pack_kecil">Set Pack Kecil</Label>
                    <Input
                      id="set_pack_kecil"
                      type="number"
                      value={formData.Set_Pack_Kecil || 0}
                      onChange={(e) =>
                        handleInputChange("Set_Pack_Kecil", parseInt(e.target.value) || 0)
                      }
                    />
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-medium mb-3">Gizi</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="makanan_karyawan">Makanan Karyawan (Porsi)</Label>
                    <Input
                      id="makanan_karyawan"
                      type="number"
                      value={formData.Makanan_Karyawan_jml_Porsi || 0}
                      onChange={(e) =>
                        handleInputChange("Makanan_Karyawan_jml_Porsi", parseInt(e.target.value) || 0)
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="makanan_pasien">Makanan Pasien (Porsi)</Label>
                    <Input
                      id="makanan_pasien"
                      type="number"
                      value={formData.Makanan_Pasien_jml_Porsi || 0}
                      onChange={(e) =>
                        handleInputChange("Makanan_Pasien_jml_Porsi", parseInt(e.target.value) || 0)
                      }
                    />
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </ScrollArea>

      <div className="flex justify-end gap-2 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel}>
          Batal
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? "Menyimpan..." : "Simpan"}
        </Button>
      </div>
    </form>
  );
};

