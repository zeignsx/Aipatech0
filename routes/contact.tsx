import { createFileRoute } from "@tanstack/react-router";
import { PageHero } from "@/components/page-hero";
import { Mail, Phone, MapPin } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact — AIPATECH Energy" },
      { name: "description", content: "Reach our Abuja and Port Harcourt offices, or send us a message." },
    ],
  }),
  component: Contact,
});

function Contact() {
  const [sent, setSent] = useState(false);
  return (
    <>
      <PageHero eyebrow="Contact" title="Let's talk about your next project." sub="Our engineers respond within one business day." />
      <section className="container-x grid gap-10 py-20 lg:grid-cols-[1fr_1.2fr]">
        <div className="space-y-5">
          {[
            { city: "Abuja Office", addr: "Plot 0000, Central Business District, Abuja, FCT", phone: "+234 800 000 0001" },
            { city: "Port Harcourt Office", addr: "Trans-Amadi Industrial Layout, Port Harcourt, Rivers State", phone: "+234 800 000 0002" },
          ].map((o) => (
            <div key={o.city} className="rounded-2xl border border-border bg-card p-6 shadow-soft">
              <h3 className="font-semibold">{o.city}</h3>
              <p className="mt-2 flex items-start gap-2 text-sm text-muted-foreground"><MapPin className="mt-0.5 h-4 w-4 text-emerald" /> {o.addr}</p>
              <p className="mt-1 flex items-center gap-2 text-sm text-muted-foreground"><Phone className="h-4 w-4 text-emerald" /> {o.phone}</p>
              <p className="mt-1 flex items-center gap-2 text-sm text-muted-foreground"><Mail className="h-4 w-4 text-emerald" /> info@aipatechenergy.com</p>
            </div>
          ))}
          <div className="overflow-hidden rounded-2xl border border-border shadow-soft">
            <iframe
              title="Map"
              src="https://www.openstreetmap.org/export/embed.html?bbox=3.0%2C6.4%2C7.6%2C9.2&amp;layer=mapnik"
              className="h-64 w-full"
              loading="lazy"
            />
          </div>
        </div>

        <form
          onSubmit={(e) => { e.preventDefault(); setSent(true); }}
          className="rounded-2xl border border-border bg-card p-8 shadow-card"
        >
          <h3 className="text-xl font-bold">Send us a message</h3>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <Field label="Full name" name="name" />
            <Field label="Email" name="email" type="email" />
            <Field label="Company" name="company" />
            <Field label="Phone" name="phone" />
          </div>
          <Field label="Subject" name="subject" className="mt-4" />
          <div className="mt-4">
            <label className="text-sm font-medium">Message</label>
            <textarea required maxLength={1000} rows={5} className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" />
          </div>
          <button className="mt-6 inline-flex items-center justify-center rounded-full bg-gradient-hero px-6 py-3 font-semibold text-primary-foreground shadow-soft transition-transform hover:scale-[1.02]">
            Send message
          </button>
          {sent && <p className="mt-4 text-sm text-emerald">Thanks — we'll be in touch shortly.</p>}
        </form>
      </section>
    </>
  );
}

function Field({ label, name, type = "text", className = "" }: { label: string; name: string; type?: string; className?: string }) {
  return (
    <div className={className}>
      <label className="text-sm font-medium" htmlFor={name}>{label}</label>
      <input id={name} name={name} type={type} required maxLength={120} className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" />
    </div>
  );
}
