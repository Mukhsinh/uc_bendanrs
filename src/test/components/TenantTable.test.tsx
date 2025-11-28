import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import TenantTable from '@/components/ManajemenAkses/TenantTable';
import type { Tenant } from '@/types/tenant-management';

// Mock data
const mockTenants: Tenant[] = [
  {
    id: '1',
    name: 'RS Test 1',
    slug: 'rs-test-1',
    logo_url: null,
    is_active: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    metadata: {},
    user_count: 5
  },
  {
    id: '2',
    name: 'RS Test 2',
    slug: 'rs-test-2',
    logo_url: null,
    is_active: false,
    created_at: '2024-01-02T00:00:00Z',
    updated_at: '2024-01-02T00:00:00Z',
    metadata: {},
    user_count: 3
  }
];

describe('TenantTable', () => {
  const mockOnToggleExpand = vi.fn();
  const mockOnToggleStatus = vi.fn();
  const mockOnRefetch = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render table with tenant data', () => {
    render(
      <TenantTable
        tenants={mockTenants}
        isLoading={false}
        expandedTenantId={null}
        onToggleExpand={mockOnToggleExpand}
        onToggleStatus={mockOnToggleStatus}
        onRefetch={mockOnRefetch}
      />
    );

    // Check if tenant names are rendered
    expect(screen.getByText('RS Test 1')).toBeInTheDocument();
    expect(screen.getByText('RS Test 2')).toBeInTheDocument();

    // Check if slugs are rendered
    expect(screen.getByText('rs-test-1')).toBeInTheDocument();
    expect(screen.getByText('rs-test-2')).toBeInTheDocument();

    // Check if user counts are rendered
    expect(screen.getByText('5 user')).toBeInTheDocument();
    expect(screen.getByText('3 user')).toBeInTheDocument();
  });

  it('should display loading state', () => {
    render(
      <TenantTable
        tenants={[]}
        isLoading={true}
        expandedTenantId={null}
        onToggleExpand={mockOnToggleExpand}
        onToggleStatus={mockOnToggleStatus}
        onRefetch={mockOnRefetch}
      />
    );

    // Check for loading spinner
    const loader = screen.getByRole('status', { hidden: true });
    expect(loader).toBeInTheDocument();
  });

  it('should display empty state when no tenants', () => {
    render(
      <TenantTable
        tenants={[]}
        isLoading={false}
        expandedTenantId={null}
        onToggleExpand={mockOnToggleExpand}
        onToggleStatus={mockOnToggleStatus}
        onRefetch={mockOnRefetch}
      />
    );

    expect(screen.getByText('Tidak ada tenant')).toBeInTheDocument();
  });

  it('should call onToggleExpand when row is clicked', async () => {
    render(
      <TenantTable
        tenants={mockTenants}
        isLoading={false}
        expandedTenantId={null}
        onToggleExpand={mockOnToggleExpand}
        onToggleStatus={mockOnToggleStatus}
        onRefetch={mockOnRefetch}
      />
    );

    // Click on first tenant row
    const firstRow = screen.getByText('RS Test 1').closest('tr');
    if (firstRow) {
      fireEvent.click(firstRow);
    }

    await waitFor(() => {
      expect(mockOnToggleExpand).toHaveBeenCalledWith('1');
    });
  });

  it('should call onToggleExpand with null when expanded row is clicked', async () => {
    render(
      <TenantTable
        tenants={mockTenants}
        isLoading={false}
        expandedTenantId="1"
        onToggleExpand={mockOnToggleExpand}
        onToggleStatus={mockOnToggleStatus}
        onRefetch={mockOnRefetch}
      />
    );

    // Click on expanded tenant row
    const firstRow = screen.getByText('RS Test 1').closest('tr');
    if (firstRow) {
      fireEvent.click(firstRow);
    }

    await waitFor(() => {
      expect(mockOnToggleExpand).toHaveBeenCalledWith(null);
    });
  });

  it('should call onToggleStatus when status switch is clicked', async () => {
    render(
      <TenantTable
        tenants={mockTenants}
        isLoading={false}
        expandedTenantId={null}
        onToggleExpand={mockOnToggleExpand}
        onToggleStatus={mockOnToggleStatus}
        onRefetch={mockOnRefetch}
      />
    );

    // Find all switch elements (status toggles)
    const switches = screen.getAllByRole('switch');
    
    // Click first switch (active tenant)
    fireEvent.click(switches[0]);

    await waitFor(() => {
      expect(mockOnToggleStatus).toHaveBeenCalledWith('1', true);
    });
  });

  it('should display correct status for active and inactive tenants', () => {
    render(
      <TenantTable
        tenants={mockTenants}
        isLoading={false}
        expandedTenantId={null}
        onToggleExpand={mockOnToggleExpand}
        onToggleStatus={mockOnToggleStatus}
        onRefetch={mockOnRefetch}
      />
    );

    // Check switches state
    const switches = screen.getAllByRole('switch');
    
    // First tenant is active
    expect(switches[0]).toBeChecked();
    
    // Second tenant is inactive
    expect(switches[1]).not.toBeChecked();
  });

  it('should format dates correctly', () => {
    render(
      <TenantTable
        tenants={mockTenants}
        isLoading={false}
        expandedTenantId={null}
        onToggleExpand={mockOnToggleExpand}
        onToggleStatus={mockOnToggleStatus}
        onRefetch={mockOnRefetch}
      />
    );

    // Check if dates are formatted (Indonesian locale)
    expect(screen.getByText(/1\/1\/2024/)).toBeInTheDocument();
    expect(screen.getByText(/2\/1\/2024/)).toBeInTheDocument();
  });

  it('should render settings button for each tenant', () => {
    render(
      <TenantTable
        tenants={mockTenants}
        isLoading={false}
        expandedTenantId={null}
        onToggleExpand={mockOnToggleExpand}
        onToggleStatus={mockOnToggleStatus}
        onRefetch={mockOnRefetch}
      />
    );

    // Check for settings buttons (should be 2, one for each tenant)
    const settingsButtons = screen.getAllByRole('button', { name: /settings/i });
    expect(settingsButtons).toHaveLength(2);
  });
});
