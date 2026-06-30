import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export function useMaintenanceMode() {
  const [isMaintenanceMode, setIsMaintenanceMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [settings, setSettings] = useState<any>(null);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    checkMaintenanceStatus();
  }, []);

  const checkMaintenanceStatus = async () => {
    setLoading(true);
    try {
      // Get maintenance mode setting from settings table
      const { data, error } = await supabase
        .from('settings')
        .select('maintenance_mode, maintenance_message, maintenance_until')
        .single();
      
      if (!error && data) {
        setIsMaintenanceMode(data.maintenance_mode || false);
        setSettings(data);
      }

      // Check if current user is admin
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUserId(session.user.id);
        const { data: isAdminUser } = await supabase.rpc('has_role', {
          _user_id: session.user.id,
          _role: 'admin'
        });
        setIsAdmin(!!isAdminUser);
      }
    } catch (error) {
      console.error('Error checking maintenance status:', error);
    } finally {
      setLoading(false);
    }
  };

  const canAccess = !isMaintenanceMode || isAdmin;

  return { 
    isMaintenanceMode, 
    loading, 
    isAdmin, 
    canAccess, 
    settings,
    userId,
    checkMaintenanceStatus 
  };
}