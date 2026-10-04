const { z } = require('zod');

const BuyPlanSchema = z.object({
  planId: z.string().uuid('Invalid Plan ID format'),
  paymentMode: z.enum(['CASH', 'CARD', 'UPI', 'PAY_LATER']).default('UPI'),
  referralCode: z.string().optional().nullable(),
});

const ValidateReferralSchema = z.object({
  referralCode: z.string().min(3, 'Referral code is required'),
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
  BuyPlanSchema,
  ValidateReferralSchema,
  validate,
};
