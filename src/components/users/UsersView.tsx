import React, { useState } from 'react';
import {
  ShieldCheck,
  Plus,
  Search,
  UserCheck,
  Mail,
  Shield,
  Building,
  KeyRound,
  Trash2,
  Edit2,
  X,
  CheckCircle2,
  Lock,
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { User, UserRole } from '../../types';

export const UsersView: React.FC = () => {
  const {
    users,
    currentUser,
    setCurrentUser,
    addUser,
    updateUser,
    deleteUser,
    warehouses,
    permissions,
  } = useData();

  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'CASHIER' as UserRole,
    warehouseId: warehouses[0]?.id || '',
    status: 'ACTIVE' as 'ACTIVE' | 'INACTIVE',
  });

  const filteredUsers = users.filter((u) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || u.role.toLowerCase().includes(q);
  });

  const handleOpenAdd = () => {
    setFormData({
      name: '',
      email: '',
      role: 'CASHIER',
      warehouseId: warehouses[0]?.id || '',
      status: 'ACTIVE',
    });
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (u: User) => {
    setEditingUser(u);
    setFormData({
      name: u.name,
      email: u.email,
      role: u.role,
      warehouseId: u.warehouseId || warehouses[0]?.id || '',
      status: u.status,
    });
  };

  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim()) {
      alert('Name and email are required.');
      return;
    }

    if (editingUser) {
      updateUser(editingUser.id, {
        name: formData.name,
        email: formData.email,
        role: formData.role,
        warehouseId: formData.warehouseId || undefined,
        status: formData.status,
      });
      setEditingUser(null);
    } else {
      addUser({
        name: formData.name,
        email: formData.email,
        role: formData.role,
        warehouseId: formData.warehouseId || undefined,
        status: formData.status,
      });
      setIsAddModalOpen(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150 text-slate-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <ShieldCheck className="w-6 h-6 text-indigo-400" />
            <span>Staff Users & Role-Based Access Control (RBAC)</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage system operators, assign warehouse stations, and enforce security privilege levels.
          </p>
        </div>

        {permissions.canManageUsers && (
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-colors self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Add User Operator</span>
          </button>
        )}
      </div>

      {/* Role Matrix Card */}
      <div className="p-5 rounded-2xl bg-[#161616] border border-white/5 space-y-3">
        <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
          <KeyRound className="w-4 h-4 text-indigo-400" /> Security Roles & Permission Privileges
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-[#111111] border border-indigo-500/20 space-y-1">
            <span className="font-semibold text-indigo-400">ADMIN / OWNER</span>
            <p className="text-[11px] text-slate-400">
              Unrestricted full access across all warehouses, P&L finances, user management, and system settings.
            </p>
          </div>
          <div className="p-3 rounded-xl bg-[#111111] border border-sky-500/20 space-y-1">
            <span className="font-semibold text-sky-400">MANAGER</span>
            <p className="text-[11px] text-slate-400">
              Can manage catalog, sales, inventory adjustments, purchase orders, customers, and view reports.
            </p>
          </div>
          <div className="p-3 rounded-xl bg-[#111111] border border-emerald-500/20 space-y-1">
            <span className="font-semibold text-emerald-400">CASHIER / POS</span>
            <p className="text-[11px] text-slate-400">
              Fast register access, creating sales invoices, processing customer payments, and barcode lookup.
            </p>
          </div>
          <div className="p-3 rounded-xl bg-[#111111] border border-amber-500/20 space-y-1">
            <span className="font-semibold text-amber-400">WAREHOUSE CLERK</span>
            <p className="text-[11px] text-slate-400">
              Stock counting, receiving inbound purchase deliveries, barcode printing, and warehouse transfers.
            </p>
          </div>
        </div>
      </div>

      {/* User Table */}
      <div className="rounded-2xl bg-[#161616] border border-white/5 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-white/5 bg-[#111111] text-slate-500 font-mono text-[10px] uppercase">
              <tr>
                <th className="py-3 px-4 font-medium">User Operator</th>
                <th className="py-3 px-4 font-medium">Email</th>
                <th className="py-3 px-4 font-medium">Role Tier</th>
                <th className="py-3 px-4 font-medium">Assigned Facility</th>
                <th className="py-3 px-4 font-medium">Status</th>
                <th className="py-3 px-4 font-medium text-right">Switch Active / Edit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-slate-300">
              {filteredUsers.map((u) => {
                const wh = warehouses.find((w) => w.id === u.warehouseId)?.name || 'All Warehouses (Global)';
                const isCurrent = currentUser.id === u.id;

                return (
                  <tr key={u.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3 px-4 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#1A1A1A] border border-white/10 text-indigo-400 flex items-center justify-center font-bold text-xs">
                        {u.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium text-white flex items-center gap-1.5">
                          {u.name}
                          {isCurrent && (
                            <span className="text-[9px] font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-1.5 py-0.5 rounded">
                              Current Session
                            </span>
                          )}
                        </p>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-400">{u.email}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 text-[10px] font-semibold rounded-md font-mono ${
                          u.role === 'ADMIN'
                            ? 'bg-indigo-500/10 text-indigo-300 border border-indigo-500/20'
                            : u.role === 'MANAGER'
                            ? 'bg-sky-500/10 text-sky-300 border border-sky-500/20'
                            : u.role === 'CASHIER'
                            ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'
                            : 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
                        }`}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-300">{wh}</td>
                    <td className="py-3 px-4">
                      <span className="text-emerald-400 flex items-center gap-1 text-[11px] font-medium">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Active
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {!isCurrent && (
                          <button
                            onClick={() => setCurrentUser(u)}
                            className="px-2.5 py-1 text-[11px] font-medium text-indigo-400 bg-indigo-500/10 hover:bg-indigo-500/20 rounded-lg transition-colors"
                          >
                            Login As User
                          </button>
                        )}
                        {permissions.canManageUsers && (
                          <>
                            <button
                              onClick={() => handleOpenEdit(u)}
                              className="p-1.5 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                              title="Edit User"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            {users.length > 1 && (
                              <button
                                onClick={() => {
                                  if (confirm(`Remove operator "${u.name}"?`)) {
                                    deleteUser(u.id);
                                  }
                                }}
                                className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-white/5 rounded-lg transition-colors"
                                title="Delete User"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit User Modal */}
      {(isAddModalOpen || editingUser) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-100">
          <div className="w-full max-w-md bg-[#111111] border border-white/10 rounded-2xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white">
                {editingUser ? `Edit Operator: ${editingUser.name}` : 'Register Staff Operator'}
              </h3>
              <button
                onClick={() => {
                  setIsAddModalOpen(false);
                  setEditingUser(null);
                }}
                className="p-1 text-slate-400 hover:text-white rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveUser} className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-xs text-slate-300 font-medium">Full Legal Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Taylor Vance"
                  className="w-full px-3 py-2 text-xs bg-[#1A1A1A] border border-white/10 rounded-lg text-slate-100 focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-slate-300 font-medium">Corporate Email *</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="taylor@company.com"
                  className="w-full px-3 py-2 text-xs bg-[#1A1A1A] border border-white/10 rounded-lg text-slate-100 focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-slate-300 font-medium">Security Role</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                  className="w-full px-3 py-2 text-xs bg-[#1A1A1A] border border-white/10 rounded-lg text-slate-100 focus:border-indigo-500 focus:outline-none"
                >
                  <option value="ADMIN" className="bg-[#111111]">ADMIN (Full Permissions)</option>
                  <option value="MANAGER" className="bg-[#111111]">MANAGER (Operations & Inventory)</option>
                  <option value="CASHIER" className="bg-[#111111]">CASHIER (POS & Invoicing)</option>
                  <option value="WAREHOUSE" className="bg-[#111111]">WAREHOUSE (Stock & Barcodes)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs text-slate-300 font-medium">Warehouse Station</label>
                <select
                  value={formData.warehouseId}
                  onChange={(e) => setFormData({ ...formData, warehouseId: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-[#1A1A1A] border border-white/10 rounded-lg text-slate-100 focus:border-indigo-500 focus:outline-none"
                >
                  <option value="" className="bg-[#111111]">All Warehouses</option>
                  {warehouses.map((w) => (
                    <option key={w.id} value={w.id} className="bg-[#111111]">
                      {w.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setEditingUser(null);
                  }}
                  className="px-3 py-1.5 text-xs text-slate-400 hover:text-white bg-[#1A1A1A] hover:bg-white/5 border border-white/10 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors"
                >
                  {editingUser ? 'Save Operator' : 'Register Operator'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
