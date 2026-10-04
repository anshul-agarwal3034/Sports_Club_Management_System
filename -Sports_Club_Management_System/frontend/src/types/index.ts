export type UserRole = 'PLATFORM_ADMIN' | 'CLUB_OWNER' | 'STAFF' | 'KITCHEN_MANAGER' | 'COACH' | 'MEMBER' | 'NON_MEMBER';
export type MembershipTier = 'GOLD' | 'SILVER' | 'JUNIOR';
export type PricingStrategy = 'CONSERVATIVE' | 'BALANCED' | 'AGGRESSIVE';
export type BookingStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';
export type PaymentMode = 'CASH' | 'CARD' | 'UPI' | 'PAY_LATER';
export type OrderStatus = 'NEW' | 'PREPARING' | 'READY' | 'SERVED' | 'CANCELLED';
export type LeadStatus = 'NEW' | 'QUOTED' | 'CONVERTED' | 'LOST';
export type SportType = 'padel' | 'badminton' | 'tennis' | 'pickleball';

export interface Club {
  id: string;
  name: string;
  slug?: string;
  address: string;
  city: string;
  gst_number: string;
  pan_number: string;
  is_verified: boolean;
  inspection_status: 'PENDING' | 'SCHEDULED' | 'VERIFIED' | 'REJECTED';
  base_commission_pct: number;
  sports?: SportType[];
  dynamic_pricing_enabled?: boolean;
  dynamic_pricing_strategy?: PricingStrategy;
  peak_start_hour?: number;
  peak_end_hour?: number;
  price_floor?: number;
  price_ceiling?: number;
  rating?: number;
  review_count?: number;
  image_url?: string;
}

export interface Court {
  id: string;
  club_id: string;
  name: string;
  sport: SportType | string;
  sport_type?: string;
  sportType?: string;
  base_price: number;
  max_capacity: number;
}

export interface MembershipPlan {
  id: string;
  club_id: string;
  tier: MembershipTier;
  court_discount_pct: number;
  rental_discount_pct: number;
  shop_discount_pct: number;
  canteen_discount_pct: number;
  free_coaching_cap: number;
  pay_later_enabled: boolean;
  price_per_year: number;
}

export interface User {
  id: string;
  club_id?: string;
  role: UserRole;
  full_name: string;
  email: string;
  phone: string;
  date_of_birth?: string;
  points_balance: number;
  credit_limit: number;
  current_pay_later_balance: number;
  tier?: MembershipTier;
  expiry_date?: string;
  grace_days_remaining?: number;
  qr_code?: string;
}

export interface Booking {
  id: string;
  club_id: string;
  court_id: string;
  court_name: string;
  user_id?: string;
  user_name: string;
  tier?: MembershipTier;
  sport?: string;
  date: string;
  start_hour: number;
  end_hour: number;
  price: number;
  original_price: number;
  status: BookingStatus;
  is_dynamic_price: boolean;
  payment_status: 'PAID' | 'PAY_LATER' | 'PENDING';
  payment_mode: PaymentMode;
  notes?: string;
}

export interface Product {
  id: string;
  club_id: string;
  name: string;
  category: 'gear' | 'racket' | 'apparel' | 'canteen_food' | 'canteen_beverage';
  price: number;
  stock: number;
  is_rental: boolean;
  low_stock_threshold: number;
}

export interface OrderItem {
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
}

export interface Order {
  id: string;
  club_id: string;
  table_number?: string;
  user_id?: string;
  user_name?: string;
  tier?: MembershipTier;
  items: OrderItem[];
  total_amount: number;
  discount_amount: number;
  net_amount: number;
  payment_mode: PaymentMode | 'MEMBER_TAB';
  status: OrderStatus;
  created_at: string;
}

export interface Lead {
  id: string;
  club_id: string;
  customer_name: string;
  phone: string;
  email: string;
  source: string;
  status: 'NEW' | 'TRIAL_SCHEDULED' | 'QUOTED' | 'CONVERTED';
  notes: string;
  created_at: string;
}

export interface LeaveRequest {
  id: string;
  date: string;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
}

export interface Employee {
  id: string;
  club_id: string;
  full_name: string;
  email?: string;
  role: 'RECEPTION' | 'KITCHEN' | 'COACH' | 'MAINTENANCE' | 'STAFF' | 'KITCHEN_MANAGER' | string;
  phone: string;
  salary?: number;
  working_hours?: string;
  status?: 'PENDING' | 'APPROVED' | 'REJECTED';
  leave_requests?: LeaveRequest[];
}

export interface Transaction {
  id: string;
  club_id: string;
  date: string;
  amount: number;
  category: 'court_booking' | 'membership' | 'shop' | 'canteen' | 'coaching';
  payment_mode: PaymentMode;
  status: 'SETTLED' | 'PENDING';
  description: string;
}

export interface Complaint {
  id: string;
  club_id: string;
  member_name: string;
  issue: string;
  date: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED';
}

export interface EventItem {
  id: string;
  club_id: string;
  title: string;
  date: string;
  sport: SportType;
  entry_fee: number;
  is_inter_club: boolean;
  participants_count: number;
  status: 'UPCOMING' | 'ONGOING' | 'COMPLETED';
}

export interface WaitlistEntry {
  id: string;
  club_id: string;
  court_id: string;
  court_name?: string;
  sport_type?: string;
  club_name?: string;
  start_time?: string;
  end_time?: string;
  desired_time_range?: string;
  status: 'WAITING' | 'OFFERED' | 'PAYMENT_HOLD' | 'ACCEPTED' | 'DECLINED' | 'EXPIRED' | 'CANCELLED';
  offer_expires_at?: string;
  queue_position?: number;
  created_at: string;
}

export interface FlashDeal {
  id?: string;
  courtId: string;
  court_id?: string;
  courtName: string;
  court_name?: string;
  sportType?: string;
  clubId?: string;
  club_id?: string;
  clubName?: string;
  city?: string;
  startTime: string;
  start_time?: string;
  endTime: string;
  end_time?: string;
  originalPrice: number;
  original_price?: number;
  discountedPrice: number;
  discounted_price?: number;
  savings?: number;
  discountPct: number;
  discount_pct?: number;
  startsInMinutes?: number;
  validUntil?: string;
  isMemberDiscount?: boolean;
  nudgeMessage?: string;
}

export interface MatchLobby {
  id: string;
  club_id: string;
  court_id?: string;
  booking_id?: string;
  court_name?: string;
  club_name: string;
  city: string;
  host_user_id: string;
  host_name: string;
  sport_type: string;
  game_type: 'CASUAL' | 'COMPETITIVE' | 'TOURNAMENT_PRACTICE';
  match_start_time: string;
  match_end_time: string;
  min_skill_level: number;
  max_skill_level: number;
  total_capacity: number;
  approved_player_count?: number;
  payment_model: 'HOST_PAID_SPONSORED' | 'HOST_PAID_REIMBURSED' | 'AUTO_SPLIT';
  court_total_price: number;
  cost_per_player: number;
  status: 'DRAFT' | 'OPEN' | 'FULL' | 'COMPLETED' | 'CANCELLED';
}

export interface MatchParticipant {
  id: string;
  match_id: string;
  user_id: string;
  full_name: string;
  email: string;
  is_host: boolean;
  approval_status: 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED' | 'WITHDRAWN' | 'NO_SHOW';
  payment_status: 'NOT_REQUIRED' | 'PENDING_PAYMENT' | 'PAID' | 'REFUNDED';
  share_amount: number;
  self_rating?: number;
  verified_rating?: number;
  is_verified?: boolean;
  matches_played?: number;
  matches_completed?: number;
  no_shows?: number;
}

export interface PeakRecommendation {
  id: string;
  rule_id?: string;
  club_id?: string;
  sport?: string;
  day_of_week?: number;
  weekdayName?: string;
  hourBucket?: number;
  time_bucket_start?: string;
  time_bucket_end?: string;
  observationPeriodDays?: number;
  sampleCount?: number;
  sample_count?: number;
  occupancyPct?: number;
  occupancy_pct?: number;
  occupancyBand?: 'OFF_PEAK' | 'NORMAL' | 'PEAK' | 'SUPER_PEAK';
  currentMultiplier?: number;
  current_multiplier?: number;
  proposedMultiplier?: number;
  recommended_multiplier?: number;
  decision?: 'PENDING' | 'APPROVED' | 'REJECTED' | 'APPLIED_BY_AUTOPILOT';
  status?: 'PENDING' | 'APPROVED' | 'REJECTED' | 'APPLIED_BY_AUTOPILOT';
  observation?: string;
}

export interface AppNotification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  payload: any;
  is_read: boolean;
  channel: string;
  created_at: string;
}

export interface ClubSetupStatus {
  id: string;
  name: string;
  setup_status: 'INCOMPLETE' | 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED';
  setup_step: number;
  draft_data: any;
  is_verified: boolean;
  inspection_status: string;
  rejection_reason?: string;
}

export interface Expense {
  id: string;
  club_id: string;
  category: string;
  description: string;
  amount: number;
  expense_date: string;
  service_period?: string;
  status: 'PAID' | 'UNPAID';
  payment_date?: string;
  payment_method?: string;
  payee_vendor?: string;
  receipt_url?: string;
  notes?: string;
  is_operating: boolean;
  created_by?: string;
  created_by_name?: string;
  created_at: string;
}

export interface FinancialOverview {
  totalRevenue: number;
  platformCommission: number;
  operatingExpenses: number;
  netIncome: number;
  unpaidLiabilities: number;
  unpaidBillsCount: number;
  summary?: {
    totalIncome: number;
    totalExpenses: number;
    platformCommission: number;
    netIncome: number;
  };
  breakdown: {
    courtRevenue: number;
    membershipRevenue: number;
    canteenRevenue: number;
    coachingRevenue: number;
    shopRevenue: number;
    refunds: number;
    salaries: number;
    utilities: number;
    rent: number;
    maintenance: number;
    inventory: number;
  };
}
