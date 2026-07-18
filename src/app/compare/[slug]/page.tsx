import { Metadata } from 'next';
import { getExchanges } from '../../../lib/data/exchanges';

export async function generateStaticParams() {
  try {
    const exchanges = await getExchanges();
    const slugs: { slug: string }[] = [];

    for (let i = 0; i < exchanges.length; i++) {
      for (let j = i + 1; j < exchanges.length; j++) {
        slugs.push({ slug: `${exchanges[i].slug}-vs-${exchanges[j].slug}` });
      }
    }

    return slugs;
  } catch (error) {
    console.error('Error generating static params for compare pages:', error);
    return [];
  }
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const { slug } = await params;
  const [ex1, ex2] = slug.split('-vs-');
  
  return {
    title: `Compare ${ex1.toUpperCase()} vs ${ex2.toUpperCase()} Trading Fees & Features`,
    description: `Detailed comparison between ${ex1.toUpperCase()} and ${ex2.toUpperCase()} for crypto arbitrage. See which has lower fees, better liquidity, and cheaper withdrawals.`,
  };
}

export default async function ComparePage({ params }: { params: { slug: string } }) {
  const { slug } = await params;
  const [ex1, ex2] = slug.split('-vs-');

  return (
    <div className="section">
      <div className="section__header">
        <h1 className="section__title">
          <span className="text-gradient" style={{ textTransform: 'capitalize' }}>{ex1}</span> vs <span className="text-gradient" style={{ textTransform: 'capitalize' }}>{ex2}</span>
        </h1>
        <p className="section__subtitle">
          Which exchange is better for your arbitrage strategy? Compare fees, liquidity, and features.
        </p>
      </div>

      <div className="comparison">
        <div className="glass-card">
          <h2 style={{ textTransform: 'capitalize' }}>{ex1}</h2>
          <div className="stat-card mt-4">
            <div className="stat-card__label">Maker/Taker Fee</div>
            <div className="stat-card__value">0.10% / 0.10%</div>
          </div>
          <p className="mt-4 text-sm text-gray-400">Excellent liquidity for major pairs.</p>
        </div>

        <div className="comparison__vs">VS</div>

        <div className="glass-card">
          <h2 style={{ textTransform: 'capitalize' }}>{ex2}</h2>
          <div className="stat-card mt-4">
            <div className="stat-card__label">Maker/Taker Fee</div>
            <div className="stat-card__value">0.16% / 0.26%</div>
          </div>
          <p className="mt-4 text-sm text-gray-400">Great fiat off-ramp capabilities.</p>
        </div>
      </div>
    </div>
  );
}
