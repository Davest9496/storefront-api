import { Router } from 'express';
import { authController } from '../controllers/auth.controller';
import { protect } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validation.middleware';
import { authValidation } from '../validations/auth.validation';
import rateLimit from 'express-rate-limit';

const router = Router();

// Rate limiting for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 login attempts per window
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many login attempts. Please try again after 15 minutes.',
});

// Public routes
router.post('/signup', validateRequest(authValidation.signup), authController.signup);

router.post(
  '/login',
  authLimiter, // Apply rate limiting to login route
  validateRequest(authValidation.login),
  authController.login,
);

router.post('/logout', authController.logout);

// Protected routes
router.get('/me', protect, authController.getMe);

export default router;
