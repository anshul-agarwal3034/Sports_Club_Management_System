import React from 'react';
import { Mail, Phone, MapPin } from 'lucide-react';

export default function ContactPage() {
  return (
    <main className="flex-1 w-full max-w-4xl mx-auto px-6 py-12 sm:py-16">
      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-[#006c49] text-xs font-semibold uppercase tracking-wider border border-emerald-200 mb-3">
        <Mail className="w-3.5 h-3.5" /> Get In Touch
      </div>
      <h1 className="text-3xl sm:text-4xl font-bold text-[#0b1c30] tracking-tight mb-6">
        Contact SportsHub Support
      </h1>

      <div className="rounded-xl bg-white border border-slate-200 p-8 shadow-sm space-y-6">
        <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
          Need help with a court booking, account access, or want to list your sports club on the platform? We&apos;re here to help.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-1">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#006c49] uppercase">
              <Mail className="w-4 h-4" /> Customer &amp; Club Support
            </div>
            <div className="text-sm font-semibold text-[#0b1c30]">support@sportshub.local</div>
            <div className="text-xs text-slate-500">Average response time: &lt; 2 hours</div>
          </div>

          <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-1">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#006c49] uppercase">
              <Phone className="w-4 h-4" /> Operations Helpline
            </div>
            <div className="text-sm font-semibold text-[#0b1c30]">+91 98765 43210</div>
            <div className="text-xs text-slate-500">Mon - Sun: 06:00 AM – 10:00 PM IST</div>
          </div>
        </div>

        <p className="text-sm text-slate-500 border-t border-slate-100 pt-4 leading-relaxed">
          If you are reporting a problem at a club, please include the club name, court name, and session time so our desk team can resolve it immediately.
        </p>
      </div>
    </main>
  );
}
