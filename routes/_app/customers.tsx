import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Plus } from "lucide-react";

export const Route = createFileRoute("/_app/customers")({
  component: Customers,
});

function Customers() {
  const [list, setList] = useState<any[]>([]);
  const [form, setForm] = useState({ name:"", company:"", email:"", phone:"", address:"" });
  const [err, setErr] = useState<string|null>(null);

  const load = () => supabase.from("customers").select("*").order("created_at",{ascending:false}).then(({data})=>setList(data ?? []));
  useEffect(() => { load(); }, []);

  const add = async (e: React.FormEvent) => {
    e.preventDefault(); setErr(null);
    if (!form.name) { setErr("Name required"); return; }
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return;
    const { error } = await supabase.from("customers").insert({ ...form, owner_id: u.user.id });
    if (error) { setErr(error.message); return; }
    setForm({ name:"", company:"", email:"", phone:"", address:"" });
    load();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Customers</h1>
        <p className="text-sm text-muted-foreground">Your billing contacts.</p>
      </div>
      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
          {list.length === 0 ? (
            <div className="p-10 text-center text-sm text-muted-foreground">No customers yet.</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-secondary/50 text-left text-xs uppercase tracking-wider text-muted-foreground">
                <tr><th className="px-4 py-3">Name</th><th>Company</th><th>Email</th><th>Phone</th></tr>
              </thead>
              <tbody>
                {list.map((c)=>(
                  <tr key={c.id} className="border-t border-border">
                    <td className="px-4 py-3 font-semibold">{c.name}</td>
                    <td>{c.company || "—"}</td>
                    <td>{c.email || "—"}</td>
                    <td>{c.phone || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        <form onSubmit={add} className="space-y-3 rounded-2xl border border-border bg-card p-6 shadow-soft">
          <h2 className="font-semibold">Add customer</h2>
          {(["name","company","email","phone","address"] as const).map((k)=>(
            <input key={k} placeholder={k[0].toUpperCase()+k.slice(1)} value={(form as any)[k]} onChange={(e)=>setForm({...form,[k]:e.target.value})} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" />
          ))}
          {err && <p className="text-sm text-destructive">{err}</p>}
          <button className="inline-flex w-full items-center justify-center gap-1 rounded-full bg-gradient-hero px-4 py-2 text-sm font-semibold text-primary-foreground shadow-soft hover:scale-[1.01]">
            <Plus className="h-4 w-4" /> Add customer
          </button>
        </form>
      </div>
    </div>
  );
}
