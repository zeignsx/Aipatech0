import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHero } from "@/components/page-hero";
import { Cog, Factory, Wrench, ShieldCheck, Droplets, Hammer, BookOpen, Recycle, Drill, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/services")({
  head: () => ({
    meta: [
      { title: "Services — AIPATECH Energy" },
      { name: "description", content: "Equipment design, manufacturing, rentals, integrity, fabrication, consultancy, waste management and OCTG tools." },
    ],
  }),
  component: Services,
});

const SERVICES = [
  { icon: Cog, t: "Oil & Gas Equipment Design", d: "Concept-to-detail engineering of pressure vessels, skids, manifolds and process packages." },
  { icon: Factory, t: "Manufacturing Services", d: "ASME / API compliant fabrication and assembly at our workshops." },
  { icon: Drill, t: "Equipment Rental", d: "Compressors, generators, pumps and drying units available short and long term." },
  { icon: ShieldCheck, t: "Integrity Management", d: "RBI, NDT, inspection and asset life-cycle programs." },
  { icon: Wrench, t: "Corrosion Control", d: "Cathodic protection design, coatings and chemical inhibition." },
  { icon: Hammer, t: "Fabrication & Rehabilitation", d: "Refurbishment of pipelines, vessels and rotating equipment." },
  { icon: BookOpen, t: "Consultancy Services", d: "Technical advisory, project management and process safety." },
  { icon: Recycle, t: "Waste Management", d: "Drilling waste treatment, transport and compliant disposal." },
  { icon: Droplets, t: "OCTG Oil Tools", d: "Casing, tubing and downhole tool supply, servicing and storage." },
];

function Services() {
  return (
    <>
      <PageHero eyebrow="Services" title="Integrated services across the energy value chain." sub="From front-end engineering to in-field execution, we deliver end-to-end capability." />
      <section className="container-x grid gap-6 py-20 sm:grid-cols-2 lg:grid-cols-3">
        {SERVICES.map((s) => (
          <div key={s.t} className="group flex flex-col rounded-2xl border border-border bg-card p-7 shadow-soft transition-all hover:-translate-y-1 hover:shadow-card">
            <span className="grid h-12 w-12 place-items-center rounded-xl bg-gradient-hero text-primary-foreground shadow-soft">
              <s.icon className="h-6 w-6" />
            </span>
            <h3 className="mt-5 text-lg font-semibold">{s.t}</h3>
            <p className="mt-2 flex-1 text-sm text-muted-foreground">{s.d}</p>
            <Link to="/contact" className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-emerald hover:underline">
              Learn more <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        ))}
      </section>
    </>
  );
}
