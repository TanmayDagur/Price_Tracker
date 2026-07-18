import type { Metadata } from 'next';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const APP_NAME = 'CryptoArb Calculator';
const currentYear = new Date().getFullYear();

function baseUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL ?? 'https://cryptoarb.com';
}

// ---------------------------------------------------------------------------
// Compare page — e.g. Binance vs Coinbase
// ---------------------------------------------------------------------------

export function getCompareMetadata(
  exchange1Name: string,
  exchange2Name: string,
  slug: string,
): Metadata {
  const title = `${exchange1Name} vs ${exchange2Name} Fees & Arbitrage Comparison ${currentYear} | ${APP_NAME}`;
  const description =
    `Compare ${exchange1Name} and ${exchange2Name} trading fees, withdrawal costs, and live arbitrage opportunities side-by-side. ` +
    `Updated ${currentYear} data with net-profit calculations.`;

  return {
    title,
    description,
    alternates: {
      canonical: `${baseUrl()}/compare/${slug}`,
    },
    openGraph: {
      title,
      description,
      url: `${baseUrl()}/compare/${slug}`,
      siteName: APP_NAME,
      type: 'website',
    },
  };
}

// ---------------------------------------------------------------------------
// Cheapest withdrawal page — e.g. "Cheapest way to withdraw Bitcoin"
// ---------------------------------------------------------------------------

export function getCheapestWithdrawalMetadata(
  coinName: string,
  coinSlug: string,
): Metadata {
  const title = `Cheapest ${coinName} Withdrawal Fees by Exchange ${currentYear} | ${APP_NAME}`;
  const description =
    `Find the cheapest way to withdraw ${coinName} in ${currentYear}. ` +
    `Compare withdrawal fees across all major exchanges and blockchain networks, ranked by cost.`;

  return {
    title,
    description,
    alternates: {
      canonical: `${baseUrl()}/cheapest-withdrawal/${coinSlug}`,
    },
    openGraph: {
      title,
      description,
      url: `${baseUrl()}/cheapest-withdrawal/${coinSlug}`,
      siteName: APP_NAME,
      type: 'website',
    },
  };
}

// ---------------------------------------------------------------------------
// Exchange detail page
// ---------------------------------------------------------------------------

export function getExchangeMetadata(
  exchangeName: string,
  exchangeSlug: string,
): Metadata {
  const title = `${exchangeName} Fees, Withdrawal Costs & Arbitrage ${currentYear} | ${APP_NAME}`;
  const description =
    `Complete ${exchangeName} fee schedule for ${currentYear}: trading fees (maker/taker), withdrawal costs by network, ` +
    `and live arbitrage opportunities against other exchanges.`;

  return {
    title,
    description,
    alternates: {
      canonical: `${baseUrl()}/exchange/${exchangeSlug}`,
    },
    openGraph: {
      title,
      description,
      url: `${baseUrl()}/exchange/${exchangeSlug}`,
      siteName: APP_NAME,
      type: 'website',
    },
  };
}

// ---------------------------------------------------------------------------
// Arbitrage pair page — e.g. BTC/USDT arbitrage
// ---------------------------------------------------------------------------

export function getArbitrageMetadata(
  base: string,
  quote: string,
  pair: string,
): Metadata {
  const title = `${base}/${quote} Crypto Arbitrage Opportunities ${currentYear} | ${APP_NAME}`;
  const description =
    `Live ${base}/${quote} arbitrage opportunities across exchanges. ` +
    `See net profits after all fees (trading + withdrawal) for the ${pair} pair, updated in real time.`;

  return {
    title,
    description,
    alternates: {
      canonical: `${baseUrl()}/arbitrage/${pair.toLowerCase()}`,
    },
    openGraph: {
      title,
      description,
      url: `${baseUrl()}/arbitrage/${pair.toLowerCase()}`,
      siteName: APP_NAME,
      type: 'website',
    },
  };
}
