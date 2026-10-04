const { z } = require('zod');

const CreateProductSchema = z.object({
  clubId: z.string().uuid('Invalid Club ID format').optional(),
  name: z.string().min(2, 'Product name must be at least 2 characters'),
  category: z.enum([
    'GEAR',
    'RENTAL',
    'CANTEEN',
    'gear',
    'racket',
    'apparel',
    'canteen_food',
    'canteen_beverage',
  ], { invalid_type_error: 'Invalid category' }),
  price: z.number().positive('Price must be greater than 0'),
  stockQuantity: z.number().int().min(0, 'Stock quantity cannot be negative').default(0),
  isRental: z.boolean().default(false),
  lowStockThreshold: z.number().int().min(0).default(5),
});

const UpdateProductSchema = CreateProductSchema.partial();

const RestockSchema = z.object({
  quantityToAdd: z.number().int().positive('Quantity to add must be positive'),
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
  CreateProductSchema,
  UpdateProductSchema,
  RestockSchema,
  validate,
};
