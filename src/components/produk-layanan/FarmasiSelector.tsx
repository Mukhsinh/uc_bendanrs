import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Trash2, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface FarmasiItem {
  kode_barang: string;
  nama_barang: string;
  satuan: string;
  harga_satuan: number;
  qty: number;
  harga_total: number;
  subtotal: number; // untuk compatibility dengan trigger
}

interface FarmasiSelectorProps {
  label: string;
  value: FarmasiItem[];
  onChange: (value: FarmasiItem[]) => void;
}

const FarmasiSelector: React.FC<FarmasiSelectorProps> = ({
  label,
  value,
  onChange,
}) => {
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [availableItems, setAvailableItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedItem, setSelectedItem] = useState<string>("");
  const [qty, setQty] = useState<number>(1);
  const [searchQuery, setSearchQuery] = useState<string>("");

  const getTimestamp = (item: any) => {
    const updated = item?.updated_at ? new Date(item.updated_at).getTime() : 0;
    const created = item?.created_at ? new Date(item.created_at).getTime() : 0;
    return Math.max(updated, created);
  };

  const dedupeAndNormalize = (items: any[]) => {
    const map = new Map<string, any>();

    items.forEach((item) => {
      if (!item) return;

      const kode = String(item?.kode_barang || item?.id || "")
        .trim()
        .toUpperCase();
      if (!kode) return;

      const normalized = {
        ...item,
        id: item.id,
        kode_barang: kode,
        nama_barang: (item?.nama_barang || "").trim(),
        satuan: (item?.satuan || "").trim(),
        harga:
          typeof item?.harga === "string"
            ? parseFloat(item.harga) || 0
            : item?.harga ?? 0,
      };

      const existing = map.get(kode);
      if (!existing || getTimestamp(item) >= getTimestamp(existing)) {
        map.set(kode, normalized);
      }
    });

    return Array.from(map.values());
  };

  const fetchItems = async () => {
    try {
      setLoading(true);

      const batchSize = 1000;
      let page = 0;
      let fetchedAll = false;
      const allRows: any[] = [];

      while (!fetchedAll) {
        const from = page * batchSize;
        const to = from + batchSize - 1;

        const { data, error } = await supabase
          .from("data_barang_farmasi")
          .select("id, kode_barang, nama_barang, satuan, harga, created_at, updated_at, gudang")
          .order("updated_at", { ascending: false, nullsFirst: false })
          .range(from, to);

        if (error) throw error;

        if (data && data.length > 0) {
          allRows.push(...data);
          if (data.length < batchSize) {
            fetchedAll = true;
          } else {
            page += 1;
          }
        } else {
          fetchedAll = true;
        }
      }

      const normalized = dedupeAndNormalize(allRows).sort((a, b) =>
        (a?.nama_barang || "").localeCompare(b?.nama_barang || "", "id", {
          sensitivity: "base",
        })
      );

      setAvailableItems(normalized);
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
    if (dialogOpen) {
      fetchItems();
      setSearchQuery(""); // Reset search saat dialog dibuka
    }
  }, [dialogOpen]);

  // Filter items berdasarkan search query
  const filteredItems = availableItems.filter((item) => {
    if (!searchQuery) return true;
    
    const query = searchQuery.toLowerCase();
    const kode = (item.kode_barang || "").toLowerCase();
    const nama = (item.nama_barang || "").toLowerCase();
    
    return kode.includes(query) || nama.includes(query);
  });

  const handleAdd = () => {
    if (!selectedItem) {
      toast({
        title: "Error",
        description: "Pilih barang terlebih dahulu",
        variant: "destructive",
      });
      return;
    }

    if (qty <= 0) {
      toast({
        title: "Error",
        description: "Quantity harus lebih dari 0",
        variant: "destructive",
      });
      return;
    }

    const item = filteredItems.find((i) => i.id === selectedItem);
    if (!item) return;

    // Check if item already exists
    const existingIndex = value.findIndex((v) => v.kode_barang === item.kode_barang);
    
    const hargaSatuan = item.harga || 0;
    const hargaTotal = Math.round(hargaSatuan * qty);

    const newItem: FarmasiItem = {
      kode_barang: item.kode_barang,
      nama_barang: item.nama_barang,
      satuan: item.satuan,
      harga_satuan: hargaSatuan,
      qty,
      harga_total: hargaTotal,
      subtotal: hargaTotal, // sama dengan harga_total untuk compatibility
    };

    if (existingIndex >= 0) {
      // Update existing item
      const newValue = [...value];
      const newQtyTotal = newValue[existingIndex].qty + qty;
      const newHargaTotal = Math.round(newQtyTotal * hargaSatuan);
      newValue[existingIndex] = {
        ...newValue[existingIndex],
        qty: newQtyTotal,
        harga_total: newHargaTotal,
        subtotal: newHargaTotal,
      };
      onChange(newValue);
      
      toast({
        title: "Berhasil",
        description: "Quantity barang berhasil ditambahkan",
      });
    } else {
      // Add new item
      onChange([...value, newItem]);
      
      toast({
        title: "Berhasil",
        description: "Barang berhasil ditambahkan",
      });
    }

    setSelectedItem("");
    setQty(1);
    setSearchQuery("");
    setDialogOpen(false);
  };

  const handleRemove = (index: number) => {
    const newValue = value.filter((_, i) => i !== index);
    onChange(newValue);
  };

  const handleUpdateQty = (index: number, newQty: number) => {
    if (newQty <= 0) return;
    
    const newValue = [...value];
    const newHargaTotal = Math.round(newQty * newValue[index].harga_satuan);
    newValue[index] = {
      ...newValue[index],
      qty: newQty,
      harga_total: newHargaTotal,
      subtotal: newHargaTotal,
    };
    onChange(newValue);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(value);
  };

  const totalBiaya = value.reduce((sum, item) => sum + item.harga_total, 0);

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="border rounded-lg p-4 space-y-2">
        {value.length === 0 ? (
          <div className="text-center text-gray-500 py-4">
            Belum ada barang dipilih
          </div>
        ) : (
          <div className="space-y-2">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Kode Barang</TableHead>
                  <TableHead>Nama Barang</TableHead>
                  <TableHead>Satuan</TableHead>
                  <TableHead className="text-right">Harga Satuan</TableHead>
                  <TableHead className="text-center">Qty</TableHead>
                  <TableHead className="text-right">Harga Total</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {value.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-mono text-sm">{item.kode_barang}</TableCell>
                    <TableCell>{item.nama_barang}</TableCell>
                    <TableCell>{item.satuan}</TableCell>
                    <TableCell className="text-right">{formatCurrency(item.harga_satuan)}</TableCell>
                    <TableCell className="text-center">
                      <Input
                        type="number"
                        min="0.01"
                        step="0.01"
                        value={item.qty}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value);
                          handleUpdateQty(index, Number.isNaN(val) ? 0 : val);
                        }}
                        className="w-20 text-center"
                      />
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      {formatCurrency(item.harga_total)}
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
                <TableRow>
                  <TableCell colSpan={5} className="text-right font-bold">Total:</TableCell>
                  <TableCell className="text-right font-bold">{formatCurrency(totalBiaya)}</TableCell>
                  <TableCell></TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        )}

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Tambah {label}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Pilih {label}</DialogTitle>
              <DialogDescription>
                Pilih barang farmasi dari data master dan tentukan quantity
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {loading ? (
                <div className="text-center py-10">Loading...</div>
              ) : availableItems.length === 0 ? (
                <div className="text-center py-10 text-gray-500">
                  Tidak ada data barang farmasi. Silakan tambahkan data barang terlebih dahulu.
                </div>
              ) : (
                <>
                  <div>
                    <Label htmlFor="search">Cari Barang</Label>
                    <div className="relative">
                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="search"
                        placeholder="Ketik kode atau nama barang..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-8"
                      />
                    </div>
                    {searchQuery && (
                      <p className="text-sm text-muted-foreground mt-1">
                        Ditemukan {filteredItems.length} dari {availableItems.length} barang
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="item">Pilih Barang</Label>
                    <Select value={selectedItem} onValueChange={setSelectedItem}>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih barang farmasi" />
                      </SelectTrigger>
                      <SelectContent>
                        {filteredItems.length === 0 ? (
                          <div className="p-4 text-center text-sm text-muted-foreground">
                            Tidak ada hasil untuk "{searchQuery}"
                          </div>
                        ) : (
                          filteredItems.map((item) => (
                            <SelectItem key={item.id} value={item.id}>
                              {item.kode_barang} - {item.nama_barang} ({item.satuan}) - {formatCurrency(item.harga || 0)}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  {selectedItem && (
                    <>
                      <div>
                        <Label htmlFor="qty">Quantity</Label>
                        <Input
                          id="qty"
                          type="number"
                          min="0.01"
                          step="0.01"
                          value={qty}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value);
                            setQty(Number.isNaN(val) ? 0 : val);
                          }}
                        />
                      </div>

                      <div className="border-t pt-4">
                        {(() => {
                          const item = filteredItems.find((i) => i.id === selectedItem);
                          if (!item) return null;
                          
                          const hargaSatuan = item.harga || 0;
                          const total = Math.round(hargaSatuan * qty);

                          return (
                            <div className="space-y-2">
                              <div className="flex justify-between">
                                <span>Harga Satuan:</span>
                                <span className="font-semibold">{formatCurrency(hargaSatuan)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Satuan:</span>
                                <span className="font-semibold">{item.satuan}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Quantity:</span>
                                <span className="font-semibold">{qty} {item.satuan}</span>
                              </div>
                              <div className="border-t pt-2 flex justify-between text-lg">
                                <span className="font-bold">Total:</span>
                                <span className="font-bold text-green-600">{formatCurrency(total)}</span>
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    </>
                  )}
                </>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Batal
              </Button>
              <Button onClick={handleAdd} disabled={!selectedItem}>
                Tambah
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default FarmasiSelector;

