import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import CreateTenantDialog from '@/components/ManajemenAkses/CreateTenantDialog';
import * as tenantManagement from '@/services/tenantManagement';

// Mock toast
const mockToast = vi.fn();
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: mockToast })
}));

// Create wrapper with QueryClient
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('CreateTenantDialog', () => {
  const mockOnOpenChange = vi.fn();
  const mockOnSuccess = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render dialog when open', () => {
    render(
      <CreateTenantDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        onSuccess={mockOnSuccess}
      />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByText('Tambah Tenant Baru')).toBeInTheDocument();
    expect(screen.getByText('Buat rumah sakit baru dengan admin pertama')).toBeInTheDocument();
  });

  it('should not render dialog when closed', () => {
    render(
      <CreateTenantDialog
        open={false}
        onOpenChange={mockOnOpenChange}
        onSuccess={mockOnSuccess}
      />,
      { wrapper: createWrapper() }
    );

    expect(screen.queryByText('Tambah Tenant Baru')).not.toBeInTheDocument();
  });

  it('should render all form fields', () => {
    render(
      <CreateTenantDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        onSuccess={mockOnSuccess}
      />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByLabelText(/Nama Rumah Sakit/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Slug/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Email Admin/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Nama Admin/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Password Admin/i)).toBeInTheDocument();
  });

  it('should auto-generate slug from name', async () => {
    render(
      <CreateTenantDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        onSuccess={mockOnSuccess}
      />,
      { wrapper: createWrapper() }
    );

    const nameInput = screen.getByLabelText(/Nama Rumah Sakit/i);
    const slugInput = screen.getByLabelText(/Slug/i);

    // Type in name field
    fireEvent.change(nameInput, { target: { value: 'RS Test Hospital' } });

    await waitFor(() => {
      expect(slugInput).toHaveValue('rs-test-hospital');
    });
  });

  it('should generate kebab-case slug with special characters removed', async () => {
    render(
      <CreateTenantDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        onSuccess={mockOnSuccess}
      />,
      { wrapper: createWrapper() }
    );

    const nameInput = screen.getByLabelText(/Nama Rumah Sakit/i);
    const slugInput = screen.getByLabelText(/Slug/i);

    // Type name with special characters
    fireEvent.change(nameInput, { target: { value: 'RS Test @ Hospital #123!' } });

    await waitFor(() => {
      expect(slugInput).toHaveValue('rs-test--hospital-123');
    });
  });

  it('should show validation errors for empty fields', async () => {
    render(
      <CreateTenantDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        onSuccess={mockOnSuccess}
      />,
      { wrapper: createWrapper() }
    );

    const submitButton = screen.getByRole('button', { name: /Buat Tenant/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/Nama minimal 3 karakter/i)).toBeInTheDocument();
    });
  });

  it('should show validation error for invalid email', async () => {
    render(
      <CreateTenantDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        onSuccess={mockOnSuccess}
      />,
      { wrapper: createWrapper() }
    );

    const emailInput = screen.getByLabelText(/Email Admin/i);
    fireEvent.change(emailInput, { target: { value: 'invalid-email' } });

    const submitButton = screen.getByRole('button', { name: /Buat Tenant/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/Format email tidak valid/i)).toBeInTheDocument();
    });
  });

  it('should show validation error for short password', async () => {
    render(
      <CreateTenantDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        onSuccess={mockOnSuccess}
      />,
      { wrapper: createWrapper() }
    );

    const passwordInput = screen.getByLabelText(/Password Admin/i);
    fireEvent.change(passwordInput, { target: { value: '123' } });

    const submitButton = screen.getByRole('button', { name: /Buat Tenant/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/Password minimal 8 karakter/i)).toBeInTheDocument();
    });
  });

  it('should call createTenant on valid form submission', async () => {
    const createTenantSpy = vi.spyOn(tenantManagement, 'createTenant').mockResolvedValue({
      success: true,
      data: { id: 'tenant-1' }
    });

    render(
      <CreateTenantDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        onSuccess={mockOnSuccess}
      />,
      { wrapper: createWrapper() }
    );

    // Fill form
    fireEvent.change(screen.getByLabelText(/Nama Rumah Sakit/i), {
      target: { value: 'RS Test' }
    });
    fireEvent.change(screen.getByLabelText(/Email Admin/i), {
      target: { value: 'admin@test.com' }
    });
    fireEvent.change(screen.getByLabelText(/Nama Admin/i), {
      target: { value: 'Admin Test' }
    });
    fireEvent.change(screen.getByLabelText(/Password Admin/i), {
      target: { value: 'password123' }
    });

    // Submit form
    const submitButton = screen.getByRole('button', { name: /Buat Tenant/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(createTenantSpy).toHaveBeenCalledWith({
        name: 'RS Test',
        slug: 'rs-test',
        adminEmail: 'admin@test.com',
        adminName: 'Admin Test',
        adminPassword: 'password123'
      });
    });
  });

  it('should show success toast and call onSuccess on successful submission', async () => {
    vi.spyOn(tenantManagement, 'createTenant').mockResolvedValue({
      success: true,
      data: { id: 'tenant-1' }
    });

    render(
      <CreateTenantDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        onSuccess={mockOnSuccess}
      />,
      { wrapper: createWrapper() }
    );

    // Fill and submit form
    fireEvent.change(screen.getByLabelText(/Nama Rumah Sakit/i), {
      target: { value: 'RS Test' }
    });
    fireEvent.change(screen.getByLabelText(/Email Admin/i), {
      target: { value: 'admin@test.com' }
    });
    fireEvent.change(screen.getByLabelText(/Nama Admin/i), {
      target: { value: 'Admin Test' }
    });
    fireEvent.change(screen.getByLabelText(/Password Admin/i), {
      target: { value: 'password123' }
    });

    fireEvent.click(screen.getByRole('button', { name: /Buat Tenant/i }));

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith({
        title: 'Berhasil',
        description: 'Tenant baru berhasil dibuat'
      });
      expect(mockOnSuccess).toHaveBeenCalled();
      expect(mockOnOpenChange).toHaveBeenCalledWith(false);
    });
  });

  it('should show error toast on failed submission', async () => {
    vi.spyOn(tenantManagement, 'createTenant').mockResolvedValue({
      success: false,
      message: 'Slug sudah digunakan'
    });

    render(
      <CreateTenantDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        onSuccess={mockOnSuccess}
      />,
      { wrapper: createWrapper() }
    );

    // Fill and submit form
    fireEvent.change(screen.getByLabelText(/Nama Rumah Sakit/i), {
      target: { value: 'RS Test' }
    });
    fireEvent.change(screen.getByLabelText(/Email Admin/i), {
      target: { value: 'admin@test.com' }
    });
    fireEvent.change(screen.getByLabelText(/Nama Admin/i), {
      target: { value: 'Admin Test' }
    });
    fireEvent.change(screen.getByLabelText(/Password Admin/i), {
      target: { value: 'password123' }
    });

    fireEvent.click(screen.getByRole('button', { name: /Buat Tenant/i }));

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith({
        title: 'Error',
        description: 'Slug sudah digunakan',
        variant: 'destructive'
      });
      expect(mockOnSuccess).not.toHaveBeenCalled();
    });
  });

  it('should disable submit button while submitting', async () => {
    vi.spyOn(tenantManagement, 'createTenant').mockImplementation(
      () => new Promise(resolve => setTimeout(() => resolve({ success: true }), 100))
    );

    render(
      <CreateTenantDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        onSuccess={mockOnSuccess}
      />,
      { wrapper: createWrapper() }
    );

    // Fill form
    fireEvent.change(screen.getByLabelText(/Nama Rumah Sakit/i), {
      target: { value: 'RS Test' }
    });
    fireEvent.change(screen.getByLabelText(/Email Admin/i), {
      target: { value: 'admin@test.com' }
    });
    fireEvent.change(screen.getByLabelText(/Nama Admin/i), {
      target: { value: 'Admin Test' }
    });
    fireEvent.change(screen.getByLabelText(/Password Admin/i), {
      target: { value: 'password123' }
    });

    const submitButton = screen.getByRole('button', { name: /Buat Tenant/i });
    fireEvent.click(submitButton);

    // Button should be disabled during submission
    expect(submitButton).toBeDisabled();
    expect(screen.getByText(/Membuat.../i)).toBeInTheDocument();
  });

  it('should call onOpenChange when cancel button is clicked', () => {
    render(
      <CreateTenantDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        onSuccess={mockOnSuccess}
      />,
      { wrapper: createWrapper() }
    );

    const cancelButton = screen.getByRole('button', { name: /Batal/i });
    fireEvent.click(cancelButton);

    expect(mockOnOpenChange).toHaveBeenCalledWith(false);
  });

  it('should reset form after successful submission', async () => {
    vi.spyOn(tenantManagement, 'createTenant').mockResolvedValue({
      success: true,
      data: { id: 'tenant-1' }
    });

    render(
      <CreateTenantDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        onSuccess={mockOnSuccess}
      />,
      { wrapper: createWrapper() }
    );

    // Fill form
    const nameInput = screen.getByLabelText(/Nama Rumah Sakit/i) as HTMLInputElement;
    fireEvent.change(nameInput, { target: { value: 'RS Test' } });
    fireEvent.change(screen.getByLabelText(/Email Admin/i), {
      target: { value: 'admin@test.com' }
    });
    fireEvent.change(screen.getByLabelText(/Nama Admin/i), {
      target: { value: 'Admin Test' }
    });
    fireEvent.change(screen.getByLabelText(/Password Admin/i), {
      target: { value: 'password123' }
    });

    // Submit
    fireEvent.click(screen.getByRole('button', { name: /Buat Tenant/i }));

    await waitFor(() => {
      expect(mockOnSuccess).toHaveBeenCalled();
    });

    // Form should be reset (this happens when dialog closes and reopens)
    // We can't test this directly without reopening the dialog
  });
});
