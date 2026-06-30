import { createFileRoute, Link } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import {
  ArrowRight,
  Shield,
  Cog,
  Wrench,
  Droplets,
  Factory,
  Recycle,
  ChevronRight,
  Flame,
  Anchor,
  Gauge,
  PlayCircle,
  Sparkles,
  TrendingUp,
  CheckCircle2,
} from "lucide-react";
import heroImg from "@/assets/hero-cinematic.jpg";
import rig from "@/assets/ng-offshore-rig.jpg";
import refinery from "@/assets/ng-refinery.jpg";
import engineers from "@/assets/ng-engineers.jpg";
import lng from "@/assets/ng-lng.jpg";
import fpso from "@/assets/ng-fpso.jpg";
import pipes from "@/assets/ng-pipes.jpg";
import { useSiteImage } from "@/hooks/use-site-image";
import { HeroMedia } from "@/components/HeroMedia";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "AIPATECH Energy Limited — Premier Oil & Gas Engineering" },
      { name: "description", content: "Engineering services, equipment manufacturing, integrity & waste management for the Nigerian oil & gas sector." },
    ],
  }),
  component: Home,
});

const STATS = [
  { v: "50+", l: "Projects Delivered" },
  { v: "20+", l: "Industry Clients" },
  { v: "2019", l: "Established" },
  { v: "100%", l: "HSE Commitment" },
];

const FEATURED = [
  { icon: Cog, title: "Equipment Design", desc: "Custom oil & gas equipment engineered for harsh field conditions." },
  { icon: Factory, title: "Manufacturing", desc: "In-house fabrication of OCTG, pressure vessels and skids." },
  { icon: Shield, title: "Integrity Management", desc: "Asset inspection, NDT and corrosion control programs." },
  { icon: Wrench, title: "Maintenance", desc: "Onshore & offshore maintenance with 24/7 field support." },
  { icon: Droplets, title: "Waste Management", desc: "Compliant treatment and disposal of drilling residues." },
  { icon: Recycle, title: "Rehabilitation", desc: "Refurbishment of pipelines, vessels and rotating equipment." },
];

const CLIENTS = ["Shell", "ExxonMobil", "Chevron", "NNPC", "Total", "NLNG", "Halliburton", "Dangote"];

function Home() {
  const heroSrc = useSiteImage("hero_main", heroImg);
  const servicesBg = useSiteImage("home_services_bg", engineers);
  const ctaBg = useSiteImage("home_cta_bg", fpso);
  return (
    <div className="relative overflow-hidden">
      {/* Ambient color blobs that bleed through every glass surface */}
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-40 -left-32 h-[480px] w-[480px] rounded-full bg-emerald/30 blur-[140px] dark:bg-emerald/20" />
        <div className="absolute top-1/3 -right-40 h-[520px] w-[520px] rounded-full bg-gold/30 blur-[160px] dark:bg-gold/15" />
        <div className="absolute bottom-0 left-1/3 h-[420px] w-[420px] rounded-full bg-primary/30 blur-[160px] dark:bg-primary/25" />
      </div>

      {/* HERO — split cinematic */}
      <section className="relative pt-10 pb-20 lg:pt-16">
        {/* Animated grid background */}
        <div aria-hidden className="absolute inset-0 -z-10 [background-image:linear-gradient(to_right,color-mix(in_oklab,var(--foreground)_5%,transparent)_1px,transparent_1px),linear-gradient(to_bottom,color-mix(in_oklab,var(--foreground)_5%,transparent)_1px,transparent_1px)] [background-size:48px_48px] [mask-image:radial-gradient(ellipse_at_center,black_40%,transparent_75%)]" />

        <div className="container-x grid items-center gap-10 lg:grid-cols-12 lg:gap-12">
          {/* LEFT — copy */}
          <div className="lg:col-span-6">
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="inline-flex items-center gap-2 rounded-full border border-emerald/30 bg-emerald/10 px-3 py-1.5 text-xs font-semibold text-emerald backdrop-blur"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>Indigenous Nigerian Energy Engineering</span>
              <span className="ml-1 rounded-full bg-emerald/20 px-2 py-0.5 text-[10px]">EST. 2019</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.05 }}
              className="mt-6 font-display text-5xl font-extrabold leading-[0.95] tracking-tight text-foreground sm:text-6xl lg:text-7xl xl:text-[88px]"
            >
              Powering{" "}
              <span className="relative inline-block">
                <span className="relative z-10 bg-[linear-gradient(135deg,oklch(0.45_0.18_255),oklch(0.22_0.14_260))] bg-clip-text text-transparent dark:bg-[linear-gradient(135deg,oklch(0.78_0.14_240),oklch(0.55_0.16_255))]">Africa's</span>
                <span aria-hidden className="absolute inset-x-0 bottom-1 -z-0 h-3 w-full rounded-full bg-primary/30 blur-sm" />
              </span>{" "}
              energy{" "}
              <span className="bg-gradient-emerald bg-clip-text text-transparent">future</span>.
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.15 }}
              className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground"
            >
              From the swamps of the Niger Delta to deepwater Bonny — AEL delivers integrated engineering, fabrication, integrity and waste management for the West African oil & gas sector.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.25 }}
              className="mt-8 flex flex-wrap items-center gap-3"
            >
              <Link
                to="/services"
                className="group relative inline-flex items-center gap-2 overflow-hidden rounded-full bg-gradient-gold px-7 py-3.5 font-semibold text-gold-foreground shadow-glow transition-transform hover:scale-[1.03]"
              >
                <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
                <span className="relative">Explore Services</span>
                <ArrowRight className="relative h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
              <Link
                to="/projects"
                className="glass inline-flex items-center gap-2 rounded-full px-6 py-3.5 font-semibold text-foreground transition-colors hover:bg-foreground/5"
              >
                <PlayCircle className="h-5 w-5 text-emerald" />
                See our work
              </Link>
            </motion.div>

            {/* trust row */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-3 text-xs text-muted-foreground"
            >
              {["NUPRC compliant", "ISO 9001 aligned", "Local content certified", "Zero-harm HSE"].map((t) => (
                <div key={t} className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald" />
                  <span className="font-medium">{t}</span>
                </div>
              ))}
            </motion.div>
          </div>

          {/* RIGHT — image stack with HeroMedia */}
          <div className="relative lg:col-span-6">
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8 }}
              className="relative"
            >
              {/* glow rings */}
              <div aria-hidden className="absolute -inset-6 -z-10 rounded-[2.5rem] bg-gradient-to-tr from-emerald/30 via-primary/20 to-gold/30 opacity-70 blur-2xl" />

              {/* main image with HeroMedia */}
              <div className="relative overflow-hidden rounded-[2rem] border border-white/10 shadow-card aspect-[4/5] sm:aspect-[5/4] lg:aspect-[4/5]">
                <HeroMedia 
                  category="hero"
                  key="hero_main"
                  fallback={heroSrc}
                  className="w-full h-full"
                >
                  {/* Gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-background/70 via-transparent to-transparent" />

                  {/* live operations chip */}
                  <div className="glass-dark absolute left-5 top-5 flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold text-white">
                    <span className="relative flex h-2 w-2">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald opacity-75" />
                      <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald" />
                    </span>
                    Live Operations · Niger Delta
                  </div>

                  {/* bottom info card */}
                  <div className="glass-strong absolute bottom-5 left-5 right-5 rounded-2xl p-4">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Active Project</div>
                        <div className="mt-0.5 text-sm font-bold">FPSO Integrity Campaign — OML 130</div>
                      </div>
                      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-emerald text-emerald-foreground">
                        <Anchor className="h-5 w-5" />
                      </div>
                    </div>
                  </div>
                </HeroMedia>
              </div>

              {/* floating stat card top-right */}
              <motion.div
                initial={{ opacity: 0, x: 20, y: -10 }}
                animate={{ opacity: 1, x: 0, y: 0 }}
                transition={{ duration: 0.7, delay: 0.5 }}
                className="glass-strong absolute -right-4 top-12 hidden w-48 rounded-2xl p-4 shadow-glow sm:block lg:-right-8"
              >
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <TrendingUp className="h-4 w-4 text-emerald" /> Uptime YTD
                </div>
                <div className="mt-1 text-3xl font-extrabold text-gradient">99.7%</div>
                <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                  <div className="h-full w-[97%] rounded-full bg-gradient-emerald" />
                </div>
              </motion.div>

              {/* floating badge bottom-left */}
              <motion.div
                initial={{ opacity: 0, x: -20, y: 10 }}
                animate={{ opacity: 1, x: 0, y: 0 }}
                transition={{ duration: 0.7, delay: 0.55 }}
                className="glass-strong absolute -left-4 bottom-24 hidden items-center gap-3 rounded-2xl p-3 pr-5 shadow-glow sm:flex lg:-left-8"
              >
                <div className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-gold text-gold-foreground">
                  <Flame className="h-6 w-6" />
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground">5+ years</div>
                  <div className="text-sm font-bold">Field-proven</div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>

        {/* STATS strip */}
        <div className="container-x mt-16">
          <div className="glass-strong grid grid-cols-2 divide-y divide-border rounded-3xl shadow-card sm:grid-cols-4 sm:divide-x sm:divide-y-0">
            {STATS.map((s) => (
              <div key={s.l} className="p-6 text-center">
                <div className="text-3xl font-extrabold text-gradient sm:text-4xl">{s.v}</div>
                <div className="mt-2 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">{s.l}</div>
              </div>
            ))}
          </div>
        </div>

        {/* marquee ticker */}
        <div className="mt-14 overflow-hidden border-y border-border/60 bg-secondary/30 py-4">
          <div className="flex animate-[marquee_40s_linear_infinite] gap-12 whitespace-nowrap">
            {[...CLIENTS, ...CLIENTS, ...CLIENTS].map((c, i) => (
              <span key={i} className="font-display text-2xl font-bold text-muted-foreground/60">
                {c} <span className="mx-6 text-emerald">◆</span>
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* IMAGE MOSAIC + INTRO */}
      <section className="container-x py-24">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <MosaicGallery />

          <div>
            <div className="text-xs font-semibold uppercase tracking-widest text-emerald">Who we are</div>
            <h2 className="mt-2 text-3xl font-bold sm:text-4xl">
              Powering Nigeria's energy industry with indigenous capability.
            </h2>
            <p className="mt-4 text-muted-foreground">
              From the swamps of the Niger Delta to deepwater fields offshore Bonny, AEL provides the engineering muscle, equipment and field crews that keep production flowing — safely, sustainably, and on schedule.
            </p>
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {[
                { icon: Anchor, t: "Offshore-ready", d: "FPSO, platform & subsea support across West Africa." },
                { icon: Gauge, t: "Asset Integrity", d: "NDT, corrosion control & inspection programs." },
                { icon: Factory, t: "Local Fabrication", d: "OCTG, pressure vessels and process skids." },
                { icon: Shield, t: "HSE First", d: "Zero-harm culture aligned with NUPRC standards." },
              ].map((c) => (
                <div key={c.t} className="glass rounded-2xl p-4">
                  <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
                    <c.icon className="h-5 w-5" />
                  </div>
                  <div className="mt-3 text-sm font-semibold">{c.t}</div>
                  <div className="mt-1 text-xs text-muted-foreground">{c.d}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FEATURED SERVICES — glass cards */}
      <section className="relative py-24">
        <div className="absolute inset-0 -z-10">
          <img src={servicesBg} alt="Nigerian oil & gas engineers" loading="lazy" className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-background/85 backdrop-blur-md dark:bg-background/85" />
        </div>
        <div className="container-x">
          <div className="mb-12 flex items-end justify-between gap-6">
            <div>
              <div className="text-xs font-semibold uppercase tracking-widest text-emerald">What we do</div>
              <h2 className="mt-2 text-3xl font-bold sm:text-4xl">Integrated energy services</h2>
            </div>
            <Link to="/services" className="hidden items-center gap-1 text-sm font-semibold text-primary hover:underline sm:inline-flex">
              View all <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURED.map((s, i) => (
              <motion.div
                key={s.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="glass group rounded-2xl p-6 transition-all hover:-translate-y-1 hover:shadow-glow"
              >
                <div className="grid h-12 w-12 place-items-center rounded-xl bg-gradient-emerald text-emerald-foreground shadow-soft">
                  <s.icon className="h-6 w-6" />
                </div>
                <h3 className="mt-5 text-lg font-semibold">{s.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{s.desc}</p>
                <Link to="/services" className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-primary opacity-0 transition-opacity group-hover:opacity-100">
                  Learn more <ArrowRight className="h-4 w-4" />
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* keep rig import used */}
      <div hidden aria-hidden><img src={rig} alt="" /></div>

      {/* CTA */}
      <section className="container-x pb-24">
        <div className="relative overflow-hidden rounded-3xl shadow-card">
          <img src={ctaBg} alt="FPSO offshore Nigeria" loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-primary/85 via-primary/70 to-emerald/60" />
          <div className="relative grid gap-6 p-10 text-primary-foreground sm:grid-cols-[1fr_auto] sm:items-center sm:p-16">
            <div>
              <h3 className="text-3xl font-bold sm:text-4xl">Ready to power your next project?</h3>
              <p className="mt-3 max-w-2xl text-white/85">
                Talk to our engineers about equipment supply, integrity programs, fabrication and offshore field services.
              </p>
            </div>
            <Link
              to="/contact"
              className="inline-flex items-center gap-2 self-start rounded-full bg-gold px-6 py-3 font-semibold text-gold-foreground shadow-glow hover:scale-105"
            >
              Contact our team <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

const MOSAIC = [
  {
    src: refinery,
    alt: "Nigerian refinery flare stacks at dusk",
    span: "col-span-4 row-span-4",
    title: "Refinery Operations",
    tag: "Downstream",
    desc: "Turnaround maintenance, catalyst handling and flare-system integrity for major Nigerian refineries.",
  },
  {
    src: pipes,
    alt: "Crude oil pipeline valves",
    span: "col-span-2 row-span-3",
    title: "Pipeline Integrity",
    tag: "Midstream",
    desc: "Inline inspection, valve servicing and corrosion control across crude and product pipelines.",
  },
  {
    src: fpso,
    alt: "FPSO vessel offshore Nigeria",
    span: "col-span-2 row-span-3",
    title: "FPSO Support",
    tag: "Offshore",
    desc: "Topside maintenance, mooring inspection and turret services on West African FPSOs.",
  },
  {
    src: lng,
    alt: "LNG storage and pipelines",
    span: "col-span-4 row-span-2",
    title: "LNG Facilities",
    tag: "Gas",
    desc: "Cryogenic equipment integrity, loading-arm overhauls and compressor station support.",
  },
] as const;

function MosaicGallery() {
  const [active, setActive] = useState<number | null>(null);
  return (
    <div
      className="relative grid h-[520px] grid-cols-6 grid-rows-6 gap-3 [perspective:1400px]"
      onMouseLeave={() => setActive(null)}
    >
      {MOSAIC.map((m, i) => {
        const isActive = active === i;
        return (
          <motion.button
            key={m.title}
            type="button"
            onClick={() => setActive((p) => (p === i ? null : i))}
            onMouseEnter={() => setActive(i)}
            className={`group relative overflow-hidden rounded-3xl text-left shadow-card outline-none ring-emerald/50 focus-visible:ring-2 ${m.span}`}
            initial={{ opacity: 0, y: 20, rotateX: 8 }}
            whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: i * 0.08 }}
            whileHover={{ scale: 1.03, rotateY: 4, rotateX: -3, z: 30 }}
            style={{ transformStyle: "preserve-3d" }}
          >
            <motion.img
              src={m.src}
              alt={m.alt}
              loading="lazy"
              className="absolute inset-0 h-full w-full object-cover"
              animate={{ scale: isActive ? 1.12 : 1 }}
              transition={{ duration: 0.7, ease: "easeOut" }}
            />
            {/* permanent subtle bottom shade */}
            <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-background/80 to-transparent" />

            {/* tag chip */}
            <div className="absolute left-3 top-3 z-10 rounded-full bg-emerald/90 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-emerald-foreground shadow-soft">
              {m.tag}
            </div>

            {/* glassy half-cover */}
            <AnimatePresence>
              {isActive && (
                <motion.div
                  key="cover"
                  initial={{ y: "100%", opacity: 0 }}
                  animate={{ y: "0%", opacity: 1 }}
                  exit={{ y: "100%", opacity: 0 }}
                  transition={{ type: "spring", stiffness: 220, damping: 28 }}
                  className="glass-strong absolute inset-x-0 bottom-0 h-1/2 rounded-t-3xl border-t border-white/20 p-5"
                >
                  <motion.h3
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="text-lg font-bold text-foreground"
                  >
                    {m.title}
                  </motion.h3>
                  <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.18 }}
                    className="mt-2 line-clamp-3 text-xs text-muted-foreground sm:text-sm"
                  >
                    {m.desc}
                  </motion.p>
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.28 }}
                    className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-emerald"
                  >
                    Explore <ArrowRight className="h-3 w-3" />
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.button>
        );
      })}

      <div className="glass-strong pointer-events-none absolute -bottom-6 -left-6 hidden rounded-2xl p-4 shadow-glow sm:block">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-emerald text-emerald-foreground">
            <Flame className="h-5 w-5" />
          </div>
          <div>
            <div className="text-xs uppercase tracking-wider text-muted-foreground">Niger Delta</div>
            <div className="text-sm font-semibold">Tap any image to learn more</div>
          </div>
        </div>
      </div>
    </div>
  );
}