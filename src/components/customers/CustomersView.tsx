import React, { useState, useMemo } from 'react';
import {
  Users,
  Plus,
  Search,
  Download,
  Phone,
  Mail,
  MapPin,
  CreditCard,
  Receipt,
  Eye,
  Edit2,
  Trash2,
  DollarSign,
  AlertCircle,
  X,
  History,
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { Customer, Sale } from '../../types';
import { exportToCsv } from '../../utils/export';

export const CustomersView: React.FC = () => {
  const {
    customers,
    sales,
    addCustomer,
    updateCustomer,
    deleteCustomer,
    recordCustomerDirectPayment,
    formatCurrency,
    permissions,
  } = useData();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  // Direct payment modal
  const [paymentModalCust, setPaymentModalCust] = useState<Customer | null>(null);
  const [payAmount, setPayAmount] = useState(0);
  const [payMethod, setPayMethod] = useState<'CASH' | 'CARD' | 'BANK_TRANSFER'>('CASH');
  const [payNote, setPayNote] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    creditLimit: 5000,
    notes: '',
  });

  const filteredCustomers = useMemo(() => {
    if (!searchQuery.trim()) return customers;
    const q = searchQuery.toLowerCase();
    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.phone.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.customerCode.toLowerCase().includes(q)
    );
  }, [customers, searchQuery]);

  const totalReceivables = customers.reduce((sum, c) => sum + c.outstandingBalance, 0);
  const totalLifetimePurchases = customers.reduce((sum, c) => sum + c.totalPurchases, 0);

  const handleOpenAdd = () => {
    setFormData({ name: '', phone: '', email: '', address: '', creditLimit: 5000, notes: '' });
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (c: Customer) => {
    setEditingCustomer(c);
    setFormData({
      name: c.name,
      phone: c.phone,
      email: c.email,
      address: c.address,
      creditLimit: c.creditLimit,
      notes: c.notes || '',
    });
  };

  const handleSaveCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.phone.trim()) {
      alert('Name and phone are required.');
      return;
    }

    if (editingCustomer) {
      updateCustomer(editingCustomer.id, {
        name: formData.name,
        phone: formData.phone,
        email: formData.email,
        address: formData.address,
        creditLimit: Number(formData.creditLimit),
        notes: formData.notes,
      });
      setEditingCustomer(null);
    } else {
      addCustomer({
        name: formData.name,
        phone: formData.phone,
        email: formData.email,
        address: formData.address,
        creditLimit: Number(formData.creditLimit),
        notes: formData.notes,
      });
      setIsAddModalOpen(false);
    }
  };

  const handleDirectPaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentModalCust || payAmount <= 0) return;
    recordCustomerDirectPayment(paymentModalCust.id, payAmount, payMethod, payNote);
    setPaymentModalCust(null);
  };

  const handleExportCsv = () => {
    const rows = [
      ['Customer Code', 'Name', 'Phone', 'Email', 'Credit Limit', 'Total Lifetime Purchases', 'Outstanding Receivables'],
      ...filteredCustomers.map((c) => [
        c.customerCode,
        c.name,
        c.phone,
        c.email,
        c.creditLimit,
        c.totalPurchases,
        c.outstandingBalance,
      ]),
    ];
    exportToCsv('customer_accounts_ledger', rows);
  };

  // Get sales history for selected customer modal
  const customerSales = selectedCustomer
    ? sales.filter((s) => s.customerId === selectedCustomer.id)
    : [];

  return (
    <div className="space-y-6 animate-in fade-in duration-150 text-slate-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <Users className="w-6 h-6 text-indigo-400" />
            <span>Customers & Accounts Receivable</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Customer relationship management, credit limits, transaction histories, and balance settlements.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleExportCsv}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-slate-300 bg-[#161616] hover:bg-white/5 border border-white/5 rounded-lg transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
          {permissions.canManageCustomers && (
            <button
              onClick={handleOpenAdd}
              className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Add Customer</span>
            </button>
          )}
        </div>
      </div>

      {/* Summary KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-[#161616] border border-white/5 flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-slate-500">Total Registered Clients</span>
            <p className="text-xl font-bold text-white mt-1">{customers.length} Accounts</p>
            <p className="text-[11px] text-slate-500 mt-0.5">Active retail & wholesale buyers</p>
          </div>
          <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-xl">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[#161616] border border-white/5 flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-slate-500">Total Lifetime Volume</span>
            <p className="text-xl font-bold text-emerald-400 mt-1">{formatCurrency(totalLifetimePurchases)}</p>
            <p className="text-[11px] text-slate-500 mt-0.5">Cumulative sales revenue</p>
          </div>
          <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[#161616] border border-white/5 flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-slate-500">Total Outstanding Receivables</span>
            <p className="text-xl font-bold text-amber-400 mt-1">{formatCurrency(totalReceivables)}</p>
            <p className="text-[11px] text-slate-500 mt-0.5">Owed to your company</p>
          </div>
          <div className="p-3 bg-amber-500/10 text-amber-400 rounded-xl">
            <AlertCircle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="p-3 rounded-2xl bg-[#161616] border border-white/5">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search customers by name, phone, email, code..."
            className="w-full pl-9 pr-3.5 py-2 text-xs bg-[#1A1A1A] border border-white/10 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Customer Cards & Table */}
      <div className="rounded-2xl bg-[#161616] border border-white/5 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-white/5 bg-[#111111] text-slate-500 font-mono text-[10px] uppercase">
              <tr>
                <th className="py-3 px-4 font-medium">Customer</th>
                <th className="py-3 px-4 font-medium">Contact Info</th>
                <th className="py-3 px-4 font-medium">Credit Limit</th>
                <th className="py-3 px-4 font-medium">Total Purchases</th>
                <th className="py-3 px-4 font-medium">Outstanding Balance</th>
                <th className="py-3 px-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-slate-300">
              {filteredCustomers.map((c) => (
                <tr key={c.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="py-3 px-4">
                    <p className="font-medium text-white">{c.name}</p>
                    <span className="text-[10px] font-mono text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded">
                      {c.customerCode}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-[11px] space-y-0.5">
                    <p className="text-slate-200 font-mono">{c.phone}</p>
                    <p className="text-slate-500">{c.email || 'No email'}</p>
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-400">{formatCurrency(c.creditLimit)}</td>
                  <td className="py-3 px-4 font-mono font-medium text-slate-100">{formatCurrency(c.totalPurchases)}</td>
                  <td className="py-3 px-4 font-mono font-bold">
                    <span className={c.outstandingBalance > 0 ? 'text-amber-400' : 'text-emerald-400'}>
                      {formatCurrency(c.outstandingBalance)}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {c.outstandingBalance > 0 && (
                        <button
                          onClick={() => {
                            setPaymentModalCust(c);
                            setPayAmount(c.outstandingBalance);
                            setPayNote(`Settlement for ${c.name}`);
                          }}
                          className="px-2.5 py-1 text-[11px] font-medium text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 rounded-lg transition-colors"
                        >
                          Collect Pay
                        </button>
                      )}
                      <button
                        onClick={() => setSelectedCustomer(c)}
                        className="p-1.5 text-slate-400 hover:text-indigo-400 hover:bg-white/5 rounded-lg transition-colors"
                        title="View Customer Ledger & History"
                      >
                        <History className="w-4 h-4" />
                      </button>
                      {permissions.canManageCustomers && (
                        <>
                          <button
                            onClick={() => handleOpenEdit(c)}
                            className="p-1.5 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                            title="Edit Customer"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          {customers.length > 1 && (
                            <button
                              onClick={() => {
                                if (confirm(`Delete customer account for "${c.name}"?`)) {
                                  deleteCustomer(c.id);
                                }
                              }}
                              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-white/5 rounded-lg transition-colors"
                              title="Delete Customer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Customer Ledger & History Modal */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-100">
          <div className="w-full max-w-3xl bg-[#111111] border border-white/10 rounded-2xl shadow-2xl p-6 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-white">{selectedCustomer.name} — Customer Ledger</h3>
                <p className="text-xs text-slate-500 font-mono mt-0.5">{selectedCustomer.customerCode} • {selectedCustomer.phone}</p>
              </div>
              <button onClick={() => setSelectedCustomer(null)} className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Financial Summary */}
            <div className="grid grid-cols-3 gap-3 p-4 rounded-xl bg-[#161616] border border-white/5 text-xs">
              <div>
                <span className="text-slate-400">Credit Limit:</span>
                <p className="font-mono font-semibold text-slate-200 mt-0.5">{formatCurrency(selectedCustomer.creditLimit)}</p>
              </div>
              <div>
                <span className="text-slate-400">Lifetime Purchases:</span>
                <p className="font-mono font-bold text-emerald-400 mt-0.5">{formatCurrency(selectedCustomer.totalPurchases)}</p>
              </div>
              <div>
                <span className="text-slate-400">Outstanding Due:</span>
                <p className="font-mono font-bold text-amber-400 mt-0.5">{formatCurrency(selectedCustomer.outstandingBalance)}</p>
              </div>
            </div>

            {/* Past Invoices */}
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Purchase Invoices History</h4>
              <div className="border border-white/5 rounded-xl overflow-hidden text-xs">
                <table className="w-full text-left">
                  <thead className="bg-[#161616] text-slate-500 font-mono text-[10px] uppercase border-b border-white/5">
                    <tr>
                      <th className="p-2.5 font-medium">Invoice #</th>
                      <th className="p-2.5 font-medium">Date</th>
                      <th className="p-2.5 font-medium">Total</th>
                      <th className="p-2.5 font-medium">Paid</th>
                      <th className="p-2.5 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-slate-300">
                    {customerSales.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-4 text-center text-slate-500">No invoices logged for this account.</td>
                      </tr>
                    ) : (
                      customerSales.map((s) => (
                        <tr key={s.id}>
                          <td className="p-2.5 font-mono font-medium text-indigo-400">{s.invoiceNumber}</td>
                          <td className="p-2.5 font-mono text-slate-500">{new Date(s.date).toLocaleDateString()}</td>
                          <td className="p-2.5 font-mono font-medium">{formatCurrency(s.grandTotal)}</td>
                          <td className="p-2.5 font-mono text-emerald-400 font-medium">{formatCurrency(s.paidAmount)}</td>
                          <td className="p-2.5">
                            <span className="px-2 py-0.5 text-[10px] font-semibold rounded bg-[#1A1A1A] border border-white/10 text-slate-300">{s.paymentStatus}</span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedCustomer(null)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-medium transition-colors"
              >
                Close Statement
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Customer Modal */}
      {(isAddModalOpen || editingCustomer) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-100">
          <div className="w-full max-w-md bg-[#111111] border border-white/10 rounded-2xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white">
                {editingCustomer ? `Edit Customer: ${editingCustomer.name}` : 'Add Customer Account'}
              </h3>
              <button
                onClick={() => {
                  setIsAddModalOpen(false);
                  setEditingCustomer(null);
                }}
                className="p-1 text-slate-400 hover:text-white rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCustomer} className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-xs text-slate-300 font-medium">Customer / Company Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Apex Industrial Systems"
                  className="w-full px-3 py-2 text-xs bg-[#1A1A1A] border border-white/10 rounded-lg text-slate-100 focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-slate-300 font-medium">Phone Number *</label>
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+1 (555) 019-4821"
                  className="w-full px-3 py-2 text-xs bg-[#1A1A1A] border border-white/10 rounded-lg text-slate-100 focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-slate-300 font-medium">Email Address</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="purchasing@client.com"
                  className="w-full px-3 py-2 text-xs bg-[#1A1A1A] border border-white/10 rounded-lg text-slate-100 focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-slate-300 font-medium">Billing Address</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="e.g. 100 Main St, Austin, TX"
                  className="w-full px-3 py-2 text-xs bg-[#1A1A1A] border border-white/10 rounded-lg text-slate-100 focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-slate-300 font-medium">Authorized Credit Limit ($)</label>
                <input
                  type="number"
                  min="0"
                  value={formData.creditLimit}
                  onChange={(e) => setFormData({ ...formData, creditLimit: Number(e.target.value) })}
                  className="w-full px-3 py-2 text-xs bg-[#1A1A1A] border border-white/10 rounded-lg text-slate-100 font-mono focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setEditingCustomer(null);
                  }}
                  className="px-3 py-1.5 text-xs text-slate-400 hover:text-white bg-[#1A1A1A] hover:bg-white/5 border border-white/10 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors"
                >
                  {editingCustomer ? 'Update Customer' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Collect Direct Payment Modal */}
      {paymentModalCust && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-100">
          <div className="w-full max-w-md bg-[#111111] border border-white/10 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white">Collect Direct Payment: {paymentModalCust.name}</h3>
              <button onClick={() => setPaymentModalCust(null)} className="p-1 text-slate-400 hover:text-white rounded-lg transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleDirectPaymentSubmit} className="space-y-3.5">
              <div className="p-3 bg-[#161616] rounded-xl border border-white/5 text-xs flex justify-between">
                <span className="text-slate-400">Total Customer Balance Due:</span>
                <strong className="font-mono text-amber-400">{formatCurrency(paymentModalCust.outstandingBalance)}</strong>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-300">Payment Amount ($) *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={paymentModalCust.outstandingBalance}
                  required
                  value={payAmount}
                  onChange={(e) => setPayAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs bg-[#1A1A1A] border border-white/10 rounded-lg text-slate-100 font-mono font-bold focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-300">Payment Tender</label>
                <select
                  value={payMethod}
                  onChange={(e) => setPayMethod(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs bg-[#1A1A1A] border border-white/10 rounded-lg text-slate-100 focus:outline-none"
                >
                  <option value="CASH" className="bg-[#111111]">Cash</option>
                  <option value="CARD" className="bg-[#111111]">Credit / Debit Card</option>
                  <option value="BANK_TRANSFER" className="bg-[#111111]">Bank Wire Transfer</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-300">Memo / Notes</label>
                <input
                  type="text"
                  value={payNote}
                  onChange={(e) => setPayNote(e.target.value)}
                  placeholder="Direct ledger credit settlement"
                  className="w-full px-3 py-2 text-xs bg-[#1A1A1A] border border-white/10 rounded-lg text-slate-100 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setPaymentModalCust(null)}
                  className="px-3 py-1.5 text-xs text-slate-400 hover:text-white bg-[#1A1A1A] hover:bg-white/5 border border-white/10 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors"
                >
                  Confirm & Credit Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
