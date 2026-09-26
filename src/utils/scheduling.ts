import { Booking, BusinessSettings, TimeSlot } from '../types';

/**
 * Converts "HH:mm" 24h string to minutes from midnight
 */
export function timeToMinutes(timeStr: string): number {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return (hours || 0) * 60 + (minutes || 0);
}

/**
 * Converts minutes from midnight to "HH:mm" 24h string
 */
export function minutesToTime(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

/**
 * Formats "HH:mm" string to human-readable "h:mm A" (e.g., "09:30" -> "9:30 AM")
 */
export function formatDisplayTime(timeStr: string): string {
  if (!timeStr) return '';
  const [h, m] = timeStr.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const displayHour = h % 12 === 0 ? 12 : h % 12;
  return `${displayHour}:${String(m).padStart(2, '0')} ${period}`;
}

/**
 * Formats YYYY-MM-DD to friendly string (e.g. "Saturday, Sep 26, 2026")
 */
export function formatDisplayDate(dateStr: string): string {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Generates an alphanumeric 6-character Reference ID prefixed with "NG-"
 * Excludes ambiguous characters (0, O, 1, I)
 */
export function generateReferenceId(): string {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let result = 'NG-';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Checks if client is within cancellation/rescheduling cutoff (e.g. 24h before appointment)
 */
export function canManageBooking(bookingDate: string, startTime: string, minHours: number = 24): {
  allowed: boolean;
  hoursRemaining: number;
} {
  try {
    const [year, month, day] = bookingDate.split('-').map(Number);
    const [hours, minutes] = startTime.split(':').map(Number);
    const appointmentTime = new Date(year, month - 1, day, hours, minutes).getTime();
    const now = Date.now();
    const diffMs = appointmentTime - now;
    const hoursRemaining = Math.round(diffMs / (1000 * 60 * 60) * 10) / 10;
    return {
      allowed: hoursRemaining >= minHours,
      hoursRemaining,
    };
  } catch {
    return { allowed: false, hoursRemaining: 0 };
  }
}

export interface SlotAvailabilityResult {
  slots: TimeSlot[];
  isRestDay: boolean;
  isBlockedDate: boolean;
  isCapacityExceeded: boolean;
  activeBookingCount: number;
  maxDailyCapacity: number;
  message?: string;
}

/**
 * CORE BUSINESS LOGIC: Slot Availability Calculation Algorithm
 * Prevents overlapping bookings, ensures travel buffer windows, respects daily caps & operating hours.
 */
export function calculateAvailableSlots(
  targetDate: string,
  totalServiceDurationMinutes: number,
  settings: BusinessSettings,
  bookingsForDay: Booking[]
): SlotAvailabilityResult {
  const [year, month, day] = targetDate.split('-').map(Number);
  const targetDateObj = new Date(year, month - 1, day);
  const dayOfWeek = targetDateObj.getDay(); // 0 is Sunday, 1 is Monday...

  // 1. Check Rest Day
  if (settings.restDays.includes(dayOfWeek)) {
    return {
      slots: [],
      isRestDay: true,
      isBlockedDate: false,
      isCapacityExceeded: false,
      activeBookingCount: 0,
      maxDailyCapacity: settings.dailyBookingCap,
      message: `${targetDateObj.toLocaleDateString('en-US', { weekday: 'long' })} is a designated rest day for Generisa Soriano to maintain high service quality.`,
    };
  }

  // 2. Check Blocked Holiday Dates
  if (settings.blockedDates.includes(targetDate)) {
    return {
      slots: [],
      isRestDay: false,
      isBlockedDate: true,
      isCapacityExceeded: false,
      activeBookingCount: 0,
      maxDailyCapacity: settings.dailyBookingCap,
      message: 'This date is marked as unavailable/holiday for home-service bookings.',
    };
  }

  // 3. Filter active bookings (exclude cancelled or no_show)
  const activeBookings = bookingsForDay.filter(
    (b) => b.status === 'confirmed' || b.status === 'pending' || b.status === 'in_progress' || b.status === 'completed'
  );

  // 4. Check Daily Workload Cap
  if (activeBookings.length >= settings.dailyBookingCap) {
    return {
      slots: [],
      isRestDay: false,
      isBlockedDate: false,
      isCapacityExceeded: true,
      activeBookingCount: activeBookings.length,
      maxDailyCapacity: settings.dailyBookingCap,
      message: `Generisa's daily workload limit (${settings.dailyBookingCap} home visits max) is fully reached for this date to prevent provider fatigue and ensure thorough service for every client.`,
    };
  }

  // 5. Generate slots across operating hours
  const openMinutes = timeToMinutes(settings.openingTime);
  const closeMinutes = timeToMinutes(settings.closingTime);
  const bufferMinutes = settings.travelBufferMinutes;
  const stepMinutes = 30; // 30-minute intervals

  const slots: TimeSlot[] = [];
  const now = new Date();
  const isToday =
    now.getFullYear() === year && now.getMonth() === month - 1 && now.getDate() === day;
  const currentMinutesToday = now.getHours() * 60 + now.getMinutes();

  for (let startM = openMinutes; startM + totalServiceDurationMinutes <= closeMinutes; startM += stepMinutes) {
    const endM = startM + totalServiceDurationMinutes;
    const timeStr = minutesToTime(startM);
    const endTimeStr = minutesToTime(endM);

    // Rule A: Past time check for today (allow at least 90 minutes lead notice)
    if (isToday && startM < currentMinutesToday + 90) {
      slots.push({
        time: timeStr,
        displayTime: formatDisplayTime(timeStr),
        endTime: endTimeStr,
        displayEndTime: formatDisplayTime(endTimeStr),
        available: false,
        reason: 'past_time',
      });
      continue;
    }

    // Rule B: Overlap and travel buffer conflict check
    // Proposed candidate window: [startM, endM]
    // An existing booking occupies: [bStart, bEnd]
    // To allow safe motorcycle/transit across Los Baños barangays and sanitize equipment,
    // the provider needs travelBufferMinutes before and after.
    let conflict = false;
    let conflictRef = '';
    let conflictReason: 'booked' | 'travel_buffer' | undefined;

    for (const b of activeBookings) {
      const bStart = timeToMinutes(b.startTime);
      const bEnd = timeToMinutes(b.endTime);

      // Direct booking overlap
      const hasDirectOverlap = startM < bEnd && endM > bStart;
      if (hasDirectOverlap) {
        conflict = true;
        conflictRef = b.referenceId;
        conflictReason = 'booked';
        break;
      }

      // Travel buffer window overlap:
      // If proposed appointment finishes after bStart - buffer AND starts before bEnd + buffer
      const protectedWindowStart = Math.max(openMinutes, bStart - bufferMinutes);
      const protectedWindowEnd = Math.min(closeMinutes, bEnd + bufferMinutes);

      const hasBufferOverlap = startM < protectedWindowEnd && endM > protectedWindowStart;
      if (hasBufferOverlap) {
        conflict = true;
        conflictRef = b.referenceId;
        conflictReason = 'travel_buffer';
        break;
      }
    }

    slots.push({
      time: timeStr,
      displayTime: formatDisplayTime(timeStr),
      endTime: endTimeStr,
      displayEndTime: formatDisplayTime(endTimeStr),
      available: !conflict,
      reason: conflict ? conflictReason : undefined,
      conflictingBookingRef: conflictRef || undefined,
    });
  }

  return {
    slots,
    isRestDay: false,
    isBlockedDate: false,
    isCapacityExceeded: false,
    activeBookingCount: activeBookings.length,
    maxDailyCapacity: settings.dailyBookingCap,
  };
}

/**
 * Generates sample SMS notification template for guest
 */
export function generateGuestSmsNotification(
  type: 'submitted' | 'confirmed' | 'rescheduled' | 'cancelled' | 'reminder_24h',
  booking: Booking,
  businessName: string = "Nelly's Salon / Barbershop"
): string {
  const shortDate = formatDisplayDate(booking.bookingDate);
  const startTime = formatDisplayTime(booking.startTime);

  switch (type) {
    case 'submitted':
      return `[${businessName}] Hi ${booking.guestName}! Your home-service booking request (${booking.referenceId}) for ${shortDate} at ${startTime} has been received. Generisa is reviewing your schedule. Track at: nellygo.app/track?ref=${booking.referenceId}`;
    case 'confirmed':
      return `[${businessName}] Great news, ${booking.guestName}! Your home-service appointment (${booking.referenceId}) on ${shortDate} at ${startTime} is CONFIRMED. Total: ₱${booking.totalAmount}. Generisa will arrive at ${booking.barangay}. See you!`;
    case 'rescheduled':
      return `[${businessName}] Notice: Your appointment (${booking.referenceId}) has been updated to ${shortDate} at ${startTime}. View details: nellygo.app/track?ref=${booking.referenceId}`;
    case 'cancelled':
      return `[${businessName}] Your appointment (${booking.referenceId}) has been cancelled. Reason: ${booking.cancelReason || 'Client request'}. Contact Generisa at 0917-849-2041 for inquiries.`;
    case 'reminder_24h':
      return `[${businessName}] Reminder: Generisa will visit you tomorrow (${shortDate}) at ${startTime} at ${booking.address}, ${booking.barangay}. Please prepare a well-lit chair and electrical outlet.`;
  }
}
