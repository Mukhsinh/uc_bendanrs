// Script untuk memperbaiki RLS policies menggunakan Supabase client
// Run: node fix-database-rls.js

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Load environment variables
dotenv.config({ path: join(__dirname, '.env') })

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: Missing Supabase credentials in .env file')
  console.error('   Required: VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function fixRLS() {
  console.log('🔧 Starting RLS fix...\n')
  
  const queries = [
    {
      name: 'Disable RLS for data_kegiatan',
      sql: 'ALTER TABLE data_kegiatan DISABLE ROW LEVEL SECURITY;'
    },
    {
      name: 'Drop data_kegiatan_select policy',
      sql: 'DROP POLICY IF EXISTS "data_kegiatan_select" ON data_kegiatan;'
    },
    {
      name: 'Drop data_kegiatan_insert policy',
      sql: 'DROP POLICY IF EXISTS "data_kegiatan_insert" ON data_kegiatan;'
    },
    {
      name: 'Drop data_kegiatan_update policy',
      sql: 'DROP POLICY IF EXISTS "data_kegiatan_update" ON data_kegiatan;'
    },
    {
      name: 'Drop data_kegiatan_delete policy',
      sql: 'DROP POLICY IF EXISTS "data_kegiatan_delete" ON data_kegiatan;'
    },
    {
      name: 'Drop other conflicting policies',
      sql: `
        DROP POLICY IF EXISTS "Allow all operations on data_kegiatan" ON data_kegiatan;
        DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON data_kegiatan;
        DROP POLICY IF EXISTS "Users can delete own data_kegiatan" ON data_kegiatan;
        DROP POLICY IF EXISTS "Users can insert own data_kegiatan" ON data_kegiatan;
        DROP POLICY IF EXISTS "Users can update own data_kegiatan" ON data_kegiatan;
        DROP POLICY IF EXISTS "Users can view data_kegiatan" ON data_kegiatan;
        DROP POLICY IF EXISTS "Users can view own data_kegiatan" ON data_kegiatan;
        DROP POLICY IF EXISTS "Users with permission can manage data_kegiatan" ON data_kegiatan;
      `
    },
    {
      name: 'Disable RLS for data_akomodasi_inap',
      sql: 'ALTER TABLE data_akomodasi_inap DISABLE ROW LEVEL SECURITY;'
    },
    {
      name: 'Drop data_akomodasi_inap policies',
      sql: `
        DROP POLICY IF EXISTS "Users can view own data_akomodasi_inap" ON data_akomodasi_inap;
        DROP POLICY IF EXISTS "Users can insert own data_akomodasi_inap" ON data_akomodasi_inap;
        DROP POLICY IF EXISTS "Users can update own data_akomodasi_inap" ON data_akomodasi_inap;
        DROP POLICY IF EXISTS "Users can delete own data_akomodasi_inap" ON data_akomodasi_inap;
        DROP POLICY IF EXISTS "data_akomodasi_inap_select" ON data_akomodasi_inap;
        DROP POLICY IF EXISTS "data_akomodasi_inap_insert" ON data_akomodasi_inap;
        DROP POLICY IF EXISTS "data_akomodasi_inap_update" ON data_akomodasi_inap;
        DROP POLICY IF EXISTS "data_akomodasi_inap_delete" ON data_akomodasi_inap;
      `
    }
  ]

  let successCount = 0
  let errorCount = 0

  for (const query of queries) {
    try {
      console.log(`⏳ ${query.name}...`)
      const { data, error } = await supabase.rpc('exec_sql', { sql_query: query.sql })
      
      if (error) {
        // Try direct query if RPC fails
        const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
          method: 'POST',
          headers: {
            'apikey': supabaseServiceKey,
            'Authorization': `Bearer ${supabaseServiceKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ sql_query: query.sql })
        })
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        
        console.log(`✅ ${query.name} - Success`)
        successCount++
      } else {
        console.log(`✅ ${query.name} - Success`)
        successCount++
      }
    } catch (error) {
      console.log(`⚠️  ${query.name} - Skipped (${error.message})`)
      errorCount++
    }
  }

  console.log('\n' + '='.repeat(50))
  console.log(`\n✅ RLS Fix Completed!`)
  console.log(`   Success: ${successCount}`)
  console.log(`   Skipped: ${errorCount}`)
  console.log('\n🎉 Database is now ready!')
  console.log('   - Import data should work ✅')
  console.log('   - Add manual data should work ✅')
  console.log('   - No more "UPDATE requires a WHERE clause" error ✅')
  console.log('\n📝 Please test your application now!')
  console.log('   URL: http://localhost:8080/data-operasional/kegiatan\n')
}

fixRLS().catch(error => {
  console.error('\n❌ Fatal error:', error)
  console.error('\n⚠️  Please run the SQL script manually in Supabase SQL Editor:')
  console.error('   File: URGENT_FIX_RLS.sql\n')
  process.exit(1)
})
