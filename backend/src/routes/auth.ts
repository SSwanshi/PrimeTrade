import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../db';

const router = Router();

router.post('/register', async (req, res) => {
  const { email, password, name, role } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role: role || 'USER',
        portfolio: {
          create: { balance: 10000 } // Give new users $10000 to trade
        }
      },
      include: { portfolio: true }
    });
    res.json({ id: user.id, email: user.email, name: user.name, role: user.role });
  } catch (error) {
    res.status(400).json({ error: 'User already exists or bad request' });
  }
});

router.post('/login', async (req, res) => {
  const { email, password, role } = req.body;
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  if (role && user.role !== role) {
    return res.status(401).json({
      error: `This account is not a ${role}. Select the correct account type or use the matching demo email.`,
    });
  }

  const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET as string, { expiresIn: '1d' });
  res.json({ token, user: { id: user.id, email: user.email, name: user.name, role: user.role } });
});

export default router;
