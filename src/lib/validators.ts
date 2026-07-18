import { z } from 'zod';

export const ArbitrageParamsSchema = z.object({
  buyExchangeId: z.string().uuid(),
  sellExchangeId: z.string().uuid(),
  pairId: z.string().uuid(),
  tradeAmount: z.number().positive(),
  networkId: z.string().uuid().optional(),
});

export const LivePriceSchema = z.object({
  exchangeId: z.string().uuid(),
  pairId: z.string().uuid(),
  bidPrice: z.number().positive(),
  askPrice: z.number().positive(),
  bidQty: z.number().nonnegative(),
  askQty: z.number().nonnegative(),
});

export const NetworkFilterSchema = z.object({
  coin: z.string().min(2).max(10),
});
