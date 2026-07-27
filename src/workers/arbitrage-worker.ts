import cron from 'node-cron';
import { getLivePrices } from '../lib/data/prices';
import { getTradingPairs, getExchanges } from '../lib/data/exchanges';
import { saveArbitrageSnapshot } from '../lib/data/arbitrage';
import { ArbitrageCalculator } from '../lib/arbitrage-calculator';
import { getFeeTiers, getWithdrawalFees } from '../lib/data/fees';

export async function runArbitrageScanner() {
  console.log('Running arbitrage scanner...');
  const pairs = await getTradingPairs();
  const feeTiers = await getFeeTiers();
  const withdrawalFees = await getWithdrawalFees();
  
  for (const pair of pairs) {
    const prices = await getLivePrices(pair.id);
    if (prices.length < 2) continue; // Need at least 2 exchanges to compare

    let bestResult: any = null;
    let bestBuyEx: any = null;
    let bestSellEx: any = null;

    for (const buyEx of prices) {
      for (const sellEx of prices) {
        if (buyEx.exchangeId === sellEx.exchangeId) continue;

        const buyFeeTier = feeTiers.find(f => f.exchangeId === buyEx.exchangeId) || { takerFee: 0.1 };
        const sellFeeTier = feeTiers.find(f => f.exchangeId === sellEx.exchangeId) || { takerFee: 0.1 };
        
        // Find withdrawal fee for base asset (e.g. BTC)
        const withdrawalFee = withdrawalFees.find(w => w.exchangeId === buyEx.exchangeId && w.asset === pair.baseAsset)?.fee || 0;

        const result = ArbitrageCalculator.calculate({
          buyAskPrice: buyEx.askPrice,
          sellBidPrice: sellEx.bidPrice,
          tradeAmount: 1, // e.g., 1 BTC
          buyTakerFeePct: buyFeeTier.takerFee,
          sellTakerFeePct: sellFeeTier.takerFee,
          withdrawalFee: withdrawalFee,
          isWithdrawalInBase: true,
        });

        if (!bestResult || result.netProfitPct > bestResult.netProfitPct) {
          bestResult = result;
          bestBuyEx = buyEx;
          bestSellEx = sellEx;
        }
      }
    }

    if (bestResult) {
      await saveArbitrageSnapshot({
        pairId: pair.id,
        buyExchangeId: bestBuyEx.exchangeId,
        sellExchangeId: bestSellEx.exchangeId,
        grossSpread: bestResult.grossSpread,
        netProfit: bestResult.netProfitPct,
      });
      console.log(`Saved snapshot: Spread ${bestResult.grossSpread.toFixed(2)}%, Net ${bestResult.netProfitPct.toFixed(2)}% on ${pair.symbol} (${bestBuyEx.exchange.name} -> ${bestSellEx.exchange.name})`);
    }
  }
}

// Run every minute
cron.schedule('* * * * *', () => {
  runArbitrageScanner().catch(console.error);
});

console.log('Arbitrage worker started.');
