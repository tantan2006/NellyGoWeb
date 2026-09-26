import React, { useState, useMemo, useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  X,
  Check,
  ChevronRight,
  ChevronLeft,
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  Sparkles,
  Phone,
  Mail,
  User,
  AlertCircle,
  Copy,
  ExternalLink,
  ShieldCheck,
  Info,
  Car,
  CheckCircle2,
  Share2,
} from 'lucide-react';
import { Service, ServiceZone, BusinessSettings, Booking } from '../types';
import { calculateAvailableSlots, formatDisplayDate, formatDisplayTime, generateGuestSmsNotification } from '../utils/scheduling';
import { bookingStore } from '../services/bookingStore';

interface GuestCheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  services: Service[];
  zones: ServiceZone[];
  settings: BusinessSettings;
  preselectedServiceId?: string;
  onBookingSuccess: (booking: Booking) => void;
}

export const GuestCheckoutModal: React.FC<GuestCheckoutModalProps> = ({
  isOpen,
  onClose,
  services,
  zones,
  settings,
  preselectedServiceId,
  onBookingSuccess,
}) => {
  // Step state: 1 = Services, 2 = Address & Zone, 3 = Date & Slot, 4 = Contact, 5 = Confirmation Screen
  const [currentStep, setCurrentStep] = useState<number>(1);

  // Selected state
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  
  // Address state
  const [selectedBarangay, setSelectedBarangay] = useState<string>('Baybayin (Home Base)');
  const [streetAddress, setStreetAddress] = useState<string>('');
  const [landmark, setLandmark] = useState<string>('');

  // Date & Slot state
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [selectedSlotTime, setSelectedSlotTime] = useState<string>('');

  // Guest Details state
  const [guestName, setGuestName] = useState<string>('');
  const [guestPhone, setGuestPhone] = useState<string>('');
  const [guestEmail, setGuestEmail] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'gcash'>('cash');

  // Completed booking state
  const [createdBooking, setCreatedBooking] = useState<Booking | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [copiedRef, setCopiedRef] = useState<boolean>(false);

  // Reset or initialize preselected service
  useEffect(() => {
    if (preselectedServiceId && services.some((s) => s.id === preselectedServiceId)) {
      setSelectedServiceIds([preselectedServiceId]);
    } else if (selectedServiceIds.length === 0 && services.length > 0) {
      setSelectedServiceIds([services[0].id]);
    }
  }, [preselectedServiceId, services]);

  // Calculations
  const selectedServices = useMemo(() => {
    return services.filter((s) => selectedServiceIds.includes(s.id));
  }, [services, selectedServiceIds]);

  const totalDurationMinutes = useMemo(() => {
    return selectedServices.reduce((sum, s) => sum + s.durationMinutes, 0);
  }, [selectedServices]);

  const servicesSubtotal = useMemo(() => {
    return selectedServices.reduce((sum, s) => sum + s.basePrice, 0);
  }, [selectedServices]);

  const currentZone = useMemo(() => {
    return zones.find((z) => z.barangay === selectedBarangay) || zones[0];
  }, [zones, selectedBarangay]);

  const travelFee = currentZone?.travelFee || 0;
  const totalAmount = servicesSubtotal + travelFee;

  // Real-time slot availability for chosen date
  const slotData = useMemo(() => {
    if (!selectedDate || totalDurationMinutes <= 0) {
      return { slots: [], isRestDay: false, isBlockedDate: false, isCapacityExceeded: false, activeBookingCount: 0, maxDailyCapacity: 5 };
    }
    const dayBookings = bookingStore.getBookingsForDate(selectedDate);
    return calculateAvailableSlots(selectedDate, totalDurationMinutes, settings, dayBookings);
  }, [selectedDate, totalDurationMinutes, settings, isOpen]);

  // Selected slot metadata
  const chosenSlot = useMemo(() => {
    return slotData.slots.find((s) => s.time === selectedSlotTime);
  }, [slotData.slots, selectedSlotTime]);

  const categories = useMemo(() => {
    const set = new Set(services.map((s) => s.category));
    return ['All', ...Array.from(set)];
  }, [services]);

  const filteredServices = useMemo(() => {
    if (selectedCategory === 'All') return services;
    return services.filter((s) => s.category === selectedCategory);
  }, [services, selectedCategory]);

  const toggleService = (serviceId: string) => {
    if (selectedServiceIds.includes(serviceId)) {
      if (selectedServiceIds.length > 1) {
        setSelectedServiceIds(selectedServiceIds.filter((id) => id !== serviceId));
      }
    } else {
      setSelectedServiceIds([...selectedServiceIds, serviceId]);
    }
    setSelectedSlotTime(''); // reset slot when duration changes
  };

  const handleNext = () => {
    if (currentStep === 1) {
      if (selectedServiceIds.length === 0) return;
      setCurrentStep(2);
    } else if (currentStep === 2) {
      if (!streetAddress.trim()) return;
      setCurrentStep(3);
    } else if (currentStep === 3) {
      if (!selectedSlotTime) return;
      setCurrentStep(4);
    } else if (currentStep === 4) {
      if (!guestName.trim() || !guestPhone.trim()) return;
      submitBooking();
    }
  };

  const submitBooking = async () => {
    if (!chosenSlot) return;
    setIsSubmitting(true);

    try {
      const newBooking = await bookingStore.createGuestBooking({
        guestName: guestName.trim(),
        guestPhone: guestPhone.trim(),
        guestEmail: guestEmail.trim() || undefined,
        address: streetAddress.trim(),
        barangay: selectedBarangay,
        landmark: landmark.trim() || undefined,
        serviceIds: selectedServiceIds,
        serviceNames: selectedServices.map((s) => s.name),
        totalDurationMinutes,
        servicesSubtotal,
        travelFee,
        totalAmount,
        bookingDate: selectedDate,
        startTime: chosenSlot.time,
        endTime: chosenSlot.endTime,
        status: 'pending',
        notes: notes.trim() || undefined,
        paymentMethod,
      });

      setCreatedBooking(newBooking);
      setCurrentStep(5);
      onBookingSuccess(newBooking);

      // Trigger celebration confetti
      try {
        confetti({
          particleCount: 120,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch {
        // ignore
      }
    } catch (e) {
      console.error('Failed to submit booking:', e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyReference = () => {
    if (createdBooking) {
      navigator.clipboard.writeText(createdBooking.referenceId);
      setCopiedRef(true);
      setTimeout(() => setCopiedRef(false), 2000);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-amber-50 to-orange-50/40">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-700 bg-amber-100/70 px-2 py-0.5 rounded-sm">
                Guest Checkout
              </span>
              <span className="text-xs text-slate-500 font-medium">No account required</span>
            </div>
            <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 mt-0.5">
              Book Home-Service Salon &amp; Grooming
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Indicator (Steps 1 to 4) */}
        {currentStep < 5 && (
          <div className="px-5 py-2.5 bg-slate-50 border-b border-slate-100 flex items-center justify-between text-xs font-medium text-slate-500 overflow-x-auto">
            <div className={`flex items-center gap-1.5 ${currentStep >= 1 ? 'text-amber-800 font-bold' : ''}`}>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] ${currentStep >= 1 ? 'bg-amber-600 text-white' : 'bg-slate-200'}`}>1</span>
              <span>Services</span>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />
            <div className={`flex items-center gap-1.5 ${currentStep >= 2 ? 'text-amber-800 font-bold' : ''}`}>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] ${currentStep >= 2 ? 'bg-amber-600 text-white' : 'bg-slate-200'}`}>2</span>
              <span>Address &amp; Zone</span>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />
            <div className={`flex items-center gap-1.5 ${currentStep >= 3 ? 'text-amber-800 font-bold' : ''}`}>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] ${currentStep >= 3 ? 'bg-amber-600 text-white' : 'bg-slate-200'}`}>3</span>
              <span>Date &amp; Slot</span>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />
            <div className={`flex items-center gap-1.5 ${currentStep >= 4 ? 'text-amber-800 font-bold' : ''}`}>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] ${currentStep >= 4 ? 'bg-amber-600 text-white' : 'bg-slate-200'}`}>4</span>
              <span>Details</span>
            </div>
          </div>
        )}

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1">
          {/* STEP 1: SERVICE SELECTION */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Select Desired Services</h3>
                  <p className="text-xs text-slate-500">Pick one or combine multiple services for a complete home pampering.</p>
                </div>
                {/* Category Pills */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap transition ${
                        selectedCategory === cat
                          ? 'bg-amber-600 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Service Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                {filteredServices.map((service) => {
                  const isSelected = selectedServiceIds.includes(service.id);
                  return (
                    <div
                      key={service.id}
                      onClick={() => toggleService(service.id)}
                      className={`p-3.5 rounded-xl border-2 cursor-pointer transition text-left relative flex flex-col justify-between ${
                        isSelected
                          ? 'border-amber-600 bg-amber-50/50 shadow-sm'
                          : 'border-slate-200 bg-white hover:border-amber-300 hover:bg-slate-50/50'
                      }`}
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-1.5">
                              <h4 className="font-bold text-sm text-slate-900 leading-snug">{service.name}</h4>
                              {service.isPopular && (
                                <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded-sm">
                                  Popular
                                </span>
                              )}
                            </div>
                            <span className="inline-block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mt-0.5">
                              {service.category}
                            </span>
                          </div>
                          <div
                            className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 transition ${
                              isSelected ? 'bg-amber-600 text-white' : 'border border-slate-300 bg-white'
                            }`}
                          >
                            {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                          </div>
                        </div>
                        <p className="text-xs text-slate-600 mt-2 line-clamp-2 leading-relaxed">
                          {service.description}
                        </p>
                      </div>

                      <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
                        <span className="inline-flex items-center gap-1 text-slate-500 font-medium">
                          <Clock className="w-3.5 h-3.5 text-amber-600" />
                          {service.durationMinutes} mins
                        </span>
                        <span className="font-extrabold text-base text-slate-900">
                          ₱{service.basePrice.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 2: ADDRESS & COVERAGE VALIDATION */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 flex items-start gap-3">
                <Car className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                <div className="text-xs text-amber-900 leading-relaxed">
                  <span className="font-bold">Home-Service in Los Baños, Laguna only:</span> Generisa brings complete sanitized salon equipment and tools straight to your living room, patio, or home. Please select your barangay below for transparent travel fee calculation.
                </div>
              </div>

              {/* Barangay Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Select Barangay (Coverage Zone) <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {zones.map((zone) => {
                    const isSelected = selectedBarangay === zone.barangay;
                    return (
                      <div
                        key={zone.id}
                        onClick={() => setSelectedBarangay(zone.barangay)}
                        className={`p-3 rounded-lg border cursor-pointer transition flex items-center justify-between ${
                          isSelected
                            ? 'border-amber-600 bg-amber-50/70 text-slate-900 font-semibold shadow-xs'
                            : 'border-slate-200 hover:border-amber-300 bg-white text-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <MapPin className={`w-4 h-4 ${isSelected ? 'text-amber-600' : 'text-slate-400'}`} />
                          <span className="text-xs">{zone.barangay}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-bold text-slate-900">
                            {zone.travelFee === 0 ? (
                              <span className="text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-sm">FREE (Base)</span>
                            ) : (
                              `+₱${zone.travelFee}`
                            )}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Exact Street Address */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  House / Unit / Block &amp; Street Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Blk 7 Lot 14, Narra St., Lopez Subdivision"
                  value={streetAddress}
                  onChange={(e) => setStreetAddress(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                />
              </div>

              {/* Landmark & Navigation Details */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Landmark &amp; Gate / Parking Directions (Recommended)
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Beside the blue 3-story apartment, 2nd house with black gate. Please ring bell."
                  value={landmark}
                  onChange={(e) => setLandmark(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                />
              </div>

              {/* Pricing breakdown badge */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between text-xs">
                <span className="text-slate-600">Travel Surcharge for {selectedBarangay}:</span>
                <span className="font-bold text-slate-900">
                  {travelFee === 0 ? '₱0.00 (Baybayin Home Base)' : `₱${travelFee}.00`}
                </span>
              </div>
            </div>
          )}

          {/* STEP 3: DATE & TIME SLOT SELECTION */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                  <div>
                    <h3 className="text-base font-bold text-slate-900">Pick Appointment Date</h3>
                    <p className="text-xs text-slate-500">Service duration: <span className="font-bold text-amber-700">{totalDurationMinutes} mins</span></p>
                  </div>
                  {/* Date Input */}
                  <input
                    type="date"
                    min={todayStr}
                    value={selectedDate}
                    onChange={(e) => {
                      setSelectedDate(e.target.value);
                      setSelectedSlotTime('');
                    }}
                    className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs sm:text-sm font-semibold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <p className="text-xs font-medium text-slate-600">
                  Selected: <span className="font-bold text-slate-900">{formatDisplayDate(selectedDate)}</span>
                </p>
              </div>

              {/* Slot availability messages */}
              {slotData.isRestDay && (
                <div className="p-4 bg-orange-50 border border-orange-200 rounded-xl text-xs text-orange-900 flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-orange-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold">Designated Provider Rest Day</p>
                    <p className="mt-0.5">{slotData.message}</p>
                    <p className="mt-1 font-semibold text-amber-800">Please choose another day (e.g. Tuesday through Sunday).</p>
                  </div>
                </div>
              )}

              {slotData.isBlockedDate && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-xs text-red-900 flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold">Date Blocked</p>
                    <p className="mt-0.5">{slotData.message}</p>
                  </div>
                </div>
              )}

              {slotData.isCapacityExceeded && (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start gap-2.5">
                  <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold">Daily Booking Capacity Reached</p>
                    <p className="mt-0.5">{slotData.message}</p>
                    <p className="mt-1 font-semibold">Please select a different date for your home appointment.</p>
                  </div>
                </div>
              )}

              {/* Slots Grid */}
              {!slotData.isRestDay && !slotData.isBlockedDate && !slotData.isCapacityExceeded && (
                <div>
                  <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
                    <span className="font-bold text-slate-700">Available Time Slots:</span>
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Available
                      <span className="w-2 h-2 rounded-full bg-slate-300 ml-2"></span> Buffer Protected
                    </span>
                  </div>

                  {slotData.slots.length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                      No slots available for the remaining hours today. Please choose tomorrow or an upcoming date.
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 max-h-60 overflow-y-auto pr-1">
                      {slotData.slots.map((slot) => {
                        const isChosen = selectedSlotTime === slot.time;
                        return (
                          <button
                            key={slot.time}
                            disabled={!slot.available}
                            onClick={() => setSelectedSlotTime(slot.time)}
                            className={`p-2.5 rounded-lg border text-left transition flex flex-col justify-between ${
                              !slot.available
                                ? 'bg-slate-50 border-slate-200 text-slate-400 cursor-not-allowed opacity-60'
                                : isChosen
                                ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
                                : 'bg-white border-slate-200 text-slate-800 hover:border-amber-400 hover:bg-amber-50/30'
                            }`}
                          >
                            <span className="font-bold text-xs">{slot.displayTime}</span>
                            <span className={`text-[10px] ${isChosen ? 'text-amber-100' : 'text-slate-500'}`}>
                              Ends {slot.displayEndTime}
                            </span>
                            {!slot.available && (
                              <span className="text-[9px] text-slate-400 font-medium mt-0.5">
                                {slot.reason === 'travel_buffer'
                                  ? 'Travel buffer'
                                  : slot.reason === 'booked'
                                  ? 'Booked'
                                  : slot.reason === 'past_time'
                                  ? 'Past time'
                                  : 'Unavailable'}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {chosenSlot && (
                    <div className="mt-3 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-900 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>
                          Selected: <span className="font-bold">{chosenSlot.displayTime} to {chosenSlot.displayEndTime}</span>
                        </span>
                      </div>
                      <span className="font-semibold text-emerald-700">({totalDurationMinutes} mins session)</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* STEP 4: GUEST CONTACT & REVIEW */}
          {currentStep === 4 && (
            <div className="space-y-4">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs text-slate-700">
                <span className="font-bold text-slate-900 block mb-1">Appointment Summary:</span>
                <p>• <span className="font-medium text-slate-900">{selectedServices.map((s) => s.name).join(', ')}</span></p>
                <p>• {formatDisplayDate(selectedDate)} at <span className="font-bold text-amber-700">{chosenSlot?.displayTime} - {chosenSlot?.displayEndTime}</span></p>
                <p>• Location: {streetAddress}, {selectedBarangay}</p>
              </div>

              {/* Guest Details Form */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Your Full Name <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      placeholder="e.g. Maria Clara Reyes"
                      value={guestName}
                      onChange={(e) => setGuestName(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Mobile Phone Number <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="tel"
                      placeholder="0917-123-4567"
                      value={guestPhone}
                      onChange={(e) => setGuestPhone(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                  <span className="text-[10px] text-slate-500">For SMS status updates &amp; Generisa's arrival notice</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Email Address (Optional)
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="email"
                    placeholder="e.g. maria@gmail.com"
                    value={guestEmail}
                    onChange={(e) => setGuestEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Hair Notes / Preferences / Requests
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Low skin fade on sides, keep length on top; or bring chair cover."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                />
              </div>

              {/* Payment Method Option */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Preferred Payment Method Upon Completion
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <label
                    onClick={() => setPaymentMethod('cash')}
                    className={`p-3 rounded-lg border cursor-pointer flex items-center gap-2.5 text-xs font-semibold ${
                      paymentMethod === 'cash'
                        ? 'border-amber-600 bg-amber-50/60 text-slate-900 shadow-xs'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      checked={paymentMethod === 'cash'}
                      onChange={() => setPaymentMethod('cash')}
                      className="accent-amber-600"
                    />
                    <span>Cash on Service</span>
                  </label>

                  <label
                    onClick={() => setPaymentMethod('gcash')}
                    className={`p-3 rounded-lg border cursor-pointer flex items-center gap-2.5 text-xs font-semibold ${
                      paymentMethod === 'gcash'
                        ? 'border-amber-600 bg-amber-50/60 text-slate-900 shadow-xs'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      checked={paymentMethod === 'gcash'}
                      onChange={() => setPaymentMethod('gcash')}
                      className="accent-amber-600"
                    />
                    <span>GCash / Bank Transfer</span>
                  </label>
                </div>
              </div>

              {/* Price Breakdown */}
              <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-xl space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Services Subtotal:</span>
                  <span>₱{servicesSubtotal.toLocaleString()}.00</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Travel Surcharge ({selectedBarangay}):</span>
                  <span>{travelFee === 0 ? '₱0.00 (FREE)' : `₱${travelFee}.00`}</span>
                </div>
                <div className="pt-2 border-t border-amber-200 flex justify-between font-extrabold text-sm text-slate-900">
                  <span>Total Amount Due:</span>
                  <span className="text-amber-700">₱{totalAmount.toLocaleString()}.00</span>
                </div>
              </div>
            </div>
          )}

          {/* STEP 5: SUCCESS / BOOKING REFERENCE GENERATED */}
          {currentStep === 5 && createdBooking && (
            <div className="text-center py-4 space-y-5">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
                <Check className="w-8 h-8 stroke-[3]" />
              </div>

              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                  Request Successfully Submitted
                </span>
                <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-2">
                  You're Booked with Nelly's!
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto mt-1">
                  Generisa Soriano has received your booking request for home-service. You do not need an account to track this booking.
                </p>
              </div>

              {/* Reference ID Card */}
              <div className="p-4 sm:p-5 bg-gradient-to-br from-amber-500 to-amber-600 rounded-2xl text-white max-w-md mx-auto shadow-lg shadow-amber-600/20 text-center">
                <p className="text-xs uppercase tracking-widest text-amber-100 font-semibold">
                  Your Booking Reference ID
                </p>
                <div className="text-3xl sm:text-4xl font-black tracking-widest my-2 select-all font-mono">
                  {createdBooking.referenceId}
                </div>
                <button
                  onClick={copyReference}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white rounded-lg text-xs font-semibold backdrop-blur-xs transition"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{copiedRef ? 'Copied to Clipboard!' : 'Copy Reference ID'}</span>
                </button>
              </div>

              {/* Summary Details */}
              <div className="max-w-md mx-auto bg-slate-50 border border-slate-200 rounded-xl p-4 text-left text-xs space-y-2 text-slate-700">
                <div className="flex justify-between">
                  <span className="text-slate-500">Guest Name:</span>
                  <span className="font-bold text-slate-900">{createdBooking.guestName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Schedule:</span>
                  <span className="font-bold text-slate-900">
                    {formatDisplayDate(createdBooking.bookingDate)} at {formatDisplayTime(createdBooking.startTime)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Service:</span>
                  <span className="font-bold text-slate-900">{createdBooking.serviceNames.join(', ')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Destination:</span>
                  <span className="font-bold text-slate-900">{createdBooking.address}, {createdBooking.barangay}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-slate-200">
                  <span className="font-bold text-slate-900">Total Payable on Service:</span>
                  <span className="font-extrabold text-sm text-amber-700">₱{createdBooking.totalAmount}.00</span>
                </div>
              </div>

              {/* Simulated SMS Alert Preview */}
              <div className="max-w-md mx-auto bg-slate-900 text-slate-100 rounded-xl p-3.5 text-left text-[11px] font-mono leading-relaxed border border-slate-800">
                <div className="flex items-center justify-between text-slate-400 text-[10px] mb-1">
                  <span>📱 Automated SMS Notification (Semaphore / Twilio)</span>
                  <span className="text-emerald-400">Sent to {createdBooking.guestPhone}</span>
                </div>
                <p className="text-slate-300">
                  {generateGuestSmsNotification('submitted', createdBooking)}
                </p>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                <button
                  onClick={onClose}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition"
                >
                  Done &amp; Close
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Controls (Steps 1 to 4) */}
        {currentStep < 5 && (
          <div className="px-5 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
            {currentStep > 1 ? (
              <button
                onClick={() => setCurrentStep(currentStep - 1)}
                className="inline-flex items-center gap-1 px-3.5 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-200 transition"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
            ) : (
              <div className="text-xs text-slate-500 font-medium">
                {selectedServices.length} service{selectedServices.length > 1 ? 's' : ''} • {totalDurationMinutes} mins
              </div>
            )}

            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="text-[10px] text-slate-400 uppercase font-semibold">Total Estimated</div>
                <div className="text-base font-extrabold text-slate-900 leading-none">
                  ₱{totalAmount.toLocaleString()}
                </div>
              </div>

              <button
                onClick={handleNext}
                disabled={
                  (currentStep === 1 && selectedServiceIds.length === 0) ||
                  (currentStep === 2 && !streetAddress.trim()) ||
                  (currentStep === 3 && (!selectedSlotTime || slotData.isRestDay || slotData.isBlockedDate || slotData.isCapacityExceeded)) ||
                  (currentStep === 4 && (!guestName.trim() || !guestPhone.trim() || isSubmitting))
                }
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 transition shadow-md shadow-amber-600/20 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <span>Submitting Request...</span>
                ) : currentStep === 4 ? (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Confirm Home Booking</span>
                  </>
                ) : (
                  <>
                    <span>Next</span>
                    <ChevronRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
