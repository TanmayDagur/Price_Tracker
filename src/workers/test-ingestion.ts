import { runCcxtIngestion } from './ccxt-ingester';
import { runDefiLlamaIngestion } from './defillama-ingester';
import { prisma } from '../lib/prisma';

async function main() {
  console.log('--- Starting Test Ingestion ---');
  
  await runCcxtIngestion();
  await runDefiLlamaIngestion();

  console.log('\n--- Verifying Database ---');
  
  const livePrices = await prisma.livePrice.count();
  const feeTiers = await prisma.feeTier.count();
  const withdrawalFees = await prisma.withdrawalFee.count();
  const stakingYields = await prisma.stakingYield.findMany();

  console.log(`Live Prices in DB: ${livePrices}`);
  console.log(`Fee Tiers in DB: ${feeTiers}`);
  console.log(`Withdrawal Fees in DB: ${withdrawalFees}`);
  console.log(`Staking Yields in DB:`);
  console.table(stakingYields.map(s => ({ Asset: s.asset, APY: `${s.apy.toFixed(2)}%`, Project: s.project })));

  console.log('--- Test Ingestion Complete ---');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
