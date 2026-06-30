import { createFileRoute, Link, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuthRole } from "@/hooks/use-auth-role";
import { 
  LayoutDashboard, Package, Wrench, FileText, Users, 
  Image as ImageIcon, Settings, LogOut, Menu, X, ChevronDown,
  Bell, Home, Flame, ShieldCheck
} from "lucide-react";

export const Route = createFileRoute("/admin")({
  component: AdminLayout,
});

function AdminLayout() {
  const nav = useNavigate();
  const { role, loading, email, isAdmin } = useAuthRole();

  useEffect(() => {
    // If not loading and not admin, redirect to user dashboard or auth
    if (!loading) {
      if (!isAdmin) {
        // Check if user is logged in but not admin
        const checkAndRedirect = async () => {
          const { data: { session } } = await supabase.auth.getSession();
          if (session) {
            // User is logged in but not admin, send to user dashboard
            nav({ to: "/dashboard" });
          } else {
            // Not logged in, send to auth
            nav({ to: "/auth" });
          }
        };
        checkAndRedirect();
      }
    }
  }, [isAdmin, loading, nav]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    nav({ to: "/" });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Verifying access...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return null; // Will redirect via useEffect
  }

  const navItems = [
    { path: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { path: "/admin/bookings", label: "Bookings", icon: Package },
    { path: "/admin/manage-rentals", label: "Rentals", icon: Wrench },
    { path: "/admin/invoices", label: "Invoices", icon: FileText },
    { path: "/admin/customers", label: "Customers", icon: Users },
    { path: "/admin/site-content", label: "Site Content", icon: ImageIcon },
    { path: "/admin/settings", label: "Settings", icon: Settings },
  ];

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
      {/* Sidebar */}
      <aside className="w-64 bg-white dark:bg-gray-800 shadow-lg flex flex-col">
        {/* Logo */}
        <div className="p-4 border-b dark:border-gray-700">
          <Link to="/admin/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-lg flex items-center justify-center">
              <Flame className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg">AEL Admin</span>
            <ShieldCheck className="w-4 h-4 text-emerald-500 ml-auto" />
          </Link>
        </div>

        {/* User Info */}
        <div className="p-4 border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
          <p className="text-sm font-medium truncate">{email || 'Admin User'}</p>
          <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">Administrator</p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              activeProps={{
                className: "bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-600 dark:text-white"
              }}
            >
              <item.icon className="w-5 h-5" />
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        {/* Sign Out */}
        <div className="p-4 border-t dark:border-gray-700">
          <button
            onClick={handleSignOut}
            className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}