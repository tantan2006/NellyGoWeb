export type BookingStatus =
  | 'pending'
  | 'confirmed'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'no_show';

export type PaymentStatus = 'unpaid' | 'paid' | 'partial';
export type PaymentMethod = 'cash' | 'gcash' | 'pending';

export interface Service {
  id: string;
  name: string;
  category: 'Haircut & Styling' | 'Hair Treatments' | 'Grooming & Shave' | 'Spa & Nails' | 'Bundles';
  description: string;
  basePrice: number; // in PHP
  durationMinutes: number;
  isActive: boolean;
  isPopular?: boolean;
}

export interface Booking {
  id: string;
  referenceId: string;
  guestName: string;
  guestPhone: string;
  guestEmail?: string;
  address: string;
  barangay: string;
  landmark?: string;
  serviceIds: string[];
  serviceNames: string[];
  totalDurationMinutes: number;
  servicesSubtotal: number;
  travelFee: number;
  totalAmount: number;
  bookingDate: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  status: BookingStatus;
  notes?: string;
  cancelReason?: string;
  cancelledBy?: 'guest' | 'provider';
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
  paymentReference?: string;
  tipAmount?: number;
  providerInternalNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ServiceZone {
  id: string;
  barangay: string;
  travelFee: number; // in PHP
  estimatedTransitMinutes: number;
  isActive: boolean;
  notes?: string;
}

export interface BusinessSettings {
  providerName: string;
  businessName: string;
  locationBase: string;
  phone: string;
  email: string;
  openingTime: string; // e.g. "08:30"
  closingTime: string; // e.g. "18:00"
  travelBufferMinutes: number; // e.g. 30
  dailyBookingCap: number; // e.g. 5
  restDays: number[]; // 0 = Sunday, 1 = Monday, etc.
  blockedDates: string[]; // YYYY-MM-DD
  minCancellationHours: number; // e.g. 24
}

export interface ClientShadowProfile {
  id: string;
  phone: string;
  email?: string;
  name: string;
  totalBookings: number;
  completedBookings: number;
  cancellations: number;
  noShows: number;
  totalSpent: number;
  privateNotes: string;
  hairPreferences: string;
  isVip: boolean;
  lastBookingDate?: string;
}

export interface TimeSlot {
  time: string; // "09:00"
  displayTime: string; // "9:00 AM"
  endTime: string; // "10:30"
  displayEndTime: string; // "10:30 AM"
  available: boolean;
  reason?: 'booked' | 'travel_buffer' | 'daily_cap' | 'outside_hours' | 'past_time' | 'rest_day';
  conflictingBookingRef?: string;
}
