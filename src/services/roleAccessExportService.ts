import type { MatrixData, Role, AccessLevel } from './roleAccessService';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface ExportOptions {
  filename?: string;
  includeTimestamp?: boolean;
  title?: string;
}

// ============================================================================
// PDF EXPORT
// ============================================================================

/**
 * Export access matrix to PDF format
 * @param data Matrix data to export
 * @param roles Array of roles
 * @param options Export options
 */
export const exportToPDF = async (
  data: MatrixData[],
  roles: Role[],
  options: ExportOptions = {}
): Promise<void> => {
  try {
    // Dynamic import untuk menghindari error saat module belum terinstall
    const jsPDF = (await import('jspdf')).default;
    const { default: autoTable } = await import('jspdf-autotable');
    
    const {
      filename = 'role-access-matrix',
      includeTimestamp = true,
      title = 'Matriks Akses Role'
    } = options;

    // Create PDF document in landscape mode
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    });

    // Add title
    doc.setFontSize(16);
    doc.text(title, 14, 15);

    // Add generation date
    if (includeTimestamp) {
      doc.setFontSize(10);
      doc.text(`Dibuat: ${new Date().toLocaleString('id-ID')}`, 14, 22);
    }

    // Prepare table data
    const headers = ['Menu', ...roles.map(r => r.role_name)];
    const rows = data.map(item => {
      const row = [item.menu.name];
      roles.forEach(role => {
        const access = item.accessByRole.get(role.id);
        row.push(getAccessIndicatorText(access));
      });
      return row;
    });

    // Generate table
    autoTable(doc, {
      head: [headers],
      body: rows,
      startY: includeTimestamp ? 28 : 22,
      theme: 'grid',
      styles: {
        fontSize: 8,
        cellPadding: 2
      },
      headStyles: {
        fillColor: [99, 102, 241], // Indigo
        textColor: 255,
        fontStyle: 'bold'
      },
      columnStyles: {
        0: { cellWidth: 50, fontStyle: 'bold' }
      }
    });

    // Generate filename with timestamp
    const timestamp = includeTimestamp ? `_${formatDateForFilename(new Date())}` : '';
    const finalFilename = `${filename}${timestamp}.pdf`;

    // Save PDF
    doc.save(finalFilename);
    
    console.log(`PDF exported successfully: ${finalFilename}`);
  } catch (error) {
    console.error('Error exporting to PDF:', error);
    throw new Error('Gagal mengekspor ke PDF. Pastikan library jsPDF terinstall.');
  }
};

// ============================================================================
// EXCEL EXPORT
// ============================================================================

/**
 * Export access matrix to Excel format with multiple sheets
 * @param data Matrix data to export
 * @param roles Array of roles
 * @param options Export options
 */
export const exportToExcel = async (
  data: MatrixData[],
  roles: Role[],
  options: ExportOptions = {}
): Promise<void> => {
  try {
    // Dynamic import
    const XLSX = await import('xlsx');
    
    const {
      filename = 'role-access-matrix',
      includeTimestamp = true,
      title = 'Matriks Akses Role'
    } = options;

    // Create workbook
    const wb = XLSX.utils.book_new();

    // Create summary sheet
    const summaryData = [
      [title],
      [`Dibuat: ${new Date().toLocaleString('id-ID')}`],
      [],
      ['Menu', ...roles.map(r => r.role_name)]
    ];

    data.forEach(item => {
      const row = [item.menu.name];
      roles.forEach(role => {
        const access = item.accessByRole.get(role.id);
        row.push(getAccessIndicatorText(access));
      });
      summaryData.push(row);
    });

    const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, summarySheet, 'Ringkasan');

    // Create detail sheet per role
    roles.forEach(role => {
      const roleData = [
        [`Detail Akses: ${role.role_name}`],
        [],
        ['Menu', 'View', 'Create', 'Update', 'Delete', 'Export', 'Import']
      ];

      data.forEach(item => {
        const access = item.accessByRole.get(role.id);
        if (access) {
          roleData.push([
            item.menu.name,
            access.canView ? 'Ya' : 'Tidak',
            access.canCreate ? 'Ya' : 'Tidak',
            access.canUpdate ? 'Ya' : 'Tidak',
            access.canDelete ? 'Ya' : 'Tidak',
            access.canExport ? 'Ya' : 'Tidak',
            access.canImport ? 'Ya' : 'Tidak'
          ]);
        }
      });

      const roleSheet = XLSX.utils.aoa_to_sheet(roleData);
      XLSX.utils.book_append_sheet(wb, roleSheet, role.role_name.substring(0, 31)); // Excel sheet name limit
    });

    // Generate filename with timestamp
    const timestamp = includeTimestamp ? `_${formatDateForFilename(new Date())}` : '';
    const finalFilename = `${filename}${timestamp}.xlsx`;

    // Save Excel file
    XLSX.writeFile(wb, finalFilename);
    
    console.log(`Excel exported successfully: ${finalFilename}`);
  } catch (error) {
    console.error('Error exporting to Excel:', error);
    throw new Error('Gagal mengekspor ke Excel. Pastikan library XLSX terinstall.');
  }
};

// ============================================================================
// CSV EXPORT
// ============================================================================

/**
 * Export access matrix to CSV format
 * @param data Matrix data to export
 * @param roles Array of roles
 * @param options Export options
 */
export const exportToCSV = (
  data: MatrixData[],
  roles: Role[],
  options: ExportOptions = {}
): void => {
  try {
    const {
      filename = 'role-access-matrix',
      includeTimestamp = true
    } = options;

    // Build CSV content
    const headers = ['Menu', ...roles.map(r => r.role_name)];
    let csvContent = headers.join(',') + '\n';

    data.forEach(item => {
      const row = [escapeCSV(item.menu.name)];
      roles.forEach(role => {
        const access = item.accessByRole.get(role.id);
        row.push(escapeCSV(getAccessIndicatorText(access)));
      });
      csvContent += row.join(',') + '\n';
    });

    // Create Blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    const timestamp = includeTimestamp ? `_${formatDateForFilename(new Date())}` : '';
    const finalFilename = `${filename}${timestamp}.csv`;
    
    link.href = URL.createObjectURL(blob);
    link.download = finalFilename;
    link.click();
    
    // Cleanup
    URL.revokeObjectURL(link.href);
    
    console.log(`CSV exported successfully: ${finalFilename}`);
  } catch (error) {
    console.error('Error exporting to CSV:', error);
    throw new Error('Gagal mengekspor ke CSV');
  }
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get text representation of access level for export
 * @param access Access level object
 * @returns String representation
 */
const getAccessIndicatorText = (access: AccessLevel | undefined): string => {
  if (!access || !access.canView) {
    return '✗ Tidak Ada Akses';
  }
  
  if (access.canCreate && access.canUpdate && access.canDelete) {
    return '✓ Akses Penuh';
  }
  
  if (!access.canCreate && !access.canUpdate && !access.canDelete) {
    return '👁 Hanya Lihat';
  }
  
  return '◐ Akses Sebagian';
};

/**
 * Format date for filename (YYYYMMDD_HHMMSS)
 * @param date Date object
 * @returns Formatted string
 */
const formatDateForFilename = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  
  return `${year}${month}${day}_${hours}${minutes}${seconds}`;
};

/**
 * Escape CSV special characters
 * @param value String value to escape
 * @returns Escaped string
 */
const escapeCSV = (value: string): string => {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
};
