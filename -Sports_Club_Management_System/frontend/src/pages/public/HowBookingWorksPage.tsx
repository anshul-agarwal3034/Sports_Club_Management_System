import React from 'react';
import { Link } from 'react-router-dom';
import { CalendarCheck } from 'lucide-react';

export default function HowBookingWorksPage() {
  return (
    <main className="flex-1 w-full max-w-4xl mx-auto px-6 py-12 sm:py-16">
      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-[#006c49] text-xs font-semibold uppercase tracking-wider border border-emerald-200 mb-3">
        <CalendarCheck className="w-3.5 h-3.5" /> Player Guide
      </div>
      <h1 className="text-3xl sm:text-4xl font-bold text-[#0b1c30] tracking-tight mb-6">
        How Booking Works
      </h1>

      <div className="rounded-xl bg-white border border-slate-200 p-8 shadow-sm space-y-5">
        <div className="space-y-4 text-slate-700">
          <div className="flex gap-4 items-start">
            <span className="w-7 h-7 rounded-full bg-emerald-100 text-[#006c49] font-bold text-xs flex items-center justify-center flex-shrink-0">1</span>
            <div>
              <strong className="text-[#0b1c30] block text-sm sm:text-base">Find Verified Clubs</strong>
              <p className="text-xs sm:text-sm text-slate-600 mt-0.5">Browse certified sports venues in your neighborhood and inspect facilities, court surfaces, and real photos.</p>
            </div>
          </div>

          <div className="flex gap-4 items-start">
            <span className="w-7 h-7 rounded-full bg-emerald-100 text-[#006c49] font-bold text-xs flex items-center justify-center flex-shrink-0">2</span>
            <div>
              <strong className="text-[#0b1c30] block text-sm sm:text-base">Select Date &amp; Playing Slot</strong>
              <p className="text-xs sm:text-sm text-slate-600 mt-0.5">View real-time court availability grids up to 7 days ahead and pick 1-hour slots matching your schedule.</p>
            </div>
          </div>

          <div className="flex gap-4 items-start">
            <span className="w-7 h-7 rounded-full bg-emerald-100 text-[#006c49] font-bold text-xs flex items-center justify-center flex-shrink-0">3</span>
            <div>
              <strong className="text-[#0b1c30] block text-sm sm:text-base">Instant Transparent Checkout</strong>
              <p className="text-xs sm:text-sm text-slate-600 mt-0.5">Pay via UPI, Cards, or Net Banking in Indian Rupees (₹). Club members automatically get applied discounts.</p>
            </div>
          </div>

          <div className="flex gap-4 items-start">
            <span className="w-7 h-7 rounded-full bg-emerald-100 text-[#006c49] font-bold text-xs flex items-center justify-center flex-shrink-0">4</span>
            <div>
              <strong className="text-[#0b1c30] block text-sm sm:text-base">Arrive &amp; Scan Check-in Pass</strong>
              <p className="text-xs sm:text-sm text-slate-600 mt-0.5">Show your digital booking QR code at the reception counter for seamless, zero-wait check-in.</p>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100">
          <Link
            to="/clubs"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#006c49] text-white hover:bg-[#005237] font-semibold text-xs transition-colors shadow-xs"
          >
            Find Open Courts Now
          </Link>
        </div>
      </div>
    </main>
  );
}
