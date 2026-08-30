import React, { useState, useMemo, useEffect } from 'react';
import {
  ShoppingCart,
  Search,
  Barcode,
  Plus,
  Minus,
  Trash2,
  UserPlus,
  CreditCard,
  Banknote,
  Building,
  RotateCcw,
  CheckCircle2,
  Printer,
  X,
  Sparkles,
  Tag,
  Receipt,
  Users,
  AlertCircle,
  PauseCircle,
  PlayCircle,
  Zap,
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { Product, Customer, PaymentMethod, SaleItem, Sale } from '../../types';
import { BarcodeScannerModal } from '../common/BarcodeScannerModal';
import { ReceiptPreviewModal } from './ReceiptPreviewModal';
import { generateBarcodeSvgString } from '../../utils/export';

interface CartItem extends SaleItem {
  currentStock: number;
  originalPrice: number;
  image: string;
}

export const POSView: React.FC = () => {
  const {
    products,
    categories,
    customers,
    warehouses,
    selectedWarehouseId,
    createSale,
    addCustomer,
    formatCurrency,
    currentUser,
    settings,
    updateSettings,
  } = useData();

  // Search & Filters
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isScannerOpen, setIsScannerOpen] = useState<boolean>(false);

  // Cart State
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(customers[0]?.id || '');
  const [globalDiscount, setGlobalDiscount] = useState<number>(0);
  const [taxRate, setTaxRate] = useState<number>(settings.taxRate || 8.0);
  const [orderNotes, setOrderNotes] = useState<string>('');

  // Held Orders
  const [heldOrders, setHeldOrders] = useState<{ id: string; timestamp: Date; customerId: string; items: CartItem[] }[]>([]);

  // Payment Modal State
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState<boolean>(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH');
  const [receivedAmount, setReceivedAmount] = useState<number>(0);

  // Completed Receipt Modal State
  const [completedSale, setCompletedSale] = useState<Sale | null>(null);

  // Manual / Quick Bill Item Entry Row State
  const [isManualEntryOpen, setIsManualEntryOpen] = useState<boolean>(true);
  const [manualItem, setManualItem] = useState<{
    productId: string;
    name: string;
    sku: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    costPrice: number;
    availableStock: number;
    isCustom: boolean;
  }>({
    productId: '',
    name: '',
    sku: '',
    quantity: 1,
    unitPrice: 0,
    totalPrice: 0,
    costPrice: 0,
    availableStock: 0,
    isCustom: false,
  });

  // Quick Add Customer Modal
  const [isAddCustomerOpen, setIsAddCustomerOpen] = useState<boolean>(false);
  const [newCustomerForm, setNewCustomerForm] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    creditLimit: 2000,
  });

  // Filter Products for current warehouse & search
  const availableProducts = useMemo(() => {
    return products.filter((p) => {
      if (selectedWarehouseId !== 'ALL' && p.warehouseId !== selectedWarehouseId) {
        return false;
      }
      if (selectedCategory !== 'ALL' && p.categoryId !== selectedCategory) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          p.name.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q) ||
          p.barcode.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [products, selectedWarehouseId, selectedCategory, searchQuery]);

  // Selected Customer details
  const selectedCustomer = customers.find((c) => c.id === selectedCustomerId) || customers[0];

  // Cart Calculations
  const subtotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.unitPrice * item.quantity * (1 - item.discount / 100), 0);
  }, [cart]);

  const discountAmount = useMemo(() => {
    return (subtotal * globalDiscount) / 100;
  }, [subtotal, globalDiscount]);

  const taxableAmount = Math.max(0, subtotal - discountAmount);
  const taxAmount = (taxableAmount * taxRate) / 100;
  const grandTotal = taxableAmount + taxAmount;

  // Add to Cart (supports specifying custom quantity or adding all available stock)
  const handleAddToCart = (product: Product, quantityToAdd = 1) => {
    const existingIndex = cart.findIndex((item) => item.productId === product.id);

    if (existingIndex > -1) {
      const existing = cart[existingIndex];
      const targetQty = existing.quantity + quantityToAdd;
      if (targetQty > product.currentStock && !settings.allowNegativeStock) {
        alert(`Cannot add ${quantityToAdd} more. Only ${product.currentStock} units available in stock.`);
        return;
      }
      const updated = [...cart];
      const newQty = targetQty;
      const total = newQty * existing.unitPrice * (1 - (existing.discountPercent || existing.discount || 0) / 100);
      const profit = total - newQty * existing.costPrice;

      updated[existingIndex] = {
        ...existing,
        quantity: newQty,
        total,
        profit,
      };
      setCart(updated);
    } else {
      if (product.currentStock <= 0 && !settings.allowNegativeStock) {
        alert('This item is currently out of stock.');
        return;
      }
      const initialQty = Math.max(1, quantityToAdd);
      if (initialQty > product.currentStock && !settings.allowNegativeStock) {
        alert(`Only ${product.currentStock} units available in stock.`);
        return;
      }
      const unitPrice = product.sellingPrice;
      const costPrice = product.purchasePrice;
      const total = initialQty * unitPrice;
      const profit = total - initialQty * costPrice;

      setCart([
        ...cart,
        {
          productId: product.id,
          productName: product.name,
          productSku: product.sku,
          quantity: initialQty,
          costPrice,
          unitPrice,
          originalPrice: unitPrice,
          discount: 0,
          discountPercent: 0,
          total,
          profit,
          currentStock: product.currentStock,
          image: product.image,
        },
      ]);
    }
  };

  // Update Cart Item Quantity directly with stock boundary checks
  const handleUpdateQty = (index: number, newQty: number) => {
    if (newQty <= 0) {
      handleRemoveItem(index);
      return;
    }
    const item = cart[index];
    if (newQty > item.currentStock && !settings.allowNegativeStock) {
      alert(`Only ${item.currentStock} units available in stock.`);
      return;
    }
    const updated = [...cart];
    const total = newQty * item.unitPrice * (1 - (item.discountPercent || item.discount || 0) / 100);
    const profit = total - newQty * item.costPrice;

    updated[index] = {
      ...item,
      quantity: newQty,
      total,
      profit,
    };
    setCart(updated);
  };

  // Set single item quantity to its full available in-stock quantity
  const handleSetAllAvailable = (index: number) => {
    const item = cart[index];
    if (item.currentStock <= 0 && !settings.allowNegativeStock) {
      alert('This item has 0 available stock.');
      return;
    }
    handleUpdateQty(index, Math.max(1, item.currentStock));
  };

  // Set ALL items currently in the bill to their respective maximum available stock
  const handleSetAllCartMaxAvailable = () => {
    if (cart.length === 0) return;
    const updated = cart.map((item) => {
      const maxQty = Math.max(1, item.currentStock > 0 ? item.currentStock : item.quantity);
      const total = maxQty * item.unitPrice * (1 - (item.discountPercent || item.discount || 0) / 100);
      const profit = total - maxQty * item.costPrice;
      return {
        ...item,
        quantity: maxQty,
        total,
        profit,
      };
    });
    setCart(updated);
  };

  // Update Cart Item Unit Price with instant live recalculation
  const handleUpdatePrice = (index: number, newPrice: number) => {
    const item = cart[index];
    const cleanPrice = Math.max(0, newPrice);
    const updated = [...cart];
    const total = item.quantity * cleanPrice * (1 - (item.discountPercent || item.discount || 0) / 100);
    const profit = total - item.quantity * item.costPrice;

    updated[index] = {
      ...item,
      unitPrice: cleanPrice,
      total,
      profit,
    };
    setCart(updated);
  };

  // Update Cart Item Total Price directly with instant live unit price recalculation
  const handleUpdateTotalPrice = (index: number, newTotal: number) => {
    const item = cart[index];
    const cleanTotal = Math.max(0, newTotal);
    const qty = Math.max(1, item.quantity || 1);
    const discMultiplier = 1 - (item.discountPercent || item.discount || 0) / 100;
    const calculatedUnitPrice = discMultiplier > 0 ? cleanTotal / (qty * discMultiplier) : cleanTotal / qty;
    const profit = cleanTotal - qty * item.costPrice;

    const updated = [...cart];
    updated[index] = {
      ...item,
      unitPrice: Math.round(calculatedUnitPrice * 100) / 100,
      total: cleanTotal,
      profit,
    };
    setCart(updated);
  };

  // Reset item price back to original catalog default price
  const handleResetPrice = (index: number) => {
    const item = cart[index];
    handleUpdatePrice(index, item.originalPrice ?? item.unitPrice);
  };

  // Manual Bill Entry Helpers
  const handleSelectProductForManualEntry = (productId: string) => {
    if (!productId) {
      setManualItem({
        productId: '',
        name: '',
        sku: 'CUSTOM-' + Math.floor(1000 + Math.random() * 9000),
        quantity: 1,
        unitPrice: 0,
        totalPrice: 0,
        costPrice: 0,
        availableStock: 9999,
        isCustom: true,
      });
      return;
    }

    const prod = products.find((p) => p.id === productId);
    if (!prod) return;

    const qty = manualItem.quantity > 0 ? manualItem.quantity : 1;
    const unitPrice = prod.sellingPrice;
    const totalPrice = Math.round(qty * unitPrice * 100) / 100;

    setManualItem({
      productId: prod.id,
      name: prod.name,
      sku: prod.sku,
      quantity: qty,
      unitPrice,
      totalPrice,
      costPrice: prod.purchasePrice,
      availableStock: prod.currentStock,
      isCustom: false,
    });
  };

  const handleManualQtyChange = (newQty: number) => {
    const qty = Math.max(1, newQty);
    const totalPrice = Math.round(qty * manualItem.unitPrice * 100) / 100;
    setManualItem((prev) => ({
      ...prev,
      quantity: qty,
      totalPrice,
    }));
  };

  const handleManualUnitPriceChange = (newPrice: number) => {
    const price = Math.max(0, newPrice);
    const totalPrice = Math.round(manualItem.quantity * price * 100) / 100;
    setManualItem((prev) => ({
      ...prev,
      unitPrice: price,
      totalPrice,
    }));
  };

  const handleManualTotalPriceChange = (newTotal: number) => {
    const total = Math.max(0, newTotal);
    const qty = Math.max(1, manualItem.quantity);
    const unitPrice = Math.round((total / qty) * 100) / 100;
    setManualItem((prev) => ({
      ...prev,
      unitPrice,
      totalPrice: total,
    }));
  };

  const handleManualSetAllAvailable = () => {
    if (manualItem.availableStock <= 0 && !settings.allowNegativeStock) {
      alert('This item has 0 available stock.');
      return;
    }
    const maxQty = Math.max(1, manualItem.availableStock);
    const totalPrice = Math.round(maxQty * manualItem.unitPrice * 100) / 100;
    setManualItem((prev) => ({
      ...prev,
      quantity: maxQty,
      totalPrice,
    }));
  };

  const handleAddManualItemToCart = () => {
    const name = manualItem.name.trim();
    if (!name) {
      alert('Please enter or select an item name.');
      return;
    }
    if (manualItem.quantity <= 0) {
      alert('Quantity must be greater than 0.');
      return;
    }

    if (!manualItem.isCustom && manualItem.productId) {
      const prod = products.find((p) => p.id === manualItem.productId);
      if (prod) {
        if (manualItem.quantity > prod.currentStock && !settings.allowNegativeStock) {
          alert(`Cannot add ${manualItem.quantity}. Only ${prod.currentStock} units available in stock.`);
          return;
        }

        const existingIndex = cart.findIndex((c) => c.productId === prod.id);
        const lineTotal = manualItem.totalPrice > 0 ? manualItem.totalPrice : manualItem.quantity * manualItem.unitPrice;
        const profit = lineTotal - manualItem.quantity * manualItem.costPrice;

        if (existingIndex > -1) {
          const updated = [...cart];
          const newQty = updated[existingIndex].quantity + manualItem.quantity;
          if (newQty > prod.currentStock && !settings.allowNegativeStock) {
            alert(`Total quantity (${newQty}) exceeds available stock (${prod.currentStock}).`);
            return;
          }
          const itemTotal = newQty * manualItem.unitPrice;
          updated[existingIndex] = {
            ...updated[existingIndex],
            quantity: newQty,
            unitPrice: manualItem.unitPrice,
            total: itemTotal,
            profit: itemTotal - newQty * manualItem.costPrice,
          };
          setCart(updated);
        } else {
          setCart([
            ...cart,
            {
              productId: prod.id,
              productName: prod.name,
              productSku: prod.sku,
              quantity: manualItem.quantity,
              costPrice: prod.purchasePrice,
              unitPrice: manualItem.unitPrice,
              originalPrice: prod.sellingPrice,
              discount: 0,
              discountPercent: 0,
              total: lineTotal,
              profit,
              currentStock: prod.currentStock,
              image: prod.image,
            },
          ]);
        }
      }
    } else {
      // Custom line item
      const lineTotal = manualItem.totalPrice > 0 ? manualItem.totalPrice : manualItem.quantity * manualItem.unitPrice;
      const profit = lineTotal - manualItem.quantity * manualItem.costPrice;
      setCart([
        ...cart,
        {
          productId: `custom-${Date.now()}`,
          productName: name,
          productSku: manualItem.sku || 'CUSTOM',
          quantity: manualItem.quantity,
          costPrice: manualItem.costPrice || 0,
          unitPrice: manualItem.unitPrice,
          originalPrice: manualItem.unitPrice,
          discount: 0,
          discountPercent: 0,
          total: lineTotal,
          profit,
          currentStock: manualItem.availableStock || 9999,
          image: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&q=80&w=150',
        },
      ]);
    }

    // Reset manual entry form ready for next item
    setManualItem({
      productId: '',
      name: '',
      sku: '',
      quantity: 1,
      unitPrice: 0,
      totalPrice: 0,
      costPrice: 0,
      availableStock: 0,
      isCustom: false,
    });
  };

  // Update Cart Item Individual Discount %
  const handleUpdateItemDiscount = (index: number, discPercent: number) => {
    const item = cart[index];
    const cleanDisc = Math.min(100, Math.max(0, discPercent));
    const updated = [...cart];
    const total = item.quantity * item.unitPrice * (1 - cleanDisc / 100);
    const profit = total - item.quantity * item.costPrice;

    updated[index] = {
      ...item,
      discount: cleanDisc,
      discountPercent: cleanDisc,
      total,
      profit,
    };
    setCart(updated);
  };

  // Remove Item
  const handleRemoveItem = (index: number) => {
    setCart(cart.filter((_, i) => i !== index));
  };

  // Hold Current Order
  const handleHoldOrder = () => {
    if (cart.length === 0) return;
    setHeldOrders([
      ...heldOrders,
      {
        id: `HOLD-${Date.now().toString().slice(-4)}`,
        timestamp: new Date(),
        customerId: selectedCustomerId,
        items: cart,
      },
    ]);
    setCart([]);
  };

  // Recall Held Order
  const handleRecallOrder = (orderId: string) => {
    const order = heldOrders.find((o) => o.id === orderId);
    if (!order) return;
    setCart(order.items);
    setSelectedCustomerId(order.customerId);
    setHeldOrders(heldOrders.filter((o) => o.id !== orderId));
  };

  // Open Payment Modal
  const handleOpenPayment = () => {
    if (cart.length === 0) {
      alert('Cart is empty. Please add items before checking out.');
      return;
    }
    setReceivedAmount(grandTotal);
    setIsPaymentModalOpen(true);
  };

  // Submit Sale & Print Receipt
  const handleCompleteSale = () => {
    if (paymentMethod === 'CREDIT' && selectedCustomer) {
      const remainingCredit = selectedCustomer.creditLimit - selectedCustomer.outstandingBalance;
      if (grandTotal > remainingCredit) {
        alert(
          `Customer credit limit exceeded! Available credit: ${formatCurrency(remainingCredit)}, Total: ${formatCurrency(
            grandTotal
          )}`
        );
        return;
      }
    }

    const saleItems = cart.map((c) => ({
      productId: c.productId,
      quantity: c.quantity,
      unitPrice: c.unitPrice,
      discountPercent: c.discount || 0,
    }));

    const paidAmt = paymentMethod === 'CREDIT' ? 0 : paymentMethod === 'CASH' ? receivedAmount : grandTotal;

    const result = createSale({
      customerId: selectedCustomer?.id || 'cust-1',
      warehouseId: selectedWarehouseId === 'ALL' ? warehouses[0].id : selectedWarehouseId,
      items: saleItems,
      discountTotal: discountAmount,
      paidAmount: paidAmt,
      paymentMethod,
      notes: orderNotes,
    });

    if (result.success && result.sale) {
      setIsPaymentModalOpen(false);
      setCart([]);
      setGlobalDiscount(0);
      setOrderNotes('');
      setCompletedSale(result.sale);
    } else {
      alert(result.error || 'Failed to complete transaction.');
    }
  };

  // Save New Customer
  const handleSaveCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomerForm.name || !newCustomerForm.phone) {
      alert('Name and phone are required.');
      return;
    }
    const created = addCustomer({
      name: newCustomerForm.name,
      phone: newCustomerForm.phone,
      email: newCustomerForm.email,
      address: newCustomerForm.address,
      creditLimit: Number(newCustomerForm.creditLimit),
    });
    setSelectedCustomerId(created.id);
    setIsAddCustomerOpen(false);
    setNewCustomerForm({ name: '', phone: '', email: '', address: '', creditLimit: 2000 });
  };

  const changeDue = Math.max(0, receivedAmount - grandTotal);

  // Global Keyboard Shortcuts (Enter key for Bill Entry / Pay & payment confirmation)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // If Payment modal is open:
      if (isPaymentModalOpen) {
        if (e.key === 'Enter') {
          e.preventDefault();
          handleCompleteSale();
        } else if (e.key === 'Escape') {
          e.preventDefault();
          setIsPaymentModalOpen(false);
        }
        return;
      }

      // If Add Customer modal is open:
      if (isAddCustomerOpen) {
        if (e.key === 'Escape') {
          e.preventDefault();
          setIsAddCustomerOpen(false);
        }
        return;
      }

      // If on main POS register and user presses Enter:
      if (e.key === 'Enter') {
        const activeEl = document.activeElement;
        const isTextInput =
          activeEl instanceof HTMLInputElement || activeEl instanceof HTMLTextAreaElement;

        // If user is focused on the search box
        if (activeEl?.id === 'pos-product-search') {
          if (availableProducts.length === 1) {
            e.preventDefault();
            handleAddToCart(availableProducts[0]);
            setSearchQuery('');
            return;
          } else if (searchQuery.trim() === '' && cart.length > 0) {
            e.preventDefault();
            handleOpenPayment();
            return;
          }
        } else if (!isTextInput && cart.length > 0) {
          e.preventDefault();
          handleOpenPayment();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    isPaymentModalOpen,
    isAddCustomerOpen,
    cart,
    availableProducts,
    searchQuery,
    grandTotal,
    receivedAmount,
    paymentMethod,
    selectedCustomer,
    subtotal,
    taxAmount,
    discountAmount,
    orderNotes,
  ]);

  return (
    <div className="flex flex-col lg:flex-row gap-5 h-[calc(100vh-6.5rem)] animate-in fade-in duration-150 text-slate-300">
      {/* Left side: Product Catalog & Fast Search */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#161616] border border-white/5 rounded-2xl overflow-hidden shadow-sm">
        {/* Search & Category Filter Bar */}
        <div className="p-4 border-b border-white/5 space-y-3 shrink-0 bg-[#111111]">
          <div className="flex items-center gap-2.5">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                id="pos-product-search"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    if (availableProducts.length === 1) {
                      e.preventDefault();
                      handleAddToCart(availableProducts[0]);
                      setSearchQuery('');
                    } else if (searchQuery.trim() === '' && cart.length > 0) {
                      e.preventDefault();
                      handleOpenPayment();
                    }
                  }
                }}
                placeholder="Quick search SKU, item name, barcode (Press Enter to add / bill)..."
                className="w-full pl-9 pr-3.5 py-2 text-xs bg-[#1A1A1A] border border-white/10 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>
            <button
              onClick={() => setIsScannerOpen(true)}
              className="flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-colors shrink-0"
              title="Open Barcode Scanner"
            >
              <Barcode className="w-4 h-4" />
              <span className="hidden sm:inline">Scan Barcode</span>
            </button>

            {/* Quick Auto-Print Toggle */}
            <label
              className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#1A1A1A] border border-white/10 hover:border-white/20 transition-colors cursor-pointer select-none shrink-0"
              title="Automatically print 80mm thermal receipt upon transaction success"
            >
              <Printer className="w-3.5 h-3.5 text-indigo-400" />
              <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-300">
                <span>Auto-print:</span>
                <span className={settings.autoPrintOnSuccess ? 'text-emerald-400 font-semibold' : 'text-slate-400'}>
                  {settings.autoPrintOnSuccess ? 'ON' : 'OFF'}
                </span>
              </div>
              <input
                type="checkbox"
                checked={settings.autoPrintOnSuccess ?? true}
                onChange={(e) => updateSettings({ autoPrintOnSuccess: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-7 h-3.5 bg-[#262626] rounded-full peer peer-checked:bg-emerald-600 after:content-[''] after:absolute after:top-[1px] after:left-[1px] after:bg-white after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:after:translate-x-3.5 relative"></div>
            </label>
          </div>

          {/* Category Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            <button
              onClick={() => setSelectedCategory('ALL')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
                selectedCategory === 'ALL'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-[#1A1A1A] border border-white/5 text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              All Items ({products.length})
            </button>
            {categories.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedCategory(c.id)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
                  selectedCategory === c.id
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-[#1A1A1A] border border-white/5 text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>
        </div>

        {/* Product Cards Grid */}
        <div className="flex-1 overflow-y-auto p-4">
          {availableProducts.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-500 py-12">
              <ShoppingCart className="w-12 h-12 stroke-1 text-slate-700 mb-2" />
              <p className="text-sm font-medium text-slate-300">No matching products found</p>
              <p className="text-xs text-slate-500 mt-1">Try resetting the category filter or search query.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3.5">
              {availableProducts.map((p) => {
                const isOut = p.currentStock <= 0;
                const isLow = p.currentStock > 0 && p.currentStock <= p.minStock;

                return (
                  <div
                    key={p.id}
                    className={`flex flex-col text-left p-3 rounded-xl bg-[#111111] border border-white/5 hover:border-white/10 hover:bg-white/[0.02] transition-all group relative overflow-hidden ${
                      isOut && !settings.allowNegativeStock ? 'opacity-50' : ''
                    }`}
                  >
                    {/* Stock badge top right */}
                    <div className="absolute top-2 right-2 z-10 flex items-center gap-1">
                      <span
                        className={`px-1.5 py-0.5 text-[9px] font-mono font-semibold rounded-md ${
                          isOut
                            ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                            : isLow
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            : 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                        }`}
                      >
                        {p.currentStock > 0 ? `${p.currentStock} ${p.unit}` : 'Out of stock'}
                      </span>
                    </div>

                    {/* Image clickable to add 1 */}
                    <button
                      type="button"
                      disabled={isOut && !settings.allowNegativeStock}
                      onClick={() => handleAddToCart(p, 1)}
                      className="aspect-square w-full rounded-lg overflow-hidden bg-[#1A1A1A] mb-2.5 border border-white/5 text-left disabled:cursor-not-allowed cursor-pointer"
                    >
                      <img
                        src={p.image}
                        alt={p.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                      />
                    </button>

                    {/* Info */}
                    <div className="flex-1 flex flex-col justify-between">
                      <div
                        onClick={() => (!isOut || settings.allowNegativeStock ? handleAddToCart(p, 1) : null)}
                        className="cursor-pointer"
                      >
                        <p className="text-xs font-semibold text-white line-clamp-2 leading-snug group-hover:text-indigo-400 transition-colors">
                          {p.name}
                        </p>
                        <p className="text-[10px] text-slate-500 font-mono mt-0.5">{p.sku}</p>
                      </div>

                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/5 gap-1.5">
                        <span className="text-xs font-bold text-emerald-400 font-mono">
                          {formatCurrency(p.sellingPrice)}
                        </span>

                        <div className="flex items-center gap-1">
                          {p.currentStock > 1 && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAddToCart(p, p.currentStock);
                              }}
                              title={`Add all ${p.currentStock} available units to bill`}
                              className="px-1.5 py-1 rounded bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-[10px] font-semibold transition-colors flex items-center gap-0.5"
                            >
                              <Zap className="w-2.5 h-2.5" />
                              <span>All ({p.currentStock})</span>
                            </button>
                          )}
                          <button
                            type="button"
                            disabled={isOut && !settings.allowNegativeStock}
                            onClick={() => handleAddToCart(p, 1)}
                            title="Add 1 unit to bill"
                            className="w-6 h-6 rounded-md bg-indigo-600/10 text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white flex items-center justify-center transition-colors disabled:opacity-40"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Right side: Active Cart & Checkout Panel */}
      <div className="w-full lg:w-96 flex flex-col bg-[#161616] border border-white/5 rounded-2xl overflow-hidden shadow-sm shrink-0">
        {/* Customer Select Header & Cart Quick Actions */}
        <div className="p-3.5 border-b border-white/5 bg-[#111111] space-y-2.5 shrink-0">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-indigo-400" /> Customer Account
            </span>
            <button
              onClick={() => setIsAddCustomerOpen(true)}
              className="text-[11px] font-medium text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
            >
              <UserPlus className="w-3 h-3" /> Quick Add
            </button>
          </div>

          <select
            value={selectedCustomerId}
            onChange={(e) => setSelectedCustomerId(e.target.value)}
            className="w-full px-3 py-2 text-xs bg-[#1A1A1A] border border-white/10 rounded-lg text-slate-200 focus:outline-none focus:border-indigo-500"
          >
            {customers.map((c) => (
              <option key={c.id} value={c.id} className="bg-[#111111] text-slate-200">
                {c.name} ({c.phone || c.customerCode})
              </option>
            ))}
          </select>

          {selectedCustomer && selectedCustomer.outstandingBalance > 0 && (
            <div className="flex items-center justify-between px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-300">
              <span>Outstanding Receivable:</span>
              <strong className="font-mono">{formatCurrency(selectedCustomer.outstandingBalance)}</strong>
            </div>
          )}

          {/* Bill Items Bar with Set All Available button */}
          <div className="flex items-center justify-between pt-1 border-t border-white/5">
            <span className="text-[11px] font-semibold text-slate-300 flex items-center gap-1">
              <ShoppingCart className="w-3 h-3 text-indigo-400" />
              Bill Items ({cart.length})
            </span>
            {cart.length > 0 && (
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleSetAllCartMaxAvailable}
                  title="Set all item quantities in the bill to their maximum available in-stock quantity"
                  className="px-2 py-0.5 text-[10px] font-semibold text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 rounded flex items-center gap-1 transition-colors"
                >
                  <Zap className="w-2.5 h-2.5" />
                  <span>Set All Avail</span>
                </button>
                <button
                  type="button"
                  onClick={() => setCart([])}
                  title="Clear all items from bill"
                  className="px-1.5 py-0.5 text-[10px] text-slate-400 hover:text-rose-400 bg-white/5 hover:bg-white/10 rounded transition-colors"
                >
                  Clear
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Direct Bill Line Entry Panel (Item, Quantity, Price, Total Price, All Available) */}
        <div className="p-3 bg-[#131313] border-b border-white/5 space-y-2 shrink-0">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold text-slate-300 flex items-center gap-1.5 uppercase tracking-wider">
              <Sparkles className="w-3 h-3 text-amber-400" />
              Direct Bill Entry
            </span>
            <button
              type="button"
              onClick={() => setIsManualEntryOpen(!isManualEntryOpen)}
              className="text-[10px] font-medium text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              {isManualEntryOpen ? 'Collapse' : '+ Quick Line Entry'}
            </button>
          </div>

          {isManualEntryOpen && (
            <div className="space-y-2 pt-0.5">
              {/* Product Selector / Custom Name */}
              <div>
                <select
                  value={manualItem.isCustom ? '__CUSTOM__' : manualItem.productId}
                  onChange={(e) => {
                    if (e.target.value === '__CUSTOM__') {
                      handleSelectProductForManualEntry('');
                    } else {
                      handleSelectProductForManualEntry(e.target.value);
                    }
                  }}
                  className="w-full px-2.5 py-1.5 text-xs bg-[#1A1A1A] border border-white/10 rounded-lg text-slate-100 focus:outline-none focus:border-indigo-500"
                >
                  <option value="">-- Select Product / Custom Item --</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id} className="bg-[#111111] text-slate-200">
                      {p.name} ({p.sku}) - {formatCurrency(p.sellingPrice)} [Avail: {p.currentStock}]
                    </option>
                  ))}
                  <option value="__CUSTOM__" className="bg-[#111111] text-amber-300 font-semibold">
                    + Custom Item / Service Line
                  </option>
                </select>

                {manualItem.isCustom && (
                  <div className="mt-1.5">
                    <input
                      type="text"
                      value={manualItem.name}
                      onChange={(e) => setManualItem((prev) => ({ ...prev, name: e.target.value }))}
                      placeholder="Type custom item name / description..."
                      className="w-full px-2.5 py-1.5 text-xs bg-[#1A1A1A] border border-white/10 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                )}
              </div>

              {/* Quantity, Unit Price & Total Price Triple Input Fields */}
              <div className="grid grid-cols-3 gap-2">
                {/* 1. Quantity Input with All Avail button */}
                <div>
                  <div className="flex items-center justify-between mb-0.5">
                    <label className="text-[9.5px] font-medium text-slate-400">Quantity</label>
                    {!manualItem.isCustom && manualItem.availableStock > 0 && (
                      <button
                        type="button"
                        onClick={handleManualSetAllAvailable}
                        className="text-[9px] font-semibold text-emerald-400 hover:text-emerald-300 transition-colors"
                        title="Set quantity to full available stock"
                      >
                        All ({manualItem.availableStock})
                      </button>
                    )}
                  </div>
                  <div className="flex items-center bg-[#1A1A1A] border border-white/10 rounded-lg p-0.5">
                    <button
                      type="button"
                      onClick={() => handleManualQtyChange(manualItem.quantity - 1)}
                      className="p-1 text-slate-400 hover:text-white rounded"
                    >
                      <Minus className="w-2.5 h-2.5" />
                    </button>
                    <input
                      type="number"
                      min="1"
                      max={manualItem.isCustom || settings.allowNegativeStock ? undefined : manualItem.availableStock}
                      value={manualItem.quantity}
                      onChange={(e) => handleManualQtyChange(parseInt(e.target.value, 10) || 1)}
                      className="w-full text-center text-xs font-bold text-white font-mono bg-transparent border-0 focus:outline-none p-0"
                    />
                    <button
                      type="button"
                      onClick={() => handleManualQtyChange(manualItem.quantity + 1)}
                      className="p-1 text-slate-400 hover:text-white rounded"
                    >
                      <Plus className="w-2.5 h-2.5" />
                    </button>
                  </div>
                </div>

                {/* 2. Unit Price Input */}
                <div>
                  <label className="text-[9.5px] font-medium text-slate-400 mb-0.5 block">
                    Unit Price ($)
                  </label>
                  <div className="flex items-center bg-[#1A1A1A] border border-white/10 rounded-lg px-2 py-1 focus-within:border-indigo-500">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={manualItem.unitPrice}
                      onChange={(e) => handleManualUnitPriceChange(parseFloat(e.target.value) || 0)}
                      className="w-full text-xs font-mono font-semibold text-slate-100 bg-transparent border-0 focus:outline-none p-0"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                {/* 3. Total Price Input (User Editable!) */}
                <div>
                  <label className="text-[9.5px] font-medium text-slate-400 mb-0.5 block">
                    Total Price ($)
                  </label>
                  <div className="flex items-center bg-[#1A1A1A] border border-white/10 rounded-lg px-2 py-1 focus-within:border-emerald-500">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={manualItem.totalPrice}
                      onChange={(e) => handleManualTotalPriceChange(parseFloat(e.target.value) || 0)}
                      className="w-full text-xs font-mono font-bold text-emerald-400 bg-transparent border-0 focus:outline-none p-0"
                      placeholder="0.00"
                    />
                  </div>
                </div>
              </div>

              {/* Action Button: Add Item to Bill */}
              <button
                type="button"
                onClick={handleAddManualItemToCart}
                disabled={!manualItem.name && !manualItem.productId}
                className="w-full py-1.5 px-3 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:hover:bg-indigo-600 rounded-lg shadow-sm flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add to Bill &middot; {formatCurrency(manualItem.totalPrice || 0)}</span>
              </button>
            </div>
          )}
        </div>

        {/* Cart Item List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2.5 divide-y divide-white/5">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-500 py-12">
              <ShoppingCart className="w-10 h-10 stroke-1 text-slate-700 mb-2" />
              <p className="text-xs font-medium text-slate-300">Register is empty</p>
              <p className="text-[11px] text-slate-500 mt-0.5">Click any product or use direct bill entry to add.</p>
            </div>
          ) : (
            cart.map((item, idx) => {
              const isPriceCustomized = item.originalPrice !== undefined && item.unitPrice !== item.originalPrice;
              const isMaxStockReached = item.quantity >= item.currentStock;

              return (
                <div key={`${item.productId}-${idx}`} className="pt-2.5 first:pt-0 space-y-2">
                  {/* Top line: Name, SKU, Available Stock badge & Remove */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <p className="text-xs font-semibold text-white truncate max-w-[190px]">{item.productName}</p>
                        <span className="text-[9.5px] font-mono px-1.5 py-0.2 rounded bg-white/5 text-slate-400 border border-white/5">
                          {item.productSku}
                        </span>
                      </div>

                      {/* Available Stock & Max button */}
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className="text-[10px] text-slate-400 flex items-center gap-1">
                          <span>Avail:</span>
                          <strong className={`font-mono ${item.currentStock <= 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                            {item.currentStock}
                          </strong>
                        </span>

                        {item.currentStock > 0 && !isMaxStockReached && (
                          <button
                            type="button"
                            onClick={() => handleSetAllAvailable(idx)}
                            title={`Set quantity to all ${item.currentStock} available units`}
                            className="px-1.5 py-0.2 text-[9px] font-semibold text-indigo-300 bg-indigo-500/15 hover:bg-indigo-500/30 border border-indigo-500/30 rounded flex items-center gap-0.5 transition-colors"
                          >
                            <Zap className="w-2.5 h-2.5" />
                            <span>Max ({item.currentStock})</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Total & Remove */}
                    <div className="text-right shrink-0">
                      <p className="text-xs font-bold text-white font-mono">{formatCurrency(item.total)}</p>
                      <button
                        onClick={() => handleRemoveItem(idx)}
                        className="text-[10px] text-slate-500 hover:text-rose-400 transition-colors"
                      >
                        Remove
                      </button>
                    </div>
                  </div>

                  {/* Bottom line: Direct Quantity, Unit Price & Total Price Inputs */}
                  <div className="grid grid-cols-3 gap-1.5 pt-1.5 border-t border-white/[0.03] items-center">
                    {/* 1. Quantity controls with numeric input */}
                    <div>
                      <span className="text-[9px] text-slate-500 font-medium block mb-0.5">Qty:</span>
                      <div className="flex items-center bg-[#111111] border border-white/10 rounded-md p-0.5">
                        <button
                          type="button"
                          onClick={() => handleUpdateQty(idx, item.quantity - 1)}
                          className="p-0.5 text-slate-400 hover:text-white hover:bg-white/10 rounded"
                          title="Decrease quantity"
                        >
                          <Minus className="w-2.5 h-2.5" />
                        </button>
                        <input
                          type="number"
                          min="1"
                          max={settings.allowNegativeStock ? undefined : item.currentStock}
                          value={item.quantity}
                          onChange={(e) => handleUpdateQty(idx, parseInt(e.target.value, 10) || 1)}
                          className="w-full text-center text-xs font-bold text-white font-mono bg-transparent border-0 focus:outline-none p-0"
                        />
                        <button
                          type="button"
                          disabled={!settings.allowNegativeStock && item.quantity >= item.currentStock}
                          onClick={() => handleUpdateQty(idx, item.quantity + 1)}
                          className="p-0.5 text-slate-400 hover:text-white hover:bg-white/10 rounded disabled:opacity-30"
                          title="Increase quantity"
                        >
                          <Plus className="w-2.5 h-2.5" />
                        </button>
                      </div>
                    </div>

                    {/* 2. Unit Price Control with editable input & reset */}
                    <div>
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-[9px] text-slate-500 font-medium">Price ($):</span>
                        {isPriceCustomized && (
                          <button
                            type="button"
                            onClick={() => handleResetPrice(idx)}
                            title={`Reset to catalog default price (${formatCurrency(item.originalPrice)})`}
                            className="text-[8.5px] text-amber-400 hover:text-amber-300"
                          >
                            Reset
                          </button>
                        )}
                      </div>
                      <div className="flex items-center bg-[#111111] border border-white/10 rounded-md px-1.5 py-1 focus-within:border-indigo-500">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={item.unitPrice}
                          onChange={(e) => handleUpdatePrice(idx, parseFloat(e.target.value) || 0)}
                          className="w-full text-right text-xs font-mono font-semibold text-slate-100 bg-transparent border-0 focus:outline-none p-0"
                        />
                      </div>
                    </div>

                    {/* 3. Total Price Control (User can directly edit line total!) */}
                    <div>
                      <span className="text-[9px] text-slate-500 font-medium block mb-0.5">Total ($):</span>
                      <div className="flex items-center bg-[#111111] border border-white/10 rounded-md px-1.5 py-1 focus-within:border-emerald-500">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={item.total}
                          onChange={(e) => handleUpdateTotalPrice(idx, parseFloat(e.target.value) || 0)}
                          className="w-full text-right text-xs font-mono font-bold text-emerald-400 bg-transparent border-0 focus:outline-none p-0"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Cart Calculation Summary */}
        <div className="p-4 border-t border-white/5 bg-[#111111] space-y-3 shrink-0">
          {/* Subtotal, Discount, Tax */}
          <div className="space-y-1.5 text-xs">
            <div className="flex items-center justify-between text-slate-400">
              <span>Subtotal</span>
              <span className="font-mono font-medium text-slate-200">{formatCurrency(subtotal)}</span>
            </div>

            <div className="flex items-center justify-between text-slate-400">
              <span className="flex items-center gap-1">
                <Tag className="w-3 h-3" /> Discount ({globalDiscount}%)
              </span>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={globalDiscount}
                  onChange={(e) => setGlobalDiscount(Math.min(100, Math.max(0, Number(e.target.value))))}
                  className="w-12 px-1 py-0.5 text-right text-[11px] bg-[#1A1A1A] border border-white/10 rounded font-mono text-slate-200"
                />
                <span className="font-mono text-slate-300">-{formatCurrency(discountAmount)}</span>
              </div>
            </div>

            <div className="flex items-center justify-between text-slate-400">
              <span>Sales Tax ({taxRate}%)</span>
              <span className="font-mono font-medium text-slate-200">{formatCurrency(taxAmount)}</span>
            </div>

            <div className="flex items-center justify-between text-sm font-semibold text-white pt-2 border-t border-white/5">
              <span>Grand Total</span>
              <span className="text-base font-bold text-emerald-400 font-mono">
                {formatCurrency(grandTotal)}
              </span>
            </div>
          </div>

          {/* Action Buttons: Hold, Clear, Pay */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              onClick={handleHoldOrder}
              disabled={cart.length === 0}
              className="flex items-center justify-center gap-1.5 py-2 text-xs font-medium text-slate-300 bg-[#1A1A1A] hover:bg-white/5 border border-white/5 rounded-lg transition-colors disabled:opacity-40"
            >
              <PauseCircle className="w-4 h-4" />
              <span>Hold Order</span>
            </button>

            <button
              onClick={() => setCart([])}
              disabled={cart.length === 0}
              className="flex items-center justify-center gap-1.5 py-2 text-xs font-medium text-slate-400 hover:text-rose-400 bg-[#1A1A1A] hover:bg-white/5 border border-white/5 rounded-lg transition-colors disabled:opacity-40"
            >
              <Trash2 className="w-4 h-4" />
              <span>Clear Cart</span>
            </button>
          </div>

          {/* Bill Entry / Checkout Button */}
          <button
            id="btn-pos-bill-entry"
            onClick={handleOpenPayment}
            disabled={cart.length === 0}
            className="w-full py-2.5 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-40 active:scale-98"
            title="Press Enter on keyboard to open Bill Entry / Payment"
          >
            <CreditCard className="w-4 h-4" />
            <span>Bill Entry & Pay ({formatCurrency(grandTotal)})</span>
            <kbd className="text-[10px] font-mono px-1.5 py-0.5 bg-white/20 rounded border border-white/30 ml-1">
              ↵ Enter
            </kbd>
          </button>

          {/* Held Orders quick bar if any */}
          {heldOrders.length > 0 && (
            <div className="pt-2 border-t border-white/5">
              <div className="text-[10px] font-semibold text-amber-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                <PauseCircle className="w-3 h-3" /> Held Orders ({heldOrders.length})
              </div>
              <div className="space-y-1">
                {heldOrders.map((ho) => (
                  <div
                    key={ho.id}
                    className="flex items-center justify-between p-1.5 rounded-lg bg-[#1A1A1A] border border-white/5 text-[11px]"
                  >
                    <span className="text-slate-300 font-mono">{ho.id} ({ho.items.length} items)</span>
                    <button
                      onClick={() => handleRecallOrder(ho.id)}
                      className="px-2 py-0.5 text-xs font-medium text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 rounded"
                    >
                      Recall
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Payment Processing Modal */}
      {isPaymentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-100">
          <div className="w-full max-w-lg bg-[#111111] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-[#161616]">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-emerald-400" />
                <h3 className="text-sm font-semibold text-white">Finalize Payment & Bill Entry</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsPaymentModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleCompleteSale();
              }}
              className="flex flex-col flex-1"
            >
              <div className="p-6 space-y-5">
                {/* Grand Total Display */}
                <div className="p-4 rounded-xl bg-[#161616] border border-white/5 text-center space-y-1">
                  <span className="text-xs text-slate-500 font-medium">Total Amount Due</span>
                  <p className="text-3xl font-black text-emerald-400 font-mono tracking-tight">
                    {formatCurrency(grandTotal)}
                  </p>
                  <p className="text-[11px] text-slate-400">Customer: {selectedCustomer?.name}</p>
                </div>

                {/* Payment Method Selector */}
                <div className="space-y-2">
                  <label className="text-xs font-medium text-slate-300">Payment Gateway / Tender Type</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { id: 'CASH', label: 'Cash Tender', icon: Banknote },
                      { id: 'CARD', label: 'Credit Card', icon: CreditCard },
                      { id: 'BANK_TRANSFER', label: 'Bank Wire', icon: Building },
                      { id: 'CREDIT', label: 'Customer Credit', icon: Users },
                    ].map((pm) => {
                      const Icon = pm.icon;
                      const isSelected = paymentMethod === pm.id;
                      return (
                        <button
                          key={pm.id}
                          type="button"
                          onClick={() => {
                            setPaymentMethod(pm.id as any);
                            if (pm.id !== 'CASH') setReceivedAmount(grandTotal);
                          }}
                          className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all ${
                            isSelected
                              ? 'bg-emerald-600/10 border-emerald-500/50 text-emerald-400 font-semibold shadow-sm'
                              : 'bg-[#161616] border-white/5 text-slate-400 hover:bg-white/5 hover:text-slate-200'
                          }`}
                        >
                          <Icon className="w-5 h-5 mb-1" />
                          <span className="text-[11px]">{pm.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Cash Denominations and Change Calculator */}
                {paymentMethod === 'CASH' && (
                  <div className="space-y-3 p-4 rounded-xl bg-[#161616] border border-white/5">
                    <div className="flex items-center justify-between text-xs">
                      <label className="font-medium text-slate-300">Cash Received from Customer</label>
                      <span className="font-mono text-emerald-400 font-bold">
                        Change: {formatCurrency(changeDue)}
                      </span>
                    </div>

                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono text-slate-500 text-xs">$</span>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={receivedAmount}
                          onChange={(e) => setReceivedAmount(Number(e.target.value))}
                          autoFocus
                          className="w-full pl-7 pr-3 py-2 text-sm bg-[#111111] border border-white/10 rounded-lg text-slate-100 font-mono font-bold focus:border-emerald-500 focus:outline-none"
                        />
                      </div>
                    </div>

                    {/* Quick Cash Buttons */}
                    <div className="flex items-center gap-1.5">
                      {[
                        { label: 'Exact', val: grandTotal },
                        { label: '$20', val: 20 },
                        { label: '$50', val: 50 },
                        { label: '$100', val: 100 },
                        { label: '$200', val: 200 },
                      ].map((d) => (
                        <button
                          key={d.label}
                          type="button"
                          onClick={() => setReceivedAmount(d.val)}
                          className="flex-1 py-1 text-xs font-mono font-medium bg-[#111111] hover:bg-white/5 border border-white/5 text-slate-300 rounded-lg transition-colors"
                        >
                          {d.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Customer Account Credit Info */}
                {paymentMethod === 'CREDIT' && (
                  <div className="p-3.5 rounded-xl bg-indigo-950/20 border border-indigo-500/20 text-xs space-y-1 text-indigo-300">
                    <p className="font-semibold">Customer Credit Ledger Charge</p>
                    <p className="text-[11px] text-slate-400">
                      This sale will be logged as <strong>UNPAID</strong>. The amount of {formatCurrency(grandTotal)}{' '}
                      will be added to {selectedCustomer?.name}'s accounts receivable ledger.
                    </p>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-white/5 bg-[#161616]">
                <button
                  type="button"
                  onClick={() => setIsPaymentModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                >
                  Back to Register
                </button>
                <button
                  id="btn-confirm-bill-entry"
                  type="submit"
                  className="px-5 py-2 text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm flex items-center gap-2 transition-colors"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Confirm Bill Entry</span>
                  <kbd className="text-[10px] font-mono px-1.5 py-0.5 bg-white/20 rounded border border-white/30 ml-1">
                    ↵ Enter
                  </kbd>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Completed Sale Thermal Receipt Preview Modal */}
      {completedSale && (
        <ReceiptPreviewModal
          sale={completedSale}
          receivedAmount={receivedAmount}
          onClose={() => setCompletedSale(null)}
          onNewTransaction={() => {
            setCompletedSale(null);
            setCart([]);
            setReceivedAmount(0);
          }}
        />
      )}

      {/* Quick Add Customer Modal */}
      {isAddCustomerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-100">
          <div className="w-full max-w-md bg-[#111111] border border-white/10 rounded-2xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white">Quick Add Customer</h3>
              <button onClick={() => setIsAddCustomerOpen(false)} className="p-1 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCustomer} className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs text-slate-300 font-medium">Customer Full Name *</label>
                <input
                  type="text"
                  required
                  value={newCustomerForm.name}
                  onChange={(e) => setNewCustomerForm({ ...newCustomerForm, name: e.target.value })}
                  placeholder="e.g. Acme Tech Solutions"
                  className="w-full px-3 py-2 text-xs bg-[#1A1A1A] border border-white/10 rounded-lg text-slate-100 focus:border-indigo-500 focus:outline-none placeholder-slate-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-slate-300 font-medium">Phone Number *</label>
                <input
                  type="tel"
                  required
                  value={newCustomerForm.phone}
                  onChange={(e) => setNewCustomerForm({ ...newCustomerForm, phone: e.target.value })}
                  placeholder="+1 (555) 012-3456"
                  className="w-full px-3 py-2 text-xs bg-[#1A1A1A] border border-white/10 rounded-lg text-slate-100 focus:border-indigo-500 focus:outline-none placeholder-slate-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-slate-300 font-medium">Email Address</label>
                <input
                  type="email"
                  value={newCustomerForm.email}
                  onChange={(e) => setNewCustomerForm({ ...newCustomerForm, email: e.target.value })}
                  placeholder="contact@acme.com"
                  className="w-full px-3 py-2 text-xs bg-[#1A1A1A] border border-white/10 rounded-lg text-slate-100 focus:border-indigo-500 focus:outline-none placeholder-slate-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-slate-300 font-medium">Credit Limit ($)</label>
                <input
                  type="number"
                  min="0"
                  value={newCustomerForm.creditLimit}
                  onChange={(e) => setNewCustomerForm({ ...newCustomerForm, creditLimit: Number(e.target.value) })}
                  className="w-full px-3 py-2 text-xs bg-[#1A1A1A] border border-white/10 rounded-lg text-slate-100 font-mono focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddCustomerOpen(false)}
                  className="px-3 py-1.5 text-xs text-slate-400 hover:text-white bg-[#1A1A1A] hover:bg-white/5 border border-white/5 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-sm"
                >
                  Save & Select
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Barcode Scanner Modal */}
      {isScannerOpen && (
        <BarcodeScannerModal
          onScanProduct={(prod) => handleAddToCart(prod)}
          onClose={() => setIsScannerOpen(false)}
        />
      )}
    </div>
  );
};
