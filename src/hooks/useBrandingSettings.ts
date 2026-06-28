import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface BrandingSettings {
  id?: string;
  app_title: string;
  logo_url?: string;
  logo_alt_text: string;
  subtitle?: string;
}

const useBrandingSettings = () => {
  const [settings, setSettings] = useState<BrandingSettings>({
    app_title: 'PINTAR UC',
    logo_alt_text: 'Logo'
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBrandingSettings();
  }, []);

  const fetchBrandingSettings = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('No user authenticated in hook');
        setLoading(false);
        return;
      }

      console.log('Fetching branding settings in hook for user:', user.id);

      // Get user's tenant_id from user_profiles
      const { data: userProfile } = await supabase
        .from('user_profiles')
        .select('tenant_id')
        .eq('id', user.id)
        .maybeSingle();

      if (!userProfile?.tenant_id) {
        console.warn('No tenant found for user, using default branding');
        setSettings({
          app_title: 'PINTAR UC',
          logo_alt_text: 'Logo'
        });
        setLoading(false);
        return;
      }

      // Fetch branding settings for this tenant
      const { data, error } = await supabase
        .from('branding_settings')
        .select('*')
        .eq('tenant_id', userProfile.tenant_id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.warn('Note: Using default branding settings due to:', error.message);
      }

      if (data) {
        console.log('Found existing branding settings in hook:', data);
        setSettings(data);
      } else {
        console.log('No existing branding settings found in hook, using defaults');
        setSettings({
          app_title: 'PINTAR UC',
          logo_alt_text: 'Logo'
        });
      }
    } catch (error) {
      console.error('Error fetching branding settings in hook:', error);
    } finally {
      setLoading(false);
    }
  };

  return {
    settings,
    loading,
    refetch: fetchBrandingSettings
  };
};

export { useBrandingSettings };
