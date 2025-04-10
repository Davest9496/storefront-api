import { Router } from 'express';
import authRoutes from './auth.routes';
import healthRoutes from './health.routes';
// Import other route modules as they are created

const router = Router();

// Register route modules
router.use('/auth', authRoutes);
router.use('/health', healthRoutes);
// Register other route modules as they are created

export default router;
