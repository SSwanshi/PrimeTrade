import { Router } from 'express';
import { prisma } from '../db';
import { authenticateToken, requireAdmin } from '../middleware/auth';

const router = Router();

router.get('/', authenticateToken, async (req, res) => {
  const assets = await prisma.asset.findMany();
  res.json(assets);
});

router.post('/', authenticateToken, requireAdmin, async (req, res) => {
  const { symbol, name, price, type } = req.body;
  try {
    const asset = await prisma.asset.create({ data: { symbol, name, price, type } });
    res.json(asset);
  } catch (error) {
    res.status(400).json({ error: 'Could not create asset' });
  }
});

router.put('/:id', authenticateToken, requireAdmin, async (req, res) => {
  const { price } = req.body;
  try {
    const asset = await prisma.asset.update({
      where: { id: req.params.id as string },
      data: { price }
    });
    res.json(asset);
  } catch (error) {
    res.status(400).json({ error: 'Asset not found' });
  }
});

router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    await prisma.asset.delete({ where: { id: req.params.id as string } });
    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ error: 'Asset not found' });
  }
});

export default router;
