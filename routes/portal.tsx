import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Bell, BellRing, Calendar, CheckCircle2, Clock, FileText, LogOut, Package, XCircle, Flag, Mail, ChevronRight, Sparkles } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/portal")({
  head: () => ({ meta: [{ title: "My Portal — AIPATECH Energy" }, { name: "description", content: "Track your rental bookings and notifications." }] }),
  component: PortalPage,
});

function PortalPage() {
  const nav = useNavigate();
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [bookings, setBookings] = useState<any[]>([]);
  const [notifs, setNotifs] = useState<any[]>([]);
  const [tab, setTab] = useState<"overview"|"bookings"|"notifications">("overview");

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) { nav({ to: "/auth" }); return; }
      setUser(data.session.user); setReady(true);
    });
  }, [nav]);

  const load = async () => {
    if (!user) return;
    const [{ data: b }, { data: n }] = await Promise.all([
      supabase.from("bookings").select("*").or(`customer_user_id.eq.${user.id},email.eq.${user.email}`).order("created_at", { ascending: false }),
      supabase.from("notifications").select("*").order("created_at", { ascending: false }).limit(50),
    ]);
    setBookings(b ?? []); setNotifs(n ?? []);
  };

  useEffect(() => {
    if (!user) return;
    load();
    const ch = supabase
      .channel(`portal-${user.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "bookings" }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user]);

  const markAllRead = async () => {
    if (!user) return;
    await supabase.from("notifications").update({ read: true }).eq("user_id", user.id).eq("read", false);
    load();
  };
  const markRead = async (id: string) => { await supabase.from("notifications").update({ read: true }).eq("id", id); load(); };

  const signOut = async () => { await supabase.auth.signOut(); toast.success("Signed out"); nav({ to: "/" }); };

  if (!ready) return <div className="grid min-h-screen place-items-center text-muted-foreground">Loading…</div>;

  const unread = notifs.filter(n => !n.read).length;
  const stats = {
    total: bookings.length,
    pending: bookings.filter(b=>b.status==="pending").length,
    approved: bookings.filter(b=>b.status==="approved").length,
    completed: bookings.filter(b=>b.status==="completed").length,
  };

  const statusMeta = (s: string) => ({
    pending:   { c: "bg-gold/15 text-gold-foreground border-gold/40", i: Clock,        l: "Pending review" },
    approved:  { c: "bg-emerald/15 text-emerald border-emerald/40",   i: CheckCircle2, l: "Approved" },
    rejected:  { c: "bg-destructive/15 text-destructive border-destructive/40", i: XCircle, l: "Rejected" },
    completed: { c: "bg-primary/15 text-primary border-primary/40",   i: Flag,         l: "Completed" },
  } as Record<string,{c:string;i:any;l:string}>)[s] ?? { c: "bg-muted text-muted-foreground border-border", i: Package, l: s };

  return (
    <main className="min-h-[calc(100vh-4rem)] bg-secondary/30 py-8">
      <div className="container-x space-y-6">
        {/* Header */}
        <div className="overflow-hidden rounded-3xl bg-gradient-hero p-5 text-primary-foreground shadow-card sm:p-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="min-w-0">
              <div className="inline-flex items-center gap-1 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold backdrop-blur"><Sparkles className="h-3 w-3"/> Customer portal</div>
              <h1 className="mt-3 text-2xl font-bold sm:text-4xl">Welcome back</h1>
              <p className="mt-1 truncate text-sm opacity-90">{user.email}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link to="/rentals" className="rounded-full bg-white/15 px-3 py-2 text-xs font-semibold backdrop-blur hover:bg-white/25 sm:px-4 sm:text-sm">+ New booking</Link>
              <button onClick={signOut} className="inline-flex items-center gap-1 rounded-full border border-white/30 px-3 py-2 text-xs font-semibold hover:bg-white/10 sm:px-4 sm:text-sm"><LogOut className="h-4 w-4"/> Sign out</button>
            </div>
          </div>
        </div>

        {/* Stat cards */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { l: "Total bookings", v: stats.total, i: Package, c: "bg-gradient-hero" },
            { l: "Pending", v: stats.pending, i: Clock, c: "bg-gradient-gold" },
            { l: "Approved", v: stats.approved, i: CheckCircle2, c: "bg-gradient-emerald" },
            { l: "Unread alerts", v: unread, i: BellRing, c: "bg-gradient-hero" },
          ].map(s => (
            <div key={s.l} className="rounded-2xl border border-border bg-card p-4 shadow-soft">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase tracking-wider text-muted-foreground">{s.l}</span>
                <span className={`grid h-9 w-9 place-items-center rounded-lg ${s.c} text-primary-foreground`}><s.i className="h-4 w-4"/></span>
              </div>
              <div className="mt-2 text-2xl font-bold">{s.v}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          <div className="inline-flex w-max gap-1 rounded-full border border-border bg-card p-1 text-xs font-semibold sm:text-sm">
            {[
              { k: "overview", l: "Overview" },
              { k: "bookings", l: `Bookings (${bookings.length})` },
              { k: "notifications", l: `Notifications${unread>0?` · ${unread}`:""}` },
            ].map(t => (
              <button key={t.k} onClick={()=>setTab(t.k as any)}
                className={`whitespace-nowrap rounded-full px-3 py-2 sm:px-4 ${tab===t.k?"bg-gradient-hero text-primary-foreground shadow-soft":"text-muted-foreground"}`}>
                {t.l}
              </button>
            ))}
          </div>
        </div>

        {tab === "overview" && (
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="rounded-2xl border border-border bg-card p-6 shadow-soft lg:col-span-2">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold">Recent bookings</h2>
                <button onClick={()=>setTab("bookings")} className="text-xs font-semibold text-primary hover:underline">View all →</button>
              </div>
              {bookings.length === 0 ? (
                <EmptyBookings />
              ) : (
                <ul className="mt-4 space-y-3">
                  {bookings.slice(0,4).map(b => <BookingMini key={b.id} b={b} statusMeta={statusMeta} />)}
                </ul>
              )}
            </div>
            <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold">Latest alerts</h2>
                {unread > 0 && <button onClick={markAllRead} className="text-xs font-semibold text-primary hover:underline">Mark all read</button>}
              </div>
              {notifs.length === 0 ? (
                <p className="mt-6 rounded-xl border border-dashed border-border p-6 text-center text-xs text-muted-foreground">No notifications yet.</p>
              ) : (
                <ul className="mt-4 space-y-2">
                  {notifs.slice(0,5).map(n => <NotifMini key={n.id} n={n} onRead={()=>markRead(n.id)} />)}
                </ul>
              )}
            </div>
          </div>
        )}

        {tab === "bookings" && (
          <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
            <h2 className="font-semibold">All my bookings</h2>
            {bookings.length === 0 ? <EmptyBookings /> : (
              <ul className="mt-4 space-y-3">{bookings.map(b => <BookingMini key={b.id} b={b} statusMeta={statusMeta} expanded />)}</ul>
            )}
          </div>
        )}

        {tab === "notifications" && (
          <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">All notifications</h2>
              {unread > 0 && <button onClick={markAllRead} className="text-xs font-semibold text-primary hover:underline">Mark all read</button>}
            </div>
            {notifs.length === 0 ? (
              <p className="mt-6 rounded-xl border border-dashed border-border p-12 text-center text-sm text-muted-foreground">No notifications yet. We'll alert you here when your booking status changes.</p>
            ) : (
              <ul className="mt-4 space-y-2">{notifs.map(n => <NotifMini key={n.id} n={n} onRead={()=>markRead(n.id)} />)}</ul>
            )}
          </div>
        )}
      </div>
    </main>
  );
}

function BookingMini({ b, statusMeta, expanded = false }: any) {
  const m = statusMeta(b.status);
  const Icon = m.i;
  return (
    <li className="rounded-xl border border-border bg-background p-4 transition-shadow hover:shadow-soft">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-muted-foreground">AEL-{b.id.slice(0,8).toUpperCase()}</span>
            <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${m.c}`}><Icon className="h-3 w-3"/> {m.l}</span>
          </div>
          <h3 className="mt-1 font-semibold leading-tight">{b.equipment}</h3>
          {(b.start_date || b.end_date) && (
            <p className="mt-1 inline-flex items-center gap-1 text-xs text-muted-foreground"><Calendar className="h-3 w-3"/> {b.start_date || "?"} → {b.end_date || "?"}</p>
          )}
          {expanded && b.message && <p className="mt-2 rounded-lg bg-secondary/50 p-3 text-xs">{b.message}</p>}
        </div>
        {b.invoice_id && (
          <Link to="/portal" className="hidden text-xs text-primary hover:underline sm:inline-flex sm:items-center sm:gap-1"><FileText className="h-3 w-3"/> Invoice</Link>
        )}
      </div>
      <div className="mt-3 flex items-center gap-1 text-[10px] uppercase tracking-wider">
        {["pending","approved","completed"].map((s, i, arr) => {
          const done = ["pending","approved","completed"].indexOf(b.status) >= i || b.status === "approved" && i <= 1;
          const isCur = b.status === s;
          if (b.status === "rejected" && s !== "pending") {
            return <div key={s} className="flex flex-1 items-center gap-1"><div className="h-1 flex-1 rounded-full bg-destructive/30"/><span className="text-destructive">—</span></div>;
          }
          return (
            <div key={s} className="flex flex-1 items-center gap-1">
              <div className={`h-1 flex-1 rounded-full ${done ? "bg-emerald" : "bg-muted"}`} />
              <span className={isCur ? "font-bold text-foreground" : done ? "text-emerald" : "text-muted-foreground"}>{s}</span>
            </div>
          );
        })}
      </div>
    </li>
  );
}

function NotifMini({ n, onRead }: { n: any; onRead: () => void }) {
  return (
    <li className={`flex items-start gap-3 rounded-xl border p-3 ${n.read ? "border-border bg-background" : "border-primary/30 bg-primary/5"}`}>
      <span className={`mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg ${n.read?"bg-muted":"bg-gradient-hero text-primary-foreground"}`}>
        {n.read ? <Bell className="h-4 w-4 text-muted-foreground"/> : <BellRing className="h-4 w-4"/>}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <strong className="text-sm">{n.title}</strong>
          <span className="text-[10px] text-muted-foreground">{new Date(n.created_at).toLocaleString()}</span>
        </div>
        {n.body && <p className="mt-0.5 text-xs text-muted-foreground">{n.body}</p>}
      </div>
      {!n.read && <button onClick={onRead} className="text-xs text-primary hover:underline">Mark read</button>}
    </li>
  );
}

function EmptyBookings() {
  return (
    <div className="mt-6 rounded-xl border border-dashed border-border p-10 text-center">
      <Package className="mx-auto h-8 w-8 text-muted-foreground" />
      <p className="mt-3 text-sm text-muted-foreground">No bookings yet.</p>
      <Link to="/rentals" className="mt-4 inline-flex items-center gap-1 rounded-full bg-gradient-gold px-4 py-2 text-xs font-semibold text-gold-foreground hover:scale-105">Browse equipment <ChevronRight className="h-3 w-3"/></Link>
    </div>
  );
}