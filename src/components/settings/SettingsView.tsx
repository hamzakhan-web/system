import React, { useState } from 'react';
import {
  Settings as SettingsIcon,
  Building,
  DollarSign,
  Percent,
  Receipt,
  Shield,
  Download,
  Upload,
  RotateCcw,
  Save,
  CheckCircle2,
  AlertTriangle,
  Database,
  Cpu,
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { SystemSettings } from '../../types';

export const SettingsView: React.FC = () => {
  const {
    settings,
    updateSettings,
    exportEntireDatabaseJson,
    importEntireDatabaseJson,
    resetDatabaseToSeed,
    products,
    sales,
    purchases,
    stockTransactions,
    warehouses,
    permissions,
  } = useData();

  const [formData, setFormData] = useState<SystemSettings>(settings);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [importJsonText, setImportJsonText] = useState('');
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings({
      ...formData,
      taxRate: Number(formData.taxRate),
      lowStockThreshold: Number(formData.lowStockThreshold),
    });
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleDownloadBackup = () => {
    const json = exportEntireDatabaseJson();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `inventory_system_backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!importJsonText.trim()) return;

    const ok = importEntireDatabaseJson(importJsonText);
    if (ok) {
      alert('Database restored successfully!');
      setIsImportModalOpen(false);
      setImportJsonText('');
    } else {
      alert('Invalid JSON structure. Please check your backup file.');
    }
  };

  const handleResetFactory = () => {
    if (
      confirm(
        'Are you sure you want to reset all data to default demo state? All custom added items, sales, and POs will be replaced.'
      )
    ) {
      resetDatabaseToSeed();
      alert('System successfully reset to factory demo seed.');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150 max-w-5xl text-slate-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <SettingsIcon className="w-6 h-6 text-indigo-400" />
            <span>System Configuration & Enterprise Settings</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Company profile, tax rates, inventory constraints, POS receipt customizations, and database backups.
          </p>
        </div>

        {saveSuccess && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg text-xs font-medium animate-in fade-in">
            <CheckCircle2 className="w-4 h-4" />
            <span>Settings saved successfully</span>
          </div>
        )}
      </div>

      <form onSubmit={handleSaveSettings} className="space-y-6">
        {/* Business Profile */}
        <div className="p-6 rounded-2xl bg-[#161616] border border-white/5 space-y-4">
          <div className="flex items-center gap-2 border-b border-white/5 pb-3">
            <Building className="w-4 h-4 text-indigo-400" />
            <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Commercial Entity Profile & Receipt Header
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs text-slate-300 font-medium">Legal Company / Store Name</label>
              <input
                type="text"
                required
                value={formData.businessName}
                onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-[#1A1A1A] border border-white/10 rounded-lg text-slate-100 focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs text-slate-300 font-medium">Federal Tax ID / EIN / VAT #</label>
              <input
                type="text"
                value={formData.taxNumber}
                onChange={(e) => setFormData({ ...formData, taxNumber: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-[#1A1A1A] border border-white/10 rounded-lg text-slate-100 font-mono focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs text-slate-300 font-medium">Official Business Address</label>
              <input
                type="text"
                value={formData.businessAddress}
                onChange={(e) => setFormData({ ...formData, businessAddress: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-[#1A1A1A] border border-white/10 rounded-lg text-slate-100 focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs text-slate-300 font-medium">Support Phone Number</label>
              <input
                type="text"
                value={formData.businessPhone}
                onChange={(e) => setFormData({ ...formData, businessPhone: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-[#1A1A1A] border border-white/10 rounded-lg text-slate-100 focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs text-slate-300 font-medium">Contact Email</label>
              <input
                type="email"
                value={formData.businessEmail}
                onChange={(e) => setFormData({ ...formData, businessEmail: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-[#1A1A1A] border border-white/10 rounded-lg text-slate-100 focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs text-slate-300 font-medium">Receipt & Invoice Footer Note</label>
              <input
                type="text"
                value={formData.invoiceFooterNote}
                onChange={(e) => setFormData({ ...formData, invoiceFooterNote: e.target.value })}
                placeholder="Thank you for your business!"
                className="w-full px-3 py-2 text-xs bg-[#1A1A1A] border border-white/10 rounded-lg text-slate-100 focus:border-indigo-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Currency & Financial Rules */}
        <div className="p-6 rounded-2xl bg-[#161616] border border-white/5 space-y-4">
          <div className="flex items-center gap-2 border-b border-white/5 pb-3">
            <DollarSign className="w-4 h-4 text-emerald-400" />
            <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Financial, Currency & Tax Parameters
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="text-xs text-slate-300 font-medium">Currency Code (ISO)</label>
              <select
                value={formData.currency}
                onChange={(e) => {
                  const symbol = e.target.value === 'EUR' ? '€' : e.target.value === 'GBP' ? '£' : '$';
                  setFormData({ ...formData, currency: e.target.value, currencySymbol: symbol });
                }}
                className="w-full px-3 py-2 text-xs bg-[#1A1A1A] border border-white/10 rounded-lg text-slate-100 focus:border-indigo-500 focus:outline-none"
              >
                <option value="USD" className="bg-[#111111]">USD ($)</option>
                <option value="EUR" className="bg-[#111111]">EUR (€)</option>
                <option value="GBP" className="bg-[#111111]">GBP (£)</option>
                <option value="CAD" className="bg-[#111111]">CAD (C$)</option>
                <option value="AUD" className="bg-[#111111]">AUD (A$)</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs text-slate-300 font-medium">Default Sales Tax Rate (%)</label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="100"
                value={formData.taxRate}
                onChange={(e) => setFormData({ ...formData, taxRate: Number(e.target.value) })}
                className="w-full px-3 py-2 text-xs bg-[#1A1A1A] border border-white/10 rounded-lg text-slate-100 font-mono focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs text-slate-300 font-medium">Low Stock Trigger Threshold</label>
              <input
                type="number"
                min="1"
                value={formData.lowStockThreshold}
                onChange={(e) => setFormData({ ...formData, lowStockThreshold: Number(e.target.value) })}
                className="w-full px-3 py-2 text-xs bg-[#1A1A1A] border border-white/10 rounded-lg text-slate-100 font-mono focus:border-indigo-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* POS Terminal & Thermal Receipt Printing Rules */}
        <div className="p-6 rounded-2xl bg-[#161616] border border-white/5 space-y-4">
          <div className="flex items-center gap-2 border-b border-white/5 pb-3">
            <Receipt className="w-4 h-4 text-purple-400" />
            <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              POS Thermal Receipt & Printing Preferences
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs text-slate-300 font-medium">Default POS Thermal Paper Width</label>
              <select
                value={formData.posReceiptWidth || '80mm'}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    posReceiptWidth: e.target.value as '80mm' | '58mm' | 'A4',
                  })
                }
                className="w-full px-3 py-2 text-xs bg-[#1A1A1A] border border-white/10 rounded-lg text-slate-100 focus:border-indigo-500 focus:outline-none"
              >
                <option value="80mm" className="bg-[#111111]">80mm Standard Thermal Roll (3.15 in)</option>
                <option value="58mm" className="bg-[#111111]">58mm Compact Thermal Roll (2.28 in)</option>
                <option value="A4" className="bg-[#111111]">A4 / Letter Full Page Format</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs text-slate-300 font-medium">Receipt Slogan / Sub-header</label>
              <input
                type="text"
                value={formData.companyTagline || ''}
                onChange={(e) => setFormData({ ...formData, companyTagline: e.target.value })}
                placeholder="e.g. Advanced Multi-Warehouse Distribution"
                className="w-full px-3 py-2 text-xs bg-[#1A1A1A] border border-white/10 rounded-lg text-slate-100 focus:border-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Auto-print on success toggle */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-[#111111] border border-white/5">
            <div>
              <p className="text-xs font-medium text-slate-200">Auto-Print Receipt on Bill Entry Success</p>
              <p className="text-[11px] text-slate-500">
                When enabled, the POS terminal immediately queues and prints the 80mm thermal receipt upon transaction confirmation without requiring manual click.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={formData.autoPrintOnSuccess ?? true}
                onChange={(e) =>
                  setFormData({ ...formData, autoPrintOnSuccess: e.target.checked })
                }
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-[#1A1A1A] border border-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
            </label>
          </div>
        </div>

        {/* Inventory Strictness Rules */}
        <div className="p-6 rounded-2xl bg-[#161616] border border-white/5 space-y-4">
          <div className="flex items-center gap-2 border-b border-white/5 pb-3">
            <Shield className="w-4 h-4 text-sky-400" />
            <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Inventory Integrity & Business Rules
            </h3>
          </div>

          <div className="flex items-center justify-between p-4 rounded-xl bg-[#111111] border border-white/5">
            <div>
              <p className="text-xs font-medium text-slate-200">Allow Negative Inventory Selling</p>
              <p className="text-[11px] text-slate-500">
                When disabled (recommended), POS and sales will reject transactions exceeding physically available stock.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={formData.allowNegativeStock}
                onChange={(e) => setFormData({ ...formData, allowNegativeStock: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-[#1A1A1A] border border-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
            </label>
          </div>
        </div>

        {/* Save Button */}
        {permissions.canManageSettings && (
          <div className="flex justify-end">
            <button
              type="submit"
              className="flex items-center gap-2 px-6 py-2.5 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-colors"
            >
              <Save className="w-4 h-4" />
              <span>Save System Configuration</span>
            </button>
          </div>
        )}
      </form>

      {/* Database Backup & Disaster Recovery */}
      <div className="p-6 rounded-2xl bg-[#161616] border border-white/5 space-y-4">
        <div className="flex items-center gap-2 border-b border-white/5 pb-3">
          <Database className="w-4 h-4 text-amber-400" />
          <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
            Database Snapshots, Backups & Disaster Recovery
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-[#111111] border border-white/5 space-y-3 flex flex-col justify-between">
            <div>
              <p className="text-xs font-medium text-slate-200">Export Full JSON Backup</p>
              <p className="text-[11px] text-slate-500 mt-1">
                Downloads a complete snapshot of products, warehouses, customers, sales, POs, and audit ledgers.
              </p>
            </div>
            <button
              onClick={handleDownloadBackup}
              className="flex items-center justify-center gap-2 w-full py-2 text-xs font-medium text-slate-300 bg-[#1A1A1A] hover:bg-white/5 border border-white/10 rounded-lg transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Download JSON Backup</span>
            </button>
          </div>

          <div className="p-4 rounded-xl bg-[#111111] border border-white/5 space-y-3 flex flex-col justify-between">
            <div>
              <p className="text-xs font-medium text-slate-200">Restore from JSON</p>
              <p className="text-[11px] text-slate-500 mt-1">
                Upload or paste a previously exported JSON backup file to overwrite and restore database state.
              </p>
            </div>
            <button
              onClick={() => setIsImportModalOpen(true)}
              className="flex items-center justify-center gap-2 w-full py-2 text-xs font-medium text-indigo-400 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 rounded-lg transition-colors"
            >
              <Upload className="w-4 h-4" />
              <span>Restore Backup</span>
            </button>
          </div>

          <div className="p-4 rounded-xl bg-[#111111] border border-white/5 space-y-3 flex flex-col justify-between">
            <div>
              <p className="text-xs font-medium text-rose-300">Factory Reset</p>
              <p className="text-[11px] text-slate-500 mt-1">
                Clears custom transactions and re-seeds the default enterprise catalog data.
              </p>
            </div>
            <button
              onClick={handleResetFactory}
              className="flex items-center justify-center gap-2 w-full py-2 text-xs font-medium text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 rounded-lg transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Reset to Seed Data</span>
            </button>
          </div>
        </div>

        {/* Diagnostic Metrics */}
        <div className="p-4 rounded-xl bg-[#111111] border border-white/5 flex flex-wrap items-center justify-between gap-4 text-xs font-mono text-slate-500">
          <div>Products: <strong className="text-slate-200">{products.length}</strong></div>
          <div>Warehouses: <strong className="text-slate-200">{warehouses.length}</strong></div>
          <div>Sales Invoices: <strong className="text-slate-200">{sales.length}</strong></div>
          <div>Purchase Orders: <strong className="text-slate-200">{purchases.length}</strong></div>
          <div>Stock Movements: <strong className="text-slate-200">{stockTransactions.length}</strong></div>
        </div>
      </div>

      {/* Import Modal */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-100">
          <div className="w-full max-w-lg bg-[#111111] border border-white/10 rounded-2xl p-6 space-y-4 shadow-2xl">
            <h3 className="text-sm font-semibold text-white">Restore Database from JSON Snapshot</h3>
            <p className="text-xs text-slate-400">
              Paste the contents of your backup JSON file below. This will safely restore and refresh the system.
            </p>

            <form onSubmit={handleImportSubmit} className="space-y-4">
              <textarea
                rows={8}
                required
                value={importJsonText}
                onChange={(e) => setImportJsonText(e.target.value)}
                placeholder="Paste backup JSON here..."
                className="w-full p-3 text-xs bg-[#1A1A1A] border border-white/10 rounded-lg font-mono text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsImportModalOpen(false)}
                  className="px-3 py-1.5 text-xs text-slate-400 hover:text-white bg-[#1A1A1A] hover:bg-white/5 border border-white/10 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors"
                >
                  Validate & Restore
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
