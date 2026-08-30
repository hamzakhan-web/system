export type UserRole =
  | 'SUPER_ADMIN'
  | 'ADMIN'
  | 'MANAGER'
  | 'CASHIER'
  | 'INVENTORY_STAFF'
  | 'ACCOUNTANT';

export interface UserPermission {
  canViewProducts: boolean;
  canManageProducts: boolean;
  canViewInventory: boolean;
  canAdjustInventory: boolean;
  canTransferStock: boolean;
  canAccessPOS: boolean;
  canViewSales: boolean;
  canCreateSales: boolean;
  canViewPurchases: boolean;
  canCreatePurchases: boolean;
  canManageCustomers: boolean;
  canManageSuppliers: boolean;
  canManageExpenses: boolean;
  canViewFinancials: boolean;
  canViewReports: boolean;
  canManageUsers: boolean;
  canManageSettings: boolean;
  canViewAuditLogs: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  phone?: string;
  avatar?: string;
  status: 'ACTIVE' | 'INACTIVE';
  warehouseId?: string;
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  code: string;
  description?: string;
  productCount?: number;
}

export interface Brand {
  id: string;
  name: string;
  origin?: string;
}

export interface Unit {
  id: string;
  name: string;
  shortCode: string;
}

export interface Warehouse {
  id: string;
  name: string;
  code: string;
  location: string;
  managerName: string;
  contact: string;
  email?: string;
  status: 'ACTIVE' | 'INACTIVE';
  totalCapacity?: number;
}

export interface WarehouseStock {
  id: string;
  warehouseId: string;
  productId: string;
  quantity: number;
  rackLocation?: string;
  updatedAt: string;
}

export interface Product {
  id: string;
  sku: string;
  barcode: string;
  name: string;
  image: string;
  categoryId: string;
  brand: string;
  unit: string;
  purchasePrice: number;
  sellingPrice: number;
  wholesalePrice: number;
  minSellingPrice: number;
  currentStock: number;
  minStock: number;
  maxStock: number;
  taxRate: number; // in percentage e.g. 8%
  discount: number; // default discount %
  supplierId: string;
  warehouseId: string;
  rackLocation?: string;
  description: string;
  status: 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';
  createdAt: string;
  updatedAt: string;
}

export type StockTransactionType =
  | 'PURCHASE'
  | 'SALE'
  | 'STOCK_IN'
  | 'STOCK_OUT'
  | 'ADJUSTMENT_ADD'
  | 'ADJUSTMENT_SUB'
  | 'TRANSFER_IN'
  | 'TRANSFER_OUT'
  | 'CUSTOMER_RETURN'
  | 'SUPPLIER_RETURN'
  | 'DAMAGED'
  | 'LOST'
  | 'AUDIT_CORRECTION';

export interface StockTransaction {
  id: string;
  date: string;
  productId: string;
  productName: string;
  productSku: string;
  warehouseId: string;
  warehouseName: string;
  toWarehouseId?: string;
  toWarehouseName?: string;
  type: StockTransactionType;
  quantity: number; // positive or negative
  previousStock: number;
  newStock: number;
  unitCost: number;
  totalCost: number;
  userId: string;
  userName: string;
  referenceId?: string;
  referenceType?: 'SALE' | 'PURCHASE' | 'TRANSFER' | 'ADJUSTMENT' | 'AUDIT';
  notes: string;
  createdAt: string;
}

export interface Customer {
  id: string;
  customerCode: string;
  name: string;
  company?: string;
  phone: string;
  email: string;
  address: string;
  taxNumber?: string;
  notes?: string;
  openingBalance: number;
  creditLimit: number;
  totalPurchases: number;
  totalPaid: number;
  outstandingBalance: number; // receivables (they owe us)
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: string;
}

export interface Supplier {
  id: string;
  supplierCode: string;
  name: string;
  company: string;
  phone: string;
  email: string;
  address: string;
  taxNumber?: string;
  notes?: string;
  openingBalance: number;
  totalPurchased: number;
  totalPaid: number;
  outstandingPayable: number; // payables (we owe them)
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: string;
}

export interface SaleItem {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  barcode: string;
  unit: string;
  unitCost: number;
  unitPrice: number;
  quantity: number;
  discountPercent: number;
  taxPercent: number;
  subtotal: number;
  total: number;
}

export type PaymentMethod = 'CASH' | 'CARD' | 'BANK_TRANSFER' | 'CREDIT' | 'SPLIT';
export type PaymentStatus = 'PAID' | 'PARTIAL' | 'UNPAID';

export interface Sale {
  id: string;
  invoiceNumber: string;
  date: string;
  customerId: string;
  customerName: string;
  customerPhone?: string;
  warehouseId: string;
  warehouseName: string;
  cashierId: string;
  cashierName: string;
  items: SaleItem[];
  itemCount: number;
  subtotal: number;
  taxTotal: number;
  discountTotal: number;
  grandTotal: number;
  paidAmount: number;
  balanceDue: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  profit: number; // Realized gross profit = Revenue - COGS
  notes?: string;
  createdAt: string;
}

export interface PurchaseItem {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  unit: string;
  unitCost: number;
  quantity: number;
  taxPercent: number;
  subtotal: number;
  total: number;
}

export interface Purchase {
  id: string;
  poNumber: string;
  date: string;
  supplierId: string;
  supplierName: string;
  warehouseId: string;
  warehouseName: string;
  receiverId: string;
  receiverName: string;
  items: PurchaseItem[];
  subtotal: number;
  taxTotal: number;
  discountTotal: number;
  grandTotal: number;
  paidAmount: number;
  balanceDue: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  status: 'RECEIVED' | 'ORDERED' | 'CANCELLED';
  notes?: string;
  createdAt: string;
}

export interface PaymentRecord {
  id: string;
  date: string;
  type: 'CUSTOMER_PAYMENT' | 'SUPPLIER_PAYMENT' | 'EXPENSE_PAYMENT';
  referenceId: string; // Sale ID, Purchase ID, or Expense ID
  referenceNumber: string; // Invoice #, PO #, etc.
  partyId: string;
  partyName: string;
  partyType: 'CUSTOMER' | 'SUPPLIER' | 'EXPENSE';
  amount: number;
  paymentMethod: PaymentMethod;
  notes?: string;
  recordedBy: string;
  createdAt: string;
}

export interface ExpenseCategory {
  id: string;
  name: string;
  code: string;
  description?: string;
}

export interface Expense {
  id: string;
  date: string;
  expenseNumber: string;
  categoryId: string;
  categoryName: string;
  title: string;
  amount: number;
  paymentMethod: PaymentMethod;
  warehouseId?: string;
  warehouseName?: string;
  notes?: string;
  recordedBy: string;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  action: string;
  module: string;
  recordId: string;
  details: string;
  ipAddress?: string;
}

export interface SystemNotification {
  id: string;
  title: string;
  message: string;
  type: 'LOW_STOCK' | 'OUT_OF_STOCK' | 'SALE' | 'PURCHASE' | 'PAYMENT' | 'SYSTEM' | 'AUDIT';
  isRead: boolean;
  timestamp: string;
  linkTab?: string;
}

export interface SystemSettings {
  businessName: string;
  companyTagline: string;
  logoUrl?: string;
  phone: string;
  businessPhone?: string;
  email: string;
  businessEmail?: string;
  address: string;
  businessAddress?: string;
  taxNumber: string;
  currency: string;
  currencySymbol: string;
  invoicePrefix: string;
  poPrefix: string;
  invoiceFooterText: string;
  invoiceFooterNote?: string;
  lowStockThreshold: number;
  allowNegativeStock: boolean;
  stockValuationMethod: 'FIFO' | 'AVCO' | 'LIFO';
  taxRateDefault: number;
  taxRate?: number;
  soundEnabled: boolean;
  posReceiptWidth: '80mm' | '58mm' | 'A4';
  autoPrintOnSuccess: boolean;
  enableAuditLogs: boolean;
}
