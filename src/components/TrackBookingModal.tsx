import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Search,
  Calendar,
  Clock,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Clock3,
  Phone,
  RotateCcw,
  Ban,
  ShieldCheck,
  ChevronRight,
  ExternalLink,
  MessageSquare,
  Sparkles,
  Info,
} from 'lucide-react';
import { Booking, BookingStatus, BusinessSettings } from '../types';
import { bookingStore } from '../services/bookingStore';
import {
  formatDisplayDate,
  formatDisplayTime,
  canManageBooking,
  calculateAvailableSlots,
  generateGuestSmsNotification,
} from '../utils/scheduling';

interface TrackBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialReferenceId?: string;
  settings: BusinessSettings;
}

export const TrackBookingModal: React.FC<TrackBookingModalProps> = ({
  isOpen,
  onClose,
  initialReferenceId = '',
  settings,
}) => {
  const [referenceInput, setReferenceInput] = useState<string>(initialReferenceId);
  const [phoneOrEmailInput, setPhoneOrEmailInput] = useState<string>('');
  const [activeBooking, setActiveBooking] = useState<Booking | null>(null);
  const [hasSearched, setHasSearched] = useState<boolean>(false);
  const [searchError, setSearchError] = useState<string>('');

  // Reschedule state
  const [isRescheduling, setIsRescheduling] = useState<boolean>(false);
  const [newDate, setNewDate] = useState<string>('');
  const [newSlotTime, setNewSlotTime] = useState<string>('');
  const [rescheduleSuccess, setRescheduleSuccess] = useState<boolean>(false);

  // Cancel state
  const [isCancelling, setIsCancelling] = useState<boolean>(false);
  const [cancelReason, setCancelReason] = useState<string>('');
  const [cancelSuccess, setCancelSuccess] = useState<boolean>(false);

  // Sync initial reference ID if passed
  useEffect(() => {
    if (initialReferenceId) {
      setReferenceInput(initialReferenceId);
      performSearch(initialReferenceId, '');
    }
  }, [initialReferenceId, isOpen]);

  const performSearch = (ref: string, contact: string) => {
    setSearchError('');
    setHasSearched(true);
    setIsRescheduling(false);
    setIsCancelling(false);
    setRescheduleSuccess(false);
    setCancelSuccess(false);

    if (!ref.trim()) {
      setSearchError('Please enter your 6-character Reference ID (e.g. NG-7K4X29)');
      setActiveBooking(null);
      return;
    }

    const booking = bookingStore.getBookingByReference(ref, contact || undefined);
    if (!booking) {
      setSearchError('No booking found matching this Reference ID. Please check the spelling or contact details.');
      setActiveBooking(null);
    } else {
      setActiveBooking(booking);
      setNewDate(booking.bookingDate);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    performSearch(referenceInput, phoneOrEmailInput);
  };

  // 24h Cutoff check
  const manageability = useMemo(() => {
    if (!activeBooking) return { allowed: false, hoursRemaining: 0 };
    return canManageBooking(
      activeBooking.bookingDate,
      activeBooking.startTime,
      settings.minCancellationHours
    );
  }, [activeBooking, settings.minCancellationHours]);

  // Available slots for reschedule date
  const rescheduleSlotData = useMemo(() => {
    if (!activeBooking || !newDate || !isRescheduling) {
      return { slots: [], isRestDay: false, isBlockedDate: false, isCapacityExceeded: false, activeBookingCount: 0, maxDailyCapacity: 5 };
    }
    const dayBookings = bookingStore
      .getBookingsForDate(newDate)
      .filter((b) => b.id !== activeBooking.id); // exclude self
    return calculateAvailableSlots(newDate, activeBooking.totalDurationMinutes, settings, dayBookings);
  }, [activeBooking, newDate, settings, isRescheduling]);

  const handleConfirmReschedule = async () => {
    if (!activeBooking || !newSlotTime) return;
    const chosen = rescheduleSlotData.slots.find((s) => s.time === newSlotTime);
    if (!chosen) return;

    await bookingStore.rescheduleBooking(activeBooking.id, newDate, chosen.time, chosen.endTime);
    // Refresh active booking
    const refreshed = bookingStore.getBookingByReference(activeBooking.referenceId);
    if (refreshed) setActiveBooking(refreshed);
    setIsRescheduling(false);
    setRescheduleSuccess(true);
  };

  const handleConfirmCancel = async () => {
    if (!activeBooking) return;
    await bookingStore.updateBookingStatus(
      activeBooking.id,
      'cancelled',
      cancelReason.trim() || 'Client requested cancellation online',
      'guest'
    );
    const refreshed = bookingStore.getBookingByReference(activeBooking.referenceId);
    if (refreshed) setActiveBooking(refreshed);
    setIsCancelling(false);
    setCancelSuccess(true);
  };

  const getStatusBadge = (status: BookingStatus) => {
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300">
            <Clock3 className="w-3.5 h-3.5 text-amber-700 animate-pulse" />
            Pending Provider Review
          </span>
        );
      case 'confirmed':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
            Confirmed Appointment
          </span>
        );
      case 'in_progress':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-900 border border-blue-300">
            <Sparkles className="w-3.5 h-3.5 text-blue-700" />
            Service In Progress
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-900 text-white">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            Service Completed
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-900 border border-red-300">
            <Ban className="w-3.5 h-3.5 text-red-700" />
            Cancelled
          </span>
        );
      case 'no_show':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-900 border border-rose-300">
            <AlertCircle className="w-3.5 h-3.5 text-rose-700" />
            No-Show Recorded
          </span>
        );
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
              <Search className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
                Track or Manage Guest Booking
              </h2>
              <p className="text-xs text-slate-500">
                View status, reschedule, or cancel using your Booking Reference ID
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Form */}
        <div className="p-5 border-b border-slate-100 bg-white">
          <form onSubmit={handleSearchSubmit} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Booking Reference ID <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. NG-7K4X29"
                  value={referenceInput}
                  onChange={(e) => setReferenceInput(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm font-mono uppercase focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Phone Number or Email (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. 0917-555-8123"
                  value={phoneOrEmailInput}
                  onChange={(e) => setPhoneOrEmailInput(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-[11px] text-slate-500">
                Sample demo booking to test: <button type="button" onClick={() => { setReferenceInput('NG-7K4X29'); performSearch('NG-7K4X29', ''); }} className="text-amber-700 font-mono font-bold underline">NG-7K4X29</button>
              </span>
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs transition shadow-xs"
              >
                Find Booking
              </button>
            </div>
          </form>

          {searchError && (
            <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-800 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{searchError}</span>
            </div>
          )}
        </div>

        {/* Modal Content */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-4">
          {rescheduleSuccess && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>Your appointment has been successfully rescheduled and confirmed!</span>
            </div>
          )}

          {cancelSuccess && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-900 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-rose-600 shrink-0" />
              <span>Your appointment has been cancelled. Generisa has been notified.</span>
            </div>
          )}

          {activeBooking && (
            <div className="space-y-4">
              {/* Status Banner */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs uppercase font-mono font-bold tracking-wider text-slate-500">
                      REF: {activeBooking.referenceId}
                    </span>
                    {getStatusBadge(activeBooking.status)}
                  </div>
                  <h3 className="text-base font-extrabold text-slate-900 mt-1">
                    {activeBooking.guestName}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Phone: {activeBooking.guestPhone} {activeBooking.guestEmail ? `• ${activeBooking.guestEmail}` : ''}
                  </p>
                </div>

                <div className="text-left sm:text-right border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-200">
                  <div className="text-[11px] text-slate-500">Total Payable:</div>
                  <div className="text-lg font-black text-amber-700">
                    ₱{activeBooking.totalAmount.toLocaleString()}.00
                  </div>
                  <div className="text-[10px] font-semibold text-slate-500 uppercase">
                    Payment: {activeBooking.paymentStatus} ({activeBooking.paymentMethod})
                  </div>
                </div>
              </div>

              {/* Lifecycle Progress Bar */}
              {activeBooking.status !== 'cancelled' && activeBooking.status !== 'no_show' && (
                <div className="py-2 px-1">
                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 mb-1.5">
                    <span className={activeBooking.status === 'pending' ? 'text-amber-700' : 'text-slate-800'}>1. Submitted</span>
                    <span className={activeBooking.status === 'confirmed' ? 'text-emerald-700' : ''}>2. Confirmed</span>
                    <span className={activeBooking.status === 'in_progress' ? 'text-blue-700' : ''}>3. In Progress</span>
                    <span className={activeBooking.status === 'completed' ? 'text-slate-900' : ''}>4. Completed</span>
                  </div>
                  <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden flex">
                    <div
                      className={`h-full transition-all duration-500 ${
                        activeBooking.status === 'pending'
                          ? 'w-1/4 bg-amber-500'
                          : activeBooking.status === 'confirmed'
                          ? 'w-2/4 bg-emerald-500'
                          : activeBooking.status === 'in_progress'
                          ? 'w-3/4 bg-blue-500 animate-pulse'
                          : 'w-full bg-slate-900'
                      }`}
                    ></div>
                  </div>
                </div>
              )}

              {/* Service & Schedule Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 bg-white border border-slate-200 rounded-xl space-y-1.5">
                  <span className="font-bold text-slate-900 flex items-center gap-1.5 text-xs">
                    <Calendar className="w-3.5 h-3.5 text-amber-600" /> Date &amp; Time
                  </span>
                  <p className="text-slate-700 font-semibold">
                    {formatDisplayDate(activeBooking.bookingDate)}
                  </p>
                  <p className="text-slate-600">
                    {formatDisplayTime(activeBooking.startTime)} – {formatDisplayTime(activeBooking.endTime)} ({activeBooking.totalDurationMinutes} mins)
                  </p>
                </div>

                <div className="p-3.5 bg-white border border-slate-200 rounded-xl space-y-1.5">
                  <span className="font-bold text-slate-900 flex items-center gap-1.5 text-xs">
                    <MapPin className="w-3.5 h-3.5 text-amber-600" /> Home Destination
                  </span>
                  <p className="text-slate-700 font-semibold">{activeBooking.barangay}</p>
                  <p className="text-slate-600">{activeBooking.address}</p>
                  {activeBooking.landmark && (
                    <p className="text-[11px] text-slate-500 italic">Landmark: {activeBooking.landmark}</p>
                  )}
                </div>
              </div>

              {/* Services Selected */}
              <div className="p-3.5 bg-white border border-slate-200 rounded-xl text-xs space-y-2">
                <span className="font-bold text-slate-900">Services Included:</span>
                <ul className="list-disc list-inside text-slate-700 space-y-1">
                  {activeBooking.serviceNames.map((name, i) => (
                    <li key={i} className="font-medium">{name}</li>
                  ))}
                </ul>
                {activeBooking.notes && (
                  <div className="pt-2 border-t border-slate-100 text-slate-500">
                    <span className="font-semibold text-slate-700">Special Notes:</span> {activeBooking.notes}
                  </div>
                )}
              </div>

              {/* 24h Cutoff Policy Notice */}
              {(activeBooking.status === 'pending' || activeBooking.status === 'confirmed') && (
                <div className="p-3.5 rounded-xl border text-xs bg-slate-50 border-slate-200">
                  <div className="flex items-center gap-2 mb-1">
                    <ShieldCheck className="w-4 h-4 text-amber-700 shrink-0" />
                    <span className="font-bold text-slate-900">Cancellation &amp; Reschedule Policy</span>
                  </div>
                  <p className="text-slate-600 leading-relaxed">
                    Online changes are permitted up to <span className="font-bold text-slate-900">24 hours</span> prior to the scheduled visit.
                    {manageability.allowed ? (
                      <span className="text-emerald-700 font-semibold block mt-0.5">
                        ✓ Your appointment is {manageability.hoursRemaining} hours away. You can modify or cancel online below.
                      </span>
                    ) : (
                      <span className="text-rose-700 font-semibold block mt-0.5">
                        ⚠ Less than 24 hours remaining ({manageability.hoursRemaining}h left). Online cancellation is closed to protect travel routing. Please call Generisa directly for emergencies.
                      </span>
                    )}
                  </p>
                </div>
              )}

              {/* Action Buttons for Guest */}
              {(activeBooking.status === 'pending' || activeBooking.status === 'confirmed') && (
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  {manageability.allowed ? (
                    <>
                      <button
                        onClick={() => {
                          setIsRescheduling(!isRescheduling);
                          setIsCancelling(false);
                        }}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition"
                      >
                        <RotateCcw className="w-3.5 h-3.5 text-slate-600" />
                        <span>Request Reschedule</span>
                      </button>

                      <button
                        onClick={() => {
                          setIsCancelling(!isCancelling);
                          setIsRescheduling(false);
                        }}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold text-red-700 bg-red-50 hover:bg-red-100 transition border border-red-200"
                      >
                        <Ban className="w-3.5 h-3.5 text-red-600" />
                        <span>Cancel Booking</span>
                      </button>
                    </>
                  ) : (
                    <a
                      href="tel:09178492041"
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 transition"
                    >
                      <Phone className="w-3.5 h-3.5 text-amber-400" />
                      <span>Call Generisa (0917-849-2041)</span>
                    </a>
                  )}
                </div>
              )}

              {/* Reschedule Drawer / Sub-form */}
              {isRescheduling && (
                <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-xl space-y-3 text-xs animate-in fade-in duration-150">
                  <h4 className="font-bold text-slate-900">Select New Date &amp; Time Slot</h4>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                    <input
                      type="date"
                      min={new Date().toISOString().split('T')[0]}
                      value={newDate}
                      onChange={(e) => {
                        setNewDate(e.target.value);
                        setNewSlotTime('');
                      }}
                      className="px-3 py-1.5 rounded-lg border border-slate-300 font-semibold"
                    />
                  </div>

                  {rescheduleSlotData.isRestDay ? (
                    <p className="text-orange-700 font-medium">{rescheduleSlotData.message}</p>
                  ) : rescheduleSlotData.isCapacityExceeded ? (
                    <p className="text-amber-800 font-medium">{rescheduleSlotData.message}</p>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 max-h-40 overflow-y-auto">
                      {rescheduleSlotData.slots.map((slot) => (
                        <button
                          key={slot.time}
                          disabled={!slot.available}
                          onClick={() => setNewSlotTime(slot.time)}
                          className={`p-2 rounded-lg border text-left text-xs ${
                            !slot.available
                              ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                              : newSlotTime === slot.time
                              ? 'bg-amber-600 text-white border-amber-600 font-bold'
                              : 'bg-white border-slate-200 hover:border-amber-400'
                          }`}
                        >
                          <div>{slot.displayTime}</div>
                          <div className="text-[10px] opacity-75">to {slot.displayEndTime}</div>
                        </button>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center justify-end gap-2 pt-2">
                    <button
                      onClick={() => setIsRescheduling(false)}
                      className="px-3 py-1.5 rounded-lg text-slate-600 text-xs font-semibold"
                    >
                      Dismiss
                    </button>
                    <button
                      disabled={!newSlotTime}
                      onClick={handleConfirmReschedule}
                      className="px-4 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs disabled:opacity-50"
                    >
                      Confirm New Schedule
                    </button>
                  </div>
                </div>
              )}

              {/* Cancel Confirmation Drawer */}
              {isCancelling && (
                <div className="p-4 bg-red-50/70 border border-red-200 rounded-xl space-y-3 text-xs animate-in fade-in duration-150">
                  <h4 className="font-bold text-red-900">Are you sure you want to cancel this booking?</h4>
                  <p className="text-slate-600">Please provide a quick reason so Generisa can reopen the slot for other neighbors in Los Baños:</p>
                  <textarea
                    rows={2}
                    placeholder="e.g. Sudden work schedule conflict, family emergency, feeling unwell..."
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs bg-white"
                  />
                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      onClick={() => setIsCancelling(false)}
                      className="px-3 py-1.5 rounded-lg text-slate-600 text-xs font-semibold"
                    >
                      Keep Booking
                    </button>
                    <button
                      onClick={handleConfirmCancel}
                      className="px-4 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold text-xs"
                    >
                      Confirm Cancellation
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {!activeBooking && !searchError && (
            <div className="text-center py-10 text-slate-400 space-y-2">
              <Search className="w-8 h-8 mx-auto text-slate-300" />
              <p className="text-xs">Enter your Booking Reference ID above to see live updates.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
