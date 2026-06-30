import { createFileRoute } from "@tanstack/react-router";
import { PageHero } from "@/components/page-hero";

export const Route = createFileRoute("/clients")({
  head: () => ({
    meta: [
      { title: "Clients — AIPATECH Energy" },
      { name: "description", content: "Our clients include Shell, ExxonMobil, Chevron, NLNG, Halliburton and Total." },
    ],
  }),
  component: Clients,
});

const CLIENTS = ["Shell", "ExxonMobil", "Chevron", "NNPC", "NLNG", "Halliburton", "Total", "Dangote", "Schlumberger", "Baker Hughes", "Saipem", "Weatherford"];

function Clients() {
  return (
    <>
      <PageHero eyebrow="Clients" title="Trusted by the world's leading energy operators." sub="We partner with majors, national companies and service contractors across the region." />
      <section className="container-x py-20">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {CLIENTS.map((c) => (
            <div key={c} className="grid h-32 place-items-center rounded-2xl border border-border bg-card font-display text-2xl font-bold tracking-tight text-muted-foreground shadow-soft transition-all hover:-translate-y-1 hover:text-primary hover:shadow-card">
              {c}
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
