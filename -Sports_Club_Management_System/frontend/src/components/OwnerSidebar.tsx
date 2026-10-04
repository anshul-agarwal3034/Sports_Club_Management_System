import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { api } from '@/services/api';
import {
  Trophy,
  LayoutDashboard,
  SlidersHorizontal,
  DollarSign,
  Megaphone,
  Package,
  Kanban,
  Users,
  Building2,
  ArrowUpRight,
  LogOut,
  Menu,
  X,
  ShieldCheck,
  CircleDot,
  Settings,
  AlertCircle,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import { AuthUser, getNavItemsForRole, logoutUser } from '@/lib/roles';

interface OwnerSidebarProps {
  user: AuthUser;
}

export const OwnerSidebar: React.FC<OwnerSidebarProps> = ({ user }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const pathname = location.pathname;
  const navItems = getNavItemsForRole('OWNER');

  const handleLogout = async () => {
    await logoutUser();
    navigate('/login');
  };

  const getIcon = (name: string) => {
    switch (name) {
      case 'LayoutDashboard': return LayoutDashboard;
      case 'Settings': return Settings;
      case 'Trophy': return Trophy;
      case 'SlidersHorizontal': return SlidersHorizontal;
      case 'DollarSign': return DollarSign;
      case 'Megaphone': return Megaphone;
      case 'Package': return Package;
      case 'Kanban': return Kanban;
      case 'Users': return Users;
      default: return LayoutDashboard;
    }
  };

  const [setupStatus, setSetupStatus] = useState<string>('APPROVED');
  const [rejectionReason, setRejectionReason] = useState<string | null>(null);

  useEffect(() => {
    const clubId = (user as any).club_id || (user as any).clubId;
    if (clubId) {
      api.getClubSetupStatus(clubId).then((res) => {
        if (res && res.setup_status) {
          setSetupStatus(res.setup_status);
          if (res.rejection_reason) setRejectionReason(res.rejection_reason);
        }
      }).catch(() => {});
    }
  }, [user]);

  const clubTitle = user.club_name || 'Skyline Sports Association';

  const renderNavLinks = () => (
    <nav className="space-y-1">
      {navItems.map((item) => {
        const Icon = getIcon(item.iconName);
        const isActive =
          pathname === item.path ||
          (item.path !== '/owner' && pathname.startsWith(item.path));

        return (
          <Link
            key={item.path}
            to={item.path}
            onClick={() => setMobileMenuOpen(false)}
            className={`group flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
              isActive
                ? 'bg-[#006c49] text-white font-semibold shadow-xs'
                : 'text-slate-600 hover:text-[#0b1c30] hover:bg-slate-100/80'
            }`}
          >
            <div
              className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
                isActive
                  ? 'bg-white/20 text-white'
                  : 'bg-slate-100 text-slate-500 group-hover:text-[#006c49]'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="truncate">{item.label}</div>
            </div>

            {isActive && (
              <span className="w-1.5 h-1.5 rounded-full bg-white shrink-0" />
            )}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <>
      {/* 1. Mobile Header */}
      <header className="lg:hidden sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 py-3 shadow-xs">
        <div className="flex items-center justify-between">
          <Link to="/owner" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#006c49] text-white flex items-center justify-center shadow-xs">
              <Trophy className="w-4 h-4" />
            </div>
            <div>
              <span className="text-base font-bold text-[#0b1c30]">
                Sports<span className="text-[#006c49]">Hub</span>
              </span>
              <span className="ml-1.5 text-[10px] font-semibold text-[#006c49] bg-[#ecfdf5] px-1.5 py-0.5 rounded border border-[#a7f3d0] uppercase">
                Owner HQ
              </span>
            </div>
          </Link>

          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-xl bg-slate-100 text-slate-700 hover:text-[#0b1c30]"
            aria-label="Toggle navigation"
          >
            {mobileMenuOpen ? <X className="w-5 h-5 text-[#006c49]" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="pt-4 pb-2 border-t border-slate-100 mt-3 space-y-4">
            <div className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
              <div className="text-xs font-semibold text-[#0b1c30] truncate">{clubTitle}</div>
              <span className="text-[10px] font-semibold text-[#006c49] bg-[#ecfdf5] px-2 py-0.5 rounded-full border border-[#a7f3d0]">
                Verified Facility
              </span>
            </div>

            {renderNavLinks()}

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between px-1">
              <Link
                to="/"
                onClick={() => setMobileMenuOpen(false)}
                className="text-xs font-medium text-slate-500 hover:text-[#006c49] flex items-center gap-1"
              >
                Public Site <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-700"
              >
                <LogOut className="w-3.5 h-3.5" /> Sign Out
              </button>
            </div>
          </div>
        )}
      </header>

      {/* 2. Desktop Fixed Sidebar */}
      <aside className="hidden lg:flex fixed top-0 left-0 bottom-0 w-64 bg-white border-r border-slate-200/90 shadow-xs flex-col justify-between z-30 select-none">
        
        {/* Top: Logo & Club Branding */}
        <div className="p-5 border-b border-slate-100 space-y-4">
          <Link to="/owner" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-[#006c49] text-white flex items-center justify-center shadow-xs">
              <Trophy className="w-4 h-4" />
            </div>
            <div>
              <div className="text-base font-bold tracking-tight text-[#0b1c30]">
                Sports<span className="text-[#006c49]">Hub</span>
              </div>
              <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                Club Management HQ
              </div>
            </div>
          </Link>

          {/* Club Identity Card */}
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#0b1c30] truncate">
              <Building2 className="w-3.5 h-3.5 text-[#006c49] shrink-0" />
              <span className="truncate">{clubTitle}</span>
            </div>
            <div className="flex items-center justify-between text-[10px] text-slate-500">
              <span>Main Arena</span>
              {setupStatus === 'APPROVED' && (
                <span className="text-[#006c49] font-medium flex items-center gap-0.5">
                  <ShieldCheck className="w-3 h-3" /> Verified
                </span>
              )}
              {setupStatus === 'PENDING_REVIEW' && (
                <span className="text-blue-600 font-medium flex items-center gap-0.5">
                  <Clock className="w-3 h-3" /> In Review
                </span>
              )}
              {setupStatus === 'INCOMPLETE' && (
                <span className="text-amber-600 font-medium flex items-center gap-0.5">
                  <AlertCircle className="w-3 h-3" /> Incomplete
                </span>
              )}
              {setupStatus === 'REJECTED' && (
                <span className="text-rose-600 font-medium flex items-center gap-0.5">
                  <AlertCircle className="w-3 h-3" /> Needs Fix
                </span>
              )}
            </div>
          </div>

          {/* Contextual Setup Status Banner */}
          {setupStatus === 'INCOMPLETE' && (
            <Link
              to="/owner/settings"
              className="block p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs hover:bg-amber-100 transition-colors"
            >
              <div className="flex items-center gap-1.5 font-bold text-amber-800">
                <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" /> Complete Club Setup
              </div>
              <div className="text-[11px] text-amber-700 mt-0.5">
                Add courts, 3+ photos per sport, and submit verification docs.
              </div>
            </Link>
          )}
          {setupStatus === 'PENDING_REVIEW' && (
            <div className="p-2.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 text-xs">
              <div className="flex items-center gap-1.5 font-bold text-blue-800">
                <Clock className="w-3.5 h-3.5 text-blue-600 shrink-0" /> Application In Review
              </div>
              <div className="text-[11px] text-blue-700 mt-0.5">
                Platform admin inspection in progress. Status: PENDING_REVIEW.
              </div>
            </div>
          )}
          {setupStatus === 'REJECTED' && (
            <Link
              to="/owner/settings"
              className="block p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs hover:bg-rose-100 transition-colors"
            >
              <div className="flex items-center gap-1.5 font-bold text-rose-800">
                <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" /> Action Required
              </div>
              <div className="text-[11px] text-rose-700 mt-0.5">
                {rejectionReason || 'Please update your business details or documents.'} Click to fix.
              </div>
            </Link>
          )}
        </div>

        {/* Middle: Navigation Items */}
        <div className="flex-1 overflow-y-auto px-3.5 py-4 space-y-2">
          <div className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Operations &amp; Setup
          </div>
          {renderNavLinks()}
        </div>

        {/* Bottom: User Card & Sign Out */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 space-y-3">
          <div className="flex items-center justify-between">
            <div className="truncate pr-2">
              <div className="text-xs font-bold text-[#0b1c30] truncate">
                {user.email || 'club.owner@skyline.com'}
              </div>
              <span className="inline-block text-[10px] font-semibold text-[#006c49] bg-[#ecfdf5] px-1.5 py-0.5 rounded border border-[#a7f3d0]">
                Club Owner
              </span>
            </div>
            <Link
              to="/"
              title="View Public Site"
              className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:text-[#006c49] transition-colors"
            >
              <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-white hover:bg-rose-50 border border-slate-200 hover:border-rose-200 text-xs font-semibold text-slate-700 hover:text-rose-700 transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>

      </aside>
    </>
  );
};
