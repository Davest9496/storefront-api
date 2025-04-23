"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.orderValidation = void 0;
const zod_1 = require("zod");
exports.orderValidation = {
    // Create order validation schema
    create: zod_1.z.object({
        items: zod_1.z
            .array(zod_1.z.object({
            productId: zod_1.z.string().min(1, 'Product ID is required'),
            quantity: zod_1.z.number().int().positive('Quantity must be a positive integer'),
        }))
            .min(1, 'At least one product is required'),
        shippingAddress: zod_1.z
            .object({
            name: zod_1.z.string().min(2, 'Name is required'),
            line1: zod_1.z.string().min(2, 'Address line 1 is required'),
            line2: zod_1.z.string().optional(),
            city: zod_1.z.string().min(2, 'City is required'),
            state: zod_1.z.string().min(2, 'State is required'),
            postalCode: zod_1.z.string().min(2, 'Postal code is required'),
            country: zod_1.z.string().min(2, 'Country is required'),
        })
            .optional(),
    }),
    // Update order status validation schema
    updateStatus: zod_1.z.object({
        status: zod_1.z.enum(['active', 'complete'], {
            errorMap: () => ({ message: 'Status must be either "active" or "complete"' }),
        }),
    }),
    // Add item to order validation schema
    addItem: zod_1.z.object({
        productId: zod_1.z.string().min(1, 'Product ID is required'),
        quantity: zod_1.z.number().int().positive('Quantity must be a positive integer'),
    }),
    // Update item quantity validation schema
    updateItem: zod_1.z.object({
        quantity: zod_1.z.number().int().positive('Quantity must be a positive integer'),
    }),
};
