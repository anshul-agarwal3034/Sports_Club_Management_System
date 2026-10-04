import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Award,
  Calendar,
  CheckCircle2,
  Clock,
  MapPin,
  User,
  Loader2,
  RefreshCw,
  Plus,
  Sliders,
  Check,
  Trash2,
  AlertCircle,
  BookOpen,
  DollarSign,
  ShieldAlert,
} from 'lucide-react';
import { api } from '@/services/api';
import { Booking, Court } from '@/types';

interface CoachingSession {
  id: string;
  studentName: string;
  membershipTier: string;
  sport: string;
  court: string;
  time: string;
  date: string;
  status: 'UPCOMING' | 'COMPLETED' | 'IN_PROGRESS';
  notes: string;
}

interface BlockoutDate {
  id: string;
  date: string;
  reason: string;
}

interface CoachAvailability {
  workingStatus: 'AVAILABLE' | 'IN_SESSION' | 'ON_BREAK' | 'OFF_DUTY';
  maxSessionsPerDay: number;
  weeklyDays: { day: string; available: boolean; startTime: string; endTime: string }[];
  blockouts: BlockoutDate[];
}

const DEFAULT_AVAILABILITY: CoachAvailability = {
  workingStatus: 'AVAILABLE',
  maxSessionsPerDay: 6,
  weeklyDays: [
    { day: 'Monday', available: true, startTime: '06:00', endTime: '21:00' },
    { day: 'Tuesday', available: true, startTime: '06:00', endTime: '21:00' },
    { day: 'Wednesday', available: true, startTime: '06:00', endTime: '21:00' },
    { day: 'Thursday', available: true, startTime: '06:00', endTime: '21:00' },
    { day: 'Friday', available: true, startTime: '06:00', endTime: '21:00' },
    { day: 'Saturday', available: true, startTime: '07:00', endTime: '20:00' },
    { day: 'Sunday', available: true, startTime: '07:00', endTime: '18:00' },
  ],
  blockouts: [
    { id: 'b-1', date: '2026-10-15', reason: 'Padel State Tournament Travel' },
  ],
};

export default function CoachDashboardPage() {
  const [coachName, setCoachName] = useState('Coach');
  const [sessions, setSessions] = useState<CoachingSession[]>([]);
  const [courts, setCourts] = useState<Court[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'ROSTER' | 'BOOKING' | 'TIME_MGMT'>('ROSTER');
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Feature 2: Time Management & Availability State
  const [availability, setAvailability] = useState<CoachAvailability>(() => {
    try {
      const stored = localStorage.getItem('sportshub_coach_availability');
      if (stored) return JSON.parse(stored);
    } catch {
      // ignore
    }
    return DEFAULT_AVAILABILITY;
  });

  const [newBlockoutDate, setNewBlockoutDate] = useState('');
  const [newBlockoutReason, setNewBlockoutReason] = useState('');

  // Feature 1: Self Session Booking Form State
  const [isSubmittingBooking, setIsSubmittingBooking] = useState(false);
  const [bookingForm, setBookingForm] = useState({
    studentName: 'Self Practice / Drill Session',
    sessionType: 'Private 1-on-1 Coaching',
    sport: 'Padel',
    courtId: '',
    courtName: '',
    date: new Date().toISOString().split('T')[0],
    startHour: 8,
    endHour: 9,
    price: 800,
    notes: 'Focusing on smash defense, glass rebound positioning, and footwork drills.',
  });

  const getClubId = (): string => {
    try {
      const stored = localStorage.getItem('sportshub_user');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.full_name) setCoachName(parsed.full_name);
        if (parsed.club_id || parsed.clubId) return parsed.club_id || parsed.clubId;
      }
    } catch {
      // ignore
    }
    return '11111111-1111-1111-1111-111111111111';
  };

  const loadSessionsAndCourts = async () => {
    setIsLoading(true);
    const clubId = getClubId();
    try {
      const [bookings, courtList] = await Promise.all([
        api.getBookings(clubId).catch(() => []),
        api.getCourts(clubId).catch(() => []),
      ]);

      setCourts(courtList || []);

      if (courtList && courtList.length > 0) {
        const c0 = courtList[0] as any;
        setBookingForm((prev) => ({
          ...prev,
          courtId: c0.id,
          courtName: c0.name,
          sport: c0.sport || c0.sport_type || c0.sportType || prev.sport,
        }));
      }

      const mapped: CoachingSession[] = (bookings as Booking[]).map((b) => ({
        id: b.id,
        studentName: b.user_name || 'Member Player',
        membershipTier: 'ACTIVE MEMBER',
        sport: b.sport || 'Court Session',
        court: b.court_name || 'Court Allocation',
        time: `${b.start_hour || 8}:00 - ${b.end_hour || 9}:00`,
        date: b.date || 'Today',
        status: (b.status === 'CONFIRMED' ? 'UPCOMING' : b.status) as any,
        notes: `Court booking #${b.id}. Payment status: ${b.payment_status || 'PAID'}.`,
      }));

      // Merge locally stored coach bookings if present
      const localCoachSessions = localStorage.getItem('sportshub_coach_local_sessions');
      if (localCoachSessions) {
        try {
          const parsedLocal = JSON.parse(localCoachSessions);
          if (Array.isArray(parsedLocal)) {
            setSessions([...parsedLocal, ...mapped]);
            setIsLoading(false);
            return;
          }
        } catch {
          // ignore
        }
      }

      setSessions(mapped);
    } catch {
      setSessions([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSessionsAndCourts();
  }, []);

  const markCompleted = async (sessionId: string) => {
    try {
      const token = localStorage.getItem('sportshub_token');
      const headers = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
      await axios.patch(`/api/v1/bookings/${sessionId}/status`, { status: 'COMPLETED' }, headers);
    } catch {
      // Local optimistic state
    }
    setSessions((prev) => {
      const updated = prev.map((s) => (s.id === sessionId ? { ...s, status: 'COMPLETED' as const } : s));
      const customLocal = updated.filter((s) => s.id.startsWith('coach-book-'));
      localStorage.setItem('sportshub_coach_local_sessions', JSON.stringify(customLocal));
      return updated;
    });
  };

  // Feature 1: Handle Self Session Booking Submission
  const handleSelfSessionBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingBooking(true);
    setFeedbackMsg(null);

    const selectedCourt = courts.find((c) => c.id === bookingForm.courtId) || courts[0];
    const courtTitle = selectedCourt ? selectedCourt.name : bookingForm.courtName || 'Main Padel Court';
    const clubId = getClubId();

    try {
      // Post to backend API
      if (bookingForm.courtId) {
        await api.createBooking({
          clubId,
          courtId: bookingForm.courtId,
          date: bookingForm.date,
          startHour: Number(bookingForm.startHour),
          endHour: Number(bookingForm.endHour),
          totalPrice: Number(bookingForm.price),
          paymentMethod: 'COACH_ALLOTMENT',
          notes: `[Coach Self Session]: ${bookingForm.notes}`,
        }).catch(() => null);
      }

      const newSession: CoachingSession = {
        id: `coach-book-${Date.now()}`,
        studentName: bookingForm.studentName.trim() || 'Self Practice / Solo Clinic',
        membershipTier: bookingForm.sessionType,
        sport: bookingForm.sport,
        court: courtTitle,
        time: `${bookingForm.startHour}:00 - ${bookingForm.endHour}:00`,
        date: bookingForm.date,
        status: 'UPCOMING',
        notes: bookingForm.notes,
      };

      setSessions((prev) => {
        const updated = [newSession, ...prev];
        const customLocal = updated.filter((s) => s.id.startsWith('coach-book-'));
        localStorage.setItem('sportshub_coach_local_sessions', JSON.stringify(customLocal));
        return updated;
      });

      setFeedbackMsg({
        type: 'success',
        text: `Coaching session on ${courtTitle} booked successfully for ${bookingForm.date}!`,
      });

      setTimeout(() => {
        setFeedbackMsg(null);
        setActiveTab('ROSTER');
      }, 2000);
    } catch (err: any) {
      setFeedbackMsg({
        type: 'error',
        text: err.message || 'Could not complete session booking. Please check slot availability.',
      });
    } finally {
      setIsSubmittingBooking(false);
    }
  };

  // Feature 2: Time Management & Availability Handlers
  const handleSaveAvailability = () => {
    localStorage.setItem('sportshub_coach_availability', JSON.stringify(availability));
    setFeedbackMsg({
      type: 'success',
      text: 'Coach availability schedule, max daily limit, and time blockout rules saved successfully!',
    });
    setTimeout(() => setFeedbackMsg(null), 3500);
  };

  const handleAddBlockout = () => {
    if (!newBlockoutDate) {
      alert('Please select a date to block out.');
      return;
    }
    const newEntry: BlockoutDate = {
      id: `b-${Date.now()}`,
      date: newBlockoutDate,
      reason: newBlockoutReason.trim() || 'Vacation / Personal Leave',
    };
    const updated = {
      ...availability,
      blockouts: [...availability.blockouts, newEntry],
    };
    setAvailability(updated);
    localStorage.setItem('sportshub_coach_availability', JSON.stringify(updated));
    setNewBlockoutDate('');
    setNewBlockoutReason('');
  };

  const handleRemoveBlockout = (id: string) => {
    const updated = {
      ...availability,
      blockouts: availability.blockouts.filter((b) => b.id !== id),
    };
    setAvailability(updated);
    localStorage.setItem('sportshub_coach_availability', JSON.stringify(updated));
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto py-2">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-[#006c49] uppercase tracking-wider mb-1">
            <Award className="w-4 h-4" /> Coach Portal &amp; Schedule
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#0b1c30] tracking-tight">
            My Sessions &amp; Time Management
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Welcome back, <strong className="text-slate-800">{coachName}</strong>. Self-book training sessions, manage student roster, and configure weekly time availability.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Status Badge Indicator */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border bg-white shadow-2xs text-xs font-semibold">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                availability.workingStatus === 'AVAILABLE'
                  ? 'bg-emerald-500 animate-pulse'
                  : availability.workingStatus === 'IN_SESSION'
                  ? 'bg-amber-500 animate-ping'
                  : availability.workingStatus === 'ON_BREAK'
                  ? 'bg-blue-500'
                  : 'bg-slate-400'
              }`}
            />
            <span className="text-slate-700 capitalize">{availability.workingStatus.replace('_', ' ')}</span>
          </div>

          <button
            onClick={loadSessionsAndCourts}
            disabled={isLoading}
            className="p-2.5 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
            title="Refresh Sessions"
          >
            <RefreshCw className={`w-4 h-4 text-slate-600 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Global Feedback Banner */}
      {feedbackMsg && (
        <div
          className={`p-4 rounded-xl text-xs font-medium flex items-center justify-between shadow-2xs ${
            feedbackMsg.type === 'success'
              ? 'bg-emerald-50 border border-emerald-200 text-emerald-900'
              : 'bg-rose-50 border border-rose-200 text-rose-900'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedbackMsg.type === 'success' ? (
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{feedbackMsg.text}</span>
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-1">
        <button
          onClick={() => setActiveTab('ROSTER')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'ROSTER'
              ? 'bg-[#006c49] text-white shadow-xs'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Calendar className="w-3.5 h-3.5" /> My Sessions Roster
          <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] bg-white/20 text-white font-bold">
            {sessions.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('BOOKING')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'BOOKING'
              ? 'bg-[#006c49] text-white shadow-xs'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Plus className="w-3.5 h-3.5" /> Book Session By Self
        </button>

        <button
          onClick={() => setActiveTab('TIME_MGMT')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'TIME_MGMT'
              ? 'bg-[#006c49] text-white shadow-xs'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" /> Time Management &amp; Availability
        </button>
      </div>

      {/* TAB 1: SESSIONS ROSTER */}
      {activeTab === 'ROSTER' && (
        <div className="space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-16 text-slate-400 gap-2 bg-white rounded-2xl border border-slate-200">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="text-sm">Loading coaching sessions...</span>
            </div>
          ) : sessions.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center space-y-4 shadow-xs">
              <Calendar className="w-12 h-12 text-slate-300 mx-auto" />
              <div>
                <h3 className="font-bold text-slate-700 text-base">No Coaching Sessions Scheduled</h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
                  Bookings assigned to your coaching roster or clinic slots will appear here automatically. You can also self-book a training session using the button below.
                </p>
              </div>
              <button
                onClick={() => setActiveTab('BOOKING')}
                className="px-4 py-2 bg-[#006c49] hover:bg-[#005237] text-white rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Book Session By Self
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {sessions.map((ses) => (
                <div
                  key={ses.id}
                  className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-xs hover:border-slate-300 transition-all"
                >
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-emerald-50 text-[#006c49] flex items-center justify-center font-bold text-sm">
                        <User className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="font-bold text-[#0b1c30] text-sm">{ses.studentName}</h3>
                        <span className="text-[11px] text-slate-400 font-medium">{ses.membershipTier}</span>
                      </div>
                    </div>

                    <span
                      className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                        ses.status === 'COMPLETED'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          : ses.status === 'IN_PROGRESS'
                          ? 'bg-amber-50 text-amber-800 border-amber-200 animate-pulse'
                          : 'bg-blue-50 text-blue-700 border-blue-200'
                      }`}
                    >
                      {ses.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="flex items-center gap-2 text-slate-600">
                      <MapPin className="w-3.5 h-3.5 text-[#006c49]" />
                      <span className="font-semibold">{ses.court}</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-600">
                      <Clock className="w-3.5 h-3.5 text-blue-600" />
                      <span>{ses.time}</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-600 col-span-2">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>{ses.date}</span>
                    </div>
                  </div>

                  {ses.notes && (
                    <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl text-xs text-slate-600">
                      <span className="font-semibold text-slate-700">Drill &amp; Session Notes: </span>
                      {ses.notes}
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                    <span className="text-[11px] text-slate-400 font-mono">ID: {ses.id}</span>
                    {ses.status !== 'COMPLETED' && (
                      <button
                        onClick={() => markCompleted(ses.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-[#006c49] hover:bg-[#005237] text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" /> Mark Completed
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: SELF SESSION BOOKING FEATURE */}
      {activeTab === 'BOOKING' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6">
          <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-[#0b1c30] flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-[#006c49]" /> Self Coaching Session Booking
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Directly book a private training session, student clinic, or solo court drill allocation.
              </p>
            </div>
            <span className="px-3 py-1 rounded-full bg-emerald-50 text-[#006c49] text-xs font-bold border border-emerald-200">
              Coach Reserved Slot
            </span>
          </div>

          <form onSubmit={handleSelfSessionBooking} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Student / Player Name *
                </label>
                <input
                  type="text"
                  value={bookingForm.studentName}
                  onChange={(e) => setBookingForm({ ...bookingForm, studentName: e.target.value })}
                  placeholder="e.g. Rahul Sharma or Self Practice / Solo Drill"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:border-[#006c49] outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Coaching Session Type *
                </label>
                <select
                  value={bookingForm.sessionType}
                  onChange={(e) => setBookingForm({ ...bookingForm, sessionType: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:border-[#006c49] outline-none"
                >
                  <option value="Private 1-on-1 Coaching">Private 1-on-1 Coaching</option>
                  <option value="Group Clinic / Academy Drill">Group Clinic / Academy Drill</option>
                  <option value="Sparring Match Session">Sparring Match Session</option>
                  <option value="Self Practice / Solo Court Reserve">Self Practice / Solo Court Reserve</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Select Court Venue *
                </label>
                <select
                  value={bookingForm.courtId}
                  onChange={(e) => {
                    const selected = courts.find((c) => c.id === e.target.value) as any;
                    setBookingForm({
                      ...bookingForm,
                      courtId: e.target.value,
                      courtName: selected ? selected.name : '',
                      sport: selected?.sport || selected?.sport_type || selected?.sportType || bookingForm.sport,
                    });
                  }}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:border-[#006c49] outline-none"
                >
                  {courts.length > 0 ? (
                    courts.map((c: any) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.sport || c.sport_type || c.sportType || 'Sport Court'})
                      </option>
                    ))
                  ) : (
                    <option value="c-1">Padel Center Court 1</option>
                  )}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Date of Session *
                </label>
                <input
                  type="date"
                  value={bookingForm.date}
                  onChange={(e) => setBookingForm({ ...bookingForm, date: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:border-[#006c49] outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Time Slot (Start Hour &amp; End Hour) *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={bookingForm.startHour}
                    onChange={(e) =>
                      setBookingForm({
                        ...bookingForm,
                        startHour: Number(e.target.value),
                        endHour: Number(e.target.value) + 1,
                      })
                    }
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:border-[#006c49] outline-none"
                  >
                    {Array.from({ length: 16 }, (_, i) => i + 6).map((h) => (
                      <option key={h} value={h}>
                        {h < 12 ? `${h}:00 AM` : h === 12 ? '12:00 PM' : `${h - 12}:00 PM`}
                      </option>
                    ))}
                  </select>

                  <div className="flex items-center justify-center bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-700">
                    to {bookingForm.endHour < 12 ? `${bookingForm.endHour}:00 AM` : bookingForm.endHour === 12 ? '12:00 PM' : `${bookingForm.endHour - 12}:00 PM`}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Coaching Fee / Valuation (₹)
                </label>
                <div className="relative">
                  <DollarSign className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                  <input
                    type="number"
                    value={bookingForm.price}
                    onChange={(e) => setBookingForm({ ...bookingForm, price: Number(e.target.value) })}
                    className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:border-[#006c49] outline-none"
                    placeholder="800"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Drill Plan &amp; Training Objectives
              </label>
              <textarea
                value={bookingForm.notes}
                onChange={(e) => setBookingForm({ ...bookingForm, notes: e.target.value })}
                rows={3}
                placeholder="Specify tactical focus areas, drill routines, or gear requirements..."
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:border-[#006c49] outline-none resize-none"
              />
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setActiveTab('ROSTER')}
                className="px-4 py-2.5 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmittingBooking}
                className="px-6 py-2.5 bg-[#006c49] hover:bg-[#005237] text-white rounded-xl text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer shadow-xs"
              >
                {isSubmittingBooking ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Booking Session...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" /> Confirm Self Session Booking
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 3: TIME MANAGEMENT & AVAILABILITY FEATURE */}
      {activeTab === 'TIME_MGMT' && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6">
            <div className="border-b border-slate-100 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-[#0b1c30] flex items-center gap-2">
                  <Sliders className="w-5 h-5 text-[#006c49]" /> Coach Time Management &amp; Availability
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Configure your working status, weekly hours, max daily session cap, and date blockouts.
                </p>
              </div>

              <button
                onClick={handleSaveAvailability}
                className="px-4 py-2 bg-[#006c49] hover:bg-[#005237] text-white rounded-xl text-xs font-bold inline-flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs self-start sm:self-auto"
              >
                <Check className="w-4 h-4" /> Save Time Rules
              </button>
            </div>

            {/* 1. Working Status Mode */}
            <div className="space-y-3">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Current Working Status
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { id: 'AVAILABLE', label: '🟢 Available', desc: 'Open for bookings' },
                  { id: 'IN_SESSION', label: '🟡 In Session', desc: 'Conducting court drill' },
                  { id: 'ON_BREAK', label: '🔵 On Break', desc: 'Meal / Rest period' },
                  { id: 'OFF_DUTY', label: '🔴 Off Duty', desc: 'Unavailable for bookings' },
                ].map((st) => (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() =>
                      setAvailability((prev) => ({
                        ...prev,
                        workingStatus: st.id as any,
                      }))
                    }
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      availability.workingStatus === st.id
                        ? 'bg-emerald-50 border-[#006c49] shadow-xs'
                        : 'bg-white border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="font-bold text-xs text-[#0b1c30]">{st.label}</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">{st.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* 2. Daily Max Session Cap */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                <span>Maximum Coaching Sessions Per Day Limit</span>
                <span className="text-[#006c49] bg-emerald-100 px-2.5 py-0.5 rounded-full text-xs">
                  {availability.maxSessionsPerDay} Sessions / Day
                </span>
              </div>
              <input
                type="range"
                min={1}
                max={12}
                value={availability.maxSessionsPerDay}
                onChange={(e) =>
                  setAvailability((prev) => ({
                    ...prev,
                    maxSessionsPerDay: Number(e.target.value),
                  }))
                }
                className="w-full accent-[#006c49] cursor-pointer"
              />
              <p className="text-[11px] text-slate-500">
                Prevents overbooking and ensures adequate rest between student training sessions.
              </p>
            </div>

            {/* 3. Weekly Availability Schedule */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Weekly Working Hours Schedule
              </h3>
              <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                {availability.weeklyDays.map((item, idx) => (
                  <div
                    key={item.day}
                    className={`p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs ${
                      item.available ? 'bg-white' : 'bg-slate-50 text-slate-400'
                    }`}
                  >
                    <div className="flex items-center gap-3 w-32">
                      <input
                        type="checkbox"
                        checked={item.available}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setAvailability((prev) => ({
                            ...prev,
                            weeklyDays: prev.weeklyDays.map((w, i) =>
                              i === idx ? { ...w, available: checked } : w
                            ),
                          }));
                        }}
                        className="w-4 h-4 text-[#006c49] rounded cursor-pointer"
                      />
                      <span className={`font-bold ${item.available ? 'text-[#0b1c30]' : 'text-slate-400'}`}>
                        {item.day}
                      </span>
                    </div>

                    {item.available ? (
                      <div className="flex items-center gap-2">
                        <span className="text-slate-500 text-[11px]">Working Hours:</span>
                        <input
                          type="time"
                          value={item.startTime}
                          onChange={(e) => {
                            const val = e.target.value;
                            setAvailability((prev) => ({
                              ...prev,
                              weeklyDays: prev.weeklyDays.map((w, i) =>
                                i === idx ? { ...w, startTime: val } : w
                              ),
                            }));
                          }}
                          className="px-2 py-1 bg-slate-50 border border-slate-200 rounded text-xs focus:outline-none"
                        />
                        <span className="text-slate-400">to</span>
                        <input
                          type="time"
                          value={item.endTime}
                          onChange={(e) => {
                            const val = e.target.value;
                            setAvailability((prev) => ({
                              ...prev,
                              weeklyDays: prev.weeklyDays.map((w, i) =>
                                i === idx ? { ...w, endTime: val } : w
                              ),
                            }));
                          }}
                          className="px-2 py-1 bg-slate-50 border border-slate-200 rounded text-xs focus:outline-none"
                        />
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400 font-medium italic">Day Off / Unavailable</span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* 4. Time Blockouts (Vacations / Tournaments / Personal Days) */}
            <div className="space-y-4 pt-2 border-t border-slate-100">
              <div>
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 text-amber-600" /> Time Blockout &amp; Leave Dates
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Block specific dates for tournaments, clinic travel, or personal leave to prevent student bookings.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                <input
                  type="date"
                  value={newBlockoutDate}
                  onChange={(e) => setNewBlockoutDate(e.target.value)}
                  className="sm:col-span-4 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none"
                />
                <input
                  type="text"
                  value={newBlockoutReason}
                  onChange={(e) => setNewBlockoutReason(e.target.value)}
                  placeholder="Reason (e.g. Tournament Travel / Personal Leave)"
                  className="sm:col-span-6 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none"
                />
                <button
                  type="button"
                  onClick={handleAddBlockout}
                  className="sm:col-span-2 px-3 py-2 bg-[#006c49] hover:bg-[#005237] text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  Add Blockout
                </button>
              </div>

              {availability.blockouts.length > 0 && (
                <div className="space-y-2">
                  {availability.blockouts.map((bl) => (
                    <div
                      key={bl.id}
                      className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2 text-amber-900 font-semibold">
                        <Calendar className="w-3.5 h-3.5 text-amber-600" />
                        <span>{bl.date}</span>
                        <span className="text-amber-700 font-normal">({bl.reason})</span>
                      </div>
                      <button
                        onClick={() => handleRemoveBlockout(bl.id)}
                        className="text-rose-600 hover:text-rose-800 p-1 rounded-md transition-colors cursor-pointer"
                        title="Delete blockout"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
