import WebSocket from 'ws';
import { ExchangeAdapter, PriceUpdate } from '../types';

export class BinanceAdapter implements ExchangeAdapter {
  name = 'binance';
  private ws: WebSocket | null = null;
  private onPriceCallback: ((update: PriceUpdate) => void) | null = null;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private reconnectDelay = 1000;
  private maxReconnectDelay = 30000;
  private isIntentionalDisconnect = false;

  private streams = [
    'btcusdt@miniTicker',
    'ethusdt@miniTicker',
    'solusdt@miniTicker',
    'xrpusdt@miniTicker',
    'dogeusdt@miniTicker',
    'usdcusdt@miniTicker',
  ];

  async connect(): Promise<void> {
    this.isIntentionalDisconnect = false;
    const url = `wss://stream.binance.com:9443/stream?streams=${this.streams.join('/')}`;
    
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(url);
      } catch (err) {
        return reject(err);
      }

      this.ws.on('open', () => {
        console.log('[Binance] Connected');
        this.reconnectDelay = 1000;
        resolve();
      });

      this.ws.on('message', (data: WebSocket.RawData) => {
        try {
          const message = JSON.parse(data.toString());
          if (message.stream && message.data && message.data.e === '24hrMiniTicker') {
            const ticker = message.data;
            const symbolStr = ticker.s; // e.g. BTCUSDT
            
            let baseAsset = '';
            let quoteAsset = '';
            if (symbolStr.endsWith('USDT')) {
              quoteAsset = 'USDT';
              baseAsset = symbolStr.slice(0, -4);
            } else if (symbolStr.endsWith('USDC')) {
              quoteAsset = 'USDC';
              baseAsset = symbolStr.slice(0, -4);
            } else {
              return;
            }
            
            const lastPrice = parseFloat(ticker.c);
            const volume24h = parseFloat(ticker.v);
            
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
                timestamp: new Date(ticker.E)
              });
            }
          }
        } catch (err) {
          console.error('[Binance] Message parse error:', err);
        }
      });

      this.ws.on('error', (err) => {
        console.error('[Binance] WebSocket error:', err);
        if (this.ws?.readyState !== WebSocket.OPEN) {
          reject(err);
        }
      });

      this.ws.on('close', () => {
        console.log('[Binance] Disconnected');
        if (!this.isIntentionalDisconnect) {
          this.scheduleReconnect();
        }
      });
      
      this.ws.on('ping', () => {
        this.ws?.pong();
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
    console.log(`[Binance] Reconnecting in ${this.reconnectDelay}ms...`);
    this.reconnectTimer = setTimeout(() => {
      this.connect().catch(err => console.error('[Binance] Reconnect failed:', err));
    }, this.reconnectDelay);
    
    this.reconnectDelay = Math.min(this.reconnectDelay * 2, this.maxReconnectDelay);
  }
}
