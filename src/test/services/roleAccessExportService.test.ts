import { describe, it, expect, vi, beforeEach } from 'vitest';
import { exportToPDF, exportToExcel, exportToCSV } from '@/services/roleAccessExportService';
import type { MatrixData, Role } from '@/services/roleAccessService';

// Mock jsPDF and dependencies
vi.mock('jspdf', () => ({
  default: vi.fn().mockImplementation(() => ({
    setFontSize: vi.fn(),
    text: vi.fn(),
    save: vi.fn()
  }))
}));

vi.mock('jspdf-autotable', () => ({
  default: vi.fn()
}));

vi.mock('xlsx', () => ({
  utils: {
    book_new: vi.fn(() => ({})),
    aoa_to_sheet: vi.fn(() => ({})),
    book_append_sheet: vi.fn()
  },
  writeFile: vi.fn()
}));

describe('roleAccessExportService', () => {
  const mockRoles: Role[] = [
    { id: 1, role_name: 'Admin', description: '', level: 1, created_at: '' }
  ];

  const mockData: MatrixData[] = [
    {
      menu: { id: 'menu1', name: 'Dashboard', path: '/', parent_id: null, order_index: 1, is_active: true },
      accessByRole: new Map([[1, {
        canView: true,
        canCreate: true,
        canUpdate: true,
        canDelete: true,
        canExport: true,
        canImport: true
      }]])
    }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('exportToPDF', () => {
    it('should export to PDF without errors', () => {
      expect(() => {
        exportToPDF(mockData, mockRoles);
      }).not.toThrow();
    });

    it('should use custom filename', () => {
      expect(() => {
        exportToPDF(mockData, mockRoles, { filename: 'custom-matrix' });
      }).not.toThrow();
    });
  });

  describe('exportToExcel', () => {
    it('should export to Excel without errors', () => {
      expect(() => {
        exportToExcel(mockData, mockRoles);
      }).not.toThrow();
    });
  });

  describe('exportToCSV', () => {
    it('should export to CSV without errors', () => {
      // Mock document.createElement and URL
      global.document.createElement = vi.fn().mockReturnValue({
        href: '',
        download: '',
        click: vi.fn()
      });
      global.URL.createObjectURL = vi.fn().mockReturnValue('blob:url');
      global.URL.revokeObjectURL = vi.fn();

      expect(() => {
        exportToCSV(mockData, mockRoles);
      }).not.toThrow();
    });
  });
});
