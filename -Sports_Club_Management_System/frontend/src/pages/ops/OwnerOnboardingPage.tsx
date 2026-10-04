import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Trophy, ArrowRight, Building2, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

export default function OwnerOnboardingPage() {
  const navigate = useNavigate();

  return (
    <div className="max-w-4xl mx-auto space-y-6 py-4">
      <div className="border-b border-slate-200 pb-4">
        <div className="flex items-center gap-2 text-xs font-semibold text-[#006c49] uppercase mb-1">
          <Trophy className="w-4 h-4" /> Sports Club Setup Wizard
        </div>
        <h1 className="text-2xl font-extrabold text-[#0b1c30]">Club Onboarding &amp; Verification</h1>
        <p className="text-xs text-slate-500 mt-1">
          Register new venue courts, configure pricing plans, upload GST / PAN tax credentials, and submit for platform verification.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-6 space-y-4 border-emerald-200 bg-white">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#006c49] flex items-center justify-center">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-[#0b1c30]">Register New Club Venue</h3>
            <p className="text-xs text-slate-500 mt-1">
              Add a new sports facility with courts, operating hours, and GST registration details.
            </p>
          </div>
          <Button
            variant="primary"
            size="md"
            className="w-full"
            rightIcon={<ArrowRight className="w-4 h-4" />}
            onClick={() => navigate('/register/club')}
          >
            Launch Club Registration Form
          </Button>
        </Card>

        <Card className="p-6 space-y-4 border-slate-200 bg-white">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-[#0b1c30]">Manage Club Profile &amp; Pricing</h3>
            <p className="text-xs text-slate-500 mt-1">
              Configure peak hour surge multipliers and dynamic slot rates for existing courts.
            </p>
          </div>
          <Button
            variant="outline"
            size="md"
            className="w-full"
            onClick={() => navigate('/owner/dynamic-pricing')}
          >
            Go to Dynamic Pricing Rules
          </Button>
        </Card>
      </div>
    </div>
  );
}
