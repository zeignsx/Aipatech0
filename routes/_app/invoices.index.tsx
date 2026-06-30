import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Plus } from "lucide-react";

export const Route = createFileRoute("/_app/invoices/")({
  component: InvoicesList,
});

function InvoicesList() {
  const [list, setList] = useState<any[]>([]);
  useEffect(() => {
    supabase.from("invoices").select("*, customer:customers(name,company)").order("created_at",{ascending:false}).then(({data})=>setList(data ?? []));
  }, []);
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Invoices</h1>
          <p className="text-sm text-muted-foreground">All invoices you've issued.</p>
        </div>
        <Link to="/invoices/new" className="inline-flex items-center gap-1 rounded-full bg-gradient-hero px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-soft hover:scale-[1.02]"><Plus className="h-4 w-4" /> New invoice</Link>
      </div>
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
        {list.length === 0 ? (
          <div className="p-12 text-center text-sm text-muted-foreground">No invoices yet.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-secondary/50 text-left text-xs uppercase tracking-wider text-muted-foreground">
              <tr><th className="px-4 py-3">Number</th><th>Customer</th><th>Issued</th><th>Due</th><th>Status</th><th className="px-4 text-right">Total</th></tr>
            </thead>
            <tbody>
              {list.map((i)=>(
                <tr key={i.id} className="border-t border-border hover:bg-muted/30">
                  <td className="px-4 py-3"><Link to="/invoices/$id" params={{id:i.id}} className="font-semibold text-primary hover:underline">{i.invoice_number}</Link></td>
                  <td>{i.customer?.company || i.customer?.name || "—"}</td>
                  <td>{i.issue_date}</td>
                  <td>{i.due_date ?? "—"}</td>
                  <td><span className="inline-flex rounded-full bg-muted px-2.5 py-0.5 text-xs font-semibold capitalize">{i.status}</span></td>
                  <td className="px-4 text-right font-semibold">{Number(i.total).toLocaleString(undefined,{style:"currency",currency:i.currency||"USD"})}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
