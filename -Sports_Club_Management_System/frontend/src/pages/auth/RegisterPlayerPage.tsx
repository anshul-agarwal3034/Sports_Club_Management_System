import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Trophy,
  ArrowRight,
  Eye,
  EyeOff,
  Check,
  CheckCircle2,
  Calendar,
  Lock,
  User,
  Phone,
  Mail,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';

export default function PlayerRegistrationPage() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    email: '',
    dateOfBirth: '',
    password: '',
    role: 'NON_MEMBER',
    clubId: '',
    termsAgreed: false,
  });

  const [clubsList, setClubsList] = useState<{ id: string; name: string }[]>([]);
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  React.useEffect(() => {
    fetch('/api/v1/clubs')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.data)) {
          setClubsList(data.data.map((c: any) => ({ id: c.id, name: c.name })));
          if (data.data.length > 0) {
            setFormData((prev) => ({ ...prev, clubId: data.data[0].id }));
          }
        }
      })
      .catch(() => {});
  }, []);

  // Age calculation
  const calculateAge = (dobString: string): number | null => {
    if (!dobString) return null;
    const dob = new Date(dobString);
    if (isNaN(dob.getTime())) return null;
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const m = today.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
      age--;
    }
    return age;
  };

  const age = calculateAge(formData.dateOfBirth);
  const isJunior = age !== null && age < 18 && age >= 0;

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.fullName.trim()) newErrors.fullName = 'Please enter your full name.';
    if (!formData.phone.trim() || formData.phone.length < 10) newErrors.phone = 'Please enter a valid 10-digit phone number.';
    if (!formData.email.trim() || !/^\S+@\S+\.\S+$/.test(formData.email)) newErrors.email = 'Please enter a valid email address.';
    if (!formData.dateOfBirth) newErrors.dateOfBirth = 'Please select your date of birth.';
    if (!formData.password || formData.password.length < 8) newErrors.password = 'Password must be at least 8 characters.';
    if (formData.role !== 'NON_MEMBER' && !formData.clubId) {
      newErrors.clubId = 'Please select the verified club venue for staff account.';
    }
    if (!formData.termsAgreed) newErrors.termsAgreed = 'You must agree to the club rules and booking terms.';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    setErrors({});

    try {
      const response = await fetch('/api/v1/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fullName: formData.fullName,
          email: formData.email,
          password: formData.password,
          phone: formData.phone,
          role: formData.role,
          clubId: formData.role !== 'NON_MEMBER' ? formData.clubId : null,
          dateOfBirth: formData.dateOfBirth || null,
        }),
      });

      const resData = await response.json();

      if (!response.ok || !resData.success) {
        const errorMsg = resData.error || resData.message || (resData.errors && resData.errors[0]?.message) || 'Registration failed.';
        setErrors({ submit: errorMsg });
        setIsSubmitting(false);
        return;
      }

      setIsSubmitting(false);
      setIsSuccess(true);
      if (resData.requiresApproval || resData.user?.status === 'PENDING') {
        setErrors({ submit: '' });
      }
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err: any) {
      setErrors({ submit: err.message || 'Unable to complete registration. Please try again.' });
      setIsSubmitting(false);
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
            to="/register"
            className="text-xs font-semibold text-slate-600 hover:text-[#006c49] px-3.5 py-1.5 rounded-xl bg-white border border-slate-200 transition-colors shadow-xs"
          >
            ← Back to Role Choice
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 py-10">
        <div className="w-full max-w-lg">
          <Card className="p-8 sm:p-10 shadow-lg border-slate-200 bg-white space-y-6">
            
            {/* Header */}
            <div className="text-center space-y-2">
              <Badge variant="emerald">Player Registration</Badge>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0b1c30] tracking-tight">
                Create Player Account
              </h1>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Join SportsHub to book courts, earn match rewards, and link club memberships.
              </p>
            </div>

            {isSuccess ? (
              <div className="text-center py-8 space-y-4">
                <div className="w-16 h-16 mx-auto rounded-2xl bg-[#ecfdf5] border border-[#a7f3d0] flex items-center justify-center text-[#006c49]">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-[#0b1c30]">Registration Complete!</h3>
                <p className="text-xs text-slate-600">
                  Your account has been created. Redirecting to Sign In...
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {errors.submit && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700">
                    {errors.submit}
                  </div>
                )}
                
                {/* Account Type Selector */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-[#0b1c30] uppercase tracking-wider">
                    Account Type / Member Role
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full py-2.5 px-3 bg-white border border-slate-200 rounded-xl text-sm text-[#0b1c30] focus:outline-none focus:ring-2 focus:ring-[#006c49]/20 focus:border-[#006c49]"
                  >
                    <option value="NON_MEMBER">Player / Club Member (Public User)</option>
                    <option value="STAFF">Front Desk Terminal Staff</option>
                    <option value="KITCHEN_MANAGER">Kitchen Manager (KDS Terminal)</option>
                    <option value="COACH">Club Coach / Instructor</option>
                  </select>
                </div>

                {/* Club Venue Selector (Only for Staff/Kitchen/Coach roles) */}
                {formData.role !== 'NON_MEMBER' && (
                  <div className="space-y-2 p-3.5 rounded-xl bg-amber-50 border border-amber-200">
                    <label className="block text-xs font-semibold text-amber-900 uppercase tracking-wider">
                      Select Verified Club Venue
                    </label>
                    <select
                      value={formData.clubId}
                      onChange={(e) => setFormData({ ...formData, clubId: e.target.value })}
                      className="w-full py-2 px-3 bg-white border border-slate-300 rounded-lg text-xs text-[#0b1c30] focus:outline-none focus:ring-2 focus:ring-[#006c49]"
                    >
                      {clubsList.length > 0 ? (
                        clubsList.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))
                      ) : (
                        <option value="">Skyline Sports Association</option>
                      )}
                    </select>
                    {errors.clubId && <p className="text-xs text-rose-600 font-medium">{errors.clubId}</p>}

                    <div className="pt-1 text-[11px] text-amber-800 font-medium leading-relaxed">
                      ⚠️ <strong>Owner Verification Required:</strong> Registrations for Staff, Coaches, and Kitchen Managers will be set to <span className="font-bold underline">Pending Approval</span> and must be verified by the selected club owner before login access is granted.
                    </div>
                  </div>
                )}

                {/* Full Name */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-[#0b1c30] uppercase tracking-wider">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                    <input
                      type="text"
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      placeholder="e.g. Aarav Sharma"
                      className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-[#0b1c30] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#006c49]/20 focus:border-[#006c49] transition-all"
                    />
                  </div>
                  {errors.fullName && <p className="text-xs text-rose-600 font-medium">{errors.fullName}</p>}
                </div>

                {/* Email Address */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-[#0b1c30] uppercase tracking-wider">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="aarav@example.com"
                      className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-[#0b1c30] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#006c49]/20 focus:border-[#006c49] transition-all"
                    />
                  </div>
                  {errors.email && <p className="text-xs text-rose-600 font-medium">{errors.email}</p>}
                </div>

                {/* Phone & Date of Birth */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-[#0b1c30] uppercase tracking-wider">
                      Phone Number
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="+91 98765 43210"
                        className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-[#0b1c30] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#006c49]/20 focus:border-[#006c49] transition-all"
                      />
                    </div>
                    {errors.phone && <p className="text-xs text-rose-600 font-medium">{errors.phone}</p>}
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-[#0b1c30] uppercase tracking-wider">
                      Date of Birth
                    </label>
                    <div className="relative">
                      <Calendar className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                      <input
                        type="date"
                        value={formData.dateOfBirth}
                        onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                        className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-[#0b1c30] focus:outline-none focus:ring-2 focus:ring-[#006c49]/20 focus:border-[#006c49] transition-all"
                      />
                    </div>
                    {errors.dateOfBirth && <p className="text-xs text-rose-600 font-medium">{errors.dateOfBirth}</p>}
                  </div>
                </div>

                {/* Junior Notice */}
                {isJunior && (
                  <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <span>
                      You qualify for <strong>Junior Academy Pricing</strong> (under 18 years). Guardian verification is required upon first club visit.
                    </span>
                  </div>
                )}

                {/* Password */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-[#0b1c30] uppercase tracking-wider">
                    Password (Min 8 Characters)
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      placeholder="••••••••••••"
                      className="w-full pl-10 pr-10 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-[#0b1c30] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#006c49]/20 focus:border-[#006c49] transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {errors.password && <p className="text-xs text-rose-600 font-medium">{errors.password}</p>}
                </div>

                {/* Terms Agreement */}
                <div className="pt-2">
                  <label className="flex items-start gap-2 text-xs text-slate-600 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.termsAgreed}
                      onChange={(e) => setFormData({ ...formData, termsAgreed: e.target.checked })}
                      className="mt-0.5 rounded text-[#006c49] focus:ring-[#006c49]"
                    />
                    <span>
                      I agree to the{' '}
                      <Link to="/terms" className="text-[#006c49] underline">Terms of Service</Link>,{' '}
                      <Link to="/privacy" className="text-[#006c49] underline">Privacy Policy</Link>, and the club booking rules.
                    </span>
                  </label>
                  {errors.termsAgreed && <p className="text-xs text-rose-600 font-medium mt-1">{errors.termsAgreed}</p>}
                </div>

                {/* Submit */}
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  isLoading={isSubmitting}
                  className="w-full mt-2"
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                >
                  Create Player Account
                </Button>

              </form>
            )}

          </Card>

          <div className="mt-6 text-center text-xs text-slate-500">
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
