import { Metadata } from 'next';
import { getWithdrawalFees } from '../../../lib/data/fees';

export async function generateStaticParams() {
  return [
    { coin: 'btc' },
    { coin: 'eth' },
    { coin: 'usdt' },
    { coin: 'usdc' },
    { coin: 'sol' },
    { coin: 'ada' },
    { coin: 'doge' },
    { coin: 'xrp' },
    { coin: 'dot' },
    { coin: 'link' },
    { coin: 'matic' },
    { coin: 'trx' }
  ];
}

export async function generateMetadata({ params }: { params: { coin: string } }): Promise<Metadata> {
  const { coin } = await params;
  
  return {
    title: `Cheapest ${coin.toUpperCase()} Withdrawal Fees - Exchange Comparison`,
    description: `Find out which crypto exchange has the lowest network fees to withdraw ${coin.toUpperCase()} across ERC-20, TRC-20, and native networks.`,
  };
}

export default async function CheapestWithdrawalPage({ params }: { params: { coin: string } }) {
  const { coin } = await params;
  
  let fees: any[] = [];
  try {
    fees = await getWithdrawalFees(coin.toUpperCase());
  } catch (error) {
    console.error(`Error fetching withdrawal fees for ${coin}:`, error);
  }

  // Sort fees from lowest to highest overall
  const sortedFees = [...fees].sort((a, b) => a.fee - b.fee);

  // Group fees by exchange
  const groupedFeesMap: Record<string, { exchangeName: string; fees: typeof sortedFees }> = {};
  sortedFees.forEach(fee => {
    const exchangeName = fee.exchange.name;
    if (!groupedFeesMap[exchangeName]) {
      groupedFeesMap[exchangeName] = { exchangeName, fees: [] };
    }
    groupedFeesMap[exchangeName].fees.push(fee);
  });
  
  // Sort each exchange's networks so the cheapest is first
  const groupedFees = Object.values(groupedFeesMap).map(group => {
    group.fees.sort((a, b) => a.fee - b.fee);
    return group;
  });

  return (
    <div className="section animate-fade-in">
      <div className="breadcrumbs">
        <a href="/" className="breadcrumbs__link">Home</a>
        <span className="breadcrumbs__separator">/</span>
        <a href="/cheapest-withdrawal" className="breadcrumbs__link">Withdrawal Fees</a>
        <span className="breadcrumbs__separator">/</span>
        <span style={{ color: 'var(--text-primary)' }}>{coin.toUpperCase()}</span>
      </div>

      <div className="section__header">
        <h1 className="section__title">
          Cheapest <span className="text-gradient">{coin.toUpperCase()}</span> Withdrawals
        </h1>
        <p className="section__subtitle">
          Don't lose your arbitrage profits to high withdrawal fees. Compare {coin.toUpperCase()} transfer costs across top exchanges.
        </p>
      </div>

      <div className="mb-8">
        <h2 className="mb-4">Summary: Cheapest Routes</h2>
        <div className="glass-card">
          <table className="data-table">
            <thead>
              <tr>
                <th>Exchange</th>
                <th>Cheapest Network</th>
                <th>Fee</th>
                <th>Min Withdrawal</th>
              </tr>
            </thead>
            <tbody>
              {sortedFees.length > 0 ? (
                // Only show the single cheapest network per exchange in the summary table
                Object.values(groupedFeesMap).map(group => {
                  const cheapestFee = group.fees[0];
                  return (
                    <tr key={cheapestFee.id}>
                      <td style={{ fontWeight: 'bold' }}>{cheapestFee.exchange.name}</td>
                      <td><span className="badge badge--network">{cheapestFee.network.name}</span></td>
                      <td className="font-mono text-gradient" style={{ fontWeight: 'bold' }}>
                        {cheapestFee.fee} {coin.toUpperCase()}
                      </td>
                      <td className="text-secondary">{cheapestFee.minWithdrawal} {coin.toUpperCase()}</td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={4}>No withdrawal data found for {coin.toUpperCase()}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <h2 className="mb-4">Exchange Network Breakdown</h2>
        <div className="grid-auto stagger">
          {groupedFees.length > 0 ? groupedFees.map((group) => (
            <div key={group.exchangeName} className="glass-card">
              <h3 style={{ borderBottom: '1px solid var(--border-subtle)', paddingBottom: 'var(--space-sm)', marginBottom: 'var(--space-md)', color: 'var(--text-primary)', display: 'flex', justifyContent: 'between', alignItems: 'center' }}>
                {group.exchangeName}
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                {group.fees.map((fee, idx) => (
                  <div key={fee.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <span className="badge badge--network" style={{ alignSelf: 'start' }}>
                        {fee.network.name}
                      </span>
                      {idx === 0 && (
                        <span className="badge badge--profit" style={{ fontSize: '0.6rem', padding: '1px 6px', width: 'fit-content' }}>
                          Cheapest
                        </span>
                      )}
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div className="font-mono" style={{ fontWeight: 700, fontSize: '1rem', color: idx === 0 ? 'var(--color-profit)' : 'var(--text-primary)' }}>
                        {fee.fee} {coin.toUpperCase()}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                        Min: {fee.minWithdrawal} {coin.toUpperCase()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )) : (
            <div className="glass-card w-full">
              <p>No detailed network breakdown available.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
