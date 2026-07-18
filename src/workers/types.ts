export interface PriceUpdate {
  exchange: string;      // exchange slug
  symbol: string;        // normalized: 'BTC/USDT'
  baseAsset: string;     // 'BTC'
  quoteAsset: string;    // 'USDT'
  bidPrice: number;
  askPrice: number;
  lastPrice: number;
  volume24h?: number;
  timestamp: Date;
}

export interface ExchangeAdapter {
  name: string;
  connect(): Promise<void>;
  disconnect(): void;
  onPrice(callback: (update: PriceUpdate) => void): void;
}
