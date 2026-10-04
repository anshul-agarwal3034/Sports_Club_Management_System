const { z } = require('zod');

const CreateBookingSchema = z.object({
  courtId: z.string().min(1, 'Court ID is required'),
  startTime: z.string().min(1, 'Start time is required'),
  endTime: z.string().min(1, 'End time is required'),
  paymentMode: z.enum(['CASH', 'CARD', 'UPI', 'PAY_LATER']).default('UPI'),
  coachId: z.string().optional().nullable(),
});

const SearchAvailabilitySchema = z.object({
  clubId: z.string().uuid('Invalid Club ID format'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date format must be YYYY-MM-DD'),
  sportType: z.string().optional(),
});

const CancelBookingSchema = z.object({
  bookingId: z.string().uuid('Invalid Booking ID format'),
});

function validate(schema, data) {
  const result = schema.safeParse(data);
  if (!result.success) {
    const errorDetails = result.error.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
    }));
    const error = new Error('Validation Error');
    error.statusCode = 400;
    error.errors = errorDetails;
    throw error;
  }
  return result.data;
}

module.exports = {
  CreateBookingSchema,
  SearchAvailabilitySchema,
  CancelBookingSchema,
  validate,
};
