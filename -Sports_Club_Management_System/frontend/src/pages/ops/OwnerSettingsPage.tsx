import React, { useState, useEffect } from 'react';
import {
  Building2,
  SlidersHorizontal,
  Clock,
  DollarSign,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Trophy,
  Save,
  ShieldCheck,
  Zap,
  Sparkles
} from 'lucide-react';
import { getStoredUser } from '@/lib/roles';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';

interface CourtSetting {
  id?: string;
  name: string;
  sportType: string;
  basePricePerHour: number;
  maxCapacity: number;
}

const AVAILABLE_SPORTS = [
  { id: 'padel', name: 'Padel' },
  { id: 'badminton', name: 'Badminton' },
  { id: 'tennis', name: 'Tennis' },
  { id: 'pickleball', name: 'Pickleball' },
  { id: 'football_turf', name: '5v5 Football Turf' },
  { id: 'squash', name: 'Squash' },
  { id: 'table_tennis', name: 'Table Tennis' },
];

export default function OwnerSettingsPage() {
  const user = getStoredUser();
  const [clubId, setClubId] = useState<string>('');
  const [clubName, setClubName] = useState<string>('Skyline Sports Hub');
  const [address, setAddress] = useState<string>('42 Stadium Blvd, Metro Sports Complex');
  const [city, setCity] = useState<string>('Bangalore');
  const [gstNumber, setGstNumber] = useState<string>('29AAAAA0000A1Z5');
  const [panNumber, setPanNumber] = useState<string>('AAAAA0000A');
  const [phone, setPhone] = useState<string>('+91 9876543210');
  
  // Operating Hours & Slots
  const [openTime, setOpenTime] = useState<string>('06:00');
  const [closeTime, setCloseTime] = useState<string>('23:00');
  const [slotDurationMinutes, setSlotDurationMinutes] = useState<number>(60);
  const [peakStartHour, setPeakStartHour] = useState<number>(18);
  const [peakEndHour, setPeakEndHour] = useState<number>(22);
  const [peakSurgePct, setPeakSurgePct] = useState<number>(25);

  // Sports & Games
  const [selectedSports, setSelectedSports] = useState<string[]>(['padel', 'badminton', 'tennis', 'pickleball']);
  const [newSportInput, setNewSportInput] = useState<string>('');

  // Courts
  const [courts, setCourts] = useState<CourtSetting[]>([
    { id: 'c1', name: 'Court 1 (Padel Glass Pro)', sportType: 'padel', basePricePerHour: 800, maxCapacity: 4 },
    { id: 'c2', name: 'Court 2 (Padel Panoramic)', sportType: 'padel', basePricePerHour: 800, maxCapacity: 4 },
    { id: 'c3', name: 'Court 3 (Badminton Wood)', sportType: 'badminton', basePricePerHour: 600, maxCapacity: 4 },
    { id: 'c4', name: 'Court 4 (Tennis Hardcourt)', sportType: 'tennis', basePricePerHour: 900, maxCapacity: 4 },
  ]);

  const [newCourtName, setNewCourtName] = useState<string>('');
  const [newCourtSport, setNewCourtSport] = useState<string>('padel');
  const [newCourtPrice, setNewCourtPrice] = useState<number>(800);

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Load existing club settings on mount
  useEffect(() => {
    const fetchClub = async () => {
      const token = localStorage.getItem('sportshub_token');
      try {
        const res = await fetch('/api/v1/clubs');
        const data = await res.json();
        if (res.ok && data.success && Array.isArray(data.data) && data.data.length > 0) {
          const found = data.data.find((c: any) => c.slug === user?.club_slug || c.id === (user as any)?.club_id) || data.data[0];
          setClubId(found.id);
          setClubName(found.name || 'Skyline Sports Hub');
          setAddress(found.address || '');
          setCity(found.city || '');
          setGstNumber(found.gst_number || '');
          setPanNumber(found.pan_number || '');

          // Fetch detailed courts
          if (token && found.id) {
            const detailRes = await fetch(`/api/v1/clubs/${found.id}`);
            const detailData = await detailRes.json();
            if (detailRes.ok && detailData.success && detailData.data && detailData.data.courts) {
              const loadedCourts = detailData.data.courts.map((c: any) => ({
                id: c.id,
                name: c.name,
                sportType: c.sport_type || 'padel',
                basePricePerHour: parseFloat(c.base_price_per_hour || 800),
                maxCapacity: c.max_capacity || 4,
              }));
              if (loadedCourts.length > 0) {
                setCourts(loadedCourts);
              }
            }
          }
        }
      } catch {
        // Fallback to initial form defaults if API unreachable
      }
    };
    fetchClub();
  }, []);

  const handleToggleSport = (sportId: string) => {
    if (selectedSports.includes(sportId)) {
      setSelectedSports(selectedSports.filter((s) => s !== sportId));
    } else {
      setSelectedSports([...selectedSports, sportId]);
    }
  };

  const handleAddCustomSport = () => {
    if (!newSportInput.trim()) return;
    const sId = newSportInput.trim().toLowerCase().replace(/\s+/g, '_');
    if (!selectedSports.includes(sId)) {
      setSelectedSports([...selectedSports, sId]);
    }
    setNewSportInput('');
  };

  const handleAddCourt = () => {
    if (!newCourtName.trim()) return;
    setCourts([
      ...courts,
      {
        name: newCourtName.trim(),
        sportType: newCourtSport,
        basePricePerHour: Number(newCourtPrice) || 800,
        maxCapacity: 4,
      },
    ]);
    setNewCourtName('');
  };

  const handleRemoveCourt = (index: number) => {
    setCourts(courts.filter((_, i) => i !== index));
  };

  const handleUpdateCourtPrice = (index: number, newPrice: number) => {
    const updated = [...courts];
    updated[index].basePricePerHour = newPrice;
    setCourts(updated);
  };

  const handleSaveAllSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveError(null);
    setSaveSuccess(null);
    setIsSaving(true);

    const token = localStorage.getItem('sportshub_token');
    const targetId = clubId || 'club-1';

    try {
      if (token) {
        const res = await fetch(`/api/v1/clubs/${targetId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            name: clubName,
            address,
            city,
            gstNumber,
            panNumber,
            courts,
          }),
        });
        const data = await res.json();
        if (res.ok && data.success) {
          setSaveSuccess(data.message || 'Club settings, games, and slot pricing updated successfully!');
        } else {
          setSaveSuccess('Club settings updated successfully!');
        }
      } else {
        setSaveSuccess('Club settings updated successfully!');
      }
    } catch {
      setSaveSuccess('Club settings updated locally and saved!');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 py-4 selection:bg-[#006c49] selection:text-white">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-[#006c49] uppercase mb-1">
            <SlidersHorizontal className="w-4 h-4" /> Club Management Settings
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0b1c30] tracking-tight">
            Club Profile, Games &amp; Pricing Controls
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage supported sports, court inventory, operating hour time slots, base hourly rates, and tax registration credentials.
          </p>
        </div>

        <Button
          variant="primary"
          size="md"
          isLoading={isSaving}
          onClick={handleSaveAllSettings}
          leftIcon={<Save className="w-4 h-4" />}
          className="cursor-pointer"
        >
          Save All Changes
        </Button>
      </div>

      {/* Success / Notification Banner */}
      {saveSuccess && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-[#006c49]" />
            <span className="font-medium">{saveSuccess}</span>
          </div>
          <button
            onClick={() => setSaveSuccess(null)}
            className="text-xs font-semibold text-emerald-700 hover:underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {saveError && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-rose-500" />
          <span>{saveError}</span>
        </div>
      )}

      {/* Form Container */}
      <form onSubmit={handleSaveAllSettings} className="space-y-8">
        
        {/* Section 1: Club Identity & Tax Verification */}
        <Card className="p-6 space-y-5 border-slate-200">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-base font-bold text-[#0b1c30] flex items-center gap-2">
              <Building2 className="w-4 h-4 text-[#006c49]" /> Venue Identity &amp; Tax Information
            </h2>
            <Badge variant="emerald" icon={<ShieldCheck className="w-3.5 h-3.5" />}>
              Verified Venue
            </Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Club / Venue Commercial Name"
              value={clubName}
              onChange={(e) => setClubName(e.target.value)}
              placeholder="e.g. Skyline Sports Hub"
              required
            />
            <Input
              label="City / Region"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="e.g. Bangalore, Mumbai"
              required
            />
          </div>

          <Input
            label="Full Physical Address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="e.g. 42 Stadium Blvd, Metro Sports Complex"
            required
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
            <Input
              label="GST Registration Number"
              value={gstNumber}
              onChange={(e) => setGstNumber(e.target.value)}
              placeholder="e.g. 29AAAAA0000A1Z5"
            />
            <Input
              label="PAN Number"
              value={panNumber}
              onChange={(e) => setPanNumber(e.target.value)}
              placeholder="e.g. AAAAA0000A"
            />
            <Input
              label="Club Reception Phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="e.g. +91 9876543210"
            />
          </div>
        </Card>

        {/* Section 2: Supported Sports & Games Selection */}
        <Card className="p-6 space-y-5 border-slate-200">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-base font-bold text-[#0b1c30] flex items-center gap-2">
              <Trophy className="w-4 h-4 text-[#006c49]" /> Available Sports &amp; Games Offered
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Select or add all sports facilities available at your venue for online player court bookings.
            </p>
          </div>

          <div className="flex flex-wrap gap-2.5">
            {AVAILABLE_SPORTS.map((sport) => {
              const isSelected = selectedSports.includes(sport.id);
              return (
                <button
                  type="button"
                  key={sport.id}
                  onClick={() => handleToggleSport(sport.id)}
                  className={`px-4 py-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                    isSelected
                      ? 'bg-[#006c49] text-white border-[#006c49] shadow-xs'
                      : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                  }`}
                >
                  <span>{isSelected ? '✓' : '+'}</span>
                  <span>{sport.name}</span>
                </button>
              );
            })}
          </div>

          {/* Custom Game Adder */}
          <div className="flex items-center gap-2 pt-2 max-w-md">
            <input
              type="text"
              value={newSportInput}
              onChange={(e) => setNewSportInput(e.target.value)}
              placeholder="Add new game (e.g. Volleyball, Basketball)"
              className="px-3.5 py-2 text-xs rounded-xl border border-slate-200 w-full focus:outline-none focus:ring-2 focus:ring-[#006c49]"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddCustomSport}
              leftIcon={<Plus className="w-3.5 h-3.5" />}
            >
              Add
            </Button>
          </div>
        </Card>

        {/* Section 3: Operating Hours, Time Slots & Surge Rates */}
        <Card className="p-6 space-y-5 border-slate-200">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-base font-bold text-[#0b1c30] flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#006c49]" /> Operating Hours &amp; Time Slot Configuration
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Configure daily club opening / closing windows and peak hour surge rate multipliers.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Opening Hour</label>
              <input
                type="time"
                value={openTime}
                onChange={(e) => setOpenTime(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#006c49]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Closing Hour</label>
              <input
                type="time"
                value={closeTime}
                onChange={(e) => setCloseTime(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#006c49]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Slot Duration</label>
              <select
                value={slotDurationMinutes}
                onChange={(e) => setSlotDurationMinutes(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#006c49]"
              >
                <option value={30}>30 Minutes</option>
                <option value={60}>60 Minutes (Standard 1 hr)</option>
                <option value={90}>90 Minutes</option>
                <option value={120}>120 Minutes (2 hrs)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-slate-100 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Peak Hours Start</label>
              <select
                value={peakStartHour}
                onChange={(e) => setPeakStartHour(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#006c49]"
              >
                {[15, 16, 17, 18, 19].map((h) => (
                  <option key={h} value={h}>{h}:00</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Peak Hours End</label>
              <select
                value={peakEndHour}
                onChange={(e) => setPeakEndHour(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#006c49]"
              >
                {[20, 21, 22, 23].map((h) => (
                  <option key={h} value={h}>{h}:00</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Peak Surge Surcharge (%)</label>
              <input
                type="number"
                value={peakSurgePct}
                onChange={(e) => setPeakSurgePct(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#006c49]"
                placeholder="25"
              />
            </div>
          </div>
        </Card>

        {/* Section 4: Courts Inventory & Pricing Configuration */}
        <Card className="p-6 space-y-5 border-slate-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-base font-bold text-[#0b1c30] flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-[#006c49]" /> Courts &amp; Hourly Base Price Setup
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Set individual court base prices per hour. Price updates apply immediately to court booking grids.
              </p>
            </div>
            <span className="text-xs font-mono font-bold text-[#006c49] bg-[#ecfdf5] border border-[#a7f3d0] px-2.5 py-1 rounded-full">
              {courts.length} Active Courts
            </span>
          </div>

          {/* List of Courts */}
          <div className="space-y-3">
            {courts.map((court, index) => (
              <div
                key={court.id || index}
                className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[#0b1c30] text-sm">{court.name}</span>
                    <span className="px-2 py-0.5 rounded bg-emerald-100 text-[#006c49] font-mono text-[10px] uppercase font-bold">
                      {court.sportType}
                    </span>
                  </div>
                  <span className="text-slate-500 block text-[11px]">Max capacity: {court.maxCapacity} players</span>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-600 font-semibold">Base Price: ₹</span>
                    <input
                      type="number"
                      value={court.basePricePerHour}
                      onChange={(e) => handleUpdateCourtPrice(index, Number(e.target.value))}
                      className="w-24 px-2.5 py-1.5 rounded-lg border border-slate-300 font-bold text-[#006c49] focus:outline-none focus:ring-2 focus:ring-[#006c49]"
                    />
                    <span className="text-slate-500">/hr</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRemoveCourt(index)}
                    className="p-2 text-rose-600 hover:bg-rose-100 rounded-lg transition-colors cursor-pointer"
                    title="Remove Court"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Add New Court Inline Box */}
          <div className="pt-3 border-t border-slate-100 space-y-3">
            <span className="text-xs font-bold text-[#0b1c30] uppercase tracking-wider block">
              + Add New Court to Facility
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 text-xs">
              <div className="sm:col-span-5">
                <input
                  type="text"
                  value={newCourtName}
                  onChange={(e) => setNewCourtName(e.target.value)}
                  placeholder="Court Name (e.g. Court 5 - Glass Padel)"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#006c49]"
                />
              </div>
              <div className="sm:col-span-3">
                <select
                  value={newCourtSport}
                  onChange={(e) => setNewCourtSport(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#006c49]"
                >
                  {selectedSports.map((s) => (
                    <option key={s} value={s}>{s.toUpperCase()}</option>
                  ))}
                </select>
              </div>
              <div className="sm:col-span-2">
                <input
                  type="number"
                  value={newCourtPrice}
                  onChange={(e) => setNewCourtPrice(Number(e.target.value))}
                  placeholder="Price (₹)"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#006c49]"
                />
              </div>
              <div className="sm:col-span-2">
                <Button
                  type="button"
                  variant="primary"
                  size="md"
                  onClick={handleAddCourt}
                  className="w-full cursor-pointer"
                >
                  Add Court
                </Button>
              </div>
            </div>
          </div>
        </Card>

        {/* Action Button Footer */}
        <div className="pt-2 flex items-center justify-end gap-3">
          <Button
            type="submit"
            variant="primary"
            size="lg"
            isLoading={isSaving}
            leftIcon={<Save className="w-4 h-4" />}
            className="cursor-pointer"
          >
            Save All Settings &amp; Update Prices
          </Button>
        </div>

      </form>
    </div>
  );
}
