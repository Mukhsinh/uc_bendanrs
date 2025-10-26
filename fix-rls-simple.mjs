#!/usr/bin/env node

// Simple script to fix RLS using Supabase REST API
import { readFileSync } from 'fs'

// Read .env file
const envContent = readFileSync('.env', 'utf-8')
const envVars = {}
envContent.split('\n').forEach(line => {
  const [key, ...valueParts] = line.split('=')
  if (key && valueParts.length > 0) {
    envVars[key.trim()] = valueParts.join('=').trim().replace(/['"]/g, '')
  }
})

const SUPABASE_URL = envVars.VITE_SUPABASE_URL
const SUPABASE_KEY = envVars.VITE_SUPABASE_ANON_KEY

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Missing Supabase credentials in .env file')
  process.exit(1)
}

console.log('🔧 Fixing RLS policies via Supabase API...\n')

const sqlQueries = [
  'ALTER TABLE data_kegiatan DISABLE ROW LEVEL SECURITY;',
  'ALTER TABLE data_akomodasi_inap DISABLE ROW LEVEL SECURITY;',
  'DROP POLICY IF EXISTS "data_kegiatan_select" ON data_kegiatan;',
  'DROP POLICY IF EXISTS "data_kegiatan_insert" ON data_kegiatan;',
  'DROP POLICY IF EXISTS "data_kegiatan_update" ON data_kegiatan;',
  'DROP POLICY IF EXISTS "data_kegiatan_delete" ON data_kegiatan;',
]

console.log('⚠️  Note: Direct SQL execution via REST API requires service role key.')
console.log('⚠️  This script will attempt to connect but may fail without proper permissions.\n')

console.log('📋 SQL Commands to execute:\n')
sqlQueries.forEach((sql, i) => {
  console.log(`${i + 1}. ${sql}`)
})

console.log('\n' + '='.repeat(60))
console.log('\n❌ IMPORTANT: This script cannot execute SQL directly.')
console.log('✅ SOLUTION: Please run the following commands in Supabase SQL Editor:\n')

console.log('--- COPY THIS TO SUPABASE SQL EDITOR ---\n')
console.log(sqlQueries.join('\n'))
console.log('\n--- END ---\n')

console.log('📝 Steps:')
console.log('1. Go to https://supabase.com')
console.log('2. Open your project')
console.log('3. Click "SQL Editor" in sidebar')
console.log('4. Paste the SQL commands above')
console.log('5. Click "Run" button')
console.log('6. Verify success message\n')

console.log('🎯 After running the SQL, test your app at:')
console.log('   http://localhost:8080/data-operasional/kegiatan\n')

