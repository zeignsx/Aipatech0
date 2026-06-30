import { createFileRoute } from "@tanstack/react-router";
import { PageHero } from "@/components/page-hero";
import { Award, Sparkles, Lightbulb, HeartHandshake, ShieldCheck, Users, Sun } from "lucide-react";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About — AIPATECH Energy Limited" },
      { name: "description", content: "Our story, mission, vision and core values driving Nigeria's premier indigenous oil & gas service provider." },
    ],
  }),
  component: About,
});

const VALUES = [
  { icon: Award, t: "Excellence" },
  { icon: Sparkles, t: "Professionalism" },
  { icon: Lightbulb, t: "Innovation" },
  { icon: HeartHandshake, t: "Social Responsibility" },
  { icon: ShieldCheck, t: "Integrity" },
  { icon: Users, t: "Teamwork" },
  { icon: Sun, t: "Faith in God" },
];

function About() {
  return (
    <>
      <PageHero eyebrow="About AEL" title="Building Nigeria's energy future, one project at a time." sub="Established in 2019, AIPATECH Energy Limited is an indigenous engineering company serving the Nigerian oil & gas value chain." />
      <section className="container-x grid gap-12 py-20 lg:grid-cols-2">
        <div>
          <h2 className="text-3xl font-bold">Our story</h2>
          <p className="mt-4 text-muted-foreground">
            AIPATECH Energy Limited (AEL) was founded to deliver world-class engineering and equipment services with an indigenous Nigerian footprint. We combine technical expertise with deep local knowledge to support operators across the upstream, midstream and downstream sectors.
          </p>
          <p className="mt-4 text-muted-foreground">
            From design and fabrication to integrity management and field operations, our multidisciplinary team is trusted by majors, NOCs and independents to deliver safe, on-spec and on-time outcomes.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl bg-gradient-hero p-8 text-primary-foreground shadow-card">
            <h3 className="text-xs uppercase tracking-widest text-white/80">Mission</h3>
            <p className="mt-3 font-semibold">Create value for partners through excellence and innovation, prioritising safety, environmental responsibility and sustainable growth.</p>
          </div>
          <div className="rounded-2xl bg-gradient-emerald p-8 text-primary-foreground shadow-card">
            <h3 className="text-xs uppercase tracking-widest text-white/80">Vision</h3>
            <p className="mt-3 font-semibold">Become the premier indigenous oil & gas service provider driven by excellence and innovation.</p>
          </div>
        </div>
      </section>

      <section className="bg-secondary/40 py-20">
        <div className="container-x">
          <h2 className="text-center text-3xl font-bold">Core values</h2>
          <p className="mx-auto mt-3 max-w-xl text-center text-muted-foreground">The principles that guide every project we undertake.</p>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {VALUES.map((v) => (
              <div key={v.t} className="flex items-center gap-3 rounded-2xl border border-border bg-card p-5 shadow-soft">
                <span className="grid h-10 w-10 place-items-center rounded-lg bg-gradient-gold text-gold-foreground"><v.icon className="h-5 w-5" /></span>
                <span className="font-semibold">{v.t}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
