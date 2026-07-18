import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';

export async function POST(request: Request) {
  try {
    const { baseAsset, quoteAsset } = await request.json();
    if (!baseAsset || !quoteAsset) {
      return NextResponse.json({ error: 'Missing baseAsset or quoteAsset' }, { status: 400 });
    }

    const symbol = `${baseAsset.toUpperCase()}-${quoteAsset.toUpperCase()}`;

    // Create or activate the trading pair
    const pair = await prisma.tradingPair.upsert({
      where: { symbol },
      update: { isActive: true },
      create: {
        symbol,
        baseAsset: baseAsset.toUpperCase(),
        quoteAsset: quoteAsset.toUpperCase(),
        isActive: true,
      },
    });

    // Populate standard default withdrawal fees for the new coin across all exchanges
    const exchanges = await prisma.exchange.findMany();
    const networks = await prisma.network.findMany();
    const bscNet = networks.find((n: any) => n.slug === 'bsc') || networks[0];

    if (exchanges.length > 0 && bscNet) {
      const asset = baseAsset.toUpperCase();
      let defaultFee = 1.0;
      
      // Reasonable defaults based on typical network fees
      if (asset === 'ADA') defaultFee = 1.0;
      else if (asset === 'DOT') defaultFee = 0.1;
      else if (asset === 'LINK') defaultFee = 0.5;
      else if (asset === 'MATIC') defaultFee = 5.0;
      else if (asset === 'DOGE') defaultFee = 5.0;
      else if (asset === 'XRP') defaultFee = 0.25;
      else if (asset === 'SHIB') defaultFee = 50000;
      else if (asset === 'TRX') defaultFee = 2.0;

      for (const ex of exchanges) {
        await prisma.withdrawalFee.upsert({
          where: {
            exchangeId_networkId_asset: {
              exchangeId: ex.id,
              networkId: bscNet.id,
              asset,
            }
          },
          update: {},
          create: {
            exchangeId: ex.id,
            networkId: bscNet.id,
            asset,
            fee: defaultFee,
            minWithdrawal: defaultFee * 2,
          }
        });
      }
    }

    return NextResponse.json({ success: true, pair });
  } catch (error: any) {
    console.error('Error in POST /api/pairs:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
