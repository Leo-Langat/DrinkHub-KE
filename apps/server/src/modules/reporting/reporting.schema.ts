import { z } from 'zod';

export const getReportSchema = z.object({
  query: z.object({
    period: z.enum(['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY']).default('MONTHLY'),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    format: z.enum(['JSON', 'CSV', 'EXCEL', 'PDF']).default('JSON'),
  }),
});
