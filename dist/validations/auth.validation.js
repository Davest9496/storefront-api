"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authValidation = void 0;
const zod_1 = require("zod");
// Define password validation rules
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d\w\W]{8,}$/;
const passwordMessage = 'Password must be at least 8 characters and include at least one uppercase letter, one lowercase letter, and one number';
exports.authValidation = {
    // Signup validation schema
    signup: zod_1.z
        .object({
        firstName: zod_1.z
            .string()
            .min(2, 'First name must be at least 2 characters')
            .max(100, 'First name cannot exceed 100 characters'),
        lastName: zod_1.z
            .string()
            .min(2, 'Last name must be at least 2 characters')
            .max(100, 'Last name cannot exceed 100 characters'),
        email: zod_1.z.string().email('Invalid email address format'),
        password: zod_1.z.string().regex(passwordRegex, passwordMessage),
        passwordConfirm: zod_1.z.string(),
    })
        .refine((data) => data.password === data.passwordConfirm, {
        message: 'Passwords do not match',
        path: ['passwordConfirm'],
    }),
    // Login validation schema
    login: zod_1.z.object({
        email: zod_1.z.string().email('Invalid email address format'),
        password: zod_1.z.string().min(1, 'Password is required'),
    }),
    // Update password validation schema
    updatePassword: zod_1.z
        .object({
        currentPassword: zod_1.z.string().min(1, 'Current password is required'),
        newPassword: zod_1.z.string().regex(passwordRegex, passwordMessage),
        passwordConfirm: zod_1.z.string(),
    })
        .refine((data) => data.newPassword === data.passwordConfirm, {
        message: 'Passwords do not match',
        path: ['passwordConfirm'],
    }),
};
