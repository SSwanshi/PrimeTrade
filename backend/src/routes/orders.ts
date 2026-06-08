import { Router } from 'express';
import { prisma } from '../db';
import { authenticateToken, AuthRequest, requireAdmin } from '../middleware/auth';

const router = Router();

router.post('/', authenticateToken, async (req: AuthRequest, res) => {
  const { assetId, side, quantity } = req.body;
  const userId = req.user.id;

  try {
    const asset = await prisma.asset.findUnique({ where: { id: assetId } });
    if (!asset) return res.status(404).json({ error: 'Asset not found' });

    const totalCost = asset.price * quantity;
    const portfolio = await prisma.portfolio.findUnique({ where: { userId } });

    if (side === 'BUY') {
      if (!portfolio || portfolio.balance < totalCost) {
        return res.status(400).json({ error: 'Insufficient funds' });
      }
      
      await prisma.$transaction([
        prisma.portfolio.update({
          where: { userId },
          data: { balance: portfolio.balance - totalCost }
        }),
        prisma.order.create({
          data: { userId, assetId, side, quantity, price: asset.price, status: 'FILLED' }
        })
      ]);
      res.json({ success: true, message: 'Order created and filled' });
    } else {
      // For SELL, simplified simulation
      if (!portfolio) {
        return res.status(400).json({ error: 'Portfolio not found' });
      }
      await prisma.$transaction([
        prisma.portfolio.update({
          where: { userId },
          data: { balance: portfolio.balance + totalCost }
        }),
        prisma.order.create({
          data: { userId, assetId, side, quantity, price: asset.price, status: 'FILLED' }
        })
      ]);
      res.json({ success: true, message: 'Order created and filled' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/my-orders', authenticateToken, async (req: AuthRequest, res) => {
  const orders = await prisma.order.findMany({
    where: { userId: req.user.id },
    include: { asset: true }
  });
  res.json(orders);
});

router.get('/', authenticateToken, requireAdmin, async (req, res) => {
  const orders = await prisma.order.findMany({ include: { asset: true, user: true } });
  res.json(orders);
});

export default router;
