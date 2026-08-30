import React from 'react';
import {
  LayoutDashboard,
  Package,
  Boxes,
  Building2,
  ShoppingCart,
  Receipt,
  Truck,
  Users,
  Contact2,
  DollarSign,
  PieChart,
  FileSpreadsheet,
  UserCog,
  History,
  Settings,
  Sparkles,
  ChevronRight,
  LogOut,
  Warehouse as WhIcon,
  X,
} from 'lucide-react';
import { useData } from '../../context/DataContext';

interface SidebarProps {
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
  onOpenScanner?: () => void;
  onOpenBarcodeGen?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ mobileOpen = false, onCloseMobile }) => {
  const { activeTab, setActiveTab, permissions, products, sales, settings, currentUser } = useData();

  const lowStockCount = products.filter((p) => p.currentStock <= p.minStock).length;

  interface NavItem {
    id: string;
    label: string;
    icon: React.ElementType;
    badge?: number | string;
    badgeColor?: string;
    visible: boolean;
    section?: string;
  }

  const navItems: NavItem[] = [
    // Main Overview
    { id: 'dashboard', label: 'Main Dashboard', icon: LayoutDashboard, visible: true, section: 'CORE APPS' },
    
    // Inventory & Warehousing
    {
      id: 'products',
      label: 'Products Catalog',
      icon: Package,
      visible: permissions.canViewProducts,
      section: 'INVENTORY & SUPPLY',
    },
    {
      id: 'inventory',
      label: 'Stock & Ledger',
      icon: Boxes,
      badge: lowStockCount > 0 ? lowStockCount : undefined,
      badgeColor: 'bg-amber-500/20 text-amber-300 border border-amber-500/30',
      visible: permissions.canViewInventory,
    },
    {
      id: 'warehouses',
      label: 'Multi-Warehouse',
      icon: Building2,
      visible: permissions.canViewInventory,
    },

    // POS & Commerce
    {
      id: 'pos',
      label: 'POS / Bill Entry',
      icon: ShoppingCart,
      badge: 'PRO',
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30',
      visible: permissions.canAccessPOS,
      section: 'SALES & COMMERCE',
    },
    {
      id: 'sales',
      label: 'Sales & Invoices',
      icon: Receipt,
      badge: sales.length > 0 ? sales.length : undefined,
      visible: permissions.canViewSales,
    },
    {
      id: 'purchases',
      label: 'Purchase Orders (PO)',
      icon: Truck,
      visible: permissions.canViewPurchases,
    },

    // Parties
    {
      id: 'customers',
      label: 'Customers (Receivables)',
      icon: Users,
      visible: permissions.canManageCustomers || permissions.canViewSales,
      section: 'ACCOUNTS & EXPENSES',
    },
    {
      id: 'suppliers',
      label: 'Suppliers (Payables)',
      icon: Contact2,
      visible: permissions.canManageSuppliers || permissions.canViewPurchases,
    },
    {
      id: 'expenses',
      label: 'Expense Tracker',
      icon: DollarSign,
      visible: permissions.canManageExpenses || permissions.canViewFinancials,
    },

    // Intelligence & Financials
    {
      id: 'accounting',
      label: 'Accounting & P&L',
      icon: PieChart,
      visible: permissions.canViewFinancials,
      section: 'INTELLIGENCE & AUDIT',
    },
    {
      id: 'reports',
      label: 'Analytics & Reports',
      icon: FileSpreadsheet,
      visible: permissions.canViewReports,
    },
    {
      id: 'audit',
      label: 'Audit Trail Logs',
      icon: History,
      visible: permissions.canViewAuditLogs,
    },

    // System Administration
    {
      id: 'users',
      label: 'Users & RBAC Roles',
      icon: UserCog,
      visible: permissions.canManageUsers,
      section: 'ADMINISTRATION',
    },
    {
      id: 'settings',
      label: 'Settings & Backups',
      icon: Settings,
      visible: permissions.canManageSettings,
    },
  ];

  const handleSelectTab = (tabId: string) => {
    setActiveTab(tabId);
    if (typeof onCloseMobile === 'function') {
      onCloseMobile();
    }
  };

  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          onClick={() => {
            if (typeof onCloseMobile === 'function') onCloseMobile();
          }}
          className="fixed inset-0 z-40 bg-slate-950/80 backdrop-blur-sm lg:hidden animate-in fade-in duration-150"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-[#111111] border-r border-white/5 flex flex-col transition-transform duration-200 ease-out lg:static lg:z-auto lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="flex items-center justify-between px-6 h-16 border-b border-white/5 shrink-0 bg-[#111111]">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-base shadow-sm shrink-0">
              N
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-semibold text-lg tracking-tight text-white flex items-center gap-1 truncate">
                NEXUS <span className="text-indigo-500">INV</span>
              </span>
              <span className="text-[10px] font-mono text-slate-500 tracking-wider uppercase truncate">
                Enterprise v3.2
              </span>
            </div>
          </div>

          {/* Close button on mobile */}
          {typeof onCloseMobile === 'function' && (
            <button
              type="button"
              onClick={onCloseMobile}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg lg:hidden"
              title="Close Navigation"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Navigation List */}
        <nav className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
          {(() => {
            let lastSection = '';
            return navItems
              .filter((item) => item.visible)
              .map((item) => {
                const isNewSection = item.section && item.section !== lastSection;
                if (item.section) lastSection = item.section;

                const isActive = activeTab === item.id;
                const Icon = item.icon;

                return (
                  <React.Fragment key={item.id}>
                    {isNewSection && (
                      <div className="px-3 pt-3 pb-1 text-[10px] font-semibold tracking-wider text-slate-500 uppercase">
                        {item.section}
                      </div>
                    )}
                    <button
                      id={`nav-item-${item.id}`}
                      onClick={() => handleSelectTab(item.id)}
                      className={`group relative flex items-center justify-between w-full px-3 py-2.5 text-xs font-medium rounded-lg transition-colors ${
                        isActive
                          ? 'bg-indigo-600/10 text-indigo-400'
                          : 'text-slate-400 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <Icon
                          className={`w-4 h-4 shrink-0 transition-colors ${
                            isActive ? 'text-indigo-400' : 'text-slate-400 group-hover:text-slate-200'
                          }`}
                        />
                        <span className="truncate">{item.label}</span>
                      </div>

                      {item.badge !== undefined && (
                        <span
                          className={`ml-2 px-2 py-0.5 text-[10px] font-semibold rounded-md ${
                            item.badgeColor || (isActive ? 'bg-indigo-500/20 text-indigo-300' : 'bg-white/5 text-slate-400 border border-white/5')
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </button>
                  </React.Fragment>
                );
              });
          })()}
        </nav>

        {/* Footer Business & Operator card */}
        <div className="p-4 border-t border-white/5 bg-[#111111] shrink-0">
          <div className="flex items-center p-3 space-x-3 bg-white/5 rounded-xl border border-white/10 text-left">
            <div className="w-9 h-9 rounded-full bg-slate-800 flex-shrink-0 border border-white/10 flex items-center justify-center font-bold text-xs text-indigo-400">
              {currentUser?.name?.charAt(0) || 'N'}
            </div>
            <div className="overflow-hidden min-w-0 flex-1">
              <p className="text-xs font-medium text-white truncate">{currentUser?.name || 'Operator'}</p>
              <p className="text-[11px] text-slate-500 truncate">{currentUser?.role?.replace('_', ' ') || 'Super Admin'}</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
