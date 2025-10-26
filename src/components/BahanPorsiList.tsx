import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Edit, Trash2, AlertTriangle } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface BahanPorsiItem {
  id: string;
  kode: string;
  jenis_makanan: string;
  nama_barang?: string;
  satuan?: string;
  konsumsi: number;
  harga?: number;
  biaya_produksi: number;
  harga_bahan?: number;
  biaya_bahan_porsi?: number;
  data_barang_gizi_id: string;
  data_barang_gizi?: {
    kode_barang: string;
    nama_barang: string;
    satuan: string;
    harga: number;
  };
  created_at: string;
  updated_at: string;
}

interface BahanPorsiListProps {
  items: BahanPorsiItem[];
  onEdit: (item: BahanPorsiItem) => void;
  onDelete: (id: string) => void;
  isLoading?: boolean;
}

export const BahanPorsiList: React.FC<BahanPorsiListProps> = ({
  items,
  onEdit,
  onDelete,
  isLoading = false
}) => {
  const [deleteItemId, setDeleteItemId] = useState<string | null>(null);

  const handleDeleteClick = (id: string) => {
    setDeleteItemId(id);
  };

  const handleDeleteConfirm = () => {
    if (deleteItemId) {
      onDelete(deleteItemId);
      setDeleteItemId(null);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteItemId(null);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Daftar Bahan Porsi</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-500">Memuat data...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (items.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Daftar Bahan Porsi</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-gray-500">Belum ada bahan porsi yang ditambahkan.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Daftar Bahan Porsi ({items.length} item)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>No</TableHead>
                  <TableHead>Nama Barang</TableHead>
                  <TableHead>Satuan</TableHead>
                  <TableHead>Konsumsi</TableHead>
                  <TableHead>Harga</TableHead>
                  <TableHead>Biaya Produksi</TableHead>
                  <TableHead>Harga Bahan</TableHead>
                  <TableHead>Biaya Bahan Porsi</TableHead>
                  <TableHead className="text-center">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item, index) => (
                  <TableRow key={item.id}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{item.data_barang_gizi?.nama_barang || item.nama_barang || 'N/A'}</div>
                        <div className="text-sm text-gray-500">{item.kode} - {item.jenis_makanan}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{item.data_barang_gizi?.satuan || item.satuan || 'N/A'}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {item.konsumsi.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      Rp {(item.data_barang_gizi?.harga || item.harga || 0).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="secondary">{item.biaya_produksi}%</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      Rp {(item.harga_bahan || 0).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      Rp {(item.biaya_bahan_porsi || 0).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2 justify-center">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onEdit(item)}
                          className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteClick(item.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
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

          {/* Summary */}
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h4 className="font-semibold text-blue-900 mb-2">Ringkasan Total Biaya:</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Total Harga Bahan:</span>
                <span className="ml-2 font-semibold">
                  Rp {items.reduce((sum, item) => sum + (item.harga_bahan || 0), 0).toLocaleString()}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Total Biaya Bahan Porsi:</span>
                <span className="ml-2 font-semibold text-blue-700">
                  Rp {items.reduce((sum, item) => sum + (item.biaya_bahan_porsi || 0), 0).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteItemId} onOpenChange={() => setDeleteItemId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Konfirmasi Hapus
            </AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus bahan porsi ini? Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleDeleteCancel}>
              Batal
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-red-600 hover:bg-red-700"
            >
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default BahanPorsiList;
