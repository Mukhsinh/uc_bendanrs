/**
 * TenantBranding Component
 * Displays tenant name, logo, and applies tenant-specific branding
 */

import React, { useEffect } from 'react';
import { useTenant } from '@/contexts/TenantContext';

interface TenantBrandingProps {
  showLogo?: boolean;
  showName?: boolean;
  className?: string;
}

export const TenantBranding: React.FC<TenantBrandingProps> = ({
  showLogo = true,
  showName = true,
  className = '',
}) => {
  const { tenant, loading } = useTenant();

  // Apply tenant colors to CSS variables
  useEffect(() => {
    if (tenant?.primary_color) {
      document.documentElement.style.setProperty('--tenant-primary', tenant.primary_color);
    }
    if (tenant?.secondary_color) {
      document.documentElement.style.setProperty('--tenant-secondary', tenant.secondary_color);
    }

    // Cleanup on unmount
    return () => {
      document.documentElement.style.removeProperty('--tenant-primary');
      document.documentElement.style.removeProperty('--tenant-secondary');
    };
  }, [tenant]);

  if (loading) {
    return (
      <div className={`flex items-center gap-3 ${className}`}>
        <div className="h-8 w-8 animate-pulse rounded-full bg-gray-200" />
        <div className="h-6 w-32 animate-pulse rounded bg-gray-200" />
      </div>
    );
  }

  if (!tenant) {
    return null;
  }

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {showLogo && tenant.logo_url && (
        <img
          src={tenant.logo_url}
          alt={`${tenant.name} logo`}
          className="h-8 w-8 rounded-full object-cover"
        />
      )}
      {showLogo && !tenant.logo_url && (
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
          {tenant.name.charAt(0).toUpperCase()}
        </div>
      )}
      {showName && (
        <span className="text-lg font-semibold text-foreground">{tenant.name}</span>
      )}
    </div>
  );
};

export default TenantBranding;
