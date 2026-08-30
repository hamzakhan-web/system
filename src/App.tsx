import React, { useState } from 'react';
import { DataProvider, useData } from './context/DataContext';
import { Header } from './components/common/Header';
import { Sidebar } from './components/common/Sidebar';
import { GlobalSearchModal } from './components/common/GlobalSearchModal';
import { BarcodeGeneratorModal } from './components/common/BarcodeGeneratorModal';
import { BarcodeScannerModal } from './components/common/BarcodeScannerModal';

import { DashboardView } from './components/dashboard/DashboardView';
import { ProductsView } from './components/products/ProductsView';
import { InventoryView } from './components/inventory/InventoryView';
import { WarehousesView } from './components/warehouses/WarehousesView';
import { POSView } from './components/pos/POSView';
import { SalesView } from './components/sales/SalesView';
import { PurchasesView } from './components/purchases/PurchasesView';
import { CustomersView } from './components/customers/CustomersView';
import { SuppliersView } from './components/suppliers/SuppliersView';
import { ExpensesView } from './components/expenses/ExpensesView';
import { AccountingView } from './components/accounting/AccountingView';
import { ReportsView } from './components/reports/ReportsView';
import { UsersView } from './components/users/UsersView';
import { AuditLogsView } from './components/audit/AuditLogsView';
import { SettingsView } from './components/settings/SettingsView';

const MainLayout: React.FC = () => {
  const { activeTab, setActiveTab } = useData();

  // Mobile navigation state
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Global modals
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isBarcodeGenOpen, setIsBarcodeGenOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  const renderActiveView = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardView />;
      case 'products':
        return <ProductsView />;
      case 'inventory':
        return <InventoryView />;
      case 'warehouses':
        return <WarehousesView />;
      case 'pos':
        return <POSView />;
      case 'sales':
        return <SalesView />;
      case 'purchases':
        return <PurchasesView />;
      case 'customers':
        return <CustomersView />;
      case 'suppliers':
        return <SuppliersView />;
      case 'expenses':
        return <ExpensesView />;
      case 'accounting':
        return <AccountingView />;
      case 'reports':
        return <ReportsView />;
      case 'users':
        return <UsersView />;
      case 'audit':
        return <AuditLogsView />;
      case 'settings':
        return <SettingsView />;
      default:
        return <DashboardView />;
    }
  };

  return (
    <div className="flex h-screen bg-[#0A0A0A] text-slate-300 font-sans antialiased overflow-hidden selection:bg-indigo-600 selection:text-white">
      {/* Navigation Sidebar */}
      <Sidebar
        mobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
        onOpenScanner={() => setIsScannerOpen(true)}
        onOpenBarcodeGen={() => setIsBarcodeGenOpen(true)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-[#0A0A0A]">
        {/* Global App Header */}
        <Header
          onToggleSidebarMobile={() => setIsMobileSidebarOpen((prev) => !prev)}
          onOpenSearch={() => setIsSearchOpen(true)}
          onOpenScanner={() => setIsScannerOpen(true)}
          onOpenBarcodeGen={() => setIsBarcodeGenOpen(true)}
        />

        {/* Scrollable Viewport Container */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-[#0A0A0A]">
          <div className="max-w-[1600px] mx-auto w-full">
            {renderActiveView()}
          </div>
        </main>
      </div>

      {/* Cross-system Global Modals */}
      {isSearchOpen && <GlobalSearchModal onClose={() => setIsSearchOpen(false)} />}
      {isBarcodeGenOpen && <BarcodeGeneratorModal onClose={() => setIsBarcodeGenOpen(false)} />}
      {isScannerOpen && (
        <BarcodeScannerModal
          onScanProduct={(prod) => {
            setIsScannerOpen(false);
            setActiveTab('pos');
          }}
          onClose={() => setIsScannerOpen(false)}
        />
      )}
    </div>
  );
};

export default function App() {
  return (
    <DataProvider>
      <MainLayout />
    </DataProvider>
  );
}
