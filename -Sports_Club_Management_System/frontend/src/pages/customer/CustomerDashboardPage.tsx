import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Trophy,
  Calendar,
  Clock,
  MapPin,
  QrCode,
  ShieldCheck,
  Award,
  CreditCard,
  ShoppingBag,
  ArrowRight,
  User,
  PlusCircle,
  UtensilsCrossed
} from 'lucide-react';
import { getStoredUser } from '@/lib/roles';
import { getActiveMembership, ActiveMembership } from '@/lib/membershipsState';
import { CustomerBooking, getCustomerBookings } from '@/lib/bookingsState';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';

export default function CustomerDashboardPage() {
  const user = getStoredUser();
  const [membership, setMembership] = useState<ActiveMembership | null>(null);
  const [bookings, setBookings] = useState<CustomerBooking[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserData = async () => {
      const token = localStorage.getItem('sportshub_token');
      // Fetch Bookings & Merge with Local Storage
      const localBookings = getCustomerBookings();

      if (!token) {
        setBookings(localBookings);
      } else {
        try {
          const res = await fetch('/api/v1/bookings/my', {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
          const resData = await res.json();
          if (res.ok && resData.success && Array.isArray(resData.data)) {
            const apiBookings: CustomerBooking[] = resData.data.map((b: any) => {
              const startIso = b.start_time || b.created_at || new Date().toISOString();
              const endIso = b.end_time || b.created_at || new Date().toISOString();
              const dateStr = startIso.split('T')[0];
              const startTimeStr = startIso.includes('T') ? startIso.split('T')[1].slice(0, 5) : '18:00';
              const endTimeStr = endIso.includes('T') ? endIso.split('T')[1].slice(0, 5) : '19:00';

              return {
                id: b.id,
                clubId: b.club_id,
                clubSlug: b.club_id,
                clubName: b.club_name || 'Sports Venue',
                courtId: b.court_id,
                courtName: b.court_name || 'Court',
                sport: b.sport_type || 'Sports',
                date: dateStr,
                startTime: startTimeStr,
                endTime: endTimeStr,
                durationHours: 1,
                basePrice: parseFloat(b.price_charged || 800),
                priceCharged: parseFloat(b.price_charged || 800),
                isPeak: false,
                memberDiscountPct: 0,
                status: (b.status || 'CONFIRMED') as any,
                paymentMode: 'UPI',
                paymentStatus: 'PAID',
                bookingCode: `SH-${b.id.slice(0, 6).toUpperCase()}`,
                createdAt: b.created_at || new Date().toISOString(),
              };
            });

            const existingIds = new Set(apiBookings.map((b) => b.id));
            const unsyncedLocal = localBookings.filter((lb: CustomerBooking) => !existingIds.has(lb.id));
            setBookings([...apiBookings, ...unsyncedLocal]);
          } else {
            setBookings(localBookings);
          }
        } catch {
          setBookings(localBookings);
        }
      }

      // Fetch Membership
      try {
        const memRes = await fetch('/api/v1/memberships/my', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const memData = await memRes.json();
        if (memRes.ok && memData.success && memData.data && memData.data.activeMembership) {
          const m = memData.data.activeMembership;
          setMembership({
            id: m.id,
            userId: m.user_id,
            userName: m.user_name || 'Member',
            userEmail: m.user_email || '',
            clubId: m.club_id,
            clubSlug: 'skyline-sports',
            clubName: m.club_name || 'Sports Venue',
            tier: m.tier || 'GOLD',
            tierName: `${m.tier || 'Gold'} Member Plan`,
            memberId: `SH-${m.club_id ? m.club_id.slice(0, 3).toUpperCase() : 'CLUB'}-M${m.id ? m.id.slice(0, 4).toUpperCase() : '1001'}`,
            validFrom: m.start_date ? m.start_date.split('T')[0] : new Date().toISOString().split('T')[0],
            validUntil: m.expiry_date ? m.expiry_date.split('T')[0] : new Date().toISOString().split('T')[0],
            status: m.is_active ? 'ACTIVE' : 'EXPIRED',
            payLaterCreditLimit: m.allows_pay_later ? 2000 : 0,
            currentBalance: 0,
            coachingSessionsRemaining: m.free_coaching_sessions_per_month || 0,
            courtDiscountPct: parseFloat(m.court_discount_pct || 0),
            rentalDiscountPct: parseFloat(m.rental_discount_pct || 0),
            shopDiscountPct: parseFloat(m.shop_discount_pct || 0),
            createdAt: m.created_at || new Date().toISOString(),
          });
        } else {
          setMembership(null);
        }
      } catch {
        setMembership(null);
      }
    };

    fetchUserData();
    window.addEventListener('sportshub_bookings_updated', fetchUserData);
    window.addEventListener('sportshub_membership_updated', fetchUserData);
    return () => {
      window.removeEventListener('sportshub_bookings_updated', fetchUserData);
      window.removeEventListener('sportshub_membership_updated', fetchUserData);
    };
  }, []);

  const nextBooking = bookings.find((b) => b.status === 'CONFIRMED');
  const greetingName = user?.full_name || 'Player';

  return (
    <div className="min-h-screen bg-[#f8f9ff] py-8 selection:bg-[#006c49] selection:text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Welcome Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Badge variant="emerald" icon={<User className="w-3.5 h-3.5" />}>
                Player Account
              </Badge>
              {membership && (
                <span className="text-xs font-semibold text-[#006c49] bg-[#ecfdf5] border border-[#a7f3d0] px-2.5 py-0.5 rounded-full">
                  {membership.tierName}
                </span>
              )}
            </div>
            <h1  className="text-2xl sm:text-3xl text-[#006c49] font-extrabold tracking-tight">
              Welcome back, {greetingName} 
            </h1>
            <p className="text-xs text-slate-600">
              Manage your upcoming court slots, active membership pass, and club activities.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Link to="/profile">
              <Button variant="outline" size="md" leftIcon={<User className="w-4 h-4" />}>
                My Profile
              </Button>
            </Link>
          </div>
        </div>

        {/* Top 2-Column Focus: Next Booking & Active Membership */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Next Booking Highlight */}
          <div className="lg:col-span-7">
            <Card className="h-full flex flex-col justify-between p-6 space-y-4 border-slate-200">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <span className="text-xs font-bold text-[#0b1c30] uppercase tracking-wider flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-[#006c49]" /> Next Scheduled Court
                </span>
                <Link to="/my-bookings" className="text-xs font-semibold text-[#006c49] hover:underline">
                  All Bookings ({bookings.length}) →
                </Link>
              </div>

              {nextBooking ? (
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[11px] font-mono uppercase font-bold text-[#006c49]">
                        {nextBooking.sport}
                      </span>
                      <h3 className="text-lg font-bold text-[#0b1c30]">{nextBooking.courtName}</h3>
                      <div className="flex items-center gap-1.5 text-xs text-slate-600 mt-1">
                        <MapPin className="w-3.5 h-3.5 text-[#006c49]" />
                        <span>{nextBooking.clubName}</span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800">
                        {nextBooking.bookingCode}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                    <div>
                      <span className="text-slate-500 block text-[10px] uppercase">Match Date</span>
                      <strong className="text-slate-800 font-semibold">{nextBooking.date}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px] uppercase">Time Slot</span>
                      <strong className="text-slate-800 font-semibold">
                        {nextBooking.startTime} – {nextBooking.endTime}
                      </strong>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-xs text-slate-500">
                      Paid ₹{nextBooking.priceCharged} via {nextBooking.paymentMode}
                    </span>
                    <Link to="/my-bookings">
                      <Button variant="secondary" size="sm" leftIcon={<QrCode className="w-3.5 h-3.5" />}>
                        Show QR Pass
                      </Button>
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="py-8 text-center space-y-3">
                  <p className="text-xs text-slate-500">
                    You have no courts scheduled for today or this week.
                  </p>
                  <Link to="/clubs">
                    <Button variant="secondary" size="sm">
                      Reserve a Court Slot
                    </Button>
                  </Link>
                </div>
              )}
            </Card>
          </div>

          {/* Membership Pass Card */}
          <div className="lg:col-span-5">
            <Card className="h-full flex flex-col justify-between p-6 space-y-4 border-slate-200">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <span className="text-xs font-bold text-[#0b1c30] uppercase tracking-wider flex items-center gap-1.5">
                  <Trophy className="w-4 h-4 text-[#006c49]" /> Sports Membership
                </span>
                <Link to="/my-membership" className="text-xs font-semibold text-[#006c49] hover:underline">
                  Digital Pass →
                </Link>
              </div>

              {membership && membership.status === 'ACTIVE' ? (
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between">
                      <Badge variant="amber">{membership.tier} MEMBER</Badge>
                      <span className="text-[11px] font-mono text-slate-500">ID: {membership.memberId}</span>
                    </div>
                    <h3 className="text-base font-bold text-[#0b1c30] mt-1.5">{membership.tierName}</h3>
                    <p className="text-xs text-slate-500">{membership.clubName}</p>
                  </div>

                  <div className="space-y-2 text-xs text-slate-600 pt-1">
                    <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50">
                      <span>Court Discount</span>
                      <strong className="text-[#006c49] font-bold">{membership.courtDiscountPct}% OFF</strong>
                    </div>
                    <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50">
                      <span>Coaching Sessions Remaining</span>
                      <strong className="text-slate-800 font-bold">{membership.coachingSessionsRemaining} Sessions</strong>
                    </div>
                    <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50">
                      <span>Valid Until</span>
                      <strong className="text-slate-800 font-medium">{membership.validUntil}</strong>
                    </div>
                  </div>

                  <Link to="/my-membership" className="block pt-1">
                    <Button variant="outline" size="sm" className="w-full">
                      Open Wallet Pass
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="py-8 text-center space-y-3">
                  <p className="text-xs text-slate-500">
                    No active membership pass. Enjoy up to 50% discount with an annual pass.
                  </p>
                  <Link to="/club/skyline-sports/memberships">
                    <Button variant="primary" size="sm">
                      View Plans &amp; Perks
                    </Button>
                  </Link>
                </div>
              )}
            </Card>
          </div>

        </div>

        {/* Quick Hub Navigation Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link to="/clubs" className="sports-card sports-card-hover p-5 space-y-2 group block">
            <div className="w-10 h-10 rounded-xl bg-[#eff4ff] text-[#006c49] flex items-center justify-center group-hover:bg-[#006c49] group-hover:text-white transition-colors">
              <Calendar className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-[#0b1c30]">Find Courts</h4>
            <p className="text-xs text-slate-500">Book hourly slots across verified clubs</p>
          </Link>

          <Link to="/my-bookings" className="sports-card sports-card-hover p-5 space-y-2 group block">
            <div className="w-10 h-10 rounded-xl bg-[#eff4ff] text-[#006c49] flex items-center justify-center group-hover:bg-[#006c49] group-hover:text-white transition-colors">
              <Clock className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-[#0b1c30]">My Bookings</h4>
            <p className="text-xs text-slate-500">View check-in passes &amp; match receipts</p>
          </Link>

          <Link to="/club/skyline-sports/shop" className="sports-card sports-card-hover p-5 space-y-2 group block">
            <div className="w-10 h-10 rounded-xl bg-[#eff4ff] text-[#006c49] flex items-center justify-center group-hover:bg-[#006c49] group-hover:text-white transition-colors">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-[#0b1c30]">Pro Shop &amp; Gear</h4>
            <p className="text-xs text-slate-500">Rent rackets &amp; buy fresh match balls</p>
          </Link>

          <Link to="/canteen-ordering" className="sports-card sports-card-hover p-5 space-y-2 group block border border-emerald-200 bg-emerald-50/50">
            <div className="w-10 h-10 rounded-xl bg-[#eff4ff] text-[#006c49] flex items-center justify-center shadow-xs group-hover:bg-[#006c49] group-hover:text-white transition-colors">
              <UtensilsCrossed className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-[#0b1c30] flex items-center gap-1.5">
              <span>Kitchen &amp; Canteen</span>
              <span className="text-[10px] bg-emerald-100 text-[#006c49] px-1.5 py-0.2 rounded font-extrabold uppercase">Order Food</span>
            </h4>
            <p className="text-xs text-slate-500">Order snacks, meals &amp; hydration to your court table</p>
          </Link>
        </div>

      </div>
    </div>
  );
}
