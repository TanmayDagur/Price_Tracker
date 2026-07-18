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

  const url = `${process.env.NEXT_PUBLIC_APP_URL || 'https://price-tracker-tb8j.vercel.app'}/blog/${slug}`;

  return {
    title: `${post.metadata.title} | Net-Cost Arbitrage Blog`,
    description: post.metadata.description,
    openGraph: {
      title: post.metadata.title,
      description: post.metadata.description,
      type: 'article',
      url: url,
      authors: [post.metadata.author],
      publishedTime: new Date(post.metadata.date).toISOString(),
      tags: post.metadata.tags,
    },
    twitter: {
      card: 'summary_large_image',
      title: post.metadata.title,
      description: post.metadata.description,
    },
    alternates: {
      canonical: url,
    },
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
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([
            {
              "@context": "https://schema.org",
              "@type": "Article",
              "headline": post.metadata.title,
              "description": post.metadata.description,
              "author": {
                "@type": "Person",
                "name": post.metadata.author
              },
              "datePublished": new Date(post.metadata.date).toISOString(),
              "publisher": {
                "@type": "Organization",
                "name": "Net-Cost Arbitrage"
              }
            },
            {
              "@context": "https://schema.org",
              "@type": "BreadcrumbList",
              "itemListElement": [
                {
                  "@type": "ListItem",
                  "position": 1,
                  "name": "Home",
                  "item": `${process.env.NEXT_PUBLIC_APP_URL || 'https://price-tracker-tb8j.vercel.app'}/`
                },
                {
                  "@type": "ListItem",
                  "position": 2,
                  "name": "Blog",
                  "item": `${process.env.NEXT_PUBLIC_APP_URL || 'https://price-tracker-tb8j.vercel.app'}/blog`
                },
                {
                  "@type": "ListItem",
                  "position": 3,
                  "name": post.metadata.title,
                  "item": `${process.env.NEXT_PUBLIC_APP_URL || 'https://price-tracker-tb8j.vercel.app'}/blog/${slug}`
                }
              ]
            }
          ])
        }}
      />
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
            <span>Published on {new Date(post.metadata.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })} &bull; {post.metadata.readTime}</span>
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
