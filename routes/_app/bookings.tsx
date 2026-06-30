import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Mail, MessageCircle, FileText, Calendar, Building2, Phone, Trash2, RefreshCw, CheckCircle2, XCircle, Clock, Flag } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/bookings")({
  component: Bookings,
});

function Bookings() {
  const nav = useNavigate();
  const [list, setList] = useState<any[]>([]);
  const [filter, setFilter] = useState<string>("all");
  const [busy, setBusy] = useState<string | null>(null);

  const load = () => supabase.from("bookings").select("*").order("created_at", { ascending: false }).then(({ data }) => setList(data ?? []));
  useEffect(() => { load(); }, []);

  const setStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("bookings").update({ status }).eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success(`Marked ${status}`);
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this booking?")) return;
    await supabase.from("bookings").delete().eq("id", id);
    load();
  };

  const generateInvoice = async (b: any) => {
    setBusy(b.id);
    try {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return;
      // Find or create customer
      let customerId: string | null = null;
      const { data: existing } = await supabase.from("customers").select("id").eq("email", b.email).maybeSingle();
      if (existing) customerId = existing.id;
      else {
        const { data: c } = await supabase.from("customers")
          .insert({ owner_id: u.user.id, name: b.full_name, company: b.company, email: b.email, phone: b.phone })
          .select("id").single();
        customerId = c?.id ?? null;
      }
      const number = "INV-" + Date.now().toString().slice(-6);
      const days = b.start_date && b.end_date ? Math.max(1, Math.round((new Date(b.end_date).getTime() - new Date(b.start_date).getTime()) / 86400000)) : 1;
      const unit = 850;
      const subtotal = unit * days;
      const tax = subtotal * 0.075;
      const { data: inv, error } = await supabase.from("invoices").insert({
        owner_id: u.user.id, customer_id: customerId, invoice_number: number,
        issue_date: new Date().toISOString().slice(0,10),
        currency: "USD", tax_rate: 7.5, subtotal, tax_amount: tax, total: subtotal + tax,
        notes: `Auto-generated from booking ${b.id.slice(0,8).toUpperCase()} — ${b.equipment}`,
      }).select("id").single();
      if (error) throw error;
      await supabase.from("invoice_items").insert({
        invoice_id: inv.id, description: `${b.equipment} (${days} day${days>1?"s":""})`,
        quantity: days, unit_price: unit, amount: subtotal, position: 0,
      });
      await supabase.from("bookings").update({ status: "approved", invoice_id: inv.id }).eq("id", b.id);
      nav({ to: "/invoices/$id", params: { id: inv.id } });
    } finally { setBusy(null); }
  };

  const shown = list.filter(b => filter === "all" || b.status === filter);
  const STATUSES = ["pending","approved","rejected","completed"] as const;
  const counts = STATUSES.reduce((a,s)=>({ ...a, [s]: list.filter(x=>x.status===s).length }), {} as Record<string,number>);
  const statusStyle = (s: string) => ({
    pending:   "bg-gold/20 text-gold-foreground",
    approved:  "bg-emerald/20 text-emerald",
    rejected:  "bg-destructive/15 text-destructive",
    completed: "bg-primary/15 text-primary",
  } as Record<string,string>)[s] ?? "bg-muted text-muted-foreground";

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-bold">Bookings</h1>
          <p className="text-sm text-muted-foreground">Rental requests submitted from the website.</p>
        </div>
        <button onClick={load} className="inline-flex items-center gap-1 rounded-full border border-border px-4 py-2 text-sm hover:bg-muted"><RefreshCw className="h-4 w-4" /> Refresh</button>
      </div>

      <div className="flex flex-wrap gap-2">
        {[{k:"all",l:`All (${list.length})`}, ...STATUSES.map(s=>({k:s,l:`${s[0].toUpperCase()+s.slice(1)} (${counts[s]||0})`}))].map(t=>(
          <button key={t.k} onClick={()=>setFilter(t.k)} className={`rounded-full px-4 py-1.5 text-xs font-semibold ${filter===t.k?"bg-gradient-hero text-primary-foreground":"border border-border bg-card text-muted-foreground hover:text-foreground"}`}>{t.l}</button>
        ))}
      </div>

      {shown.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card p-16 text-center text-sm text-muted-foreground">
          No bookings here yet. New rental requests will appear in real time.
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {shown.map((b)=>(
            <div key={b.id} className="rounded-2xl border border-border bg-card p-5 shadow-soft">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-xs font-mono text-muted-foreground">AEL-{b.id.slice(0,8).toUpperCase()}</div>
                  <h3 className="mt-1 font-semibold">{b.equipment}</h3>
                </div>
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${statusStyle(b.status)}`}>{b.status}</span>
              </div>

              <div className="mt-3 grid gap-1.5 text-sm">
                <div className="flex items-center gap-2"><Building2 className="h-3.5 w-3.5 text-muted-foreground" /><span className="font-semibold">{b.full_name}</span>{b.company && <span className="text-muted-foreground">· {b.company}</span>}</div>
                <div className="flex items-center gap-2 text-muted-foreground"><Mail className="h-3.5 w-3.5" /> {b.email}</div>
                {b.phone && <div className="flex items-center gap-2 text-muted-foreground"><Phone className="h-3.5 w-3.5" /> {b.phone}</div>}
                {(b.start_date||b.end_date) && <div className="flex items-center gap-2 text-muted-foreground"><Calendar className="h-3.5 w-3.5" /> {b.start_date || "?"} → {b.end_date || "?"}</div>}
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  Channel: <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-0.5">{b.channel === "whatsapp" ? <><MessageCircle className="h-3 w-3"/>WhatsApp</> : <><Mail className="h-3 w-3"/>Email</>}</span>
                </div>
                {b.message && <p className="mt-2 rounded-lg bg-secondary/50 p-3 text-xs">{b.message}</p>}
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {b.status === "pending" && (
                  <>
                    <button onClick={()=>setStatus(b.id,"approved")} className="inline-flex items-center gap-1 rounded-full bg-emerald px-3 py-1.5 text-xs font-semibold text-emerald-foreground hover:scale-[1.02]"><CheckCircle2 className="h-3.5 w-3.5"/> Approve</button>
                    <button onClick={()=>setStatus(b.id,"rejected")} className="inline-flex items-center gap-1 rounded-full bg-destructive px-3 py-1.5 text-xs font-semibold text-destructive-foreground hover:scale-[1.02]"><XCircle className="h-3.5 w-3.5"/> Reject</button>
                  </>
                )}
                {b.status === "approved" && (
                  <button onClick={()=>setStatus(b.id,"completed")} className="inline-flex items-center gap-1 rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:scale-[1.02]"><Flag className="h-3.5 w-3.5"/> Mark completed</button>
                )}
                {b.invoice_id ? (
                  <button onClick={()=>nav({to:"/invoices/$id", params:{id:b.invoice_id}})} className="inline-flex items-center gap-1 rounded-full bg-gradient-emerald px-3 py-1.5 text-xs font-semibold text-emerald-foreground"><FileText className="h-3.5 w-3.5"/> View invoice</button>
                ) : (
                  <button disabled={busy===b.id} onClick={()=>generateInvoice(b)} className="inline-flex items-center gap-1 rounded-full bg-gradient-gold px-3 py-1.5 text-xs font-semibold text-gold-foreground disabled:opacity-60"><FileText className="h-3.5 w-3.5"/> {busy===b.id?"Generating…":"Generate invoice"}</button>
                )}
                <a target="_blank" rel="noopener" href={`https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(b.email)}&su=${encodeURIComponent(`Re: Your AEL rental request AEL-${b.id.slice(0,8).toUpperCase()}`)}`} className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-1.5 text-xs font-semibold hover:bg-muted"><Mail className="h-3.5 w-3.5"/> Gmail</a>
                <a target="_blank" rel="noopener" href={`https://wa.me/2348061306621?text=${encodeURIComponent(`Hello ${b.full_name}, regarding your AEL rental request AEL-${b.id.slice(0,8).toUpperCase()} for ${b.equipment}.`)}`} className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-1.5 text-xs font-semibold hover:bg-muted"><MessageCircle className="h-3.5 w-3.5"/> WhatsApp</a>
                <select value={b.status} onChange={(e)=>setStatus(b.id, e.target.value)} className="rounded-full border border-border bg-card px-3 py-1.5 text-xs">
                  {STATUSES.map(s=><option key={s} value={s}>{s}</option>)}
                </select>
                <button onClick={()=>remove(b.id)} className="ml-auto p-1.5 text-muted-foreground hover:text-destructive"><Trash2 className="h-3.5 w-3.5"/></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
