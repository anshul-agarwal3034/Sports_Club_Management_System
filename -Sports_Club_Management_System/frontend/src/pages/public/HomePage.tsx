import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Search,
  MapPin,
  Calendar,
  Trophy,
  ShieldCheck,
  Star,
  ArrowRight,
  Clock,
  QrCode,
  SlidersHorizontal,
  ChevronDown,
  Building,
  CheckCircle2,
  Users,
  ShoppingBag,
  Sparkles,
  Zap
} from 'lucide-react';
import { getAllClubs } from '@/lib/clubsData';
import { getStoredUser } from '@/lib/roles';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';

const SPORTS_CATEGORIES = [
  { id: 'padel', name: 'Padel Tennis', icon: '🎾', desc: 'Glass & panoramic courts', count: '3 Venues' },
  { id: 'badminton', name: 'Badminton', icon: '🏸', desc: 'Wooden & cushioned courts', count: '2 Venues' },
  { id: 'tennis', name: 'Tennis', icon: '🎾', desc: 'Hard courts & floodlights', count: '2 Venues' },
  { id: 'pickleball', name: 'Pickleball', icon: '🏓', desc: 'Fast-paced friendly doubles', count: '1 Venue' },
  { id: 'football_turf', name: 'Football Turf', icon: '⚽', desc: '5v5 & 7v7 artificial grass', count: '1 Venue' },
];

export default function HomePage() {
  const navigate = useNavigate();
  const clubs = getAllClubs();

  // Search Bar State
  const [selectedCity, setSelectedCity] = useState('All Cities');
  const [selectedSport, setSelectedSport] = useState('all');
  const [selectedDate, setSelectedDate] = useState('today');
  const [faqOpenIndex, setFaqOpenIndex] = useState<number | null>(0);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [targetClubSlug, setTargetClubSlug] = useState<string>('');

  const handleBookSlotClick = (clubSlug: string) => {
    const user = getStoredUser();
    if (!user) {
      setTargetClubSlug(clubSlug);
      setShowLoginModal(true);
    } else {
      navigate(`/club/${clubSlug}`);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (selectedCity !== 'All Cities') params.set('city', selectedCity);
    if (selectedSport !== 'all') params.set('sport', selectedSport);
    navigate(`/clubs?${params.toString()}`);
  };

  const faqs = [
    {
      q: 'How does court booking work on SportsHub?',
      a: 'Browse verified sports clubs, choose your sport, pick an available hourly slot from 06:00 to 22:00, and confirm. You receive an instant digital check-in code to show at the club reception on arrival.',
    },
    {
      q: 'What is the court cancellation and refund policy?',
      a: 'Cancellations made more than 24 hours prior to the slot time receive a 100% refund. Cancellations between 2 and 24 hours receive a 50% partial refund. Cancellations made less than 2 hours before the start time are non-refundable.',
    },
    {
      q: 'Do I need an annual membership to book a court?',
      a: 'No. Non-members can book courts at standard hourly rates anytime. However, club members (Gold, Silver, Junior) enjoy between 25% and 50% discount on every court reservation and equipment rental.',
    },
    {
      q: 'Can I rent rackets, balls, or buy drinks at the venue?',
      a: 'Yes. Most partner clubs offer tournament racket rentals, fresh cans of match balls, and have an on-site canteen or cafe. You can even pre-order rentals through the club shop online.',
    },
    {
      q: 'How do you verify listed sports clubs?',
      a: 'Every club must submit their registered business GST and PAN, followed by an in-person physical inspection by our platform team to verify court surface conditions, lighting, and locker facilities before receiving the "Verified" badge.',
    },
  ];

  return (
    <div className="space-y-16 sm:space-y-24 pb-16 selection:bg-[#006c49] selection:text-white">
      
      {/* 1. HERO SECTION */}
      <section className="relative pt-12 sm:pt-20 pb-16 px-4 sm:px-6 lg:px-8 overflow-hidden bg-gradient-to-b from-[#eff4ff] via-[#f8f9ff] to-white border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Left Hero Content */}
            <div className="lg:col-span-7 space-y-6 text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-[#bfdbfe] text-xs font-semibold text-[#1e40af] shadow-xs">
                <ShieldCheck className="w-3.5 h-3.5 text-[#006c49]" />
                <span>Verified Sports Venues in Mumbai, Delhi &amp; Bengaluru</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-[#0b1c30] tracking-tight leading-[1.08]">
                Find sports courts and <span className="text-[#006c49]">play near you</span>.
              </h1>

              <p className="text-base sm:text-lg text-slate-600 max-w-xl leading-relaxed">
                Check live hourly court availability, reserve your time slot in seconds, and play padel, badminton, tennis, and pickleball without back-and-forth messaging.
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <Link to="/clubs">
                  <Button variant="primary" size="lg" rightIcon={<ArrowRight className="w-4 h-4" />}>
                    Find a Court
                  </Button>
                </Link>
                <Link to="/register/club">
                  <Button variant="outline" size="lg">
                    List Your Club
                  </Button>
                </Link>
              </div>

              {/* Trust Micro-Metrics */}
              <div className="pt-4 flex flex-wrap items-center gap-6 text-xs text-slate-500 font-medium">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-[#006c49]" /> Instant digital confirmation
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-[#006c49]" /> Free 24h cancellation
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-[#006c49]" /> Verified physical courts
                </span>
              </div>
            </div>

            {/* Right Hero Image Card */}
            <div className="lg:col-span-5 relative">
              <div className="relative mx-auto max-w-md lg:max-w-none rounded-3xl overflow-hidden shadow-2xl border-4 border-white bg-slate-100">
                <img
                  src="https://images.unsplash.com/photo-1554068865-24cecd4e34b8?auto=format&fit=crop&w=1000&q=80"
                  alt="Players on a padel court"
                  className="w-full h-80 sm:h-96 object-cover"
                />

                {/* Floating Venue Preview Badge */}
                <div className="absolute bottom-4 left-4 right-4 p-4 rounded-2xl bg-white/95 backdrop-blur-md border border-slate-100 shadow-lg flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-bold text-[#006c49] uppercase tracking-wider font-mono">
                      Featured Facility
                    </span>
                    <h4 className="text-sm font-bold text-[#0b1c30]">Skyline Sports Association</h4>
                    <span className="text-xs text-slate-500">University Heights, Mumbai</span>
                  </div>
                  <Link
                    to="/club/skyline-sports"
                    className="p-2.5 rounded-xl bg-[#006c49] text-white hover:bg-[#005237] transition-colors"
                  >
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </div>

          </div>

          {/* 2. VENUE SEARCH WIDGET */}
          <div className="mt-12 sm:mt-16">
            <Card className="p-4 sm:p-5 shadow-lg border-slate-200/90 bg-white">
              <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-center">
                
                {/* Location */}
                <div className="lg:col-span-4 p-2 rounded-xl bg-slate-50 border border-slate-200/80">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-[#006c49]" /> Location
                  </label>
                  <select
                    value={selectedCity}
                    onChange={(e) => setSelectedCity(e.target.value)}
                    className="w-full bg-transparent text-sm font-semibold text-[#0b1c30] outline-none cursor-pointer"
                  >
                    <option value="All Cities">All Cities (Mumbai, Delhi, Bengaluru)</option>
                    <option value="Mumbai">Mumbai</option>
                    <option value="Delhi">Delhi</option>
                    <option value="Bengaluru">Bengaluru</option>
                  </select>
                </div>

                {/* Sport */}
                <div className="lg:col-span-3 p-2 rounded-xl bg-slate-50 border border-slate-200/80">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1 flex items-center gap-1">
                    <Trophy className="w-3.5 h-3.5 text-[#006c49]" /> Sport
                  </label>
                  <select
                    value={selectedSport}
                    onChange={(e) => setSelectedSport(e.target.value)}
                    className="w-full bg-transparent text-sm font-semibold text-[#0b1c30] outline-none cursor-pointer"
                  >
                    <option value="all">All Sports</option>
                    <option value="padel">Padel</option>
                    <option value="badminton">Badminton</option>
                    <option value="tennis">Tennis</option>
                    <option value="pickleball">Pickleball</option>
                    <option value="football_turf">Football Turf</option>
                  </select>
                </div>

                {/* Date */}
                <div className="lg:col-span-3 p-2 rounded-xl bg-slate-50 border border-slate-200/80">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-[#006c49]" /> Day
                  </label>
                  <select
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full bg-transparent text-sm font-semibold text-[#0b1c30] outline-none cursor-pointer"
                  >
                    <option value="today">Today</option>
                    <option value="tomorrow">Tomorrow</option>
                    <option value="this-weekend">This Weekend</option>
                  </select>
                </div>

                {/* Submit CTA */}
                <div className="lg:col-span-2">
                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    className="w-full h-[52px]"
                    leftIcon={<Search className="w-4 h-4" />}
                  >
                    Search
                  </Button>
                </div>

              </form>
            </Card>
          </div>

        </div>
      </section>

      {/* 3. SPORT CATEGORIES FILTER SECTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <span className="text-xs font-bold text-[#006c49] uppercase font-mono tracking-wider">
              Sports Available
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0b1c30] tracking-tight mt-1">
              Choose your sport
            </h2>
          </div>
          <Link to="/clubs" className="text-xs font-semibold text-[#006c49] hover:underline flex items-center gap-1">
            Browse all clubs <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {SPORTS_CATEGORIES.map((cat) => (
            <Link
              key={cat.id}
              to={`/clubs?sport=${cat.id}`}
              className="sports-card sports-card-hover p-5 space-y-2 group block"
            >
              <div className="text-3xl mb-1">{cat.icon}</div>
              <h3 className="text-base font-bold text-[#0b1c30] group-hover:text-[#006c49] transition-colors">
                {cat.name}
              </h3>
              <p className="text-xs text-slate-500 leading-snug">{cat.desc}</p>
              <div className="pt-2 text-[11px] font-semibold text-[#006c49]">
                {cat.count} →
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* 4. FEATURED VENUES SECTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <span className="text-xs font-bold text-[#006c49] uppercase font-mono tracking-wider">
              Partner Venues
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0b1c30] tracking-tight mt-1">
              Popular sports clubs
            </h2>
            <p className="text-xs text-slate-600 mt-1">
              Verified sports clubs with tournament-grade courts, equipment rental, and coaching.
            </p>
          </div>

          <Link to="/clubs">
            <Button variant="outline" size="sm" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
              View All Venues
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {clubs.map((club) => (
            <div
              key={club.id}
              className="sports-card sports-card-hover overflow-hidden flex flex-col group"
            >
              <div className="relative h-48 w-full bg-slate-100 overflow-hidden">
                <img
                  src={club.images[0]}
                  alt={club.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                />
                <div className="absolute top-3 left-3">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/95 text-[#006c49] text-[11px] font-semibold shadow-xs">
                    <ShieldCheck className="w-3.5 h-3.5" /> Verified
                  </span>
                </div>
                <div className="absolute top-3 right-3">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/95 text-slate-800 text-[11px] font-bold shadow-xs">
                    <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                    {club.rating} ({club.reviewCount})
                  </span>
                </div>
              </div>

              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
                    <MapPin className="w-3.5 h-3.5 text-[#006c49]" />
                    <span>{club.locality}, {club.city}</span>
                  </div>

                  <h3 className="text-lg font-bold text-[#0b1c30] group-hover:text-[#006c49] transition-colors leading-snug">
                    {club.name}
                  </h3>

                  <p className="mt-1 text-xs text-slate-600 line-clamp-2 leading-relaxed">
                    {club.description}
                  </p>

                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {club.sports.map((sp) => (
                      <span
                        key={sp}
                        className="px-2 py-0.5 rounded-md bg-[#eff4ff] text-[#1e40af] text-[10px] font-medium uppercase"
                      >
                        {sp.replace('_', ' ')}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase">Starting from</span>
                    <div className="text-base font-extrabold text-[#0b1c30]">
                      ₹{club.startingPrice}
                      <span className="text-xs font-normal text-slate-500"> / hr</span>
                    </div>
                  </div>

                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleBookSlotClick(club.slug)}
                    rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                    className="cursor-pointer"
                  >
                    Book Slot
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 5. HOW IT WORKS (3 SIMPLE STEPS) */}
      <section className="bg-[#eff4ff] py-16 sm:py-20 border-y border-[#bfdbfe]/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          
          <div className="text-center max-w-xl mx-auto space-y-2">
            <span className="text-xs font-bold text-[#006c49] uppercase font-mono tracking-wider">
              Simple 3-Step Process
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0b1c30] tracking-tight">
              From search to match point in minutes
            </h2>
            <p className="text-xs text-slate-600">
              No phone calls, no advance WhatsApp bank transfers, no double-booked courts.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="p-6 space-y-3 bg-white border-slate-200">
              <div className="w-10 h-10 rounded-xl bg-[#006c49] text-white flex items-center justify-center font-bold text-sm">
                01
              </div>
              <h3 className="text-base font-bold text-[#0b1c30]">Choose Your Club &amp; Sport</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Filter verified sports complexes by city, court surface, floodlights, and locker amenities with upfront pricing.
              </p>
            </Card>

            <Card className="p-6 space-y-3 bg-white border-slate-200">
              <div className="w-10 h-10 rounded-xl bg-[#006c49] text-white flex items-center justify-center font-bold text-sm">
                02
              </div>
              <h3 className="text-base font-bold text-[#0b1c30]">Select Time &amp; Reserve</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Pick an available hourly slot from 06:00 to 22:00 on the live court grid. Member discounts apply automatically.
              </p>
            </Card>

            <Card className="p-6 space-y-3 bg-white border-slate-200">
              <div className="w-10 h-10 rounded-xl bg-[#006c49] text-white flex items-center justify-center font-bold text-sm">
                03
              </div>
              <h3 className="text-base font-bold text-[#0b1c30]">Show QR Pass &amp; Play</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Receive an instant confirmation pass. Show your code at the front desk when you arrive and step onto the court.
              </p>
            </Card>
          </div>

        </div>
      </section>

      {/* 6. MEMBERSHIP BENEFITS SECTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl p-8 sm:p-12 bg-gradient-to-br from-[#006c49] to-[#0b1c30] text-white shadow-xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          <div className="lg:col-span-7 space-y-4">
            <span className="text-xs font-bold text-emerald-200 uppercase font-mono tracking-wider">
              Club Memberships
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
              Save up to 50% on every court booking
            </h2>
            <p className="text-sm text-emerald-100 max-w-lg leading-relaxed">
              Frequent player? Join an annual club plan to unlock half-price court slots, free monthly coaching sessions, discounted gear rentals, and front-desk credit tabs.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2 text-xs">
              <div className="bg-white/10 rounded-xl p-3 backdrop-blur-xs">
                <span className="text-[10px] text-emerald-200 block uppercase">Gold Plan</span>
                <strong className="text-sm font-bold text-white">50% OFF Courts</strong>
              </div>
              <div className="bg-white/10 rounded-xl p-3 backdrop-blur-xs">
                <span className="text-[10px] text-emerald-200 block uppercase">Silver Plan</span>
                <strong className="text-sm font-bold text-white">25% OFF Courts</strong>
              </div>
              <div className="bg-white/10 rounded-xl p-3 backdrop-blur-xs">
                <span className="text-[10px] text-emerald-200 block uppercase">Junior Pass</span>
                <strong className="text-sm font-bold text-white">30% OFF Courts</strong>
              </div>
            </div>

            <div className="pt-2">
              <Link to="/club/skyline-sports/memberships">
                <Button variant="secondary" size="md" rightIcon={<ArrowRight className="w-4 h-4" />}>
                  Explore Membership Plans
                </Button>
              </Link>
            </div>
          </div>

          <div className="lg:col-span-5 bg-white text-[#0b1c30] rounded-2xl p-6 shadow-md space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <span className="text-xs font-bold uppercase font-mono text-[#006c49]">Membership Spotlight</span>
              <Badge variant="emerald">Featured Plan</Badge>
            </div>

            <div>
              <h3 className="text-lg font-bold">Gold Member Annual Pass</h3>
              <p className="text-xs text-slate-500">Skyline Sports Association</p>
              <div className="text-2xl font-black text-[#0b1c30] mt-2">
                ₹9,999 <span className="text-xs font-normal text-slate-500">/ year</span>
              </div>
            </div>

            <div className="space-y-2 text-xs text-slate-600 border-t border-slate-100 pt-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#006c49] shrink-0" />
                <span>50% discount on all court bookings</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#006c49] shrink-0" />
                <span>4 complimentary coaching sessions / month</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#006c49] shrink-0" />
                <span>₹2,000 Pay Later front desk credit line</span>
              </div>
            </div>

            <Link to="/club/skyline-sports/memberships" className="block pt-1">
              <Button variant="primary" size="sm" className="w-full">
                View Plan Details
              </Button>
            </Link>
          </div>

        </div>
      </section>

      {/* 7. CLUB OWNERS SECTION */}
      <section id="club-owners" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          
          <div className="lg:col-span-6 space-y-5">
            <Badge variant="blue" icon={<Building className="w-3.5 h-3.5" />}>
              For Club Management
            </Badge>

            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#0b1c30] tracking-tight">
              Manage your sports venue with zero headache
            </h2>

            <p className="text-sm text-slate-600 leading-relaxed">
              SportsHub provides venue owners with dedicated operational tools to manage courts, membership tiers, walk-in counter sales, staff shifts, and payouts.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 text-xs">
              <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-xs space-y-1">
                <strong className="text-sm font-bold text-[#0b1c30] block">Court Matrix &amp; Walk-ins</strong>
                <p className="text-slate-500">Live reception terminal to check in players and book walk-ins.</p>
              </div>

              <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-xs space-y-1">
                <strong className="text-sm font-bold text-[#0b1c30] block">Dynamic Pricing Engine</strong>
                <p className="text-slate-500">Configure peak hours and discounts to maximize court occupancy.</p>
              </div>

              <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-xs space-y-1">
                <strong className="text-sm font-bold text-[#0b1c30] block">Pro Shop &amp; Canteen</strong>
                <p className="text-slate-500">Unified inventory for gear sales and kitchen food orders.</p>
              </div>

              <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-xs space-y-1">
                <strong className="text-sm font-bold text-[#0b1c30] block">Staff &amp; Coach Roster</strong>
                <p className="text-slate-500">Track coach training hours, employee shifts, and monthly payouts.</p>
              </div>
            </div>

            <div className="pt-2">
              <Link to="/register/club">
                <Button variant="primary" size="md" rightIcon={<ArrowRight className="w-4 h-4" />}>
                  Register Your Club Today
                </Button>
              </Link>
            </div>
          </div>

          <div className="lg:col-span-6 bg-slate-100 rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-inner">
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-[#006c49] text-white flex items-center justify-center font-bold text-xs">
                    SH
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-[#0b1c30]">Owner Management Console</h4>
                    <span className="text-[10px] text-slate-400">Skyline Sports Club</span>
                  </div>
                </div>
                <Badge variant="emerald">Live Shift</Badge>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-slate-400 text-[10px] uppercase font-mono block">Today&apos;s Bookings</span>
                  <strong className="text-base font-bold text-[#0b1c30]">18 Courts Booked</strong>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-slate-400 text-[10px] uppercase font-mono block">Court Occupancy</span>
                  <strong className="text-base font-bold text-[#006c49]">85% Peak</strong>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-[#eff4ff] border border-[#bfdbfe]/50 text-xs text-slate-600 flex items-center justify-between">
                <span>Want to see how club staff and owner terminals work?</span>
                <Link to="/login" className="text-xs font-bold text-[#006c49] hover:underline">
                  Sign in →
                </Link>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* 8. FAQ ACCORDION SECTION */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="text-center space-y-2">
          <Badge variant="slate">Support &amp; Answers</Badge>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0b1c30] tracking-tight">
            Frequently Asked Questions
          </h2>
          <p className="text-xs text-slate-600">
            Everything you need to know about court reservations, memberships, and club guidelines.
          </p>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, idx) => {
            const isOpen = faqOpenIndex === idx;
            return (
              <Card
                key={idx}
                padded="sm"
                className="overflow-hidden cursor-pointer"
                onClick={() => setFaqOpenIndex(isOpen ? null : idx)}
              >
                <div className="flex items-center justify-between p-2">
                  <h3 className="text-sm font-bold text-[#0b1c30]">{faq.q}</h3>
                  <ChevronDown
                    className={`w-4 h-4 text-slate-400 transition-transform ${
                      isOpen ? 'rotate-180 text-[#006c49]' : ''
                    }`}
                  />
                </div>
                {isOpen && (
                  <div className="px-2 pb-2 pt-1 text-xs text-slate-600 leading-relaxed border-t border-slate-100 mt-2">
                    {faq.a}
                  </div>
                )}
              </Card>
            );
          })}
        </div>

        <div className="text-center text-xs text-slate-500 pt-4">
          Have more questions?{' '}
          <Link to="/contact" className="text-[#006c49] font-bold hover:underline">
            Contact our sports team →
          </Link>
        </div>
      </section>

      {/* Account Required Modal for Booking (Issue 7) */}
      <Modal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        title="Account Required to Book Slot"
      >
        <div className="space-y-4 text-center py-2">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-[#ecfdf5] border border-[#a7f3d0] text-[#006c49] flex items-center justify-center font-bold text-xl">
            🔒
          </div>
          <h3 className="text-sm font-bold text-[#0b1c30]">
            Sign In or Create an Account First
          </h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            You must be signed in to reserve court slots, apply membership discounts, and receive your digital check-in QR pass. Please sign in or register to proceed.
          </p>
          <div className="grid grid-cols-2 gap-3 pt-2">
            <Button
              variant="outline"
              size="md"
              onClick={() => {
                setShowLoginModal(false);
                navigate('/register');
              }}
              className="w-full cursor-pointer text-xs"
            >
              Register First
            </Button>
            <Button
              variant="primary"
              size="md"
              onClick={() => {
                setShowLoginModal(false);
                navigate('/login');
              }}
              className="w-full cursor-pointer text-xs"
            >
              Sign In to Account
            </Button>
          </div>
        </div>
      </Modal>

    </div>
  );
}
