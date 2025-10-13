import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://koepzicdtovtknsqlnac.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtvZXB6aWNkdG92dGtuc3FsbmFjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTczMDg1NzgsImV4cCI6MjA3Mjg4NDU3OH0.QUpuIaPDlDVp2LKSJYkBj4z3IY0aJwyCNhOXyVC2Ui0';

console.log('Supabase URL:', supabaseUrl);
console.log('Supabase Anon Key:', supabaseAnonKey ? 'Present' : 'Missing');

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
export { createClient };