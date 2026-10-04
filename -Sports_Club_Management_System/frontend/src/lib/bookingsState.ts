export interface CustomerBooking {
  id: string;
  clubId: string;
  clubSlug: string;
  clubName: string;
  courtId: string;
  courtName: string;
  sport: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  durationHours: number;
  basePrice: number;
  priceCharged: number;
  isPeak: boolean;
  memberDiscountPct: number;
  status: 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';
  paymentMode: 'UPI' | 'CARD' | 'COUNTER' | 'PAY_LATER';
  paymentStatus: 'PAID' | 'PAY_LATER' | 'PENDING';
  bookingCode: string;
  createdAt: string;
  cancelledAt?: string;
  refundAmount?: number;
  refundPercentage?: number;
}

const STORAGE_KEY = 'sportshub_customer_bookings';

const INITIAL_DEMO_BOOKINGS: CustomerBooking[] = [];

export function getCustomerBookings(): CustomerBooking[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_DEMO_BOOKINGS));
      return INITIAL_DEMO_BOOKINGS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_DEMO_BOOKINGS;
  }
}

export function saveCustomerBookings(bookings: CustomerBooking[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(bookings));
    window.dispatchEvent(new Event('sportshub_bookings_updated'));
  } catch {
    // Ignore storage issues
  }
}

export function addCustomerBooking(
  booking: Omit<CustomerBooking, 'id' | 'bookingCode' | 'createdAt'> & { id?: string; bookingCode?: string }
): CustomerBooking {
  const all = getCustomerBookings();
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  const newBooking: CustomerBooking = {
    ...booking,
    id: booking.id || `bk-${Date.now()}`,
    bookingCode: booking.bookingCode || `SH-${booking.clubSlug.slice(0, 3).toUpperCase()}-${randomSuffix}`,
    createdAt: new Date().toISOString(),
  };

  const updated = [newBooking, ...all.filter((b) => b.id !== newBooking.id)];
  saveCustomerBookings(updated);
  return newBooking;
}

export function cancelCustomerBooking(
  bookingId: string
): { success: boolean; message: string; refundAmount: number; refundPct: number } {
  const all = getCustomerBookings();
  const booking = all.find((b) => b.id === bookingId);

  if (!booking) {
    return { success: false, message: 'Booking not found.', refundAmount: 0, refundPct: 0 };
  }

  if (booking.status === 'CANCELLED') {
    return { success: false, message: 'This booking is already cancelled.', refundAmount: 0, refundPct: 0 };
  }

  // Calculate hours remaining until booking slot
  const slotDate = new Date(`${booking.date}T${booking.startTime}:00`);
  const now = new Date();
  const diffHours = (slotDate.getTime() - now.getTime()) / (1000 * 60 * 60);

  let refundPct = 100;
  let policyNotice = 'Full 100% refund applied (cancelled > 24 hours in advance).';

  if (diffHours < 2) {
    refundPct = 0;
    policyNotice = '0% refund (cancelled less than 2 hours before start time).';
  } else if (diffHours <= 24) {
    refundPct = 50;
    policyNotice = '50% partial refund applied (cancelled 2 to 24 hours before start time).';
  }

  const refundAmount = Math.round((booking.priceCharged * refundPct) / 100);

  const updated = all.map((b) => {
    if (b.id === bookingId) {
      return {
        ...b,
        status: 'CANCELLED' as const,
        cancelledAt: new Date().toISOString(),
        refundAmount,
        refundPercentage: refundPct,
      };
    }
    return b;
  });

  saveCustomerBookings(updated);

  return {
    success: true,
    message: `Your booking has been cancelled. ${policyNotice}`,
    refundAmount,
    refundPct,
  };
}
