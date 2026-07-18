import { prisma } from '../prisma';
import { LivePriceSchema } from '../validators';
import { z } from 'zod';

export async function getLivePrices(pairId?: string) {
  return prisma.livePrice.findMany({
    where: pairId ? { pairId } : undefined,
    include: {
      exchange: true,
      pair: true,
    },
  });
}

export async function upsertLivePrice(data: z.infer<typeof LivePriceSchema>) {
  const parsed = LivePriceSchema.parse(data);
  return prisma.livePrice.upsert({
    where: {
      exchangeId_pairId: {
        exchangeId: parsed.exchangeId,
        pairId: parsed.pairId,
      },
    },
    update: {
      bidPrice: parsed.bidPrice,
      askPrice: parsed.askPrice,
      bidQty: parsed.bidQty,
      askQty: parsed.askQty,
      timestamp: new Date(),
    },
    create: {
      exchangeId: parsed.exchangeId,
      pairId: parsed.pairId,
      bidPrice: parsed.bidPrice,
      askPrice: parsed.askPrice,
      bidQty: parsed.bidQty,
      askQty: parsed.askQty,
      timestamp: new Date(),
    },
  });
}
