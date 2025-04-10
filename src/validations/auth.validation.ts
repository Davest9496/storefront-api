import { z } from 'zod';

// Define password validation rules
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d\w\W]{8,}$/;
const passwordMessage =
  'Password must be at least 8 characters and include at least one uppercase letter, one lowercase letter, and one number';

export const authValidation = {
  // Signup validation schema
  signup: z
    .object({
      firstName: z
        .string()
        .min(2, 'First name must be at least 2 characters')
        .max(100, 'First name cannot exceed 100 characters'),
      lastName: z
        .string()
        .min(2, 'Last name must be at least 2 characters')
        .max(100, 'Last name cannot exceed 100 characters'),
      email: z.string().email('Invalid email address format'),
      password: z.string().regex(passwordRegex, passwordMessage),
      passwordConfirm: z.string(),
    })
    .refine((data) => data.password === data.passwordConfirm, {
      message: 'Passwords do not match',
      path: ['passwordConfirm'],
    }),

  // Login validation schema
  login: z.object({
    email: z.string().email('Invalid email address format'),
    password: z.string().min(1, 'Password is required'),
  }),

  // Update password validation schema
  updatePassword: z
    .object({
      currentPassword: z.string().min(1, 'Current password is required'),
      newPassword: z.string().regex(passwordRegex, passwordMessage),
      passwordConfirm: z.string(),
    })
    .refine((data) => data.newPassword === data.passwordConfirm, {
      message: 'Passwords do not match',
      path: ['passwordConfirm'],
    }),
};
