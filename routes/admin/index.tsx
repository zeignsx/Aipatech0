import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { 
  DollarSign, Users, Inbox, TrendingUp, Clock, FileText, 
  Package, CheckCircle2, AlertCircle, Plus, Eye, Wrench,
  ArrowUpRight, ArrowDownRight
} from "lucide-react";

export const Route = createFileRoute("/admin/")({
  component: AdminDashboard,
});

function AdminDashboard() {
  const [stats, setStats] = useState({
    totalRevenue: 0,
    paidInvoices: 0,
    pendingBookings: 0,
    totalCustomers: 0,
    totalInvoices: 0,
    activeRentals: 0,
  });
  const [recentBookings, setRecentBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const { data: invoices } = await supabase.from("invoices").select("*");
      const { data: bookings } = await supabase.from("bookings").select("*").order("created_at", { ascending: false }).limit(5);
      const { count: customersCount } = await supabase.from("customers").select("*", { count: "exact", head: true });
      const { data: rentals } = await supabase.from("rentals").select("*").eq("active", true);

      const totalRevenue = invoices?.reduce((sum, inv) => sum + Number(inv.total || 0), 0) || 0;
      const paidInvoices = invoices?.filter(i => i.status === "paid").length || 0;
      const pendingBookings = bookings?.filter(b => b.status === "pending").length || 0;

      setStats({
        totalRevenue,
        paidInvoices,
        pendingBookings,
        totalCustomers: customersCount || 0,
        totalInvoices: invoices?.length || 0,
        activeRentals: rentals?.length || 0,
      });
      setRecentBookings(bookings || []);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const statCards = [
    { title: "Total Revenue", value: formatCurrency(stats.totalRevenue), icon: DollarSign, color: "bg-green-500" },
    { title: "Paid Invoices", value: stats.paidInvoices, icon: CheckCircle2, color: "bg-emerald-500" },
    { title: "Pending Bookings", value: stats.pendingBookings, icon: Clock, color: "bg-yellow-500" },
    { title: "Customers", value: stats.totalCustomers, icon: Users, color: "bg-blue-500" },
    { title: "Total Invoices", value: stats.totalInvoices, icon: FileText, color: "bg-purple-500" },
    { title: "Active Rentals", value: stats.activeRentals, icon: Wrench, color: "bg-indigo-500" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-gray-500">Welcome back to your admin panel</p>
        </div>
        <Link to="/admin/invoices/new" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2">
          <Plus className="w-4 h-4" /> New Invoice
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {statCards.map((card, idx) => (
          <div key={idx} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-5 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div className={`${card.color} p-2 rounded-lg`}>
                <card.icon className="w-5 h-5 text-white" />
              </div>
            </div>
            <p className="text-2xl font-bold mt-3">{card.value}</p>
            <p className="text-sm text-gray-500">{card.title}</p>
          </div>
        ))}
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="p-5 border-b border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-center">
            <h2 className="font-semibold text-lg">Recent Bookings</h2>
            <Link to="/admin/bookings" className="text-blue-600 hover:text-blue-700 text-sm">View All →</Link>
          </div>
        </div>
        <div className="p-5">
          {recentBookings.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No bookings yet</p>
          ) : (
            <div className="space-y-3">
              {recentBookings.map((booking) => (
                <div key={booking.id} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <div>
                    <p className="font-medium">{booking.equipment}</p>
                    <p className="text-sm text-gray-500">{booking.full_name} • {booking.email}</p>
                  </div>
                  <div className="text-right">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      booking.status === 'approved' ? 'bg-green-100 text-green-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {booking.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Link to="/admin/bookings" className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 text-center border border-gray-200 dark:border-gray-700 hover:shadow-md transition">
          <Package className="w-6 h-6 mx-auto mb-2 text-blue-600" />
          <p className="font-medium">Review Bookings</p>
        </Link>
        <Link to="/admin/manage-rentals" className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 text-center border border-gray-200 dark:border-gray-700 hover:shadow-md transition">
          <Wrench className="w-6 h-6 mx-auto mb-2 text-green-600" />
          <p className="font-medium">Manage Rentals</p>
        </Link>
        <Link to="/admin/invoices" className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 text-center border border-gray-200 dark:border-gray-700 hover:shadow-md transition">
          <FileText className="w-6 h-6 mx-auto mb-2 text-purple-600" />
          <p className="font-medium">View Invoices</p>
        </Link>
        <Link to="/admin/customers" className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 text-center border border-gray-200 dark:border-gray-700 hover:shadow-md transition">
          <Users className="w-6 h-6 mx-auto mb-2 text-orange-600" />
          <p className="font-medium">Manage Customers</p>
        </Link>
      </div>
    </div>
  );
}