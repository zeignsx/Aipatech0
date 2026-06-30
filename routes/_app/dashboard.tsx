import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { FileText, DollarSign, Users, Clock, Inbox, TrendingUp, Mail, MessageCircle, Plus, AlertCircle, CheckCircle2, ImageIcon, Settings as SettingsIcon } from "lucide-react";

export const Route = createFileRoute("/_app/dashboard")({
  component: Dashboard,
});

function Dashboard() {
  const [invs, setInvs] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [customersCount, setCustomersCount] = useState(0);
  const [email, setEmail] = useState("");

  const load = async () => {
    const [{ data: i }, { data: b }, { count: cc }, { data: u }] = await Promise.all([
      supabase.from("invoices").select("*").order("created_at", { ascending: false }),
      supabase.from("bookings").select("*").order("created_at", { ascending: false }),
      supabase.from("customers").select("*", { count: "exact", head: true }),
      supabase.auth.getUser(),
    ]);
    setInvs(i ?? []); setBookings(b ?? []); setCustomersCount(cc ?? 0);
    setEmail(u.user?.email ?? "");
  };

  useEffect(() => {
    load();
    const ch = supabase
      .channel("dash-bookings")
      .on("postgres_changes", { event: "*", schema: "public", table: "bookings" }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  const stats = useMemo(() => ({
    total: invs.reduce((s, i) => s + Number(i.total), 0),
    paid: invs.filter(i => i.status === "paid").reduce((s, i) => s + Number(i.total), 0),
    pending: invs.filter(i => i.status === "sent" || i.status === "overdue").reduce((s, i) => s + Number(i.total), 0),
    newBookings: bookings.filter(b => b.status === "pending").length,
  }), [invs, bookings]);

  const fmt = (n: number) => n.toLocaleString(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 0 });

  // 6-month revenue series
  const series = useMemo(() => {
    const months: { label: string; key: string }[] = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({ label: d.toLocaleString(undefined, { month: "short" }), key: `${d.getFullYear()}-${d.getMonth()}` });
    }
    const sums: Record<string, number> = {};
    invs.forEach(i => {
      const d = new Date(i.created_at);
      const k = `${d.getFullYear()}-${d.getMonth()}`;
      sums[k] = (sums[k] ?? 0) + Number(i.total);
    });
    const max = Math.max(1, ...months.map(m => sums[m.key] ?? 0));
    return months.map(m => ({ ...m, v: sums[m.key] ?? 0, h: ((sums[m.key] ?? 0) / max) * 100 }));
  }, [invs]);

  const cards = [
    { l: "New bookings", v: stats.newBookings, icon: Inbox, c: "bg-gradient-gold", to: "/bookings", pulse: stats.newBookings > 0 },
    { l: "Total billed", v: fmt(stats.total), icon: DollarSign, c: "bg-gradient-hero" },
    { l: "Paid", v: fmt(stats.paid), icon: TrendingUp, c: "bg-gradient-emerald" },
    { l: "Outstanding", v: fmt(stats.pending), icon: Clock, c: "bg-gradient-hero" },
  ];

  const overdue = invs.filter(i => i.status === "overdue" || (i.status === "sent" && i.due_date && new Date(i.due_date) < new Date())).slice(0, 5);
  const statusBadge = (s: string) => {
    const map: Record<string, string> = {
      paid: "bg-emerald/15 text-emerald",
      sent: "bg-primary/15 text-primary",
      overdue: "bg-destructive/15 text-destructive",
      draft: "bg-secondary text-foreground",
      cancelled: "bg-muted text-muted-foreground",
    };
    return map[s] ?? "bg-secondary";
  };

  const markPaid = async (id: string) => {
    await supabase.from("invoices").update({ status: "paid" }).eq("id", id);
    load();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">Welcome back 👋</h1>
          <p className="text-sm text-muted-foreground">{email} · {new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}</p>
        </div>
        <div className="flex gap-2">
          <Link to="/invoices/new" className="rounded-full bg-gradient-hero px-4 py-2 text-sm font-semibold text-primary-foreground shadow-soft hover:scale-[1.02]">+ New invoice</Link>
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { to: "/invoices/new", l: "New invoice", icon: Plus, c: "bg-gradient-hero" },
          { to: "/customers", l: "Add customer", icon: Users, c: "bg-gradient-emerald" },
          { to: "/bookings", l: "Open inbox", icon: Inbox, c: "bg-gradient-gold" },
          { to: "/site-content", l: "Edit website images", icon: ImageIcon, c: "bg-gradient-hero" },
        ].map((q) => (
          <Link key={q.l} to={q.to} className="group flex items-center gap-3 rounded-2xl border border-border bg-card p-4 shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-card">
            <span className={`grid h-10 w-10 place-items-center rounded-xl ${q.c} text-primary-foreground shadow-soft`}><q.icon className="h-5 w-5" /></span>
            <span className="text-sm font-semibold">{q.l}</span>
            <span className="ml-auto text-xs text-muted-foreground transition-colors group-hover:text-primary">→</span>
          </Link>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => {
          const Inner = (
            <div className="relative h-full rounded-2xl border border-border bg-card p-5 shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-card">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase tracking-wider text-muted-foreground">{c.l}</span>
                <span className={`grid h-9 w-9 place-items-center rounded-lg ${c.c} text-primary-foreground`}><c.icon className="h-4 w-4" /></span>
              </div>
              <div className="mt-3 text-2xl font-bold">{c.v}</div>
              {c.pulse && <span className="absolute right-3 top-3 h-2 w-2 animate-ping rounded-full bg-gold" />}
            </div>
          );
          return c.to ? <Link key={c.l} to={c.to}>{Inner}</Link> : <div key={c.l}>{Inner}</div>;
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-6 shadow-soft lg:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-semibold">Revenue · last 6 months</h2>
              <p className="text-xs text-muted-foreground">Sum of invoice totals by issue month</p>
            </div>
            <span className="text-sm font-bold text-emerald">{fmt(stats.total)}</span>
          </div>
          <div className="mt-6 flex h-48 items-end gap-3">
            {series.map((m) => (
              <div key={m.key} className="group flex flex-1 flex-col items-center gap-2">
                <div className="relative w-full overflow-hidden rounded-t-lg bg-secondary" style={{ height: `${Math.max(4, m.h)}%` }}>
                  <div className="absolute inset-0 bg-gradient-hero opacity-90" />
                  <span className="pointer-events-none absolute inset-x-0 -top-6 text-center text-[10px] font-semibold opacity-0 group-hover:opacity-100">{fmt(m.v)}</span>
                </div>
                <span className="text-xs text-muted-foreground">{m.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">At a glance</h2>
            <Users className="h-4 w-4 text-muted-foreground" />
          </div>
          <ul className="mt-4 space-y-3 text-sm">
            <li className="flex items-center justify-between"><span className="text-muted-foreground">Customers</span><strong>{customersCount}</strong></li>
            <li className="flex items-center justify-between"><span className="text-muted-foreground">Invoices issued</span><strong>{invs.length}</strong></li>
            <li className="flex items-center justify-between"><span className="text-muted-foreground">Bookings (all-time)</span><strong>{bookings.length}</strong></li>
            <li className="flex items-center justify-between"><span className="text-muted-foreground">Awaiting action</span><strong className="text-gold">{stats.newBookings}</strong></li>
          </ul>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Recent bookings</h2>
            <Link to="/bookings" className="text-sm font-semibold text-primary hover:underline">View all</Link>
          </div>
          {bookings.length === 0 ? (
            <p className="mt-6 rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">No bookings yet.</p>
          ) : (
            <ul className="mt-4 divide-y divide-border">
              {bookings.slice(0, 5).map((b) => (
                <li key={b.id} className="flex items-center justify-between gap-3 py-3 text-sm">
                  <div className="min-w-0">
                    <div className="truncate font-semibold">{b.equipment}</div>
                    <div className="truncate text-xs text-muted-foreground">{b.full_name} · {b.email}</div>
                  </div>
                  <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-0.5 text-[10px] font-semibold capitalize">
                    {b.channel === "whatsapp" ? <MessageCircle className="h-3 w-3" /> : <Mail className="h-3 w-3" />}{b.status}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Recent invoices</h2>
            <Link to="/invoices" className="text-sm font-semibold text-primary hover:underline">View all</Link>
          </div>
          {invs.length === 0 ? (
            <p className="mt-6 rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">No invoices yet.</p>
          ) : (
            <ul className="mt-4 divide-y divide-border">
              {invs.slice(0, 5).map((i) => (
                <li key={i.id} className="flex items-center justify-between gap-3 py-3 text-sm">
                  <Link to="/invoices/$id" params={{ id: i.id }} className="truncate font-semibold text-primary hover:underline"><FileText className="mr-1 inline h-3.5 w-3.5" />{i.invoice_number}</Link>
                  <div className="flex items-center gap-3">
                    <span className="hidden text-xs text-muted-foreground sm:inline">{i.issue_date}</span>
                    <span className="font-bold">{Number(i.total).toLocaleString(undefined, { style: "currency", currency: i.currency || "USD", maximumFractionDigits: 0 })}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Outstanding / overdue invoices */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-destructive" />
            <h2 className="font-semibold">Action needed — overdue / awaiting payment</h2>
          </div>
          <Link to="/invoices" className="text-sm font-semibold text-primary hover:underline">All invoices</Link>
        </div>
        {overdue.length === 0 ? (
          <p className="mt-6 inline-flex items-center gap-2 rounded-xl border border-emerald/30 bg-emerald/5 px-4 py-3 text-sm text-emerald"><CheckCircle2 className="h-4 w-4" /> All clear — no overdue invoices.</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase text-muted-foreground">
                <tr><th className="py-2">Invoice</th><th>Status</th><th>Due</th><th>Amount</th><th></th></tr>
              </thead>
              <tbody className="divide-y divide-border">
                {overdue.map((i) => (
                  <tr key={i.id}>
                    <td className="py-3"><Link to="/invoices/$id" params={{ id: i.id }} className="font-semibold text-primary hover:underline">{i.invoice_number}</Link></td>
                    <td><span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize ${statusBadge(i.status)}`}>{i.status}</span></td>
                    <td className="text-muted-foreground">{i.due_date ?? "—"}</td>
                    <td className="font-bold">{Number(i.total).toLocaleString(undefined, { style: "currency", currency: i.currency || "USD" })}</td>
                    <td className="text-right"><button onClick={()=>markPaid(i.id)} className="rounded-full bg-emerald px-3 py-1 text-xs font-semibold text-emerald-foreground hover:scale-105">Mark paid</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* footer link to settings */}
      <div className="text-center text-xs text-muted-foreground">
        <Link to="/settings" className="inline-flex items-center gap-1 hover:text-foreground"><SettingsIcon className="h-3 w-3" /> Account settings</Link>
      </div>
    </div>
  );
}
