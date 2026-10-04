const { z } = require('zod');

const OrderItemSchema = z.object({
  productId: z.string().uuid('Invalid Product ID format'),
  quantity: z.number().int().positive('Quantity must be at least 1'),
});

const CreateOrderSchema = z.object({
  clubId: z.string().uuid('Invalid Club ID format').optional(),
  tableNumber: z.string().optional().nullable(),
  userId: z.string().uuid('Invalid User ID format').optional().nullable(),
  items: z.array(OrderItemSchema).min(1, 'Order must contain at least 1 item'),
  paymentMode: z.enum(['CASH', 'CARD', 'UPI', 'PAY_LATER', 'MEMBER_TAB']).default('UPI'),
});

const UpdateOrderStatusSchema = z.object({
  status: z.enum(['NEW', 'PREPARING', 'READY', 'SERVED', 'CANCELLED'], {
    invalid_type_error: 'Invalid order status',
  }),
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
  CreateOrderSchema,
  UpdateOrderStatusSchema,
  validate,
};
