import React, { useState, useRef, useEffect } from 'react';
import {
  Search,
  Bell,
  Sun,
  Moon,
  Building2,
  ShieldCheck,
  ShoppingCart,
  CheckCircle2,
  AlertTriangle,
  Package,
  TrendingUp,
  CreditCard,
  UserCheck,
  Menu,
  ChevronDown,
  X,
  ExternalLink,
  Sparkles,
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { UserRole } from '../../types';

interface HeaderProps {
  onToggleSidebarMobile?: () => void;
  onOpenSearch?: () => void;
  onOpenScanner?: () => void;
  onOpenBarcodeGen?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onToggleSidebarMobile,
  onOpenSearch,
  onOpenScanner,
  onOpenBarcodeGen,
}) => {
  const {
    currentRole,
    setCurrentRole,
    warehouses,
    selectedWarehouseId,
    setSelectedWarehouseId,
    notifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    clearNotifications,
    darkMode,
    setDarkMode,
    setIsGlobalSearchOpen,
    setActiveTab,
    currentUser,
    settings,
  } = useData();

  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isRoleOpen, setIsRoleOpen] = useState(false);
  const [isWarehouseOpen, setIsWarehouseOpen] = useState(false);

  const notifRef = useRef<HTMLDivElement>(null);
  const roleRef = useRef<HTMLDivElement>(null);
  const whRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setIsNotifOpen(false);
      }
      if (roleRef.current && !roleRef.current.contains(event.target as Node)) {
        setIsRoleOpen(false);
      }
      if (whRef.current && !whRef.current.contains(event.target as Node)) {
        setIsWarehouseOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const roles: { role: UserRole; label: string; desc: string }[] = [
    { role: 'SUPER_ADMIN', label: 'Super Admin', desc: 'Unrestricted full platform access' },
    { role: 'ADMIN', label: 'Admin', desc: 'Branch admin & settings' },
    { role: 'MANAGER', label: 'Manager', desc: 'Inventory & operations lead' },
    { role: 'CASHIER', label: 'Cashier (POS)', desc: 'Point of sale & receipts' },
    { role: 'INVENTORY_STAFF', label: 'Inventory Staff', desc: 'Stock in/out & transfers' },
    { role: 'ACCOUNTANT', label: 'Accountant', desc: 'Ledgers, P&L & financial audits' },
  ];

  const selectedWhName =
    selectedWarehouseId === 'ALL'
      ? 'All Warehouses (Global)'
      : warehouses.find((w) => w.id === selectedWarehouseId)?.name || 'Select Warehouse';

  const getNotifIcon = (type: string) => {
    switch (type) {
      case 'OUT_OF_STOCK':
      case 'LOW_STOCK':
        return <AlertTriangle className="w-4 h-4 text-amber-400" />;
      case 'SALE':
        return <TrendingUp className="w-4 h-4 text-emerald-400" />;
      case 'PURCHASE':
        return <Package className="w-4 h-4 text-sky-400" />;
      case 'PAYMENT':
        return <CreditCard className="w-4 h-4 text-indigo-400" />;
      default:
        return <Sparkles className="w-4 h-4 text-violet-400" />;
    }
  };

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 md:px-6 bg-[#111111] border-b border-white/5 transition-colors">
      {/* Left side: Mobile Menu + Search bar trigger */}
      <div className="flex items-center gap-3">
        <button
          id="btn-mobile-sidebar-toggle"
          onClick={onToggleSidebarMobile}
          className="p-2 -ml-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg lg:hidden"
          title="Open Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Global Search button */}
        <button
          id="btn-global-search-trigger"
          onClick={() => setIsGlobalSearchOpen(true)}
          className="flex items-center gap-3 px-3.5 py-1.5 text-xs text-slate-400 bg-[#1A1A1A] hover:bg-[#202020] hover:text-slate-200 border border-white/10 rounded-lg transition-colors shadow-sm w-48 sm:w-64 md:w-80 group text-left"
        >
          <Search className="w-4 h-4 text-slate-400 group-hover:text-indigo-400 transition-colors" />
          <span className="truncate">Search products, invoices, SKU...</span>
          <kbd className="hidden sm:inline-flex ml-auto text-[10px] font-mono px-1.5 py-0.5 bg-[#111111] border border-white/10 text-slate-400 rounded">
            ⌘K
          </kbd>
        </button>

        {/* Warehouse Scope Selector */}
        <div className="relative hidden md:block" ref={whRef}>
          <button
            id="btn-warehouse-scope-select"
            onClick={() => setIsWarehouseOpen(!isWarehouseOpen)}
            className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-slate-300 bg-[#1A1A1A] hover:bg-white/5 border border-white/10 rounded-lg transition-colors"
          >
            <Building2 className="w-3.5 h-3.5 text-indigo-400" />
            <span className="max-w-[140px] truncate">{selectedWhName}</span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {isWarehouseOpen && (
            <div className="absolute left-0 mt-2 w-64 p-1.5 bg-[#111111] border border-white/10 rounded-xl shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-100">
              <div className="px-2.5 py-1.5 text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
                Inventory Scope
              </div>
              <button
                onClick={() => {
                  setSelectedWarehouseId('ALL');
                  setIsWarehouseOpen(false);
                }}
                className={`flex items-center justify-between w-full px-2.5 py-2 text-xs rounded-lg text-left transition-colors ${
                  selectedWarehouseId === 'ALL'
                    ? 'bg-indigo-600/10 text-indigo-400 font-semibold'
                    : 'text-slate-300 hover:bg-white/5'
                }`}
              >
                <span>All Warehouses (Global Consolidated)</span>
                {selectedWarehouseId === 'ALL' && <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400" />}
              </button>

              <div className="my-1 border-t border-white/5" />

              {warehouses.map((wh) => (
                <button
                  key={wh.id}
                  onClick={() => {
                    setSelectedWarehouseId(wh.id);
                    setIsWarehouseOpen(false);
                  }}
                  className={`flex items-center justify-between w-full px-2.5 py-2 text-xs rounded-lg text-left transition-colors ${
                    selectedWarehouseId === wh.id
                      ? 'bg-indigo-600/10 text-indigo-400 font-semibold'
                      : 'text-slate-300 hover:bg-white/5'
                  }`}
                >
                  <div className="truncate">
                    <p className="truncate font-medium text-slate-200">{wh.name}</p>
                    <p className="text-[10px] text-slate-400 truncate">{wh.location.split(',')[0]}</p>
                  </div>
                  {selectedWarehouseId === wh.id && <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400 shrink-0 ml-2" />}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right side controls */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Quick POS / Bill Entry shortcut */}
        <button
          id="btn-quick-pos-shortcut"
          onClick={() => setActiveTab('pos')}
          className="hidden sm:flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-sm active:scale-[0.98]"
          title="Open POS Register / Fast Bill Entry"
        >
          <ShoppingCart className="w-3.5 h-3.5" />
          <span>Bill Entry (POS)</span>
        </button>

        {/* Role Switcher */}
        <div className="relative" ref={roleRef}>
          <button
            id="btn-role-switcher-toggle"
            onClick={() => setIsRoleOpen(!isRoleOpen)}
            className="flex items-center gap-2 px-2.5 py-1.5 text-xs font-medium text-amber-300 bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500/20 rounded-lg transition-colors"
            title="Switch User Role & Test RBAC Permissions"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden md:inline font-semibold">
              {roles.find((r) => r.role === currentRole)?.label}
            </span>
            <ChevronDown className="w-3 h-3 text-amber-400" />
          </button>

          {isRoleOpen && (
            <div className="absolute right-0 mt-2 w-72 p-2 bg-[#111111] border border-white/10 rounded-xl shadow-2xl z-50">
              <div className="px-2.5 py-1 text-[11px] font-bold text-amber-400 uppercase tracking-wider">
                Simulate Role (RBAC)
              </div>
              <p className="px-2.5 pb-2 text-[11px] text-slate-400">
                Switching roles immediately updates view permissions and capability guards across the entire system.
              </p>
              <div className="space-y-1">
                {roles.map((r) => (
                  <button
                    key={r.role}
                    onClick={() => {
                      setCurrentRole(r.role);
                      setIsRoleOpen(false);
                    }}
                    className={`flex items-start justify-between w-full px-2.5 py-2 text-xs rounded-lg text-left transition-colors ${
                      currentRole === r.role
                        ? 'bg-amber-500/20 text-amber-300 font-semibold'
                        : 'text-slate-300 hover:bg-white/5'
                    }`}
                  >
                    <div>
                      <p className="font-semibold">{r.label}</p>
                      <p className="text-[11px] text-slate-400">{r.desc}</p>
                    </div>
                    {currentRole === r.role && <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0 ml-2" />}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Notifications Dropdown */}
        <div className="relative" ref={notifRef}>
          <button
            id="btn-notifications-toggle"
            onClick={() => setIsNotifOpen(!isNotifOpen)}
            className="relative p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
            title="System Alerts & Notifications"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white shadow-sm ring-2 ring-[#111111] animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>

          {isNotifOpen && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 p-2 bg-[#111111] border border-white/10 rounded-2xl shadow-2xl z-50">
              <div className="flex items-center justify-between px-3 py-2 border-b border-white/5">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm text-slate-200">Notifications</span>
                  {unreadCount > 0 && (
                    <span className="px-2 py-0.5 text-[10px] font-bold bg-indigo-600/20 text-indigo-400 rounded-md">
                      {unreadCount} new
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllNotificationsAsRead}
                      className="text-[11px] text-slate-400 hover:text-indigo-400 transition-colors"
                    >
                      Mark all read
                    </button>
                  )}
                  {notifications.length > 0 && (
                    <button
                      onClick={clearNotifications}
                      className="text-[11px] text-slate-400 hover:text-rose-400 transition-colors"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-white/5 p-1">
                {notifications.length === 0 ? (
                  <div className="py-8 text-center text-slate-400 text-xs">No notifications yet.</div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => {
                        markNotificationAsRead(n.id);
                        if (n.linkTab) {
                          setActiveTab(n.linkTab);
                          setIsNotifOpen(false);
                        }
                      }}
                      className={`flex items-start gap-3 p-2.5 rounded-xl cursor-pointer transition-colors ${
                        !n.isRead ? 'bg-white/5 hover:bg-white/10' : 'hover:bg-white/5'
                      }`}
                    >
                      <div className="p-2 bg-[#1A1A1A] border border-white/5 rounded-lg shrink-0 mt-0.5">{getNotifIcon(n.type)}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <p className={`text-xs font-semibold truncate ${!n.isRead ? 'text-white' : 'text-slate-300'}`}>
                            {n.title}
                          </p>
                          <span className="text-[10px] text-slate-400 shrink-0">
                            {new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 line-clamp-2 mt-0.5">{n.message}</p>
                      </div>
                      {!n.isRead && <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0 mt-1.5" />}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Dark/Light mode toggle */}
        <button
          id="btn-theme-toggle"
          onClick={() => setDarkMode((prev) => !prev)}
          className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
          title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {darkMode ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-indigo-300" />}
        </button>

        {/* User profile avatar / pill */}
        <div className="flex items-center gap-2.5 pl-2 border-l border-white/5">
          <div className="w-8 h-8 rounded-full bg-slate-800 border border-white/10 flex items-center justify-center text-xs font-bold text-indigo-400 shrink-0">
            {currentUser?.name?.charAt(0) || 'A'}
          </div>
          <div className="hidden xl:block text-left">
            <p className="text-xs font-medium text-white leading-tight truncate max-w-[110px]">{currentUser.name}</p>
            <p className="text-[10px] text-slate-500 font-mono tracking-tight">{currentUser.role.replace('_', ' ')}</p>
          </div>
        </div>
      </div>
    </header>
  );
};
