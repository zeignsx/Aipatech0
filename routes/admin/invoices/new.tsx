import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Trash2, Save, X, UserPlus, Calculator, FileText, Send } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/invoices/new")({
  component: NewInvoice,
});

function NewInvoice() {
  const nav = useNavigate();
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    customer_id: "",
    invoice_number: `INV-${Date.now().toString().slice(-6)}`,
    issue_date: new Date().toISOString().split('T')[0],
    due_date: "",
    currency: "USD",
    tax_rate: 7.5,
    notes: "Thank you for your business.",
    items: [{ description: "", quantity: 1, unit_price: 0 }]
  });

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    const { data } = await supabase.from("customers").select("*").order("name");
    setCustomers(data || []);
  };

  const addItem = () => {
    setForm({
      ...form,
      items: [...form.items, { description: "", quantity: 1, unit_price: 0 }]
    });
  };

  const removeItem = (index: number) => {
    setForm({
      ...form,
      items: form.items.filter((_, i) => i !== index)
    });
  };

  const updateItem = (index: number, field: string, value: any) => {
    const newItems = [...form.items];
    newItems[index] = { ...newItems[index], [field]: value };
    if (field === 'quantity' || field === 'unit_price') {
      newItems[index].amount = newItems[index].quantity * newItems[index].unit_price;
    }
    setForm({ ...form, items: newItems });
  };

  const subtotal = form.items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
  const taxAmount = subtotal * (form.tax_rate / 100);
  const total = subtotal + taxAmount;

  const saveInvoice = async () => {
    if (!form.customer_id) {
      toast.error("Please select a customer");
      return;
    }
    if (form.items.some(item => !item.description)) {
      toast.error("Please add descriptions for all items");
      return;
    }

    setLoading(true);
    try {
      const { data: user } = await supabase.auth.getUser();
      
      const { data: invoice, error } = await supabase.from("invoices").insert({
        owner_id: user.user?.id,
        customer_id: form.customer_id,
        invoice_number: form.invoice_number,
        issue_date: form.issue_date,
        due_date: form.due_date || null,
        currency: form.currency,
        tax_rate: form.tax_rate,
        subtotal: subtotal,
        tax_amount: taxAmount,
        total: total,
        notes: form.notes,
        status: 'draft'
      }).select().single();

      if (error) throw error;

      const itemsData = form.items.map((item, idx) => ({
        invoice_id: invoice.id,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unit_price,
        amount: item.quantity * item.unit_price,
        position: idx
      }));

      const { error: itemsError } = await supabase.from("invoice_items").insert(itemsData);
      if (itemsError) throw itemsError;

      toast.success("Invoice created successfully!");
      nav({ to: "/admin/invoices" });
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-800/50 via-slate-800/30 to-slate-800/50 backdrop-blur-md border border-white/10 p-8 shadow-2xl">
        <div className="absolute inset-0 bg-gradient-hero opacity-10"></div>
        <div className="relative z-10">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent">
            New Invoice
          </h1>
          <p className="text-white/60 mt-2">Create a professional invoice for your customer</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer Section */}
          <div className="rounded-2xl bg-gradient-to-br from-slate-800/50 to-slate-800/30 backdrop-blur-md border border-white/10 p-6 shadow-xl">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-emerald-400" />
              Customer Information
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-white/70 mb-2">Select Customer *</label>
                <select
                  value={form.customer_id}
                  onChange={(e) => setForm({ ...form, customer_id: e.target.value })}
                  className="w-full px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                  <option value="">Select a customer</option>
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>{c.name} {c.company ? `(${c.company})` : ''}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-white/70 mb-2">Invoice Number</label>
                <input
                  type="text"
                  value={form.invoice_number}
                  onChange={(e) => setForm({ ...form, invoice_number: e.target.value })}
                  className="w-full px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white/70 mb-2">Issue Date</label>
                <input
                  type="date"
                  value={form.issue_date}
                  onChange={(e) => setForm({ ...form, issue_date: e.target.value })}
                  className="w-full px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white/70 mb-2">Due Date</label>
                <input
                  type="date"
                  value={form.due_date}
                  onChange={(e) => setForm({ ...form, due_date: e.target.value })}
                  className="w-full px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
            </div>
          </div>

          {/* Items Section */}
          <div className="rounded-2xl bg-gradient-to-br from-slate-800/50 to-slate-800/30 backdrop-blur-md border border-white/10 p-6 shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-emerald-400" />
                Invoice Items
              </h2>
              <button
                onClick={addItem}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-sm font-semibold shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
              >
                <Plus className="w-4 h-4" /> Add Item
              </button>
            </div>
            
            <div className="space-y-3">
              {form.items.map((item, idx) => (
                <div key={idx} className="grid gap-3 sm:grid-cols-[1fr,100px,120px,100px,40px] items-center p-3 rounded-xl bg-white/5 border border-white/10">
                  <input
                    placeholder="Description"
                    value={item.description}
                    onChange={(e) => updateItem(idx, 'description', e.target.value)}
                    className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                  <input
                    type="number"
                    placeholder="Qty"
                    value={item.quantity}
                    onChange={(e) => updateItem(idx, 'quantity', parseFloat(e.target.value) || 0)}
                    className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                  <input
                    type="number"
                    placeholder="Price"
                    value={item.unit_price}
                    onChange={(e) => updateItem(idx, 'unit_price', parseFloat(e.target.value) || 0)}
                    className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                  <div className="text-right text-white font-medium">
                    ${(item.quantity * item.unit_price).toLocaleString()}
                  </div>
                  <button
                    onClick={() => removeItem(idx)}
                    className="p-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div className="rounded-2xl bg-gradient-to-br from-slate-800/50 to-slate-800/30 backdrop-blur-md border border-white/10 p-6 shadow-xl">
            <h2 className="text-lg font-semibold text-white mb-4">Notes</h2>
            <textarea
              rows={4}
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
              placeholder="Add any additional notes..."
            />
          </div>
        </div>

        {/* Sidebar - Summary */}
        <div className="space-y-6">
          <div className="rounded-2xl bg-gradient-to-br from-slate-800/50 to-slate-800/30 backdrop-blur-md border border-white/10 p-6 shadow-xl sticky top-6">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Calculator className="w-5 h-5 text-emerald-400" />
              Invoice Summary
            </h2>
            
            <div className="space-y-3">
              <div className="flex justify-between text-white/80">
                <span>Subtotal:</span>
                <span className="font-medium">{form.currency} {subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-white/80">Tax Rate:</span>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={form.tax_rate}
                    onChange={(e) => setForm({ ...form, tax_rate: parseFloat(e.target.value) || 0 })}
                    className="w-20 px-2 py-1 rounded-lg bg-white/5 border border-white/10 text-white text-right focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                  <span className="text-white/80">%</span>
                </div>
              </div>
              <div className="flex justify-between text-white/80">
                <span>Tax Amount:</span>
                <span className="font-medium">{form.currency} {taxAmount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between border-t border-white/10 pt-3 mt-3">
                <span className="text-lg font-semibold text-white">Total:</span>
                <span className="text-2xl font-bold text-emerald-400">
                  {form.currency} {total.toLocaleString()}
                </span>
              </div>
            </div>

            <div className="mt-6 space-y-3">
              <button
                onClick={saveInvoice}
                disabled={loading}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Save className="w-5 h-5" />
                {loading ? "Saving..." : "Save Invoice"}
              </button>
              <button
                onClick={() => nav({ to: "/admin/invoices" })}
                className="w-full py-3 rounded-xl bg-white/5 border border-white/10 text-white/80 hover:text-white hover:bg-white/10 transition-all flex items-center justify-center gap-2"
              >
                <X className="w-5 h-5" />
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}