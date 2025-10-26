import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface BrandingSettings {
  id?: string;
  app_title: string;
  logo_url?: string;
  logo_alt_text: string;
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

      const { data, error } = await supabase
        .from('branding_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching branding settings in hook:', error);
        setLoading(false);
        return;
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
