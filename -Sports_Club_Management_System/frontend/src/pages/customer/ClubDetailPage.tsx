import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  MapPin,
  Clock,
  Phone,
  Mail,
  ShieldCheck,
  Star,
  Calendar,
  Award,
  ShoppingBag,
  ArrowRight,
  ChevronRight,
  Sun,
  Shield,
  Lock,
  Coffee,
  Car,
  Wind,
  Wifi,
  Info
} from 'lucide-react';
import { getClubBySlug, fetchLiveClubBySlug, DetailedClub } from '@/lib/clubsData';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';

export default function ClubDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const [club, setClub] = useState<DetailedClub | undefined>(slug ? getClubBySlug(slug) : undefined);
  const [isLoading, setIsLoading] = useState(!club);
  const [selectedPhoto, setSelectedPhoto] = useState(0);

  useEffect(() => {
    if (slug) {
      fetchLiveClubBySlug(slug).then((resClub) => {
        if (resClub) setClub(resClub);
        setIsLoading(false);
      });
    } else {
      setIsLoading(false);
    }
  }, [slug]);

  if (isLoading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-6 bg-[#f8f9ff]">
        <div className="text-center space-y-2">
          <div className="w-8 h-8 border-2 border-[#006c49] border-t-transparent rounded-full animate-spin mx-auto" />
          <div className="text-xs text-slate-500 font-medium">Loading sports facility details...</div>
        </div>
      </div>
    );
  }

  if (!club) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-6 bg-[#f8f9ff]">
        <EmptyState
          icon={<Info className="w-8 h-8 text-slate-400" />}
          title="Sports club not found"
          description={`We couldn't find a sports venue matching "${slug}". It may have been renamed or removed.`}
          actionLabel="Browse Available Clubs"
          onAction={() => (window.location.href = '/clubs')}
        />
      </div>
    );
  }

  const getAmenityIcon = (iconName: string) => {
    switch (iconName) {
      case 'Sun': return <Sun className="w-4 h-4 text-[#006c49]" />;
      case 'Shield': return <Shield className="w-4 h-4 text-[#006c49]" />;
      case 'Lock': return <Lock className="w-4 h-4 text-[#006c49]" />;
      case 'Coffee': return <Coffee className="w-4 h-4 text-[#006c49]" />;
      case 'Award': return <Award className="w-4 h-4 text-[#006c49]" />;
      case 'Car': return <Car className="w-4 h-4 text-[#006c49]" />;
      case 'Wind': return <Wind className="w-4 h-4 text-[#006c49]" />;
      case 'Wifi': return <Wifi className="w-4 h-4 text-[#006c49]" />;
      default: return <ShieldCheck className="w-4 h-4 text-[#006c49]" />;
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f9ff] py-8 selection:bg-[#006c49] selection:text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Breadcrumb Navigation */}
        <nav className="flex items-center gap-1.5 text-xs text-slate-500">
          <Link to="/" className="hover:text-[#006c49]">Home</Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <Link to="/clubs" className="hover:text-[#006c49]">Clubs</Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-[#0b1c30] font-medium truncate">{club.name}</span>
        </nav>

        {/* Club Header Summary */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-200">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              {club.isVerified && (
                <Badge variant="emerald" icon={<ShieldCheck className="w-3.5 h-3.5" />}>
                  Verified Facility
                </Badge>
              )}
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 text-xs font-semibold border border-amber-200">
                <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                {club.rating} ({club.reviewCount} player ratings)
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-extrabold text-[#0b1c30] tracking-tight">
              {club.name}
            </h1>

            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 pt-1">
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-[#006c49]" />
                {club.address}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-[#006c49]" />
                {club.openingHours}
              </span>
            </div>
          </div>

          {/* Quick Action CTA Pill */}
          <div className="flex flex-wrap items-center gap-3">
            <Link to={`/club/${club.slug}/memberships`}>
              <Button variant="outline" size="md">
                Memberships
              </Button>
            </Link>
            <Link to={`/club/${club.slug}/shop`}>
              <Button variant="secondary" size="md" leftIcon={<ShoppingBag className="w-4 h-4" />}>
                Club Shop
              </Button>
            </Link>
            <Link to={`/club/${club.slug}/book`}>
              <Button variant="primary" size="md" rightIcon={<ArrowRight className="w-4 h-4" />}>
                Book a Court
              </Button>
            </Link>
          </div>
        </div>

        {/* Photo Gallery Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          <div className="md:col-span-8 rounded-2xl overflow-hidden bg-slate-100 h-80 sm:h-96 border border-slate-200 shadow-sm relative">
            <img
              src={club.images[selectedPhoto] || club.images[0]}
              alt={`${club.name} view`}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="md:col-span-4 flex flex-col gap-3">
            {club.images.map((img, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setSelectedPhoto(idx)}
                className={`relative flex-1 rounded-xl overflow-hidden border-2 transition-all cursor-pointer ${
                  selectedPhoto === idx ? 'border-[#006c49] shadow-sm' : 'border-transparent opacity-80 hover:opacity-100'
                }`}
              >
                <img src={img} alt={`${club.name} thumb ${idx + 1}`} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>

        {/* 2-Column Content: Left Details, Right Booking Action Box */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Courts, Amenities, About */}
          <div className="lg:col-span-8 space-y-8">
            
            {/* About Venue */}
            <Card>
              <h2 className="text-xl font-bold text-[#0b1c30] mb-3">About the Club</h2>
              <p className="text-sm text-slate-600 leading-relaxed">
                {club.description}
              </p>
              
              <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap gap-2">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide mr-2 self-center">
                  Sports Available:
                </span>
                {club.sports.map((sp) => (
                  <span
                    key={sp}
                    className="px-2.5 py-1 rounded-md bg-[#eff4ff] text-[#1e40af] text-xs font-semibold uppercase"
                  >
                    {sp.replace('_', ' ')}
                  </span>
                ))}
              </div>
            </Card>

            {/* Available Courts */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-[#0b1c30]">
                  Courts &amp; Playing Surfaces ({club.courts.length})
                </h2>
                <Link
                  to={`/club/${club.slug}/book`}
                  className="text-xs text-[#006c49] hover:underline font-semibold"
                >
                  Check Slot Availability →
                </Link>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {club.courts.map((court) => (
                  <Card key={court.id} padded="sm" className="space-y-3 flex flex-col justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[#006c49] uppercase font-mono">
                          {court.sport}
                        </span>
                        <span className="text-[11px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                          {court.isIndoor ? 'Indoor' : 'Outdoor'}
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-[#0b1c30]">{court.name}</h3>
                      <p className="text-xs text-slate-500 leading-relaxed">{court.surface}</p>
                      <p className="text-xs text-slate-600">{court.description}</p>
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                      <div className="text-sm font-bold text-[#0b1c30]">
                        ₹{court.basePrice}
                        <span className="text-xs font-normal text-slate-500"> / hr</span>
                      </div>
                      <Link
                        to={`/club/${club.slug}/book?court=${court.id}`}
                        className="text-xs font-semibold text-[#006c49] hover:underline"
                      >
                        Reserve Slot →
                      </Link>
                    </div>
                  </Card>
                ))}
              </div>
            </div>

            {/* Amenities & Facilities */}
            <Card>
              <h2 className="text-xl font-bold text-[#0b1c30] mb-4">Club Amenities &amp; Services</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {club.amenities.map((item) => (
                  <div key={item.name} className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <div className="p-2 rounded-lg bg-white border border-slate-200 shrink-0">
                      {getAmenityIcon(item.icon)}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-[#0b1c30]">{item.name}</h4>
                      <p className="text-xs text-slate-500 mt-0.5">{item.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Cancellation Policy summary */}
            <Card className="bg-[#eff4ff] border-[#bfdbfe]/60">
              <h3 className="text-sm font-bold text-[#0b1c30] flex items-center gap-1.5 mb-2">
                <Info className="w-4 h-4 text-[#1e40af]" /> Club Booking &amp; Cancellation Policy
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                • Cancellations made <strong>more than 24 hours</strong> before the booking start time receive a 100% refund.<br />
                • Cancellations made <strong>between 2 and 24 hours</strong> before start time receive a 50% partial refund.<br />
                • Cancellations made <strong>under 2 hours</strong> before the booking are non-refundable.<br />
                • Players must carry non-marking indoor shoes for wooden badminton courts.
              </p>
            </Card>

          </div>

          {/* Right Column: Sticky Booking / Membership Card */}
          <div className="lg:col-span-4 sticky top-24 space-y-4">
            <Card className="shadow-md border-slate-200 p-6 space-y-5">
              <div className="space-y-1">
                <span className="text-xs text-slate-500 font-medium">Standard Court Rate</span>
                <div className="text-2xl font-black text-[#0b1c30]">
                  ₹{club.startingPrice} – ₹700
                  <span className="text-xs font-normal text-slate-500"> / hr</span>
                </div>
                <p className="text-xs text-[#006c49] font-medium pt-0.5">
                  Members save up to 50% on all courts
                </p>
              </div>

              <div className="space-y-2.5 pt-3 border-t border-slate-100">
                <Link to={`/club/${club.slug}/book`} className="block">
                  <Button variant="primary" size="lg" className="w-full">
                    Book a Court Slot
                  </Button>
                </Link>
                <Link to={`/club/${club.slug}/memberships`} className="block">
                  <Button variant="secondary" size="md" className="w-full">
                    View Membership Plans
                  </Button>
                </Link>
              </div>

              <div className="pt-4 border-t border-slate-100 space-y-2 text-xs text-slate-500">
                <div className="flex items-center justify-between">
                  <span>Operating Hours</span>
                  <span className="font-medium text-[#0b1c30]">{club.openingHours}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Contact Phone</span>
                  <span className="font-medium text-[#0b1c30]">{club.phone}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Email Support</span>
                  <span className="font-medium text-[#0b1c30]">{club.email}</span>
                </div>
              </div>
            </Card>

            {/* Club Shop Promo */}
            <Card className="bg-white border-slate-200 p-5 space-y-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-[#ecfdf5] text-[#006c49]">
                  <ShoppingBag className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-[#0b1c30]">On-site Sports Shop</h4>
                  <p className="text-[11px] text-slate-500">Rent rackets &amp; buy fresh gear</p>
                </div>
              </div>
              <Link to={`/club/${club.slug}/shop`} className="block">
                <Button variant="outline" size="sm" className="w-full text-xs">
                  Browse Club Store →
                </Button>
              </Link>
            </Card>
          </div>

        </div>

      </div>
    </div>
  );
}
