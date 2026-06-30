import { createFileRoute } from "@tanstack/react-router";
import { PageHero } from "@/components/page-hero";
import { HeartPulse, HardHat, Leaf, Lock, Wrench } from "lucide-react";

export const Route = createFileRoute("/hses")({
  head: () => ({
    meta: [
      { title: "HSES — Health, Safety, Environment & Security" },
      { name: "description", content: "Our HSES policies and commitments at AIPATECH Energy Limited." },
    ],
  }),
  component: HSES,
});

const POLICIES = [
  { icon: HeartPulse, t: "Health Policy", d: "Protect the health of our workforce through monitoring, training and proactive wellness programs." },
  { icon: HardHat, t: "Safety Policy", d: "Zero-harm culture enforced through risk assessment, PTW and continuous safety leadership." },
  { icon: Leaf, t: "Environmental Policy", d: "Minimise environmental impact via responsible waste handling, emissions control and stewardship." },
  { icon: Lock, t: "Security Policy", d: "Protect personnel, assets and information across all sites through layered security controls." },
  { icon: Wrench, t: "Equipment Maintenance", d: "Planned preventive maintenance ensures reliability, integrity and operational uptime." },
];

function HSES() {
  return (
    <>
      <PageHero eyebrow="HSES" title="Health, Safety, Environment & Security at the core." sub="Every decision is guided by a commitment to people, the environment and operational excellence." />
      <section className="container-x grid gap-6 py-20 md:grid-cols-2">
        {POLICIES.map((p) => (
          <div key={p.t} className="rounded-2xl border border-border bg-card p-7 shadow-soft">
            <div className="flex items-center gap-3">
              <span className="grid h-12 w-12 place-items-center rounded-xl bg-gradient-emerald text-emerald-foreground"><p.icon className="h-6 w-6" /></span>
              <h3 className="text-lg font-semibold">{p.t}</h3>
            </div>
            <p className="mt-4 text-muted-foreground">{p.d}</p>
          </div>
        ))}
      </section>
    </>
  );
}
