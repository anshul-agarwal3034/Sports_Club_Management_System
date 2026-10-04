import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Trophy,
  Check,
  Shield,
  ShieldCheck,
  ChevronRight,
  Info,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  ArrowRight
} from 'lucide-react';
import { getClubBySlug, DetailedClub, ClubMembershipTier } from '@/lib/clubsData';
import { purchaseMembership, getActiveMembership, ActiveMembership } from '@/lib/membershipsState';
import { getStoredUser } from '@/lib/roles';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { EmptyState } from '@/components/ui/EmptyState';

export default function ClubMembershipsPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const club = slug ? getClubBySlug(slug) : undefined;
  const user = getStoredUser();
  const [currentMembership, setCurrentMembership] = useState<ActiveMembership | null>(getActiveMembership());

  const [selectedTier, setSelectedTier] = useState<ClubMembershipTier | null>(null);
  const [guardianConsent, setGuardianConsent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('sportshub_token');
    if (!token) {
      setCurrentMembership(null);
      return;
    }
    fetch('/api/v1/memberships/my', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data && data.data.activeMembership && data.data.activeMembership.is_active) {
          const m = data.data.activeMembership;
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
            status: 'ACTIVE',
            payLaterCreditLimit: m.allows_pay_later ? 2000 : 0,
            currentBalance: 0,
            coachingSessionsRemaining: m.free_coaching_sessions_per_month || 0,
            courtDiscountPct: parseFloat(m.court_discount_pct || 0),
            rentalDiscountPct: parseFloat(m.rental_discount_pct || 0),
            shopDiscountPct: parseFloat(m.shop_discount_pct || 0),
            createdAt: m.created_at || new Date().toISOString(),
          };
          setCurrentMembership(mapped);
        } else {
          setCurrentMembership(null);
        }
      })
      .catch(() => {
        setCurrentMembership(getActiveMembership());
      });
  }, []);

  if (!club) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-6 bg-[#f8f9ff]">
        <EmptyState
          icon={<Info className="w-8 h-8 text-slate-400" />}
          title="Club not found"
          description="We couldn't locate membership plans for this sports venue."
          actionLabel="Browse Clubs"
          onAction={() => navigate('/clubs')}
        />
      </div>
    );
  }

  const handleOpenPurchase = (tier: ClubMembershipTier) => {
    setSelectedTier(tier);
    setGuardianConsent(false);
    setErrorMessage(null);
  };

  const handleConfirmPurchase = async () => {
    if (!selectedTier) return;
    setErrorMessage(null);

    if (selectedTier.guardianConsentRequired && !guardianConsent) {
      setErrorMessage('Parental or guardian consent is mandatory for the Junior Academy Pass.');
      return;
    }

    setIsSubmitting(true);
    const token = localStorage.getItem('sportshub_token');
    if (token) {
      try {
        await fetch('/api/v1/memberships/buy', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            clubId: club.id,
            tier: selectedTier.tier,
          }),
        });
      } catch {
        // API fallback handled via local storage update below
      }
    }

    const newMem = purchaseMembership({
      userName: user?.full_name || 'SportsHub Player',
      userEmail: user?.email || 'player@sportshub.in',
      clubId: club.id,
      clubSlug: club.slug,
      clubName: club.name,
      tier: selectedTier.tier,
      tierName: selectedTier.name,
      courtDiscountPct: selectedTier.courtDiscountPct,
      rentalDiscountPct: selectedTier.rentalDiscountPct,
      shopDiscountPct: selectedTier.shopDiscountPct,
      freeCoachingSessions: selectedTier.freeCoachingSessions,
      payLaterEnabled: selectedTier.payLaterEnabled,
    });

    setCurrentMembership(newMem);
    setIsSubmitting(false);
    setSelectedTier(null);
    navigate('/my-membership');
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
          <Link to={`/club/${club.slug}`} className="hover:text-[#006c49]">{club.name}</Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-[#0b1c30] font-medium">Memberships</span>
        </nav>

        {/* Page Header */}
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <Badge variant="emerald" icon={<Trophy className="w-3.5 h-3.5" />}>
            Annual Club Memberships
          </Badge>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#0b1c30] tracking-tight">
            {club.name} Membership Plans
          </h1>
          <p className="text-sm text-slate-600 leading-relaxed">
            Lock in 12 months of court savings, priority booking windows, complimentary coaching sessions, and discounts at the pro shop.
          </p>
        </div>

        {/* Current Active Plan Notice */}
        {currentMembership && currentMembership.status === 'ACTIVE' && (
          <div className="max-w-xl mx-auto p-4 rounded-2xl bg-[#ecfdf5] border border-[#a7f3d0] flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white text-[#006c49] flex items-center justify-center border border-[#a7f3d0]">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-bold text-[#006c49] uppercase font-mono">
                  Active Subscription
                </span>
                <h4 className="text-sm font-bold text-[#0b1c30]">
                  {currentMembership.tierName} • {currentMembership.clubName}
                </h4>
                <p className="text-xs text-slate-500">
                  Valid until {currentMembership.validUntil}
                </p>
              </div>
            </div>

            <Link to="/my-membership">
              <Button variant="primary" size="sm">
                View Digital Pass
              </Button>
            </Link>
          </div>
        )}

        {/* 3-Tier Membership Plan Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
          {club.memberships.map((plan) => {
            const isGold = plan.tier === 'GOLD';
            const isCurrentPlan = currentMembership?.status === 'ACTIVE' && currentMembership?.tier === plan.tier;

            let buttonLabel = `Buy ${plan.name}`;
            if (currentMembership && currentMembership.status === 'ACTIVE') {
              if (isCurrentPlan) {
                buttonLabel = `Renewal (${plan.name})`;
              } else if (plan.tier === 'GOLD') {
                buttonLabel = `Upgrade to Gold ⭐`;
              } else {
                buttonLabel = `Switch to ${plan.name}`;
              }
            } else {
              if (plan.tier === 'GOLD') buttonLabel = 'Buy Gold Plan';
              else if (plan.tier === 'SILVER') buttonLabel = 'Buy Silver Plan';
              else buttonLabel = 'Buy Junior Pass';
            }

            return (
              <Card
                key={plan.tier}
                className={`flex flex-col justify-between p-6 sm:p-8 transition-all ${
                  isGold
                    ? 'border-2 border-[#006c49] shadow-md relative bg-white'
                    : 'border-slate-200'
                }`}
              >
                {isGold && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                    <span className="px-3 py-1 rounded-full bg-[#006c49] text-white text-[11px] font-bold tracking-wide uppercase shadow-xs">
                      Most Popular
                    </span>
                  </div>
                )}

                <div className="space-y-4">
                  <div>
                    <span className="text-xs font-bold text-[#006c49] uppercase font-mono tracking-wider flex items-center justify-between">
                      <span>{plan.tier} PLAN</span>
                      {isCurrentPlan && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#ecfdf5] border border-[#a7f3d0] text-[#006c49] font-bold">
                          Active Plan
                        </span>
                      )}
                    </span>
                    <h3 className="text-xl font-bold text-[#0b1c30] mt-1">{plan.name}</h3>
                    <p className="text-xs text-slate-500 mt-1">{plan.tagline}</p>
                  </div>

                  {/* Price */}
                  <div className="pt-2 border-t border-slate-100">
                    <div className="text-3xl font-black text-[#0b1c30]">
                      ₹{plan.pricePerYear.toLocaleString('en-IN')}
                    </div>
                    <span className="text-xs text-slate-500">per member / billed annually</span>
                  </div>

                  {/* Core Metrics Grid */}
                  <div className="grid grid-cols-2 gap-2 pt-2 text-xs">
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                      <span className="text-slate-500 block text-[10px] uppercase">Court Discount</span>
                      <strong className="text-sm font-bold text-[#006c49]">{plan.courtDiscountPct}% OFF</strong>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                      <span className="text-slate-500 block text-[10px] uppercase">Rental Discount</span>
                      <strong className="text-sm font-bold text-[#0b1c30]">{plan.rentalDiscountPct}% OFF</strong>
                    </div>
                  </div>

                  {/* Benefits Checklist */}
                  <div className="space-y-2.5 pt-3 border-t border-slate-100">
                    <span className="text-xs font-semibold text-slate-700 uppercase tracking-wide block">
                      Plan Inclusions:
                    </span>
                    <ul className="space-y-2 text-xs text-slate-600">
                      {plan.benefits.map((b, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <Check className="w-4 h-4 text-[#006c49] shrink-0 mt-0.5" />
                          <span>{b}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="pt-6 mt-6 border-t border-slate-100">
                  <Button
                    variant={isGold || isCurrentPlan ? 'primary' : 'outline'}
                    size="md"
                    className="w-full cursor-pointer"
                    onClick={() => handleOpenPurchase(plan)}
                  >
                    {buttonLabel}
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Feature Comparison Table */}
        <Card className="p-6 space-y-4">
          <h2 className="text-lg font-bold text-[#0b1c30] border-b border-slate-100 pb-3">
            Plan Comparison Matrix
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500">
                  <th className="py-3 px-3 font-semibold">Benefit / Feature</th>
                  <th className="py-3 px-3 font-bold text-[#006c49]">Gold Plan</th>
                  <th className="py-3 px-3 font-semibold text-slate-800">Silver Plan</th>
                  <th className="py-3 px-3 font-semibold text-slate-800">Junior Pass</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                <tr>
                  <td className="py-3 px-3 font-medium">Court Booking Discount</td>
                  <td className="py-3 px-3 font-bold text-[#006c49]">50% OFF</td>
                  <td className="py-3 px-3 font-semibold">25% OFF</td>
                  <td className="py-3 px-3 font-semibold">30% OFF</td>
                </tr>
                <tr>
                  <td className="py-3 px-3 font-medium">Racket &amp; Gear Rentals</td>
                  <td className="py-3 px-3 font-bold text-[#006c49]">50% OFF</td>
                  <td className="py-3 px-3 font-semibold">25% OFF</td>
                  <td className="py-3 px-3 font-semibold">30% OFF</td>
                </tr>
                <tr>
                  <td className="py-3 px-3 font-medium">Pro Shop &amp; Canteen Discount</td>
                  <td className="py-3 px-3 font-bold text-[#006c49]">10% OFF</td>
                  <td className="py-3 px-3 font-semibold">5% OFF</td>
                  <td className="py-3 px-3 font-semibold">5% OFF</td>
                </tr>
                <tr>
                  <td className="py-3 px-3 font-medium">Free Monthly 1-on-1 Coaching</td>
                  <td className="py-3 px-3 font-bold text-[#006c49]">4 Sessions / mo</td>
                  <td className="py-3 px-3 text-slate-400">Not included</td>
                  <td className="py-3 px-3 text-slate-400">Clinics only</td>
                </tr>
                <tr>
                  <td className="py-3 px-3 font-medium">Pay Later Front-Desk Tab</td>
                  <td className="py-3 px-3 font-bold text-[#006c49]">₹2,000 Credit</td>
                  <td className="py-3 px-3 text-slate-400">Disabled</td>
                  <td className="py-3 px-3 text-slate-400">Disabled</td>
                </tr>
                <tr>
                  <td className="py-3 px-3 font-medium">Parental Consent Required</td>
                  <td className="py-3 px-3 text-slate-400">No</td>
                  <td className="py-3 px-3 text-slate-400">No</td>
                  <td className="py-3 px-3 font-bold text-amber-700">Mandatory (&lt;18)</td>
                </tr>
              </tbody>
            </table>
          </div>
        </Card>

        {/* Purchase Confirmation Modal */}
        {selectedTier && (
          <Modal
            isOpen={!!selectedTier}
            onClose={() => setSelectedTier(null)}
            title={`Subscribe to ${selectedTier.name}`}
            description={`Annual membership at ${club.name}`}
          >
            <div className="space-y-4 py-2 text-xs text-slate-600">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center justify-between text-sm font-bold text-[#0b1c30]">
                  <span>{selectedTier.name} (1 Year)</span>
                  <span className="text-[#006c49]">₹{selectedTier.pricePerYear.toLocaleString('en-IN')}</span>
                </div>
                <div className="text-slate-500">
                  Includes {selectedTier.courtDiscountPct}% off courts, {selectedTier.rentalDiscountPct}% off gear rentals.
                </div>
              </div>

              {selectedTier.guardianConsentRequired && (
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 space-y-2">
                  <span className="font-bold flex items-center gap-1.5 text-xs">
                    <AlertCircle className="w-4 h-4 text-amber-600" /> Guardian Consent Required
                  </span>
                  <label className="flex items-start gap-2 text-xs cursor-pointer">
                    <input
                      type="checkbox"
                      checked={guardianConsent}
                      onChange={(e) => setGuardianConsent(e.target.checked)}
                      className="mt-0.5 rounded text-[#006c49] focus:ring-[#006c49]"
                    />
                    <span>
                      I certify that the member is under 18 years of age and that I am their legal parent or guardian authorizing this sports membership.
                    </span>
                  </label>
                </div>
              )}

              {errorMessage && (
                <p className="text-xs text-rose-600 font-medium">{errorMessage}</p>
              )}

              <p className="text-slate-500">
                Activating this plan sets up your digital membership card, usable immediately for online court discounts and on-site check-in.
              </p>

              <div className="pt-2 flex items-center justify-end gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedTier(null)}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="md"
                  isLoading={isSubmitting}
                  onClick={handleConfirmPurchase}
                >
                  Confirm &amp; Activate Pass
                </Button>
              </div>
            </div>
          </Modal>
        )}

      </div>
    </div>
  );
}
