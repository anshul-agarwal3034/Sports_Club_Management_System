import React from 'react';
import { Lock } from 'lucide-react';

export default function PrivacyPage() {
  return (
    <main className="flex-1 w-full max-w-4xl mx-auto px-6 py-12 sm:py-16">
      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-[#006c49] text-xs font-semibold uppercase tracking-wider border border-emerald-200 mb-3">
        <Lock className="w-3.5 h-3.5" /> Data Security &amp; Trust
      </div>
      <h1 className="text-3xl sm:text-4xl font-bold text-[#0b1c30] tracking-tight mb-6">
        Privacy Policy
      </h1>

      <div className="rounded-xl bg-white border border-slate-200 p-8 shadow-sm space-y-4">
        <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
          SportsHub respects your privacy and is committed to safeguarding personal player and financial data.
        </p>
        <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
          We only collect data necessary to manage your court reservations and subscriptions: your full name, mobile number, email address, and booking receipts.
        </p>
        <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
          Your information is shared strictly with the specific club where you book playing slots to allow reception staff to verify your entry pass.
        </p>
        <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
          We never sell contact records, phone numbers, or email addresses to third-party advertisers. All payment transactions are encrypted and processed by authorized Indian payment gateways under RBI standards.
        </p>
      </div>
    </main>
  );
}
