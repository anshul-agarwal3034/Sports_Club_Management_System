import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Users,
  Trophy,
  Plus,
  Calendar,
  Clock,
  MapPin,
  CheckCircle2,
  XCircle,
  AlertCircle,
  DollarSign,
  ShieldCheck,
  UserCheck,
  Search,
  Filter
} from 'lucide-react';
import { api } from '@/services/api';
import { MatchLobby, MatchParticipant } from '@/types';
import { getStoredUser } from '@/lib/roles';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';

export default function MatchmakingPage() {
  const navigate = useNavigate();
  const user = getStoredUser();
  const [showAuthModal, setShowAuthModal] = useState(!user);
  const [lobbies, setLobbies] = useState<MatchLobby[]>([]);
  const [selectedSport, setSelectedSport] = useState<string>('all');
  const [selectedGameType, setSelectedGameType] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);

  // Active lobby modal & details
  const [activeLobbyId, setActiveLobbyId] = useState<string | null>(null);
  const [activeDetails, setActiveDetails] = useState<{
    lobby: MatchLobby;
    participants: MatchParticipant[];
    courtReservationStatus: string;
    courtReservationNotice: string;
    openSpots: number;
  } | null>(null);

  // Create Lobby Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({
    clubId: '11111111-1111-1111-1111-111111111111',
    sportType: 'Padel',
    gameType: 'CASUAL' as 'CASUAL' | 'COMPETITIVE' | 'TOURNAMENT_PRACTICE',
    startTime: '',
    endTime: '',
    totalCapacity: 4,
    paymentModel: 'AUTO_SPLIT' as 'HOST_PAID_SPONSORED' | 'HOST_PAID_REIMBURSED' | 'AUTO_SPLIT',
  });

  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchLobbies = async () => {
    setIsLoading(true);
    try {
      const filters: any = {};
      if (selectedSport !== 'all') filters.sportType = selectedSport;
      if (selectedGameType !== 'all') filters.gameType = selectedGameType;
      const data = await api.getMatchLobbies(filters);
      setLobbies(data || []);
    } catch {
      // Fallback sample data if backend not reachable
      setLobbies([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLobbies();
  }, [selectedSport, selectedGameType]);

  const openLobbyDetails = async (id: string) => {
    setActiveLobbyId(id);
    try {
      const data = await api.getMatchLobbyDetails(id);
      setActiveDetails(data);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.error || 'Failed to load match details' });
    }
  };

  const handleJoinRequest = async (lobbyId: string) => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    try {
      const res = await api.requestToJoinMatch(lobbyId);
      setMessage({ type: 'success', text: res.message || 'Join request sent to the host!' });
      openLobbyDetails(lobbyId);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.error || 'Join request failed.' });
    }
  };

  const handleReviewParticipant = async (lobbyId: string, participantUserId: string, action: 'APPROVE' | 'REJECT') => {
    try {
      const res = await api.reviewMatchParticipant(lobbyId, participantUserId, action);
      setMessage({ type: 'success', text: res.message || `Participant ${action.toLowerCase()}d!` });
      openLobbyDetails(lobbyId);
      fetchLobbies();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.error || 'Review action failed.' });
    }
  };

  const handlePayShare = async (lobbyId: string) => {
    try {
      const res = await api.payMatchShare(lobbyId, 'UPI');
      setMessage({ type: 'success', text: res.message || 'Share payment completed!' });
      openLobbyDetails(lobbyId);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.error || 'Payment failed.' });
    }
  };

  const handleCancelLobby = async (lobbyId: string) => {
    if (!confirm('Are you sure you want to cancel this match? Any paid players will be automatically refunded.')) {
      return;
    }
    try {
      const res = await api.cancelMatchLobby(lobbyId, 'Cancelled by host');
      setMessage({ type: 'success', text: res.message });
      setActiveLobbyId(null);
      fetchLobbies();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.error || 'Cancellation failed.' });
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setMessage({ type: 'error', text: 'Please log in to host a match.' });
      return;
    }
    try {
      const res = await api.createMatchLobby(createForm);
      setMessage({ type: 'success', text: res.message || 'Match lobby created!' });
      setShowCreateModal(false);
      fetchLobbies();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.error || 'Failed to create lobby.' });
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f9ff] py-10 selection:bg-[#006c49] selection:text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <Badge variant="emerald" icon={<Users className="w-3.5 h-3.5" />}>
              Community Matchmaking
            </Badge>
            <h1 className="text-3xl font-extrabold text-[#0b1c30] tracking-tight">
              Find Playing Partners &amp; Open Matches
            </h1>
            <p className="text-sm text-slate-600 max-w-2xl">
              Never miss a game because you&apos;re short on players. Join open lobbies, get matched by skill level, and split court costs automatically.
            </p>
          </div>

          <Button
            variant="primary"
            onClick={() => {
              if (!user) {
                setShowAuthModal(true);
              } else {
                setShowCreateModal(true);
              }
            }}
            className="flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Host a Match</span>
          </Button>
        </div>

        {/* Global Message Banner */}
        {message && (
          <div className={`p-4 rounded-xl flex items-center gap-3 text-sm ${
            message.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200'
          }`}>
            {message.type === 'success' ? <CheckCircle2 className="w-5 h-5 flex-shrink-0" /> : <AlertCircle className="w-5 h-5 flex-shrink-0" />}
            <span className="font-medium">{message.text}</span>
            <button className="ml-auto text-xs font-bold underline" onClick={() => setMessage(null)}>Dismiss</button>
          </div>
        )}

        {/* Filters */}
        <Card padded="sm" className="bg-white shadow-xs border-slate-200">
          <div className="flex flex-wrap items-center justify-between gap-4 p-2">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-xs font-bold uppercase text-slate-500 tracking-wider">Sport:</span>
              {['all', 'Padel', 'Tennis', 'Badminton', 'Pickleball'].map((sport) => (
                <button
                  key={sport}
                  onClick={() => setSelectedSport(sport)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    selectedSport === sport
                      ? 'bg-[#006c49] text-white shadow-xs'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  {sport === 'all' ? 'All Sports' : sport}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs font-bold uppercase text-slate-500 tracking-wider">Style:</span>
              <select
                value={selectedGameType}
                onChange={(e) => setSelectedGameType(e.target.value)}
                className="bg-slate-100 border-none text-xs font-semibold rounded-lg px-3 py-1.5 text-slate-700 focus:ring-2 focus:ring-[#006c49]"
              >
                <option value="all">All Styles</option>
                <option value="CASUAL">Casual</option>
                <option value="COMPETITIVE">Competitive</option>
                <option value="TOURNAMENT_PRACTICE">Tournament Practice</option>
              </select>
            </div>
          </div>
        </Card>

        {/* Lobbies Grid */}
        {isLoading ? (
          <div className="py-20 text-center text-slate-400 font-medium">Loading open lobbies...</div>
        ) : lobbies.length === 0 ? (
          <div className="py-16 text-center bg-white rounded-2xl border border-slate-200 space-y-4">
            <Users className="w-12 h-12 text-slate-300 mx-auto" />
            <h3 className="text-lg font-bold text-[#0b1c30]">No Open Matches Right Now</h3>
            <p className="text-sm text-slate-500 max-w-md mx-auto">
              Be the first to create an open game! Host a match, invite partners, and set your skill preference.
            </p>
            <Button variant="primary" onClick={() => setShowCreateModal(true)}>
              Host the First Match
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {lobbies.map((lobby) => {
              const approved = lobby.approved_player_count ? parseInt(lobby.approved_player_count.toString(), 10) : 1;
              const openSeats = Math.max(0, lobby.total_capacity - approved);
              const isCourtBooked = !!lobby.court_id || !!lobby.booking_id;
              const startTime = new Date(lobby.match_start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
              const startDate = new Date(lobby.match_start_time).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });

              return (
                <Card key={lobby.id} padded="md" className="bg-white hover:border-[#006c49]/40 transition-all flex flex-col justify-between">
                  <div className="space-y-4">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <Badge variant="blue">{lobby.sport_type}</Badge>
                        <h3 className="font-bold text-base text-[#0b1c30] mt-1">{lobby.club_name}</h3>
                        <p className="text-xs text-slate-500 flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5" /> {lobby.city}
                        </p>
                      </div>

                      {isCourtBooked ? (
                        <Badge variant="emerald">Court Reserved</Badge>
                      ) : (
                        <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                          Court not booked
                        </span>
                      )}
                    </div>

                    <div className="space-y-2 text-xs text-slate-600 border-t border-slate-100 pt-3">
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-slate-400" /> {startDate}</span>
                        <span className="flex items-center gap-1.5 font-medium"><Clock className="w-3.5 h-3.5 text-slate-400" /> {startTime}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Host: <strong className="text-slate-800">{lobby.host_name}</strong></span>
                        <Badge variant="slate">{lobby.game_type}</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Skill Range:</span>
                        <strong className="text-slate-800">{lobby.min_skill_level} - {lobby.max_skill_level}</strong>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Payment Model:</span>
                        <strong className="text-slate-800">
                          {lobby.payment_model === 'AUTO_SPLIT' ? `Auto-Split (₹${lobby.cost_per_player}/player)` : 'Host Sponsored'}
                        </strong>
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-slate-100 pt-4 mt-4 flex items-center justify-between">
                    <div>
                      <span className="text-xs text-slate-400 block">Spots Available</span>
                      <span className="text-sm font-bold text-[#006c49]">
                        {openSeats} of {lobby.total_capacity} spots open
                      </span>
                    </div>

                    <Button
                      size="sm"
                      variant={openSeats > 0 ? 'primary' : 'outline'}
                      disabled={openSeats === 0}
                      onClick={() => openLobbyDetails(lobby.id)}
                    >
                      {openSeats > 0 ? 'View & Join' : 'Full Match'}
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {/* Lobby Details & Management Modal */}
        {activeLobbyId && activeDetails && (
          <Modal
            isOpen={true}
            onClose={() => setActiveLobbyId(null)}
            title={`${activeDetails.lobby.sport_type} Match Lobby`}
            maxWidth="xl"
          >
            <div className="space-y-6">
              {/* Notice */}
              <div className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                activeDetails.courtReservationStatus === 'CONFIRMED'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-amber-50 text-amber-800 border border-amber-200'
              }`}>
                {activeDetails.courtReservationStatus === 'CONFIRMED' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                )}
                <span>{activeDetails.courtReservationNotice}</span>
              </div>

              {/* Match Summary */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl text-xs">
                <div>
                  <span className="text-slate-400 block">Sport &amp; Style</span>
                  <strong className="text-[#0b1c30]">{activeDetails.lobby.sport_type} ({activeDetails.lobby.game_type})</strong>
                </div>
                <div>
                  <span className="text-slate-400 block">Date &amp; Time</span>
                  <strong className="text-[#0b1c30]">
                    {new Date(activeDetails.lobby.match_start_time).toLocaleDateString([], { month: 'short', day: 'numeric' })}{' '}
                    {new Date(activeDetails.lobby.match_start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </strong>
                </div>
                <div>
                  <span className="text-slate-400 block">Share per Player</span>
                  <strong className="text-[#0b1c30]">
                    {activeDetails.lobby.payment_model === 'AUTO_SPLIT' ? `₹${activeDetails.lobby.cost_per_player}` : 'Free (Host Paid)'}
                  </strong>
                </div>
                <div>
                  <span className="text-slate-400 block">Open Spots</span>
                  <strong className="text-[#006c49] font-bold">{activeDetails.openSpots} remaining</strong>
                </div>
              </div>

              {/* Participants Roster */}
              <div className="space-y-3">
                <h4 className="text-sm font-bold text-[#0b1c30]">Players &amp; Roster</h4>
                <div className="space-y-2">
                  {activeDetails.participants.map((p) => {
                    const isCurrentUser = user && user.id === p.user_id;
                    const isHostViewing = user && user.id === activeDetails.lobby.host_user_id;

                    return (
                      <div
                        key={p.id}
                        className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-xl text-xs"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-700">
                            {p.full_name?.charAt(0) || 'P'}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-800">{p.full_name}</span>
                              {p.is_host && <Badge variant="emerald">Host</Badge>}
                              <span className="text-slate-400">
                                {p.is_verified ? `★ Verified ${p.verified_rating}` : `Rating: ${p.self_rating || 2.5} (Self)`}
                              </span>
                            </div>
                            <span className="text-[11px] text-slate-400">
                              Matches played: {p.matches_played || 0} | Status: {p.approval_status}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {/* Payment status badge */}
                          {p.payment_status === 'PAID' && (
                            <Badge variant="emerald">Paid</Badge>
                          )}
                          {p.payment_status === 'PENDING_PAYMENT' && (
                            <Badge variant="amber">Payment Due</Badge>
                          )}

                          {/* Host review controls for PENDING_APPROVAL */}
                          {isHostViewing && p.approval_status === 'PENDING_APPROVAL' && (
                            <div className="flex items-center gap-1.5">
                              <Button
                                size="sm"
                                variant="primary"
                                onClick={() => handleReviewParticipant(activeDetails.lobby.id, p.user_id, 'APPROVE')}
                              >
                                Accept
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleReviewParticipant(activeDetails.lobby.id, p.user_id, 'REJECT')}
                              >
                                Decline
                              </Button>
                            </div>
                          )}

                          {/* Participant Pay button */}
                          {isCurrentUser && p.payment_status === 'PENDING_PAYMENT' && (
                            <Button
                              size="sm"
                              variant="primary"
                              onClick={() => handlePayShare(activeDetails.lobby.id)}
                            >
                              Pay ₹{p.share_amount}
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="border-t border-slate-200 pt-4 flex items-center justify-between">
                {user && user.id === activeDetails.lobby.host_user_id ? (
                  <Button
                    variant="outline"
                    className="text-red-600 border-red-200 hover:bg-red-50"
                    onClick={() => handleCancelLobby(activeDetails.lobby.id)}
                  >
                    Cancel Match &amp; Refund Players
                  </Button>
                ) : (
                  <div>
                    {activeDetails.participants.some((p) => p.user_id === user?.id) ? (
                      <span className="text-xs font-semibold text-emerald-700">
                        ✓ You are registered in this match
                      </span>
                    ) : (
                      <Button
                        variant="primary"
                        disabled={activeDetails.openSpots === 0}
                        onClick={() => handleJoinRequest(activeDetails.lobby.id)}
                      >
                        Request to Join Match
                      </Button>
                    )}
                  </div>
                )}

                <Button variant="ghost" onClick={() => setActiveLobbyId(null)}>
                  Close
                </Button>
              </div>
            </div>
          </Modal>
        )}

        {/* Create Lobby Modal */}
        {showCreateModal && (
          <Modal
            isOpen={true}
            onClose={() => setShowCreateModal(false)}
            title="Host an Open Match"
            maxWidth="lg"
          >
            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Sport</label>
                <select
                  value={createForm.sportType}
                  onChange={(e) => setCreateForm({ ...createForm, sportType: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800"
                >
                  <option value="Padel">Padel</option>
                  <option value="Tennis">Tennis</option>
                  <option value="Badminton">Badminton</option>
                  <option value="Pickleball">Pickleball</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Game Style</label>
                  <select
                    value={createForm.gameType}
                    onChange={(e) => setCreateForm({ ...createForm, gameType: e.target.value as any })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800"
                  >
                    <option value="CASUAL">Casual</option>
                    <option value="COMPETITIVE">Competitive</option>
                    <option value="TOURNAMENT_PRACTICE">Tournament Practice</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Total Players (inc. you)</label>
                  <input
                    type="number"
                    min={2}
                    max={10}
                    value={createForm.totalCapacity}
                    onChange={(e) => setCreateForm({ ...createForm, totalCapacity: parseInt(e.target.value, 10) || 4 })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Start Time</label>
                  <input
                    type="datetime-local"
                    required
                    value={createForm.startTime}
                    onChange={(e) => setCreateForm({ ...createForm, startTime: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">End Time</label>
                  <input
                    type="datetime-local"
                    required
                    value={createForm.endTime}
                    onChange={(e) => setCreateForm({ ...createForm, endTime: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Payment Model</label>
                <select
                  value={createForm.paymentModel}
                  onChange={(e) => setCreateForm({ ...createForm, paymentModel: e.target.value as any })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800"
                >
                  <option value="AUTO_SPLIT">Auto-Split (Players contribute their share)</option>
                  <option value="HOST_PAID_SPONSORED">Host Sponsored (You pay, players play free)</option>
                  <option value="HOST_PAID_REIMBURSED">Host Paid (You pay court, settle directly)</option>
                </select>
              </div>

              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800">
                Notice: Creating this lobby lists your match for player discovery. A court reservation is created separately or attached to your existing booking.
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <Button type="button" variant="ghost" onClick={() => setShowCreateModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary">
                  Publish Match Lobby
                </Button>
              </div>
            </form>
          </Modal>
        )}

        {/* Auth Modal for Unauthenticated Users */}
        <Modal
          isOpen={showAuthModal && !user}
          onClose={() => setShowAuthModal(false)}
          title="Account Required for Matchmaking"
        >
          <div className="space-y-4 py-2 text-center">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-[#006c49]">
              <Users className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-[#0b1c30]">
                Sign In to Join or Host Lobbies
              </h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto leading-relaxed">
                Matchmaking connects real players at verified sports clubs. Please sign in or create an account to view open lobbies, request player slots, and split court fees.
              </p>
            </div>

            <div className="space-y-2 pt-2">
              <Button
                variant="primary"
                size="md"
                onClick={() => {
                  setShowAuthModal(false);
                  navigate('/login?redirect=/matchmaking');
                }}
                className="w-full cursor-pointer text-xs font-bold"
              >
                Sign In to Your Account
              </Button>

              <Button
                variant="outline"
                size="md"
                onClick={() => {
                  setShowAuthModal(false);
                  navigate('/register?redirect=/matchmaking');
                }}
                className="w-full cursor-pointer text-xs font-bold border-slate-300"
              >
                Register New Player Account
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </div>
  );
}
