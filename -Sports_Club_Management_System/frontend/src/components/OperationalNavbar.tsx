import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Building2,
  Monitor,
  UtensilsCrossed,
  Package,
  Kanban,
  Users,
  ShieldCheck,
  Award,
  Layers,
  ArrowUpRight
} from 'lucide-react';

export const OperationalNavbar = () => {
  const location = useLocation();
  const pathname = location.pathname;

  const navItems = [
    { label: 'Portal', path: '/portal', icon: Layers },
    { label: 'Owner HQ', path: '/owner', icon: Building2 },
    { label: 'Desk / POS', path: '/desk', icon: Monitor },
    { label: 'Kitchen KDS', path: '/kitchen', icon: UtensilsCrossed },
    { label: 'Inventory', path: '/inventory', icon: Package },
    { label: 'CRM Leads', path: '/crm', icon: Kanban },
    { label: 'Staff HR', path: '/staff', icon: Users },
    { label: 'Admin', path: '/admin', icon: ShieldCheck },
    { label: 'Coach', path: '/coach', icon: Award },
  ];

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-slate-200 shadow-2xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Brand & Badge */}
          <div className="flex items-center gap-3">
            <Link to="/portal" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#006c49] text-white flex items-center justify-center font-bold text-sm shadow-xs">
                SH
              </div>
              <span className="font-bold text-[#0b1c30] text-base tracking-tight">
                SportsHub <span className="text-[#006c49]">Ops</span>
              </span>
            </Link>
            <span className="text-[11px] bg-slate-100 text-slate-700 border border-slate-200 px-2 py-0.5 rounded-full font-semibold uppercase tracking-wider">
              Staff Terminal
            </span>
          </div>

          {/* Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.path || (item.path !== '/portal' && pathname.startsWith(item.path));
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-[#006c49] text-white font-semibold shadow-2xs'
                      : 'text-slate-600 hover:text-[#0b1c30] hover:bg-slate-50'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Right Action */}
          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="text-xs text-slate-600 hover:text-[#006c49] flex items-center gap-1 font-medium transition-colors"
            >
              Public Site <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
            <Link
              to="/login"
              onClick={() => {
                try {
                  localStorage.removeItem('sportshub_user');
                } catch {
                  // ignore
                }
              }}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100 transition-colors"
            >
              Sign Out
            </Link>
          </div>
        </div>

        {/* Mobile Horizontal Scroll */}
        <div className="lg:hidden flex items-center gap-1 overflow-x-auto py-2 border-t border-slate-100 scrollbar-none">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.path || (item.path !== '/portal' && pathname.startsWith(item.path));
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs whitespace-nowrap ${
                  isActive
                    ? 'bg-[#006c49] text-white font-semibold'
                    : 'text-slate-600 hover:text-[#0b1c30]'
                }`}
              >
                <Icon className="w-3 h-3" />
                {item.label}
              </Link>
            );
          })}
        </div>
      </div>
    </header>
  );
};
