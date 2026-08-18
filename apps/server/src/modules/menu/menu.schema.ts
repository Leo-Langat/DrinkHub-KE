import { z } from 'zod';

export const createCategorySchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Category name required'),
    description: z.string().optional(),
    displayOrder: z.number().int().optional().default(0),
  }),
});

export const updateCategorySchema = z.object({
  params: z.object({
    categoryUuid: z.string().uuid('Invalid Category UUID'),
  }),
  body: z.object({
    name: z.string().min(2, 'Category name required').optional(),
    description: z.string().optional(),
    displayOrder: z.number().int().optional(),
  }),
});

export const updateCategoryOrderSchema = z.object({
  body: z.object({
    orders: z.array(
      z.object({
        categoryUuid: z.string().uuid(),
        displayOrder: z.number().int(),
      }),
    ),
  }),
});

export const createProductSchema = z.object({
  body: z.object({
    categoryUuid: z.string().uuid('Invalid Category UUID').optional(),
    categoryName: z.string().optional(),
    category: z.string().optional(),
    name: z.string().min(2, 'Product name is required'),
    description: z.string().optional(),
    price: z.number().positive('Price must be greater than 0'),
    imageUrl: z.string().optional(),
    sku: z.string().optional(),
  }),
});

export const updateProductSchema = z.object({
  params: z.object({
    productUuid: z.string().uuid(),
  }),
  body: z.object({
    name: z.string().min(2).optional(),
    description: z.string().optional(),
    price: z.number().positive().optional(),
    imageUrl: z.string().optional(),
    isAvailable: z.boolean().optional(),
  }),
});

export const createOfferSchema = z.object({
  body: z.object({
    title: z.string().min(2, 'Offer title is required'),
    description: z.string().optional(),
    offerType: z.enum(['PERCENTAGE_DISCOUNT', 'FIXED_AMOUNT_DISCOUNT', 'BUY_ONE_GET_ONE']).default('PERCENTAGE_DISCOUNT'),
    discountValue: z.number().nonnegative('Discount value must be greater than or equal to 0'),
    promoCode: z.string().optional(),
    startTime: z.string().optional(),
    endTime: z.string().optional(),
  }),
});
