import { prisma } from '../lib/prisma';

async function main() {
  console.log('--- Testing Bybit Discount Math ---');
  const bybit = await prisma.exchange.findUnique({ where: { slug: 'bybit' } });
  
  if (!bybit) {
    console.error('Bybit not found in DB!');
    return;
  }
  
  // Base parameters
  const capital = 1000;
  const baseTakerFeePct = 0.1; // 0.1% default for Bybit
  
  // Math with Toggle OFF
  const toggleOffFeeUsdt = capital * (baseTakerFeePct / 100);
  console.log('\n[TOGGLE OFF] Native discount NOT applied');
  console.log(`Base Fee %: ${baseTakerFeePct.toFixed(4)}%`);
  console.log(`Capital: $${capital.toFixed(2)}`);
  console.log(`Calculated Fee: $${toggleOffFeeUsdt.toFixed(2)} USDT`);
  
  // Math with Toggle ON
  const discountMultiplier = 1 - (bybit.discountPercentage / 100);
  const newTakerFeePct = baseTakerFeePct * discountMultiplier;
  const toggleOnFeeUsdt = capital * (newTakerFeePct / 100);
  
  console.log('\n[TOGGLE ON] Using ' + bybit.nativeToken + ' for fee discount (' + bybit.discountPercentage + '% off)');
  console.log(`Discounted Fee %: ${newTakerFeePct.toFixed(4)}%`);
  console.log(`Calculated Fee: $${toggleOnFeeUsdt.toFixed(2)} USDT`);
  
  if (Math.abs(toggleOffFeeUsdt - 1.00) < 0.01 && Math.abs(toggleOnFeeUsdt - 0.75) < 0.01) {
    console.log('\n✅ TEST PASSED: Fees are calculating correctly (0.1% -> $1.00 | 0.0750% -> $0.75)');
  } else {
    console.error('\n❌ TEST FAILED: Fees do not match expected values.');
  }
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
