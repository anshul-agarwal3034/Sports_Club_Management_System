import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Building2,
  UtensilsCrossed,
  Monitor,
  Package,
  Kanban,
  Users,
  ShieldCheck,
  SlidersHorizontal,
  DollarSign,
  ArrowRight,
  Sparkles,
  Trophy,
  CheckCircle2,
  TrendingUp,
  Activity,
  Loader2
} from 'lucide-react';
import { api } from '@/services/api';
import { Club } from '@/types';

export default function HomePortalPage() {
  const [currentClub, setCurrentClub] = useState<Club | null>(null);
  const [bookingsCount, setBookingsCount] = useState(0);
  const [ordersCount, setOrdersCount] = useState(0);
  const [membersCount, setMembersCount] = useState(0);
  const [todayRevenue, setTodayRevenue] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadPortalStats = async () => {
      setIsLoading(true);
      try {
        let clubId = '';
        const stored = localStorage.getItem('sportshub_user');
        if (stored) {
          const parsed = JSON.parse(stored);
          clubId = parsed.club_id || parsed.clubId || '';
        }

        const clubs = await api.getClubs().catch(() => []);
        const club = clubs.find((c) => c.id === clubId) || clubs[0] || null;
        setCurrentClub(club);

        const targetClubId = club?.id || clubId || '11111111-1111-1111-1111-111111111111';

        const [bookings, orders, users, overview] = await Promise.all([
          api.getBookings(targetClubId).catch(() => []),
          api.getOrders(targetClubId).catch(() => []),
          api.getUsers(targetClubId).catch(() => []),
          api.getFinancialOverview(targetClubId).catch(() => null),
        ]);

        setBookingsCount(bookings.length);
        setOrdersCount(orders.filter((o: any) => o.status !== 'SERVED').length);
        setMembersCount(users.length);
        if (overview?.summary?.totalIncome) {
          setTodayRevenue(overview.summary.totalIncome);
        } else {
          const bRev = bookings.reduce((acc: number, b: any) => acc + (Number(b.price) || 0), 0);
          setTodayRevenue(bRev);
        }
      } catch {
        // ignore
      } finally {
        setIsLoading(false);
      }
    };

    loadPortalStats();
  }, []);

  const portals = [
    {
      title: 'Owner Executive Dashboard',
      description: 'KPI summary, court occupancy, peak-hour heatmap, revenue category split, and financial health.',
      href: '/owner',
      icon: Building2,
      badge: 'Main Owner View',
    },
    {
      title: 'Club Setup Wizard',
      description: 'Register club details, setup sports & courts, declare services, and submit verification application.',
      href: '/owner/onboarding',
      icon: Trophy,
      badge: 'Setup Form',
    },
    {
      title: 'Dynamic Pricing Simulator',
      description: 'Tune strategy (Conservative / Balanced / Aggressive), peak hours, price floor/ceiling & test slots live.',
      href: '/owner/dynamic-pricing',
      icon: SlidersHorizontal,
      badge: 'Pricing Engine',
    },
    {
      title: 'Finance & Payouts',
      description: 'Gross revenue ledger, 10% platform commission breakdown, net payout status & expenses.',
      href: '/owner/finance',
      icon: DollarSign,
      badge: 'Accounting',
    },
    {
      title: 'Front Desk Terminal',
      description: 'Live availability court matrix, quick walk-in booking, member QR scanner lookup & counter sales.',
      href: '/desk',
      icon: Monitor,
      badge: 'Reception Desk',
    },
    {
      title: 'Canteen & Kitchen KDS',
      description: 'Table picker, member tab runner, live kitchen status (New → Preparing → Ready → Served), split bill.',
      href: '/kitchen',
      icon: UtensilsCrossed,
      badge: 'Kitchen Orders',
    },
    {
      title: 'Stock & Inventory Manager',
      description: 'Unified online & counter stock, gear/accessories tracking, low-stock alerts & restock triggers.',
      href: '/inventory',
      icon: Package,
      badge: 'Inventory',
    },
    {
      title: 'CRM Lead Pipeline',
      description: 'Student & member lead pipeline board: New Enquiry → Trial Scheduled → Quote Sent → Member.',
      href: '/crm',
      icon: Kanban,
      badge: 'Sales & Leads',
    },
    {
      title: 'Staff & Coach HR Desk',
      description: 'Employee directory, shift hours, leave approvals, coach scheduling & session logs.',
      href: '/staff',
      icon: Users,
      badge: 'HR & Staffing',
    },
    {
      title: 'Coach Sessions Desk',
      description: 'View scheduled private training sessions, assigned courts, and player rosters.',
      href: '/coach',
      icon: Trophy,
      badge: 'Coaching',
    },
    {
      title: 'Platform Admin Desk',
      description: 'Club verification queue, GST/PAN review, site inspection status, Verified badge & complaints.',
      href: '/admin',
      icon: ShieldCheck,
      badge: 'Platform Control',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Card */}
      <div className="relative overflow-hidden rounded-xl bg-white border border-slate-200 p-6 sm:p-8 shadow-sm">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-[#006c49] text-xs font-semibold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" /> Club Management Suite
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#0b1c30] tracking-tight">
              Sports Club Operations Portal
            </h1>
            <p className="text-slate-600 text-sm leading-relaxed">
              Complete operational management desk covering Owner Dashboards, Dynamic Pricing, Kitchen Display System (KDS), Front Desk Terminal, HR, CRM, Stock, and Platform Admin Verification.
            </p>
          </div>

          <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl flex flex-col gap-1.5 min-w-[240px]">
            <div className="text-xs text-slate-500 font-semibold uppercase">Active Operating Club</div>
            <div className="flex items-center gap-2 text-[#006c49] font-bold text-base">
              <Building2 className="w-4 h-4" />
              {currentClub ? currentClub.name : 'Loading Club...'}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-600 mt-0.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#006c49]" />
              {currentClub?.is_verified ? 'GST/PAN Verified & Inspected' : 'Compliance in Verification'}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Metrics Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center gap-3 shadow-xs">
          <div className="p-2.5 bg-emerald-50 rounded-xl text-[#006c49] border border-emerald-200">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-500">Gross Income</div>
            <div className="text-lg font-bold text-[#0b1c30]">
              {isLoading ? '...' : `₹${todayRevenue.toLocaleString()}`}
            </div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center gap-3 shadow-xs">
          <div className="p-2.5 bg-blue-50 rounded-xl text-blue-600 border border-blue-200">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-500">Court Bookings</div>
            <div className="text-lg font-bold text-[#0b1c30]">
              {isLoading ? '...' : `${bookingsCount} Sessions`}
            </div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center gap-3 shadow-xs">
          <div className="p-2.5 bg-amber-50 rounded-xl text-amber-600 border border-amber-200">
            <UtensilsCrossed className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-500">Active Kitchen Orders</div>
            <div className="text-lg font-bold text-[#0b1c30]">
              {isLoading ? '...' : `${ordersCount} Orders`}
            </div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center gap-3 shadow-xs">
          <div className="p-2.5 bg-purple-50 rounded-xl text-purple-600 border border-purple-200">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-500">Active Club Members</div>
            <div className="text-lg font-bold text-[#0b1c30]">
              {isLoading ? '...' : `${membersCount} Members`}
            </div>
          </div>
        </div>
      </div>

      {/* Operations Portal Grid */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-[#0b1c30] tracking-tight">
          Operational Portals &amp; Workstations
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {portals.map((portal) => {
            const Icon = portal.icon;
            return (
              <Link
                key={portal.href}
                to={portal.href}
                className="group relative bg-white border border-slate-200 hover:border-[#006c49] rounded-xl p-5 transition-all hover:shadow-md flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-[#006c49]">
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                      {portal.badge}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-[#0b1c30] group-hover:text-[#006c49] transition-colors">
                      {portal.title}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                      {portal.description}
                    </p>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-[#006c49]">
                  <span>Open Portal</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
