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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2, Search, Pill } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface FarmasiItem {
  kode_barang: string;
  nama_barang: string;
  satuan: string;
  harga_satuan: number;
  qty: number;
  harga_total: number;
  subtotal: number;
}

interface FarmasiInputTableProps {
  label: string;
  value: FarmasiItem[];
  onChange: (value: FarmasiItem[]) => void;
  refreshKey: number;
}

const FarmasiInputTable: React.FC<FarmasiInputTableProps> = ({
  label,
  value,
  onChange,
  refreshKey,
}) => {
  const { toast } = useToast();
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

const dedupeByKodeBarang = (items: any[]) => {
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

      const normalized = dedupeByKodeBarang(allRows).sort((a, b) =>
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
    fetchItems();
  }, [refreshKey]);

  // Filter items berdasarkan search query
  const filteredItems = availableItems.filter((item) => {
    if (!searchQuery) return true;
    
    const query = searchQuery.toLowerCase();
    const kode = (item.kode_barang || "").toLowerCase();
    const nama = (item.nama_barang || "").toLowerCase();
    
    return kode.includes(query) || nama.includes(query);
  });

  const handleAddToList = () => {
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
        description: `Quantity ${item.nama_barang} berhasil ditambahkan`,
      });
    } else {
      // Add new item
      const newItem: FarmasiItem = {
        kode_barang: item.kode_barang,
        nama_barang: item.nama_barang,
        satuan: item.satuan,
        harga_satuan: hargaSatuan,
        qty,
        harga_total: hargaTotal,
        subtotal: hargaTotal,
      };
      onChange([...value, newItem]);
      
      toast({
        title: "Berhasil",
        description: `${item.nama_barang} berhasil ditambahkan ke list`,
      });
    }

    // Reset selection, keep search
    setSelectedItem("");
    setQty(1);
  };

  const handleRemove = (index: number) => {
    const newValue = value.filter((_, i) => i !== index);
    onChange(newValue);
  };

  const handleUpdateQty = (index: number, newQty: number) => {
    if (newQty <= 0) {
      toast({
        title: "Error",
        description: "Quantity harus lebih dari 0",
        variant: "destructive",
      });
      return;
    }
    
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
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Pill className="h-5 w-5 text-emerald-700" />
        <Label className="text-base font-semibold">{label}</Label>
        <Badge className="bg-emerald-500 text-white border-emerald-600">
          {value.length} item
        </Badge>
      </div>
      
      {/* Input Section */}
      <div className="border rounded-lg p-4 bg-emerald-50 border-emerald-200 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          {/* Search */}
          <div className="md:col-span-5">
            <Label htmlFor="search" className="text-sm">Cari Barang</Label>
            <div className="relative mt-1">
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
              <p className="text-xs text-muted-foreground mt-1">
                Ditemukan {filteredItems.length} dari {availableItems.length} barang
              </p>
            )}
          </div>

          {/* Select Barang */}
          <div className="md:col-span-4">
            <Label htmlFor="barang" className="text-sm">Pilih Barang</Label>
            <Select value={selectedItem} onValueChange={setSelectedItem}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Pilih barang..." />
              </SelectTrigger>
              <SelectContent>
                {loading ? (
                  <div className="p-4 text-center text-sm">Loading...</div>
                ) : filteredItems.length === 0 ? (
                  <div className="p-4 text-center text-sm text-muted-foreground">
                    {searchQuery ? `Tidak ada hasil untuk "${searchQuery}"` : "Tidak ada data barang farmasi"}
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

          {/* Quantity */}
          <div className="md:col-span-2">
            <Label htmlFor="qty" className="text-sm">Qty</Label>
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
              placeholder="1"
              className="mt-1"
            />
          </div>

          {/* Button Add */}
          <div className="md:col-span-1 flex items-end">
            <Button 
              onClick={handleAddToList} 
              disabled={!selectedItem}
              className="w-full bg-emerald-500 text-white border-emerald-600 hover:bg-emerald-600"
              size="sm"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Preview Selected */}
        {selectedItem && (
          <div className="bg-emerald-50 border-2 border-emerald-200 rounded p-3">
            {(() => {
              const item = filteredItems.find((i) => i.id === selectedItem);
              if (!item) return null;
              
              const hargaSatuan = item.harga || 0;
              const total = Math.round(hargaSatuan * qty);

              return (
                <div className="flex items-center justify-between text-sm">
                  <div>
                    <span className="font-semibold">{item.nama_barang}</span>
                    <span className="text-muted-foreground"> × {qty} {item.satuan}</span>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{formatCurrency(hargaSatuan)} / {item.satuan}</p>
                    <p className="text-emerald-700 font-bold">Total: {formatCurrency(total)}</p>
                  </div>
                </div>
              );
            })()}
          </div>
        )}
      </div>

      {/* Table Display */}
      <div className="border rounded-lg overflow-hidden">
        {value.length === 0 ? (
          <div className="text-center py-8 text-gray-500 bg-emerald-50">
            Belum ada barang ditambahkan. Pilih barang di atas dan klik tombol + untuk menambahkan.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-emerald-50">
                <TableHead className="w-[100px]">Kode</TableHead>
                <TableHead>Nama Barang</TableHead>
                <TableHead className="w-[80px]">Satuan</TableHead>
                <TableHead className="text-right w-[130px]">Harga Satuan</TableHead>
                <TableHead className="text-center w-[100px]">Qty</TableHead>
                <TableHead className="text-right w-[130px]">Total</TableHead>
                <TableHead className="text-right w-[80px]">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {value.map((item, index) => (
                <TableRow key={index} className="hover:bg-gray-50">
                  <TableCell className="font-mono text-sm">{item.kode_barang}</TableCell>
                  <TableCell className="font-medium">{item.nama_barang}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{item.satuan}</TableCell>
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
                    <Button variant="destructive" size="sm" onClick={() => handleRemove(index)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              <TableRow className="bg-emerald-50 font-bold">
                <TableCell colSpan={5} className="text-right">
                  Total Farmasi:
                </TableCell>
                <TableCell className="text-right text-emerald-700 text-lg">
                  {formatCurrency(totalBiaya)}
                </TableCell>
                <TableCell></TableCell>
              </TableRow>
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
};

export default FarmasiInputTable;

