import { Metadata } from 'next';
import { getTradingPairs } from '../../../lib/data/exchanges';
import { getArbitrageSnapshots } from '../../../lib/data/arbitrage';
import AutoRefresh from '../../../components/AutoRefresh';

export const dynamic = 'force-dynamic';

export async function generateStaticParams() {
  try {
    const pairs = await getTradingPairs();
    return pairs.map(p => ({ pair: p.symbol.toLowerCase() }));
  } catch (error) {
    console.error('Error generating static params for arbitrage pages:', error);
    return [];
  }
}

export async function generateMetadata({ params }: { params: { pair: string } }): Promise<Metadata> {
  const { pair } = await params;
  
  return {
    title: `Live ${pair.toUpperCase()} Arbitrage Spreads & Profit Calculator`,
    description: `Track real-time cross-exchange arbitrage opportunities for ${pair.toUpperCase()}. See gross spreads and true net profit after trading and withdrawal fees.`,
  };
}

export default async function ArbitragePairPage({ params }: { params: { pair: string } }) {
  const { pair } = await params;
  const symbol = pair.toUpperCase();
  
  // In a real app we'd fetch this dynamically, here we just show a template using recent snapshots
  let pairSnapshots: any[] = [];
  try {
    pairSnapshots = await getArbitrageSnapshots(20, symbol);
  } catch (error) {
    console.error(`Error fetching arbitrage snapshots for ${symbol}:`, error);
  }

  return (
    <div className="section">
      <AutoRefresh interval={5000} />
      <div className="breadcrumbs">
        <a href="/" className="breadcrumbs__link">Home</a>
        <span className="breadcrumbs__separator">/</span>
        <a href="/arbitrage" className="breadcrumbs__link">Arbitrage Pairs</a>
        <span className="breadcrumbs__separator">/</span>
        <span style={{ color: 'var(--text-primary)' }}>{symbol}</span>
      </div>

      <div className="section__header">
        <h1 className="section__title">
          <span className="text-gradient">{symbol}</span> Arbitrage Scanner
        </h1>
        <p className="section__subtitle">
          Live true net-profit calculations across Binance, Kraken, Coinbase, KuCoin, and Bybit.
        </p>
      </div>

      <div className="glass-card mb-8">
        <h3>Recent Opportunities</h3>
        <table className="data-table mt-4">
          <thead>
            <tr>
              <th>Time</th>
              <th>Route</th>
              <th>Gross Spread</th>
              <th>Net Profit</th>
            </tr>
          </thead>
          <tbody>
            {pairSnapshots.length > 0 ? pairSnapshots.map((snap) => (
              <tr key={snap.id}>
                <td>{snap.timestamp.toLocaleTimeString()}</td>
                <td>{snap.buyExchange.name} &rarr; {snap.sellExchange.name}</td>
                <td>{snap.grossSpread.toFixed(2)}%</td>
                <td>
                  <span className={`badge ${snap.netProfit > 0 ? 'badge--profit' : 'badge--loss'}`}>
                    {snap.netProfit > 0 ? '+' : ''}{snap.netProfit.toFixed(2)}%
                  </span>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan={4}>No recent snapshots for this pair. The scanner may need a moment.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      <div className="glass-card">
        <h3>How we calculate {symbol} True Net Profit</h3>
        <div className="waterfall mt-4">
          <div className="waterfall__row waterfall__row--header">
            <span>Step</span>
            <span>Impact</span>
          </div>
          <div className="waterfall__row">
            <span className="waterfall__label">Gross Spread</span>
            <span className="waterfall__value waterfall__value--positive">+1.20%</span>
          </div>
          <div className="waterfall__divider"></div>
          <div className="waterfall__row">
            <span className="waterfall__label">Maker/Taker Buy Fee</span>
            <span className="waterfall__value waterfall__value--negative">-0.10%</span>
          </div>
          <div className="waterfall__divider"></div>
          <div className="waterfall__row">
            <span className="waterfall__label">Maker/Taker Sell Fee</span>
            <span className="waterfall__value waterfall__value--negative">-0.10%</span>
          </div>
          <div className="waterfall__divider"></div>
          <div className="waterfall__row">
            <span className="waterfall__label">Withdrawal Gas Fee</span>
            <span className="waterfall__value waterfall__value--negative">-0.05%</span>
          </div>
          <div className="waterfall__divider"></div>
          <div className="waterfall__row waterfall__row--result profitable">
            <span className="waterfall__label" style={{ color: 'var(--text-primary)' }}>True Net Profit</span>
            <span className="waterfall__value waterfall__value--positive">+0.95%</span>
          </div>
        </div>
      </div>
    </div>
  );
}
