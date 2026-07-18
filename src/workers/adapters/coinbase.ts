import WebSocket from 'ws';
import { ExchangeAdapter, PriceUpdate } from '../types';

export class CoinbaseAdapter implements ExchangeAdapter {
  name = 'coinbase';
  private ws: WebSocket | null = null;
  private onPriceCallback: ((update: PriceUpdate) => void) | null = null;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private reconnectDelay = 1000;
  private maxReconnectDelay = 30000;
  private isIntentionalDisconnect = false;

  private productIds = ['BTC-USD', 'ETH-USD', 'SOL-USD', 'XRP-USD', 'DOGE-USD', 'USDC-USD'];

  async connect(): Promise<void> {
    this.isIntentionalDisconnect = false;
    const url = 'wss://advanced-trade-ws.coinbase.com';
    
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(url);
      } catch (err) {
        return reject(err);
      }

      this.ws.on('open', () => {
        console.log('[Coinbase] Connected');
        this.reconnectDelay = 1000;
        
        const subMsg = {
          type: 'subscribe',
          channel: 'ticker_batch',
          product_ids: this.productIds
        };
        this.ws?.send(JSON.stringify(subMsg));
        resolve();
      });

      this.ws.on('message', (data: WebSocket.RawData) => {
        try {
          const message = JSON.parse(data.toString());
          if (message.type === 'ticker' || message.type === 'ticker_batch' || message.channel === 'ticker_batch') {
            const updates = message.events ? message.events.flatMap((e: any) => e.tickers) : [message];
            
            for (const ticker of updates) {
              if (!ticker || !ticker.product_id || !ticker.price) continue;
              
              const productId = ticker.product_id;
              const [baseAsset, rawQuote] = productId.split('-');
              const quoteAsset = rawQuote === 'USD' ? 'USDT' : rawQuote;

              const lastPrice = parseFloat(ticker.price);
              const volume24h = parseFloat(ticker.volume_24h || 0);
              
              const bidPrice = lastPrice * 0.9999;
              const askPrice = lastPrice * 1.0001;

              if (this.onPriceCallback) {
                this.onPriceCallback({
                  exchange: this.name,
                  symbol: `${baseAsset}/${quoteAsset}`,
                  baseAsset,
                  quoteAsset,
                  bidPrice,
                  askPrice,
                  lastPrice,
                  volume24h,
                  timestamp: new Date()
                });
              }
            }
          }
        } catch (err) {
          console.error('[Coinbase] Message parse error:', err);
        }
      });

      this.ws.on('error', (err) => {
        console.error('[Coinbase] WebSocket error:', err);
        if (this.ws?.readyState !== WebSocket.OPEN) {
          reject(err);
        }
      });

      this.ws.on('close', () => {
        console.log('[Coinbase] Disconnected');
        if (!this.isIntentionalDisconnect) {
          this.scheduleReconnect();
        }
      });
    });
  }

  disconnect(): void {
    this.isIntentionalDisconnect = true;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  onPrice(callback: (update: PriceUpdate) => void): void {
    this.onPriceCallback = callback;
  }

  private scheduleReconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }
    console.log(`[Coinbase] Reconnecting in ${this.reconnectDelay}ms...`);
    this.reconnectTimer = setTimeout(() => {
      this.connect().catch(err => console.error('[Coinbase] Reconnect failed:', err));
    }, this.reconnectDelay);
    
    this.reconnectDelay = Math.min(this.reconnectDelay * 2, this.maxReconnectDelay);
  }
}
