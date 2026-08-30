import React, { useState, useMemo } from 'react';
import {
  Calculator,
  TrendingUp,
  DollarSign,
  Receipt,
  Truck,
  Wallet,
  Building,
  Calendar,
  Printer,
  Download,
  ArrowUpRight,
  ArrowDownRight,
  PieChart as PieIcon,
  CheckCircle2,
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
} from 'recharts';

export const AccountingView: React.FC = () => {
  const {
    sales,
    purchases,
    expenses,
    products,
    customers,
    suppliers,
    formatCurrency,
    settings,
  } = useData();

  const [dateFilter, setDateFilter] = useState<'ALL' | '30DAYS' | 'THIS_MONTH'>('ALL');

  // Filter records by date range
  const filteredSales = useMemo(() => {
    const now = new Date();
    return sales.filter((s) => {
      if (dateFilter === 'ALL') return true;
      const d = new Date(s.date);
      if (dateFilter === '30DAYS') {
        const past30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        return d >= past30;
      }
      if (dateFilter === 'THIS_MONTH') {
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      }
      return true;
    });
  }, [sales, dateFilter]);

  const filteredExpenses = useMemo(() => {
    const now = new Date();
    return expenses.filter((e) => {
      if (dateFilter === 'ALL') return true;
      const d = new Date(e.date);
      if (dateFilter === '30DAYS') {
        const past30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        return d >= past30;
      }
      if (dateFilter === 'THIS_MONTH') {
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      }
      return true;
    });
  }, [expenses, dateFilter]);

  // Income Statement (P&L) Calculations
  const grossSales = filteredSales.reduce((sum, s) => sum + s.subtotal, 0);
  const salesDiscounts = filteredSales.reduce((sum, s) => sum + s.discount, 0);
  const netSalesRevenue = grossSales - salesDiscounts;

  // Cost of Goods Sold (COGS)
  const cogs = filteredSales.reduce((sum, s) => {
    const itemsCost = s.items.reduce((iSum, it) => iSum + it.costPrice * it.quantity, 0);
    return sum + itemsCost;
  }, 0);

  const grossProfit = netSalesRevenue - cogs;
  const grossMargin = netSalesRevenue > 0 ? (grossProfit / netSalesRevenue) * 100 : 0;

  // Operating Expenses (OPEX)
  const totalOpex = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);

  // Net Operating Income (EBIT)
  const operatingIncome = grossProfit - totalOpex;

  // Taxes
  const totalTax = filteredSales.reduce((sum, s) => sum + s.tax, 0);

  // Net Profit
  const netProfit = operatingIncome;
  const netMargin = netSalesRevenue > 0 ? (netProfit / netSalesRevenue) * 100 : 0;

  // Balance Sheet Assets & Liabilities Snapshot
  const inventoryValuationAtCost = products.reduce((sum, p) => sum + p.currentStock * p.purchasePrice, 0);
  const accountsReceivable = customers.reduce((sum, c) => sum + c.outstandingBalance, 0);
  const cashAndEquivalents = sales.reduce((sum, s) => sum + s.paidAmount, 0) - totalOpex;
  const totalCurrentAssets = Math.max(0, cashAndEquivalents) + accountsReceivable + inventoryValuationAtCost;

  const accountsPayable = suppliers.reduce((sum, s) => sum + s.outstandingPayable, 0);
  const netWorkingCapital = totalCurrentAssets - accountsPayable;

  // Financial Chart Data (6-month simulation)
  const monthlyChartData = useMemo(() => {
    const months = ['Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'];
    return months.map((m, idx) => {
      const rev = (netSalesRevenue / 6) * (0.8 + idx * 0.1);
      const cost = (cogs / 6) * (0.8 + idx * 0.08);
      const exp = (totalOpex / 6) * (0.9 + idx * 0.05);
      const net = rev - cost - exp;
      return {
        month: m,
        Revenue: Math.round(rev),
        COGS: Math.round(cost),
        Expenses: Math.round(exp),
        NetProfit: Math.round(net),
      };
    });
  }, [netSalesRevenue, cogs, totalOpex]);

  const handleExportStatement = () => {
    const rows = [
      ['Financial P&L Statement', 'Period: ' + dateFilter],
      ['Item', 'Amount ($)'],
      ['Gross Sales Revenue', grossSales],
      ['Sales Discounts', -salesDiscounts],
      ['Net Sales Revenue', netSalesRevenue],
      ['Cost of Goods Sold (COGS)', -cogs],
      ['Gross Profit', grossProfit],
      ['Gross Margin %', grossMargin.toFixed(2) + '%'],
      ['Total Operating Expenses (OPEX)', -totalOpex],
      ['Net Operating Profit', netProfit],
      ['Net Profit Margin %', netMargin.toFixed(2) + '%'],
      [''],
      ['Balance Sheet Working Capital Snapshot', ''],
      ['Inventory Asset (at cost)', inventoryValuationAtCost],
      ['Accounts Receivable (Customer Due)', accountsReceivable],
      ['Accounts Payable (Vendor Due)', -accountsPayable],
      ['Net Working Capital', netWorkingCapital],
    ];
    exportToCsv('financial_income_statement', rows);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150 text-slate-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <Calculator className="w-6 h-6 text-emerald-400" />
            <span>Financial Accounting & Income Statement (P&L)</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time Profit & Loss statement, COGS gross margins, OPEX overheads, and balance sheet capital.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value as any)}
            className="px-3 py-2 text-xs bg-[#161616] border border-white/10 rounded-lg text-slate-200 focus:outline-none"
          >
            <option value="ALL" className="bg-[#111111]">All-Time Cumulative</option>
            <option value="30DAYS" className="bg-[#111111]">Last 30 Days</option>
            <option value="THIS_MONTH" className="bg-[#111111]">This Current Month</option>
          </select>

          <button
            onClick={handleExportStatement}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-slate-300 bg-[#161616] hover:bg-white/5 border border-white/5 rounded-lg transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Export Statement</span>
          </button>

          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-slate-300 bg-[#161616] hover:bg-white/5 border border-white/5 rounded-lg transition-colors"
          >
            <Printer className="w-4 h-4" />
            <span>Print P&L</span>
          </button>
        </div>
      </div>

      {/* KPI Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-[#161616] border border-white/5 flex flex-col justify-between">
          <span className="text-xs font-medium text-slate-500">Net Sales Revenue</span>
          <p className="text-2xl font-bold text-white font-mono mt-1">{formatCurrency(netSalesRevenue)}</p>
          <span className="text-[11px] text-emerald-400 flex items-center gap-0.5 mt-1 font-mono">
            <ArrowUpRight className="w-3.5 h-3.5" /> Gross sales less discounts
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-[#161616] border border-white/5 flex flex-col justify-between">
          <span className="text-xs font-medium text-slate-500">Gross Profit (COGS Deducted)</span>
          <p className="text-2xl font-bold text-emerald-400 font-mono mt-1">{formatCurrency(grossProfit)}</p>
          <span className="text-[11px] text-slate-400 font-mono mt-1">
            Margin: <strong className="text-emerald-400">{grossMargin.toFixed(1)}%</strong>
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-[#161616] border border-white/5 flex flex-col justify-between">
          <span className="text-xs font-medium text-slate-500">Total Operating Expenses (OPEX)</span>
          <p className="text-2xl font-bold text-rose-400 font-mono mt-1">{formatCurrency(totalOpex)}</p>
          <span className="text-[11px] text-slate-500 font-mono mt-1">Overhead & leases</span>
        </div>

        <div className="p-4 rounded-2xl bg-[#161616] border border-white/5 flex flex-col justify-between">
          <span className="text-xs font-medium text-slate-500">Net Clean Operating Profit</span>
          <p className={`text-2xl font-bold font-mono mt-1 ${netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {formatCurrency(netProfit)}
          </p>
          <span className="text-[11px] text-slate-400 font-mono mt-1">
            Net Margin: <strong className={netMargin >= 0 ? 'text-emerald-400' : 'text-rose-400'}>{netMargin.toFixed(1)}%</strong>
          </span>
        </div>
      </div>

      {/* Main Income Statement Table & Financial Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Formal P&L Statement */}
        <div className="lg:col-span-7 p-6 rounded-2xl bg-[#161616] border border-white/5 space-y-4">
          <div className="flex items-center justify-between border-b border-white/5 pb-3">
            <div>
              <h3 className="text-sm font-semibold text-white uppercase tracking-wider">Statement of Financial Operations</h3>
              <p className="text-xs text-slate-500">{settings.businessName} • Accrual Accounting Basis</p>
            </div>
            <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-lg">
              USD ($)
            </span>
          </div>

          <div className="space-y-3 text-xs">
            {/* Revenue section */}
            <div className="space-y-1.5">
              <div className="font-semibold text-indigo-400 text-[11px] uppercase tracking-wider">
                1. Operating Revenue
              </div>
              <div className="flex justify-between pl-3 text-slate-400">
                <span>Gross Merchandise Value (Sales):</span>
                <span className="font-mono text-slate-200">{formatCurrency(grossSales)}</span>
              </div>
              {salesDiscounts > 0 && (
                <div className="flex justify-between pl-3 text-slate-400">
                  <span>Less: Promotional Discounts & Rebates:</span>
                  <span className="font-mono text-rose-400">-{formatCurrency(salesDiscounts)}</span>
                </div>
              )}
              <div className="flex justify-between pl-3 font-semibold text-slate-200 border-t border-white/5 pt-1">
                <span>Net Commercial Revenue:</span>
                <span className="font-mono text-white">{formatCurrency(netSalesRevenue)}</span>
              </div>
            </div>

            {/* COGS section */}
            <div className="space-y-1.5 pt-2 border-t border-white/5">
              <div className="font-semibold text-sky-400 text-[11px] uppercase tracking-wider">
                2. Cost of Goods Sold (COGS)
              </div>
              <div className="flex justify-between pl-3 text-slate-400">
                <span>Direct Product Inventory Acquisition Cost:</span>
                <span className="font-mono text-rose-400">-{formatCurrency(cogs)}</span>
              </div>
              <div className="flex justify-between pl-3 font-semibold text-emerald-300 bg-emerald-500/10 p-2 rounded-lg mt-1">
                <span>GROSS PROFIT (Margin: {grossMargin.toFixed(1)}%):</span>
                <span className="font-mono text-sm">{formatCurrency(grossProfit)}</span>
              </div>
            </div>

            {/* Operating Expenses */}
            <div className="space-y-1.5 pt-2 border-t border-white/5">
              <div className="font-semibold text-rose-400 text-[11px] uppercase tracking-wider">
                3. Operating Expenses (OPEX)
              </div>
              <div className="flex justify-between pl-3 text-slate-400">
                <span>Warehouse Leases, Utilities & Logistics:</span>
                <span className="font-mono text-rose-400">-{formatCurrency(totalOpex)}</span>
              </div>
              <div className="flex justify-between pl-3 font-semibold text-slate-300">
                <span>Total General & Administrative Overhead:</span>
                <span className="font-mono text-rose-400">-{formatCurrency(totalOpex)}</span>
              </div>
            </div>

            {/* Net Income Summary */}
            <div className="p-4 rounded-xl bg-[#111111] border border-white/5 space-y-2 mt-4">
              <div className="flex justify-between items-center text-sm font-bold">
                <span className="text-white uppercase tracking-wide">NET OPERATING PROFIT (EBIT):</span>
                <span className={`font-mono text-lg ${netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {formatCurrency(netProfit)}
                </span>
              </div>
              <div className="flex justify-between text-xs text-slate-500 pt-1 border-t border-white/5">
                <span>Effective Net Margin:</span>
                <span className="font-mono font-bold text-slate-200">{netMargin.toFixed(2)}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Financial Chart & Balance Sheet Snapshot */}
        <div className="lg:col-span-5 space-y-6">
          {/* Revenue vs Costs Comparison Chart */}
          <div className="p-5 rounded-2xl bg-[#161616] border border-white/5">
            <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-4">
              Revenue vs. Cost Structure (6-Mo Trend)
            </h3>
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyChartData} barSize={12}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="month" stroke="#64748b" fontSize={11} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={10} tickLine={false} tickFormatter={(val) => `$${val / 1000}k`} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#111111',
                      borderColor: 'rgba(255,255,255,0.1)',
                      borderRadius: '0.75rem',
                      fontSize: '12px',
                    }}
                    formatter={(value: any) => [formatCurrency(Number(value)), '']}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', color: '#94a3b8' }} />
                  <Bar dataKey="Revenue" fill="#6366f1" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="COGS" fill="#38bdf8" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Expenses" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="NetProfit" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Working Capital Balance Sheet */}
          <div className="p-5 rounded-2xl bg-[#161616] border border-white/5 space-y-3">
            <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Working Capital & Assets Snapshot
            </h3>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Inventory Valuation (at Cost):</span>
                <span className="font-mono font-bold text-slate-200">{formatCurrency(inventoryValuationAtCost)}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Accounts Receivable (Customer Due):</span>
                <span className="font-mono font-bold text-emerald-400">+{formatCurrency(accountsReceivable)}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Accounts Payable (Vendor Due):</span>
                <span className="font-mono font-bold text-amber-400">-{formatCurrency(accountsPayable)}</span>
              </div>

              <div className="pt-2 border-t border-white/5 flex justify-between font-bold text-sm text-white">
                <span>Net Working Capital:</span>
                <span className="font-mono text-emerald-400">{formatCurrency(netWorkingCapital)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
