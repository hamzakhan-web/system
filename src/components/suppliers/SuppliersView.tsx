import React, { useState, useMemo } from 'react';
import {
  Contact2,
  Plus,
  Search,
  Download,
  Phone,
  Mail,
  MapPin,
  Building2,
  DollarSign,
  AlertCircle,
  Eye,
  Edit2,
  Trash2,
  X,
  History,
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { Supplier } from '../../types';
import { exportToCsv } from '../../utils/export';

export const SuppliersView: React.FC = () => {
  const {
    suppliers,
    purchases,
    addSupplier,
    updateSupplier,
    deleteSupplier,
    recordSupplierDirectPayment,
    formatCurrency,
    permissions,
  } = useData();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);

  // Pay modal
  const [paymentModalSup, setPaymentModalSup] = useState<Supplier | null>(null);
  const [payAmount, setPayAmount] = useState(0);
  const [payMethod, setPayMethod] = useState<'BANK_TRANSFER' | 'CASH' | 'CARD'>('BANK_TRANSFER');
  const [payNote, setPayNote] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    company: '',
    phone: '',
    email: '',
    address: '',
    taxNumber: '',
  });

  const filteredSuppliers = useMemo(() => {
    if (!searchQuery.trim()) return suppliers;
    const q = searchQuery.toLowerCase();
    return suppliers.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.company.toLowerCase().includes(q) ||
        s.phone.toLowerCase().includes(q) ||
        s.supplierCode.toLowerCase().includes(q)
    );
  }, [suppliers, searchQuery]);

  const totalPayables = suppliers.reduce((sum, s) => sum + s.outstandingPayable, 0);
  const totalPurchasesVolume = suppliers.reduce((sum, s) => sum + s.totalPurchases, 0);

  const handleOpenAdd = () => {
    setFormData({ name: '', company: '', phone: '', email: '', address: '', taxNumber: '' });
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (sup: Supplier) => {
    setEditingSupplier(sup);
    setFormData({
      name: sup.name,
      company: sup.company,
      phone: sup.phone,
      email: sup.email,
      address: sup.address,
      taxNumber: sup.taxNumber || '',
    });
  };

  const handleSaveSupplier = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.company.trim()) {
      alert('Supplier name and company are required.');
      return;
    }

    if (editingSupplier) {
      updateSupplier(editingSupplier.id, {
        name: formData.name,
        company: formData.company,
        phone: formData.phone,
        email: formData.email,
        address: formData.address,
        taxNumber: formData.taxNumber,
      });
      setEditingSupplier(null);
    } else {
      addSupplier({
        name: formData.name,
        company: formData.company,
        phone: formData.phone,
        email: formData.email,
        address: formData.address,
        taxNumber: formData.taxNumber,
      });
      setIsAddModalOpen(false);
    }
  };

  const handlePaySupplierSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentModalSup || payAmount <= 0) return;
    recordSupplierDirectPayment(paymentModalSup.id, payAmount, payMethod, payNote);
    setPaymentModalSup(null);
  };

  const handleExportCsv = () => {
    const rows = [
      ['Supplier Code', 'Name', 'Company', 'Phone', 'Email', 'Total Purchases', 'Outstanding Payables'],
      ...filteredSuppliers.map((s) => [
        s.supplierCode,
        s.name,
        s.company,
        s.phone,
        s.email,
        s.totalPurchases,
        s.outstandingPayable,
      ]),
    ];
    exportToCsv('supplier_vendors_ledger', rows);
  };

  const supplierPOs = selectedSupplier
    ? purchases.filter((p) => p.supplierId === selectedSupplier.id)
    : [];

  return (
    <div className="space-y-6 animate-in fade-in duration-150 text-slate-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <Contact2 className="w-6 h-6 text-amber-400" />
            <span>Suppliers & Accounts Payable</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Vendor management, procurement contracts, purchase history, and payable balances.
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
          {permissions.canManageSuppliers && (
            <button
              onClick={handleOpenAdd}
              className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Add Supplier</span>
            </button>
          )}
        </div>
      </div>

      {/* Summary KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-[#161616] border border-white/5 flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-slate-500">Active Vendor Partners</span>
            <p className="text-xl font-bold text-white mt-1">{suppliers.length} Vendors</p>
            <p className="text-[11px] text-slate-500 mt-0.5">OEM & Wholesale suppliers</p>
          </div>
          <div className="p-3 bg-amber-500/10 text-amber-400 rounded-xl">
            <Contact2 className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[#161616] border border-white/5 flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-slate-500">Total Inbound Procurement</span>
            <p className="text-xl font-bold text-sky-400 mt-1">{formatCurrency(totalPurchasesVolume)}</p>
            <p className="text-[11px] text-slate-500 mt-0.5">Cumulative PO value</p>
          </div>
          <div className="p-3 bg-sky-500/10 text-sky-400 rounded-xl">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[#161616] border border-white/5 flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-slate-500">Total Accounts Payable</span>
            <p className="text-xl font-bold text-amber-400 mt-1">{formatCurrency(totalPayables)}</p>
            <p className="text-[11px] text-slate-500 mt-0.5">Owed to suppliers</p>
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
            placeholder="Search suppliers by name, company, phone, code..."
            className="w-full pl-9 pr-3.5 py-2 text-xs bg-[#1A1A1A] border border-white/10 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Suppliers Table */}
      <div className="rounded-2xl bg-[#161616] border border-white/5 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-white/5 bg-[#111111] text-slate-500 font-mono text-[10px] uppercase">
              <tr>
                <th className="py-3 px-4 font-medium">Vendor Company</th>
                <th className="py-3 px-4 font-medium">Contact Representative</th>
                <th className="py-3 px-4 font-medium">Location / Tax ID</th>
                <th className="py-3 px-4 font-medium">Cumulative Orders</th>
                <th className="py-3 px-4 font-medium">Payables Due</th>
                <th className="py-3 px-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-slate-300">
              {filteredSuppliers.map((s) => (
                <tr key={s.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="py-3 px-4">
                    <p className="font-medium text-white">{s.company}</p>
                    <span className="text-[10px] font-mono text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded">
                      {s.supplierCode}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-[11px] space-y-0.5">
                    <p className="text-slate-200 font-medium">{s.name}</p>
                    <p className="text-slate-500 font-mono">{s.phone}</p>
                  </td>
                  <td className="py-3 px-4 text-[11px]">
                    <p className="text-slate-300 truncate max-w-[180px]">{s.address}</p>
                    <p className="text-slate-500 font-mono text-[10px]">{s.taxNumber ? `Tax ID: ${s.taxNumber}` : ''}</p>
                  </td>
                  <td className="py-3 px-4 font-mono font-medium text-slate-100">{formatCurrency(s.totalPurchases)}</td>
                  <td className="py-3 px-4 font-mono font-bold">
                    <span className={s.outstandingPayable > 0 ? 'text-amber-400' : 'text-emerald-400'}>
                      {formatCurrency(s.outstandingPayable)}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {s.outstandingPayable > 0 && (
                        <button
                          onClick={() => {
                            setPaymentModalSup(s);
                            setPayAmount(s.outstandingPayable);
                            setPayNote(`Payable settlement for ${s.company}`);
                          }}
                          className="px-2.5 py-1 text-[11px] font-medium text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 rounded-lg transition-colors"
                        >
                          Pay Vendor
                        </button>
                      )}
                      <button
                        onClick={() => setSelectedSupplier(s)}
                        className="p-1.5 text-slate-400 hover:text-indigo-400 hover:bg-white/5 rounded-lg transition-colors"
                        title="View Vendor Statement"
                      >
                        <History className="w-4 h-4" />
                      </button>
                      {permissions.canManageSuppliers && (
                        <>
                          <button
                            onClick={() => handleOpenEdit(s)}
                            className="p-1.5 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                            title="Edit Supplier"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          {suppliers.length > 1 && (
                            <button
                              onClick={() => {
                                if (confirm(`Delete supplier "${s.company}"?`)) {
                                  deleteSupplier(s.id);
                                }
                              }}
                              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-white/5 rounded-lg transition-colors"
                              title="Delete Supplier"
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

      {/* Supplier Statement Modal */}
      {selectedSupplier && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-100">
          <div className="w-full max-w-3xl bg-[#111111] border border-white/10 rounded-2xl shadow-2xl p-6 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-white">{selectedSupplier.company} — Vendor Ledger</h3>
                <p className="text-xs text-slate-500 font-mono mt-0.5">{selectedSupplier.supplierCode} • Rep: {selectedSupplier.name}</p>
              </div>
              <button onClick={() => setSelectedSupplier(null)} className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 p-4 rounded-xl bg-[#161616] border border-white/5 text-xs">
              <div>
                <span className="text-slate-400">Total Purchase Orders:</span>
                <p className="font-mono font-bold text-sky-400 mt-0.5">{formatCurrency(selectedSupplier.totalPurchases)}</p>
              </div>
              <div>
                <span className="text-slate-400">Outstanding Payables:</span>
                <p className="font-mono font-bold text-amber-400 mt-0.5">{formatCurrency(selectedSupplier.outstandingPayable)}</p>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Purchase Orders (PO) Log</h4>
              <div className="border border-white/5 rounded-xl overflow-hidden text-xs">
                <table className="w-full text-left">
                  <thead className="bg-[#161616] text-slate-500 font-mono text-[10px] uppercase border-b border-white/5">
                    <tr>
                      <th className="p-2.5 font-medium">PO #</th>
                      <th className="p-2.5 font-medium">Date</th>
                      <th className="p-2.5 font-medium">Total</th>
                      <th className="p-2.5 font-medium">Paid</th>
                      <th className="p-2.5 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-slate-300">
                    {supplierPOs.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-4 text-center text-slate-500">No POs logged for this vendor.</td>
                      </tr>
                    ) : (
                      supplierPOs.map((p) => (
                        <tr key={p.id}>
                          <td className="p-2.5 font-mono font-medium text-sky-400">{p.poNumber}</td>
                          <td className="p-2.5 font-mono text-slate-500">{new Date(p.date).toLocaleDateString()}</td>
                          <td className="p-2.5 font-mono font-medium">{formatCurrency(p.grandTotal)}</td>
                          <td className="p-2.5 font-mono text-emerald-400 font-medium">{formatCurrency(p.paidAmount)}</td>
                          <td className="p-2.5">
                            <span className="px-2 py-0.5 text-[10px] font-semibold rounded bg-[#1A1A1A] border border-white/10 text-slate-300">{p.status}</span>
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
                onClick={() => setSelectedSupplier(null)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-medium transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Supplier Modal */}
      {(isAddModalOpen || editingSupplier) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-100">
          <div className="w-full max-w-md bg-[#111111] border border-white/10 rounded-2xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white">
                {editingSupplier ? `Edit Supplier: ${editingSupplier.company}` : 'Add Vendor Supplier'}
              </h3>
              <button
                onClick={() => {
                  setIsAddModalOpen(false);
                  setEditingSupplier(null);
                }}
                className="p-1 text-slate-400 hover:text-white rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSupplier} className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-xs text-slate-300 font-medium">Vendor Company Name *</label>
                <input
                  type="text"
                  required
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  placeholder="e.g. Apex Global Silicon Ltd"
                  className="w-full px-3 py-2 text-xs bg-[#1A1A1A] border border-white/10 rounded-lg text-slate-100 focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-slate-300 font-medium">Account Representative Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Marcus Vance"
                  className="w-full px-3 py-2 text-xs bg-[#1A1A1A] border border-white/10 rounded-lg text-slate-100 focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-slate-300 font-medium">Contact Phone</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+1 (555) 019-3829"
                  className="w-full px-3 py-2 text-xs bg-[#1A1A1A] border border-white/10 rounded-lg text-slate-100 focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-slate-300 font-medium">Email Address</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="sales@vendor.com"
                  className="w-full px-3 py-2 text-xs bg-[#1A1A1A] border border-white/10 rounded-lg text-slate-100 focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-slate-300 font-medium">Address / Headquarters</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="e.g. 500 Technology Way, San Jose, CA"
                  className="w-full px-3 py-2 text-xs bg-[#1A1A1A] border border-white/10 rounded-lg text-slate-100 focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setEditingSupplier(null);
                  }}
                  className="px-3 py-1.5 text-xs text-slate-400 hover:text-white bg-[#1A1A1A] hover:bg-white/5 border border-white/10 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors"
                >
                  {editingSupplier ? 'Save Changes' : 'Register Supplier'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Settle Direct Supplier Payment Modal */}
      {paymentModalSup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-100">
          <div className="w-full max-w-md bg-[#111111] border border-white/10 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white">Settle Vendor Payable: {paymentModalSup.company}</h3>
              <button onClick={() => setPaymentModalSup(null)} className="p-1 text-slate-400 hover:text-white rounded-lg transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handlePaySupplierSubmit} className="space-y-3.5">
              <div className="p-3 bg-[#161616] rounded-xl border border-white/5 text-xs flex justify-between">
                <span className="text-slate-400">Total Balance Owed:</span>
                <strong className="font-mono text-amber-400">{formatCurrency(paymentModalSup.outstandingPayable)}</strong>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-300">Payment Amount ($) *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={paymentModalSup.outstandingPayable}
                  required
                  value={payAmount}
                  onChange={(e) => setPayAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs bg-[#1A1A1A] border border-white/10 rounded-lg text-slate-100 font-mono font-bold focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-300">Payment Method</label>
                <select
                  value={payMethod}
                  onChange={(e) => setPayMethod(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs bg-[#1A1A1A] border border-white/10 rounded-lg text-slate-100 focus:outline-none"
                >
                  <option value="BANK_TRANSFER" className="bg-[#111111]">Bank Wire Transfer</option>
                  <option value="CASH" className="bg-[#111111]">Cash</option>
                  <option value="CARD" className="bg-[#111111]">Company Card</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-300">Memo / Notes</label>
                <input
                  type="text"
                  value={payNote}
                  onChange={(e) => setPayNote(e.target.value)}
                  placeholder="Direct ledger payable settlement"
                  className="w-full px-3 py-2 text-xs bg-[#1A1A1A] border border-white/10 rounded-lg text-slate-100 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setPaymentModalSup(null)}
                  className="px-3 py-1.5 text-xs text-slate-400 hover:text-white bg-[#1A1A1A] hover:bg-white/5 border border-white/10 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-medium text-white bg-amber-600 hover:bg-amber-700 rounded-lg transition-colors"
                >
                  Confirm & Post Outflow
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
