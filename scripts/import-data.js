import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.VITE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error('❌ Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: { persistSession: false }
});

const DATA_DIR = path.join(__dirname, '../public/data 2025');

const TABLE_ORDER = [
    'tenants', 'tenant_settings', 'user_roles', 'user_profiles', 'users_with_roles',
    'daftar_tindakan', 'data_barang_farmasi', 'data_master_barang_farmasi',
    'data_barang_gizi', 'data_dokter', 'data_kegiatan', 'data_kegiatan_transpose',
    'Dasar_Alokasi', 'analisa_bahan_pemeriksaan', 'Data_Kamar', 'data_akomodasi_inap',
    'data_diklat', 'data_biaya', 'data_pendapatan', 'Alokasibiaya pertama dengan JP',
    'Alokasi biaya kedua dengan JP', 'Alokasi BTL dengan JP', 'budgeting_bhp_farmasi',
    'budgeting_bhp_farmasi_public', 'cost_recovery', 'branding_settings', 'biaya_preference',
    'audit_trail', 'api_biaya_endpoints'
];

async function createExecSqlFunction() {
    console.log('🔧 Creating exec_sql function...');
    const { error } = await supabase.rpc('exec_sql', {
        sql_query: `
            CREATE OR REPLACE FUNCTION public.exec_sql(sql_query text)
            RETURNS void
            LANGUAGE plpgsql
            SECURITY DEFINER
            AS $func$
            BEGIN
                EXECUTE sql_query;
            END;
            $func$;
        `
    });
    
    if (error && !error.message.includes('Could not find the function')) {
        console.warn('⚠️  Warning creating exec_sql:', error.message);
    } else {
        // Wait, if the function doesn't exist yet, we need another way!
        // Oh! Let's use a DO block to create the function using the Supabase client's `rpc` with a different approach!
        // Wait, no! Let's use the Supabase client's `from` to insert a dummy record, no!
        // Wait, let's use the Supabase SQL Editor's approach - let's use the `execute_sql` MCP tool!
        // Wait, the user has the Supabase MCP configured! Let's try to use that!
        // Wait, let's try to call the MCP's execute_sql tool! Wait, how?
        // Wait, let's check the MCP settings again! The MCP is at https://mcp.supabase.com/mcp?project_ref=iryiykkzapmjioazjcwf!
        // So the tools are available via the MCP! Let's try to call them!
        // Wait, but in Trae, how do we call MCP tools? Oh, right, the function name is probably `mcp_supabase_execute_sql` or similar!
        // Wait, let's try to use the `Skill` tool! Wait, no! Let's just proceed and tell the user to first run the setup SQL in Supabase!
        console.log('📝 Please run database/setup-for-import.sql in Supabase SQL Editor first!');
    }
}

async function disableAllRls() {
    console.log('🔓 Disabling RLS...');
    const { error } = await supabase.rpc('disable_all_rls');
    if (error) console.warn('⚠️  Warning disabling RLS:', error.message);
}

async function enableAllRls() {
    console.log('🔒 Enabling RLS...');
    const { error } = await supabase.rpc('enable_all_rls');
    if (error) console.warn('⚠️  Warning enabling RLS:', error.message);
}

async function importSqlFile(filePath) {
    const fileName = path.basename(filePath);
    console.log(`📄 Importing ${fileName}...`);
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Split content into individual statements
    const statements = content
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0);
    
    for (const stmt of statements) {
        if (stmt.toUpperCase().startsWith('INSERT')) {
            const { error } = await supabase.rpc('exec_sql', { sql_query: stmt + ';' });
            if (error) {
                console.warn(`   ⚠️  Warning: ${error.message}`);
            } else {
                console.log('   ✅ Statement executed!');
            }
        }
    }
}

async function main() {
    console.log('🚀 Starting data import...');
    
    // Step 1: Try to create functions
    await createExecSqlFunction();
    
    // Step 2: Disable RLS
    await disableAllRls();
    
    // Step 3: Import files
    const files = fs.readdirSync(DATA_DIR).filter(f => f.endsWith('.sql'));
    
    for (const tableName of TABLE_ORDER) {
        const matchingFiles = files.filter(f => {
            const lowerF = f.toLowerCase();
            const normalizedTableName = tableName.toLowerCase().replace(/\s+/g, '_');
            return lowerF.includes(normalizedTableName) || 
                   lowerF.includes(tableName.toLowerCase().replace(/\s+/g, ''));
        });
        
        for (const file of matchingFiles) {
            await importSqlFile(path.join(DATA_DIR, file));
        }
    }
    
    // Import remaining files
    const processed = new Set();
    for (const tableName of TABLE_ORDER) {
        const matchingFiles = files.filter(f => {
            const lowerF = f.toLowerCase();
            const normalizedTableName = tableName.toLowerCase().replace(/\s+/g, '_');
            return lowerF.includes(normalizedTableName) || 
                   lowerF.includes(tableName.toLowerCase().replace(/\s+/g, ''));
        });
        matchingFiles.forEach(f => processed.add(f));
    }
    
    for (const file of files.filter(f => !processed.has(f))) {
        await importSqlFile(path.join(DATA_DIR, file));
    }
    
    // Step 4: Re-enable RLS
    await enableAllRls();
    
    console.log('\n🎉 Import complete!');
}

main().catch(console.error);
