import React from 'react';
import { Link } from 'react-router-dom';
import { GraduationCap } from 'lucide-react';

export default function AcademicPage() {
  return (
    <main className="flex-1 w-full max-w-4xl mx-auto px-6 py-12 sm:py-16">
      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-[#006c49] text-xs font-semibold uppercase tracking-wider border border-emerald-200 mb-3">
        <GraduationCap className="w-3.5 h-3.5" /> Schools &amp; Academies
      </div>
      <h1 className="text-3xl sm:text-4xl font-bold text-[#0b1c30] tracking-tight mb-6">
        Academic Plans &amp; Junior Access
      </h1>

      <div className="rounded-xl bg-white border border-slate-200 p-8 shadow-sm space-y-4">
        <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
          We partner with schools, colleges, and sports academies to offer structured practice hours and dedicated court blocks.
        </p>
        <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
          Students under 18 can access dedicated Junior memberships with mandatory parental or guardian consent and special student-tier discounts.
        </p>
        <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
          Coaches and physical education directors can block seasonal court schedules directly with club owners through unified institutional billing.
        </p>

        <div className="pt-4">
          <Link
            to="/contact"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#006c49] text-white hover:bg-[#005237] font-semibold text-xs transition-colors shadow-xs"
          >
            Get Academic Access
          </Link>
        </div>
      </div>
    </main>
  );
}
