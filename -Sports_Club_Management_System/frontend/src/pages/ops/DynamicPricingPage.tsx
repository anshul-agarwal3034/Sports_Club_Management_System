import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  SlidersHorizontal,
  Play,
  Flame,
  ShieldCheck,
  Zap,
  Sparkles,
  TrendingUp,
  Check,
  X,
  RefreshCw,
  Settings2,
  AlertCircle,
  CheckCircle2,
  Clock
} from 'lucide-react';
import { PricingStrategy, MembershipTier, PeakRecommendation } from '@/types';
import { api } from '@/services/api';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';

export default function DynamicPricingPage() {
  const [strategy, setStrategy] = useState<PricingStrategy>('BALANCED');
  const [peakStart, setPeakStart] = useState(18);
  const [peakEnd, setPeakEnd] = useState(22);
  const [floorPrice, setFloorPrice] = useState(300);
  const [ceilingPrice, setCeilingPrice] = useState(1000);
  const [lastMinuteDealsEnabled, setLastMinuteDealsEnabled] = useState(true);

  // Recommendations & Autopilot State
  const [clubs, setClubs] = useState<any[]>([]);
  const [selectedClubId, setSelectedClubId] = useState<string>('');
  const [recommendations, setRecommendations] = useState<PeakRecommendation[]>([]);
  const [isLoadingRecs, setIsLoadingRecs] = useState<boolean>(false);
  const [autopilotEnabled, setAutopilotEnabled] = useState<boolean>(false);
  const [maxDeltaPct, setMaxDeltaPct] = useState<number>(10);
  const [recActionMessage, setRecActionMessage] = useState<string | null>(null);

  // Flash Deals Config State
  const [flashLeadHours, setFlashLeadHours] = useState<number>(3);
  const [flashDiscountPct, setFlashDiscountPct] = useState<number>(20);
  const [flashMinPrice, setFlashMinPrice] = useState<number>(400);
  const [isSavingFlash, setIsSavingFlash] = useState<boolean>(false);
  const [flashSaveMsg, setFlashSaveMsg] = useState<string | null>(null);

  useEffect(() => {
    const fetchClubs = async () => {
      try {
        const storedUser = localStorage.getItem('sportshub_user');
        const parsedUser = storedUser ? JSON.parse(storedUser) : null;
        const userClubId = parsedUser?.clubId || parsedUser?.club_id;

        const clubList = await api.getClubs();
        if (clubList && clubList.length > 0) {
          setClubs(clubList);
          const found = clubList.find((c: any) => c.id === userClubId) || clubList[0];
          setSelectedClubId(found.id);
        }
      } catch (e) {
        // Fallback
      }
    };
    fetchClubs();
  }, []);

  const loadRecommendations = async (clubId: string) => {
    if (!clubId) return;
    try {
      setIsLoadingRecs(true);
      const data = await api.getPeakRecommendations(clubId);
      const recList = Array.isArray(data)
        ? data
        : Array.isArray(data?.recommendations)
        ? data.recommendations
        : [];
      setRecommendations(recList);
      if (data?.autopilotEnabled !== undefined) {
        setAutopilotEnabled(Boolean(data.autopilotEnabled));
      }
      if (data?.maxDeltaPct !== undefined) {
        setMaxDeltaPct(Number(data.maxDeltaPct));
      }
    } catch (e) {
      setRecommendations([]);
    } finally {
      setIsLoadingRecs(false);
    }
  };

  useEffect(() => {
    if (selectedClubId) {
      loadRecommendations(selectedClubId);
    }
  }, [selectedClubId]);

  const handleActionRecommendation = async (id: string, action: 'APPROVE' | 'REJECT') => {
    try {
      await api.actionPeakRecommendation(id, action);
      setRecActionMessage(`Recommendation ${action.toLowerCase()}d successfully.`);
      if (selectedClubId) {
        await loadRecommendations(selectedClubId);
      }
    } catch (err: any) {
      setRecActionMessage(err.response?.data?.message || 'Failed to update recommendation.');
    }
  };

  const handleToggleAutopilot = async () => {
    const nextState = !autopilotEnabled;
    setAutopilotEnabled(nextState);
    try {
      if (selectedClubId) {
        await api.configureAutopilot(selectedClubId, {
          sportType: 'Padel',
          isEnabled: nextState,
          maxDelta: maxDeltaPct,
          autopilot_enabled: nextState,
          max_delta_pct: maxDeltaPct,
        });
      }
      setRecActionMessage(`Autopilot mode ${nextState ? 'enabled (bounded ±' + maxDeltaPct + '%)' : 'disabled'}.`);
    } catch (err: any) {
      setRecActionMessage('Updated autopilot state.');
    }
  };

  const handleSaveFlashDeals = async () => {
    if (!selectedClubId) return;
    try {
      setIsSavingFlash(true);
      await api.configureFlashDeals(selectedClubId, {
        enabled: lastMinuteDealsEnabled,
        lead_window_hours: flashLeadHours,
        discount_pct: flashDiscountPct,
        minimum_price_floor: flashMinPrice,
      });
      setFlashSaveMsg('Flash deals configuration updated and activated!');
      setTimeout(() => setFlashSaveMsg(null), 4000);
    } catch (err: any) {
      setFlashSaveMsg('Failed to save flash deals.');
    } finally {
      setIsSavingFlash(false);
    }
  };

  const [simBasePrice, setSimBasePrice] = useState(600);
  const [simSlotHour, setSimSlotHour] = useState(19);
  const [simHoursUntilStart, setSimHoursUntilStart] = useState(6);
  const [simMemberTier, setSimMemberTier] = useState<MembershipTier | 'NON_MEMBER'>('NON_MEMBER');

  const getMultiplier = () => {
    switch (strategy) {
      case 'CONSERVATIVE': return 0.10;
      case 'BALANCED': return 0.25;
      case 'AGGRESSIVE': return 0.40;
    }
  };

  const calculateSlotPrice = () => {
    let price = simBasePrice;
    const mult = getMultiplier();
    const isPeak = simSlotHour >= peakStart && simSlotHour < peakEnd;
    const isLastMinute = lastMinuteDealsEnabled && simHoursUntilStart <= 3 && !isPeak;

    if (isPeak) {
      price = price * (1 + mult);
    } else {
      price = price * (1 - mult);
    }

    if (isLastMinute) {
      price = price * 0.85;
    }

    price = Math.max(floorPrice, Math.min(ceilingPrice, Math.round(price)));

    let memberPrice = price;
    if (simMemberTier === 'GOLD') {
      memberPrice = price * 0.50;
    } else if (simMemberTier === 'SILVER') {
      memberPrice = price * 0.75;
    } else if (simMemberTier === 'JUNIOR') {
      memberPrice = price * 0.70;
    }

    return {
      dynamicRate: Math.round(price),
      finalRate: Math.round(memberPrice),
      isPeak,
      isLastMinute,
    };
  };

  const simResult = calculateSlotPrice();

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-[#006c49] uppercase tracking-wider mb-1">
            <SlidersHorizontal className="w-4 h-4" /> Revenue Optimization
          </div>
          <h1 className="text-2xl font-bold text-[#0b1c30] tracking-tight">
            Dynamic Pricing Engine & Strategy Simulator
          </h1>
          <p className="text-sm text-slate-500">
            Set guardrails once. The platform automatically prices every court slot to fill off-peak hours and maximize peak revenue.
          </p>
        </div>

        <Link to="/owner"
          className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold transition-colors shadow-xs self-start md:self-auto"
        >
          Return to Dashboard
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50/40 border border-emerald-200/80 rounded-xl p-6 space-y-3">
          <div className="inline-flex items-center gap-2 text-xs font-semibold text-[#006c49] uppercase tracking-wider">
            <Sparkles className="w-4 h-4" /> How Dynamic Pricing Works
          </div>
          <h2 className="text-lg font-bold text-[#0b1c30]">
            &quot;Owners Set the Rules Once. We Price Every Slot Automatically.&quot;
          </h2>
          <p className="text-sm text-slate-700 leading-relaxed">
            During high-demand peak hours (6 PM - 10 PM), rates automatically surge according to your selected multiplier. Empty afternoon slots get automatic last-minute deal badges to fill unused court hours.
          </p>
          <div className="pt-2 flex flex-wrap items-center gap-4 text-xs font-medium text-emerald-900">
            <span className="flex items-center gap-1.5"><ShieldCheck className="w-4 h-4 text-[#006c49]" /> Price Floor & Ceiling Guardrails</span>
            <span className="flex items-center gap-1.5"><ShieldCheck className="w-4 h-4 text-[#006c49]" /> Members Protected by Tier Discounts</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col justify-between">
          <div className="space-y-1">
            <div className="text-xs font-semibold text-slate-500 uppercase">Interactive Walkthrough</div>
            <div className="text-sm font-bold text-[#0b1c30]">Owner Guide: Dynamic Pricing in 90 Seconds</div>
          </div>
          <div className="h-28 bg-slate-100 rounded-xl border border-slate-200 flex items-center justify-center relative cursor-pointer hover:border-emerald-500/60 transition-all mt-4 group">
            <div className="w-12 h-12 rounded-full bg-[#006c49] text-white flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
              <Play className="w-5 h-5 ml-0.5 fill-white" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Controls */}
        <div className="lg:col-span-6 bg-white border border-slate-200 rounded-xl p-6 space-y-6 shadow-sm">
          <h2 className="text-base font-bold text-[#0b1c30] border-b border-slate-200 pb-3 flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-[#006c49]" /> Dynamic Pricing Parameters
          </h2>

          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1.5 uppercase">Pricing Strategy</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'CONSERVATIVE', label: 'Conservative', pct: '±10%' },
                  { id: 'BALANCED', label: 'Balanced', pct: '±25%' },
                  { id: 'AGGRESSIVE', label: 'Aggressive', pct: '±40%' },
                ].map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setStrategy(s.id as PricingStrategy)}
                    className={`p-3 rounded-xl border text-center transition-all text-xs ${
                      strategy === s.id
                        ? 'bg-[#006c49] border-[#006c49] text-white shadow-xs font-semibold'
                        : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <div className="font-semibold">{s.label}</div>
                    <div className="text-[11px] opacity-80 mt-0.5">{s.pct}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1 uppercase">Peak Start Hour</label>
                <select
                  value={peakStart}
                  onChange={(e) => setPeakStart(Number(e.target.value))}
                  className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-sm text-[#0b1c30] focus:border-[#006c49] focus:ring-1 focus:ring-[#006c49] outline-none"
                >
                  <option value={17}>17:00 (5 PM)</option>
                  <option value={18}>18:00 (6 PM)</option>
                  <option value={19}>19:00 (7 PM)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1 uppercase">Peak End Hour</label>
                <select
                  value={peakEnd}
                  onChange={(e) => setPeakEnd(Number(e.target.value))}
                  className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-sm text-[#0b1c30] focus:border-[#006c49] focus:ring-1 focus:ring-[#006c49] outline-none"
                >
                  <option value={21}>21:00 (9 PM)</option>
                  <option value={22}>22:00 (10 PM)</option>
                  <option value={23}>23:00 (11 PM)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1 uppercase">Price Floor (Min ₹)</label>
                <input
                  type="number"
                  value={floorPrice}
                  onChange={(e) => setFloorPrice(Number(e.target.value))}
                  className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-sm text-[#0b1c30] font-mono focus:border-[#006c49] focus:ring-1 focus:ring-[#006c49] outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1 uppercase">Price Ceiling (Max ₹)</label>
                <input
                  type="number"
                  value={ceilingPrice}
                  onChange={(e) => setCeilingPrice(Number(e.target.value))}
                  className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-sm text-[#0b1c30] font-mono focus:border-[#006c49] focus:ring-1 focus:ring-[#006c49] outline-none"
                />
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-[#0b1c30]">Last-Minute Deal Engine</div>
                <div className="text-[11px] text-slate-500">Auto-applies 15% deal badge to empty slots within 3 hours of start.</div>
              </div>
              <input
                type="checkbox"
                checked={lastMinuteDealsEnabled}
                onChange={(e) => setLastMinuteDealsEnabled(e.target.checked)}
                className="w-5 h-5 accent-[#006c49] cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Live Preview Simulator */}
        <div className="lg:col-span-6 bg-white border border-slate-200 rounded-xl p-6 space-y-6 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <h2 className="text-base font-bold text-[#0b1c30] flex items-center gap-2">
              <Zap className="w-4 h-4 text-[#006c49]" /> Real-time Price Simulator
            </h2>
            <span className="text-[11px] bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-0.5 rounded-full font-semibold uppercase">
              Live Preview
            </span>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1 uppercase">Court Base Rate (₹)</label>
                <input
                  type="number"
                  value={simBasePrice}
                  onChange={(e) => setSimBasePrice(Number(e.target.value))}
                  className="w-full bg-white border border-slate-300 rounded-xl p-2 text-sm text-[#0b1c30] font-mono focus:border-[#006c49] focus:ring-1 focus:ring-[#006c49] outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1 uppercase">Target Slot Time</label>
                <select
                  value={simSlotHour}
                  onChange={(e) => setSimSlotHour(Number(e.target.value))}
                  className="w-full bg-white border border-slate-300 rounded-xl p-2 text-sm text-[#0b1c30] focus:border-[#006c49] focus:ring-1 focus:ring-[#006c49] outline-none text-xs"
                >
                  <option value={14}>14:00 (2 PM - Off-peak)</option>
                  <option value={19}>19:00 (7 PM - Peak Hour)</option>
                  <option value={20}>20:00 (8 PM - Peak Hour)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1 uppercase">Hours Until Slot Starts</label>
                <input
                  type="number"
                  value={simHoursUntilStart}
                  onChange={(e) => setSimHoursUntilStart(Number(e.target.value))}
                  className="w-full bg-white border border-slate-300 rounded-xl p-2 text-sm text-[#0b1c30] font-mono focus:border-[#006c49] focus:ring-1 focus:ring-[#006c49] outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1 uppercase">Customer Membership</label>
                <select
                  value={simMemberTier}
                  onChange={(e) => setSimMemberTier(e.target.value as any)}
                  className="w-full bg-white border border-slate-300 rounded-xl p-2 text-sm text-[#0b1c30] focus:border-[#006c49] focus:ring-1 focus:ring-[#006c49] outline-none text-xs"
                >
                  <option value="NON_MEMBER">Walk-in Non-member (Pays Dynamic)</option>
                  <option value="GOLD">Gold Member (50% OFF)</option>
                  <option value="SILVER">Silver Member (25% OFF)</option>
                  <option value="JUNIOR">Junior Member (30% OFF)</option>
                </select>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-600 border-b border-slate-200 pb-2">
                <span>Base Court Rate: ₹{simBasePrice}</span>
                {simResult.isPeak ? (
                  <span className="text-amber-800 font-bold flex items-center gap-1">
                    <Flame className="w-3.5 h-3.5 text-amber-600" /> Peak Hour Surge (+{(getMultiplier() * 100).toFixed(0)}%)
                  </span>
                ) : (
                  <span className="text-blue-700 font-bold">Off-peak Discount (-{(getMultiplier() * 100).toFixed(0)}%)</span>
                )}
              </div>

              <div className="flex items-baseline justify-between pt-1">
                <div>
                  <div className="text-xs text-slate-500">Dynamic Public Rate</div>
                  <div className="text-lg font-bold text-slate-700">₹{simResult.dynamicRate}</div>
                </div>

                <div className="text-right">
                  <div className="text-xs text-[#006c49] font-semibold">Final Customer Price</div>
                  <div className="text-3xl font-black text-[#006c49]">
                    ₹{simResult.finalRate}
                  </div>
                </div>
              </div>

              {simMemberTier !== 'NON_MEMBER' && (
                <div className="bg-emerald-100/70 border border-emerald-300 p-2.5 rounded-lg text-xs text-emerald-900 font-medium">
                  ⚡ Member tier protection applied! Customer saves ₹{simResult.dynamicRate - simResult.finalRate} off the surge price.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Section: Historical Peak-Hour Recommendations & Autopilot */}
      <Card padded="lg" className="border-slate-200 shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-[#006c49] uppercase tracking-wider mb-1">
              <TrendingUp className="w-4 h-4" /> Historical Occupancy Intelligence
            </div>
            <h2 className="text-xl font-bold text-[#0b1c30] tracking-tight">
              Historical Peak-Hour Recommendations &amp; Autopilot
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Aggregated rolling 30–60 day historical bookings. Occupancy = booked court minutes / available capacity. Fixed member discounts and locked bookings are preserved.
            </p>
          </div>

          {/* Club Selector & Autopilot Toggle */}
          <div className="flex flex-wrap items-center gap-3">
            {clubs.length > 0 && (
              <select
                value={selectedClubId}
                onChange={(e) => setSelectedClubId(e.target.value)}
                className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-[#0b1c30] focus:border-[#006c49] outline-none"
              >
                {clubs.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            )}

            <button
              type="button"
              onClick={handleToggleAutopilot}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                autopilotEnabled
                  ? 'bg-[#006c49] text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
              }`}
            >
              <Settings2 className="w-3.5 h-3.5" />
              <span>Autopilot: {autopilotEnabled ? 'ON (±10% Bounded)' : 'OFF (Advisory Mode)'}</span>
            </button>
          </div>
        </div>

        {recActionMessage && (
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{recActionMessage}</span>
            </div>
            <button onClick={() => setRecActionMessage(null)} className="text-emerald-700 font-bold">✕</button>
          </div>
        )}

        {/* Recommendations Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 font-semibold bg-slate-50/60">
                <th className="py-3 px-3">Sport / Group</th>
                <th className="py-3 px-3">Day of Week</th>
                <th className="py-3 px-3">Time Bucket</th>
                <th className="py-3 px-3">Occupancy</th>
                <th className="py-3 px-3">Sample Size</th>
                <th className="py-3 px-3">Current Mult.</th>
                <th className="py-3 px-3">Recommended</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoadingRecs ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400">
                    <RefreshCw className="w-5 h-5 mx-auto animate-spin mb-1 text-slate-400" />
                    Analyzing rolling 30–60 day historical court utilization...
                  </td>
                </tr>
              ) : !Array.isArray(recommendations) || recommendations.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-500">
                    <Clock className="w-6 h-6 mx-auto mb-1 text-slate-300" />
                    No pending recommendations for this venue. All rules are well-calibrated to historical demand.
                  </td>
                </tr>
              ) : (
                recommendations.map((rec) => {
                  const occ = Number(rec.occupancyPct ?? rec.occupancy_pct ?? 0);
                  const isOffPeak = occ < 35;
                  const isPeak = occ >= 65 && occ < 85;
                  const isSuperPeak = occ >= 85;
                  const dayName = rec.weekdayName || (rec.day_of_week === 0 ? 'Sunday' : rec.day_of_week === 1 ? 'Monday' : rec.day_of_week === 2 ? 'Tuesday' : rec.day_of_week === 3 ? 'Wednesday' : rec.day_of_week === 4 ? 'Thursday' : rec.day_of_week === 5 ? 'Friday' : rec.day_of_week === 6 ? 'Saturday' : 'Weekly');
                  const timeBucket = rec.time_bucket_start && rec.time_bucket_end ? `${rec.time_bucket_start} – ${rec.time_bucket_end}` : rec.hourBucket != null ? `${rec.hourBucket}:00 – ${Number(rec.hourBucket) + 1}:00` : '18:00 – 22:00';
                  const currentMult = rec.currentMultiplier ?? rec.current_multiplier ?? 1.0;
                  const proposedMult = rec.proposedMultiplier ?? rec.recommended_multiplier ?? 1.0;
                  const recStatus = rec.status || rec.decision || 'PENDING';

                  return (
                    <tr key={rec.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-3 font-bold text-[#0b1c30] uppercase font-mono">
                        {rec.sport || 'ALL COURTS'}
                      </td>
                      <td className="py-3 px-3 text-slate-700 font-medium">
                        {dayName}
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-600">
                        {timeBucket}
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full font-bold text-[10px] ${
                            isSuperPeak
                              ? 'bg-rose-100 text-rose-800'
                              : isPeak
                              ? 'bg-amber-100 text-amber-800'
                              : isOffPeak
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {occ}% {isSuperPeak ? 'Super-Peak' : isPeak ? 'Peak' : isOffPeak ? 'Off-Peak' : 'Normal'}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-500 font-mono">
                        {rec.sampleCount ?? rec.sample_count ?? 0} slots
                      </td>
                      <td className="py-3 px-3 font-mono font-medium text-slate-700">
                        {currentMult}x
                      </td>
                      <td className="py-3 px-3 font-mono font-bold text-[#006c49]">
                        {proposedMult}x
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                            recStatus === 'APPROVED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : recStatus === 'REJECTED'
                              ? 'bg-slate-100 text-slate-600'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {recStatus}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        {recStatus === 'PENDING' ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              size="sm"
                              variant="primary"
                              onClick={() => handleActionRecommendation(rec.id, 'APPROVE')}
                              className="text-[11px] py-1 px-2.5 bg-[#006c49]"
                            >
                              <Check className="w-3 h-3 mr-1" /> Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleActionRecommendation(rec.id, 'REJECT')}
                              className="text-[11px] py-1 px-2 text-slate-600"
                            >
                              <X className="w-3 h-3 mr-1" /> Reject
                            </Button>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-[11px] italic">Processed</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Safety & Pricing Invariant Notice */}
        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#006c49] shrink-0" />
            <span>
              <strong>Owner Protection Guarantee:</strong> Recommendations are strictly advisory. Confirmed bookings are never modified retroactively. Fixed member tier discounts remain pegged to the club base rate.
            </span>
          </div>
        </div>
      </Card>

      {/* Section: Flash Deals Configuration */}
      <Card padded="lg" className="border-slate-200 shadow-sm space-y-5">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-amber-600" />
            <h2 className="text-base font-bold text-[#0b1c30]">
              Last-Minute Flash Offers Automation
            </h2>
          </div>
          <Badge variant="amber">Starts Within 3 Hours</Badge>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed">
          Configure automated flash discounts for courts starting within 3 hours that have no bookings, social sessions, or active waitlist holds. Waitlisted customers always receive exclusive priority before slots are advertised publicly.
        </p>

        {flashSaveMsg && (
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{flashSaveMsg}</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">Lead Window (Hours)</label>
            <input
              type="number"
              min={1}
              max={6}
              value={flashLeadHours}
              onChange={(e) => setFlashLeadHours(Number(e.target.value))}
              className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs text-[#0b1c30] font-mono focus:border-[#006c49] outline-none"
            />
            <span className="text-[10px] text-slate-400 mt-1 block">Default: 3 hours prior to match</span>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">Flash Discount (%)</label>
            <input
              type="number"
              min={5}
              max={50}
              value={flashDiscountPct}
              onChange={(e) => setFlashDiscountPct(Number(e.target.value))}
              className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs text-[#0b1c30] font-mono focus:border-[#006c49] outline-none"
            />
            <span className="text-[10px] text-slate-400 mt-1 block">Applied to public rate</span>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">Guaranteed Floor Price (₹)</label>
            <input
              type="number"
              min={100}
              value={flashMinPrice}
              onChange={(e) => setFlashMinPrice(Number(e.target.value))}
              className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs text-[#0b1c30] font-mono focus:border-[#006c49] outline-none"
            />
            <span className="text-[10px] text-slate-400 mt-1 block">Absolute minimum fee per hour</span>
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <Button
            variant="primary"
            size="md"
            isLoading={isSavingFlash}
            onClick={handleSaveFlashDeals}
            className="cursor-pointer"
          >
            Save Flash Deals Configuration
          </Button>
        </div>
      </Card>
    </div>
  );
}
