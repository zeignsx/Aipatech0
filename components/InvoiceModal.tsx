import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Trash2, FileText, FileSpreadsheet, User, Building2, Mail, Phone, MapPin, CreditCard, Calendar, DollarSign, TrendingUp, Save, Printer, RefreshCw, Search, Package } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { invoiceService } from '@/lib/invoice-service';
import { toast } from 'sonner';

interface InvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (invoiceId?: string) => void;
}

interface InvoiceItem {
  description: string;
  quantity: number;
  unit_price: number;
  amount: number;
}

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  address: string;
}

interface Product {
  id: string;
  name: string;
  category: string;
  day_rate: number;
}

export function InvoiceModal({ isOpen, onClose, onSuccess }: InvoiceModalProps) {
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [showNewCustomer, setShowNewCustomer] = useState(false);
  const [activeTab, setActiveTab] = useState<'details' | 'items'>('details');
  const [productSearch, setProductSearch] = useState("");
  const [showProductSelector, setShowProductSelector] = useState(false);
  const [selectedProductIndex, setSelectedProductIndex] = useState<number | null>(null);
  
  const [form, setForm] = useState({
    customer_id: '',
    invoice_number: `INV-${Date.now().toString().slice(-6)}${Math.floor(Math.random() * 1000)}`,
    issue_date: new Date().toISOString().split('T')[0],
    due_date: '',
    currency: 'USD',
    tax_rate: 7.5,
    notes: 'Thank you for your business.',
    items: [{ description: '', quantity: 1, unit_price: 0, amount: 0 }] as InvoiceItem[]
  });

  const [newCustomer, setNewCustomer] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    address: ''
  });

  useEffect(() => {
    if (isOpen) {
      loadCustomers();
      loadProducts();
      generateUniqueInvoiceNumber();
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isOpen]);

  useEffect(() => {
    if (productSearch) {
      setFilteredProducts(
        products.filter(p => 
          p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
          p.category.toLowerCase().includes(productSearch.toLowerCase())
        )
      );
    } else {
      setFilteredProducts(products);
    }
  }, [productSearch, products]);

  const generateUniqueInvoiceNumber = () => {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    setForm(prev => ({
      ...prev,
      invoice_number: `INV-${timestamp.toString().slice(-6)}${random}`
    }));
  };

  const loadProducts = async () => {
    const { data } = await supabase
      .from("rentals")
      .select("id, name, category, day_rate")
      .eq("active", true)
      .order("name");
    setProducts(data || []);
    setFilteredProducts(data || []);
  };

  const loadCustomers = async () => {
    const { data } = await supabase.from('customers').select('*').order('name');
    setCustomers(data || []);
  };

  const addCustomer = async () => {
    if (!newCustomer.name) {
      toast.error('Customer name is required');
      return;
    }

    const { data: user } = await supabase.auth.getUser();
    const { data, error } = await supabase.from('customers').insert({
      owner_id: user.user?.id,
      name: newCustomer.name,
      email: newCustomer.email,
      phone: newCustomer.phone,
      company: newCustomer.company,
      address: newCustomer.address
    }).select().single();

    if (error) {
      toast.error('Failed to add customer');
    } else {
      toast.success('Customer added successfully');
      setCustomers([...customers, data]);
      setForm({ ...form, customer_id: data.id });
      setShowNewCustomer(false);
      setNewCustomer({ name: '', email: '', phone: '', company: '', address: '' });
    }
  };

  const selectProduct = (product: Product) => {
    if (selectedProductIndex !== null) {
      const newItems = [...form.items];
      newItems[selectedProductIndex] = {
        description: product.name,
        quantity: 1,
        unit_price: product.day_rate,
        amount: product.day_rate
      };
      setForm({ ...form, items: newItems });
    } else {
      setForm({
        ...form,
        items: [...form.items, {
          description: product.name,
          quantity: 1,
          unit_price: product.day_rate,
          amount: product.day_rate
        }]
      });
    }
    setShowProductSelector(false);
    setSelectedProductIndex(null);
    setProductSearch("");
  };

  const addItem = () => {
    setForm({
      ...form,
      items: [...form.items, { description: '', quantity: 1, unit_price: 0, amount: 0 }]
    });
  };

  const removeItem = (index: number) => {
    if (form.items.length === 1) {
      toast.error('At least one item is required');
      return;
    }
    setForm({
      ...form,
      items: form.items.filter((_, i) => i !== index)
    });
  };

  const updateItem = (index: number, field: keyof InvoiceItem, value: any) => {
    const newItems = [...form.items];
    newItems[index] = { ...newItems[index], [field]: value };
    
    if (field === 'quantity' || field === 'unit_price') {
      newItems[index].amount = newItems[index].quantity * newItems[index].unit_price;
    }
    
    setForm({ ...form, items: newItems });
  };

  const calculateSubtotal = () => {
    return form.items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
  };

  const calculateTax = () => {
    return calculateSubtotal() * (form.tax_rate / 100);
  };

  const calculateTotal = () => {
    return calculateSubtotal() + calculateTax();
  };

  const getCustomerDetails = () => {
    const customer = customers.find(c => c.id === form.customer_id);
    return customer || { name: '', email: '', phone: '', company: '', address: '' };
  };

  const checkInvoiceNumberUnique = async (invoiceNumber: string): Promise<boolean> => {
    const { data, error } = await supabase
      .from('invoices')
      .select('id')
      .eq('invoice_number', invoiceNumber)
      .limit(1);
    
    return !error && data?.length === 0;
  };

  const saveInvoice = async (generatePDF: boolean = true, generateExcel: boolean = false) => {
    if (!form.customer_id) {
      toast.error('Please select or add a customer');
      return;
    }
    if (form.items.some(item => !item.description)) {
      toast.error('Please add descriptions for all items');
      return;
    }

    setLoading(true);
    try {
      const isUnique = await checkInvoiceNumberUnique(form.invoice_number);
      if (!isUnique) {
        toast.error('Invoice number already exists. Please use a different number.');
        generateUniqueInvoiceNumber();
        setLoading(false);
        return;
      }

      const { data: user } = await supabase.auth.getUser();
      const subtotal = calculateSubtotal();
      const taxAmount = calculateTax();
      const total = calculateTotal();

      const { data: invoice, error } = await supabase.from('invoices').insert({
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

      const { error: itemsError } = await supabase.from('invoice_items').insert(itemsData);
      if (itemsError) throw itemsError;

      toast.success('Invoice created successfully!');

      const customer = getCustomerDetails();
      const invoiceData = {
        id: invoice.id,
        invoice_number: form.invoice_number,
        issue_date: form.issue_date,
        due_date: form.due_date,
        status: 'draft',
        currency: form.currency,
        subtotal: subtotal,
        tax_rate: form.tax_rate,
        tax_amount: taxAmount,
        total: total,
        notes: form.notes,
        customer: {
          name: customer.name,
          company: customer.company,
          email: customer.email,
          phone: customer.phone,
          address: customer.address,
        },
        items: form.items,
        company: {
          name: 'AIPATECH Energy Limited',
          email: 'info@aipatechenergy.com',
          phone: '+234 800 000 0000',
          address: 'Abuja & Port Harcourt, Nigeria',
        }
      };

      if (generatePDF) {
        await invoiceService.exportToPDF(invoiceData);
        toast.success('PDF downloaded!');
      }
      
      if (generateExcel) {
        await invoiceService.exportToExcel([invoiceData]);
        toast.success('Excel downloaded!');
      }

      if (onSuccess) onSuccess(invoice.id);
      onClose();
      
    } catch (error: any) {
      console.error('Save error:', error);
      toast.error(error.message || 'Failed to create invoice');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const subtotal = calculateSubtotal();
  const taxAmount = calculateTax();
  const total = calculateTotal();

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 overflow-y-auto"
        >
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}></div>
          
          <div className="relative min-h-screen flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 50 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 50 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="relative bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800 rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto"
            >
              {/* Header */}
              <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-800 text-white p-6 rounded-t-2xl">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-2xl font-bold">Create New Invoice</h2>
                    <p className="text-blue-100 text-sm mt-1">Fill in the details below to generate invoice</p>
                  </div>
                  <button
                    onClick={onClose}
                    className="p-2 rounded-lg hover:bg-white/20 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 mt-6">
                  <button
                    onClick={() => setActiveTab('details')}
                    className={`px-6 py-2 rounded-lg transition-all ${
                      activeTab === 'details'
                        ? 'bg-white text-blue-600 shadow-lg'
                        : 'text-white hover:bg-white/20'
                    }`}
                  >
                    Customer Details
                  </button>
                  <button
                    onClick={() => setActiveTab('items')}
                    className={`px-6 py-2 rounded-lg transition-all ${
                      activeTab === 'items'
                        ? 'bg-white text-blue-600 shadow-lg'
                        : 'text-white hover:bg-white/20'
                    }`}
                  >
                    Products & Items ({form.items.length})
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                <AnimatePresence mode="wait">
                  {activeTab === 'details' && (
                    <motion.div
                      key="details"
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      exit={{ x: 20, opacity: 0 }}
                      className="space-y-5"
                    >
                      {/* Customer Section */}
                      <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-5">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                          <User className="w-5 h-5 text-blue-600" />
                          Customer Information
                        </h3>
                        
                        {!showNewCustomer ? (
                          <>
                            <select
                              value={form.customer_id}
                              onChange={(e) => setForm({ ...form, customer_id: e.target.value })}
                              className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 mb-3"
                            >
                              <option value="">Select a customer</option>
                              {customers.map(c => (
                                <option key={c.id} value={c.id}>{c.name} {c.company ? `(${c.company})` : ''}</option>
                              ))}
                            </select>
                            <button
                              onClick={() => setShowNewCustomer(true)}
                              className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
                            >
                              <Plus className="w-3 h-3" /> Add new customer
                            </button>
                          </>
                        ) : (
                          <div className="space-y-3">
                            <input
                              type="text"
                              placeholder="Full Name *"
                              value={newCustomer.name}
                              onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                              className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
                            />
                            <input
                              type="email"
                              placeholder="Email"
                              value={newCustomer.email}
                              onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
                              className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
                            />
                            <input
                              type="text"
                              placeholder="Phone"
                              value={newCustomer.phone}
                              onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                              className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
                            />
                            <input
                              type="text"
                              placeholder="Company"
                              value={newCustomer.company}
                              onChange={(e) => setNewCustomer({ ...newCustomer, company: e.target.value })}
                              className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
                            />
                            <textarea
                              placeholder="Address"
                              value={newCustomer.address}
                              onChange={(e) => setNewCustomer({ ...newCustomer, address: e.target.value })}
                              rows={2}
                              className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
                            />
                            <div className="flex gap-3">
                              <button
                                onClick={addCustomer}
                                className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
                              >
                                Save Customer
                              </button>
                              <button
                                onClick={() => setShowNewCustomer(false)}
                                className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Invoice Details */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4">
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Invoice Number
                          </label>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={form.invoice_number}
                              onChange={(e) => setForm({ ...form, invoice_number: e.target.value })}
                              className="flex-1 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
                            />
                            <button
                              onClick={generateUniqueInvoiceNumber}
                              className="px-3 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 hover:bg-gray-300"
                              title="Generate unique number"
                            >
                              <RefreshCw className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4">
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Currency
                          </label>
                          <select
                            value={form.currency}
                            onChange={(e) => setForm({ ...form, currency: e.target.value })}
                            className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
                          >
                            <option value="USD">USD - US Dollar</option>
                            <option value="EUR">EUR - Euro</option>
                            <option value="GBP">GBP - British Pound</option>
                            <option value="NGN">NGN - Nigerian Naira</option>
                          </select>
                        </div>
                        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4">
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Issue Date
                          </label>
                          <input
                            type="date"
                            value={form.issue_date}
                            onChange={(e) => setForm({ ...form, issue_date: e.target.value })}
                            className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
                          />
                        </div>
                        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4">
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Due Date
                          </label>
                          <input
                            type="date"
                            value={form.due_date}
                            onChange={(e) => setForm({ ...form, due_date: e.target.value })}
                            className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
                          />
                        </div>
                        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4">
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Tax Rate (%)
                          </label>
                          <input
                            type="number"
                            step="0.1"
                            value={form.tax_rate}
                            onChange={(e) => setForm({ ...form, tax_rate: parseFloat(e.target.value) || 0 })}
                            className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
                          />
                        </div>
                        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Notes
                          </label>
                          <textarea
                            value={form.notes}
                            onChange={(e) => setForm({ ...form, notes: e.target.value })}
                            rows={2}
                            className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
                          />
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {activeTab === 'items' && (
                    <motion.div
                      key="items"
                      initial={{ x: 20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      exit={{ x: -20, opacity: 0 }}
                      className="space-y-4"
                    >
                      {/* Product Selector */}
                      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-5">
                        <div className="flex items-center gap-2 mb-4">
                          <Package className="w-5 h-5 text-blue-600" />
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Quick Product Selection</h3>
                        </div>
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <input
                            type="text"
                            placeholder="Search for products..."
                            value={productSearch}
                            onChange={(e) => setProductSearch(e.target.value)}
                            onFocus={() => setShowProductSelector(true)}
                            className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
                          />
                        </div>
                        
                        {showProductSelector && (
                          <div className="mt-3 max-h-48 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800">
                            {filteredProducts.map(product => (
                              <button
                                key={product.id}
                                onClick={() => selectProduct(product)}
                                className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 flex justify-between items-center border-b border-gray-100 dark:border-gray-700"
                              >
                                <div>
                                  <p className="font-medium text-gray-900 dark:text-white">{product.name}</p>
                                  <p className="text-xs text-gray-500">{product.category}</p>
                                </div>
                                <p className="font-semibold text-blue-600">${product.day_rate}/day</p>
                              </button>
                            ))}
                            {filteredProducts.length === 0 && (
                              <p className="px-4 py-3 text-gray-500 text-sm">No products found</p>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Items List */}
                      <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-5">
                        <div className="flex justify-between items-center mb-4">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Invoice Items</h3>
                          <button
                            onClick={addItem}
                            className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 flex items-center gap-1"
                          >
                            <Plus className="w-4 h-4" /> Add Item
                          </button>
                        </div>
                        
                        <div className="space-y-3">
                          {form.items.map((item, idx) => (
                            <div key={idx} className="grid grid-cols-12 gap-2 items-center p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                              <input
                                placeholder="Description"
                                value={item.description}
                                onChange={(e) => updateItem(idx, 'description', e.target.value)}
                                className="col-span-5 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm"
                              />
                              <div className="col-span-2 flex items-center gap-1">
                                <button
                                  onClick={() => updateItem(idx, 'quantity', Math.max(0.5, item.quantity - 0.5))}
                                  className="px-2 py-1 rounded bg-gray-200 dark:bg-gray-700"
                                >
                                  -
                                </button>
                                <input
                                  type="number"
                                  value={item.quantity}
                                  onChange={(e) => updateItem(idx, 'quantity', parseFloat(e.target.value) || 0)}
                                  className="w-full px-2 py-2 text-center rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm"
                                  step="0.5"
                                />
                                <button
                                  onClick={() => updateItem(idx, 'quantity', item.quantity + 0.5)}
                                  className="px-2 py-1 rounded bg-gray-200 dark:bg-gray-700"
                                >
                                  +
                                </button>
                              </div>
                              <input
                                type="number"
                                placeholder="Price"
                                value={item.unit_price}
                                onChange={(e) => updateItem(idx, 'unit_price', parseFloat(e.target.value) || 0)}
                                className="col-span-2 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm"
                              />
                              <div className="col-span-2 text-right font-semibold text-blue-600">
                                ${(item.quantity * item.unit_price).toLocaleString()}
                              </div>
                              <button
                                onClick={() => removeItem(idx)}
                                className="col-span-1 p-2 rounded-lg bg-red-100 text-red-600 hover:bg-red-200"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Summary */}
                      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-5 text-white">
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span>Subtotal:</span>
                            <span>${subtotal.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Tax ({form.tax_rate}%):</span>
                            <span>${taxAmount.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between pt-2 border-t border-white/20 text-xl font-bold">
                            <span>Total:</span>
                            <span className="text-gold-300">${total.toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Footer */}
              <div className="sticky bottom-0 bg-gray-50 dark:bg-gray-800 p-6 border-t border-gray-200 dark:border-gray-700 rounded-b-2xl flex gap-4">
                <button
                  onClick={() => saveInvoice(true, false)}
                  disabled={loading}
                  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loading ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  ) : (
                    <>
                      <FileText className="w-5 h-5" />
                      Save & Generate PDF
                    </>
                  )}
                </button>
                <button
                  onClick={() => saveInvoice(false, true)}
                  disabled={loading}
                  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-green-600 to-green-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <FileSpreadsheet className="w-5 h-5" />
                  Save & Generate Excel
                </button>
                <button
                  onClick={onClose}
                  className="px-6 py-3 rounded-xl bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}