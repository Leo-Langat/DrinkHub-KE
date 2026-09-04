/**
 * Reporting Module — Validation Schemas
 *
 * Strict Zod validation schemas for Admin reporting endpoints:
 *   - Enforces valid date range enums
 *   - Strict custom date validation (requires both startDate and endDate, startDate <= endDate)
 *   - Forbids unknown/injected query parameters (e.g. client businessUuid)
 */

import { z } from 'zod';

const isValidDateString = (val: string) => {
  const d = new Date(val);
  return !isNaN(d.getTime());
};

const baseReportQuery = z
  .object({
    range: z
      .enum([
        'TODAY',
        'YESTERDAY',
        'LAST_7_DAYS',
        'LAST_30_DAYS',
        'THIS_WEEK',
        'LAST_WEEK',
        'THIS_MONTH',
        'LAST_MONTH',
        'CUSTOM',
      ])
      .default('LAST_7_DAYS'),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
  })
  .strict({ message: 'Unrecognized query parameter in report request' })
  .superRefine((data, ctx) => {
    if (data.range === 'CUSTOM') {
      if (!data.startDate) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['startDate'],
          message: 'startDate is required when range is CUSTOM',
        });
      } else if (!isValidDateString(data.startDate)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['startDate'],
          message: 'startDate must be a valid date string (e.g. YYYY-MM-DD)',
        });
      }

      if (!data.endDate) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['endDate'],
          message: 'endDate is required when range is CUSTOM',
        });
      } else if (!isValidDateString(data.endDate)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['endDate'],
          message: 'endDate must be a valid date string (e.g. YYYY-MM-DD)',
        });
      }

      if (data.startDate && data.endDate && isValidDateString(data.startDate) && isValidDateString(data.endDate)) {
        const start = new Date(data.startDate);
        const end = new Date(data.endDate);
        if (start > end) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['endDate'],
            message: 'endDate must be greater than or equal to startDate',
          });
        }
      }
    } else {
      if (data.startDate && !isValidDateString(data.startDate)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['startDate'],
          message: 'startDate must be a valid date string',
        });
      }
      if (data.endDate && !isValidDateString(data.endDate)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['endDate'],
          message: 'endDate must be a valid date string',
        });
      }
    }
  });

export const adminReportQuerySchema = z.object({
  query: baseReportQuery,
});

export const adminExportQuerySchema = z.object({
  query: z
    .object({
      reportType: z.enum([
        'REVENUE',
        'ORDERS',
        'PAYMENTS',
        'PRODUCTS',
        'CATEGORIES',
        'WAITERS',
      ], { required_error: 'reportType is required' }),
      range: z
        .enum([
          'TODAY',
          'YESTERDAY',
          'LAST_7_DAYS',
          'LAST_30_DAYS',
          'THIS_WEEK',
          'LAST_WEEK',
          'THIS_MONTH',
          'LAST_MONTH',
          'CUSTOM',
        ])
        .default('LAST_7_DAYS'),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
    })
    .strict({ message: 'Unrecognized query parameter in export request' })
    .superRefine((data, ctx) => {
      if (data.range === 'CUSTOM') {
        if (!data.startDate) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['startDate'],
            message: 'startDate is required when range is CUSTOM',
          });
        } else if (!isValidDateString(data.startDate)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['startDate'],
            message: 'startDate must be a valid date string (e.g. YYYY-MM-DD)',
          });
        }

        if (!data.endDate) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['endDate'],
            message: 'endDate is required when range is CUSTOM',
          });
        } else if (!isValidDateString(data.endDate)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['endDate'],
            message: 'endDate must be a valid date string (e.g. YYYY-MM-DD)',
          });
        }

        if (data.startDate && data.endDate && isValidDateString(data.startDate) && isValidDateString(data.endDate)) {
          const start = new Date(data.startDate);
          const end = new Date(data.endDate);
          if (start > end) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              path: ['endDate'],
              message: 'endDate must be greater than or equal to startDate',
            });
          }
        }
      }
    }),
});

/**
 * Legacy schema for /reports/analytics
 */
export const getReportSchema = z.object({
  query: z.object({
    period: z.enum(['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY']).default('MONTHLY'),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    format: z.enum(['JSON', 'CSV', 'EXCEL', 'PDF']).default('JSON'),
    businessUuid: z.string().optional(),
    clubUuid: z.string().optional(),
  }),
});
