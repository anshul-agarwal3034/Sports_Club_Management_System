import React from 'react';
import { Link } from 'react-router-dom';
import { Trophy, ShieldCheck, Mail, MapPin } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full bg-white border-t border-slate-200/90 text-slate-600 text-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        
        {/* Top 4-Column Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 pb-12 border-b border-slate-100">
          
          {/* Brand Info */}
          <div className="space-y-4 lg:col-span-2">
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="w-9 h-9 rounded-xl bg-[#006c49] text-white flex items-center justify-center shadow-xs">
                <Trophy className="w-4 h-4" />
              </div>
              <span className="text-xl font-bold tracking-tight text-[#0b1c30]">
                Sports<span className="text-[#006c49]">Hub</span>
              </span>
            </Link>

            <p className="text-xs text-slate-500 max-w-sm leading-relaxed">
              Find verified sports clubs, book court slots in advance, join annual memberships, and order sports gear &amp; nutrition.
            </p>

            <div className="pt-1 flex items-center gap-4 text-xs text-slate-500">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-[#006c49]" /> Verified Sports Clubs
              </span>
              <span className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-[#006c49]" /> Mumbai • Delhi • Bengaluru
              </span>
            </div>
          </div>

          {/* Column 1: Players & Booking */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#0b1c30]">
              For Players
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/clubs" className="hover:text-[#006c49] transition-colors">
                  Find Courts &amp; Venues
                </Link>
              </li>
              <li>
                <Link to="/how-booking-works" className="hover:text-[#006c49] transition-colors">
                  How Booking Works
                </Link>
              </li>
              <li>
                <Link to="/club/skyline-sports/memberships" className="hover:text-[#006c49] transition-colors">
                  Membership Plans
                </Link>
              </li>
              <li>
                <Link to="/my-bookings" className="hover:text-[#006c49] transition-colors">
                  My Bookings
                </Link>
              </li>
              <li>
                <Link to="/referral" className="hover:text-[#006c49] transition-colors">
                  Referral Program
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 2: Sports Clubs */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#0b1c30]">
              For Club Owners
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/register/club" className="hover:text-[#006c49] transition-colors">
                  Register Your Club
                </Link>
              </li>
              <li>
                <Link to="/how-we-verify" className="hover:text-[#006c49] transition-colors">
                  Verification Guidelines
                </Link>
              </li>
              <li>
                <Link to="/corporate" className="hover:text-[#006c49] transition-colors">
                  Corporate Tournament Host
                </Link>
              </li>
              <li>
                <Link to="/academic" className="hover:text-[#006c49] transition-colors">
                  College &amp; School Passes
                </Link>
              </li>
              <li>
                <Link to="/login" className="hover:text-[#006c49] transition-colors">
                  Club Staff Login
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Trust & Legal */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#0b1c30]">
              Trust &amp; Legal
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/refunds" className="hover:text-[#006c49] transition-colors">
                  Cancellations &amp; Refunds
                </Link>
              </li>
              <li>
                <Link to="/terms" className="hover:text-[#006c49] transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="hover:text-[#006c49] transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/faq" className="hover:text-[#006c49] transition-colors">
                  Frequently Asked Questions
                </Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-[#006c49] transition-colors">
                  Contact Support
                </Link>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div>
            © 2026 SportsHub. All court bookings, memberships &amp; inventory managed locally in India.
          </div>
          <div className="flex items-center gap-6">
            <span className="flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-[#006c49]" /> support@sportshub.in
            </span>
            <span className="font-mono text-[11px] bg-slate-100 px-2.5 py-1 rounded-md text-slate-600">
              Prices shown in ₹ INR
            </span>
          </div>
        </div>

      </div>
    </footer>
  );
};
