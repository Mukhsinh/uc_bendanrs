#!/usr/bin/env node

/**
 * Script untuk migrasi database dari satu Supabase project ke project lain
 * Usage: node scripts/migrate-database.js --from-project-id=xxx --to-project-id=yyy --from-key=xxx --to-key=yyy
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Parse command line arguments
function parseArgs() {
  const args = process.argv.slice(2);
  const config = {};
  
  args.forEach(arg => {
    const [key, value] = arg.split('=');
    if (key && value) {
      config[key.replace('--', '')] = value;
    }
  });
  
  return config;
}

// Load database setup script
function loadDatabaseSetup() {
  const setupPath = path.join(__dirname, 'database-setup.sql');
  return fs.readFileSync(setupPath, 'utf8');
}

// Load seed data script
function loadSeedData() {
  const seedPath = path.join(__dirname, 'seed-data.sql');
  return fs.readFileSync(seedPath, 'utf8');
}

// Execute SQL script
async function executeSqlScript(supabase, script, scriptName) {
  console.log(`📝 Executing ${scriptName}...`);
  
  try {
    // Split script into individual statements
    const statements = script
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    for (const statement of statements) {
      if (statement.trim()) {
        const { error } = await supabase.rpc('exec_sql', { 
          sql: statement + ';' 
        });
        
        if (error) {
          console.warn(`⚠️  Warning in ${scriptName}:`, error.message);
        }
      }
    }
    
    console.log(`✅ ${scriptName} completed successfully`);
  } catch (error) {
    console.error(`❌ Error executing ${scriptName}:`, error.message);
    throw error;
  }
}

// Backup data from source database
async function backupData(sourceSupabase) {
  console.log('📦 Creating backup from source database...');
  
  const backup = {
    roles: [],
    menuItems: [],
    roleMenuAccess: [],
    unitKerja: [],
    dataKegiatan: []
  };
  
  try {
    // Backup roles
    const { data: roles, error: rolesError } = await sourceSupabase
      .from('role_akses_aplikasi')
      .select('*');
    
    if (rolesError) throw rolesError;
    backup.roles = roles || [];
    
    // Backup menu items
    const { data: menuItems, error: menuError } = await sourceSupabase
      .from('menu_items')
      .select('*');
    
    if (menuError) throw menuError;
    backup.menuItems = menuItems || [];
    
    // Backup role menu access
    const { data: roleMenuAccess, error: rmaError } = await sourceSupabase
      .from('role_menu_items')
      .select('*');
    
    if (rmaError) throw rmaError;
    backup.roleMenuAccess = roleMenuAccess || [];
    
    // Backup unit kerja
    const { data: unitKerja, error: ukError } = await sourceSupabase
      .from('unit_kerja')
      .select('*');
    
    if (ukError) throw ukError;
    backup.unitKerja = unitKerja || [];
    
    // Backup data kegiatan
    const { data: dataKegiatan, error: dkError } = await sourceSupabase
      .from('Data_Kegiatan')
      .select('*');
    
    if (dkError) throw dkError;
    backup.dataKegiatan = dataKegiatan || [];
    
    console.log(`✅ Backup completed: ${backup.roles.length} roles, ${backup.menuItems.length} menus, ${backup.unitKerja.length} units`);
    return backup;
    
  } catch (error) {
    console.error('❌ Error creating backup:', error.message);
    throw error;
  }
}

// Restore data to target database
async function restoreData(targetSupabase, backup) {
  console.log('🔄 Restoring data to target database...');
  
  try {
    // Restore roles
    if (backup.roles.length > 0) {
      const { error: rolesError } = await targetSupabase
        .from('role_akses_aplikasi')
        .upsert(backup.roles, { onConflict: 'role_name' });
      
      if (rolesError) throw rolesError;
      console.log(`✅ Restored ${backup.roles.length} roles`);
    }
    
    // Restore menu items
    if (backup.menuItems.length > 0) {
      const { error: menuError } = await targetSupabase
        .from('menu_items')
        .upsert(backup.menuItems, { onConflict: 'menu_name' });
      
      if (menuError) throw menuError;
      console.log(`✅ Restored ${backup.menuItems.length} menu items`);
    }
    
    // Restore role menu access
    if (backup.roleMenuAccess.length > 0) {
      const { error: rmaError } = await targetSupabase
        .from('role_menu_items')
        .upsert(backup.roleMenuAccess);
      
      if (rmaError) throw rmaError;
      console.log(`✅ Restored ${backup.roleMenuAccess.length} role menu access`);
    }
    
    // Restore unit kerja
    if (backup.unitKerja.length > 0) {
      const { error: ukError } = await targetSupabase
        .from('unit_kerja')
        .upsert(backup.unitKerja, { onConflict: 'kode_unit_kerja' });
      
      if (ukError) throw ukError;
      console.log(`✅ Restored ${backup.unitKerja.length} unit kerja`);
    }
    
    // Restore data kegiatan
    if (backup.dataKegiatan.length > 0) {
      const { error: dkError } = await targetSupabase
        .from('Data_Kegiatan')
        .upsert(backup.dataKegiatan);
      
      if (dkError) throw dkError;
      console.log(`✅ Restored ${backup.dataKegiatan.length} data kegiatan`);
    }
    
    console.log('✅ Data restoration completed successfully');
    
  } catch (error) {
    console.error('❌ Error restoring data:', error.message);
    throw error;
  }
}

// Main migration function
async function migrateDatabase(config) {
  console.log('🚀 Starting database migration...');
  
  // Validate configuration
  const required = ['from-project-id', 'to-project-id', 'from-key', 'to-key'];
  for (const key of required) {
    if (!config[key]) {
      console.error(`❌ Missing required parameter: ${key}`);
      process.exit(1);
    }
  }
  
  // Create Supabase clients
  const sourceSupabase = createClient(
    `https://${config['from-project-id']}.supabase.co`,
    config['from-key']
  );
  
  const targetSupabase = createClient(
    `https://${config['to-project-id']}.supabase.co`,
    config['to-key']
  );
  
  try {
    // Step 1: Setup target database structure
    console.log('🏗️  Setting up target database structure...');
    const setupScript = loadDatabaseSetup();
    await executeSqlScript(targetSupabase, setupScript, 'Database Setup');
    
    // Step 2: Create backup from source
    const backup = await backupData(sourceSupabase);
    
    // Step 3: Restore data to target
    await restoreData(targetSupabase, backup);
    
    // Step 4: Apply seed data
    console.log('🌱 Applying seed data...');
    const seedScript = loadSeedData();
    await executeSqlScript(targetSupabase, seedScript, 'Seed Data');
    
    console.log('🎉 Database migration completed successfully!');
    console.log('\n📋 Next steps:');
    console.log('1. Update your .env file with new Supabase credentials');
    console.log('2. Test the application with the new database');
    console.log('3. Update user roles as needed');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
}

// Run migration if called directly
if (require.main === module) {
  const config = parseArgs();
  migrateDatabase(config).catch(console.error);
}

module.exports = { migrateDatabase, backupData, restoreData };
