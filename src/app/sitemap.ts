import { MetadataRoute } from 'next';
import { getTradingPairs, getExchanges } from '@/lib/data/exchanges';
import { getAllPosts } from '@/lib/markdown';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const routes: MetadataRoute.Sitemap = [
    {
      url: APP_URL,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
  ];

  // Try to safely fetch dynamic routes. If DB is empty, just return base sitemap.
  try {
    const pairs = await getTradingPairs();
    pairs.forEach((pair) => {
      routes.push({
        url: `${APP_URL}/arbitrage/${pair.symbol.toLowerCase()}`,
        lastModified: new Date(),
        changeFrequency: 'hourly',
        priority: 0.9,
      });
    });

    const exchanges = await getExchanges();
    for (let i = 0; i < exchanges.length; i++) {
      for (let j = i + 1; j < exchanges.length; j++) {
        routes.push({
          url: `${APP_URL}/compare/${exchanges[i].slug}-vs-${exchanges[j].slug}`,
          lastModified: new Date(),
          changeFrequency: 'weekly',
          priority: 0.8,
        });
      }
    }

    const coins = ['btc', 'eth', 'usdt', 'bnb', 'sol', 'usdc', 'xrp', 'ada', 'doge', 'trx'];
    coins.forEach((coin) => {
      routes.push({
        url: `${APP_URL}/cheapest-withdrawal/${coin}`,
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: 0.8,
      });
    });

    // Inject blog posts
    const posts = getAllPosts();
    posts.forEach((post) => {
      routes.push({
        url: `${APP_URL}/blog/${post.slug}`,
        lastModified: new Date(post.date),
        changeFrequency: 'weekly',
        priority: 0.9,
      });
    });
  } catch (e) {
    console.error('Sitemap generation error (database might not be ready):', e);
  }

  return routes;
}
