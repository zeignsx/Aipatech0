import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { 
  Plus, Pencil, Trash2, Upload, Save, X, ShieldAlert, 
  Eye, EyeOff, Wrench, Search, Package, AlertCircle, CheckCircle,
  ArrowUp, ArrowDown, Image as ImageIcon,
  Users, Calendar, Clock, MessageSquare, Check, XCircle,
  Mail, Phone, Loader2, User, Building2, CheckCheck, RefreshCcw,
  DollarSign, Filter, RefreshCw, Sparkles, LayoutGrid, List,
  ChevronLeft, ChevronRight, MoreVertical, Copy, Link as LinkIcon
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/manage-rentals")({
  component: ManageRentals,
});

interface Rental {
  id: string;
  name: string;
  category: string;
  description: string | null;
  image_url: string | null;
  day_rate: number;
  active: boolean;
  position: number;
  created_at: string;
  updated_at: string;
}

interface BookingRequest {
  id: string;
  full_name: string;
  company: string | null;
  email: string;
  phone: string | null;
  equipment: string;
  start_date: string | null;
  end_date: string | null;
  status: string;
  message: string | null;
  created_at: string;
  customer_user_id: string | null;
  channel: string;
  invoice_id: string | null;
}

const emptyRental = {
  name: "",
  category: "General",
  description: "",
  image_url: "",
  day_rate: 0,
  active: true,
  position: 0,
};

function ManageRentals() {
  const navigate = useNavigate();
  const [rentals, setRentals] = useState<Rental[]>([]);
  const [filteredRentals, setFilteredRentals] = useState<Rental[]>([]);
  const [bookingRequests, setBookingRequests] = useState<BookingRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingRental, setEditingRental] = useState<Rental | null>(null);
  const [formData, setFormData] = useState(emptyRental);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [requestFilter, setRequestFilter] = useState("all");
  const [uploading, setUploading] = useState(false);
  const [activeTab, setActiveTab] = useState<'equipment' | 'requests'>('equipment');
  const [categories, setCategories] = useState<string[]>([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingRental, setDeletingRental] = useState<Rental | null>(null);
  const [processingBooking, setProcessingBooking] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    checkAdminAndLoad();
  }, []);

  useEffect(() => {
    filterRentals();
  }, [searchTerm, categoryFilter, statusFilter, rentals]);

  useEffect(() => {
    if (activeTab === 'requests') {
      loadBookingRequests();
    }
  }, [activeTab, requestFilter]);

  const checkAdminAndLoad = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate({ to: "/auth" });
        return;
      }

      const { data: isAdminUser } = await supabase.rpc("has_role", {
        _user_id: session.user.id,
        _role: "admin"
      });

      if (!isAdminUser) {
        navigate({ to: "/dashboard" });
        return;
      }

      setIsAdmin(true);
      await loadRentals();
      await loadBookingRequests();
    } catch (error) {
      console.error("Error checking admin:", error);
      toast.error("Failed to load data");
    }
  };

  const loadRentals = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("rentals")
        .select("*")
        .order("position", { ascending: true })
        .order("created_at", { ascending: false });

      if (error) throw error;
      
      setRentals(data || []);
      const uniqueCategories = [...new Set((data || []).map(r => r.category))];
      setCategories(uniqueCategories);
    } catch (error: any) {
      console.error("Error loading rentals:", error);
      toast.error(error.message || "Failed to load rentals");
    } finally {
      setLoading(false);
    }
  };

  const loadBookingRequests = async () => {
    try {
      let query = supabase
        .from("bookings")
        .select("*")
        .order("created_at", { ascending: false });

      if (requestFilter !== "all") {
        query = query.eq("status", requestFilter);
      }

      const { data, error } = await query;

      if (error) throw error;
      setBookingRequests(data || []);
    } catch (error: any) {
      console.error("Error loading bookings:", error);
      toast.error(error.message || "Failed to load bookings");
    }
  };

  const filterRentals = () => {
    let filtered = [...rentals];

    if (searchTerm) {
      filtered = filtered.filter(r => 
        r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.category.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (categoryFilter !== "all") {
      filtered = filtered.filter(r => r.category === categoryFilter);
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter(r => 
        statusFilter === "active" ? r.active : !r.active
      );
    }

    setFilteredRentals(filtered);
  };

  const openCreateModal = () => {
    setEditingRental(null);
    setFormData({
      ...emptyRental,
      position: rentals.length + 1
    });
    setShowModal(true);
  };

  const openEditModal = (rental: Rental) => {
    setEditingRental(rental);
    setFormData({
      name: rental.name,
      category: rental.category,
      description: rental.description || "",
      image_url: rental.image_url || "",
      day_rate: rental.day_rate,
      active: rental.active,
      position: rental.position,
    });
    setShowModal(true);
  };

  const handleImageUpload = async (file: File) => {
    if (!file) return;
    
    setUploading(true);
    try {
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
      if (!allowedTypes.includes(file.type)) {
        toast.error('Only JPEG, PNG, WEBP, and GIF images are allowed');
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size must be less than 5MB');
        return;
      }

      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `rentals/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('site-images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('site-images')
        .getPublicUrl(filePath);

      setFormData({ ...formData, image_url: publicUrl });
      toast.success('Image uploaded successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const saveRental = async () => {
    if (!formData.name.trim()) {
      toast.error("Rental name is required");
      return;
    }

    if (formData.day_rate < 0) {
      toast.error("Day rate cannot be negative");
      return;
    }

    setLoading(true);
    try {
      if (editingRental) {
        const { error } = await supabase
          .from("rentals")
          .update({
            name: formData.name,
            category: formData.category,
            description: formData.description || null,
            image_url: formData.image_url || null,
            day_rate: formData.day_rate,
            active: formData.active,
            position: formData.position,
          })
          .eq("id", editingRental.id);

        if (error) throw error;
        toast.success("Rental updated successfully");
      } else {
        const { error } = await supabase
          .from("rentals")
          .insert({
            name: formData.name,
            category: formData.category,
            description: formData.description || null,
            image_url: formData.image_url || null,
            day_rate: formData.day_rate,
            active: formData.active,
            position: formData.position,
          });

        if (error) throw error;
        toast.success("Rental added successfully");
      }

      setShowModal(false);
      await loadRentals();
    } catch (error: any) {
      toast.error(error.message || "Failed to save rental");
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // ✅ FINAL FIXED: handleBookingAction - 100% Working
  // ============================================================
  const handleBookingAction = async (bookingId: string, action: 'approve' | 'reject' | 'complete') => {
    setProcessingBooking(bookingId);
    
    try {
      let newStatus = '';
      let successMessage = '';
      let notificationType = '';
      let notificationTitle = '';
      let notificationBody = '';
      
      switch (action) {
        case 'approve':
          newStatus = 'approved';
          successMessage = '✅ Booking approved successfully!';
          notificationType = 'booking_approved';
          notificationTitle = 'Booking Approved 🎉';
          notificationBody = 'Your rental request has been approved! Our team will contact you shortly.';
          break;
        case 'reject':
          newStatus = 'rejected';
          successMessage = '❌ Booking rejected.';
          notificationType = 'booking_rejected';
          notificationTitle = 'Booking Update';
          notificationBody = 'Your rental request could not be fulfilled at this time. Please contact us for more information.';
          break;
        case 'complete':
          newStatus = 'completed';
          successMessage = '✅ Booking marked as completed!';
          notificationType = 'booking_completed';
          notificationTitle = 'Booking Completed ✓';
          notificationBody = 'Your rental has been marked as completed. Thank you for your business!';
          break;
      }

      console.log(`[Action] ${action} booking ${bookingId} -> status: ${newStatus}`);

      const { data: { user } } = await supabase.auth.getUser();
      
      // ✅ UPDATE without select - avoids 404
      const { error } = await supabase
        .from("bookings")
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString(),
          ...(action === 'approve' ? { 
            approved_by: user?.id || null,
            approved_at: new Date().toISOString()
          } : {})
        })
        .eq("id", bookingId);

      if (error) {
        console.error("Supabase error:", error);
        if (error.code === 'PGRST116' || error.message?.includes('404') || error.message?.includes('not found')) {
          toast.error("Booking not found. Refreshing list...");
          await loadBookingRequests();
          setProcessingBooking(null);
          return;
        }
        throw error;
      }

      console.log(`✅ Booking ${bookingId} updated to ${newStatus}`);
      
      // ✅ Get updated booking for notification
      const { data: updatedBooking, error: fetchError } = await supabase
        .from("bookings")
        .select("*")
        .eq("id", bookingId)
        .single();

      if (fetchError) {
        console.error("Could not fetch updated booking:", fetchError);
        toast.success(successMessage);
        await loadBookingRequests();
        await loadRentals();
        setProcessingBooking(null);
        return;
      }

      // ✅ CREATE NOTIFICATION - DIRECT INSERT (NO FUNCTION)
      if (updatedBooking?.customer_user_id && action !== 'complete') {
        try {
          console.log('Creating notification for user:', updatedBooking.customer_user_id);
          
          const { error: notifError } = await supabase
            .from('notifications')
            .insert({
              user_id: updatedBooking.customer_user_id,
              type: notificationType,
              title: notificationTitle,
              body: `${notificationBody} Equipment: ${updatedBooking.equipment}`,
              link: '/portal',
              metadata: { 
                booking_id: bookingId,
                equipment: updatedBooking.equipment,
                status: newStatus,
                approved_by: user?.id || null
              }
            });
          
          if (notifError) {
            console.error('Failed to create notification:', notifError);
          } else {
            console.log('✅ Notification created successfully!');
          }
        } catch (notifError) {
          console.error('Failed to create notification:', notifError);
        }
      }

      toast.success(successMessage);
      await loadBookingRequests();
      await loadRentals();
      
    } catch (error: any) {
      console.error("Error updating booking:", error);
      toast.error(error.message || "Failed to update booking. Please try again.");
    } finally {
      setProcessingBooking(null);
    }
  };

  const deleteRental = async (rental: Rental) => {
    setDeletingRental(rental);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!deletingRental) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from("rentals")
        .delete()
        .eq("id", deletingRental.id);

      if (error) throw error;
      
      toast.success("Rental deleted successfully");
      await loadRentals();
    } catch (error: any) {
      toast.error(error.message || "Failed to delete rental");
    } finally {
      setLoading(false);
      setShowDeleteModal(false);
      setDeletingRental(null);
    }
  };

  const toggleActive = async (rental: Rental) => {
    try {
      const { error } = await supabase
        .from("rentals")
        .update({ active: !rental.active })
        .eq("id", rental.id);

      if (error) throw error;
      
      toast.success(rental.active ? "Rental hidden" : "Rental visible");
      await loadRentals();
    } catch (error: any) {
      toast.error(error.message || "Failed to update status");
    }
  };

  const moveRental = async (rental: Rental, direction: 'up' | 'down') => {
    try {
      const currentIndex = rentals.findIndex(r => r.id === rental.id);
      const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
      
      if (newIndex < 0 || newIndex >= rentals.length) return;

      const newPosition = rentals[newIndex].position;
      
      await supabase
        .from("rentals")
        .update({ position: rental.position })
        .eq("id", rentals[newIndex].id);
      
      await supabase
        .from("rentals")
        .update({ position: newPosition })
        .eq("id", rental.id);

      await loadRentals();
    } catch (error: any) {
      toast.error("Failed to reorder rentals");
    }
  };

  const viewDetails = (rental: Rental) => {
    toast.info(`${rental.name} - $${rental.day_rate}/day`, {
      description: rental.description || "No description available",
      duration: 5000,
    });
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-200",
      approved: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-green-200",
      rejected: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border-red-200",
      completed: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200",
      cancelled: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400 border-gray-200",
    };
    return styles[status] || styles.pending;
  };

  const getStatusIcon = (status: string) => {
    const icons: Record<string, any> = {
      pending: Clock,
      approved: CheckCircle,
      rejected: XCircle,
      completed: Check,
      cancelled: X,
    };
    return icons[status] || Clock;
  };

  const requestStats = {
    total: bookingRequests.length,
    pending: bookingRequests.filter(r => r.status === 'pending').length,
    approved: bookingRequests.filter(r => r.status === 'approved').length,
    completed: bookingRequests.filter(r => r.status === 'completed').length,
    rejected: bookingRequests.filter(r => r.status === 'rejected').length,
  };

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <ShieldAlert className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Access Denied</h2>
          <p className="text-gray-600 dark:text-gray-400 mt-2">Admin privileges required</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Gradient */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-600 via-blue-700 to-cyan-600 p-8 shadow-2xl">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white/20 via-transparent to-transparent"></div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-400/20 rounded-full blur-2xl"></div>
        <div className="relative z-10">
          <div className="flex flex-wrap justify-between items-start gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur text-white text-xs font-semibold mb-3">
                <Sparkles className="w-3 h-3" />
                Admin Panel
              </div>
              <h1 className="text-3xl font-bold text-white">Rental Management</h1>
              <p className="text-blue-100 mt-2">Manage your equipment fleet and rental requests</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => { loadRentals(); loadBookingRequests(); }}
                className="px-4 py-2.5 rounded-xl bg-white/20 backdrop-blur text-white font-semibold hover:bg-white/30 transition-all flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </button>
              <button
                onClick={openCreateModal}
                className="px-5 py-2.5 rounded-xl bg-white text-blue-700 font-semibold hover:bg-blue-50 transition-all flex items-center gap-2 shadow-lg"
              >
                <Plus className="w-5 h-5" />
                Add Equipment
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <div className="bg-white/10 backdrop-blur rounded-2xl p-4 border border-white/10">
              <p className="text-blue-100 text-sm">Total Equipment</p>
              <p className="text-2xl font-bold text-white">{rentals.length}</p>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-2xl p-4 border border-white/10">
              <p className="text-blue-100 text-sm">Active</p>
              <p className="text-2xl font-bold text-green-300">{rentals.filter(r => r.active).length}</p>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-2xl p-4 border border-white/10">
              <p className="text-blue-100 text-sm">Categories</p>
              <p className="text-2xl font-bold text-white">{categories.length}</p>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-2xl p-4 border border-white/10">
              <p className="text-blue-100 text-sm">Pending Requests</p>
              <p className="text-2xl font-bold text-yellow-300">{requestStats.pending}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-2xl p-1">
        <button
          onClick={() => setActiveTab('equipment')}
          className={`flex-1 px-6 py-3 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2 ${
            activeTab === 'equipment'
              ? 'bg-white dark:bg-gray-900 text-blue-600 dark:text-blue-400 shadow-lg'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
        >
          <Wrench className="w-4 h-4" />
          Equipment ({rentals.length})
        </button>
        <button
          onClick={() => setActiveTab('requests')}
          className={`flex-1 px-6 py-3 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2 ${
            activeTab === 'requests'
              ? 'bg-white dark:bg-gray-900 text-blue-600 dark:text-blue-400 shadow-lg'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
        >
          <Users className="w-4 h-4" />
          Rental Requests
          {requestStats.pending > 0 && (
            <span className="px-2.5 py-0.5 text-xs bg-red-500 text-white rounded-full animate-pulse">
              {requestStats.pending}
            </span>
          )}
        </button>
      </div>

      {/* ============================================================
          REQUESTS TAB
      ============================================================ */}
      {activeTab === 'requests' && (
        <>
          {/* Request Stats */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-lg border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Total Requests</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{requestStats.total}</p>
                </div>
                <div className="p-2 rounded-xl bg-blue-100 dark:bg-blue-900/30">
                  <Users className="w-5 h-5 text-blue-600" />
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-lg border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Pending</p>
                  <p className="text-2xl font-bold text-yellow-600">{requestStats.pending}</p>
                </div>
                <div className="p-2 rounded-xl bg-yellow-100 dark:bg-yellow-900/30">
                  <Clock className="w-5 h-5 text-yellow-600" />
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-lg border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Approved</p>
                  <p className="text-2xl font-bold text-green-600">{requestStats.approved}</p>
                </div>
                <div className="p-2 rounded-xl bg-green-100 dark:bg-green-900/30">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-lg border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Completed</p>
                  <p className="text-2xl font-bold text-blue-600">{requestStats.completed}</p>
                </div>
                <div className="p-2 rounded-xl bg-blue-100 dark:bg-blue-900/30">
                  <Check className="w-5 h-5 text-blue-600" />
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-lg border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Rejected</p>
                  <p className="text-2xl font-bold text-red-600">{requestStats.rejected}</p>
                </div>
                <div className="p-2 rounded-xl bg-red-100 dark:bg-red-900/30">
                  <XCircle className="w-5 h-5 text-red-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Request Filters */}
          <div className="flex flex-wrap gap-2">
            {['all', 'pending', 'approved', 'completed', 'rejected'].map((filter) => (
              <button
                key={filter}
                onClick={() => setRequestFilter(filter)}
                className={`px-4 py-2 rounded-xl capitalize transition-all ${
                  requestFilter === filter
                    ? "bg-blue-600 text-white shadow-md"
                    : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                }`}
              >
                {filter} ({filter === 'all' ? requestStats.total : requestStats[filter as keyof typeof requestStats]})
              </button>
            ))}
          </div>

          {/* Requests List */}
          {bookingRequests.length === 0 ? (
            <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700">
              <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">No rental requests</h3>
              <p className="text-gray-500 dark:text-gray-400 mt-1">Customer rental requests will appear here</p>
            </div>
          ) : (
            <div className="space-y-4">
              {bookingRequests
                .filter(b => requestFilter === 'all' || b.status === requestFilter)
                .map((request) => {
                  const StatusIcon = getStatusIcon(request.status);
                  const isProcessing = processingBooking === request.id;
                  
                  return (
                    <motion.div
                      key={request.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      whileHover={{ scale: 1.002 }}
                      className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 hover:shadow-xl transition-all duration-300"
                    >
                      <div className="flex flex-wrap justify-between items-start gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-3 mb-3">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                              {request.equipment}
                            </h3>
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 border ${getStatusBadge(request.status)}`}>
                              <StatusIcon className="w-3 h-3" />
                              {request.status}
                            </span>
                            <span className="text-xs text-gray-400 font-mono">
                              #{request.id.slice(0, 8).toUpperCase()}
                            </span>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div className="space-y-2">
                              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                                <User className="w-4 h-4 text-blue-500" />
                                <span className="text-sm font-medium">{request.full_name}</span>
                              </div>
                              {request.company && (
                                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                                  <Building2 className="w-4 h-4 text-purple-500" />
                                  <span className="text-sm">{request.company}</span>
                                </div>
                              )}
                              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                                <Mail className="w-4 h-4 text-emerald-500" />
                                <span className="text-sm truncate">{request.email}</span>
                              </div>
                              {request.phone && (
                                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                                  <Phone className="w-4 h-4 text-yellow-500" />
                                  <span className="text-sm">{request.phone}</span>
                                </div>
                              )}
                            </div>
                            
                            <div className="space-y-2">
                              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                                <Calendar className="w-4 h-4 text-orange-500" />
                                <span className="text-sm">
                                  {request.start_date || 'N/A'} → {request.end_date || 'N/A'}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                                <MessageSquare className="w-4 h-4 text-cyan-500" />
                                <span className="text-sm">Channel: {request.channel || 'Email'}</span>
                              </div>
                              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                                <Clock className="w-4 h-4 text-gray-400" />
                                <span className="text-sm">
                                  {new Date(request.created_at).toLocaleDateString()} at {new Date(request.created_at).toLocaleTimeString()}
                                </span>
                              </div>
                            </div>
                          </div>
                          
                          {request.message && (
                            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 mb-4">
                              <p className="text-sm text-gray-700 dark:text-gray-300 italic">"{request.message}"</p>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex flex-wrap gap-2">
                          {request.status === 'pending' && (
                            <>
                              <button
                                onClick={() => handleBookingAction(request.id, 'approve')}
                                disabled={isProcessing}
                                className="px-4 py-2.5 rounded-xl bg-green-600 text-white hover:bg-green-700 transition-all flex items-center gap-2 disabled:opacity-50 shadow-md hover:shadow-lg"
                              >
                                {isProcessing ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <Check className="w-4 h-4" />
                                )}
                                Approve
                              </button>
                              <button
                                onClick={() => handleBookingAction(request.id, 'reject')}
                                disabled={isProcessing}
                                className="px-4 py-2.5 rounded-xl bg-red-600 text-white hover:bg-red-700 transition-all flex items-center gap-2 disabled:opacity-50 shadow-md hover:shadow-lg"
                              >
                                {isProcessing ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <X className="w-4 h-4" />
                                )}
                                Reject
                              </button>
                            </>
                          )}
                          
                          {request.status === 'approved' && (
                            <button
                              onClick={() => handleBookingAction(request.id, 'complete')}
                              disabled={isProcessing}
                              className="px-4 py-2.5 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-all flex items-center gap-2 disabled:opacity-50 shadow-md hover:shadow-lg"
                            >
                              {isProcessing ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <CheckCheck className="w-4 h-4" />
                              )}
                              Complete
                            </button>
                          )}
                          
                          {(request.status === 'rejected' || request.status === 'completed') && (
                            <button
                              onClick={() => handleBookingAction(request.id, 'approve')}
                              disabled={isProcessing}
                              className="px-4 py-2.5 rounded-xl bg-yellow-600 text-white hover:bg-yellow-700 transition-all flex items-center gap-2 disabled:opacity-50 shadow-md hover:shadow-lg"
                            >
                              {isProcessing ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <RefreshCcw className="w-4 h-4" />
                              )}
                              Re-open
                            </button>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
            </div>
          )}
        </>
      )}

      {/* ============================================================
          EQUIPMENT TAB
      ============================================================ */}
      {activeTab === 'equipment' && (
        <>
          <div className="flex flex-wrap gap-4 items-center justify-between">
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setCategoryFilter("all")}
                className={`px-4 py-2 rounded-xl capitalize transition-all ${
                  categoryFilter === "all"
                    ? "bg-blue-600 text-white shadow-md"
                    : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                }`}
              >
                All
              </button>
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  className={`px-4 py-2 rounded-xl capitalize transition-all ${
                    categoryFilter === cat
                      ? "bg-blue-600 text-white shadow-md"
                      : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                  }`}
                >
                  {cat}
                </button>
              ))}
              <div className="w-px h-8 bg-gray-300 dark:bg-gray-600 mx-1"></div>
              <button
                onClick={() => setStatusFilter("all")}
                className={`px-4 py-2 rounded-xl capitalize transition-all ${
                  statusFilter === "all"
                    ? "bg-blue-600 text-white shadow-md"
                    : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                }`}
              >
                All Status
              </button>
              <button
                onClick={() => setStatusFilter("active")}
                className={`px-4 py-2 rounded-xl transition-all ${
                  statusFilter === "active"
                    ? "bg-green-600 text-white shadow-md"
                    : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                }`}
              >
                Active
              </button>
              <button
                onClick={() => setStatusFilter("inactive")}
                className={`px-4 py-2 rounded-xl transition-all ${
                  statusFilter === "inactive"
                    ? "bg-red-600 text-white shadow-md"
                    : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                }`}
              >
                Inactive
              </button>
            </div>

            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search equipment..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 w-48 md:w-64"
                />
              </div>
              <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-xl p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-lg transition-all ${
                    viewMode === 'grid'
                      ? 'bg-white dark:bg-gray-700 shadow-md text-blue-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-lg transition-all ${
                    viewMode === 'list'
                      ? 'bg-white dark:bg-gray-700 shadow-md text-blue-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
            </div>
          ) : filteredRentals.length === 0 ? (
            <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700">
              <Package className="w-20 h-20 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-gray-900 dark:text-white">No equipment found</h3>
              <p className="text-gray-500 dark:text-gray-400 mt-2">Add your first rental equipment to get started</p>
              <button
                onClick={openCreateModal}
                className="mt-6 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors shadow-lg hover:shadow-xl"
              >
                <Plus className="w-5 h-5 inline mr-2" />
                Add Equipment
              </button>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredRentals.map((rental, index) => (
                <motion.div
                  key={rental.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="group relative bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 border border-gray-200 dark:border-gray-700 hover:-translate-y-1"
                >
                  <div className="relative h-52 overflow-hidden bg-gray-100 dark:bg-gray-700">
                    {rental.image_url ? (
                      <img
                        src={rental.image_url}
                        alt={rental.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800">
                        <ImageIcon className="w-16 h-16 text-gray-400" />
                      </div>
                    )}
                    <div className="absolute top-3 right-3 flex gap-1.5">
                      {rental.active ? (
                        <span className="px-2.5 py-1 bg-green-500 text-white text-xs rounded-full font-semibold shadow-lg">
                          Active
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 bg-red-500 text-white text-xs rounded-full font-semibold shadow-lg">
                          Inactive
                        </span>
                      )}
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent p-4">
                      <span className="text-xs font-semibold text-white/90 uppercase tracking-wider">
                        {rental.category}
                      </span>
                    </div>
                  </div>

                  <div className="p-5">
                    <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-1 line-clamp-1">
                      {rental.name}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 text-sm mb-3 line-clamp-2 min-h-[40px]">
                      {rental.description || "No description available"}
                    </p>
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                          ${rental.day_rate}
                        </span>
                        <span className="text-sm text-gray-500 ml-1">/day</span>
                      </div>
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => moveRental(rental, 'up')}
                          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                          title="Move up"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => moveRental(rental, 'down')}
                          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                          title="Move down"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => viewDetails(rental)}
                          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-3.5 h-3.5 text-gray-500" />
                        </button>
                        <button
                          onClick={() => toggleActive(rental)}
                          className={`p-2 rounded-lg transition-colors ${
                            rental.active
                              ? "hover:bg-green-100 dark:hover:bg-green-900/30 text-green-600"
                              : "hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500"
                          }`}
                          title={rental.active ? "Hide" : "Show"}
                        >
                          {rental.active ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                        <button
                          onClick={() => openEditModal(rental)}
                          className="p-2 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 text-blue-600 transition-colors"
                          title="Edit"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => deleteRental(rental)}
                          className="p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden border border-gray-200 dark:border-gray-700">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-700/50">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Image</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Day Rate</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {filteredRentals.map((rental) => (
                      <tr key={rental.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700">
                            {rental.image_url ? (
                              <img src={rental.image_url} alt={rental.name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <ImageIcon className="w-6 h-6 text-gray-400" />
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{rental.name}</td>
                        <td className="px-6 py-4 text-gray-600 dark:text-gray-400">{rental.category}</td>
                        <td className="px-6 py-4 font-bold text-blue-600 dark:text-blue-400">${rental.day_rate}/day</td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                            rental.active 
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                              : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                          }`}>
                            {rental.active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex gap-1.5">
                            <button
                              onClick={() => toggleActive(rental)}
                              className={`p-2 rounded-lg transition-colors ${
                                rental.active
                                  ? "hover:bg-green-100 dark:hover:bg-green-900/30 text-green-600"
                                  : "hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500"
                              }`}
                              title={rental.active ? "Hide" : "Show"}
                            >
                              {rental.active ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                            <button
                              onClick={() => openEditModal(rental)}
                              className="p-2 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 text-blue-600 transition-colors"
                              title="Edit"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => deleteRental(rental)}
                              className="p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* ============================================================
          DELETE CONFIRMATION MODAL
      ============================================================ */}
      <AnimatePresence>
        {showDeleteModal && deletingRental && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 overflow-y-auto"
          >
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowDeleteModal(false)}></div>
            <div className="relative min-h-screen flex items-center justify-center p-4">
              <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-6"
              >
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-4">
                    <AlertCircle className="w-8 h-8 text-red-500" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">Delete Rental</h3>
                  <p className="text-gray-600 dark:text-gray-400 mt-2">
                    Are you sure you want to delete <strong className="text-red-500">"{deletingRental.name}"</strong>?
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">This action cannot be undone.</p>
                  <div className="flex gap-3 mt-6">
                    <button
                      onClick={() => setShowDeleteModal(false)}
                      className="flex-1 px-4 py-2.5 rounded-xl bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 transition-colors font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={confirmDelete}
                      className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 text-white hover:bg-red-700 transition-colors font-medium shadow-lg hover:shadow-xl"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ============================================================
          ADD/EDIT RENTAL MODAL
      ============================================================ */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 overflow-y-auto"
          >
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowModal(false)}></div>
            <div className="relative min-h-screen flex items-center justify-center p-4">
              <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 30 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 30 }}
                className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              >
                <div className="sticky top-0 bg-white dark:bg-gray-800 p-6 border-b border-gray-200 dark:border-gray-700 rounded-t-2xl z-10">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                        {editingRental ? 'Edit Rental' : 'Add New Rental'}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                        {editingRental ? 'Update equipment details' : 'Add equipment to your fleet'}
                      </p>
                    </div>
                    <button
                      onClick={() => setShowModal(false)}
                      className="p-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                <div className="p-6 space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                        Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="e.g., Industrial Air Compressor"
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                        Category
                      </label>
                      <input
                        type="text"
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        placeholder="e.g., Compressors"
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      Description
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={3}
                      placeholder="Describe the equipment..."
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                        Day Rate ($)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={formData.day_rate}
                        onChange={(e) => setFormData({ ...formData, day_rate: parseFloat(e.target.value) || 0 })}
                        placeholder="0"
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                        Display Order
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={formData.position}
                        onChange={(e) => setFormData({ ...formData, position: parseInt(e.target.value) || 0 })}
                        placeholder="0"
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      Image
                    </label>
                    <div className="flex gap-3">
                      <input
                        type="text"
                        value={formData.image_url}
                        onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                        placeholder="Image URL or upload below"
                        className="flex-1 px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      />
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        hidden
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleImageUpload(file);
                          e.target.value = "";
                        }}
                      />
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                        className="px-4 py-2.5 rounded-xl bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 transition-colors disabled:opacity-50 flex items-center gap-2"
                      >
                        {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                        Upload
                      </button>
                    </div>
                    {formData.image_url && (
                      <div className="mt-3 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 w-32 h-24">
                        <img src={formData.image_url} alt="Preview" className="w-full h-full object-cover" />
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={formData.active}
                      onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <label className="text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
                      Active (visible on website)
                    </label>
                  </div>
                </div>

                <div className="sticky bottom-0 bg-white dark:bg-gray-800 p-6 border-t border-gray-200 dark:border-gray-700 rounded-b-2xl flex gap-3">
                  <button
                    onClick={() => setShowModal(false)}
                    className="flex-1 px-4 py-3 rounded-xl bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 transition-colors font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={saveRental}
                    className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold hover:from-blue-700 hover:to-blue-800 transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
                  >
                    <Save className="w-5 h-5" />
                    {editingRental ? 'Update Rental' : 'Add Rental'}
                  </button>
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}