import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getPostBySlug, getAllPosts } from '../../../lib/markdown';

export const revalidate = 3600;

interface Props {
  params: {
    slug: string;
  };
}

export async function generateStaticParams() {
  const posts = getAllPosts();
  return posts.map((p) => ({
    slug: p.slug,
  }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) {
    return {
      title: 'Article Not Found',
    };
  }

  return {
    title: `${post.metadata.title} | Net-Cost Arbitrage Blog`,
    description: post.metadata.description,
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = getPostBySlug(slug);

  if (!post) {
    notFound();
  }

  return (
    <div className="section animate-fade-in" style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div className="breadcrumbs">
        <a href="/" className="breadcrumbs__link">Home</a>
        <span className="breadcrumbs__separator">/</span>
        <a href="/blog" className="breadcrumbs__link">Blog</a>
        <span className="breadcrumbs__separator">/</span>
        <span style={{ color: 'var(--text-primary)', maxWidth: '280px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{post.metadata.title}</span>
      </div>

      <article className="glass-card" style={{ padding: 'var(--space-2xl) var(--space-xl)', cursor: 'default' }}>
        {/* Header Metadata */}
        <header style={{ marginBottom: 'var(--space-xl)', borderBottom: '1px solid var(--border-subtle)', paddingBottom: 'var(--space-lg)' }}>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: 'var(--space-sm)' }}>
            {post.metadata.tags.map(tag => (
              <span key={tag} className="badge badge--info">{tag}</span>
            ))}
          </div>
          <h1 style={{ fontSize: '2.2rem', color: 'var(--text-primary)', marginBottom: 'var(--space-md)', lineHeight: '1.2' }}>
            {post.metadata.title}
          </h1>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem', color: 'var(--text-secondary)', flexWrap: 'wrap', gap: '8px' }}>
            <span>By <strong style={{ color: 'var(--text-primary)' }}>{post.metadata.author}</strong></span>
            <span>Published on {new Date(post.metadata.date).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })} &bull; {post.metadata.readTime}</span>
          </div>
        </header>

        {/* Content Body */}
        <div 
          dangerouslySetInnerHTML={{ __html: post.html }} 
          style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}
        />
      </article>
    </div>
  );
}
