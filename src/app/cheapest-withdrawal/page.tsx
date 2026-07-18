import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Cheapest Crypto Withdrawal Fees | Net-Cost Arbitrage',
  description: 'Compare the cheapest network withdrawal fees for major cryptocurrencies across different exchanges.',
};

const COINS = [
  { slug: 'btc', name: 'Bitcoin (BTC)' },
  { slug: 'eth', name: 'Ethereum (ETH)' },
  { slug: 'usdt', name: 'Tether (USDT)' },
  { slug: 'usdc', name: 'USD Coin (USDC)' },
  { slug: 'sol', name: 'Solana (SOL)' },
  { slug: 'ada', name: 'Cardano (ADA)' },
  { slug: 'doge', name: 'Dogecoin (DOGE)' },
  { slug: 'xrp', name: 'Ripple (XRP)' },
  { slug: 'dot', name: 'Polkadot (DOT)' },
  { slug: 'link', name: 'Chainlink (LINK)' },
  { slug: 'matic', name: 'Polygon (MATIC)' },
  { slug: 'trx', name: 'TRON (TRX)' },
];

export default function CheapestWithdrawalHubPage() {
  return (
    <div className="section">
      <div className="breadcrumbs">
        <a href="/" className="breadcrumbs__link">Home</a>
        <span className="breadcrumbs__separator">/</span>
        <span className="breadcrumbs__current">Withdrawal Fees</span>
      </div>

      <div className="section__header">
        <h1 className="section__title">Compare Withdrawal Fees</h1>
        <p className="section__subtitle">
          Select an asset to view the cheapest withdrawal routes and network fees across all supported exchanges.
        </p>
      </div>

      <div className="grid-3 mt-8">
        {COINS.map((coin) => (
          <a key={coin.slug} href={`/cheapest-withdrawal/${coin.slug}`} className="glass-card" style={{ display: 'block', textDecoration: 'none' }}>
            <div className="stat-card">
              <div className="stat-card__label" style={{ fontSize: '1.2rem', color: 'var(--text-primary)' }}>
                {coin.name}
              </div>
              <div className="stat-card__change" style={{ marginTop: '0.5rem' }}>
                View networks and withdrawal costs &rarr;
              </div>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
