import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function loadEnv() {
    const envPath = 'd:\\Aplikasi Antigravity\\Aplikasi UC Pro\\.env';
    if (fs.existsSync(envPath)) {
        const envContent = fs.readFileSync(envPath, 'utf8');
        envContent.split(/\r?\n/).forEach(line => {
            const match = line.match(/^([^=]+)=(.*)$/);
            if (match) {
                const key = match[1].trim();
                let value = match[2].trim();
                if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
                    value = value.substring(1, value.length - 1);
                }
                process.env[key] = value;
            }
        });
    }
}

loadEnv();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectSchema() {
    console.log('--- Inspecting Schema ---');

    // List all tables using RPC if available, or by querying information_schema
    // Note: Standard Supabase REST API doesn't expose information_schema easily unless allowed via RPC.
    // But we can try to use the 'exec_sql' RPC if it exists (suggested by migrate-database.js)

    const query = `
    SELECT table_name, column_name, data_type 
    FROM information_schema.columns 
    WHERE table_schema = 'public'
    ORDER BY table_name, ordinal_position;
  `;

    const { data, error } = await supabase.rpc('exec_sql', { sql: query });

    if (error) {
        console.error('Error executing schema query via RPC:', error.message);
        console.log('Trying direct table enumeration...');

        // Fallback: Just try to fetch from a few known tables to see if they exist
        const tables = ['tenants', 'data_kegiatan', 'user_profiles', 'users', 'auth.users', 'Data_Kamar', 'data_biaya'];
        for (const table of tables) {
            const { error: tError } = await supabase.from(table).select('*').limit(0);
            if (tError) {
                console.log(`Table ${table}: NOT FOUND or Error: ${tError.message}`);
            } else {
                console.log(`Table ${table}: EXISTS`);
            }
        }
    } else {
        // Group by table
        const tables = {};
        data.forEach(row => {
            if (!tables[row.table_name]) tables[row.table_name] = [];
            tables[row.table_name].push(`${row.column_name} (${row.data_type})`);
        });
        console.log('Tables and Columns:', JSON.stringify(tables, null, 2));
    }
}

inspectSchema();
