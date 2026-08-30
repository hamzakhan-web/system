import React, { useState } from 'react';
import { X, Printer, Barcode, Copy, Check, Sparkles } from 'lucide-react';
import { Product } from '../../types';
import { generateBarcodeSvgString } from '../../utils/export';
import { useData } from '../../context/DataContext';

interface BarcodeGeneratorModalProps {
  product: Product;
  onClose: () => void;
}

export const BarcodeGeneratorModal: React.FC<BarcodeGeneratorModalProps> = ({ product, onClose }) => {
  const { formatCurrency } = useData();
  const [printCount, setPrintCount] = useState<number>(4);
  const [showPrice, setShowPrice] = useState<boolean>(true);
  const [showSku, setShowSku] = useState<boolean>(true);
  const [copied, setCopied] = useState<boolean>(false);

  const barcodeSvgHtml = generateBarcodeSvgString(product.barcode || product.sku, 260, 80);

  const handleCopyBarcode = () => {
    navigator.clipboard.writeText(product.barcode || product.sku);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-xl bg-[#111111] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-[#161616]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg">
              <Barcode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Barcode & Shelf Label Generator</h3>
              <p className="text-xs text-slate-500">{product.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 overflow-y-auto">
          {/* Label Preview Card */}
          <div className="p-5 rounded-2xl bg-[#161616] border border-white/5 text-center space-y-3">
            <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
              Live Label Preview (Thermal & Adhesive)
            </div>

            <div className="inline-block p-4 bg-white text-slate-900 rounded-xl shadow-lg border border-slate-200 max-w-xs text-left">
              <p className="text-xs font-bold truncate leading-tight">{product.name}</p>
              <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono mt-0.5 mb-2">
                {showSku && <span>SKU: {product.sku}</span>}
                {showPrice && <span className="font-bold text-slate-900 text-xs">{formatCurrency(product.sellingPrice)}</span>}
              </div>

              <div
                className="flex items-center justify-center my-1"
                dangerouslySetInnerHTML={{ __html: barcodeSvgHtml }}
              />

              <div className="flex items-center justify-between text-[9px] text-slate-400 mt-1 border-t border-slate-100 pt-1">
                <span>Nexus Verified</span>
                <span>Rack: {product.rackLocation || 'A-1'}</span>
              </div>
            </div>

            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                onClick={handleCopyBarcode}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-300 bg-[#1A1A1A] hover:bg-white/5 border border-white/10 rounded-lg transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied Barcode' : 'Copy Code Number'}</span>
              </button>
            </div>
          </div>

          {/* Options */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-[#161616] border border-white/5 space-y-3">
              <label className="text-xs font-medium text-slate-300">Label Customization</label>
              <div className="space-y-2 text-xs">
                <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showPrice}
                    onChange={(e) => setShowPrice(e.target.checked)}
                    className="rounded bg-[#1A1A1A] border-white/10 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>Show Selling Retail Price</span>
                </label>
                <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showSku}
                    onChange={(e) => setShowSku(e.target.checked)}
                    className="rounded bg-[#1A1A1A] border-white/10 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>Show Product SKU & Rack ID</span>
                </label>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-[#161616] border border-white/5 space-y-3">
              <label className="text-xs font-medium text-slate-300">Print Quantity (Sheet)</label>
              <div className="flex items-center gap-2">
                {[1, 4, 8, 16].map((num) => (
                  <button
                    key={num}
                    onClick={() => setPrintCount(num)}
                    className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                      printCount === num
                        ? 'bg-indigo-600 text-white'
                        : 'bg-[#1A1A1A] text-slate-300 hover:bg-white/5 border border-white/10'
                    }`}
                  >
                    {num}x
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-slate-500">Formatted for 50x30mm thermal rolls or A4 sticker sheets.</p>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-white/5 bg-[#161616]">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
          >
            Close
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-colors"
          >
            <Printer className="w-4 h-4" />
            <span>Print {printCount} Label(s)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
