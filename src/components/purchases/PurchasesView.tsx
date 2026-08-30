import React, { useState, useMemo } from 'react';
import {
  Truck,
  Plus,
  Search,
  Filter,
  Download,
  CheckCircle2,
  AlertCircle,
  Eye,
  Trash2,
  Building2,
  Calendar,
  X,
  CreditCard,
  DollarSign,
  Package,
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { Purchase, PurchaseItem } from '../../types';
import { exportToCsv } from '../../utils/export';

export const PurchasesView: React.FC = () => {
  const {
    purchases,
    suppliers,
    products,
    warehouses,
    selectedWarehouseId,
    createPurchase,
    recordPurchasePayment,
    formatCurrency,
    permissions,
  } = useData();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPO, setSelectedPO] = useState<Purchase | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // New PO State
  const [supplierId, setSupplierId] = useState(suppliers[0]?.id || '');
  const [warehouseId, setWarehouseId] = useState(warehouses[0]?.id || '');
  const [poItems, setPoItems] = useState<{ productId: string; quantity: number; unitCost: number }[]>([
    { productId: products[0]?.id || '', quantity: 20, unitCost: products[0]?.purchasePrice || 100 },
  ]);
  const [taxRate, setTaxRate] = useState(8.0);
  const [discount, setDiscount] = useState(0);
  const [paidAmount, setPaidAmount] = useState(0);
  const [notes, setNotes] = useState('');

  // Payment settle modal
  const [paymentModalPO, setPaymentModalPO] = useState<Purchase | null>(null);
  const [settleAmount, setSettleAmount] = useState(0);
  const [settleMethod, setSettleMethod] = useState<'BANK_TRANSFER' | 'CASH' | 'CARD'>('BANK_TRANSFER');
  const [settleNote, setSettleNote] = useState('');

  const filteredPurchases = useMemo(() => {
    return purchases.filter((p) => {
      if (selectedWarehouseId !== 'ALL' && p.warehouseId !== selectedWarehouseId) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          p.poNumber.toLowerCase().includes(q) ||
          p.supplierName.toLowerCase().includes(q) ||
          p.id.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [purchases, selectedWarehouseId, searchQuery]);

  const totalPOVolume = filteredPurchases.reduce((sum, p) => sum + p.grandTotal, 0);
  const totalPaidVolume = filteredPurchases.reduce((sum, p) => sum + p.paidAmount, 0);
  const totalPayablesDue = totalPOVolume - totalPaidVolume;

  // New PO Calculations
  const calculatedSubtotal = poItems.reduce((sum, it) => sum + it.quantity * it.unitCost, 0);
  const calculatedTax = (calculatedSubtotal * taxRate) / 100;
  const calculatedGrandTotal = calculatedSubtotal + calculatedTax - discount;

  const handleAddItemRow = () => {
    setPoItems([
      ...poItems,
      { productId: products[0]?.id || '', quantity: 10, unitCost: products[0]?.purchasePrice || 50 },
    ]);
  };

  const handleRemoveItemRow = (idx: number) => {
    setPoItems(poItems.filter((_, i) => i !== idx));
  };

  const handleCreatePOSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (poItems.length === 0) {
      alert('Please add at least one item to this purchase order.');
      return;
    }

    const items: PurchaseItem[] = poItems.map((it) => {
      const prod = products.find((p) => p.id === it.productId);
      return {
        productId: it.productId,
        productName: prod?.name || 'Item',
        productSku: prod?.sku || 'SKU',
        quantity: Number(it.quantity),
        unitCost: Number(it.unitCost),
        total: Number(it.quantity) * Number(it.unitCost),
      };
    });

    createPurchase({
      supplierId,
      warehouseId,
      items,
      subtotal: calculatedSubtotal,
      tax: calculatedTax,
      discount,
      grandTotal: calculatedGrandTotal,
      paidAmount: Number(paidAmount),
      paymentMethod: paidAmount > 0 ? 'BANK_TRANSFER' : 'CREDIT',
      notes,
    });

    setIsAddModalOpen(false);
  };

  const handleSettlePaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentModalPO || settleAmount <= 0) return;

    recordPurchasePayment(paymentModalPO.id, settleAmount, settleMethod, settleNote);
    setPaymentModalPO(null);
  };

  const handleExportCsv = () => {
    const rows = [
      ['PO Number', 'Date', 'Supplier', 'Warehouse', 'Status', 'Grand Total', 'Paid Amount', 'Payable Due'],
      ...filteredPurchases.map((p) => {
        const wh = warehouses.find((w) => w.id === p.warehouseId)?.name || 'Global';
        return [
          p.poNumber,
          new Date(p.date).toLocaleDateString(),
          p.supplierName,
          wh,
          p.status,
          p.grandTotal,
          p.paidAmount,
          p.grandTotal - p.paidAmount,
        ];
      }),
    ];
    exportToCsv('purchase_orders_ledger', rows);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150 text-slate-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <Truck className="w-6 h-6 text-sky-400" />
            <span>Procurement & Purchase Orders (PO)</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Supplier restock orders, goods receiving confirmation, and accounts payable ledger.
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
          {permissions.canManagePurchases && (
            <button
              onClick={() => {
                setPaidAmount(0);
                setIsAddModalOpen(true);
              }}
              className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Create Purchase Order</span>
            </button>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-[#161616] border border-white/5 flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-slate-500">Total Procurement Value</span>
            <p className="text-xl font-bold text-white mt-1">{formatCurrency(totalPOVolume)}</p>
            <p className="text-[11px] text-slate-500 mt-0.5">{filteredPurchases.length} total orders</p>
          </div>
          <div className="p-3 bg-sky-500/10 text-sky-400 rounded-xl">
            <Truck className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[#161616] border border-white/5 flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-slate-500">Settled to Vendors</span>
            <p className="text-xl font-bold text-emerald-400 mt-1">{formatCurrency(totalPaidVolume)}</p>
            <p className="text-[11px] text-slate-500 mt-0.5">Paid via Wire / Cash</p>
          </div>
          <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[#161616] border border-white/5 flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-slate-500">Accounts Payable Owed</span>
            <p className="text-xl font-bold text-amber-400 mt-1">{formatCurrency(totalPayablesDue)}</p>
            <p className="text-[11px] text-slate-500 mt-0.5">Pending vendor settlement</p>
          </div>
          <div className="p-3 bg-amber-500/10 text-amber-400 rounded-xl">
            <AlertCircle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="p-3 rounded-2xl bg-[#161616] border border-white/5 flex items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by PO number (e.g. PO-2026), vendor name..."
            className="w-full pl-9 pr-3.5 py-2 text-xs bg-[#1A1A1A] border border-white/10 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      {/* PO Table */}
      <div className="rounded-2xl bg-[#161616] border border-white/5 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-white/5 bg-[#111111] text-slate-500 font-mono text-[10px] uppercase">
              <tr>
                <th className="py-3 px-4 font-medium">PO #</th>
                <th className="py-3 px-4 font-medium">Order Date</th>
                <th className="py-3 px-4 font-medium">Supplier Vendor</th>
                <th className="py-3 px-4 font-medium">Destination Facility</th>
                <th className="py-3 px-4 font-medium">Total Cost</th>
                <th className="py-3 px-4 font-medium">Paid / Due</th>
                <th className="py-3 px-4 font-medium">PO Status</th>
                <th className="py-3 px-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-slate-300">
              {filteredPurchases.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500 text-xs">
                    No purchase orders found.
                  </td>
                </tr>
              ) : (
                filteredPurchases.map((p) => {
                  const wh = warehouses.find((w) => w.id === p.warehouseId);
                  const due = Math.max(0, p.grandTotal - p.paidAmount);

                  return (
                    <tr key={p.id} className="hover:bg-white/[0.02] transition-colors group">
                      <td className="py-3 px-4 font-mono font-medium text-sky-400">{p.poNumber}</td>
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-500">
                        {new Date(p.date).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4">
                        <p className="font-medium text-white">{p.supplierName}</p>
                        <p className="text-[10px] text-slate-500 font-mono">{p.items.length} item line(s)</p>
                      </td>
                      <td className="py-3 px-4 text-slate-300">{wh?.name || 'Global'}</td>
                      <td className="py-3 px-4 font-mono font-medium text-slate-100">{formatCurrency(p.grandTotal)}</td>
                      <td className="py-3 px-4 font-mono text-[11px]">
                        <p className="text-emerald-400 font-bold">{formatCurrency(p.paidAmount)}</p>
                        {due > 0 && <p className="text-amber-400">Due: {formatCurrency(due)}</p>}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 text-[10px] font-semibold rounded-md font-mono ${
                            p.status === 'RECEIVED'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          }`}
                        >
                          {p.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {due > 0 && (
                            <button
                              onClick={() => {
                                setPaymentModalPO(p);
                                setSettleAmount(due);
                                setSettleNote(`Settlement for ${p.poNumber}`);
                              }}
                              className="px-2.5 py-1 text-[11px] font-medium text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 rounded-lg transition-colors"
                            >
                              Settle Pay
                            </button>
                          )}
                          <button
                            onClick={() => setSelectedPO(p)}
                            className="p-1.5 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                            title="View PO Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Purchase Order Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-100">
          <div className="w-full max-w-3xl bg-[#111111] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-[#161616]">
              <div className="flex items-center gap-2">
                <Truck className="w-5 h-5 text-sky-400" />
                <h3 className="text-sm font-semibold text-white">Create Inbound Purchase Order (PO)</h3>
              </div>
              <button onClick={() => setIsAddModalOpen(false)} className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePOSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Supplier */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300">Supplier Vendor *</label>
                  <select
                    value={supplierId}
                    onChange={(e) => setSupplierId(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-[#1A1A1A] border border-white/10 rounded-lg text-slate-100 focus:border-indigo-500 focus:outline-none"
                  >
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id} className="bg-[#111111]">
                        {s.name} ({s.company})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Receiving Warehouse */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300">Receiving Warehouse Destination *</label>
                  <select
                    value={warehouseId}
                    onChange={(e) => setWarehouseId(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-[#1A1A1A] border border-white/10 rounded-lg text-slate-100 focus:border-indigo-500 focus:outline-none"
                  >
                    {warehouses.map((w) => (
                      <option key={w.id} value={w.id} className="bg-[#111111]">
                        {w.name} ({w.code})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Items Table */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-slate-300">PO Line Items</label>
                  <button
                    type="button"
                    onClick={handleAddItemRow}
                    className="text-xs font-medium text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Product Item
                  </button>
                </div>

                <div className="space-y-2">
                  {poItems.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2 p-2 rounded-xl bg-[#161616] border border-white/5">
                      <select
                        value={item.productId}
                        onChange={(e) => {
                          const prod = products.find((p) => p.id === e.target.value);
                          const updated = [...poItems];
                          updated[idx].productId = e.target.value;
                          if (prod) updated[idx].unitCost = prod.purchasePrice;
                          setPoItems(updated);
                        }}
                        className="flex-1 px-2.5 py-1.5 text-xs bg-[#1A1A1A] border border-white/10 rounded-lg text-slate-100 focus:outline-none"
                      >
                        {products.map((p) => (
                          <option key={p.id} value={p.id} className="bg-[#111111]">
                            {p.name} ({p.sku})
                          </option>
                        ))}
                      </select>

                      <div className="w-24">
                        <input
                          type="number"
                          min="1"
                          required
                          value={item.quantity}
                          onChange={(e) => {
                            const updated = [...poItems];
                            updated[idx].quantity = Number(e.target.value);
                            setPoItems(updated);
                          }}
                          placeholder="Qty"
                          className="w-full px-2 py-1.5 text-xs bg-[#1A1A1A] border border-white/10 rounded-lg text-slate-100 font-mono text-center"
                        />
                      </div>

                      <div className="w-28">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          required
                          value={item.unitCost}
                          onChange={(e) => {
                            const updated = [...poItems];
                            updated[idx].unitCost = Number(e.target.value);
                            setPoItems(updated);
                          }}
                          placeholder="Cost $"
                          className="w-full px-2 py-1.5 text-xs bg-[#1A1A1A] border border-white/10 rounded-lg text-slate-100 font-mono text-right"
                        />
                      </div>

                      <div className="w-24 text-right font-mono text-xs font-semibold text-slate-200">
                        {formatCurrency(item.quantity * item.unitCost)}
                      </div>

                      {poItems.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveItemRow(idx)}
                          className="p-1 text-slate-400 hover:text-rose-400"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Totals & Notes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-white/5">
                <div className="space-y-2">
                  <div className="space-y-1">
                    <label className="text-xs text-slate-300 font-medium">Advance Payment Paid Now ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max={calculatedGrandTotal}
                      value={paidAmount}
                      onChange={(e) => setPaidAmount(Number(e.target.value))}
                      className="w-full px-3 py-2 text-xs bg-[#1A1A1A] border border-white/10 rounded-lg text-slate-100 font-mono focus:border-indigo-500 focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-slate-300 font-medium">PO Notes / Terms</label>
                    <input
                      type="text"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="e.g. Net 30 terms, FOB origin"
                      className="w-full px-3 py-2 text-xs bg-[#1A1A1A] border border-white/10 rounded-lg text-slate-100 focus:border-indigo-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-[#161616] border border-white/5 space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-400">
                    <span>Subtotal:</span>
                    <span className="font-mono">{formatCurrency(calculatedSubtotal)}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Tax (8%):</span>
                    <span className="font-mono">{formatCurrency(calculatedTax)}</span>
                  </div>
                  <div className="flex justify-between text-sm font-bold text-white pt-2 border-t border-white/5">
                    <span>Grand Total:</span>
                    <span className="font-mono text-sky-400">{formatCurrency(calculatedGrandTotal)}</span>
                  </div>
                  <div className="flex justify-between text-xs text-amber-400">
                    <span>Payable Balance:</span>
                    <span className="font-mono">{formatCurrency(calculatedGrandTotal - paidAmount)}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-medium text-white bg-sky-600 hover:bg-sky-700 rounded-lg shadow-sm transition-colors"
                >
                  Authorize & Receive PO Stock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View PO Details Modal */}
      {selectedPO && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-100">
          <div className="w-full max-w-2xl bg-[#111111] border border-white/10 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white">Purchase Order {selectedPO.poNumber}</h3>
              <button onClick={() => setSelectedPO(null)} className="p-1 text-slate-400 hover:text-white rounded-lg transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 rounded-xl bg-[#161616] border border-white/5 text-xs space-y-2">
              <div className="flex justify-between">
                <span>Supplier: <strong className="text-slate-200">{selectedPO.supplierName}</strong></span>
                <span>Date: {new Date(selectedPO.date).toLocaleDateString()}</span>
              </div>
              <div>
                <span>Status: <strong className="text-emerald-400">{selectedPO.status}</strong></span>
              </div>
            </div>

            <div className="border border-white/5 rounded-xl overflow-hidden text-xs">
              <table className="w-full text-left">
                <thead className="bg-[#161616] text-slate-500 font-mono text-[10px] uppercase border-b border-white/5">
                  <tr>
                    <th className="p-2.5 font-medium">Product</th>
                    <th className="p-2.5 font-medium">SKU</th>
                    <th className="p-2.5 font-medium">Cost</th>
                    <th className="p-2.5 font-medium">Qty</th>
                    <th className="p-2.5 font-medium text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-slate-300">
                  {selectedPO.items.map((it, i) => (
                    <tr key={i}>
                      <td className="p-2.5 text-slate-200 font-medium">{it.productName}</td>
                      <td className="p-2.5 font-mono text-slate-500">{it.productSku}</td>
                      <td className="p-2.5 font-mono">{formatCurrency(it.unitCost)}</td>
                      <td className="p-2.5 font-mono font-bold">{it.quantity}</td>
                      <td className="p-2.5 font-mono font-medium text-right text-slate-100">{formatCurrency(it.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-between items-center text-xs pt-2 border-t border-white/5">
              <span className="font-semibold text-slate-200">Total PO Value: {formatCurrency(selectedPO.grandTotal)}</span>
              <button
                onClick={() => setSelectedPO(null)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Settle PO Payment Modal */}
      {paymentModalPO && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-100">
          <div className="w-full max-w-md bg-[#111111] border border-white/10 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white">Settle Vendor Payable for {paymentModalPO.poNumber}</h3>
              <button onClick={() => setPaymentModalPO(null)} className="p-1 text-slate-400 hover:text-white rounded-lg transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSettlePaymentSubmit} className="space-y-3.5">
              <div className="p-3 bg-[#161616] rounded-xl border border-white/5 text-xs flex justify-between">
                <span className="text-slate-400">Total Outstanding Payable:</span>
                <strong className="font-mono text-amber-400">
                  {formatCurrency(paymentModalPO.grandTotal - paymentModalPO.paidAmount)}
                </strong>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-300">Payment Amount ($) *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={paymentModalPO.grandTotal - paymentModalPO.paidAmount}
                  required
                  value={settleAmount}
                  onChange={(e) => setSettleAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs bg-[#1A1A1A] border border-white/10 rounded-lg text-slate-100 font-mono font-bold focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-300">Payment Method</label>
                <select
                  value={settleMethod}
                  onChange={(e) => setSettleMethod(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs bg-[#1A1A1A] border border-white/10 rounded-lg text-slate-100 focus:outline-none"
                >
                  <option value="BANK_TRANSFER" className="bg-[#111111]">Bank Wire Transfer</option>
                  <option value="CASH" className="bg-[#111111]">Cash</option>
                  <option value="CARD" className="bg-[#111111]">Company Card</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setPaymentModalPO(null)}
                  className="px-3 py-1.5 text-xs text-slate-400 hover:text-white bg-[#1A1A1A] hover:bg-white/5 border border-white/10 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-medium text-white bg-amber-600 hover:bg-amber-700 rounded-lg transition-colors"
                >
                  Settle Payable
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
