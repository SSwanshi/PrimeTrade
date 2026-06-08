// prisma/seed.js

const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  const demoPassword = await bcrypt.hash("password123", 10);

  const demoUser = await prisma.user.upsert({
    where: { email: "user@primetrade.com" },
    update: {},
    create: {
      email: "user@primetrade.com",
      password: demoPassword,
      name: "Demo User",
      role: "USER",
      portfolio: { create: { balance: 10000 } },
    },
    include: { portfolio: true },
  });

  await prisma.user.upsert({
    where: { email: "admin@primetrade.com" },
    update: {},
    create: {
      email: "admin@primetrade.com",
      password: demoPassword,
      name: "Demo Admin",
      role: "ADMIN",
      portfolio: { create: { balance: 10000 } },
    },
  });

  const user = demoUser;
  console.log(`Using demo user: ${user.email}`);

  // Portfolio
  await prisma.portfolio.upsert({
    where: {
      userId: user.id,
    },
    update: {},
    create: {
      userId: user.id,
      balance: 100000,
    },
  });

  // Assets
  const assets = await Promise.all([
    prisma.asset.upsert({
      where: { symbol: "BTC" },
      update: { price: 105000 },
      create: {
        symbol: "BTC",
        name: "Bitcoin",
        price: 105000,
        type: "CRYPTO",
      },
    }),

    prisma.asset.upsert({
      where: { symbol: "ETH" },
      update: { price: 5500 },
      create: {
        symbol: "ETH",
        name: "Ethereum",
        price: 5500,
        type: "CRYPTO",
      },
    }),

    prisma.asset.upsert({
      where: { symbol: "AAPL" },
      update: { price: 215 },
      create: {
        symbol: "AAPL",
        name: "Apple Inc",
        price: 215,
        type: "STOCK",
      },
    }),

    prisma.asset.upsert({
      where: { symbol: "TSLA" },
      update: { price: 340 },
      create: {
        symbol: "TSLA",
        name: "Tesla",
        price: 340,
        type: "STOCK",
      },
    }),
  ]);

  // Orders
  await prisma.order.createMany({
    data: [
      {
        userId: user.id,
        assetId: assets[0].id,
        side: "BUY",
        quantity: 0.5,
        price: 100000,
        status: "FILLED",
      },
      {
        userId: user.id,
        assetId: assets[1].id,
        side: "BUY",
        quantity: 2,
        price: 5000,
        status: "FILLED",
      },
      {
        userId: user.id,
        assetId: assets[2].id,
        side: "BUY",
        quantity: 10,
        price: 210,
        status: "PENDING",
      },
      {
        userId: user.id,
        assetId: assets[3].id,
        side: "SELL",
        quantity: 5,
        price: 350,
        status: "CANCELLED",
      },
    ],
  });

  console.log("Seed completed");
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });