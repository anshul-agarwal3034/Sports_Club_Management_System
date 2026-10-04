import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Trophy, ShoppingBag, Calendar, User, Menu, X, LogOut, ArrowRight, Shield, UtensilsCrossed } from 'lucide-react';
import { getStoredUser, logoutUser, normalizeRole, getRoleDashboard } from '@/lib/roles';
import { getCartCount } from '@/lib/cart';

export const Navbar: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [user, setUser] = useState(getStoredUser());
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const updateCart = () => setCartCount(getCartCount());
    updateCart();
    window.addEventListener('sportshub_cart_updated', updateCart);
    return () => window.removeEventListener('sportshub_cart_updated', updateCart);
  }, []);

  useEffect(() => {
    setUser(getStoredUser());
  }, [location.pathname]);

  const handleLogout = async () => {
    await logoutUser();
    setUser(null);
    navigate('/');
  };

  const role = user ? normalizeRole(user.role) : 'UNKNOWN';
  const isOpsRole = role === 'OWNER' || role === 'FRONT_DESK' || role === 'KITCHEN' || role === 'COACH' || role === 'ADMIN';

  return (
    <header className="sticky top-0 z-50 w-full bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
        
        {/* Brand */}
        <Link to="/" className="flex items-center gap-2.5 group focus:outline-none">
          <div className="w-10 h-10 rounded-xl bg-[#006c49] text-white flex items-center justify-center shadow-sm group-hover:bg-[#005237] transition-colors">
            <Trophy className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xl font-bold tracking-tight text-[#0b1c30]">
              Sports<span className="text-[#006c49]">Hub</span>
            </span>
            <span className="hidden sm:block text-[10px] text-slate-500 font-medium -mt-1 tracking-tight">
              Play & Book Courts
            </span>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-600">
          <Link
            to="/clubs"
            className={`hover:text-[#006c49] transition-colors ${
              location.pathname === '/clubs' ? 'text-[#006c49] font-semibold' : ''
            }`}
          >
            Find Courts
          </Link>
          <Link
            to="/matches"
            className={`hover:text-[#006c49] transition-colors flex items-center gap-1.5 ${
              location.pathname === '/matches' ? 'text-[#006c49] font-semibold' : ''
            }`}
          >
            <span>Matchmaking</span>
            <span className="text-[10px] bg-emerald-100 text-[#006c49] font-bold px-1.5 py-0.5 rounded-full">New</span>
          </Link>
         
          <Link
            to="/how-booking-works"
            className={`hover:text-[#006c49] transition-colors ${
              location.pathname === '/how-booking-works' ? 'text-[#006c49] font-semibold' : ''
            }`}
          >
            How It Works
          </Link>
          <Link
            to="/club/skyline-sports/memberships"
            className={`hover:text-[#006c49] transition-colors ${
              location.pathname.includes('/memberships') ? 'text-[#006c49] font-semibold' : ''
            }`}
          >
            Memberships
          </Link>
         
        </nav>

        {/* Right Action Icons / Auth Controls */}
        <div className="hidden sm:flex items-center gap-3">
          {/* Cart Icon */}
          <Link
            to="/cart"
            className="relative p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:text-[#006c49] hover:border-[#006c49]/40 hover:bg-[#ecfdf5]/40 transition-colors"
            title="Shopping Cart"
            aria-label="Shopping Cart"
          >
            <ShoppingBag className="w-4 h-4" />
            {cartCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-[#006c49] text-white text-[10px] font-bold flex items-center justify-center shadow-xs">
                {cartCount}
              </span>
            )}
          </Link>

          {user ? (
            <div className="flex items-center gap-2">
              {isOpsRole ? (
                <Link
                  to={getRoleDashboard(role, user.club_slug)}
                  className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-[#006c49] text-white hover:bg-[#005237] transition-all shadow-xs"
                >
                  <Shield className="w-3.5 h-3.5" />
                  <span>Terminal / Dashboard</span>
                </Link>
              ) : (
                <>
                  <Link
                    to="/dashboard"
                    className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-[#006c49] bg-[#ecfdf5] border border-[#a7f3d0] rounded-xl hover:bg-[#d1fae5] transition-colors"
                  >
                    <span>Dashboard</span>
                  </Link>
                  
                </>
              )}

              <button
                type="button"
                onClick={handleLogout}
                className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                title="Sign Out"
                aria-label="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="px-4 py-2 text-xs font-semibold text-[#0b1c30] hover:text-[#006c49] transition-colors rounded-xl hover:bg-slate-50"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-[#006c49] text-white hover:bg-[#005237] transition-all shadow-xs"
              >
                Sign Up
              </Link>
            </div>
          )}
        </div>

        {/* Mobile controls */}
        <div className="flex sm:hidden items-center gap-2">
          <Link
            to="/cart"
            className="relative p-2 rounded-lg border border-slate-200 text-slate-600"
            aria-label="Cart"
          >
            <ShoppingBag className="w-4 h-4" />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#006c49] text-white text-[9px] font-bold flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </Link>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-xl bg-slate-100 text-slate-700 hover:text-[#0b1c30]"
            aria-label="Toggle navigation"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

      </div>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="sm:hidden bg-white border-b border-slate-200 px-5 py-4 space-y-3 shadow-lg">
          <Link
            to="/clubs"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-sm font-medium text-slate-700 hover:text-[#006c49] py-1.5"
          >
            Find Courts
          </Link>
          <Link
            to="/matches"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-sm font-medium text-slate-700 hover:text-[#006c49] py-1.5"
          >
            Matchmaking &amp; Partners
          </Link>
          <Link
            to="/how-booking-works"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-sm font-medium text-slate-700 hover:text-[#006c49] py-1.5"
          >
            How It Works
          </Link>
          <Link
            to="/club/skyline-sports/memberships"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-sm font-medium text-slate-700 hover:text-[#006c49] py-1.5"
          >
            Club Memberships
          </Link>
          <Link
            to="/register/club"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-sm font-medium text-slate-700 hover:text-[#006c49] py-1.5"
          >
            For Clubs
          </Link>

          <div className="pt-3 border-t border-slate-100 space-y-2">
            {user ? (
              <>
                {isOpsRole ? (
                  <Link
                    to={getRoleDashboard(role, user.club_slug)}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-center gap-1.5 w-full py-2.5 rounded-xl bg-[#006c49] text-white text-xs font-semibold"
                  >
                    Open Operational Station
                  </Link>
                ) : (
                  <>
                    <Link
                      to="/my-bookings"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block text-xs font-medium text-slate-700 py-1"
                    >
                      My Bookings
                    </Link>
                    <Link
                      to="/dashboard"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block text-xs font-semibold text-[#006c49] py-1"
                    >
                      Customer Dashboard
                    </Link>
                  </>
                )}
                <button
                  type="button"
                  onClick={() => {
                    handleLogout();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full text-left text-xs font-medium text-rose-600 py-1.5"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <div className="grid grid-cols-2 gap-2 pt-1">
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-center py-2 rounded-xl border border-slate-200 text-xs font-semibold text-[#0b1c30]"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-center py-2 rounded-xl bg-[#006c49] text-white text-xs font-semibold"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
