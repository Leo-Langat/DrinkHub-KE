import { z } from 'zod';

export const createOrderSchema = z.object({
  body: z.object({
    tableUuid: z.string().uuid().optional(),
    items: z.array(
      z.object({
        productUuid: z.string().uuid(),
        quantity: z.number().int().positive(),
        notes: z.string().optional(),
      }),
    ).min(1, 'Order must contain at least 1 item'),
    notes: z.string().optional(),
    customerSessionUuid: z.string().uuid().optional(),
    offerUuid: z.string().uuid().optional(),
    // Legal age confirmation — must be explicitly true (OWASP: validate server-side)
    ageVerified: z.literal(true, {
      errorMap: () => ({ message: 'You must confirm you are of legal drinking age to place an order.' }),
    }),
  }),
});

export const claimOrderSchema = z.object({
  params: z.object({
    orderUuid: z.string().uuid(),
  }),
});

export const updateOrderStatusSchema = z.object({
  params: z.object({
    orderUuid: z.string().uuid(),
  }),
  body: z.object({
    status: z.enum(['PENDING', 'CLAIMED', 'PREPARING', 'READY', 'DELIVERED', 'COMPLETED', 'CANCELLED']),
  }),
});
