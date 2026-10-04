const { z } = require('zod');

const CourtInputSchema = z.object({
  name: z.string().min(2, 'Court name must be at least 2 characters'),
  sportType: z.string().min(2, 'Sport type is required (e.g., Padel, Tennis, Badminton)'),
  basePricePerHour: z.number().positive('Base price per hour must be positive'),
  maxCapacity: z.number().int().positive().default(4),
});

const PlanInputSchema = z.object({
  tier: z.enum(['PLATINUM', 'SILVER', 'BRONZE']),
  price: z.number().nonnegative('Plan price must be non-negative'),
  durationMonths: z.number().int().positive().default(3),
  courtDiscountPct: z.number().min(0).max(100),
  rentalDiscountPct: z.number().min(0).max(100),
  shopDiscountPct: z.number().min(0).max(100),
  foodDiscountPct: z.number().min(0).max(100).default(0),
  allowsPayLater: z.boolean().default(false),
  freeCoachingSessionsPerMonth: z.number().int().nonnegative().default(0),
});

const DynamicPricingInputSchema = z.object({
  sportType: z.string(),
  isEnabled: z.boolean().default(true),
  strategy: z.enum(['CONSERVATIVE', 'BALANCED', 'AGGRESSIVE']).default('BALANCED'),
  peakStartHour: z.number().int().min(0).max(23).default(18),
  peakEndHour: z.number().int().min(0).max(23).default(22),
  peakMultiplier: z.number().min(1.0).max(3.0).default(1.25),
  priceFloor: z.number().positive(),
  priceCeiling: z.number().positive(),
  lastMinuteDiscountPct: z.number().min(0).max(50).default(15),
});

const RegisterClubSchema = z.object({
  name: z.string().min(3, 'Club name must be at least 3 characters'),
  address: z.string().min(5, 'Address is required'),
  city: z.string().min(2, 'City is required'),
  gstNumber: z.string().optional().nullable(),
  panNumber: z.string().optional().nullable(),
  ownerInfo: z
    .object({
      fullName: z.string().min(2, 'Owner full name is required').optional(),
      email: z.string().email('Invalid owner email address').optional(),
      password: z.string().min(6, 'Owner password must be at least 6 characters').optional(),
      phone: z.string().min(10, 'Owner phone number must be valid').optional(),
    })
    .optional(),
  courts: z.array(CourtInputSchema).optional(),
  membershipPlans: z.array(PlanInputSchema).optional(),
  dynamicPricing: z.array(DynamicPricingInputSchema).optional(),
});

const VerifyClubSchema = z.object({
  isVerified: z.boolean(),
  inspectionStatus: z.enum(['PENDING', 'VERIFIED', 'REJECTED']),
  baseCommissionPct: z.number().min(0).max(50).optional(),
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
  RegisterClubSchema,
  VerifyClubSchema,
  validate,
};
