import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Trophy,
  ArrowRight,
  Lock,
  Mail,
  Eye,
  EyeOff,
  CheckCircle2,
  BadgeCheck,
  ShieldCheck
} from 'lucide-react';
import { redirectByRole, normalizeRole } from '@/lib/roles';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';

export { redirectByRole };

interface LoginResponse {
  success?: boolean;
  error?: string;
  user?: {
    id: string;
    email: string;
    role: string;
    club_slug?: string;
    full_name?: string;
  };
}

export default function LoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectParam = searchParams.get('redirect');

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [keepSignedIn, setKeepSignedIn] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [redirectNotice, setRedirectNotice] = useState<string | null>(null);
  const [activeRole, setActiveRole] = useState<string>('MEMBER');

  // Quick preset fills for convenient credential entry
  const handleQuickDemoFill = (roleId: string, roleType: string) => {
    setIdentifier(roleId);
    setPassword('MatchPoint2026!');
    setActiveRole(roleType);
    setErrorMessage('');
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setRedirectNotice(null);

    if (!identifier.trim()) {
      setErrorMessage('Please enter your email address or phone number.');
      return;
    }
    if (!password) {
      setErrorMessage('Please enter your password.');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: identifier,
          password: password,
        }),
      });

      const resData = await response.json();

      if (!response.ok || !resData.success) {
        const errorMsg = resData.error || resData.message || (resData.errors && resData.errors[0]?.message) || 'Invalid email or password';
        setErrorMessage(errorMsg);
        setIsLoading(false);
        return;
      }

      const payload = resData.data || resData;
      const targetUser = payload.user;

      if (payload.token) {
        localStorage.setItem('sportshub_token', payload.token);
      }
      if (targetUser) {
        localStorage.setItem('sportshub_user', JSON.stringify(targetUser));
      }
      const targetRoute = redirectByRole(targetUser || { role: activeRole });

      setRedirectNotice('Signed in successfully. Opening your dashboard...');
      setTimeout(() => {
        navigate(targetRoute);
      }, 500);

    } catch (err: any) {
      setErrorMessage(err.message || 'Network error: Unable to connect to login service.');
    } finally {
      setIsLoading(false);
    }
  };

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

      {/* Main Centered Sign-In Card */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 py-10">
        <div className="w-full max-w-md">
          <Card className="p-8 sm:p-10 shadow-lg border-slate-200 bg-white space-y-6">
            
            {/* Header Titles */}
            <div className="text-center space-y-2">
              <Badge variant="emerald">Account Access</Badge>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0b1c30] tracking-tight">
                Sign In to SportsHub
              </h1>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                Players, club owners, front desk reception, and coaches sign in here.
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              
              {/* Identifier */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-[#0b1c30] uppercase tracking-wider">
                  Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                  <input
                    type="text"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="alex@example.com"
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-[#0b1c30] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#006c49]/20 focus:border-[#006c49] transition-all"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-[#0b1c30] uppercase tracking-wider">
                    Password
                  </label>
                  <Link to="/contact" className="text-xs text-[#006c49] hover:underline font-medium">
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-10 pr-10 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-[#0b1c30] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#006c49]/20 focus:border-[#006c49] transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600"
                    aria-label="Toggle password visibility"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Keep me signed in */}
              <div className="pt-1">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={keepSignedIn}
                    onChange={(e) => setKeepSignedIn(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-[#006c49] focus:ring-[#006c49]"
                  />
                  <span className="text-xs text-slate-600 font-medium">Keep me signed in</span>
                </label>
              </div>

              {/* Error Message */}
              {errorMessage && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700">
                  {errorMessage}
                </div>
              )}

              {/* Success / Redirect Notice */}
              {redirectNotice && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#006c49] shrink-0" />
                  <span>{redirectNotice}</span>
                </div>
              )}

              {/* Action Button */}
              <Button
                type="submit"
                variant="primary"
                size="lg"
                isLoading={isLoading}
                className="w-full mt-2"
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Sign In
              </Button>
            </form>

            {/* Staff notice */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 text-[#006c49] shrink-0 mt-0.5" />
              <div className="text-xs text-slate-600 leading-relaxed">
                <strong>Club Staff &amp; Coaches:</strong> Sign in with the credentials assigned by your club owner to be routed straight to your shift screen.
              </div>
            </div>

            {/* Quick Demo Logins */}
            <div className="pt-4 border-t border-slate-100">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-2 font-mono">
                Quick Demo Presets:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { label: 'Player', id: 'alex.morgan@gmail.com', role: 'MEMBER' },
                  { label: 'Club Owner', id: 'owner@skylineclub.com', role: 'CLUB_OWNER' },
                  { label: 'Front Desk', id: 'desk@skylineclub.com', role: 'STAFF' },
                  { label: 'Kitchen', id: 'kitchen@skylineclub.com', role: 'KITCHEN_MANAGER' },
                  { label: 'Coach', id: 'coach.rahul@skylineclub.com', role: 'COACH' },
                  { label: 'Platform Admin', id: 'admin@sportshub.com', role: 'PLATFORM_ADMIN' },
                ].map((item) => (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => handleQuickDemoFill(item.id, item.role)}
                    className="px-2.5 py-1 rounded-lg text-[10px] font-semibold font-mono bg-slate-50 border border-slate-200 text-slate-700 hover:border-[#006c49] hover:text-[#006c49] transition-colors cursor-pointer"
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

          </Card>

          {/* Footer Sign Up Link */}
          <div className="mt-6 text-center text-xs text-slate-500">
            Don&apos;t have an account yet?{' '}
            <Link to="/register" className="text-[#006c49] font-bold hover:underline ml-1">
              Create an account →
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
