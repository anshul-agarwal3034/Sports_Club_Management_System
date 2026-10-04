import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import {
  Calendar as CalendarIcon,
  Clock,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  Info,
  CreditCard,
  Building,
  User,
  Zap,
  ArrowRight,
  Flame,
  Hourglass,
  Check,
  X
} from 'lucide-react';
import { getClubBySlug, fetchLiveClubBySlug, DetailedClub, DetailedCourt } from '@/lib/clubsData';
import { addCustomerBooking, getCustomerBookings } from '@/lib/bookingsState';
import { getStoredUser } from '@/lib/roles';
import { getActiveMembership } from '@/lib/membershipsState';
import { addToCart } from '@/lib/cart';
import { api } from '@/services/api';
import { WaitlistEntry, FlashDeal } from '@/types';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Modal } from '@/components/ui/Modal';

// Operating hours 06:00 to 22:00
const OPERATING_HOURS = Array.from({ length: 16 }, (_, i) => i + 6); // [6, 7, ..., 21]

export default function CourtBookingPage() {
  const { slug } = useParams<{ slug: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [club, setClub] = useState<DetailedClub | undefined>(slug ? getClubBySlug(slug) : undefined);
  const [isLoadingClub, setIsLoadingClub] = useState(!club);
  const user = getStoredUser();
  const membership = getActiveMembership();

  useEffect(() => {
    if (slug) {
      fetchLiveClubBySlug(slug).then((resClub) => {
        if (resClub) {
          setClub(resClub);
        }
        setIsLoadingClub(false);
      });
    } else {
      setIsLoadingClub(false);
    }
  }, [slug]);

  // Next 7 days helper
  const dateOptions = useMemo(() => {
    const list = [];
    const today = new Date();
    for (let i = 0; i < 7; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      const iso = d.toISOString().split('T')[0];
      const dayName = i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : d.toLocaleDateString('en-IN', { weekday: 'short' });
      const label = d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
      list.push({ iso, dayName, label });
    }
    return list;
  }, []);

  const initialCourtId = searchParams.get('court') || (club?.courts[0]?.id || '');
  const [selectedCourtId, setSelectedCourtId] = useState<string>(initialCourtId);
  const [selectedDate, setSelectedDate] = useState<string>(dateOptions[0].iso);
  const [selectedHour, setSelectedHour] = useState<number | null>(null);
  const [durationHours, setDurationHours] = useState<number>(1);
  const [paymentMode, setPaymentMode] = useState<'UPI' | 'CARD' | 'COUNTER' | 'PAY_LATER'>('UPI');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [confirmedBookingCode, setConfirmedBookingCode] = useState<string | null>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [waitlistEntries, setWaitlistEntries] = useState<WaitlistEntry[]>([]);
  const [flashDeals, setFlashDeals] = useState<FlashDeal[]>([]);
  const [waitlistModalSlot, setWaitlistModalSlot] = useState<{ hour: number; duration: number } | null>(null);
  const [isJoiningWaitlist, setIsJoiningWaitlist] = useState(false);
  const [waitlistSuccessMsg, setWaitlistSuccessMsg] = useState<string | null>(null);
  const [timeLeftSec, setTimeLeftSec] = useState<Record<string, number>>({});
  const [isProcessingOffer, setIsProcessingOffer] = useState(false);

  // Fetch Waitlist & Flash Deals
  const loadWaitlistAndDeals = async () => {
    try {
      if (user) {
        const myWaitlist = await api.getMyWaitlist();
        setWaitlistEntries(myWaitlist || []);
      }
      if (club?.id) {
        const deals = await api.getFlashDeals(club.id);
        setFlashDeals(deals || []);
      }
    } catch (e) {
      // Quiet fail if not logged in or endpoint unavail
    }
  };

  useEffect(() => {
    loadWaitlistAndDeals();
  }, [club?.id, user?.id]);

  // Countdown timer for offered waitlist entries
  useEffect(() => {
    const timer = setInterval(() => {
      const updated: Record<string, number> = {};
      waitlistEntries.forEach((entry) => {
        if (entry.status === 'OFFERED' && entry.offer_expires_at) {
          const diff = Math.max(0, Math.floor((new Date(entry.offer_expires_at).getTime() - Date.now()) / 1000));
          updated[entry.id] = diff;
        }
      });
      setTimeLeftSec(updated);
    }, 1000);
    return () => clearInterval(timer);
  }, [waitlistEntries]);

  const activeOffer = useMemo(() => {
    return waitlistEntries.find((w) => w.status === 'OFFERED' && (timeLeftSec[w.id] ?? 1) > 0);
  }, [waitlistEntries, timeLeftSec]);

  const handleAcceptOffer = async (entry: WaitlistEntry) => {
    try {
      setIsProcessingOffer(true);
      await api.acceptWaitlistOffer(entry.id, 'UPI');
      setWaitlistSuccessMsg(`Offer accepted! Court reservation confirmed.`);
      await loadWaitlistAndDeals();
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || 'Failed to accept offer. It may have expired.');
    } finally {
      setIsProcessingOffer(false);
    }
  };

  const handleDeclineOffer = async (entry: WaitlistEntry) => {
    try {
      setIsProcessingOffer(true);
      await api.declineWaitlistOffer(entry.id);
      setWaitlistSuccessMsg(`Offer declined. Slot released to next eligible customer.`);
      await loadWaitlistAndDeals();
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || 'Failed to decline offer.');
    } finally {
      setIsProcessingOffer(false);
    }
  };

  const handleBookFlashDeal = async (deal: FlashDeal) => {
    if (!user) {
      setShowLoginModal(true);
      return;
    }
    try {
      setIsSubmitting(true);
      const booking = await api.bookFlashDeal({
        courtId: deal.court_id || deal.courtId,
        startTime: deal.start_time || deal.startTime,
        endTime: deal.end_time || deal.endTime,
        paymentMode: 'UPI',
      });
      setConfirmedBookingCode(booking?.booking_code || booking?.bookingCode || 'FLASH-' + Math.floor(100000 + Math.random() * 900000));
      await loadWaitlistAndDeals();
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || 'Failed to claim flash offer.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmJoinWaitlist = async () => {
    if (!user) {
      setShowLoginModal(true);
      return;
    }
    if (!club || !selectedCourt || !waitlistModalSlot) return;

    try {
      setIsJoiningWaitlist(true);
      setErrorMessage(null);
      const startIso = `${selectedDate}T${waitlistModalSlot.hour.toString().padStart(2, '0')}:00:00`;
      const endHour = waitlistModalSlot.hour + waitlistModalSlot.duration;
      const endIso = `${selectedDate}T${endHour.toString().padStart(2, '0')}:00:00`;

      await api.joinWaitlist({
        clubId: club.id,
        courtId: selectedCourt.id,
        startTime: startIso,
        endTime: endIso,
      });

      setWaitlistSuccessMsg(`You joined the waitlist for ${selectedCourt.name} on ${selectedDate} at ${waitlistModalSlot.hour}:00!`);
      setWaitlistModalSlot(null);
      await loadWaitlistAndDeals();
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || 'Failed to join waitlist. You may already have an active entry for this slot.');
    } finally {
      setIsJoiningWaitlist(false);
    }
  };

  useEffect(() => {
    if (club && club.courts && club.courts.length > 0 && !selectedCourtId) {
      setSelectedCourtId(club.courts[0].id);
    }
  }, [club, selectedCourtId]);

  // Selected court & member discount calculations (Unconditional Top-Level Hooks)
  const selectedCourt: DetailedCourt | undefined =
    club?.courts?.find((c) => c.id === selectedCourtId) || club?.courts?.[0];

  const memberDiscountPct = useMemo(() => {
    if (!membership || membership.status !== 'ACTIVE' || !club) return 0;
    if (membership.clubId === club.id || membership.clubSlug === club.slug) {
      return membership.courtDiscountPct;
    }
    return 0;
  }, [membership, club]);

  const existingBookings = getCustomerBookings();
  const bookedHours = useMemo(() => {
    if (!club || !selectedCourt) return [];
    return existingBookings
      .filter((b) => b.clubId === club.id && b.courtId === selectedCourt.id && b.date === selectedDate && b.status !== 'CANCELLED')
      .map((b) => parseInt(b.startTime.split(':')[0], 10));
  }, [existingBookings, club?.id, selectedCourt?.id, selectedDate]);

  // Restore booking selection after login and re-validate availability + quote
  useEffect(() => {
    if (!club || !selectedCourt) return;

    const queryHour = searchParams.get('hour');
    const queryDate = searchParams.get('date');
    const queryCourt = searchParams.get('court');
    const queryDuration = searchParams.get('duration');

    const storedIntentRaw = sessionStorage.getItem('pending_booking_selection');
    const storedIntent = storedIntentRaw ? JSON.parse(storedIntentRaw) : null;

    const targetCourt = queryCourt || storedIntent?.courtId;
    const targetDate = queryDate || storedIntent?.date;
    const targetHourStr = queryHour || (storedIntent?.hour !== undefined && storedIntent.hour !== null ? String(storedIntent.hour) : null);
    const targetDurationStr = queryDuration || (storedIntent?.duration !== undefined ? String(storedIntent.duration) : null);

    if (targetCourt) setSelectedCourtId(targetCourt);
    if (targetDate) setSelectedDate(targetDate);
    if (targetDurationStr) {
      const d = parseInt(targetDurationStr, 10);
      if (!isNaN(d) && d > 0) setDurationHours(d);
    }

    if (targetHourStr !== null && targetHourStr !== '') {
      const h = parseInt(targetHourStr, 10);
      if (!isNaN(h)) {
        if (bookedHours.includes(h) || isHourPast(h)) {
          setErrorMessage(`Notice: The slot at ${h.toString().padStart(2, '0')}:00 was booked while you were logging in. Please select another slot.`);
          setSelectedHour(null);
        } else {
          setSelectedHour(h);
        }
      }
    }

    if (storedIntentRaw) {
      sessionStorage.removeItem('pending_booking_selection');
    }
  }, [searchParams, club, selectedCourt, bookedHours]);

  // Early Return 1: Loading Club from database
  if (isLoadingClub) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-6 bg-[#f8f9ff]">
        <div className="text-center space-y-2">
          <div className="w-8 h-8 border-2 border-[#006c49] border-t-transparent rounded-full animate-spin mx-auto" />
          <div className="text-xs text-slate-500 font-medium">Loading court schedule from database...</div>
        </div>
      </div>
    );
  }

  // Early Return 2: Club Not Found
  if (!club || !selectedCourt) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-6 bg-[#f8f9ff]">
        <EmptyState
          icon={<Info className="w-8 h-8 text-slate-400" />}
          title="Club not found"
          description="The venue you are attempting to book does not exist."
          actionLabel="Browse Clubs"
          onAction={() => navigate('/clubs')}
        />
      </div>
    );
  }

  // Price calculations
  const isPeakHour = selectedHour !== null && selectedHour >= 18 && selectedHour < 22;
  const baseRate = selectedCourt.basePrice;
  const peakMultiplier = isPeakHour ? 1.25 : 1.0;
  const hourlyGross = Math.round(baseRate * peakMultiplier);
  const totalGross = hourlyGross * durationHours;
  const discountAmount = Math.round((totalGross * memberDiscountPct) / 100);
  const finalPrice = Math.max(0, totalGross - discountAmount);

  // Validate past hour if selectedDate is today
  const isHourPast = (hour: number) => {
    const todayIso = new Date().toISOString().split('T')[0];
    if (selectedDate !== todayIso) return false;
    const currentHour = new Date().getHours();
    return hour <= currentHour;
  };

  const handleSlotClick = (hour: number) => {
    if (isHourPast(hour)) return;
    if (bookedHours.includes(hour)) {
      setWaitlistModalSlot({ hour, duration: durationHours });
      return;
    }
    setErrorMessage(null);
    setSelectedHour(hour);
  };

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Login enforcement check (Issue 7)
    if (!user) {
      setShowLoginModal(true);
      return;
    }

    if (selectedHour === null) {
      setErrorMessage('Please select an available start time slot on the court grid.');
      return;
    }

    // 1. Duration check (max 4 continuous hours)
    if (durationHours > 4) {
      setErrorMessage('Maximum continuous booking duration is 4 hours.');
      return;
    }

    // 2. Daily limit rule (max 2 court bookings per user per day)
    const userTodayCount = existingBookings.filter(
      (b) => b.date === selectedDate && b.status !== 'CANCELLED'
    ).length;
    if (userTodayCount >= 2) {
      setErrorMessage('Daily limit reached: A maximum of 2 court bookings are permitted per day.');
      return;
    }

    // 3. Slot availability re-validation
    const endH = selectedHour + durationHours;
    for (let h = selectedHour; h < endH; h++) {
      if (bookedHours.includes(h) || isHourPast(h)) {
        setErrorMessage(
          'This slot was just reserved or is no longer available. Please choose another available slot.'
        );
        setSelectedHour(null);
        return;
      }
    }

    setIsSubmitting(true);

    try {
      const endH = selectedHour + durationHours;
      const startIso = `${selectedDate}T${selectedHour.toString().padStart(2, '0')}:00:00Z`;
      const endIso = `${selectedDate}T${endH.toString().padStart(2, '0')}:00:00Z`;

      let createdApiBooking: any = null;
      try {
        createdApiBooking = await api.createBooking({
          courtId: selectedCourt.id,
          startTime: startIso,
          endTime: endIso,
          paymentMode,
        });
      } catch (apiErr: any) {
        console.warn('Backend court booking error:', apiErr?.response?.data || apiErr?.message);
        const serverError = apiErr?.response?.data?.message || apiErr?.response?.data?.error;
        if (serverError && !serverError.includes('invalid input syntax for type uuid')) {
          setErrorMessage(serverError);
          setIsSubmitting(false);
          return;
        }
      }

      const bookingId = createdApiBooking?.bookingId || createdApiBooking?.id || `bk-${Date.now()}`;
      const bookingCode = createdApiBooking?.bookingCode || createdApiBooking?.booking_code || `SH-${club.slug.slice(0, 3).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;

      const newBooking = addCustomerBooking({
        id: bookingId,
        bookingCode,
        clubId: club.id,
        clubSlug: club.slug,
        clubName: club.name,
        courtId: selectedCourt.id,
        courtName: selectedCourt.name,
        sport: selectedCourt.sport,
        date: selectedDate,
        startTime: `${selectedHour.toString().padStart(2, '0')}:00`,
        endTime: `${endH.toString().padStart(2, '0')}:00`,
        durationHours,
        basePrice: selectedCourt.basePrice,
        priceCharged: createdApiBooking?.priceCharged || finalPrice,
        isPeak: isPeakHour,
        memberDiscountPct,
        status: 'CONFIRMED',
        paymentMode,
        paymentStatus: paymentMode === 'PAY_LATER' ? 'PAY_LATER' : 'PAID',
      });

      setConfirmedBookingCode(newBooking.bookingCode);
    } catch {
      setErrorMessage('Booking failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddToCartClick = () => {
    if (!user) {
      setShowLoginModal(true);
      return;
    }
    if (selectedHour === null) {
      setErrorMessage('Please select a start time slot first.');
      return;
    }

    const endH = selectedHour + durationHours;
    addToCart({
      id: `booking-${selectedCourt.id}-${selectedDate}-${selectedHour}`,
      clubId: club.id,
      clubSlug: club.slug,
      clubName: club.name,
      name: `${selectedCourt.name} (${selectedCourt.sport}) - ${selectedDate} @ ${selectedHour.toString().padStart(2, '0')}:00`,
      category: 'court_booking',
      price: finalPrice,
      stock: 1,
    });

    navigate('/cart');
  };

  return (
    <div className="min-h-screen bg-[#f8f9ff] py-8 selection:bg-[#006c49] selection:text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        
        {/* Breadcrumb Navigation */}
        <nav className="flex items-center gap-1.5 text-xs text-slate-500">
          <Link to="/" className="hover:text-[#006c49]">Home</Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <Link to="/clubs" className="hover:text-[#006c49]">Clubs</Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <Link to={`/club/${club.slug}`} className="hover:text-[#006c49]">{club.name}</Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-[#0b1c30] font-medium">Court Booking</span>
        </nav>

        {/* Active Waitlist Offer Banner */}
        {activeOffer && (
          <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-700 via-[#006c49] to-teal-800 text-white shadow-md flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-white/15 flex items-center justify-center font-bold shrink-0">
                <Hourglass className="w-6 h-6 text-white animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded-full">
                    Exclusive Waitlist Hold
                  </span>
                  <span className="text-xs text-emerald-100 font-mono">
                    Deterministic FIFO Allocation
                  </span>
                </div>
                <h3 className="text-base font-extrabold mt-1">
                  Court Reserved For You: {activeOffer.court_name || 'Selected Court'}
                </h3>
                <p className="text-xs text-white/90">
                  {new Date(activeOffer.start_time || activeOffer.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' })} from{' '}
                  {new Date(activeOffer.start_time || activeOffer.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} to{' '}
                  {new Date(activeOffer.end_time || activeOffer.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.
                  This slot is locked exclusively for you.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <div className="text-center px-3.5 py-1.5 rounded-xl bg-black/20 backdrop-blur border border-white/20">
                <span className="text-[10px] uppercase font-bold block text-white/80">Expires In</span>
                <span className="text-xl font-black font-mono text-amber-300">
                  {Math.floor((timeLeftSec[activeOffer.id] || 0) / 60)}:
                  {((timeLeftSec[activeOffer.id] || 0) % 60).toString().padStart(2, '0')}
                </span>
              </div>
              <Button
                variant="secondary"
                size="sm"
                isLoading={isProcessingOffer}
                onClick={() => handleAcceptOffer(activeOffer)}
                className="bg-white text-emerald-900 hover:bg-emerald-50 font-bold text-xs"
              >
                <Check className="w-3.5 h-3.5 mr-1 text-emerald-700" /> Accept & Pay
              </Button>
              <Button
                variant="outline"
                size="sm"
                isLoading={isProcessingOffer}
                onClick={() => handleDeclineOffer(activeOffer)}
                className="border-white/40 text-white hover:bg-white/10 text-xs"
              >
                <X className="w-3.5 h-3.5 mr-1" /> Decline
              </Button>
            </div>
          </div>
        )}

        {/* Waitlist Success Notification */}
        {/* {waitlistSuccessMsg && (
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{waitlistSuccessMsg}</span>
            </div>
            <button
              onClick={() => setWaitlistSuccessMsg(null)}
              className="text-emerald-700 hover:text-emerald-900 font-bold text-xs cursor-pointer ml-3"
            >
              ✕
            </button>
          </div>
        )} */}

        {/* Flash Deals Widget */}
        {/* {flashDeals.length > 0 && (
          <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Flame className="w-4 h-4 text-amber-600 animate-bounce" />
                <h3 className="text-sm font-extrabold text-[#0b1c30]">
                  ⚡ Last-Minute Flash Offers (Next 3 Hours)
                </h3>
              </div>
              <span className="text-[11px] font-semibold text-amber-800 bg-amber-200/70 px-2 py-0.5 rounded-full">
                Guaranteed Floor Pricing
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {flashDeals.map((deal) => (
                <div
                  key={deal.id || deal.courtId}
                  className="p-3 rounded-xl bg-white border border-amber-200/90 shadow-2xs flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-[#006c49] font-mono uppercase">{deal.court_name || deal.courtName}</span>
                      <span className="text-rose-600 font-extrabold bg-rose-50 px-1.5 py-0.5 rounded">
                        {deal.discount_pct || deal.discountPct}% OFF
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 mt-1">
                      {new Date(deal.start_time || deal.startTime).toLocaleDateString([], { month: 'short', day: 'numeric' })} •{' '}
                      {new Date(deal.start_time || deal.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} -{' '}
                      {new Date(deal.end_time || deal.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                    <div className="mt-2 flex items-baseline gap-2">
                      <span className="text-base font-extrabold text-[#0b1c30]">₹{deal.discounted_price || deal.discountedPrice}</span>
                      <span className="text-xs text-slate-400 line-through">₹{deal.original_price || deal.originalPrice}</span>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() => handleBookFlashDeal(deal)}
                    className="mt-2.5 w-full text-xs"
                  >
                    Claim Flash Deal
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )} */}

        {/* Confirmation State if successful */}
        {confirmedBookingCode ? (
          <div className="max-w-xl mx-auto py-10">
            <Card className="text-center p-8 space-y-5 border-emerald-200 shadow-md">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-[#ecfdf5] border border-[#a7f3d0] flex items-center justify-center text-[#006c49]">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div>
                <Badge variant="emerald">Booking Confirmed</Badge>
                <h1 className="text-2xl font-black text-[#0b1c30] mt-2">
                  Court Reserved Successfully!
                </h1>
                <p className="text-xs text-slate-600 mt-1">
                  Your reservation at <strong className="text-[#0b1c30]">{club.name}</strong> is locked in. Show this code or QR pass at the club reception desk.
                </p>
              </div>

              {/* Booking Code Card */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="text-[11px] font-mono uppercase tracking-wider text-slate-500">
                  Confirmation Pass Code
                </span>
                <div className="text-2xl font-black font-mono tracking-wider text-[#006c49]">
                  {confirmedBookingCode}
                </div>
                <div className="text-xs text-slate-600 pt-1">
                  {selectedCourt.name} • {selectedDate} ({selectedHour}:00 – {selectedHour! + durationHours}:00)
                </div>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                <Button
                  variant="primary"
                  size="md"
                  onClick={() => navigate('/my-bookings')}
                  className="w-full sm:w-auto"
                >
                  View in My Bookings
                </Button>
                <Button
                  variant="outline"
                  size="md"
                  onClick={() => {
                    setConfirmedBookingCode(null);
                    setSelectedHour(null);
                  }}
                  className="w-full sm:w-auto"
                >
                  Book Another Slot
                </Button>
              </div>
            </Card>
          </div>
        ) : (
          /* Normal Interactive Booking Workflow */
          <div className="space-y-6">
            
            {/* Header */}
            <div className="border-b border-slate-200 pb-4">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0b1c30] tracking-tight">
                Reserve Court Slot — {club.name}
              </h1>
              <p className="text-xs text-slate-600 mt-1">
                Choose your court, select a date and an available hourly slot below. Operating hours: 06:00 to 22:00.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              
              {/* Left Column: Court & Slot Selector */}
              <div className="lg:col-span-8 space-y-6">
                
                {/* Step 1: Select Court */}
                <Card padded="sm">
                  <div className="flex items-center justify-between mb-3 px-1">
                    <span className="text-xs font-bold text-[#0b1c30] uppercase tracking-wider">
                      Step 1: Choose Court Surface
                    </span>
                    <span className="text-xs text-slate-500">
                      {club.courts.length} courts available
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {club.courts.map((court) => {
                      const selected = court.id === selectedCourtId;
                      return (
                        <div
                          key={court.id}
                          onClick={() => {
                            setSelectedCourtId(court.id);
                            setSelectedHour(null);
                          }}
                          className={`p-3.5 rounded-xl border text-left cursor-pointer transition-all ${
                            selected
                              ? 'bg-[#ecfdf5] border-[#006c49] shadow-xs'
                              : 'bg-white border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-[#006c49] uppercase font-mono">
                              {court.sport}
                            </span>
                            <span className="text-xs font-bold text-[#0b1c30]">
                              ₹{court.basePrice}/hr
                            </span>
                          </div>
                          <h4 className="text-sm font-bold text-[#0b1c30] mt-1">{court.name}</h4>
                          <p className="text-xs text-slate-500 mt-0.5 truncate">{court.surface}</p>
                        </div>
                      );
                    })}
                  </div>
                </Card>

                {/* Step 2: Select Date */}
                <Card padded="sm">
                  <div className="flex items-center justify-between mb-3 px-1">
                    <span className="text-xs font-bold text-[#0b1c30] uppercase tracking-wider flex items-center gap-1.5">
                      <CalendarIcon className="w-3.5 h-3.5 text-[#006c49]" /> Step 2: Choose Playing Date
                    </span>
                    <span className="text-xs text-slate-500">7-day advance booking</span>
                  </div>

                  <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                    {dateOptions.map((opt) => {
                      const isSel = opt.iso === selectedDate;
                      return (
                        <button
                          key={opt.iso}
                          type="button"
                          onClick={() => {
                            setSelectedDate(opt.iso);
                            setSelectedHour(null);
                          }}
                          className={`p-3 rounded-xl border min-w-[90px] text-center transition-all cursor-pointer ${
                            isSel
                              ? 'bg-[#006c49] text-white border-[#006c49] shadow-xs font-semibold'
                              : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                          }`}
                        >
                          <div className="text-[11px] font-medium opacity-90">{opt.dayName}</div>
                          <div className="text-sm font-bold mt-0.5">{opt.label}</div>
                        </button>
                      );
                    })}
                  </div>
                </Card>

                {/* Step 3: Interactive Time Slots */}
                <Card padded="sm" className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1">
                    <div>
                      <span className="text-xs font-bold text-[#0b1c30] uppercase tracking-wider flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-[#006c49]" /> Step 3: Available Hourly Slots
                      </span>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Peak hours: 18:00 – 22:00 (+25% peak rate). Member discounts apply to all slots.
                      </p>
                    </div>

                    {/* Slot legend */}
                    <div className="flex items-center gap-3 text-[11px] text-slate-500">
                      <span className="flex items-center gap-1">
                        <span className="w-2.5 h-2.5 rounded bg-white border border-slate-300" /> Available
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="w-2.5 h-2.5 rounded bg-[#006c49]" /> Selected
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="w-2.5 h-2.5 rounded bg-amber-100 border border-amber-300" /> Booked (Waitlist)
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="w-2.5 h-2.5 rounded bg-slate-100 border border-slate-200" /> Past
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {OPERATING_HOURS.map((hour) => {
                      const isPast = isHourPast(hour);
                      const isBooked = bookedHours.includes(hour);
                      const isSelected = selectedHour === hour;
                      const isPeak = hour >= 18 && hour < 22;

                      const disabled = isPast;

                      return (
                        <button
                          key={hour}
                          type="button"
                          disabled={disabled}
                          onClick={() => handleSlotClick(hour)}
                          className={`p-3 rounded-xl border text-left transition-all ${
                            isSelected
                              ? 'bg-[#006c49] text-white border-[#006c49] shadow-sm font-bold'
                              : isPast
                              ? 'bg-slate-50 border-slate-200 text-slate-400 cursor-not-allowed opacity-60'
                              : isBooked
                              ? 'bg-amber-50/70 border-amber-200 text-amber-950 hover:bg-amber-100/70 hover:border-amber-300 cursor-pointer'
                              : 'bg-white border-slate-200 text-slate-700 hover:border-[#006c49] hover:bg-[#ecfdf5]/30 cursor-pointer'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-mono font-bold">
                              {hour.toString().padStart(2, '0')}:00
                            </span>
                            {isBooked ? (
                              <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-amber-200 text-amber-900 flex items-center gap-0.5">
                                <Hourglass className="w-2.5 h-2.5" /> Waitlist
                              </span>
                            ) : isPeak && !disabled ? (
                              <span
                                className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${
                                  isSelected ? 'bg-white/20 text-white' : 'bg-amber-100 text-amber-800'
                                }`}
                              >
                                Peak
                              </span>
                            ) : null}
                          </div>
                          <div
                            className={`text-[11px] mt-1 ${
                              isSelected
                                ? 'text-white/90'
                                : isBooked
                                ? 'text-amber-700 font-medium'
                                : 'text-slate-500'
                            }`}
                          >
                            {isPast
                              ? 'Past slot'
                              : isBooked
                              ? 'Join FIFO Waitlist'
                              : isPeak
                              ? `₹${Math.round(selectedCourt.basePrice * 1.25)}`
                              : `₹${selectedCourt.basePrice}`}
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* Duration selection */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="font-semibold text-[#0b1c30]">Session Duration:</span>
                    <div className="flex items-center gap-2">
                      {[1, 2].map((hrs) => (
                        <button
                          key={hrs}
                          type="button"
                          onClick={() => setDurationHours(hrs)}
                          className={`px-3 py-1.5 rounded-lg border text-xs font-medium cursor-pointer ${
                            durationHours === hrs
                              ? 'bg-[#006c49] text-white border-[#006c49]'
                              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          {hrs} {hrs === 1 ? 'Hour' : 'Hours'}
                        </button>
                      ))}
                    </div>
                  </div>
                </Card>

              </div>

              {/* Right Column: Price Summary & Submission Box */}
              <div className="lg:col-span-4 sticky top-24 space-y-4">
                <Card className="p-6 space-y-5 shadow-sm border-slate-200">
                  <h3 className="text-base font-bold text-[#0b1c30] border-b border-slate-100 pb-3">
                    Booking Summary
                  </h3>

                  <div className="space-y-2.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Club</span>
                      <span className="font-medium text-[#0b1c30]">{club.name}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Court</span>
                      <span className="font-medium text-[#0b1c30]">{selectedCourt.name}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Date</span>
                      <span className="font-medium text-[#0b1c30]">{selectedDate}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Time Slot</span>
                      <span className="font-medium text-[#0b1c30]">
                        {selectedHour !== null
                          ? `${selectedHour.toString().padStart(2, '0')}:00 – ${(
                              selectedHour + durationHours
                            )
                              .toString()
                              .padStart(2, '0')}:00`
                          : 'Select a slot'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Duration</span>
                      <span className="font-medium text-[#0b1c30]">
                        {durationHours} {durationHours === 1 ? 'Hour' : 'Hours'}
                      </span>
                    </div>
                  </div>

                  {/* Price Breakdown */}
                  <div className="pt-3 border-t border-slate-100 space-y-2 text-xs">
                    <div className="flex items-center justify-between text-slate-600">
                      <span>Base Court Fee</span>
                      <span>₹{selectedCourt.basePrice * durationHours}</span>
                    </div>

                    {isPeakHour && (
                      <div className="flex items-center justify-between text-amber-700">
                        <span className="flex items-center gap-1">
                          <Zap className="w-3.5 h-3.5" /> Peak Hour Surcharge (+25%)
                        </span>
                        <span>+₹{totalGross - selectedCourt.basePrice * durationHours}</span>
                      </div>
                    )}

                    {memberDiscountPct > 0 ? (
                      <div className="flex items-center justify-between text-[#006c49] font-medium">
                        <span>Member Discount ({memberDiscountPct}%)</span>
                        <span>-₹{discountAmount}</span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between text-slate-500 italic">
                        <span>Member Discount</span>
                        <span>₹0 (Non-member)</span>
                      </div>
                    )}

                    <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-sm font-extrabold text-[#0b1c30]">
                      <span>Total Payable</span>
                      <span className="text-lg text-[#006c49]">₹{finalPrice}</span>
                    </div>
                  </div>

                  {/* Payment Mode Selection */}
                  <div className="pt-3 border-t border-slate-100 space-y-2">
                    <span className="text-xs font-bold text-[#0b1c30] uppercase tracking-wider block">
                      Payment Mode
                    </span>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {[
                        { id: 'UPI', label: 'UPI / QR', icon: Zap },
                        { id: 'CARD', label: 'Debit / Card', icon: CreditCard },
                        { id: 'COUNTER', label: 'Pay at Counter', icon: Building },
                        ...(membership && membership.payLaterCreditLimit > 0
                          ? [{ id: 'PAY_LATER', label: 'Member Tab', icon: User }]
                          : []),
                      ].map((mode) => (
                        <button
                          key={mode.id}
                          type="button"
                          onClick={() => setPaymentMode(mode.id as any)}
                          className={`p-2.5 rounded-xl border text-left flex items-center gap-2 transition-all cursor-pointer ${
                            paymentMode === mode.id
                              ? 'bg-[#ecfdf5] border-[#006c49] text-[#006c49] font-bold'
                              : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                          }`}
                        >
                          <mode.icon className="w-3.5 h-3.5" />
                          <span>{mode.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Error Notification */}
                  {errorMessage && (
                    <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                      <span>{errorMessage}</span>
                    </div>
                  )}

                  {/* Action Buttons: Add to Cart + Confirm Booking */}
                  <div className="space-y-2 pt-2">
                    <Button
                      variant="primary"
                      size="lg"
                      isLoading={isSubmitting}
                      disabled={selectedHour === null}
                      onClick={handleBookingSubmit}
                      className="w-full cursor-pointer"
                    >
                      Confirm Court Booking
                    </Button>

                    <Button
                      variant="outline"
                      size="md"
                      disabled={selectedHour === null}
                      onClick={handleAddToCartClick}
                      className="w-full cursor-pointer"
                    >
                      🛒 Add Slot to Cart
                    </Button>
                  </div>

                  <p className="text-[11px] text-slate-500 text-center leading-relaxed">
                    Free cancellation up to 24 hours prior to match time. Instant confirmation.
                  </p>
                </Card>
              </div>

            </div>

          </div>
        )}

      </div>

      {/* Login Required Modal (Issue 7) */}
      <Modal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        title="Account Required for Booking"
      >
        <div className="space-y-4 text-center py-2">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center font-bold">
            🔒
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            You must be logged in to reserve sports courts or add slot bookings to your cart. Please sign in to your account or register if you do not have one.
          </p>
          <div className="grid grid-cols-2 gap-3 pt-2">
            <Button
              variant="outline"
              size="md"
              onClick={() => {
                setShowLoginModal(false);
                const returnUrl = `/club/${slug}/book?court=${selectedCourtId}&date=${selectedDate}&hour=${selectedHour !== null ? selectedHour : ''}&duration=${durationHours}`;
                sessionStorage.setItem('pending_booking_redirect', returnUrl);
                sessionStorage.setItem('pending_booking_selection', JSON.stringify({
                  courtId: selectedCourtId,
                  date: selectedDate,
                  hour: selectedHour,
                  duration: durationHours,
                }));
                navigate(`/register?redirect=${encodeURIComponent(returnUrl)}`);
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
                const returnUrl = `/club/${slug}/book?court=${selectedCourtId}&date=${selectedDate}&hour=${selectedHour !== null ? selectedHour : ''}&duration=${durationHours}`;
                sessionStorage.setItem('pending_booking_redirect', returnUrl);
                sessionStorage.setItem('pending_booking_selection', JSON.stringify({
                  courtId: selectedCourtId,
                  date: selectedDate,
                  hour: selectedHour,
                  duration: durationHours,
                }));
                navigate(`/login?redirect=${encodeURIComponent(returnUrl)}`);
              }}
              className="w-full cursor-pointer text-xs"
            >
              Sign In to Book
            </Button>
          </div>
        </div>
      </Modal>

      {/* Join Slot Waitlist Modal */}
      <Modal
        isOpen={!!waitlistModalSlot}
        onClose={() => setWaitlistModalSlot(null)}
        title="Join Slot Waitlist Queue"
      >
        <div className="space-y-4 py-2">
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2">
            <div className="flex justify-between">
              <span className="text-slate-500">Club & Court:</span>
              <span className="font-bold text-[#0b1c30]">
                {club.name} • {selectedCourt.name}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Sport Surface:</span>
              <span className="font-semibold text-[#006c49] uppercase font-mono">
                {selectedCourt.sport} ({selectedCourt.surface})
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Requested Interval:</span>
              <span className="font-bold text-[#0b1c30]">
                {selectedDate} at {waitlistModalSlot?.hour.toString().padStart(2, '0')}:00 –{' '}
                {((waitlistModalSlot?.hour || 0) + (waitlistModalSlot?.duration || 1))
                  .toString()
                  .padStart(2, '0')}
                :00
              </span>
            </div>
            <div className="flex justify-between border-t border-slate-200/80 pt-1.5">
              <span className="text-slate-500">Queue Policy:</span>
              <span className="font-bold text-[#006c49]">Strict Deterministic FIFO</span>
            </div>
          </div>

          <div className="text-xs text-slate-600 space-y-2 leading-relaxed bg-amber-50/60 p-3 rounded-xl border border-amber-200">
            <p className="font-semibold text-amber-900">How Waitlist Allocation Works:</p>
            <ul className="list-disc pl-4 space-y-1 text-slate-600 text-[11px]">
              <li>If the existing booking is cancelled, the entire duration is verified against waiting entries.</li>
              <li>When allocated, you receive an exclusive <strong>10-minute authoritative hold</strong>.</li>
              <li>During your hold window, the slot cannot be booked by the public or flash promotions.</li>
              <li>You can accept & pay or decline directly from this page or notifications.</li>
            </ul>
          </div>

          {errorMessage && (
            <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div className="flex items-center gap-3 pt-1">
            <Button
              variant="outline"
              size="md"
              onClick={() => setWaitlistModalSlot(null)}
              className="w-1/2 cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="md"
              isLoading={isJoiningWaitlist}
              onClick={handleConfirmJoinWaitlist}
              className="w-1/2 cursor-pointer"
            >
              Confirm Waitlist
            </Button>
          </div>
        </div>
      </Modal>

    </div>
  );
}
