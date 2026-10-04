import React from 'react';
import { FileCheck } from 'lucide-react';

export default function TermsPage() {
  return (
    <main className="flex-1 w-full max-w-4xl mx-auto px-6 py-12 sm:py-16">
      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-[#006c49] text-xs font-semibold uppercase tracking-wider border border-emerald-200 mb-3">
        <FileCheck className="w-3.5 h-3.5" /> Legal Terms
      </div>
      <h1 className="text-3xl sm:text-4xl font-bold text-[#0b1c30] tracking-tight mb-6">
        Terms of Service
      </h1>

      <div className="rounded-xl bg-white border border-slate-200 p-8 shadow-sm space-y-4">
        <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
          By accessing and booking courts through SportsHub, you agree to comply with standard sports venue guidelines and court safety regulations.
        </p>
        <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
          Each player account is permitted a maximum of 2 active slot reservations per day to maintain equitable playing opportunities for all sports enthusiasts.
        </p>
        <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
          Junior members under 18 years of age must provide guardian consent during enrollment and follow student time allocations set by the respective club.
        </p>
        <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
          Non-marking shoes are strictly required on all wooden and synthetic badminton courts. Partner venues reserve the right to deny court entry without refund if safety or footwear requirements are violated.
        </p>
      </div>
    </main>
  );
}
