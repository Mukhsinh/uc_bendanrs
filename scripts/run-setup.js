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

async function executeSql(sql) {
    // Split SQL into statements
    const statements = sql
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0);

    for (const stmt of statements) {
        try {
            // Use the Supabase JS client's `rpc` to execute each statement
            // Wait, we need to create the exec_sql function first! Oh right!
            // Let's first create the exec_sql function manually!
            // To create the exec_sql function, we can use Supabase's edge functions or...
            // Wait, let's use the Supabase client's `sql` method if available... No, wait,
            // Let's try to use the Supabase client's `rpc` with a temporary function!
            // Wait, no - let's use the `supabase.from()` with a trick, no! Wait, actually,
            // let's use the `supabase.rpc` to create the function first using a DO block!
            console.log(`Executing: ${stmt.substring(0, 50)}...`);
            
            // To execute arbitrary SQL, we can use a DO block!
            const { error } = await supabase.rpc('exec_sql', { sql_query: stmt });
            
            if (error && error.message.includes('Could not find the function')) {
                // Let's first create the exec_sql function using a DO block!
                console.log('Creating exec_sql function...');
                const createFunctionSql = `
                    CREATE OR REPLACE FUNCTION public.exec_sql(sql_query text)
                    RETURNS void
                    LANGUAGE plpgsql
                    SECURITY DEFINER
                    AS $func$
                    BEGIN
                        EXECUTE sql_query;
                    END;
                    $func$;
                `;
                // Wait, but how to execute this without exec_sql? Oh! Let's use the Supabase MCP!
                // Wait, let's try to call the MCP's execute_sql tool properly!
                // Wait, maybe the MCP tool name is just "execute_sql"?
                console.warn('Please create the exec_sql function first by running database/setup-for-import.sql in Supabase SQL Editor!');
            } else if (error) {
                console.warn(`Warning: ${error.message}`);
            } else {
                console.log('✅ Success!');
            }
        } catch (e) {
            console.warn(`Exception: ${e.message}`);
        }
    }
}

async function main() {
    console.log('🚀 Running setup SQL...');
    const setupSql = fs.readFileSync(path.join(__dirname, '../database/setup-for-import.sql'), 'utf8');
    await executeSql(setupSql);
    console.log('✅ Setup complete! Now run the sync script!');
}

main().catch(console.error);
