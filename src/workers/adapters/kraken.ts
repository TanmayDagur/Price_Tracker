import WebSocket from 'ws';
import { ExchangeAdapter, PriceUpdate } from '../types';

export class KrakenAdapter implements ExchangeAdapter {
  name = 'kraken';
  private ws: WebSocket | null = null;
  private onPriceCallback: ((update: PriceUpdate) => void) | null = null;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private reconnectDelay = 1000;
  private maxReconnectDelay = 30000;
  private isIntentionalDisconnect = false;

  private symbols = ['BTC/USD', 'ETH/USD', 'SOL/USD', 'XRP/USD', 'DOGE/USD', 'USDC/USD'];

  async connect(): Promise<void> {
    this.isIntentionalDisconnect = false;
    const url = 'wss://ws.kraken.com/v2';
    
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(url);
      } catch (err) {
        return reject(err);
      }

      this.ws.on('open', () => {
        console.log('[Kraken] Connected');
        this.reconnectDelay = 1000;
        
        // Subscribe
        const subMsg = {
          method: 'subscribe',
          params: {
            channel: 'ticker',
            symbol: this.symbols
          }
        };
        this.ws?.send(JSON.stringify(subMsg));
        resolve();
      });

      this.ws.on('message', (data: WebSocket.RawData) => {
        try {
          const message = JSON.parse(data.toString());
          if (message.channel === 'ticker' && message.type === 'update' && Array.isArray(message.data)) {
            for (const ticker of message.data) {
              const symbolStr = ticker.symbol; // e.g., BTC/USD
              const [baseAsset, rawQuote] = symbolStr.split('/');
              const quoteAsset = rawQuote === 'USD' ? 'USDT' : rawQuote; // Normalize USD to USDT for internal consistency

              const bidPrice = parseFloat(ticker.bid);
              const askPrice = parseFloat(ticker.ask);
              const lastPrice = parseFloat(ticker.last);
              const volume24h = parseFloat(ticker.volume);

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
          console.error('[Kraken] Message parse error:', err);
        }
      });

      this.ws.on('error', (err) => {
        console.error('[Kraken] WebSocket error:', err);
        if (this.ws?.readyState !== WebSocket.OPEN) {
          reject(err);
        }
      });

      this.ws.on('close', () => {
        console.log('[Kraken] Disconnected');
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
    console.log(`[Kraken] Reconnecting in ${this.reconnectDelay}ms...`);
    this.reconnectTimer = setTimeout(() => {
      this.connect().catch(err => console.error('[Kraken] Reconnect failed:', err));
    }, this.reconnectDelay);
    
    this.reconnectDelay = Math.min(this.reconnectDelay * 2, this.maxReconnectDelay);
  }
}
