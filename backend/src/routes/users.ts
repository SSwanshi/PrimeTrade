import { Router } from 'express';
import { prisma } from '../db';
import { authenticateToken, requireAdmin } from '../middleware/auth';

const router = Router();

router.get('/', authenticateToken, requireAdmin, async (req, res) => {
  const users = await prisma.user.findMany({
    select: { id: true, email: true, name: true, role: true, createdAt: true }
  });
  res.json(users);
});

router.put('/:id', authenticateToken, requireAdmin, async (req, res) => {
  const { name, role } = req.body;
  try {
    const user = await prisma.user.update({
      where: { id: req.params.id as string },
      data: { name, role }
    });
    res.json(user);
  } catch (error) {
    res.status(400).json({ error: 'User update failed' });
  }
});

router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    // Delete associated portfolio first if standard cascade isn't set up
    await prisma.portfolio.deleteMany({ where: { userId: req.params.id as string } });
    await prisma.order.deleteMany({ where: { userId: req.params.id as string } });
    await prisma.user.delete({ where: { id: req.params.id as string } });
    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ error: 'User delete failed' });
  }
});

export default router;
