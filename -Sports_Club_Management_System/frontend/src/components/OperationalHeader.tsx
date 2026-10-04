import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Trophy,
  Monitor,
  UtensilsCrossed,
  Award,
  ShieldCheck,
  Building2,
  ArrowUpRight,
  LogOut,
  CircleDot
} from 'lucide-react';
import { AuthUser, UserRole, getRoleBadge, logoutUser } from '@/lib/roles';

interface OperationalHeaderProps {
  user: AuthUser;
  role: UserRole;
}

export const OperationalHeader: React.FC<OperationalHeaderProps> = ({ user, role }) => {
  const navigate = useNavigate();
  const [showProfileModal, setShowProfileModal] = React.useState(false);

  const handleLogout = async () => {
    await logoutUser();
    navigate('/login');
  };

  const getRoleConfig = () => {
    switch (role) {
      case 'FRONT_DESK':
        return {
          icon: Monitor,
          title: 'Front Desk Terminal',
          status: 'Court Availability & Walk-in POS',
          badgeColor: 'text-[#006c49] border-[#a7f3d0] bg-[#ecfdf5]',
          activeColor: 'text-[#006c49]',
        };
      case 'KITCHEN':
        return {
          icon: UtensilsCrossed,
          title: 'Kitchen Orders',
          status: 'Active Kitchen Order Board',
          badgeColor: 'text-amber-800 border-amber-300 bg-amber-50',
          activeColor: 'text-amber-600',
        };
      case 'COACH':
        return {
          icon: Award,
          title: 'Coach Station',
          status: 'Daily Training Schedule & Sessions',
          badgeColor: 'text-blue-800 border-blue-300 bg-blue-50',
          activeColor: 'text-blue-600',
        };
      case 'ADMIN':
        return {
          icon: ShieldCheck,
          title: 'Platform Admin',
          status: 'Club Verification & Control Center',
          badgeColor: 'text-purple-800 border-purple-300 bg-purple-50',
          activeColor: 'text-purple-600',
        };
      default:
        return {
          icon: Trophy,
          title: 'Staff Terminal',
          status: 'Active Shift',
          badgeColor: 'text-[#006c49] border-[#a7f3d0] bg-[#ecfdf5]',
          activeColor: 'text-[#006c49]',
        };
    }
  };

  const [liveClubName, setLiveClubName] = React.useState<string>(
    user.club_name || (user as any).clubName || ''
  );

  React.useEffect(() => {
    if (user.club_name || (user as any).clubName) {
      setLiveClubName(user.club_name || (user as any).clubName);
      return;
    }

    const clubId = (user as any).club_id || (user as any).clubId;
    if (clubId) {
      fetch(`/api/v1/clubs/${clubId}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.data?.name) {
            setLiveClubName(data.data.name);
          }
        })
        .catch(() => {});
    }
  }, [user]);

  const config = getRoleConfig();
  const RoleIcon = config.icon;
  const displayClubName =
    role === 'ADMIN'
      ? 'All Partner Clubs (Platform Level)'
      : liveClubName || (user as any).club_id ? `Club #${((user as any).club_id || '').slice(0, 8)}` : 'Sports Association';

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/90 shadow-xs selection:bg-[#006c49] selection:text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16 sm:h-18">
            
            {/* Left: Branding & Role Identity */}
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[#006c49] text-white flex items-center justify-center shadow-xs">
                  <Trophy className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-base sm:text-lg font-bold tracking-tight text-[#0b1c30]">
                    Sports<span className="text-[#006c49]">Hub</span>
                  </span>
                  <div className="hidden sm:flex items-center gap-1.5 text-[10px] text-slate-500 font-medium">
                    <Building2 className="w-3 h-3 text-[#006c49]" />
                    <span>{displayClubName}</span>
                  </div>
                </div>
              </div>

              {/* Role Badge */}
              <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wider border ${config.badgeColor}`}>
                <RoleIcon className="w-3.5 h-3.5" />
                <span>{getRoleBadge(role)}</span>
              </div>
            </div>

            {/* Center: Active View Status Indicator (visible on md+) */}
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-50 border border-slate-200 text-xs">
              <CircleDot className={`w-3.5 h-3.5 ${config.activeColor} animate-pulse`} />
              <span className="text-[#0b1c30] font-semibold">{config.status}</span>
            </div>

            {/* Right: User identity & Actions */}
            <div className="flex items-center gap-2 sm:gap-3">
              <button
                type="button"
                onClick={() => setShowProfileModal(true)}
                className="hidden lg:block text-right pr-3 border-r border-slate-200 hover:bg-slate-50 p-1.5 rounded-xl transition-colors cursor-pointer"
                title="View Profile Details"
              >
                <div className="text-xs font-bold text-[#006c49] underline truncate max-w-[180px]">
                  {user.email || user.full_name || 'Staff User'}
                </div>
                <div className="text-[10px] text-slate-400 font-medium uppercase">
                  Click to View Profile
                </div>
              </button>

              <Link
                to="/"
                className="text-xs text-slate-600 hover:text-[#006c49] flex items-center gap-1 font-medium transition-colors px-2 py-1.5 rounded-lg hover:bg-slate-50"
              >
                <span className="hidden sm:inline">Public Site</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>

              <button
                type="button"
                onClick={handleLogout}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 text-xs font-semibold text-slate-700 hover:text-rose-700 transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </div>

          </div>
        </div>
      </header>

      {/* User Profile Modal */}
      {showProfileModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-5 animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-start border-b border-slate-100 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-[#ecfdf5] border border-[#a7f3d0] flex items-center justify-center text-[#006c49] font-bold text-lg">
                  {(user.full_name || user.email || 'U')[0].toUpperCase()}
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#0b1c30]">
                    {user.full_name || 'Operator Profile'}
                  </h3>
                  <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${config.badgeColor}`}>
                    {getRoleBadge(role)}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setShowProfileModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-700">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500">Email Address:</span>
                  <strong className="text-[#0b1c30] font-mono">{user.email}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">System User Role:</span>
                  <strong className="text-[#006c49]">{role}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Assigned Club:</span>
                  <strong className="text-[#0b1c30]">{displayClubName}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Club ID:</span>
                  <span className="font-mono text-[11px] text-slate-600">{(user as any).club_id || (user as any).clubId || 'System Platform Level'}</span>
                </div>
              </div>

              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-900 space-y-1">
                <div className="font-bold flex items-center gap-1.5 text-xs">
                  <ShieldCheck className="w-4 h-4 text-[#006c49]" /> Verified Operational Access
                </div>
                <p className="text-[11px] text-emerald-700">
                  Full administrative authority to manage shift terminals, process bookings, update tickets, and record transactions.
                </p>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setShowProfileModal(false)}
                className="px-4 py-2 bg-[#006c49] hover:bg-[#005237] text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer"
              >
                Close Profile
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
