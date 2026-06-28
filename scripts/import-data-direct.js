import pkg from 'pg';
const { Client } = pkg;
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Parse Supabase URL to get connection details
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.VITE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error('❌ Missing Supabase configuration in environment');
    process.exit(1);
}

// Extract project ID from URL (e.g., https://xxxxxx.supabase.co → xxxxxx)
const projectId = new URL(SUPABASE_URL).hostname.split('.')[0];

// Connection string - using Supabase's direct DB connection
const connectionString = `postgresql://postgres:${SUPABASE_SERVICE_KEY}@${projectId}.supabase.co:5432/postgres`;

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

async function main() {
    console.log('🚀 Starting direct database import...');
    
    const client = new Client({
        connectionString: connectionString
    });
    
    try {
        await client.connect();
        console.log('✅ Connected to database');
        
        // Get all SQL files
        const files = fs.readdirSync(DATA_DIR).filter(f => f.endsWith('.sql'));
        
        // Process files in order
        for (const tableName of TABLE_ORDER) {
            // Find files matching this table
            const matchingFiles = files.filter(f => {
                const lowerF = f.toLowerCase();
                const normalizedTableName = tableName.toLowerCase().replace(/\s+/g, '_');
                return lowerF.includes(normalizedTableName) || 
                       lowerF.includes(tableName.toLowerCase().replace(/\s+/g, ''));
            });
            
            for (const file of matchingFiles) {
                const filePath = path.join(DATA_DIR, file);
                console.log(`📄 Processing ${file}...`);
                
                const sqlContent = fs.readFileSync(filePath, 'utf8');
                
                try {
                    // Disable RLS temporarily for this table
                    await client.query(`ALTER TABLE IF EXISTS "${tableName}" DISABLE ROW LEVEL SECURITY;`);
                    
                    // Execute the SQL
                    await client.query(sqlContent);
                    console.log(`✅ Successfully imported ${file}`);
                    
                } catch (err) {
                    console.warn(`⚠️  Warning importing ${file}: ${err.message}`);
                    // Continue to next file
                }
            }
        }
        
        // Process any remaining files
        const processedFiles = new Set();
        for (const tableName of TABLE_ORDER) {
            const matchingFiles = files.filter(f => {
                const lowerF = f.toLowerCase();
                const normalizedTableName = tableName.toLowerCase().replace(/\s+/g, '_');
                return lowerF.includes(normalizedTableName) || 
                       lowerF.includes(tableName.toLowerCase().replace(/\s+/g, ''));
            });
            matchingFiles.forEach(f => processedFiles.add(f));
        }
        
        const remainingFiles = files.filter(f => !processedFiles.has(f));
        for (const file of remainingFiles) {
            const filePath = path.join(DATA_DIR, file);
            console.log(`📄 Processing remaining file: ${file}...`);
            const sqlContent = fs.readFileSync(filePath, 'utf8');
            try {
                await client.query(sqlContent);
                console.log(`✅ Successfully imported ${file}`);
            } catch (err) {
                console.warn(`⚠️  Warning importing ${file}: ${err.message}`);
            }
        }
        
        console.log('\n🎉 Import complete!');
        
    } catch (err) {
        console.error('❌ Error:', err);
        process.exit(1);
    } finally {
        await client.end();
        console.log('🔌 Disconnected from database');
    }
}

main().catch(console.error);
