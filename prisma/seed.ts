import { prisma } from '../src/lib/prisma';

async function main() {
  console.log('Seeding database...');

  // 1. Seed 50 Exchanges
  const exchangesData = [
    { name: 'Binance', slug: 'binance', url: 'https://www.binance.com' },
    { name: 'Kraken', slug: 'kraken', url: 'https://www.kraken.com' },
    { name: 'Coinbase', slug: 'coinbase', url: 'https://www.coinbase.com' },
    { name: 'KuCoin', slug: 'kucoin', url: 'https://www.kucoin.com' },
    { name: 'Bybit', slug: 'bybit', url: 'https://www.bybit.com' },
    { name: 'OKX', slug: 'okx', url: 'https://www.okx.com' },
    { name: 'Gate.io', slug: 'gate', url: 'https://www.gate.io' },
    { name: 'Bitfinex', slug: 'bitfinex', url: 'https://www.bitfinex.com' },
    { name: 'HTX', slug: 'htx', url: 'https://www.htx.com' },
    { name: 'MEXC', slug: 'mexc', url: 'https://www.mexc.com' },
    { name: 'Bitget', slug: 'bitget', url: 'https://www.bitget.com' },
    { name: 'Crypto.com', slug: 'cryptocom', url: 'https://www.crypto.com' },
    { name: 'Gemini', slug: 'gemini', url: 'https://www.gemini.com' },
    { name: 'LBank', slug: 'lbank', url: 'https://www.lbank.com' },
    { name: 'WhiteBIT', slug: 'whitebit', url: 'https://www.whitebit.com' },
    { name: 'Upbit', slug: 'upbit', url: 'https://www.upbit.com' },
    { name: 'Bithumb', slug: 'bithumb', url: 'https://www.bithumb.com' },
    { name: 'Coinone', slug: 'coinone', url: 'https://www.coinone.co.kr' },
    { name: 'Korbit', slug: 'korbit', url: 'https://www.korbit.co.kr' },
    { name: 'BitFlyer', slug: 'bitflyer', url: 'https://www.bitflyer.com' },
    { name: 'Bitstamp', slug: 'bitstamp', url: 'https://www.bitstamp.net' },
    { name: 'Poloniex', slug: 'poloniex', url: 'https://www.poloniex.com' },
    { name: 'Coincheck', slug: 'coincheck', url: 'https://www.coincheck.com' },
    { name: 'BTSE', slug: 'btse', url: 'https://www.btse.com' },
    { name: 'WazirX', slug: 'wazirx', url: 'https://www.wazirx.com' },
    { name: 'CoinEx', slug: 'coinex', url: 'https://www.coinex.com' },
    { name: 'Indodax', slug: 'indodax', url: 'https://www.indodax.com' },
    { name: 'Coinhako', slug: 'coinhako', url: 'https://www.coinhako.com' },
    { name: 'Phemex', slug: 'phemex', url: 'https://www.phemex.com' },
    { name: 'Bitso', slug: 'bitso', url: 'https://www.bitso.com' },
    { name: 'Mercado Bitcoin', slug: 'mercadobitcoin', url: 'https://www.mercadobitcoin.com.br' },
    { name: 'Bitvavo', slug: 'bitvavo', url: 'https://www.bitvavo.com' },
    { name: 'Coinmate', slug: 'coinmate', url: 'https://www.coinmate.io' },
    { name: 'Coinmetro', slug: 'coinmetro', url: 'https://www.coinmetro.com' },
    { name: 'Independent Reserve', slug: 'independentreserve', url: 'https://www.independentreserve.com' },
    { name: 'BTC Markets', slug: 'btcmarkets', url: 'https://www.btcmarkets.net' },
    { name: 'BitTrade', slug: 'bittrade', url: 'https://www.bittrade.co.jp' },
    { name: 'FMFW.io', slug: 'fmfw', url: 'https://www.fmfw.io' },
    { name: 'ProBit Global', slug: 'probit', url: 'https://www.probit.com' },
    { name: 'HitBTC', slug: 'hitbtc', url: 'https://www.hitbtc.com' },
    { name: 'AscendEX', slug: 'ascendex', url: 'https://www.ascendex.com' },
    { name: 'Latoken', slug: 'latoken', url: 'https://www.latoken.com' },
    { name: 'DigiFinex', slug: 'digifinex', url: 'https://www.digifinex.com' },
    { name: 'XT.COM', slug: 'xt', url: 'https://www.xt.com' },
    { name: 'BingX', slug: 'bingx', url: 'https://www.bingx.com' },
    { name: 'WOOTRADE', slug: 'woo', url: 'https://www.woo.org' },
    { name: 'dYdX', slug: 'dydx', url: 'https://www.dydx.exchange' },
    { name: 'Apex Pro', slug: 'apex', url: 'https://www.apex.exchange' },
    { name: 'Hyperliquid', slug: 'hyperliquid', url: 'https://www.hyperliquid.xyz' },
    { name: 'Jupiter Exchange', slug: 'jupiter', url: 'https://jup.ag' },
  ];

  for (const ex of exchangesData) {
    await prisma.exchange.upsert({
      where: { slug: ex.slug },
      update: {},
      create: ex,
    });
  }

  const exchanges = await prisma.exchange.findMany();
  const getExchange = (slug: string) => exchanges.find(e => e.slug === slug)!;

  // 2. Seed Networks
  const networksData = [
    { name: 'Ethereum (ERC-20)', slug: 'erc20' },
    { name: 'Tron (TRC-20)', slug: 'trc20' },
    { name: 'BNB Smart Chain (BEP-20)', slug: 'bsc' },
    { name: 'Solana', slug: 'solana' },
    { name: 'Polygon', slug: 'polygon' },
    { name: 'Arbitrum One', slug: 'arbitrum' },
    { name: 'Bitcoin Network', slug: 'btc' },
  ];

  for (const net of networksData) {
    await prisma.network.upsert({
      where: { slug: net.slug },
      update: {},
      create: net,
    });
  }

  const networks = await prisma.network.findMany();
  const getNetwork = (slug: string) => networks.find(n => n.slug === slug)!;

  // 3. Seed Standard Fee Tiers (Realistically mapped for all 50 exchanges)
  for (const ex of exchanges) {
    const seed = ex.name.charCodeAt(0) + ex.name.charCodeAt(ex.name.length - 1);
    const makerFee = parseFloat((0.08 + (seed % 10) / 100).toFixed(2));
    const takerFee = parseFloat((makerFee + 0.05 + (seed % 5) / 100).toFixed(2));

    await prisma.feeTier.upsert({
      where: { exchangeId_tierName: { exchangeId: ex.id, tierName: 'Standard' } },
      update: { makerFee, takerFee },
      create: {
        exchangeId: ex.id,
        tierName: 'Standard',
        makerFee,
        takerFee,
        minVolume: 0,
      },
    });
  }

  // 4. Seed Trading Pairs (All 12 assets pegged to USDT)
  const pairsData = [
    { symbol: 'BTC-USDT', baseAsset: 'BTC', quoteAsset: 'USDT' },
    { symbol: 'ETH-USDT', baseAsset: 'ETH', quoteAsset: 'USDT' },
    { symbol: 'SOL-USDT', baseAsset: 'SOL', quoteAsset: 'USDT' },
    { symbol: 'ADA-USDT', baseAsset: 'ADA', quoteAsset: 'USDT' },
    { symbol: 'DOGE-USDT', baseAsset: 'DOGE', quoteAsset: 'USDT' },
    { symbol: 'XRP-USDT', baseAsset: 'XRP', quoteAsset: 'USDT' },
    { symbol: 'DOT-USDT', baseAsset: 'DOT', quoteAsset: 'USDT' },
    { symbol: 'LINK-USDT', baseAsset: 'LINK', quoteAsset: 'USDT' },
    { symbol: 'MATIC-USDT', baseAsset: 'MATIC', quoteAsset: 'USDT' },
    { symbol: 'TRX-USDT', baseAsset: 'TRX', quoteAsset: 'USDT' },
    { symbol: 'USDC-USDT', baseAsset: 'USDC', quoteAsset: 'USDT' },
  ];

  for (const pair of pairsData) {
    await prisma.tradingPair.upsert({
      where: { symbol: pair.symbol },
      update: {},
      create: pair,
    });
  }

  // 5. Seed Withdrawal Fees (Programmatically generated realistically across 50 exchanges and 12 assets)
  const coinsBaseData = [
    { asset: 'BTC', network: 'btc', fee: 0.00025, min: 0.001 },
    { asset: 'ETH', network: 'erc20', fee: 0.0015, min: 0.005 },
    { asset: 'USDT', network: 'trc20', fee: 1.0, min: 10.0 },
    { asset: 'USDC', network: 'solana', fee: 1.0, min: 10.0 },
    { asset: 'SOL', network: 'solana', fee: 0.01, min: 0.05 },
    { asset: 'ADA', network: 'bsc', fee: 1.0, min: 2.0 },
    { asset: 'DOGE', network: 'bsc', fee: 5.0, min: 10.0 },
    { asset: 'XRP', network: 'bsc', fee: 0.25, min: 1.0 },
    { asset: 'DOT', network: 'bsc', fee: 0.1, min: 0.5 },
    { asset: 'LINK', network: 'bsc', fee: 0.5, min: 1.0 },
    { asset: 'MATIC', network: 'polygon', fee: 5.0, min: 10.0 },
    { asset: 'TRX', network: 'trc20', fee: 2.0, min: 5.0 },
  ];

  for (const coin of coinsBaseData) {
    const net = getNetwork(coin.network);
    
    for (const ex of exchanges) {
      const seed = ex.name.charCodeAt(0) + coin.asset.charCodeAt(0);
      const feeVariance = 1 + ((seed % 20) - 10) / 100; // -10% to +10% fee variance
      const finalFee = parseFloat((coin.fee * feeVariance).toFixed(6));
      const finalMin = parseFloat((coin.min * feeVariance).toFixed(4));

      await prisma.withdrawalFee.upsert({
        where: {
          exchangeId_networkId_asset: {
            exchangeId: ex.id,
            networkId: net.id,
            asset: coin.asset,
          }
        },
        update: { fee: finalFee, minWithdrawal: finalMin },
        create: {
          exchangeId: ex.id,
          networkId: net.id,
          asset: coin.asset,
          fee: finalFee,
          minWithdrawal: finalMin,
        },
      });
    }
  }

  console.log('Database seeded successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
