import React from 'react';
import { HelpCircle } from 'lucide-react';

export default function FAQPage() {
  return (
    <main className="flex-1 w-full max-w-4xl mx-auto px-6 py-12 sm:py-16">
      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-[#006c49] text-xs font-semibold uppercase tracking-wider border border-emerald-200 mb-3">
        <HelpCircle className="w-3.5 h-3.5" /> Help &amp; Answers
      </div>
      <h1 className="text-3xl sm:text-4xl font-bold text-[#0b1c30] tracking-tight mb-8">
        Frequently Asked Questions
      </h1>

      <div className="space-y-4">
        <div className="rounded-xl bg-white border border-slate-200 p-6 shadow-xs">
          <h2 className="text-base font-bold text-[#0b1c30] mb-2">
            How do I book a court slot?
          </h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            Find your local club on SportsHub, select your preferred sport and court, choose a date and available time slot, and confirm your booking. You will instantly receive a digital check-in pass on your phone with a QR code.
          </p>
        </div>

        <div className="rounded-xl bg-white border border-slate-200 p-6 shadow-xs">
          <h2 className="text-base font-bold text-[#0b1c30] mb-2">
            What is the cancellation and refund policy?
          </h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            You can cancel any booking for a 100% refund up to 24 hours in advance, or a 50% refund between 2 and 24 hours before your slot. Cancellations made less than 2 hours before play are non-refundable.
          </p>
        </div>

        <div className="rounded-xl bg-white border border-slate-200 p-6 shadow-xs">
          <h2 className="text-base font-bold text-[#0b1c30] mb-2">
            How does Dynamic Pricing work?
          </h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            During high-demand peak hours (typically 6:00 PM – 10:00 PM), court prices may adjust slightly upward. During off-peak hours, rates are discounted. Active club members always receive their guaranteed tier discount (up to 50% off) off the dynamic rate.
          </p>
        </div>

        <div className="rounded-xl bg-white border border-slate-200 p-6 shadow-xs">
          <h2 className="text-base font-bold text-[#0b1c30] mb-2">
            How many sessions can I book per day?
          </h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            To ensure fair court access across the sporting community, players can hold up to 2 active court reservations per day across participating clubs.
          </p>
        </div>
      </div>
    </main>
  );
}
