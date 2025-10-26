import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Search, Filter, Download, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface AuditTrailRecord {
  id: string;
  user_id: string;
  action: string;
  table_name: string | null;
  record_id: string | null;
  old_values: any;
  new_values: any;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
  description: string | null;
  user_email?: string;
}

const AuditTrail: React.FC = () => {
  const [auditRecords, setAuditRecords] = useState<AuditTrailRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState<string | undefined>(undefined);
  const [tableFilter, setTableFilter] = useState<string | undefined>(undefined);
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const recordsPerPage = 50;

  const actionTypes = ['CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'VIEW', 'EXPORT'];
  const tableNames = [
    'unit_kerja', 'data_biaya', 'data_kegiatan', 'data_pendapatan', 
    'daftar_tindakan', 'tindakan_laboratorium', 'tindakan_radiologi',
    'tindakan_operatif', 'tindakan_bdrs', 'tindakan_cathlab',
    'menu_gizi', 'data_barang_farmasi', 'data_barang_gizi',
    'distribusi_biaya_pertama', 'distribusi_biaya_kedua', 'distribusi_biaya_rekap',
    'kalkulasi_biaya_gizi', 'kalkulasi_biaya_laboratorium', 'kalkulasi_biaya_radiologi',
    'kalkulasi_bdrs', 'kalkulasi_biaya_operatif', 'kalkulasi_biaya_cathlab',
    'kalkulasi_tindakan_inap', 'kalkulasi_tindakan_rawat_jalan',
    'rekapitulasi_unit_cost', 'skenario_tarif', 'skenario_tarif_akomodasi',
    'produk_layanan', 'budgeting_bhp_farmasi', 'user_roles', 'role_akses_aplikasi'
  ];

  const fetchAuditRecords = async () => {
    try {
      setLoading(true);
      
      // Use direct SQL query that we know works
      const { data, error } = await supabase
        .rpc('get_audit_trail_with_emails', {
          search_term: searchTerm || null,
          action_filter: actionFilter || null,
          table_filter: tableFilter || null,
          date_from: dateFrom ? dateFrom.toISOString() : null,
          date_to: dateTo ? new Date(dateTo.getTime() + 24 * 60 * 60 * 1000 - 1).toISOString() : null,
          page_offset: (currentPage - 1) * recordsPerPage,
          page_limit: recordsPerPage
        });

      if (error) {
        console.error('Error fetching audit records:', error);
        toast.error('Gagal memuat data audit trail: ' + error.message);
        return;
      }

      setAuditRecords(data?.records || []);
      setTotalRecords(data?.total_count || 0);
      setTotalPages(Math.ceil((data?.total_count || 0) / recordsPerPage));

    } catch (error) {
      console.error('Error:', error);
      toast.error('Terjadi kesalahan saat memuat data audit trail');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuditRecords();
  }, [currentPage, searchTerm, actionFilter, tableFilter, dateFrom, dateTo]);

  const getActionBadgeVariant = (action: string) => {
    switch (action) {
      case 'CREATE':
        return 'default';
      case 'UPDATE':
        return 'secondary';
      case 'DELETE':
        return 'destructive';
      case 'LOGIN':
        return 'outline';
      case 'LOGOUT':
        return 'outline';
      case 'VIEW':
        return 'secondary';
      case 'EXPORT':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  const getActionBadgeColor = (action: string) => {
    switch (action) {
      case 'CREATE':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'UPDATE':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'DELETE':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'LOGIN':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'LOGOUT':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'VIEW':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'EXPORT':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatJsonData = (data: any) => {
    if (!data) return '-';
    return JSON.stringify(data, null, 2);
  };

  const exportToCSV = async () => {
    try {
      const { data, error } = await supabase
        .from('audit_trail')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        toast.error('Gagal mengekspor data: ' + error.message);
        return;
      }

      const csvContent = [
        ['ID', 'User ID', 'Email', 'Action', 'Table Name', 'Record ID', 'Description', 'Created At'].join(','),
        ...(data || []).map(record => [
          record.id,
          record.user_id,
          record.user_email || '',
          record.action,
          record.table_name || '',
          record.record_id || '',
          record.description || '',
          new Date(record.created_at).toLocaleString('id-ID')
        ].map(field => `"${field}"`).join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `audit_trail_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success('Data berhasil diekspor');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Gagal mengekspor data');
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setActionFilter(undefined);
    setTableFilter(undefined);
    setDateFrom(undefined);
    setDateTo(undefined);
    setCurrentPage(1);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Audit Trail</h1>
          <p className="text-gray-600 mt-2">
            Log aktivitas sistem dan perubahan data
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={exportToCSV} variant="destructive" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Unduh Laporan
          </Button>
          <Button onClick={fetchAuditRecords} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filter & Pencarian
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Search and Filter Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Pencarian</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Cari action, table, atau deskripsi..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Action</label>
                <Select value={actionFilter || "all"} onValueChange={(value) => setActionFilter(value === "all" ? undefined : value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih action" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Action</SelectItem>
                    {actionTypes.map((action) => (
                      <SelectItem key={action} value={action}>
                        {action}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Table</label>
                <Select value={tableFilter || "all"} onValueChange={(value) => setTableFilter(value === "all" ? undefined : value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih table" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Table</SelectItem>
                    {tableNames.map((table) => (
                      <SelectItem key={table} value={table}>
                        {table}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Date Filter Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Dari Tanggal</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !dateFrom && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateFrom ? format(dateFrom, "dd/MM/yyyy", { locale: id }) : "Pilih tanggal"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={dateFrom}
                      onSelect={setDateFrom}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Sampai Tanggal</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !dateTo && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateTo ? format(dateTo, "dd/MM/yyyy", { locale: id }) : "Pilih tanggal"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={dateTo}
                      onSelect={setDateTo}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>

          <div className="flex justify-end mt-4">
            <Button onClick={clearFilters} variant="outline" size="sm">
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results Summary */}
      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-600">
          Menampilkan {auditRecords.length} dari {totalRecords} record
        </p>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Halaman {currentPage} dari {totalPages}</span>
        </div>
      </div>

      {/* Pagination Controls - Above Table */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mb-4">
          <Button
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            variant="outline"
            size="sm"
          >
            Halaman Sebelumnya
          </Button>
          <span className="text-sm text-gray-600 px-4">
            {currentPage} / {totalPages}
          </span>
          <Button
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
            variant="outline"
            size="sm"
          >
            Halaman Selanjutnya
          </Button>
        </div>
      )}

      {/* Audit Records Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Table</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {auditRecords.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell className="font-mono text-sm">
                      {new Date(record.created_at).toLocaleString('id-ID')}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div className="font-medium">{record.user_id}</div>
                        {record.ip_address && (
                          <div className="text-gray-500 text-xs">{record.ip_address}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div className="font-medium">{record.user_email || '-'}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={getActionBadgeVariant(record.action)}
                        className={getActionBadgeColor(record.action)}
                      >
                        {record.action}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {record.table_name || '-'}
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {record.description || '-'}
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {record.old_values && (
                          <details className="text-xs">
                            <summary className="cursor-pointer text-blue-600 hover:text-blue-800">
                              Old Values
                            </summary>
                            <pre className="mt-1 p-2 bg-gray-50 rounded text-xs overflow-auto max-h-32">
                              {formatJsonData(record.old_values)}
                            </pre>
                          </details>
                        )}
                        {record.new_values && (
                          <details className="text-xs">
                            <summary className="cursor-pointer text-green-600 hover:text-green-800">
                              New Values
                            </summary>
                            <pre className="mt-1 p-2 bg-gray-50 rounded text-xs overflow-auto max-h-32">
                              {formatJsonData(record.new_values)}
                            </pre>
                          </details>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

    </div>
  );
};

export default AuditTrail;
