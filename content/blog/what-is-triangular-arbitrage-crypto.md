---
title: "What Is Triangular Arbitrage in Crypto? Explained With Examples"
description: "Learn what triangular arbitrage is, how it works in cryptocurrency markets, and whether it is a viable strategy for profit in 2026."
date: "2026-07-05"
author: "Net-Cost Arbitrage Team"
tags: ["Triangular Arbitrage", "Trading Strategy", "Education", "Crypto"]
---

Triangular arbitrage is a more complex form of arbitrage that exploits price inefficiencies between three different trading pairs on a **single exchange**. Unlike cross-exchange arbitrage, you do not need to transfer funds between platforms.

## How It Works

Imagine three pairs on Binance: BTC/USDT, ETH/BTC, and ETH/USDT. A triangular arbitrage opportunity exists when the implied price of ETH through BTC does not match the direct ETH/USDT price.

### Example:
1. **Start with $10,000 USDT**
2. Buy BTC with USDT at $67,500 → You get 0.1481 BTC
3. Buy ETH with BTC at 0.053 BTC per ETH → You get 2.794 ETH
4. Sell ETH for USDT at $3,590 → You get $10,030.46

**Profit: $30.46 (0.30%)** before trading fees.

## The Reality Check

In practice, triangular arbitrage is extremely difficult for manual traders:

- **Speed required:** Opportunities last milliseconds, not minutes
- **Three fees:** You pay taker fees on all three trades (3 × 0.1% = 0.3%)
- **Slippage:** Each trade has slippage, compounding across three orders
- **Competition:** Professional bots monitor these opportunities 24/7

After three rounds of taker fees at 0.1%, your 0.30% gross profit becomes approximately **0.00%** — breakeven at best.

## Is It Worth Trying?

For most retail traders, **no**. Triangular arbitrage requires:

- Custom bot software with sub-millisecond execution
- Direct API access with low latency
- Significant capital to make tiny percentages worthwhile
- Deep understanding of order book dynamics

## Better Alternatives

For most traders, **cross-exchange arbitrage** (buying on one exchange, selling on another) is more practical:

- Opportunities last minutes, not milliseconds
- Only two trades required (two fees instead of three)
- Can be executed manually with practice
- Our [Net-Cost Calculator](/) shows these opportunities in real-time

## When Triangular Arbitrage Works

There are niche scenarios where triangular arbitrage can work:

- On smaller exchanges with less competition from bots
- During extreme market volatility when pricing dislocates
- With maker orders (limit orders) to reduce fees
- When combined with zero-fee promotions

## Learn More

If you are interested in the more practical form of cross-exchange arbitrage, check out our [Step-by-Step Beginner Guide](/blog/first-cross-exchange-arbitrage-trade-guide) to get started.
