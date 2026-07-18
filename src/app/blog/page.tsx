import { Metadata } from 'next';
import { getAllPosts } from '../../lib/markdown';
import BlogList from '../../components/BlogList';

export const revalidate = 3600; // Static Cache optimization

export const metadata: Metadata = {
  title: 'Crypto Arbitrage & Gas Fees Blog | Net-Cost Arbitrage',
  description: 'Expert guides, strategies, and optimizations for cross-exchange cryptocurrency arbitrage and fee reductions.',
};

export default function BlogHubPage() {
  const posts = getAllPosts();

  return (
    <div className="section">
      <div className="breadcrumbs">
        <a href="/" className="breadcrumbs__link">Home</a>
        <span className="breadcrumbs__separator">/</span>
        <span className="breadcrumbs__current">Blog</span>
      </div>

      <div className="section__header" style={{ marginBottom: 'var(--space-xl)' }}>
        <h1 className="section__title">
          Arbitrage & Fee <span className="text-gradient">Insights</span>
        </h1>
        <p className="section__subtitle">
          In-depth guides and analysis to optimize your network routes, dodge high exchange fees, and secure better trading spreads.
        </p>
      </div>

      <BlogList initialPosts={posts} />
    </div>
  );
}
