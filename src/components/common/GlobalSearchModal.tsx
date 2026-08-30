import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  X,
  Package,
  Users,
  Contact2,
  Receipt,
  Truck,
  ArrowRight,
  Barcode,
  Layers,
  Sparkles,
} from 'lucide-react';
import { useData } from '../../context/DataContext';

export const GlobalSearchModal: React.FC = () => {
  const {
    isGlobalSearchOpen,
    setIsGlobalSearchOpen,
    products,
    customers,
    suppliers,
    sales,
    purchases,
    setActiveTab,
    formatCurrency,
  } = useData();

  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsGlobalSearchOpen(true);
      }
      if (e.key === 'Escape' && isGlobalSearchOpen) {
        setIsGlobalSearchOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isGlobalSearchOpen, setIsGlobalSearchOpen]);

  useEffect(() => {
    if (isGlobalSearchOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
    }
  }, [isGlobalSearchOpen]);

  if (!isGlobalSearchOpen) return null;

  const q = query.trim().toLowerCase();

  const matchedProducts = q
    ? products.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q) ||
          p.barcode.toLowerCase().includes(q) ||
          p.brand.toLowerCase().includes(q)
      )
    : [];

  const matchedCustomers = q
    ? customers.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.phone.toLowerCase().includes(q) ||
          c.email.toLowerCase().includes(q) ||
          c.customerCode.toLowerCase().includes(q)
      )
    : [];

  const matchedSuppliers = q
    ? suppliers.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.company.toLowerCase().includes(q) ||
          s.supplierCode.toLowerCase().includes(q)
      )
    : [];

  const matchedSales = q
    ? sales.filter(
        (s) =>
          s.invoiceNumber.toLowerCase().includes(q) ||
          s.customerName.toLowerCase().includes(q) ||
          s.id.toLowerCase().includes(q)
      )
    : [];

  const matchedPurchases = q
    ? purchases.filter(
        (p) =>
          p.poNumber.toLowerCase().includes(q) ||
          p.supplierName.toLowerCase().includes(q) ||
          p.id.toLowerCase().includes(q)
      )
    : [];

  const totalMatches =
    matchedProducts.length +
    matchedCustomers.length +
    matchedSuppliers.length +
    matchedSales.length +
    matchedPurchases.length;

  const handleSelect = (tab: string) => {
    setActiveTab(tab);
    setIsGlobalSearchOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 px-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-100">
      <div
        className="w-full max-w-2xl bg-[#111111] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh] animate-in zoom-in-95 duration-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Header */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-white/5 bg-[#161616]">
          <Search className="w-5 h-5 text-indigo-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a product name, SKU, barcode, customer, or invoice #..."
            className="flex-1 bg-transparent text-sm text-slate-100 placeholder-slate-500 focus:outline-none"
          />
          {query && (
            <button onClick={() => setQuery('')} className="p-1 text-slate-400 hover:text-white rounded-lg transition-colors">
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="hidden sm:inline-flex text-[10px] font-mono px-2 py-1 bg-[#1A1A1A] border border-white/10 text-slate-400 rounded-md">
            ESC
          </kbd>
        </div>

        {/* Results Body */}
        <div className="flex-1 overflow-y-auto p-3 space-y-4">
          {!q ? (
            <div className="py-12 text-center text-slate-500 space-y-3">
              <div className="inline-flex p-3 rounded-full bg-[#161616] border border-white/5 text-indigo-400">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-300">Omni-System Real-Time Search</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  Instant search across inventory, catalogs, ledgers, customers & suppliers.
                </p>
              </div>
            </div>
          ) : totalMatches === 0 ? (
            <div className="py-12 text-center text-slate-500">
              <p className="text-sm text-slate-300">No records found matching "{query}"</p>
              <p className="text-xs text-slate-500 mt-1">Try searching by SKU, barcode, or customer phone.</p>
            </div>
          ) : (
            <>
              {/* Products */}
              {matchedProducts.length > 0 && (
                <div>
                  <div className="px-2 py-1 text-[10px] font-semibold text-indigo-400 tracking-wider uppercase flex items-center gap-1.5">
                    <Package className="w-3.5 h-3.5" /> Products ({matchedProducts.length})
                  </div>
                  <div className="space-y-1 mt-1">
                    {matchedProducts.slice(0, 5).map((p) => (
                      <button
                        key={p.id}
                        onClick={() => handleSelect('products')}
                        className="flex items-center justify-between w-full p-2 rounded-xl text-left hover:bg-white/5 transition-colors group"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <img
                            src={p.image}
                            alt={p.name}
                            className="w-10 h-10 rounded-lg object-cover bg-[#1A1A1A] border border-white/5 shrink-0"
                          />
                          <div className="min-w-0">
                            <p className="text-xs font-medium text-slate-200 truncate group-hover:text-indigo-400 transition-colors">
                              {p.name}
                            </p>
                            <p className="text-[11px] text-slate-500 font-mono flex items-center gap-2">
                              <span>SKU: {p.sku}</span>
                              <span>•</span>
                              <span>Stock: {p.currentStock} {p.unit}</span>
                            </p>
                          </div>
                        </div>
                        <div className="text-right shrink-0 ml-3">
                          <p className="text-xs font-bold text-slate-200">{formatCurrency(p.sellingPrice)}</p>
                          <span className="text-[10px] text-indigo-400 font-medium flex items-center gap-0.5 justify-end">
                            View <ArrowRight className="w-3 h-3" />
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Customers */}
              {matchedCustomers.length > 0 && (
                <div>
                  <div className="px-2 py-1 text-[10px] font-semibold text-emerald-400 tracking-wider uppercase flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5" /> Customers ({matchedCustomers.length})
                  </div>
                  <div className="space-y-1 mt-1">
                    {matchedCustomers.slice(0, 3).map((c) => (
                      <button
                        key={c.id}
                        onClick={() => handleSelect('customers')}
                        className="flex items-center justify-between w-full p-2.5 rounded-xl text-left hover:bg-white/5 transition-colors"
                      >
                        <div>
                          <p className="text-xs font-medium text-slate-200">{c.name}</p>
                          <p className="text-[11px] text-slate-500">{c.phone} • {c.email}</p>
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-semibold text-slate-300">
                            Balance: {formatCurrency(c.outstandingBalance)}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Invoices */}
              {matchedSales.length > 0 && (
                <div>
                  <div className="px-2 py-1 text-[10px] font-semibold text-violet-400 tracking-wider uppercase flex items-center gap-1.5">
                    <Receipt className="w-3.5 h-3.5" /> Sales Invoices ({matchedSales.length})
                  </div>
                  <div className="space-y-1 mt-1">
                    {matchedSales.slice(0, 3).map((s) => (
                      <button
                        key={s.id}
                        onClick={() => handleSelect('sales')}
                        className="flex items-center justify-between w-full p-2.5 rounded-xl text-left hover:bg-white/5 transition-colors"
                      >
                        <div>
                          <p className="text-xs font-medium text-slate-200 font-mono">{s.invoiceNumber}</p>
                          <p className="text-[11px] text-slate-500">{s.customerName} • {new Date(s.date).toLocaleDateString()}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-bold text-emerald-400">{formatCurrency(s.grandTotal)}</p>
                          <span className="text-[10px] text-slate-500 uppercase">{s.paymentStatus}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Suppliers */}
              {matchedSuppliers.length > 0 && (
                <div>
                  <div className="px-2 py-1 text-[10px] font-semibold text-amber-400 tracking-wider uppercase flex items-center gap-1.5">
                    <Contact2 className="w-3.5 h-3.5" /> Suppliers ({matchedSuppliers.length})
                  </div>
                  <div className="space-y-1 mt-1">
                    {matchedSuppliers.slice(0, 3).map((sup) => (
                      <button
                        key={sup.id}
                        onClick={() => handleSelect('suppliers')}
                        className="flex items-center justify-between w-full p-2.5 rounded-xl text-left hover:bg-white/5 transition-colors"
                      >
                        <div>
                          <p className="text-xs font-medium text-slate-200">{sup.name}</p>
                          <p className="text-[11px] text-slate-500">{sup.company} • {sup.phone}</p>
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-semibold text-slate-300">
                            Payables: {formatCurrency(sup.outstandingPayable)}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2.5 bg-[#161616] border-t border-white/5 text-[11px] text-slate-500 flex items-center justify-between">
          <span>Navigate with arrows, click to inspect</span>
          <span className="font-mono text-indigo-400">{totalMatches} result(s) found</span>
        </div>
      </div>
    </div>
  );
};
