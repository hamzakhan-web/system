import React, { useState } from 'react';
import {
  Building2,
  Plus,
  Boxes,
  Package,
  Phone,
  Mail,
  MapPin,
  UserCheck,
  Edit2,
  Trash2,
  DollarSign,
  ArrowRightLeft,
  X,
  CheckCircle2,
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { Warehouse } from '../../types';

export const WarehousesView: React.FC = () => {
  const {
    warehouses,
    products,
    addWarehouse,
    updateWarehouse,
    deleteWarehouse,
    setSelectedWarehouseId,
    setActiveTab,
    formatCurrency,
    permissions,
  } = useData();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingWh, setEditingWh] = useState<Warehouse | null>(null);

  const initialWhForm = {
    name: '',
    code: '',
    location: '',
    managerName: '',
    contact: '',
    email: '',
    status: 'ACTIVE' as const,
  };

  const [formData, setFormData] = useState(initialWhForm);

  const handleOpenAdd = () => {
    setFormData({
      ...initialWhForm,
      code: `WH-${Math.floor(10 + Math.random() * 90)}`,
    });
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (wh: Warehouse) => {
    setEditingWh(wh);
    setFormData({
      name: wh.name,
      code: wh.code,
      location: wh.location,
      managerName: wh.managerName || '',
      contact: wh.contact || '',
      email: wh.email,
      status: wh.status,
    });
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.code.trim()) {
      alert('Warehouse name and code are required.');
      return;
    }

    if (editingWh) {
      updateWarehouse(editingWh.id, {
        name: formData.name,
        code: formData.code,
        location: formData.location,
        managerName: formData.managerName,
        contact: formData.contact,
        email: formData.email,
        status: formData.status,
      });
      setEditingWh(null);
    } else {
      addWarehouse({
        name: formData.name,
        code: formData.code,
        location: formData.location,
        managerName: formData.managerName,
        contact: formData.contact,
        email: formData.email,
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
            <Building2 className="w-6 h-6 text-indigo-400" />
            <span>Multi-Warehouse & Distribution Centers</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage physical depots, cross-docking facilities, rack locations, and site leadership.
          </p>
        </div>

        {permissions.canManageInventory && (
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add Distribution Center</span>
          </button>
        )}
      </div>

      {/* Warehouse Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {warehouses.map((wh) => {
          const whProducts = products.filter((p) => p.warehouseId === wh.id);
          const totalUnits = whProducts.reduce((sum, p) => sum + p.currentStock, 0);
          const totalValuation = whProducts.reduce((sum, p) => sum + p.currentStock * p.purchasePrice, 0);
          const lowStockCount = whProducts.filter((p) => p.currentStock > 0 && p.currentStock <= p.minStock).length;

          return (
            <div
              key={wh.id}
              className="p-5 rounded-2xl bg-[#161616] border border-white/5 flex flex-col justify-between hover:border-white/10 transition-colors shadow-sm space-y-4"
            >
              {/* Header of card */}
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-[#111111] text-indigo-400 border border-white/5">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-white">{wh.name}</h3>
                      <span className="text-[10px] font-mono font-medium text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded border border-indigo-500/20">
                        {wh.code}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    {permissions.canManageInventory && (
                      <>
                        <button
                          onClick={() => handleOpenEdit(wh)}
                          className="p-1.5 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                          title="Edit Warehouse"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        {warehouses.length > 1 && (
                          <button
                            onClick={() => {
                              if (confirm(`Delete warehouse "${wh.name}"?`)) {
                                deleteWarehouse(wh.id);
                              }
                            }}
                            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-white/5 rounded-lg transition-colors"
                            title="Delete Warehouse"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>

                <div className="mt-3 text-xs text-slate-400 space-y-1.5">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <span className="truncate">{wh.location}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <UserCheck className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <span className="text-slate-300 font-medium">{wh.managerName || wh.manager} (Site Manager)</span>
                  </div>
                  <div className="flex items-center gap-3 text-[11px]">
                    <span className="flex items-center gap-1 font-mono text-slate-500">
                      <Phone className="w-3 h-3 text-slate-500" /> {wh.contact || wh.phone}
                    </span>
                  </div>
                </div>
              </div>

              {/* Metrics block */}
              <div className="p-3.5 rounded-xl bg-[#111111] border border-white/5 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">Total SKUs Stored</span>
                  <span className="font-mono font-medium text-slate-200">{whProducts.length} items</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">Physical Stock Units</span>
                  <span className="font-mono font-medium text-sky-400">{totalUnits.toLocaleString()} units</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">Inventory Valuation</span>
                  <span className="font-mono font-medium text-emerald-400">{formatCurrency(totalValuation)}</span>
                </div>
                {lowStockCount > 0 && (
                  <div className="flex items-center justify-between text-[11px] text-amber-400 pt-1.5 border-t border-white/5">
                    <span>Low Stock SKUs</span>
                    <span className="font-mono font-bold">{lowStockCount} items</span>
                  </div>
                )}
              </div>

              {/* Action */}
              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={() => {
                    setSelectedWarehouseId(wh.id);
                    setActiveTab('products');
                  }}
                  className="flex-1 py-2 text-xs font-medium text-slate-300 bg-[#111111] hover:bg-white/5 border border-white/10 rounded-lg transition-colors text-center"
                >
                  View Facility Products
                </button>
                <button
                  onClick={() => {
                    setSelectedWarehouseId(wh.id);
                    setActiveTab('inventory');
                  }}
                  className="p-2 text-indigo-400 bg-indigo-500/10 hover:bg-indigo-500/20 rounded-lg border border-indigo-500/20 transition-colors"
                  title="Manage Stock"
                >
                  <ArrowRightLeft className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add / Edit Warehouse Modal */}
      {(isAddModalOpen || editingWh) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-100">
          <div className="w-full max-w-md bg-[#111111] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-[#111111]">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-indigo-400" />
                <h3 className="text-sm font-semibold text-white">
                  {editingWh ? `Edit Warehouse: ${editingWh.name}` : 'Add New Warehouse / Depot'}
                </h3>
              </div>
              <button
                onClick={() => {
                  setIsAddModalOpen(false);
                  setEditingWh(null);
                }}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-3.5">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300">Facility / Warehouse Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. East Coast Logistics Hub"
                  className="w-full px-3 py-2 text-xs bg-[#1A1A1A] border border-white/10 rounded-lg text-slate-100 focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300">Warehouse Identifier Code *</label>
                <input
                  type="text"
                  required
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  placeholder="WH-03"
                  className="w-full px-3 py-2 text-xs bg-[#1A1A1A] border border-white/10 rounded-lg text-slate-100 font-mono focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300">Physical Address & City</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="e.g. 842 Logistics Way, Dallas, TX"
                  className="w-full px-3 py-2 text-xs bg-[#1A1A1A] border border-white/10 rounded-lg text-slate-100 focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300">Site Manager Name</label>
                <input
                  type="text"
                  value={formData.managerName}
                  onChange={(e) => setFormData({ ...formData, managerName: e.target.value })}
                  placeholder="e.g. Robert Vance"
                  className="w-full px-3 py-2 text-xs bg-[#1A1A1A] border border-white/10 rounded-lg text-slate-100 focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300">Contact Phone</label>
                  <input
                    type="text"
                    value={formData.contact}
                    onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                    placeholder="+1 (555) 019-2831"
                    className="w-full px-3 py-2 text-xs bg-[#1A1A1A] border border-white/10 rounded-lg text-slate-100 focus:border-indigo-500 focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300">Contact Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="warehouse@nexus.com"
                    className="w-full px-3 py-2 text-xs bg-[#1A1A1A] border border-white/10 rounded-lg text-slate-100 focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setEditingWh(null);
                  }}
                  className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white bg-[#1A1A1A] hover:bg-white/5 border border-white/10 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors"
                >
                  {editingWh ? 'Save Facility' : 'Create Warehouse'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
