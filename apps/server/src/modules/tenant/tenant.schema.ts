import { z } from 'zod';

export const createClubSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Club name must be at least 2 characters'),
    slug: z.string().min(2, 'Slug must be at least 2 characters'),
    logoUrl: z.string().url().optional().or(z.literal('')),
    phone: z.string().optional(),
    email: z.string().email().optional().or(z.literal('')),
    city: z.string().optional().default('Nairobi'),
    county: z.string().optional().default('Nairobi'),
    address: z.string().optional(),
    gpsCoordinates: z.string().optional(),
    brandColor: z.string().optional().default('#e11d48'),
    openingHours: z.string().optional().default('14:00'),
    closingHours: z.string().optional().default('04:00'),
  }),
});

/**
 * Unified Club + Manager provisioning schema (Platform Admin workflow, §23–24).
 * Both Club info and initial Manager account are required in a single request.
 * The transaction is atomic — if the manager email already exists the whole
 * operation is rolled back and the club is NOT created.
 */
export const createClubWithManagerSchema = z.object({
  body: z.object({
    // Club fields
    name: z.string().min(2, 'Club name must be at least 2 characters'),
    slug: z.string().min(2, 'Slug must be at least 2 characters').regex(/^[a-z0-9-]+$/, 'Slug may only contain lowercase letters, numbers, and hyphens'),
    logoUrl: z.string().url().optional().or(z.literal('')),
    phone: z.string().optional(),
    email: z.string().email().optional().or(z.literal('')),
    city: z.string().optional().default('Nairobi'),
    county: z.string().optional().default('Nairobi'),
    address: z.string().optional(),
    gpsCoordinates: z.string().optional(),
    brandColor: z.string().optional().default('#e11d48'),
    openingHours: z.string().optional().default('14:00'),
    closingHours: z.string().optional().default('04:00'),
    // Manager fields
    managerFullName: z.string().min(2, 'Manager name must be at least 2 characters'),
    managerEmail: z.string().email('Valid manager email is required'),
    managerPhone: z.string().optional(),
    managerPassword: z.string().min(8, 'Temporary password must be at least 8 characters'),
  }),
});


export const updateClubSchema = z.object({
  params: z.object({
    clubUuid: z.string().uuid('Invalid Club UUID'),
  }),
  body: z.object({
    name: z.string().min(2).optional(),
    logoUrl: z.string().url().optional().or(z.literal('')),
    phone: z.string().optional(),
    email: z.string().email().optional().or(z.literal('')),
    city: z.string().optional(),
    county: z.string().optional(),
    address: z.string().optional(),
    gpsCoordinates: z.string().optional(),
    brandColor: z.string().optional(),
    openingHours: z.string().optional(),
    closingHours: z.string().optional(),
  }),
});

export const assignManagerSchema = z.object({
  params: z.object({
    clubUuid: z.string().uuid('Invalid Club UUID'),
  }),
  body: z.object({
    userUuid: z.string().uuid('Invalid User UUID'),
  }),
});

export const generateQrCodesSchema = z.object({
  params: z.object({
    clubUuid: z.string().uuid('Invalid Club UUID'),
  }),
  body: z.object({
    tableCount: z.number().int().min(1).max(200),
    sectionName: z.string().optional().default('Main Floor'),
  }),
});
