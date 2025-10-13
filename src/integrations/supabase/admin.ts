import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://koepzicdtovtknsqlnac.supabase.co';
const supabaseServiceKey = import.meta.env.VITE_SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtvZXB6aWNkdG92dGtuc3FsbmFjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzMwODU3OCwiZXhwIjoyMDcyODg0NTc4fQ.kNx4t3Q7y6X7bY6X7bY6X7bY6X7bY6X7bY6X7bY6X7bY';

console.log('Supabase Admin URL:', supabaseUrl);
console.log('Supabase Service Key:', supabaseServiceKey ? 'Present' : 'Missing');

// Create admin client with service role key for admin operations
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
});
