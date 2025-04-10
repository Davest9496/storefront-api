import { z } from 'zod';
import { UserRole } from '../entities/user.entity';

export const userValidation = {
  // Update user profile validation schema
  updateProfile: z.object({
    firstName: z
      .string()
      .min(2, 'First name must be at least 2 characters')
      .max(100, 'First name cannot exceed 100 characters')
      .optional(),
    lastName: z
      .string()
      .min(2, 'Last name must be at least 2 characters')
      .max(100, 'Last name cannot exceed 100 characters')
      .optional(),
    email: z.string().email('Invalid email address format').optional(),
  }),

  // Request password reset validation schema
  requestPasswordReset: z.object({
    email: z.string().email('Invalid email address format'),
  }),

  // Reset password validation schema
  resetPassword: z
    .object({
      token: z.string().min(1, 'Token is required'),
      password: z
        .string()
        .min(8, 'Password must be at least 8 characters')
        .regex(
          /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
          'Password must include at least one uppercase letter, one lowercase letter, and one number',
        ),
      passwordConfirm: z.string().min(1, 'Password confirmation is required'),
    })
    .refine((data) => data.password === data.passwordConfirm, {
      message: 'Passwords do not match',
      path: ['passwordConfirm'],
    }),

  // Admin: Update user role validation schema
  updateUserRole: z.object({
    role: z.nativeEnum(UserRole, {
      errorMap: () => ({ message: 'Role must be either customer or admin' }),
    }),
  }),
};
