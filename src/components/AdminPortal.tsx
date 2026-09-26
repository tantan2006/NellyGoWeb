import React, { useState, useMemo } from 'react';
import {
  Calendar,
  Clock,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Clock3,
  Phone,
  DollarSign,
  Users,
  Scissors,
  Settings as SettingsIcon,
  Navigation,
  FileText,
  Plus,
  Edit,
  ExternalLink,
  Shield,
  ShieldCheck,
  Check,
  X,
  CreditCard,
  QrCode,
  Sparkles,
  Ban,
  Car,
  Bell,
  Printer,
  ChevronRight,
  TrendingUp,
  MessageSquare,
} from 'lucide-react';
import { Booking, Service, ServiceZone, BusinessSettings, ClientShadowProfile, BookingStatus, PaymentStatus, PaymentMethod } from '../types';
import { bookingStore } from '../services/bookingStore';
import { formatDisplayDate, formatDisplayTime, generateGuestSmsNotification } from '../utils/scheduling';
import { generateQrSvgUrl } from '../utils/qrCode';

interface AdminPortalProps {
  services: Service[];
  zones: ServiceZone[];
  settings: BusinessSettings;
  bookings: Booking[];
  shadowProfiles: ClientShadowProfile[];
  onExit: () => void;
  onOpenSpecs: () => void;
}

export const AdminPortal: React.FC<AdminPortalProps> = ({
  services,
  zones,
  settings,
  bookings,
  shadowProfiles,
  onExit,
  onOpenSpecs,
}) => {
  // Tabs: 'schedule' | 'requests' | 'crm' | 'services' | 'zones' | 'workload' | 'qr'
  const [activeTab, setActiveTab] = useState<'schedule' | 'requests' | 'crm' | 'services' | 'zones' | 'workload' | 'qr'>('schedule');

  // Selected date filter for schedule
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const [selectedScheduleDate, setSelectedScheduleDate] = useState<string>(todayStr);

  // Selected booking for payment modal
  const [paymentModalBooking, setPaymentModalBooking] = useState<Booking | null>(null);
  const [payMethod, setPayMethod] = useState<PaymentMethod>('cash');
  const [payRef, setPayRef] = useState<string>('');
  const [tipAmt, setTipAmt] = useState<number>(0);

  // Selected client for CRM private note edit
  const [editingProfile, setEditingProfile] = useState<ClientShadowProfile | null>(null);
  const [profileNotes, setProfileNotes] = useState<string>('');
  const [profileHairPref, setProfileHairPref] = useState<string>('');
  const [profileIsVip, setProfileIsVip] = useState<boolean>(false);

  // Simulated notification toast/modal
  const [smsPreview, setSmsPreview] = useState<{ phone: string; text: string } | null>(null);

  // New service modal state
  const [isAddingService, setIsAddingService] = useState<boolean>(false);
  const [newServiceName, setNewServiceName] = useState<string>('');
  const [newServiceCategory, setNewServiceCategory] = useState<any>('Haircut & Styling');
  const [newServicePrice, setNewServicePrice] = useState<number>(300);
  const [newServiceDuration, setNewServiceDuration] = useState<number>(45);
  const [newServiceDesc, setNewServiceDesc] = useState<string>('');

  // Editable settings state
  const [editCap, setEditCap] = useState<number>(settings.dailyBookingCap);
  const [editBuffer, setEditBuffer] = useState<number>(settings.travelBufferMinutes);
  const [editOpen, setEditOpen] = useState<string>(settings.openingTime);
  const [editClose, setEditClose] = useState<string>(settings.closingTime);
  const [settingsSaved, setSettingsSaved] = useState<boolean>(false);

  // Filtering
  const pendingRequests = useMemo(() => {
    return bookings.filter((b) => b.status === 'pending');
  }, [bookings]);

  const scheduleBookings = useMemo(() => {
    return bookings
      .filter((b) => b.bookingDate === selectedScheduleDate && b.status !== 'cancelled')
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  }, [bookings, selectedScheduleDate]);

  // Statistics
  const stats = useMemo(() => {
    const todayBookings = bookings.filter((b) => b.bookingDate === todayStr);
    const completed = bookings.filter((b) => b.status === 'completed');
    const cancelled = bookings.filter((b) => b.status === 'cancelled');
    const noShows = bookings.filter((b) => b.status === 'no_show');

    const todayEarnings = todayBookings
      .filter((b) => b.status === 'completed')
      .reduce((sum, b) => sum + b.totalAmount + (b.tipAmount || 0), 0);

    const totalRevenue = completed.reduce((sum, b) => sum + b.totalAmount + (b.tipAmount || 0), 0);
    const cancelRate = bookings.length > 0 ? Math.round((cancelled.length / bookings.length) * 100) : 0;
    const noShowRate = bookings.length > 0 ? Math.round((noShows.length / bookings.length) * 100) : 0;

    return {
      todayCount: todayBookings.length,
      pendingCount: pendingRequests.length,
      todayEarnings,
      totalRevenue,
      completedCount: completed.length,
      cancelRate,
      noShowRate,
    };
  }, [bookings, todayStr, pendingRequests]);

  // Status Action Handler
  const handleStatusChange = async (booking: Booking, newStatus: BookingStatus) => {
    await bookingStore.updateBookingStatus(booking.id, newStatus, undefined, 'provider');
    
    // Trigger automated SMS preview
    if (newStatus === 'confirmed') {
      const text = generateGuestSmsNotification('confirmed', { ...booking, status: newStatus });
      setSmsPreview({ phone: booking.guestPhone, text });
    }
  };

  const handleOpenPayment = (booking: Booking) => {
    setPaymentModalBooking(booking);
    setPayMethod(booking.paymentMethod || 'cash');
    setPayRef(booking.paymentReference || '');
    setTipAmt(booking.tipAmount || 0);
  };

  const handleSavePayment = async () => {
    if (!paymentModalBooking) return;
    await bookingStore.updatePayment(
      paymentModalBooking.id,
      'paid',
      payMethod,
      payRef,
      Number(tipAmt) || 0
    );
    // Also mark as completed if not yet
    if (paymentModalBooking.status !== 'completed') {
      await bookingStore.updateBookingStatus(paymentModalBooking.id, 'completed', undefined, 'provider');
    }
    setPaymentModalBooking(null);
  };

  const handleSaveProfileNotes = () => {
    if (!editingProfile) return;
    bookingStore.updateShadowProfileDetails(editingProfile.id, {
      privateNotes: profileNotes,
      hairPreferences: profileHairPref,
      isVip: profileIsVip,
    });
    setEditingProfile(null);
  };

  const handleSaveWorkloadSettings = () => {
    bookingStore.updateSettings({
      ...settings,
      dailyBookingCap: Number(editCap),
      travelBufferMinutes: Number(editBuffer),
      openingTime: editOpen,
      closingTime: editClose,
    });
    setSettingsSaved(true);
    setTimeout(() => setSettingsSaved(false), 2000);
  };

  const handleCreateService = () => {
    if (!newServiceName.trim()) return;
    const newS: Service = {
      id: `srv-${Date.now()}`,
      name: newServiceName.trim(),
      category: newServiceCategory,
      basePrice: Number(newServicePrice),
      durationMinutes: Number(newServiceDuration),
      description: newServiceDesc.trim(),
      isActive: true,
    };
    bookingStore.addService(newS);
    setIsAddingService(false);
    setNewServiceName('');
    setNewServiceDesc('');
  };

  const appUrl = typeof window !== 'undefined' ? window.location.origin : 'https://nellygo.app';
  const qrSvg = generateQrSvgUrl(appUrl, 240);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col">
      {/* Top Admin Bar */}
      <div className="bg-slate-950 border-b border-slate-800 px-4 sm:px-8 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-amber-500 text-slate-950 flex items-center justify-center font-black">
            <Scissors className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-base text-white tracking-wide">
                NellyGo Provider Portal
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                Live Admin Mode
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Provider: <span className="text-amber-400 font-semibold">{settings.providerName}</span> • Base: Baybayin, Los Baños
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenSpecs}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 transition flex items-center gap-1.5"
          >
            <FileText className="w-3.5 h-3.5 text-amber-400" />
            <span>Architecture Specs</span>
          </button>

          <button
            onClick={onExit}
            className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 transition flex items-center gap-1.5"
          >
            <ChevronRight className="w-3.5 h-3.5" />
            <span>Switch to Guest View</span>
          </button>
        </div>
      </div>

      {/* KPI Overview Cards */}
      <div className="max-w-7xl w-full mx-auto px-4 sm:px-8 py-6">
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
          <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-3.5 sm:p-4">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Today's Visits</span>
            <div className="text-2xl sm:text-3xl font-black text-white mt-1">{stats.todayCount}</div>
            <span className="text-[10px] text-slate-400 mt-1 block">Max capacity: {settings.dailyBookingCap}/day</span>
          </div>

          <div className="bg-slate-800/80 border border-amber-500/40 rounded-xl p-3.5 sm:p-4 relative overflow-hidden">
            <span className="text-[11px] font-semibold text-amber-300 uppercase tracking-wider block">Pending Requests</span>
            <div className="text-2xl sm:text-3xl font-black text-amber-400 mt-1">{stats.pendingCount}</div>
            <span className="text-[10px] text-amber-200/70 mt-1 block">Action required</span>
          </div>

          <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-3.5 sm:p-4">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Today's Revenue</span>
            <div className="text-2xl sm:text-3xl font-black text-emerald-400 mt-1">₱{stats.todayEarnings}</div>
            <span className="text-[10px] text-slate-400 mt-1 block">Completed appointments</span>
          </div>

          <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-3.5 sm:p-4">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Completed Jobs</span>
            <div className="text-2xl sm:text-3xl font-black text-white mt-1">{stats.completedCount}</div>
            <span className="text-[10px] text-slate-400 mt-1 block">Total lifetime visits</span>
          </div>

          <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-3.5 sm:p-4 col-span-2 lg:col-span-1">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Reliability Metrics</span>
            <div className="flex items-center gap-3 mt-1">
              <div>
                <span className="text-xs text-slate-400 block">Cancel:</span>
                <span className="font-bold text-amber-400 text-sm">{stats.cancelRate}%</span>
              </div>
              <div className="border-l border-slate-700 pl-3">
                <span className="text-xs text-slate-400 block">No-Show:</span>
                <span className="font-bold text-rose-400 text-sm">{stats.noShowRate}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 sm:gap-2 mt-6 border-b border-slate-800 overflow-x-auto pb-1 text-xs sm:text-sm font-semibold">
          <button
            onClick={() => setActiveTab('schedule')}
            className={`px-3.5 py-2.5 rounded-t-lg transition flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'schedule'
                ? 'bg-amber-500 text-slate-950 font-bold'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Today's Schedule &amp; Agenda</span>
            {scheduleBookings.length > 0 && (
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${activeTab === 'schedule' ? 'bg-slate-900 text-white' : 'bg-slate-700 text-slate-300'}`}>
                {scheduleBookings.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('requests')}
            className={`px-3.5 py-2.5 rounded-t-lg transition flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'requests'
                ? 'bg-amber-500 text-slate-950 font-bold'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Bell className="w-4 h-4" />
            <span>Pending Requests</span>
            {pendingRequests.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-400 text-slate-950">
                {pendingRequests.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('crm')}
            className={`px-3.5 py-2.5 rounded-t-lg transition flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'crm'
                ? 'bg-amber-500 text-slate-950 font-bold'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Guest CRM (Shadow Profiles)</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-slate-700 text-slate-300">
              {shadowProfiles.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('services')}
            className={`px-3.5 py-2.5 rounded-t-lg transition flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'services'
                ? 'bg-amber-500 text-slate-950 font-bold'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Scissors className="w-4 h-4" />
            <span>Services &amp; Pricing</span>
          </button>

          <button
            onClick={() => setActiveTab('zones')}
            className={`px-3.5 py-2.5 rounded-t-lg transition flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'zones'
                ? 'bg-amber-500 text-slate-950 font-bold'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Car className="w-4 h-4" />
            <span>Service Zones (Los Baños)</span>
          </button>

          <button
            onClick={() => setActiveTab('workload')}
            className={`px-3.5 py-2.5 rounded-t-lg transition flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'workload'
                ? 'bg-amber-500 text-slate-950 font-bold'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <SettingsIcon className="w-4 h-4" />
            <span>Workload &amp; Hours</span>
          </button>

          <button
            onClick={() => setActiveTab('qr')}
            className={`px-3.5 py-2.5 rounded-t-lg transition flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'qr'
                ? 'bg-amber-500 text-slate-950 font-bold'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <QrCode className="w-4 h-4" />
            <span>QR Flyer Generator</span>
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="mt-6">
          {/* TAB 1: SCHEDULE & DISPATCH TIMELINE */}
          {activeTab === 'schedule' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-800/40 p-4 rounded-xl border border-slate-800">
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-amber-400" />
                  <div>
                    <h3 className="text-sm font-bold text-white">Daily Dispatch Timeline</h3>
                    <p className="text-xs text-slate-400">
                      Showing appointments &amp; transit buffer for{' '}
                      <span className="text-amber-400 font-semibold">{formatDisplayDate(selectedScheduleDate)}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    value={selectedScheduleDate}
                    onChange={(e) => setSelectedScheduleDate(e.target.value)}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-xs font-semibold text-white focus:outline-hidden"
                  />
                  <button
                    onClick={() => setSelectedScheduleDate(todayStr)}
                    className="px-2.5 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-xs text-white font-medium"
                  >
                    Today
                  </button>
                </div>
              </div>

              {scheduleBookings.length === 0 ? (
                <div className="p-12 text-center bg-slate-800/30 rounded-2xl border border-slate-800 text-slate-400 space-y-2">
                  <Calendar className="w-8 h-8 mx-auto text-slate-500" />
                  <p className="text-sm font-semibold">No appointments scheduled for this date.</p>
                  <p className="text-xs text-slate-500">New bookings from guests will appear here automatically.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {scheduleBookings.map((b, idx) => {
                    const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                      `${b.address}, ${b.barangay}, Los Baños, Laguna`
                    )}`;

                    return (
                      <div
                        key={b.id}
                        className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 hover:border-slate-600 transition"
                      >
                        {/* Time & Client Info */}
                        <div className="space-y-2 max-w-xl">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="px-2.5 py-1 rounded-md bg-amber-500 text-slate-950 text-xs font-mono font-black">
                              {formatDisplayTime(b.startTime)} – {formatDisplayTime(b.endTime)}
                            </span>
                            <span className="text-xs font-mono text-slate-400">REF: {b.referenceId}</span>
                            <span
                              className={`text-[11px] font-bold px-2 py-0.5 rounded-full uppercase ${
                                b.status === 'confirmed'
                                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                  : b.status === 'in_progress'
                                  ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30 animate-pulse'
                                  : b.status === 'completed'
                                  ? 'bg-slate-700 text-slate-300'
                                  : 'bg-amber-500/20 text-amber-300'
                              }`}
                            >
                              {b.status.replace('_', ' ')}
                            </span>
                            <span className="text-[11px] text-slate-400">
                              ({b.totalDurationMinutes} mins + {settings.travelBufferMinutes}m buffer)
                            </span>
                          </div>

                          <div>
                            <h4 className="text-base font-bold text-white flex items-center gap-2">
                              <span>{b.guestName}</span>
                              <a
                                href={`tel:${b.guestPhone}`}
                                className="text-xs text-amber-400 hover:underline flex items-center gap-1 font-mono font-normal"
                              >
                                <Phone className="w-3 h-3" /> {b.guestPhone}
                              </a>
                            </h4>
                            <p className="text-xs text-slate-300 font-medium">
                              Services: <span className="text-white">{b.serviceNames.join(', ')}</span>
                            </p>
                          </div>

                          {/* Address & Navigation */}
                          <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-xs text-slate-300 pt-1">
                            <div className="flex items-center gap-1.5 text-amber-400 font-semibold">
                              <MapPin className="w-3.5 h-3.5 shrink-0" />
                              <span>{b.barangay}:</span>
                            </div>
                            <span className="text-slate-200">{b.address}</span>
                            {b.landmark && (
                              <span className="text-slate-400 italic">({b.landmark})</span>
                            )}
                            <a
                              href={googleMapsUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-[11px] text-amber-400 hover:text-amber-300 font-bold bg-amber-500/10 px-2 py-0.5 rounded-sm shrink-0"
                            >
                              <Navigation className="w-3 h-3" />
                              <span>Maps Directions</span>
                            </a>
                          </div>

                          {b.notes && (
                            <div className="p-2 bg-slate-900/60 rounded-lg text-xs text-slate-400">
                              <span className="text-slate-300 font-semibold">Client request:</span> {b.notes}
                            </div>
                          )}
                        </div>

                        {/* Financials & Quick Action Buttons */}
                        <div className="flex flex-col sm:flex-row lg:flex-col items-start lg:items-end justify-between gap-3 border-t lg:border-t-0 pt-3 lg:pt-0 border-slate-700">
                          <div className="text-left lg:text-right">
                            <div className="text-xs text-slate-400">Total Payable:</div>
                            <div className="text-xl font-black text-amber-400">
                              ₱{b.totalAmount.toLocaleString()}
                            </div>
                            <span
                              className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded-sm ${
                                b.paymentStatus === 'paid'
                                  ? 'bg-emerald-500/20 text-emerald-300'
                                  : 'bg-amber-500/20 text-amber-300'
                              }`}
                            >
                              {b.paymentStatus === 'paid'
                                ? `Paid (${b.paymentMethod}) ${b.tipAmount ? `+₱${b.tipAmount} tip` : ''}`
                                : 'Payment Due'}
                            </span>
                          </div>

                          {/* Quick Lifecycle Controls */}
                          <div className="flex flex-wrap items-center gap-1.5">
                            {b.status === 'pending' && (
                              <button
                                onClick={() => handleStatusChange(b, 'confirmed')}
                                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center gap-1"
                              >
                                <Check className="w-3.5 h-3.5" />
                                <span>Approve</span>
                              </button>
                            )}

                            {b.status === 'confirmed' && (
                              <button
                                onClick={() => handleStatusChange(b, 'in_progress')}
                                className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition flex items-center gap-1"
                              >
                                <Sparkles className="w-3.5 h-3.5" />
                                <span>Start Service</span>
                              </button>
                            )}

                            {(b.status === 'in_progress' || (b.status === 'confirmed' && b.paymentStatus !== 'paid')) && (
                              <button
                                onClick={() => handleOpenPayment(b)}
                                className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition flex items-center gap-1"
                              >
                                <DollarSign className="w-3.5 h-3.5" />
                                <span>Collect &amp; Complete</span>
                              </button>
                            )}

                            {b.status !== 'completed' && (
                              <button
                                onClick={() => handleStatusChange(b, 'no_show')}
                                title="Mark as No-Show"
                                className="px-2.5 py-1.5 rounded-lg bg-slate-700 hover:bg-rose-900/60 text-slate-300 hover:text-rose-200 text-xs font-medium transition"
                              >
                                No-Show
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: PENDING REQUESTS INBOX */}
          {activeTab === 'requests' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-white">Pending Guest Requests</h3>
                  <p className="text-xs text-slate-400">Review newly submitted home-service bookings requiring your confirmation.</p>
                </div>
                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300">
                  {pendingRequests.length} Waiting
                </span>
              </div>

              {pendingRequests.length === 0 ? (
                <div className="p-12 text-center bg-slate-800/30 rounded-2xl border border-slate-800 text-slate-400">
                  <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-500 mb-2" />
                  <p className="text-sm font-semibold text-slate-300">All caught up!</p>
                  <p className="text-xs text-slate-500">There are no pending requests waiting for your approval.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {pendingRequests.map((b) => (
                    <div
                      key={b.id}
                      className="bg-slate-800 border-2 border-amber-500/40 rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4"
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded-sm bg-amber-500 text-slate-950 text-xs font-mono font-black">
                            REF: {b.referenceId}
                          </span>
                          <span className="text-xs font-semibold text-slate-300">
                            {formatDisplayDate(b.bookingDate)} at {formatDisplayTime(b.startTime)}
                          </span>
                        </div>
                        <h4 className="text-base font-bold text-white">{b.guestName} • <span className="font-mono text-amber-400 text-sm">{b.guestPhone}</span></h4>
                        <p className="text-xs text-slate-300">Services: <span className="text-white font-medium">{b.serviceNames.join(', ')}</span> ({b.totalDurationMinutes} mins)</p>
                        <p className="text-xs text-slate-400">Address: <span className="text-slate-200">{b.address}, {b.barangay}</span></p>
                        {b.notes && <p className="text-xs text-amber-200/90 italic">Notes: "{b.notes}"</p>}
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <div className="text-lg font-black text-amber-400">₱{b.totalAmount}</div>
                          <span className="text-[10px] text-slate-400">Travel fee: ₱{b.travelFee}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleStatusChange(b, 'confirmed')}
                            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition shadow-sm"
                          >
                            Approve &amp; Notify
                          </button>
                          <button
                            onClick={() => bookingStore.updateBookingStatus(b.id, 'cancelled', 'Provider schedule conflict', 'provider')}
                            className="px-3 py-2 rounded-xl bg-slate-700 hover:bg-rose-900/60 text-slate-300 hover:text-rose-200 font-semibold text-xs transition"
                          >
                            Decline
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: GUEST CRM (SHADOW PROFILES) */}
          {activeTab === 'crm' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-white">Guest CRM (Shadow Profiles)</h3>
                  <p className="text-xs text-slate-400">
                    Clients are automatically grouped by phone number composite keys without requiring accounts.
                  </p>
                </div>
                <span className="text-xs text-slate-400">{shadowProfiles.length} clients recorded</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {shadowProfiles.map((profile) => (
                  <div
                    key={profile.id}
                    className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-4 flex flex-col justify-between space-y-3 hover:border-slate-600 transition"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <h4 className="font-bold text-white text-sm">{profile.name}</h4>
                            {profile.isVip && (
                              <span className="text-[9px] font-bold bg-amber-400 text-slate-950 px-1.5 py-0.2 rounded-sm">
                                VIP
                              </span>
                            )}
                          </div>
                          <span className="text-xs font-mono text-amber-400 block">{profile.phone}</span>
                          {profile.email && <span className="text-[11px] text-slate-400 block">{profile.email}</span>}
                        </div>

                        <div className="text-right">
                          <span className="text-xs font-black text-emerald-400 block">₱{profile.totalSpent.toLocaleString()}</span>
                          <span className="text-[10px] text-slate-400">{profile.completedBookings} completed</span>
                        </div>
                      </div>

                      {/* Client Stats */}
                      <div className="grid grid-cols-3 gap-1 bg-slate-900/60 p-2 rounded-lg text-[10px] text-center text-slate-400 my-2.5">
                        <div>
                          <span className="block font-bold text-white">{profile.totalBookings}</span>
                          <span>Visits</span>
                        </div>
                        <div>
                          <span className="block font-bold text-amber-400">{profile.cancellations}</span>
                          <span>Cancels</span>
                        </div>
                        <div>
                          <span className="block font-bold text-rose-400">{profile.noShows}</span>
                          <span>No-Shows</span>
                        </div>
                      </div>

                      {/* Hair Preferences & Private Notes */}
                      {profile.hairPreferences && (
                        <div className="text-xs text-slate-300">
                          <span className="text-amber-400 font-semibold text-[11px]">Preferences:</span> {profile.hairPreferences}
                        </div>
                      )}

                      {profile.privateNotes && (
                        <div className="text-xs text-slate-400 italic bg-slate-900/40 p-2 rounded-md mt-1.5">
                          "{profile.privateNotes}"
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => {
                        setEditingProfile(profile);
                        setProfileNotes(profile.privateNotes || '');
                        setProfileHairPref(profile.hairPreferences || '');
                        setProfileIsVip(profile.isVip || false);
                      }}
                      className="w-full py-1.5 rounded-lg bg-slate-700/80 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition flex items-center justify-center gap-1.5"
                    >
                      <Edit className="w-3.5 h-3.5" />
                      <span>Edit Private Notes &amp; Preferences</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: SERVICES & PRICING */}
          {activeTab === 'services' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-white">Service &amp; Pricing Catalog</h3>
                  <p className="text-xs text-slate-400">Duration values dynamically drive slot availability calculations.</p>
                </div>
                <button
                  onClick={() => setIsAddingService(true)}
                  className="px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add New Service</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {services.map((s) => (
                  <div
                    key={s.id}
                    className="bg-slate-800/80 border border-slate-700 rounded-xl p-4 flex flex-col justify-between space-y-3"
                  >
                    <div>
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="text-[10px] uppercase font-bold text-amber-400">{s.category}</span>
                          <h4 className="text-sm font-bold text-white">{s.name}</h4>
                        </div>
                        <span className="text-sm font-black text-amber-400">₱{s.basePrice}</span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1 line-clamp-2">{s.description}</p>
                    </div>

                    <div className="pt-2 border-t border-slate-700 flex items-center justify-between text-xs text-slate-300">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-amber-400" /> {s.durationMinutes} mins
                      </span>
                      <button
                        onClick={() => {
                          bookingStore.updateService({ ...s, isActive: !s.isActive });
                        }}
                        className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                          s.isActive ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-700 text-slate-400'
                        }`}
                      >
                        {s.isActive ? 'Active' : 'Archived'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 5: SERVICE ZONES (LOS BAÑOS) */}
          {activeTab === 'zones' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-base font-bold text-white">Los Baños Coverage Zones &amp; Travel Fees</h3>
                <p className="text-xs text-slate-400">
                  Guest addresses outside active zones are blocked. Travel fees are added dynamically at checkout.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {zones.map((zone) => (
                  <div
                    key={zone.id}
                    className="bg-slate-800/80 border border-slate-700 rounded-xl p-4 flex flex-col justify-between space-y-2"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sm text-white">{zone.barangay}</span>
                        <span className="font-bold text-amber-400 text-xs">
                          {zone.travelFee === 0 ? 'FREE' : `+₱${zone.travelFee}`}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1">{zone.notes}</p>
                    </div>

                    <div className="pt-2 border-t border-slate-700 flex items-center justify-between text-xs">
                      <span className="text-slate-400">~{zone.estimatedTransitMinutes} mins transit</span>
                      <button
                        onClick={() => bookingStore.updateZone({ ...zone, isActive: !zone.isActive })}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          zone.isActive ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-700 text-slate-400'
                        }`}
                      >
                        {zone.isActive ? 'Service Active' : 'Suspended'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 6: WORKLOAD & HOURS */}
          {activeTab === 'workload' && (
            <div className="max-w-2xl bg-slate-800/80 border border-slate-700 rounded-2xl p-5 space-y-5">
              <div>
                <h3 className="text-base font-bold text-white">Workload Protection &amp; Operating Hours</h3>
                <p className="text-xs text-slate-400">Protects Generisa Soriano from daily exhaustion, travel fatigue, and burnout.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-300 mb-1">Daily Booking Limit (Cap)</label>
                  <input
                    type="number"
                    min={1}
                    max={12}
                    value={editCap}
                    onChange={(e) => setEditCap(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white font-bold"
                  />
                  <span className="text-[10px] text-slate-400">Default: 5 home-visits max per day</span>
                </div>

                <div>
                  <label className="block font-bold text-slate-300 mb-1">Travel Buffer Between Visits (mins)</label>
                  <input
                    type="number"
                    min={10}
                    max={90}
                    step={5}
                    value={editBuffer}
                    onChange={(e) => setEditBuffer(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white font-bold"
                  />
                  <span className="text-[10px] text-slate-400">Buffer for motorcycle transit &amp; sanitization</span>
                </div>

                <div>
                  <label className="block font-bold text-slate-300 mb-1">Opening Time</label>
                  <input
                    type="time"
                    value={editOpen}
                    onChange={(e) => setEditOpen(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-300 mb-1">Closing Time</label>
                  <input
                    type="time"
                    value={editClose}
                    onChange={(e) => setEditClose(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white font-bold"
                  />
                </div>
              </div>

              <div className="p-3 bg-slate-900/60 rounded-xl text-xs space-y-1">
                <span className="font-bold text-amber-400">Designated Rest Days:</span>
                <p className="text-slate-300">Every <span className="font-bold text-white">Monday</span> (Automatically blocks slot generation on guest checkout).</p>
              </div>

              <div className="flex items-center justify-between pt-2">
                {settingsSaved ? (
                  <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" /> Settings updated successfully!
                  </span>
                ) : <div></div>}
                <button
                  onClick={handleSaveWorkloadSettings}
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition"
                >
                  Save Workload Parameters
                </button>
              </div>
            </div>
          )}

          {/* TAB 7: QR CODE FLYER */}
          {activeTab === 'qr' && (
            <div className="max-w-xl mx-auto space-y-4 text-center">
              <div className="bg-white text-slate-900 p-8 rounded-3xl shadow-2xl border-4 border-amber-500 max-w-sm mx-auto space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-amber-600 text-white flex items-center justify-center mx-auto shadow-md">
                  <Scissors className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-2xl font-black tracking-tight text-slate-900">
                    Nelly<span className="text-amber-600">Go</span>
                  </h3>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Home-Service Salon &amp; Barbershop
                  </p>
                  <p className="text-xs text-amber-700 font-semibold mt-0.5">
                    Generisa Soriano • Los Baños, Laguna
                  </p>
                </div>

                {/* QR Image */}
                <div className="p-3 bg-slate-50 border-2 border-dashed border-amber-300 rounded-2xl inline-block">
                  <img src={qrSvg} alt="NellyGo QR" className="w-48 h-48 mx-auto" />
                </div>

                <div className="space-y-1">
                  <p className="text-xs font-bold text-slate-800">
                    Scan with any phone camera to book
                  </p>
                  <p className="text-[11px] text-slate-500">
                    No app download • No login required • Direct booking
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-200 text-[11px] font-mono font-bold text-slate-600">
                  Hotline: 0917-849-2041
                </div>
              </div>

              <p className="text-xs text-slate-400">
                Print this card and place on mirrors, business cards, or send via Messenger to clients!
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Payment Collection Modal */}
      {paymentModalBooking && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5 max-w-md w-full space-y-4">
            <div className="flex items-center justify-between border-b border-slate-700 pb-3">
              <h3 className="font-bold text-white text-base">Record Payment &amp; Complete</h3>
              <button onClick={() => setPaymentModalBooking(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-900/60 p-3 rounded-xl text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-400">Guest:</span>
                <span className="font-bold text-white">{paymentModalBooking.guestName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Services Total + Travel:</span>
                <span className="font-black text-amber-400 text-sm">₱{paymentModalBooking.totalAmount}</span>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-300 mb-1">Payment Method</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPayMethod('cash')}
                    className={`py-2 rounded-lg font-bold border transition ${
                      payMethod === 'cash' ? 'bg-amber-500 text-slate-950 border-amber-500' : 'bg-slate-900 border-slate-700 text-slate-300'
                    }`}
                  >
                    Cash
                  </button>
                  <button
                    type="button"
                    onClick={() => setPayMethod('gcash')}
                    className={`py-2 rounded-lg font-bold border transition ${
                      payMethod === 'gcash' ? 'bg-amber-500 text-slate-950 border-amber-500' : 'bg-slate-900 border-slate-700 text-slate-300'
                    }`}
                  >
                    GCash / Transfer
                  </button>
                </div>
              </div>

              {payMethod === 'gcash' && (
                <div>
                  <label className="block font-bold text-slate-300 mb-1">GCash Reference No.</label>
                  <input
                    type="text"
                    placeholder="e.g. 9018247192"
                    value={payRef}
                    onChange={(e) => setPayRef(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono"
                  />
                </div>
              )}

              <div>
                <label className="block font-bold text-slate-300 mb-1">Tip Amount (Optional)</label>
                <input
                  type="number"
                  placeholder="₱0"
                  value={tipAmt}
                  onChange={(e) => setTipAmt(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white font-bold"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setPaymentModalBooking(null)}
                className="px-3.5 py-2 rounded-lg text-xs font-semibold text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleSavePayment}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs"
              >
                Confirm Paid &amp; Finish Job
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Shadow Profile Notes Modal */}
      {editingProfile && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5 max-w-md w-full space-y-4">
            <div className="flex items-center justify-between border-b border-slate-700 pb-3">
              <div>
                <h3 className="font-bold text-white text-base">Client CRM: {editingProfile.name}</h3>
                <span className="text-xs text-amber-400 font-mono">{editingProfile.phone}</span>
              </div>
              <button onClick={() => setEditingProfile(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-300 mb-1">Hair Preferences &amp; Specs</label>
                <textarea
                  rows={2}
                  value={profileHairPref}
                  onChange={(e) => setProfileHairPref(e.target.value)}
                  placeholder="e.g. #1.5 clipper guard on sides, zero taper on neck, coarse hair texture..."
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">Private Provider Notes</label>
                <textarea
                  rows={2}
                  value={profileNotes}
                  onChange={(e) => setProfileNotes(e.target.value)}
                  placeholder="e.g. Ring bell loudly, friendly dog, always gives ₱50 tip..."
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white"
                />
              </div>

              <label className="flex items-center gap-2 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={profileIsVip}
                  onChange={(e) => setProfileIsVip(e.target.checked)}
                  className="w-4 h-4 accent-amber-500 rounded"
                />
                <span className="font-bold text-amber-300">Mark as VIP Client</span>
              </label>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setEditingProfile(null)}
                className="px-3.5 py-2 rounded-lg text-xs font-semibold text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveProfileNotes}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs"
              >
                Save Client Notes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Service Modal */}
      {isAddingService && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5 max-w-md w-full space-y-4">
            <div className="flex items-center justify-between border-b border-slate-700 pb-3">
              <h3 className="font-bold text-white text-base">Add New Salon / Barbershop Service</h3>
              <button onClick={() => setIsAddingService(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-300 mb-1">Service Name</label>
                <input
                  type="text"
                  placeholder="e.g. Beard Trimming &amp; Styling"
                  value={newServiceName}
                  onChange={(e) => setNewServiceName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-300 mb-1">Base Price (₱)</label>
                  <input
                    type="number"
                    value={newServicePrice}
                    onChange={(e) => setNewServicePrice(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-300 mb-1">Duration (Minutes)</label>
                  <input
                    type="number"
                    value={newServiceDuration}
                    onChange={(e) => setNewServiceDuration(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">Category</label>
                <select
                  value={newServiceCategory}
                  onChange={(e) => setNewServiceCategory(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white"
                >
                  <option value="Haircut & Styling">Haircut &amp; Styling</option>
                  <option value="Hair Treatments">Hair Treatments</option>
                  <option value="Grooming & Shave">Grooming &amp; Shave</option>
                  <option value="Spa & Nails">Spa &amp; Nails</option>
                  <option value="Bundles">Bundles</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">Description</label>
                <textarea
                  rows={2}
                  placeholder="Brief service description..."
                  value={newServiceDesc}
                  onChange={(e) => setNewServiceDesc(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setIsAddingService(false)}
                className="px-3.5 py-2 rounded-lg text-xs font-semibold text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateService}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs"
              >
                Create Service
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Simulated Notification Toast */}
      {smsPreview && (
        <div className="fixed bottom-4 right-4 z-50 max-w-sm w-full bg-slate-950 border-2 border-emerald-500 rounded-2xl p-4 shadow-2xl animate-in slide-in-from-bottom duration-300">
          <div className="flex items-center justify-between text-xs text-emerald-400 font-bold mb-1">
            <span className="flex items-center gap-1.5">
              <MessageSquare className="w-4 h-4" /> SMS Sent (Semaphore / Twilio)
            </span>
            <button onClick={() => setSmsPreview(null)} className="text-slate-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
          <p className="text-[11px] font-mono text-slate-300 bg-slate-900 p-2.5 rounded-lg border border-slate-800">
            {smsPreview.text}
          </p>
          <div className="mt-2 text-right">
            <span className="text-[10px] text-slate-500">Delivered to {smsPreview.phone}</span>
          </div>
        </div>
      )}
    </div>
  );
};
