import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Calendar,
  Clock,
  MapPin,
  QrCode,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ArrowRight,
  ShieldCheck,
  ChevronRight,
  Info,
  RefreshCw
} from 'lucide-react';
import {
  getCustomerBookings,
  cancelCustomerBooking,
  CustomerBooking
} from '@/lib/bookingsState';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { EmptyState } from '@/components/ui/EmptyState';

export default function MyBookingsPage() {
  const [bookings, setBookings] = useState<CustomerBooking[]>([]);
  const [activeTab, setActiveTab] = useState<'upcoming' | 'completed' | 'cancelled'>('upcoming');
  const [selectedBookingForPass, setSelectedBookingForPass] = useState<CustomerBooking | null>(null);
  const [cancellingBookingId, setCancellingBookingId] = useState<string | null>(null);
  const [cancelModalBooking, setCancelModalBooking] = useState<CustomerBooking | null>(null);
  const [cancellationResult, setCancellationResult] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshToast, setRefreshToast] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleRefresh = async () => {
    setIsRefreshing(true);
    setRefreshToast(null);
    try {
      await loadBookings();
      setRefreshToast('Refreshed! Latest booking data fetched from table.');
      setTimeout(() => setRefreshToast(null), 3000);
    } catch {
      setRefreshToast('Unable to fetch latest bookings.');
      setTimeout(() => setRefreshToast(null), 3000);
    } finally {
      setIsRefreshing(false);
    }
  };

  const loadBookings = async () => {
    const token = localStorage.getItem('sportshub_token');
    const localBookings = getCustomerBookings();

    if (!token) {
      setBookings(localBookings);
      return;
    }

    try {
      const res = await fetch('/api/v1/bookings/my', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const resData = await res.json();
      if (res.ok && resData.success && Array.isArray(resData.data)) {
        const apiBookings: CustomerBooking[] = resData.data.map((b: any) => {
          const startDate = b.start_time ? new Date(b.start_time) : new Date(b.created_at || Date.now());
          const endDate = b.end_time ? new Date(b.end_time) : new Date(startDate.getTime() + 60 * 60 * 1000);

          const dateStr = !isNaN(startDate.getTime())
            ? startDate.toISOString().split('T')[0]
            : (b.start_time ? String(b.start_time).split('T')[0] : new Date().toISOString().split('T')[0]);

          const formatTime = (d: Date) => {
            if (isNaN(d.getTime())) return '18:00';
            const h = d.getHours().toString().padStart(2, '0');
            const m = d.getMinutes().toString().padStart(2, '0');
            return `${h}:${m}`;
          };

          const startTimeStr = formatTime(startDate);
          const endTimeStr = formatTime(endDate);
          const durHours = Math.max(1, Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60)) || 1);

          return {
            id: b.id,
            clubId: b.club_id,
            clubSlug: b.club_id,
            clubName: b.club_name || 'Sports Venue',
            courtId: b.court_id,
            courtName: b.court_name || 'Court',
            sport: b.sport_type || 'Sports',
            date: dateStr,
            startTime: startTimeStr,
            endTime: endTimeStr,
            durationHours: durHours,
            basePrice: parseFloat(b.price_charged || 800),
            priceCharged: parseFloat(b.price_charged || 800),
            isPeak: false,
            memberDiscountPct: 0,
            status: (b.status || 'CONFIRMED') as any,
            paymentMode: 'UPI',
            paymentStatus: 'PAID',
            bookingCode: `SH-${String(b.id).slice(0, 6).toUpperCase()}`,
            createdAt: b.created_at || new Date().toISOString(),
          };
        });

        const existingIds = new Set(apiBookings.map((b) => b.id));
        const unsyncedLocal = localBookings.filter((lb) => !existingIds.has(lb.id));
        setBookings([...apiBookings, ...unsyncedLocal]);
      } else {
        setBookings(localBookings);
      }
    } catch {
      setBookings(localBookings);
    }
  };

  useEffect(() => {
    loadBookings();
    window.addEventListener('sportshub_bookings_updated', loadBookings);
    return () => window.removeEventListener('sportshub_bookings_updated', loadBookings);
  }, []);

  const filteredBookings = bookings.filter((b) => {
    if (activeTab === 'upcoming') return b.status === 'CONFIRMED';
    if (activeTab === 'completed') return b.status === 'COMPLETED';
    if (activeTab === 'cancelled') return b.status === 'CANCELLED';
    return true;
  });

  const handleConfirmCancel = () => {
    if (!cancelModalBooking) return;
    setCancellingBookingId(cancelModalBooking.id);

    const res = cancelCustomerBooking(cancelModalBooking.id);
    setCancellationResult(res.message);
    setCancellingBookingId(null);
    setCancelModalBooking(null);
    loadBookings();
  };

  return (
    <div className="min-h-screen bg-[#f8f9ff] py-8 selection:bg-[#006c49] selection:text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Breadcrumb Navigation */}
        <nav className="flex items-center gap-1.5 text-xs text-slate-500">
          <Link to="/" className="hover:text-[#006c49]">Home</Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <Link to="/dashboard" className="hover:text-[#006c49]">Dashboard</Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-[#0b1c30] font-medium">My Bookings</span>
        </nav>

        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0b1c30] tracking-tight">
              My Court Bookings
            </h1>
            <p className="text-xs text-slate-600 mt-1">
              View upcoming reservations, access check-in QR passes, and manage cancellations.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="px-3.5 py-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all text-xs font-semibold text-slate-700 flex items-center gap-2 cursor-pointer shadow-2xs"
              title="Fetch latest booking data from table"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-[#006c49] ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>{isRefreshing ? 'Refreshing...' : 'Refresh Data'}</span>
            </button>

            <Link to="/clubs">
              <Button variant="primary" size="sm" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
                Book a New Court
              </Button>
            </Link>
          </div>
        </div>

        {/* Refresh Notification Toast */}
        {refreshToast && (
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2 font-medium shadow-2xs">
            <CheckCircle2 className="w-4 h-4 text-[#006c49] shrink-0" />
            <span>{refreshToast}</span>
          </div>
        )}

        {/* Alert notification if cancellation occurred */}
        {cancellationResult && (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#006c49]" />
              <span>{cancellationResult}</span>
            </div>
            <button
              onClick={() => setCancellationResult(null)}
              className="text-xs font-semibold text-emerald-700 hover:underline"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-200 pb-1">
          {[
            { id: 'upcoming', label: 'Upcoming', count: bookings.filter((b) => b.status === 'CONFIRMED').length },
            { id: 'completed', label: 'Past & Completed', count: bookings.filter((b) => b.status === 'COMPLETED').length },
            { id: 'cancelled', label: 'Cancelled', count: bookings.filter((b) => b.status === 'CANCELLED').length },
          ].map((tab) => {
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-t-xl text-xs font-semibold transition-all cursor-pointer border-b-2 -mb-[1px] ${
                  active
                    ? 'border-[#006c49] text-[#006c49] bg-white'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                <span>{tab.label}</span>
                <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${active ? 'bg-[#ecfdf5] text-[#006c49]' : 'bg-slate-100 text-slate-500'}`}>
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Booking Cards Grid */}
        {filteredBookings.length === 0 ? (
          <EmptyState
            icon={<Calendar className="w-8 h-8 text-slate-400" />}
            title={
              activeTab === 'upcoming'
                ? 'You have no upcoming court bookings'
                : activeTab === 'completed'
                ? 'No past completed matches recorded'
                : 'No cancelled bookings'
            }
            description={
              activeTab === 'upcoming'
                ? 'Reserve a court at one of our partner clubs to play padel, badminton or tennis with friends.'
                : 'Your court booking activity will appear here once you complete a match.'
            }
            actionLabel="Find a Court & Book"
            onAction={() => navigate('/clubs')}
          />
        ) : (
          <div className="space-y-4">
            {filteredBookings.map((b) => {
              const isConfirmed = b.status === 'CONFIRMED';
              const isCancelled = b.status === 'CANCELLED';

              return (
                <Card
                  key={b.id}
                  className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-5 border-slate-200"
                >
                  {/* Left: Date, Club, Court info */}
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-bold text-[#006c49] uppercase font-mono">
                        {b.sport === 'PRO_SHOP_GEAR' ? '🛍️ PRO SHOP & GEAR' : b.sport}
                      </span>
                      {isConfirmed && <Badge variant="emerald">Confirmed</Badge>}
                      {b.status === 'COMPLETED' && <Badge variant="blue">Completed</Badge>}
                      {isCancelled && <Badge variant="rose">Cancelled</Badge>}
                      <span className="text-xs text-slate-500 font-mono">#{b.bookingCode}</span>
                    </div>

                    <h3 className="text-base font-bold text-[#0b1c30]">
                      {b.courtName}
                    </h3>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600">
                      <span className="flex items-center gap-1 font-medium text-slate-800">
                        <MapPin className="w-3.5 h-3.5 text-[#006c49]" /> {b.clubName}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" /> {b.date}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-400" /> {b.startTime} – {b.endTime} ({b.durationHours} hr)
                      </span>
                    </div>

                    {isCancelled && b.refundAmount !== undefined && (
                      <p className="text-xs text-slate-500 italic">
                        Refund of ₹{b.refundAmount} ({b.refundPercentage}%) credited.
                      </p>
                    )}
                  </div>

                  {/* Right: Price & Actions */}
                  <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-3 pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                    <div className="sm:text-right">
                      <div className="text-base font-black text-[#0b1c30]">₹{b.priceCharged}</div>
                      <span className="text-[11px] text-slate-500 font-medium">
                        Paid via {b.paymentMode}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {isConfirmed && (
                        <>
                          <Button
                            variant="secondary"
                            size="sm"
                            leftIcon={<QrCode className="w-3.5 h-3.5 text-[#006c49]" />}
                            onClick={() => setSelectedBookingForPass(b)}
                          >
                            Check-in Pass
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-rose-700 hover:bg-rose-50"
                            onClick={() => setCancelModalBooking(b)}
                          >
                            Cancel
                          </Button>
                        </>
                      )}
                      {!isConfirmed && (
                        <Link to={`/club/${b.clubSlug}/book`}>
                          <Button variant="outline" size="sm">
                            Book Again
                          </Button>
                        </Link>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {/* Check-in Pass Modal */}
        {selectedBookingForPass && (
          <Modal
            isOpen={!!selectedBookingForPass}
            onClose={() => setSelectedBookingForPass(null)}
            title="Club Check-in Pass"
            description="Present this booking pass to the reception desk on arrival."
          >
            <div className="text-center space-y-4 py-2">
              {/* QR Mock graphic with genuine booking code */}
              <div className="w-48 h-48 mx-auto p-3 bg-white rounded-2xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center space-y-2">
                <QrCode className="w-28 h-28 text-[#0b1c30]" />
                <span className="text-xs font-mono font-bold text-[#006c49]">
                  {selectedBookingForPass.bookingCode}
                </span>
              </div>

              <div className="space-y-1 text-xs text-slate-600">
                <div className="font-bold text-sm text-[#0b1c30]">
                  {selectedBookingForPass.courtName}
                </div>
                <div>{selectedBookingForPass.clubName}</div>
                <div>
                  {selectedBookingForPass.date} • {selectedBookingForPass.startTime} – {selectedBookingForPass.endTime}
                </div>
              </div>

              <div className="pt-2">
                <Button
                  variant="primary"
                  size="sm"
                  className="w-full"
                  onClick={() => setSelectedBookingForPass(null)}
                >
                  Done
                </Button>
              </div>
            </div>
          </Modal>
        )}

        {/* Cancellation Confirmation Modal */}
        {cancelModalBooking && (
          <Modal
            isOpen={!!cancelModalBooking}
            onClose={() => setCancelModalBooking(null)}
            title="Cancel Court Booking"
          >
            <div className="space-y-4 py-2 text-xs text-slate-600">
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div className="leading-relaxed">
                  <strong>Refund Policy:</strong> Cancellations made &gt;24 hours in advance receive a 100% refund. Between 2 and 24 hours receive 50%. Under 2 hours are non-refundable.
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <div className="font-bold text-slate-900">{cancelModalBooking.courtName}</div>
                <div>{cancelModalBooking.clubName}</div>
                <div>{cancelModalBooking.date} at {cancelModalBooking.startTime}</div>
                <div className="font-semibold text-slate-900 pt-1">
                  Amount to refund: ₹{cancelModalBooking.priceCharged} (subject to hours remaining)
                </div>
              </div>

              <p className="text-slate-600">
                Are you sure you want to release this court reservation?
              </p>

              <div className="pt-2 flex items-center justify-end gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCancelModalBooking(null)}
                >
                  Keep Booking
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={handleConfirmCancel}
                >
                  Confirm Cancellation
                </Button>
              </div>
            </div>
          </Modal>
        )}

      </div>
    </div>
  );
}
