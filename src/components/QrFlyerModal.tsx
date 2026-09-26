import React from 'react';
import { X, Scissors, Download, Share2, Printer, MapPin, Phone } from 'lucide-react';
import { generateQrSvgUrl } from '../utils/qrCode';

interface QrFlyerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const QrFlyerModal: React.FC<QrFlyerModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const currentUrl = typeof window !== 'undefined' ? window.location.origin : 'https://nellygo.app';
  const qrUrl = generateQrSvgUrl(currentUrl, 260);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden p-6 sm:p-8 text-center space-y-6 animate-in zoom-in-95 duration-200">
        
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full">
            Printable Salon Flyer
          </span>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Printable Card Area */}
        <div id="printable-flyer" className="border-4 border-amber-600 rounded-3xl p-6 bg-radial from-amber-50/50 via-white to-orange-50/20 space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-600 text-white flex items-center justify-center mx-auto shadow-md shadow-amber-600/30">
            <Scissors className="w-6 h-6" />
          </div>

          <div>
            <h3 className="text-2xl font-black text-slate-900">
              Nelly<span className="text-amber-600">Go</span>
            </h3>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Home-Service Salon &amp; Barbershop
            </p>
            <p className="text-xs text-amber-800 font-semibold mt-0.5">
              Generisa Soriano • Los Baños, Laguna
            </p>
          </div>

          {/* QR Code */}
          <div className="p-3 bg-white border-2 border-dashed border-amber-400 rounded-2xl inline-block shadow-inner">
            <img src={qrUrl} alt="NellyGo Booking QR" className="w-44 h-44 mx-auto" />
          </div>

          <div className="space-y-1">
            <p className="text-xs font-bold text-slate-900">
              Point your smartphone camera to book
            </p>
            <p className="text-[11px] text-slate-500">
              Instant Guest Checkout • Transparent Rates • Live Availability
            </p>
          </div>

          <div className="pt-3 border-t border-amber-100 flex items-center justify-between text-[11px] text-slate-600">
            <span className="flex items-center gap-1 font-medium">
              <MapPin className="w-3 h-3 text-amber-600" /> Baybayin, LB
            </span>
            <span className="flex items-center gap-1 font-mono font-bold text-slate-900">
              <Phone className="w-3 h-3 text-amber-600" /> 0917-849-2041
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="flex-1 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition flex items-center justify-center gap-1.5"
          >
            <Printer className="w-4 h-4" />
            <span>Print Flyer</span>
          </button>
          <button
            onClick={() => {
              if (navigator.share) {
                navigator.share({
                  title: 'NellyGo — Home-Service Salon & Barbershop',
                  text: 'Book home-service haircut, hair spa, and grooming in Los Baños with Generisa Soriano!',
                  url: currentUrl,
                });
              } else {
                navigator.clipboard.writeText(currentUrl);
                alert('Website link copied to clipboard!');
              }
            }}
            className="flex-1 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs transition flex items-center justify-center gap-1.5"
          >
            <Share2 className="w-4 h-4" />
            <span>Share Booking Link</span>
          </button>
        </div>
      </div>
    </div>
  );
};
