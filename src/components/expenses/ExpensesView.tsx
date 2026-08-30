import React, { useState, useMemo } from 'react';
import {
  Wallet,
  Plus,
  Search,
  Filter,
  Download,
  Trash2,
  Calendar,
  Building,
  DollarSign,
  PieChart as PieIcon,
  Tag,
  X,
  CreditCard,
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { Expense } from '../../types';
import { exportToCsv } from '../../utils/export';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';

const EXPENSE_CATEGORIES = [
  'Warehouse Rent & Leases',
  'Utilities & Power',
  'Freight & Logistics',
  'Salaries & Wages',
  'Equipment & Maintenance',
  'Packaging Supplies',
  'Marketing & Advertising',
  'Software & Subscriptions',
  'Insurance & Licenses',
  'Office Supplies',
  'Miscellaneous',
];

const PIE_COLORS = ['#6366f1', '#3b82f6', '#06b6d4', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#64748b'];

export const ExpensesView: React.FC = () => {
  const {
    expenses,
    warehouses,
    selectedWarehouseId,
    addExpense,
    deleteExpense,
    formatCurrency,
    permissions,
  } = useData();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    category: EXPENSE_CATEGORIES[0],
    amount: '',
    warehouseId: warehouses[0]?.id || '',
    paymentMethod: 'BANK_TRANSFER' as const,
    referenceNumber: '',
    notes: '',
  });

  const filteredExpenses = useMemo(() => {
    return expenses.filter((e) => {
      if (selectedWarehouseId !== 'ALL' && e.warehouseId && e.warehouseId !== selectedWarehouseId) return false;
      if (selectedCategory !== 'ALL' && e.category !== selectedCategory) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          e.title.toLowerCase().includes(q) ||
          e.category.toLowerCase().includes(q) ||
          (e.referenceNumber && e.referenceNumber.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [expenses, selectedWarehouseId, selectedCategory, searchQuery]);

  const totalExpenseAmount = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);

  // Group by category for chart
  const categoryBreakdown = useMemo(() => {
    const map: { [cat: string]: number } = {};
    filteredExpenses.forEach((e) => {
      map[e.category] = (map[e.category] || 0) + e.amount;
    });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [filteredExpenses]);

  const handleAddExpenseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || Number(formData.amount) <= 0) {
      alert('Please enter a valid title and amount.');
      return;
    }

    addExpense({
      title: formData.title,
      category: formData.category,
      amount: Number(formData.amount),
      warehouseId: formData.warehouseId || undefined,
      paymentMethod: formData.paymentMethod,
      referenceNumber: formData.referenceNumber,
      notes: formData.notes,
    });

    setIsAddModalOpen(false);
    setFormData({
      title: '',
      category: EXPENSE_CATEGORIES[0],
      amount: '',
      warehouseId: warehouses[0]?.id || '',
      paymentMethod: 'BANK_TRANSFER',
      referenceNumber: '',
      notes: '',
    });
  };

  const handleExportCsv = () => {
    const rows = [
      ['Expense ID', 'Date', 'Title', 'Category', 'Amount', 'Payment Method', 'Warehouse', 'Reference', 'Notes'],
      ...filteredExpenses.map((e) => {
        const wh = warehouses.find((w) => w.id === e.warehouseId)?.name || 'Global';
        return [
          e.id,
          new Date(e.date).toLocaleDateString(),
          e.title,
          e.category,
          e.amount,
          e.paymentMethod,
          wh,
          e.referenceNumber || '',
          e.notes || '',
        ];
      }),
    ];
    exportToCsv('operational_expenses_ledger', rows);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150 text-slate-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <Wallet className="w-6 h-6 text-rose-400" />
            <span>Operating Expenses & Overhead Ledger</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Track operational costs, utilities, logistics, warehouse leases, and payroll disbursements.
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
          {permissions.canManageExpenses && (
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-sm transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Record Expense</span>
            </button>
          )}
        </div>
      </div>

      {/* KPI & Chart Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Total Expense Card */}
        <div className="p-5 rounded-2xl bg-[#161616] border border-white/5 flex flex-col justify-between">
          <div>
            <span className="text-xs font-medium text-slate-500">Total Filtered Operational Outflows</span>
            <p className="text-3xl font-bold text-rose-400 mt-2 font-mono tracking-tight">
              {formatCurrency(totalExpenseAmount)}
            </p>
            <p className="text-xs text-slate-500 mt-1">{filteredExpenses.length} expense record(s) logged</p>
          </div>

          <div className="pt-4 border-t border-white/5 space-y-2">
            <div className="flex justify-between text-xs text-slate-400">
              <span>Top Cost Center:</span>
              <strong className="text-slate-200">
                {categoryBreakdown[0]?.name || 'N/A'} ({formatCurrency(categoryBreakdown[0]?.value || 0)})
              </strong>
            </div>
          </div>
        </div>

        {/* Expense Category Pie Chart */}
        <div className="lg:col-span-2 p-5 rounded-2xl bg-[#161616] border border-white/5">
          <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
            Expense Allocation by Category
          </h3>
          <div className="h-44">
            {categoryBreakdown.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-500 text-xs">
                No expense data for this period
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryBreakdown}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={65}
                    innerRadius={40}
                    paddingAngle={3}
                  >
                    {categoryBreakdown.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#111111',
                      borderColor: 'rgba(255,255,255,0.1)',
                      borderRadius: '0.75rem',
                      fontSize: '12px',
                    }}
                    formatter={(value: any) => [formatCurrency(Number(value)), 'Amount']}
                  />
                  <Legend
                    wrapperStyle={{ fontSize: '11px', color: '#94a3b8' }}
                    layout="horizontal"
                    verticalAlign="bottom"
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="p-3 rounded-2xl bg-[#161616] border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search expenses by title, reference #, category..."
            className="w-full pl-9 pr-3.5 py-2 text-xs bg-[#1A1A1A] border border-white/10 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="px-3 py-2 text-xs bg-[#1A1A1A] border border-white/10 rounded-lg text-slate-200 focus:outline-none"
        >
          <option value="ALL" className="bg-[#111111]">All Categories</option>
          {EXPENSE_CATEGORIES.map((cat) => (
            <option key={cat} value={cat} className="bg-[#111111]">
              {cat}
            </option>
          ))}
        </select>
      </div>

      {/* Expenses Table */}
      <div className="rounded-2xl bg-[#161616] border border-white/5 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-white/5 bg-[#111111] text-slate-500 font-mono text-[10px] uppercase">
              <tr>
                <th className="py-3 px-4 font-medium">Expense Title</th>
                <th className="py-3 px-4 font-medium">Category</th>
                <th className="py-3 px-4 font-medium">Date</th>
                <th className="py-3 px-4 font-medium">Warehouse / Facility</th>
                <th className="py-3 px-4 font-medium">Payment Tender</th>
                <th className="py-3 px-4 font-medium">Amount</th>
                <th className="py-3 px-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-slate-300">
              {filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500 text-xs">
                    No expense records found.
                  </td>
                </tr>
              ) : (
                filteredExpenses.map((exp) => {
                  const wh = warehouses.find((w) => w.id === exp.warehouseId)?.name || 'General HQ';

                  return (
                    <tr key={exp.id} className="hover:bg-white/[0.02] transition-colors group">
                      <td className="py-3 px-4">
                        <p className="font-medium text-white">{exp.title}</p>
                        {exp.referenceNumber && (
                          <p className="text-[10px] text-slate-500 font-mono">Ref: {exp.referenceNumber}</p>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 text-[10px] font-semibold bg-[#1A1A1A] border border-white/10 text-slate-300 rounded-md">
                          {exp.category}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-500">{new Date(exp.date).toLocaleDateString()}</td>
                      <td className="py-3 px-4 text-slate-300">{wh}</td>
                      <td className="py-3 px-4 text-[11px] font-mono text-slate-500">{exp.paymentMethod}</td>
                      <td className="py-3 px-4 font-mono font-bold text-rose-400 text-sm">
                        -{formatCurrency(exp.amount)}
                      </td>
                      <td className="py-3 px-4 text-right">
                        {permissions.canManageExpenses && (
                          <button
                            onClick={() => {
                              if (confirm(`Delete expense "${exp.title}"?`)) {
                                deleteExpense(exp.id);
                              }
                            }}
                            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-white/5 rounded-lg transition-colors"
                            title="Delete Expense Record"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Expense Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-100">
          <div className="w-full max-w-md bg-[#111111] border border-white/10 rounded-2xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white">Record Operational Expense Outflow</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="p-1 text-slate-400 hover:text-white rounded-lg transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddExpenseSubmit} className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-xs text-slate-300 font-medium">Expense Description / Title *</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Monthly Warehouse Lease - Zone A"
                  className="w-full px-3 py-2 text-xs bg-[#1A1A1A] border border-white/10 rounded-lg text-slate-100 focus:border-rose-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs text-slate-300 font-medium">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-[#1A1A1A] border border-white/10 rounded-lg text-slate-100 focus:border-rose-500 focus:outline-none"
                  >
                    {EXPENSE_CATEGORIES.map((c) => (
                      <option key={c} value={c} className="bg-[#111111]">
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-slate-300 font-medium">Disbursed Amount ($) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    placeholder="0.00"
                    className="w-full px-3 py-2 text-xs bg-[#1A1A1A] border border-white/10 rounded-lg text-slate-100 font-mono font-bold focus:border-rose-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs text-slate-300 font-medium">Warehouse Allocation</label>
                  <select
                    value={formData.warehouseId}
                    onChange={(e) => setFormData({ ...formData, warehouseId: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-[#1A1A1A] border border-white/10 rounded-lg text-slate-100 focus:border-rose-500 focus:outline-none"
                  >
                    <option value="" className="bg-[#111111]">General / Head Office</option>
                    {warehouses.map((w) => (
                      <option key={w.id} value={w.id} className="bg-[#111111]">
                        {w.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-slate-300 font-medium">Payment Tender</label>
                  <select
                    value={formData.paymentMethod}
                    onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value as any })}
                    className="w-full px-3 py-2 text-xs bg-[#1A1A1A] border border-white/10 rounded-lg text-slate-100 focus:border-rose-500 focus:outline-none"
                  >
                    <option value="BANK_TRANSFER" className="bg-[#111111]">Bank Wire</option>
                    <option value="CARD" className="bg-[#111111]">Company Card</option>
                    <option value="CASH" className="bg-[#111111]">Petty Cash</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs text-slate-300 font-medium">Receipt / Reference #</label>
                <input
                  type="text"
                  value={formData.referenceNumber}
                  onChange={(e) => setFormData({ ...formData, referenceNumber: e.target.value })}
                  placeholder="e.g. INV-992381"
                  className="w-full px-3 py-2 text-xs bg-[#1A1A1A] border border-white/10 rounded-lg text-slate-100 focus:border-rose-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-slate-300 font-medium">Notes</label>
                <input
                  type="text"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Additional audit details"
                  className="w-full px-3 py-2 text-xs bg-[#1A1A1A] border border-white/10 rounded-lg text-slate-100 focus:border-rose-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-3 py-1.5 text-xs text-slate-400 hover:text-white bg-[#1A1A1A] hover:bg-white/5 border border-white/10 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-medium text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-colors"
                >
                  Post Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
