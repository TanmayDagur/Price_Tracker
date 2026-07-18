import { prisma } from '../lib/prisma';

export async function runDefiLlamaIngestion() {
  console.log('Starting DeFiLlama ingestion...');
  try {
    const response = await fetch('https://yields.llama.fi/pools');
    if (!response.ok) {
      throw new Error(`Failed to fetch from DeFiLlama: ${response.status}`);
    }
    const data = await response.json();
    
    const targetAssets = ['USDT', 'USDC', 'ETH', 'BTC'];
    const bestApys: Record<string, { apy: number, project: string }> = {};

    for (const pool of data.data) {
      if (targetAssets.includes(pool.symbol)) {
        if (!bestApys[pool.symbol] || pool.apy > bestApys[pool.symbol].apy) {
           bestApys[pool.symbol] = {
              apy: pool.apy,
              project: pool.project
           };
        }
      }
    }

    for (const asset of targetAssets) {
      const best = bestApys[asset];
      if (best) {
        await prisma.stakingYield.upsert({
          where: { asset: asset },
          update: {
            apy: best.apy,
            project: best.project,
            timestamp: new Date()
          },
          create: {
            asset: asset,
            apy: best.apy,
            project: best.project
          }
        });
        console.log(`Saved DeFiLlama APY for ${asset}: ${best.apy.toFixed(2)}% (${best.project})`);
      }
    }
    
    console.log('DeFiLlama ingestion complete.');
  } catch (error: any) {
    console.error(`Error in DeFiLlama ingestion: ${error.message}`);
  }
}
