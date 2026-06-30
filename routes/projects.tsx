import { createFileRoute } from "@tanstack/react-router";
import { PageHero } from "@/components/page-hero";
import { MapPin, Clock, CheckCircle2, Image as ImageIcon } from "lucide-react";

export const Route = createFileRoute("/projects")({
  head: () => ({
    meta: [
      { title: "Projects — AIPATECH Energy" },
      { name: "description", content: "Selected oil & gas projects delivered for Shell, ExxonMobil, Chevron, NNPC, Total and Dangote Refinery." },
    ],
  }),
  component: Projects,
});

// Project images - replace with your actual image URLs
const PROJECT_IMAGES = {
  pipeline: "https://images.unsplash.com/photo-1546188994-07c34f6e5e1b?w=800&h=600&fit=crop",
  octg: "https://images.unsplash.com/photo-1581094288338-2314dddb7ece?w=800&h=600&fit=crop",
  compressor: "https://images.unsplash.com/photo-1581092335390-9e6e6e0930e1?w=800&h=600&fit=crop",
  wellhead: "https://images.unsplash.com/photo-1581093588401-fbb62a02f120?w=800&h=600&fit=crop",
  skid: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&h=600&fit=crop",
  waste: "https://images.unsplash.com/photo-1581093196277-9f3a1f2a9e3a?w=800&h=600&fit=crop",
};

const PROJECTS = [
  { 
    t: "Pipeline Integrity Program", 
    c: "Shell Nigeria", 
    l: "Niger Delta", 
    s: "Completed", 
    d: "18 months", 
    desc: "End-to-end pipeline inspection, NDT and corrosion mitigation across 320 km of trunk lines.",
    img: PROJECT_IMAGES.pipeline,
    gradient: "from-blue-600 to-cyan-600"
  },
  { 
    t: "OCTG Supply & Threading", 
    c: "ExxonMobil", 
    l: "Akwa Ibom", 
    s: "Ongoing", 
    d: "24 months", 
    desc: "Multi-year supply of premium connection casing and tubing with on-site storage.",
    img: PROJECT_IMAGES.octg,
    gradient: "from-emerald-600 to-teal-600"
  },
  { 
    t: "Compressor Station Upgrade", 
    c: "Chevron", 
    l: "Escravos", 
    s: "Completed", 
    d: "9 months", 
    desc: "Refurbishment and re-rate of two reciprocating compressor packages.",
    img: PROJECT_IMAGES.compressor,
    gradient: "from-purple-600 to-pink-600"
  },
  { 
    t: "Wellhead Maintenance", 
    c: "NNPC", 
    l: "Port Harcourt", 
    s: "Ongoing", 
    d: "12 months", 
    desc: "Routine and breakdown maintenance of cluster wellheads with HSE oversight.",
    img: PROJECT_IMAGES.wellhead,
    gradient: "from-orange-600 to-red-600"
  },
  { 
    t: "Process Skid Fabrication", 
    c: "Dangote Refinery", 
    l: "Lagos", 
    s: "Completed", 
    d: "6 months", 
    desc: "Design, fabrication and FAT of metering and chemical injection skids.",
    img: PROJECT_IMAGES.skid,
    gradient: "from-indigo-600 to-blue-600"
  },
  { 
    t: "Drilling Waste Treatment", 
    c: "Total E&P", 
    l: "OML 58", 
    s: "Completed", 
    d: "8 months", 
    desc: "Containerised treatment of cuttings with 98% volume reduction.",
    img: PROJECT_IMAGES.waste,
    gradient: "from-rose-600 to-red-600"
  },
];

function Projects() {
  return (
    <>
      <PageHero 
        eyebrow="Projects" 
        title="Delivering for the operators that move Nigeria." 
        sub="A snapshot of recent work across upstream and downstream assets." 
      />
      
      <section className="container-x grid gap-6 py-20 md:grid-cols-2 lg:grid-cols-3">
        {PROJECTS.map((p, index) => (
          <article 
            key={p.t} 
            className="group overflow-hidden rounded-2xl border border-border bg-card shadow-soft transition-all hover:-translate-y-1 hover:shadow-card hover:shadow-2xl"
          >
            {/* Image Section */}
            <div className="relative h-56 overflow-hidden">
              <img 
                src={p.img} 
                alt={p.t} 
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                loading="lazy"
                onError={(e) => {
                  // Fallback if image fails to load
                  (e.target as HTMLImageElement).style.display = 'none';
                  const parent = (e.target as HTMLImageElement).parentElement;
                  if (parent) {
                    const fallback = document.createElement('div');
                    fallback.className = `w-full h-full bg-gradient-to-br ${p.gradient} flex items-center justify-center`;
                    fallback.innerHTML = `<svg class="w-16 h-16 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>`;
                    parent.appendChild(fallback);
                  }
                }}
              />
              
              {/* Gradient Overlay */}
              <div className={`absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-60 group-hover:opacity-40 transition-opacity`} />
              
              {/* Client Badge */}
              <div className="absolute bottom-4 left-4">
                <div className="inline-flex items-center gap-2 rounded-full bg-black/50 backdrop-blur-md px-3 py-1.5 text-xs font-semibold text-white border border-white/10">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  {p.c}
                </div>
              </div>
              
              {/* Status Badge */}
              <div className={`absolute right-4 top-4 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold backdrop-blur-md border border-white/20 ${
                p.s === "Completed" 
                  ? "bg-emerald-500/80 text-white" 
                  : "bg-gold-500/80 text-white"
              }`}>
                <CheckCircle2 className="h-3.5 w-3.5" /> 
                {p.s}
              </div>
              
              {/* Duration Badge */}
              <div className="absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full bg-black/50 backdrop-blur-md px-3 py-1.5 text-xs font-semibold text-white border border-white/10">
                <Clock className="h-3.5 w-3.5 text-emerald-400" />
                {p.d}
              </div>
            </div>
            
            {/* Content Section */}
            <div className="p-6">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                {p.t}
              </h3>
              
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed line-clamp-3">
                {p.desc}
              </p>
              
              <div className="mt-4 flex items-center gap-3 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1.5 bg-gray-100 dark:bg-gray-800 px-2.5 py-1 rounded-full">
                  <MapPin className="h-3.5 w-3.5 text-emerald-500" /> 
                  {p.l}
                </span>
                <span className="inline-flex items-center gap-1.5 bg-gray-100 dark:bg-gray-800 px-2.5 py-1 rounded-full">
                  <Clock className="h-3.5 w-3.5 text-emerald-500" /> 
                  {p.d}
                </span>
              </div>
              
              {/* Progress Bar for Ongoing Projects */}
              {p.s === "Ongoing" && (
                <div className="mt-4">
                  <div className="flex justify-between text-xs text-muted-foreground mb-1">
                    <span>Progress</span>
                    <span>{Math.floor(Math.random() * 40 + 50)}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-full transition-all duration-1000"
                      style={{ width: `${Math.floor(Math.random() * 40 + 50)}%` }}
                    />
                  </div>
                </div>
              )}
              
              {/* View Details Link */}
              <button 
                className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors group/btn"
                onClick={() => window.location.href = '/contact'}
              >
                View Project Details
                <svg className="w-4 h-4 transition-transform group-hover/btn:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </article>
        ))}
      </section>
    </>
  );
}