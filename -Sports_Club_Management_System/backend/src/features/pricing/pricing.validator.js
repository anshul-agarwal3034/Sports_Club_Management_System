const { z } = require('zod');

const CalculatePriceSchema = z.object({
  courtId: z.string().uuid('Invalid Court ID format'),
  startTime: z.string().datetime({ message: 'ISO 8601 string required for start time' }),
  endTime: z.string().datetime({ message: 'ISO 8601 string required for end time' }),
  userId: z.string().uuid().optional(),
});

const UpdatePricingRulesSchema = z.object({
  sportType: z.string().min(2, 'Sport type is required'),
  isEnabled: z.boolean().default(true),
  strategy: z.enum(['CONSERVATIVE', 'BALANCED', 'AGGRESSIVE']).default('BALANCED'),
  peakStartHour: z.number().int().min(0).max(23).default(18),
  peakEndHour: z.number().int().min(0).max(23).default(22),
  peakMultiplier: z.number().min(1.0).max(3.0).default(1.25),
  priceFloor: z.number().positive('Price floor must be positive'),
  priceCeiling: z.number().positive('Price ceiling must be positive'),
  lastMinuteDiscountPct: z.number().min(0).max(50).default(15),
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
  CalculatePriceSchema,
  UpdatePricingRulesSchema,
  validate,
};
