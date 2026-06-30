import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  Send, Users, Mail, Bell, Sparkles, Trash2, 
  Clock, Filter, RefreshCw, Calendar,
  Loader2, Search, Plus, Edit, Copy, 
  MailCheck, MailPlus, SendHorizonal, User, X,
  AlertCircle, CheckCircle, ChevronDown, ChevronUp,
  UserPlus
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export const Route = createFileRoute("/admin/notifications")({
  component: AdminNotifications,
});

interface User {
  id: string;
  email: string;
  full_name: string;
  role: string;
}

interface Template {
  id: string;
  name: string;
  type: string;
  title: string;
  body: string;
  created_at: string;
}

interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  body: string;
  link: string;
  read: boolean;
  read_at: string;
  created_at: string;
  metadata: any;
}

function AdminNotifications() {
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [activeTab, setActiveTab] = useState<'create' | 'history' | 'templates'>('create');
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [manualEmail, setManualEmail] = useState("");
  const [showManualInput, setShowManualInput] = useState(false);
  const [sendStatus, setSendStatus] = useState<{ success: number; failed: number } | null>(null);
  const [recipientType, setRecipientType] = useState<'all' | 'selected' | 'self'>('self');
  
  const [form, setForm] = useState({
    userId: '',
    type: 'general_info',
    title: '',
    body: '',
    link: '',
    priority: 0,
    sendToAll: false,
    sendEmail: false,
    emailSubject: '',
    scheduleDate: '',
    scheduleTime: '',
    isScheduled: false,
  });

  const [templateForm, setTemplateForm] = useState({
    name: '',
    type: 'general_info',
    title: '',
    body: '',
  });

  useEffect(() => {
    loadData();
    loadCurrentUser();
    loadUsers();
  }, []);

  const loadCurrentUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);
      console.log('Current user:', user?.email);
    } catch (error) {
      console.error('Error loading current user:', error);
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      // Load templates
      const { data: templatesData, error: templatesError } = await supabase
        .from('notification_templates')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (templatesError) {
        console.error('Templates error:', templatesError);
      } else if (templatesData) {
        setTemplates(templatesData);
      }

      // Load notifications
      const { data: notificationsData, error: notificationsError } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (notificationsError) {
        console.error('Notifications error:', notificationsError);
      } else if (notificationsData) {
        setNotifications(notificationsData);
      }
    } catch (error: any) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    setLoadingUsers(true);
    try {
      console.log('Loading users...');
      
      // Get users from user_roles
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');
      
      if (!rolesError && roles && roles.length > 0) {
        const { data: profiles, error: profilesError } = await supabase
          .from('user_profiles')
          .select('user_id, full_name');
        
        if (!profilesError) {
          const userList: User[] = [];
          
          for (const role of roles) {
            // Try to get email
            let email = `user-${role.user_id.slice(0, 8)}@example.com`;
            try {
              const { data: authData } = await supabase
                .from('auth.users')
                .select('email')
                .eq('id', role.user_id)
                .maybeSingle();
              if (authData?.email) email = authData.email;
            } catch (e) {}
            
            const profile = profiles?.find((p: any) => p.user_id === role.user_id);
            userList.push({
              id: role.user_id,
              email: email,
              full_name: profile?.full_name || 'User',
              role: role.role || 'user',
            });
          }
          
          if (userList.length > 0) {
            setUsers(userList);
            setLoadingUsers(false);
            return;
          }
        }
      }

      // Fallback: use current user
      if (currentUser?.email) {
        setUsers([{
          id: currentUser.id,
          email: currentUser.email,
          full_name: currentUser.raw_user_meta_data?.full_name || currentUser.email?.split('@')[0] || 'User',
          role: 'admin',
        }]);
        setLoadingUsers(false);
        return;
      }

      // Default fallback
      setUsers([{
        id: 'admin-1',
        email: 'admin@aipatechenergy.com',
        full_name: 'Admin User',
        role: 'admin',
      }]);
      setLoadingUsers(false);

    } catch (error: any) {
      console.error('Error loading users:', error);
      setUsers([{
        id: 'admin-1',
        email: 'admin@aipatechenergy.com',
        full_name: 'Admin User',
        role: 'admin',
      }]);
      setLoadingUsers(false);
    }
  };

  const addManualUser = () => {
    if (!manualEmail || !manualEmail.includes('@')) {
      toast.error('Please enter a valid email address');
      return;
    }

    if (users.find(u => u.email === manualEmail)) {
      toast.error('User already exists');
      return;
    }

    const newUser: User = {
      id: `manual-${Date.now()}`,
      email: manualEmail,
      full_name: manualEmail.split('@')[0] || 'User',
      role: 'user'
    };

    setUsers([...users, newUser]);
    setSelectedUserIds([...selectedUserIds, newUser.id]);
    setManualEmail('');
    setShowManualInput(false);
    toast.success(`Added ${manualEmail} to recipients`);
  };

  const toggleUserSelection = (userId: string) => {
    setSelectedUserIds(prev => {
      if (prev.includes(userId)) {
        return prev.filter(id => id !== userId);
      } else {
        return [...prev, userId];
      }
    });
  };

  const getSelectedUsers = () => {
    return users.filter(u => selectedUserIds.includes(u.id));
  };

  const removeUserSelection = (userId: string) => {
    setSelectedUserIds(prev => prev.filter(id => id !== userId));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!form.title) {
      toast.error('Title is required');
      return;
    }

    setSending(true);
    setSendStatus(null);

    try {
      const { data: { user: adminUser } } = await supabase.auth.getUser();
      if (!adminUser) {
        toast.error('Not authenticated');
        setSending(false);
        return;
      }

      // Determine target users
      let targetUsers: User[] = [];

      if (form.sendToAll) {
        // Send to all users with emails
        targetUsers = users.filter(u => u.id && u.email);
      } else if (selectedUserIds.length > 0) {
        // Send to selected users
        targetUsers = users.filter(u => selectedUserIds.includes(u.id) && u.email);
      } else {
        // Default: send to self (current user)
        targetUsers = [{
          id: adminUser.id,
          email: adminUser.email || 'admin@aipatechenergy.com',
          full_name: adminUser.raw_user_meta_data?.full_name || 'Admin',
          role: 'admin',
        }];
        toast.info('No recipients selected. Sending to yourself as a test.');
      }

      // Filter out users without emails
      targetUsers = targetUsers.filter(u => u.email);

      if (targetUsers.length === 0) {
        toast.error('No valid users with email addresses found');
        setSending(false);
        return;
      }

      console.log(`Sending to ${targetUsers.length} users:`, targetUsers.map(u => u.email));

      // Insert notifications
      let inserted = 0;
      let failed = 0;
      
      for (const user of targetUsers) {
        try {
          const { error } = await supabase
            .from('notifications')
            .insert({
              user_id: user.id,
              type: form.type || 'general_info',
              title: form.title,
              body: form.body || '',
              link: form.link || '',
              priority: form.priority || 0,
              metadata: {
                created_by: adminUser.id,
                recipient_email: user.email,
                sent_to_all: form.sendToAll,
                sent_via_email: form.sendEmail,
              },
            });

          if (error) {
            console.error('Insert error for', user.email, ':', error);
            failed++;
          } else {
            console.log('Inserted for', user.email);
            inserted++;
          }
        } catch (error) {
          console.error('Insert error for', user.email, ':', error);
          failed++;
        }
      }

      setSendStatus({ success: inserted, failed });

      if (inserted > 0) {
        toast.success(`✅ Notification sent to ${inserted} user(s)`);
        
        // Reset form
        setForm({
          userId: '',
          type: 'general_info',
          title: '',
          body: '',
          link: '',
          priority: 0,
          sendToAll: false,
          sendEmail: false,
          emailSubject: '',
          scheduleDate: '',
          scheduleTime: '',
          isScheduled: false,
        });
        setSelectedUserIds([]);
        
        loadData();
      } else {
        toast.error('Failed to send notifications. Check console for details.');
      }

    } catch (error: any) {
      console.error('Error sending notification:', error);
      toast.error(error.message || 'Failed to send notification');
    } finally {
      setSending(false);
    }
  };

  const handleSaveTemplate = async () => {
    if (!templateForm.name || !templateForm.title) {
      toast.error('Template name and title are required');
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Not authenticated');
        return;
      }

      const { error } = await supabase
        .from('notification_templates')
        .insert({
          name: templateForm.name,
          type: templateForm.type,
          title: templateForm.title,
          body: templateForm.body,
          created_by: user.id,
        });

      if (error) throw error;

      toast.success('Template saved successfully');
      setShowTemplateModal(false);
      setTemplateForm({
        name: '',
        type: 'general_info',
        title: '',
        body: '',
      });
      loadData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to save template');
    }
  };

  const loadTemplate = (template: Template) => {
    setForm({
      ...form,
      type: template.type,
      title: template.title,
      body: template.body,
    });
    setSelectedTemplate(template);
    toast.success(`Loaded template: ${template.name}`);
  };

  const deleteTemplate = async (id: string) => {
    if (!confirm('Delete this template?')) return;

    try {
      const { error } = await supabase
        .from('notification_templates')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Template deleted');
      loadData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete template');
    }
  };

  const deleteNotification = async (id: string) => {
    if (!confirm('Delete this notification?')) return;

    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Notification deleted');
      loadData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete notification');
    }
  };

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      booking_created: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
      booking_approved: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      booking_rejected: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
      booking_completed: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
      invoice_created: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400',
      invoice_paid: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
      invoice_overdue: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
      customer_created: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
      rental_created: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-400',
      system_alert: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
      general_info: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
    };
    return colors[type] || colors.general_info;
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      booking_created: 'Booking Created',
      booking_approved: 'Booking Approved',
      booking_rejected: 'Booking Rejected',
      booking_completed: 'Booking Completed',
      invoice_created: 'Invoice Created',
      invoice_paid: 'Invoice Paid',
      invoice_overdue: 'Invoice Overdue',
      customer_created: 'Customer Created',
      rental_created: 'Rental Created',
      system_alert: 'System Alert',
      general_info: 'General Info',
    };
    return labels[type] || type;
  };

  const notificationTypes = [
    { value: 'booking_created', label: 'Booking Created' },
    { value: 'booking_approved', label: 'Booking Approved' },
    { value: 'booking_rejected', label: 'Booking Rejected' },
    { value: 'booking_completed', label: 'Booking Completed' },
    { value: 'invoice_created', label: 'Invoice Created' },
    { value: 'invoice_paid', label: 'Invoice Paid' },
    { value: 'invoice_overdue', label: 'Invoice Overdue' },
    { value: 'customer_created', label: 'Customer Created' },
    { value: 'rental_created', label: 'Rental Created' },
    { value: 'system_alert', label: 'System Alert' },
    { value: 'general_info', label: 'General Info' },
  ];

  const selectedUsers = getSelectedUsers();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-600 via-blue-700 to-cyan-600 p-8 shadow-2xl">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white/20 via-transparent to-transparent"></div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="relative z-10">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-white">Notification Center</h1>
              <p className="text-blue-100 mt-2">Create and manage notifications</p>
            </div>
            <button
              onClick={() => { loadData(); loadUsers(); }}
              className="px-4 py-2 rounded-xl bg-white/20 backdrop-blur text-white hover:bg-white/30 transition-all flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <div className="bg-white/10 backdrop-blur rounded-2xl p-4">
              <p className="text-blue-100 text-sm">Total Sent</p>
              <p className="text-2xl font-bold text-white">{notifications.length}</p>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-2xl p-4">
              <p className="text-blue-100 text-sm">Templates</p>
              <p className="text-2xl font-bold text-white">{templates.length}</p>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-2xl p-4">
              <p className="text-blue-100 text-sm">Today's Sent</p>
              <p className="text-2xl font-bold text-white">
                {notifications.filter(n => new Date(n.created_at).toDateString() === new Date().toDateString()).length}
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-2xl p-4">
              <p className="text-blue-100 text-sm">Users</p>
              <p className="text-2xl font-bold text-white">{users.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setActiveTab('create')}
          className={`px-6 py-3 text-sm font-medium transition-all relative ${
            activeTab === 'create'
              ? 'text-blue-600 dark:text-blue-400'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          <div className="flex items-center gap-2">
            <Send className="w-4 h-4" />
            Send Notification
          </div>
          {activeTab === 'create' && (
            <motion.div
              layoutId="adminNotificationTab"
              className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"
            />
          )}
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`px-6 py-3 text-sm font-medium transition-all relative ${
            activeTab === 'history'
              ? 'text-blue-600 dark:text-blue-400'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            History
          </div>
          {activeTab === 'history' && (
            <motion.div
              layoutId="adminNotificationTab"
              className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"
            />
          )}
        </button>
        <button
          onClick={() => setActiveTab('templates')}
          className={`px-6 py-3 text-sm font-medium transition-all relative ${
            activeTab === 'templates'
              ? 'text-blue-600 dark:text-blue-400'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          <div className="flex items-center gap-2">
            <Copy className="w-4 h-4" />
            Templates ({templates.length})
          </div>
          {activeTab === 'templates' && (
            <motion.div
              layoutId="adminNotificationTab"
              className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"
            />
          )}
        </button>
      </div>

      {/* Create Tab */}
      {activeTab === 'create' && (
        <motion.div
          key="create"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden"
        >
          <div className="p-6">
            {/* Send Status */}
            {sendStatus && (
              <div className={`mb-4 p-3 rounded-xl ${sendStatus.failed === 0 ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800' : 'bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800'}`}>
                <p className="text-sm">
                  {sendStatus.success > 0 && `✅ ${sendStatus.success} notification(s) sent successfully`}
                  {sendStatus.failed > 0 && ` ⚠️ ${sendStatus.failed} failed`}
                </p>
              </div>
            )}

            {/* Templates Quick Load */}
            {templates.length > 0 && (
              <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-semibold text-gray-900 dark:text-white">Quick Load Template</span>
                  <button
                    onClick={() => setShowTemplateModal(true)}
                    className="text-xs text-blue-600 hover:text-blue-700"
                  >
                    + New Template
                  </button>
                </div>
                <div className="flex gap-2 flex-wrap">
                  {templates.map((template) => (
                    <button
                      key={template.id}
                      onClick={() => loadTemplate(template)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        selectedTemplate?.id === template.id
                          ? 'bg-blue-600 text-white'
                          : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'
                      }`}
                    >
                      {template.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* User Selection */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Recipient Users
              </label>
              
              <div className="flex flex-wrap gap-2 mb-2">
                {selectedUsers.map((user) => (
                  <span
                    key={user.id}
                    onClick={() => removeUserSelection(user.id)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-lg text-sm cursor-pointer hover:bg-red-100 dark:hover:bg-red-900/30 hover:text-red-600 dark:hover:text-red-400 transition-all group"
                  >
                    <User className="w-3 h-3" />
                    {user.full_name || user.email}
                    <X className="w-3 h-3 ml-1 opacity-50 group-hover:opacity-100" />
                  </span>
                ))}
                
                {form.sendToAll && (
                  <span
                    onClick={() => setForm({ ...form, sendToAll: false })}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 rounded-lg text-sm cursor-pointer hover:bg-red-100 dark:hover:bg-red-900/30 hover:text-red-600 dark:hover:text-red-400 transition-all group"
                  >
                    <Users className="w-3 h-3" />
                    All Users
                    <X className="w-3 h-3 ml-1 opacity-50 group-hover:opacity-100" />
                  </span>
                )}
                
                {selectedUsers.length === 0 && !form.sendToAll && (
                  <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 rounded-lg text-sm">
                    <User className="w-3 h-3" />
                    Sending to yourself (no users selected)
                  </span>
                )}
              </div>

              <div className="flex gap-2 flex-wrap">
                {/* User Dropdown */}
                <div className="relative flex-1 min-w-[200px]">
                  <button
                    type="button"
                    onClick={() => setShowUserDropdown(!showUserDropdown)}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white flex items-center justify-between hover:border-blue-500 transition-all"
                    disabled={loadingUsers || form.sendToAll}
                  >
                    <span className="flex items-center gap-2">
                      <User className="w-4 h-4 text-gray-400" />
                      {loadingUsers ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <span>Select users...</span>
                      )}
                    </span>
                    {showUserDropdown ? (
                      <ChevronUp className="w-4 h-4 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    )}
                  </button>

                  {showUserDropdown && !form.sendToAll && (
                    <div className="absolute z-50 mt-1 w-full bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-2xl max-h-60 overflow-y-auto">
                      {users.length === 0 ? (
                        <div className="p-4 text-center text-gray-500 text-sm">
                          {loadingUsers ? 'Loading users...' : 'No users found. Add manually below.'}
                        </div>
                      ) : (
                        users.map((user) => (
                          <button
                            key={user.id}
                            type="button"
                            onClick={() => toggleUserSelection(user.id)}
                            className={`w-full px-4 py-2.5 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center justify-between ${
                              selectedUserIds.includes(user.id) ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                            }`}
                          >
                            <div className="flex flex-col">
                              <span className="text-sm font-medium text-gray-900 dark:text-white">
                                {user.full_name || 'Unknown'}
                              </span>
                              <span className="text-xs text-gray-500 dark:text-gray-400">{user.email}</span>
                            </div>
                            {selectedUserIds.includes(user.id) && (
                              <CheckCircle className="w-4 h-4 text-blue-600" />
                            )}
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>

                {/* Manual Email Input */}
                <div className="flex gap-2">
                  {showManualInput ? (
                    <>
                      <input
                        type="email"
                        value={manualEmail}
                        onChange={(e) => setManualEmail(e.target.value)}
                        placeholder="Enter email..."
                        className="px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 w-48"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            addManualUser();
                          }
                          if (e.key === 'Escape') {
                            setShowManualInput(false);
                            setManualEmail('');
                          }
                        }}
                      />
                      <button
                        type="button"
                        onClick={addManualUser}
                        className="px-4 py-2.5 rounded-xl bg-green-600 text-white hover:bg-green-700 transition-all"
                      >
                        Add
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowManualInput(false);
                          setManualEmail('');
                        }}
                        className="px-4 py-2.5 rounded-xl bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 transition-all"
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setShowManualInput(true)}
                      className="px-4 py-2.5 rounded-xl border border-dashed border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:border-blue-500 hover:text-blue-500 transition-all flex items-center gap-2"
                    >
                      <UserPlus className="w-4 h-4" />
                      Add Email
                    </button>
                  )}
                </div>

                {/* All Users Toggle */}
                <label className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm whitespace-nowrap cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-all">
                  <input
                    type="checkbox"
                    checked={form.sendToAll}
                    onChange={(e) => {
                      setForm({ ...form, sendToAll: e.target.checked, userId: '' });
                      if (e.target.checked) {
                        setSelectedUserIds([]);
                        setShowUserDropdown(false);
                      }
                    }}
                    className="w-4 h-4 text-blue-600"
                  />
                  <Users className="w-4 h-4" />
                  All Users
                </label>
              </div>

              <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                {loadingUsers ? (
                  'Loading users...'
                ) : form.sendToAll ? (
                  `Sending to all ${users.length} users`
                ) : selectedUserIds.length > 0 ? (
                  `${selectedUserIds.length} user(s) selected`
                ) : (
                  `Sending to yourself (${currentUser?.email || 'admin'})`
                )}
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Notification Type
                  </label>
                  <select
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value })}
                    className="w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  >
                    {notificationTypes.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Priority
                  </label>
                  <select
                    value={form.priority}
                    onChange={(e) => setForm({ ...form, priority: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  >
                    <option value={0}>Normal</option>
                    <option value={1}>High</option>
                    <option value={2}>Urgent</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Title *
                </label>
                <input
                  type="text"
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="Notification title"
                  className="w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Body
                </label>
                <textarea
                  rows={4}
                  value={form.body}
                  onChange={(e) => setForm({ ...form, body: e.target.value })}
                  placeholder="Notification message"
                  className="w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Link (optional)
                </label>
                <input
                  type="text"
                  value={form.link}
                  onChange={(e) => setForm({ ...form, link: e.target.value })}
                  placeholder="/dashboard or https://example.com"
                  className="w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    <span className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Schedule (optional)
                    </span>
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="date"
                      value={form.scheduleDate}
                      onChange={(e) => setForm({ ...form, scheduleDate: e.target.value })}
                      className="flex-1 px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                      type="time"
                      value={form.scheduleTime}
                      onChange={(e) => setForm({ ...form, scheduleTime: e.target.value })}
                      className="flex-1 px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                    />
                    <label className="flex items-center gap-1 text-sm whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={form.isScheduled}
                        onChange={(e) => setForm({ ...form, isScheduled: e.target.checked })}
                        className="w-4 h-4 text-blue-600"
                      />
                      Schedule
                    </label>
                  </div>
                </div>

                <div>
                  <div className="p-4 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
                    <div className="flex items-center justify-between mb-3">
                      <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={form.sendEmail}
                          onChange={(e) => setForm({ ...form, sendEmail: e.target.checked })}
                          className="w-4 h-4 text-blue-600"
                        />
                        <Mail className="w-4 h-4 text-blue-600" />
                        Send via Email
                      </label>
                      {form.sendEmail && (
                        <span className="text-xs text-green-600 dark:text-green-400">
                          <MailCheck className="w-4 h-4 inline" /> Email will be sent
                        </span>
                      )}
                    </div>
                    
                    {form.sendEmail && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="space-y-3"
                      >
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                            Email Subject
                          </label>
                          <input
                            type="text"
                            value={form.emailSubject}
                            onChange={(e) => setForm({ ...form, emailSubject: e.target.value })}
                            placeholder="Email subject line"
                            className="w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          <p>💡 If no subject is provided, the notification title will be used.</p>
                          <p>📧 Users will receive both in-app notification and email.</p>
                        </div>
                      </motion.div>
                    )}
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={sending || loadingUsers}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-semibold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {sending ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    {form.isScheduled ? 'Scheduling...' : 'Sending...'}
                  </>
                ) : (
                  <>
                    <SendHorizonal className="w-5 h-5" />
                    {form.isScheduled ? 'Schedule Notification' : 'Send Notification'}
                    {form.sendEmail && <MailPlus className="w-4 h-4 ml-1" />}
                  </>
                )}
              </button>
            </form>
          </div>
        </motion.div>
      )}

      {/* History Tab */}
      {activeTab === 'history' && (
        <motion.div
          key="history"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden"
        >
          <div className="p-6">
            <div className="flex flex-wrap gap-3 items-center justify-between mb-6">
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => setFilterType('all')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    filterType === 'all'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200'
                  }`}
                >
                  All
                </button>
                {notificationTypes.slice(0, 6).map((type) => (
                  <button
                    key={type.value}
                    onClick={() => setFilterType(type.value)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      filterType === type.value
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200'
                    }`}
                  >
                    {type.label}
                  </button>
                ))}
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search notifications..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 w-64"
                />
              </div>
            </div>

            {notifications.length === 0 ? (
              <div className="text-center py-16">
                <Bell className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400 text-lg">No notifications sent yet</p>
                <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">Create your first notification using the Send tab</p>
              </div>
            ) : (
              <div className="space-y-3">
                {notifications
                  .filter(n => {
                    const matchesSearch = n.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                        n.body?.toLowerCase().includes(searchTerm.toLowerCase());
                    const matchesFilter = filterType === 'all' || n.type === filterType;
                    return matchesSearch && matchesFilter;
                  })
                  .map((notification) => (
                    <motion.div
                      key={notification.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-start justify-between p-4 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-all group"
                    >
                      <div className="flex items-start gap-4 flex-1 min-w-0">
                        <div className={`px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap ${getTypeColor(notification.type)}`}>
                          {getTypeLabel(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 dark:text-white">{notification.title}</p>
                          {notification.body && (
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">{notification.body}</p>
                          )}
                          <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-gray-400">
                            <span className="flex items-center gap-1">
                              <User className="w-3 h-3" />
                              {notification.user_id?.slice(0, 8)}...
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {new Date(notification.created_at).toLocaleString()}
                            </span>
                            {notification.metadata?.scheduled && (
                              <span className="text-yellow-500 flex items-center gap-1">
                                <Calendar className="w-3 h-3" /> Scheduled
                              </span>
                            )}
                            {notification.metadata?.sent_via_email && (
                              <span className="text-blue-500 flex items-center gap-1">
                                <Mail className="w-3 h-3" /> Email
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => deleteNotification(notification.id)}
                        className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-400 hover:text-red-600 transition-all opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </motion.div>
                  ))}
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Templates Tab */}
      {activeTab === 'templates' && (
        <motion.div
          key="templates"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden"
        >
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Templates</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Create and manage notification templates</p>
              </div>
              <button
                onClick={() => setShowTemplateModal(true)}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-semibold hover:shadow-lg transition-all flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                New Template
              </button>
            </div>

            {templates.length === 0 ? (
              <div className="text-center py-16">
                <Copy className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400 text-lg">No templates yet</p>
                <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">Create your first template for quick notifications</p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {templates.map((template) => (
                  <motion.div
                    key={template.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all group"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-semibold text-gray-900 dark:text-white">{template.name}</h4>
                        <span className={`inline-block px-2 py-0.5 rounded-lg text-xs font-medium mt-1 ${getTypeColor(template.type)}`}>
                          {getTypeLabel(template.type)}
                        </span>
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => loadTemplate(template)}
                          className="p-2 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-500 hover:text-blue-700 transition-colors"
                          title="Load template"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deleteTemplate(template.id)}
                          className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 hover:text-red-700 transition-colors"
                          title="Delete template"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 line-clamp-2">{template.body || 'No body content'}</p>
                    <p className="text-xs text-gray-400 mt-2">
                      Created: {new Date(template.created_at).toLocaleDateString()}
                    </p>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Template Modal */}
      <AnimatePresence>
        {showTemplateModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 overflow-y-auto"
          >
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowTemplateModal(false)}></div>
            <div className="relative min-h-screen flex items-center justify-center p-4">
              <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 50 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 50 }}
                className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-lg w-full"
              >
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">Save Template</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Create a reusable notification template</p>
                </div>
                <div className="p-6 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      Template Name *
                    </label>
                    <input
                      type="text"
                      value={templateForm.name}
                      onChange={(e) => setTemplateForm({ ...templateForm, name: e.target.value })}
                      placeholder="e.g., Welcome Email"
                      className="w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      Type
                    </label>
                    <select
                      value={templateForm.type}
                      onChange={(e) => setTemplateForm({ ...templateForm, type: e.target.value })}
                      className="w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                    >
                      {notificationTypes.map((type) => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      Title *
                    </label>
                    <input
                      type="text"
                      value={templateForm.title}
                      onChange={(e) => setTemplateForm({ ...templateForm, title: e.target.value })}
                      placeholder="Template title"
                      className="w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      Body
                    </label>
                    <textarea
                      rows={3}
                      value={templateForm.body}
                      onChange={(e) => setTemplateForm({ ...templateForm, body: e.target.value })}
                      placeholder="Template message"
                      className="w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex gap-3">
                  <button
                    onClick={handleSaveTemplate}
                    className="flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-semibold hover:shadow-lg transition-all"
                  >
                    Save Template
                  </button>
                  <button
                    onClick={() => setShowTemplateModal(false)}
                    className="flex-1 px-4 py-2.5 rounded-xl bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 transition-colors"
                  >
                    Cancel
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