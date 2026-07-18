import { prisma } from '../prisma';

export async function getArbitrageSnapshots(limit = 50, pairSymbol?: string) {
  return prisma.arbitrageSnapshot.findMany({
    where: pairSymbol ? { pair: { symbol: pairSymbol } } : undefined,
    orderBy: { timestamp: 'desc' },
    take: limit,
    include: {
      buyExchange: true,
      sellExchange: true,
      pair: true,
    },
  });
}

export async function getLatestSnapshotsPerPair(pairIds: string[]) {
  const snapshots = await Promise.all(
    pairIds.map(async (pairId) => {
      return prisma.arbitrageSnapshot.findFirst({
        where: { pairId },
        orderBy: { timestamp: 'desc' },
        include: {
          buyExchange: true,
          sellExchange: true,
          pair: true,
        },
      });
    })
  );
  return snapshots.filter((s): s is NonNullable<typeof s> => s !== null);
}


export async function getTopArbitrageOpportunities() {
  // In a real application, you might use raw SQL for a complex top-N-per-pair query,
  // but here we can just fetch the latest for active pairs.
  return prisma.arbitrageSnapshot.findMany({
    where: { netProfit: { gt: 0 } },
    orderBy: { netProfit: 'desc' },
    take: 10,
    include: {
      buyExchange: true,
      sellExchange: true,
      pair: true,
    },
  });
}

export async function saveArbitrageSnapshot(data: {
  pairId: string;
  buyExchangeId: string;
  sellExchangeId: string;
  grossSpread: number;
  netProfit: number;
}) {
  return prisma.arbitrageSnapshot.create({
    data,
  });
}
