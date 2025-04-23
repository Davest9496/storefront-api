import { z } from 'zod';

export const orderValidation = {
  // Create order validation schema
  create: z.object({
    items: z
      .array(
        z.object({
          productId: z.string().min(1, 'Product ID is required'),
          quantity: z.number().int().positive('Quantity must be a positive integer'),
        }),
      )
      .min(1, 'At least one product is required'),
    shippingAddress: z
      .object({
        name: z.string().min(2, 'Name is required'),
        line1: z.string().min(2, 'Address line 1 is required'),
        line2: z.string().optional(),
        city: z.string().min(2, 'City is required'),
        state: z.string().min(2, 'State is required'),
        postalCode: z.string().min(2, 'Postal code is required'),
        country: z.string().min(2, 'Country is required'),
      })
      .optional(),
  }),

  // Update order status validation schema
  updateStatus: z.object({
    status: z.enum(['active', 'complete'], {
      errorMap: () => ({ message: 'Status must be either "active" or "complete"' }),
    }),
  }),

  // Add item to order validation schema
  addItem: z.object({
    productId: z.string().min(1, 'Product ID is required'),
    quantity: z.number().int().positive('Quantity must be a positive integer'),
  }),

  // Update item quantity validation schema
  updateItem: z.object({
    quantity: z.number().int().positive('Quantity must be a positive integer'),
  }),
};
