import { describe, it, expect, vi, beforeEach } from 'vitest';
import { supabase } from '@/integrations/supabase/client';
import {
  fetchAllRoles,
  fetchVisibleRoles,
  fetchAllMenuItems,
  fetchAllPermissions,
  buildAccessMatrix,
  filterMatrix,
  calculateStatistics,
  getVisibleRoles,
  getAccessLevelType,
  type Role,
  type MenuItem,
  type Permission,
  type AccessLevel
} from '@/services/roleAccessService';

// Mock Supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(),
    rpc: vi.fn()
  }
}));

const mockSupabase = supabase as any;

describe('roleAccessService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('fetchAllRoles', () => {
    it('should fetch roles successfully', async () => {
      const mockRoles: Role[] = [
        { id: 1, role_name: 'Super Admin', description: 'Full access', level: 1, created_at: '2024-01-01' },
        { id: 2, role_name: 'Admin', description: 'Admin access', level: 2, created_at: '2024-01-01' }
      ];

      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: mockRoles,
            error: null
          })
        })
      });

      const result = await fetchAllRoles();
      
      expect(result).toEqual(mockRoles);
      expect(mockSupabase.from).toHaveBeenCalledWith('roles');
    });

    it('should handle database error', async () => {
      const mockError = { message: 'Database connection failed' };
      
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: null,
            error: mockError
          })
        })
      });

      await expect(fetchAllRoles()).rejects.toThrow('Failed to fetch roles');
    });
  });

  describe('buildAccessMatrix', () => {
    it('should build matrix correctly', () => {
      const roles: Role[] = [
        { id: 1, role_name: 'Admin', description: '', level: 1, created_at: '' }
      ];
      
      const menus: MenuItem[] = [
        { id: 'menu1', name: 'Menu 1', path: '/menu1', parent_id: null, order_index: 1, is_active: true }
      ];
      
      const permissions: Permission[] = [
        {
          id: 'perm1',
          role_id: 1,
          menu_id: 'menu1',
          can_view: true,
          can_create: true,
          can_update: false,
          can_delete: false,
          can_export: true,
          can_import: false
        }
      ];

      const matrix = buildAccessMatrix(roles, menus, permissions);
      
      expect(matrix).toHaveLength(1);
      expect(matrix[0].menu.id).toBe('menu1');
      
      const access = matrix[0].accessByRole.get(1);
      expect(access?.canView).toBe(true);
      expect(access?.canCreate).toBe(true);
      expect(access?.canUpdate).toBe(false);
    });
  });

  describe('filterMatrix', () => {
    it('should filter by search query', () => {
      const data = [
        {
          menu: { id: 'menu1', name: 'Dashboard', path: '/', parent_id: null, order_index: 1, is_active: true },
          accessByRole: new Map()
        },
        {
          menu: { id: 'menu2', name: 'Settings', path: '/settings', parent_id: null, order_index: 2, is_active: true },
          accessByRole: new Map()
        }
      ];

      const filtered = filterMatrix(data, 'dash', 'all');
      
      expect(filtered).toHaveLength(1);
      expect(filtered[0].menu.name).toBe('Dashboard');
    });
  });

  describe('calculateStatistics', () => {
    it('should calculate statistics correctly', () => {
      const roles: Role[] = [
        { id: 1, role_name: 'Admin', description: '', level: 1, created_at: '' }
      ];
      
      const data = [
        {
          menu: { id: 'menu1', name: 'Menu 1', path: '/menu1', parent_id: null, order_index: 1, is_active: true },
          accessByRole: new Map([[1, { canView: true, canCreate: true, canUpdate: true, canDelete: true, canExport: true, canImport: true }]])
        },
        {
          menu: { id: 'menu2', name: 'Menu 2', path: '/menu2', parent_id: null, order_index: 2, is_active: true },
          accessByRole: new Map([[1, { canView: true, canCreate: false, canUpdate: false, canDelete: false, canExport: false, canImport: false }]])
        }
      ];

      const stats = calculateStatistics(data, roles);
      
      expect(stats).toHaveLength(1);
      expect(stats[0].accessibleMenus).toBe(2);
      expect(stats[0].fullAccessCount).toBe(1);
      expect(stats[0].readOnlyCount).toBe(1);
    });
  });

  describe('getAccessLevelType', () => {
    it('should return "full" for full access', () => {
      const access: AccessLevel = {
        canView: true,
        canCreate: true,
        canUpdate: true,
        canDelete: true,
        canExport: true,
        canImport: true
      };
      
      expect(getAccessLevelType(access)).toBe('full');
    });

    it('should return "readonly" for read-only access', () => {
      const access: AccessLevel = {
        canView: true,
        canCreate: false,
        canUpdate: false,
        canDelete: false,
        canExport: false,
        canImport: false
      };
      
      expect(getAccessLevelType(access)).toBe('readonly');
    });

    it('should return "none" for no access', () => {
      const access: AccessLevel = {
        canView: false,
        canCreate: false,
        canUpdate: false,
        canDelete: false,
        canExport: false,
        canImport: false
      };
      
      expect(getAccessLevelType(access)).toBe('none');
    });
  });
});
