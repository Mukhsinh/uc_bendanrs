import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Database, CheckCircle } from 'lucide-react';

export default function TestDasarAlokasi() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Test Halaman Dasar Alokasi
          </CardTitle>
          <CardDescription>
            Halaman ini untuk memverifikasi bahwa routing dan komponen berfungsi dengan baik
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2 text-green-600">
            <CheckCircle className="h-4 w-4" />
            <span>Halaman Dasar Alokasi berhasil dimuat!</span>
          </div>
          
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-semibold text-blue-900 mb-2">Langkah Selanjutnya:</h3>
            <ol className="list-decimal list-inside space-y-1 text-blue-800">
              <li>Jalankan script SQL di Supabase: <code className="bg-blue-100 px-1 rounded">create-dasar-alokasi-table-fixed.sql</code></li>
              <li>Pastikan tabel <code className="bg-blue-100 px-1 rounded">Dasar_Alokasi</code> dan <code className="bg-blue-100 px-1 rounded">Distribusi_Biaya</code> sudah dibuat</li>
              <li>Pastikan ada data di tabel <code className="bg-blue-100 px-1 rounded">unit_kerja</code> dan <code className="bg-blue-100 px-1 rounded">Data_Kegiatan</code></li>
              <li>Kembali ke halaman Dasar Alokasi untuk menguji fitur lengkap</li>
            </ol>
          </div>

          <div className="flex gap-2">
            <Button 
              onClick={() => window.location.href = '/dasar-alokasi'}
              className="flex items-center gap-2"
            >
              <Database className="h-4 w-4" />
              Ke Halaman Dasar Alokasi
            </Button>
            <Button 
              onClick={() => window.location.href = '/distribusi-biaya'}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Database className="h-4 w-4" />
              Ke Halaman Distribusi Biaya
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
