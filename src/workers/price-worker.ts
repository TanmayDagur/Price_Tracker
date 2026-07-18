import { prisma } from '../lib/prisma';
import { BinanceAdapter } from './adapters/binance';
import { KrakenAdapter } from './adapters/kraken';
import { CoinbaseAdapter } from './adapters/coinbase';
import { KuCoinAdapter } from './adapters/kucoin';
import { BybitAdapter } from './adapters/bybit';
import { PriceUpdate } from './types';

const adapters = [
  new BinanceAdapter(),
  new KrakenAdapter(),
  new CoinbaseAdapter(),
  new KuCoinAdapter(),
  new BybitAdapter()
];

let exchangeIds: Record<string, string> = {};
let pairIds: Record<string, string> = {}; // "BASE-QUOTE" -> pairId
let updatesBatch: Map<string, PriceUpdate> = new Map();
let stats = { updatesReceived: 0, dbWrites: 0, errors: 0 };

async function init() {
  console.log('Initializing Price Worker...');
  const exchanges = await prisma.exchange.findMany({ select: { id: true, slug: true } });
  exchanges.forEach(ex => exchangeIds[ex.slug] = ex.id);
  
  const pairs = await prisma.tradingPair.findMany({ select: { id: true, baseAsset: true, quoteAsset: true } });
  pairs.forEach(p => pairIds[`${p.baseAsset}-${p.quoteAsset}`] = p.id);

  if (Object.keys(exchangeIds).length === 0) {
    console.error('No exchanges found in database. Did you run the seed script?');
    process.exit(1);
  }

  for (const adapter of adapters) {
    adapter.onPrice((update) => {
      stats.updatesReceived++;
      // Ensure we only store the latest update per exchange+symbol pair
      const key = `${update.exchange}-${update.symbol}`;
      updatesBatch.set(key, update);
    });

    // Don't wait for connection to finish before starting others
    adapter.connect().catch(err => console.error(`Failed to connect to ${adapter.name}:`, err));
  }

  setInterval(flushBatch, 3000);
  setInterval(simulateOtherExchanges, 3000);
  setInterval(logStats, 30000);

  // Graceful shutdown
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

async function flushBatch() {
  if (updatesBatch.size === 0) return;

  const batch = Array.from(updatesBatch.values());
  updatesBatch.clear();

  try {
    await prisma.$transaction(
      batch.map(update => {
        const exchangeId = exchangeIds[update.exchange];
        const pairId = pairIds[`${update.baseAsset}-${update.quoteAsset}`];
        
        if (!exchangeId) throw new Error(`Unknown exchange slug: ${update.exchange}`);
        if (!pairId) return null; // Ignore unknown pairs

        return prisma.livePrice.upsert({
          where: {
            exchangeId_pairId: {
              exchangeId,
              pairId
            }
          },
          update: {
            bidPrice: update.bidPrice,
            askPrice: update.askPrice,
            bidQty: 0,
            askQty: 0,
            timestamp: update.timestamp
          },
          create: {
            exchangeId,
            pairId,
            bidPrice: update.bidPrice,
            askPrice: update.askPrice,
            bidQty: 0,
            askQty: 0,
            timestamp: update.timestamp
          }
        });
      }).filter(Boolean) as any
    );
    stats.dbWrites += batch.length;
  } catch (err) {
    stats.errors++;
    console.error('Failed to flush batch:', err);
  }
}

function logStats() {
  console.log(`[Stats] Updates Received: ${stats.updatesReceived} | DB Writes: ${stats.dbWrites} | Errors: ${stats.errors}`);
}

async function shutdown() {
  console.log('Shutting down...');
  for (const adapter of adapters) {
    adapter.disconnect();
  }
  await prisma.$disconnect();
  process.exit(0);
}

async function simulateOtherExchanges() {
  try {
    const activeExchanges = ['binance', 'kraken', 'coinbase', 'kucoin', 'bybit'];
    
    // Get live prices for the 5 active exchanges
    const livePrices = await prisma.livePrice.findMany({
      where: {
        exchange: {
          slug: { in: activeExchanges }
        }
      },
      include: {
        exchange: true,
        pair: true
      }
    });

    if (livePrices.length === 0) return;

    // Get all exchanges that are NOT active
    const otherExchanges = await prisma.exchange.findMany({
      where: {
        slug: { notIn: activeExchanges }
      }
    });

    if (otherExchanges.length === 0) return;

    // For each live price, simulate prices for all other exchanges with a minor spread offset
    const operations = [];
    
    for (const price of livePrices) {
      for (const ex of otherExchanges) {
        // Deterministic multiplier based on exchange slug name + asset symbol
        const seedValue = ex.slug.charCodeAt(0) + price.pair.symbol.charCodeAt(0);
        
        // Base offset (-0.12% to +0.12%)
        const baseOffset = ((seedValue % 24) - 12) / 10000;
        
        // Small random wiggle (-0.02% to +0.02%)
        const wiggle = (Math.random() - 0.5) / 2500;
        
        const totalMultiplier = 1 + baseOffset + wiggle;
        
        operations.push(
          prisma.livePrice.upsert({
            where: {
              exchangeId_pairId: {
                exchangeId: ex.id,
                pairId: price.pairId
              }
            },
            update: {
              bidPrice: price.bidPrice * totalMultiplier,
              askPrice: price.askPrice * totalMultiplier,
              timestamp: new Date()
            },
            create: {
              exchangeId: ex.id,
              pairId: price.pairId,
              bidPrice: price.bidPrice * totalMultiplier,
              askPrice: price.askPrice * totalMultiplier,
              bidQty: 0,
              askQty: 0,
              timestamp: new Date()
            }
          })
        );
      }
    }

    // Process simulation in batches to avoid overwhelming transactions
    const batchSize = 100;
    for (let i = 0; i < operations.length; i += batchSize) {
      const batch = operations.slice(i, i + batchSize);
      await prisma.$transaction(batch);
    }
  } catch (err) {
    console.error('Failed to run exchange price simulator:', err);
  }
}

init().catch(err => {
  console.error('Initialization failed:', err);
  process.exit(1);
});
