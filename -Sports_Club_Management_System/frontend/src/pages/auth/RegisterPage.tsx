import React from 'react';
import { Link } from 'react-router-dom';
import { Trophy, ArrowRight, Check, Activity, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';

export default function RegisterRoleSelectionPage() {
  return (
    <div className="min-h-screen bg-[#f8f9ff] text-[#0b1c30] flex flex-col justify-between selection:bg-[#006c49] selection:text-white">
      
      {/* Top Header */}
      <header className="w-full pt-8 pb-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 group focus:outline-none">
            <div className="w-9 h-9 rounded-xl bg-[#006c49] text-white flex items-center justify-center shadow-xs">
              <Trophy className="w-4 h-4" />
            </div>
            <span className="text-xl font-bold tracking-tight text-[#0b1c30]">
              Sports<span className="text-[#006c49]">Hub</span>
            </span>
          </Link>

          <Link
            to="/"
            className="text-xs font-semibold text-slate-600 hover:text-[#006c49] px-3.5 py-1.5 rounded-xl bg-white border border-slate-200 transition-colors shadow-xs"
          >
            ← Back to Home
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 py-12">
        <div className="w-full max-w-4xl mx-auto space-y-10">
          
          {/* Header */}
          <div className="text-center max-w-xl mx-auto space-y-2">
            <Badge variant="emerald">Get Started</Badge>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-[#0b1c30] tracking-tight">
              Create Your SportsHub Account
            </h1>
            <p className="text-sm text-slate-600 leading-relaxed">
              Choose your account type to book courts or register your sports club for online management.
            </p>
          </div>

          {/* 2 Role Choice Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Player Card */}
            <Card className="p-8 flex flex-col justify-between sports-card-hover border-slate-200 space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-[#eff4ff] text-[#006c49] flex items-center justify-center border border-[#bfdbfe]/60">
                    <Activity className="w-6 h-6" />
                  </div>
                  <Badge variant="emerald">User</Badge>
                </div>

                <div>
                  <h2 className="text-xl font-bold text-[#0b1c30]">user &amp; Member</h2>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    For individual players and sports enthusiasts looking to book courts and join club memberships.
                  </p>
                </div>

                <ul className="space-y-2.5 text-xs text-slate-600 pt-2 border-t border-slate-100">
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-[#006c49] shrink-0 mt-0.5" />
                    <span>Instant court slot reservations across verified clubs</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-[#006c49] shrink-0 mt-0.5" />
                    <span>Member discounts up to 50% on courts and rentals</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-[#006c49] shrink-0 mt-0.5" />
                    <span>Digital wallet pass and QR check-in at club reception</span>
                  </li>
                </ul>
              </div>

              <div className="pt-4 border-t border-slate-100">
                <Link to="/register/player" className="block">
                  <Button variant="primary" size="md" className="w-full" rightIcon={<ArrowRight className="w-4 h-4" />}>
                    Sign Up
                  </Button>
                </Link>
              </div>
            </Card>

            {/* Club Owner Card */}
            <Card className="p-8 flex flex-col justify-between sports-card-hover border-slate-200 space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-[#ecfdf5] text-[#006c49] flex items-center justify-center border border-[#a7f3d0]">
                    <Building2 className="w-6 h-6" />
                  </div>
                  <Badge variant="blue">Club Owner</Badge>
                </div>

                <div>
                  <h2 className="text-xl font-bold text-[#0b1c30]">Sports Club Owner</h2>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    For sports venue operators, academy heads, and court owners managing court schedules and staff.
                  </p>
                </div>

                <ul className="space-y-2.5 text-xs text-slate-600 pt-2 border-t border-slate-100">
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-[#006c49] shrink-0 mt-0.5" />
                    <span>Reception counter terminal for walk-in &amp; online booking</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-[#006c49] shrink-0 mt-0.5" />
                    <span>Dynamic pricing, annual membership tiers, and payouts</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-[#006c49] shrink-0 mt-0.5" />
                    <span>Unified canteen orders, pro shop inventory, and staff HR</span>
                  </li>
                </ul>
              </div>

              <div className="pt-4 border-t border-slate-100">
                <Link to="/register/club" className="block">
                  <Button variant="outline" size="md" className="w-full" rightIcon={<ArrowRight className="w-4 h-4" />}>
                    Register Your Club
                  </Button>
                </Link>
              </div>
            </Card>

          </div>

          <div className="text-center text-xs text-slate-500">
            Already have an account?{' '}
            <Link to="/login" className="text-[#006c49] font-bold hover:underline">
              Sign In →
            </Link>
          </div>

        </div>
      </main>

      <footer className="w-full py-4 text-center text-xs text-slate-400">
        © 2026 SportsHub • Real-time Court Availability &amp; Booking
      </footer>

    </div>
  );
}
