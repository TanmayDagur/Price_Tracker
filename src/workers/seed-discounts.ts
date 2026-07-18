import { prisma } from '../lib/prisma';

const discounts = [
  { slug: 'binance', nativeToken: 'BNB', discountPercentage: 25 },
  { slug: 'bybit', nativeToken: 'MNT', discountPercentage: 25 },
  { slug: 'kucoin', nativeToken: 'KCS', discountPercentage: 20 },
];

async function main() {
  console.log('Seeding exchange discounts...');
  
  for (const discount of discounts) {
    const exchange = await prisma.exchange.findUnique({
      where: { slug: discount.slug }
    });
    
    if (exchange) {
      await prisma.exchange.update({
        where: { slug: discount.slug },
        data: {
          nativeToken: discount.nativeToken,
          nativeDiscountAvailable: true,
          discountPercentage: discount.discountPercentage
        }
      });
      console.log(`Updated ${exchange.name} with ${discount.nativeToken} discount (${discount.discountPercentage}%).`);
    } else {
      console.log(`Exchange ${discount.slug} not found in database.`);
    }
  }
  console.log('Finished seeding discounts.');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
