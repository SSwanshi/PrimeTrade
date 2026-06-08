import { Router } from 'express';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { getDashboardData } from '../cache/dashboard';

const router = Router();

router.get('/', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { data, cached } = await getDashboardData(req.user.id);
    res.set('X-Cache', cached ? 'HIT' : 'MISS');
    res.json({ ...data, cached });
  } catch (error) {
    res.status(500).json({ error: 'Failed to load dashboard' });
  }
});

export default router;
