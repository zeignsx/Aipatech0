import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { 
  Printer, Download, ArrowLeft, FileText, FileSpreadsheet, 
  Send, Edit, Trash2, CheckCircle, Clock, AlertCircle,
  Mail, Phone, MapPin, Building2, User, Calendar, DollarSign
} from "lucide-react";
import { invoiceService } from "@/lib/invoice-service";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/invoices/$id")({
  component: InvoiceDetailPage,
});

function InvoiceDetailPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState<any>(null);
  const [customer, setCustomer] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadInvoice();
  }, [id]);

  const loadInvoice = async () => {
    setLoading(true);
    try {
      const { data: inv } = await supabase
        .from("invoices")
        .select("*")
        .eq("id", id)
        .single();
      
      if (inv) {
        setInvoice(inv);
        
        if (inv.customer_id) {
          const { data: cust } = await supabase
            .from("customers")
            .select("*")
            .eq("id", inv.customer_id)
            .single();
          setCustomer(cust);
        }
        
        const { data: its } = await supabase
          .from("invoice_items")
          .select("*")
          .eq("invoice_id", id)
          .order("position");
        setItems(its || []);
      }
    } catch (error) {
      console.error("Error loading invoice:", error);
      toast.error("Failed to load invoice");
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    const printContent = printRef.current;
    if (!printContent) return;
    
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Invoice ${invoice?.invoice_number}</title>
          <style>
            body { font-family: 'Segoe UI', Arial, sans-serif; margin: 0; padding: 40px; background: white; }
            .invoice-container { max-width: 1000px; margin: 0 auto; background: white; }
            .invoice-header { background: linear-gradient(135deg, #1e3a5f 0%, #0d2b4a 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .company-info { padding: 20px; border-bottom: 2px solid #e0e0e0; }
            .bill-to { background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 20px 0; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            th { background: #1e3a5f; color: white; padding: 12px; text-align: left; }
            td { padding: 10px; border-bottom: 1px solid #ddd; }
            .totals { text-align: right; margin-top: 20px; padding-top: 20px; border-top: 2px solid #e0e0e0; }
            .grand-total { font-size: 20px; font-weight: bold; color: #2d6a4f; }
            @media print { body { padding: 0; } .no-print { display: none; } }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
        </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const handleExportPDF = async () => {
    if (!invoice || !customer) return;
    
    const invoiceData = {
      id: invoice.id,
      invoice_number: invoice.invoice_number,
      issue_date: invoice.issue_date,
      due_date: invoice.due_date,
      status: invoice.status,
      currency: invoice.currency,
      subtotal: invoice.subtotal,
      tax_rate: invoice.tax_rate,
      tax_amount: invoice.tax_amount,
      total: invoice.total,
      notes: invoice.notes,
      customer: {
        name: customer.name,
        company: customer.company,
        email: customer.email,
        phone: customer.phone,
        address: customer.address,
      },
      items: items.map(item => ({
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unit_price,
        amount: item.amount
      })),
      company: {
        name: 'AIPATECH Energy Limited',
        email: 'info@aipatechenergy.com',
        phone: '+234 800 000 0000',
        address: 'Abuja & Port Harcourt, Nigeria',
      }
    };
    
    await invoiceService.exportToPDF(invoiceData);
    toast.success("PDF downloaded!");
  };

  const handleExportExcel = async () => {
    if (!invoice || !customer) return;
    
    const invoiceData = [{
      id: invoice.id,
      invoice_number: invoice.invoice_number,
      issue_date: invoice.issue_date,
      due_date: invoice.due_date,
      status: invoice.status,
      currency: invoice.currency,
      subtotal: invoice.subtotal,
      tax_rate: invoice.tax_rate,
      tax_amount: invoice.tax_amount,
      total: invoice.total,
      notes: invoice.notes,
      customer_name: customer.name,
      customer_company: customer.company,
      customer_email: customer.email,
      customer_phone: customer.phone,
      items: items.map(i => `${i.description} (${i.quantity} x ${i.unit_price})`).join(', ')
    }];
    
    await invoiceService.exportToExcel(invoiceData);
    toast.success("Excel downloaded!");
  };

  const updateStatus = async (newStatus: string) => {
    const { error } = await supabase
      .from("invoices")
      .update({ status: newStatus })
      .eq("id", id);
    
    if (error) {
      toast.error("Failed to update status");
    } else {
      toast.success(`Invoice marked as ${newStatus}`);
      loadInvoice();
    }
  };

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

  if (!invoice) {
    return (
      <div className="text-center py-16">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Invoice not found</h2>
        <button onClick={() => navigate({ to: "/admin/invoices" })} className="mt-4 text-blue-600 hover:underline">
          Back to Invoices
        </button>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'paid': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'sent': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      case 'overdue': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  return (
    <div className="space-y-6">
      {/* Action Buttons */}
      <div className="flex flex-wrap justify-between items-center gap-4">
        <button
          onClick={() => navigate({ to: "/admin/invoices" })}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Invoices
        </button>
        
        <div className="flex gap-3 flex-wrap">
          <select
            value={invoice.status}
            onChange={(e) => updateStatus(e.target.value)}
            className="px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="draft">Draft</option>
            <option value="sent">Sent</option>
            <option value="paid">Paid</option>
            <option value="overdue">Overdue</option>
            <option value="cancelled">Cancelled</option>
          </select>
          
          <button
            onClick={handleExportPDF}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-red-500 to-rose-500 text-white font-semibold shadow-lg hover:shadow-xl transition-all"
          >
            <FileText className="w-4 h-4" /> PDF
          </button>
          
          <button
            onClick={handleExportExcel}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold shadow-lg hover:shadow-xl transition-all"
          >
            <FileSpreadsheet className="w-4 h-4" /> Excel
          </button>
          
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-colors"
          >
            <Printer className="w-4 h-4" /> Print
          </button>
        </div>
      </div>

      {/* Invoice Content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        ref={printRef}
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-8">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold">INVOICE</h1>
              <p className="text-blue-200 mt-1">{invoice.invoice_number}</p>
            </div>
            <div className="text-right">
              <div className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(invoice.status)}`}>
                {invoice.status === 'paid' && <CheckCircle className="w-4 h-4" />}
                {invoice.status === 'overdue' && <AlertCircle className="w-4 h-4" />}
                {invoice.status === 'sent' && <Send className="w-4 h-4" />}
                {invoice.status === 'draft' && <FileText className="w-4 h-4" />}
                {invoice.status.toUpperCase()}
              </div>
              <p className="text-sm text-blue-200 mt-2">Issue Date: {invoice.issue_date}</p>
              {invoice.due_date && <p className="text-sm text-blue-200">Due Date: {invoice.due_date}</p>}
            </div>
          </div>
        </div>

        {/* Company & Customer Info */}
        <div className="p-8 border-b border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-2">FROM</h3>
              <p className="font-bold text-gray-900 dark:text-white">AIPATECH Energy Limited</p>
              <p className="text-gray-600 dark:text-gray-400">Abuja & Port Harcourt, Nigeria</p>
              <p className="text-gray-600 dark:text-gray-400">info@aipatechenergy.com</p>
              <p className="text-gray-600 dark:text-gray-400">+234 800 000 0000</p>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-2">BILL TO</h3>
              <p className="font-bold text-gray-900 dark:text-white">{customer?.name || 'N/A'}</p>
              {customer?.company && <p className="text-gray-600 dark:text-gray-400">{customer.company}</p>}
              <p className="text-gray-600 dark:text-gray-400">{customer?.email}</p>
              {customer?.phone && <p className="text-gray-600 dark:text-gray-400">{customer.phone}</p>}
              {customer?.address && <p className="text-gray-600 dark:text-gray-400">{customer.address}</p>}
            </div>
          </div>
        </div>

        {/* Items Table */}
        <div className="p-8">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="pb-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Description</th>
                <th className="pb-3 text-right text-sm font-semibold text-gray-700 dark:text-gray-300">Quantity</th>
                <th className="pb-3 text-right text-sm font-semibold text-gray-700 dark:text-gray-300">Unit Price</th>
                <th className="pb-3 text-right text-sm font-semibold text-gray-700 dark:text-gray-300">Amount</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, idx) => (
                <tr key={idx} className="border-b border-gray-100 dark:border-gray-800">
                  <td className="py-3 text-gray-900 dark:text-white">{item.description}</td>
                  <td className="py-3 text-right text-gray-600 dark:text-gray-400">{item.quantity}</td>
                  <td className="py-3 text-right text-gray-600 dark:text-gray-400">
                    {invoice.currency} {Number(item.unit_price).toLocaleString()}
                  </td>
                  <td className="py-3 text-right font-semibold text-gray-900 dark:text-white">
                    {invoice.currency} {Number(item.amount).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totals */}
          <div className="mt-6 flex justify-end">
            <div className="w-80 space-y-2">
              <div className="flex justify-between text-gray-600 dark:text-gray-400">
                <span>Subtotal:</span>
                <span>{invoice.currency} {Number(invoice.subtotal).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-gray-600 dark:text-gray-400">
                <span>Tax ({invoice.tax_rate}%):</span>
                <span>{invoice.currency} {Number(invoice.tax_amount).toLocaleString()}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
                <span className="text-lg font-bold text-gray-900 dark:text-white">Total:</span>
                <span className="text-xl font-bold text-green-600 dark:text-green-400">
                  {invoice.currency} {Number(invoice.total).toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Notes */}
          {invoice.notes && (
            <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
              <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Notes:</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">{invoice.notes}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 dark:bg-gray-700/50 px-8 py-4 text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">Thank you for your business!</p>
          <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">AIPATECH Energy Limited - Excellence • Innovation • Integrity</p>
        </div>
      </motion.div>
    </div>
  );
}