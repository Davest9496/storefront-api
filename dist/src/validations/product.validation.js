"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.productValidation = void 0;
const zod_1 = require("zod");
const enums_1 = require("../types/enums");
// Convert enum to array of strings for validation
const productCategories = Object.values(enums_1.ProductCategory);
exports.productValidation = {
    // Create product validation schema
    createProduct: zod_1.z.object({
        id: zod_1.z.string().min(3, 'Product ID must be at least 3 characters'),
        productName: zod_1.z
            .string()
            .min(3, 'Product name must be at least 3 characters')
            .max(100, 'Product name cannot exceed 100 characters'),
        price: zod_1.z.number().positive('Price must be a positive number'),
        category: zod_1.z.enum(productCategories, {
            errorMap: () => ({ message: `Category must be one of: ${productCategories.join(', ')}` }),
        }),
        productDesc: zod_1.z.string().optional(),
        imageName: zod_1.z.string().min(1, 'Image name is required'),
        productFeatures: zod_1.z.array(zod_1.z.string()).optional(),
        productAccessories: zod_1.z.array(zod_1.z.string()).optional(),
        isNew: zod_1.z.boolean().optional().default(true),
    }),
    // Update product validation schema
    updateProduct: zod_1.z.object({
        productName: zod_1.z
            .string()
            .min(3, 'Product name must be at least 3 characters')
            .max(100, 'Product name cannot exceed 100 characters')
            .optional(),
        price: zod_1.z.number().positive('Price must be a positive number').optional(),
        category: zod_1.z
            .enum(productCategories, {
            errorMap: () => ({ message: `Category must be one of: ${productCategories.join(', ')}` }),
        })
            .optional(),
        productDesc: zod_1.z.string().optional(),
        imageName: zod_1.z.string().optional(),
        productFeatures: zod_1.z.array(zod_1.z.string()).optional(),
        productAccessories: zod_1.z.array(zod_1.z.string()).optional(),
        isNew: zod_1.z.boolean().optional(),
    }),
};
