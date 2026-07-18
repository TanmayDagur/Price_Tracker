import WebSocket from 'ws';
import https from 'https';
import { ExchangeAdapter, PriceUpdate } from '../types';

export class KuCoinAdapter implements ExchangeAdapter {
  name = 'kucoin';
  private ws: WebSocket | null = null;
  private onPriceCallback: ((update: PriceUpdate) => void) | null = null;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private pingTimer: NodeJS.Timeout | null = null;
  private reconnectDelay = 1000;
  private maxReconnectDelay = 30000;
  private isIntentionalDisconnect = false;
  private pingIntervalId = 0;

  private symbols = ['BTC-USDT', 'ETH-USDT', 'SOL-USDT', 'XRP-USDT', 'DOGE-USDT', 'USDC-USDT'];

  async connect(): Promise<void> {
    this.isIntentionalDisconnect = false;
    
    try {
      const tokenData = await this.getPublicToken();
      const endpoint = tokenData.instanceServers[0].endpoint;
      const token = tokenData.token;
      const url = `${endpoint}?token=${token}`;
      
      return new Promise((resolve, reject) => {
        try {
          this.ws = new WebSocket(url);
        } catch (err) {
          return reject(err);
        }

        this.ws.on('open', () => {
          console.log('[KuCoin] Connected');
          this.reconnectDelay = 1000;
          
          const subMsg = {
            id: Date.now().toString(),
            type: 'subscribe',
            topic: `/market/ticker:${this.symbols.join(',')}`,
            privateChannel: false,
            response: true
          };
          this.ws?.send(JSON.stringify(subMsg));
          
          this.startPing();
          resolve();
        });

        this.ws.on('message', (data: WebSocket.RawData) => {
          try {
            const message = JSON.parse(data.toString());
            if (message.type === 'message' && message.subject === 'trade.ticker') {
              const symbolStr = message.topic.split(':')[1]; // e.g. BTC-USDT
              const [baseAsset, quoteAsset] = symbolStr.split('-');
              
              const ticker = message.data;
              const lastPrice = parseFloat(ticker.price);
              const bidPrice = parseFloat(ticker.bestBid);
              const askPrice = parseFloat(ticker.bestAsk);
              const volume24h = parseFloat(ticker.size || 0);

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
          } catch (err) {
            console.error('[KuCoin] Message parse error:', err);
          }
        });

        this.ws.on('error', (err) => {
          console.error('[KuCoin] WebSocket error:', err);
          if (this.ws?.readyState !== WebSocket.OPEN) {
            reject(err);
          }
        });

        this.ws.on('close', () => {
          console.log('[KuCoin] Disconnected');
          this.stopPing();
          if (!this.isIntentionalDisconnect) {
            this.scheduleReconnect();
          }
        });
      });
    } catch (err) {
      console.error('[KuCoin] Failed to get token or connect:', err);
      this.scheduleReconnect();
    }
  }

  private getPublicToken(): Promise<any> {
    return new Promise((resolve, reject) => {
      const options = {
        hostname: 'api.kucoin.com',
        port: 443,
        path: '/api/v1/bullet-public',
        method: 'POST'
      };
      
      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
          try {
            const parsed = JSON.parse(data);
            if (parsed.code === '200000') {
              resolve(parsed.data);
            } else {
              reject(new Error(`KuCoin API error: ${parsed.msg}`));
            }
          } catch (err) {
            reject(err);
          }
        });
      });
      
      req.on('error', reject);
      req.end();
    });
  }

  private startPing() {
    this.stopPing();
    this.pingTimer = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ id: Date.now().toString(), type: 'ping' }));
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
    console.log(`[KuCoin] Reconnecting in ${this.reconnectDelay}ms...`);
    this.reconnectTimer = setTimeout(() => {
      this.connect().catch(err => console.error('[KuCoin] Reconnect failed:', err));
    }, this.reconnectDelay);
    
    this.reconnectDelay = Math.min(this.reconnectDelay * 2, this.maxReconnectDelay);
  }
}
