import { getTradingPairs, getExchanges } from '../lib/data/exchanges';
import { getLivePrices } from '../lib/data/prices';
import { getFeeTiers, getWithdrawalFees } from '../lib/data/fees';
import AutoRefresh from '../components/AutoRefresh';
import ArbitrageSimulator from '../components/ArbitrageSimulator';

export const dynamic = 'force-dynamic';

export default async function Home() {
  let pairs: any[] = [];
  let livePrices: any[] = [];
  let feeTiers: any[] = [];
  let withdrawalFees: any[] = [];
  let exchanges: any[] = [];

  try {
    pairs = await getTradingPairs();
    livePrices = await getLivePrices();
    feeTiers = await getFeeTiers();
    withdrawalFees = await getWithdrawalFees();
    exchanges = await getExchanges();
  } catch (error) {
    console.error('Error fetching database records for simulator:', error);
  }
  
  return (
    <div className="section">
      <AutoRefresh interval={5000} />
      <div className="hero">
        <h1 className="hero__title">
          <span className="text-gradient">True Net Profit</span> Arbitrage
        </h1>
        <p className="hero__subtitle">
          We factor in live spreads, maker/taker fees, and withdrawal costs to show you the real margin across 5 major exchanges.
        </p>
        <div className="hero__actions">
          <a href="/arbitrage" className="btn btn--primary">View Arbitrage Opportunities</a>
          <a href="/cheapest-withdrawal" className="btn btn--ghost">Compare Withdrawal Fees</a>
        </div>
      </div>

      <ArbitrageSimulator
        pairs={pairs}
        livePrices={livePrices}
        feeTiers={feeTiers}
        withdrawalFees={withdrawalFees}
        exchanges={exchanges}
      />
    </div>
  );
}
