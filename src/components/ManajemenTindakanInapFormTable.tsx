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

interface JenisTindakanInap {
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
  waktu?: number;
  profesionalisme?: number;
  tingkat_kesulitan?: number;
  biaya_bahan_tindakan?: number;
  updated_at?: string;
}

interface UnitKerjaWithTindakan extends UnitKerja {
  tindakan_list: JenisTindakanInap[];
}

interface TindakanWithJumlah {
  tindakanId: string;
  jumlah: number;
}

const ManajemenTindakanInapFormTable: React.FC = () => {
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
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [
        { data: unitKerjaData, error: unitKerjaError },
        { data: tindakanMasterData, error: tindakanMasterError },
        { data: tindakanData, error: tindakanError }
      ] = await Promise.all([
        supabase
          .from('unit_kerja')
          .select('id, kode, nama, jenis')
          .eq('jenis', 2)
          .order('kode', { ascending: true }),
        supabase
          .from('daftar_tindakan')
          .select('id, kode_tindakan, nama_tindakan, waktu, profesionalisme, tingkat_kesulitan, biaya_bahan_tindakan, updated_at')
          .order('kode_tindakan', { ascending: true }),
        supabase
          .from('jenis_tindakan_inap')
          .select('*')
          .eq('kode_jenis', 2)
          .order('kode_unit_kerja', { ascending: true })
      ]);

      if (unitKerjaError) throw unitKerjaError;
      if (tindakanMasterError) throw tindakanMasterError;
      if (tindakanError) throw tindakanError;

      const tindakanMasterListData = tindakanMasterData || [];
      setTindakanMasterList(tindakanMasterListData);

      const tindakanMasterMap = new Map<string, DaftarTindakan>(
        tindakanMasterListData.map((item) => [item.kode_tindakan, item])
      );

      const tindakanWithLatest = (tindakanData || []).map((tindakan) => {
        const master = tindakanMasterMap.get(tindakan.kode_jenis_tindakan);
        return {
          ...tindakan,
          jenis_tindakan: master?.nama_tindakan ?? tindakan.jenis_tindakan,
          waktu: master?.waktu ?? tindakan.waktu,
          profesionalisme: master?.profesionalisme ?? tindakan.profesionalisme,
          tingkat_kesulitan: master?.tingkat_kesulitan ?? tindakan.tingkat_kesulitan,
          biaya_bahan_tindakan: master?.biaya_bahan_tindakan ?? tindakan.biaya_bahan_tindakan,
          updated_at: master?.updated_at ?? tindakan.updated_at
        } as JenisTindakanInap;
      });

      const combinedData: UnitKerjaWithTindakan[] = (unitKerjaData || []).map(uk => ({
        ...uk,
        tindakan_list: tindakanWithLatest
          .filter(t => t.kode_unit_kerja === uk.kode)
          .map(t => ({ ...t, nama_unit_kerja: uk.nama }))
          .sort((a, b) => (a.kode_jenis_tindakan || "").localeCompare(b.kode_jenis_tindakan || ""))
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
            kode_jenis: 2,
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
        .from('jenis_tindakan_inap')
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
        .from('jenis_tindakan_inap')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success("Tindakan berhasil dihapus");
      fetchAll();
    } catch (error: any) {
      toast.error("Gagal menghapus tindakan: " + error.message);
    }
  };

  const handleEditJumlah = (tindakan: JenisTindakanInap) => {
    setEditingJumlahId(tindakan.id);
    setEditJumlahValue(tindakan.jumlah || 0);
  };

  const handleSaveJumlah = async (id: string) => {
    try {
      const { error } = await supabase
        .from('jenis_tindakan_inap')
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
      <div className="space-y-3">
        <div>
          <h1 className="text-2xl font-bold">Manajemen Tindakan Inap</h1>
          <p className="text-muted-foreground">Kelola jenis tindakan untuk unit kerja rawat inap</p>
      </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-1 min-w-[240px] max-w-xl">
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
                aria-label="Bersihkan pencarian"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={fetchAll}
              variant="outline"
              className="flex items-center gap-2 text-sky-700 border-sky-200 hover:bg-sky-50"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Perbarui
            </Button>
            <Button
              size="sm"
              onClick={() => handleOpenDialog(unitKerjaList[0])}
              className="bg-sky-600 hover:bg-sky-700 text-white flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Tambah Tindakan
            </Button>
          </div>
        </div>
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
              {searchTerm ? "Tidak ada unit kerja yang cocok dengan pencarian" : "Belum ada data unit kerja rawat inap"}
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
                  <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    onClick={() => handleOpenDialog(unitKerja)}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Tambah Tindakan
                  </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={fetchAll}
                      aria-label="Refresh data"
                    >
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                  </div>
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
                      <TableHeader className="bg-teal-700">
                        <TableRow>
                          <TableHead className="w-[120px] text-white font-semibold">Kode</TableHead>
                          <TableHead className="text-white font-semibold">Nama Tindakan</TableHead>
                          <TableHead className="w-[100px] text-center text-white font-semibold">Jumlah</TableHead>
                          <TableHead className="w-[90px] text-center text-white font-semibold">
                            <div className="flex items-center justify-center gap-1">
                              <Clock className="h-3 w-3" />
                              <span>Waktu</span>
                            </div>
                          </TableHead>
                          <TableHead className="w-[80px] text-center text-white font-semibold">
                            <div className="flex items-center justify-center gap-1">
                              <Star className="h-3 w-3" />
                              <span>Prof.</span>
                            </div>
                          </TableHead>
                          <TableHead className="w-[90px] text-center text-white font-semibold">
                            <div className="flex items-center justify-center gap-1">
                              <AlertTriangle className="h-3 w-3" />
                              <span>Tingkat</span>
                            </div>
                          </TableHead>
                          <TableHead className="w-[120px] text-center text-white font-semibold">
                            <div className="flex items-center justify-center gap-1">
                              <ShoppingCart className="h-3 w-3" />
                              <span>Biaya Bahan</span>
                            </div>
                          </TableHead>
                          <TableHead className="w-[80px] text-center text-white font-semibold">Aksi</TableHead>
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
                                  <Input
                                    type="number"
                                    min="0"
                                    value={editJumlahValue}
                                    onChange={(e) => setEditJumlahValue(parseInt(e.target.value) || 0)}
                                  className="w-16 h-7 text-center mx-auto"
                                    autoFocus
                                  />
                              ) : (
                                  <span className="font-medium">{tindakan.jumlah || 0}</span>
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
                              <div className="flex justify-center gap-2">
                                {editingJumlahId === tindakan.id ? (
                                  <>
                                    <Button
                                      size="icon"
                                      className="h-7 w-7 bg-emerald-500 hover:bg-emerald-600 text-white"
                                      onClick={() => handleSaveJumlah(tindakan.id)}
                                      aria-label="Simpan jumlah"
                                    >
                                      <Check className="h-3 w-3" />
                                    </Button>
                                    <Button
                                      size="icon"
                                      variant="outline"
                                      className="h-7 w-7 border-rose-200 text-rose-500 hover:bg-rose-50"
                                      onClick={handleCancelEditJumlah}
                                      aria-label="Batalkan"
                                    >
                                      <X className="h-3 w-3" />
                                    </Button>
                                  </>
                                ) : (
                                  <Button
                                    size="icon"
                                    className="h-7 w-7 bg-sky-500 hover:bg-sky-600 text-white"
                                    onClick={() => handleEditJumlah(tindakan)}
                                    aria-label="Edit jumlah"
                                  >
                                    <Edit2 className="h-3 w-3" />
                                  </Button>
                                )}
                                <Button
                                  size="icon"
                                  className="h-7 w-7 bg-rose-500 hover:bg-rose-600 text-white"
                                  onClick={() => handleDeleteTindakan(tindakan.id, tindakan.jenis_tindakan)}
                                  aria-label="Hapus tindakan"
                                >
                                  <Trash2 className="h-4 w-4" />
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
                    <div key={`selected-${tindakan.id}`} className="flex items-center gap-2 p-2 bg-background rounded border">
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
                  <li>• Kode Jenis: 2 (Rawat Inap)</li>
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

export default ManajemenTindakanInapFormTable;
