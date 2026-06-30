import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useIsAdmin } from "@/hooks/use-is-admin";
import { Plus, Pencil, Trash2, Upload, Save, X, ShieldAlert, Eye, EyeOff, Wrench } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/manage-rentals")({
  component: ManageRentals,
});

type Rental = {
  id: string; name: string; category: string; description: string | null;
  image_url: string | null; day_rate: number; active: boolean; position: number;
};

const empty: Omit<Rental, "id"> = { name: "", category: "General", description: "", image_url: "", day_rate: 0, active: true, position: 0 };

function ManageRentals() {
  const { loading, isAdmin } = useIsAdmin();
  const [list, setList] = useState<Rental[]>([]);
  const [editing, setEditing] = useState<Rental | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<Omit<Rental, "id">>(empty);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    const { data, error } = await supabase.from("rentals").select("*").order("position").order("created_at");
    if (error) { toast.error(error.message); return; }
    setList((data ?? []) as Rental[]);
  };
  useEffect(() => { load(); }, []);

  if (loading) return <div className="text-muted-foreground">Loading…</div>;
  if (!isAdmin) return (
    <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-8 text-center">
      <ShieldAlert className="mx-auto h-10 w-10 text-destructive" />
      <h2 className="mt-3 text-xl font-bold">Admin only</h2>
    </div>
  );

  const startCreate = () => { setForm(empty); setCreating(true); setEditing(null); };
  const startEdit = (r: Rental) => { setEditing(r); setCreating(false); setForm({ ...r, description: r.description ?? "", image_url: r.image_url ?? "" }); };
  const cancel = () => { setEditing(null); setCreating(false); setForm(empty); };

  const uploadImage = async (file: File) => {
    setBusy(true);
    try {
      const ext = file.name.split(".").pop() || "jpg";
      const path = `rental-${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("site-images").upload(path, file, { upsert: true, contentType: file.type });
      if (error) throw error;
      const { data: pub } = supabase.storage.from("site-images").getPublicUrl(path);
      setForm((f) => ({ ...f, image_url: pub.publicUrl }));
      toast.success("Image uploaded");
    } catch (e: any) { toast.error(e.message); }
    finally { setBusy(false); }
  };

  const save = async () => {
    if (!form.name.trim()) { toast.error("Name is required"); return; }
    setBusy(true);
    try {
      if (editing) {
        const { error } = await supabase.from("rentals").update({
          name: form.name, category: form.category, description: form.description || null,
          image_url: form.image_url || null, day_rate: Number(form.day_rate) || 0,
          active: form.active, position: Number(form.position) || 0,
        }).eq("id", editing.id);
        if (error) throw error;
        toast.success("Rental updated");
      } else {
        const { error } = await supabase.from("rentals").insert({
          name: form.name, category: form.category, description: form.description || null,
          image_url: form.image_url || null, day_rate: Number(form.day_rate) || 0,
          active: form.active, position: Number(form.position) || (list.length + 1),
        });
        if (error) throw error;
        toast.success("Rental added");
      }
      cancel(); load();
    } catch (e: any) { toast.error(e.message); }
    finally { setBusy(false); }
  };

  const remove = async (r: Rental) => {
    if (!confirm(`Delete "${r.name}"?`)) return;
    const { error } = await supabase.from("rentals").delete().eq("id", r.id);
    if (error) { toast.error(error.message); return; }
    toast.success("Deleted"); load();
  };

  const toggleActive = async (r: Rental) => {
    const { error } = await supabase.from("rentals").update({ active: !r.active }).eq("id", r.id);
    if (error) { toast.error(error.message); return; }
    load();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold">Rental fleet</h1>
          <p className="text-sm text-muted-foreground">Add, edit, deactivate and price the equipment shown on your public Rentals page.</p>
        </div>
        <button onClick={startCreate} className="inline-flex items-center gap-1 rounded-full bg-gradient-gold px-4 py-2 text-sm font-semibold text-gold-foreground shadow-soft hover:scale-[1.02]">
          <Plus className="h-4 w-4" /> Add rental
        </button>
      </div>

      {(creating || editing) && (
        <div className="rounded-2xl border border-primary/40 bg-card p-5 shadow-card">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">{editing ? "Edit rental" : "New rental"}</h2>
            <button onClick={cancel} className="rounded-full p-1 hover:bg-muted"><X className="h-4 w-4" /></button>
          </div>
          <div className="mt-4 grid gap-3 lg:grid-cols-[200px_1fr]">
            <div>
              <div className="aspect-[4/3] overflow-hidden rounded-xl border border-border bg-secondary">
                {form.image_url ? <img src={form.image_url} alt="" className="h-full w-full object-cover" /> :
                  <div className="grid h-full place-items-center text-xs text-muted-foreground">No image</div>}
              </div>
              <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e)=>{const f=e.target.files?.[0]; if(f) uploadImage(f); e.target.value="";}} />
              <button type="button" onClick={()=>fileRef.current?.click()} disabled={busy} className="mt-2 inline-flex w-full items-center justify-center gap-1 rounded-full border border-border px-3 py-2 text-xs font-semibold hover:bg-muted">
                <Upload className="h-3.5 w-3.5"/> Upload image
              </button>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Lab label="Name *"><input value={form.name} onChange={(e)=>setForm({...form,name:e.target.value})} className="i" /></Lab>
              <Lab label="Category"><input value={form.category} onChange={(e)=>setForm({...form,category:e.target.value})} className="i" /></Lab>
              <Lab label="Day rate ($)"><input type="number" min="0" value={form.day_rate} onChange={(e)=>setForm({...form,day_rate:Number(e.target.value)})} className="i" /></Lab>
              <Lab label="Sort order"><input type="number" value={form.position} onChange={(e)=>setForm({...form,position:Number(e.target.value)})} className="i" /></Lab>
              <Lab label="Description" className="sm:col-span-2">
                <textarea rows={2} value={form.description ?? ""} onChange={(e)=>setForm({...form,description:e.target.value})} className="i" />
              </Lab>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.active} onChange={(e)=>setForm({...form,active:e.target.checked})} /> Active (visible on website)
              </label>
            </div>
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <button onClick={cancel} className="rounded-full border border-border px-4 py-2 text-sm">Cancel</button>
            <button onClick={save} disabled={busy} className="inline-flex items-center gap-1 rounded-full bg-gradient-hero px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60">
              <Save className="h-4 w-4" /> {busy ? "Saving…" : "Save"}
            </button>
          </div>
        </div>
      )}

      {list.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card p-16 text-center text-sm text-muted-foreground">
          <Wrench className="mx-auto mb-2 h-8 w-8" />
          No rentals yet. Click "Add rental" to start your fleet.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {list.map((r) => (
            <div key={r.id} className={`overflow-hidden rounded-2xl border bg-card shadow-soft ${r.active ? "border-border" : "border-dashed border-muted opacity-70"}`}>
              <div className="relative aspect-[16/10] bg-secondary">
                {r.image_url ? <img src={r.image_url} alt={r.name} className="h-full w-full object-cover" /> :
                  <div className="grid h-full place-items-center text-xs text-muted-foreground">No image</div>}
                <span className="absolute right-2 top-2 rounded-full bg-background/80 px-2 py-0.5 text-[10px] font-bold backdrop-blur">${Number(r.day_rate).toLocaleString()}/day</span>
                {!r.active && <span className="absolute left-2 top-2 rounded-full bg-destructive/80 px-2 py-0.5 text-[10px] font-bold text-destructive-foreground">Hidden</span>}
              </div>
              <div className="p-4">
                <div className="text-xs uppercase tracking-wider text-muted-foreground">{r.category}</div>
                <h3 className="mt-1 text-sm font-bold">{r.name}</h3>
                {r.description && <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{r.description}</p>}
                <div className="mt-3 flex flex-wrap gap-1.5">
                  <button onClick={()=>startEdit(r)} className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-1 text-xs hover:bg-muted"><Pencil className="h-3 w-3"/> Edit</button>
                  <button onClick={()=>toggleActive(r)} className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-1 text-xs hover:bg-muted">
                    {r.active ? <><EyeOff className="h-3 w-3"/> Hide</> : <><Eye className="h-3 w-3"/> Show</>}
                  </button>
                  <button onClick={()=>remove(r)} className="ml-auto inline-flex items-center gap-1 rounded-full border border-destructive/40 px-3 py-1 text-xs text-destructive hover:bg-destructive/10"><Trash2 className="h-3 w-3"/> Delete</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <style>{`.i{width:100%;border:1px solid hsl(var(--input));background:hsl(var(--background));border-radius:.5rem;padding:.5rem .75rem;font-size:.875rem;outline:none}`}</style>
    </div>
  );
}

function Lab({ label, children, className = "" }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <label className={`block ${className}`}>
      <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}
