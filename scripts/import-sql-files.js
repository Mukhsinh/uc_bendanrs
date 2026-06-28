import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.VITE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error('❌ Missing Supabase configuration in environment');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: { persistSession: false }
});

const DATA_DIR = path.join(__dirname, '../public/data 2025');

// Table order for proper foreign key constraints
const TABLE_ORDER = [
    'tenants',
    'tenant_settings',
    'user_roles',
    'user_profiles',
    'users_with_roles',
    'daftar_tindakan',
    'data_barang_farmasi',
    'data_master_barang_farmasi',
    'data_barang_gizi',
    'data_dokter',
    'data_kegiatan',
    'data_kegiatan_transpose',
    'Dasar_Alokasi',
    'analisa_bahan_pemeriksaan',
    'Data_Kamar',
    'data_akomodasi_inap',
    'data_diklat',
    'data_biaya',
    'data_pendapatan',
    'Alokasibiaya pertama dengan JP',
    'Alokasi biaya kedua dengan JP',
    'Alokasi BTL dengan JP',
    'budgeting_bhp_farmasi',
    'budgeting_bhp_farmasi_public',
    'cost_recovery',
    'branding_settings',
    'biaya_preference',
    'audit_trail',
    'api_biaya_endpoints'
];

async function executeSql(sql) {
    // Use rpc to execute SQL
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });
    if (error) {
        console.error('❌ Error executing SQL:', error.message);
        return false;
    }
    return true;
}

async function createExecSqlFunction() {
    // First, create a function to execute SQL (if not exists)
    const createFunctionSql = `
        CREATE OR REPLACE FUNCTION exec_sql(sql_query text)
        RETURNS void
        LANGUAGE plpgsql
        SECURITY DEFINER
        AS $$
        BEGIN
            EXECUTE sql_query;
        END;
        $$;
    `;
    const { error } = await supabase.rpc('exec_sql', { sql_query: createFunctionSql });
    if (error && !error.message.includes('function exec_sql')) {
        // If the function doesn't exist yet, try to create it via a different approach
        console.log('Creating exec_sql function...');
        // We'll use a different approach - let's use the Supabase SQL Editor-like functionality
        // For now, let's just try to execute each INSERT statement directly by reading the file
    }
}

async function importFile(filePath) {
    console.log(`📄 Importing ${path.basename(filePath)}...`);
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Split into individual statements and execute each one
    const statements = content.split(';').map(s => s.trim()).filter(s => s.length > 0);
    
    for (const statement of statements) {
        // Use the Supabase client's SQL execution
        try {
            const { error } = await supabase.rpc('exec_sql', { sql_query: statement + ';' });
            if (error) {
                console.warn(`⚠️  Warning: ${error.message}`);
                // Continue even if there's an error
            }
        } catch (e) {
            console.warn(`⚠️  Exception: ${e.message}`);
        }
    }
    console.log(`✅ Finished ${path.basename(filePath)}`);
}

async function main() {
    console.log('🚀 Starting SQL import...');
    
    // First, try to create the exec_sql function
    await createExecSqlFunction();
    
    // Get all SQL files in order
    const files = fs.readdirSync(DATA_DIR).filter(f => f.endsWith('.sql'));
    
    for (const tableName of TABLE_ORDER) {
        const matchingFiles = files.filter(f => {
            const lowerF = f.toLowerCase();
            return lowerF.includes(tableName.toLowerCase().replace(/\s+/g, '_')) || 
                   lowerF.includes(tableName.toLowerCase().replace(/\s+/g, ''));
        });
        
        for (const file of matchingFiles) {
            await importFile(path.join(DATA_DIR, file));
        }
    }
    
    // Import any remaining files
    const importedFiles = new Set();
    for (const tableName of TABLE_ORDER) {
        const matchingFiles = files.filter(f => {
            const lowerF = f.toLowerCase();
            return lowerF.includes(tableName.toLowerCase().replace(/\s+/g, '_')) || 
                   lowerF.includes(tableName.toLowerCase().replace(/\s+/g, ''));
        });
        matchingFiles.forEach(f => importedFiles.add(f));
    }
    
    const remainingFiles = files.filter(f => !importedFiles.has(f));
    for (const file of remainingFiles) {
        await importFile(path.join(DATA_DIR, file));
    }
    
    console.log('\n🎉 Import complete!');
}

main().catch(console.error);
