import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get('symbol');
    if (!symbol) {
      return NextResponse.json({ error: 'Missing symbol' }, { status: 400 });
    }

    const [base, quote] = symbol.split('-');
    if (!base || !quote) {
      return NextResponse.json({ error: 'Invalid symbol format. Use BASE-QUOTE' }, { status: 400 });
    }

    const uppercaseBase = base.toUpperCase();
    const uppercaseQuote = quote.toUpperCase();
    const bSymbol = `${uppercaseBase}${uppercaseQuote}`;

    const fetchExchangePrice = async (exchangeSlug: string, fn: () => Promise<{ bidPrice: number; askPrice: number }>) => {
      try {
        const result = await fn();
        return {
          exchangeSlug,
          bidPrice: result.bidPrice,
          askPrice: result.askPrice,
          success: true,
        };
      } catch (err) {
        return {
          exchangeSlug,
          bidPrice: 0,
          askPrice: 0,
          success: false,
        };
      }
    };

    // Run fetches in parallel with timeouts
    const pricePromises = [
      // 1. Binance
      fetchExchangePrice('binance', async () => {
        const res = await fetch(`https://api.binance.com/api/v3/ticker/bookTicker?symbol=${bSymbol}`, {
          next: { revalidate: 0 },
          signal: AbortSignal.timeout(2000),
        });
        if (!res.ok) throw new Error('Binance error');
        const data = await res.json();
        return {
          bidPrice: parseFloat(data.bidPrice),
          askPrice: parseFloat(data.askPrice),
        };
      }),

      // 2. Bybit
      fetchExchangePrice('bybit', async () => {
        const res = await fetch(`https://api.bybit.com/v5/market/tickers?category=spot&symbol=${bSymbol}`, {
          next: { revalidate: 0 },
          signal: AbortSignal.timeout(2000),
        });
        if (!res.ok) throw new Error('Bybit error');
        const data = await res.json();
        const ticker = data.result?.list?.[0];
        if (!ticker) throw new Error('No Bybit ticker');
        return {
          bidPrice: parseFloat(ticker.bid1Price),
          askPrice: parseFloat(ticker.ask1Price),
        };
      }),

      // 3. KuCoin
      fetchExchangePrice('kucoin', async () => {
        const res = await fetch(`https://api.kucoin.com/api/v1/market/orderbook/level1?symbol=${uppercaseBase}-${uppercaseQuote}`, {
          next: { revalidate: 0 },
          signal: AbortSignal.timeout(2000),
        });
        if (!res.ok) throw new Error('KuCoin error');
        const data = await res.json();
        if (!data.data) throw new Error('No KuCoin data');
        return {
          bidPrice: parseFloat(data.data.bestBid),
          askPrice: parseFloat(data.data.bestAsk),
        };
      }),

      // 4. Coinbase
      fetchExchangePrice('coinbase', async () => {
        const res = await fetch(`https://api.exchange.coinbase.com/products/${uppercaseBase}-${uppercaseQuote}/ticker`, {
          headers: { 'User-Agent': 'NetCostArbitrageCalculator/1.0' },
          next: { revalidate: 0 },
          signal: AbortSignal.timeout(2000),
        });
        if (!res.ok) throw new Error('Coinbase error');
        const data = await res.json();
        return {
          bidPrice: parseFloat(data.bid),
          askPrice: parseFloat(data.ask),
        };
      }),

      // 5. Kraken
      fetchExchangePrice('kraken', async () => {
        const res = await fetch(`https://api.kraken.com/0/public/Ticker?pair=${bSymbol}`, {
          next: { revalidate: 0 },
          signal: AbortSignal.timeout(2000),
        });
        if (!res.ok) throw new Error('Kraken error');
        const data = await res.json();
        const pairsObj = data.result;
        if (!pairsObj) throw new Error('No Kraken data');
        const firstKey = Object.keys(pairsObj)[0];
        const ticker = pairsObj[firstKey];
        if (!ticker) throw new Error('No Kraken ticker');
        return {
          bidPrice: parseFloat(ticker.b[0]),
          askPrice: parseFloat(ticker.a[0]),
        };
      }),
    ];

    const priceResults = await Promise.all(pricePromises);
    const successfulPrices = priceResults.filter(p => p.success);

    return NextResponse.json({ prices: successfulPrices });
  } catch (error: any) {
    console.error('Error in GET /api/prices:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
