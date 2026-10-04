import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Trophy,
  QrCode,
  ShieldCheck,
  Calendar,
  CheckCircle2,
  Clock,
  Sparkles,
  CreditCard,
  ChevronRight,
  ArrowRight,
  Award
} from 'lucide-react';
import { getActiveMembership, ActiveMembership } from '@/lib/membershipsState';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';

export default function DigitalMembershipCardPage() {
  const [membership, setMembership] = useState<ActiveMembership | null>(null);
  const navigate = useNavigate();

  const loadMembership = async () => {
    const token = localStorage.getItem('sportshub_token');
    const local = getActiveMembership();

    if (!token) {
      setMembership(local);
      return;
    }

    try {
      const res = await fetch('/api/v1/memberships/my', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const resData = await res.json();
      if (res.ok && resData.success && resData.data && resData.data.activeMembership) {
        const m = resData.data.activeMembership;
        const mapped: ActiveMembership = {
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
        };
        setMembership(mapped);
      } else {
        setMembership(null);
      }
    } catch {
      setMembership(local);
    }
  };

  useEffect(() => {
    loadMembership();
    window.addEventListener('sportshub_membership_updated', loadMembership);
    return () => window.removeEventListener('sportshub_membership_updated', loadMembership);
  }, []);

  if (!membership || membership.status !== 'ACTIVE') {
    return (
      <div className="min-h-screen bg-[#f8f9ff] py-12 selection:bg-[#006c49] selection:text-white">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 space-y-6">
          <EmptyState
            icon={<Trophy className="w-8 h-8 text-slate-400" />}
            title="No Active Membership Found"
            description="You do not currently hold an active sports club membership. Join an annual plan to get up to 50% off courts, equipment rentals, and free coaching sessions."
            actionLabel="Explore Membership Plans"
            onAction={() => navigate('/club/skyline-sports/memberships')}
          />
        </div>
      </div>
    );
  }

  const isGold = membership.tier === 'GOLD';

  return (
    <div className="min-h-screen bg-[#f8f9ff] py-8 selection:bg-[#006c49] selection:text-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Breadcrumb Navigation */}
        <nav className="flex items-center gap-1.5 text-xs text-slate-500">
          <Link to="/" className="hover:text-[#006c49]">Home</Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <Link to="/dashboard" className="hover:text-[#006c49]">Dashboard</Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-[#0b1c30] font-medium">Digital Membership Pass</span>
        </nav>

        {/* Page Title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0b1c30] tracking-tight">
              Digital Membership Pass
            </h1>
            <p className="text-xs text-slate-600 mt-1">
              Scan this pass at the club reception desk to redeem your member discounts and coaching benefits.
            </p>
          </div>

          <Link to={`/club/${membership.clubSlug}/book`}>
            <Button variant="primary" size="sm" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
              Book Courts with {membership.courtDiscountPct}% OFF
            </Button>
          </Link>
        </div>

        {/* Digital Membership Pass Card (Wallet Style) */}
        <div className="max-w-xl mx-auto">
          <div className="rounded-3xl p-6 sm:p-8 bg-gradient-to-br from-[#006c49] via-[#005237] to-[#0b1c30] text-white shadow-xl relative overflow-hidden space-y-6 border border-emerald-700/40">
            
            {/* Top Brand & Badge */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white">
                  <Trophy className="w-4 h-4" />
                </div>
                <span className="text-sm font-bold tracking-tight">SportsHub Member Pass</span>
              </div>

              <span className="px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-white text-[11px] font-bold uppercase tracking-wider border border-white/20">
                {membership.tier} PASS
              </span>
            </div>

            {/* Member Identity & Club */}
            <div className="space-y-1 pt-2">
              <span className="text-xs text-emerald-200 font-medium">Club Partner</span>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight">{membership.clubName}</h2>
              <div className="text-xs text-emerald-100 font-mono tracking-wider pt-0.5">
                ID: {membership.memberId}
              </div>
            </div>

            {/* Middle QR Code & Verification Data */}
            <div className="p-4 rounded-2xl bg-white text-[#0b1c30] flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
              <div className="flex items-center gap-3">
                <QrCode className="w-20 h-20 text-[#0b1c30] shrink-0" />
                <div className="space-y-0.5 text-left">
                  <span className="text-[10px] text-slate-500 uppercase font-mono tracking-wider block">
                    Member Name
                  </span>
                  <div className="text-sm font-bold text-[#0b1c30]">{membership.userName}</div>
                  <div className="text-[11px] text-slate-500 font-mono">{membership.userEmail}</div>
                </div>
              </div>

              <div className="text-right sm:border-l sm:border-slate-200 sm:pl-4 space-y-1">
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#006c49]">
                  <ShieldCheck className="w-3.5 h-3.5" /> Verified Pass
                </span>
                <div className="text-[11px] text-slate-500">
                  Exp: <strong className="text-slate-800">{membership.validUntil}</strong>
                </div>
              </div>
            </div>

            {/* Bottom Inclusions Bar */}
            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/20 text-center text-xs">
              <div className="bg-white/10 rounded-xl p-2 backdrop-blur-xs">
                <span className="text-[10px] text-emerald-200 block uppercase">Court Rate</span>
                <strong className="text-sm font-bold text-white">{membership.courtDiscountPct}% OFF</strong>
              </div>
              <div className="bg-white/10 rounded-xl p-2 backdrop-blur-xs">
                <span className="text-[10px] text-emerald-200 block uppercase">Gear Rental</span>
                <strong className="text-sm font-bold text-white">{membership.rentalDiscountPct}% OFF</strong>
              </div>
              <div className="bg-white/10 rounded-xl p-2 backdrop-blur-xs">
                <span className="text-[10px] text-emerald-200 block uppercase">Free Coaching</span>
                <strong className="text-sm font-bold text-white">
                  {membership.coachingSessionsRemaining} Left
                </strong>
              </div>
            </div>

          </div>
        </div>

        {/* Benefits breakdown */}
        <Card className="p-6 space-y-4">
          <h3 className="text-base font-bold text-[#0b1c30] border-b border-slate-100 pb-3">
            Active Privileges &amp; Club Benefits
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-slate-600">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
              <span className="font-bold text-[#0b1c30] flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-[#006c49]" /> 50% Court Discount
              </span>
              <p className="text-slate-500">Applied automatically at checkout across all hourly court slots.</p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
              <span className="font-bold text-[#0b1c30] flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-[#006c49]" /> Gear Rental Discount
              </span>
              <p className="text-slate-500">50% off rackets, balls, and equipment rentals at the front desk.</p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
              <span className="font-bold text-[#0b1c30] flex items-center gap-1.5">
                <Award className="w-4 h-4 text-[#006c49]" /> 1-on-1 Coaching Allotment
              </span>
              <p className="text-slate-500">
                You have <strong>{membership.coachingSessionsRemaining} free sessions</strong> remaining this month.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
              <span className="font-bold text-[#0b1c30] flex items-center gap-1.5">
                <CreditCard className="w-4 h-4 text-[#006c49]" /> Pay Later Front-Desk Credit Tab
              </span>
              <p className="text-slate-500">
                Limit: ₹{membership.payLaterCreditLimit}. Current balance: ₹{membership.currentBalance}.
              </p>
            </div>
          </div>
        </Card>

      </div>
    </div>
  );
}
