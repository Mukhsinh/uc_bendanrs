// TypeScript interfaces untuk Tenant Management

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  metadata: Record<string, any>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  user_count?: number;
  settings?: TenantSettings;
}

export interface TenantSettings {
  tenant_id: string;
  include_jasa_pelayanan: boolean;
  default_allocation_method: string;
  calculation_preferences: Record<string, any>;
  primary_color: string;
  secondary_color: string;
  created_at: string;
  updated_at: string;
}

export interface TenantWithUsers extends Tenant {
  users: UserWithRole[];
}

export interface UserWithRole {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at: string | null;
  full_name: string | null;
  phone: string | null;
  tenant_id: string;
  role_id: number;
  role_name: string;
  role_is_active: boolean;
}

export interface CreateTenantFormData {
  name: string;
  slug: string;
  adminEmail: string;
  adminPassword: string;
  adminName: string;
}

export interface CreateUserFormData {
  email: string;
  password: string;
  fullName: string;
  role: string;
}

export interface ChangeRoleFormData {
  userId: string;
  newRole: string;
}
