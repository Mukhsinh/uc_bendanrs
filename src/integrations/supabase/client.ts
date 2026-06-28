import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

// Validasi environment variables — tampilkan pesan jelas jika tidak ada
if (!supabaseUrl || supabaseUrl === 'undefined') {
  throw new Error(
    'VITE_SUPABASE_URL tidak ditemukan. ' +
    'Pastikan variabel ini sudah diset di Environment Variables Vercel ' +
    '(Settings → Environment Variables).'
  );
}

if (!supabaseAnonKey || supabaseAnonKey === 'undefined') {
  throw new Error(
    'VITE_SUPABASE_ANON_KEY tidak ditemukan. ' +
    'Pastikan variabel ini sudah diset di Environment Variables Vercel ' +
    '(Settings → Environment Variables).'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storageKey: 'pintar_uc_auth',
  },
  db: {
    schema: 'public',
  },
  global: {
    headers: {
      'x-application-name': 'pintar-uc',
    },
  },
  realtime: {
    params: {
      eventsPerSecond: 2,
    },
  },
});

export { createClient };
