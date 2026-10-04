// Schema models aligned with PostgreSQL tables

export type UserRole = 'player' | 'owner' | 'front_desk' | 'kitchen' | 'coach';
export type MembershipTier = 'gold' | 'silver' | 'junior' | 'none';
export type BookingStatus = 'confirmed' | 'pending' | 'locked' | 'cancelled';
export type SportType = 'padel' | 'badminton' | 'football_turf' | 'pickleball' | 'tennis';

export interface Club {
  id: string;
  name: string;
  slug: string;
  address: string;
  verified: boolean;
  rating?: number;
  total_courts?: number;
}

export interface Court {
  id: string;
  club_id: string;
  name: string;
  sport_type: SportType;
  base_price_cents: number; // in paise / cents (e.g., 80000 = ₹800)
  display_price: string;
  surface_type?: string;
  is_indoor?: boolean;
}

export interface Booking {
  id: string;
  court_id: string;
  user_id: string;
  start_time: string; // ISO 8601
  end_time: string;   // ISO 8601
  status: BookingStatus;
  rate_cents: number;
}

export interface UserMembership {
  id: string;
  full_name: string;
  email: string;
  role: UserRole;
  tier: MembershipTier;
}

export interface TimetableSlot {
  time: string;       // e.g., "16:00", "17:00", "18:00", "19:00"
  courtId: string;
  courtName: string;
  sport: SportType;
  priceInRupees: number;
  isBooked: boolean;
  isPeak?: boolean;
}
