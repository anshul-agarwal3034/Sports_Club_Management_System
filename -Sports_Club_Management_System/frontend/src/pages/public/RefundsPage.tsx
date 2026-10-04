import React from 'react';
import { RotateCcw } from 'lucide-react';

export default function RefundsPage() {
  return (
    <main className="flex-1 w-full max-w-4xl mx-auto px-6 py-12 sm:py-16">
      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-[#006c49] text-xs font-semibold uppercase tracking-wider border border-emerald-200 mb-3">
        <RotateCcw className="w-3.5 h-3.5" /> Fair Play Policies
      </div>
      <h1 className="text-3xl sm:text-4xl font-bold text-[#0b1c30] tracking-tight mb-6">
        Cancellations &amp; Refund Policy
      </h1>

      <div className="rounded-xl bg-white border border-slate-200 p-8 shadow-sm space-y-4">
        <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
          We understand match schedules can change unexpectedly. SportsHub provides a transparent, automated refund structure for every reservation:
        </p>

        <div className="space-y-3 pt-2">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-start justify-between">
            <div>
              <strong className="text-sm text-[#0b1c30] block">More than 24 hours before match:</strong>
              <span className="text-xs text-slate-600">Full 100% refund credited back to your original payment method.</span>
            </div>
            <span className="text-xs font-bold text-[#006c49] bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">100% Refund</span>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-start justify-between">
            <div>
              <strong className="text-sm text-[#0b1c30] block">Between 2 and 24 hours before match:</strong>
              <span className="text-xs text-slate-600">50% partial refund to cover facility hold costs.</span>
            </div>
            <span className="text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full">50% Refund</span>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-start justify-between">
            <div>
              <strong className="text-sm text-[#0b1c30] block">Less than 2 hours before match:</strong>
              <span className="text-xs text-slate-600">Non-refundable because court slots cannot be re-allocated on short notice.</span>
            </div>
            <span className="text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2.5 py-1 rounded-full">No Refund</span>
          </div>
        </div>

        <p className="text-xs text-slate-500 pt-3 border-t border-slate-100">
          In case of weather-related shutdowns (monsoon rain on outdoor courts) or facility maintenance, you receive a guaranteed 100% refund or free slot reschedule regardless of the time.
        </p>
      </div>
    </main>
  );
}
