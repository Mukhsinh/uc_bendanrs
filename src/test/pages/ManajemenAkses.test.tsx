import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ManajemenAkses from '@/pages/ManajemenAkses';

// Mock contexts
const mockUser = { id: 'user-1', email: 'test@example.com' };
const mockTenant = { id: 'tenant-1', name: 'RS Test', slug: 'rs-test' };

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({ user: mockUser })
}));

vi.mock('@/contexts/TenantContext', () => ({
  useTenant: () => ({ tenant: mockTenant })
}));

// Mock child components
vi.mock('@/components/ManajemenAkses', () => ({
  TenantManagementTab: () => <div data-testid="tenant-management-tab">Tenant Management Tab</div>,
  UserManagementTab: () => <div data-testid="user-management-tab">User Management Tab</div>
}));

// Create wrapper
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </BrowserRouter>
  );
};

describe('ManajemenAkses', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Super Admin Role', () => {
    beforeEach(() => {
      // Mock super admin user
      vi.mocked(vi.importActual('@/contexts/AuthContext')).useAuth = () => ({
        user: { id: 'super-admin', email: 'mukhsin9@gmail.com' }
      });
    });

    it('should render page title', () => {
      render(<ManajemenAkses />, { wrapper: createWrapper() });
      
      expect(screen.getByText('Manajemen Akses')).toBeInTheDocument();
    });

    it('should display tenant context when available', () => {
      render(<ManajemenAkses />, { wrapper: createWrapper() });
      
      expect(screen.getByText(/Tenant:/)).toBeInTheDocument();
      expect(screen.getByText('RS Test')).toBeInTheDocument();
    });

    it('should render both tabs for super admin', () => {
      render(<ManajemenAkses />, { wrapper: createWrapper() });
      
      expect(screen.getByRole('tab', { name: /Kelola Tenant/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /Kelola User/i })).toBeInTheDocument();
    });

    it('should show Kelola Tenant tab as default for super admin', () => {
      render(<ManajemenAkses />, { wrapper: createWrapper() });
      
      const tenantTab = screen.getByRole('tab', { name: /Kelola Tenant/i });
      expect(tenantTab).toHaveAttribute('data-state', 'active');
    });

    it('should switch to User tab when clicked', async () => {
      render(<ManajemenAkses />, { wrapper: createWrapper() });
      
      const userTab = screen.getByRole('tab', { name: /Kelola User/i });
      fireEvent.click(userTab);

      await waitFor(() => {
        expect(userTab).toHaveAttribute('data-state', 'active');
      });
    });

    it('should render TenantManagementTab content when Kelola Tenant tab is active', () => {
      render(<ManajemenAkses />, { wrapper: createWrapper() });
      
      expect(screen.getByTestId('tenant-management-tab')).toBeInTheDocument();
    });

    it('should render UserManagementTab content when Kelola User tab is active', async () => {
      render(<ManajemenAkses />, { wrapper: createWrapper() });
      
      const userTab = screen.getByRole('tab', { name: /Kelola User/i });
      fireEvent.click(userTab);

      await waitFor(() => {
        expect(screen.getByTestId('user-management-tab')).toBeInTheDocument();
      });
    });
  });

  describe('Tenant Admin Role', () => {
    beforeEach(() => {
      // Mock tenant admin user (not super admin)
      vi.mocked(vi.importActual('@/contexts/AuthContext')).useAuth = () => ({
        user: { id: 'admin-1', email: 'admin@test.com' }
      });
    });

    it('should only render Kelola User tab for tenant admin', () => {
      render(<ManajemenAkses />, { wrapper: createWrapper() });
      
      expect(screen.queryByRole('tab', { name: /Kelola Tenant/i })).not.toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /Kelola User/i })).toBeInTheDocument();
    });

    it('should show Kelola User tab as default for tenant admin', () => {
      render(<ManajemenAkses />, { wrapper: createWrapper() });
      
      const userTab = screen.getByRole('tab', { name: /Kelola User/i });
      expect(userTab).toHaveAttribute('data-state', 'active');
    });

    it('should render UserManagementTab content for tenant admin', () => {
      render(<ManajemenAkses />, { wrapper: createWrapper() });
      
      expect(screen.getByTestId('user-management-tab')).toBeInTheDocument();
    });

    it('should not render TenantManagementTab for tenant admin', () => {
      render(<ManajemenAkses />, { wrapper: createWrapper() });
      
      expect(screen.queryByTestId('tenant-management-tab')).not.toBeInTheDocument();
    });
  });

  describe('Tab Switching', () => {
    beforeEach(() => {
      // Mock super admin for tab switching tests
      vi.mocked(vi.importActual('@/contexts/AuthContext')).useAuth = () => ({
        user: { id: 'super-admin', email: 'mukhsin9@gmail.com' }
      });
    });

    it('should maintain tab state when switching between tabs', async () => {
      render(<ManajemenAkses />, { wrapper: createWrapper() });
      
      // Start with Tenant tab
      expect(screen.getByTestId('tenant-management-tab')).toBeInTheDocument();
      
      // Switch to User tab
      const userTab = screen.getByRole('tab', { name: /Kelola User/i });
      fireEvent.click(userTab);

      await waitFor(() => {
        expect(screen.getByTestId('user-management-tab')).toBeInTheDocument();
        expect(screen.queryByTestId('tenant-management-tab')).not.toBeInTheDocument();
      });

      // Switch back to Tenant tab
      const tenantTab = screen.getByRole('tab', { name: /Kelola Tenant/i });
      fireEvent.click(tenantTab);

      await waitFor(() => {
        expect(screen.getByTestId('tenant-management-tab')).toBeInTheDocument();
        expect(screen.queryByTestId('user-management-tab')).not.toBeInTheDocument();
      });
    });
  });

  describe('Page Header', () => {
    it('should display correct page title', () => {
      render(<ManajemenAkses />, { wrapper: createWrapper() });
      
      const title = screen.getByRole('heading', { name: /Manajemen Akses/i });
      expect(title).toBeInTheDocument();
    });

    it('should display tenant context when tenant is available', () => {
      render(<ManajemenAkses />, { wrapper: createWrapper() });
      
      expect(screen.getByText(/Tenant:/)).toBeInTheDocument();
      expect(screen.getByText('RS Test')).toBeInTheDocument();
    });

    it('should not display tenant context when tenant is null', () => {
      // Mock null tenant
      vi.mocked(vi.importActual('@/contexts/TenantContext')).useTenant = () => ({
        tenant: null
      });

      render(<ManajemenAkses />, { wrapper: createWrapper() });
      
      expect(screen.queryByText(/Tenant:/)).not.toBeInTheDocument();
    });
  });

  describe('Role-Based Rendering', () => {
    it('should correctly identify super admin by email', () => {
      vi.mocked(vi.importActual('@/contexts/AuthContext')).useAuth = () => ({
        user: { id: 'super-admin', email: 'mukhsin9@gmail.com' }
      });

      render(<ManajemenAkses />, { wrapper: createWrapper() });
      
      // Super admin should see both tabs
      expect(screen.getByRole('tab', { name: /Kelola Tenant/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /Kelola User/i })).toBeInTheDocument();
    });

    it('should not identify non-super admin as super admin', () => {
      vi.mocked(vi.importActual('@/contexts/AuthContext')).useAuth = () => ({
        user: { id: 'admin-1', email: 'other@example.com' }
      });

      render(<ManajemenAkses />, { wrapper: createWrapper() });
      
      // Non-super admin should only see User tab
      expect(screen.queryByRole('tab', { name: /Kelola Tenant/i })).not.toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /Kelola User/i })).toBeInTheDocument();
    });

    it('should handle case-sensitive email comparison', () => {
      vi.mocked(vi.importActual('@/contexts/AuthContext')).useAuth = () => ({
        user: { id: 'user-1', email: 'MUKHSIN9@GMAIL.COM' }
      });

      render(<ManajemenAkses />, { wrapper: createWrapper() });
      
      // Email comparison should be case-sensitive, so this should NOT be super admin
      expect(screen.queryByRole('tab', { name: /Kelola Tenant/i })).not.toBeInTheDocument();
    });
  });
});
