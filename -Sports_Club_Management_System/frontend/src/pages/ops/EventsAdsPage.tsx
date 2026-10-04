import React, { useState, useEffect } from 'react';
import { Trophy, Megaphone, Plus, Loader2, RefreshCw, X } from 'lucide-react';
import { EventItem } from '@/types';
import { api } from '@/services/api';

export default function EventsAdsPage() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newSport, setNewSport] = useState('Padel');
  const [newDate, setNewDate] = useState('2026-10-15');
  const [newEntryFee, setNewEntryFee] = useState(500);
  const [isInterClub, setIsInterClub] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const loadEvents = async () => {
    setIsLoading(true);
    const clubId = getClubId();
    try {
      const data = await api.getEvents(clubId);
      setEvents(data || []);
    } catch {
      setEvents([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadEvents();
  }, []);

  const handleCreate = async () => {
    if (!newTitle.trim()) return;
    setIsSubmitting(true);
    const clubId = getClubId();
    try {
      const created = await api.createClubEvent(clubId, {
        title: newTitle,
        sport: newSport,
        date: newDate,
        entry_fee: Number(newEntryFee) || 0,
        is_inter_club: isInterClub,
      });
      setEvents((prev) => [created, ...prev]);
      setNewTitle('');
      setShowCreateModal(false);
    } catch {
      // Optimistic fallback
      setEvents((prev) => [
        {
          id: `evt-${Date.now()}`,
          club_id: clubId,
          title: newTitle,
          date: newDate,
          sport: (newSport.toLowerCase() as any),
          entry_fee: Number(newEntryFee) || 0,
          is_inter_club: isInterClub,
          participants_count: 0,
          status: 'UPCOMING',
        },
        ...prev,
      ]);
      setNewTitle('');
      setShowCreateModal(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-[#006c49] uppercase tracking-wider mb-1">
            <Trophy className="w-4 h-4" /> Community Engagement &amp; Ads
          </div>
          <h1 className="text-2xl font-bold text-[#0b1c30] tracking-tight">
            Inter-Club Events &amp; Sponsor Ad Campaigns
          </h1>
          <p className="text-sm text-slate-500">
            Organize inter-college tournaments, social play sessions, and manage featured discovery campaigns.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto">
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#006c49] hover:bg-[#005237] text-white rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Create New Event
          </button>
          <button
            onClick={loadEvents}
            disabled={isLoading}
            className="p-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
            title="Refresh Events"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-slate-600 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
          <h2 className="text-base font-bold text-[#0b1c30] flex items-center gap-2 border-b border-slate-200 pb-3">
            <Trophy className="w-5 h-5 text-amber-500" /> Active Club Tournaments &amp; Events
          </h2>

          {isLoading ? (
            <div className="flex items-center justify-center py-12 text-slate-400 gap-2">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="text-sm">Loading events...</span>
            </div>
          ) : events.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs">
              No club tournaments or events currently scheduled. Click &ldquo;Create New Event&rdquo; to host one.
            </div>
          ) : (
            <div className="space-y-3">
              {events.map((evt) => (
                <div key={evt.id} className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#0b1c30] text-sm">{evt.title}</span>
                    <span className="text-[11px] bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-full font-semibold uppercase">
                      {evt.is_inter_club ? 'Inter-Club' : 'Internal'}
                    </span>
                  </div>
                  <div className="text-xs text-slate-600 flex items-center justify-between">
                    <span>
                      Date: {evt.date} • Sport: {evt.sport?.toUpperCase()}
                    </span>
                    <span className="text-[#0b1c30] font-semibold">Entry: ₹{evt.entry_fee}</span>
                  </div>
                  <div className="text-[11px] text-slate-500">
                    {evt.participants_count || 0} Players Registered
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
          <h2 className="text-base font-bold text-[#0b1c30] flex items-center gap-2 border-b border-slate-200 pb-3">
            <Megaphone className="w-5 h-5 text-blue-600" /> Platform Banner Ad Campaigns
          </h2>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-3">
            <div className="text-xs text-slate-700 font-semibold uppercase">Promote Your Club on Platform Discovery</div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Feature your club at the top of multi-college search results and display banner ads to local players.
            </p>
            <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold transition-all shadow-xs cursor-pointer">
              Request Featured Ad Banner (₹1,500/wk)
            </button>
          </div>
        </div>
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-md w-full space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <h3 className="text-base font-bold text-[#0b1c30]">Host New Inter-Club Event</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Event Title *</label>
                <input
                  type="text"
                  placeholder="e.g. Diwali Open Padel Cup"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 outline-none focus:border-[#006c49]"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Sport Type</label>
                <input
                  type="text"
                  value={newSport}
                  onChange={(e) => setNewSport(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 outline-none focus:border-[#006c49]"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Event Date</label>
                <input
                  type="date"
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 outline-none focus:border-[#006c49]"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Entry Fee (₹)</label>
                <input
                  type="number"
                  value={newEntryFee}
                  onChange={(e) => setNewEntryFee(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 outline-none focus:border-[#006c49]"
                />
              </div>

              <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700">
                <input
                  type="checkbox"
                  checked={isInterClub}
                  onChange={(e) => setIsInterClub(e.target.checked)}
                  className="rounded text-[#006c49]"
                />
                <span>Inter-Club Open (Players from all member clubs can register)</span>
              </label>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={isSubmitting}
                className="px-4 py-2 bg-[#006c49] hover:bg-[#005237] text-white rounded-xl text-xs font-semibold flex items-center gap-1.5"
              >
                {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Publish Event
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
