"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userValidation = void 0;
const zod_1 = require("zod");
const user_entity_1 = require("../entities/user.entity");
exports.userValidation = {
    // Update user profile validation schema
    updateProfile: zod_1.z.object({
        firstName: zod_1.z
            .string()
            .min(2, 'First name must be at least 2 characters')
            .max(100, 'First name cannot exceed 100 characters')
            .optional(),
        lastName: zod_1.z
            .string()
            .min(2, 'Last name must be at least 2 characters')
            .max(100, 'Last name cannot exceed 100 characters')
            .optional(),
        email: zod_1.z.string().email('Invalid email address format').optional(),
    }),
    // Request password reset validation schema
    requestPasswordReset: zod_1.z.object({
        email: zod_1.z.string().email('Invalid email address format'),
    }),
    // Reset password validation schema
    resetPassword: zod_1.z
        .object({
        token: zod_1.z.string().min(1, 'Token is required'),
        password: zod_1.z
            .string()
            .min(8, 'Password must be at least 8 characters')
            .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must include at least one uppercase letter, one lowercase letter, and one number'),
        passwordConfirm: zod_1.z.string().min(1, 'Password confirmation is required'),
    })
        .refine((data) => data.password === data.passwordConfirm, {
        message: 'Passwords do not match',
        path: ['passwordConfirm'],
    }),
    // Admin: Update user role validation schema
    updateUserRole: zod_1.z.object({
        role: zod_1.z.nativeEnum(user_entity_1.UserRole, {
            errorMap: () => ({ message: 'Role must be either customer or admin' }),
        }),
    }),
};
