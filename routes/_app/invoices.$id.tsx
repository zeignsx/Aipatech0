import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Printer, ArrowLeft, Flame } from "lucide-react";

export const Route = createFileRoute("/_app/invoices/$id")({
  component: InvoiceDetail,
});

function InvoiceDetail() {
  const { id } = useParams({ from: "/_app/invoices/$id" });
  const [inv, setInv] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);
  const [customer, setCustomer] = useState<any>(null);

  useEffect(() => {
    (async () => {
      const { data: i } = await supabase.from("invoices").select("*").eq("id", id).single();
      setInv(i);
      if (i?.customer_id) {
        const { data: c } = await supabase.from("customers").select("*").eq("id", i.customer_id).single();
        setCustomer(c);
      }
      const { data: it } = await supabase.from("invoice_items").select("*").eq("invoice_id", id).order("position");
      setItems(it ?? []);
    })();
  }, [id]);

  const updateStatus = async (s: string) => {
    await supabase.from("invoices").update({ status: s as any }).eq("id", id);
    setInv({ ...inv, status: s });
  };

  if (!inv) return <div className="text-muted-foreground">Loading…</div>;
  const fmt = (n:number)=>Number(n).toLocaleString(undefined,{style:"currency",currency:inv.currency||"USD"});

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between print:hidden">
        <Link to="/invoices" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" /> Back</Link>
        <div className="flex items-center gap-2">
          <select value={inv.status} onChange={(e)=>updateStatus(e.target.value)} className="rounded-lg border border-input bg-background px-3 py-2 text-sm">
            {["draft","sent","paid","overdue","cancelled"].map(s=><option key={s} value={s}>{s}</option>)}
          </select>
          <button onClick={()=>window.print()} className="inline-flex items-center gap-1 rounded-full bg-gradient-hero px-5 py-2 text-sm font-semibold text-primary-foreground shadow-soft hover:scale-[1.02]">
            <Printer className="h-4 w-4" /> Print / PDF
          </button>
        </div>
      </div>

      <article className="overflow-hidden rounded-2xl border border-border bg-card shadow-card print:border-0 print:shadow-none">
        <header className="bg-gradient-hero px-10 py-8 text-primary-foreground">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2 font-display font-bold">
              <span className="grid h-10 w-10 place-items-center rounded-lg bg-white/15"><Flame className="h-5 w-5" /></span>
              <div>
                <div className="text-lg leading-tight">AIPATECH Energy Limited</div>
                <div className="text-xs text-white/80">Abuja • Port Harcourt, Nigeria</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs uppercase tracking-widest text-white/80">Invoice</div>
              <div className="text-2xl font-extrabold">{inv.invoice_number}</div>
              <div className="mt-1 inline-flex rounded-full bg-white/15 px-2 py-0.5 text-xs font-semibold capitalize">{inv.status}</div>
            </div>
          </div>
        </header>

        <div className="grid gap-8 p-10 sm:grid-cols-2">
          <div>
            <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Bill to</div>
            <div className="mt-2 font-semibold">{customer?.company || customer?.name || "—"}</div>
            {customer?.name && customer?.company && <div className="text-sm text-muted-foreground">{customer.name}</div>}
            {customer?.email && <div className="text-sm text-muted-foreground">{customer.email}</div>}
            {customer?.address && <div className="text-sm text-muted-foreground">{customer.address}</div>}
          </div>
          <div className="sm:text-right">
            <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Dates</div>
            <div className="mt-2 text-sm"><span className="text-muted-foreground">Issued:</span> <strong>{inv.issue_date}</strong></div>
            <div className="text-sm"><span className="text-muted-foreground">Due:</span> <strong>{inv.due_date ?? "—"}</strong></div>
          </div>
        </div>

        <div className="px-10">
          <table className="w-full text-sm">
            <thead className="border-y border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
              <tr><th className="py-3">Description</th><th className="text-right">Qty</th><th className="text-right">Unit price</th><th className="text-right">Amount</th></tr>
            </thead>
            <tbody>
              {items.map((it)=>(
                <tr key={it.id} className="border-b border-border">
                  <td className="py-3">{it.description}</td>
                  <td className="text-right">{Number(it.quantity)}</td>
                  <td className="text-right">{fmt(it.unit_price)}</td>
                  <td className="text-right font-semibold">{fmt(it.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="grid gap-6 p-10 sm:grid-cols-2">
          <div className="text-sm text-muted-foreground">
            <div className="text-xs font-semibold uppercase tracking-widest text-foreground">Notes</div>
            <p className="mt-2 whitespace-pre-line">{inv.notes}</p>
          </div>
          <div className="space-y-2 sm:justify-self-end sm:text-right">
            <Row l="Subtotal" v={fmt(inv.subtotal)} />
            <Row l={`Tax (${inv.tax_rate}%)`} v={fmt(inv.tax_amount)} />
            <div className="mt-3 flex items-center justify-between gap-12 border-t border-border pt-3 sm:justify-end">
              <span className="font-bold">Total</span>
              <span className="text-2xl font-extrabold text-gradient">{fmt(inv.total)}</span>
            </div>
          </div>
        </div>
        <footer className="border-t border-border bg-secondary/40 px-10 py-4 text-center text-xs text-muted-foreground">
          AIPATECH Energy Limited • info@aipatechenergy.com • +234 800 000 0000
        </footer>
      </article>

      <style>{`@media print { body { background: white; } aside, header.sticky { display: none !important; } main { padding: 0 !important; } .container-x { max-width: none; padding: 0; } }`}</style>
    </div>
  );
}

function Row({l,v}:{l:string;v:string}) {
  return <div className="flex items-center justify-between gap-12 text-sm sm:justify-end"><span className="text-muted-foreground">{l}</span><span className="font-semibold">{v}</span></div>;
}
