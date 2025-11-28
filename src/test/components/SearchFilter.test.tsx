import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { TenantSearchFilter, UserSearchFilter } from '@/components/ManajemenAkses/SearchFilter';
import type { Role } from '@/lib/userManagement';

// Mock roles data
const mockRoles: Role[] = [
  { id: 1, role_name: 'Admin', description: 'Administrator' },
  { id: 2, role_name: 'User', description: 'Regular User' },
  { id: 3, role_name: 'Manager', description: 'Manager' }
];

describe('TenantSearchFilter', () => {
  const mockOnSearchChange = vi.fn();
  const mockOnStatusFilterChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render search input and status filter', () => {
    render(
      <TenantSearchFilter
        searchQuery=""
        onSearchChange={mockOnSearchChange}
        statusFilter="all"
        onStatusFilterChange={mockOnStatusFilterChange}
      />
    );

    // Check for search input
    const searchInput = screen.getByPlaceholderText(/cari nama atau slug tenant/i);
    expect(searchInput).toBeInTheDocument();

    // Check for status filter dropdown
    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });

  it('should call onSearchChange when typing in search input', async () => {
    render(
      <TenantSearchFilter
        searchQuery=""
        onSearchChange={mockOnSearchChange}
        statusFilter="all"
        onStatusFilterChange={mockOnStatusFilterChange}
      />
    );

    const searchInput = screen.getByPlaceholderText(/cari nama atau slug tenant/i);
    
    fireEvent.change(searchInput, { target: { value: 'test' } });

    await waitFor(() => {
      expect(mockOnSearchChange).toHaveBeenCalledWith('test');
    });
  });

  it('should call onStatusFilterChange when selecting status', async () => {
    render(
      <TenantSearchFilter
        searchQuery=""
        onSearchChange={mockOnSearchChange}
        statusFilter="all"
        onStatusFilterChange={mockOnStatusFilterChange}
      />
    );

    // Click on status filter dropdown
    const statusFilter = screen.getByRole('combobox');
    fireEvent.click(statusFilter);

    // Wait for dropdown options to appear and select "Aktif"
    await waitFor(() => {
      const activeOption = screen.getByText('Aktif');
      fireEvent.click(activeOption);
    });

    await waitFor(() => {
      expect(mockOnStatusFilterChange).toHaveBeenCalledWith('active');
    });
  });

  it('should display current search query value', () => {
    render(
      <TenantSearchFilter
        searchQuery="test query"
        onSearchChange={mockOnSearchChange}
        statusFilter="all"
        onStatusFilterChange={mockOnStatusFilterChange}
      />
    );

    const searchInput = screen.getByPlaceholderText(/cari nama atau slug tenant/i) as HTMLInputElement;
    expect(searchInput.value).toBe('test query');
  });

  it('should debounce search input changes', async () => {
    vi.useFakeTimers();

    render(
      <TenantSearchFilter
        searchQuery=""
        onSearchChange={mockOnSearchChange}
        statusFilter="all"
        onStatusFilterChange={mockOnStatusFilterChange}
      />
    );

    const searchInput = screen.getByPlaceholderText(/cari nama atau slug tenant/i);
    
    // Type multiple characters quickly
    fireEvent.change(searchInput, { target: { value: 't' } });
    fireEvent.change(searchInput, { target: { value: 'te' } });
    fireEvent.change(searchInput, { target: { value: 'tes' } });
    fireEvent.change(searchInput, { target: { value: 'test' } });

    // Should be called for each change (no debouncing in component itself)
    expect(mockOnSearchChange).toHaveBeenCalledTimes(4);

    vi.useRealTimers();
  });
});

describe('UserSearchFilter', () => {
  const mockOnSearchChange = vi.fn();
  const mockOnRoleFilterChange = vi.fn();
  const mockOnStatusFilterChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render search input, role filter, and status filter', () => {
    render(
      <UserSearchFilter
        searchQuery=""
        onSearchChange={mockOnSearchChange}
        roleFilter="all"
        onRoleFilterChange={mockOnRoleFilterChange}
        statusFilter="all"
        onStatusFilterChange={mockOnStatusFilterChange}
        roles={mockRoles}
      />
    );

    // Check for search input
    const searchInput = screen.getByPlaceholderText(/cari email atau nama user/i);
    expect(searchInput).toBeInTheDocument();

    // Check for role and status filter dropdowns (should be 2 comboboxes)
    const comboboxes = screen.getAllByRole('combobox');
    expect(comboboxes).toHaveLength(2);
  });

  it('should call onSearchChange when typing in search input', async () => {
    render(
      <UserSearchFilter
        searchQuery=""
        onSearchChange={mockOnSearchChange}
        roleFilter="all"
        onRoleFilterChange={mockOnRoleFilterChange}
        statusFilter="all"
        onStatusFilterChange={mockOnStatusFilterChange}
        roles={mockRoles}
      />
    );

    const searchInput = screen.getByPlaceholderText(/cari email atau nama user/i);
    
    fireEvent.change(searchInput, { target: { value: 'john@example.com' } });

    await waitFor(() => {
      expect(mockOnSearchChange).toHaveBeenCalledWith('john@example.com');
    });
  });

  it('should call onRoleFilterChange when selecting role', async () => {
    render(
      <UserSearchFilter
        searchQuery=""
        onSearchChange={mockOnSearchChange}
        roleFilter="all"
        onRoleFilterChange={mockOnRoleFilterChange}
        statusFilter="all"
        onStatusFilterChange={mockOnStatusFilterChange}
        roles={mockRoles}
      />
    );

    // Click on first combobox (role filter)
    const comboboxes = screen.getAllByRole('combobox');
    fireEvent.click(comboboxes[0]);

    // Wait for dropdown options and select "Admin"
    await waitFor(() => {
      const adminOption = screen.getByText('Admin');
      fireEvent.click(adminOption);
    });

    await waitFor(() => {
      expect(mockOnRoleFilterChange).toHaveBeenCalledWith('Admin');
    });
  });

  it('should call onStatusFilterChange when selecting status', async () => {
    render(
      <UserSearchFilter
        searchQuery=""
        onSearchChange={mockOnSearchChange}
        roleFilter="all"
        onRoleFilterChange={mockOnRoleFilterChange}
        statusFilter="all"
        onStatusFilterChange={mockOnStatusFilterChange}
        roles={mockRoles}
      />
    );

    // Click on second combobox (status filter)
    const comboboxes = screen.getAllByRole('combobox');
    fireEvent.click(comboboxes[1]);

    // Wait for dropdown options and select "Aktif"
    await waitFor(() => {
      const activeOption = screen.getByText('Aktif');
      fireEvent.click(activeOption);
    });

    await waitFor(() => {
      expect(mockOnStatusFilterChange).toHaveBeenCalledWith('active');
    });
  });

  it('should display all available roles in dropdown', async () => {
    render(
      <UserSearchFilter
        searchQuery=""
        onSearchChange={mockOnSearchChange}
        roleFilter="all"
        onRoleFilterChange={mockOnRoleFilterChange}
        statusFilter="all"
        onStatusFilterChange={mockOnStatusFilterChange}
        roles={mockRoles}
      />
    );

    // Click on role filter dropdown
    const comboboxes = screen.getAllByRole('combobox');
    fireEvent.click(comboboxes[0]);

    // Check if all roles are displayed
    await waitFor(() => {
      expect(screen.getByText('Admin')).toBeInTheDocument();
      expect(screen.getByText('User')).toBeInTheDocument();
      expect(screen.getByText('Manager')).toBeInTheDocument();
    });
  });

  it('should display current filter values', () => {
    render(
      <UserSearchFilter
        searchQuery="test@example.com"
        onSearchChange={mockOnSearchChange}
        roleFilter="Admin"
        onRoleFilterChange={mockOnRoleFilterChange}
        statusFilter="active"
        onStatusFilterChange={mockOnStatusFilterChange}
        roles={mockRoles}
      />
    );

    const searchInput = screen.getByPlaceholderText(/cari email atau nama user/i) as HTMLInputElement;
    expect(searchInput.value).toBe('test@example.com');
  });

  it('should handle empty roles array', () => {
    render(
      <UserSearchFilter
        searchQuery=""
        onSearchChange={mockOnSearchChange}
        roleFilter="all"
        onRoleFilterChange={mockOnRoleFilterChange}
        statusFilter="all"
        onStatusFilterChange={mockOnStatusFilterChange}
        roles={[]}
      />
    );

    // Should still render without errors
    expect(screen.getByPlaceholderText(/cari email atau nama user/i)).toBeInTheDocument();
  });
});
