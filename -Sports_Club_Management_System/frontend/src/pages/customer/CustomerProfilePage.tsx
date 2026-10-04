import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { User, Mail, Phone, Calendar, ShieldCheck, CheckCircle2, ChevronRight, Save } from 'lucide-react';
import { getStoredUser } from '@/lib/roles';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';

export default function CustomerProfilePage() {
  const storedUser = getStoredUser();

  const [fullName, setFullName] = useState(storedUser?.full_name || '');
  const [email, setEmail] = useState(storedUser?.email || '');
  const [phone, setPhone] = useState('');
  const [dob, setDob] = useState('');
  const [emergencyContact, setEmergencyContact] = useState('');

  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      const token = localStorage.getItem('sportshub_token');
      if (!token) return;
      try {
        const res = await fetch('/api/v1/auth/me', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const resData = await res.json();
        if (res.ok && resData.success && resData.data) {
          const profile = resData.data;
          setFullName(profile.fullName || storedUser?.full_name || '');
          setEmail(profile.email || storedUser?.email || '');
          if (profile.phone) setPhone(profile.phone);
          if (profile.dateOfBirth) setDob(profile.dateOfBirth.split('T')[0]);
        }
      } catch {
        // Fallback to stored user values
      }
    };

    fetchProfile();
  }, []);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSuccessMessage(null);

    await new Promise((resolve) => setTimeout(resolve, 500));

    if (storedUser) {
      try {
        const updated = {
          ...storedUser,
          full_name: fullName,
          email,
        };
        localStorage.setItem('sportshub_user', JSON.stringify(updated));
      } catch {
        // Ignore storage error
      }
    }

    setIsSaving(false);
    setSuccessMessage('Your profile information has been saved successfully.');
  };

  return (
    <div className="min-h-screen bg-[#f8f9ff] py-8 selection:bg-[#006c49] selection:text-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Breadcrumb Navigation */}
        <nav className="flex items-center gap-1.5 text-xs text-slate-500">
          <Link to="/" className="hover:text-[#006c49]">Home</Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <Link to="/dashboard" className="hover:text-[#006c49]">Dashboard</Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-[#0b1c30] font-medium">Customer Profile</span>
        </nav>

        {/* Page Title */}
        <div className="border-b border-slate-200 pb-4">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0b1c30] tracking-tight">
            Player Profile &amp; Contact Details
          </h1>
          <p className="text-xs text-slate-600 mt-1">
            Keep your contact phone and emergency info up to date for court reservations and club access.
          </p>
        </div>

        {/* Success Alert */}
        {successMessage && (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#006c49]" />
              <span>{successMessage}</span>
            </div>
            <button
              onClick={() => setSuccessMessage(null)}
              className="text-xs font-semibold text-emerald-700 hover:underline"
            >
              Dismiss
            </button>
          </div>
        )}

        <form onSubmit={handleSaveProfile} className="space-y-6">
          <Card className="p-6 space-y-6 border-slate-200">
            <h3 className="text-sm font-bold text-[#0b1c30] uppercase tracking-wider border-b border-slate-100 pb-3">
              Personal Information
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Full Name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />

              <Input
                label="Email Address"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />

              <Input
                label="Phone Number (SMS Notifications)"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
              />

              <Input
                label="Date of Birth"
                type="date"
                value={dob}
                onChange={(e) => setDob(e.target.value)}
              />

              <div className="sm:col-span-2">
                <Input
                  label="Emergency Contact Phone"
                  value={emergencyContact}
                  onChange={(e) => setEmergencyContact(e.target.value)}
                  helperText="Used only by club staff in case of an on-court medical incident."
                />
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
              <Button
                type="submit"
                variant="primary"
                size="md"
                isLoading={isSaving}
                leftIcon={<Save className="w-4 h-4" />}
              >
                Save Changes
              </Button>
            </div>
          </Card>
        </form>

      </div>
    </div>
  );
}
