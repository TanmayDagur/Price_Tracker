import { Metadata } from 'next';
import { getExchanges } from '../../lib/data/exchanges';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Compare Crypto Exchanges | Net-Cost Arbitrage',
  description: 'Compare trading fees, withdrawal costs, and features between top cryptocurrency exchanges.',
};

export default async function CompareHubPage() {
  let exchanges: any[] = [];
  try {
    exchanges = await getExchanges();
  } catch (error) {
    console.error('Error fetching exchanges for comparison hub:', error);
  }
  const pairs: { slug1: string, slug2: string, name1: string, name2: string }[] = [];

  for (let i = 0; i < exchanges.length; i++) {
    for (let j = i + 1; j < exchanges.length; j++) {
      pairs.push({
        slug1: exchanges[i].slug,
        slug2: exchanges[j].slug,
        name1: exchanges[i].name,
        name2: exchanges[j].name,
      });
    }
  }

  return (
    <div className="section">
      <div className="breadcrumbs">
        <a href="/" className="breadcrumbs__link">Home</a>
        <span className="breadcrumbs__separator">/</span>
        <span className="breadcrumbs__current">Compare Exchanges</span>
      </div>

      <div className="section__header">
        <h1 className="section__title">Compare Exchanges</h1>
        <p className="section__subtitle">
          Direct comparisons of maker/taker fees, available networks, and trading costs between platforms.
        </p>
      </div>

      <div className="grid-3 mt-8">
        {pairs.map((pair) => (
          <a key={`${pair.slug1}-${pair.slug2}`} href={`/compare/${pair.slug1}-vs-${pair.slug2}`} className="glass-card" style={{ display: 'block', textDecoration: 'none' }}>
            <div className="stat-card">
              <div className="stat-card__label" style={{ fontSize: '1.1rem', color: 'var(--text-primary)' }}>
                {pair.name1} vs {pair.name2}
              </div>
              <div className="stat-card__change" style={{ marginTop: '0.5rem' }}>
                Compare fees &rarr;
              </div>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
