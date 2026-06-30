import { Link, useRouterState } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Menu, X, Flame, User, Shield, LogOut, LayoutDashboard, ChevronDown, Home, Info, Briefcase, FolderKanban, Users, HardHat, Wrench, Mail, Sun, Moon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useTheme } from "./theme-provider";
import { NotificationBell } from "./NotificationBell";

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const path = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    setMounted(true);
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const getUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
        const { data: adminCheck } = await supabase.rpc("has_role", {
          _user_id: session.user.id,
          _role: "admin"
        });
        setIsAdmin(!!adminCheck);
      } else {
        setUser(null);
        setIsAdmin(false);
      }
    };
    
    getUser();
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(session.user);
        supabase.rpc("has_role", {
          _user_id: session.user.id,
          _role: "admin"
        }).then(({ data }) => setIsAdmin(!!data));
      } else {
        setUser(null);
        setIsAdmin(false);
      }
    });
    
    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  const NAV = [
    { to: "/", label: "Home", icon: Home },
    { to: "/about", label: "About", icon: Info },
    { to: "/services", label: "Services", icon: Briefcase },
    { to: "/projects", label: "Projects", icon: FolderKanban },
    { to: "/clients", label: "Clients", icon: Users },
    { to: "/hses", label: "HSES", icon: HardHat },
    { to: "/rentals", label: "Rentals", icon: Wrench },
    { to: "/contact", label: "Contact", icon: Mail },
  ];

  // Don't render theme-dependent UI until mounted
  if (!mounted) {
    return (
      <header className="sticky top-0 z-50 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="container-x">
          <div className="flex h-20 items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 shadow-lg">
                <Flame className="h-6 w-6 text-white" />
              </div>
              <div className="hidden sm:block">
                <span className="block font-display text-xl font-bold bg-gradient-to-r from-blue-700 to-blue-500 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                  AIPATECH
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>
    );
  }

  return (
    <>
      {/* Announcement Bar */}
      <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 text-white text-center py-2.5 text-sm font-medium">
        <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_0%,rgba(255,255,255,0.1)_50%,transparent_100%)] animate-[shimmer_3s_infinite]"></div>
        <div className="relative z-10 flex items-center justify-center gap-3">
          <span className="inline-block w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
          <span>🚀 Industry-leading equipment rental & engineering services in Nigeria</span>
          <span className="hidden sm:inline-block">| Contact us for special rates</span>
        </div>
      </div>

      {/* Main Header */}
      <header className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled 
          ? "bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl shadow-xl" 
          : "bg-white/90 dark:bg-gray-900/90 backdrop-blur-md"
      } border-b border-gray-200/50 dark:border-gray-800/50`}>
        <div className="container-x relative">
          <div className="flex h-20 items-center justify-between">
            {/* Logo */}
            <Link to="/" className="group relative flex items-center gap-3">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl blur-lg opacity-60 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="relative grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 shadow-lg">
                  <Flame className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="hidden sm:block">
                <span className="block font-display text-xl font-bold bg-gradient-to-r from-blue-700 to-blue-500 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                  AIPATECH
                </span>
                <span className="block text-[10px] font-semibold text-blue-600 dark:text-blue-400 tracking-wider">
                  ENERGY LIMITED
                </span>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-1">
              {NAV.map((n) => {
                const active = path === n.to;
                return (
                  <Link
                    key={n.to}
                    to={n.to}
                    className={`relative px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 group ${
                      active 
                        ? "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20" 
                        : "text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                    }`}
                  >
                    <span className="relative z-10 flex items-center gap-1.5">
                      <n.icon className="w-4 h-4" />
                      {n.label}
                    </span>
                    {active && (
                      <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500/10 to-cyan-500/10"></div>
                    )}
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0.5 bg-gradient-to-r from-blue-500 to-cyan-500 group-hover:w-1/2 transition-all duration-300"></div>
                  </Link>
                );
              })}
            </nav>

            {/* Right Side Buttons */}
            <div className="flex items-center gap-3">
              {/* Notification Bell */}
              <NotificationBell />

              {/* Theme Toggle */}
              <button
                onClick={toggleTheme}
                className="p-2 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-300"
                aria-label="Toggle theme"
              >
                {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
              
              {/* Get a Quote Button */}
              <Link
                to="/contact"
                className="hidden md:flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold text-sm shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all duration-300"
              >
                <span>Get a Quote</span>
                <ChevronDown className="w-4 h-4 opacity-70" />
              </Link>

              {/* Admin / User Button */}
              {user ? (
                <div className="relative">
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-300"
                  >
                    <div className="relative">
                      <div className={`absolute inset-0 rounded-full blur-md ${isAdmin ? 'bg-purple-500' : 'bg-blue-500'} opacity-50`}></div>
                      <div className={`relative grid h-8 w-8 place-items-center rounded-full ${isAdmin ? 'bg-gradient-to-r from-purple-500 to-pink-500' : 'bg-gradient-to-r from-blue-500 to-cyan-500'}`}>
                        <User className="h-4 w-4 text-white" />
                      </div>
                    </div>
                    <div className="hidden sm:block text-left">
                      <span className="block text-sm font-medium text-gray-900 dark:text-white">
                        {user.email?.split('@')[0] || 'User'}
                      </span>
                      <span className={`block text-[10px] font-semibold ${isAdmin ? 'text-purple-600 dark:text-purple-400' : 'text-blue-600 dark:text-blue-400'}`}>
                        {isAdmin ? 'Administrator' : 'Customer'}
                      </span>
                    </div>
                    <ChevronDown className={`w-4 h-4 text-gray-500 dark:text-gray-400 transition-transform duration-300 ${userMenuOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {/* Dropdown Menu */}
                  {userMenuOpen && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)}></div>
                      <div className="absolute right-0 mt-2 w-64 z-50">
                        <div className="rounded-2xl bg-white dark:bg-gray-800 shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                          <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-gray-700 dark:to-gray-700">
                            <p className="text-sm font-semibold text-gray-900 dark:text-white">{user.email}</p>
                            <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">Signed in as {isAdmin ? 'Admin' : 'User'}</p>
                          </div>
                          
                          <div className="p-2">
                            {isAdmin ? (
                              <Link
                                to="/admin/dashboard"
                                onClick={() => setUserMenuOpen(false)}
                                className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all"
                              >
                                <LayoutDashboard className="w-4 h-4" />
                                <span className="text-sm">Admin Dashboard</span>
                              </Link>
                            ) : (
                              <Link
                                to="/dashboard"
                                onClick={() => setUserMenuOpen(false)}
                                className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all"
                              >
                                <User className="w-4 h-4" />
                                <span className="text-sm">My Dashboard</span>
                              </Link>
                            )}
                            
                            <Link
                              to="/portal"
                              onClick={() => setUserMenuOpen(false)}
                              className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all"
                            >
                              <Shield className="w-4 h-4" />
                              <span className="text-sm">My Portal</span>
                            </Link>
                          </div>
                          
                          <div className="p-2 border-t border-gray-200 dark:border-gray-700">
                            <button
                              onClick={handleSignOut}
                              className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
                            >
                              <LogOut className="w-4 h-4" />
                              <span className="text-sm">Sign Out</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Link
                    to="/auth"
                    className="px-4 py-2 rounded-xl text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-300"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/auth"
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold text-sm shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all duration-300"
                  >
                    Sign Up
                  </Link>
                </div>
              )}

              {/* Mobile Menu Button */}
              <button
                onClick={() => setOpen(!open)}
                className="lg:hidden p-2 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all"
              >
                {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setOpen(false)}></div>
          <div className="fixed top-20 left-0 right-0 bg-white dark:bg-gray-900 shadow-2xl max-h-[calc(100vh-5rem)] overflow-y-auto">
            <div className="p-4 space-y-1">
              {NAV.map((n) => (
                <Link
                  key={n.to}
                  to={n.to}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
                >
                  <n.icon className="w-5 h-5" />
                  {n.label}
                </Link>
              ))}
              <div className="pt-4 mt-4 border-t border-gray-200 dark:border-gray-800">
                <Link
                  to="/contact"
                  onClick={() => setOpen(false)}
                  className="flex items-center justify-center px-4 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold"
                >
                  Get a Quote
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .animate-shimmer {
          animation: shimmer 3s infinite;
        }
      `}</style>
    </>
  );
}