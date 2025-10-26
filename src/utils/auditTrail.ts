import { supabase } from '@/integrations/supabase/client';

export interface AuditTrailData {
  action: string;
  table_name?: string;
  record_id?: string;
  old_values?: any;
  new_values?: any;
  description?: string;
}

/**
 * Log audit trail event to database
 * @param data - Audit trail data
 */
export const logAuditTrail = async (data: AuditTrailData): Promise<void> => {
  try {
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.warn('No user found for audit trail logging');
      return;
    }

    // Get user's IP address and user agent from browser
    const ipAddress = await getUserIP();
    const userAgent = navigator.userAgent;

    // Call the audit trail function
    const { error } = await supabase.rpc('log_audit_trail', {
      p_user_id: user.id,
      p_action: data.action,
      p_table_name: data.table_name || null,
      p_record_id: data.record_id || null,
      p_old_values: data.old_values || null,
      p_new_values: data.new_values || null,
      p_description: data.description || null
    });

    if (error) {
      console.error('Error logging audit trail:', error);
      // Don't throw error to avoid breaking the main functionality
    }
  } catch (error) {
    console.error('Error in logAuditTrail:', error);
    // Don't throw error to avoid breaking the main functionality
  }
};

/**
 * Get user's IP address (simplified version)
 * In production, you might want to use a more sophisticated method
 */
const getUserIP = async (): Promise<string | null> => {
  try {
    // This is a simplified approach. In production, you might want to:
    // 1. Get IP from request headers (if available)
    // 2. Use a third-party service
    // 3. Store IP in session/localStorage
    return null; // For now, return null as we don't have server-side access
  } catch (error) {
    console.error('Error getting user IP:', error);
    return null;
  }
};

/**
 * Helper function to log CREATE operations
 */
export const logCreate = async (tableName: string, recordId: string, newValues: any, description?: string) => {
  await logAuditTrail({
    action: 'CREATE',
    table_name: tableName,
    record_id: recordId,
    new_values: newValues,
    description: description || `Created new record in ${tableName}`
  });
};

/**
 * Helper function to log UPDATE operations
 */
export const logUpdate = async (tableName: string, recordId: string, oldValues: any, newValues: any, description?: string) => {
  await logAuditTrail({
    action: 'UPDATE',
    table_name: tableName,
    record_id: recordId,
    old_values: oldValues,
    new_values: newValues,
    description: description || `Updated record in ${tableName}`
  });
};

/**
 * Helper function to log DELETE operations
 */
export const logDelete = async (tableName: string, recordId: string, oldValues: any, description?: string) => {
  await logAuditTrail({
    action: 'DELETE',
    table_name: tableName,
    record_id: recordId,
    old_values: oldValues,
    description: description || `Deleted record from ${tableName}`
  });
};

/**
 * Helper function to log LOGIN operations
 */
export const logLogin = async (description?: string) => {
  await logAuditTrail({
    action: 'LOGIN',
    description: description || 'User logged in'
  });
};

/**
 * Helper function to log LOGOUT operations
 */
export const logLogout = async (description?: string) => {
  await logAuditTrail({
    action: 'LOGOUT',
    description: description || 'User logged out'
  });
};

/**
 * Helper function to log VIEW operations
 */
export const logView = async (tableName: string, description?: string) => {
  await logAuditTrail({
    action: 'VIEW',
    table_name: tableName,
    description: description || `Viewed ${tableName} data`
  });
};

/**
 * Helper function to log EXPORT operations
 */
export const logExport = async (tableName: string, description?: string) => {
  await logAuditTrail({
    action: 'EXPORT',
    table_name: tableName,
    description: description || `Exported ${tableName} data`
  });
};
