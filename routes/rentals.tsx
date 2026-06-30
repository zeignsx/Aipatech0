import { createFileRoute } from "@tanstack/react-router";
import { PageHero } from "@/components/page-hero";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Mail, MessageCircle, CheckCircle2, Calendar, Wrench, Loader2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import refinery from "@/assets/ng-refinery.jpg";

export const Route = createFileRoute("/rentals")({
  head: () => ({
    meta: [
      { title: "Equipment Rentals & Contract Services | AIPATECH Energy" },
      { name: "description", content: "Rent compressors, generators, OCTG handling and gas processing on flexible contract terms. Request a quote and we'll generate your invoice." },
    ],
  }),
  component: Rentals,
});

function Rentals() {
  const [FLEET, setFLEET] = useState<{ id: string; n: string; c: string; img: string; day: number; desc?: string | null }[]>([]);
  const [loadingFleet, setLoadingFleet] = useState(true);
  
  useEffect(() => {
    const loadFleet = async () => {
      setLoadingFleet(true);
      try {
        const { data, error } = await supabase
          .from("rentals")
          .select("*")
          .eq("active", true)
          .order("position", { ascending: true });

        if (error) {
          console.error("Error loading fleet:", error);
          toast.error("Failed to load equipment fleet");
          return;
        }

        setFLEET((data ?? []).map((r: any) => ({
          id: r.id,
          n: r.name,
          c: r.category,
          img: r.image_url || refinery,
          day: Number(r.day_rate),
          desc: r.description
        })));
      } catch (error) {
        console.error("Error loading fleet:", error);
        toast.error("Failed to load equipment fleet");
      } finally {
        setLoadingFleet(false);
      }
    };
    loadFleet();
  }, []);
  
  const [pick, setPick] = useState<string>("");
  const [form, setForm] = useState({
    full_name: "",
    company: "",
    email: "",
    phone: "",
    start_date: "",
    end_date: "",
    message: ""
  });
  const [channel, setChannel] = useState<"email" | "whatsapp">("email");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<{ ref: string } | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    
    // Validate
    if (!pick) {
      setErr("Please select equipment first.");
      return;
    }
    if (!form.full_name.trim()) {
      setErr("Full name is required.");
      return;
    }
    if (!form.email.trim() || !form.email.includes("@")) {
      setErr("Please enter a valid email address.");
      return;
    }

    setBusy(true);
    
    try {
      // Get current user session (if any)
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id || null;

      console.log("Submitting booking with:", {
        full_name: form.full_name,
        email: form.email,
        equipment: pick,
        userId
      });

      // Insert booking using Supabase client
      const { data, error } = await supabase
        .from("bookings")
        .insert({
          full_name: form.full_name.trim(),
          company: form.company?.trim() || null,
          email: form.email.trim(),
          phone: form.phone?.trim() || null,
          equipment: pick,
          start_date: form.start_date || null,
          end_date: form.end_date || null,
          channel: channel,
          message: form.message?.trim() || null,
          customer_user_id: userId,
          status: "pending",
        })
        .select("id")
        .single();

      if (error) {
        console.error("Supabase insert error:", error);
        
        // Check if it's a RLS error
        if (error.code === "42501" || error.message.includes("row-level security")) {
          setErr("Permission denied. Please try signing in or contact support.");
        } else {
          setErr(error.message || "Failed to submit booking. Please try again.");
        }
        return;
      }

      if (!data?.id) {
        setErr("Failed to create booking. No ID returned.");
        return;
      }

      const ref = "AEL-" + data.id.slice(0, 8).toUpperCase();
      
      // Prepare message for email/whatsapp
      const summary = `Hello AIPATECH Energy,%0A%0AI'd like a rental quote.%0AReference: ${ref}%0AEquipment: ${encodeURIComponent(pick)}%0AName: ${encodeURIComponent(form.full_name)}%0ACompany: ${encodeURIComponent(form.company)}%0APeriod: ${form.start_date || "?"} → ${form.end_date || "?"}%0A%0A${encodeURIComponent(form.message || "")}`;
      
      // Open communication channel
      if (channel === "whatsapp") {
        window.open(`https://wa.me/2348061306621?text=${summary}`, "_blank");
      } else {
        const gmail = `https://mail.google.com/mail/?view=cm&fs=1&to=rentals@aipatechenergy.com&su=Rental%20Request%20${ref}&body=${summary}`;
        window.open(gmail, "_blank");
      }

      setDone({ ref });
      toast.success("Booking submitted successfully!", {
        description: `Reference: ${ref}`,
      });
      
    } catch (error: any) {
      console.error("Booking submission error:", error);
      setErr(error.message || "Something went wrong. Please try again.");
      toast.error("Failed to submit booking");
    } finally {
      setBusy(false);
    }
  };

  if (loadingFleet) {
    return (
      <>
        <PageHero eyebrow="Rentals & Contract Services" title="Mission-critical equipment, on contract." sub="Loading available equipment..." />
        <section className="container-x py-16">
          <div className="flex justify-center items-center min-h-[200px]">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
          </div>
        </section>
      </>
    );
  }

  return (
    <>
      <PageHero eyebrow="Rentals & Contract Services" title="Mission-critical equipment, on contract." sub="AEL is a contract-based engineering company. Pick equipment, tell us your dates, and we'll generate an invoice and confirm via your preferred channel." />

      <section className="container-x grid gap-10 py-16 lg:grid-cols-[1.2fr_1fr]">
        {/* Fleet */}
        <div>
          <h2 className="font-display text-2xl font-bold">Available fleet</h2>
          <p className="mt-1 text-sm text-muted-foreground">Tap a unit to add it to your booking. Day rates indicative — final pricing on the invoice.</p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {FLEET.map((f) => {
              const active = pick === f.n;
              return (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setPick(f.n)}
                  className={`group relative overflow-hidden rounded-2xl border text-left shadow-soft transition-all hover:-translate-y-1 hover:shadow-card ${active ? "border-primary ring-2 ring-primary" : "border-border"}`}
                >
                  <div className="relative h-36 overflow-hidden">
                    <img src={f.img} alt={f.n} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" loading="lazy" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                    <span className="absolute right-2 top-2 rounded-full bg-white/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white backdrop-blur">{f.c}</span>
                    {active && (
                      <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold text-primary-foreground">
                        <CheckCircle2 className="h-3 w-3" /> Selected
                      </span>
                    )}
                  </div>
                  <div className="bg-card p-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold leading-tight">{f.n}</h3>
                      <span className="text-sm font-bold text-primary">${f.day}/day</span>
                    </div>
                    <p className="mt-1 inline-flex items-center gap-1 text-xs text-muted-foreground">
                      <Wrench className="h-3 w-3" /> {f.desc || "Field-serviced • crew optional"}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
          {FLEET.length === 0 && (
            <div className="mt-6 rounded-2xl border border-dashed border-border bg-card p-12 text-center text-sm text-muted-foreground">
              No equipment available right now. Please check back soon or contact us directly.
            </div>
          )}
        </div>

        {/* Booking box */}
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-3xl border border-border bg-card/80 p-6 shadow-card backdrop-blur-xl">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-xl font-bold">Book me</h3>
              <span className="rounded-full bg-emerald/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-emerald">Auto-invoice</span>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">Submit and we'll email or WhatsApp you a signed invoice within 1 business day.</p>

            {done ? (
              <div className="mt-6 rounded-2xl border border-emerald/40 bg-emerald/10 p-5 text-sm">
                <div className="flex items-center gap-2 font-semibold text-emerald">
                  <CheckCircle2 className="h-5 w-5" /> Request received
                </div>
                <p className="mt-2 text-foreground">
                  Reference <strong>{done.ref}</strong>. Our team will reach out via {channel === "whatsapp" ? "WhatsApp" : "email"} with your invoice.
                </p>
                <button 
                  onClick={() => {
                    setDone(null); 
                    setPick(""); 
                    setForm({ full_name: "", company: "", email: "", phone: "", start_date: "", end_date: "", message: "" });
                  }} 
                  className="mt-4 text-xs font-semibold text-primary hover:underline"
                >
                  Submit another
                </button>
              </div>
            ) : (
              <form onSubmit={submit} className="mt-5 space-y-3">
                <div className="rounded-xl border border-dashed border-border bg-secondary/40 px-3 py-2 text-xs">
                  <span className="text-muted-foreground">Equipment: </span>
                  <strong>{pick || "— select from fleet —"}</strong>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Input p="Full Name *" v={form.full_name} on={(v) => setForm({ ...form, full_name: v })} required />
                  <Input p="Company" v={form.company} on={(v) => setForm({ ...form, company: v })} />
                  <Input p="Email *" type="email" v={form.email} on={(v) => setForm({ ...form, email: v })} required />
                  <Input p="Phone" v={form.phone} on={(v) => setForm({ ...form, phone: v })} />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <label className="flex items-center gap-1 rounded-lg border border-input bg-background px-2 text-xs">
                    <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                    <input 
                      type="date" 
                      value={form.start_date} 
                      onChange={(e) => setForm({ ...form, start_date: e.target.value })} 
                      className="w-full bg-transparent py-2 text-sm outline-none" 
                    />
                  </label>
                  <label className="flex items-center gap-1 rounded-lg border border-input bg-background px-2 text-xs">
                    <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                    <input 
                      type="date" 
                      value={form.end_date} 
                      onChange={(e) => setForm({ ...form, end_date: e.target.value })} 
                      className="w-full bg-transparent py-2 text-sm outline-none" 
                    />
                  </label>
                </div>
                <textarea 
                  placeholder="Project notes…" 
                  value={form.message} 
                  onChange={(e) => setForm({ ...form, message: e.target.value })} 
                  rows={3} 
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" 
                />

                <div className="grid grid-cols-2 gap-2">
                  <button 
                    type="button" 
                    onClick={() => setChannel("email")} 
                    className={`flex items-center justify-center gap-1 rounded-full px-3 py-2 text-xs font-semibold transition-all ${channel === "email" ? "bg-gradient-hero text-primary-foreground" : "border border-border bg-background hover:bg-secondary"}`}
                  >
                    <Mail className="h-3.5 w-3.5" /> Email me
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setChannel("whatsapp")} 
                    className={`flex items-center justify-center gap-1 rounded-full px-3 py-2 text-xs font-semibold transition-all ${channel === "whatsapp" ? "bg-emerald text-emerald-foreground" : "border border-border bg-background hover:bg-secondary"}`}
                  >
                    <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
                  </button>
                </div>

                {err && (
                  <div className="flex items-start gap-2 rounded-md bg-destructive/10 px-3 py-2 text-xs text-destructive">
                    <AlertCircle className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
                    <span>{err}</span>
                  </div>
                )}

                <button 
                  type="submit"
                  disabled={busy} 
                  className="w-full rounded-full bg-gradient-gold px-5 py-3 font-semibold text-gold-foreground shadow-soft hover:scale-[1.01] transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {busy ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    "Request invoice"
                  )}
                </button>
              </form>
            )}
          </div>
        </aside>
      </section>
    </>
  );
}

function Input({ p, v, on, type = "text", required = false }: { p: string; v: string; on: (s: string) => void; type?: string; required?: boolean }) {
  return (
    <input 
      placeholder={p} 
      type={type} 
      value={v} 
      onChange={(e) => on(e.target.value)} 
      required={required}
      className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" 
    />
  );
}