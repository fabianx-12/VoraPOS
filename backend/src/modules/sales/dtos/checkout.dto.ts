import { z } from 'zod';

export const checkoutItemSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().int().positive('Quantity must be an integer greater than 0'),
  unitPriceCents: z.number().int().nonnegative('Unit price must be non-negative cents'),
  lineDiscountCents: z.number().int().nonnegative().default(0),
  taxAmountCents: z.number().int().nonnegative().default(0),
});

export const checkoutPaymentSchema = z.object({
  method: z.enum(['CASH', 'CARD', 'TRANSFER', 'OTHER']),
  amountCents: z.number().int().positive('Payment amount must be greater than 0 cents'),
  transactionReference: z.string().trim().max(100).nullable().default(null),
});

export const checkoutRequestSchema = z.object({
  registerSessionId: z.string().uuid(),
  userId: z.string().uuid(),
  customerId: z.string().uuid().nullable().default(null),
  items: z.array(checkoutItemSchema).min(1, 'Sale must include at least 1 item'),
  payments: z.array(checkoutPaymentSchema).min(1, 'Sale must include at least 1 payment'),
});

export type CheckoutItemDTO = z.infer<typeof checkoutItemSchema>;
export type CheckoutPaymentDTO = z.infer<typeof checkoutPaymentSchema>;
export type CheckoutRequestDTO = z.infer<typeof checkoutRequestSchema>;
