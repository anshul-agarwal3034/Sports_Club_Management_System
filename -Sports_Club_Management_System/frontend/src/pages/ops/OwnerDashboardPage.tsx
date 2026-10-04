import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Building2,
  TrendingUp,
  DollarSign,
  SlidersHorizontal,
  Flame,
  CreditCard,
  Calendar,
  Info
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { getStoredUser } from '@/lib/roles';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';

export default function OwnerDashboardPage() {
  const [club, setClub] = useState<{
    id: string;
    name: string;
    city: string;
    address: string;
    gst_number?: string;
    is_verified?: boolean;
    courts?: any[];
  } | null>(null);

  const [bookings, setBookings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const fetchOwnerDashboardData = async () => {
      setIsLoading(true);
      setErrorMessage(null);
      const token = localStorage.getItem('sportshub_token');

      if (!token) {
        setIsLoading(false);
        setErrorMessage('Authentication token not found. Please sign in to access your Owner HQ.');
        return;
      }

      try {
        // 1. Fetch current authenticated owner profile to get owner's assigned club ID
        const meRes = await fetch('/api/v1/auth/me', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const meData = await meRes.json();

        let ownerClubId = meData?.data?.clubId || meData?.data?.club_id;

        if (!ownerClubId) {
          const storedUser = getStoredUser();
          ownerClubId = (storedUser as any)?.clubId || (storedUser as any)?.club_id;
        }

        // 2. If no direct clubId on user profile, query clubs list to match owner
        if (!ownerClubId) {
          const clubsRes = await fetch('/api/v1/clubs');
          const clubsData = await clubsRes.json();
          if (clubsRes.ok && clubsData.success && Array.isArray(clubsData.data) && clubsData.data.length > 0) {
            const storedUser = getStoredUser();
            const found = clubsData.data.find(
              (c: any) => c.slug === storedUser?.club_slug || c.name.toLowerCase().includes(storedUser?.full_name?.toLowerCase() || '')
            ) || clubsData.data[0];
            ownerClubId = found.id;
          }
        }

        if (!ownerClubId) {
          setIsLoading(false);
          setErrorMessage('No registered sports club found under your account. Please set up a club first.');
          return;
        }

        // 3. Fetch Club Profile
        const clubRes = await fetch(`/api/v1/clubs/${ownerClubId}`);
        const clubData = await clubRes.json();
        if (clubRes.ok && clubData.success && clubData.data) {
          setClub(clubData.data);
        }

        // 4. Fetch Bookings for Owner's Authorized Club (passes enforceClubIsolation)
        const bookingsRes = await fetch(`/api/v1/bookings/club/${ownerClubId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const bookingsData = await bookingsRes.json();

        if (bookingsRes.ok && bookingsData.success && Array.isArray(bookingsData.data)) {
          setBookings(bookingsData.data);
        } else {
          setBookings([]);
        }
      } catch (err: any) {
        setErrorMessage(err.message || 'Failed to load club dashboard metrics.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchOwnerDashboardData();
  }, []);

  // Compute live revenue & stats dynamically from real database records
  const totalRevenue = bookings.reduce(
    (sum, b) => sum + (parseFloat(b.price_charged || b.price || 0)),
    0
  );
  const platformFee = Math.round(totalRevenue * 0.10);
  const netPayout = totalRevenue - platformFee;
  const activeBookingsCount = bookings.filter((b) => b.status === 'CONFIRMED' || b.status === 'COMPLETED').length;

  const totalCourtsCount = club?.courts?.length || 1;
  // Estimate occupancy percentage based on actual bookings count against 16 hourly daily slots
  const occupancyPct = Math.min(
    100,
    Math.round((activeBookingsCount / Math.max(1, totalCourtsCount * 16)) * 100 * 10) / 10
  );

  // Dynamic Revenue Split by Sport
  const revenueBySportMap: Record<string, number> = {};
  bookings.forEach((b) => {
    const sport = (b.sport_type || b.sport || 'General Courts').toUpperCase();
    const val = parseFloat(b.price_charged || b.price || 0);
    revenueBySportMap[sport] = (revenueBySportMap[sport] || 0) + val;
  });

  const revenueCategoryData = Object.keys(revenueBySportMap).length > 0
    ? Object.entries(revenueBySportMap).map(([name, value], idx) => ({
        name,
        value,
        color: ['#006c49', '#2563eb', '#7c3aed', '#d97706'][idx % 4],
      }))
    : [
        { name: 'Court Bookings', value: 0, color: '#006c49' },
        { name: 'Memberships', value: 0, color: '#2563eb' },
      ];

  // Dynamic Payment Mode Split
  const paymentModeMap: Record<string, number> = {};
  bookings.forEach((b) => {
    const mode = (b.payment_mode || 'UPI').toUpperCase();
    const val = parseFloat(b.price_charged || b.price || 0);
    paymentModeMap[mode] = (paymentModeMap[mode] || 0) + val;
  });

  const paymentModeData = Object.keys(paymentModeMap).length > 0
    ? Object.entries(paymentModeMap).map(([name, value], idx) => ({
        name,
        value,
        color: ['#006c49', '#2563eb', '#64748b', '#d97706'][idx % 4],
      }))
    : [{ name: 'UPI / Online', value: 0, color: '#006c49' }];

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-6 bg-[#f8f9ff]">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-[#006c49] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-600 font-medium">Loading live database metrics for your club...</p>
        </div>
      </div>
    );
  }

  if (errorMessage && !club) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-6 bg-[#f8f9ff]">
        <EmptyState
          icon={<Info className="w-8 h-8 text-slate-400" />}
          title="Owner Console Error"
          description={errorMessage}
          actionLabel="Go to Club Settings"
          onAction={() => window.location.assign('/owner/settings')}
        />
      </div>
    );
  }

  return (
    <div className="space-y-8 selection:bg-[#006c49] selection:text-white">
      
      {/* Executive Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs text-[#006c49] font-semibold uppercase mb-1">
            <Building2 className="w-4 h-4" /> Owner Executive HQ
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0b1c30] tracking-tight">
            {club?.name || 'My Sports Venue'}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {club?.address || 'Venue Location'}, {club?.city || 'City'} • GST: ({club?.gst_number || 'Registered'})
          </p>
        </div>

        {/* <div className="flex flex-wrap items-center gap-2 text-xs">
          <Link to="/owner/settings">
            <Button variant="primary" size="sm" leftIcon={<SlidersHorizontal className="w-3.5 h-3.5" />}>
              Club Settings &amp; Games
            </Button>
          </Link>
          <Link to="/owner/dynamic-pricing">
            <Button variant="outline" size="sm" leftIcon={<SlidersHorizontal className="w-3.5 h-3.5 text-[#006c49]" />}>
              Dynamic Pricing
            </Button>
          </Link>
          <Link to="/owner/finance">
            <Button variant="primary" size="sm" leftIcon={<DollarSign className="w-3.5 h-3.5 text-white" />}>
              Finance &amp; Expenses
            </Button>
          </Link>
        </div> */}
      </div>

      {/* KPI Cards Row (Computed strictly from DB records) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Metric 1 */}
        <Card padded="sm" className="space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Gross Court Revenue</span>
            <DollarSign className="w-4 h-4 text-[#006c49]" />
          </div>
          <div className="text-2xl font-black text-[#0b1c30]">₹{totalRevenue.toLocaleString('en-IN')}</div>
          <div className="text-[11px] text-[#006c49] font-medium flex items-center gap-1">
            <TrendingUp className="w-3 h-3" /> Live Database Sync
          </div>
        </Card>

        {/* Metric 2 */}
        <Card padded="sm" className="space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Court Occupancy</span>
            <Flame className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-[#0b1c30]">{occupancyPct}%</div>
          <div className="text-[11px] text-slate-500">{activeBookingsCount} active reservations</div>
        </Card>

        {/* Metric 3 */}
        <Card padded="sm" className="space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Total Bookings</span>
            <Calendar className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-[#0b1c30]">{bookings.length} Bookings</div>
          <div className="text-[11px] text-[#006c49] font-medium">{totalCourtsCount} Active Courts</div>
        </Card>

        {/* Metric 4 */}
        <Card padded="sm" className="space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Net Monthly Payout</span>
            <CreditCard className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-black text-[#006c49]">₹{netPayout.toLocaleString('en-IN')}</div>
          <div className="text-[11px] text-slate-500">After 10% platform fee (₹{platformFee.toLocaleString('en-IN')})</div>
        </Card>

      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Revenue Category Split Bar Chart */}
        <Card className="lg:col-span-8 p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-base font-bold text-[#0b1c30]">Revenue Stream Breakdown</h2>
              <p className="text-xs text-slate-500 mt-0.5">Live revenue generated across court sports</p>
            </div>
            <span className="text-xs font-semibold text-[#006c49] bg-[#ecfdf5] border border-[#a7f3d0] px-2.5 py-0.5 rounded-full">
              Live DB Data
            </span>
          </div>

          {totalRevenue === 0 ? (
            <div className="py-12 text-center space-y-2">
              <Calendar className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="text-xs text-slate-500 font-medium">
                No court bookings recorded yet for your club. Direct players to your booking link to record live matches.
              </p>
            </div>
          ) : (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenueCategoryData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={11} tickLine={false} tickFormatter={(val) => `₹${val}`} />
                  <Tooltip
                    formatter={(val: any) => [`₹${val}`, 'Revenue']}
                    contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '12px', fontSize: '12px' }}
                  />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                    {revenueCategoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>

        {/* Payment Modes Pie Chart */}
        <Card className="lg:col-span-4 p-6 space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-base font-bold text-[#0b1c30]">Payment Methods</h2>
            <p className="text-xs text-slate-500 mt-0.5">Payment mode distribution</p>
          </div>

          {totalRevenue === 0 ? (
            <div className="py-12 text-center space-y-2">
              <p className="text-xs text-slate-400">Payment breakdown will render as live bookings occur.</p>
            </div>
          ) : (
            <>
              <div className="h-48 w-full flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={paymentModeData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={75}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {paymentModeData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(val: any) => [`₹${val}`, 'Collected']}
                      contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '12px', fontSize: '12px' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="space-y-1.5 pt-2 border-t border-slate-100">
                {paymentModeData.map((pm) => (
                  <div key={pm.name} className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-2 text-slate-600">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: pm.color }} />
                      {pm.name}
                    </span>
                    <span className="font-bold text-[#0b1c30]">₹{pm.value.toLocaleString('en-IN')}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
