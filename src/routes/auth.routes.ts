import { Router } from 'express';
import {
  signup,
  login,
  logout,
  getCurrentUser,
  updatePassword,
} from '../controllers/auth.controller';
import { protect } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validation.middleware';
import { authValidation } from '../validations/auth.validation';

const router = Router();

/**
 * @route   POST /api/auth/signup
 * @desc    Register a new user
 * @access  Public
 */
router.post('/signup', validateRequest(authValidation.signup), signup);

/**
 * @route   POST /api/auth/login
 * @desc    Login user
 * @access  Public
 */
router.post('/login', validateRequest(authValidation.login), login);

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user
 * @access  Private
 */
router.post('/logout', protect, logout);

/**
 * @route   GET /api/auth/me
 * @desc    Get current user profile
 * @access  Private
 */
router.get('/me', protect, getCurrentUser);

/**
 * @route   PATCH /api/auth/update-password
 * @desc    Update password
 * @access  Private
 */
router.patch(
  '/update-password',
  protect,
  validateRequest(authValidation.updatePassword),
  updatePassword,
);

export default router;
