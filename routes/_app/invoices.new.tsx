import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Trash2, Plus } from "lucide-react";

export const Route = createFileRoute("/_app/invoices/new")({
  component: NewInvoice,
});

type Item = { description: string; quantity: number; unit_price: number };

function NewInvoice() {
  const nav = useNavigate();
  const [customers, setCustomers] = useState<any[]>([]);
  const [customerId, setCustomerId] = useState<string>("");
  const [number, setNumber] = useState("INV-" + Date.now().toString().slice(-6));
  const [issueDate, setIssueDate] = useState(new Date().toISOString().slice(0,10));
  const [dueDate, setDueDate] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [taxRate, setTaxRate] = useState(7.5);
  const [notes, setNotes] = useState("Thank you for your business.");
  const [items, setItems] = useState<Item[]>([{ description: "", quantity: 1, unit_price: 0 }]);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string|null>(null);

  // Quick customer add
  const [newCust, setNewCust] = useState({ name: "", company: "", email: "" });

  useEffect(() => { supabase.from("customers").select("*").order("name").then(({data})=>setCustomers(data ?? [])); }, []);

  const subtotal = items.reduce((s, it) => s + (Number(it.quantity)||0) * (Number(it.unit_price)||0), 0);
  const tax = subtotal * (Number(taxRate)||0) / 100;
  const total = subtotal + tax;

  const updateItem = (idx: number, patch: Partial<Item>) => {
    setItems((arr) => arr.map((it,i)=> i===idx ? {...it, ...patch} : it));
  };
  const addItem = () => setItems((a)=>[...a, { description:"", quantity:1, unit_price:0 }]);
  const removeItem = (i:number) => setItems((a)=>a.filter((_,x)=>x!==i));

  const addCustomer = async () => {
    if (!newCust.name) return;
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return;
    const { data, error } = await supabase.from("customers").insert({ ...newCust, owner_id: u.user.id }).select().single();
    if (!error && data) { setCustomers((c)=>[...c, data]); setCustomerId(data.id); setNewCust({name:"",company:"",email:""}); }
  };

  const save = async () => {
    setErr(null); setSaving(true);
    try {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) throw new Error("Not signed in");
      if (items.some(i=>!i.description)) throw new Error("All line items need a description");
      const { data: inv, error } = await supabase.from("invoices").insert({
        owner_id: u.user.id, customer_id: customerId || null,
        invoice_number: number, issue_date: issueDate, due_date: dueDate || null,
        currency, tax_rate: taxRate, subtotal, tax_amount: tax, total, notes,
      }).select().single();
      if (error) throw error;
      const itemsRows = items.map((it, i) => ({
        invoice_id: inv.id, description: it.description, quantity: it.quantity,
        unit_price: it.unit_price, amount: Number(it.quantity)*Number(it.unit_price), position: i,
      }));
      const { error: e2 } = await supabase.from("invoice_items").insert(itemsRows);
      if (e2) throw e2;
      nav({ to: "/invoices/$id", params: { id: inv.id } });
    } catch(e:any) { setErr(e.message); } finally { setSaving(false); }
  };

  const fmt = (n:number)=>n.toLocaleString(undefined,{style:"currency",currency});

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">New invoice</h1>
        <p className="text-sm text-muted-foreground">Create and send a professional invoice in seconds.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
            <h2 className="font-semibold">Details</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Field label="Invoice number" v={number} on={setNumber} />
              <div>
                <label className="text-sm font-medium">Currency</label>
                <select value={currency} onChange={(e)=>setCurrency(e.target.value)} className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm">
                  {["USD","NGN","EUR","GBP"].map(c=><option key={c}>{c}</option>)}
                </select>
              </div>
              <Field label="Issue date" type="date" v={issueDate} on={setIssueDate} />
              <Field label="Due date" type="date" v={dueDate} on={setDueDate} />
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">Line items</h2>
              <button onClick={addItem} className="inline-flex items-center gap-1 rounded-full bg-secondary px-3 py-1.5 text-xs font-semibold hover:bg-muted"><Plus className="h-3.5 w-3.5" /> Add row</button>
            </div>
            <div className="mt-4 space-y-3">
              {items.map((it, i) => (
                <div key={i} className="grid gap-2 rounded-xl border border-border p-3 sm:grid-cols-[1fr_90px_120px_120px_auto] sm:items-center">
                  <input placeholder="Description" value={it.description} onChange={(e)=>updateItem(i,{description:e.target.value})} className="rounded-lg border border-input bg-background px-3 py-2 text-sm" />
                  <input type="number" min={0} step="0.01" value={it.quantity} onChange={(e)=>updateItem(i,{quantity:Number(e.target.value)})} className="rounded-lg border border-input bg-background px-3 py-2 text-sm" />
                  <input type="number" min={0} step="0.01" value={it.unit_price} onChange={(e)=>updateItem(i,{unit_price:Number(e.target.value)})} className="rounded-lg border border-input bg-background px-3 py-2 text-sm" />
                  <div className="text-right text-sm font-semibold">{fmt(it.quantity*it.unit_price)}</div>
                  <button onClick={()=>removeItem(i)} className="justify-self-end p-2 text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
            <h2 className="font-semibold">Notes</h2>
            <textarea value={notes} onChange={(e)=>setNotes(e.target.value)} rows={3} className="mt-2 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" />
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
            <h2 className="font-semibold">Customer</h2>
            <select value={customerId} onChange={(e)=>setCustomerId(e.target.value)} className="mt-3 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm">
              <option value="">— Select —</option>
              {customers.map(c=><option key={c.id} value={c.id}>{c.company || c.name}</option>)}
            </select>
            <details className="mt-4">
              <summary className="cursor-pointer text-sm font-semibold text-primary">+ Quick add customer</summary>
              <div className="mt-3 space-y-2">
                <input placeholder="Name" value={newCust.name} onChange={(e)=>setNewCust({...newCust,name:e.target.value})} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" />
                <input placeholder="Company" value={newCust.company} onChange={(e)=>setNewCust({...newCust,company:e.target.value})} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" />
                <input placeholder="Email" value={newCust.email} onChange={(e)=>setNewCust({...newCust,email:e.target.value})} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" />
                <button onClick={addCustomer} className="w-full rounded-lg bg-secondary px-3 py-1.5 text-sm font-semibold hover:bg-muted">Add</button>
              </div>
            </details>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
            <h2 className="font-semibold">Summary</h2>
            <Row l="Subtotal" v={fmt(subtotal)} />
            <div className="mt-3 flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Tax rate %</span>
              <input type="number" min={0} step="0.1" value={taxRate} onChange={(e)=>setTaxRate(Number(e.target.value))} className="w-20 rounded-lg border border-input bg-background px-2 py-1 text-right text-sm" />
            </div>
            <Row l="Tax" v={fmt(tax)} />
            <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
              <span className="font-bold">Total</span>
              <span className="text-xl font-extrabold text-gradient">{fmt(total)}</span>
            </div>
            {err && <p className="mt-3 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{err}</p>}
            <button onClick={save} disabled={saving} className="mt-4 w-full rounded-full bg-gradient-hero px-5 py-2.5 font-semibold text-primary-foreground shadow-soft hover:scale-[1.01] disabled:opacity-60">
              {saving ? "Saving…" : "Save invoice"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({label,v,on,type="text"}:{label:string;v:string;on:(s:string)=>void;type?:string}) {
  return (
    <div>
      <label className="text-sm font-medium">{label}</label>
      <input type={type} value={v} onChange={(e)=>on(e.target.value)} className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" />
    </div>
  );
}
function Row({l,v}:{l:string;v:string}) {
  return <div className="mt-3 flex items-center justify-between text-sm"><span className="text-muted-foreground">{l}</span><span className="font-semibold">{v}</span></div>;
}
