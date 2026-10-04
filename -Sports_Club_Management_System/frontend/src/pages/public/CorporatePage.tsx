import React from 'react';
import { Link } from 'react-router-dom';
import { Briefcase } from 'lucide-react';

export default function CorporatePage() {
  return (
    <main className="flex-1 w-full max-w-4xl mx-auto px-6 py-12 sm:py-16">
      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-[#006c49] text-xs font-semibold uppercase tracking-wider border border-emerald-200 mb-3">
        <Briefcase className="w-3.5 h-3.5" /> Corporate &amp; Teams
      </div>
      <h1 className="text-3xl sm:text-4xl font-bold text-[#0b1c30] tracking-tight mb-6">
        Corporate Wellness &amp; Team Plans
      </h1>

      <div className="rounded-xl bg-white border border-slate-200 p-8 shadow-sm space-y-4">
        <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
          SportsHub helps companies set up recurring sports days, team leagues, and regular court access across verified sports venues.
        </p>
        <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
          Employees can book badminton, padel, tennis, and turf slots at partner clubs with shared company allowances, zero individual expense claims, and unified monthly invoicing.
        </p>
        <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
          Reach out through our corporate desk to configure a customized company package with dedicated court hours and coach-assisted team workshops.
        </p>

        <div className="pt-4">
          <Link
            to="/contact"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#006c49] text-white hover:bg-[#005237] font-semibold text-xs transition-colors shadow-xs"
          >
            Contact Corporate Sales
          </Link>
        </div>
      </div>
    </main>
  );
}
