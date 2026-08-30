import React, { useState, useMemo } from 'react';
import {
  Package,
  Plus,
  Search,
  Filter,
  Download,
  Upload,
  Barcode,
  Printer,
  Edit2,
  Trash2,
  AlertTriangle,
  ArrowUpDown,
  MoreVertical,
  Check,
  X,
  Building2,
  Layers,
  Sparkles,
  ExternalLink,
  ChevronDown,
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { Product } from '../../types';
import { BarcodeGeneratorModal } from '../common/BarcodeGeneratorModal';
import { exportToCsv } from '../../utils/export';

export const ProductsView: React.FC = () => {
  const {
    products,
    categories,
    brands,
    units,
    warehouses,
    suppliers,
    selectedWarehouseId,
    addProduct,
    updateProduct,
    deleteProduct,
    formatCurrency,
    permissions,
  } = useData();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [stockStatusFilter, setStockStatusFilter] = useState<'ALL' | 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK'>('ALL');
  const [sortBy, setSortBy] = useState<'name' | 'stock' | 'price' | 'date'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [barcodeModalProduct, setBarcodeModalProduct] = useState<Product | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Form State for Add / Edit
  const initialFormData = {
    name: '',
    sku: '',
    barcode: '',
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400',
    categoryId: categories[0]?.id || 'cat-1',
    brand: brands[0]?.name || 'ApexPro Systems',
    unit: 'pcs',
    purchasePrice: 0,
    sellingPrice: 0,
    wholesalePrice: 0,
    minSellingPrice: 0,
    initialStock: 20,
    minStock: 10,
    maxStock: 200,
    taxRate: 8.0,
    discount: 0,
    supplierId: suppliers[0]?.id || 'sup-1',
    warehouseId: warehouses[0]?.id || 'wh-1',
    rackLocation: 'Aisle 1 - Shelf A',
    description: '',
    status: 'ACTIVE' as const,
  };

  const [formData, setFormData] = useState(initialFormData);

  // Filtered & Sorted Products
  const filteredProducts = useMemo(() => {
    let result = products.filter((p) => {
      // Warehouse filter
      if (selectedWarehouseId !== 'ALL' && p.warehouseId !== selectedWarehouseId) {
        return false;
      }
      // Category filter
      if (selectedCategory !== 'ALL' && p.categoryId !== selectedCategory) {
        return false;
      }
      // Stock status filter
      if (stockStatusFilter === 'OUT_OF_STOCK' && p.currentStock !== 0) return false;
      if (stockStatusFilter === 'LOW_STOCK' && (p.currentStock === 0 || p.currentStock > p.minStock)) return false;
      if (stockStatusFilter === 'IN_STOCK' && p.currentStock <= 0) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          p.name.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q) ||
          p.barcode.toLowerCase().includes(q) ||
          p.brand.toLowerCase().includes(q)
        );
      }
      return true;
    });

    result.sort((a, b) => {
      let cmp = 0;
      if (sortBy === 'name') cmp = a.name.localeCompare(b.name);
      else if (sortBy === 'stock') cmp = a.currentStock - b.currentStock;
      else if (sortBy === 'price') cmp = a.sellingPrice - b.sellingPrice;
      else if (sortBy === 'date') cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      return sortOrder === 'asc' ? cmp : -cmp;
    });

    return result;
  }, [products, selectedWarehouseId, selectedCategory, stockStatusFilter, searchQuery, sortBy, sortOrder]);

  const handleOpenAddModal = () => {
    const randomSku = `NEX-${Math.random().toString(36).substring(2, 6).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;
    const randomBarcode = `890124${Math.floor(100000 + Math.random() * 900000)}`;

    setFormData({
      ...initialFormData,
      sku: randomSku,
      barcode: randomBarcode,
    });
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (prod: Product) => {
    setEditingProduct(prod);
    setFormData({
      name: prod.name,
      sku: prod.sku,
      barcode: prod.barcode,
      image: prod.image,
      categoryId: prod.categoryId,
      brand: prod.brand,
      unit: prod.unit,
      purchasePrice: prod.purchasePrice,
      sellingPrice: prod.sellingPrice,
      wholesalePrice: prod.wholesalePrice,
      minSellingPrice: prod.minSellingPrice,
      initialStock: prod.currentStock,
      minStock: prod.minStock,
      maxStock: prod.maxStock,
      taxRate: prod.taxRate,
      discount: prod.discount,
      supplierId: prod.supplierId,
      warehouseId: prod.warehouseId,
      rackLocation: prod.rackLocation || '',
      description: prod.description,
      status: prod.status,
    });
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.sku.trim()) {
      alert('Product name and SKU are required.');
      return;
    }

    if (editingProduct) {
      updateProduct(editingProduct.id, {
        name: formData.name,
        sku: formData.sku,
        barcode: formData.barcode,
        image: formData.image,
        categoryId: formData.categoryId,
        brand: formData.brand,
        unit: formData.unit,
        purchasePrice: Number(formData.purchasePrice),
        sellingPrice: Number(formData.sellingPrice),
        wholesalePrice: Number(formData.wholesalePrice),
        minSellingPrice: Number(formData.minSellingPrice),
        minStock: Number(formData.minStock),
        maxStock: Number(formData.maxStock),
        taxRate: Number(formData.taxRate),
        discount: Number(formData.discount),
        supplierId: formData.supplierId,
        warehouseId: formData.warehouseId,
        rackLocation: formData.rackLocation,
        description: formData.description,
        status: formData.status,
      });
      setEditingProduct(null);
    } else {
      addProduct({
        name: formData.name,
        sku: formData.sku,
        barcode: formData.barcode,
        image: formData.image,
        categoryId: formData.categoryId,
        brand: formData.brand,
        unit: formData.unit,
        purchasePrice: Number(formData.purchasePrice),
        sellingPrice: Number(formData.sellingPrice),
        wholesalePrice: Number(formData.wholesalePrice),
        minSellingPrice: Number(formData.minSellingPrice),
        initialStock: Number(formData.initialStock),
        minStock: Number(formData.minStock),
        maxStock: Number(formData.maxStock),
        taxRate: Number(formData.taxRate),
        discount: Number(formData.discount),
        supplierId: formData.supplierId,
        warehouseId: formData.warehouseId,
        rackLocation: formData.rackLocation,
        description: formData.description,
        status: formData.status,
      });
      setIsAddModalOpen(false);
    }
  };

  const handleExportCsv = () => {
    const rows = [
      ['Product ID', 'SKU', 'Barcode', 'Name', 'Category', 'Brand', 'Unit', 'Purchase Price', 'Selling Price', 'Current Stock', 'Min Stock', 'Warehouse', 'Status'],
      ...filteredProducts.map((p) => {
        const cat = categories.find((c) => c.id === p.categoryId)?.name || '';
        const wh = warehouses.find((w) => w.id === p.warehouseId)?.name || '';
        return [
          p.id,
          p.sku,
          p.barcode,
          p.name,
          cat,
          p.brand,
          p.unit,
          p.purchasePrice,
          p.sellingPrice,
          p.currentStock,
          p.minStock,
          wh,
          p.status,
        ];
      }),
    ];
    exportToCsv('products_catalog_export', rows);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150 text-slate-300">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <Package className="w-6 h-6 text-indigo-400" />
            <span>Products & Catalog Master</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage commercial SKUs, barcodes, multi-tier pricing, and rack assignments.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={handleExportCsv}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-slate-300 bg-[#161616] hover:bg-white/5 border border-white/5 rounded-lg transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>

          {permissions.canManageProducts && (
            <button
              onClick={handleOpenAddModal}
              className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Add Product</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-[#161616] border border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by product name, SKU, barcode, brand..."
            className="w-full pl-9 pr-3.5 py-2 text-xs bg-[#1A1A1A] border border-white/10 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>

        {/* Category & Status Filter */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Category Select */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            aria-label="Filter by category"
            className="px-3 py-2 text-xs bg-[#1A1A1A] border border-white/10 rounded-lg text-slate-200 focus:outline-none focus:border-indigo-500"
          >
            <option value="ALL" className="bg-[#111111]">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id} className="bg-[#111111]">
                {c.name}
              </option>
            ))}
          </select>

          {/* Stock Status Filter */}
          <select
            value={stockStatusFilter}
            onChange={(e) => setStockStatusFilter(e.target.value as any)}
            aria-label="Filter by stock status"
            className="px-3 py-2 text-xs bg-[#1A1A1A] border border-white/10 rounded-lg text-slate-200 focus:outline-none focus:border-indigo-500"
          >
            <option value="ALL" className="bg-[#111111]">All Stock Levels</option>
            <option value="IN_STOCK" className="bg-[#111111]">In Stock</option>
            <option value="LOW_STOCK" className="bg-[#111111]">Low Stock Alert</option>
            <option value="OUT_OF_STOCK" className="bg-[#111111]">Out of Stock</option>
          </select>

          {/* Sort Selector */}
          <button
            onClick={() => setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'))}
            className="flex items-center gap-1 px-3 py-2 text-xs font-medium text-slate-300 bg-[#1A1A1A] border border-white/10 rounded-lg hover:bg-white/5 transition-colors"
            title="Toggle sort direction"
          >
            <ArrowUpDown className="w-3.5 h-3.5" />
            <span className="capitalize">{sortOrder}</span>
          </button>
        </div>
      </div>

      {/* Products Table */}
      <div className="rounded-2xl bg-[#161616] border border-white/5 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-white/5 bg-[#111111] text-slate-500 font-mono text-[10px] uppercase">
              <tr>
                <th className="py-3 px-4 font-medium">Product</th>
                <th className="py-3 px-4 font-medium">SKU / Barcode</th>
                <th className="py-3 px-4 font-medium">Category & Brand</th>
                <th className="py-3 px-4 font-medium">Cost Price</th>
                <th className="py-3 px-4 font-medium">Retail Price</th>
                <th className="py-3 px-4 font-medium">Current Stock</th>
                <th className="py-3 px-4 font-medium">Warehouse / Rack</th>
                <th className="py-3 px-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-slate-300">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500 text-xs">
                    No products found matching your filter criteria.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => {
                  const cat = categories.find((c) => c.id === p.categoryId);
                  const wh = warehouses.find((w) => w.id === p.warehouseId);
                  const isLow = p.currentStock > 0 && p.currentStock <= p.minStock;
                  const isOut = p.currentStock === 0;

                  return (
                    <tr key={p.id} className="hover:bg-white/[0.02] transition-colors group">
                      {/* Product Name & Image */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={p.image}
                            alt={p.name}
                            className="w-10 h-10 rounded-lg object-cover bg-[#1A1A1A] shrink-0 border border-white/5"
                          />
                          <div className="min-w-0 max-w-[240px]">
                            <p className="font-medium text-white truncate group-hover:text-indigo-400 transition-colors">
                              {p.name}
                            </p>
                            <p className="text-[11px] text-slate-500 truncate">{p.description}</p>
                          </div>
                        </div>
                      </td>

                      {/* SKU & Barcode */}
                      <td className="py-3 px-4 font-mono text-[11px]">
                        <div className="space-y-0.5">
                          <span className="font-medium text-slate-200">{p.sku}</span>
                          <div className="flex items-center gap-1 text-slate-500">
                            <Barcode className="w-3 h-3" />
                            <span>{p.barcode}</span>
                          </div>
                        </div>
                      </td>

                      {/* Category & Brand */}
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 text-[10px] font-medium bg-[#1A1A1A] border border-white/5 text-slate-300 rounded-md">
                          {cat?.name || 'Unassigned'}
                        </span>
                        <p className="text-[11px] text-slate-500 mt-1">{p.brand}</p>
                      </td>

                      {/* Cost */}
                      <td className="py-3 px-4 font-mono font-medium text-slate-400">
                        {formatCurrency(p.purchasePrice)}
                      </td>

                      {/* Selling Price */}
                      <td className="py-3 px-4 font-mono font-bold text-emerald-400">
                        {formatCurrency(p.sellingPrice)}
                      </td>

                      {/* Current Stock */}
                      <td className="py-3 px-4 font-mono">
                        <div className="flex items-center gap-2">
                          <span
                            className={`font-semibold text-xs ${
                              isOut ? 'text-rose-400' : isLow ? 'text-amber-400' : 'text-slate-200'
                            }`}
                          >
                            {p.currentStock} {p.unit}
                          </span>
                          {isOut ? (
                            <span className="px-1.5 py-0.5 text-[9px] font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded">
                              OUT
                            </span>
                          ) : isLow ? (
                            <span className="px-1.5 py-0.5 text-[9px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded">
                              LOW
                            </span>
                          ) : (
                            <span className="px-1.5 py-0.5 text-[9px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded">
                              OK
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-500 mt-0.5">Min: {p.minStock} | Max: {p.maxStock}</p>
                      </td>

                      {/* Warehouse & Rack */}
                      <td className="py-3 px-4 text-[11px]">
                        <p className="font-medium text-slate-300 truncate max-w-[140px]">{wh?.name || 'Global'}</p>
                        <p className="text-slate-500 font-mono">{p.rackLocation || 'Rack not set'}</p>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setBarcodeModalProduct(p)}
                            className="p-1.5 text-slate-400 hover:text-indigo-400 hover:bg-white/5 rounded-lg transition-colors"
                            title="Generate Barcode / Print Shelf Label"
                          >
                            <Barcode className="w-4 h-4" />
                          </button>

                          {permissions.canManageProducts && (
                            <>
                              <button
                                onClick={() => handleOpenEditModal(p)}
                                className="p-1.5 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                                title="Edit Product"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setDeleteConfirmId(p.id)}
                                className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-white/5 rounded-lg transition-colors"
                                title="Delete Product"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer info */}
        <div className="flex items-center justify-between px-4 py-3 bg-[#111111] border-t border-white/5 text-[11px] text-slate-500">
          <span>Showing {filteredProducts.length} of {products.length} products</span>
          <span className="font-mono">
            Total Inventory Units:{' '}
            <strong className="text-slate-200">
              {filteredProducts.reduce((sum, p) => sum + p.currentStock, 0)}
            </strong>
          </span>
        </div>
      </div>

      {/* Add / Edit Product Modal */}
      {(isAddModalOpen || editingProduct) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-100">
          <div className="w-full max-w-2xl bg-[#111111] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-[#161616]">
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5 text-indigo-400" />
                <h3 className="text-sm font-semibold text-white">
                  {editingProduct ? `Edit Product: ${editingProduct.name}` : 'Add New Commercial Product'}
                </h3>
              </div>
              <button
                onClick={() => {
                  setIsAddModalOpen(false);
                  setEditingProduct(null);
                }}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="p-6 space-y-4 overflow-y-auto flex-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Product Name */}
                <div className="sm:col-span-2 space-y-1.5">
                  <label className="text-xs font-medium text-slate-300">Product Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. 24-Port Gigabit Managed PoE+ Switch"
                    className="w-full px-3 py-2 text-xs bg-[#1A1A1A] border border-white/10 rounded-lg text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                  />
                </div>

                {/* SKU */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300">SKU Code *</label>
                  <input
                    type="text"
                    required
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    placeholder="NEX-NET-001"
                    className="w-full px-3 py-2 text-xs bg-[#1A1A1A] border border-white/10 rounded-lg text-slate-100 placeholder-slate-500 font-mono focus:border-indigo-500 focus:outline-none"
                  />
                </div>

                {/* Barcode */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300">Barcode / UPC</label>
                  <input
                    type="text"
                    value={formData.barcode}
                    onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                    placeholder="890124982101"
                    className="w-full px-3 py-2 text-xs bg-[#1A1A1A] border border-white/10 rounded-lg text-slate-100 placeholder-slate-500 font-mono focus:border-indigo-500 focus:outline-none"
                  />
                </div>

                {/* Category */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300">Category</label>
                  <select
                    value={formData.categoryId}
                    onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-[#1A1A1A] border border-white/10 rounded-lg text-slate-100 focus:border-indigo-500 focus:outline-none"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id} className="bg-[#111111]">
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Brand */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300">Brand / Manufacturer</label>
                  <select
                    value={formData.brand}
                    onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-[#1A1A1A] border border-white/10 rounded-lg text-slate-100 focus:border-indigo-500 focus:outline-none"
                  >
                    {brands.map((b) => (
                      <option key={b.id} value={b.name} className="bg-[#111111]">
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Unit */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300">Unit of Measurement</label>
                  <select
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-[#1A1A1A] border border-white/10 rounded-lg text-slate-100 focus:border-indigo-500 focus:outline-none"
                  >
                    {units.map((u) => (
                      <option key={u.id} value={u.shortCode} className="bg-[#111111]">
                        {u.name} ({u.shortCode})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Image URL */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300">Image URL</label>
                  <input
                    type="url"
                    value={formData.image}
                    onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                    placeholder="https://..."
                    className="w-full px-3 py-2 text-xs bg-[#1A1A1A] border border-white/10 rounded-lg text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                  />
                </div>

                {/* Purchase Cost Price */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300">Purchase Cost Price ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={formData.purchasePrice}
                    onChange={(e) => setFormData({ ...formData, purchasePrice: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs bg-[#1A1A1A] border border-white/10 rounded-lg text-slate-100 font-mono focus:border-indigo-500 focus:outline-none"
                  />
                </div>

                {/* Selling Retail Price */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-emerald-400">Retail Selling Price ($) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={formData.sellingPrice}
                    onChange={(e) => setFormData({ ...formData, sellingPrice: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs bg-[#1A1A1A] border border-white/10 rounded-lg text-emerald-300 font-mono font-bold focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                {/* Initial Stock (Only for new) */}
                {!editingProduct && (
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-300">Initial Opening Stock</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.initialStock}
                      onChange={(e) => setFormData({ ...formData, initialStock: Number(e.target.value) })}
                      className="w-full px-3 py-2 text-xs bg-[#1A1A1A] border border-white/10 rounded-lg text-slate-100 font-mono focus:border-indigo-500 focus:outline-none"
                    />
                  </div>
                )}

                {/* Min Safety Stock */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-amber-400">Low Stock Reorder Threshold</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.minStock}
                    onChange={(e) => setFormData({ ...formData, minStock: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs bg-[#1A1A1A] border border-white/10 rounded-lg text-slate-100 font-mono focus:border-indigo-500 focus:outline-none"
                  />
                </div>

                {/* Default Warehouse */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300">Default Warehouse Location</label>
                  <select
                    value={formData.warehouseId}
                    onChange={(e) => setFormData({ ...formData, warehouseId: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-[#1A1A1A] border border-white/10 rounded-lg text-slate-100 focus:border-indigo-500 focus:outline-none"
                  >
                    {warehouses.map((w) => (
                      <option key={w.id} value={w.id} className="bg-[#111111]">
                        {w.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Rack / Bin Location */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300">Rack / Shelf / Bin ID</label>
                  <input
                    type="text"
                    value={formData.rackLocation}
                    onChange={(e) => setFormData({ ...formData, rackLocation: e.target.value })}
                    placeholder="e.g. Aisle 3 - Bay B - Shelf 2"
                    className="w-full px-3 py-2 text-xs bg-[#1A1A1A] border border-white/10 rounded-lg text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                  />
                </div>

                {/* Description */}
                <div className="sm:col-span-2 space-y-1.5">
                  <label className="text-xs font-medium text-slate-300">Product Specifications & Description</label>
                  <textarea
                    rows={2}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Enter detailed technical specs, warranty info, or handling notes..."
                    className="w-full px-3 py-2 text-xs bg-[#1A1A1A] border border-white/10 rounded-lg text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setEditingProduct(null);
                  }}
                  className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-colors"
                >
                  {editingProduct ? 'Save Changes' : 'Create Product SKU'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-100">
          <div className="w-full max-w-md bg-[#111111] border border-white/10 rounded-2xl p-6 space-y-4 text-center shadow-2xl">
            <div className="w-12 h-12 rounded-full bg-rose-500/10 text-rose-400 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Confirm Product Deletion</h3>
              <p className="text-xs text-slate-400 mt-1">
                Are you sure you want to delete this product SKU? This will remove inventory records and history.
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white bg-[#1A1A1A] hover:bg-white/5 border border-white/5 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  deleteProduct(deleteConfirmId);
                  setDeleteConfirmId(null);
                }}
                className="px-4 py-2 text-xs font-medium text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-sm transition-colors"
              >
                Yes, Delete SKU
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Barcode Modal */}
      {barcodeModalProduct && (
        <BarcodeGeneratorModal
          product={barcodeModalProduct}
          onClose={() => setBarcodeModalProduct(null)}
        />
      )}
    </div>
  );
};
