const { z } = require('zod');

const RegisterSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  email: z.string().email('Invalid email address format'),
  password: z.string().min(6, 'Password must be at least 6 characters long'),
  phone: z.string().min(10, 'Phone number must be at least 10 digits').optional(),
  role: z.enum([
    'PLATFORM_ADMIN',
    'CLUB_OWNER',
    'STAFF',
    'KITCHEN_MANAGER',
    'COACH',
    'MEMBER',
    'NON_MEMBER',
  ]).default('NON_MEMBER'),
  clubId: z.string().uuid('Invalid Club ID format').optional().nullable(),
  dateOfBirth: z.string().optional().nullable(),
  guardianId: z.string().uuid('Invalid Guardian User ID format').optional().nullable(),
  referralCode: z.string().optional().nullable(),
});

const LoginSchema = z.object({
  email: z.string().email('Invalid email address format'),
  password: z.string().min(1, 'Password is required'),
});

const QrSignupSchema = RegisterSchema.extend({
  clubId: z.string().uuid('Valid Club ID is required for QR signup'),
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
  RegisterSchema,
  LoginSchema,
  QrSignupSchema,
  validate,
};
