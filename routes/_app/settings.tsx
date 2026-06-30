import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useIsAdmin } from "@/hooks/use-is-admin";
import { ThemeToggle } from "@/components/theme-toggle";
import { Mail, ShieldCheck, Lock, Save } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  const { isAdmin, userId } = useIsAdmin();
  const [email, setEmail] = useState("");
  const [pw1, setPw1] = useState("");
  const [pw2, setPw2] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? ""));
  }, []);

  const updatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pw1 !== pw2) return toast.error("Passwords don't match");
    if (pw1.length < 6) return toast.error("Min 6 characters");
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password: pw1 });
    setBusy(false);
    if (error) toast.error(error.message);
    else { toast.success("Password updated"); setPw1(""); setPw2(""); }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-sm text-muted-foreground">Account, security & appearance.</p>
      </div>

      <section className="rounded-2xl border border-border bg-card p-6 shadow-soft">
        <h2 className="font-semibold">Account</h2>
        <div className="mt-4 grid gap-3 text-sm">
          <div className="flex items-center gap-2"><Mail className="h-4 w-4 text-muted-foreground" /> <span className="text-muted-foreground">Email</span> <strong className="ml-auto">{email}</strong></div>
          <div className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-muted-foreground" /> <span className="text-muted-foreground">Role</span> <strong className={`ml-auto rounded-full px-2 py-0.5 text-xs ${isAdmin ? "bg-emerald/15 text-emerald" : "bg-secondary"}`}>{isAdmin ? "Admin" : "User"}</strong></div>
          <div className="flex items-center gap-2"><span className="text-muted-foreground">User ID</span><code className="ml-auto text-xs text-muted-foreground">{userId}</code></div>
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-card p-6 shadow-soft">
        <h2 className="font-semibold">Appearance</h2>
        <p className="mt-1 text-xs text-muted-foreground">Switch between light and dark mode.</p>
        <div className="mt-3"><ThemeToggle /></div>
      </section>

      <section className="rounded-2xl border border-border bg-card p-6 shadow-soft">
        <h2 className="font-semibold">Change password</h2>
        <form onSubmit={updatePassword} className="mt-4 max-w-sm space-y-3">
          <Field label="New password"><input type="password" minLength={6} value={pw1} onChange={(e)=>setPw1(e.target.value)} className="w-full bg-transparent px-3 py-2.5 text-sm outline-none" /></Field>
          <Field label="Confirm new password"><input type="password" minLength={6} value={pw2} onChange={(e)=>setPw2(e.target.value)} className="w-full bg-transparent px-3 py-2.5 text-sm outline-none" /></Field>
          <button disabled={busy} className="inline-flex items-center gap-1 rounded-full bg-gradient-hero px-5 py-2 text-sm font-semibold text-primary-foreground shadow-soft disabled:opacity-60"><Save className="h-3.5 w-3.5" /> {busy ? "Saving…" : "Update password"}</button>
        </form>
      </section>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</span>
      <div className="mt-1 flex items-center rounded-xl border border-input bg-background pl-3"><Lock className="h-4 w-4 text-muted-foreground" />{children}</div>
    </label>
  );
}