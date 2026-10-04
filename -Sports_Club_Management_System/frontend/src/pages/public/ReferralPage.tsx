import React from 'react';
import { Link } from 'react-router-dom';
import { Gift } from 'lucide-react';

export default function ReferralPage() {
  return (
    <main className="flex-1 w-full max-w-4xl mx-auto px-6 py-12 sm:py-16">
      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-[#006c49] text-xs font-semibold uppercase tracking-wider border border-emerald-200 mb-3">
        <Gift className="w-3.5 h-3.5" /> Community Rewards
      </div>
      <h1 className="text-3xl sm:text-4xl font-bold text-[#0b1c30] tracking-tight mb-6">
        Player Referral Program
      </h1>

      <div className="rounded-xl bg-white border border-slate-200 p-8 shadow-sm space-y-4">
        <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
          Invite your friends, colleagues, and regular sporting partners to join SportsHub.
        </p>
        <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
          When a fellow player signs up with your unique referral code, they receive an immediate 10% discount on their first court reservation.
        </p>
        <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
          Once they complete their first match, a ₹150 booking voucher is credited directly into your SportsHub player wallet.
        </p>

        <div className="pt-4">
          <Link
            to="/register/player"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#006c49] text-white hover:bg-[#005237] font-semibold text-xs transition-colors shadow-xs"
          >
            Get Your Player Referral Code
          </Link>
        </div>
      </div>
    </main>
  );
}
