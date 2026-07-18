// ---------------------------------------------------------------------------
// JSON-LD Structured Data Generators
// ---------------------------------------------------------------------------
//
// These functions return plain objects suitable for serialisation into
// <script type="application/ld+json"> tags. They follow Schema.org vocabulary.
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Types (minimal shapes — we only need the fields used in the generators)
// ---------------------------------------------------------------------------

export interface ExchangeForStructuredData {
  name: string;
  slug: string;
  websiteUrl?: string | null;
  logoUrl?: string | null;
  description?: string | null;
}

export interface FAQItem {
  question: string;
  answer: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function baseUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL ?? 'https://cryptoarb.com';
}

// ---------------------------------------------------------------------------
// Comparison page — FinancialProduct[] + BreadcrumbList
// ---------------------------------------------------------------------------

export function generateComparisonStructuredData(
  exchange1: ExchangeForStructuredData,
  exchange2: ExchangeForStructuredData,
) {
  const financialProducts = [exchange1, exchange2].map((ex) => ({
    '@type': 'FinancialProduct',
    name: `${ex.name} Cryptocurrency Exchange`,
    description:
      ex.description ??
      `${ex.name} is a cryptocurrency exchange offering spot trading.`,
    url: ex.websiteUrl ?? `${baseUrl()}/exchange/${ex.slug}`,
    ...(ex.logoUrl ? { image: ex.logoUrl } : {}),
    provider: {
      '@type': 'Organization',
      name: ex.name,
      ...(ex.websiteUrl ? { url: ex.websiteUrl } : {}),
    },
    category: 'Cryptocurrency Exchange',
  }));

  const breadcrumbList = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: baseUrl(),
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Compare',
        item: `${baseUrl()}/compare`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: `${exchange1.name} vs ${exchange2.name}`,
        item: `${baseUrl()}/compare/${exchange1.slug}-vs-${exchange2.slug}`,
      },
    ],
  };

  return {
    '@context': 'https://schema.org',
    '@graph': [...financialProducts, breadcrumbList],
  };
}

// ---------------------------------------------------------------------------
// Exchange detail page — FinancialProduct + BreadcrumbList
// ---------------------------------------------------------------------------

export function generateExchangeStructuredData(
  exchange: ExchangeForStructuredData,
) {
  const financialProduct = {
    '@type': 'FinancialProduct',
    name: `${exchange.name} Cryptocurrency Exchange`,
    description:
      exchange.description ??
      `${exchange.name} is a cryptocurrency exchange offering spot trading, fee schedules, and withdrawal options.`,
    url: exchange.websiteUrl ?? `${baseUrl()}/exchange/${exchange.slug}`,
    ...(exchange.logoUrl ? { image: exchange.logoUrl } : {}),
    provider: {
      '@type': 'Organization',
      name: exchange.name,
      ...(exchange.websiteUrl ? { url: exchange.websiteUrl } : {}),
    },
    category: 'Cryptocurrency Exchange',
  };

  const breadcrumbList = {
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: baseUrl(),
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Exchanges',
        item: `${baseUrl()}/exchanges`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: exchange.name,
        item: `${baseUrl()}/exchange/${exchange.slug}`,
      },
    ],
  };

  return {
    '@context': 'https://schema.org',
    '@graph': [financialProduct, breadcrumbList],
  };
}

// ---------------------------------------------------------------------------
// FAQ structured data
// ---------------------------------------------------------------------------

/**
 * Generates FAQPage structured data from a list of questions and answers.
 *
 * @see https://developers.google.com/search/docs/appearance/structured-data/faqpage
 */
export function generateFAQStructuredData(questions: FAQItem[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: questions.map((q) => ({
      '@type': 'Question',
      name: q.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: q.answer,
      },
    })),
  };
}
