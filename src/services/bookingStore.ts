import {
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  onSnapshot,
} from 'firebase/firestore';
import { db } from '../firebase';
import {
  Booking,
  Service,
  ServiceZone,
  BusinessSettings,
  ClientShadowProfile,
  BookingStatus,
  PaymentStatus,
  PaymentMethod,
} from '../types';
import {
  INITIAL_SERVICES,
  INITIAL_SERVICE_ZONES,
  INITIAL_SETTINGS,
  INITIAL_BOOKINGS,
  INITIAL_SHADOW_PROFILES,
} from '../data/initialData';
import { generateReferenceId } from '../utils/scheduling';

const STORAGE_KEYS = {
  SERVICES: 'nellygo_services_v1',
  ZONES: 'nellygo_zones_v1',
  SETTINGS: 'nellygo_settings_v1',
  BOOKINGS: 'nellygo_bookings_v1',
  PROFILES: 'nellygo_profiles_v1',
};

// Local storage fallback helpers for resilience
function loadLocal<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function saveLocal<T>(key: string, data: T) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch {
    // Ignore
  }
}

export class BookingStore {
  private static instance: BookingStore;
  private services: Service[] = loadLocal(STORAGE_KEYS.SERVICES, INITIAL_SERVICES);
  private zones: ServiceZone[] = loadLocal(STORAGE_KEYS.ZONES, INITIAL_SERVICE_ZONES);
  private settings: BusinessSettings = loadLocal(STORAGE_KEYS.SETTINGS, INITIAL_SETTINGS);
  private bookings: Booking[] = loadLocal(STORAGE_KEYS.BOOKINGS, INITIAL_BOOKINGS);
  private shadowProfiles: ClientShadowProfile[] = loadLocal(STORAGE_KEYS.PROFILES, INITIAL_SHADOW_PROFILES);

  private listeners: Array<() => void> = [];
  private isInitialized = false;

  private constructor() {
    this.initFirestoreSync().catch((err) => {
      console.warn('Firestore initialization notice (operating with local state):', err);
    });
  }

  public static getInstance(): BookingStore {
    if (!BookingStore.instance) {
      BookingStore.instance = new BookingStore();
    }
    return BookingStore.instance;
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notify() {
    this.listeners.forEach((l) => l());
  }

  private async initFirestoreSync() {
    if (this.isInitialized) return;
    this.isInitialized = true;

    try {
      // 1. Sync Services
      const servicesCol = collection(db, 'services');
      const servicesSnap = await getDocs(servicesCol);
      if (servicesSnap.empty) {
        // Seed default services
        for (const s of INITIAL_SERVICES) {
          await setDoc(doc(db, 'services', s.id), s);
        }
      } else {
        this.services = servicesSnap.docs.map((d) => d.data() as Service);
        saveLocal(STORAGE_KEYS.SERVICES, this.services);
      }

      // 2. Sync Service Zones
      const zonesCol = collection(db, 'serviceZones');
      const zonesSnap = await getDocs(zonesCol);
      if (zonesSnap.empty) {
        for (const z of INITIAL_SERVICE_ZONES) {
          await setDoc(doc(db, 'serviceZones', z.id), z);
        }
      } else {
        this.zones = zonesSnap.docs.map((d) => d.data() as ServiceZone);
        saveLocal(STORAGE_KEYS.ZONES, this.zones);
      }

      // 3. Sync Settings
      const settingsDocRef = doc(db, 'settings', 'general');
      const settingsDocSnap = await getDocs(collection(db, 'settings'));
      if (settingsDocSnap.empty) {
        await setDoc(settingsDocRef, INITIAL_SETTINGS);
      }

      // Realtime listener for bookings
      const bookingsCol = collection(db, 'bookings');
      onSnapshot(bookingsCol, (snapshot) => {
        if (!snapshot.empty) {
          const remoteBookings: Booking[] = snapshot.docs.map((d) => d.data() as Booking);
          // Merge remote with local ensuring no dropped records
          const bookingMap = new Map<string, Booking>();
          this.bookings.forEach((b) => bookingMap.set(b.id, b));
          remoteBookings.forEach((b) => bookingMap.set(b.id, b));
          this.bookings = Array.from(bookingMap.values()).sort(
            (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
          saveLocal(STORAGE_KEYS.BOOKINGS, this.bookings);
          this.rebuildShadowProfiles();
          this.notify();
        }
      });
    } catch (e) {
      console.warn('Firestore initial sync notice:', e);
    }
    this.notify();
  }

  // Getters
  public getServices(): Service[] {
    return this.services.filter((s) => s.isActive);
  }

  public getAllServices(): Service[] {
    return this.services;
  }

  public getServiceZones(): ServiceZone[] {
    return this.zones.filter((z) => z.isActive);
  }

  public getAllServiceZones(): ServiceZone[] {
    return this.zones;
  }

  public getSettings(): BusinessSettings {
    return this.settings;
  }

  public getBookings(): Booking[] {
    return this.bookings;
  }

  public getBookingsForDate(dateStr: string): Booking[] {
    return this.bookings.filter((b) => b.bookingDate === dateStr);
  }

  public getBookingByReference(refId: string, phoneOrEmail?: string): Booking | undefined {
    const cleanRef = refId.trim().toUpperCase();
    return this.bookings.find((b) => {
      const matchRef = b.referenceId.toUpperCase() === cleanRef;
      if (!matchRef) return false;
      if (!phoneOrEmail) return true;
      const cleanContact = phoneOrEmail.trim().toLowerCase();
      const phoneMatch = b.guestPhone.replace(/\D/g, '').includes(cleanContact.replace(/\D/g, ''));
      const emailMatch = b.guestEmail && b.guestEmail.toLowerCase() === cleanContact;
      return phoneMatch || emailMatch;
    });
  }

  public getShadowProfiles(): ClientShadowProfile[] {
    return this.shadowProfiles;
  }

  // Booking Actions
  public async createGuestBooking(data: Omit<Booking, 'id' | 'referenceId' | 'createdAt' | 'updatedAt' | 'paymentStatus' | 'paymentMethod'> & {
    paymentMethod?: PaymentMethod;
  }): Promise<Booking> {
    const bookingId = `b-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    const referenceId = generateReferenceId();
    const now = new Date().toISOString();

    const newBooking: Booking = {
      ...data,
      id: bookingId,
      referenceId,
      paymentStatus: 'unpaid',
      paymentMethod: data.paymentMethod || 'cash',
      createdAt: now,
      updatedAt: now,
    };

    // Update local immediately for crisp zero-latency UX
    this.bookings = [newBooking, ...this.bookings];
    saveLocal(STORAGE_KEYS.BOOKINGS, this.bookings);
    this.rebuildShadowProfiles();
    this.notify();

    // Persist to Firestore
    try {
      await setDoc(doc(db, 'bookings', bookingId), newBooking);
    } catch (err) {
      console.warn('Failed to push booking to Firestore directly, cached locally:', err);
    }

    return newBooking;
  }

  public async updateBookingStatus(
    bookingId: string,
    status: BookingStatus,
    reason?: string,
    cancelledBy?: 'guest' | 'provider'
  ): Promise<void> {
    const now = new Date().toISOString();
    this.bookings = this.bookings.map((b) => {
      if (b.id === bookingId) {
        return {
          ...b,
          status,
          cancelReason: reason || b.cancelReason,
          cancelledBy: cancelledBy || b.cancelledBy,
          updatedAt: now,
        };
      }
      return b;
    });
    saveLocal(STORAGE_KEYS.BOOKINGS, this.bookings);
    this.rebuildShadowProfiles();
    this.notify();

    try {
      const updateData: any = { status, updatedAt: now };
      if (reason) updateData.cancelReason = reason;
      if (cancelledBy) updateData.cancelledBy = cancelledBy;
      await updateDoc(doc(db, 'bookings', bookingId), updateData);
    } catch (e) {
      console.warn('Firestore update status notice:', e);
    }
  }

  public async updatePayment(
    bookingId: string,
    paymentStatus: PaymentStatus,
    paymentMethod: PaymentMethod,
    paymentReference?: string,
    tipAmount?: number
  ): Promise<void> {
    const now = new Date().toISOString();
    this.bookings = this.bookings.map((b) => {
      if (b.id === bookingId) {
        return {
          ...b,
          paymentStatus,
          paymentMethod,
          paymentReference: paymentReference || b.paymentReference,
          tipAmount: tipAmount !== undefined ? tipAmount : b.tipAmount,
          updatedAt: now,
        };
      }
      return b;
    });
    saveLocal(STORAGE_KEYS.BOOKINGS, this.bookings);
    this.rebuildShadowProfiles();
    this.notify();

    try {
      await updateDoc(doc(db, 'bookings', bookingId), {
        paymentStatus,
        paymentMethod,
        paymentReference: paymentReference || '',
        tipAmount: tipAmount || 0,
        updatedAt: now,
      });
    } catch (e) {
      console.warn('Firestore update payment notice:', e);
    }
  }

  public async rescheduleBooking(
    bookingId: string,
    newDate: string,
    newStartTime: string,
    newEndTime: string
  ): Promise<void> {
    const now = new Date().toISOString();
    this.bookings = this.bookings.map((b) => {
      if (b.id === bookingId) {
        return {
          ...b,
          bookingDate: newDate,
          startTime: newStartTime,
          endTime: newEndTime,
          status: 'confirmed', // Rescheduled confirmed
          updatedAt: now,
        };
      }
      return b;
    });
    saveLocal(STORAGE_KEYS.BOOKINGS, this.bookings);
    this.notify();

    try {
      await updateDoc(doc(db, 'bookings', bookingId), {
        bookingDate: newDate,
        startTime: newStartTime,
        endTime: newEndTime,
        status: 'confirmed',
        updatedAt: now,
      });
    } catch (e) {
      console.warn('Firestore reschedule update notice:', e);
    }
  }

  public async updateProviderNotes(bookingId: string, notes: string): Promise<void> {
    const now = new Date().toISOString();
    this.bookings = this.bookings.map((b) => (b.id === bookingId ? { ...b, providerInternalNotes: notes, updatedAt: now } : b));
    saveLocal(STORAGE_KEYS.BOOKINGS, this.bookings);
    this.notify();

    try {
      await updateDoc(doc(db, 'bookings', bookingId), {
        providerInternalNotes: notes,
        updatedAt: now,
      });
    } catch (e) {
      console.warn('Firestore note update notice:', e);
    }
  }

  // Shadow CRM Profiles Rebuilder: Groups by Phone / Email
  public rebuildShadowProfiles() {
    const profileMap = new Map<string, ClientShadowProfile>();

    // Seed existing private notes
    const existingNotesMap = new Map<string, { notes: string; hairPref: string; isVip: boolean }>();
    this.shadowProfiles.forEach((p) => {
      existingNotesMap.set(p.phone, {
        notes: p.privateNotes,
        hairPref: p.hairPreferences,
        isVip: p.isVip,
      });
    });

    this.bookings.forEach((b) => {
      const key = b.guestPhone.trim();
      const existing = profileMap.get(key);
      const isCompleted = b.status === 'completed';
      const isCancelled = b.status === 'cancelled';
      const isNoShow = b.status === 'no_show';
      const spent = isCompleted ? b.totalAmount + (b.tipAmount || 0) : 0;

      if (!existing) {
        const stored = existingNotesMap.get(key);
        profileMap.set(key, {
          id: `cp-${key}`,
          phone: key,
          email: b.guestEmail,
          name: b.guestName,
          totalBookings: 1,
          completedBookings: isCompleted ? 1 : 0,
          cancellations: isCancelled ? 1 : 0,
          noShows: isNoShow ? 1 : 0,
          totalSpent: spent,
          privateNotes: stored?.notes || (b.providerInternalNotes || ''),
          hairPreferences: stored?.hairPref || '',
          isVip: stored?.isVip || false,
          lastBookingDate: b.bookingDate,
        });
      } else {
        existing.totalBookings += 1;
        if (isCompleted) {
          existing.completedBookings += 1;
          existing.totalSpent += spent;
        }
        if (isCancelled) existing.cancellations += 1;
        if (isNoShow) existing.noShows += 1;
        if (b.bookingDate > (existing.lastBookingDate || '')) {
          existing.lastBookingDate = b.bookingDate;
        }
        if (!existing.email && b.guestEmail) existing.email = b.guestEmail;
      }
    });

    this.shadowProfiles = Array.from(profileMap.values()).sort(
      (a, b) => b.totalBookings - a.totalBookings
    );
    saveLocal(STORAGE_KEYS.PROFILES, this.shadowProfiles);
  }

  public updateShadowProfileDetails(
    profileId: string,
    updates: { privateNotes?: string; hairPreferences?: string; isVip?: boolean }
  ) {
    this.shadowProfiles = this.shadowProfiles.map((p) => {
      if (p.id === profileId) {
        return {
          ...p,
          privateNotes: updates.privateNotes !== undefined ? updates.privateNotes : p.privateNotes,
          hairPreferences: updates.hairPreferences !== undefined ? updates.hairPreferences : p.hairPreferences,
          isVip: updates.isVip !== undefined ? updates.isVip : p.isVip,
        };
      }
      return p;
    });
    saveLocal(STORAGE_KEYS.PROFILES, this.shadowProfiles);
    this.notify();
  }

  // Admin Catalog & Settings actions
  public updateService(service: Service) {
    this.services = this.services.map((s) => (s.id === service.id ? service : s));
    saveLocal(STORAGE_KEYS.SERVICES, this.services);
    this.notify();
    setDoc(doc(db, 'services', service.id), service).catch(() => {});
  }

  public addService(service: Service) {
    this.services = [...this.services, service];
    saveLocal(STORAGE_KEYS.SERVICES, this.services);
    this.notify();
    setDoc(doc(db, 'services', service.id), service).catch(() => {});
  }

  public updateZone(zone: ServiceZone) {
    this.zones = this.zones.map((z) => (z.id === zone.id ? zone : z));
    saveLocal(STORAGE_KEYS.ZONES, this.zones);
    this.notify();
    setDoc(doc(db, 'serviceZones', zone.id), zone).catch(() => {});
  }

  public updateSettings(newSettings: BusinessSettings) {
    this.settings = newSettings;
    saveLocal(STORAGE_KEYS.SETTINGS, this.settings);
    this.notify();
    setDoc(doc(db, 'settings', 'general'), newSettings).catch(() => {});
  }
}

export const bookingStore = BookingStore.getInstance();
