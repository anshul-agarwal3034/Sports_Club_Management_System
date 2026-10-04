import { Club, Court, TimetableSlot } from '@/types/schema';

export const MOCK_CLUBS: Club[] = [
  {
    id: 'c101e45b-7b01-4cfa-811a-1d5d1c251001',
    name: 'Apex Arena & Racquet Club',
    slug: 'apex-arena',
    address: '42 Stadium Blvd, Metro Sports Complex',
    verified: true,
    rating: 4.9,
    total_courts: 12,
  },
  {
    id: 'c202e45b-7b01-4cfa-811a-1d5d1c251002',
    name: 'Velocity Turf & Padel Hub',
    slug: 'velocity-hub',
    address: '88 Ring Road, South Arena Zone',
    verified: true,
    rating: 4.8,
    total_courts: 8,
  }
];

export const MOCK_COURTS: Court[] = [
  {
    id: 'court-padel-01',
    club_id: 'c101e45b-7b01-4cfa-811a-1d5d1c251001',
    name: 'Padel Court 1',
    sport_type: 'padel',
    base_price_cents: 80000,
    display_price: '₹800',
    surface_type: 'Mondo Super-Court Grass',
    is_indoor: true,
  },
  {
    id: 'court-badminton-01',
    club_id: 'c101e45b-7b01-4cfa-811a-1d5d1c251001',
    name: 'Badminton Court 1',
    sport_type: 'badminton',
    base_price_cents: 60000,
    display_price: '₹600',
    surface_type: 'BWF Certified Teak Wood & Mat',
    is_indoor: true,
  },
  {
    id: 'court-turf-01',
    club_id: 'c101e45b-7b01-4cfa-811a-1d5d1c251001',
    name: '5v5 Turf',
    sport_type: 'football_turf',
    base_price_cents: 120000,
    display_price: '₹1200',
    surface_type: 'FIFA 2-Star Monofilament Turf',
    is_indoor: false,
  }
];

export const INITIAL_TIMETABLE_SLOTS: TimetableSlot[] = [
  // Padel Court 1
  {
    time: '16:00',
    courtId: 'court-padel-01',
    courtName: 'Padel Court 1',
    sport: 'padel',
    priceInRupees: 700,
    isBooked: false,
    isPeak: false,
  },
  {
    time: '17:00',
    courtId: 'court-padel-01',
    courtName: 'Padel Court 1',
    sport: 'padel',
    priceInRupees: 800,
    isBooked: false,
    isPeak: false,
  },
  {
    time: '18:00',
    courtId: 'court-padel-01',
    courtName: 'Padel Court 1',
    sport: 'padel',
    priceInRupees: 950,
    isBooked: true, // Booked by another player
    isPeak: true,
  },
  {
    time: '19:00',
    courtId: 'court-padel-01',
    courtName: 'Padel Court 1',
    sport: 'padel',
    priceInRupees: 950,
    isBooked: false,
    isPeak: true,
  },

  // Badminton Court 1
  {
    time: '16:00',
    courtId: 'court-badminton-01',
    courtName: 'Badminton Court 1',
    sport: 'badminton',
    priceInRupees: 500,
    isBooked: false,
    isPeak: false,
  },
  {
    time: '17:00',
    courtId: 'court-badminton-01',
    courtName: 'Badminton Court 1',
    sport: 'badminton',
    priceInRupees: 600,
    isBooked: false,
    isPeak: false,
  },
  {
    time: '18:00',
    courtId: 'court-badminton-01',
    courtName: 'Badminton Court 1',
    sport: 'badminton',
    priceInRupees: 750,
    isBooked: false,
    isPeak: true,
  },
  {
    time: '19:00',
    courtId: 'court-badminton-01',
    courtName: 'Badminton Court 1',
    sport: 'badminton',
    priceInRupees: 750,
    isBooked: true, // Booked by another player
    isPeak: true,
  },

  // 5v5 Turf
  {
    time: '16:00',
    courtId: 'court-turf-01',
    courtName: '5v5 Turf',
    sport: 'football_turf',
    priceInRupees: 1000,
    isBooked: false,
    isPeak: false,
  },
  {
    time: '17:00',
    courtId: 'court-turf-01',
    courtName: '5v5 Turf',
    sport: 'football_turf',
    priceInRupees: 1200,
    isBooked: false,
    isPeak: false,
  },
  {
    time: '18:00',
    courtId: 'court-turf-01',
    courtName: '5v5 Turf',
    sport: 'football_turf',
    priceInRupees: 1400,
    isBooked: false,
    isPeak: true,
  },
  {
    time: '19:00',
    courtId: 'court-turf-01',
    courtName: '5v5 Turf',
    sport: 'football_turf',
    priceInRupees: 1400,
    isBooked: false,
    isPeak: true,
  }
];
