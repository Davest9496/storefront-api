import { Router } from 'express';
import { userController } from '../controllers/user.controller';
import { protect, restrictTo } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validation.middleware';
import { userValidation } from '../validations/user.validation';
import { UserRole } from '../entities/user.entity';

const router = Router();

// Profile routes (protected)
router.use('/profile', protect);
router.get('/profile', userController.getProfile);
router.patch(
  '/profile',
  validateRequest(userValidation.updateProfile),
  userController.updateProfile,
);

// Password reset (public)
router.post(
  '/forgot-password',
  validateRequest(userValidation.requestPasswordReset),
  userController.forgotPassword,
);
router.post(
  '/reset-password',
  validateRequest(userValidation.resetPassword),
  userController.resetPassword,
);

// Admin routes
router.use('/admin', protect, restrictTo(UserRole.ADMIN));
router.get('/admin/users', userController.getAllUsers);
router.get('/admin/users/:id', userController.getUserById);
router.patch(
  '/admin/users/:id/role',
  validateRequest(userValidation.updateUserRole),
  userController.updateUserRole,
);

export default router;
