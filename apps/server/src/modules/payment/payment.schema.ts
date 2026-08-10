import { z } from 'zod';

export const initiateMpesaSchema = z.object({
  body: z.object({
    clubUuid: z.string().uuid(),
    orderUuid: z.string().uuid(),
    phoneNumber: z.string().min(10, 'Valid phone number required'),
    amount: z.number().positive(),
    accountReference: z.string(),
  }),
});

export const processCardPaymentSchema = z.object({
  body: z.object({
    clubUuid: z.string().uuid(),
    orderUuid: z.string().uuid(),
    amount: z.number().positive(),
    tableNumber: z.number().int().optional(),
  }),
});

export const processCashPaymentSchema = z.object({
  body: z.object({
    clubUuid: z.string().uuid(),
    orderUuid: z.string().uuid(),
    amount: z.number().positive(),
    tableNumber: z.number().int().optional(),
    exactCash: z.boolean(),
    customerCashAmount: z.number().positive().optional(),
  }),
});

export const updatePaymentStatusSchema = z.object({
  params: z.object({
    paymentUuid: z.string().uuid(),
  }),
  body: z.object({
    status: z.enum(['PENDING', 'PROCESSING', 'PAID', 'FAILED', 'REFUNDED', 'CANCELLED']),
  }),
});
