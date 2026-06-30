import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export function useIsAdmin() {
  const [state, setState] = useState<{ loading: boolean; isAdmin: boolean; userId: string | null }>(
    { loading: true, isAdmin: false, userId: null }
  );

  useEffect(() => {
    let alive = true;
    const check = async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) { if (alive) setState({ loading: false, isAdmin: false, userId: null }); return; }
      const { data, error } = await supabase.rpc("has_role", { _user_id: u.user.id, _role: "admin" });
      if (!alive) return;
      setState({ loading: false, isAdmin: !error && Boolean(data), userId: u.user.id });
    };
    check();
    const { data: sub } = supabase.auth.onAuthStateChange(() => check());
    return () => { alive = false; sub.subscription.unsubscribe(); };
  }, []);

  return state;
}