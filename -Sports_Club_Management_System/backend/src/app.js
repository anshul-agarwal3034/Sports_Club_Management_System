const express = require('express');
const cors = require('cors');
const authRoutes = require('./features/auth/auth.routes');
const bookingsRoutes = require('./features/bookings/bookings.routes');
const clubsRoutes = require('./features/clubs/clubs.routes');
const membershipsRoutes = require('./features/memberships/memberships.routes');
const pricingRoutes = require('./features/pricing/pricing.routes');
const canteenRoutes = require('./features/canteen/canteen.routes');
const inventoryRoutes = require('./features/inventory/inventory.routes');
const waitlistRoutes = require('./features/waitlist/waitlist.routes');
const flashDealsRoutes = require('./features/flashDeals/flashDeals.routes');
const matchmakingRoutes = require('./features/matchmaking/matchmaking.routes');
const discoveryRoutes = require('./features/discovery/discovery.routes');
const peakRecommendationsRoutes = require('./features/peakRecommendations/peakRecommendations.routes');
const notificationsRoutes = require('./features/notifications/notifications.routes');
const expensesRoutes = require('./features/expenses/expenses.routes');
const { globalErrorHandler } = require('./shared/middlewares/error.middleware');
const { sendError } = require('./shared/utils/response');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health Check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'UP', timestamp: new Date().toISOString() });
});

// Feature Routes (Standard /api/v1 REST API)
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/bookings', bookingsRoutes);
app.use('/api/v1/clubs', clubsRoutes);
app.use('/api/v1/memberships', membershipsRoutes);
app.use('/api/v1/pricing', pricingRoutes);
app.use('/api/v1/canteen', canteenRoutes);
app.use('/api/v1/inventory', inventoryRoutes);
app.use('/api/v1/waitlist', waitlistRoutes);
app.use('/api/v1/flash-deals', flashDealsRoutes);
app.use('/api/v1/matchmaking', matchmakingRoutes);
app.use('/api/v1/discovery', discoveryRoutes);
app.use('/api/v1/peak-recommendations', peakRecommendationsRoutes);
app.use('/api/v1/notifications', notificationsRoutes);
app.use('/api/v1/expenses', expensesRoutes);
app.use('/api/v1/clubs/:clubId/expenses', expensesRoutes);

// 404 Handler
app.use((req, res) => {
  sendError(res, `Route ${req.originalUrl} not found`, 404);
});

// Global Error Handler
app.use(globalErrorHandler);

module.exports = app;
