import { createClient } from '@supabase/supabase-js';
import process from 'process';

// Load environment variables (done via --env-file in Node 22+)
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.VITE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function checkTables() {
    const tables = [
        'tenants',
        'user_roles',
        'analisa_bahan_pemeriksaan',
        'kalkulasi_tindakan_inap',
        'Alokasi',
        'Alokasibiaya',
        'Dasar_Alokasi'
    ];

    console.log('🔍 Checking tables...');

    for (const table of tables) {
        const { data, error } = await supabase.from(table).select('*').limit(1);
        if (error) {
            console.log(`❌ Table "${table}": ${error.message} (${error.code})`);
        } else {
            console.log(`✅ Table "${table}": Found`);
        }
    }
}

checkTables();
