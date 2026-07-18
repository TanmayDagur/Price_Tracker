import WebSocket from 'ws';
import { ExchangeAdapter, PriceUpdate } from '../types';

export class BybitAdapter implements ExchangeAdapter {
  name = 'bybit';
  private ws: WebSocket | null = null;
  private onPriceCallback: ((update: PriceUpdate) => void) | null = null;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private pingTimer: NodeJS.Timeout | null = null;
  private reconnectDelay = 1000;
  private maxReconnectDelay = 30000;
  private isIntentionalDisconnect = false;

  private args = [
    'tickers.BTCUSDT',
    'tickers.ETHUSDT',
    'tickers.SOLUSDT',
    'tickers.XRPUSDT',
    'tickers.DOGEUSDT',
    'tickers.USDCUSDT'
  ];

  async connect(): Promise<void> {
    this.isIntentionalDisconnect = false;
    const url = 'wss://stream.bybit.com/v5/public/spot';
    
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(url);
      } catch (err) {
        return reject(err);
      }

      this.ws.on('open', () => {
        console.log('[Bybit] Connected');
        this.reconnectDelay = 1000;
        
        const subMsg = {
          op: 'subscribe',
          args: this.args
        };
        this.ws?.send(JSON.stringify(subMsg));
        
        this.startPing();
        resolve();
      });

      this.ws.on('message', (data: WebSocket.RawData) => {
        try {
          const message = JSON.parse(data.toString());
          
          if (message.op === 'pong') {
            return;
          }
          
          if (message.topic && message.topic.startsWith('tickers.') && message.data) {
            const ticker = message.data;
            const symbolStr = ticker.symbol; // e.g., BTCUSDT
            
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

            if (!ticker.lastPrice && !ticker.bid1Price && !ticker.ask1Price) return;
            
            const lastPrice = parseFloat(ticker.lastPrice || ticker.bid1Price || ticker.ask1Price);
            const bidPrice = parseFloat(ticker.bid1Price || lastPrice * 0.9999);
            const askPrice = parseFloat(ticker.ask1Price || lastPrice * 1.0001);
            const volume24h = parseFloat(ticker.volume24h || 0);

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
                timestamp: new Date(message.ts || Date.now())
              });
            }
          }
        } catch (err) {
          console.error('[Bybit] Message parse error:', err);
        }
      });

      this.ws.on('error', (err) => {
        console.error('[Bybit] WebSocket error:', err);
        if (this.ws?.readyState !== WebSocket.OPEN) {
          reject(err);
        }
      });

      this.ws.on('close', () => {
        console.log('[Bybit] Disconnected');
        this.stopPing();
        if (!this.isIntentionalDisconnect) {
          this.scheduleReconnect();
        }
      });
    });
  }

  private startPing() {
    this.stopPing();
    this.pingTimer = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ op: 'ping' }));
      }
    }, 20000); // 20s
  }

  private stopPing() {
    if (this.pingTimer) {
      clearInterval(this.pingTimer);
      this.pingTimer = null;
    }
  }

  disconnect(): void {
    this.isIntentionalDisconnect = true;
    this.stopPing();
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
    console.log(`[Bybit] Reconnecting in ${this.reconnectDelay}ms...`);
    this.reconnectTimer = setTimeout(() => {
      this.connect().catch(err => console.error('[Bybit] Reconnect failed:', err));
    }, this.reconnectDelay);
    
    this.reconnectDelay = Math.min(this.reconnectDelay * 2, this.maxReconnectDelay);
  }
}
