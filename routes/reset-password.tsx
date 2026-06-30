import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Lock, Flame, CheckCircle } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/reset-password")({
  head: () => ({ meta: [{ title: "Reset password — AIPATECH Energy" }] }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const nav = useNavigate();
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    // Check if we have a valid reset session
    const { data: sub } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "PASSWORD_RECOVERY") {
        setReady(true);
      }
      if (event === "SIGNED_IN" && session) {
        setReady(true);
      }
    });
    
    supabase.auth.getSession().then(({ data }) => { 
      if (data.session) setReady(true);
    });
    
    return () => sub.subscription.unsubscribe();
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    
    if (password !== confirm) {
      setErr("Passwords do not match");
      return;
    }
    if (password.length < 6) {
      setErr("Password must be at least 6 characters");
      return;
    }
    
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      
      setSuccess(true);
      toast.success("Password updated successfully!");
      
      setTimeout(() => {
        nav({ to: "/auth" });
      }, 3000);
      
    } catch (e: any) {
      setErr(e.message ?? "Could not update password");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="grid min-h-screen place-items-center bg-background px-4 py-12">
        <div className="w-full max-w-md rounded-3xl border border-border/60 bg-card/70 p-8 shadow-card backdrop-blur-2xl text-center">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center">
              <CheckCircle className="h-8 w-8 text-emerald-600" />
            </div>
          </div>
          <h1 className="text-2xl font-bold mb-2">Password Updated!</h1>
          <p className="text-muted-foreground mb-6">
            Your password has been successfully changed.
          </p>
          <p className="text-sm text-muted-foreground">
            Redirecting to login page...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid min-h-screen place-items-center bg-background px-4 py-12">
      <div className="w-full max-w-md rounded-3xl border border-border/60 bg-card/70 p-8 shadow-card backdrop-blur-2xl">
        <Link to="/" className="flex items-center gap-2">
          <span className="grid h-10 w-10 place-items-center rounded-lg bg-gradient-hero text-primary-foreground shadow-soft">
            <Flame className="h-5 w-5" />
          </span>
          <span className="font-display text-lg font-bold">AEL Portal</span>
        </Link>
        
        <h1 className="mt-5 text-2xl font-bold">Set a new password</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {ready ? "Enter and confirm your new password." : "Verifying your reset link..."}
        </p>

        {!ready ? (
          <div className="mt-6 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Verifying...</p>
          </div>
        ) : (
          <form onSubmit={submit} className="mt-6 space-y-4">
            <Field label="New password">
              <input 
                required 
                type="password" 
                minLength={6} 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                className="w-full bg-transparent px-3 py-2.5 text-sm outline-none" 
              />
            </Field>
            
            <Field label="Confirm password">
              <input 
                required 
                type="password" 
                minLength={6} 
                value={confirm} 
                onChange={(e) => setConfirm(e.target.value)} 
                className="w-full bg-transparent px-3 py-2.5 text-sm outline-none" 
              />
            </Field>
            
            {err && (
              <div className="rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {err}
              </div>
            )}
            
            <button 
              disabled={loading} 
              className="w-full rounded-full bg-gradient-hero px-5 py-3 font-semibold text-primary-foreground shadow-soft transition-all hover:scale-[1.01] disabled:opacity-60"
            >
              {loading ? "Updating..." : "Update password"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</span>
      <div className="mt-1 flex items-center rounded-xl border border-input bg-background pl-3 focus-within:ring-2 focus-within:ring-primary/20">
        <Lock className="h-4 w-4 text-muted-foreground" />
        {children}
      </div>
    </label>
  );
}