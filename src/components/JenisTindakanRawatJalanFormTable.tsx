"use client";

import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Trash2, RefreshCw, Plus, Loader2, Search, X, Check, ChevronsUpDown, Clock, Star, AlertTriangle, Edit2, Calculator, ShoppingCart } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface JenisTindakanRawatJalan {
  id: string;
  kode_jenis: number;
  kode_unit_kerja: string;
  nama_unit_kerja: string;
  kode_jenis_tindakan: string;
  jenis_tindakan: string;
  jumlah?: number;
  waktu?: number;
  profesionalisme?: number;
  tingkat_kesulitan?: number;
  biaya_bahan_tindakan?: number;
  hasil_kali_waktu?: number;
  hasil_kali?: number;
  created_at?: string;
  updated_at?: string;
}

interface UnitKerja {
  id: string;
  kode: string;
  nama: string;
  jenis: number;
}

interface DaftarTindakan {
  id: string;
  kode_tindakan: string;
  nama_tindakan: string;
}

interface UnitKerjaWithTindakan extends UnitKerja {
  tindakan_list: JenisTindakanRawatJalan[];
}

interface TindakanWithJumlah {
  tindakanId: string;
  jumlah: number;
}

const JenisTindakanRawatJalanFormTable: React.FC = () => {
  const [unitKerjaList, setUnitKerjaList] = useState<UnitKerjaWithTindakan[]>([]);
  const [tindakanMasterList, setTindakanMasterList] = useState<DaftarTindakan[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  // Dialog states
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedUnitKerja, setSelectedUnitKerja] = useState<UnitKerja | null>(null);
  const [selectedTindakanWithJumlah, setSelectedTindakanWithJumlah] = useState<TindakanWithJumlah[]>([]);
  const [open, setOpen] = useState(false);
  
  // Edit jumlah states
  const [editingJumlahId, setEditingJumlahId] = useState<string | null>(null);
  const [editJumlahValue, setEditJumlahValue] = useState(0);
  
  // Filter state
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => { 
    fetchAll();
    fetchTindakanMaster();
  }, []);

  const fetchTindakanMaster = async () => {
    try {
      const { data, error } = await supabase
        .from('daftar_tindakan')
        .select('id, kode_tindakan, nama_tindakan')
        .order('kode_tindakan', { ascending: true });

      if (error) throw error;
      setTindakanMasterList(data || []);
    } catch (error: any) {
      toast.error("Gagal memuat daftar tindakan: " + error.message);
    }
  };

  const fetchAll = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      // Fetch unit kerja rawat jalan (jenis = 1)
      const { data: allUnitKerjaData, error: unitKerjaError } = await supabase
        .from('unit_kerja')
        .select('id, kode, nama, jenis')
        .eq('jenis', 1)
        .order('kode', { ascending: true });

      if (unitKerjaError) throw unitKerjaError;

      // Kode unit kerja yang dikecualikan (tidak ditampilkan)
      const excludedUnitKerja = ['UK037', 'UK038', 'UK039', 'UK040', 'UK042', 'UK043', 'UK044', 'UK075', 'UK077'];
      // UK037: Ambulance, UK038: Laboratorium, UK039: Radiologi, UK040: Farmasi, 
      // UK042: Gizi, UK043: Laundry & CSSD, UK044: BDRS, UK075: Pemulasaran Jenazah, UK077: Unit Diklat

      // Filter out excluded unit kerja
      const unitKerjaData = (allUnitKerjaData || []).filter(
        uk => !excludedUnitKerja.includes(uk.kode)
      );

      // Fetch all jenis tindakan rawat jalan for this user
      const { data: tindakanData, error: tindakanError } = await supabase
        .from('jenis_tindakan_rawat_jalan')
        .select('*')
        .eq('user_id', user.id)
        .order('kode_unit_kerja', { ascending: true });

      if (tindakanError) throw tindakanError;

      // Combine data
      const combinedData: UnitKerjaWithTindakan[] = (unitKerjaData || []).map(uk => ({
        ...uk,
        tindakan_list: (tindakanData || []).filter(t => t.kode_unit_kerja === uk.kode)
      }));

      setUnitKerjaList(combinedData);
    } catch (error: any) {
      toast.error("Gagal memuat data: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (unitKerja: UnitKerja) => {
    setSelectedUnitKerja(unitKerja);
    setSelectedTindakanWithJumlah([]);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setSelectedUnitKerja(null);
    setSelectedTindakanWithJumlah([]);
    setOpen(false);
  };

  const toggleTindakan = (tindakanId: string) => {
    setSelectedTindakanWithJumlah(prev => {
      const exists = prev.find(t => t.tindakanId === tindakanId);
      if (exists) {
        return prev.filter(t => t.tindakanId !== tindakanId);
      } else {
        return [...prev, { tindakanId, jumlah: 0 }];
      }
    });
  };

  const updateJumlahInSelection = (tindakanId: string, jumlah: number) => {
    setSelectedTindakanWithJumlah(prev =>
      prev.map(t => t.tindakanId === tindakanId ? { ...t, jumlah } : t)
    );
  };

  const handleSubmit = async () => {
    if (!selectedUnitKerja) return;
    if (selectedTindakanWithJumlah.length === 0) {
      toast.error("Pilih minimal satu tindakan");
      return;
    }

    setSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      // Get existing tindakan for this unit kerja
      const existingUnit = unitKerjaList.find(uk => uk.kode === selectedUnitKerja.kode);
      const existingTindakanCodes = existingUnit?.tindakan_list.map(t => t.kode_jenis_tindakan) || [];

      // Prepare data to insert
      const tindakanToInsert = selectedTindakanWithJumlah
        .map(({ tindakanId, jumlah }) => {
          const tindakan = tindakanMasterList.find(t => t.id === tindakanId);
          if (!tindakan) return null;
          
          // Check if already exists
          if (existingTindakanCodes.includes(tindakan.kode_tindakan)) {
            return null;
          }

          return {
            user_id: user.id,
            kode_jenis: 1,
            kode_unit_kerja: selectedUnitKerja.kode,
            nama_unit_kerja: selectedUnitKerja.nama,
            kode_jenis_tindakan: tindakan.kode_tindakan,
            jenis_tindakan: tindakan.nama_tindakan,
            jumlah: jumlah,
            // waktu, profesionalisme, tingkat_kesulitan will be auto-populated by trigger
          };
        })
        .filter(Boolean);

      if (tindakanToInsert.length === 0) {
        toast.warning("Semua tindakan yang dipilih sudah ada untuk unit kerja ini");
        handleCloseDialog();
        return;
      }

      const { error } = await supabase
        .from('jenis_tindakan_rawat_jalan')
        .insert(tindakanToInsert);

      if (error) throw error;
      
      toast.success(`Berhasil menambahkan ${tindakanToInsert.length} tindakan`);
      handleCloseDialog();
      fetchAll();
    } catch (error: any) {
      toast.error("Gagal menyimpan data: " + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteTindakan = async (id: string, namaTindakan: string) => {
    if (!confirm(`Yakin ingin menghapus tindakan "${namaTindakan}"?`)) return;
    
    try {
      const { error } = await supabase
        .from('jenis_tindakan_rawat_jalan')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success("Tindakan berhasil dihapus");
      fetchAll();
    } catch (error: any) {
      toast.error("Gagal menghapus tindakan: " + error.message);
    }
  };

  const handleEditJumlah = (tindakan: JenisTindakanRawatJalan) => {
    setEditingJumlahId(tindakan.id);
    setEditJumlahValue(tindakan.jumlah || 0);
  };

  const handleSaveJumlah = async (id: string) => {
    try {
      const { error } = await supabase
        .from('jenis_tindakan_rawat_jalan')
        .update({ jumlah: editJumlahValue })
        .eq('id', id);

      if (error) throw error;
      
      toast.success("Jumlah berhasil diperbarui");
      setEditingJumlahId(null);
      fetchAll();
    } catch (error: any) {
      toast.error("Gagal memperbarui jumlah: " + error.message);
    }
  };

  const handleCancelEditJumlah = () => {
    setEditingJumlahId(null);
    setEditJumlahValue(0);
  };

  // Filter unit kerja based on search term
  const filteredUnitKerjaList = unitKerjaList.filter(uk => 
    uk.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
    uk.kode.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Get available tindakan (not already added to selected unit kerja)
  const getAvailableTindakan = () => {
    if (!selectedUnitKerja) return tindakanMasterList;
    
    const existingUnit = unitKerjaList.find(uk => uk.kode === selectedUnitKerja.kode);
    const existingTindakanCodes = existingUnit?.tindakan_list.map(t => t.kode_jenis_tindakan) || [];
    
    return tindakanMasterList.filter(t => !existingTindakanCodes.includes(t.kode_tindakan));
  };

  const availableTindakan = getAvailableTindakan();
  const selectedTindakan = selectedTindakanWithJumlah.map(({ tindakanId, jumlah }) => {
    const tindakan = tindakanMasterList.find(t => t.id === tindakanId);
    return tindakan ? { ...tindakan, jumlah } : null;
  }).filter(Boolean) as Array<DaftarTindakan & { jumlah: number }>;

  const handleRemoveSelected = (tindakanId: string) => {
    setSelectedTindakanWithJumlah(prev => prev.filter(t => t.tindakanId !== tindakanId));
  };

  return (
    <div className="w-full space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Manajemen Tindakan Rawat Jalan</h1>
          <p className="text-muted-foreground">
            Kelola jenis tindakan untuk unit kerja rawat jalan
            <span className="text-xs block mt-1 text-muted-foreground/80">
              * Dikecualikan: Laboratorium, Radiologi, Farmasi, Gizi, BDRS, Ambulance, Laundry & CSSD, Pemulasaran Jenazah, Diklat
            </span>
          </p>
        </div>
        <Button onClick={fetchAll} variant="outline" size="sm">
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-2 max-w-sm">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cari unit kerja..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
        {searchTerm && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSearchTerm("")}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Unit Kerja Cards */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
          <p className="ml-2 text-muted-foreground">Memuat data...</p>
        </div>
      ) : filteredUnitKerjaList.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <p className="text-center text-muted-foreground">
              {searchTerm ? "Tidak ada unit kerja yang cocok dengan pencarian" : "Belum ada data unit kerja rawat jalan"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredUnitKerjaList.map((unitKerja) => (
            <Card key={unitKerja.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">Kode Jenis: {unitKerja.jenis}</Badge>
                      <Badge variant="secondary">{unitKerja.kode}</Badge>
                    </div>
                    <CardTitle className="text-lg">{unitKerja.nama}</CardTitle>
                    <CardDescription>
                      {unitKerja.tindakan_list.length} tindakan terdaftar
                    </CardDescription>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handleOpenDialog(unitKerja)}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Tambah Tindakan
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {unitKerja.tindakan_list.length === 0 ? (
                  <p className="text-sm text-muted-foreground italic">
                    Belum ada tindakan yang ditambahkan
                  </p>
                ) : (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[120px]">Kode</TableHead>
                          <TableHead>Nama Tindakan</TableHead>
                          <TableHead className="w-[100px] text-center">Jumlah</TableHead>
                          <TableHead className="w-[90px] text-center">
                            <div className="flex items-center justify-center gap-1">
                              <Clock className="h-3 w-3" />
                              Waktu
                            </div>
                          </TableHead>
                          <TableHead className="w-[80px] text-center">
                            <div className="flex items-center justify-center gap-1">
                              <Star className="h-3 w-3" />
                              Prof.
                            </div>
                          </TableHead>
                          <TableHead className="w-[90px] text-center">
                            <div className="flex items-center justify-center gap-1">
                              <AlertTriangle className="h-3 w-3" />
                              Tingkat
                            </div>
                          </TableHead>
                          <TableHead className="w-[120px] text-center">
                            <div className="flex items-center justify-center gap-1">
                              <ShoppingCart className="h-3 w-3" />
                              Biaya Bahan
                            </div>
                          </TableHead>
                          <TableHead className="w-[80px] text-center">Aksi</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {unitKerja.tindakan_list.map((tindakan) => (
                          <TableRow key={tindakan.id}>
                            <TableCell className="font-medium">
                              {tindakan.kode_jenis_tindakan}
                            </TableCell>
                            <TableCell>{tindakan.jenis_tindakan}</TableCell>
                            <TableCell className="text-center">
                              {editingJumlahId === tindakan.id ? (
                                <div className="flex items-center gap-1">
                                  <Input
                                    type="number"
                                    min="0"
                                    value={editJumlahValue}
                                    onChange={(e) => setEditJumlahValue(parseInt(e.target.value) || 0)}
                                    className="w-16 h-7 text-center"
                                    autoFocus
                                  />
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-7 w-7"
                                    onClick={() => handleSaveJumlah(tindakan.id)}
                                  >
                                    <Check className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-7 w-7"
                                    onClick={handleCancelEditJumlah}
                                  >
                                    <X className="h-3 w-3" />
                                  </Button>
                                </div>
                              ) : (
                                <div className="flex items-center justify-center gap-1">
                                  <span className="font-medium">{tindakan.jumlah || 0}</span>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-6 w-6"
                                    onClick={() => handleEditJumlah(tindakan)}
                                  >
                                    <Edit2 className="h-3 w-3" />
                                  </Button>
                                </div>
                              )}
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge variant="outline" className="text-xs">
                                {tindakan.waktu || 0} mnt
                              </Badge>
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge variant="secondary" className="text-xs">
                                {tindakan.profesionalisme || 1}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge variant="secondary" className="text-xs">
                                {tindakan.tingkat_kesulitan || 1}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-center">
                              {tindakan.biaya_bahan_tindakan ? (
                                <span className="text-xs font-medium text-green-700">
                                  Rp {tindakan.biaya_bahan_tindakan.toLocaleString()}
                                </span>
                              ) : (
                                <span className="text-xs text-muted-foreground">-</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="flex justify-center">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleDeleteTindakan(tindakan.id, tindakan.jenis_tindakan)}
                                >
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add Tindakan Dialog with Multi-Select Dropdown */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Tambah Tindakan untuk {selectedUnitKerja?.nama}</DialogTitle>
            <DialogDescription>
              Pilih tindakan dan atur jumlahnya. Data waktu, profesionalisme, dan tingkat kesulitan akan otomatis terisi dari master.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Multi-Select Dropdown */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Pilih Tindakan</label>
              <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="w-full justify-between"
                  >
                    {selectedTindakan.length === 0
                      ? "Pilih tindakan..."
                      : `${selectedTindakan.length} tindakan dipilih`}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[700px] p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Ketik untuk mencari tindakan..." />
                    <CommandList>
                      <CommandEmpty>Tidak ada tindakan ditemukan.</CommandEmpty>
                      <CommandGroup>
                        {availableTindakan.length === 0 ? (
                          <CommandItem disabled>
                            Semua tindakan sudah ditambahkan
                          </CommandItem>
                        ) : (
                          availableTindakan.map((tindakan) => (
                            <CommandItem
                              key={tindakan.id}
                              value={`${tindakan.kode_tindakan} ${tindakan.nama_tindakan}`}
                              onSelect={() => {
                                toggleTindakan(tindakan.id);
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  selectedTindakanWithJumlah.some(t => t.tindakanId === tindakan.id)
                                    ? "opacity-100"
                                    : "opacity-0"
                                )}
                              />
                              <div className="flex flex-col">
                                <span className="font-medium">{tindakan.kode_tindakan}</span>
                                <span className="text-sm text-muted-foreground">
                                  {tindakan.nama_tindakan}
                                </span>
                              </div>
                            </CommandItem>
                          ))
                        )}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            {/* Selected Items Display with Jumlah Input */}
            {selectedTindakan.length > 0 && (
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Tindakan Dipilih ({selectedTindakan.length})
                </label>
                <div className="space-y-2 p-3 rounded-md border bg-muted/50 max-h-[300px] overflow-y-auto">
                  {selectedTindakan.map((tindakan) => (
                    <div key={tindakan.id} className="flex items-center gap-2 p-2 bg-background rounded border">
                      <div className="flex-1">
                        <div className="font-medium text-sm">{tindakan.kode_tindakan}</div>
                        <div className="text-xs text-muted-foreground">{tindakan.nama_tindakan}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <label className="text-xs text-muted-foreground">Jumlah:</label>
                        <Input
                          type="number"
                          min="0"
                          value={tindakan.jumlah}
                          onChange={(e) => updateJumlahInSelection(tindakan.id, parseInt(e.target.value) || 0)}
                          className="w-20 h-8 text-center"
                        />
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8"
                          onClick={() => handleRemoveSelected(tindakan.id)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Summary */}
            {selectedTindakan.length > 0 && (
              <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                <p className="text-sm font-medium">Ringkasan:</p>
                <ul className="text-sm text-muted-foreground mt-1 space-y-1">
                  <li>• Unit Kerja: {selectedUnitKerja?.nama}</li>
                  <li>• Kode Jenis: 1 (Rawat Jalan)</li>
                  <li>• Jumlah Tindakan: {selectedTindakan.length}</li>
                  <li className="text-xs text-blue-600 mt-2">
                    ℹ️ Waktu, Profesionalisme, Tingkat Kesulitan, dan Biaya Bahan akan otomatis terisi dari master tindakan
                  </li>
                </ul>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleCloseDialog}>
              Batal
            </Button>
            <Button 
              type="button" 
              onClick={handleSubmit} 
              disabled={submitting || selectedTindakanWithJumlah.length === 0}
            >
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Simpan {selectedTindakan.length > 0 && `(${selectedTindakan.length})`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Summary Footer */}
      <div className="flex items-center justify-between text-sm text-muted-foreground border-t pt-4">
        <div>
          Total Unit Kerja: {filteredUnitKerjaList.length} dari {unitKerjaList.length}
        </div>
        <div>
          Total Tindakan Terdaftar: {unitKerjaList.reduce((sum, uk) => sum + uk.tindakan_list.length, 0)}
        </div>
      </div>
    </div>
  );
};

export default JenisTindakanRawatJalanFormTable;

