import { Router } from 'express';
import { AuthRequest, authenticate } from '../middleware/auth';

const router = Router();

// All user routes require authentication
router.use(authenticate);

// ==================== GET /api/users/profile ====================
router.get('/profile', async (req: AuthRequest, res) => {
  res.json({ success: true, data: req.user });
});

export { router as userRoutes };
