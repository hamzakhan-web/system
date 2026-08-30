import React, { useState, useMemo } from 'react';
import {
  BarChart3,
  TrendingUp,
  Package,
  Truck,
  Users,
  DollarSign,
  Download,
  Calendar,
  Filter,
  FileSpreadsheet,
  PieChart as PieIcon,
  AlertTriangle,
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { exportToCsv } from '../../utils/export';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

type ReportTab = 'SALES' | 'INVENTORY' | 'PURCHASES' | 'PROFITABILITY' | 'RECEIVABLES';

const CHART_COLORS = ['#6366f1', '#38bdf8', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6'];

export const ReportsView: React.FC = () => {
  const {
    sales,
    purchases,
    products,
    categories,
    customers,
    suppliers,
    warehouses,
    formatCurrency,
  } = useData();

  const [activeReportTab, setActiveReportTab] = useState<ReportTab>('SALES');
  const [dateRange, setDateRange] = useState<'30D' | '90D' | 'ALL'>('ALL');

  // --- 1. SALES REPORT METRICS ---
  const totalSalesRevenue = sales.reduce((sum, s) => sum + s.grandTotal, 0);
  const totalItemsSold = sales.reduce((sum, s) => sum + s.items.reduce((iSum, it) => iSum + it.quantity, 0), 0);
  const avgOrderValue = sales.length > 0 ? totalSalesRevenue / sales.length : 0;

  // Sales by Category
  const salesByCategory = useMemo(() => {
    const map: { [cat: string]: number } = {};
    sales.forEach((s) => {
      s.items.forEach((it) => {
        const prod = products.find((p) => p.id === it.productId);
        const catName = categories.find((c) => c.id === prod?.categoryId)?.name || 'General';
        map[catName] = (map[catName] || 0) + it.total;
      });
    });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [sales, products, categories]);

  // Top Selling Products
  const topSellingProducts = useMemo(() => {
    const map: { [id: string]: { name: string; sku: string; qty: number; revenue: number; profit: number } } = {};
    sales.forEach((s) => {
      s.items.forEach((it) => {
        if (!map[it.productId]) {
          map[it.productId] = { name: it.productName, sku: it.productSku, qty: 0, revenue: 0, profit: 0 };
        }
        map[it.productId].qty += it.quantity;
        map[it.productId].revenue += it.total;
        map[it.productId].profit += it.profit;
      });
    });
    return Object.values(map).sort((a, b) => b.revenue - a.revenue);
  }, [sales]);

  // --- 2. INVENTORY VALUATION METRICS ---
  const totalStockCostValuation = products.reduce((sum, p) => sum + p.currentStock * p.purchasePrice, 0);
  const totalStockRetailValuation = products.reduce((sum, p) => sum + p.currentStock * p.sellingPrice, 0);
  const potentialInventoryProfit = totalStockRetailValuation - totalStockCostValuation;

  const lowStockItems = products.filter((p) => p.currentStock <= p.minStock);

  // Warehouse breakdown
  const warehouseValuation = useMemo(() => {
    return warehouses.map((w) => {
      const whProds = products.filter((p) => p.warehouseId === w.id);
      const costVal = whProds.reduce((sum, p) => sum + p.currentStock * p.purchasePrice, 0);
      const units = whProds.reduce((sum, p) => sum + p.currentStock, 0);
      return {
        name: w.name,
        costValuation: costVal,
        units,
      };
    });
  }, [warehouses, products]);

  // --- 3. PURCHASES REPORT METRICS ---
  const totalPurchasesCost = purchases.reduce((sum, p) => sum + p.grandTotal, 0);

  const spendBySupplier = useMemo(() => {
    const map: { [sup: string]: number } = {};
    purchases.forEach((p) => {
      map[p.supplierName] = (map[p.supplierName] || 0) + p.grandTotal;
    });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [purchases]);

  // --- 4. RECEIVABLES AGING ---
  const totalReceivablesDue = customers.reduce((sum, c) => sum + c.outstandingBalance, 0);

  // Export handlers
  const handleExportCurrentReport = () => {
    if (activeReportTab === 'SALES') {
      const rows = [
        ['Product Name', 'SKU', 'Units Sold', 'Total Revenue ($)', 'Total Profit ($)'],
        ...topSellingProducts.map((p) => [p.name, p.sku, p.qty, p.revenue, p.profit]),
      ];
      exportToCsv('sales_product_performance_report', rows);
    } else if (activeReportTab === 'INVENTORY') {
      const rows = [
        ['SKU', 'Product Name', 'Warehouse', 'Current Stock', 'Min Stock', 'Unit Cost', 'Unit Retail', 'Total Cost Valuation ($)', 'Total Retail Valuation ($)'],
        ...products.map((p) => {
          const wh = warehouses.find((w) => w.id === p.warehouseId)?.name || 'General';
          return [
            p.sku,
            p.name,
            wh,
            p.currentStock,
            p.minStock,
            p.purchasePrice,
            p.sellingPrice,
            p.currentStock * p.purchasePrice,
            p.currentStock * p.sellingPrice,
          ];
        }),
      ];
      exportToCsv('inventory_stock_valuation_report', rows);
    } else if (activeReportTab === 'PURCHASES') {
      const rows = [
        ['Vendor Supplier', 'Total Spend ($)'],
        ...spendBySupplier.map((s) => [s.name, s.value]),
      ];
      exportToCsv('procurement_supplier_spend_report', rows);
    } else if (activeReportTab === 'PROFITABILITY') {
      const rows = [
        ['Product Name', 'SKU', 'Selling Price', 'Cost Price', 'Margin ($)', 'Margin (%)', 'Units Sold', 'Total Profit Generated ($)'],
        ...products.map((p) => {
          const margin = p.sellingPrice - p.purchasePrice;
          const marginPct = p.sellingPrice > 0 ? (margin / p.sellingPrice) * 100 : 0;
          const soldStats = topSellingProducts.find((t) => t.sku === p.sku);
          return [
            p.name,
            p.sku,
            p.sellingPrice,
            p.purchasePrice,
            margin,
            marginPct.toFixed(2) + '%',
            soldStats?.qty || 0,
            soldStats?.profit || 0,
          ];
        }),
      ];
      exportToCsv('product_profitability_margin_report', rows);
    } else if (activeReportTab === 'RECEIVABLES') {
      const rows = [
        ['Customer Name', 'Code', 'Phone', 'Credit Limit', 'Outstanding Due ($)'],
        ...customers.map((c) => [c.name, c.customerCode, c.phone, c.creditLimit, c.outstandingBalance]),
      ];
      exportToCsv('accounts_receivable_aging_report', rows);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150 text-slate-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <BarChart3 className="w-6 h-6 text-indigo-400" />
            <span>Business Intelligence & Analytical Reports</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Enterprise analytics, inventory turn ratios, sales breakdowns, vendor spend, and profit margins.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleExportCurrentReport}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Export Report CSV</span>
          </button>
        </div>
      </div>

      {/* Report Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-white/5 pb-2 overflow-x-auto scrollbar-none">
        {[
          { id: 'SALES', label: 'Sales & Revenue Analytics', icon: TrendingUp },
          { id: 'INVENTORY', label: 'Stock & Asset Valuation', icon: Package },
          { id: 'PURCHASES', label: 'Procurement & Spend', icon: Truck },
          { id: 'PROFITABILITY', label: 'Product Margin Matrix', icon: DollarSign },
          { id: 'RECEIVABLES', label: 'Accounts Aging', icon: Users },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeReportTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveReportTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
                isActive
                  ? 'bg-white/10 text-white border border-white/10'
                  : 'bg-[#161616] text-slate-400 hover:bg-white/5 hover:text-white border border-transparent'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* --- TAB 1: SALES & REVENUE --- */}
      {activeReportTab === 'SALES' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-[#161616] border border-white/5">
              <span className="text-xs font-medium text-slate-500">Total Gross Invoiced Sales</span>
              <p className="text-2xl font-bold text-indigo-400 font-mono mt-1">{formatCurrency(totalSalesRevenue)}</p>
            </div>
            <div className="p-4 rounded-2xl bg-[#161616] border border-white/5">
              <span className="text-xs font-medium text-slate-500">Total Volume Sold</span>
              <p className="text-2xl font-bold text-emerald-400 font-mono mt-1">{totalItemsSold} units</p>
            </div>
            <div className="p-4 rounded-2xl bg-[#161616] border border-white/5">
              <span className="text-xs font-medium text-slate-500">Average Order Value (AOV)</span>
              <p className="text-2xl font-bold text-sky-400 font-mono mt-1">{formatCurrency(avgOrderValue)}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-6 p-5 rounded-2xl bg-[#161616] border border-white/5">
              <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-4">Sales by Category</h3>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={salesByCategory} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={75}>
                      {salesByCategory.map((_, i) => (
                        <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#111111',
                        borderColor: 'rgba(255,255,255,0.1)',
                        borderRadius: '0.75rem',
                        fontSize: '12px',
                      }}
                      formatter={(val: any) => [formatCurrency(Number(val)), 'Sales']}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px', color: '#94a3b8' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="lg:col-span-6 p-5 rounded-2xl bg-[#161616] border border-white/5">
              <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-3">Top 5 Products by Revenue</h3>
              <div className="space-y-2.5">
                {topSellingProducts.slice(0, 5).map((p, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2.5 rounded-xl bg-[#111111] border border-white/5 text-xs">
                    <div>
                      <p className="font-medium text-white">{p.name}</p>
                      <p className="text-[10px] text-slate-500 font-mono">{p.qty} units sold</p>
                    </div>
                    <div className="text-right">
                      <p className="font-mono font-bold text-emerald-400">{formatCurrency(p.revenue)}</p>
                      <p className="text-[10px] text-slate-500 font-mono">Profit: {formatCurrency(p.profit)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- TAB 2: INVENTORY VALUATION --- */}
      {activeReportTab === 'INVENTORY' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-[#161616] border border-white/5">
              <span className="text-xs font-medium text-slate-500">Inventory Cost Value</span>
              <p className="text-2xl font-bold text-sky-400 font-mono mt-1">{formatCurrency(totalStockCostValuation)}</p>
            </div>
            <div className="p-4 rounded-2xl bg-[#161616] border border-white/5">
              <span className="text-xs font-medium text-slate-500">Retail Selling Valuation</span>
              <p className="text-2xl font-bold text-emerald-400 font-mono mt-1">{formatCurrency(totalStockRetailValuation)}</p>
            </div>
            <div className="p-4 rounded-2xl bg-[#161616] border border-white/5">
              <span className="text-xs font-medium text-slate-500">Low Stock Alert Items</span>
              <p className="text-2xl font-bold text-amber-400 font-mono mt-1">{lowStockItems.length} items</p>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-[#161616] border border-white/5">
            <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-4">Stock Valuation by Facility Warehouse</h3>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={warehouseValuation}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
                  <YAxis stroke="#64748b" fontSize={10} tickFormatter={(v) => `$${v / 1000}k`} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#111111',
                      borderColor: 'rgba(255,255,255,0.1)',
                      borderRadius: '0.75rem',
                      fontSize: '12px',
                    }}
                    formatter={(val: any) => [formatCurrency(Number(val)), 'Asset Cost Value']}
                  />
                  <Bar dataKey="costValuation" fill="#38bdf8" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* --- TAB 3: PROCUREMENT SPEND --- */}
      {activeReportTab === 'PURCHASES' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-[#161616] border border-white/5">
              <span className="text-xs font-medium text-slate-500">Total Inbound Vendor Spend</span>
              <p className="text-2xl font-bold text-sky-400 font-mono mt-1">{formatCurrency(totalPurchasesCost)}</p>
            </div>
            <div className="p-4 rounded-2xl bg-[#161616] border border-white/5">
              <span className="text-xs font-medium text-slate-500">Total Purchase Orders Issued</span>
              <p className="text-2xl font-bold text-white font-mono mt-1">{purchases.length} POs</p>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-[#161616] border border-white/5">
            <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-4">Vendor Supplier Spend Distribution</h3>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={spendBySupplier}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
                  <YAxis stroke="#64748b" fontSize={10} tickFormatter={(v) => `$${v / 1000}k`} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#111111',
                      borderColor: 'rgba(255,255,255,0.1)',
                      borderRadius: '0.75rem',
                      fontSize: '12px',
                    }}
                    formatter={(val: any) => [formatCurrency(Number(val)), 'Spend']}
                  />
                  <Bar dataKey="value" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* --- TAB 4: PROFITABILITY MATRIX --- */}
      {activeReportTab === 'PROFITABILITY' && (
        <div className="p-5 rounded-2xl bg-[#161616] border border-white/5 space-y-4">
          <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Product Margins & Profit Contribution</h3>
          <div className="border border-white/5 rounded-xl overflow-hidden text-xs">
            <table className="w-full text-left">
              <thead className="bg-[#111111] text-slate-500 font-mono text-[10px] uppercase border-b border-white/5">
                <tr>
                  <th className="p-3 font-medium">Product</th>
                  <th className="p-3 font-medium">SKU</th>
                  <th className="p-3 font-medium">Selling Price</th>
                  <th className="p-3 font-medium">Cost Price</th>
                  <th className="p-3 font-medium">Margin ($)</th>
                  <th className="p-3 font-medium">Gross Margin %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-slate-300">
                {products.map((p) => {
                  const margin = p.sellingPrice - p.purchasePrice;
                  const marginPct = p.sellingPrice > 0 ? (margin / p.sellingPrice) * 100 : 0;
                  return (
                    <tr key={p.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="p-3 font-medium text-white">{p.name}</td>
                      <td className="p-3 font-mono text-slate-500">{p.sku}</td>
                      <td className="p-3 font-mono">{formatCurrency(p.sellingPrice)}</td>
                      <td className="p-3 font-mono">{formatCurrency(p.purchasePrice)}</td>
                      <td className="p-3 font-mono font-bold text-emerald-400">+{formatCurrency(margin)}</td>
                      <td className="p-3 font-mono font-bold text-white">{marginPct.toFixed(1)}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* --- TAB 5: RECEIVABLES AGING --- */}
      {activeReportTab === 'RECEIVABLES' && (
        <div className="space-y-6">
          <div className="p-4 rounded-2xl bg-[#161616] border border-white/5">
            <span className="text-xs font-medium text-slate-500">Total Unpaid Customer Receivables</span>
            <p className="text-2xl font-bold text-amber-400 font-mono mt-1">{formatCurrency(totalReceivablesDue)}</p>
          </div>

          <div className="p-5 rounded-2xl bg-[#161616] border border-white/5 space-y-3">
            <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Outstanding Accounts Aging</h3>
            <div className="border border-white/5 rounded-xl overflow-hidden text-xs">
              <table className="w-full text-left">
                <thead className="bg-[#111111] text-slate-500 font-mono text-[10px] uppercase border-b border-white/5">
                  <tr>
                    <th className="p-3 font-medium">Customer Account</th>
                    <th className="p-3 font-medium">Code</th>
                    <th className="p-3 font-medium">Phone</th>
                    <th className="p-3 font-medium">Credit Limit</th>
                    <th className="p-3 font-medium text-right">Outstanding Due</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-slate-300">
                  {customers
                    .filter((c) => c.outstandingBalance > 0)
                    .map((c) => (
                      <tr key={c.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="p-3 font-medium text-white">{c.name}</td>
                        <td className="p-3 font-mono text-slate-500">{c.customerCode}</td>
                        <td className="p-3 font-mono text-slate-300">{c.phone}</td>
                        <td className="p-3 font-mono text-slate-300">{formatCurrency(c.creditLimit)}</td>
                        <td className="p-3 font-mono font-bold text-right text-amber-400">
                          {formatCurrency(c.outstandingBalance)}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
