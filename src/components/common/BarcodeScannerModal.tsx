import React, { useState, useEffect, useRef } from 'react';
import { X, Camera, Barcode, CheckCircle2, Search, Zap, AlertCircle } from 'lucide-react';
import { useData } from '../../context/DataContext';
import { Product } from '../../types';

interface BarcodeScannerModalProps {
  onScanProduct: (product: Product) => void;
  onClose: () => void;
}

export const BarcodeScannerModal: React.FC<BarcodeScannerModalProps> = ({ onScanProduct, onClose }) => {
  const { products } = useData();
  const [manualCode, setManualCode] = useState('');
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [scannedFeedback, setScannedFeedback] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const handleStartCamera = async () => {
    try {
      setCameraError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setIsCameraActive(true);
    } catch (err: any) {
      console.warn('Camera access error:', err);
      setCameraError('Camera access not granted or unavailable. You can use manual/quick barcode scan below.');
      setIsCameraActive(false);
    }
  };

  const handleStopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  useEffect(() => {
    return () => {
      handleStopCamera();
    };
  }, []);

  const handleLookup = (code: string) => {
    const clean = code.trim().toLowerCase();
    if (!clean) return;

    const matched = products.find(
      (p) =>
        p.barcode.toLowerCase() === clean ||
        p.sku.toLowerCase() === clean ||
        p.name.toLowerCase().includes(clean)
    );

    if (matched) {
      setScannedFeedback(`Matched: ${matched.name}`);
      setTimeout(() => {
        onScanProduct(matched);
        onClose();
      }, 400);
    } else {
      setScannedFeedback('No product found for this barcode.');
      setTimeout(() => setScannedFeedback(null), 2500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-[#111111] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col text-slate-300">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/5 bg-[#161616]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg">
              <Barcode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Live Barcode Reader</h3>
              <p className="text-xs text-slate-500">Optical scanner & instant SKU lookup</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          {/* Camera Scanner View */}
          <div className="relative aspect-video bg-[#0A0A0A] rounded-xl overflow-hidden border border-white/5 flex flex-col items-center justify-center">
            {isCameraActive ? (
              <>
                <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                <div className="absolute inset-0 border-2 border-indigo-500/50 m-6 rounded-lg pointer-events-none flex items-center justify-center">
                  <div className="w-full h-0.5 bg-rose-500 animate-pulse" />
                </div>
              </>
            ) : (
              <div className="text-center p-4 space-y-2">
                <div className="inline-flex p-3 rounded-full bg-[#1A1A1A] text-slate-400">
                  <Camera className="w-6 h-6" />
                </div>
                <p className="text-xs text-slate-400">Optical Video Scanning Ready</p>
                <button
                  onClick={handleStartCamera}
                  className="px-3 py-1.5 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-colors"
                >
                  Enable Camera Scanner
                </button>
              </div>
            )}

            {isCameraActive && (
              <button
                onClick={handleStopCamera}
                className="absolute top-2 right-2 px-2 py-1 bg-[#111111]/90 text-[11px] text-slate-200 rounded-md border border-white/10"
              >
                Turn off camera
              </button>
            )}
          </div>

          {cameraError && (
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{cameraError}</span>
            </div>
          )}

          {scannedFeedback && (
            <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-300 flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{scannedFeedback}</span>
            </div>
          )}

          {/* Manual / USB Hardware Scanner Input */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleLookup(manualCode);
            }}
            className="space-y-2"
          >
            <label className="text-xs font-medium text-slate-300">
              Hardware Scanner / Manual Barcode Input
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Barcode className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value)}
                  placeholder="Scan or enter barcode (e.g. 890124982101)..."
                  className="w-full pl-9 pr-3 py-2 text-xs bg-[#1A1A1A] border border-white/10 rounded-lg text-slate-100 placeholder-slate-500 font-mono focus:outline-none focus:border-indigo-500"
                  autoFocus
                />
              </div>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shrink-0 transition-colors"
              >
                Lookup
              </button>
            </div>
          </form>

          {/* Quick test tap barcodes */}
          <div className="space-y-1.5 pt-2 border-t border-white/5">
            <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <Zap className="w-3 h-3 text-amber-400" /> Fast-Scan Demo Shortcuts
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              {products.slice(0, 4).map((p) => (
                <button
                  key={p.id}
                  onClick={() => handleLookup(p.barcode)}
                  className="p-2 rounded-lg bg-[#161616] hover:bg-white/5 text-left border border-white/5 hover:border-white/10 transition-colors"
                >
                  <p className="text-xs font-medium text-slate-200 truncate">{p.name}</p>
                  <p className="text-[10px] text-slate-500 font-mono">{p.barcode}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
