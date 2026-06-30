import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export function useAuthRole() {
  const [role, setRole] = useState<'admin' | 'user' | null>(null);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);

  const checkRole = async (userId: string) => {
    try {
      const { data: isAdmin } = await supabase.rpc('has_role', {
        _user_id: userId,
        _role: 'admin'
      });
      
      setRole(isAdmin ? 'admin' : 'user');
      return isAdmin;
    } catch (error) {
      console.error('Role check error:', error);
      setRole('user');
      return false;
    }
  };

  useEffect(() => {
    const getSessionAndRole = async () => {
      setLoading(true);
      
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        setUserId(session.user.id);
        setEmail(session.user.email || null);
        await checkRole(session.user.id);
      } else {
        setRole(null);
        setUserId(null);
        setEmail(null);
      }
      
      setLoading(false);
    };

    getSessionAndRole();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event);
      
      if (session?.user) {
        setUserId(session.user.id);
        setEmail(session.user.email || null);
        await checkRole(session.user.id);
      } else {
        setRole(null);
        setUserId(null);
        setEmail(null);
      }
      
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return { role, loading, userId, email, isAdmin: role === 'admin', isUser: role === 'user' };
}