import { Router } from 'express';
import { prisma } from '../db';
import { authenticateToken, AuthRequest, requireAdmin } from '../middleware/auth';
import { invalidateUserDashboard } from '../cache/dashboard';

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
      await invalidateUserDashboard(userId);
      res.json({ success: true, message: 'Order created and filled' });
    } else if (side === 'SELL') {
      const userOrders = await prisma.order.findMany({
        where: { userId, assetId, status: 'FILLED' }
      });
      
      const ownedQuantity = userOrders.reduce((acc, order) => {
        return order.side === 'BUY' ? acc + order.quantity : acc - order.quantity;
      }, 0);

      if (ownedQuantity < quantity) {
        return res.status(400).json({ error: 'Not enough assets to sell' });
      }

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
      await invalidateUserDashboard(userId);
      res.json({ success: true, message: 'Order created and filled' });
    } else {
      res.status(400).json({ error: 'Invalid side' });
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

router.put('/:id', authenticateToken, async (req: AuthRequest, res) => {
  const { quantity } = req.body;
  const newQuantity = parseFloat(quantity);
  const userId = req.user.id;

  try {
    const order = await prisma.order.findUnique({ where: { id: req.params.id as string } });
    if (!order) return res.status(404).json({ error: 'Order not found' });
    if (order.userId !== userId) return res.status(403).json({ error: 'Unauthorized' });

    const qtyDifference = newQuantity - order.quantity;
    if (qtyDifference === 0) return res.json(order);

    const portfolio = await prisma.portfolio.findUnique({ where: { userId } });
    if (!portfolio) return res.status(400).json({ error: 'Portfolio not found' });

    if (order.side === 'BUY') {
      const additionalCost = qtyDifference * order.price;
      if (portfolio.balance < additionalCost) {
        return res.status(400).json({ error: 'Insufficient funds for updated quantity' });
      }

      await prisma.$transaction([
        prisma.portfolio.update({
          where: { userId },
          data: { balance: portfolio.balance - additionalCost }
        }),
        prisma.order.update({
          where: { id: order.id },
          data: { quantity: newQuantity }
        })
      ]);
    } else if (order.side === 'SELL') {
      if (qtyDifference > 0) {
        const userOrders = await prisma.order.findMany({
          where: { userId, assetId: order.assetId, status: 'FILLED' }
        });
        const ownedQuantity = userOrders.reduce((acc, o) => o.side === 'BUY' ? acc + o.quantity : acc - o.quantity, 0);
        
        if (ownedQuantity < qtyDifference) {
          return res.status(400).json({ error: 'Not enough assets to increase sell quantity' });
        }
      }

      const additionalRevenue = qtyDifference * order.price;
      await prisma.$transaction([
        prisma.portfolio.update({
          where: { userId },
          data: { balance: portfolio.balance + additionalRevenue }
        }),
        prisma.order.update({
          where: { id: order.id },
          data: { quantity: newQuantity }
        })
      ]);
    }

    await invalidateUserDashboard(userId);
    res.json({ success: true, message: 'Order updated' });
  } catch (error) {
    res.status(400).json({ error: 'Order update failed' });
  }
});

router.delete('/:id', authenticateToken, async (req: AuthRequest, res) => {
  const userId = req.user.id;
  try {
    await prisma.order.delete({ where: { id: req.params.id as string }});
    await invalidateUserDashboard(userId);
    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ error: 'Order delete failed' });
  }
});

export default router;
