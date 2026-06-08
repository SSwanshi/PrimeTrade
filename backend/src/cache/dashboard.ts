import { prisma } from '../db';
import { redis } from '../redis';

const DASHBOARD_KEY_PREFIX = 'dashboard:';
const CACHE_TTL = parseInt(process.env.DASHBOARD_CACHE_TTL_SECONDS || '60', 10);

export type DashboardData = {
  portfolio: { id?: string; userId?: string; balance: number };
  assets: Awaited<ReturnType<typeof prisma.asset.findMany>>;
  orders: Awaited<ReturnType<typeof prisma.order.findMany>>;
};

const dashboardKey = (userId: string) => `${DASHBOARD_KEY_PREFIX}${userId}`;

async function fetchDashboardFromDb(userId: string): Promise<DashboardData> {
  const [portfolio, assets, orders] = await Promise.all([
    prisma.portfolio.findUnique({ where: { userId } }),
    prisma.asset.findMany(),
    prisma.order.findMany({
      where: { userId },
      include: { asset: true },
    }),
  ]);

  return {
    portfolio: portfolio || { balance: 0 },
    assets,
    orders,
  };
}

export async function getDashboardData(userId: string): Promise<{ data: DashboardData; cached: boolean }> {
  if (redis) {
    try {
      const cached = await redis.get<DashboardData>(dashboardKey(userId));
      if (cached) {
        return { data: cached, cached: true };
      }
    } catch (err) {
      console.error('Redis get failed, falling back to database:', err);
    }
  }

  const data = await fetchDashboardFromDb(userId);

  if (redis) {
    try {
      await redis.set(dashboardKey(userId), data, { ex: CACHE_TTL });
    } catch (err) {
      console.error('Redis set failed:', err);
    }
  }

  return { data, cached: false };
}

export async function invalidateUserDashboard(userId: string): Promise<void> {
  if (!redis) return;
  try {
    await redis.del(dashboardKey(userId));
  } catch (err) {
    console.error('Redis invalidate user dashboard failed:', err);
  }
}

export async function invalidateAllDashboards(): Promise<void> {
  if (!redis) return;
  try {
    const keys = await redis.keys(`${DASHBOARD_KEY_PREFIX}*`);
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  } catch (err) {
    console.error('Redis invalidate all dashboards failed:', err);
  }
}
