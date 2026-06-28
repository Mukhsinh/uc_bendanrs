/**
 * Tenant Data Export Service
 * 
 * Service untuk export data tenant dalam format SQL dump atau JSON.
 * Memastikan hanya data tenant yang di-export dengan filtering ketat.
 */

import { supabase } from '@/integrations/supabase/client';

interface ExportOptions {
  tenantId: string;
  format: 'sql' | 'json';
  tables?: string[];
  includeSettings?: boolean;
}

interface ExportResult {
  success: boolean;
  downloadUrl?: string;
  expiresAt?: Date;
  error?: string;
  exportId?: string;
}

/**
 * Export tenant data ke format yang dipilih
 */
export const exportTenantData = async (
  options: ExportOptions
): Promise<ExportResult> => {
  try {
    const { tenantId, format, tables, includeSettings = true } = options;

    // Validate tenant exists dan user has access
    const { data: tenant, error: tenantError } = await supabase
      .from('tenants')
      .select('id, name, slug')
      .eq('id', tenantId)
      .single();

    if (tenantError || !tenant) {
      return {
        success: false,
        error: 'Tenant tidak ditemukan atau akses ditolak',
      };
    }

    // Generate export ID untuk tracking
    const exportId = `export_${tenantId}_${Date.now()}`;

    // Log export request
    await logExportRequest(tenantId, format, exportId);

    // Determine tables to export
    const tablesToExport = tables || await getDefaultExportTables();

    // Export data based on format
    let exportData: any;
    if (format === 'json') {
      exportData = await exportAsJSON(tenantId, tablesToExport, includeSettings);
    } else {
      exportData = await exportAsSQL(tenantId, tablesToExport, includeSettings);
    }

    // Generate download URL (time-limited)
    const downloadUrl = await generateDownloadUrl(exportData, exportId, format);
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    return {
      success: true,
      downloadUrl,
      expiresAt,
      exportId,
    };
  } catch (error) {
    console.error('Export error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Export gagal',
    };
  }
};

/**
 * Export data sebagai JSON
 */

const exportAsJSON = async (
  tenantId: string,
  tables: string[],
  includeSettings: boolean
): Promise<any> => {
  const exportData: any = {
    metadata: {
      exportDate: new Date().toISOString(),
      tenantId,
      format: 'json',
      version: '1.0',
    },
    data: {},
  };

  for (const table of tables) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .eq('tenant_id', tenantId);

      if (!error && data) {
        exportData.data[table] = data;
      }
    } catch (error) {
      console.warn(`Failed to export table ${table}:`, error);
    }
  }

  // Include tenant settings if requested
  if (includeSettings) {
    const { data: tenant } = await supabase
      .from('tenants')
      .select('*, tenant_settings(*)')
      .eq('id', tenantId)
      .single();

    if (tenant) {
      exportData.tenant = tenant;
    }
  }

  return exportData;
};

/**
 * Export data sebagai SQL dump
 */
const exportAsSQL = async (
  tenantId: string,
  tables: string[],
  includeSettings: boolean
): Promise<string> => {
  let sqlDump = `-- Tenant Data Export\n`;
  sqlDump += `-- Export Date: ${new Date().toISOString()}\n`;
  sqlDump += `-- Tenant ID: ${tenantId}\n\n`;

  // Export tenant info
  if (includeSettings) {
    const { data: tenant } = await supabase
      .from('tenants')
      .select('*')
      .eq('id', tenantId)
      .single();

    if (tenant) {
      sqlDump += `-- Tenant Information\n`;
      sqlDump += generateInsertSQL('tenants', [tenant]);
      sqlDump += `\n`;
    }

    const { data: settings } = await supabase
      .from('tenant_settings')
      .select('*')
      .eq('tenant_id', tenantId)
      .single();

    if (settings) {
      sqlDump += `-- Tenant Settings\n`;
      sqlDump += generateInsertSQL('tenant_settings', [settings]);
      sqlDump += `\n`;
    }
  }

  // Export table data
  for (const table of tables) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .eq('tenant_id', tenantId);

      if (!error && data && data.length > 0) {
        sqlDump += `-- Table: ${table}\n`;
        sqlDump += generateInsertSQL(table, data);
        sqlDump += `\n`;
      }
    } catch (error) {
      console.warn(`Failed to export table ${table}:`, error);
    }
  }

  return sqlDump;
};

/**
 * Generate INSERT SQL statements
 */
const generateInsertSQL = (tableName: string, rows: any[]): string => {
  if (rows.length === 0) return '';

  const columns = Object.keys(rows[0]);
  let sql = '';

  for (const row of rows) {
    const values = columns.map(col => {
      const value = row[col];
      if (value === null) return 'NULL';
      if (typeof value === 'string') return `'${value.replace(/'/g, "''")}'`;
      if (typeof value === 'object') return `'${JSON.stringify(value).replace(/'/g, "''")}'`;
      return value;
    });

    sql += `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${values.join(', ')});\n`;
  }

  return sql;
};

/**
 * Get default tables untuk export
 */
const getDefaultExportTables = async (): Promise<string[]> => {
  return [
    'unit_kerja',
    'data_biaya',
    'data_pendapatan',
    'data_kegiatan',
    'daftar_tindakan',
    'distribusi_biaya_pertama',
    'kalkulasi_diklat',
    'user_profiles',
    'role_akses_aplikasi',
    'menu_items',
    'role_menu_items',
    'user_roles',
  ];
};

/**
 * Generate download URL (simplified - in production use signed URLs)
 */
const generateDownloadUrl = async (
  data: any,
  exportId: string,
  format: string
): Promise<string> => {
  // In production, upload to storage and generate signed URL
  // For now, create blob URL
  const blob = new Blob(
    [typeof data === 'string' ? data : JSON.stringify(data, null, 2)],
    { type: format === 'json' ? 'application/json' : 'text/plain' }
  );

  return URL.createObjectURL(blob);
};

/**
 * Log export request untuk audit
 */
const logExportRequest = async (
  tenantId: string,
  format: string,
  exportId: string
): Promise<void> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    await supabase.from('tenant_audit_log').insert({
      tenant_id: tenantId,
      user_id: user?.id,
      action: 'data_export',
      table_name: 'multiple',
      record_id: exportId,
      new_data: { format, exportId },
    });
  } catch (error) {
    console.warn('Failed to log export request:', error);
  }
};

/**
 * Validate export file untuk import
 */
export const validateExportFile = (file: File): Promise<boolean> => {
  return new Promise((resolve) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;

        if (file.name.endsWith('.json')) {
          const data = JSON.parse(content);
          resolve(!!data.metadata && !!data.data);
        } else if (file.name.endsWith('.sql')) {
          resolve(content.includes('-- Tenant Data Export'));
        } else {
          resolve(false);
        }
      } catch {
        resolve(false);
      }
    };

    reader.readAsText(file);
  });
};
