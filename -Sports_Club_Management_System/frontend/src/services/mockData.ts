import { Club, Court, User, Booking, Product, Order, Lead, Employee, Transaction, Complaint, EventItem } from '../types';

export const mockClubs: Club[] = [
  {
    id: 'club-1',
    name: 'Skyline Sports Hub',
    address: 'Indiranagar 100ft Road',
    city: 'Bangalore',
    gst_number: '29AAAAA0000A1Z5',
    pan_number: 'AAAAA0000A',
    is_verified: true,
    inspection_status: 'VERIFIED',
    base_commission_pct: 10,
    sports: ['padel', 'badminton', 'tennis'],
    dynamic_pricing_enabled: true,
    dynamic_pricing_strategy: 'BALANCED',
    peak_start_hour: 18,
    peak_end_hour: 22,
    price_floor: 500,
    price_ceiling: 2000,
  }
];

export const mockCourts: Court[] = [
  { id: 'court-1', club_id: 'club-1', name: 'Padel Court 1', sport: 'padel', base_price: 800, max_capacity: 4 },
  { id: 'court-2', club_id: 'club-1', name: 'Badminton Court 1', sport: 'badminton', base_price: 600, max_capacity: 4 },
];

export const mockUsers: User[] = [
  {
    id: 'user-1',
    club_id: 'club-1',
    role: 'MEMBER',
    full_name: 'Rahul Sharma',
    email: 'rahul@example.com',
    phone: '+91 9876543210',
    points_balance: 120,
    credit_limit: 2000,
    current_pay_later_balance: 0,
    tier: 'GOLD',
  }
];

export const mockBookings: Booking[] = [
  {
    id: 'bk-1',
    club_id: 'club-1',
    court_id: 'court-1',
    court_name: 'Padel Court 1',
    user_name: 'Rahul Sharma',
    date: '2026-10-04',
    start_hour: 18,
    end_hour: 19,
    price: 800,
    original_price: 800,
    status: 'CONFIRMED',
    is_dynamic_price: false,
    payment_status: 'PAID',
    payment_mode: 'UPI',
  }
];

export const mockProducts: Product[] = [
  { id: 'p-1', club_id: 'club-1', name: 'Head Padel Racket', category: 'racket', price: 4500, stock: 12, is_rental: false, low_stock_threshold: 3 },
  { id: 'p-2', club_id: 'club-1', name: 'Wilson Match Balls (3-pack)', category: 'gear', price: 450, stock: 30, is_rental: false, low_stock_threshold: 5 },
];

export const mockOrders: Order[] = [
  {
    id: 'ord-1',
    club_id: 'club-1',
    table_number: 'T-04',
    user_name: 'Rahul Sharma',
    items: [{ product_id: 'p-2', product_name: 'Wilson Match Balls', quantity: 1, unit_price: 450 }],
    total_amount: 450,
    discount_amount: 45,
    net_amount: 405,
    payment_mode: 'UPI',
    status: 'NEW',
    created_at: new Date().toISOString(),
  }
];

export const mockLeads: Lead[] = [
  { id: 'lead-1', club_id: 'club-1', customer_name: 'Ankit Mehta', phone: '9876543210', email: 'ankit@gmail.com', source: 'Instagram', status: 'NEW', notes: 'Interested in Padel Gold Membership', created_at: new Date().toISOString() }
];

export const mockEmployees: Employee[] = [
  { id: 'emp-1', club_id: 'club-1', full_name: 'Suresh Kumar', role: 'RECEPTION', phone: '9876512345', salary: 25000, working_hours: '08:00 - 16:00', leave_requests: [] }
];

export const mockTransactions: Transaction[] = [
  { id: 'txn-1', club_id: 'club-1', date: '2026-10-04', amount: 800, category: 'court_booking', payment_mode: 'UPI', status: 'SETTLED', description: 'Padel Court 1 Booking' }
];

export const mockComplaints: Complaint[] = [
  { id: 'cmp-1', club_id: 'club-1', member_name: 'Rahul Sharma', issue: 'Lighting dim on Court 2', date: '2026-10-03', status: 'OPEN' }
];

export const mockEvents: EventItem[] = [
  { id: 'evt-1', club_id: 'club-1', title: 'Bangalore Autumn Padel Open', date: '2026-10-15', sport: 'padel', entry_fee: 1500, is_inter_club: true, participants_count: 24, status: 'UPCOMING' }
];
