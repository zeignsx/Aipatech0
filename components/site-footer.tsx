import { Link } from "@tanstack/react-router";
import { Mail, Phone, MapPin, Flame } from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-border bg-secondary/40">
      <div className="container-x grid gap-10 py-14 md:grid-cols-4">
        <div>
          <div className="flex items-center gap-2 font-display font-bold">
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-gradient-hero text-primary-foreground">
              <Flame className="h-5 w-5" />
            </span>
            <span>AIPATECH Energy</span>
          </div>
          <p className="mt-3 text-sm text-muted-foreground">
            Indigenous Nigerian oil & gas engineering, manufacturing and integrity management since 2019.
          </p>
        </div>
        <div>
          <h4 className="text-sm font-semibold">Company</h4>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li><Link to="/about" className="hover:text-foreground">About</Link></li>
            <li><Link to="/services" className="hover:text-foreground">Services</Link></li>
            <li><Link to="/projects" className="hover:text-foreground">Projects</Link></li>
            <li><Link to="/clients" className="hover:text-foreground">Clients</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-semibold">Resources</h4>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li><Link to="/hses" className="hover:text-foreground">HSES Policies</Link></li>
            <li><Link to="/rentals" className="hover:text-foreground">Equipment Rentals</Link></li>
            <li><Link to="/contact" className="hover:text-foreground">Contact</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-semibold">Reach Us</h4>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2"><MapPin className="mt-0.5 h-4 w-4 text-emerald" /><span>Abuja &amp; Port Harcourt, Nigeria</span></li>
            <li className="flex items-center gap-2"><Phone className="h-4 w-4 text-emerald" /><span>+234 800 000 0000</span></li>
            <li className="flex items-center gap-2"><Mail className="h-4 w-4 text-emerald" /><span>info@aipatechenergy.com</span></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border">
        <div className="container-x flex flex-col items-center justify-between gap-2 py-5 text-xs text-muted-foreground sm:flex-row">
          <p>© {new Date().getFullYear()} AIPATECH Energy Limited. All rights reserved.</p>
          <p>Excellence • Innovation • Integrity</p>
        </div>
      </div>
    </footer>
  );
}
