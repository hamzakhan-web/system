import React, { useState, useEffect, useRef } from 'react';
import {
  Printer,
  X,
  CheckCircle2,
  Copy,
  Check,
  Download,
  Share2,
  FileText,
  Sliders,
  Sparkles,
  Zap,
} from 'lucide-react';
import { Sale, SystemSettings } from '../../types';
import { ReceiptPreview } from './ReceiptPreview';
import { useData } from '../../context/DataContext';

interface ReceiptPreviewModalProps {
  sale: Sale;
  receivedAmount?: number;
  onClose: () => void;
  onNewTransaction?: () => void;
}

export const ReceiptPreviewModal: React.FC<ReceiptPreviewModalProps> = ({
  sale,
  receivedAmount,
  onClose,
  onNewTransaction,
}) => {
  const { settings, updateSettings, currentUser, selectedWarehouseId, warehouses } = useData();

  const [receiptWidth, setReceiptWidth] = useState<'80mm' | '58mm'>(
    settings.posReceiptWidth === '58mm' ? '58mm' : '80mm'
  );
  const [isCopied, setIsCopied] = useState(false);
  const [hasAutoPrinted, setHasAutoPrinted] = useState(false);
  const printTriggeredRef = useRef(false);

  const autoPrintEnabled = settings.autoPrintOnSuccess ?? true;

  const currentWarehouse =
    warehouses.find((w) => w.id === (sale.warehouseId || selectedWarehouseId))?.name ||
    'Central Logistics Hub';

  // Handle Auto-print on Mount
  useEffect(() => {
    if (autoPrintEnabled && !printTriggeredRef.current) {
      printTriggeredRef.current = true;
      const timer = setTimeout(() => {
        setHasAutoPrinted(true);
        window.print();
      }, 350);
      return () => clearTimeout(timer);
    }
  }, [autoPrintEnabled]);

  // Keyboard shortcut listener: Enter or Esc to start next transaction / close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (onNewTransaction) {
          onNewTransaction();
        } else {
          onClose();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, onNewTransaction]);

  // Handle Manual Print
  const handlePrint = () => {
    window.print();
  };

  // Generate ASCII Plain Text Receipt for clipboard
  const handleCopyTextReceipt = () => {
    const divider = '------------------------------------------\n';
    const currency = settings.currencySymbol || '$';
    let text = '';

    text += `       ${(settings.businessName || 'NEXUS POS').toUpperCase()}\n`;
    if (settings.companyTagline) text += `   ${settings.companyTagline}\n`;
    text += `   ${settings.businessAddress || settings.address || ''}\n`;
    text += `   Tel: ${settings.businessPhone || settings.phone || ''}\n`;
    text += `   Tax ID: ${settings.taxNumber || ''}\n`;
    text += divider;
    text += `INVOICE: ${sale.invoiceNumber}\n`;
    text += `DATE: ${new Date(sale.date).toLocaleString()}\n`;
    text += `CASHIER: ${sale.cashierName || currentUser.name}\n`;
    text += `CUSTOMER: ${sale.customerName || 'Walk-in'}\n`;
    text += divider;
    text += `ITEM                    QTY   PRICE   TOTAL\n`;
    text += divider;

    sale.items.forEach((item) => {
      const name = item.productName.padEnd(20, ' ').slice(0, 20);
      const qty = String(item.quantity).padStart(3, ' ');
      const price = `${currency}${item.unitPrice.toFixed(2)}`.padStart(7, ' ');
      const total = `${currency}${item.total.toFixed(2)}`.padStart(8, ' ');
      text += `${name} ${qty} ${price} ${total}\n`;
    });

    text += divider;
    text += `SUBTOTAL:                    ${currency}${sale.subtotal.toFixed(2)}\n`;
    if (sale.discountTotal > 0) {
      text += `DISCOUNT:                   -${currency}${sale.discountTotal.toFixed(2)}\n`;
    }
    text += `TAX:                         ${currency}${sale.taxTotal.toFixed(2)}\n`;
    text += `==========================================\n`;
    text += `GRAND TOTAL:                 ${currency}${sale.grandTotal.toFixed(2)}\n`;
    text += `TENDER (${sale.paymentMethod}):             ${currency}${(receivedAmount || sale.grandTotal).toFixed(2)}\n`;
    if (sale.paymentMethod === 'CASH') {
      const change = Math.max(0, (receivedAmount || sale.grandTotal) - sale.grandTotal);
      text += `CHANGE:                      ${currency}${change.toFixed(2)}\n`;
    }
    text += `==========================================\n`;
    text += `  ${settings.invoiceFooterText || settings.invoiceFooterNote || 'Thank you for your business!'}\n`;

    navigator.clipboard.writeText(text).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    });
  };

  const handleToggleAutoPrint = (val: boolean) => {
    updateSettings({ autoPrintOnSuccess: val });
  };

  return (
    <div
      id="receipt-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-sm animate-in fade-in duration-100 overflow-y-auto"
    >
      <div className="w-full max-w-lg bg-[#111111] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] text-slate-200">
        {/* Header Bar */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/5 bg-[#161616]">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-bold text-white tracking-tight">Receipt Preview & Print</h3>
                <span className="px-1.5 py-0.2 text-[10px] font-mono font-medium rounded bg-white/5 text-slate-400 border border-white/10">
                  {sale.invoiceNumber}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">Thermal receipt layout formatted for 80mm roll printer</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
            title="Close preview (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Quick Settings & Thermal Width Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-2.5 bg-[#141414] border-b border-white/5 text-xs">
          {/* Roll width toggle */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-slate-400 font-medium">Roll Width:</span>
            <div className="flex items-center bg-[#1A1A1A] p-0.5 rounded-lg border border-white/10">
              <button
                type="button"
                onClick={() => setReceiptWidth('80mm')}
                className={`px-2 py-0.5 text-[10px] font-medium rounded-md transition-all ${
                  receiptWidth === '80mm'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                80mm Standard
              </button>
              <button
                type="button"
                onClick={() => setReceiptWidth('58mm')}
                className={`px-2 py-0.5 text-[10px] font-medium rounded-md transition-all ${
                  receiptWidth === '58mm'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                58mm Compact
              </button>
            </div>
          </div>

          {/* Auto-print on success toggle */}
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              id="toggle-autoprint-success"
              type="checkbox"
              checked={autoPrintEnabled}
              onChange={(e) => handleToggleAutoPrint(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-8 h-4 bg-[#222222] border border-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-emerald-600"></div>
            <div className="flex items-center gap-1 text-[11px] font-medium text-slate-300">
              <span>Auto-print on success</span>
              {autoPrintEnabled && (
                <span className="text-[9px] px-1 py-0.2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded font-mono">
                  ACTIVE
                </span>
              )}
            </div>
          </label>
        </div>

        {/* Receipt Scroll Area */}
        <div className="p-4 sm:p-6 overflow-y-auto bg-[#0C0C0C] flex-1 flex flex-col items-center justify-start min-h-[360px]">
          {hasAutoPrinted && (
            <div className="w-full max-w-[320px] mb-3 flex items-center justify-between px-3 py-1.5 bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 rounded-lg text-[11px] animate-in fade-in">
              <span className="flex items-center gap-1.5">
                <Printer className="w-3.5 h-3.5 text-emerald-400" />
                Sent to printer queue
              </span>
              <span className="text-[10px] text-emerald-400/80 font-mono">80mm Ready</span>
            </div>
          )}

          {/* Printable 80mm / 58mm Component */}
          <div className="w-full flex justify-center">
            <ReceiptPreview
              sale={sale}
              settings={settings}
              cashierName={sale.cashierName || currentUser.name}
              warehouseName={currentWarehouse}
              receivedAmount={receivedAmount}
              width={receiptWidth}
              showBarcode={true}
              showQr={true}
            />
          </div>
        </div>

        {/* Modal Footer Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-5 py-3.5 border-t border-white/5 bg-[#161616]">
          {/* Secondary tools */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={handleCopyTextReceipt}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-300 bg-[#1A1A1A] hover:bg-white/5 border border-white/10 rounded-lg transition-colors"
              title="Copy receipt as plain formatted text"
            >
              {isCopied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-400" />
                  <span>Copy Text</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-medium text-white bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-lg transition-colors"
            >
              <Printer className="w-3.5 h-3.5 text-indigo-300" />
              <span>Print</span>
            </button>
          </div>

          {/* Primary Action Button */}
          <button
            id="btn-next-transaction"
            type="button"
            onClick={() => {
              if (onNewTransaction) {
                onNewTransaction();
              } else {
                onClose();
              }
            }}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-colors active:scale-98"
          >
            <span>Next Transaction</span>
            <kbd className="text-[10px] font-mono px-1.5 py-0.5 bg-white/20 rounded border border-white/30">
              ↵ Enter
            </kbd>
          </button>
        </div>
      </div>
    </div>
  );
};
