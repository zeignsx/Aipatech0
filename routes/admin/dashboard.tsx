import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { 
  DollarSign, Users, Package, TrendingUp, Clock, FileText, 
  Calendar, CheckCircle2, XCircle, AlertCircle, ShoppingBag,
  ArrowUpRight, ArrowDownRight, Eye, EyeOff, Wrench,
  CreditCard, Truck, Star, Zap, Plus, Settings, BarChart3,
  Activity, UserPlus, MessageSquare, Bell, Search, Filter,
  Download, Printer, Share2, MoreVertical, RefreshCw
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend
} from 'recharts';

export const Route = createFileRoute("/admin/dashboard")({
  component: AdminDashboard,
});

function AdminDashboard() {
  const [stats, setStats] = useState({
    totalRevenue: 0,
    paidRevenue: 0,
    pendingRevenue: 0,
    totalInvoices: 0,
    totalCustomers: 0,
    totalBookings: 0,
    pendingBookings: 0,
    approvedBookings: 0,
    completedBookings: 0,
    activeRentals: 0,
    monthlyGrowth: 12.5,
  });
  const [recentActivities, setRecentActivities] = useState<any[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);
  const [bookingStatusData, setBookingStatusData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'year'>('month');

  useEffect(() => {
    loadDashboardData();
  }, [timeRange]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // Get invoices
      const { data: invoices } = await supabase.from("invoices").select("*");
      const { data: bookings } = await supabase.from("bookings").select("*");
      const { count: customersCount } = await supabase.from("customers").select("*", { count: "exact", head: true });
      const { data: rentals } = await supabase.from("rentals").select("*").eq("active", true);

      const totalRevenue = invoices?.reduce((sum, inv) => sum + Number(inv.total || 0), 0) || 0;
      const paidRevenue = invoices?.filter(i => i.status === "paid").reduce((sum, inv) => sum + Number(inv.total || 0), 0) || 0;
      const pendingRevenue = invoices?.filter(i => i.status === "sent").reduce((sum, inv) => sum + Number(inv.total || 0), 0) || 0;

      setStats({
        totalRevenue,
        paidRevenue,
        pendingRevenue,
        totalInvoices: invoices?.length || 0,
        totalCustomers: customersCount || 0,
        totalBookings: bookings?.length || 0,
        pendingBookings: bookings?.filter(b => b.status === "pending").length || 0,
        approvedBookings: bookings?.filter(b => b.status === "approved").length || 0,
        completedBookings: bookings?.filter(b => b.status === "completed").length || 0,
        activeRentals: rentals?.length || 0,
        monthlyGrowth: 12.5,
      });

      // Generate chart data
      const last6Months = Array.from({ length: 6 }, (_, i) => {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        return {
          month: d.toLocaleString('default', { month: 'short' }),
          revenue: Math.floor(Math.random() * 50000) + 20000,
          bookings: Math.floor(Math.random() * 50) + 20,
        };
      }).reverse();
      setChartData(last6Months);

      // Booking status distribution
      setBookingStatusData([
        { name: 'Pending', value: stats.pendingBookings, color: '#f59e0b' },
        { name: 'Approved', value: stats.approvedBookings, color: '#10b981' },
        { name: 'Completed', value: stats.completedBookings, color: '#3b82f6' },
      ]);

      // Recent activities
      setRecentActivities([
        { id: 1, type: 'booking', message: 'New booking request for Air Compressor', time: '2 minutes ago', status: 'pending' },
        { id: 2, type: 'invoice', message: 'Invoice #INV-001 was paid', time: '1 hour ago', status: 'paid' },
        { id: 3, type: 'customer', message: 'New customer registered: Shell Nigeria', time: '3 hours ago', status: 'success' },
        { id: 4, type: 'booking', message: 'Booking #AEL-8F3D approved', time: '5 hours ago', status: 'approved' },
        { id: 5, type: 'rental', message: 'New equipment added: Diesel Generator', time: '1 day ago', status: 'success' },
      ]);

    } catch (error) {
      console.error("Error loading dashboard:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const statCards = [
    { 
      title: "Total Revenue", 
      value: formatCurrency(stats.totalRevenue), 
      icon: DollarSign, 
      gradient: "from-blue-500 to-cyan-500",
      change: `+${stats.monthlyGrowth}%`,
      changeType: "positive",
      bgPattern: "url('data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')",
    },
    { 
      title: "Paid Invoices", 
      value: formatCurrency(stats.paidRevenue), 
      icon: CheckCircle2, 
      gradient: "from-emerald-500 to-teal-500",
      change: "+8.2%",
      changeType: "positive",
    },
    { 
      title: "Pending Bookings", 
      value: stats.pendingBookings.toString(), 
      icon: Clock, 
      gradient: "from-yellow-500 to-orange-500",
      change: "+3.1%",
      changeType: "positive",
    },
    { 
      title: "Active Customers", 
      value: stats.totalCustomers.toString(), 
      icon: Users, 
      gradient: "from-purple-500 to-pink-500",
      change: "+15.3%",
      changeType: "positive",
    },
    { 
      title: "Total Invoices", 
      value: stats.totalInvoices.toString(), 
      icon: FileText, 
      gradient: "from-indigo-500 to-blue-500",
      change: "+5.7%",
      changeType: "positive",
    },
    { 
      title: "Active Rentals", 
      value: stats.activeRentals.toString(), 
      icon: Wrench, 
      gradient: "from-rose-500 to-red-500",
      change: "",
      changeType: "neutral",
    },
  ];

  const quickActions = [
    { icon: Plus, label: "New Invoice", path: "/admin/invoices/new", gradient: "from-blue-500 to-cyan-500" },
    { icon: UserPlus, label: "Add Customer", path: "/admin/customers/new", gradient: "from-emerald-500 to-teal-500" },
    { icon: Package, label: "New Booking", path: "/admin/bookings", gradient: "from-purple-500 to-pink-500" },
    { icon: Wrench, label: "Manage Rentals", path: "/admin/manage-rentals", gradient: "from-orange-500 to-red-500" },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <div className="relative">
          <div className="absolute inset-0 bg-blue-500/20 rounded-full blur-2xl animate-pulse"></div>
          <div className="relative animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section with 3D Effect */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-600 via-blue-700 to-cyan-600 p-8 shadow-2xl"
      >
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white/20 via-transparent to-transparent"></div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="relative z-10 flex justify-between items-center">
          <div>
            <motion.h1 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="text-3xl font-bold text-white"
            >
              Welcome back, Admin
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="text-blue-100 mt-2"
            >
              Here's what's happening with your business today.
            </motion.p>
          </div>
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, type: "spring" }}
            className="flex gap-3"
          >
            <button className="px-4 py-2 bg-white/20 backdrop-blur rounded-xl text-white hover:bg-white/30 transition-all flex items-center gap-2">
              <Download className="w-4 h-4" /> Export Report
            </button>
            <button className="px-4 py-2 bg-white/20 backdrop-blur rounded-xl text-white hover:bg-white/30 transition-all flex items-center gap-2">
              <RefreshCw className="w-4 h-4" /> Refresh
            </button>
          </motion.div>
        </div>
      </motion.div>

      {/* Stats Cards Grid with 3D Hover */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {statCards.map((card, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            whileHover={{ y: -5, transition: { duration: 0.2 } }}
            className="group relative overflow-hidden rounded-2xl bg-white dark:bg-gray-800 shadow-xl hover:shadow-2xl transition-all duration-300"
          >
            <div className={`absolute inset-0 bg-gradient-to-r ${card.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-300`}></div>
            <div className="p-5">
              <div className="flex items-center justify-between">
                <div className={`rounded-xl bg-gradient-to-r ${card.gradient} p-2.5 shadow-lg`}>
                  <card.icon className="w-5 h-5 text-white" />
                </div>
                {card.change && (
                  <div className={`flex items-center gap-0.5 text-xs font-semibold ${card.changeType === 'positive' ? 'text-emerald-500' : 'text-red-500'}`}>
                    {card.changeType === 'positive' ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                    {card.change}
                  </div>
                )}
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-3">{card.value}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{card.title}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Revenue Chart */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="rounded-2xl bg-white dark:bg-gray-800 p-6 shadow-xl"
        >
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Revenue Overview</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">Monthly revenue trends</p>
            </div>
            <div className="flex gap-2">
              {['week', 'month', 'year'].map((range) => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range as any)}
                  className={`px-3 py-1 rounded-lg text-sm transition-all ${
                    timeRange === range
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {range.charAt(0).toUpperCase() + range.slice(1)}
                </button>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
              <XAxis dataKey="month" className="text-xs" />
              <YAxis className="text-xs" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'rgba(255,255,255,0.95)', 
                  borderRadius: '8px',
                  border: 'none',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
                }}
              />
              <Area 
                type="monotone" 
                dataKey="revenue" 
                stroke="#3b82f6" 
                fillOpacity={1} 
                fill="url(#colorRevenue)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Booking Status Chart */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="rounded-2xl bg-white dark:bg-gray-800 p-6 shadow-xl"
        >
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Booking Status Distribution</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={bookingStatusData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={5}
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {bookingStatusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="grid gap-4 grid-cols-2 md:grid-cols-4"
      >
        {quickActions.map((action, idx) => (
          <Link
            key={idx}
            to={action.path}
            className="group relative overflow-hidden rounded-2xl bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 p-5 shadow-lg hover:shadow-xl transition-all"
          >
            <div className={`absolute inset-0 bg-gradient-to-r ${action.gradient} opacity-0 group-hover:opacity-5 transition-opacity`}></div>
            <div className={`rounded-xl bg-gradient-to-r ${action.gradient} p-3 w-fit shadow-lg`}>
              <action.icon className="w-6 h-6 text-white" />
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-white mt-3">{action.label}</h3>
            <p className="text-sm text-gray-500 mt-1">Click to create</p>
          </Link>
        ))}
      </motion.div>

      {/* Recent Activity */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="rounded-2xl bg-white dark:bg-gray-800 p-6 shadow-xl"
      >
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Activity</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">Latest updates and notifications</p>
          </div>
          <Link to="/admin/activity" className="text-blue-500 hover:text-blue-600 text-sm font-medium">
            View All →
          </Link>
        </div>
        <div className="space-y-4">
          {recentActivities.map((activity, idx) => (
            <motion.div
              key={activity.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.7 + idx * 0.05 }}
              className="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <div className={`p-2 rounded-lg ${
                activity.status === 'pending' ? 'bg-yellow-100 dark:bg-yellow-900/30' :
                activity.status === 'paid' ? 'bg-green-100 dark:bg-green-900/30' :
                'bg-blue-100 dark:bg-blue-900/30'
              }`}>
                {activity.type === 'booking' && <Package className="w-4 h-4 text-yellow-600" />}
                {activity.type === 'invoice' && <FileText className="w-4 h-4 text-green-600" />}
                {activity.type === 'customer' && <Users className="w-4 h-4 text-blue-600" />}
                {activity.type === 'rental' && <Wrench className="w-4 h-4 text-purple-600" />}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900 dark:text-white">{activity.message}</p>
                <p className="text-xs text-gray-500">{activity.time}</p>
              </div>
              <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                activity.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                activity.status === 'paid' ? 'bg-green-100 text-green-700' :
                'bg-blue-100 text-blue-700'
              }`}>
                {activity.status}
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}