const bookingsService = require('./bookings.service');
const { CreateBookingSchema, SearchAvailabilitySchema, CancelBookingSchema, validate } = require('./bookings.validator');
const { sendSuccess } = require('../../shared/utils/response');

class BookingsController {
  /**
   * GET /api/v1/bookings/availability
   * Search Live Court Availability Grid
   */
  async searchAvailability(req, res, next) {
    try {
      const validatedData = validate(SearchAvailabilitySchema, {
        clubId: req.query.clubId,
        date: req.query.date,
        sportType: req.query.sportType,
      });

      const result = await bookingsService.searchAvailability(validatedData);
      return sendSuccess(res, result, 'Availability fetched successfully', 200);
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/v1/bookings
   * Create Court Booking
   */
  async createBooking(req, res, next) {
    try {
      const validatedData = validate(CreateBookingSchema, req.body);
      const result = await bookingsService.createBooking(req.user, validatedData);
      return sendSuccess(res, result, 'Booking confirmed successfully', 201);
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/bookings/my
   * Get Current Authenticated User's Bookings
   */
  async getMyBookings(req, res, next) {
    try {
      const userId = req.user.id;
      const bookings = await bookingsService.getUserBookings(userId);
      return sendSuccess(res, bookings, 'User bookings retrieved successfully', 200);
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/bookings/club/:clubId
   * Get All Bookings for a Club (Staff / Owner)
   */
  async getClubBookings(req, res, next) {
    try {
      const clubId = req.params.clubId;
      const bookings = await bookingsService.getClubBookings(clubId);
      return sendSuccess(res, bookings, 'Club bookings retrieved successfully', 200);
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/v1/bookings/:id/cancel
   * Cancel Booking & Apply Refund Policy
   */
  async cancelBooking(req, res, next) {
    try {
      const bookingId = req.params.id;
      const result = await bookingsService.cancelBooking(req.user, bookingId);
      return sendSuccess(res, result, result.message, 200);
    } catch (err) {
      next(err);
    }
  }
  /**
   * PATCH /api/v1/bookings/:id/status
   * Update Booking Status (e.g. COMPLETED)
   */
  async updateStatus(req, res, next) {
    try {
      const bookingId = req.params.id;
      const { status } = req.body;
      if (!status) {
        return sendError(res, 'Status is required', 400);
      }
      const result = await bookingsService.updateStatus(bookingId, status);
      return sendSuccess(res, result, `Booking status updated to '${status}' successfully`, 200);
    } catch (err) {
      next(err);
    }
  }

}

module.exports = new BookingsController();
