import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2, Search, Stethoscope } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface KlinikItem {
  kode_unit_kerja: string;
  nama_unit_kerja: string;
}

interface KlinikInputTableProps {
  value: KlinikItem[];
  onChange: (value: KlinikItem[]) => void;
  tahun: number;
}

const KlinikInputTable: React.FC<KlinikInputTableProps> = ({
  value,
  onChange,
  tahun,
}) => {
  const { toast } = useToast();
  const [availableKlinik, setAvailableKlinik] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedKlinik, setSelectedKlinik] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const fetchKlinik = async () => {
    try {
      setLoading(true);
      
      // Ambil unit kerja rawat jalan (jenis = 1) yang memiliki tindakan
      const { data, error } = await supabase
        .from("unit_kerja")
        .select("kode, nama")
        .eq("jenis", 1) // Rawat jalan
        .order("nama");

      if (error) throw error;

      // Filter hanya yang memiliki tindakan di skenario_tarif
      const { data: tindakanData, error: tindakanError } = await supabase
        .from("skenario_tarif")
        .select("kode_unit_kerja, nama_unit_kerja")
        .eq("tahun", tahun)
        .eq("sumber_tabel", "kalkulasi_tindakan_rawat_jalan");

      if (tindakanError) throw tindakanError;

      // Dedupe dan filter
      const klinikWithTindakan = new Set(
        tindakanData?.map((t) => t.kode_unit_kerja) || []
      );

      const filteredKlinik = (data || [])
        .filter((k) => klinikWithTindakan.has(k.kode))
        .map((k) => ({
          kode: k.kode,
          nama: k.nama,
        }));

      setAvailableKlinik(filteredKlinik);
    } catch (error: any) {
      toast({
        title: "Error fetching klinik",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKlinik();
  }, [tahun]);

  const filteredKlinik = availableKlinik.filter((klinik) => {
    // Filter berdasarkan search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const kode = (klinik.kode || "").toLowerCase();
      const nama = (klinik.nama || "").toLowerCase();
      
      if (!kode.includes(query) && !nama.includes(query)) {
        return false;
      }
    }
    
    // Filter: exclude klinik yang sudah dipilih
    const isAlreadySelected = value.some(
      (item) => item.kode_unit_kerja === klinik.kode
    );
    return !isAlreadySelected;
  });

  const handleAddToList = () => {
    if (!selectedKlinik) {
      toast({
        title: "Error",
        description: "Pilih klinik terlebih dahulu",
        variant: "destructive",
      });
      return;
    }

    const klinik = availableKlinik.find((k) => k.kode === selectedKlinik);
    if (!klinik) return;

    // Check duplicate
    const existingIndex = value.findIndex(
      (v) => v.kode_unit_kerja === klinik.kode
    );

    if (existingIndex >= 0) {
      toast({
        title: "Info",
        description: `${klinik.nama} sudah ada dalam list`,
        variant: "default",
      });
      return;
    }

    // Add new
    const newItem: KlinikItem = {
      kode_unit_kerja: klinik.kode,
      nama_unit_kerja: klinik.nama,
    };

    onChange([...value, newItem]);

    toast({
      title: "Berhasil",
      description: `${klinik.nama} berhasil ditambahkan ke list`,
    });

    setSelectedKlinik("");
  };

  const handleRemove = (index: number) => {
    const newValue = value.filter((_, i) => i !== index);
    onChange(newValue);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Stethoscope className="h-5 w-5 text-teal-700" />
        <Label className="text-base font-semibold">Klinik (Unit Kerja Rawat Jalan)</Label>
        <Badge className="bg-teal-500 text-white border-teal-600">
          {value.length} klinik
        </Badge>
      </div>

      {/* Info */}
      <div className="bg-teal-50 border border-teal-200 rounded-lg p-3 flex items-start gap-2">
        <div className="text-teal-600 mt-0.5">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
              clipRule="evenodd"
            />
          </svg>
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium text-teal-800">
            Pilih Klinik untuk Filter Tindakan
          </p>
          <p className="text-xs text-teal-700 mt-1">
            Klinik yang dipilih akan digunakan untuk memfilter tindakan rawat jalan yang tersedia.
            Hanya tindakan dari klinik yang dipilih yang akan ditampilkan.
          </p>
        </div>
      </div>

      {/* Input Section */}
      <div className="border rounded-lg p-4 bg-teal-50 border-teal-200 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          {/* Search */}
          <div className="md:col-span-5">
            <Label htmlFor="search-klinik" className="text-sm">
              Cari Klinik
            </Label>
            <div className="relative mt-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="search-klinik"
                placeholder="Ketik kode atau nama klinik..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>
            {searchQuery && (
              <p className="text-xs text-muted-foreground mt-1">
                Ditemukan {filteredKlinik.length} dari {availableKlinik.length}{" "}
                klinik
              </p>
            )}
          </div>

          {/* Select */}
          <div className="md:col-span-6">
            <Label htmlFor="select-klinik" className="text-sm">
              Pilih Klinik
            </Label>
            <Select value={selectedKlinik} onValueChange={setSelectedKlinik}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Pilih klinik..." />
              </SelectTrigger>
              <SelectContent>
                {loading ? (
                  <div className="p-4 text-center text-sm">Loading...</div>
                ) : filteredKlinik.length === 0 ? (
                  <div className="p-4 text-center text-sm text-muted-foreground">
                    {searchQuery
                      ? `Tidak ada hasil untuk "${searchQuery}"`
                      : "Tidak ada klinik tersedia"}
                  </div>
                ) : (
                  filteredKlinik.map((klinik) => (
                    <SelectItem key={klinik.kode} value={klinik.kode}>
                      {klinik.kode} - {klinik.nama}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Button Add */}
          <div className="md:col-span-1 flex items-end">
            <Button
              onClick={handleAddToList}
              disabled={!selectedKlinik}
              className="w-full bg-teal-500 hover:bg-teal-600 text-white"
              size="sm"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Table Display */}
      <div className="border rounded-lg overflow-hidden">
        {value.length === 0 ? (
          <div className="text-center py-8 text-gray-500 bg-teal-50">
            Belum ada klinik ditambahkan. Pilih klinik di atas dan klik tombol +
            untuk menambahkan.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-teal-50">
                <TableHead className="w-[120px]">Kode</TableHead>
                <TableHead>Nama Klinik</TableHead>
                <TableHead className="text-right w-[80px]">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {value.map((item, index) => (
                <TableRow key={index} className="hover:bg-gray-50">
                  <TableCell className="font-mono text-sm">
                    {item.kode_unit_kerja}
                  </TableCell>
                  <TableCell className="font-medium">
                    {item.nama_unit_kerja}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleRemove(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
};

export default KlinikInputTable;
