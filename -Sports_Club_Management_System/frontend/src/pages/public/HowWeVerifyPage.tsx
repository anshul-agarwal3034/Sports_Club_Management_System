import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, CheckCircle2 } from 'lucide-react';

export default function HowWeVerifyPage() {
  return (
    <main className="flex-1 w-full max-w-4xl mx-auto px-6 py-12 sm:py-16">
      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-[#006c49] text-xs font-semibold uppercase tracking-wider border border-emerald-200 mb-3">
        <ShieldCheck className="w-3.5 h-3.5" /> Club Standards
      </div>
      <h1 className="text-3xl sm:text-4xl font-bold text-[#0b1c30] tracking-tight mb-6">
        How We Verify Clubs
      </h1>

      <div className="rounded-xl bg-white border border-slate-200 p-8 shadow-sm space-y-6">
        <div className="flex items-center gap-3 text-[#006c49]">
          <ShieldCheck className="w-7 h-7" />
          <span className="font-bold text-base text-[#0b1c30]">100% Physical Inspection &amp; Legal Audit</span>
        </div>

        <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
          Every sports club listed on SportsHub must pass our verification audit before their courts become bookable to the public.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-2">
            <CheckCircle2 className="w-5 h-5 text-[#006c49]" />
            <div className="font-bold text-xs uppercase text-[#0b1c30]">1. Legal Records</div>
            <p className="text-xs text-slate-600">Verification of GST, business PAN, and property leases to confirm genuine facility ownership.</p>
          </div>

          <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-2">
            <CheckCircle2 className="w-5 h-5 text-[#006c49]" />
            <div className="font-bold text-xs uppercase text-[#0b1c30]">2. On-Site Inspection</div>
            <p className="text-xs text-slate-600">A physical audit by our field officers checking court flooring, lighting levels, and net condition.</p>
          </div>

          <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-2">
            <CheckCircle2 className="w-5 h-5 text-[#006c49]" />
            <div className="font-bold text-xs uppercase text-[#0b1c30]">3. Amenities Check</div>
            <p className="text-xs text-slate-600">Verification of clean drinking water, locker rooms, showers, and safe parking facilities.</p>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100">
          <Link
            to="/register/club"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#006c49] text-white hover:bg-[#005237] font-semibold text-xs transition-colors shadow-xs"
          >
            Register Your Club For Verification
          </Link>
        </div>
      </div>
    </main>
  );
}
