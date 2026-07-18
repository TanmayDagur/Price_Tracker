import './globals.css';
import { Inter } from 'next/font/google';
import { ThemeProvider } from '../components/ThemeProvider';
import ThemeToggle from '../components/ThemeToggle';

const inter = Inter({ subsets: ['latin'], variable: '--font-primary' });

export const metadata: import('next').Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://price-tracker-tb8j.vercel.app'),
  title: {
    default: 'Crypto Net-Cost Arbitrage & Fee Calculator',
    template: '%s | Net-Cost Arbitrage'
  },
  description: 'Calculate True Net Profit margins for crypto arbitrage by factoring in live prices, maker/taker fees, and withdrawal gas fees across major exchanges.',
  openGraph: {
    title: 'Crypto Net-Cost Arbitrage & Fee Calculator',
    description: 'Calculate True Net Profit margins for crypto arbitrage by factoring in live prices, maker/taker fees, and withdrawal gas fees across major exchanges.',
    url: '/',
    siteName: 'Net-Cost Arbitrage',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Crypto Net-Cost Arbitrage & Fee Calculator',
    description: 'Calculate True Net Profit margins for crypto arbitrage by factoring in live prices, maker/taker fees, and withdrawal gas fees.',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              "name": "Net-Cost Arbitrage",
              "url": process.env.NEXT_PUBLIC_APP_URL || 'https://price-tracker-tb8j.vercel.app',
              "potentialAction": {
                "@type": "SearchAction",
                "target": `${process.env.NEXT_PUBLIC_APP_URL || 'https://price-tracker-tb8j.vercel.app'}/search?q={search_term_string}`,
                "query-input": "required name=search_term_string"
              }
            })
          }}
        />
      </head>
      <body>
        <ThemeProvider>
          <header className="header">
            <div className="header__inner">
              <a href="/" className="header__logo">
                <div className="header__logo-icon">▲</div>
                Net-Cost Arbitrage
              </a>
              <nav className="header__nav">
                <a href="/arbitrage" className="header__nav-link">Arbitrage Pairs</a>
                <a href="/cheapest-withdrawal" className="header__nav-link">Withdrawal Fees</a>
                <a href="/compare" className="header__nav-link">Compare Exchanges</a>
                <a href="/blog" className="header__nav-link">Blog</a>
                <ThemeToggle />
              </nav>
          </div>
        </header>
        <main className="container">
          {children}
        </main>
        <footer className="footer">
          <div className="footer__inner">
            <div className="footer__grid">
              <div className="footer__brand">
                <div className="footer__brand-name">Net-Cost Arbitrage</div>
                <div className="footer__brand-desc">
                  Programmatic SEO platform calculating true net profit margins by factoring in live prices and withdrawal fees.
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
                <div style={{ fontWeight: 'bold', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-secondary)', marginBottom: '8px' }}>Platform</div>
                <a href="/arbitrage" style={{ fontSize: '0.85rem', color: 'var(--text-tertiary)', textDecoration: 'none' }}>Arbitrage Pairs</a>
                <a href="/cheapest-withdrawal" style={{ fontSize: '0.85rem', color: 'var(--text-tertiary)', textDecoration: 'none' }}>Withdrawal Fees</a>
                <a href="/compare" style={{ fontSize: '0.85rem', color: 'var(--text-tertiary)', textDecoration: 'none' }}>Compare Exchanges</a>
                <a href="/blog" style={{ fontSize: '0.85rem', color: 'var(--text-tertiary)', textDecoration: 'none' }}>Blog</a>
              </div>
            </div>
            <div className="footer__bottom">
              &copy; {new Date().getFullYear()} Net-Cost Arbitrage Calculator. All rights reserved.
            </div>
          </div>
        </footer>
        </ThemeProvider>
      </body>
    </html>
  );
}
