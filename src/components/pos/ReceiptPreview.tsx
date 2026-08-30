import React from 'react';
import { Sale, SystemSettings } from '../../types';
import { generateBarcodeSvgString, generateQrSvgString } from '../../utils/export';

interface ReceiptPreviewProps {
  sale: Sale;
  settings: SystemSettings;
  cashierName?: string;
  warehouseName?: string;
  receivedAmount?: number;
  width?: '80mm' | '58mm';
  showBarcode?: boolean;
  showQr?: boolean;
  className?: string;
  id?: string;
}

export const ReceiptPreview: React.FC<ReceiptPreviewProps> = ({
  sale,
  settings,
  cashierName,
  warehouseName,
  receivedAmount,
  width = '80mm',
  showBarcode = true,
  showQr = true,
  className = '',
  id = 'thermal-receipt-80mm',
}) => {
  const currencySymbol = settings.currencySymbol || '$';

  const formatPrice = (val: number) => {
    return `${currencySymbol}${Number(val || 0).toFixed(2)}`;
  };

  const receiptDate = sale.date ? new Date(sale.date) : new Date();
  const dateFormatted = receiptDate.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
  });
  const timeFormatted = receiptDate.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });

  const effectiveCashier = cashierName || sale.cashierName || 'Operator #1';
  const effectiveWarehouse = warehouseName || sale.warehouseName || 'Main Hub Store';

  const effectiveReceived =
    receivedAmount !== undefined
      ? receivedAmount
      : sale.paidAmount !== undefined
      ? sale.paidAmount
      : sale.grandTotal;

  const changeDue =
    sale.paymentMethod === 'CASH'
      ? Math.max(0, effectiveReceived - sale.grandTotal)
      : 0;

  const is80mm = width === '80mm';

  return (
    <div
      id={id}
      className={`receipt-container bg-white text-slate-900 font-mono text-[11px] leading-tight select-text ${
        is80mm ? 'w-[80mm] max-w-[320px]' : 'w-[58mm] max-w-[240px]'
      } mx-auto p-4 shadow-xl border border-slate-200 rounded-sm relative print:shadow-none print:border-none print:p-0 print:m-0 print:w-[80mm] print:max-w-[80mm] ${className}`}
      style={{
        boxSizing: 'border-box',
        color: '#0f172a',
      }}
    >
      {/* Business Header */}
      <div className="text-center space-y-1 pb-2">
        <h2 className="text-sm font-black uppercase tracking-tight text-slate-950">
          {settings.businessName || 'Nexus Global POS'}
        </h2>
        {settings.companyTagline && (
          <p className="text-[9.5px] text-slate-600 font-medium">{settings.companyTagline}</p>
        )}
        <p className="text-[10px] text-slate-600 leading-snug">
          {settings.businessAddress || settings.address || '1400 Industrial Pkwy, Suite 500'}
        </p>
        <div className="flex justify-center flex-wrap gap-x-2 text-[9.5px] text-slate-600">
          <span>Tel: {settings.businessPhone || settings.phone || '+1 800-555-NEXUS'}</span>
          {(settings.taxNumber || 'US-EIN-45-8910294') && (
            <span>Tax ID: {settings.taxNumber}</span>
          )}
        </div>
        {settings.businessEmail && (
          <p className="text-[9px] text-slate-500">{settings.businessEmail}</p>
        )}
      </div>

      {/* Decorative dashed divider */}
      <div className="border-t border-dashed border-slate-400 my-2" />

      {/* Title & Metadata */}
      <div className="space-y-1 text-[10px] text-slate-700">
        <div className="flex justify-between items-center font-bold text-slate-900 text-[11px]">
          <span>*** SALES RECEIPT ***</span>
          <span>{sale.paymentStatus === 'PAID' ? 'PAID' : 'CREDIT SALE'}</span>
        </div>

        <div className="flex justify-between">
          <span className="text-slate-500">Invoice No:</span>
          <span className="font-bold text-slate-900">{sale.invoiceNumber}</span>
        </div>

        <div className="flex justify-between">
          <span className="text-slate-500">Date/Time:</span>
          <span>{dateFormatted} {timeFormatted}</span>
        </div>

        <div className="flex justify-between">
          <span className="text-slate-500">Cashier:</span>
          <span className="truncate max-w-[140px]">{effectiveCashier}</span>
        </div>

        <div className="flex justify-between">
          <span className="text-slate-500">Register / Hub:</span>
          <span className="truncate max-w-[140px]">{effectiveWarehouse}</span>
        </div>

        <div className="flex justify-between border-t border-dotted border-slate-300 pt-1 mt-1">
          <span className="text-slate-500">Customer:</span>
          <span className="font-semibold text-slate-900 truncate max-w-[150px]">
            {sale.customerName || 'Walk-in Retail Customer'}
          </span>
        </div>
        {sale.customerPhone && (
          <div className="flex justify-between">
            <span className="text-slate-500">Phone:</span>
            <span>{sale.customerPhone}</span>
          </div>
        )}
      </div>

      {/* Decorative dashed divider */}
      <div className="border-t border-dashed border-slate-400 my-2" />

      {/* Line Items Table Header */}
      <div className="flex justify-between text-[10px] font-bold text-slate-900 uppercase border-b border-slate-300 pb-1">
        <span className="w-1/2 text-left">ITEM / SKU</span>
        <span className="w-1/6 text-center">QTY</span>
        <span className="w-1/6 text-right">PRICE</span>
        <span className="w-1/6 text-right">TOTAL</span>
      </div>

      {/* Line Items */}
      <div className="py-1.5 space-y-1.5 divide-y divide-dotted divide-slate-200">
        {sale.items.map((item, idx) => {
          const itemQty = item.quantity || 1;
          const unitPrice = item.unitPrice || 0;
          const itemTotal = item.total !== undefined ? item.total : itemQty * unitPrice;
          const hasDiscount = item.discountPercent && item.discountPercent > 0;

          return (
            <div key={idx} className="pt-1 first:pt-0">
              <div className="flex justify-between items-start">
                <span className="font-semibold text-slate-900 text-[11px] truncate max-w-[190px]">
                  {item.productName}
                </span>
              </div>
              <div className="flex justify-between items-center text-[10px] text-slate-600">
                <span className="text-[9px] text-slate-400 font-mono">
                  {item.productSku || item.sku || 'SKU-N/A'}
                  {hasDiscount ? ` (-${item.discountPercent}%)` : ''}
                </span>
                <div className="flex justify-end gap-2 font-mono">
                  <span className="w-8 text-center">{itemQty}x</span>
                  <span className="w-12 text-right">{formatPrice(unitPrice)}</span>
                  <span className="w-14 text-right font-bold text-slate-900">
                    {formatPrice(itemTotal)}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Financial Summary */}
      <div className="border-t border-dashed border-slate-400 my-2" />

      <div className="space-y-1 text-[10.5px]">
        <div className="flex justify-between text-slate-600">
          <span>Items Count ({sale.items.reduce((acc, i) => acc + (i.quantity || 1), 0)} pcs):</span>
          <span className="font-mono">{formatPrice(sale.subtotal)}</span>
        </div>

        {((sale.discountTotal || 0) > 0 || (sale.discount || 0) > 0) && (
          <div className="flex justify-between text-emerald-700">
            <span>Special Discount:</span>
            <span className="font-mono">
              -{formatPrice(sale.discountTotal || sale.discount || 0)}
            </span>
          </div>
        )}

        <div className="flex justify-between text-slate-600">
          <span>Sales Tax ({settings.taxRateDefault || settings.taxRate || 8}%):</span>
          <span className="font-mono">{formatPrice(sale.taxTotal || sale.tax || 0)}</span>
        </div>

        {/* Grand Total */}
        <div className="flex justify-between items-center text-sm font-black text-slate-950 border-t-2 border-b-2 border-slate-900 py-1 my-1">
          <span>TOTAL DUE:</span>
          <span className="font-mono text-base">{formatPrice(sale.grandTotal)}</span>
        </div>

        {/* Tender Details */}
        <div className="pt-1 space-y-1 text-[10px] text-slate-700">
          <div className="flex justify-between">
            <span className="text-slate-500">Tender Method:</span>
            <span className="font-bold uppercase text-slate-900">
              {sale.paymentMethod === 'CASH'
                ? 'CASH TENDER'
                : sale.paymentMethod === 'CARD'
                ? 'CREDIT / DEBIT CARD'
                : sale.paymentMethod === 'BANK_TRANSFER'
                ? 'BANK WIRE'
                : 'CUSTOMER CREDIT LEDGER'}
            </span>
          </div>

          <div className="flex justify-between">
            <span className="text-slate-500">Amount Tendered:</span>
            <span className="font-mono font-medium">{formatPrice(effectiveReceived)}</span>
          </div>

          {sale.paymentMethod === 'CASH' && (
            <div className="flex justify-between font-bold text-slate-900">
              <span>Change Returned:</span>
              <span className="font-mono text-emerald-700">{formatPrice(changeDue)}</span>
            </div>
          )}

          {sale.paymentMethod === 'CREDIT' && (
            <div className="flex justify-between text-amber-800 text-[9.5px] bg-amber-50 p-1 rounded border border-amber-200 mt-1">
              <span>Charged to account balance:</span>
              <span className="font-mono font-bold">{formatPrice(sale.grandTotal)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Barcode & Verification */}
      {showBarcode && (
        <div className="pt-3 pb-1 text-center">
          <div
            className="flex justify-center max-w-[220px] mx-auto overflow-hidden"
            dangerouslySetInnerHTML={{
              __html: generateBarcodeSvgString(sale.invoiceNumber, is80mm ? 220 : 180, 48),
            }}
          />
        </div>
      )}

      {/* QR Code for e-Receipt validation */}
      {showQr && (
        <div className="pt-2 pb-1 flex flex-col items-center justify-center">
          <div
            className="w-16 h-16 border border-slate-200 p-1 rounded bg-white"
            dangerouslySetInnerHTML={{
              __html: generateQrSvgString(`NEXUS-RECEIPT:${sale.invoiceNumber}:${sale.grandTotal}`, 56),
            }}
          />
          <span className="text-[8.5px] text-slate-400 mt-0.5">Scan for E-Receipt & Warranty</span>
        </div>
      )}

      {/* Footer Notes */}
      <div className="border-t border-dashed border-slate-400 my-2" />

      <div className="text-center space-y-1 text-[9.5px] text-slate-500 pb-1">
        <p className="font-medium text-slate-700">
          {settings.invoiceFooterText ||
            settings.invoiceFooterNote ||
            'Thank you for your business!'}
        </p>
        <p className="text-[8.5px] text-slate-400">
          Goods sold are returnable within 14 days with original receipt.
        </p>
        <p className="text-[8.5px] text-slate-400">Powered by Nexus Enterprise POS</p>
      </div>

      {/* Scalloped edge decorative teeth on bottom (screen only) */}
      <div className="absolute -bottom-2 left-0 right-0 h-2 bg-transparent overflow-hidden print:hidden">
        <div
          className="w-full h-full"
          style={{
            backgroundImage:
              'radial-gradient(circle at 6px 0px, transparent 6px, #ffffff 6px)',
            backgroundSize: '12px 10px',
            backgroundRepeat: 'repeat-x',
          }}
        />
      </div>
    </div>
  );
};
