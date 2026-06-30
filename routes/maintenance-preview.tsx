import { createFileRoute } from "@tanstack/react-router";
import { MaintenancePage } from "@/components/MaintenancePage";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/maintenance-preview")({
  component: MaintenancePreview,
});

function MaintenancePreview() {
  const [settings, setSettings] = useState<any>(null);

  useEffect(() => {
    const loadSettings = async () => {
      const { data } = await supabase.from('settings').select('maintenance_message, maintenance_until').single();
      setSettings(data);
    };
    loadSettings();
  }, []);

  return <MaintenancePage message={settings?.maintenance_message} until={settings?.maintenance_until} />;
}