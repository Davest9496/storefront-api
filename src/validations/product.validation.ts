import { z } from 'zod';
import { ProductCategory } from '../types/enums';

// Convert enum to array of strings for validation
const productCategories = Object.values(ProductCategory);

export const productValidation = {
  // Create product validation schema
  createProduct: z.object({
    id: z.string().min(3, 'Product ID must be at least 3 characters'),
    productName: z
      .string()
      .min(3, 'Product name must be at least 3 characters')
      .max(100, 'Product name cannot exceed 100 characters'),
    price: z.number().positive('Price must be a positive number'),
    category: z.enum(productCategories as [string, ...string[]], {
      errorMap: () => ({ message: `Category must be one of: ${productCategories.join(', ')}` }),
    }),
    productDesc: z.string().optional(),
    imageName: z.string().min(1, 'Image name is required'),
    productFeatures: z.array(z.string()).optional(),
    productAccessories: z.array(z.string()).optional(),
    isNew: z.boolean().optional().default(true),
  }),

  // Update product validation schema
  updateProduct: z.object({
    productName: z
      .string()
      .min(3, 'Product name must be at least 3 characters')
      .max(100, 'Product name cannot exceed 100 characters')
      .optional(),
    price: z.number().positive('Price must be a positive number').optional(),
    category: z
      .enum(productCategories as [string, ...string[]], {
        errorMap: () => ({ message: `Category must be one of: ${productCategories.join(', ')}` }),
      })
      .optional(),
    productDesc: z.string().optional(),
    imageName: z.string().optional(),
    productFeatures: z.array(z.string()).optional(),
    productAccessories: z.array(z.string()).optional(),
    isNew: z.boolean().optional(),
  }),
};
