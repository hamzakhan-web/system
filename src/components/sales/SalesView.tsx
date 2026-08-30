import React, { useState, useMemo } from 'react';
import {
  Receipt,
  Search,
  Filter,
  Download,
  Printer,
  Eye,
  CreditCard,
  Building2,
  Calendar,
  DollarSign,
  TrendingUp,
  X,
  CheckCircle2,
  AlertCircle,
  Plus,
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { Sale } from '../../types';
import { exportToCsv, generateBarcodeSvgString } from '../../utils/export';

export const SalesView: React.FC = () => {
  const {
    sales,
    warehouses,
    selectedWarehouseId,
    recordSalePayment,
    formatCurrency,
    setActiveTab,
    settings,
  } = useData();

  const [searchQuery, setSearchQuery] = useState('');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<'ALL' | 'PAID' | 'PARTIAL' | 'UNPAID'>('ALL');
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);

  // Payment Modal for unpaid / partial invoices
  const [paymentModalSale, setPaymentModalSale] = useState<Sale | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'CARD' | 'BANK_TRANSFER'>('CASH');
  const [paymentNote, setPaymentNote] = useState('');

  // Filtered Sales
  const filteredSales = useMemo(() => {
    return sales.filter((s) => {
      if (selectedWarehouseId !== 'ALL' && s.warehouseId !== selectedWarehouseId) return false;
      if (paymentStatusFilter !== 'ALL' && s.paymentStatus !== paymentStatusFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          s.invoiceNumber.toLowerCase().includes(q) ||
          s.customerName.toLowerCase().includes(q) ||
          s.id.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [sales, selectedWarehouseId, paymentStatusFilter, searchQuery]);

  const totalSalesVolume = filteredSales.reduce((sum, s) => sum + s.grandTotal, 0);
  const totalPaidVolume = filteredSales.reduce((sum, s) => sum + s.paidAmount, 0);
  const totalOutstanding = totalSalesVolume - totalPaidVolume;

  const handleOpenPayment = (sale: Sale) => {
    const due = sale.grandTotal - sale.paidAmount;
    setPaymentModalSale(sale);
    setPaymentAmount(due);
    setPaymentNote(`Balance settlement for ${sale.invoiceNumber}`);
  };

  const handleRecordPaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentModalSale || paymentAmount <= 0) return;

    recordSalePayment(paymentModalSale.id, paymentAmount, paymentMethod, paymentNote);
    setPaymentModalSale(null);
  };

  const handleExportCsv = () => {
    const rows = [
      ['Invoice #', 'Date', 'Customer', 'Warehouse', 'Items Count', 'Subtotal', 'Tax', 'Discount', 'Grand Total', 'Paid Amount', 'Status', 'Profit'],
      ...filteredSales.map((s) => {
        const wh = warehouses.find((w) => w.id === s.warehouseId)?.name || 'Global';
        return [
          s.invoiceNumber,
          new Date(s.date).toLocaleDateString(),
          s.customerName,
          wh,
          s.items.length,
          s.subtotal,
          s.tax,
          s.discount,
          s.grandTotal,
          s.paidAmount,
          s.paymentStatus,
          s.profit,
        ];
      }),
    ];
    exportToCsv('sales_invoices_ledger', rows);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150 text-slate-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <Receipt className="w-6 h-6 text-indigo-400" />
            <span>Sales Invoices & Commercial Orders</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Complete billing records, accounts receivable reconciliation, and tax invoices.
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
          <button
            id="btn-sales-new-bill-entry"
            onClick={() => setActiveTab('pos')}
            className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-colors active:scale-[0.98]"
            title="Open POS Register for new Bill Entry"
          >
            <Plus className="w-4 h-4" />
            <span>New Bill Entry (POS)</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-[#161616] border border-white/5 flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-slate-500">Total Billed Invoices</span>
            <p className="text-xl font-bold text-white mt-1">{formatCurrency(totalSalesVolume)}</p>
            <p className="text-[11px] text-slate-500 mt-0.5">{filteredSales.length} invoice(s)</p>
          </div>
          <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-xl">
            <Receipt className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[#161616] border border-white/5 flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-slate-500">Collected Payments</span>
            <p className="text-xl font-bold text-emerald-400 mt-1">{formatCurrency(totalPaidVolume)}</p>
            <p className="text-[11px] text-slate-500 mt-0.5">Cleared in cash / bank</p>
          </div>
          <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[#161616] border border-white/5 flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-slate-500">Outstanding Receivables</span>
            <p className="text-xl font-bold text-amber-400 mt-1">{formatCurrency(totalOutstanding)}</p>
            <p className="text-[11px] text-slate-500 mt-0.5">Pending collection</p>
          </div>
          <div className="p-3 bg-amber-500/10 text-amber-400 rounded-xl">
            <AlertCircle className="w-5 h-5" />
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
            placeholder="Search by invoice number (e.g. INV-2026), customer name..."
            className="w-full pl-9 pr-3.5 py-2 text-xs bg-[#1A1A1A] border border-white/10 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={paymentStatusFilter}
            onChange={(e) => setPaymentStatusFilter(e.target.value as any)}
            className="px-3 py-2 text-xs bg-[#1A1A1A] border border-white/10 rounded-lg text-slate-200 focus:outline-none"
          >
            <option value="ALL" className="bg-[#111111]">All Payment Statuses</option>
            <option value="PAID" className="bg-[#111111]">Fully Paid</option>
            <option value="PARTIAL" className="bg-[#111111]">Partially Paid</option>
            <option value="UNPAID" className="bg-[#111111]">Unpaid / On Credit</option>
          </select>
        </div>
      </div>

      {/* Invoices Table */}
      <div className="rounded-2xl bg-[#161616] border border-white/5 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-white/5 bg-[#111111] text-slate-500 font-mono text-[10px] uppercase">
              <tr>
                <th className="py-3 px-4 font-medium">Invoice #</th>
                <th className="py-3 px-4 font-medium">Date</th>
                <th className="py-3 px-4 font-medium">Customer Account</th>
                <th className="py-3 px-4 font-medium">Warehouse</th>
                <th className="py-3 px-4 font-medium">Grand Total</th>
                <th className="py-3 px-4 font-medium">Paid / Due</th>
                <th className="py-3 px-4 font-medium">Status</th>
                <th className="py-3 px-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-slate-300">
              {filteredSales.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500 text-xs">
                    No sales invoices found.
                  </td>
                </tr>
              ) : (
                filteredSales.map((s) => {
                  const wh = warehouses.find((w) => w.id === s.warehouseId);
                  const due = Math.max(0, s.grandTotal - s.paidAmount);

                  return (
                    <tr key={s.id} className="hover:bg-white/[0.02] transition-colors group">
                      <td className="py-3 px-4 font-mono font-medium text-indigo-400">
                        {s.invoiceNumber}
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-500">
                        {new Date(s.date).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4">
                        <p className="font-medium text-white">{s.customerName}</p>
                        <p className="text-[10px] text-slate-500 font-mono">{s.items.length} line item(s)</p>
                      </td>
                      <td className="py-3 px-4 text-slate-300">{wh?.name || 'Global'}</td>
                      <td className="py-3 px-4 font-mono font-medium text-slate-100">
                        {formatCurrency(s.grandTotal)}
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px]">
                        <p className="text-emerald-400 font-bold">{formatCurrency(s.paidAmount)}</p>
                        {due > 0 && <p className="text-rose-400">Due: {formatCurrency(due)}</p>}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 text-[10px] font-semibold rounded-md font-mono ${
                            s.paymentStatus === 'PAID'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : s.paymentStatus === 'PARTIAL'
                              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                              : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          }`}
                        >
                          {s.paymentStatus}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {due > 0 && (
                            <button
                              onClick={() => handleOpenPayment(s)}
                              className="px-2.5 py-1 text-[11px] font-medium text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 rounded-lg transition-colors"
                            >
                              Collect Pay
                            </button>
                          )}
                          <button
                            onClick={() => setSelectedSale(s)}
                            className="p-1.5 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                            title="View Invoice & Print"
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

      {/* Invoice Details Modal */}
      {selectedSale && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-100">
          <div className="w-full max-w-2xl bg-[#111111] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-[#161616]">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-indigo-400" />
                <h3 className="text-sm font-semibold text-white">Tax Invoice {selectedSale.invoiceNumber}</h3>
              </div>
              <button
                onClick={() => setSelectedSale(null)}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6 overflow-y-auto">
              {/* Invoice Banner */}
              <div className="p-4 rounded-xl bg-[#161616] border border-white/5 flex flex-col sm:flex-row justify-between gap-4">
                <div>
                  <h4 className="text-sm font-semibold text-white">{settings.businessName}</h4>
                  <p className="text-xs text-slate-400 mt-0.5">{settings.businessAddress}</p>
                  <p className="text-xs text-slate-500 font-mono mt-0.5">Tax ID: {settings.taxNumber}</p>
                </div>
                <div className="text-left sm:text-right text-xs">
                  <p className="font-mono font-semibold text-indigo-400 text-sm">{selectedSale.invoiceNumber}</p>
                  <p className="text-slate-500 font-mono mt-0.5">Date: {new Date(selectedSale.date).toLocaleDateString()}</p>
                  <p className="text-slate-300 font-medium mt-0.5">Billed To: {selectedSale.customerName}</p>
                </div>
              </div>

              {/* Items Table */}
              <div className="overflow-x-auto border border-white/5 rounded-xl">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-white/5 bg-[#161616] text-slate-500 font-mono text-[10px] uppercase">
                    <tr>
                      <th className="py-2.5 px-3 font-medium">Item Description</th>
                      <th className="py-2.5 px-3 font-medium">SKU</th>
                      <th className="py-2.5 px-3 font-medium">Unit Price</th>
                      <th className="py-2.5 px-3 font-medium">Qty</th>
                      <th className="py-2.5 px-3 font-medium text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-slate-300">
                    {selectedSale.items.map((it, idx) => (
                      <tr key={idx}>
                        <td className="py-2.5 px-3 font-medium text-slate-200">{it.productName}</td>
                        <td className="py-2.5 px-3 font-mono text-slate-500">{it.productSku}</td>
                        <td className="py-2.5 px-3 font-mono">{formatCurrency(it.unitPrice)}</td>
                        <td className="py-2.5 px-3 font-mono font-bold">{it.quantity}</td>
                        <td className="py-2.5 px-3 font-mono font-medium text-right text-slate-100">
                          {formatCurrency(it.total)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Financial Totals */}
              <div className="flex justify-end">
                <div className="w-64 space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-400">
                    <span>Subtotal:</span>
                    <span className="font-mono">{formatCurrency(selectedSale.subtotal)}</span>
                  </div>
                  {selectedSale.discount > 0 && (
                    <div className="flex justify-between text-slate-400">
                      <span>Discount:</span>
                      <span className="font-mono">-{formatCurrency(selectedSale.discount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-slate-400">
                    <span>Sales Tax:</span>
                    <span className="font-mono">{formatCurrency(selectedSale.tax)}</span>
                  </div>
                  <div className="flex justify-between text-sm font-bold text-white pt-2 border-t border-white/5">
                    <span>Grand Total:</span>
                    <span className="font-mono text-emerald-400">{formatCurrency(selectedSale.grandTotal)}</span>
                  </div>
                  <div className="flex justify-between text-xs text-emerald-400">
                    <span>Paid Amount:</span>
                    <span className="font-mono">{formatCurrency(selectedSale.paidAmount)}</span>
                  </div>
                  {selectedSale.grandTotal > selectedSale.paidAmount && (
                    <div className="flex justify-between text-xs text-rose-400 font-bold">
                      <span>Balance Outstanding:</span>
                      <span className="font-mono">
                        {formatCurrency(selectedSale.grandTotal - selectedSale.paidAmount)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-white/5 bg-[#161616]">
              <button
                onClick={() => window.print()}
                className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-slate-300 bg-[#1A1A1A] hover:bg-white/5 border border-white/10 rounded-lg transition-colors"
              >
                <Printer className="w-4 h-4" />
                <span>Print Tax Invoice</span>
              </button>
              <button
                onClick={() => setSelectedSale(null)}
                className="px-4 py-2 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Record Payment Modal */}
      {paymentModalSale && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-100">
          <div className="w-full max-w-md bg-[#111111] border border-white/10 rounded-2xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white">
                Collect Payment for {paymentModalSale.invoiceNumber}
              </h3>
              <button
                onClick={() => setPaymentModalSale(null)}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRecordPaymentSubmit} className="space-y-3.5">
              <div className="p-3 bg-[#161616] rounded-xl border border-white/5 text-xs flex justify-between">
                <span className="text-slate-400">Total Remaining Balance Due:</span>
                <strong className="font-mono text-rose-400">
                  {formatCurrency(paymentModalSale.grandTotal - paymentModalSale.paidAmount)}
                </strong>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-300">Payment Amount ($) *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={paymentModalSale.grandTotal - paymentModalSale.paidAmount}
                  required
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs bg-[#1A1A1A] border border-white/10 rounded-lg text-slate-100 font-mono font-bold focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-300">Payment Tender Method</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs bg-[#1A1A1A] border border-white/10 rounded-lg text-slate-100 focus:outline-none"
                >
                  <option value="CASH" className="bg-[#111111]">Cash</option>
                  <option value="CARD" className="bg-[#111111]">Credit / Debit Card</option>
                  <option value="BANK_TRANSFER" className="bg-[#111111]">Bank Wire Transfer</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-300">Memo / Reference Note</label>
                <input
                  type="text"
                  value={paymentNote}
                  onChange={(e) => setPaymentNote(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-[#1A1A1A] border border-white/10 rounded-lg text-slate-100 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setPaymentModalSale(null)}
                  className="px-3 py-1.5 text-xs text-slate-400 hover:text-white bg-[#1A1A1A] hover:bg-white/5 border border-white/10 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors"
                >
                  Confirm & Post Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
