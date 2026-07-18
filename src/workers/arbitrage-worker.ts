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

        if (result.grossSpread > 0.01) { // Save any spread > 0.01% so the UI has data to show
          await saveArbitrageSnapshot({
            pairId: pair.id,
            buyExchangeId: buyEx.exchangeId,
            sellExchangeId: sellEx.exchangeId,
            grossSpread: result.grossSpread,
            netProfit: result.netProfitPct,
          });
          console.log(`Saved snapshot: Spread ${result.grossSpread.toFixed(2)}%, Net ${result.netProfitPct.toFixed(2)}% on ${pair.symbol} (${buyEx.exchange.name} -> ${sellEx.exchange.name})`);
        }
      }
    }
  }
}

// Run every minute
cron.schedule('* * * * *', () => {
  runArbitrageScanner().catch(console.error);
});

console.log('Arbitrage worker started.');
