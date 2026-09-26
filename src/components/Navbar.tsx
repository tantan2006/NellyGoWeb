import React from 'react';
import { Scissors, Search, ShieldCheck, QrCode, FileCode2, Sparkles, MapPin, Phone } from 'lucide-react';

interface NavbarProps {
  onOpenBooking: () => void;
  onOpenTrack: () => void;
  onOpenAdmin: () => void;
  onOpenSpecs: () => void;
  onOpenQr: () => void;
  isAdminActive: boolean;
  onExitAdmin: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenBooking,
  onOpenTrack,
  onOpenAdmin,
  onOpenSpecs,
  onOpenQr,
  isAdminActive,
  onExitAdmin,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-amber-100 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => isAdminActive ? onExitAdmin() : window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-br from-amber-600 to-amber-700 text-white flex items-center justify-center shadow-md shadow-amber-600/20">
              <Scissors className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-xl sm:text-2xl tracking-tight text-slate-900">
                  Nelly<span className="text-amber-600">Go</span>
                </span>
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                  Home-Service
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium hidden sm:flex items-center gap-1">
                <MapPin className="w-3 h-3 text-amber-600 inline" /> Baybayin, Los Baños, Laguna
              </p>
            </div>
          </div>

          {/* Right Action Controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* System Specs / Architecture Blueprint Button */}
            <button
              onClick={onOpenSpecs}
              title="System Architecture & Database Schema"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:text-amber-700 hover:bg-amber-50 transition border border-slate-200"
            >
              <FileCode2 className="w-3.5 h-3.5 text-amber-600" />
              <span className="hidden md:inline">Architecture &amp; Specs</span>
            </button>

            {/* QR Code quick trigger */}
            <button
              onClick={onOpenQr}
              title="Scan or Print Booking QR"
              className="p-2 sm:px-3 sm:py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:text-amber-700 hover:bg-amber-50 transition border border-slate-200 flex items-center gap-1"
            >
              <QrCode className="w-4 h-4 text-slate-700" />
              <span className="hidden lg:inline">QR Flyer</span>
            </button>

            {/* Track Booking Button */}
            <button
              onClick={onOpenTrack}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium text-slate-700 hover:bg-slate-100 transition border border-slate-200"
            >
              <Search className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-500" />
              <span>Track Booking</span>
            </button>

            {/* Admin Switcher */}
            {isAdminActive ? (
              <button
                onClick={onExitAdmin}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg text-xs sm:text-sm font-semibold bg-slate-900 text-white hover:bg-slate-800 transition shadow-sm"
              >
                <span>Back to Guest View</span>
              </button>
            ) : (
              <button
                onClick={onOpenAdmin}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-200 transition"
              >
                <ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-700" />
                <span className="hidden sm:inline">Provider</span> Admin
              </button>
            )}

            {/* Primary Guest CTA */}
            {!isAdminActive && (
              <button
                onClick={onOpenBooking}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 sm:px-5 sm:py-2.5 rounded-lg text-xs sm:text-sm font-bold text-white bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 transition shadow-md shadow-amber-600/25 active:scale-95"
              >
                <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span>Book Now</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
