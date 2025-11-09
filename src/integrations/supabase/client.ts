import { createClient } from '@supabase/supabase-js';

// Robust Supabase configuration with multiple fallbacks
const getSupabaseConfig = () => {
  // Try multiple sources for configuration
  const envUrl = import.meta.env.VITE_SUPABASE_URL;
  const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  
  // Fallback values (hardcoded for reliability)
  const fallbackUrl = 'https://koepzicdtovtknsqlnac.supabase.co';
  const fallbackKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtvZXB6aWNkdG92dGtuc3FsbmFjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTczMDg1NzgsImV4cCI6MjA3Mjg4NDU3OH0.QUpuIaPDlDVp2LKSJYkBj4z3IY0aJwyCNhOXyVC2Ui0';
  
  const supabaseUrl = envUrl || fallbackUrl;
  const supabaseAnonKey = envKey || fallbackKey;
  
  console.log('🔧 Supabase Configuration Debug:');
  console.log('Environment URL:', envUrl || 'Not found');
  console.log('Environment Key:', envKey ? 'Present' : 'Not found');
  console.log('Final URL:', supabaseUrl);
  console.log('Final Key:', supabaseAnonKey ? 'Present' : 'Missing');
  const usingFallback = !envUrl || !envKey;
  console.log('Using fallback:', usingFallback);

  if (usingFallback) {
    console.warn('⚠️ Supabase fallback credentials sedang digunakan. Set nilai VITE_SUPABASE_URL dan VITE_SUPABASE_ANON_KEY untuk lingkungan produksi.');
  }
  
  return { supabaseUrl, supabaseAnonKey };
};

const { supabaseUrl, supabaseAnonKey } = getSupabaseConfig();

// Validate configuration
if (!supabaseUrl || supabaseUrl === 'undefined') {
  console.error('❌ Supabase URL is missing or invalid:', supabaseUrl);
  throw new Error('supabaseUrl is required. Please check your environment variables.');
}

if (!supabaseAnonKey || supabaseAnonKey === 'undefined') {
  console.error('❌ Supabase Anon Key is missing or invalid');
  throw new Error('supabaseAnonKey is required. Please check your environment variables.');
}

console.log('✅ Supabase configuration validated successfully');

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  db: {
    schema: 'public'
  },
  global: {
    headers: {
      'x-my-custom-header': 'radiologi-app'
    }
  },
  realtime: {
    params: {
      eventsPerSecond: 2
    }
  }
});

export { createClient };