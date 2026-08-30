import React, { useState, useMemo } from 'react';
import {
  Package,
  Boxes,
  AlertTriangle,
  TrendingUp,
  Truck,
  DollarSign,
  Users,
  Contact2,
  Receipt,
  ArrowUpRight,
  ArrowDownRight,
  ShoppingCart,
  Plus,
  ArrowRightLeft,
  Calendar,
  Layers,
  Sparkles,
  PieChart as PieIcon,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { useData } from '../../context/DataContext';

export const DashboardView: React.FC = () => {
  const {
    products,
    categories,
    sales,
    purchases,
    customers,
    suppliers,
    expenses,
    transactions,
    selectedWarehouseId,
    warehouses,
    setActiveTab,
    formatCurrency,
  } = useData();

  const [timeRange, setTimeRange] = useState<'today' | 'week' | 'month' | 'year' | 'all'>('month');

  // Filter items according to selected warehouse if not ALL
  const filteredProducts = useMemo(() => {
    if (selectedWarehouseId === 'ALL') return products;
    return products.filter((p) => p.warehouseId === selectedWarehouseId);
  }, [products, selectedWarehouseId]);

  const filteredSales = useMemo(() => {
    if (selectedWarehouseId === 'ALL') return sales;
    return sales.filter((s) => s.warehouseId === selectedWarehouseId);
  }, [sales, selectedWarehouseId]);

  const filteredPurchases = useMemo(() => {
    if (selectedWarehouseId === 'ALL') return purchases;
    return purchases.filter((p) => p.warehouseId === selectedWarehouseId);
  }, [purchases, selectedWarehouseId]);

  // Date filtering logic
  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);

  // Time filter boundary
  const getDateBoundary = () => {
    const d = new Date();
    if (timeRange === 'today') {
      d.setHours(0, 0, 0, 0);
      return d;
    }
    if (timeRange === 'week') {
      d.setDate(d.getDate() - 7);
      return d;
    }
    if (timeRange === 'month') {
      d.setDate(d.getDate() - 30);
      return d;
    }
    if (timeRange === 'year') {
      d.setFullYear(d.getFullYear() - 1);
      return d;
    }
    return new Date(0); // all
  };

  const boundaryDate = getDateBoundary();

  const timeFilteredSales = useMemo(() => {
    return filteredSales.filter((s) => new Date(s.date) >= boundaryDate);
  }, [filteredSales, boundaryDate]);

  const timeFilteredPurchases = useMemo(() => {
    return filteredPurchases.filter((p) => new Date(p.date) >= boundaryDate);
  }, [filteredPurchases, boundaryDate]);

  const timeFilteredExpenses = useMemo(() => {
    return expenses.filter((e) => new Date(e.date) >= boundaryDate);
  }, [expenses, boundaryDate]);

  // KPI Calculations
  const totalProductsCount = filteredProducts.length;
  const totalStockUnits = filteredProducts.reduce((sum, p) => sum + p.currentStock, 0);
  const lowStockCount = filteredProducts.filter((p) => p.currentStock > 0 && p.currentStock <= p.minStock).length;
  const outOfStockCount = filteredProducts.filter((p) => p.currentStock === 0).length;

  const totalSalesRevenue = timeFilteredSales.reduce((sum, s) => sum + s.grandTotal, 0);
  const totalGrossProfit = timeFilteredSales.reduce((sum, s) => sum + s.profit, 0);
  const totalPurchasesCost = timeFilteredPurchases.reduce((sum, p) => sum + p.grandTotal, 0);
  const totalExpensesAmt = timeFilteredExpenses.reduce((sum, e) => sum + e.amount, 0);
  const netProfit = totalGrossProfit - totalExpensesAmt;

  const totalReceivables = customers.reduce((sum, c) => sum + c.outstandingBalance, 0);
  const totalPayables = suppliers.reduce((sum, s) => sum + s.outstandingPayable, 0);

  // Total inventory valuation
  const inventoryValuation = filteredProducts.reduce((sum, p) => sum + p.currentStock * p.purchasePrice, 0);
  const retailValuation = filteredProducts.reduce((sum, p) => sum + p.currentStock * p.sellingPrice, 0);

  // Chart 1: Revenue & Profit Trends by day/period
  const trendData = useMemo(() => {
    const daysMap: { [key: string]: { date: string; sales: number; profit: number; purchases: number } } = {};

    // Populate last 7-14 points
    const days = 7;
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(5, 10);
      daysMap[key] = { date: key, sales: 0, profit: 0, purchases: 0 };
    }

    filteredSales.forEach((s) => {
      const key = s.date.slice(5, 10);
      if (daysMap[key]) {
        daysMap[key].sales += s.grandTotal;
        daysMap[key].profit += s.profit;
      }
    });

    filteredPurchases.forEach((p) => {
      const key = p.date.slice(5, 10);
      if (daysMap[key]) {
        daysMap[key].purchases += p.grandTotal;
      }
    });

    return Object.values(daysMap);
  }, [filteredSales, filteredPurchases]);

  // Chart 2: Top Selling Products
  const topSellingData = useMemo(() => {
    const productSaleMap: { [key: string]: { name: string; soldUnits: number; revenue: number } } = {};

    filteredSales.forEach((s) => {
      s.items.forEach((it) => {
        if (!productSaleMap[it.productId]) {
          productSaleMap[it.productId] = {
            name: it.productName.length > 20 ? it.productName.slice(0, 18) + '...' : it.productName,
            soldUnits: 0,
            revenue: 0,
          };
        }
        productSaleMap[it.productId].soldUnits += it.quantity;
        productSaleMap[it.productId].revenue += it.total;
      });
    });

    return Object.values(productSaleMap)
      .sort((a, b) => b.soldUnits - a.soldUnits)
      .slice(0, 5);
  }, [filteredSales]);

  // Chart 3: Category Inventory Breakdown
  const categoryChartData = useMemo(() => {
    const catMap: { [key: string]: { name: string; count: number; value: number } } = {};
    categories.forEach((c) => {
      catMap[c.id] = { name: c.name, count: 0, value: 0 };
    });

    filteredProducts.forEach((p) => {
      if (catMap[p.categoryId]) {
        catMap[p.categoryId].count += p.currentStock;
        catMap[p.categoryId].value += p.currentStock * p.purchasePrice;
      }
    });

    return Object.values(catMap).filter((c) => c.value > 0);
  }, [categories, filteredProducts]);

  // Chart 4: Payment Methods Distribution
  const paymentMethodData = useMemo(() => {
    const methodMap: { [key: string]: number } = {
      CASH: 0,
      CARD: 0,
      BANK_TRANSFER: 0,
      CREDIT: 0,
      SPLIT: 0,
    };
    filteredSales.forEach((s) => {
      methodMap[s.paymentMethod] = (methodMap[s.paymentMethod] || 0) + s.grandTotal;
    });

    return Object.entries(methodMap)
      .filter(([_, val]) => val > 0)
      .map(([name, value]) => ({ name: name.replace('_', ' '), value }));
  }, [filteredSales]);

  const PIE_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#06b6d4', '#ec4899', '#8b5cf6'];

  return (
    <div className="space-y-6 animate-in fade-in duration-150 text-slate-300">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <span>Executive Command Dashboard</span>
            <span className="px-2 py-0.5 text-xs font-semibold bg-indigo-600/10 text-indigo-400 border border-indigo-500/20 rounded-md">
              Real-Time
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Omni-channel metrics for{' '}
            <span className="font-medium text-slate-300">
              {selectedWarehouseId === 'ALL'
                ? 'All Warehouses (Global Consolidated)'
                : warehouses.find((w) => w.id === selectedWarehouseId)?.name}
            </span>
          </p>
        </div>

        {/* Action Shortcuts + Time Filter */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Time Filter Buttons */}
          <div className="flex items-center p-1 bg-[#111111] border border-white/10 rounded-xl text-xs">
            {(['today', 'week', 'month', 'year', 'all'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTimeRange(t)}
                className={`px-3 py-1.5 font-medium rounded-lg capitalize transition-colors ${
                  timeRange === t ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                {t === 'today' ? 'Today' : t === 'week' ? '7D' : t === 'month' ? '30D' : t === 'year' ? '1Y' : 'All'}
              </button>
            ))}
          </div>

          {/* POS Button */}
          <button
            onClick={() => setActiveTab('pos')}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm transition-colors"
          >
            <ShoppingCart className="w-4 h-4" />
            <span>Launch POS</span>
          </button>
        </div>
      </div>

      {/* 10 KPI Summary Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        {/* Card 1: Total Products */}
        <div
          onClick={() => setActiveTab('products')}
          className="p-4 rounded-2xl bg-[#161616] border border-white/5 hover:border-white/10 transition-all cursor-pointer group shadow-sm"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Products</span>
            <div className="p-2 rounded-lg bg-indigo-600/10 text-indigo-400 group-hover:bg-indigo-600/20 transition-colors">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-white">{totalProductsCount}</p>
          <p className="text-[11px] text-slate-500 mt-1">Active SKUs listed</p>
        </div>

        {/* Card 2: Total Stock Units */}
        <div
          onClick={() => setActiveTab('inventory')}
          className="p-4 rounded-2xl bg-[#161616] border border-white/5 hover:border-white/10 transition-all cursor-pointer group shadow-sm"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Physical Units</span>
            <div className="p-2 rounded-lg bg-sky-500/10 text-sky-400 group-hover:bg-sky-500/20 transition-colors">
              <Boxes className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-white">{totalStockUnits.toLocaleString()}</p>
          <p className="text-[11px] text-sky-400 font-medium mt-1">Valued at {formatCurrency(inventoryValuation)}</p>
        </div>

        {/* Card 3: Low Stock Products */}
        <div
          onClick={() => setActiveTab('inventory')}
          className="p-4 rounded-2xl bg-[#161616] border border-white/5 hover:border-amber-500/30 transition-all cursor-pointer group shadow-sm"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Low Stock Alert</span>
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 group-hover:bg-amber-500/20 transition-colors">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-amber-400">{lowStockCount}</p>
          <p className="text-[11px] text-slate-500 mt-1">Below safety reorder</p>
        </div>

        {/* Card 4: Out of Stock */}
        <div
          onClick={() => setActiveTab('inventory')}
          className="p-4 rounded-2xl bg-[#161616] border border-white/5 hover:border-rose-500/30 transition-all cursor-pointer group shadow-sm"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Out of Stock</span>
            <div className="p-2 rounded-lg bg-rose-500/10 text-rose-400 group-hover:bg-rose-500/20 transition-colors">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-rose-400">{outOfStockCount}</p>
          <p className="text-[11px] text-slate-500 mt-1">Critical replenishment</p>
        </div>

        {/* Card 5: Sales Revenue */}
        <div
          onClick={() => setActiveTab('sales')}
          className="p-4 rounded-2xl bg-[#161616] border border-white/5 hover:border-emerald-500/30 transition-all cursor-pointer group shadow-sm"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Sales Revenue</span>
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 group-hover:bg-emerald-500/20 transition-colors">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-emerald-400">{formatCurrency(totalSalesRevenue)}</p>
          <p className="text-[11px] text-slate-500 mt-1">{timeFilteredSales.length} closed order(s)</p>
        </div>

        {/* Card 6: Purchases Total */}
        <div
          onClick={() => setActiveTab('purchases')}
          className="p-4 rounded-2xl bg-[#161616] border border-white/5 hover:border-white/10 transition-all cursor-pointer group shadow-sm"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Purchases</span>
            <div className="p-2 rounded-lg bg-violet-500/10 text-violet-400 group-hover:bg-violet-500/20 transition-colors">
              <Truck className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-white">{formatCurrency(totalPurchasesCost)}</p>
          <p className="text-[11px] text-slate-500 mt-1">{timeFilteredPurchases.length} PO order(s)</p>
        </div>

        {/* Card 7: Realized Gross Profit */}
        <div
          onClick={() => setActiveTab('accounting')}
          className="p-4 rounded-2xl bg-[#161616] border border-white/5 hover:border-emerald-500/30 transition-all cursor-pointer group shadow-sm"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Gross Profit</span>
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 group-hover:bg-emerald-500/20 transition-colors">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-emerald-400">{formatCurrency(totalGrossProfit)}</p>
          <p className="text-[11px] text-slate-500 mt-1">Revenue - Real COGS</p>
        </div>

        {/* Card 8: Customer Receivables */}
        <div
          onClick={() => setActiveTab('customers')}
          className="p-4 rounded-2xl bg-[#161616] border border-white/5 hover:border-indigo-500/30 transition-all cursor-pointer group shadow-sm"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Receivables</span>
            <div className="p-2 rounded-lg bg-indigo-600/10 text-indigo-400 group-hover:bg-indigo-600/20 transition-colors">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-indigo-400">{formatCurrency(totalReceivables)}</p>
          <p className="text-[11px] text-slate-500 mt-1">Pending customer collections</p>
        </div>

        {/* Card 9: Supplier Payables */}
        <div
          onClick={() => setActiveTab('suppliers')}
          className="p-4 rounded-2xl bg-[#161616] border border-white/5 hover:border-amber-500/30 transition-all cursor-pointer group shadow-sm"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Payables</span>
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 group-hover:bg-amber-500/20 transition-colors">
              <Contact2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-amber-400">{formatCurrency(totalPayables)}</p>
          <p className="text-[11px] text-slate-500 mt-1">Owed to vendor accounts</p>
        </div>

        {/* Card 10: Total Operating Expenses */}
        <div
          onClick={() => setActiveTab('expenses')}
          className="p-4 rounded-2xl bg-[#161616] border border-white/5 hover:border-white/10 transition-all cursor-pointer group shadow-sm"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Expenses</span>
            <div className="p-2 rounded-lg bg-rose-500/10 text-rose-400 group-hover:bg-rose-500/20 transition-colors">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-white">{formatCurrency(totalExpensesAmt)}</p>
          <p className="text-[11px] text-slate-500 mt-1">Net profit: {formatCurrency(netProfit)}</p>
        </div>
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Revenue vs Gross Profit Trends */}
        <div className="lg:col-span-2 p-5 rounded-2xl bg-[#161616] border border-white/5 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-white">Revenue & Profit Trajectory</h2>
              <p className="text-xs text-slate-500">Daily sales income vs gross profit margin</p>
            </div>
            <div className="flex items-center gap-4 text-xs font-mono">
              <span className="flex items-center gap-1.5 text-emerald-400">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" /> Sales Revenue
              </span>
              <span className="flex items-center gap-1.5 text-indigo-400">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-400" /> Gross Profit
              </span>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" />
                <XAxis dataKey="date" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} tickFormatter={(val) => `$${val}`} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#161616', borderColor: 'rgba(255, 255, 255, 0.1)', borderRadius: '12px', fontSize: '12px', color: '#fff' }}
                  formatter={(val: any) => [formatCurrency(Number(val)), '']}
                />
                <Area type="monotone" dataKey="sales" name="Revenue" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorSales)" />
                <Area type="monotone" dataKey="profit" name="Gross Profit" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#colorProfit)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right 1 Col: Category Inventory Valuation (Donut) */}
        <div className="p-5 rounded-2xl bg-[#161616] border border-white/5 flex flex-col">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h2 className="text-sm font-semibold text-white">Stock Valuation by Category</h2>
              <p className="text-xs text-slate-500">Capital tied in inventory</p>
            </div>
            <PieIcon className="w-4 h-4 text-indigo-400" />
          </div>

          <div className="h-52 w-full my-auto">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {categoryChartData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#161616', borderColor: 'rgba(255, 255, 255, 0.1)', borderRadius: '12px', fontSize: '12px', color: '#fff' }}
                  formatter={(val: any) => [formatCurrency(Number(val)), 'Valuation']}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-1.5 border-t border-white/5 pt-3">
            {categoryChartData.slice(0, 3).map((cat, idx) => (
              <div key={cat.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }}
                  />
                  <span className="text-slate-400 truncate">{cat.name}</span>
                </div>
                <span className="font-mono font-medium text-white shrink-0">{formatCurrency(cat.value)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Secondary Row: Top Products & Recent Stock Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Selling Products */}
        <div className="p-5 rounded-2xl bg-[#161616] border border-white/5 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-white">Top Velocity Products</h2>
              <p className="text-xs text-slate-500">By units sold in selected period</p>
            </div>
            <button
              onClick={() => setActiveTab('reports')}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-medium"
            >
              Full Report →
            </button>
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart layout="vertical" data={topSellingData} margin={{ top: 0, right: 20, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" horizontal={false} />
                <XAxis type="number" stroke="#64748b" fontSize={10} />
                <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={11} width={90} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#161616', borderColor: 'rgba(255, 255, 255, 0.1)', borderRadius: '12px', fontSize: '12px', color: '#fff' }}
                  formatter={(val: any) => [`${val} Units Sold`, 'Quantity']}
                />
                <Bar dataKey="soldUnits" fill="#6366f1" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Transactions Ledger Table */}
        <div className="lg:col-span-2 p-5 rounded-2xl bg-[#161616] border border-white/5 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-white">Live Inventory Movement Ledger</h2>
              <p className="text-xs text-slate-500">Real-time audited stock changes</p>
            </div>
            <button
              onClick={() => setActiveTab('inventory')}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-medium"
            >
              View All Ledger →
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-white/5 text-slate-500 font-mono text-[10px] uppercase tracking-wider">
                <tr>
                  <th className="pb-2.5 font-semibold">Product</th>
                  <th className="pb-2.5 font-semibold">Type</th>
                  <th className="pb-2.5 font-semibold">Quantity</th>
                  <th className="pb-2.5 font-semibold">Warehouse</th>
                  <th className="pb-2.5 font-semibold text-right">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-slate-300">
                {transactions.slice(0, 5).map((tx) => {
                  const isPositive = tx.quantity > 0;
                  return (
                    <tr key={tx.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-2.5 pr-2 font-medium text-slate-200">
                        <p className="truncate max-w-[200px] text-white">{tx.productName}</p>
                        <p className="text-[10px] text-slate-500 font-mono">{tx.productSku}</p>
                      </td>
                      <td className="py-2.5 pr-2">
                        <span
                          className={`px-2 py-0.5 text-[10px] font-semibold rounded-md font-mono ${
                            tx.type === 'SALE'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : tx.type === 'PURCHASE'
                              ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20'
                              : tx.type.includes('TRANSFER')
                              ? 'bg-violet-500/10 text-violet-400 border border-violet-500/20'
                              : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          }`}
                        >
                          {tx.type.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-2.5 pr-2 font-mono font-medium">
                        <span className={isPositive ? 'text-emerald-400' : 'text-rose-400'}>
                          {isPositive ? `+${tx.quantity}` : tx.quantity}
                        </span>
                      </td>
                      <td className="py-2.5 pr-2 text-slate-400 truncate max-w-[120px]">{tx.warehouseName}</td>
                      <td className="py-2.5 text-right text-slate-500 font-mono text-[10px]">
                        {new Date(tx.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
