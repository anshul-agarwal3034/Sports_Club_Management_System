import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Trophy,
  ArrowRight,
  ArrowLeft,
  Building2,
  MapPin,
  Mail,
  Phone,
  CheckCircle2,
  UploadCloud,
  Plus,
  Trash2,
  Image,
  AlertCircle,
  FileText,
  Clock,
  Check,
  Save,
  ShieldCheck,
  Eye,
  Info
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { api } from '@/services/api';

interface CourtDraft {
  name: string;
  length: number;
  width: number;
  dimensionUnit: string;
  surfaceType: string;
  indoorOutdoor: string;
  maxCapacity: number;
  basePricePerHour: number;
  status: string;
}

interface SportDraft {
  id: string;
  sportName: string;
  customSportName?: string;
  description: string;
  indoorOutdoor: string;
  amenities: string[];
  images: string[];
  courts: CourtDraft[];
}

export default function ClubOwnerRegistrationPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [activeStep, setActiveStep] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDraftSaving, setIsDraftSaving] = useState(false);
  const [draftSavedMsg, setDraftSavedMsg] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Step 1: Owner & Club Profile
  const [ownerData, setOwnerData] = useState({
    ownerName: '',
    email: '',
    password: '',
    phone: '',
    clubName: 'Skyline Sports Arena',
    publicEmail: 'contact@skylineclub.com',
    publicPhone: '9876543210',
    address: '100 Ring Road, Near Apollo Square',
    city: 'Indore',
    state: 'Madhya Pradesh',
    postalCode: '452001',
    latitude: 22.7196,
    longitude: 75.8577,
    description: 'Premier sports destination featuring championship padel and badminton courts with certified coaching staff.',
    totalArea: 25000,
    totalAreaUnit: 'sq ft',
    openTime: '06:00',
    closeTime: '23:00',
    weeklyClosures: 'None',
    timezone: 'Asia/Kolkata',
  });

  // Verify authentication on mount (pre-fill owner info if logged in, allow registration if guest)
  useEffect(() => {
    const token = localStorage.getItem('sportshub_token');
    const userStr = localStorage.getItem('sportshub_user');
    
    if (token && userStr) {
      setIsLoggedIn(true);
      try {
        const parsedUser = JSON.parse(userStr);
        setOwnerData((prev) => ({
          ...prev,
          ownerName: parsedUser.full_name || parsedUser.name || prev.ownerName || 'Club Operator',
          email: parsedUser.email || prev.email,
          phone: parsedUser.phone || prev.phone || '9876543210',
        }));

        const clubId = parsedUser.club_id || parsedUser.clubId;
        if (clubId) {
          api.getClubSetupStatus(clubId).then((status) => {
            if (status?.draft_data) {
              const d = status.draft_data;
              if (d.ownerData) setOwnerData((o) => ({ ...o, ...d.ownerData }));
              if (d.sports && Array.isArray(d.sports) && d.sports.length > 0) setSports(d.sports);
              if (d.capabilities) setCapabilities((c) => ({ ...c, ...d.capabilities }));
              if (d.businessData) setBusinessData((b) => ({ ...b, ...d.businessData }));
              if (status.setup_step && status.setup_step < 5) setActiveStep(status.setup_step);
            }
          }).catch(() => {});
        } else {
          const localDraft = localStorage.getItem('sportshub_setup_draft');
          if (localDraft) {
            try {
              const ld = JSON.parse(localDraft);
              if (ld.data?.ownerData) setOwnerData((o) => ({ ...o, ...ld.data.ownerData }));
              if (ld.data?.sports && Array.isArray(ld.data.sports) && ld.data.sports.length > 0) setSports(ld.data.sports);
              if (ld.data?.capabilities) setCapabilities((c) => ({ ...c, ...ld.data.capabilities }));
              if (ld.data?.businessData) setBusinessData((b) => ({ ...b, ...ld.data.businessData }));
              if (ld.step && ld.step < 5) setActiveStep(ld.step);
            } catch {
              // ignore
            }
          }
        }
      } catch {
        // ignore
      }
    } else {
      setIsLoggedIn(false);
      const localDraft = localStorage.getItem('sportshub_setup_draft');
      if (localDraft) {
        try {
          const ld = JSON.parse(localDraft);
          if (ld.data?.ownerData) setOwnerData((o) => ({ ...o, ...ld.data.ownerData }));
          if (ld.data?.sports && Array.isArray(ld.data.sports) && ld.data.sports.length > 0) setSports(ld.data.sports);
          if (ld.data?.capabilities) setCapabilities((c) => ({ ...c, ...ld.data.capabilities }));
          if (ld.data?.businessData) setBusinessData((b) => ({ ...b, ...ld.data.businessData }));
          if (ld.step && ld.step < 5) setActiveStep(ld.step);
        } catch {
          // ignore
        }
      }
    }
  }, []);

  // Step 2: Sports, Courts & Facility Photos (min 3 photos per sport)
  const [sports, setSports] = useState<SportDraft[]>([
    {
      id: 'sport-1',
      sportName: 'Padel',
      description: 'Panoramic glass court with Spanish synthetic turf',
      indoorOutdoor: 'INDOOR',
      amenities: ['Glass Walls', 'LED Lighting', 'Racket Rental'],
      images: [
        'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1542144582-1ba00456b5e3?auto=format&fit=crop&w=800&q=80',
      ],
      courts: [
        {
          name: 'Padel Center Court 1',
          length: 20,
          width: 10,
          dimensionUnit: 'meters',
          surfaceType: 'Mondo Supercourt Pro Turf',
          indoorOutdoor: 'INDOOR',
          maxCapacity: 4,
          basePricePerHour: 800,
          status: 'ACTIVE',
        },
      ],
    },
    {
      id: 'sport-2',
      sportName: 'Badminton',
      description: 'BWF certified wooden synthetic courts',
      indoorOutdoor: 'INDOOR',
      amenities: ['BWF Approved Mat', 'Anti-Glare Lights'],
      images: [
        'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1519766304817-4f37bda74a29?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1563299796-17596ed6b017?auto=format&fit=crop&w=800&q=80',
      ],
      courts: [
        {
          name: 'Badminton Court A',
          length: 13.4,
          width: 6.1,
          dimensionUnit: 'meters',
          surfaceType: 'Yonex Synthetic Mat on Teak Wood',
          indoorOutdoor: 'INDOOR',
          maxCapacity: 4,
          basePricePerHour: 450,
          status: 'ACTIVE',
        },
      ],
    },
  ]);

  // Step 3: Facilities & Services (Yes/No switches)
  const [capabilities, setCapabilities] = useState({
    hasCanteen: true,
    hasKitchen: true,
    hasShop: true,
    hasRentals: true,
    hasCoaching: true,
    hasClickAndCollect: true,
    hasDelivery: false,
    // Facility amenities
    hasParking: true,
    hasChangingRooms: true,
    hasWashrooms: true,
    hasDrinkingWater: true,
    hasAccessibility: true,
  });

  // Step 4: Business Details & Verification
  const [businessData, setBusinessData] = useState({
    legalBusinessName: 'Skyline Sports & Recreation LLP',
    businessType: 'Partnership / LLP',
    businessRegNumber: 'LLPIN-AAH-4921',
    gstRegistered: true,
    gstNumber: '23AAHCS1234D1Z5',
    panNumber: 'AAHCS1234D',
    businessDocUrl: 'https://example.com/docs/llp_certificate.pdf',
    businessDocName: 'Certificate_of_Incorporation_LLP.pdf',
  });

  // New Image URL input tracker per sport
  const [newImgUrl, setNewImgUrl] = useState<Record<string, string>>({});

  // 1. Add / Remove Sports
  const handleAddSport = () => {
    const newSportId = `sport-${Date.now()}`;
    setSports((prev) => [
      ...prev,
      {
        id: newSportId,
        sportName: 'Tennis',
        description: 'Championship tennis court',
        indoorOutdoor: 'OUTDOOR',
        amenities: [],
        images: [],
        courts: [
          {
            name: 'Court 1',
            length: 23.77,
            width: 10.97,
            dimensionUnit: 'meters',
            surfaceType: 'Acrylic Hard Court',
            indoorOutdoor: 'OUTDOOR',
            maxCapacity: 4,
            basePricePerHour: 600,
            status: 'ACTIVE',
          },
        ],
      },
    ]);
  };

  const handleRemoveSport = (sportId: string) => {
    if (sports.length <= 1) {
      alert('You must configure at least one sport section.');
      return;
    }
    setSports((prev) => prev.filter((s) => s.id !== sportId));
  };

  // Add Court to Sport
  const handleAddCourt = (sportId: string) => {
    setSports((prev) =>
      prev.map((s) => {
        if (s.id !== sportId) return s;
        const courtNum = s.courts.length + 1;
        return {
          ...s,
          courts: [
            ...s.courts,
            {
              name: `${s.sportName} Court ${courtNum}`,
              length: s.sportName === 'Padel' ? 20 : 23.77,
              width: s.sportName === 'Padel' ? 10 : 10.97,
              dimensionUnit: 'meters',
              surfaceType: 'Synthetic Surface',
              indoorOutdoor: s.indoorOutdoor,
              maxCapacity: 4,
              basePricePerHour: s.courts[0]?.basePricePerHour || 500,
              status: 'ACTIVE',
            },
          ],
        };
      })
    );
  };

  const handleRemoveCourt = (sportId: string, courtIndex: number) => {
    setSports((prev) =>
      prev.map((s) => {
        if (s.id !== sportId) return s;
        if (s.courts.length <= 1) {
          alert('Each sport section must have at least one court.');
          return s;
        }
        return {
          ...s,
          courts: s.courts.filter((_, idx) => idx !== courtIndex),
        };
      })
    );
  };

  // Add Photo to Sport (Simulated upload with validation)
  const handleAddPhoto = (sportId: string) => {
    const url = newImgUrl[sportId]?.trim();
    if (!url) {
      // Add standard high-res facility photo sample if none entered
      const sample = `https://images.unsplash.com/photo-${1550000000000 + Math.floor(Math.random() * 100000000)}?auto=format&fit=crop&w=800&q=80`;
      setSports((prev) =>
        prev.map((s) => (s.id === sportId ? { ...s, images: [...s.images, sample] } : s))
      );
      return;
    }

    setSports((prev) =>
      prev.map((s) => (s.id === sportId ? { ...s, images: [...s.images, url] } : s))
    );
    setNewImgUrl((prev) => ({ ...prev, [sportId]: '' }));
  };

  const handleRemovePhoto = (sportId: string, imgIdx: number) => {
    setSports((prev) =>
      prev.map((s) =>
        s.id === sportId
          ? { ...s, images: s.images.filter((_, idx) => idx !== imgIdx) }
          : s
      )
    );
  };

  // Draft Save Handler
  const handleSaveDraft = async () => {
    setIsDraftSaving(true);
    setDraftSavedMsg(null);
    try {
      // Build draft payload
      const draftPayload = {
        ownerData,
        sports,
        capabilities,
        businessData,
      };

      // Try authenticated club draft if user is logged in
      const storedUser = localStorage.getItem('sportshub_user');
      const parsed = storedUser ? JSON.parse(storedUser) : null;
      if (parsed?.club_id) {
        await api.saveClubSetupDraft(parsed.club_id, activeStep, draftPayload);
      } else {
        localStorage.setItem('sportshub_setup_draft', JSON.stringify({ step: activeStep, data: draftPayload }));
      }

      setDraftSavedMsg('Draft saved successfully! You can resume anytime.');
      setTimeout(() => setDraftSavedMsg(null), 4000);
    } catch {
      localStorage.setItem('sportshub_setup_draft', JSON.stringify({ step: activeStep, data: { ownerData, sports, capabilities, businessData } }));
      setDraftSavedMsg('Draft saved locally.');
      setTimeout(() => setDraftSavedMsg(null), 4000);
    } finally {
      setIsDraftSaving(false);
    }
  };

  // Step Validation with explicit field targeting
  const validateStep = (stepNum: number) => {
    setErrorMessage(null);

    if (stepNum === 1) {
      if (!ownerData.clubName.trim()) {
        setErrorMessage('Club public name is required.');
        setTimeout(() => document.getElementById('input-club-name')?.focus(), 50);
        return false;
      }
      if (!ownerData.ownerName.trim()) {
        setErrorMessage('Owner / operator name is required.');
        setTimeout(() => document.getElementById('input-owner-name')?.focus(), 50);
        return false;
      }
      if (!ownerData.email.trim() || !ownerData.email.includes('@')) {
        setErrorMessage('Valid owner email address is required.');
        setTimeout(() => document.getElementById('input-email')?.focus(), 50);
        return false;
      }
      if (!isLoggedIn && (!ownerData.password || ownerData.password.length < 6)) {
        setErrorMessage('Account password (minimum 6 characters) is required to create your owner account.');
        setTimeout(() => document.getElementById('input-password')?.focus(), 50);
        return false;
      }
      if (!ownerData.phone.trim() || ownerData.phone.length < 10) {
        setErrorMessage('10-digit mobile phone number is required.');
        setTimeout(() => document.getElementById('input-phone')?.focus(), 50);
        return false;
      }
      if (!ownerData.city.trim()) {
        setErrorMessage('Club city is required.');
        setTimeout(() => document.getElementById('input-city')?.focus(), 50);
        return false;
      }
      if (!ownerData.address.trim()) {
        setErrorMessage('Full street address is required.');
        setTimeout(() => document.getElementById('input-address')?.focus(), 50);
        return false;
      }
      return true;
    }

    if (stepNum === 2) {
      if (sports.length === 0) {
        setErrorMessage('At least one sport section must be added.');
        return false;
      }

      for (const sport of sports) {
        if (!sport.sportName.trim()) {
          setErrorMessage('Please select or specify a sport name.');
          return false;
        }

        // STRICT REQUIREMENT: At least 3 photos per sport section!
        if (sport.images.length < 3) {
          setErrorMessage(
            `Minimum 3 photos required for "${sport.sportName}". Currently uploaded: ${sport.images.length}. Please upload at least 3 photos before proceeding.`
          );
          return false;
        }

        if (sport.courts.length === 0) {
          setErrorMessage(`At least one court must be configured for "${sport.sportName}".`);
          return false;
        }

        for (const court of sport.courts) {
          if (!court.name.trim()) {
            setErrorMessage(`Court name is required for all ${sport.sportName} courts.`);
            return false;
          }
          if (court.basePricePerHour <= 0) {
            setErrorMessage(`Base hourly price must be greater than zero for "${court.name}".`);
            return false;
          }
        }
      }
      return true;
    }

    if (stepNum === 3) {
      // Capabilities are yes/no switches, valid by default
      return true;
    }

    if (stepNum === 4) {
      if (!businessData.legalBusinessName.trim()) {
        setErrorMessage('Legal business entity name is required.');
        setTimeout(() => document.getElementById('input-legal-name')?.focus(), 50);
        return false;
      }
      if (!businessData.businessType) {
        setErrorMessage('Business/Entity type is required.');
        setTimeout(() => document.getElementById('select-business-type')?.focus(), 50);
        return false;
      }
      if (businessData.gstRegistered && (!businessData.gstNumber || businessData.gstNumber.trim().length < 15)) {
        setErrorMessage('Valid 15-character GSTIN is required when registered for GST.');
        setTimeout(() => document.getElementById('input-gstin')?.focus(), 50);
        return false;
      }
      if (!businessData.panNumber || businessData.panNumber.trim().length !== 10) {
        setErrorMessage('Valid 10-character Business PAN is required.');
        setTimeout(() => document.getElementById('input-pan')?.focus(), 50);
        return false;
      }
      return true;
    }

    return true;
  };

  const handleNext = () => {
    if (validateStep(activeStep)) {
      setActiveStep((prev) => Math.min(prev + 1, 5));
    }
  };

  const handleBack = () => {
    setErrorMessage(null);
    setActiveStep((prev) => Math.max(prev - 1, 1));
  };

  // Final Submission Handler (Idempotent, no password, navigated error resolution)
  const handleSubmitApplication = async () => {
    if (isSubmitting) return;

    if (!validateStep(1)) {
      setActiveStep(1);
      return;
    }
    if (!validateStep(2)) {
      setActiveStep(2);
      return;
    }
    if (!validateStep(4)) {
      setActiveStep(4);
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const submissionData = {
        clubName: ownerData.clubName,
        ownerName: ownerData.ownerName,
        email: ownerData.email,
        phone: ownerData.phone,
        address: ownerData.address,
        city: ownerData.city,
        state: ownerData.state,
        postalCode: ownerData.postalCode,
        latitude: ownerData.latitude,
        longitude: ownerData.longitude,
        description: ownerData.description,
        totalArea: Number(ownerData.totalArea) || 25000,
        totalAreaUnit: ownerData.totalAreaUnit,
        openTime: ownerData.openTime,
        closeTime: ownerData.closeTime,
        weeklyClosures: ownerData.weeklyClosures,
        timezone: ownerData.timezone,
        sports,
        capabilities,
        legalBusinessName: businessData.legalBusinessName,
        businessType: businessData.businessType,
        businessRegNumber: businessData.businessRegNumber || null,
        gstRegistered: Boolean(businessData.gstRegistered),
        gstNumber: businessData.gstRegistered ? businessData.gstNumber : null,
        panNumber: businessData.panNumber,
        businessDocUrl: businessData.businessDocUrl,
        businessDocName: businessData.businessDocName,
      };

      // Check if user has an existing clubId to submit directly
      const storedUser = localStorage.getItem('sportshub_user');
      const parsed = storedUser ? JSON.parse(storedUser) : null;
      const clubId = parsed?.club_id || parsed?.clubId;

      if (clubId) {
        await api.submitClubSetupApplication(clubId, submissionData);
      } else {
        // First-time registration endpoint (Authenticated or Unauthenticated)
        const token = localStorage.getItem('sportshub_token');
        const res = await fetch('/api/v1/clubs/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            name: ownerData.clubName,
            address: ownerData.address,
            city: ownerData.city,
            state: ownerData.state,
            postalCode: ownerData.postalCode,
            phone: ownerData.phone,
            email: ownerData.email,
            description: ownerData.description,
            totalArea: Number(ownerData.totalArea) || 25000,
            totalAreaUnit: ownerData.totalAreaUnit,
            openTime: ownerData.openTime,
            closeTime: ownerData.closeTime,
            weeklyClosures: ownerData.weeklyClosures,
            timezone: ownerData.timezone,
            gstNumber: businessData.gstRegistered ? businessData.gstNumber : null,
            panNumber: businessData.panNumber,
            ownerInfo: token
              ? undefined
              : {
                  fullName: ownerData.ownerName,
                  email: ownerData.email,
                  password: ownerData.password,
                  phone: ownerData.phone,
                },
            courts: sports.flatMap((s) =>
              s.courts.map((c) => ({
                name: c.name,
                sportType: s.sportName,
                basePricePerHour: Number(c.basePricePerHour) || 600,
                maxCapacity: Number(c.maxCapacity) || 4,
              }))
            ),
          }),
        });

        const data = await res.json();
        if (!res.ok) {
          const errMsg = data.error || data.message || (data.errors && data.errors[0]?.message) || 'Registration failed';
          throw new Error(errMsg);
        }

        const newClubId = data.data?.club?.id || data.club?.id;
        const newOwner = data.data?.owner || data.owner;
        const newToken = data.data?.token || data.token;

        if (newToken) {
          localStorage.setItem('sportshub_token', newToken);
        }

        if (newOwner) {
          const userObj = {
            id: newOwner.id,
            email: newOwner.email,
            full_name: newOwner.full_name || ownerData.ownerName,
            role: newOwner.role || 'CLUB_OWNER',
            club_id: newClubId,
            clubId: newClubId,
          };
          localStorage.setItem('sportshub_user', JSON.stringify(userObj));
          setIsLoggedIn(true);
        } else if (parsed) {
          parsed.club_id = newClubId;
          parsed.clubId = newClubId;
          parsed.role = 'CLUB_OWNER';
          localStorage.setItem('sportshub_user', JSON.stringify(parsed));
        }

        if (newClubId) {
          await api.submitClubSetupApplication(newClubId, submissionData);
        }
      }

      setIsSuccess(true);
      localStorage.removeItem('sportshub_setup_draft');
    } catch (err: any) {
      const msg = err.response?.data?.error || err.response?.data?.message || err.message || 'Club application submission failed';
      setErrorMessage(msg);

      // Auto-navigate to the step containing the invalid field
      const lower = msg.toLowerCase();
      if (lower.includes('step 1') || lower.includes('club name') || lower.includes('street address') || lower.includes('city')) {
        setActiveStep(1);
        setTimeout(() => document.getElementById('input-club-name')?.focus(), 100);
      } else if (lower.includes('step 2') || lower.includes('photo') || lower.includes('sport') || lower.includes('court')) {
        setActiveStep(2);
      } else if (lower.includes('step 4') || lower.includes('gst') || lower.includes('pan') || lower.includes('legal')) {
        setActiveStep(4);
        setTimeout(() => document.getElementById('input-legal-name')?.focus(), 100);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4 sm:px-6">
        <Card className="p-8 text-center space-y-6 border-slate-200 shadow-sm">
          <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto border border-blue-200">
            <Clock className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 uppercase font-semibold">
              Status: PENDING_REVIEW
            </Badge>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#0b1c30]">
              Application Submitted for Inspection
            </h1>
            <p className="text-slate-600 text-sm max-w-md mx-auto">
              Your club application has been successfully submitted! Our inspection team is reviewing your business documentation and court specifications.
            </p>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-left text-xs space-y-2">
            <div className="flex justify-between font-semibold text-slate-800">
              <span>Club:</span>
              <span>{ownerData.clubName}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Entity:</span>
              <span>{businessData.legalBusinessName} ({businessData.businessType})</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Sports &amp; Courts:</span>
              <span>{sports.length} Sports ({sports.reduce((acc, s) => acc + s.courts.length, 0)} Courts)</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Platform Commission:</span>
              <span className="font-semibold text-[#006c49]">10.0% (Read-Only)</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Verification Status:</span>
              <span className="text-blue-600 font-semibold">Under Inspection (Not yet verified)</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <Button
              variant="primary"
              className="bg-[#006c49] hover:bg-[#005237]"
              onClick={() => navigate('/owner')}
            >
              Go to Owner Dashboard
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate('/owner/settings')}
            >
              View Settings &amp; Policies
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 space-y-6">
      {/* Header Back Button & Title */}
      <div className="flex items-center justify-between">
        <Button variant="outline" size="sm" onClick={() => navigate(-1)} className="gap-1.5 text-slate-600 hover:text-[#006c49] cursor-pointer">
          <ArrowLeft className="w-4 h-4" /> Back
        </Button>
      </div>

      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-[#006c49] text-xs font-semibold uppercase tracking-wider border border-emerald-200">
          <Trophy className="w-3.5 h-3.5" /> Club Registration &amp; Onboarding
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold text-[#0b1c30] tracking-tight">
          List Your Sports Facility
        </h1>
        <p className="text-slate-600 text-sm max-w-xl mx-auto">
          Complete the 5-step comprehensive onboarding to register your club, configure courts with photos, declare facilities, and submit business verification.
        </p>
      </div>

      {/* Progress Stepper */}
      <div className="grid grid-cols-5 gap-2 text-center text-xs font-semibold">
        {[
          { step: 1, title: 'Club Details' },
          { step: 2, title: 'Sports & Courts' },
          { step: 3, title: 'Facilities' },
          { step: 4, title: 'Verification' },
          { step: 5, title: 'Review & Submit' },
        ].map((s) => (
          <button
            key={s.step}
            type="button"
            onClick={() => setActiveStep(s.step)}
            className={`p-2.5 rounded-xl border transition-all text-left ${
              activeStep === s.step
                ? 'bg-[#006c49] text-white border-[#006c49] shadow-xs'
                : activeStep > s.step
                ? 'bg-emerald-50 text-[#006c49] border-emerald-200'
                : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <div className="text-[10px] uppercase font-bold opacity-75">Step {s.step}</div>
            <div className="truncate font-bold mt-0.5">{s.title}</div>
          </button>
        ))}
      </div>

      {/* Draft Save Feedback */}
      {draftSavedMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600" />
            <span>{draftSavedMsg}</span>
          </div>
        </div>
      )}

      {/* Error Feedback */}
      {errorMessage && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <Card className="p-6 sm:p-8 border-slate-200 shadow-sm space-y-6">
        {/* STEP 1: Owner and Club Details */}
        {activeStep === 1 && (
          <div className="space-y-6">
            <div className="border-b border-slate-100 pb-3">
              <h2 className="text-xl font-bold text-[#0b1c30]">Step 1: Owner &amp; Club Details</h2>
              <p className="text-slate-500 text-xs mt-1">
                Enter your personal operator credentials and public club identity. Progress is saved between steps.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Club Public Name *</label>
                <input
                  id="input-club-name"
                  type="text"
                  value={ownerData.clubName}
                  onChange={(e) => setOwnerData({ ...ownerData, clubName: e.target.value })}
                  placeholder="e.g. Skyline Sports Arena"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:border-[#006c49] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Owner / Operator Name *</label>
                <input
                  id="input-owner-name"
                  type="text"
                  value={ownerData.ownerName}
                  onChange={(e) => setOwnerData({ ...ownerData, ownerName: e.target.value })}
                  placeholder="Full Name"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:border-[#006c49] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Owner Work Email *</label>
                <input
                  id="input-email"
                  type="email"
                  value={ownerData.email}
                  onChange={(e) => setOwnerData({ ...ownerData, email: e.target.value })}
                  placeholder="owner@domain.com"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:border-[#006c49] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Mobile Phone Number *</label>
                <input
                  id="input-phone"
                  type="tel"
                  value={ownerData.phone}
                  onChange={(e) => setOwnerData({ ...ownerData, phone: e.target.value })}
                  placeholder="10-digit mobile"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:border-[#006c49] outline-none"
                />
              </div>

              {!isLoggedIn ? (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Account Password (for owner login) *
                  </label>
                  <input
                    id="input-password"
                    type="password"
                    value={ownerData.password}
                    onChange={(e) => setOwnerData({ ...ownerData, password: e.target.value })}
                    placeholder="At least 6 characters"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:border-[#006c49] outline-none"
                  />
                </div>
              ) : (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-[#006c49] font-bold text-sm shrink-0">
                    ✓
                  </div>
                  <div>
                    <p className="text-xs font-bold text-emerald-900">Authenticated Owner Account</p>
                    <p className="text-[11px] text-emerald-700">
                      Club ownership will be linked to your authenticated session ({ownerData.email || 'Current Account'}).
                    </p>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Club City *</label>
                <input
                  id="input-city"
                  type="text"
                  value={ownerData.city}
                  onChange={(e) => setOwnerData({ ...ownerData, city: e.target.value })}
                  placeholder="City"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:border-[#006c49] outline-none"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">Full Street Address *</label>
                <input
                  id="input-address"
                  type="text"
                  value={ownerData.address}
                  onChange={(e) => setOwnerData({ ...ownerData, address: e.target.value })}
                  placeholder="Plot / Street / Landmark"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:border-[#006c49] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">State</label>
                <input
                  type="text"
                  value={ownerData.state}
                  onChange={(e) => setOwnerData({ ...ownerData, state: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:border-[#006c49] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Postal Code</label>
                <input
                  type="text"
                  value={ownerData.postalCode}
                  onChange={(e) => setOwnerData({ ...ownerData, postalCode: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:border-[#006c49] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Total Facility Area</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={ownerData.totalArea}
                    onChange={(e) => setOwnerData({ ...ownerData, totalArea: parseFloat(e.target.value) || 0 })}
                    className="w-2/3 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:border-[#006c49] outline-none"
                  />
                  <select
                    value={ownerData.totalAreaUnit}
                    onChange={(e) => setOwnerData({ ...ownerData, totalAreaUnit: e.target.value })}
                    className="w-1/3 px-2 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
                  >
                    <option value="sq ft">sq ft</option>
                    <option value="sq meters">sq meters</option>
                    <option value="acres">acres</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Operating Hours</label>
                <div className="flex items-center gap-2">
                  <input
                    type="time"
                    value={ownerData.openTime}
                    onChange={(e) => setOwnerData({ ...ownerData, openTime: e.target.value })}
                    className="w-1/2 px-2.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  />
                  <span className="text-slate-400 text-xs">to</span>
                  <input
                    type="time"
                    value={ownerData.closeTime}
                    onChange={(e) => setOwnerData({ ...ownerData, closeTime: e.target.value })}
                    className="w-1/2 px-2.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Weekly Closures</label>
                <select
                  value={ownerData.weeklyClosures}
                  onChange={(e) => setOwnerData({ ...ownerData, weeklyClosures: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
                >
                  <option value="None">None (Open 7 Days)</option>
                  <option value="Mondays">Mondays</option>
                  <option value="Tuesdays">Tuesdays</option>
                  <option value="Wednesdays">Wednesdays</option>
                  <option value="Sundays">Sundays</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Timezone</label>
                <input
                  type="text"
                  value={ownerData.timezone}
                  disabled
                  className="w-full px-3.5 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-xs text-slate-500 cursor-not-allowed"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">Club Description</label>
                <textarea
                  rows={2}
                  value={ownerData.description}
                  onChange={(e) => setOwnerData({ ...ownerData, description: e.target.value })}
                  placeholder="Describe your club, courts, atmosphere and certified coaching..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:border-[#006c49] outline-none"
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: Sports, Courts, and Photos */}
        {activeStep === 2 && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-xl font-bold text-[#0b1c30]">Step 2: Sports, Courts &amp; Facility Photos</h2>
                <p className="text-slate-500 text-xs mt-0.5">
                  Configure your sport sections. <strong>Crucial:</strong> Each sport requires at least 3 uploaded photos before final submission.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleAddSport}
                className="gap-1.5 border-[#006c49] text-[#006c49] self-start sm:self-auto cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Add Another Sport
              </Button>
            </div>

            <div className="space-y-6">
              {sports.map((sport, sportIdx) => (
                <div key={sport.id} className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-5">
                  {/* Sport Header */}
                  <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                    <div className="flex items-center gap-2.5">
                      <span className="w-6 h-6 rounded-full bg-[#006c49] text-white flex items-center justify-center text-xs font-bold">
                        {sportIdx + 1}
                      </span>
                      <h3 className="font-bold text-base text-[#0b1c30]">{sport.sportName || 'New Sport Section'}</h3>
                      <Badge variant="outline" className="text-xs">
                        {sport.courts.length} {sport.courts.length === 1 ? 'Court' : 'Courts'}
                      </Badge>
                    </div>

                    {sports.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveSport(sport.id)}
                        className="text-rose-600 hover:text-rose-800 text-xs font-medium flex items-center gap-1 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Remove Sport
                      </button>
                    )}
                  </div>

                  {/* Sport Settings */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Sport Type</label>
                      <select
                        value={sport.sportName}
                        onChange={(e) =>
                          setSports((prev) =>
                            prev.map((s) => (s.id === sport.id ? { ...s, sportName: e.target.value } : s))
                          )
                        }
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold"
                      >
                        <option value="Padel">🎾 Padel</option>
                        <option value="Badminton">🏸 Badminton</option>
                        <option value="Tennis">🎾 Tennis</option>
                        <option value="Pickleball">🏓 Pickleball</option>
                        <option value="Squash">🎯 Squash</option>
                        <option value="Football Turf">⚽ Football Turf</option>
                        <option value="Custom">✨ Other / Custom Sport</option>
                      </select>
                    </div>

                    {sport.sportName === 'Custom' && (
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">Custom Sport Name</label>
                        <input
                          type="text"
                          value={sport.customSportName || ''}
                          onChange={(e) =>
                            setSports((prev) =>
                              prev.map((s) => (s.id === sport.id ? { ...s, customSportName: e.target.value } : s))
                            )
                          }
                          placeholder="e.g. Table Tennis"
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs"
                        />
                      </div>
                    )}

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Indoor / Outdoor</label>
                      <select
                        value={sport.indoorOutdoor}
                        onChange={(e) =>
                          setSports((prev) =>
                            prev.map((s) => (s.id === sport.id ? { ...s, indoorOutdoor: e.target.value } : s))
                          )
                        }
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold"
                      >
                        <option value="INDOOR">Indoor Only</option>
                        <option value="OUTDOOR">Outdoor Only</option>
                        <option value="MIXED">Mixed Facilities</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Short Description</label>
                      <input
                        type="text"
                        value={sport.description}
                        onChange={(e) =>
                          setSports((prev) =>
                            prev.map((s) => (s.id === sport.id ? { ...s, description: e.target.value } : s))
                          )
                        }
                        placeholder="e.g. Certified Mondo turf with LED"
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs"
                      />
                    </div>
                  </div>

                  {/* Sport Photos Section (Enforces >= 3 photos) */}
                  <div className="space-y-2 bg-white p-4 rounded-xl border border-slate-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Image className="w-4 h-4 text-[#006c49]" />
                        <span className="text-xs font-bold text-[#0b1c30]">
                          Facility &amp; Court Photos ({sport.images.length}/3 minimum required)
                        </span>
                      </div>
                      {sport.images.length >= 3 ? (
                        <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                          <Check className="w-3 h-3" /> Requirement Met
                        </span>
                      ) : (
                        <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" /> Need {3 - sport.images.length} more
                        </span>
                      )}
                    </div>

                    {/* Image Previews */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                      {sport.images.map((imgUrl, imgIdx) => (
                        <div key={imgIdx} className="relative group rounded-xl overflow-hidden border border-slate-200 aspect-video bg-slate-100">
                          <img src={imgUrl} alt={`${sport.sportName} photo ${imgIdx + 1}`} className="w-full h-full object-cover" />
                          {imgIdx === 0 && (
                            <span className="absolute top-1 left-1 bg-[#006c49] text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
                              Cover
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={() => handleRemovePhoto(sport.id, imgIdx)}
                            className="absolute top-1 right-1 p-1 rounded-full bg-rose-600 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Remove Photo"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      ))}

                      {/* Add Photo Button / Input */}
                      <div className="flex flex-col justify-center items-center p-3 border-2 border-dashed border-slate-200 rounded-xl hover:border-[#006c49] transition-colors text-center aspect-video bg-slate-50">
                        <UploadCloud className="w-5 h-5 text-slate-400 mb-1" />
                        <button
                          type="button"
                          onClick={() => handleAddPhoto(sport.id)}
                          className="text-[11px] font-bold text-[#006c49] hover:underline cursor-pointer"
                        >
                          + Upload / Add Photo
                        </button>
                        <span className="text-[9px] text-slate-400 mt-0.5">JPG, PNG (max 5MB)</span>
                      </div>
                    </div>
                  </div>

                  {/* Courts List for this Sport */}
                  <div className="space-y-3 pt-1">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600">
                        Courts / Playing Areas for {sport.sportName}
                      </h4>
                      <button
                        type="button"
                        onClick={() => handleAddCourt(sport.id)}
                        className="text-xs font-bold text-[#006c49] hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3 h-3" /> Add Court
                      </button>
                    </div>

                    <div className="space-y-2.5">
                      {sport.courts.map((court, cIdx) => (
                        <div key={cIdx} className="p-3 bg-white border border-slate-200 rounded-xl grid grid-cols-1 sm:grid-cols-6 gap-2 items-center text-xs">
                          <div className="sm:col-span-2">
                            <label className="text-[10px] text-slate-400 font-bold block mb-0.5">Court Name / No.</label>
                            <input
                              type="text"
                              value={court.name}
                              onChange={(e) => {
                                const val = e.target.value;
                                setSports((prev) =>
                                  prev.map((s) => {
                                    if (s.id !== sport.id) return s;
                                    const newCourts = [...s.courts];
                                    newCourts[cIdx] = { ...newCourts[cIdx], name: val };
                                    return { ...s, courts: newCourts };
                                  })
                                );
                              }}
                              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-semibold"
                            />
                          </div>

                          <div>
                            <label className="text-[10px] text-slate-400 font-bold block mb-0.5">Base Rate (₹/hr)</label>
                            <input
                              type="number"
                              value={court.basePricePerHour}
                              onChange={(e) => {
                                const val = parseFloat(e.target.value) || 0;
                                setSports((prev) =>
                                  prev.map((s) => {
                                    if (s.id !== sport.id) return s;
                                    const newCourts = [...s.courts];
                                    newCourts[cIdx] = { ...newCourts[cIdx], basePricePerHour: val };
                                    return { ...s, courts: newCourts };
                                  })
                                );
                              }}
                              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-bold text-[#006c49]"
                            />
                          </div>

                          <div>
                            <label className="text-[10px] text-slate-400 font-bold block mb-0.5">Dimensions (L × W)</label>
                            <div className="flex items-center gap-1">
                              <input
                                type="number"
                                value={court.length}
                                onChange={(e) => {
                                  const val = parseFloat(e.target.value) || 0;
                                  setSports((prev) =>
                                    prev.map((s) => {
                                      if (s.id !== sport.id) return s;
                                      const newCourts = [...s.courts];
                                      newCourts[cIdx] = { ...newCourts[cIdx], length: val };
                                      return { ...s, courts: newCourts };
                                    })
                                  );
                                }}
                                className="w-1/2 px-1.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-center"
                              />
                              <span>×</span>
                              <input
                                type="number"
                                value={court.width}
                                onChange={(e) => {
                                  const val = parseFloat(e.target.value) || 0;
                                  setSports((prev) =>
                                    prev.map((s) => {
                                      if (s.id !== sport.id) return s;
                                      const newCourts = [...s.courts];
                                      newCourts[cIdx] = { ...newCourts[cIdx], width: val };
                                      return { ...s, courts: newCourts };
                                    })
                                  );
                                }}
                                className="w-1/2 px-1.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-center"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="text-[10px] text-slate-400 font-bold block mb-0.5">Surface</label>
                            <input
                              type="text"
                              value={court.surfaceType}
                              onChange={(e) => {
                                const val = e.target.value;
                                setSports((prev) =>
                                  prev.map((s) => {
                                    if (s.id !== sport.id) return s;
                                    const newCourts = [...s.courts];
                                    newCourts[cIdx] = { ...newCourts[cIdx], surfaceType: val };
                                    return { ...s, courts: newCourts };
                                  })
                                );
                              }}
                              className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg truncate"
                            />
                          </div>

                          <div className="flex items-center justify-end">
                            {sport.courts.length > 1 && (
                              <button
                                type="button"
                                onClick={() => handleRemoveCourt(sport.id, cIdx)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg"
                                title="Remove court"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* STEP 3: Facilities & Services (Yes/No Capabilities) */}
        {activeStep === 3 && (
          <div className="space-y-6">
            <div className="border-b border-slate-100 pb-3">
              <h2 className="text-xl font-bold text-[#0b1c30]">Step 3: Facilities &amp; Club Services</h2>
              <p className="text-slate-500 text-xs mt-1">
                Declare your club capabilities. Services turned off here are disabled across the system and cannot accept unsupported orders.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                {
                  id: 'hasCanteen',
                  title: 'Canteen / Cafe',
                  desc: 'Does the club have an operational food/beverage counter?',
                  val: capabilities.hasCanteen,
                },
                {
                  id: 'hasKitchen',
                  title: 'Kitchen & Meal Prep (KDS)',
                  desc: 'Cooked meals prepared fresh for players or spectators.',
                  val: capabilities.hasKitchen,
                },
                {
                  id: 'hasShop',
                  title: 'Pro Shop & Accessories',
                  desc: 'Sell rackets, balls, grips, apparel, and energy drinks.',
                  val: capabilities.hasShop,
                },
                {
                  id: 'hasRentals',
                  title: 'Equipment Rentals',
                  desc: 'Rent rackets, shoes, balls, or paddle gear per session.',
                  val: capabilities.hasRentals,
                },
                {
                  id: 'hasCoaching',
                  title: 'Coaching & Academy',
                  desc: 'Offer professional coaching sessions and packages.',
                  val: capabilities.hasCoaching,
                },
                {
                  id: 'hasClickAndCollect',
                  title: 'Click & Collect',
                  desc: 'Allow players to order merchandise/food ahead for court pickup.',
                  val: capabilities.hasClickAndCollect,
                },
                {
                  id: 'hasDelivery',
                  title: 'Local Delivery Service',
                  desc: 'Offer delivery to nearby neighborhoods.',
                  val: capabilities.hasDelivery,
                },
              ].map((service) => (
                <div key={service.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between">
                  <div className="pr-3">
                    <h4 className="text-xs font-bold text-[#0b1c30]">{service.title}</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">{service.desc}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setCapabilities((prev: any) => ({
                        ...prev,
                        [service.id]: !prev[service.id],
                      }))
                    }
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      service.val ? 'bg-[#006c49]' : 'bg-slate-300'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        service.val ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              ))}
            </div>

            {/* Optional Facility Amenities */}
            <div className="pt-2 border-t border-slate-100">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">Facility Amenities</h3>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                {[
                  { id: 'hasParking', label: '🚗 Dedicated Parking' },
                  { id: 'hasChangingRooms', label: '👕 Changing Rooms' },
                  { id: 'hasWashrooms', label: '🚿 Showers & Washrooms' },
                  { id: 'hasDrinkingWater', label: '💧 RO Drinking Water' },
                  { id: 'hasAccessibility', label: '♿ Wheelchair Accessible' },
                ].map((item) => (
                  <label key={item.id} className="flex items-center gap-2 p-3 bg-white border border-slate-200 rounded-xl text-xs font-medium cursor-pointer">
                    <input
                      type="checkbox"
                      checked={(capabilities as any)[item.id]}
                      onChange={(e) =>
                        setCapabilities((prev: any) => ({ ...prev, [item.id]: e.target.checked }))
                      }
                      className="rounded text-[#006c49] focus:ring-[#006c49]"
                    />
                    <span>{item.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: Business Details & Verification */}
        {activeStep === 4 && (
          <div className="space-y-6">
            <div className="border-b border-slate-100 pb-3">
              <h2 className="text-xl font-bold text-[#0b1c30]">Step 4: Business Details &amp; Verification</h2>
              <p className="text-slate-500 text-xs mt-1">
                Provide your legal entity details. Private business documents are restricted to platform admin compliance review and never shown in public galleries.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Legal Business Name *</label>
                <input
                  id="input-legal-name"
                  type="text"
                  value={businessData.legalBusinessName}
                  onChange={(e) => setBusinessData({ ...businessData, legalBusinessName: e.target.value })}
                  placeholder="Registered Entity Name"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:border-[#006c49] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Entity / Business Type *</label>
                <select
                  id="select-business-type"
                  value={businessData.businessType}
                  onChange={(e) => setBusinessData({ ...businessData, businessType: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium"
                >
                  <option value="Private Limited Company">Private Limited Company</option>
                  <option value="Partnership / LLP">Partnership / LLP</option>
                  <option value="Sole Proprietorship">Sole Proprietorship</option>
                  <option value="Society / Trust / NGO">Society / Trust / NGO</option>
                  <option value="Public Limited">Public Limited</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Business Registration Number (CIN / LLPIN)</label>
                <input
                  type="text"
                  value={businessData.businessRegNumber}
                  onChange={(e) => setBusinessData({ ...businessData, businessRegNumber: e.target.value })}
                  placeholder="e.g. U74999MH2022PTC123456"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:border-[#006c49] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Entity PAN *</label>
                <input
                  id="input-pan"
                  type="text"
                  maxLength={10}
                  value={businessData.panNumber}
                  onChange={(e) => setBusinessData({ ...businessData, panNumber: e.target.value.toUpperCase() })}
                  placeholder="10-character PAN"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono tracking-wider focus:bg-white focus:border-[#006c49] outline-none uppercase"
                />
              </div>

              <div className="sm:col-span-2 p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-[#0b1c30]">GST Registration Status *</h4>
                    <p className="text-[11px] text-slate-500">
                      Does your entity exceed the threshold or operate under active GST registration?
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-1.5 text-xs font-bold cursor-pointer">
                      <input
                        type="radio"
                        name="gstStatus"
                        checked={businessData.gstRegistered}
                        onChange={() => setBusinessData({ ...businessData, gstRegistered: true })}
                        className="text-[#006c49] focus:ring-[#006c49]"
                      />
                      <span>Registered</span>
                    </label>
                    <label className="flex items-center gap-1.5 text-xs font-bold cursor-pointer">
                      <input
                        type="radio"
                        name="gstStatus"
                        checked={!businessData.gstRegistered}
                        onChange={() => setBusinessData({ ...businessData, gstRegistered: false, gstNumber: '' })}
                        className="text-[#006c49] focus:ring-[#006c49]"
                      />
                      <span>Not Registered</span>
                    </label>
                  </div>
                </div>

                {businessData.gstRegistered && (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">GSTIN Number *</label>
                    <input
                      id="input-gstin"
                      type="text"
                      maxLength={15}
                      value={businessData.gstNumber}
                      onChange={(e) => setBusinessData({ ...businessData, gstNumber: e.target.value.toUpperCase() })}
                      placeholder="15-character GSTIN (e.g. 23AAHCS1234D1Z5)"
                      className="w-full sm:w-1/2 px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-sm font-mono uppercase tracking-wider focus:border-[#006c49] outline-none"
                    />
                  </div>
                )}
              </div>

              <div className="sm:col-span-2 p-4 bg-emerald-50/50 border border-emerald-200 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-[#006c49]" />
                    <span className="text-xs font-bold text-[#0b1c30]">Registration Certificate / Proof of Entity</span>
                  </div>
                  <span className="text-[10px] text-slate-500 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-[#006c49]" /> Encrypted Storage
                  </span>
                </div>
                <div className="flex items-center justify-between bg-white p-3 rounded-lg border border-slate-200 text-xs">
                  <span className="truncate text-slate-700 font-medium">{businessData.businessDocName}</span>
                  <span className="text-emerald-700 font-bold text-[11px] bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    Uploaded
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 5: Review and Submit */}
        {activeStep === 5 && (
          <div className="space-y-6">
            <div className="border-b border-slate-100 pb-3">
              <h2 className="text-xl font-bold text-[#0b1c30]">Step 5: Review Application &amp; Submit</h2>
              <p className="text-slate-500 text-xs mt-1">
                Please verify all entered details. Submitting places your club in <strong>PENDING_REVIEW</strong> status for platform admin inspection.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Summary 1: Club Info */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600">Club &amp; Operator</h4>
                  <button type="button" onClick={() => setActiveStep(1)} className="text-xs text-[#006c49] font-bold hover:underline">
                    Edit
                  </button>
                </div>
                <div className="text-xs space-y-1 text-slate-700">
                  <div className="font-bold text-sm text-[#0b1c30]">{ownerData.clubName}</div>
                  <div>Operator: {ownerData.ownerName} ({ownerData.email})</div>
                  <div>Address: {ownerData.address}, {ownerData.city}, {ownerData.state}</div>
                  <div>Operating Hours: {ownerData.openTime} - {ownerData.closeTime} (Closures: {ownerData.weeklyClosures})</div>
                  <div>Total Area: {ownerData.totalArea} {ownerData.totalAreaUnit}</div>
                </div>
              </div>

              {/* Summary 2: Sports & Courts */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600">Sports &amp; Courts</h4>
                  <button type="button" onClick={() => setActiveStep(2)} className="text-xs text-[#006c49] font-bold hover:underline">
                    Edit
                  </button>
                </div>
                <div className="text-xs space-y-2 text-slate-700">
                  {sports.map((s, idx) => (
                    <div key={idx} className="border-b border-slate-200/60 pb-1.5 last:border-0 last:pb-0">
                      <div className="font-bold text-[#0b1c30] flex items-center justify-between">
                        <span>{s.sportName}</span>
                        <span className="text-[11px] font-normal text-slate-500">{s.images.length} photos</span>
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {s.courts.map((c) => `${c.name} (₹${c.basePricePerHour}/hr)`).join(', ')}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Summary 3: Capabilities */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600">Enabled Capabilities</h4>
                  <button type="button" onClick={() => setActiveStep(3)} className="text-xs text-[#006c49] font-bold hover:underline">
                    Edit
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {capabilities.hasCanteen && <Badge variant="outline" className="text-[10px]">Canteen</Badge>}
                  {capabilities.hasKitchen && <Badge variant="outline" className="text-[10px]">Kitchen KDS</Badge>}
                  {capabilities.hasShop && <Badge variant="outline" className="text-[10px]">Pro Shop</Badge>}
                  {capabilities.hasRentals && <Badge variant="outline" className="text-[10px]">Rentals</Badge>}
                  {capabilities.hasCoaching && <Badge variant="outline" className="text-[10px]">Coaching</Badge>}
                  {capabilities.hasClickAndCollect && <Badge variant="outline" className="text-[10px]">Click &amp; Collect</Badge>}
                  {capabilities.hasDelivery && <Badge variant="outline" className="text-[10px]">Delivery</Badge>}
                </div>
              </div>

              {/* Summary 4: Business & Verification */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600">Business Verification</h4>
                  <button type="button" onClick={() => setActiveStep(4)} className="text-xs text-[#006c49] font-bold hover:underline">
                    Edit
                  </button>
                </div>
                <div className="text-xs space-y-1 text-slate-700">
                  <div className="font-semibold">{businessData.legalBusinessName}</div>
                  <div>Entity: {businessData.businessType}</div>
                  <div>PAN: {businessData.panNumber}</div>
                  <div>GST: {businessData.gstRegistered ? businessData.gstNumber : 'Unregistered'}</div>
                  <div className="text-[11px] text-[#006c49] font-medium flex items-center gap-1 mt-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Documentation Attached
                  </div>
                </div>
              </div>
            </div>

            {/* Platform Policy Notice */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 space-y-1">
              <div className="font-bold text-[#0b1c30] flex items-center gap-1.5">
                <Info className="w-4 h-4 text-[#006c49]" /> Platform Inspection &amp; Settlement Policy
              </div>
              <p>
                Platform commission is fixed at 10.0% for court bookings, memberships, coaching, and events. Canteen and Pro Shop sales carry 0% platform commission. Confirmed booking rates stay locked and are protected against future tariff alterations.
              </p>
            </div>
          </div>
        )}

        {/* Footer Navigation Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-100">
          <div className="flex items-center gap-2">
            {activeStep > 1 ? (
              <Button variant="outline" size="sm" onClick={handleBack} className="gap-1.5 cursor-pointer">
                <ArrowLeft className="w-4 h-4" /> Back
              </Button>
            ) : (
              <Button variant="outline" size="sm" onClick={() => navigate(-1)} className="gap-1.5 cursor-pointer">
                <ArrowLeft className="w-4 h-4" /> Back
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={handleSaveDraft}
              disabled={isDraftSaving}
              className="gap-1.5 text-slate-600 hover:text-[#006c49] cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              {isDraftSaving ? 'Saving...' : 'Save Draft Progress'}
            </Button>
          </div>

          <div>
            {activeStep < 5 ? (
              <Button
                variant="primary"
                onClick={handleNext}
                className="bg-[#006c49] hover:bg-[#005237] gap-1.5 cursor-pointer"
              >
                Continue to Step {activeStep + 1} <ArrowRight className="w-4 h-4" />
              </Button>
            ) : (
              <Button
                variant="primary"
                onClick={handleSubmitApplication}
                disabled={isSubmitting}
                className="bg-[#006c49] hover:bg-[#005237] gap-2 px-6 cursor-pointer"
              >
                {isSubmitting ? (
                  'Submitting...'
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" /> Submit for Inspection Review
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
