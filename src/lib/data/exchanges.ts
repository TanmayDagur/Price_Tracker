import { prisma } from '../prisma';

export async function getExchanges() {
  return prisma.exchange.findMany({
    where: { isActive: true },
    orderBy: { name: 'asc' },
  });
}

export async function getTradingPairs() {
  return prisma.tradingPair.findMany({
    where: { isActive: true },
    orderBy: { symbol: 'asc' },
  });
}

export async function getExchangeBySlug(slug: string) {
  return prisma.exchange.findUnique({
    where: { slug },
  });
}
