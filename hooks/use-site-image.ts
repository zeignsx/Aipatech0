import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

// In-memory cache so the same key isn't fetched repeatedly across components.
const cache = new Map<string, string>();
const listeners = new Set<() => void>();

export function refreshSiteImages() {
  cache.clear();
  listeners.forEach((l) => l());
}

/** Returns the admin-managed URL for `key`, falling back to `fallback` until loaded. */
export function useSiteImage(key: string, fallback: string): string {
  const [url, setUrl] = useState<string>(cache.get(key) ?? fallback);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      const cached = cache.get(key);
      if (cached) { setUrl(cached); return; }
      const { data } = await supabase
        .from("site_images")
        .select("url")
        .eq("key", key)
        .maybeSingle();
      if (!alive) return;
      const next = data?.url || fallback;
      cache.set(key, next);
      setUrl(next);
    };
    load();
    const onRefresh = () => load();
    listeners.add(onRefresh);
    return () => { alive = false; listeners.delete(onRefresh); };
  }, [key, fallback]);

  return url;
}