export interface DetailedCourt {
  id: string;
  clubId: string;
  name: string;
  sport: 'padel' | 'badminton' | 'tennis' | 'pickleball' | 'football_turf';
  surface: string;
  isIndoor: boolean;
  basePrice: number;
  maxCapacity: number;
  description: string;
  image: string;
}

export interface ClubMembershipTier {
  tier: 'GOLD' | 'SILVER' | 'JUNIOR';
  name: string;
  pricePerYear: number;
  courtDiscountPct: number;
  rentalDiscountPct: number;
  shopDiscountPct: number;
  freeCoachingSessions: number;
  payLaterEnabled: boolean;
  guardianConsentRequired?: boolean;
  tagline: string;
  benefits: string[];
}

export interface DetailedClub {
  id: string;
  slug: string;
  name: string;
  city: string;
  locality: string;
  address: string;
  phone: string;
  email: string;
  openingHours: string;
  isVerified: boolean;
  rating: number;
  reviewCount: number;
  startingPrice: number;
  sports: ('padel' | 'badminton' | 'tennis' | 'pickleball' | 'football_turf')[];
  images: string[];
  description: string;
  amenities: { name: string; icon: string; description: string }[];
  courts: DetailedCourt[];
  memberships: ClubMembershipTier[];
}

export const DETAILED_CLUBS: DetailedClub[] = [
  {
    id: 'club-1',
    slug: 'skyline-sports',
    name: 'Skyline Sports Association',
    city: 'Mumbai',
    locality: 'University Heights',
    address: 'Campus West Wing, University Heights, Mumbai, Maharashtra 400098',
    phone: '+91 22 2847 9100',
    email: 'info@skylinesports.in',
    openingHours: '06:00 AM – 10:00 PM Daily',
    isVerified: true,
    rating: 4.8,
    reviewCount: 142,
    startingPrice: 400,
    sports: ['padel', 'badminton', 'tennis', 'pickleball'],
    images: [
      'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?auto=format&fit=crop&w=1200&q=80', // Tennis/court
      'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?auto=format&fit=crop&w=800&q=80', // Badminton
      'https://images.unsplash.com/photo-1587280501635-68a0e82cd5ff?auto=format&fit=crop&w=800&q=80', // Indoor court
    ],
    description:
      'Premier multi-sport club featuring panoramic padel courts, tournament-grade wooden badminton courts, and floodlit pickleball arenas with locker facilities and on-site canteen.',
    amenities: [
      { name: 'Floodlit Courts', icon: 'Sun', description: 'Even illumination for evening and night play' },
      { name: 'Equipment Rental', icon: 'Shield', description: 'Tournament rackets, shuttles & balls available' },
      { name: 'Lockers & Showers', icon: 'Lock', description: 'Clean changing rooms with hot water showers' },
      { name: 'Canteen & Cafe', icon: 'Coffee', description: 'Fresh juices, protein smoothies and healthy meals' },
      { name: 'Certified Coaches', icon: 'Award', description: 'Available for private training and group clinics' },
      { name: 'Secure Parking', icon: 'Car', description: 'Complimentary two-wheeler & four-wheeler parking' },
    ],
    courts: [
      {
        id: 'court-101',
        clubId: 'club-1',
        name: 'Court 1 (Padel Glass Pro)',
        sport: 'padel',
        surface: 'Mondo Super-Court Turf with 12mm Tempered Glass',
        isIndoor: true,
        basePrice: 600,
        maxCapacity: 4,
        description: 'Enclosed glass court with LED floodlights and run-out space for competitive rallies.',
        image: 'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?auto=format&fit=crop&w=800&q=80',
      },
      {
        id: 'court-102',
        clubId: 'club-1',
        name: 'Court 2 (Padel Panoramic)',
        sport: 'padel',
        surface: 'Textured Polyethylene Turf with Seamless Mesh',
        isIndoor: false,
        basePrice: 600,
        maxCapacity: 4,
        description: 'Open-air panoramic padel court with scenic club grounds view.',
        image: 'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?auto=format&fit=crop&w=800&q=80',
      },
      {
        id: 'court-103',
        clubId: 'club-1',
        name: 'Court 3 (Badminton Wood)',
        sport: 'badminton',
        surface: 'BWF-Approved Teak Wood with Cushioned Underlay',
        isIndoor: true,
        basePrice: 400,
        maxCapacity: 4,
        description: 'High-bounce wooden court with anti-glare overhead lights.',
        image: 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?auto=format&fit=crop&w=800&q=80',
      },
      {
        id: 'court-104',
        clubId: 'club-1',
        name: 'Court 4 (Tennis Hardcourt)',
        sport: 'tennis',
        surface: '8-Coat Acrylic Cushioned Surface',
        isIndoor: false,
        basePrice: 700,
        maxCapacity: 4,
        description: 'Standard regulation dimensions with baseline viewing benches.',
        image: 'https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?auto=format&fit=crop&w=800&q=80',
      },
    ],
    memberships: [
      {
        tier: 'GOLD',
        name: 'Gold Member Plan',
        pricePerYear: 9999,
        courtDiscountPct: 50,
        rentalDiscountPct: 50,
        shopDiscountPct: 10,
        freeCoachingSessions: 4,
        payLaterEnabled: true,
        tagline: 'Best for frequent players & enthusiasts',
        benefits: [
          '50% off all court bookings year-round',
          '50% off racket & gear rentals',
          '10% discount on club shop items & canteen',
          '4 complimentary 1-on-1 coaching sessions per month',
          'Pay Later credit balance up to ₹2,000 at front desk',
          '7-day advance court reservation window',
        ],
      },
      {
        tier: 'SILVER',
        name: 'Silver Regular Plan',
        pricePerYear: 4999,
        courtDiscountPct: 25,
        rentalDiscountPct: 25,
        shopDiscountPct: 5,
        freeCoachingSessions: 0,
        payLaterEnabled: false,
        tagline: 'Ideal for weekend and casual community players',
        benefits: [
          '25% off all court bookings',
          '25% off gear rentals',
          '5% discount at club pro shop',
          'Priority notification for club tournaments & social matches',
          '3-day advance court reservation window',
        ],
      },
      {
        tier: 'JUNIOR',
        name: 'Junior Academy Pass',
        pricePerYear: 2999,
        courtDiscountPct: 30,
        rentalDiscountPct: 30,
        shopDiscountPct: 5,
        freeCoachingSessions: 0,
        payLaterEnabled: false,
        guardianConsentRequired: true,
        tagline: 'Special youth program for players under 18 years',
        benefits: [
          '30% off court bookings during non-peak hours',
          '30% off junior equipment rentals',
          'Access to weekend junior group coaching clinics',
          'Mandatory parental / guardian registration verification',
        ],
      },
    ],
  },
  {
    id: 'club-2',
    slug: 'apex-arena',
    name: 'Apex Athletic Club',
    city: 'Delhi',
    locality: 'Sector 42, Metro Sports Hub',
    address: 'Plot 18, Sector 42, Metro Sports Hub, New Delhi 110001',
    phone: '+91 11 4123 7890',
    email: 'contact@apexathletic.com',
    openingHours: '06:00 AM – 10:00 PM Daily',
    isVerified: true,
    rating: 4.7,
    reviewCount: 98,
    startingPrice: 500,
    sports: ['padel', 'badminton'],
    images: [
      'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?auto=format&fit=crop&w=800&q=80',
    ],
    description:
      'Centrally located athletic complex with glass-walled indoor padel courts and competition-grade badminton halls.',
    amenities: [
      { name: 'Climate Controlled', icon: 'Wind', description: 'Air-conditioned indoor viewing lounge' },
      { name: 'Pro Shop', icon: 'ShoppingBag', description: 'Full range of rackets, grips and footwear' },
      { name: 'Locker Rooms', icon: 'Lock', description: 'Individual digital lockers and showers' },
      { name: 'Juice Bar', icon: 'Coffee', description: 'Cold-pressed juices & recovery shakes' },
    ],
    courts: [
      {
        id: 'court-201',
        clubId: 'club-2',
        name: 'Apex Arena 1 (Padel)',
        sport: 'padel',
        surface: 'World Padel Tour Certified Synthetic Grass',
        isIndoor: true,
        basePrice: 650,
        maxCapacity: 4,
        description: 'Tournament court with video recording cameras available for match review.',
        image: 'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?auto=format&fit=crop&w=800&q=80',
      },
      {
        id: 'court-202',
        clubId: 'club-2',
        name: 'Apex Arena 2 (Badminton)',
        sport: 'badminton',
        surface: 'Shock-Absorbing Mat on Hardwood',
        isIndoor: true,
        basePrice: 500,
        maxCapacity: 4,
        description: 'Standard singles & doubles lines with glare-free perimeter lights.',
        image: 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?auto=format&fit=crop&w=800&q=80',
      },
    ],
    memberships: [
      {
        tier: 'GOLD',
        name: 'Apex Gold Membership',
        pricePerYear: 10999,
        courtDiscountPct: 50,
        rentalDiscountPct: 50,
        shopDiscountPct: 15,
        freeCoachingSessions: 3,
        payLaterEnabled: true,
        tagline: 'VIP access with unlimited lounge privileges',
        benefits: [
          '50% off court slots anytime',
          'Free racquet demo on new releases',
          '3 coaching sessions per month with Head Coach',
        ],
      },
      {
        tier: 'SILVER',
        name: 'Apex Silver Membership',
        pricePerYear: 5499,
        courtDiscountPct: 25,
        rentalDiscountPct: 25,
        shopDiscountPct: 5,
        freeCoachingSessions: 0,
        payLaterEnabled: false,
        tagline: 'Standard club membership for regular exercise',
        benefits: [
          '25% discount across all courts',
          'Discounted tournament entry fees',
        ],
      },
      {
        tier: 'JUNIOR',
        name: 'Apex Junior Development',
        pricePerYear: 3200,
        courtDiscountPct: 30,
        rentalDiscountPct: 30,
        shopDiscountPct: 5,
        freeCoachingSessions: 0,
        payLaterEnabled: false,
        guardianConsentRequired: true,
        tagline: 'Youth membership for under-18 athletes',
        benefits: [
          '30% off court bookings',
          'Weekend junior match play inclusion',
        ],
      },
    ],
  },
  {
    id: 'club-3',
    slug: 'velocity-hub',
    name: 'Velocity Turf & Padel Hub',
    city: 'Bengaluru',
    locality: 'South Arena Zone',
    address: '88 Ring Road, South Arena Zone, Bengaluru, Karnataka 560068',
    phone: '+91 80 4912 3456',
    email: 'play@velocityhub.in',
    openingHours: '06:00 AM – 11:00 PM Daily',
    isVerified: true,
    rating: 4.9,
    reviewCount: 215,
    startingPrice: 600,
    sports: ['padel', 'football_turf', 'tennis'],
    images: [
      'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?auto=format&fit=crop&w=800&q=80',
    ],
    description:
      'High-energy sports venue with FIFA-certified artificial turf for 5v5 football and twin panoramic glass padel courts.',
    amenities: [
      { name: 'FIFA-Grade Turf', icon: 'Award', description: 'Monofilament shock-damped artificial grass' },
      { name: 'Cafe & Terrace', icon: 'Coffee', description: 'Spectator terrace overlooking all courts' },
      { name: 'Rental Equipment', icon: 'Shield', description: 'Football bibs, balls, padel rackets' },
      { name: 'Free Wi-Fi', icon: 'Wifi', description: 'High-speed broadband across the clubhouse' },
    ],
    courts: [
      {
        id: 'court-301',
        clubId: 'club-3',
        name: 'Velocity Padel Court 1',
        sport: 'padel',
        surface: 'Synthetic Turf & Structural Glass',
        isIndoor: false,
        basePrice: 700,
        maxCapacity: 4,
        description: 'Covered canopy court playable rain or shine.',
        image: 'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?auto=format&fit=crop&w=800&q=80',
      },
      {
        id: 'court-302',
        clubId: 'club-3',
        name: 'Velocity 5v5 Football Turf',
        sport: 'football_turf',
        surface: 'FIFA 2-Star Monofilament Turf',
        isIndoor: false,
        basePrice: 1200,
        maxCapacity: 12,
        description: 'Standard 5v5 pitch with safety netting and LED corner floodlights.',
        image: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=800&q=80',
      },
    ],
    memberships: [
      {
        tier: 'GOLD',
        name: 'Velocity All-Star',
        pricePerYear: 11999,
        courtDiscountPct: 50,
        rentalDiscountPct: 50,
        shopDiscountPct: 10,
        freeCoachingSessions: 2,
        payLaterEnabled: true,
        tagline: 'Ultimate multi-sport access in South Bengaluru',
        benefits: [
          '50% off all turf & padel bookings',
          'Free spectator box booking during weekend matches',
          '2 monthly coaching sessions',
        ],
      },
      {
        tier: 'SILVER',
        name: 'Velocity Regular',
        pricePerYear: 5999,
        courtDiscountPct: 25,
        rentalDiscountPct: 25,
        shopDiscountPct: 5,
        freeCoachingSessions: 0,
        payLaterEnabled: false,
        tagline: 'Save 25% on weekly team games',
        benefits: [
          '25% discount across turf & courts',
          'Match scheduling assistance',
        ],
      },
      {
        tier: 'JUNIOR',
        name: 'Velocity Junior Squad',
        pricePerYear: 2800,
        courtDiscountPct: 30,
        rentalDiscountPct: 30,
        shopDiscountPct: 5,
        freeCoachingSessions: 0,
        payLaterEnabled: false,
        guardianConsentRequired: true,
        tagline: 'Junior training and development pass',
        benefits: [
          '30% off weekday bookings',
          'Guardian verified registration',
        ],
      },
    ],
  },
];

export function getClubBySlug(slug: string): DetailedClub | undefined {
  const normalized = slug.trim().toLowerCase();
  return DETAILED_CLUBS.find(
    (c) => c.slug === normalized || c.id === normalized || c.name.toLowerCase().includes(normalized)
  );
}

export function getAllClubs(): DetailedClub[] {
  return DETAILED_CLUBS;
}

export function formatDbClubToDetailed(dbClub: any): DetailedClub {
  const courtsData = Array.isArray(dbClub.courts) ? dbClub.courts : [];
  const courts: DetailedCourt[] = courtsData.map((c: any) => ({
    id: c.id,
    clubId: dbClub.id,
    name: c.name || 'Court',
    sport: (c.sport_type || c.sportType || 'padel').toLowerCase() as any,
    surface: c.surface || 'Professional Synthetic Turf',
    isIndoor: true,
    basePrice: parseFloat(c.base_price_per_hour || c.basePricePerHour || 500),
    maxCapacity: c.max_capacity || c.maxCapacity || 4,
    description: `${c.name || 'Court'} available for hourly slot booking.`,
    image: 'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?auto=format&fit=crop&w=800&q=80',
  }));

  const sportsSet = new Set<any>();
  courts.forEach((c) => sportsSet.add(c.sport));
  if (sportsSet.size === 0) {
    sportsSet.add('padel');
  }

  const startingPrice = courts.length > 0
    ? Math.min(...courts.map((c) => c.basePrice))
    : 400;

  return {
    id: dbClub.id,
    slug: dbClub.id,
    name: dbClub.name,
    city: dbClub.city || 'Mumbai',
    locality: dbClub.address ? dbClub.address.split(',')[0] : dbClub.city || 'Central',
    address: dbClub.address || `${dbClub.name}, ${dbClub.city}`,
    phone: dbClub.phone || '+91 98765 43210',
    email: dbClub.email || 'contact@championclub.com',
    openingHours: '06:00 AM – 10:00 PM Daily',
    isVerified: Boolean(dbClub.is_verified || dbClub.isVerified),
    rating: 4.9,
    reviewCount: 28,
    startingPrice: startingPrice,
    sports: Array.from(sportsSet),
    images: [
      'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1587280501635-68a0e82cd5ff?auto=format&fit=crop&w=800&q=80',
    ],
    description: `Official ${dbClub.name} sports facility located in ${dbClub.city}. Open for online hourly court reservations, equipment rentals, and coaching.`,
    amenities: [
      { name: 'Floodlit Courts', icon: 'Sun', description: 'Illuminated playing arenas' },
      { name: 'Equipment Rental', icon: 'Shield', description: 'Rackets & balls available' },
      { name: 'Lockers & Showers', icon: 'Lock', description: 'Clean changing facilities' },
      { name: 'Canteen', icon: 'Coffee', description: 'Refreshments & energy drinks' },
    ],
    courts: courts.length > 0 ? courts : [
      {
        id: `court-${dbClub.id}-1`,
        clubId: dbClub.id,
        name: 'Court 1 (Main Court)',
        sport: 'padel',
        surface: 'Pro Synthetic Turf',
        isIndoor: true,
        basePrice: 600,
        maxCapacity: 4,
        description: 'Main court for hourly slot bookings.',
        image: 'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?auto=format&fit=crop&w=800&q=80',
      }
    ],
    memberships: [],
  };
}

export async function fetchLiveClubs(): Promise<DetailedClub[]> {
  try {
    const res = await fetch('/api/v1/clubs');
    const data = await res.json();
    if (res.ok && data.success && Array.isArray(data.data)) {
      const dbClubs = data.data;
      const formattedClubs: DetailedClub[] = [];

      for (const clubItem of dbClubs) {
        try {
          const detailRes = await fetch(`/api/v1/clubs/${clubItem.id}`);
          const detailData = await detailRes.json();
          if (detailRes.ok && detailData.success && detailData.data) {
            formattedClubs.push(formatDbClubToDetailed(detailData.data));
          } else {
            formattedClubs.push(formatDbClubToDetailed(clubItem));
          }
        } catch {
          formattedClubs.push(formatDbClubToDetailed(clubItem));
        }
      }

      const existingIds = new Set(formattedClubs.map((c) => c.id));
      const remainingMocks = DETAILED_CLUBS.filter((mc) => !existingIds.has(mc.id) && !existingIds.has(mc.slug));
      return [...formattedClubs, ...remainingMocks];
    }
  } catch (err) {
    console.error('Failed to fetch live clubs from API', err);
  }
  return DETAILED_CLUBS;
}

export async function fetchLiveClubBySlug(slugOrId: string): Promise<DetailedClub | undefined> {
  try {
    const res = await fetch(`/api/v1/clubs/${slugOrId}`);
    const data = await res.json();
    if (res.ok && data.success && data.data) {
      return formatDbClubToDetailed(data.data);
    }
  } catch (err) {
    console.error('Failed to fetch live club by ID/slug', err);
  }

  return getClubBySlug(slugOrId);
}
