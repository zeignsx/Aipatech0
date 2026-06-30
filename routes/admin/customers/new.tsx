import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { UserPlus, Mail, Phone, Building2, User, ArrowLeft, Shield, UserCheck, AlertCircle } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/customers/new")({
  component: AddCustomer,
});

function AddCustomer() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirm_password: "",
    full_name: "",
    phone: "",
    company: "",
    address: "",
    role: "user" as "admin" | "user",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.email || !formData.password) {
      toast.error("Email and password are required");
      return;
    }
    
    if (formData.password !== formData.confirm_password) {
      toast.error("Passwords do not match");
      return;
    }
    
    if (formData.password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    
    if (!formData.email.includes("@")) {
      toast.error("Please enter a valid email address");
      return;
    }
    
    setLoading(true);
    
    try {
      // Step 1: Create user in Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.full_name,
            phone: formData.phone,
          },
          emailRedirectTo: `${window.location.origin}/auth`,
        },
      });
      
      if (authError) {
        if (authError.message.includes("User already registered")) {
          toast.error("User with this email already exists");
        } else {
          throw authError;
        }
        setLoading(false);
        return;
      }
      
      if (!authData.user) {
        toast.error("Failed to create user account");
        setLoading(false);
        return;
      }
      
      const userId = authData.user.id;
      
      // Step 2: Assign role in user_roles table
      const { error: roleError } = await supabase
        .from("user_roles")
        .insert({
          user_id: userId,
          role: formData.role,
        });
      
      if (roleError) {
        console.error("Role assignment error:", roleError);
        // Don't fail, continue anyway
      }
      
      // Step 3: Create customer record
      const { error: customerError } = await supabase
        .from("customers")
        .insert({
          owner_id: userId,
          name: formData.full_name || formData.email.split('@')[0],
          email: formData.email,
          phone: formData.phone || null,
          company: formData.company || null,
          address: formData.address || null,
        });
      
      if (customerError) {
        console.error("Customer record error:", customerError);
        toast.warning("User created but customer record could not be saved");
      } else {
        toast.success("Customer created successfully!");
      }
      
      // Success - redirect after delay
      setTimeout(() => {
        navigate({ to: "/admin/customers" });
      }, 2000);
      
    } catch (error: any) {
      console.error("Error creating customer:", error);
      toast.error(error.message || "Failed to create customer");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-600 via-blue-700 to-cyan-600 p-8 shadow-2xl">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white/20 via-transparent to-transparent"></div>
        <div className="relative z-10">
          <button
            onClick={() => navigate({ to: "/admin/customers" })}
            className="mb-4 text-white/80 hover:text-white flex items-center gap-2 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Customers
          </button>
          <h1 className="text-3xl font-bold text-white">Add New Customer</h1>
          <p className="text-blue-100 mt-2">Create a new customer account</p>
        </div>
      </div>

      {/* Form */}
      <motion.form
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        onSubmit={handleSubmit}
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 space-y-6"
      >
        {/* Account Information */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <User className="w-4 h-4 text-blue-600" />
            </div>
            Account Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Email Address *
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="customer@example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Password *
              </label>
              <input
                type="password"
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="••••••••"
              />
              <p className="text-xs text-gray-500 mt-1">Minimum 6 characters</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Confirm Password *
              </label>
              <input
                type="password"
                required
                value={formData.confirm_password}
                onChange={(e) => setFormData({ ...formData, confirm_password: e.target.value })}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="••••••••"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Full Name
              </label>
              <input
                type="text"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="John Doe"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Phone Number
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="+1234567890"
              />
            </div>
          </div>
        </div>

        {/* Company Information */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <Building2 className="w-4 h-4 text-green-600" />
            </div>
            Company Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Company Name
              </label>
              <input
                type="text"
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Company Name"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Address
              </label>
              <textarea
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                rows={2}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Full address"
              />
            </div>
          </div>
        </div>

        {/* Role Selection */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
              <Shield className="w-4 h-4 text-purple-600" />
            </div>
            Role & Permissions
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
              formData.role === 'user' 
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                : 'border-gray-200 dark:border-gray-700 hover:border-blue-300'
            }`}>
              <input
                type="radio"
                name="role"
                value="user"
                checked={formData.role === 'user'}
                onChange={(e) => setFormData({ ...formData, role: e.target.value as 'user' })}
                className="w-4 h-4 mt-1 text-blue-600"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-blue-500" />
                  <p className="font-semibold text-gray-900 dark:text-white">Customer</p>
                </div>
                <p className="text-sm text-gray-500 mt-1">Standard user with customer access</p>
                <ul className="text-xs text-gray-400 mt-2 space-y-1">
                  <li>✓ View and manage their bookings</li>
                  <li>✓ Access customer portal</li>
                  <li>✓ Request equipment rentals</li>
                </ul>
              </div>
            </label>
            
            <label className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
              formData.role === 'admin' 
                ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20' 
                : 'border-gray-200 dark:border-gray-700 hover:border-purple-300'
            }`}>
              <input
                type="radio"
                name="role"
                value="admin"
                checked={formData.role === 'admin'}
                onChange={(e) => setFormData({ ...formData, role: e.target.value as 'admin' })}
                className="w-4 h-4 mt-1 text-purple-600"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-purple-500" />
                  <p className="font-semibold text-gray-900 dark:text-white">Administrator</p>
                </div>
                <p className="text-sm text-gray-500 mt-1">Full access to all admin features</p>
                <ul className="text-xs text-gray-400 mt-2 space-y-1">
                  <li>✓ Full access to admin dashboard</li>
                  <li>✓ Manage all bookings and invoices</li>
                  <li>✓ Manage customers and rentals</li>
                  <li>✓ Site content management</li>
                </ul>
              </div>
            </label>
          </div>
        </div>

        {/* Info Box */}
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-800 dark:text-blue-300">
            <p className="font-semibold mb-1">Important Notes:</p>
            <ul className="space-y-1 text-xs">
              <li>• The customer will receive a welcome email with their login credentials</li>
              <li>• You can change the customer's role later from the customers list</li>
              <li>• All customer data is encrypted and securely stored</li>
            </ul>
          </div>
        </div>

        {/* Submit Buttons */}
        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            ) : (
              <>
                <UserPlus className="w-5 h-5" />
                Create Customer Account
              </>
            )}
          </button>
          <button
            type="button"
            onClick={() => navigate({ to: "/admin/customers" })}
            className="px-6 py-3 rounded-xl bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
          >
            Cancel
          </button>
        </div>
      </motion.form>
    </div>
  );
}