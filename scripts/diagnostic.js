import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Simple manual .env parser
function loadEnv() {
    // Try multiple locations
    const locations = [
        path.join(process.cwd(), '.env'),
        path.join(__dirname, '..', '.env'),
        'd:\\Aplikasi Antigravity\\Aplikasi UC Pro\\.env'
    ];

    for (const envPath of locations) {
        if (fs.existsSync(envPath)) {
            console.log(`Loading .env from: ${envPath}`);
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
            break;
        }
    }
}

loadEnv();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials in .env');
    console.log('Environment keys:', Object.keys(process.env).filter(k => k.includes('SUPABASE')));
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDatabase() {
    console.log('--- Checking database ---');

    try {
        // Check tenants
        const { data: tenants, error: tenantsError } = await supabase
            .from('tenants')
            .select('id, name, slug');

        if (tenantsError) {
            console.error('Error fetching tenants:', tenantsError.message);
        } else {
            console.log('Tenants in DB:', JSON.stringify(tenants, null, 2));
        }

        // Check data_kegiatan for 2025
        const { count, error: countError } = await supabase
            .from('data_kegiatan')
            .select('*', { count: 'exact', head: true })
            .eq('tahun', 2025);

        if (countError) {
            console.error('Error counting data_kegiatan:', countError.message);
        } else {
            console.log('Data kegiatan for 2025 count:', count);
        }

        // Check user_profiles
        const { data: users, error: userError } = await supabase
            .from('user_profiles')
            .select('id, email, username')
            .limit(5);

        if (userError) {
            console.error('Error fetching user_profiles:', userError.message);
        } else {
            console.log('Sample users in DB:', JSON.stringify(users, null, 2));
        }

        // Check analisa_bahan_pemeriksaan for 2025
        const { count: analisaCount, error: analisaError } = await supabase
            .from('analisa_bahan_pemeriksaan')
            .select('*', { count: 'exact', head: true })
            .eq('tahun', 2025);

        if (analisaError) {
            console.error('Error counting analisa_bahan_pemeriksaan:', analisaError.message);
        } else {
            console.log('Analisa bahan pemeriksaan for 2025 count:', analisaCount);
        }
    } catch (error) {
        console.error('Unexpected error:', error);
    }
}

checkDatabase();
