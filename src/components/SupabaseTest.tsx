import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

const SupabaseTest = () => {
  const [status, setStatus] = useState('Menguji koneksi...');
  const [error, setError] = useState(null);
  const [testResults, setTestResults] = useState(null);

  useEffect(() => {
    const testConnection = async () => {
      try {
        // Mencoba mengakses informasi dasar tentang Supabase
        console.log('Supabase URL:', supabase.supabaseUrl);
        
        // Mencoba melakukan permintaan sederhana ke tabel unit_kerja
        const { data, error, count } = await supabase
          .from('unit_kerja')
          .select('*', { count: 'exact' });
        
        if (error) {
          throw error;
        }
        
        setStatus('Koneksi berhasil!');
        setTestResults({
          message: 'Tabel unit_kerja ditemukan',
          rowCount: count || data.length
        });
      } catch (err) {
        console.error('Error:', err);
        setError(err.message);
        setStatus('Koneksi gagal');
      }
    };

    testConnection();
  }, []);

  return (
    <div className="p-4 bg-white rounded-lg shadow-md">
      <h2 className="text-xl font-bold mb-2">Uji Koneksi Supabase</h2>
      <p className="mb-2">Status: {status}</p>
      {error && (
        <div className="text-red-500">
          <p>Error: {error}</p>
        </div>
      )}
      {testResults && (
        <div className="mt-2">
          <p>{testResults.message}</p>
          <p>Jumlah data: {testResults.rowCount}</p>
        </div>
      )}
      <div className="mt-4">
        <h3 className="font-semibold">Debug Info:</h3>
        <p>Supabase URL: {import.meta.env.VITE_SUPABASE_URL || 'Tidak ditemukan'}</p>
        <p>Anon Key: {import.meta.env.VITE_SUPABASE_ANON_KEY ? 'Ditemukan' : 'Tidak ditemukan'}</p>
      </div>
    </div>
  );
};

export default SupabaseTest;