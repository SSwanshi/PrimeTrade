import { Router } from 'express';
import { prisma } from '../db';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();

router.get('/', authenticateToken, async (req: AuthRequest, res) => {
  const portfolio = await prisma.portfolio.findUnique({
    where: { userId: req.user.id }
  });
  res.json(portfolio || { balance: 0 });
});

export default router;
