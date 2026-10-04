import axios from 'axios';
import {
  Club,
  Court,
  User,
  Booking,
  Product,
  Order,
  Lead,
  Employee,
  Transaction,
  Complaint,
  EventItem,
  WaitlistEntry,
  FlashDeal,
  MatchLobby,
  MatchParticipant,
  PeakRecommendation,
  AppNotification,
  ClubSetupStatus,
  Expense,
  FinancialOverview,
} from '../types';

const API_BASE_URL = '/api/v1';

const getAuthHeaders = () => {
  const token = localStorage.getItem('sportshub_token');
  return token ? { headers: { Authorization: `Bearer ${token}` } } : {};
};

export const api = {
  // Clubs
  getClubs: async (): Promise<Club[]> => {
    const res = await axios.get(`${API_BASE_URL}/clubs`);
    return res.data.data || res.data;
  },

  // Courts
  getCourts: async (clubId: string = 'club-1'): Promise<Court[]> => {
    const res = await axios.get(`${API_BASE_URL}/clubs/${clubId}/courts`);
    return res.data.data || res.data;
  },

  // Members / Users
  getUsers: async (clubId: string = 'club-1'): Promise<User[]> => {
    const res = await axios.get(`${API_BASE_URL}/clubs/${clubId}/users`, getAuthHeaders());
    return res.data.data || res.data;
  },

  // Bookings
  getBookings: async (clubId: string = 'club-1'): Promise<Booking[]> => {
    const res = await axios.get(`${API_BASE_URL}/bookings/club/${clubId}`, getAuthHeaders());
    return res.data.data || res.data;
  },

  createBooking: async (bookingData: any): Promise<Booking> => {
    const res = await axios.post(`${API_BASE_URL}/bookings`, bookingData, getAuthHeaders());
    return res.data.data || res.data;
  },

  // Products / Inventory
  getProducts: async (clubId: string = 'club-1'): Promise<Product[]> => {
    const res = await axios.get(`${API_BASE_URL}/inventory/products/club/${clubId}`);
    return res.data.data || res.data;
  },

  restockProduct: async (productId: string, quantityToAdd: number = 10): Promise<Product> => {
    const res = await axios.patch(`${API_BASE_URL}/inventory/products/${productId}/restock`, { quantityToAdd }, getAuthHeaders());
    return res.data.data || res.data;
  },

  // Orders / KDS
  getOrders: async (clubId: string = 'club-1'): Promise<Order[]> => {
    const res = await axios.get(`${API_BASE_URL}/canteen/orders/club/${clubId}`, getAuthHeaders());
    return res.data.data || res.data;
  },

  createOrder: async (orderData: any): Promise<Order> => {
    const res = await axios.post(`${API_BASE_URL}/canteen/orders`, orderData, getAuthHeaders());
    return res.data.data || res.data;
  },

  updateOrderStatus: async (orderId: string, status: string): Promise<Order> => {
    const res = await axios.patch(`${API_BASE_URL}/canteen/orders/${orderId}/status`, { status }, getAuthHeaders());
    return res.data.data || res.data;
  },

  // Leads CRM
  getLeads: async (clubId: string = 'club-1'): Promise<Lead[]> => {
    const res = await axios.get(`${API_BASE_URL}/clubs/${clubId}/leads`, getAuthHeaders());
    return res.data.data || res.data;
  },

  createClubLead: async (clubId: string, leadData: any): Promise<Lead> => {
    const res = await axios.post(`${API_BASE_URL}/clubs/${clubId}/leads`, leadData, getAuthHeaders());
    return res.data.data || res.data;
  },

  updateClubLead: async (clubId: string, leadId: string, data: any): Promise<Lead> => {
    const res = await axios.patch(`${API_BASE_URL}/clubs/${clubId}/leads/${leadId}`, data, getAuthHeaders());
    return res.data.data || res.data;
  },

  // Employees & Staff
  getEmployees: async (clubId: string = 'club-1'): Promise<Employee[]> => {
    const res = await axios.get(`${API_BASE_URL}/clubs/${clubId}/employees`, getAuthHeaders());
    return res.data.data || res.data;
  },

  updateEmployeeStatus: async (clubId: string, employeeId: string, status: 'APPROVED' | 'REJECTED' | 'PENDING'): Promise<any> => {
    const res = await axios.put(`${API_BASE_URL}/clubs/${clubId}/employees/${employeeId}/status`, { status }, getAuthHeaders());
    return res.data.data || res.data;
  },

  // Transactions
  getTransactions: async (clubId: string = 'club-1'): Promise<Transaction[]> => {
    const res = await axios.get(`${API_BASE_URL}/clubs/${clubId}/transactions`, getAuthHeaders());
    return res.data.data || res.data;
  },

  // Complaints
  getComplaints: async (clubId: string = 'club-1'): Promise<Complaint[]> => {
    const res = await axios.get(`${API_BASE_URL}/clubs/${clubId}/complaints`, getAuthHeaders());
    return res.data.data || res.data;
  },

  createClubComplaint: async (clubId: string, complaintData: any): Promise<Complaint> => {
    const res = await axios.post(`${API_BASE_URL}/clubs/${clubId}/complaints`, complaintData, getAuthHeaders());
    return res.data.data || res.data;
  },

  // Events
  getEvents: async (clubId: string = 'club-1'): Promise<EventItem[]> => {
    const res = await axios.get(`${API_BASE_URL}/clubs/${clubId}/events`);
    return res.data.data || res.data;
  },

  createClubEvent: async (clubId: string, eventData: any): Promise<EventItem> => {
    const res = await axios.post(`${API_BASE_URL}/clubs/${clubId}/events`, eventData, getAuthHeaders());
    return res.data.data || res.data;
  },

  // Platform Admin
  getPendingClubs: async (): Promise<any[]> => {
    const res = await axios.get(`${API_BASE_URL}/clubs/admin/pending`, getAuthHeaders());
    return res.data.data || res.data;
  },

  verifyClub: async (clubId: string, action: 'APPROVE' | 'REJECT', rejectionReason?: string): Promise<any> => {
    const res = await axios.post(`${API_BASE_URL}/clubs/${clubId}/verify`, { action, rejectionReason }, getAuthHeaders());
    return res.data.data || res.data;
  },

  // 1. Waitlist & Authoritative Holds
  joinWaitlist: async (data: { clubId: string; courtId: string; startTime: string; endTime: string }): Promise<any> => {
    const res = await axios.post(`${API_BASE_URL}/waitlist/join`, data, getAuthHeaders());
    return res.data.data || res.data;
  },

  getMyWaitlist: async (): Promise<WaitlistEntry[]> => {
    const res = await axios.get(`${API_BASE_URL}/waitlist/my`, getAuthHeaders());
    return res.data.data || res.data;
  },

  leaveWaitlist: async (waitlistId: string): Promise<any> => {
    const res = await axios.post(`${API_BASE_URL}/waitlist/${waitlistId}/leave`, {}, getAuthHeaders());
    return res.data.data || res.data;
  },

  acceptWaitlistOffer: async (waitlistId: string, paymentMode: string = 'UPI'): Promise<any> => {
    const res = await axios.post(`${API_BASE_URL}/waitlist/${waitlistId}/accept`, { paymentMode }, getAuthHeaders());
    return res.data.data || res.data;
  },

  declineWaitlistOffer: async (waitlistId: string): Promise<any> => {
    const res = await axios.post(`${API_BASE_URL}/waitlist/${waitlistId}/decline`, {}, getAuthHeaders());
    return res.data.data || res.data;
  },

  // 2. Last-Minute Flash Deals
  getFlashDeals: async (clubId?: string): Promise<FlashDeal[]> => {
    const url = clubId ? `${API_BASE_URL}/flash-deals/available?clubId=${clubId}` : `${API_BASE_URL}/flash-deals/available`;
    const res = await axios.get(url, getAuthHeaders());
    return res.data.data || res.data;
  },

  bookFlashDeal: async (data: { courtId: string; startTime: string; endTime: string; paymentMode?: string }): Promise<any> => {
    const res = await axios.post(`${API_BASE_URL}/flash-deals/book`, data, getAuthHeaders());
    return res.data.data || res.data;
  },

  configureFlashDeals: async (clubId: string, config: any): Promise<any> => {
    const res = await axios.post(`${API_BASE_URL}/flash-deals/config/${clubId}`, config, getAuthHeaders());
    return res.data.data || res.data;
  },

  // 3. Matchmaking / Find Playing Partners
  getMatchLobbies: async (filters: any = {}): Promise<MatchLobby[]> => {
    const params = new URLSearchParams(filters).toString();
    const res = await axios.get(`${API_BASE_URL}/matchmaking/lobbies?${params}`);
    return res.data.data || res.data;
  },

  getMatchLobbyDetails: async (id: string): Promise<{ lobby: MatchLobby; participants: MatchParticipant[]; courtReservationStatus: string; courtReservationNotice: string; openSpots: number }> => {
    const res = await axios.get(`${API_BASE_URL}/matchmaking/lobbies/${id}`);
    return res.data.data || res.data;
  },

  createMatchLobby: async (data: any): Promise<any> => {
    const res = await axios.post(`${API_BASE_URL}/matchmaking/lobbies`, data, getAuthHeaders());
    return res.data.data || res.data;
  },

  requestToJoinMatch: async (lobbyId: string): Promise<any> => {
    const res = await axios.post(`${API_BASE_URL}/matchmaking/lobbies/${lobbyId}/join`, {}, getAuthHeaders());
    return res.data.data || res.data;
  },

  reviewMatchParticipant: async (lobbyId: string, userId: string, action: 'APPROVE' | 'REJECT'): Promise<any> => {
    const res = await axios.post(`${API_BASE_URL}/matchmaking/lobbies/${lobbyId}/participants/${userId}/${action.toLowerCase()}`, {}, getAuthHeaders());
    return res.data.data || res.data;
  },

  payMatchShare: async (lobbyId: string, paymentMode: string = 'UPI'): Promise<any> => {
    const res = await axios.post(`${API_BASE_URL}/matchmaking/lobbies/${lobbyId}/pay`, { paymentMode }, getAuthHeaders());
    return res.data.data || res.data;
  },

  withdrawFromMatch: async (lobbyId: string): Promise<any> => {
    const res = await axios.post(`${API_BASE_URL}/matchmaking/lobbies/${lobbyId}/withdraw`, {}, getAuthHeaders());
    return res.data.data || res.data;
  },

  cancelMatchLobby: async (lobbyId: string, reason?: string): Promise<any> => {
    const res = await axios.post(`${API_BASE_URL}/matchmaking/lobbies/${lobbyId}/cancel`, { reason }, getAuthHeaders());
    return res.data.data || res.data;
  },

  // 4. Multi-Club Discovery
  searchClubsGeo: async (params: { lat?: number; lng?: number; radiusKm?: number; city?: string; sportType?: string; sport?: string }): Promise<any[]> => {
    const query = new URLSearchParams(params as any).toString();
    const res = await axios.get(`${API_BASE_URL}/discovery/search?${query}`);
    return res.data.data || res.data;
  },

  getMyMultiClubMemberships: async (): Promise<any[]> => {
    const res = await axios.get(`${API_BASE_URL}/discovery/my-memberships`, getAuthHeaders());
    return res.data.data || res.data;
  },

  // 5. Historical Peak Recommendations & Autopilot
  getPeakRecommendations: async (clubId: string, sportType: string = 'Padel', days: number = 30): Promise<any> => {
    const res = await axios.get(`${API_BASE_URL}/peak-recommendations/${clubId}/recommendations?sportType=${sportType}&days=${days}`, getAuthHeaders());
    return res.data.data || res.data;
  },

  actionPeakRecommendation: async (recId: string, action: 'APPROVE' | 'REJECT', notes?: string): Promise<any> => {
    const res = await axios.post(`${API_BASE_URL}/peak-recommendations/action/${recId}`, { action, notes }, getAuthHeaders());
    return res.data.data || res.data;
  },

  configureAutopilot: async (clubId: string, data: any): Promise<any> => {
    const res = await axios.post(`${API_BASE_URL}/peak-recommendations/${clubId}/autopilot`, data, getAuthHeaders());
    return res.data.data || res.data;
  },

  // 6. Notifications
  getMyNotifications: async (): Promise<AppNotification[]> => {
    const res = await axios.get(`${API_BASE_URL}/notifications/my`, getAuthHeaders());
    return res.data.data || res.data;
  },

  markNotificationAsRead: async (id: string): Promise<any> => {
    const res = await axios.patch(`${API_BASE_URL}/notifications/${id}/read`, {}, getAuthHeaders());
    return res.data.data || res.data;
  },

  // 7. Club Setup & Onboarding Flow
  getClubSetupStatus: async (clubId: string): Promise<ClubSetupStatus> => {
    const res = await axios.get(`${API_BASE_URL}/clubs/${clubId}/setup/status`, getAuthHeaders());
    return res.data.data || res.data;
  },

  saveClubSetupDraft: async (clubId: string, step: number, draftData: any): Promise<any> => {
    const res = await axios.put(`${API_BASE_URL}/clubs/${clubId}/setup/draft`, { step, draftData }, getAuthHeaders());
    return res.data.data || res.data;
  },

  submitClubSetupApplication: async (clubId: string, data: any): Promise<any> => {
    const res = await axios.post(`${API_BASE_URL}/clubs/${clubId}/setup/submit`, data, getAuthHeaders());
    return res.data.data || res.data;
  },

  // 8. Club Settings & Configuration
  getClubSettings: async (clubId: string): Promise<any> => {
    const res = await axios.get(`${API_BASE_URL}/clubs/${clubId}/settings`, getAuthHeaders());
    return res.data.data || res.data;
  },

  updateClubSettings: async (clubId: string, data: any): Promise<any> => {
    const res = await axios.put(`${API_BASE_URL}/clubs/${clubId}/settings`, data, getAuthHeaders());
    return res.data.data || res.data;
  },

  // Sports & Facilities
  getClubSports: async (clubId: string): Promise<any[]> => {
    const res = await axios.get(`${API_BASE_URL}/clubs/${clubId}/sports`);
    return res.data.data || res.data;
  },

  addClubSport: async (clubId: string, data: any): Promise<any> => {
    const res = await axios.post(`${API_BASE_URL}/clubs/${clubId}/sports`, data, getAuthHeaders());
    return res.data.data || res.data;
  },

  updateClubSport: async (clubId: string, sportId: string, data: any): Promise<any> => {
    const res = await axios.put(`${API_BASE_URL}/clubs/${clubId}/sports/${sportId}`, data, getAuthHeaders());
    return res.data.data || res.data;
  },

  archiveClubSport: async (clubId: string, sportId: string): Promise<any> => {
    const res = await axios.delete(`${API_BASE_URL}/clubs/${clubId}/sports/${sportId}`, getAuthHeaders());
    return res.data.data || res.data;
  },

  // Courts
  addCourt: async (clubId: string, data: any): Promise<any> => {
    const res = await axios.post(`${API_BASE_URL}/clubs/${clubId}/courts`, data, getAuthHeaders());
    return res.data.data || res.data;
  },

  updateCourt: async (clubId: string, courtId: string, data: any): Promise<any> => {
    const res = await axios.put(`${API_BASE_URL}/clubs/${clubId}/courts/${courtId}`, data, getAuthHeaders());
    return res.data.data || res.data;
  },

  archiveCourt: async (clubId: string, courtId: string): Promise<any> => {
    const res = await axios.delete(`${API_BASE_URL}/clubs/${clubId}/courts/${courtId}`, getAuthHeaders());
    return res.data.data || res.data;
  },

  // 9. Expenses & Financial Workspace
  getExpenses: async (clubId?: string, filters: any = {}): Promise<Expense[]> => {
    const params = new URLSearchParams(filters).toString();
    const url = clubId ? `${API_BASE_URL}/clubs/${clubId}/expenses?${params}` : `${API_BASE_URL}/expenses?${params}`;
    const res = await axios.get(url, getAuthHeaders());
    return res.data.data || res.data;
  },

  createExpense: async (data: any, clubId?: string): Promise<Expense> => {
    const url = clubId ? `${API_BASE_URL}/clubs/${clubId}/expenses` : `${API_BASE_URL}/expenses`;
    const res = await axios.post(url, data, getAuthHeaders());
    return res.data.data || res.data;
  },

  updateExpense: async (id: string, data: any, clubId?: string): Promise<Expense> => {
    const url = clubId ? `${API_BASE_URL}/clubs/${clubId}/expenses/${id}` : `${API_BASE_URL}/expenses/${id}`;
    const res = await axios.put(url, data, getAuthHeaders());
    return res.data.data || res.data;
  },

  deleteExpense: async (id: string, clubId?: string): Promise<any> => {
    const url = clubId ? `${API_BASE_URL}/clubs/${clubId}/expenses/${id}` : `${API_BASE_URL}/expenses/${id}`;
    const res = await axios.delete(url, getAuthHeaders());
    return res.data.data || res.data;
  },

  getFinancialOverview: async (clubId?: string, startDate?: string, endDate?: string): Promise<FinancialOverview> => {
    const query = new URLSearchParams();
    if (startDate) query.append('startDate', startDate);
    if (endDate) query.append('endDate', endDate);
    const url = clubId ? `${API_BASE_URL}/clubs/${clubId}/expenses/overview?${query.toString()}` : `${API_BASE_URL}/expenses/overview?${query.toString()}`;
    const res = await axios.get(url, getAuthHeaders());
    return res.data.data || res.data;
  },
};
