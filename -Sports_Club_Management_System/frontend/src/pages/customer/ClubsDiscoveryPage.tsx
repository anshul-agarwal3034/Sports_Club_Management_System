import React, { useState, useMemo, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search, MapPin, Trophy, ShieldCheck, Star, SlidersHorizontal, ArrowRight, Navigation, Compass, AlertCircle } from 'lucide-react';
import { getAllClubs, DetailedClub } from '@/lib/clubsData';
import { api } from '@/services/api';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';

const SPORT_OPTIONS = [
  { id: 'all', label: 'All Sports' },
  { id: 'padel', label: 'Padel' },
  { id: 'badminton', label: 'Badminton' },
  { id: 'tennis', label: 'Tennis' },
  { id: 'pickleball', label: 'Pickleball' },
  { id: 'football_turf', label: 'Football Turf' },
];

const CITY_OPTIONS = ['All Cities', 'Mumbai', 'Delhi', 'Bengaluru'];
const RADIUS_OPTIONS = [5, 10, 25, 50];

export default function ClubsDiscoveryPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialSport = searchParams.get('sport') || 'all';
  const initialCity = searchParams.get('city') || 'All Cities';
  const initialQuery = searchParams.get('q') || '';

  const [selectedSport, setSelectedSport] = useState<string>(initialSport);
  const [selectedCity, setSelectedCity] = useState<string>(initialCity);
  const [searchQuery, setSearchQuery] = useState<string>(initialQuery);

  // Geo search states
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [radiusKm, setRadiusKm] = useState<number>(25);
  const [isLocating, setIsLocating] = useState(false);
  const [geoResults, setGeoResults] = useState<any[] | null>(null);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [dbClubs, setDbClubs] = useState<DetailedClub[]>([]);

  useEffect(() => {
    api.getClubs().then((fetched) => {
      if (Array.isArray(fetched) && fetched.length > 0) {
        const merged: DetailedClub[] = fetched.map((fc: any) => {
          const slug = fc.slug || fc.name?.toLowerCase().replace(/[^a-z0-9]+/g, '-');
          const existing = getAllClubs().find((c) => c.slug === slug || c.id === fc.id);
          return existing || {
            id: fc.id,
            slug,
            name: fc.name,
            city: fc.city || 'Mumbai',
            locality: fc.address?.split(',')[0] || 'Main Sports Complex',
            address: fc.address || '',
            phone: fc.phone || '+91 98765 43210',
            email: fc.email || 'club@sportshub.in',
            openingHours: '06:00 AM – 10:00 PM Daily',
            isVerified: fc.is_verified || false,
            rating: fc.rating || 4.8,
            reviewCount: fc.review_count || 12,
            startingPrice: 500,
            sports: ['padel', 'badminton'],
            images: fc.images?.length ? fc.images : ['https://images.unsplash.com/photo-1554068865-24cecd4e34b8?auto=format&fit=crop&w=800&q=80'],
            description: fc.description || 'Modern sports arena equipped with professional courts.',
            amenities: [
              { name: 'Parking', icon: 'Car', description: 'Free parking on premises' },
              { name: 'Showers', icon: 'Wind', description: 'Clean changing facilities' },
            ],
            courts: [],
            memberships: [],
          };
        });
        setDbClubs(merged);
      }
    }).catch(() => {});
  }, []);

  const allClubs = dbClubs.length > 0 ? dbClubs : getAllClubs();

  // Trigger geo search when coords or filters change
  useEffect(() => {
    if (userCoords) {
      handleSearchByCoords(userCoords.lat, userCoords.lng, radiusKm, selectedSport);
    }
  }, [userCoords, radiusKm, selectedSport]);

  const handleRequestLocation = () => {
    setGeoError(null);
    if (!navigator.geolocation) {
      setGeoError('Geolocation is not supported by your browser. Using city filter instead.');
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocating(false);
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserCoords(coords);
      },
      (err) => {
        setIsLocating(false);
        setGeoError('Location permission denied or unavailable. You can search manually by City and Area.');
      },
      { timeout: 10000 }
    );
  };

  const handleSearchByCoords = async (lat: number, lng: number, radius: number, sport: string) => {
    try {
      const results = await api.searchClubsGeo({
        lat,
        lng,
        radiusKm: radius,
        sport: sport !== 'all' ? sport : undefined,
      });
      setGeoResults(results || []);
    } catch (e) {
      setGeoResults(null);
    }
  };

  const filteredClubs = useMemo(() => {
    // If geo search is active, merge backend distances and rating badges
    if (geoResults && userCoords) {
      return geoResults.map((g) => {
        const localMatch = allClubs.find((c) => c.slug === g.slug || c.name.toLowerCase() === g.name.toLowerCase());
        return {
          ...(localMatch || {}),
          id: g.id || localMatch?.id,
          name: g.name,
          slug: g.slug || localMatch?.slug || 'club',
          locality: g.locality || localMatch?.locality,
          city: g.city || localMatch?.city,
          sports: g.sports || localMatch?.sports || [],
          startingPrice: g.min_price || localMatch?.startingPrice || 600,
          rating_badge: g.rating_badge,
          distance_km: g.distance_km,
          description: localMatch?.description || 'Premier sports facility with tournament grade courts.',
          images: localMatch?.images || ['https://images.unsplash.com/photo-1554068865-24cecd4e34b8?auto=format&fit=crop&w=800&q=80'],
          rating: localMatch?.rating || 4.8,
          reviewCount: localMatch?.reviewCount || 42,
          isVerified: true,
        };
      });
    }

    return allClubs.filter((club) => {
      // Filter by city
      if (selectedCity !== 'All Cities' && club.city.toLowerCase() !== selectedCity.toLowerCase()) {
        return false;
      }
      // Filter by sport
      if (selectedSport !== 'all' && !club.sports.includes(selectedSport as any)) {
        return false;
      }
      // Filter by text query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = club.name.toLowerCase().includes(q);
        const matchesLoc = club.locality.toLowerCase().includes(q) || club.address.toLowerCase().includes(q);
        const matchesSport = club.sports.some((s) => s.toLowerCase().includes(q));
        if (!matchesName && !matchesLoc && !matchesSport) return false;
      }
      return true;
    });
  }, [allClubs, selectedCity, selectedSport, searchQuery, geoResults, userCoords]);

  const handleResetFilters = () => {
    setSelectedSport('all');
    setSelectedCity('All Cities');
    setSearchQuery('');
    setUserCoords(null);
    setGeoResults(null);
    setGeoError(null);
    setSearchParams({});
  };

  const renderRatingBadge = (badge?: string) => {
    if (badge === 'PLATINUM') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-900 text-amber-300 border border-amber-400/50 text-[10px] font-bold uppercase tracking-wider shadow-xs">
          ★ Platinum Club
        </span>
      );
    }
    if (badge === 'SILVER') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-300 text-[10px] font-bold uppercase tracking-wider">
          ★ Silver Club
        </span>
      );
    }
    if (badge === 'BRONZE') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-bold uppercase tracking-wider">
          ★ Bronze Club
        </span>
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-[#f8f9ff] py-10 selection:bg-[#006c49] selection:text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Page Header */}
        <div className="space-y-2">
          <Badge variant="emerald" icon={<Trophy className="w-3.5 h-3.5" />}>
            Verified Partner Clubs
          </Badge>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#0b1c30] tracking-tight">
            Find Sports Venues &amp; Book Courts
          </h1>
          <p className="text-sm text-slate-600 max-w-2xl leading-relaxed">
            Explore verified sports facilities in Mumbai, Delhi, and Bengaluru. Browse courts, compare amenities, and book available hourly slots with member discounts.
          </p>
        </div>

        {/* Multi-Club Discovery Note */}
        <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200/80 text-xs text-emerald-950 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-2xs">
          <div className="flex items-center gap-2">
            <Compass className="w-4 h-4 text-[#006c49] shrink-0" />
            <span>
              <strong>Universal Discovery:</strong> Customers can join and play at multiple partner clubs without losing previous memberships. Member benefits remain club-specific.
            </span>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <Card padded="sm" className="bg-white shadow-xs border-slate-200">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 p-2">
            
            {/* Search Input */}
            <div className="md:col-span-6 relative flex items-center">
              <Search className="w-4 h-4 absolute left-3.5 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by club name, area or sport..."
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-[#0b1c30] placeholder-slate-400 focus:bg-white focus:outline-none focus:border-[#006c49] focus:ring-2 focus:ring-[#006c49]/15 transition-all"
              />
            </div>

            {/* City Selector */}
            <div className="md:col-span-3 relative flex items-center">
              <MapPin className="w-4 h-4 absolute left-3.5 text-slate-400 pointer-events-none" />
              <select
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                className="w-full pl-10 pr-8 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-[#0b1c30] focus:bg-white focus:outline-none focus:border-[#006c49] focus:ring-2 focus:ring-[#006c49]/15 transition-all cursor-pointer"
              >
                {CITY_OPTIONS.map((city) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
              </select>
            </div>

            {/* Sport Selector */}
            <div className="md:col-span-3 relative flex items-center">
              <SlidersHorizontal className="w-4 h-4 absolute left-3.5 text-slate-400 pointer-events-none" />
              <select
                value={selectedSport}
                onChange={(e) => setSelectedSport(e.target.value)}
                className="w-full pl-10 pr-8 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-[#0b1c30] focus:bg-white focus:outline-none focus:border-[#006c49] focus:ring-2 focus:ring-[#006c49]/15 transition-all cursor-pointer"
              >
                {SPORT_OPTIONS.map((sp) => (
                  <option key={sp.id} value={sp.id}>
                    {sp.label}
                  </option>
                ))}
              </select>
            </div>

          </div>

          {/* Quick Sport Category Pills & Geo Location Controls */}
          <div className="pt-3 px-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 overflow-x-auto scrollbar-none">
              <span className="text-xs text-slate-500 font-medium shrink-0">Sport:</span>
              {SPORT_OPTIONS.map((sp) => {
                const active = selectedSport === sp.id;
                return (
                  <button
                    key={sp.id}
                    onClick={() => setSelectedSport(sp.id)}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-all shrink-0 cursor-pointer ${
                      active
                        ? 'bg-[#006c49] text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80'
                    }`}
                  >
                    {sp.label}
                  </button>
                );
              })}
            </div>

            {/* GPS Radius Controls */}
            <div className="flex items-center gap-2 shrink-0">
              <Button
                variant={userCoords ? 'primary' : 'outline'}
                size="sm"
                isLoading={isLocating}
                onClick={handleRequestLocation}
                className="text-xs cursor-pointer"
              >
                <Navigation className="w-3.5 h-3.5 mr-1" />
                {userCoords ? 'Near Me (GPS Active)' : 'Near Me (GPS)'}
              </Button>

              {userCoords && (
                <div className="flex items-center gap-1 text-xs text-slate-600 bg-slate-50 px-2 py-1 rounded-lg border border-slate-200">
                  <span className="text-[11px] font-medium text-slate-500">Radius:</span>
                  {RADIUS_OPTIONS.map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setRadiusKm(r)}
                      className={`px-1.5 py-0.5 rounded text-[11px] font-bold cursor-pointer transition-all ${
                        radiusKm === r ? 'bg-[#006c49] text-white' : 'text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {r}km
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {geoError && (
            <div className="mt-2 mx-2 p-2 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-500" />
              <span>{geoError}</span>
            </div>
          )}
        </Card>

        {/* Club Count Header */}
        <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
          <span>
            Showing <strong className="text-[#0b1c30]">{filteredClubs.length}</strong>{' '}
            {filteredClubs.length === 1 ? 'sports club' : 'sports clubs'}
            {userCoords && ` within ${radiusKm}km`}
          </span>
          {(selectedSport !== 'all' || selectedCity !== 'All Cities' || searchQuery || userCoords) && (
            <button
              onClick={handleResetFilters}
              className="text-[#006c49] hover:underline font-semibold cursor-pointer"
            >
              Clear all filters
            </button>
          )}
        </div>

        {/* Clubs Grid */}
        {filteredClubs.length === 0 ? (
          <EmptyState
            icon={<Search className="w-6 h-6 text-slate-400" />}
            title="No sports clubs matched your search"
            description="Try changing your city, expanding the distance radius, or clearing filters."
            actionLabel="Reset Filters"
            onAction={handleResetFilters}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredClubs.map((club: any) => (
              <div
                key={club.id}
                className="sports-card sports-card-hover overflow-hidden flex flex-col group"
              >
                {/* Image & Badges */}
                <div className="relative h-48 w-full overflow-hidden bg-slate-100">
                  <img
                    src={club.images?.[0] || 'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?auto=format&fit=crop&w=800&q=80'}
                    alt={club.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                  <div className="absolute top-3 left-3 flex flex-col items-start gap-1">
                    {renderRatingBadge(club.rating_badge)}
                    {club.isVerified && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/95 text-[#006c49] text-[10px] font-semibold shadow-xs">
                        <ShieldCheck className="w-3 h-3" /> Verified Club
                      </span>
                    )}
                  </div>
                  <div className="absolute top-3 right-3">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/95 text-slate-800 text-[11px] font-bold shadow-xs">
                      <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                      {club.rating || 4.8} ({club.reviewCount || 36})
                    </span>
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div>
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
                      <MapPin className="w-3.5 h-3.5 text-[#006c49] shrink-0" />
                      <span>
                        {club.distance_km != null ? (
                          <strong className="text-[#006c49] font-bold">
                            {club.distance_km} km away •{' '}
                          </strong>
                        ) : null}
                        {club.locality}, {club.city}
                      </span>
                    </div>

                    <h3 className="text-lg font-bold text-[#0b1c30] group-hover:text-[#006c49] transition-colors leading-snug">
                      {club.name}
                    </h3>

                    <p className="mt-1.5 text-xs text-slate-600 line-clamp-2 leading-relaxed">
                      {club.description}
                    </p>

                    {/* Sports tags */}
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {(club.sports || []).map((sp: string) => (
                        <span
                          key={sp}
                          className="px-2 py-0.5 rounded-md bg-[#eff4ff] text-[#1e40af] text-[10px] font-medium uppercase tracking-wide"
                        >
                          {sp.replace('_', ' ')}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Price & Action */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      <span className="text-[11px] text-slate-500 block">Courts from</span>
                      <div className="text-base font-extrabold text-[#0b1c30]">
                        ₹{club.startingPrice}
                        <span className="text-xs font-normal text-slate-500"> / hour</span>
                      </div>
                    </div>

                    <Link
                      to={`/club/${club.id || club.slug}`}
                      className="inline-flex items-center gap-1 px-3.5 py-2 rounded-xl bg-[#006c49] text-white hover:bg-[#005237] text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                    >
                      <span>View &amp; Book</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>

                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
