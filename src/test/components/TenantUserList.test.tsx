import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import TenantUserList from '@/components/ManajemenAkses/TenantUserList';
import * as tenantManagement from '@/services/tenantManagement';
import type { UserWithRole } from '@/types/tenant-management';

// Mock data
const mockUsers: UserWithRole[] = [
  {
    id: 'user-1',
    email: 'admin@test.com',
    created_at: '2024-01-01T00:00:00Z',
    last_sign_in_at: '2024-01-15T10:00:00Z',
    full_name: 'Admin User',
    phone: '081234567890',
    tenant_id: 'tenant-1',
    role_id: 1,
    role_name: 'Admin',
    role_is_active: true
  },
  {
    id: 'user-2',
    email: 'user@test.com',
    created_at: '2024-01-02T00:00:00Z',
    last_sign_in_at: null,
    full_name: 'Regular User',
    phone: null,
    tenant_id: 'tenant-1',
    role_id: 2,
    role_name: 'User',
    role_is_active: false
  }
];

// Create a wrapper with QueryClient
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('TenantUserList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render user list with data', async () => {
    // Mock fetchUsersByTenant
    vi.spyOn(tenantManagement, 'fetchUsersByTenant').mockResolvedValue(mockUsers);

    render(<TenantUserList tenantId="tenant-1" />, { wrapper: createWrapper() });

    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText('admin@test.com')).toBeInTheDocument();
      expect(screen.getByText('user@test.com')).toBeInTheDocument();
    });

    // Check if names are rendered
    expect(screen.getByText('Admin User')).toBeInTheDocument();
    expect(screen.getByText('Regular User')).toBeInTheDocument();

    // Check if roles are rendered
    expect(screen.getByText('Admin')).toBeInTheDocument();
    expect(screen.getByText('User')).toBeInTheDocument();
  });

  it('should display loading state', () => {
    // Mock fetchUsersByTenant with a never-resolving promise
    vi.spyOn(tenantManagement, 'fetchUsersByTenant').mockImplementation(
      () => new Promise(() => {})
    );

    render(<TenantUserList tenantId="tenant-1" />, { wrapper: createWrapper() });

    // Check for loading spinner
    expect(screen.getByRole('status', { hidden: true })).toBeInTheDocument();
  });

  it('should display empty state when no users', async () => {
    // Mock fetchUsersByTenant with empty array
    vi.spyOn(tenantManagement, 'fetchUsersByTenant').mockResolvedValue([]);

    render(<TenantUserList tenantId="tenant-1" />, { wrapper: createWrapper() });

    // Wait for empty state message
    await waitFor(() => {
      expect(screen.getByText('Tidak ada user')).toBeInTheDocument();
    });
  });

  it('should display role badges with correct styling', async () => {
    vi.spyOn(tenantManagement, 'fetchUsersByTenant').mockResolvedValue(mockUsers);

    render(<TenantUserList tenantId="tenant-1" />, { wrapper: createWrapper() });

    await waitFor(() => {
      const adminBadge = screen.getByText('Admin');
      const userBadge = screen.getByText('User');

      expect(adminBadge).toBeInTheDocument();
      expect(userBadge).toBeInTheDocument();

      // Check if badges have appropriate classes (role color classes)
      expect(adminBadge.className).toContain('bg-');
    });
  });

  it('should display status badges correctly', async () => {
    vi.spyOn(tenantManagement, 'fetchUsersByTenant').mockResolvedValue(mockUsers);

    render(<TenantUserList tenantId="tenant-1" />, { wrapper: createWrapper() });

    await waitFor(() => {
      // Check for "Aktif" badge (first user)
      const aktivBadges = screen.getAllByText('Aktif');
      expect(aktivBadges.length).toBeGreaterThan(0);

      // Check for "Nonaktif" badge (second user)
      const nonaktifBadges = screen.getAllByText('Nonaktif');
      expect(nonaktifBadges.length).toBeGreaterThan(0);
    });
  });

  it('should display user full names or dash if null', async () => {
    const usersWithNullName: UserWithRole[] = [
      {
        ...mockUsers[0],
        full_name: null
      }
    ];

    vi.spyOn(tenantManagement, 'fetchUsersByTenant').mockResolvedValue(usersWithNullName);

    render(<TenantUserList tenantId="tenant-1" />, { wrapper: createWrapper() });

    await waitFor(() => {
      // Should display dash for null full_name
      expect(screen.getByText('-')).toBeInTheDocument();
    });
  });

  it('should call fetchUsersByTenant with correct tenant ID', async () => {
    const fetchSpy = vi.spyOn(tenantManagement, 'fetchUsersByTenant').mockResolvedValue(mockUsers);

    render(<TenantUserList tenantId="test-tenant-123" />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledWith('test-tenant-123');
    });
  });

  it('should handle fetch errors gracefully', async () => {
    // Mock fetchUsersByTenant to throw error
    vi.spyOn(tenantManagement, 'fetchUsersByTenant').mockRejectedValue(
      new Error('Failed to fetch users')
    );

    // Suppress console.error for this test
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(<TenantUserList tenantId="tenant-1" />, { wrapper: createWrapper() });

    // Component should handle error without crashing
    await waitFor(() => {
      // Error state might show empty state or error message
      // Depending on implementation
      expect(screen.queryByRole('status')).not.toBeInTheDocument();
    });

    consoleErrorSpy.mockRestore();
  });

  it('should render table headers correctly', async () => {
    vi.spyOn(tenantManagement, 'fetchUsersByTenant').mockResolvedValue(mockUsers);

    render(<TenantUserList tenantId="tenant-1" />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Email')).toBeInTheDocument();
      expect(screen.getByText('Nama')).toBeInTheDocument();
      expect(screen.getByText('Role')).toBeInTheDocument();
      expect(screen.getByText('Status')).toBeInTheDocument();
    });
  });

  it('should display section title', async () => {
    vi.spyOn(tenantManagement, 'fetchUsersByTenant').mockResolvedValue(mockUsers);

    render(<TenantUserList tenantId="tenant-1" />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('User dalam Tenant')).toBeInTheDocument();
    });
  });
});
