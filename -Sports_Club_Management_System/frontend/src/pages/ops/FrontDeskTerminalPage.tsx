import React, { useState, useEffect } from 'react';
import {
  Monitor,
  QrCode,
  Calendar,
  PlusCircle,
  ShoppingBag,
  Loader2,
  RefreshCw
} from 'lucide-react';
import { User, Booking, Court, Product } from '@/types';
import { api } from '@/services/api';

export default function FrontDeskTerminal() {
  const [activeTab, setActiveTab] = useState<'grid' | 'qr_lookup' | 'quick_book' | 'counter_pos'>('grid');
  const [courts, setCourts] = useState<Court[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [bookingsList, setBookingsList] = useState<Booking[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [scannedMember, setScannedMember] = useState<User | null>(null);
  const [searchQr, setSearchQr] = useState('');

  const [quickCustomerName, setQuickCustomerName] = useState('');
  const [selectedCourtId, setSelectedCourtId] = useState('');
  const [selectedHour, setSelectedHour] = useState(18);

  const getClubId = (): string => {
    try {
      const stored = localStorage.getItem('sportshub_user');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.club_id || parsed.clubId) return parsed.club_id || parsed.clubId;
      }
    } catch {
      // ignore
    }
    return '11111111-1111-1111-1111-111111111111';
  };

  const loadAll = async () => {
    setIsLoading(true);
    const clubId = getClubId();
    try {
      const [courtsData, usersData, bookingsData, productsData] = await Promise.all([
        api.getCourts(clubId).catch(() => []),
        api.getUsers(clubId).catch(() => []),
        api.getBookings(clubId).catch(() => []),
        api.getProducts(clubId).catch(() => []),
      ]);
      setCourts(courtsData);
      setUsers(usersData);
      setBookingsList(bookingsData);
      setProducts(productsData);
      if (courtsData.length > 0 && !selectedCourtId) {
        setSelectedCourtId(courtsData[0].id);
      }
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const handleScanMember = (qrInput: string) => {
    if (!qrInput.trim()) return;
    const q = qrInput.toLowerCase();
    const found = users.find(
      (m) =>
        (m.qr_code && m.qr_code.toLowerCase().includes(q)) ||
        (m.phone && m.phone.includes(qrInput)) ||
        (m.full_name && m.full_name.toLowerCase().includes(q)) ||
        (m.email && m.email.toLowerCase().includes(q))
    );
    if (found) {
      setScannedMember(found);
    } else {
      setScannedMember(null);
    }
  };

  const handleCreateQuickBooking = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickCustomerName) return;

    const clubId = getClubId();
    const courtObj = courts.find((c) => c.id === selectedCourtId);
    const basePrice = courtObj ? Number(courtObj.base_price) : 600;

    const newBooking: Booking = {
      id: `bk-${Date.now()}`,
      club_id: clubId,
      court_id: selectedCourtId || (courts[0]?.id ?? 'court-1'),
      court_name: courtObj ? courtObj.name : 'Court 1',
      user_name: quickCustomerName,
      date: new Date().toISOString().split('T')[0],
      start_hour: selectedHour,
      end_hour: selectedHour + 1,
      price: basePrice,
      original_price: basePrice,
      status: 'CONFIRMED',
      is_dynamic_price: false,
      payment_status: 'PAID',
      payment_mode: 'CASH',
    };

    setBookingsList([newBooking, ...bookingsList]);
    setQuickCustomerName('');
    setActiveTab('grid');
  };

  const isSlotBooked = (courtId: string, hour: number) => {
    return bookingsList.some((b) => b.court_id === courtId && b.start_hour === hour);
  };

  const gearProducts = products.filter(
    (p) => p.category?.toLowerCase() === 'racket' || p.category?.toLowerCase() === 'gear'
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-[#006c49] uppercase tracking-wider mb-1">
            <Monitor className="w-4 h-4" /> Front Desk Reception Terminal
          </div>
          <h1 className="text-2xl font-bold text-[#0b1c30] tracking-tight">
            Reception &amp; Walk-in Desk
          </h1>
          <p className="text-sm text-slate-500">
            Real-time court availability, instant walk-in reservations, and member check-in verification.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {[
            { id: 'grid', label: 'Court Availability Grid', icon: Calendar },
            { id: 'qr_lookup', label: 'Member Scanner', icon: QrCode },
            { id: 'quick_book', label: 'Quick Walk-in', icon: PlusCircle },
            { id: 'counter_pos', label: 'Counter Sale', icon: ShoppingBag },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                  active
                    ? 'bg-[#006c49] text-white shadow-sm font-semibold'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16 text-slate-400 gap-2">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-sm">Loading reception desk...</span>
        </div>
      ) : (
        <>
          {activeTab === 'grid' && (
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <h2 className="text-base font-bold text-[#0b1c30] flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-[#006c49]" /> Today&apos;s Court Schedule
                </h2>
                <div className="flex items-center gap-4 text-xs">
                  <span className="flex items-center gap-1.5 text-slate-600">
                    <span className="w-3 h-3 rounded bg-emerald-100 border border-emerald-400"></span> Available
                  </span>
                  <span className="flex items-center gap-1.5 text-slate-600">
                    <span className="w-3 h-3 rounded bg-rose-100 border border-rose-300"></span> Booked
                  </span>
                  <button
                    onClick={loadAll}
                    className="p-1 hover:bg-slate-100 rounded text-slate-500"
                    title="Refresh Schedule"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {courts.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-xs">
                  No courts configured for this club. Setup courts in Onboarding or Settings.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-center border-collapse">
                    <thead>
                      <tr className="text-slate-600 border-b border-slate-200 bg-slate-50">
                        <th className="py-2.5 px-3 text-left font-semibold">Court Name / Sport</th>
                        {[14, 15, 16, 17, 18, 19, 20, 21].map((h) => (
                          <th key={h} className="py-2.5 px-2 font-mono text-[11px] font-semibold">
                            {h}:00
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {courts.map((court) => (
                        <tr key={court.id} className="hover:bg-slate-50 transition-colors">
                          <td className="py-3 px-3 text-left font-semibold text-[#0b1c30]">
                            {court.name}
                            <div className="text-[11px] text-slate-500 font-normal">
                              {court.sport} • Base ₹{court.base_price}
                            </div>
                          </td>
                          {[14, 15, 16, 17, 18, 19, 20, 21].map((hour) => {
                            const booked = isSlotBooked(court.id, hour);
                            return (
                              <td key={hour} className="p-1">
                                <button
                                  onClick={() => {
                                    if (booked) return;
                                    setSelectedCourtId(court.id);
                                    setSelectedHour(hour);
                                    setActiveTab('quick_book');
                                  }}
                                  className={`w-full py-2.5 rounded-lg text-[11px] font-semibold transition-all ${
                                    booked
                                      ? 'bg-rose-50 border border-rose-200 text-rose-700 cursor-not-allowed'
                                      : 'bg-emerald-50 border border-emerald-200 text-emerald-800 hover:bg-[#006c49] hover:text-white cursor-pointer'
                                  }`}
                                >
                                  {booked ? 'Booked' : `₹${court.base_price}`}
                                </button>
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeTab === 'qr_lookup' && (
            <div className="max-w-2xl mx-auto bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-6">
              <h2 className="text-base font-bold text-[#0b1c30] border-b border-slate-200 pb-3 flex items-center gap-2">
                <QrCode className="w-5 h-5 text-[#006c49]" /> Member QR Verification Scanner
              </h2>

              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Scan QR Code or enter member phone / name / email..."
                  value={searchQr}
                  onChange={(e) => setSearchQr(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleScanMember(searchQr)}
                  className="flex-1 bg-white border border-slate-300 rounded-xl p-3 text-sm text-[#0b1c30] focus:border-[#006c49] focus:ring-1 focus:ring-[#006c49] outline-none"
                />
                <button
                  onClick={() => handleScanMember(searchQr)}
                  className="px-5 py-3 bg-[#006c49] hover:bg-[#005237] text-white font-semibold rounded-xl text-xs transition-colors shadow-sm cursor-pointer"
                >
                  Verify Member
                </button>
              </div>

              {scannedMember ? (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                    <div>
                      <div className="text-lg font-bold text-[#0b1c30]">{scannedMember.full_name}</div>
                      <div className="text-xs text-slate-500">
                        {scannedMember.phone || 'No phone'} • {scannedMember.email}
                      </div>
                    </div>

                    <div
                      className={`px-3 py-1 rounded-full text-xs font-semibold uppercase ${
                        scannedMember.tier === 'GOLD'
                          ? 'bg-amber-100 text-amber-800 border border-amber-300'
                          : scannedMember.tier === 'SILVER'
                          ? 'bg-slate-200 text-slate-700 border border-slate-300'
                          : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      }`}
                    >
                      {scannedMember.tier || 'ACTIVE'} MEMBER
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-xs">
                      <div className="text-slate-500 text-[11px]">Expiry Date</div>
                      <div className="font-bold text-[#0b1c30] mt-0.5">
                        {scannedMember.expiry_date || 'N/A'}
                      </div>
                    </div>

                    <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-xs">
                      <div className="text-slate-500 text-[11px]">Grace Bonus</div>
                      <div className="font-bold text-emerald-700 mt-0.5">
                        +{scannedMember.grace_days_remaining || 0} Days
                      </div>
                    </div>

                    <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-xs">
                      <div className="text-slate-500 text-[11px]">Pay-Later Dues</div>
                      <div className="font-bold text-rose-600 mt-0.5">
                        ₹{scannedMember.current_pay_later_balance || 0}
                      </div>
                    </div>

                    <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-xs">
                      <div className="text-slate-500 text-[11px]">Points Balance</div>
                      <div className="font-bold text-purple-700 mt-0.5">
                        {scannedMember.points_balance || 0} pts
                      </div>
                    </div>
                  </div>
                </div>
              ) : searchQr.trim() ? (
                <div className="text-center py-8 text-xs text-rose-500">
                  No member found matching &ldquo;{searchQr}&rdquo;.
                </div>
              ) : (
                <div className="text-center py-8 text-xs text-slate-500">
                  Scan or search above to verify active member credentials.
                </div>
              )}
            </div>
          )}

          {activeTab === 'quick_book' && (
            <div className="max-w-xl mx-auto bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-5">
              <h2 className="text-base font-bold text-[#0b1c30] border-b border-slate-200 pb-3 flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-[#006c49]" /> Assisted Walk-in Court Booking
              </h2>

              <form onSubmit={handleCreateQuickBooking} className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Customer Name</label>
                  <input
                    type="text"
                    required
                    placeholder="Walk-in Customer Name"
                    value={quickCustomerName}
                    onChange={(e) => setQuickCustomerName(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-sm text-[#0b1c30] focus:border-[#006c49] focus:ring-1 focus:ring-[#006c49] outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Select Court</label>
                  <select
                    value={selectedCourtId}
                    onChange={(e) => setSelectedCourtId(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-sm text-[#0b1c30] focus:border-[#006c49] focus:ring-1 focus:ring-[#006c49] outline-none text-xs"
                  >
                    {courts.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} (Base ₹{c.base_price})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Select Time Slot</label>
                  <select
                    value={selectedHour}
                    onChange={(e) => setSelectedHour(Number(e.target.value))}
                    className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-sm text-[#0b1c30] focus:border-[#006c49] focus:ring-1 focus:ring-[#006c49] outline-none text-xs"
                  >
                    {[14, 15, 16, 17, 18, 19, 20, 21].map((h) => (
                      <option key={h} value={h}>
                        {h}:00 - {h + 1}:00
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-[#006c49] hover:bg-[#005237] text-white font-semibold rounded-xl text-xs shadow-sm transition-colors cursor-pointer"
                >
                  Confirm Walk-in Booking
                </button>
              </form>
            </div>
          )}

          {activeTab === 'counter_pos' && (
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
              <h2 className="text-base font-bold text-[#0b1c30] border-b border-slate-200 pb-3 flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-[#006c49]" /> Front Desk Gear &amp; Racket Rental POS
              </h2>

              {gearProducts.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-400">
                  No racket or gear inventory found on file.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {gearProducts.map((prod) => (
                    <div
                      key={prod.id}
                      className="bg-slate-50 border border-slate-200 p-4 rounded-xl flex items-center justify-between"
                    >
                      <div>
                        <div className="font-semibold text-[#0b1c30] text-sm">{prod.name}</div>
                        <div className="text-xs text-slate-500">Stock: {prod.stock} units</div>
                        <div className="text-sm font-bold text-[#006c49] mt-1">₹{prod.price}</div>
                      </div>

                      <button className="px-3.5 py-1.5 bg-[#006c49] hover:bg-[#005237] text-white text-xs font-semibold rounded-xl transition-colors shadow-xs cursor-pointer">
                        Sell / Rent
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
