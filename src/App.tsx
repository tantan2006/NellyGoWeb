import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { HeroAndServices } from './components/HeroAndServices';
import { GuestCheckoutModal } from './components/GuestCheckoutModal';
import { TrackBookingModal } from './components/TrackBookingModal';
import { AdminPortal } from './components/AdminPortal';
import { SystemArchitectureModal } from './components/SystemArchitectureModal';
import { QrFlyerModal } from './components/QrFlyerModal';
import { bookingStore } from './services/bookingStore';
import { Booking, Service, ServiceZone, BusinessSettings, ClientShadowProfile } from './types';

export default function App() {
  // Store state
  const [services, setServices] = useState<Service[]>(bookingStore.getServices());
  const [allServices, setAllServices] = useState<Service[]>(bookingStore.getAllServices());
  const [zones, setZones] = useState<ServiceZone[]>(bookingStore.getServiceZones());
  const [settings, setSettings] = useState<BusinessSettings>(bookingStore.getSettings());
  const [bookings, setBookings] = useState<Booking[]>(bookingStore.getBookings());
  const [shadowProfiles, setShadowProfiles] = useState<ClientShadowProfile[]>(bookingStore.getShadowProfiles());

  // Modal / View states
  const [isBookingOpen, setIsBookingOpen] = useState<boolean>(false);
  const [preselectedServiceId, setPreselectedServiceId] = useState<string | undefined>(undefined);
  const [isTrackOpen, setIsTrackOpen] = useState<boolean>(false);
  const [trackRefId, setTrackRefId] = useState<string>('');
  const [isAdminActive, setIsAdminActive] = useState<boolean>(false);
  const [isSpecsOpen, setIsSpecsOpen] = useState<boolean>(false);
  const [isQrOpen, setIsQrOpen] = useState<boolean>(false);

  // Subscribe to real-time store changes
  useEffect(() => {
    const unsubscribe = bookingStore.subscribe(() => {
      setServices(bookingStore.getServices());
      setAllServices(bookingStore.getAllServices());
      setZones(bookingStore.getServiceZones());
      setSettings(bookingStore.getSettings());
      setBookings(bookingStore.getBookings());
      setShadowProfiles(bookingStore.getShadowProfiles());
    });
    return () => unsubscribe();
  }, []);

  // Inspect URL query params for magic tracking links or direct admin access
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const refParam = params.get('ref');
      const adminParam = params.get('admin');

      if (refParam) {
        setTrackRefId(refParam);
        setIsTrackOpen(true);
      }
      if (adminParam === 'true') {
        setIsAdminActive(true);
      }
    } catch {
      // ignore
    }
  }, []);

  const handleOpenBooking = (serviceId?: string) => {
    setPreselectedServiceId(serviceId);
    setIsBookingOpen(true);
  };

  const handleBookingSuccess = (newBooking: Booking) => {
    // Booking store already updated; modal displays reference ID & confirmation
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-amber-200 selection:text-amber-900">
      {/* Navigation */}
      <Navbar
        onOpenBooking={() => handleOpenBooking()}
        onOpenTrack={() => {
          setTrackRefId('');
          setIsTrackOpen(true);
        }}
        onOpenAdmin={() => setIsAdminActive(true)}
        onOpenSpecs={() => setIsSpecsOpen(true)}
        onOpenQr={() => setIsQrOpen(true)}
        isAdminActive={isAdminActive}
        onExitAdmin={() => setIsAdminActive(false)}
      />

      {/* Main Content: Admin Dashboard or Guest Client View */}
      {isAdminActive ? (
        <AdminPortal
          services={allServices}
          zones={bookingStore.getAllServiceZones()}
          settings={settings}
          bookings={bookings}
          shadowProfiles={shadowProfiles}
          onExit={() => setIsAdminActive(false)}
          onOpenSpecs={() => setIsSpecsOpen(true)}
        />
      ) : (
        <main>
          <HeroAndServices
            services={services}
            zones={zones}
            settings={settings}
            onOpenBooking={handleOpenBooking}
            onOpenTrack={() => {
              setTrackRefId('');
              setIsTrackOpen(true);
            }}
            onOpenQr={() => setIsQrOpen(true)}
          />
        </main>
      )}

      {/* Guest Checkout Modal */}
      <GuestCheckoutModal
        isOpen={isBookingOpen}
        onClose={() => setIsBookingOpen(false)}
        services={services}
        zones={zones}
        settings={settings}
        preselectedServiceId={preselectedServiceId}
        onBookingSuccess={handleBookingSuccess}
      />

      {/* Track Booking Modal */}
      <TrackBookingModal
        isOpen={isTrackOpen}
        onClose={() => setIsTrackOpen(false)}
        initialReferenceId={trackRefId}
        settings={settings}
      />

      {/* System Architecture & Technical Specifications Modal */}
      <SystemArchitectureModal
        isOpen={isSpecsOpen}
        onClose={() => setIsSpecsOpen(false)}
      />

      {/* Printable QR Flyer Modal */}
      <QrFlyerModal
        isOpen={isQrOpen}
        onClose={() => setIsQrOpen(false)}
      />
    </div>
  );
}
