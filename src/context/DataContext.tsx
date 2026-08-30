import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import {
  User,
  UserRole,
  UserPermission,
  Category,
  Brand,
  Unit,
  Warehouse,
  WarehouseStock,
  Product,
  StockTransaction,
  StockTransactionType,
  Customer,
  Supplier,
  Sale,
  SaleItem,
  Purchase,
  PurchaseItem,
  PaymentRecord,
  PaymentMethod,
  PaymentStatus,
  ExpenseCategory,
  Expense,
  AuditLog,
  SystemNotification,
  SystemSettings,
} from '../types';
import {
  INITIAL_USERS,
  ROLE_PERMISSIONS,
  INITIAL_CATEGORIES,
  INITIAL_BRANDS,
  INITIAL_UNITS,
  INITIAL_WAREHOUSES,
  INITIAL_WAREHOUSE_STOCKS,
  INITIAL_SUPPLIERS,
  INITIAL_CUSTOMERS,
  INITIAL_PRODUCTS,
  INITIAL_EXPENSE_CATEGORIES,
  INITIAL_EXPENSES,
  INITIAL_SALES,
  INITIAL_PURCHASES,
  INITIAL_PAYMENTS,
  INITIAL_TRANSACTIONS,
  INITIAL_AUDIT_LOGS,
  INITIAL_NOTIFICATIONS,
  INITIAL_SETTINGS,
} from '../data/seedData';

interface DataContextType {
  // Master data
  products: Product[];
  categories: Category[];
  brands: Brand[];
  units: Unit[];
  warehouses: Warehouse[];
  warehouseStocks: WarehouseStock[];
  customers: Customer[];
  suppliers: Supplier[];
  sales: Sale[];
  purchases: Purchase[];
  payments: PaymentRecord[];
  expenses: Expense[];
  expenseCategories: ExpenseCategory[];
  transactions: StockTransaction[];
  auditLogs: AuditLog[];
  notifications: SystemNotification[];
  users: User[];
  settings: SystemSettings;

  // Session & UI
  currentUser: User;
  currentRole: UserRole;
  permissions: UserPermission;
  selectedWarehouseId: string; // 'ALL' or specific warehouseId
  activeTab: string;
  darkMode: boolean;
  globalSearchQuery: string;
  isGlobalSearchOpen: boolean;

  // Setters
  setCurrentRole: (role: UserRole) => void;
  setSelectedWarehouseId: (id: string) => void;
  setActiveTab: (tab: string) => void;
  setDarkMode: (val: boolean | ((prev: boolean) => boolean)) => void;
  setGlobalSearchQuery: (q: string) => void;
  setIsGlobalSearchOpen: (open: boolean) => void;

  // Business Actions (ACID-like state transitions)
  createSale: (saleData: {
    customerId: string;
    warehouseId: string;
    items: {
      productId: string;
      quantity: number;
      unitPrice: number;
      discountPercent?: number;
    }[];
    discountTotal?: number;
    paidAmount: number;
    paymentMethod: PaymentMethod;
    notes?: string;
  }) => { success: boolean; sale?: Sale; error?: string };

  createPurchase: (purchaseData: {
    supplierId: string;
    warehouseId: string;
    items: {
      productId: string;
      quantity: number;
      unitCost: number;
    }[];
    discountTotal?: number;
    paidAmount: number;
    paymentMethod: PaymentMethod;
    notes?: string;
  }) => { success: boolean; purchase?: Purchase; error?: string };

  adjustStock: (
    productId: string,
    warehouseId: string,
    type: StockTransactionType,
    quantity: number,
    notes: string
  ) => { success: boolean; error?: string };

  transferStock: (
    productId: string,
    fromWarehouseId: string,
    toWarehouseId: string,
    quantity: number,
    notes: string
  ) => { success: boolean; error?: string };

  recordCustomerPayment: (
    customerId: string,
    amount: number,
    method: PaymentMethod,
    reference?: string,
    notes?: string
  ) => { success: boolean; error?: string };

  recordSupplierPayment: (
    supplierId: string,
    amount: number,
    method: PaymentMethod,
    reference?: string,
    notes?: string
  ) => { success: boolean; error?: string };

  createExpense: (expenseData: {
    categoryId: string;
    title: string;
    amount: number;
    paymentMethod: PaymentMethod;
    warehouseId?: string;
    notes?: string;
  }) => { success: boolean; expense?: Expense; error?: string };

  // CRUD Product
  addProduct: (prod: Omit<Product, 'id' | 'createdAt' | 'updatedAt' | 'currentStock'> & { initialStock?: number }) => Product;
  updateProduct: (id: string, prod: Partial<Product>) => void;
  deleteProduct: (id: string) => { success: boolean; error?: string };

  // CRUD Customers & Suppliers
  addCustomer: (cust: Omit<Customer, 'id' | 'createdAt' | 'totalPurchases' | 'totalPaid' | 'outstandingBalance'>) => Customer;
  updateCustomer: (id: string, cust: Partial<Customer>) => void;
  deleteCustomer: (id: string) => void;

  addSupplier: (sup: Omit<Supplier, 'id' | 'createdAt' | 'totalPurchased' | 'totalPaid' | 'outstandingPayable'>) => Supplier;
  updateSupplier: (id: string, sup: Partial<Supplier>) => void;
  deleteSupplier: (id: string) => void;

  // CRUD Warehouses & Users
  addWarehouse: (wh: Omit<Warehouse, 'id'>) => Warehouse;
  updateWarehouse: (id: string, wh: Partial<Warehouse>) => void;
  addUser: (user: Omit<User, 'id' | 'createdAt'>) => User;
  updateUser: (id: string, user: Partial<User>) => void;
  deleteUser: (id: string) => void;

  // Settings & Notifications
  updateSettings: (newSettings: Partial<SystemSettings>) => void;
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: () => void;
  clearNotifications: () => void;
  resetToDefaultData: () => void;
  exportBackupJson: () => string;
  importBackupJson: (jsonData: string) => boolean;

  // Helpers
  getWarehouseStock: (productId: string, warehouseId: string) => number;
  getProductTotalStock: (productId: string) => number;
  formatCurrency: (amount: number) => string;
}

const DataContext = createContext<DataContextType | null>(null);

const STORAGE_KEY = 'nexus_inventory_saas_db_v1';

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Load from localStorage or seed
  const loadInitialData = <T,>(key: string, defaultData: T): T => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_${key}`);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.warn(`Failed to parse ${key} from storage:`, e);
    }
    return defaultData;
  };

  const [products, setProducts] = useState<Product[]>(() => loadInitialData('products', INITIAL_PRODUCTS));
  const [categories, setCategories] = useState<Category[]>(() => loadInitialData('categories', INITIAL_CATEGORIES));
  const [brands, setBrands] = useState<Brand[]>(() => loadInitialData('brands', INITIAL_BRANDS));
  const [units, setUnits] = useState<Unit[]>(() => loadInitialData('units', INITIAL_UNITS));
  const [warehouses, setWarehouses] = useState<Warehouse[]>(() => loadInitialData('warehouses', INITIAL_WAREHOUSES));
  const [warehouseStocks, setWarehouseStocks] = useState<WarehouseStock[]>(() => loadInitialData('warehouseStocks', INITIAL_WAREHOUSE_STOCKS));
  const [customers, setCustomers] = useState<Customer[]>(() => loadInitialData('customers', INITIAL_CUSTOMERS));
  const [suppliers, setSuppliers] = useState<Supplier[]>(() => loadInitialData('suppliers', INITIAL_SUPPLIERS));
  const [sales, setSales] = useState<Sale[]>(() => loadInitialData('sales', INITIAL_SALES));
  const [purchases, setPurchases] = useState<Purchase[]>(() => loadInitialData('purchases', INITIAL_PURCHASES));
  const [payments, setPayments] = useState<PaymentRecord[]>(() => loadInitialData('payments', INITIAL_PAYMENTS));
  const [expenses, setExpenses] = useState<Expense[]>(() => loadInitialData('expenses', INITIAL_EXPENSES));
  const [expenseCategories, setExpenseCategories] = useState<ExpenseCategory[]>(() => loadInitialData('expenseCategories', INITIAL_EXPENSE_CATEGORIES));
  const [transactions, setTransactions] = useState<StockTransaction[]>(() => loadInitialData('transactions', INITIAL_TRANSACTIONS));
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => loadInitialData('auditLogs', INITIAL_AUDIT_LOGS));
  const [notifications, setNotifications] = useState<SystemNotification[]>(() => loadInitialData('notifications', INITIAL_NOTIFICATIONS));
  const [users, setUsers] = useState<User[]>(() => loadInitialData('users', INITIAL_USERS));
  const [settings, setSettings] = useState<SystemSettings>(() => loadInitialData('settings', INITIAL_SETTINGS));

  // Active Session
  const [currentRole, setCurrentRole] = useState<UserRole>('SUPER_ADMIN');
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string>('ALL');
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [darkMode, setDarkMode] = useState<boolean>(true);
  const [globalSearchQuery, setGlobalSearchQuery] = useState<string>('');
  const [isGlobalSearchOpen, setIsGlobalSearchOpen] = useState<boolean>(false);

  // Sync to local storage
  useEffect(() => {
    try {
      localStorage.setItem(`${STORAGE_KEY}_products`, JSON.stringify(products));
      localStorage.setItem(`${STORAGE_KEY}_categories`, JSON.stringify(categories));
      localStorage.setItem(`${STORAGE_KEY}_warehouses`, JSON.stringify(warehouses));
      localStorage.setItem(`${STORAGE_KEY}_warehouseStocks`, JSON.stringify(warehouseStocks));
      localStorage.setItem(`${STORAGE_KEY}_customers`, JSON.stringify(customers));
      localStorage.setItem(`${STORAGE_KEY}_suppliers`, JSON.stringify(suppliers));
      localStorage.setItem(`${STORAGE_KEY}_sales`, JSON.stringify(sales));
      localStorage.setItem(`${STORAGE_KEY}_purchases`, JSON.stringify(purchases));
      localStorage.setItem(`${STORAGE_KEY}_payments`, JSON.stringify(payments));
      localStorage.setItem(`${STORAGE_KEY}_expenses`, JSON.stringify(expenses));
      localStorage.setItem(`${STORAGE_KEY}_transactions`, JSON.stringify(transactions));
      localStorage.setItem(`${STORAGE_KEY}_auditLogs`, JSON.stringify(auditLogs));
      localStorage.setItem(`${STORAGE_KEY}_notifications`, JSON.stringify(notifications));
      localStorage.setItem(`${STORAGE_KEY}_users`, JSON.stringify(users));
      localStorage.setItem(`${STORAGE_KEY}_settings`, JSON.stringify(settings));
    } catch (e) {
      console.warn('Failed to sync to localStorage:', e);
    }
  }, [products, categories, warehouses, warehouseStocks, customers, suppliers, sales, purchases, payments, expenses, transactions, auditLogs, notifications, users, settings]);

  // Derived current user based on role
  const currentUser = useMemo(() => {
    const matched = users.find((u) => u.role === currentRole);
    return matched || users[0];
  }, [users, currentRole]);

  const permissions = useMemo(() => {
    return ROLE_PERMISSIONS[currentRole] || ROLE_PERMISSIONS.SUPER_ADMIN;
  }, [currentRole]);

  // Currency Formatter
  const formatCurrency = (amount: number) => {
    const symbol = settings.currencySymbol || '$';
    return `${symbol}${Number(amount || 0).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  // Warehouse stock helper
  const getWarehouseStock = (productId: string, warehouseId: string): number => {
    if (warehouseId === 'ALL') {
      const p = products.find((x) => x.id === productId);
      return p ? p.currentStock : 0;
    }
    const ws = warehouseStocks.find((x) => x.productId === productId && x.warehouseId === warehouseId);
    return ws ? ws.quantity : 0;
  };

  const getProductTotalStock = (productId: string): number => {
    const p = products.find((x) => x.id === productId);
    return p ? p.currentStock : 0;
  };

  // Internal helper: Add Audit Log
  const logAudit = (action: string, module: string, recordId: string, details: string) => {
    if (!settings.enableAuditLogs) return;
    const newLog: AuditLog = {
      id: `aud-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      timestamp: new Date().toISOString(),
      userId: currentUser.id,
      userName: currentUser.name,
      userRole: currentRole,
      action,
      module,
      recordId,
      details,
      ipAddress: '127.0.0.1 (Internal Agent)',
    };
    setAuditLogs((prev) => [newLog, ...prev]);
  };

  // Internal helper: Push Notification
  const pushNotification = (title: string, message: string, type: SystemNotification['type'], linkTab?: string) => {
    const newNotif: SystemNotification = {
      id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      title,
      message,
      type,
      isRead: false,
      timestamp: new Date().toISOString(),
      linkTab,
    };
    setNotifications((prev) => [newNotif, ...prev]);
  };

  // ==========================================
  // TRANSACTION 1: CREATE SALE (POS / INVOICE)
  // ==========================================
  const createSale = (saleData: {
    customerId: string;
    warehouseId: string;
    items: {
      productId: string;
      quantity: number;
      unitPrice: number;
      discountPercent?: number;
    }[];
    discountTotal?: number;
    paidAmount: number;
    paymentMethod: PaymentMethod;
    notes?: string;
  }): { success: boolean; sale?: Sale; error?: string } => {
    const { customerId, warehouseId, items, discountTotal = 0, paidAmount, paymentMethod, notes } = saleData;

    if (!items || items.length === 0) {
      return { success: false, error: 'Cannot process sale with empty cart.' };
    }

    const customer = customers.find((c) => c.id === customerId);
    if (!customer) {
      return { success: false, error: 'Invalid customer selected.' };
    }

    const warehouse = warehouses.find((w) => w.id === warehouseId);
    if (!warehouse) {
      return { success: false, error: 'Invalid warehouse selected.' };
    }

    // Check stock availability
    for (const item of items) {
      const prod = products.find((p) => p.id === item.productId);
      if (!prod) {
        return { success: false, error: `Product ID ${item.productId} not found.` };
      }
      const availableStock = getWarehouseStock(item.productId, warehouseId);
      if (!settings.allowNegativeStock && availableStock < item.quantity) {
        return {
          success: false,
          error: `Insufficient stock for "${prod.name}" in ${warehouse.name}. Available: ${availableStock}, Requested: ${item.quantity}.`,
        };
      }
    }

    // Calculate lines
    let calculatedSubtotal = 0;
    let calculatedTaxTotal = 0;
    let calculatedDiscountTotal = discountTotal;
    let calculatedCOGS = 0;
    let totalItemsCount = 0;

    const saleItems: SaleItem[] = items.map((item, idx) => {
      const prod = products.find((p) => p.id === item.productId)!;
      const lineSubtotal = item.quantity * item.unitPrice;
      const lineDiscountAmt = (lineSubtotal * (item.discountPercent || 0)) / 100;
      const taxableAmount = lineSubtotal - lineDiscountAmt;
      const lineTaxAmt = (taxableAmount * (prod.taxRate || settings.taxRateDefault)) / 100;
      const lineTotal = taxableAmount + lineTaxAmt;

      calculatedSubtotal += lineSubtotal;
      calculatedTaxTotal += lineTaxAmt;
      calculatedDiscountTotal += lineDiscountAmt;
      calculatedCOGS += item.quantity * prod.purchasePrice;
      totalItemsCount += item.quantity;

      return {
        id: `si-${Date.now()}-${idx}`,
        productId: prod.id,
        productName: prod.name,
        sku: prod.sku,
        barcode: prod.barcode,
        unit: prod.unit,
        unitCost: prod.purchasePrice,
        unitPrice: item.unitPrice,
        quantity: item.quantity,
        discountPercent: item.discountPercent || 0,
        taxPercent: prod.taxRate || settings.taxRateDefault,
        subtotal: lineSubtotal,
        total: Number(lineTotal.toFixed(2)),
      };
    });

    const grandTotal = Number((calculatedSubtotal - calculatedDiscountTotal + calculatedTaxTotal).toFixed(2));
    const cleanPaidAmount = Number(Math.min(paidAmount, grandTotal).toFixed(2));
    const balanceDue = Number(Math.max(0, grandTotal - cleanPaidAmount).toFixed(2));
    const paymentStatus: PaymentStatus = balanceDue === 0 ? 'PAID' : cleanPaidAmount > 0 ? 'PARTIAL' : 'UNPAID';
    const profit = Number((grandTotal - calculatedTaxTotal - calculatedCOGS).toFixed(2));

    const invoiceNumber = `${settings.invoicePrefix}${1000 + sales.length + 1}`;
    const newSaleId = `sale-${Date.now()}`;
    const timestamp = new Date().toISOString();

    const newSale: Sale = {
      id: newSaleId,
      invoiceNumber,
      date: timestamp,
      customerId: customer.id,
      customerName: customer.name,
      customerPhone: customer.phone,
      warehouseId: warehouse.id,
      warehouseName: warehouse.name,
      cashierId: currentUser.id,
      cashierName: currentUser.name,
      items: saleItems,
      itemCount: totalItemsCount,
      subtotal: Number(calculatedSubtotal.toFixed(2)),
      taxTotal: Number(calculatedTaxTotal.toFixed(2)),
      discountTotal: Number(calculatedDiscountTotal.toFixed(2)),
      grandTotal,
      paidAmount: cleanPaidAmount,
      balanceDue,
      paymentMethod,
      paymentStatus,
      profit,
      notes,
      createdAt: timestamp,
    };

    // 1. Update warehouse stocks and global product currentStock
    const updatedWarehouseStocks = [...warehouseStocks];
    const updatedProducts = products.map((prod) => {
      const soldItem = items.find((it) => it.productId === prod.id);
      if (!soldItem) return prod;

      const newGlobalStock = Math.max(0, prod.currentStock - soldItem.quantity);
      return {
        ...prod,
        currentStock: newGlobalStock,
        updatedAt: timestamp,
      };
    });

    const newTransactions: StockTransaction[] = [];

    items.forEach((item) => {
      const prod = products.find((p) => p.id === item.productId)!;
      const wsIdx = updatedWarehouseStocks.findIndex(
        (ws) => ws.productId === item.productId && ws.warehouseId === warehouseId
      );
      const prevQty = wsIdx >= 0 ? updatedWarehouseStocks[wsIdx].quantity : 0;
      const newQty = prevQty - item.quantity;

      if (wsIdx >= 0) {
        updatedWarehouseStocks[wsIdx] = {
          ...updatedWarehouseStocks[wsIdx],
          quantity: newQty,
          updatedAt: timestamp,
        };
      } else {
        updatedWarehouseStocks.push({
          id: `ws-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          warehouseId,
          productId: item.productId,
          quantity: newQty,
          updatedAt: timestamp,
        });
      }

      // Record transaction
      newTransactions.push({
        id: `tx-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        date: timestamp,
        productId: prod.id,
        productName: prod.name,
        productSku: prod.sku,
        warehouseId: warehouse.id,
        warehouseName: warehouse.name,
        type: 'SALE',
        quantity: -item.quantity,
        previousStock: prevQty,
        newStock: newQty,
        unitCost: prod.purchasePrice,
        totalCost: Number((item.quantity * prod.purchasePrice).toFixed(2)),
        userId: currentUser.id,
        userName: currentUser.name,
        referenceId: newSaleId,
        referenceType: 'SALE',
        notes: `Sale ${invoiceNumber} to ${customer.name}`,
        createdAt: timestamp,
      });

      // Check low stock triggers
      const updatedGlobal = updatedProducts.find((p) => p.id === prod.id)?.currentStock ?? 0;
      if (updatedGlobal === 0) {
        pushNotification(
          'Product Out of Stock',
          `"${prod.name}" (${prod.sku}) is completely OUT OF STOCK!`,
          'OUT_OF_STOCK',
          'inventory'
        );
      } else if (updatedGlobal <= prod.minStock) {
        pushNotification(
          'Low Stock Warning',
          `"${prod.name}" has reached low stock (${updatedGlobal} left, min: ${prod.minStock}).`,
          'LOW_STOCK',
          'inventory'
        );
      }
    });

    // 2. Update Customer ledger
    const updatedCustomers = customers.map((c) => {
      if (c.id !== customer.id) return c;
      const newPurchases = Number((c.totalPurchases + grandTotal).toFixed(2));
      const newPaid = Number((c.totalPaid + cleanPaidAmount).toFixed(2));
      const newOutstanding = Number((c.outstandingBalance + balanceDue).toFixed(2));
      return {
        ...c,
        totalPurchases: newPurchases,
        totalPaid: newPaid,
        outstandingBalance: newOutstanding,
      };
    });

    // 3. Payment record
    const newPayments: PaymentRecord[] = [];
    if (cleanPaidAmount > 0) {
      newPayments.push({
        id: `pay-${Date.now()}`,
        date: timestamp,
        type: 'CUSTOMER_PAYMENT',
        referenceId: newSaleId,
        referenceNumber: invoiceNumber,
        partyId: customer.id,
        partyName: customer.name,
        partyType: 'CUSTOMER',
        amount: cleanPaidAmount,
        paymentMethod,
        notes: `Payment for Sale ${invoiceNumber}`,
        recordedBy: currentUser.name,
        createdAt: timestamp,
      });
    }

    // Commit state
    setWarehouseStocks(updatedWarehouseStocks);
    setProducts(updatedProducts);
    setSales((prev) => [newSale, ...prev]);
    setTransactions((prev) => [...newTransactions, ...prev]);
    setCustomers(updatedCustomers);
    if (newPayments.length > 0) {
      setPayments((prev) => [...newPayments, ...prev]);
    }

    logAudit('CREATE_SALE', 'POS', newSale.id, `Created Sale ${invoiceNumber} for ${formatCurrency(grandTotal)}`);
    pushNotification(
      'New Sale Completed',
      `Invoice #${invoiceNumber} completed for ${formatCurrency(grandTotal)} (${customer.name}).`,
      'SALE',
      'sales'
    );

    return { success: true, sale: newSale };
  };

  // ==========================================
  // TRANSACTION 2: CREATE PURCHASE (INBOUND PO)
  // ==========================================
  const createPurchase = (purchaseData: {
    supplierId: string;
    warehouseId: string;
    items: {
      productId: string;
      quantity: number;
      unitCost: number;
    }[];
    discountTotal?: number;
    paidAmount: number;
    paymentMethod: PaymentMethod;
    notes?: string;
  }): { success: boolean; purchase?: Purchase; error?: string } => {
    const { supplierId, warehouseId, items, discountTotal = 0, paidAmount, paymentMethod, notes } = purchaseData;

    if (!items || items.length === 0) {
      return { success: false, error: 'Cannot create purchase order with zero items.' };
    }

    const supplier = suppliers.find((s) => s.id === supplierId);
    if (!supplier) {
      return { success: false, error: 'Supplier not found.' };
    }

    const warehouse = warehouses.find((w) => w.id === warehouseId);
    if (!warehouse) {
      return { success: false, error: 'Warehouse not found.' };
    }

    let calculatedSubtotal = 0;
    const purchaseItems: PurchaseItem[] = items.map((item, idx) => {
      const prod = products.find((p) => p.id === item.productId);
      const lineSubtotal = item.quantity * item.unitCost;
      calculatedSubtotal += lineSubtotal;

      return {
        id: `pi-${Date.now()}-${idx}`,
        productId: item.productId,
        productName: prod ? prod.name : 'Unknown Product',
        sku: prod ? prod.sku : 'SKU-NONE',
        unit: prod ? prod.unit : 'pcs',
        unitCost: item.unitCost,
        quantity: item.quantity,
        taxPercent: 0,
        subtotal: lineSubtotal,
        total: lineSubtotal,
      };
    });

    const grandTotal = Number((calculatedSubtotal - discountTotal).toFixed(2));
    const cleanPaidAmount = Number(Math.min(paidAmount, grandTotal).toFixed(2));
    const balanceDue = Number(Math.max(0, grandTotal - cleanPaidAmount).toFixed(2));
    const paymentStatus: PaymentStatus = balanceDue === 0 ? 'PAID' : cleanPaidAmount > 0 ? 'PARTIAL' : 'UNPAID';

    const poNumber = `${settings.poPrefix}${5000 + purchases.length + 1}`;
    const newPurchaseId = `po-${Date.now()}`;
    const timestamp = new Date().toISOString();

    const newPurchase: Purchase = {
      id: newPurchaseId,
      poNumber,
      date: timestamp,
      supplierId: supplier.id,
      supplierName: supplier.name,
      warehouseId: warehouse.id,
      warehouseName: warehouse.name,
      receiverId: currentUser.id,
      receiverName: currentUser.name,
      items: purchaseItems,
      subtotal: Number(calculatedSubtotal.toFixed(2)),
      taxTotal: 0,
      discountTotal,
      grandTotal,
      paidAmount: cleanPaidAmount,
      balanceDue,
      paymentMethod,
      paymentStatus,
      status: 'RECEIVED',
      notes,
      createdAt: timestamp,
    };

    // Update warehouse stock and product purchase price & stock
    const updatedWarehouseStocks = [...warehouseStocks];
    const updatedProducts = products.map((prod) => {
      const purchasedItem = items.find((it) => it.productId === prod.id);
      if (!purchasedItem) return prod;

      const newGlobalStock = prod.currentStock + purchasedItem.quantity;
      return {
        ...prod,
        currentStock: newGlobalStock,
        purchasePrice: purchasedItem.unitCost > 0 ? purchasedItem.unitCost : prod.purchasePrice,
        updatedAt: timestamp,
      };
    });

    const newTransactions: StockTransaction[] = [];

    items.forEach((item) => {
      const prod = products.find((p) => p.id === item.productId)!;
      const wsIdx = updatedWarehouseStocks.findIndex(
        (ws) => ws.productId === item.productId && ws.warehouseId === warehouseId
      );
      const prevQty = wsIdx >= 0 ? updatedWarehouseStocks[wsIdx].quantity : 0;
      const newQty = prevQty + item.quantity;

      if (wsIdx >= 0) {
        updatedWarehouseStocks[wsIdx] = {
          ...updatedWarehouseStocks[wsIdx],
          quantity: newQty,
          updatedAt: timestamp,
        };
      } else {
        updatedWarehouseStocks.push({
          id: `ws-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          warehouseId,
          productId: item.productId,
          quantity: newQty,
          updatedAt: timestamp,
        });
      }

      newTransactions.push({
        id: `tx-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        date: timestamp,
        productId: prod.id,
        productName: prod.name,
        productSku: prod.sku,
        warehouseId: warehouse.id,
        warehouseName: warehouse.name,
        type: 'PURCHASE',
        quantity: item.quantity,
        previousStock: prevQty,
        newStock: newQty,
        unitCost: item.unitCost,
        totalCost: Number((item.quantity * item.unitCost).toFixed(2)),
        userId: currentUser.id,
        userName: currentUser.name,
        referenceId: newPurchaseId,
        referenceType: 'PURCHASE',
        notes: `Purchase Order ${poNumber} from ${supplier.name}`,
        createdAt: timestamp,
      });
    });

    // Update Supplier balances
    const updatedSuppliers = suppliers.map((s) => {
      if (s.id !== supplier.id) return s;
      const newPurchased = Number((s.totalPurchased + grandTotal).toFixed(2));
      const newPaid = Number((s.totalPaid + cleanPaidAmount).toFixed(2));
      const newPayable = Number((s.outstandingPayable + balanceDue).toFixed(2));
      return {
        ...s,
        totalPurchased: newPurchased,
        totalPaid: newPaid,
        outstandingPayable: newPayable,
      };
    });

    // Payment Record
    const newPayments: PaymentRecord[] = [];
    if (cleanPaidAmount > 0) {
      newPayments.push({
        id: `pay-${Date.now()}`,
        date: timestamp,
        type: 'SUPPLIER_PAYMENT',
        referenceId: newPurchaseId,
        referenceNumber: poNumber,
        partyId: supplier.id,
        partyName: supplier.name,
        partyType: 'SUPPLIER',
        amount: cleanPaidAmount,
        paymentMethod,
        notes: `Payment for Purchase Order ${poNumber}`,
        recordedBy: currentUser.name,
        createdAt: timestamp,
      });
    }

    setWarehouseStocks(updatedWarehouseStocks);
    setProducts(updatedProducts);
    setPurchases((prev) => [newPurchase, ...prev]);
    setTransactions((prev) => [...newTransactions, ...prev]);
    setSuppliers(updatedSuppliers);
    if (newPayments.length > 0) {
      setPayments((prev) => [...newPayments, ...prev]);
    }

    logAudit('CREATE_PURCHASE', 'PURCHASES', newPurchase.id, `Received PO ${poNumber} worth ${formatCurrency(grandTotal)}`);
    pushNotification(
      'Purchase Order Received',
      `PO #${poNumber} received at ${warehouse.name} from ${supplier.name}.`,
      'PURCHASE',
      'purchases'
    );

    return { success: true, purchase: newPurchase };
  };

  // ==========================================
  // TRANSACTION 3: STOCK ADJUSTMENT
  // ==========================================
  const adjustStock = (
    productId: string,
    warehouseId: string,
    type: StockTransactionType,
    quantity: number,
    notes: string
  ): { success: boolean; error?: string } => {
    const prod = products.find((p) => p.id === productId);
    if (!prod) return { success: false, error: 'Product not found.' };

    const warehouse = warehouses.find((w) => w.id === warehouseId);
    if (!warehouse) return { success: false, error: 'Warehouse not found.' };

    const currentWhQty = getWarehouseStock(productId, warehouseId);
    let delta = quantity;

    if (type === 'ADJUSTMENT_SUB' || type === 'DAMAGED' || type === 'LOST' || type === 'STOCK_OUT') {
      delta = -Math.abs(quantity);
      if (!settings.allowNegativeStock && currentWhQty + delta < 0) {
        return { success: false, error: `Cannot reduce below 0. Current warehouse stock is ${currentWhQty}.` };
      }
    } else if (type === 'ADJUSTMENT_ADD' || type === 'STOCK_IN' || type === 'CUSTOMER_RETURN') {
      delta = Math.abs(quantity);
    } else if (type === 'AUDIT_CORRECTION') {
      // quantity is target absolute stock
      delta = quantity - currentWhQty;
    }

    const newWhQty = currentWhQty + delta;
    const newGlobalStock = Math.max(0, prod.currentStock + delta);
    const timestamp = new Date().toISOString();

    // Update warehouse stock
    const updatedStocks = [...warehouseStocks];
    const wsIdx = updatedStocks.findIndex((ws) => ws.productId === productId && ws.warehouseId === warehouseId);
    if (wsIdx >= 0) {
      updatedStocks[wsIdx] = { ...updatedStocks[wsIdx], quantity: newWhQty, updatedAt: timestamp };
    } else {
      updatedStocks.push({
        id: `ws-${Date.now()}`,
        warehouseId,
        productId,
        quantity: newWhQty,
        updatedAt: timestamp,
      });
    }

    // Update product global stock
    setProducts((prev) =>
      prev.map((p) => (p.id === productId ? { ...p, currentStock: newGlobalStock, updatedAt: timestamp } : p))
    );
    setWarehouseStocks(updatedStocks);

    // Ledger transaction
    const newTx: StockTransaction = {
      id: `tx-${Date.now()}`,
      date: timestamp,
      productId: prod.id,
      productName: prod.name,
      productSku: prod.sku,
      warehouseId: warehouse.id,
      warehouseName: warehouse.name,
      type,
      quantity: delta,
      previousStock: currentWhQty,
      newStock: newWhQty,
      unitCost: prod.purchasePrice,
      totalCost: Number((Math.abs(delta) * prod.purchasePrice).toFixed(2)),
      userId: currentUser.id,
      userName: currentUser.name,
      referenceType: 'ADJUSTMENT',
      notes,
      createdAt: timestamp,
    };

    setTransactions((prev) => [newTx, ...prev]);
    logAudit('STOCK_ADJUSTMENT', 'INVENTORY', prod.id, `Stock adjustment (${type}) on ${prod.name}: ${delta > 0 ? '+' : ''}${delta} units`);

    return { success: true };
  };

  // ==========================================
  // TRANSACTION 4: STOCK TRANSFER BETWEEN WAREHOUSES
  // ==========================================
  const transferStock = (
    productId: string,
    fromWarehouseId: string,
    toWarehouseId: string,
    quantity: number,
    notes: string
  ): { success: boolean; error?: string } => {
    if (fromWarehouseId === toWarehouseId) {
      return { success: false, error: 'Source and destination warehouses cannot be the same.' };
    }

    const prod = products.find((p) => p.id === productId);
    if (!prod) return { success: false, error: 'Product not found.' };

    const fromWh = warehouses.find((w) => w.id === fromWarehouseId);
    const toWh = warehouses.find((w) => w.id === toWarehouseId);
    if (!fromWh || !toWh) return { success: false, error: 'Warehouse location invalid.' };

    const fromStock = getWarehouseStock(productId, fromWarehouseId);
    if (!settings.allowNegativeStock && fromStock < quantity) {
      return {
        success: false,
        error: `Insufficient stock in ${fromWh.name}. Available: ${fromStock}, Requested: ${quantity}.`,
      };
    }

    const toStock = getWarehouseStock(productId, toWarehouseId);
    const timestamp = new Date().toISOString();

    const updatedStocks = [...warehouseStocks];

    // Deduct source
    const fromIdx = updatedStocks.findIndex((ws) => ws.productId === productId && ws.warehouseId === fromWarehouseId);
    if (fromIdx >= 0) {
      updatedStocks[fromIdx] = { ...updatedStocks[fromIdx], quantity: fromStock - quantity, updatedAt: timestamp };
    } else {
      updatedStocks.push({ id: `ws-${Date.now()}-1`, warehouseId: fromWarehouseId, productId, quantity: fromStock - quantity, updatedAt: timestamp });
    }

    // Add dest
    const toIdx = updatedStocks.findIndex((ws) => ws.productId === productId && ws.warehouseId === toWarehouseId);
    if (toIdx >= 0) {
      updatedStocks[toIdx] = { ...updatedStocks[toIdx], quantity: toStock + quantity, updatedAt: timestamp };
    } else {
      updatedStocks.push({ id: `ws-${Date.now()}-2`, warehouseId: toWarehouseId, productId, quantity: toStock + quantity, updatedAt: timestamp });
    }

    setWarehouseStocks(updatedStocks);

    // Dual transactions in ledger
    const txOut: StockTransaction = {
      id: `tx-${Date.now()}-out`,
      date: timestamp,
      productId: prod.id,
      productName: prod.name,
      productSku: prod.sku,
      warehouseId: fromWh.id,
      warehouseName: fromWh.name,
      toWarehouseId: toWh.id,
      toWarehouseName: toWh.name,
      type: 'TRANSFER_OUT',
      quantity: -quantity,
      previousStock: fromStock,
      newStock: fromStock - quantity,
      unitCost: prod.purchasePrice,
      totalCost: Number((quantity * prod.purchasePrice).toFixed(2)),
      userId: currentUser.id,
      userName: currentUser.name,
      referenceType: 'TRANSFER',
      notes: `Transfer to ${toWh.name}: ${notes}`,
      createdAt: timestamp,
    };

    const txIn: StockTransaction = {
      id: `tx-${Date.now()}-in`,
      date: timestamp,
      productId: prod.id,
      productName: prod.name,
      productSku: prod.sku,
      warehouseId: toWh.id,
      warehouseName: toWh.name,
      toWarehouseId: fromWh.id,
      toWarehouseName: fromWh.name,
      type: 'TRANSFER_IN',
      quantity: quantity,
      previousStock: toStock,
      newStock: toStock + quantity,
      unitCost: prod.purchasePrice,
      totalCost: Number((quantity * prod.purchasePrice).toFixed(2)),
      userId: currentUser.id,
      userName: currentUser.name,
      referenceType: 'TRANSFER',
      notes: `Transfer from ${fromWh.name}: ${notes}`,
      createdAt: timestamp,
    };

    setTransactions((prev) => [txIn, txOut, ...prev]);
    logAudit(
      'STOCK_TRANSFER',
      'WAREHOUSES',
      prod.id,
      `Transferred ${quantity} units of ${prod.name} from ${fromWh.name} to ${toWh.name}`
    );

    return { success: true };
  };

  // ==========================================
  // TRANSACTION 5: CUSTOMER PAYMENT SETTLEMENT
  // ==========================================
  const recordCustomerPayment = (
    customerId: string,
    amount: number,
    method: PaymentMethod,
    reference?: string,
    notes?: string
  ): { success: boolean; error?: string } => {
    const cust = customers.find((c) => c.id === customerId);
    if (!cust) return { success: false, error: 'Customer not found.' };
    if (amount <= 0) return { success: false, error: 'Payment amount must be greater than 0.' };

    const timestamp = new Date().toISOString();
    const newPayment: PaymentRecord = {
      id: `pay-${Date.now()}`,
      date: timestamp,
      type: 'CUSTOMER_PAYMENT',
      referenceId: reference || 'DIRECT-PAY',
      referenceNumber: reference || `RCPT-${Date.now().toString().slice(-5)}`,
      partyId: cust.id,
      partyName: cust.name,
      partyType: 'CUSTOMER',
      amount,
      paymentMethod: method,
      notes,
      recordedBy: currentUser.name,
      createdAt: timestamp,
    };

    setCustomers((prev) =>
      prev.map((c) => {
        if (c.id !== customerId) return c;
        const newPaid = Number((c.totalPaid + amount).toFixed(2));
        const newOutstanding = Number(Math.max(0, c.outstandingBalance - amount).toFixed(2));
        return { ...c, totalPaid: newPaid, outstandingBalance: newOutstanding };
      })
    );

    setPayments((prev) => [newPayment, ...prev]);
    logAudit('RECORD_PAYMENT', 'CUSTOMERS', cust.id, `Received ${formatCurrency(amount)} payment from ${cust.name}`);
    pushNotification('Customer Payment Received', `Received ${formatCurrency(amount)} from ${cust.name}.`, 'PAYMENT', 'customers');

    return { success: true };
  };

  // ==========================================
  // TRANSACTION 6: SUPPLIER PAYMENT SETTLEMENT
  // ==========================================
  const recordSupplierPayment = (
    supplierId: string,
    amount: number,
    method: PaymentMethod,
    reference?: string,
    notes?: string
  ): { success: boolean; error?: string } => {
    const sup = suppliers.find((s) => s.id === supplierId);
    if (!sup) return { success: false, error: 'Supplier not found.' };
    if (amount <= 0) return { success: false, error: 'Payment amount must be greater than 0.' };

    const timestamp = new Date().toISOString();
    const newPayment: PaymentRecord = {
      id: `pay-${Date.now()}`,
      date: timestamp,
      type: 'SUPPLIER_PAYMENT',
      referenceId: reference || 'DIRECT-SUP-PAY',
      referenceNumber: reference || `VOUCHER-${Date.now().toString().slice(-5)}`,
      partyId: sup.id,
      partyName: sup.name,
      partyType: 'SUPPLIER',
      amount,
      paymentMethod: method,
      notes,
      recordedBy: currentUser.name,
      createdAt: timestamp,
    };

    setSuppliers((prev) =>
      prev.map((s) => {
        if (s.id !== supplierId) return s;
        const newPaid = Number((s.totalPaid + amount).toFixed(2));
        const newPayable = Number(Math.max(0, s.outstandingPayable - amount).toFixed(2));
        return { ...s, totalPaid: newPaid, outstandingPayable: newPayable };
      })
    );

    setPayments((prev) => [newPayment, ...prev]);
    logAudit('RECORD_PAYMENT', 'SUPPLIERS', sup.id, `Disbursed ${formatCurrency(amount)} payment to ${sup.name}`);

    return { success: true };
  };

  // ==========================================
  // TRANSACTION 7: RECORD EXPENSE
  // ==========================================
  const createExpense = (expenseData: {
    categoryId: string;
    title: string;
    amount: number;
    paymentMethod: PaymentMethod;
    warehouseId?: string;
    notes?: string;
  }): { success: boolean; expense?: Expense; error?: string } => {
    const { categoryId, title, amount, paymentMethod, warehouseId, notes } = expenseData;

    if (!title.trim()) return { success: false, error: 'Expense title is required.' };
    if (amount <= 0) return { success: false, error: 'Expense amount must be positive.' };

    const cat = expenseCategories.find((c) => c.id === categoryId);
    const wh = warehouses.find((w) => w.id === warehouseId);
    const timestamp = new Date().toISOString();
    const expNum = `EXP-2026-${(expenses.length + 1).toString().padStart(3, '0')}`;

    const newExpense: Expense = {
      id: `exp-${Date.now()}`,
      date: timestamp,
      expenseNumber: expNum,
      categoryId,
      categoryName: cat ? cat.name : 'General Expense',
      title,
      amount,
      paymentMethod,
      warehouseId: wh ? wh.id : undefined,
      warehouseName: wh ? wh.name : undefined,
      notes,
      recordedBy: currentUser.name,
      createdAt: timestamp,
    };

    const newPayment: PaymentRecord = {
      id: `pay-${Date.now()}`,
      date: timestamp,
      type: 'EXPENSE_PAYMENT',
      referenceId: newExpense.id,
      referenceNumber: expNum,
      partyId: categoryId,
      partyName: cat ? cat.name : 'Expense Account',
      partyType: 'EXPENSE',
      amount,
      paymentMethod,
      notes: title,
      recordedBy: currentUser.name,
      createdAt: timestamp,
    };

    setExpenses((prev) => [newExpense, ...prev]);
    setPayments((prev) => [newPayment, ...prev]);
    logAudit('CREATE_EXPENSE', 'EXPENSES', newExpense.id, `Recorded expense ${expNum} "${title}" for ${formatCurrency(amount)}`);

    return { success: true, expense: newExpense };
  };

  // ==========================================
  // CRUD PRODUCTS
  // ==========================================
  const addProduct = (
    prod: Omit<Product, 'id' | 'createdAt' | 'updatedAt' | 'currentStock'> & { initialStock?: number }
  ): Product => {
    const timestamp = new Date().toISOString();
    const newId = `prod-${Date.now()}`;
    const initialStock = prod.initialStock || 0;

    const newProduct: Product = {
      ...prod,
      id: newId,
      currentStock: initialStock,
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    setProducts((prev) => [newProduct, ...prev]);

    if (initialStock > 0 && prod.warehouseId) {
      setWarehouseStocks((prev) => [
        ...prev,
        {
          id: `ws-${Date.now()}`,
          warehouseId: prod.warehouseId,
          productId: newId,
          quantity: initialStock,
          rackLocation: prod.rackLocation,
          updatedAt: timestamp,
        },
      ]);

      const wh = warehouses.find((w) => w.id === prod.warehouseId);
      setTransactions((prev) => [
        {
          id: `tx-${Date.now()}`,
          date: timestamp,
          productId: newId,
          productName: newProduct.name,
          productSku: newProduct.sku,
          warehouseId: prod.warehouseId,
          warehouseName: wh ? wh.name : 'Primary Warehouse',
          type: 'STOCK_IN',
          quantity: initialStock,
          previousStock: 0,
          newStock: initialStock,
          unitCost: newProduct.purchasePrice,
          totalCost: Number((initialStock * newProduct.purchasePrice).toFixed(2)),
          userId: currentUser.id,
          userName: currentUser.name,
          referenceType: 'ADJUSTMENT',
          notes: 'Initial opening stock creation',
          createdAt: timestamp,
        },
        ...prev,
      ]);
    }

    logAudit('CREATE_PRODUCT', 'PRODUCTS', newId, `Created product "${newProduct.name}" (SKU: ${newProduct.sku})`);
    return newProduct;
  };

  const updateProduct = (id: string, updated: Partial<Product>) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...updated, updatedAt: new Date().toISOString() } : p))
    );
    logAudit('UPDATE_PRODUCT', 'PRODUCTS', id, `Updated product fields for ID ${id}`);
  };

  const deleteProduct = (id: string): { success: boolean; error?: string } => {
    const p = products.find((x) => x.id === id);
    if (!p) return { success: false, error: 'Product not found.' };

    setProducts((prev) => prev.filter((x) => x.id !== id));
    setWarehouseStocks((prev) => prev.filter((ws) => ws.productId !== id));
    logAudit('DELETE_PRODUCT', 'PRODUCTS', id, `Deleted product "${p.name}"`);
    return { success: true };
  };

  // ==========================================
  // CRUD CUSTOMERS & SUPPLIERS
  // ==========================================
  const addCustomer = (cust: Omit<Customer, 'id' | 'createdAt' | 'totalPurchases' | 'totalPaid' | 'outstandingBalance'>): Customer => {
    const timestamp = new Date().toISOString();
    const newCust: Customer = {
      ...cust,
      id: `cust-${Date.now()}`,
      totalPurchases: 0,
      totalPaid: 0,
      outstandingBalance: cust.openingBalance || 0,
      createdAt: timestamp,
    };
    setCustomers((prev) => [newCust, ...prev]);
    logAudit('CREATE_CUSTOMER', 'CUSTOMERS', newCust.id, `Created customer "${newCust.name}"`);
    return newCust;
  };

  const updateCustomer = (id: string, updated: Partial<Customer>) => {
    setCustomers((prev) => prev.map((c) => (c.id === id ? { ...c, ...updated } : c)));
    logAudit('UPDATE_CUSTOMER', 'CUSTOMERS', id, `Updated customer ID ${id}`);
  };

  const deleteCustomer = (id: string) => {
    setCustomers((prev) => prev.filter((c) => c.id !== id));
    logAudit('DELETE_CUSTOMER', 'CUSTOMERS', id, `Deleted customer ID ${id}`);
  };

  const addSupplier = (sup: Omit<Supplier, 'id' | 'createdAt' | 'totalPurchased' | 'totalPaid' | 'outstandingPayable'>): Supplier => {
    const timestamp = new Date().toISOString();
    const newSup: Supplier = {
      ...sup,
      id: `sup-${Date.now()}`,
      totalPurchased: 0,
      totalPaid: 0,
      outstandingPayable: sup.openingBalance || 0,
      createdAt: timestamp,
    };
    setSuppliers((prev) => [newSup, ...prev]);
    logAudit('CREATE_SUPPLIER', 'SUPPLIERS', newSup.id, `Created supplier "${newSup.name}"`);
    return newSup;
  };

  const updateSupplier = (id: string, updated: Partial<Supplier>) => {
    setSuppliers((prev) => prev.map((s) => (s.id === id ? { ...s, ...updated } : s)));
    logAudit('UPDATE_SUPPLIER', 'SUPPLIERS', id, `Updated supplier ID ${id}`);
  };

  const deleteSupplier = (id: string) => {
    setSuppliers((prev) => prev.filter((s) => s.id !== id));
    logAudit('DELETE_SUPPLIER', 'SUPPLIERS', id, `Deleted supplier ID ${id}`);
  };

  // ==========================================
  // CRUD WAREHOUSES & USERS
  // ==========================================
  const addWarehouse = (wh: Omit<Warehouse, 'id'>): Warehouse => {
    const newWh: Warehouse = {
      ...wh,
      id: `wh-${Date.now()}`,
    };
    setWarehouses((prev) => [...prev, newWh]);
    logAudit('CREATE_WAREHOUSE', 'WAREHOUSES', newWh.id, `Created warehouse "${newWh.name}"`);
    return newWh;
  };

  const updateWarehouse = (id: string, updated: Partial<Warehouse>) => {
    setWarehouses((prev) => prev.map((w) => (w.id === id ? { ...w, ...updated } : w)));
    logAudit('UPDATE_WAREHOUSE', 'WAREHOUSES', id, `Updated warehouse ID ${id}`);
  };

  const addUser = (user: Omit<User, 'id' | 'createdAt'>): User => {
    const timestamp = new Date().toISOString();
    const newUser: User = {
      ...user,
      id: `u-${Date.now()}`,
      createdAt: timestamp,
    };
    setUsers((prev) => [...prev, newUser]);
    logAudit('CREATE_USER', 'USERS', newUser.id, `Created system user "${newUser.name}" with role ${newUser.role}`);
    return newUser;
  };

  const updateUser = (id: string, updated: Partial<User>) => {
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, ...updated } : u)));
    logAudit('UPDATE_USER', 'USERS', id, `Updated user profile ID ${id}`);
  };

  const deleteUser = (id: string) => {
    setUsers((prev) => prev.filter((u) => u.id !== id));
    logAudit('DELETE_USER', 'USERS', id, `Deleted user ID ${id}`);
  };

  // ==========================================
  // SETTINGS & SYSTEM UTILITIES
  // ==========================================
  const updateSettings = (newSettings: Partial<SystemSettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
    logAudit('UPDATE_SETTINGS', 'SETTINGS', 'sys-config', 'Updated business and POS settings configuration');
  };

  const markNotificationAsRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
  };

  const markAllNotificationsAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  const resetToDefaultData = () => {
    localStorage.clear();
    setProducts(INITIAL_PRODUCTS);
    setCategories(INITIAL_CATEGORIES);
    setBrands(INITIAL_BRANDS);
    setUnits(INITIAL_UNITS);
    setWarehouses(INITIAL_WAREHOUSES);
    setWarehouseStocks(INITIAL_WAREHOUSE_STOCKS);
    setCustomers(INITIAL_CUSTOMERS);
    setSuppliers(INITIAL_SUPPLIERS);
    setSales(INITIAL_SALES);
    setPurchases(INITIAL_PURCHASES);
    setPayments(INITIAL_PAYMENTS);
    setExpenses(INITIAL_EXPENSES);
    setExpenseCategories(INITIAL_EXPENSE_CATEGORIES);
    setTransactions(INITIAL_TRANSACTIONS);
    setAuditLogs(INITIAL_AUDIT_LOGS);
    setNotifications(INITIAL_NOTIFICATIONS);
    setUsers(INITIAL_USERS);
    setSettings(INITIAL_SETTINGS);
    pushNotification('Database Restored', 'System reset to default seed demonstration database.', 'SYSTEM', 'dashboard');
  };

  const exportBackupJson = (): string => {
    const backup = {
      exportDate: new Date().toISOString(),
      version: '1.0.0',
      products,
      categories,
      brands,
      units,
      warehouses,
      warehouseStocks,
      customers,
      suppliers,
      sales,
      purchases,
      payments,
      expenses,
      expenseCategories,
      transactions,
      auditLogs,
      users,
      settings,
    };
    return JSON.stringify(backup, null, 2);
  };

  const importBackupJson = (jsonData: string): boolean => {
    try {
      const data = JSON.parse(jsonData);
      if (data.products && Array.isArray(data.products)) setProducts(data.products);
      if (data.categories && Array.isArray(data.categories)) setCategories(data.categories);
      if (data.warehouses && Array.isArray(data.warehouses)) setWarehouses(data.warehouses);
      if (data.warehouseStocks && Array.isArray(data.warehouseStocks)) setWarehouseStocks(data.warehouseStocks);
      if (data.customers && Array.isArray(data.customers)) setCustomers(data.customers);
      if (data.suppliers && Array.isArray(data.suppliers)) setSuppliers(data.suppliers);
      if (data.sales && Array.isArray(data.sales)) setSales(data.sales);
      if (data.purchases && Array.isArray(data.purchases)) setPurchases(data.purchases);
      if (data.payments && Array.isArray(data.payments)) setPayments(data.payments);
      if (data.expenses && Array.isArray(data.expenses)) setExpenses(data.expenses);
      if (data.transactions && Array.isArray(data.transactions)) setTransactions(data.transactions);
      if (data.settings) setSettings(data.settings);
      logAudit('RESTORE_BACKUP', 'SETTINGS', 'db-restore', 'Imported and restored database snapshot from JSON backup.');
      return true;
    } catch (e) {
      console.error('Import failed', e);
      return false;
    }
  };

  const contextValue: DataContextType = {
    products,
    categories,
    brands,
    units,
    warehouses,
    warehouseStocks,
    customers,
    suppliers,
    sales,
    purchases,
    payments,
    expenses,
    expenseCategories,
    transactions,
    auditLogs,
    notifications,
    users,
    settings,
    currentUser,
    currentRole,
    permissions,
    selectedWarehouseId,
    activeTab,
    darkMode,
    globalSearchQuery,
    isGlobalSearchOpen,
    setCurrentRole,
    setSelectedWarehouseId,
    setActiveTab,
    setDarkMode,
    setGlobalSearchQuery,
    setIsGlobalSearchOpen,
    createSale,
    createPurchase,
    adjustStock,
    transferStock,
    recordCustomerPayment,
    recordSupplierPayment,
    createExpense,
    addProduct,
    updateProduct,
    deleteProduct,
    addCustomer,
    updateCustomer,
    deleteCustomer,
    addSupplier,
    updateSupplier,
    deleteSupplier,
    addWarehouse,
    updateWarehouse,
    addUser,
    updateUser,
    deleteUser,
    updateSettings,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    clearNotifications,
    resetToDefaultData,
    exportBackupJson,
    importBackupJson,
    getWarehouseStock,
    getProductTotalStock,
    formatCurrency,
  };

  return <DataContext.Provider value={contextValue}>{children}</DataContext.Provider>;
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};
