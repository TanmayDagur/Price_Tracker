import { Metadata } from 'next';
import { getTradingPairs } from '../../lib/data/exchanges';
import { getArbitrageSnapshots, getLatestSnapshotsPerPair } from '../../lib/data/arbitrage';
import AutoRefresh from '../../components/AutoRefresh';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Live Crypto Arbitrage Pairs | Net-Cost Arbitrage',
  description: 'View live arbitrage opportunities across major cryptocurrency trading pairs.',
};

export default async function ArbitrageHubPage() {
  let pairs: any[] = [];
  let recentSnapshots: any[] = [];
  try {
    pairs = await getTradingPairs();
    recentSnapshots = await getLatestSnapshotsPerPair(pairs.map(p => p.id));
  } catch (error) {
    console.error('Error fetching database records for arbitrage hub page:', error);
  }

  return (
    <div className="section">
      <AutoRefresh interval={5000} />
      <div className="breadcrumbs">
        <a href="/" className="breadcrumbs__link">Home</a>
        <span className="breadcrumbs__separator">/</span>
        <span className="breadcrumbs__current">Arbitrage Pairs</span>
      </div>

      <div className="section__header">
        <h1 className="section__title">Arbitrage Markets</h1>
        <p className="section__subtitle">
          Select a trading pair to view real-time cross-exchange spreads and net profit calculations.
        </p>
      </div>

      <div className="grid-3 mt-8">
        {pairs.map((pair) => {
          const pairSnaps = recentSnapshots.filter(s => s.pair.symbol === pair.symbol);
          const bestSnap = pairSnaps.length > 0 
            ? pairSnaps.reduce((prev, current) => (prev.netProfit > current.netProfit) ? prev : current)
            : null;

          return (
            <a key={pair.id} href={`/arbitrage/${pair.symbol.toLowerCase()}`} className="glass-card" style={{ display: 'block', textDecoration: 'none' }}>
              <div className="stat-card">
                <div className="stat-card__label" style={{ fontSize: '1.2rem', color: 'var(--text-primary)' }}>
                  {pair.symbol}
                </div>
                {bestSnap ? (
                  <>
                    <div className={`stat-card__value ${bestSnap.netProfit > 0 ? 'stat-card__value--profit' : 'stat-card__value--loss'}`} style={{ fontSize: '1.5rem', marginTop: '0.5rem' }}>
                      {bestSnap.netProfit > 0 ? '+' : ''}{bestSnap.netProfit.toFixed(2)}% Net
                    </div>
                    <div className="stat-card__change" style={{ marginTop: '0.5rem' }}>
                      Best Route: {bestSnap.buyExchange.name} &rarr; {bestSnap.sellExchange.name}
                    </div>
                  </>
                ) : (
                  <div className="stat-card__value" style={{ fontSize: '1rem', marginTop: '1rem', color: 'var(--text-muted)' }}>
                    Analyzing data...
                  </div>
                )}
              </div>
            </a>
          );
        })}
      </div>
    </div>
  );
}
