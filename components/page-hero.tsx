import { motion } from "framer-motion";

export function PageHero({ eyebrow, title, sub }: { eyebrow: string; title: string; sub?: string }) {
  return (
    <section className="relative overflow-hidden bg-gradient-hero py-20 text-primary-foreground">
      <div className="absolute -right-32 top-0 h-72 w-72 rounded-full bg-gold/30 blur-3xl" />
      <div className="absolute -left-20 bottom-0 h-72 w-72 rounded-full bg-emerald/30 blur-3xl" />
      <div className="container-x relative">
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <span className="inline-block rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest backdrop-blur">
            {eyebrow}
          </span>
          <h1 className="mt-5 max-w-3xl text-4xl font-extrabold sm:text-5xl lg:text-6xl">{title}</h1>
          {sub && <p className="mt-4 max-w-2xl text-white/85">{sub}</p>}
        </motion.div>
      </div>
    </section>
  );
}
