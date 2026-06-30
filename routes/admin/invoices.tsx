import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { 
  Plus, Eye, FileText, FileSpreadsheet, FileCode, 
  Trash2, Edit, Search, Calendar, DollarSign, 
  TrendingUp, CheckCircle, XCircle, Clock,
  AlertCircle, Printer, Download, Filter, ArrowUpDown,
  ChevronLeft, ChevronRight, MoreVertical, Send, Mail
} from "lucide-react";
import { toast } from "sonner";
import { invoiceService } from "@/lib/invoice-service";
import { InvoiceModal } from "@/components/InvoiceModal";

export const Route = createFileRoute("/admin/invoices")({
  component: AdminInvoices,
});

function AdminInvoices() {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState<any[]>([]);
  const [filteredInvoices, setFilteredInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedInvoices, setSelectedInvoices] = useState<string[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [sortField, setSortField] = useState('created_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    loadInvoices();
  }, []);

  useEffect(() => {
    filterAndSortInvoices();
  }, [searchTerm, statusFilter, invoices, sortField, sortDirection]);

  const loadInvoices = async () => {
    const { data } = await supabase
      .from("invoices")
      .select("*, customer:customers(name, company, email)")
      .order("created_at", { ascending: false });
    setInvoices(data || []);
    setFilteredInvoices(data || []);
    setLoading(false);
  };

  const filterAndSortInvoices = () => {
    let filtered = [...invoices];
    
    if (statusFilter !== "all") {
      filtered = filtered.filter(inv => inv.status === statusFilter);
    }
    
    if (searchTerm) {
      filtered = filtered.filter(inv => 
        inv.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inv.customer?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inv.customer?.company?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Sort
    filtered.sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];
      
      if (sortField === 'total') {
        aVal = Number(a.total);
        bVal = Number(b.total);
      }
      
      if (sortDirection === 'asc') {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });
    
    setFilteredInvoices(filtered);
    setCurrentPage(1);
  };

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const deleteInvoice = async (id: string) => {
    if (confirm("Are you sure you want to delete this invoice?")) {
      const { error } = await supabase.from("invoices").delete().eq("id", id);
      if (error) {
        toast.error("Failed to delete invoice");
      } else {
        toast.success("Invoice deleted");
        loadInvoices();
      }
    }
  };

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("invoices").update({ status }).eq("id", id);
    if (error) {
      toast.error("Failed to update status");
    } else {
      toast.success(`Invoice marked as ${status}`);
      loadInvoices();
    }
  };

  const sendInvoiceEmail = async (invoice: any) => {
    if (!invoice.customer?.email) {
      toast.error("Customer email not found");
      return;
    }
    
    toast.loading("Sending email...");
    
    // Simulate email send - implement actual email service
    setTimeout(() => {
      toast.dismiss();
      toast.success(`Invoice sent to ${invoice.customer.email}`);
    }, 1500);
  };

  const exportSelected = async (format: 'pdf' | 'excel' | 'csv') => {
    const selectedData = invoices.filter(inv => selectedInvoices.includes(inv.id));
    
    if (selectedData.length === 0) {
      toast.error("Please select invoices to export");
      return;
    }
    
    const formattedData = selectedData.map(inv => ({
      id: inv.id,
      invoice_number: inv.invoice_number,
      issue_date: inv.issue_date,
      due_date: inv.due_date,
      status: inv.status,
      currency: inv.currency,
      subtotal: inv.subtotal,
      tax_rate: inv.tax_rate,
      tax_amount: inv.tax_amount,
      total: inv.total,
      notes: inv.notes,
      customer: {
        name: inv.customer?.name || 'N/A',
        company: inv.customer?.company || '',
        email: inv.customer?.email || '',
        phone: '',
        address: '',
      },
      items: [],
      company: {
        name: 'AIPATECH Energy Limited',
        email: 'info@aipatechenergy.com',
        phone: '+234 800 000 0000',
        address: 'Abuja & Port Harcourt, Nigeria',
      }
    }));
    
    if (format === 'pdf' && selectedData.length === 1) {
      await invoiceService.exportToPDF(formattedData[0]);
    } else if (format === 'excel') {
      await invoiceService.exportToExcel(formattedData);
    } else if (format === 'csv') {
      await invoiceService.exportToCSV(formattedData);
    }
    
    toast.success(`Exported ${selectedData.length} invoices`);
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, { bg: string; text: string; icon: any }> = {
      paid: { bg: "bg-emerald-500/20", text: "text-emerald-400", icon: CheckCircle },
      sent: { bg: "bg-blue-500/20", text: "text-blue-400", icon: Send },
      draft: { bg: "bg-gray-500/20", text: "text-gray-400", icon: FileText },
      overdue: { bg: "bg-red-500/20", text: "text-red-400", icon: AlertCircle },
      cancelled: { bg: "bg-orange-500/20", text: "text-orange-400", icon: XCircle },
    };
    const style = styles[status] || styles.draft;
    const Icon = style.icon;
    return { ...style, Icon };
  };

  const stats = {
    total: invoices.reduce((sum, inv) => sum + Number(inv.total || 0), 0),
    paid: invoices.filter(i => i.status === 'paid').reduce((sum, inv) => sum + Number(inv.total || 0), 0),
    pending: invoices.filter(i => i.status === 'sent').reduce((sum, inv) => sum + Number(inv.total || 0), 0),
    overdue: invoices.filter(i => i.status === 'overdue').reduce((sum, inv) => sum + Number(inv.total || 0), 0),
    count: invoices.length,
    paidCount: invoices.filter(i => i.status === 'paid').length,
  };

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredInvoices.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredInvoices.length / itemsPerPage);

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
      {/* Header Section with Stats */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-600 via-blue-700 to-cyan-600 p-8 shadow-2xl">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white/20 via-transparent to-transparent"></div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="relative z-10">
          <div className="flex justify-between items-start">
            <div>
              <motion.h1 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-3xl font-bold text-white"
              >
                Invoice Management
              </motion.h1>
              <motion.p 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="text-blue-100 mt-2"
              >
                Create, manage, and track all your invoices
              </motion.p>
            </div>
            <motion.button
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowModal(true)}
              className="px-6 py-3 rounded-xl bg-white/20 backdrop-blur text-white font-semibold hover:bg-white/30 transition-all flex items-center gap-2 shadow-lg"
            >
              <Plus className="w-5 h-5" />
              New Invoice
            </motion.button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white/10 backdrop-blur rounded-2xl p-4"
            >
              <p className="text-blue-100 text-sm">Total Revenue</p>
              <p className="text-2xl font-bold text-white">${stats.total.toLocaleString()}</p>
              <p className="text-xs text-blue-200 mt-1">{stats.count} invoices</p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white/10 backdrop-blur rounded-2xl p-4"
            >
              <p className="text-blue-100 text-sm">Paid</p>
              <p className="text-2xl font-bold text-green-300">${stats.paid.toLocaleString()}</p>
              <p className="text-xs text-blue-200 mt-1">{stats.paidCount} invoices</p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-white/10 backdrop-blur rounded-2xl p-4"
            >
              <p className="text-blue-100 text-sm">Pending</p>
              <p className="text-2xl font-bold text-yellow-300">${stats.pending.toLocaleString()}</p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-white/10 backdrop-blur rounded-2xl p-4"
            >
              <p className="text-blue-100 text-sm">Overdue</p>
              <p className="text-2xl font-bold text-red-300">${stats.overdue.toLocaleString()}</p>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Filters and Actions */}
      <div className="flex flex-wrap gap-4 items-center justify-between">
        <div className="flex gap-2 flex-wrap">
          {["all", "paid", "sent", "draft", "overdue", "cancelled"].map((status) => {
            const isActive = statusFilter === status;
            return (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-4 py-2 rounded-xl capitalize transition-all ${
                  isActive
                    ? "bg-blue-600 text-white shadow-md"
                    : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                }`}
              >
                {status}
                {status !== "all" && (
                  <span className="ml-1 px-1.5 py-0.5 text-xs rounded-full bg-white/20">
                    {invoices.filter(i => i.status === status).length}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className="flex gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search invoices..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
            />
          </div>
          
          {selectedInvoices.length > 0 && (
            <div className="flex gap-2 animate-fadeIn">
              <button
                onClick={() => exportSelected('pdf')}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-red-500 to-rose-500 text-white font-semibold shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
              >
                <FileText className="w-4 h-4" /> PDF
              </button>
              <button
                onClick={() => exportSelected('excel')}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
              >
                <FileSpreadsheet className="w-4 h-4" /> Excel
              </button>
              <button
                onClick={() => exportSelected('csv')}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
              >
                <FileCode className="w-4 h-4" /> CSV
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Invoices Table */}
      <div className="rounded-2xl bg-white dark:bg-gray-800 shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="px-6 py-4 text-left">
                  <input
                    type="checkbox"
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedInvoices(filteredInvoices.map(i => i.id));
                      } else {
                        setSelectedInvoices([]);
                      }
                    }}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300 cursor-pointer hover:text-blue-600" onClick={() => handleSort('invoice_number')}>
                  <div className="flex items-center gap-1">
                    Invoice #
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300 cursor-pointer hover:text-blue-600" onClick={() => handleSort('customer')}>
                  Customer
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300 cursor-pointer hover:text-blue-600" onClick={() => handleSort('issue_date')}>
                  <div className="flex items-center gap-1">
                    Date
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300 cursor-pointer hover:text-blue-600" onClick={() => handleSort('due_date')}>
                  Due Date
                </th>
                <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700 dark:text-gray-300 cursor-pointer hover:text-blue-600" onClick={() => handleSort('total')}>
                  <div className="flex items-center justify-end gap-1">
                    Amount
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Status</th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700 dark:text-gray-300">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              <AnimatePresence>
                {currentItems.map((inv, index) => {
                  const statusStyle = getStatusBadge(inv.status);
                  const StatusIcon = statusStyle.Icon;
                  return (
                    <motion.tr
                      key={inv.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.03 }}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors group"
                    >
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          checked={selectedInvoices.includes(inv.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedInvoices([...selectedInvoices, inv.id]);
                            } else {
                              setSelectedInvoices(selectedInvoices.filter(id => id !== inv.id));
                            }
                          }}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => navigate({ to: `/admin/invoices/${inv.id}` })}
                          className="font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                        >
                          {inv.invoice_number}
                        </button>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">{inv.customer?.name || 'N/A'}</p>
                          {inv.customer?.company && (
                            <p className="text-xs text-gray-500">{inv.customer.company}</p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-600 dark:text-gray-400">{inv.issue_date}</td>
                      <td className="px-6 py-4">
                        <span className={`${new Date(inv.due_date) < new Date() && inv.status !== 'paid' ? 'text-red-500 font-semibold' : 'text-gray-600 dark:text-gray-400'}`}>
                          {inv.due_date || '—'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="font-bold text-gray-900 dark:text-white">
                          {inv.currency} {Number(inv.total).toLocaleString()}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${statusStyle.bg} ${statusStyle.text}`}>
                          <StatusIcon className="w-3 h-3" />
                          {inv.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => navigate({ to: `/admin/invoices/${inv.id}` })}
                            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors group-hover:scale-110 transition-transform"
                            title="View Invoice"
                          >
                            <Eye className="w-4 h-4 text-blue-500" />
                          </button>
                          <button
                            onClick={() => sendInvoiceEmail(inv)}
                            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                            title="Send Email"
                          >
                            <Mail className="w-4 h-4 text-green-500" />
                          </button>
                          <button
                            onClick={() => updateStatus(inv.id, inv.status === 'paid' ? 'sent' : 'paid')}
                            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                            title="Change Status"
                          >
                            <Edit className="w-4 h-4 text-yellow-500" />
                          </button>
                          <button
                            onClick={() => deleteInvoice(inv.id)}
                            className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                            title="Delete Invoice"
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
        
        {filteredInvoices.length === 0 && (
          <div className="text-center py-16">
            <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">No invoices found</h3>
            <p className="text-gray-500 dark:text-gray-400 mt-1">Create your first invoice to get started</p>
            <button
              onClick={() => setShowModal(true)}
              className="mt-4 px-6 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-colors"
            >
              Create Invoice
            </button>
          </div>
        )}

        {/* Pagination */}
        {filteredInvoices.length > 0 && (
          <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center">
            <p className="text-sm text-gray-500">
              Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredInvoices.length)} of {filteredInvoices.length} invoices
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 disabled:opacity-50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <div className="flex gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-3 py-1 rounded-lg transition-colors ${
                      currentPage === page
                        ? 'bg-blue-600 text-white'
                        : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    {page}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 disabled:opacity-50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Invoice Modal */}
      <InvoiceModal 
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSuccess={(invoiceId) => {
          loadInvoices();
          setShowModal(false);
          if (invoiceId) {
            navigate({ to: `/admin/invoices/${invoiceId}` });
          }
        }}
      />
    </div>
  );
}