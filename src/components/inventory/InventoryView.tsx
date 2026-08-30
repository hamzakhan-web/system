import React, { useState, useMemo } from 'react';
import {
  Boxes,
  ArrowRightLeft,
  SlidersHorizontal,
  Search,
  Filter,
  Download,
  Plus,
  AlertTriangle,
  CheckCircle2,
  Building2,
  Layers,
  History,
  TrendingDown,
  TrendingUp,
  FileSpreadsheet,
  X,
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { exportToCsv } from '../../utils/export';

export const InventoryView: React.FC = () => {
  const {
    products,
    categories,
    warehouses,
    transactions,
    selectedWarehouseId,
    adjustStock,
    transferStock,
    formatCurrency,
    permissions,
  } = useData();

  const [activeSubTab, setActiveSubTab] = useState<'levels' | 'ledger'>('levels');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState('ALL');

  // Modals
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);

  // Adjustment Form State
  const [adjustForm, setAdjustForm] = useState({
    productId: products[0]?.id || '',
    warehouseId: warehouses[0]?.id || '',
    type: 'STOCK_IN' as 'STOCK_IN' | 'STOCK_OUT' | 'DAMAGED' | 'LOST' | 'CORRECTION',
    quantity: 10,
    unitCost: products[0]?.purchasePrice || 0,
    note: 'Physical cycle count adjustment',
  });

  // Transfer Form State
  const [transferForm, setTransferForm] = useState({
    productId: products[0]?.id || '',
    fromWarehouseId: warehouses[0]?.id || '',
    toWarehouseId: warehouses[1]?.id || '',
    quantity: 5,
    note: 'Inter-branch stock rebalance',
  });

  // Filtered Stock Levels
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (selectedWarehouseId !== 'ALL' && p.warehouseId !== selectedWarehouseId) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          p.name.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q) ||
          p.barcode.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [products, selectedWarehouseId, searchQuery]);

  // Filtered Transactions Ledger
  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      if (selectedWarehouseId !== 'ALL' && tx.warehouseId !== selectedWarehouseId) return false;
      if (selectedTypeFilter !== 'ALL' && tx.type !== selectedTypeFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          tx.productName.toLowerCase().includes(q) ||
          tx.productSku.toLowerCase().includes(q) ||
          tx.referenceNumber.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [transactions, selectedWarehouseId, selectedTypeFilter, searchQuery]);

  // Handle Adjustment Submit
  const handleExecuteAdjustment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustForm.productId || adjustForm.quantity <= 0) {
      alert('Please specify a valid product and positive quantity.');
      return;
    }

    adjustStock({
      productId: adjustForm.productId,
      warehouseId: adjustForm.warehouseId,
      type: adjustForm.type,
      quantity: Number(adjustForm.quantity),
      unitCost: Number(adjustForm.unitCost),
      note: adjustForm.note,
    });

    setIsAdjustModalOpen(false);
  };

  // Handle Transfer Submit
  const handleExecuteTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    if (transferForm.fromWarehouseId === transferForm.toWarehouseId) {
      alert('Source and destination warehouses cannot be the same.');
      return;
    }
    if (transferForm.quantity <= 0) {
      alert('Please specify a positive quantity to transfer.');
      return;
    }

    transferStock({
      productId: transferForm.productId,
      fromWarehouseId: transferForm.fromWarehouseId,
      toWarehouseId: transferForm.toWarehouseId,
      quantity: Number(transferForm.quantity),
      note: transferForm.note,
    });

    setIsTransferModalOpen(false);
  };

  const handleExportLedgerCsv = () => {
    const rows = [
      ['Date & Time', 'Reference #', 'Type', 'Product SKU', 'Product Name', 'Warehouse', 'Qty Change', 'Prev Stock', 'New Stock', 'Unit Cost', 'Total Value', 'Notes', 'User'],
      ...filteredTransactions.map((tx) => [
        new Date(tx.date).toLocaleString(),
        tx.referenceNumber,
        tx.type,
        tx.productSku,
        tx.productName,
        tx.warehouseName,
        tx.quantity,
        tx.previousStock,
        tx.newStock,
        tx.unitCost,
        tx.totalValue,
        tx.note,
        tx.userName,
      ]),
    ];
    exportToCsv('inventory_movement_ledger', rows);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150 text-slate-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <Boxes className="w-6 h-6 text-sky-400" />
            <span>Stock Control & Movement Ledger</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time multi-location inventory reconciliation, manual adjustments, and immutable audit logs.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5">
          {permissions.canAdjustStock && (
            <>
              <button
                onClick={() => setIsAdjustModalOpen(true)}
                className="flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-slate-300 bg-[#161616] hover:bg-white/5 border border-white/5 rounded-lg transition-colors"
              >
                <SlidersHorizontal className="w-4 h-4 text-amber-400" />
                <span>Stock Adjust / Audit</span>
              </button>

              <button
                onClick={() => setIsTransferModalOpen(true)}
                className="flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-colors"
              >
                <ArrowRightLeft className="w-4 h-4" />
                <span>Inter-Branch Transfer</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Sub tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-[#161616] border border-white/5 rounded-2xl">
        {/* Sub tab toggle */}
        <div className="flex items-center p-1 bg-[#111111] rounded-xl border border-white/5">
          <button
            onClick={() => setActiveSubTab('levels')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-medium rounded-lg transition-colors ${
              activeSubTab === 'levels'
                ? 'bg-indigo-600 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Boxes className="w-3.5 h-3.5" />
            <span>Live Stock Balances</span>
          </button>
          <button
            onClick={() => setActiveSubTab('ledger')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-medium rounded-lg transition-colors ${
              activeSubTab === 'ledger'
                ? 'bg-indigo-600 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Movement Audit Ledger ({transactions.length})</span>
          </button>
        </div>

        {/* Search & filters */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search product, SKU, reference..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-[#1A1A1A] border border-white/10 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {activeSubTab === 'ledger' && (
            <select
              value={selectedTypeFilter}
              onChange={(e) => setSelectedTypeFilter(e.target.value)}
              className="px-3 py-1.5 text-xs bg-[#1A1A1A] border border-white/10 rounded-lg text-slate-200 focus:outline-none"
            >
              <option value="ALL" className="bg-[#111111]">All Event Types</option>
              <option value="SALE" className="bg-[#111111]">Sales (Out)</option>
              <option value="PURCHASE" className="bg-[#111111]">Purchases (In)</option>
              <option value="STOCK_IN" className="bg-[#111111]">Manual Stock In</option>
              <option value="STOCK_OUT" className="bg-[#111111]">Manual Stock Out</option>
              <option value="TRANSFER_IN" className="bg-[#111111]">Transfer In</option>
              <option value="TRANSFER_OUT" className="bg-[#111111]">Transfer Out</option>
              <option value="DAMAGED" className="bg-[#111111]">Damaged / Write-off</option>
              <option value="LOST" className="bg-[#111111]">Lost / Stolen</option>
              <option value="CORRECTION" className="bg-[#111111]">Audit Correction</option>
            </select>
          )}

          <button
            onClick={handleExportLedgerCsv}
            className="p-2 text-slate-300 bg-[#1A1A1A] border border-white/10 hover:bg-white/5 rounded-lg transition-colors"
            title="Download CSV report"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Sub Tab 1: Live Stock Balances Table */}
      {activeSubTab === 'levels' && (
        <div className="rounded-2xl bg-[#161616] border border-white/5 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-white/5 bg-[#111111] text-slate-500 font-mono text-[10px] uppercase">
                <tr>
                  <th className="py-3 px-4 font-medium">SKU & Item Name</th>
                  <th className="py-3 px-4 font-medium">Warehouse / Location</th>
                  <th className="py-3 px-4 font-medium">Safety Min</th>
                  <th className="py-3 px-4 font-medium">Current Quantity</th>
                  <th className="py-3 px-4 font-medium">Stock Health</th>
                  <th className="py-3 px-4 font-medium">Unit Cost</th>
                  <th className="py-3 px-4 font-medium">Total Stock Valuation</th>
                  <th className="py-3 px-4 font-medium text-right">Quick Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-slate-300">
                {filteredProducts.map((p) => {
                  const wh = warehouses.find((w) => w.id === p.warehouseId);
                  const isOut = p.currentStock === 0;
                  const isLow = p.currentStock > 0 && p.currentStock <= p.minStock;
                  const totalVal = p.currentStock * p.purchasePrice;
                  const stockHealthPercent = Math.min(100, Math.round((p.currentStock / (p.maxStock || 100)) * 100));

                  return (
                    <tr key={p.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <img
                            src={p.image}
                            alt={p.name}
                            className="w-9 h-9 rounded-lg object-cover bg-[#1A1A1A] shrink-0 border border-white/5"
                          />
                          <div>
                            <p className="font-medium text-white truncate max-w-[200px]">{p.name}</p>
                            <p className="text-[10px] text-slate-500 font-mono">SKU: {p.sku}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-[11px]">
                        <p className="font-medium text-slate-200">{wh?.name || 'Global'}</p>
                        <p className="text-slate-500 font-mono">{p.rackLocation || 'Rack A'}</p>
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-400">
                        {p.minStock} {p.unit}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-sm">
                        <span className={isOut ? 'text-rose-400' : isLow ? 'text-amber-400' : 'text-slate-100'}>
                          {p.currentStock} {p.unit}
                        </span>
                      </td>
                      <td className="py-3 px-4 min-w-[140px]">
                        <div className="space-y-1">
                          <div className="flex justify-between text-[10px] text-slate-500">
                            <span>{isOut ? 'Depleted' : isLow ? 'Low Reserve' : 'Healthy'}</span>
                            <span className="font-mono">{stockHealthPercent}%</span>
                          </div>
                          <div className="h-1.5 w-full bg-[#1A1A1A] rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${
                                isOut ? 'bg-rose-500 w-0' : isLow ? 'bg-amber-500' : 'bg-emerald-500'
                              }`}
                              style={{ width: `${Math.max(4, stockHealthPercent)}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-400">{formatCurrency(p.purchasePrice)}</td>
                      <td className="py-3 px-4 font-mono font-medium text-slate-200">{formatCurrency(totalVal)}</td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => {
                            setAdjustForm((prev) => ({
                              ...prev,
                              productId: p.id,
                              warehouseId: p.warehouseId,
                              unitCost: p.purchasePrice,
                            }));
                            setIsAdjustModalOpen(true);
                          }}
                          className="px-2.5 py-1 text-[11px] font-medium text-indigo-400 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 rounded-lg transition-colors"
                        >
                          Adjust
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Sub Tab 2: Transaction Audit Ledger */}
      {activeSubTab === 'ledger' && (
        <div className="rounded-2xl bg-[#161616] border border-white/5 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-white/5 bg-[#111111] text-slate-500 font-mono text-[10px] uppercase">
                <tr>
                  <th className="py-3 px-4 font-medium">Timestamp</th>
                  <th className="py-3 px-4 font-medium">Reference</th>
                  <th className="py-3 px-4 font-medium">Event Type</th>
                  <th className="py-3 px-4 font-medium">Product SKU & Name</th>
                  <th className="py-3 px-4 font-medium">Warehouse</th>
                  <th className="py-3 px-4 font-medium">Qty Delta</th>
                  <th className="py-3 px-4 font-medium">Before → After</th>
                  <th className="py-3 px-4 font-medium">Value Delta</th>
                  <th className="py-3 px-4 font-medium">Logged Reason & User</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-slate-300">
                {filteredTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-slate-500 text-xs">
                      No stock movement ledger transactions found.
                    </td>
                  </tr>
                ) : (
                  filteredTransactions.map((tx) => {
                    const isPositive = tx.quantity > 0;
                    return (
                      <tr key={tx.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="py-3 px-4 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                          {new Date(tx.date).toLocaleDateString()} {new Date(tx.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="py-3 px-4 font-mono font-medium text-indigo-400 text-[11px]">
                          {tx.referenceNumber}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 text-[10px] font-semibold rounded-md font-mono ${
                              tx.type === 'SALE'
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                : tx.type === 'PURCHASE'
                                ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20'
                                : tx.type.includes('TRANSFER')
                                ? 'bg-violet-500/10 text-violet-400 border border-violet-500/20'
                                : tx.type === 'DAMAGED' || tx.type === 'LOST'
                                ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                                : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            }`}
                          >
                            {tx.type.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <p className="font-medium text-white truncate max-w-[180px]">{tx.productName}</p>
                          <p className="text-[10px] font-mono text-slate-500">{tx.productSku}</p>
                        </td>
                        <td className="py-3 px-4 text-[11px] text-slate-300">{tx.warehouseName}</td>
                        <td className="py-3 px-4 font-mono font-bold text-sm">
                          <span className={isPositive ? 'text-emerald-400' : 'text-rose-400'}>
                            {isPositive ? `+${tx.quantity}` : tx.quantity}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono text-[11px] text-slate-500">
                          {tx.previousStock} → <strong className="text-slate-200">{tx.newStock}</strong>
                        </td>
                        <td className="py-3 px-4 font-mono text-[11px] font-medium text-slate-300">
                          {formatCurrency(tx.totalValue)}
                        </td>
                        <td className="py-3 px-4 text-[11px]">
                          <p className="text-slate-300 truncate max-w-[180px]">{tx.note}</p>
                          <p className="text-[10px] text-slate-500 font-mono">By: {tx.userName}</p>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Stock Adjustment Modal */}
      {isAdjustModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-100">
          <div className="w-full max-w-lg bg-[#111111] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-[#161616]">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-5 h-5 text-amber-400" />
                <h3 className="text-sm font-semibold text-white">Inventory Stock Adjustment / Audit</h3>
              </div>
              <button
                onClick={() => setIsAdjustModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleExecuteAdjustment} className="p-6 space-y-4">
              {/* Product selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300">Product SKU *</label>
                <select
                  value={adjustForm.productId}
                  onChange={(e) => {
                    const prod = products.find((p) => p.id === e.target.value);
                    setAdjustForm({
                      ...adjustForm,
                      productId: e.target.value,
                      warehouseId: prod?.warehouseId || adjustForm.warehouseId,
                      unitCost: prod?.purchasePrice || adjustForm.unitCost,
                    });
                  }}
                  className="w-full px-3 py-2 text-xs bg-[#1A1A1A] border border-white/10 rounded-lg text-slate-100 focus:border-indigo-500 focus:outline-none"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id} className="bg-[#111111]">
                      {p.name} ({p.sku}) — Stock: {p.currentStock} {p.unit}
                    </option>
                  ))}
                </select>
              </div>

              {/* Warehouse selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300">Target Warehouse Facility</label>
                <select
                  value={adjustForm.warehouseId}
                  onChange={(e) => setAdjustForm({ ...adjustForm, warehouseId: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-[#1A1A1A] border border-white/10 rounded-lg text-slate-100 focus:border-indigo-500 focus:outline-none"
                >
                  {warehouses.map((w) => (
                    <option key={w.id} value={w.id} className="bg-[#111111]">
                      {w.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Adjustment Type */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300">Adjustment Type</label>
                  <select
                    value={adjustForm.type}
                    onChange={(e) => setAdjustForm({ ...adjustForm, type: e.target.value as any })}
                    className="w-full px-3 py-2 text-xs bg-[#1A1A1A] border border-white/10 rounded-lg text-slate-100 focus:border-indigo-500 focus:outline-none"
                  >
                    <option value="STOCK_IN" className="bg-[#111111]">Stock In (Found/Bonus)</option>
                    <option value="STOCK_OUT" className="bg-[#111111]">Stock Out (Manual Removal)</option>
                    <option value="DAMAGED" className="bg-[#111111]">Damaged / Broken</option>
                    <option value="LOST" className="bg-[#111111]">Lost / Discrepancy</option>
                    <option value="CORRECTION" className="bg-[#111111]">Audit Count Set</option>
                  </select>
                </div>

                {/* Quantity */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300">
                    {adjustForm.type === 'CORRECTION' ? 'New Exact Count' : 'Quantity (+/-)'}
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={adjustForm.quantity}
                    onChange={(e) => setAdjustForm({ ...adjustForm, quantity: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs bg-[#1A1A1A] border border-white/10 rounded-lg text-slate-100 font-mono focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Note / Justification */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300">Audit Justification Note *</label>
                <input
                  type="text"
                  required
                  value={adjustForm.note}
                  onChange={(e) => setAdjustForm({ ...adjustForm, note: e.target.value })}
                  placeholder="e.g. Annual stocktake discrepancy write-off"
                  className="w-full px-3 py-2 text-xs bg-[#1A1A1A] border border-white/10 rounded-lg text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setIsAdjustModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-medium text-white bg-amber-600 hover:bg-amber-700 rounded-lg shadow-sm transition-colors"
                >
                  Commit Stock Ledger Update
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Stock Transfer Modal */}
      {isTransferModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-100">
          <div className="w-full max-w-lg bg-[#111111] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-[#161616]">
              <div className="flex items-center gap-2">
                <ArrowRightLeft className="w-5 h-5 text-indigo-400" />
                <h3 className="text-sm font-semibold text-white">Inter-Warehouse Stock Transfer</h3>
              </div>
              <button
                onClick={() => setIsTransferModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleExecuteTransfer} className="p-6 space-y-4">
              {/* Product */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300">Select Transfer Item *</label>
                <select
                  value={transferForm.productId}
                  onChange={(e) => setTransferForm({ ...transferForm, productId: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-[#1A1A1A] border border-white/10 rounded-lg text-slate-100 focus:border-indigo-500 focus:outline-none"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id} className="bg-[#111111]">
                      {p.name} ({p.sku}) — Available: {p.currentStock} {p.unit}
                    </option>
                  ))}
                </select>
              </div>

              {/* Warehouses From / To */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300">From Warehouse</label>
                  <select
                    value={transferForm.fromWarehouseId}
                    onChange={(e) => setTransferForm({ ...transferForm, fromWarehouseId: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-[#1A1A1A] border border-white/10 rounded-lg text-slate-100 focus:border-indigo-500 focus:outline-none"
                  >
                    {warehouses.map((w) => (
                      <option key={w.id} value={w.id} className="bg-[#111111]">
                        {w.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300">To Warehouse</label>
                  <select
                    value={transferForm.toWarehouseId}
                    onChange={(e) => setTransferForm({ ...transferForm, toWarehouseId: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-[#1A1A1A] border border-white/10 rounded-lg text-slate-100 focus:border-indigo-500 focus:outline-none"
                  >
                    {warehouses.map((w) => (
                      <option key={w.id} value={w.id} className="bg-[#111111]">
                        {w.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Quantity */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300">Quantity to Transfer</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={transferForm.quantity}
                  onChange={(e) => setTransferForm({ ...transferForm, quantity: Number(e.target.value) })}
                  className="w-full px-3 py-2 text-xs bg-[#1A1A1A] border border-white/10 rounded-lg text-slate-100 font-mono focus:border-indigo-500 focus:outline-none"
                />
              </div>

              {/* Note */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300">Transfer Manifest Note</label>
                <input
                  type="text"
                  value={transferForm.note}
                  onChange={(e) => setTransferForm({ ...transferForm, note: e.target.value })}
                  placeholder="e.g. Branch replenishment dispatch"
                  className="w-full px-3 py-2 text-xs bg-[#1A1A1A] border border-white/10 rounded-lg text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setIsTransferModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-colors"
                >
                  Dispatch Stock Transfer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
