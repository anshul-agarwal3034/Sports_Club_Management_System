import React, { useState, useEffect } from 'react';
import { Kanban, Phone, Mail, ArrowRight, UserCheck, Loader2, RefreshCw, Plus, X } from 'lucide-react';
import { Lead } from '@/types';
import { api } from '@/services/api';

export default function CrmPipeline() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newLeadName, setNewLeadName] = useState('');
  const [newLeadPhone, setNewLeadPhone] = useState('');
  const [newLeadEmail, setNewLeadEmail] = useState('');
  const [newLeadNotes, setNewLeadNotes] = useState('');
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

  const loadLeads = async () => {
    setIsLoading(true);
    const clubId = getClubId();
    try {
      const data = await api.getLeads(clubId);
      setLeads(data || []);
    } catch {
      setLeads([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadLeads();
  }, []);

  const columns: { id: Lead['status']; title: string; color: string }[] = [
    { id: 'NEW', title: 'New Enquiries', color: 'border-amber-400' },
    { id: 'TRIAL_SCHEDULED', title: 'Trial Scheduled', color: 'border-blue-500' },
    { id: 'QUOTED', title: 'Quote Sent', color: 'border-purple-500' },
    { id: 'CONVERTED', title: 'Converted Members', color: 'border-emerald-600' },
  ];

  const moveLead = async (leadId: string, nextStatus: Lead['status']) => {
    const clubId = getClubId();
    // Optimistic update
    setLeads((prev) =>
      prev.map((l) => (l.id === leadId ? { ...l, status: nextStatus } : l))
    );
    try {
      await api.updateClubLead(clubId, leadId, { status: nextStatus });
    } catch {
      // ignore or rollback
    }
  };

  const handleAddLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLeadName.trim()) return;
    setIsSubmitting(true);
    const clubId = getClubId();
    try {
      const created = await api.createClubLead(clubId, {
        customer_name: newLeadName,
        phone: newLeadPhone,
        email: newLeadEmail,
        notes: newLeadNotes,
      });
      setLeads((prev) => [created, ...prev]);
      setShowAddModal(false);
      setNewLeadName('');
      setNewLeadPhone('');
      setNewLeadEmail('');
      setNewLeadNotes('');
    } catch (err: any) {
      alert(err.message || 'Failed to create lead');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-[#006c49] uppercase tracking-wider mb-1">
            <Kanban className="w-4 h-4" /> Lead &amp; Enquiry CRM Pipeline
          </div>
          <h1 className="text-2xl font-bold text-[#0b1c30] tracking-tight">
            Player &amp; Corporate Lead Board
          </h1>
          <p className="text-sm text-slate-500">
            Convert website trial bookings and corporate enquiries into active Gold/Silver members.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-[#006c49] hover:bg-[#005237] text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" /> Add New Lead
          </button>
          <button
            onClick={loadLeads}
            disabled={isLoading}
            className="p-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
            title="Refresh CRM"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-slate-600 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16 text-slate-400 gap-2">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-sm">Loading CRM pipeline...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {columns.map((col) => {
            const colLeads = leads.filter((l) => l.status === col.id);
            return (
              <div key={col.id} className={`bg-white border-t-4 ${col.color} border-x border-b border-slate-200 rounded-xl p-4 space-y-3 shadow-xs`}>
                <div className="flex items-center justify-between font-bold text-[#0b1c30] text-xs border-b border-slate-100 pb-2 uppercase tracking-wide">
                  <span>{col.title}</span>
                  <span className="bg-slate-100 px-2 py-0.5 rounded text-[11px] text-slate-600 font-semibold">{colLeads.length}</span>
                </div>

                <div className="space-y-3">
                  {colLeads.length === 0 ? (
                    <div className="text-center py-8 text-[11px] text-slate-400">
                      No leads in this stage
                    </div>
                  ) : (
                    colLeads.map((lead) => (
                      <div key={lead.id} className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-2 text-xs">
                        <div className="font-bold text-[#0b1c30] text-sm">{lead.customer_name}</div>
                        {lead.phone && (
                          <div className="text-[11px] text-slate-600 flex items-center gap-1.5">
                            <Phone className="w-3 h-3 text-[#006c49]" /> {lead.phone}
                          </div>
                        )}
                        {lead.email && (
                          <div className="text-[11px] text-slate-600 flex items-center gap-1.5">
                            <Mail className="w-3 h-3 text-blue-600" /> {lead.email}
                          </div>
                        )}
                        {lead.notes && (
                          <p className="text-[11px] text-slate-700 italic bg-white p-2 rounded-lg border border-slate-200 mt-1">
                            &quot;{lead.notes}&quot;
                          </p>
                        )}

                        <div className="pt-2 flex justify-end gap-1">
                          {col.id === 'NEW' && (
                            <button
                              onClick={() => moveLead(lead.id, 'TRIAL_SCHEDULED')}
                              className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white text-[11px] rounded-lg font-medium flex items-center gap-1 transition-colors cursor-pointer"
                            >
                              Book Trial <ArrowRight className="w-3 h-3" />
                            </button>
                          )}
                          {col.id === 'TRIAL_SCHEDULED' && (
                            <button
                              onClick={() => moveLead(lead.id, 'QUOTED')}
                              className="px-2.5 py-1 bg-purple-600 hover:bg-purple-700 text-white text-[11px] rounded-lg font-medium flex items-center gap-1 transition-colors cursor-pointer"
                            >
                              Send Quote <ArrowRight className="w-3 h-3" />
                            </button>
                          )}
                          {col.id === 'QUOTED' && (
                            <button
                              onClick={() => moveLead(lead.id, 'CONVERTED')}
                              className="px-2.5 py-1 bg-[#006c49] hover:bg-[#005237] text-white text-[11px] rounded-lg font-semibold flex items-center gap-1 transition-colors shadow-2xs cursor-pointer"
                            >
                              Convert Member <UserCheck className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Lead Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-[#0b1c30] text-sm">Add New Lead</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddLead} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Customer Name *</label>
                <input
                  type="text"
                  required
                  value={newLeadName}
                  onChange={(e) => setNewLeadName(e.target.value)}
                  placeholder="Full Name"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-[#006c49]"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Phone Number</label>
                <input
                  type="tel"
                  value={newLeadPhone}
                  onChange={(e) => setNewLeadPhone(e.target.value)}
                  placeholder="Mobile number"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-[#006c49]"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Email</label>
                <input
                  type="email"
                  value={newLeadEmail}
                  onChange={(e) => setNewLeadEmail(e.target.value)}
                  placeholder="Email address"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-[#006c49]"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Enquiry Notes</label>
                <textarea
                  rows={3}
                  value={newLeadNotes}
                  onChange={(e) => setNewLeadNotes(e.target.value)}
                  placeholder="Interested in gold membership / trial slot..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-[#006c49]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-[#006c49] hover:bg-[#005237] text-white rounded-xl text-xs font-semibold flex items-center gap-1.5"
                >
                  {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Save Lead
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
