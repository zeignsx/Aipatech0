import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { 
  Flame, Lock, Mail, ShieldCheck, User, ArrowLeft, 
  AlertCircle, Sparkles, Building2, Anchor, Factory, Wrench,
  ChevronRight, Award, Users, Calendar, Clock,
  Eye, EyeOff, Fingerprint, Loader2
} from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

export const Route = createFileRoute("/auth")({
  component: AuthPage,
});

type Mode = "signin" | "signup" | "forgot" | "verify";

const SLIDES = [
  {
    image: "https://images.unsplash.com/photo-1546188994-07c34f6e5e1b?w=1200&h=800&fit=crop",
    title: "Offshore Excellence",
    subtitle: "Deepwater operations in the Niger Delta",
    stats: "15+ Years Experience",
    icon: Anchor,
  },
  {
    image: "https://images.unsplash.com/photo-1581094288338-2314dddb7ece?w=1200&h=800&fit=crop",
    title: "Engineering Innovation",
    subtitle: "State-of-the-art equipment design",
    stats: "50+ Projects Delivered",
    icon: Factory,
  },
  {
    image: "https://images.unsplash.com/photo-1581092335390-9e6e6e0930e1?w=1200&h=800&fit=crop",
    title: "Asset Integrity",
    subtitle: "NDT & corrosion control programs",
    stats: "100% HSE Commitment",
    icon: ShieldCheck,
  },
  {
    image: "https://images.unsplash.com/photo-1581093588401-fbb62a02f120?w=1200&h=800&fit=crop",
    title: "Equipment Rentals",
    subtitle: "Mission-critical field equipment",
    stats: "24/7 Field Support",
    icon: Wrench,
  },
];

function AuthPage() {
  const nav = useNavigate();
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [fullName, setFullName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [redirecting, setRedirecting] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isHovering, setIsHovering] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [signupSuccess, setSignupSuccess] = useState(false);
  const slideInterval = useRef<NodeJS.Timeout | null>(null);

  // Get Supabase URL and key from environment
  const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
  const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || '';

  useEffect(() => {
    setMounted(true);
    return () => {
      if (slideInterval.current) clearInterval(slideInterval.current);
    };
  }, []);

  useEffect(() => {
    if (mounted) checkSessionAndRedirect();
  }, [mounted]);

  useEffect(() => {
    if (!mounted || isHovering) return;
    slideInterval.current = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % SLIDES.length);
    }, 5000);
    return () => {
      if (slideInterval.current) clearInterval(slideInterval.current);
    };
  }, [mounted, isHovering]);

  const checkSessionAndRedirect = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setRedirecting(true);
        const { data: isAdmin } = await supabase.rpc("has_role", { 
          _user_id: session.user.id, 
          _role: "admin" 
        });
        if (isAdmin) {
          nav({ to: "/admin/dashboard" });
        } else {
          nav({ to: "/dashboard" });
        }
      }
    } catch (err) {
      console.error("Session check error:", err);
    } finally {
      setRedirecting(false);
    }
  };

  const redirectBasedOnRole = async (userId: string) => {
    setRedirecting(true);
    try {
      const { data: isAdmin } = await supabase.rpc("has_role", { 
        _user_id: userId, 
        _role: "admin" 
      });
      if (isAdmin) {
        nav({ to: "/admin/dashboard" });
      } else {
        nav({ to: "/dashboard" });
      }
    } catch (err) {
      console.error("Role check error:", err);
      nav({ to: "/dashboard" });
    } finally {
      setRedirecting(false);
    }
  };

  const resendVerificationEmail = async () => {
    if (resendCooldown > 0) {
      toast.error(`Please wait ${resendCooldown} seconds`);
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: verificationEmail,
        options: {
          emailRedirectTo: `${window.location.origin}/auth`,
        },
      });
      if (error) throw error;
      toast.success("Verification email resent! Check your inbox.");
      setResendCooldown(60);
      const interval = setInterval(() => {
        setResendCooldown(prev => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (err: any) {
      toast.error(err.message || "Failed to resend verification email");
    } finally {
      setLoading(false);
    }
  };

  // DIRECT SIGNUP - Bypasses Supabase client
  const handleSignUp = useCallback(async () => {
    setError(null);
    setLoading(true);

    // Validate fields
    if (!fullName.trim()) {
      setError("Please enter your full name");
      setLoading(false);
      return;
    }
    if (!email || !email.includes("@") || !email.includes(".")) {
      setError("Please enter a valid email address");
      setLoading(false);
      return;
    }
    if (!password) {
      setError("Please enter a password");
      setLoading(false);
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      setLoading(false);
      return;
    }

    try {
      console.log("Direct signup attempt for:", email);
      
      // Use fetch directly to bypass Supabase client issues
      const response = await fetch(`${SUPABASE_URL}/auth/v1/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({
          email: email.trim(),
          password: password,
          data: { 
            full_name: fullName.trim(),
          },
          options: {
            emailRedirectTo: `${window.location.origin}/auth`,
          }
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error("Signup API error:", data);
        if (data.msg?.includes("User already registered")) {
          setError("User already exists. Please sign in instead.");
        } else if (data.msg?.includes("password")) {
          setError("Password too weak. Use at least 6 characters with letters and numbers.");
        } else {
          setError(data.msg || "Something went wrong. Please try again.");
        }
        setLoading(false);
        return;
      }

      if (data.id) {
        console.log("Signup successful:", data.id);
        setVerificationEmail(email);
        setSignupSuccess(true);
        setMode("verify");
        toast.success("Account created! Please check your email for verification.");
        setLoading(false);
      } else {
        setError("Something went wrong. Please try again.");
        setLoading(false);
      }
    } catch (err: any) {
      console.error("Signup error:", err);
      setError(err.message || "Network error. Please check your connection and try again.");
      setLoading(false);
    }
  }, [email, password, confirm, fullName, SUPABASE_URL, SUPABASE_ANON_KEY]);

  // DIRECT SIGNIN - Bypasses Supabase client
  const handleSignIn = useCallback(async () => {
    setError(null);
    setLoading(true);

    if (!email || !password) {
      setError("Please enter email and password");
      setLoading(false);
      return;
    }

    try {
      console.log("Direct signin attempt for:", email);

      // Use fetch directly to bypass Supabase client issues
      const response = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({
          email: email.trim(),
          password: password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error("Signin API error:", data);
        if (data.msg?.includes("Email not confirmed")) {
          setVerificationEmail(email);
          setMode("verify");
          setError("Please verify your email first. Check your inbox.");
          setLoading(false);
          return;
        }
        if (data.msg?.includes("Invalid login") || data.msg?.includes("Invalid credentials")) {
          setError("Invalid email or password");
          setLoading(false);
          return;
        }
        setError(data.msg || "Something went wrong. Please try again.");
        setLoading(false);
        return;
      }

      if (data.access_token) {
        // Set the session manually
        const { data: { user }, error } = await supabase.auth.setSession({
          access_token: data.access_token,
          refresh_token: data.refresh_token,
        });

        if (error) {
          console.error("Session set error:", error);
          setError("Failed to set session. Please try again.");
          setLoading(false);
          return;
        }

        toast.success("Welcome back!");
        await redirectBasedOnRole(user.id);
      } else {
        setError("Something went wrong. Please try again.");
        setLoading(false);
      }
    } catch (err: any) {
      console.error("Signin error:", err);
      setError(err.message || "Network error. Please check your connection and try again.");
      setLoading(false);
    }
  }, [email, password, SUPABASE_URL, SUPABASE_ANON_KEY]);

  // Forgot password
  const handleForgotPassword = useCallback(async () => {
    setError(null);
    setLoading(true);

    if (!email || !email.includes("@")) {
      setError("Please enter a valid email address");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${SUPABASE_URL}/auth/v1/recover`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({
          email: email.trim(),
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.msg || "Something went wrong. Please try again.");
        setLoading(false);
        return;
      }

      toast.success("Password reset link sent! Check your email.");
      setMode("signin");
      setLoading(false);
    } catch (err: any) {
      console.error("Forgot password error:", err);
      setError(err.message || "Network error. Please check your connection and try again.");
      setLoading(false);
    }
  }, [email, SUPABASE_URL, SUPABASE_ANON_KEY]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (mode === "signin") {
      await handleSignIn();
    } else if (mode === "signup") {
      await handleSignUp();
    } else if (mode === "forgot") {
      await handleForgotPassword();
    }
  };

  const switchMode = (newMode: Mode) => {
    setMode(newMode);
    setError(null);
    setLoading(false);
  };

  if (!mounted) {
    return (
      <div className="grid min-h-screen place-items-center bg-white dark:bg-gray-900">
        <Loader2 className="h-12 w-12 animate-spin text-blue-600 dark:text-blue-400" />
      </div>
    );
  }

  if (redirecting) {
    return (
      <div className="grid min-h-screen place-items-center bg-white dark:bg-gray-900">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 dark:text-blue-400 mx-auto" />
          <p className="mt-4 text-gray-600 dark:text-gray-300">Redirecting to dashboard...</p>
        </div>
      </div>
    );
  }

  if (mode === "verify") {
    return (
      <div className="grid min-h-screen place-items-center bg-white dark:bg-gray-900 p-4">
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 30 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          className="w-full max-w-md rounded-3xl bg-white dark:bg-gray-800 shadow-2xl border border-gray-200 dark:border-gray-700 p-8 text-center"
        >
          <div className="w-20 h-20 mx-auto bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center">
            <Mail className="h-10 w-10 text-emerald-600 dark:text-emerald-400" />
          </div>
          <h1 className="mt-6 text-3xl font-bold text-gray-900 dark:text-white">
            {signupSuccess ? "Account Created! 🎉" : "Verify Your Email"}
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            We sent a verification link to <strong className="text-gray-900 dark:text-white">{verificationEmail}</strong>
          </p>
          <div className="mt-6 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-4 text-left">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-yellow-800 dark:text-yellow-300">
                Click the link in the email to activate your account. Then you can sign in.
              </p>
            </div>
          </div>
          <div className="mt-6 space-y-3">
            <button
              onClick={() => window.open('https://mail.google.com', '_blank')}
              className="w-full rounded-xl bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 font-semibold transition-all"
            >
              Open Gmail
            </button>
            <button
              onClick={resendVerificationEmail}
              disabled={loading || resendCooldown > 0}
              className="w-full rounded-xl border border-gray-300 dark:border-gray-600 px-6 py-3 font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all disabled:opacity-50"
            >
              {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : loading ? "Sending..." : "Resend verification email"}
            </button>
            <button
              onClick={() => { setMode("signin"); setSignupSuccess(false); }}
              className="w-full text-sm text-blue-600 dark:text-blue-400 hover:underline"
            >
              ← Back to sign in
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  const titles = {
    signin: { h: "Welcome Back", sub: "Sign in to manage bookings, invoices, and more.", cta: "Sign In" },
    signup: { h: "Create Account", sub: "Join AIPATECH Energy and get started today.", cta: "Create Account" },
    forgot: { h: "Reset Password", sub: "We'll email you a secure link to reset your password.", cta: "Send Reset Link" },
    verify: { h: "Verify Email", sub: "", cta: "" },
  };
  const t = titles[mode];

  return (
    <div className="grid min-h-screen lg:grid-cols-2 overflow-hidden bg-white dark:bg-gray-900">
      {/* Left Side - Slideshow */}
      <div 
        className="relative hidden lg:block overflow-hidden bg-gray-900"
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ scale: 1.1, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 1.1, opacity: 0 }}
            transition={{ duration: 1.2, ease: "easeInOut" }}
            className="absolute inset-0"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-blue-900 via-blue-800 to-cyan-900" />
            <img
              src={SLIDES[currentSlide].image}
              alt={SLIDES[currentSlide].title}
              className="w-full h-full object-cover mix-blend-overlay"
              loading="lazy"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-br from-blue-900/70 via-blue-800/60 to-cyan-900/70" />
            
            <div className="absolute inset-0 overflow-hidden">
              <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.8 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ delay: 0.3, duration: 0.8 }}
                className="absolute top-[15%] left-[10%]"
              >
                <div className="w-14 h-14 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 flex items-center justify-center shadow-2xl">
                  <Building2 className="w-7 h-7 text-white/80" />
                </div>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.8 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ delay: 0.45, duration: 0.8 }}
                className="absolute bottom-[25%] right-[12%]"
              >
                <div className="w-14 h-14 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 flex items-center justify-center shadow-2xl">
                  <Users className="w-7 h-7 text-white/80" />
                </div>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.8 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ delay: 0.6, duration: 0.8 }}
                className="absolute top-[35%] right-[15%]"
              >
                <div className="w-14 h-14 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 flex items-center justify-center shadow-2xl">
                  <Award className="w-7 h-7 text-white/80" />
                </div>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.8 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ delay: 0.3, duration: 0.8 }}
                className="absolute bottom-[35%] left-[12%]"
              >
                <div className="w-14 h-14 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 flex items-center justify-center shadow-2xl">
                  <Clock className="w-7 h-7 text-white/80" />
                </div>
              </motion.div>
            </div>
          </motion.div>
        </AnimatePresence>

        <div className="absolute bottom-0 left-0 right-0 p-12 bg-gradient-to-t from-black/90 via-black/50 to-transparent">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 bg-white/20 backdrop-blur-sm rounded-xl">
              {(() => {
                const Icon = SLIDES[currentSlide].icon;
                return <Icon className="w-5 h-5 text-white" />;
              })()}
            </div>
            <span className="text-xs font-semibold uppercase tracking-widest text-white/80">
              {SLIDES[currentSlide].stats}
            </span>
          </div>
          <motion.h2
            key={currentSlide}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-4xl font-bold text-white leading-tight"
          >
            {SLIDES[currentSlide].title}
          </motion.h2>
          <motion.p
            key={currentSlide + "-sub"}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-2 text-blue-200 text-lg"
          >
            {SLIDES[currentSlide].subtitle}
          </motion.p>

          <div className="flex gap-2 mt-6">
            {SLIDES.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentSlide(idx)}
                className={`h-1.5 rounded-full transition-all duration-500 ${
                  idx === currentSlide ? 'w-12 bg-white' : 'w-6 bg-white/40 hover:bg-white/60'
                }`}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Right Side - Auth Form */}
      <div className="flex items-center justify-center p-6 lg:p-8 bg-white dark:bg-gray-900">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-md"
        >
          <Link to="/" className="inline-flex items-center gap-3 group mb-8">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-xl blur-xl opacity-60 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative w-12 h-12 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-xl flex items-center justify-center shadow-lg">
                <Flame className="w-6 h-6 text-white" />
              </div>
            </div>
            <div>
              <span className="block font-display text-xl font-bold text-gray-900 dark:text-white">AIPATECH</span>
              <span className="block text-[10px] font-semibold text-blue-600 dark:text-blue-400 tracking-wider">ENERGY LIMITED</span>
            </div>
          </Link>

          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{t.h}</h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">{t.sub}</p>
          </div>

          {mode !== "forgot" && mode !== "verify" && (
            <div className="mb-6 bg-gray-100 dark:bg-gray-800 rounded-xl p-1">
              <div className="grid grid-cols-2 gap-1">
                <button
                  type="button"
                  onClick={() => { switchMode("signin"); }}
                  className={`py-2.5 rounded-lg text-sm font-semibold transition-all ${
                    mode === "signin"
                      ? "bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-md dark:shadow-gray-900"
                      : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => { switchMode("signup"); }}
                  className={`py-2.5 rounded-lg text-sm font-semibold transition-all ${
                    mode === "signup"
                      ? "bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-md dark:shadow-gray-900"
                      : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                  }`}
                >
                  Sign Up
                </button>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "signup" && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Full Name *
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="John Doe"
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-all"
                    disabled={loading}
                  />
                </div>
              </motion.div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Email Address *
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  required
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-all"
                  disabled={loading}
                />
              </div>
            </div>

            {mode !== "forgot" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Password *
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    required
                    type={showPassword ? "text" : "password"}
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="•••••• (min 6 characters)"
                    className="w-full pl-10 pr-12 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-all"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    disabled={loading}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            )}

            {mode === "signup" && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.1 }}
              >
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Confirm Password *
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    required
                    type={showConfirmPassword ? "text" : "password"}
                    minLength={6}
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    placeholder="••••••"
                    className="w-full pl-10 pr-12 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-all"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    disabled={loading}
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </motion.div>
            )}

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-4 py-3 text-sm text-red-600 dark:text-red-400 flex items-start gap-2"
              >
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </motion.div>
            )}

            <motion.button
              whileHover={!loading ? { scale: 1.02 } : {}}
              whileTap={!loading ? { scale: 0.98 } : {}}
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all disabled:opacity-60 disabled:hover:scale-100 relative overflow-hidden group"
            >
              <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
              <span className="relative flex items-center justify-center gap-2">
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    {mode === "signin" ? "Signing in..." : mode === "signup" ? "Creating account..." : "Sending..."}
                  </>
                ) : (
                  <>
                    {t.cta}
                    <ChevronRight className="w-4 h-4" />
                  </>
                )}
              </span>
            </motion.button>

            <div className="flex items-center justify-between text-sm">
              {mode === "signin" ? (
                <button
                  type="button"
                  onClick={() => { switchMode("forgot"); }}
                  className="text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Forgot password?
                </button>
              ) : mode === "signup" ? (
                <span className="text-gray-500 dark:text-gray-400 text-xs">
                  By signing up, you agree to our Terms & Privacy Policy
                </span>
              ) : mode === "forgot" ? (
                <button
                  type="button"
                  onClick={() => { switchMode("signin"); }}
                  className="text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1"
                >
                  <ArrowLeft className="w-3 h-3" /> Back to sign in
                </button>
              ) : null}

              {mode !== "forgot" && (
                <Link to="/" className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300">
                  ← Website
                </Link>
              )}
            </div>
          </form>

          <div className="mt-8 flex items-center justify-center gap-4 text-xs text-gray-500 dark:text-gray-400">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
              Secure
            </span>
            <span className="w-px h-3 bg-gray-300 dark:bg-gray-700" />
            <span className="flex items-center gap-1">
              <Fingerprint className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400" />
              Protected
            </span>
            <span className="w-px h-3 bg-gray-300 dark:bg-gray-700" />
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400" />
              24/7 Support
            </span>
          </div>
        </motion.div>
      </div>
    </div>
  );
}