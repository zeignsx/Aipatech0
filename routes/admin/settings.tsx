import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Monitor } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { 
  
  Settings, Shield, Bell, Moon, Sun, Globe, Mail, Phone, 
  MapPin, Users, Database, Activity, Eye, EyeOff, Lock,
  Key, UserCog, CreditCard, TrendingUp, Award, CheckCircle,
  AlertCircle, Save, RefreshCw, Upload, Trash2, Plus,
  X, ChevronRight, ChevronDown, Building2, Link as LinkIcon,
  Palette, Brush, Zap, AlertTriangle, Wrench, Clock
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/settings")({
  component: AdminSettings,
});

interface SettingsData {
  // General Settings
  company_name: string;
  company_logo: string;
  company_email: string;
  company_phone: string;
  company_address: string;
  company_website: string;
  
  // Email Settings
  smtp_host: string;
  smtp_port: number;
  smtp_user: string;
  smtp_pass: string;
  smtp_from_email: string;
  smtp_from_name: string;
  
  // Notification Settings
  email_notifications: boolean;
  push_notifications: boolean;
  booking_alerts: boolean;
  invoice_alerts: boolean;
  customer_alerts: boolean;
  
  // Security Settings
  two_factor_auth: boolean;
  session_timeout: number;
  max_login_attempts: number;
  password_expiry_days: number;
  
  // System Settings
  site_name: string;
  site_description: string;
  site_keywords: string;
  maintenance_mode: boolean;
  maintenance_message: string;
  maintenance_until: string | null;
  debug_mode: boolean;
  
  // Currency & Tax Settings
  default_currency: string;
  default_tax_rate: number;
  invoice_prefix: string;
  invoice_next_number: number;
  
  // Theme Settings
  theme: 'light' | 'dark' | 'system';
  primary_color: string;
  accent_color: string;
  sidebar_collapsed: boolean;
}

function AdminSettings() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('general');
  const [isAdmin, setIsAdmin] = useState(false);
  const [settings, setSettings] = useState<SettingsData>({
    company_name: 'AIPATECH Energy Limited',
    company_logo: '',
    company_email: 'info@aipatechenergy.com',
    company_phone: '+234 800 000 0000',
    company_address: 'Abuja & Port Harcourt, Nigeria',
    company_website: 'https://aipatechenergy.com',
    smtp_host: 'smtp-relay.brevo.com',
    smtp_port: 587,
    smtp_user: '',
    smtp_pass: '',
    smtp_from_email: 'noreply@aipatechenergy.com',
    smtp_from_name: 'AIPATECH Energy',
    email_notifications: true,
    push_notifications: true,
    booking_alerts: true,
    invoice_alerts: true,
    customer_alerts: true,
    two_factor_auth: false,
    session_timeout: 60,
    max_login_attempts: 5,
    password_expiry_days: 90,
    site_name: 'AIPATECH Energy Limited',
    site_description: 'Indigenous Nigerian oil & gas engineering, manufacturing, integrity management and equipment supply',
    site_keywords: 'oil and gas, nigeria, engineering, equipment rental, integrity management',
    maintenance_mode: false,
    maintenance_message: "We're currently performing scheduled maintenance to improve your experience. Please check back soon.",
    maintenance_until: null,
    debug_mode: false,
    default_currency: 'USD',
    default_tax_rate: 7.5,
    invoice_prefix: 'INV',
    invoice_next_number: 1001,
    theme: 'system',
    primary_color: '#3b82f6',
    accent_color: '#06b6d4',
    sidebar_collapsed: false,
  });

  useEffect(() => {
    checkAdminAndLoad();
  }, []);

  const checkAdminAndLoad = async () => {
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
    loadSettings();
  };

  const loadSettings = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('settings')
        .select('*')
        .single();
      
      if (data && !error) {
        setSettings(prev => ({ ...prev, ...data }));
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('settings')
        .upsert({
          id: 1,
          ...settings,
          updated_at: new Date().toISOString(),
        });
      
      if (error) throw error;
      
      toast.success('Settings saved successfully');
      
      // If maintenance mode was toggled, show additional notification
      if (settings.maintenance_mode) {
        toast.info('Maintenance mode is active. Only admins can access the site.');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const updateSetting = (key: keyof SettingsData, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const previewMaintenancePage = () => {
    window.open('/maintenance-preview', '_blank');
  };

  const tabs = [
    { id: 'general', label: 'General', icon: Settings },
    { id: 'company', label: 'Company', icon: Building2 },
    { id: 'email', label: 'Email', icon: Mail },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'system', label: 'System', icon: Database },
    { id: 'invoice', label: 'Invoice', icon: CreditCard },
    { id: 'appearance', label: 'Appearance', icon: Palette },
  ];

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Shield className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Access Denied</h2>
          <p className="text-gray-600 dark:text-gray-400 mt-2">Admin privileges required</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-600 via-blue-700 to-cyan-600 p-8 shadow-2xl">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white/20 via-transparent to-transparent"></div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="relative z-10">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-white">Settings</h1>
              <p className="text-blue-100 mt-2">Configure your application settings</p>
            </div>
            <button
              onClick={saveSettings}
              disabled={saving}
              className="px-6 py-3 rounded-xl bg-white/20 backdrop-blur text-white font-semibold hover:bg-white/30 transition-all flex items-center gap-2"
            >
              {saving ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                <Save className="w-5 h-5" />
              )}
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-gray-200 dark:border-gray-700 pb-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
              activeTab === tab.id
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="space-y-6">
        {/* General Settings */}
        {activeTab === 'general' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">General Settings</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Site Name
                  </label>
                  <input
                    type="text"
                    value={settings.site_name}
                    onChange={(e) => updateSetting('site_name', e.target.value)}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Site Description
                  </label>
                  <textarea
                    value={settings.site_description}
                    onChange={(e) => updateSetting('site_description', e.target.value)}
                    rows={3}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Site Keywords (comma separated)
                  </label>
                  <input
                    type="text"
                    value={settings.site_keywords}
                    onChange={(e) => updateSetting('site_keywords', e.target.value)}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
                    placeholder="keyword1, keyword2, keyword3"
                  />
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Company Settings */}
        {activeTab === 'company' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Company Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Company Name
                  </label>
                  <input
                    type="text"
                    value={settings.company_name}
                    onChange={(e) => updateSetting('company_name', e.target.value)}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Company Email
                  </label>
                  <input
                    type="email"
                    value={settings.company_email}
                    onChange={(e) => updateSetting('company_email', e.target.value)}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Company Phone
                  </label>
                  <input
                    type="text"
                    value={settings.company_phone}
                    onChange={(e) => updateSetting('company_phone', e.target.value)}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Company Website
                  </label>
                  <input
                    type="url"
                    value={settings.company_website}
                    onChange={(e) => updateSetting('company_website', e.target.value)}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Company Address
                  </label>
                  <textarea
                    value={settings.company_address}
                    onChange={(e) => updateSetting('company_address', e.target.value)}
                    rows={3}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
                  />
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Email Settings */}
        {activeTab === 'email' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">SMTP Configuration</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    SMTP Host
                  </label>
                  <input
                    type="text"
                    value={settings.smtp_host}
                    onChange={(e) => updateSetting('smtp_host', e.target.value)}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    SMTP Port
                  </label>
                  <input
                    type="number"
                    value={settings.smtp_port}
                    onChange={(e) => updateSetting('smtp_port', parseInt(e.target.value))}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    SMTP Username
                  </label>
                  <input
                    type="text"
                    value={settings.smtp_user}
                    onChange={(e) => updateSetting('smtp_user', e.target.value)}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    SMTP Password
                  </label>
                  <input
                    type="password"
                    value={settings.smtp_pass}
                    onChange={(e) => updateSetting('smtp_pass', e.target.value)}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    From Email
                  </label>
                  <input
                    type="email"
                    value={settings.smtp_from_email}
                    onChange={(e) => updateSetting('smtp_from_email', e.target.value)}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    From Name
                  </label>
                  <input
                    type="text"
                    value={settings.smtp_from_name}
                    onChange={(e) => updateSetting('smtp_from_name', e.target.value)}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
                  />
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Notification Settings */}
        {activeTab === 'notifications' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Notification Preferences</h3>
              <div className="space-y-4">
                <label className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">Email Notifications</p>
                    <p className="text-sm text-gray-500">Receive notifications via email</p>
                  </div>
                  <button
                    onClick={() => updateSetting('email_notifications', !settings.email_notifications)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      settings.email_notifications ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
                    }`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.email_notifications ? 'translate-x-6' : 'translate-x-1'
                    }`} />
                  </button>
                </label>
                <label className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">Push Notifications</p>
                    <p className="text-sm text-gray-500">Receive browser push notifications</p>
                  </div>
                  <button
                    onClick={() => updateSetting('push_notifications', !settings.push_notifications)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      settings.push_notifications ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
                    }`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.push_notifications ? 'translate-x-6' : 'translate-x-1'
                    }`} />
                  </button>
                </label>
                <label className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">Booking Alerts</p>
                    <p className="text-sm text-gray-500">Get notified when new bookings are made</p>
                  </div>
                  <button
                    onClick={() => updateSetting('booking_alerts', !settings.booking_alerts)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      settings.booking_alerts ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
                    }`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.booking_alerts ? 'translate-x-6' : 'translate-x-1'
                    }`} />
                  </button>
                </label>
                <label className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">Invoice Alerts</p>
                    <p className="text-sm text-gray-500">Get notified about invoice payments</p>
                  </div>
                  <button
                    onClick={() => updateSetting('invoice_alerts', !settings.invoice_alerts)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      settings.invoice_alerts ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
                    }`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.invoice_alerts ? 'translate-x-6' : 'translate-x-1'
                    }`} />
                  </button>
                </label>
                <label className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">Customer Alerts</p>
                    <p className="text-sm text-gray-500">Get notified about new customer registrations</p>
                  </div>
                  <button
                    onClick={() => updateSetting('customer_alerts', !settings.customer_alerts)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      settings.customer_alerts ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
                    }`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.customer_alerts ? 'translate-x-6' : 'translate-x-1'
                    }`} />
                  </button>
                </label>
              </div>
            </div>
          </motion.div>
        )}

        {/* Security Settings */}
        {activeTab === 'security' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Security Settings</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Session Timeout (minutes)
                  </label>
                  <input
                    type="number"
                    value={settings.session_timeout}
                    onChange={(e) => updateSetting('session_timeout', parseInt(e.target.value))}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Max Login Attempts
                  </label>
                  <input
                    type="number"
                    value={settings.max_login_attempts}
                    onChange={(e) => updateSetting('max_login_attempts', parseInt(e.target.value))}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Password Expiry (days)
                  </label>
                  <input
                    type="number"
                    value={settings.password_expiry_days}
                    onChange={(e) => updateSetting('password_expiry_days', parseInt(e.target.value))}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
                  />
                </div>
                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">Two-Factor Authentication</p>
                    <p className="text-sm text-gray-500">Require 2FA for admin accounts</p>
                  </div>
                  <button
                    onClick={() => updateSetting('two_factor_auth', !settings.two_factor_auth)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      settings.two_factor_auth ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
                    }`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.two_factor_auth ? 'translate-x-6' : 'translate-x-1'
                    }`} />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* System Settings with Maintenance Mode */}
        {activeTab === 'system' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Maintenance Mode Section */}
            <div className={`rounded-2xl shadow-xl p-6 ${
              settings.maintenance_mode 
                ? 'bg-gradient-to-r from-red-500/10 via-orange-500/10 to-yellow-500/10 border-2 border-red-500/30'
                : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700'
            }`}>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <AlertTriangle className={`w-5 h-5 ${settings.maintenance_mode ? 'text-red-500' : 'text-yellow-500'}`} />
                Maintenance Mode Controls
              </h3>
              
              <div className="space-y-4">
                <label className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/30 rounded-xl">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">Enable Maintenance Mode</p>
                    <p className="text-sm text-gray-500">Block all non-admin users from accessing the site</p>
                    {settings.maintenance_mode && (
                      <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        Active - Only admins can access
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => updateSetting('maintenance_mode', !settings.maintenance_mode)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      settings.maintenance_mode ? 'bg-red-600' : 'bg-gray-300 dark:bg-gray-600'
                    }`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.maintenance_mode ? 'translate-x-6' : 'translate-x-1'
                    }`} />
                  </button>
                </label>

                {settings.maintenance_mode && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="space-y-4"
                  >
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Maintenance Message
                      </label>
                      <textarea
                        value={settings.maintenance_message}
                        onChange={(e) => updateSetting('maintenance_message', e.target.value)}
                        rows={3}
                        className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
                        placeholder="Enter maintenance message..."
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Estimated Completion Time (Optional)
                      </label>
                      <input
                        type="datetime-local"
                        value={settings.maintenance_until ? new Date(settings.maintenance_until).toISOString().slice(0, 16) : ''}
                        onChange={(e) => updateSetting('maintenance_until', e.target.value ? new Date(e.target.value).toISOString() : null)}
                        className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
                      />
                    </div>

                    <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-4">
                      <div className="flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-semibold text-red-800 dark:text-red-300">Warning: Maintenance Mode Active</p>
                          <p className="text-xs text-red-700 dark:text-red-400 mt-1">
                            Only administrators can access the site. Regular users will see a maintenance page.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Preview Button */}
                    <button
                      onClick={previewMaintenancePage}
                      className="w-full py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center justify-center gap-2"
                    >
                      <Eye className="w-4 h-4" />
                      Preview Maintenance Page
                    </button>
                  </motion.div>
                )}

                <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
                  <label className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/30 rounded-xl">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">Debug Mode</p>
                      <p className="text-sm text-gray-500">Enable detailed error logging</p>
                    </div>
                    <button
                      onClick={() => updateSetting('debug_mode', !settings.debug_mode)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        settings.debug_mode ? 'bg-yellow-600' : 'bg-gray-300 dark:bg-gray-600'
                      }`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        settings.debug_mode ? 'translate-x-6' : 'translate-x-1'
                      }`} />
                    </button>
                  </label>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Invoice Settings */}
        {activeTab === 'invoice' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Invoice Settings</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Default Currency
                  </label>
                  <select
                    value={settings.default_currency}
                    onChange={(e) => updateSetting('default_currency', e.target.value)}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
                  >
                    <option value="USD">USD - US Dollar</option>
                    <option value="EUR">EUR - Euro</option>
                    <option value="GBP">GBP - British Pound</option>
                    <option value="NGN">NGN - Nigerian Naira</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Default Tax Rate (%)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={settings.default_tax_rate}
                    onChange={(e) => updateSetting('default_tax_rate', parseFloat(e.target.value))}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Invoice Prefix
                  </label>
                  <input
                    type="text"
                    value={settings.invoice_prefix}
                    onChange={(e) => updateSetting('invoice_prefix', e.target.value)}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Next Invoice Number
                  </label>
                  <input
                    type="number"
                    value={settings.invoice_next_number}
                    onChange={(e) => updateSetting('invoice_next_number', parseInt(e.target.value))}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
                  />
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Appearance Settings */}
        {activeTab === 'appearance' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Appearance Settings</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Theme
                  </label>
                  <select
                    value={settings.theme}
                    onChange={(e) => updateSetting('theme', e.target.value as any)}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
                  >
                    <option value="light">Light</option>
                    <option value="dark">Dark</option>
                    <option value="system">System</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Primary Color
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={settings.primary_color}
                      onChange={(e) => updateSetting('primary_color', e.target.value)}
                      className="w-12 h-10 rounded border border-gray-300 dark:border-gray-600 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={settings.primary_color}
                      onChange={(e) => updateSetting('primary_color', e.target.value)}
                      className="flex-1 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Accent Color
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={settings.accent_color}
                      onChange={(e) => updateSetting('accent_color', e.target.value)}
                      className="w-12 h-10 rounded border border-gray-300 dark:border-gray-600 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={settings.accent_color}
                      onChange={(e) => updateSetting('accent_color', e.target.value)}
                      className="flex-1 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">Sidebar Collapsed</p>
                    <p className="text-sm text-gray-500">Collapse sidebar by default</p>
                  </div>
                  <button
                    onClick={() => updateSetting('sidebar_collapsed', !settings.sidebar_collapsed)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      settings.sidebar_collapsed ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
                    }`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.sidebar_collapsed ? 'translate-x-6' : 'translate-x-1'
                    }`} />
                  </button>
                </div>
              </div>
            </div>

            {/* Preview */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Preview</h3>
              <div className="space-y-6">
                <div className="p-4 rounded-xl" style={{ backgroundColor: settings.primary_color + '20' }}>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full" style={{ backgroundColor: settings.primary_color }}></div>
                    <div className="w-10 h-10 rounded-full" style={{ backgroundColor: settings.accent_color }}></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium" style={{ color: settings.primary_color }}>
                        Primary Color Preview
                      </p>
                      <p className="text-xs text-gray-500" style={{ color: settings.accent_color }}>
                        Accent Color Preview
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="h-8 rounded-lg" style={{ backgroundColor: settings.primary_color }}></div>
                    <div className="h-8 rounded-lg" style={{ backgroundColor: settings.accent_color }}></div>
                    <div className="h-8 rounded-lg" style={{ 
                      background: `linear-gradient(135deg, ${settings.primary_color}, ${settings.accent_color})` 
                    }}></div>
                  </div>
                </div>
                
                {/* Theme Preview */}
                <div className="flex items-center justify-between p-4 rounded-xl bg-gray-100 dark:bg-gray-700/50">
                  <div className="flex items-center gap-2">
                    {settings.theme === 'light' && <Sun className="w-5 h-5 text-yellow-500" />}
                    {settings.theme === 'dark' && <Moon className="w-5 h-5 text-blue-500" />}
                    {settings.theme === 'system' && <Monitor className="w-5 h-5 text-gray-500" />}
                    <span className="capitalize">{settings.theme} Mode</span>
                  </div>
                  <div className="flex gap-1">
                    <div className="w-6 h-6 rounded-full bg-white border border-gray-300"></div>
                    <div className="w-6 h-6 rounded-full bg-gray-900 border border-gray-700"></div>
                  </div>
                </div>

                {/* Sidebar Preview */}
                <div className="flex gap-2 p-3 rounded-xl bg-gray-100 dark:bg-gray-700/50">
                  <div className={`bg-gray-200 dark:bg-gray-600 rounded-lg transition-all duration-300 ${settings.sidebar_collapsed ? 'w-12' : 'w-20'} h-16`}></div>
                  <div className="flex-1 bg-gray-200 dark:bg-gray-600 rounded-lg h-16"></div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}