import React from 'react';
import {
  Scissors,
  Sparkles,
  MapPin,
  Clock,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  Phone,
  QrCode,
  ArrowRight,
  Star,
  Car,
  HeartHandshake,
  Check,
} from 'lucide-react';
import { Service, ServiceZone, BusinessSettings } from '../types';

interface HeroAndServicesProps {
  services: Service[];
  zones: ServiceZone[];
  settings: BusinessSettings;
  onOpenBooking: (serviceId?: string) => void;
  onOpenTrack: () => void;
  onOpenQr: () => void;
}

export const HeroAndServices: React.FC<HeroAndServicesProps> = ({
  services,
  zones,
  settings,
  onOpenBooking,
  onOpenTrack,
  onOpenQr,
}) => {
  return (
    <div className="space-y-16 sm:space-y-24 pb-20">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-8 sm:pt-14 pb-12 sm:pb-20 bg-radial from-amber-50/70 via-white to-orange-50/30 border-b border-amber-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            
            {/* Left Headline */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 text-xs font-bold tracking-wide shadow-xs">
                <Sparkles className="w-3.5 h-3.5 text-amber-700" />
                <span>Home-Service Salon &amp; Barbershop • Los Baños, Laguna</span>
              </div>

              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-[1.1]">
                Professional Hair &amp; Grooming, <br className="hidden sm:inline" />
                <span className="bg-gradient-to-r from-amber-600 to-amber-700 bg-clip-text text-transparent">
                  Right at Your Doorstep.
                </span>
              </h1>

              <p className="text-sm sm:text-lg text-slate-600 max-w-2xl mx-auto lg:mx-0 font-medium leading-relaxed">
                Operated by <span className="font-bold text-slate-900">Generisa Soriano</span> from Baybayin. Skip the salon queues and traffic. Book home-service haircuts, keratin blowouts, grooming, and spa treatments in seconds — <span className="text-amber-800 font-bold">no app download or registration needed</span>.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 pt-2">
                <button
                  onClick={() => onOpenBooking()}
                  className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white font-extrabold text-sm sm:text-base shadow-lg shadow-amber-600/30 transition hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Book Appointment Now</span>
                </button>

                <button
                  onClick={onOpenTrack}
                  className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-white hover:bg-slate-50 text-slate-800 font-bold text-sm sm:text-base border border-slate-300 transition shadow-xs flex items-center justify-center gap-2"
                >
                  <span>Track Existing Booking</span>
                  <ArrowRight className="w-4 h-4 text-slate-500" />
                </button>

                <button
                  onClick={onOpenQr}
                  title="Share or Scan QR Code"
                  className="p-3.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 transition shrink-0"
                >
                  <QrCode className="w-5 h-5" />
                </button>
              </div>

              {/* Trust Badges */}
              <div className="grid grid-cols-3 gap-3 pt-6 border-t border-amber-200/60 max-w-lg mx-auto lg:mx-0 text-left">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">Sanitized Tools</span>
                    <span className="text-[11px] text-slate-500">Sterilized clippers &amp; shears</span>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">Guest Checkout</span>
                    <span className="text-[11px] text-slate-500">Zero signup hassle</span>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">Prompt Arrival</span>
                    <span className="text-[11px] text-slate-500">Protected travel buffer</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Card / Provider Feature Badge */}
            <div className="lg:col-span-5">
              <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-xl border border-amber-200/80 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none"></div>

                <div className="flex items-center gap-3.5 mb-5 pb-5 border-b border-slate-100">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-600 to-amber-700 text-white flex items-center justify-center font-bold shadow-md shadow-amber-600/30">
                    <Scissors className="w-7 h-7" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h3 className="font-extrabold text-lg text-slate-900 leading-tight">
                        Generisa Soriano
                      </h3>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                        Stylist &amp; Barber
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 font-medium">Nelly's Salon &amp; Barbershop Owner</p>
                    <p className="text-xs text-amber-700 font-semibold flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3 h-3 text-amber-600" /> Based in Baybayin, Los Baños
                    </p>
                  </div>
                </div>

                {/* Home-Service Advantages */}
                <div className="space-y-3 text-xs text-slate-700">
                  <div className="p-3 bg-amber-50/70 rounded-xl border border-amber-200/70 flex items-start gap-2.5">
                    <Car className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-slate-900 block">Direct Home Visits across Los Baños</span>
                      <span className="text-slate-600 text-[11px]">
                        Baybayin (Free), Batong Malake, Mayondon, San Antonio, Anos, Lalakay &amp; more.
                      </span>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-start gap-2.5">
                    <Clock className="w-4 h-4 text-slate-700 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-slate-900 block">Guaranteed No Double-Bookings</span>
                      <span className="text-slate-600 text-[11px]">
                        Smart scheduling automatically accounts for service duration plus 30-minute travel buffers.
                      </span>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-start gap-2.5">
                    <ShieldCheck className="w-4 h-4 text-slate-700 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-slate-900 block">Safe Cash &amp; GCash on Completion</span>
                      <span className="text-slate-600 text-[11px]">
                        Inspect your hair styling before paying. Transparent pricing with no hidden charges.
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
                  <div className="text-xs">
                    <span className="text-slate-500 block">Operating Hours:</span>
                    <span className="font-bold text-slate-900">
                      {settings.openingTime} – {settings.closingTime} (Tue–Sun)
                    </span>
                  </div>
                  <button
                    onClick={() => onOpenBooking()}
                    className="px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition"
                  >
                    Select Services
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services Menu Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-14">
          <span className="text-xs font-bold uppercase tracking-wider text-amber-700 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
            Transparent Pricing &amp; Durations
          </span>
          <h2 className="text-2xl sm:text-4xl font-black text-slate-900 mt-2">
            Salon &amp; Barbershop Menu
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Exact durations ensure your home appointment start and end times are calculated accurately.
          </p>
        </div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {services.map((service) => (
            <div
              key={service.id}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:shadow-md hover:border-amber-400 transition flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 bg-amber-50 px-2 py-0.5 rounded-sm">
                    {service.category}
                  </span>
                  {service.isPopular && (
                    <span className="text-[10px] font-bold bg-amber-600 text-white px-2 py-0.5 rounded-full">
                      Popular
                    </span>
                  )}
                </div>

                <h3 className="font-extrabold text-base text-slate-900 group-hover:text-amber-700 transition leading-snug">
                  {service.name}
                </h3>
                <p className="text-xs text-slate-600 mt-2 line-clamp-3 leading-relaxed">
                  {service.description}
                </p>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <div className="text-[10px] text-slate-400 font-semibold flex items-center gap-1">
                    <Clock className="w-3 h-3 text-amber-600" /> {service.durationMinutes} mins
                  </div>
                  <div className="text-lg font-black text-slate-900">
                    ₱{service.basePrice.toLocaleString()}
                  </div>
                </div>

                <button
                  onClick={() => onOpenBooking(service.id)}
                  className="px-3.5 py-1.5 rounded-lg bg-amber-600 group-hover:bg-amber-700 text-white text-xs font-bold transition shadow-xs"
                >
                  Book Service
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Coverage & Travel Surcharges Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-br from-slate-900 to-slate-950 text-white rounded-3xl p-6 sm:p-10 shadow-xl border border-slate-800">
          <div className="max-w-2xl mb-8">
            <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider mb-1">
              <MapPin className="w-4 h-4" />
              <span>Service Area Coverage</span>
            </div>
            <h3 className="text-2xl sm:text-3xl font-black text-white">
              Home-Service Coverage in Los Baños, Laguna
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 mt-2 leading-relaxed">
              Generisa travels by motorcycle with specialized mobile salon cases. Transparent travel fees are mapped per barangay to cover fuel and transit.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 text-xs">
            {zones.map((zone) => (
              <div
                key={zone.id}
                className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-3 flex flex-col justify-between"
              >
                <div>
                  <span className="font-bold text-white text-xs block">{zone.barangay}</span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">~{zone.estimatedTransitMinutes} mins transit</span>
                </div>
                <div className="mt-2 text-right">
                  <span className="text-xs font-black text-amber-400">
                    {zone.travelFee === 0 ? 'FREE (Base)' : `+₱${zone.travelFee} Travel`}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 pt-6 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs text-slate-400">
            <div>
              <span className="text-slate-300 font-semibold">Home Base:</span> Purok 2, Baybayin, Los Baños, Laguna
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => onOpenBooking()}
                className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold transition shadow-md"
              >
                Book Your Home Visit
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works Stepper */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
            How NellyGo Home-Service Works
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Enjoy premium personal grooming at home in 4 easy steps
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-amber-50/50 border border-amber-200/80 rounded-2xl p-5 text-center space-y-3">
            <div className="w-10 h-10 rounded-full bg-amber-600 text-white font-bold flex items-center justify-center mx-auto text-sm">
              1
            </div>
            <h4 className="font-bold text-slate-900 text-sm">Pick Your Services</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Select haircuts, beard sculpt, hair color, or nail spa. See exact duration and pricing.
            </p>
          </div>

          <div className="bg-amber-50/50 border border-amber-200/80 rounded-2xl p-5 text-center space-y-3">
            <div className="w-10 h-10 rounded-full bg-amber-600 text-white font-bold flex items-center justify-center mx-auto text-sm">
              2
            </div>
            <h4 className="font-bold text-slate-900 text-sm">Input Home Address</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Choose your Los Baños barangay, street name, and landmarks for smooth navigation.
            </p>
          </div>

          <div className="bg-amber-50/50 border border-amber-200/80 rounded-2xl p-5 text-center space-y-3">
            <div className="w-10 h-10 rounded-full bg-amber-600 text-white font-bold flex items-center justify-center mx-auto text-sm">
              3
            </div>
            <h4 className="font-bold text-slate-900 text-sm">Choose Open Slot</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Live calendar shows open slots with transit buffer protection and daily workload caps.
            </p>
          </div>

          <div className="bg-amber-50/50 border border-amber-200/80 rounded-2xl p-5 text-center space-y-3">
            <div className="w-10 h-10 rounded-full bg-amber-600 text-white font-bold flex items-center justify-center mx-auto text-sm">
              4
            </div>
            <h4 className="font-bold text-slate-900 text-sm">Get Reference ID</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Receive your 6-char Reference ID. Generisa arrives on time with complete equipment.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 pt-10 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-amber-600 text-white flex items-center justify-center font-bold text-xs">
              N
            </div>
            <span className="font-bold text-slate-800">NellyGo</span>
            <span>• Home-Service Salon &amp; Barbershop by Generisa Soriano</span>
          </div>

          <div className="flex items-center gap-4 text-[11px]">
            <span>Baybayin, Los Baños, Laguna</span>
            <span>•</span>
            <a href="tel:09178492041" className="text-amber-700 hover:underline font-bold">0917-849-2041</a>
          </div>
        </div>
      </footer>
    </div>
  );
};
