import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { usePermissions } from '@/hooks/usePermissions';
import { Trash2, Database, Loader2, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

interface DummyDataCount {
  table_name: string;
  count: number;
}

const TABLES_TO_CHECK = [
  { name: 'data_kegiatan', label: 'Data Kegiatan' },
  { name: 'data_biaya', label: 'Data Biaya' },
  { name: 'data_pendapatan', label: 'Data Pendapatan' },
  { name: 'kalkulasi_biaya_gizi', label: 'Kalkulasi Biaya Gizi' },
  { name: 'kalkulasi_biaya_laboratorium', label: 'Kalkulasi Biaya Laboratorium' },
  { name: 'kalkulasi_biaya_radiologi', label: 'Kalkulasi Biaya Radiologi' },
  { name: 'kalkulasi_bdrs', label: 'Kalkulasi BDRS' },
  { name: 'kalkulasi_biaya_operatif', label: 'Kalkulasi Biaya Operatif' },
  { name: 'kalkulasi_biaya_cathlab', label: 'Kalkulasi Biaya Cathlab' },
  { name: 'kalkulasi_tindakan_inap', label: 'Kalkulasi Tindakan Inap' },
  { name: 'kalkulasi_tindakan_rawat_jalan', label: 'Kalkulasi Tindakan Rawat Jalan' },
  { name: 'skenario_tarif', label: 'Skenario Tarif' },
  { name: 'produk_layanan', label: 'Produk Layanan' },
];

const RSUD_A_TENANT_ID = 'a878b603-090e-4787-9342-578be7572956'; // ID tenant RSUD A

export default function DummyDataManagementTab() {
  const { user } = useAuth();
  const { isSuperAdmin, loading: permissionsLoading } = usePermissions();
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [dataCounts, setDataCounts] = useState<DummyDataCount[]>([]);
  const [selectedTables, setSelectedTables] = useState<Set<string>>(new Set());
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    loadDataCounts();
  }, []);

  const loadDataCounts = async () => {
    if (permissionsLoading) return;
    
    if (!isSuperAdmin()) {
      toast.error('Hanya Super Admin yang dapat mengakses fitur ini');
      return;
    }

    setLoading(true);
    try {

      const counts: DummyDataCount[] = [];
      let total = 0;

      for (const table of TABLES_TO_CHECK) {
        try {
          const { count, error } = await supabase
            .from(table.name)
            .select('*', { count: 'exact', head: true })
            .eq('tenant_id', RSUD_A_TENANT_ID)
            .eq('is_dummy', true);

          if (!error && count !== null && count > 0) {
            counts.push({ table_name: table.name, count });
            total += count;
          }
        } catch (err) {
          console.error(`Error counting ${table.name}:`, err);
        }
      }

      setDataCounts(counts);
      setTotalCount(total);
    } catch (error) {
      console.error('Error loading data counts:', error);
      toast.error('Gagal memuat data dummy');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allTables = new Set(dataCounts.filter(c => c.count > 0).map(c => c.table_name));
      setSelectedTables(allTables);
    } else {
      setSelectedTables(new Set());
    }
  };

  const handleSelectTable = (tableName: string, checked: boolean) => {
    const newSelected = new Set(selectedTables);
    if (checked) {
      newSelected.add(tableName);
    } else {
      newSelected.delete(tableName);
    }
    setSelectedTables(newSelected);
  };

  const handleDelete = async () => {
    if (selectedTables.size === 0) {
      toast.error('Pilih minimal satu tabel untuk dihapus');
      return;
    }

    if (!isSuperAdmin()) {
      toast.error('Hanya Super Admin yang dapat menghapus data dummy');
      return;
    }

    setDeleting(true);
    try {

      let deletedCount = 0;
      const errors: string[] = [];

      for (const tableName of selectedTables) {
        const { error, count } = await supabase
          .from(tableName)
          .delete({ count: 'exact' })
          .eq('tenant_id', RSUD_A_TENANT_ID)
          .eq('is_dummy', true);

        if (error) {
          errors.push(`${tableName}: ${error.message}`);
        } else if (count) {
          deletedCount += count;
        }
      }

      if (errors.length > 0) {
        toast.error(`Beberapa data gagal dihapus: ${errors.join(', ')}`);
      } else {
        toast.success(`Berhasil menghapus ${deletedCount} data dummy dari ${selectedTables.size} tabel`);
      }

      // Refresh data counts
      await loadDataCounts();
      setSelectedTables(new Set());
    } catch (error) {
      console.error('Error deleting dummy data:', error);
      toast.error('Gagal menghapus data dummy');
    } finally {
      setDeleting(false);
    }
  };

  if (permissionsLoading || loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
        <span className="ml-3 text-gray-600">Memuat data dummy...</span>
      </div>
    );
  }

  if (!isSuperAdmin()) {
    return (
      <Alert className="border-red-200 bg-red-50">
        <AlertTriangle className="h-4 w-4 text-red-600" />
        <AlertDescription className="text-red-800">
          Hanya Super Admin yang dapat mengakses fitur ini.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Manajemen Data Dummy - RSUD A
          </CardTitle>
          <CardDescription>
            Fitur ini hanya untuk Super Admin. Hapus data dummy yang telah digunakan untuk testing sistem.
            <br />
            <strong className="text-red-600">PERINGATAN:</strong> Data yang dihapus tidak dapat dikembalikan!
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert className="mb-6 border-orange-200 bg-orange-50">
            <AlertTriangle className="h-4 w-4 text-orange-600" />
            <AlertDescription className="text-orange-800">
              Fitur ini hanya menghapus data dengan flag <code className="bg-orange-100 px-1 rounded">is_dummy = true</code> dari tenant <strong>RSUD A</strong>.
              Data non-dummy dan data dari tenant lain tidak akan terpengaruh.
            </AlertDescription>
          </Alert>

          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold">Ringkasan Data Dummy</h3>
                <p className="text-sm text-gray-600">Total data dummy: <strong>{totalCount}</strong> record</p>
              </div>
              <Badge variant={totalCount > 0 ? "destructive" : "default"} className="text-sm">
                {totalCount > 0 ? `${totalCount} Data Dummy` : 'Tidak Ada Data Dummy'}
              </Badge>
            </div>
          </div>

          {totalCount === 0 ? (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                Tidak ada data dummy yang ditemukan untuk tenant RSUD A.
              </AlertDescription>
            </Alert>
          ) : (
            <>
              <div className="mb-4">
                <div className="flex items-center space-x-2 border-b pb-2">
                  <Checkbox
                    id="select-all"
                    checked={selectedTables.size === dataCounts.filter(c => c.count > 0).length && selectedTables.size > 0}
                    onCheckedChange={handleSelectAll}
                  />
                  <label htmlFor="select-all" className="text-sm font-medium cursor-pointer">
                    Pilih Semua Tabel
                  </label>
                </div>
              </div>

              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <Checkbox
                          checked={selectedTables.size === dataCounts.filter(c => c.count > 0).length && selectedTables.size > 0}
                          onCheckedChange={handleSelectAll}
                        />
                      </TableHead>
                      <TableHead>Nama Tabel</TableHead>
                      <TableHead className="text-right">Jumlah Data Dummy</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dataCounts
                      .filter(c => c.count > 0)
                      .map((item) => {
                        const tableInfo = TABLES_TO_CHECK.find(t => t.name === item.table_name);
                        return (
                          <TableRow key={item.table_name}>
                            <TableCell>
                              <Checkbox
                                checked={selectedTables.has(item.table_name)}
                                onCheckedChange={(checked) => handleSelectTable(item.table_name, checked as boolean)}
                              />
                            </TableCell>
                            <TableCell className="font-medium">
                              {tableInfo?.label || item.table_name}
                            </TableCell>
                            <TableCell className="text-right">
                              <Badge variant="secondary">{item.count} record</Badge>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                  </TableBody>
                </Table>
              </div>

              {selectedTables.size > 0 && (
                <div className="mt-6 flex justify-end">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" disabled={deleting}>
                        <Trash2 className="h-4 w-4 mr-2" />
                        Hapus {selectedTables.size} Tabel ({dataCounts
                          .filter(c => selectedTables.has(c.table_name))
                          .reduce((sum, c) => sum + c.count, 0)} record)
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Konfirmasi Penghapusan Data Dummy</AlertDialogTitle>
                        <AlertDialogDescription className="space-y-2">
                          <p>Anda yakin ingin menghapus data dummy dari tabel berikut?</p>
                          <ul className="list-disc list-inside space-y-1 text-sm">
                            {Array.from(selectedTables).map(tableName => {
                              const tableInfo = TABLES_TO_CHECK.find(t => t.name === tableName);
                              const count = dataCounts.find(c => c.table_name === tableName)?.count || 0;
                              return (
                                <li key={tableName}>
                                  <strong>{tableInfo?.label || tableName}</strong>: {count} record
                                </li>
                              );
                            })}
                          </ul>
                          <p className="text-red-600 font-semibold mt-4">
                            PERINGATAN: Tindakan ini tidak dapat dibatalkan!
                          </p>
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel disabled={deleting}>Batal</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={handleDelete}
                          disabled={deleting}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          {deleting ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Menghapus...
                            </>
                          ) : (
                            'Ya, Hapus Data'
                          )}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

