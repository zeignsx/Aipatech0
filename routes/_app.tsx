import { createFileRoute, Link, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuthRole } from "@/hooks/use-auth-role";
import { Flame, LayoutDashboard, LogOut, Plus, Inbox, BookOpen, Settings, User } from "lucide-react";

export const Route = createFileRoute("/_app")({
  component: UserLayout,
});

function UserLayout() {
  const nav = useNavigate();
  const { role, loading, email, isAdmin } = useAuthRole();

  useEffect(() => {
    if (!loading) {
      if (isAdmin) {
        // Admin should be in admin panel, not user panel
        nav({ to: "/admin/dashboard" });
      } else if (!role) {
        // Not logged in
        nav({ to: "/auth" });
      }
    }
  }, [isAdmin, role, loading, nav]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    nav({ to: "/" });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // If admin, don't render user layout (will redirect)
  if (isAdmin) {
    return null;
  }

  const navItems = [
    { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { path: "/portal", label: "My Bookings", icon: Inbox },
    { path: "/rentals", label: "Browse Equipment", icon: BookOpen },
    { path: "/settings", label: "Settings", icon: Settings },
  ];

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
      {/* Sidebar */}
      <aside className="w-64 bg-white dark:bg-gray-800 shadow-lg flex flex-col">
        <div className="p-4 border-b dark:border-gray-700">
          <Link to="/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-lg flex items-center justify-center">
              <Flame className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg">My Portal</span>
          </Link>
        </div>

        <div className="p-4 border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-gray-500" />
            <p className="text-sm font-medium truncate">{email || 'User'}</p>
          </div>
          <p className="text-xs text-gray-500 mt-1">Customer Account</p>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              activeProps={{
                className: "bg-emerald-600 text-white hover:bg-emerald-700"
              }}
            >
              <item.icon className="w-5 h-5" />
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t dark:border-gray-700">
          <Link
            to="/rentals"
            className="flex items-center justify-center gap-2 w-full px-4 py-2 bg-gradient-to-r from-gold-500 to-orange-500 text-white rounded-lg hover:opacity-90 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>New Booking</span>
          </Link>
          
          <button
            onClick={handleSignOut}
            className="flex items-center gap-3 w-full mt-3 px-3 py-2 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">
        <div className="p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}