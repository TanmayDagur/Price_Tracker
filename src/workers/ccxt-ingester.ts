import { prisma } from '../lib/prisma';
import ccxt from 'ccxt';

export async function runCcxtIngestion() {
  console.log('Starting CCXT ingestion...');
  const exchanges = await prisma.exchange.findMany({
    where: { slug: { in: ['binance', 'kraken', 'kucoin'] } }
  });

  const exchangeMap: Record<string, any> = {
    'binance': new ccxt.binance(),
    'kraken': new ccxt.kraken(),
    'kucoin': new ccxt.kucoin()
  };

  const pairs = await prisma.tradingPair.findMany();

  for (const ex of exchanges) {
    const exchangeInstance = exchangeMap[ex.slug];
    if (!exchangeInstance) continue;

    console.log(`Fetching data for ${ex.name}...`);
    try {
      await exchangeInstance.loadMarkets();

      // 1. Fetch Tickers (Live Prices)
      const tickers = await exchangeInstance.fetchTickers().catch((err: any) => {
        console.error(`Failed to fetch tickers for ${ex.name}: ${err.message}`);
        return null;
      });

      if (tickers) {
        for (const pair of pairs) {
          const ccxtSymbol = `${pair.baseAsset}/${pair.quoteAsset}`;
          const ticker = tickers[ccxtSymbol];
          if (ticker && ticker.bid && ticker.ask) {
            await prisma.livePrice.upsert({
              where: {
                exchangeId_pairId: {
                  exchangeId: ex.id,
                  pairId: pair.id
                }
              },
              update: {
                bidPrice: ticker.bid,
                askPrice: ticker.ask,
                timestamp: new Date()
              },
              create: {
                exchangeId: ex.id,
                pairId: pair.id,
                bidPrice: ticker.bid,
                askPrice: ticker.ask,
                bidQty: ticker.bidVolume || 0,
                askQty: ticker.askVolume || 0,
                timestamp: new Date()
              }
            });
          }
        }
        console.log(`Saved live prices for ${ex.name}`);
      }

      // 2. Fetch Trading Fees
      const tradingFees = await exchangeInstance.fetchTradingFees().catch((err: any) => {
        console.error(`Failed to fetch trading fees for ${ex.name}: ${err.message}`);
        return null;
      });

      if (tradingFees) {
        const defaultFee = Object.values(tradingFees)[0] as { maker?: number, taker?: number };
        if (defaultFee) {
          const maker = (defaultFee.maker || 0.001) * 100;
          const taker = (defaultFee.taker || 0.001) * 100;
          await prisma.feeTier.upsert({
            where: {
              exchangeId_tierName: {
                exchangeId: ex.id,
                tierName: 'Base (CCXT)'
              }
            },
            update: {
              makerFee: maker,
              takerFee: taker
            },
            create: {
              exchangeId: ex.id,
              tierName: 'Base (CCXT)',
              makerFee: maker,
              takerFee: taker,
              minVolume: 0
            }
          });
          console.log(`Saved trading fees for ${ex.name}`);
        }
      }

      // 3. Fetch Deposit/Withdraw Fees
      let currencies = undefined;
      if (exchangeInstance.has['fetchDepositWithdrawFees']) {
         try {
            currencies = await exchangeInstance.fetchDepositWithdrawFees();
         } catch (e) {}
      }
      if (!currencies && exchangeInstance.currencies) {
         currencies = exchangeInstance.currencies;
      }
      
      if (currencies) {
        for (const asset of ['USDT', 'USDC', 'BTC', 'ETH']) {
          let fee = undefined;
          if (currencies[asset]) {
             if (typeof currencies[asset].withdraw === 'number') fee = currencies[asset].withdraw;
             else if (typeof currencies[asset].fee === 'number') fee = currencies[asset].fee;
             else if (currencies[asset].fees && typeof currencies[asset].fees.withdraw === 'number') fee = currencies[asset].fees.withdraw;
          }
          
          if (fee !== undefined) {
            const network = await prisma.network.upsert({
              where: { slug: 'default' },
              update: {},
              create: { name: 'Default Network', slug: 'default' }
            });

            await prisma.withdrawalFee.upsert({
              where: {
                exchangeId_networkId_asset: {
                  exchangeId: ex.id,
                  networkId: network.id,
                  asset: asset
                }
              },
              update: {
                fee: fee
              },
              create: {
                exchangeId: ex.id,
                networkId: network.id,
                asset: asset,
                fee: fee,
                minWithdrawal: 0
              }
            });
          }
        }
        console.log(`Saved withdrawal fees for ${ex.name}`);
      }

    } catch (err: any) {
      console.error(`Error processing ${ex.name}: ${err.message}`);
    }
  }
  console.log('CCXT ingestion complete.');
}
